"use client";

import { useMemo, useState } from "react";
import { saveWebProjectForm } from "@/lib/clientApi";
import { webProjectErrorMessage } from "@/lib/webProjects/errors";
import { reviewStateForField, visibleFormFields } from "@/lib/webProjects/viewModel";
import type { WebProject, WebProjectFormDefinition } from "@/lib/webProjects/types";
import { WebProjectField } from "./WebProjectField";

export function WebProjectForm({
  project,
  formDefinition,
  readOnly,
  onUpdated
}: {
  project: WebProject;
  formDefinition?: WebProjectFormDefinition | null;
  readOnly: boolean;
  onUpdated: (project: WebProject) => void;
}) {
  const fields = useMemo(
    () => visibleFormFields(formDefinition, project.form?.responses, { projectType: project.projectType }),
    [formDefinition, project.form?.responses, project.projectType]
  );
  const [saveState, setSaveState] = useState<Record<string, "idle" | "saving" | "saved" | "error">>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSave(fieldKey: string, value: string | string[]) {
    setSaveState((prev) => ({ ...prev, [fieldKey]: "saving" }));
    setErrors((prev) => ({ ...prev, [fieldKey]: "" }));
    try {
      const updated = await saveWebProjectForm(project.id, [{ fieldKey, value }]);
      onUpdated(updated);
      setSaveState((prev) => ({ ...prev, [fieldKey]: "saved" }));
    } catch (err) {
      setSaveState((prev) => ({ ...prev, [fieldKey]: "error" }));
      setErrors((prev) => ({ ...prev, [fieldKey]: webProjectErrorMessage(err) }));
    }
  }

  return (
    <section className="cp-card" aria-labelledby="wp-form-heading">
      <h2 id="wp-form-heading" className="wp-section-title">
        Información
      </h2>
      <p className="cp-disclaimer">
        Responde con calma. Cada pregunta se guarda cuando pulses Guardar. No incluyas contraseñas.
      </p>
      {fields.length === 0 ? (
        <p className="cp-disclaimer">No hay preguntas aplicables en este momento.</p>
      ) : (
        <div className="wp-form-stack">
          {fields.map((entry) => (
            <WebProjectField
              key={entry.field.key}
              field={entry.field}
              value={entry.value}
              readOnly={readOnly}
              saveState={saveState[entry.field.key] || "idle"}
              error={errors[entry.field.key]}
              review={reviewStateForField(project, entry.field.key)}
              onSave={(next) => void onSave(entry.field.key, next)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
