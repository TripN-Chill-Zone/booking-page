# Beds24 Booking Page — Project Plan (v9)

## Session Notes
- Use American spelling throughout
- Never estimate time for any action

---

## Overview

Modernize the Beds24 booking page UX across 4 WordPress properties. Guests arrive having already chosen the property — the booking page's job is to show them what's available for their dates and make it easy to complete the reservation. The UX reference point is Hostelworld: not a replication, but something in that register — modern, clean, comfortable on a phone. Fewer than 10 room types across all properties. The majority of users are on iOS mobile. Primary approach is a styled Beds24 booking page hosted on the Beds24 domain, linked from the WordPress property site. All Phase 0 tests must pass before any content or styling work begins.

---

## Architecture Decision

**Primary approach:** CSS/JS injection into the Beds24 responsive booking page via Developer fields. The booking page is hosted on the Beds24 domain and opened directly from the WordPress property site — not embedded in an iframe.

**Guest flow:** The guest visits the WordPress property page, enters dates and guest count in a booking widget, and clicks "Search." This opens the Beds24 booking page in a new tab (or the same window — configurable) with dates and guest count pre-populated via URL parameters (`checkin`, `numnight`, `numadult`). The guest sees available rooms, selects one, and completes the booking entirely on the Beds24 page. The booking page is the end of the client journey on the site.

**Why not an iframe:** An earlier version of this plan embedded the Beds24 page in an iframe on the WordPress site. This was dropped because the iframe introduced substantial complexity — iOS scroll behavior, iFrame Resizer dependency, cross-origin state management, sessionStorage restoration, bfcache edge cases, third-party cookie blocking — all to keep the guest on the property domain during a step where domain continuity provides no conversion value. The client's priority is a modern, functional booking experience, not a specific embedding method. The direct Beds24 page delivers the same room selection and checkout flow with none of the iframe fragility.

**Rationale:**
- Beds24 handles room display, availability, pricing, checkout, and payment — no rebuilding required
- CSS/JS injection can close the visual gap with Hostelworld sufficiently for a direct booking page
- One shared external CSS file (`&cssfile=`) serves all 4 properties once dialed in
- Fewer than 10 room types across all properties — the room selection view is simple enough that the approach is not strained
- No iframe means no iOS scroll issues, no cross-origin policy restrictions, no iFrame Resizer dependency, no state restoration complexity
- The booking page is a standard web page — back button, refresh, scroll, keyboard input all work natively

**Deep linking for marketing:** Beds24 supports `roomid` and `propid` URL parameters. Direct links to a specific property or room can be constructed for ads and marketing campaigns. Because the booking page is already on the Beds24 domain, these links land in the same experience the guest would reach from the WordPress site.

**WordPress widget role:** The Beds24 WordPress plugin provides a booking widget (search box, booking strip, or similar) that collects dates and guest count. The widget's action URL points to the Beds24 booking page with the appropriate `propid`. When the guest clicks "Search," the widget opens the Beds24 page with `checkin`, `numnight`, and `numadult` parameters pre-populated. The widget is a launcher — it collects intent and hands off. No iframe, no state synchronization, no cookie dependency.

**Fallback:** If the styled Beds24 page proves insufficient for the required UX — a situation that would only arise if Beds24's page structure is too rigid to style acceptably — the fallback is the SPA approach: a mobile wizard covering date selection → guest count → room results via Beds24 API V2 → handoff to Beds24 checkout. This is a different project with a different scope and budget. It will not be pursued unless there is a demonstrated problem the simpler approach cannot solve.

---

## Constraints

- Multiple booking stays enabled — price per cell will not show in the Price Table; price populates after quantity selection (client-accepted behavior)
- Photo uploads cannot be automated — file picker is inaccessible to browser automation; must be done manually
- Mobile testing cannot be automated — requires manual QA on a real device
- Beds24 admin configuration is manual — Claude in Chrome is used for content extraction and CSS authoring only, not admin navigation or field entry

---

## Tooling

| Task | Tool |
|---|---|
| CSS/JS authoring | Claude (chat or Claude Code CLI) |
| Content sourcing (read from existing WP sites) | Claude in Chrome |
| Beds24 admin configuration and content entry | Manual |
| Photo uploads | Manual |
| Mobile QA | Manual (real iOS device) |

---

## Pre-Flight Checklist

