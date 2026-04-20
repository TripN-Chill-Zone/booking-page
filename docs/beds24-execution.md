# Beds24 Booking Page — Execution Plan

Phase-by-phase plan for building and rolling out the booking page 
architecture. This document is the source of truth for what work 
happens and in what order. For architectural rationale, see 
`beds24-execution-context.md`. For per-session operational details, 
see the current session handoff.

## Conventions

- American spelling throughout
- No time estimates
- Use Beds24 admin field names ("Insert in HTML <HEAD> bottom") not 
  internal IDs (`customhead`)
- Every phase ends in verification before the next phase starts
- Core test failures block progression; dependent test failures are 
  assessed individually

---

## Pre-flight checklist (per property)

- [ ] Beds24 admin login credentials
- [ ] Staging URL for the property's Beds24 booking page (do not work 
  on production)
- [ ] Existing WordPress property page URL (source for content 
  extraction, if content is being adapted from there)
- [ ] Brand colors and fonts confirmed
- [ ] Photos prepared and ready for manual upload
- [ ] Property name, room types, and room counts confirmed
- [ ] GitHub repo access (`https://github.com/TripN-Chill-Zone/booking-page`)
- [ ] WordPress admin access for the property site

---

## Tooling

| Task | Tool |
|---|---|
| CSS/JS authoring and deployment | Claude Code |
| Content sourcing (reading existing WP sites) | Claude in Chrome |
| Beds24 admin configuration (most fields) | Claude in Chrome |
| Beds24 "Insert in HTML <HEAD> bottom" | Claude in Chrome (tags NOT stripped) |
| Beds24 "Insert in HTML <BODY> bottom" / confirmation page fields | Manual paste by user (tags stripped on programmatic save) |
| WordPress page editing | User (guided) |
| Deployment verification | Claude in Chrome (navigate to URL, confirm 200) |
| Photo uploads | Manual |
| Mobile QA | Manual on real iOS device |

---

## Phase 1 — Architecture feasibility (one-time, CLOSED)

These were one-time feasibility gates for the project as a whole. 
All completed during Sessions 4-6. They do not repeat per property.

### 1.1 WordPress widget vs Beds24 plugin — RESOLVED

The Beds24 WordPress plugin's iframe embed was rejected (iOS 
double-scroll, no control over booking flow). Replaced with a custom 
self-injecting JS widget (`booking-widget.js`) that renders a 
date/guest picker and loads the booking page in a controlled iframe.

### 1.2 Iframe strategy — RESOLVED

Three options evaluated:
- New tab: rejected (not inline)
- Full iframe through checkout: rejected (scroll, height sync, 
  usability issues)
- Iframe for display, `form.target="_top"` breakout for checkout: 
  ADOPTED

### 1.3 Price injection feasibility — TESTED, NOT IMPLEMENTED

Tests passed (prices accurate across dates, occupancy, currency). 
Implementation deferred because rooms display correctly without it 
and Phase 5 work proved higher-priority.

See `beds24-execution-context.md` for full rationale.

---

## Phase 2 — Content extraction (per property)

Extract from the existing WordPress property site (or from the 
property owner directly):

- Property description (adapted for booking page context)
- Room names, types, and descriptions
- Key features per room (become `tags` in the config)
- Brand colors (hex values)
- Font family (Google Fonts name)
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

See also `docs/skill/rollout-checklist.md` Phase 0 for the full 
intake worksheet.

---

## Phase 3 — Beds24 admin configuration (per property)

All steps on staging URL. Do not work on production.

### 3.1 Layout and template

- [ ] Layout set to 6
- [ ] Template set to 6
- [ ] Multiple Room Booking set to "Enabled" 
  (`bookpageallowmulti = 1`)
- [ ] Room Features module (106) added to Room Bottom section 
  (manual in Beds24 admin UI)
- [ ] Module arrangement: Property Calendar at Property level; 
  Offer Select + Price Table at Offer level; Features + Picture 
  Slider + Description at Room level

### 3.2 Style panel

Set brand colors across the 20 color pickers. See 
`rollout-checklist.md` Phase 1.2 for field-by-field assignment.

- [ ] Body Background
- [ ] Content Background / Text
- [ ] Link Color
- [ ] Border Color
- [ ] Button Style (flat), Button Background, Button Text
- [ ] Font size (font family loads via Google Fonts in customheadtop)

