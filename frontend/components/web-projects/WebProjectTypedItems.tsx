"use client";

import { FormEvent, useMemo, useState } from "react";
import { EmptyState } from "@/components/client/Status";
import { archiveWebProjectItem, createWebProjectItem, updateWebProjectItem } from "@/lib/clientApi";
import { ITEM_ADD_LABEL, ITEM_EDITOR_FIELDS, ITEM_EMPTY_COPY } from "@/lib/webProjects/itemEditors";
import { webProjectErrorMessage } from "@/lib/webProjects/errors";
import { itemPayloadLabel } from "@/lib/webProjects/formCopy";
import { isFieldApplicableFromDefinition } from "@/lib/webProjects/formCopy";
import { itemStatusLabel, itemTypeLabel } from "@/lib/webProjects/labels";
import { reviewStateForItem } from "@/lib/webProjects/viewModel";
import type { WebProject, WebProjectFormDefinition, WebProjectItem } from "@/lib/webProjects/types";
import { WebProjectReviewStatus } from "./WebProjectReviewStatus";

function payloadFromForm(data: FormData, keys: string[]): Record<string, string> {
  const payload: Record<string, string> = {};
  for (const key of keys) {
    const value = String(data.get(key) || "").trim();
    if (value) payload[key] = value;
  }
  return payload;
}

export function WebProjectTypedItems({
  project,
  formDefinition,
  itemType,
  canCreate,
  canMutate,
  onReload
}: {
  project: WebProject;
  formDefinition?: WebProjectFormDefinition | null;
  itemType: string;
  canCreate: boolean;
  canMutate: boolean;
  onReload: () => Promise<void>;
}) {
  const binding = (formDefinition?.itemBindings || []).find((row) => row.itemType === itemType);
  const values = useMemo(() => {
    const map = new Map<string, unknown>();
    for (const row of project.form?.responses || []) map.set(row.fieldKey, row.value);
    return map;
  }, [project.form?.responses]);
  const applicable = !binding || isFieldApplicableFromDefinition(binding, values, { projectType: project.projectType });
  const items = (project.items || []).filter((item) => !item.archivedAt && item.itemType === itemType);
  const fields = ITEM_EDITOR_FIELDS[itemType] || ["notes"];
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  if (!applicable) return null;

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const title = String(data.get("title") || "").trim();
    setError(null);
    try {
      await createWebProjectItem(project.id, {
        itemType,
        title,
        payload: payloadFromForm(data, fields)
      });
      setOpen(false);
      await onReload();
    } catch (err) {
      setError(webProjectErrorMessage(err));
    }
  }

  async function onSaveEdit(e: FormEvent<HTMLFormElement>, item: WebProjectItem) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setError(null);
    try {
      await updateWebProjectItem(project.id, item.id, {
        title: String(data.get("title") || item.title),
        payload: payloadFromForm(data, fields)
      });
      setEditingId(null);
      await onReload();
    } catch (err) {
      setError(webProjectErrorMessage(err));
    }
  }

  async function onArchive(item: WebProjectItem) {
    if (!window.confirm(`¿Archivar «${item.title}»? Seguirá en el histórico.`)) return;
    setError(null);
    try {
      await archiveWebProjectItem(project.id, item.id);
      await onReload();
    } catch (err) {
      setError(webProjectErrorMessage(err));
    }
  }

  return (
    <div className="wp-item-block">
      <div className="wp-section-head">
        <h3 className="wp-item-block__title">{itemTypeLabel(itemType)}</h3>
        {canCreate ? (
          <button type="button" className="cp-btn cp-btn--secondary" onClick={() => setOpen((v) => !v)}>
            {ITEM_ADD_LABEL[itemType] || "Añadir"}
          </button>
        ) : null}
      </div>
      {error ? (
        <p className="wp-field-error" role="alert">
          {error}
        </p>
      ) : null}
      {open ? (
        <form className="cp-form wp-nested" onSubmit={(e) => void onCreate(e)}>
          <label>
            Nombre
            <input name="title" required maxLength={180} />
          </label>
          {fields.map((key) => (
            <label key={key}>
              {itemPayloadLabel(key)}
              <textarea name={key} rows={key === "description" || key === "itinerary" ? 4 : 2} />
            </label>
          ))}
          <button type="submit" className="cp-btn">
            Guardar
          </button>
        </form>
      ) : null}
      {items.length === 0 ? (
        <EmptyState title={ITEM_EMPTY_COPY[itemType] || "Aún no hay elementos."} />
      ) : (
        <ul className="wp-list">
          {items.map((item) => {
            const review = reviewStateForItem(project, item.id);
            const editing = editingId === item.id;
            return (
              <li key={item.id} id={`wp-item-${item.id}`} className="wp-list__item wp-list__item--stack">
                <strong>{item.title}</strong>
                <p className="cp-disclaimer">
                  {itemStatusLabel(item.status)}
                </p>
                <WebProjectReviewStatus state={review} emphasizeCorrection />
                {review?.status === "CORRECTION_REQUIRED" && review.correctionMessage ? (
                  <p className="wp-correction-msg">ARGOS necesita que revises este dato. {review.correctionMessage}</p>
                ) : null}
                {!editing && item.payload && Object.keys(item.payload).length > 0 ? (
                  <dl className="wp-payload-dl">
                    {Object.entries(item.payload).map(([key, value]) => (
                      <div key={key}>
                        <dt>{itemPayloadLabel(key)}</dt>
                        <dd>{typeof value === "string" ? value : "—"}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
                {editing ? (
                  <form className="cp-form wp-nested" onSubmit={(e) => void onSaveEdit(e, item)}>
                    <label>
                      Nombre
                      <input name="title" defaultValue={item.title} required maxLength={180} />
                    </label>
                    {fields.map((key) => (
                      <label key={key}>
                        {itemPayloadLabel(key)}
                        <textarea
                          name={key}
                          rows={2}
                          defaultValue={typeof item.payload?.[key] === "string" ? String(item.payload[key]) : ""}
                        />
                      </label>
                    ))}
                    <div className="wp-actions">
                      <button type="submit" className="cp-btn">
                        Guardar cambios
                      </button>
                      <button type="button" className="cp-btn cp-btn--secondary" onClick={() => setEditingId(null)}>
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : null}
                {canMutate && !editing ? (
                  <div className="wp-actions">
                    <button type="button" className="cp-btn cp-btn--secondary" onClick={() => setEditingId(item.id)}>
                      Editar
                    </button>
                    {canCreate ? (
                      <button type="button" className="cp-btn cp-btn--secondary" onClick={() => void onArchive(item)}>
                        Archivar
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
