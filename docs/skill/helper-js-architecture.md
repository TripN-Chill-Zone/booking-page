# Helper JS Architecture

Structure and behavior of `beds24-iframe-helper.js`, the JS file 
loaded by each property's Beds24 `customhead` field.

---

## Overview

The helper is shared code deployed once to 
`https://astrongpresence.com/beds24-iframe-helper.js` and loaded by 
every property's Beds24 admin. It is property-agnostic: per-property 
data comes from `window.TNH_CONFIG` (see `property-config.md`).

The helper runs in two contexts:

1. **Inside the WordPress widget iframe** (referer=widget): hides 
   Beds24 chrome, reports height to parent, handles all the standard 
   sections below.
2. **On the direct Beds24 URL** (no referer=widget): skips chrome 
   hiding, runs all other sections.

Both contexts are detected at initialization.

---

## Initialization flow

```
1. Immediately-invoked function expression fires on script load
2. resolveConfig() reads window.TNH_CONFIG
3. If no valid config: log error, halt
4. Detect context (iframe + referer=widget, or direct page)
5. Run Section 1 (chrome hiding + height sync) only if widget-embedded
6. Set up single MutationObserver watching document.body
7. Observer's applyFixes() runs Sections 3-8 in order
8. Observer fires on DOM mutations; isModifying guard prevents re-entry
```

---

## Section inventory

Section numbering preserved from historical versions for continuity. 
Section 2 is omitted — it was the "checkout in iframe" path, removed 
when the architecture moved to `form.target="_top"` breakout.

### Section 1 — Chrome hiding + height sync + iOS viewport clamp

**Runs only when:** inside an iframe AND `referer=widget` URL param present.

**What it does:**

- Injects a `<style>` block that hides Beds24's booking strip, property 
  headers, property footers, shopping cart, and related UI elements 
  that the WordPress widget replaces
- Injects `.container { max-width: 100% !important }` and 
  `.row { max-width: 100% !important }` to prevent Bootstrap's fixed 
  `.container` widths from expanding the iframe beyond viewport on iOS 
  Safari
- Sets up a `postMessage` loop that reports `document.body.scrollHeight` 
  (floored at 200px) to the parent widget every ~500ms
- Listens for `postMessage` from the parent that triggers opacity 
  transitions on page navigation

**Why it's conditional:** On the direct Beds24 page, Beds24's chrome is 
the correct UI. The helper only hides it when embedded in our widget.

### Section 3 — Dorm booking fix

**Runs always.**

**What it does:**

- Finds every room marked `isDorm: true` in the config
- For each dorm room: locates its `#selectors1-{roomId}` wrapper
- Moves `select[id^="naa"]` (guest selector) from the second 
  `.b24-multipricebox` into the first one, wrapped in a `<span>` with 
  a "Beds:" label
- Relabels the select's options: "Guest" → "Bed", "Guests" → "Beds"
- Hides the now-empty second `.b24-multipricebox` via inline 
  `display: none`

**Why it exists:** Dorm rooms configured for channel manager 
compatibility render a hidden qty input instead of a visible qty 
select. Without intervention, a guest sees the room price and date 
strip but no visible way to book it. See 
`dom-structure.md` §8 for the dorm DOM pattern.

**Config dependency:** Uses `rooms[].isDorm` from `window.TNH_CONFIG`.

### Section 4 — Book button injection

**Runs always.**

**What it does:**

- Finds every `.b24-multipricebox:not(.hidden)` inside every `.offer`
- Appends a `.tnh-book-group` span to each containing:
  - `.tnh-total-price` span (hidden until qty > 0)
  - `.tnh-book-btn` button
- Button click handler:
  - Reads qty value (private rooms: `select[id^="sr1-"]`, dorms: 
    `input[type="hidden"][name^="sr1-"]`)
  - If qty is `0` or empty (private rooms only), sets it to `1` and 
    dispatches `change`
  - For dorms, sets the guest select to `1` if it's currently `0`
  - Calls `form.submit()` on `#formlook`

**Why it exists:** Beds24 multi-room mode renders only strip-level Book 
buttons (two instances, both in the booking strip). There are no 
per-room Book buttons in Beds24's default output.

