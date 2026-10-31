# ⚡ DaiHub (The Anti-Bitrix)

> *"A Discord for Gen X and a Bitrix for Gen Z"*

**DaiHub** is an ultra-fast, opinionated startup command center. It cuts away 90% of legacy Enterprise CRM bloat (Bitrix24/Jira bureaucracy, multi-nested menus, endless required fields) and fuses crystal-clear project/module progress tracking with the live energy of Discord (voice lounges, burning deadlines, soundboard, and hotkeys).

---

## 🚀 What's Built & Ready

- 🔐 **Authentication & Sessions**:
  - Secure Argon2id and PBKDF2 password hashing with cryptographically random salts.
  - HTTP-only signed session cookies, constant-time dummy verification, and brute-force lockout.
- 📦 **Project & Module Hierarchy**:
  - Full PostgreSQL persistence via Prisma with automatic demo workspace provisioning.
  - Dynamic module cards with radial SVG progress rings ($N_{\text{DONE}} / N_{\text{TOTAL}}$).
  - Project creation and cascade deletion.
- 📋 **Task Management**:
  - Instant task creation and deletion with automated progress recalculation.
  - **1-Click Inline Renaming**: Click any task title to edit; press `Enter` or click outside to save instantly.
  - **Edit Dialog (`✎`)**: Quick deadline presets (`🔥 Today 8h`, `⏳ In 2 days`, `📅 In 1 week`, `Clear`), custom datetime picker, stage selector (`Backlog`, `In Progress`, `Review`, `Done`), module transfer, and priority chips.
- 🔥 **Burning Deadlines Classifier**:
  - UTC-safe urgency classifier (< 24h = Burning 🔥, overdue = Overdue ⚠️).
  - Attention-required live banner on dashboard with direct inline rename and task editing.
- 🎙️ **Voice Lounges (Foundation)**:
  - Database-backed voice channels (`#Dev-General`, `#Pair-Programming`, `#Chill Lounge`, `#Silent Focus`).
  - 1-click hop-in and instant room switching.
  - Pure Web Audio API dual-tone chimes on room join/leave/mute (zero external audio files, 0ms latency).
  - **Persistent Floating Audio Dock**: Stays connected at the bottom of the screen across routes with live presence, mute/deafen/screen share controls, and global hotkeys (`Ctrl+Shift+M`, `Ctrl+Shift+D`).
  - Lounge creation modal with quick templates (`#War-Room`, `#Code-Review`, `#Pair-Programming`).
- 🧪 **Test Suite**:
  - 30 unit tests running in Vitest covering domain math, deadline boundaries, auth security, and project/module/task/voice services.

---

## 🛠️ Quick Local Setup

### 1. Requirements
- Node.js `20.x` or newer
- PostgreSQL instance (running locally or in Docker)

### 2. Install & Configure
```bash
git clone https://github.com/Sharpy17/TD.git
cd TD
npm install
```

Copy the example environment configuration:
```bash
cp .env.example .env
```
Ensure your `DATABASE_URL` in `.env` points to your PostgreSQL database:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/toguz?schema=public"
```

### 3. Sync Database Schema
```bash
npx prisma db push
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Validation

```bash
npx vitest run     # Run full unit test suite (30/30 tests)
npm run lint       # Run ESLint (Next.js 16 + React 19 rules)
npm run build      # Turbopack production compilation check
```

---

## 📚 Knowledge Vault & Team Tasks

The documentation in `instructions/` is an **Obsidian Vault**.

👉 **New contributors**: Check out [`instructions/04_AI_Developer_Instructions/Team_Handover_&_Next_Tasks.md`](instructions/04_AI_Developer_Instructions/Team_Handover_&_Next_Tasks.md) for the active sprint tracks:
- **Track A**: Full Kanban Board & Drag-and-Drop (`/projects/[projectId]/kanban`)
- **Track B**: Module Chat Channels & Realtime Sync (`/chats`, `#mod-[slug]`)
- **Track C**: LiveKit SFU Real Audio Streams & Soundboard
- **Track D**: Quick Search (`⌘K`) & Personal Focus Queue
