# Beds24 Booking Page — DOM Structure Reference

Verified against: `booking2.php?propid=271142` (Layout 6, Template 6)
Last verified: Session 7 (April 2026)

## Page Structure

```
body.colorbody.colorbody-en.layout6
  form#formlook
    div#ajaxroomofferprop{propId}
      div.b24fullcontainer-top
      div.b24fullcontainer-ownerrow1
      div.b24fullcontainer-proprow1          ← property description 1
      div.b24fullcontainer-proprow2          ← property description 2
      div.b24fullcontainer-selector          ← BOOKING STRIP wrapper
        div#b24scroller-container.container
          div#b24scroller.b24-bookingstrip   ← the booking strip itself
            div.row
              div.b24-selector-checkin
                div#inputcheckingroup.form-group
                  input#inputcheckin
              div.b24-selector-checkout
                div.form-group
                  input#inputcheckout
              div.b24-selector-numnight (hidden-xs on mobile)
                select#inputnumnight
              div (Book button column)
                div.form-group.multiroomshow
                  div.multiplebookbutton
                    button.at_bookingbut.b24-multirombutton (type=submit)
              div (multiroom toggle column)
                input#multiroom (checkbox)
      div.b24fullcontainer-rooms             ← ROOM CONTAINER
        div.container.atcolor
          div#ajaxroomoffer{roomId}           ← one per room
            div.b24room#roomid{roomId}
              (see Room Card Structure below)
          div#notavailableforselection        ← "not available" message
      div#b24bookshoppingcart                ← BOTTOM SUMMARY BAR (hidden by CSS v3)
        div.container
          div.row
            div.multiplebookbutton           ← another Book button (hidden)
      div.b24fullcontainer-proprow11         ← property bottom content
      div.b24fullcontainer-ownerrow11
      div.b24fullcontainer-footer
```

## CRITICAL: `#b24scroller` is the BOOKING STRIP

Previous documentation incorrectly identified `#b24scroller` as the room container.
It is the **booking strip**. The room container is `.b24fullcontainer-rooms`.

## CRITICAL: Beds24 Loads All Rooms Into One AJAX Wrapper

The page structure shows separate `#ajaxroomoffer{roomId}` wrappers per room. However, after AJAX room loading, **all `.b24room` elements end up inside a single wrapper** (e.g., `#ajaxroomoffer567219`). The other `#ajaxroomoffer` wrappers remain in the DOM but are empty.

This means:
- CSS `order` on `#ajaxroomoffer` wrappers has no effect for sorting
- Room sorting must use DOM reordering on `.b24room` elements within their shared parent
- The parent of all `.b24room` elements is the single populated `#ajaxroomoffer` div, not `.b24fullcontainer-rooms .container`

## Room Card Structure

