import Link from "next/link";
import { CROSSING_RULE, MASTER_TAGLINE } from "@/lib/platform-map/platformMapData";
import ArchitectureLegend from "./ArchitectureLegend";
import ExperienceCard from "./ExperienceCard";
import MockLabel from "./MockLabel";

function Node({
  href,
  title,
  meta,
  variant = "default"
}: {
  href: string;
  title: string;
  meta: string;
  variant?: "default" | "root" | "core" | "data";
}) {
  const cls = variant === "default" ? "pm-node" : `pm-node pm-node--${variant}`;
  return (
    <Link href={href} className={cls}>
      <strong>{title}</strong>
      <small>{meta}</small>
    </Link>
  );
}

export default function MasterArchitectureMap() {
  return (
    <main className="pm-page">
      <p className="pm-kicker">Mapa jerárquico maestro</p>
      <h1 className="pm-title">ARGOS-IT</h1>
      <p className="pm-lead">
        El mapa define qué es ARGOS. El repositorio define qué existe hoy. Esta maqueta muestra el
        target. Las tres cosas no se confunden.
      </p>
      <ArchitectureLegend />

      <div className="pm-map" aria-label="Arquitectura canónica de ARGOS-IT">
        <Node href="/platform-map" title="ARGOS-IT" meta="Una plataforma" variant="root" />
        <div className="pm-stem" aria-hidden="true" />
        <div className="pm-branches">
          <div className="pm-branch">
            <div className="pm-branch__bar" aria-hidden="true" />
            <Node href="/platform-map/public" title="WEB PÚBLICA" meta="/ · educar · convertir" />
          </div>
          <div className="pm-branch">
            <div className="pm-branch__bar" aria-hidden="true" />
            <Node href="/platform-map/client" title="ÁREA CLIENTE" meta="/dashboard · ver y gestionar" />
          </div>
          <div className="pm-branch">
            <div className="pm-branch__bar" aria-hidden="true" />
            <Node href="/platform-map/noc" title="ÁREA INTERNA" meta="/noc · operar internamente" />
          </div>
        </div>
        <div className="pm-stem" aria-hidden="true" />
        <Node href="/platform-map/core" title="ARGOS CORE" meta="Auth · Tenancy · Operations" variant="core" />
        <div className="pm-stem" aria-hidden="true" />
        <div className="pm-branches pm-branches--core">
          <div className="pm-branch">
            <Node href="/platform-map/core/auth" title="AUTH" meta="JWT · cookies · roles globales" />
          </div>
          <div className="pm-branch">
            <Node href="/platform-map/core/tenancy" title="TENANCY" meta="ORG A ≠ ORG B" />
          </div>
          <div className="pm-branch">
            <Node href="/platform-map/core/operations" title="OPERATIONS" meta="Asset → Resolve" />
          </div>
        </div>
        <div className="pm-stem" aria-hidden="true" />
        <Node href="/platform-map/data" title="POSTGRESQL" meta="Un modelo. Un Postgres." variant="data" />
      </div>

      <p className="pm-lead" style={{ fontWeight: 600, color: "var(--pm-navy)" }}>
        {MASTER_TAGLINE}
      </p>
      <div className="pm-rule">
        {CROSSING_RULE.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>

      <div className="pm-experience-grid">
        <ExperienceCard
          href="/platform-map/public"
          kicker="Experiencia 1"
          title="Web pública"
          body="Quiet Authority. Educar y convertir. El visitante no entra al portal operativo."
          route="/"
          label="TARGET"
        />
        <ExperienceCard
          href="/platform-map/client"
          kicker="Experiencia 2"
          title="Client Portal"
          body="Calma, protección y claridad. El cliente no entra al Control Center."
          route="/dashboard"
          label="TARGET"
        />
        <ExperienceCard
          href="/platform-map/noc"
          kicker="Experiencia 3"
          title="Control Center"
          body="Precisión, evidencia y operación. El staff no se hace pasar por el cliente."
          route="/noc"
          label="TARGET"
        />
      </div>

      <div className="pm-grid-3" style={{ marginTop: "1rem" }}>
        <ExperienceCard
          href="/platform-map/core"
          kicker="Núcleo"
          title="ARGOS CORE"
          body="Auth, tenancy y operations. El mismo núcleo para las tres experiencias."
          route="CORE"
          label="TARGET"
        />
        <ExperienceCard
          href="/platform-map/apis"
          kicker="Contratos"
          title="API Architecture"
          body="Públicas, cliente, internas y agente. CURRENT solo si está en el backend."
          route="/api"
          label="CURRENT"
        />
        <ExperienceCard
          href="/platform-map/data"
          kicker="Persistencia"
          title="ARGOS Data Model"
          body="Identidad, tenancy, observación, remediación, evidencia. Sin migraciones."
          route="PostgreSQL"
          label="CURRENT"
        />
      </div>

      <section className="pm-section">
        <h2>Fuera de producto</h2>
        <p className="pm-lead">
          No son marketing. No son Client Portal. No son Control Center.
        </p>
        <p>
          <Link href="/platform-map/outside" className="pm-btn pm-btn--ghost">
            Ver superficie OUTSIDE PRODUCT
          </Link>
        </p>
        <p style={{ marginTop: "1rem" }}>
          <MockLabel kind="DEMO" /> Esta aplicación no sustituye <code>/</code>,{" "}
          <code>/dashboard</code> ni <code>/noc</code>.
        </p>
      </section>
    </main>
  );
}
