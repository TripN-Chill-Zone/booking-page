# Offer Bar Rebuild — Reviewer Context

Supplementary context for adversarial review of the offer-bar rebuild plan. Answers specific questions about scope, architecture, and bug classification.

---

## 1. Bugs and requirements driving the offer-bar work

These are the specific issues that led to the offer-bar rebuild decision, in order of severity:

### Alignment bugs (the primary pain)

| Bug | Description | Attempted fixes | Result |
|---|---|---|---|
| Book button shifts left after qty selection | On mobile, selecting a quantity causes the Book button to drop to a new line and left-align instead of staying right-aligned | CSS flex-wrap with `order` values, `justify-content: flex-end`, `justify-content: space-between`, `flex-basis: 100%`, explicit `width: 100%` on every parent, `.tnh-offer-row` wrapper div | None worked consistently across all rooms and states |
| "Select" label and dropdown overlap Book button | After qty selection on non-dorm rooms, the form-inline content crowds into the book-group | Same flex-wrap attempts as above | Same result |
| Inconsistent layout between dorm and standard rooms | Dorm rooms have a different offer bar structure (guest selector vs. qty dropdown, different multipricebox arrangement) requiring separate CSS paths | Separate CSS rules for dorm vs. standard, `fixDormRooms()` JS function | Dorm works; standard rooms don't |

### Price display bugs

| Bug | Description | Classification |
|---|---|---|
| Total price shown before qty selection | The total (e.g., €90.00) appeared next to Book before any quantity was selected. Should only appear after selection. | JS behavior — `injectBookButtons()` was populating `.tnh-total-price` with the initial total |
| From-price disappears after qty selection | "from €16.00 / night" vanished when Beds24 added `.hidden` class to the from-div, causing the card to shrink | Mixed — Beds24 behavior (adding `.hidden`) + our CSS (not overriding it) + JS (`enhancePrices()` was hiding it intentionally) |
| Price per night not showing for 1-night stays | `enhancePrices()` only calculated per-night when nights > 1 | JS behavior |

### Structural issues (root causes)

| Issue | Description |
|---|---|
| `div#selectors1-{roomId}` wrapper | Undocumented wrapper between `.multiroomshow` and `.b24-multipricebox` that collapses to 0 width, breaking the flex layout |
| Beds24's `.hidden` class toggling | Beds24 adds/removes `.hidden` on the from-price div when qty changes, fighting our `display` overrides in a MutationObserver loop |
| Bootstrap `.container` fixed widths | On iOS Safari in iframe, the container expands to 750/970/1170px, preventing mobile media queries from firing (FIXED — not part of rebuild) |
| All rooms in one AJAX wrapper | Beds24 loads all rooms into a single `#ajaxroomoffer` div, making CSS `order` on wrapper divs ineffective for sorting (FIXED with DOM reorder — not part of rebuild) |

### Requirements (not bugs)

| Requirement | Status |
|---|---|
| Room sorting: cheapest first, unavailable at bottom | DONE — `sortRooms()` in Section 8, working |
| Short room descriptions | DONE — updated in Beds24 admin |
| Per-night price display | PARTIALLY WORKING — shows correctly before qty selection, needs rebuild for consistent display |
| Hostelworld-like density | Design target — the rebuilt offer bar should feel tight and information-rich, not over-spaced |

---

## 2. What's configured in Beds24's Style/Layout/Content admin fields

### Style panel (20 color fields)
All 20 color pickers are set to the Trip'N'Hostel brand palette. These generate inline `<style>` blocks in the page `<head>`. Our external CSS overrides most of them with `!important`, but the Style panel values provide baseline branding.

