"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { DiagnosticSurveyModal } from "./DiagnosticSurveyModal";

type Value = {
  openDiagnostic: () => void;
};

const DiagnosticSurveyLauncherContext = createContext<Value | null>(null);

export function DiagnosticSurveyLauncherProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openDiagnostic = useCallback(() => setOpen(true), []);

  const value = useMemo(() => ({ openDiagnostic }), [openDiagnostic]);

  return (
    <DiagnosticSurveyLauncherContext.Provider value={value}>
      {children}
      <DiagnosticSurveyModal open={open} onClose={() => setOpen(false)} />
    </DiagnosticSurveyLauncherContext.Provider>
  );
}

export function useDiagnosticSurveyLauncher(): Value {
  const ctx = useContext(DiagnosticSurveyLauncherContext);
  if (!ctx) {
    throw new Error("useDiagnosticSurveyLauncher must be used within DiagnosticSurveyLauncherProvider");
  }
  return ctx;
}
