"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { logoutAction } from "@/app/(auth)/actions";
import { Icon } from "@/components/ui/Icon";

export type SidebarAccount = { name: string; email: string } | null;

/**
 * Sidebar footer: who you are, plus log out / switch account.
 * Signed-out visitors get Sign in / Create account instead of a placeholder identity.
 */
export function AccountMenu({ account, extraItems }: { account: SidebarAccount; extraItems?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!account) {
    return (
      <div className="sidebar__bottom account account--signed-out">
        <span className="avatar" aria-hidden="true">?</span>
        <div>
          <strong>Not signed in</strong>
          <small>Browsing as a guest</small>
        </div>
        <div className="account__actions">
          <Link className="account__signin" href="/login">
            Sign in
          </Link>
          <Link className="account__signup" href="/signup">
            Create account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar__bottom account" ref={rootRef}>
      <span className="avatar" aria-hidden="true">
        {account.name.slice(0, 2).toUpperCase()}
      </span>
      <div>
        <strong>{account.name}</strong>
        <small title={account.email}>{account.email}</small>
      </div>
      <button
        type="button"
        className="account__toggle"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        ···
      </button>

      {open && (
        <div className="account__menu" role="menu">
          <Link className="account__item" role="menuitem" href="/login" onClick={() => setOpen(false)}>
            <Icon name="user" /> Switch account
          </Link>
          {extraItems}
          <form action={logoutAction}>
            <button type="submit" className="account__item account__item--danger" role="menuitem">
              <Icon name="logout" /> Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
