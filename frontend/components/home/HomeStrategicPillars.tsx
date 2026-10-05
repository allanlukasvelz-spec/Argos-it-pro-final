"use client";

import { useI18n } from "@/i18n/useI18n";

/** Orden MASTER v2: Infraestructura → Seguridad → Sistemas → Continuidad */
const PILLAR_ORDER = [
  { key: "Infraestructura", image: "/infraestructura.png" },
  { key: "Seguridad", image: "/seguridad.png" },
  { key: "Sistemas", image: "/sistemas.png" },
  { key: "Continuidad", image: "/continuidad.png" }
] as const;

export default function HomeStrategicPillars() {
  const { get, t } = useI18n();
  const pillars = get<string[]>("servicesPage.strategicPillars", []);
  const ordered = PILLAR_ORDER.filter((entry) => pillars.includes(entry.key));

  return (
    <section className="argos-corp-section argos-corp-section--ivory" aria-labelledby="home-pillars-title">
      <div className="argos-corp-container">
        <p className="argos-corp-section-index">03 / Cuatro pilares</p>
        <h2 id="home-pillars-title" className="argos-font-display argos-corp-h2">
          {t("home.principlesTitle")}
        </h2>
        <ul className="argos-corp-pillars">
          {ordered.map((pillar) => (
            <li key={pillar.key}>
              <article className="argos-corp-pillar">
                <div className="argos-corp-pillar__media">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pillar.image} alt="" width={400} height={300} loading="lazy" decoding="async" />
                </div>
                <p className="argos-corp-pillar__label">{pillar.key}</p>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
