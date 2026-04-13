# Session Handoff 6 — Beds24 Booking Page

## Goal

Replace the Beds24 WordPress plugin iframe embed with a custom booking widget. Fix the iOS double-scroll issue. Implement a booking flow where rooms display inline on the WordPress page and checkout breaks out to full-page Beds24.

---

## What Was Accomplished in Session 6

### Custom Booking Widget — Deployed, Partially Working

Built a self-injecting JS widget (`booking-widget-v5.js`) hosted on the VPS. The WordPress page uses a Custom HTML block with just:

```html
<div id="tnh-booking-root"></div>
<script src="https://astrongpresence.com/booking-widget-v5.js"></script>
```

The widget:
- Renders a branded date picker (check-in, check-out, guests) with Chill Zone styling (Lexend fonts, green/amber palette)
- On "Search Rooms", loads the Beds24 booking page in a hidden iframe below the widget
- Shows a loading spinner until rooms render (height > 500px threshold via postMessage)
- Displays a summary bar ("14 Apr 2026 → 16 Apr 2026 · 2 nights · 2 guests") with a "Clear Search" button
- The iframe is `scrolling="no"` — the parent page scrolls, not the iframe

### Beds24 Iframe Helper — Deployed, Issues Remaining

Built a companion script (`beds24-iframe-helper-v13.js`) loaded via Beds24's `customhead` field. When the booking page detects `referer=widget` in the URL and is inside an iframe, it:
- Hides the booking strip, property headers/footers, and bottom summary bar
- Reports page height to parent via `postMessage` for iframe sizing
- Sets `form.target = '_top'` so form submission breaks out of the iframe
- Injects per-room Book buttons (since Beds24 multi-room mode has none)
- Fixes dorm room booking (unhides guest selector, relabels "Guests" → "Beds")

### Architecture Decision: Iframe + Breakout

Evaluated three approaches:
1. **New tab for everything** — rejected because rooms should appear inline on the WordPress page
2. **Full iframe flow** — rejected because confirmation page breaks inside iframe (wrong height, wrong scroll position, needs separate styling)
3. **Iframe for display, breakout for checkout** — CHOSEN. Rooms display in iframe, `target="_top"` on the form makes checkout take over the full browser tab. Back button returns to WordPress page with widget ready for new search.

### What's Working

- ✅ Date/guest widget renders correctly on desktop and mobile
- ✅ Rooms load in iframe after search
- ✅ Form submission breaks out of iframe to full-page Beds24 checkout
- ✅ Back button returns to WordPress Book A Room page
- ✅ iOS double-scroll issue resolved (iframe has scrolling="no")
- ✅ Excess whitespace below rooms was fixed (v6 approach) but may have regressed

### What's NOT Working (Priority Order)

1. **Helper JS changes not taking effect** — The v13 helper was uploaded and `customhead` was updated, but the live page still shows v12 behavior (or earlier). Likely cause: cached JS file. **First action next session: verify file content on VPS matches intended content, purge any caches, confirm the correct version loads in browser.**

2. **No per-room Book buttons visible** — The `injectBookButtons` function exists in the helper but isn't rendering buttons on the live page. When tested manually via console on the Beds24 page, injection works perfectly (4 buttons created). The issue is timing — buttons inject before rooms load via AJAX, and the MutationObserver may not be re-triggering properly due to the `isModifying` guard.

3. **Dorm dropdown mispositioned** — Shows on the left instead of right-aligned like other rooms' quantity dropdowns. The `fixDormRooms` function sets `text-align:right` on the price box but this isn't sufficient.

