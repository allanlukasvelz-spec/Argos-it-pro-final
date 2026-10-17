import { EmptyState } from "@/components/client/Status";
import { relativeTimeEs } from "@/lib/clientCopy";
import { reviewVerdictLabel } from "@/lib/webProjects/labels";
import type { WebProjectReview } from "@/lib/webProjects/types";

export function WebProjectReviews({ reviews }: { reviews: WebProjectReview[] }) {
  if (!reviews.length) {
    return (
      <section className="cp-card" aria-labelledby="wp-reviews-heading">
        <h2 id="wp-reviews-heading" className="wp-section-title">
          Revisiones
        </h2>
        <EmptyState
          title="Aún no hay revisiones de ARGOS."
          description="Cuando el equipo revise el expediente, el resultado aparecerá aquí. No puedes crear revisiones desde el portal."
        />
      </section>
    );
  }
  return (
    <section className="cp-card" aria-labelledby="wp-reviews-heading">
      <h2 id="wp-reviews-heading" className="wp-section-title">
        Revisiones
      </h2>
      <ul className="wp-list">
        {reviews.map((review) => (
          <li key={review.id} className="wp-list__item wp-list__item--stack">
            <strong>{reviewVerdictLabel(review.verdict)}</strong>
            {review.summary ? <p>{review.summary}</p> : null}
            <p className="cp-disclaimer">{relativeTimeEs(review.createdAt)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
