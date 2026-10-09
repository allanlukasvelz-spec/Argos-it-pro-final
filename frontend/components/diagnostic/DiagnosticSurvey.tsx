"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import API from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import { buildDiagnosticSubmitBody } from "./diagnosticPersistPayload";
import {
  DIAGNOSTIC_CONTACT_HREF_AFTER,
  DIAGNOSTIC_OPTION_LABELS,
  DIAGNOSTIC_REGISTER_HREF_AFTER,
  diagnosticQuestions,
  type DiagnosticOptionIndex
} from "./diagnosticQuestions";
import { computeDiagnosticResult } from "./diagnosticScoring";

type Props = {
  ariaTitleId: string;
  onRequestClose: () => void;
};

function emptyAnswers(): undefined[] {
  return Array.from({ length: diagnosticQuestions.length }, () => undefined);
}

export function DiagnosticSurvey({ ariaTitleId, onRequestClose }: Props) {
  const isLoggedIn = useAuthStore((s) => s.authenticated);

  const [phase, setPhase] = useState<"survey" | "results">("survey");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(number | undefined)[]>(() => emptyAnswers());

  /** Guardado servidor (solo usuarios logueados). */
  const [persistState, setPersistState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [persistMsg, setPersistMsg] = useState<string | null>(null);

  const progress =
    diagnosticQuestions.length > 0 ? ((step + 1) / diagnosticQuestions.length) * 100 : 0;

  const currentAnswer = answers[step];
  const isLastQuestion = step === diagnosticQuestions.length - 1;

  const result = useMemo(
    () => (phase === "results" ? computeDiagnosticResult(answers) : null),
    [phase, answers]
  );

  const selectAnswer = (value: DiagnosticOptionIndex) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[step] = value;
      return next;
    });
  };

  const goPrev = () => setStep((s) => Math.max(0, s - 1));

  const goNext = () => {
    if (currentAnswer === undefined) return;
    if (step < diagnosticQuestions.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    setPhase("results");
  };

  const showResultsDirect = () => {
    if (currentAnswer === undefined) return;
    setPhase("results");
  };

  const resetAll = () => {
    setPhase("survey");
    setStep(0);
    setAnswers(emptyAnswers());
    setPersistState("idle");
    setPersistMsg(null);
  };

  const saveToPortal = async () => {
    if (!isLoggedIn || !result) return;
    const body = buildDiagnosticSubmitBody(result, answers);
    if (!body) {
      setPersistState("error");
      setPersistMsg(
        "Faltan respuestas para generar el informe completo. Repite las preguntas pendientes antes de guardar."
      );
      return;
    }
    setPersistState("saving");
    setPersistMsg(null);
    try {
      await API.post("/api/client/diagnostics", body);
      setPersistState("saved");
      setPersistMsg(null);
    } catch {
      setPersistState("error");
      setPersistMsg(
        "No pudimos guardar el diagnóstico ahora. Tu resultado sigue visible; inténtalo de nuevo más tarde o solicita revisión desde contacto."
      );
    }
  };

  const q = diagnosticQuestions[step];

  return (
    <>
      <div className="argos-diag-head">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="argos-diag-kicker">
              ARGOS-IT · Diagnóstico guiado
            </p>
            <h2 id={ariaTitleId} className="argos-diag-title">
              Diagnóstico ARGOS
            </h2>
          </div>
          <button
            type="button"
            className="argos-diag-close"
            onClick={onRequestClose}
            aria-label="Cerrar diagnóstico"
          >
            ×
          </button>
        </div>
      </div>

      {phase === "survey" && (
        <>
          <div className="argos-diag-progress" aria-hidden>
            <div className="argos-diag-progress__bar" style={{ width: `${progress}%` }} />
          </div>
          <p className="argos-diag-step">
            Pregunta {step + 1} de {diagnosticQuestions.length}
          </p>
          <div className="argos-diag-q">
            <p className="argos-diag-area">{q.area}</p>
            <p id={`${ariaTitleId}-q`} className="argos-diag-question">
              {q.text}
            </p>
            <div className="mt-8 grid gap-3" role="radiogroup" aria-labelledby={`${ariaTitleId}-q`}>
              {(DIAGNOSTIC_OPTION_LABELS as readonly string[]).map((label, i) => {
                const idx = i as DiagnosticOptionIndex;
                const selected = currentAnswer === idx;
                return (
                  <button
                    key={label}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => selectAnswer(idx)}
                    className={`argos-diag-option${selected ? " argos-diag-option--selected" : ""}`}
                  >
                    <span
                      className={`argos-diag-option__mark${selected ? " argos-diag-option__mark--on" : ""}`}
                    >
                      {selected ? "\u2713" : ""}
                    </span>
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="argos-diag-nav">
            <button type="button" onClick={goPrev} disabled={step <= 0} className="argos-diag-btn argos-diag-btn--quiet">
              Anterior
            </button>
            <div className="argos-diag-nav__next">
              {isLastQuestion ? (
                <button
                  type="button"
                  onClick={showResultsDirect}
                  disabled={currentAnswer === undefined}
                  className="argos-diag-btn argos-diag-btn--primary"
                >
                  Ver resultado
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={currentAnswer === undefined}
                  className="argos-diag-btn argos-diag-btn--primary"
                >
                  Siguiente
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {phase === "results" && result && (
        <div className="argos-diag-results">
          <div className={`argos-diag-tier argos-diag-tier--${result.tier}`}>
            <div className="flex flex-wrap items-baseline gap-3 md:justify-between">
              <p className="argos-diag-tier__label">{result.tierLabel}</p>
              <p className="argos-diag-tier__score">
                Puntuación:&nbsp;
                <span aria-label={`Total ${result.score} de ${result.maxScore}`}>
                  {result.score}
                </span>
                /{result.maxScore}
              </p>
            </div>
            <p className="argos-diag-tier__summary">{result.levelSummary}</p>
          </div>

          <p className="argos-diag-note">{result.closingNote}</p>

          <div className="argos-diag-grid">
            <section className="argos-diag-panel">
              <h3 className="argos-diag-panel__title">Resumen ejecutivo</h3>
              <p className="argos-diag-panel__body">
                {result.risksDetected.length <= 3
                  ? "El diagnóstico detecta pocas zonas críticas. Refuerzo preventivo habitual."
                  : "Varias zonas muestran riesgos acumulados. Una revisión ordenada mejorará seguridad y continuidad."}
              </p>
            </section>
            <section className="argos-diag-panel">
              <h3 className="argos-diag-panel__title">Puntos fuertes</h3>
              <ul className="argos-diag-panel__list">
                {result.strengths.length ? (
                  result.strengths.map((s, i) => (
                    <li key={`s-${String(i)}`} className="leading-snug">
                      {s}
                    </li>
                  ))
                ) : (
                  <li>Cubre prioridades antes de destacar puntos fuertes puntuales.</li>
                )}
              </ul>
            </section>
            <section className="argos-diag-panel argos-diag-panel--risk">
              <h3 className="argos-diag-panel__title">Riesgos detectados</h3>
              <ul className="argos-diag-panel__list">
                {result.risksDetected.length ? (
                  result.risksDetected.map((s, i) => (
                    <li key={`r-${String(i)}`}>{s}</li>
                  ))
                ) : (
                  <li>Riesgos puntuales; revisiones rutinarias suelen bastar por ahora.</li>
                )}
              </ul>
            </section>
          </div>

          <section className="argos-diag-panel argos-diag-panel--priority">
            <h3 className="argos-diag-panel__title">Prioridades recomendadas</h3>
            <ol className="argos-diag-panel__list argos-diag-panel__list--ordered">
              {result.priorities.length ? (
                result.priorities.map((s, i) => <li key={`p-${String(i)}`}>{s}</li>)
              ) : (
                <>
                  <li>Programar revisión técnica general cada 90 días.</li>
                  <li>Formalizar política de backups y comprueba restauración.</li>
                  <li>Auditar usuarios administrativos y desactivación de accesos obsoletos.</li>
                </>
              )}
            </ol>
          </section>

          {!isLoggedIn && (
            <div
              className="argos-diag-callout"
              role="note"
            >
              Tu resultado está listo. Para guardarlo en tu área privada, inicia sesión o crea una cuenta.
            </div>
          )}

          {isLoggedIn && persistState === "saved" && (
            <div
              className="argos-diag-callout argos-diag-callout--saved"
              role="status"
            >
              Diagnóstico guardado en tu área de cliente.
              <Link
                href="/dashboard"
                className="argos-diag-inline-link"
              >
                Ir al panel de cliente
              </Link>
            </div>
          )}

          {persistState === "error" && persistMsg && (
            <div className="argos-diag-callout argos-diag-callout--error">
              <p>{persistMsg}</p>
              {isLoggedIn && (
                <button
                  type="button"
                  onClick={() => {
                    setPersistState("idle");
                    setPersistMsg(null);
                    void saveToPortal();
                  }}
                  className="argos-diag-btn argos-diag-btn--quiet"
                >
                  Reintentar guardado
                </button>
              )}
            </div>
          )}

          <div className="mt-10 flex flex-col gap-4">
            <div className="flex flex-wrap items-stretch gap-3 md:flex-nowrap">
              <Link
                href={DIAGNOSTIC_CONTACT_HREF_AFTER}
                className="argos-diag-btn argos-diag-btn--primary"
              >
                Solicitar revisión ARGOS
              </Link>

              {!isLoggedIn ? (
                <Link
                  href={DIAGNOSTIC_REGISTER_HREF_AFTER}
                  className="argos-diag-btn argos-diag-btn--quiet"
                >
                  Crear cuenta para guardar mi diagnóstico
                </Link>
              ) : persistState !== "saved" ? (
                <button
                  type="button"
                  disabled={persistState === "saving"}
                  onClick={() => void saveToPortal()}
                  className="argos-diag-btn argos-diag-btn--quiet"
                >
                  {persistState === "saving" ? "Guardando…" : "Guardar en mi área de cliente"}
                </button>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-4 sm:justify-between">
              <button
                type="button"
                onClick={resetAll}
                className="argos-diag-btn argos-diag-btn--quiet"
              >
                Repetir diagnóstico
              </button>
              <button
                type="button"
                onClick={onRequestClose}
                className="argos-diag-btn argos-diag-btn--text"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
