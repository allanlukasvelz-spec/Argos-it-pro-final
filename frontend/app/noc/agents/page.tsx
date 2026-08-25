"use client";

import { NocNotAvailable } from "@/components/noc/NocUi";

export default function Page() {
  return (
    <NocNotAvailable
      title="Agents"
      phase="7"
      description="El plano de agentes (instalación, aislamiento, heartbeats) no está implementado."
    />
  );
}
