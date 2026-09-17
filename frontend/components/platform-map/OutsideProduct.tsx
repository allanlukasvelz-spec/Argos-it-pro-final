import { OUTSIDE_PRODUCT } from "@/lib/platform-map/platformMapData";
import { MapPageFrame } from "./PlatformMapShell";
import MockLabel from "./MockLabel";

export default function OutsideProduct() {
  return (
    <MapPageFrame
      kicker="OUTSIDE PRODUCT"
      title="Fuera del producto"
      lead="No son marketing. No son Client Portal. No son Control Center."
    >
      <div className="pm-grid-2">
        {OUTSIDE_PRODUCT.map((item) => (
          <article key={item.id} className="pm-card">
            <MockLabel kind={item.label} />
            <h3>{item.name}</h3>
            <p>{item.note}</p>
          </article>
        ))}
      </div>
    </MapPageFrame>
  );
}
