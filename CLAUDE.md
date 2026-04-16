# Beds24 Booking Page Project

## Reference Documents
- Execution plan: beds24-execution.md
- Architecture decisions: beds24-execution-context.md
- Session 9 handoff: session-handoff-9.md
- CSS architecture: css-architecture.md
- Admin guide: admin-guide.md
- DOM structure: dom-structure.md
- Gotchas: gotchas.md
- Approved mockup: mockup.html (v13)
- Skill: /mnt/skills/user/beds24-booking-page/SKILL.md

## Current Status
- Phase 2 (admin configuration) — COMPLETE
- Phase 3 (CSS/JS authoring) — IN PROGRESS
  - Room card redesign: APPROVED (mockup v13)
  - CSS v6 and Helper v16 extracted, ready for deployment
  - Remaining: deploy to VPS, update Beds24 admin descriptions, checkout page styling, confirmation page, accessibility
- Phase 4 (mobile QA) — NOT STARTED

## Project Conventions
- American spelling throughout
- No time estimates
- CSS versioned filenames: CSS-base-v1.css through CSS-base-v6.css
- JS versioned filenames: booking-widget-v7.js, beds24-iframe-helper-v16.js
- All hosted on astrongpresence.com root via aaPanel
- JS must fail silently on any error
- Never patch price injection discrepancies — abandon immediately
- Use Beds24 admin field names when communicating with user
- **NEW FILENAMES REQUIRED for every VPS upload** (OpenLiteSpeed caching — see Caching section)

## File Locations

### Ready for deployment (Session 9 outputs)
- CSS: `CSS-base-v6.css` (extracted from approved mockup v13)
- Helper: `beds24-iframe-helper-v16.js` (dual tags, book group, per-night price, qty placeholder)

### Currently live on VPS (outdated)
- External CSS: `https://astrongpresence.com/CSS-base-v5.css`
- Iframe helper: `https://astrongpresence.com/beds24-iframe-helper-v15.js`
- Booking widget: `https://astrongpresence.com/booking-widget-v7.js`

### Beds24 admin fields
- "Insert in HTML <HEAD> top": Google Fonts `<link>` for Lexend + Lexend Giga
- "Insert in HTML <HEAD> bottom": `<script src="https://astrongpresence.com/beds24-iframe-helper-v15.js"></script>` (needs → v16)
- "Custom CSS": Critical CSS payload + Chill Zone variable overrides
- "Insert in HTML <BODY> bottom": Empty

### WordPress
```html
<div id="tnh-booking-root"></div>
<script src="https://astrongpresence.com/booking-widget-v7.js"></script>
```

## Caching — CRITICAL

**OpenLiteSpeed caches static files aggressively.** None of these work to clear it:
- Restarting OLS service
- Purging Cloudflare cache
- `.htaccess` CacheDisable directives
- Cloudflare development mode

**The ONLY reliable workaround is using new versioned filenames for every upload.** Deleted files continue to be served from OLS cache indefinitely. No SSH access to manually purge `/usr/local/lsws/cachedata/`.

When deploying:
1. Always use a new filename (increment version number)
2. Upload the new file first
3. Then update all references (Beds24 admin, widget CONFIG)
4. Never overwrite an existing filename expecting the change to take effect

## Booking Widget Architecture

Custom widget on WordPress (NOT the Beds24 WordPress plugin iframe).

**Flow:**
1. Widget renders date/guest picker ("Check Availability" + "Minimum stay: 2 nights")
2. On "Search Rooms", creates iframe with `opacity:0; position:absolute`
3. Beds24 helper inside iframe hides chrome, reports height via postMessage
4. When height > 500px, widget shows iframe — rooms appear
5. Guest selects room and clicks Book button
6. Checkout stays inside iframe (no breakout)
7. Helper sends `tnh-page-change` postMessage, widget updates summary text

**CRITICAL: iframe must NOT use `display:none` during loading.** Use `opacity:0` instead.

## Helper v16 Sections
1. **Hide chrome + height sync** (widget iframe only)
2. *(removed — checkout stays in iframe)*
3. **Dorm booking fix** (move guest selector, relabel Guests→Beds, hide orphan box)
4. **Book buttons** — wrapped in `.tnh-book-group` with `.tnh-total-price` + button
5. **Date strip overrides** (green stay, red unavailable, non-clickable, hide header)
6. **Price UX** — per-night display (lighter style), total in book group, no subtitle
7. **Room card enhancement** — `.tnh-desc-text` class on description (NOT hidden), dual tag injection (desktop inside desc column + mobile as direct panel child), qty placeholder "-"

