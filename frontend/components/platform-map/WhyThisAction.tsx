"use client";

import type { RemediationAction } from "@/lib/platform-map/types";
import MockLabel from "./MockLabel";

type Props = {
  action: RemediationAction;
  onClose: () => void;
  variant?: "noc";
};

export default function WhyThisAction({ action, onClose, variant }: Props) {
  return (
    <aside className={`pm-panel${variant === "noc" ? " pm-panel--noc" : ""}`} aria-label="Why this action">
      <p className="pm-kicker">Why this action?</p>
      <h2 style={{ marginTop: 0 }}>Acción {action.id}</h2>
      <p>
        <MockLabel kind="DEMO" /> Nivel {action.level} · Confianza {action.confidence}
      </p>
      <p>No hay porcentajes de confianza. Solo HIGH / MEDIUM / LOW / UNKNOWN.</p>
      <dl>
        <dt>Evidence</dt>
        <dd>{action.evidence}</dd>
        <dt>Hypothesis</dt>
        <dd>{action.hypothesis}</dd>
        <dt>Confidence</dt>
        <dd>{action.confidence}</dd>
        <dt>Alternatives</dt>
        <dd>{action.alternatives.join(" · ")}</dd>
        <dt>Expected Result</dt>
        <dd>{action.expectedResult}</dd>
        <dt>Risk</dt>
        <dd>{action.risk}</dd>
        <dt>Failure Signal</dt>
        <dd>{action.failureSignal}</dd>
        {action.actionB ? (
          <>
            <dt>Action B</dt>
            <dd>{action.actionB}</dd>
          </>
        ) : null}
        {action.actionC ? (
          <>
            <dt>Action C</dt>
            <dd>{action.actionC}</dd>
          </>
        ) : null}
        <dt>Rollback</dt>
        <dd>{action.rollback}</dd>
      </dl>
      <button type="button" className="pm-btn pm-btn--ghost" onClick={onClose}>
        Cerrar
      </button>
    </aside>
  );
}
