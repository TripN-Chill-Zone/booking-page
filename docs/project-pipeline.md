# Project Pipeline

The session-by-session plan for completing the Chill Zone booking page 
and rolling out to the remaining three properties. This is the 
authoritative source for what comes next; individual session handoffs 
defer to this document for sequencing.

## Convention

Numbered sessions are full work sessions that progress the project. 
Small commits that happen between sessions (rule additions, count 
updates, doc fixes) belong to the previous full session and are not 
numbered as their own session.

## Sessions

### Session 20 — Pricing row layout (complete)

Mode: `safe --base chill --context-pacing`. Fixed `tnh-total-price` 
positioning (desktop and mobile) and desktop vertical alignment. 
Surfaced that Attempt 5's CSS rule is being overridden by Beds24's 
inline styles, leaving the per-occupancy box bug unfixed in 
production. Handoff: `docs/session-handoff-20.md`.

Post-session housekeeping: commit `bf0c926` added two new retrospective 
rules (adversarial review of previous session, contract section in fix 
prompts) and updated rule count to 27.

### Session 21 — Beds24 module cleanup (next)

Mode: `safe --base chill --context-pacing`. Disable unused Beds24 
layout modules (Property Description 1, Property Description - 
Booking Page 1, Property Description 2, Room Picture Slider, Offer 
Price Table as candidates). The Offer Price Table disable specifically 
tests whether removing per-occupancy boxes resolves the Attempt 5 
cascade issue. Verify each disable with human gates. Remove dead CSS 
that targeted now-removed elements.

Starts with adversarial review of Session 20's mobile criterion 7 
under real change-event dispatch (the new retrospective rule applied).

### Session 22 — Confirmation page mockup

Surface: Claude Design (claude.ai/design), not Claude Code. Design 
the confirmation page mockup using the brief in 
`docs/confirmation-page-intent.md`. Hostelworld layout patterns as 
reference, site's existing design language (point Claude Design at 
`docs/mockup.html` plus `CSS-base.css`). Output: 
`docs/mockup-confirmation.html` for Session 23 to implement against.

### Session 23 — Confirmation page implementation

Mode: `safe --base chill --context-pacing`. Apply the confirmation 
mockup as CSS payload in Beds24's "Confirmation Page Insert in HTML 
<HEAD>" admin field (a separate field from the booking page's 
customhead). Fix the broken mobile form rendering, the inconsistent 
room-block layout, the two-column guest info grid, the cut-off lock 
icon. End with a real end-to-end test booking to verify the full 
flow.

### Session 24 — Main page visual polish

Mode: `safe --base chill --context-pacing`. Implements 
`docs/main-page-polish-backlog.md` items 1, 2, and 4 (background 
blending, Clear Search summary card, post-Back description text 
removal if Session 21 didn't handle it). All `booking-widget.js` 
or admin-side changes.

### Session 25 — Stay-length tiered UX

Mode: `safe --base chill --context-pacing`. Implements 
`docs/main-page-polish-backlog.md` item 3 (weekly rates pill) and 
item 5 (the 7-27 / 28-89 / 90+ tiered UX). Requires a small 
mockup or design decision pass for the 90+ replacement screen 
before implementation.

### Session 26 — Chill Zone Phase 5 completion

Mode: `safe --base chill --context-pacing`. Final mobile QA sweep 
across the complete booking flow on Chill Zone. Document the 
minimum-modules layout and per-property configuration that will 
carry to other properties. Confirms readiness for rollout.

### Session 27 — Crosslink setup + documentation consolidation

Audit all docs/, decide what's authoritative vs historical vs stale. 
Install Crosslink (https://github.com/forecast-bio/crosslink) on 
the dev environment. Configure Claude Code hooks to enforce 
retrospective rules. Migrate rollout-relevant state into Crosslink 
issues with sub-issues. Dry-run a property rollout inside Crosslink 
before the real rollout begins. See `docs/session-27-crosslink-setup.md` 
for full scope and open questions.

### Sessions 28-30 — Property rollout

One session per remaining property. Apply Chill Zone's verified 
configuration (CSS, JS, admin settings, layout modules) to each. 
Order TBD based on which properties are highest-priority or most 
similar to Chill Zone.

## Open questions about the pipeline

This pipeline will change as work surfaces things. Past Session 23 
the plan is reasonable but not committed. In particular: Session 27's 
Crosslink setup might reveal the tool isn't a fit on this Windows 
setup, in which case Sessions 28-30 fall back to the existing 
handoff workflow with no migration.
