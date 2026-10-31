import { AGENT_APIS, CLIENT_APIS, INTERNAL_APIS, PUBLIC_APIS } from "@/lib/platform-map/platformMapData";
import type { VerifiedItem } from "@/lib/platform-map/types";
import { MapPageFrame } from "./PlatformMapShell";
import MockLabel from "./MockLabel";

function ApiGroup({ title, note, items }: { title: string; note: string; items: VerifiedItem[] }) {
  return (
    <section className="pm-section">
      <h2>{title}</h2>
      <p className="pm-lead">{note}</p>
      <div className="pm-grid-2">
        {items.map((item) => (
          <article key={item.id} className="pm-card">
            <MockLabel kind={item.label} />
            <h3>{item.name}</h3>
            {item.note ? <p>{item.note}</p> : null}
            {item.verifiedIn ? <p className="pm-card__meta">{item.verifiedIn}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

export default function ApiArchitecture() {
  return (
    <MapPageFrame
      kicker="API Architecture"
      title="Contratos de la plataforma"
      lead="CURRENT solo si el path existe en el backend de este repositorio. El árbol canónico no inventa implementación."
    >
      <ApiGroup
        title="PUBLIC APIs"
        note="Superficie pública. No son el portal ni el Control Center."
        items={PUBLIC_APIS}
      />
      <ApiGroup
        title="CLIENT APIs"
        note="TENANT_REQUIRED. organization_id scoped. El cliente no ve /api/noc."
        items={CLIENT_APIS}
      />
      <ApiGroup
        title="INTERNAL APIs"
        note="requireNocAccess. Staff interno. El staff no se hace pasar por el cliente."
        items={INTERNAL_APIS}
      />
      <ApiGroup
        title="AGENT API"
        note="/api/agent/v1 — enroll, heartbeat, observations. Sin exec/shell/SQL."
        items={AGENT_APIS}
      />
    </MapPageFrame>
  );
}
