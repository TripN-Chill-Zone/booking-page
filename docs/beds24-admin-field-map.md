# Beds24 Admin Field Map

Property ID: 271142 (Trip'n'Hostel Chill Zone)

Reference for Phase 2 (admin configuration), Phase 3 (CSS/JS authoring), and Phase 5 (rollout). All pages share hidden inputs: `id` (property ID), `pagetype`, `jquerysubmit` (`1`), `_t` (CSRF token).

---

## Property Booking Page → Layout

`pagetype=bookingpagedesignlayout` · Layout 6 selected. Module arrangement is dropdown-based (not drag-and-drop).

### General Settings

| Label | `name` / `id` | Value | Options |
|---|---|---|---|
| Layout selector | `layout` | 6 | 1–6 |
| Default Template | `template` | 6 | 1–7 (see below) |
| Calendar Dates | `splitdates` | Normal | Normal, Split |
| Border Style | `borderstyle` | Normal | Normal, Box Shadow |
| Save action | `layoutaction` | Save | Save, Save as Layout 1–5 |

**Templates:** 1) Offer Picture Slider, Description, Calendar · 2) Property Picture Slider: Offer Picture Slider, Description, Price Table · 3) Room Picture Slider, Description: Offer Description, Price Table · 4) Property Picture Slider: Offer Picture, Description, Calendar, Description 2 · 5) Property Picture Slider · 6) *selected* — Offer Price Table: Room Picture Slider, Description · 7) Property Picture Slider (full width): Offer Picture, Description, Calendar: Room Features: Property Map

### Module Placement

Each module has three dropdowns: Position (`order-N`), Desktop width (`lg-N`), Mobile width (`xs-N`).
Position options: "not used", row 1–9 × position 1–10. Width options: 1/12 through 12/12.

**Property Top** — add: `propheaderadd`
Modules available: Picture Slider, Description - BP 2, Picture, Cancel Policy, General Policy, Map, Triptease, Features, Description Text

| Module | N | Position | Desktop | Mobile |
|---|---|---|---|---|
| Property Description 1 | 51 | row 1 pos 1 | 12/12 | 12/12 |
| Property Calendar | 60 | row 1 pos 1 | 3/12 | 12/12 |
| Property Description - BP 1 | 53 | row 2 pos 1 | 12/12 | 12/12 |

**Room Top** — add: `roomheaderadd`
Modules available: Room Picture, Room Features, Room Description Text

| Module | N | Position | Desktop | Mobile |
|---|---|---|---|---|
| Room Calendar | 102 | row 1 pos 1 | 3/12 | 12/12 |

**Offer** — add: `offerheaderadd`
Modules available: Offer Picture, Description 1, Description 2, Picture Slider, Price Calendar

| Module | N | Position | Desktop | Mobile |
|---|---|---|---|---|
| Offer Select | 153 | row 1 pos 1 | 3/12 | 12/12 |
| Offer Calendar | 155 | row 1 pos 1 | 3/12 | 12/12 |
| Offer Price Table | 156 | row 1 pos 2 | 9/12 | 12/12 |

**Room Bottom** — add: `roomfooteradd`
Modules available: Room Picture, Room Features, Room Description Text

| Module | N | Position | Desktop | Mobile |
|---|---|---|---|---|
| Room Picture Slider | 104 | row 1 pos 1 | 6/12 | 12/12 |
| Room Description 1 | 101 | row 2 pos 1 | 12/12 | 12/12 |

**Property Bottom** — add: `propfooteradd` (same modules as Property Top)

| Module | N | Position | Desktop | Mobile |
|---|---|---|---|---|
| Property Description 2 | 52 | row 1 pos 1 | 12/12 | 12/12 |

---

## Property Booking Page → Configuration

`pagetype=bookingpagedesign2` · 11 dropdowns + 1 text input.

