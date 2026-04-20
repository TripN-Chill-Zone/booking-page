# Session Handoff 11

**Date:** 2026-04-21
**Outgoing session:** review and documentation pass (Opus 4.7, chat)
**Incoming session:** v3 implementation (Claude Code)
**Status:** Ready to implement

---

## Read these first, in order

1. `docs/retrospective.md` — Active Rules section. These rules take 
   precedence over any instruction here.
2. This file.
3. `docs/skill/SKILL.md` — working discipline and skill index.
4. `docs/mockup.html` — v13. This is the design source of truth and the 
   implementation reference.

After reading these, read whichever references the task requires 
(dom-structure.md, helper-js-architecture.md, property-config.md, 
gotchas.md).

---

## What was decided in the review pass

The previous multi-session cycle produced three failed proposals 
(offer-bar rebuild, mirror controls, widget-first layout redesign). 
All three have been archived to `docs/archive/` and do not represent 
current plans.

What the review pass established:

1. **The mockup (v13) works on the live Beds24 page** when its CSS 
   and JS are applied directly, with one selector fix. Validated 
   Session 12 at iframe width 390px.

2. **The helper JS rebuild is being reverted.** The pre-rebuild state 
   lives at commit `420dd06`. The next session retrieves that commit's 
   helper and pairs it with fresh CSS derived from the mockup.

3. **The widget's max-width is being widened from 700px to 1290px.** 
   This matches the Kadence theme content width and enables the 
   mockup's desktop layout to render on actual desktop screens. The 
   Beds24-side mobile breakpoint stays at 767px, so iPhone portrait 
   gets mobile and iPhone landscape/tablets/desktop get desktop.

4. **ROOM_TAGS and other per-property config are being externalized 
   for both the helper AND the widget.** Both are becoming 
   property-agnostic product code. Helper reads `window.TNH_CONFIG` 
   set in each property's Beds24 `customhead`; widget reads 
   `window.TNH_WIDGET_CONFIG` set in each property's WordPress 
   Custom HTML block. Separate config objects because they run in 
   different origins. Full architecture below.

5. **Cache-busting stays on `Date.now()` for now.** It's a development 
   tactic for serving fresh files during iteration, not a production 
   strategy. It gets replaced with versioned filenames or equivalent 
   before Chill Zone goes live to real customers.

---

## What the next session must do

Single Claude Code session. Scope below.

### Work items

**1. Revert helper JS to pre-rebuild state**

```bash
git show 420dd06:beds24-iframe-helper.js > beds24-iframe-helper.js
```

That commit is one before the rebuild started. The resulting file is 
~588 lines with Sections 1, 3, 4, 5, 6, 7, 8 intact. No reconstruction 
needed.

**2. Externalize ROOM_TAGS and per-property config**

Modify the reverted helper so ROOM_TAGS and any other Chill 
Zone-specific data are read from `window.TNH_CONFIG` rather than 
hardcoded.

Helper initialization pattern:

```js
(function() {
  var config = resolveConfig();
  if (!config) {
    console.error('[TNH] No config found (window.TNH_CONFIG missing or invalid). Helper halted.');
    return;
  }
  // rest of helper uses config.rooms, config.propertyId, etc.
})();

function resolveConfig() {
  if (window.TNH_CONFIG && isValidConfig(window.TNH_CONFIG)) {
    return window.TNH_CONFIG;
  }
  // Future: fetch path for hosted-tier clients will be added here.
  return null;
}

function isValidConfig(c) {
  return c && c.schemaVersion === 1 && Array.isArray(c.rooms);
}
```

**Config schema v1:**

