# Session 10 Handoff — Beds24 Booking Page

## Date: 2026-04-17

## Summary

Major infrastructure session. Established CI/CD pipeline, fixed mobile layout root causes, iterated on offer bar alignment (hit a complexity wall), conducted adversarial review, and scoped an offer-bar rebuild as the path forward.

## What Was Accomplished

### CI/CD Pipeline (new)
- GitHub Actions auto-deploys `CSS-base.css`, `beds24-iframe-helper.js`, `booking-widget.js` to VPS on push to `main`
- SSH key auth from GitHub to VPS (port 5771)
- Stable filenames — no more versioned files or reference updates
- `Date.now()` bootstrapper in Beds24 `customhead` field and WordPress Custom HTML block — zero cache issues, never needs updating
- Repo: `https://github.com/TripN-Chill-Zone/booking-page` (public)

### Mobile Layout Fixes
- **iOS Safari iframe viewport expansion** — root cause identified and fixed. Bootstrap `.container` fixed widths expanded the iframe beyond phone screen. Fix: `.container{max-width:100%}` injected by helper.
- **Thumbnail specificity** — Bootstrap reset was overriding slider width. Fixed by bumping component selectors to 3-class specificity.
- **Card padding** — increased to 12px/16px on mobile for breathing room.
- **Side margins** — added 12px padding on room container for mobile.
- **"Up" button** — hidden via `a[href="#topofthebookingpage"]` CSS rule.

### Room Content (Beds24 admin)
- All 4 room descriptions updated to approved short versions from session 9 handoff.
- Double Room title changed to "Double Room with Shared Bathroom".
- Room order set to "Cheapest First" in Beds24 admin (didn't take effect — JS sorting handles it instead).

### Room Sorting (new)
- `sortRooms()` function reads prices from DOM at runtime.
- Available rooms sorted cheapest first, unavailable pushed to bottom.
- Uses DOM reordering on `.b24room` elements (not CSS order — Beds24 puts all rooms in one wrapper).
- Known issue: `tnhSorted` marker doesn't reset on AJAX re-render (low priority since widget reloads iframe entirely).

### Offer Bar (current state — to be rebuilt)
- Multiple CSS iterations failed to reliably align Book button right across all states and browsers.
- `tnh-offer-row` wrapper was added as a structural fix but still doesn't work consistently on mobile.
- Price display logic: "from" price should always be visible, total only after qty selection — partially working.
- **Decision: rebuild the offer bar with our own markup** (see plan below).

### Adversarial Review
- Full card rebuild was proposed, reviewed, and scoped down to offer-bar-only.
- Event listener audit: qty select has 2 direct jQuery change handlers, preserved on DOM move (verified).
- Panel-body hide experiment: `display:none` doesn't break form submission (verified).
- Review document: `docs/card-rebuild-proposal-review.md`

## Current File Versions on VPS
- `CSS-base.css` — stable filename, deployed via CI/CD
- `beds24-iframe-helper.js` — stable filename, deployed via CI/CD
- `booking-widget.js` — stable filename, deployed via CI/CD

## Current Beds24 Admin State
- **"Insert in HTML <HEAD> bottom"**: `Date.now()` bootstrapper loading `beds24-iframe-helper.js`
- **"Custom CSS" (bookingcss)**: critical CSS + variable overrides (unchanged from session 9)
- **"Insert in HTML <HEAD> top"**: Google Fonts link tag (unchanged)
- **Room Order**: "Cheapest First" (but doesn't take effect — JS sorting overrides)
- **Multiple Room Booking**: Enabled

## Current WordPress State
- Custom HTML block: `Date.now()` bootstrapper loading `booking-widget.js`

## NEXT SESSION: Offer Bar Rebuild

### Documents to provide
1. `docs/offer-bar-rebuild-plan.md` — the implementation plan (14 steps with acceptance criteria)
2. `docs/card-rebuild-proposal-review.md` — adversarial review with rationale
3. `docs/card-rebuild-proposal.md` — background context
4. Standard project docs from repo (execution plan, context, DOM structure, gotchas, CSS architecture, admin guide)
5. Current source files from repo root

### Key facts for the implementing session
- **Check A answer: A1.** Widget reloads the iframe entirely on every search. No in-iframe date changes possible. Skip Check B.
- **Event listeners survive moves.** jQuery stores handlers via expando on the element. Verified experimentally.
- **Move `.b24-multipricebox` as a whole unit**, not the bare `<select>`. Preserves `.closest()` traversals.
- **Fail loud.** This is a dev site with no external audience. Let things break visibly.
- **Design target: Hostelworld-dense.** Don't over-space. The mockup v13 density is correct.

### Success criteria
- Offer bar alignment consistent across all 4 rooms and all 3 states
- CSS under 390 lines, helper under 500 lines, `!important` count under 30
- No regressions in sorting, tags, dorm booking, iframe height sync, checkout
- Mobile layout matches mockup v13 without hacks

## Deferred Issues (not for next session)

### Confirmation/Checkout Page
- Multi-room booking: customer info fields cut off by large room images
- Orange back button causes Beds24 date/booking strip to reappear
- Back button behavior inconsistent (sometimes freezes, sometimes loads with Beds24 chrome)

### Load Time
- 10-second load time on mobile — may improve with offer bar rebuild reducing observer churn
- Investigate if the `Date.now()` bootstrapper adds latency vs. static script tag

### Documentation Outdated
- `SKILL.md` describes non-iframe architecture ("NOT embedded in an iframe") — needs updating for iframe model
- `SKILL.md` guest flow, CSS architecture sections, and setup checklist don't reflect widget/iframe/CI-CD workflow
- `dom-structure.md` doesn't document the `#selectors1-{roomId}` wrapper or the all-rooms-in-one-wrapper AJAX behavior
- `css-architecture.md` doesn't reflect stable filenames or `Date.now()` cache busting
- `gotchas.md` needs iOS Safari iframe viewport expansion entry
- `gotchas.md` needs entry about jQuery expando event preservation on DOM moves
- `session-handoff-9.md` is now superseded by this document

## GitHub Repo
- URL: `https://github.com/TripN-Chill-Zone/booking-page`
- Public (changed this session)
- CI/CD: `.github/workflows/deploy.yml`
- Deploy secrets: `VPS_HOST`, `VPS_PORT`, `VPS_PATH`, `VPS_SSH_KEY`
