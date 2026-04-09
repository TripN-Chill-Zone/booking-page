---
name: beds24-booking-page
description: "Configure and style Beds24 booking pages for hostel properties. Use this skill whenever the task involves Beds24 booking page CSS, JS injection, admin configuration, DOM inspection, layout customization, or booking flow design. Triggers include: any mention of Beds24, booking page styling, booking engine customization, hostel booking page, room card layout, booking strip, date strip, cssfile parameter, bookingcss field, custombody field, or property booking page configuration. Also use when working with Beds24 admin fields (Developer page, Layout page, Configuration page, Style page, Content page), when debugging Beds24 DOM elements, or when rolling out booking page changes across multiple properties. If the user mentions booking pages and hostels together, use this skill."
---

# Beds24 Booking Page — Skill Guide

This skill covers everything needed to configure, style, and deploy custom booking pages on the Beds24 platform for hostel properties. It was built from hands-on experience configuring the Trip'N'Hostel Chill Zone property and is designed for rollout across multiple properties.

## When to Read Reference Files

Before doing any work, read the appropriate reference file:

- **Starting a new property or resuming work**: Read `references/dom-structure.md` — the complete DOM map with verified selectors
- **Writing or editing CSS**: Read `references/dom-structure.md` for selectors, then `references/css-architecture.md` for the file architecture and variable system
- **Configuring Beds24 admin**: Read `references/admin-guide.md` for field IDs, page types, and known gotchas
- **Debugging a layout issue**: Read `references/dom-structure.md` for the element hierarchy and `references/gotchas.md` for known pitfalls

---

## Architecture Overview

The booking page is hosted on the Beds24 domain (`beds24.com/booking2.php`), styled via CSS/JS injection, and linked from the WordPress property site. It is NOT embedded in an iframe.

### CSS Architecture

```
External CSS file (served via &cssfile= URL parameter):
  https://{domain}/CSS-base-v{N}.css
  Contains: all structural rules, aesthetics, layout, responsive design
  No character limit — this is where all real CSS lives

Inline bookingcss field (Beds24 admin > Developer > Custom CSS):
  Contains: critical CSS payload (FOUC prevention) + per-property variable overrides
  HARD LIMIT: ~18-19K characters (saves silently fail above this)
  Keep this as small as possible — ideally under 2K

Inline custombody field (Beds24 admin > Developer > Insert in HTML <BODY> bottom):
  Contains: <script> tags with hide/reveal JS + price injection JS
  IMPORTANT: must be pasted manually — Beds24 strips <script> tags on programmatic save

Inline customheadconfirm field (Beds24 admin > Developer > Confirmation Page <HEAD>):
  Contains: <style> tags with confirmation page styles
  IMPORTANT: must be pasted manually — same tag stripping issue

Inline customheadtop field (Beds24 admin > Developer > Insert in HTML <HEAD> top):
  Contains: Google Fonts <link> tag
  Set once per property, don't touch after
```

### CSS Update Protocol

1. Create new file with incremented version: `CSS-base-v{N+1}.css`
2. Upload to VPS via aaPanel file manager
3. Update booking page URL to reference new filename (Cloudflare caches — versioned names bust cache)
4. Hard refresh to verify
5. If critical CSS structure changed, update `bookingcss` inline field too

### Guest Flow

WordPress property page → guest enters dates in booking widget → clicks "Search" → Beds24 booking page opens with `checkin`, `numnight`, `numadult` URL parameters → guest sees rooms, selects quantity, completes booking.

---

## Design Target — Hostelworld Model

The booking page should feel like Hostelworld's room listing. Key principles:

### Room Card Layout

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

### Booking Strip

Check In + Check Out only. No nights selector (redundant), no global guest count (handled per-room via quantity selectors). The strip should be sticky (fixed at top on scroll).

### What to Hide

- Nights selector (`.b24-selector-numnight`)
- "New search" link (`.newsearch`)
- "Book Multiple" toggle (`#multiroom`) — set to always-on via admin config
- Per-room guest count selectors (`select[id^="naa"]`) — redundant with multi-room
- Per-occupancy price breakdown (`[id^="price-"][class*="b24-roomprice"]`) — keep only "from" price
- Duplicate room-level calendars (`.b24-room-cal`)
- Offer-level calendars (`.b24-offer-cal`) — keep only property calendar at top
- Fakelinks (`.fakelink`) — "pictures", "close", "more/less details"

### What to Force Open

Beds24 collapses photo sliders and descriptions by default using `hidden-xs hidden-sm hidden-md hidden-lg` on wrapper divs. Override with:

```css
[id^="collapseslider"] { display: block !important; height: auto !important; }
[id^="collapsedesc"] { display: block !important; height: auto !important; }
```

---

## Per-Property Setup Checklist

For each new property:

### 1. Gather Property Info
- [ ] Property ID and room IDs (from Beds24 admin)
- [ ] Brand colors (primary, secondary, text, background)
- [ ] Fonts (Google Fonts names)
- [ ] Room names, descriptions, features per room
- [ ] Photos uploaded and positioned per room
- [ ] Policies (general, cancellation)

