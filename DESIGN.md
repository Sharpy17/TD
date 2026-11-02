---
name: DaiHub
description: A darkroom lit by one daidai-orange safelight, where projects develop in the tray and the team can see it happen.
colors:
  room-black: "#0f0b09"
  tray-1: "#18120e"
  tray-2: "#211913"
  tray-3: "#2a211a"
  seam: "#2e241d"
  seam-strong: "#3d3027"
  print-white: "#ece0cf"
  print-grey: "#b3a493"
  print-muted: "#968676"
  safelight: "#f07a1a"
  safelight-hover: "#f58a33"
  safelight-ink: "#1d0e03"
  safelight-text: "#f7a35c"
  safelight-wash: "rgba(240, 122, 26, 0.09)"
  safelight-line: "rgba(240, 122, 26, 0.42)"
  exposure-1: "#4a2510"
  exposure-2: "#7a3a12"
  exposure-3: "#b85512"
  developed-green: "#6fbf8d"
  danger: "#e5484d"
  danger-text: "#f28b8e"
  danger-fill: "#b8323a"
  danger-fill-hover: "#c93a42"
  caution: "#e2b340"
typography:
  display:
    fontFamily: "Geist, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(26px, 2.4vw, 32px)"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.45
  body-secondary:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
  data:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "12px"
    fontWeight: 500
    letterSpacing: "0.02em"
    fontFeature: "\"tnum\" 1"
  data-figure:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "14px"
    fontWeight: 600
    fontFeature: "\"tnum\" 1"
  edge-print:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.06em"
rounded:
  xs: "4px"
  sm: "6px"
  md: "8px"
  overlay: "12px"
  round: "50%"
spacing:
  hair: "2px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.safelight}"
    textColor: "{colors.safelight-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0 14px"
    height: "34px"
  button-primary-hover:
    backgroundColor: "{colors.safelight-hover}"
  button-secondary:
    backgroundColor: "{colors.tray-1}"
    textColor: "{colors.print-white}"
    rounded: "{rounded.sm}"
    padding: "0 14px"
    height: "34px"
  button-secondary-hover:
    backgroundColor: "{colors.tray-2}"
  button-danger-outline:
    backgroundColor: "transparent"
    textColor: "{colors.print-grey}"
    rounded: "{rounded.sm}"
    padding: "0 14px"
    height: "34px"
  button-danger-outline-hover:
    textColor: "{colors.danger-text}"
  button-danger:
    backgroundColor: "{colors.danger-fill}"
    textColor: "#fff4f0"
    rounded: "{rounded.sm}"
    padding: "0 14px"
    height: "34px"
  button-danger-hover:
    backgroundColor: "{colors.danger-fill-hover}"
  input:
    backgroundColor: "{colors.room-black}"
    textColor: "{colors.print-white}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "40px"
  search:
    backgroundColor: "{colors.tray-1}"
    textColor: "{colors.print-muted}"
    rounded: "{rounded.sm}"
    padding: "0 10px"
    height: "34px"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.print-grey}"
    rounded: "{rounded.sm}"
    padding: "0 10px"
    height: "36px"
  nav-item-hover:
    backgroundColor: "{colors.tray-1}"
    textColor: "{colors.print-white}"
  nav-item-active:
    backgroundColor: "{colors.tray-2}"
    textColor: "{colors.print-white}"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.print-grey}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "30px"
  chip-active:
    backgroundColor: "{colors.safelight-wash}"
    textColor: "{colors.safelight-text}"
  status-pill:
    backgroundColor: "{colors.tray-2}"
    textColor: "{colors.print-muted}"
    typography: "{typography.data}"
    rounded: "{rounded.xs}"
    padding: "2px 6px"
  project-frame:
    backgroundColor: "{colors.tray-1}"
    textColor: "{colors.print-white}"
    rounded: "{rounded.md}"
    padding: "16px 20px 20px"
  project-frame-edge:
    backgroundColor: "#130e0b"
    textColor: "{colors.exposure-3}"
    typography: "{typography.edge-print}"
    padding: "8px 16px"
  card:
    backgroundColor: "{colors.tray-1}"
    rounded: "{rounded.md}"
    padding: "16px"
  room-row-live:
    backgroundColor: "{colors.safelight-wash}"
    textColor: "{colors.safelight-text}"
    padding: "10px 12px 10px 14px"
  test-strip:
    backgroundColor: "{colors.tray-2}"
    height: "24px"
  test-strip-md:
    height: "16px"
  test-strip-sm:
    height: "8px"
  modal:
    backgroundColor: "{colors.tray-1}"
    rounded: "{rounded.overlay}"
    padding: "24px"
    width: "480px"
