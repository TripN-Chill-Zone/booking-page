# Beds24 Booking Page — DOM Structure

Complete DOM reference with verified selectors. Read this before writing 
CSS or JS that targets the booking page. Verified against the Chill 
Zone property; other properties may vary — see verification status below.

---

## Verification status

- **Last verified against:** Chill Zone (property 271142), iframe 
  widths 390px and 698px, Session 12 (2026-04-21)
- **Unverified:** Desktop iframe widths ≥1024px. Currently the widget 
  caps iframe at 698px, so desktop CSS never renders in production. 
  v3 plan includes widening the widget to 1290px; desktop DOM behavior 
  at iframe widths 1024–1288px needs validation during v3 rollout.
- **Per-property variance:** DOM structure is expected to be consistent 
  across properties since all use the same Beds24 Layout 6 / Template 6 
  config. If rollout to properties 2–4 reveals differences, flag them 
  inline with a note.
- **Known drift risks:** Beds24 frontend updates can change class names, 
  child element order, or inject new wrapper elements without notice. 
  Selectors that depend on position (e.g., `:nth-of-type`) are more 
  fragile than selectors that depend on class or `:has()` content.

---

## 1. Page structure

Three environments render the booking page:

**1. Direct Beds24 URL** — `https://www.beds24.com/booking2.php?ownerid=141266&propid=271142`
- Full Beds24 booking page with chrome (booking strip, property headers, footers)
- Loads external CSS via `&cssfile=` parameter
- Helper JS loads via `customhead` field but detects absence of `referer=widget` and only runs the always-on sections (date strip colors, Book buttons, dorm fix, price UX, card enhancement, sorting)

**2. WordPress widget (iframe)** — `https://chillzone.astrongpresence.com/book-a-room` (production path TBD)
- WordPress page hosts `booking-widget.js`
- Widget injects a search form + iframe pointing to Beds24 with `referer=widget`
- Helper JS detects `referer=widget` and hides Beds24 chrome, reports height to parent
- This is the primary production rendering path

**3. Mockup (`docs/mockup.html`)** — standalone HTML for design work
- Self-contained DOM mimicking Beds24's structure
- No Beds24 JS, no AJAX, no live data
- Used as the design source of truth; see SKILL.md §1.2 for how

---

## 2. Top-level page structure (direct Beds24)

```
body.colorbody.colorbody-en.layout6
  [Beds24 chrome: booking strip, headers, footers — hidden when widget]
  .b24fullcontainer-rooms
    .container.atcolor
      #ajaxroomoffer{roomId}   ← one wrapper per room, but only ONE is populated
        [.b24room elements all land in a single populated wrapper after AJAX]
        #roomid{roomId}.b24room
          .panel.b24panel-room.atcolor.border
            .panel-heading.b24-roompanel-heading.colorbookingstrip.bb
              .at_roomnametext.b24inline-block   ← room title text
              .roomalert                          ← usually hidden
            .panel-body.b24panel
              [see Room card structure below]
```

### Critical: all rooms load into one AJAX wrapper

Beds24 initially renders 4 separate `#ajaxroomoffer{roomId}` wrapper divs 
as direct children of `.b24fullcontainer-rooms .container`. After AJAX 
room loading, **all `.b24room` elements end up inside a single wrapper** 
(for Chill Zone, `#ajaxroomoffer567219`). The other three wrappers are 
empty.

**Consequence:** CSS `order` on the `#ajaxroomoffer` wrapper divs has no 
effect because only one wrapper has content. Room sorting must use DOM 
reordering on `.b24room` elements within their shared parent.

### Critical: `#b24scroller` is the BOOKING STRIP, not the room container

The name suggests "scrollable content." It isn't. `#b24scroller` is the 
date picker / booking strip area. The room container is 
`.b24fullcontainer-rooms`.

---

## 3. Room card structure

The `.panel-body.b24panel` is where almost all layout work happens. 
Its children (both Beds24-native and helper-injected):

