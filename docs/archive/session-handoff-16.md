# Session 16 Handoff

**Date:** 2026-04-24  
**Previous session:** Session 15b (Claude Code Opus 4.7) — diagnostic only  
**This handoff:** Replaces session-handoff-15.md as the current state of the project.

---

## Read these first, in order

1. `docs/retrospective.md` — Active Rules section. Takes precedence
   over anything in this handoff if in conflict.
2. This document.
3. `docs/skill/SKILL.md` — working discipline.
4. `docs/mockup.html` — design source of truth for the frontend.
5. `docs/diagnostic-book-button.md` — **read this before writing any code for the Book button fix.**

When you need them: `docs/skill/dom-structure.md`,
`docs/skill/helper-js-architecture.md`,
`docs/skill/gotchas.md`.

---

## What was done this session

**Single task: diagnose why the Book button moves to a lower row on mobile.**

No code changes. No deployments. No Beds24 admin changes.

The diagnostic was conducted on the direct Beds24 booking URL
(`beds24.com/booking2.php?ownerid=141266&propid=271142&cssfile=...`)
with mobile CSS injected unconditionally and the offer container
constrained to 334px (the expected mobile container width). The
bug was visually reproduced and the root cause was identified.

### Key findings (full details in `docs/diagnostic-book-button.md`)

**Root cause:** When qty changes from 0 to 1 (or any positive value),
Beds24's jQuery handler synchronously removes `.hidden` from
`#divroom{roomId}offer1select1.b24-multipricebox` — a per-occupancy
price box that our CSS previously kept invisible via `.b24-multipricebox.hidden { display:none }`.

Once `.hidden` is removed, this element becomes a second `.b24-multipricebox`
visible inside `#selectors1-{roomId}`. Our CSS gives ALL `.b24-multipricebox`
elements `flex:1`, so the two boxes split the available width equally
(~167px each instead of ~334px). At 167px, the flex-wrap layout can no
longer fit `.form-inline + .tnh-total-price + .tnh-book-btn` on one row
(they need 285px combined). `.tnh-total-price` and `.tnh-book-btn` wrap
to a third row. The bug is reproduced.

**What was ruled out (with measurement):**
- The `.hidden` toggle on `#from-1-{roomId}` is NOT the cause. The from-div
  has `display:block !important` as an inline style, which overrides Bootstrap's
  `.hidden { display:none !important }`. The from-div never actually hides.
- `display:contents` on `.tnh-offer-row` is NOT the cause. Children are
  correctly promoted as flex items in desktop Chrome.
- `tnh-total-price` appearing is NOT the cause. It is already visible at
  qty=0 due to a secondary bug (naa select fallback in Section 6 — see below).
- No structural DOM mutations occur on qty change. The priceBox children
  are never added or removed. The bug is pure CSS layout, triggered by
  a width change.

**Affected rooms:** Only rooms with Per Occupancy Pricing in Beds24
(3 per-occupancy boxes, 4 total). Room 567221 (Double Room with Shared
Bathroom) confirmed affected. Room 567218 (Deluxe King Suite) — 1
per-occupancy box, not affected. Dorm (567219) — different structure,
helper handles it separately.

### Note: Chrome tab still open

`window.close()` was blocked by Chrome security (the tab was not
opened by a script). The Beds24 diagnostic tab should be manually
closed before beginning Session 16.

---

## Current project state

### What's good

- Frontend is at Attempt 3 baseline (reverted from Attempt 4 in Session 15a).
- OCCUPANCY_EXCEEDS_MAX_PERSONS errors on Booking.com dorm: resolved
  in Session 14. No new errors reported.
- Root cause of Book button bug is now fully documented with measurements.

### Open issues (in priority order)

#### 1. HIGH — Attempt 5: Fix Book button movement

**Read `docs/diagnostic-book-button.md` before writing any code.**

The fix is a single CSS rule in `CSS-base.css`. No JS changes needed.

**The fix:**

```css
/* Keep per-occupancy .b24-multipricebox elements hidden regardless of
   Beds24 class changes. Beds24 removes .hidden from these on qty > 0
   (Per Occupancy Pricing rooms). Without this rule, they become flex:1
   siblings of the main box and halve its width. */
[id^="selectors1-"] .b24-multipricebox:not(.pull-right) {
  display: none !important;
}
```

**Add this near the existing `.b24-multipricebox.hidden` rule (CSS-base.css line 84).**

**Acceptance criteria for "resolved":**
- At 390px viewport, changing qty 1→2→3 on any room does NOT move
  the Book button to a new row.
- `tnh-total-price` stays adjacent to Book button throughout.
- Price still updates visually on qty change.
- No regression on the dorm room (567219): Book button still appears,
  bed count select still works.
- Room 567221 (Double Room with Shared Bathroom) specifically — the
  original bug reporter.

**How to test:** Use Chrome DevTools device emulation at 390px
(F12 → toggle device icon), navigate to the live page, run a date
search, change qty. OR use the direct Beds24 URL with mobile CSS
injection (same method as this session's diagnostic).

#### 2. MEDIUM — Verify OCCUPANCY fix has held (ongoing)

No new OCCUPANCY_EXCEEDS_MAX_PERSONS errors expected. Verify via Beds24
error log if available. Also confirm Double Room and Deluxe King Suite
on Booking.com still show correct prices.

#### 3. LOW — `tnh-total-price` shows at qty=0 for room 567221

Section 6 reads `naa1-1-567221` (guest count select, hidden, value="1")
as the fallback qty. Private rooms have a naa select too — the Section 6
fallback logic was designed for dorms but applies to all rooms. Result:
`tnh-total-price` always shows a total even before the user selects a qty.

This is a cosmetic issue, not a booking-flow blocker. Diagnostic is
complete; the fix (tighten Section 6's qty-source logic) is for a future
session. Do not confuse it with the Book button movement bug — they are
independent.

#### 4. LOW — Dorm price not updating when bed count changes

Still open from Session 14. Same diagnostic approach as the Book button
fix — observe live DOM during a naa change before writing any code.

#### 5. LOW — Confirmation page styling

`customheadconfirm` field requires manual paste per property.
Deferred until a live booking test is run.

#### 6. LOW — Rollout to properties 2-4

Blocked on Phase 5 (mobile QA) completion for Chill Zone.

---

## Git state

```
5dcef3d  Revert "Fix book button movement: remove display:contents wrapper"
1c009c3  Add ota-channel-reference pointer to admin-guide.md
2a5deda  Add rule-count integrity check to CLAUDE.md
a325bc1  Add session-14 documentation
```

No commits this session (diagnostic only). Code files are byte-identical
to Session 15a state.

Session 16 should produce one commit: the single-line CSS fix + these
handoff/diagnostic docs.

---

## No new retrospective entries this session

No new failure modes surfaced. The diagnostic broke the pattern of
attempting fixes without measurement. Active Rules count remains 24.

---

## Related files

- Previous handoff: `docs/session-handoff-15.md`
- Diagnostic: `docs/diagnostic-book-button.md`
- DOM structure reference: `docs/skill/dom-structure.md`
- Helper JS architecture: `docs/skill/helper-js-architecture.md`
- CSS file: `CSS-base.css`
