# Session Handoff 5 — Beds24 Booking Page

## Goal

Phase 3: CSS/JS authoring for Chill Zone property. First Claude Code work session.

---

## What Was Accomplished in Session 5

### CSS Authoring — Complete (with known issues to iterate on)

All CSS is now authored, DOM-verified, and deployed via two mechanisms:

1. **External CSS file** (`CSS-base-v2.css`) — hosted on VPS via aaPanel, served via `&cssfile=` URL parameter
2. **Inline `bookingcss` field** — trimmed to 1,545 chars of critical CSS payload + Chill Zone variable overrides only

### JS Authoring — Partially Deployed

- Hide/reveal JS (`custombody` field) — **needs manual paste**. Beds24's AJAX save strips `<script>` tags when set programmatically via Claude in Chrome. Content was pasted manually by the user but needs verification.
- Confirmation page styles (`customheadconfirm` field) — **needs manual paste**. Same `<style>` tag stripping issue.
- Both payloads were provided to the user as copyable text in chat and saved as `.md` files in `docs/claude-custom/`.

### Beds24 Admin Configuration Changes

- **Multiple Room Booking**: Changed from "Guest Can Choose" to **"Enabled"** (pagetype `bookingpagedesign2`, field `bookpageallowmulti`, value `1`)
- **Room Features module**: Added to Room Bottom section in Layout page (module 106). User added this manually because the "add module" dropdown required manual interaction.

### External File Hosting — Working

- File hosted at: `https://astrongpresence.com/CSS-base-v2.css`
- Hosted via aaPanel file manager on the `astrongpresence.com` site (Hostkey VPS behind Cloudflare)
- File placed in the site's root web directory (not a subdirectory)
- Naming convention: `CSS-base-v{N}.css` (NOT `beds24-base-v{N}.css`)
- Cloudflare may cache the file — use versioned filenames (v3, v4, etc.) or cache buster `?v=N` for updates

### Git Commit

All Phase 3 source files committed to `docs/claude-custom/` in the project repo:
```
git commit c9ab530 "Phase 3: CSS/JS authoring for Chill Zone booking page"
10 files, 1,709 insertions
```

---

## Current Booking Page URLs

**With external CSS (use this for testing):**
```
https://www.beds24.com/booking2.php?ownerid=141266&propid=271142&checkin=20260422&numnight=3&numadult=2&cssfile=https://astrongpresence.com/CSS-base-v2.css
```

**Without dates (test hide/reveal JS):**
```
https://www.beds24.com/booking2.php?ownerid=141266&propid=271142&cssfile=https://astrongpresence.com/CSS-base-v2.css
```

---

## DOM Structure — Verified Selectors

All selectors verified via Claude in Chrome against the live Chill Zone booking page (Layout 6, Template 6).

### Page Structure

```
body.colorbody.colorbody-en.layout6
  form#formlook
    div#ajaxroomofferprop271142
      div.b24fullcontainer-top
      div.b24fullcontainer-ownerrow1
      div.b24fullcontainer-proprow1          ← property description 1
      div.b24fullcontainer-proprow2          ← property description 2
      div.b24fullcontainer-selector          ← BOOKING STRIP wrapper
        div#b24scroller-container.container
          div#b24scroller.b24-bookingstrip   ← booking strip (NOT room container!)
            div.row
              div.b24-selector-checkin → input#inputcheckin
              div.b24-selector-checkout → input#inputcheckout
              div.b24-selector-numnight → select#inputnumnight (hidden by CSS)
              div → button.at_bookingbut (the Book/submit button)
              div → .multiplebookbutton (bottom bar Book buttons)
      div.b24fullcontainer-rooms             ← ROOM CONTAINER
        div.container
          div#ajaxroomoffer567218             ← per-room wrappers
          div#ajaxroomoffer567219
          div#ajaxroomoffer567220
          div#ajaxroomoffer567221
      div.b24fullcontainer-proprow11
      div.b24fullcontainer-footer
```

### Room Card Structure

