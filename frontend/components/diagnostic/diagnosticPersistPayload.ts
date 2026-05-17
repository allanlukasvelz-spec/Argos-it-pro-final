import {
  DIAGNOSTIC_OPTION_LABELS,
  diagnosticQuestions,
  DIAGNOSTIC_SOURCE,
  type DiagnosticOptionIndex,
  type DiagnosticQuestion
} from "./diagnosticQuestions";
import type { DiagnosticResult, DiagnosticRiskTier } from "./diagnosticScoring";

/** Niveles esperados por el backend (no confiar en userId desde cliente). */
const TIER_TO_API_LEVEL: Record<DiagnosticRiskTier, "low" | "medium" | "high" | "critical"> = {
  bajo: "low",
  medio: "medium",
  alto: "high",
  critico: "critical"
};

export type DiagnosticPersistAnswerRow = {
  questionId: string;
  question: string;
  answerLabel: string;
  riskPoints: DiagnosticOptionIndex;
};

export type DiagnosticSubmitBody = {
  source: typeof DIAGNOSTIC_SOURCE;
  score: number;
  maxScore: number;
  riskLevel: (typeof TIER_TO_API_LEVEL)[DiagnosticRiskTier];
  riskLabel: string;
  summary: string;
  strengths: string[];
  risksDetected: string[];
  priorities: string[];
  answers: DiagnosticPersistAnswerRow[];
};

/** Construye el cuerpo JSON validado cliente → POST /api/client/diagnostics. */
export function buildDiagnosticSubmitBody(
  result: DiagnosticResult,
  answers: readonly (number | undefined)[]
): DiagnosticSubmitBody | null {
  const answerRows: DiagnosticPersistAnswerRow[] = [];
  for (let i = 0; i < diagnosticQuestions.length; i += 1) {
    const q: DiagnosticQuestion = diagnosticQuestions[i]!;
    const pts = answers[i];
    if (pts === undefined) continue;
    const idx = pts as DiagnosticOptionIndex;
    if (idx < 0 || idx > 2) continue;
    answerRows.push({
      questionId: q.id,
      question: q.text,
      answerLabel: DIAGNOSTIC_OPTION_LABELS[idx],
      riskPoints: idx
    });
  }
  if (answerRows.length < diagnosticQuestions.length) {
    return null;
  }

  return {
    source: DIAGNOSTIC_SOURCE,
    score: result.score,
    maxScore: result.maxScore,
    riskLevel: TIER_TO_API_LEVEL[result.tier],
    riskLabel: result.tierLabel,
    summary: result.levelSummary,
    strengths: result.strengths,
    risksDetected: result.risksDetected,
    priorities: result.priorities,
    answers: answerRows
  };
}
