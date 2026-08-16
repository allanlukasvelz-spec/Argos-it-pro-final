/**
 * FASE 21.6B.7A — source-level safety contracts (no TS runtime import).
 * Run: node --test frontend/ai/mascotBehaviorSafety.test.js
 */
const { readFileSync } = require("node:fs");
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const statesPath = path.join(__dirname, "mascotStates.ts");
const controllerPath = path.join(ROOT, "hooks/useMascotController.ts");

describe("21.6B.7A mascot behavior safety", () => {
  const states = readFileSync(statesPath, "utf8");
  const controller = readFileSync(controllerPath, "utf8");

  it("hover must not assign walking", () => {
    const hoverBlock = states.match(/case "hover":[\s\S]*?case "idle":/);
    assert.ok(hoverBlock, "hover case missing");
    assert.doesNotMatch(hoverBlock[0], /walking/);
    assert.match(hoverBlock[0], /return baseState/);
  });

  it("formSuccess must not assign playing", () => {
    const block = states.match(/case "formSuccess":[\s\S]*?case "formError":/);
    assert.ok(block);
    assert.doesNotMatch(block[0], /playing/);
    assert.match(block[0], /looking/);
  });

  it("chatActiveSprites must not use guiding/guarding", () => {
    const start = states.indexOf("export function chatActiveSprites");
    assert.ok(start >= 0);
    const block = states.slice(start, start + 450);
    assert.doesNotMatch(block, /guiding|guarding/);
    assert.match(block, /looking/);
  });

  it("nextAmbientSprites must not schedule walking", () => {
    const start = states.indexOf("export function nextAmbientSprites");
    assert.ok(start >= 0);
    const block = states.slice(start, start + 350);
    assert.doesNotMatch(block, /walking/);
  });

  it("controller must not start walk/ambient/meet autonomy loops", () => {
    assert.doesNotMatch(controller, /nextChicoWalkFrame|shouldLoopChicoWalk/);
    assert.doesNotMatch(controller, /nextAmbientSprites|meetSprites|playSprites/);
    assert.doesNotMatch(controller, /scheduleMicro|runMajorPatrol|scheduleMeet/);
    assert.doesNotMatch(controller, /gsap/);
  });

  it("controller keeps long-idle session timer", () => {
    assert.match(controller, /USER_ACTIVITY_TIMEOUT_MS/);
    assert.match(controller, /restingChicoSprite/);
  });
});
