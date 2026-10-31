export function FlameIcon() {
  return (
    <svg className="board-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3c.6 3.4 5 5.2 5 10a5 5 0 0 1-10 0c0-2.2 1.1-3.6 2.2-4.4 0 1.7.9 2.8 2.1 2.8-.3-3 .2-6 .7-8.4z" />
    </svg>
  );
}

export function ChecklistIcon() {
  return (
    <svg className="board-icon" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </svg>
  );
}

export function ChatIcon() {
  return (
    <svg className="board-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 15a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function SoundIcon({ muted }: { muted: boolean }) {
  return (
    <svg className="board-icon board-icon--md" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M11 5 6 9H3v6h3l5 4z" />
      {muted ? <path d="m16 9 5 5M21 9l-5 5" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />}
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