```js
window.TNH_CONFIG = {
  schemaVersion: 1,
  propertyId: "chillzone",      // arbitrary string, for logging/debug
  rooms: [
    {
      id: 567218,
      isDorm: false,
      tags: [
        { icon: "🛏", text: "Sleeps 2" },
        { icon: "🚿", text: "Ensuite" },
        { icon: "🏙", text: "City View" },
        { icon: "💼", text: "Work Desk" },
        { icon: "👑", text: "Premium" }
      ]
    },
    {
      id: 567219,
      isDorm: true,
      tags: [
        { icon: "🛏", text: "1 Bed" },
        { icon: "👥", text: "4-Bed Dorm" },
        { icon: "🔌", text: "Power Outlet" },
        { icon: "💡", text: "Reading Light" }
      ]
    },
    {
      id: 567220,
      isDorm: false,
      tags: [
        { icon: "🛏", text: "Sleeps 1" },
        { icon: "🚿", text: "Shared Bathroom" },
        { icon: "💼", text: "Work Desk" },
        { icon: "🔒", text: "Private" }
      ]
    },
    {
      id: 567221,
      isDorm: false,
      tags: [
        { icon: "🛏", text: "Sleeps 2" },
        { icon: "🚿", text: "Shared Bathroom" },
        { icon: "💼", text: "Work Desk" },
        { icon: "🔒", text: "Private" }
      ]
    }
  ]
};
```

No hardcoded fallback for Chill Zone data. If the config is missing, 
the helper halts with a console error. This is deliberate — the helper 
is now product code and must never contain client-specific data.

**3. Create config objects for all four Trip'N'Hostel properties**

The Chill Zone config is above. The other three Trip'N'Hostel 
properties will get theirs filled in during their rollout. Create 
placeholder structures for them in `docs/skill/property-config.md` 
with `TODO: fill in at rollout` markers where data is missing.

**4. Write CSS-base.css from the mockup**

Source: `docs/mockup.html` v13. Extract the CSS from the `<style>` 
block. Paste into `CSS-base.css`. Add one fix:

```css
[id^="selectors1-"] {
  display: flex !important;
  flex: 1 !important;
  min-width: 0 !important;
}
[id^="selectors1-"].hidden {
  display: none !important;
}
```

This is the only modification to the mockup's CSS required for the 
live page. See `docs/skill/dom-structure.md` §6.1 for why.

Do not rewrite or restructure the mockup's CSS. Port it directly. 
Any creative decisions about "this could be cleaner" are out of scope 
for this session — ship the mockup's working CSS as-is.

**5. Widen the booking widget**

In `booking-widget.js`, change the `.tnh-booking-widget` rule's 
`max-width` from `700px` to `1290px`.

```js
// Before (line ~43):
'.tnh-booking-widget { max-width: 700px; ... }'

// After:
'.tnh-booking-widget { max-width: 1290px; ... }'
```

**6. Externalize the widget's per-property config**

The widget (`booking-widget.js`) currently has hardcoded Chill Zone 
values (owner ID, property ID, brand colors). These must be 
externalized before property 2 rollout. Doing this in the same 
session as the helper externalization keeps the two config paths 
consistent.

Add a parallel config object, read at widget init:

```js
function resolveWidgetConfig() {
  if (window.TNH_WIDGET_CONFIG && isValidWidgetConfig(window.TNH_WIDGET_CONFIG)) {
    return window.TNH_WIDGET_CONFIG;
  }
  // Future: fetch path for hosted-tier clients will be added here.
  return null;
}

function isValidWidgetConfig(c) {
  return c 
    && c.schemaVersion === 1 
    && typeof c.ownerId === 'string' 
    && typeof c.propertyId === 'string';
}

// At init:
var widgetConfig = resolveWidgetConfig();
if (!widgetConfig) {
  console.error('[TNH Widget] No config found (window.TNH_WIDGET_CONFIG missing or invalid). Widget halted.');
  return;
}
```

**Widget config schema v1:**

```js
window.TNH_WIDGET_CONFIG = {
  schemaVersion: 1,
  propertyId: "chillzone",           // matches TNH_CONFIG for debug consistency
  ownerId: "141266",                 // string, used in iframe URL
  beds24PropId: "271142",            // string, used in iframe URL
  colors: {
    primary: "#E7A35C",
    secondary: "#6DA17D",
    text: "#2D482D",
    border: "#EDF2F7"
  },
  fonts: {
    body: "Lexend"
  }
};
```