```
.panel-body.b24panel   (display: flex; flex-direction: column in mobile CSS)
  [0] .tnh-room-tags-mobile        ← HELPER-INJECTED (first child, always)
  [1] .offer.offer-o{roomId}-1     ← id="ajaxroomoffer1-{roomId}"
  [2] <script>                     ← Beds24 inline script, uncharacterized, display: none
  [3] div.hidden                   ← Beds24 element, uncharacterized, display: none
  [4] div.clearfix                 ← display: none
  [5] div.row                      ← SLIDER ROW: contains .b24-room-slider
  [6] div.clearfix                 ← display: none
  [7] div.row                      ← DESC ROW: contains .b24-room-desc
```

**Eight direct children total.** Three of them (`<script>`, `div.hidden`, 
one of the `clearfix` divs) are invisible artifacts. Safe to ignore for 
layout work.

### The heading is NOT inside `.panel-body.b24panel`

The room title (`.b24-roompanel-heading`) is a **sibling** of 
`.panel-body.b24panel`, not a child. Both are children of 
`.panel.b24panel-room`:

```
.panel.b24panel-room.atcolor.border
  ├── .panel-heading.b24-roompanel-heading   ← HEADING HERE
  └── .panel-body.b24panel                   ← PANEL BODY (eight children above)
```

**Consequence for grid layout:** you cannot place the heading in a grid 
defined on `.panel-body.b24panel`. Options:

1. Apply grid to `.b24panel-room` (the outer wrapper) to cover heading + 
   panel body together
2. Use two nested grids: one on `.b24panel-room` for heading + body, 
   another on `.panel-body` for thumbnail/desc/tags/offer
3. Leave heading as block-positioned and grid only the panel body

The mockup uses option 3 (single grid on panel body, heading stays as 
panel-heading sibling).

### Selector guidance for the two `.row` elements

Because panel-body has 8 direct children and only 2 are `.row` elements, 
**do not use `:nth-of-type` to target them.** `:nth-of-type` counts 
elements by tagName, not class match: `.row:nth-of-type(1)` means "the 
1st div-child among siblings," which is `.tnh-room-tags-mobile`, not 
a `.row`.

**Reliable selectors:**

```css
.panel-body.b24panel > .row:has(.b24-room-slider) { /* slider row */ }
.panel-body.b24panel > .row:has(.b24-room-desc)   { /* desc row */ }
```

`:has()` is supported in all modern browsers (Safari 15.4+, Chrome 105+, 
Firefox 121+). Verified working on iOS 18.6 and Chrome 147.

---

## 4. Slider row

```
.row   (slider row, index [5] in panel-body)
  .col-xs-12.col-sm-6.b24-module.b24-room-module.b24-room-106         ← FEATURES MODULE (hide)
  .col-xs-12.col-sm-6.b24-module.b24-room-module.b24-room-slider.b24-room-{roomId}
    .fakelink ("pictures")                                             ← hide
    #collapseslider{roomId}                                             ← force display: block
      .carousel.slide                                                   ← THE THUMBNAIL
        .carousel-inner
          .item.active → img.bootstrap-carousel-img                     ← current image
          .item        → img                                            ← other images
          .item        → img
          ...
        a.left.carousel-control                                         ← hide
        a.right.carousel-control                                        ← hide
        ol.carousel-indicators                                          ← hide
      .fakelink ("close")                                               ← hide
```

`.b24-room-106` is the "features module" — we hide it via 
`display: none !important` because we inject tags ourselves.

---

## 5. Desc row

```
.row   (desc row, index [7] in panel-body)
  .col-xs-12.b24-module.b24-room-module.b24-room-desc.b24-room-{roomId}
    .fakelink ("more details")                                          ← hide
    #collapsedesc{roomId}                                                ← force display: block
      .fakelink ("less details")                                         ← hide
      div (actual description content)                                   ← helper adds .tnh-desc-text class
        [helper appends .tnh-room-tags here for desktop tags]
```

