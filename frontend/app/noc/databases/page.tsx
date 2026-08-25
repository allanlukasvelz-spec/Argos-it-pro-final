"use client";

import { Suspense } from "react";
import { NocAssetsList } from "@/components/noc/NocAssetsList";
import { NocLoading } from "@/components/noc/NocUi";

export default function NocDatabasesPage() {
  return (
    <Suspense fallback={<NocLoading />}>
      <NocAssetsList forcedType="DATABASE" title="Databases" eyebrow="Assets · DATABASE" />
    </Suspense>
  );
}
