"use client";

import { useCallback, useEffect, useState } from "react";
import {
  NocError,
  NocLoading,
  NocPageHeader,
  OrgHealthSummary
} from "@/components/noc/NocUi";
import { fetchNocHealth } from "@/lib/nocApi";

export default function NocHealthPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchNocHealth>> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setData(await fetchNocHealth());
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
  if (error || !data) {
    return <NocError title="No se pudo calcular la salud global." onRetry={load} />;
  }

  return (
    <div>
      <NocPageHeader
        title="Global Health"
        eyebrow="Distribución muestreada"
        meta="UNKNOWN nunca se cuenta como HEALTHY. Muestra limitada de activos activos."
      />
      <div className="noc-panel">
        <div className="noc-panel__head">Buckets (sample {data.sampleSize})</div>
        <div className="noc-panel__body">
          <OrgHealthSummary buckets={data.buckets} />
          <p className="noc-disclaimer">{data.disclaimer}</p>
        </div>
      </div>
      <div className="noc-panel">
        <div className="noc-panel__head">Por organización</div>
        <div className="noc-table-wrap">
          <table className="noc-table">
            <thead>
              <tr>
                <th>Org</th>
                <th>HEALTHY</th>
                <th>WARNING</th>
                <th>CRITICAL</th>
                <th>UNKNOWN</th>
              </tr>
            </thead>
            <tbody>
              {data.byOrganization.map((row) => (
                <tr key={String(row.organizationId)}>
                  <td>{String(row.organizationName || row.organizationId)}</td>
                  <td>{String(row.HEALTHY ?? 0)}</td>
                  <td>{String(row.WARNING ?? 0)}</td>
                  <td>{String(row.CRITICAL ?? 0)}</td>
                  <td>{String(row.UNKNOWN ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
