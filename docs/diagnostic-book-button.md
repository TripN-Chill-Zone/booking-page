# Diagnostic: Book Button Movement on Mobile

**Date:** 2026-04-24  
**Session:** 15b (diagnostic-only — no code changes)  
**Environment:** Direct Beds24 URL (`beds24.com/booking2.php?ownerid=141266&propid=271142&cssfile=...`) loaded in Chrome at desktop viewport (1536px). Mobile CSS applied via injected style override. Container constrained to 334px via `max-width` injection on `.multiroomshow` to simulate mobile arithmetic.  
**Room tested:** 567221 (Double Room with Shared Bathroom)  
**Second room tested:** 567218 (Deluxe King Suite) — for pattern confirmation

---

## Setup note

The Chrome window was maximized and couldn't be resized to 390px via `resize_window` or `window.resizeTo()`. Instead:

1. Mobile CSS rules (`flex-wrap:wrap`, `order:-1; width:100%` on from-div) were injected unconditionally via a `<style>` tag, eliminating the need for a real 390px viewport to activate the media query.
2. `.b24-offer-select .multiroomshow` was constrained to `max-width:334px; width:334px` (the expected mobile container width after accounting for card margins and panel padding at 390px).
3. MutationObserver was scoped to `.multiroomshow` (wider than priceBox alone — this was the key correction from the first, too-narrow scope).

The bug was **visually reproduced** in this environment. Screenshots confirm the three-row layout that matches the reported bug.

---

## Initial DOM state (qty=0, before any interaction)

### `.b24-multipricebox:not(.hidden)` (the main priceBox)

```
Container: .b24-multipricebox.pull-right
  width: 334px (at mobile-simulated 334px container)
  display: flex
  flex-wrap: wrap          ← from mobile CSS injection
  gap: 8px
  direct children: 2
    [0] .tnh-offer-row     ← helper-injected, display:contents
    [1] #from-1-567221     ← Beds24 from-price div
```

### Effective flex items (via display:contents on .tnh-offer-row)

| Element | order | width | display | notes |
|---------|-------|-------|---------|-------|
| `.form-inline` | 0 | 134.8px | flex | contains "Select" label + qty select |
| `.tnh-total-price` | 1 | 50.5px | block | shows "€72.00" |
| `.tnh-book-btn` | 2 | 83.9px | block | margin-left:auto |
| `#from-1-567221` | -1 | 334px (100%) | block | inline style: `display:block !important` |

**Total row-2 content**: 134.8 + 8 + 50.5 + 8 + 83.9 = **285.2px < 334px** → all items fit on row 2. No wrapping. Book button is on row 2.

### Visual layout at qty=0 (correct)

```
Row 1:  [ from €36.00 / night              ] ← #from-1 (width:100%, order:-1)
Row 2:  [ Select - ▼ ] [ €72.00 ] [  Book  ] ← form-inline + tTotal + tBtn (285px < 334px)
```

### All .b24-multipricebox elements at qty=0

| Element | classes | display |
|---------|---------|---------|
| `.b24-multipricebox.pull-right` | pull-right | flex (visible) |
| `#divroom567221offer1select1` | b24-multipricebox hidden | none |
| `#divroom567221offer1select2` | b24-multipricebox hidden | none |
| `#divroom567221offer1select3` | b24-multipricebox hidden | none |

### Inline style on from-div

`#from-1-567221` has `style="display: block !important"` set by Section 6 (runs on every `applyFixes()` cycle). This inline `!important` takes higher specificity than Bootstrap's `.hidden { display:none !important }`, so the from-div remains visible when Beds24 adds `.hidden` to it. The `.hidden` toggle on the from-div has **no visual effect**.

### naa select (guest count)

Room 567221 has a hidden `select#naa1-1-567221` with value="1" (1 Guest). Section 6 reads this as the fallback qty when `sr1-` select value is "0". Result: Section 6 always evaluates `qty=1` for this room and keeps `tnh-total-price` visible and populated, even at sr1 value="0". This is a secondary issue, separate from the button movement.

---

## Mutation log (qty change 0 → 1, room 567221)

MutationObserver attached to `.multiroomshow` with `{childList:true, subtree:true, attributes:true, attributeOldValue:true}`.

### Batch 1: t+6917ms — synchronous with qty change event

