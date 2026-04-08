# Beds24 Booking Page — Project Plan

## Session Notes
- Use American spelling throughout
- Never estimate time for any action

---

## Overview

Modernize the Beds24 booking page UX across 4 WordPress properties. The goal is a Hostelworld-style experience: guests see all available room types for their dates in one view and select from them directly. Fewer than 10 room types across all properties. The majority of users are on iOS mobile. Primary approach is a styled, embedded Beds24 iframe. iOS scroll behavior is tested before any styling work begins.

---

## Architecture Decision

**Primary approach:** CSS/JS injection into the Beds24 responsive booking page via Developer fields, embedded via iframe in WordPress.

The embedded iframe is the right architecture because the core product requirement is showing all available room types in one view so guests can compare and select. A headless booking strip that redirects to Beds24 cannot provide this — it hands the guest off to the same Beds24 page we are trying to improve, just in a new tab. The SPA replicates it but at significant cost. The styled iframe delivers it within Beds24's own proven booking and checkout flow.

**Rationale:**
- Beds24 already handles room display, availability, pricing, checkout, and payment — no rebuilding required
- CSS/JS injection can close the visual and interaction gap with Hostelworld sufficiently for a direct booking page
- One shared external CSS file (`&cssfile=`) serves all 4 properties once dialled in
- Fewer than 10 room types across all properties — the room selection view is simple enough that the iframe approach is not strained

**Fallback hierarchy if iOS scroll fails — in order:**

1. **New-tab fallback:** Mobile users see an on-brand "Book Now" button that opens the Beds24 page in a new tab. One extra tap. Same room selection view, same checkout, same reservation. The goal is the completed booking, not a specific embedding method.

2. **Headless booking strip + redirect:** A Kadence-styled date/guest widget on the WordPress page redirects to the Beds24 room selection page with pre-populated parameters. Removes all iframe scroll issues. Loses the seamless on-page experience but retains the Hostelworld-style room selection view on the Beds24 side. A middle option if the new-tab experience feels too disconnected.

3. **SPA (last resort):** A mobile wizard covering date selection → guest count → room results via Beds24 API V2 → handoff to Beds24 checkout. Beds24 retains ownership of payment, guest details, and booking management. This is a different project with a different scope and budget. It will not be pursued unless there is a demonstrated problem the simpler options cannot solve. That said — the booking page is critical to the business, and if this is what is required, it will happen.

---

## Constraints

- CSS from the WordPress/Kadence theme cannot reach inside the Beds24 iframe (same-origin policy) — all styling must go via Beds24 Developer fields
- Multiple booking stays enabled — price per cell will not show in the Price Table; price populates after quantity selection (client-accepted behaviour)
- Photo uploads cannot be automated — file picker is inaccessible to browser automation; must be done manually
- Mobile testing cannot be automated — requires manual QA in Chrome DevTools or on a real device
- Rich text editor input (descriptions) may be unreliable via browser automation — verify on first attempt

---

## Tooling

| Task | Tool |
|---|---|
| CSS/JS authoring | Claude (side panel or Claude Code CLI) |
| Beds24 admin navigation and field entry | Claude in Chrome |
| Content sourcing (read from existing WP sites) | Claude in Chrome |
| Photo uploads | Manual |
| Mobile QA | Manual (Chrome DevTools / real device) |

---

## Pre-Flight Checklist

Before starting any property, confirm the following are available:

- [ ] Beds24 admin login credentials (or operator present for authentication)
- [ ] Staging URL for the property (do not work on production)
- [ ] Existing WordPress property page URL (source for content extraction)
- [ ] Brand colors and font confirmed (or "match existing site" instruction given)
- [ ] Photos prepared and ready for manual upload
- [ ] Property name, room types, and room counts confirmed

---

## Phase 0.1 — iOS Scroll Test (Do This First)

Before any styling or configuration work, confirm the iframe embedding is viable on iOS Safari. A bare Beds24 staging URL is sufficient — no styling required.

