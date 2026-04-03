# Beds24 Booking Page — Context Document

This document records the architectural decisions, rationale, and project history for handoff between sessions or team members. The execution plan is the separate document — defer to it for what to do. This document explains why.

---

## Decisions That Are Final

- **Direct Beds24 page** is the architecture. The booking page is hosted on the Beds24 domain, styled via CSS/JS injection, and linked from the WordPress property site. It is not embedded in an iframe.
- **Iframe was considered and rejected.** An earlier version of this plan (v1–v8) used an iframe. It was dropped because the iframe introduced iOS scroll issues, iFrame Resizer dependency, cross-origin state management, sessionStorage restoration, bfcache edge cases, and third-party cookie blocking — all to keep the guest on the property domain during a step where domain continuity provides no conversion value.
- **SPA is last resort only** — understood to be a different project with a different scope and budget.
- Beds24 admin configuration is manual. Claude in Chrome is for content extraction from WordPress sites and CSS authoring only.
- Multiple booking stays enabled. Price-per-cell behavior is accepted.
- No time estimates anywhere.
- American spelling throughout.

---

## Architecture Summary

**Guest flow:** WordPress property page → guest enters dates and guest count in booking widget → clicks "Search" → Beds24 booking page opens (new tab or same window) with `checkin`, `numnight`, `numadult` URL parameters pre-populated → guest sees rooms, selects, completes booking on Beds24.

**WordPress widget role:** Launcher only. Collects dates and guest count, constructs the Beds24 URL, hands off. No iframe, no state sync, no cookie dependency. If the Beds24 WordPress plugin fails, fallback is a custom HTML form widget with JS for date parsing and `numnight` calculation.

**CSS architecture:**
- External file (`&cssfile=`): structural rules only, zero aesthetics. All aesthetics via CSS variables.
- Per-property theming: small variable override block in each property's inline Beds24 Custom CSS field.
- Critical CSS for FOUC prevention: `critical-css-payload.css` in git, pasted into inline fields. Covers booking strip, page header, and room card basic geometry. Limited to layout-shift-preventing properties only.
- Rollback: update `&cssfile=` version reference. Inline fields contain only variables + critical CSS payload — trivial to re-enter.

**JS architecture:**
- Hide/reveal rooms: `MutationObserver` on room card container, activates only when `checkin` parameters present. 10-second backstop timeout. Without date parameters, waits for date selection event indefinitely.
- Price injection (if Phase 0.2 passes): must fail silently to no-display on any error. Hard requirement.

**Fallback hierarchy:** Styled Beds24 page → SPA (different project).

---

## Key Technical Decisions and Their Rationale

**Why direct Beds24 page instead of iframe:**
The client's priority is a modern booking experience that works on mobile, not domain continuity. The booking page is the end of the client journey. Removing the iframe eliminated: Phase 0.1 iOS scroll testing, Phase 0.4 parameter passing via iframe, all sessionStorage/state restoration logic, iFrame Resizer dependency, cross-origin concerns, bfcache edge cases, third-party cookie issues, and roughly a third of the plan's complexity.

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

- The execution plan document — it is the source of truth for what to do
- The technical docs MD file (if it exists) — contains documented CSS class names, URL parameters, injection points
- Property name, room types and counts, and staging URL for whichever property is being worked on
- Confirmation of which Phase 0 tests have already been run and their outcomes
- Brand colors and font for the current property (or "match existing site" instruction)

If in doubt, defer to the execution plan rather than reconstructing from conversation.
