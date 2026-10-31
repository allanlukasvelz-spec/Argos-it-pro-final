import { LEGEND_ITEMS } from "@/lib/platform-map/platformMapData";
import MockLabel from "./MockLabel";

export default function ArchitectureLegend() {
  return (
    <div className="pm-legend" aria-label="Leyenda CURRENT TARGET DEMO PLACEHOLDER UNKNOWN">
      {LEGEND_ITEMS.map((item) => (
        <span key={item.id} title={item.meaning}>
          <MockLabel kind={item.id} />
        </span>
      ))}
    </div>
  );
}