1. Add the iFrame Resizer script to Beds24 HEAD injection on one property's staging URL
2. Remove the fixed height parameter from the iframe
3. Open the page on a real iOS device in Safari
4. Scroll through the full page — confirm it scrolls as one unified page with no independent iframe scroll
5. Select dates — confirm room cards update and scroll position behaves correctly after content height changes
6. Tap into a room detail or any modal/overlay inside the iframe — confirm it appears at the correct position on screen, not 2000px above the current scroll position
7. If all pass: proceed to Phase 0.2
8. If scroll or modal positioning fails: resolve via the fallback hierarchy in the Architecture Decision section before proceeding

---

## Phase 0.2 — Claude in Chrome Admin Viability Test

Before committing to the Claude in Chrome workflow across all 4 properties, run a single test on Property 1 staging:

1. Open the Beds24 admin with Claude in Chrome active
2. Ask Claude to navigate to the Style panel for the property
3. Confirm it can read and interact with the color fields and dropdowns reliably
4. If successful, proceed to Phase 1
5. If fields are inaccessible or input is unreliable, note which tasks need to fall back to manual entry



---

## Phase 1 — Content Extraction (Per Property)

Claude in Chrome reads the existing WordPress property site and extracts:

- Property description (to be adapted for booking page context)
- Room names, types, and descriptions
- Key features per room (for the Features module)
- Brand colors (sampled from live site)
- Font in use (identified from live site CSS)
- Any policies or cancellation terms present on the site

Output: a structured content brief to be used in Phase 2.

---

## Phase 2 — Beds24 Admin Configuration (Per Property)

All steps performed on staging URL. Work through in this order:

### 2a. Layout and Template
- [ ] Set Layout to 6 (default — confirm no change needed)
- [ ] Set Template to 6 (default)
- [ ] Enable Multiple Booking (confirm already enabled)
- [ ] Confirm module arrangement: Picture Slider + Description at Property level; Offer Select + Price Table at Offer level; Picture Slider + Description at Room level

### 2b. Style Panel
- [ ] Body Background
- [ ] Content Background / Text
- [ ] Link Color
- [ ] Border Color
- [ ] Button Style (flat), Button Background, Button Text
- [ ] Font (set to closest available match — 8 options in UI)
- [ ] Font Size

### 2c. Google Fonts (if UI font is insufficient)
- [ ] Add font `<link>` tag to HEAD injection
- [ ] Add `.colorbody { font-family: '...'; }` to Custom CSS

### 2d. Content Entry
- [ ] Property Description 1 (adapted from extracted content)
- [ ] Room descriptions (entered per room via Settings > Properties > Rooms)
- [ ] Room features (entered per room)
- [ ] General Policy and Cancellation Policy text
- [ ] Photos — **manual upload** via Settings > Booking Engine > Pictures, then assigned to property/room/offer

---

## Phase 3 — CSS Injection (Shared Across Properties)

CSS is written once and hosted as an external file, then referenced via `&cssfile=` URL parameter. This means changes apply to all 4 properties simultaneously once the file is in place.

Work through in this order:

1. **Booking strip** — date pickers, guest selectors, search button
2. **Room cards** — panel styling, headers, quantity selectors, pricing display
3. **Property-level layout** — header, description block, overall spacing
4. **Confirmation page** — post-booking styles via Confirmation HEAD field
5. **Mobile layout** — test at each stage in Chrome DevTools, adjust breakpoints as needed

CSS targets documented class names: `#b24scroller`, `.b24room`, `.panel-heading`, `.b24-prop-slider`, etc. Inspect rendered HTML on the staging URL to identify any additional targets before writing.

**CSS architecture — Base + Theme:**
- External CSS file (`&cssfile=`) contains global layout rules only — spacing, typography, card structure, booking strip
- Property-specific overrides (colors, fonts, any layout differences) go in each property's Beds24 Custom CSS field
- This prevents a fix for one property from breaking another

