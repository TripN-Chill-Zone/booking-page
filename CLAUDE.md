# Beds24 Booking Page — Project Entry Point

## Read before acting

Every session, in this order, before doing anything else:

1. **`docs/retrospective.md`** — the Active Rules section (currently 
   **25 rules**). These are process constraints learned the hard way. 
   They take precedence over any instruction that contradicts them. If 
   the count in retrospective.md doesn't match the number here, stop 
   and reconcile before doing any work — one of the files is out of sync.
2. **`docs/session-handoff-{N}.md`** (latest) — current project state.
3. **`docs/v3-plan.md`** (if it exists and work is in progress) — or 
   whatever the current-plan doc is named.
4. **`docs/skill/SKILL.md`** — working discipline and skill index.

Read the documents before inspecting browser tabs, running tools, or 
making claims about prior work. Browser tabs from previous sessions are 
leftover state, not authoritative context.

## Project conventions

- American spelling throughout.
- No time estimates in plans or handoffs.
- Use Beds24 admin field names when communicating with the user 
  (e.g., "Insert in HTML <HEAD> bottom", not `customhead`).
- Design target: Hostelworld-like density, not minimalist.
- Fail loud during dev — no graceful degradation fallbacks that hide bugs.
- At session end: add a retrospective entry if a failure mode was 
  surfaced or a new rule was established. If a new Active Rule was 
  added, update the rule count in the "Read before acting" section 
  above in the same commit. Close any Claude in Chrome tabs that 
  were opened during the session.

## First-session setup

Claude Code's GitHub integration handles repo access automatically. At 
session start:

1. Confirm you're in the project directory.
2. `git pull` to make sure you're at the latest commit.
3. Changes to `CSS-base.css`, `beds24-iframe-helper.js`, or 
   `booking-widget.js` auto-deploy via GitHub Actions on push to `main`.

## Project file map

**Read every session:**
- `docs/retrospective.md` — Active Rules and failure-mode log
- `docs/session-handoff-{N}.md` — current state
- `docs/skill/SKILL.md` — working discipline and skill index

**Read when the task requires it:**

*Code structure:*
- `docs/skill/dom-structure.md` — verified DOM map
- `docs/skill/css-architecture.md` — CSS file structure
- `docs/skill/helper-js-architecture.md` — helper JS section layout

*Configuration:*
- `docs/skill/admin-guide.md` — Beds24 admin fields
- `docs/skill/property-config.md` — room IDs, tags, descriptions per property
- `docs/skill/rollout-checklist.md` — new-property setup steps
- `docs/skill/gotchas.md` — known pitfalls with solutions

*Planning and context:*
- `docs/beds24-execution.md` — phase-by-phase execution plan
- `docs/beds24-execution-context.md` — architectural decisions and rationale
- `docs/mockup.html` — the approved design. See SKILL.md for how to use it.

**Archived (do not use as a source of current truth):**
- `docs/archive/*` — superseded plans and proposals, preserved for history.

## Deployment

- **Repo:** `https://github.com/TripN-Chill-Zone/booking-page` (public)
- **Deploy:** Push to `main` → GitHub Actions SSHes to VPS → deploys 3 
  files: `CSS-base.css`, `beds24-iframe-helper.js`, `booking-widget.js`
- **Target:** `/www/wwwroot/astrongpresence.com/`
- **VPS SSH:** port 5771, ed25519 key auth
- **Cache busting:** `Date.now()` in bootstrappers. For production 
  launch, this needs reconsideration — see `docs/beds24-execution.md` 
  Phase 4.

**Currently live:**
- `https://astrongpresence.com/CSS-base.css`
- `https://astrongpresence.com/beds24-iframe-helper.js`
- `https://astrongpresence.com/booking-widget.js`

## Beds24 admin fields in use

- "Insert in HTML <HEAD> top" — Google Fonts `<link>`
- "Insert in HTML <HEAD> bottom" — `TNH_CONFIG` object + `Date.now()` 
  bootstrapper loading the iframe helper
- "Custom CSS" — critical CSS payload + per-property variable overrides
- "Insert in HTML <BODY> bottom" — empty (legacy path, no longer used)

## WordPress

Custom HTML block on "Book A Room" page:
```html
<div id="tnh-booking-root"></div>
<script>
window.TNH_WIDGET_CONFIG = {
  schemaVersion: 1,
  propertyId: "chillzone",
  ownerId: "141266",
  beds24PropId: "271142",
  colors: { /* per-property */ },
  fonts: { /* per-property */ }
};
</script>
<script>var s=document.createElement('script');s.src='https://astrongpresence.com/booking-widget.js?v='+Date.now();document.head.appendChild(s);</script>
```

All three elements (div, config script, bootstrapper script) must be 
present. Verify after every edit.
