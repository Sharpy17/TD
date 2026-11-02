import Link from "next/link";
import type { ChannelSummary, ChatDirectory } from "@/lib/chat/types";
import { Icon } from "@/components/ui/Icon";
import { ModuleIcon } from "@/components/ui/ModuleIcon";

export type ChannelHref = (channel: ChannelSummary, projectSlug: string | null) => string;

function ChannelLink({ channel, href, active }: { channel: ChannelSummary; href: string; active: boolean }) {
  return (
    <Link
      className={`chat-channel ${active ? "chat-channel--active" : ""}`}
      href={href}
      aria-current={active ? "page" : undefined}
    >
      <span className="chat-channel__hash">{channel.kind === "module" ? <ModuleIcon glyph={channel.icon} size={14} /> : "#"}</span>
      <span className="chat-channel__name">{channel.name}</span>
      {channel.burning ? <span className="chat-channel__burning" title={`${channel.burning} burning`}><Icon name="flame" size={12} />{channel.burning}</span> : null}
      {channel.kind === "module" && channel.progress !== undefined ? (
        <span className="chat-channel__progress">{channel.progress}%</span>
      ) : null}
    </Link>
  );
}

/**
 * The chat sidebar. Workspace-wide channels first, then each project with its #general and module channels.
 * Pass `onlyProjectId` inside a project to show just that project's channels.
 */
export function ChannelList({
  directory,
  activeId,
  hrefFor,
  onlyProjectId,
}: {
  directory: ChatDirectory;
  activeId: string;
  hrefFor: ChannelHref;
  onlyProjectId?: string;
}) {
  const projects = onlyProjectId ? directory.projects.filter((p) => p.id === onlyProjectId) : directory.projects;

  return (
    <nav className="chat-channels" aria-label="Channels">
      {!onlyProjectId && directory.workspace.length > 0 && (
        <div className="chat-channels__group">
          <div className="sidebar-label">Workspace</div>
          {directory.workspace.map((channel) => (
            <ChannelLink key={channel.id} channel={channel} href={hrefFor(channel, null)} active={channel.id === activeId} />
          ))}
        </div>
      )}

      {projects.map((project) => (
        <div className="chat-channels__group" key={project.id}>
          <div className="sidebar-label" title={project.name}>{onlyProjectId ? "Project channels" : project.name}</div>
          {project.channels.map((channel) => (
            <ChannelLink key={channel.id} channel={channel} href={hrefFor(channel, project.slug)} active={channel.id === activeId} />
          ))}
        </div>
      ))}

      {onlyProjectId && (
        <Link className="chat-channels__all" href="/chats">All workspace chats <Icon name="arrowRight" size={14} /></Link>
      )}
    </nav>
  );
}
