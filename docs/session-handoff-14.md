# Session 14 Handoff

**Date:** 2026-04-24
**Previous session:** Session 13 (Claude Code Sonnet 4.6 medium) — 
see `session-handoff-13.md`
**This handoff:** Replaces session-handoff-13 as the current state 
of the project.

---

## Read these first, in order

1. `docs/retrospective.md` — Active Rules section. Takes precedence 
   over anything in this handoff if in conflict.
2. This document.
3. `docs/skill/SKILL.md` — working discipline.
4. `docs/mockup.html` — design source of truth for the frontend.

When you need them: `docs/skill/dom-structure.md`, 
`docs/skill/helper-js-architecture.md`, 
`docs/skill/gotchas.md`, `docs/skill/ota-channel-reference.md`.

---

## Current project state

### Resolved since session 13
- **OCCUPANCY_EXCEEDS_MAX_PERSONS errors (Booking.com dorm)** — 
  resolved by changing Beds24 Pricing Model from "Per Occupancy 
  Pricing" to "Per Day Pricing" and Daily Price Rule "Price For" 
  from "Per Person" to "Max Room Capacity" on Chill Zone. Verified 
  working: per-bed pricing displays correctly on Booking.com's 
  public page, multiplication for multiple beds is accurate. Full 
  details in `docs/skill/ota-channel-reference.md` and 
  `docs/skill/gotchas.md`.
- **Claude Code + Claude in Chrome tool access** — resolved. 
  Session 13's "navigate blocked" was specific to the Desktop app's 
  Code mode. VS Code terminal Claude Code works normally with 
  Chrome tools. This session's work should use VS Code.

### Still open (in priority order)

#### 1. CRITICAL — Revert commit `67931a9` (frontend regressions on main)

Session 13's Attempt 4 on the Book button movement introduced two 
regressions that are currently deployed:
- `tnh-total-price` element renders in wrong visual position 
  (next to dropdown instead of near Book button)
- Price does not update when quantity is selected on mobile

The pre-Attempt-4 state is at commit `993eefe`. The correct action 
is:

```bash
git revert 67931a9
# Resolve any conflicts, commit with message like "Revert Attempt 4 
# offer-row removal; restore Attempt 3 baseline"
git push
```

Or if a clean revert isn't possible due to intervening commits:

```bash
git show 993eefe:beds24-iframe-helper.js > beds24-iframe-helper.js
git show 993eefe:CSS-base.css > CSS-base.css
# Review the diffs, commit with descriptive message
git push
```

**Important:** The Book button movement bug (the original issue 
Attempt 4 was trying to fix) will come back after the revert. That 
bug is pre-existing and pre-Attempt-4. The revert trades "two 
regressions + original bug" for "original bug only" — a clear 
improvement.

Acceptance criteria after revert:
- Live page displays `tnh-total-price` next to Book button (not 
  next to dropdown)
- Price updates when qty changes on mobile
- All rooms still bookable end-to-end
- Book button movement on mobile still exists (that's fine for now)

#### 2. HIGH — Diagnose Book button movement before Attempt 5

Four attempts have failed. The pattern from Session 13: each attempt 
assumed something about the flex layout without observing the live 
DOM during a qty change. Any Attempt 5 must start with measurement, 
not architecture.

Diagnostic plan:

**Step 1: Set up live observation environment**
- Open `https://chillzone.astrongpresence.com/book-a-room` in Chrome 
  (manually if navigate tool is flaky)
- Open Chrome DevTools
- Switch to mobile device emulation at ~390px viewport width
- Run a date search to load rooms
- Open the Elements panel, target a specific room's 
  `.b24-multipricebox:not(.hidden)`
- Open the Console panel to trigger events

**Step 2: Record the DOM before any interaction**
- Inspect the hierarchy of `.b24-multipricebox` children
- Note their computed display, flex, order, width values
- Screenshot or log the initial state

**Step 3: Change the qty select from 0 to 1 and observe**
- Use DevTools' "Break on subtree modifications" on the 
  `.b24-multipricebox` element, OR
- Set up a `MutationObserver` in the console to log mutations:
  ```js
  new MutationObserver(m => console.log('MUTATIONS:', m))
    .observe(document.querySelector('.b24-multipricebox:not(.hidden)'), 
             {childList: true, subtree: true, attributes: true});
  ```
- Change qty from 0 to 1 via the select
- Capture what mutations fire: which elements are added/removed/
  modified, in what order, by whom

**Step 4: Analyze**
- Identify the specific mutation that causes the visual reflow 
  moving the Book button
- Identify what (if anything) is supposed to stay in place vs what 
  legitimately changes
- Determine whether the issue is:
  - a Beds24-side DOM change the helper isn't handling
  - a CSS cascade issue where a newly-added class changes styling
  - a flex order issue where the added element pushes others

**Step 5: Write Attempt 5 based on observation**
- Only proceed to code changes after you have a specific, measured 
  cause
- Prefer CSS fixes over JS/DOM restructuring where possible
- Trace through the visual order of all affected flex items before 
  and after your proposed change

**Acceptance criteria for "Book button issue resolved":**
- At 390px viewport, selecting qty 1 through 3 on any room does not 
  move the Book button to a new row
- Total price still updates visually when qty changes
- `tnh-total-price` displays adjacent to Book button
- No regression on any other room behavior

#### 3. MEDIUM — Verify OCCUPANCY error fix has held

Since the Pricing Model change was made near the end of Session 14, 
verify over the next 24 hours that:

- No new OCCUPANCY_EXCEEDS_MAX_PERSONS errors have appeared in Beds24 
  error notifications
- Double Room (567221) and Deluxe King Suite (567218) on Booking.com 
  are still showing correct prices — both use RLO pricing on 
  Booking's side, and the Per Day Pricing change shouldn't affect 
  them negatively, but verify
- Hostelworld prices for all rooms still display correctly

If any issue appears, don't try to roll back the Pricing Model 
change without understanding what broke. Document first, then 
investigate.

#### 4. LOW — Dorm price not updating when bed count changes

From Session 13, still open. The dorm's naa select (bed count 
selector) doesn't cause the from-div price to update visually.

