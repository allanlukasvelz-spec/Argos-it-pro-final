"use client";

import { useCallback, useEffect, useState } from "react";
import { HealthBadge, NocError, NocLoading, NocPageHeader } from "@/components/noc/NocUi";
import { fetchNocPlatformHealth, type NocPlatformHealth } from "@/lib/nocApi";

export default function NocPlatformHealthPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [data, setData] = useState<NocPlatformHealth | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setData(await fetchNocPlatformHealth());
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
    return <NocError title="No se pudo leer platform health." onRetry={load} />;
  }

  const badge =
    data.status === "OK" ? "HEALTHY" : data.status === "DEGRADED" ? "CRITICAL" : "UNKNOWN";

  return (
    <div>
      <NocPageHeader
        title="Platform Health"
        eyebrow="ARGOS self"
        meta="Conectividad de proceso y DB. No implica que los clientes estén HEALTHY."
      />
      <div className="noc-panel">
        <div className="noc-panel__body">
          <p>
            <HealthBadge status={badge} /> <strong>{data.status}</strong> · DB: {data.db}
          </p>
          <p className="noc-disclaimer">{data.meaning}</p>
          <p className="noc-disclaimer">
            Timestamp: {data.timestamp ? new Date(data.timestamp).toLocaleString() : "—"}
          </p>
          <button type="button" className="noc-btn" onClick={() => void load()}>
            Refrescar
          </button>
        </div>
      </div>
    </div>
  );
}
