# Diagnostic: Pricing Display Bugs

**Date:** 2026-04-24  
**Session:** 18 (diagnostic-only — no code changes)  
**Environment:** Direct Beds24 URL (`www.beds24.com/booking2.php?ownerid=141266&propid=271142&...&referer=widget&cssfile=...`) loaded in Chrome at 390px viewport.  
**Primary test dates:** 25 Apr → 27 Apr 2026 (2 nights). Single Room (567220) and Double Room (567221) available. Deluxe King Suite (567218) and Dorm (567219) not available for these dates.  
**Secondary test dates:** 10 May → 12 May 2026. Dorm (567219) available at €16/night. Private rooms not available.  
**Note on test method:** Cross-origin iframe prevents DOM inspection from the WordPress parent page. DOM inspection and JS instrumentation ran on the Beds24 URL directly (same helper JS behavior — `referer=widget` included in URL, `isEmbedded` false so Section 1 chrome-hiding skips, Sections 3–8 run normally).

---

## Expected behavior from code reading (Step 2 baseline)

Read before browser testing. Established from `beds24-iframe-helper.js` Section 6 (`enhancePrices`).

### Qty sources in Section 6, in order of precedence

```js
var qtySelect = offer.querySelector('select[id^="sr1-"]');
var naaSelect = offer.querySelector('select[id^="naa"]');
var qty = 0;
if (qtySelect) qty = parseInt(qtySelect.value, 10) || 0;
if (!qty && naaSelect) qty = parseInt(naaSelect.value, 10) || 0;
```

1. **sr1 select** (visible qty dropdown — private rooms only). Private rooms have `select#sr1-{roomId}`; dorms have `input[type=hidden][name=sr1-{roomId}]` (no select).
2. **naa select** (fallback — only used if sr1 is absent or zero). Private rooms have a hidden `select#naa1-1-{roomId}` with initial value="1". Dorm has a visible `select#naa1-1-{roomId}` with initial value="0" (placeholder, relabeled by Section 3).

### What triggers Section 6 to run

- MutationObserver (300 ms debounce) on any DOM change in `document.body` — triggered by Beds24's own DOM mutations on qty change
- 1000 ms polling interval for 30 cycles — only when `isWidget && isEmbedded` (widget-embedded context)
- Direct call from `applyFixes()` at page init

### What Section 6 writes to `.tnh-total-price`

Reads `.bookingpagedollars` and `.bookingpagecents` from inside `[id^="from-1-"]` (the from-price div). Treats this as the full-stay total for one unit. Does **not** multiply by qty. Writes: `currency + total.toFixed(2)`.

Shows the total (`display: ''`) when `qty > 0`, hides it (`display: none`) when `qty === 0`.

### Predicted issues before any browser observation

1. Private rooms: naa fallback fires at sr1=0 because Beds24 initializes private room naa selects to value="1" — total would show before user makes any selection.
2. All rooms at qty > 1: the from-div price is per-unit (1 room or 1 bed), and Section 6 displays it unchanged. If Beds24 does not update the from-div price when qty changes, the displayed total is always the single-unit price regardless of how many rooms or beds are selected.

---

## Initial state table — all rooms at page load (Step 5)

Tested at 25 Apr → 27 Apr 2026 for private rooms. Dorm tested at 10 May → 12 May 2026.

| Field | Single (567220) | Double (567221) | Deluxe (567218) | Dorm (567219) |
|---|---|---|---|---|
| sr1 select value | "0" | "0" | "0" | N/A (hidden input, value="1") |
| sr1 selectedText | "-" | "-" | "-" | N/A |
| naa select id | naa1-1-567220 | naa1-1-567221 | naa1-1-567218 | naa1-1-567219 |
| naa value at load | "1" | "1" | (unavail) | "0" |
| naa selectedText | "1 Guest" | "1 Guest" | (unavail) | "-" |
| naa computedDisplay | none | none | (unavail) | block (Section 3 moved it) |
| from-1- dollars | "62" | "72" | MISSING | "32" |
| from-1- cents | ".00" | ".00" | MISSING | ".00" |
| from-1- classList | ajaxroomwarn at_offerfromdiv | ajaxroomwarn at_offerfromdiv | hidden ajaxroomwarn at_offerfromdiv | ajaxroomwarn at_offerfromdiv |
| tnh-total-price text | "€62.00" | "€72.00" | N/A | "" |
| tnh-total-price display | "" (visible) | "" (visible) | N/A | "none" (hidden) |
| `.b24-multipricebox` count | 4 | 4 | (unavail) | 2 |

