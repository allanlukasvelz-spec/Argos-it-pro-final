"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AbcConceptualPanel,
  EvidencePanel,
  NocError,
  NocLoading,
  NocPageHeader,
  SeverityBadge
} from "@/components/noc/NocUi";
import { fetchNocIncident, type NocIncident } from "@/lib/nocApi";

export default function NocIncidentDetailPage() {
  const params = useParams();
  const id = Number(params?.id);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [incident, setIncident] = useState<NocIncident | null>(null);
  const [events, setEvents] = useState<
    { id: number; kind: string; payload: unknown; createdAt: string }[]
  >([]);

  const load = useCallback(async () => {
    if (!Number.isInteger(id)) {
      setError(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const data = await fetchNocIncident(id);
      setIncident(data.incident);
      setEvents(data.events || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <NocLoading />;
  if (error || !incident) {
    return <NocError title="Incidente no encontrado." onRetry={load} />;
  }

  return (
    <div>
      <NocPageHeader
        title={incident.title}
        eyebrow={`Incident #${incident.id}`}
        meta={`${incident.state} · ${incident.organizationName || incident.organizationId}`}
      />
      <p className="noc-disclaimer" style={{ marginBottom: "0.75rem" }}>
        <Link href="/noc/incidents">← Incidents</Link> ·{" "}
        <SeverityBadge severity={incident.severity} />
      </p>
      <div className="noc-panel">
        <div className="noc-panel__body">
          <p>{incident.summary || "Sin resumen."}</p>
          <p className="noc-disclaimer">
            Activo: {incident.assetHostname || "—"} · correlation: {incident.correlationKey || "—"}
          </p>
        </div>
      </div>
      <div className="noc-panel">
        <div className="noc-panel__head">Eventos ({events.length})</div>
        <div className="noc-panel__body" style={{ padding: 0 }}>
          {events.length === 0 ? (
            <p className="noc-disclaimer" style={{ padding: "0.65rem" }}>
              Sin eventos registrados.
            </p>
          ) : (
            <div className="noc-table-wrap">
              <table className="noc-table">
                <thead>
                  <tr>
                    <th>Kind</th>
                    <th>Cuando</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e) => (
                    <tr key={e.id}>
                      <td>{e.kind}</td>
                      <td>{e.createdAt ? new Date(e.createdAt).toLocaleString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <EvidencePanel evidence={events[0]?.payload} title="Último payload de evento" />
      <AbcConceptualPanel />
    </div>
  );
}
