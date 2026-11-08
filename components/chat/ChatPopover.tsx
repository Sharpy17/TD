"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

const VIEWPORT_GUTTER = 8;
const ANCHOR_GAP = 6;

/**
 * A panel pinned next to the button that opened it. It uses fixed positioning because the
 * message list clips anything absolute, and it flips and clamps to stay on screen.
 */
export function ChatPopover({
  anchor,
  label,
  onClose,
  children,
}: {
  anchor: DOMRect;
  label: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    const panel = ref.current;
    if (!panel) return;
    const { width, height } = panel.getBoundingClientRect();
    const above = anchor.top - height - ANCHOR_GAP;
    const top = above >= VIEWPORT_GUTTER ? above : Math.min(anchor.bottom + ANCHOR_GAP, window.innerHeight - height - VIEWPORT_GUTTER);
    const left = Math.min(Math.max(anchor.right - width, VIEWPORT_GUTTER), window.innerWidth - width - VIEWPORT_GUTTER);
    setPosition({ left, top: Math.max(top, VIEWPORT_GUTTER) });
  }, [anchor]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="chat-popover"
      role="dialog"
      aria-label={label}
      style={position ?? { left: 0, top: 0, visibility: "hidden" }}
    >
      {children}
    </div>
  );
}