| # | Type | Target | Change |
|---|------|--------|--------|
| [0] | attributes | `#divroom567221offer1select1.b24-multipricebox` | class: `"b24-multipricebox hidden"` → **`"b24-multipricebox"`** |
| [1] | attributes | `#naa1-1-567221 SELECT` | `disabled` attribute removed |
| [2] | attributes | `#naa2-1-567221 SELECT` | `disabled` attribute removed |
| [3] | attributes | `#naa3-1-567221 SELECT` | `disabled` attribute removed |
| [4] | childList | `#price-1-1-567221 SPAN.ajaxroomprice` | price spans replaced (same values) |
| [5] | attributes | `#from-1-567221` | class touched (no change: no .hidden added/removed here in this batch) |
| [6] | attributes | `#from-1-567221` | class: `"ajaxroomwarn at_offerfromdiv hidden"` → `"ajaxroomwarn at_offerfromdiv"` |

**Mutation [0] is the root cause.** Beds24's jQuery handler fires synchronously on the `change` event and removes `.hidden` from `#divroom567221offer1select1.b24-multipricebox`.

Mutations [5] and [6] on from-div: Beds24 adds `.hidden` (mutation [5] shows the transition), our Section 4 change listener removes it (mutation [6]). Both happen in the same synchronous batch — the from-div never actually renders as hidden because the inline `display:block !important` overrides Bootstrap `.hidden` anyway.

### Batch 2: t+8224ms — helper's applyFixes() re-run (~1.3s after qty change)

| # | Type | Target | Change |
|---|------|--------|--------|
| [7] | childList | `SPAN.tnh-price-pernight-main` | text "from €36.00 / night" re-written (same value) |
| [8] | attributes | `#from-1-567221` | class touched (Section 6 removes .hidden defensively) |
| [9] | childList | `SPAN.tnh-total-price` | text "€72.00" re-written (same value) |
| [10-13] | childList | OPTION elements | option labels re-written by Section 7 (same values) |

This batch is Section 6 + Section 7 re-running after Beds24's AJAX response. No structural changes. All text rewrites are to the same values (price didn't change: 1 room × 2 nights × €36 = €72.00).

---

## The mechanism (what breaks the layout)

### What Beds24 does at qty > 0

Beds24's jQuery handler on the qty select change event **synchronously removes `.hidden` from `#divroom{roomId}offer1select1.b24-multipricebox`** — the first per-occupancy price box. This element was previously hidden by Bootstrap's `.hidden` class.

### What our CSS does in response

Our CSS rule `.b24-offer-select .b24-multipricebox { flex:1 !important }` applies to **all** `.b24-multipricebox` elements. Once the per-occupancy box is revealed (`.hidden` removed), it becomes a second visible flex item inside `#selectors1-{roomId}`.

Both elements have `flex:1`. Two `flex:1` items in a 334px container each get **167px**.

### Why 167px breaks the layout

At 334px (qty=0): row 2 items total 285.2px < 334px → all fit. No wrapping.  
At 167px (qty>0): row 2 items total 285.2px > 167px → wrapping occurs.

With `flex-wrap:wrap`:
- `.form-inline` (134.8px) fits alone on row 2 (134.8 < 167)
- After `.form-inline` + gap (142.8px), remaining space = 167 - 142.8 = 24.2px
- `.tnh-total-price` (50.5px) does not fit in 24.2px → wraps to row 3
- `.tnh-book-btn` (83.9px) follows `.tnh-total-price` on row 3

### Visual layout at qty=1 (broken — confirmed by screenshot)

```
Row 1:  [ from €36.00 / night              ] ← #from-1 (width:100%, order:-1)
Row 2:  [ Select  1 room  ▼  ]               ← form-inline (134.8px, fits in 167px)
Row 3:  [ €72.00 ]              [  Book  ]   ← tTotal + tBtn (wrap from row 2)
```

Screenshot confirmed this exact three-row layout.

---

## Why previous attempts didn't fix it

Attempts 1–4 each tried to restructure the DOM or adjust flex properties of the existing elements. None of them added a rule to **keep the per-occupancy box permanently hidden**. The per-occupancy box had `.hidden` on it, so the existing rule `.b24-multipricebox.hidden { display:none !important }` worked before the qty change. But once Beds24 removes `.hidden`, that rule no longer applies, and no other rule hides it.

Specific to Attempt 3 (current code): the `display:contents` wrapper (`.tnh-offer-row`) was introduced to control visual order without DOM restructuring. That approach is sound, but it doesn't address the second `.b24-multipricebox` appearing and halving the available width.

