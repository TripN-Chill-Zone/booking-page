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
- [ ] VPS access (aaPanel file manager) for uploading JS/CSS files
- [ ] WordPress admin access for the property site

---

## Tooling

| Task | Tool |
|---|---|
| CSS/JS authoring | Claude (chat or Claude Code CLI) |
| Content sourcing (read from existing WP sites) | Claude in Chrome |
| Beds24 admin configuration (most fields) | Claude in Chrome |
| Beds24 `customhead` field (external JS loading) | Claude in Chrome — tags NOT stripped |
| Beds24 `custombody`/`customheadconfirm` fields | Manual paste by user — Beds24 strips `<script>`/`<style>` tags on programmatic save |
| WordPress page editing | User (Custom HTML block) |
| VPS file upload | User via aaPanel file manager |
| **File accessibility verification** | **Claude in Chrome — navigate to URL, confirm 200** |
| Photo uploads | Manual |
| Mobile QA | Manual (real iOS device) |

---

## Phase 0.1 — WordPress Widget Parameter Passing Test — COMPLETE

**Status:** FAILED on original Beds24 WordPress plugin (Sessions 4-5). RESOLVED in Session 6 via custom widget.

**Original test:** The Beds24 WordPress plugin embedded the booking page in an iframe. This caused iOS double-scroll issues and provided no control over the booking flow.

**Resolution:** Built a custom self-injecting JS widget (`booking-widget-v{N}.js`) hosted on VPS. The widget:
- Renders a branded date/guest picker on the WordPress page
- On "Search Rooms", loads Beds24 in an iframe with `scrolling="no"` (no double-scroll)
- Uses `referer=widget` URL parameter so the Beds24-side helper knows it's embedded
- Includes `cssfile` parameter for external CSS
- Shows a loading spinner until rooms render (height > 500px via postMessage)

**WordPress deployment:** Custom HTML block on "Book A Room" page:
```html
<div id="tnh-booking-root"></div>
<script src="https://{domain}/booking-widget-v{N}.js"></script>
```

**The Beds24 WordPress plugin is no longer used for the booking page.** It may still be installed on the WordPress site but its iframe embed has been replaced.

**This phase does not need to be repeated for new properties.** Just create a per-property copy of the widget JS with updated CONFIG values.

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

## Phase 3 — CSS and JS Injection (Shared Across Properties) — IN PROGRESS

### CSS Architecture (unchanged from Session 5)

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

**Inline `customheadconfirm` field:**
- Confirmation page styles, wrapped in `<style>` tags
- MUST be pasted manually — Beds24 strips `<style>` tags on programmatic save

**Rollback:** Update `&cssfile=` version reference or `<script src>` version reference. Use versioned filenames.

### JS Architecture (revised Session 6)

**Iframe helper JS (served via `customhead` field):**
- `<script src="https://{domain}/beds24-iframe-helper-v{N}.js"></script>` in `customhead` field
- `customhead` does NOT strip `<script>` tags — preferred injection point for external JS
- Versioned filenames on VPS, same as CSS
- When `referer=widget` AND inside iframe: hides booking strip/headers/footer, reports height via postMessage, sets `form.target="_top"`
- Always (embedded or direct): injects per-room Book buttons, fixes dorm room booking
- Uses single MutationObserver with `isModifying` guard to prevent infinite DOM mutation loops

**Inline `custombody` field (legacy):**
- Contains hide/reveal JS from Session 5 (~2,442 chars)
- LIMIT: ~2,000 characters (field may not accept more)
- MUST be pasted manually — Beds24 strips `<script>` tags on programmatic save
- With the iframe helper in `customhead`, `custombody` content may become redundant for widget-embedded visits. Keep it for direct visits to the booking page URL.

### CSS/JS Update Protocol

1. Create new file with incremented version (e.g., `CSS-base-v3.css` or `beds24-iframe-helper-v14.js`)
2. Upload to VPS via aaPanel
3. **Verify file is accessible** — navigate to URL, confirm 200 response and correct content
4. Update the corresponding reference: `&cssfile=` parameter, Beds24 `customhead` field, or WordPress HTML block
5. Hard refresh to verify (Ctrl+Shift+R)
6. If 404: cached 404 response — use new version number or purge cache

**CRITICAL: Always verify file accessibility (step 3) before debugging anything else. If the file isn't there, all other debugging is pointless.**

Pre-existing failures unrelated to the change do not block the push.

### Design Direction — Hostelworld Model

The booking page should feel like Hostelworld's room listing. This was agreed in Session 5 based on analysis of the live Hostelworld page for the Chill Zone property.

