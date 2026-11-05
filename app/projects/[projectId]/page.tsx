import { notFound } from "next/navigation";
import { BurningDeadlines } from "@/components/dashboard/BurningDeadlines";
import { VoiceLounges } from "@/components/dashboard/VoiceLounges";
import { ProjectSidebar } from "@/components/navigation/ProjectSidebar";
import { ModulesSection } from "@/components/modules/ModulesSection";
import { ProjectHeaderActions } from "@/components/projects/ProjectHeaderActions";
import { demoProjectSlug } from "@/lib/data/demo";
import { calculateProgress, calculateProjectProgress } from "@/lib/domain/progress";
import { getProjectById } from "@/lib/projects/service";
import { getVoiceRooms } from "@/lib/voice/service";
import { getSidebarAccount } from "@/lib/auth/account";
import { Icon } from "@/components/ui/Icon";
import { Ripeness } from "@/components/ui/Ripeness";
import { ProjectDangerZone } from "@/components/projects/ProjectDangerZone";

export const dynamicParams = true;

function requestTimeMs(): number {
  return Date.now();
}

export function generateStaticParams() {
  return [{ projectId: demoProjectSlug }];
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const [project, voiceRooms, account] = await Promise.all([
    getProjectById(projectId),
    getVoiceRooms(),
    getSidebarAccount(),
  ]);

  if (!project) notFound();

  const projectProgress = calculateProjectProgress(project);
  const nowMs = requestTimeMs();

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
                    "Modules, tasks, channels and voice rooms for this project."}
                </p>
              </div>
              <div className="project-progress">
                <Ripeness
                  values={project.modules.map((module) => calculateProgress(module.tasks))}
                  percentage={projectProgress}
                  label="Overall progress"
                />
              </div>
            </section>

            <ModulesSection
              modules={project.modules}
              nowMs={nowMs}
              projectId={project.id}
            />

            <BurningDeadlines
              modules={project.modules}
              nowMs={nowMs}
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
