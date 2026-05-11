/**
 * Parámetros URL para grabación OBS / QuickTime (modo explainer).
 *
 * - explainerRecord=1 — no pausa el autoavance al pasar el ratón por la sección.
 * - explainerManual=1 — solo avance manual (tabs / Anterior / Siguiente); ignora autoavance.
 * - explainerAutoMs=8000 — intervalo entre escenas en ms (clamp 3000–60000). Tiene prioridad sobre el multiplicador.
 * - explainerAutoMult=1.5 — multiplica el intervalo por defecto (6500 ms). Solo si no hay explainerAutoMs.
 */

const DEFAULT_AUTO_MS = 6500;
const MIN_AUTO_MS = 3000;
const MAX_AUTO_MS = 60000;

export type ExplainerRecordOptions = {
  recordMode: boolean;
  manualOnly: boolean;
  autoMs: number;
};

export function parseExplainerRecordParams(searchParams: URLSearchParams): ExplainerRecordOptions {
  const recordMode = searchParams.get("explainerRecord") === "1";
  const manualOnly = searchParams.get("explainerManual") === "1";

  const rawMs = searchParams.get("explainerAutoMs");
  let autoMs = DEFAULT_AUTO_MS;
  if (rawMs != null && rawMs !== "") {
    const n = Number.parseInt(rawMs, 10);
    if (!Number.isNaN(n)) {
      autoMs = Math.min(MAX_AUTO_MS, Math.max(MIN_AUTO_MS, n));
    }
  } else {
    const rawMult = searchParams.get("explainerAutoMult");
    if (rawMult != null && rawMult !== "") {
      const m = Number.parseFloat(rawMult);
      if (!Number.isNaN(m) && m > 0) {
        autoMs = Math.min(MAX_AUTO_MS, Math.max(MIN_AUTO_MS, Math.round(DEFAULT_AUTO_MS * m)));
      }
    }
  }

  return { recordMode, manualOnly, autoMs };
}
