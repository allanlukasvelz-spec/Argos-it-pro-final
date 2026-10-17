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
import { fetchMonitoring, fetchPortal, fetchGuardian } from "@/lib/clientApi";
import type { ClientPortalPayload, MonitoringSummary } from "@/lib/clientTypes";
import { clientReasonCopy, coverageLabelEs, healthLabelEs, monitoringDisclaimerEs, relativeTimeEs } from "@/lib/clientCopy";
import { deriveProtectionSummary } from "@/lib/clientHealthSemantics";
import { ChicoGuardian } from "@/components/client/ChicoGuardian";
import { WebProjectHomeCard } from "@/components/web-projects/WebProjectHomeCard";

export default function ResumenPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [portal, setPortal] = useState<ClientPortalPayload | null>(null);
  const [monitoring, setMonitoring] = useState<MonitoringSummary | null>(null);
  const [guardian, setGuardian] = useState<Awaited<ReturnType<typeof fetchGuardian>>["chico"] | null>(
    null
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [p, m, g] = await Promise.all([fetchPortal(), fetchMonitoring(), fetchGuardian()]);
      setPortal(p);
      setMonitoring(m);
      setGuardian(g.chico);
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
        meta="Estado basado en evidencia real. Sin comprobaciones o sin evidencia reciente no equivale a protegido."
      />

      <ChicoGuardian guardian={guardian} compact />

      <section className="cp-summary" aria-labelledby="protection-heading">
        <h2 id="protection-heading">Resumen de protección</h2>
        {summary.overall === "UNKNOWN" || summary.openAlerts > 0 || summary.openIncidents > 0 ? (
          <div className="cp-status-split">
            {summary.openAlerts > 0 || summary.openIncidents > 0 ? (
              <p>
                <strong>Qué requiere atención.</strong> Hay {summary.openAlerts} alerta
                {summary.openAlerts === 1 ? "" : "s"} abierta{summary.openAlerts === 1 ? "" : "s"} y{" "}
                {summary.openIncidents} incidente{summary.openIncidents === 1 ? "" : "s"} abierto
                {summary.openIncidents === 1 ? "" : "s"}.
              </p>
            ) : null}
            {summary.overall === "UNKNOWN" ? (
              <p>
                <strong>Qué no está confirmado.</strong> El estado de salud sigue sin datos suficientes.
                Sin datos no significa protegido.
              </p>
            ) : null}
          </div>
        ) : null}
        <div className="cp-grid cp-grid--5" style={{ marginTop: "0.75rem" }}>
          <MetricCard
            label="Salud"
            value={<HealthIndicator overall={summary.overall} />}
            hint={
              summary.canShowHealthy
                ? "Evidencia reciente suficiente."
                : "Estado de salud: sin datos suficientes."
            }
          />
          <MetricCard
            label="Cobertura de comprobaciones"
            value={coverageLabelEs(summary.coverage)}
            hint={`${summary.monitorsEnabled} comprobaciones · ${summary.assetsWithFreshEvidence} con evidencia reciente`}
          />
          <MetricCard
            label="Alertas abiertas"
            value={String(summary.openAlerts)}
            hint="Cero alertas no equivale a un estado correcto."
          />
          <MetricCard
            label="Incidentes abiertos"
            value={String(summary.openIncidents)}
            hint="Sin incidentes no equivale a estar protegido."
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
          <p className="cp-disclaimer">{monitoringDisclaimerEs(monitoring.disclaimer)}</p>
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
                  <p className="cp-disclaimer">
                    {a.reasons.slice(0, 2).map((reason) => clientReasonCopy(reason)).join(" · ")}
                  </p>
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

      <section style={{ marginBottom: "1.25rem" }}>
        <WebProjectHomeCard />
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
            <Link className="cp-btn cp-btn--secondary" href="/dashboard/proyectos">
              Proyectos
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
