# Beds24 Booking Page — Context Document

Architectural decisions, rationale, and project history. The 
execution plan is the separate document — defer to it for *what* to 
do. This document explains *why*.

> **Session 11 update (2026-04-21):** Widget max-width widened from 
> 700px to 1290px (matches Kadence `--global-content-width`) after 
> diagnostic testing established that the widget's max-width is the 
> sole knob controlling iframe rendering width. Helper and widget 
> both externalized to read per-property config from 
> `window.TNH_CONFIG` and `window.TNH_WIDGET_CONFIG` respectively — 
> shared code, no per-property variants. Phase 3 work-in-progress 
> was aborted after multiple proposal rounds and reverted to 
> pre-rebuild state. See `docs/retrospective.md` for the failure 
> mode and `docs/session-handoff-11.md` for implementation details.

> **Session 10 update:** Deployment model changed from versioned 
> filenames + manual aaPanel upload to stable filenames + GitHub 
> Actions CI/CD. Current deployment uses `CSS-base.css`, 
> `beds24-iframe-helper.js`, `booking-widget.js` with `Date.now()` 
> cache busting (dev only).

---

## Decisions that are final

### Architecture
- **Controlled iframe for room display, breakout for checkout** is 
  the architecture. Beds24 booking page loads in an iframe on the 
  WordPress property site. On Book click, `form.target="_top"` 
  breaks out so Beds24 checkout takes the full browser tab. Back 
  button returns to WordPress.
- **The Beds24 WordPress plugin's iframe embed was rejected.** iOS 
  double-scroll, no control over booking flow.
- **Full iframe flow (through confirmation) was rejected.** 
  Confirmation page scroll position, height sync failures, degraded 
  checkout experience.
- **Direct Beds24 page (no iframe) was rejected after being tried.** 
  Client wanted rooms inline on WordPress.
- **SPA is last resort only** — different project scope.

### Code sharing
- **Helper JS is shared across all properties.** Per-property data 
  comes from `window.TNH_CONFIG`. Helper halts with console error 
  if config is missing or invalid. No hardcoded fallback.
- **Widget JS is shared across all properties.** Per-property data 
  comes from `window.TNH_WIDGET_CONFIG`. Widget halts with console 
  error if config is missing or invalid. No hardcoded fallback.
- **External `CSS-base.css` is shared across all properties.** 
  Per-property theming via CSS variable overrides in each property's 
  "Custom CSS" field.

### Widget sizing
- **Widget max-width: 1290px.** Matches Kadence content width. This 
  is the sole knob controlling iframe rendering width — no 
  WordPress, Kadence, or Beds24 admin setting affects iframe width. 
  Verified Session 11 via five-test diagnostic sweep.
- **iframe width formula:** `min(viewport, widget.max-width) - 2px`
- **Beds24's mobile breakpoint is 767px.** With widget at 1290px, 
  iPhone portrait gets Beds24 mobile CSS; iPhone landscape and 
  wider get Beds24 desktop CSS.

### Rendering
- **Iframe loading must use `opacity:0`, not `display:none`.** 
  `display:none` prevents content rendering inside the iframe, 
  causing height measurements to return 0 and the loading spinner to 
  persist indefinitely. Discovered Session 7.
- **Date strip cells are non-clickable.** Beds24's delegated click 
  handlers navigate to unstyled pages. Blocked via 
  `pointer-events: none` in helper JS.
- **Color overrides for Beds24 Style panel colors must be injected 
  via helper JS**, not just external CSS. The Style panel generates 
  inline `<style>` blocks that load after external CSS and win at 
  equal specificity.

### Workflow
- Beds24 admin configuration is manual. Claude in Chrome is for 
  content extraction, CSS/JS authoring via Claude Code, and Beds24 
  admin inspection.
- Multiple booking stays enabled. Price-per-cell behavior is accepted.
- No time estimates anywhere.
- American spelling throughout.
- **Use Beds24 admin field names when communicating with the user** 
  ("Insert in HTML <HEAD> bottom" not `customhead`).

---

## Architecture summary

**Guest flow:** WordPress "Book A Room" page → guest enters dates 
and guest count in custom widget → clicks "Search Rooms" → Beds24 
booking page loads in iframe below widget (booking strip/headers/
footers hidden by helper) → guest sees rooms with per-room Book 
buttons → clicks Book → `form.target="_top"` breaks out of iframe → 
Beds24 checkout takes full browser tab → guest completes booking → 
back button returns to WordPress page.

