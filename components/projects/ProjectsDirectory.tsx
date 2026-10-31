"use client";

import { useState } from "react";
import type { Project } from "@/lib/domain/types";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { CreateProjectModal } from "./CreateProjectModal";
import { DeleteProjectModal } from "./DeleteProjectModal";

interface ProjectsDirectoryProps {
  initialProjects: Array<{ project: Project; slug: string }>;
}

export function ProjectsDirectory({ initialProjects }: ProjectsDirectoryProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProjects = initialProjects.filter(({ project }) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      project.name.toLowerCase().includes(q) ||
      (project.description && project.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="route-enter">
      <header className="main-topbar">
        <div>
          <span className="eyebrow">Workspace</span>
          <strong>Projects</strong>
        </div>
        <label className="search">
          <span>⌕</span>
          <input
            aria-label="Search projects"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <kbd>⌘ K</kbd>
        </label>
        <button
          className="primary-button"
          type="button"
          onClick={() => setIsModalOpen(true)}
        >
          + New project
        </button>
      </header>

      <div className="main-content">
        <section className="page-heading">
          <span className="eyebrow">Project directory</span>
          <h1>Choose where to work.</h1>
          <p>Each project has its own modules, tasks, channels, and voice rooms.</p>
        </section>

        {filteredProjects.length === 0 ? (
          <div className="empty-state">
            <span>▦</span>
            <strong>No matching projects found</strong>
            <p>
              {searchQuery
                ? `No projects matched "${searchQuery}".`
                : "No projects in this workspace yet."}
            </p>
            <button
              className="primary-button"
              type="button"
              style={{ marginTop: 12 }}
              onClick={() => setIsModalOpen(true)}
            >
              + Create your first project
            </button>
          </div>
        ) : (
          <section className="projects-grid" aria-label="Projects">
            {filteredProjects.map(({ project, slug }) => (
              <ProjectCard
                project={project}
                slug={slug}
                key={slug}
                onDelete={(id, name) => setProjectToDelete({ id, name })}
              />
            ))}
          </section>
        )}
      </div>

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <DeleteProjectModal
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        projectId={projectToDelete?.id || ""}
        projectName={projectToDelete?.name || ""}
      />
    </div>
  );
}
