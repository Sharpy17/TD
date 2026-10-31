export function FlameIcon() {
  return (
    <svg className="board-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3c.6 3.4 5 5.2 5 10a5 5 0 0 1-10 0c0-2.2 1.1-3.6 2.2-4.4 0 1.7.9 2.8 2.1 2.8-.3-3 .2-6 .7-8.4z" />
    </svg>
  );
}

/** Linear-style signal bars; level 4 (critical) turns red. */
export function PriorityBars({ level }: { level: number }) {
  return (
    <span className={`board-prio board-prio--${level}`} aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}
