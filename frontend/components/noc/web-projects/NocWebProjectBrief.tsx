"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  createNocWebProjectBriefNote,
  fetchNocWebProjectBrief,
  startNocWebProjectArchitecture,
  updateNocWebProjectBriefNote
} from "@/lib/nocApi";
import { webProjectErrorMessage } from "@/lib/webProjects/errors";
import {
  architectureReadinessLabel,
  briefNoteStatusLabel,
  briefNoteTypeLabel,
  contentReadinessLabel,
  credentialStatusLabel,
  projectTypeLabel,
  reviewStatusLabel,
  scopeStateLabel,
  workflowLabel
} from "@/lib/webProjects/labels";
import { fieldTitle } from "@/lib/webProjects/formCopy";
import type {
  ArchitectureIssue,
  WebProject,
  WebProjectBriefNote,
  WebProjectBriefPayload
} from "@/lib/webProjects/types";

const NOTE_TYPES = [
  "ARCHITECTURE_NOTE",
  "ASSUMPTION",
  "EXCLUSION",
  "RISK",
  "DECISION_REQUIRED"
] as const;

function sourcedText(value: { value?: string } | string | undefined) {
  if (!value) return "Pendiente de definir";
  if (typeof value === "string") return value;
  return value.value || "Pendiente de definir";
}

function issueHref(issue: ArchitectureIssue) {
  if (issue.sourceType === "FORM_FIELD" && issue.sourceKey) return `#wp-field-${issue.sourceKey}`;
  if (issue.sourceType === "ITEM" && issue.sourceId) return `#wp-item-${issue.sourceId}`;
  if (issue.sourceType === "DOCUMENT" && issue.sourceId) return `#wp-doc-${issue.sourceId}`;
  if (issue.sourceType === "NOTE" && issue.sourceId) return `#noc-note-${issue.sourceId}`;
  return "#noc-brief-open";
}

function issueLabel(issue: ArchitectureIssue) {
  if (issue.sourceType === "FORM_FIELD" && issue.sourceKey) return fieldTitle(issue.sourceKey);
  return issue.label;
}

