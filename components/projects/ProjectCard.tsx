"use client";

import Link from "next/link";
import type { Project } from "@/lib/domain/types";
import { calculateProgress, calculateProjectProgress } from "@/lib/domain/progress";
import { modulePrefix } from "@/lib/domain/taskCodes";
import { Icon } from "@/components/ui/Icon";
import { TestStrip } from "@/components/ui/TestStrip";

const LEAD_MODULES = 4;

/** A project as one print on the contact sheet; the lead variant also lists its modules. */
export function ProjectCard({
  project,
  slug,
  lead = false,
  onDelete,
}: {
  project: Project;
  slug: string;
  lead?: boolean;
  onDelete?: (id: string, name: string) => void;
}) {
  const progress = calculateProjectProgress(project);
  const taskCount = project.modules.reduce((total, module) => total + module.tasks.length, 0);
  const people = Array.from(
    new Map(
      project.modules.flatMap((module) => [module.lead, ...(module.assignees ?? [])]).map((person) => [person.id, person]),
    ).values(),
  );
  // Modules with work in flight first, so the lead frame shows what is developing.
  const modules = [...project.modules]
    .map((module) => ({ module, progress: calculateProgress(module.tasks) }))
    .sort((a, b) => Number(b.module.tasks.length > 0) - Number(a.module.tasks.length > 0) || b.progress - a.progress);

  return (
    <Link className={`project-card ${lead ? "project-card--lead" : ""}`} href={`/projects/${slug}`}>
      <div className="project-card__edge">
        <span>{modulePrefix(project.name)}</span>
        <span>
          {project.modules.length} {project.modules.length === 1 ? "module" : "modules"} · {taskCount}{" "}
          {taskCount === 1 ? "task" : "tasks"}
        </span>
      </div>
      <div className="project-card__body">
        <div>
          <h3>{project.name}</h3>
          <p>{project.description || "Modules, tasks, channels and voice rooms for this project."}</p>
          <div className="project-card__strip">
            <TestStrip percentage={progress} size={lead ? "lg" : "md"} />
          </div>
          <div className="project-card__meta">
            {people.length > 0 && (
              <span className="avatar-stack" aria-label={`${people.length} people`}>
                {people.slice(0, 4).map((person) => (
                  <span className="avatar avatar--small" key={person.id} title={person.name}>
                    {person.initials}
                  </span>
                ))}
              </span>
            )}
            {people.length > 0 && <span>{people.map((person) => person.name).slice(0, 3).join(", ")}</span>}
            <span className="project-card__open">
              Open <Icon name="arrowRight" size={14} />
            </span>
          </div>
        </div>
        {lead && modules.length > 0 && (
          <ul className="project-card__modules" aria-label="Modules">
            {modules.slice(0, LEAD_MODULES).map(({ module, progress: moduleProgress }) => (
              <li className="project-card__module" key={module.id}>
                <span>{module.name}</span>
                <TestStrip percentage={moduleProgress} size="sm" label={false} />
                <em>{moduleProgress}%</em>
              </li>
            ))}
            {modules.length > LEAD_MODULES && (
              <li className="project-card__module project-card__module--more">+ {modules.length - LEAD_MODULES} more modules</li>
            )}
          </ul>
        )}
      </div>
      {onDelete && (
        <button
          type="button"
          className="project-card__delete-btn"
          title="Delete project"
          aria-label={`Delete ${project.name}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(project.id, project.name);
          }}
        >
          <Icon name="trash" size={15} />
        </button>
      )}
    </Link>
  );
}
