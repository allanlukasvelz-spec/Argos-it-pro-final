"use client";

import { useCallback, useEffect, useState } from "react";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  StatusBadge
} from "@/components/client/Status";
import { fetchIncident, fetchIncidents } from "@/lib/clientApi";
import type { ClientIncident } from "@/lib/clientTypes";
import { relativeTimeEs } from "@/lib/clientCopy";

export default function IncidentesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [incidents, setIncidents] = useState<ClientIncident[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [detail, setDetail] = useState<{
    incident: ClientIncident;
    events: { id: number; kind: string; payload: unknown; createdAt?: string; created_at?: string }[];
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setIncidents(await fetchIncidents());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function openDetail(id: number) {
    setSelected(id);
    setDetailLoading(true);
    try {
      const data = await fetchIncident(id);
      setDetail(data);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }

  if (loading) return <LoadingState label="Cargando incidentes…" />;
  if (error) return <ErrorState title="No se han podido cargar los incidentes." onRetry={load} />;

  return (
    <div>
      <PageHeader
        title="Incidentes"
        eyebrow="Situaciones abiertas"
        meta="Vista de cliente. Sin herramientas NOC ni remediación A/B/C."
      />

      {incidents.length === 0 ? (
        <EmptyState
          title="Aún no hay incidentes."
          description="Sin incidentes ≠ totalmente saludable."
        />
      ) : (
        <div className="cp-grid cp-grid--2">
          <div>
            {incidents.map((inc) => (
              <button
                key={inc.id}
                type="button"
                className="cp-incident-card"
                style={{
                  width: "100%",
                  textAlign: "left",
                  marginBottom: "0.75rem",
                  cursor: "pointer",
                  borderColor: selected === inc.id ? "var(--cp-navy)" : undefined
                }}
                onClick={() => void openDetail(inc.id)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                  <strong>{inc.title}</strong>
                  <StatusBadge
                    status={inc.severity === "CRITICAL" ? "CRITICAL" : "WARNING"}
                    label={inc.severity}
                  />
                </div>
                <p className="cp-disclaimer">
                  {inc.state} · Detectado {relativeTimeEs(inc.openedAt)}
                </p>
              </button>
            ))}
          </div>
          <div className="cp-card">
            {!selected ? (
              <p className="cp-disclaimer">Selecciona un incidente para ver el resumen.</p>
            ) : detailLoading ? (
              <LoadingState label="Cargando detalle…" />
            ) : !detail ? (
              <ErrorState title="No se pudo cargar el detalle." />
            ) : (
              <div>
                <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>{detail.incident.title}</h2>
                <p>{detail.incident.summary || "Sin resumen adicional."}</p>
                <p className="cp-disclaimer">
                  Estado: {detail.incident.state}
                  {detail.incident.resolvedAt
                    ? ` · Resuelto ${relativeTimeEs(detail.incident.resolvedAt)}`
                    : ""}
                </p>
                <h3 style={{ fontSize: "0.95rem" }}>Cronología</h3>
                {(detail.events || []).length === 0 ? (
                  <p className="cp-disclaimer">Sin eventos registrados.</p>
                ) : (
                  <ul style={{ paddingLeft: "1.1rem", fontSize: "0.875rem" }}>
                    {detail.events.map((ev) => (
                      <li key={ev.id}>
                        {ev.kind} · {relativeTimeEs(ev.createdAt || ev.created_at)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
