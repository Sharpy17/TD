import type { CSSProperties } from "react";
import type { Task } from "@/lib/domain/types";

const MAX_BLOCKS = 40;

const TASK_STAGE: Record<Task["status"], number> = {
  BACKLOG: 0,
  IN_PROGRESS: 33,
  REVIEW: 67,
  DONE: 100,
};

/** How far each task has moved, for drawing a module's blocks. */
export function taskStages(tasks: readonly Pick<Task, "status">[]): number[] {
  return tasks.map((task) => TASK_STAGE[task.status]);
}

function blockTone(value: number): string {
  if (value >= 100) return "ripe";
  if (value >= 60) return "turning";
  return value > 0 ? "growing" : "";
}

/** Keeps very long lists readable by averaging neighbours into MAX_BLOCKS blocks. */
function fitBlocks(values: readonly number[]): number[] {
  const sorted = [...values].sort((a, b) => b - a);
  if (sorted.length === 0) return [0];
  if (sorted.length <= MAX_BLOCKS) return sorted;
  return Array.from({ length: MAX_BLOCKS }, (_, index) => {
    const start = Math.floor((index * sorted.length) / MAX_BLOCKS);
    const end = Math.floor(((index + 1) * sorted.length) / MAX_BLOCKS);
    const group = sorted.slice(start, end);
    return group.reduce((total, value) => total + value, 0) / group.length;
  });
}

/**
 * Progress as a row of blocks, one per module or task, ripening from leaf
 * green to orange. Finished blocks lead, so the row also reads as a fill.
 */
export function Ripeness({
  values,
  percentage,
  size = "lg",
  label,
}: {
  values: readonly number[];
  percentage: number;
  size?: "sm" | "md" | "lg";
  label?: string | false;
}) {
  const bounded = Math.min(100, Math.max(0, Math.round(percentage)));
  const status = bounded === 100 ? "Done" : bounded === 0 ? "Not started" : "In progress";

  return (
    <div className={`ripeness ripeness--${size}`}>
      <div className="ripeness__blocks" role="img" aria-label={`${bounded}% complete`}>
        {fitBlocks(values).map((value, index) => {
          const tone = blockTone(value);
          return (
            <span
              key={index}
              className={`ripeness__block${tone ? ` ripeness__block--${tone}` : ""}`}
              style={{ "--i": index } as CSSProperties}
            />
          );
        })}
      </div>
      {label !== false && (
        <div className="ripeness__label">
          <span>{label ?? status}</span>
          <strong>{bounded}%</strong>
        </div>
      )}
    </div>
  );
}
