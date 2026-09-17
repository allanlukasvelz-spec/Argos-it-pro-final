"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  StatusBadge
} from "@/components/client/Status";
import { discoverDomain, fetchAssets, fetchTls } from "@/lib/clientApi";
import type { ClientAsset, ClientTlsCertificate } from "@/lib/clientTypes";
import { relativeTimeEs } from "@/lib/clientCopy";

const TYPE_FILTERS: Record<string, string[] | null> = {
  all: null,
  dominios: ["DOMAIN", "HOSTNAME"],
  websites: ["WEBSITE"],
  servidores: ["SERVER"],
  apis: ["API"],
  "bases-de-datos": ["DATABASE"],
  servicios: ["SERVICE"],
  "certificados-tls": ["TLS_CERTIFICATE"]
};

export default function ActivosPage({ typeKey = "all" }: { typeKey?: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [assets, setAssets] = useState<ClientAsset[]>([]);
  const [certs, setCerts] = useState<ClientTlsCertificate[]>([]);
  const [hostname, setHostname] = useState("");
  const [discovering, setDiscovering] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [a, t] = await Promise.all([fetchAssets(), fetchTls()]);
      setAssets(a);
      setCerts(t);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filter = TYPE_FILTERS[typeKey] ?? null;
  const showTlsOnly = typeKey === "certificados-tls";

  const filtered = useMemo(() => {
    if (!filter) return assets;
    return assets.filter((a) => filter.includes(a.type));
  }, [assets, filter]);

  async function onDiscover(e: FormEvent) {
    e.preventDefault();
    const host = hostname.trim();
    if (!host) return;
    setDiscovering(true);
    try {
      await discoverDomain(host);
      toast.success("Dominio descubierto (solo lectura).");
      setHostname("");
      await load();
    } catch {
      toast.error("No se pudo descubrir el dominio.");
    } finally {
      setDiscovering(false);
    }
  }

  if (loading) return <LoadingState label="Cargando activos…" />;
  if (error) return <ErrorState title="No se han podido cargar los activos." onRetry={load} />;

  return (
    <div>
      <PageHeader
        title={showTlsOnly ? "Certificados TLS" : "Mis activos"}
        eyebrow="Inventario"
        meta="Solo datos del tenant actual. Sin inventario inventado."
      />

      {!showTlsOnly ? (
        <form className="cp-card cp-form" onSubmit={onDiscover} style={{ marginBottom: "1rem" }}>
          <label>
            Descubrir dominio (hostname público)
            <input
              value={hostname}
              onChange={(e) => setHostname(e.target.value)}
              placeholder="ej. ejemplo.com"
              autoComplete="off"
            />
          </label>
          <button type="submit" className="cp-btn cp-btn--primary" disabled={discovering}>
            {discovering ? "Descubriendo…" : "Descubrir"}
          </button>
        </form>
      ) : null}

      {showTlsOnly ? (
        certs.length === 0 ? (
          <EmptyState title="Aún no hay certificados TLS." />
        ) : (
          <>
            <div className="cp-table-wrap cp-table-desktop cp-card">
              <table className="cp-table">
                <thead>
                  <tr>
                    <th>Hostname</th>
                    <th>Proveedor</th>
                    <th>Emisor</th>
                    <th>Válido hasta</th>
                    <th>Estado</th>
                    <th>Wildcard</th>
                    <th>Auto-renovación</th>
                  </tr>
                </thead>
                <tbody>
                  {certs.map((c) => (
                    <tr key={c.id}>
                      <td>{c.assetHostname || c.assetName || "—"}</td>
                      <td>{c.provider || "—"}</td>
                      <td>{c.issuer || "—"}</td>
                      <td>{c.notAfter ? new Date(c.notAfter).toLocaleDateString("es-ES") : "—"}</td>
                      <td>
                        <StatusBadge status={c.observationStatus === "VALID" ? "HEALTHY" : c.observationStatus === "EXPIRED" ? "CRITICAL" : c.observationStatus === "EXPIRING" ? "WARNING" : "UNKNOWN"} label={c.observationStatus || "UNKNOWN"} />
                      </td>
                      <td>{c.isWildcard ? "Sí" : "No"}</td>
                      <td>
                        {c.autoRenew == null ? "—" : c.autoRenew ? "Sí" : "No"}
                        {c.renewalMethod ? ` (${c.renewalMethod})` : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="cp-cards-mobile">
              {certs.map((c) => (
                <div key={c.id} className="cp-asset-card">
                  <strong>{c.assetHostname || "Certificado"}</strong>
                  <div style={{ marginTop: "0.35rem" }}>
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
                    />
                  </div>
                  <p className="cp-disclaimer">
                    Hasta: {c.notAfter ? new Date(c.notAfter).toLocaleDateString("es-ES") : "—"} · SAN:{" "}
                    {(c.sans || []).slice(0, 3).join(", ") || "—"}
                  </p>
                </div>
              ))}
            </div>
            <p className="cp-disclaimer">Las claves privadas nunca se exponen.</p>
          </>
        )
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Aún no hay elementos."
          description={
            filter
              ? "No hay activos de este tipo en la organización."
              : "Cuando registres dominios o websites aparecerán aquí."
          }
        />
      ) : (
        <>
          <div className="cp-table-wrap cp-table-desktop cp-card">
            <table className="cp-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Nombre</th>
                  <th>Hostname</th>
                  <th>Estado</th>
                  <th>Última observación</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id}>
                    <td>{a.type}</td>
                    <td>{a.name}</td>
                    <td>{a.hostname || "—"}</td>
                    <td>{a.status || "UNKNOWN"}</td>
                    <td>{relativeTimeEs(a.lastObservedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="cp-cards-mobile">
            {filtered.map((a) => (
              <div key={a.id} className="cp-asset-card">
                <strong>{a.name}</strong>
                <p className="cp-disclaimer">
                  {a.type} · {a.hostname || "sin hostname"} · {a.status}
                </p>
                <p className="cp-disclaimer">{relativeTimeEs(a.lastObservedAt)}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
