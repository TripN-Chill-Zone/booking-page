---
name: beds24-booking-page
description: "Configure and style Beds24 booking pages for hostel properties. Use this skill whenever the task involves Beds24 booking page CSS, JS injection, admin configuration, DOM inspection, layout customization, or booking flow design. Triggers include: any mention of Beds24, booking page styling, booking engine customization, hostel booking page, room card layout, booking strip, date strip, cssfile parameter, bookingcss field, custombody field, or property booking page configuration. Also use when working with Beds24 admin fields (Developer page, Layout page, Configuration page, Style page, Content page), when debugging Beds24 DOM elements, or when rolling out booking page changes across multiple properties. If the user mentions booking pages and hostels together, use this skill."
---

# Beds24 Booking Page — Skill Guide

This skill covers configuring, styling, and deploying custom booking 
pages on the Beds24 platform for hostel properties. Built from 
hands-on work on the Trip'N'Hostel Chill Zone property and designed 
for rollout across multiple properties.

The skill has two parts:

1. **Working discipline** — how to approach work in this project. 
   Read this first. Every session.
2. **Project reference** — architecture, design target, Beds24 
   platform knowledge, per-property setup. Consult as the task 
   requires.

---

## Part 1: Working discipline

These rules exist because violations have cost time repeatedly. The 
`docs/retrospective.md` Active Rules section is the canonical list; 
this section states the underlying principles. If a rule seems 
abstract, the retrospective entries show the concrete failures that 
produced it.

### 1.1 Separate measurements from inferences

Every load-bearing claim in a prior session's plan, handoff, or 
review is either a **measurement** (verified in-session by 
inspecting code or measuring reality) or an **inference** 
(conclusion drawn from earlier reasoning).

Inferences that gate the current scope must be re-verified before 
they're built on. If a proposal says "we can't do X because Y," and 
Y is an inference, test whether Y is still true *this session* 
before accepting the scope limit.

The most expensive failures in this project came from sessions 
inheriting unverified inferences and spending days on work that 
solved a non-problem.

### 1.2 Run the cheapest falsifying test first

When a proposal's complexity feels disproportionate to the problem 
described, identify the cheapest test that would falsify the 
proposal's central premise, and run it before writing the proposal.

Applied to this project: **if a design mockup exists, the cheapest 
falsifying test is applying its CSS and JS to the live page and 
measuring what breaks.** The mockup is a candidate implementation, 
not a visual reference. The first question in any layout task is: 
"does the mockup already produce this result on the live page?" If 
yes, port it. If no, fix the specific gap.

This rule also applies to architecture disputes, tooling claims, 
and premise inheritance — if you can falsify it cheaply, do that 
before proposing a fix.

### 1.3 Let the bug get smaller before the fix gets bigger

When successive rounds of review each surface information that makes 
the problem look different, resist scoping up the fix. Usually the 
problem is getting smaller, not larger. A fix that keeps growing 
across diagnostic rounds is a sign the original framing was wrong, 
not that more intervention is needed.

If round 1 called for a DOM rebuild, round 2 called for mirror 
controls, and round 3 called for a full layout redesign — pause. 
Ask the question you haven't asked yet, rather than adding another 
layer of architecture.

### 1.4 Verify before debugging

Before investigating why something doesn't work, confirm it's 
actually running. This applies broadly:

- **Deployed files:** URL returns 200 with correct content; every 
  reference (Beds24 field, WordPress block, bootstrapper) points to 
  the current version.
- **Saved admin values:** reload the page and confirm persistence. 
  Beds24 has silent failure modes (character limits, tag stripping, 
  AJAX save failures).
- **Assumed context:** uploaded docs and handoff notes, not leftover 
  browser tabs from prior sessions. Tab state is not authoritative.

If the state you're debugging against isn't the state you think it 
is, every downstream step is wasted. See `gotchas.md` for specific 
failure modes.

### 1.5 Plan the flow before coding the pieces

For multi-step flows (user flows, deployment chains, composed 
features), map the complete flow and identify architectural 
constraints before implementing pieces. Testing components in 
isolation and finding at integration time that they don't compose 
is more expensive than upfront planning.

---

## At session end

- Add a retrospective entry if a failure mode was surfaced or a new 
  rule was established. Use the template in `docs/retrospective.md`.
- Close any Claude in Chrome tabs opened during the session.
- Write or update a handoff note (`session-handoff-{N}.md`) with 
  what was done, what's open, and what the next session should 
  start with.

---

## Part 2: Project reference

### 2.1 Architecture

The booking page is hosted on the Beds24 domain 
(`beds24.com/booking2.php`), styled via CSS/JS injection, and embedded 
as an iframe on the WordPress property site.

**Guest flow:**

WordPress "Book A Room" page → custom widget renders date/guest 
picker → guest clicks "Search" → Beds24 booking page loads in iframe 
below widget with `referer=widget` parameter → guest browses rooms 
inline → clicks Book → `form.target="_top"` breaks out of iframe → 
Beds24 checkout takes over full browser tab → back button returns 
to WordPress.

**Why this architecture:** See `docs/beds24-execution-context.md` for 
the decision history. Short version: alternatives (WordPress plugin 
embed, full iframe through checkout, direct Beds24 link) were tried 
and rejected for specific reasons. Do not propose returning to them 
in review. Critique operates within the hybrid-iframe constraint.

### 2.2 CSS architecture

