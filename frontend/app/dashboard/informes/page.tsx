"use client";

import { NotAvailableState, PageHeader } from "@/components/client/Status";

export default function InformesPage() {
  return (
    <div>
      <PageHeader
        title="Informes"
        eyebrow="Reporting"
        meta="Phase 8 — sin motor de informes."
      />
      <NotAvailableState
        title="Informes aún no disponibles"
        description="REPORTING_NOT_AVAILABLE_YET. No se ofrecen descargas ni PDFs inventados."
      />
    </div>
  );
}
