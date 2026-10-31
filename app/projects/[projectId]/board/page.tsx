import Link from "next/link";
import { notFound } from "next/navigation";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import { ProjectSidebar } from "@/components/navigation/ProjectSidebar";
import { getCurrentUser } from "@/lib/auth/service";
import { getProjectById, getProjectMembers } from "@/lib/projects/service";

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
  const [project, members, currentUser] = await Promise.all([
    getProjectById(projectId),
    getProjectMembers(projectId),
    getCurrentUser(),
  ]);
  const nowMs = requestTimeMs();

  if (!project) notFound();

  return (
    <main className="app-shell project-shell">
      <ProjectSidebar projectId={projectId} projectName={project.name} active="board" />
      <div className="workspace route-enter">
        <KanbanBoard
          key={project.id}
          routeProjectId={projectId}
          project={project}
          members={members}
          currentUserId={currentUser?.id ?? null}
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
