"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FilterBar,
  NocEmpty,
  NocError,
  NocLoading,
  NocPageHeader,
  SeverityBadge
} from "@/components/noc/NocUi";
import { fetchNocIncidents, type NocIncident } from "@/lib/nocApi";

function IncidentsInner() {
  const search = useSearchParams();
  const [orgId, setOrgId] = useState(search.get("organization_id") || "");
  const [state, setState] = useState(search.get("state") || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [incidents, setIncidents] = useState<NocIncident[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setIncidents(
        await fetchNocIncidents({
          organization_id: orgId || undefined,
          state: state || undefined,
          limit: 100
        })
      );
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [orgId, state]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <NocLoading />;
  if (error) return <NocError title="No se pudieron listar incidentes." onRetry={load} />;

  return (
    <div>
      <NocPageHeader
        title="Incidents"
        eyebrow="Casos cross-tenant"
        meta="Sin herramientas de remediación. Cero incidentes ≠ HEALTHY."
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
            <option value="INVESTIGATING">INVESTIGATING</option>
            <option value="MITIGATED">MITIGATED</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>
        </label>
        <button type="button" className="noc-btn noc-btn--primary" onClick={() => void load()}>
          Filtrar
        </button>
      </FilterBar>
      {incidents.length === 0 ? (
        <NocEmpty title="Sin incidentes en el filtro." />
      ) : (
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
                  <th>Abierto</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((i) => (
                  <tr key={i.id}>
                    <td>{i.organizationName || i.organizationId}</td>
                    <td>
                      <SeverityBadge severity={i.severity} />
                    </td>
                    <td>{i.state}</td>
                    <td>
                      <Link href={`/noc/incidents/${i.id}`}>{i.title}</Link>
                    </td>
                    <td>{i.assetHostname || "—"}</td>
                    <td>{i.openedAt ? new Date(i.openedAt).toLocaleString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NocIncidentsPage() {
  return (
    <Suspense fallback={<NocLoading />}>
      <IncidentsInner />
    </Suspense>
  );
}