**Critical:** `form.target="_top"` is set on `#formlook` so submission 
breaks out of the iframe to full-page Beds24 checkout.

### Section 5 — Date strip color overrides

**Runs always.**

**What it does:**

- Injects a `<style>` block with `!important` rules for:
  - `.datestay` (stay-range cells) → green background
  - `.dateunavail` (unavailable cells) → red background
  - `.at_pricetd` (all date cells) → `pointer-events: none !important` 
    to block Beds24's click-to-navigate handlers
  - `.roomofferpricetable tr.b24-bookingstrip` → `display: none` to 
    hide the repeated "Check Out" header row

**Why it's in JS, not CSS:** Beds24's Style panel generates inline 
`<style>` blocks with color values that load after external CSS and 
win at equal specificity. JS-injected styles load last and beat both 
external CSS and Beds24's inline styles. See `dom-structure.md` §10 
for the cascade pattern.

### Section 6 — Price display UX

**Runs always.**

**What it does:**

- For each offer's visible `.b24-multipricebox`:
  - Reads price from `.bookingpagedollars` + `.bookingpagecents`
  - Computes per-night price (total / nights)
  - Replaces `[id^="from-"]` contents with 
    `<span class="tnh-price-pernight-main">from €X.XX / night</span>`
  - Populates `.tnh-total-price` inside the Book button group

**Why it exists:** Beds24's default from-div rendering doesn't show 
per-night breakdown; this section formats it consistently.

**Critical:** Section 6 must fail silently if price data is missing. 
A room with no available dates has no price in the DOM — the helper 
should display nothing rather than display broken data.

### Section 7 — Room card enhancement

**Runs always.**

**What it does:**

- For each `.b24room` matched by a config `rooms[].id`:
  - Adds `.tnh-desc-text` class to the description text node 
    (`[id^="collapsedesc"] > div:not(.fakelink)`)
  - Injects `.tnh-room-tags` div into `.b24-room-desc` with tag pills 
    for desktop
  - Injects `.tnh-room-tags-mobile` div into `.panel-body.b24panel` 
    (positioned before `.offer` via `insertBefore`) with the same tag 
    pills for mobile
  - Renames the qty select's "0" option from Beds24's default to `-` 
    (placeholder character)

**Why dual tag injection:** Desktop and mobile layouts place tags 
differently (inside desc column vs. full-width row). Separate injection 
points let the CSS control visibility at each breakpoint without 
layout contortions.

**Config dependency:** Uses `rooms[].id` and `rooms[].tags[]` from 
`window.TNH_CONFIG`.

### Section 8 — Room sorting

**Runs always.**

**What it does:**

- Reads the "from price" for each `.b24room` in the DOM
- Sorts ascending by price
- Moves unavailable rooms (no price, or with `.offerwarndiv` visible) 
  to the bottom
- Reorders the `.b24room` elements within their shared parent 
  (`#ajaxroomoffer{roomId}` — only one is populated after AJAX)

**Why it exists:** Beds24's "Cheapest First" admin setting doesn't 
actually take effect in multi-room mode. DOM reorder is the workaround.

---

## Cross-section concerns

### The MutationObserver and `isModifying` guard

All sections that mutate DOM run inside a single observer callback 
with a re-entry guard:

```js
var isModifying = false;
var observer = new MutationObserver(function() {
  if (isModifying) return;
  isModifying = true;
  try {
    applyFixes();  // runs sections 3, 4, 5, 6, 7, 8 in order
  } finally {
    setTimeout(function() { isModifying = false; }, 100);
  }
});
observer.observe(document.body, { childList: true, subtree: true, attributes: true });
```

**Why single observer:** Two observers on `document.body` with 
`subtree: true` where both callbacks modify the DOM create infinite 
mutation loops. See retrospective entry "Two MutationObservers created 
infinite DOM mutation loop" (2026-04-20).

**Why 100ms timeout:** Gives the browser time to settle after batch 
DOM changes before the observer re-arms. Too short causes re-entry; 
too long causes visible lag between Beds24's mutations and our 
response.

**What triggers re-runs:** Beds24's own observers toggle `.hidden` on 
from-divs when qty changes, add/remove availability warnings on date 
changes, and occasionally re-render price data. Every such mutation 
triggers applyFixes to ensure our injections survive.

