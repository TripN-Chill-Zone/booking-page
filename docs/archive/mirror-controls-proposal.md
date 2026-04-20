# Offer Bar Rebuild — Mirror Controls Proposal

**Date:** 2026-04-17
**Author:** Session 11 Claude
**Status:** Proposal — pending adversarial review
**Supersedes:** The "move" approach implemented in Session 11's first attempt (commits `14d6570` through `753a036`)
**Context:** Read `offer-bar-rebuild-plan.md` and `card-rebuild-proposal-review.md` for the original plan and the reasoning that led to it.

---

## 1. What was attempted

Session 11 implemented the 14-step offer-bar rebuild plan from `offer-bar-rebuild-plan.md`. The plan called for:

1. Creating a new `.tnh-offer-bar` container with our own markup
2. **Moving** Beds24's `.b24-multipricebox` (containing the `<select>` qty dropdown, from-price div, and per-occupancy boxes) into our container using `appendChild`
3. Hiding the original `.b24-offer-select` with `display: none`
4. Styling our container and the moved Beds24 elements to match the mockup

The rationale for moving rather than cloning was sound: jQuery event handlers are stored via expando properties on the element itself, so `appendChild` preserves them while `cloneNode` does not. This was verified in the Session 10 event-listener audit.

**What shipped:** JS dropped from 588 to 394 lines. CSS dropped from 472 to 382 lines. `!important` count dropped from 243 to 144. The code is cleaner, the state machine works (3 states detected correctly), price extraction works, Book button handlers work, form submission works. Sort order is correct. Unavailable state renders correctly.

## 2. What went wrong

Two persistent visual bugs survived every iteration:

### 2.1 Tag/thumbnail overlap (room card grid)

The room tags (`.tnh-room-tags`) are injected into `.b24-room-desc` which sits in grid column 2 of the room card's CSS Grid layout. On every desktop viewport width tested by the user, the tags are visually overlapped by the thumbnail image in column 1. This was present before the rebuild (it's a pre-existing issue with the grid layout) and the rebuild didn't improve it.

**Root cause (suspected):** Beds24's Style panel injects inline `<style>` blocks that load after our external CSS. At equal specificity, these win. If any of those rules set `display`, `width`, `padding`, or `float` on `.b24panel`, `.panel-body`, or Bootstrap grid classes, they could break our `display: grid` declaration. Since the grid is the foundation of the entire card layout (thumbnail col 1, desc col 2, offer full-width row 3), any interference collapses everything.

We could not confirm this from MCP tabs because `window.innerWidth = 0` in MCP tabs triggers the mobile media query (`max-width: 767px`), making desktop layout inspection impossible. The user confirmed the issue persists at all viewport widths in the actual browser.

### 2.2 Offer bar controls not right-aligned

The `.tnh-offer-controls` div has `margin-left: auto` to push it to the right side of the flex parent `.tnh-offer-bar`. On every test, the controls cluster immediately after the price text instead of pushing right. The Book button only appears right-aligned after a qty is selected and the total price element becomes visible — suggesting the total price element's width is what's pushing the button, not the `margin-left: auto`.

**Root cause (suspected):** The moved `.b24-multipricebox` brings Bootstrap classes (`pull-right`, `form-control`, `form-inline`) and Beds24 classes into our `.tnh-offer-controls`. These inject competing `float`, `width`, `display`, and `margin` rules. We override some with `!important`, but the cascade is fragile — any rule we miss or any Beds24 style injection we don't account for breaks the layout. The number of `!important` overrides needed to style the moved Beds24 markup currently stands at 8 rules (lines 162-193 of CSS-base.css), and it's still not enough.

### 2.3 Why iterative CSS fixes didn't work

Session 11 made 6 commits trying to fix these issues. Each fix addressed a specific CSS rule without being able to verify the result (MCP tab zero-width limitation). The fixes included: changing selectors to match the actual DOM nesting (`offer > div > .row`), adding `overflow: hidden` to the slider row, adding `margin-left: auto` with `!important`, stripping `!important` from our own elements. None resolved the visual issues because they were treating symptoms of the same root cause: **we're styling Beds24's markup inside our containers, and losing the specificity war**.

## 3. The pattern that works vs. the pattern that doesn't

The rebuild already has a working example of the correct pattern: **price display**.

The `.tnh-offer-price` div is our own element. We read the price from Beds24's from-div spans (`.bookingpagedollars`, `.bookingpagecents`), format it as "from €31.00 / night", and set it as the text content of our div. The original from-div is hidden inside `.b24-offer-select` (which is `display: none`). No Beds24 markup enters our container. No specificity battles. The price displays correctly on every test.

The `.tnh-book-btn` button is also our own element. It works perfectly — styled without `!important`, positioned correctly, click handler fires reliably.

The pattern that fails is `movePriceBoxInto()` — physically moving `.b24-multipricebox` into our `.tnh-offer-controls`. This brings Beds24's DOM subtree (with Bootstrap classes, Beds24 classes, and potentially targeted by Beds24's injected inline styles) into our clean container.

