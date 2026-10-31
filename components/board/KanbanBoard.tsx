"use client";

import { useEffect, useMemo, useOptimistic, useRef, useState, useTransition, type ReactNode } from "react";
import { moveTaskAction, quickAddTaskAction } from "@/app/projects/[projectId]/actions";
import { DeleteTaskModal } from "@/components/tasks/DeleteTaskModal";
import { EditTaskModal } from "@/components/tasks/EditTaskModal";
import { isUrgentTask } from "@/lib/domain/deadlines";
import { calculateProgress } from "@/lib/domain/progress";
import type { Project, TaskStatus, UserSummary } from "@/lib/domain/types";
import type { QuickAddResult } from "@/lib/tasks/quickAdd";
import { BOARD_COLUMNS, compareByUrgency, WIP_LIMIT, type BoardTask } from "./boardModel";
import { FlameIcon } from "./icons";
import { KanbanCard } from "./KanbanCard";
import { QuickAdd } from "./QuickAdd";
import { TaskInspector } from "./TaskInspector";

type OptimisticAction =
  | { type: "move"; taskId: string; status: TaskStatus }
  | { type: "add"; task: BoardTask };

type Toast = { tone: "success" | "error"; text: string; detail?: string };

function applyAction(tasks: BoardTask[], action: OptimisticAction): BoardTask[] {
  if (action.type === "add") return [action.task, ...tasks];
  return tasks.map((task) => (task.id === action.taskId ? { ...task, status: action.status } : task));
}

