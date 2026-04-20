# Beds24 Booking Page — Known Gotchas

Hard-won lessons from multiple sessions. Read this before making changes.

## CSS Field Limits

**The "Custom CSS" inline field silently rejects saves above ~18-19K characters.** There is no error message. The save appears to succeed, but on reload the field contains the old content.

**Solution:** Keep "Custom CSS" under 2K. Put all real CSS in the external file.

## Iframe Width Is Controlled by the Widget, Not WordPress or Beds24

The Beds24 iframe's rendering width is determined entirely by the `.tnh-booking-widget` `max-width` CSS rule in `booking-widget.js`. Neither WordPress (any theme), the Kadence page template, nor any Beds24 admin setting controls this.

**Verified Session 12 (2026-04-21)** via a five-test sweep:
- Widget JS: iframe width is `100%` of `.tnh-results-frame-wrap` content area. No explicit width attribute set.
- WordPress/Kadence: zero width constraint anywhere in the DOM chain from `<body>` down to `#tnh-booking-root`.
- Beds24 admin: no width/iframe/embed/viewport field exists. No URL parameter affects rendering width.

**The formula:**

```
iframe_width = min(viewport_width, widget.max-width) - 2px
```

The 2px accounts for the 1px border on each side of `.tnh-results-frame-wrap`.

**Current value:** `.tnh-booking-widget { max-width: 1290px }` (set in v3 to match Kadence `--global-content-width`).

**Consequence:** If a future session needs to change the iframe rendering width (e.g., for a property whose theme has a different content width), the only knob is the widget's `max-width`. Do not look for WordPress or Beds24 controls — they don't exist.

**Beds24's mobile breakpoint is 767px.** With max-width 1290px:
- Viewport ≤769px → iframe ≤767px → Beds24 mobile CSS fires
- Viewport ≥770px → iframe ≥768px → Beds24 desktop CSS fires

## Tag Stripping on Programmatic Save

**"Insert in HTML <BODY> bottom" and the confirmation page HEAD field strip `<script>` and `<style>` tags when saved via Claude in Chrome.** Plain text saves fine, but `<script>...</script>` content results in empty fields after reload.

**Solution:** Provide paste-ready content to the user. They must paste it into the Beds24 admin UI manually.

## "Insert in HTML <HEAD> bottom" Does NOT Strip Tags

Unlike the BODY and confirmation fields, "Insert in HTML <HEAD> bottom" preserves `<script>` and `<style>` tags on save. This is the correct field for loading external JS via `<script src="...">`.

## DOM Structure Gotchas

Selector pitfalls, DOM hierarchy surprises, and selectors-you-want-to-use live in `dom-structure.md`. Critical DOM behaviors (AJAX wrapper consolidation, `#selectors1-{roomId}` wrapper, Bootstrap classes) are documented there with full context. This file covers interaction, save, deployment, and environment gotchas.

## Cloudflare Caching

The external CSS/JS files are served through Cloudflare. Cloudflare caches static assets aggressively.

**Solution:** The widget and Beds24 bootstrapper both append `?v=Date.now()` to file URLs, bypassing Cloudflare cache on every load. This is intentional for the dev phase. For production, consider using a fixed version query param that only changes on deploy.

**Note:** When loading the Beds24 page directly (not via widget), the `&cssfile=` parameter has no cache-busting suffix. Cloudflare may serve a stale version. Append `?v=XXXXX` manually to the URL for testing.

## Cloudflare / LiteSpeed Cache 404 Responses

If a file URL is requested before the file is uploaded, the 404 response gets cached. Even after uploading, subsequent requests may return the cached 404.

**Solutions:**
- With CI/CD and stable filenames, this is less likely (files are overwritten, not created fresh)
- If it happens: purge Cloudflare cache or append a unique query param
- Never request a URL before the file exists at that path

## Collapsed Content Wrappers

Beds24 wraps photo sliders and descriptions in divs with `hidden-xs hidden-sm hidden-md hidden-lg` — effectively `display: none` at all breakpoints. Toggled by `.fakelink` elements.

Since we hide fakelinks, we must force these wrappers open:

```css
[id^="collapseslider"] { display: block !important; height: auto !important; }
[id^="collapsedesc"] { display: block !important; height: auto !important; }
```

**If you hide fakelinks without forcing open the collapse containers, photos and descriptions will be invisible.**

## MCP Tab Zero Viewport Width

MCP tabs may have `window.innerWidth = 0` and `window.innerHeight = 0`. This causes all Bootstrap grid columns, images, carousels, and flex layouts to collapse to 0.

**Width-dependent layout testing is unreliable in MCP tabs.** Use user screenshots for visual verification. Selector matching, element existence, and text content queries all work normally.

## Media Queries Fire on Viewport Width, Not Container Width

