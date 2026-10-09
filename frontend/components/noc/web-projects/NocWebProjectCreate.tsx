"use client";

import { FormEvent, useState } from "react";
import { createNocWebProject } from "@/lib/nocApi";
import { webProjectErrorMessage } from "@/lib/webProjects/errors";
import type { WebProjectType } from "@/lib/webProjects/types";

export function NocWebProjectCreate({
  organizationId,
  onCreated,
  onCancel
}: {
  organizationId: number;
  onCreated: (id: number) => void;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [projectType, setProjectType] = useState<WebProjectType>("create");
  const [websiteHostname, setWebsiteHostname] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const project = await createNocWebProject(organizationId, {
        title: title.trim(),
        projectType,
        websiteHostname: websiteHostname.trim() || null
      });
      onCreated(project.id);
    } catch (err) {
      setError(webProjectErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="noc-panel" onSubmit={onSubmit}>
      <div className="noc-panel__head">Crear expediente</div>
      <div className="noc-panel__body noc-form">
        <p className="noc-disclaimer">
          El staff crea el expediente en INTAKE para organization_id={organizationId}. El cliente no
          elige la fase.
        </p>
        <label>
          Título
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={180}
          />
        </label>
        <fieldset>
          <legend>Tipo</legend>
          <label>
            <input
              type="radio"
              name="projectType"
              value="create"
              checked={projectType === "create"}
              onChange={() => setProjectType("create")}
            />{" "}
            Crear
          </label>
          <label>
            <input
              type="radio"
              name="projectType"
              value="improve"
              checked={projectType === "improve"}
              onChange={() => setProjectType("improve")}
            />{" "}
            Mejorar
          </label>
        </fieldset>
        <label>
          Hostname (opcional)
          <input
            value={websiteHostname}
            onChange={(e) => setWebsiteHostname(e.target.value)}
            placeholder="www.ejemplo.com"
          />
        </label>
        {error ? (
          <p className="noc-disclaimer" role="alert">
            {error}
          </p>
        ) : null}
        <div className="noc-actions">
          <button type="submit" className="noc-btn noc-btn--primary" disabled={saving}>
            {saving ? "Creando…" : "Crear expediente"}
          </button>
          {onCancel ? (
            <button type="button" className="noc-btn" onClick={onCancel}>
              Cancelar
            </button>
          ) : null}
        </div>
      </div>
    </form>
  );
}
