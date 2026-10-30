# Toguz Hub

The first vertical slice of the “Anti-Bitrix” product described in `instructions/`.

## What exists now

- A responsive dark dashboard with project progress, module cards, urgent deadlines, voice-room presence, and personal focus.
- Strict TypeScript domain models.
- UTC-safe deadline classification and binary module/project progress calculations.
- Unit tests for deadline boundaries, completed-task behavior, empty modules, and project aggregation.
- An initial Prisma/PostgreSQL schema for workspaces, memberships, projects, modules, tasks, channels, voice rooms, and soundboard clips.

The UI currently reads from `lib/data/demo.ts`. This is intentional: it makes the first product loop reviewable before authentication and infrastructure are introduced.

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

Validation:

```bash
npm test
npm run build
```

## Recommended delivery sequence

1. Confirm the dashboard’s information hierarchy and deadline language with real users.
2. Add PostgreSQL and Prisma migrations, seed the demo workspace, and replace `lib/data/demo.ts` with a repository implementation.
3. Add magic-link authentication and enforce workspace membership at every data boundary.
4. Build task CRUD and the four-column Kanban with optimistic movement plus rollback.
5. Emit a transactional outbox event when task status changes; use it to update other clients and cached progress safely.
6. Add module chat and presence over a realtime gateway.
7. Integrate LiveKit only after the core project loop is useful; add the soundboard as WebSocket triggers with local Web Audio playback.
8. Wrap the stable web app in Tauri after desktop-only requirements (global hotkeys and screen capture) are proven.

## Decisions to resolve early

- Hosted services versus self-hosting for PostgreSQL, auth, object storage, realtime, and LiveKit.
- Whether progress is strictly binary (`DONE / total`) or weighted. The current code follows the vault’s default binary model.
- Whether guests are scoped only by assignment or can see whole modules. This affects nearly every query and event authorization check.
- The source of truth for task order. The schema uses a string `orderKey` so a LexoRank-style strategy can replace fragile floating-point ordering.
- Accessibility behavior for urgency: color is reinforced with text, and motion respects `prefers-reduced-motion`.
