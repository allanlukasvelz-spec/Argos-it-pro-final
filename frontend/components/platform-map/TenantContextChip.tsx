import { usePlatformMap } from "@/lib/platform-map/PlatformMapProvider";
import MockLabel from "./MockLabel";

export default function TenantContextChip() {
  const { organization } = usePlatformMap();
  return (
    <span className="pm-chip pm-chip--DEMO" title="La organización activa nunca se mezcla con otra.">
      <MockLabel kind="DEMO" /> {organization.name}
    </span>
  );
}
