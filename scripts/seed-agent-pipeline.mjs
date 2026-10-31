/**
 * The "Agent Pipeline" project: our plan for an AI-assisted workflow
 * (Orchestrator → Rerouter → Receivers → Workers → Approvers → Merger), tracked on DaiHub itself.
 *
 *   node scripts/seed-agent-pipeline.mjs
 *
 * Re-running replaces only the Agent Pipeline project; nothing else is touched.
 * Tasks start unassigned and undated: the team sets owners and deadlines as work is picked up.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const PROJECT_NAME = "Agent Pipeline";

// [title, status, priority, extras]; extras: { desc, checklist: [text, ...] }
const MODULES = [
  {
    icon: "🧠", name: "Orchestrator",
    description: "The director. Understands the whole project, turns human ideas into small, well-scoped tasks.",
    tasks: [
      ["Define the agent roles and the task flow", "DONE", "HIGH", {
        desc: "Orchestrator → Rerouter → Receivers → Workers → Approvers → Merger. One Rerouter and one Merger on the VPS; an Approver script per person.",
      }],
      ["Write the Orchestrator's README (project vision, conventions, workflow)", "BACKLOG", "HIGH", {
        desc: "Everything a planner needs to know before splitting work: product vision, AGENTS.md, Team_Git_Workflow.md, code conventions, what not to touch.",
        checklist: ["Product vision and current state", "Code conventions and folder map", "Git workflow and review rules", "Out-of-scope / do-not-touch list"],
      }],
      ["Task template every worker receives", "BACKLOG", "HIGH", {
        desc: "Workers start with no memory, so each task must carry its own context.",
        checklist: ["Goal in one sentence", "Context: which feature, why", "Files the task may touch", "Acceptance criteria", "How to test it"],
      }],
      ["Split features so parallel tasks never touch the same files", "BACKLOG", "MEDIUM"],
      ["Feedback loop: humans discuss a rejected task, Orchestrator rewrites it", "BACKLOG", "MEDIUM"],
    ],
  },
  {
    icon: "⚡", name: "Rerouter",
    description: "The 24/7 dispatcher on the VPS. A plain program, not an AI: it tracks tasks and free workers.",
    tasks: [
      ["Task queue with states: queued, assigned, in review, approved, rejected, merged", "BACKLOG", "HIGH"],
      ["Worker registry with heartbeats (free, busy, offline)", "BACKLOG", "HIGH"],
      ["Never assign two running tasks that touch the same files", "BACKLOG", "HIGH"],
      ["Re-queue tasks from workers that go offline", "BACKLOG", "MEDIUM"],
      ["Limits: max concurrent workers and a budget per task", "BACKLOG", "MEDIUM"],
    ],
  },
  {
    icon: "📱", name: "Receivers",
    description: "Small background program on each PC. Connects out to the VPS and launches workers on command.",
    tasks: [
      ["Outbound connection to the VPS (no open ports on home PCs)", "BACKLOG", "HIGH"],
      ["Authenticate each receiver with its own token", "BACKLOG", "HIGH"],
      ["Launch each worker in a fresh git worktree and branch", "BACKLOG", "HIGH"],
      ["Stream worker status and results back to the Rerouter", "BACKLOG", "MEDIUM"],
      ["Run as a background service on Windows, macOS and Linux", "BACKLOG", "LOW"],
    ],
  },
  {
    icon: "●", name: "Workers",
    description: "AI coding sessions (Claude Code, headless). One task each, then idle until the next.",
    tasks: [
      ["Run Claude Code headless from a task prompt", "BACKLOG", "HIGH"],
      ["Run typecheck, lint, tests and build before reporting done", "BACKLOG", "HIGH", {
        checklist: ["npx tsc --noEmit", "npm run lint", "npx vitest run", "npm run build"],
      }],
      ["No access to secrets (.env, GitHub tokens)", "BACKLOG", "HIGH"],
      ["Write a summary for reviewers: what changed, what was tested", "BACKLOG", "MEDIUM"],
    ],
  },
  {
    icon: "🛡️", name: "Approvers",
    description: "A script per person. Humans only say approved or not approved, plus feedback.",
    tasks: [
      ["List tasks waiting for my review, with diff and summary", "BACKLOG", "HIGH"],
      ["Approve → send to Merger; reject → back to Rerouter with feedback", "BACKLOG", "HIGH"],
      ["Review a whole feature at once, not task by task", "BACKLOG", "MEDIUM"],
    ],
  },
  {
    icon: "🚀", name: "Merger",
    description: "Single merge queue on the VPS. The only thing allowed to push to main.",
    tasks: [
      ["Merge approved tasks one at a time: sync main, re-run checks, push", "BACKLOG", "HIGH"],
      ["On conflict or failing checks, send the task back to the Rerouter with the error", "BACKLOG", "HIGH"],
      ["Never force-push; keep a log of every merge", "BACKLOG", "MEDIUM"],
      ["Delete task branches after they merge", "BACKLOG", "LOW"],
    ],
  },
  {
    icon: "▦", name: "DaiHub Integration",
    description: "Run the pipeline on this board: every task is a card that moves as agents work.",
    tasks: [
      ["API for agents to create, move and comment on cards (token auth)", "BACKLOG", "HIGH"],
      ["Orchestrator creates cards with checklists; Rerouter sets assignee and In progress", "BACKLOG", "HIGH"],
      ["Review column = waiting for an Approver; approve or reject from the card", "BACKLOG", "MEDIUM"],
      ["One DaiHub account per worker so the board shows who is doing what", "BACKLOG", "LOW"],
    ],
  },
  {
    icon: "🎛", name: "VPS & Infrastructure",
    description: "The server that hosts DaiHub, the Rerouter and the Merger.",
    tasks: [
      ["Set up the VPS", "IN_PROGRESS", "HIGH"],
      ["Domain and HTTPS (Caddy); login needs HTTPS in production", "BACKLOG", "HIGH"],
      ["Postgres on the VPS with daily backups", "BACKLOG", "HIGH"],
      ["Deploy DaiHub with Docker (one app instance)", "BACKLOG", "HIGH"],
      ["Firewall: allow only 22, 80 and 443", "BACKLOG", "MEDIUM"],
    ],
  },
  {
    icon: "🐛", name: "Pilot & Rollout",
    description: "Prove it by hand first, then automate one piece at a time.",
    tasks: [
      ["Phase 1: one Orchestrator chat plus 2–3 hand-started workers for a week", "BACKLOG", "HIGH"],
      ["Phase 2: automate dispatch (Rerouter, Receivers, automatic checks)", "BACKLOG", "MEDIUM"],
      ["Phase 3: Approvers, Merger and DaiHub integration", "BACKLOG", "MEDIUM"],
      ["Track tasks per day, rejection rate, review time and cost", "BACKLOG", "LOW"],
    ],
  },
];

/** Fixed-width odd base-36 keys: sort in order and never end in "0" (see lib/domain/ordering.ts). */
const orderKey = (index) => (index * 2 + 1).toString(36).padStart(3, "0");

