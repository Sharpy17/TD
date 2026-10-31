"use client";

import { useState } from "react";
import type { Module } from "@/lib/domain/types";
import { ModuleCard } from "./ModuleCard";
import { CreateModuleModal } from "./CreateModuleModal";
import { CreateTaskModal } from "@/components/tasks/CreateTaskModal";
import { EditTaskModal } from "@/components/tasks/EditTaskModal";
import { DeleteTaskModal } from "@/components/tasks/DeleteTaskModal";
import type { Task } from "@/lib/domain/types";

interface ModulesSectionProps {
  modules: Module[];
  nowMs: number;
  projectId: string;
}

export function ModulesSection({ modules, nowMs, projectId }: ModulesSectionProps) {
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskModuleId, setTaskModuleId] = useState<string | undefined>(undefined);
  const [taskToDelete, setTaskToDelete] = useState<{ id: string; title: string } | null>(null);
  const [taskToEdit, setTaskToEdit] = useState<{ task: Task; moduleId: string } | null>(null);

  const handleOpenAddTask = (moduleId?: string) => {
    setTaskModuleId(moduleId);
    setIsTaskModalOpen(true);
  };

  return (
    <section id="modules" className="modules-section" aria-labelledby="modules-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Build map</span>
          <h2 id="modules-title">Active modules ({modules.length})</h2>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            type="button"
            className="secondary-button"
            style={{ height: 33, padding: "0 13px", fontSize: 12 }}
            onClick={() => handleOpenAddTask()}
            disabled={modules.length === 0}
          >
            + Add task
          </button>
          <button
            type="button"
            className="primary-button"
            style={{ height: 33, padding: "0 13px", fontSize: 12 }}
            onClick={() => setIsModuleModalOpen(true)}
          >
            + New module
          </button>
          <button className="text-button" type="button">
            View kanban →
          </button>
        </div>
      </div>

      {modules.length === 0 ? (
        <div className="empty-state" style={{ minHeight: 200 }}>
          <span>◆</span>
          <strong>No modules created yet</strong>
          <p>Decompose this project into logical modules to track progress and assign tasks.</p>
          <button
            className="primary-button"
            type="button"
            style={{ marginTop: 8 }}
            onClick={() => setIsModuleModalOpen(true)}
          >
            + Create first module
          </button>
        </div>
      ) : (
        <div className="module-grid">
          {modules.map((module) => (
            <ModuleCard
              module={module}
              nowMs={nowMs}
              projectId={projectId}
              key={module.id}
              onAddTask={handleOpenAddTask}
              onEditTask={(task, modId) => setTaskToEdit({ task, moduleId: modId })}
              onDeleteTask={(taskId, taskTitle) => setTaskToDelete({ id: taskId, title: taskTitle })}
            />
          ))}
        </div>
      )}

      <CreateModuleModal
        isOpen={isModuleModalOpen}
        onClose={() => setIsModuleModalOpen(false)}
        projectId={projectId}
      />

      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        projectId={projectId}
        modules={modules}
        defaultModuleId={taskModuleId}
      />

      <DeleteTaskModal
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        taskId={taskToDelete?.id || ""}
        taskTitle={taskToDelete?.title || ""}
        projectId={projectId}
      />

      {taskToEdit && (
        <EditTaskModal
          key={taskToEdit.task.id}
          isOpen={true}
          onClose={() => setTaskToEdit(null)}
          task={taskToEdit.task}
          currentModuleId={taskToEdit.moduleId}
          modules={modules}
          projectId={projectId}
        />
      )}
    </section>
  );
}
