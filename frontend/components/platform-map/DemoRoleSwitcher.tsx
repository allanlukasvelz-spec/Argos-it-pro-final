"use client";

import { ORG_ROLES } from "@/lib/platform-map/platformMapData";
import { usePlatformMap } from "@/lib/platform-map/PlatformMapProvider";
import type { DemoOrgRole } from "@/lib/platform-map/types";

export default function DemoRoleSwitcher() {
  const { role, setRole, isReadOnly } = usePlatformMap();

  return (
    <label>
      Rol DEMO
      <select
        value={role}
        onChange={(event) => setRole(event.target.value as DemoOrgRole)}
        aria-label="Selector DEMO de rol. No es seguridad real."
      >
        {ORG_ROLES.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      {isReadOnly ? <small> org_viewer es solo lectura visual.</small> : null}
    </label>
  );
}
