"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AccountMenu, type SidebarAccount } from "./AccountMenu";

const navigation = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/projects", label: "Projects", icon: "▦" },
  { href: "/chats", label: "Chats", icon: "#" },
];

export function GlobalSidebar({ account }: { account: SidebarAccount }) {
  const pathname = usePathname();

  return (
    <aside className="sidebar global-sidebar">
      <Link className="brand" href="/">
        <span>⚡</span>
        <strong>DaiHub</strong>
      </Link>

      <div className="sidebar-label">Workspace</div>
      <nav aria-label="Workspace navigation">
        {navigation.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link className={`nav-item ${active ? "nav-item--active" : ""}`} href={item.href} key={item.href}>
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <AccountMenu account={account} />
    </aside>
  );
}
