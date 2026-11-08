import { notFound } from "next/navigation";
import { canViewProject } from "@/lib/auth/project-access";

/** Every project page is limited to members of the project's workspace. */
export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  if (!(await canViewProject(projectId))) notFound();
  return children;
}
