"use client";

import { useLayoutEffect, type ReactNode } from "react";
import { syncAuthSessionCookieFromStorage } from "@/lib/auth-session";

export default function ClientShell({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    syncAuthSessionCookieFromStorage();
  }, []);

  return <>{children}</>;
}
