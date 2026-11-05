---
name: DaiHub
description: A daidai tree at night, where work grows on leaf-green ground and ripens to orange.
colors:
  bg: "#0d1a12"
  rail: "#0a150e"
  well: "#0b170f"
  surface-1: "#13241a"
  surface-1-hover: "#172b1f"
  surface-2: "#1b3324"
  surface-3: "#244030"
  border: "#203629"
  seam-strong: "#31503d"
  text: "#eef2e8"
  secondary: "#b4c2b2"
  muted: "#8fa390"
  fruit: "#ff8126"
  fruit-hover: "#ff934a"
  fruit-ink: "#132008"
  fruit-text: "#ffa263"
  fruit-wash: "rgba(255, 129, 38, 0.1)"
  fruit-line: "rgba(255, 129, 38, 0.45)"
  ripen-1: "#5f8f3a"
  ripen-2: "#b9a32c"
  sprout: "#8fd16f"
  burning: "#e5484d"
  danger-text: "#f28b8e"
  danger-soft: "#f4a0a2"
  danger-fill: "#b8323a"
  danger-fill-hover: "#c93a42"
  danger-ink: "#fff4f0"
  warning: "#e2b340"
  warning-text: "#e8c25e"
  scrim: "rgba(4, 10, 6, 0.78)"
typography:
  display:
    fontFamily: "Urbanist, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(28px, 2.5vw, 34px)"
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Urbanist, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "26px"
    fontWeight: 500
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Urbanist, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "18px"
    fontWeight: 500
    letterSpacing: "-0.015em"
  section:
    fontFamily: "Urbanist, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Urbanist, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "15px"
    fontWeight: 450
    lineHeight: 1.45
    letterSpacing: "0.008em"
  body-secondary:
    fontFamily: "Urbanist, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "13px"
    fontWeight: 450
    lineHeight: 1.55
  button:
    fontFamily: "Urbanist, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "13px"
    fontWeight: 600
  label:
    fontFamily: "Urbanist, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "12px"
    fontWeight: 500
  data:
    fontFamily: "DM Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "12px"
    fontWeight: 500
    fontFeature: "\"tnum\" 1"
  data-figure:
    fontFamily: "DM Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "14px"
    fontWeight: 500
    fontFeature: "\"tnum\" 1"
rounded:
  detail-xs: "2px"
  detail-sm: "3px"
  detail: "4px"
  sm: "8px"
  md: "12px"
  round: "50%"
spacing:
  hair: "2px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  3xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.fruit}"
    textColor: "{colors.fruit-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: "0 14px"
    height: "34px"
  button-primary-hover:
    backgroundColor: "{colors.fruit-hover}"
  button-secondary:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.text}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: "0 14px"
    height: "34px"
  button-secondary-hover:
    backgroundColor: "{colors.surface-2}"
  button-danger-outline:
    backgroundColor: "transparent"
    textColor: "{colors.secondary}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: "0 14px"
    height: "34px"
  button-danger-outline-hover:
    textColor: "{colors.danger-text}"
  button-danger:
    backgroundColor: "{colors.danger-fill}"
    textColor: "{colors.danger-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: "0 14px"
    height: "34px"
  button-danger-hover:
    backgroundColor: "{colors.danger-fill-hover}"
  input:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "40px"
  search:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.muted}"
    rounded: "{rounded.sm}"
    padding: "0 10px"
    height: "34px"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.secondary}"
    rounded: "{rounded.sm}"
    padding: "0 10px"
    height: "36px"
  nav-item-hover:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.text}"
  nav-item-active:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text}"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.secondary}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "30px"
  chip-active:
    backgroundColor: "{colors.fruit-wash}"
    textColor: "{colors.fruit-text}"
  status-tag:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.muted}"
    typography: "{typography.label}"
    rounded: "{rounded.detail}"
    padding: "2px 6px"
  status-tag-done:
    backgroundColor: "{colors.fruit-wash}"
    textColor: "{colors.fruit-text}"
  card:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "16px"
  project-card:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "20px"
  project-card-hover:
    backgroundColor: "{colors.surface-1-hover}"
  board-card:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: "12px 12px 11px"
  ripeness-block:
    backgroundColor: "{colors.surface-3}"
    rounded: "{rounded.detail-sm}"
    height: "22px"
  ripeness-block-md:
    height: "14px"
  ripeness-block-sm:
    rounded: "{rounded.detail-xs}"
    height: "8px"
  ripeness-block-growing:
    backgroundColor: "{colors.ripen-1}"
  ripeness-block-turning:
    backgroundColor: "{colors.ripen-2}"
  ripeness-block-ripe:
    backgroundColor: "{colors.fruit}"
  brand-mark:
    rounded: "{rounded.detail-xs}"
    size: "18px"
  room-row-live:
    backgroundColor: "{colors.fruit-wash}"
    textColor: "{colors.fruit-text}"
    padding: "10px 12px 10px 14px"
  voice-dock:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "8px 8px 8px 16px"
  modal:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "24px"
    width: "480px"
