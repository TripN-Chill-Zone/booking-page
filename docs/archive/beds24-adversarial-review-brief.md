# Beds24 Booking Page Customization — Adversarial Review Brief

*A single-document context package for one-shot adversarial review. Contains what a reviewer needs to form accurate, well-calibrated critiques without requiring follow-up clarification rounds.*

---

## 1. What This Project Is

Custom styling and behavior layer for Beds24 booking pages serving a 4-property hostel brand (Trip'N'Hostel). Beds24 is a third-party booking engine SaaS; we do not control its source. The customization layer makes Beds24's booking UI match our brand and addresses UX issues inherent to Beds24's default rendering.

**Scale:** 4 properties, shared codebase, per-property theming via CSS variables.
**Criticality:** Production booking flow. Breakage equals lost revenue.
**Maintenance posture:** Explicitly accepted — requires a developer on call post-launch because DOM-targeted CSS/JS will break when Beds24 updates their frontend. This is a known, documented constraint, not an oversight.

---

## 2. Architecture (Final, Not Open for Re-Litigation)

**Guest flow:**
1. WordPress "Book A Room" page renders a custom widget (date/guest picker)
2. Widget creates an iframe pointing to Beds24 booking page with `referer=widget` parameter
3. Helper JS inside the iframe detects iframe + widget context and hides Beds24 chrome
4. Guest browses rooms inside the iframe
5. On Book click, `form.target="_top"` breaks out of iframe; Beds24 checkout takes over full browser tab
6. Back button returns to WordPress

**Why this specific architecture (decision history):**

| Considered | Outcome |
|---|---|
| Beds24 WordPress plugin | **Rejected.** iOS double-scroll issues, no flow control |
| Direct Beds24 page (new tab) | **Rejected in Session 6.** Client required inline room display |
| Full iframe (including checkout) | **Tried and rejected.** Confirmation page wrong scroll position, height sync broke on page transitions, checkout unusable in iframe |
| Hybrid (iframe for display, breakout for checkout) | **Adopted.** Eliminates iOS scroll via `scrolling="no"`, keeps rooms inline, gives checkout full tab |
| Custom SPA via Beds24 API | **Out of scope.** Different project, different budget |

**Do not propose returning to any of these in review.** They are adjudicated. Critique should operate within the hybrid-iframe constraint.

---

## 3. What's Been Tried Already (CSS-Only Attempts)

Before DOM manipulation was adopted, these CSS-only approaches were attempted for the alignment bugs and failed:

- `flex-wrap` with `order` values on children
- `justify-content: flex-end` on multipricebox
- `justify-content: space-between` on multipricebox
- `flex-basis: 100%` on from-price to force line break
- Explicit `width: 100%` on every parent in the chain
- `.tnh-offer-row` wrapper div with `display: flex; width: 100%`

**Root cause of CSS-only failure:** Beds24's nested flex containers with `flex-wrap`, an undocumented `div#selectors1-{roomId}` wrapper that collapses to 0 width, and a MutationObserver-driven JS that re-adds `.hidden` classes to elements we try to keep visible. The layout is controlled by Beds24's runtime behavior, not just its initial CSS.

**Reviewer note:** A "just use flex-grow: 1" critique is not novel — it's been tried. Generic CSS diagnostics will not survive the trial history unless they account for the `.hidden` fight loop and the collapsed wrapper.

---

## 4. Active Bugs Driving Current Work

6 active bugs, all classified as not-CSS-only-fixable, all addressed by a single offer-bar rebuild:

| Bug | Severity | Why not CSS-only |
|---|---|---|
| Book button shifts left after qty selection (mobile) | High | Parent flex container wraps unpredictably; `margin-left: auto` doesn't work on wrapped line |
| "Select" label overlaps Book button | High | Same root cause as above |
| Total price shown before qty selection | Medium | JS populates total at injection time; no CSS selector for "sibling has `.hidden`" works here |
| From-price disappears after qty selection | Medium | Beds24 MutationObserver re-adds `.hidden`; fight loop with our overrides |
| Inconsistent dorm vs. standard layout | Medium | Fundamentally different DOM structures require unified code path |
| Price per night missing for 1-night stays | Low | JS conditional only ran when `nights > 1` |

7 separate issues were CSS-only fixable and are already solved and stable (per-occupancy price leakage, fakelinks, collapsed sections, carousel controls, date strip header row, date strip cell clickability, "up" button).

---

## 5. Beds24 Admin Surface — What It Can and Cannot Do

**Configured and working:**
- All 20 Style panel color fields (brand palette)
- Content fields (descriptions, policies, room names)
- Layout page (Template 6, modules positioned)
- Configuration (multi-room booking enabled, nights/guests defaults)

**Admin limitations that force code-level customization:**
- No admin field for offer bar layout. Structure (Select label, qty dropdown, price, Book button arrangement) is hardcoded in Beds24's frontend.
- Style panel changes colors only, not structure.
- Layout page reorders modules but can't modify their internal layout.
- "Cheapest First" room ordering setting doesn't actually take effect — JS handles sorting via DOM reorder.
- Room Features module renders off-brand by default — data is extracted and re-rendered by helper JS.

