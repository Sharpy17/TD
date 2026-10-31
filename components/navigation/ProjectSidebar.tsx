"use client";

import { useState } from "react";
import Link from "next/link";
import { DeleteProjectModal } from "@/components/projects/DeleteProjectModal";

export function ProjectSidebar({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const projectHref = `/projects/${projectId}`;

  return (
    <>
      <aside className="sidebar project-sidebar">
        <Link className="brand" href="/">
          <span>⚡</span>
          <strong>Toguz</strong>
        </Link>

        <Link className="back-link" href="/projects">
          ← All projects
        </Link>
        <div className="project-identity">
          <span className="project-identity__mark">
            {projectName.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <strong>{projectName}</strong>
            <small>Product workspace</small>
          </div>
        </div>

        <div className="sidebar-label">Project</div>
        <nav aria-label="Project navigation">
          <Link className="nav-item nav-item--active" href={projectHref}>
            <span>⌂</span> Overview
          </Link>
          <Link className="nav-item" href={`${projectHref}#modules`}>
            <span>▦</span> Modules
          </Link>
          <span className="nav-item nav-item--disabled" aria-disabled="true">
            <span>✓</span> Kanban <small>Soon</small>
          </span>
          <Link className="nav-item" href={`${projectHref}#voice-lounges`}>
            <span>#</span> Channels
          </Link>
        </nav>

        <div className="sidebar-label" style={{ marginTop: 20 }}>Manage</div>
        <button
          type="button"
          className="nav-item"
          onClick={() => setDeleteModalOpen(true)}
          style={{
            border: 0,
            background: "transparent",
            color: "#ff708f",
            width: "100%",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          <span>🗑</span> Delete project
        </button>

        <div className="sidebar__bottom" style={{ position: "relative" }}>
          <span className="avatar">DA</span>
          <div>
            <strong>Dastan</strong>
            <small>Project owner</small>
          </div>
          <button
            type="button"
            aria-label="Open project settings"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ cursor: "pointer", padding: "4px 8px" }}
          >
            ···
          </button>

          {menuOpen && (
            <div
              style={{
                position: "absolute",
                bottom: "100%",
                left: 10,
                right: 10,
                marginBottom: 8,
                padding: "6px",
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                zIndex: 50,
              }}
            >
              <button
                type="button"
                className="nav-item"
                onClick={() => {
                  setMenuOpen(false);
                  setDeleteModalOpen(true);
                }}
                style={{
                  minHeight: 32,
                  fontSize: 12,
                  width: "100%",
                  textAlign: "left",
                  border: 0,
                  background: "transparent",
                  color: "#ff708f",
                  cursor: "pointer",
                  padding: "0 8px",
                }}
              >
                <span>🗑</span> Delete project
              </button>
            </div>
          )}
        </div>
      </aside>

      <DeleteProjectModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        projectId={projectId}
        projectName={projectName}
      />
    </>
  );
}
