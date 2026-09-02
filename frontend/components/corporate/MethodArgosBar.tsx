import Image from "next/image";
import ArgosPhaseLettersRow from "@/components/corporate/ArgosPhaseLettersRow";

type Step = {
  id: string;
  title: string;
};

type Props = {
  /** Primary title — typically method.title or nav.methodArgos */
  title: string;
  titleId?: string;
  steps: Step[];
  slugs: readonly string[];
  className?: string;
  as?: "h1" | "h2";
};

/**
 * Single primary Método ARGOS institutional bar:
 * [ circular white logo ] MÉTODO ARGOS [ A R G O S ]
 * Asset: /chico-dumbo.png — circular mark on intentional white disc.
 */
export default function MethodArgosBar({
  title,
  titleId = "method-argos-title",
  steps,
  slugs,
  className = "",
  as: TitleTag = "h2"
}: Props) {
  return (
    <div className={`argos-method-bar ${className}`.trim()} role="group" aria-labelledby={titleId}>
      <div className="argos-method-bar__brand">
        <div className="argos-method-bar__mark-wrap" aria-hidden="true">
          <Image
            src="/chico-dumbo.png"
            alt=""
            width={72}
            height={72}
            className="argos-method-bar__mark"
            priority={false}
          />
        </div>
        <TitleTag id={titleId} className="argos-font-display argos-method-bar__title">
          {title}
        </TitleTag>
      </div>
      <div className="argos-method-bar__phases">
        <ArgosPhaseLettersRow steps={steps} slugs={slugs} />
      </div>
    </div>
  );
}
