# Beds24 Booking Page Project

## Reference Documents
- Execution plan: docs/beds24-execution.md
- Architecture decisions: docs/beds24-execution-context.md
- Session 7 handoff: docs/session-handoff-7.md
- Skill: docs/skill/SKILL.md (+ references/ subfolder)
- Beds24 template variables: docs/beds24-template-variables.md (for confirmation page work — Phase 3 step 6 and Phase 4)

## Current Status
- Phase 0.3 (Claude in Chrome content extraction) — PASSED
- Phase 0.1 (WordPress widget parameter passing) — RESOLVED via custom widget
- Phase 0.2 (price injection feasibility) — PASSED (`#roomprice-1-{roomId}`) — not yet implemented
- Phase 2 (admin configuration, Chill Zone) — COMPLETE
- Phase 3 (CSS/JS authoring) — IN PROGRESS (major fixes done, UX polish remaining)
  - External CSS v3 deployed and working via `&cssfile=` parameter
  - Iframe helper v14 deployed (book buttons, dorm fix, date strip overrides, height sync)
  - Widget v6 deployed (loading fix, min-stay note, default 1 guest, centered Clear Search)
  - Inline `bookingcss` field: critical CSS only (~1,545 chars)
  - "Insert in HTML <BODY> bottom" field: empty (hide/reveal JS removed)
  - Remaining: price UX improvements, room card layout polish, accessibility
- Phase 4 (mobile QA) — NOT STARTED
- VPS deploy — WORKING (aaPanel file manager, files in site root)

## Project Conventions
- American spelling throughout
- No time estimates
- CSS versioned filenames: CSS-base-v1.css, CSS-base-v2.css etc.
- JS versioned filenames: booking-widget-v6.js, beds24-iframe-helper-v14.js
- All hosted on astrongpresence.com root via aaPanel
- JS must fail silently to no-display on any error
- Never patch price injection discrepancies — abandon immediately
- Use Beds24 admin field names when communicating with user (e.g., "Insert in HTML <HEAD> bottom" not "customhead")

## File Locations
- External CSS: `https://astrongpresence.com/CSS-base-v3.css` (currently v3)
- Booking widget JS: `https://astrongpresence.com/booking-widget-v6.js` (currently v6)
- Beds24 iframe helper JS: `https://astrongpresence.com/beds24-iframe-helper-v14.js` (currently v14)
- Critical CSS payload: inline in Beds24 "Custom CSS" field (~1,545 chars)

## Caching
- LiteSpeed caching plugin: **deactivated** on chillzone.astrongpresence.com
- Cloudflare: **development mode activated** (bypasses cache; will eventually expire)
- Versioned filenames are the primary cache-busting mechanism
- When uploading a new version: increment filename, update all references (Beds24 admin fields, WordPress block, widget CONFIG)
- Cloudflare/LiteSpeed cache 404 responses — never request a URL before the file exists

## Booking Widget Architecture

The booking page uses a custom widget (NOT the Beds24 WordPress plugin iframe). The WordPress page has a Custom HTML block:

```html
<div id="tnh-booking-root"></div>
<script src="https://astrongpresence.com/booking-widget-v6.js"></script>
```

**Flow:**
1. Widget renders date/guest picker on WordPress page ("Check Availability" + "Minimum stay: 2 nights")
2. On "Search Rooms", creates iframe with `opacity:0; position:absolute` (invisible but renderable)
3. Beds24 helper script inside iframe hides booking strip/chrome, reports height via postMessage
4. When height > 500px, widget sets iframe to `opacity:1; position:static` — rooms appear, spinner hides
5. Guest selects room quantity and clicks per-room orange Book button
6. `form.target = '_top'` breaks out of iframe — Beds24 checkout takes over full tab
7. Back button returns to WordPress page

**CRITICAL: iframe must NOT use `display:none` during loading.** Use `opacity:0` instead. `display:none` prevents content rendering and measurement inside the iframe, causing height to stay at 0 and the loading spinner to persist indefinitely on desktop.

**Beds24-side helper** loaded via "Insert in HTML <HEAD> bottom" field:
```html
<script src="https://astrongpresence.com/beds24-iframe-helper-v14.js"></script>
```

Helper sections:
1. Hide chrome + height sync (widget iframe only)
2. Break out of iframe on form submit
3. Dorm booking fix (move guest selector into main price box)
4. Inject per-room orange Book buttons
5. Date strip overrides (green stay dates, red unavailable, non-clickable cells, hide header row)

Only Section 1 is conditional on `isWidget && isEmbedded`. All other sections run on every page load.

## WordPress Sites

| MCP Server Name | Site URL | Purpose |
|---|---|---|
| `wordpress-landing` | `landing.astrongpresence.com` | Landing page |
| `wordpress-pink` | `pink.astrongpresence.com` | Property site |
| `wordpress-test` | `test.astrongpresence.com` | Test/staging site |
| `wordpress-seaside` | `seaside.astrongpresence.com` | Property site |
| `wordpress-chillzone` | `chillzone.astrongpresence.com` | Property site |

MCP config location: `C:\Users\Dr. COMPUTER\booking-page\.mcp.json`

