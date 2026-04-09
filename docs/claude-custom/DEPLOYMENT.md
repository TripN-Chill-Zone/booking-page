# Phase 3 Deployment Guide — Chill Zone (Property 271142)

## DOM Audit Summary

All CSS selectors verified against live booking page via Claude in Chrome.

| Target | Selector | Verified |
|---|---|---|
| Booking strip | `.b24-bookingstrip` / `#b24scroller` / `.colorbookingstrip` | Yes — contains checkin/checkout/nights/book button |
| Booking strip wrapper | `.b24fullcontainer-selector` | Yes |
| Checkin input | `#inputcheckin` | Yes |
| Checkout input | `#inputcheckout` | Yes |
| Nights dropdown | `#inputnumnight` | Yes |
| Book button | `.at_bookingbut` | Yes (6 instances — strip + per-room) |
| Rooms container | `.b24fullcontainer-rooms` | Yes |
| Room card wrapper | `.b24room` with `#roomid{id}` | Yes — 4 rooms |
| Room panel | `.panel.b24panel-room.atcolor.border` | Yes — inside .b24room |
| Room heading | `.b24-roompanel-heading` > `.at_roomnametext` | Yes — 4 headings |
| Room name text | `.at_roomnametext` / `#roomnametext{id}` | Yes |
| Photo slider collapse | `#collapseslider{roomId}` | Yes — has `hidden-xs hidden-sm hidden-md hidden-lg` |
| Carousel | `.carousel.slide` / `#carousel-generic-r271142_{roomId}` | Yes — 4 carousels, each with `.carousel-inner` > `.item` |
| Room calendar (DUPLICATE) | `.b24-room-cal` | Yes — 4 found, hidden by CSS |
| Offer calendar (KEEP) | `.b24-offer-cal` | Yes — 4 found |
| Property calendar (KEEP) | `.b24-prop-60` | Yes — 1 found |
| Room qty select | `select[id^="sr1-"]` | Yes |
| Guest count selects | `select[id^="naa"]` | Yes (per-room, NOT in booking strip) |
| Price elements | `#roomprice-1-{roomId}` | Exist but empty at page load (prices populate after interaction) |
| Multiple room checkbox | `#multiroom` | Yes |
| Body classes | `.colorbody.colorbody-en.layout6` | Yes |

### Key Structural Findings

1. **`#b24scroller` is the BOOKING STRIP**, not the room container. Previous assumption was wrong.
2. **No `#inputnumadult`/`#inputnumchild` in the booking strip** — guest counts are per-room selectors only (Layout 6 behavior).
3. **9 calendars total**: 1 property + 4 room-level (duplicates) + 4 offer-level. Room-level hidden via `.b24-room-cal { display: none }`.
4. **Photo sliders** collapsed by Beds24 via `hidden-xs hidden-sm hidden-md hidden-lg` on `#collapseslider{roomId}`. Fixed with `[id^="collapseslider"] { display: block !important }`.
5. **Price elements** exist in DOM but are empty on initial page load with date params. Prices appear to populate after user interaction. Price injection JS handles this gracefully (fails silently when no number found).

---

## Files

| File | Purpose | Destination |
|---|---|---|
| `css/beds24-base-v1.css` | External CSS — shared across properties | VPS public directory (via `&cssfile=` param) |
| `css/critical-css-payload.css` | FOUC prevention — source of truth | Git only (pasted into bookingcss) |
| `css/chill-zone-overrides.css` | Property variable overrides — reference | Git only (pasted into bookingcss) |
| `css/beds24-confirmation.css` | Confirmation page styles — reference | Pasted into customheadconfirm field |
| `js/beds24-rooms-v1.js` | Hide/reveal + price injection — reference | Git only (pasted into custombody) |
| **`docs/bookingcss-payload-chillzone.css`** | **ASSEMBLED: critical CSS + overrides** | **Paste into `bookingcss` field** |
| **`docs/custombody-payload-chillzone.html`** | **ASSEMBLED: JS in script tags** | **Paste into `custombody` field** |

