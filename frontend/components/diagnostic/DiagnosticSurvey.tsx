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
import { computeDiagnosticResult, type DiagnosticRiskTier } from "./diagnosticScoring";

type Props = {
  ariaTitleId: string;
  onRequestClose: () => void;
};

const tierCardStyles: Record<DiagnosticRiskTier, string> = {
  bajo: "border-emerald-400/70 bg-emerald-50 text-emerald-950",
  medio: "border-amber-400/80 bg-amber-50 text-amber-950",
  alto: "border-orange-400/85 bg-orange-50 text-orange-950",
  critico: "border-red-500/80 bg-red-50 text-red-950"
};

const tierBarColor: Record<DiagnosticRiskTier, string> = {
  bajo: "from-emerald-500 to-teal-400",
  medio: "from-amber-500 to-orange-400",
  alto: "from-orange-500 to-red-400",
  critico: "from-red-600 to-red-800"
};

function emptyAnswers(): undefined[] {
  return Array.from({ length: diagnosticQuestions.length }, () => undefined);
}

export function DiagnosticSurvey({ ariaTitleId, onRequestClose }: Props) {
  const token = useAuthStore((s) => s.token);
  const isLoggedIn = Boolean(token);

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
      <div className="border-b border-slate-200/90 bg-[linear-gradient(120deg,#0f172a_0%,#0f172a_40%,#0e7490_120%)] px-6 py-4 text-white md:px-8 md:py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-cyan-200/90 md:text-xs">
              ARGOS-IT · Diagnóstico guiado
            </p>
            <h2 id={ariaTitleId} className="mt-2 text-xl font-black leading-snug md:text-2xl">
              Diagnóstico ARGOS
            </h2>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-full border border-white/35 bg-black/35 px-3 py-2 text-[13px] font-bold leading-none text-[#ECFEFF] shadow-md ring-2 ring-cyan-900/35 transition hover:border-cyan-200/80 hover:bg-black/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
            onClick={onRequestClose}
            aria-label="Cerrar diagnóstico"
          >
            ×
          </button>
        </div>
      </div>

      {phase === "survey" && (
        <>
          <div className="h-2 w-full overflow-hidden rounded-none bg-[#e2e8f0]" aria-hidden>
            <div
              className={`h-full bg-gradient-to-r ${tierBarColor.medio}`}
              style={{ width: `${progress}%`, transition: "width .28s ease-out" }}
            />
          </div>
          <p className="px-6 pt-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-600 md:px-8">
            Pregunta {step + 1} de {diagnosticQuestions.length}
          </p>
          <div className="min-h-[min(70vh,420px)] max-h-[min(70vh,520px)] overflow-y-auto overflow-x-hidden px-6 pb-6 pt-2 md:px-8 md:pb-8">
            <p className="mb-5 text-[11px] font-bold uppercase tracking-wide text-teal-800/90">{q.area}</p>
            <p id={`${ariaTitleId}-q`} className="text-lg font-extrabold leading-snug text-[#0B1E33] md:text-xl">
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
                    className={`flex w-full min-h-[52px] items-center rounded-xl border px-4 py-3 text-left text-sm font-bold leading-snug transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 md:min-h-14 md:text-[0.9375rem] ${
                      selected
                        ? "border-[#0891b2] bg-[#ecfeff] text-[#0B1E33] shadow-md ring-2 ring-[#67e8f9]/95"
                        : "border-slate-200 bg-white text-slate-900 hover:border-cyan-300/80 hover:bg-slate-50"
                    }`}
                  >
                    <span className="mr-3 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 text-[11px] text-slate-500">
                      {selected ? "\u2713" : ""}
                    </span>
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 border-t border-slate-200 bg-slate-50/95 px-6 py-4 md:justify-between md:px-8 md:py-5">
            <button
              type="button"
              onClick={goPrev}
              disabled={step <= 0}
              className="inline-flex min-h-[44px] min-w-[6.75rem] items-center justify-center rounded-lg border border-slate-400/80 px-5 text-[13px] font-black text-[#1e293b] transition hover:bg-slate-200/80 disabled:pointer-events-none disabled:border-slate-200 disabled:text-slate-400 disabled:opacity-65 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500"
            >
              Anterior
            </button>
            <div className="flex flex-1 justify-end gap-3">
              {isLastQuestion ? (
                <button
                  type="button"
                  onClick={showResultsDirect}
                  disabled={currentAnswer === undefined}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-gradient-to-br from-[#0284c7] to-[#0e7490] px-8 text-[13px] font-black text-white shadow-lg ring-2 ring-cyan-200/95 transition hover:from-[#0ea5e9] hover:to-[#0891b2] disabled:pointer-events-none disabled:bg-none disabled:bg-slate-300 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0891b2]"
                >
                  Ver resultado
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={currentAnswer === undefined}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#0891b2] px-8 text-[13px] font-black text-white shadow-md ring-2 ring-cyan-100 transition hover:bg-[#0e7490] disabled:pointer-events-none disabled:bg-slate-300 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0891b2]"
                >
                  Siguiente
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {phase === "results" && result && (
        <div className="max-h-[min(92vh,calc(100vh-2rem))] overflow-y-auto overflow-x-hidden px-6 py-8 md:px-10 md:pb-10">
          <div className={`mb-8 rounded-xl border px-6 py-5 shadow-sm ${tierCardStyles[result.tier]}`}>
            <div className="flex flex-wrap items-baseline gap-3 md:justify-between">
              <p className="text-xl font-black md:text-2xl">{result.tierLabel}</p>
              <p className="text-sm font-black tabular-nums md:text-base">
                Puntuación:&nbsp;
                <span aria-label={`Total ${result.score} de ${result.maxScore}`}>
                  {result.score}
                </span>
                /{result.maxScore}
              </p>
            </div>
            <p className="mt-4 border-t border-current/25 pt-4 text-sm font-semibold leading-relaxed">{result.levelSummary}</p>
          </div>

          <p className="text-sm font-semibold leading-relaxed text-slate-900">{result.closingNote}</p>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <section className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-md">
              <h3 className="text-[11px] font-black uppercase tracking-wider text-teal-900">Resumen ejecutivo</h3>
              <p className="mt-4 text-[13px] font-semibold leading-snug text-slate-800">
                {result.risksDetected.length <= 3
                  ? "El diagnóstico detecta pocas zonas críticas. Refuerzo preventivo habitual."
                  : "Varias zonas muestran riesgos acumulados. Una revisión ordenada mejorará seguridad y continuidad."}
              </p>
            </section>
            <section className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-md">
              <h3 className="text-[11px] font-black uppercase tracking-wider text-emerald-950">Puntos fuertes</h3>
              <ul className="mt-3 list-inside list-disc space-y-1.5 text-[13px] font-medium text-slate-800">
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
            <section className="rounded-xl border border-orange-700/35 bg-orange-50/95 px-5 py-4 shadow-md">
              <h3 className="text-[11px] font-black uppercase tracking-wider text-orange-950">Riesgos detectados</h3>
              <ul className="mt-3 list-inside list-disc space-y-1.5 text-[13px] font-medium leading-snug text-orange-950">
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

          <section className="mt-8 rounded-xl border border-cyan-500/55 bg-[#ecfeff] px-6 py-5 shadow-sm">
            <h3 className="text-[11px] font-black uppercase tracking-wider text-cyan-950">Prioridades recomendadas</h3>
            <ol className="mt-4 list-inside list-decimal space-y-2 text-[13px] font-bold leading-relaxed text-slate-950">
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
              className="mt-8 rounded-xl border border-slate-300/90 bg-[#f1f5f9] px-5 py-4 text-[13px] font-semibold leading-relaxed text-slate-800 shadow-sm"
              role="note"
            >
              Tu resultado está listo. Para guardarlo en tu área privada, inicia sesión o crea una cuenta.
            </div>
          )}

          {isLoggedIn && persistState === "saved" && (
            <div
              className="mt-8 rounded-xl border border-emerald-400/75 bg-emerald-50 px-5 py-4 text-[13px] font-bold leading-relaxed text-emerald-950 shadow-sm"
              role="status"
            >
              Diagnóstico guardado en tu área de cliente.
              <Link
                href="/dashboard"
                className="mt-2 block text-[13px] font-black text-teal-800 underline underline-offset-4 hover:text-teal-950"
              >
                Ir al panel de cliente
              </Link>
            </div>
          )}

          {persistState === "error" && persistMsg && (
            <div className="mt-6 rounded-xl border border-amber-400/80 bg-amber-50 px-5 py-4 text-[13px] font-semibold leading-relaxed text-amber-950">
              <p>{persistMsg}</p>
              {isLoggedIn && (
                <button
                  type="button"
                  onClick={() => {
                    setPersistState("idle");
                    setPersistMsg(null);
                    void saveToPortal();
                  }}
                  className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-lg border border-amber-700/50 bg-white px-5 text-[12px] font-black uppercase tracking-wide text-amber-950 transition hover:bg-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
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
                className="inline-flex min-h-[48px] min-w-[min(100%,280px)] flex-1 items-center justify-center rounded-xl bg-[#0891b2] px-6 text-[13px] font-black uppercase tracking-[0.02em] text-white shadow-xl ring-2 ring-cyan-100 transition hover:bg-[#0e7490] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0891b2]"
              >
                Solicitar revisión ARGOS
              </Link>

              {!isLoggedIn ? (
                <Link
                  href={DIAGNOSTIC_REGISTER_HREF_AFTER}
                  className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl border-2 border-[#0f172a] bg-white px-6 text-[13px] font-black uppercase tracking-[0.02em] text-[#0f172a] shadow-sm transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0891b2] md:min-w-[220px]"
                >
                  Crear cuenta para guardar mi diagnóstico
                </Link>
              ) : persistState !== "saved" ? (
                <button
                  type="button"
                  disabled={persistState === "saving"}
                  onClick={() => void saveToPortal()}
                  className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl border-2 border-[#0e7490] bg-[#ecfeff] px-6 text-[13px] font-black uppercase tracking-[0.02em] text-[#064e3b] shadow-inner transition hover:bg-cyan-100 disabled:pointer-events-none disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 md:min-w-[220px]"
                >
                  {persistState === "saving" ? "Guardando…" : "Guardar en mi área de cliente"}
                </button>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-4 sm:justify-between">
              <button
                type="button"
                onClick={resetAll}
                className="inline-flex min-h-[48px] min-w-[180px] items-center justify-center rounded-xl border border-slate-900/25 px-8 text-[13px] font-black text-[#1e293b] transition hover:bg-slate-200/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500"
              >
                Repetir diagnóstico
              </button>
              <button
                type="button"
                onClick={onRequestClose}
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl px-6 text-[13px] font-bold text-slate-600 underline underline-offset-4 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 sm:ml-auto"
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
