"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AUTOMATION_LEVELS,
  DEMO_ALERTS,
  DEMO_ASSETS,
  DEMO_INCIDENTS,
  DEMO_REMEDIATION,
  NOC_NAV
} from "@/lib/platform-map/platformMapData";
import { usePlatformMap } from "@/lib/platform-map/PlatformMapProvider";
import type { RemediationAction } from "@/lib/platform-map/types";
import ApprovalGate from "./ApprovalGate";
import DemoOrganizationSwitcher from "./DemoOrganizationSwitcher";
import EvidenceStack from "./EvidenceStack";
import MockLabel from "./MockLabel";
import SafeStop from "./SafeStop";
import StatusBadge from "./StatusBadge";
import TenantContextChip from "./TenantContextChip";
import WhyThisAction from "./WhyThisAction";

const FLOW = [
  { id: "alert", label: "Alert" },
  { id: "investigation", label: "Investigation" },
  { id: "evidence", label: "Evidence" },
  { id: "hypothesis", label: "Hypothesis" },
  { id: "action-a", label: "Action A" },
  { id: "verify-a", label: "Verify A" },
  { id: "action-b", label: "Action B" },
  { id: "verify-b", label: "Verify B" },
  { id: "action-c", label: "Action C" },
  { id: "close", label: "Resolve / Safe Stop" }
] as const;

