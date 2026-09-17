import { NocEmpty } from "@/components/noc/NocUi";
import { fieldTitle, optionLabel, unwrapFormValue } from "@/lib/webProjects/formCopy";
import { credentialStatusLabel, itemStatusLabel, itemTypeLabel, projectTypeLabel, workflowLabel } from "@/lib/webProjects/labels";
import {
  matchesNocReviewFilter,
  nocReviewMutationLocked,
  progressCopy,
  reviewProgressCopy,
  reviewStateForField,
  reviewStateForItem
} from "@/lib/webProjects/viewModel";
import type { WebProject } from "@/lib/webProjects/types";
import { NocReviewActions } from "./NocReviewActions";
import { setNocWebProjectCredentialStatus } from "@/lib/nocApi";
import { webProjectErrorMessage } from "@/lib/webProjects/errors";
import { FormEvent, useState } from "react";

const CREDENTIALS = ["NONE", "REQUESTED", "RECEIVED_OUT_OF_BAND", "VERIFIED", "REVOKED"] as const;

export function NocWebProjectHeader({ project }: { project: WebProject }) {
  const progress = progressCopy(project.progress);
  const review = reviewProgressCopy(project);
  return (
    <div className="noc-kpis">
      <div className="noc-kpi">
        <p className="noc-kpi__label">Tipo</p>
        <p className="noc-kpi__value">{projectTypeLabel(project.projectType)}</p>
      </div>
      <div className="noc-kpi">
        <p className="noc-kpi__label">Fase</p>
        <p className="noc-kpi__value">
          {workflowLabel(project.workflowStatus)} <code>{project.workflowStatus}</code>
        </p>
      </div>
      <div className="noc-kpi">
        <p className="noc-kpi__label">Dominio</p>
        <p className="noc-kpi__value">{project.websiteHostname || "—"}</p>
      </div>
      <div className="noc-kpi">
        <p className="noc-kpi__label">Recopilación</p>
        <p className="noc-kpi__value">
          {progress.completed} / {progress.required} · {progress.percentage} %
        </p>
      </div>
      <div className="noc-kpi">
        <p className="noc-kpi__label">Revisión</p>
        <p className="noc-kpi__value">
          {review.approved} ok · {review.correctionRequired} corrección · {review.pending} pend.
        </p>
      </div>
    </div>
  );
}

export function NocWebProjectFormRead({
  organizationId,
  project,
  filter = "ALL",
  onUpdated
}: {
  organizationId: number;
  project: WebProject;
  filter?: "ALL" | "PENDING" | "APPROVED" | "CORRECTION_REQUIRED";
  onUpdated: (project: WebProject) => void;
}) {
  const responses = project.form?.responses || [];
  const visible = responses.filter((row) =>
    matchesNocReviewFilter(reviewStateForField(project, row.fieldKey) || { status: "PENDING" }, filter)
  );
  if (!responses.length) return <NocEmpty title="Sin respuestas de formulario." />;
  if (!visible.length) return <NocEmpty title="Ninguna respuesta coincide con el filtro." />;
  const sections = project.sectionProgress?.length
    ? project.sectionProgress
    : [
        {
          id: "all",
          order: 0,
          label: "Formulario",
          hidden: false,
          required: 0,
          completed: 0,
          notApplicable: 0,
          pending: 0,
          percentage: 0,
          status: "partial",
          correction: false
        }
      ];
  return (
    <div className="noc-q">
      {sections
        .filter((section) => !section.hidden)
        .map((section) => {
          const rows = visible.filter((row) => (row.section || "all") === section.id || section.id === "all");
          if (!rows.length && section.id !== "all") return null;
          return (
            <section key={section.id} className="noc-q__section">
              <h3>
                {String(section.order || "").padStart(2, "0")} · {section.label}
                {section.correction ? " · Necesita revisión" : ""}
              </h3>
              <ul className="noc-stack">
                {rows.map((row) => (
                  <li key={row.fieldKey}>
                    <strong>{fieldTitle(row.fieldKey)}</strong>
                    <p>
                      {row.applicable === false
                        ? "No aplicable"
                        : optionLabel(unwrapFormValue(row.value)) || "—"}
                    </p>
                    <p className="noc-disclaimer">
                      {row.fieldKey}
                      {row.applicable === false ? " · no aplicable" : ""}
                    </p>
                    <NocReviewActions
                      organizationId={organizationId}
                      project={project}
                      state={reviewStateForField(project, row.fieldKey)}
                      targetType="FORM_FIELD"
                      targetKey={row.fieldKey}
                      onUpdated={onUpdated}
                    />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
    </div>
  );
}

export function NocWebProjectItemsRead({
  organizationId,
  project,
  filter = "ALL",
  onUpdated
}: {
  organizationId: number;
  project: WebProject;
  filter?: "ALL" | "PENDING" | "APPROVED" | "CORRECTION_REQUIRED";
  onUpdated: (project: WebProject) => void;
}) {
  const items = (project.items || []).filter((item) => !item.archivedAt);
  const visible = items.filter((item) =>
    matchesNocReviewFilter(reviewStateForItem(project, item.id) || { status: "PENDING" }, filter)
  );
  if (!items.length) return <NocEmpty title="Sin items." />;
  if (!visible.length) return <NocEmpty title="Ningún item coincide con el filtro." />;
  return (
    <ul className="noc-stack">
      {visible.map((item) => (
        <li key={item.id}>
          <strong>{item.title}</strong>
          <p className="noc-disclaimer">
            {itemTypeLabel(item.itemType)} · {itemStatusLabel(item.status)}
          </p>
          {item.payload && Object.keys(item.payload).length > 0 ? (
            <dl className="noc-payload">
              {Object.entries(item.payload).map(([key, value]) => (
                <div key={key}>
                  <dt>{key}</dt>
                  <dd>{typeof value === "string" || typeof value === "number" ? String(value) : "—"}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          <NocReviewActions
            organizationId={organizationId}
            project={project}
            state={reviewStateForItem(project, item.id)}
            targetType="ITEM"
            targetId={item.id}
            onUpdated={onUpdated}
          />
        </li>
      ))}
    </ul>
  );
}

export function NocWebProjectCredentials({
  organizationId,
  project,
  onUpdated
}: {
  organizationId: number;
  project: WebProject;
  onUpdated: (project: WebProject) => void;
}) {
  const current = project.credentialStatus?.status || "NONE";
  const [status, setStatus] = useState(String(current));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const locked = nocReviewMutationLocked(project);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const credentialStatus = await setNocWebProjectCredentialStatus(organizationId, project.id, status);
      onUpdated({ ...project, credentialStatus });
    } catch (err) {
      setError(webProjectErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="noc-panel">
      <div className="noc-panel__head">Accesos técnicos</div>
      <div className="noc-panel__body">
        <p>
          Estado: <strong>{credentialStatusLabel(current)}</strong> <code>{current}</code>
        </p>
        <p className="noc-disclaimer">
          Solo estado. No hay campos para contraseñas, tokens ni claves.
        </p>
        {locked ? null : (
          <form className="noc-form" onSubmit={onSubmit}>
            <label>
              Actualizar estado
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                {CREDENTIALS.map((item) => (
                  <option key={item} value={item}>
                    {credentialStatusLabel(item)} ({item})
                  </option>
                ))}
              </select>
            </label>
            {error ? (
              <p className="noc-disclaimer" role="alert">
                {error}
              </p>
            ) : null}
            <button type="submit" className="noc-btn noc-btn--primary" disabled={busy}>
              {busy ? "Guardando…" : "Guardar estado"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
