/**
 * Example data: a small game studio ("Nomad Forge") two months into production on "Steppe Riders".
 * Shows what DaiHub looks like after real, sustained use.
 *
 *   node scripts/seed-studio.mjs
 *
 * Safe to re-run: it replaces the Steppe Riders project and its team's demo data each time.
 * Also empties the modules of the built-in "DaiHub Core" demo project, so the studio is the focus.
 * Team accounts have no password and cannot sign in; they exist to populate the board.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const now = Date.now();
const DEMO_PROJECT_ID = "prj_toguz";
const PROJECT_NAME = "Steppe Riders";
const EMAIL_DOMAIN = "nomadforge.test";

const TEAM = {
  dastan: { name: "Dastan Abenov", role: "OWNER" },
  alex: { name: "Alex Kim", role: "CORE" },
  marat: { name: "Marat Sadykov", role: "MEMBER" },
  alina: { name: "Alina Nurova", role: "CORE" },
  aruzhan: { name: "Aruzhan Bekova", role: "MEMBER" },
  timur: { name: "Timur Akhmetov", role: "MEMBER" },
  dana: { name: "Dana Lee", role: "MEMBER" },
  yerlan: { name: "Yerlan Ospanov", role: "MEMBER" },
  sasha: { name: "Sasha Volkova", role: "MEMBER" },
};

// [title, status, assignee, priority, due (hours from now) | null, shipped (days ago) | null, extras]
// extras: { desc, checklist: [[text, done]...], comments: [[who, text, minutesAgo]...] }
const MODULES = [
  {
    icon: "◆", name: "Core Gameplay", lead: "marat", people: ["marat", "alex", "timur"],
    description: "Riding, archery and the moment-to-moment feel.",
    tasks: [
      ["Horse locomotion: walk / trot / gallop blend tree", "DONE", "marat", "HIGH", null, 40],
      ["Mounted archery: aim assist v1", "DONE", "marat", "MEDIUM", null, 33],
      ["Stamina system for sprinting and gallop", "DONE", "marat", "MEDIUM", null, 12],
      ["Fix: horse clips through fences at full gallop", "DONE", "marat", "HIGH", null, 4],
      ["Combat feel pass: hit-stop and camera shake", "IN_PROGRESS", "marat", "CRITICAL", 9, null, {
        desc: "Playtest #1 said hits feel weightless. Add 60–90 ms hit-stop on heavy attacks, trauma-based camera shake, and a controller rumble curve.",
        checklist: [["Hit-stop on heavy attacks", true], ["Trauma camera shake", true], ["Rumble curves per weapon", false], ["A/B with 5 players", false]],
        comments: [["sasha", "Testers specifically called out the sabre. Bow feels fine.", 310], ["marat", "Hit-stop is in. Shake is subtle by default, there's a slider coming in settings.", 95], ["dastan", "This needs to land before the Next Fest build, it's the first thing people feel.", 40]],
      }],
      ["Lasso: catch and tame wild horses", "REVIEW", "marat", "HIGH", 30, null, {
        checklist: [["Rope physics", true], ["Struggle QTE", true], ["Taming meter", true], ["Fail states and rope snap", false]],
        comments: [["alex", "Rope sim is ~0.4 ms on Deck, fine. Left two notes on the PR.", 180]],
      }],
      ["Dismount combat: sword combos on foot", "IN_PROGRESS", "alex", "MEDIUM", 70, null],
      ["Weather affects horse stamina", "BACKLOG", "timur", "MEDIUM", 240, null],
      ["Falconry companion prototype", "BACKLOG", null, "LOW", null, null],
    ],
  },
  {
    icon: "🧠", name: "AI & Enemies", lead: "alex", people: ["alex", "marat"],
    description: "Raiders, wolves and the bosses that hunt you across the steppe.",
    tasks: [
      ["Behaviour tree framework", "DONE", "alex", "HIGH", null, 28],
      ["Raider patrol routes on the open steppe", "DONE", "marat", "MEDIUM", null, 9],
      ["Enemy archers lead their shots against moving riders", "IN_PROGRESS", "alex", "HIGH", -5, null, {
        desc: "Archers currently aim at where you are, so galloping makes you untouchable. Predict intercept using velocity, with a skill-based error cone.",
        comments: [["sasha", "Confirmed: at full gallop nothing ever hits you. Makes Region 1 trivial.", 1500], ["alex", "Intercept maths works, tuning the error cone so it's not a laser.", 260]],
      }],
      ["Wolf pack flanking behaviour", "REVIEW", "marat", "MEDIUM", 50, null],
      ["Boss: the Iron Khan, phase 2 design", "BACKLOG", null, "HIGH", null, null],
      ["Cap active AI agents to 40 per world cell", "BACKLOG", "alex", "MEDIUM", null, null],
    ],
  },
  {
    icon: "⚡", name: "Rendering & Performance", lead: "alex", people: ["alex"],
    description: "Frame budget, the grass, the sky, and Steam Deck.",
    tasks: [
      ["Grass instancing for the 4 km² steppe", "DONE", "alex", "HIGH", null, 45],
      ["Day–night cycle with baked sky LUTs", "DONE", "alex", "MEDIUM", null, 20],
      ["Shader cache warm-up to kill first-run hitches", "DONE", "alex", "HIGH", null, 2],
      ["Hit 60 FPS on Steam Deck in the Highlands map", "IN_PROGRESS", "alex", "CRITICAL", 18, null, {
        desc: "Currently 48–52 FPS in the foothills at medium. Target is a locked 60 for the Next Fest demo.",
        checklist: [["Profile GPU frame", true], ["LOD bias for grass", true], ["Shadow cascades 4 → 3", false], ["Re-test on device", false]],
        comments: [["alex", "Grass LOD bias gave +5 FPS. Shadows are the next big win.", 420], ["alina", "If cascades drop, can we keep the contact shadows on the horse? It looks floaty without them.", 300], ["alex", "Yes, those are separate. Keeping them.", 280]],
      }],
      ["DLSS / FSR 3 upscaling toggle", "BACKLOG", "alex", "MEDIUM", 300, null],
      ["Volumetric dust behind galloping herds", "BACKLOG", null, "LOW", null, null],
    ],
  },
  {
    icon: "●", name: "Characters & Animation", lead: "alina", people: ["alina", "aruzhan"],
    description: "Heroes, horses, armour and how they move.",
    tasks: [
      ["Hero rig v2 with facial blendshapes", "DONE", "aruzhan", "HIGH", null, 38],
      ["Horse coat variants: 12 colours", "DONE", "aruzhan", "MEDIUM", null, 16],
      ["Mocap clean-up: 40 riding clips", "DONE", "alina", "MEDIUM", null, 6],
      ["Hero idle on horseback feels stiff: new pass", "REVIEW", "alina", "MEDIUM", 20, null, {
        comments: [["dastan", "Much better. The breathing is a nice touch.", 75]],
      }],
      ["Nomad armour set, 3 tiers", "IN_PROGRESS", "aruzhan", "HIGH", 60, null, {
        checklist: [["Tier 1: leather", true], ["Tier 2: lamellar", false], ["Tier 3: ceremonial", false]],
      }],
      ["Cloth sim for capes at gallop speed", "BACKLOG", null, "MEDIUM", null, null],
    ],
  },
  {
    icon: "▦", name: "World & Level Design", lead: "timur", people: ["timur"],
    description: "Regions, quests, camps and the routes between them.",
    tasks: [
      ["Blockout: Altai foothills region", "DONE", "timur", "HIGH", null, 30],
      ["Yurt camp kit: modular pieces", "DONE", "timur", "MEDIUM", null, 10],
      ["Fix nav mesh holes around river crossings", "IN_PROGRESS", "timur", "HIGH", -26, null, {
        comments: [["marat", "Raiders get stuck on the east bank and just stand there. Kills the ambush in quest 2.", 2200], ["timur", "Rebaking with smaller agent radius tonight.", 1600]],
      }],
      ["Main quest 3: The Salt Road (layout and encounters)", "IN_PROGRESS", "timur", "HIGH", 100, null, {
        checklist: [["Route and landmarks", true], ["Encounter beats", true], ["Caravan escort AI hooks", false], ["Dialogue triggers", false], ["Playable start to end", false]],
      }],
      ["Region 2 blockout: Charyn Canyon", "BACKLOG", "timur", "MEDIUM", 400, null],
      ["Hidden petroglyph collectibles (x30)", "BACKLOG", null, "LOW", null, null],
    ],
  },
  {
    icon: "📱", name: "UI / UX", lead: "dana", people: ["dana"],
    description: "HUD, menus, map and accessibility.",
    tasks: [
      ["HUD v1: health, stamina, quiver", "DONE", "dana", "HIGH", null, 25],
      ["Controller glyphs for Xbox / PlayStation / Deck", "DONE", "dana", "MEDIUM", null, 3],
      ["Map screen with fog of war", "REVIEW", "dana", "HIGH", 40, null, {
        checklist: [["Fog reveal shader", true], ["Custom markers", true], ["Fast travel prompt", true], ["Controller navigation", true]],
      }],
      ["Settings menu: accessibility options", "IN_PROGRESS", "dana", "MEDIUM", 140, null, {
        checklist: [["Subtitle size and background", true], ["Colour-blind modes", false], ["Hold-to-toggle for all inputs", false], ["Camera shake slider", false]],
      }],
      ["Photo mode", "BACKLOG", null, "LOW", null, null],
    ],
  },
  {
    icon: "🎛", name: "Audio", lead: "yerlan", people: ["yerlan"],
    description: "Music, foley and the sound of the steppe.",
    tasks: [
      ["Horse hoof foley by surface type", "DONE", "yerlan", "MEDIUM", null, 35],
      ["Dombra main theme: first mix", "DONE", "yerlan", "HIGH", null, 8],
      ["Dynamic music: switch to combat layer within 1 bar", "IN_PROGRESS", "yerlan", "HIGH", 55, null],
      ["VO casting: Kazakh and English", "BACKLOG", "dastan", "MEDIUM", 200, null],
      ["Ambient wind system tied to weather", "BACKLOG", "yerlan", "LOW", null, null],
    ],
  },
  {
    icon: "🚀", name: "Build & Release", lead: "dastan", people: ["dastan", "alex", "sasha"],
    description: "CI, platforms, store submissions and the Next Fest demo.",
    tasks: [
      ["CI: nightly Windows and Linux builds", "DONE", "alex", "HIGH", null, 50],
      ["Steamworks achievements hook-up", "DONE", "alex", "MEDIUM", null, 14],
      ["Demo build for Steam Next Fest: submit for review", "IN_PROGRESS", "dastan", "CRITICAL", 20, null, {
        desc: "Valve review takes up to 3 business days. Submitting tomorrow keeps a 2-day buffer before the Next Fest deadline.",
        checklist: [["Content lock", true], ["Store page capsule art", true], ["Final QA pass", false], ["Upload depot", false], ["Submit for review", false]],
        comments: [["dastan", "Content is locked. Only crash fixes and the 60 FPS work go in from here.", 900], ["sasha", "Final pass starts as soon as the save bug is closed.", 120]],
      }],
      ["Crash reporter (Sentry) in shipping builds", "REVIEW", "alex", "HIGH", 60, null],
      ["Apply for PlayStation partner programme", "BACKLOG", "dastan", "MEDIUM", 500, null],
    ],
  },
  {
    icon: "🐛", name: "QA & Playtests", lead: "sasha", people: ["sasha"],
    description: "Bugs, regressions and what real players think.",
    tasks: [
      ["Playtest #1: 12 external players, report", "DONE", "sasha", "HIGH", null, 21],
      ["Bug bash: Region 1", "DONE", "sasha", "MEDIUM", null, 5],
      ["Repro: save corrupts when quitting mid-gallop", "REVIEW", "sasha", "CRITICAL", -2, null, {
        desc: "Quitting while mounted at full speed writes a horse transform with NaN velocity. Fix is in review; needs verification on Deck.",
        comments: [["sasha", "100% repro on Deck, ~30% on PC.", 1400], ["alex", "Fix: clamp and validate before serialising. PR is up.", 380], ["sasha", "Verifying now.", 25]],
      }],
      ["Playtest #2: survey and recruitment (30 players)", "IN_PROGRESS", "sasha", "HIGH", 30, null],
      ["Regression suite for save / load", "BACKLOG", "sasha", "MEDIUM", null, null],
    ],
  },
  {
    icon: "🛡️", name: "Marketing & Community", lead: "dastan", people: ["dastan", "dana"],
    description: "Steam page, devlogs, press and the Discord.",
    tasks: [
      ["Announce trailer: 90 s cut", "DONE", "dastan", "HIGH", null, 27],
      ["Steam page: new screenshots and GIFs", "DONE", "dana", "MEDIUM", null, 1],
      ["Devlog #6: 4 km² of grass on a Steam Deck", "IN_PROGRESS", "dana", "MEDIUM", 80, null],
      ["Press kit for Next Fest", "BACKLOG", "dastan", "HIGH", 160, null],
      ["Discord event at 25k wishlists", "BACKLOG", null, "LOW", null, null],
    ],
  },
];

/** Fixed-width odd base-36 keys: sort in order and never end in "0" (see lib/domain/ordering.ts). */
const orderKey = (index) => (index * 2 + 1).toString(36).padStart(3, "0");