**Observations:**
- Single and Double rooms show a total price at fresh load with sr1="0" (user has selected nothing). **Bug A confirmed.**
- Deluxe King Suite is unavailable for 25-27 Apr; from-div is hidden and has no price spans. Cannot test this room for these dates.
- Dorm shows no total at fresh load (naa="0"). **No Bug A for dorm on these dates.**
- All private rooms have 4 `.b24-multipricebox` elements each (1 main + 3 per-occupancy = Per Occupancy Pricing configuration), kept hidden by the Attempt 5 CSS fix.

---

## State after qty change — private rooms (Step 6)

### Single Room (567220)

| State | sr1 value | from-div dollars | tnh-total-price text | tnh-total-price visible |
|---|---|---|---|---|
| Fresh load | "0" | "62" | "€62.00" | YES (Bug A) |
| After sr1 → "1" | "1" | "62" | "€62.00" | YES |
| After sr1 → "2" | "2" | "62" | "€62.00" | YES (Bug B — should be €124) |

### Double Room (567221)

| State | sr1 value | from-div dollars | tnh-total-price text | tnh-total-price visible |
|---|---|---|---|---|
| Fresh load | "0" | "72" | "€72.00" | YES (Bug A) |
| After sr1 → "1" | "1" | "72" | "€72.00" | YES |
| After sr1 → "2" | "2" | "72" | "€72.00" | YES (Bug B — should be €144) |

**Key measurement:** The from-div's `.bookingpagedollars` value does NOT change at any point. It is set once on page load and frozen. Section 6 reads this frozen value and displays it as the total regardless of selected quantity.

---

## Dorm-specific findings (Step 7)

### Initial DOM state (10 May → 12 May 2026)

- `naa1-1-567219`: value="0", selectedText="-", computedDisplay=block
- Total price: display="none", text="" — **correctly hidden**
- From-div: dollars="32" (1 bed × 2 nights × €16/night = €32)
- `.b24-multipricebox` count: 2 (main box + 1 orphan box hidden by Section 3)

**Bug A does NOT manifest for the dorm on these dates.** The naa select defaults to "0" (placeholder), so the qty fallback evaluates to 0 and the total stays hidden. This is correct behavior.

### After naa changes

| State | naa value | naa selectedText | from-div dollars | tnh-total-price text | tnh-total-price visible |
|---|---|---|---|---|---|
| Fresh load | "0" | "-" | "32" | "" | NO (correct) |
| After naa → "1" | "1" | "1 Bed" | "32" | "€32.00" | YES (correct) |
| After naa → "4" | "4" | "4 Beds" | "32" | "€32.00" | YES (Bug B — should be €128) |

At naa=4, Beds24 hides `price-1-1-567219` (adds `.hidden` class at t≈538ms). This suggests Beds24 has no valid per-occupancy price for 4 beds at this date. The from-div retains the per-bed price from initial load (€32), and Section 6 reads it and displays €32 unchanged.

### On the user's observation of "4 Beds already selected at page load"

Not reproduced in this session. At fresh load, naa="0" and the Beds dropdown shows "-". The screenshot in this session shows "4 Beds" only because naa was explicitly set to "4" via JS during investigation. The user's observation may reflect:
- A state after prior interaction (the select was set to 4 from a previous visit stored in browser state)
- Different dates where Beds24 initializes the naa select to a non-zero value
- Or a different configuration at the time of the observation

The underlying pricing display bug (Bug B) is real regardless of whether "4 Beds" shows at page load or after selection.

---

## Mutation log (Step 8)

Attached MutationObserver to `.selectors1-567220` wrapper (all mutations in the subtree). Change event: sr1-567220, value 0→1 via `dispatchEvent + jQuery.trigger`.

### What Beds24 does synchronously at t≈31ms after sr1 change

