/**
 * Phase 7 — frontend CHICO helper tests
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeChicoState,
  assertChicoNotFalselyNormal,
  chicoSpriteFor
} from "./chicoGuardian.ts";

describe("chicoGuardian client helpers", () => {
  it("normalizes unknown to UNKNOWN", () => {
    assert.equal(normalizeChicoState("wat"), "UNKNOWN");
    assert.equal(normalizeChicoState("NORMAL"), "NORMAL");
  });

  it("refuses false NORMAL without evidence", () => {
    assert.equal(
      assertChicoNotFalselyNormal("NORMAL", { monitorsEnabled: 0, fresh: 0 }),
      "UNKNOWN"
    );
    assert.equal(
      assertChicoNotFalselyNormal("NORMAL", { monitorsEnabled: 2, fresh: 1, openIncidents: 1 }),
      "CRITICAL"
    );
  });

  it("maps sprite for CRITICAL", () => {
    assert.ok(chicoSpriteFor("CRITICAL").includes("chico"));
  });
});
