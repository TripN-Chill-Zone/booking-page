# OTA Channel Reference

Architectural reference for how Beds24 pushes prices and availability 
to OTA channels (Booking.com, Hostelworld). Covers the two-sided 
nature of channel configuration, pricing models, rate types, and the 
constraints specific to hostel/dorm properties.

For procedural steps (admin navigation, field locations), see 
`admin-guide.md`. For known errors and symptom-based lookup, see 
`gotchas.md`. For per-property config values, see `property-config.md`.

---

## The two-sided nature of channel configuration

Every channel has two configuration surfaces:

1. **Beds24 side** — settings in Channel Manager → [Channel] → Mapping, 
   plus Daily Price Rules and Rate Plans
2. **Channel side** — settings in the OTA's own admin (Booking.com 
   Extranet, Hostelworld admin)

Both sides must be aligned. Misalignment produces either explicit 
errors (e.g., OCCUPANCY_EXCEEDS_MAX_PERSONS) or silent wrong prices.

The Beds24 side is where you control how prices are pushed. The 
channel side determines how the channel stores and interprets what 
it receives. A Beds24 setting has no effect if the channel's rate 
is configured incompatibly.

---

## Booking.com: pricing models

Booking.com supports three pricing models. Each has different 
implications for what Beds24 sends and what Booking expects.

### Per Day Pricing (Standard)

- Beds24 sends **one price per rate per date**
- Booking stores that price as the room price
- For dorms, Booking treats "the room price" as the per-bed price 
  because dorm rooms have max_persons=1 (one bed = one rate unit)
- **This is the required model for dorms.** Booking.com does not 
  accept occupancy-based pricing for dorm rooms.

### Per Occupancy Pricing (OBP)

- Beds24 sends **multiple prices per rate per date** — one for each 
  occupancy (1 guest, 2 guests, 3 guests, etc.)
- Booking stores a separate price for each occupancy
- Used for rooms where the price scales with guest count
- **Beds24 sets all newly connected properties to OBP by default**, 
  which is wrong for dorms

### Derived Pricing (RLO)

- Beds24 sends **one base price** per rate per date
- Booking calculates prices for other occupancies using derivation 
  rules configured on their side
- Used for rooms where the price should scale but you want Booking 
  to handle the math (e.g., "1 person = 80% of double price")
- RLO rates require Booking's support team to configure the 
  derivation rules on their end

### How to check which pricing type a Booking.com rate uses

In Beds24:

1. Channel Manager → Booking.com → Mapping
2. Click **"Get the Booking.com Room and Rate Codes for this 
   Property Code"**
3. Response is XML. Search for `<pricing type="..."` on each rate:
   - `<pricing type="Standard"` → Per Day Pricing
   - `<pricing type="OBP"` → Per Occupancy Pricing
   - `<pricing type="RLO"` → Derived Pricing

A property can have different pricing types on different rates. This 
is normal.

### How to change a Booking.com pricing type

The Beds24 side ("Pricing Model" dropdown in Channel Manager → 
Booking.com → Mapping) can be changed directly. This affects what 
Beds24 sends.

The Booking.com side usually requires Booking's support team to 
change (for RLO setup/teardown) or has specific implications per 
rate. Per the Beds24 wiki:

> If you want to send occupancy pricing to Booking.com, send a 
> Support ticket and ask the Beds24 team to update your Booking.com 
> Pricing model to OBP.

> If your pricing model is RLO (derived prices) only Booking.com can 
> change rate plans. Contact Booking.com support or change to 
> Occupancy Pricing.

The direction of change matters: going from OBP to Per Day Pricing 
is generally non-destructive (Beds24 just stops sending the extra 
occupancy prices). Going from Per Day to OBP requires Booking to 
clear linked prices first.

---

## Dorm-specific constraints

Per the Beds24 wiki:

> Booking.com does not support occupancy pricing for dorms. If you 
> have dorms log into your Booking.com account and change your 
> pricing model to "Standard" and set the Pricing model in Beds24 
> to "Per Day".

> For dorms Booking.com requires the bed price be sent to them as 
> the room price. Therefore they do not accept a single price for a 
> dorm.

Practically, this means:

- **Beds24 Pricing Model** = Per Day Pricing
- **Daily Price Rule "Price For"** = Max Room Capacity (not Per Person)
- **Daily Price calendar value** = the price for one bed (what the 
  guest actually pays per bed per night)
- **Booking.com rate pricing type** = Standard
- **Rate max_persons on Booking** = 1 (one bed per rate unit)

When all five align, guests see the correct per-bed price on 
Booking.com, and multi-bed selections multiply cleanly (€X × 2 beds, 
€X × 3 beds, etc.).

---

## Daily Price Rules: "Price For" semantics

The "Price For" field on a Daily Price Rule controls how Beds24 
interprets the calendar value and how it's pushed to channels.

### Per Person

- Calendar value represents price for one person
- Beds24 can push per-occupancy prices to channels that support OBP
- Valid for dorms on OBP-enabled channels (not Booking.com dorms)

### Max Room Capacity

- Calendar value represents the price for the room at maximum 
  capacity
- Beds24 pushes a single price to the channel
- Correct for dorms under Per Day Pricing — Booking.com interprets 
  the pushed price as the per-bed price because max_persons=1

### Up to N People

- Calendar value represents price for a specific occupancy count
- Used for rooms with occupancy-based pricing where you want to 
  define prices at multiple tiers (e.g., "Up to 2 People" + "Up to 
  3 People" + "Up to 4 People")

### Important: changing "Price For" changes what the calendar value means

Switching "Price For" between Per Person and Max Room Capacity 
doesn't rescale existing calendar values. The calendar number stays 
the same but its interpretation changes. Typically this means:

- If the calendar has per-bed prices and "Price For" = Per Person → 
  Beds24 multiplies by occupancy for OBP channels
- If "Price For" changes to Max Room Capacity → Beds24 sends the 
  raw calendar value as the room price
- For dorms where max_persons=1 on Booking's rate, "room price" = 
  "per bed price" because the rate represents one bed

Always verify after changing "Price For" that the pushed prices on 
the channel are correct. Beds24 admin may also silently fail to 
save "Price For" changes — reload the admin page and confirm 
persistence.

---

## Derived rates in Beds24 (separate from RLO)

Beds24 supports its own rate derivation via "Rate Relations" — e.g., 
a Weekly Rate that is 90% of the Standard Rate, or a Monthly Rate 
that is 75%.

This is separate from Booking.com's RLO pricing type. Beds24's rate 
relations happen inside Beds24, before pushing to any channel. 
Booking's RLO happens inside Booking, after receiving a base price 
from Beds24.

You can use both: a Beds24 Weekly Rate (derived at 90% of Standard) 
that pushes to a Booking.com rate with Standard pricing type. 
Beds24 computes the 90% internally and pushes the resulting number 
as a standalone price. No interaction between the two systems' 
derivation logic.

---

## Channel multipliers and markups

Beds24 supports per-channel multipliers to add commission or 
markup. Set in Channel Manager → [Channel] → Mapping → Multiplier.

- Multiplier = 1.15 adds 15%
- Multiplier = 0.90 discounts 10%
- Blank = no multiplier (1.0)

Multipliers are applied by Beds24 before the price is pushed. The 
calendar value in Beds24 is the "base" price; the multiplier 
produces the "channel" price.

Example: Standard Rate calendar = €16, multiplier = 1.15 → pushed 
to channel as €18.40.

---

## Hostelworld

Hostelworld accepts Per Day Pricing. Dorms work with Standard rate 
configuration the same way Booking.com dorms do — one price per 
rate per date, interpreted as the per-bed price.

The Pricing Model dropdown in Beds24's Channel Manager is 
Booking.com-specific. Hostelworld uses its own Channel Manager 
settings under Channel Manager → Hostelworld → Mapping.

Unlike Booking.com, Hostelworld doesn't have a mode equivalent to 
OBP. All Hostelworld prices are per-rate-per-date single values. 
Configuration is simpler.

---

## Configuration alignment table (dorm-specific)

For a property with a dorm room distributed via both Booking.com 
and Hostelworld, the required configuration is:

| Setting | Required value |
|---|---|
| Beds24 room-level Max Guests | = number of beds in dorm |
| Beds24 Pricing Model (Booking.com) | Per Day Pricing |
| Beds24 Daily Price Rule "Price For" | Max Room Capacity |
| Beds24 Daily Price calendar value | per-bed price |
| Beds24 Channel Multiplier | as needed for commission/markup |
| Booking.com rate pricing type | Standard |
| Booking.com rate max_persons | 1 |
| Hostelworld rate | standard single-price per rate |

If any of these are off, expect silent wrong prices or explicit 
errors.

---

## How to diagnose channel-related pricing issues

The cheapest diagnostic is cross-property comparison, assuming you 
have a working property to compare against.

1. **Compare Beds24 admin configs side-by-side.** Open both 
   properties' admin in separate tabs. Compare Pricing Model, 
   Daily Price Rules, room setup fields.

2. **Compare channel XML via "Get Codes".** For each property, run 
   the "Get the Booking.com Room and Rate Codes" function and 
   compare `pricing type` values per rate. A mismatch between 
   Beds24's Pricing Model and the channel's pricing type is a 
   common cause.

3. **Use Beds24 Price Check Tool.** Beds24 has a diagnostic tool 
   that shows which prices apply for a specific date/occupancy and 
   why. Useful for confirming Beds24's internal math is correct 
   before looking at what's being pushed.

4. **View what's actually being sent to the channel.** Some channel 
   manager pages have a "View Actual Data" button showing the raw 
   payload Beds24 pushes. When available, this is the definitive 
   check.

5. **Verify on the channel itself.** After any change, load the 
   channel's own admin or public page to confirm prices display 
   correctly. Channel-side cache may delay the update by several 
   minutes; trigger a manual sync in Beds24 to speed this up.

Prefer measurement over hypothesis. The wiki documentation is 
extensive but doesn't cover every edge case; direct observation of 
both sides' configuration is often faster than searching docs.

---

## Known tricky cases

### Dorm with Beds24 OBP + Booking.com Standard rate

Produces OCCUPANCY_EXCEEDS_MAX_PERSONS errors. Beds24 tries to push 
prices for occupancies 2, 3, 4; Booking's rate only accepts 
occupancy 1. Fix: change Beds24 Pricing Model to Per Day Pricing.

See `gotchas.md` → OCCUPANCY_EXCEEDS_MAX_PERSONS for the full 
symptom and fix.

### Silent save failures on "Price For"

The Daily Price Rule's "Price For" field can silently fail to 
persist when changed via Beds24 admin. Always reload and verify 
after saving.

### Rate calendar value ambiguity when switching "Price For"

If you have a dorm with calendar value = per-bed price (e.g., 
€18.40), this works for both "Per Person" (Beds24 multiplies for 
OBP) and "Max Room Capacity" (Beds24 sends €18.40 as the room 
price, Booking interprets as per-bed because max_persons=1). Same 
calendar value, same correct output price — but different semantic 
paths. When changing "Price For", the calendar value shouldn't need 
to change for dorms where the rate is max_persons=1. For other 
rooms where max_persons > 1, the calendar value may need to be 
rescaled when switching.

### Mixed pricing types across rooms in one property

A property can have some rates on Standard and others on RLO. 
Beds24's property-level Pricing Model setting governs what Beds24 
sends; individual rates on the channel side determine what the 
channel accepts. Non-matching combinations (e.g., Beds24 OBP + 
Booking RLO rates) may produce warnings even when individual rooms 
work, per Beds24 wiki's error codes list 
(OBP_PRICING_PASSED_FOR_RLO_RATE and similar).

---

## References

- Beds24 wiki — Booking.com synchronisation: 
  https://wiki.beds24.com/index.php/Booking.com:_Synchronise_bookings_prices_availability
- Beds24 wiki — Booking.com rate plans: 
  https://wiki.beds24.com/index.php/Booking.com:_Create_Booking.com_Rate_Plans_in_Beds24
- Beds24 wiki — Hostel and retreat setup: 
  https://wiki.beds24.com/index.php/Hostel_and_Retreat_Setup
- Beds24 wiki — Occupancy-based prices: 
  https://wiki.beds24.com/index.php/Occupancy_Based_Prices

---

## Changelog

- **2026-04-24 (Session 14):** Initial document. Covers Booking.com 
  pricing models, dorm-specific configuration, and the diagnostic 
  process used to resolve Chill Zone's OCCUPANCY_EXCEEDS_MAX_PERSONS 
  errors.