See `css-architecture.md` for full detail. Summary:

- **External `CSS-base.css`** — all structural rules, aesthetics, 
  layout, responsive design. No character limit. Served via 
  `&cssfile=` parameter. Single file, shared across all properties.
- **`bookingcss` field (Beds24 admin "Custom CSS")** — critical CSS 
  payload for FOUC prevention, plus per-property variable overrides. 
  HARD LIMIT: ~18-19K characters (saves silently fail above this). 
  Keep under 2K.
- **Per-property theming** — brand colors and fonts applied via CSS 
  variable overrides in each property's `bookingcss` field.

### 2.3 JS architecture

See `helper-js-architecture.md` for the section-by-section layout. 
Summary:

- **`beds24-iframe-helper.js`** — loaded via Beds24 "Insert in HTML 
  <HEAD> bottom" field. Reads `window.TNH_CONFIG` for per-property 
  data. Handles per-room Book buttons, dorm booking, date strip 
  overrides, price display, room sorting, iframe chrome hiding, 
  height sync. Shared across all properties.
- **`booking-widget.js`** — loaded via WordPress Custom HTML block. 
  Reads `window.TNH_WIDGET_CONFIG` for per-property data. Renders 
  date/guest picker, creates iframe, manages loading spinner. Shared 
  across all properties.

Both halt with a console error if their config is missing or 
invalid. No hardcoded fallbacks.

### 2.4 Design target — Hostelworld density

The booking page should feel like Hostelworld: dense, information-
rich, OTA-style. Not minimalist. See `docs/mockup.html` for the 
approved design.

**Room card layout (desktop, ≥768px iframe width):**

```
┌─────────────────────────────────────────────┐
│ Room Name                                   │
├─────────┬───────────────────────────────────┤
│         │ Description                        │
│ Photo   │ [tag] [tag] [tag]                  │
│         │                                    │
├─────────┴───────────────────────────────────┤
│ from €XX / night   [qty] [total] [Book →]  │
└─────────────────────────────────────────────┘
```

**Room card layout (mobile, <768px iframe width):**

```
┌──────────────────────────────┐
│ Room Name                    │
├──────┬───────────────────────┤
│      │ Description            │
│Photo │                        │
├──────┴───────────────────────┤
│ [tag] [tag] [tag] [tag]      │
├──────────────────────────────┤
│ from €XX / night             │
│ [qty] [total] [Book →]       │
└──────────────────────────────┘
```

**Critical rendering fact:** The iframe width is controlled entirely 
by the widget's `max-width` (currently 1290px in `booking-widget.js`). 
Neither WordPress, Kadence, nor Beds24 admin affects this. The 
formula is `iframe_width = min(viewport, widget.max-width) - 2px`. 
At widget max-width 1290px:

- iPhone portrait (390px viewport) → 388px iframe → **mobile layout**
- iPhone landscape (844px) → 842px iframe → **desktop layout**
- iPad portrait/landscape → 808-1078px iframe → **desktop layout**
- Desktop (≥1292px) → 1288px iframe → **desktop layout**

Beds24's mobile breakpoint is 767px. Only phone-portrait-ish 
viewports trigger mobile CSS. See `retrospective.md` 2026-04-21 
entries for the diagnostic that established this.

### 2.5 Per-property rollout

When rolling out to a new property, see `rollout-checklist.md` for 
the complete step-by-step checklist. Property-specific configuration 
for the current property (room IDs, tags, descriptions) is in 
`property-config.md`.

### 2.6 Tool usage

| Task | Tool | Notes |
|------|------|-------|
| CSS/JS authoring | Claude Code | Files auto-deploy on push |
| Beds24 admin reads | Claude in Chrome | JS execution on admin pages |
| Beds24 admin writes (most fields) | Claude in Chrome | Works for text fields |
| Beds24 `<script>`/`<style>` writes | Manual paste by user | Tags stripped on programmatic save |
| DOM inspection of booking page | Claude in Chrome | JS execution on booking page |
| Visual verification | User screenshot | MCP tabs may have 0 viewport width |
| Photo uploads | Manual by user | File picker inaccessible to automation |
| Mobile QA | Manual on real iOS device | Cannot be automated |

**Claude in Chrome tips for Beds24:**

- Admin page URL pattern: `https://beds24.com/control3.php?pagetype={type}&id={id}`
- Key page types: `bookingpagedesigndeveloper`, `bookingpagedesignlayout`, 
  `bookingpagedesign2`, `bookingpagedesignstyle`, `bookingpagedesigncontent`, 
  `roomssetup`, `propertydescription`
- Avoid including booking page URLs in JS return values — may be 
  blocked by content filters
- MCP tab may have `innerWidth: 0` (background tab) — width-dependent 
  layout testing unreliable; use user screenshots for visual 
  verification
- Beds24 form saves use AJAX (`jquerysubmit=1`) — click the save 
  button element, don't submit the form directly
- "Add module" dropdown on Layout page requires manual UI 
  interaction — programmatic value-setting doesn't trigger Beds24's 
  handler

---

## Reference files

- `dom-structure.md` — verified DOM map
- `css-architecture.md` — CSS file structure and variable system
- `helper-js-architecture.md` — helper JS section layout
- `admin-guide.md` — Beds24 admin field reference
- `property-config.md` — per-property IDs, tags, descriptions
- `rollout-checklist.md` — new-property setup steps
- `gotchas.md` — known pitfalls with solutions