```
div.b24room#roomid{roomId}
  div.panel.b24panel-room.atcolor.border
    div.panel-heading.b24-roompanel-heading.colorbookingstrip
      div.at_roomnametext#roomnametext{roomId}
    div.panel-body.b24panel
      div.offer.offer-o{roomId}-1           ← OFFER SECTION
        div
          div.at_offername
          div.clearfix
          div.row                            ← contains offer modules
            div.b24-offer-select             ← qty selector + price + Book btn
              div.multiroomshow
                div.b24-multipricebox
                  div.form-inline
                    select#sr1-{roomId}      ← quantity dropdown (or hidden input for dorm)
                  div#from-1-{roomId}        ← "from €XX" price (KEEP THIS)
                  div#price-1-1-{roomId}     ← per-occupancy price (HIDE)
                  div#price-2-1-{roomId}     ← per-occupancy price (HIDE)
                  div#price-3-1-{roomId}     ← per-occupancy price (HIDE)
                div.multiplebookbutton       ← Book button (visible when multi-room enabled)
            div.b24-offer-pricetable         ← date strip / availability calendar
      div.row                                ← Room Bottom modules
        div.b24-room-106                     ← Features module
        div.b24-room-slider                  ← Photo slider
          div.fakelink "pictures"            ← hidden by CSS
          div#collapseslider{roomId}         ← was hidden-xs/sm/md/lg, forced open by CSS
            div.carousel.slide#carousel-generic-r271142_{roomId}
              div.carousel-inner
                div.item.active → img
          div.fakelink "close"
      div.clearfix
      div.row                                ← Room Bottom row 2
        div.b24-room-desc                    ← Description module
          div.fakelink "more details"        ← hidden by CSS
          div#collapsedesc{roomId}           ← was hidden, forced open by CSS
            div (actual description text)
          div.fakelink "less details"
```

### Key Selector Reference

| Target | Selector | Notes |
|---|---|---|
| Booking strip | `.b24-bookingstrip` / `#b24scroller` | NOT the room container |
| Room container | `.b24fullcontainer-rooms` | |
| Room card | `.b24room#roomid{id}` | |
| Room panel | `.b24panel-room` | Inside .b24room |
| Room heading | `.b24-roompanel-heading` | |
| Room name | `.at_roomnametext` | |
| Photo slider wrapper | `.b24-room-slider` | |
| Photo collapse | `[id^="collapseslider"]` | Has hidden-xs/sm/md/lg by default |
| Description collapse | `[id^="collapsedesc"]` | Has hidden-xs/sm/md/lg by default |
| Fakelinks | `.fakelink` | "pictures", "close", "more details", "less details" |
| Room calendar (duplicate) | `.b24-room-cal` | Hidden by CSS |
| Offer calendar | `.b24-offer-cal` | Hidden by CSS |
| Property calendar | `.b24-prop-60` | Kept visible |
| Offer section | `.offer` | Contains price + qty + date strip |
| Date strip | `.b24-offer-pricetable` | |
| Qty + price area | `.b24-offer-select` | |
| Quantity dropdown | `select[id^="sr1-"]` | Dorm uses hidden input instead |
| Guest count dropdown | `select[id^="naa"]` | Hidden by CSS (redundant with multi-room) |
| "From" price | `[id^="from-"]` | The one we keep |
| Per-occupancy prices | `[id^="price-"][class*="b24-roomprice"]` | Hidden by CSS |
| Book button (multi-room) | `.multiplebookbutton .at_bookingbut` | |
| Strip Book button | `.b24-bookingstrip .at_bookingbut` | Same class as multi-room buttons |
| Features module | `.b24-room-106` | |
| Nights selector | `.b24-selector-numnight` | Hidden by CSS |
| New search link | `.newsearch` | Hidden by CSS |
| Multi-room toggle | `#multiroom` | Hidden by CSS (always-on via config) |

---

## Current State of the Booking Page

### What's Working

- Brand fonts (Lexend body, Lexend Giga headings) applied everywhere
- Brand colors via CSS variables
- Room cards with rounded corners, subtle shadows
- Photo sliders forced open and visible (were collapsed by default)
- Descriptions forced open and visible (were behind "more details" click)
- Duplicate room-level calendars hidden (was showing 9, now showing correct 5 — 1 property + 4 offer)
- Offer-level calendars also hidden (only property calendar at top remains)
- Fakelinks ("pictures", "close", "more/less details") hidden
- Nights selector hidden from booking strip
- "New search" link hidden
- "Book Multiple" toggle hidden (always-on via config)
- Per-occupancy price breakdown hidden (only "from €XX" shows)
- Guest count selectors per room hidden (redundant)
- Room cards reordered via flexbox: images+features first, then description, then offer section at bottom
- Date strip inside each room card (availability calendar)
- External CSS file architecture working (no more Beds24 field size limits)

### Known Issues — Must Fix

1. **Booking strip not sticky** — scrolls away, should stay fixed at top. Needs `position: sticky; top: 0` on `.b24fullcontainer-selector`.

2. **Bottom Book bar not sticky** — the bar that appears when rooms are selected scrolls with the page. Should be `position: fixed; bottom: 0`.

