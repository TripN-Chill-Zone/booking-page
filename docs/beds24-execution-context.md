# Beds24 Booking Page — Context Document

This document records the architectural decisions, rationale, and project history for handoff between sessions or team members. The execution plan is the separate document — defer to it for what to do. This document explains why.

---

## Decisions That Are Final

- **Controlled iframe for room display, breakout for checkout** is the architecture. The Beds24 booking page is loaded in an iframe on the WordPress property site for room browsing. When the guest clicks Book, `form.target="_top"` breaks out of the iframe and Beds24 checkout takes over the full browser tab. Back button returns to WordPress.
- **The Beds24 WordPress plugin's iframe embed was rejected.** It caused iOS double-scroll issues and provided no control over the booking flow. Our custom widget replaces it.
- **Full iframe flow (booking through confirmation inside iframe) was rejected.** The confirmation page rendered at wrong scroll position, height sync broke on page transitions, and the checkout experience was degraded.
- **Direct Beds24 page (no iframe at all) was the original architecture (Sessions 1-5).** It was reconsidered in Session 6 because the client wanted rooms to appear inline on the WordPress page rather than opening a new tab. The hybrid approach preserves inline room display while avoiding iframe complications for checkout.
- **SPA is last resort only** — understood to be a different project with a different scope and budget.
- Beds24 admin configuration is manual. Claude in Chrome is for content extraction from WordPress sites, CSS authoring, and Beds24 admin field inspection.
- Multiple booking stays enabled. Price-per-cell behavior is accepted.
- No time estimates anywhere.
- American spelling throughout.
- **Iframe loading must use `opacity:0` not `display:none`.** `display:none` prevents content rendering inside the iframe, causing height measurements to return 0 and the loading spinner to persist indefinitely on desktop. Discovered in Session 7.
- **Date strip cells are non-clickable.** Beds24's delegated click handlers navigate to unstyled pages. Blocked via `pointer-events: none` in helper JS.
- **Color overrides for Beds24 Style panel colors must be injected via helper JS**, not just external CSS. The Style panel generates inline `<style>` blocks that load after external CSS and win at equal specificity.
- **Use Beds24 admin field names when communicating with the user** (e.g., "Insert in HTML <HEAD> bottom" not `customhead`).

---

## Architecture Summary

**Guest flow:** WordPress "Book A Room" page → guest enters dates and guest count in custom widget → clicks "Search Rooms" → Beds24 booking page loads in iframe below widget (booking strip/headers/footer hidden by helper script) → guest sees rooms with per-room Book buttons → clicks Book → `form.target="_top"` breaks out of iframe → Beds24 checkout takes over full browser tab → guest completes booking → back button returns to WordPress page.

**WordPress widget role:** Date/guest collection AND room display host. The widget (`booking-widget-v{N}.js`) is a self-injecting JS file hosted on the VPS. It renders the date picker, creates an iframe pointing to the Beds24 booking page with `referer=widget` parameter, listens for `postMessage` height reports from the iframe, and manages the loading spinner. The widget is loaded via a WordPress Custom HTML block:
```html
<div id="tnh-booking-root"></div>
<script src="https://{domain}/booking-widget-v{N}.js"></script>
```

**Beds24 helper role:** The iframe helper (`beds24-iframe-helper-v{N}.js`) is loaded via the `customhead` field on the Beds24 Developer page. When it detects `referer=widget` in the URL and is inside an iframe, it:
1. Hides booking strip, property headers/footers, bottom summary bar (our widget handles these)
2. Reports page height to parent via `postMessage` for iframe sizing
3. Sets `form.target="_top"` so checkout breaks out of iframe
4. Injects per-room Book buttons (Beds24 multi-room mode has NONE per-room)
5. Fixes dorm room booking (unhides guest selector, relabels "Guests" → "Beds")

**CSS architecture:**
- External file (`&cssfile=`): structural rules and aesthetics via CSS variables.
- Per-property theming: small variable override block in each property's inline Beds24 `bookingcss` field.
- Critical CSS for FOUC prevention: pasted into `bookingcss` field. Limited to layout-shift-preventing properties only.
- Rollback: update `&cssfile=` version reference or `<script src>` version reference. Use versioned filenames.

**JS architecture:**
- Widget JS: hosted on VPS, loaded via WordPress Custom HTML block. Self-injects CSS/HTML/logic.
- Iframe helper JS: hosted on VPS, loaded via Beds24 `customhead` field. Only activates when `referer=widget` AND inside iframe.
- Hide/reveal rooms (legacy, in `custombody`): `MutationObserver` on room container, activates only when `checkin` parameters present. 10-second backstop timeout.
- Per-room Book buttons: injected by helper JS into `.b24-multipricebox` of each `.offer` section.
- `customhead` does NOT strip `<script>` tags — use it for external JS loading.
- `custombody` DOES strip `<script>` tags on programmatic save — must paste manually. ~2,000 char limit.

**Fallback hierarchy:** Styled Beds24 in iframe → Direct Beds24 page (new tab) → SPA (different project).

---

## Key Technical Decisions and Their Rationale

**Why controlled iframe instead of direct Beds24 page (Session 6 revision):**
The original architecture opened Beds24 in a new tab or same window. This was reconsidered when the client wanted rooms to appear inline on the WordPress page after searching. Three approaches were evaluated:
1. **New tab** — rooms appear on a separate page, not inline. Rejected for UX.
2. **Full iframe** — rooms and checkout both in iframe. Rejected because confirmation page rendered at wrong scroll position, height sync broke on page transitions, and the checkout form was unusable inside the iframe.
3. **Iframe for display, breakout for checkout** — ADOPTED. Rooms display inline via iframe, `form.target="_top"` breaks out for checkout. Back button returns naturally. This eliminates the iOS double-scroll issue (iframe has `scrolling="no"`), keeps rooms inline on the WordPress page, and gives checkout the full browser tab.