Bootstrap classes (`col-xs-12`) must be neutralized — they add 
`width: auto !important`, `padding-left: 0 !important`, 
`padding-right: 0 !important`, `float: none !important`.

---

## 6. Offer section

The offer is where pricing, quantity selection, and the Book button 
live. It's also where `#selectors1-{roomId}` and the `.b24-multipricebox` 
elements reside.

```
.offer.offer-o{roomId}-1   id="ajaxroomoffer1-{roomId}"
  div
    .at_offername                                         ← hide
    .clearfix
    .row                                                  ← offer modules row
      .col-xs-12.col-sm-6.b24-offer-select.b24-offer--o{roomId}-1
        .multiroomshow
          #warn-1-{roomId}.hidden.ajaxroomwarn.at_offerwarndiv  ← UNAVAILABLE WARNING
          #selectors1-{roomId}                            ← SELECTORS WRAPPER (see §6.1)
            .b24-multipricebox.pull-right                 ← MAIN PRICE BOX (see §6.2)
              .form-inline
                .roomofferqtyselectlabel ("Select")       ← hidden by Beds24 in multi-room mode
                select#sr1-{roomId}                       ← QTY DROPDOWN
                (or input[type=hidden] for dorms)
              #from-1-{roomId}.ajaxroomwarn.at_offerfromdiv  ← "from €XX" price
                .bookingpagecurrency (€)
                .bookingpagedollars (62)
                .bookingpagecents (.00)
              [HELPER APPENDS: .tnh-book-group with .tnh-total-price + .tnh-book-btn]
            .b24-multipricebox.hidden                     ← per-occupancy (hide)
            .b24-multipricebox.hidden                     ← per-occupancy (hide)
            .b24-multipricebox.hidden                     ← per-occupancy (hide)
          .multiplebookbutton                             ← Book button container (strip only, NOT per-room)
            button.at_bookingbut                          ← Strip Book button
      .col-xs-12.col-sm-6.b24-offer-pricetable.b24-offer--o{roomId}-1  ← DATE STRIP (see §7)
  hr.bb.hidden                                            ← hide
```

### 6.1 `#selectors1-{roomId}` wrapper

This wrapper has no class, only an ID. Not documented in Beds24's own 
materials. Collapses to 0 width unless explicitly sized.

- Gets `class="hidden"` when the room is unavailable
- Must be made `display: flex; flex: 1; min-width: 0` for the offer bar 
  layout to work

**Required CSS:**

```css
[id^="selectors1-"] {
  display: flex !important;
  flex: 1 !important;
  min-width: 0 !important;
}
[id^="selectors1-"].hidden {
  display: none !important;
}
```

The `.hidden` override is critical — without it, unavailable rooms try 
to show a flex-layout selectors wrapper that should be hidden.

### 6.2 `.b24-multipricebox` variants

Multiple `.b24-multipricebox` elements exist per offer. Only the one 
WITHOUT `.hidden` class is the visible price box.

**Visible (one per offer):**
- Contains `.form-inline` with qty select/input
- Contains `#from-1-{roomId}` with price spans
- Helper appends `.tnh-book-group` here

**Hidden per-occupancy (usually 3 per offer):**
- Have `.hidden` class
- Contain `.ajaxroomprice.b24-roomprice` with per-occupancy prices
- Must be explicitly hidden (see Critical DOM facts below)

### 6.3 Qty select vs hidden input

- **Private rooms:** `<select id="sr1-{roomId}">` with options `-`, `1`, `2`, `3`
- **Dorm rooms:** `<input type="hidden" name="sr1-{roomId}" value="1">`

See Dorm room differences for the full dorm case.

---

## 7. Date strip table

`.b24-offer-pricetable` holds the date availability calendar:

