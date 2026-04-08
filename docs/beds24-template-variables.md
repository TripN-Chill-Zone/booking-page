# Beds24 Template Variables Reference

These shortcodes are replaced with booking/property data. Usable in any text field that supports them: auto-action emails, confirmation pages, invoice templates, custom text fields, and the API.

**Syntax rules:**
- Copy exactly including `[BRACKETS]` and uppercase
- Date variables accept offset: `[FIRSTNIGHT:-3 days]`
- Price variables accept offset: `[PRICE:-10]` or `[INVOICEBALANCE:25%]`
- Always use `NUM` suffix variables in calculations (decimal point, no thousands separator, no currency)

---

## Property

| Variable | Returns |
|---|---|
| `[PROPERTYNAME]` | Property name |
| `[PROPERTYID]` | Property ID |
| `[PROPERTYEMAIL]` | Property email |
| `[PROPERTYWEB]` | Property website |
| `[PROPERTYPHONE]` | Property phone |
| `[PROPERTYADDRESS]` | Address |
| `[PROPERTYCITY]` | City |
| `[PROPERTYSTATE]` | State |
| `[PROPERTYCOUNTRY]` | Country |
| `[PROPERTYPOSTCODE]` | Postcode |
| `[PROPERTYCURRENCY]` | Currency code |
| `[PROPERTYCURRENCYFRONT]` | Currency symbol (before number) |
| `[PROPERTYCURRENCYBACK]` | Currency symbol (after number) |
| `[PROPERTYLATITUDE]` / `[PROPERTYLONGITUDE]` | Coordinates |
| `[PROPERTYCONTACTFIRSTNAME]` / `[PROPERTYCONTACTLASTNAME]` | Contact name |
| `[PROPERTYFAX]` | Fax |
| `[PROPERTYHEADLINE]` | Headline |
| `[PROPERTYDESCRIPTION]` | Description |
| `[PROPERTYLOCATIONDESCRIPTION]` | Location description (`BR` suffix = line breaks) |
| `[PROPERTYDIRECTIONS]` | Directions (from Channel Manager > Property Content) |
| `[PROPERTYGENERALPOLICY]` | General policy (`BR` = line breaks) |
| `[PROPERTYCANCELPOLICY]` | Cancellation policy (`BR` = line breaks) |
| `[PROPERTYHOUSERULES]` | House rules (`BR` = line breaks) |
| `[PROPERTYGROUP]` | Group keywords |

**Check-in/out times** (from Channel Manager > Property Content):
`[CHECKINSTART]` `[CHECKINEND]` `[CHECKOUTEND]` — 24hr format
`[CHECKINSTART12]` `[CHECKINEND12]` `[CHECKOUTEND12]` — 12hr format

**Booking page content fields** (from Booking Engine > Property Booking Page > Content):
`[PROPERTYDESCRIPTION1]` `[PROPERTYDESCRIPTION2]` `[PROPERTYDESCBOOKPAGE1]` `[PROPERTYDESCBOOKPAGE2]` `[PROPERTYGUESTDETAILSHEADER]` `[PROPERTYGUESTENQUIRYHEADER]` `[PROPERTYCONFIRMBOOKBUTTON]` `[PROPERTYROOMNOTAVAIL]` `[PROPERTYROOMNOPRICE]` `[PROPERTYNOROOMSAVAIL]`

**Templates** (1–8): `[PROPERTYTEMPLATE1]` through `[PROPERTYTEMPLATE8]` (`BR` suffix = line breaks)

**Channel IDs:** `[BOOKINGCOMHOTELID]` `[EXPEDIACOMHOTELID]` `[PERMITID]`

---

## Room

