import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

/**
 * Light Corporate page canvas (FASE 21.4 / 21.5).
 * Chrome (header/footer) is composed by SiteShell via chromeOwnership — not here.
 */
export default function CorporatePageShell({ children, className = "" }: Props) {
  return (
    <div className={`argos-corporate argos-corporate-shell ${className}`.trim()}>
      <div className="argos-corporate-shell__main">{children}</div>
    </div>
  );
}
