"use client";

import { useCallback, useEffect, useState } from "react";
import {
  EmptyState,
  ErrorState,
  HealthIndicator,
  LoadingState,
  MetricCard,
  PageHeader,
  StatusBadge,
  UnknownState
} from "@/components/client/Status";
import { fetchAlerts, fetchMonitoring, fetchTls } from "@/lib/clientApi";
import type { ClientAlert, ClientTlsCertificate, MonitoringSummary } from "@/lib/clientTypes";

export default function SeguridadPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tls, setTls] = useState<ClientTlsCertificate[]>([]);
  const [alerts, setAlerts] = useState<ClientAlert[]>([]);
  const [monitoring, setMonitoring] = useState<MonitoringSummary | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [t, a, m] = await Promise.all([fetchTls(), fetchAlerts(), fetchMonitoring()]);
      setTls(t);
      setAlerts(a.filter((x) => x.state === "OPEN" || x.state === "ACKNOWLEDGED"));
      setMonitoring(m);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingState label="Cargando señales de seguridad…" />;
  if (error) return <ErrorState title="No se ha podido cargar seguridad." onRetry={load} />;

  const tlsIssues = tls.filter((c) =>
    ["EXPIRED", "EXPIRING", "HOSTNAME_MISMATCH", "CHAIN_ERROR"].includes(
      String(c.observationStatus || "").toUpperCase()
    )
  );

  return (
    <div>
      <PageHeader
        title="Seguridad"
        eyebrow="Señales disponibles"
        meta="Sin escáner de vulnerabilidades. Solo señales reales (TLS, cobertura, alertas)."
      />

      <div className="cp-grid cp-grid--3" style={{ marginBottom: "1rem" }}>
        <MetricCard
          label="Salud monitorizada"
          value={<HealthIndicator overall={monitoring?.overall || "UNKNOWN"} />}
        />
        <MetricCard label="Certificados con incidencia" value={String(tlsIssues.length)} />
        <MetricCard label="Alertas abiertas relevantes" value={String(alerts.length)} />
      </div>

      <div className="cp-card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Escaneo de vulnerabilidades</h2>
        <UnknownState
          title="No disponible"
          description="No hay motor de vulnerabilidades en Phase 4. No se inventan conteos."
        />
      </div>

      <section className="cp-card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>TLS</h2>
        {tls.length === 0 ? (
          <EmptyState title="Sin certificados observados." />
        ) : (
          <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
            {tls.slice(0, 20).map((c) => (
              <li key={c.id} style={{ marginBottom: "0.5rem" }}>
                <StatusBadge
                  status={
                    c.observationStatus === "VALID"
                      ? "HEALTHY"
                      : c.observationStatus === "EXPIRED"
                        ? "CRITICAL"
                        : c.observationStatus === "EXPIRING"
                          ? "WARNING"
                          : "UNKNOWN"
                  }
                  label={c.observationStatus || "UNKNOWN"}
                />{" "}
                {c.assetHostname || "hostname desconocido"}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="cp-card">
        <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Alertas de seguridad / monitorización</h2>
        {alerts.length === 0 ? (
          <p className="cp-disclaimer">No hay alertas abiertas. Eso no implica protección total.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
            {alerts.map((a) => (
              <li key={a.id}>
                {a.severity}: {a.title}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
