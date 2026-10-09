import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { architectureReadinessLabel, briefNoteStatusLabel, briefNoteTypeLabel, scopeStateLabel } from "./labels.ts";
import { nocGenericTransitionTargets, nextWorkflowStatuses } from "./nocWorkflow.ts";
import { webProjectErrorMessage } from "./errors.ts";

describe("phase 12 NOC brief UI", () => {
  it("readiness is not a raw enum", () => {
    assert.equal(architectureReadinessLabel("NOT_READY"), "No listo");
    assert.equal(architectureReadinessLabel("READY"), "Listo para arquitectura");
    assert.doesNotMatch(architectureReadinessLabel("READY_WITH_OPEN_ITEMS"), /READY_WITH_OPEN_ITEMS/);
  });

  it("scope and notes use human labels", () => {
    assert.equal(scopeStateLabel("required"), "Necesario");
    assert.equal(briefNoteTypeLabel("DECISION_REQUIRED"), "Decisión requerida");
    assert.equal(briefNoteStatusLabel("OPEN"), "Abierta");
  });

  it("REVIEW does not expose generic ARCHITECTURE transition", () => {
    assert.deepEqual(nextWorkflowStatuses("REVIEW"), ["INTAKE", "ARCHITECTURE"]);
    assert.deepEqual(nocGenericTransitionTargets("REVIEW"), ["INTAKE"]);
  });

  it("architecture not ready copy is staff-facing", () => {
    const err = {
      isAxiosError: true,
      response: { status: 409, data: { code: "ARCHITECTURE_NOT_READY", error: "No" } }
    };
    assert.match(webProjectErrorMessage(err), /arquitectura/i);
  });
});
