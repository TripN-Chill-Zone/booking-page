# Project Retrospective

A living log of failure modes, corrections, and process changes. Each session 
that identifies a non-trivial failure mode or adopts a new working rule adds 
an entry. Historical entries are append-only; the top summary is rewritten 
as needed to reflect current active rules.

## How to use this document

- **Read the Active Rules section before starting work.** These are process 
  constraints that have been learned the hard way.
- **Read the most recent 2-3 entries before writing a proposal.** Recent 
  failure modes are the most likely to still be relevant.
- **At the end of a session that surfaced a failure mode or adopted a rule, 
  add an entry.** Use the template at the bottom of this file.
- **Do not edit or delete past entries.** If a rule is superseded, add a new 
  entry that supersedes it and update the Active Rules section.

---

## Active Rules

These are the current rules extracted from accumulated entries. Each links 
to the entry that established or last revised it.

### Measurements vs inferences
When reading a prior session's plan or review, identify which claims are 
measurements (tested evidence from code/DOM inspection) and which are 
inferences (conclusions drawn from earlier sessions). Inferences that gate 
the scope of current work must be verified in the current session before 
being built upon. *(Established: 2026-04-19)*

### Cheapest falsifying test first
When a proposal's complexity feels disproportionate to the problem's 
description, identify the cheapest test that would falsify the proposal's 
central premise and run it before writing the proposal. If the premise 
doesn't survive, the proposal isn't needed. *(Established: 2026-04-19)*

### Let the bug get smaller before the fix gets bigger
When successive rounds of review each surface new information that makes 
the problem look different, resist the urge to scope up the fix. Usually 
the problem is getting smaller, not larger. *(Established: 2026-04-19)*

### Retest inherited limitations
When a prior session documents a tool limitation alongside other failures 
(e.g., extension crash), retest the limitation independently before 
adopting it as a constraint. The limitation may have been a symptom of the 
co-occurring failure, not a standalone issue. *(Established: 2026-04-20)*

### Understand the data model before bulk operations
Before setting values across a multi-entity UI, confirm whether the UI 
presents a filtered view of shared data or isolated per-entity data. 
Applying changes to "all items" when only a subset belongs to the current 
entity causes cross-contamination that is tedious to reverse. 
*(Established: 2026-04-20)*

### Automate what you can verify, delegate what you can't see
When automation cannot inspect the result of an action (e.g., identifying 
image content from filenames), delegate that step to the human rather than 
guessing. A wrong automated guess creates more rework than a brief manual 
step. *(Established: 2026-04-20)*

### Verify saves before building on them
After any programmatic write to a Beds24 admin field, reload the page 
and confirm the value persisted before making further changes. Silent 
save failures (character limits, tag stripping) waste all subsequent 
work built on the assumption the save succeeded. *(Established: 2026-04-20)*

### Rewrite, don't patch
When making significant layout changes to CSS, start from the current 
clean file, make all edits, and deploy the complete file. Do not 
incrementally append patches to an inline field or use string 
replacement on large text blobs in browser textareas. Each iteration 
should produce a complete, self-consistent file. *(Established: 2026-04-20)*

### Read documents before browser state
At the start of a new session, read all uploaded handoff/project 
documents before inspecting browser tabs, running tools, or making 
claims about prior work. Browser tabs from previous sessions are 
leftover state, not authoritative context. Close Claude in Chrome 
tabs at the end of each session. *(Established: 2026-04-20)*

### Verify file accessibility before debugging
After uploading any JS/CSS file to the VPS, navigate to its URL and 
confirm a 200 response with correct content before testing 
functionality. If the file returns 404 or stale content, all 
subsequent debugging is wasted. *(Established: 2026-04-20)*

### Plan the flow before coding the pieces
When building a multi-step user flow (widget → iframe → checkout), 
map out the complete flow and identify architectural constraints 
before implementing individual pieces. Testing pieces in isolation 
then discovering they don't compose wastes more time than upfront 
flow planning. *(Established: 2026-04-20)*

### One observer, one guard
Never attach multiple MutationObservers to the same root with 
`subtree:true` when any callback modifies the DOM. Use a single 
observer with an `isModifying` guard flag. Two observers create 
infinite mutation loops that freeze the page. *(Established: 2026-04-20)*

### Verify the full deployment chain
After uploading files to the VPS, don't just verify the files are 
accessible — also verify that every reference to those files is 
updated. Check the Beds24 admin field, the WordPress HTML block, 
and the widget CONFIG. A correct file on the VPS is useless if the 
page still loads the old version. *(Established: 2026-04-20)*

### Hide measurable content with opacity, not display
When content inside an iframe needs to be hidden from the user but 
still rendered for measurement (height sync, getBoundingClientRect), 
use `opacity:0; position:absolute` instead of `display:none`. 
`display:none` prevents the browser from rendering content entirely, 
making all measurements return 0. *(Established: 2026-04-20)*

