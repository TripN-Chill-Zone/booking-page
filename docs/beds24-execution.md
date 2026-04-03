# Beds24 Booking Page — Execution Plan

## Session Notes
- American spelling throughout
- No time estimates

---

## Pre-Flight Checklist

- [ ] Beds24 admin login credentials
- [ ] Staging URL for the property's Beds24 booking page (do not work on production)
- [ ] Existing WordPress property page URL (source for content extraction)
- [ ] Brand colors and font confirmed (or "match existing site" instruction given)
- [ ] Photos prepared and ready for manual upload
- [ ] Property name, room types, and room counts confirmed
- [ ] WordPress booking widget installed and configured to point at the Beds24 staging URL

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

## Phase 0.1 — WordPress Widget Parameter Passing Test (Do This First)

**Setup:**
1. Configure the Beds24 WordPress plugin widget on the property's WordPress staging page
2. Set the widget action to open the Beds24 booking page (staging URL) with `propid` pre-set
3. Open the WordPress page on a real iOS device in Safari

### Core Tests

| Test | Pass | Fail |
|---|---|---|
| Parameters reach Beds24 | Dates and guest count appear as URL parameters (`checkin`, `numnight`, `numadult`) on the Beds24 page | Parameters do not appear in the Beds24 URL |
| Beds24 reads parameters | Beds24 pre-populates dates and guest count; available rooms display immediately | Parameters present but Beds24 does not read them or rooms do not display |
| iOS Safari behavior | Widget opens the Beds24 page correctly — no parameter stripping, no blocked navigation | Widget fails to open the page, or parameters are stripped |

### Dependent Tests

| Test | Pass | Fail |
|---|---|---|
| New tab vs. same window | Configured open behavior works as expected | Page opens in wrong context or fails to open |

**Outcome:**
- All core tests pass → proceed to Phase 0.2
- Any core test fails → diagnose widget configuration; if the Beds24 WordPress plugin cannot reliably pass parameters, build a custom HTML form widget in Kadence. This requires custom JS to parse date inputs, calculate `numnight`, format dates to Beds24's expected parameter format, and construct the URL.

---

## Phase 0.2 — "From Price" JS Feasibility Test

**Setup:**
1. Open the staged Beds24 booking page with a date range selected
2. Open browser DevTools and inspect the DOM

### Core Tests

| Test | Pass | Fail |
|---|---|---|
| Price data in DOM | Price data present and readable before quantity selection | Price only returned server-side after quantity selection |
| Injected price accuracy — standard rate | Injected price exactly matches checkout price for a standard booking | Any discrepancy |

### Dependent Tests (only if core tests pass)

| Test | Pass | Fail |
|---|---|---|
| Weekend / seasonal rate accuracy | Injected price matches checkout price for weekend or peak-season dates | Any discrepancy |
| Occupancy-based rate accuracy | Injected price matches checkout price across different guest counts | Any discrepancy |
| Currency conversion accuracy | Injected price matches checkout price for non-default currency | Any discrepancy |

**Any discrepancy in any test → abandon JS approach immediately. Do not patch.**

**Outcome:**
- All tests pass → implement JS injection in Phase 3
- Any test fails → no-price strategy (price appears after quantity selection)
- Static "Rates from $X" text available only if client commits in writing to a price audit cadence (minimum: before any rate change goes live)

---

## Phase 0.3 — Claude in Chrome Content Extraction Viability

### Core Tests

| Test | Pass | Fail |
|---|---|---|
| Page content readable | Claude can read room descriptions, features, and policies | Content inaccessible |
| Brand colors identifiable | Claude can identify hex values from live site CSS | Colors cannot be reliably identified |
| Font identifiable | Claude can identify font family from live site | Font cannot be identified |

### Dependent Tests

| Test | Pass | Fail |
|---|---|---|
| Structured output | Claude produces a clean content brief ready for manual Beds24 entry | Output requires significant reformatting |

**Outcome:**
- Core tests pass → use Claude in Chrome for Phase 1
- Core tests fail → manual content extraction; no impact on subsequent phases

---

## Phase 1 — Content Extraction (Per Property)

Extract from existing WordPress property site:
- Property description (adapted for booking page context)
- Room names, types, and descriptions
- Key features per room
- Brand colors (hex values)
- Font family
- Policies and cancellation terms

### Verification

**Core:**
- [ ] All room names match actual rooms in Beds24 account
- [ ] All room descriptions present and accurate
- [ ] Features list complete for each room
- [ ] No content assigned to wrong room

**Dependent:**
- [ ] Brand colors match live site visually
- [ ] Font matches live site
- [ ] Policies complete and current

---

## Phase 2 — Beds24 Admin Configuration (Per Property)

All steps on staging URL. Do not work on production.

### 2a. Layout and Template
- [ ] Layout set to 6
- [ ] Template set to 6
- [ ] Multiple Booking confirmed enabled
- [ ] Module arrangement: Picture Slider + Description at Property level; Offer Select + Price Table at Offer level; Picture Slider + Description at Room level

