"use client";

import { useCallback, useEffect, useState } from "react";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  StatusBadge
} from "@/components/client/Status";
import { ChicoGuardianBanner } from "@/components/client/ChicoGuardianBanner";
import { fetchAlerts } from "@/lib/clientApi";
import type { ClientAlert } from "@/lib/clientTypes";
import { clientReasonCopy, relativeTimeEs } from "@/lib/clientCopy";

export default function AlertasPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [alerts, setAlerts] = useState<ClientAlert[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setAlerts(await fetchAlerts());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingState label="Cargando alertas…" />;
  if (error) return <ErrorState title="No se han podido cargar las alertas." onRetry={load} />;

  return (
    <div>
      <PageHeader
        title="Alertas"
        eyebrow="Atención"
        meta="Listado tenant-scoped. Cero alertas ≠ HEALTHY."
      />
      <ChicoGuardianBanner />

      {alerts.length === 0 ? (
        <EmptyState
          title="Aún no hay alertas."
          description="La ausencia de alertas no implica que todo esté correcto."
        />
      ) : (
        <>
          <div className="cp-table-wrap cp-table-desktop cp-card">
            <table className="cp-table">
              <thead>
                <tr>
                  <th>Severidad</th>
                  <th>Estado</th>
                  <th>Título</th>
                  <th>Motivo</th>
                  <th>Abierta</th>
                  <th>Actualizada</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <StatusBadge
                        status={a.severity === "CRITICAL" ? "CRITICAL" : "WARNING"}
                        label={a.severity}
                      />
                    </td>
                    <td>{a.state}</td>
                    <td>{a.title}</td>
                    <td>{clientReasonCopy(a.reason)}</td>
                    <td>{relativeTimeEs(a.openedAt)}</td>
                    <td>{relativeTimeEs(a.lastSeenAt || a.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="cp-cards-mobile">
            {alerts.map((a) => (
              <div key={a.id} className="cp-alert-card">
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                  <strong>{a.title}</strong>
                  <StatusBadge
                    status={a.severity === "CRITICAL" ? "CRITICAL" : "WARNING"}
                    label={a.severity}
                  />
                </div>
                <p className="cp-disclaimer">
                  {a.state} · {clientReasonCopy(a.reason)}
                </p>
                <p className="cp-disclaimer">{relativeTimeEs(a.lastSeenAt || a.openedAt)}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