Before starting any property, confirm the following are available:

- [ ] Beds24 admin login credentials
- [ ] Staging URL for the property's Beds24 booking page (do not work on production)
- [ ] Existing WordPress property page URL (source for content extraction)
- [ ] Brand colors and font confirmed (or "match existing site" instruction given)
- [ ] Photos prepared and ready for manual upload
- [ ] Property name, room types, and room counts confirmed
- [ ] WordPress booking widget installed and configured to point at the Beds24 staging URL

---

## Phase 0.1 — WordPress Widget Parameter Passing Test (Do This First)

**Purpose:** Confirm that the WordPress booking widget correctly passes dates and guest count to the Beds24 booking page via URL parameters. This is the only integration point between the WordPress site and the Beds24 page — if it doesn't work, the guest flow requires a rethink before any styling investment.

**Setup:**
1. Configure the Beds24 WordPress plugin widget on the property's WordPress staging page
2. Set the widget action to open the Beds24 booking page (staging URL) with `propid` pre-set
3. Open the WordPress page on a real iOS device in Safari

### Core Tests

| Test | Pass | Fail |
|---|---|---|
| Parameters reach Beds24 | Dates and guest count entered in the WordPress widget appear as URL parameters (`checkin`, `numnight`, `numadult`) on the Beds24 booking page | Parameters do not appear in the Beds24 URL |
| Beds24 reads parameters correctly | The Beds24 booking page pre-populates dates and guest count from the URL parameters; available rooms display immediately | Parameters are present in the URL but Beds24 does not read them or rooms do not display |
| iOS Safari behavior | Widget opens the Beds24 page correctly on iOS Safari — no parameter stripping, no blocked navigation | Widget fails to open the page, or parameters are stripped by Safari |

### Dependent Tests

| Test | Pass | Fail |
|---|---|---|
| New tab vs. same window | The configured open behavior (new tab or same window) works as expected | Page opens in wrong context or fails to open |

**Outcome:**
- All core tests pass → proceed to Phase 0.2
- Any core test fails → diagnose the widget configuration; if the Beds24 WordPress plugin cannot reliably pass parameters, build a simple HTML form widget in Kadence that constructs the Beds24 URL manually — this is straightforward and does not depend on the plugin

---

## Phase 0.2 — "From Price" JS Feasibility Test

**Purpose:** Determine whether a "from €X" price label can be injected into room cards before quantity selection. Price visibility before selection is a UX nicety — guests have already chosen the property and are selecting a room, not comparison shopping. It reduces friction but is not load-bearing. This test determines whether to pursue JS injection or default immediately to static text.

**Setup:**
1. Open the staged Beds24 booking page with a date range selected
2. Open browser DevTools and inspect the DOM

### Core Tests

| Test | Pass | Fail |
|---|---|---|
| Price data in DOM | Price data is present and readable in the DOM before quantity selection | Price is only returned server-side after quantity selection — JS injection is not possible |
| Injected price accuracy — standard rate | Injected price exactly matches the price shown at checkout for a standard booking | Any discrepancy between injected price and checkout price |

### Dependent Tests
Only run if core tests pass.

| Test | Pass | Fail |
|---|---|---|
| Weekend / seasonal rate accuracy | Injected price matches checkout price when a weekend or peak-season date range is selected | Discrepancy appears under any rate rule |
| Occupancy-based rate accuracy | Injected price matches checkout price across different guest counts | Discrepancy appears when guest count changes the rate |
| Currency conversion accuracy | Injected price matches checkout price when a non-default currency is selected | Discrepancy appears under currency conversion |

**Any discrepancy in any test — core or dependent — means the JS approach is abandoned immediately. Do not attempt to patch individual cases.**

**Outcome:**
- All tests pass → implement JS injection in Phase 3
- Any test fails → default to **no-price strategy**: show no price on room cards; price appears after quantity selection via the standard Beds24 multiple booking behavior. A missing price creates no guest expectation; a wrong price creates distrust and increases checkout abandonment.
- **Static "Rates from $X" text is available as an alternative** if the client explicitly requests it — but only if the client commits in writing to a price audit cadence (minimum: before any rate change goes live). Without that commitment, static text is not offered. If agreed, add to room descriptions in Phase 2 content entry and document the audit responsibility with the client.

---

## Phase 0.3 — Claude in Chrome Content Extraction Viability

