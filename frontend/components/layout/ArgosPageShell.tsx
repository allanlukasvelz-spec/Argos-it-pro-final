import type { ReactNode } from "react";
import MethodGalaxyBackdrop from "@/components/method/MethodGalaxyBackdrop";

type ArgosBackgroundVariant =
  | "home"
  | "services"
  | "method"
  | "method-galaxy"
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

function DefaultBackground() {
  return (
    <>
      <span className="argos-bg-layer argos-bg-grid" />
      <span className="argos-bg-layer argos-bg-circuit" />
      <span className="argos-bg-layer argos-bg-diagonal argos-bg-diagonal--one" />
      <span className="argos-bg-layer argos-bg-diagonal argos-bg-diagonal--two" />
      <span className="argos-bg-layer argos-bg-glow argos-bg-glow--one" />
      <span className="argos-bg-layer argos-bg-glow argos-bg-glow--two" />
      <span className="argos-bg-layer argos-bg-orbit" />
      <span className="argos-bg-layer argos-bg-noise" />
      <span className="argos-bg-layer argos-bg-meteors" />
      <span className="argos-bg-layer argos-bg-stars" />
    </>
  );
}

export default function ArgosPageShell({ variant, children, className = "" }: Props) {
  const isMethodGalaxy = variant === "method-galaxy";

  return (
    <div
      className={`argos-page-shell argos-bg-${variant} ${isMethodGalaxy ? "argos-page-shell--method-galaxy argos-method-galaxy--lite" : ""} ${className}`}
    >
      <div className="argos-page-bg" aria-hidden="true">
        {isMethodGalaxy ? <MethodGalaxyBackdrop variant="method-lite" /> : <DefaultBackground />}
      </div>

      <main className="argos-content-layer">{children}</main>
    </div>
  );
}

