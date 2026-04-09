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
| Beds24 admin configuration (most fields) | Claude in Chrome |
| Beds24 admin `<script>`/`<style>` fields | Manual paste by user (Beds24 strips tags on programmatic save) |
| Photo uploads | Manual |
| Mobile QA | Manual (real iOS device) |
| VPS file upload | User via aaPanel file manager |

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
- [ ] Multiple Room Booking set to "Enabled" (`bookpageallowmulti` = 1)
- [ ] Room Features module (106) added to Room Bottom section (must be done manually in Beds24 admin UI)
- [ ] Module arrangement: Property Calendar at Property level; Offer Select + Price Table at Offer level; Features + Picture Slider + Description at Room level

### 2b. Style Panel
- [ ] Body Background
- [ ] Content Background / Text
- [ ] Link Color
- [ ] Border Color
- [ ] Button Style (flat), Button Background, Button Text
- [ ] Font (closest match from 8 UI options)
- [ ] Font Size

### 2c. Google Fonts (if UI font insufficient)
- [ ] Font `<link>` tag added to `customheadtop` field
- [ ] Font override in `bookingcss` field (`.colorbody` + heading selectors)

### 2d. Content Entry
- [ ] Property Description 1
- [ ] Room descriptions (per room)
- [ ] Room features — entered per room in PROPERTIES > ROOMS > SET UP, or property-level in PROPERTIES > DESCRIPTION
- [ ] General Policy and Cancellation Policy
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

**External file (served via `&cssfile=` URL parameter):**
- Contains ALL structural rules, aesthetics, layout, responsive design
- No character limit
- Versioned filenames: `CSS-base-v1.css`, `CSS-base-v2.css`, etc.
- Hosted on VPS via aaPanel, served through Cloudflare (use versioned filenames to bust cache)
- Current hosting: `https://astrongpresence.com/CSS-base-v{N}.css`

**Inline `bookingcss` field (Custom CSS in Beds24 admin):**
- Critical CSS payload (FOUC prevention) + per-property variable overrides ONLY
- HARD LIMIT: ~18-19K characters (saves silently fail above this — discovered in Session 5)
- Keep under 2K characters
- Template in `docs/skill/references/css-architecture.md`

**Inline `custombody` field:**
- Hide/reveal JS + price injection JS, wrapped in `<script>` tags
- MUST be pasted manually by user — Beds24 strips `<script>` tags on programmatic save via Claude in Chrome

**Inline `customheadconfirm` field:**
- Confirmation page styles, wrapped in `<style>` tags
- MUST be pasted manually — same tag stripping issue

**Rollback:** Update `&cssfile=` version reference. Inline fields contain only variables + critical CSS payload — trivial to re-enter.

### CSS Update Protocol

1. New versioned filename (e.g., `CSS-base-v3.css`)
2. Upload to VPS via aaPanel
3. Update booking page URL to reference new filename
4. Hard refresh to verify (Ctrl+Shift+R) — Cloudflare caches aggressively
5. If critical CSS structure changed, update `bookingcss` inline field too
6. For multi-property rollout: verify all properties on staging before production

Pre-existing failures unrelated to the CSS change do not block the push.

### Design Direction — Hostelworld Model

The booking page should feel like Hostelworld's room listing. This was agreed in Session 5 based on analysis of the live Hostelworld page for the Chill Zone property.

**Booking strip:** Check In + Check Out only. No nights selector, no global guest count, no search button (dates auto-search). Strip should be sticky at top of page.

**Room card layout:**
```
┌────────────────────────────────────────────┐
│ Room Name                                  │
├──────────────┬─────────────────────────────┤
│              │ Description text             │
│  Photo       │ Features / amenities         │
│  (40%)       │                              │
├──────────────┴─────────────────────────────┤
│ Date Strip (availability calendar)          │
├─────────────────────────────────────────────┤
│ [Quantity ▼]  from €XX   [Book Now →]      │
└─────────────────────────────────────────────┘
```

Mobile: stacks vertically.

### Work Order

1. **Room card layout** — Hostelworld-style: photo left + description right, date strip below, qty + price + Book button at bottom
2. **Booking strip** — Check In + Check Out only, sticky positioning
3. **Sticky bottom Book bar** — visible as guest scrolls
4. **Hide/reveal rooms** — JS: hide rooms before dates selected, show after (MutationObserver on `.b24fullcontainer-rooms`)
5. **Dorm booking mechanism** — JS: inject visible Book button for dorm rooms (hidden input problem)
6. **Confirmation page** — styles via `customheadconfirm` field
7. **"From price" JS injection** — if Phase 0.2 confirmed feasible; otherwise skip

### JS Specifications