CSS `@media (max-width: 767px)` responds to the browser viewport width, not to any container's width. Constraining a wrapper div's `max-width` via JS or CSS does NOT trigger `@media` rules.

**Consequences:**

- In `docs/mockup.html`, the device-simulation dropdown that sets `max-width: 390px` on a wrapper does NOT fire the mobile CSS. The mockup must be tested by resizing the actual browser window or using Chrome DevTools device mode.
- When testing CSS changes at specific widths, use Chrome DevTools device mode (Cmd+Shift+M / Ctrl+Shift+M) or resize the browser window. Do not use container-width simulations.

**For the iframe specifically:** the iframe has its own viewport. Media queries inside the iframe fire based on the iframe's actual pixel width. See "Iframe Width Is Controlled by the Widget" for what determines that.

**Caused three wasted mockup iterations in Session 10** — v9, v10, and v11 were each rewritten to "fix" mobile CSS that was already correct. The testing method was wrong, not the CSS.

## Dorm Room Hidden Input

Dorm rooms render their quantity selector as `input[type="hidden"]` instead of a `<select>` dropdown. The hidden input is auto-set to `value="1"`.

**Do not change the dorm's Beds24 room configuration** — it affects channel manager integrations.

Helper v14 handles this by moving the guest selector into the main price box and injecting a Book button.

## Dorm Room: Two Visible Price Boxes

Dorm rooms have two visible (non-`.hidden`) `.b24-multipricebox` elements:
- **Box 0**: contains `.form-inline` (empty), `[id^="from-"]` price, and injected Book button
- **Box 1**: contains guest selector in a `.b24-form-inline` wrapper

Helper v14 moves the guest selector from Box 1 into Box 0 and hides Box 1. If the helper doesn't run, the dorm shows two separate rows.

## Beds24 "Add Module" Dropdown

Setting the Layout page dropdown value programmatically does NOT add the module. The user must add modules manually.

## Multiple Room Booking Behavior Changes

Setting "Multiple Room Booking" to "Enabled" (`bookpageallowmulti = 1`):
1. Removes global guest count from booking strip
2. Adds per-room quantity dropdowns (except dorms)
3. Adds per-room guest count dropdowns
4. Makes `.multiplebookbutton` visible (2 instances, both in strip area)
5. Strip Book button becomes form submit

**Hiding `.at_bookingbut` globally will break the booking flow.** Target specifically: `.b24-bookingstrip .at_bookingbut` for the strip button.

## Per-Occupancy Price Boxes Leak Through Flex Rules

Beds24 marks per-occupancy price boxes with Bootstrap's `.hidden` class. If your CSS sets `display: flex !important` on `.b24-multipricebox`, it overrides `.hidden { display: none !important }` at equal or higher specificity.

**Solution:** Always include:
```css
.b24-multipricebox.hidden,
.b24-offer-select .b24-multipricebox.hidden {
  display: none !important;
}
```

## `display:none` on Iframes Prevents Content Measurement

An iframe with `display:none` does not render its content. `getBoundingClientRect()`, `offsetHeight`, and `scrollHeight` all return 0 for elements inside it.

**This was the root cause of the 18-second desktop loading delay.** The widget set the iframe to `display:none` while loading. The helper inside measured height as 0, reported 200 (floor). The widget waited for height > 500 — deadlock.

**Solution:** Use `opacity:0; position:absolute; height:1px; display:block` instead. The iframe renders content invisibly and measurements work. When ready, set `opacity:1; position:static`.

**Mobile was unaffected** — likely different browser rendering behavior for hidden iframes.

## Beds24 Style Panel Generates Inline Styles

The 20 color pickers on the Style page generate CSS rules as inline `<style>` blocks in the page `<head>`. These load after external CSS files, so at equal specificity they win. They don't use `!important`.

**For reliable overrides of Style panel colors**, inject CSS via helper JS (which appends a `<style>` tag that loads last and uses `!important`).

## Date Strip Cells Are Clickable

The `.at_pricetd` cells in `.roomofferpricetable` have click handlers attached via Beds24's delegated event listeners. No `onclick` attributes or `<a>` tags — the handlers are on a parent element. Clicking navigates to an unstyled Beds24 page.

**Solution:** Block clicks via CSS:
```css
.roomofferpricetable .at_pricetd {
  pointer-events: none !important;
  cursor: default !important;
}
```

## Date Strip Header Row Repeats "Check Out"

The first row of `.roomofferpricetable` shows "Check In | Check Out | Check Out | Check Out..." for every date column.

**Solution:** Hide it:
```css
.roomofferpricetable tr.b24-bookingstrip { display: none !important; }
```

## Non-ASCII Characters Stripped on Programmatic Saves to Beds24 Script Fields