| Variable | Returns |
|---|---|
| `[ROOMID]` | Room ID |
| `[ROOMNAME]` | Room names (all booked, excludes cancelled) |
| `[ROOMNAMEINC]` | Room names (includes cancelled) |
| `[ROOMNAME1]` | First booked room name |
| `[ROOMNAMES]` | Room names with quantities |
| `[ROOMNAMEOFFER]` | Room names with offer name |
| `[ROOMTYPEDESC]` | Accommodation type (first room) |
| `[ROOMTYPEDESCS]` | Accommodation type (all rooms) |
| `[ROOMSIZE]` | Room size |
| `[ROOMDESCRIPTION]` | Description (Channel Manager > Room Content) |
| `[ROOMDESCRIPTION1]` | Description 1 (Properties > Rooms > Setup) |
| `[INTERNALROOMNAME]` | Internal name (control panel, not translated) |
| `[ROOMMETAAUXTEXT]` | Auxiliary text (first room) |
| `[ROOMMETAAUXTEXTS]` | Auxiliary text (all rooms) |

**BR suffix** available on: `ROOMNAME`, `ROOMNAMEINC`, `ROOMNAMES`, `ROOMNAMEOFFER`, etc.

**Offer variables:**
`[OFFERID]` `[OFFERNAME]` `[OFFERNAME1]` `[OFFERDESCRIPTION1]` `[OFFERDESCRIPTION2]` `[OFFERSUMMARY]`

**Unit variables:**
`[UNITNAME]` `[UNITNAME1]` `[UNITNAME1:1]` (additional info) `[UNITSTATUS1]`

**Room financials** (from Channel Manager > Room Content):
`[ROOMRACKRATENUM]` `[ROOMCLEANINGFEENUM]` `[ROOMSECURITYDEPOSITNUM]` `[ROOMTAXPERCENTNUM]` `[ROOMTAXPERSONNUM]`

**Room templates** (1–8): `[ROOMTEMPLATE1]` through `[ROOMTEMPLATE8]` (`BR` suffix available)

**Availability triggers:** `[LEAVINGDAYAVAIL]` (yes/no) `[NUMROOMSAVAIL]` (count, -1 if overbooked)

---

## Booking — Identity & Status

| Variable | Returns |
|---|---|
| `[BOOKID]` | Booking reference number |
| `[BOOKIDS]` | All booking refs in group |
| `[GROUPID]` | Master booking reference |
| `[STATUS]` | Booking status |
| `[SUBSTATUS]` | Sub status |
| `[FLAG]` | Flag |
| `[STATUSCODE]` | Status code (0–100) |
| `[APIREF]` | Channel booking number |
| `[APISOURCE]` | Channel number |
| `[APISOURCETEXT]` | Channel name (human readable) |
| `[REFERRER]` | Referrer |
| `[ORIGINALREFERRER]` | Original referrer |
| `[BOOKINGIP]` | Booker's IP address |
| `[VIEWBOOKING]` | URL to view booking in control panel |

Partial booking ID: `[BOOKIDLAST1]` through `[BOOKIDLAST8]`
Random seeded from booking: `[RANDOM1]` through `[RANDOM8]`

---

## Booking — Dates & Stay

| Variable | Returns |
|---|---|
| `[FIRSTNIGHT]` | Check-in date |
| `[LASTNIGHT]` | Last night |
| `[LEAVINGDAY]` | Check-out date |
| `[NUMNIGHT]` | Number of nights |
| `[NUMNIGHTS]` | Nights (sum across group) |
| `[BOOKINGDATE]` | Booking creation date |
| `[BOOKINGTIMEDATE]` | Booking date + time |
| `[GUESTARRIVALTIME]` | Arrival time |
| `[DAYSTOCHECKIN]` | Days until check-in |
| `[INADVANCE]` | Days between booking and check-in |

**Short format** suffix: `SHORT` (e.g. `[FIRSTNIGHTSHORT]` = "1 Apr 2016")
**ISO format** suffix: `YYYY-MM-DD` (e.g. `[FIRSTNIGHTYYYY-MM-DD]`)
**Custom format**: `[FIRSTNIGHT:{%A, %e %B, %Y}]`
**With offset**: `[FIRSTNIGHT:+1day{%A, %e %B, %Y}]`

