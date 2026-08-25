"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  EvidencePanel,
  FilterBar,
  NocEmpty,
  NocError,
  NocLoading,
  NocPageHeader,
  SeverityBadge
} from "@/components/noc/NocUi";
import { fetchNocAlerts, type NocAlert } from "@/lib/nocApi";

function AlertsInner() {
  const search = useSearchParams();
  const [orgId, setOrgId] = useState(search.get("organization_id") || "");
  const [state, setState] = useState(search.get("state") || "");
  const [severity, setSeverity] = useState(search.get("severity") || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [alerts, setAlerts] = useState<NocAlert[]>([]);
  const [selected, setSelected] = useState<NocAlert | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const rows = await fetchNocAlerts({
        organization_id: orgId || undefined,
        state: state || undefined,
        severity: severity || undefined,
        limit: 100
      });
      setAlerts(rows);
      setSelected(rows[0] || null);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [orgId, state, severity]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <NocLoading />;
  if (error) return <NocError title="No se pudieron listar alertas." onRetry={load} />;

  return (
    <div>
      <NocPageHeader
        title="Alerts"
        eyebrow="Cola cross-tenant"
        meta="Evidence sanitizada. Sin ack/resolve en Phase 5."
      />
      <FilterBar>
        <label>
          organization_id
          <input value={orgId} onChange={(e) => setOrgId(e.target.value)} />
        </label>
        <label>
          state
          <select value={state} onChange={(e) => setState(e.target.value)}>
            <option value="">(todos)</option>
            <option value="OPEN">OPEN</option>
            <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>
        </label>
        <label>
          severity
          <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option value="">(todas)</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="WARNING">WARNING</option>
          </select>
        </label>
        <button type="button" className="noc-btn noc-btn--primary" onClick={() => void load()}>
          Filtrar
        </button>
      </FilterBar>

      {alerts.length === 0 ? (
        <NocEmpty
          title="Sin alertas en el filtro."
          description="Cero alertas ≠ HEALTHY."
        />
      ) : (
        <div className="noc-split">
          <div className="noc-panel">
            <div className="noc-table-wrap">
              <table className="noc-table">
                <thead>
                  <tr>
                    <th>Org</th>
                    <th>Sev</th>
                    <th>Estado</th>
                    <th>Título</th>
                    <th>Activo</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((a) => (
                    <tr
                      key={a.id}
                      className={selected?.id === a.id ? "noc-row--selected" : undefined}
                      onClick={() => setSelected(a)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>{a.organizationName || a.organizationId}</td>
                      <td>
                        <SeverityBadge severity={a.severity} />
                      </td>
                      <td>{a.state}</td>
                      <td>
                        <Link href={`/noc/alerts/${a.id}`} onClick={(e) => e.stopPropagation()}>
                          {a.title}
                        </Link>
                      </td>
                      <td>{a.assetHostname || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <EvidencePanel evidence={selected?.evidenceSummary} title="Evidence summary" />
        </div>
      )}
    </div>
  );
}

export default function NocAlertsPage() {
  return (
    <Suspense fallback={<NocLoading />}>
      <AlertsInner />
    </Suspense>
  );
}