Beds24 strips or corrupts non-ASCII characters (emoji, accented characters, etc.) from admin fields when saved via Claude in Chrome (`textarea.value = ... + click save`). This affects at least "Insert in HTML \<HEAD\> bottom" (`customhead`). The save appears to succeed — no error, field shows correct value — but after reload, non-ASCII characters are replaced with `?`.

**Symptom:** `TNH_CONFIG` saved with literal emoji (🛏 etc.) results in `{icon: "?", text: "Sleeps 2"}` after reload.

**Solution:** Use JS Unicode escape sequences for any non-ASCII characters inside script fields:

```js
// Instead of: {icon: "🛏", text: "Sleeps 2"}
// Use:        {icon: "\uD83D\uDECF", text: "Sleeps 2"}
```

Unicode escapes are pure ASCII and survive the save intact. The browser evaluates them as the correct character when the `<script>` executes. Common room tag emoji:

| Emoji | Sequence |
|-------|----------|
| 🛏 | `\uD83D\uDECF` |
| 🚿 | `\uD83D\uDEBF` |
| 🏙 | `\uD83C\uDFD9` |
| 💼 | `\uD83D\uDCBC` |
| 👑 | `\uD83D\uDC51` |
| 👥 | `\uD83D\uDC65` |
| 🔌 | `\uD83D\uDD0C` |
| 💡 | `\uD83D\uDCA1` |
| 🔒 | `\uD83D\uDD12` |

## `display:none` Elements Contribute 0 to scrollHeight

Elements hidden with `display:none` already have 0 `scrollHeight`. Attempting to subtract their heights does nothing.

## Do NOT Trim body.style.height in Iframes

Setting `body.style.height` to a calculated value risks content clipping and creates self-referencing measurement loops. Use `scrollHeight` or `getBoundingClientRect()` as-is. Hide unwanted elements with `display:none` to zero their contribution.

## WordPress Custom HTML Block: Don't Lose the Div

The Custom HTML block must contain both the container div AND the bootstrapper script, along with the widget config:
```html
<div id="tnh-booking-root"></div>
<script>
window.TNH_WIDGET_CONFIG = { /* schema v1 */ };
</script>
<script>var s=document.createElement('script');s.src='https://astrongpresence.com/booking-widget.js?v='+Date.now();document.head.appendChild(s);</script>
```

When editing, verify all three elements (div, config script, bootstrapper script) are present after saving. The bootstrapper uses `Date.now()` for cache busting — the URL never needs updating.

## WordPress Caching Serves Stale Widget

WordPress page caching (LiteSpeed, Cloudflare, or browser cache) can serve an old version of the Custom HTML block even after it's been updated in the editor. The HTML source shows the old script URL.

**Solution:** Purge all caches (WordPress plugin cache, Cloudflare cache) after updating the Custom HTML block. LiteSpeed caching plugin is currently **deactivated** on chillzone.astrongpresence.com.

## Beds24 Multi-Room Mode Has No Per-Room Book Buttons

When `bookpageallowmulti = 1`, the only `.multiplebookbutton` elements (2 of them) are in the booking strip area, not inside room cards.

Per-room Book buttons must be injected via JS (helper Section 4).

## Helper Halts If Config Is Missing (No Hardcoded Fallback)

`beds24-iframe-helper.js` reads per-property data (room IDs, tags, isDorm flags) from `window.TNH_CONFIG`. If this object is missing, malformed, or has the wrong `schemaVersion`, the helper **halts with a console error** rather than falling back to defaults.

**Symptom:** Booking page renders without tags, Book buttons, or price formatting. Room cards show Beds24's raw output.

**Debugging:**
1. Open console on the booking page (or inside the iframe via DevTools frame selector)
2. Look for: `[TNH] No valid config found (window.TNH_CONFIG missing or invalid). Helper halted.`
3. If present: check the property's Beds24 `customhead` field ("Insert in HTML <HEAD> bottom") for the config block

**Common causes:**
- `customhead` was edited via Claude in Chrome and Beds24 silently dropped the save (verify reload)
- Config has `schemaVersion: 0` or is missing the field
- `rooms` is not an array (e.g., accidentally written as an object)

**No fallback by design.** The helper is property-agnostic product code. A silent fallback to Chill Zone data in another property would show wrong tags to that property's guests. Fail-loud is the safer behavior.

The same pattern applies to the widget: `booking-widget.js` halts if `window.TNH_WIDGET_CONFIG` is missing or invalid.

## "Insert in HTML <BODY> bottom" Character Limit

The field has a practical limit of approximately 2,000 characters. Currently empty — all JS is loaded via "Insert in HTML <HEAD> bottom" instead.

## Two MutationObservers = Infinite Loop Risk

Two MutationObservers on `document.body` with `subtree:true` where one callback modifies the DOM will trigger the other observer, creating an infinite loop.

**Solution:** Use a single MutationObserver with an `isModifying` guard flag.

## Always Verify File Accessibility Before Debugging

