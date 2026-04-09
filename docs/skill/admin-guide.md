# Beds24 Admin — Configuration Guide

## Admin URL Pattern

```
https://beds24.com/control3.php?pagetype={pagetype}&id={propertyOrRoomId}
```

## Page Types

| Page | `pagetype` | `id` | Purpose |
|---|---|---|---|
| Developer | `bookingpagedesigndeveloper` | property ID | CSS, JS, HEAD injections |
| Layout | `bookingpagedesignlayout` | property ID | Module arrangement, template selection |
| Configuration | `bookingpagedesign2` | property ID | Booking behavior (nights, guests, multi-room) |
| Style | `bookingpagedesignstyle` | property ID | 20 color pickers + font + font size |
| Content | `bookingpagedesigncontent` | property ID | Property descriptions, policies, messages |
| Room Setup | `roomssetup` | room ID | Room name, quantity, occupancy settings |
| Room Description | `roomsdescription` | room ID | Room description text |
| Property Description | `propertydescription` | property ID | Property info, features/amenities |
| Pictures | (varies) | property/room ID | Photo upload and positioning |

## Developer Page Fields

| Field ID | Purpose | Max Size | Tag Stripping? |
|---|---|---|---|
| `bookingcss` | Custom CSS | ~18-19K chars (silent fail above) | No |
| `customheadtop` | HTML `<HEAD>` top injection | Unknown | No |
| `customhead` | HTML `<HEAD>` bottom injection | Unknown | No |
| `custombodytop` | HTML `<BODY>` top injection | Unknown | Yes (`<script>` stripped on programmatic save) |
| `custombody` | HTML `<BODY>` bottom injection | Unknown | Yes (`<script>` stripped on programmatic save) |
| `customheadconfirm` | Confirmation page `<HEAD>` | Unknown | Yes (`<style>` stripped on programmatic save) |
| `descriptionmeta` | SEO meta description | Unknown | No |
| `mapkey` | Google Map API Key | Unknown | No |

### Tag Stripping Behavior

When saving `custombody` or `customheadconfirm` via Claude in Chrome (setting textarea value + clicking save button), Beds24's server-side handler strips `<script>` and `<style>` tags. Plain text saves fine.

**Workaround:** The user must paste the content manually through the Beds24 admin UI in their browser. The UI's save mechanism handles the tags correctly.

This was verified in Session 5: saving "test123" worked, but saving `<script>...</script>` content resulted in empty fields after reload.

## Configuration Page Key Settings

| Setting | Field Name | Recommended Value | Notes |
|---|---|---|---|
| Multiple Room Booking | `bookpageallowmulti` | `1` (Enabled) | Removes global guest count from strip, adds per-room qty dropdowns |
| Default Number of Nights | `bookpagenumnight` | `2` | |
| Default Number of Guests | `bookpagenumadult` | `1` | |
| Minimum Number of Nights | `bookpagemindays` | `2` | |
| Room Order | `bookpageunavailablerooms` | "Unavailable at Bottom" | |
| Page Type | `allowbooking` | "Allow Enquiry and Booking" | |

### Multiple Room Booking Behavior

| Value | Strip Shows | Per-Room Shows | Guest Count |
|---|---|---|---|
| `0` (Disabled) | Check In, Check Out, Nights, Guests | No quantity dropdown | Global |
| `1` (Enabled) | Check In, Check Out, Nights, Book button | Quantity dropdown per room | Per-room |
| `2` (Guest Can Choose) | Check In, Check Out, Nights, Book Multiple toggle | Depends on toggle state | Depends |

When set to "Enabled": the booking strip Book button is the submit action (not a search). Per-room quantity dropdowns appear. Guest count selectors appear per room. The Book button in the strip and the `.multiplebookbutton` elements are both visible.

## Layout Page — Module Reference

### Available Modules

| Section | Module | ID | Notes |
|---|---|---|---|
| Property Top | Picture Slider | 51+ | |
| Property Top | Property Calendar | 60 | The one we keep visible |
| Room Top | Room Calendar | 102 | DUPLICATE — hide with CSS |
| Room Bottom | Room Picture Slider | 104 | Photo carousel |
| Room Bottom | Room Description | 101 | Text description |
| Room Bottom | Room Features | 106 | Amenity icons — must be added manually |
| Offer | Offer Select | 153 | Quantity + price + Book button |
| Offer | Offer Calendar | 155 | DUPLICATE — hide with CSS |
| Offer | Offer Price Table | 156 | Date strip |

### Adding a Module

The "add module" dropdown (`roomheaderadd`, `roomfooteradd`, `propheaderadd`, etc.) requires manual UI interaction. Setting the select value and clicking save programmatically does NOT trigger Beds24's add-module handler. The user must do this manually in the admin UI.

## Style Page Color Fields

| # | Label | Field ID | Value Format |
|---|---|---|---|
| 1 | Body Background | `colorbody` | hex without `#` (e.g., `f4f4f4`) |
| 2 | Content Background | `coloravailabilitytablebg` | hex without `#` |
| 3 | Content Text | `coloravailabilitytable` | hex without `#` |
| 4 | Link Colour | `colorlink` | hex without `#` |
| 5 | Border Colour | `colorborder` | hex without `#` |
| 19 | Button Background | `colorbuttonbg` | hex without `#` |
| 20 | Button Text | `colorbutton` | hex without `#` |
| 21 | Button Style | `buttonstyle` | `gradient` or `flat` |
| 22 | Font | `fontid` | Limited to: Arial, Courier New, Georgia, etc. |
| 23 | Font Size | `fontsize` | `6px` to `32px` |

Full list in `beds24-admin-field-map.md`.

## Room Features

Features are configured via "feature codes" in a textarea field:

- **Property level**: SETTINGS > PROPERTIES > DESCRIPTION > Features (`textarea#featurecodes`)
- **Room level**: SETTINGS > PROPERTIES > ROOMS > SET UP > Features (if available)

Property-level features apply to all rooms. Room-level features are additive.

The Features module (106) must be added to the Layout for features to display on the booking page.

### Common Feature Codes for Hostels

```
SHARED_KITCHEN
GARDEN
HEATING
AIR_CONDITIONING
LAUNDRY
NON_SMOKING_ROOMS
TV_ROOM
OUTDOOR_FURNITURE
DECK_PATIO_UNCOVERED
```

Room-specific features (lockers, ensuite, desk, etc.) may need to be entered differently — the "edit amenities" popup on the Features field provides checkboxes for standard amenities.
