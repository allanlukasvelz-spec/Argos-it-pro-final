"use client";

import { NocNotAvailable } from "@/components/noc/NocUi";

export default function Page() {
  return (
    <NocNotAvailable
      title="Remediations"
      phase="6"
      description="Historial de remediaciones, rollback y ApprovalGate no están disponibles en Phase 5 (solo lectura)."
    />
  );
}