**Turnover:** `[TURNOVERDAYS]` (days to next arrival) `[VACANTDAYS]` (days from previous checkout)

---

## Booking — Guest Info

| Variable | Returns |
|---|---|
| `[GUESTTITLE]` | Title |
| `[GUESTFIRSTNAME]` | First name |
| `[GUESTNAME]` | Last name |
| `[GUESTFULLNAME]` | Title + first + last |
| `[GUESTEMAIL]` | Email |
| `[GUESTPHONE]` / `[GUESTPHONENUM]` | Phone (formatted / digits only) |
| `[GUESTMOBILE]` / `[GUESTMOBILENUM]` | Mobile (formatted / digits only) |
| `[GUESTADDRESS]` | Address (`BR` = line breaks) |
| `[GUESTCITY]` | City |
| `[GUESTSTATE]` | State |
| `[GUESTPOSTCODE]` | Postcode |
| `[GUESTCOUNTRY]` | Country (free text, falls back to selector) |
| `[GUESTCOUNTRY2]` | Country (2-letter code) |
| `[GUESTCOMPANY]` | Company name |
| `[GUESTCOMMENTS]` | Comments (`BR` = line breaks) |
| `[GUESTLANGUAGE]` | Language |
| `[GUESTSMS:49]` | Mobile formatted for SMS (with country code fallback) |
| `[MESSAGE]` | Booking message field (`BR` = line breaks) |
| `[NOTES]` | Notes (`BR` = line breaks) |
| `[INTERNALNOTES]` | Internal notes (`BR` = line breaks) |

**Occupancy:**
`[NUMADULT]` `[NUMCHILD]` `[NUMPEOPLE]` — group totals (excludes cancelled)
`[NUMADULT1]` `[NUMCHILD1]` `[NUMPEOPLE1]` — this room only
Add `INC` suffix to include cancelled bookings.

**Group guest names:** `[GUESTNAMES]` `[GUESTFULLNAMES]` (add `BR` for line breaks, `INC` for cancelled)

**Guests tab:** `[GUESTSNAME]` `[GUESTSNAMES]` `[GUESTSFIRSTNAMES]` `[GUESTSLASTNAMES]` `[GUESTSID]` `[GUESTSID1]`
First guest address: `[GUESTSADDRESSSBR1]` Full address: `[GUESTSAFULLADDRESSSBR1]` (international) `[GUESTSBFULLADDRESSSBR1]` (European)
Guest history: `[GUESTSNUMBOOKINGS1]` (total bookings) `[GUESTSNUMSTAYS1]` (completed stays)

**Custom questions** (1–10): `[GUESTCUSTOMQ1]` through `[GUESTCUSTOMQ10]` (`BR` suffix available)
Group custom questions: `[GUESTSCUSTOMQ1S]` through `[GUESTSCUSTOMQ10S]` (`INC` suffix available)

**Phone last digits:** `[PHONELAST1]`–`[PHONELAST6]` `[MOBILELAST1]`–`[MOBILELAST6]`

---

## Booking — Financials

| Variable | Returns | NUM version |
|---|---|---|
| `[PRICE]` | Total price (with currency) | `[PRICENUM]` |
| `[AVPRICE]` | Average nightly price | `[AVPRICENUM]` |
| `[BASEPRICE]` | Lodging price | `[BASEPRICENUM]` |
| `[AVBASEPRICE]` | Avg nightly lodging | `[AVBASEPRICENUM]` |
| `[DEPOSIT]` | Deposit amount | `[DEPOSITNUM]` |
| `[TAX]` | Tax amount | `[TAXNUM]` |
| `[COMMISSION]` | Commission | `[COMMISSIONNUM]` |
| `[PRICELESSCOMMISSION]` | Price minus commission | `[PRICELESSCOMMISSIONNUM]` |
| `[PRICELESSTAX]` | Price minus tax | `[PRICELESSTAXNUM]` |