### 3.3 Google Fonts

- [ ] Font `<link>` tag added to "Insert in HTML <HEAD> top" field
- [ ] Font-family override in "Custom CSS" field (`.colorbody` + 
  heading selectors)

### 3.4 Content entry

- [ ] Property description
- [ ] Room descriptions (per room)
- [ ] Room features (per room in PROPERTIES > ROOMS > SET UP)
- [ ] General policy and cancellation policy
- [ ] Photos uploaded and assigned to correct rooms

### Verification

**Core:**
- [ ] Booking page loads on staging with correct property name
- [ ] All room types appear — correct count, correct names
- [ ] Multiple Booking enabled (confirm by selecting more than one 
  room)
- [ ] Date selection updates room availability
- [ ] Booking can be initiated end-to-end on staging

**Dependent:**
- [ ] Style panel values reflected
- [ ] Google Font loads correctly
- [ ] Room descriptions under correct rooms
- [ ] Room features under correct rooms
- [ ] Policies in correct location
- [ ] Photos under correct rooms

**Any core failure must be resolved before Phase 4.**

---

## Phase 4 — CSS and JS (shared across properties)

The CSS and JS layer is shared across all properties. Per-property 
data comes from config objects (`TNH_CONFIG` for helper, 
`TNH_WIDGET_CONFIG` for widget) set in each property's admin fields.

### 4.1 CSS architecture

**External `CSS-base.css`:**
- All structural rules, aesthetics, layout, responsive design
- Single shared file, no per-property variants
- No character limit
- Served via `&cssfile=` URL parameter
- Hosted at `https://astrongpresence.com/CSS-base.css`

**Inline "Custom CSS" field (per property):**
- Critical CSS payload for FOUC prevention
- Per-property CSS variable overrides (brand colors, fonts)
- HARD LIMIT: ~18-19K characters (silent save failures above this)
- Keep under 2K characters
- Template in `docs/skill/css-architecture.md`

### 4.2 JS architecture

**Iframe helper (`beds24-iframe-helper.js`):**
- Shared across all properties (no per-property variants)
- Loaded via "Insert in HTML <HEAD> bottom" field
- Reads per-property data from `window.TNH_CONFIG`
- Halts with console error if config missing or invalid
- See `docs/skill/helper-js-architecture.md` for section inventory

**Booking widget (`booking-widget.js`):**
- Shared across all properties (no per-property variants)
- Loaded via WordPress Custom HTML block
- Reads per-property data from `window.TNH_WIDGET_CONFIG`
- Halts with console error if config missing or invalid
- Widget max-width: 1290px (matches Kadence content width)

**Config objects:**
- `TNH_CONFIG`: room IDs, tags, isDorm flags. Set in Beds24 
  "Insert in HTML <HEAD> bottom" before the helper bootstrapper
- `TNH_WIDGET_CONFIG`: owner ID, property ID, brand colors, fonts. 
  Set in WordPress Custom HTML block before the widget bootstrapper
- Schema v1 documented in `docs/skill/property-config.md`

### 4.3 Deployment protocol

1. Edit file in Claude Code
2. Push to `main`
3. GitHub Actions auto-deploys `CSS-base.css`, `beds24-iframe-helper.js`, 
   `booking-widget.js` to VPS (~15 seconds)
4. Verify file accessibility — navigate to URL, confirm 200 response 
   and correct content
5. Hard refresh on booking page (Ctrl+Shift+R)

**Verify file accessibility before debugging anything else.** If 
the file isn't serving, all other debugging is wasted.

### 4.4 Design direction

The booking page matches Hostelworld-style density. See 
`docs/mockup.html` for the design source of truth. See 
`docs/skill/SKILL.md` §2 for breakpoint strategy.

**Key rendering facts:**
- Widget max-width (1290px) is the only knob controlling iframe width
- iframe width = min(viewport, 1290) - 2px
- Beds24's mobile CSS fires at iframe width ≤767px
- iPhone portrait gets mobile; iPhone landscape and wider get desktop

### 4.5 Current status

Phase 4 is IN PROGRESS as of Session 11.

**Shipped:**
- Base CSS architecture
- Helper JS Sections 1, 5, 7, 8 (chrome hiding, date strip overrides, 
  card enhancement, room sorting)
