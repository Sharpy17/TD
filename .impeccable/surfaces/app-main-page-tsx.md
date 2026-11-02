---
version: 1
slug: "app-main-page-tsx"
primary_target: "app/(main)/page.tsx"
related_targets: ["app/globals.css","app/(main)/projects/page.tsx"]
---

# Surface brief: DaiHub app shell (all signed-in screens + auth)

Scope: the whole web app. Home / projects is the lead surface (first proof); board, module, chats, voice dock and auth inherit the same world. Mode: Operate.

Audience and task: DAIDAI startup team at desktop monitors all day. Founder reads project and module health in seconds; developers move tasks and drop into voice rooms. Must not feel corporate, loud, cute/fruity, or like a generic SaaS template. Deadline urgency is secondary.

Constraints: keep every route, function, control, copy fact and realtime behaviour. English only. No new claims.

## Direction contract

THESIS: DaiHub is a darkroom lit by one daidai-orange safelight: work develops in the tray and you can watch it come up. Refuses the category default of navy-black panels with a violet/blue accent and glowing glass cards.

OWN-WORLD: Warm black room (#0f0b09) and tray surfaces (#18120e / #211913) split by warm seams; print-white text (#e9dccb) with warm greys; daidai safelight orange (#f07a1a) with two darker exposure steps. Three-value economy (raise from Centre-Rail): any other colour must earn a state job (danger, success). Safelight is reserved (raise from Orienteering): full orange only on what is live: primary action, active nav, live voice room, current selection. Geist for UI; JetBrains Mono only for data: codes, counts, percentages, times. Small radii (6–8px), 1px seams, no glass, no glow halos.

STORY: The visitor understands at a glance how developed each project and module is, who is in which room, and what needs attention; then opens a project, moves tasks, or joins a room in one click.

FIRST VIEWPORT: 232px warm-black rail (brand lamp, Home/Projects/Chats, live rooms list, account). 56px top bar: crumb, search, Invite, primary New project in safelight. Main column: greeting h1 with one live summary line; the lead project as a wide frame (edge-print data row, title, description, 10-band test strip with %, top modules each with mini strip); other projects as smaller frames below. Right 312px column: "In the room" voice cards (live one washed in safelight with Join), then "Needs attention" list.

FORM: Darkroom Safelight, position 7 of my grounded list, assigned by the roll. Signature interaction: progress drawn as a darkroom test strip (stepped exposure bands that light from deep amber to full safelight); on load and on change the bands develop one after another with a single slow develop fade-up (raise from Zoo: one motion grammar everywhere). One 8px cell grid for strips and frames (raise from Crouwel). Destructive actions sit apart from status and stay outlined until focused (raise from Dev Console). seed: seed:4ee4568cf1d9a845

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