**Debugging order:**
1. File accessible? (navigate to URL, confirm 200, confirm correct content and version)
2. Beds24 "Insert in HTML <HEAD> bottom" field correct? (right script src, config object present)
3. WordPress block correct? (all three elements: `<div>`, config script, bootstrapper script)
4. Hard refresh (Ctrl+Shift+R)
5. Then test functionality

**This protocol caught two deployment failures in Session 7** — helper was stuck on v10 (not v13), widget was cached at v4 (not v5).

## Use Beds24 Admin Field Names with the User

The user cannot see field IDs like `customhead` or `custombody`. Use the names visible in the Beds24 admin UI:
- `customhead` → "Insert in HTML <HEAD> bottom"
- `customheadtop` → "Insert in HTML <HEAD> top"
- `custombody` → "Insert in HTML <BODY> bottom"
- `bookingcss` → "Custom CSS"
- `customheadconfirm` → confirmation page HEAD field

## iOS Safari Iframe Viewport Expansion

Bootstrap's `.container` class sets fixed widths at desktop breakpoints (750px, 970px, 1170px). Inside an iframe on iOS Safari, any content wider than the phone screen causes the iframe to expand beyond the viewport width. CSS `@media (max-width: 767px)` then fails to trigger because the iframe reports the wider width.

**Solution:** Inject `.container{max-width:100%!important;width:auto!important;box-sizing:border-box!important}` and `.row{max-width:100%!important}` via the helper's inline style injection (Section 1). This must load before any content renders.

**This was the root cause of all mobile layout failures in Session 10.** The media query breakpoint worked on desktop but never triggered on mobile because the iframe was expanded to Bootstrap's 1170px container width.

## jQuery Event Handlers Survive DOM Moves

jQuery stores event handlers via an expando property on the element itself (not by DOM position). When you move an element with `appendChild` or `insertBefore`, the jQuery handlers travel with it and continue to fire correctly.

**Verified in Session 10:** The qty select `sr1-{roomId}` has 2 direct jQuery change handlers. Moving the element to a temp div and back preserved all handlers (2→2→2). Beds24's change handler still fired after the move, toggling `.hidden` on the from-div.

**Consequence:** When rebuilding the offer bar, MOVE Beds24's form elements (never clone). `cloneNode` does NOT copy jQuery expando data, so cloned elements lose their handlers.

**Also:** Move `.b24-multipricebox` as a whole unit, not the bare `<select>`. This preserves Beds24's `.closest('.b24-multipricebox')` traversals inside its own handlers.

## Beds24 Loads All Rooms Into One AJAX Wrapper

Beds24 renders 4 separate `#ajaxroomoffer{roomId}` wrapper divs as direct children of `.b24fullcontainer-rooms .container`. But after AJAX room loading, all `.b24room` elements end up inside a single wrapper (`#ajaxroomoffer567219` for the Chill Zone property). The other wrappers are empty.

**Consequence:** CSS `order` on the `#ajaxroomoffer` wrapper divs has no effect because only one wrapper has content. Room sorting must use DOM reordering on `.b24room` elements within their shared parent, not CSS order on wrappers.

## `div#selectors1-{roomId}` Wrapper in Offer Bar

The live DOM has an extra wrapper `div#selectors1-{roomId}` between `.multiroomshow` and `.b24-multipricebox` that is not documented in the mockup or earlier DOM references. This wrapper:
- Has no class (just an ID)
- Gets `class="hidden"` when the room is unavailable
- Collapses to 0 width unless explicitly styled
- Must be made `display:flex; flex:1; width:100%` for the offer bar layout to work

**Also:** When a room is unavailable, this wrapper gets `.hidden` class from Beds24. Any CSS that forces `display:flex` on it must also have a `.hidden` override: `[id^="selectors"].hidden { display: none !important; }`.

## Beds24 Admin AJAX Save Is Unreliable via Automation

Clicking the Save button via Claude in Chrome or setting the field value programmatically sometimes doesn't persist. The save appears to succeed but reloading the page shows the old value.

**Solution:** Always reload the admin page after saving and verify the field contains the expected value. For the Room Order setting specifically, use `$('#settingformid').submit()` via jQuery rather than clicking the button.

## GitHub Actions CI/CD

Deployment is automated via GitHub Actions. Push to `main` triggers SCP of `CSS-base.css`, `beds24-iframe-helper.js`, and `booking-widget.js` to VPS. Deploy takes ~15 seconds.

- VPS SSH on port 5771 (not default 22)
- SSH key auth (ed25519 key in GitHub Secrets as `VPS_SSH_KEY`)
- Secrets: `VPS_HOST`, `VPS_PORT`, `VPS_PATH`, `VPS_SSH_KEY`
- Workflow file: `.github/workflows/deploy.yml`
- Only triggers on changes to the 3 deploy files (not docs or other files)
