"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CLIENT_ASSET_TYPES,
  CLIENT_NAV,
  CLIENT_QUESTIONS,
  DEMO_ALERTS,
  DEMO_ASSETS,
  DEMO_INCIDENTS
} from "@/lib/platform-map/platformMapData";
import { usePlatformMap } from "@/lib/platform-map/PlatformMapProvider";
import DemoRoleSwitcher from "./DemoRoleSwitcher";
import MockLabel from "./MockLabel";
import StatusBadge from "./StatusBadge";
import TenantContextChip from "./TenantContextChip";

function isCurrent(pathname: string, href: string) {
  if (href === "/platform-map/client") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function ClientPortalDemo({ slug }: { slug: string[] }) {
  const { organization, isReadOnly, role } = usePlatformMap();
  const [drawer, setDrawer] = useState(false);
  const pathname = `/platform-map/client${slug.length ? `/${slug.join("/")}` : ""}`;
  const assets = DEMO_ASSETS.filter((asset) => asset.organizationId === organization.id);
  const alerts = DEMO_ALERTS.filter((alert) => alert.organizationId === organization.id);
  const incidents = DEMO_INCIDENTS.filter((incident) => incident.organizationId === organization.id);
  const path = slug.join("/");

  return (
    <div className="pm-client">
      <button
        type="button"
        className={`pm-drawer-scrim${drawer ? " is-open" : ""}`}
        aria-hidden={!drawer}
        onClick={() => setDrawer(false)}
      />
      <aside className={`pm-aside${drawer ? " is-open" : ""}`} aria-label="Sidebar Client Portal">
        <p className="pm-kicker">ARGOS</p>
        <p>{organization.name}</p>
        <nav>
          {CLIENT_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
              onClick={() => setDrawer(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div>
        <div className="pm-topbar">
          <button type="button" className="pm-btn pm-menu" onClick={() => setDrawer(true)}>
            Menú
          </button>
          <div>
            <strong>Client Portal</strong>
            <div>
              <TenantContextChip /> · {role}
            </div>
          </div>
          <DemoRoleSwitcher />
        </div>
        <div className="pm-main">
          {isReadOnly ? (
            <p>
              <MockLabel kind="DEMO" /> org_viewer: la interfaz es de solo lectura. Los botones de
              acción aparecen desactivados.
            </p>
          ) : null}
          {renderPage(path, { organization, assets, alerts, incidents, isReadOnly })}
          <p style={{ marginTop: "1.5rem" }}>
            <Link href="/platform-map">← Mapa maestro</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function renderPage(
  path: string,
  ctx: {
    organization: ReturnType<typeof usePlatformMap>["organization"];
    assets: typeof DEMO_ASSETS;
    alerts: typeof DEMO_ALERTS;
    incidents: typeof DEMO_INCIDENTS;
    isReadOnly: boolean;
  }
) {
  const { organization, assets, alerts, incidents, isReadOnly } = ctx;

  if (!path) {
    return (
      <>
        <p className="pm-kicker">Resumen</p>
        <h1 className="pm-title" style={{ fontSize: "2rem" }}>
          Estado de protección
        </h1>
        <article className="pm-card">
          <StatusBadge status={organization.protection} demoProtected />
          <p>{organization.protectionNote}</p>
        </article>
        <div className="pm-questions">
          {CLIENT_QUESTIONS.map((question, index) => (
            <article key={question} className="pm-q">
              <strong>{question}</strong>
              <p>{answerFor(question, organization.protection, alerts.length, incidents.length)}</p>
              {index === 0 ? <MockLabel kind="DEMO" /> : null}
            </article>
          ))}
        </div>
        <div className="pm-grid-2">
          <article className="pm-card">
            <h3>Attention Required</h3>
            <p>
              {alerts.length
                ? `${alerts.length} alerta DEMO abierta en ${organization.name}.`
                : "No hay alertas DEMO en esta organización."}
            </p>
            <Link href="/platform-map/client/alertas">Abrir alertas</Link>
          </article>
          <article className="pm-card">
            <h3>Preventive Actions</h3>
            <p>Revisión TLS programada. Representación target. Sin ejecución.</p>
            <MockLabel kind="PLACEHOLDER" />
          </article>
        </div>
      </>
    );
  }

  if (path === "activos" || path.startsWith("activos/")) {
    const type = CLIENT_ASSET_TYPES.find((item) => path === `activos/${item.slug}` || path.startsWith(`activos/${item.slug}/`));
    const visible = type ? assets.filter((asset) => asset.type === type.type) : assets;
    const selectedId = path.split("/")[2];
    const selected = assets.find((asset) => asset.id === selectedId);
    return (
      <>
        <h1 className="pm-title" style={{ fontSize: "2rem" }}>
          {type ? type.label : "Mis activos"}
        </h1>
        <div className="pm-cta-row">
          {CLIENT_ASSET_TYPES.map((item) => (
            <Link key={item.slug} href={`/platform-map/client/activos/${item.slug}`} className="pm-btn pm-btn--ghost">
              {item.label}
            </Link>
          ))}
        </div>
        {selected ? (
          <article className="pm-card" style={{ marginTop: "1rem" }}>
            <h3>{selected.name}</h3>
            <StatusBadge status={selected.status} />
            <p>{selected.summary}</p>
            <MockLabel kind="DEMO" />
          </article>
        ) : null}
        <table className="pm-table">
          <thead>
            <tr>
              <th>Activo</th>
              <th>Tipo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((asset) => (
              <tr key={asset.id}>
                <td>
                  <Link href={`/platform-map/client/activos/${CLIENT_ASSET_TYPES.find((item) => item.type === asset.type)?.slug}/${asset.id}`}>
                    {asset.name}
                  </Link>
                </td>
                <td>{asset.type}</td>
                <td>
                  <StatusBadge status={asset.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
  }

  if (path === "alertas" || path.startsWith("alertas/")) {
    const selected = alerts.find((alert) => path === `alertas/${alert.id}`) ?? alerts[0];
    return (
      <>
        <h1 className="pm-title" style={{ fontSize: "2rem" }}>
          Alertas
        </h1>
        {alerts.map((alert) => (
          <article key={alert.id} className="pm-card">
            <h3>
              <Link href={`/platform-map/client/alertas/${alert.id}`}>{alert.title}</Link>
            </h3>
            <p>
              {alert.severity} · {alert.status} · <MockLabel kind="DEMO" />
            </p>
          </article>
        ))}
        {selected ? (
          <article className="pm-card">
            <h3>Detalle</h3>
            <p>{selected.title}. Lenguaje de negocio, no hipótesis NOC.</p>
            <button type="button" className="pm-btn" disabled={isReadOnly}>
              {isReadOnly ? "Acción no disponible" : "Marcar como vista (DEMO)"}
            </button>
          </article>
        ) : (
          <p>Sin alertas DEMO para esta organización.</p>
        )}
      </>
    );
  }

  if (path === "incidentes" || path.startsWith("incidentes/")) {
    return (
      <>
        <h1 className="pm-title" style={{ fontSize: "2rem" }}>
          Incidentes
        </h1>
        {incidents.length === 0 ? (
          <p>NO_INCIDENTS_DETECTED no significa FULLY_HEALTHY. En Organization B no hay incidente DEMO abierto.</p>
        ) : (
          incidents.map((incident) => (
            <article key={incident.id} className="pm-card">
              <h3>
                <Link href={`/platform-map/client/incidentes/${incident.id}`}>{incident.title}</Link>
              </h3>
              <p>El impacto está siendo seguido. ARGOS actúa o necesita aprobación. Sin cadena A/B/C aquí.</p>
              <MockLabel kind="DEMO" />
            </article>
          ))
        )}
      </>
    );
  }

  const placeholders: Record<string, string> = {
    monitorizacion: "Cobertura observada. MONITORED ≠ COVERED ≠ HEALTHY.",
    seguridad: "CHICO Security Guardian es TARGET en runtime. Aquí solo se reserva el espacio.",
    prevencion: "Acciones preventivas visibles como impacto, no como runbook interno.",
    auditorias: "Historial de revisiones. Sin informes inventados de clientes reales.",
    informes: "History / Reports. Los artefactos reales viven en /api/client/reports.",
    soporte: "Canal de solicitudes. No es el Control Center.",
    cuenta: "Perfil y organización actual. El selector de rol de esta maqueta no cambia permisos reales."
  };

  if (placeholders[path]) {
    return (
      <>
        <h1 className="pm-title" style={{ fontSize: "2rem" }}>
          {CLIENT_NAV.find((item) => item.slug === path)?.label}
        </h1>
        <article className="pm-card">
          <MockLabel kind="PLACEHOLDER" />
          <p>{placeholders[path]}</p>
        </article>
      </>
    );
  }

  return (
    <>
      <h1 className="pm-title" style={{ fontSize: "2rem" }}>
        Ruta target
      </h1>
      <p>Pantalla reservada dentro del Client Portal objetivo.</p>
      <MockLabel kind="PLACEHOLDER" />
    </>
  );
}

function answerFor(
  question: string,
  protection: string,
  alerts: number,
  incidents: number
) {
  if (question.includes("protegido?")) {
    return protection === "UNKNOWN"
      ? "Todavía no hay información suficiente para confirmar que todo está protegido."
      : "Hay riesgo observado. No se afirma PROTECTED.";
  }
  if (question.includes("riesgo")) return alerts ? "Sí. Hay una alerta DEMO abierta." : "No hay alerta DEMO abierta. Eso no equivale a sano.";
  if (question.includes("incidentes")) return incidents ? "Sí. Hay un incidente DEMO en investigación." : "No hay incidente DEMO abierto.";
  if (question.includes("prevenido")) return "Revisión TLS en curso. Representación target.";
  if (question.includes("hacer algo")) return alerts ? "Revisar la alerta y esperar o autorizar si ARGOS lo pide." : "Nada urgente en los datos DEMO de esta organización.";
  return `${alerts + incidents > 0 ? "Web y TLS con seguimiento." : "Cobertura incompleta."} UNKNOWN no se pinta como protegido.`;
}
