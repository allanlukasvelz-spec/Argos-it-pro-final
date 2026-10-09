"use client";

import { NocNotAvailable } from "@/components/noc/NocUi";

export default function Page() {
  return (
    <NocNotAvailable
      title="Predicted Risks"
      phase="9"
      description="El motor de predicción de riesgos aún no existe. No se muestran scores ni listas inventadas."
    />
  );
}