**Purpose:** Confirm Claude in Chrome can reliably read and extract content from the existing WordPress property sites before Phase 1 begins. Claude in Chrome is used for content sourcing only — Beds24 admin entry is manual.

### Core Tests

| Test | Pass | Fail |
|---|---|---|
| Page content readable | Claude can read the full property page including room descriptions, features, and policies | Content is behind a login, dynamically loaded in a way Claude cannot access, or otherwise inaccessible |
| Brand colors identifiable | Claude can identify hex values for primary brand colors from the live site CSS or computed styles | Colors cannot be reliably identified |
| Font identifiable | Claude can identify the font family in use from the live site | Font cannot be identified |

### Dependent Tests

| Test | Pass | Fail |
|---|---|---|
| Structured output | Claude produces a clean content brief in a consistent format ready for manual entry into Beds24 | Output requires significant reformatting before use |

**Outcome:**
- Core tests pass → proceed to Phase 1 using Claude in Chrome for content extraction
- Core tests fail → content extraction is done manually by the operator, reading the existing WordPress site field by field; use the Content Mapping Sheet produced in Phase 2 as the field-by-field guide for where each piece of content belongs in Beds24; no impact on subsequent phases

---

## Phase 1 — Content Extraction (Per Property)

**Purpose:** Produce a structured content brief for each property, ready for manual entry into Beds24 in Phase 2.

Claude in Chrome reads the existing WordPress property site and extracts:
- Property description (adapted for booking page context)
- Room names, types, and descriptions
- Key features per room (for the Features module)
- Brand colors (hex values)
- Font family in use
- Policies and cancellation terms

### Verification Checklist
After extraction, verify before proceeding to Phase 2:

**Core:**
- [ ] All room names match the actual rooms in the Beds24 account
- [ ] All room descriptions are present and accurate
- [ ] Features list is complete for each room
- [ ] No content assigned to the wrong room

**Dependent:**
- [ ] Brand colors match the live site visually
- [ ] Font identified matches what renders on the live site
- [ ] Policies are complete and current

**Output:** A structured content brief per property, reviewed and confirmed before Phase 2 entry begins.

---

## Phase 2 — Beds24 Admin Configuration (Per Property)

**Purpose:** Enter all content and configuration into the Beds24 staging account. All entry is manual — copy content from the Phase 1 brief and paste into the appropriate fields.

All steps performed on the staging URL. Do not work on production.

### 2a. Layout and Template
- [ ] Layout set to 6
- [ ] Template set to 6
- [ ] Multiple Booking confirmed enabled
- [ ] Module arrangement confirmed: Picture Slider + Description at Property level; Offer Select + Price Table at Offer level; Picture Slider + Description at Room level

### 2b. Style Panel
- [ ] Body Background
- [ ] Content Background / Text
- [ ] Link Color
- [ ] Border Color
- [ ] Button Style (flat), Button Background, Button Text
- [ ] Font (closest available match from 8 options in UI)
- [ ] Font Size

### 2c. Google Fonts (if UI font is insufficient)
- [ ] Font `<link>` tag added to HEAD injection
- [ ] `.colorbody { font-family: '...'; }` added to Custom CSS

### 2d. Content Entry
- [ ] Property Description 1
- [ ] Room descriptions (per room via Settings > Properties > Rooms)
- [ ] Room features (per room)
- [ ] General Policy and Cancellation Policy
- [ ] Static "Rates from $X" text added to room descriptions (if Phase 0.2 determined JS injection is not viable)
- [ ] Photos — manual upload via Settings > Booking Engine > Pictures, assigned to correct property/room/offer

### Phase 2 Verification
Run after all entry is complete, before Phase 3 begins.

**Core:**
- [ ] Booking page loads on staging URL with correct property name
- [ ] All room types appear — correct count, correct names
- [ ] Multiple Booking is enabled — confirm by attempting to select more than one room
- [ ] Date selection works — selecting dates updates room availability display
- [ ] A booking can be initiated end-to-end on staging (select dates → select room → reach checkout)

**Dependent:**
- [ ] Style panel values are reflected on the page — colors, button style, font size
- [ ] Google Font loads correctly if added
- [ ] Each room description appears under the correct room
- [ ] Each room features list appears under the correct room
- [ ] Policies appear in the correct location
- [ ] Photos appear under the correct rooms

