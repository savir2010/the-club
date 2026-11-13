---
name: The Club
description: A members-only cannabis concierge, set as a private members' desk in warm daylight.
colors:
  canvas: "#f7f2ea"
  raised: "#fffdf9"
  raised-2: "#efe6d8"
  ivory: "#2b261f"
  muted: "#6c6457"
  faint: "#827969"
  brass: "#8d6b3d"
  brass-hi: "#a07c4a"
  brass-lo: "#6f532c"
  light: "#ebe1cf"
  ink: "#2b261f"
  on-brass: "#fffaf2"
  sage: "#6f8a68"
  clay: "#b4593f"
  hairline: "rgb(43 38 31 / 0.12)"
  hairline-strong: "rgb(43 38 31 / 0.2)"
typography:
  display-hero:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "80px"
    fontWeight: 500
    lineHeight: 1.04
    letterSpacing: "-0.012em"
  headline:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "52px"
    fontWeight: 500
    lineHeight: 1.04
    letterSpacing: "-0.012em"
  section:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "48px"
    fontWeight: 500
    lineHeight: 1.04
    letterSpacing: "-0.012em"
  title:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.012em"
  numeral:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0em"
    fontFeature: "lnum, tnum"
  body:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "cv11, ss01"
  body-chat:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.4
  meta:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  badge: "6px"
  small: "8px"
  control: "10px"
  card: "14px"
  panel: "16px"
  pill: "999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "6": "24px"
  "8": "32px"
  "12": "48px"
  "14": "56px"
  "24": "96px"
  "32": "128px"
components:
  button-primary:
    backgroundColor: "{colors.brass}"
    textColor: "{colors.on-brass}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "46px"
  button-primary-hover:
    backgroundColor: "{colors.brass-hi}"
  button-primary-lg:
    backgroundColor: "{colors.brass}"
    textColor: "{colors.on-brass}"
    rounded: "{rounded.control}"
    padding: "0 25.6px"
    height: "52px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ivory}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "46px"
  button-sm:
    rounded: "{rounded.control}"
    padding: "0 13.6px"
    height: "36px"
  field:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ivory}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 15.2px"
    height: "48px"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.ivory}"
    rounded: "{rounded.pill}"
    padding: "0 13.6px"
    height: "34px"
  badge:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.badge}"
    padding: "0 8.8px"
    height: "24px"
  rec-card:
    backgroundColor: "{colors.canvas}"
    rounded: "{rounded.card}"
    padding: "12px"
  summary-panel:
    backgroundColor: "{colors.raised}"
    rounded: "{rounded.panel}"
    padding: "28px"
  bubble-member:
    backgroundColor: "{colors.raised-2}"
    textColor: "{colors.ivory}"
    typography: "{typography.body-chat}"
    rounded: "16px 16px 4px 16px"
    padding: "12px 16px"
  stepper:
    rounded: "{rounded.small}"
    height: "32px"
---

# Design System: The Club

## Overview

**Creative North Star: "The Members' Desk in Daylight"**

The Club is a private members' desk in warm daylight: a cream and white room, dark umber type, and a little brass where a hand would touch. It is quiet, editorial and discreet. The shop is the store: a filterable grid of product cards (member price, retail struck, rating, add to cart) and a full product page per item with gallery, specs, a sticky buy box, related products and member reviews. Nora, the concierge, is a side door, not the stage: a floating launcher bottom-right opens a chat window over the shop without replacing it. Density is low on public pages (96–128px between sections, generous measure) and calm but working on member surfaces.

Hierarchy comes from type, hairlines and slight tonal steps, not from boxes or shadows. Manrope carries every headline and every price numeral, so money reads in the same voice as the brand. Inter does all the interface work. Brass is rare and always means one of three things: the primary action, a selected state, or the member price. There is no photography: where an image would sit, soft moving light does the work (a WebGL molten flow on the landing page, a drifting CSS aurora elsewhere); products are drawn vessels, never photographs of cannabis.

The binding visual standard is the client's Premium Visual Design Implementation Guide together with the brief's look-and-feel section (originally Manrope + Inter; the client has since chosen Manrope throughout). At the user's request the palette later moved from the original dark green-black world to beige and white, and photography was replaced with moving aurora light; this file records the shipped light world.

**Key Characteristics:**
- Light, warm, architectural: cream and white surfaces, dark umber type, about 5% brass.
- Hairlines (1px, 12–20% umber) separate everything; shadows appear only on things that float.
- Manrope for everything: 600 for display and every price numeral, 400–500 for interface.
- The member ledger: retail struck through, member price in brass Manrope numerals, bundle price beneath, set identically everywhere a price appears.
- Products are authored sand-glass vessel silhouettes on cream plinths; no photography anywhere.
- Motion is short ease-out entry; the only flourish is a brass glow on a newly added cart row.