4. **Bottom summary bar still visible** — `.b24fullcontainer-proprow11` should be hidden (it's redundant now that we have per-room Book buttons) but the hide rule may not be applying. This creates a duplicate CHECK IN / CHECK OUT / Book section.

5. **Page cut off at bottom** — The last room (Double Room) gets clipped. Previous versions used `body.style.height` trimming which caused this; v13 removed trimming but the fix may not have deployed.

6. **"Close" button still says "Close"** — The widget v5 has "Clear Search" but may not have deployed if the WordPress block still references v4.

7. **Slow initial load on desktop** — Rooms take several seconds to appear. The loading spinner stays visible until height > 500px, which is correct, but the perceived delay is long. iOS loads faster.

---

## File Architecture

### VPS (astrongpresence.com root)

| File | Purpose | Current Version |
|---|---|---|
| `booking-widget-v5.js` | WordPress-side widget (date picker, iframe loader, height sync) | v5 (may not be deployed) |
| `beds24-iframe-helper-v13.js` | Beds24-side helper (hide chrome, height report, form target, dorm fix, book buttons) | v13 (may not be deployed) |
| `CSS-base-v2.css` | External CSS for Beds24 booking page styling | v2 (unchanged this session) |

### WordPress (chillzone.astrongpresence.com)

**Book A Room page** — Custom HTML block:
```html
<div id="tnh-booking-root"></div>
<script src="https://astrongpresence.com/booking-widget-v5.js"></script>
```

The Beds24 WordPress plugin is still installed but the iframe embed was replaced with our custom widget.

### Beds24 Admin (property 271142)

**Developer page fields:**
| Field | Content |
|---|---|
| `customhead` | `<script src="https://astrongpresence.com/beds24-iframe-helper-v13.js"></script>` |
| `customheadtop` | Google Fonts `<link>` for Lexend + Lexend Giga (unchanged) |
| `bookingcss` | Critical CSS payload + Chill Zone variable overrides, 1,545 chars (unchanged) |
| `custombody` | Hide/reveal JS from Session 5, ~2,442 chars (unchanged) |

---

## Key Technical Findings

### File Deployment Verification Protocol

**ALWAYS verify file accessibility before debugging anything else.**

1. Navigate directly to the file URL in browser
2. Confirm it returns 200 (not 404)
3. Confirm the file content matches what was intended (check version comment, key function names)
4. If 404: file not uploaded, or cached 404 (LiteSpeed/Cloudflare caches 404 responses)
5. If wrong content: wrong file uploaded, or cached stale version

### Beds24 Multi-Room Mode Has No Per-Room Book Buttons

When `bookpageallowmulti = 1`, Beds24 renders only 2 `.multiplebookbutton` elements — both in the booking strip area (`.multiroomshow`), none inside room cards. The `.at_bookingbut` buttons are children of these strip-level containers.

This means per-room Book buttons MUST be injected via JS. The injection point is `.b24-multipricebox` inside each `.offer` section.

### `customhead` Field Does Not Strip Tags

Unlike `custombody` and `customheadconfirm` (which strip `<script>` and `<style>` tags on programmatic save), the `customhead` field ("Insert in HTML <HEAD> bottom") preserves all tags. This is the correct field for loading external JS via `<script src="...">`.

### `custombody` Field Has ~2000 Character Limit

The existing hide/reveal JS from Session 5 uses 2,442 chars. The field appears to have a ~2000 char limit (reported by user), though it currently holds 2,442 chars (possibly set before the limit was enforced, or the limit is slightly higher).

### MutationObserver Infinite Loop Risk

Two MutationObservers on `document.body` with `subtree:true` where one observer's callback modifies the DOM (e.g., setting `body.style.height`) will trigger the other observer, creating an infinite loop that freezes the page.

**Solution:** Use a single MutationObserver with an `isModifying` guard flag. Set the flag before DOM modifications, release after a timeout (500ms). The observer callback checks the flag and skips if modifications are in progress.

### Height Measurement in Cross-Origin Iframes

| Approach | Result | Notes |
|---|---|---|
| `document.documentElement.scrollHeight` | Works | Returns full page height including hidden element space |
| `element.offsetHeight` / `element.offsetTop` | Returns 0 in MCP tabs | Zero-viewport issue; works in real browsers |
| `element.getBoundingClientRect()` | Returns 0 in MCP tabs | Same zero-viewport issue |
| `body.style.height = X` (trimming) | Causes clipping | If measurement undershoots, content is permanently hidden |
| `display:none` elements | Contribute 0 to scrollHeight | Subtracting their height does nothing |

**Recommended approach:** Use `scrollHeight` as-is. Hide unwanted elements with `display:none` (which zeroes their scrollHeight contribution). Do NOT trim body height — risk of clipping outweighs benefit.

### Cloudflare/LiteSpeed Cache 404 Responses

If a JS file URL is requested before the file is uploaded, the 404 response gets cached. Even after uploading the file, subsequent requests may still return 404. Solutions:
- Use versioned filenames (recommended — already doing this)
- Purge cache after uploading
- Add cache-buster query parameter (`?v=N`)

### WordPress Custom HTML Block Gotcha

The block must contain BOTH the `<div>` container AND the `<script>` tag. When editing the block to update the script URL, it's easy to accidentally delete the div. Always verify both lines are present:
```html
<div id="tnh-booking-root"></div>
<script src="https://astrongpresence.com/booking-widget-v5.js"></script>
```

---

## Widget Configuration (Per-Property)

The booking widget has a CONFIG block at the top of the JS file:

```javascript
var CONFIG = {
  ownerid: '141266',
  propid:  '271142',
  cssfile: 'https://astrongpresence.com/CSS-base-v2.css',
  minNights: 2,
  maxNights: 90,
  defaultNights: 2,
  // ... brand colors and fonts
};
```

For rollout to other properties, create per-property widget files with updated CONFIG values (or refactor to read config from a data attribute on the root div).

---

## Recommended Next Steps (In Order)

### 1. Verify deployment
- Confirm `booking-widget-v5.js` is on VPS with correct content (search for "Clear Search" text)
- Confirm `beds24-iframe-helper-v13.js` is on VPS with correct content (search for "proprow11" in the hide list)
- Confirm WordPress HTML block has both div and script tag pointing to v5
- Confirm Beds24 `customhead` points to v13
- Hard refresh and test

### 2. Fix per-room Book buttons
- If v13 deploys correctly, verify buttons appear
- If not, debug timing: the `injectBookButtons` function works when called manually — the issue is when it runs relative to AJAX room loading
- Consider increasing the periodic interval or adding a longer initial delay

### 3. Fix dorm dropdown position
- Inspect the dorm's `.b24-multipricebox` in a real browser (not MCP tab)
- Compare its DOM structure to a private room's price box
- The dorm's guest selector may be in a different container position than assumed

### 4. Fix page height
- With v13's approach (no body trimming, just scrollHeight), height should be correct
- If excess whitespace returns, identify which visible element is creating the gap

### 5. Visual QA pass
- Once per-room buttons and dorm are fixed, do a thorough visual check on desktop and mobile
- Verify the full flow: search → rooms appear → click Book → checkout loads full page → back button returns to WordPress

---

## Documents to Upload Next Session

1. `session-handoff-6.md` — this document
2. `CLAUDE.md` — updated with widget architecture and file locations
3. `gotchas.md` — updated with new findings
4. `admin-guide.md` — updated with `customhead` field info
5. `dom-structure.md` — updated with Book button location info
6. `SKILL.md` — updated architecture overview
7. `beds24-execution.md` — unchanged (source of truth for phases)

Optional:
- `booking-widget-v5.js` — current widget source
- `beds24-iframe-helper-v13.js` — current helper source

---

## Notes for Next Session

The immediate priority is getting the v13 helper deployed and verified. Many of the current issues may already be fixed in v13 — they just haven't taken effect on the live page.

The debugging pattern should be:
1. **Check file accessibility** (navigate to URL, confirm 200 and correct content)
2. **Check Beds24 field** (confirm `customhead` has correct script src)
3. **Check WordPress block** (confirm both div and script tag present)
4. **Hard refresh** (Ctrl+Shift+R)
5. **Then test functionality**

Do not skip step 1. If the file isn't accessible, everything else is irrelevant.
