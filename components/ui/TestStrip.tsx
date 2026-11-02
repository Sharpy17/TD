import type { CSSProperties } from "react";

const BANDS = 10;

/**
 * Progress drawn as a darkroom test strip: ten bands that come up from deep
 * amber to full safelight as work develops. A finished strip turns green.
 */
export function TestStrip({
  percentage,
  size = "lg",
  label,
}: {
  percentage: number;
  size?: "sm" | "md" | "lg";
  label?: string | false;
}) {
  const bounded = Math.min(100, Math.max(0, Math.round(percentage)));
  const lit = Math.round((bounded / 100) * BANDS);
  const complete = bounded === 100;

  return (
    <div className={`test-strip test-strip--${size}`}>
      <div className="test-strip__bands" role="img" aria-label={`${bounded}% complete`}>
        {Array.from({ length: BANDS }, (_, index) => {
          // The lit run always ends on full safelight, stepping darker towards its start.
          const fromEnd = lit - 1 - index;
          const exposure = index >= lit ? "" : complete ? "done" : `e${Math.max(1, 4 - Math.min(3, fromEnd))}`;
          return (
            <span
              key={index}
              className={`test-strip__band${exposure ? ` test-strip__band--${exposure}` : ""}`}
              style={{ "--i": index } as CSSProperties}
            />
          );
        })}
      </div>
      {label !== false && (
        <div className="test-strip__label">
          <span>{label ?? (complete ? "Developed" : bounded === 0 ? "Not started" : "Progress")}</span>
          <strong>{bounded}%</strong>
        </div>
      )}
    </div>
  );
}
