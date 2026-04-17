# Beds24 Booking Page Project

## Reference Documents

### Current state (read these first)
- Session 10 handoff: `docs/session-handoff-10.md`
- Offer bar rebuild plan (next task): `docs/offer-bar-rebuild-plan.md`
- Adversarial review: `docs/card-rebuild-proposal-review.md`

### Architecture & process
- Execution plan: `docs/beds24-execution.md`
- Architecture decisions: `docs/beds24-execution-context.md`
- Approved mockup: `docs/mockup.html` (v13)

### Technical reference
- DOM structure: `docs/skill/dom-structure.md`
- CSS architecture: `docs/skill/css-architecture.md`
- Admin guide: `docs/skill/admin-guide.md`
- Gotchas: `docs/skill/gotchas.md`
- Skill guide: `docs/skill/SKILL.md`

## Current Status

- Phase 2 (admin configuration) — COMPLETE
- Phase 3 (CSS/JS authoring) — IN PROGRESS
  - Room card layout: working (photo, desc, tags, heading all correct)
  - Offer bar: BROKEN — rebuild planned (see `docs/offer-bar-rebuild-plan.md`)
  - Room descriptions: updated to short versions (done Session 10)
  - Room sorting: working (cheapest first, unavailable at bottom)
  - CI/CD pipeline: working (GitHub Actions auto-deploy)
  - Remaining: offer bar rebuild, checkout page styling, confirmation page, accessibility
- Phase 4 (mobile QA) — NOT STARTED

## Project Conventions

- American spelling throughout
- No time estimates
- Use Beds24 admin field names when communicating with user
- Design target: Hostelworld-like density (not minimalist)
- Fail loud during dev — no graceful degradation fallbacks

## Deployment

### CI/CD Pipeline
- **Repo:** `https://github.com/TripN-Chill-Zone/booking-page` (public)
- **Deploy:** Push to `main` -> GitHub Actions SSHes to VPS -> deploys 3 files
- **Files:** `CSS-base.css`, `beds24-iframe-helper.js`, `booking-widget.js` (stable filenames)
- **Target:** `/www/wwwroot/astrongpresence.com/`
- **VPS SSH:** port 5771, ed25519 key auth
- **Cache busting:** `Date.now()` bootstrappers in Beds24 customhead and WordPress block — no manual cache management needed

### Currently live
- External CSS: `https://astrongpresence.com/CSS-base.css`
- Iframe helper: `https://astrongpresence.com/beds24-iframe-helper.js`
- Booking widget: `https://astrongpresence.com/booking-widget.js`

### Beds24 admin fields
- "Insert in HTML <HEAD> top": Google Fonts `<link>` for Lexend + Lexend Giga
- "Insert in HTML <HEAD> bottom": `Date.now()` bootstrapper loading `beds24-iframe-helper.js`
- "Custom CSS": Critical CSS payload + Chill Zone variable overrides
- "Insert in HTML <BODY> bottom": Empty

### WordPress
```html
<div id="tnh-booking-root"></div>
<script>var s=document.createElement('script');s.src='https://astrongpresence.com/booking-widget.js?v='+Date.now();document.head.appendChild(s);</script>
```

## Helper JS Sections

1. **Hide chrome + height sync** (widget iframe only) + iOS viewport clamp
2. *(removed — checkout stays in iframe)*
3. **Dorm booking fix** (move guest selector, relabel Guests->Beds, hide orphan box)
4. **Book buttons** — wrapped in `.tnh-offer-row` with `.tnh-total-price` + button
5. **Date strip overrides** (green stay, red unavailable, non-clickable, hide header)
6. **Price UX** — from-price always visible, total only after qty selection
7. **Room card enhancement** — `.tnh-desc-text` class, dual tag injection, qty placeholder "-"
8. **Room sorting** — cheapest first, unavailable at bottom, DOM reordering

**Sections 3, 4, 6 will be replaced by offer-bar rebuild** (see `docs/offer-bar-rebuild-plan.md`).

## Room Descriptions (updated in Beds24 admin, Session 10)

- **Suite (567218)**: "Spacious premium suite with a huge king-sized bed, ensuite bathroom and panoramic city views. Perfect for extended stays."
- **Single (567220)**: "Ideal room for solo travelers who value privacy and the social atmosphere of a co-living space. A quiet, private room to call your own."
- **Double (567221)**: "Private double room for couples or friends. All the comfort and privacy you need, with full access to our shared spaces."
- **Dorm (567219)**: "A comfortable bed in a modern 4-person dorm. Great value with a social atmosphere -- meet fellow travelers without breaking the bank."

## Room Tags
```
567218 (Suite): Sleeps 2, Ensuite, City View, Work Desk, Premium
567220 (Single): Sleeps 1, Shared Bathroom, Work Desk, Private
567221 (Double): Sleeps 2, Shared Bathroom, Work Desk, Private
567219 (Dorm): 1 Bed, 4-Bed Dorm, Power Outlet, Reading Light
```

## Beds24 Property
- Property ID: 271142
- Owner ID: 141266
- Room IDs: Deluxe King Suite (567218), Single Bed Dorm (567219), Single Room (567220), Double Room with Shared Bathroom (567221)
- Booking page URL: `https://www.beds24.com/booking2.php?ownerid=141266&propid=271142`
- With CSS: append `&cssfile=https://astrongpresence.com/CSS-base.css`

## Critical DOM Knowledge

- `#b24scroller` is the BOOKING STRIP, not the room container. Room container is `.b24fullcontainer-rooms`.
- Beds24 loads ALL rooms via AJAX into a single `#ajaxroomoffer` wrapper — other wrappers are empty.
- `div#selectors1-{roomId}` wrapper exists between `.multiroomshow` and `.b24-multipricebox` (not in mockup).
- Dorm room (567219) renders hidden input instead of qty dropdown. Helper handles this.
- Dorm has two visible `.b24-multipricebox` containers. Helper moves guest selector and hides orphan.
- Qty select has 2 direct jQuery change handlers. They survive DOM moves (jQuery expando). Move, never clone.
- `.b24-multipricebox.hidden` must be explicitly hidden with `display: none !important`.
- Bootstrap `.container` fixed widths expand iOS Safari iframes — clamp with `max-width:100%`.
- Date strip cells are clickable — block with `pointer-events: none`.
- Beds24 "Custom CSS" field silently rejects saves above ~18-19K chars.
- "Insert in HTML <BODY> bottom" strips `<script>`/`<style>` tags when saved programmatically.