**Group variants:** `[BASEGROUPPRICE]` `[BASEGROUPVAT]` `[COMMISSIONGROUP]` (all have `NUM`)
**Offset syntax:** `[PRICE:10%]` `[PRICE:-10]` `[AVPRICE:20%]`
**No-currency:** `[PRICENC]` (for display without symbol, not for calculations)

**Card info:** `[CARDLASTFOUR]` `[CARDFIRSTSIX]`
**Voucher:** `[GUESTVOUCHER]` (code used) `[VOUCHERPHRASE1]` `[VOUCHERAMOUNT1]`
**Rate:** `[RATEDESC]` (`BR` = line breaks)
**Booking info codes:** `[BOOKINGINFOITEMS]` `[BOOKINGINFOTEXTS]` `[BOOKINGINFOCODES]` `[BOOKINGINFOCODETEXT:infoCode]` `[BOOKINGINFOCODEDATE:infoCode]`

---

## Invoice

**Values:**

| Variable | Returns | NUM version |
|---|---|---|
| `[INVOICEBALANCE]` | Balance | `[INVOICEBALANCENUM]` |
| `[INVOICECHARGES]` | Sum of charges | `[INVOICECHARGESNUM]` |
| `[INVOICEPAYMENTS]` | Sum of payments | `[INVOICEPAYMENTSNUM]` |
| `[INVOICECREDITS]` | Sum of credits | `[INVOICECREDITSNUM]` |
| `[INVOICEDEBITS]` | Sum of debits | `[INVOICEDEBITSNUM]` |
| `[INVOICEVAT]` | Sum of VAT | `[INVOICEVATNUM]` |

All accept offset: `[INVOICEBALANCE:50%]` `[INVOICECHARGES:-100]`
Single booking: `[INVOICEBALANCE1]` / `[INVOICEBALANCE1NUM]`

**Partial invoice** (filter by status): `[INVOICEPARTBALANCE:status1,status2,!status4:10%]` (prefix `!` to exclude)

**Invoice metadata:** `[INVOICENUMBER]` `[INVOICEDATE]` `[INVOICEDATE:{%A, %e %B, %Y}]`

**Item access by position:** `[INVOICEFIRSTITEM]` through `[INVOICEFIFTHITEM]` (all have `NUM`)

**Upsell items** (0–20): `[INVOICEUPSELL1]` `[INVOICEUPSELLNUM1]` `[INVOICEUPSELLQTY1]` `[INVOICEUPSELLNAME1]` `[INVOICEUPSELLSTATUS1]` `[INVOICEUPSELLHEADLINE1]` `[INVOICEUPSELLDESCRIPTION1]` `[INVOICEUPSELLAMOUNTNUM1]` `[INVOICEUPSELLTYPE1]` `[INVOICEUPSELLPER1]` `[INVOICEUPSELLPERIOD1]`

**Extra items** (0–20): `[INVOICEEXTRAITEMDESC1]` `[INVOICEEXTRAITEM1]` `[INVOICEEXTRAITEMNUM1]` `[INVOICEEXTRAITEMQTY1]`

**VAT by rate:** `[INVOICEGROSS:1]` `[INVOICENET:1]` `[INVOICEVAT:1]` (number = VAT rate; all have `NUM`)

**Search by description:** `[INVOICEITEMBYDESC:Searchterm]` `[INVOICEPAYMENTBYDESC:Searchterm]` (both have `NUM`)

**Pending payments:**
`[INVOICEPENDPAY]` — all pending (has `NUM`)
`[INVOICEPENDPAYNEXTDATE]` — next pending date
`[INVOICEPENDPAYAUTO]` — auto pending before due
`[INVOICEPENDPAYFAIL]` — failed pending
`[INVOICEPENDPAYMANUAL]` — manual pending
`[INVOICEPENDPAYMANUALNOTDUE]` / `[INVOICEPENDPAYMANUALOVERDUE]`
`[INVOICEPENDPAYRULE1]` — pending for rule N
All accept invoicee suffix (e.g. `[INVOICEPENDPAY1234]`) and have `NUM` versions.

