import MockLabel from "./MockLabel";

export default function ApprovalGate({ level }: { level: "L3" | "L4" }) {
  return (
    <article className="pm-card">
      <MockLabel kind="TARGET" />
      <h3>ApprovalGate humano · {level}</h3>
      <p>
        {level === "L3"
          ? "Level 3 exige aprobación humana explícita. Nunca se muestra AUTO FIX."
          : "Level 4 nunca es automático. Intervención humana obligatoria."}
      </p>
      <p className="pm-card__meta">Simulación visual. No ejecuta nada.</p>
    </article>
  );
}
