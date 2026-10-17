"use client";

import { NocNotAvailable } from "@/components/noc/NocUi";

export default function Page() {
  return (
    <NocNotAvailable
      title="Backups"
      phase="6+"
      description="No hay telemetría de backups en el dominio actual. Placeholder honesto."
    />
  );
}
