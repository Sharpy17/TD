import { getProjects } from "@/lib/projects/service";
import { ProjectsDirectory } from "@/components/projects/ProjectsDirectory";

export default async function ProjectsPage() {
  const projects = await getProjects();

  return <ProjectsDirectory initialProjects={projects} />;
}
