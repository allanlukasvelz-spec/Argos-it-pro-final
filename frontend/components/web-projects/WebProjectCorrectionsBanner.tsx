import { correctionAnchor, correctionsSummaryCopy, openCorrectionStates } from "@/lib/webProjects/viewModel";
import type { WebProject } from "@/lib/webProjects/types";

export function WebProjectCorrectionsBanner({ project }: { project: WebProject }) {
  const summary = correctionsSummaryCopy(project);
  if (!summary.show) return null;
  const items = openCorrectionStates(project);
  return (
    <section className="cp-card wp-corrections" aria-labelledby="wp-corrections-heading">
      <h2 id="wp-corrections-heading" className="wp-section-title">
        ⚠ {summary.title}
      </h2>
      <p className="cp-disclaimer">ARGOS ha marcado estos elementos. Corrige cada uno; no uses un botón genérico de «corregido».</p>
      <ul className="wp-corrections__list">
        {items.map((item) => (
          <li key={`${item.targetType}-${item.targetId || item.targetKey}`}>
            <a href={`#${correctionAnchor(item)}`}>Ver corrección</a>
            {item.correctionMessage ? <span> — {item.correctionMessage}</span> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
