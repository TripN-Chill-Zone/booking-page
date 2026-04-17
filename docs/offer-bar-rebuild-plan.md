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
