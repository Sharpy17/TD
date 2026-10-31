"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/(auth)/actions";

const navigation = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/projects", label: "Projects", icon: "▦" },
  { href: "/chats", label: "Chats", icon: "#" },
];

export function GlobalSidebar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <aside className="sidebar global-sidebar">
      <Link className="brand" href="/">
        <span>⚡</span>
        <strong>Toguz</strong>
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

      <div className="sidebar__bottom" style={{ position: "relative" }}>
        <span className="avatar">DA</span>
        <div><strong>Dastan</strong><small>Founder workspace</small></div>
        <button
          type="button"
          aria-label="Open settings"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ cursor: "pointer", padding: "4px 8px" }}
        >
          ···
        </button>

        {menuOpen && (
          <div
            style={{
              position: "absolute",
              bottom: "100%",
              left: 10,
              right: 10,
              marginBottom: 8,
              padding: "6px",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
              zIndex: 50,
              display: "grid",
              gap: "4px",
            }}
          >
            <Link
              href="/login"
              className="nav-item"
              style={{ minHeight: 32, fontSize: 12, padding: "0 8px" }}
              onClick={() => setMenuOpen(false)}
            >
              <span>→</span> Switch Account / Login
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="nav-item"
                style={{
                  minHeight: 32,
                  fontSize: 12,
                  width: "100%",
                  textAlign: "left",
                  border: 0,
                  background: "transparent",
                  color: "#ff708f",
                  cursor: "pointer",
                  padding: "0 8px",
                }}
              >
                <span>⎋</span> Log out
              </button>
            </form>
          </div>
        )}
      </div>
    </aside>
  );
}
