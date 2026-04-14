# Beds24 Booking Page — Known Gotchas

Hard-won lessons from Sessions 5-7. Read this before making changes.

## CSS Field Limits

**The "Custom CSS" inline field silently rejects saves above ~18-19K characters.** There is no error message. The save appears to succeed, but on reload the field contains the old content.

**Solution:** Keep "Custom CSS" under 2K. Put all real CSS in the external file.

## Tag Stripping on Programmatic Save

**"Insert in HTML <BODY> bottom" and the confirmation page HEAD field strip `<script>` and `<style>` tags when saved via Claude in Chrome.** Plain text saves fine, but `<script>...</script>` content results in empty fields after reload.

**Solution:** Provide paste-ready content to the user. They must paste it into the Beds24 admin UI manually.

## "Insert in HTML <HEAD> bottom" Does NOT Strip Tags

Unlike the BODY and confirmation fields, "Insert in HTML <HEAD> bottom" preserves `<script>` and `<style>` tags on save. This is the correct field for loading external JS via `<script src="...">`.

## `#b24scroller` is NOT the Room Container

`#b24scroller` is the **booking strip** element. The room container is `.b24fullcontainer-rooms`.

## Cloudflare Caching

The external CSS/JS files are served through Cloudflare. Cloudflare caches static assets aggressively.

**Solution:** Use versioned filenames (`CSS-base-v1.css`, `CSS-base-v2.css`, etc.) for every update. Cloudflare development mode bypasses cache but eventually expires.

## Cloudflare / LiteSpeed Cache 404 Responses

If a file URL is requested before the file is uploaded, the 404 response gets cached. Even after uploading, subsequent requests may return the cached 404.

**Solutions:**
- Use versioned filenames (already the convention)
- Purge cache after uploading new files
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

## `display:none` Elements Contribute 0 to scrollHeight

Elements hidden with `display:none` already have 0 `scrollHeight`. Attempting to subtract their heights does nothing.

## Do NOT Trim body.style.height in Iframes

Setting `body.style.height` to a calculated value risks content clipping and creates self-referencing measurement loops. Use `scrollHeight` or `getBoundingClientRect()` as-is. Hide unwanted elements with `display:none` to zero their contribution.

## WordPress Custom HTML Block: Don't Lose the Div

The Custom HTML block must contain both the container div AND the script tag:
```html
<div id="tnh-booking-root"></div>
<script src="https://astrongpresence.com/booking-widget-v6.js"></script>
```

When editing to update the script URL, verify both lines are present after saving.

## WordPress Caching Serves Stale Widget

WordPress page caching (LiteSpeed, Cloudflare, or browser cache) can serve an old version of the Custom HTML block even after it's been updated in the editor. The HTML source shows the old script URL.

**Solution:** Purge all caches (WordPress plugin cache, Cloudflare cache) after updating the Custom HTML block. LiteSpeed caching plugin is currently **deactivated** on chillzone.astrongpresence.com.

## Beds24 Multi-Room Mode Has No Per-Room Book Buttons

When `bookpageallowmulti = 1`, the only `.multiplebookbutton` elements (2 of them) are in the booking strip area, not inside room cards.

Per-room Book buttons must be injected via JS (helper v14, Section 4).

## "Insert in HTML <BODY> bottom" Character Limit

The field has a practical limit of approximately 2,000 characters. Currently empty — all JS is loaded via "Insert in HTML <HEAD> bottom" instead.

## Two MutationObservers = Infinite Loop Risk

Two MutationObservers on `document.body` with `subtree:true` where one callback modifies the DOM will trigger the other observer, creating an infinite loop.

**Solution:** Use a single MutationObserver with an `isModifying` guard flag.

## Always Verify File Accessibility Before Debugging

**Debugging order:**
1. File accessible? (navigate to URL, confirm 200, confirm correct content and version)
2. Beds24 "Insert in HTML <HEAD> bottom" field correct? (right script src)
3. WordPress block correct? (both `<div>` and `<script>` present, correct version)
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
