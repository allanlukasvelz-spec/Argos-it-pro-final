/**
 * FASE 21.7A.1 — fake-timer coverage for the one-shot idle timeout.
 * Run: node --experimental-strip-types --test frontend/ai/mascotIdleTimer.test.ts
 */
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { createMascotIdleTimer } from "./mascotIdleTimer.ts";

const TIMEOUT_MS = 30_000;

function makeTimer() {
  const calls = { active: 0, resting: 0 };
  const timer = createMascotIdleTimer({
    timeoutMs: TIMEOUT_MS,
    onActive: () => {
      calls.active += 1;
    },
    onResting: () => {
      calls.resting += 1;
    }
  });
  return { timer, calls };
}

describe("21.7A.1 mascot idle timeout", () => {
  beforeEach(() => {
    mock.timers.enable({ apis: ["setTimeout", "Date"] });
  });

  afterEach(() => {
    mock.timers.reset();
  });

  it("mount: active initially (bump schedules one timeout)", () => {
    const { timer, calls } = makeTimer();
    timer.bumpActivity();
    assert.equal(calls.active, 1);
    assert.equal(calls.resting, 0);
    assert.equal(timer.pendingCount(), 1);
    timer.dispose();
  });

  it("before 30s: remains active", () => {
    const { timer, calls } = makeTimer();
    timer.bumpActivity();
    mock.timers.tick(TIMEOUT_MS - 1);
    assert.equal(calls.resting, 0);
    assert.equal(timer.pendingCount(), 1);
    timer.dispose();
  });

  it("at 30s inactivity: becomes resting", () => {
    const { timer, calls } = makeTimer();
    timer.bumpActivity();
    mock.timers.tick(TIMEOUT_MS);
    assert.equal(calls.resting, 1);
    assert.equal(timer.pendingCount(), 0);
    timer.dispose();
  });

  it("activity at 29s: resets full 30s timer", () => {
    const { timer, calls } = makeTimer();
    timer.bumpActivity();
    mock.timers.tick(29_000);
    timer.bumpActivity();
    assert.equal(calls.active, 2);
    mock.timers.tick(29_000);
    assert.equal(calls.resting, 0);
    mock.timers.tick(1_000);
    assert.equal(calls.resting, 1);
    timer.dispose();
  });

  it("activity while resting: immediate active", () => {
    const { timer, calls } = makeTimer();
    timer.bumpActivity();
    mock.timers.tick(TIMEOUT_MS);
    assert.equal(calls.resting, 1);
    timer.bumpActivity();
    assert.equal(calls.active, 2);
    assert.equal(calls.resting, 1);
    assert.equal(timer.pendingCount(), 1);
    timer.dispose();
  });

  it("repeated activity: only one timeout pending", () => {
    const { timer, calls } = makeTimer();
    timer.bumpActivity();
    timer.bumpActivity();
    timer.bumpActivity();
    assert.equal(timer.pendingCount(), 1);
    mock.timers.tick(TIMEOUT_MS - 1);
    assert.equal(calls.resting, 0);
    mock.timers.tick(1);
    assert.equal(calls.resting, 1);
    timer.dispose();
  });

  it("unmount: timeout cleared", () => {
    const { timer, calls } = makeTimer();
    timer.bumpActivity();
    timer.dispose();
    assert.equal(timer.pendingCount(), 0);
    mock.timers.tick(TIMEOUT_MS * 2);
    assert.equal(calls.resting, 0);
  });

  it("delayed timer callback (>30s elapsed) still gives one resting state only", () => {
    const { timer, calls } = makeTimer();
    timer.bumpActivity();
    mock.timers.tick(45_000);
    assert.equal(calls.resting, 1);
    mock.timers.tick(45_000);
    assert.equal(calls.resting, 1);
    timer.dispose();
  });
});
