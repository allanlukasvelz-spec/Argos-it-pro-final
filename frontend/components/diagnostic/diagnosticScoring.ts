import { diagnosticQuestions, type DiagnosticQuestion } from "./diagnosticQuestions";

export type DiagnosticRiskTier = "bajo" | "medio" | "alto" | "critico";

export type DiagnosticResult = {
  score: number;
  maxScore: number;
  tier: DiagnosticRiskTier;
  tierLabel: string;
  /** Frase institucional del nivel */
  levelSummary: string;
  strengths: string[];
  risksDetected: string[];
  priorities: string[];
  /** Recomendación breve combinada */
  closingNote: string;
};

const LEVEL_SUMMARY: Record<DiagnosticRiskTier, string> = {
  bajo:
    "Tu entorno digital parece estar bien controlado. Aun así, conviene mantener revisiones periódicas para prevenir fallos y asegurar continuidad.",
  medio:
    "Tu empresa tiene una base funcional, pero existen áreas que podrían generar problemas si no se revisan a tiempo.",
  alto: "Hay señales claras de riesgo en tu entorno digital. Recomendamos una revisión técnica para priorizar seguridad, copias, accesos y estabilidad.",
  critico:
    "Tu empresa podría estar expuesta a fallos, pérdida de información o interrupciones importantes. Es recomendable actuar cuanto antes."
};

const TIER_LABEL: Record<DiagnosticRiskTier, string> = {
  bajo: "Riesgo bajo",
  medio: "Riesgo medio",
  alto: "Riesgo alto",
  critico: "Riesgo crítico"
};

export function getTierFromScore(total: number): DiagnosticRiskTier {
  if (total <= 5) return "bajo";
  if (total <= 11) return "medio";
  if (total <= 17) return "alto";
  return "critico";
}

/** Suma puntos de riesgo (0–2 por ítem); máximo 24 con 12 preguntas */
export function sumRiskPoints(answers: readonly (number | undefined)[]): number {
  let s = 0;
  const n = Math.min(diagnosticQuestions.length, answers.length);
  for (let i = 0; i < n; i++) {
    const v = answers[i];
    if (v === undefined) continue;
    s += Math.min(2, Math.max(0, Math.round(Number(v))));
  }
  return s;
}

function riskSentence(q: DiagnosticQuestion, value: number): string | null {
  if (value === 2)
    return `Crítico en ${q.area}: acción urgente recomendada en «${q.text.replace(/\?$/, "")}».`;
  if (value === 1)
    return `Atención en ${q.area}: conviene revisar «${q.shortLabel}».`;
  return null;
}

function priorityLine(q: DiagnosticQuestion, value: number): string | null {
  if (value < 2) return null;
  return `Priorizar revisión técnica: ${q.shortLabel}.`;
}

export function computeDiagnosticResult(answers: readonly (number | undefined)[]): DiagnosticResult {
  const score = sumRiskPoints(answers);
  const maxScore = diagnosticQuestions.length * 2;
  const tier = getTierFromScore(score);
  const strengths: string[] = [];
  const risksDetected: string[] = [];
  const priorities: string[] = [];

  diagnosticQuestions.forEach((q, i) => {
    const v = answers[i];
    if (v === undefined) return;
    if (v === 0) {
      strengths.push(`Punto fuerte en ${q.area}: «${q.shortLabel}».`);
    }
    const r = riskSentence(q, v);
    if (r) risksDetected.push(r);
    const p = priorityLine(q, v);
    if (p) priorities.push(p);
  });

  if (priorities.length === 0 && score >= 6) {
    diagnosticQuestions.forEach((q, i) => {
      const v = answers[i];
      if (v === 1) priorities.push(`Revisión preventiva recomendada: ${q.shortLabel}.`);
    });
  }

  const closingNote =
    score <= 11
      ? "ARGOS puede acompañarte en auditorías rutinarias y planes de mantenimiento."
      : "ARGOS puede ejecutar una revisión priorizada y un plan correctivo ordenado por impacto.";

  return {
    score,
    maxScore,
    tier,
    tierLabel: TIER_LABEL[tier],
    levelSummary: LEVEL_SUMMARY[tier],
    strengths: strengths.slice(0, 8),
    risksDetected: risksDetected.slice(0, 10),
    priorities: priorities.slice(0, 8),
    closingNote
  };
}
