"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  FilterBar,
  HealthBadge,
  NocEmpty,
  NocError,
  NocLoading,
  NocPageHeader
} from "@/components/noc/NocUi";
import { fetchNocTls, type NocTlsCert } from "@/lib/nocApi";

export default function NocTlsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [certs, setCerts] = useState<NocTlsCert[]>([]);
  const [orgId, setOrgId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setCerts(await fetchNocTls({ organization_id: orgId || undefined, limit: 100 }));
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
  if (error) return <NocError title="No se pudieron listar certificados." onRetry={load} />;

  return (
    <div>
      <NocPageHeader
        title="TLS"
        eyebrow="Certificados enriquecidos"
        meta="Nunca se expone private_key. Misma semántica que el portal cliente."
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
      {certs.length === 0 ? (
        <NocEmpty title="Sin certificados en el filtro." />
      ) : (
        <div className="noc-panel">
          <div className="noc-table-wrap">
            <table className="noc-table">
              <thead>
                <tr>
                  <th>Org</th>
                  <th>Hostname</th>
                  <th>Estado</th>
                  <th>Días</th>
                  <th>Válido hasta</th>
                  <th>Issuer</th>
                </tr>
              </thead>
              <tbody>
                {certs.map((c) => {
                  const status = c.observationStatus || c.status || "UNKNOWN";
                  const host = c.assetHostname || c.hostname || "—";
                  const until = c.notAfter || c.validTo;
                  return (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/noc/organizations/${c.organizationId}`}>
                        {c.organizationName || c.organizationId}
                      </Link>
                    </td>
                    <td>{host}</td>
                    <td>
                      <HealthBadge status={status} />
                    </td>
                    <td>{c.daysRemaining ?? "—"}</td>
                    <td>{until ? new Date(until).toLocaleDateString() : "—"}</td>
                    <td>{c.issuer || "—"}</td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
