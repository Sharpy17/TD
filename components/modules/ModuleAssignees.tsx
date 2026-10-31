"use client";

import { useState, useTransition } from "react";
import type { UserSummary } from "@/lib/domain/types";
import { saveModuleAssignees } from "@/app/projects/[projectId]/modules/[moduleId]/actions";

export function ModuleAssignees({ moduleId, assignees, people, canEdit }: {
  moduleId: string; assignees: UserSummary[]; people: UserSummary[]; canEdit: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function save() {
    setError("");
    startTransition(async () => {
      try {
        const result = await saveModuleAssignees(moduleId, selected);
        if (result.success) setEditing(false);
        else setError(result.error || "Could not save assignees.");
      } catch {
        setError("Could not save assignees. Please try again.");
      }
    });
  }

  return (
    <section className="module-people" aria-labelledby="module-people-title">
      <div className="section-heading">
        <div>
          <h2 id="module-people-title">Assigned to</h2>
          <p>No people selected means everyone in the workspace.</p>
        </div>
        {canEdit && !editing && <button type="button" className="secondary-button" onClick={() => {
          setSelected(assignees.map((person) => person.id));
          setError("");
          setEditing(true);
        }}>Manage people</button>}
      </div>
      {!editing ? (
        <div className="module-person-chips">
          {assignees.length ? assignees.map((person) => (
            <span key={person.id} className="module-person-chip"><span className="avatar">{person.initials}</span>{person.name}</span>
          )) : <span className="module-person-chip">◎ Everyone</span>}
        </div>
      ) : (
        <div>
          <fieldset className="module-person-picker" disabled={pending}>
            <legend>Select people</legend>
            {people.map((person) => (
              <label key={person.id} className="module-person-chip">
                <input type="checkbox" checked={selected.includes(person.id)} onChange={(event) => {
                  setSelected(event.target.checked ? [...selected, person.id] : selected.filter((id) => id !== person.id));
                }} />
                {person.name}
              </label>
            ))}
            {!people.length && <p>No workspace members available yet.</p>}
          </fieldset>
          <div className="module-inline-actions">
            <button className="text-button" disabled={pending} onClick={() => setSelected([])} type="button">Clear selection · Everyone</button>
            <button className="secondary-button" disabled={pending} onClick={() => setEditing(false)} type="button">Cancel</button>
            <button className="primary-button" disabled={pending} onClick={save} type="button">{pending ? "Saving…" : "Save people"}</button>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
        </div>
      )}
    </section>
  );
}
