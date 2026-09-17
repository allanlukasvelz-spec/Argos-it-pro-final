"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AbcConceptualPanel,
  EvidencePanel,
  Kpi,
  NocError,
  NocLoading,
  NocPageHeader,
  OperationalQueue,
  OrgHealthSummary,
  SeverityBadge
} from "@/components/noc/NocUi";
import { fetchNocSummary, type NocQueueItem, type NocSummary } from "@/lib/nocApi";

export default function NocCommandCenterPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [summary, setSummary] = useState<NocSummary | null>(null);
  const [selected, setSelected] = useState<NocQueueItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const s = await fetchNocSummary();
      setSummary(s);
      setSelected(s.operationalQueue?.[0] || null);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <NocLoading label="Cargando Command Center…" />;
  if (error || !summary) {
    return <NocError title="No se pudo cargar el resumen NOC." onRetry={load} />;
  }

  return (
    <div>
      <NocPageHeader
        title="Command Center"
        eyebrow="NOC · Cross-tenant"
        meta="Cola operativa real. Sin remediación. UNKNOWN ≠ HEALTHY."
      />

      <div className="noc-kpis">
        <Kpi label="Orgs activas" value={summary.organizationsActive} />
        <Kpi label="Activos" value={summary.assetsActive} />
        <Kpi label="Monitors" value={summary.monitorsEnabled} />
        <Kpi label="Alertas abiertas" value={summary.openAlerts} />
        <Kpi label="Críticas" value={summary.openCriticalAlerts} />
        <Kpi label="Incidentes" value={summary.openIncidents} />
      </div>

      <div className="noc-panel">
        <div className="noc-panel__head">
          Salud muestreada ({summary.healthSampleSize} activos)
        </div>
        <div className="noc-panel__body">
          <OrgHealthSummary buckets={summary.healthBuckets} />
          <p className="noc-disclaimer">{summary.disclaimer}</p>
        </div>
      </div>

      <div className="noc-split">
        <div className="noc-panel">
          <div className="noc-panel__head">Cola operativa</div>
          <div className="noc-panel__body" style={{ padding: 0 }}>
            <OperationalQueue
              items={summary.operationalQueue}
              selectedId={selected?.id}
              onSelect={setSelected}
            />
          </div>
        </div>
        <div>
          {selected ? (
            <>
              <div className="noc-panel">
                <div className="noc-panel__head">Señal seleccionada</div>
                <div className="noc-panel__body">
                  <p>
                    <SeverityBadge severity={selected.severity} /> {selected.signal}
                  </p>
                  <p className="noc-disclaimer">
                    Org:{" "}
                    <Link href={`/noc/organizations/${selected.organizationId}`}>
                      {selected.organizationName || selected.organizationId}
                    </Link>
                    {" · "}
                    Activo: {selected.assetHostname || "—"}
                    {" · "}
                    <Link href={`/noc/alerts/${selected.id}`}>Ver alerta #{selected.id}</Link>
                  </p>
                  <p className="noc-disclaimer">{selected.reason || "Sin razón adicional."}</p>
                </div>
              </div>
              <EvidencePanel
                evidence={{
                  note: "Resumen de cola; evidencia completa en detalle de alerta.",
                  status: selected.status,
                  time: selected.time
                }}
              />
            </>
          ) : (
            <div className="noc-panel">
              <div className="noc-panel__body">
                <p className="noc-disclaimer">Selecciona una fila para inspeccionar.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <AbcConceptualPanel />
    </div>
  );
}
