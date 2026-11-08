"use client";

import { useState } from "react";
import type { Module } from "@/lib/domain/types";
import { ModuleCard } from "./ModuleCard";
import { CreateModuleModal } from "./CreateModuleModal";
import { RenameModuleModal } from "./RenameModuleModal";
import { DeleteModuleModal } from "./DeleteModuleModal";
import { CreateTaskModal } from "@/components/tasks/CreateTaskModal";
import { EditTaskModal } from "@/components/tasks/EditTaskModal";
import { DeleteTaskModal } from "@/components/tasks/DeleteTaskModal";
import type { Task } from "@/lib/domain/types";
import { Icon } from "@/components/ui/Icon";

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
  const [moduleToRename, setModuleToRename] = useState<Module | null>(null);
  const [moduleToDelete, setModuleToDelete] = useState<Module | null>(null);

  const handleOpenAddTask = (moduleId?: string) => {
    setTaskModuleId(moduleId);
    setIsTaskModalOpen(true);
  };

  return (
    <section id="modules" className="modules-section" aria-labelledby="modules-title">
      <div className="section-heading">
        <div>
          <h2 id="modules-title">Active modules ({modules.length})</h2>
        </div>
        <div className="section-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => handleOpenAddTask()}
            disabled={modules.length === 0}
          >
            + Add task
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setIsModuleModalOpen(true)}
          >
            + New module
          </button>
          <button className="text-button" type="button">
            View kanban <Icon name="arrowRight" size={14} />
          </button>
        </div>
      </div>

      {modules.length === 0 ? (
        <div className="empty-state empty-state--compact">
          <Icon name="projects" size={22} />
          <strong>No modules created yet</strong>
          <p>Split this project into modules to track progress and assign tasks.</p>
          <button
            className="primary-button"
            type="button"
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
              onRenameModule={setModuleToRename}
              onDeleteModule={setModuleToDelete}
            />
          ))}
        </div>
      )}

      {moduleToRename && (
        <RenameModuleModal
          key={moduleToRename.id}
          onClose={() => setModuleToRename(null)}
          moduleId={moduleToRename.id}
          moduleName={moduleToRename.name}
          projectId={projectId}
        />
      )}

      {moduleToDelete && (
        <DeleteModuleModal
          key={moduleToDelete.id}
          onClose={() => setModuleToDelete(null)}
          moduleId={moduleToDelete.id}
          moduleName={moduleToDelete.name}
          taskCount={moduleToDelete.tasks.length}
          projectId={projectId}
        />
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
