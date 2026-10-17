"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { saveWebProjectForm, submitWebProjectReview } from "@/lib/clientApi";
import { questionnaireOverviewCopy, sectionNavStatusLabel } from "@/lib/webProjects/itemEditors";
import { webProjectErrorMessage } from "@/lib/webProjects/errors";
import { isFieldApplicableFromDefinition } from "@/lib/webProjects/formCopy";
import {
  openCorrectionStates,
  reviewStateForField,
  visibleFormFields
} from "@/lib/webProjects/viewModel";
import type { WebProject, WebProjectFormDefinition, WebProjectSectionProgress } from "@/lib/webProjects/types";
import { WebProjectDocuments } from "./WebProjectDocuments";
import { WebProjectField } from "./WebProjectField";
import { WebProjectForm } from "./WebProjectForm";
import { WebProjectItems } from "./WebProjectItems";
import { WebProjectTypedItems } from "./WebProjectTypedItems";

export function WebProjectQuestionnaire({
  project,
  formDefinition,
  readOnly,
  canItems,
  canUpload,
  onUpdated,
  onReload
}: {
  project: WebProject;
  formDefinition?: WebProjectFormDefinition | null;
  readOnly: boolean;
  canItems: boolean;
  canUpload: boolean;
  onUpdated: (project: WebProject) => void;
  onReload: () => Promise<void>;
}) {
  const sections = formDefinition?.sections || [];
  const isV2 = sections.length > 0;
  const [active, setActive] = useState(sections[0]?.id || "company");
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const [saveState, setSaveState] = useState<Record<string, "idle" | "saving" | "saved" | "error">>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitBusy, setSubmitBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [thanks, setThanks] = useState(false);

  const sectionProgress = project.sectionProgress || [];
  const visibleSections = sectionProgress.filter((section) => !section.hidden);
  const values = useMemo(() => {
    const map = new Map<string, unknown>();
    for (const row of project.form?.responses || []) map.set(row.fieldKey, row.value);
    return map;
  }, [project.form?.responses]);

  useEffect(() => {
    if (!visibleSections.some((section) => section.id === active) && visibleSections[0]) {
      setActive(visibleSections[0].id);
    }
  }, [active, visibleSections]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [active]);

  const fields = useMemo(
    () =>
      visibleFormFields(formDefinition, project.form?.responses, { projectType: project.projectType }).filter(
        (entry) => entry.field.section === active
      ),
    [formDefinition, project.form?.responses, project.projectType, active]
  );

  const activeDef = sections.find((section) => section.id === active);
  const activeProgress = sectionProgress.find((section) => section.id === active);
  const itemTypesHere = (formDefinition?.itemBindings || [])
    .filter((bind) => bind.section === active)
    .filter((bind) => isFieldApplicableFromDefinition(bind, values, { projectType: project.projectType }))
    .map((bind) => bind.itemType);

  const showDocuments = ["brand", "content", "media", "legal"].includes(active);
  const showSubmit = active === "review";
  const fieldLocked = (fieldKey: string) => {
    if (readOnly) return true;
    if (project.workflowStatus === "INTAKE") return false;
    if (project.workflowStatus === "REVIEW") {
      return reviewStateForField(project, fieldKey)?.status !== "CORRECTION_REQUIRED";
    }
    return true;
  };

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

  async function onSubmit() {
    setSubmitBusy(true);
    setSubmitError(null);
    try {
      const updated = await submitWebProjectReview(project.id);
      onUpdated(updated);
      setConfirmOpen(false);
      setThanks(true);
    } catch (err) {
      setSubmitError(webProjectErrorMessage(err));
    } finally {
      setSubmitBusy(false);
    }
  }

  if (!isV2) {
    return (
      <>
        <WebProjectForm
          project={project}
          formDefinition={formDefinition}
          readOnly={readOnly}
          onUpdated={onUpdated}
        />
        <WebProjectItems project={project} items={project.items || []} canMutate={canItems} onReload={onReload} />
        <WebProjectDocuments
          project={project}
          documents={project.documents || []}
          canUpload={canUpload}
          onReload={onReload}
        />
      </>
    );
  }

  const completeCount = visibleSections.filter((section) => section.status === "complete").length;
  const pendingCount = visibleSections.filter(
    (section) => section.status === "partial" || section.status === "empty"
  ).length;
  const correctionCount = openCorrectionStates(project).length;

  return (
    <section className="wp-questionnaire" aria-labelledby="wp-questionnaire-title">
      <div className="wp-questionnaire__intro">
        <h2 id="wp-questionnaire-title" className="wp-section-title">
          Tu proyecto
        </h2>
        <p className="cp-disclaimer">
          {questionnaireOverviewCopy({
            percentage: project.progress?.percentage ?? 0,
            sectionsComplete: completeCount,
            sectionsTotal: visibleSections.length || 16,
            pending: pendingCount,
            corrections: correctionCount
          })}
        </p>
        <p className="cp-disclaimer">
          ARGOS te va guiando paso a paso. Puedes saltar entre apartados y guardar cuando quieras.
        </p>
      </div>
      <div className="wp-questionnaire__layout">
        <nav className="wp-qnav" aria-label="Apartados del cuestionario">
          <div className="wp-qnav__mobile">
            <label htmlFor="wp-qnav-select">Apartado</label>
            <select
              id="wp-qnav-select"
              value={active}
              onChange={(e) => setActive(e.target.value)}
            >
              {visibleSections.map((section) => (
                <option key={section.id} value={section.id}>
                  {String(section.order).padStart(2, "0")} · {section.label} ·{" "}
                  {sectionNavStatusLabel(section.status, section.correction)}
                </option>
              ))}
            </select>
          </div>
          <ol className="wp-qnav__list">
            {visibleSections.map((section) => (
              <li key={section.id}>
                <button
                  type="button"
                  className={
                    section.id === active
                      ? "wp-qnav__btn wp-qnav__btn--active"
                      : section.correction
                        ? "wp-qnav__btn wp-qnav__btn--correction"
                        : "wp-qnav__btn"
                  }
                  aria-current={section.id === active ? "step" : undefined}
                  onClick={() => setActive(section.id)}
                >
                  <span className="wp-qnav__index">{String(section.order).padStart(2, "0")}</span>
                  <span className="wp-qnav__label">{section.label}</span>
                  <span className="wp-qnav__status">{sectionNavStatusLabel(section.status, section.correction)}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
        <div className="wp-qpanel">
          <h3 ref={headingRef} tabIndex={-1} className="wp-qpanel__title" id={`wp-section-${active}`}>
            {String(activeDef?.order || activeProgress?.order || "").padStart(2, "0")} · {activeDef?.label || activeProgress?.label}
          </h3>
          {activeDef?.description ? <p className="cp-disclaimer">{activeDef.description}</p> : null}
          {fields.length === 0 && itemTypesHere.length === 0 && !showDocuments && !showSubmit ? (
            <p className="cp-disclaimer">No hay preguntas aplicables en este apartado ahora mismo.</p>
          ) : (
            <div className="wp-form-stack">
              {fields.map((entry) => (
                <WebProjectField
                  key={entry.field.key}
                  field={entry.field}
                  value={entry.value}
                  readOnly={fieldLocked(entry.field.key)}
                  saveState={saveState[entry.field.key] || "idle"}
                  error={errors[entry.field.key]}
                  review={reviewStateForField(project, entry.field.key)}
                  onSave={(next) => void onSave(entry.field.key, next)}
                />
              ))}
            </div>
          )}
          {itemTypesHere.map((itemType) => (
            <WebProjectTypedItems
              key={itemType}
              project={project}
              formDefinition={formDefinition}
              itemType={itemType}
              canCreate={canItems}
              canMutate={canItems || (!readOnly && project.workflowStatus === "REVIEW")}
              onReload={onReload}
            />
          ))}
          {showDocuments ? (
            <WebProjectDocuments
              project={project}
              documents={project.documents || []}
              canUpload={canUpload}
              onReload={onReload}
            />
          ) : null}
          {showSubmit ? (
            <div className="wp-submit">
              {project.workflowStatus === "REVIEW" && correctionCount > 0 ? (
                <p role="status">
                  ARGOS ha pedido algunos cambios. Corrige lo marcado y guarda. El expediente sigue en revisión.
                </p>
              ) : thanks || project.workflowStatus === "REVIEW" ? (
                <p role="status">Gracias. Hemos recibido la información para revisarla.</p>
              ) : (
                <>
                  <p>
                    Cuando envíes, ARGOS revisará lo que has contado. No significa que tu web esté en desarrollo.
                  </p>
                  <button
                    type="button"
                    className="cp-btn"
                    disabled={readOnly || project.workflowStatus !== "INTAKE"}
                    onClick={() => setConfirmOpen(true)}
                  >
                    Enviar a ARGOS para revisión
                  </button>
                </>
              )}
              {submitError ? (
                <p className="wp-field-error" role="alert">
                  {submitError}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      {confirmOpen ? (
        <div className="wp-modal" role="dialog" aria-modal="true" aria-labelledby="wp-submit-title">
          <div className="wp-modal__card">
            <h3 id="wp-submit-title">Enviar a ARGOS para revisión</h3>
            <p>
              Información completada: {project.progress?.percentage ?? 0}%. Secciones completas: {completeCount}/
              {visibleSections.length}. Correcciones abiertas: {correctionCount}.
            </p>
            <p className="cp-disclaimer">No se enviarán contraseñas. ARGOS revisará el material para preparar el proyecto.</p>
            <div className="wp-actions">
              <button type="button" className="cp-btn" disabled={submitBusy} onClick={() => void onSubmit()}>
                {submitBusy ? "Enviando…" : "Confirmar envío"}
              </button>
              <button type="button" className="cp-btn cp-btn--secondary" onClick={() => setConfirmOpen(false)}>
                Seguir editando
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function visibleQuestionnaireSections(
  sections: WebProjectSectionProgress[] | undefined
): WebProjectSectionProgress[] {
  return (sections || []).filter((section) => !section.hidden);
}
