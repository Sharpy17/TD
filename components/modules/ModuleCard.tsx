import { isUrgentTask } from "@/lib/domain/deadlines";
import { calculateProgress, countCompleted } from "@/lib/domain/progress";
import type { Module } from "@/lib/domain/types";
import { RadialProgressRing } from "./RadialProgressRing";

export function ModuleCard({ module, nowMs }: { module: Module; nowMs: number }) {
  const progress = calculateProgress(module.tasks);
  const completed = countCompleted(module);
  const burningCount = module.tasks.filter((task) => isUrgentTask(task, nowMs)).length;

  return (
    <article className={`module-card ${burningCount ? "module-card--burning" : ""}`}>
      <div className="module-card__head">
        <span className="module-card__icon" aria-hidden="true">{module.icon}</span>
        <div>
          <h3>{module.name}</h3>
          <p>{module.description}</p>
        </div>
        <RadialProgressRing percentage={progress} />
      </div>
      <div className="module-card__meta">
        <span>{completed}/{module.tasks.length} tasks</span>
        <span>Lead: @{module.lead.name.toLowerCase()}</span>
      </div>
      <div className="module-card__footer">
        <button type="button" className="channel-pill"># {module.channelSlug}</button>
        {progress === 100 ? <span className="status status--done">Shipped</span> : null}
        {burningCount > 0 ? <span className="status status--burning">{burningCount} burning</span> : null}
        {module.tasks.length === 0 ? <span className="status">Not started</span> : null}
      </div>
    </article>
  );
}
