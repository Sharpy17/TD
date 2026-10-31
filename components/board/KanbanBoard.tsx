"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useOptimistic,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
  type DragEvent,
  type ReactNode,
} from "react";
import {
  moveTaskAction,
  quickAddTaskAction,
  updateChecklistAction,
  updateTaskFieldsAction,
} from "@/app/projects/[projectId]/actions";
import { ModuleAssignees } from "@/components/modules/ModuleAssignees";
import { RadialProgressRing } from "@/components/modules/RadialProgressRing";
import { DeleteTaskModal } from "@/components/tasks/DeleteTaskModal";
import { EditTaskModal } from "@/components/tasks/EditTaskModal";
import { useVoice } from "@/components/voice/VoiceContext";
import { playTaskDoneChime } from "@/lib/audio/soundEffects";
import { isUrgentTask } from "@/lib/domain/deadlines";
import { keyBetween } from "@/lib/domain/ordering";
import { calculateProgress } from "@/lib/domain/progress";
import { taskCode } from "@/lib/domain/taskCodes";
import type { ChecklistItem, Project, TaskStatus, UserSummary } from "@/lib/domain/types";
import type { QuickAddResult } from "@/lib/tasks/quickAdd";
import {
  BOARD_COLUMNS,
  compareForColumn,
  DONE_FRESH_MS,
  PERSONAL_WIP_LIMIT,
  WIP_LIMIT,
  type BoardTask,
} from "./boardModel";
import { ConfettiBurst, type ConfettiOrigin } from "./ConfettiBurst";
import { FlameIcon, SoundIcon } from "./icons";
import { Avatar, KanbanCard, type DropEdge } from "./KanbanCard";
import { QuickAdd } from "./QuickAdd";
import { TaskInspector, type TaskFieldsPatch } from "./TaskInspector";
import { useBoardLive } from "./useBoardLive";

type OptimisticAction =
  | { type: "move"; taskId: string; status: TaskStatus; orderKey?: string }
  | { type: "add"; task: BoardTask }
  | { type: "checklist"; taskId: string; items: ChecklistItem[] }
  | { type: "fields"; taskId: string; patch: Partial<BoardTask> };

type Toast = { tone: "success" | "error"; text: string; detail?: string };
type DropMarker = { taskId: string; edge: DropEdge } | { status: TaskStatus };