**Hide/reveal — detection mechanism:**
- Primary: `MutationObserver` on `.b24fullcontainer-rooms` (the room container) watching for `.b24room` child nodes. Triggers reveal when room nodes appear, then disconnects.
- IMPORTANT: `#b24scroller` is the booking STRIP, NOT the room container. Use `.b24fullcontainer-rooms` for room detection.
- Only activates when `checkin` parameters present in URL.
- Without date parameters: JS hides rooms and shows "Select your dates" message. Waits for page reload with parameters.
- Backstop: 10-second timeout force-shows rooms if observer detects nothing.

**Dorm booking JS:**
- Dorm rooms (configured for channel manager compatibility) render `input[type="hidden"][name="sr1-{roomId}"][value="1"]` instead of a quantity dropdown
- This cannot be changed without affecting Hostelworld/Booking.com integrations
- JS must detect dorm rooms (hidden sr1 input) and inject a visible "Book" button
- The hidden input already sets quantity to 1 — the JS just needs to trigger form submission or make the booking mechanism visible

**Price injection — failure behavior:**
- Must fail silently to no-display. If DOM node absent, content unexpected, or any error: remove/hide injected element entirely.
- Hard requirement at authoring time.

**Verified CSS targets (Session 5 DOM inspection):**
- Room container: `.b24fullcontainer-rooms`
- Room cards: `.b24room`
- Room panel: `.b24panel-room`
- Room heading: `.b24-roompanel-heading` > `.at_roomnametext`
- Booking strip: `.b24-bookingstrip` / `#b24scroller`
- Photo slider: `.b24-room-slider` > `[id^="collapseslider"]` > `.carousel`
- Description: `.b24-room-desc` > `[id^="collapsedesc"]`
- Date strip: `.b24-offer-pricetable`
- Qty selector: `.b24-offer-select` > `select[id^="sr1-"]`
- Book button: `.multiplebookbutton .at_bookingbut`
- Full selector reference: `docs/skill/references/dom-structure.md`

### Confirmation Page Verification
- [ ] Brand colors and font present — visually continuous with booking flow
- [ ] Booking reference prominently visible
- [ ] Next-steps copy present and legible
- [ ] No raw Beds24 default styles

Unstyled confirmation page = core verification failure.

### Phase 3 Verification

**Core:**
- [ ] Booking strip: Check In + Check Out only, sticky at top
- [ ] Room cards: photo + description side by side, date strip below, qty + Book at bottom
- [ ] Rooms hidden before date selection, visible after
- [ ] Pre-populated date parameters → rooms display immediately
- [ ] All rooms bookable (including dorms — verify dorm booking mechanism)
- [ ] Complete booking can be initiated: dates → room selection → checkout
- [ ] No CSS rule breaks booking flow
- [ ] Bottom Book bar sticky and visible when rooms selected

**Dependent:**
- [ ] CSS variables apply correctly per property
- [ ] No FOUC on Slow 3G
- [ ] Image corners rounded
- [ ] Confirmation page styled
- [ ] "From price" labels correct (if implemented)
- [ ] No layout breakage at 375px, 390px, 430px viewports
- [ ] External CSS versioned and on VPS

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
4. Paste JS and confirmation styles manually into respective fields
5. Configure WordPress widget with correct `propid` and `cssfile` parameter
6. Spot-check on staging

### Verification (Per Property)

**Core:**
- [ ] Correct property name and room types
- [ ] CSS variable overrides apply — brand colors and fonts match
- [ ] Full flow end-to-end on staging (WordPress widget → Beds24 → checkout)
- [ ] No layout breakage from property-specific content differences
- [ ] Dorm rooms bookable (if property has dorms)

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
| CSS rollback desync risk | Rollback could break layouts | Eliminated — inline fields contain only variables + critical CSS |
| CSS push affects all 4 properties | Bad push = multi-site issue | Versioned filenames + git |
| Beds24 frontend updates without warning | All 4 properties break simultaneously | JS safeguards + monthly spot-checks |
| Deep linking to rooms | Marketing links use `roomid` parameter | Same styled page — no tradeoff |
| Date handoff is one-way | Dates changed on Beds24 don't carry back to WordPress | Accepted — Beds24 page is end of journey |
| `bookingcss` field ~18-19K char limit | Saves silently fail above limit | All real CSS in external file; inline field for critical CSS + variables only |
| `custombody`/`customheadconfirm` tag stripping | `<script>`/`<style>` tags stripped on programmatic save | Manual paste required |
| Dorm rooms have hidden quantity input | No visible booking control for dorms | JS injection needed per property with dorms |
| Cloudflare caches external CSS | Stale CSS after updates | Versioned filenames bust cache |
