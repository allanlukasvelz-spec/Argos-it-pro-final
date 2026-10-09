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
import { fetchNocAssets, fetchNocMonitoring, type NocAsset, type NocMonitor } from "@/lib/nocApi";

export default function NocDnsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [domains, setDomains] = useState<NocAsset[]>([]);
  const [monitors, setMonitors] = useState<NocMonitor[]>([]);
  const [orgId, setOrgId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [d, m] = await Promise.all([
        fetchNocAssets({
          type: "DOMAIN",
          organization_id: orgId || undefined,
          limit: 100
        }),
        fetchNocMonitoring({ organization_id: orgId || undefined, limit: 100 })
      ]);
      setDomains(d);
      setMonitors(m);
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
  if (error) return <NocError title="No se pudo cargar DNS." onRetry={load} />;

  const domainIds = new Set(domains.map((d) => d.id));
  const related = monitors.filter((m) => domainIds.has(m.assetId));

  return (
    <div>
      <NocPageHeader
        title="DNS"
        eyebrow="DOMAIN assets + monitors"
        meta="Activos tipo DOMAIN y monitors asociados. Sin force-check en Phase 5."
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

      <div className="noc-panel">
        <div className="noc-panel__head">Dominios ({domains.length})</div>
        <div className="noc-panel__body" style={{ padding: 0 }}>
          {domains.length === 0 ? (
            <NocEmpty title="Sin activos DOMAIN." />
          ) : (
            <div className="noc-table-wrap">
              <table className="noc-table">
                <thead>
                  <tr>
                    <th>Org</th>
                    <th>Hostname</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {domains.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <Link href={`/noc/organizations/${a.organizationId}`}>
                          {a.organizationName || a.organizationId}
                        </Link>
                      </td>
                      <td>{a.hostname || a.name || "—"}</td>
                      <td>{a.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="noc-panel">
        <div className="noc-panel__head">Monitors ligados a DOMAIN ({related.length})</div>
        <div className="noc-panel__body" style={{ padding: 0 }}>
          {related.length === 0 ? (
            <NocEmpty title="Sin monitors sobre dominios en el filtro." />
          ) : (
            <div className="noc-table-wrap">
              <table className="noc-table">
                <thead>
                  <tr>
                    <th>Org</th>
                    <th>Tipo</th>
                    <th>Activo</th>
                    <th>Estado monitor</th>
                    <th>Enabled</th>
                  </tr>
                </thead>
                <tbody>
                  {related.map((m) => (
                    <tr key={m.id}>
                      <td>{m.organizationName || m.organizationId}</td>
                      <td>{m.type}</td>
                      <td>{m.assetHostname || m.assetId}</td>
                      <td>{m.status}</td>
                      <td>{m.enabled ? "yes" : "no"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