function isCurrent(pathname: string, href: string) {
  if (href === "/platform-map/noc") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function NocDemo({ slug }: { slug: string[] }) {
  const { organization } = usePlatformMap();
  const [drawer, setDrawer] = useState(false);
  const [step, setStep] = useState<(typeof FLOW)[number]["id"]>("alert");
  const [why, setWhy] = useState<RemediationAction | null>(null);
  const [outcome, setOutcome] = useState("");
  const pathname = `/platform-map/noc${slug.length ? `/${slug.join("/")}` : ""}`;
  const path = slug.join("/");
  const assets = DEMO_ASSETS.filter((asset) => asset.organizationId === organization.id);
  const alerts = DEMO_ALERTS.filter((alert) => alert.organizationId === organization.id);
  const incidents = DEMO_INCIDENTS.filter((incident) => incident.organizationId === organization.id);
  const incident = incidents[0];

  return (
    <div className="pm-noc">
      <button
        type="button"
        className={`pm-drawer-scrim${drawer ? " is-open" : ""}`}
        aria-hidden={!drawer}
        onClick={() => setDrawer(false)}
      />
      <aside className={`pm-aside${drawer ? " is-open" : ""}`} aria-label="Sidebar Control Center">
        <p className="pm-kicker">CONTROL CENTER</p>
        <p>Área interna · /noc</p>
        {NOC_NAV.map((group) => (
          <div key={group.group}>
            <p className="pm-aside__group">{group.group}</p>
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
                onClick={() => setDrawer(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </aside>
      <div>
        <div className="pm-topbar">
          <button type="button" className="pm-btn pm-menu" onClick={() => setDrawer(true)}>
            Cola
          </button>
          <div>
            <strong>ARGOS NOC</strong>
            <div>
              <TenantContextChip />
            </div>
          </div>
          <DemoOrganizationSwitcher />
        </div>
        <div className="pm-main">
          {renderNoc(path, {
            organization,
            assets,
            alerts,
            incidents,
            incident,
            step,
            setStep,
            setWhy,
            outcome,
            setOutcome
          })}
          <p style={{ marginTop: "1.5rem" }}>
            <Link href="/platform-map">← Mapa maestro</Link>
          </p>
        </div>
      </div>
      {why ? <WhyThisAction action={why} onClose={() => setWhy(null)} variant="noc" /> : null}
    </div>
  );
}

function renderNoc(
  path: string,
  ctx: {
    organization: ReturnType<typeof usePlatformMap>["organization"];
    assets: typeof DEMO_ASSETS;
    alerts: typeof DEMO_ALERTS;
    incidents: typeof DEMO_INCIDENTS;
    incident?: (typeof DEMO_INCIDENTS)[number];
    step: (typeof FLOW)[number]["id"];
    setStep: (id: (typeof FLOW)[number]["id"]) => void;
    setWhy: (action: RemediationAction | null) => void;
    outcome: string;
    setOutcome: (value: string) => void;
  }
) {
  if (!path) return <CommandCenter ctx={ctx} />;
  if (path === "incidents" || path.startsWith("incidents/")) return <IncidentWalkthrough ctx={ctx} />;
  if (path === "alerts") {
    return (
      <>
        <h1 className="pm-title" style={{ fontSize: "1.7rem", color: "#f4efe6" }}>
          Alerts
        </h1>
        {ctx.alerts.map((alert) => (
          <article key={alert.id} className="pm-card">
            <h3>{alert.title}</h3>
            <p>
              {alert.severity} · {ctx.organization.name}
            </p>
            <Link href="/platform-map/noc/incidents/inc-a-tls">Investigar incidente DEMO</Link>
          </article>
        ))}
      </>
    );
  }
  if (path === "remediations") {
    return (
      <>
        <h1 className="pm-title" style={{ fontSize: "1.7rem", color: "#f4efe6" }}>
          Remediations
        </h1>
        {DEMO_REMEDIATION.map((action) => (
          <article key={action.id} className="pm-card">
            <h3>
              Acción {action.id} · {action.level}
            </h3>
            <p>{action.title}</p>
            {action.level === "L3" || action.level === "L4" ? <ApprovalGate level={action.level} /> : null}
            <button type="button" className="pm-btn" onClick={() => ctx.setWhy(action)}>
              Why this action?
            </button>
          </article>
        ))}
      </>
    );
  }
  if (path === "organizations") {
    return (
      <>
        <h1 className="pm-title" style={{ fontSize: "1.7rem", color: "#f4efe6" }}>
          Organizations
        </h1>
        <p>ORG A ≠ ORG B. El contexto activo nunca se mezcla.</p>
        <DemoOrganizationSwitcher />
      </>
    );
  }

  const reserved: Record<string, string> = {
    assets: "Inventario scoped a la organización activa.",
    health: "Global Health no afirma que todos los clientes estén sanos.",
    monitoring: "Checks y observaciones. UNKNOWN permanece UNKNOWN.",
    tls: "Cola TLS. Hostname mismatch es el incidente DEMO.",
    servers: "Servidores observados. Sin IPs reales.",
    databases: "Bases DEMO. Sin cadenas de conexión.",
    dns: "Cobertura DNS incompleta se muestra UNKNOWN.",
    backups: "Placeholder target. Sin afirmar copias reales.",
    "predicted-risks": "Riesgos predichos. Representación target, no un modelo en producción.",
    "preventive-actions": "Acciones preventivas internas.",
    agents: "Agentes enroll / heartbeat / observations.",
    runbooks: "Runbooks versionados. CURRENT en schema.",
    reports: "Informes internos. Sin datos de cliente real.",
    audit: "Audit log de plataforma.",
    "platform-health": "Salud de la plataforma ≠ salud de todos los clientes.",
    support: "Soporte interno."
  };

  if (reserved[path]) {
    return (
      <>
        <h1 className="pm-title" style={{ fontSize: "1.7rem", color: "#f4efe6" }}>
          {path}
        </h1>
        <article className="pm-card">
          <MockLabel kind={path === "backups" || path === "predicted-risks" ? "PLACEHOLDER" : "TARGET"} />
          <p>{reserved[path]}</p>
          <p>Organización activa: {ctx.organization.name}</p>
        </article>
      </>
    );
  }

  return (
    <article className="pm-card">
      <MockLabel kind="PLACEHOLDER" />
      <p>Pantalla reservada del Control Center objetivo.</p>
    </article>
  );
}

function CommandCenter({ ctx }: { ctx: Parameters<typeof renderNoc>[1] }) {
  const kpis = useMemo(
    () => [
      { label: "Orgs en contexto", value: "1", note: "Nunca dos a la vez" },
      { label: "Alertas DEMO", value: String(ctx.alerts.length), note: "Solo la org activa" },
      { label: "Incidentes DEMO", value: String(ctx.incidents.length), note: "Cola operativa" },
      { label: "ApprovalGate L3", value: "1", note: "Humano obligatorio" }
    ],
    [ctx.alerts.length, ctx.incidents.length]
  );

  return (
    <>
      <p className="pm-kicker">GLOBAL PLATFORM HEALTH</p>
      <h1 className="pm-title" style={{ fontSize: "1.8rem", color: "#f4efe6" }}>
        Command Center
      </h1>
      <p>
        Salud de plataforma ≠ salud de todos los clientes. Organización activa: {ctx.organization.name}.
      </p>
      <div className="pm-kpis">
        {kpis.map((kpi) => (
          <article key={kpi.label} className="pm-card">
            <MockLabel kind="DEMO" />
            <h3>{kpi.value}</h3>
            <p>
              {kpi.label}. {kpi.note}
            </p>
          </article>
        ))}
      </div>
      <div className="pm-grid-2" style={{ marginTop: "1rem" }}>
        <article className="pm-card">
          <h3>ACTIVE PRIORITIES</h3>
          <p>{ctx.incident ? ctx.incident.title : "Sin incidente DEMO en esta organización."}</p>
          {ctx.incident ? <Link href="/platform-map/noc/incidents/inc-a-tls">Abrir investigación</Link> : null}
        </article>
        <article className="pm-card">
          <h3>OPEN INCIDENTS</h3>
          <p>{ctx.incidents.length} en {ctx.organization.name}</p>
        </article>
        <article className="pm-card">
          <h3>PREDICTED RISKS</h3>
          <p>Desajuste TLS puede convertirse en corte HTTPS si el alias residual se retira.</p>
          <MockLabel kind="DEMO" />
        </article>
        <article className="pm-card">
          <h3>PLATFORM HEALTH</h3>
          <p>Esta maqueta no consulta /api/health. No se afirma HEALTHY.</p>
          <StatusBadge status="UNKNOWN" />
        </article>
        <article className="pm-card">
          <h3>LEVEL 3 APPROVAL QUEUE</h3>
          <ApprovalGate level="L3" />
          <Link href="/platform-map/noc/remediations">Ver remediaciones</Link>
        </article>
        <article className="pm-card">
          <h3>CUSTOMER / ORGANIZATION CONTEXT</h3>
          <TenantContextChip />
          <p>{ctx.organization.protectionNote}</p>
        </article>
      </div>
      <div className="pm-noc-mobile-hide" style={{ marginTop: "1rem" }}>
        <article className="pm-card">
          <h3>Automation levels</h3>
          <div className="pm-flow">
            {AUTOMATION_LEVELS.map((level) => (
              <span key={level.id}>
                {level.id} {level.name}
              </span>
            ))}
          </div>
          <p>L3 = ApprovalGate. L4 = nunca automático. AUTO FIX no aparece en L3+.</p>
        </article>
      </div>
    </>
  );
}

function IncidentWalkthrough({ ctx }: { ctx: Parameters<typeof renderNoc>[1] }) {
  if (ctx.organization.id !== "org-a" || !ctx.incident) {
    return (
      <article className="pm-card">
        <h3>Sin incidente DEMO en esta organización</h3>
        <p>
          El walkthrough A/B/C pertenece a DEMO Organization A. Cambie de organización para no
          mezclar tenants, o vuelva a Organization A.
        </p>
      </article>
    );
  }

  const actionA = DEMO_REMEDIATION[0];
  const actionB = DEMO_REMEDIATION[1];
  const actionC = DEMO_REMEDIATION[2];

  return (
    <>
      <p className="pm-kicker">INCIDENTE DEMO</p>
      <h1 className="pm-title" style={{ fontSize: "1.7rem", color: "#f4efe6" }}>
        {ctx.incident.title}
      </h1>
      <div className="pm-flow">
        {FLOW.map((item) => (
          <button
            key={item.id}
            type="button"
            className={ctx.step === item.id ? "is-active" : undefined}
            onClick={() => ctx.setStep(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {ctx.step === "alert" ? (
        <article className="pm-card">
          <h3>Alert</h3>
          <p>TLS hostname mismatch sobre demo-org-a.example. Señal, no todavía hipótesis.</p>
          <button type="button" className="pm-btn" onClick={() => ctx.setStep("investigation")}>
            Investigar
          </button>
        </article>
      ) : null}

      {ctx.step === "investigation" ? (
        <article className="pm-card">
          <h3>Investigation</h3>
          <p>Se acota a un solo tenant: {ctx.organization.name}. No se abre Organization B.</p>
          <button type="button" className="pm-btn" onClick={() => ctx.setStep("evidence")}>
            Abrir Evidence
          </button>
        </article>
      ) : null}

      {ctx.step === "evidence" ? (
        <>
          <EvidenceStack
            items={[
              { title: "Certificado presentado", detail: "SAN residual. No coincide con el hostname canónico." },
              { title: "Check TLS", detail: "Última observación DEMO: mismatch. UNKNOWN no se convierte en HEALTHY." },
              { title: "Alcance", detail: "Solo DEMO Organization A. organization_id scoped." }
            ]}
          />
          <button type="button" className="pm-btn" onClick={() => ctx.setStep("hypothesis")}>
            Formular hipótesis
          </button>
        </>
      ) : null}

      {ctx.step === "hypothesis" ? (
        <article className="pm-card">
          <h3>Hypothesis</h3>
          <p>{actionA.hypothesis}</p>
          <p>Confianza {actionA.confidence}. Sin porcentajes.</p>
          <button type="button" className="pm-btn" onClick={() => ctx.setStep("action-a")}>
            Ver Action A
          </button>
        </article>
      ) : null}

      {ctx.step === "action-a" ? (
        <ActionCard action={actionA} onWhy={ctx.setWhy} onNext={() => ctx.setStep("verify-a")} />
      ) : null}

      {ctx.step === "verify-a" ? (
        <article className="pm-card">
          <h3>Verify A — falla</h3>
          <p>{actionA.failureSignal}</p>
          <button type="button" className="pm-btn" onClick={() => ctx.setStep("action-b")}>
            Pasar a Action B
          </button>
        </article>
      ) : null}

      {ctx.step === "action-b" ? (
        <>
          <ApprovalGate level="L3" />
          <ActionCard action={actionB} onWhy={ctx.setWhy} onNext={() => ctx.setStep("verify-b")} />
        </>
      ) : null}

      {ctx.step === "verify-b" ? (
        <article className="pm-card">
          <h3>Verify B — falla</h3>
          <p>{actionB.failureSignal}</p>
          <button type="button" className="pm-btn" onClick={() => ctx.setStep("action-c")}>
            Pasar a Action C
          </button>
        </article>
      ) : null}

      {ctx.step === "action-c" ? (
        <>
          <ApprovalGate level="L4" />
          <ActionCard action={actionC} onWhy={ctx.setWhy} onNext={() => ctx.setStep("close")} />
        </>
      ) : null}

      {ctx.step === "close" ? (
        <SafeStop
          outcome={ctx.outcome}
          onResolve={() => ctx.setOutcome("Resolve DEMO. No se cierra ningún incidente real.")}
          onStop={() => ctx.setOutcome("Safe Stop DEMO. La cadena se detiene. Nada se ejecuta.")}
          onRollback={() => ctx.setOutcome("Rollback DEMO. Se representa la reversión documentada.")}
          onEscalate={() => ctx.setOutcome("Escalate DEMO. Intervención humana adicional. L4 nunca automático.")}
        />
      ) : null}
    </>
  );
}

function ActionCard({
  action,
  onWhy,
  onNext
}: {
  action: RemediationAction;
  onWhy: (action: RemediationAction) => void;
  onNext: () => void;
}) {
  return (
    <article className="pm-card">
      <h3>
        Action {action.id} · {action.level}
      </h3>
      <p>{action.title}</p>
      {action.level === "L3" || action.level === "L4" ? (
        <p>No AUTO FIX. ApprovalGate humano visible.</p>
      ) : null}
      <div className="pm-cta-row">
        <button type="button" className="pm-btn" onClick={() => onWhy(action)}>
          Why this action?
        </button>
        <button type="button" className="pm-btn pm-btn--ghost" onClick={onNext}>
          Continuar (simulación)
        </button>
      </div>
    </article>
  );
}
