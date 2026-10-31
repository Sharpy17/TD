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
  const [project, dbVoiceRooms] = await Promise.all([
    getProjectById(projectId),
    getVoiceRooms(),
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
      <ProjectSidebar projectId={projectId} projectName={project.name} />
      <div className="workspace route-enter">
        <header className="topbar">
          <div>
            <span className="eyebrow">Active project</span>
            <strong>{project.name}</strong>
          </div>
          <label className="search">
            <span>⌕</span>
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
                <span className="eyebrow">Project pulse</span>
                <h1>{project.name}</h1>
                <p>
                  {project.description ||
                    "The shared command center for the team's product, tasks, and live rooms."}
                </p>
              </div>
              <div className="project-progress">
                <strong>{projectProgress}%</strong>
                <span>overall progress</span>
                <div>
                  <i style={{ width: `${projectProgress}%` }} />
                </div>
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
          </div>

          <aside className="right-column" id="voice-lounges">
            <VoiceLounges rooms={voiceRooms} projectId={project.id} />
            <section className="side-card focus-card">
              <div className="section-heading section-heading--compact">
                <div>
                  <span className="eyebrow">Personal queue</span>
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
                <small style={{ color: "var(--muted)" }}>No tasks in queue</small>
              )}
            </section>
            <section className="side-card dispatch-card">
              <span className="dispatch-card__icon">↗</span>
              <span className="eyebrow">Weekly velocity</span>
              <strong>Active tracking</strong>
              <p>Keep the loop tight. Ship early and often.</p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
