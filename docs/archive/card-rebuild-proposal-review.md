# Adversarial Review — Card Rebuild Proposal

**Reviewer:** Claude Opus 4.7
**Date:** 2026-04-17
**Documents reviewed:** `card-rebuild-proposal.md`, `beds24-iframe-helper.js` (current, 588 lines), `CSS-base.css` (current, 472 lines), `docs/skill/gotchas.md`, `docs/skill/dom-structure.md`, and the Beds24 skill file.
**Not reviewed (intentionally):** `beds24-execution.md`, `beds24-execution-context.md`, `mockup.html`, `booking-widget.js`. The proposal explicitly scopes the widget and mockup out of the rebuild, and the execution docs are process history rather than technical constraints.

---

## TL;DR

**The core idea is probably right but the proposal is selling it too hard.** Hiding Beds24's card body and rendering your own markup is a well-understood escape hatch from a hostile host DOM, and it is likely the correct move. But the proposal presents it as a clean-sweep simplification when in practice it is a risk **re-shaping** exercise: you trade a class of problems you have characterised (CSS specificity wars, offer-bar alignment) for a class of problems you have not yet had to solve (re-render races, form-state preservation across moves, a full custom carousel, extraction-selector drift, host JS timing).

I would recommend proceeding **only after** addressing the concrete gaps in Sections 2, 3, and 4 below. Several of the "risks and mitigations" in the proposal are under-specified or, in two cases, factually questionable.

---

## 1. Claims in the proposal that don't hold up

### 1.1 "Beds24 uses delegated listeners on the form, not direct listeners on selects" — unverified and load-bearing

This is the single most important assumption in the whole proposal. The entire case for *moving* rather than *cloning* `<select>` elements rests on it. The proposal states it as a fact. Nothing in `gotchas.md`, `dom-structure.md`, or the current helper source demonstrates that this is actually true. The current helper moves exactly **one** `<select>` — `naa1-1-{roomId}` for dorms, from the orphan price box into the main box — and that `<select>` is already CSS-hidden for private rooms, so nobody has observed whether its direct event listeners survive the move for rooms that actually use it. The "proven" evidence is thin.

**Post-review status: RESOLVED.** Event listener audit conducted. The qty select has 2 direct jQuery change handlers stored via jQuery's expando property. Moving the element with `appendChild` preserves the handlers (verified: 2 handlers before move, 2 after move to temp div, 2 after restore). Handlers still fire correctly after the move — Beds24 toggled `.hidden` on from-div after a change event dispatched on the moved-and-restored select.

### 1.2 "Form submission reads values by `name` attribute, not by visibility" — true but incomplete

The claim is correct for the HTTP form submission itself. But Beds24 doesn't just submit — it does per-select `.change()` handlers that update the visible price, hide/show boxes, toggle `.hidden`, etc. The proposal conflates "form submit works" with "all form-related behaviour works". These are different.

**Post-review status: RESOLVED.** Panel-body hide experiment confirmed: hiding `.b24panel` with `display:none` doesn't break form submission, and Beds24's change handlers still fire on hidden selects. `FormData` still reads `sr1-567220=1` from a select inside a hidden parent.

### 1.3 "The loading spinner in the widget covers this transition" — verify before relying on it

**Post-review status: RESOLVED by scope reduction.** The offer-bar-only rebuild doesn't hide the panel-body, so no card-level flash occurs. The offer bar construction happens after the card is already visible.

### 1.4 The skill file describes a non-iframe architecture

**Post-review status: ACKNOWLEDGED.** The skill file needs updating. Noted in session-handoff-10.md as a documentation debt item.

---

## 2-3. Risks and pre-approval requirements

### Resolved items:
- Event-listener audit (§1.1) — complete, moves are safe
- Idempotency (§3.2) — handled by Check A result: widget reloads iframe entirely (A1), no in-iframe date changes
- Carousel decision (§3.3) — resolved by scope reduction to offer-bar-only; carousel stays native
- Rollback plan (§3.5) — `git revert` + auto-deploy via GitHub Actions

### Carried forward to implementation plan:
- Unavailable/available/qty-selected state machine (§2.5) — enumerated in offer-bar-rebuild-plan.md §2.2
- `bookmult` hidden input preservation (§2.6) — addressed in Step 7
- Line-count targets (§3.6) — set at CSS <390, JS <500

---

## 4. A third option the proposal doesn't consider

**Rebuild the offer bar only. Leave heading, photo, description, tags alone.**

**Post-review status: ADOPTED.** This is now the implementation plan. See `offer-bar-rebuild-plan.md`.

---

## 5. Smaller notes

- Line count discrepancy (577 vs 588) — acknowledged, minor
- Section 2 listed as "unchanged" when already removed — acknowledged
- `sortRooms()` marker bug on re-render — noted, low priority (A1 means full reload)
- CSS line target may be optimistic — adjusted to <390 (from <200 in original proposal)
- Open Question 1 (visibility-dependent behaviors) — resolved by scope reduction and experiments
- Open Question 3 (hardcoded tags) — deferred, orthogonal to rebuild

---

## 6. Recommendation

**Original recommendation: Do not approve as written.**

**Updated recommendation: Approved with scope reduction to offer-bar-only.** All gating experiments completed. Implementation plan written and reviewed. Proceed with `offer-bar-rebuild-plan.md`.
