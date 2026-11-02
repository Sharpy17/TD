"use client";

import { useState } from "react";
import Link from "next/link";
import { DeleteProjectModal } from "@/components/projects/DeleteProjectModal";
import { AccountMenu, type SidebarAccount } from "./AccountMenu";
import { Icon } from "@/components/ui/Icon";

export function ProjectSidebar({
  projectId,
  projectName,
  active = "overview",
  account,
}: {
  projectId: string;
  projectName: string;
  active?: "overview" | "modules" | "board" | "channels";
  account: SidebarAccount;
}) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const projectHref = `/projects/${projectId}`;

  return (
    <>
      <aside className="sidebar project-sidebar">
        <Link className="brand" href="/">
          <span className="brand__lamp" aria-hidden="true" />
          <strong>DaiHub</strong>
        </Link>

        <Link className="back-link" href="/projects">
          <Icon name="arrowLeft" size={14} /> <span>All projects</span>
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
            <Icon name="home" /> <span className="nav-item__label">Overview</span>
          </Link>
          <Link
            className={`nav-item ${active === "modules" ? "nav-item--active" : ""}`}
            href={`${projectHref}#modules`}
            aria-current={active === "modules" ? "page" : undefined}
          >
            <Icon name="projects" /> <span className="nav-item__label">Modules</span>
          </Link>
          <Link
            className={`nav-item ${active === "board" ? "nav-item--active" : ""}`}
            href={`${projectHref}/board`}
            aria-current={active === "board" ? "page" : undefined}
          >
            <Icon name="board" /> <span className="nav-item__label">Board</span>
          </Link>
          <Link
            className={`nav-item ${active === "channels" ? "nav-item--active" : ""}`}
            href={`${projectHref}/channels`}
            aria-current={active === "channels" ? "page" : undefined}
          >
            <Icon name="hash" /> <span className="nav-item__label">Channels</span>
          </Link>
        </nav>

        <AccountMenu
          account={account}
          extraItems={
            <button
              type="button"
              className="account__item account__item--danger"
              role="menuitem"
              onClick={() => setDeleteModalOpen(true)}
            >
              <Icon name="trash" size={15} /> Delete project
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
