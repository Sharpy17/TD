import { describe, expect, it } from "vitest";
import { getDeadlineStatus } from "../lib/domain/deadlines";
import { calculateProgress, calculateProjectProgress } from "../lib/domain/progress";
import type { Project, Task } from "../lib/domain/types";

const NOW = Date.parse("2026-10-29T12:00:00.000Z");

describe("deadline classification", () => {
  it("classifies all UTC boundaries consistently", () => {
    expect(getDeadlineStatus("2026-10-29T11:59:59.000Z", NOW, "IN_PROGRESS")).toBe("overdue");
    expect(getDeadlineStatus("2026-10-30T12:00:00.000Z", NOW, "IN_PROGRESS")).toBe("burning");
    expect(getDeadlineStatus("2026-11-01T12:00:00.000Z", NOW, "IN_PROGRESS")).toBe("warning");
    expect(getDeadlineStatus("2026-11-01T12:00:01.000Z", NOW, "IN_PROGRESS")).toBe("safe");
  });

  it("does not flag completed tasks", () => {
    expect(getDeadlineStatus("2026-10-20T12:00:00.000Z", NOW, "DONE")).toBe("none");
  });
});

describe("progress", () => {
  it("returns zero instead of NaN for an empty module", () => expect(calculateProgress([])).toBe(0));

  it("uses the binary done/total model", () => {
    const tasks = ["DONE", "DONE", "REVIEW", "BACKLOG"].map((status, index) => ({ id: String(index), title: "", dueAt: null, assignee: null, status })) as Task[];
    expect(calculateProgress(tasks)).toBe(50);
  });

  it("averages module progress for project progress", () => {
    const task = (status: Task["status"]): Task => ({ id: status, title: status, status, dueAt: null, assignee: null });
    const project = { modules: [{ tasks: [task("DONE")] }, { tasks: [task("DONE"), task("BACKLOG")] }] } as Project;
    expect(calculateProjectProgress(project)).toBe(75);
  });
});