async function main() {
  const workspace = await prisma.workspace.findFirst({ orderBy: { createdAt: "asc" } });
  if (!workspace) throw new Error("No workspace found. Open the app once so it can create one, then re-run.");

  await prisma.project.deleteMany({ where: { name: PROJECT_NAME, workspaceId: workspace.id } });
  const project = await prisma.project.create({
    data: {
      name: PROJECT_NAME,
      description: "Our AI-assisted workflow: humans send ideas, agents build in parallel, humans approve, one merger ships.",
      workspaceId: workspace.id,
    },
  });

  let number = 0;
  for (const mod of MODULES) {
    const done = mod.tasks.filter(([, status]) => status === "DONE").length;
    const created = await prisma.module.create({
      data: {
        name: mod.name,
        description: mod.description,
        icon: mod.icon,
        projectId: project.id,
        cachedProgress: Math.round((done / mod.tasks.length) * 100),
      },
    });

    for (const [title, status, priority, extras = {}] of mod.tasks) {
      number += 1;
      await prisma.task.create({
        data: {
          title,
          description: extras.desc ?? null,
          status,
          priority,
          number,
          orderKey: orderKey(number),
          completedAt: status === "DONE" ? new Date() : null,
          checklist: extras.checklist?.map((text, i) => ({ id: `c${number}-${i}`, text, done: false })),
          moduleId: created.id,
        },
      });
    }
  }

  const modules = await prisma.module.findMany({ where: { projectId: project.id }, select: { cachedProgress: true } });
  await prisma.project.update({
    where: { id: project.id },
    data: { cachedProgress: Math.round(modules.reduce((sum, m) => sum + m.cachedProgress, 0) / modules.length) },
  });

  console.log(`Seeded "${PROJECT_NAME}": ${MODULES.length} modules, ${number} tasks.`);
  console.log(`Board: /projects/${project.id}/board`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
