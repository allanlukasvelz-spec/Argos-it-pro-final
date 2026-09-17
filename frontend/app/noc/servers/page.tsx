"use client";

import { Suspense } from "react";
import { NocAssetsList } from "@/components/noc/NocAssetsList";
import { NocLoading } from "@/components/noc/NocUi";

export default function NocServersPage() {
  return (
    <Suspense fallback={<NocLoading />}>
      <NocAssetsList forcedType="SERVER" title="Servers" eyebrow="Assets · SERVER" />
    </Suspense>
  );
}