**Booking strip:** Hidden when embedded via widget (our widget handles date/guest selection). On direct visits: Check In + Check Out only. No nights selector, no global guest count.

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
│ [Quantity ▼]  from €XX   [Book →]          │
└─────────────────────────────────────────────┘
```

Mobile: stacks vertically.

**Per-room Book buttons:** Beds24 multi-room mode does NOT create per-room Book buttons. They must be injected by the iframe helper JS into `.b24-multipricebox` of each `.offer` section. Inline with quantity and price, right-aligned.

### Work Order

**CLOSED (Session 5-6):**
1. ~~Room card layout~~ — CSS deployed in CSS-base-v2.css
2. ~~Booking strip styling~~ — CSS deployed; hidden entirely when embedded via widget
3. ~~Hide/reveal rooms~~ — JS in custombody field (legacy); widget handles this for embedded visits
4. ~~External CSS hosting~~ — Working, versioned filenames, Cloudflare cache busting

**IN PROGRESS (Session 6 — partially working, bugs remaining):**
5. **Per-room Book buttons** — Injected by iframe helper JS. Buttons inject correctly when tested manually but timing issue with AJAX room loading means they may not appear. Needs debugging: the MutationObserver with `isModifying` guard may be suppressing re-runs.
6. **Dorm booking mechanism** — Iframe helper unhides guest selector and relabels "Guests" → "Beds". Working but dropdown position is wrong (left-aligned instead of right-aligned matching other rooms). Needs CSS fix on `.b24-multipricebox` in the dorm offer.
7. **Iframe height sync** — Working via postMessage. Do NOT use body height trimming (causes clipping). Just use `scrollHeight` — hidden elements contribute 0.
8. **Form breakout** — `form.target="_top"` working. Checkout takes over full browser tab. Back button returns to WordPress.

**NOT STARTED:**
9. **Confirmation page** — styles via `customheadconfirm` field. Not yet addressed because checkout now happens outside the iframe on a full Beds24 page. May need different approach than originally planned.
10. **"From price" JS injection** — Phase 0.2 confirmed feasible but not implemented. Lower priority now that rooms display correctly.

### Key Findings (Session 6)

- `.multiplebookbutton` elements exist ONLY in the booking strip (2 instances), NOT inside room cards. Per-room buttons must be injected.
- `customhead` field does NOT strip `<script>` tags — use for external JS loading.
- `custombody` field has ~2,000 char limit and DOES strip tags on programmatic save.
- Two MutationObservers on same `document.body` with `subtree:true` cause infinite loops when one modifies the DOM. Use single observer with `isModifying` guard.
- `display:none` elements contribute 0 to `scrollHeight` — subtracting their heights does nothing.
- Setting `body.style.height` to trim excess space causes content clipping and self-referencing measurement loops. Don't do it.
- Cloudflare/LiteSpeed cache 404 responses — if a file URL is hit before upload, the 404 persists. Use versioned filenames.

### Phase 3 Verification

**Core:**
- [ ] Widget renders on WordPress page: date picker, guest selector, Search button
- [ ] Search loads rooms in iframe below widget
- [ ] Room cards: photos visible, descriptions visible
- [ ] Per-room Book button visible on each room card, inline with quantity/price
- [ ] Dorm rooms: guest selector visible, right-aligned, labeled "Beds"
- [ ] Clicking Book breaks out of iframe to full-page Beds24 checkout
- [ ] Back button returns to WordPress page
- [ ] All rooms bookable (including dorms)
- [ ] Complete flow: dates → rooms appear → select room → checkout → back returns to WordPress
- [ ] No excess whitespace below rooms
- [ ] No iOS double-scroll

**Dependent:**
- [ ] CSS variables apply correctly per property
- [ ] No FOUC on Slow 3G
- [ ] Image corners rounded
- [ ] "From price" labels correct (if implemented)
- [ ] No layout breakage at 375px, 390px, 430px viewports
- [ ] External CSS and JS versioned and on VPS
- [ ] Loading spinner visible during room AJAX load, hidden after

**Any core failure must be resolved before Phase 4.**

---

## Phase 4 — Full Mobile QA (Per Property)

Notify client's admin/accounting team before testing — live transactions will appear in payment gateway as charges followed by refunds. Gateway fees on refunds are typically not returned.

### Core Tests

| Test | Pass | Fail |
|---|---|---|
| Full flow from WordPress | WordPress widget → Search → rooms in iframe → select room → Book breaks out to Beds24 checkout → complete booking | Any step broken or unreachable |
| Back button | Returns to WordPress "Book A Room" page with widget ready for new search | Does not return, or returns to wrong page |
| Direct URL with parameters | `checkin`, `numnight`, `numadult` parameters pre-populate correctly; rooms display in iframe | Parameters ignored or rooms do not display |
| Per-room Book buttons | Each room card has a visible Book button inline with quantity/price | Missing buttons or buttons not functional |
| Dorm booking | Dorm room has visible bed selector + Book button, booking completes | Dorm not bookable |
| Live transaction — confirmation page | Real booking, real payment, immediate refund; confirmation page styled with brand | Unstyled or broken confirmation |

**Live transaction cannot be substituted with sandbox or test mode.**

### Dependent Tests

| Test | Pass | Fail |
|---|---|---|
| No double-scroll on iOS | Parent page scrolls, iframe does not scroll independently | Double scroll bars or scroll conflicts |
| Scroll behavior | Normal scrolling throughout, no strip-loading or white bar flashing | Any scroll issue |
| Loading spinner | Shows during room AJAX load, hides when rooms render | Spinner persists forever or never shows |
| Keyboard zoom | No iOS Safari viewport zoom hiding fields | Input hidden behind keyboard |
| Throttled connection | Widget renders immediately; rooms appear within reasonable time on Slow 3G | Widget blank or rooms never load |
| Iframe height | Iframe fits content — no excess whitespace, no clipped rooms | Large gap below rooms or last room cut off |

### Resolution

- All pass → Phase 5
- Dependent failures only → assess individually; accept if non-blocking
- Core failure → diagnose; fix config or CSS/JS and retest; SPA fallback is last resort

---

## Phase 5 — Rollout (Remaining Properties)

External CSS file and iframe helper JS already shared. Per property:

1. Repeat Phase 1 (content extraction)
2. Repeat Phase 2 (admin configuration and content entry)
3. Add property-specific CSS variable block to `bookingcss` field
4. Add iframe helper `<script src>` to `customhead` field (same helper JS for all properties)
5. Create per-property booking widget JS with updated CONFIG (ownerid, propid, brand colors, fonts)
6. Upload widget JS to VPS
7. **Verify file accessible** — navigate to URL, confirm 200
8. Add Custom HTML block to WordPress "Book A Room" page: `<div id="tnh-booking-root"></div>` + `<script src>`
9. Paste legacy hide/reveal JS into `custombody` if needed for direct booking page visits
10. Spot-check on staging

### Verification (Per Property)

**Core:**
- [ ] Correct property name and room types
- [ ] CSS variable overrides apply — brand colors and fonts match
- [ ] Full flow end-to-end: WordPress widget → iframe rooms → Book breaks out → checkout → back returns
- [ ] No layout breakage from property-specific content differences
- [ ] Dorm rooms bookable (if property has dorms)
- [ ] Per-room Book buttons visible and functional

**Dependent:**
- [ ] Room descriptions and features under correct rooms
- [ ] Photos under correct rooms
- [ ] Widget CONFIG values correct (ownerid, propid, cssfile)
- [ ] No iOS double-scroll
- [ ] Mobile spot-check on iOS Safari

### Client Sign-Off (Per Property)

On a real iOS device, staging URL:

1. Enter dates and guests in WordPress widget, click Search Rooms
2. Confirm rooms appear in iframe below widget
3. Select room quantity, click per-room Book button
4. Confirm Beds24 checkout loads as full page (not in iframe)
5. Back button returns to WordPress "Book A Room" page
6. Confirmation page styled (requires Phase 4 live transaction to have passed)

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
| ~~Booking page on Beds24 domain~~ | ~~Guest leaves property site on "Search"~~ | Resolved — rooms now display inline via iframe; checkout is on Beds24 domain but that's acceptable |
| Hide/reveal JS silent failure (legacy custombody) | Rooms could be permanently hidden if Beds24 changes DOM | `MutationObserver` + 10s backstop; only relevant for direct visits |
| Price display before quantity selection | Price only after selection | Phase 0.2 JS test passed; not yet implemented |
| CSS rollback desync risk | Rollback could break layouts | Eliminated — inline fields contain only variables + critical CSS |
| CSS/JS push affects all 4 properties | Bad push = multi-site issue | Versioned filenames + git |
| Beds24 frontend updates without warning | All 4 properties break simultaneously | JS safeguards + monthly spot-checks |
| Deep linking to rooms | Marketing links use `roomid` parameter | Same styled page — no tradeoff |
| `bookingcss` field ~18-19K char limit | Saves silently fail above limit | All real CSS in external file; inline field for critical CSS + variables only |
| `custombody` ~2,000 char limit | Limited space for inline JS | External JS loaded via `customhead` instead |
| `custombody`/`customheadconfirm` tag stripping | `<script>`/`<style>` tags stripped on programmatic save | Use `customhead` for JS; manual paste for `custombody`/`customheadconfirm` |
| `customhead` is the only safe programmatic injection point | Other fields strip tags | Documented — use `customhead` for external script loading |
| Dorm rooms have hidden quantity input | No native booking control | Iframe helper JS unhides guest selector and injects Book button |
| Beds24 multi-room mode has no per-room Book buttons | Only strip-level buttons exist | Iframe helper JS injects buttons into each `.offer .b24-multipricebox` |
| Cloudflare/LiteSpeed cache 404 responses | Stale 404 persists after file upload | Versioned filenames; never request URL before file exists |
| MCP tabs have zero viewport width | `offsetHeight`/`getBoundingClientRect` return 0 | User screenshots are the only reliable visual test |
| Iframe height sync depends on postMessage | If helper JS fails, iframe stays at minimum height | 8-second fallback sets 2400px; loading spinner hides at height > 500px |
| WordPress Custom HTML block fragile | Easy to lose the `<div>` when editing | Always verify both `<div>` and `<script>` tag present after saving |
