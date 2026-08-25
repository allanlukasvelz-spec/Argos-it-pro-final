"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  HealthBadge,
  Kpi,
  NocError,
  NocLoading,
  NocPageHeader,
  OrgHealthSummary
} from "@/components/noc/NocUi";
import { fetchNocOrganization } from "@/lib/nocApi";

export default function NocOrganizationDetailPage() {
  const params = useParams();
  const id = Number(params?.id);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    if (!Number.isInteger(id)) {
      setError(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      setData(await fetchNocOrganization(id));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <NocLoading />;
  if (error || !data) {
    return <NocError title="No se pudo cargar la organización." onRetry={load} />;
  }

  const org = (data.organization || {}) as {
    id: number;
    name: string;
    slug: string;
    status: string;
  };
  const assets = Array.isArray(data.assets) ? (data.assets as Array<Record<string, unknown>>) : [];
  const overall = String(data.overall || "UNKNOWN");
  const buckets = { HEALTHY: 0, WARNING: 0, CRITICAL: 0, UNKNOWN: 0 };
  for (const a of assets) {
    const k = String(a.overall || "UNKNOWN").toUpperCase();
    if (k in buckets) buckets[k as keyof typeof buckets] += 1;
    else buckets.UNKNOWN += 1;
  }

  return (
    <div>
      <NocPageHeader
        title={org.name || `Org ${id}`}
        eyebrow={`slug: ${org.slug || "—"} · ${org.status || ""}`}
        meta="Rollups de solo lectura. Sin impersonación de cookie."
      />
      <p className="noc-disclaimer" style={{ marginBottom: "0.75rem" }}>
        <Link href="/noc/organizations">← Organizations</Link>
        {" · "}
        <Link href={`/noc/assets?organization_id=${id}`}>Assets</Link>
        {" · "}
        <Link href={`/noc/alerts?organization_id=${id}`}>Alerts</Link>
      </p>
      <div className="noc-kpis">
        <Kpi label="Overall" value={<HealthBadge status={overall} />} />
        <Kpi label="Activos muestreados" value={assets.length} />
      </div>
      <div className="noc-panel">
        <div className="noc-panel__head">Salud por activo</div>
        <div className="noc-panel__body">
          <OrgHealthSummary buckets={buckets} />
          <p className="noc-disclaimer">{String(data.disclaimer || "")}</p>
        </div>
      </div>
      <div className="noc-panel">
        <div className="noc-panel__head">Payload</div>
        <div className="noc-panel__body">
          <pre className="noc-evidence">{JSON.stringify(data, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