---

# Design System: DaiHub

## Overview

**Creative North Star: "The Darkroom Safelight"**

DaiHub is a darkroom. The room is warm black, work lies in trays one step lighter, text is print white, and a single daidai-orange safelight is the only lamp in the room. The safelight is not decoration: it marks what is live right now, such as the primary action, the page you are on, the voice room you are in, or the card you have selected. Everything else stays in the dark, and that restraint is what lets a founder read the room at a glance.

Progress is drawn as a darkroom test strip: ten stepped exposure bands that come up from deep amber to full safelight as a project or module develops, and turn green when the print is finished. The strip is the system's signature and its one motion idea. Bands develop one after another with a single slow fade-up, and the same develop curve carries route entry, modals and the voice dock.

The room is dense but quiet. It is built for a startup team at desktop monitors all day: a 232px rail, a 56px top bar, a main column of frames and a 312px side column for rooms and attention. Surfaces are separated by 1px warm seams rather than shadows. The world rejects the category default of navy-black panels with a violet or blue accent and glowing glass cards.

**Key Characteristics:**
- Warm black room with three tray tones and 1px warm seams; no glass, no blur.
- One safelight orange, reserved for what is live.
- Geist for the interface; JetBrains Mono only for data (codes, counts, percentages, times).
- Progress as a 10-band test strip, lighting from exposure-1 to full safelight and turning green when complete.
- Small radii (4 to 8px) on everything in the page; 12px only on floating overlays.
- One motion curve (`cubic-bezier(0.22, 1, 0.36, 1)`), and every animation is cut under reduced motion.

## Colors

The palette is a warm, nearly monochrome darkroom with one hot lamp. Any other hue has to earn a state job.

### Primary
- **Daidai Safelight** (safelight): the only full-strength accent. It fills the primary button, the active nav marker (2px inset left edge), the live voice lamp, focus outlines, the text caret and the current selection. On a filled button the label is **Safelight Ink** (safelight-ink), never white.
- **Safelight Hover** (safelight-hover): hover fill for safelight buttons only.
- **Safelight Text** (safelight-text): orange as type, used for live room status, the hero's attention count, frame "Open" links on hover, and mono marks such as the project code tile.
- **Safelight Wash / Safelight Line** (safelight-wash, safelight-line): a translucent tint and its border for selected chips, active icon-picker items, the live voice row, the voice dock and "live" tags. A wash always pairs with orange text or a lamp; it is never used as plain decoration.

### Secondary
- **Exposure Steps** (exposure-1, exposure-2, exposure-3): darker amber steps of the safelight. They exist for the test strip's bands, with the safelight itself as step four. Exposure-3 also prints the mono edge row on project frames. Do not use them as general surface or text colors.

### Tertiary (state only)
- **Developed Green** (developed-green): finished work. It fills completed strips, marks done status, the speaking ring on avatars and the live connection dot.
- **Danger Red** (danger) with **Danger Text** (danger-text) and **Danger Fill** (danger-fill): burning or overdue state and destructive actions. Use the fill only inside a confirm dialog or on Disconnect; elsewhere danger appears as text plus a translucent red border.
- **Caution Amber** (caution): deadlines that are near but not yet late, and the review status.

