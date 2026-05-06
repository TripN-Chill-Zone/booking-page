# Offer Bar — Bug List and Classification

Last updated: Session 10 (2026-04-17)

This document lists every bug and structural issue driving the offer-bar rebuild, classifies each as CSS-only or requiring JS behavior changes, and documents what was attempted.

---

## Active bugs (driving the rebuild)

### 1. Book button shifts left after qty selection

**Severity:** High — breaks the primary booking action layout on mobile
**Classification:** NOT CSS-only fixable
**Description:** On mobile, selecting a quantity causes the Book button to drop to a new line and left-align instead of staying right-aligned alongside the price.
**Root cause:** Beds24's DOM structure (nested flex containers with `flex-wrap`, an undocumented `div#selectors1-{roomId}` wrapper, and dynamically toggled `.hidden` classes) makes it impossible to achieve the target layout with CSS alone.
**Attempted CSS fixes:**
- `flex-wrap` with `order` values on children
- `justify-content: flex-end` on multipricebox
- `justify-content: space-between` on multipricebox
- `flex-basis: 100%` on from-price to force line break
- Explicit `width: 100%` on every parent in the chain
- `.tnh-offer-row` wrapper div with `display: flex; width: 100%`
**Result:** None worked consistently across all rooms and states on mobile.

### 2. "Select" label and dropdown overlap Book button

**Severity:** High — makes the booking controls unusable on some rooms
**Classification:** NOT CSS-only fixable
**Description:** After qty selection on non-dorm rooms, the `form-inline` content (Select label + dropdown) crowds into the book-group (price + Book button) instead of staying on opposite sides.
**Root cause:** Same as bug #1 — the parent flex container wraps unpredictably, and `margin-left: auto` on the book-group doesn't work reliably on a wrapped flex line.

### 3. Total price shown before qty selection

**Severity:** Medium — confusing UX (price shown before user made a choice)
**Classification:** NOT CSS-only fixable
**Description:** The total (e.g., €90.00) appeared next to the Book button before any quantity was selected. The total should only appear after the user selects a qty.
**Root cause:** JS behavior — `injectBookButtons()` was populating `.tnh-total-price` with the initial total at injection time.
**Why not CSS-only:** CSS can hide it with `display: none` initially, but can't conditionally show it only when Beds24 adds `.hidden` to the from-div. There's no CSS-only way to detect "sibling has class `.hidden`" and respond (`:has()` could theoretically work but the from-div and total-price are not in a direct sibling relationship in Beds24's DOM).

### 4. From-price disappears after qty selection

**Severity:** Medium — card visually shrinks, layout shifts
**Classification:** NOT CSS-only fixable (partially CSS, partially JS)
**Description:** "from €16.00 / night" vanished when a qty was selected, causing the card to shrink.
**Root cause:** Beds24 adds `.hidden` class to the from-div after qty selection. Our CSS overrides `display: none` with `display: block !important`, but Beds24's MutationObserver-driven JS keeps re-adding `.hidden`, creating a fight loop. The `isModifying` guard prevents infinite loops but the timing is fragile.
**Why not CSS-only:** CSS can override the display, but Beds24's JS keeps toggling the class back, and our `enhancePrices()` function was also participating in the hide/show logic, creating three-way interaction.

### 5. Inconsistent layout between dorm and standard rooms

**Severity:** Medium — dorm works, standard rooms don't
**Classification:** NOT CSS-only fixable
**Description:** Dorms have a fundamentally different DOM structure: hidden input instead of qty dropdown, guest selector in a separate multipricebox. The `fixDormRooms()` function restructures the dorm DOM successfully, but standard rooms use a different code path that doesn't achieve consistent alignment.
**Root cause:** Two separate render paths (dorm vs. standard) means two sets of CSS rules, two sets of edge cases, and inconsistent behavior.

### 6. Price per night not showing for 1-night stays

**Severity:** Low — only affects edge case
**Classification:** NOT CSS-only fixable
**Description:** `enhancePrices()` only calculated per-night display when `nights > 1`.
**Root cause:** JS logic conditional in the price enhancement function.

---

## Structural issues (root causes, not user-facing bugs)

| Issue | Description | Status |
|---|---|---|
| `div#selectors1-{roomId}` wrapper | Undocumented wrapper between `.multiroomshow` and `.b24-multipricebox` that collapses to 0 width | Active — contributes to alignment bugs |
| Beds24's `.hidden` class toggling | Beds24 adds/removes `.hidden` on from-price div when qty changes, fighting our display overrides | Active — causes from-price disappearance |
| Bootstrap `.container` fixed widths | iOS Safari iframe expansion preventing mobile media queries | FIXED in Session 10 (injected `max-width:100%`) |
| All rooms in one AJAX wrapper | Beds24 loads all rooms into single `#ajaxroomoffer` div | FIXED — DOM reorder for sorting works around this |

---

## Already-fixed issues (CSS-only, not part of rebuild)

| Issue | Fix | Status |
|---|---|---|
| Per-occupancy price boxes leaking through | `.b24-multipricebox.hidden { display: none !important }` | DONE — stays in rebuild |
| Fakelink visibility | `.fakelink { display: none !important }` | DONE — stays |
| Collapsed sections (photos, descriptions) | `[id^="collapseslider"], [id^="collapsedesc"] { display: block !important }` | DONE — stays |
| Carousel controls visible | `.carousel-control { display: none !important }` | DONE — stays |
| Date strip header row | `.roomofferpricetable tr.b24-bookingstrip { display: none !important }` | DONE — stays |
| Date strip cells clickable | `.at_pricetd { pointer-events: none !important }` | DONE — stays |
| "Up" button visible | `a[href="#topofthebookingpage"] { display: none !important }` | DONE — stays |

---

## Summary

Of the **6 active bugs** driving the offer-bar rebuild, **0 are CSS-only fixable**. All require structural changes to the DOM (building our own offer bar and moving Beds24's form elements into it).

The **7 already-fixed issues** are all CSS-only and remain in place regardless of the rebuild. The rebuild doesn't touch them.

The rebuild replaces 3 helper JS sections (`fixDormRooms`, `injectBookButtons`, `enhancePrices`) with a single `rebuildOfferBars()` function that:
1. Hides Beds24's native offer-select
2. Creates a clean `.tnh-offer-bar` with our own markup
3. Moves Beds24's form elements (qty select, guest select) into our bar
4. Handles all 3 states (available-noqty, available-qty, unavailable) in one unified code path
