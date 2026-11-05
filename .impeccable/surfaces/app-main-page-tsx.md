---
version: 1
slug: "app-main-page-tsx"
primary_target: "app/(main)/page.tsx"
related_targets: ["app/globals.css","app/(main)/projects/page.tsx"]
---

# Surface brief: DaiHub app shell (all signed-in screens + auth)

Scope: the whole web app. Home / projects is the lead surface; board, module, chats, voice dock and auth inherit the same world. Mode: Operate.

Audience and task: DAIDAI startup team at desktop monitors all day. Founder reads project and module health in seconds; developers move tasks and drop into voice rooms. Must not feel corporate, loud, cute/fruity, or like a generic SaaS template. Deadline urgency is secondary.

Constraints: keep every route, function, control, copy fact and realtime behaviour. English only. No new claims. Fruit language stays out of UI copy: labels read Not started, In progress, Done.

Process: direction came from taste (design-taste-frontend) and a rendered user choice, not from concept-seed, per instructions/04_AI_Developer_Instructions/Design_Workflow.md.

## Direction contract

THESIS: DaiHub is a daidai tree at night: work grows on leaf-green ground and ripens to orange. Refuses the near-black panel with one accent, and replaces the previous warm-black Darkroom Safelight world.

OWN-WORLD: Leaf-green ground (#0d1a12, rail #0a150e), surfaces #13241a / #1b3324 / #244030, seams #203629 / #31503d, pale leaf text #eef2e8. Fruit orange #ff8126 on primary action, current selection, connected room and finished work. Sprout green #8fd16f only for presence, speaking and valid states. Red and amber report state only. Urbanist for UI, DM Mono only for data. Radii 8 and 12px, 1px seams, flat fills, no glass, no gradients.

STORY: The visitor sees how ripe each project and module is, who is in which room and what needs attention, then opens a project, moves tasks or joins a room in one click.

FIRST VIEWPORT: 232px darker leaf rail (mark, Home/Projects/Chats, rooms, account). 56px top bar: crumb, search, Invite, orange primary. Main column: greeting h1 and one summary line; lead project card stacking title, description, full-width block row, counts and %, then top modules in two columns, each with a small block row (moved from beside the copy, which left an 81px blank band and broke reading order on mobile); other projects two-up below. Right 312px column: voice rooms, then Needs attention.

FORM: Grove, chosen by the user from three taste-derived rendered directions. Signature: progress as ripening blocks, one per module on a project and one per task on a module, stepping empty, leaf, olive, orange, finished blocks first. Blocks ripen in sequence with one slow colour change. seed: none (roll skipped: direction came from taste, per instructions/04_AI_Developer_Instructions/Design_Workflow.md)

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