---

# Design System: DaiHub

## Overview

**Creative North Star: "The Daidai Tree at Night"**

DaiHub is a daidai tree after dark. The ground is leaf green rather than black, surfaces are lighter layers of the same foliage, and text is a pale leaf tone. Against that canopy one colour stands out: the ripe bitter orange the product is named after. Orange marks the thing you act on, the thing you have selected, the room you are in and the work that is finished. A founder can scan a screen for fruit and know what is done and what is live.

Progress is the signature. Each project and module draws a row of blocks, one per module or task, and every block steps from empty through leaf and olive to orange. Finished blocks lead the row, so it also reads as a fill. Those blocks are what moves when a page opens: they ripen in sequence with one slow colour change, while the page around them is simply there.

The interface is dense and calm, built for a startup team at desktop monitors all day: a 232px darker rail, a 56px top bar, a main column and a 312px side column. Surfaces are flat fills divided by 1px seams, with no glass and no blur. The world refuses the near-black panel with a single accent, which is what it replaced. The tree is a design idea, not a costume. It lives in colour and in the blocks, and it stays out of the words on screen.

**Key Characteristics:**
- Leaf-green ground, three flat surface steps and 1px seams; no glass, no blur, no blended gradients.
- Orange for the primary action, current selection, connected room and finished work.
- Sprout green for presence, speaking and valid states only.
- Urbanist for every word; DM Mono for figures and data only; no uppercase styling.
- Radii of 8 and 12px with 2 to 4px details; no pills.
- Progress as ripening blocks, one per module or task, and the blocks are the page's only entrance motion.

## Colors

The palette is one green family at night with a single ripe orange, plus a short ripening ladder that connects the two.

### Primary
- **Daidai Orange** (fruit): fills the primary button and ripe blocks; also the connected-room dot, the active nav icon, selected borders, checked boxes, focus outlines and the text caret. On a filled button the label is **Fruit Ink** (fruit-ink), never white.
- **Fruit Hover** (fruit-hover): hover fill for orange buttons only.
- **Fruit Text** (fruit-text): orange as type, for connected-room status, Done status and selected chips.
- **Fruit Wash / Fruit Line** (fruit-wash, fruit-line): the translucent tint and border for selected chips, the connected room row, Done tags and the voice dock outline.

### Secondary
- **Leaf Step / Olive Step** (ripen-1, ripen-2): the two middle stages of the ripening ladder. They colour growing and turning blocks, the In progress and Review board column dots, and the brand mark. They are not general surface or text colours.

### Tertiary
- **Sprout Green** (sprout): presence, speaking and valid states. It rings speaking and in-room avatars, lights the realtime connection dot, marks occupied rooms and ticks valid password checks.
- **Burning Red** (burning) with **Danger Text** (danger-text), **Danger Soft** (danger-soft), **Danger Fill** (danger-fill), **Danger Fill Hover** (danger-fill-hover) and **Danger Ink** (danger-ink): burning or overdue state and destructive actions. The fill appears only in a confirm step and on Disconnect.
- **Warning Amber** (warning, warning-text): deadlines that are near, the Review tag and work-in-progress limits that are exceeded.

### Neutral
- **Night Leaf** (bg): the page, top bar and form fields.
- **Deep Rail** (rail): the left rail, one step darker than the page.
- **Well** (well): recessed code blocks and the board drawer.
- **Surface 1 / Surface 2 / Surface 3** (surface-1, surface-2, surface-3): cards and lists; then active nav, hovered rows, menus and the dock; then hover inside surface 2, avatars and empty blocks. Surface 1 Hover (surface-1-hover) is the hover fill on project and board cards.
- **Seam / Strong Seam** (border, seam-strong): 1px dividers and card edges; then hovered cards, outlined buttons, inputs, menus and scrollbar thumbs.
- **Pale Leaf** (text): primary text.
- **Sage** (secondary): descriptions and inactive nav.
- **Moss** (muted): metadata, placeholders, section labels and idle icons.
- **Scrim** (scrim): the layer behind modals.

