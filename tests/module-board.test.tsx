import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { KanbanBoard } from "../components/board/KanbanBoard";
import { TaskInspector } from "../components/board/TaskInspector";
import type { Project } from "../lib/domain/types";

vi.mock("@/app/projects/[projectId]/actions", () => ({}));
vi.mock("@/app/projects/[projectId]/modules/[moduleId]/actions", () => ({}));
vi.mock("@/components/voice/VoiceContext", () => ({ useVoice: () => ({ currentRoomName: null }) }));
vi.mock("../components/board/useBoardLive", () => ({ useBoardLive: () => ({ viewers: [], connected: false }) }));

const person = { id: "person", name: "Alex", initials: "AL" };
const project: Project = {
  id: "project", name: "Test project", modules: [
    { id: "auth", name: "Authentication", description: "Sign-in flows", icon: "A", channelSlug: "auth", lead: person,
      tasks: [{ id: "login", title: "Build login", status: "BACKLOG", dueAt: null, assignee: null, number: 1 }] },
    { id: "voice", name: "Voice", description: "Audio", icon: "V", channelSlug: "voice", lead: person,
      tasks: [{ id: "audio", title: "Fix audio", status: "DONE", dueAt: null, assignee: null, number: 2 }] },
  ],
};

function renderBoard(moduleId?: string, canEdit = true) {
  return renderToStaticMarkup(<KanbanBoard project={project} routeProjectId={project.id} moduleId={moduleId}
    members={[person]} currentUser={person} initialNowMs={0} breadcrumb="Test project" canEdit={canEdit} />);
}

describe("Module Kanban scope", () => {
  it("shows only this module's tasks and progress, without a module switcher", () => {
    const html = renderBoard("auth");
    expect(html).toContain("Build login");
    expect(html).not.toContain("Fix audio");
    expect(html).toContain("0% shipped");
    expect(html).toContain("Sign-in flows");
    expect(html).toContain("Everyone");
    expect(html).not.toContain("All modules");
    expect(html).toContain("Add task…  @who !when");
    expect(html).not.toContain("^module !when");
  });

  it("keeps the project board's tasks and module tabs", () => {
    const html = renderBoard();
    expect(html).toContain("Build login");
    expect(html).toContain("Fix audio");
    expect(html).toContain("All modules");
    expect(html).toContain("50% shipped");
  });

  it("does not expose other modules when the requested module is missing", () => {
    const html = renderBoard("missing");
    expect(html).not.toContain("Build login");
    expect(html).not.toContain("Fix audio");
  });

  it("disables dragging and creation for read-only viewers", () => {
    const html = renderBoard("auth", false);
    expect(html).toContain('draggable="false"');
    expect(html).not.toContain('draggable="true"');
    expect(html).not.toContain("Quick add task");
    expect(html).not.toContain("Manage people");
  });

  it("locks the inspector module property while retaining status and checklist controls", () => {
    const html = renderToStaticMarkup(<TaskInspector task={{ ...project.modules[0].tasks[0], moduleId: "auth", moduleName: "Authentication", code: "AUT-1", pending: true }}
      nowMs={0} projectId="project" members={[person]} modules={project.modules.slice(0, 1)} currentUser={person}
      commentsVersion={0} assigneeLive={false} lockedModule onMove={() => {}} onFieldsChange={() => {}}
      onChecklistChange={() => {}} onClose={() => {}} onEdit={() => {}} onDelete={() => {}} />);
    expect(html).toContain("Move task");
    expect(html).toContain("Checklist");
    expect(html).not.toContain("Voice");
  });
});
