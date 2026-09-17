"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import API from "@/lib/api";
import {
  HealthBadge,
  NocEmpty,
  NocError,
  NocLoading,
  NocPageHeader
} from "@/components/noc/NocUi";

type NocReportRow = {
  id: string;
  organization_id: number;
  report_type: string;
  title: string;
  status: string | null;
  latest_run_id: string | null;
  generated_at: string | null;
  data_freshness?: string | null;
  evidence_object_id: string | null;
  error_code: string | null;
  error_message: string | null;
  incident_id: number | null;
};

type NocJobRow = {
  id: number;
  job_type: string;
  organization_id: number | null;
  status: string;
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  created_at: string;
  completed_at: string | null;
};

function runTone(status: string | null | undefined): string {
  const s = String(status || "").toUpperCase();
  if (s === "READY" || s === "COMPLETED") return "HEALTHY";
  if (s === "FAILED" || s === "DEAD_LETTER") return "CRITICAL";
  if (s === "QUEUED" || s === "GENERATING" || s === "STORING" || s === "RUNNING" || s === "CLAIMED" || s === "RETRY_WAIT") {
    return "WARNING";
  }
  return "UNKNOWN";
}

function shortId(id: string | null | undefined, n = 8) {
  if (!id) return "—";
  return id.length <= n ? id : `${id.slice(0, n)}…`;
}

export default function NocReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reports, setReports] = useState<NocReportRow[]>([]);
  const [jobs, setJobs] = useState<NocJobRow[]>([]);
  const [retrying, setRetrying] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [reportsRes, jobsRes] = await Promise.all([
        API.get<{ reports: NocReportRow[] }>("/api/noc/reports"),
        API.get<{ jobs: NocJobRow[] }>("/api/noc/jobs").catch(() => ({ data: { jobs: [] } }))
      ]);
      setReports(reportsRes.data.reports || []);
      setJobs(jobsRes.data.jobs || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const jobsByOrg = useMemo(() => {
    const map = new Map<number, NocJobRow>();
    for (const job of jobs) {
      if (job.job_type !== "REPORT_GENERATE" || job.organization_id == null) continue;
      const prev = map.get(job.organization_id);
      if (!prev || job.id > prev.id) {
        map.set(job.organization_id, job);
      }
    }
    return map;
  }, [jobs]);

  async function retryRun(runId: string) {
    setRetrying(runId);
    try {
      await API.post(`/api/noc/reports/runs/${runId}/retry`);
      await load();
    } finally {
      setRetrying(null);
    }
  }

  if (loading) return <NocLoading label="Cargando informes NOC…" />;
  if (error) return <NocError title="No se han podido cargar los informes." onRetry={load} />;

  return (
    <div>
      <NocPageHeader
        title="Reports"
        eyebrow="NOC · REPORTING"
        meta="Cross-tenant report runs, platform jobs, artifacts and retry."
      />

      {reports.length === 0 ? (
        <NocEmpty
          title="Sin informes"
          description="No hay report_runs registrados. Vacío ≠ fallo de plataforma."
        />
      ) : (
        <div className="noc-table-wrap">
          <table className="noc-table">
            <thead>
              <tr>
                <th>Org</th>
                <th>Report</th>
                <th>Incident</th>
                <th>Run state</th>
                <th>Job</th>
                <th>Attempts</th>
                <th>Artifact</th>
                <th>Failure</th>
                <th>Generated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => {
                const job = jobsByOrg.get(r.organization_id);
                const canRetry = r.status === "FAILED" && Boolean(r.latest_run_id);
                return (
                  <tr key={r.id}>
                    <td>{r.organization_id}</td>
                    <td>
                      <div>{r.report_type}</div>
                      <div className="noc-disclaimer">{shortId(r.id, 12)}</div>
                    </td>
                    <td>{r.incident_id ?? "—"}</td>
                    <td>
                      <HealthBadge status={runTone(r.status)} />{" "}
                      <span>{r.status || "UNKNOWN"}</span>
                      {r.latest_run_id ? (
                        <div className="noc-disclaimer">run {shortId(r.latest_run_id)}</div>
                      ) : null}
                    </td>
                    <td>
                      {job ? (
                        <>
                          <HealthBadge status={runTone(job.status)} /> {job.status}
                          <div className="noc-disclaimer">#{job.id}</div>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      {job ? `${job.attempts}/${job.max_attempts}` : "—"}
                    </td>
                    <td>
                      {r.evidence_object_id ? (
                        <code title={r.evidence_object_id}>{shortId(r.evidence_object_id, 10)}</code>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      {r.error_code || job?.last_error ? (
                        <span
                          className="noc-disclaimer"
                          title={r.error_message || job?.last_error || ""}
                        >
                          {r.error_code || "JOB_ERROR"}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      {r.generated_at ? new Date(r.generated_at).toLocaleString("es-ES") : "—"}
                    </td>
                    <td>
                      {canRetry ? (
                        <button
                          type="button"
                          className="noc-btn noc-btn--primary"
                          disabled={retrying === r.latest_run_id}
                          onClick={() => void retryRun(r.latest_run_id!)}
                        >
                          {retrying === r.latest_run_id ? "…" : "Retry"}
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="noc-disclaimer" style={{ marginTop: "0.75rem" }}>
        Platform health ≠ customer health. READY requires verified evidence artifact.
      </p>
    </div>
  );
}