### Inject overrides via JS when CSS load order fails
When an external CSS file's rules are overridden by platform-generated 
inline styles (e.g., Beds24's Style panel colors), move those overrides 
into a JS-injected `<style>` tag. JS-injected styles load last and 
reliably win specificity battles. *(Established: 2026-04-20)*

### New filenames bypass server cache
When OpenLiteSpeed (or similar server-side cache) serves stale content 
despite Cloudflare purges, `.htaccess` directives, and server restarts, 
the only reliable workaround is uploading with a new versioned filename. 
Never overwrite an existing file expecting the change to take effect. 
*(Established: 2026-04-20)*

### Test CSS against real DOM before deployment
When developing CSS via a local mockup, verify the mockup's DOM matches 
the live page before extracting CSS for deployment. A mockup built from 
documentation may miss elements, nesting, or classes that affect 
specificity and layout. *(Established: 2026-04-20)*

### Use viewport resize for media query testing
CSS media queries respond to viewport width, not container width. 
Simulating mobile by constraining a container's `max-width` via a 
dropdown does NOT trigger `@media` rules. Use Chrome DevTools device 
mode or resize the actual browser window. *(Established: 2026-04-20)*

### Use the platform's field names with the user
When referring to admin fields, use the names visible in the platform 
UI (e.g., "Insert in HTML <HEAD> bottom") not internal field IDs 
(e.g., `customhead`). The user can't see field IDs and can't act on 
instructions that use them. *(Established: 2026-04-20)*

### Test the simple thing before building the complex thing
When a working reference implementation exists (e.g., a mockup), test 
it against the real environment before designing a more complex 
architecture. If the simple version works, ship it. Complexity needs 
justification from a measured failure, not from an assumed one. 
*(Established: 2026-04-21)*

### Know your actual viewport
When an iframe embeds your page, your CSS viewport is the iframe's 
width, not the user's screen width. Identify the actual rendering 
width early and design for it. A "desktop" layout that never 
activates is wasted work. *(Established: 2026-04-21)*

### Mockup-first validation
Before writing any proposal that would change layout or behavior covered by 
a design mockup, test whether applying the mockup's CSS and JS directly to 
the live environment produces the desired result. Mockups are candidate 
implementations, not just visual references. *(Established: 2026-04-19)*

### Show the design artifact, not just the plan
In adversarial review, request the design mockup as a first-round 
artifact alongside the implementation plan. Reviewing a plan without the 
design target invites reviewers to speculate about architecture in a 
vacuum. *(Established: 2026-04-19)*

### Use JS Unicode escapes for non-ASCII in Beds24 script fields
When embedding emoji or other non-ASCII characters in Beds24 admin 
fields that contain `<script>` content (e.g., "Insert in HTML <HEAD> 
bottom"), use JS Unicode escape sequences (`\uD83D\uDECF`) rather than 
literal characters. Beds24 silently strips non-ASCII on AJAX save. 
Unicode escapes are pure ASCII, survive the save, and are evaluated 
as the correct character when the browser executes the script. 
*(Established: 2026-04-21)*

---

## Entry template

When adding a new entry, use this structure:

```
### YYYY-MM-DD — Short title

**Context:** What was being worked on, what the setup was.

**What happened:** The failure mode, narrated briefly. Include enough 
detail that a future session can recognize the same pattern.

**Root causes:** Numbered list. Be specific about mechanisms, not just 
outcomes.

**Rules established:** New active rules, or links to existing ones 
this entry reinforces.

**Concrete cost:** Time, rework, or other measurable impact. Optional 
but helpful for calibrating future decisions.

**Resolution:** What fixed it, where the fix lives.
```

---

## Entries

### 2026-04-20 — Beds24 navigation limitation was not standalone

**Context:** Session 3 documented that automated navigation between 
Beds24 admin pages causes 502 errors and session drops. This was 
recorded as a known limitation and carried forward as a constraint: 
"navigate manually, then let Claude in Chrome read/write on the 
current page."

**What happened:** Session 4 retested navigation at the user's 
suggestion. Automated navigation via JS `click()` and `form.submit()` 
worked without any 502 errors across multiple page transitions 
(Layout, Style, Content, Developer, Pictures, Room Descriptions). The 
limitation documented in Session 3 was not reproducible.

**Root causes:**
1. The Session 3 navigation failures occurred during the same session 
   where the Claude in Chrome extension entered a bad auth state 
   requiring full reinstall. The 502s were likely caused by the same 
   underlying issue (session corruption, server-side rate limiting 
   during extension instability), not by navigation itself.
2. The limitation was recorded as a standalone constraint rather than 
   being flagged as potentially correlated with the co-occurring 
   extension failure.

**Rules established:** *Retest inherited limitations* — when a prior 
session documents a tool limitation alongside other failures, retest 
the limitation independently before adopting it as a constraint.

**Concrete cost:** Would have required manual navigation for every 
admin page transition in Phase 2, adding friction to every step. 
Retesting took one click and saved dozens of manual navigations.

**Resolution:** Navigation confirmed working. Constraint removed from 
workflow. Handoff doc updated to reflect this.

---

### 2026-04-20 — Photo positions applied to all 53 files across all rooms

**Context:** Setting photo positions on the Beds24 Pictures page. Each 
room section displays all 53 uploaded files (shared pool), not just 
photos belonging to that room. Only photos with a position number 
(not "not used") display in that room's slider.

**What happened:** Automation set all 53 `picval` selects to sequential 
positions (1–53) and saved. This was done for 4 rooms before the user 
reported that every room was now showing all 53 photos. The intended 
behavior was to position only the photos belonging to each specific 
room (e.g., 5 for the Suite, 1 for the Dorm).

**Root causes:**
1. The automation could not see image thumbnails, so it could not 
   distinguish which photos belonged to which room.
2. The automation assumed "set all to positions" was correct without 
   understanding that the 53 files were a shared pool presented in 
   every room section, not 53 room-specific files.
3. No verification step was performed between the first room save and 
   proceeding to the remaining rooms. If the booking page had been 
   checked after the first room, the 53-photo problem would have been 
   caught immediately.

**Rules established:**
- *Understand the data model before bulk operations* — before setting 
  values across a multi-entity UI, confirm whether the UI presents a 
  filtered view or shared data.
- *Automate what you can verify, delegate what you can't see* — when 
  automation cannot inspect the result (image content), delegate to 
  the human.

**Concrete cost:** All 4 rooms had to be reset to "not used" (4 room 
loads + 4 saves), then the user had to manually identify and position 
photos per room. Approximately 10 minutes of rework.

**Resolution:** User manually set correct photo positions per room. 
Automation confirmed final state by reading `picval` selects per room.

---

### 2026-04-20 — Inline CSS field has undocumented character limit

**Context:** Building up the booking page CSS incrementally in Beds24's 
`bookingcss` inline field via Claude in Chrome. Each append appeared 
to save successfully (button clicked, no error).

**What happened:** After reaching ~18-19K characters, subsequent appends 
stopped persisting. The save appeared to succeed — the textarea showed 
the new content, the button clicked, no error message — but on page 
reload the field reverted to the pre-append state. This was only 
discovered after several rounds of "save, reload, check" revealed the 
length wasn't growing. Earlier in the session, a large batch 
replacement also silently failed for the same reason.

**Root causes:**
1. Beds24's server silently rejects or truncates saves above an 
   undocumented character limit (~18-19K) on the `bookingcss` field. 
   There is no client-side validation, maxlength attribute, or error 
   response.
2. The incremental append workflow meant the field grew gradually, and 
   the failure boundary was crossed without any signal. Each "save" 
   felt successful.
3. No verification step between save and next edit — a reload-and-check 
   after each save would have caught the failure immediately.

**Rules established:** *Verify saves before building on them* — after 
any programmatic write to a Beds24 admin field, reload the page and 
confirm the value persisted before making further changes. Silent save 
failures waste all subsequent work.

**Concrete cost:** Approximately 30 minutes of CSS work that didn't 
persist, plus debugging time to identify the cause. Led to the decision 
to move all CSS to the external file, which was the right architecture 
anyway but was forced by the limit rather than planned.

**Resolution:** All aesthetic/layout CSS moved to external file 
(`CSS-base-v2.css`) served via `&cssfile=` parameter. Inline field 
trimmed to 1,545 chars of critical CSS + variable overrides. External 
file has no character limit.

---

### 2026-04-20 — Beds24 strips script/style tags on programmatic save

**Context:** Attempting to save `<script>` content into the `custombody` 
field and `<style>` content into `customheadconfirm` via Claude in 
Chrome (setting textarea value + clicking save button).

**What happened:** Plain text ("test123") saved and persisted correctly. 
Content wrapped in `<script>` or `<style>` tags resulted in empty 
fields on reload. The save appeared to succeed — no error, the textarea 
showed the content — but the tags were stripped server-side.

**Root causes:**
1. Beds24's server-side form handler sanitizes HTML tags from certain 
   fields when submitted via the AJAX form mechanism. The admin UI's 
   own save path handles these tags correctly, but the programmatic 
   path (setting value + dispatching events + clicking submit) triggers 
   a different code path or lacks a flag that bypasses sanitization.
2. The failure was silent — no error response, no visual indication. 
   Only discovered by reload-and-check.

**Rules established:** Reinforces *verify saves before building on 
them*. Also: *know which fields accept HTML tags* — `bookingcss` 
accepts raw CSS (no tags needed), but `custombody` and 
`customheadconfirm` require HTML tags that get stripped 
programmatically. These fields must always be pasted manually by the 
user.

**Concrete cost:** Two rounds of writing + saving + discovering empty 
fields. Approximately 15 minutes. Ongoing cost: user must paste these 
fields manually for every property.

**Resolution:** Documented as a hard constraint. Paste-ready content 
provided to user as copyable text. Added to skill gotchas reference.

---

### 2026-04-20 — #b24scroller is the booking strip, not the room container

**Context:** The execution plan and earlier sessions referenced 
`#b24scroller` as the room card container. The hide/reveal JS was 
designed to observe this element for room node changes.

**What happened:** DOM inspection in Session 5 revealed that 
`#b24scroller` is the booking strip (date pickers, nights selector, 
Book button). The actual room container is `.b24fullcontainer-rooms`. 
The JS would have been watching the wrong element entirely.

**Root causes:**
1. The name "scroller" suggests a scrollable content area, which was 
   interpreted as the room listing. The actual booking strip is a form 
   area that happens to use this ID.
2. The selector was noted in the execution plan as "e.g., 
   `#b24scroller`" with a caveat to "inspect rendered HTML on staging 
   before writing" — but it was carried forward as assumed-correct in 
   subsequent planning.
3. No DOM inspection was performed in Sessions 3 or 4 to verify the 
   selector. It was an inference from Beds24 documentation, not a 
   measurement.

**Rules established:** Reinforces *measurements vs inferences* — the 
selector was an inference that was never verified. Also reinforces the 
skill's guidance to always read `dom-structure.md` before writing 
CSS/JS, which contains the verified selector map.

**Concrete cost:** Would have caused the hide/reveal JS to completely 
fail (observing wrong element, rooms never hidden/revealed). Caught 
before deployment by Session 5 DOM inspection.

**Resolution:** All selectors verified via Claude in Chrome DOM 
inspection. Complete DOM tree documented in 
`docs/skill/references/dom-structure.md`. Execution plan updated with 
correct selectors.

---

### 2026-04-20 — Incremental CSS patching created compounding layout issues

**Context:** Building the booking page design iteratively — starting 
with base styles, then adding layout fixes, then design changes, then 
reordering, each as appended CSS rules to the inline field.

**What happened:** By the end of the session, the CSS had multiple 
layers of rules that conflicted or partially overlapped: the original 
base styles, the "Session 5 design fixes," the "Session 5b layout 
reorder," the "offer section reorder," each targeting the same elements 
with different intents. Some `string.replace()` calls to update earlier 
rules failed silently due to whitespace mismatches, leaving both old 
and new rules active. The resulting page had elements styled by 
contradictory rules.

**Root causes:**
1. Appending CSS patches is additive — old rules aren't removed, 
   they're overridden (or not, depending on specificity). This creates 
   a growing stack of rules where the visual outcome depends on cascade 
   order.
2. Using `string.replace()` on large CSS strings in a browser textarea 
   is fragile. Whitespace, newlines, and encoding differences cause 
   silent match failures.
3. No "clean slate" step — each iteration built on the previous one 
   rather than rewriting from a known-good state.

**Rules established:** *Rewrite, don't patch* — when making significant 
layout changes, start from the current clean CSS file, make all edits, 
and upload the complete file. Do not incrementally append patches to an 
inline field. The external file architecture supports this: edit the 
file, increment the version, upload, test.

**Concrete cost:** Multiple rounds of CSS changes that appeared to save 
but didn't apply, or applied in combination with old conflicting rules. 
The user saw "nothing seems to have changed" at least once. Eventually 
required moving to the external file and starting from a clean base.

**Resolution:** All CSS consolidated into a single external file 
(`CSS-base-v2.css`). Future changes follow the CSS update protocol: 
edit file → increment version → upload → test.

---

### 2026-04-20 — New session hallucinated context from leftover browser tabs

**Context:** Session 5 left Claude in Chrome tabs open (booking page, 
Beds24 admin, WordPress site). The next session (Session 6) started 
with uploaded documents but also saw the open tabs via 
`tabs_context_mcp`.

**What happened:** Session 6 saw the tab showing the booking page 
embedded in an iframe on the WordPress site and immediately began 
diagnosing an "iframe double scroll issue on iOS" — inventing context 
about "previous session changes to the plugin/iframe config" that never 
happened. It made authoritative-sounding claims about what previous 
sessions had done based on inferring from tab URLs rather than reading 
the uploaded documents.

**Root causes:**
1. The new session treated browser tab state as authoritative context 
   about the project, rather than reading the uploaded handoff documents 
   first.
2. Tab URLs contained enough information (booking page URL with 
   `referer=wordpress`) for the session to construct a plausible but 
   incorrect narrative.
3. The session began acting before reading — it proposed investigation 
   and fixes before consulting any of the 7 uploaded documents.

**Rules established:** *Read documents before browser state* — at the 
start of a new session, read all uploaded handoff/project documents 
before inspecting browser tabs, running tools, or making claims about 
prior work. Browser tabs from previous sessions are leftover state, 
not authoritative context. Also: *close Claude in Chrome tabs at the 
end of each session* to prevent this confusion.

**Concrete cost:** Required the user to intervene and correct the 
session's assumptions, breaking the flow at the start of a new context 
window. Minor time cost but undermines trust.

**Resolution:** User corrected the session manually. Added note about 
this pattern to retrospective for future sessions.

---

### 2026-04-20 — Debugging functionality before verifying file deployment

**Context:** Uploading new versions of JS files to the VPS and updating 
Beds24/WordPress references. After each upload, immediately testing the 
booking page functionality.

**What happened:** Multiple rounds of debugging — inspecting DOM state, 
checking postMessage events, reading console errors, testing 
MutationObserver behavior — before discovering the JS file was returning 
404 (not yet uploaded) or serving stale content (cached by 
Cloudflare/LiteSpeed). In one case, a 404 response was cached even 
after the file was uploaded, persisting across refreshes.

**Root causes:**
1. No verification step between "upload file" and "test functionality." 
   The file URL was never checked for a 200 response.
2. Cloudflare/LiteSpeed caches 404 responses. Requesting a URL before 
   the file exists causes the 404 to persist even after upload.
3. The debugging instinct was to look at code logic rather than 
   confirming the code was even loaded.

**Rules established:** *Verify file accessibility before debugging* — 
navigate to the file URL, confirm 200 and correct content, before 
testing anything else. Also: never request a file URL before the file 
exists at that path.

**Concrete cost:** At least 20 minutes of debugging across multiple 
iterations that was entirely wasted because the file wasn't being served.

**Resolution:** Added file verification as step 1 in the deployment 
protocol. Documented in execution plan, SKILL.md, and gotchas.

---

### 2026-04-20 — Two MutationObservers created infinite DOM mutation loop

**Context:** The Beds24 iframe helper had two MutationObservers on 
`document.body` with `subtree:true`: one for height sync (which set 
`body.style.height`) and one for applying fixes (dorm buttons, Book 
button injection).

**What happened:** The page froze inside the iframe. The height observer 
set `body.style.height`, triggering the fix observer. The fix observer 
injected DOM elements, triggering the height observer. The height 
observer set `body.style.height` again. Infinite loop. No height 
messages reached the parent widget, so the loading spinner never cleared.

**Root causes:**
1. Two observers watching the same subtree where both callbacks modify 
   the DOM is inherently recursive.
2. The `setTimeout` debounce on each observer (150ms, 300ms) didn't 
   prevent the loop — it just slowed it to every ~200ms, still enough 
   to freeze the page.
3. No guard mechanism to prevent re-entry.

**Rules established:** *One observer, one guard* — use a single 
MutationObserver with an `isModifying` flag. Set the flag before DOM 
modifications, release after 500ms timeout. The observer callback 
checks the flag and skips if true.

**Concrete cost:** One full iteration (write, upload, test, debug) 
wasted. The "nothing loads" symptom was ambiguous — could have been 
many things.

**Resolution:** Merged into single observer with `isModifying` guard 
in iframe helper v12+.

---

### 2026-04-20 — Iterating on pieces without a flow plan

**Context:** Building the booking widget and iframe helper across 
multiple iterations. Each version addressed the most recent bug 
without re-examining the full user flow.

**What happened:** Thirteen versions of the iframe helper (v1–v13) 
and five versions of the widget (v1–v5) in a single session. Each 
fixed one thing and broke another: the floating bar fix introduced 
a scroll feedback loop; the body-height trimming fixed excess 
whitespace but clipped the last room; the per-room Book button 
injection worked manually but not via the observer. The user had to 
intervene and ask to step back and plan the full flow before 
continuing.

**Root causes:**
1. No upfront mapping of the complete booking flow (widget → iframe 
   → room selection → checkout → back button). Each piece was built 
   to solve the immediate problem without considering how it composed 
   with the other pieces.
2. The iframe height sync, floating bar, form breakout, dorm fix, and 
   Book button injection were all developed as independent features 
   rather than parts of a single coherent flow.
3. Testing was per-feature ("does the button appear?") rather than 
   per-flow ("can a guest go from search to checkout and back?").

**Rules established:** *Plan the flow before coding the pieces* — map 
the complete user flow, identify architectural constraints (cross-origin 
iframe limits, form submission behavior, back button semantics), and 
make key decisions (iframe vs new tab, floating vs static bar) before 
implementing. Testing pieces in isolation then discovering they don't 
compose wastes more time than upfront planning.

**Concrete cost:** 13 helper versions and 5 widget versions to arrive 
at a flow that could have been designed in 2-3 versions with upfront 
planning. The user's intervention ("We're testing too many things 
without having a solid plan") was the turning point.

**Resolution:** Stepped back, mapped the full flow, made the key 
architectural decision (iframe for display, `target="_top"` for 
checkout breakout), and rebuilt cleanly. The v10+ helper and v4+ 
widget reflect this planned approach.

---

### 2026-04-20 — WordPress Custom HTML block lost its div on edit

**Context:** Updating the WordPress Custom HTML block to point to a 
new widget JS version. The block should contain both 
`<div id="tnh-booking-root"></div>` and `<script src="...">`.

**What happened:** After updating the script URL, the page showed 
nothing. The div had been accidentally deleted, leaving only the 
script tag. The widget JS loaded but couldn't find its mount point, 
so it silently exited.

**Root causes:**
1. The Custom HTML block shows raw HTML in a textarea. When replacing 
   the script URL, it's easy to select-all and paste only the script 
   line, losing the div.
2. The widget JS fails silently when `#tnh-booking-root` is missing — 
   no error, no console message, just an empty page.
3. The deployment instructions sometimes mentioned only the script 
   tag without the div, reinforcing the mistake.

**Rules established:** Reinforces *verify saves before building on 
them*. Also: always provide both lines together in deployment 
instructions. Never give just the script tag.

**Concrete cost:** One debugging round to discover the missing div. 
Minor, but happened twice in the same session.

**Resolution:** All deployment instructions now include both lines. 
Added to gotchas document.

---

### 2026-04-20 — Helper stuck on v10 despite v13 being on VPS

**Context:** Session 6 created helper v13 and uploaded it to the VPS. 
The handoff notes stated v13 was deployed. Session 7 began by 
verifying deployment.

**What happened:** File verification confirmed v13 existed on the VPS 
with correct content. But inspecting the live Beds24 page revealed 
the "Insert in HTML <HEAD> bottom" field still pointed to v10. Three 
versions of improvements (v11, v12, v13) had never taken effect. 
Every bug attributed to "timing" or "observer issues" in Session 6 
was simply the old code running.

**Root causes:**
1. The deployment protocol verified file accessibility but not the 
   admin field reference. The file existed; the page didn't load it.
2. The Session 6 handoff stated v13 was deployed based on the file 
   being uploaded, not on verifying the admin field was updated.
3. No end-to-end verification: "file on VPS" ≠ "file loaded by page."

**Rules established:** *Verify the full deployment chain* — after 
uploading files, verify every reference is updated: Beds24 admin 
fields, WordPress HTML blocks, widget CONFIG. A file on the VPS is 
useless if the page loads the old version.

**Concrete cost:** Multiple issues from Session 6 (no Book buttons, 
bottom bar visible, page clipping) were "already fixed" in v13 code 
that never ran. Session 7 spent initial time re-diagnosing issues 
that were already resolved in undeployed code.

**Resolution:** Updated "Insert in HTML <HEAD> bottom" to v14. 
Expanded the deployment verification protocol to include admin field 
and WordPress block checks.

---

### 2026-04-20 — display:none iframe caused 18-second desktop loading delay

**Context:** The booking widget creates an iframe to load the Beds24 
booking page. While loading, the iframe was set to `display:none` to 
hide it behind a loading spinner.

**What happened:** On desktop, the loading spinner persisted for 18 
seconds. Diagnostic logging showed the helper inside the iframe 
reported `height=200` (the minimum floor) on every measurement cycle 
for the entire duration. The widget waited for height > 500 to reveal 
rooms — deadlock. Mobile was unaffected.

**Root causes:**
1. An iframe with `display:none` does not render its content. 
   `getBoundingClientRect()` returns 0 for all elements inside it.
2. The helper measured room container height as 0, added the 200px 
   floor, and reported 200. The widget never received height > 500.
3. The 8-second fallback set `display:block` but kept the height at 
   220px (200 + 20 padding). At 220px the rooms were squeezed and 
   measurements remained low.
4. Mobile browsers apparently handle hidden iframe rendering 
   differently, allowing content to be measured even when the parent 
   iframe has `display:none`.

**Rules established:** *Hide measurable content with opacity, not 
display* — use `opacity:0; position:absolute; height:1px` to keep 
content invisible but renderable and measurable.

**Concrete cost:** 18-second load time on desktop — likely causing 
guest abandonment on every visit.

**Resolution:** Changed widget v6 to use `opacity:0; position:absolute` 
instead of `display:none`. Loading time dropped to 2-3 seconds.

---

### 2026-04-20 — External CSS overrides lost to Beds24 Style panel inline styles

**Context:** CSS v3 changed `.datestay` background from orange to green 
using `background-color: var(--b24-color-secondary) !important`. The 
variable resolved correctly. The rule had `!important`.

**What happened:** Stay dates remained orange on the live page. The 
Beds24 Style panel generates inline `<style>` blocks with 
`.datestay { background-color: rgb(231, 163, 92) }` (no `!important`). 
These load after the external CSS file. Despite our rule having 
`!important` and theirs not, the color didn't change — investigation 
showed the external CSS was cross-origin and its rules couldn't be 
inspected via JS, making debugging difficult. The actual cause was 
likely cached stale CSS being served.

**Root causes:**
1. External CSS loaded cross-origin has unpredictable cache behavior 
   across Cloudflare and the browser.
2. Debugging CSS specificity across cross-origin stylesheets is 
   unreliable — `cssRules` throws SecurityError.
3. The Style panel's inline styles are a reliable override target 
   only from JS-injected styles that load last.

**Rules established:** *Inject overrides via JS when CSS load order 
fails* — for overrides that must beat platform-generated styles, 
inject via a JS `<style>` tag in the helper script. This loads last 
and is guaranteed to win.

**Concrete cost:** One round of CSS debugging and a failed deploy. 
Required moving the color overrides from external CSS to helper JS.

**Resolution:** Added Section 5 to helper v14: injects date strip 
color overrides via `document.createElement('style')`. Works 
reliably on both direct page and iframe.

---

### 2026-04-20 — OpenLiteSpeed cache immune to all standard purge methods

**Context:** Deploying updated CSS and helper JS files to the VPS. 
Files were overwritten with new content via aaPanel file manager.

**What happened:** Despite purging Cloudflare cache, enabling 
Cloudflare development mode, adding `.htaccess` CacheDisable 
directives, disabling the LiteSpeed WordPress plugin, and restarting 
the OpenLiteSpeed service — the server continued serving stale file 
content. A deleted file (`CSS-base-v4b.css`) remained accessible 
indefinitely. Multiple rounds of CSS/JS debugging were wasted 
because the live page was loading old code.

**Root causes:**
1. OpenLiteSpeed caches static files at the server level in 
   `/usr/local/lsws/cachedata/`, independent of Cloudflare, the WP 
   plugin, and `.htaccess` directives.
2. No SSH access to manually delete the cache data folder.
3. The aaPanel UI has no "purge OLS cache" button.
4. Overwriting a file does not invalidate its cached version.

**Rules established:** *New filenames bypass server cache* — the 
only reliable workaround is uploading with new versioned filenames.

**Concrete cost:** ~45 minutes across multiple upload-test-debug 
cycles where changes appeared not to work. Several CSS fixes were 
already correct but appeared broken because the old file was served.

**Resolution:** Adopted strict versioned filename policy (v5, v6, 
etc.). Every deployment uses a new filename. Added to CLAUDE.md 
and gotchas.

---

### 2026-04-20 — Media queries don't fire on container width changes

**Context:** Local mockup with a dropdown to simulate mobile by 
setting `max-width: 390px` on the container div. Media queries 
at `@media(max-width:767px)` controlled the mobile layout.

**What happened:** Selecting "Mobile (390px)" from the dropdown 
constrained the container but the mobile CSS rules never applied. 
Tags stayed next to the thumbnail, offer bar didn't rearrange. 
Multiple mockup iterations (v9 through v11) appeared broken, 
causing unnecessary CSS rewrites. When the user finally resized 
the actual browser window to 390px, the mobile layout worked.

**Root causes:**
1. CSS `@media(max-width)` queries check the viewport width, not 
   any container's width.
2. The mockup's dropdown changed `max-width` on a wrapper div — 
   the viewport stayed at desktop width.
3. Three mockup iterations were spent trying to "fix" mobile CSS 
   that was already correct, because testing used the wrong method.

**Rules established:** *Use viewport resize for media query testing* 
— use Chrome DevTools device mode or resize the browser window. 
Container width changes do not trigger media queries.

**Concrete cost:** Three wasted mockup iterations (v9, v10, v11) 
and ~30 minutes of CSS debugging chasing a testing artifact, not 
a real bug.

**Resolution:** User resized browser window and confirmed mobile 
layout was working. Noted in dev workflow instructions for future 
mockup work.

---

### 2026-04-20 — Mockup DOM diverged from live Beds24 DOM

**Context:** Developing room card CSS via a self-contained HTML 
mockup. The mockup's DOM was built from dom-structure.md and 
previous session notes, not from a live DOM snapshot.

**What happened:** CSS that worked in the mockup didn't match the 
live site. Specific issues: `:first-of-type` selectors failed 
because the live DOM has `.offer` as the first div child (before 
the slider row), which the mockup initially got wrong. Bootstrap 
column classes (`col-sm-6`) added `width:50%` and `float:left` 
on the live page that the mockup didn't account for until v4. 
The live `.container` class added its own `max-width` that 
constrained the layout differently.

**Root causes:**
1. The mockup was built from documentation, not a live DOM 
   extraction. DOM order, class combinations, and Bootstrap 
   interactions were approximated.
2. No verification step to compare mockup DOM against live DOM 
   before extracting CSS for deployment.
3. Multiple iterations were needed to discover and fix each 
   DOM discrepancy (`:first-of-type` → `:has()`, Bootstrap 
   column reset, container max-width override).

**Rules established:** *Test CSS against real DOM before deployment* 
— before extracting CSS from a mockup for production use, verify 
the mockup's DOM structure matches the live page.

**Concrete cost:** 4-5 mockup iterations (v1-v4) spent discovering 
and fixing DOM mismatches that could have been caught upfront.

**Resolution:** Switched to `:has()` selectors (stable regardless 
of DOM order), added global Bootstrap column reset, and forced 
`.container` width. These fixes make the CSS more robust against 
DOM variations.

---

### 2026-04-21 — Offer bar rebuild skipped the simplest candidate solution

**Context:** Session 11 implemented the offer-bar rebuild plan: create 
new `.tnh-offer-bar` markup, move Beds24's `.b24-multipricebox` into 
it, hide the original. When this produced persistent alignment and 
overlap bugs, a mirror-controls proposal was written (create our own 
`<select>`, sync values to Beds24's hidden select). When the mirror 
proposal's adversarial review raised further questions, a v2 proposal 
added widget-first layout redesign. Three progressively complex 
proposals across one session.

**What happened:** A separate test applied the existing mockup v13's 
CSS and JS directly to the live Beds24 iframe at 390px. It worked on 
3 of 4 rooms with one CSS fix (`[id^="selectors1-"] { flex: 1 
!important; min-width: 0 !important }`). The tag overlap was resolved. 
The Book button alignment was resolved. The mockup — which had existed 
since Session 10 — was a working solution the entire time.

The session never tested whether the mockup's approach worked on the 
live page. Instead it treated the rebuild plan as the task, and when 
the plan's approach failed, escalated to more complex architectures 
(mirror controls, optimistic rendering, widget-first layout redesign) 
rather than questioning whether the plan's premise was correct.

**Root causes:**
1. The rebuild plan's premise — that styling Beds24's elements in place 
   was a losing specificity war — was an inference from earlier sessions, 
   not a measurement. Session 11 inherited this premise without testing 
   it.
2. The mockup was treated as a visual reference ("match this output") 
   rather than a candidate implementation ("does this CSS work on the 
   live page?"). The cheapest falsifying test — applying the mockup 
   directly — was never run.
3. Each failure was diagnosed as requiring more architecture (move → 
   mirror → optimistic render → layout redesign) rather than less. The 
   problem was getting smaller (one missing CSS rule) while the proposed 
   fixes were getting larger.
4. The 698px iframe width was not discovered until a diagnostic test 
   spec was run in a real browser late in the session. This meant all 
   "desktop" CSS work was targeting a layout that no widget user ever 
   sees. The actual rendering context was never established upfront.

**Rules established:**
- *Test the simple thing before building the complex thing* — when a 
  working reference exists (mockup, prior version), test it against the 
  real environment before designing a more complex architecture. If the 
  simple version works, ship it.
  When a working reference exists (mockup, prior version), the test is to 
  apply it to the target environment and measure. Not to compare it visually, 
  not to describe what it shows, not to use it as inspiration for a new 
  implementation. Apply, measure, observe what breaks, fix the smallest gap.
- *Know your actual viewport* — when an iframe embeds your page, your 
  CSS viewport is the iframe's width, not the user's screen. Identify 
  the actual rendering width early and design for it.

**Concrete cost:** Six commits, three proposal documents, and one 
adversarial review cycle spent on architectures that were unnecessary. 
The working solution was a CSS port plus one rule. The session produced 
useful artifacts (the diagnostic test spec, the event-listener audit 
documentation, the retrospective analysis) but the core deliverable — 
a working offer bar — was not shipped.

**Resolution:** v3 implementation plan: port mockup v13 CSS to 
CSS-base.css, add the selectors1 fix, preserve existing helper JS 
Sections 3/4/6 (revert the rebuild). Total change: one CSS rewrite, 
zero JS architecture changes, one new CSS rule.


### 2026-04-19 — The rebuild that didn't need to happen

**Context:** The offer-bar rebuild plan (14 steps, Session 11 initial 
attempt), the mirror-controls proposal (v1), and the widget-first 
layout proposal (v2) were all written over multiple sessions to address 
two visible bugs: offer bar alignment and tag/thumbnail overlap.

**What happened:** Across eight rounds of adversarial review, each 
proposal grew more elaborate. Mirror controls proposed creating 
parallel DOM elements to escape specificity wars. Widget-first layout 
proposed redesigning the mobile CSS from scratch. Total proposed 
complexity: one DOM rebuild + mirror pattern + grid-at-all-widths + 
optimistic rendering + debounce lifecycle fix.

Then a diagnostic was run: apply the v13 mockup's existing CSS and JS 
directly to the live Beds24 iframe at 390px. It worked on 3 of 4 rooms 
with one CSS rule needing to be added (flex fix on `#selectors1-` 
wrapper). The dorm room needed its existing helper JS preserved. 
That's it.

**Root causes:**

1. **Premise inheritance without verification.** The rebuild plan 
   assumed "styling Beds24's elements in place can't win the 
   specificity war." This came from Session 3's CSS-only failure 
   history. Nobody re-tested the premise. It turned out to be false.

2. **Mockup categorized as reference, not implementation.** The v12/v13 
   mockup was built in a prior session but never validated against the 
   live DOM. Subsequent sessions treated it as a design target to reach 
   via new implementation work, rather than as an existing 
   implementation to port.

3. **Adversarial review inherited the frame.** Outside reviewers 
   (Gemini, DeepSeek, Z) critiqued the proposals from within the 
   proposals' frames. They didn't ask "does this complexity need to 
   exist?" because the brief told them not to re-litigate settled 
   decisions. The decision that most needed re-litigating was the one 
   that had been settled informally, not documented as settled.

4. **Complexity escalation in response to friction.** Each time a 
   proposal hit a CSS problem, the response was a more elaborate 
   architecture rather than a check of whether simpler approaches had 
   actually been ruled out.

**Rules established:**
- Mockup-first validation
- Measurements vs inferences
- Cheapest falsifying test first
- Let the bug get smaller before the fix gets bigger
- Show the design artifact, not just the plan

**Concrete cost:** Approximately 8 rounds of review, 3 proposal 
documents, ~500 lines of superseded CSS and JS. Recoverable through 
archive, but the rollout to properties 2-4 was delayed.

---

### 2026-04-21 — Beds24 strips non-ASCII characters from programmatic admin field saves

**Context:** Session 12 saved the Chill Zone `TNH_CONFIG` object — containing 
emoji icon characters (🛏, 🚿, etc.) in room tags — to the Beds24 "Insert in 
HTML <HEAD> bottom" field via Claude in Chrome (setting `textarea.value` + 
clicking save). The save appeared to succeed; length was 968 chars. After 
reload, the emoji had been replaced with `?`.

**What happened:** The first fix attempt set the emoji characters directly via 
`String.fromCodePoint()` in the JS tool, then saved. On reload, emoji were again 
`?` and the length had reverted from 990 to 968. Beds24 silently strips 
non-ASCII characters from `customhead` on server-side save.

The fix was to use JS Unicode escape sequences (`\uD83D\uDECF`) in the 
textarea value instead of the actual emoji characters. These are pure ASCII 
and survive the save intact. When the browser executes the `<script>` block, 
the JS engine evaluates `\uD83D\uDECF` as the emoji at runtime, so tags 
display correctly.

**Root causes:**
1. Beds24's AJAX form handler sanitizes or re-encodes non-ASCII characters 
   on save for `customhead`. The mechanism is server-side and silent — no 
   error, no truncation indicator.
2. The fix was obvious in hindsight but not documented, requiring two 
   save-reload cycles to diagnose.

**Rules established:** When embedding non-ASCII characters (emoji, accented 
characters, non-Latin scripts) in Beds24 script fields via programmatic save, 
use JS Unicode escape sequences (`\uD83D\uDECF`) rather than literal 
characters. They are functionally equivalent at JS runtime and survive the 
save encoding path without corruption.

**Concrete cost:** Two extra save-reload cycles. Low impact, but would recur 
on every new property rollout without documentation.

**Resolution:** TNH_CONFIG in Chill Zone `customhead` now uses JS Unicode 
escapes for all emoji. Tags render correctly. Gotchas doc updated.

**Resolution:** v3 plan (see `docs/v3-plan.md`) ports the v13 mockup 
verbatim with the `#selectors1-` fix and preserves the pre-rebuild 
helper JS for the dorm case.