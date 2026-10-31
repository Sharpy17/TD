import { getCurrentUser } from "@/lib/auth/service";
import { normalizeProjectTasks } from "@/lib/tasks/service";
import { notFound } from "next/navigation";
import { ProjectSidebar } from "@/components/navigation/ProjectSidebar";
import { ModuleDetail } from "@/components/modules/ModuleDetail";
import { getProjectById } from "@/lib/projects/service";
import { getModulePeople } from "@/lib/modules/assignments";
import { canEditProject } from "@/lib/auth/project-access";

export const dynamic = "force-dynamic";

export default async function ModulePage({ params }: {
  params: Promise<{ projectId: string; moduleId: string }>;
}) {
  const { projectId, moduleId } = await params;
  const loaded = await getProjectById(projectId);
  if (!loaded || !loaded.modules.some((item) => item.id === moduleId)) notFound();
  const project = (await normalizeProjectTasks(loaded.id)) ? ((await getProjectById(projectId)) ?? loaded) : loaded;
  const targetModule = project?.modules.find((item) => item.id === moduleId);
  if (!project || !targetModule) notFound();
  const [people, canEdit, currentUser] = await Promise.all([
    getModulePeople(project.id),
    canEditProject(project.id),
    getCurrentUser(),
  ]);

  // This dynamic server page captures a fresh deadline snapshot per request.
  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now();

  return (
    <main className="app-shell project-shell">
      <ProjectSidebar projectId={projectId} projectName={project.name} />
      <div className="workspace route-enter">
        <ModuleDetail project={project} moduleId={moduleId} routeProjectId={projectId} people={people} canEdit={canEdit} nowMs={nowMs}
          currentUser={currentUser ? { id: currentUser.id, name: currentUser.name, initials: currentUser.name.slice(0, 2).toUpperCase() } : null}
        />
      </div>
    </main>
  );
}