### Custom Invoice Value Builder

`[INVOICEVAL:param1_param2_...]` — combine parameters with underscore:

| Param | Meaning |
|---|---|
| `CHA` | Charges |
| `PAY` | Payments |
| `QTY` | Quantity |
| `IT1`–`IT5` | Specific item position |
| `UPS1`–`UPS5` | Upsell items |
| `ONE` | This booking only (not group) |
| `INV20` | Invoicee 20 (`INV0` = unassigned, `INV-1` = all) |
| `NUM` | Numeric output |
| `MUL1.2` | Multiplier |
| `CON`EURUSD | Currency conversion |
| `DES`text | Filter by description |
| `SIN`/`SEX` | Status include/exclude |
| `VAT` | VAT summary |
| `DEC,` | Comma as decimal |
| `THO.` | Dot as thousands separator |
| `DP0`–`DP4` | Decimal places |

Example: `[INVOICEVAL:UPS1_UPS2]` = sum of upsell 1 and 2

### Invoice Tables

**Standard:** `[INVOICETABLE]` `[INVOICETABLEVAT]` `[INVOICETABLE2]` (with status)
**Filtered:** `[INVOICETABLEPART:status1,!status2]`
**Charges only:** `[INVOICETABLECHARGES]`
**No total:** `[INVOICETABLENOTOT]`
**Compact VAT:** `[INVOICETABLEVATCOMPACT]`
**No price:** `[INVOICETABLENOPRICE]`
**Invoicee:** `[INVOICETABLEINVOICEE1234]`
**Upsell:** `[UPSELLTABLE]` `[UPSELLTABLEVAT]` `[UPSELLTABLENOREFUND]`
**Currency multiplier:** append `:$1.1$` (e.g. `[INVOICETABLE:$1.1$]`)

### Custom Invoice Table Builder

`[INVOICE:param1_param2_...]` — combine with underscore:

Key params: `PRI` (price) `QTY` (quantity) `AMO` (net) `TOT` (total) `PAY` (payments) `DAT` (date) `STA` (status) `VAA` (VAT amounts) `VAP` (VAT %) `VAT` (VAT summary) `GRT` (grand total) `GRP` (group totals) `GAT` (column sums) `PAA` (payment amounts) `PEN` (pending desc) `PPA` (pending amounts) `CEX` (exclude charges) `NOC` (hide charges, keep VAT) `NOP` (hide payments) `NIN` (no invoice number) `ONE` (single booking) `ORB` (order by booking)

Currency/format: `CUA€` (symbol after) `CUB$` (symbol before) `CON`EURUSD `MUL1.2` `DEC,` `THO.` `DP0`–`DP4` `LAN`DE

Filter: `SIN` (status include) `SEX` (status exclude) `INV20` (invoicee)

Example: `[INVOICE:PRI_QTY_TOT_VAT_PAY_GRT_CUA€]`

---

## Invoicee

`[INVOICEEBALANCE]` `[INVOICEECHARGES]` `[INVOICEEPAYMENTS]` — unassigned items (all have `NUM`)
With invoicee ID: `[INVOICEEBALANCE1234]` `[INVOICEECHARGES1234]` `[INVOICEEPAYMENTS1234]`
Metadata: `[INVOICEENAME]` `[INVOICEECODE]` `[INVOICEECURRENCY]` `[INVOICEENOTES]`
Templates (1–8): `[INVOICEETEMPLATE1]` through `[INVOICEETEMPLATE8]` (`BR` suffix available)

---

## Payment Requests

| Type | URL | Link (HTML) | Button |
|---|---|---|---|
| Generic | `[PAYURL]` | `[PAYLINK]` | `[PAYBUTTON]` |
| PayPal | `[PAYPALURL]` | `[PAYPALLINK]` | `[PAYPALBUTTON]` |

