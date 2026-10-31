/**
 * Mismo campo en movimiento que la invitación de proyecto web
 * (rejilla, circuitos, planos y órbitas). Queda fijo detrás del contenido.
 * No recibe clics.
 */
export default function PublicMotionField() {
  return (
    <div className="argos-page-shell argos-bg-portal argos-public-motion" aria-hidden="true">
      <div className="argos-page-bg">
        <span className="argos-bg-layer argos-bg-grid" />
        <span className="argos-bg-layer argos-bg-circuit" />
        <span className="argos-bg-layer argos-bg-diagonal argos-bg-diagonal--one" />
        <span className="argos-bg-layer argos-bg-diagonal argos-bg-diagonal--two" />
        <span className="argos-bg-layer argos-bg-glow argos-bg-glow--one" />
        <span className="argos-bg-layer argos-bg-glow argos-bg-glow--two" />
        <span className="argos-bg-layer argos-bg-orbit" />
        <span className="argos-bg-layer argos-bg-noise" />
        <span className="argos-bg-layer argos-bg-meteors" />
        <span className="argos-bg-layer argos-bg-stars" />
      </div>
    </div>
  );
}
