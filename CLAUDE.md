# Beds24 Booking Page Project

## Reference Documents
- Execution plan: docs/beds24-execution.md
- Architecture decisions: docs/beds24-execution-context.md
- Session 5 handoff: docs/session-handoff-5.md
- Skill: docs/skill/SKILL.md (+ references/ subfolder)
- Beds24 template variables: docs/beds24-template-variables.md (for confirmation page work — Phase 3 step 6 and Phase 4)

## Current Status
- Phase 0.3 (Claude in Chrome content extraction) — PASSED
- Phase 0.1 (WordPress widget parameter passing) — FAILED (fallback: custom Kadence widget)
- Phase 0.2 (price injection feasibility) — PASSED (`#roomprice-1-{roomId}`)
- Phase 2 (admin configuration, Chill Zone) — COMPLETE
- Phase 3 (CSS/JS authoring) — IN PROGRESS
  - External CSS deployed and working via `&cssfile=` parameter
  - Inline `bookingcss` trimmed to critical CSS only (1,545 chars)
  - Hide/reveal JS and confirmation styles pasted manually by user
  - Multiple layout and design issues still open (see session-handoff-5.md)
- Phase 4 (mobile QA) — NOT STARTED
- VPS deploy — WORKING (aaPanel file manager, files in site root)

## Project Conventions
- American spelling throughout
- No time estimates
- CSS versioned filenames: CSS-base-v1.css, CSS-base-v2.css etc. (hosted on astrongpresence.com root)
- JS must fail silently to no-display on any error
- Never patch price injection discrepancies — abandon immediately

## File Locations
- External CSS: `https://astrongpresence.com/CSS-base-v{N}.css` (currently v2)
- Git source files: `docs/claude-custom/`
- Critical CSS payload: inline in Beds24 `bookingcss` field (1,545 chars)

## WordPress Sites

| MCP Server Name | Site URL | Purpose |
|---|---|---|
| `wordpress-landing` | `landing.astrongpresence.com` | Landing page |
| `wordpress-pink` | `pink.astrongpresence.com` | Property site |
| `wordpress-test` | `test.astrongpresence.com` | Test/staging site |
| `wordpress-seaside` | `seaside.astrongpresence.com` | Property site |
| `wordpress-chillzone` | `chillzone.astrongpresence.com` | Property site |

MCP config location: `C:\Users\Dr. COMPUTER\booking-page\.mcp.json`
Each server uses the `cmd /c` wrapper for npx (required on Windows).
Plugin: `WordPress/mcp-adapter` (current, from github.com/WordPress/mcp-adapter/releases).

### MCP Capabilities
The WordPress MCP servers provide REST API CRUD access to all standard WordPress endpoints (posts, pages, media, settings, themes, plugins, widgets). Use for:
- Phase 1: Content extraction (room descriptions, features, policies, brand colors, fonts)
- Phase 5: Batch content extraction across properties
- Verifying WordPress widget configuration across all sites

MCP cannot interact with Beds24 (separate platform, no MCP server exists).

## Beds24 Property
- Property ID: 271142
- Room IDs: Deluxe King Suite (567218), Single Bed Dorm (567219), Single Room (567220), Standard Double (567221)
- Booking page URL: `https://www.beds24.com/booking2.php?ownerid=141266&propid=271142`
- Booking page with CSS: append `&cssfile=https://astrongpresence.com/CSS-base-v2.css`
- Booking page URL parameters: `checkin`, `numnight`, `numadult`, `numchild`, `roomid`, `propid`, `cssfile`, `layout`, `lang`, `referer`, `hidedesc`, `hidefooter`, `numdisplayed`, `group`, `nogroup`, `version`
- Price element selector: `#roomprice-1-{roomId}`
- Admin field IDs: see docs/beds24-admin-field-map.md

### Phase 2 Config Applied (Chill Zone)
- Style panel: brand colors set (primary `#E7A35C`, secondary `#6DA17D`, text `#2D482D`, bg `#F7FAFC`)
- Google Fonts: Lexend + Lexend Giga loaded via `customheadtop`
- CSS font override: in `bookingcss` field
- Content: property description, all 4 room descriptions, general policy, cancellation policy
- Photos: positioned per room (Suite 5, Dorm 1, Single 5, Double 10)
- Multiple Room Booking: Enabled (changed from "Guest Can Choose" in Session 5)
- Room Features module (106): added to Room Bottom in Layout

### Phase 3 Current State (Session 5)

**External CSS (`CSS-base-v2.css`) handles:**
- Brand fonts and colors via CSS variables
- Room card styling (rounded corners, shadows, hover effects)
- Booking strip styling (hide nights, hide new search, hide multiroom toggle)
- Force-open collapsed photo sliders and descriptions
- Hide duplicate room-level and offer-level calendars
- Hide per-room guest count selectors
- Hide per-occupancy price breakdown (keep only "from €XX")
- Flex reorder of room card sections (images first, then description, then offer at bottom)
- Date strip within each room card
- Responsive mobile layout

**Inline `bookingcss` (1,545 chars) handles:**
- Critical CSS for FOUC prevention (flex layout, min-heights, carousel visibility)
- CSS variable declarations for Chill Zone brand
- Font family overrides

**Known issues (see session-handoff-5.md for full details):**
- Booking strip not sticky
- Bottom Book bar not sticky
- Dorm has no visible booking mechanism (hidden input, no dropdown)
- No per-room Book button next to quantity selector
- Features missing on Suite and Dorm
- Photo/description side-by-side layout not quite right
- Booking strip overflows on desktop

### Critical DOM Knowledge

**`#b24scroller` is the BOOKING STRIP, not the room container.** Room container is `.b24fullcontainer-rooms`.

**Beds24 collapses content by default** using `hidden-xs hidden-sm hidden-md hidden-lg` on `#collapseslider{roomId}` and `#collapsedesc{roomId}`. Must override with `display: block !important`.

**Dorm room (567219) renders a hidden input** (`input[type="hidden"][name="sr1-567219"][value="1"]`) instead of a quantity dropdown. This is because of channel manager configuration. Cannot be changed — needs JS-based booking solution.

**Beds24 `bookingcss` field silently rejects saves above ~18-19K chars.** Keep all large CSS in the external file.

**`custombody` and `customheadconfirm` strip `<script>` and `<style>` tags** when saved programmatically via Claude in Chrome. Must be pasted manually.

**Cloudflare caches the external CSS file.** Use versioned filenames (CSS-base-v3.css etc.) to bust cache.

## Tool Usage
- **Claude Code + MCP**: CSS/JS authoring, WordPress content extraction, widget verification
- **Claude in Chrome**: Beds24 admin interaction (read/write fields), DOM inspection of booking page, visual verification. Navigation between Beds24 admin pages works. Cannot save `<script>`/`<style>` tags programmatically — must be pasted manually.
- **Manual**: Photo uploads, mobile QA (real iOS device), pasting `<script>`/`<style>` into Beds24 admin fields

## VPS Deploy
- aaPanel access: working (user can access file manager, not terminal/SSH)
- Asset hosting: `astrongpresence.com` site root via aaPanel file manager
- Public URL pattern: `https://astrongpresence.com/{filename}`
- Goes through Cloudflare — use versioned filenames for cache busting
- Final production domain: `tripnhostel.com` (not yet configured for assets)

## Chainlink
- Use `chainlink session start` at the beginning of every work session
- Use `chainlink session end --notes "..."` at the end of every session
- Check `chainlink next` before starting work to confirm current focus
