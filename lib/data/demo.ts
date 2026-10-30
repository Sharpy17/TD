import type { Project, UserSummary, VoiceRoom } from "@/lib/domain/types";

const alex: UserSummary = { id: "usr_alex", name: "Alex", initials: "AL" };
const dastan: UserSummary = { id: "usr_dastan", name: "Dastan", initials: "DA" };
const alina: UserSummary = { id: "usr_alina", name: "Alina", initials: "AK" };
const marat: UserSummary = { id: "usr_marat", name: "Marat", initials: "MK" };

// Dates are intentionally relative so every local demo shows each urgency state.
export const demoNowMs = Date.now();
const inHours = (hours: number): string => new Date(demoNowMs + hours * 3_600_000).toISOString();

export const demoProject: Project = {
  id: "prj_toguz",
  name: "Toguz Hub Core",
  modules: [
    {
      id: "mod_auth",
      name: "Auth & profiles",
      description: "Fast startup onboarding and four clear roles.",
      icon: "◆",
      channelSlug: "mod-auth",
      lead: dastan,
      tasks: [
        { id: "auth-1", title: "Define workspace membership", status: "DONE", dueAt: null, assignee: dastan },
        { id: "auth-2", title: "Magic-link sign in", status: "DONE", dueAt: null, assignee: dastan },
        { id: "auth-3", title: "Invite team members", status: "DONE", dueAt: null, assignee: alex },
      ],
    },
    {
      id: "mod_kanban",
      name: "Kanban engine",
      description: "Optimistic task movement and honest progress.",
      icon: "▦",
      channelSlug: "mod-kanban",
      lead: marat,
      tasks: [
        { id: "kan-1", title: "Model four task states", status: "DONE", dueAt: null, assignee: marat },
        { id: "kan-2", title: "Build deadline classifier", status: "DONE", dueAt: null, assignee: marat },
        { id: "kan-3", title: "Add optimistic drag and drop", status: "IN_PROGRESS", dueAt: inHours(6), assignee: alex },
        { id: "kan-4", title: "Persist task ordering", status: "BACKLOG", dueAt: inHours(50), assignee: marat },
      ],
    },
    {
      id: "mod_voice",
      name: "Voice lounges",
      description: "Drop-in rooms for focused co-working.",
      icon: "◉",
      channelSlug: "mod-voice",
      lead: alex,
      tasks: [
        { id: "voice-1", title: "Choose the SFU provider", status: "REVIEW", dueAt: inHours(-3), assignee: alex },
        { id: "voice-2", title: "Prototype room token service", status: "BACKLOG", dueAt: inHours(120), assignee: dastan },
      ],
    },
    {
      id: "mod_fun",
      name: "Soundboard & fun",
      description: "Local playback, safe volume, shared timing.",
      icon: "♫",
      channelSlug: "mod-fun",
      lead: alina,
      tasks: [],
    },
  ],
};

export const demoVoiceRooms: VoiceRoom[] = [
  { id: "room_dev", name: "Dev General", members: [{ ...alex, speaking: true }, dastan, { ...marat, muted: true }] },
  { id: "room_chill", name: "Chill Lounge", members: [alina] },
  { id: "room_focus", name: "Silent Focus", members: [] },
];
