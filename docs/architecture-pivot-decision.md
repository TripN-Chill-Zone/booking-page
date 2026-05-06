# Architecture Pivot Decision

**Date:** 2026-05-06
**Status:** Decided. Existing project archived; new project supersedes.
**Decision authority:** Project owner

This document records the reasoning that closed the booking-page project
and opened its successor as a separate WordPress plugin built around the
Beds24 v2 API.

## Background

The booking-page project (Sessions 1–20, with Session 21 planned but not
started) was a CSS + JS layer styling Beds24's iframe-rendered booking
page for four hostel properties. By the end of Session 20, the project
had:

- A working pricing-row layout fix (Session 20)
- Resolved OCCUPANCY_EXCEEDS_MAX_PERSONS errors (Session 14)
- A still-open Attempt 5 cascade issue (per-occupancy box overriding
  width on mobile)
- A confirmation page with documented mobile rendering failures
  (`docs/confirmation-page-intent.md`)
- A Layout 6 module configuration that was already minimal — Session 21
  discovered all five named cleanup candidates were already absent from
  the layout
- An accumulated 27 active rules in `docs/retrospective.md` documenting
  failure modes encountered along the way

## What surfaced the pivot

Session 21 began with a context-recovery step that revealed the named
module-cleanup candidates were already gone. The session reshaped to
ask: "what modules do we actually need, and what was that determination
based on?" The MUST KEEP list in the original Session 21 prompt (Offer
Select, Room Features, Room Description 1) was inferred from project
documentation, not measured during Session 21.

Testing by disabling Room Features and Room Description 1 confirmed
those modules contribute the amenities pills and description text
respectively — but re-enabling caused layout regressions, and an
alternate Room Picture module rendered differently from the Slider
in ways that affected card geometry.

The user observed: if the WordPress plugin we'd been planning to build
already takes over deployment and configuration, why does Beds24 need
to render any room content at all? Why not have the plugin own the
discovery experience entirely?

## Options considered

Three architectural directions were discussed:

**Option 1 — Plugin wraps iframe.** The original plugin scope. Plugin
owns deployment ergonomics (asset enqueueing, settings UI, Beds24
admin field generation). Iframe still renders everything. Captures
maintenance wins, no architectural change to user experience.

**Option 2 — Plugin renders cards, iframe handles transactions.**
Plugin owns search, room discovery, room cards (with WordPress-served
photos and content). Iframe renders only the booking form and payment
step. Splits the project at the natural boundary between presentation
and transaction.

**Option 3 — Plugin uses Beds24 API throughout, custom payment.**
Plugin owns the full flow including booking creation and payment
processing (typically via Stripe Checkout). Iframe is removed
entirely.

## What the spike verified

A read-only feasibility spike against the Beds24 v2 API confirmed:

- Authentication via invite-code-to-refresh-token exchange works as
  documented (24-hour access tokens, 30-day refresh token lifetime
  if used regularly)
- `GET /properties` returns room metadata (id, name, occupancy limits,
  feature codes, room type) sufficient to drive room card rendering
- `GET /inventory/rooms/offers` returns total stay price and
  units-available per room for given dates and occupancy. Pricing is
  thin (no per-night or tax breakdown) but sufficient for "from
  €X/night" display.
- URL parameters for pre-populating the Beds24 booking page are
  documented and stateless: `propid`, `roomid`, `checkin`, `numnight`,
  `numadult`, etc.
- **Multi-room URL pre-population works through `sr1-{roomId}=N` and
  `naa1-1-{roomId}=N` parameter pairs.** The Beds24 booking page
  natively renders multi-item carts with a single guest-details form
  and a single payment. Verified by inspecting the live URL of an
  existing three-room booking session.

The spike also surfaced two constraints:

- Room descriptions and photos entered in Beds24's native admin UI
  are not exposed through the v2 API. Content for the new plugin
  must live in WordPress.
- Feature codes are returned as opaque OTA codes (`PRIVATE_BATHROOM`,
  etc.) without human-readable labels. The plugin must maintain a
  code-to-label mapping or store amenities as labeled strings
  independently.

## Decision

**Option 2, with multi-room cart support.**

The plugin owns:

- Search form (dates only — no guest picker)
- Results page with room cards rendered from API data plus
  WordPress-hosted content