### Idempotency

Every section must be idempotent — safe to run multiple times on the 
same DOM without duplicating work. The typical pattern:

```js
function injectThing(room) {
  if (room.querySelector('.tnh-thing')) return;  // already done
  // ...inject the thing
}
```

Without idempotency, the observer loop would stack duplicate Book 
buttons, duplicate tag rows, etc.

### Fail-loud for missing config

The helper halts if `window.TNH_CONFIG` is missing or invalid. There 
is no hardcoded fallback. Rationale: the helper is product code and 
must never contain client-specific data.

```js
function resolveConfig() {
  if (window.TNH_CONFIG && isValidConfig(window.TNH_CONFIG)) {
    return window.TNH_CONFIG;
  }
  return null;
}

function isValidConfig(c) {
  return c 
    && c.schemaVersion === 1 
    && typeof c.propertyId === 'string'
    && Array.isArray(c.rooms);
}

// At init:
var config = resolveConfig();
if (!config) {
  console.error('[TNH] No valid config found (window.TNH_CONFIG missing or invalid). Helper halted.');
  return;
}
```

### Fail-silent for missing runtime data

Unlike missing config (which is a deployment error), missing runtime 
data (e.g., no price because no availability) is expected and common. 
Sections that read DOM data must handle absence gracefully:

```js
var dollars = el.querySelector('.bookingpagedollars');
if (!dollars) return;  // no price yet, try again next cycle
var price = parseInt(dollars.textContent, 10);
if (isNaN(price)) return;
// ...use price
```

Never display placeholder or error text to the user. Empty is the 
correct fallback.

---

## Context detection

The helper detects its running context at init:

```js
var isIframe = (window !== window.top);
var isWidget = new URLSearchParams(window.location.search).get('referer') === 'widget';
var isWidgetEmbedded = isIframe && isWidget;
```

- `isWidgetEmbedded === true` → Section 1 runs (chrome hiding, height 
  sync, postMessage loop)
- `isWidgetEmbedded === false` → Section 1 skipped; helper still runs 
  Sections 3-8

The direct Beds24 URL is a valid usage mode — guests who find the page 
via search or marketing URLs get a styled, feature-complete booking 
page without the WordPress widget chrome.

---

## Future: hosted-tier config fetch

The `resolveConfig()` function is structured to accept a 
fetch-based branch when the hosted subscription tier is built:

```js
function resolveConfig() {
  if (window.TNH_CONFIG && isValidConfig(window.TNH_CONFIG)) {
    return window.TNH_CONFIG;
  }
  // Future:
  // if (window.TNH_CONFIG_URL) {
  //   return fetchConfigSync(window.TNH_CONFIG_URL);
  // }
  return null;
}
```

Not implemented yet. Added when the first hosted-tier client signs up. 
See `property-config.md` for the business-tier context.

---

## Architecture history

- **Sessions 3-5:** Helper was a single inline script in `custombody` 
  with hide/reveal rooms logic.
- **Session 6:** Helper moved to external file loaded via `customhead`. 
  Added height sync, chrome hiding, form breakout.
- **Sessions 7-10:** Sections 3-8 added progressively (dorm fix, Book 
  buttons, date strip colors, price UX, card enhancement, room 
  sorting). 
- **Session 11 (rebuild attempt):** Sections 3, 4, 6 were merged into 
  a unified `rebuildOfferBars()` that moved Beds24's elements into 
  new markup. This approach was abandoned after it produced 
  specificity-war CSS bugs and an escalating series of proposal 
  documents. See archived proposals and retrospective entry 
  "Offer bar rebuild skipped the simplest candidate solution" 
  (2026-04-21).
- **Session 12 (current):** Reverted to pre-rebuild state (commit 
  `420dd06`), externalized per-property data via `window.TNH_CONFIG`. 
  Helper is now property-agnostic product code.

---

## Related documents

- `property-config.md` — per-property config data and schema
- `dom-structure.md` — verified DOM selectors used by the helper
- `gotchas.md` — known pitfalls including jQuery expando behavior, 
  MutationObserver patterns, Beds24 save failures
- `beds24-execution.md` — Phase 3 status and remaining work
