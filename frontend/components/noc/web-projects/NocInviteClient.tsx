"use client";

import { FormEvent, useState } from "react";
import { createNocWebProjectInvitation, type NocInvitationCreateResult } from "@/lib/nocApi";
import { webProjectErrorMessage } from "@/lib/webProjects/errors";
import { invitationCreatedMessage } from "@/lib/webProjects/invitationUi";
import type { WebProjectType } from "@/lib/webProjects/types";

export function NocInviteClient({
  organizationId,
  onCreated,
  onCancel
}: {
  organizationId: number | null;
  onCreated: (result: NocInvitationCreateResult) => void;
  onCancel?: () => void;
}) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [projectType, setProjectType] = useState<WebProjectType>("improve");
  const [projectTitle, setProjectTitle] = useState("");
  const [useExistingOrg, setUseExistingOrg] = useState(Boolean(organizationId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const result = await createNocWebProjectInvitation({
        email: email.trim(),
        displayName: displayName.trim(),
        projectType,
        projectTitle: projectTitle.trim() || undefined,
        organizationId: useExistingOrg ? organizationId : null
      });
      onCreated(result);
    } catch (err) {
      setError(webProjectErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="noc-panel" onSubmit={onSubmit}>
      <div className="noc-panel__head">Invitar nuevo cliente</div>
      <div className="noc-panel__body noc-form">
        <p className="noc-disclaimer">
          Solo datos mínimos para contactar y abrir el espacio del proyecto. El cuestionario recogerá
          el resto.
        </p>
        <label>
          Nombre del cliente
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            maxLength={120}
            autoComplete="off"
          />
        </label>
        <label>
          Email de contacto
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="off"
          />
        </label>
        <fieldset>
          <legend>Tipo de proyecto</legend>
          <label>
            <input
              type="radio"
              name="inviteProjectType"
              value="create"
              checked={projectType === "create"}
              onChange={() => setProjectType("create")}
            />{" "}
            Crear nueva web
          </label>
          <label>
            <input
              type="radio"
              name="inviteProjectType"
              value="improve"
              checked={projectType === "improve"}
              onChange={() => setProjectType("improve")}
            />{" "}
            Mejorar web existente
          </label>
        </fieldset>
        <label>
          Título del proyecto (opcional)
          <input
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            maxLength={180}
            placeholder="Si lo dejas vacío se genera uno neutro"
          />
        </label>
        {organizationId ? (
          <label className="noc-check">
            <input
              type="checkbox"
              checked={useExistingOrg}
              onChange={(e) => setUseExistingOrg(e.target.checked)}
            />
            Usar la organización seleccionada ({organizationId})
          </label>
        ) : (
          <p className="noc-disclaimer">Se creará una organización provisional con el nombre indicado.</p>
        )}
        {error ? (
          <p className="noc-disclaimer" role="alert">
            {error}
          </p>
        ) : null}
        <div className="noc-actions">
          <button type="submit" className="noc-btn noc-btn--primary" disabled={saving}>
            {saving ? "Creando…" : "Enviar invitación"}
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