- "Your Stay" cart accumulation across multiple rooms or dorm beds
- Confirm Booking button that constructs a multi-room URL for the
  Beds24 iframe

Beds24 owns:

- Guest details form
- Custom questions
- Payment processing (via the property's existing payment gateway
  configuration in Beds24)
- Booking creation
- Email confirmations
- Booking management (refunds, cancellations, modifications)
- All of this happens inside the iframe loaded after Confirm Booking

The boundary is the Confirm Booking button. Everything before is
WordPress-rendered; everything after is Beds24-rendered.

## Why this option

**Risk management.** Card-handling and payment-processing code is
high-stakes. Bugs there have financial consequences for guests and
operators. Beds24 has a battle-tested implementation of this layer.
The plugin reuses it rather than replacing it.

**Operator workflow.** The current operator finds Beds24 admin
difficult to use. Moving content management to WordPress (where they
already manage site content) is a usability improvement, not a
compromise.

**Scope honesty.** Option 3 (custom payment) was tempting because it
produces the cleanest end-state architecturally. But it also expands
scope into PCI considerations, Stripe integration, refund flows,
booking-payment desynchronization handling, and webhook orchestration.
The hostel use case doesn't require that level of control. The
boundary at Confirm Booking is cleaner because it draws the line
where the risk profile changes.

**Multi-room support.** The discovery that Beds24's iframe natively
handles multi-item booking carts (verified by URL inspection)
eliminated the strongest argument for Option 3. The plugin can compose
multi-room carts and hand them off to Beds24 for transaction processing
in a single URL.

**Project continuity.** The accumulated design language, the mockup,
the typography choices, the color palette, the layout density — all
of this ports forward. The 27 retrospective rules apply unchanged.
The Beds24 admin learnings inform the plugin's settings UI design.
The pivot does not reset the project to zero; it changes the rendering
substrate.

## Design principles that emerged

Three principles fall out of this architecture and should be carried
into the new project's CLAUDE.md as guidance for future sessions:

1. **Search filters by date only.** Capacity is communicated per card
   and chosen per card. No guest picker on the search form.
2. **The plugin handles discovery; Beds24 handles transactions.** The
   boundary is Confirm Booking. Future requests to "let the plugin
   do the form" or "let the plugin take payment" are answered by
   this principle.
3. **Content lives in WordPress.** Room descriptions, photos, and
   amenity labels are managed in the WordPress plugin admin. Beds24
   is the property management backend; WordPress is the content
   management frontend. Future requests to sync content from Beds24
   are answered by this principle.

## What carries forward

To the new project's repository:

- `docs/retrospective.md` — institutional memory. The 27 active rules
  apply unchanged. Historical entries port as background context.
- `docs/skill/SKILL.md` — working discipline (any architecture-agnostic
  parts).
- `docs/mockup.html` — the approved design language.
- `docs/main-page-polish-backlog.md` — design decisions for results
  page polish (some items resolve by construction in the new
  architecture; others remain relevant).
- `docs/confirmation-page-intent.md` — design intent (the page itself
  is now Beds24-rendered, but the intent informs how the plugin
  should style the iframe via injected CSS).

What does not carry forward:

- `CSS-base.css`, `beds24-iframe-helper.js`, `booking-widget.js` — the
  rendering substrate has changed.
- `docs/skill/dom-structure.md`, `docs/skill/helper-js-architecture.md`,
  `docs/skill/css-architecture.md` — describe artifacts that no longer
  exist.
- The GitHub Actions deployment to astrongpresence.com — the new
  plugin deploys via WordPress's standard plugin installation.
- `docs/session-27-crosslink-setup.md` — the original Crosslink plan
  was scoped against the old project's rollout. A fresh decision on
  Crosslink is part of the new project's tooling setup.

## What does not carry forward but is worth noting

- The Layout 6 module configuration (Offer Select only, in the new
  architecture) becomes property setup documentation. Each property
  in the new project's rollout will need its Beds24 admin set to
  this minimum configuration before the plugin is installed.
- The `numadult=1` bug in the existing `booking-widget.js` is fixed
  by construction in the new plugin (per-room adult count is sent
  via the multi-room URL scheme). The bug's existence is recorded
  here because it affects current bookings until the new plugin
  ships.

## Status of the existing repository

Archived after this document and the post-pivot retrospective entry
are committed. Tag the final commit. Leave the repo public for
historical reference. Future commits go to the new repository.
