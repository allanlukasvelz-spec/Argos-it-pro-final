"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AbcConceptualPanel,
  EvidencePanel,
  NocError,
  NocLoading,
  NocPageHeader,
  SeverityBadge
} from "@/components/noc/NocUi";
import { fetchNocAlert, type NocAlert } from "@/lib/nocApi";

export default function NocAlertDetailPage() {
  const params = useParams();
  const id = Number(params?.id);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [alert, setAlert] = useState<NocAlert | null>(null);

  const load = useCallback(async () => {
    if (!Number.isInteger(id)) {
      setError(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      setAlert(await fetchNocAlert(id));
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
  if (error || !alert) return <NocError title="Alerta no encontrada." onRetry={load} />;

  return (
    <div>
      <NocPageHeader
        title={alert.title}
        eyebrow={`Alert #${alert.id}`}
        meta={`${alert.state} · org ${alert.organizationName || alert.organizationId}`}
      />
      <p className="noc-disclaimer" style={{ marginBottom: "0.75rem" }}>
        <Link href="/noc/alerts">← Alerts</Link>
        {" · "}
        <SeverityBadge severity={alert.severity} />
      </p>
      <div className="noc-panel">
        <div className="noc-panel__body">
          <p>{alert.reason || "Sin razón."}</p>
          <p className="noc-disclaimer">
            Activo: {alert.assetHostname || "—"} · count: {alert.count} · opened:{" "}
            {alert.openedAt ? new Date(alert.openedAt).toLocaleString() : "—"}
          </p>
        </div>
      </div>
      <EvidencePanel evidence={alert.evidenceSummary} />
      <AbcConceptualPanel />
    </div>
  );
}
