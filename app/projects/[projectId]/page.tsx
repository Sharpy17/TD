import { notFound } from "next/navigation";
import { BurningDeadlines } from "@/components/dashboard/BurningDeadlines";
import { VoiceLounges } from "@/components/dashboard/VoiceLounges";
import { ProjectSidebar } from "@/components/navigation/ProjectSidebar";
import { ModulesSection } from "@/components/modules/ModulesSection";
import { ProjectHeaderActions } from "@/components/projects/ProjectHeaderActions";
import { demoNowMs, demoProjectSlug, demoVoiceRooms } from "@/lib/data/demo";
import { calculateProjectProgress } from "@/lib/domain/progress";
import { getProjectById } from "@/lib/projects/service";
import { getVoiceRooms } from "@/lib/voice/service";
import { getSidebarAccount } from "@/lib/auth/account";
import { Icon } from "@/components/ui/Icon";
import { TestStrip } from "@/components/ui/TestStrip";
import { ProjectDangerZone } from "@/components/projects/ProjectDangerZone";

export const dynamicParams = true;

export function generateStaticParams() {
  return [{ projectId: demoProjectSlug }];
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const [project, dbVoiceRooms, account] = await Promise.all([
    getProjectById(projectId),
    getVoiceRooms(),
    getSidebarAccount(),
  ]);

  if (!project) notFound();

  const voiceRooms = dbVoiceRooms.map((r) => {
    const demoMatch = demoVoiceRooms.find((d) => d.name.toLowerCase() === r.name.toLowerCase());
    return {
      ...r,
      members: demoMatch ? demoMatch.members : r.members,
    };
  });

  const projectProgress = calculateProjectProgress(project);

  return (
    <main className="app-shell project-shell">
      <ProjectSidebar projectId={projectId} projectName={project.name} account={account} />
      <div className="workspace route-enter">
        <header className="topbar">
          <div>
            <strong>{project.name}</strong>
          </div>
          <label className="search">
            <Icon name="search" />
            <input aria-label="Search project" placeholder="Search this project" />
            <kbd>⌘ K</kbd>
          </label>
          <ProjectHeaderActions
            projectId={project.id}
            projectName={project.name}
            modules={project.modules}
          />
        </header>

        <div className="content-grid">
          <div className="main-column">
            <section className="hero">
              <div>
                <h1>{project.name}</h1>
                <p>
                  {project.description ||
                    "The shared command center for the team's product, tasks, and live rooms."}
                </p>
              </div>
              <div className="project-progress">
                <TestStrip percentage={projectProgress} label="Overall progress" />
              </div>
            </section>

            <BurningDeadlines
              modules={project.modules}
              nowMs={demoNowMs}
              projectId={project.id}
            />

            <ModulesSection
              modules={project.modules}
              nowMs={demoNowMs}
              projectId={project.id}
            />

            <ProjectDangerZone projectId={project.id} projectName={project.name} />
          </div>

          <aside className="right-column" id="voice-lounges">
            <VoiceLounges rooms={voiceRooms} projectId={project.id} />
            <section className="side-card focus-card">
              <div className="section-heading section-heading--compact">
                <div>
                  <h2>Today&apos;s focus</h2>
                </div>
                <span className="focus-count">
                  {project.modules.reduce((sum, m) => sum + m.tasks.length, 0)}
                </span>
              </div>
              {project.modules.flatMap((m) => m.tasks).slice(0, 3).map((task) => (
                <label key={task.id}>
                  <input
                    type="checkbox"
                    defaultChecked={task.status === "DONE"}
                  />
                  <span>{task.title}</span>
                </label>
              ))}
              {project.modules.flatMap((m) => m.tasks).length === 0 && (
                <small className="focus-card__empty">No tasks in queue</small>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
