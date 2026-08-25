"use client";

import { NotAvailableState, PageHeader } from "@/components/client/Status";

export default function PrevencionPage() {
  return (
    <div>
      <PageHeader
        title="Prevención"
        eyebrow="Acciones preventivas"
        meta="Phase 6 — sin registros runtime en Phase 4."
      />
      <NotAvailableState
        title="Prevención aún no disponible"
        description="No existen preventive_actions en el backend actual. Cuando Phase 6 genere acciones DETECTED, aparecerán aquí. No se muestran predicciones inventadas."
      />
    </div>
  );
}
