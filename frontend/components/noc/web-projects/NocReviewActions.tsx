"use client";

import { FormEvent, useState } from "react";
import { createNocWebProjectReview } from "@/lib/nocApi";
import { relativeTimeEs } from "@/lib/clientCopy";
import { webProjectErrorMessage } from "@/lib/webProjects/errors";
import { reviewStatusLabel } from "@/lib/webProjects/labels";
import { nocReviewMutationLocked } from "@/lib/webProjects/viewModel";
import type { WebProject, WebProjectReviewState } from "@/lib/webProjects/types";

export function NocReviewActions({
  organizationId,
  project,
  state,
  targetType,
  targetId,
  targetKey,
  onUpdated
}: {
  organizationId: number;
  project: WebProject;
  state?: WebProjectReviewState | null;
  targetType: "FORM_FIELD" | "ITEM" | "DOCUMENT" | "PROJECT";
  targetId?: string | number | null;
  targetKey?: string | null;
  onUpdated: (project: WebProject) => void;
}) {
  const locked = nocReviewMutationLocked(project);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function submit(verdict: "APPROVED" | "CORRECTION_REQUESTED") {
    setError(null);
    if (verdict === "CORRECTION_REQUESTED" && !message.trim()) {
      setError("El motivo de corrección es obligatorio.");
      return;
    }
    setBusy(verdict);
    try {
      onUpdated(
        await createNocWebProjectReview(organizationId, project.id, {
          verdict,
          correctionMessage: verdict === "CORRECTION_REQUESTED" ? message.trim() : undefined,
          summary: verdict === "CORRECTION_REQUESTED" ? message.trim() : undefined,
          targetType,
          targetId: targetId ?? null,
          targetKey: targetKey ?? null
        })
      );
      setMessage("");
    } catch (err) {
      setError(webProjectErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  function onCorrection(e: FormEvent) {
    e.preventDefault();
    void submit("CORRECTION_REQUESTED");
  }

  return (
    <div className="noc-review-actions">
      <p>
        Estado de revisión:{" "}
        <strong>{reviewStatusLabel(state?.status || "PENDING")}</strong>
        {state?.reviewedAt ? ` · ${relativeTimeEs(state.reviewedAt)}` : ""}
        {state?.reviewedBy ? ` · user ${state.reviewedBy}` : ""}
      </p>
      {state?.correctionMessage ? (
        <p className="noc-review-reason">
          Motivo: {state.correctionMessage}
        </p>
      ) : null}
      {locked ? (
        <p className="noc-disclaimer">
          {project.workflowStatus === "COMPLETED"
            ? "Proyecto finalizado. Sin nuevas revisiones."
            : "Proyecto archivado. Sin nuevas revisiones."}
        </p>
      ) : (
        <form className="noc-form" onSubmit={onCorrection}>
          <label>
            Motivo de corrección
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              aria-required="true"
            />
          </label>
          {error ? (
            <p className="noc-disclaimer" role="alert">
              {error}
            </p>
          ) : null}
          <div className="noc-actions">
            <button
              type="button"
              className="noc-btn noc-btn--primary"
              disabled={Boolean(busy)}
              onClick={() => void submit("APPROVED")}
            >
              {busy === "APPROVED" ? "Guardando…" : "Aprobar"}
            </button>
            <button type="submit" className="noc-btn" disabled={Boolean(busy)}>
              {busy === "CORRECTION_REQUESTED" ? "Guardando…" : "Solicitar corrección"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