**Deployment surface gotchas:**
- `custombody` (Body bottom) strips `<script>` and `<style>` tags on programmatic save. Manual paste required. ~2,000 char limit.
- `customhead` (HEAD bottom) does NOT strip tags. Preferred for external JS loading.
- Style panel generates inline `<style>` blocks that load after external CSS and win at equal specificity. Overrides require JS-injected `<style>` tags with `!important`.

---

## 6. Current Deployment Model

**Development (current):**
- Widget JS and helper JS hosted on a private development domain (online but not public)
- GitHub Actions CI/CD with stable filenames, `Date.now()` cache busting
- Beds24 `customhead` field holds a 159-char bootstrapper loading the helper JS
- Widget loaded via WordPress Custom HTML block

**Production (planned):**
- Final domain will run on LiteSpeed web server with QUIC.cloud CDN
- LiteSpeed Cache handles page/browser caching; QUIC.cloud provides edge CDN distribution for static assets (including the helper JS and widget JS files)
- `Date.now()` cache-busting pattern will likely need revisiting for production — aggressive cache-busting defeats CDN edge caching and forces origin hits. Versioned filenames or query-string versioning tied to deploys is the conventional fit with LiteSpeed/QUIC.cloud.

**Known operational gaps (open issues, fair game for review):**
- `ROOM_TAGS` is hardcoded in helper JS (room IDs → tag arrays). Needs per-property externalization before rollout to properties 2-4.
- Cache-busting strategy needs alignment with the production CDN model before launch. Current `Date.now()` approach is appropriate for development but will undermine QUIC.cloud edge caching if carried into production unchanged.
- Manual-paste deployment steps for `custombody` need a documented runbook.
- No automated monitoring for Beds24 DOM changes that would silently break selectors.

---

## 7. Adversarial Review History — Issues Already Closed

These have been raised and resolved. Re-raising them without new information is redundant.

| Issue | Resolution |
|---|---|
| Hide/reveal timeout fires prematurely on clean URL | Timeout only arms when `checkin` params present |
| `setTimeout` race condition on slow connections | Replaced with `MutationObserver` + 10s backstop |
| Critical CSS creates two sources of truth | Single git file (`critical-css-payload.css`) + sync step in protocol |
| Price injection JS could display broken data | Hard requirement: fail silently to no-display |
| CSS update protocol blocks on unrelated property failures | Clause: unrelated failures don't block |
| Widget fallback described as "straightforward" | Clarified: requires date parsing, nights calc, URL construction |
| Post-launch maintenance handed to non-technical staff | Explicit: requires developer on call |

---

## 8. Constraints (Non-Negotiable)

- Multiple booking enabled → price-per-cell not shown in Price Table (accepted)
- Photo uploads cannot be automated (file picker inaccessible to browser automation)
- Mobile testing cannot be automated (requires real iOS device)
- Beds24 admin configuration is manual (programmatic saves strip tags in some fields)
- American spelling throughout
- No time estimates anywhere
- Iframe loading uses `opacity: 0`, not `display: none` (Session 7 — `display: none` prevents render, breaks height measurement)

---

## 9. What Effective Critique of This Project Looks Like

**High-value targets for adversarial review:**
- Cache-busting strategy reconciliation with LiteSpeed/QUIC.cloud for production launch
- Pre-rollout gaps that will bite properties 2-4 (ROOM_TAGS externalization, per-property config management)
- Runbook completeness for manual-paste deployment steps
- Silent-failure modes in the integration layer (what happens when Beds24 changes?)
- DOM-shape drift detection (scheduled selector checks against live Beds24)
- Local tactical decisions inside the offer-bar rebuild (e.g., mirror-pattern desync detection)

**Low-value critique that will be rejected:**
- "Why not just use CSS?" — Answered in §3
- "Why not use the Beds24 API / build a SPA?" — Out of scope per §2
- "Why not iframe isolation?" — Tried, failed, per §2
- "Why are you doing DOM surgery?" — Because admin config can't reach the offer bar per §5
- "You should use a CDN" — Production already planned with QUIC.cloud per §6
- Generic flexbox diagnostics — Tried per §3
- "Have you considered...?" questions answered in this document

**Review methodology expectation:**
Adversarial review is a one-shot technique prone to rapid context rot as rounds accumulate. A reviewer operating on incomplete context tends to fabricate concerns from that gap, then retract them as context arrives — which is itself a failure mode. The reviewer should read this entire document first, then critique. Questions about whether something has been considered should be answered by searching this document before being asked.

---

## 10. Supporting Documents Available on Request

Request only if the critique specifically requires them:
- `beds24-execution.md` — current execution plan (source of truth for phases and sequencing)
- `offer-bar-rebuild-plan.md` — detailed proposal for the current debate
- `dom-structure.md` — verified DOM selectors
- `gotchas.md` — known pitfalls with solutions
- `admin-guide.md` — full Beds24 admin field reference
- `CLAUDE.md` — project conventions, property/room IDs, file locations
- `session-handoff-{N}.md` — latest session state

---

*This brief is designed to be read cold by a reviewer with no prior context. If after reading it a critique still hinges on information not present here, that's a signal the brief needs extending — not that the project needs defending.*