### Neutral
- **Room Black** (room-black): the page, rail, top bar and input fields.
- **Tray 1 / Tray 2 / Tray 3** (tray-1, tray-2, tray-3): raised surfaces in order of lift. Tray 1 is used for frames, cards and lists, tray 2 for hovered rows, active nav and menus, and tray 3 for hover inside a tray-2 surface and for avatars.
- **Seam / Strong Seam** (seam, seam-strong): 1px dividers and card borders. The strong seam is for hovered frames, outlined buttons, inputs and scrollbar thumbs.
- **Print White** (print-white): primary text.
- **Print Grey** (print-grey): secondary copy, descriptions and inactive nav.
- **Print Muted** (print-muted): metadata, placeholders, section labels and idle icons.

### Named Rules
**The Safelight Rule.** Full orange appears only on what is live: the primary action, the active location, the room you are connected to, the current selection and the focus ring. If nothing on a screen is live, the only orange on it is the primary button.

**The Three-Value Rule.** Room, tray and print carry the whole interface. Green, red and amber may enter only to report a state (done, danger or late, near or review).

## Typography

**Display Font:** Geist (with ui-sans-serif, system-ui, Segoe UI fallback), loaded through next/font as `--font-geist`
**Body Font:** Geist
**Label/Mono Font:** JetBrains Mono (with ui-monospace, SFMono-Regular, Menlo), loaded as `--font-jetbrains`

**Character:** Geist is the room's quiet working voice, set at small sizes with tight negative tracking on headings. JetBrains Mono is the darkroom's data print, with tabular figures that keep percentages, counts and times aligned in columns.

### Hierarchy
- **Display** (600, clamp(26px, 2.4vw, 32px), 1.15, -0.02em, balanced wrap): one page heading per screen (Home greeting, Projects, project overview).
- **Headline** (600, 20px, -0.015em): project frame titles and the chat channel heading.
- **Title** (600, 16px, -0.01em): section headings. Modal titles are 18px, module card titles 15px, and the compact section heading 14px.
- **Body** (400, 14px, 1.45): the app default. Descriptive copy is 13px at 1.55 in Print Grey, and hero copy is capped at 640px.
- **Label** (500, 12 to 13px, sentence case): sidebar group labels, column-block headings and form labels, in Print Muted or Print Grey. Labels are never uppercase or tracked.
- **Data** (JetBrains Mono 500, 11 to 12px, tabular, +0.02em): task codes, counts, percentages, deadlines, kbd and status pills. Strip percentages are set as **Data Figure** (600, 14px).
- **Edge Print** (JetBrains Mono 500, 11px, uppercase, +0.06em, exposure-3): the edge row on project frames, which carries the project code and module and task counts. This is the only uppercase-tracked style in the system, and it is only for data.

### Named Rules
**The Mono-Is-Data Rule.** JetBrains Mono sets only machine facts: codes, counts, percentages, times and shortcuts. Prose, labels and buttons stay in Geist.

## Layout

The app shell is a two-column grid: a sticky 232px rail on Room Black separated by a 1px seam, then a workspace with a sticky 56px top bar. The top bar is a three-track grid (crumb, a 240 to 380px search, actions) with 32px side padding. Main content is capped at 1440px, with 32px top padding and 96px bottom padding.

Home and the project overview use a main column plus a 312px side column with a 32px gap. The side column holds voice rooms and the "Needs attention" list, and it sticks at 88px on Home. Project frames stack in a single column with a 16px gap: the lead frame spans the full width and the rest sit two-up. Inside the lead frame, a 240 to 320px module list sits beside the copy.

Spacing follows an 8px grid with 2px and 4px hairline steps: 2px between strip bands, 8px inside groups, 16px between cards, 24px between side-column blocks and 32px between page regions.

Responsive steps:
- At 1200px the side column drops below the main column and becomes two-up.
- At 1040px the lead frame and hero go single-column, and the frame grids go single-column.
- At 820px the rail collapses to a 64px icon rail (labels, counts and room list hidden), search is hidden, and padding shrinks to 16px.
- At 560px the hero stacks, the Invite button is hidden and the frame edge row keeps only the code.
- The board's inspector is a 300 to 380px sticky column from 1440px up; below that it becomes a 380px right drawer that opens only when a card is selected.

## Elevation & Depth

