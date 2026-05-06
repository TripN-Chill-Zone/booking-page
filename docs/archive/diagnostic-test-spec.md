# Diagnostic Test Spec — Offer Bar Flex Layout

**Purpose:** Determine the root cause of the offer bar alignment bug. The Book button and controls should be right-aligned within the offer bar, but they cluster immediately after the price text instead.

**Environment:** Run these tests in a real browser (not MCP tabs, which have `window.innerWidth = 0` and trigger mobile CSS). Use Chrome DevTools or equivalent.

**Page URL:** Load the booking page through the WordPress widget at:
`https://chillzone.astrongpresence.com/book-a-room/`

Pick dates where all rooms are available (e.g., 2+ weeks out, 2 nights). Wait for rooms to fully render before inspecting.

**Alternative URL (direct Beds24, no widget):**
`https://www.beds24.com/booking2.php?ownerid=141266&propid=271142&checkin=20260509&numnight=2&numadult=1&cssfile=https://astrongpresence.com/CSS-base.css?v=TIMESTAMP`
(Replace TIMESTAMP with current unix timestamp to bust cache)

---

## Test 1: Is the flex container resolving?

On any available private room (e.g., Single Room), inspect the `.tnh-offer-bar` element.

Report:
```
Element: .tnh-offer-bar
  computedStyle.display = ?
  computedStyle.width = ?
  computedStyle.flexWrap = ?
  offsetWidth = ?
  parentElement.tagName = ?
  parentElement.className = ?
  parentElement.offsetWidth = ?
  parentElement.computedStyle.display = ?
  parentElement.computedStyle.width = ?
```

**What we're checking:** If `.tnh-offer-bar` has `display: flex` and a non-zero width that fills its parent, the flex container is working. If its width is 0, or narrower than its parent, something upstream is collapsing it.

---

## Test 2: Is margin-left: auto resolving on controls?

On the same room, inspect `.tnh-offer-controls` (child of `.tnh-offer-bar`).

Report:
```
Element: .tnh-offer-controls
  computedStyle.display = ?
  computedStyle.marginLeft = ?  (should be "auto" or a computed px value)
  computedStyle.flexShrink = ?
  offsetWidth = ?
  offsetLeft = ?
```

Also inspect `.tnh-offer-price` (sibling of `.tnh-offer-controls`, also child of `.tnh-offer-bar`):

Report:
```
Element: .tnh-offer-price
  computedStyle.display = ?
  computedStyle.width = ?
  computedStyle.flexShrink = ?
  computedStyle.flexGrow = ?
  offsetWidth = ?
  textContent = ?
```

**What we're checking:** `margin-left: auto` on a flex item pushes it to the right only if the flex container has remaining space. If `.tnh-offer-bar`'s width equals the sum of its children's widths (no remaining space), margin-left: auto resolves to 0. This would explain the symptom perfectly — controls cluster next to the price because there's no space for the auto margin to fill.

---

## Test 3: Walk the width chain upward

Starting from `.tnh-offer-bar`, walk up the DOM tree and report each ancestor's `offsetWidth` and `computedStyle.display` until you reach `.b24panel-room`. This identifies where the width collapses.

Report:
```
.tnh-offer-bar                  offsetWidth=?  display=?  width=?
  parent: (class=?)             offsetWidth=?  display=?  width=?
    parent: (class=?)           offsetWidth=?  display=?  width=?
      parent: (class=?)         offsetWidth=?  display=?  width=?
        ... continue until .b24panel-room
.b24panel-room                  offsetWidth=?  display=?
```

**What we're checking:** The bar needs `width: 100%` of the offer section, which needs full width of the card. If any intermediate element (the `.offer > div > .row`, the `.offer > div`, the `.offer` itself) has a collapsed or constrained width, the bar inherits the constraint.

---

## Test 4: What's overriding our grid?

Inspect `.b24panel-room > .b24panel` (the panel body — direct child of `.b24panel-room`).

Report:
```
Element: .panel-body.b24panel
  computedStyle.display = ?     (should be "grid" on desktop)
  computedStyle.gridTemplateColumns = ?  (should be "120px 1fr")
  computedStyle.flexDirection = ?
  offsetWidth = ?
```

If `display` is NOT `grid`, use DevTools' computed styles panel to find which CSS rule is winning. Report the winning rule's selector, value, source file, and specificity.

**What we're checking:** If Beds24's Style panel or Bootstrap is overriding our `display: grid` with something else, the entire card layout (thumbnail, desc, tags, offer) breaks. This would explain both the tag overlap AND potentially the offer bar width issue.

---

## Test 5: Tag positioning

On the same room, inspect `.tnh-room-tags` (the desktop tag container inside `.b24-room-desc`).

Report:
```
Element: .tnh-room-tags
  computedStyle.display = ?
  offsetWidth = ?
  offsetLeft = ?
  getBoundingClientRect().left = ?
  getBoundingClientRect().top = ?
```

Also get the thumbnail's position:
```
Element: .carousel.slide (or first .item.active img)
  getBoundingClientRect().left = ?
  getBoundingClientRect().right = ?
  getBoundingClientRect().top = ?
  getBoundingClientRect().bottom = ?
```

**What we're checking:** If the tags' left edge is less than the thumbnail's right edge, they overlap. This tells us whether the grid column separation is working.

---

## Test 6: Beds24 injected styles

Count and list any `<style>` elements in the page `<head>` that are NOT:
- Our external CSS (`astrongpresence.com/CSS-base.css`)
- The helper JS's injected style (date strip overrides)
- Google Fonts

For each Beds24-injected `<style>`, report:
- Number of CSS rules inside it
- Whether any rule targets `.b24panel`, `.panel-body`, `.row`, `.col-*`, `.offer`, or any class containing `room` or `panel`
- The first 500 characters of its text content

**What we're checking:** Whether Beds24's Style panel injects rules that compete with our grid/flex layout. This is the "inline styles loaded after external CSS win at equal specificity" hypothesis from the proposal.

---

## Test 7: Viewport confirmation

Report:
```
window.innerWidth = ?
window.innerHeight = ?
matchMedia('(max-width: 767px)').matches = ?
```

**What we're checking:** Confirming we're actually testing at desktop width and the mobile breakpoint is not active.

---

## Output format

Please output all results as a single code block so I can paste it directly. No interpretation needed — just the raw values. I'll do the analysis.
