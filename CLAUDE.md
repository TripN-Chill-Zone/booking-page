# Beds24 Booking Page Project

## Reference Documents
- Execution plan: docs/beds24-execution.md
- Architecture decisions: docs/beds24-execution-context.md

## Current Status
Phase 0 tests not yet run. Do not begin CSS/JS authoring until Phase 0.1
and 0.2 outcomes are confirmed.

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
(To be added once MCP servers are configured)

## VPS Deploy
- Deploy user: beds24deploy
- Asset directory: (to be added once VPS user is set up)
- Public URL: (to be added once subdomain is configured)

## Chainlink
- Use `chainlink session start` at the beginning of every work session
- Use `chainlink session end --notes "..."` at the end of every session
- Check `chainlink next` before starting work to confirm current focus