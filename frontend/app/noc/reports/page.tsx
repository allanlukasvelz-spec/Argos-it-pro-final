"use client";

import { useCallback, useEffect, useState } from "react";
import API from "@/lib/api";
import { ErrorState, LoadingState, PageHeader, StatusBadge } from "@/components/client/Status";

type NocReportRow = {
  id: string;
  organization_id: number;
  report_type: string;
  title: string;
  status: string | null;
  latest_run_id: string | null;
  generated_at: string | null;
  evidence_object_id: string | null;
  error_code: string | null;
  error_message: string | null;
  incident_id: number | null;
};

export default function NocReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reports, setReports] = useState<NocReportRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { data } = await API.get<{ reports: NocReportRow[] }>("/api/noc/reports");
      setReports(data.reports || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function retryRun(runId: string) {
    await API.post(`/api/noc/reports/runs/${runId}/retry`);
    await load();
  }

  if (loading) return <LoadingState label="Cargando informes NOC…" />;
  if (error) return <ErrorState title="No se han podido cargar los informes." onRetry={load} />;

  return (
    <div>
      <PageHeader title="Reports" eyebrow="NOC" meta="Cross-tenant report runs and artifact state." />
      {reports.length === 0 ? (
        <p className="cp-muted">No hay informes generados.</p>
      ) : (
        <div className="cp-table-wrap">
          <table className="cp-table">
            <thead>
              <tr>
                <th>Org</th>
                <th>Tipo</th>
                <th>Incidente</th>
                <th>Estado</th>
                <th>Generado</th>
                <th>Evidencia</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td>{r.organization_id}</td>
                  <td>{r.report_type}</td>
                  <td>{r.incident_id ?? "—"}</td>
                  <td>
                    <StatusBadge status={r.status === "READY" ? "HEALTHY" : r.status === "FAILED" ? "CRITICAL" : "UNKNOWN"} label={r.status || "—"} />
                  </td>
                  <td>{r.generated_at ? new Date(r.generated_at).toLocaleString("es-ES") : "—"}</td>
                  <td>{r.evidence_object_id ? r.evidence_object_id.slice(0, 8) + "…" : "—"}</td>
                  <td>
                    {r.status === "FAILED" && r.latest_run_id ? (
                      <button type="button" onClick={() => void retryRun(r.latest_run_id!)}>
                        Reintentar
                      </button>
                    ) : null}
                    {r.error_code ? (
                      <span className="cp-muted" title={r.error_message || ""}>
                        {r.error_code}
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
