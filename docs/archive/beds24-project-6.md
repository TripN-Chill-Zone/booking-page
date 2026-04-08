# Beds24 Booking Page — Project Plan

## Session Notes
- Use American spelling throughout
- Never estimate time for any action

---

## Overview

Modernize the Beds24 booking page UX across 4 WordPress properties. Guests arrive having already chosen the property — the booking page's job is to show them what's available for their dates and make it easy to complete the reservation. The UX reference point is Hostelworld: a familiar, comfortable mobile experience guests already know. The goal is not to replicate it exactly but to deliver something in that register. Fewer than 10 room types across all properties. The majority of users are on iOS mobile. Primary approach is a styled, embedded Beds24 iframe. All Phase 0 tests must pass before any content or styling work begins.

---

## Architecture Decision

**Primary approach:** CSS/JS injection into the Beds24 responsive booking page via Developer fields, embedded via iframe in WordPress.

The embedded iframe is the right architecture because the core product requirement is showing all available room types in one view so guests can select. A headless booking strip that redirects to Beds24 cannot provide this — it hands the guest off to the same Beds24 page we are trying to improve, just in a new tab. The SPA replicates it but at significant cost. The styled iframe delivers it within Beds24's own proven booking and checkout flow.

**Rationale:**
- Beds24 already handles room display, availability, pricing, checkout, and payment — no rebuilding required
- CSS/JS injection can close the visual and interaction gap with Hostelworld sufficiently for a direct booking page
- One shared external CSS file (`&cssfile=`) serves all 4 properties once dialed in
- Fewer than 10 room types across all properties — the room selection view is simple enough that the iframe approach is not strained

**Deep linking for marketing:** Because room selection lives inside an iframe, the WordPress page URL does not change when a guest views a specific room. However, Beds24 supports a `roomid` URL parameter — a direct link to a specific room can be constructed as a standard Beds24 booking URL with `roomid` pre-populated. This works for ads and marketing campaigns. The tradeoff is that these links open the Beds24 page directly rather than the WordPress-embedded experience, which is acceptable given the goal is a completed booking.

**Fallback hierarchy if iOS scroll fails — in order:**

1. **New-tab fallback:** Mobile users see an on-brand "Book Now" button that opens the Beds24 page in a new tab. One extra tap. Same room selection view, same checkout, same reservation. The goal is the completed booking, not a specific embedding method.

2. **Headless booking strip + redirect:** A Kadence-styled date/guest widget on the WordPress page redirects to the Beds24 room selection page with pre-populated parameters. Removes all iframe scroll issues. Loses the seamless on-page experience but retains the room selection view on the Beds24 side. A middle option if the new-tab experience feels too disconnected.

3. **SPA (last resort):** A mobile wizard covering date selection → guest count → room results via Beds24 API V2 → handoff to Beds24 checkout. Beds24 retains ownership of payment, guest details, and booking management. This is a different project with a different scope and budget. It will not be pursued unless there is a demonstrated problem the simpler options cannot solve. That said — the booking page is critical to the business, and if this is what is required, it will happen.

---

## Constraints

- CSS from the WordPress/Kadence theme cannot reach inside the Beds24 iframe (same-origin policy) — all styling must go via Beds24 Developer fields
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
- [ ] Staging URL for the property (do not work on production)
- [ ] Existing WordPress property page URL (source for content extraction)
- [ ] Brand colors and font confirmed (or "match existing site" instruction given)
- [ ] Photos prepared and ready for manual upload
- [ ] Property name, room types, and room counts confirmed

---

## Phase 0.1 — iOS Scroll Test (Do This First)

**Purpose:** Confirm the iframe embedding is viable on iOS Safari before any other work begins. A bare Beds24 staging URL is sufficient — no styling required.

**Setup:**
1. Add the iFrame Resizer script to Beds24 HEAD injection on one property's staging URL
2. Remove the fixed height parameter from the iframe
3. Open the page on a real iOS device in Safari

### Core Tests
These must pass before proceeding. Each maps directly to whether a guest can complete a booking.

| Test | Pass | Fail |
|---|---|---|
| Page scroll | Scrolls as one unified page — no independent iframe scroll at any point | iframe scrolls independently of the page |
| Date selection | Dates can be selected; room cards update correctly; scroll position holds after content height changes | Scroll jumps, resets, or locks after date selection |
| Room card interaction | Room cards are tappable; quantity can be selected | Tapping a room card produces no response or triggers a scroll jump |
| Proceed to checkout | Guest can tap through from room selection to the Beds24 checkout step | Checkout step is unreachable from the embedded page |

### Dependent Tests
Test after core tests pass. Failures here trigger the fallback hierarchy but do not block core booking flow.

