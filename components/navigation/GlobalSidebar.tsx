"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { VoiceRoom } from "@/lib/domain/types";
import { Icon, type IconName } from "@/components/ui/Icon";
import { useLive } from "@/components/live/LiveContext";
import { useVoice } from "@/components/voice/VoiceContext";
import { AccountMenu, type SidebarAccount } from "./AccountMenu";

const navigation: Array<{ href: string; label: string; icon: IconName }> = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/projects", label: "Projects", icon: "projects" },
  { href: "/chats", label: "Chats", icon: "hash" },
];

export function GlobalSidebar({ account, rooms = [] }: { account: SidebarAccount; rooms?: VoiceRoom[] }) {
  const pathname = usePathname();
  const { currentRoomId, joinRoom, leaveRoom, membersOf } = useVoice();
  const { unreadDirect } = useLive();

  return (
    <aside className="sidebar global-sidebar">
      <Link className="brand" href="/">
        <span className="brand__mark" aria-hidden="true" />
        <strong>DaiHub</strong>
      </Link>

      <div>
        <div className="sidebar-label">Workspace</div>
        <nav aria-label="Workspace navigation">
          {navigation.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                className={`nav-item ${active ? "nav-item--active" : ""}`}
                href={item.href}
                key={item.href}
                aria-current={active ? "page" : undefined}
                title={item.label}
              >
                <Icon name={item.icon} />
                <span className="nav-item__label">{item.label}</span>
                {item.href === "/chats" && unreadDirect > 0 && (
                  <span className="unread-badge" aria-label={`${unreadDirect} unread direct messages`}>{unreadDirect}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {rooms.length > 0 && (
        <div className="sidebar-rooms">
          <div className="sidebar-label">Voice rooms</div>
          {rooms.map((room) => {
            const live = currentRoomId === room.id;
            const count = membersOf(room.id).length;
            return (
              <button
                key={room.id}
                type="button"
                className={`sidebar-room ${live ? "sidebar-room--live" : ""}`}
                onClick={() => (live ? leaveRoom() : joinRoom({ id: room.id, name: room.name }))}
                title={live ? `Leave ${room.name}` : `Join ${room.name}`}
              >
                <i aria-hidden="true" />
                {room.name}
                {count > 0 && <small>{count}</small>}
              </button>
            );
          })}
        </div>
      )}

      <AccountMenu account={account} />
    </aside>
  );
}
