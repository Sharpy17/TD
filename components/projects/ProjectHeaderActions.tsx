"use client";

import { useState } from "react";
import { CreateTaskModal } from "@/components/tasks/CreateTaskModal";
import { Icon } from "@/components/ui/Icon";

export function ProjectHeaderActions({
  projectId,
  modules = [],
}: {
  projectId: string;
  projectName: string;
  modules?: Array<{ id: string; name: string; icon?: string }>;
}) {
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  return (
    <>
      <div className="topbar-actions">
        <button
          className="primary-button"
          type="button"
          onClick={() => setTaskModalOpen(true)}
        >
          <Icon name="plus" size={15} /> New task
        </button>
      </div>

      <CreateTaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        projectId={projectId}
        modules={modules}
      />
    </>
  );
}
