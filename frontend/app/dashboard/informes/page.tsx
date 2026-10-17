"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  StatusBadge
} from "@/components/client/Status";
import { ChicoGuardianBanner } from "@/components/client/ChicoGuardianBanner";
import { fetchReports, downloadReportPdf, requestIncidentReport } from "@/lib/clientApi";
import type { ClientReport } from "@/lib/clientTypes";

function reportStatusLabel(status: string | null | undefined) {
  switch (status) {
    case "READY":
      return "Listo";
    case "QUEUED":
    case "GENERATING":
    case "STORING":
      return "Generando";
    case "FAILED":
      return "Error";
    case "EXPIRED":
      return "Caducado";
    default:
      return status || "Desconocido";
  }
}

export default function InformesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reports, setReports] = useState<ClientReport[]>([]);
  const [requesting, setRequesting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setReports(await fetchReports());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRequestFromQuery() {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    const incidentId = params.get("incidentId");
    if (!incidentId) return;
    setRequesting(true);
    setMessage(null);
    try {
      await requestIncidentReport(Number(incidentId));
      setMessage("Informe solicitado. Aparecerá aquí cuando esté listo.");
      await load();
    } catch {
      setMessage("No se ha podido solicitar el informe.");
    } finally {
      setRequesting(false);
    }
  }

  useEffect(() => {
    void handleRequestFromQuery();
  }, []);

  if (loading) return <LoadingState label="Cargando informes…" />;
  if (error) return <ErrorState title="No se han podido cargar los informes." onRetry={load} />;

  return (
    <div>
      <PageHeader
        title="Informes"
        eyebrow="Reporting"
        meta="Informes de incidente generados desde datos verificados de ARGOS."
      />
      <ChicoGuardianBanner />
      {message ? (
        <p className="cp-meta" style={{ marginBottom: "1rem" }}>
          {message}
        </p>
      ) : null}

      {reports.length === 0 ? (
        <EmptyState
          title="Aún no hay informes."
          description="Solicita un informe desde un incidente o espera a que se genere uno."
        />
      ) : (
        <div className="cp-table-wrap">
          <table className="cp-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Referencia</th>
                <th>Estado</th>
                <th>Generado</th>
                <th>Freshness</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td>{r.reportType}</td>
                  <td>
                    {r.title}
                    {r.incidentId ? ` · #${r.incidentId}` : ""}
                  </td>
                  <td>
                    <StatusBadge status={r.status === "READY" ? "HEALTHY" : r.status === "FAILED" ? "CRITICAL" : "UNKNOWN"} label={reportStatusLabel(r.status)} />
                  </td>
                  <td>{r.generatedAt ? new Date(r.generatedAt).toLocaleString("es-ES") : "—"}</td>
                  <td>{r.dataFreshness ? new Date(r.dataFreshness).toLocaleString("es-ES") : "—"}</td>
                  <td>
                    {r.status === "READY" ? (
                      <button
                        type="button"
                        className="cp-link-button"
                        onClick={async () => {
                          try {
                            const blob = await downloadReportPdf(r.id);
                            const url = URL.createObjectURL(blob);
                            window.open(url, "_blank", "noopener,noreferrer");
                            setTimeout(() => URL.revokeObjectURL(url), 60000);
                          } catch {
                            setMessage("No se ha podido abrir el PDF.");
                          }
                        }}
                      >
                        Ver PDF
                      </button>
                    ) : r.status === "FAILED" ? (
                      <span className="cp-muted">{r.errorCode || "FAILED"}</span>
                    ) : (
                      <span className="cp-muted">En cola…</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="cp-meta" style={{ marginTop: "1.5rem" }}>
        ¿Incidente abierto?{" "}
        <Link href="/dashboard/incidentes">Ir a incidentes</Link>
        {requesting ? " · Solicitando informe…" : ""}
      </p>
    </div>
  );
}