| # | Type | Target | Change |
|---|---|---|---|
| 1 | attributes | divroom567220offer1select1 | class: "b24-multipricebox hidden" → "b24-multipricebox" (removes .hidden) |
| 2 | attributes | naa1-1-567220 | `disabled` attribute removed |
| 3 | attributes | naa2-1-567220 | `disabled` attribute removed |
| 4 | attributes | naa3-1-567220 | `disabled` attribute removed |
| 5 | childList | price-1-1-567220 | **price span content replaced** |
| 6 | attributes | from-1-567220 | class: "ajaxroomwarn at_offerfromdiv" → "ajaxroomwarn at_offerfromdiv hidden" |
| 7 | attributes | from-1-567220 | class → "ajaxroomwarn at_offerfromdiv hidden" (duplicate from jQuery trigger) |
| 8 | childList | price-1-1-567220 | **price span content replaced again** (duplicate from jQuery trigger) |
| 9 | attributes | from-1-567220 | class → hidden again |

### What our helper does at t≈775ms (MutationObserver debounce)

| # | Type | Target | Change |
|---|---|---|---|
| 10 | childList | tnh-price-pernight-main | per-night text rewritten |
| 11 | attributes | from-1-567220 | class: hidden removed (Section 6 keeps from-div visible) |
| 12 | childList | tnh-total-price | total text rewritten |
| 13–18 | childList | (option labels, tag rows) | Section 7 reruns |

### Critical: what value is in price-1-1-567220 after Beds24's update?

At qty=1: dollars="62" (same as initial).  
At qty=2: dollars="62" (same — unchanged).

**Beds24 updates `price-1-1-567220` via childList but writes the same per-unit value (€62) regardless of how many rooms are selected.** The from-div's own `.bookingpagedollars` is a separate element that Beds24 never updates.

### Structural clarification: two separate price elements

`from-1-567220` and `price-1-1-567220` are NOT parent/child:

```
selectors1-567220
  .b24-form-inline.pull-right
    price-1-1-567220     ← Beds24's AJAX price span (Beds24 updates this)
      .bookingpagedollars
      .bookingpagecents
  .b24-multipricebox.pull-right  ← main priceBox
    .tnh-offer-row
      .form-inline (sr1 select)
      .tnh-total-price           ← Section 6 writes here
      .tnh-book-btn
    from-1-567220                ← Section 6 reads from here
      .tnh-price-pernight-main
      .bookingpagedollars        ← DIFFERENT dollars span, never updated by Beds24
      .bookingpagecents
```

Section 6 reads `from-1-567220 > .bookingpagedollars`. Beds24 updates `price-1-1-567220 > .bookingpagedollars`. These are separate elements. Section 6 never sees Beds24's repriced value — not because the timing is wrong, but because it reads the wrong element.

---

## Identified causes

### Bug A — Total price shown before user has selected a quantity (private rooms only)

**Scope:** Single Room (567220), Double Room (567221), Deluxe King Suite (567218). Not the dorm.

**Mechanism:**
1. Private rooms have a hidden `select#naa1-1-{roomId}` (Beds24 Per Occupancy Pricing control).
2. Beds24 initializes this select to value="1" by default (1 guest).
3. Section 6's qty logic: sr1=0 → qty=0 → falls back to naa → naa="1" → qty=1 → total shown.
4. The user sees a total price ("€62.00", "€72.00") with the qty dropdown showing "-" (no room selected).

**Root cause in code:** Section 6 uses `naa` as a qty fallback for all rooms. For private rooms, this fallback is inappropriate because naa is a hidden Beds24 control that defaults to 1 guest, not a user-selected quantity.

**The dorm is not affected** because Section 3 moves the naa select out of its orphan box and relabels option 0 as "-" — but crucially, Beds24 also initializes the dorm's naa to value="0" (not "1"), so even if the fallback fires, qty evaluates to 0 and the total stays hidden.

---

### Bug B — Total price does not update when qty or bed count changes

**Scope:** All rooms. Affects private rooms when sr1 > 1, and dorm when naa > 1.