### Named Rules
**The Earned Orange Rule.** Orange means one of four things: this is the primary action, this is selected, you are connected here, or this is finished. Focus and caret count as selection. Work that is merely in progress never turns orange.

**The Living Sprout Rule.** Sprout green reports that something is alive or valid: someone is present, someone is speaking, a value checks out. It never marks finished work, which is orange, and it never decorates.

**The Ladder Rule.** Leaf, olive and orange are read in that order and always mean progress. Red and amber report state only.

## Typography

**Display Font:** Urbanist (with ui-sans-serif, system-ui, -apple-system, Segoe UI fallback), loaded through next/font as `--font-urbanist`
**Body Font:** Urbanist
**Label/Mono Font:** DM Mono weights 400 and 500 (with ui-monospace, SFMono-Regular, Menlo), loaded as `--font-dm-mono`

**Character:** Urbanist is round, friendly and light on its feet, which keeps a dense tool from feeling corporate. DM Mono has the same softness in a fixed width, so figures line up in columns without a harsh technical edge.

### Hierarchy
- **Display** (500, clamp(28px, 2.5vw, 34px), 1.15, -0.02em, balanced wrap): one page heading per screen, such as the Home greeting, Projects and the board title.
- **Headline** (500, 26px, -0.015em): the lead project card title.
- **Title** (500, 18px, -0.015em): project card titles. Modal and inspector titles are the same size at 600.
- **Section** (600, 16px, -0.01em): section headings, with a 14px compact variant.
- **Body** (450, 15px, 1.45, +0.008em): the app default. Descriptive copy is **Body Secondary** (13px, 1.55) in Sage, and hero copy runs at 14px capped at 640px.
- **Button** (600, 13px): buttons and short actions, 12px inside rows and the dock.
- **Label** (500, 12 to 13px, sentence case): sidebar groups, column headings, form labels and status tags.
- **Data** (DM Mono 500, 11 to 12px, tabular): percentages, counts, task codes, dates, times, shortcuts and code. **Data Figure** (DM Mono 500, 14px) is the percentage beside a block row.

### Named Rules
**The Mono Is For Figures Rule.** DM Mono sets figures and data: percentages, counts, codes, times, shortcuts and code snippets. A word label is Urbanist even when it sits next to a figure.

**The Sentence Case Rule.** No text is styled uppercase and no word label is tracked. Labels read Not started, In progress, Done. Task codes and avatar initials are uppercase because that is the data itself.

**The Plain Words Rule.** Fruit language stays out of UI copy. Ripe, ripen, fruit, grove and sprout are names for tokens and documentation; users read Not started, In progress and Done.

## Layout

The app shell is a two-column grid: a sticky 232px rail separated by a 1px seam, then a workspace with a sticky 56px top bar. The top bar is a three-track grid of crumb, a 240 to 380px search, and actions, with 32px side padding. Content is capped at 1440px with 32px top and side padding and 96px below.

Home and the project overview use a main column plus a 312px side column with a 32px gap. On Home the side column holds voice rooms and then Needs attention, and sticks at 88px. Project cards sit in a 16px grid: the lead card spans the column and the others sit two-up.

The board is four columns of at least 220px with a 12px gap, scrolling sideways when they no longer fit. Chat is a 248px channel list beside the room.

Spacing follows a 4px base: 2 to 4px inside block rows and tight groups, 8px within groups, 16px between cards, 20px inside project cards, 24px between side-column blocks and 32px between page regions.

Responsive steps:
- At 1439px and below, the board inspector becomes a right-hand drawer up to 380px wide that appears only when a card is selected. Above that it is a 300 to 380px sticky column.
- At 1200px the side column drops below the main column and goes two-up.
- At 1040px the lead card's modules, the project hero and the card grids go single-column.
- At 820px the rail collapses to a 64px icon rail, search is hidden, padding shrinks to 16px and chat stacks.
- At 640px the voice dock spans the width and hides its button labels.
- At 560px the hero stacks and the Invite button is hidden.

## Elevation & Depth

Depth is flat. Surfaces step up in tone (ground, then surface 1, 2 and 3) and meet at 1px seams. Nothing resting in the page casts a shadow. Shadows belong to floating elements (menus, modals, the auth card, the voice dock, toasts and the board drawer), and they are plain dark drops with no coloured glow. Rings drawn with box-shadow, such as focus halos, selected cards and avatar status rings, are marks and not depth.

