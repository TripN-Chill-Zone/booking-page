# Beds24 Booking Page — Card Rebuild Proposal

## Date: 2026-04-17 (Session 10)

## Background

We're building a custom-styled booking page for Trip'N'Hostel Chill Zone, a hostel in Tirana. The booking engine is Beds24 (a third-party platform). The booking page is embedded in an iframe on the client's WordPress site via a custom widget. Guests search for rooms on the WordPress page, rooms appear in the iframe below, and clicking Book breaks out to Beds24's checkout.

### Project Documentation

- [Execution plan](https://github.com/TripN-Chill-Zone/booking-page/blob/main/docs/beds24-execution.md)
- [Architecture decisions & rationale](https://github.com/TripN-Chill-Zone/booking-page/blob/main/docs/beds24-execution-context.md)
- [DOM structure reference](https://github.com/TripN-Chill-Zone/booking-page/blob/main/docs/skill/dom-structure.md)
- [CSS architecture](https://github.com/TripN-Chill-Zone/booking-page/blob/main/docs/skill/css-architecture.md)
- [Known gotchas](https://github.com/TripN-Chill-Zone/booking-page/blob/main/docs/skill/gotchas.md)
- [Approved mockup v13](https://github.com/TripN-Chill-Zone/booking-page/blob/main/docs/mockup.html)
- [Current CSS](https://github.com/TripN-Chill-Zone/booking-page/blob/main/CSS-base.css)
- [Current helper JS](https://github.com/TripN-Chill-Zone/booking-page/blob/main/beds24-iframe-helper.js)
- [Current widget JS](https://github.com/TripN-Chill-Zone/booking-page/blob/main/booking-widget.js)

---

## Problem Statement

The current approach styles Beds24's native DOM using external CSS and a helper JS that injects additional elements (tags, Book buttons, price displays) into Beds24's existing markup. This has become increasingly fragile and complex because:

1. **Beds24's DOM is hostile to custom styling.** It uses Bootstrap 3 with `!important` rules, inline styles from the Style panel, collapsed sections that must be forced open, and a deeply nested structure with inconsistent class naming. Every CSS rule requires `!important` and high specificity to override Beds24's own styles.

2. **The offer bar alignment has been the hardest problem.** The mockup shows a simple two-line layout:
   ```
   from €45.00 / night
   Select [- ▼]           €90.00  [Book]
   ```
   Achieving this with Beds24's DOM has required fighting: Bootstrap column classes (`col-xs-12 col-sm-3`), an unexpected `div#selectors1-{roomId}` wrapper between `.multiroomshow` and `.b24-multipricebox`, Beds24's `.hidden` class toggling on the price div when quantity is selected, flex-wrap line break behavior differences across mobile browsers, and parent containers collapsing to 0 width.

3. **iOS Safari iframe viewport expansion.** The Beds24 page uses Bootstrap's `.container` class which sets fixed widths at desktop breakpoints (750px, 970px, 1170px). Inside an iframe on iOS Safari, this causes the iframe to expand beyond the phone's viewport width, preventing CSS `@media (max-width: 767px)` from triggering. Fixed by injecting `.container{max-width:100%}` early.

4. **Specificity wars.** Our Bootstrap reset (`.b24panel-room .b24panel [class*="col-"]`) inadvertently overrode our own thumbnail sizing rules because it had higher specificity. Required bumping all component selectors to 3-class specificity.

5. **Cumulative complexity.** The CSS file is 465 lines with heavy use of `!important`, `:has()` selectors, CSS `order` for mobile reordering, negative margins for layout tricks, and multiple media query overrides. The helper JS is 577 lines with 8 functional sections, a MutationObserver, and extensive DOM manipulation that patches elements into Beds24's existing structure.

---

## What We've Tried

### Approaches That Are Working

- **Iframe architecture (widget for rooms, breakout for checkout)** — Stable, well-tested across Sessions 6-10. The widget (`booking-widget.js`) handles date/guest input on WordPress, loads Beds24 in an iframe with `referer=widget` parameter, and the helper hides Beds24's chrome when embedded.

- **Date.now() bootstrapper in Beds24 customhead** — Eliminates cache issues for the helper JS. The `customhead` field contains a bootstrapper that loads the helper with a timestamp query parameter, so changes deploy immediately without touching the Beds24 admin.

- **GitHub Actions CI/CD** — Push to `main` auto-deploys CSS/JS files to VPS via SCP. Stable filenames (`CSS-base.css`, `beds24-iframe-helper.js`, `booking-widget.js`) mean no reference updates needed.

- **Room sorting via DOM reorder** — Reads prices from the DOM at runtime, sorts available rooms cheapest-first, pushes unavailable to the bottom. Works reliably.

- **Dorm room fix** — Moves the guest selector into a new wrapper, relabels "Guests" → "Beds", hides the orphan price box. This approach (building our own wrapper around moved native elements) is the model for the proposed rebuild.

- **Tag injection** — Desktop tags inside `.b24-room-desc`, mobile tags as a separate div with CSS `order`. Works well.

### Approaches That Failed or Required Excessive Complexity

- **CSS-only offer bar layout via flex-wrap** — Multiple iterations (Sessions 9-10) trying to create a two-line offer bar using `flex-wrap` with `order` values on children. The from-price div (`width: 100%`, `order: -1`) should force a line break, with form-inline and book-group sharing the next line. This works inconsistently across browsers and breaks when Beds24 toggles `.hidden` on the from-price after quantity selection. Attempted fixes: `justify-content: flex-end`, `justify-content: space-between`, `flex-basis: 100%`, explicit `width: 100%` on every parent in the chain. None reliably keep the Book button right-aligned on the second line across all states.

- **CSS `order` on room wrapper divs for sorting** — Failed because Beds24 loads all rooms via AJAX into a single `#ajaxroomoffer` wrapper, leaving the other wrapper divs empty. CSS `order` on empty divs has no effect.

- **Overriding Beds24's `.hidden` class on from-price** — We force `display: block !important` to keep the from-price visible when Beds24 hides it after quantity selection. This fights the MutationObserver loop (Beds24 adds `.hidden`, our code removes it, observer fires again). Manageable with the `isModifying` guard but adds fragility.

### Approaches Rejected in Prior Sessions

- **Full iframe flow (booking through confirmation inside iframe)** — Rejected Session 6. Confirmation page rendered at wrong scroll position, height sync broke on page transitions.
- **Beds24 WordPress plugin** — Rejected Session 4-5. iOS double-scroll, no control over booking flow.
- **SPA approach** — Understood to be a different project scope and budget.
- **Direct Beds24 page (no iframe)** — Rejected Session 6. Client wanted rooms inline on WordPress page.

---

## Proposed Approach: Card Rebuild

### Concept

Instead of styling Beds24's native DOM, **hide Beds24's card content and rebuild each room card with our own clean HTML structure.** Move Beds24's functional form elements (quantity `<select>`, guest `<select>`, hidden inputs) into our markup so form submission continues to work natively.

### What Changes

**Helper JS becomes the primary renderer.** Instead of patching elements into Beds24's DOM (injecting tags, book buttons, price displays, hiding fakelinks, forcing open collapsed sections), the helper:

1. Waits for Beds24 to render room cards
2. Extracts data from each card: room name, photo URL, description text, price, availability
3. Hides the original card body (`display: none` on `.b24panel`)
4. Builds a new card body with our own markup
5. Moves Beds24's native `<select>` elements into our markup (not cloned — moved, so form state is preserved)
6. Appends our card body to the existing `.b24panel-room` container

**CSS becomes pure styling of our own markup.** No more `!important` on every rule, no Bootstrap reset, no `:has()` selectors, no specificity wars. The CSS targets our own classes (`.tnh-card`, `.tnh-offer-bar`, `.tnh-card-photo`, etc.) which have no competing styles.

### Proposed Card Structure

```html
<!-- Beds24's panel-room wrapper is kept for the heading -->
<div class="panel b24panel-room">
  <div class="panel-heading b24-roompanel-heading">
    <!-- Room name stays in Beds24's heading -->
  </div>

  <!-- Beds24's original panel-body: hidden -->
  <div class="panel-body b24panel" style="display:none">
    <!-- Original Beds24 content, hidden but still in DOM for form elements -->
  </div>

  <!-- Our rebuilt card body -->
  <div class="tnh-card">
    <div class="tnh-card-body">
      <img class="tnh-card-photo" src="[extracted from carousel]" alt="" />
      <div class="tnh-card-info">
        <p class="tnh-card-desc">[extracted from description div]</p>
        <div class="tnh-card-tags">[built from ROOM_TAGS data]</div>
      </div>
    </div>
    <div class="tnh-offer-bar">
      <div class="tnh-offer-price">from €XX.XX / night</div>
      <div class="tnh-offer-controls">
        <label>Select</label>
        <!-- Beds24's actual <select> element, MOVED here -->
        <select id="sr1-{roomId}">...</select>
        <span class="tnh-total-price"></span>
        <button class="tnh-book-btn">Book</button>
      </div>
    </div>
    <!-- For unavailable rooms -->
    <div class="tnh-unavailable">Not available on 18 Apr</div>
  </div>
</div>
```

### What We Keep

- **Beds24's `<form#formlook>`** — Untouched. Our rebuilt cards live inside the same form.
- **Beds24's `<select>` elements** — Moved (not cloned) into our markup. `name` attributes, `id` attributes, and event listeners travel with the element. Form submission works natively.
- **Beds24's hidden inputs** — For dorm rooms, `input[type="hidden"][name^="sr1-"]` stays in place.
- **Room heading** — Beds24's `.b24-roompanel-heading` is kept as-is (just styled).
- **Room sorting** — `sortRooms()` continues to reorder `#ajaxroomoffer` wrappers via DOM reordering.
- **Widget architecture** — No changes to the widget or iframe flow.
- **Bootstrapper deployment** — No changes to how files are loaded.
- **CI/CD pipeline** — No changes.

### What We Eliminate

- Bootstrap reset rules (~15 lines of CSS)
- `:has()` selectors for grid placement (~20 lines)
- Desktop grid layout rules fighting Bootstrap columns (~30 lines)
- Mobile flex-direction/order reordering (~25 lines)
- Offer bar flex-wrap layout (~25 lines)
- Collapsed section forcing (`[id^="collapsedesc"]`, `[id^="collapseslider"]`)
- Fakelink hiding
- Carousel control hiding
- Most `!important` declarations
- The `.tnh-offer-row` wrapper
- The `enhancePrices()` function (price display built into our card)
- The `enhanceRoomCards()` function (tags and desc built into our card)
- Dorm-specific layout fixes in CSS
- Negative margin hacks for mobile desc positioning

### Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Moving `<select>` elements breaks Beds24's event listeners | Beds24 uses delegated listeners on the form, not direct listeners on selects. Delegated listeners work regardless of element position in the DOM. The dorm fix already moves a `<select>` successfully — this is proven. |
| Beds24 re-renders room cards via AJAX (e.g., after date change) | The MutationObserver already handles this — `applyFixes()` runs on DOM changes. The rebuild function checks for a marker class to avoid rebuilding already-processed cards. If Beds24 replaces the card HTML, the marker is lost and the card gets rebuilt. |
| Hidden original panel-body breaks form submission | The `<select>` elements are moved out of the hidden div into our visible card. `display:none` on the parent doesn't affect child elements that have been moved elsewhere. Form submission reads values by `name` attribute, not by visibility. |
| Beds24 frontend update changes the extraction selectors | Same risk as current approach (we target `.carousel .item.active img`, `[id^="from-"]`, etc.). The rebuild concentrates all extraction in one function, making it easier to update selectors in one place versus the current approach where extraction logic is scattered across 4+ functions. |
| Card rebuild causes visible flash (original → rebuilt) | The original panel-body is hidden immediately when the helper loads (via the Section 1 inline style injection). The rebuild happens on DOMContentLoaded or MutationObserver. The loading spinner in the widget covers this transition. |
| Performance: rebuilding cards on every MutationObserver fire | Marker class (`tnh-card-built`) prevents re-processing. Only new/replaced cards get rebuilt. |

### Impact on Other Components

| Component | Impact |
|---|---|
| `booking-widget.js` | None — widget doesn't interact with card internals |
| `CSS-base.css` | Major reduction — most rules replaced with clean selectors targeting `.tnh-*` classes |
| `beds24-iframe-helper.js` | Major rewrite of Sections 3, 4, 6, 7. Sections 1 (chrome hiding), 2 (removed), 5 (date strip), 8 (sorting) are unchanged |
| Beds24 admin fields | None |
| WordPress Custom HTML block | None |
| CI/CD pipeline | None |
| Checkout/confirmation flow | None — rebuild only affects room display page |

### Implementation Plan

1. Write `rebuildCard(room)` function that extracts data, hides original, builds new markup, moves form elements
2. Replace `fixDormRooms()`, `injectBookButtons()`, `enhancePrices()`, `enhanceRoomCards()` with single `rebuildCards()` call
3. Keep `sortRooms()` as-is (operates on wrapper divs, not card internals)
4. Rewrite CSS to target `.tnh-*` classes only
5. Test on mobile (the primary viewport) and desktop
6. Verify form submission works for all room types including dorms

### Success Criteria

- Offer bar alignment consistent across all rooms and all states (no qty, qty selected, unavailable)
- Mobile layout matches mockup v13 without CSS hacks
- Form submission works for all room types
- No regression in: room sorting, tag display, price display, dorm booking, iframe height sync
- CSS file under 200 lines with minimal `!important` usage
- Helper JS complexity reduced (fewer sections, clearer data flow)

---

## Open Questions for Review

1. Are there Beds24 behaviors we haven't considered that depend on the card elements being visible? (e.g., price recalculation triggered by visibility of certain elements)
2. Should we keep the original panel-body hidden but present (`display:none`) or remove it entirely (`remove()`)? Hidden-but-present is safer for form submission but could cause MutationObserver churn if Beds24 keeps modifying hidden elements.
3. The tag data is currently hardcoded by room ID in the helper JS. Should this remain hardcoded, or should we extract tags from Beds24's Features module (`.b24-room-106`)? The Features module is currently hidden because its default styling is poor, but the data is there.
4. The current `enhancePrices()` function handles per-night price calculation (total ÷ nights). In the rebuild, should this calculation happen once at build time, or reactively (watching for Beds24 to update the price after qty changes)?
