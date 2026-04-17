# Beds24 Room Card Rebuild — Proposal for Adversarial Review

## Project Context

We're building a custom booking page for a hostel chain (Trip'N'Hostel) using Beds24's booking engine. Beds24 is a property management system that generates booking pages at `beds24.com/booking2.php`. We have no control over the HTML it generates — we can only inject CSS via a `&cssfile=` URL parameter and JS via the admin panel's "Insert in HTML <HEAD> bottom" field.

The booking page is embedded in an iframe on the client's WordPress site via a custom widget. The widget handles date/guest selection, the iframe displays rooms, and checkout breaks out of the iframe to a full Beds24 page.

**Architecture docs:** [beds24-execution-context.md](https://github.com/TripN-Chill-Zone/booking-page/blob/main/docs/beds24-execution-context.md)  
**Execution plan:** [beds24-execution.md](https://github.com/TripN-Chill-Zone/booking-page/blob/main/docs/beds24-execution.md)  
**DOM structure reference:** [dom-structure.md](https://github.com/TripN-Chill-Zone/booking-page/blob/main/docs/skill/dom-structure.md)  
**Known gotchas:** [gotchas.md](https://github.com/TripN-Chill-Zone/booking-page/blob/main/docs/skill/gotchas.md)  
**Approved mockup (v13):** [mockup.html](https://github.com/TripN-Chill-Zone/booking-page/blob/main/docs/mockup.html)  
**Current CSS:** [CSS-base.css](https://github.com/TripN-Chill-Zone/booking-page/blob/main/CSS-base.css)  
**Current helper JS:** [beds24-iframe-helper.js](https://github.com/TripN-Chill-Zone/booking-page/blob/main/beds24-iframe-helper.js)  
**Current widget JS:** [booking-widget.js](https://github.com/TripN-Chill-Zone/booking-page/blob/main/booking-widget.js)

---

## What We've Built So Far (Sessions 1-10)

### Architecture
- **Custom WordPress widget** (`booking-widget.js`): self-injecting JS that renders a date/guest picker on the WordPress page, loads Beds24 in an iframe with `referer=widget` parameter, manages height sync via `postMessage`, shows loading spinner.
- **Beds24 iframe helper** (`beds24-iframe-helper.js`): loaded via `<script>` bootstrapper in Beds24's `customhead` field. When it detects `referer=widget` + iframe context, it hides Beds24's booking strip/headers/footer, reports page height to the parent widget, and injects per-room Book buttons (Beds24's multi-room mode doesn't create per-room buttons natively).
- **External CSS** (`CSS-base.css`): loaded via Beds24's `&cssfile=` parameter. Contains all layout and styling rules.
- **CI/CD pipeline**: GitHub Actions deploys CSS/JS to VPS on push to `main`. `Date.now()` bootstrapper in Beds24's admin field eliminates caching issues. Stable filenames mean no admin/WordPress updates needed for deployments.

### What Works
- Widget → iframe → room display → checkout breakout flow
- Height sync between iframe and parent page
- Dorm room booking fix (hidden qty input → visible guest selector + Book button)
- Room sorting by price (cheapest first, unavailable at bottom) via DOM reordering
- Tag badges injected per room (hardcoded room ID → tag mapping)
- Description text styling (`.tnh-desc-text` class added by helper)
- Date strip hidden, carousel controls hidden, fakelinks hidden
- iOS Safari viewport fix (`.container{max-width:100%}` prevents iframe expansion)
- Unavailable room detection (skip Book button injection, show warning)

### What We've Been Fighting (the Problem)

The room card layout has been the primary source of bugs across Sessions 9-10. The approved mockup shows a compact card:

```
┌──────────┬──────────────────────────────────────────┐
│  Photo   │ Description text                         │
│  90x68   │                                          │
├──────────┴──────────────────────────────────────────┤
│ 🛏 Sleeps 2 · 🚿 Ensuite · 💼 Work Desk             │
├─────────────────────────────────────────────────────┤
│ from €45.00 / night                                 │
│ Select [- ▼]                    €90.00  [Book]      │
└─────────────────────────────────────────────────────┘
```

To achieve this, we've been:

1. **Resetting Bootstrap's grid** (`.b24panel-room .b24panel [class*="col-"] { width:auto; float:none; padding:0 }`) — this fights Beds24's `col-xs-12 col-sm-6` classes on every module. Required `!important` on everything. Created a specificity war where the reset's `max-width:100%` overrode our thumbnail's `max-width:120px`, breaking mobile layout.

2. **Using CSS Grid with `:has()` selectors** for desktop layout (`.row:has(.b24-room-slider)` → grid column 1, `.row:has(.b24-room-desc)` → grid column 2). Works on desktop but adds complexity.

3. **Using CSS `order` + negative margins** for mobile layout — reordering flex children to get `slider → desc → tags → offer` from a DOM order of `offer → slider → clearfix → desc → clearfix → mobile-tags`. The negative margin trick (`margin-top: -78px; margin-left: 100px`) positions the description beside the thumbnail.

4. **Fighting Beds24's hidden class behavior** — Beds24 adds `.hidden` to the from-price div when qty is selected. Our CSS was hiding it (following Beds24's intent) then trying to show the total price in its place. This caused the offer bar to shrink/reflow, breaking alignment.

5. **Fighting flex-wrap for the offer bar** — the offer bar contains `form-inline` (Select + dropdown), `from-price` div, and our injected `book-group` (total + Book button). On mobile we need these on two lines. We tried `flex-wrap` with `order` values and `flex-basis:100%` on the from-price to force a line break, then `margin-left:auto` on book-group for right-alignment. This never worked reliably — the book-group shifts left after qty selection.

6. **Injecting a wrapper div** (`.tnh-offer-row`) around `form-inline` and `book-group` to create an explicit flex row. This is the current approach — it adds JS complexity to solve a CSS problem.

7. **Hiding/showing Beds24's native elements selectively** — we hide the date strip, carousel controls, fakelinks, per-occupancy prices, guest count selectors, features module (106), "Up" button, offer name, etc. Each hidden element is a potential future breakage point if Beds24 changes class names.

### Core Issue

We're spending most of our time fighting Beds24's DOM structure rather than building features. Every CSS fix creates a new specificity issue. Every JS injection needs to account for Beds24's AJAX rendering timing, MutationObserver interactions, and class toggling behavior. The mockup was approved in Session 9, but Session 10 has been almost entirely spent trying to make the live DOM match it.

---

## Approaches Tried and Their Outcomes

### 1. CSS-Only Styling (Sessions 5-7)
**Approach:** External CSS file targets Beds24's native elements with `!important` overrides.  
**Outcome:** Works for simple styling (colors, fonts, borders, shadows). Fails for layout because Bootstrap's grid, Beds24's inline styles, and the Style panel's generated CSS all compete at similar specificity. Every layout rule needs `!important` and specific selectors.  
**Status:** Partially retained — brand colors, fonts, and simple styling still use this approach.

### 2. CSS Grid with `:has()` Selectors (Session 9)
**Approach:** Desktop layout uses CSS Grid on the panel body, with `:has()` selectors to identify which `.row` contains the slider vs description.  
**Outcome:** Works on desktop. But the grid→flex switch for mobile requires `order` properties on all children, and the DOM order doesn't match the visual order. Negative margins are fragile.  
**Status:** Currently in production, works but fragile.

### 3. Flex-Wrap for Offer Bar (Sessions 9-10)
**Approach:** Use `flex-wrap` on the multipricebox so the from-price takes a full line and the select+book share the second line.  
**Outcome:** Failed repeatedly. `flex-wrap` line breaks are unpredictable when Beds24 toggles `.hidden` on the from-price. `margin-left:auto` on book-group doesn't work when the parent width collapses. Tried `justify-content: space-between`, `flex-end`, `flex-basis:100%` — none worked reliably on mobile.  
**Status:** Rejected.

### 4. Explicit Wrapper Div (Session 10, current)
**Approach:** JS creates `.tnh-offer-row` div, moves `form-inline` and `book-group` into it.  
**Outcome:** Not yet confirmed working. Adds JS complexity. Still fights Beds24's `.hidden` class toggling on the from-price.  
**Status:** Latest deployment, untested.

### 5. CSS `order` for Room Sorting (Session 10)
**Approach:** Use CSS `order` on room wrapper divs to sort by price.  
**Outcome:** Failed — Beds24 loads all rooms into a single wrapper div via AJAX, so CSS `order` on the per-room wrapper divs has no effect (they're empty).  
**Status:** Rejected. Replaced with DOM reordering.

### 6. DOM Reordering for Room Sorting (Session 10)
**Approach:** `appendChild()` to move `.b24room` elements within their shared parent, sorted by price.  
**Outcome:** Works. Sorts once on load (guarded by `tnhSorted` flag). No event listener breakage observed.  
**Status:** In production, working.

---

## Proposed Approach: Full Card Rebuild

### Concept

Instead of styling and rearranging Beds24's native DOM elements, **hide the entire card body and replace it with our own HTML structure.** Extract data from Beds24's DOM (room name, photo URL, description, price), move Beds24's functional form elements (qty `<select>`, guest `<select>`) into our markup, and build the card layout from scratch.

### What We'd Build

```html
<!-- Beds24's original card body → display: none -->
<!-- Our replacement: -->
<div class="tnh-card-body">
  <div class="tnh-card-content">
    <img class="tnh-card-photo" src="[extracted from carousel]" />
    <div class="tnh-card-info">
      <p class="tnh-card-desc">[extracted from description div]</p>
    </div>
  </div>
  <div class="tnh-card-tags">[injected from ROOM_TAGS, same as now]</div>
  <div class="tnh-offer-bar">
    <div class="tnh-offer-price">from €XX.XX / night</div>
    <div class="tnh-offer-controls">
      <span class="tnh-select-label">Select</span>
      [moved: original <select> element — preserves form submission]
      <span class="tnh-total-price">[hidden until qty selected]</span>
      <button class="tnh-book-btn">Book</button>
    </div>
  </div>
</div>
```

### What Gets Eliminated

| Current Approach | Eliminated By Rebuild |
|---|---|
| Bootstrap grid reset (`.b24panel [class*="col-"]`) | No Bootstrap elements in our markup |
| CSS Grid + `:has()` selectors for desktop | Simple flexbox on our own markup |
| `order` + negative margins for mobile | Clean DOM order matches visual order |
| `!important` on ~90% of CSS rules | No specificity wars with our own classes |
| Flex-wrap line break tricks for offer bar | Explicit `tnh-offer-bar` with block/flex children |
| Fighting `.hidden` class on from-price | We control visibility directly |
| Forcing open collapsed sections | We extract data before Beds24 collapses them |
| Hiding ~10 individual Beds24 elements | One `display:none` on the original panel body |
| Separate desktop/mobile tag injection | One tag container, CSS handles responsive |
| Dorm-specific DOM rearrangement | Same card structure for all room types |

### What Stays the Same

- **Widget JS** (`booking-widget.js`): unchanged. Still handles date/guest selection, iframe creation, height sync.
- **Room sorting**: DOM reordering on `#ajaxroomoffer` wrappers stays the same.
- **Section 1** (hide chrome + height sync): unchanged. Still hides booking strip/headers/footer when embedded.
- **Section 5** (date strip overrides): can be simplified since we hide the price table.
- **Form submission**: preserved. We move the actual `<select>` elements, so `form#formlook` submission includes them. Book button still appends `bookmult` hidden input and submits the form.
- **Beds24 admin configuration**: no changes needed. Layout, Style, Content settings stay as-is.
- **CI/CD pipeline**: unchanged. Push to `main` deploys to VPS.

### Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Beds24 changes DOM structure, our selectors break | Already a risk with current approach. Rebuild has fewer selectors (extract data from well-known IDs like `#roomnametext{id}`, `[id^="from-"]`, `#collapsedesc{id}`). Same maintenance burden. |
| Moved `<select>` elements lose event listeners | Beds24 attaches change handlers via delegated events on `form#formlook`, not directly on the selects. Moving selects within the same form preserves delegation. Already proven with dorm fix (Session 7). |
| Data extraction fails (price/description not yet in DOM when helper runs) | MutationObserver + `isModifying` guard already handles this. Helper re-runs `applyFixes()` on DOM changes. Card rebuild would use the same pattern — only build when data is available. |
| Photo URL extraction fails | Fallback: show Beds24's original photo element instead of extracting the URL. Or hide photo if extraction fails — card still functional. |
| Performance: building DOM elements is slower | Negligible. We're creating ~20 elements per room × 4 rooms = ~80 elements. Current approach already creates comparable elements (tags, book buttons, wrappers, price spans). |
| Accessibility: screen readers lose Beds24's native semantics | Our markup can use the same semantic structure (headings, buttons, form elements). The moved `<select>` retains its `id` and `name` attributes. |

### What This Doesn't Solve

- **Checkout page styling** (Phase P2): still needs CSS-only approach on Beds24's checkout DOM.
- **Confirmation page** (Phase P3): same — CSS-only.
- **10-second load time**: likely caused by the `Date.now()` bootstrapper defeating all caching. The helper JS is fetched fresh on every page load. This is a tradeoff we chose for development iteration speed — production would use versioned filenames with caching.
- **iOS Safari iframe viewport expansion**: the `.container{max-width:100%}` fix in the helper's style injection handles this regardless of card approach.
- **Room descriptions and photos**: still sourced from Beds24 admin. The rebuild extracts them from Beds24's DOM — it doesn't host them separately.

### Implementation Plan

1. **New function `rebuildRoomCards()`** replaces `enhanceRoomCards()`, portions of `injectBookButtons()`, portions of `enhancePrices()`, and `fixDormRooms()`.
2. **Simplified CSS** — most of the current CSS file gets replaced. Brand variables, base styles, and the rebuilt card styles. No Bootstrap resets, no `:has()` selectors, no `!important` cascade.
3. **Preserve form mechanics** — move `<select>` elements, keep Book button submission logic, keep `bookmult` hidden input injection.
4. **Test incrementally** — deploy via CI/CD, test on mobile, iterate.

---

## Questions for Adversarial Review

1. Are there Beds24 form submission mechanics we might break by hiding the original card body and moving select elements?
2. Is there a simpler approach we're missing that would solve the offer bar alignment without a full rebuild?
3. What happens when Beds24 fires AJAX updates (e.g., qty change triggers price recalculation) — will the updates target the hidden original elements, and will we need to re-extract data?
4. Should we keep the original card visible but overlay/reposition our elements, instead of hiding it completely?
5. Is the tag data (room ID → tag mapping) better extracted from Beds24's Features module (106) rather than hardcoded? The Features module exists in the DOM but is currently hidden.
