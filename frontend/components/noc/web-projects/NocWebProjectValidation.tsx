"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  attachNocValidationEvidence,
  createNocValidationDefect,
  fetchNocWebProjectValidation,
  prepareNocWebProjectValidation,
  retestNocValidationDefect,
  startNocWebProjectPublication,
  updateNocValidationCheck,
  updateNocValidationDefect
} from "@/lib/nocApi";
import { webProjectErrorMessage } from "@/lib/webProjects/errors";
import {
  validationCategoryLabel,
  validationCheckStatusLabel,
  validationReadinessLabel
} from "@/lib/webProjects/labels";
import type {
  WebProject,
  WebProjectValidationCheck,
  WebProjectValidationPayload
} from "@/lib/webProjects/types";

const CHECK_STATUS_OPTIONS = [
  "PENDING",
  "IN_PROGRESS",
  "PASS",
  "FAIL",
  "BLOCKED",
  "NOT_TESTABLE",
  "NOT_APPLICABLE"
] as const;

export function NocWebProjectValidation({
  organizationId,
  project,
  onProjectUpdated
}: {
  organizationId: number;
  project: WebProject;
  onProjectUpdated?: (project: WebProject) => void;
}) {
  const [payload, setPayload] = useState<WebProjectValidationPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [requiredFilter, setRequiredFilter] = useState("ALL");
  const [publicationOpen, setPublicationOpen] = useState(false);
  const [publicationReason, setPublicationReason] = useState("");
  const [failReason, setFailReason] = useState("");
  const [defectTitle, setDefectTitle] = useState("");
  const [defectSeverity, setDefectSeverity] = useState("HIGH");
  const [evidenceNote, setEvidenceNote] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");

  const inValidation =
    project.workflowStatus === "VALIDATION" || Boolean(payload?.validationHandoff);
  const readOnly =
    Boolean(project.archivedAt) ||
    project.workflowStatus === "PUBLICATION" ||
    project.workflowStatus === "COMPLETED" ||
    Boolean(project.completedAt) ||
    Boolean(payload?.publicationHandoff);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNocWebProjectValidation(organizationId, project.id);
      setPayload(data);
      setSelectedId((prev) => prev ?? data.checks[0]?.id ?? null);
    } catch (err) {
      setError(webProjectErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [organizationId, project.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredChecks = useMemo(() => {
    return (payload?.checks || []).filter((check) => {
      if (categoryFilter !== "ALL" && check.category !== categoryFilter) return false;
      if (statusFilter !== "ALL" && check.status !== statusFilter) return false;
      if (requiredFilter === "REQUIRED" && !check.required) return false;
      if (requiredFilter === "OPTIONAL" && check.required) return false;
      return true;
    });
  }, [payload?.checks, categoryFilter, statusFilter, requiredFilter]);

  const selected = useMemo(
    () => (payload?.checks || []).find((c) => c.id === selectedId) || null,
    [payload?.checks, selectedId]
  );

  const categories = useMemo(
    () => [...new Set((payload?.checks || []).map((c) => c.category))].sort(),
    [payload?.checks]
  );

  async function run(action: () => Promise<WebProjectValidationPayload>) {
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
    await run(() => prepareNocWebProjectValidation(organizationId, project.id));
  }

  async function onStatusChange(check: WebProjectValidationCheck, status: string) {
    const body: { status: string; actualResult?: string; statusReason?: string } = { status };
    if (status === "FAIL") body.actualResult = failReason || "Incumplimiento detectado";
    if (status === "NOT_TESTABLE" || status === "NOT_APPLICABLE") {
      body.statusReason = failReason || "Documentado en validación";
    }
    await run(() => updateNocValidationCheck(organizationId, project.id, check.id, body));
    setFailReason("");
  }

  async function onCreateDefect(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    await run(() =>
      createNocValidationDefect(organizationId, project.id, selected.id, {
        title: defectTitle,
        severity: defectSeverity,
        description: failReason || undefined
      })
    );
    setDefectTitle("");
  }

  async function onAttachEvidence(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    await run(() =>
      attachNocValidationEvidence(organizationId, project.id, selected.id, {
        evidenceType: evidenceUrl ? "URL" : "TEXT_NOTE",
        url: evidenceUrl || undefined,
        textNote: evidenceNote || undefined,
        label: evidenceNote ? "Nota" : "URL"
      })
    );
    setEvidenceNote("");
    setEvidenceUrl("");
  }

  async function onDefectStatus(defectId: number, status: string) {
    await run(() => updateNocValidationDefect(organizationId, project.id, defectId, { status }));
  }

  async function onRetest(defectId: number, checkStatus: "PASS" | "FAIL") {
    await run(() =>
      retestNocValidationDefect(organizationId, project.id, defectId, {
        checkStatus,
        note: "Retest manual"
      })
    );
  }

  async function onStartPublication(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const data = await startNocWebProjectPublication(organizationId, project.id, {
        acknowledgeWarnings: payload?.readiness.state === "READY_WITH_WARNINGS",
        overrideReason: publicationReason || undefined
      });
      setPayload(data);
      setPublicationOpen(false);
      onProjectUpdated?.({ ...project, workflowStatus: "PUBLICATION" });
    } catch (err) {
      setError(webProjectErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const emptyPlan = Boolean(payload && !payload.plan && inValidation);

  return (
    <section className="noc-panel noc-dev-panel noc-val-panel" id="noc-validacion">
      <div className="noc-panel__head noc-dev-print__title">Validación</div>
      <div className="noc-panel__body">
        {loading && <p>Cargando validación…</p>}
        {error && (
          <p className="noc-error" role="alert">
            {error}
          </p>
        )}
        {!loading && payload && (
          <>
            {emptyPlan && (
              <div className="noc-dev-empty" data-testid="validation-empty">
                <p>El handoff de validación está registrado. Prepara el plan QA para generar comprobaciones.</p>
                {!readOnly && inValidation && (
                  <button
                    type="button"
                    id="noc-val-prepare"
                    className="noc-btn noc-dev-no-print"
                    disabled={busy}
                    onClick={() => void onPrepare()}
                  >
                    Preparar validación
                  </button>
                )}
              </div>
            )}

            <div className="noc-dev-overview noc-dev-print__overview noc-val-print__overview">
              <p className="noc-dev-print__project">Proyecto: {project.title}</p>
              <p data-testid="validation-handoff">
                Handoff:{" "}
                {payload.validationHandoff
                  ? `#${payload.validationHandoff.id} · ${payload.validationHandoff.readinessState}`
                  : "—"}
              </p>
              <p data-testid="validation-references">
                Arquitectura v{payload.plan?.architectureVersion ?? "—"} · Maqueta v
                {payload.plan?.mockupVersion ?? "—"} · Plan desarrollo #
                {payload.plan?.developmentPlanId ?? "—"}
              </p>
              <p data-testid="validation-execution-progress">
                Progreso pruebas: {payload.executionProgress.percent}% (
                {payload.executionProgress.evaluated}/{payload.executionProgress.total})
              </p>
              <p data-testid="validation-pass-rate">
                Cumplimiento: {payload.passRate.percent}% ({payload.passRate.passed}/
                {payload.passRate.evaluated || 0})
              </p>
              <p data-testid="validation-readiness">
                Preparación publicación:{" "}
                <strong data-readiness={payload.readiness.state} aria-live="polite">
                  {validationReadinessLabel(payload.readiness.state)}
                </strong>
              </p>
              {!readOnly && inValidation && payload.plan && payload.readiness.state !== "NOT_READY" && (
                <button
                  type="button"
                  className="noc-btn noc-dev-no-print"
                  disabled={busy}
                  data-testid="start-publication-btn"
                  onClick={() => setPublicationOpen(true)}
                >
                  Pasar a publicación
                </button>
              )}
            </div>

            {payload.readiness.errors.length > 0 && (
              <ul className="noc-dev-errors" aria-label="Bloqueos de validación" data-testid="validation-blockers">
                {payload.readiness.errors.map((e) => (
                  <li key={e.code + e.message}>{e.message}</li>
                ))}
              </ul>
            )}

            {payload.plan && (
              <div className="noc-dev-board noc-val-board" data-testid="validation-qa-matrix">
                <div className="noc-dev-filters noc-dev-no-print">
                  <label>
                    Categoría
                    <select
                      aria-label="Filtrar por categoría"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <option value="ALL">Todas</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {validationCategoryLabel(c)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Estado
                    <select
                      aria-label="Filtrar por estado"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="ALL">Todos</option>
                      {CHECK_STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {validationCheckStatusLabel(s)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Requerido
                    <select
                      aria-label="Filtrar por requerido"
                      value={requiredFilter}
                      onChange={(e) => setRequiredFilter(e.target.value)}
                    >
                      <option value="ALL">Todos</option>
                      <option value="REQUIRED">Requeridos</option>
                      <option value="OPTIONAL">Opcionales</option>
                    </select>
                  </label>
                </div>
                <ul className="noc-dev-list" aria-label="Matriz QA">
                  {filteredChecks.map((check) => (
                    <li key={check.id}>
                      <button
                        type="button"
                        className={`noc-dev-list__item${selectedId === check.id ? " is-selected" : ""}`}
                        onClick={() => setSelectedId(check.id)}
                        data-check-category={check.category}
                        data-check-status={check.status}
                        data-check-required={check.required ? "yes" : "no"}
                      >
                        <span>{check.title}</span>
                        <span data-status={check.status}>{validationCheckStatusLabel(check.status)}</span>
                        <span>{validationCategoryLabel(check.category)}</span>
                        {check.required && <span aria-label="Requerido">*</span>}
                      </button>
                    </li>
                  ))}
                </ul>

                {selected && (
                  <div className="noc-dev-detail noc-val-detail" id="noc-val-check-detail" data-testid="check-detail">
                    <h3>{selected.title}</h3>
                    <p>{selected.description}</p>
                    <p>Categoría: {validationCategoryLabel(selected.category)}</p>
                    <p>Esperado: {selected.expectedResult || "—"}</p>
                    <p>Resultado: {selected.actualResult || "—"}</p>
                    {selected.templateGroupKey && (
                      <p data-testid="template-group">Plantilla: {selected.templateGroupKey}</p>
                    )}
                    {!readOnly && inValidation && (
                      <>
                        <label>
                          Motivo / resultado
                          <textarea
                            aria-label="Motivo o resultado"
                            value={failReason}
                            onChange={(e) => setFailReason(e.target.value)}
                            rows={2}
                          />
                        </label>
                        <label>
                          Estado
                          <select
                            aria-label="Estado del check"
                            value={selected.status}
                            disabled={busy}
                            onChange={(e) => void onStatusChange(selected, e.target.value)}
                          >
                            {CHECK_STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {validationCheckStatusLabel(s)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <form className="noc-val-evidence-form noc-dev-no-print" onSubmit={(e) => void onAttachEvidence(e)}>
                          <h4>Evidencia</h4>
                          <label>
                            Nota
                            <input
                              type="text"
                              value={evidenceNote}
                              onChange={(e) => setEvidenceNote(e.target.value)}
                            />
                          </label>
                          <label>
                            URL (https)
                            <input type="url" value={evidenceUrl} onChange={(e) => setEvidenceUrl(e.target.value)} />
                          </label>
                          <button type="submit" className="noc-btn noc-btn--secondary" disabled={busy}>
                            Adjuntar evidencia
                          </button>
                        </form>
                        {selected.status === "FAIL" && (
                          <form className="noc-val-defect-form noc-dev-no-print" onSubmit={(e) => void onCreateDefect(e)}>
                            <h4>Crear defecto</h4>
                            <label>
                              Título
                              <input
                                required
                                value={defectTitle}
                                onChange={(e) => setDefectTitle(e.target.value)}
                              />
                            </label>
                            <label>
                              Severidad
                              <select value={defectSeverity} onChange={(e) => setDefectSeverity(e.target.value)}>
                                <option value="LOW">Baja</option>
                                <option value="MEDIUM">Media</option>
                                <option value="HIGH">Alta</option>
                                <option value="CRITICAL">Crítica</option>
                              </select>
                            </label>
                            <button type="submit" className="noc-btn noc-btn--secondary" disabled={busy}>
                              Registrar defecto
                            </button>
                          </form>
                        )}
                      </>
                    )}
                    {selected.evidence.length > 0 && (
                      <ul className="noc-val-evidence-list" data-testid="check-evidence">
                        {selected.evidence.map((ev) => (
                          <li key={ev.id}>
                            {ev.evidenceType}: {ev.textNote || ev.url || ev.label || `#${ev.id}`}
                          </li>
                        ))}
                      </ul>
                    )}
                    {selected.history.length > 0 && (
                      <ul className="noc-val-history" aria-label="Historial de resultados">
                        {selected.history.map((h) => (
                          <li key={h.id}>
                            {h.previousStatus} → {h.newStatus} ({h.testedAt})
                            {h.note ? `: ${h.note}` : ""}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {payload.defects.length > 0 && (
                  <div className="noc-val-defects" data-testid="validation-defects">
                    <h3>Defectos</h3>
                    <ul>
                      {payload.defects.map((d) => (
                        <li key={d.id} data-defect-status={d.status} data-defect-severity={d.severity}>
                          <strong>{d.title}</strong> — {d.severity} / {d.status}
                          {!readOnly && inValidation && d.status === "OPEN" && (
                            <button
                              type="button"
                              className="noc-btn noc-btn--secondary noc-dev-no-print"
                              onClick={() => void onDefectStatus(d.id, "IN_PROGRESS")}
                            >
                              En curso
                            </button>
                          )}
                          {!readOnly && inValidation && d.status === "IN_PROGRESS" && (
                            <button
                              type="button"
                              className="noc-btn noc-btn--secondary noc-dev-no-print"
                              onClick={() => void onDefectStatus(d.id, "FIXED")}
                            >
                              Corregido
                            </button>
                          )}
                          {!readOnly && inValidation && d.status === "FIXED" && (
                            <button
                              type="button"
                              className="noc-btn noc-btn--secondary noc-dev-no-print"
                              onClick={() => void onDefectStatus(d.id, "RETEST_REQUIRED")}
                            >
                              Solicitar retest
                            </button>
                          )}
                          {!readOnly && inValidation && d.status === "RETEST_REQUIRED" && (
                            <>
                              <button
                                type="button"
                                className="noc-btn noc-dev-no-print"
                                onClick={() => void onRetest(d.id, "PASS")}
                              >
                                Retest PASS
                              </button>
                              <button
                                type="button"
                                className="noc-btn noc-btn--secondary noc-dev-no-print"
                                onClick={() => void onRetest(d.id, "FAIL")}
                              >
                                Retest FAIL
                              </button>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {payload.publicationHandoff && (
              <p data-testid="publication-handoff" className="noc-val-publication-state">
                Handoff publicación #{payload.publicationHandoff.id} ·{" "}
                {validationReadinessLabel(payload.publicationHandoff.readinessState)} ·{" "}
                {payload.publicationHandoff.createdAt}
              </p>
            )}
          </>
        )}
      </div>

      {publicationOpen && payload && (
        <dialog open className="noc-dialog noc-dev-no-print" aria-labelledby="publication-dialog-title">
          <form method="dialog" onSubmit={(e) => void onStartPublication(e)}>
            <h3 id="publication-dialog-title">Pasar a publicación</h3>
            <p>Run #{payload.run?.runNumber ?? 1}</p>
            <p>
              Checks PASS: {payload.counts.checks.pass ?? 0} · Fail: {payload.counts.checks.fail ?? 0} · Abiertos:{" "}
              {payload.counts.defectsOpen}
            </p>
            {payload.readiness.state === "READY_WITH_WARNINGS" && (
              <label>
                Motivo de confirmación
                <textarea
                  required
                  value={publicationReason}
                  onChange={(e) => setPublicationReason(e.target.value)}
                  rows={3}
                />
              </label>
            )}
            <div className="noc-dialog__actions">
              <button type="button" className="noc-btn noc-btn--secondary" onClick={() => setPublicationOpen(false)}>
                Cancelar
              </button>
              <button type="submit" className="noc-btn" disabled={busy}>
                Confirmar
              </button>
            </div>
          </form>
        </dialog>
      )}
    </section>
  );
}
