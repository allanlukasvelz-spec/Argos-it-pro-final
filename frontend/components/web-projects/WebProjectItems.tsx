"use client";

import { FormEvent, useState } from "react";
import { EmptyState } from "@/components/client/Status";
import { archiveWebProjectItem, createWebProjectItem, updateWebProjectItem } from "@/lib/clientApi";
import { webProjectErrorMessage } from "@/lib/webProjects/errors";
import { ITEM_TYPES, itemStatusLabel, itemTypeLabel } from "@/lib/webProjects/labels";
import { reviewStateForItem } from "@/lib/webProjects/viewModel";
import type { WebProject, WebProjectItem } from "@/lib/webProjects/types";
import { WebProjectReviewStatus } from "./WebProjectReviewStatus";

function payloadEntries(payload: Record<string, unknown>): { key: string; value: string }[] {
  return Object.entries(payload || {}).map(([key, value]) => ({
    key,
    value: typeof value === "string" ? value : JSON.stringify(value)
  }));
}

export function WebProjectItems({
  project,
  items,
  canMutate,
  onReload
}: {
  project: WebProject;
  items: WebProjectItem[];
  canMutate: boolean;
  onReload: () => Promise<void>;
}) {
  const visible = items.filter((item) => !item.archivedAt);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [itemType, setItemType] = useState("page");
  const [detail, setDetail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createWebProjectItem(project.id, {
        itemType,
        title,
        payload: detail.trim() ? { notes: detail.trim() } : {}
      });
      setTitle("");
      setDetail("");
      setCreating(false);
      await onReload();
    } catch (err) {
      setError(webProjectErrorMessage(err));
    }
  }

  async function onArchive(item: WebProjectItem) {
    setError(null);
    try {
      await archiveWebProjectItem(project.id, item.id);
      await onReload();
    } catch (err) {
      setError(webProjectErrorMessage(err));
    }
  }

  async function onSaveEdit(item: WebProjectItem) {
    setError(null);
    try {
      await updateWebProjectItem(project.id, item.id, { title: editTitle });
      setEditingId(null);
      await onReload();
    } catch (err) {
      setError(webProjectErrorMessage(err));
    }
  }

  return (
    <section className="cp-card" aria-labelledby="wp-items-heading">
      <div className="wp-section-head">
        <h2 id="wp-items-heading" className="wp-section-title">
          Servicios / contenidos
        </h2>
        {canMutate ? (
          <button type="button" className="cp-btn cp-btn--secondary" onClick={() => setCreating((v) => !v)}>
            Añadir
          </button>
        ) : null}
      </div>
      <p className="cp-disclaimer">
        Páginas, servicios, tours u otros contenidos que deba incluir la web. El mismo formulario sirve para
        cualquier tipo.
      </p>
      {creating ? (
        <form className="cp-form wp-nested" onSubmit={(e) => void onCreate(e)}>
          <label>
            Tipo
            <select value={itemType} onChange={(e) => setItemType(e.target.value)}>
              {ITEM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {itemTypeLabel(type)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Título
            <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={180} />
          </label>
          <label>
            Detalle opcional
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              rows={3}
              placeholder={
                itemType === "tour"
                  ? "Por ejemplo: punto de encuentro, duración o público"
                  : "Notas estructuradas del contenido"
              }
            />
          </label>
          <button type="submit" className="cp-btn cp-btn--primary">
            Guardar elemento
          </button>
        </form>
      ) : null}
      {error ? (
        <p className="wp-field-error" role="alert">
          {error}
        </p>
      ) : null}
      {visible.length === 0 ? (
        <EmptyState title="Aún no hay contenidos añadidos." />
      ) : (
        <ul className="wp-list">
          {visible.map((item) => {
            const review = reviewStateForItem(project, item.id);
            const needsCorrection = review?.status === "CORRECTION_REQUIRED";
            return (
            <li
              key={item.id}
              id={`wp-item-${item.id}`}
              className={needsCorrection ? "wp-list__item wp-field--correction" : "wp-list__item"}
            >
              <div>
                <strong>{item.title}</strong>
                <WebProjectReviewStatus state={review} emphasizeCorrection />
                {needsCorrection && review?.correctionMessage ? (
                  <p className="wp-correction-msg" role="status">
                    Mensaje ARGOS: {review.correctionMessage}
                  </p>
                ) : null}
                <p className="cp-disclaimer">
                  {itemTypeLabel(item.itemType)} · {itemStatusLabel(item.status)}
                </p>
                {payloadEntries(item.payload).length ? (
                  <ul className="wp-payload">
                    {payloadEntries(item.payload).map((row) => (
                      <li key={row.key}>
                        <span>{row.key}:</span> {row.value}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              {canMutate ? (
                <div className="wp-actions">
                  {editingId === item.id ? (
                    <>
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        aria-label="Nuevo título"
                      />
                      <button type="button" className="cp-btn cp-btn--primary" onClick={() => void onSaveEdit(item)}>
                        Guardar
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="cp-btn cp-btn--secondary"
                      onClick={() => {
                        setEditingId(item.id);
                        setEditTitle(item.title);
                      }}
                    >
                      Editar
                    </button>
                  )}
                  <button type="button" className="cp-btn cp-btn--secondary" onClick={() => void onArchive(item)}>
                    Archivar
                  </button>
                </div>
              ) : null}
            </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
