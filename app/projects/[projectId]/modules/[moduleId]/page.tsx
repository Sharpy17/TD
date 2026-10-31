import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectSidebar } from "@/components/navigation/ProjectSidebar";
import { ModuleDetail } from "@/components/modules/ModuleDetail";
import { getProjectById } from "@/lib/projects/service";
import { getModulePeople } from "@/lib/modules/assignments";
import { canEditProject } from "@/lib/auth/project-access";
import { getSidebarAccount } from "@/lib/auth/account";

export const dynamic = "force-dynamic";

export default async function ModulePage({ params }: {
  params: Promise<{ projectId: string; moduleId: string }>;
}) {
  const { projectId, moduleId } = await params;
  const project = await getProjectById(projectId);
  const targetModule = project?.modules.find((item) => item.id === moduleId);
  if (!project || !targetModule) notFound();
  const [people, canEdit, account] = await Promise.all([
    getModulePeople(project.id),
    canEditProject(project.id),
    getSidebarAccount(),
  ]);

  // This dynamic server page captures a fresh deadline snapshot per request.
  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now();

  return (
    <main className="app-shell project-shell">
      <ProjectSidebar projectId={projectId} projectName={project.name} account={account} />
      <div className="workspace route-enter">
        <header className="topbar module-topbar">
          <Link className="module-back-link" href={`/projects/${projectId}#modules`}>← {project.name}</Link>
          <span className="eyebrow">Module workspace</span>
        </header>
        <ModuleDetail module={targetModule} projectId={project.id} people={people} canEdit={canEdit} nowMs={nowMs} />
      </div>
    </main>
  );
}
