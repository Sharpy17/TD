import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import { ProjectSidebar } from "@/components/navigation/ProjectSidebar";
import { getCurrentUser } from "@/lib/auth/service";
import { getProjectById, getProjectMembers } from "@/lib/projects/service";
import { normalizeProjectTasks } from "@/lib/tasks/service";

export const metadata: Metadata = { title: "Board · DaiHub" };

/** Request-time clock; seeds the client countdowns so server and client render the same first frame. */
function requestTimeMs(): number {
  return Date.now();
}

export default async function ProjectBoardPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const [loaded, members, currentUser] = await Promise.all([
    getProjectById(projectId),
    getProjectMembers(projectId),
    getCurrentUser(),
  ]);
  if (!loaded) notFound();

  // Older rows may lack numbers/order keys; fix them once, then reload what changed.
  const project = (await normalizeProjectTasks(loaded.id)) ? ((await getProjectById(projectId)) ?? loaded) : loaded;
  const nowMs = requestTimeMs();
  const account = currentUser ? { name: currentUser.name, email: currentUser.email } : null;

  return (
    <main className="app-shell project-shell">
      <ProjectSidebar projectId={projectId} projectName={project.name} active="board" account={account} />
      <div className="workspace route-enter">
        <KanbanBoard
          key={project.id}
          routeProjectId={projectId}
          project={project}
          members={members}
          currentUser={
            currentUser
              ? { id: currentUser.id, name: currentUser.name, initials: currentUser.name.slice(0, 2).toUpperCase() }
              : null
          }
          initialNowMs={nowMs}
          breadcrumb={
            <Link className="board-crumb" href={`/projects/${projectId}`}>
              {project.name}
            </Link>
          }
        />
      </div>
    </main>
  );
}
