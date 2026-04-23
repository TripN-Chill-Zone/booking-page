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

> For the architectural background on how Beds24 channel configuration 
> interacts with OTA pricing models (and the specific rules for dorm 
> properties), see `ota-channel-reference.md`.

## Developer Page Fields

| Beds24 UI Name | Field ID | Purpose | Max Size | Tag Stripping? |
|---|---|---|---|---|
| Custom CSS | `bookingcss` | Custom CSS | ~18-19K chars (silent fail above) | No |
| Insert in HTML <HEAD> top | `customheadtop` | HTML `<HEAD>` top injection | Unknown | No |
| Insert in HTML <HEAD> bottom | `customhead` | HTML `<HEAD>` bottom injection | Unknown | No — `<script>` and `<style>` tags preserved |
| Insert in HTML <BODY> top | `custombodytop` | HTML `<BODY>` top injection | Unknown | Yes (`<script>` stripped on programmatic save) |
| Insert in HTML <BODY> bottom | `custombody` | HTML `<BODY>` bottom injection | ~2,000 chars | Yes (`<script>` stripped on programmatic save) |
| Confirmation page HEAD | `customheadconfirm` | Confirmation page `<HEAD>` | Unknown | Yes (`<style>` stripped on programmatic save) |
| Meta description | `descriptionmeta` | SEO meta description | Unknown | No |
| Google Map API Key | `mapkey` | Google Map API Key | Unknown | No |

### Tag Stripping Behavior

When saving "Insert in HTML <BODY> bottom" or the confirmation page HEAD field via Claude in Chrome (setting textarea value + clicking save button), Beds24's server-side handler strips `<script>` and `<style>` tags. Plain text saves fine.

**Workaround:** The user must paste the content manually through the Beds24 admin UI.

**"Insert in HTML <HEAD> bottom" does NOT strip tags** — this is the preferred field for loading external JS files.

### Style Panel Generates Inline CSS

The 20 color pickers on the Style page generate CSS rules as inline `<style>` blocks in the page `<head>`. These include `.datestay` background colors, button colors, border colors, etc. They:
- Load after external CSS files (win at equal specificity)
- Do NOT use `!important`
- Can be overridden by JS-injected `<style>` tags with `!important` (loads last)

This is why the helper JS injects date strip color overrides via a `<style>` tag rather than relying on the external CSS file alone.

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

When set to "Enabled": the booking strip Book button is the submit action. Per-room quantity dropdowns appear (except dorm rooms which have hidden inputs). Guest count selectors appear per room. Both the strip Book button and `.multiplebookbutton` elements are visible — but `.multiplebookbutton` only exists in the strip area (2 instances), NOT inside room cards.

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

The "add module" dropdown requires manual UI interaction. Setting the select value and clicking save programmatically does NOT trigger Beds24's add-module handler.

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

**Note:** The colors set here generate inline `<style>` blocks that affect `.datestay`, button backgrounds, etc. Our helper JS overrides these where needed.

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

---

## Current Configuration State (Trip'N'Hostel Chill Zone, Property 271142)

Last verified: Session 10 (2026-04-17)

### Developer Page

| Field | Content | Chars |
|---|---|---|
| `bookingcss` (Custom CSS) | CSS variable overrides + FOUC prevention rules | 1,545 |
| `customheadtop` (HEAD top) | Google Fonts `<link>` for Lexend + Lexend Giga | 285 |
| `customhead` (HEAD bottom) | `Date.now()` bootstrapper loading `beds24-iframe-helper.js` | 159 |
| `custombodytop` (BODY top) | Empty | 0 |
| `custombody` (BODY bottom) | Empty | 0 |
| `customheadconfirm` (Confirmation HEAD) | Empty | 0 |
| `descriptionmeta` | Empty | 0 |

### Configuration Page

| Setting | Value |
|---|---|
| Price Display | Per Room |
| Price Period | Total for all Nights |
| Default Nights | 2 |
| Default Guests | 1 |
| Minimum Nights | 2 |
| Max People | Max Occupancy |
| Room Limit Count | 10 |
| Room Order | Cheapest First |
| Booking Type | Allow Enquiry and Booking |
| Multiple Room Booking | Enabled |
| Extra Columns | No |

### Style Page (all hex values without #)

| Field | Value | Purpose |
|---|---|---|
| `colorbody` | F7FAFC | Page background — light gray |
| `coloravailabilitytablebg` | ffffff | Content background — white |
| `coloravailabilitytable` | 2D482D | Content text — dark green |
| `colorlink` | 6DA17D | Link color — medium green |
| `colorborder` | EDF2F7 | Border color — very light gray |
| `colorstripfrom` | EDF2F7 | Strip gradient start |
| `colorstripto` | EDF2F7 | Strip gradient end |
| `colorstrip` | 2D482D | Strip text — dark green |
| `colorbookingformbg` | ffffff | Booking form background |
| `colorbookingform` | 2D482D | Booking form text |
| `colordateselectbg` | E7A35C | Date selected background — orange (brand primary) |
| `colordateselect` | ffffff | Date selected text — white |
| `colordateavailablebg` | F7FAFC | Date available background |
| `colordateavailable` | 2D482D | Date available text |
| `colordaterequestbg` | EDF2F7 | Date request background |
| `colordaterequest` | 777777 | Date request text |
| `colordatenotavailablebg` | f2dede | Date not available background — light red |
| `colordatenotavailable` | a94442 | Date not available text — dark red |
| `colorbuttonbg` | E7A35C | Button background — orange (brand primary) |
| `colorbutton` | ffffff | Button text — white |

### Layout Page

| Setting | Value |
|---|---|
| Template | Layout 6 |
| Layout | 6: Offer Price Table: Room Picture Slider, Description |
| Offer Select | Row 1 Position 1, quarter width (3/12) |
| Offer Price Table | Row 1 Position 2, 9/12 width |
| Room Features (module 106) | Added to Room Bottom — hidden by CSS, data extracted by JS |

### Room Descriptions (updated Session 10)

| Room | ID | Description |
|---|---|---|
| Deluxe King Suite | 567218 | Spacious premium suite with a huge king-sized bed, ensuite bathroom and panoramic city views. Perfect for extended stays. |
| Single Bed in 4-Bed Dormitory Room | 567219 | A comfortable bed in a modern 4-person dorm. Great value with a social atmosphere — meet fellow travelers without breaking the bank. |
| Single Room with Shared Bathroom | 567220 | Ideal room for solo travelers who value privacy and the social atmosphere of a co-living space. A quiet, private room to call your own. |
| Double Room with Shared Bathroom | 567221 | Private double room for couples or friends. All the comfort and privacy you need, with full access to our shared spaces. |
