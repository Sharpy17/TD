import { describe, expect, it } from "vitest";
import { parseQuickAdd } from "../lib/tasks/quickAdd";
import { compareByUrgency, deadlineChipLabel, type BoardTask } from "../components/board/boardModel";

const HOUR = 3_600_000;
const now = Date.UTC(2026, 9, 31, 10, 0, 0);
const context = {
  nowMs: now,
  modules: [
    { id: "m_voice", name: "Voice lounges" },
    { id: "m_kanban", name: "Kanban engine" },
  ],
  members: [
    { id: "u_alina", name: "Alina", initials: "AL" },
    { id: "u_marat", name: "Marat", initials: "MA" },
  ],
};

describe("parseQuickAdd", () => {
  it("resolves assignee, module and relative deadline tokens", () => {
    const parsed = parseQuickAdd("Fix echo on mute @ali ^voice !6h", context);
    expect(parsed.title).toBe("Fix echo on mute");
    expect(parsed.assigneeId).toBe("u_alina");
    expect(parsed.moduleId).toBe("m_voice");
    expect(parsed.dueAt).toBe(new Date(now + 6 * HOUR).toISOString());
    expect(parsed.tokens).toEqual(["@Alina", "^Voice lounges", "!6h"]);
  });

  it("supports day offsets", () => {
    expect(parseQuickAdd("Ship it !3d", context).dueAt).toBe(new Date(now + 72 * HOUR).toISOString());
  });

  it("keeps unresolved tokens in the title", () => {
    const parsed = parseQuickAdd("Email @nobody about ^billing !someday", context);
    expect(parsed.title).toBe("Email @nobody about ^billing !someday");
    expect(parsed.assigneeId).toBeNull();
    expect(parsed.moduleId).toBeNull();
    expect(parsed.dueAt).toBeNull();
  });

  it("returns an empty title when only tokens were typed", () => {
    expect(parseQuickAdd("@marat ^kanban", context).title).toBe("");
  });
});

describe("board deadline chips", () => {
  const task = (id: string, dueInHours: number | null, status: BoardTask["status"] = "IN_PROGRESS"): BoardTask => ({
    id,
    title: id,
    status,
    dueAt: dueInHours === null ? null : new Date(now + dueInHours * HOUR).toISOString(),
    assignee: null,
    moduleId: "m",
    moduleName: "M",
  });

  it("formats each urgency state", () => {
    expect(deadlineChipLabel(task("a", 5.5), now)).toBe("05:30:00");
    expect(deadlineChipLabel(task("b", -3.25), now)).toBe("Expired 3h 15m");
    expect(deadlineChipLabel(task("c", 50), now)).toBe("2d 2h left");
    expect(deadlineChipLabel(task("d", null), now)).toBeNull();
    expect(deadlineChipLabel(task("e", -10, "DONE"), now)).toBe("Shipped");
  });

  it("sorts overdue first, then soonest due, undated last", () => {
    const sorted = [task("later", 100), task("none", null), task("late", -1), task("soon", 2)].sort((a, b) =>
      compareByUrgency(a, b, now),
    );
    expect(sorted.map((t) => t.id)).toEqual(["late", "soon", "later", "none"]);
  });
});
