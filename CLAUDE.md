# Beds24 Booking Page Project

## Reference Documents
- Execution plan: docs/beds24-execution.md
- Architecture decisions: docs/beds24-execution-context.md
- Beds24 admin field map: docs/beds24-admin-field-map.md

## Current Status
- Phase 0.3 (Claude in Chrome content extraction) — PASSED
- Phase 0.1 (WordPress widget parameter passing) — FAILED (fallback: custom Kadence widget)
- Phase 0.2 (price injection feasibility) — PASSED (`#roomprice-1-{roomId}`)
- Phase 2 (admin configuration, Chill Zone) — COMPLETE
- Phase 3 (CSS/JS authoring) — NOT STARTED (next priority)
- VPS deploy user — BLOCKED (waiting on Hostkey password reset)

## Project Conventions
- American spelling throughout
- No time estimates
- CSS versioned filenames: beds24-base-v1.css, beds24-base-v2.css etc.
- JS must fail silently to no-display on any error
- Never patch price injection discrepancies — abandon immediately

## File Locations
- External CSS: css/
- JS: js/
- Critical CSS payload: css/critical-css-payload.css

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
- Booking page URL parameters: `checkin`, `numnight`, `numadult`, `numchild`, `roomid`, `propid`, `cssfile`, `layout`, `lang`, `referer`, `hidedesc`, `hidefooter`, `numdisplayed`, `group`, `nogroup`, `version`
- Price element selector: `#roomprice-1-{roomId}`
- Admin field IDs: see docs/beds24-admin-field-map.md

### Phase 2 Config Applied (Chill Zone)
- Style panel: brand colors set (primary `#E7A35C`, secondary `#6DA17D`, text `#2D482D`, bg `#F7FAFC`)
- Google Fonts: Lexend + Lexend Giga loaded via `customheadtop`
- CSS font override: in `bookingcss` field
- Content: property description, all 4 room descriptions, general policy, cancellation policy
- Photos: positioned per room (Suite 5, Dorm 1, Single 5, Double 10)

### Known Issues for Phase 3
- Date strip overlays the calendar — CSS positioning fix needed
- Duplicate calendars showing — remove via layout config or CSS
- Photos require click to show — slider collapsed by default
- `numadult` defaults back to 1 on search

## Tool Usage
- **Claude Code + MCP**: CSS/JS authoring, WordPress content extraction, widget verification
- **Claude in Chrome**: Beds24 admin interaction (read/write fields), DOM inspection of booking page, visual verification. Navigation between Beds24 admin pages now works (Session 4 confirmed).
- **Manual**: Photo uploads, mobile QA (real iOS device)

## VPS Deploy
- Deploy user: beds24deploy
- Asset directory: (to be added once VPS user is set up)
- Public URL: (to be added once subdomain is configured)

## Chainlink
- Use `chainlink session start` at the beginning of every work session
- Use `chainlink session end --notes "..."` at the end of every session
- Check `chainlink next` before starting work to confirm current focus
