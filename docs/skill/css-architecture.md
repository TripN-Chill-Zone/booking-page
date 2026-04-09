# Beds24 Booking Page — CSS Architecture Reference

## File Architecture

```
┌─────────────────────────────────┐
│ External CSS file               │  ← All structural/aesthetic rules
│ CSS-base-v{N}.css               │  ← No character limit
│ Served via &cssfile= parameter  │  ← Versioned filenames for cache busting
└─────────────────────────────────┘
         ↓ loaded by Beds24 via URL parameter

┌─────────────────────────────────┐
│ Inline bookingcss field         │  ← Critical CSS + variable overrides ONLY
│ ~1,500-2,000 chars              │  ← HARD LIMIT: ~18-19K (silent fail above)
│ FOUC prevention + brand vars    │  ← Loaded before external file
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Inline customheadtop field      │  ← Google Fonts <link> tag
│ Set once per property           │  ← Don't modify after initial setup
└─────────────────────────────────┘
```

## CSS Variable System

The external CSS file defines all variables with defaults. Each property overrides them in the inline `bookingcss` field.

### Variable Reference

```css
:root {
  /* Brand colors */
  --b24-color-primary: #XXXXXX;       /* Buttons, selected dates, accents */
  --b24-color-secondary: #XXXXXX;     /* Links, secondary buttons */
  --b24-color-text: #XXXXXX;          /* Body text, headings */
  --b24-color-text-light: #XXXXXX;    /* Labels, secondary text */
  --b24-color-bg: #XXXXXX;            /* Page background, subtle fills */
  --b24-color-bg-white: #ffffff;      /* Card backgrounds */
  --b24-color-border: #XXXXXX;        /* Card borders, dividers */
  --b24-color-accent-hover: #XXXXXX;  /* Button hover state */
  --b24-color-secondary-hover: #XXXXXX; /* Link hover state */

  /* Typography */
  --b24-font-body: 'FontName', sans-serif;
  --b24-font-heading: 'HeadingFont', sans-serif;
  --b24-font-size-base: 14px;
  --b24-font-size-sm: 13px;
  --b24-font-size-lg: 16px;
  --b24-font-size-xl: 20px;

  /* Spacing */
  --b24-space-xs: 4px;
  --b24-space-sm: 8px;
  --b24-space-md: 16px;
  --b24-space-lg: 24px;
  --b24-space-xl: 32px;
  --b24-space-2xl: 48px;

  /* Layout */
  --b24-radius-sm: 6px;
  --b24-radius-md: 10px;
  --b24-radius-lg: 16px;
  --b24-shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08);
  --b24-shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
  --b24-transition: 0.2s ease;
}
```

## Critical CSS Payload Template

This goes in the inline `bookingcss` field. It prevents FOUC (flash of unstyled content) by setting layout properties before the external CSS loads. Contains ONLY layout-shift-preventing properties and the property's variable overrides.

```css
/* Critical CSS — FOUC prevention */
.b24fullcontainer-selector{position:relative;z-index:10;margin-bottom:32px}
.b24-bookingstrip{padding:16px 0}
.b24-bookingstrip>.row{display:flex;flex-wrap:wrap;align-items:flex-end}
.b24room{margin-bottom:24px}
.b24panel-room{display:block;overflow:hidden}
.b24panel-room>.b24panel{padding:24px}
.b24-roompanel-heading{padding:16px 24px}
.carousel.slide{display:block;min-height:180px;overflow:hidden}
.carousel .item{display:none}
.carousel .item.active{display:block}
.carousel .item img{width:100%;height:auto}
.b24-room-cal{display:none}
[id^="collapseslider"]{display:block!important;height:auto!important}
[id^="collapsedesc"]{display:block!important;height:auto!important}
.roomoffercalendarmonth{min-height:180px}
body.b24-rooms-hidden .b24fullcontainer-rooms .b24room{max-height:0;overflow:hidden;margin:0;padding:0}
.b24-select-dates-msg{display:block;padding:48px 24px}
@media(max-width:767px){.b24-bookingstrip{padding:8px 0}.b24panel-room>.b24panel{padding:16px}.b24-roompanel-heading{padding:8px 16px}}

/* Property variable overrides — CHANGE THESE PER PROPERTY */
:root{--b24-color-primary:#E7A35C;--b24-color-secondary:#6DA17D;...}
.colorbody{font-family:'Lexend',sans-serif!important}
h1,h2,h3,h4,h5,h6,.at_roomnametext,.b24-roompanel-heading,.monthcalendarhead{font-family:'Lexend Giga',sans-serif!important}
```

## External CSS Structure

The external CSS file is organized in this order:

1. **CSS Variables** (`:root` block with defaults)
2. **Base / Reset** (body font, smoothing, scroll behavior)
3. **Typography** (headings, room names, panel text)
4. **Booking Strip** (strip container, inputs, labels, button)
5. **Buttons** (primary, secondary, default styles)
6. **Room Cards** (card wrapper, panel, heading, body, flex reorder)
7. **Hide Elements** (duplicates, fakelinks, guest selectors, price breakdown)
8. **Force Open Collapsed Sections** (sliders, descriptions)
9. **Image Sizing** (carousel constraints, object-fit)
10. **Calendar** (month display, date states)
11. **Price Display** (from price, per-occupancy hide)
12. **Form Selects** (quantity dropdown, guest dropdown styling)
13. **Content Areas** (property descriptions)
14. **Language & Currency** (dropdown styling)
15. **Links** (colors, hover)
16. **Policies** (styling for policy text blocks)
17. **Footer**
18. **Form Elements** (checkout page inputs)
19. **Hide/Reveal State** (JS-controlled room visibility)
20. **Price Injection** (JS-injected "From €XX" labels)
21. **Responsive** (mobile breakpoints)
22. **Font Overrides** (explicit declarations for Beds24 specificity)

## Specificity Notes

Beds24 applies styles via inline `style` attributes and `!important` rules. To override:

- Use `!important` on all property-value pairs
- Use specific selectors (`.b24panel-room` not just `.panel`)
- For elements styled inline by Beds24 JS, `!important` is required

The external CSS file is loaded as a `<link>` in the `<head>`, so it has lower specificity than Beds24's inline styles. The inline `bookingcss` content is injected as a `<style>` block, which has equal specificity to other `<style>` blocks but loads earlier.

## Hosting

- Files hosted via aaPanel file manager on the VPS
- Goes through Cloudflare CDN — caches aggressively
- Use versioned filenames (`CSS-base-v1.css`, `CSS-base-v2.css`) to bust cache
- Alternative: append `?v=N` query parameter (also works but less clean)
- Current hosting domain: `astrongpresence.com` (root directory)
- Future production domain: `tripnhostel.com` (not yet configured for assets)
