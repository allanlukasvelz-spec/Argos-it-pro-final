"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { DEMO_ORGANIZATIONS } from "./platformMapData";
import type { DemoOrgId, DemoOrgRole, DemoOrganization } from "./types";

type PlatformMapState = {
  role: DemoOrgRole;
  setRole: (role: DemoOrgRole) => void;
  orgId: DemoOrgId;
  setOrgId: (id: DemoOrgId) => void;
  organization: DemoOrganization;
  isReadOnly: boolean;
};

const PlatformMapContext = createContext<PlatformMapState | null>(null);

export function PlatformMapProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<DemoOrgRole>("org_owner");
  const [orgId, setOrgId] = useState<DemoOrgId>("org-a");

  const value = useMemo<PlatformMapState>(() => {
    const organization = DEMO_ORGANIZATIONS.find((org) => org.id === orgId) ?? DEMO_ORGANIZATIONS[0];
    return {
      role,
      setRole,
      orgId,
      setOrgId,
      organization,
      isReadOnly: role === "org_viewer"
    };
  }, [role, orgId]);

  return <PlatformMapContext.Provider value={value}>{children}</PlatformMapContext.Provider>;
}

export function usePlatformMap() {
  const ctx = useContext(PlatformMapContext);
  if (!ctx) {
    throw new Error("usePlatformMap debe usarse dentro de PlatformMapProvider");
  }
  return ctx;
}