- Widget JS with date/guest picker, iframe loading, form breakout

**Pending (v3 — see session-handoff-11.md):**
- Port mockup v13 CSS to `CSS-base.css` with `#selectors1-` fix
- Revert helper JS to pre-rebuild state (`git show 420dd06`)
- Externalize helper config via `TNH_CONFIG`
- Widen widget max-width to 1290px
- Externalize widget config via `TNH_WIDGET_CONFIG`

**Not yet addressed:**
- Confirmation page styling (requires manual paste of 
  `customheadconfirm` per property; scope TBD)
- Production cache-busting (replace `Date.now()` before real-customer 
  launch)

### Verification

**Core:**
- [ ] Widget renders on WordPress page: date picker, guest selector, 
  Search button
- [ ] Search loads rooms in iframe below widget
- [ ] Room cards: photos visible, descriptions visible, tags visible
- [ ] Per-room Book button on each room card
- [ ] Dorm rooms: Bed selector visible, right-aligned, labeled "Beds"
- [ ] Clicking Book breaks out of iframe to full-page Beds24 checkout
- [ ] Back button returns to WordPress page
- [ ] All rooms bookable (including dorms)
- [ ] Helper halts with console error if `TNH_CONFIG` missing
- [ ] Widget halts with console error if `TNH_WIDGET_CONFIG` missing

**Dependent:**
- [ ] CSS variables apply correctly per property
- [ ] No FOUC on throttled connection
- [ ] No layout breakage at iframe widths 388px, 698px, 1024px, 1288px
- [ ] Loading spinner visible during room AJAX load, hidden after
- [ ] No excess whitespace below rooms
- [ ] No iOS double-scroll

**Any core failure must be resolved before Phase 5.**

---

## Phase 5 — Full mobile QA (per property)

Notify the property's admin/accounting team before testing — live 
transactions appear in the payment gateway as charges followed by 
refunds. Gateway fees on refunds are typically not returned.

### Core tests

| Test | Pass | Fail |
|---|---|---|
| Full flow from WordPress | WordPress widget → Search → rooms in iframe → select room → Book breaks out to Beds24 checkout → complete booking | Any step broken or unreachable |
| Back button | Returns to WordPress "Book A Room" page with widget ready for new search | Does not return, or returns to wrong page |
| Direct URL with parameters | `checkin`, `numnight`, `numadult` parameters pre-populate correctly; rooms display in iframe | Parameters ignored or rooms do not display |
| Per-room Book buttons | Each room card has a visible Book button inline with quantity/price | Missing buttons or buttons not functional |
| Dorm booking | Dorm room has visible Bed selector + Book button; booking completes | Dorm not bookable |
| Live transaction — confirmation page | Real booking, real payment, immediate refund; confirmation page styled with brand | Unstyled or broken confirmation |

**Live transaction cannot be substituted with sandbox or test mode.**

### Dependent tests

| Test | Pass | Fail |
|---|---|---|
| No double-scroll on iOS | Parent page scrolls, iframe does not scroll independently | Double scroll bars or scroll conflicts |
| Scroll behavior | Normal scrolling throughout | Any scroll issue |
| Loading spinner | Shows during room AJAX load, hides when rooms render | Spinner persists forever or never shows |
| Keyboard zoom | No iOS Safari viewport zoom hiding fields | Input hidden behind keyboard |
| Throttled connection | Widget renders immediately; rooms appear within reasonable time | Widget blank or rooms never load |
| Iframe height | Iframe fits content with no excess whitespace or clipped rooms | Large gap below rooms or last room cut off |

### Resolution

- All pass → Phase 6
- Dependent failures only → assess individually; accept if non-blocking
- Core failure → diagnose; fix config, CSS, or JS and retest

---

## Phase 6 — Rollout (remaining properties)

The shared CSS/JS is already deployed. Rolling out to a new property 
requires only per-property config and admin setup.

**Full per-property rollout steps: see `docs/skill/rollout-checklist.md`.** 
That document is the operational checklist. This phase documents 
rollout as a project phase, not the step-by-step procedure.

### Per-property deliverables

For each property added:

1. Phase 2 (content extraction)
2. Phase 3 (Beds24 admin configuration)
3. Add `TNH_CONFIG` object to "Insert in HTML <HEAD> bottom" before 
   the helper bootstrapper