**Widget role:** Date/guest collection AND room display host. The 
widget (`booking-widget.js`) is a self-injecting JS file. It reads 
`window.TNH_WIDGET_CONFIG` for per-property data, renders the date 
picker, creates an iframe pointing to Beds24 with `referer=widget` 
parameter, listens for `postMessage` height reports, and manages the 
loading spinner. Loaded via WordPress Custom HTML block with 
inline config:

```html
<div id="tnh-booking-root"></div>
<script>window.TNH_WIDGET_CONFIG = { /* schema v1 */ };</script>
<script src="https://{domain}/booking-widget.js?v=..."></script>
```

**Helper role:** The iframe helper (`beds24-iframe-helper.js`) is 
loaded via Beds24 "Insert in HTML <HEAD> bottom". It reads 
`window.TNH_CONFIG` for per-property data. When it detects 
`referer=widget` inside an iframe, it:
1. Hides booking strip, property headers/footers, bottom summary bar
2. Reports page height to parent via `postMessage`
3. Sets `form.target="_top"` so checkout breaks out
4. Injects per-room Book buttons
5. Fixes dorm room booking
6. Applies date strip color overrides
7. Formats price display
8. Reorders rooms by price

See `docs/skill/helper-js-architecture.md` for full section 
inventory.

**CSS architecture:**
- External `CSS-base.css`: structural rules and aesthetics via CSS 
  variables
- Per-property theming: variable overrides in each property's 
  inline "Custom CSS" field
- Critical FOUC prevention CSS: in "Custom CSS" field (under 2K chars)

**Fallback hierarchy:** Styled Beds24 in iframe → Direct Beds24 
page (new tab) → SPA (different project).

---

## Key technical decisions and their rationale

### Why controlled iframe instead of direct Beds24 page (Session 6)

Original architecture opened Beds24 in a new tab or same window. 
Reconsidered when the client wanted rooms to appear inline on 
WordPress. Three options evaluated:

1. **New tab** — rooms on separate page. Rejected for UX.
2. **Full iframe** — rooms and checkout both in iframe. Rejected 
   because confirmation page rendered at wrong scroll, height sync 
   broke on transitions, checkout form unusable in iframe.
3. **Iframe for display, breakout for checkout** — ADOPTED.

The original iframe concerns (iOS scroll, iFrame Resizer, 
cross-origin state, sessionStorage, bfcache, third-party cookies) 
are addressed differently: iOS scroll eliminated by `scrolling="no"` 
+ parent page scrolling; no iFrame Resizer (use `postMessage`); no 
cross-origin state management (checkout breaks out); no session 
storage concerns (no page transitions inside iframe); third-party 
cookies not relevant (no login state in iframe).

### Why `form.target="_top"` instead of intercepting form submission

Simplest reliable way to break out of an iframe. One line of JS, 
works on all browsers, preserves all of Beds24's form data and 
submission logic. The alternative (intercepting submit, constructing 
URL, navigating parent) would require understanding Beds24's form 
fields and could break if they change.

### Why "Insert in HTML <HEAD> bottom" for external JS loading

The field does NOT strip `<script>` tags on programmatic save. 
Alternative fields (`custombody`, `customheadconfirm`) DO strip 
tags and require manual paste. `customhead` is also more reliable 
for automation and has no known character limit issue.

### Why MutationObserver instead of setTimeout

A fixed timeout is a race condition on slow connections. 
`setTimeout(3000)` fires before Beds24 finishes rendering on Slow 
3G, prematurely revealing empty containers. The MutationObserver 
responds to what Beds24 actually renders. A 10-second backstop is 
a last-resort safeguard.

### Why single MutationObserver with `isModifying` guard

Two observers on the same subtree where both callbacks modify the 
DOM create infinite mutation loops. Single observer with a re-entry 
flag prevents this. Discovered during Session 6 when the page froze 
inside the iframe.

### Why shared helper/widget instead of per-property forks (Session 11)

Per-property JS files would require deploying N files per property 
and maintaining parallel copies. Every Beds24 DOM update would 
require updating all N helpers. Shared files with config objects 
mean one codebase to maintain; per-property variation lives in 
inline config that each property's admin owns.

Halt-on-missing-config is a deliberate design choice to prevent 
client-specific fallbacks from contaminating shared product code. 
If Chill Zone data were hardcoded as a fallback, shipping to 
property 2 with a bad config would silently show Chill Zone's tags 
to property 2's guests. Fail-loud is safer.

### Why widget max-width 1290px (Session 11)

Diagnostic testing established that the widget's max-width is the 
sole knob controlling iframe rendering width. WordPress, Kadence, 
and Beds24 admin impose zero width constraints. Prior value of 
700px meant every user saw Beds24's mobile CSS regardless of their 
device — the mockup's desktop layout was never rendering. 1290px 
matches Kadence's `--global-content-width`, enabling desktop layout 
on desktop devices while preserving mobile on iPhone portrait.