```
.b24-offer-pricetable.b24-offer--o{roomId}-1
  .roomofferpricetable
    table
      tr.b24-bookingstrip                                ← first row ("Check In | Check Out..." header — hide)
      tr.b24-bookingstrip                                ← more header rows
      tr
        td.at_pricetd (date cell)                        ← block clicks with pointer-events: none
        td.at_pricetd.datestay (stay dates, green bg)
        td.at_pricetd.dateunavail (unavailable, red bg)
        ...
```

### Cells are clickable via delegated handlers

`.at_pricetd` cells have click handlers attached to a parent. No 
`onclick` attributes, no `<a>` tags. Clicking navigates to an unstyled 
Beds24 page.

**Required CSS:**

```css
.roomofferpricetable .at_pricetd {
  pointer-events: none !important;
  cursor: default !important;
}
```

### First row repeats "Check Out"

The first `<tr class="b24-bookingstrip">` shows "Check In | Check Out | 
Check Out | Check Out..." for every date column. Hide:

```css
.roomofferpricetable tr.b24-bookingstrip { display: none !important; }
```

---

## 8. Dorm room differences

Dorm rooms configured for channel manager compatibility (Hostelworld, 
Booking.com) behave differently from private rooms. For Chill Zone, 
room 567219 is the dorm.

**Do NOT change the Beds24 room configuration to match private rooms** 
— it affects channel manager integrations.

### 8.1 Hidden input instead of qty select

Private room offer:
```html
<select id="sr1-567220" class="form-control">
  <option value="0">-</option>
  <option value="1">1</option>
  ...
</select>
```

Dorm offer:
```html
<input type="hidden" name="sr1-567219" value="1">
```

The dorm has no visible qty selector. The helper creates a Book button 
that uses this hidden input's preset value.

### 8.2 Two visible `.b24-multipricebox` containers

Dorm offers have TWO visible (non-`.hidden`) `.b24-multipricebox` 
elements inside `#selectors1-{roomId}`:

```
#selectors1-567219
  .b24-multipricebox.pull-right         ← BOX 0
    .form-inline (empty — no select)
    #from-1-567219 (price)
    [HELPER INJECTS .tnh-book-group HERE]
  .b24-multipricebox                    ← BOX 1 (helper hides this)
    .b24-form-inline.pull-right
      select#naa1-1-567219              ← GUEST SELECT (helper moves this into BOX 0)
        option value="0">0 Guests
        option value="1">1 Guest
```

### 8.3 Helper operations on dorm

The helper:
1. Finds Box 0 and Box 1
2. Creates a wrapper span with "Beds:" label
3. Moves `select#naa1-1-567219` out of Box 1 into the wrapper, into Box 0
4. Relabels "Guest"/"Guests" → "Bed"/"Beds" on the select options
5. Sets Box 1 to `display: none` via inline style
6. Injects `.tnh-book-group` into Box 0 as normal

Result: dorm renders with "Beds: [select] [Book]" instead of the 
private-room "Select: [qty] [Book]".

---

## 9. Helper-injected elements

The iframe helper (`beds24-iframe-helper.js`) adds these elements to 
the page at runtime. CSS selectors in `CSS-base.css` depend on them.

### `.tnh-desc-text`
- **Type:** class applied to existing element
- **Target:** `[id^="collapsedesc"] > div:not(.fakelink)` (the 
  description text node)
- **Purpose:** styling hook for description text

### `.tnh-room-tags`
- **Type:** new `<div>` element
- **Injected into:** `.b24-room-desc` (the description module) via 
  `appendChild`
- **Contents:** `.tnh-tag` child spans, one per tag
- **Visibility:** visible at desktop breakpoint (≥768px); 
  `display: none` on mobile

### `.tnh-room-tags-mobile`
- **Type:** new `<div>` element
- **Injected into:** `.panel-body.b24panel` as sibling of `.offer`, 
  positioned before `.offer` via `insertBefore`
- **Contents:** `.tnh-tag` child spans, one per tag
- **Visibility:** visible at mobile breakpoint (≤767px); 
  `display: none` on desktop
