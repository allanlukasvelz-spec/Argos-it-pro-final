"use client";

import { Suspense } from "react";
import { NocAssetsList } from "@/components/noc/NocAssetsList";
import { NocLoading } from "@/components/noc/NocUi";

export default function NocAssetsPage() {
  return (
    <Suspense fallback={<NocLoading />}>
      <NocAssetsList />
    </Suspense>
  );
}