```
div.b24room#roomid{roomId}
  div.panel.b24panel-room.atcolor.border
    div.panel-heading.b24-roompanel-heading.colorbookingstrip.bb
      div#roomnametext{roomId}.at_roomnametext.b24inline-block
      div.roomalert
    div.panel-body.b24panel
      ┌─ div.offer.offer-o{roomId}-1                    ← OFFER SECTION
      │    div
      │      div.at_offername
      │      div.clearfix
      │      div.row                                     ← offer modules row
      │        div.b24-offer-select.b24-offer--o{roomId}-1
      │        │  div.multiroomshow
      │        │    div#warn-1-{roomId}.hidden.ajaxroomwarn.at_offerwarndiv  ← UNAVAILABLE WARNING
      │        │    div#selectors1-{roomId}              ← SELECTORS WRAPPER (no class; gets .hidden when unavailable)
      │        │      div.b24-multipricebox.pull-right   ← MAIN PRICE BOX
      │        │        div.form-inline
      │        │          span.roomofferqtyselectlabel ("Select") ← hidden by Beds24 in multi-room mode
      │        │          select#sr1-{roomId}            ← QTY DROPDOWN
      │        │          (or input[type=hidden] for dorms)
      │        │        div#from-1-{roomId}              ← "from €XX" price (Beds24 toggles .hidden on qty change)
      │        │        div#price-1-1-{roomId}           ← per-occupancy (HIDE)
      │        │        div#price-2-1-{roomId}           ← per-occupancy (HIDE)
      │        │        div#price-3-1-{roomId}           ← per-occupancy (HIDE)
      │        │        select#naa1-1-{roomId}           ← guest count (HIDE for private, MOVE for dorms)
      │        │    div.multiplebookbutton               ← Book button container (strip only, NOT per-room)
      │        │      button.at_bookingbut               ← Book button
      │        │    div.b24-multipricebox.hidden          ← PER-OCCUPANCY BOX (hidden)
      │        │    div.b24-multipricebox.hidden          ← PER-OCCUPANCY BOX (hidden)
      │        │    div.b24-multipricebox.hidden          ← PER-OCCUPANCY BOX (hidden)
      │        div.b24-offer-pricetable.b24-offer--o{roomId}-1  ← DATE STRIP
      │    hr.bb.hidden
      │
      ├─ div.row                                         ← Room Bottom row 1
      │    div.b24-room-106.b24-room-{roomId}            ← Features module
      │    div.b24-room-slider.b24-room-{roomId}         ← Photo slider module
      │      div.fakelink ("pictures")
      │      div#collapseslider{roomId}                  ← COLLAPSED by default
      │        div.carousel.slide#carousel-generic-r{propId}_{roomId}
      │          div.carousel-inner
      │            div.item.active → img.bootstrap-carousel-img
      │            div.item → img
      │            ...
      │          a.left.carousel-control
      │          a.right.carousel-control
      │          ol.carousel-indicators
      │      div.fakelink ("close")
      │
      ├─ div.clearfix
      │
      ├─ div.row                                         ← Room Bottom row 2
      │    div.b24-room-desc.b24-room-{roomId}           ← Description module
      │      div.fakelink ("more details")
      │      div#collapsedesc{roomId}                    ← COLLAPSED by default
      │        div.fakelink ("less details")
      │        div (actual description content)
      │
      └─ div.clearfix
```

## Date Strip Table Structure

```
table.roomofferpricetable
  tr.b24-bookingstrip.bt.bb.bl.br          ← HEADER ROW (hidden by CSS/JS)
    td.border.colorbookingstrip.at_checkin    "Check In"
    td.border.colorbookingstrip.at_checkout   "Check Out" (repeated per date column)
  tr                                        ← DATE ROW
    td.border                                "20 April", "21 April", etc.
  tr.b24-priceline                          ← AVAILABILITY ROW
    td.border.bbb.at_pricetd.dateavail.datestay       "Available" (in stay range)
    td.border.bbb.at_pricetd.dateavail.prevdatestay   "Available" (after stay)
    td.border.bbb.at_pricetd.datenotavail             "- - - - - -" (unavailable)
```

### Date Cell Classes

