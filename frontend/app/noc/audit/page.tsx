"use client";

import { useCallback, useEffect, useState } from "react";
import {
  EvidencePanel,
  FilterBar,
  NocEmpty,
  NocError,
  NocLoading,
  NocPageHeader
} from "@/components/noc/NocUi";
import { fetchNocAudit, type NocAuditEvent } from "@/lib/nocApi";

export default function NocAuditPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [events, setEvents] = useState<NocAuditEvent[]>([]);
  const [orgId, setOrgId] = useState("");
  const [selected, setSelected] = useState<NocAuditEvent | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const rows = await fetchNocAudit({
        organization_id: orgId || undefined,
        limit: 100
      });
      setEvents(rows);
      setSelected(rows[0] || null);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <NocLoading />;
  if (error) return <NocError title="No se pudo cargar el audit log." onRetry={load} />;

  return (
    <div>
      <NocPageHeader
        title="Audit Log"
        eyebrow="activity_logs ∪ security_logs"
        meta="Detalles redactados (sin tokens). Solo lectura."
      />
      <FilterBar>
        <label>
          organization_id
          <input value={orgId} onChange={(e) => setOrgId(e.target.value)} />
        </label>
        <button type="button" className="noc-btn noc-btn--primary" onClick={() => void load()}>
          Filtrar
        </button>
      </FilterBar>
      {events.length === 0 ? (
        <NocEmpty title="Sin eventos." />
      ) : (
        <div className="noc-split">
          <div className="noc-panel">
            <div className="noc-table-wrap">
              <table className="noc-table">
                <thead>
                  <tr>
                    <th>Fuente</th>
                    <th>Acción</th>
                    <th>Org</th>
                    <th>User</th>
                    <th>Riesgo</th>
                    <th>Cuando</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e) => (
                    <tr
                      key={`${e.source}-${e.id}`}
                      className={
                        selected?.id === e.id && selected?.source === e.source
                          ? "noc-row--selected"
                          : undefined
                      }
                      onClick={() => setSelected(e)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>{e.source}</td>
                      <td>{e.action}</td>
                      <td>{e.organizationId ?? "—"}</td>
                      <td>{e.userId ?? "—"}</td>
                      <td>{e.riskLevel || "—"}</td>
                      <td>{e.createdAt ? new Date(e.createdAt).toLocaleString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <EvidencePanel evidence={selected?.details} title="Details (redactados)" />
        </div>
      )}
    </div>
  );
}