### 2b. Style Panel
- [ ] Body Background
- [ ] Content Background / Text
- [ ] Link Color
- [ ] Border Color
- [ ] Button Style (flat), Button Background, Button Text
- [ ] Font (closest match from 8 UI options)
- [ ] Font Size

### 2c. Google Fonts (if UI font insufficient)
- [ ] Font `<link>` tag added to HEAD injection
- [ ] `.colorbody { font-family: '...'; }` added to Custom CSS

### 2d. Content Entry
- [ ] Property Description 1
- [ ] Room descriptions (per room)
- [ ] Room features (per room)
- [ ] General Policy and Cancellation Policy
- [ ] Static "Rates from $X" text (if Phase 0.2 determined JS not viable and client opted in)
- [ ] Photos — manual upload, assigned to correct property/room/offer

### Phase 2 Verification

**Core:**
- [ ] Booking page loads on staging with correct property name
- [ ] All room types appear — correct count, correct names
- [ ] Multiple Booking enabled (confirm by selecting more than one room)
- [ ] Date selection updates room availability
- [ ] Booking can be initiated end-to-end on staging

**Dependent:**
- [ ] Style panel values reflected — colors, button style, font size
- [ ] Google Font loads correctly if added
- [ ] Room descriptions under correct rooms
- [ ] Room features under correct rooms
- [ ] Policies in correct location
- [ ] Photos under correct rooms

**Any core failure must be resolved before Phase 3.**

---

## Phase 3 — CSS and JS Injection (Shared Across Properties)

### CSS Architecture

**Base + Theme:**
- External file (`&cssfile=`): structural rules only — layout, spacing, resets, card/booking strip geometry. Zero aesthetics.
- All aesthetics via CSS variables defined in external file
- Per-property theming: small variable override block in each property's Beds24 Custom CSS field (e.g., `:root { --brand-color: #ff0000; --brand-font: 'Open Sans'; }`)

**Critical CSS (FOUC prevention):**
- Booking strip, page header, and room card basic geometry replicated inline in Beds24 Custom CSS field
- Limited to layout-shift-preventing properties only: `display`, `grid`/`flex` structure, `width`, `height`, `aspect-ratio`, `min-height`. No colors, borders, typography, shadows.
- Maintained as `critical-css-payload.css` in git — sole source of truth for inline fields
- Deployment: paste entire contents of `critical-css-payload.css` into each property's Custom CSS field, then append per-property variable overrides

**Version control:**
- External CSS in git, versioned filename (e.g., `beds24-base-v1.css`)
- Rollback: update `&cssfile=` reference — all 4 properties update simultaneously

### CSS Update Protocol

1. New versioned filename in git (e.g., `beds24-base-v2.css`)
2. If above-the-fold structure changed, update `critical-css-payload.css` in git
3. Paste `critical-css-payload.css` + variable overrides into one property's Custom CSS field
4. Point that property's staging at new external file
5. Visually verify: booking strip, room cards, confirmation page, all viewport widths
6. Repeat steps 3–5 for all four properties on staging
7. Verify all four staging environments
8. Only then: update production `&cssfile=` references and inline fields simultaneously

Pre-existing failures unrelated to the CSS change do not block the push.

### Work Order

1. **Booking strip** — date pickers, guest selectors, search button
2. **Room cards** — border-radius, box-shadow, image corners, typography, quantity selectors
3. **Hide rooms until dates selected** — JS hide/reveal (only when page loads without date parameters)
4. **Property-level layout** — header, description block, spacing
5. **Confirmation page** — styles via Confirmation HEAD field
6. **"From price" JS injection** — if Phase 0.2 confirmed feasible; otherwise skip

### JS Specifications

**Hide/reveal — detection mechanism:**
- Primary: `MutationObserver` on room card container (e.g., `#b24scroller`) watching for child nodes. Triggers reveal when room nodes appear, then disconnects.
- Only activates when `checkin` parameters present in URL.
- Without date parameters: JS waits for date selection event indefinitely.
- Backstop: 10-second timeout force-shows rooms if observer detects nothing (last resort for DOM structure changes).

**Price injection — failure behavior:**
- Must fail silently to no-display. If DOM node absent, content unexpected, or any error: remove/hide injected element entirely.
- Hard requirement at authoring time.

**CSS targets:** `#b24scroller`, `.b24room`, `.panel-heading`, `.b24-prop-slider`, etc. Inspect rendered HTML on staging before writing.

### Confirmation Page Verification
- [ ] Brand colors and font present — visually continuous with booking flow
- [ ] Booking reference prominently visible
- [ ] Next-steps copy present and legible
- [ ] No raw Beds24 default styles

Unstyled confirmation page = core verification failure.

### Phase 3 Verification

**Core:**
- [ ] Booking strip styled and functional
- [ ] Room cards visible and styled after date selection
- [ ] Room cards hidden before date selection
- [ ] Pre-populated date parameters → rooms display immediately
- [ ] Complete booking can be initiated: dates → room selection → checkout
- [ ] No CSS rule breaks booking flow