### Layout page
- **Template 6, Layout 6** — standard Beds24 booking page layout
- **Room Top modules**: Photo Slider (module ID unknown, default), Room Description
- **Room Bottom modules**: Room Features (module 106) — currently hidden by CSS because its default styling doesn't match our design; tag data is extracted and re-rendered by our JS instead
- **Multiple Room Booking**: Enabled (`bookpageallowmulti = 1`) — this is what creates the per-room qty dropdowns
- **Room Order**: Set to "Cheapest First" in admin (but doesn't take effect — our JS handles sorting)

### Content page
- **Room descriptions**: Updated to short approved versions (Session 10)
- **Room names**: All correct including "Double Room with Shared Bathroom"
- **Property description**: Set (used on other Beds24 pages, not on booking page)
- **Policies**: Set (cancellation, general — shown on checkout page, not room page)

### Developer page
- **"Insert in HTML <HEAD> top"**: Google Fonts `<link>` tag for Lexend + Lexend Giga
- **"Insert in HTML <HEAD> bottom"**: `Date.now()` bootstrapper loading `beds24-iframe-helper.js`
- **"Custom CSS" (bookingcss)**: ~1,500 chars of critical CSS (FOUC prevention) + CSS variable overrides for brand colors
- **"Insert in HTML <BODY> bottom"**: Empty (previously had hide/reveal JS, now handled by helper)

### Are they underused?

The Style panel does its job (baseline colors) and the Content fields are populated. The Layout page is configured correctly but some of its modules (Room Features) are hidden because their default rendering doesn't match our design — we extract the data and re-render it ourselves.

**The main limitation is that Beds24's admin provides no way to customize the offer bar layout.** The offer bar structure (Select label, qty dropdown, price display, book button arrangement) is hardcoded in Beds24's frontend JS/HTML. The Style panel can change colors but not structure. The Layout page can reorder modules but not modify the internal layout of the offer section. This is why we need JS to rebuild it — there's no admin-only path to the layout we want.

---

## 3. How many properties this ships to

**Currently: 4 properties** under the Trip'N'Hostel brand. The Chill Zone property in Tirana is the first being configured; the same booking page architecture (widget + iframe + helper) is intended for all 4 properties.

- The CSS uses variables for brand customization (colors, fonts) so per-property theming is a variable override, not a CSS rewrite
- The helper JS has one hardcoded section: `ROOM_TAGS` (room IDs → tag arrays). For rollout, this would need per-property configuration
- The widget JS has a `CONFIG` block with property-specific values (property ID, CSS file URL, brand colors)

**The ROI calculus is 4 properties.** The offer-bar rebuild applies to all properties since they all use the same Beds24 booking engine with the same DOM structure. Getting the offer bar right once means it works everywhere.

---

## 4. Serving architecture

**Iframe embed on WordPress.** Fully documented in CLAUDE.md and SKILL.md.

Guest flow:
1. WordPress "Book A Room" page has a custom widget (JS)
2. Widget renders date/guest picker
3. On "Search Rooms", widget creates an iframe pointing to `beds24.com/booking2.php?ownerid=...&propid=...&referer=widget&cssfile=...`
4. Helper JS inside iframe detects `referer=widget` + iframe context → hides Beds24 chrome (booking strip, headers, footer)
5. Rooms display inside iframe on WordPress page
6. Guest clicks Book → `form.target="_top"` breaks out of iframe → Beds24 checkout takes over full browser tab
7. Back button returns to WordPress page

**Not a subdomain, not a direct domain.** Beds24 runs on `beds24.com`, WordPress runs on `chillzone.astrongpresence.com`. The iframe crosses domains. The external CSS and JS files are hosted on `astrongpresence.com` (same domain as WordPress).

---

## 5. The actual `.tnh-offer-bar` markup and CSS

Already documented in `offer-bar-rebuild-plan.md`:
- **Target DOM**: Section 2.1
- **Target CSS**: Step 11
- **State machine**: Section 2.2

---

## 6. Bug classification: CSS-only vs. behavior changes required

| Bug / Issue | CSS-only fix possible? | Why or why not |
|---|---|---|
| Book button shifts left after qty selection | **No** | The issue is that Beds24's DOM structure (nested flex containers with `flex-wrap`, an undocumented wrapper div, and dynamically toggled `.hidden` classes) makes it impossible to achieve the target layout with CSS alone. We tried 6+ CSS approaches across 2 sessions. The fundamental problem is that the parent flex container has children that wrap unpredictably, and `justify-content` / `margin-left: auto` don't work reliably on the second wrapped line across browsers. |
| "Select" label overlaps Book button | **No** | Same root cause — the `form-inline` and `book-group` elements share a wrapped flex line without enough structural control to keep them separated. |
| Total price shown before qty selection | **No** | This is JS behavior — the total is being populated into the DOM at injection time. CSS can hide it with `display: none` but can't conditionally show it only when Beds24 adds `.hidden` to the from-div (no parent selector that detects `.hidden` on a sibling). |
| From-price disappears after qty selection | **Partially** | CSS can override `display: none !important` on the from-div to keep it visible. But Beds24's MutationObserver-driven JS keeps re-adding `.hidden`, creating a fight. Our JS already overrides this, but the override interacts with the price display logic in ways that are hard to separate. |
| Inconsistent dorm vs. standard layout | **No** | Dorms have a fundamentally different DOM structure (hidden input + guest selector in a separate multipricebox). The `fixDormRooms()` function already restructures the dorm DOM. The rebuild unifies both paths. |
| Price per night not showing for 1-night stays | **No** | JS logic issue in `enhancePrices()`. |
| Per-occupancy price boxes leaking through | **Yes** | Already fixed with `.b24-multipricebox.hidden { display: none !important }`. This is a CSS-only fix that works and stays in the rebuild. |
| Fakelink visibility | **Yes** | Already fixed with `.fakelink { display: none !important }`. Stays as-is. |
| Collapsed sections (photos, descriptions) | **Yes** | Already fixed with `[id^="collapseslider"], [id^="collapsedesc"] { display: block !important }`. Stays as-is. |

**Summary:** Of the 6 active bugs driving the rebuild, 0 are CSS-only fixable. The CSS-only issues (per-occupancy leakage, fakelinks, collapsed sections) were already solved in earlier sessions and aren't part of the rebuild scope. The rebuild addresses the structural and behavioral issues that CSS alone cannot solve.
