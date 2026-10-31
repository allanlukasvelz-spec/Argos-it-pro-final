import { DATA_MODEL } from "@/lib/platform-map/platformMapData";
import { MapPageFrame } from "./PlatformMapShell";
import MockLabel from "./MockLabel";

export default function DataArchitecture() {
  return (
    <MapPageFrame
      kicker="ARGOS DATA MODEL"
      title="PostgreSQL"
      lead="Un Postgres. CURRENT se verificó en schema.sql o en el ensure de arranque. No se crean tablas ni migraciones desde esta maqueta."
    >
      {DATA_MODEL.map((group) => (
        <section key={group.group} className="pm-section">
          <h2>{group.group}</h2>
          <div className="pm-grid-3">
            {group.tables.map((table) => (
              <article key={table.id} className="pm-card">
                <MockLabel kind={table.label} />
                <h3>{table.name}</h3>
                {table.note ? <p>{table.note}</p> : null}
                {table.verifiedIn ? <p className="pm-card__meta">{table.verifiedIn}</p> : null}
              </article>
            ))}
          </div>
        </section>
      ))}
    </MapPageFrame>
  );
}
