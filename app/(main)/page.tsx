import Link from "next/link";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { getProjects } from "@/lib/projects/service";
import { getSidebarAccount } from "@/lib/auth/account";

export default async function HomePage() {
  const [projects, account] = await Promise.all([getProjects(), getSidebarAccount()]);
  const featured = projects[0];

  return (
    <div className="route-enter">
      <header className="main-topbar">
        <div>
          <span className="eyebrow">DaiHub workspace</span>
          <strong>Home</strong>
        </div>
        <label className="search">
          <span>⌕</span>
          <input aria-label="Search workspace" placeholder="Search your workspace" />
          <kbd>⌘ K</kbd>
        </label>
        <button className="secondary-button" type="button">
          Invite people
        </button>
      </header>

      <div className="main-content">
        <section className="main-hero">
          <div>
            <span className="eyebrow">Workspace pulse</span>
            <h1>{account ? `Welcome back, ${account.name.split(" ")[0]}.` : "Welcome to DaiHub."}</h1>
            <p>Pick up where you left off, or jump into a conversation with your team.</p>
          </div>
          <Link className="primary-button button-link" href="/projects">
            View all projects
          </Link>
        </section>

        <div className="home-grid">
          <section className="home-section" aria-labelledby="recent-projects-title">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Continue working</span>
                <h2 id="recent-projects-title">Recent projects</h2>
              </div>
              <Link className="text-link" href="/projects">
                All projects ({projects.length}) →
              </Link>
            </div>
            {featured && (
              <ProjectCard project={featured.project} slug={featured.slug} />
            )}
          </section>

          <aside className="home-side-card">
            <div>
              <span className="eyebrow">Today</span>
              <h2>Your workspace</h2>
            </div>
            <div className="workspace-stat">
              <strong>2</strong>
              <span>deadlines need attention</span>
            </div>
            <div className="workspace-stat">
              <strong>3</strong>
              <span>teammates are active</span>
            </div>
            <div className="workspace-stat">
              <strong>{projects.length}</strong>
              <span>projects active</span>
            </div>
            <Link className="quiet-link" href="/chats">
              Open team chats →
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
