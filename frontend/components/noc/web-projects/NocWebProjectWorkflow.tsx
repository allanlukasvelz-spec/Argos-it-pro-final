"use client";

import { useState } from "react";
import { archiveNocWebProject, transitionNocWebProject } from "@/lib/nocApi";
import { relativeTimeEs } from "@/lib/clientCopy";
import { webProjectErrorMessage } from "@/lib/webProjects/errors";
import { workflowLabel } from "@/lib/webProjects/labels";
import {
  nocArchiveActionVisible,
  nocGenericTransitionTargets,
  nocTransitionLabel
} from "@/lib/webProjects/nocWorkflow";
import type { WebProject, WebProjectWorkflowStatus } from "@/lib/webProjects/types";

export function NocWebProjectWorkflow({
  organizationId,
  project,
  onUpdated
}: {
  organizationId: number;
  project: WebProject;
  onUpdated: (project: WebProject) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [archiveReason, setArchiveReason] = useState("");
  const next = nocGenericTransitionTargets(project.workflowStatus, project.archivedAt);
  const canArchive = nocArchiveActionVisible(project);

  async function onTransition(toStatus: WebProjectWorkflowStatus) {
    setBusy(toStatus);
    setError(null);
    try {
      onUpdated(await transitionNocWebProject(organizationId, project.id, toStatus));
    } catch (err) {
      setError(webProjectErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function onArchive() {
    setBusy("ARCHIVE");
    setError(null);
    try {
      onUpdated(
        await archiveNocWebProject(organizationId, project.id, {
          reason: archiveReason.trim() || null
        })
      );
      setConfirmArchive(false);
      setArchiveReason("");
    } catch (err) {
      setError(webProjectErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="noc-panel">
      <div className="noc-panel__head">Workflow</div>
      <div className="noc-panel__body">
        <p>
          Fase actual: <strong>{workflowLabel(project.workflowStatus)}</strong>{" "}
          <code>{project.workflowStatus}</code>
        </p>
        {project.readiness ? (
          <p className="noc-disclaimer">
            {project.readiness.label}
            {project.readiness.openCorrections > 0
              ? ` · ${project.readiness.openCorrections} correcciones abiertas`
              : ""}
            {project.readiness.requiredPending > 0
              ? ` · ${project.readiness.requiredPending} requeridos pendientes (aviso, no bloqueo automático salvo correcciones)`
              : ""}
          </p>
        ) : null}
        {project.archivedAt ? (
          <div className="noc-disclaimer">
            <p>
              <strong>Archivado</strong>
              {project.archivedAt ? ` · ${relativeTimeEs(project.archivedAt)}` : ""}
            </p>
            {project.archivedBy ? <p>Archivado por user {project.archivedBy}</p> : null}
            {project.archiveReason ? <p>Razón: {project.archiveReason}</p> : null}
            <p>Sin transiciones ni archivo adicional.</p>
          </div>
        ) : next.length === 0 && project.workflowStatus === "REVIEW" ? (
          <p className="noc-disclaimer">
            Para pasar a arquitectura usa <a href="#noc-brief">Brief del proyecto</a>.
          </p>
        ) : next.length === 0 ? (
          <p className="noc-disclaimer">Estado terminal. El cliente no controla el workflow.</p>
        ) : (
          <div className="noc-actions">
            {next.map((status) => (
              <button
                key={status}
                type="button"
                className="noc-btn noc-btn--primary"
                disabled={Boolean(busy)}
                onClick={() => void onTransition(status)}
              >
                {busy === status
                  ? "Aplicando…"
                  : nocTransitionLabel(project.workflowStatus, status)}
                <span className="noc-disclaimer"> {status}</span>
              </button>
            ))}
          </div>
        )}
        {canArchive ? (
          <div className="noc-actions" style={{ marginTop: "0.75rem" }}>
            {confirmArchive ? (
              <>
                <label className="noc-form">
                  Razón del archivado (opcional)
                  <input
                    type="text"
                    value={archiveReason}
                    maxLength={500}
                    onChange={(e) => setArchiveReason(e.target.value)}
                    placeholder="Ej. cierre operativo tras entrega"
                  />
                </label>
                <button type="button" className="noc-btn" disabled={Boolean(busy)} onClick={() => void onArchive()}>
                  {busy === "ARCHIVE" ? "Archivando…" : "Confirmar archivo"}
                </button>
                <button
                  type="button"
                  className="noc-btn"
                  onClick={() => {
                    setConfirmArchive(false);
                    setArchiveReason("");
                  }}
                >
                  Cancelar
                </button>
              </>
            ) : (
              <button type="button" className="noc-btn" onClick={() => setConfirmArchive(true)}>
                Archivar expediente
              </button>
            )}
          </div>
        ) : null}
        {error ? (
          <p className="noc-disclaimer" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}