### Shadow Vocabulary
- **Hover tray** (`box-shadow: 0 8px 20px rgba(0,0,0,.35)`): the message action tray in chat.
- **Menu drop** (`box-shadow: 0 12px 32px rgba(0, 0, 0, .5)`): the account menu. Board property menus use `0 16px 40px rgba(0,0,0,.45)`.
- **Toast drop** (`box-shadow: 0 18px 50px rgba(0,0,0,.5)`): board toasts.
- **Dock drop** (`box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6)`): the voice dock.
- **Drawer drop** (`box-shadow: -24px 0 48px rgba(0,0,0,.45)`): the board drawer.
- **Dialog drop** (`box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6)`): modals. The auth card uses the same drop at 0.5.
- **Focus halo** (`box-shadow: 0 0 0 3px rgba(255,129,38, 0.18)`): inputs on focus, with an orange border.

### Named Rules
**The Seam Rule.** Anything in the page is separated by a 1px seam and a flat tone step. If a surface has a drop shadow, it is floating above the page.

**The Flat Fill Rule.** Surfaces are solid. Glass, backdrop blur and blended gradients do not exist in this world. The brand mark's hard colour stops draw bars and blend nothing, so they are not an exception.

## Shapes

Corners come in two sizes and a set of small details. Cards, lists, panels, modals and the voice dock use 12px. Buttons, inputs, nav items, chips and board cards use 8px. Small details use 2 to 4px: tags, kbd and checkboxes at 4px, large blocks at 3px, small blocks and the brand mark at 2px. Status dots and avatars are the only circles. There are no pills; a control is never fully rounded, whatever its class name says.

Borders are 1px. Dashed seams appear only where something can be put: empty states, the new project slot and quick add.

The icon set is authored for DaiHub on a 24px grid with a 1.75 stroke, round caps and `currentColor`, drawn at 14 to 16px. Module glyphs stored in data map onto this set, so the interface never renders emoji or text characters as icons.

**The brand mark** is three stepped bars in an 18px square: leaf, olive, orange, left to right. Each bar is 4px wide with a 3px gap, so the mark is the ripening ladder in miniature.

## Components

### Buttons
Compact and quiet. The bright button is the one that does the main thing.
- **Shape:** gently rounded (8px), 34px tall, 0 14px padding, Button type, optional icon with a 6px gap.
- **Primary:** fruit fill with fruit-ink label; hover moves to fruit-hover over 140ms. Auth submit is the same at 40px tall and full width.
- **Secondary:** surface-1 fill, strong-seam border, text label; hover moves to surface-2.
- **Destructive (in page):** outlined and neutral at rest with a Sage label. On hover or focus the border turns red and the label turns danger-text.
- **Destructive (confirm):** danger-fill with danger-ink, used inside a confirm modal and on the dock's Disconnect.
- **Icon button:** 28px square, 8px radius, seam border, surface-2 on hover.
- **Disabled:** 50 to 60% opacity with a not-allowed cursor.

### Chips
- **Style:** 30px tall, 8px radius, strong-seam outline, transparent fill, Sage 13px/500 text.
- **State:** selected chips take a fruit border, fruit wash and fruit text. Burning and warning variants swap in red and amber the same way.
- **Status tag:** 4px radius, 12px/600 Urbanist, surface-2 fill. Done is fruit text on the wash, In progress is text on surface-3 and Review is amber.

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** surface-1. On hover the border moves to the strong seam over 160ms, and project cards also lift to surface-1-hover.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Border:** 1px seam.
- **Internal Padding:** 16px, or 20px with a 16px gap on project cards.
- **List containers** (rooms, attention) are one surface-1 box with 1px seams between rows; rows highlight to surface-2 on hover.

### Project Card
A project is a title and a state of ripeness. **The lead card order is the same at every width: copy, block row, modules, people.** Copy is the title and description. The block row runs the full width with counts on the left and the percentage on the right. Modules are the top four, each a name, a small block row and a mono percentage, in two columns that become one at 1040px. People are the avatar stack and names, with an Open link that turns fruit-text on hover. Other project cards use the same order without the modules. Delete is a 28px ghost icon, hidden until the card is hovered or the icon is focused.

### Ripening Blocks (signature)
One block per module on a project and one per task on a module, sorted so finished blocks come first. Blocks share the row equally, with a 3px gap (2px at the small size). Heights are 22, 14 and 8px. More than 40 items average into 40 blocks so a long list stays readable.

Each block is one of four stages: empty (surface-3), growing (ripen-1, above 0), turning (ripen-2, from 60) and ripe (fruit, at 100). Tasks stage as Backlog 0, In progress 33, Review 67 and Done 100. Below the row sits a Moss label and the percentage in Data Figure. The status words are Not started, In progress and Done. Each row carries `role="img"` and a "% complete" label.

