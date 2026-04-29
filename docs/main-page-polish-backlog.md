# Main Page Polish Backlog

Design decisions for booking-page polish work, captured before 
implementation. Sessions 24 and 25 implement these.

## Item 1 — Background blending

The iframe's background color doesn't match the WordPress site 
background, leaving visible off-color sections above and below the 
room cards plus a top border. Target: seamless blend with site 
background.

Likely fix in `booking-widget.js` (CSS on `.tnh-results-frame-wrap` 
or the iframe container). Implementation may discover the source is 
our own CSS or Beds24's default — fix the cheaper one.

Implementation: Session 24.

## Item 2 — Dates / Clear Search summary card

The post-search summary line ("25 Apr 2026 → 27 Apr 2026 · 2 nights 
· 1 guest" + Clear Search button) is currently unstyled text floating 
in empty space. It needs visual prominence as an actionable UI 
region.

Decision: Option A — full card treatment matching the Check 
Availability card above it, but visually lighter so it doesn't 
compete (thinner border, smaller padding, still clearly bounded).

Implementation: Session 24.

## Item 3 — Weekly rates eligibility pill

When search is 7-27 nights inclusive, show a pill below the dates 
summary indicating eligibility for weekly rates: 15% discount, free 
laundry, free room service.

Decisions:
- Trigger: 7-27 nights inclusive
- Visual: pill style, light orange, noticeable but within design bounds
- Placement: above Clear Search button, below dates summary
- Tone: factual rather than sales-y. Exact copy to be sourced from 
  the long-stays page on the Trip'N'Hostel site at implementation 
  time
- Logic: client-side, reads night count from dates state, no 
  Beds24 query needed

Implementation: Session 25.

## Item 4 — Post-Back description text

The "Welcome to Trip'N'Hostel Chill Zone..." paragraph appears on the 
post-Back state via Beds24's Property Description module. It should 
not appear at all.

This may self-resolve in Session 21's module cleanup (Property 
Description 1 and Property Description - Booking Page 1 are slated 
for removal). If it doesn't, Session 24 handles it via CSS hide.

Implementation: Session 21 (likely) or Session 24 (fallback).

## Item 5 — Stay-length tiered UX

Three-tier UX based on search night count, surfacing increasingly 
strong nudges as stay length grows.

### Tier 1: 7-27 nights — Weekly rates pill (Item 3 above)

### Tier 2: 28-89 nights — Monthly rates pill

Pill in the same visual style as the weekly pill (light orange, 
under dates summary, above Clear Search), but copy reflects monthly 
rates and contact preference. Something like "Stays of 28+ nights 
may qualify for monthly arrangements — contact us for rates." 
Room grid still shown, user can still book if they want to.

### Tier 3: 90+ nights — Replace room grid with contact message

The room grid is replaced with a clear long-stay message. Dates 
and stay length visible. Contact CTA prominent. Search form remains 
visible above so users with date typos can correct without friction.

Copy something like "This is a 95-night stay — for stays of 3 months 
or more, please contact us directly to arrange." Replacement covers 
the room cards but leaves the search form editable.

### Edge cases

- Exactly 28 nights: monthly pill (28-89 boundary inclusive of 28)
- Exactly 90 nights: replacement (28-89 ends at 89)
- Date changes mid-state: pill or replacement updates live as night 
  count changes
- 90+ user shortens dates: room grid returns cleanly (replacement 
  hides/uncovers, doesn't destroy)

Implementation: Session 25. Tier 3 needs its own small mockup pass 
before implementation, possibly in Claude Design.