---

## Deployment Steps

### Step 1: Beds24 Admin — Developer Page

Navigate to: Property Booking Page > Developer (`pagetype=bookingpagedesigndeveloper`)

| Field | Action | Source File |
|---|---|---|
| `customheadtop` | Keep existing Google Fonts link (Phase 2) | No change |
| `bookingcss` | **Replace** with assembled payload | `docs/bookingcss-payload-chillzone.css` |
| `custombody` | **Replace** with assembled payload | `docs/custombody-payload-chillzone.html` |
| `customheadconfirm` | **Paste** confirmation styles | `css/beds24-confirmation.css` |
| `customhead` | No change | — |
| `custombodytop` | No change | — |

### Step 2: Host External CSS (when VPS is ready)

Upload `css/beds24-base-v1.css` to VPS. Update booking page URL:

```
https://www.beds24.com/booking2.php?ownerid=141266&propid=271142&cssfile=https://DOMAIN/css/beds24-base-v1.css
```

Then trim `bookingcss` field to just: critical CSS payload + variable overrides (remove the external CSS rules that are now served by the file).

**VPS BLOCKED** — waiting on Hostkey. Until then, `bookingcss` field serves double duty.

### Step 3: Temporary Workaround (no VPS)

Since there's no VPS yet, paste the **entire external CSS** into the `bookingcss` field along with the critical CSS and overrides. This is suboptimal (large inline block) but fully functional for staging verification.

The assembled payload in `docs/bookingcss-payload-chillzone.css` already contains critical CSS + overrides. To add the external CSS rules temporarily, paste `css/beds24-base-v1.css` content ABOVE the assembled payload.

---

## Verification Checklist

### Phase 3 Core (must pass)

- [ ] Booking strip styled and functional — dates, nights, book button work
- [ ] Room cards visible and styled after date selection
- [ ] Room cards hidden before date selection (no checkin param)
- [ ] Pre-populated date parameters → rooms display immediately (with checkin param)
- [ ] Complete booking can be initiated: dates → room selection → checkout
- [ ] No CSS rule breaks booking flow
- [ ] Duplicate calendars hidden (should see 5, not 9)
- [ ] Photo sliders visible without click

### Phase 3 Dependent

- [ ] CSS variables apply — brand colors (#E7A35C primary, #6DA17D secondary, #2D482D text)
- [ ] Fonts render — Lexend (body), Lexend Giga (headings)
- [ ] No FOUC on Slow 3G throttle
- [ ] Image corners rounded on room cards
- [ ] Confirmation page styled (requires test booking)
- [ ] "From price" labels appear (if prices populate in DOM)
- [ ] No layout breakage at 375px, 390px, 430px viewports
- [ ] External CSS versioned filename in git

---

## Known Issues & Notes

### `numadult` defaults to 1
Beds24 resets guest count on search. This is a Beds24 behavior issue, not CSS. Options: widget config change, or accept as limitation.

### Price injection may not fire
DOM audit showed `#roomprice-1-{roomId}` elements exist but are empty at initial page load even with date params. Prices may populate only after quantity selection (consistent with "multiple booking enabled" limitation documented in execution plan). The JS handles this gracefully — no number found = no label injected = silent pass.

### Carousel images may need Bootstrap JS
The carousels have `.item.active` set correctly, but the auto-slide functionality depends on Bootstrap's carousel JS being loaded by Beds24. Manual prev/next controls should work via the `.carousel-control` elements.

### CSS Update Protocol
1. New versioned filename in git (`beds24-base-v2.css` etc.)
2. If above-the-fold structure changed, update `critical-css-payload.css`
3. Paste payload into one property's `bookingcss`
4. Point staging at new external file
5. Visually verify all viewports
6. Repeat for all four properties
7. Only then: update production
