import Link from "next/link";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import type { Project, UserSummary } from "@/lib/domain/types";

export function ModuleDetail({ project, moduleId, routeProjectId, people, currentUser, canEdit, nowMs }: {
  project: Project;
  moduleId: string;
  routeProjectId: string;
  people: UserSummary[];
  currentUser: UserSummary | null;
  canEdit: boolean;
  nowMs: number;
}) {
  return (
    <KanbanBoard
      key={moduleId}
      project={project}
      moduleId={moduleId}
      routeProjectId={routeProjectId}
      members={people}
      currentUser={currentUser}
      canEdit={canEdit}
      initialNowMs={nowMs}
      breadcrumb={<Link className="board-crumb" href={`/projects/${routeProjectId}#modules`}>← {project.name}</Link>}
    />
  );
}