async function main() {
  const demo = await prisma.project.findUnique({ where: { id: DEMO_PROJECT_ID } });
  const workspace = demo
    ? await prisma.workspace.findUnique({ where: { id: demo.workspaceId } })
    : await prisma.workspace.findFirst({ orderBy: { createdAt: "asc" } });
  if (!workspace) throw new Error("No workspace found. Open the app once so it can create one, then re-run.");

  // Start clean: old studio project, demo project modules, and previous team accounts.
  await prisma.project.deleteMany({ where: { name: PROJECT_NAME, workspaceId: workspace.id } });
  if (demo) await prisma.module.deleteMany({ where: { projectId: demo.id } });
  await prisma.user.deleteMany({ where: { email: { endsWith: `@${EMAIL_DOMAIN}` } } });

  const users = {};
  for (const [key, person] of Object.entries(TEAM)) {
    users[key] = await prisma.user.create({
      data: {
        email: `${key}@${EMAIL_DOMAIN}`,
        name: person.name,
        createdAt: new Date(now - 62 * DAY),
        memberships: { create: { workspaceId: workspace.id, role: person.role } },
      },
    });
  }

  const project = await prisma.project.create({
    data: {
      name: PROJECT_NAME,
      description: "Open-world horseback action across the Kazakh steppe. Next milestone: the Steam Next Fest demo.",
      workspaceId: workspace.id,
      // Left at "now" on purpose: the home page features the newest project.
    },
  });

  let number = 0;
  let taskCount = 0;
  let commentCount = 0;

  for (const [moduleIndex, mod] of MODULES.entries()) {
    const done = mod.tasks.filter((t) => t[1] === "DONE").length;
    const created = await prisma.module.create({
      data: {
        name: mod.name,
        description: mod.description,
        icon: mod.icon,
        projectId: project.id,
        leadUserId: users[mod.lead].id,
        assignees: { connect: mod.people.map((key) => ({ id: users[key].id })) },
        cachedProgress: Math.round((done / mod.tasks.length) * 100),
        createdAt: new Date(now - (60 - moduleIndex) * DAY),
      },
    });
    const channel = await prisma.channel.create({
      data: {
        name: `mod-${mod.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
        workspaceId: workspace.id,
        moduleId: created.id,
      },
    });

    for (const [title, status, assignee, priority, dueHours, shippedDaysAgo, extras = {}] of mod.tasks) {
      number += 1;
      const completedAt = shippedDaysAgo != null ? new Date(now - shippedDaysAgo * DAY - (number % 7) * HOUR) : null;
      const createdAt = new Date((completedAt?.getTime() ?? now) - (8 + (number % 9)) * DAY);
      const task = await prisma.task.create({
        data: {
          title,
          description: extras.desc ?? null,
          status,
          priority,
          number,
          orderKey: orderKey(number),
          dueAt: dueHours != null ? new Date(now + dueHours * HOUR) : null,
          completedAt,
          checklist: extras.checklist?.map(([text, isDone], i) => ({ id: `c${number}-${i}`, text, done: isDone })),
          moduleId: created.id,
          assigneeId: assignee ? users[assignee].id : null,
          createdAt,
        },
      });
      taskCount += 1;

      for (const [who, content, minutesAgo] of extras.comments ?? []) {
        await prisma.message.create({
          data: {
            content,
            channelId: channel.id,
            authorId: users[who].id,
            taskId: task.id,
            createdAt: new Date(now - minutesAgo * 60_000),
          },
        });
        commentCount += 1;
      }
    }
  }

  const modules = await prisma.module.findMany({ where: { projectId: project.id }, select: { cachedProgress: true } });
  await prisma.project.update({
    where: { id: project.id },
    data: { cachedProgress: Math.round(modules.reduce((sum, m) => sum + m.cachedProgress, 0) / modules.length) },
  });

  console.log(`Seeded "${PROJECT_NAME}": ${MODULES.length} modules, ${taskCount} tasks, ${commentCount} comments, ${Object.keys(TEAM).length} people.`);
  console.log(`Board: /projects/${project.id}/board`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