## Colors

A cream, white and warm-beige palette with dark umber type and one metal accent, brass, used like hardware.

### Primary
- **Club Brass** (#8d6b3d): primary buttons (with On Brass text), selected states (chip, tip and radio-card borders with an 8–12% brass wash, checks, the selected-category dot), the focus ring and text caret, the join progress segments, member value (the member price, the savings line), the Monogram ring and the thin rings around step and option icons, the send buttons, and the member's reply bubble in the simulated SMS.
- **Lit Brass** (#a07c4a): primary-button hover and the bundle price line in the ledger, the one tier "better than member".
- **Low Brass** (#6f532c): the darker brass for type where more contrast is wanted: the member price numeral on the deeper beige benefits band and the Monogram's initial.
- **On Brass** (#fffaf2): text and icons on brass fills.

### Neutral
- **Canvas** (#f7f2ea): page background, recommendation cards inside the chat, the left rail, mobile drawers; also the browser theme color.
- **Raised** (#fffdf9): near-white; the cart rail, product drawer, checkout summary panel, featured plan card, form fields, the mobile cart bar and sheet.
- **Raised Two** (#efe6d8): member chat bubbles, the selected rail category, avatar initials discs. The third and last tonal step.
- **Primary text** (#2b261f, token `ivory`; the name is a legacy of the dark world, the value is dark umber): headlines and primary text. Long-form text often sits at 85–92%.
- **Muted** (#6c6457): descriptions, metadata, struck retail prices, inactive nav, icon buttons at rest.
- **Faint** (#827969): timestamps, counts, legal footers, placeholders, empty-state icons. The quietest legible text.
- **Hairline** (rgb(43 38 31 / 0.12)) and **Hairline Strong** (rgb(43 38 31 / 0.2)): every divider and boundary. Hairline separates regions and rows; Hairline Strong outlines interactive things (outline buttons, fields, chips, badges, steppers).
- **Deep Beige** (#ebe1cf, token `light`) with **Ink** (#2b261f): the full-bleed benefits band on the home page, a deeper beige among cream sections. Ink text there steps down by opacity (70% body, 60–65% meta, 10–20% rules).

### Semantic
- **Sage** (#6f8a68): the "available now" status dot on Nora's avatar.
- **Clay** (#b4593f): invalid field border. The only error color.

### Named Rules
**The Hardware Rule.** Brass means action, selection or progress, member value, or the seal. If a brass element is none of these, remove the brass. Target about 5% of any screen; large brass fills are limited to primary buttons, the send buttons and the SMS reply bubble, always with On Brass text.

## Typography

**Display Font:** Manrope 600, tracked −0.03em (the landing hero is 500 at −0.045em). Self-hosted variable font (200–800) from @fontsource-variable/manrope via next/font/local
**Body Font:** Manrope 400/500 (system sans fallback)
**Numerals:** Manrope 600, lining and tabular, tracked −0.02em

**Character:** One geometric grotesque throughout. Weight and size, not a second family, separate headlines and prices from interface text; tight tracking at display sizes keeps it composed rather than techy. The pairing does the work a logo would.

### Hierarchy
- **Display hero** (500, 52px mobile / 72px / 80px desktop, line-height 1.04, -0.012em): the home hero headline only, max 11–15ch, centred over the landing motion.
- **Headline** (500, 44px / 52px at sm and up): page titles on join, checkout, orders, account and subscriptions. The join welcome step goes to 48/60px.
- **Section** (500, 38px / 48px): home section headings.
- **Pull line** (600 upright, 44–88px): one line over the aurora or the landing motion ("Membership is by request" on the join panel, the landing interlude). Manrope has no italic; never synthesize one.
- **Title** (500, 24–30px, line-height 1.1–1.15): card headings, panel titles ("Your cart", "Summary"), plan names, step titles, Nora's name (24px), drawer product name (36px).
- **Body** (400, 16px / 1.5): default reading text, measure 34–52ch.
- **Chat body** (400, 15px, relaxed 1.625): Nora's and the member's messages, max 60ch.
- **Label** (500, 14px): field labels, nav links, button text (15px standard, 16px large, 14px small).
- **Meta** (400, 12–13px, Muted or Faint): brand line, strain/potency/size line, timestamps, legal footers.

### Numerals
Every price is a Manrope numeral: ledger 18px (small), 22px (medium), 30px (large); cart subtotal 26px; checkout total 36px; plan fee 48px. Struck retail prices are the exception: Inter with tabular figures at 12–13px, so the eye skips them. Counts, quantities and tip percentages use Inter tabular figures.

### Named Rules
**The Priced in Bold Rule.** A price the member pays is always a Manrope numeral. A price they are not paying (retail) is small struck Manrope 400.

**The Sentence Case Rule.** Labels, buttons and headings are sentence case. Tracked uppercase is not part of the system.

## Layout

A centered container of 1320px max with 20px side padding, 40px from 768px up. The home page runs a 12-column grid at lg (intro in columns 1–5, content from column 7) with 56px gaps; major sections are separated by 96px on mobile and 128px from sm up. Spacing follows a 4px scale (4, 8, 12, 16, 24, 32, 48, 56, 96, 128).

Surfaces by route:
- **Home:** a centred hero over the fixed MoltenMetal motion layer; then open editorial sections divided by hairlines rather than cards; the deeper beige benefits band; an interlude line set over the open flow; plans in a two-column grid.
- **Shop (the desk):** a fixed-height app shell under a 64px bar. 260px filter rail | conversation (messages centered at max 720px) | 360px cart rail, each separated by a hairline. The phone panel replaces the cart column in a 420px slot when shown.
- **Checkout, orders, subscriptions:** content left, a 380–400px summary panel right, sticky at 32px from the top at lg.
- **Join:** a 5:7 split at lg, with a full-height aurora panel left and the form column (max 560px) right; a 5-segment brass progress rule tops the form.
- **Account:** sections and hairline rows on the 12-column grid; few panels.

Headers are 76px on public pages and join, 72px on checkout, 64px in the shop app bar.

### Responsive behavior
Breakpoints are Tailwind defaults: 640 (sm), 768 (md), 1024 (lg). Below lg the shop collapses to the conversation alone: the filter rail becomes a 300px left drawer behind a filter icon button, and the cart becomes a floating 60px bar 12px from the screen edges (bag with a brass count badge, member total as a brass numeral) that opens an 86dvh bottom sheet with a grab handle. The phone toggle appears from md. Summary columns stack under content below lg. Join hides its aurora panel below lg and shows "Step n of 5" text instead of step labels below sm.

### Named Rules
**The Open Section Rule.** Public sections are open: type, hairline rules and spacing make the hierarchy. Panels are reserved for things the member acts on (plans, summary, cart, drawer).

## Elevation & Depth

The system is flat and tonal. Depth is three surface steps (Canvas, Raised, Raised Two) plus hairlines. A single shadow exists and is used only on elements that float above the page: the product drawer, the age gate card, the phone panel and the mobile cart bar. Overlays dim the page with umber #2b261f at 25%, keeping the page recognizable underneath. The age gate is the one place with blur: the page behind is blurred 18px under a 45% Canvas (#f7f2ea) wash.

### Shadow Vocabulary
- **Float** (`box-shadow: 0 18px 48px -12px rgb(60 44 20 / 0.16), 0 2px 6px rgb(60 44 20 / 0.08)`): floating layers only (drawer, dialog card, phone panel, mobile cart bar).
- **Focus glow** (`box-shadow: 0 0 0 3px rgb(141 107 61 / 0.22)`): focused text fields, together with a brass border.

### Named Rules
**The Float Only Rule.** At rest, nothing in the page has a shadow. A shadow means the element is over the page and can be dismissed.

## Shapes

Gently rounded, consistent corners: 6px on badges, 8px on small parts (stepper, thumbnails, rail rows, nav links), 10px on controls (buttons, fields, icon buttons, tip and option tiles), 14px on cards (recommendation, bundle, radio cards, mobile cart bar), 16px on panels (summary, plans, how-it-works figure, age gate, map). Chips, toggles, avatars and status dots are full pills or circles. Chat bubbles are 16px with a 4px corner on the speaker's side; SMS bubbles in the phone are 18px with a 6px tail corner. The phone frame (48px outer, 38px screen) is a deliberate mock of a device, not a radius step.

Borders are always 1px. The Monogram (a Manrope "C" inside a 1px brass ring with a fainter 0.5px inner ring) is the seal and appears in the header, the age gate and the join welcome. Icons are Lucide line icons at a thin stroke (1.1–1.5), 14–22px, sometimes inside a 48px circle with a 45% brass hairline.

## Components

### Buttons
Quiet, firm, and few: one primary and one secondary per section.
- **Shape:** 10px corners; heights 36px (small), 46px (standard), 52px (large, for page actions and the cart's Review order).
- **Primary:** solid Club Brass with On Brass text, 15px medium. Hover lifts to Lit Brass.
- **Outline (secondary):** transparent, 1px Hairline Strong, primary text. Hover strengthens the border to 42% umber with a 4% umber wash.
- **Text (tertiary):** primary text with a 30% underline that turns brass on hover.
- **Icon button:** 40px square, 10px corners, Muted icon; hover goes to primary text with a 6% umber wash.
- **States:** press scales to 0.98 in 120ms; disabled is 42% opacity with a not-allowed cursor; color transitions run 160ms ease-out; a loading label replaces the text on Place order.

### Chips
- **Style:** 34px pill, 1px Hairline Strong, 14px primary text; in the filter rail 32px at 13px.
- **State:** hover turns the border brass with an 8% brass wash; selected (checkbox filter) keeps the brass border with a 10% brass fill. Suggestion chips above the composer scroll horizontally.

### Badges
24px tall, 6px corners, 1px Hairline Strong, 12px medium Muted text (primary text for effect tags in the drawer). Used only for real attributes or status, never decoration.

### Cards / Containers
- **Recommendation card (in the chat):** Canvas inside the chat column, 14px corners, 1px Hairline, 12px padding; product art 88–104px square at 10px; brand meta, 16px medium name, spec line, Nora's one-line reason, then the ledger and a small outline Add button. Hover strengthens the border and scales the art to 1.03 over 300ms. In-cart state replaces Add with a brass check and "In cart".
- **Bundle card:** as above with a 40% brass border and two stacked thumbnails; the ledger shows the bundle tier.
- **Panels:** Raised, 16px corners, 1px Hairline, 24–28px padding (checkout summary); featured plan card swaps to a 55% brass border on Raised.
- **Radio cards (join):** 14px corners, Hairline Strong; hover 40% umber border; checked brass border with an 8% brass wash.

### Inputs / Fields
- **Style:** 48px tall, Raised fill, 1px Hairline Strong, 10px corners, 16px primary text, Faint placeholder; labels above at 14px medium, help text below at 13px Muted.
- **Hover:** border to 32% umber.
- **Focus:** brass border plus the 3px brass focus glow; the caret is brass everywhere.
- **Error:** Clay border with a specific message near the field.
- **Composer:** the field as an auto-height textarea (min 52px) beside a 52px square brass send button.

### Navigation
Low weight. Wordmark (Monogram + "The Club" in 22px Manrope) on the left. Public: text-button Sign in and a small brass Request membership on the right; over the landing motion the header is transparent. Member: 14px Muted links that go to primary text on hover, an initials disc for the account. Global focus is a 2px brass outline at 3px offset with 6px corners.

### Chat
Member messages right-aligned in Raised Two bubbles (max 78%); Nora's messages unbubbled at the left with a 30px avatar, primary text at 92%. The streaming caret is a 2px brass bar blinking in 1s steps. Nora's avatar is a small calm CSS aurora with a Manrope initial and a 60% brass ring; the header version carries the sage status dot.

### Cart line and stepper
Cart rows are 56px thumbnail + details in a 10px-cornered row: 14px medium name, meta line, a 32px stepper (8px corners, Hairline Strong, Muted minus/plus going to primary text on hover, minus disabled at 1) and the line ledger right-aligned. The summary lists retail (struck), member savings in brass with a minus sign, delivery Free, then a hairline and the subtotal as a 26px Manrope numeral. Empty state: a faint bag icon and a one-line nudge to ask Nora.

### Member Ledger (signature)
The price block is one component everywhere a price appears (recommendation and bundle cards, cart lines, checkout lines, the drawer, subscriptions, the phone SMS, the home example):
1. Retail, Manrope 12–13px tabular, Muted, struck through.
2. Member price, Manrope 600 numeral in Club Brass at 18/22/30px.
3. When a bundle applies, the member price itself is struck and dimmed to 60–70%, and a second line reads "Bundle, each" (or "Bundle · qty × each") in 11–12px muted text followed by the bundle price in Lit Brass at the same size.
Screen readers hear "Retail price", "Member price" labels. On the deeper beige benefits band the member numeral is Low Brass and struck retail is ink at 60%.

### Product placeholder art
Authored SVG, one vessel per category (Flower jar, Pre-roll tube, Vape cartridge, Edibles tin, Concentrate jar, Tincture dropper, Topical balm). Each vessel is warm sand glass (#c9b493 with a cream #e6d9c2 highlight stripe) with a dark lid (#3a322a) and a white label (#fffdf9) carrying the brand letter in Manrope and a thin brass rule. It stands on a cream plinth: a #fffdf9-to-#efe6d8 backdrop, a #e6dbc8 floor and a soft umber contact shadow. Cropped square to fill. These are placeholders for product art.

### Drawer, sheet and dialogs
Product drawer: right-side, max 480px, Raised with a left hairline and the Float shadow; header row with category and a close icon button, 4:3 product art, Manrope 36px name, a hairline-ruled spec grid, effect badges, a lab-tested note, and a footer with the large ledger, stepper and full-width primary button. Escape closes; focus moves to close and returns to the trigger. The mobile cart sheet uses 20px top corners and a 40px grab handle. The age gate is a 440px Canvas card at 92% over the blurred page, Monogram above a Manrope question, outline No and brass Yes side by side.

### Phone panel
A 375 × 760 device mock (dark #1d1a16 bezel, light #fbf8f3 screen, Float shadow) labelled as a simulated text. Agent SMS bubbles are warm grey (#ebe5db) on the left; the member's reply is a brass bubble with On Brass text on the right; the member total inside the SMS is a Lit Brass numeral.

### Motion
Ease-out (`cubic-bezier(0.16, 1, 0.3, 1)`) for all entry. State changes 160ms; button press 120ms; backdrop fade 180ms; new cart line slides in 16px from the right over 260ms and its row glows 16% brass fading over 1600ms; drawer and phone slide in 280–300ms; join steps and the age gate fade up 6px over 300–320ms; mobile sheet and rail fade up 220–260ms. Dismissals are instant. Under `prefers-reduced-motion: reduce` every animation and transition collapses to 1ms, the caret and courier pulse stop, and everything stays usable.

### Imagery
No photography anywhere. Where an image would sit, generated moving light carries it.
- **Landing:** a fixed MoltenMetal WebGL layer (`src/components/LandingMotion.tsx`, landing page only) in light mode, flowing through beige #efe4d2, sand #d9bf95, #b8925a and Club Brass #8d6b3d with cream #fffaf0 cores, under a cream centre vignette (Canvas at 72% fading out) that keeps the headline calm. As the visitor scrolls, the hero copy lifts and fades, the flow turns, drifts and dims, and a Canvas veil rises. Blocks below the fold fade up once on entry. Without a GPU (software WebGL renderer detected) or with reduced motion, the flow renders once and holds still.
- **Aurora:** the join panel and Nora's avatar use a CSS aurora (`src/components/Aurora.tsx`, `.aurora` rules in globals.css): a #fbf7f0 to #e8dbc4 gradient ground with four soft radial lights (sand, peach, cream, brass) drifting on 16–27s alternating loops; a calm variant slows them to 34s.
- **Product art** is authored SVG (above); the order tracking map is drawn light in the same palette.
Decorative layers take empty alt text or aria-hidden.

## Do's and Don'ts

### Do:
- **Do** use Club Brass (#8d6b3d) only for action, selection or progress, member value, or the seal; keep it near 5% of the screen.
- **Do** set every price the member pays as a Manrope 600 lining, tabular numeral, and every retail price as small struck Manrope 400.
- **Do** use the member ledger (retail struck, member in brass, bundle beneath in Lit Brass) wherever a price appears, at 18, 22 or 30px.
- **Do** separate regions with 1px hairlines at 12% umber and outline interactive controls at 20% umber.
- **Do** step depth through Canvas, Raised and Raised Two; reserve the Float shadow for drawers, dialogs, the phone and the mobile cart bar.
- **Do** set text on brass fills in On Brass (#fffaf2).
- **Do** give every control the 2px brass focus outline at 3px offset and a 42% opacity disabled state.
- **Do** enter with ease-out in 120–320ms and collapse all motion under reduced motion.
- **Do** draw products as vessel silhouettes on tonal plinths, and use moving light (MoltenMetal or Aurora) where an image would sit.
- **Do** turn the cart into a floating bar and bottom sheet below 1024px.

### Don't:
- **Don't** build a storefront grid of product tiles; products appear as recommendations inside the conversation, in the cart and in the drawer.
- **Don't** style the concierge like a SaaS support widget (floating launcher bubble, bot avatars, boxed agent messages); Nora speaks unbubbled beside her avatar.
- **Don't** use photographs of cannabis, leaf clip art, smoke, cartoons or people using cannabis.
- **Don't** put shadows on cards, panels or buttons at rest.
- **Don't** use photography or stock images anywhere; imagery is generated moving light.
- **Don't** set prices the member pays in body-weight Manrope, or retail prices in Manrope.
- **Don't** add tracked-uppercase eyebrows or section markers above headings.
- **Don't** add new greys; step text with Muted, Faint, or opacity of the umber text color.