- **Position in DOM:** first direct child of `.panel-body.b24panel` 
  (because Beds24's own first child is `.offer`, and tags-mobile is 
  inserted before it)

### `.tnh-tag`
- **Type:** new `<span>` element, child of `.tnh-room-tags` or 
  `.tnh-room-tags-mobile`
- **Contents:** icon emoji + tag text (e.g., "🛏 Sleeps 1")

### `.tnh-book-group`
- **Type:** new `<span>` element
- **Injected into:** the visible `.b24-multipricebox` via `appendChild`
- **Contents:** `.tnh-total-price` span + `.tnh-book-btn` button
- **Purpose:** Book button injection (Beds24 multi-room mode has no 
  per-room Book buttons)

### `.tnh-total-price`
- **Type:** new `<span>` element, child of `.tnh-book-group`
- **Contents:** total price text (e.g., "€62.00")
- **Visibility:** shown when qty > 0; hidden when qty is `0`

### `.tnh-book-btn`
- **Type:** new `<button>` element, child of `.tnh-book-group`
- **Behavior:** on click, sets qty to `1` if not set, dispatches 
  `change` on the qty select, submits the form

### `.tnh-price-pernight-main`
- **Type:** new `<span>` element
- **Target:** replaces contents of `#from-1-{roomId}` (the from-div)
- **Contents:** "from €X.XX / night" text
- **Edge case:** Beds24 may re-populate the from-div on qty change; 
  helper re-runs to restore

### Dorm-specific wrapper
- **Type:** new `<span>` element with inline styles
- **Contents:** "Beds:" label + moved guest select
- **Injected into:** visible `.b24-multipricebox` (Box 0) via 
  `insertBefore`, before the from-div
- **Only exists on:** dorm rooms (room 567219)

---

## 10. Critical DOM facts

Consolidated behaviors that have caused bugs. Know these before 
writing selectors or debugging layout.

### `.b24-multipricebox.hidden` must be explicitly hidden

Beds24 marks per-occupancy price boxes with Bootstrap's `.hidden` 
class. Any CSS that sets `display: flex !important` on 
`.b24-multipricebox` at broader scope will override `.hidden`'s 
`display: none !important` (same specificity, last wins). Always 
include:

```css
.b24-multipricebox.hidden,
.b24-offer-select .b24-multipricebox.hidden {
  display: none !important;
}
```

### Collapsed wrappers must be force-opened

Beds24 wraps photo sliders and descriptions in divs with 
`hidden-xs hidden-sm hidden-md hidden-lg` — effectively 
`display: none` at all breakpoints, toggled via `.fakelink` buttons. 
We hide fakelinks, so must force these open:

```css
[id^="collapseslider"] { display: block !important; height: auto !important; }
[id^="collapsedesc"]   { display: block !important; height: auto !important; }
```

### Bootstrap `.container` expands iframes on iOS Safari

Bootstrap sets fixed widths on `.container` at desktop breakpoints 
(750/970/1170px). Inside an iOS Safari iframe, any content wider 
than the screen expands the iframe beyond the viewport, and 
`@media (max-width: 767px)` then fails to trigger because the 
iframe reports the wider width. Helper Section 1 injects:

```css
.container { max-width: 100% !important; width: auto !important; box-sizing: border-box !important; }
.row       { max-width: 100% !important; }
```

This must load before any content renders.

### Beds24 Style panel generates inline styles that load after external CSS

The 20 color pickers on the Style admin page generate `<style>` 
blocks in the page `<head>`. These load after external CSS files 
and win at equal specificity (no `!important`, but later in the 
cascade).

For reliable color overrides, inject CSS via JS (helper Section 5). 
JS-injected `<style>` tags load last and beat both external CSS and 
Beds24's inline styles.

### Qty select has 2 jQuery change handlers, survive moves

The qty dropdown `select[id^="sr1-"]` has 2 handlers attached via 
jQuery's expando property on the element itself. Handlers survive 
DOM moves (`appendChild`, `insertBefore`) because jQuery expando 
storage travels with the element.

