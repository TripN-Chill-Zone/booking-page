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

The booking page uses a two-part system: a custom JavaScript widget on the WordPress property site handles date/guest selection and displays rooms in an iframe. When the guest clicks Book, the Beds24 checkout page takes over the full browser tab. The guest completes booking on native Beds24, and the back button returns to the WordPress page.

**The Beds24 WordPress plugin's iframe embed was rejected** due to iOS double-scroll issues and lack of control over the booking flow. Our custom widget replaces it entirely.

### File Architecture

```
WordPress side:
  Custom HTML block on "Book A Room" page:
    <div id="tnh-booking-root"></div>
    <script src="https://{domain}/booking-widget-v{N}.js"></script>
  
  The widget JS is self-contained — injects CSS, HTML, and all logic.
  Hosted on VPS, versioned filenames for cache busting.

Beds24 side:
  customhead field (Insert in HTML <HEAD> bottom):
    <script src="https://{domain}/beds24-iframe-helper-v{N}.js"></script>
    NOTE: customhead does NOT strip <script> tags (unlike custombody)
    This is the preferred injection point for external JS.

  customheadtop field (Insert in HTML <HEAD> top):
    Google Fonts <link> tag — set once per property

  bookingcss field (Custom CSS):
    Critical CSS payload (FOUC prevention) + per-property variable overrides
    HARD LIMIT: ~18-19K characters (saves silently fail above)
    Keep under 2K — all real CSS goes in external file

  custombody field (Insert in HTML <BODY> bottom):
    Hide/reveal JS from earlier sessions
    LIMIT: ~2,000 characters
    IMPORTANT: strips <script> tags on programmatic save — must paste manually
    NOTE: with the iframe helper in customhead, custombody may become redundant

  External CSS file (served via &cssfile= URL parameter):
    https://{domain}/CSS-base-v{N}.css
    Contains: all structural rules, aesthetics, layout, responsive design
    No character limit
```

### Guest Flow

```
WordPress "Book A Room" page
  → Guest enters dates + guests in widget
  → Clicks "Search Rooms"
  → Beds24 booking page loads in iframe below widget
    (booking strip, headers, footer hidden by helper script)
  → Guest sees room cards with photos, descriptions, prices
  → Guest selects quantity and clicks per-room "Book" button
  → form.target="_top" breaks out of iframe
  → Beds24 checkout takes over full browser tab
  → Guest completes booking on native Beds24
  → Back button returns to WordPress "Book A Room" page
```

### Widget Configuration (Per-Property)

The booking widget has a CONFIG block at the top:

```javascript
var CONFIG = {
  ownerid: '141266',
  propid:  '271142',
  cssfile: 'https://astrongpresence.com/CSS-base-v3.css',
  minNights: 2,
  maxNights: 90,
  defaultNights: 2,
  primaryColor: '#E7A35C',
  secondaryColor: '#6DA17D',
  // ... brand colors and fonts
};
```

For rollout, create per-property widget files with updated CONFIG values.

### Iframe Helper Behavior

The helper script (`beds24-iframe-helper-v{N}.js`) loaded via "Insert in HTML <HEAD> bottom" does different things depending on context:

**When embedded via widget** (`referer=widget` in URL AND inside iframe):
- Hides booking strip, property headers/footers, bottom summary bar, shopping cart
- Reports page height to parent via `postMessage` (uses `getBoundingClientRect` on `.b24fullcontainer-rooms`)
- Sets `form.target = '_top'` so checkout breaks out of iframe

**Always** (whether embedded or direct visit):
- Injects per-room orange Book buttons (Beds24 multi-room mode has NONE per-room)
- Fixes dorm room booking (moves guest selector into main price box, relabels "Guests" → "Beds", hides orphan price box)
- Injects date strip color overrides (green stay dates, light red unavailable, non-clickable cells, hidden header row)

### Height Sync Between WordPress and Beds24

The iframe has `scrolling="no"`. The helper reports height via `postMessage`. The widget receives these and sets iframe height.

**Key rules:**
- Use `getBoundingClientRect().bottom` on `.b24fullcontainer-rooms` — avoids counting hidden footer containers
- Do NOT set `body.style.height` — risks clipping and self-referencing loops
- `display:none` elements contribute 0 — hiding elements is sufficient
- Widget shows loading spinner until reported height > 500px
- 8-second fallback shows iframe at 2400px if no height message arrives
- **CRITICAL: iframe must use `opacity:0` during loading, NOT `display:none`.** `display:none` prevents content rendering inside the iframe, making all height measurements return 0. This caused an 18-second loading delay on desktop (Session 7).

### CSS Update Protocol

1. Create new file with incremented version: `CSS-base-v{N+1}.css`
2. Upload to VPS via aaPanel file manager
3. Update booking page URL to reference new filename (Cloudflare/LiteSpeed cache — versioned names bust cache)
4. Hard refresh to verify
5. If critical CSS structure changed, update `bookingcss` inline field too

### JS Update Protocol

1. Create new file with incremented version (e.g., `beds24-iframe-helper-v{N+1}.js`)
2. Upload to VPS via aaPanel file manager
3. **Verify file is accessible** — navigate to URL, confirm 200 response and correct content
4. Update the corresponding Beds24 field ("Insert in HTML <HEAD> bottom") or WordPress HTML block
5. Hard refresh to verify
6. If 404: file not uploaded, or cached 404 — use new version number or purge cache

