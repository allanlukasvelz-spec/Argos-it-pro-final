"use client";

import { chicoShapeFor, chicoSpriteFor, normalizeChicoState, type ChicoGuardianPayload } from "@/lib/chicoGuardian";
import { chicoStateLabelEs } from "@/lib/clientCopy";

type Props = {
  guardian: ChicoGuardianPayload | null;
  compact?: boolean;
  className?: string;
};

export function ChicoGuardian({ guardian, compact = false, className }: Props) {
  if (!guardian) return null;
  const state = normalizeChicoState(guardian.state);
  const sprite = chicoSpriteFor(state);
  const shape = chicoShapeFor(state);
  const unknown = state === "UNKNOWN";
  const stateLabel = chicoStateLabelEs(state);

  return (
    <aside
      className={`chico-guardian ${compact ? "chico-guardian--compact" : ""} ${className || ""}`}
      aria-label={`CHICO, guardián de seguridad: ${stateLabel}`}
      data-chico-state={state}
    >
      <div className="chico-guardian__visual">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={sprite}
          alt=""
          width={compact ? 56 : 72}
          height={compact ? 56 : 72}
          className="chico-guardian__sprite"
        />
        <span
          className={`chico-guardian__badge ${unknown ? "chico-guardian__badge--unknown" : ""}`}
          aria-hidden
        >
          {shape}
        </span>
      </div>
      <div className="chico-guardian__body">
        <p className="chico-guardian__eyebrow">CHICO · Guardián de seguridad</p>
        <p className="chico-guardian__state">
          <span className="chico-guardian__state-label">{stateLabel}</span>
        </p>
        <p className="chico-guardian__message">{guardian.message}</p>
      </div>
    </aside>
  );
}

export function ChicoStateIndicator({ state, label }: { state: string; label?: string }) {
  const s = normalizeChicoState(state);
  const unknown = s === "UNKNOWN";
  return (
    <span
      className={`chico-state-indicator ${unknown ? "chico-state-indicator--unknown" : ""}`}
      data-chico-state={s}
    >
      <span aria-hidden>{chicoShapeFor(s)}</span>
      <span>{label || s}</span>
    </span>
  );
}