Breakpoint analysis: widget at 1290px produces iframe widths from 
388px (iPhone portrait viewport) up to 1288px (any viewport ≥1292px). 
Beds24's 767px mobile breakpoint fires at iframe widths ≤767px — 
iPhone portrait (388px) and narrow phones only. iPhone landscape 
(842px iframe), tablets, and desktop all get Beds24 desktop CSS.

### Why reverted to pre-rebuild state (Session 11)

See retrospective 2026-04-21 entry "Offer bar rebuild skipped the 
simplest candidate solution." Short version: a multi-round proposal 
cycle produced three progressively complex architectures when the 
actual fix was porting the existing mockup CSS plus one new rule. 
The rebuild approach was abandoned and the helper reverted to 
commit `420dd06` (pre-rebuild).

---

## Constraints

- Multiple booking enabled → price per cell not shown in Price 
  Table; populates after quantity selection
- Photo uploads cannot be automated (file picker inaccessible to 
  browser automation)
- Mobile testing cannot be automated (requires real iOS device)
- Beds24 admin configuration is manual
- Post-launch maintenance requires a developer — DOM-targeted 
  CSS/JS will break when Beds24 updates their frontend

---

## Adversarial review history

Issues raised across multiple review rounds and their resolutions:

| Issue | Resolution |
|---|---|
| Hide/reveal timeout fires prematurely on clean URL | Timeout only arms when `checkin` parameters present |
| setTimeout is a race condition on slow connections | Replaced with MutationObserver + 10s backstop |
| Critical CSS creates two sources of truth | `critical-css-payload.css` in git as sole source |
| Critical CSS scope too narrow for pre-populated arrivals | Expanded to include room card geometry |
| Price injection JS could display broken data | Hard requirement: fail silently to no-display |
| CSS update protocol blocks on unrelated property failures | Clause added: unrelated failures don't block |
| Widget fallback described as "straightforward" but requires custom JS | Clarified: requires date parsing, URL construction |
| Live transaction triggers operational automations | Client responsibility to coordinate |
| Post-launch maintenance handed to non-technical staff | Stated explicitly: requires developer on call |
| One-way date handoff not documented | Added to Known Limitations |
| Offer bar rebuild plan escalated across three proposals when simpler solution was available | Mockup-first validation rule added to retrospective; proposals archived to `docs/archive/`; v3 reverted to pre-rebuild state plus mockup CSS port |

---

## What a new session should request

The CLAUDE.md entry point specifies the canonical reading order. 
Quick reference:

**Read every session:**
- `CLAUDE.md` — entry point with conventions and file map
- `docs/retrospective.md` — Active Rules take precedence over 
  anything in this document
- `docs/session-handoff-{N}.md` (latest) — current state
- `docs/skill/SKILL.md` — working discipline

**Read when task requires:**
- `docs/skill/dom-structure.md` — before writing selectors
- `docs/skill/css-architecture.md` — before writing CSS
- `docs/skill/helper-js-architecture.md` — before writing JS
- `docs/skill/admin-guide.md` — before admin work
- `docs/skill/property-config.md` — for per-property data and schema
- `docs/skill/rollout-checklist.md` — for per-property onboarding
- `docs/skill/gotchas.md` — known pitfalls
- `docs/beds24-execution.md` — phase status
- `docs/beds24-execution-context.md` — this document, for decisions
- `docs/mockup.html` — design source of truth

**Archived (do not use as current truth):**
- `docs/archive/*` — superseded plans and proposals

**First action every session:** Read the retrospective's Active 
Rules. Then read the current session handoff. Do NOT start debugging 
functionality or making claims about prior work until these are read. 
Browser tabs from previous sessions are leftover state, not 
authoritative context.

---

## Changelog

- **Session 11 (2026-04-21):** Added externalization decisions 
  (`TNH_CONFIG`, `TNH_WIDGET_CONFIG`). Widget max-width updated 
  from 700px to 1290px. Added rationale sections for shared 
  helper/widget, widget sizing, and revert-to-pre-rebuild. Added 
  row to adversarial review history for the rebuild cycle. Updated 
  "What a new session should request" to reflect current skill 
  folder structure.
- **Session 10:** Deployment model changed to GitHub Actions CI/CD. 
  Stable filenames replaced versioned filenames.
- **Session 6:** Hybrid iframe + breakout architecture adopted 
  after full-iframe flow rejected.
- **Session 5:** CSS moved to external file after inline 
  character-limit failure.