All accept: `:25%` (percentage of balance) `:200` (fixed amount). Default = deposit field or outstanding balance.
Hide gateway: append `:HST` to hide Stripe (e.g. `[PAYURL:200:HST]`)

---

## Cancellation & Guest Access

| Variable | Returns |
|---|---|
| `[CANCELURL]` | URL to view/cancel booking |
| `[GUESTLOGIN]` | URL to view bookings |
| `[CANCELDATE]` | Last cancellable date (phrase) |
| `[CANCELDATEYYYY-MM-DD]` | Last cancellable date (ISO) |
| `[DAYSTOCANCEL]` | Days until can't cancel |
| `[CANCELUNTIL]` | Days between check-in and cancel deadline |
| `[CANCELLEDTIME]` | When booking was cancelled |

---

## Booking Group

**Custom table:** `[BOOKGROUP:PARAM1_PARAM2_...]`

Key params: `PROP` (property) `ROOM` (room) `RNAM` (room display name) `ONAM` (offer) `BREF` (booking #) `NAME` (full name) `FNAM` (first) `LNAM` (last) `EMAI` (email) `PHON` (phone) `MOBI` (mobile) `ARIV` (arrival) `DEPT` (departure) `NUMN` (nights) `ADUL` (adults) `CHIL` (children) `PEOP` (guests) `TOTA` (total price) `PAID` (paid) `CHAR` (charges) `CHAC` (charges + currency) `PAIC` (paid + currency) `STUS` (status) `FLAG` (flag) `UNIT` (unit) `RQTY` (room qty) `ADDR` `CITY` `POST` `STAT` `COUN`

Modifiers: `ICAN` (include cancelled) `ONLY` (single booking) `NOHE` (no header) `TEXT` (plain text) `EXSP` (extra row spacing) `100%` (full width)

Example: `[BOOKGROUP:PROP_ROOM_BREF_NAME_ARIV_DEPT_TOTA]`

**Fixed tables:** `[BOOKGROUPROOMLIST]` `[BOOKGROUPNAMELIST]` `[BOOKGROUPUNITLIST]`
Add `TOTAL` for guest totals, `CHARGETOTAL` for charges + totals.

---

## Date & Time

**Current:** `[CURRENTDATE]` `[CURRENTDATEYYYY-MM-DD]` `[CURRENTTIME]`
**Custom format:** `[CURRENTDATE:{%A, %e %B, %Y}]`
**With offset:** `[CURRENTDATE:+1day{%A, %e %B, %Y}]`
**Days between:** `[DAYSBETWEEN:2019-11-01:2019-11-10]` (accepts variables)
**Format any date:** `[FORMATDATE:[variable]{%A, %e %B, %Y}]`
**Authorize until:** `[AUTHORIZEUNTIL]` `[AUTHORIZEUNTIL{%format}]`
**Payment date:** `[PAYMENTDATE:{%format}]` (optional: `:payment_index:invoicee_id`)
**Modify date:** `[MODIFYDATE:{%format}]`

### Format Codes

| Code | Output | Example |
|---|---|---|
| `%d` | Day (zero-padded) | 01–31 |
| `%e` | Day (space-padded) | 1–31 |
| `%a` / `%A` | Weekday short/full | Mon / Monday |
| `%m` | Month (zero-padded) | 01–12 |
| `%b` / `%B` | Month short/full | Jan / January |
| `%y` / `%Y` | Year 2/4 digit | 26 / 2026 |
| `%H` / `%I` | Hour 24/12hr | 00–23 / 01–12 |
| `%M` | Minutes | 00–59 |
| `%S` | Seconds | 00–59 |
| `%p` / `%P` | AM/PM upper/lower | AM / am |
| `%R` | Time HH:MM | 16:44 |
| `%F` | Date YYYY-MM-DD | 2026-04-08 |
| `%s` | Unix timestamp | 305815200 |

---

## Smart Logic (IF Statements)

| Operator | Syntax |
|---|---|
| Equals | `[IF=:valueA:valueB:true text\|false text]` |
| Contains | `[IFIN:needle:haystack:true\|false]` |
| Like (case-insensitive) | `[IFLIKE:valueA:valueB:true\|false]` |
| Greater than | `[IF>:valueA:valueB:true\|false]` |
| Greater or equal | `[IF>=:valueA:valueB:true\|false]` |
| Less than | `[IF<:valueA:valueB:true\|false]` |
| Less or equal | `[IF<=:valueA:valueB:true\|false]` |
| Between | `[IFBETWEEN:value:low:high:in range\|too low\|too high]` |

**Nesting:** Use `^` and `~` separators for inner IF (processed first):
`[IF=^valueA^valueB^true~false]`

**Processing order:** `^` versions first, then `:` versions. Within each: `=`, `IN`, `LIKE`, `>`, `>=`, `<`, `<=`, `BETWEEN`

---

## Math Operators

| Operator | Example |
|---|---|
| `[+]` | `2 [+] 3` = 5 |
| `[-]` | `5 [-] 1` = 4 |
| `[*]` | `3 [*] 4` = 12 |
| `[/]` | `15 [/] 5` = 3 |
| `[MIN]` | `2 [MIN] 3` = 2 |
| `[MAX]` | `2 [MAX] 3` = 3 |

**Order of operations:** `*`, `/`, `+`, `-`, `MIN`, `MAX` (no brackets — use chained expressions)
**Rounding:** `[/.0]` (integer) `[/.1]` `[/.2]` `[/.3]` `[/.4]` — works on all operators

**Currency conversion:** `[CONVERT:EUR-USD]` returns live rate
Example: `[INVOICECHARGESNUM] [*.2] [CONVERT:EUR-USD]`

---

## Text & Encoding

| Variable | Purpose |
|---|---|
| `[REPLACE\|search\|replace\|text]` | Find and replace in text |
| `[SUBSTR\|start\|length\|text]` | Substring (0-indexed) |
| `[TRIM\|text]` | Remove leading/trailing whitespace |
| `[INWORDS] number` | Number to English words |
| `[ENCODEURL:value]` | URL-encode |
| `[ENCODEJSON:value]` | JSON-encode |

---

## iCal Links

`[ICALURL]` — basic calendar link
`[ICALURL:checkin_hour:checkout_hour:summary:description]`
Example: `[ICALURL:16:10:Booking:Sunny Hotel]`

---

## Account Variables

**Booking's account:** `[ACCOUNTUSERNAME]` `[ACCOUNTID]` `[ACCOUNTTEMPLATE1]`–`[ACCOUNTTEMPLATE4]` `[COMMISSIONLIMIT]`
**Master account:** `[MASTERACCOUNTTEMPLATE1]`–`[MASTERACCOUNTTEMPLATE4]`
**Logged-in user** (control panel display only): `[LOGGEDINACCOUNTID]` `[LOGGEDINACCOUNTUSERNAME]` `[LOGGEDINACCOUNTTEMPLATE1]`–`[LOGGEDINACCOUNTTEMPLATE4]` `[LOGGEDINAPIKEY]`

---

## Auto Action Email Status

`[EMAIL:00]` — replace 00 with auto action number. Shows if sent and timestamp.

## Booking Info Codes

`[BOOKINGINFOITEMS]` — codes + text
`[BOOKINGINFOTEXTS]` — text only
`[BOOKINGINFOCODES]` — codes only
`[BOOKINGINFOCODETEXT:infoCode]` — latest text value for specific code
`[BOOKINGINFOCODEDATE:infoCode]` — latest date for specific code (accepts `{%format}`)
All have `BR` suffix variants.

## HTML Editor Note

Do not place table-rendering variables (e.g. `[INVOICETABLE]`) inside `<p>` tags. Use code view to move them outside paragraph tags.
