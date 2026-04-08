# Beds24 Booking Page Project

## Reference Documents
- Execution plan: docs/beds24-execution.md
- Architecture decisions: docs/beds24-execution-context.md
<<<<<<< HEAD

## Current Status
Phase 0 tests not yet run. Do not begin CSS/JS authoring until Phase 0.1
and 0.2 outcomes are confirmed.
=======
- Beds24 admin field map: docs/beds24-admin-field-map.md

## Current Status
- Phase 0.3 (Claude in Chrome content extraction) — PASSED
- Phase 0.1 (WordPress widget parameter passing) — not yet run
- Phase 0.2 (price injection feasibility) — not yet run
- VPS deploy user — BLOCKED (waiting on Hostkey password reset)
- Do not begin CSS/JS authoring until Phase 0.1 and 0.2 outcomes are confirmed.
>>>>>>> 1285bb8 (Add CLAUDE.md and project docs: execution plan, context doc, admin field map)

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
<<<<<<< HEAD
=======
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
- Booking page URL parameters: `checkin`, `numnight`, `numadult`, `numchild`, `roomid`, `propid`, `cssfile`, `layout`, `lang`, `referer`, `hidedesc`, `hidefooter`, `numdisplayed`, `group`, `nogroup`, `version`
- Admin field IDs: see docs/beds24-admin-field-map.md

## Tool Usage
- **Claude Code + MCP**: CSS/JS authoring, WordPress content extraction, widget verification
- **Claude in Chrome**: Beds24 admin interaction (read/write fields), DOM inspection of booking page, visual verification
- **Manual**: Beds24 admin configuration, photo uploads, mobile QA (real iOS device)
>>>>>>> 1285bb8 (Add CLAUDE.md and project docs: execution plan, context doc, admin field map)

## VPS Deploy
- Deploy user: beds24deploy
- Asset directory: (to be added once VPS user is set up)
- Public URL: (to be added once subdomain is configured)

## Chainlink
- Use `chainlink session start` at the beginning of every work session
- Use `chainlink session end --notes "..."` at the end of every session
- Check `chainlink next` before starting work to confirm current focus