**Any core verification failure must be resolved before Phase 3 begins.**

---

## Phase 3 — CSS and JS Injection (Shared Across Properties)

**Purpose:** Apply all visual styling and interaction improvements to the Beds24 booking page via Developer field injection.

**CSS architecture — Base + Theme:**
- External CSS file (`&cssfile=`) contains structural rules only: flexbox/grid layout, spacing, resets, card geometry, booking strip geometry
- Zero aesthetic declarations in the external file — no colors, no borders, no fonts, no shadows
- All aesthetic declarations are CSS variables defined in the external file, applied via those variables throughout
- Per-property theming is a small block of CSS variable overrides in each property's Beds24 Custom CSS field — e.g. `:root { --brand-color: #ff0000; --brand-font: 'Open Sans'; }`
- This means the external file rollback covers all structural and aesthetic rules simultaneously; the inline Custom CSS field contains only variable values, which are trivial to re-enter if needed

**Critical CSS — FOUC prevention:**
- Above-the-fold layout (booking strip, page header) is replicated as Critical CSS in the Beds24 Custom CSS field (inline, no external request)
- External file handles everything below the fold
- On slow connections, guests see a styled booking strip immediately; the rest loads in

**Version control and rollback:**
- External CSS file kept in a git repository
- `&cssfile=` URL parameter references a versioned filename (e.g. `beds24-base-v1.css`)
- Rolling back: update the filename reference in the Beds24 URL parameter — all 4 properties update simultaneously
- Inline Custom CSS fields contain only CSS variable overrides — if a rollback is needed, re-entering a small block of variable values is the full recovery task

**CSS update protocol — mandatory before any shared file change goes to production:**
1. Make the change in git on a new versioned filename (e.g. `beds24-base-v2.css`)
2. Point one property's staging URL at the new file
3. Visually verify that property's booking page — booking strip, room cards, confirmation page, all viewport widths
4. Point all four properties' staging URLs at the new file
5. Visually verify all four staging environments before updating any production URL
6. Only after all four staging checks pass: update the production `&cssfile=` reference

A fix that passes on Property 1 staging is not cleared for production until all four properties have been checked.

### Work Order

1. **Booking strip** — date pickers, guest selectors, search button
2. **Room cards** — border-radius, box-shadow, image corners, typography, quantity selectors
3. **Hide rooms until dates are selected** — JS: on page load hide all room cards; reveal on date selection event. Note: when the guest arrives from the WordPress widget with dates pre-populated, rooms should be visible immediately — the hide/reveal only applies when the page loads without date parameters.
4. **Property-level layout** — header, description block, overall spacing
5. **Confirmation page** — post-booking styles via Confirmation HEAD field
6. **"From price" JS injection** — implement here if Phase 0.2 confirmed feasible; otherwise skip

**Hide/reveal JS — timeout safeguard:** If the reveal event has not fired within 3 seconds of page load, room cards are force-shown. This prevents rooms from being permanently hidden if Beds24 updates their frontend and the event stops firing.

**Price injection JS — mandatory failure behavior:** The price injection script must be wrapped in error handling that fails silently to no-display. If the expected DOM node is absent, returns unexpected content, or throws any error, the script must remove or hide any injected price element entirely — a guest who sees no price has no expectation; a guest who sees `null`, `undefined`, or a wrong price loses trust. This is a hard requirement at authoring time, not a post-hoc fix.

CSS targets documented class names: `#b24scroller`, `.b24room`, `.panel-heading`, `.b24-prop-slider`, etc. Inspect rendered HTML on the staging URL before writing to confirm current class names.

### Confirmation Page

The confirmation page is the only moment in the flow where the guest has completed a booking. It must not undermine the trust the rest of the flow has built. Styling via the Beds24 Confirmation HEAD field.

**Verification criteria:**
- [ ] Brand colors and font are present — page is visually continuous with the booking flow
- [ ] Booking reference is prominently visible
- [ ] Next-steps copy is present and legible (what happens now, what to expect)
- [ ] Page does not revert to raw Beds24 default styles

If the confirmation page looks unstyled or jarring relative to the booking flow, treat it as a core verification failure.

### Phase 3 Verification