**Critical CSS — FOUC prevention:**
- Booking strip and above-the-fold styles go in the Beds24 Custom CSS field (loads inline, no external request)
- External file handles everything below the fold
- Prevents guests seeing the unstyled Beds24 default page before the external file loads, particularly on mobile

**Investigate during Phase 3 — "from price" display:**
When multiple booking is enabled, price cells are blank until quantity is selected. Assess whether JS can reliably read the available price data from the DOM and inject a "from €X" label into the room card view without quantity selection. Note: Beds24 calculates currency conversion and taxes server-side — any JS injection must account for this or it will display incorrect prices. If JS injection proves unreliable, fallback is to add a static "Rates from $X" line to each room description manually. Do not commit to the JS approach — confirm feasibility first.

---

## Phase 4 — Mobile QA and iOS Scroll Test

The majority of users are on iOS. This phase verifies the embedded experience works correctly on real devices and resolves any issues in order of increasing complexity. The goal at every step is a completed reservation — not a particular technical implementation.

### Setup
- [ ] Implement iFrame Resizer (add script to Beds24 HEAD injection; add resizer call to WordPress page after iframe tag)
- [ ] Remove fixed `height` parameter from iframe when resizer is active
- [ ] Verify widget-to-iframe date/guest passing using the cookie-free URL parameter method

### The Test
Test on a real iOS device — DevTools emulation does not accurately reproduce iOS Safari scroll behaviour.

- [ ] Load the booking page on iOS Safari
- [ ] Scroll through the full page — does it scroll as one unified page, or does the iframe scroll independently?
- [ ] Select dates and confirm room cards update — does scroll position behave correctly after content height changes?
- [ ] Scroll to the bottom of a room card and back — is there any scroll trap or jump?

### Resolution — In Order

**If iOS scroll is seamless:** Proceed to Phase 5. No further action needed.

**If iOS scroll is broken:** Implement the new-tab fallback — mobile users see a "Book Now" button that opens the Beds24 booking page in a new tab. One additional tap, same reservation, same outcome for the guest. This is Beds24's own documented recommendation and a widely-used pattern. In practice this resolves the problem.

**If neither embedded nor new-tab delivers an acceptable experience** (highly unlikely): A mobile SPA wizard is the last resort — date selection → guest count → room results → handoff to Beds24 checkout with pre-populated parameters. This is a significant development investment and should only be pursued if there is a concrete, demonstrated problem that the simpler solutions cannot solve. Development for its own sake is not a reason to proceed.

---

## Phase 5 — Rollout Across Remaining Properties

Once Property 1 staging is approved:

1. The external CSS file is already shared — visual styles carry over automatically
2. Repeat Phases 1–2 for Properties 2, 3, 4 (content and admin config only)
3. Spot-check CSS on each property's staging URL for any layout differences
4. Push each property to production after client sign-off on staging

---

## Known Limitations (Standing Record)

| Limitation | Impact | Status |
|---|---|---|
| Price Table cells don't show per-night price (multiple booking enabled) | Price shows after quantity selection | Accepted by client |
| Same-origin policy blocks WP theme CSS from reaching iframe | All CSS via Beds24 Developer fields | Architectural constraint — handled |
| iFrame mobile behaviour documented as problematic by Beds24 | iFrame Resizer mitigates; new-tab fallback resolves if needed; SPA is last resort only | To be verified in Phase 4 (real device required) |
| Third-party cookie blocking can prevent widget-to-iframe data passing | Use cookie-free URL parameter method | Documented fix available |
| Photo uploads cannot be automated | Manual upload required | Accepted |
| Rich text editor input reliability via browser automation | Verify in Phase 0; fall back to manual if needed | To be verified |
| State loss on page refresh or back-navigation | URL parameter method does not persist state; guest must re-enter dates/guests | Accepted constraint — inherent to iframe architecture regardless of approach |