| Class | Meaning | Our Styling |
|---|---|---|
| `dateavail` | Available for booking | Cursor default (clicks blocked) |
| `datestay` | Within selected stay range | Green background (#6DA17D) |
| `datenotavail` | Not available | Light red bg, darker red text, strikethrough |
| `datepast` | Past date | Low opacity |
| `prevdatestay` | Previous cell was a stay date | Used for split-date gradients |
| `prevdateavail` | Previous cell was available | Used for split-date gradients |
| `prevdatenotavail` | Previous cell was unavailable | Used for split-date gradients |
| `at_pricetd` | All price table data cells | `pointer-events: none` (blocks click navigation) |

**Date cells have no `onclick` or `<a>` tags.** Click handlers are attached via Beds24's delegated event listeners. Blocked by `pointer-events: none`.

## Dorm Room DOM Differences

| Feature | Private Rooms | Dorm Rooms |
|---|---|---|
| Quantity selector | `select#sr1-{roomId}` (dropdown) | `input[type="hidden"][name="sr1-{roomId}"][value="1"]` |
| Guest selector | `select#naa1-1-{roomId}` (hidden by CSS) | `select#naa1-1-{roomId}` (moved to main box by helper) |
| Price boxes | 1 visible + N hidden | 2 visible + N hidden (helper hides orphan) |
| Booking mechanism | Qty dropdown + strip Book button | Guest selector + injected Book button |

### Dorm Price Box Layout (after helper v14)

```
div.b24-multipricebox (Box 0 — main)
  div.form-inline (empty — no qty dropdown for dorms)
  span (injected wrapper)
    span "Beds:"
    select#naa1-1-{roomId} (moved here from Box 1)
  div#from-1-{roomId} "from €32.00"
  button.tnh-book-btn "Book"

div.b24-multipricebox (Box 1 — orphan, hidden by helper)
  div.b24-form-inline (now empty)
  div.clearfix
```

## Selector Quick Reference

### Booking Strip
| Target | Selector |
|---|---|
| Strip wrapper | `.b24fullcontainer-selector` |
| Strip inner | `.b24-bookingstrip` / `#b24scroller` |
| Check-in input | `#inputcheckin` |
| Check-out input | `#inputcheckout` |
| Nights dropdown | `#inputnumnight` |
| Book/submit button | `.b24-bookingstrip .at_bookingbut` |
| Multi-room toggle | `#multiroom` |
| New search link | `.newsearch` |

### Room Cards
| Target | Selector |
|---|---|
| Room container | `.b24fullcontainer-rooms` |
| Room wrapper | `.b24room#roomid{roomId}` |
| Room panel | `.b24panel-room` |
| Room name text | `.at_roomnametext` / `#roomnametext{roomId}` |
| Offer section | `.offer` |
| Date strip | `.b24-offer-pricetable` |
| Date strip table | `.roomofferpricetable` |
| Date strip cells | `.roomofferpricetable .at_pricetd` |
| Qty/price area | `.b24-offer-select` |
| Main price box | `.b24-multipricebox:not(.hidden)` (first match) |
| Quantity dropdown | `select[id^="sr1-"]` |
| Dorm qty (hidden) | `input[name="sr1-{roomId}"]` |
| Guest count dropdown | `select[id^="naa"]` |
| "From" price | `[id^="from-"]` |
| Per-occupancy prices | `[id^="price-"][class*="b24-roomprice"]` |
| Hidden price boxes | `.b24-multipricebox.hidden` |
| Injected Book button | `.tnh-book-btn` |
| Dorm fix marker | `.tnh-dorm-fixed` |

**IMPORTANT:** In multi-room booking mode, `.multiplebookbutton` elements exist ONLY in the booking strip area (2 instances), NOT inside individual room cards. Per-room Book buttons are injected by helper v14.

### Bottom Summary Bar
| Target | Selector |
|---|---|
| Shopping cart wrapper | `#b24bookshoppingcart` |
| Property bottom content | `.b24fullcontainer-proprow11` |

Both hidden by CSS v3 and helper v14.

### Photo Slider
| Target | Selector |
|---|---|
| Slider module | `.b24-room-slider` |
| Collapse wrapper | `#collapseslider{roomId}` |
| Carousel | `.carousel.slide` |
| Active image | `.carousel .item.active img` |

### Description
| Target | Selector |
|---|---|
| Description module | `.b24-room-desc` |
| Collapse wrapper | `#collapsedesc{roomId}` |
| Fakelinks | `.fakelink` |

### Calendar
| Target | Selector |
|---|---|
| Property calendar | `.b24-prop-60` |
| Room calendar (duplicate, hidden) | `.b24-room-cal` |
| Offer calendar (hidden) | `.b24-offer-cal` |
| Selected dates | `.datestay` |
| Available dates | `.dateavail` |
| Unavailable dates | `.datenotavail` |

### Features
| Target | Selector |
|---|---|
| Features module | `.b24-room-106` (module ID 106) |

### Other
| Target | Selector |
|---|---|
| Body | `.colorbody.colorbody-en.layout6` |
| Form | `form#formlook` |
| Footer | `.b24fullcontainer-footer` |
