/**
 * Phase 6 — remediation constants and state machine.
 */

const SAFETY_LEVELS = Object.freeze(["L0", "L1", "L2", "L3", "L4"]);

const EXECUTION_STATES = Object.freeze([
  "PLANNED",
  "DRY_RUN_COMPLETE",
  "AWAITING_APPROVAL",
  "APPROVED",
  "RUNNING",
  "VERIFYING",
  "SUCCEEDED",
  "FAILED",
  "ROLLING_BACK",
  "ROLLED_BACK",
  "ROLLBACK_FAILED",
  "SAFE_STOPPED",
  "CANCELLED"
]);

/** Allowed transitions: from → Set(to) */
const TRANSITIONS = Object.freeze({
  PLANNED: new Set(["DRY_RUN_COMPLETE", "AWAITING_APPROVAL", "CANCELLED", "SAFE_STOPPED"]),
  DRY_RUN_COMPLETE: new Set([
    "AWAITING_APPROVAL",
    "APPROVED",
    "RUNNING",
    "CANCELLED",
    "SAFE_STOPPED"
  ]),
  AWAITING_APPROVAL: new Set(["APPROVED", "CANCELLED", "SAFE_STOPPED", "DRY_RUN_COMPLETE"]),
  APPROVED: new Set(["RUNNING", "CANCELLED", "SAFE_STOPPED", "AWAITING_APPROVAL"]),
  RUNNING: new Set(["VERIFYING", "FAILED", "SAFE_STOPPED"]),
  VERIFYING: new Set(["SUCCEEDED", "FAILED", "SAFE_STOPPED"]),
  SUCCEEDED: new Set(["ROLLING_BACK"]),
  FAILED: new Set(["ROLLING_BACK", "SAFE_STOPPED", "CANCELLED"]),
  ROLLING_BACK: new Set(["ROLLED_BACK", "ROLLBACK_FAILED", "SAFE_STOPPED"]),
  ROLLED_BACK: new Set(["SAFE_STOPPED"]),
  ROLLBACK_FAILED: new Set(["SAFE_STOPPED"]),
  SAFE_STOPPED: new Set([]),
  CANCELLED: new Set([])
});

const EVENT_KINDS = Object.freeze([
  "RUNBOOK_SELECTED",
  "DRY_RUN",
  "PRECONDITION_FAILED",
  "APPROVAL_REQUESTED",
  "APPROVAL_GRANTED",
  "APPROVAL_DENIED",
  "APPROVAL_EXPIRED",
  "EXECUTION_STARTED",
  "STEP_STARTED",
  "STEP_SUCCEEDED",
  "STEP_FAILED",
  "VERIFICATION_PASS",
  "VERIFICATION_FAIL",
  "ROLLBACK_STARTED",
  "ROLLBACK_RESULT",
  "SAFE_STOP",
  "HUMAN_ESCALATION",
  "STATE_CHANGE",
  "NOTE"
]);

const LEVEL_RANK = Object.freeze({ L0: 0, L1: 1, L2: 2, L3: 3, L4: 4 });

function canTransition(from, to) {
  const allowed = TRANSITIONS[from];
  return Boolean(allowed && allowed.has(to));
}

function assertTransition(from, to) {
  if (!canTransition(from, to)) {
    const err = new Error(`Invalid remediation state transition: ${from} → ${to}`);
    err.code = "INVALID_STATE_TRANSITION";
    throw err;
  }
}

module.exports = {
  SAFETY_LEVELS,
  EXECUTION_STATES,
  TRANSITIONS,
  EVENT_KINDS,
  LEVEL_RANK,
  canTransition,
  assertTransition
};