4. Add `TNH_WIDGET_CONFIG` object to WordPress Custom HTML block 
   before the widget bootstrapper
5. Add per-property CSS variable override block to "Custom CSS" 
   field
6. Phase 5 (mobile QA on real iOS device)
7. Client sign-off
8. Push to production

### Client sign-off (per property)

On a real iOS device, staging URL:

1. Enter dates and guests in widget, click Search Rooms
2. Confirm rooms appear in iframe
3. Select room quantity, click per-room Book button
4. Confirm Beds24 checkout loads as full page
5. Back button returns to WordPress
6. Confirmation page styled (requires Phase 5 live transaction)

**Post-sign-off issues are new requests, not defects. Push to 
production only after sign-off.**

---

## Post-launch maintenance

### Monitoring

- Monthly visual spot-check per property: booking strip, room cards, 
  price display, confirmation page
- Monitor Beds24 changelog and community forum for frontend updates

### If Beds24 breaks styling or JS

1. Confirm breakage on Beds24's side (load without `cssfile` parameter)
2. Diagnose using the diagnostic pattern from 
   `docs/retrospective.md`: apply mockup to live page, measure, fix 
   smallest gap
3. Deploy fix via the standard protocol (Phase 4.3)
4. If multiple properties affected: fix once in shared code, deploys 
   automatically

### This architecture requires a developer to maintain

DOM-targeted CSS and JS will break when Beds24 updates their 
frontend. The property owner must have access to a developer 
post-launch. This is a hard constraint, not a suggestion.

---

## Known limitations

| Limitation | Impact | Status |
|---|---|---|
| No per-night price in Price Table (multiple booking enabled) | Price shows after quantity selection | Accepted |
| Photo uploads not automated | Manual upload per property | Accepted |
| Hybrid iframe + breakout architecture | Checkout is on Beds24 domain | Accepted — acceptable tradeoff for inline room display |
| Price display before quantity selection | Price only shown after selection | Phase 1.3 feasibility passed; not yet implemented |
| CSS/JS push affects all properties | Bad push = multi-site issue | Mitigation: git version control, GitHub Actions staged deployment |
| Beds24 frontend updates without warning | All properties break simultaneously | MutationObserver safeguards + monthly spot-checks |
| Deep linking to rooms | Marketing links use `roomid` parameter | Same styled page — no tradeoff |
| "Custom CSS" field ~18-19K char limit | Saves silently fail above limit | All real CSS in external file; inline for variables only |
| "Insert in HTML <BODY> bottom" ~2K char limit | Limited space for inline JS | External JS loaded via "Insert in HTML <HEAD> bottom" instead |
| Tag stripping on programmatic save | `<script>`/`<style>` tags stripped in `custombody`/`customheadconfirm` | Manual paste for those fields |
| Dorm rooms have hidden qty input | No native booking control | Helper JS moves guest selector, injects Book button |
| Multi-room mode has no per-room Book buttons | Only strip-level buttons exist | Helper JS injects per-room buttons |
| Cloudflare/LiteSpeed cache 404 | Stale 404 persists after file upload | Use versioned filenames or query params |
| MCP tabs have zero viewport width | Layout tests unreliable via automation | User screenshots for visual verification |
| WordPress Custom HTML block fragile | Easy to lose the `<div>` when editing | Verify both `<div>` and `<script>` present after saving |
| Widget max-width is code, not config | Theme-variant rollout needs code change | Accepted for now; future: add to `TNH_WIDGET_CONFIG` |
| `Date.now()` cache-busting defeats CDN | Production cost/performance impact | Deferred; replace before real-customer launch |

---

## Changelog

- **Session 11:** Restructured phases to reflect shared-code 
  architecture. Renumbered (old Phase 0.1/0.2/0.3 consolidated into 
  Phase 1; old Phase 1 content extraction is now Phase 2; etc.). 
  Added externalization decisions (`TNH_CONFIG`, `TNH_WIDGET_CONFIG`). 
  Widget max-width updated from 700 to 1290. Pointer to 
  rollout-checklist.md added for Phase 6 procedural detail.
- **Session 10:** Deployment model changed to GitHub Actions CI/CD 
  with stable filenames.
- **Session 6:** Hybrid iframe + breakout architecture adopted. 
  Helper JS moved to external file.
- **Session 5:** CSS moved to external file after inline char limit 
  discovered.
