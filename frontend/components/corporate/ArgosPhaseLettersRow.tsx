import Link from "next/link";

type Step = {
  id: string;
  title: string;
};

type Props = {
  steps: Step[];
  slugs: readonly string[];
};

/**
 * Five A.R.G.O.S. phases — single row, prominent initials.
 */
export default function ArgosPhaseLettersRow({ steps, slugs }: Props) {
  return (
    <ol className="argos-corp-phase-letters-row" aria-label="A.R.G.O.S.">
      {steps.map((step, index) => {
        const slug = slugs[index];
        if (!slug) return null;
        return (
          <li key={step.id}>
            <Link
              href={`/metodo/${slug}`}
              className="argos-corp-phase-letters-row__item"
              onFocus={(e) => {
                e.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest" });
              }}
            >
              <span className="argos-corp-phase-letters-row__letter" aria-hidden="true">
                {step.id}
              </span>
              <span className="argos-corp-phase-letters-row__title">{step.title}</span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
