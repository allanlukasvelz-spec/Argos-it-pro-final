"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  blockNocPublicationStep,
  completeNocWebProject,
  fetchNocWebProjectPublication,
  prepareNocWebProjectPublication,
  unblockNocPublicationStep,
  updateNocPublicationStep
} from "@/lib/nocApi";
import { webProjectErrorMessage } from "@/lib/webProjects/errors";
import {
  publicationReadinessLabel,
  publicationStepStatusLabel,
  publicationStepTypeLabel
} from "@/lib/webProjects/labels";
import type {
  WebProject,
  WebProjectPublicationPayload,
  WebProjectPublicationStep
} from "@/lib/webProjects/types";

const STATUS_OPTIONS = ["TODO", "READY", "IN_PROGRESS", "BLOCKED", "REVIEW", "DONE", "NOT_APPLICABLE"] as const;

export function NocWebProjectPublication({
  organizationId,
  project,
  onProjectUpdated
}: {
  organizationId: number;
  project: WebProject;
  onProjectUpdated?: (project: WebProject) => void;
}) {
  const [payload, setPayload] = useState<WebProjectPublicationPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [blockOpen, setBlockOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [blockType, setBlockType] = useState("DNS_PROVIDER");
  const [blockDescription, setBlockDescription] = useState("");
  const [completeReason, setCompleteReason] = useState("");

  const inPublication = project.workflowStatus === "PUBLICATION";
  const readOnly =
    Boolean(project.archivedAt) ||
    project.workflowStatus === "COMPLETED" ||
    Boolean(project.completedAt);

  const visible =
    inPublication ||
    readOnly ||
    project.workflowStatus === "VALIDATION" ||
    Boolean(payload?.publicationHandoff);

  const load = useCallback(async () => {
    if (project.workflowStatus === "INTAKE" || project.workflowStatus === "REVIEW") {
      setPayload(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNocWebProjectPublication(organizationId, project.id);
      setPayload(data);
      setSelectedId((prev) => prev ?? data.steps[0]?.id ?? null);
    } catch (err) {
      if (project.workflowStatus !== "VALIDATION" && project.workflowStatus !== "DEVELOPMENT") {
        setError(webProjectErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }, [organizationId, project.id, project.workflowStatus]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredSteps = useMemo(() => {
    const steps = payload?.steps || [];
    return steps.filter((step) => {
      if (statusFilter !== "ALL" && step.status !== statusFilter) return false;
      if (typeFilter !== "ALL" && step.stepType !== typeFilter) return false;
      return true;
    });
  }, [payload?.steps, statusFilter, typeFilter]);

  const selected = useMemo(
    () => (payload?.steps || []).find((s) => s.id === selectedId) || null,
    [payload?.steps, selectedId]
  );

  const types = useMemo(
    () => [...new Set((payload?.steps || []).map((s) => s.stepType))].sort(),
    [payload?.steps]
  );

  async function run(action: () => Promise<WebProjectPublicationPayload>) {
    setBusy(true);
    setError(null);
    try {
      const data = await action();
      setPayload(data);
      return data;
    } catch (err) {
      setError(webProjectErrorMessage(err));
      throw err;
    } finally {
      setBusy(false);
    }
  }

  async function onPrepare() {
    await run(() => prepareNocWebProjectPublication(organizationId, project.id));
  }

  async function onStatusChange(step: WebProjectPublicationStep, status: string) {
    await run(() => updateNocPublicationStep(organizationId, project.id, step.id, { status }));
  }

  async function onBlockSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    await run(() =>
      blockNocPublicationStep(organizationId, project.id, selected.id, {
        blockerType: blockType,
        description: blockDescription
      })
    );
    setBlockOpen(false);
    setBlockDescription("");
  }

  async function onUnblock() {
    if (!selected) return;
    await run(() => unblockNocPublicationStep(organizationId, project.id, selected.id));
  }

  async function onComplete(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const data = await completeNocWebProject(organizationId, project.id, {
        acknowledgeWarnings: payload?.readiness.state === "READY_WITH_WARNINGS",
        overrideReason: completeReason || undefined
      });
      setPayload(data);
      setCompleteOpen(false);
      onProjectUpdated?.({ ...project, workflowStatus: "COMPLETED", completedAt: new Date().toISOString() });
    } catch (err) {
      setError(webProjectErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!visible) return null;

  const emptyPlan = Boolean(payload && payload.publicationHandoff && !payload.plan && inPublication);

  return (
    <section className="noc-panel noc-dev-panel" id="noc-publicacion">
      <div className="noc-panel__head noc-dev-print__title">Publicación</div>
      <div className="noc-panel__body">
        {loading && <p>Cargando plan de publicación…</p>}
        {error && (
          <p className="noc-error" role="alert">
            {error}
          </p>
        )}
        {!loading && payload && (
          <>
            {emptyPlan && (
              <div className="noc-dev-empty" data-testid="publication-empty">
                <p>Aún no hay handoff de publicación. Completa la validación y pasa a publicación.</p>
              </div>
            )}

            {!payload.publicationHandoff && !payload.plan && project.workflowStatus === "VALIDATION" && (
              <p className="noc-disclaimer">Disponible tras pasar a publicación desde Validación.</p>
            )}

            <div className="noc-dev-overview noc-dev-print__overview">
              <p className="noc-dev-print__project">Proyecto: {project.title}</p>
              {payload.publicationHandoff && (
                <p data-testid="publication-handoff">
                  Handoff publicación #{payload.publicationHandoff.id} ·{" "}
                  {publicationReadinessLabel(payload.publicationHandoff.readinessState)} ·{" "}
                  {payload.publicationHandoff.createdAt}
                </p>
              )}
              {payload.plan && (
                <p data-testid="publication-progress">
                  Progreso: {payload.progress.percent}% ({payload.progress.done}/{payload.progress.total})
                </p>
              )}
              {payload.plan && (
                <p data-testid="publication-readiness">
                  Preparación finalización:{" "}
                  <strong data-readiness={payload.readiness.state} aria-live="polite">
                    {publicationReadinessLabel(payload.readiness.state)}
                  </strong>
                </p>
              )}
              {!readOnly && inPublication && payload.publicationHandoff && !payload.plan && (
                <button
                  type="button"
                  id="noc-pub-prepare"
                  className="noc-btn noc-dev-no-print"
                  disabled={busy}
                  data-testid="prepare-publication-btn"
                  onClick={() => void onPrepare()}
                >
                  Preparar publicación
                </button>
              )}
              {!readOnly && inPublication && payload.plan && payload.readiness.state !== "NOT_READY" && (
                <button
                  type="button"
                  className="noc-btn noc-dev-no-print"
                  disabled={busy}
                  data-testid="complete-project-btn"
                  onClick={() => setCompleteOpen(true)}
                >
                  Finalizar proyecto
                </button>
              )}
            </div>

            {payload.completionHandoff && (
              <p data-testid="completion-handoff" className="noc-val-publication-state">
                Handoff finalización #{payload.completionHandoff.id} ·{" "}
                {publicationReadinessLabel(payload.completionHandoff.readinessState)} ·{" "}
                {payload.completionHandoff.createdAt}
              </p>
            )}

            {payload.readiness.errors.length > 0 && (
              <ul className="noc-dev-errors" aria-label="Bloqueos de publicación">
                {payload.readiness.errors.map((e) => (
                  <li key={e.code + e.message}>{e.message}</li>
                ))}
              </ul>
            )}
            {payload.readiness.warnings.length > 0 && (
              <ul className="noc-dev-warnings noc-dev-print__warnings" aria-label="Avisos">
                {payload.readiness.warnings.map((w) => (
                  <li key={w.code + w.message}>{w.message}</li>
                ))}
              </ul>
            )}

            {payload.plan && (
              <div className="noc-dev-board noc-dev-print__board" data-testid="publication-board">
                <div className="noc-dev-filters noc-dev-no-print">
                  <label>
                    Estado
                    <select
                      aria-label="Filtrar por estado"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="ALL">Todos</option>
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {publicationStepStatusLabel(s)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Tipo
                    <select
                      aria-label="Filtrar por tipo"
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                    >
                      <option value="ALL">Todos</option>
                      {types.map((t) => (
                        <option key={t} value={t}>
                          {publicationStepTypeLabel(t)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <ul className="noc-dev-list" aria-label="Pasos de publicación">
                  {filteredSteps.map((step) => (
                    <li key={step.id}>
                      <button
                        type="button"
                        className={`noc-dev-list__item${selectedId === step.id ? " is-selected" : ""}`}
                        onClick={() => setSelectedId(step.id)}
                        data-step-type={step.stepType}
                        data-step-status={step.status}
                      >
                        <span>{step.title}</span>
                        <span data-status={step.status}>{publicationStepStatusLabel(step.status)}</span>
                        <span>{publicationStepTypeLabel(step.stepType)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                {selected && (
                  <div className="noc-dev-detail" id="noc-pub-step-detail">
                    <h3>{selected.title}</h3>
                    <p>{selected.description}</p>
                    <p>Tipo: {publicationStepTypeLabel(selected.stepType)}</p>
                    {!readOnly && inPublication && (
                      <label>
                        Estado
                        <select
                          aria-label="Estado del paso"
                          value={selected.status}
                          disabled={busy}
                          onChange={(e) => void onStatusChange(selected, e.target.value)}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {publicationStepStatusLabel(s)}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    {selected.blockers.length > 0 && (
                      <ul aria-label="Bloqueos del paso">
                        {selected.blockers.map((b) => (
                          <li key={b.id}>
                            {b.blockerType}: {b.description}
                            {b.resolvedAt ? " (resuelto)" : ""}
                          </li>
                        ))}
                      </ul>
                    )}
                    {!readOnly && inPublication && (
                      <div className="noc-dev-no-print">
                        <button type="button" className="noc-btn" disabled={busy} onClick={() => setBlockOpen(true)}>
                          Bloquear
                        </button>
                        {selected.status === "BLOCKED" && (
                          <button type="button" className="noc-btn" disabled={busy} onClick={() => void onUnblock()}>
                            Desbloquear
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {blockOpen && selected && (
        <dialog open className="noc-dialog noc-dev-no-print" aria-labelledby="pub-block-title">
          <form method="dialog" onSubmit={onBlockSubmit}>
            <h3 id="pub-block-title">Bloquear paso</h3>
            <label>
              Tipo
              <select value={blockType} onChange={(e) => setBlockType(e.target.value)}>
                <option value="DNS_PROVIDER">Proveedor DNS</option>
                <option value="HOSTING_PROVIDER">Proveedor hosting</option>
                <option value="CLIENT_DECISION">Decisión cliente</option>
                <option value="CLIENT_CREDENTIAL">Credencial cliente</option>
                <option value="OTHER">Otro</option>
              </select>
            </label>
            <label>
              Descripción
              <textarea value={blockDescription} required onChange={(e) => setBlockDescription(e.target.value)} />
            </label>
            <div className="noc-dialog__actions">
              <button type="button" onClick={() => setBlockOpen(false)}>
                Cancelar
              </button>
              <button type="submit" className="noc-btn" disabled={busy}>
                Bloquear
              </button>
            </div>
          </form>
        </dialog>
      )}

      {completeOpen && payload && (
        <dialog open className="noc-dialog noc-dev-no-print" aria-labelledby="complete-dialog-title">
          <form onSubmit={onComplete}>
            <h3 id="complete-dialog-title">Finalizar proyecto</h3>
            <p>Confirma que los pasos requeridos de publicación están completos.</p>
            {payload.readiness.state === "READY_WITH_WARNINGS" && (
              <p>Hay avisos abiertos. Se registrará confirmación explícita.</p>
            )}
            <label>
              Motivo / nota (opcional)
              <textarea value={completeReason} onChange={(e) => setCompleteReason(e.target.value)} />
            </label>
            <div className="noc-dialog__actions">
              <button type="button" onClick={() => setCompleteOpen(false)}>
                Cancelar
              </button>
              <button type="submit" className="noc-btn" disabled={busy} data-testid="confirm-complete-btn">
                Finalizar
              </button>
            </div>
          </form>
        </dialog>
      )}
    </section>
  );
}
