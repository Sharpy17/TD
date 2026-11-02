import Link from "next/link";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { HomeRooms } from "@/components/dashboard/HomeRooms";
import { Icon } from "@/components/ui/Icon";
import { getProjects } from "@/lib/projects/service";
import { getSidebarAccount } from "@/lib/auth/account";
import { getVoiceRooms } from "@/lib/voice/service";
import { formatDeadline, getDeadlineStatus, isUrgentTask } from "@/lib/domain/deadlines";

const ATTENTION_LIMIT = 5;

function requestTimeMs(): number {
  return Date.now();
}

export default async function HomePage() {
  const [projects, account, rooms] = await Promise.all([getProjects(), getSidebarAccount(), getVoiceRooms()]);
  // The busiest project leads the sheet; the rest keep their order.
  const taskTotal = (entry: (typeof projects)[number]) =>
    entry.project.modules.reduce((total, module) => total + module.tasks.length, 0);
  const featured = projects.reduce<(typeof projects)[number] | undefined>(
    (best, entry) => (!best || taskTotal(entry) > taskTotal(best) ? entry : best),
    undefined,
  );
  const rest = projects.filter((entry) => entry !== featured);
  const nowMs = requestTimeMs();

  const attention = projects
    .flatMap(({ project, slug }) =>
      project.modules.flatMap((module) =>
        module.tasks
          .filter((task) => isUrgentTask(task, nowMs))
          .map((task) => ({ task, module, slug, projectName: project.name })),
      ),
    )
    .sort((a, b) => Date.parse(a.task.dueAt ?? "") - Date.parse(b.task.dueAt ?? ""));

  const firstName = account?.name.split(" ")[0];

  return (
    <div className="route-enter">
      <header className="main-topbar">
        <div>
          <strong>Home</strong>
        </div>
        <label className="search">
          <Icon name="search" />
          <input aria-label="Search workspace" placeholder="Search projects, tasks, people" />
          <kbd>⌘K</kbd>
        </label>
        <div className="topbar-actions">
          <button className="secondary-button" type="button">
            <Icon name="users" size={15} /> Invite
          </button>
          <Link className="primary-button button-link" href="/projects">
            All projects
          </Link>
        </div>
      </header>

      <div className="main-content">
        <section className="main-hero">
          <div>
            <h1>{firstName ? `Welcome back, ${firstName}.` : "Welcome to DaiHub."}</h1>
            <p>
              {attention.length > 0 ? (
                <>
                  <b>
                    {attention.length} {attention.length === 1 ? "task needs" : "tasks need"} attention
                  </b>{" "}
                  ·{" "}
                </>
              ) : null}
              {projects.length} {projects.length === 1 ? "project" : "projects"} in development
            </p>
          </div>
        </section>

        <div className="home-grid">
          <section className="home-frames" aria-label="Projects">
            {featured ? (
              <ProjectCard project={featured.project} slug={featured.slug} lead />
            ) : (
              <div className="empty-state">
                <span>
                  <Icon name="projects" size={22} />
                </span>
                <strong>Nothing in the tray yet</strong>
                <p>Create a project to start tracking modules, tasks and progress.</p>
                <Link className="primary-button button-link" href="/projects">
                  Create a project
                </Link>
              </div>
            )}
            {rest.length > 0 && (
              <div className="home-frames__rest">
                {rest.slice(0, 4).map(({ project, slug }) => (
                  <ProjectCard project={project} slug={slug} key={project.id} />
                ))}
              </div>
            )}
            {rest.length > 4 && (
              <Link className="text-link" href="/projects">
                See all {projects.length} projects <Icon name="arrowRight" size={14} />
              </Link>
            )}
          </section>

          <aside className="home-column">
            <div className="column-block">
              <h2>Voice rooms</h2>
              <HomeRooms rooms={rooms} />
            </div>
            <div className="column-block">
              <h2>
                Needs attention
                <Link className="text-link" href="/chats">
                  Team chats
                </Link>
              </h2>
              {attention.length === 0 ? (
                <p className="attention-list attention-empty">Nothing is due in the next 24 hours.</p>
              ) : (
                <ul className="attention-list">
                  {attention.slice(0, ATTENTION_LIMIT).map(({ task, module, slug, projectName }) => {
                    const overdue = getDeadlineStatus(task.dueAt, nowMs, task.status) === "overdue";
                    return (
                      <li key={task.id}>
                        <Link
                          className={`attention-item ${overdue ? "attention-item--overdue" : ""}`}
                          href={`/projects/${slug}/board`}
                        >
                          <span>{task.title}</span>
                          <time dateTime={task.dueAt ?? undefined}>{formatDeadline(task.dueAt, nowMs)}</time>
                          <small>
                            {projectName} · {module.name}
                          </small>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