**CRITICAL: Always verify file accessibility (step 3) before debugging anything else. This protocol caught two deployment failures in Session 7.**

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
- [ ] Upload booking widget JS to VPS: `booking-widget-v{N}.js` (copy from Chill Zone, update CONFIG)
- [ ] Upload Beds24 iframe helper JS to VPS: `beds24-iframe-helper-v{N}.js`
- [ ] **Verify both files accessible** — navigate to URLs, confirm 200 response
- [ ] Add iframe helper `<script>` tag to `customhead` field (does NOT strip tags)
- [ ] WordPress: add Custom HTML block with `<div id="tnh-booking-root"></div>` + `<script src>` tag
- [ ] Existing `custombody` content: keep hide/reveal JS from earlier setup (paste manually if needed)

### 5. Verify
- [ ] Widget renders on WordPress page: date picker, guest selector, Search button
- [ ] Search loads rooms in iframe below widget
- [ ] Room cards: photos visible, descriptions visible, features showing
- [ ] Date strip per room: showing availability
- [ ] Per-room Book button visible on each room card (injected by helper JS)
- [ ] Dorm rooms: guest selector visible, relabeled "Beds", right-aligned
- [ ] Clicking Book breaks out of iframe to full-page Beds24 checkout
- [ ] Back button returns to WordPress page
- [ ] Duplicate calendars hidden
- [ ] Fakelinks hidden
- [ ] Per-occupancy prices hidden (only "from €XX" shows)
- [ ] No excess whitespace below rooms
- [ ] Mobile layout stacks properly
- [ ] No iOS double-scroll issue

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
- **Guest selector**: only "0 Guests" / "1 Guest" — in a separate `.b24-multipricebox` from the "from" price
- **No visible booking mechanism**: without the helper, the guest sees only the price and date strip
- **Two visible price boxes**: Box 0 has the "from" price; Box 1 has the guest selector. This creates two rows.

**Solution (implemented in iframe helper v14):**
1. Detect dorm rooms by finding `input[type="hidden"][name^="sr1-"]`
2. Relabel guest selector options from "Guests" to "Beds"
3. Move the guest selector from Box 1 (orphan) into Box 0 (main, contains "from" price) — inserted before the "from" price element
4. Hide Box 1 (now empty)
5. Inject an orange Book button into Box 0 (same as private rooms)
6. Result: `[Beds: 1 Bed ▼] [from €32.00] [Book]` on one line, matching private rooms

**Do not change the dorm's Beds24 room configuration** — it affects channel manager integrations with Hostelworld, Booking.com, etc.

This is a per-property issue — every hostel with dorm rooms will have it. The iframe helper handles it automatically.

---

## Tool Usage

| Task | Tool | Notes |
|---|---|---|
| CSS/JS authoring | Claude Code / Claude chat | Write files, output for download |
| VPS file upload | User via aaPanel file manager | Upload to site root, versioned filenames |
| **File verification** | **Claude in Chrome or user browser** | **ALWAYS navigate to URL and confirm 200 before debugging** |
| WordPress page editing | User or Claude in Chrome | Custom HTML block with div + script tag |
| Beds24 admin field reads | Claude in Chrome | JS execution on admin pages |
| Beds24 admin field writes | Claude in Chrome | Works for text fields and `customhead`; FAILS for `custombody`/`customheadconfirm` `<script>`/`<style>` tags |
| Beds24 admin `<script>`/`<style>` writes | Manual paste by user | Only needed for `custombody` and `customheadconfirm` fields |
| DOM inspection of booking page | Claude in Chrome | JS execution on booking page; `offsetHeight` returns 0 in MCP tabs |
| Visual verification | User screenshot | MCP tabs have 0 viewport width — screenshots are the ONLY reliable visual test |
| Photo uploads | Manual by user | File picker inaccessible to automation |
| Mobile QA | Manual on real iOS device | Cannot be automated |

### Deployment Verification Protocol

**Run this EVERY time a file is uploaded or a field is changed:**

1. Navigate to each JS/CSS file URL in browser — confirm 200 (not 404) and correct content
2. Check Beds24 `customhead` field has correct `<script src>` URL
3. Check WordPress Custom HTML block has both `<div id="tnh-booking-root"></div>` AND `<script src>` tag
4. Hard refresh the booking page
5. Then test functionality

**If step 1 fails:** File not uploaded, wrong path, or cached 404. Use a new version number or purge cache.
**If step 2-3 fails:** Field/block was edited incorrectly. Re-enter.
**Do NOT proceed to step 5 without passing steps 1-4.**

### Claude in Chrome Tips for Beds24

- Admin page type URL pattern: `https://beds24.com/control3.php?pagetype={type}&id={propertyOrRoomId}`
- Key page types: `bookingpagedesigndeveloper`, `bookingpagedesignlayout`, `bookingpagedesign2`, `bookingpagedesignstyle`, `bookingpagedesigncontent`, `roomssetup`, `propertydescription`
- The booking page URL may get blocked by content filters when reading values — avoid including URLs in JS return values
- The MCP tab may have `innerWidth: 0` (background tab), making width-dependent layout testing unreliable — use user screenshots for visual verification
- Beds24 form saves use AJAX (`jquerysubmit=1`) — click the save button element, don't submit the form directly
- The "add module" dropdown on the Layout page requires manual UI interaction — programmatic value-setting doesn't trigger Beds24's handler
