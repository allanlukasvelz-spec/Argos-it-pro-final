"use client";

import type { ReactNode } from "react";
import { healthLabelEs } from "@/lib/clientCopy";

type StatusTone = "HEALTHY" | "WARNING" | "CRITICAL" | "UNKNOWN";

const ICONS: Record<StatusTone, string> = {
  HEALTHY: "✓",
  WARNING: "▲",
  CRITICAL: "◆",
  UNKNOWN: "−"
};

export function StatusBadge({
  status,
  label
}: {
  status: string;
  label?: string;
}) {
  const tone = (["HEALTHY", "WARNING", "CRITICAL"].includes(String(status).toUpperCase())
    ? String(status).toUpperCase()
    : "UNKNOWN") as StatusTone;
  const text = label || healthLabelEs(tone);
  const cls =
    tone === "HEALTHY"
      ? "cp-status cp-status--healthy"
      : tone === "WARNING"
        ? "cp-status cp-status--warning"
        : tone === "CRITICAL"
          ? "cp-status cp-status--critical"
          : "cp-status cp-status--unknown";

  return (
    <span className={cls} role="status" aria-label={`Estado: ${text}`}>
      <span aria-hidden="true">{ICONS[tone]}</span>
      <span>{text}</span>
    </span>
  );
}

export function HealthIndicator({ overall }: { overall: string }) {
  return <StatusBadge status={overall} />;
}

export function CoverageIndicator({
  coverage,
  monitorsEnabled,
  fresh
}: {
  coverage: string;
  monitorsEnabled: number;
  fresh: number;
}) {
  const label =
    coverage === "NONE"
      ? "Sin cobertura"
      : coverage === "PARTIAL"
        ? "Cobertura parcial"
        : "Cobertura con evidencia";
  return (
    <div>
      <StatusBadge
        status={coverage === "NONE" ? "UNKNOWN" : coverage === "PARTIAL" ? "WARNING" : "UNKNOWN"}
        label={label}
      />
      <p className="cp-disclaimer" style={{ marginTop: "0.35rem" }}>
        Monitors activos: {monitorsEnabled}. Activos con evidencia fresca: {fresh}. Monitored ≠ Healthy.
      </p>
    </div>
  );
}

export function MetricCard({
  label,
  value,
  hint
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="cp-card">
      <p className="cp-metric__label">{label}</p>
      <p className="cp-metric__value">{value}</p>
      {hint ? <p className="cp-disclaimer">{hint}</p> : null}
    </div>
  );
}

export function LoadingState({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="cp-state" role="status" aria-live="polite">
      <p className="cp-state__title">{label}</p>
    </div>
  );
}

export function EmptyState({
  title = "Aún no hay elementos.",
  description
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="cp-state">
      <p className="cp-state__title">{title}</p>
      {description ? <p>{description}</p> : null}
    </div>
  );
}

export function UnknownState({
  title = "Aún no hay datos suficientes para confirmar el estado.",
  description
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="cp-state">
      <StatusBadge status="UNKNOWN" />
      <p className="cp-state__title" style={{ marginTop: "0.75rem" }}>
        {title}
      </p>
      {description ? <p>{description}</p> : null}
    </div>
  );
}

export function ErrorState({
  title = "No se ha podido cargar.",
  onRetry
}: {
  title?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="cp-state" role="alert">
      <p className="cp-state__title">{title}</p>
      {onRetry ? (
        <button type="button" className="cp-btn cp-btn--secondary" onClick={onRetry}>
          Reintentar
        </button>
      ) : null}
    </div>
  );
}

export function NotAvailableState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="cp-card cp-state">
      <p className="cp-state__title">{title}</p>
      <p>{description}</p>
      <p className="cp-disclaimer">Estado: NOT_AVAILABLE_YET — no se inventan datos.</p>
    </div>
  );
}

export function PageHeader({
  title,
  eyebrow,
  meta
}: {
  title: string;
  eyebrow?: string;
  meta?: string;
}) {
  return (
    <header className="cp-page-header">
      {eyebrow ? <p className="cp-page-header__eyebrow">{eyebrow}</p> : null}
      <h1>{title}</h1>
      {meta ? <p className="cp-page-header__meta">{meta}</p> : null}
    </header>
  );
}