| Test | Pass | Fail |
|---|---|---|
| Modal/overlay positioning | Any modal or detail overlay appears at or near the current viewport position | Modal appears off-screen with no visible indication it opened |
| Keyboard/input zoom | Tapping a text input does not trigger Safari viewport zoom that hides the field | Keyboard zoom hides an input field and guest cannot recover without closing keyboard |

**Minor visual jitter that does not interrupt the booking flow is not a fail.**

**Outcome:**
- All core tests pass → proceed to Phase 0.2
- Any core test fails → resolve via fallback hierarchy before continuing
- Dependent test fails → note the specific failure; assess whether it blocks booking completion; resolve via fallback hierarchy if it does

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

**Any discrepancy in any test — core or dependent — means the JS approach is abandoned immediately. Do not attempt to patch individual cases. Default to static "Rates from $X" text.**

**Outcome:**
- All tests pass → implement JS injection in Phase 3
- Any test fails → add static "Rates from $X" to room descriptions in Phase 2 content entry; no further investigation
- Static text requires manual upkeep — client must update room descriptions when seasonal rates change

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

## Phase 0.4 — Widget-to-iframe Parameter Passing Test

**Purpose:** Confirm that dates and guest count entered in a WordPress booking widget are correctly passed to the Beds24 iframe via URL parameters before any content or styling work begins. This is foundational to the state restoration architecture — if parameter passing is unreliable on iOS Safari, the interaction model requires a rethink before Phase 3.

**Setup:**
1. Add a basic date/guest booking widget to the WordPress staging page
2. Configure it to write dates and guest count as URL parameters on the Beds24 iframe `src`
3. Open the page on a real iOS device in Safari

### Core Tests

| Test | Pass | Fail |
|---|---|---|
| Parameters write to iframe URL | Dates and guest count entered in the WordPress widget appear as URL parameters in the Beds24 iframe `src` | Parameters do not transfer to the iframe |
| Beds24 reads parameters correctly | The Beds24 booking page pre-populates dates and guest count from the URL parameters | Parameters are present in the URL but Beds24 does not read them |
| iOS Safari behavior | Parameter passing works on iOS Safari with default privacy settings | Parameters are stripped or blocked by ITP or Safari privacy controls |

**Outcome:**
- All tests pass → proceed to Phase 1; state restoration architecture is confirmed viable
- Any test fails → diagnose before continuing; state restoration architecture may need revision before Phase 3 investment is made

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

### Work Order

1. **Booking strip** — date pickers, guest selectors, search button
2. **Room cards** — border-radius, box-shadow, image corners, typography, quantity selectors
3. **Hide rooms until dates are selected** — JS: on page load hide all room cards; reveal on date selection event
4. **Property-level layout** — header, description block, overall spacing
5. **Confirmation page** — post-booking styles via Confirmation HEAD field
6. **"From price" JS injection** — implement here if Phase 0.2 confirmed feasible; otherwise skip

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

**Purpose:** Verify the complete booking flow on real devices with all styling and JS in place. This is a full end-to-end test, not just a scroll check.

**State restoration test — run first:**
Before the full flow test, verify the sessionStorage state restoration is working:
1. Load the booking page, enter dates and guest count
2. Note the URL parameters written to the WordPress page
3. Hard-refresh the page
4. Confirm the iframe reloads with the correct dates and guest count pre-populated

### Core Tests

| Test | Pass | Fail |
|---|---|---|
| Full booking flow | Guest can complete: load page → enter dates → view available rooms → select room → reach Beds24 checkout with correct details pre-populated | Any step in the flow is broken or unreachable |
| State restoration on refresh | After hard refresh, dates and guest count are restored from sessionStorage and iframe reloads correctly | State is lost on refresh |
| Room cards hidden pre-dates | Room cards are not visible before dates are entered | Room cards visible before date selection |
| Room cards visible post-dates | All available room types appear after date entry | Rooms do not appear or wrong rooms appear |

### Dependent Tests

| Test | Pass | Fail |
|---|---|---|
| Scroll behavior | Page scrolls as one unit throughout the full flow | Any point of independent iframe scroll |
| Modal/overlay positioning | Any modal appears at viewport position | Modal appears off-screen |
| Keyboard zoom | Text input does not trigger viewport misalignment | Input hidden behind keyboard |
| Widget-to-iframe parameter passing | Dates and guest count entered in a WordPress booking widget populate correctly in the iframe | Parameters do not transfer |
| Throttled connection | Booking strip visible immediately on Slow 3G; room cards load without layout shift | FOUC visible on booking strip; layout shift on room card load |

### Resolution — In Order

