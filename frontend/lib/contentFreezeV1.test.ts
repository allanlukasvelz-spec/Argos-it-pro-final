/**
 * Content Freeze v1.0 — runtime string and structural invariants.
 * Run: node --experimental-strip-types --test frontend/lib/contentFreezeV1.test.ts
 */
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { serviceSlugs } from "./services.ts";
import { METHOD_ARGOS_SLUGS } from "./methodArgosSteps.ts";

const ROOT = new URL("../", import.meta.url);
const es = JSON.parse(readFileSync(new URL("i18n/locales/es.json", ROOT), "utf8")) as {
  home: {
    title: string;
    subtitle: string;
    ctaHeroSecondary: string;
    explainer: { s0: { title: string } };
  };
  nav: { startDiagnostic: string };
  method: {
    dualBridge: string;
    publicSteps: Array<{ title: string }>;
    steps: Array<{ title: string }>;
  };
  servicesPage: { strategicPillars: string[] };
};

const FROZEN_H1 = "Sistemas que no fallen cuando no deben.";
const FROZEN_SUPPORTING =
  "Primero entendemos cómo trabaja tu empresa y de qué depende su operativa. Después ponemos orden, reducimos riesgos y mantenemos bajo control la tecnología que necesita para funcionar.";
const FROZEN_PRIMARY_CTA = "Iniciar diagnóstico ARGOS";
const FROZEN_SECONDARY_CTA = "Conocer cómo trabajamos";

const PUBLIC_PHASES = ["Analizamos", "Ordenamos", "Protegemos", "Acompañamos"];
const OPERATIONAL_PHASES = ["Analizar", "Reforzar", "Guiar", "Optimizar", "Supervisar"];
const PILLARS = ["Infraestructura", "Sistemas", "Seguridad", "Continuidad"];

const BLOCKED_PUBLIC = [/acronis/i, /24\/7/i, /garantizamos/i, /nunca se detendrá/i];

function scanJson(obj: unknown, hits: string[] = []): string[] {
  if (typeof obj === "string") {
    for (const pattern of BLOCKED_PUBLIC) {
      if (pattern.test(obj)) hits.push(obj);
    }
    return hits;
  }
  if (Array.isArray(obj)) {
    for (const item of obj) scanJson(item, hits);
    return hits;
  }
  if (obj && typeof obj === "object") {
    for (const value of Object.values(obj as Record<string, unknown>)) {
      scanJson(value, hits);
    }
  }
  return hits;
}

describe("content freeze v1.0 — FROZEN_EXACT (es.json)", () => {
  it("hero H1 exact", () => {
    assert.equal(es.home.title, FROZEN_H1);
  });

  it("hero supporting copy exact", () => {
    assert.equal(es.home.subtitle, FROZEN_SUPPORTING);
  });

  it("hero primary CTA exact", () => {
    assert.equal(es.nav.startDiagnostic, FROZEN_PRIMARY_CTA);
  });

  it("hero secondary CTA exact", () => {
    assert.equal(es.home.ctaHeroSecondary, FROZEN_SECONDARY_CTA);
  });
});

describe("content freeze v1.0 — FROZEN_CONCEPT", () => {
  it("4 public phases present in method.publicSteps", () => {
    assert.equal(es.method.publicSteps.length, 4);
    assert.deepEqual(
      es.method.publicSteps.map((s) => s.title),
      PUBLIC_PHASES
    );
  });

  it("5 operational A.R.G.O.S. phases preserved", () => {
    assert.equal(es.method.steps.length, 5);
    assert.deepEqual(
      es.method.steps.map((s) => s.title),
      OPERATIONAL_PHASES
    );
    assert.deepEqual([...METHOD_ARGOS_SLUGS], [
      "analizar",
      "reforzar",
      "guiar",
      "optimizar",
      "supervisar"
    ]);
  });

  it("dual-layer bridge copy present", () => {
    assert.match(es.method.dualBridge, /Cuatro movimientos, cinco fases/);
    assert.match(es.method.dualBridge, /No son dos métodos distintos/);
  });

  it("4 strategic pillars (names only)", () => {
    assert.deepEqual(es.servicesPage.strategicPillars, PILLARS);
  });

  it("6 commercial services preserved", () => {
    assert.equal(serviceSlugs.length, 6);
  });

  it("mascot roles preserved in explainer", () => {
    assert.match(es.home.explainer.s0.title, /Dumbo te guía/);
    assert.match(es.home.explainer.s0.title, /Chico te protege/);
  });
});

describe("content freeze v1.0 — BLOCKED public claims (es.json scan)", () => {
  it("no Acronis or blocked absolutes in es.json", () => {
    const hits = scanJson(es);
    assert.equal(hits.length, 0, `blocked hits: ${hits.join(" | ")}`);
  });
});

describe("content freeze v1.0 — diagnostic engine not duplicated", () => {
  it("single diagnostic questions module", () => {
    const questionsSrc = readFileSync(
      new URL("components/diagnostic/diagnosticQuestions.ts", ROOT),
      "utf8"
    );
    assert.match(questionsSrc, /export const diagnosticQuestions/);
    assert.doesNotMatch(questionsSrc, /diagnosticQuestionsV2/);
  });
});
