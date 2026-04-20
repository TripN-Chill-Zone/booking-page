# Per-Property Rollout Checklist

Step-by-step checklist for rolling out the booking page to a new 
property. Written assuming Chill Zone is already live; this covers 
properties 2 through N.

**Read before starting:** `docs/retrospective.md` Active Rules, 
`docs/skill/SKILL.md`, `docs/skill/property-config.md` (schema 
reference and examples).

---

## Phase 0 — Discovery and intake

Before touching any admin UI, gather everything you need from the 
property owner.

### 0.1 Property identifiers

- [ ] Beds24 property ID (from Beds24 admin URL or property list)
- [ ] Beds24 owner ID (same)
- [ ] Room IDs for every bookable room
- [ ] Which rooms are dorms (channel manager mode with hidden qty input)
- [ ] Beds24 direct booking URL: 
  `https://www.beds24.com/booking2.php?ownerid={owner}&propid={property}`

### 0.2 Brand assets

- [ ] Primary color (hex)
- [ ] Secondary color (hex)
- [ ] Text color (hex)
- [ ] Text-light color (hex) — for secondary text
- [ ] Background color (hex) — usually `#ffffff` or light neutral
- [ ] Background-alt color (hex) — for subtle section differentiation
- [ ] Border color (hex) — for card outlines, separators
- [ ] Body font (Google Fonts name)
- [ ] Heading font (Google Fonts name, can match body)
- [ ] Logo asset (if used in booking page — not currently part of the 
  design, but note if the client expects it)

### 0.3 Per-room content

For each room, collect:

- [ ] Room name (shown as card heading)
- [ ] Description (shown in desc column)
- [ ] Tag list — icon (emoji) + text for each tag (3-5 per room is 
  standard; see Chill Zone examples in property-config.md)
- [ ] Photos: at least 3, ideally 5-8 per room, in preferred display order
- [ ] Policies (general policy text, cancellation policy text — if 
  different from property default)

### 0.4 WordPress hosting

- [ ] WordPress site URL where the widget will be embedded
- [ ] Active theme (confirm it's Kadence or verify content-width 
  structure if different — see "WordPress theme considerations" below)
