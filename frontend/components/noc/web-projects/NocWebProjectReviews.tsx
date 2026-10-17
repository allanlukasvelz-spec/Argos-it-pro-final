"use client";

import { FormEvent, useState } from "react";
import { NocEmpty } from "@/components/noc/NocUi";
import { createNocWebProjectReview } from "@/lib/nocApi";
import { relativeTimeEs } from "@/lib/clientCopy";
import { webProjectErrorMessage } from "@/lib/webProjects/errors";
import { reviewVerdictLabel } from "@/lib/webProjects/labels";
import { nocReviewMutationLocked } from "@/lib/webProjects/viewModel";
import type { WebProject, WebProjectReview } from "@/lib/webProjects/types";

const VERDICTS = ["APPROVED", "CORRECTION_REQUESTED", "REJECTED"] as const;

export function NocWebProjectReviews({
  organizationId,
  project,
  reviews,
  onUpdated
}: {
  organizationId: number;
  project: WebProject;
  reviews: WebProjectReview[];
  onUpdated: (project: WebProject) => void;
}) {
  const [verdict, setVerdict] = useState<(typeof VERDICTS)[number]>("APPROVED");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const locked = nocReviewMutationLocked(project);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onUpdated(
        await createNocWebProjectReview(organizationId, project.id, {
          verdict,
          summary: summary.trim()
        })
      );
      setSummary("");
    } catch (err) {
      setError(webProjectErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="noc-panel">
      <div className="noc-panel__head">Reviews</div>
      <div className="noc-panel__body">
        {reviews.length === 0 ? (
          <NocEmpty title="Sin reviews." description="Solo el staff NOC puede crearlas." />
        ) : (
          <ul className="noc-stack">
            {reviews.map((review) => (
              <li key={review.id}>
                <strong>
                  {reviewVerdictLabel(review.verdict)} <code>{review.verdict}</code>
                </strong>
                {review.summary ? <p>{review.summary}</p> : null}
                <p className="noc-disclaimer">{relativeTimeEs(review.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
        {locked ? (
          <p className="noc-disclaimer">Archivado: no se pueden añadir reviews.</p>
        ) : (
          <form className="noc-form" onSubmit={onSubmit}>
            <label>
              Veredicto
              <select value={verdict} onChange={(e) => setVerdict(e.target.value as (typeof VERDICTS)[number])}>
                {VERDICTS.map((item) => (
                  <option key={item} value={item}>
                    {reviewVerdictLabel(item)} ({item})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Comentario interno
              <textarea value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={2000} rows={3} />
            </label>
            {error ? (
              <p className="noc-disclaimer" role="alert">
                {error}
              </p>
            ) : null}
            <button type="submit" className="noc-btn noc-btn--primary" disabled={busy}>
              {busy ? "Registrando…" : "Registrar review"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