export function NocWebProjectBrief({
  organizationId,
  project,
  payload,
  onProjectUpdated,
  onBriefUpdated
}: {
  organizationId: number;
  project: WebProject;
  payload: WebProjectBriefPayload | null;
  onProjectUpdated: (project: WebProject) => void;
  onBriefUpdated: (payload: WebProjectBriefPayload) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [noteType, setNoteType] = useState<(typeof NOTE_TYPES)[number]>("ASSUMPTION");
  const [noteContent, setNoteContent] = useState("");
  const [noteBlocking, setNoteBlocking] = useState(false);
  const [noteSeverity, setNoteSeverity] = useState("MEDIUM");

  const brief = payload?.brief || null;
  const readiness = payload?.architectureReadiness || brief?.architectureReadiness;
  const state = readiness?.state || "NOT_READY";
  const canMutate = !project.archivedAt && project.workflowStatus !== "COMPLETED";
  const canStart = canMutate && project.workflowStatus === "REVIEW";

  const inventory = brief?.contentInventory;
  const summary = brief?.executiveSummary;

  const groupedNotes = useMemo(() => {
    const notes = payload?.notes || [];
    return {
      decisions: notes.filter((note) => note.noteType === "DECISION_REQUIRED"),
      risks: notes.filter((note) => note.noteType === "RISK"),
      assumptions: notes.filter((note) => note.noteType === "ASSUMPTION"),
      exclusions: notes.filter((note) => note.noteType === "EXCLUSION"),
      architecture: notes.filter((note) => note.noteType === "ARCHITECTURE_NOTE")
    };
  }, [payload?.notes]);

  async function reload() {
    onBriefUpdated(await fetchNocWebProjectBrief(organizationId, project.id));
  }

  async function onAddNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createNocWebProjectBriefNote(organizationId, project.id, {
        noteType,
        content: noteContent,
                blocking: noteType === "DECISION_REQUIRED" ? noteBlocking : false,
        severity: noteType === "RISK" ? noteSeverity : null
      });
      setNoteContent("");
      await reload();
    } catch (err) {
      setError(webProjectErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onResolve(note: WebProjectBriefNote) {
    setBusy(true);
    setError(null);
    try {
      await updateNocWebProjectBriefNote(organizationId, project.id, note.id, {
        status: "RESOLVED",
        resolutionNote: "Resuelto desde el brief."
      });
      await reload();
    } catch (err) {
      setError(webProjectErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onStart() {
    setBusy(true);
    setError(null);
    try {
      const updated = await startNocWebProjectArchitecture(organizationId, project.id, {
        acknowledgeOpenItems: state === "READY_WITH_OPEN_ITEMS",
        reason: state === "READY_WITH_OPEN_ITEMS" ? reason : undefined
      });
      onProjectUpdated(updated);
      await reload();
      setConfirmOpen(false);
      setReason("");
    } catch (err) {
      setError(webProjectErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!brief || !readiness) {
    return (
      <section className="noc-panel noc-brief" id="noc-brief">
        <div className="noc-panel__head">
          <h2>Brief del proyecto</h2>
        </div>
        <div className="noc-panel__body">
          <p className="noc-disclaimer">No se ha podido cargar el brief.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="noc-panel noc-brief" id="noc-brief">
      <div className="noc-panel__head">
        <h2>Brief del proyecto</h2>
      </div>
      <div className="noc-panel__body">
        <div className="noc-brief__header">
          <p>
            <strong>{brief.header.title}</strong> · {projectTypeLabel(brief.header.projectType)} ·{" "}
            {workflowLabel(brief.header.workflowStatus)}
          </p>
          <p>
            Recopilación {brief.header.collectionPercentage} % · Revisión{" "}
            {brief.header.reviewSummary?.approved || 0} aprobados ·{" "}
            {brief.header.reviewSummary?.correctionRequired || 0} corrección ·{" "}
            {brief.header.reviewSummary?.pending || 0} pendientes
          </p>
          <p
            className={`noc-brief__ready noc-brief__ready--${state.toLowerCase()}`}
            data-state={state}
            role="status"
          >
            Preparación arquitectura: {architectureReadinessLabel(state)}
          </p>
          <div className="noc-actions">
            <button type="button" className="noc-btn" onClick={() => window.print()}>
              Imprimir brief
            </button>
            {canStart ? (
              <button
                type="button"
                className="noc-btn noc-btn--primary"
                disabled={state === "NOT_READY" || busy}
                onClick={() => setConfirmOpen(true)}
              >
                Preparar arquitectura
              </button>
            ) : null}
          </div>
        </div>

        <section id="noc-brief-open" className="noc-brief__block">
          <h3>Antes de arquitectura</h3>
          {(readiness.blockers || []).length === 0 && (readiness.warnings || []).length === 0 ? (
            <p>No hay bloqueos ni avisos operativos.</p>
          ) : (
            <ul className="noc-brief__issues">
              {(readiness.blockers || []).map((issue) => (
                <li key={`b-${issue.code}-${issue.sourceKey}-${issue.sourceId}`}>
                  <strong>Bloqueo.</strong> {issue.label}{" "}
                  <a href={issueHref(issue)}>{issueLabel(issue)}</a>
                </li>
              ))}
              {(readiness.warnings || []).map((issue) => (
                <li key={`w-${issue.code}-${issue.sourceKey}-${issue.sourceId}`}>
                  Aviso. {issue.label}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="noc-brief__block" data-section="summary">
          <h3>Resumen ejecutivo</h3>
          <dl className="noc-brief__dl">
            <div>
              <dt>Proyecto</dt>
              <dd>{summary?.project}</dd>
            </div>
            <div>
              <dt>Tipo</dt>
              <dd>{projectTypeLabel(summary?.projectType)}</dd>
            </div>
            <div>
              <dt>Web actual</dt>
              <dd>{summary?.currentWebsite}</dd>
            </div>
            <div>
              <dt>Objetivo</dt>
              <dd>{sourcedText(summary?.primaryObjective)}</dd>
            </div>
            <div>
              <dt>Audiencia</dt>
              <dd>{sourcedText(summary?.audience)}</dd>
            </div>
            <div>
              <dt>Modelo</dt>
              <dd>{sourcedText(summary?.businessModel)}</dd>
            </div>
            <div>
              <dt>Idiomas</dt>
              <dd>{sourcedText(summary?.languages)}</dd>
            </div>
            <div>
              <dt>Contenido principal</dt>
              <dd>{sourcedText(summary?.mainContentTypes)}</dd>
            </div>
            <div>
              <dt>Ventas / reservas</dt>
              <dd>{sourcedText(summary?.salesRequirement)}</dd>
            </div>
            <div>
              <dt>Integraciones</dt>
              <dd>{sourcedText(summary?.keyIntegrations)}</dd>
            </div>
          </dl>
        </section>

        <section className="noc-brief__block" data-section="scope">
          <h3>Alcance</h3>
          <ul className="noc-brief__scope">
            {(brief.scopeMatrix || []).map((row) => (
              <li key={row.id}>
                <span>{row.label}</span>
                <span>{scopeStateLabel(row.state)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="noc-brief__block" data-section="inventory">
          <h3>Inventario de contenido</h3>
          <p>
            Páginas: {inventory?.pages || 0} · Servicios: {inventory?.services || 0} · Productos:{" "}
            {inventory?.products || 0} · Actividades: {inventory?.activities || 0} · Equipo:{" "}
            {inventory?.teamMembers || 0} · Ubicaciones: {inventory?.locations || 0} · Documentos:{" "}
            {inventory?.documents || 0}
          </p>
          <ul>
            {(brief.contentGroups || []).map((group) => (
              <li key={group.id}>
                {group.label}: {contentReadinessLabel(group.status)}
              </li>
            ))}
          </ul>
        </section>

        <section className="noc-brief__block" data-section="pages">
          <h3>Páginas (entrada a arquitectura)</h3>
          {(brief.pages || []).length === 0 ? (
            <p className="noc-disclaimer">Sin páginas propuestas todavía. No es el sitemap final.</p>
          ) : (
            <div className="noc-brief__table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Página</th>
                    <th>Propósito</th>
                    <th>Intención</th>
                    <th>CTA</th>
                    <th>Contenido</th>
                    <th>Revisión</th>
                  </tr>
                </thead>
                <tbody>
                  {(brief.pages || []).map((page) => (
                    <tr key={page.id}>
                      <td>{page.title}</td>
                      <td>{page.purpose}</td>
                      <td>{page.intent}</td>
                      <td>{page.cta}</td>
                      <td>{contentReadinessLabel(page.contentReadiness)}</td>
                      <td>{reviewStatusLabel(page.reviewStatus)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {(brief.tours || []).length > 0 ? (
          <section className="noc-brief__block">
            <h3>Actividades</h3>
            <ul>
              {brief.tours.map((tour) => (
                <li key={String(tour.id)}>
                  {String(tour.title)} · destino {String(tour.destination)} · precio{" "}
                  {String(tour.price_adult)} · disponibilidad {String(tour.availability)}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {(brief.services || []).length > 0 ? (
          <section className="noc-brief__block">
            <h3>Servicios</h3>
            <ul>
              {brief.services.map((item) => (
                <li key={String(item.id)}>
                  {String(item.title)} · {String(item.audience)} · CTA {String(item.cta)}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {(brief.products || []).length > 0 ? (
          <section className="noc-brief__block">
            <h3>Productos</h3>
            <ul>
              {brief.products.map((item) => (
                <li key={String(item.id)}>
                  {String(item.title)} · {String(item.category)} · {String(item.price)}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="noc-brief__block">
          <h3>Legal / SEO / accesos</h3>
          <p>
            Aviso legal: {brief.legal?.notice} · Privacidad: {brief.legal?.privacy} · Cookies:{" "}
            {brief.legal?.cookies}
          </p>
          <p className="noc-disclaimer">{brief.legal?.disclaimer}</p>
          <p>
            Mercados SEO: {sourcedText(brief.seo?.markets as { value?: string })} · Palabras:{" "}
            {sourcedText(brief.seo?.keywords as { value?: string })}
          </p>
          <p className="noc-disclaimer">{String(brief.seo?.disclaimer || "")}</p>
          <ul>
            {(brief.technicalAccess?.statuses || []).map((row) => (
              <li key={row.service}>
                {row.service}: {credentialStatusLabel(row.status) === row.status ? row.status : credentialStatusLabel(row.status)}
              </li>
            ))}
          </ul>
        </section>

        <section className="noc-brief__block" id="noc-brief-notes">
          <h3>Notas internas ARGOS</h3>
          <p className="noc-disclaimer">No visibles para el cliente.</p>
          <NoteList title="Decisiones" notes={groupedNotes.decisions} onResolve={canMutate ? onResolve : undefined} />
          <NoteList title="Riesgos" notes={groupedNotes.risks} onResolve={canMutate ? onResolve : undefined} />
          <NoteList title="Asunciones" notes={groupedNotes.assumptions} onResolve={canMutate ? onResolve : undefined} />
          <NoteList title="Exclusiones" notes={groupedNotes.exclusions} onResolve={canMutate ? onResolve : undefined} />
          <NoteList title="Arquitectura" notes={groupedNotes.architecture} onResolve={canMutate ? onResolve : undefined} />
          {canMutate ? (
            <form className="noc-brief__note-form" onSubmit={(event) => void onAddNote(event)}>
              <label>
                Tipo
                <select
                  value={noteType}
                  onChange={(e) => {
                    const next = e.target.value as (typeof NOTE_TYPES)[number];
                    setNoteType(next);
                    if (next === "DECISION_REQUIRED") setNoteBlocking(true);
                  }}
                >
                  {NOTE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {briefNoteTypeLabel(type)}
                    </option>
                  ))}
                </select>
              </label>
              {noteType === "RISK" ? (
                <label>
                  Severidad
                  <select value={noteSeverity} onChange={(e) => setNoteSeverity(e.target.value)}>
                    <option value="LOW">Baja</option>
                    <option value="MEDIUM">Media</option>
                    <option value="HIGH">Alta</option>
                  </select>
                </label>
              ) : null}
              {noteType === "DECISION_REQUIRED" ? (
                <label>
                  <input
                    type="checkbox"
                    checked={noteBlocking}
                    onChange={(e) => setNoteBlocking(e.target.checked)}
                  />{" "}
                  Bloquea arquitectura
                </label>
              ) : null}
              <label htmlFor="noc-brief-note-content">
                Contenido
                <textarea
                  id="noc-brief-note-content"
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  required
                />
              </label>
              <button type="submit" className="noc-btn" id="noc-brief-note-submit" disabled={busy}>
                Añadir nota
              </button>
            </form>
          ) : (
            <p className="noc-disclaimer">Expediente de solo lectura. Sin notas nuevas.</p>
          )}
        </section>

        {payload?.handoff ? (
          <p className="noc-disclaimer">
            Handoff de arquitectura guardado el {payload.handoff.createdAt}. No contiene secretos ni claves de
            objeto.
          </p>
        ) : null}

        {error ? (
          <p className="noc-disclaimer" role="alert">
            {error}
          </p>
        ) : null}

        {confirmOpen ? (
          <div className="noc-brief__dialog" role="dialog" aria-modal="true" aria-labelledby="noc-arch-title">
            <h3 id="noc-arch-title">Preparar arquitectura</h3>
            <p>Estado: {architectureReadinessLabel(state)}</p>
            {(readiness.blockers || []).length > 0 ? (
              <ul>
                {readiness.blockers.map((issue) => (
                  <li key={issue.code}>{issue.label}</li>
                ))}
              </ul>
            ) : null}
            {state === "READY_WITH_OPEN_ITEMS" ? (
              <label>
                Motivo (obligatorio con avisos)
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} required />
              </label>
            ) : null}
            <div className="noc-actions">
              <button
                type="button"
                className="noc-btn noc-btn--primary"
                disabled={busy || state === "NOT_READY" || (state === "READY_WITH_OPEN_ITEMS" && !reason.trim())}
                onClick={() => void onStart()}
              >
                Confirmar
              </button>
              <button type="button" className="noc-btn" onClick={() => setConfirmOpen(false)}>
                Cancelar
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function NoteList({
  title,
  notes,
  onResolve
}: {
  title: string;
  notes: WebProjectBriefNote[];
  onResolve?: (note: WebProjectBriefNote) => void;
}) {
  if (!notes.length) return null;
  return (
    <div>
      <h4>{title}</h4>
      <ul>
        {notes.map((note) => (
          <li key={note.id} id={`noc-note-${note.id}`}>
            <strong>{briefNoteTypeLabel(note.noteType)}</strong> · {briefNoteStatusLabel(note.status)} · {note.content}
            {note.status === "OPEN" && onResolve ? (
              <button type="button" className="noc-btn" onClick={() => onResolve(note)}>
                Resolver
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