**They do NOT survive `cloneNode`.** Move only. When moving, move 
the entire `.b24-multipricebox` container so Beds24's internal 
`.closest('.b24-multipricebox')` traversals continue to resolve.

### MutationObserver patterns

- Beds24 re-adds `.hidden` to elements on state change via its own 
  observer (e.g., from-div toggles `.hidden` when qty > 0)
- Helper uses a single MutationObserver with an `isModifying` guard 
  to prevent re-entry
- Two observers on the same subtree with `subtree: true` where both 
  callbacks modify the DOM cause infinite loops (we hit this in 
  Session 6 — see retrospective)

### Date strip cells are clickable via delegated handlers

Already covered in §7, restated here for completeness: `.at_pricetd` 
clicks navigate to an unstyled Beds24 page. Block with 
`pointer-events: none`.

---

## 11. Selector quick reference

### Use these (verified reliable)

**Room-level:**
- `#ajaxroomoffer{roomId}` — per-room wrapper (only one is populated after AJAX)
- `.b24room` — individual room container
- `.panel.b24panel-room` — outer card wrapper (heading + panel body)
- `.b24-roompanel-heading` — room title heading (sibling of panel body)
- `.panel-body.b24panel` — inner panel body (contains everything else)

**Modules:**
- `.b24-room-slider` — photo slider module
- `.b24-room-desc` — description module
- `.b24-room-106` — features module (hide)
- `.offer.offer-o{roomId}-1` — offer section (one per room)
- `.b24-offer-pricetable` — date strip

**Offer internals:**
- `.b24-offer-select` — offer-select container
- `.multiroomshow` — inner container
- `[id^="selectors1-"]` — selectors wrapper (needs `flex: 1`)
- `.b24-multipricebox:not(.hidden)` — visible price box
- `.b24-multipricebox.hidden` — hidden per-occupancy boxes
- `select[id^="sr1-"]` — qty select (private rooms only)
- `input[type="hidden"][name^="sr1-"]` — qty input (dorms only)
- `select[id^="naa"]` — guest select
- `[id^="from-"]` — from-price container
- `.bookingpagedollars`, `.bookingpagecents`, `.bookingpagecurrency` — price spans

### For grid placement

- `.panel-body.b24panel > .row:has(.b24-room-slider)` — slider row
- `.panel-body.b24panel > .row:has(.b24-room-desc)` — desc row
- Do NOT use `:nth-of-type` — with 8 panel-body children, it won't pick 
  the row you expect

### Helper-injected elements

- `.tnh-room-tags-mobile` — first direct child of panel-body
- `.tnh-room-tags` — child of `.b24-room-desc`
- `.tnh-tag` — child of either tags container
- `.tnh-desc-text` — class on description text node
- `.tnh-price-pernight-main` — replaces from-div contents
- `.tnh-book-group` — child of visible `.b24-multipricebox`
- `.tnh-book-btn`, `.tnh-total-price` — children of `.tnh-book-group`

### For critical fixes

- `[id^="selectors1-"]` — flex: 1; min-width: 0
- `[id^="selectors1-"].hidden` — display: none (override)
- `.b24-multipricebox.hidden` — display: none (override)
- `[id^="collapseslider"]`, `[id^="collapsedesc"]` — force display: block
- `.container` — clamp max-width: 100% (iOS Safari)
- `.fakelink` — display: none
- `.at_offername` — display: none
- `.b24-room-106` — display: none (features module)

---

## 12. Changelog

- **2026-04-21 (Session 12):** Corrected panel-body children list (8 
  children, not 5). Added helper-injected elements section. Added 
  `#selectors1-{roomId}` documentation. Replaced `:nth-of-type` 
  guidance with `:has()` recommendation. Added verification status 
  section.
- **2026-04-17 (Session 10):** Updated with jQuery event handler 
  findings.
- **April 2026 earlier (Session 7):** Initial verification of core 
  DOM tree.