**All tests pass:** Proceed to Phase 5.

**Dependent test failures only:** Assess individually. If the failure does not prevent booking completion, document and accept. If it does, resolve before proceeding.

**Core test failure — scroll or input:** Implement new-tab fallback. Mobile users see an on-brand "Book Now" button opening Beds24 in a new tab. Retest core flow in new tab before proceeding.

**Core test failure — booking flow broken regardless of embedding method:** Diagnose root cause. If it is a Beds24 configuration issue, fix in admin and retest. If it is an unresolvable iframe constraint, escalate to fallback hierarchy.

---

## Phase 5 — Rollout Across Remaining Properties

**Purpose:** Apply the confirmed approach from Property 1 to Properties 2, 3, and 4.

The external CSS file is already live and shared. Visual styles carry over automatically. Work for each remaining property is:

1. Repeat Phase 1 (content extraction) for the property
2. Repeat Phase 2 (admin configuration and content entry) for the property
3. Add the property-specific CSS variable block to the property's Beds24 Custom CSS field
4. Spot-check the booking page on staging — confirm CSS renders correctly with no property-specific layout breakage

### Phase 5 Verification (Per Property)

**Core:**
- [ ] Booking page loads with correct property name and room types
- [ ] CSS variable overrides apply correctly — brand colors and fonts match the property's site
- [ ] Full booking flow completable end-to-end on staging
- [ ] No layout breakage introduced by property-specific room count or content differences

**Dependent:**
- [ ] Room descriptions and features appear under correct rooms
- [ ] Photos appear under correct rooms
- [ ] State restoration works on this property's staging URL
- [ ] Mobile QA spot-check on iOS Safari — scroll, room cards, checkout reachable

### Client Sign-Off Protocol

Before pushing any property to production, the client must complete the following on a real iOS device using the staging URL — desktop review does not constitute sign-off:

1. Load the booking page and confirm it displays correctly
2. Enter dates and guest count; confirm room cards appear
3. Select a room and proceed through to the Beds24 checkout step
4. Hard-refresh the page; confirm dates and guest count are restored
5. Confirm the confirmation page is styled correctly after a test booking (sandbox/test mode if available)

Any issue raised after this checklist has been completed and signed off is a new request, not a defect.

**Push to production only after client sign-off on staging for each property.**

---

## Known Limitations (Standing Record)

| Limitation | Impact | Status |
|---|---|---|
| Price Table cells don't show per-night price (multiple booking enabled) | Price shows after quantity selection | Accepted — guests are selecting a room at a property they have already chosen, not comparison shopping |
| Same-origin policy blocks WP theme CSS from reaching iframe | All CSS via Beds24 Developer fields | Architectural constraint — handled by CSS variable architecture |
| iFrame mobile behavior documented as problematic by Beds24 | iFrame Resizer mitigates; new-tab fallback resolves if needed; SPA is last resort | Tested in Phase 0.1 against explicit pass/fail criteria on real iOS device |
| Third-party cookie blocking can prevent widget-to-iframe data passing | Use cookie-free URL parameter method | Documented fix available; tested in Phase 4 |
| Photo uploads cannot be automated | Manual upload required | Accepted |
| State loss on page refresh or back-navigation | Guest must re-enter dates/guests if they refresh — drop-off risk on poor mobile connections | Mitigated by sessionStorage state restoration on the WordPress parent page — tested in Phase 4. Cross-origin postMessage from Beds24 iframe is not supported, so state must be managed by the parent page entirely. |
| iOS Safari keyboard zoom inside iframe | Tapping a text input can hide the field behind the keyboard | Tested in Phase 0.1 — failure triggers fallback hierarchy |
| Deep linking to specific rooms | WordPress page URL does not reflect room state inside iframe | Handled via Beds24 `roomid` URL parameter for marketing links — acceptable tradeoff |
| Hide/reveal room cards JS — silent failure risk | If Beds24 updates their frontend and the reveal event stops firing, rooms are permanently hidden with no visible error | Mitigated by timeout safeguard built into the hide/reveal JS at authoring time: if reveal event has not fired within 3 seconds of page load with date parameters already in the URL, room cards are force-shown |
| Price display before quantity selection | Price only visible after quantity selection with multiple booking enabled | JS injection assessed in Phase 0.2; static "Rates from $X" text is the fallback; accepted tradeoff |
| External CSS rollback desync risk | Rolling back external file while inline Custom CSS references new structure creates broken layouts | Eliminated by CSS variable architecture — inline Custom CSS contains only variable values; rollback of external file is a complete recovery |
| CSS push affects all 4 properties simultaneously | A bad push is a multi-site issue | Mitigated by versioned filename strategy and git repository |
