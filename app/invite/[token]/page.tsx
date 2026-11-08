import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/service";
import { lookupInvite } from "@/lib/workspaces/service";
import { AcceptInvite, JoinWithAccount } from "./InviteForm";

export const metadata: Metadata = { title: "Join a workspace · DaiHub", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [invite, user] = await Promise.all([lookupInvite(token), getCurrentUser()]);

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <Link href="/" className="auth-brand">
          <span className="brand__mark" aria-hidden="true" />
          DaiHub
        </Link>

        {invite ? (
          <>
            <div className="auth-header">
              <h1>Join {invite.workspaceName}</h1>
              <p>You&apos;ve been invited to work together on DaiHub.</p>
            </div>
            {user ? <AcceptInvite token={token} userName={user.name} /> : <JoinWithAccount token={token} />}
          </>
        ) : (
          <div className="auth-header">
            <h1>This invite isn&apos;t valid</h1>
            <p>It has expired or been revoked. Ask whoever sent it for a new link.</p>
          </div>
        )}
      </div>
    </div>
  );
}
