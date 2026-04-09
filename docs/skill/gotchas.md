# Beds24 Booking Page — Known Gotchas

Hard-won lessons from Session 5. Read this before making changes.

## CSS Field Limits

**The `bookingcss` inline field silently rejects saves above ~18-19K characters.** There is no error message. The save appears to succeed, but on reload the field contains the old content. Discovered when incrementally appending CSS rules — each append seemed to work, but the field never grew past the limit.

**Solution:** Keep `bookingcss` under 2K. Put all real CSS in the external file.

## Tag Stripping on Programmatic Save

**`custombody` and `customheadconfirm` strip `<script>` and `<style>` tags when saved via Claude in Chrome.** Saving plain text (e.g., "test123") works fine. Saving content wrapped in `<script>` or `<style>` tags results in empty fields after page reload.

This was verified by:
1. Setting `custombody` to "test123" → saved correctly
2. Setting `custombody` to `<script>...</script>` → field empty on reload

The Beds24 admin UI handles these tags correctly when the user pastes manually. The difference is likely in how Beds24's server processes the AJAX form submission — it may sanitize HTML tags from certain fields unless submitted through the UI's own mechanism.

**Solution:** Provide paste-ready content to the user. They must paste it into the Beds24 admin UI manually.

## `#b24scroller` is NOT the Room Container

The execution plan and earlier documentation referred to `#b24scroller` as the room card container. It is actually the **booking strip** element. The room container is `.b24fullcontainer-rooms`.

This caused incorrect JS targeting in early versions of the hide/reveal script.

## Cloudflare Caching

The external CSS file is served through Cloudflare (the VPS hosting domain uses Cloudflare as DNS/CDN). Cloudflare caches static assets aggressively.

**Solution:** Use versioned filenames (`CSS-base-v1.css`, `CSS-base-v2.css`, etc.) for every update. Alternatively, append `?v=N` as a cache buster parameter.

## Collapsed Content Wrappers

Beds24 wraps photo sliders and descriptions in divs with `hidden-xs hidden-sm hidden-md hidden-lg` — effectively `display: none` at all breakpoints. These are toggled by `.fakelink` elements ("pictures", "more details").

Since we hide fakelinks for cleaner UI, we must force these wrappers open:

```css
[id^="collapseslider"] { display: block !important; height: auto !important; }
[id^="collapsedesc"] { display: block !important; height: auto !important; }
```

**If you hide fakelinks without forcing open the collapse containers, photos and descriptions will be invisible.**

## MCP Tab Zero Viewport Width

When using Claude in Chrome, MCP tabs may have `window.innerWidth = 0` and `window.innerHeight = 0` because the tab is in a background group. This causes:

- All Bootstrap grid columns to collapse to 0 width
- Images to render at 0x0 pixels
- Carousel items to have 0 height despite `min-height` rules
- Flex layouts to not distribute space

**Width-dependent layout testing is unreliable in MCP tabs.** Use user screenshots for visual verification.

Selector matching, element existence, computed style values (other than width), and text content queries all work normally.

## Dorm Room Hidden Input

Dorm rooms configured for channel manager compatibility (Hostelworld, Booking.com) render their quantity selector as `input[type="hidden"]` instead of a `<select>` dropdown. The hidden input is auto-set to `value="1"`.

This means:
- No visible quantity dropdown for the guest
- No visible booking mechanism
- The `.multiplebookbutton` Book button doesn't activate (requires explicit user selection of a quantity)
- The guest selector (`select[id^="naa"]`) only has 2 options: "0 Guests" / "1 Guest"

**This cannot be fixed by CSS alone.** Requires JS injection to create a visible booking control.

**Do not change the dorm's Beds24 room configuration** — it affects channel manager integrations with Hostelworld, Booking.com, etc.

## Beds24 "Add Module" Dropdown

The Layout page has "add module" dropdowns for each section (Room Top, Room Bottom, Property Top, etc.). Setting the dropdown value programmatically and submitting the form does NOT add the module. Beds24's handler requires actual UI interaction.

**Solution:** The user must add modules manually through the Beds24 admin UI.

## Multiple Room Booking Behavior Changes

Setting "Multiple Room Booking" to "Enabled" (`bookpageallowmulti = 1`) has cascading effects:

1. **Removes global guest count** from the booking strip
2. **Adds per-room quantity dropdowns** (`select[id^="sr1-"]`) — except for dorms (see above)
3. **Adds per-room guest count dropdowns** (`select[id^="naa"]`)
4. **Makes `.multiplebookbutton` visible** (was hidden with "Guest Can Choose")
5. **The strip Book button becomes the form submit** — it's the same `.at_bookingbut` class as the multi-room buttons

Hiding `.at_bookingbut` globally will break the booking flow. Target specifically: `.b24-bookingstrip .at_bookingbut` for the strip button, `.multiplebookbutton .at_bookingbut` for the booking buttons.

## Per-Occupancy Price Display

When a room has max occupancy > 1, Beds24 renders separate price elements for each occupancy level:

- `#from-1-{roomId}` — the "from €XX" price (this is the one to keep)
- `#price-1-1-{roomId}` — price for 1 guest
- `#price-2-1-{roomId}` — price for 2 guests  
- `#price-3-1-{roomId}` — price for 3 guests

Hide the per-occupancy breakdown with:
```css
[id^="price-"][class*="b24-roomprice"] { display: none !important; }
```

## CSS `string.replace()` Failures in Claude in Chrome

When editing the `bookingcss` textarea via Claude in Chrome, `String.prototype.replace()` can silently fail if the search string doesn't match exactly (whitespace differences, encoding). The value appears unchanged but no error is thrown.

**Solution:** When making targeted edits, verify the replacement actually happened by checking the string length or searching for the new content. When in doubt, append new rules rather than replacing old ones. Better yet, edit the external CSS file and re-upload.
