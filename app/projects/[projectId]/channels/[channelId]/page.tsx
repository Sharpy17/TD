import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/service";
import { getSidebarAccount } from "@/lib/auth/account";
import { getProjectById } from "@/lib/projects/service";
import { ProjectSidebar } from "@/components/navigation/ProjectSidebar";
import { ChatScreen, ChatSignInPrompt } from "@/components/chat/ChatScreen";

export const dynamic = "force-dynamic";

export default async function ProjectChannelPage({
  params,
}: {
  params: Promise<{ projectId: string; channelId: string }>;
}) {
  const { projectId, channelId } = await params;
  const [project, user, account] = await Promise.all([getProjectById(projectId), getCurrentUser(), getSidebarAccount()]);
  if (!project) notFound();

  return (
    <main className="app-shell project-shell">
      <ProjectSidebar projectId={projectId} projectName={project.name} active="channels" account={account} />
      <div className="workspace route-enter">
        {user ? (
          <ChatScreen user={user} channelId={channelId} scope={{ kind: "project", projectId: project.id }} />
        ) : (
          <ChatSignInPrompt />
        )}
      </div>
    </main>
  );
}