3. **Dorm bed has no visible booking mechanism** — Beds24 renders `sr1-567219` as a hidden input (value=1) instead of a dropdown because the dorm is configured as 1-person-per-unit for channel manager compatibility. The guest sees the dorm card with price and dates but no way to select/book it. **Solution: inject a "Book" button via JS** that triggers the form submission for the dorm. The hidden input already sets quantity to 1.

4. **No per-room "Book" button next to quantity selector** — the Book button only appears in the bottom bar. The user wants a Book button right next to each room's quantity dropdown so guests can immediately proceed. **Solution: CSS to reposition the `.multiplebookbutton` inline with the quantity selector, or JS to create per-room Book buttons**.

5. **Features only showing on 2 of 4 rooms** — Single Room and Double Room show "Business / Desk" icons. Suite and Dorm show nothing. Property-level features (kitchen, garden, AC, etc.) exist but don't display at room level. Room-level features need to be added per room in Beds24 admin (SETTINGS > PROPERTIES > ROOMS > SET UP — but the "Features" field wasn't found on the room setup page for this property; it may be under PROPERTIES > DESCRIPTION only).

6. **Dorm only has 1 photo** — Session 4 confirmed only 1 photo was uploaded. More need to be uploaded manually.

7. **Photo + description layout** — photos are right-aligned with features/info to the left. The intended layout is photo LEFT, description RIGHT (Hostelworld-style). The CSS `flex: 0 0 40%` is on `.b24-room-slider` but the features module (`.b24-room-106`) sits next to it instead of the description. The description is in a separate `.row` element. May need to restructure via JS or rethink the layout approach.

8. **Booking strip overflows content area on desktop** — the date picker bar extends wider than the room cards below. Needs width constraint.

### Known Issues — Investigate

1. **"Enquire" link on dorm** — `div.hidden.b24roomenquire` exists with Beds24's own `hidden` class. Not our CSS. This is Beds24 behavior when "Allow Enquiry and Booking" mode is set. May be useful as a fallback for the dorm booking mechanism.

2. **Room ordering** — rooms appear in a different order than expected (Single, Dorm, Double, Suite instead of Suite first). Controlled by "Sell Priority" in SETTINGS > PROPERTIES > ROOMS > SETUP.

3. **Cloudflare caching** — external CSS file goes through Cloudflare. Use versioned filenames (`CSS-base-v3.css`) to bust cache on updates. The `?v=N` cache buster approach also works.

4. **`bookingcss` field character limit** — discovered the hard way. Beds24 silently rejects saves above ~18-19K characters. The inline field now holds only 1,545 chars (critical CSS). All aesthetic/layout rules are in the external file. Do not put large CSS blocks back in this field.

5. **`custombody` and `customheadconfirm` strip HTML tags on programmatic save** — these fields accept `<script>` and `<style>` tags when entered through the Beds24 admin UI manually, but Claude in Chrome's value-setting + form submission approach causes the server to strip the tags. Content must be pasted manually by the user.

---

## Beds24 Admin Field Current State

### Developer Page (`pagetype=bookingpagedesigndeveloper`, property 271142)

| Field | Content | Length |
|---|---|---|
| `bookingcss` | Critical CSS payload + Chill Zone variable overrides (minified) | 1,545 chars |
| `customheadtop` | Google Fonts `<link>` for Lexend + Lexend Giga (set in Phase 2) | 285 chars |
| `customhead` | Empty | 0 |
| `custombodytop` | Empty | 0 |
| `custombody` | Hide/reveal JS + price injection JS (manually pasted by user) | ~4,500 chars |
| `customheadconfirm` | Confirmation page styles (manually pasted by user) | ~2,800 chars |
| `descriptionmeta` | Empty (test content cleared in Phase 2) | 0 |
| `mapkey` | Empty | 0 |

### Configuration Page (`pagetype=bookingpagedesign2`, property 271142)

| Setting | Value |
|---|---|
| Multiple Room Booking (`bookpageallowmulti`) | 1 (Enabled) |

### Layout Page (`pagetype=bookingpagedesignlayout`, property 271142)

- Layout 6, Template 6
- Room Features module (106) added to Room Bottom section
- Room Description module in Room Bottom row 2

---

## External File Architecture

