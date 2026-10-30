import { formatDeadline, getDeadlineStatus, isUrgentTask } from "@/lib/domain/deadlines";
import type { Module, Task } from "@/lib/domain/types";

type UrgentTask = { task: Task; moduleName: string };

export function BurningDeadlines({ modules, nowMs }: { modules: Module[]; nowMs: number }) {
  const urgent = modules.flatMap<UrgentTask>((module) =>
    module.tasks.filter((task) => isUrgentTask(task, nowMs)).map((task) => ({ task, moduleName: module.name })),
  );

  if (urgent.length === 0) return null;

  return (
    <section className="burning-panel" aria-labelledby="burning-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow eyebrow--danger">Attention required</span>
          <h2 id="burning-title">Burning deadlines</h2>
        </div>
        <span className="live-count"><i /> {urgent.length} live</span>
      </div>
      <div className="burning-list">
        {urgent.map(({ task, moduleName }) => {
          const status = getDeadlineStatus(task.dueAt, nowMs, task.status);
          return (
            <button className="burning-task" type="button" key={task.id}>
              <span className={`deadline-chip deadline-chip--${status}`}>{status === "overdue" ? "Overdue" : "Burning"}</span>
              <span className="burning-task__copy"><strong>{task.title}</strong><small>{moduleName}</small></span>
              <span className="burning-task__time">{formatDeadline(task.dueAt, nowMs)}</span>
              <span className="avatar">{task.assignee?.initials ?? "?"}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