---

## Pattern consistency: second room test

**Room 567221** (Double Room with Shared Bathroom): 4 `.b24-multipricebox` elements (1 main + 3 per-occupancy). Beds24 reveals `offer1select1` at qty=1. **Bug occurs.**

**Room 567218** (Deluxe King Suite): 2 `.b24-multipricebox` elements (1 main + 1 per-occupancy). Beds24 does NOT reveal the per-occupancy box at qty=1. Per-occupancy box stays `.b24-multipricebox.hidden`. **Bug does not occur** for this room.

The difference: rooms with "Per Occupancy Pricing" in Beds24 admin generate 3 per-occupancy boxes; rooms with "Per Day Pricing" generate 1. Beds24's jQuery handler only reveals a per-occupancy box on rooms configured with Per Occupancy Pricing (3 boxes). Room 567221 appears to still be on Per Occupancy Pricing.

**Note:** Whether 567221's pricing model should be changed is a separate admin question. The CSS fix below handles both configurations correctly regardless.

---

## Identified cause

**Beds24 synchronously removes `.hidden` from `#divroom{roomId}offer1select1.b24-multipricebox` when qty changes from 0 to a positive value.** This is a Beds24 platform behavior for rooms with Per Occupancy Pricing. Our CSS rule `flex:1` applies to all visible `.b24-multipricebox` elements, so the newly-revealed box shares the flex space equally with the main box. The main priceBox shrinks to ~167px, which is insufficient for all three row-2 flex items to fit on one line at mobile width. The Book button wraps to a third row.

---

## Recommendation for Attempt 5

### Target

CSS-base.css only. No JS changes needed.

### The fix

Add one rule to CSS-base.css:

```css
/* Keep per-occupancy .b24-multipricebox elements hidden regardless of Beds24 class changes.
   Beds24 removes .hidden from these on qty > 0 (Per Occupancy Pricing rooms).
   Without this rule, they become flex:1 siblings of the main box and halve its width. */
[id^="selectors1-"] .b24-multipricebox:not(.pull-right) {
  display: none !important;
}
```

**Why this selector:**
- `[id^="selectors1-"]` scopes to the per-room selector wrapper (avoids any unintended matches)
- `.b24-multipricebox:not(.pull-right)` targets all price boxes except the main visible one (`.pull-right` is the class Beds24 puts only on the main box)
- Per-occupancy boxes never have `.pull-right`, so they will always be hidden by this rule regardless of whether `.hidden` is present

**Dorm room safety:** The dorm's Box 1 does not have `.pull-right` (see `dom-structure.md` §8.2), so this rule would also hide it. The helper currently hides Box 1 via inline `style.setProperty('display','none','important')`. Both rules would agree. No regression.

**Placement in CSS-base.css:** Near the existing `.b24-multipricebox.hidden` rule (line 84). Logically belongs with the "Hide" block.

### What to verify after deploying

1. At 390px viewport, changing qty 1→2→3 on any room does NOT move the Book button to a new row.
2. `tnh-total-price` stays adjacent to Book button throughout.
3. Price still updates visually on qty change.
4. No regression on the dorm room (567219) — Book button still appears, bed count select still works.
5. Room 567221 (Double Room with Shared Bathroom) specifically — the original bug reporter.

### What NOT to change

- The `display:contents` approach on `.tnh-offer-row` is not the cause of the bug. Leave it.
- Section 4 change listener (from-div show/hide guard) is not the cause. Leave it.
- No DOM restructuring needed.

---

## Secondary observation (not the focus)

Section 6 uses the `naa` guest select as a fallback qty for private rooms. For room 567221, `naa1-1-567221` has value="1" by default (hidden from UI). This causes `tnh-total-price` to always show a total price even at sr1 select value="0". The `tnh-total-price` is visible at all times for this room. This is not the cause of the button movement, but it is incorrect behavior — the total should only show when the user has explicitly selected a qty. Tracking this as a separate issue for a future session.

---

## Correction (2026-04-24)

The "Secondary observation" above describes the `tnh-total-price` 
at qty=0 issue as "cosmetic, not a booking-flow blocker." A 
post-Session-17 check of the live page contradicted that framing: 
the displayed total-at-qty=0 combined with totals not updating on 
qty change made the page's pricing display effectively broken 
from the user's perspective. The issue is functional, not 
cosmetic. Session 18's diagnostic re-investigates this and 
related pricing display bugs.