```
External CSS (served via &cssfile= parameter):
  https://astrongpresence.com/CSS-base-v2.css
  ↑ uploaded via aaPanel file manager to site root
  ↑ goes through Cloudflare (caching — use versioned filenames)

Inline bookingcss field:
  Critical CSS payload (FOUC prevention, 1,545 chars)
  + Chill Zone variable overrides (:root variables, font declarations)

Inline custombody field:
  <script> hide/reveal JS + price injection JS </script>
  (must be pasted manually — Beds24 strips <script> tags on programmatic save)

Inline customheadconfirm field:
  <style> confirmation page styles </style>
  (must be pasted manually — same tag stripping issue)

Inline customheadtop field:
  Google Fonts <link> tag (set in Phase 2, don't touch)
```

### CSS Update Protocol

1. Create new file with incremented version: `CSS-base-v3.css`
2. Upload to aaPanel (`astrongpresence.com` root directory)
3. Update booking page URL to reference new filename
4. Hard refresh to verify (Ctrl+Shift+R)
5. If critical CSS structure changed, update `bookingcss` inline field too

---

## Design Direction — Hostelworld Model

The booking page should feel like Hostelworld's room listing. Key principles from the Hostelworld analysis:

### Hostelworld Room Card Structure (from DOM inspection)

- Photo carousel (compact, left side)
- Room name
- Short description
- Tags: "Sleeps X", "Shared Bathroom" / "Ensuite"
- Availability urgency ("Only 2 rooms left!")
- Price (per room for privates, per bed for dorms) + "Free Cancellation"
- "Add" button per room

### Beds24 Adaptations

- Beds24 doesn't have an "Add to cart" model — uses quantity dropdowns + form submission
- Per-room date strip is a Beds24 feature we're keeping (Hostelworld doesn't have this)
- Guest count is per-room (via quantity selector), not global
- Dorm is a special case: auto-selects 1 bed, no dropdown

### Desired Room Card Layout (agreed with user)

```
┌────────────────────────────────────────────┐
│ Room Name                                  │
├──────────────┬─────────────────────────────┤
│              │ Description text             │
│  Photo       │ Features / amenities         │
│  (40%)       │ "Sleeps X" / "Ensuite" tags │
│              │                              │
├──────────────┴─────────────────────────────┤
│ Date Strip (availability calendar)          │
├─────────────────────────────────────────────┤
│ [Quantity ▼]  from €XX   [Book Now →]      │
└─────────────────────────────────────────────┘
```

Mobile: stacks vertically (photo full width, then description, then dates, then booking bar).

---

## Dorm Booking Problem — Deep Dive

The dorm room (567219) is configured for channel manager compatibility (Hostelworld, Booking.com). Its Beds24 settings cannot be changed.

**What Beds24 renders:**
- `input[type="hidden"][name="sr1-567219"][value="1"]` — auto-selects 1 bed
- `select#naa1-1-567219` — guest count (0 or 1 Guest), hidden by our CSS
- No quantity dropdown (unlike private rooms which get `select#sr1-{roomId}`)
- `div.hidden.b24roomenquire` — "Enquire" link, hidden by Beds24's own class
- Price shows ("from €48.00")
- Date strip shows

**The problem:** There's nothing for the guest to click to book the dorm. The hidden input auto-selects 1 bed, but the Book button in the bottom bar only becomes active when a room quantity is explicitly changed by the user. Since the dorm's quantity is pre-set via hidden input, the Book button doesn't activate.

**Recommended solution:** JS injection (via `custombody`) that:
1. Detects the dorm card by room ID
2. Creates a visible "Book" button
3. On click, sets the guest count to 1 (or triggers form submission)
4. Alternatively: unhides the `naa1-1-567219` selector and relabels it from "Guests" to "Beds"

**Alternative:** Change the Beds24 booking page config to "Allow Enquiry and Booking" — the "Enquire" link would then be visible and functional. But this changes the flow for all rooms.

---

## Project File Locations

### Git Repository: `C:\Users\Dr. COMPUTER\booking-page\`

```
docs/
  beds24-execution.md              ← execution plan (source of truth)
  beds24-execution-context.md      ← architecture decisions
  beds24-admin-field-map.md        ← admin field IDs and values
  claude-custom/                   ← Phase 3 deliverables (Session 5)
    DEPLOYMENT.md
    beds24-base-v1.css             ← original external CSS (superseded by CSS-base-v2)
    beds24-confirmation.css
    beds24-rooms-v1.js
    bookingcss-payload-chillzone.css
    chill-zone-overrides.css
    critical-css-payload.css
    custombody-payload-chillzone.html
    custombody.md                  ← paste-ready JS payload
    customheadcomfirm.md           ← paste-ready confirmation styles
CLAUDE.md                          ← project conventions
session-handoff-4.md               ← previous session handoff
```

### VPS (aaPanel / astrongpresence.com)

```
/www/wwwroot/astrongpresence.com/  (or similar — user navigated via aaPanel file manager)
  CSS-base-v2.css                  ← current external CSS file
```