function applyAction(tasks: BoardTask[], action: OptimisticAction): BoardTask[] {
  switch (action.type) {
    case "add":
      return [action.task, ...tasks];
    case "move":
      return tasks.map((task) =>
        task.id === action.taskId
          ? {
              ...task,
              status: action.status,
              orderKey: action.orderKey ?? task.orderKey,
              completedAt: action.status === "DONE" ? (task.completedAt ?? new Date().toISOString()) : null,
            }
          : task,
      );
    case "checklist":
      return tasks.map((task) => (task.id === action.taskId ? { ...task, checklist: action.items } : task));
    case "fields":
      return tasks.map((task) => (task.id === action.taskId ? { ...task, ...action.patch } : task));
  }
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

const SOUND_KEY = "toguz.board.sound";
const soundListeners = new Set<() => void>();

function readSoundSetting(): boolean {
  try {
    return window.localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
}

/** Board sound on/off, remembered per browser. Server render assumes "on". */
function useSoundSetting(): [boolean, (on: boolean) => void] {
  const enabled = useSyncExternalStore(
    (notify) => {
      soundListeners.add(notify);
      window.addEventListener("storage", notify);
      return () => {
        soundListeners.delete(notify);
        window.removeEventListener("storage", notify);
      };
    },
    readSoundSetting,
    () => true,
  );
  const set = useCallback((on: boolean) => {
    try {
      window.localStorage.setItem(SOUND_KEY, on ? "on" : "off");
    } catch {
      // Storage blocked; the toggle just won't persist.
    }
    soundListeners.forEach((notify) => notify());
  }, []);
  return [enabled, set];
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export function KanbanBoard({
  routeProjectId,
  project,
  members,
  currentUser,
  initialNowMs,
  breadcrumb,
  moduleId,
  canEdit = true,
}: {
  routeProjectId: string;
  project: Project;
  members: UserSummary[];
  currentUser: UserSummary | null;
  initialNowMs: number;
  breadcrumb: ReactNode;
  moduleId?: string;
  canEdit?: boolean;
}) {
  const boardModules = useMemo(() => moduleId ? project.modules.filter((item) => item.id === moduleId) : project.modules, [project.modules, moduleId]);
  const scopedModule = moduleId ? boardModules[0] : undefined;
  const boardTitle = scopedModule ? scopedModule.name : "Board";
  const serverTasks = useMemo<BoardTask[]>(
    () =>
      boardModules.flatMap((module) =>
        module.tasks.map((task) => ({
          ...task,
          moduleId: module.id,
          moduleName: module.name,
          code: taskCode(module.name, task.number),
        })),
      ),
    [boardModules],
  );
  const [tasks, applyOptimistic] = useOptimistic(serverTasks, applyAction);
  const [, startTransition] = useTransition();
  const nowMs = useNow(initialNowMs);
  const [soundOn, setSoundOn] = useSoundSetting();
  const { currentRoomName } = useVoice();

  const [moduleFilter, setModuleFilter] = useState("all");
  const [mineOnly, setMineOnly] = useState(false);
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [showOlderDone, setShowOlderDone] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropMarker, setDropMarker] = useState<DropMarker | null>(null);
  const [editing, setEditing] = useState<BoardTask | null>(null);
  const [deleting, setDeleting] = useState<BoardTask | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [confetti, setConfetti] = useState<ConfettiOrigin[]>([]);
  const [commentVersions, setCommentVersions] = useState<Record<string, number>>({});
  const quickAddRef = useRef<HTMLInputElement>(null);
  const confettiSeq = useRef(0);

  const { viewers, connected } = useBoardLive({
    projectId: routeProjectId,
    signedIn: !!currentUser,
    voiceRoom: currentRoomName,
    onComments: (taskId) => setCommentVersions((v) => ({ ...v, [taskId]: (v[taskId] ?? 0) + 1 })),
  });

  // People in a voice room right now, by user id; and everyone else looking at this board.
  const liveUserIds = useMemo(() => new Set(viewers.filter((v) => v.voiceRoom).map((v) => v.userId)), [viewers]);
  const otherViewers = useMemo(() => {
    const seen = new Map<string, (typeof viewers)[number]>();
    for (const viewer of viewers) {
      if (viewer.userId === currentUser?.id) continue;
      const existing = seen.get(viewer.userId);
      if (!existing || (!existing.voiceRoom && viewer.voiceRoom)) seen.set(viewer.userId, viewer);
    }
    return [...seen.values()];
  }, [viewers, currentUser?.id]);

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
      if (mineOnly && task.assignee?.id !== currentUser?.id) return false;
      if (urgentOnly && !isUrgentTask(task, nowMs)) return false;
      if (needle && !task.title.toLowerCase().includes(needle) && !task.code?.toLowerCase().includes(needle)) {
        return false;
      }
      return true;
    });
  }, [tasks, moduleFilter, mineOnly, urgentOnly, query, currentUser?.id, nowMs]);

  const columns = BOARD_COLUMNS.map((column) => {
    const all = visibleTasks
      .filter((task) => task.status === column.status)
      .sort((a, b) => compareForColumn(a, b, nowMs));
    if (column.status !== "DONE") return { ...column, tasks: all, hiddenCount: 0 };

    const fresh = all.filter(
      (task) => task.pending || !task.completedAt || nowMs - Date.parse(task.completedAt) < DONE_FRESH_MS,
    );
    return { ...column, tasks: showOlderDone ? all : fresh, hiddenCount: all.length - fresh.length };
  });
  const orderedIds = columns.flatMap((column) => column.tasks.map((task) => task.id));

  const selectedTask = tasks.find((task) => task.id === selectedId) ?? null;
  const openCount = tasks.filter((task) => task.status !== "DONE").length;
  const burningCount = tasks.filter((task) => isUrgentTask(task, nowMs) && Date.parse(task.dueAt!) >= nowMs).length;
  const overdueCount = tasks.filter((task) => isUrgentTask(task, nowMs) && Date.parse(task.dueAt!) < nowMs).length;
  const inProgress = tasks.filter((task) => task.status === "IN_PROGRESS");
  const defaultModule =
    boardModules.find((module) => module.id === moduleFilter) ?? boardModules[0] ?? null;

  // Per-person load in "In progress", most loaded first.
  const personalWip = useMemo(() => {
    const counts = new Map<string, { user: UserSummary; count: number }>();
    for (const task of inProgress) {
      if (!task.assignee) continue;
      const entry = counts.get(task.assignee.id) ?? { user: task.assignee, count: 0 };
      entry.count += 1;
      counts.set(task.assignee.id, entry);
    }
    return [...counts.values()].sort((a, b) => b.count - a.count);
  }, [inProgress]);

  // Live tab title: urgent work stays visible from other tabs.
  const urgentTotal = burningCount + overdueCount;
  useEffect(() => {
    const previous = document.title;
    document.title = urgentTotal > 0 ? `🔥 ${urgentTotal} · ${boardTitle} · ${project.name}` : `${boardTitle} · ${project.name}`;
    return () => {
      document.title = previous;
    };
  }, [urgentTotal, project.name, boardTitle]);

  const celebrate = (taskId: string) => {
    if (soundOn) playTaskDoneChime();
    if (prefersReducedMotion()) return;
    const card = document.querySelector(`[data-task-id="${CSS.escape(taskId)}"]`);
    const rect = card?.getBoundingClientRect();
    if (!rect) return;
    const id = ++confettiSeq.current;
    setConfetti((list) => [...list, { id, x: rect.left + rect.width / 2, y: rect.top + 12 }]);
  };

  const moveTask = (taskId: string, status: TaskStatus, orderKey?: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!canEdit || !task || task.pending) return;
    if (task.status === status && (orderKey === undefined || orderKey === task.orderKey)) return;

    if (status === "DONE" && task.status !== "DONE") {
      const before = moduleProgress(task.moduleId, tasks);
      const after = moduleProgress(task.moduleId, applyAction(tasks, { type: "move", taskId, status }));
      setToast({
        tone: "success",
        text: `${task.code ?? `“${task.title}”`} shipped`,
        detail: `${task.moduleName} ${before}% → ${after}%`,
      });
      // Wait a frame so the burst starts where the card lands in Done.
      requestAnimationFrame(() => celebrate(taskId));
    }

    startTransition(async () => {
      applyOptimistic({ type: "move", taskId, status, orderKey });
      const result = await moveTaskAction(taskId, { status, orderKey }, routeProjectId)
        .catch(() => ({ success: false, error: "Connection interrupted. Please try again." }));
      if (!result.success) {
        setToast({ tone: "error", text: `Couldn't move “${task.title}”`, detail: result.error ?? "Moved it back." });
      }
    });
  };

  const updateFields = (taskId: string, fields: TaskFieldsPatch) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!canEdit || !task || task.pending) return;

    // Translate ids into what the card renders, so the change shows before the server answers.
    const patch: Partial<BoardTask> = {};
    if (fields.priority !== undefined) patch.priority = fields.priority;
    if (fields.dueAt !== undefined) patch.dueAt = fields.dueAt;
    if (fields.assigneeId !== undefined) {
      patch.assignee = fields.assigneeId ? (members.find((m) => m.id === fields.assigneeId) ?? null) : null;
    }
    if (fields.moduleId !== undefined) {
      const target = boardModules.find((m) => m.id === fields.moduleId);
      if (!target) return;
      patch.moduleId = target.id;
      patch.moduleName = target.name;
      patch.code = taskCode(target.name, task.number);
    }

    startTransition(async () => {
      applyOptimistic({ type: "fields", taskId, patch });
      const result = await updateTaskFieldsAction(taskId, fields, routeProjectId)
        .catch(() => ({ success: false, error: "Connection interrupted. Please try again." }));
      if (!result.success) {
        setToast({ tone: "error", text: `Couldn't update “${task.title}”`, detail: result.error ?? "Change undone." });
      }
    });
  };

  const updateChecklist = (taskId: string, items: ChecklistItem[]) => {
    if (!canEdit || !tasks.some((task) => task.id === taskId)) return;
    startTransition(async () => {
      applyOptimistic({ type: "checklist", taskId, items });
      const result = await updateChecklistAction(taskId, items, routeProjectId)
        .catch(() => ({ success: false, error: "Connection interrupted. Please try again." }));
      if (!result.success) {
        setToast({ tone: "error", text: "Couldn't save the checklist", detail: result.error });
      }
    });
  };

  const addTask = (parsed: QuickAddResult & { moduleId: string }) => {
    const target = boardModules.find((m) => m.id === parsed.moduleId);
    if (!canEdit || !target) return;

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
      code: null,
      orderKey: "~", // sorts after every real key until the server assigns one
      checklist: [],
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
      }).catch(() => ({ success: false, error: "Connection interrupted. Please try again." }));
      if (!result.success) {
        setToast({ tone: "error", text: `Couldn't add “${parsed.title}”`, detail: result.error });
      }
    });
  };

  /** Resolves where a dragged card would land and the order key that puts it there. */
  const dropTargetKey = (status: TaskStatus, marker: DropMarker | null, draggedId: string): string => {
    const list = (columns.find((c) => c.status === status)?.tasks ?? []).filter((t) => t.id !== draggedId);
    let index = list.length;
    if (marker && "taskId" in marker) {
      const at = list.findIndex((t) => t.id === marker.taskId);
      if (at !== -1) index = marker.edge === "before" ? at : at + 1;
    }
    return keyBetween(list[index - 1]?.orderKey ?? null, list[index]?.orderKey ?? null);
  };

  const handleColumnDrop = (event: DragEvent<HTMLDivElement>, status: TaskStatus) => {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/task-id");
    const marker = dropMarker;
    setDropMarker(null);
    setDraggingId(null);
    if (taskId) moveTask(taskId, status, dropTargetKey(status, marker, taskId));
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
        document.querySelector(`[data-task-id="${CSS.escape(nextId)}"]`)?.scrollIntoView({ block: "nearest" });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editing, deleting, orderedIds, selectedId]);

  const moduleTabs = [
    { id: "all", name: "All modules", progress: calculateProgress(tasks) },
    ...boardModules.map((module) => ({ id: module.id, name: module.name, progress: moduleProgress(module.id, tasks) })),
  ];

  return (
    <>
      <header className="topbar">
        <div>
          <span className="eyebrow">{scopedModule ? "Module board" : "Board"}</span>
          <strong>{breadcrumb}</strong>
        </div>
        <label className="search">
          <span aria-hidden="true">⌕</span>
          <input
            aria-label="Filter tasks"
            placeholder="Filter by title or ID"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="board-topbar-actions">
          <div className="board-presence" aria-label={`${otherViewers.length} other people viewing this project`}>
            <span
              className={`board-live-dot ${connected ? "board-live-dot--on" : ""}`}
              title={connected ? "Live — changes from your team appear instantly" : "Reconnecting…"}
            />
            {otherViewers.slice(0, 4).map((viewer) => (
              <Avatar
                key={viewer.userId}
                user={{ id: viewer.userId, name: viewer.name, initials: viewer.initials }}
                live={!!viewer.voiceRoom}
              />
            ))}
            {otherViewers.length > 4 && <span className="board-presence__more">+{otherViewers.length - 4}</span>}
          </div>
          <button
            type="button"
            className="board-icon-button board-icon-button--lg"
            aria-label={soundOn ? "Mute board sounds" : "Unmute board sounds"}
            aria-pressed={!soundOn}
            onClick={() => setSoundOn(!soundOn)}
          >
            <SoundIcon muted={!soundOn} />
          </button>
          <button type="button" disabled={!canEdit} className="primary-button board-new" onClick={() => quickAddRef.current?.focus()}>
            + New task <kbd>N</kbd>
          </button>
        </div>
      </header>

      <div className={`board-layout ${scopedModule ? "board-layout--module" : ""}`}>
        <section className="board" aria-label={scopedModule ? `${scopedModule.name} task board` : "Board"}>
          <div className="board-head">
            <div>
              <h1>{scopedModule && <span aria-hidden="true">{scopedModule.icon} </span>}{boardTitle}</h1>
              {scopedModule?.description && <p className="module-board-description">{scopedModule.description}</p>}
              <p className="board-mono" suppressHydrationWarning>
                {openCount} open · {burningCount} burning · {overdueCount} overdue · {calculateProgress(tasks)}% shipped
              </p>
            </div>
            <div className="board-filters">
              <button
                type="button"
                className="board-pill"
                aria-pressed={mineOnly}
                disabled={!currentUser}
                title={currentUser ? undefined : "Sign in to filter your tasks"}
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
                  {urgentTotal}
                </span>
              </button>
            </div>
          </div>

          {scopedModule && <div className="module-board-overview">
            <ModuleAssignees moduleId={scopedModule.id} assignees={scopedModule.assignees || []} people={members} canEdit={canEdit} />
            <RadialProgressRing percentage={calculateProgress(tasks)} />
          </div>}
          {!canEdit && <p className="module-readonly">Sign in as a workspace member to manage tasks.</p>}
          {!scopedModule && <div className="board-tabs" role="group" aria-label="Filter by module">
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
          </div>}

          <div className="board-columns" onDragEnd={() => (setDraggingId(null), setDropMarker(null))}>
            {columns.map((column) => {
              const endMarker = dropMarker && "status" in dropMarker && dropMarker.status === column.status;
              return (
                <div
                  key={column.status}
                  className={`board-column ${draggingId && (endMarker || (dropMarker && "taskId" in dropMarker && column.tasks.some((t) => t.id === dropMarker.taskId))) ? "board-column--drop" : ""}`}
                  onDragStart={(event) => setDraggingId((event.target as HTMLElement).dataset.taskId ?? null)}
                  onDragOver={(event) => {
                    if (!event.dataTransfer.types.includes("text/task-id")) return;
                    event.preventDefault();
                    // Over the column itself (not a card): drop at the end.
                    if (!(event.target as HTMLElement).closest("[data-task-id]")) {
                      setDropMarker({ status: column.status });
                    }
                  }}
                  onDragLeave={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropMarker(null);
                  }}
                  onDrop={(event) => handleColumnDrop(event, column.status)}
                >
                  <div className="board-column__head">
                    <span className="board-dot" style={{ background: column.color }} />
                    <h2>{column.label}</h2>
                    <span className="board-mono">{column.tasks.length}</span>
                    {column.status === "IN_PROGRESS" && (
                      <span className={`board-mono board-wip ${inProgress.length > WIP_LIMIT ? "board-wip--over" : ""}`}>
                        · WIP {inProgress.length}/{WIP_LIMIT}
                      </span>
                    )}
                  </div>

                  {column.status === "IN_PROGRESS" && personalWip.length > 0 && (
                    <div className="board-person-wip" aria-label="Tasks in progress per person">
                      {personalWip.map(({ user, count }) => (
                        <span
                          key={user.id}
                          className={`board-person-wip__item ${count > PERSONAL_WIP_LIMIT ? "board-person-wip__item--over" : ""}`}
                          title={`${user.name}: ${count} of ${PERSONAL_WIP_LIMIT} in progress`}
                        >
                          <Avatar user={user} size="sm" live={liveUserIds.has(user.id)} />
                          <span className="board-mono">
                            {count}/{PERSONAL_WIP_LIMIT}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}

                  {column.tasks.map((task) => (
                    <KanbanCard
                      key={task.id}
                      task={task}
                      canEdit={canEdit}
                      showModule={!scopedModule}
                      nowMs={nowMs}
                      selected={task.id === selectedId}
                      assigneeLive={!!task.assignee && liveUserIds.has(task.assignee.id)}
                      dropEdge={
                        draggingId && draggingId !== task.id && dropMarker && "taskId" in dropMarker && dropMarker.taskId === task.id
                          ? dropMarker.edge
                          : null
                      }
                      onSelect={setSelectedId}
                      onDragOverCard={(taskId, edge) => setDropMarker({ taskId, edge })}
                    />
                  ))}

                  {endMarker && draggingId && <div className="board-drop-line" />}

                  {column.tasks.length === 0 && !endMarker && <div className="board-column__empty">Nothing here</div>}

                  {column.hiddenCount > 0 && !showOlderDone && (
                    <button type="button" className="board-more" onClick={() => setShowOlderDone(true)}>
                      Show {column.hiddenCount} older
                    </button>
                  )}
                  {column.status === "DONE" && showOlderDone && (
                    <button type="button" className="board-more" onClick={() => setShowOlderDone(false)}>
                      Hide shipped over 7 days ago
                    </button>
                  )}

                  {column.status === "BACKLOG" && canEdit && (
                    <QuickAdd
                      lockedModule={!!scopedModule}
                      modules={boardModules}
                      members={members}
                      defaultModule={defaultModule}
                      nowMs={nowMs}
                      inputRef={quickAddRef}
                      onSubmit={addTask}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <TaskInspector
          canEdit={canEdit}
          lockedModule={!!scopedModule}
          task={selectedTask}
          nowMs={nowMs}
          projectId={routeProjectId}
          members={members}
          modules={boardModules}
          currentUser={currentUser}
          commentsVersion={selectedTask ? (commentVersions[selectedTask.id] ?? 0) : 0}
          assigneeLive={!!selectedTask?.assignee && liveUserIds.has(selectedTask.assignee.id)}
          onMove={moveTask}
          onFieldsChange={updateFields}
          onChecklistChange={updateChecklist}
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
          modules={boardModules}
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

      {confetti.map((origin) => (
        <ConfettiBurst
          key={origin.id}
          origin={origin}
          onDone={() => setConfetti((list) => list.filter((o) => o.id !== origin.id))}
        />
      ))}

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
