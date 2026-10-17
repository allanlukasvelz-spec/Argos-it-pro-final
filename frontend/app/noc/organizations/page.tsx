"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Kpi, NocEmpty, NocError, NocLoading, NocPageHeader } from "@/components/noc/NocUi";
import { fetchNocOrganizations, type NocOrg } from "@/lib/nocApi";

export default function NocOrganizationsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [orgs, setOrgs] = useState<NocOrg[]>([]);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchNocOrganizations(100, 0);
      setOrgs(data.organizations || []);
      setTotal(data.pagination?.total ?? data.organizations?.length ?? 0);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <NocLoading />;
  if (error) return <NocError title="No se pudieron listar organizaciones." onRetry={load} />;

  return (
    <div>
      <NocPageHeader
        title="Organizations"
        eyebrow="Customers"
        meta="Vista cross-tenant de solo lectura."
      />
      <div className="noc-kpis">
        <Kpi label="Total" value={total} />
        <Kpi label="En página" value={orgs.length} />
      </div>
      {orgs.length === 0 ? (
        <NocEmpty title="Sin organizaciones." />
      ) : (
        <div className="noc-panel">
          <div className="noc-table-wrap">
            <table className="noc-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Slug</th>
                  <th>Estado</th>
                  <th>Miembros</th>
                  <th>Activos</th>
                  <th>Monitors</th>
                  <th>Alertas</th>
                  <th>Incidentes</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((o) => (
                  <tr key={o.id}>
                    <td>{o.id}</td>
                    <td>
                      <Link href={`/noc/organizations/${o.id}`}>{o.name}</Link>
                    </td>
                    <td>{o.slug}</td>
                    <td>{o.status}</td>
                    <td>{o.memberCount}</td>
                    <td>{o.assetCount}</td>
                    <td>{o.monitorCount}</td>
                    <td>{o.openAlerts}</td>
                    <td>{o.openIncidents}</td>
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
