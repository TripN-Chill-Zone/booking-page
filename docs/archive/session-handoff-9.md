# Session 9 Handoff — Beds24 Booking Page

## Date: 2026-04-16

## Summary
Resolved OpenLiteSpeed caching issues, established local mockup development workflow, and finalized room card design through 13 mockup iterations. Desktop and mobile layouts approved.

## OpenLiteSpeed Caching
- OLS caches static files aggressively. No SSH access to purge `/usr/local/lsws/cachedata/`.
- `.htaccess` CacheDisable directives don't work. Restarting OLS doesn't help.
- **Only workaround**: Upload with NEW versioned filenames every time.
- Current live: `CSS-base-v5.css` (outdated), `beds24-iframe-helper-v15.js` (outdated).

## Development Workflow
- Self-contained HTML mockup with ALL CSS inline + JS simulating helper behavior.
- User opens locally in Chrome. Media queries need real viewport resize (not container width change via dropdown).
- Use Chrome DevTools device toggle or resize browser window for mobile testing.
- Final approved mockup: **v13** (file: `mockup.html` in user's Downloads).

## Room Card Design — APPROVED (Mockup v13)

### Desktop Layout (≥768px)
```
┌──────────┬──────────────────────────────────────────────────┐
│          │ Description text (2-line clamp with ellipsis)    │
│  Photo   │                                                  │
│  120x90  │ 🛏 Sleeps 2 · 🚿 Ensuite · 🏙 City · 💼 Desk    │
├──────────┴──────────────────────────────────────────────────┤
│ Select [- ▼]   from €45.00 / night          €90.00  [Book] │
└─────────────────────────────────────────────────────────────┘
```
- CSS Grid: `120px 1fr`, `:has()` selectors for placement
- Description column: `flex-direction:column; justify-content:space-between`
- Offer bar: full width, border-top separator
- Book group (total + button) pushed right via `margin-left:auto`

### Mobile Layout (≤767px)
```
┌────────┬───────────────────────────┐
│ Photo  │ Full description text     │
│ 90x68  │ wrapping beside the thumb │
├────────┴───────────────────────────┤
│ 🛏 Sleeps 2 · 🚿 Ensuite · 💼 Desk │
│                                    │
│ from €45.00 / night                │
│ Select [- ▼]    €90.00     [Book] │
└────────────────────────────────────┘
```
- Panel body switches from grid to `flex-direction:column` on mobile
- Description row positioned beside thumb via `margin-top:-78px; margin-left:100px`
- Mobile tags (`.tnh-room-tags-mobile`) injected by JS as direct panel child with `order:2`
- Desktop tags hidden on mobile, mobile tags hidden on desktop
- Offer bar: per-night price on own line (CSS `order:-1; width:100%`), select + total + book on second line
- No divider between thumb/desc and tags

### Key CSS Techniques
- `:has()` selectors for grid placement (`.row:has(.b24-room-slider)` → col 1)
- Bootstrap reset: `.b24panel-room .b24panel .row{margin:0}` and `[class*="col-"]{width:auto;float:none;padding:0}` — global inside panel, catches nested rows in offer
- `.b24fullcontainer-rooms .container{width:100%;max-width:100%;padding:0}`
- Dual tag injection: desktop tags inside desc column, mobile tags as direct flex child
- CSS `order` for mobile flex rearrangement
- `-webkit-line-clamp` for desktop description truncation

### Room Descriptions (to update in Beds24 admin)
- **Deluxe King Suite**: "Spacious premium suite with a huge king-sized bed, ensuite bathroom and panoramic city views. Perfect for extended stays."
- **Single Room with Shared Bathroom**: "Ideal room for solo travelers who value privacy and the social atmosphere of a co-living space. A quiet, private room to call your own."
- **Double Room with Shared Bathroom**: "Private double room for couples or friends. All the comfort and privacy you need, with full access to our shared spaces."
- **Single Bed in 4-Bed Dormitory Room**: "A comfortable bed in a modern 4-person dorm. Great value with a social atmosphere — meet fellow travelers without breaking the bank."

### Room Tags (unchanged)
```
567218 (Suite): Sleeps 2, Ensuite, City View, Work Desk, Premium
567220 (Single): Sleeps 1, Shared Bathroom, Work Desk, Private
567221 (Double): Sleeps 2, Shared Bathroom, Work Desk, Private
567219 (Dorm): 1 Bed, 4-Bed Dorm, Power Outlet, Reading Light
```

### Offer Bar
- Desktop: `[Select] [- ▼] [from €45/night] ——— [€90.00] [Book]` (one line)
- Mobile: Line 1: `from €45/night` | Line 2: `[Select] [- ▼] ——— [€90.00] [Book]`
- Qty placeholder: "-" (not "Quantity")
- "Select" label kept outside dropdown
- Total price bold next to Book button
- Per-night price lighter/smaller
- No date strip (user-tested, removed)

### Decisions
- No date strip — users preferred without it
- Description text shown (truncated 2 lines desktop, full on mobile)
- "Standard" dropped from room names
- Double Room title includes "with Shared Bathroom"

## NEXT STEPS

### P1: Extract CSS + Helper from Mockup → Deploy
1. Extract `<style>` block from mockup v13 → `CSS-base-v6.css`
2. Update helper JS → `beds24-iframe-helper-v16.js`:
   - Section 7: dual tag injection (desktop + mobile)
   - Description text: add `.tnh-desc-text` class (don't hide text)
   - Qty placeholder: change "Quantity" to "-"
   - Book group: `.tnh-book-group` with total price + button
   - Per-night price: no subtitle line
   - All existing fixes (lazy page detection, bookmult, checkout in iframe)
3. Upload with new filenames to VPS
4. Update Beds24 admin customhead → v16 helper
5. Update widget CONFIG → v6 CSS
6. Update room descriptions in Beds24 admin

### P2: Checkout Page Styling
### P3: Confirmation Page
### P4: Accessibility

## File Locations
- **Approved mockup**: User's local Downloads (`mockup.html`, v13)
- **VPS CSS**: `CSS-base-v5.css` (outdated — needs v6)
- **VPS Helper**: `beds24-iframe-helper-v15.js` (outdated — needs v16)
- **Widget**: `booking-widget-v7.js`
