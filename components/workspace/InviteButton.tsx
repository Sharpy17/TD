"use client";

import { useEffect, useState } from "react";
import { createInviteAction, listInvitesAction, revokeInviteAction } from "@/app/workspace-actions";
import { Icon } from "@/components/ui/Icon";
import type { InvitableRole, InviteSummary } from "@/lib/workspaces/service";

const ROLE_OPTIONS: Array<{ role: InvitableRole; label: string; hint: string }> = [
  { role: "MEMBER", label: "Member", hint: "Can see and edit everything in the workspace." },
  { role: "GUEST", label: "Guest", hint: "Read-only, and only chats in the modules they're assigned to." },
];

const expiryLabel = (iso: string) => new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });

/** Opens the invite dialog: create a link, copy it, and revoke old ones. */
export function InviteButton({ workspaceName }: { workspaceName: string }) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<InvitableRole>("MEMBER");
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invites, setInvites] = useState<InviteSummary[]>([]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void listInvitesAction().then((items) => {
      if (!cancelled) setInvites(items);
    });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      cancelled = true;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const createLink = async () => {
    setPending(true);
    setError(null);
    setCopied(false);
    const result = await createInviteAction(role);
    setPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setLink(`${window.location.origin}/invite/${result.token}`);
    setInvites(await listInvitesAction());
  };

  const copyLink = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setError("Couldn't copy automatically. Select the link and copy it.");
    }
  };

  const revoke = async (inviteId: string) => {
    if (await revokeInviteAction(inviteId)) {
      setInvites((items) => items.filter((invite) => invite.id !== inviteId));
      setLink(null);
    }
  };

  return (
    <>
      <button className="secondary-button" type="button" onClick={() => setOpen(true)}>
        <Icon name="users" size={15} /> Invite
      </button>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)} role="dialog" aria-modal="true" aria-labelledby="invite-title">
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 id="invite-title">Invite people to {workspaceName}</h2>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setOpen(false)} aria-label="Close">
                <Icon name="close" />
              </button>
            </div>

            {error && (
              <div className="auth-banner-error auth-banner-error--spaced" role="alert">
                <Icon name="alert" />
                <span>{error}</span>
              </div>
            )}

            <div className="auth-form">
              <div className="form-group">
                <span className="form-label">They join as</span>
                <div className="chip-group">
                  {ROLE_OPTIONS.map((option) => (
                    <button
                      type="button"
                      key={option.role}
                      className={`chip-btn ${role === option.role ? "chip-btn--active" : ""}`}
                      aria-pressed={role === option.role}
                      onClick={() => {
                        setRole(option.role);
                        setLink(null);
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <small className="invite-hint">{ROLE_OPTIONS.find((option) => option.role === role)?.hint}</small>
              </div>

              {link ? (
                <div className="form-group">
                  <label className="form-label" htmlFor="invite-link">Invite link</label>
                  <div className="invite-link">
                    <input id="invite-link" className="form-input" readOnly value={link} onFocus={(event) => event.target.select()} />
                    <button type="button" className="primary-button" onClick={copyLink}>
                      <Icon name={copied ? "check" : "copy"} size={15} /> {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <small className="invite-hint">Works for anyone who has it, for 7 days. It&apos;s only shown once.</small>
                </div>
              ) : (
                <button type="button" className="primary-button" onClick={createLink} disabled={pending}>
                  {pending ? "Creating…" : "Create invite link"}
                </button>
              )}

              {invites.length > 0 && (
                <div className="form-group">
                  <span className="form-label">Active links</span>
                  <ul className="invite-list">
                    {invites.map((invite) => (
                      <li key={invite.id}>
                        <span>
                          {invite.role === "GUEST" ? "Guest" : "Member"} link · {invite.useCount} joined · until {expiryLabel(invite.expiresAt)}
                        </span>
                        <button type="button" className="text-link" onClick={() => revoke(invite.id)}>Revoke</button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