### Beds24 Admin

- Property ID: 271142
- Room IDs: Suite (567218), Dorm (567219), Single (567220), Double (567221)
- Admin URL pattern: `https://beds24.com/control3.php?pagetype={pagetype}&id={propertyOrRoomId}`

---

## What Was NOT Accomplished

### Phase 3 items still open:

1. **Per-room Book button** — needs to be inline with quantity selector, not just in bottom bar
2. **Dorm booking mechanism** — needs JS solution (see deep dive above)
3. **Sticky booking strip** — CSS position:sticky not yet implemented
4. **Sticky bottom Book bar** — CSS position:fixed not yet implemented
5. **Room features for Suite and Dorm** — admin content entry needed
6. **Dorm photos** — only 1 uploaded, needs more
7. **Photo/description side-by-side layout** — partially working, features module sits next to photo instead of description
8. **Room ordering** — may need Sell Priority adjustment
9. **Confirmation page visual verification** — requires test booking
10. **Mobile QA** — not started (Phase 4)

### Other blocked items:

- **Custom Kadence widget** (Phase 0.1 fallback) — not started
- **Price injection JS verification** — prices were empty in DOM during testing, may only populate after interaction

---

## Recommended Next Steps (In Order)

1. **Fix the CSS file** — update `CSS-base-v3.css` with:
   - Sticky booking strip
   - Sticky bottom Book bar
   - Correct photo-left / description-right layout
   - Per-room Book button positioning
   - Booking strip width constraint
   
2. **Fix the dorm booking** — add JS to `custombody` field that creates a visible Book button on the dorm card

3. **Room features** — add features for Suite (ensuite bathroom, city views, king bed, desk, wardrobe) and Dorm (lockers, privacy curtains, shared bathroom, AC) in Beds24 admin

4. **Upload more dorm photos** — manual task in Beds24 Pictures admin

5. **Room ordering** — adjust Sell Priority if needed (Suite first, then private rooms, then dorm)

6. **Visual QA pass** — once layout is stable, do a thorough visual check on desktop and mobile

7. **Confirmation page verification** — requires a test booking (Phase 4 territory)

---

## Important Gotchas for Next Session

1. **`#b24scroller` is the BOOKING STRIP, not the room container.** The execution plan and earlier sessions assumed it was the room container. It's not. The room container is `.b24fullcontainer-rooms`.

2. **Beds24 `bookingcss` field has a ~18-19K character limit.** Saves above this silently fail. All large CSS must go in the external file.

3. **`custombody` and `customheadconfirm` strip `<script>` and `<style>` tags on programmatic save.** Content must be pasted manually by the user through the Beds24 admin UI.

4. **Cloudflare caches the external CSS file.** Use versioned filenames (`CSS-base-v3.css`, `CSS-base-v4.css`) to bust cache.

5. **The dorm's quantity selector is a hidden input, not a dropdown.** This is because of channel manager configuration constraints. The booking mechanism for dorms needs a JS-based solution.

6. **Beds24 collapses photo sliders and descriptions by default** using `hidden-xs hidden-sm hidden-md hidden-lg` class on wrapper divs (`#collapseslider{roomId}`, `#collapsedesc{roomId}`). CSS overrides with `display: block !important` are required.

7. **With "Multiple Room Booking" = "Enabled", Beds24 removes the global guest count from the booking strip** and shows per-room quantity dropdowns instead. The booking strip only has Check In, Check Out, Nights, and a Book button.

8. **Per-occupancy prices appear as separate elements** (`price-1-1-{roomId}`, `price-2-1-{roomId}`, etc.). Hide these and keep only the `from-1-{roomId}` element.

9. **The "Book" button in the booking strip is the SAME `.at_bookingbut` class** as the multi-room Book buttons. Be careful with CSS selectors — hiding `.at_bookingbut` globally will break booking.

10. **The Beds24 admin "add module" dropdown** for the Layout page requires manual UI interaction. Setting the select value and submitting the form programmatically doesn't trigger Beds24's add-module handler.

---

## Documents for Next Session

1. `CLAUDE.md` — project conventions, property/room IDs, tool usage
2. `docs/beds24-execution.md` — execution plan (source of truth)
3. `docs/beds24-execution-context.md` — architecture decisions
4. `docs/beds24-admin-field-map.md` — admin field IDs
5. This document (`session-handoff-5.md`)
6. The current external CSS file (`CSS-base-v2.css` — download from `https://astrongpresence.com/CSS-base-v2.css` or from `docs/claude-custom/`)