Depth is tonal, not shadowed. Surfaces rise one tray step at a time (room, tray 1, tray 2, tray 3), and their edges are 1px warm seams. Resting surfaces in the page never cast shadows. Shadows exist only on things that float above the page (menus, modals, the auth card, the voice dock, toasts and the board drawer), and they are plain dark ambient drops with no colored glow.

### Shadow Vocabulary
- **Menu drop** (`box-shadow: 0 12px 32px rgba(0, 0, 0, .5)`): account menu. Board property menus use `0 16px 40px rgba(0,0,0,.45)`.
- **Dialog drop** (`box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6)`): modals. The auth card uses the same drop at 0.5.
- **Dock drop** (`box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6)`): the floating voice dock.
- **Focus halo** (`box-shadow: 0 0 0 3px rgba(240, 122, 26, 0.18)`): inputs on focus, together with a safelight border.
- **Active marker** (`box-shadow: inset 2px 0 0 var(--safe)`): active nav item. This is a mark, not depth.

### Named Rules
**The Seam-Not-Shadow Rule.** Anything that sits in the page is separated by a 1px seam and a tray step. A shadow means the element is floating above the page.

## Shapes

Corners are small and consistent. Chips, kbd, status pills and tags use 4px. Buttons, inputs, nav items and icon buttons use 6px. Frames, cards, lists and panels use 8px. Floating overlays (modals, the auth card and the voice dock) use 12px. Lamps, live dots and avatars are the only circles.

Test strip bands are square-cornered rectangles on a 2px gutter (1px at the smallest size), so a strip reads as one cut strip of paper rather than a row of pills. Borders are always 1px. Dashed seams appear only on empty states and the "new project" slot, where they mark a place where something can be put.

The icon set is authored for DaiHub: 24px grid, 1.75 stroke, round caps and joins, `currentColor`, drawn at 14 to 16px. Module glyphs stored in data are mapped to this set (diamond by default), so the UI never renders emoji or text glyphs as icons.

## Components

### Buttons
Compact and quiet. The only bright button is the one that does the main thing.
- **Shape:** gently squared (6px), 34px tall, 0 14px padding, 13px/600 label, optional 15px icon with a 6px gap.
- **Primary:** safelight fill with safelight-ink label; hover moves to safelight-hover (140ms). Auth submit uses the same treatment at 40px tall and full width.
- **Secondary:** tray-1 fill, strong-seam border, print-white label; hover moves to tray-2.
- **Destructive (in page):** outlined and neutral at rest (strong-seam border, print-grey text). On hover or focus it turns red (red border at 0.6, danger-text). It sits apart from status, at the end of the page or after a divider.
- **Destructive (confirm):** danger-fill, used only inside a confirm modal and on the voice dock's Disconnect.
- **Icon button:** 28px square, 6px radius, seam border, tray-2 on hover.
- **Disabled:** 50 to 60% opacity with a not-allowed cursor.

### Chips
- **Style:** 30px tall, 6px radius, strong-seam outline, transparent fill, print-grey 13px/500 text.
- **State:** selected chips get a safelight border, safelight wash and safelight text. Burning and warning variants swap in red and amber in the same way.
- **Status pill:** 4px radius, mono 11px uppercase, tray-2 fill. Done uses green on a green tint, in progress uses safelight text on the wash, and review uses amber.

### Cards / Containers
- **Corner Style:** 8px.
- **Background:** tray-1. On hover the border moves to the strong seam and the fill lifts slightly to #1b140f (160ms).
- **Shadow Strategy:** none at rest (see Elevation & Depth).
- **Border:** 1px seam.
- **Internal Padding:** 16px, or 16px 20px 20px on project frames.
- **List containers** (rooms, attention) are a single tray-1 box with 1px seams between rows. Rows are 10px 12 to 14px and highlight to tray-2 on hover.

### Inputs / Fields
- **Style:** room-black fill, 1px strong-seam border, 6px radius, 40px tall, 14px text, Print Muted placeholder, safelight caret.
- **Focus:** the border turns safelight, plus a 3px safelight halo at 0.18.
- **Error:** red border at 0.7 with a 3px red halo at 0.14, and a 12px danger-text message below.
- **Search:** 34px, tray-1 fill, seam border that moves to the strong seam on focus-within, with a leading icon and trailing mono kbd.

