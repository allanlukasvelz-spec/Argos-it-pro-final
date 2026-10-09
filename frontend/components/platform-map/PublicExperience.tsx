"use client";

import Link from "next/link";
import {
  COMMERCIAL_MOVEMENTS,
  HOME_SECTIONS,
  METHOD_PHASES,
  PUBLIC_SERVICES
} from "@/lib/platform-map/platformMapData";
import MockLabel from "./MockLabel";

const PUBLIC_NAV = [
  { href: "/platform-map/public", label: "Home" },
  { href: "/platform-map/public/servicios", label: "Servicios" },
  { href: "/platform-map/public/metodo", label: "Método" },
  { href: "/platform-map/public/sobre-argos-it", label: "Sobre ARGOS-IT" },
  { href: "/platform-map/public/contacto", label: "Contacto" },
  { href: "/platform-map/public/portal", label: "Portal" }
];

function PublicNav({ current }: { current: string }) {
  return (
    <nav className="pm-public__nav" aria-label="Web pública objetivo">
      {PUBLIC_NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={current === item.href || (item.href !== "/platform-map/public" && current.startsWith(item.href)) ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
      <span style={{ marginLeft: "auto" }}>
        <MockLabel kind="TARGET" /> Quiet Authority
      </span>
    </nav>
  );
}

function HomePublic() {
  return (
    <>
      <section id="hero" className="pm-hero">
        <div>
          <p className="pm-kicker">ARGOS-IT</p>
          <h1>Tecnología que protege, acompaña y simplifica.</h1>
          <p className="pm-lead">
            Socio tecnológico externo para empresas que necesitan orden, continuidad y criterio.
            Sin promesas de métricas. Sin testimonios inventados.
          </p>
          <div className="pm-cta-row">
            <Link href="/platform-map/public/contacto" className="pm-btn">
              Solicitar diagnóstico
            </Link>
            <Link href="/platform-map/public/metodo" className="pm-btn pm-btn--ghost">
              Ver el Método ARGOS
            </Link>
          </div>
        </div>
        <article className="pm-card">
          <MockLabel kind="PLACEHOLDER" />
          <h3>Diagnóstico ARGOS</h3>
          <p>
            En el target, el visitante inicia un diagnóstico. Aquí es una representación visual:
            no se envía nada, no se calcula un score real y no se afirma un estado de salud.
          </p>
          <p className="pm-card__meta">UNKNOWN ≠ HEALTHY</p>
        </article>
      </section>

      <section id="realidad" className="pm-section">
        <h2>Realidad del cliente</h2>
        <div className="pm-grid-3">
          {[
            "La tecnología funciona… hasta que deja de hacerlo en el peor momento.",
            "Hay varios proveedores y ninguna foto compartida del riesgo.",
            "Las urgencias tapan lo importante. El contexto se pierde entre correos."
          ].map((item) => (
            <article key={item} className="pm-card">
              <p>{item}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="filosofia" className="pm-section">
        <h2>Filosofía</h2>
        <p className="pm-lead">
          Quiet Authority: menos teatro, más criterio. ARGOS no se presenta como un command center
          público ni como una promesa de automatización total.
        </p>
      </section>

      <section id="principios" className="pm-section">
        <h2>Principios</h2>
        <div className="pm-grid-2">
          {["Claridad antes que volumen", "Evidencia antes que afirmación", "Acompañamiento antes que abandono", "Prevención antes que rescate"].map(
            (item) => (
              <article key={item} className="pm-card">
                <h3>{item}</h3>
              </article>
            )
          )}
        </div>
      </section>

      <section id="metodo" className="pm-section">
        <h2>Método ARGOS — cinco fases</h2>
        <p className="pm-lead">
          Exactamente cinco fases. Los cuatro movimientos comerciales no las sustituyen.
        </p>
        <div className="pm-flow">
          {METHOD_PHASES.map((phase, index) => (
            <span key={phase.slug}>
              <Link href={`/platform-map/public/metodo/${phase.slug}`}>
                {phase.letter}. {phase.name}
              </Link>
              {index < METHOD_PHASES.length - 1 ? " →" : null}
            </span>
          ))}
        </div>
        <p>
          Movimientos comerciales: {COMMERCIAL_MOVEMENTS.join(" · ")}.
        </p>
      </section>

      <section id="servicios" className="pm-section">
        <h2>Seis servicios</h2>
        <div className="pm-grid-6">
          {PUBLIC_SERVICES.map((service) => (
            <Link key={service.slug} href={`/platform-map/public/servicios/${service.slug}`} className="pm-card">
              <h3>{service.name}</h3>
              <p>{service.summary}</p>
            </Link>
          ))}
        </div>
      </section>

      <section id="estabilidad" className="pm-section">
        <h2>Estabilidad</h2>
        <p className="pm-lead">
          Estabilidad no es un SLA inventado. Es un ritmo: revisar, documentar, corregir antes de
          que el problema vuelva a crecer.
        </p>
      </section>

      <section id="confianza" className="pm-section">
        <h2>Confianza humana</h2>
        <p className="pm-lead">
          La confianza se construye con responsables, criterios y conversaciones claras. No con
          certificaciones, partners o cifras comerciales que esta maqueta no puede afirmar.
        </p>
      </section>

      <section id="cta" className="pm-section">
        <h2>CTA final</h2>
        <div className="pm-cta-row">
          <Link href="/platform-map/public/contacto" className="pm-btn">
            Hablar con ARGOS-IT
          </Link>
          <Link href="/platform-map/public/portal" className="pm-btn pm-btn--ghost">
            Ir al puente del portal
          </Link>
        </div>
      </section>

      <p className="pm-lead">
        Secciones de Home: {HOME_SECTIONS.map((section) => section.title).join(" · ")}.
      </p>
    </>
  );
}

function pageContent(slug: string[]) {
  const path = slug.join("/");

  if (!path) return <HomePublic />;

  if (path === "servicios") {
    return (
      <>
        <h1 className="pm-title">Servicios</h1>
        <p className="pm-lead">Seis líneas. Sin precios. Sin paquetes inventados.</p>
        <div className="pm-grid-6">
          {PUBLIC_SERVICES.map((service) => (
            <Link key={service.slug} href={`/platform-map/public/servicios/${service.slug}`} className="pm-card">
              <h3>{service.name}</h3>
              <p>{service.summary}</p>
            </Link>
          ))}
        </div>
      </>
    );
  }

  if (path.startsWith("servicios/")) {
    const service = PUBLIC_SERVICES.find((item) => item.slug === slug[1]);
    if (!service) return <Missing />;
    return (
      <>
        <p className="pm-kicker">Servicio</p>
        <h1 className="pm-title">{service.name}</h1>
        <p className="pm-lead">{service.summary}</p>
        <article className="pm-card">
          <MockLabel kind="TARGET" />
          <p>
            En el producto objetivo esta página profundiza el problema, el encaje con el Método y
            el siguiente paso de contacto. No hay tarifas, SLAs ni casos de cliente.
          </p>
        </article>
        <p style={{ marginTop: "1rem" }}>
          <Link href="/platform-map/public/contacto" className="pm-btn">
            Solicitar conversación
          </Link>
        </p>
      </>
    );
  }

  if (path === "metodo") {
    return (
      <>
        <h1 className="pm-title">Método ARGOS</h1>
        <p className="pm-lead">
          Cinco fases oficiales. Cuatro movimientos comerciales. No son intercambiables.
        </p>
        <div className="pm-flow">
          {METHOD_PHASES.map((phase) => (
            <Link key={phase.slug} href={`/platform-map/public/metodo/${phase.slug}`}>
              {phase.name}
            </Link>
          ))}
        </div>
        <div className="pm-grid-2">
          <article className="pm-card">
            <h3>Fases</h3>
            <p>Analizar → Reforzar → Guiar → Optimizar → Supervisar.</p>
          </article>
          <article className="pm-card">
            <h3>Movimientos</h3>
            <p>{COMMERCIAL_MOVEMENTS.join(" · ")}. No se convierten en seis fases.</p>
          </article>
        </div>
      </>
    );
  }

  if (path.startsWith("metodo/")) {
    const phase = METHOD_PHASES.find((item) => item.slug === slug[1]);
    if (!phase) return <Missing />;
    const index = METHOD_PHASES.findIndex((item) => item.slug === phase.slug);
    const prev = METHOD_PHASES[index - 1];
    const next = METHOD_PHASES[index + 1];
    return (
      <>
        <p className="pm-kicker">Fase {phase.letter}</p>
        <h1 className="pm-title">{phase.name}</h1>
        <p className="pm-lead">
          Representación target de la fase {phase.name}. El copy productivo vive en la web pública
          real; aquí se preserva el orden y el significado.
        </p>
        <div className="pm-cta-row">
          {prev ? (
            <Link href={`/platform-map/public/metodo/${prev.slug}`} className="pm-btn pm-btn--ghost">
              ← {prev.name}
            </Link>
          ) : null}
          {next ? (
            <Link href={`/platform-map/public/metodo/${next.slug}`} className="pm-btn pm-btn--ghost">
              {next.name} →
            </Link>
          ) : null}
        </div>
      </>
    );
  }

  if (path === "sobre-argos-it") {
    return (
      <>
        <h1 className="pm-title">Sobre ARGOS-IT</h1>
        <p className="pm-lead">
          Una plataforma. Tres experiencias. Un núcleo. Un Postgres. ARGOS no es un marketplace
          de partners ni un directorio de certificaciones.
        </p>
      </>
    );
  }

  if (path === "contacto") {
    return (
      <>
        <h1 className="pm-title">Contacto</h1>
        <p className="pm-lead">Formulario target. Esta maqueta no envía nada.</p>
        <form className="pm-card" onSubmit={(event) => event.preventDefault()}>
          <p>
            <MockLabel kind="PLACEHOLDER" /> Campos visibles. Sin backend. Sin credenciales.
          </p>
          <p>
            <label>
              Nombre
              <br />
              <input disabled placeholder="No se envía" />
            </label>
          </p>
          <p>
            <label>
              Email
              <br />
              <input disabled placeholder="demo@argos-map.example" />
            </label>
          </p>
          <button type="button" className="pm-btn" disabled>
            Enviar (desactivado)
          </button>
        </form>
      </>
    );
  }

  if (path === "portal") {
    return (
      <>
        <h1 className="pm-title">Portal</h1>
        <p className="pm-lead">
          Puente visual hacia autenticación. No es el dashboard. El visitante no entra al portal
          operativo desde aquí.
        </p>
        <div className="pm-cta-row">
          <Link href="/platform-map/client" className="pm-btn">
            Ver representación del Client Portal
          </Link>
          <Link href="/platform-map" className="pm-btn pm-btn--ghost">
            Volver al mapa
          </Link>
        </div>
      </>
    );
  }

  if (path === "aviso-legal" || path === "privacidad" || path === "cookies") {
    const title = path === "aviso-legal" ? "Aviso legal" : path === "privacidad" ? "Privacidad" : "Cookies";
    return (
      <>
        <h1 className="pm-title">{title}</h1>
        <p className="pm-lead">
          Página legal target. Esta maqueta no reproduce textos legales productivos.
        </p>
        <MockLabel kind="PLACEHOLDER" />
      </>
    );
  }

  return <Missing />;
}

function Missing() {
  return (
    <>
      <h1 className="pm-title">Página no prevista</h1>
      <p className="pm-lead">Esta ruta no forma parte del árbol canónico de la web pública.</p>
      <Link href="/platform-map/public">Volver a Home pública</Link>
    </>
  );
}

export default function PublicExperience({ slug }: { slug: string[] }) {
  const current = `/platform-map/public${slug.length ? `/${slug.join("/")}` : ""}`;
  return (
    <div className="pm-public pm-page">
      <PublicNav current={current} />
      {pageContent(slug)}
      <footer className="pm-section">
        <p>
          <Link href="/platform-map/public/aviso-legal">Aviso legal</Link> ·{" "}
          <Link href="/platform-map/public/privacidad">Privacidad</Link> ·{" "}
          <Link href="/platform-map/public/cookies">Cookies</Link>
        </p>
        <p>
          <Link href="/platform-map">← Mapa maestro</Link>
        </p>
      </footer>
    </div>
  );
}