Filled blocks ripen in turn from surface-3 to their stage colour: 640ms on the ripen curve (`cubic-bezier(0.22, 1, 0.36, 1)`) with a 40ms stagger. A later change in stage is a 480ms colour transition. Reduced motion cuts this to an immediate state.

**The One Entrance Rule.** Page content does not arrive; blocks ripen. Routes, the auth card, cards and lists never fade, slide or stagger in. Do not add entrance motion to anything in the page.

Floating layers that open on demand are outside this rule. In the current build modals, the voice dock, menus, toasts and the board drawer take a short arrival of 140 to 320ms, so the user can see what just opened.

### Inputs / Fields
- **Style:** bg fill, 1px strong-seam border, 8px radius, 40px tall, 14px text, Moss placeholder, orange caret.
- **Focus:** the border turns fruit, with a 3px fruit halo at 0.18.
- **Error:** red border at 0.7, a 3px red halo at 0.14 and a 12px danger-text message below.
- **Valid:** password checks turn sprout as each one passes.
- **Search:** 34px, surface-1 fill, seam border that moves to the strong seam on focus-within, with a leading icon and trailing kbd.

### Navigation
- **Rail:** 232px on rail, padding 20px 12px 16px, with the brand mark, 12px Moss group labels, nav, voice rooms and the account block at the bottom.
- **Items:** 36px tall, 8px radius, 14px/500 Sage with a 16px Moss icon. Hover gives surface-1 and Pale Leaf. Active gives surface-2, Pale Leaf and an orange icon.
- **Rooms in the rail:** 32px rows with a 7px dot, strong seam when idle and fruit when connected.
- **Mobile (820px and below):** a 64px icon-only rail with labels and the room list hidden.

### Board
- **Columns:** 12px radius, translucent surface-1 fill and a dot in the ladder colour: Moss for Backlog, ripen-1 for In progress, ripen-2 for Review and fruit for Done. A column under a drag takes a fruit border and tint.
- **Cards:** 8px radius, surface-1, 1px seam, 13px/500 title. Hover moves to the strong seam and surface-1-hover, with a 1px lift. Selected adds a fruit border and a 1px fruit ring. Burning and overdue cards take a red border at 0.6, and warning cards an amber border at 0.38.
- **Inspector:** a seam-divided column on wide screens and a well-coloured drawer below 1440px.

### Voice Room Row and Dock
A room row is a dot, a name and status, an avatar stack and a 28px outlined Join button. When you are connected the row takes the fruit wash, the dot turns fruit and pulses (2.4s), the status reads in fruit text and the button becomes Leave with a fruit-line border. The voice dock is a floating bar 24px from the bottom with a 12px radius, a fruit-line border, a flat surface-2 fill and 32px dock buttons. Muted or deafened buttons go red and Disconnect uses danger-fill. Speaking avatars get a 2px sprout ring that breathes to 3px over 1.6s.

### Modals
A scrim fades in behind a surface-1 card with a strong-seam border, 12px radius, 24px padding and a maximum width of 480px. It has an 18px title, a 30px ghost close button and right-aligned actions with an 8px gap.

## Do's and Don'ts

### Do:
- **Do** keep orange for the primary action, current selection, connected room and finished work.
- **Do** keep sprout green for presence, speaking and valid states.
- **Do** draw project and module progress as ripening blocks at 22, 14 or 8px, one block per module or task, with finished blocks first.
- **Do** set figures and data in DM Mono, and every word label in Urbanist.
- **Do** separate in-page surfaces with a 1px seam and a flat tone step, and save drop shadows for floating elements.
- **Do** keep the lead project card in the order copy, block row, modules, people at every width.
- **Do** use the authored 1.75-stroke icon set, and map stored module glyphs through it.
- **Do** keep in-page destructive actions outlined and neutral until hovered or focused.
- **Do** keep hover transitions between 120 and 160ms, and cut all motion under reduced motion.

### Don't:
- **Don't** use a near-black ground with one accent; this world's ground is leaf green.
- **Don't** use glass, backdrop blur, blended gradients or coloured glow on any surface.
- **Don't** turn work orange before it is finished, or use sprout green to mark finished work.
- **Don't** use red or amber for anything except state.
- **Don't** use radii other than 8 and 12px on surfaces and controls, or 2 to 4px on small details, and don't make pill shapes.
- **Don't** style text uppercase, or track word labels.
- **Don't** add route, auth or card entrance fades; blocks ripening is the only entrance in the page.
- **Don't** put fruit language in UI copy.
- **Don't** render emoji or text characters as interface icons.
