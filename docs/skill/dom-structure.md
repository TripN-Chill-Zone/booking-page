# Beds24 Booking Page — DOM Structure Reference

Verified against: `booking2.php?propid=271142` (Layout 6, Template 6)
Last verified: Session 5 (April 2026)

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
      div.b24fullcontainer-proprow11         ← property bottom content
      div.b24fullcontainer-ownerrow11
      div.b24fullcontainer-footer
```

## CRITICAL: `#b24scroller` is the BOOKING STRIP

Previous documentation incorrectly identified `#b24scroller` as the room container.
It is the **booking strip**. The room container is `.b24fullcontainer-rooms`.

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
      │        │    div.b24-multipricebox.pull-right
      │        │      div.form-inline
      │        │        span.roomofferqtyselectlabel ("Select")
      │        │        select#sr1-{roomId}              ← QTY DROPDOWN
      │        │        (or input[type=hidden] for dorms)
      │        │      div#from-1-{roomId}                ← "from €XX" price (KEEP)
      │        │      div#price-1-1-{roomId}             ← per-occupancy (HIDE)
      │        │      div#price-2-1-{roomId}             ← per-occupancy (HIDE)
      │        │      div#price-3-1-{roomId}             ← per-occupancy (HIDE)
      │        │      select#naa1-1-{roomId}             ← guest count (HIDE)
      │        │    div.multiplebookbutton               ← Book button container
      │        │      button.at_bookingbut               ← Book button
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

## Selector Quick Reference

### Booking Strip
| Target | Selector |
|---|---|
| Strip wrapper | `.b24fullcontainer-selector` |
| Strip inner | `.b24-bookingstrip` / `#b24scroller` |
| Check-in column | `.b24-selector-checkin` |
| Check-in input | `#inputcheckin` |
| Check-out input | `#inputcheckout` |
| Nights dropdown | `#inputnumnight` |
| Nights column | `.b24-selector-numnight` |
| Book/submit button | `.b24-bookingstrip .at_bookingbut` |
| Multi-room toggle | `#multiroom` |
| New search link | `.newsearch` |

### Room Cards
| Target | Selector |
|---|---|
| Room container | `.b24fullcontainer-rooms` |
| Room wrapper | `.b24room#roomid{roomId}` |
| Room panel | `.b24panel-room` |
| Room heading bar | `.b24-roompanel-heading` |
| Room name text | `.at_roomnametext` / `#roomnametext{roomId}` |
| Panel body | `.b24panel` |
| Offer section | `.offer` |
| Date strip | `.b24-offer-pricetable` |
| Qty/price area | `.b24-offer-select` |
| Quantity dropdown | `select[id^="sr1-"]` |
| Dorm qty (hidden) | `input[name="sr1-{roomId}"]` |
| Guest count dropdown | `select[id^="naa"]` |
| "From" price | `[id^="from-"]` |
| Per-occupancy prices | `[id^="price-"][class*="b24-roomprice"]` |
| Book button container | `.multiplebookbutton` |
| Book button | `.multiplebookbutton .at_bookingbut` |

### Photo Slider
| Target | Selector |
|---|---|
| Slider module | `.b24-room-slider` |
| Collapse wrapper | `[id^="collapseslider"]` / `#collapseslider{roomId}` |
| Carousel | `.carousel.slide` / `#carousel-generic-r{propId}_{roomId}` |
| Active image | `.carousel .item.active img` |
| Carousel controls | `.carousel-control` |

### Description
| Target | Selector |
|---|---|
| Description module | `.b24-room-desc` |
| Collapse wrapper | `[id^="collapsedesc"]` / `#collapsedesc{roomId}` |
| Fakelinks | `.fakelink` |

### Calendar
| Target | Selector |
|---|---|
| Property calendar | `.b24-prop-60` |
| Room calendar (duplicate) | `.b24-room-cal` |
| Offer calendar | `.b24-offer-cal` |
| Calendar month | `.roomoffercalendarmonth` |
| Calendar header | `.monthcalendarhead` |
| Selected dates | `.datestay` |
| Available dates | `.dateavail` |
| Unavailable dates | `.datenotavail` |
| Past dates | `.datepast` |

### Features
| Target | Selector |
|---|---|
| Features module | `.b24-room-106` (module ID 106) |
| Property features field | `textarea#featurecodes` (on property description page) |

### Other
| Target | Selector |
|---|---|
| Body | `.colorbody.colorbody-en.layout6` |
| Form | `form#formlook` |
| Price boxes | `.b24-multipricebox` |
| Multi-room show sections | `.multiroomshow` |
| Footer | `.b24fullcontainer-footer` |
| Property description areas | `.b24fullcontainer-proprow1`, `.b24fullcontainer-proprow2` |

## Collapsed-by-Default Elements

Beds24 adds `hidden-xs hidden-sm hidden-md hidden-lg` (all breakpoints hidden) to these wrapper divs:

| Element | ID Pattern | Contains |
|---|---|---|
| Photo slider | `#collapseslider{roomId}` | The carousel with room photos |
| Description | `#collapsedesc{roomId}` | The room description text |

These are toggled visible by clicking `.fakelink` elements ("pictures", "more details"). Since we hide fakelinks, we must force these open with CSS:

```css
[id^="collapseslider"] { display: block !important; height: auto !important; }
[id^="collapsedesc"] { display: block !important; height: auto !important; }
```

## Dorm Room DOM Differences

Dorm rooms (configured for channel manager compatibility) render differently:

| Feature | Private Rooms | Dorm Rooms |
|---|---|---|
| Quantity selector | `select#sr1-{roomId}` (dropdown) | `input[type="hidden"][name="sr1-{roomId}"][value="1"]` |
| Guest selector | `select#naa1-1-{roomId}` (dropdown, multiple options) | `select#naa1-1-{roomId}` (only "0 Guests" / "1 Guest") |
| Visible booking control | Quantity dropdown + Book button appears when selected | Nothing visible — hidden input auto-selects 1 bed |
| Enquire link | Not present | `div.hidden.b24roomenquire` (hidden by Beds24, not our CSS) |
