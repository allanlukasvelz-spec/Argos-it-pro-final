import { reviewStatusIcon, reviewStatusLabel } from "@/lib/webProjects/labels";
import type { WebProjectReviewState } from "@/lib/webProjects/types";

export function WebProjectReviewStatus({
  state,
  emphasizeCorrection = false
}: {
  state: WebProjectReviewState | null | undefined;
  emphasizeCorrection?: boolean;
}) {
  if (!state) return null;
  const correction = state.status === "CORRECTION_REQUIRED";
  const label = reviewStatusLabel(state.status);
  return (
    <p
      className={correction && emphasizeCorrection ? "wp-review-status wp-review-status--alert" : "wp-review-status"}
      role="status"
    >
      <span aria-hidden="true">{reviewStatusIcon(state.status)} </span>
      {label}
    </p>
  );
}