### Navigation
- **Rail:** 232px, room-black, padding 20px 12px 16px. The brand lamp is a 20px radial safelight bulb.
- **Items:** 36px tall, 6px radius, 14px/500 Print Grey with a 16px Print Muted icon. On hover they get tray-1 and print white. The active item gets tray-2, print white, a 2px inset safelight left edge and a safelight icon. Counts are mono 12px.
- **Room list in rail:** 32px rows with a 7px lamp. The lamp is strong-seam when idle and safelight when live, and live counts are in safelight text.
- **Mobile (820px and below):** a 64px icon-only rail with labels and room list hidden.

### Project Frame
A project is one print on a contact sheet. The top is an edge row (8px 16px, #130e0b, seam below) set in Edge Print, with the project code on the left and module and task counts on the right. Below it come the title (Headline), a 13px description, a test strip, and a meta row with an avatar stack, names and an "Open" link that turns safelight-text on hover. The lead frame adds a list of its top four modules, each as a name, a small strip (96px wide) and a mono percentage. Delete is a 28px ghost icon in the corner that is hidden until the frame is hovered or the icon is focused.

### Test Strip (signature)
Ten equal bands on a 2px gutter. Sizes are lg 24px, md 16px and sm 8px (1px gutter). Unlit bands are tray-2. The lit run always ends on full safelight and steps darker toward its start (exposure-4, then 3, 2, 1). At 100% every band turns developed green. Below the bands is a label row: a Print Muted 12px status ("Not started", "Progress", "Developed") and the percentage in Data Figure. Each lit band develops in turn (640ms, develop curve, 55ms stagger), fading up from 0 opacity and 0.35 brightness. Each strip carries `role="img"` and a "% complete" label.

### Voice Room Row and Dock
A room row is a lamp, name and status, an avatar stack and a 28px outlined Join button. When you are connected, the row is washed with a left-to-right safelight gradient (0.16 to 0.03), the lamp pulses (2.4s), the status reads in safelight text, and the button becomes Leave with a safelight border. The voice dock is a floating bar centered 24px from the bottom, with a 12px radius, a safelight-line border, the same safelight gradient over tray-1, and 32px dock buttons. Muted or deafened buttons go red, and Disconnect uses danger-fill. Speaking avatars get a 2px developed-green ring.

### Modals
A room-black scrim at 0.78 fades in over 180ms. The card is tray-1 with a strong-seam border, 12px radius, 24px padding, up to 480px wide, and rises 8px into place over 260ms on the develop curve. It has an 18px title, a 30px ghost close button and right-aligned actions with an 8px gap.

## Do's and Don'ts

### Do:
- **Do** keep full safelight (#f07a1a) for what is live: the primary action, the active location, the connected room, the current selection and focus.
- **Do** separate in-page surfaces with a 1px seam and one tray step, and save shadows for floating overlays.
- **Do** draw project and module progress as the 10-band test strip at lg, md or sm, never as a ring, and let it turn developed green only at 100%.
- **Do** set codes, counts, percentages and times in JetBrains Mono with tabular figures; everything else is Geist.
- **Do** use the authored 1.75-stroke icon set at 14 to 16px, and map stored module glyphs through it.
- **Do** keep destructive actions outlined and neutral until hovered or focused, placed apart from status, with the filled red button only inside the confirm step.
- **Do** animate entrances with the develop curve (`cubic-bezier(0.22, 1, 0.36, 1)`), and keep hover transitions at 140 to 160ms.

### Don't:
- **Don't** introduce navy-black panels, a violet or blue accent, or glowing glass cards; that is the category default this world rejects.
- **Don't** use glass, backdrop blur or colored glow halos on any surface.
- **Don't** add a second accent hue; green, red and amber appear only as state.
- **Don't** use radii above 8px on in-page surfaces, or pill shapes on buttons.
- **Don't** render emoji or text characters as interface icons.
- **Don't** set uppercase tracked labels above headings; the edge-print row is the only uppercase style, and it carries data.
