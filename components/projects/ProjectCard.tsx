"use client";

import Link from "next/link";
import type { Project } from "@/lib/domain/types";
import { calculateProjectProgress } from "@/lib/domain/progress";

export function ProjectCard({
  project,
  slug,
  onDelete,
}: {
  project: Project;
  slug: string;
  onDelete?: (id: string, name: string) => void;
}) {
  const progress = calculateProjectProgress(project);
  const taskCount = project.modules.reduce((total, module) => total + module.tasks.length, 0);

  return (
    <Link className="project-card" href={`/projects/${slug}`}>
      <div className="project-card__top">
        <span className="project-card__mark">{project.name.slice(0, 2).toUpperCase()}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="project-card__status">
            <i /> Active
          </span>
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
              🗑
            </button>
          )}
        </div>
      </div>
      <div>
        <span className="eyebrow">Product development</span>
        <h3>{project.name}</h3>
        <p>
          {project.description ||
            "The shared command center for the team's product, tasks, conversations, and live rooms."}
        </p>
      </div>
      <div className="project-card__progress">
        <div>
          <span>Progress</span>
          <strong>{progress}%</strong>
        </div>
        <div className="project-card__track">
          <i style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="project-card__footer">
        <span>{project.modules.length} modules</span>
        <span>{taskCount} tasks</span>
        <span className="avatar-stack" aria-label="Project members">
          <span className="avatar avatar--small">DA</span>
          <span className="avatar avatar--small">AL</span>
          <span className="avatar avatar--small">MK</span>
        </span>
        <strong>Open project →</strong>
      </div>
    </Link>
  );
}
