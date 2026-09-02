import Image from "next/image";
import type { ReactNode } from "react";

type Props = {
  /** Visible label — typically nav.methodArgos */
  label: string;
  children?: ReactNode;
  className?: string;
};

/**
 * Circular ARGOS brand mark + Método ARGOS identity group.
 * Asset: /chico-dumbo.png (approved circular Chico/Dumbo mark).
 */
export default function MethodBrandHeader({ label, children, className = "" }: Props) {
  return (
    <div className={`argos-method-brand ${className}`.trim()}>
      <div className="argos-method-brand__mark-wrap" aria-hidden="true">
        <Image
          src="/chico-dumbo.png"
          alt=""
          width={88}
          height={88}
          className="argos-method-brand__mark"
          priority={false}
        />
      </div>
      <div className="argos-method-brand__copy">
        <p className="argos-method-brand__label">{label}</p>
        {children}
      </div>
    </div>
  );
}
