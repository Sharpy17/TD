import Link from "next/link";
import { notFound } from "next/navigation";
import type { AuthSessionUser } from "@/lib/auth/service";
import { findChannel, getChatDirectory, getMessages } from "@/lib/chat/service";
import type { ChannelSummary } from "@/lib/chat/types";
import { ChannelList } from "./ChannelList";
import { ChatRoom } from "./ChatRoom";
import { Icon } from "@/components/ui/Icon";

/**
 * The two-pane chat: channel list + conversation.
 * - scope "workspace" (/chats/…) lists every channel the user can see, grouped by project.
 * - scope "project" (/projects/:id/channels/…) lists one project's channels inside the project shell.
 */
export async function ChatScreen({
  user,
  channelId,
  scope,
}: {
  user: AuthSessionUser;
  channelId: string;
  scope: { kind: "workspace" } | { kind: "project"; projectId: string };
}) {
  const directory = await getChatDirectory(user.id);
  const found = findChannel(directory, channelId);
  if (!found) notFound();
  if (scope.kind === "project" && found.project?.id !== scope.projectId) notFound();

  const messages = await getMessages(channelId, user.id);
  const { channel, project } = found;

  const hrefFor = (target: ChannelSummary, projectSlug: string | null) =>
    scope.kind === "project" && projectSlug
      ? `/projects/${projectSlug}/channels/${target.id}`
      : `/chats/${target.id}`;

  return (
    <div className="chat-layout">
      <aside className="chat-sidebar">
        <div className="chat-sidebar__head">
          <strong>Channels</strong>
        </div>
        <ChannelList
          directory={directory}
          activeId={channel.id}
          hrefFor={hrefFor}
          onlyProjectId={scope.kind === "project" ? scope.projectId : undefined}
        />
      </aside>
      <ChatRoom
        key={channel.id}
        channel={channel}
        initialMessages={messages}
        currentUser={{ id: user.id, name: user.name, initials: user.name.slice(0, 2).toUpperCase() }}
        context={{
          scopeLabel: project ? project.name : "Workspace",
          scopeHref: project ? `/projects/${project.slug}` : undefined,
          boardHref: project && channel.moduleId ? `/projects/${project.slug}/modules/${channel.moduleId}` : undefined,
        }}
      />
    </div>
  );
}

export function ChatSignInPrompt() {
  return (
    <>
      <header className="main-topbar"><div><strong>Chats</strong></div></header>
      <div className="main-content">
        <div className="empty-state">
          <span><Icon name="hash" size={22} /></span>
          <strong>Sign in to see your team&apos;s channels</strong>
          <p>Channels are only visible to workspace members.</p>
          <Link className="primary-button button-link" href="/login">Sign in</Link>
        </div>
      </div>
    </>
  );
}

export function ChatNoAccess() {
  return (
    <>
      <header className="main-topbar"><div><strong>Chats</strong></div></header>
      <div className="main-content">
        <div className="empty-state">
          <span><Icon name="hash" size={22} /></span>
          <strong>No channels yet</strong>
          <p>You&apos;re not a member of this workspace, or there are no channels you can see.</p>
        </div>
      </div>
    </>
  );
}