/** Ticks once a second so burning countdowns stay live. Seeded from the server to keep hydration stable. */
function useNow(initialNowMs: number): number {
  const [nowMs, setNowMs] = useState(initialNowMs);
  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return nowMs;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

export function KanbanBoard({
  routeProjectId,
  project,
  members,
  currentUserId,
  initialNowMs,
  breadcrumb,
}: {
  routeProjectId: string;
  project: Project;
  members: UserSummary[];
  currentUserId: string | null;
  initialNowMs: number;
  breadcrumb: ReactNode;
}) {
  const serverTasks = useMemo<BoardTask[]>(
    () =>
      project.modules.flatMap((module) =>
        module.tasks.map((task) => ({ ...task, moduleId: module.id, moduleName: module.name })),
      ),
    [project],
  );
  const [tasks, applyOptimistic] = useOptimistic(serverTasks, applyAction);
  const [, startTransition] = useTransition();
  const nowMs = useNow(initialNowMs);

  const [moduleFilter, setModuleFilter] = useState("all");
  const [mineOnly, setMineOnly] = useState(false);
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<TaskStatus | null>(null);
  const [editing, setEditing] = useState<BoardTask | null>(null);
  const [deleting, setDeleting] = useState<BoardTask | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const quickAddRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), toast.tone === "error" ? 5000 : 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const moduleProgress = (moduleId: string, list: BoardTask[]) =>
    calculateProgress(list.filter((task) => task.moduleId === moduleId));

  const visibleTasks = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return tasks.filter((task) => {
      if (moduleFilter !== "all" && task.moduleId !== moduleFilter) return false;
      if (mineOnly && task.assignee?.id !== currentUserId) return false;
      if (urgentOnly && !isUrgentTask(task, nowMs)) return false;
      if (needle && !task.title.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [tasks, moduleFilter, mineOnly, urgentOnly, query, currentUserId, nowMs]);

  const columns = BOARD_COLUMNS.map((column) => ({
    ...column,
    tasks: visibleTasks
      .filter((task) => task.status === column.status)
      .sort((a, b) => compareByUrgency(a, b, nowMs)),
  }));
  const orderedIds = columns.flatMap((column) => column.tasks.map((task) => task.id));

  const selectedTask = tasks.find((task) => task.id === selectedId) ?? null;
  const openCount = tasks.filter((task) => task.status !== "DONE").length;
  const burningCount = tasks.filter((task) => isUrgentTask(task, nowMs) && Date.parse(task.dueAt!) >= nowMs).length;
  const overdueCount = tasks.filter((task) => isUrgentTask(task, nowMs) && Date.parse(task.dueAt!) < nowMs).length;
  const inProgressCount = tasks.filter((task) => task.status === "IN_PROGRESS").length;
  const defaultModule =
    project.modules.find((module) => module.id === moduleFilter) ?? project.modules[0] ?? null;

  const moveTask = (taskId: string, status: TaskStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.pending || task.status === status) return;

    if (status === "DONE") {
      const before = moduleProgress(task.moduleId, tasks);
      const after = moduleProgress(task.moduleId, applyAction(tasks, { type: "move", taskId, status }));
      setToast({ tone: "success", text: `“${task.title}” shipped`, detail: `${task.moduleName} ${before}% → ${after}%` });
    }

    startTransition(async () => {
      applyOptimistic({ type: "move", taskId, status });
      const result = await moveTaskAction(taskId, status, routeProjectId);
      if (!result.success) {
        setToast({ tone: "error", text: `Couldn't move “${task.title}”`, detail: result.error ?? "Moved it back." });
      }
    });
  };

  const addTask = (parsed: QuickAddResult & { moduleId: string }) => {
    const target = project.modules.find((m) => m.id === parsed.moduleId);
    if (!target) return;

    const optimistic: BoardTask = {
      id: `optimistic-${crypto.randomUUID()}`,
      title: parsed.title,
      status: "BACKLOG",
      priority: "MEDIUM",
      description: null,
      dueAt: parsed.dueAt,
      assignee: members.find((m) => m.id === parsed.assigneeId) ?? null,
      moduleId: target.id,
      moduleName: target.name,
      pending: true,
    };

    startTransition(async () => {
      applyOptimistic({ type: "add", task: optimistic });
      const result = await quickAddTaskAction({
        projectId: routeProjectId,
        moduleId: target.id,
        title: parsed.title,
        assigneeId: parsed.assigneeId,
        dueAt: parsed.dueAt,
      });
      if (!result.success) {
        setToast({ tone: "error", text: `Couldn't add “${parsed.title}”`, detail: result.error });
      }
    });
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (editing || deleting || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      const key = event.key.toLowerCase();
      if (key === "n") {
        event.preventDefault();
        quickAddRef.current?.focus();
      } else if (key === "escape") {
        setSelectedId(null);
      } else if ((key === "j" || key === "k") && orderedIds.length > 0) {
        const index = selectedId ? orderedIds.indexOf(selectedId) : -1;
        const next =
          key === "j" ? Math.min(orderedIds.length - 1, index + 1) : Math.max(0, index === -1 ? 0 : index - 1);
        const nextId = orderedIds[next];
        setSelectedId(nextId);
        document.querySelector(`[data-task-id="${nextId}"]`)?.scrollIntoView({ block: "nearest" });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editing, deleting, orderedIds, selectedId]);

  const moduleTabs = [
    { id: "all", name: "All modules", progress: calculateProgress(tasks) },
    ...project.modules.map((module) => ({ id: module.id, name: module.name, progress: moduleProgress(module.id, tasks) })),
  ];

  return (
    <>
      <header className="topbar">
        <div>
          <span className="eyebrow">Board</span>
          <strong>{breadcrumb}</strong>
        </div>
        <label className="search">
          <span aria-hidden="true">⌕</span>
          <input
            aria-label="Filter tasks"
            placeholder="Filter tasks by title"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <button type="button" className="primary-button board-new" onClick={() => quickAddRef.current?.focus()}>
          + New task <kbd>N</kbd>
        </button>
      </header>

      <div className="board-layout">
        <section className="board" aria-label="Board">
          <div className="board-head">
            <div>
              <h1>Board</h1>
              <p className="board-mono" suppressHydrationWarning>
                {openCount} open · {burningCount} burning · {overdueCount} overdue · {calculateProgress(tasks)}% shipped
              </p>
            </div>
            <div className="board-filters">
              <button
                type="button"
                className="board-pill"
                aria-pressed={mineOnly}
                disabled={!currentUserId}
                title={currentUserId ? undefined : "Sign in to filter your tasks"}
                onClick={() => setMineOnly(!mineOnly)}
              >
                Assigned to me
              </button>
              <button
                type="button"
                className="board-pill board-pill--urgent"
                aria-pressed={urgentOnly}
                onClick={() => setUrgentOnly(!urgentOnly)}
              >
                <FlameIcon />
                Due &lt; 24h
                <span className="board-mono" suppressHydrationWarning>
                  {burningCount + overdueCount}
                </span>
              </button>
            </div>
          </div>

          <div className="board-tabs" role="group" aria-label="Filter by module">
            {moduleTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className="board-pill"
                aria-pressed={moduleFilter === tab.id}
                onClick={() => setModuleFilter(tab.id)}
              >
                {tab.name}
                <span className="board-mono">{tab.progress}%</span>
              </button>
            ))}
          </div>

          <div className="board-columns">
            {columns.map((column) => (
              <div
                key={column.status}
                className={`board-column ${dropTarget === column.status ? "board-column--drop" : ""}`}
                onDragOver={(event) => {
                  if (!event.dataTransfer.types.includes("text/task-id")) return;
                  event.preventDefault();
                  setDropTarget(column.status);
                }}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropTarget(null);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setDropTarget(null);
                  const taskId = event.dataTransfer.getData("text/task-id");
                  if (taskId) moveTask(taskId, column.status);
                }}
              >
                <div className="board-column__head">
                  <span className="board-dot" style={{ background: column.color }} />
                  <h2>{column.label}</h2>
                  <span className="board-mono">{column.tasks.length}</span>
                  {column.status === "IN_PROGRESS" && (
                    <span className={`board-mono board-wip ${inProgressCount > WIP_LIMIT ? "board-wip--over" : ""}`}>
                      · WIP {inProgressCount}/{WIP_LIMIT}
                    </span>
                  )}
                </div>

                {column.tasks.map((task) => (
                  <KanbanCard
                    key={task.id}
                    task={task}
                    nowMs={nowMs}
                    selected={task.id === selectedId}
                    onSelect={setSelectedId}
                  />
                ))}

                {column.tasks.length === 0 && <div className="board-column__empty">Nothing here</div>}

                {column.status === "BACKLOG" && (
                  <QuickAdd
                    modules={project.modules}
                    members={members}
                    defaultModule={defaultModule}
                    nowMs={nowMs}
                    inputRef={quickAddRef}
                    onSubmit={addTask}
                  />
                )}
              </div>
            ))}
          </div>
        </section>

        <TaskInspector
          task={selectedTask}
          nowMs={nowMs}
          onMove={moveTask}
          onClose={() => setSelectedId(null)}
          onEdit={setEditing}
          onDelete={setDeleting}
        />
      </div>

      {editing && (
        <EditTaskModal
          key={editing.id}
          isOpen
          onClose={() => setEditing(null)}
          task={editing}
          modules={project.modules}
          currentModuleId={editing.moduleId}
          projectId={routeProjectId}
        />
      )}
      {deleting && (
        <DeleteTaskModal
          isOpen
          onClose={() => setDeleting(null)}
          taskId={deleting.id}
          taskTitle={deleting.title}
          projectId={routeProjectId}
        />
      )}

      {toast && (
        <div className={`board-toast board-toast--${toast.tone}`} role="status">
          <span className="board-dot" />
          <span>{toast.text}</span>
          {toast.detail && <span className="board-mono">{toast.detail}</span>}
        </div>
      )}
    </>
  );
}
