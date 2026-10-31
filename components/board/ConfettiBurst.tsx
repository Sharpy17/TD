"use client";

import { useEffect, useMemo, useRef, type CSSProperties } from "react";

/** Muted brand hues — reads as a quiet sparkle against the dark board, not a party. */
const COLORS = ["#7c71ff", "#10b981", "#38bdf8", "#c5c1ff", "#5fd4a8"];
const PIECES = 14;
const DURATION_MS = 750;

export type ConfettiOrigin = { id: number; x: number; y: number };

/**
 * A small one-shot burst at a point on screen (where the card landed).
 * Pure CSS transforms, ~14 particles, gone in under a second; skipped for reduced motion.
 */
export function ConfettiBurst({ origin, onDone }: { origin: ConfettiOrigin; onDone: () => void }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: PIECES }, (_, i) => {
        // Even spread around the circle with a little jitter, biased upward.
        const angle = (i / PIECES) * Math.PI * 2 + ((origin.id * 7 + i * 13) % 10) / 20;
        const distance = 26 + ((origin.id + i * 17) % 22);
        return {
          dx: Math.cos(angle) * distance,
          dy: Math.sin(angle) * distance - 14,
          spin: ((i * 47) % 180) - 90,
          color: COLORS[i % COLORS.length],
          wide: i % 3 === 0,
        };
      }),
    [origin.id],
  );

  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const timer = setTimeout(() => onDoneRef.current(), DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="board-confetti" style={{ left: origin.x, top: origin.y }} aria-hidden="true">
      {pieces.map((piece, i) => (
        <i
          key={i}
          style={
            {
              "--dx": `${piece.dx}px`,
              "--dy": `${piece.dy}px`,
              "--spin": `${piece.spin}deg`,
              background: piece.color,
              width: piece.wide ? 6 : 4,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