| # | Label | `name` / `id` | Value | Options |
|---|---|---|---|---|
| 1 | Style of Date Prices | `bookpagepriceperperson` | Per Room | Per Room, Per Person |
| 2 | Total Price Style | `bookpagepricepernight` | Total for all Nights | Total for all Nights, Total including obligatory, Average per Night |
| 3 | Default Number of Nights | `bookpagenumnight` | 2 | 1–60 |
| 4 | Default Number of Guests | `bookpagenumadult` | 1 | 0–99 |
| 5 | Minimum Number of Nights | `bookpagemindays` | 2 | 1–99 |
| 6 | Maximum Number of Guests | `bookpagemaxpeople` | Max Occupancy | Max Occupancy, 1–99 |
| 7 | Maximum Rooms per Page | `bookpagelimitcount` | 10 | 1–50 |
| 8 | Room Order | `bookpageunavailablerooms` | Unavailable at Bottom | Sell Priority, Unavailable at Bottom, Cheapest First, Expensive First, Hide Unavailable |
| 9 | Page Type | `allowbooking` | Allow Enquiry and Booking | Allow Enquiry Only, Allow Enquiry and Booking |
| 10 | Multiple Room Booking | `bookpageallowmulti` | Guest Can Choose | Disabled, Enabled, Guest Can Choose |
| 11 | Show Extra Marketing Column | `bookpageextracol` | No | No, Yes |
| 12 | Booking Page Price Multiplier | `bookpagemultiplier` | (empty) | Free-form text |

---

## Property Booking Page → Style

`pagetype=bookingpagedesignstyle` · 20 color pickers (hex text + jPicker swatch, values stored without `#`) + 3 dropdowns.

| # | Label | `id` / `name` | Value |
|---|---|---|---|
| 1 | Body Background | `colorbody` | `f4f4f4` |
| 2 | Content Background | `coloravailabilitytablebg` | `f4f4f4` |
| 3 | Content Text | `coloravailabilitytable` | `424242` |
| 4 | Link Colour | `colorlink` | `008acc` |
| 5 | Border Colour | `colorborder` | `dfdfdf` |
| 6 | Highlight Background From | `colorstripfrom` | `ffffff` |
| 7 | Highlight Background To | `colorstripto` | `ffffff` |
| 8 | Highlight Text | `colorstrip` | `424242` |
| 9 | Form Background | `colorbookingformbg` | `ffffff` |
| 10 | Form Text | `colorbookingform` | `424242` |
| 11 | Selected Dates Background | `colordateselectbg` | (empty) |
| 12 | Selected Dates Text | `colordateselect` | `222222` |
| 13 | Available Dates Background | `colordateavailablebg` | `f2f2f2` |
| 14 | Available Dates Text | `colordateavailable` | `424242` |
| 15 | Request Dates Background | `colordaterequestbg` | `dddddd` |
| 16 | Request Dates Text | `colordaterequest` | `777777` |
| 17 | Not Available Dates Background | `colordatenotavailablebg` | `f2dede` |
| 18 | Not Available Dates Text | `colordatenotavailable` | `a94442` |
| 19 | Button Background | `colorbuttonbg` | `008acc` |
| 20 | Button Text | `colorbutton` | `ffffff` |

| # | Label | `id` / `name` | Type | Value | Options |
|---|---|---|---|---|---|
| 21 | Button Style | `buttonstyle` | Dropdown | flat | gradient, flat |
| 22 | Font | `fontid` | Dropdown | Arial | Arial, Courier New, Georgia, Lucida Sans Unicode, Tahoma, Times New Roman, Trebuchet MS, Verdana |
| 23 | Font Size | `fontsize` | Dropdown | 14px | 6px–32px (1px increments) |

---

## Property Booking Page → Content

`pagetype=bookingpagedesigncontent` · 12 collapsible sections, one field each. All property-level, English only (`EN` suffix), all currently empty. No per-room or per-offer fields.

Fields 1–10: Summernote rich-text editor (WYSIWYG + HTML code view). Fields 11–12: plain textarea.

| # | Label | `name` / `id` | Type | Controls |
|---|---|---|---|---|
| 1 | Property Description 1 | `propdesctopEN` | Rich text | Top description (Layout module "Property Description 1") |
| 2 | Property Description 2 | `propdescbotEN` | Rich text | Second description (Layout module "Property Description 2") |
| 3 | Property Description – BP 1 | `propdescEN` | Rich text | Booking page description (Layout module "Prop Desc - BP 1") |
| 4 | Property Description – BP 2 | `propbookpagepricetableEN` | Rich text | Second booking page description |
| 5 | Guest Details Header | `propbookpageupsellEN` | Rich text | Text above guest details form |
| 6 | Guest Enquiry Header | `propbookpageenquireEN` | Rich text | Text above guest enquiry form |
| 7 | Confirm Booking Button Message | `propbookpageconfirmbookEN` | Rich text | Text near confirmation button |
| 8 | Room Not Available Message | `propbookpagenotavailEN` | Rich text | Shown when room unavailable |
| 9 | Room No Price Message | `propbookpagenopriceEN` | Rich text | Shown when no price set |
| 10 | No Rooms Available Message | `propbookpagenoroomsavailEN` | Rich text | Shown when no rooms match |
| 11 | General Policy | `metalegalpolicyEN` | Plain textarea | Terms/conditions/legal |
| 12 | Cancellation Policy | `metacancelpolicyEN` | Plain textarea | Cancellation terms |

