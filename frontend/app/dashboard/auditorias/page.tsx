"use client";

import { useCallback, useEffect, useState } from "react";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  StatusBadge
} from "@/components/client/Status";
import { fetchDiagnostic, fetchPortal } from "@/lib/clientApi";
import type { ClientPortalPayload } from "@/lib/clientTypes";
import { relativeTimeEs } from "@/lib/clientCopy";

export default function AuditoriasPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [portal, setPortal] = useState<ClientPortalPayload | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setPortal(await fetchPortal());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleDiag(id: number) {
    if (expanded === id) {
      setExpanded(null);
      setDetail(null);
      return;
    }
    setExpanded(id);
    setDetailLoading(true);
    try {
      setDetail(await fetchDiagnostic(id));
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }

  if (loading) return <LoadingState label="Cargando auditorías…" />;
  if (error || !portal) {
    return <ErrorState title="No se han podido cargar las auditorías." onRetry={load} />;
  }

  const audit = portal.websiteAudit;
  const diags = portal.argosDiagnostics || [];
  const scoreLabel =
    audit?.score != null && !Number.isNaN(audit.score) ? `${audit.score}/100` : "—";

  return (
    <div>
      <PageHeader
        title="Auditorías"
        eyebrow="Evaluaciones"
        meta="Datos reales del tenant: auditoría web y diagnósticos ARGOS."
      />

      <section className="cp-card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Auditoría web</h2>
        <p>
          Estado: {audit?.status || "UNKNOWN"} · Puntuación operativa: <strong>{scoreLabel}</strong>
        </p>
        {audit?.websiteUrl ? <p className="cp-disclaimer">URL: {audit.websiteUrl}</p> : null}
        {audit?.checks?.length ? (
          <ul style={{ paddingLeft: "1.1rem" }}>
            {audit.checks.map((c, i) => (
              <li key={`${c.label}-${i}`}>
                {c.label}: {c.status}
                {c.priority ? ` (${c.priority})` : ""}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Aún no hay comprobaciones de auditoría." />
        )}
        <p className="cp-disclaimer">
          Esta puntuación no es health de monitors. UNKNOWN/ausencia ≠ HEALTHY.
        </p>
      </section>

      <section className="cp-card">
        <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Diagnósticos ARGOS</h2>
        {diags.length === 0 ? (
          <EmptyState title="Aún no hay diagnósticos guardados." />
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {diags.map((d) => (
              <li key={d.id} style={{ marginBottom: "0.75rem", borderBottom: "1px solid var(--cp-border)", paddingBottom: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
                  <div>
                    <StatusBadge status="UNKNOWN" label={d.risk_label || d.risk_level} />
                    <span style={{ marginLeft: "0.5rem" }}>
                      {d.score}/{d.max_score} · {relativeTimeEs(d.created_at)}
                    </span>
                  </div>
                  <button type="button" className="cp-btn cp-btn--secondary" onClick={() => void toggleDiag(d.id)}>
                    {expanded === d.id ? "Ocultar" : "Ver detalle"}
                  </button>
                </div>
                <p className="cp-disclaimer">{d.summary_preview}</p>
                {expanded === d.id ? (
                  detailLoading ? (
                    <LoadingState label="Cargando detalle…" />
                  ) : detail ? (
                    <pre
                      style={{
                        whiteSpace: "pre-wrap",
                        fontSize: "0.75rem",
                        background: "var(--cp-canvas)",
                        padding: "0.75rem",
                        borderRadius: 8,
                        overflow: "auto"
                      }}
                    >
                      {JSON.stringify(detail, null, 2)}
                    </pre>
                  ) : (
                    <p className="cp-disclaimer">No se pudo cargar el detalle.</p>
                  )
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
