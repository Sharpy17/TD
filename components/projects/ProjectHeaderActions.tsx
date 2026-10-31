"use client";

import { useState } from "react";
import { DeleteProjectModal } from "./DeleteProjectModal";
import { CreateTaskModal } from "@/components/tasks/CreateTaskModal";

export function ProjectHeaderActions({
  projectId,
  projectName,
  modules = [],
}: {
  projectId: string;
  projectName: string;
  modules?: Array<{ id: string; name: string; icon?: string }>;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  return (
    <>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button
          type="button"
          className="secondary-button secondary-button--danger"
          onClick={() => setDeleteOpen(true)}
          title="Delete this project"
        >
          🗑 Delete project
        </button>
        <button
          className="primary-button"
          type="button"
          onClick={() => setTaskModalOpen(true)}
        >
          + New task
        </button>
      </div>

      <DeleteProjectModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        projectId={projectId}
        projectName={projectName}
      />

      <CreateTaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        projectId={projectId}
        modules={modules}
      />
    </>
  );
}