Collapse state: hidden inputs `colapsestate13` through `colapsestate24`.

---

## Property Booking Page → Developer

`pagetype=bookingpagedesigndeveloper`

| Label | `id` | Type | Current Value |
|---|---|---|---|
| Custom CSS | `bookingcss` | Textarea | (empty) |
| Meta Description Text | `descriptionmeta` | Text input | (test — remove before prod) |
| Insert in HTML `<HEAD>` top | `customheadtop` | Textarea | (test — remove before prod) |
| Insert in HTML `<HEAD>` bottom | `customhead` | Textarea | (empty) |
| Insert in HTML `<BODY>` top | `custombodytop` | Textarea | (empty) |
| Insert in HTML `<BODY>` bottom | `custombody` | Textarea | (test — remove before prod) |
| Confirmation Page `<HEAD>` | `customheadconfirm` | Textarea | (empty) |
| Google Map API Key | `mapkey` | Text input | (empty) |

### Project Usage

| Field ID | Purpose |
|---|---|
| `bookingcss` | Per-property CSS variable overrides + critical CSS payload |
| `customheadtop` | Google Fonts `<link>` tag |
| `customhead` | Available for additional `<link>` tags |
| `custombodytop` | (unused) |
| `custombody` | Hide/reveal JS, price injection JS |
| `customheadconfirm` | Confirmation page styles |
| `descriptionmeta` | SEO meta description |
| `mapkey` | Not needed |

---

## Booking Widgets → Widget Designer

`pagetype=widget` · 19 dropdowns + 18 text inputs. All currently at defaults (empty/inherit).

### Target & Type

| # | Label | `name` | Type | Value | Options |
|---|---|---|---|---|---|
| 1 | Property | `propid` | Dropdown | 271142 | 271142, All (0) |
| 2 | Room | `roomid` | Dropdown | All | All (0), Deluxe King Suite (567218), Single Bed Dorm (567219), Single Room (567220), Standard Double (567221) |
| 3 | Widget Type | `widgetType` | Dropdown | Booking Box | Availability Calendar, Booking Box, Booking Box Mini, Booking Strip |
| 4 | Box Shadow | `boxShadow` | Dropdown | (inherit) | (blank), No, Yes |

### Localization & Layout

| # | Label | `name` | Type | Value | Options |
|---|---|---|---|---|---|
| 5 | Language | `widgetLang` | Dropdown | English | (blank), EN |
| 6 | Referrer | `referer` | Text | (empty) | — |
| 7 | Width | `width` | Dropdown | (inherit) | (blank), auto, 100%, 200px–1200px (10px steps) |
| 8 | Widget Title | `widgetTitle` | Text | (empty) | — |
| 9 | Show Labels | `showLabels` | Dropdown | (inherit) | (blank), No, Yes |

### Date & Guest Configuration

| # | Label | `name` | Type | Value | Options |
|---|---|---|---|---|---|
| 10 | Date Format | `dateFormat` | Dropdown | (inherit) | (blank), dd.mm.y, dd.mm.yy, dd/mm/y, dd/mm/yy, mm/dd/y, mm/dd/yy, d mm yy, M d y, MM d yy, MM d yy |
| 11 | First Day of Week | `weekFirstDay` | Dropdown | (inherit) | (blank), Sunday–Saturday (0–6) |
| 12 | People Selection | `peopleSelection` | Dropdown | (inherit) | (blank), none (0), guests (1), Adults and Children (2) |
| 13 | Date Selection | `dateSelection` | Dropdown | (inherit) | (blank), check-in only (0), check-in + check-out (1), check-in + nights (2), all three (3) |
| 14 | Default Check-in | `defaultNightsAdvance` | Dropdown | (inherit) | (blank), Today, Tomorrow, +2–+180 Days |
| 15 | Default Nights | `defaultNumNight` | Dropdown | (inherit) | (blank), 1–30 |
| 16 | Default Adults | `defaultNumAdult` | Dropdown | (inherit) | (blank), 1–30 |
| 17 | Default Children | `defaultNumChild` | Dropdown | (inherit) | (blank), 1–30 |
| 18 | Maximum Adults | `maxAdult` | Dropdown | (inherit) | (blank), 1–100 |
| 19 | Maximum Children | `maxChild` | Dropdown | (inherit) | (blank), 1–100 |

