"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { DeleteProjectModal } from "./DeleteProjectModal";

/** Deleting a project lives at the end of the overview, away from everyday actions. */
export function ProjectDangerZone({ projectId, projectName }: { projectId: string; projectName: string }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="danger-zone" aria-label="Delete project">
      <div>
        <strong>Delete this project</strong>
        <p>Removes its modules, tasks and channels for everyone.</p>
      </div>
      <button type="button" className="danger-outline" onClick={() => setOpen(true)}>
        <Icon name="trash" size={15} /> Delete project
      </button>
      <DeleteProjectModal isOpen={open} onClose={() => setOpen(false)} projectId={projectId} projectName={projectName} />
    </section>
  );
}
