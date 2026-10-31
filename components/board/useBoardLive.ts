"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { BoardEvent, BoardViewer } from "@/lib/realtime/hub";

const HEARTBEAT_MS = 15_000;
const REFRESH_DEBOUNCE_MS = 200;

/**
 * Keeps a board in sync with everyone else's: subscribes to the project's event stream,
 * refreshes server data when tasks change, and reports this viewer's presence (and voice room).
 */
export function useBoardLive({
  projectId,
  signedIn,
  voiceRoom,
  onComments,
}: {
  projectId: string;
  signedIn: boolean;
  voiceRoom: string | null;
  onComments: (taskId: string) => void;
}): { viewers: BoardViewer[]; connected: boolean; clientId: string | null } {
  const router = useRouter();
  const [viewers, setViewers] = useState<BoardViewer[]>([]);
  const [connected, setConnected] = useState(false);
  const [clientId] = useState(() => (typeof crypto !== "undefined" ? crypto.randomUUID() : null));
  const onCommentsRef = useRef(onComments);

  useEffect(() => {
    onCommentsRef.current = onComments;
  }, [onComments]);

  useEffect(() => {
    if (!clientId) return;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    const source = new EventSource(`/api/projects/${encodeURIComponent(projectId)}/events?clientId=${clientId}`);

    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false); // EventSource reconnects on its own.
    source.onmessage = (message) => {
      const event = JSON.parse(message.data) as BoardEvent;
      if (event.type === "presence") setViewers(event.viewers);
      if (event.type === "comments") onCommentsRef.current(event.taskId);
      if (event.type === "tasks") {
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(() => router.refresh(), REFRESH_DEBOUNCE_MS);
      }
    };

    return () => {
      clearTimeout(refreshTimer);
      source.close();
    };
  }, [projectId, clientId, router]);

  useEffect(() => {
    if (!signedIn || !clientId) return;
    const beat = () =>
      fetch(`/api/projects/${encodeURIComponent(projectId)}/presence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, voiceRoom }),
        keepalive: true,
      }).catch(() => {});

    beat();
    const timer = setInterval(beat, HEARTBEAT_MS);
    return () => clearInterval(timer);
  }, [projectId, clientId, signedIn, voiceRoom]);

  return { viewers, connected, clientId };
}
