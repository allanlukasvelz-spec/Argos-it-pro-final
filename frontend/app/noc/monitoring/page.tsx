"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  FilterBar,
  NocEmpty,
  NocError,
  NocLoading,
  NocPageHeader
} from "@/components/noc/NocUi";
import { fetchNocMonitoring, type NocMonitor } from "@/lib/nocApi";

export default function NocMonitoringPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [monitors, setMonitors] = useState<NocMonitor[]>([]);
  const [orgId, setOrgId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setMonitors(
        await fetchNocMonitoring({ organization_id: orgId || undefined, limit: 100 })
      );
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
  if (error) return <NocError title="No se pudieron listar monitors." onRetry={load} />;

  return (
    <div>
      <NocPageHeader
        title="Monitoring"
        eyebrow="Monitors cross-tenant"
        meta="status = ciclo de vida del monitor, no salud del target. Sin force-check."
      />
      <FilterBar>
        <label>
          organization_id
          <input value={orgId} onChange={(e) => setOrgId(e.target.value)} placeholder="opcional" />
        </label>
        <button type="button" className="noc-btn noc-btn--primary" onClick={() => void load()}>
          Filtrar
        </button>
      </FilterBar>
      {monitors.length === 0 ? (
        <NocEmpty title="Sin monitors." />
      ) : (
        <div className="noc-panel">
          <div className="noc-table-wrap">
            <table className="noc-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Org</th>
                  <th>Tipo</th>
                  <th>Activo</th>
                  <th>Estado</th>
                  <th>Enabled</th>
                  <th>Último check</th>
                </tr>
              </thead>
              <tbody>
                {monitors.map((m) => (
                  <tr key={m.id}>
                    <td>{m.id}</td>
                    <td>
                      <Link href={`/noc/organizations/${m.organizationId}`}>
                        {m.organizationName || m.organizationId}
                      </Link>
                    </td>
                    <td>{m.type}</td>
                    <td>{m.assetHostname || m.assetId}</td>
                    <td>{m.status}</td>
                    <td>{m.enabled ? "yes" : "no"}</td>
                    <td>{m.lastCheckAt ? new Date(m.lastCheckAt).toLocaleString() : "—"}</td>
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
