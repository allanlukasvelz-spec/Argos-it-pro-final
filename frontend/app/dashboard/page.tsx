"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CoverageIndicator,
  ErrorState,
  HealthIndicator,
  LoadingState,
  MetricCard,
  PageHeader,
  StatusBadge
} from "@/components/client/Status";
import { fetchMonitoring, fetchPortal } from "@/lib/clientApi";
import type { ClientPortalPayload, MonitoringSummary } from "@/lib/clientTypes";
import { coverageLabelEs, healthLabelEs, relativeTimeEs } from "@/lib/clientCopy";
import { deriveProtectionSummary } from "@/lib/clientHealthSemantics";

export default function ResumenPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [portal, setPortal] = useState<ClientPortalPayload | null>(null);
  const [monitoring, setMonitoring] = useState<MonitoringSummary | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [p, m] = await Promise.all([fetchPortal(), fetchMonitoring()]);
      setPortal(p);
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

  if (loading) return <LoadingState label="Cargando resumen…" />;
  if (error || !monitoring) {
    return <ErrorState title="No se ha podido cargar el resumen." onRetry={load} />;
  }

  const summary = deriveProtectionSummary({
    overall: monitoring.overall,
    monitorsEnabled: monitoring.coverage?.monitorsEnabled,
    assetsWithFreshEvidence: monitoring.coverage?.assetsWithFreshEvidence,
    openAlerts: monitoring.counts?.openAlerts,
    openIncidents: monitoring.counts?.openIncidents
  });

  const activity = Array.isArray(portal?.activity) ? portal!.activity.slice(0, 8) : [];

  return (
    <div>
      <PageHeader
        title="Portal de cliente"
        eyebrow="Resumen"
        meta="Estado basado en evidencia real. Sin monitors o sin evidencia fresca ≠ protegido."
      />

      <section aria-labelledby="protection-heading" style={{ marginBottom: "1.25rem" }}>
        <h2 id="protection-heading" className="cp-page-header__eyebrow">
          Protection summary
        </h2>
        <div className="cp-grid cp-grid--5" style={{ marginTop: "0.75rem" }}>
          <MetricCard
            label="Salud"
            value={<HealthIndicator overall={summary.overall} />}
            hint={
              summary.canShowHealthy
                ? "Evidencia fresca suficiente."
                : "UNKNOWN ≠ HEALTHY. Sin evidencia no se muestra como correcto."
            }
          />
          <MetricCard
            label="Cobertura de monitors"
            value={coverageLabelEs(summary.coverage)}
            hint={`${summary.monitorsEnabled} monitors · ${summary.assetsWithFreshEvidence} con evidencia fresca`}
          />
          <MetricCard
            label="Alertas abiertas"
            value={String(summary.openAlerts)}
            hint="Cero alertas ≠ estado correcto."
          />
          <MetricCard
            label="Incidentes abiertos"
            value={String(summary.openIncidents)}
            hint="Sin incidentes ≠ totalmente saludable."
          />
          <MetricCard
            label="Activos activos"
            value={String(monitoring.coverage?.assetsActive ?? 0)}
          />
        </div>
        <div className="cp-card" style={{ marginTop: "1rem" }}>
          <CoverageIndicator
            coverage={summary.coverage}
            monitorsEnabled={summary.monitorsEnabled}
            fresh={summary.assetsWithFreshEvidence}
          />
          <p className="cp-disclaimer">{monitoring.disclaimer}</p>
          {summary.fullyProtected ? null : (
            <p className="cp-disclaimer">
              No se afirma «totalmente protegido»: faltan pruebas deterministas de cobertura completa.
            </p>
          )}
        </div>
      </section>

      <section aria-labelledby="assets-health-heading" style={{ marginBottom: "1.25rem" }}>
        <h2 id="assets-health-heading" style={{ fontSize: "1.05rem", color: "var(--cp-navy)" }}>
          Salud por activo
        </h2>
        {monitoring.assets?.length ? (
          <div className="cp-grid cp-grid--2" style={{ marginTop: "0.75rem" }}>
            {monitoring.assets.slice(0, 12).map((a) => (
              <div key={a.assetId} className="cp-card">
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                  <strong>{a.hostname || `Activo #${a.assetId}`}</strong>
                  <StatusBadge status={a.overall} label={healthLabelEs(a.overall)} />
                </div>
                {a.reasons?.length ? (
                  <p className="cp-disclaimer">{a.reasons.slice(0, 2).join(" · ")}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="cp-card" style={{ marginTop: "0.75rem" }}>
            <p className="cp-disclaimer">Aún no hay activos activos para evaluar.</p>
          </div>
        )}
      </section>

      <section className="cp-grid cp-grid--2" style={{ marginBottom: "1.25rem" }}>
        <div className="cp-card">
          <h2 style={{ fontSize: "1.05rem", marginTop: 0 }}>Atajos</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            <Link className="cp-btn cp-btn--secondary" href="/dashboard/alertas">
              Alertas ({summary.openAlerts})
            </Link>
            <Link className="cp-btn cp-btn--secondary" href="/dashboard/incidentes">
              Incidentes ({summary.openIncidents})
            </Link>
            <Link className="cp-btn cp-btn--secondary" href="/dashboard/monitorizacion">
              Monitorización
            </Link>
            <Link className="cp-btn cp-btn--secondary" href="/dashboard/activos">
              Mis activos
            </Link>
            <Link className="cp-btn cp-btn--secondary" href="/dashboard/soporte">
              Soporte
            </Link>
            <Link className="cp-btn cp-btn--secondary" href="/dashboard/informes">
              Informes
            </Link>
          </div>
        </div>
        <div className="cp-card">
          <h2 style={{ fontSize: "1.05rem", marginTop: 0 }}>Actividad reciente</h2>
          {activity.length === 0 ? (
            <p className="cp-disclaimer">Aún no hay actividad registrada.</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: "1.1rem", fontSize: "0.875rem" }}>
              {activity.map((item) => (
                <li key={item.id}>
                  {item.action_type} · {relativeTimeEs(item.created_at)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
