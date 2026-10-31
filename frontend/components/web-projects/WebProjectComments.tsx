"use client";

import { FormEvent, useState } from "react";
import { EmptyState } from "@/components/client/Status";
import { createWebProjectComment } from "@/lib/clientApi";
import { relativeTimeEs } from "@/lib/clientCopy";
import { webProjectErrorMessage } from "@/lib/webProjects/errors";
import type { WebProject, WebProjectComment } from "@/lib/webProjects/types";

export function WebProjectComments({
  project,
  comments,
  currentUserId,
  canCreate,
  onReload
}: {
  project: WebProject;
  comments: WebProjectComment[];
  currentUserId?: number | null;
  canCreate: boolean;
  onReload: () => Promise<void>;
}) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createWebProjectComment(project.id, body);
      setBody("");
      await onReload();
    } catch (err) {
      setError(webProjectErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="cp-card" aria-labelledby="wp-comments-heading">
      <h2 id="wp-comments-heading" className="wp-section-title">
        Comentarios generales
      </h2>
      <p className="cp-disclaimer">
        Conversación del expediente. Si ARGOS pide un cambio concreto, aparece junto al campo o documento, no aquí.
      </p>
      {comments.length === 0 ? <EmptyState title="Aún no hay comentarios." /> : null}
      {comments.length ? (
        <ul className="wp-list">
          {comments.map((comment) => (
            <li key={comment.id} className="wp-list__item wp-list__item--stack">
              <p>{comment.body}</p>
              <p className="cp-disclaimer">
                {comment.createdBy && comment.createdBy === currentUserId
                  ? "Tú"
                  : comment.createdBy
                    ? "Participante"
                    : "ARGOS"}{" "}
                · {relativeTimeEs(comment.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
      {canCreate ? (
        <form className="cp-form" onSubmit={(e) => void onSubmit(e)}>
          <label>
            Nuevo comentario
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              required
              placeholder="Escribe el mensaje. No incluyas contraseñas ni claves."
            />
          </label>
          {error ? (
            <p className="wp-field-error" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" className="cp-btn cp-btn--primary" disabled={saving}>
            {saving ? "Enviando…" : "Publicar comentario"}
          </button>
        </form>
      ) : null}
    </section>
  );
}