**Core:**
- [ ] Booking strip is styled and functional — dates and guest count can be entered
- [ ] Room cards are visible and styled after date selection
- [ ] Room cards are hidden before date selection (if JS hide/reveal implemented)
- [ ] When page loads with date parameters pre-populated (from WordPress widget), rooms display immediately without requiring the guest to re-enter dates
- [ ] A complete booking can be initiated: dates → room selection → checkout
- [ ] No CSS rule breaks the booking flow (e.g. hidden submit button, unresponsive tap target)

**Dependent:**
- [ ] CSS variables apply correctly — brand colors and fonts render as expected per property
- [ ] No FOUC visible on a throttled mobile connection (test in Chrome DevTools Network > Slow 3G)
- [ ] Image corners are rounded on room cards and sliders
- [ ] Confirmation page is styled correctly
- [ ] "From price" labels display correctly and match checkout price (if implemented)
- [ ] No layout breakage at 375px, 390px, and 430px viewport widths (common iOS sizes)
- [ ] External CSS filename is versioned and file is committed to git

**Any core verification failure must be resolved before Phase 4 begins.**

---

## Phase 4 — Full Mobile QA (Per Property)

**Purpose:** Verify the complete booking flow on real devices with all styling and JS in place. This is a full end-to-end test covering both the WordPress-to-Beds24 handoff and the on-page booking experience.

### Core Tests

| Test | Pass | Fail |
|---|---|---|
| Full flow from WordPress | Guest can complete the full journey: WordPress property page → enter dates and guests in widget → land on Beds24 page with availability loaded → select room → complete checkout | Any step in the flow is broken or unreachable |
| Direct URL with parameters | Loading the Beds24 booking page URL with `checkin`, `numnight`, and `numadult` parameters pre-populates correctly and shows available rooms | Parameters are ignored or rooms do not display |
| Room cards hidden pre-dates | When the Beds24 page is loaded without date parameters, room cards are not visible before dates are entered | Room cards visible before date selection |
| Room cards visible post-dates | All available room types appear after date entry | Rooms do not appear or wrong rooms appear |
| Live transaction — confirmation page | One real booking completed with a real payment method; booking is refunded immediately after; confirmation page is verified: brand styles present, booking reference visible, no raw Beds24 default styles | Confirmation page is unstyled, missing booking reference, or visually discontinuous with the booking flow |

**The live transaction test cannot be substituted with sandbox or test mode.** Sandbox environments do not reliably reproduce the confirmation page's CSS context. Budget one real transaction per property for this step.

### Dependent Tests

| Test | Pass | Fail |
|---|---|---|
| Scroll behavior | Page scrolls normally throughout the full flow | Any scroll issue (this should not occur without an iframe, but verify) |
| Modal/overlay positioning | Any modal appears at viewport position | Modal appears off-screen |
| Keyboard zoom | Text input does not trigger iOS Safari viewport zoom that hides the field | Input hidden behind keyboard |
| Throttled connection | Booking strip visible immediately on Slow 3G; room cards load without layout shift | FOUC visible on booking strip; layout shift on room card load |
| Back button behavior | Guest can use the browser back button to return to the WordPress property page from the Beds24 booking page | Back button does not return to the property page |

### Resolution — In Order

**All tests pass:** Proceed to Phase 5.

**Dependent test failures only:** Assess individually. If the failure does not prevent booking completion, document and accept. If it does, resolve before proceeding.

**Core test failure — booking flow:** Diagnose root cause. If it is a Beds24 configuration issue, fix in admin and retest. If it is a CSS/JS issue, fix and retest. If the Beds24 page structure cannot be styled to an acceptable standard, escalate to the SPA fallback — but this is a last resort.

---

## Phase 5 — Rollout Across Remaining Properties

**Purpose:** Apply the confirmed approach from Property 1 to Properties 2, 3, and 4.

The external CSS file is already live and shared. Visual styles carry over automatically. Work for each remaining property is:

1. Repeat Phase 1 (content extraction) for the property
2. Repeat Phase 2 (admin configuration and content entry) for the property
3. Add the property-specific CSS variable block to the property's Beds24 Custom CSS field
4. Configure the WordPress booking widget on this property's page to point at the correct Beds24 booking URL with the correct `propid`
5. Spot-check the booking page on staging — confirm CSS renders correctly with no property-specific layout breakage

### Phase 5 Verification (Per Property)