Diagnostic path similar to #2 — observe live DOM during a naa change 
via DevTools, confirm what Beds24 actually does (AJAX request? DOM 
mutation? nothing?), then design fix based on measurement.

Session 13 also noted Claude made an incorrect claim about Beds24 
naa behavior. See retrospective for the rule this generated — apply 
it to any claims about Beds24 behavior during this diagnostic.

#### 5. LOW — Confirmation page styling

`customheadconfirm` field requires manual paste per property. 
Deferred until a live booking test is run.

#### 6. LOW — Rollout to properties 2-4

Blocked on Phase 5 (mobile QA) completion for Chill Zone.

---

## Documentation to integrate into the repo

Before any code work, integrate four new/updated documentation files:

1. **`docs/skill/ota-channel-reference.md`** — NEW FILE. Full 
   architectural reference for OTA channel configuration, pricing 
   models, and dorm-specific constraints. Place in `docs/skill/`.

2. **`docs/skill/gotchas.md`** — INSERT two new entries. See 
   `gotchas-session-14-additions.md` for the content and suggested 
   placement. The two entries are:
   - OCCUPANCY_EXCEEDS_MAX_PERSONS diagnosis and fix
   - Silent save failures on Daily Price Rule "Price For"

3. **`docs/retrospective.md`** — APPEND three new entries. See 
   `retrospective-session-14-additions.md` for the content. The 
   entries are:
   - Claims about third-party platform behavior must be verified 
     in live browser (Session 13)
   - Trace visual order before deploying structural DOM changes 
     (Session 13)
   - Cross-property comparison first, docs second (Session 14)

4. **`docs/skill/admin-guide.md`** — ADD a short pointer. After any 
   section discussing Beds24 admin field navigation, add something 
   like:

   > For the architectural background on how Beds24 channel 
   > configuration interacts with OTA pricing models (and the 
   > specific rules for dorm properties), see 
   > `ota-channel-reference.md`.

All four integration tasks should be committed together in a single 
commit with message like "Add OTA channel reference, session 13-14 
retrospective entries, gotchas updates".

---

## Environment and tool setup notes

### Chrome tool access

Claude Code in VS Code terminal works fine with Claude in Chrome 
tools. The "blocked navigate" issue from Session 13 was specific to 
Claude Desktop's Code mode. Use VS Code for this session.

If tool_search returns Chrome tools when queried, they're loaded. 
If you need to navigate directly from Claude Code, it works. If 
navigation fails for some reason, the fallback is to have the user 
open pages manually and use `javascript_tool` on the already-open 
tab.

### Beds24 admin access

You do NOT need credentials during this session for the code work. 
If you need to verify Booking.com/Beds24 admin state, ask the user 
— they have admin access and can capture screenshots or XML outputs.

### Git state

Session 14 did not make commits. The repo state at the start of this 
session is whatever was deployed at the end of Session 13:
- Commit `67931a9` on main (the regressed Attempt 4)

Verify with `git log --oneline -5` at session start.

---

## What this session should NOT do

- Do not attempt a Book button fix without first completing the 
  diagnostic in #2 above
- Do not change Beds24 admin settings (they were fixed end of 
  Session 14 and need 24h of observation before further changes)
- Do not add new features or scope to the frontend until the 
  regressions are reverted
- Do not "improve" or "refactor" any code that wasn't specifically 
  part of this session's scope
- Do not roll back the Pricing Model change even if it seems like 
  other issues appear — investigate first

---

## Session completion checklist

- [ ] Documentation integration (four files) committed
- [ ] Commit `67931a9` reverted, new commit pushed
- [ ] Live page verified: regressions gone, Book button bug 
  persists but nothing else broken
- [ ] DOM diagnostic on Book button movement completed and findings 
  documented (even if Attempt 5 isn't shipped this session)
- [ ] OCCUPANCY fix verification result (pass/fail) noted
- [ ] Next session handoff written (`session-handoff-15.md`) with 
  open issues and what was done
- [ ] If a failure mode was encountered or a new rule established: 
  retrospective entry added

---

## Related files

- Previous handoff: `docs/session-handoff-13.md`
- Architectural decisions: `docs/beds24-execution-context.md`
- Phase plan: `docs/beds24-execution.md`
- OTA channel background: `docs/skill/ota-channel-reference.md`
- Per-property config: `docs/skill/property-config.md`