**Mechanism:**
1. Section 6 reads `.bookingpagedollars` from `from-1-{roomId}` — the from-price div.
2. This value is set by Beds24 at page load to the per-unit total (1 room or 1 bed × all nights).
3. When the user changes the sr1 or naa select, Beds24 fires synchronously and updates `price-1-1-{roomId}` (a separate element in `.b24-form-inline.pull-right`). But this write is to a different DOM element than what Section 6 reads.
4. Beds24 does NOT update `from-1-{roomId}` price content when qty changes. The from-div price is frozen at the initial per-unit value.
5. Section 6 also does not multiply the from-div price by the selected qty — it displays the raw from-div total directly.

**Result:** At qty=2 rooms, the displayed total is still the price for 1 room. At 4 beds selected in the dorm, the displayed total is still the price for 1 bed.

**Session 17 false positive:** Session 17's acceptance criteria listed "Price still updates visually on qty change ✅ PASS — €72 at qty 1, €144 at qty 2." This is incorrect. Testing in this session confirms the total stays at €72 regardless of whether 1 or 2 rooms are selected. The Session 17 verifier saw €72 at qty=1 (correct by coincidence — that IS the 1-room total) and either misread the qty=2 state or didn't verify it. The acceptance criteria for this item were insufficient — they specified the expected values but did not verify them were actually displayed in the DOM.

---

## Recommendations for the fix session (Section 6 changes only)

### Fix A — Gate the naa fallback on isDorm

In `enhancePrices()`, change the qty-source logic to prevent private rooms from inheriting the naa value:

```js
// Current (bugs):
var qtySelect = offer.querySelector('select[id^="sr1-"]');
var naaSelect = offer.querySelector('select[id^="naa"]');
var qty = 0;
if (qtySelect) qty = parseInt(qtySelect.value, 10) || 0;
if (!qty && naaSelect) qty = parseInt(naaSelect.value, 10) || 0;

// Fix A: only use naa fallback for dorm rooms
// A dorm has no visible sr1 select — it has a hidden sr1 input instead
var isDorm = !offer.querySelector('select[id^="sr1-"]') &&
             !!offer.querySelector('input[type="hidden"][name^="sr1-"]');
if (!qty && naaSelect && isDorm) qty = parseInt(naaSelect.value, 10) || 0;
```

This makes private rooms show no total until the user explicitly picks a qty via sr1. Does not affect the dorm.

### Fix B — Multiply total by selected quantity

Section 6 must multiply the from-div's per-unit price by the selected qty before displaying:

```js
// Current (bug):
if (qty > 0) {
  totalEl.textContent = currency + total.toFixed(2);
  totalEl.style.display = '';
}

// Fix B: multiply by effective qty
if (qty > 0) {
  totalEl.textContent = currency + (total * qty).toFixed(2);
  totalEl.style.display = '';
}
```

For private rooms: `total` = per-unit stay price (1 room × nights × rate), `qty` = sr1 value. At sr1=2, shows 2× the per-unit price.  
For dorm: `total` = per-bed stay price (1 bed × nights × rate), `qty` = naa value. At naa=4, shows 4× the per-bed price.

**Caveat for the fix session:** The dorm at naa=4 on May dates had Beds24 hiding `price-1-1-567219` (suggesting no valid per-occupancy price for 4 beds on those dates). Verify that the from-div still holds a valid base price in this scenario before relying on the multiplication. If from-div is also absent or zero, Section 6's existing `if (isNaN(total) || total <= 0) return` guard will prevent display — verify this guard is still in place after Fix B.

### Fix sequencing

Apply Fix A and Fix B together in the same commit — they are in the same function, address related symptoms, and together produce a coherent correct behavior. Testing both separately would require extra deploy cycles.

### What NOT to change

- Section 3 (dorm fix): no changes needed. The dorm naa select behavior is correct.
- Section 4 (book button): no changes needed.
- CSS-base.css: no changes needed for these bugs.
- The `isDorm` detection uses the same observable DOM difference that Section 4 already uses to distinguish dorm vs. private rooms — consistent with existing patterns.

---

## Summary table

| Bug | Scope | Root cause | Section | Fix |
|---|---|---|---|---|
| A: total shown at qty=0 | Private rooms only | naa fallback reads private room naa (value="1" by default) | Section 6 qty logic | Gate naa fallback on isDorm |
| B: total wrong at qty>1 | All rooms | Section 6 reads from-div base price, no qty multiplication. Beds24 does not update from-div on qty change | Section 6 total display | Multiply total × qty |