- [ ] Page where widget goes (create it if it doesn't exist)
- [ ] WordPress admin access for installing the Custom HTML block

### 0.5 Infrastructure access

- [ ] Beds24 admin access (or screen-share with owner)
- [ ] VPS SSH access (shared credential if self-hosted; not needed if 
  client is on hosted tier)

---

## Phase 1 — Beds24 admin configuration

The same admin steps as Chill Zone's initial setup. If this is the 
second+ property rollout, reference those settings rather than 
rediscovering them.

### 1.1 Booking page design

On the Design → Layout page for this property:

- [ ] **Layout:** 6 (horizontal cards)
- [ ] **Template:** 6 (matching layout)
- [ ] **Room Features module (106)** added to the Room Bottom position
- [ ] Confirm no conflicting modules in Room Top, Offer, Property Top, 
  Property Bottom slots

On the Design → Configuration page:

- [ ] **Multiple Room Booking:** Enabled (`bookpageallowmulti = 1`)
- [ ] **Default Nights:** 2 (or per-property preference)
- [ ] **Min Nights:** 1
- [ ] **Max Nights:** 30 (or per-property preference)
- [ ] **Default Guests:** 1
- [ ] **Max Guests:** total guest capacity across all rooms
- [ ] **Max Rooms per Page:** all rooms (or higher)
- [ ] **Room Order:** Cheapest first (won't actually take effect — 
  helper handles sorting — but set it anyway)
- [ ] **Show Extra Marketing Column:** No
- [ ] **Booking Page Price Multiplier:** 1.0

### 1.2 Style panel (brand colors)

On Design → Style, set each of the 20 color pickers to the 
per-property values gathered in Phase 0.2. Fields and typical 
assignments:

- [ ] **Body Background** → background color
- [ ] **Content Background** → background-alt or background
- [ ] **Text** → text color
- [ ] **Links** → primary color
- [ ] **Borders** → border color
- [ ] **Form** → background color
- [ ] **Dates (available)** → primary color
- [ ] **Dates (stay)** → secondary color (overridden by helper anyway, 
  but set for consistency)
- [ ] **Button** → primary color
- [ ] Remaining color fields: set to match brand palette or leave 
  defaults if not used

**Font:** set to "Arial" or any Google Fonts default — the real font 
gets loaded via Google Fonts `<link>` in `customheadtop`.

### 1.3 Content entry

On Content → Property Description: populate property-level text.

On Content → Room Descriptions: for each room:

- [ ] Room name (matches Phase 0.3)
- [ ] Description (matches Phase 0.3)
- [ ] Short description (if prompted)

### 1.4 Photo uploads (manual)

Automation cannot see photo content. The property owner uploads photos:

1. Pictures admin page → upload all photos for the property
2. For each room, set position values on photos that belong to that room:
   - Select the photos to include in the room
   - Assign sequential position numbers (1, 2, 3, ...)
   - Leave all other photos as "not used" for that room
3. Save each room's photo config
4. **Verify:** load the booking page and confirm each room shows only 
   its intended photos in the slider

See retrospective 2026-04-20 "Photo positions applied to all 53 files 
across all rooms" for why this step is manual.

### 1.5 Admin field payloads

These three fields get pasted content. Prepare the content based on 
this property's values from Phase 0.

**"Insert in HTML <HEAD> top" (customheadtop):**

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family={BodyFont}:wght@400;500;600;700&family={HeadingFont}:wght@600;700&display=swap" rel="stylesheet">
```

Replace `{BodyFont}` and `{HeadingFont}` with Phase 0.2 values. 
Remove one `family=` parameter if body and heading fonts match.

**"Insert in HTML <HEAD> bottom" (customhead):**

```html
<script>
window.TNH_CONFIG = {
  schemaVersion: 1,
  propertyId: "{property-slug}",
  rooms: [
    // full per-room config from Phase 0 data
    // see property-config.md for schema and Chill Zone example
  ]
};
</script>
<script>
var s = document.createElement('script');
s.src = 'https://astrongpresence.com/beds24-iframe-helper.js?v=' + Date.now();
document.head.appendChild(s);
</script>
```

Replace placeholder with full config object for this property.

**"Custom CSS" (bookingcss):**

Per-property variable overrides + critical FOUC-prevention CSS. 
Template:

```css
:root {
  --b24-primary: {PrimaryColor};
  --b24-secondary: {SecondaryColor};
  --b24-text: {TextColor};
  --b24-text-light: {TextLightColor};
  --b24-bg: {BackgroundColor};
  --b24-bg-alt: {BackgroundAltColor};
  --b24-border: {BorderColor};
  --b24-font-body: '{BodyFont}', sans-serif;
  --b24-font-heading: '{HeadingFont}', sans-serif;
}

/* Critical FOUC-prevention CSS — keep under 2K total */
body { font-family: var(--b24-font-body); }
/* ...additional critical rules... */
```

The full `CSS-base.css` is served externally via the `&cssfile=` 
parameter on the booking page URL. The inline `bookingcss` only 
handles variable overrides and critical pre-paint styles.

**Keep `bookingcss` under ~2K characters.** Beds24 silently rejects 
saves above ~18-19K; the 2K target gives a comfortable safety 
margin and keeps the critical CSS focused.

### 1.6 Save verification

After each admin field edit:

- [ ] Reload the admin page
- [ ] Verify the field still contains what you saved
- [ ] If it reverted: retry. If it silently drops content again, 
  the content may need trimming (character limit) or manual paste by 
  the property owner

---

## Phase 2 — WordPress widget

The widget adds the search form and iframe to the property's 
WordPress site.

### 2.1 Verify theme compatibility

- [ ] **Kadence** (matches Chill Zone setup): use the same widget 
  max-width (1290px) as Chill Zone
- [ ] **Different theme:** check the theme's content-width setting. 
  Options:
  - If theme content width ≈ 1290px, use same widget max-width
  - If different, tune `.tnh-booking-widget { max-width: XXXpx }` in 
    `booking-widget.js` to match theme content width
  - **Per-property max-width tuning is a code change** — different 
    properties with different themes can't share one widget file 
    without a config mechanism for this (not yet implemented)

If you encounter a theme that constrains content width above the 
widget's max-width, the widget will look small inside a larger 
content area. See the "WordPress theme considerations" section below.

### 2.2 Place the Custom HTML block

1. Navigate to the page where the widget will live (usually "Book 
   A Room" or similar)
2. Add a Custom HTML block
3. Paste:
   ```html
   <div id="tnh-booking-root"></div>
   <script>var s=document.createElement('script');s.src='https://astrongpresence.com/booking-widget.js?v='+Date.now();document.head.appendChild(s);</script>
   ```
4. **Both lines must be present.** If only one is pasted, the widget 
   won't mount.
5. Publish the page

### 2.3 Per-property widget config

The widget currently has its own CONFIG block hardcoded in 
`booking-widget.js`. For each property, the widget needs to know:

- The property's Beds24 owner ID and property ID (for the iframe URL)
- The property's brand colors (for the search form styling)

**Current state (Session 12):** these are hardcoded to Chill Zone 
values. **Before rolling out property 2, the widget needs the same 
externalization treatment the helper got.** Either:

1. Add `window.TNH_WIDGET_CONFIG` as a parallel config object, or
2. Extend `window.TNH_CONFIG` with widget-specific fields

Choose one and implement before Phase 2 for property 2. This is a 
blocker for rollout that should be noted in the next-session handoff.

### 2.4 Verify rendering

- [ ] Open the WordPress page in an incognito window
- [ ] Confirm the widget renders (date pickers, guest count, search 
  button)
- [ ] Fill in arbitrary dates and click Search
- [ ] Confirm the iframe loads showing this property's rooms
- [ ] Complete a test booking end-to-end (through to checkout; you 
  can abandon before payment)

---

## Phase 3 — Verification

Before handing off to the property owner, verify the full flow on 
real devices.

### 3.1 Mobile (real iPhone or Android, not just DevTools)

- [ ] iPhone portrait (6.1" or similar): widget renders, rooms list 
  renders, tags visible, Book button visible, booking flow works
- [ ] iPhone landscape: desktop layout renders (this is expected — 
  see SKILL.md §2 on breakpoints)
- [ ] Android: same checks as iPhone portrait

### 3.2 Desktop browsers

- [ ] Chrome on standard monitor (≥1280px viewport): desktop layout, 
  all rooms bookable
- [ ] Safari (if target market is US/Europe)
- [ ] Firefox (optional; rarely a concern)

### 3.3 Booking flow

For at least one private room and one dorm room:

- [ ] Search → results load → Book → checkout page → guest info form 
  submits → confirmation
- [ ] Back button returns to WordPress (not Beds24)
- [ ] Booking appears in Beds24 admin Bookings page

### 3.4 Visual polish

- [ ] Brand colors match across: search form, buttons, date strip, 
  tags, card borders
- [ ] Fonts render correctly (no fallback to system fonts)
- [ ] No visible Beds24 chrome (booking strip, property headers, 
  footers — only the rooms list should be visible)
- [ ] Book button and total price are right-aligned on every card
- [ ] Tags don't overlap photos at any tested width
- [ ] Date strip colors match brand (overridden via helper JS 
  Section 5)

### 3.5 Console health

- [ ] No errors in browser console (on booking page, inside iframe)
- [ ] No 404s in Network tab for JS/CSS files
- [ ] `[TNH]` log messages (if any) are informational, not errors

---

## Phase 4 — Handoff to property owner

- [ ] Walk the owner through the booking page once
- [ ] Explain the Beds24 admin fields they control (Content, Photos, 
  Style for ongoing color tweaks)
- [ ] Explain what they should NOT touch (Insert in HTML fields, 
  Developer page, Layout page beyond module add/remove)
- [ ] Provide a 1-page runbook with: how to add a new room, how to 
  update photos, who to contact if the page breaks
- [ ] Record the rollout date in `docs/skill/property-config.md` 
  Status field for this property

---

## Phase 5 — Post-rollout

Once the property is live:

- [ ] Add retrospective entry if anything unexpected happened during 
  rollout (schema gap, theme incompatibility, admin surprise)
- [ ] Update `docs/skill/property-config.md` to mark this property as 
  live
- [ ] Close out the rollout session with a handoff note if there are 
  follow-ups (e.g., pending photo uploads from the owner)

---

## WordPress theme considerations

The widget's `max-width: 1290px` is tuned for Kadence's default 
content width. If a property uses a different theme:

**Themes with wider content width (e.g., 1440px, 1600px):**
- Option A: widen the widget to match (requires per-property code 
  change to `booking-widget.js`)
- Option B: leave widget at 1290px; widget appears centered with 
  surrounding content area visible around it

**Themes with narrower content width (e.g., 960px, 1100px):**
- The widget's iframe will still cap at 1288px, but its container 
  will shrink to the theme's content area
- Inside the iframe, the same CSS applies; Beds24 mobile breakpoint 
  (767px) still fires correctly
- Likely no action needed, but verify visually at multiple viewports

**Themes that add their own sidebars or heavy chrome:**
- The widget should be placed in a full-width page template if 
  possible
- If the theme doesn't offer a full-width option, contact the 
  property owner about a child theme modification

This section will be expanded as more properties are rolled out and 
theme variations become clearer.

---

## Known open questions for future rollouts

These aren't blockers yet but will need resolution as rollouts 
accumulate:

- **Per-property widget config** — the widget has hardcoded 
  property/owner IDs and colors. Needs externalization before 
  property 2.
- **Per-property CSS variables** — currently each property has its 
  own `bookingcss` block. Could be folded into `TNH_CONFIG` and 
  injected via JS, but that's a larger refactor.
- **Font loading strategy** — each property loads its own Google 
  Fonts via `customheadtop`. If a property wants a self-hosted font 
  for privacy/compliance, the current pattern doesn't support it.
- **Cache-busting for production** — the `Date.now()` pattern defeats 
  CDN caching. Needs to be replaced with versioned filenames or a 
  deploy-timestamp query param before properties go live to real 
  customers.

---

## Related documents

- `property-config.md` — schema and per-property config data
- `admin-guide.md` — Beds24 admin field reference
- `gotchas.md` — known pitfalls including silent save failures
- `beds24-execution.md` — overall phased rollout plan
