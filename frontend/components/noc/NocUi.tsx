"use client";

import type { ReactNode } from "react";
import type { NocQueueItem } from "@/lib/nocApi";

export function SeverityBadge({ severity }: { severity: string }) {
  const s = String(severity || "").toUpperCase();
  const tone =
    s === "CRITICAL" ? "critical" : s === "WARNING" || s === "WARN" ? "warning" : "unknown";
  return <span className={`noc-badge noc-badge--${tone}`}>{s || "UNKNOWN"}</span>;
}

export function HealthBadge({ status }: { status: string }) {
  const s = String(status || "").toUpperCase();
  const tone =
    s === "HEALTHY"
      ? "healthy"
      : s === "WARNING"
        ? "warning"
        : s === "CRITICAL"
          ? "critical"
          : "unknown";
  const label = s === "HEALTHY" || s === "WARNING" || s === "CRITICAL" ? s : "UNKNOWN";
  return <span className={`noc-badge noc-badge--${tone}`}>{label}</span>;
}

export function SafetyLevelBadge({ level }: { level: string }) {
  return <span className="noc-safety">{level}</span>;
}

export function NocPageHeader({
  title,
  eyebrow,
  meta
}: {
  title: string;
  eyebrow?: string;
  meta?: string;
}) {
  return (
    <header className="noc-page-header">
      {eyebrow ? <p className="noc-page-header__eyebrow">{eyebrow}</p> : null}
      <h1>{title}</h1>
      {meta ? <p className="noc-page-header__meta">{meta}</p> : null}
    </header>
  );
}

export function NocLoading({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="noc-state" role="status">
      <p className="noc-state__title">{label}</p>
    </div>
  );
}

export function NocError({ title, onRetry }: { title: string; onRetry?: () => void }) {
  return (
    <div className="noc-state" role="alert">
      <p className="noc-state__title">{title}</p>
      {onRetry ? (
        <button type="button" className="noc-btn" onClick={onRetry}>
          Reintentar
        </button>
      ) : null}
    </div>
  );
}

export function NocEmpty({ title, description }: { title: string; description?: string }) {
  return (
    <div className="noc-state">
      <p className="noc-state__title">{title}</p>
      {description ? <p>{description}</p> : null}
    </div>
  );
}

export function NocNotAvailable({
  title,
  phase,
  description
}: {
  title: string;
  phase: string;
  description: string;
}) {
  return (
    <div>
      <NocPageHeader title={title} eyebrow="NOC · Placeholder" meta={`Fase ${phase}`} />
      <div className="noc-panel">
        <div className="noc-panel__body noc-state">
          <p className="noc-state__title">NOT_AVAILABLE_YET</p>
          <p>{description}</p>
          <p className="noc-disclaimer">
            No hay datos simulados. Este módulo llegará en la fase indicada.
          </p>
        </div>
      </div>
    </div>
  );
}

export function OrgHealthSummary({
  buckets
}: {
  buckets: Record<string, number>;
}) {
  return (
    <div className="noc-kpis">
      {(["HEALTHY", "WARNING", "CRITICAL", "UNKNOWN"] as const).map((k) => (
        <div className="noc-kpi" key={k}>
          <p className="noc-kpi__label">{k}</p>
          <p className="noc-kpi__value">
            <HealthBadge status={k} /> {buckets[k] ?? 0}
          </p>
        </div>
      ))}
    </div>
  );
}

export function EvidencePanel({
  title = "Evidencia (sanitizada)",
  evidence
}: {
  title?: string;
  evidence: unknown;
}) {
  return (
    <div className="noc-panel">
      <div className="noc-panel__head">{title}</div>
      <div className="noc-panel__body">
        {evidence == null ? (
          <p className="noc-disclaimer">Sin evidencia adjunta.</p>
        ) : (
          <pre className="noc-evidence">{JSON.stringify(evidence, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}

export function AbcConceptualPanel() {
  return (
    <div className="noc-panel noc-abc" aria-disabled="true">
      <div className="noc-panel__head">
        Cadena A / B / C (conceptual — sin ejecución)
        <span>
          <SafetyLevelBadge level="L0" /> <SafetyLevelBadge level="L1" />{" "}
          <SafetyLevelBadge level="L2" /> <SafetyLevelBadge level="L3" />{" "}
          <SafetyLevelBadge level="L4" />
        </span>
      </div>
      <div className="noc-panel__body">
        <div className="noc-abc__grid">
          <div className="noc-abc__card">
            <h3>Acción A</h3>
            <p className="noc-disclaimer">Inspección / reintento seguro. Deshabilitado hasta Phase 6.</p>
          </div>
          <div className="noc-abc__card">
            <h3>Acción B</h3>
            <p className="noc-disclaimer">Mitigación controlada. Deshabilitado hasta Phase 6.</p>
          </div>
          <div className="noc-abc__card">
            <h3>Acción C</h3>
            <p className="noc-disclaimer">Escalado / aprobación. Deshabilitado hasta Phase 6.</p>
          </div>
        </div>
        <p className="noc-disclaimer">
          Solo lectura en Phase 5. No hay OWNER ni ejecución remota desde esta consola.
        </p>
      </div>
    </div>
  );
}

export function OperationalQueue({
  items,
  selectedId,
  onSelect
}: {
  items: NocQueueItem[];
  selectedId?: number | null;
  onSelect?: (item: NocQueueItem) => void;
}) {
  if (items.length === 0) {
    return (
      <NocEmpty
        title="Cola operativa vacía"
        description="No hay alertas OPEN/ACKNOWLEDGED en la muestra. Cero alertas ≠ HEALTHY."
      />
    );
  }
  return (
    <div className="noc-table-wrap">
      <table className="noc-table">
        <thead>
          <tr>
            <th>Org</th>
            <th>Activo</th>
            <th>Señal</th>
            <th>Severidad</th>
            <th>Estado</th>
            <th>Tiempo</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row) => (
            <tr
              key={`${row.kind}-${row.id}`}
              className={selectedId === row.id ? "noc-row--selected" : undefined}
              onClick={() => onSelect?.(row)}
              style={{ cursor: onSelect ? "pointer" : undefined }}
            >
              <td>{row.organizationName || row.organizationId}</td>
              <td>{row.assetHostname || "—"}</td>
              <td>{row.signal}</td>
              <td>
                <SeverityBadge severity={row.severity} />
              </td>
              <td>{row.status}</td>
              <td>{row.time ? new Date(row.time).toLocaleString() : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="noc-filters">{children}</div>;
}

export function Kpi({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="noc-kpi">
      <p className="noc-kpi__label">{label}</p>
      <p className="noc-kpi__value">{value}</p>
    </div>
  );
}
