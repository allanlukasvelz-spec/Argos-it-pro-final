"use client";

import { useCallback, useEffect, useState } from "react";
import {
  EmptyState,
  ErrorState,
  HealthIndicator,
  LoadingState,
  PageHeader,
  StatusBadge
} from "@/components/client/Status";
import { ChicoGuardianBanner } from "@/components/client/ChicoGuardianBanner";
import { fetchMonitoring, fetchMonitors } from "@/lib/clientApi";
import type { ClientMonitor, MonitoringSummary } from "@/lib/clientTypes";
import { relativeTimeEs } from "@/lib/clientCopy";
import { observationToDisplayHealth } from "@/lib/clientHealthSemantics";

export default function MonitorizacionPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [monitors, setMonitors] = useState<ClientMonitor[]>([]);
  const [summary, setSummary] = useState<MonitoringSummary | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [m, s] = await Promise.all([fetchMonitors(), fetchMonitoring()]);
      setMonitors(m);
      setSummary(s);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingState label="Cargando monitorización…" />;
  if (error) return <ErrorState title="No se ha podido cargar la monitorización." onRetry={load} />;

  const healthByAsset = new Map(
    (summary?.assets || []).map((a) => [a.assetId, a.overall] as const)
  );

  return (
    <div>
      <PageHeader
        title="Monitorización"
        eyebrow="Observación"
        meta="Sin observación fresca → UNKNOWN. Un fallo del runner no implica HEALTHY del destino."
      />
      <ChicoGuardianBanner />

      <div className="cp-card" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          <span>Salud de organización:</span>
          <HealthIndicator overall={summary?.overall || "UNKNOWN"} />
        </div>
        <p className="cp-disclaimer">{summary?.disclaimer}</p>
      </div>

      {monitors.length === 0 ? (
        <EmptyState
          title="Aún no hay monitors."
          description="Se provisionan al descubrir o crear un dominio/website con hostname."
        />
      ) : (
        <>
          <div className="cp-table-wrap cp-table-desktop cp-card">
            <table className="cp-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Estado ciclo</th>
                  <th>Salud (asset)</th>
                  <th>Última comprobación</th>
                  <th>Próxima</th>
                </tr>
              </thead>
              <tbody>
                {monitors.map((m) => {
                  const assetHealth = healthByAsset.get(m.assetId);
                  const display = observationToDisplayHealth({
                    overall: assetHealth,
                    fresh: Boolean(m.lastCheckAt),
                    ok: m.status === "ACTIVE" && Boolean(m.lastCheckAt)
                  });
                  return (
                    <tr key={m.id}>
                      <td>{m.name}</td>
                      <td>{m.type}</td>
                      <td>{m.enabled ? m.status : "DISABLED"}</td>
                      <td>
                        <StatusBadge status={display} />
                      </td>
                      <td>{relativeTimeEs(m.lastCheckAt)}</td>
                      <td>{m.nextCheckAt ? relativeTimeEs(m.nextCheckAt) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="cp-cards-mobile">
            {monitors.map((m) => {
              const assetHealth = healthByAsset.get(m.assetId);
              const display = observationToDisplayHealth({
                overall: assetHealth,
                fresh: Boolean(m.lastCheckAt),
                ok: Boolean(m.lastCheckAt)
              });
              return (
                <div key={m.id} className="cp-asset-card">
                  <strong>{m.name}</strong>
                  <div style={{ marginTop: "0.35rem" }}>
                    <StatusBadge status={display} />
                  </div>
                  <p className="cp-disclaimer">
                    {m.type} · {relativeTimeEs(m.lastCheckAt)}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
