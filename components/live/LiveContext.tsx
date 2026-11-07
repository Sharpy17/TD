"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { BoardEvent, VoiceMember } from "@/lib/realtime/hub";

type LiveState = { voiceMembers: VoiceMember[]; unreadDirect: number };

const LiveContext = createContext<LiveState>({ voiceMembers: [], unreadDirect: 0 });

const isAuthRoute = (pathname: string) => /^\/(login|signup|invite)(\/|$)/.test(pathname);

/** Holds the one signed-in event stream: voice rosters and the unread direct message count. */
export function LiveProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [voiceMembers, setVoiceMembers] = useState<VoiceMember[]>([]);
  const [unreadDirect, setUnreadDirect] = useState(0);
  const lastUnread = useRef<number | null>(null);
  const pathRef = useRef(pathname);
  const enabled = !isAuthRoute(pathname);

  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (!enabled) return;
    const source = new EventSource("/api/live");
    source.onmessage = (message) => {
      const event = JSON.parse(message.data) as BoardEvent;
      if (event.type === "voice") setVoiceMembers(event.members);
      if (event.type === "unread") {
        const changed = lastUnread.current !== null && lastUnread.current !== event.total;
        lastUnread.current = event.total;
        setUnreadDirect(event.total);
        // Keeps the per-person badges in the chat sidebar current.
        if (changed && pathRef.current.startsWith("/chats")) router.refresh();
      }
    };
    return () => {
      source.close();
      lastUnread.current = null;
    };
  }, [enabled, router]);

  return <LiveContext.Provider value={{ voiceMembers, unreadDirect }}>{children}</LiveContext.Provider>;
}

export const useLive = () => useContext(LiveContext);
