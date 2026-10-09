"use client";

import { FormEvent, useState } from "react";
import { NocEmpty } from "@/components/noc/NocUi";
import { relativeTimeEs } from "@/lib/clientCopy";
import { createNocWebProjectComment } from "@/lib/nocApi";
import { webProjectErrorMessage } from "@/lib/webProjects/errors";
import { nocReviewMutationLocked } from "@/lib/webProjects/viewModel";
import type { WebProject, WebProjectComment } from "@/lib/webProjects/types";

export function NocWebProjectComments({
  organizationId,
  project,
  comments,
  onReload
}: {
  organizationId: number;
  project: WebProject;
  comments: WebProjectComment[];
  onReload: () => Promise<void>;
}) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const locked = nocReviewMutationLocked(project);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createNocWebProjectComment(organizationId, project.id, body.trim());
      setBody("");
      await onReload();
    } catch (err) {
      setError(webProjectErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="noc-panel">
      <div className="noc-panel__head">Comentarios generales</div>
      <div className="noc-panel__body">
        <p className="noc-disclaimer">
          Conversación libre. El motivo de corrección vive en la revisión, no aquí.
        </p>
        {comments.length === 0 ? (
          <NocEmpty title="Sin comentarios." />
        ) : (
          <ul className="noc-stack">
            {comments.map((comment) => (
              <li key={comment.id}>
                <p>{comment.body}</p>
                <p className="noc-disclaimer">
                  user {comment.createdBy ?? "—"} · {relativeTimeEs(comment.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
        {locked ? (
          <p className="noc-disclaimer">
            {project.workflowStatus === "COMPLETED" && !project.archivedAt
              ? "Finalizado: solo lectura."
              : "Archivado: no se pueden publicar comentarios."}
          </p>
        ) : (
          <form className="noc-form" onSubmit={onSubmit}>
            <label>
              Nuevo comentario
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                maxLength={4000}
                rows={3}
                placeholder="No incluyas contraseñas, claves ni tokens."
              />
            </label>
            {error ? (
              <p className="noc-disclaimer" role="alert">
                {error}
              </p>
            ) : null}
            <button type="submit" className="noc-btn noc-btn--primary" disabled={busy}>
              {busy ? "Publicando…" : "Publicar"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