## CSS v6 Layout

### Desktop (≥768px): CSS Grid
```
grid-template-columns: 120px 1fr
Row 1: [thumbnail] [description + tags (flex space-between)]
Row 3: [offer bar — full width, border-top separator]
```
- `:has()` selectors for grid placement
- Bootstrap column reset global inside panel body
- Tags aligned to bottom of description column
- Offer: [Select] [-▼] [from €45/night] ——— [€90.00] [Book]

### Mobile (≤767px): Flex Column
```
flex-direction: column, CSS order for rearrangement
Order 0: slider row (thumbnail)
Order 1: desc row (positioned beside thumb via margin-top:-78px; margin-left:100px)
Order 2: mobile tags (full width, injected as direct panel child by JS)
Order 3: offer (full width, border-top separator)
```
- Desktop tags hidden, mobile tags shown
- Description: full text (no line clamp)
- Offer: Line 1 = per-night price, Line 2 = select + total + book

## Room Descriptions (to update in Beds24 admin)
- **Suite**: "Spacious premium suite with a huge king-sized bed, ensuite bathroom and panoramic city views. Perfect for extended stays."
- **Single**: "Ideal room for solo travelers who value privacy and the social atmosphere of a co-living space. A quiet, private room to call your own."
- **Double**: "Private double room for couples or friends. All the comfort and privacy you need, with full access to our shared spaces."
- **Dorm**: "A comfortable bed in a modern 4-person dorm. Great value with a social atmosphere — meet fellow travelers without breaking the bank."

## Room Tags
```
567218 (Suite): Sleeps 2, Ensuite, City View, Work Desk, Premium
567220 (Single): Sleeps 1, Shared Bathroom, Work Desk, Private
567221 (Double): Sleeps 2, Shared Bathroom, Work Desk, Private
567219 (Dorm): 1 Bed, 4-Bed Dorm, Power Outlet, Reading Light
```

## Beds24 Property
- Property ID: 271142
- Owner ID: 141266
- Room IDs: Deluxe King Suite (567218), Single Bed Dorm (567219), Single Room (567220), Standard Double (567221)
- Booking page URL: `https://www.beds24.com/booking2.php?ownerid=141266&propid=271142`
- Booking page with CSS: append `&cssfile=https://astrongpresence.com/CSS-base-v6.css`

## Critical DOM Knowledge
- `#b24scroller` is the BOOKING STRIP, not the room container. Room container is `.b24fullcontainer-rooms`.
- Beds24 collapses content by default — must override with `display: block !important`.
- Dorm room (567219) renders hidden input instead of qty dropdown. Helper handles this.
- Dorm has two visible `.b24-multipricebox` containers. Helper moves guest selector and hides orphan.
- Beds24 "Custom CSS" field silently rejects saves above ~18-19K chars.
- "Insert in HTML <BODY> bottom" strips `<script>`/`<style>` tags when saved programmatically.
- `.b24-multipricebox.hidden` must be explicitly hidden with `display: none !important`.
- Date strip cells are clickable — block with `pointer-events: none`.
- Bootstrap `.row` has `margin-left:-15px` that causes overflow — must reset ALL rows including nested ones inside `.offer`.

## Tool Usage
- **Claude Code + MCP**: CSS/JS authoring, WordPress content extraction
- **Claude in Chrome**: Beds24 admin interaction, DOM inspection, visual verification. Cannot save `<script>`/`<style>` programmatically.
- **Local mockup**: Self-contained HTML for CSS iteration. Media queries need real viewport resize (not container width dropdown).
- **Manual**: Photo uploads, mobile QA, pasting into Beds24 admin fields, VPS file upload via aaPanel

## VPS Deploy
- aaPanel access: working (file manager only, no terminal/SSH)
- Asset hosting: `astrongpresence.com` site root
- Public URL: `https://astrongpresence.com/{filename}`
- Goes through Cloudflare + OpenLiteSpeed — **must use versioned filenames**
