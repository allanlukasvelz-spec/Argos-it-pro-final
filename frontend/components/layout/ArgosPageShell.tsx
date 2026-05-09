import type { ReactNode } from "react";

type ArgosBackgroundVariant =
  | "home"
  | "services"
  | "method"
  | "about"
  | "contact"
  | "agenda"
  | "legal"
  | "portal";

type Props = {
  variant: ArgosBackgroundVariant;
  children: ReactNode;
  className?: string;
};

export default function ArgosPageShell({ variant, children, className = "" }: Props) {
  return (
    <div className={`argos-page-shell argos-bg-${variant} ${className}`}>
      <div className="argos-page-bg" aria-hidden="true">
        <span className="argos-bg-layer argos-bg-grid" />
        <span className="argos-bg-layer argos-bg-circuit" />
        <span className="argos-bg-layer argos-bg-diagonal argos-bg-diagonal--one" />
        <span className="argos-bg-layer argos-bg-diagonal argos-bg-diagonal--two" />
        <span className="argos-bg-layer argos-bg-glow argos-bg-glow--one" />
        <span className="argos-bg-layer argos-bg-glow argos-bg-glow--two" />
        <span className="argos-bg-layer argos-bg-orbit" />
        <span className="argos-bg-layer argos-bg-noise" />
      </div>

      <main className="argos-content-layer">{children}</main>
    </div>
  );
}
