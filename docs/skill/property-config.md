# Property Configuration

Per-property data for the Trip'N'Hostel booking pages. Each property 
has its own config object that gets pasted into its Beds24 
`customhead` field. This document is the source of truth for those 
configs.

## How property config works

The shared `beds24-iframe-helper.js` is property-agnostic product 
code. It reads per-property data from `window.TNH_CONFIG`, which each 
property sets in its own Beds24 `customhead` field before loading 
the helper.

If `window.TNH_CONFIG` is missing or invalid, the helper halts with 
a console error. There is no hardcoded fallback. This is deliberate — 
it forces the discipline that the helper never contains 
client-specific data.

---

## Schema v1

```js
window.TNH_CONFIG = {
  schemaVersion: 1,              // integer. Helper checks this.
  propertyId: "string-id",       // arbitrary string, for logging
  rooms: [
    {
      id: 567218,                // integer. Beds24 room ID.
      isDorm: false,             // boolean. Affects offer bar rendering.
      tags: [
        { icon: "🛏", text: "Sleeps 2" },
        // ...
      ]
    },
    // ...
  ]
};
```

**Field notes:**

- `schemaVersion` is checked by the helper's `isValidConfig()` 
  function. Future schema changes increment this; older properties 
  continue to work on their version until updated.
- `propertyId` is for human/debug use only. The helper logs it and 
  includes it in error messages but doesn't use it for logic.
- `rooms` is an array, not an object keyed by ID. Order doesn't 
  matter; the helper looks up rooms by ID.
- `isDorm` is required per room. The helper uses it to select the 
  dorm-specific offer bar rendering path (guest selector instead of 
  qty selector, "Beds" label instead of "Select").
- `tags` is an array of `{ icon, text }` objects. Icon is typically 
  a unicode emoji; text is the tag label. Order is preserved in 
  rendering.

---

## Deployment pattern

Each property's `customhead` field (Beds24 admin → Developer → Insert 
in HTML &lt;HEAD&gt; bottom) contains:

```html
<script>
window.TNH_CONFIG = {
  schemaVersion: 1,
  propertyId: "chillzone",
  rooms: [
    // ... full config, see below
  ]
};
</script>
<script>
var s = document.createElement('script');
s.src = 'https://astrongpresence.com/beds24-iframe-helper.js?v=' + Date.now();
document.head.appendChild(s);
</script>
```

The config block MUST come before the helper bootstrapper, so 
`window.TNH_CONFIG` exists before the helper initializes.

`customhead` does not strip `<script>` tags on save (unlike 
`custombody`), so this can be saved programmatically. But silent save 
failures still occur — always reload the admin page and verify the 
content persisted.

---

## Trip'N'Hostel Chill Zone

**Property ID:** 271142
**Owner ID:** 141266
**Booking page:** `https://www.beds24.com/booking2.php?ownerid=141266&propid=271142`
**WordPress:** `https://chillzone.astrongpresence.com/book-a-room` (URL confirmed at rollout)

**Brand:**
- Primary: `#E7A35C` (orange, used for Book button)
- Secondary: `#6DA17D` (green)
- Text: `#2D482D`
- Text light: `#5a6f5a`
- Background: `#F7FAFC`
- Background (white): `#ffffff`
- Border: `#EDF2F7`
- Font (body): Lexend
- Font (headings): Lexend Giga

**Config:**

```js
window.TNH_CONFIG = {
  schemaVersion: 1,
  propertyId: "chillzone",
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

**Room descriptions (for Beds24 Content entry):**

- **Deluxe King Suite (567218):** "Spacious premium suite with a 
  huge king-sized bed, ensuite bathroom and panoramic city views. 
  Perfect for extended stays."
- **Single Bed in 4-Bed Dormitory (567219):** "A comfortable bed in 
  a modern 4-person dorm. Great value with a social atmosphere — 
  meet fellow travelers without breaking the bank."
- **Single Room with Shared Bathroom (567220):** "Ideal room for solo 
  travelers who value privacy and the social atmosphere of a co-living 
  space. A quiet, private room to call your own."
- **Double Room with Shared Bathroom (567221):** "Private double room 
  for couples or friends. All the comfort and privacy you need, with 
  full access to our shared spaces."

---

## Trip'N'Hostel — Property 2

**Status:** TODO — fill in at rollout
**Property ID:** TODO
**Owner ID:** TODO
**Booking page:** TODO
**WordPress:** TODO

**Brand:**
- Primary: TODO
- Secondary: TODO
- Text: TODO
- Text light: TODO
- Background: TODO
- Border: TODO
- Font (body): TODO
- Font (headings): TODO

**Config:**

```js
window.TNH_CONFIG = {
  schemaVersion: 1,
  propertyId: "TODO",
  rooms: [
    // TODO: populate per-room data at rollout
  ]
};
```

**Room descriptions:**

- TODO

---

## Trip'N'Hostel — Property 3

**Status:** TODO — fill in at rollout
**Property ID:** TODO
**Owner ID:** TODO
**Booking page:** TODO
**WordPress:** TODO

**Brand:**
- Primary: TODO
- Secondary: TODO
- Text: TODO
- Text light: TODO
- Background: TODO
- Border: TODO
- Font (body): TODO
- Font (headings): TODO

**Config:**

```js
window.TNH_CONFIG = {
  schemaVersion: 1,
  propertyId: "TODO",
  rooms: [
    // TODO: populate per-room data at rollout
  ]
};
```

**Room descriptions:**

- TODO

---

## Trip'N'Hostel — Property 4

**Status:** TODO — fill in at rollout
**Property ID:** TODO
**Owner ID:** TODO
**Booking page:** TODO
**WordPress:** TODO

**Brand:**
- Primary: TODO
- Secondary: TODO
- Text: TODO
- Text light: TODO
- Background: TODO
- Border: TODO
- Font (body): TODO
- Font (headings): TODO

**Config:**

```js
window.TNH_CONFIG = {
  schemaVersion: 1,
  propertyId: "TODO",
  rooms: [
    // TODO: populate per-room data at rollout
  ]
};
```

**Room descriptions:**

- TODO

---

## Future hosted-tier clients

When a client buys the hosted-subscription tier (as opposed to 
one-time self-hosted setup), their config may live in a file on the 
VPS rather than inline in their `customhead`. The helper's 
`resolveConfig()` function is structured to accept a fetch-based 
branch when that path is built.

Until a hosted client exists, this is not implemented. The 
architecture note is here so the decision is preserved.

---

## Schema changelog

- **v1 (Session 12, 2026-04-21):** Initial schema. Fields: 
  `schemaVersion`, `propertyId`, `rooms[]` with `id`, `isDorm`, 
  `tags[]` (each with `icon` and `text`).