### Styling

| # | Label | `name` | Type | Value |
|---|---|---|---|---|
| 20 | Background Colour | `backgroundColor` | Text (hex) | (empty) |
| 21 | Border Colour | `borderColor` | Text (hex) | (empty) |
| 22 | Font Size | `fontSize` | Dropdown | (inherit) — options: (blank), 10px–24px |
| 23 | Colour | `color` | Text (hex) | (empty) |
| 24 | Button Background Colour | `buttonBackgroundColor` | Text (hex) | (empty) |
| 25 | Button Colour | `buttonColor` | Text (hex) | (empty) |
| 26 | Button Text | `buttonTitle` | Text | (empty) |

### Navigation

| # | Label | `name` | Type | Value | Options |
|---|---|---|---|---|---|
| 27 | Redirect URL | `redirect` | Text | (empty) | — |
| 28 | Target Window | `formTarget` | Dropdown | (inherit) | (blank), _self, bookingWindow, _blank, _parent, _top |

### Calendar Colors (Availability Calendar widget only)

| # | Label | `name` | Type | Value |
|---|---|---|---|---|
| 29 | Past Background | `pastBackgroundColor` | Text (hex) | (empty) |
| 30 | Past Colour | `pastColor` | Text (hex) | (empty) |
| 31 | Available Background | `availableBackgroundColor` | Text (hex) | (empty) |
| 32 | Available Colour | `availableColor` | Text (hex) | (empty) |
| 33 | Unavailable Background | `unavailableBackgroundColor` | Text (hex) | (empty) |
| 34 | Unavailable Colour | `unavailableColor` | Text (hex) | (empty) |
| 35 | Request Background | `requestBackgroundColor` | Text (hex) | (empty) |
| 36 | Request Colour | `requestColor` | Text (hex) | (empty) |
| 37 | Search Label | `searchLinkText` | Text | (empty) |

---

## Booking Widgets → Iframe Generator

`pagetype=widgetembed` · 8 dropdowns + 3 text inputs. Not used in this project (iframe architecture rejected), but documents available URL parameters.

| # | Label | `name` / `id` | Value | Options |
|---|---|---|---|---|
| 1 | Width | `width` | 800px | 250px–2000px (10px steps) |
| 2 | Height | `height` | 2000px | 250px–2000px (10px steps) |
| 3 | Opening Checkin Date | `advancedays` | Default | Default (-999), First Available (-1), Today (0), +1–+180 Days |
| 4 | Length of Stay | `numnight` | Default | Default, 1–31 |
| 5 | Number of Guests | `numadult` | Default | Default (-999), 0–8 |
| 6 | Referrer Text | `referer` | iframe | Free-form text |
| 7 | Number of Date Columns | `numdisplayed` | Default | Default (-999), 0–14 |
| 8 | Description / Header | `hidedesc` | Show (0) | Show (0), Hide (1) |
| 9 | Footer | `hidefooter` | Show (0) | Show (0), Hide (1) |
| 10 | Include Group | `group` | (empty) | Free-form text |
| 11 | Exclude Group | `nogroup` | (empty) | Free-form text |

### URL Parameters (from iframe generator, also valid for direct links)

These parameters can be appended to `booking2.php?propid=XXXXX`:
`checkin`, `numnight`, `numadult`, `numchild`, `numdisplayed`, `hidedesc`, `hidefooter`, `group`, `nogroup`, `referer`, `roomid`, `lang`, `cssfile`, `layout`, `version`

### Room IDs (from Widget Designer)

| Room | ID |
|---|---|
| Deluxe King Suite | 567218 |
| Single Bed in 4-Bed Dormitory Room | 567219 |
| Single Room with Shared Bathroom | 567220 |
| Standard Double Room with Shared Bathroom | 567221 |
