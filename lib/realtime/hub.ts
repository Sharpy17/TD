/**
 * In-process pub/sub for live board updates and presence.
 *
 * Lives on globalThis so route handlers and server actions share one instance even when the
 * bundler loads this module more than once. It only spans a single server process: running
 * several instances (serverless, multiple containers) needs a shared broker such as Redis or
 * Postgres LISTEN/NOTIFY behind the same publish/subscribe API.
 */

export type BoardViewer = {
  clientId: string;
  userId: string;
  name: string;
  initials: string;
  voiceRoom: string | null;
};

export type BoardEvent =
  | { type: "tasks" }
  | { type: "comments"; taskId: string }
  | { type: "presence"; viewers: BoardViewer[] }
  /** A chat channel changed (new message or reaction). Published on the `chatTopic(channelId)` key. */
  | { type: "messages"; channelId: string };

/** Hub key for one chat channel's listeners (board listeners are keyed by project id). */
export const chatTopic = (channelId: string) => `chat:${channelId}`;

type Listener = (event: BoardEvent) => void;

const VIEWER_TTL_MS = 40_000;

interface Hub {
  listeners: Map<string, Set<Listener>>;
  viewers: Map<string, Map<string, BoardViewer & { seenAt: number }>>;
}

const globalForHub = globalThis as unknown as { __daihubBoardHub?: Hub };
const hub: Hub = (globalForHub.__daihubBoardHub ??= { listeners: new Map(), viewers: new Map() });

export function publish(projectId: string, event: BoardEvent): void {
  for (const listener of hub.listeners.get(projectId) ?? []) {
    try {
      listener(event);
    } catch (err) {
      console.error("[realtime] listener failed:", err);
    }
  }
}

export function subscribe(projectId: string, listener: Listener): () => void {
  const set = hub.listeners.get(projectId) ?? new Set<Listener>();
  set.add(listener);
  hub.listeners.set(projectId, set);
  return () => {
    set.delete(listener);
    if (set.size === 0) hub.listeners.delete(projectId);
  };
}

/** Drops viewers that stopped sending heartbeats; returns true when anyone was removed. */
function sweep(projectId: string, nowMs: number): boolean {
  const viewers = hub.viewers.get(projectId);
  if (!viewers) return false;
  let changed = false;
  for (const [clientId, viewer] of viewers) {
    if (nowMs - viewer.seenAt > VIEWER_TTL_MS) {
      viewers.delete(clientId);
      changed = true;
    }
  }
  return changed;
}

export function listViewers(projectId: string): BoardViewer[] {
  sweep(projectId, Date.now());
  return [...(hub.viewers.get(projectId)?.values() ?? [])].map((viewer) => ({
    clientId: viewer.clientId,
    userId: viewer.userId,
    name: viewer.name,
    initials: viewer.initials,
    voiceRoom: viewer.voiceRoom,
  }));
}

export function touchViewer(projectId: string, viewer: BoardViewer): void {
  const now = Date.now();
  const viewers = hub.viewers.get(projectId) ?? new Map();
  hub.viewers.set(projectId, viewers);

  const previous = viewers.get(viewer.clientId);
  const changed =
    sweep(projectId, now) || !previous || previous.voiceRoom !== viewer.voiceRoom || previous.name !== viewer.name;
  viewers.set(viewer.clientId, { ...viewer, seenAt: now });

  if (changed) publish(projectId, { type: "presence", viewers: listViewers(projectId) });
}

export function dropViewer(projectId: string, clientId: string): void {
  if (hub.viewers.get(projectId)?.delete(clientId)) {
    publish(projectId, { type: "presence", viewers: listViewers(projectId) });
  }
}
