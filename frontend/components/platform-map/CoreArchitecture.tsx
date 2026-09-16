import Link from "next/link";
import {
  AUTH_COOKIES,
  AUTOMATION_LEVELS,
  GLOBAL_ROLES,
  OPERATIONS_PIPELINE,
  ORG_ROLES
} from "@/lib/platform-map/platformMapData";
import { MapPageFrame } from "./PlatformMapShell";
import MockLabel from "./MockLabel";

export default function CoreArchitecture({ section }: { section?: string }) {
  return (
    <MapPageFrame
      kicker="ARGOS CORE"
      title={section === "auth" ? "AUTH" : section === "tenancy" ? "TENANCY" : section === "operations" ? "OPERATIONS" : "Núcleo de plataforma"}
      lead="Un núcleo. Tres experiencias. Auth, tenancy y operations no se duplican por producto."
    >
      <nav className="pm-cta-row">
        <Link href="/platform-map/core/auth" className="pm-btn pm-btn--ghost">
          AUTH
        </Link>
        <Link href="/platform-map/core/tenancy" className="pm-btn pm-btn--ghost">
          TENANCY
        </Link>
        <Link href="/platform-map/core/operations" className="pm-btn pm-btn--ghost">
          OPERATIONS
        </Link>
        <Link href="/platform-map/apis" className="pm-btn pm-btn--ghost">
          APIs
        </Link>
      </nav>

      {!section || section === "auth" ? (
        <section className="pm-section">
          <h2>AUTH</h2>
          <p>
            JWT. Cookies <code>argos_access</code> y <code>argos_refresh</code>. Roles globales
            distintos de roles de organización.
          </p>
          <div className="pm-flow">
            {AUTH_COOKIES.map((cookie) => (
              <span key={cookie}>
                {cookie} <MockLabel kind="CURRENT" />
              </span>
            ))}
          </div>
          <div className="pm-grid-2">
            {GLOBAL_ROLES.map((role) => (
              <article key={role} className="pm-card">
                <h3>{role}</h3>
                <p>Rol global. No abre el Control Center por sí solo si no hay privilegio NOC.</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {!section || section === "tenancy" ? (
        <section className="pm-section">
          <h2>TENANCY</h2>
          <p>User → Membership → Organization Context → organization_id → Scoped Query.</p>
          <div className="pm-grid-2">
            <article className="pm-card">
              <h3>ORG A</h3>
              <p>DEMO Organization A. Consultas acotadas a su organization_id.</p>
            </article>
            <article className="pm-card">
              <h3>≠</h3>
              <p>Nunca se mezclan. El staff no se hace pasar por el cliente.</p>
            </article>
            <article className="pm-card">
              <h3>ORG B</h3>
              <p>DEMO Organization B. Otro contexto. Otra cola. Otra evidencia.</p>
            </article>
          </div>
          <div className="pm-flow">
            {ORG_ROLES.map((role) => (
              <span key={role}>{role}</span>
            ))}
          </div>
          <p>
            Tablas CURRENT: <code>organizations</code>, <code>organization_members</code>.
          </p>
        </section>
      ) : null}

      {!section || section === "operations" ? (
        <section className="pm-section">
          <h2>OPERATIONS</h2>
          <div className="pm-flow">
            {OPERATIONS_PIPELINE.map((step) => (
              <span key={step}>{step}</span>
            ))}
          </div>
          <div className="pm-grid-3">
            {AUTOMATION_LEVELS.map((level) => (
              <article key={level.id} className="pm-card">
                <h3>
                  {level.id} · {level.name}
                </h3>
                <p>{level.meaning}</p>
                {level.id === "L3" || level.id === "L4" ? <MockLabel kind="TARGET">NO AUTO FIX</MockLabel> : null}
              </article>
            ))}
          </div>
          <p>
            <Link href="/platform-map/noc/incidents/inc-a-tls">Recorrer el incidente DEMO</Link>
          </p>
        </section>
      ) : null}
    </MapPageFrame>
  );
}
