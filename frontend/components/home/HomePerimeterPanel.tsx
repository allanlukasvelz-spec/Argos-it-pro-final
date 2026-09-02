"use client";

/**
 * ARGOS Perimeter System motif — Quiet Authority / Framer Corporate Visual Lab.
 * Abstract observation panel. NOT a NOC dashboard, NOT fake metrics.
 */
export default function HomePerimeterPanel() {
  return (
    <aside className="argos-perimeter" aria-hidden="true">
      <div className="argos-perimeter__frame">
        <p className="argos-perimeter__kicker">Observación · continua</p>
        <div className="argos-perimeter__grid">
          <span className="argos-perimeter__node argos-perimeter__node--a" />
          <span className="argos-perimeter__node argos-perimeter__node--b" />
          <span className="argos-perimeter__node argos-perimeter__node--c" />
          <span className="argos-perimeter__line argos-perimeter__line--h1" />
          <span className="argos-perimeter__line argos-perimeter__line--h2" />
          <span className="argos-perimeter__line argos-perimeter__line--v1" />
          <span className="argos-perimeter__arc" />
        </div>
        <div className="argos-perimeter__meta">
          <span>Perímetro / continuidad</span>
          <span className="argos-perimeter__status">Estable</span>
        </div>
      </div>
    </aside>
  );
}
