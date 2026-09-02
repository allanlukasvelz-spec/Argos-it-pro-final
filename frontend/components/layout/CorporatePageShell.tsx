"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

type Props = {
  children: ReactNode;
  className?: string;
};

/**
 * Transición ligera del contenido principal al cambiar de página.
 * No anima el header. No bloquea la navegación.
 * No remonta en el primer paint (evita desmontar CTAs mid-click).
 */
export default function CorporatePageShell({ children, className = "" }: Props) {
  const pathname = usePathname();
  const [enterKey, setEnterKey] = useState(0);
  const isFirstPath = useRef(true);

  useEffect(() => {
    if (isFirstPath.current) {
      isFirstPath.current = false;
      return;
    }
    setEnterKey((k) => k + 1);
  }, [pathname]);

  return (
    <div className={`argos-corporate argos-corporate-shell ${className}`.trim()}>
      <div key={enterKey} className="argos-corporate-shell__main argos-page-enter">
        {children}
      </div>
    </div>
  );
}
