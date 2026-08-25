"use client";

import { type ReactNode } from "react";

/**
 * Root layout passthrough — real portal chrome lives in
 * components/client/ClientPortalShell (dashboard layout only).
 * Avoids applying Client/NOC chrome to public pages.
 */
export default function ClientShell({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
