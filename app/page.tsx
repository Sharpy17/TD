import { BurningDeadlines } from "@/components/dashboard/BurningDeadlines";
import { VoiceLounges } from "@/components/dashboard/VoiceLounges";
import { ModuleCard } from "@/components/modules/ModuleCard";
import { demoNowMs, demoProject, demoVoiceRooms } from "@/lib/data/demo";
import { calculateProjectProgress } from "@/lib/domain/progress";

export default function DashboardPage() {
  const projectProgress = calculateProjectProgress(demoProject);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#"><span>⚡</span><strong>Toguz</strong></a>
        <nav aria-label="Primary navigation">
          <a className="nav-item nav-item--active" href="#"><span>⌂</span> Overview</a>
          <a className="nav-item" href="#modules"><span>▦</span> Modules</a>
          <a className="nav-item" href="#"><span>✓</span> Kanban</a>
          <a className="nav-item" href="#"><span>#</span> Channels</a>
        </nav>
        <div className="sidebar__bottom">
          <span className="avatar">DA</span><div><strong>Dastan</strong><small>Founder workspace</small></div><button type="button" aria-label="Open settings">···</button>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div><span className="eyebrow">Active project</span><strong>{demoProject.name}</strong></div>
          <label className="search"><span>⌕</span><input aria-label="Search" placeholder="Search anything" /><kbd>⌘ K</kbd></label>
          <button className="primary-button" type="button">+ New task</button>
        </header>

        <div className="content-grid">
          <div className="main-column">
            <section className="hero">
              <div><span className="eyebrow">Project pulse</span><h1>Good evening, team.</h1><p>The core is moving. Two deadlines need attention before the next push.</p></div>
              <div className="project-progress"><strong>{projectProgress}%</strong><span>overall progress</span><div><i style={{ width: `${projectProgress}%` }} /></div></div>
            </section>
            <BurningDeadlines modules={demoProject.modules} nowMs={demoNowMs} />
            <section id="modules" className="modules-section" aria-labelledby="modules-title">
              <div className="section-heading"><div><span className="eyebrow">Build map</span><h2 id="modules-title">Active modules</h2></div><button className="text-button" type="button">View kanban →</button></div>
              <div className="module-grid">{demoProject.modules.map((module) => <ModuleCard module={module} nowMs={demoNowMs} key={module.id} />)}</div>
            </section>
          </div>
          <aside className="right-column">
            <VoiceLounges rooms={demoVoiceRooms} />
            <section className="side-card focus-card">
              <div className="section-heading section-heading--compact"><div><span className="eyebrow">Personal queue</span><h2>Today&apos;s focus</h2></div><span className="focus-count">3</span></div>
              <label><input type="checkbox" defaultChecked /><span>Map the core domain</span></label>
              <label><input type="checkbox" /><span>Review deadline states</span></label>
              <label><input type="checkbox" /><span>Prototype Kanban movement</span></label>
            </section>
            <section className="side-card dispatch-card"><span className="dispatch-card__icon">↗</span><span className="eyebrow">Weekly velocity</span><strong>18 tasks shipped</strong><p>Up 24% from last week. Keep the loop tight.</p></section>
          </aside>
        </div>
      </div>
    </main>
  );
}