**Core:**
- [ ] Booking page loads with correct property name and room types
- [ ] CSS variable overrides apply correctly — brand colors and fonts match the property's site
- [ ] Full booking flow completable end-to-end on staging (WordPress widget → Beds24 page → checkout)
- [ ] No layout breakage introduced by property-specific room count or content differences

**Dependent:**
- [ ] Room descriptions and features appear under correct rooms
- [ ] Photos appear under correct rooms
- [ ] WordPress widget passes parameters correctly for this property
- [ ] Mobile QA spot-check on iOS Safari — scroll, room cards, checkout reachable

### Client Sign-Off Protocol

Before pushing any property to production, the client must complete the following on a real iOS device using the staging URL — desktop review does not constitute sign-off:

1. Open the WordPress property page and enter dates and guest count in the booking widget
2. Confirm the Beds24 booking page opens with availability displayed
3. Select a room and proceed through to the Beds24 checkout step
4. Use the browser back button to return to the property page; confirm it loads normally
5. Confirm the confirmation page is styled correctly — this requires the live transaction test from Phase 4 to have already been completed and passed for this property

Any issue raised after this checklist has been completed and signed off is a new request, not a defect.

**Push to production only after client sign-off on staging for each property.**

---

## Post-Launch Maintenance

**Purpose:** The CSS and JS in this project target Beds24's current frontend DOM structure. Beds24 can update their frontend without notice, which would break styling or JS behavior across all four properties simultaneously. This section defines the ongoing responsibilities required to catch and respond to that.

**Monitoring cadence:**
- Load each property's live booking page monthly and complete a visual spot-check: booking strip renders, room cards appear after date selection, price injection displays correctly (if implemented), confirmation page is styled. This is a 5-minute task per property.
- Subscribe to the Beds24 changelog, release notes, or any available notification channel for frontend updates. If Beds24 does not publish changelogs, check their community forum or support announcements monthly.

**Response protocol if a Beds24 frontend update breaks styling or JS:**
1. Confirm the breakage is on Beds24's side (load the unstyled booking page URL without the `cssfile` parameter and check for DOM changes)
2. Author a new versioned CSS file targeting the updated DOM structure
3. Follow the existing CSS update protocol (Phase 3): stage on one property → verify → stage on all four → verify → push to production
4. If JS (hide/reveal or price injection) is broken: the timeout safeguard and silent-failure behavior provide immediate guest-facing resilience; author a fix and deploy via the same staging protocol

**Ownership:** These maintenance responsibilities transfer to whoever operates the properties post-launch. Document this handoff explicitly with the client.

---

## Known Limitations (Standing Record)

| Limitation | Impact | Status |
|---|---|---|
| Price Table cells don't show per-night price (multiple booking enabled) | Price shows after quantity selection | Accepted — guests are selecting a room at a property they have already chosen, not comparison shopping |
| Photo uploads cannot be automated | Manual upload required | Accepted |
| Booking page is on the Beds24 domain, not the property domain | Guest leaves the property site when they click "Search" in the booking widget | Accepted — the booking page is the end of the client journey; domain continuity at this step provides no conversion value |
| Hide/reveal room cards JS — silent failure risk | If Beds24 updates their frontend and the reveal event stops firing, rooms are permanently hidden with no visible error | Mitigated by timeout safeguard: if reveal event has not fired within 3 seconds of page load with date parameters in the URL, room cards are force-shown |
| Price display before quantity selection | Price only visible after quantity selection with multiple booking enabled | JS injection assessed in Phase 0.2; script must fail silently to no-display (hard requirement — see Phase 3); static "Rates from $X" text is the fallback; accepted tradeoff |
| External CSS rollback desync risk | Rolling back external file while inline Custom CSS references new structure creates broken layouts | Eliminated by CSS variable architecture — inline Custom CSS contains only variable values; rollback of external file is a complete recovery |
| CSS push affects all 4 properties simultaneously | A bad push is a multi-site issue | Mitigated by versioned filename strategy and git repository |
| Beds24 frontend updates can break CSS/JS without warning | All four properties may break simultaneously if Beds24 changes DOM structure or class names | Mitigated by timeout safeguards (hide/reveal JS), silent-failure behavior (price JS), and monthly spot-check cadence defined in Post-Launch Maintenance |
| Deep linking to specific rooms | Direct links for marketing use Beds24 `roomid` URL parameter | These links land on the same styled Beds24 page — no tradeoff with the direct-page architecture |