## 4. Proposed solution: mirror controls

**Replace `movePriceBoxInto()` with a mirror-select pattern.** Instead of moving Beds24's `<select>` element, we:

1. Create our own `<select>` element inside `.tnh-offer-controls`
2. Copy the options from Beds24's hidden `<select>` into ours
3. When the user changes our select, set the same value on Beds24's hidden select and dispatch a `change` event
4. Beds24's jQuery handlers fire on their hidden element, update internal state
5. On the next `applyFixes()` cycle (triggered by the MutationObserver seeing Beds24's DOM changes), we re-read the updated state and re-render our display

### 4.1 What changes

**JS (`movePriceBoxInto`)** — replaced by `createMirrorSelect(bar, offer)`:
```
createMirrorSelect(bar, offer):
  Find Beds24's qty select (select[id^="sr1-"]) or hidden input
  If already mirrored (bar.dataset.tnhMirrored), return
  Create our own <select> with same options
  On our select's change:
    Set Beds24's select to same value
    Dispatch 'change' event on Beds24's select (bubbles: true)
  Append our select to .tnh-offer-controls
  Mark bar.dataset.tnhMirrored = 'true'
```

**JS (`handleDormControls`)** — simplified:
```
createDormMirrorSelect(bar, offer):
  Find Beds24's guest select (select[id^="naa"])
  Create our own <select> with same options (relabeled Bed/Beds)
  On our select's change:
    Set Beds24's guest select to same value
    Dispatch 'change' event on Beds24's guest select
  Append our select to .tnh-offer-controls (with "Beds" label)
```

**CSS** — delete all `.tnh-offer-controls .b24-multipricebox` rules (lines 162-193). No Beds24 elements exist inside our containers anymore. The only Beds24 elements we style are the hidden ones inside `.b24-offer-select` (which is `display: none` anyway) and the form selects themselves (which we style with `!important` as a safety net, but they're now hidden).

### 4.2 What doesn't change

- **State machine** (`detectOfferState`) — reads from Beds24's DOM, no change needed
- **Price display** (`extractPriceData`, `formatPrice`, `readLiveTotal`) — already uses the read-from-Beds24 pattern
- **Book button** (`attachBookHandler`) — already writes to Beds24's hidden elements and submits the form
- **Bar structure** (`getOrCreateOfferBar`, `buildOfferBar`) — creates our own markup, no change needed
- **Unavailable state** (`renderOfferBar` unavailable branch) — our own markup, no change
- **Room card grid** (thumbnail + desc + tags layout) — separate issue, addressed in §5
- **Sections 1, 5, 7, 8** — untouched

### 4.3 Sync correctness

**Q: How do we know Beds24's handlers fire on the hidden select?**

The Session 10 event-listener audit verified that jQuery handlers survive DOM moves and fire on hidden elements. The current code already does this for the Book button: it sets values on Beds24's selects and dispatches `change` events, and the form submits correctly. The mirror approach uses the exact same mechanism — set value, dispatch `change`. The only difference is that we do it on every user interaction with our select, not just on Book click.

**Q: Does `display: none` on the parent prevent change events from firing?**

No. `display: none` prevents rendering but not JavaScript event dispatch. jQuery's `.trigger()` and native `dispatchEvent()` both work on hidden elements. The current Book button handler already relies on this: it sets values on selects inside the hidden `.b24-offer-select` and dispatches change events that Beds24 processes correctly. This is also the mechanism that was tested during the Session 10 panel-body hide experiment.

**Q: What about the MutationObserver feedback loop?**

When we dispatch `change` on Beds24's hidden select, Beds24's handler will mutate the DOM (toggle `.hidden` on the from-div, update price spans). The MutationObserver will fire. The `isModifying` guard prevents re-entry during the 500ms cooldown. After cooldown, `applyFixes()` runs, `rebuildOfferBars()` re-renders with the new state. This is the same flow as today — no change to the observer pattern.

**Q: What if Beds24 updates the options in the hidden select (e.g., on a re-render)?**

Since the iframe reloads entirely on every date change (Check A answer: A1), there are no in-iframe re-renders. On reload, the helper runs fresh, finds no existing mirror (the bar doesn't exist yet), and creates a new one from the new options. This is simpler than the current approach, which has to check if the moved pricebox is still a descendant of controls after a re-render.

### 4.4 What we lose

**Direct DOM connection.** Currently, because the real `<select>` is moved into our bar, its visual state is always in sync — if Beds24's handler adds a CSS class to it, we see it. With mirroring, visual changes to the hidden select are invisible. In practice, this doesn't matter: Beds24's handlers toggle `.hidden` on the from-div and update price spans, neither of which affects the select's visual appearance. The select itself only changes via `value` assignment, which we control.

**The "one source of truth" simplicity.** With the move approach, there's one select. With mirroring, there are two — ours (visible) and Beds24's (hidden). If they get out of sync, the form would submit the wrong value. Mitigation: the sync is one-directional (our select → Beds24's select) and happens synchronously in the change handler. There's no async gap where they can diverge, except for the Book button's auto-set-to-1 logic, which writes directly to Beds24's select — this already works and doesn't need to touch our mirror (the display will update on the next `applyFixes` cycle, which happens within 300ms via the observer).

## 5. Room card tag/thumbnail overlap

This is a separate issue from the offer bar, but it has a similar root cause: we're fighting Beds24/Bootstrap specificity for control of the grid layout.

### 5.1 Current approach (fighting)

We set `display: grid` on `.b24panel-room > .b24panel` and assign grid rows/columns to the slider row, desc row, and offer. This works in the mockup (one CSS source) but fails on the live page (multiple competing CSS sources).

### 5.2 What the reviewer should know

This proposal does **not** address the tag/thumbnail overlap. The room card grid layout (thumbnail, description, tags) is outside the offer-bar scope. However, the same principle applies: if we can't win the specificity war on the grid, we could extract the values (room name, description text, photo URL) and render them in our own markup too. That would be a larger scope change — essentially the full card rebuild that was descoped in the adversarial review. The current proposal limits scope to the offer bar only, consistent with the original plan.

If the reviewer believes the tag/thumbnail issue must be fixed in the same pass, the proposal can be extended. But the offer bar fix is independent and should not be blocked on the card layout fix.

## 6. Implementation plan

### Step 1 — Replace `movePriceBoxInto` with `createMirrorSelect`

Create our own `<select>` by copying options from Beds24's hidden select. Add change listener that syncs to Beds24's select. Remove all `.b24-multipricebox` move logic.

**Acceptance:**
- Our select appears in the offer bar with the same options as Beds24's
- Changing our select changes Beds24's hidden select value
- Beds24's jQuery change handler fires (verify by checking `.hidden` toggle on from-div)
- No Beds24 markup inside `.tnh-offer-controls`

### Step 2 — Replace `handleDormControls` with `createDormMirrorSelect`

Same pattern for the dorm guest select. Create our own select with relabeled options (Bed/Beds). Sync to Beds24's hidden guest select.

**Acceptance:**
- Dorm offer bar shows "Beds" label + our guest dropdown
- Changing beds updates Beds24's hidden guest select
- Book button submits correctly with the selected bed count

### Step 3 — Delete dead CSS

Remove all `.tnh-offer-controls .b24-multipricebox` rules, `.tnh-offer-controls .roomofferqtyselectlabel` rule, `.tnh-offer-controls select[id^="naa"]` force-show rule, and the `select[id^="sr1-"]` / `select[id^="naa"]` styling rules. Our mirror selects get their styling from our own CSS classes — no `!important` needed.

**Acceptance:**
- No `!important` declarations targeting elements inside `.tnh-offer-controls`
- Offer bar visually matches mockup v13
- Book button right-aligned on desktop

### Step 4 — Smoke test

Same matrix as the original plan Step 13. All scenarios should pass since the form submission mechanism is unchanged.

### Step 5 — Commit and push

## 7. Risk assessment

| Risk | Severity | Mitigation |
|---|---|---|
| Mirror select gets out of sync with Beds24's select | Medium | Sync is synchronous in change handler; Book button writes directly to Beds24's select as backup |
| Beds24 generates different options on load than expected | Low | We copy options at build time from whatever Beds24 provides; no hardcoded values |
| Beds24's change handler uses DOM traversal from the select element (e.g., `.closest('.b24-multipricebox')`) | None | Beds24's handler fires on their own hidden select, which is still inside their own `.b24-multipricebox`. The traversal succeeds because we haven't moved anything |
| Performance: two selects per room instead of one | Negligible | 4 rooms × 1 extra hidden select = 4 extra DOM elements |
| The approach solves offer bar alignment but not tag overlap | Known | Tag overlap is a separate CSS grid issue; this proposal keeps scope to offer bar only |

## 8. Questions for the reviewer

1. Is the mirror pattern sufficient, or should we also mirror the dorm's hidden `input[type="hidden"][name^="sr1-"]`? Currently, the Book button handler reads directly from Beds24's hidden input for dorms. Since we're not moving it and not displaying it, this should be fine — but the reviewer may want to verify.

2. Should the mirror select's options be refreshed on every `applyFixes()` call, or only on first creation? If Beds24 ever changes the option count after initial load (e.g., via AJAX), we'd want to refresh. But Check A confirms the iframe reloads entirely on every search, so options shouldn't change mid-session.

3. The `select[id^="sr1-"]` and `select[id^="naa"]` CSS styling rules (lines 179-194) currently style Beds24's actual selects. With mirroring, the visible selects are ours and the Beds24 ones are hidden. Should we keep the Beds24 select styling as a safety net, or remove it entirely?