### 2. Beds24 Admin Configuration
- [ ] Layout 6, Template 6 set
- [ ] Style panel: brand colors applied (20 color fields)
- [ ] Google Fonts `<link>` tag in `customheadtop`
- [ ] Font override in `bookingcss` (`.colorbody` + heading selectors)
- [ ] Content entry: property description, room descriptions, policies
- [ ] Photos positioned per room
- [ ] Multiple Room Booking: set to "Enabled" (`bookpageallowmulti` = 1)
- [ ] Room Features module (106) added to Room Bottom in Layout
- [ ] Room features entered per room (or property-level in PROPERTIES > DESCRIPTION)

### 3. CSS Deployment
- [ ] Upload external CSS file to VPS: `CSS-base-v{N}.css`
- [ ] Paste critical CSS payload + variable overrides into `bookingcss` field
- [ ] Verify booking page loads with `&cssfile=` parameter

### 4. JS Deployment
- [ ] Paste hide/reveal JS into `custombody` field (MANUAL — tags get stripped programmatically)
- [ ] Paste confirmation styles into `customheadconfirm` field (MANUAL — same issue)

### 5. Verify
- [ ] Booking strip: Check In + Check Out only, no extra controls
- [ ] Room cards: photos visible, descriptions visible, features showing
- [ ] Date strip per room: showing availability
- [ ] Quantity selector + price + Book button at bottom of each card
- [ ] Duplicate calendars hidden
- [ ] Fakelinks hidden
- [ ] Per-occupancy prices hidden (only "from €XX" shows)
- [ ] Confirmation page styled
- [ ] Mobile layout stacks properly

### Per-Property CSS Variable Block

Each property gets a small variable override block in the `bookingcss` inline field. Template:

```css
:root {
  --b24-color-primary: #XXXXXX;
  --b24-color-secondary: #XXXXXX;
  --b24-color-text: #XXXXXX;
  --b24-color-text-light: #XXXXXX;
  --b24-color-bg: #XXXXXX;
  --b24-color-bg-white: #ffffff;
  --b24-color-border: #XXXXXX;
  --b24-color-accent-hover: #XXXXXX;
  --b24-color-secondary-hover: #XXXXXX;
  --b24-font-body: 'FontName', sans-serif;
  --b24-font-heading: 'HeadingFont', sans-serif;
}
.colorbody { font-family: 'FontName', sans-serif !important; }
h1, h2, h3, h4, h5, h6, .at_roomnametext, .b24-roompanel-heading, .monthcalendarhead {
  font-family: 'HeadingFont', sans-serif !important;
}
```

---

## Dorm Room Special Case

Dorm rooms configured for channel manager compatibility (Hostelworld, Booking.com) behave differently from private rooms on the Beds24 booking page:

- **Quantity selector**: renders as `input[type="hidden"]` auto-set to 1, NOT a `<select>` dropdown
- **Guest selector**: only "0 Guests" / "1 Guest" — hidden by CSS but the hidden input handles selection
- **No visible booking mechanism**: the guest sees the price and date strip but nothing to click
- **Solution needed**: JS injection to create a visible "Book" button on dorm cards, or unhide/restyle the guest selector

This is a per-property issue — every hostel with dorm rooms will have it. The JS solution should detect rooms with hidden `sr1-` inputs and inject a booking mechanism.

---

## Tool Usage

| Task | Tool | Notes |
|---|---|---|
| CSS/JS authoring | Claude Code / Claude chat | Write files, output for upload |
| Beds24 admin field reads | Claude in Chrome | JS execution on admin pages |
| Beds24 admin field writes | Claude in Chrome | Works for text fields; FAILS for `<script>`/`<style>` tags |
| Beds24 admin `<script>`/`<style>` writes | Manual paste by user | Beds24 strips tags on programmatic save |
| DOM inspection of booking page | Claude in Chrome | JS execution on booking page |
| Visual verification | User screenshot or Claude in Chrome | MCP tabs may have 0 viewport width |
| Photo uploads | Manual by user | File picker inaccessible to automation |
| Mobile QA | Manual on real iOS device | Cannot be automated |
| VPS file upload | User via aaPanel file manager | |

### Claude in Chrome Tips for Beds24

- Admin page type URL pattern: `https://beds24.com/control3.php?pagetype={type}&id={propertyOrRoomId}`
- Key page types: `bookingpagedesigndeveloper`, `bookingpagedesignlayout`, `bookingpagedesign2`, `bookingpagedesignstyle`, `bookingpagedesigncontent`, `roomssetup`, `propertydescription`
- The booking page URL may get blocked by content filters when reading values — avoid including URLs in JS return values
- The MCP tab may have `innerWidth: 0` (background tab), making width-dependent layout testing unreliable — use user screenshots for visual verification
- Beds24 form saves use AJAX (`jquerysubmit=1`) — click the save button element, don't submit the form directly
- The "add module" dropdown on the Layout page requires manual UI interaction — programmatic value-setting doesn't trigger Beds24's handler
