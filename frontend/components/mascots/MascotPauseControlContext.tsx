"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type MascotPauseTarget = "chico" | "dumbo";

type MascotPauseControlValue = {
  visible: boolean;
  selectedMascot: MascotPauseTarget | null;
  showPauseFor: (mascot: MascotPauseTarget) => void;
};

const MascotPauseControlContext = createContext<MascotPauseControlValue | null>(null);

export function MascotPauseControlProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [selectedMascot, setSelectedMascot] = useState<MascotPauseTarget | null>(null);

  const showPauseFor = useCallback((mascot: MascotPauseTarget) => {
    setSelectedMascot(mascot);
    setVisible(true);
  }, []);

  const value = useMemo(
    () => ({ visible, selectedMascot, showPauseFor }),
    [visible, selectedMascot, showPauseFor]
  );

  return (
    <MascotPauseControlContext.Provider value={value}>{children}</MascotPauseControlContext.Provider>
  );
}

export function useMascotPauseControl(): MascotPauseControlValue {
  const ctx = useContext(MascotPauseControlContext);
  if (!ctx) {
    throw new Error("useMascotPauseControl must be used within MascotPauseControlProvider");
  }
  return ctx;
}

/** Optional hook for header banner (provider may be absent on chrome-less routes). */
export function useMascotPauseControlOptional(): MascotPauseControlValue | null {
  return useContext(MascotPauseControlContext);
}
