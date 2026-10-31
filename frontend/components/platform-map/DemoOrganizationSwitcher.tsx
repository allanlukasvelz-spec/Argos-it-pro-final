"use client";

import { DEMO_ORGANIZATIONS } from "@/lib/platform-map/platformMapData";
import { usePlatformMap } from "@/lib/platform-map/PlatformMapProvider";
import type { DemoOrgId } from "@/lib/platform-map/types";

export default function DemoOrganizationSwitcher() {
  const { orgId, setOrgId } = usePlatformMap();

  return (
    <label>
      Organización DEMO
      <select
        value={orgId}
        onChange={(event) => setOrgId(event.target.value as DemoOrgId)}
        aria-label="Selector DEMO de organización. Nunca mezcla dos tenants."
      >
        {DEMO_ORGANIZATIONS.map((org) => (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
      </select>
    </label>
  );
}