Replace every hardcoded reference in `booking-widget.js` with a 
`widgetConfig.*` lookup. No hardcoded Chill Zone fallback.

Decision: **separate config object, not extension of `TNH_CONFIG`.** 
Rationale: the widget runs on WordPress (parent page), the helper runs 
on Beds24 (iframe). They're in different origins and can't share a 
config object at runtime. Even though they're deployed together, their 
config inputs are logically separate.

**7. Update Chill Zone's WordPress Custom HTML block**

The widget's Custom HTML block needs the widget config object before 
the bootstrapper:

```html
<div id="tnh-booking-root"></div>
<script>
window.TNH_WIDGET_CONFIG = {
  schemaVersion: 1,
  propertyId: "chillzone",
  ownerId: "141266",
  beds24PropId: "271142",
  colors: {
    primary: "#E7A35C",
    secondary: "#6DA17D",
    text: "#2D482D",
    border: "#EDF2F7"
  },
  fonts: { body: "Lexend" }
};
</script>
<script>
var s = document.createElement('script');
s.src = 'https://astrongpresence.com/booking-widget.js?v=' + Date.now();
document.head.appendChild(s);
</script>
```

All three lines (div, config script, bootstrapper script) must be 
present. Verify after saving in WordPress editor.

**8. Update Chill Zone's Beds24 `customhead` field**

Current `customhead` contains the bootstrapper that loads the helper 
JS. Add the config object before the bootstrapper:

```html
<script>
window.TNH_CONFIG = {
  schemaVersion: 1,
  propertyId: "chillzone",
  rooms: [ /* full config from item 2 above */ ]
};
</script>
<script>
var s = document.createElement('script');
s.src = 'https://astrongpresence.com/beds24-iframe-helper.js?v=' + Date.now();
document.head.appendChild(s);
</script>
```

`customhead` does NOT strip `<script>` tags, so this can be saved 
programmatically. But verify the save persists (see gotchas).

**9. Deploy**

Push to main. GitHub Actions handles deployment of the three 
JS/CSS files.

---

## Acceptance criteria

Do not close this out until all these pass. Test on the actual 
WordPress widget page, not the direct Beds24 URL.

### Must pass

- [ ] Widget iframe renders at 1288px on viewports ≥1292px 
  (previously capped at 698px)
- [ ] Widget iframe renders at viewport-width-minus-2 on 
  viewports <1292px
- [ ] At iPhone portrait (390px viewport, ~388px iframe), mobile 
  layout renders correctly and matches the mockup at 390px
- [ ] At iPhone landscape (844px viewport, ~842px iframe), desktop 
  layout renders and matches the mockup at >768px
- [ ] At desktop viewport 1536px (iframe 1288px), desktop layout 
  renders and is visually correct
- [ ] Tag row does not overlap thumbnail on any room at any tested 
  width
- [ ] Book button right-aligns correctly on every card, pre- and 
  post-qty-selection
- [ ] All 4 rooms bookable end-to-end: search → Book → checkout → 
  back button returns to WordPress
- [ ] Dorm room (567219) bookable with correct Beds selector
- [ ] Network POST on Book submit contains expected `sr1-` values 
  for private rooms and `naa1-` for dorms
- [ ] Console shows no errors on any room at any tested width
- [ ] If `window.TNH_CONFIG` is missing or malformed, helper halts 
  with a console error (test by temporarily removing the config 
  object and reloading)
- [ ] If `window.TNH_WIDGET_CONFIG` is missing or malformed, widget 
  halts with a console error (same test, on WordPress side)

### Visual criteria

- [ ] Mobile layout (388px) matches mockup v13 desktop test for 
  card structure, tag placement, offer bar alignment
- [ ] Desktop layout (≥768px iframe) matches mockup v13 for 
  thumbnail/desc side-by-side placement, tag placement, offer bar

