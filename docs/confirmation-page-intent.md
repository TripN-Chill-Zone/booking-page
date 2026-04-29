# Confirmation Page Design Intent

Brief for Session 22's design work in Claude Design. The mockup 
output of Session 22 (`docs/mockup-confirmation.html`) is what 
Session 23 implements.

## Current state — what's broken

Live confirmation page (visible after clicking Book on the room 
selection page) has multiple layout failures:

- Two-column layout (Guest Details left, Booking Details right) 
  forces room name and details into a cramped narrow column
- Guest Details form fields render in an unwanted two-column grid 
  (First Name alone, then Surname + Telephone, etc) when they 
  should be single-column
- Single Room and Double Room render differently from each other in 
  the booking summary even though they should be visually consistent
- Lock icon in the bottom-right of the booking summary is cut off
- On mobile, when 2 rooms are selected, the entire Guest Details 
  form disappears — there's nowhere to enter info or confirm
- On mobile with 1 room, Guest Details appears below booking 
  details but is partially clipped
- Two "Back" buttons render — both are Beds24 native, decision 
  pending on whether to keep one, hide both and add our own, or 
  style them

When either Back button is used, the user is returned to a rooms 
page with Beds24's native UI bleeding through (date strip, 
description paragraph). The dorm room is missing entirely on the 
post-Back state, and unavailable rooms render differently between 
desktop and mobile.

## Design direction

Reference: Hostelworld confirmation pages (screenshots provided in 
chat — see "image 1" and "image 4" in the conversation, also 
characterized by clean single-column form, prominent booking summary 
panel with clear room and stay info).

Design language: site's existing design (mockup.html, CSS-base.css, 
the green/orange/cream palette, Lexend type, generous spacing).

## What we know we want

- Single-column guest details form (no two-column field grid)
- Visually consistent room blocks in the booking summary, regardless 
  of room type
- Mobile-first: the form must always be visible and reachable, 
  regardless of how many rooms are selected
- Booking summary stays prominent without cramping the form
- Lock icon (or whatever security indicator) doesn't clip
- One Back button only, styled to match the site (the second one 
  is removed or hidden in Session 23)
- Post-Back returns user to a clean room results page (Session 21's 
  module cleanup may resolve the bleed-through; if not, Session 23 
  addresses)

## What's open / needs design decisions

- Exact placement of booking summary on mobile vs desktop (above 
  form, below form, side-by-side at desktop?)
- Treatment of the Arrival Time, Country of Residence, Comments 
  fields (just because they shouldn't be in a tight grid doesn't 
  mean they all need to be full-width)
- Whether to add a payment-related disclaimer or trust signal to 
  match Hostelworld's "Instant Confirmation / Secure Checkout" 
  visual cues
- Confirmation success state: when the user does submit the booking, 
  what does the post-submit page look like? (May be out of scope 
  for Session 22 mockup or a future session)

## Beds24 admin context

The confirmation page is rendered by Beds24 on a different URL than 
the room selection page. It has its own admin field for custom CSS:

"Confirmation Page Insert in HTML <HEAD>" 
(in Beds24 admin → Developer page)

Session 23's implementation lives in this field, separate from 
the room selection page's customhead.
