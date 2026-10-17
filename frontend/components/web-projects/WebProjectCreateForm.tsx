"use client";

import { FormEvent, useState } from "react";
import { createWebProject } from "@/lib/clientApi";
import { webProjectErrorMessage } from "@/lib/webProjects/errors";

export function WebProjectCreateForm({
  onCreated,
  onCancel
}: {
  onCreated: (id: number) => void;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [projectType, setProjectType] = useState<"create" | "improve">("create");
  const [websiteHostname, setWebsiteHostname] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const result = await createWebProject({
        title: title.trim(),
        projectType,
        websiteHostname: websiteHostname.trim() || null
      });
      onCreated(result.project.id);
    } catch (err) {
      setError(webProjectErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="cp-card cp-form" onSubmit={onSubmit}>
      <h2 className="wp-section-title">Iniciar proyecto web</h2>
      <p className="cp-disclaimer">
        Enviaremos una solicitud de recopilación. ARGOS revisará el expediente; esto no significa que el
        proyecto esté aceptado.
      </p>
      <label>
        Título
        <input
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={180}
          placeholder="Por ejemplo: Renovación de la web corporativa"
        />
      </label>
      <fieldset className="wp-fieldset">
        <legend>¿Qué necesitas?</legend>
        <label className="wp-radio">
          <input
            type="radio"
            name="projectType"
            value="create"
            checked={projectType === "create"}
            onChange={() => setProjectType("create")}
          />
          Crear una web nueva
        </label>
        <label className="wp-radio">
          <input
            type="radio"
            name="projectType"
            value="improve"
            checked={projectType === "improve"}
            onChange={() => setProjectType("improve")}
          />
          Mejorar una web existente
        </label>
      </fieldset>
      <label>
        Dominio (opcional)
        <input
          name="websiteHostname"
          value={websiteHostname}
          onChange={(e) => setWebsiteHostname(e.target.value)}
          placeholder="www.ejemplo.com"
          autoComplete="off"
        />
      </label>
      {error ? (
        <p className="wp-field-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="wp-actions">
        <button type="submit" className="cp-btn cp-btn--primary" disabled={saving}>
          {saving ? "Enviando solicitud…" : "Enviar solicitud"}
        </button>
        {onCancel ? (
          <button type="button" className="cp-btn cp-btn--secondary" onClick={onCancel} disabled={saving}>
            Cancelar
          </button>
        ) : null}
      </div>
    </form>
  );
}