The original iframe concerns (iOS scroll, iFrame Resizer, cross-origin state, sessionStorage, bfcache, third-party cookies) are addressed differently in this approach: iOS scroll is eliminated by `scrolling="no"` + parent page scrolling; no iFrame Resizer needed (we use `postMessage` height sync); no cross-origin state management needed (checkout breaks out); no sessionStorage/bfcache concerns (no page transitions inside iframe); third-party cookies not relevant (no login/session state in the iframe).

**Why `form.target="_top"` instead of intercepting form submission:**
The simplest reliable way to break out of an iframe. One line of JS, works on all browsers, preserves all of Beds24' form data and submission logic. The alternative (intercepting submit, constructing a URL, navigating parent) would require understanding Beds24' form fields and could break if they change.

**Why `customhead` for external JS loading instead of `custombody`:**
`custombody` strips `<script>` tags when saved programmatically via Claude in Chrome, requiring manual paste. `customhead` does NOT strip tags. Both fields inject into the page, but `customhead` is more reliable for automation and has no known character limit issue. `custombody` has a ~2,000 character limit.

**Why MutationObserver instead of setTimeout for hide/reveal:**
A fixed timeout is a race condition on slow connections. `setTimeout(3000)` will fire before Beds24 finishes rendering rooms on Slow 3G, prematurely revealing empty containers. The MutationObserver responds to what Beds24 actually renders. The 10-second backstop is a last-resort safeguard if the observer's target selector breaks due to a Beds24 DOM update.

**Why critical-css-payload.css as a separate git file:**
Critical CSS must be pasted into four separate Beds24 admin panels. Without a single source file, developers must manually extract the relevant subset from the external CSS — a process that introduces typos, missed properties, and version desync. The payload file eliminates this: paste the entire file, append variable overrides, done.

**Why the CSS update protocol requires all four properties to pass staging:**
A single external CSS file serves all four properties. A fix that works on one property but breaks another will affect all four in production. However, pre-existing failures unrelated to the CSS change (e.g., wrong content entry) do not block the push — the check confirms no new breakage, not that every property is passing for unrelated reasons.

**Why Phase 0.2 (price injection) is kept but expendable:**
The adversarial review recommended killing it. The plan keeps it because the safeguards are already maximal: any discrepancy means immediate abandonment, and the JS must fail silently to no-display. The worst production outcome is identical to not building it. The decision to attempt it belongs to the client.

---

## Constraints

- Multiple booking enabled → price per cell not shown in Price Table; populates after quantity selection
- Photo uploads cannot be automated (file picker inaccessible to browser automation)
- Mobile testing cannot be automated (requires real iOS device)
- Beds24 admin configuration is manual
- This architecture requires a developer to maintain post-launch — DOM-targeted CSS/JS will break when Beds24 updates their frontend

---

## Adversarial Review History

The plan went through multiple rounds of adversarial review. Key issues raised and how they were resolved:

| Issue | Resolution |
|---|---|
| Hide/reveal timeout fires prematurely on clean URL (no dates) | Timeout only arms when `checkin` parameters present |
| setTimeout is a race condition on slow connections | Replaced with `MutationObserver` + 10s backstop |
| Critical CSS creates two sources of truth | `critical-css-payload.css` in git as sole source; sync step in update protocol |
| Critical CSS scope too narrow for pre-populated arrivals | Expanded to include room card geometry |
| Price injection JS could display broken data | Hard requirement: fail silently to no-display |
| CSS update protocol blocks on unrelated property failures | Clause added: unrelated failures don't block |
| Widget fallback described as "straightforward" but requires custom JS | Clarified: requires date parsing, `numnight` calculation, URL construction |
| Live transaction triggers operational automations | Client responsibility to coordinate |
| Post-launch maintenance handed to non-technical staff | Stated explicitly: requires developer on call |
| One-way date handoff not documented | Added to Known Limitations |

---

## What a New Session Should Request

- `CLAUDE.md` — project conventions, property/room IDs, file locations, widget architecture
- `session-handoff-7.md` (or latest) — current state, what's working, what's broken
- `beds24-execution.md` — execution plan (source of truth for phases)
- `beds24-execution-context.md` — this document (architecture decisions and rationale)
- `SKILL.md` — setup checklist, design spec, deployment protocol
- `dom-structure.md` — complete DOM tree with verified selectors
- `gotchas.md` — every known pitfall with solutions
- `admin-guide.md` — Beds24 admin page types, field IDs, module reference
- Property name, room types and counts for whichever property is being worked on

Optional (upload on demand):
- `css-architecture.md` — CSS variable system and file architecture detail
- `beds24-admin-field-map.md` — full field-by-field admin detail
- `beds24-template-variables.md` — for confirmation page work
- `ux-review.md` — adversarial UX review with resolution status

**First action every session:** Verify all VPS-hosted files are accessible (navigate to URLs, confirm 200 response and correct content). Check Beds24 "Insert in HTML <HEAD> bottom" field and WordPress Custom HTML block match current versions. Do NOT start debugging functionality until deployment is confirmed.

If in doubt, defer to the execution plan rather than reconstructing from conversation.
