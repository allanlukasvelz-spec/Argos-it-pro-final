"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  addNocDevelopmentDependency,
  blockNocDevelopmentItem,
  fetchNocWebProjectDevelopment,
  prepareNocWebProjectDevelopment,
  startNocWebProjectValidation,
  unblockNocDevelopmentItem,
  updateNocDevelopmentItem
} from "@/lib/nocApi";
import { webProjectErrorMessage } from "@/lib/webProjects/errors";
import {
  developmentItemStatusLabel,
  developmentItemTypeLabel,
  developmentReadinessLabel
} from "@/lib/webProjects/labels";
import type { WebProject, WebProjectDevelopmentItem, WebProjectDevelopmentPayload } from "@/lib/webProjects/types";

const STATUS_OPTIONS = ["TODO", "READY", "IN_PROGRESS", "BLOCKED", "REVIEW", "DONE", "NOT_APPLICABLE"] as const;

export function NocWebProjectDevelopment({
  organizationId,
  project,
  onProjectUpdated
}: {
  organizationId: number;
  project: WebProject;
  onProjectUpdated?: (project: WebProject) => void;
}) {
  const [payload, setPayload] = useState<WebProjectDevelopmentPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [blockOpen, setBlockOpen] = useState(false);
  const [validationOpen, setValidationOpen] = useState(false);
  const [blockType, setBlockType] = useState("CLIENT_CONTENT");
  const [blockDescription, setBlockDescription] = useState("");
  const [validationReason, setValidationReason] = useState("");
  const [dependsOnId, setDependsOnId] = useState<number | "">("");

  const inDevelopment = project.workflowStatus === "DEVELOPMENT";
  const readOnly = Boolean(project.archivedAt) || project.workflowStatus === "VALIDATION" || project.completedAt;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNocWebProjectDevelopment(organizationId, project.id);
      setPayload(data);
      setSelectedId((prev) => prev ?? data.items[0]?.id ?? null);
    } catch (err) {
      setError(webProjectErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [organizationId, project.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredItems = useMemo(() => {
    const items = payload?.items || [];
    return items.filter((item) => {
      if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
      if (typeFilter !== "ALL" && item.itemType !== typeFilter) return false;
      return true;
    });
  }, [payload?.items, statusFilter, typeFilter]);

  const selected = useMemo(
    () => (payload?.items || []).find((i) => i.id === selectedId) || null,
    [payload?.items, selectedId]
  );

  const itemTitleById = useMemo(() => {
    const map = new Map<number, string>();
    for (const item of payload?.items || []) map.set(item.id, item.title);
    return map;
  }, [payload?.items]);

  async function run(action: () => Promise<WebProjectDevelopmentPayload>) {
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
    await run(() => prepareNocWebProjectDevelopment(organizationId, project.id));
  }

  async function onStatusChange(item: WebProjectDevelopmentItem, status: string) {
    await run(() => updateNocDevelopmentItem(organizationId, project.id, item.id, { status }));
  }

  async function onBlockSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    await run(() =>
      blockNocDevelopmentItem(organizationId, project.id, selected.id, {
        blockerType: blockType,
        description: blockDescription
      })
    );
    setBlockOpen(false);
    setBlockDescription("");
  }

  async function onUnblock() {
    if (!selected) return;
    await run(() => unblockNocDevelopmentItem(organizationId, project.id, selected.id));
  }

  async function onAddDependency(e: FormEvent) {
    e.preventDefault();
    if (!selected || !dependsOnId) return;
    await run(() =>
      addNocDevelopmentDependency(organizationId, project.id, selected.id, Number(dependsOnId))
    );
    setDependsOnId("");
  }

  async function onStartValidation(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const data = await startNocWebProjectValidation(organizationId, project.id, {
        acknowledgeWarnings: payload?.readiness.state === "READY_WITH_WARNINGS",
        overrideReason: validationReason || undefined
      });
      setPayload(data);
      setValidationOpen(false);
      onProjectUpdated?.({ ...project, workflowStatus: "VALIDATION" });
    } catch (err) {
      setError(webProjectErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const types = useMemo(
    () => [...new Set((payload?.items || []).map((i) => i.itemType))].sort(),
    [payload?.items]
  );

  const emptyPlan = Boolean(payload && !payload.plan && inDevelopment);

  return (
    <section className="noc-panel noc-dev-panel" id="noc-desarrollo">
      <div className="noc-panel__head noc-dev-print__title">Desarrollo</div>
      <div className="noc-panel__body">
        {loading && <p>Cargando plan de desarrollo…</p>}
        {error && (
          <p className="noc-error" role="alert">
            {error}
          </p>
        )}
        {!loading && payload && (
          <>
            {emptyPlan && (
              <div className="noc-dev-empty" data-testid="development-empty">
                <p>El handoff está registrado. Prepara el plan de implementación para generar tareas.</p>
              </div>
            )}

            <div className="noc-dev-overview noc-dev-print__overview">
              <p className="noc-dev-print__project">
                Proyecto: {project.title}
              </p>
              <p data-testid="development-handoff">
                Handoff:{" "}
                {payload.handoff
                  ? `arquitectura v${payload.handoff.architectureVersion} · maqueta v${payload.handoff.mockupVersion}`
                  : "—"}
              </p>
              <p data-testid="development-progress">
                Progreso: {payload.progress.percent}% ({payload.progress.done}/{payload.progress.total})
              </p>
              <p data-testid="development-readiness">
                Preparación validación:{" "}
                <strong data-readiness={payload.readiness.state} aria-live="polite">
                  {developmentReadinessLabel(payload.readiness.state)}
                </strong>
              </p>
              {!readOnly && inDevelopment && !payload.plan && (
                <button
                  type="button"
                  id="noc-dev-prepare"
                  className="noc-btn noc-dev-no-print"
                  disabled={busy}
                  onClick={() => void onPrepare()}
                >
                  Preparar desarrollo
                </button>
              )}
              {!readOnly && inDevelopment && payload.plan && payload.readiness.state !== "NOT_READY" && (
                <button
                  type="button"
                  className="noc-btn noc-dev-no-print"
                  disabled={busy}
                  onClick={() => setValidationOpen(true)}
                >
                  Pasar a validación
                </button>
              )}
            </div>

            {payload.readiness.errors.length > 0 && (
              <ul className="noc-dev-errors" aria-label="Bloqueos de preparación">
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
              <div className="noc-dev-board noc-dev-print__board" data-testid="development-board">
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
                          {developmentItemStatusLabel(s)}
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
                          {developmentItemTypeLabel(t)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <ul className="noc-dev-list" aria-label="Tareas de desarrollo">
                  {filteredItems.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={`noc-dev-list__item${selectedId === item.id ? " is-selected" : ""}`}
                        onClick={() => setSelectedId(item.id)}
                        data-item-type={item.itemType}
                        data-item-status={item.status}
                      >
                        <span>{item.title}</span>
                        <span data-status={item.status}>{developmentItemStatusLabel(item.status)}</span>
                        <span>{developmentItemTypeLabel(item.itemType)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                {selected && (
                  <div className="noc-dev-detail" id="noc-dev-item-detail">
                    <h3>{selected.title}</h3>
                    <p>{selected.description}</p>
                    <p>Tipo: {developmentItemTypeLabel(selected.itemType)}</p>
                    <p>Contenido: {selected.contentReadiness}</p>
                    {!readOnly && inDevelopment && (
                      <label>
                        Estado
                        <select
                          aria-label="Estado de la tarea"
                          value={selected.status}
                          disabled={busy}
                          onChange={(e) => void onStatusChange(selected, e.target.value)}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {developmentItemStatusLabel(s)}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    {selected.dependencyIds.length > 0 && (
                      <ul className="noc-dev-dependencies" aria-label="Dependencias">
                        {selected.dependencyIds.map((depId) => (
                          <li key={depId}>Depende de: {itemTitleById.get(depId) || `#${depId}`}</li>
                        ))}
                      </ul>
                    )}
                    {!readOnly && inDevelopment && (
                      <form className="noc-dev-dependency-form noc-dev-no-print" onSubmit={(e) => void onAddDependency(e)}>
                        <label>
                          Añadir dependencia
                          <select
                            aria-label="Tarea de la que depende"
                            value={dependsOnId}
                            onChange={(e) => setDependsOnId(e.target.value ? Number(e.target.value) : "")}
                          >
                            <option value="">Seleccionar…</option>
                            {(payload.items || [])
                              .filter((i) => i.id !== selected.id)
                              .map((i) => (
                                <option key={i.id} value={i.id}>
                                  {i.title}
                                </option>
                              ))}
                          </select>
                        </label>
                        <button type="submit" className="noc-btn noc-btn--secondary" disabled={busy || !dependsOnId}>
                          Añadir dependencia
                        </button>
                      </form>
                    )}
                    {selected.checklist.length > 0 && (
                      <ul className="noc-dev-checklist">
                        {selected.checklist.map((c) => (
                          <li key={c.id}>
                            {c.completed ? "✓" : "○"} {c.label}
                          </li>
                        ))}
                      </ul>
                    )}
                    {selected.blockers.length > 0 && (
                      <ul className="noc-dev-blockers noc-dev-print__blockers">
                        {selected.blockers.map((b) => (
                          <li key={b.id}>
                            {b.blockerType}: {b.description}
                            {b.resolvedAt ? ` (resuelto ${b.resolvedAt})` : ""}
                          </li>
                        ))}
                      </ul>
                    )}
                    {!readOnly && inDevelopment && selected.status !== "BLOCKED" && (
                      <button
                        type="button"
                        className="noc-btn noc-btn--secondary noc-dev-no-print"
                        onClick={() => setBlockOpen(true)}
                      >
                        Bloquear
                      </button>
                    )}
                    {!readOnly && inDevelopment && selected.status === "BLOCKED" && (
                      <button
                        type="button"
                        className="noc-btn noc-dev-no-print"
                        disabled={busy}
                        onClick={() => void onUnblock()}
                      >
                        Resolver bloqueo
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {blockOpen && selected && (
        <dialog open className="noc-dialog noc-dev-no-print" aria-labelledby="block-dialog-title">
          <form method="dialog" onSubmit={(e) => void onBlockSubmit(e)}>
            <h3 id="block-dialog-title">Bloquear tarea</h3>
            <label>
              Tipo
              <select value={blockType} onChange={(e) => setBlockType(e.target.value)}>
                <option value="CLIENT_CONTENT">Contenido cliente</option>
                <option value="CLIENT_DECISION">Decisión cliente</option>
                <option value="TECHNICAL_DEPENDENCY">Dependencia técnica</option>
                <option value="OTHER">Otro</option>
              </select>
            </label>
            <label>
              Descripción
              <textarea
                aria-label="Descripción del bloqueo"
                value={blockDescription}
                required
                onChange={(e) => setBlockDescription(e.target.value)}
              />
            </label>
            <div className="noc-dialog__actions">
              <button type="button" onClick={() => setBlockOpen(false)}>
                Cancelar
              </button>
              <button type="submit" disabled={busy}>
                Bloquear
              </button>
            </div>
          </form>
        </dialog>
      )}

      {validationOpen && (
        <dialog open className="noc-dialog noc-dev-no-print" id="noc-start-validation" aria-labelledby="validation-dialog-title">
          <form
            method="dialog"
            onSubmit={(e) => {
              e.preventDefault();
              void onStartValidation(e);
            }}
          >
            <h3 id="validation-dialog-title">Pasar a validación</h3>
            <p>Progreso: {payload?.progress.percent}%</p>
            <p>Arquitectura: v{payload?.handoff?.architectureVersion}</p>
            <p>Maqueta: v{payload?.handoff?.mockupVersion}</p>
            <p>Estado: {developmentReadinessLabel(payload?.readiness.state)}</p>
            {payload?.readiness.warnings.length ? (
              <ul aria-label="Advertencias abiertas">
                {payload.readiness.warnings.map((w) => (
                  <li key={w.code + w.message}>{w.message}</li>
                ))}
              </ul>
            ) : null}
            {payload?.readiness.state === "READY_WITH_WARNINGS" && (
              <label>
                Motivo / confirmación
                <textarea value={validationReason} onChange={(e) => setValidationReason(e.target.value)} />
              </label>
            )}
            <div className="noc-dialog__actions">
              <button type="button" onClick={() => setValidationOpen(false)}>
                Cancelar
              </button>
              <button type="submit" disabled={busy}>
                Confirmar
              </button>
            </div>
          </form>
        </dialog>
      )}
    </section>
  );
}