## Beds24 Property
- Property ID: 271142
- Room IDs: Deluxe King Suite (567218), Single Bed Dorm (567219), Single Room (567220), Standard Double (567221)
- Booking page URL: `https://www.beds24.com/booking2.php?ownerid=141266&propid=271142`
- Booking page with CSS: append `&cssfile=https://astrongpresence.com/CSS-base-v3.css`
- Price element selector: `#roomprice-1-{roomId}`
- Admin field IDs: see docs/beds24-admin-field-map.md

### Beds24 Admin Fields (Developer Page, Property 271142)

| Beds24 Field Name | Field ID | Current Content |
|---|---|---|
| Insert in HTML <HEAD> top | `customheadtop` | Google Fonts `<link>` for Lexend + Lexend Giga |
| Insert in HTML <HEAD> bottom | `customhead` | `<script src="https://astrongpresence.com/beds24-iframe-helper-v14.js"></script>` |
| Custom CSS | `bookingcss` | Critical CSS payload + Chill Zone variable overrides (~1,545 chars) |
| Insert in HTML <BODY> bottom | `custombody` | Empty |

### Phase 3 Current State (Session 7)

**External CSS (`CSS-base-v3.css`) handles:**
- Brand fonts and colors via CSS variables
- Room card styling (rounded corners, shadows, hover effects)
- Booking strip styling (hide nights, hide new search, hide multiroom toggle)
- Force-open collapsed photo sliders and descriptions
- Hide duplicate room-level and offer-level calendars
- Hide per-room guest count selectors
- Hide per-occupancy price breakdown (keep only "from €XX")
- Hide `.b24-multipricebox.hidden` elements (prevents price row leaking)
- Hide `#b24bookshoppingcart` bottom summary bar
- Flex reorder of room card sections (images first, then description, then offer at bottom)
- Date strip within each room card
- Responsive mobile layout
- Orange Book buttons (CTA color)

**Helper v14 JS handles:**
- Hide booking strip/chrome in iframe mode
- Height sync via postMessage (uses `getBoundingClientRect` on `.b24fullcontainer-rooms`)
- `form.target = '_top'` for iframe breakout
- Dorm fix: move guest selector into main price box, relabel "Guests" → "Beds", hide orphan box
- Per-room orange Book button injection
- Date strip overrides: green stay dates, light red unavailable dates, non-clickable cells, hidden header row

**Widget v6 JS handles:**
- Date/guest picker with Chill Zone branding
- "Minimum stay: 2 nights" note
- Default 1 guest
- Iframe loading with `opacity:0` (not `display:none`)
- Height sync via postMessage listener
- Loading spinner until height > 500px
- 8-second fallback
- Summary bar with centered "Clear Search" button below
- Smooth scroll to results

**Known remaining items:**
- Price UX: total price after quantity selection, per-night "from" price
- Room card layout: photo/description side-by-side (Hostelworld target)
- Features missing on Suite and Dorm (content entry)
- Accessibility (aria-labels)

### Critical DOM Knowledge

**`#b24scroller` is the BOOKING STRIP, not the room container.** Room container is `.b24fullcontainer-rooms`.

**Beds24 collapses content by default** using `hidden-xs hidden-sm hidden-md hidden-lg` on `#collapseslider{roomId}` and `#collapsedesc{roomId}`. Must override with `display: block !important`.

**Dorm room (567219) renders a hidden input** (`input[type="hidden"][name="sr1-567219"][value="1"]`) instead of a quantity dropdown. Helper v14 handles this by moving the guest selector and injecting a Book button.

**Dorm has two visible `.b24-multipricebox` containers.** Helper moves guest selector from Box 1 (orphan) into Box 0 (main, contains "from" price) and hides Box 1.

**Beds24 "Custom CSS" field silently rejects saves above ~18-19K chars.** Keep all large CSS in the external file.

**"Insert in HTML <BODY> bottom" and confirmation page HEAD fields strip `<script>` and `<style>` tags** when saved programmatically via Claude in Chrome. Must be pasted manually.

**Cloudflare caches the external CSS file.** Use versioned filenames to bust cache.

**Beds24 Style panel generates inline `<style>` blocks** that load after external CSS. For reliable overrides of Style panel colors, inject via helper JS (Section 5).

**`.b24-multipricebox.hidden` elements must be explicitly hidden** with `display: none !important`. Our flex rules on `.b24-offer-select .b24-multipricebox` otherwise override Bootstrap's `.hidden` class.

**Date strip cells are clickable via delegated event handlers.** Block with `pointer-events: none` on `.roomofferpricetable .at_pricetd`.

## Tool Usage
- **Claude Code + MCP**: CSS/JS authoring, WordPress content extraction, widget verification
- **Claude in Chrome**: Beds24 admin interaction (read/write fields), DOM inspection, visual verification. Cannot save `<script>`/`<style>` tags programmatically — must be pasted manually.
- **Manual**: Photo uploads, mobile QA (real iOS device), pasting `<script>`/`<style>` into Beds24 admin fields, VPS file upload via aaPanel

## VPS Deploy
- aaPanel access: working (user can access file manager, not terminal/SSH)
- Asset hosting: `astrongpresence.com` site root via aaPanel file manager
- Public URL pattern: `https://astrongpresence.com/{filename}`
- Goes through Cloudflare — use versioned filenames for cache busting
- Final production domain: `tripnhostel.com` (not yet configured for assets)