**Dependent:**
- [ ] CSS variables apply correctly per property
- [ ] No FOUC on Slow 3G
- [ ] Image corners rounded
- [ ] Confirmation page styled
- [ ] "From price" labels correct (if implemented)
- [ ] No layout breakage at 375px, 390px, 430px viewports
- [ ] External CSS versioned and committed to git

**Any core failure must be resolved before Phase 4.**

---

## Phase 4 — Full Mobile QA (Per Property)

Notify client's admin/accounting team before testing — live transactions will appear in payment gateway as charges followed by refunds. Gateway fees on refunds are typically not returned.

### Core Tests

| Test | Pass | Fail |
|---|---|---|
| Full flow from WordPress | WordPress widget → Beds24 page with availability → select room → complete checkout | Any step broken or unreachable |
| Direct URL with parameters | `checkin`, `numnight`, `numadult` parameters pre-populate correctly; rooms display | Parameters ignored or rooms do not display |
| Room cards hidden pre-dates | Without date parameters, rooms not visible before date entry | Rooms visible before date selection |
| Room cards visible post-dates | All available room types appear after date entry | Rooms do not appear or wrong rooms |
| Live transaction — confirmation page | Real booking, real payment, immediate refund; confirmation page: brand styles, booking reference visible, no default Beds24 styles | Unstyled or visually discontinuous confirmation |

**Live transaction cannot be substituted with sandbox or test mode.**

### Dependent Tests

| Test | Pass | Fail |
|---|---|---|
| Scroll behavior | Normal scrolling throughout | Any scroll issue |
| Modal/overlay positioning | Modals at viewport position | Off-screen |
| Keyboard zoom | No iOS Safari viewport zoom hiding fields | Input hidden behind keyboard |
| Throttled connection | Booking strip immediate on Slow 3G; no room card layout shift | FOUC or layout shift |
| Back button | Returns to WordPress property page | Does not return |

### Resolution

- All pass → Phase 5
- Dependent failures only → assess individually; accept if non-blocking
- Core failure → diagnose; fix config or CSS/JS and retest; SPA fallback is last resort

---

## Phase 5 — Rollout (Remaining Properties)

External CSS file already shared. Per property:

1. Repeat Phase 1 (content extraction)
2. Repeat Phase 2 (admin configuration and content entry)
3. Add property-specific CSS variable block to Custom CSS field
4. Configure WordPress widget with correct `propid`
5. Spot-check on staging

### Verification (Per Property)

**Core:**
- [ ] Correct property name and room types
- [ ] CSS variable overrides apply — brand colors and fonts match
- [ ] Full flow end-to-end on staging (WordPress widget → Beds24 → checkout)
- [ ] No layout breakage from property-specific content differences

**Dependent:**
- [ ] Room descriptions and features under correct rooms
- [ ] Photos under correct rooms
- [ ] WordPress widget passes parameters correctly
- [ ] Mobile spot-check on iOS Safari

### Client Sign-Off (Per Property)

On a real iOS device, staging URL:

1. Enter dates and guests in WordPress widget
2. Confirm Beds24 page opens with availability
3. Select room, proceed to checkout
4. Back button returns to property page normally
5. Confirmation page styled (requires Phase 4 live transaction to have passed)

**Post-sign-off issues are new requests, not defects. Push to production only after sign-off.**

---

## Post-Launch Maintenance

**Monitoring:**
- Monthly visual spot-check per property: booking strip, room cards, price injection (if implemented), confirmation page
- Monitor Beds24 changelog/community forum for frontend updates

**If Beds24 frontend update breaks styling/JS:**
1. Confirm breakage on Beds24's side (load without `cssfile` parameter)
2. Author new versioned CSS file
3. Follow CSS update protocol (Phase 3)
4. JS breakage: MutationObserver backstop and silent-failure behavior provide immediate resilience; author fix via same staging protocol

**This architecture requires a developer to maintain.** DOM-targeted CSS/JS will break when Beds24 updates their frontend. The client must have access to a web developer post-launch.

---

## Known Limitations

| Limitation | Impact | Status |
|---|---|---|
| No per-night price in Price Table (multiple booking enabled) | Price shows after quantity selection | Accepted |
| Photo uploads not automated | Manual upload | Accepted |
| Booking page on Beds24 domain | Guest leaves property site on "Search" | Accepted — end of client journey |
| Hide/reveal JS silent failure | Rooms could be permanently hidden if Beds24 changes DOM | `MutationObserver` + 10s backstop timeout; observer only when `checkin` params present |
| Price display before quantity selection | Price only after selection | Phase 0.2 JS test; silent fail to no-display; static text fallback |
| CSS rollback desync risk | Rollback could break layouts | Eliminated — inline fields contain only variables; `critical-css-payload.css` is sole source |
| CSS push affects all 4 properties | Bad push = multi-site issue | Versioned filenames + git |
| Beds24 frontend updates without warning | All 4 properties break simultaneously | JS safeguards + monthly spot-checks |
| Deep linking to rooms | Marketing links use `roomid` parameter | Same styled page — no tradeoff |
| Date handoff is one-way | Dates changed on Beds24 don't carry back to WordPress | Accepted — Beds24 page is end of journey |
