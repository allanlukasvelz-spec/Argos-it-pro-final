type Props = {
  onResolve?: () => void;
  onStop?: () => void;
  onRollback?: () => void;
  onEscalate?: () => void;
  outcome?: string;
};

export default function SafeStop({ onResolve, onStop, onRollback, onEscalate, outcome }: Props) {
  return (
    <article className="pm-card">
      <h3>Cierre controlado</h3>
      <p>Todas las salidas son simulación visual. Ninguna toca producción.</p>
      <div className="pm-cta-row">
        <button type="button" className="pm-btn pm-btn--teal" onClick={onResolve}>
          Resolve
        </button>
        <button type="button" className="pm-btn pm-btn--ghost" onClick={onStop}>
          Safe Stop
        </button>
        <button type="button" className="pm-btn pm-btn--ghost" onClick={onRollback}>
          Rollback
        </button>
        <button type="button" className="pm-btn pm-btn--ghost" onClick={onEscalate}>
          Escalate
        </button>
      </div>
      {outcome ? <p style={{ marginTop: "0.8rem" }}>{outcome}</p> : null}
    </article>
  );
}
