"use client";

import { useState } from "react";
import Link from "next/link";
import { DeleteProjectModal } from "@/components/projects/DeleteProjectModal";
import { AccountMenu, type SidebarAccount } from "./AccountMenu";

export function ProjectSidebar({
  projectId,
  projectName,
  active = "overview",
  account,
}: {
  projectId: string;
  projectName: string;
  active?: "overview" | "board" | "channels";
  account: SidebarAccount;
}) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const projectHref = `/projects/${projectId}`;

  return (
    <>
      <aside className="sidebar project-sidebar">
        <Link className="brand" href="/">
          <span>⚡</span>
          <strong>DaiHub</strong>
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
          <Link
            className={`nav-item ${active === "overview" ? "nav-item--active" : ""}`}
            href={projectHref}
            aria-current={active === "overview" ? "page" : undefined}
          >
            <span>⌂</span> Overview
          </Link>
          <Link className="nav-item" href={`${projectHref}#modules`}>
            <span>▦</span> Modules
          </Link>
          <Link
            className={`nav-item ${active === "board" ? "nav-item--active" : ""}`}
            href={`${projectHref}/board`}
            aria-current={active === "board" ? "page" : undefined}
          >
            <span>✓</span> Board
          </Link>
          <Link
            className={`nav-item ${active === "channels" ? "nav-item--active" : ""}`}
            href={`${projectHref}/channels`}
            aria-current={active === "channels" ? "page" : undefined}
          >
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

        <AccountMenu
          account={account}
          extraItems={
            <button
              type="button"
              className="account__item account__item--danger"
              role="menuitem"
              onClick={() => setDeleteModalOpen(true)}
            >
              <span aria-hidden="true">🗑</span> Delete project
            </button>
          }
        />
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
