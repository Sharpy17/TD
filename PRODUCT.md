# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Startup teams of 3–25 people: founders, developers, designers, and marketers working in fast, uncertain iteration. They sit at desktop monitors (1440px+) for most of the day with DaiHub open alongside their editor.

- **Founder / CEO** opens the home screen with morning coffee and needs to understand the state of the product within seconds: which modules are how far along, and what needs attention right now.
- **Developer / tech lead** wants to move tasks with minimum clicks, drop into a voice room to pair without scheduling a call, close the task, and get back to work.
- **Designer / product** wants a clean interface that does not feel like an accounting tool, plus stickers and soundboard for team atmosphere.

## Product Purpose

DaiHub combines development tracking and a live social hub in one window, so a startup does not split its work across Jira/Bitrix for tasks, Zoom/Meet for calls, and Telegram/Discord for chat. Success means a team runs its whole delivery loop (plan, build, talk, celebrate) inside DaiHub, and a founder can read project health at a glance without interrogating the team.

## Positioning

"A Discord for Gen X and a Bitrix for Gen Z." The anti-Bitrix: only Projects, Modules, Tasks, Chats, and Voice rooms. The structure is **Project → Modules → % progress**, not a flat pile of tasks, and presence is real-time: you can see who is in which voice lounge and just walk in.

## Operating Context

- Home / title dashboard: projects with progress, module breakdown, what needs attention, active voice lounges.
- Kanban board per project: Backlog, In Progress, Review, Done; quick-add tasks (Enter for the next one).
- Text channels per project and per module; Markdown and code snippets.
- Persistent voice lounges (up to ~10 people), speaking indicator, mute/deafen hotkeys (`Ctrl+Shift+M` / `Ctrl+Shift+D`), a floating audio dock that persists across pages.
- Soundboard and stickers for celebrating wins (e.g. a "Victory" sound when a build passes).

## Capabilities and Constraints

- Next.js 16 (App Router, Turbopack), React 19, Prisma + PostgreSQL. Auth with cookie sessions. Realtime via server events.
- Implemented: auth, projects, modules with radial progress, tasks (inline rename, edit modal, priorities, deadlines), board, chats, voice lounge foundation with Web Audio chimes.
- Four simple roles; no fine-grained permission matrices.
- Deadlines exist as task data and can be shown, but deadline urgency is **not** a headline feature (confirmed by the team, 2026-11-02).
- Strictly out of scope (the Anti-Bitrix blacklist): CRM deals and telephony, warehouse/inventory, document approval chains, e-document generation, time tracking/surveillance, permission matrices.
- UI copy is English only.

## Brand Commitments

- Name: **DaiHub**, from the team name **DAIDAI** — the daidai is a bitter orange, which is where the name comes from. The orange is the brand's anchor (confirmed binding: dark interface + orange).
- Voice: casual, energetic, startup/hackathon culture; never stiff corporate tone ("Dear colleague").

## Evidence on Hand

- Product docs in `instructions/` (manifesto, PRD, design notes, architecture). The older design notes in `instructions/02_UX_UI_Design_System/` describe a previous Discord × Linear look and are evidence, not a binding brief.
- Demo seed data in `lib/data/demo.ts` and `scripts/seed-agent-pipeline.mjs`.
- No logo file, testimonials, customers, or metrics exist; do not fabricate them.

## Product Principles

1. **No bureaucracy:** any action that needs more than two clicks gets redesigned.
2. **Speed over feature count:** opening a task card should feel instant; optimistic UI, no spinners on ordinary moves.
3. **Fun is a tool:** soundboard, stickers, and reactions drive team spirit; they are not decoration.
4. **Accountability through transparency:** everyone sees module progress and teammates' presence in real time.
5. **Feature acid test:** does it help a 10-person team ship faster, without extra clicks, and make work more pleasant? If not, cut it.
