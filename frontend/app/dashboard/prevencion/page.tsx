"use client";

import { NotAvailableState, PageHeader } from "@/components/client/Status";
import { ChicoGuardianBanner } from "@/components/client/ChicoGuardianBanner";

export default function PrevencionPage() {
  return (
    <div>
      <PageHeader
        title="Prevención"
        eyebrow="Acciones preventivas"
        meta="Recomendaciones solo cuando existan hallazgos reales con capacidad de soporte."
      />
      <ChicoGuardianBanner />
      <NotAvailableState
        title="Prevención aún no disponible"
        description="No existen preventive_actions en el backend actual. Cuando existan hallazgos DETECTED, aparecerán aquí. No se muestran predicciones inventadas."
      />
    </div>
  );
}