### Explicit non-goals for this session

Do NOT do any of the following:

- Do not add monitoring or automated DOM-drift detection (out of scope)
- Do not rewrite the MutationObserver or add optimistic rendering 
  (the pre-rebuild helper's observer works; leave it)
- Do not move to versioned filenames for cache busting (deferred; 
  `Date.now()` stays for now)
- Do not add a hosted-fetch path for config (deferred until first 
  hosted-tier client)
- Do not restructure or "clean up" the mockup's CSS — port it as-is
- Do not touch the MutationObserver observer guard patterns; they 
  work
- Do not update configs for the three other Trip'N'Hostel properties 
  (Chill Zone is the test case; the other three get their configs at 
  rollout time)
- Do not modify `card-rebuild-proposal.md`, `mirror-controls-proposal.md`, 
  or `offer-bar-rebuild-plan.md` — they're archived

---

## Known risks and where they'll show up

**Risk: Mockup's desktop CSS hasn't been validated against the live 
Beds24 page at iframe widths 768-1288px.** The mockup has only been 
tested against its own self-contained HTML at those widths, and 
against the live page at 390px (mobile). The live page's DOM has 
elements the mockup's simplified DOM doesn't (see dom-structure.md 
§3). Expect potential surprises. If desktop layout breaks, diagnose 
using the Verification 2 pattern from Session 12: inject the mockup's 
CSS into the live page, measure with computed styles, identify the 
specific gap, fix the smallest thing.

**Risk: The widget's new max-width (1290px) exposes desktop layout 
in environments where it hadn't been visible.** Anyone testing the 
page during development at >1290px viewport has been seeing 698px 
iframe until now. With the change, they start seeing desktop CSS. 
If the desktop CSS has bugs, they become visible immediately after 
deploy.

**Risk: Config system introduces failure modes the current helper 
doesn't have.** If `window.TNH_CONFIG` is set incorrectly (e.g., 
wrong schemaVersion, missing `rooms` array), the helper halts and 
the page renders unstyled. Test the halt path explicitly before 
closing out.

**Risk: `customhead` save might drop the config.** `customhead` 
doesn't strip `<script>` tags on programmatic save (unlike 
`custombody`), but Beds24 admin has other silent save failures. 
After saving the config, reload the admin page and verify the 
content persisted.

---

## Questions that came up in the review pass and stay open

These aren't blocking but should be addressed at some point:

- **The `<script>` and `div.hidden` children of `.panel-body.b24panel`** 
  are uncharacterized. They're safely ignorable for layout, but if they 
  matter later, they need investigation.
- **Desktop layout at iframe widths 1024-1288px** hasn't been visually 
  validated even in the mockup. If it looks odd, the mockup may need 
  iteration before further property rollouts.
- **Cache-busting strategy for production** needs to be settled before 
  Chill Zone goes live to real customers. Current `Date.now()` defeats 
  CDN caching.

---

## Session completion

When all acceptance criteria pass:

1. Add a retrospective entry to `docs/retrospective.md`. If this 
   session goes smoothly, the entry is brief: "v3 shipped; mockup 
   port worked as expected; nothing new to add to Active Rules." 
   If something surprised you or revealed a new failure mode, write 
   that up following the retrospective template.

2. Update `docs/beds24-execution.md` Phase 3 status from "IN PROGRESS" 
   to "COMPLETE" if v3 closes all Phase 3 items. If some remain open 
   (confirmation page styling, price injection, accessibility), keep 
   Phase 3 "IN PROGRESS" and note what's left.

3. Close any Claude in Chrome tabs opened during the session.

4. Write the next session's handoff (`session-handoff-12.md`). If the 
   next session is property 2 rollout, it needs: the acceptance 
   criteria this session passed, the schema from property-config.md, 
   and a per-property config TODO list.

---

## Reference: the four properties

See `docs/skill/property-config.md` for full per-property data 
including room IDs, tags, brand colors, and fonts. Chill Zone is 
the one being shipped this session.
