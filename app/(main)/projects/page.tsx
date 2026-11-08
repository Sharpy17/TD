import { getViewerWorkspace } from "@/lib/auth/account";
import { getProjects } from "@/lib/projects/service";
import { ProjectsDirectory } from "@/components/projects/ProjectsDirectory";

export default async function ProjectsPage() {
  const viewer = await getViewerWorkspace();
  const projects = await getProjects(viewer?.workspaceId);

  return <ProjectsDirectory initialProjects={projects} />;
}
