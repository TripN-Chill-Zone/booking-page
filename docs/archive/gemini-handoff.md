# Adversarial Review Package for External Reviewer (Gemini)

**Review target:** `docs/mirror-controls-proposal.md`

This file concatenates all project context needed for an independent adversarial review of the mirror-controls proposal. Files are presented in the order specified by the project owner, with contents preserved exactly as they exist in the repo.

---

# File 1: docs/mirror-controls-proposal.md

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

---

# File 2: docs/offer-bar-rebuild-plan.md

# Offer Bar Rebuild — Implementation Plan (v2)

**Date:** 2026-04-17
**Scope:** Replace the current offer-bar CSS/JS patching approach with a rebuilt offer bar using our own markup. Leaves photo, description, tags, and heading untouched.
**Supersedes:** The full-card rebuild proposal in `card-rebuild-proposal.md`, and v1 of this plan.
**Context docs:** Read `card-rebuild-proposal-review.md` first for the rationale behind scoping down to offer-bar-only and the event-listener experiment results.

---

## 0. Session context — read first

This plan is intended to be executed in a **single focused session in a fresh context window**. The implementing Claude will not have access to the review session's conversation history, only to these documents:

1. This plan (`offer-bar-rebuild-plan.md`)
2. The adversarial review (`card-rebuild-proposal-review.md`)
3. The original proposal (`card-rebuild-proposal.md`)
4. The project docs: `docs/skill/gotchas.md`, `docs/skill/dom-structure.md`, `docs/skill/css-architecture.md`, `docs/beds24-execution.md`, `docs/beds24-execution-context.md`
5. The source files: `beds24-iframe-helper.js`, `CSS-base.css`, `booking-widget.js`, `docs/mockup.html`

Read Sections 0, 1, and 2 of this plan before writing any code. Sections 3 and 4 are reference-only during implementation.

### Environment facts

- **This is a dev-only site.** Only the user accesses it. WordPress is a dev site, Beds24 is a real property but not yet publicly launched. A new production domain is planned for launch.
- **Test bookings are free and disposable.** Beds24 has no payments set up yet and the user can cancel test bookings immediately. Submit the form as often as needed during testing. Test outside peak booking hours (evenings UTC+2 Tirana time) to avoid colliding with a rare real booking.
- **The property is connected to OTAs** (Hostelworld, Booking.com via channel manager). Do not change Beds24 admin settings that affect channel manager behavior — specifically, do not reconfigure dorm rooms to use a visible qty `<select>` instead of the hidden input.
- **Multi-Room Booking is enabled** on the property (`bookpageallowmulti = 1`). The qty dropdown exists because of this. The `bookmult` hidden input is required on form submission.
- **Design target: Hostelworld-like.** The client's brief was "a lot like Hostelworld" — dense, OTA-style, information-rich. The skill file confirms this as the design target. Information density is a feature. Don't over-space the offer bar in the name of minimalism. The existing mockup v13 and the current orange `#E7A35C` Book button are correctly in this register; preserve that feel.
- **The user works alone on this project.** No client preview passes, no other developer. Visible breakage during iteration is fine.

### Failure philosophy for this session

Because this is dev with no external audience:

- **Fail loud, not graceful.** If the rebuild JS fails to run, let the page break visibly. Don't layer fallbacks that hide bugs.
- **No rollback plan required.** `git revert` is the rollback. GitHub Actions auto-deploys on push to main.
- **Break things to learn.** If a Beds24 quirk surfaces mid-step, investigate and adjust the plan rather than working around it defensively. A surprising discovery now is cheaper than one post-launch.

---

## 1. Pre-flight

Before writing code, confirm these facts. Most are already known; two are checks to run in the browser before starting.

### 1.1 Known from the event-listener audit (trust these, don't re-verify)

- The qty select `sr1-{roomId}` has **2 direct jQuery change handlers** attached to the element itself via jQuery's expando.
- The dorm guest select `naa1-1-{roomId}` has **1 direct jQuery change handler**.
- Moving the element preserves handlers (verified move to temp div and back, 2->2->2).
- Handlers still fire after a move (Beds24 toggled `.hidden` on from-div after change dispatch on moved select).
- No delegated listeners on `#formlook`, `.b24-multipricebox`, `.offer`, or `.b24room`.
- Hiding `.b24panel` with `display:none` does not break form submission.

**Design consequence:** moving selects is safe. Use `appendChild` / `insertBefore`, never `cloneNode`. Move `.b24-multipricebox` as a whole unit (not the bare `<select>`) to preserve Beds24's `.closest('.b24-multipricebox')` traversals.

### 1.2 Two checks to run before Step 1

**Check A: Can a user trigger an in-iframe date change?**

Open `booking-widget.js`. Look for how date changes are handled. Two possible answers:

- **(A1) Widget reloads the iframe on every date change** — the iframe never sees an in-place date update. This is the simpler case. The rebuild only needs to handle the cold-load state machine. Skip Check B.
- **(A2) User can change dates inside the iframe** (via Beds24's own date inputs in the booking strip, which `gotchas.md` suggests is hidden but may not be fully disabled) — the rebuild must be idempotent across Beds24 AJAX re-renders. Run Check B.

**Answer from Session 10: A1.** Widget reloads the iframe entirely on every search. The booking strip is hidden inside the iframe. No in-iframe date changes possible. Skip Check B.

**Check B (only if A2): Does Beds24 mutate `.b24panel` in place or replace it?**

Skipped — not needed per A1 answer.

---

## 2. Design

### 2.1 Target DOM after rebuild

```html
<div class="offer offer-o{roomId}-1">
  <div>
    <div class="at_offername"></div>          <!-- already hidden by CSS -->
    <div class="clearfix"></div>
    <div class="row">

      <!-- Beds24's original offer-select: hidden by CSS from the start -->
      <div class="b24-offer-select ...">
        <div class="multiroomshow">
          <!-- Original .b24-multipricebox has been MOVED OUT to .tnh-offer-bar -->
          <!-- Hidden per-occupancy price boxes remain here (harmless) -->
        </div>
      </div>

      <!-- Our rebuilt offer bar -->
      <div class="tnh-offer-bar">
        <div class="tnh-offer-price">from [euro]XX.XX / night</div>
        <div class="tnh-offer-controls">
          <label class="tnh-offer-label">Select</label>
          <!-- MOVED: the original .b24-multipricebox (main one, not .hidden) -->
          <div class="b24-multipricebox ...">
            <div class="form-inline">
              <select id="sr1-{roomId}">...</select>  <!-- or hidden input for dorms -->
            </div>
            <div id="from-1-{roomId}" style="display:none">...</div>  <!-- kept, hidden -->
          </div>
          <span class="tnh-total-price"></span>
          <button class="tnh-book-btn">Book</button>
        </div>
      </div>

      <!-- Date strip stays where it is -->
      <div class="b24-offer-pricetable">...</div>
    </div>
  </div>
</div>
```

### 2.2 State machine

Three states need explicit handling:

| State | Detection | Rendering |
|---|---|---|
| Available, no qty selected | no `.offerwarndiv` OR `.offerwarndiv.hidden`, AND `from-div` has no `.hidden` | Show `from [euro]X.XX / night`, hide total, Book button = "select qty 1 and submit" |
| Available, qty selected | `from-div` has `.hidden` (Beds24 adds this) | Hide from-price, show total, Book button = "submit" |
| Unavailable | `.offerwarndiv` present and not `.hidden` | Show "Not available on DD MMM", no controls, no Book button |

Transitions:
- No-qty -> qty selected: Beds24 toggles `.hidden` on from-div -> observer fires -> swap price/total display.
- Qty selected -> no-qty (user picks "-"): Beds24 removes `.hidden` from from-div -> observer fires -> swap back.
- Date change: depends on Check A result. If (A1), clean reload. If (A2), rebuild must be idempotent.

### 2.3 What stays in the current helper (unchanged)

- **Section 1** — chrome hiding + height sync + iOS viewport clamp.
- **Section 5** — date strip CSS injection.
- **Section 7** — room card enhancement (desc-text styling + tag injection). Remove only the qty placeholder rename; it moves to the rebuild.
- **Section 8** — `sortRooms()`.
- **INIT** — MutationObserver + applyFixes. Debounce and `isModifying` guard both stay.

### 2.4 What gets replaced

- **Section 3** `fixDormRooms()` — merged into the rebuild. Dorm is a branch of the offer-bar builder.
- **Section 4** `injectBookButtons()` — merged into the rebuild.
- **Section 6** `enhancePrices()` — merged into the rebuild.

### 2.5 New function structure

```
buildOfferBar(offer)             // entry point per offer
  |-- detectState(offer)          // returns 'available-noqty' | 'available-qty' | 'unavailable'
  |-- extractPriceData(offer)     // returns { total, currency, nights, perNight, valid }
  |-- getOrCreateOfferBar(offer)  // creates .tnh-offer-bar if missing, returns it
  |-- movePriceBoxInto(bar, offer) // moves .b24-multipricebox into our bar (once)
  |-- renderAvailable(bar, data, state, offer)
  |-- renderUnavailable(bar, warnText)
  +-- attachBookHandler(bar, form, isDorm)

rebuildOfferBars()               // iterates all .offer, calls buildOfferBar
```

Target helper size: **under 500 lines total** (current is 588).

---

## 3. Implementation steps

Each step is independently verifiable. Run the acceptance check before moving on. Commit after each green step.

### Step 1 — State detection utility

Add `detectOfferState(offer)`. Returns `'available-noqty'`, `'available-qty'`, or `'unavailable'`.

**Acceptance:**
- Console-test on each of the 4 rooms. States match visual output.
- Select a qty -> state transitions to `'available-qty'`.
- Date range with one room sold out -> that room returns `'unavailable'`.

### Step 2 — Price extraction utility

Add `extractPriceData(offer)` returning `{ valid, total, currency, nights, perNight }`.

**Note:** the cache captures the 1-unit baseline. Live total (for display after qty selection) must be re-read from the DOM in the render step, not cached.

**Acceptance:**
- Each room returns valid price data matching on-screen "from" price.
- Dorm room returns a valid price.
- Unavailable room may return `{ valid: false }` gracefully — no throw.

### Step 3 — Build the empty offer bar shell

Add `getOrCreateOfferBar(offer)`. Creates `.tnh-offer-bar` inside the offer, positioned before the date strip. Don't move form elements yet. Don't hide the original yet.

**Acceptance:**
- Empty `.tnh-offer-bar` divs appear in each offer.
- Original offer bar still visible above/below (expected intermediate state).
- No layout shift on date strip.
- No console errors.

### Step 4 — Render available-noqty state with placeholder controls

Populate the new bar with from-price and placeholder "Select" label + disabled dropdown. Don't move Beds24 elements yet. Skip dorms and unavailable rooms for now.

**Acceptance:**
- Visual match against `mockup.html` v13 for the offer-bar region.
- Desktop: prices and controls on one line, Hostelworld-like density.
- Mobile: offer bar renders without overflowing.
- Responsive check at 320px, 768px, 1200px.

### Step 5 — Move the real `.b24-multipricebox`

Replace the placeholder dropdown by MOVING the main `.b24-multipricebox` from Beds24's original offer-select into `.tnh-offer-controls`. Hide the from-div inside the moved box (price displays via `.tnh-offer-price` separately).

**Idempotency note:** if a re-render restores a fresh `.b24-multipricebox` in the original location, `bar.dataset.tnhMoved` is still `'true'` but `controls` no longer contains the moved box. Add a validity check: if the moved box is no longer a descendant of `controls`, clear the flag and re-run.

**Acceptance:**
- Real Beds24 qty dropdown appears in the new offer bar.
- Selecting a quantity still toggles `.hidden` on the (hidden) original from-div.
- No console errors on qty change.
- Submitting via the original booking strip Book button still works.

### Step 6 — Qty-selected state transition

Hook the observer-driven `applyFixes()` flow so state transitions update the display.

**Acceptance:**
- Qty 1 -> total shows, from-price hides, total matches Beds24's internal 1-unit price.
- Qty 2 -> total updates (~2x the 1-unit total).
- Qty "-" -> back to from-price, total hides.
- No visible flicker during transitions.

### Step 7 — Book button handler

Mirror the current `injectBookButtons()` click handler logic:
1. If qty select is `0` or `''`, set to `1` and dispatch `change`.
2. If dorm (hidden input + guest select present), set guest select to `1` if currently `0`, dispatch `change`.
3. Ensure `bookmult` hidden input exists on `#formlook`.
4. `form.submit()`.

**Acceptance:**
- Available private room, no qty selected -> click Book -> qty auto-sets to 1, checkout loads.
- Available private room, qty 2 selected -> click Book -> checkout loads with qty=2.
- Dorm room -> click Book -> guest=1 auto-set, checkout loads with dorm reservation.
- Network POST contains expected `sr1-` and `naa1-` values.
- Cancel each test booking immediately via Beds24 admin.

### Step 8 — Dorm branch

Extend `buildOfferBar` to handle dorms:
- Dorms have `input[type="hidden"][name^="sr1-"]` in the main box instead of `<select>`.
- Dorm's guest select `naa1-1-{roomId}` lives in a second visible `.b24-multipricebox`.
- Move that second multipricebox's guest select into our controls, relabeled "Beds".
- Hide the now-empty second multipricebox.

**Acceptance:**
- Dorm offer bar shows "Beds" label + guest dropdown (1-4).
- Selecting 2 beds updates hidden from-div via Beds24's handler.
- Orphan second multipricebox is hidden.
- Book button submits correctly; POST contains `naa1-1-{roomId}=2`.
- Test booking cancelled.

### Step 9 — Unavailable state

When `detectOfferState` returns `'unavailable'`:
- `.tnh-offer-bar` renders only a `.tnh-unavailable` message.
- No price, no dropdown, no Book button.

**Acceptance:**
- Pick a date range where one room is fully booked.
- That room's offer bar shows the unavailable message only.
- `sortRooms()` still pushes unavailable rooms to the bottom.

### Step 10 — Hide the original offer-select

Add to CSS:

```css
.b24-offer-select { display: none !important; }
```

**Acceptance:**
- Only the rebuilt offer bar is visible.
- Date strip still positioned correctly.
- No layout shift on page load.

### Step 11 — Rewrite the CSS

Delete old offer-bar CSS rules. Add new `.tnh-offer-bar` rules (see plan Section 2 for target CSS).

**Acceptance:**
- `CSS-base.css` drops by at least 80 lines.
- `!important` count drops significantly.
- Visual output matches mockup v13 on desktop and mobile.
- Hostelworld-density feel preserved.

### Step 12 — Remove replaced code from helper

Delete `fixDormRooms()`, `injectBookButtons()`, `enhancePrices()`, and their calls in `applyFixes()`. Add `rebuildOfferBars()` call in their place.

**Acceptance:**
- Helper under 500 lines.
- Full flow works: search -> cards render -> select qty -> book -> checkout -> confirmation.

### Step 13 — Smoke test matrix (dev-scale)

| Scenario | Room | Verify |
|---|---|---|
| Cold page load | All 4 | Cards render, prices correct, no console errors |
| Qty select 1 | Room 567218 (private) | Total shows, from-price hides |
| Qty change 1->2 | Same | Total updates correctly |
| Qty reset to "-" | Same | From-price returns |
| Book no-qty | Room 567220 (private) | Auto-sets qty 1, submits |
| Book qty=2 | Room 567221 (private) | Submits with qty=2 |
| Dorm booking | Room 567219 | Beds label works, submits |
| Unavailable | Any, pick sold-out date | Shows unavailable message |
| Sort order | Any | Cheapest first, unavailable last |
| Mobile Safari, real iOS | All 4 | Layout correct, no iframe overflow |
| Desktop Chrome | All 4 | Visual match with mockup |

Cancel every test booking via Beds24 admin immediately after verifying.

### Step 14 — Commit and push

Single commit or series of commits to main. GitHub Actions deploys. Hard refresh to verify.

---

## 4. Reference

### 4.1 Open questions carried forward from review

Both now resolved:
- Event-listener audit — complete, moves are safe.
- In-iframe date change — A1, widget reloads iframe entirely.

### 4.2 What not to do

- **Do not `cloneNode` any `<select>` elements.** jQuery expando storage means cloning breaks handlers. Move only.
- **Do not move the bare `<select>`** out of `.b24-multipricebox`. Move the whole box to preserve ancestor traversals.
- **Do not extend the rebuild** to photo, description, tags, or heading. Strictly offer-bar-only.
- **Do not remove the `isModifying` guard** in the observer. It prevents feedback loops.
- **Do not delete** `.b24-multipricebox.hidden { display: none !important }`. It prevents per-occupancy leakage.
- **Do not remove** `[id^="collapseslider"]` / `[id^="collapsedesc"]` force-open rules.
- **Do not change Beds24 admin settings.** Especially dorm room quantity selector config.
- **Do not add graceful-degradation fallbacks** for the offer-bar visibility. Fail loud on this dev site.

### 4.3 Success criteria (sign-off checklist)

- [ ] Offer bar alignment consistent across all 4 rooms and all 3 states.
- [ ] CSS-base.css under 390 lines (from 472).
- [ ] Helper JS under 500 lines (from 588).
- [ ] Fewer than 30 `!important` declarations in CSS-base.css.
- [ ] No regressions in: room sorting, tag display, dorm booking, iframe height sync, checkout flow.
- [ ] Mobile offer bar matches mockup v13 without negative-margin hacks, without CSS `order`, without flex-wrap tricks.
- [ ] No console errors or warnings in Chrome desktop and iOS Safari.
- [ ] Network POST on Book submit contains expected `sr1-` and `naa1-` values for both private and dorm rooms.
- [ ] All test bookings cancelled in Beds24 admin.
- [ ] Design feels Hostelworld-dense, not over-spaced or minimalist.

### 4.4 Post-rebuild opportunities (out of scope)

These become easier once the offer bar is our own. Do not attempt during this session.
- Per-room dynamic badges ("Best value", "Only 2 left").
- A/B testing Book button copy.
- Promotional messaging inside the offer bar.

---

# File 3: docs/card-rebuild-proposal-review.md

# Adversarial Review — Card Rebuild Proposal

**Reviewer:** Claude Opus 4.7
**Date:** 2026-04-17
**Documents reviewed:** `card-rebuild-proposal.md`, `beds24-iframe-helper.js` (current, 588 lines), `CSS-base.css` (current, 472 lines), `docs/skill/gotchas.md`, `docs/skill/dom-structure.md`, and the Beds24 skill file.
**Not reviewed (intentionally):** `beds24-execution.md`, `beds24-execution-context.md`, `mockup.html`, `booking-widget.js`. The proposal explicitly scopes the widget and mockup out of the rebuild, and the execution docs are process history rather than technical constraints.

---

## TL;DR

**The core idea is probably right but the proposal is selling it too hard.** Hiding Beds24's card body and rendering your own markup is a well-understood escape hatch from a hostile host DOM, and it is likely the correct move. But the proposal presents it as a clean-sweep simplification when in practice it is a risk **re-shaping** exercise: you trade a class of problems you have characterised (CSS specificity wars, offer-bar alignment) for a class of problems you have not yet had to solve (re-render races, form-state preservation across moves, a full custom carousel, extraction-selector drift, host JS timing).

I would recommend proceeding **only after** addressing the concrete gaps in Sections 2, 3, and 4 below. Several of the "risks and mitigations" in the proposal are under-specified or, in two cases, factually questionable.

---

## 1. Claims in the proposal that don't hold up

### 1.1 "Beds24 uses delegated listeners on the form, not direct listeners on selects" — unverified and load-bearing

This is the single most important assumption in the whole proposal. The entire case for *moving* rather than *cloning* `<select>` elements rests on it. The proposal states it as a fact. Nothing in `gotchas.md`, `dom-structure.md`, or the current helper source demonstrates that this is actually true. The current helper moves exactly **one** `<select>` — `naa1-1-{roomId}` for dorms, from the orphan price box into the main box — and that `<select>` is already CSS-hidden for private rooms, so nobody has observed whether its direct event listeners survive the move for rooms that actually use it. The "proven" evidence is thin.

**Post-review status: RESOLVED.** Event listener audit conducted. The qty select has 2 direct jQuery change handlers stored via jQuery's expando property. Moving the element with `appendChild` preserves the handlers (verified: 2 handlers before move, 2 after move to temp div, 2 after restore). Handlers still fire correctly after the move — Beds24 toggled `.hidden` on from-div after a change event dispatched on the moved-and-restored select.

### 1.2 "Form submission reads values by `name` attribute, not by visibility" — true but incomplete

The claim is correct for the HTTP form submission itself. But Beds24 doesn't just submit — it does per-select `.change()` handlers that update the visible price, hide/show boxes, toggle `.hidden`, etc. The proposal conflates "form submit works" with "all form-related behaviour works". These are different.

**Post-review status: RESOLVED.** Panel-body hide experiment confirmed: hiding `.b24panel` with `display:none` doesn't break form submission, and Beds24's change handlers still fire on hidden selects. `FormData` still reads `sr1-567220=1` from a select inside a hidden parent.

### 1.3 "The loading spinner in the widget covers this transition" — verify before relying on it

**Post-review status: RESOLVED by scope reduction.** The offer-bar-only rebuild doesn't hide the panel-body, so no card-level flash occurs. The offer bar construction happens after the card is already visible.

### 1.4 The skill file describes a non-iframe architecture

**Post-review status: ACKNOWLEDGED.** The skill file needs updating. Noted in session-handoff-10.md as a documentation debt item.

---

## 2-3. Risks and pre-approval requirements

### Resolved items:
- Event-listener audit (§1.1) — complete, moves are safe
- Idempotency (§3.2) — handled by Check A result: widget reloads iframe entirely (A1), no in-iframe date changes
- Carousel decision (§3.3) — resolved by scope reduction to offer-bar-only; carousel stays native
- Rollback plan (§3.5) — `git revert` + auto-deploy via GitHub Actions

### Carried forward to implementation plan:
- Unavailable/available/qty-selected state machine (§2.5) — enumerated in offer-bar-rebuild-plan.md §2.2
- `bookmult` hidden input preservation (§2.6) — addressed in Step 7
- Line-count targets (§3.6) — set at CSS <390, JS <500

---

## 4. A third option the proposal doesn't consider

**Rebuild the offer bar only. Leave heading, photo, description, tags alone.**

**Post-review status: ADOPTED.** This is now the implementation plan. See `offer-bar-rebuild-plan.md`.

---

## 5. Smaller notes

- Line count discrepancy (577 vs 588) — acknowledged, minor
- Section 2 listed as "unchanged" when already removed — acknowledged
- `sortRooms()` marker bug on re-render — noted, low priority (A1 means full reload)
- CSS line target may be optimistic — adjusted to <390 (from <200 in original proposal)
- Open Question 1 (visibility-dependent behaviors) — resolved by scope reduction and experiments
- Open Question 3 (hardcoded tags) — deferred, orthogonal to rebuild

---

## 6. Recommendation

**Original recommendation: Do not approve as written.**

**Updated recommendation: Approved with scope reduction to offer-bar-only.** All gating experiments completed. Implementation plan written and reviewed. Proceed with `offer-bar-rebuild-plan.md`.


---

# File 4: CLAUDE.md

# Beds24 Booking Page Project

## Reference Documents

### Current state (read these first)
- Session 10 handoff: `docs/session-handoff-10.md`
- Offer bar rebuild plan (next task): `docs/offer-bar-rebuild-plan.md`
- Adversarial review: `docs/card-rebuild-proposal-review.md`

### Architecture & process
- Execution plan: `docs/beds24-execution.md`
- Architecture decisions: `docs/beds24-execution-context.md`
- Approved mockup: `docs/mockup.html` (v13)

### Technical reference
- DOM structure: `docs/skill/dom-structure.md`
- CSS architecture: `docs/skill/css-architecture.md`
- Admin guide: `docs/skill/admin-guide.md`
- Gotchas: `docs/skill/gotchas.md`
- Skill guide: `docs/skill/SKILL.md`

## Current Status

- Phase 2 (admin configuration) — COMPLETE
- Phase 3 (CSS/JS authoring) — IN PROGRESS
  - Room card layout: working (photo, desc, tags, heading all correct)
  - Offer bar: BROKEN — rebuild planned (see `docs/offer-bar-rebuild-plan.md`)
  - Room descriptions: updated to short versions (done Session 10)
  - Room sorting: working (cheapest first, unavailable at bottom)
  - CI/CD pipeline: working (GitHub Actions auto-deploy)
  - Remaining: offer bar rebuild, checkout page styling, confirmation page, accessibility
- Phase 4 (mobile QA) — NOT STARTED

## First-Session Setup

The filesystem resets between sessions. At the start of each new session:

1. **Get the GitHub PAT from the user** — ask for it, don't assume you have it
2. **Clone the repo with push access:**
   ```bash
   git clone https://PASTE_PAT_HERE@github.com/TripN-Chill-Zone/booking-page.git /home/claude/booking-page
   cd /home/claude/booking-page
   git config user.email "claude@anthropic.com"
   git config user.name "Claude"
   ```
3. **Verify CI/CD works** — make a trivial change, push, and confirm GitHub Actions deploys

The PAT is a fine-grained token scoped to `TripN-Chill-Zone/booking-page` with Contents + Metadata + Workflows read/write. Do NOT store the token in any committed file.

## Project Conventions

- American spelling throughout
- No time estimates
- Use Beds24 admin field names when communicating with user
- Design target: Hostelworld-like density (not minimalist)
- Fail loud during dev — no graceful degradation fallbacks

## Deployment

### CI/CD Pipeline
- **Repo:** `https://github.com/TripN-Chill-Zone/booking-page` (public)
- **Deploy:** Push to `main` -> GitHub Actions SSHes to VPS -> deploys 3 files
- **Files:** `CSS-base.css`, `beds24-iframe-helper.js`, `booking-widget.js` (stable filenames)
- **Target:** `/www/wwwroot/astrongpresence.com/`
- **VPS SSH:** port 5771, ed25519 key auth
- **Cache busting:** `Date.now()` bootstrappers in Beds24 customhead and WordPress block — no manual cache management needed

### Currently live
- External CSS: `https://astrongpresence.com/CSS-base.css`
- Iframe helper: `https://astrongpresence.com/beds24-iframe-helper.js`
- Booking widget: `https://astrongpresence.com/booking-widget.js`

### Beds24 admin fields
- "Insert in HTML <HEAD> top": Google Fonts `<link>` for Lexend + Lexend Giga
- "Insert in HTML <HEAD> bottom": `Date.now()` bootstrapper loading `beds24-iframe-helper.js`
- "Custom CSS": Critical CSS payload + Chill Zone variable overrides
- "Insert in HTML <BODY> bottom": Empty

### WordPress
```html
<div id="tnh-booking-root"></div>
<script>var s=document.createElement('script');s.src='https://astrongpresence.com/booking-widget.js?v='+Date.now();document.head.appendChild(s);</script>
```

## Helper JS Sections

1. **Hide chrome + height sync** (widget iframe only) + iOS viewport clamp
2. *(removed — checkout stays in iframe)*
3. **Dorm booking fix** (move guest selector, relabel Guests->Beds, hide orphan box)
4. **Book buttons** — wrapped in `.tnh-offer-row` with `.tnh-total-price` + button
5. **Date strip overrides** (green stay, red unavailable, non-clickable, hide header)
6. **Price UX** — from-price always visible, total only after qty selection
7. **Room card enhancement** — `.tnh-desc-text` class, dual tag injection, qty placeholder "-"
8. **Room sorting** — cheapest first, unavailable at bottom, DOM reordering

**Sections 3, 4, 6 will be replaced by offer-bar rebuild** (see `docs/offer-bar-rebuild-plan.md`).

## Room Descriptions (updated in Beds24 admin, Session 10)

- **Suite (567218)**: "Spacious premium suite with a huge king-sized bed, ensuite bathroom and panoramic city views. Perfect for extended stays."
- **Single (567220)**: "Ideal room for solo travelers who value privacy and the social atmosphere of a co-living space. A quiet, private room to call your own."
- **Double (567221)**: "Private double room for couples or friends. All the comfort and privacy you need, with full access to our shared spaces."
- **Dorm (567219)**: "A comfortable bed in a modern 4-person dorm. Great value with a social atmosphere -- meet fellow travelers without breaking the bank."

## Room Tags
```
567218 (Suite): Sleeps 2, Ensuite, City View, Work Desk, Premium
567220 (Single): Sleeps 1, Shared Bathroom, Work Desk, Private
567221 (Double): Sleeps 2, Shared Bathroom, Work Desk, Private
567219 (Dorm): 1 Bed, 4-Bed Dorm, Power Outlet, Reading Light
```

## Beds24 Property
- Property ID: 271142
- Owner ID: 141266
- Room IDs: Deluxe King Suite (567218), Single Bed Dorm (567219), Single Room (567220), Double Room with Shared Bathroom (567221)
- Booking page URL: `https://www.beds24.com/booking2.php?ownerid=141266&propid=271142`
- With CSS: append `&cssfile=https://astrongpresence.com/CSS-base.css`

## Critical DOM Knowledge

- `#b24scroller` is the BOOKING STRIP, not the room container. Room container is `.b24fullcontainer-rooms`.
- Beds24 loads ALL rooms via AJAX into a single `#ajaxroomoffer` wrapper — other wrappers are empty.
- `div#selectors1-{roomId}` wrapper exists between `.multiroomshow` and `.b24-multipricebox` (not in mockup).
- Dorm room (567219) renders hidden input instead of qty dropdown. Helper handles this.
- Dorm has two visible `.b24-multipricebox` containers. Helper moves guest selector and hides orphan.
- Qty select has 2 direct jQuery change handlers. They survive DOM moves (jQuery expando). Move, never clone.
- `.b24-multipricebox.hidden` must be explicitly hidden with `display: none !important`.
- Bootstrap `.container` fixed widths expand iOS Safari iframes — clamp with `max-width:100%`.
- Date strip cells are clickable — block with `pointer-events: none`.
- Beds24 "Custom CSS" field silently rejects saves above ~18-19K chars.
- "Insert in HTML <BODY> bottom" strips `<script>`/`<style>` tags when saved programmatically.


---

## File 5: beds24-iframe-helper.js

```javascript
/*
 * TNH Beds24 Iframe Helper
 * Stable filename — deployed via GitHub Actions CI/CD.
 * Loaded via Date.now() bootstrapper in Beds24 customhead field.
 *
 * Session 11: Offer bar rebuild
 * - Replaced Sections 3+4+6 with unified rebuildOfferBars()
 * - New .tnh-offer-bar with 3-state machine
 * - Moves Beds24 form elements (never clones) to preserve jQuery handlers
 */
(function(){
  var isWidget = location.search.indexOf('referer=widget') >= 0;
  var isEmbedded = window.parent !== window;
  function getIsRoomSearch() { return !!document.getElementById('formlook'); }
  function getIsCheckout() { return !!document.querySelector('.bp2book'); }

  /* === SECTION 1: Hide chrome + height sync (widget only) === */
  if (isWidget && isEmbedded) {
    var s = document.createElement('style');
    s.textContent = ''
      + '.b24fullcontainer-selector{display:none!important}'
      + '.b24fullcontainer-top{display:none!important}'
      + '.b24fullcontainer-ownerrow1{display:none!important}'
      + '.b24fullcontainer-footer{display:none!important}'
      + '.b24fullcontainer-proprow1{display:none!important}'
      + '.b24fullcontainer-proprow2{display:none!important}'
      + '.b24fullcontainer-proprow11{display:none!important}'
      + '.b24fullcontainer-ownerrow11{display:none!important}'
      + '#b24bookshoppingcart{display:none!important}'
      + '#selectorstripinfo{display:none!important}'
      + '.book_poweredby{display:none!important}'
      + '.bp2book .b24panel img{max-width:200px!important;height:auto!important;border-radius:8px}'
      + '.book_securelogo{display:none!important}'
      + 'body{background:transparent!important;margin:0!important;padding:0!important}'
      + '.container{max-width:100%!important;width:auto!important;box-sizing:border-box!important}'
      + '.row{max-width:100%!important}';
    document.head.appendChild(s);

    function send() {
      var h, el = document.querySelector('.b24fullcontainer-rooms') || document.querySelector('#bookingpage');
      if (el) { var r = el.getBoundingClientRect(); h = Math.ceil(r.bottom + window.scrollY); }
      else { h = document.documentElement.scrollHeight; }
      h = Math.max(h, 200);
      try { window.parent.postMessage(JSON.stringify({type:'tnh-height', height:h}), '*'); } catch(e) {}
    }
    function notifyPageChange(page) {
      try { window.parent.postMessage(JSON.stringify({type:'tnh-page-change', page:page}), '*'); } catch(e) {}
    }
    if (document.readyState === 'complete') {
      send();
      if (!getIsRoomSearch()) notifyPageChange(getIsCheckout() ? 'checkout' : 'confirmation');
    } else {
      window.addEventListener('load', function() {
        send();
        if (!getIsRoomSearch()) notifyPageChange(getIsCheckout() ? 'checkout' : 'confirmation');
      });
    }
  }

  /* === OFFER BAR REBUILD (replaces Sections 3+4+6) === */

  function detectOfferState(offer) {
    var w = offer.querySelector('[class*="offerwarndiv"]');
    if (w && !w.classList.contains('hidden')) return 'unavailable';
    var f = offer.querySelector('[id^="from-1-"]');
    if (f && f.classList.contains('hidden')) return 'available-qty';
    return 'available-noqty';
  }

  function extractPriceData(offer) {
    var f = offer.querySelector('[id^="from-1-"]');
    if (!f) return { valid: false };
    var ds = f.querySelector('.bookingpagedollars'), cs = f.querySelector('.bookingpagecents');
    if (!ds || !cs) return { valid: false };
    var d = parseInt(ds.textContent, 10), c = parseInt(cs.textContent.replace('.',''), 10) || 0;
    if (isNaN(d)) return { valid: false };
    var total = d + c / 100;
    var cur = (f.querySelector('.bookingpagecurrency') || {}).textContent || '\u20AC';
    /* Cache the base total for readLiveTotal to use */
    if (!f.dataset.tnhBaseTotal) {
      f.dataset.tnhBaseTotal = total.toFixed(2);
      f.dataset.tnhBaseCurrency = cur;
    }
    var nEl = document.querySelector('#inputnumnight');
    var n = nEl ? parseInt(nEl.value, 10) : 1;
    if (!n || n < 1) n = 1;
    return { valid: true, total: total, currency: cur, nights: n, perNight: n > 1 ? total / n : total };
  }

  function readLiveTotal(offer) {
    /* Compute total: base total × qty selected */
    var f = offer.querySelector('[id^="from-1-"]');
    if (!f) return null;
    /* Use cached base total if available, otherwise read from spans */
    var baseTotal, cur;
    if (f.dataset.tnhBaseTotal) {
      baseTotal = parseFloat(f.dataset.tnhBaseTotal);
      cur = f.dataset.tnhBaseCurrency || '\u20AC';
    } else {
      var ds = f.querySelector('.bookingpagedollars'), cs = f.querySelector('.bookingpagecents');
      if (!ds || !cs) return null;
      var d = parseInt(ds.textContent, 10), c = parseInt(cs.textContent.replace('.',''), 10) || 0;
      if (isNaN(d)) return null;
      baseTotal = d + c / 100;
      cur = (f.querySelector('.bookingpagecurrency') || {}).textContent || '\u20AC';
      f.dataset.tnhBaseTotal = baseTotal.toFixed(2);
      f.dataset.tnhBaseCurrency = cur;
    }
    if (isNaN(baseTotal)) return null;
    /* Read qty from the select */
    var qs = offer.querySelector('select[id^="sr1-"]');
    var qty = qs ? parseInt(qs.value, 10) : 1;
    if (!qty || qty < 1) qty = 1;
    /* For dorms, read from guest select instead */
    if (offer.querySelector('input[type="hidden"][name^="sr1-"]')) {
      var gs = offer.querySelector('select[id^="naa"]');
      qty = gs ? parseInt(gs.value, 10) : 1;
      if (!qty || qty < 1) qty = 1;
    }
    return { total: baseTotal * qty, currency: cur };
  }

  function isDormOffer(offer) {
    return !!offer.querySelector('input[type="hidden"][name^="sr1-"]');
  }

  function getOrCreateOfferBar(offer) {
    var existing = offer.querySelector('.tnh-offer-bar');
    if (existing) return existing;
    var bar = document.createElement('div');
    bar.className = 'tnh-offer-bar';
    var row = offer.querySelector('.row');
    var strip = row ? row.querySelector('.b24-offer-pricetable') : null;
    if (row && strip) row.insertBefore(bar, strip);
    else if (row) row.appendChild(bar);
    return bar;
  }

  function movePriceBoxInto(bar, offer) {
    var controls = bar.querySelector('.tnh-offer-controls');
    if (!controls) return;
    if (bar.dataset.tnhMoved === 'true' && controls.querySelector('.b24-multipricebox')) return;
    bar.dataset.tnhMoved = '';
    var sel = offer.querySelector('.b24-offer-select');
    if (!sel) return;
    var boxes = sel.querySelectorAll('.b24-multipricebox'), mainBox = null;
    for (var i = 0; i < boxes.length; i++) {
      if (!boxes[i].classList.contains('hidden') && boxes[i].querySelector('[id^="from-"]')) { mainBox = boxes[i]; break; }
    }
    if (!mainBox) return;
    var label = controls.querySelector('.tnh-offer-label');
    if (label) controls.insertBefore(mainBox, label.nextSibling);
    else controls.insertBefore(mainBox, controls.querySelector('.tnh-total-price'));
    bar.dataset.tnhMoved = 'true';
  }

  function handleDormControls(bar, offer) {
    if (bar.dataset.tnhDormDone === 'true') return;
    var sel = offer.querySelector('.b24-offer-select');
    if (!sel) return;
    var gs = sel.querySelector('select[id^="naa"]');
    if (!gs) return;
    for (var i = 0; i < gs.options.length; i++) {
      if (i === 0 && (gs.options[i].value === '0' || gs.options[i].value === '')) {
        gs.options[i].text = '-';
      } else {
        gs.options[i].text = gs.options[i].text.replace(/Guests?/g, function(m) { return m === 'Guest' ? 'Bed' : 'Beds'; });
      }
    }
    var controls = bar.querySelector('.tnh-offer-controls');
    if (!controls) return;
    var wrapper = document.createElement('span');
    wrapper.className = 'tnh-dorm-select-wrapper';
    var lbl = document.createElement('span');
    lbl.className = 'tnh-offer-label'; lbl.textContent = 'Beds';
    wrapper.appendChild(lbl);
    wrapper.appendChild(gs); /* MOVE, not clone */
    var existing = controls.querySelector('.tnh-offer-label');
    if (existing) controls.replaceChild(wrapper, existing);
    else controls.insertBefore(wrapper, controls.firstChild);
    /* Hide orphan second pricebox */
    sel.querySelectorAll('.b24-multipricebox').forEach(function(box) {
      if (!box.classList.contains('hidden') && !box.querySelector('[id^="from-"]') && !box.closest('.tnh-offer-bar'))
        box.style.setProperty('display', 'none', 'important');
    });
    bar.dataset.tnhDormDone = 'true';
  }

  function formatPrice(pd) {
    if (!pd.valid) return '';
    return pd.nights > 1
      ? 'from ' + pd.currency + pd.perNight.toFixed(2) + ' / night'
      : 'from ' + pd.currency + pd.total.toFixed(2);
  }

  function renderOfferBar(bar, offer, state, pd) {
    var controls = bar.querySelector('.tnh-offer-controls');
    var priceDiv = bar.querySelector('.tnh-offer-price');
    var totalEl = bar.querySelector('.tnh-total-price');
    var unavailEl = bar.querySelector('.tnh-unavailable');

    if (state === 'unavailable') {
      if (controls) controls.style.display = 'none';
      if (priceDiv) priceDiv.style.display = 'none';
      if (!unavailEl) { unavailEl = document.createElement('div'); unavailEl.className = 'tnh-unavailable'; bar.appendChild(unavailEl); }
      var w = offer.querySelector('[class*="offerwarndiv"]');
      unavailEl.textContent = w ? w.textContent.trim() : 'Not available for selected dates';
      unavailEl.style.display = '';
      return;
    }

    if (unavailEl) unavailEl.style.display = 'none';
    if (controls) controls.style.display = '';
    if (priceDiv) { priceDiv.style.display = ''; priceDiv.textContent = formatPrice(pd); }

    if (state === 'available-noqty') {
      if (totalEl) { totalEl.style.display = 'none'; totalEl.textContent = ''; }
    } else {
      if (totalEl) {
        var live = readLiveTotal(offer);
        if (live) { totalEl.textContent = live.currency + live.total.toFixed(2); totalEl.style.display = ''; }
      }
    }
  }

  function attachBookHandler(btn, offer) {
    if (btn.dataset.tnhBound === 'true') return;
    btn.dataset.tnhBound = 'true';
    var dorm = isDormOffer(offer);
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      var qs = offer.querySelector('select[id^="sr1-"]');
      var gs = offer.querySelector('select[id^="naa"]');
      if (qs && (qs.value === '0' || qs.value === '')) {
        qs.value = '1'; qs.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (dorm && gs && (gs.value === '0' || gs.value === '')) {
        gs.value = '1'; gs.dispatchEvent(new Event('change', { bubbles: true }));
      }
      var form = document.getElementById('formlook');
      if (form) {
        if (!form.querySelector('input[name="bookmult"]')) {
          var bm = document.createElement('input');
          bm.type = 'hidden'; bm.name = 'bookmult'; bm.value = '';
          form.appendChild(bm);
        }
        form.submit();
      }
    });
  }

  function buildOfferBar(offer) {
    var state = detectOfferState(offer);
    var pd = extractPriceData(offer);
    var bar = getOrCreateOfferBar(offer);
    var dorm = isDormOffer(offer);

    if (!bar.querySelector('.tnh-offer-price')) {
      var priceDiv = document.createElement('div');
      priceDiv.className = 'tnh-offer-price';
      bar.appendChild(priceDiv);
      var controls = document.createElement('div');
      controls.className = 'tnh-offer-controls';
      if (!dorm) {
        var lbl = document.createElement('span');
        lbl.className = 'tnh-offer-label'; lbl.textContent = 'Select';
        controls.appendChild(lbl);
      }
      var totalEl = document.createElement('span');
      totalEl.className = 'tnh-total-price'; totalEl.style.display = 'none';
      controls.appendChild(totalEl);
      var btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'tnh-book-btn'; btn.textContent = 'Book';
      controls.appendChild(btn);
      bar.appendChild(controls);
    }

    if (state !== 'unavailable') {
      movePriceBoxInto(bar, offer);
      if (dorm) handleDormControls(bar, offer);
    }
    renderOfferBar(bar, offer, state, pd);
    var bookBtn = bar.querySelector('.tnh-book-btn');
    if (bookBtn) attachBookHandler(bookBtn, offer);
  }

  function rebuildOfferBars() {
    if (!getIsRoomSearch()) return;
    document.querySelectorAll('.offer').forEach(buildOfferBar);
    document.querySelectorAll('select[id^="sr1-"]').forEach(function(sel) {
      if (sel.options[0] && (sel.options[0].text === 'Quantity' || sel.options[0].value === '0'))
        sel.options[0].text = '-';
    });
  }

  /* === SECTION 5: Date strip overrides === */
  var dss = document.createElement('style');
  dss.textContent = ''
    + '.datestay{background-color:#6DA17D!important;color:#fff!important}'
    + '.setsplitdates1 .datestay.prevdateavail,.setsplitdates1 .datestay.prevdatenotavail,.setsplitdates1 .datestay.prevdaterequest'
    + '{background:linear-gradient(-45deg,#6DA17D,#6DA17D 50%,#F7FAFC 50%)!important}'
    + '.setsplitdates1 .dateavail.prevdatestay:not(.datestay)'
    + '{background:linear-gradient(-45deg,#F7FAFC,#F7FAFC 50%,#6DA17D 50%)!important}'
    + '.setsplitdates1 .datenotavail.prevdatestay:not(.datestay)'
    + '{background:linear-gradient(-45deg,rgba(200,60,60,.12),rgba(200,60,60,.12) 50%,#6DA17D 50%)!important}'
    + '.datenotavail{background-color:rgba(200,60,60,.10)!important;color:#a04040!important;text-decoration:line-through;opacity:.8}'
    + '.dateavail:hover{background-color:rgba(109,161,125,.15)!important}'
    + '.roomofferpricetable .at_pricetd{pointer-events:none!important;cursor:default!important}'
    + '.roomofferpricetable tr.b24-bookingstrip{display:none!important}';
  document.head.appendChild(dss);

  /* === SECTION 7: Room card enhancement === */
  var ROOM_TAGS = {
    '567218': [{icon:'\uD83D\uDECF',text:'Sleeps 2'},{icon:'\uD83D\uDEBF',text:'Ensuite'},{icon:'\uD83C\uDFD9',text:'City View'},{icon:'\uD83D\uDCBC',text:'Work Desk'},{icon:'\uD83D\uDC51',text:'Premium'}],
    '567220': [{icon:'\uD83D\uDECF',text:'Sleeps 1'},{icon:'\uD83D\uDEBF',text:'Shared Bathroom'},{icon:'\uD83D\uDCBC',text:'Work Desk'},{icon:'\uD83D\uDD12',text:'Private'}],
    '567221': [{icon:'\uD83D\uDECF',text:'Sleeps 2'},{icon:'\uD83D\uDEBF',text:'Shared Bathroom'},{icon:'\uD83D\uDCBC',text:'Work Desk'},{icon:'\uD83D\uDD12',text:'Private'}],
    '567219': [{icon:'\uD83D\uDECF',text:'1 Bed'},{icon:'\uD83D\uDC65',text:'4-Bed Dorm'},{icon:'\uD83C\uDFD9',text:'City View'},{icon:'\uD83D\uDD0C',text:'Power Outlet'},{icon:'\uD83D\uDCA1',text:'Reading Light'}]
  };
  function buildTagsDiv(tags, cls) {
    var c = document.createElement('div'); c.className = cls;
    tags.forEach(function(t) { var b = document.createElement('span'); b.className = 'tnh-tag'; b.textContent = t.icon + ' ' + t.text; c.appendChild(b); });
    return c;
  }
  function enhanceRoomCards() {
    if (!getIsRoomSearch()) return;
    document.querySelectorAll('.b24room').forEach(function(room) {
      if (room.querySelector('.tnh-room-tags')) return;
      var roomId = (room.id || '').replace('roomid', ''), tags = ROOM_TAGS[roomId];
      if (!tags) return;
      var dc = room.querySelector('[id^="collapsedesc"]');
      if (dc) { var dt = dc.querySelector('div:not(.fakelink)'); if (dt) dt.className = 'tnh-desc-text'; }
      var dm = room.querySelector('.b24-room-desc');
      if (dm) dm.appendChild(buildTagsDiv(tags, 'tnh-room-tags'));
      var pb = room.querySelector('.panel-body.b24panel'), off = pb ? pb.querySelector('.offer') : null;
      if (pb && off) pb.insertBefore(buildTagsDiv(tags, 'tnh-room-tags-mobile'), off);
    });
  }

  /* === SECTION 8: Room sorting === */
  function sortRooms() {
    if (!getIsRoomSearch()) return;
    var rooms = document.querySelectorAll('.b24room');
    if (rooms.length < 2) return;
    var parent = rooms[0].parentElement;
    if (!parent || parent.dataset.tnhSorted === 'true') return;
    var sortable = [];
    rooms.forEach(function(room) {
      var offer = room.querySelector('.offer'), price = 999999, unavail = false;
      if (offer) {
        var fd = offer.querySelector('[id^="from-"]');
        if (fd) {
          var dol = fd.querySelector('.bookingpagedollars'), cen = fd.querySelector('.bookingpagecents');
          if (dol && cen) { var d = parseInt(dol.textContent, 10), c = parseInt(cen.textContent.replace('.',''), 10) || 0; if (!isNaN(d)) price = d + c / 100; }
        }
        var w = offer.querySelector('[class*="offerwarndiv"]');
        if (w && !w.classList.contains('hidden')) unavail = true;
      }
      sortable.push({ el: room, price: price, unavailable: unavail });
    });
    if (!sortable.some(function(s) { return s.price < 999999; })) return;
    sortable.sort(function(a, b) {
      if (a.unavailable !== b.unavailable) return a.unavailable ? 1 : -1;
      return a.price - b.price;
    });
    sortable.forEach(function(item) { parent.appendChild(item.el); });
    parent.dataset.tnhSorted = 'true';
  }

  /* === INIT === */
  var isModifying = false;
  function applyFixes() {
    if (isModifying) return;
    isModifying = true;
    try { rebuildOfferBars(); enhanceRoomCards(); sortRooms(); if (isWidget && isEmbedded) send(); } catch(e) {}
    setTimeout(function() { isModifying = false; }, 500);
  }
  function init() {
    applyFixes();
    function attachObserver() {
      if (!document.body) return;
      if (typeof MutationObserver !== 'undefined') {
        var t;
        new MutationObserver(function() {
          if (isModifying) return; clearTimeout(t); t = setTimeout(applyFixes, 300);
        }).observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:['class','style']});
      }
    }
    if (document.body) attachObserver();
    else document.addEventListener('DOMContentLoaded', attachObserver);
    if (isWidget && isEmbedded) {
      window.addEventListener('resize', send);
      document.addEventListener('load', function(e) { if (e.target.tagName === 'IMG') setTimeout(send, 100); }, true);
      var c = 0, iv = setInterval(function() { applyFixes(); if (++c >= 30) clearInterval(iv); }, 1000);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

```


---

## File 6: CSS-base.css

```css
/* CSS-base.css — Beds24 Booking Page External Stylesheet
   Property: Trip'N'Hostel Chill Zone (271142)
   Session 11: Offer bar rebuild + cleanup
   !important: REQUIRED on Beds24/Bootstrap overrides, NOT USED on .tnh-* elements */

:root {
  --b24-color-primary:#E7A35C; --b24-color-secondary:#6DA17D;
  --b24-color-text:#2D482D; --b24-color-text-light:#5a6f5a;
  --b24-color-bg:#F7FAFC; --b24-color-bg-white:#ffffff;
  --b24-color-border:#EDF2F7; --b24-color-accent-hover:#d4923e;
  --b24-font-body:'Lexend',sans-serif; --b24-font-heading:'Lexend Giga',sans-serif;
  --b24-font-size-base:14px; --b24-font-size-sm:13px; --b24-font-size-lg:16px;
  --b24-radius-sm:6px; --b24-radius-md:10px;
  --b24-shadow-sm:0 1px 3px rgba(0,0,0,0.08); --b24-shadow-md:0 4px 12px rgba(0,0,0,0.08);
  --b24-transition:0.2s ease; --b24-space-sm:8px; --b24-space-md:16px;
}


/* === BEDS24 / BOOTSTRAP OVERRIDES (!important required) === */

/* --- Base --- */
.container {
  max-width: 100% !important;
  box-sizing: border-box !important;
}
.colorbody {
  font-family: var(--b24-font-body) !important;
  color: var(--b24-color-text) !important;
  line-height: 1.6;
  background: var(--b24-color-bg) !important;
}
.b24fullcontainer-rooms .container {
  width: 100% !important;
  max-width: 100% !important;
  padding: 0 !important;
}

/* --- Room cards --- */
.b24room { margin-bottom: var(--b24-space-md) !important; }
.b24room:first-child { margin-top: var(--b24-space-md) !important; }
.b24panel-room {
  background: var(--b24-color-bg-white) !important;
  border: 1px solid var(--b24-color-border) !important;
  border-radius: var(--b24-radius-md) !important;
  box-shadow: var(--b24-shadow-sm) !important;
  overflow: hidden;
}
.b24panel-room:hover { box-shadow: var(--b24-shadow-md) !important; }
.b24-roompanel-heading {
  font-family: var(--b24-font-heading) !important;
  font-weight: 600 !important;
  border: none !important;
  background: var(--b24-color-bg-white) !important;
  padding: 12px 16px 4px 16px !important;
  border-bottom: none !important;
}
.at_roomnametext {
  font-family: var(--b24-font-heading) !important;
  font-size: var(--b24-font-size-lg) !important;
  font-weight: 700 !important;
  color: var(--b24-color-text) !important;
}

/* --- Bootstrap reset --- */
.b24panel-room .b24panel .row {
  margin-left: 0 !important;
  margin-right: 0 !important;
}
.b24panel-room .b24panel [class*="col-"] {
  width: auto !important;
  max-width: 100% !important;
  float: none !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
}

/* --- Desktop grid --- */
.b24panel-room > .b24panel {
  display: grid !important;
  grid-template-columns: 120px 1fr !important;
  gap: 0 var(--b24-space-md) !important;
  padding: 8px 16px 12px 16px !important;
  align-items: stretch !important;
}
.b24panel-room > .b24panel > .row:has(.b24-room-slider) {
  grid-column: 1 !important;
  grid-row: 1 !important;
  margin: 0 !important;
  padding: 0 !important;
}
.b24panel-room > .b24panel > .row:has(.b24-room-desc) {
  grid-column: 2 !important;
  grid-row: 1 !important;
  margin: 0 !important;
  padding: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: space-between !important;
}
.b24panel-room > .b24panel > .offer {
  grid-column: 1 / -1 !important;
  grid-row: 3 !important;
  padding: 8px 0 0 0 !important;
  margin: 8px 0 0 0 !important;
  border-top: 1px solid var(--b24-color-border) !important;
}
.b24panel-room > .b24panel > .clearfix { display: none !important; }

/* --- Thumbnail --- */
.b24panel-room .b24panel .b24-room-slider {
  width: 120px !important;
  max-width: 120px !important;
  padding: 0 !important;
  float: none !important;
}
.b24-room-slider .carousel,
.carousel.slide {
  border-radius: var(--b24-radius-sm) !important;
  overflow: hidden !important;
  height: 90px !important;
  max-height: 90px !important;
  min-height: 90px !important;
  width: 120px !important;
}
.carousel .item { display: none; }
.carousel .item.active { display: block !important; }
.b24-room-slider .carousel .item.active img,
[id^="collapseslider"] .carousel .item.active img,
.carousel img, .carousel .item img {
  width: 120px !important;
  height: 90px !important;
  object-fit: cover !important;
}
.carousel-control { display: none !important; }
.carousel-indicators { display: none !important; }

/* --- Description module --- */
.b24panel-room .b24panel .b24-room-desc {
  width: 100% !important;
  max-width: 100% !important;
  padding: 0 !important;
  float: none !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: space-between !important;
  height: 100% !important;
}
[id^="collapsedesc"] { display: block !important; height: auto !important; }
[id^="collapseslider"] { display: block !important; height: auto !important; }

/* --- Offer section: hide Beds24 elements --- */
.b24-offer-pricetable { display: none !important; }
.b24-offer-select { display: none !important; }
.offer > div > .row {
  display: block !important;
  width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* Moved pricebox inside our bar: override Beds24 styles on its internals */
.tnh-offer-controls .b24-multipricebox {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
}
.tnh-offer-controls .b24-multipricebox [id^="from-"] { display: none !important; }
.tnh-offer-controls .b24-multipricebox .form-inline {
  display: flex !important;
  align-items: center !important;
  gap: var(--b24-space-sm) !important;
}
.tnh-offer-controls .roomofferqtyselectlabel { display: none !important; }

/* Per-occupancy leakage guard */
.b24-multipricebox.hidden { display: none !important; }

/* Form selects (Beds24 elements) */
select[id^="sr1-"],
select[id^="naa"] {
  border: 1.5px solid var(--b24-color-border) !important;
  border-radius: var(--b24-radius-sm) !important;
  padding: 4px 8px !important;
  font-family: var(--b24-font-body) !important;
  font-size: var(--b24-font-size-sm) !important;
  color: var(--b24-color-text) !important;
  background: var(--b24-color-bg-white) !important;
}
/* Dorm guest select: globally hidden, force-shown inside our bar */
select[id^="naa"] { display: none !important; }
.tnh-offer-controls select[id^="naa"] {
  display: inline-block !important;
  visibility: visible !important;
}

/* --- Hide Beds24 elements --- */
.b24-room-106 { display: none !important; }
.fakelink { display: none !important; }
.at_offername { display: none !important; }
.offer hr { display: none !important; }
[id^="price-"][class*="b24-roomprice"] { display: none !important; }
a[href="#topofthebookingpage"] { display: none !important; }

/* --- Font overrides (must beat Beds24 inline styles) --- */
.colorbody { font-family: 'Lexend', sans-serif !important; }
h1, h2, h3, h4, h5, h6,
.at_roomnametext,
.b24-roompanel-heading {
  font-family: 'Lexend Giga', sans-serif !important;
}


/* === OUR ELEMENTS — no !important === */

/* --- Description text ---
   Lives inside Beds24 DOM — layout props need !important */
.tnh-desc-text {
  font-size: 13px;
  color: var(--b24-color-text-light);
  line-height: 1.4;
  margin: 0 0 6px 0 !important;
  display: -webkit-box !important;
  -webkit-line-clamp: 2 !important;
  -webkit-box-orient: vertical !important;
  overflow: hidden !important;
  text-overflow: ellipsis;
}

/* --- Room tags ---
   Lives inside Beds24 DOM — layout props need !important */
.tnh-room-tags {
  display: flex !important;
  flex-wrap: wrap !important;
  gap: 6px;
  margin: 0 !important;
}
.tnh-room-tags-mobile { display: none !important; }
.tnh-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  font-weight: 500;
  color: #2D482D;
  background: #f0f5f0;
  border: 1px solid #d4e0d4;
  border-radius: 4px;
  padding: 2px 8px;
  white-space: nowrap;
  line-height: 1.4;
}

/* --- Offer bar ---
   Layout properties use !important to survive Bootstrap .row context.
   Decorative properties (color, font, padding) do not. */
.tnh-offer-bar {
  display: flex !important;
  align-items: center !important;
  gap: 12px;
  width: 100% !important;
  min-height: 36px;
}
.tnh-offer-price {
  font-size: var(--b24-font-size-sm);
  font-weight: 500;
  color: var(--b24-color-text-light);
  white-space: nowrap;
  flex-shrink: 0;
}
.tnh-offer-controls {
  display: flex !important;
  align-items: center !important;
  gap: 8px;
  margin-left: auto !important;
  flex-shrink: 0;
}
.tnh-offer-label {
  font-size: var(--b24-font-size-sm);
  font-weight: 500;
  color: var(--b24-color-text-light);
  white-space: nowrap;
}
.tnh-dorm-select-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.tnh-total-price {
  font-size: 15px;
  font-weight: 700;
  color: var(--b24-color-text);
  white-space: nowrap;
}
.tnh-book-btn {
  display: inline-block;
  padding: 8px 24px;
  font-family: inherit;
  font-size: var(--b24-font-size-base);
  font-weight: 600;
  color: #fff;
  background: var(--b24-color-primary);
  border: none;
  border-radius: var(--b24-radius-sm);
  cursor: pointer;
  transition: background var(--b24-transition);
  flex-shrink: 0;
}
.tnh-book-btn:hover { background: var(--b24-color-accent-hover); }

/* --- Unavailable state --- */
.tnh-unavailable {
  font-size: var(--b24-font-size-sm);
  color: #a04040;
  background: rgba(200, 60, 60, 0.08);
  border: 1px solid rgba(200, 60, 60, 0.2);
  border-radius: var(--b24-radius-sm);
  padding: 6px 12px;
  text-align: center;
  width: 100%;
}


/* === MOBILE (<=767px) === */
@media (max-width: 767px) {
  /* Beds24/Bootstrap overrides */
  .b24fullcontainer-rooms .container { padding: 0 12px !important; }
  .b24-roompanel-heading { padding: 12px 16px 4px 16px !important; }
  .at_roomnametext { font-size: 15px !important; }
  .b24panel-room > .b24panel {
    display: flex !important;
    flex-direction: column !important;
    padding: 12px 16px 16px 16px !important;
  }
  .b24panel-room .b24panel .b24-room-slider { width: 90px !important; max-width: 90px !important; }
  .b24-room-slider .carousel,
  .carousel.slide {
    width: 90px !important;
    height: 68px !important;
    max-height: 68px !important;
    min-height: 68px !important;
  }
  .b24-room-slider .carousel .item.active img,
  [id^="collapseslider"] .carousel .item.active img,
  .carousel img, .carousel .item img {
    width: 90px !important;
    height: 68px !important;
  }
  .b24panel-room > .b24panel > .row:has(.b24-room-slider) { order: 0 !important; margin: 0 !important; padding: 0 !important; }
  .b24panel-room > .b24panel > .row:has(.b24-room-desc) {
    order: 1 !important;
    margin: -78px 0 0 100px !important;
    padding: 0 !important;
    display: block !important;
  }
  .b24panel-room .b24panel .b24-room-desc { height: auto !important; justify-content: flex-start !important; }
  .b24panel-room > .b24panel > .clearfix { display: none !important; }
  .b24panel-room > .b24panel > .offer {
    order: 3 !important;
    padding: 10px 0 0 0 !important;
    margin: 0 !important;
    border-top: 1px solid var(--b24-color-border) !important;
    width: 100% !important;
  }

  /* Our elements inside Beds24 DOM — layout props need !important */
  .tnh-desc-text { -webkit-line-clamp: unset !important; display: block !important; font-size: 12px; margin: 0 !important; }
  .b24-room-desc .tnh-room-tags { display: none !important; }
  .tnh-room-tags-mobile {
    display: flex !important;
    flex-wrap: wrap !important;
    gap: 6px;
    order: 2 !important;
    padding: 8px 0;
    margin: 10px 0 0 0;
  }
  .tnh-offer-bar { flex-wrap: wrap !important; gap: 6px; }
  .tnh-offer-price { width: 100% !important; font-size: 12px; }
  .tnh-offer-controls { width: 100% !important; margin-left: 0 !important; }
  .tnh-total-price { font-size: 14px; margin-left: auto !important; }
  .tnh-tag { font-size: 11px; padding: 1px 6px; }
}

```


---

## File 7: booking-widget.js

```javascript
/*
 * Trip'N'Hostel Booking Widget
 * Stable filename — cache-busted via Date.now() in script tag.
 * Self-injecting — just add <div id="tnh-booking-root"></div> and load this script.
 * CONFIG is set per-property at the top.
 */
(function() {
  var CONFIG = {
    ownerid: '141266',
    propid:  '271142',
    cssfile: 'https://astrongpresence.com/CSS-base.css',
    minNights: 2,
    maxNights: 90,
    defaultNights: 2,
    primaryColor: '#E7A35C',
    secondaryColor: '#6DA17D',
    textColor: '#2D482D',
    textLight: '#5a7a5a',
    bgColor: '#F7FAFC',
    borderColor: '#d4e0d4',
    secondaryHover: '#5b8d6a',
    fontBody: "'Lexend', sans-serif",
    fontHeading: "'Lexend Giga', sans-serif",
    fontsUrl: 'https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600&family=Lexend+Giga:wght@400;600&display=swap'
  };

  /* ---- Inject Google Fonts ---- */
  var fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = CONFIG.fontsUrl;
  document.head.appendChild(fontLink);

  /* ---- Inject CSS ---- */
  var css = ''
    + '.tnh-booking-widget{'
    +   '--tnh-secondary:' + CONFIG.secondaryColor + ';'
    +   '--tnh-text:' + CONFIG.textColor + ';'
    +   '--tnh-text-light:' + CONFIG.textLight + ';'
    +   '--tnh-bg:' + CONFIG.bgColor + ';'
    +   '--tnh-border:' + CONFIG.borderColor + ';'
    +   '--tnh-secondary-hover:' + CONFIG.secondaryHover + ';'
    +   'font-family:' + CONFIG.fontBody + ';'
    +   'color:var(--tnh-text);max-width:700px;margin:0 auto;padding:0;box-sizing:border-box;'
    + '}'
    + '.tnh-booking-widget *{box-sizing:border-box}'
    + '.tnh-booking-card{background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(45,72,45,.08);padding:28px 28px 24px;border:1px solid var(--tnh-border)}'
    + '.tnh-booking-title{font-family:' + CONFIG.fontHeading + ';font-weight:600;font-size:18px;letter-spacing:-.01em;margin:0 0 4px;color:var(--tnh-text)}'
    + '.tnh-min-stay{display:block;font-size:13px;font-weight:400;color:var(--tnh-text-light);margin:0 0 16px;line-height:1.4}'
    + '.tnh-booking-fields{display:grid;grid-template-columns:1fr 1fr;gap:14px}'
    + '.tnh-field{display:flex;flex-direction:column;gap:5px}'
    + '.tnh-field-full{grid-column:1/-1}'
    + '.tnh-label{font-size:12px;font-weight:500;color:var(--tnh-text-light);text-transform:uppercase;letter-spacing:.05em}'
    + '.tnh-input{font-family:' + CONFIG.fontBody + ';font-size:15px;font-weight:400;color:var(--tnh-text);background:var(--tnh-bg);border:1.5px solid var(--tnh-border);border-radius:8px;padding:10px 12px;outline:none;transition:border-color .2s,box-shadow .2s;-webkit-appearance:none;appearance:none;width:100%}'
    + '.tnh-input:focus{border-color:var(--tnh-secondary);box-shadow:0 0 0 3px rgba(109,161,125,.15)}'
    + '.tnh-select-wrap{position:relative}'
    + '.tnh-select-wrap::after{content:"";position:absolute;right:12px;top:50%;transform:translateY(-50%);width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid var(--tnh-text-light);pointer-events:none}'
    + '.tnh-select-wrap select.tnh-input{padding-right:32px;cursor:pointer}'
    + '.tnh-search-btn{grid-column:1/-1;font-family:' + CONFIG.fontHeading + ';font-size:15px;font-weight:600;letter-spacing:.02em;color:#fff;background:var(--tnh-secondary);border:none;border-radius:8px;padding:13px 24px;margin-top:4px;cursor:pointer;transition:background .2s,box-shadow .2s,transform .1s;display:flex;align-items:center;justify-content:center;gap:8px}'
    + '.tnh-search-btn:hover{background:var(--tnh-secondary-hover);box-shadow:0 4px 20px rgba(45,72,45,.14)}'
    + '.tnh-search-btn:active{transform:scale(.985)}'
    + '.tnh-search-btn svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}'
    + '.tnh-error{grid-column:1/-1;font-size:13px;color:#c0392b;background:#fdf0ef;border-radius:6px;padding:8px 12px;display:none}'
    + '.tnh-error.visible{display:block}'
    + '.tnh-results{display:none;margin-top:16px;position:relative}'
    + '.tnh-results.open{display:block}'
    + '.tnh-results-header{display:flex;flex-direction:column;align-items:center;gap:8px;margin-bottom:10px;padding:0 2px}'
    + '.tnh-results-summary{font-size:14px;font-weight:500;color:var(--tnh-text-light);text-align:center}'
    + '.tnh-results-close{font-family:' + CONFIG.fontBody + ';font-size:13px;font-weight:500;color:var(--tnh-text-light);background:none;border:1.5px solid var(--tnh-border);border-radius:6px;padding:5px 12px;cursor:pointer;transition:border-color .2s,color .2s}'
    + '.tnh-results-close:hover{border-color:var(--tnh-text-light);color:var(--tnh-text)}'
    + '.tnh-results-frame-wrap{border:1px solid var(--tnh-border);border-radius:12px;overflow:hidden;background:#fff}'
    + '.tnh-results-frame{width:100%;border:none;display:block;min-height:0;transition:height .3s ease}'
    + '.tnh-loading{display:none;align-items:center;justify-content:center;gap:10px;padding:40px 20px;font-size:14px;font-weight:400;color:var(--tnh-text-light)}'
    + '.tnh-loading.visible{display:flex}'
    + '.tnh-spinner{width:20px;height:20px;border:2.5px solid var(--tnh-border);border-top-color:var(--tnh-secondary);border-radius:50%;animation:tnh-spin .7s linear infinite}'
    + '@keyframes tnh-spin{to{transform:rotate(360deg)}}'
    + '@media(max-width:480px){'
    +   '.tnh-booking-card{padding:20px 18px 18px}'
    +   '.tnh-booking-fields{grid-template-columns:1fr}'
    +   '.tnh-field-full,.tnh-search-btn,.tnh-error{grid-column:1}'
    +   '.tnh-results-frame-wrap{border-radius:8px}'
    +   '.tnh-results-summary{font-size:12px}'
    + '}';

  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ---- Inject HTML ---- */
  var root = document.getElementById('tnh-booking-root');
  if (!root) return;

  root.innerHTML = ''
    + '<div class="tnh-booking-widget">'
    +   '<div class="tnh-booking-card">'
    +     '<h3 class="tnh-booking-title">Check Availability</h3>'
    +     '<span class="tnh-min-stay">Minimum stay: ' + CONFIG.minNights + ' nights</span>'
    +     '<div class="tnh-booking-fields">'
    +       '<div class="tnh-field">'
    +         '<span class="tnh-label">Check In</span>'
    +         '<input type="date" id="tnh-checkin" class="tnh-input" />'
    +       '</div>'
    +       '<div class="tnh-field">'
    +         '<span class="tnh-label">Check Out</span>'
    +         '<input type="date" id="tnh-checkout" class="tnh-input" />'
    +       '</div>'
    +       '<div class="tnh-field tnh-field-full">'
    +         '<span class="tnh-label">Guests</span>'
    +         '<div class="tnh-select-wrap">'
    +           '<select id="tnh-guests" class="tnh-input">'
    +             '<option value="1" selected>1 Guest</option>'
    +             '<option value="2">2 Guests</option>'
    +             '<option value="3">3 Guests</option>'
    +             '<option value="4">4 Guests</option>'
    +             '<option value="5">5 Guests</option>'
    +             '<option value="6">6 Guests</option>'
    +           '</select>'
    +         '</div>'
    +       '</div>'
    +       '<div class="tnh-error" id="tnh-error"></div>'
    +       '<button type="button" class="tnh-search-btn" id="tnh-search-btn">'
    +         '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'
    +         'Search Rooms'
    +       '</button>'
    +     '</div>'
    +   '</div>'
    +   '<div class="tnh-results" id="tnh-results">'
    +     '<div class="tnh-results-header">'
    +       '<span class="tnh-results-summary" id="tnh-results-summary"></span>'
    +       '<button type="button" class="tnh-results-close" id="tnh-results-close">Clear Search</button>'
    +     '</div>'
    +     '<div class="tnh-loading" id="tnh-loading">'
    +       '<div class="tnh-spinner"></div>'
    +       '<span>Loading available rooms\u2026</span>'
    +     '</div>'
    +     '<div class="tnh-results-frame-wrap">'
    +       '<iframe id="tnh-results-frame" class="tnh-results-frame" scrolling="no" allowtransparency="true"></iframe>'
    +     '</div>'
    +   '</div>'
    + '</div>';

  /* ---- Wire up logic ---- */
  var checkinEl  = document.getElementById('tnh-checkin');
  var checkoutEl = document.getElementById('tnh-checkout');
  var guestsEl   = document.getElementById('tnh-guests');
  var errorEl    = document.getElementById('tnh-error');
  var searchBtn  = document.getElementById('tnh-search-btn');
  var resultsEl  = document.getElementById('tnh-results');
  var summaryEl  = document.getElementById('tnh-results-summary');
  var closeBtn   = document.getElementById('tnh-results-close');
  var loadingEl  = document.getElementById('tnh-loading');
  var iframeEl   = document.getElementById('tnh-results-frame');

  /* Track current page and search details for summary updates */
  var currentPage = 'rooms';
  var searchSummaryText = '';

  function formatDateBeds24(d) {
    var y = d.getFullYear();
    var m = ('0' + (d.getMonth() + 1)).slice(-2);
    var day = ('0' + d.getDate()).slice(-2);
    return y + m + day;
  }

  function formatDateDisplay(d) {
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  }

  function toInputDate(d) {
    var y = d.getFullYear();
    var m = ('0' + (d.getMonth() + 1)).slice(-2);
    var day = ('0' + d.getDate()).slice(-2);
    return y + '-' + m + '-' + day;
  }

  function daysBetween(a, b) {
    return Math.round((b.getTime() - a.getTime()) / 86400000);
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.add('visible');
  }

  function clearError() {
    errorEl.classList.remove('visible');
    errorEl.textContent = '';
  }

  /* Defaults */
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  var defaultOut = new Date(tomorrow);
  defaultOut.setDate(defaultOut.getDate() + CONFIG.defaultNights);

  checkinEl.min = toInputDate(tomorrow);
  checkinEl.value = toInputDate(tomorrow);
  checkoutEl.min = toInputDate(new Date(tomorrow.getTime() + CONFIG.minNights * 86400000));
  checkoutEl.value = toInputDate(defaultOut);

  /* Date events */
  checkinEl.addEventListener('change', function() {
    clearError();
    if (checkinEl.value) {
      var cin = new Date(checkinEl.value + 'T00:00:00');
      var minOut = new Date(cin);
      minOut.setDate(minOut.getDate() + CONFIG.minNights);
      checkoutEl.min = toInputDate(minOut);
      if (!checkoutEl.value || new Date(checkoutEl.value + 'T00:00:00') <= cin) {
        checkoutEl.value = toInputDate(minOut);
      }
    }
  });

  checkoutEl.addEventListener('change', function() {
    clearError();
  });

  /* Iframe height sync + page change handling */
  var roomsReady = false;

  window.addEventListener('message', function(e) {
    if (!e.origin || e.origin.indexOf('beds24.com') === -1) return;
    var data;
    try { data = (typeof e.data === 'string') ? JSON.parse(e.data) : e.data; } catch(err) { return; }

    if (data && data.type === 'tnh-height' && typeof data.height === 'number') {
      var h = Math.max(data.height + 20, 200);
      iframeEl.style.height = h + 'px';

      /* Hide loading spinner once content has rendered (height > threshold) */
      var threshold = (currentPage === 'rooms') ? 500 : 300;
      if (h > threshold && !roomsReady) {
        roomsReady = true;
        loadingEl.classList.remove('visible');
        iframeEl.style.opacity = '1';
        iframeEl.style.position = 'static';
        iframeEl.style.pointerEvents = '';

        /* Scroll to top of results after page transition reveals content */
        if (currentPage !== 'rooms') {
          setTimeout(function() {
            resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 50);
        }
      }
    }

    if (data && data.type === 'tnh-page-change') {
      currentPage = data.page || 'unknown';

      /* Show loading spinner during transition */
      roomsReady = false;
      loadingEl.querySelector('span').textContent =
        currentPage === 'checkout' ? 'Loading booking form\u2026' :
        currentPage === 'confirmation' ? 'Loading confirmation\u2026' :
        'Loading\u2026';
      loadingEl.classList.add('visible');
      iframeEl.style.opacity = '0';
      iframeEl.style.position = 'absolute';
      iframeEl.style.pointerEvents = 'none';

      /* Update summary bar */
      if (currentPage === 'checkout') {
        summaryEl.textContent = 'Complete your booking details';
        closeBtn.textContent = 'Cancel';
      } else if (currentPage === 'confirmation') {
        summaryEl.textContent = 'Booking confirmed!';
        closeBtn.style.display = 'none';
      }

      /* Scroll to top of results area */
      setTimeout(function() {
        resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

      /* Fallback: if height messages don't arrive within 5s, show anyway */
      setTimeout(function() {
        if (!roomsReady) {
          roomsReady = true;
          loadingEl.classList.remove('visible');
          iframeEl.style.opacity = '1';
          iframeEl.style.position = 'static';
          iframeEl.style.pointerEvents = '';
          if (!iframeEl.style.height || iframeEl.style.height === '1px') {
            iframeEl.style.height = '1200px';
          }
          resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 5000);
    }
  });

  /* Show/hide results */
  function showResults(cin, cout, nights, guests) {
    searchSummaryText = formatDateDisplay(cin) + ' \u2192 ' + formatDateDisplay(cout)
      + ' \u00b7 ' + nights + (nights === 1 ? ' night' : ' nights')
      + ' \u00b7 ' + guests + (parseInt(guests) === 1 ? ' guest' : ' guests');
    summaryEl.textContent = searchSummaryText;

    currentPage = 'rooms';
    closeBtn.textContent = 'Clear Search';
    closeBtn.style.display = '';

    loadingEl.querySelector('span').textContent = 'Loading available rooms\u2026';
    loadingEl.classList.add('visible');
    iframeEl.style.opacity = '0';
    iframeEl.style.position = 'absolute';
    iframeEl.style.pointerEvents = 'none';
    iframeEl.style.display = 'block';
    iframeEl.style.height = '1px';
    roomsReady = false;

    resultsEl.classList.add('open');

    var url = 'https://www.beds24.com/booking2.php'
      + '?ownerid=' + CONFIG.ownerid
      + '&propid=' + CONFIG.propid
      + '&checkin=' + formatDateBeds24(cin)
      + '&numnight=' + nights
      + '&numadult=' + guests
      + '&referer=widget'
      + '&cssfile=' + encodeURIComponent(CONFIG.cssfile + '?v=' + Date.now());

    iframeEl.onload = function() {
      /* Fallback: if no height message arrives after 8s, show iframe anyway */
      setTimeout(function() {
        if (!roomsReady) {
          roomsReady = true;
          loadingEl.classList.remove('visible');
          iframeEl.style.opacity = '1';
          iframeEl.style.position = 'static';
          iframeEl.style.pointerEvents = '';
          if (!iframeEl.style.height || iframeEl.style.height === '1px') {
            iframeEl.style.height = '2400px';
          }
        }
      }, 8000);
    };

    iframeEl.src = url;

    setTimeout(function() {
      resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  }

  function hideResults() {
    resultsEl.classList.remove('open');
    iframeEl.src = '';
    iframeEl.style.opacity = '0';
    iframeEl.style.position = 'absolute';
    iframeEl.style.pointerEvents = 'none';
    iframeEl.style.height = '1px';
    loadingEl.classList.remove('visible');
    currentPage = 'rooms';
    closeBtn.textContent = 'Clear Search';
    closeBtn.style.display = '';
    summaryEl.textContent = searchSummaryText;
  }

  closeBtn.addEventListener('click', hideResults);

  /* Search */
  searchBtn.addEventListener('click', function() {
    clearError();
    if (!checkinEl.value || !checkoutEl.value) {
      showError('Please select your check-in and check-out dates.');
      return;
    }
    var cin = new Date(checkinEl.value + 'T00:00:00');
    var cout = new Date(checkoutEl.value + 'T00:00:00');
    var nights = daysBetween(cin, cout);
    if (nights < CONFIG.minNights) {
      showError('Minimum stay is ' + CONFIG.minNights + ' nights.');
      return;
    }
    if (nights > CONFIG.maxNights) {
      showError('Maximum stay is ' + CONFIG.maxNights + ' nights.');
      return;
    }
    if (cin <= today) {
      showError('Check-in must be a future date.');
      return;
    }
    showResults(cin, cout, nights, guestsEl.value);
  });
})();

```


---

## File 8: docs/session-handoff-10.md

# Session 10 Handoff — Beds24 Booking Page

## Date: 2026-04-17

## Summary

Major infrastructure session. Established CI/CD pipeline, fixed mobile layout root causes, iterated on offer bar alignment (hit a complexity wall), conducted adversarial review, and scoped an offer-bar rebuild as the path forward.

## What Was Accomplished

### CI/CD Pipeline (new)
- GitHub Actions auto-deploys `CSS-base.css`, `beds24-iframe-helper.js`, `booking-widget.js` to VPS on push to `main`
- SSH key auth from GitHub to VPS (port 5771)
- Stable filenames — no more versioned files or reference updates
- `Date.now()` bootstrapper in Beds24 `customhead` field and WordPress Custom HTML block — zero cache issues, never needs updating
- Repo: `https://github.com/TripN-Chill-Zone/booking-page` (public)

### Mobile Layout Fixes
- **iOS Safari iframe viewport expansion** — root cause identified and fixed. Bootstrap `.container` fixed widths expanded the iframe beyond phone screen. Fix: `.container{max-width:100%}` injected by helper.
- **Thumbnail specificity** — Bootstrap reset was overriding slider width. Fixed by bumping component selectors to 3-class specificity.
- **Card padding** — increased to 12px/16px on mobile for breathing room.
- **Side margins** — added 12px padding on room container for mobile.
- **"Up" button** — hidden via `a[href="#topofthebookingpage"]` CSS rule.

### Room Content (Beds24 admin)
- All 4 room descriptions updated to approved short versions from session 9 handoff.
- Double Room title changed to "Double Room with Shared Bathroom".
- Room order set to "Cheapest First" in Beds24 admin (didn't take effect — JS sorting handles it instead).

### Room Sorting (new)
- `sortRooms()` function reads prices from DOM at runtime.
- Available rooms sorted cheapest first, unavailable pushed to bottom.
- Uses DOM reordering on `.b24room` elements (not CSS order — Beds24 puts all rooms in one wrapper).
- Known issue: `tnhSorted` marker doesn't reset on AJAX re-render (low priority since widget reloads iframe entirely).

### Offer Bar (current state — to be rebuilt)
- Multiple CSS iterations failed to reliably align Book button right across all states and browsers.
- `tnh-offer-row` wrapper was added as a structural fix but still doesn't work consistently on mobile.
- Price display logic: "from" price should always be visible, total only after qty selection — partially working.
- **Decision: rebuild the offer bar with our own markup** (see plan below).

### Adversarial Review
- Full card rebuild was proposed, reviewed, and scoped down to offer-bar-only.
- Event listener audit: qty select has 2 direct jQuery change handlers, preserved on DOM move (verified).
- Panel-body hide experiment: `display:none` doesn't break form submission (verified).
- Review document: `docs/card-rebuild-proposal-review.md`

## Current File Versions on VPS
- `CSS-base.css` — stable filename, deployed via CI/CD
- `beds24-iframe-helper.js` — stable filename, deployed via CI/CD
- `booking-widget.js` — stable filename, deployed via CI/CD

## Current Beds24 Admin State
- **"Insert in HTML <HEAD> bottom"**: `Date.now()` bootstrapper loading `beds24-iframe-helper.js`
- **"Custom CSS" (bookingcss)**: critical CSS + variable overrides (unchanged from session 9)
- **"Insert in HTML <HEAD> top"**: Google Fonts link tag (unchanged)
- **Room Order**: "Cheapest First" (but doesn't take effect — JS sorting overrides)
- **Multiple Room Booking**: Enabled

## Current WordPress State
- Custom HTML block: `Date.now()` bootstrapper loading `booking-widget.js`

## NEXT SESSION: Offer Bar Rebuild

### Documents to provide
1. `docs/offer-bar-rebuild-plan.md` — the implementation plan (14 steps with acceptance criteria)
2. `docs/card-rebuild-proposal-review.md` — adversarial review with rationale
3. `docs/card-rebuild-proposal.md` — background context
4. Standard project docs from repo (execution plan, context, DOM structure, gotchas, CSS architecture, admin guide)
5. Current source files from repo root

### Key facts for the implementing session
- **Check A answer: A1.** Widget reloads the iframe entirely on every search. No in-iframe date changes possible. Skip Check B.
- **Event listeners survive moves.** jQuery stores handlers via expando on the element. Verified experimentally.
- **Move `.b24-multipricebox` as a whole unit**, not the bare `<select>`. Preserves `.closest()` traversals.
- **Fail loud.** This is a dev site with no external audience. Let things break visibly.
- **Design target: Hostelworld-dense.** Don't over-space. The mockup v13 density is correct.

### Success criteria
- Offer bar alignment consistent across all 4 rooms and all 3 states
- CSS under 390 lines, helper under 500 lines, `!important` count under 30
- No regressions in sorting, tags, dorm booking, iframe height sync, checkout
- Mobile layout matches mockup v13 without hacks

## Deferred Issues (not for next session)

### Confirmation/Checkout Page
- Multi-room booking: customer info fields cut off by large room images
- Orange back button causes Beds24 date/booking strip to reappear
- Back button behavior inconsistent (sometimes freezes, sometimes loads with Beds24 chrome)

### Load Time
- 10-second load time on mobile — may improve with offer bar rebuild reducing observer churn
- Investigate if the `Date.now()` bootstrapper adds latency vs. static script tag

### Documentation Outdated
- `SKILL.md` describes non-iframe architecture ("NOT embedded in an iframe") — needs updating for iframe model
- `SKILL.md` guest flow, CSS architecture sections, and setup checklist don't reflect widget/iframe/CI-CD workflow
- `dom-structure.md` doesn't document the `#selectors1-{roomId}` wrapper or the all-rooms-in-one-wrapper AJAX behavior
- `css-architecture.md` doesn't reflect stable filenames or `Date.now()` cache busting
- `gotchas.md` needs iOS Safari iframe viewport expansion entry
- `gotchas.md` needs entry about jQuery expando event preservation on DOM moves
- `session-handoff-9.md` is now superseded by this document

## GitHub Repo
- URL: `https://github.com/TripN-Chill-Zone/booking-page`
- Public (changed this session)
- CI/CD: `.github/workflows/deploy.yml`
- Deploy secrets: `VPS_HOST`, `VPS_PORT`, `VPS_PATH`, `VPS_SSH_KEY`



---

## Commit history

Last 30 commits on main:

```
85f160a test: remove credential check file
f9bba97 Merge branch 'main' of https://github.com/TripN-Chill-Zone/booking-page
f7bfc84 test: verify credentials
57438d1 Add mirror-controls proposal for adversarial review
753a036 Revert slider row overflow:hidden - was not the cause of tag overlap
f5a2b6c Fix tags/thumbnail overlap and offer bar alignment
4a7c730 CSS cleanup: strip !important from .tnh-* rules, remove dead code
091a83c Fix dorm guest select placeholder: 'Beds' -> '-'
81bbd55 Fix offer bar: price calculation, alignment, dorm tag, thumbnail overflow
14d6570 Offer bar rebuild: replace Sections 3+4+6 with unified rebuildOfferBars()
420dd06 Add first-session setup instructions to CLAUDE.md
7f339cd Final doc updates: CLAUDE.md rewrite, fix stale references
df378ac Update outdated docs with Session 10 discoveries
14f7c0f Session 10 handoff: review docs, rebuild plan, session notes
8c8998a Add card rebuild proposal for adversarial review
9673320 Add card rebuild proposal for adversarial review
2cfc53e Fix offer bar alignment: explicit .tnh-offer-row wrapper
58e4690 Force full width on entire offer chain for mobile
be3023d Fix mobile offer bar: Select left, Book right on same line
979ad0f Fix price display: from-price always visible, total only after qty selection
35490b3 Fix room sorting: DOM reorder instead of CSS order
71906b3 Add room sorting: cheapest first, unavailable at bottom
501597d Fix total price disappearing after qty selection
1041318 Fix book-group alignment after qty selection, add top margin on first card
2bfa8b6 Hide Up button, add mobile side margins for room cards
cb85859 Fix mobile layout issues: unavailable rooms, price alignment, card padding
e74f5c9 Merge branch 'main' of https://github.com/TripN-Chill-Zone/booking-page
e2bb8f4 Archive old versioned files, add mockup v13 and session 9 handoff
9f424b2 Add CI/CD: stable-named deploy files + GitHub Action
3ba770c Session 7: helper v14, widget v6, CSS v3 - fix deployment, loading delay, dorm layout, price leak, date strip, color swap, UX polish
```
