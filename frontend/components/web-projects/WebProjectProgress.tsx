import { progressCopy, reviewProgressCopy } from "@/lib/webProjects/viewModel";
import type { WebProject } from "@/lib/webProjects/types";

export function WebProjectProgress({
  progress,
  project
}: {
  progress?: WebProject["progress"];
  project?: Pick<WebProject, "reviewSummary" | "sectionProgress">;
}) {
  const copy = progressCopy(progress);
  const review = reviewProgressCopy(project);
  return (
    <section className="cp-card" aria-labelledby="wp-progress-heading">
      <h2 id="wp-progress-heading" className="wp-section-title">
        Resumen
      </h2>
      <div className="wp-progress">
        <div
          className="wp-progress__bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={copy.percentage}
          aria-label={`Recopilación: ${copy.percentage} por ciento`}
        >
          <span style={{ width: `${copy.percentage}%` }} />
        </div>
        <p>
          Recopilación{" "}
          <strong>
            {copy.completed}/{copy.required}
          </strong>{" "}
          · {copy.percentage} %
        </p>
        <p>
          Revisión {review.approved} aprobados · {review.correctionRequired} requieren corrección ·{" "}
          {review.pending} pendientes
        </p>
        <p className="cp-disclaimer">
          La recopilación mide información aportada. La revisión mide el criterio de ARGOS. No son el mismo porcentaje.
        </p>
        {project?.sectionProgress ? (
          <p>
            Apartados completos{" "}
            <strong>
              {project.sectionProgress.filter((section) => !section.hidden && section.status === "complete").length}
              /
              {project.sectionProgress.filter((section) => !section.hidden).length}
            </strong>
          </p>
        ) : null}
      </div>
    </section>
  );
}
