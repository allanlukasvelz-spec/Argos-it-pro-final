import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

/**
 * Light Corporate page foundation (FASE 21.4).
 * Does not use ArgosPageShell / nocturnal legacy backgrounds.
 */
export default function CorporatePageShell({ children, className = "" }: Props) {
  return (
    <div className={`argos-corporate argos-corporate-shell ${className}`.trim()}>
      <div className="argos-corporate-shell__main">{children}</div>
    </div>
  );
}
