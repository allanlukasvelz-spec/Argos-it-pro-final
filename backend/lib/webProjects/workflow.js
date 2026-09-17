const { WORKFLOW_STATUSES, ERROR_CODES } = require("./constants");
const { WebProjectError } = require("./errors");

const TRANSITIONS = Object.freeze({
  INTAKE: ["REVIEW"],
  REVIEW: ["INTAKE", "ARCHITECTURE"],
  ARCHITECTURE: ["REVIEW", "MOCKUP"],
  MOCKUP: ["ARCHITECTURE", "DEVELOPMENT"],
  DEVELOPMENT: ["MOCKUP", "VALIDATION"],
  VALIDATION: ["DEVELOPMENT", "PUBLICATION"],
  PUBLICATION: ["VALIDATION", "DEVELOPMENT", "COMPLETED"],
  COMPLETED: []
});

function assertWorkflowStatus(status) {
  if (!WORKFLOW_STATUSES.includes(status)) {
    throw new WebProjectError(400, ERROR_CODES.VALIDATION_ERROR, "Estado de workflow no válido");
  }
}

function canTransition(from, to) {
  assertWorkflowStatus(from);
  assertWorkflowStatus(to);
  return (TRANSITIONS[from] || []).includes(to);
}

function assertTransition(from, to) {
  if (!canTransition(from, to)) {
    throw new WebProjectError(
      409,
      ERROR_CODES.INVALID_TRANSITION,
      `Transición no permitida: ${from} → ${to}`
    );
  }
}

function rewindStatusForCorrection(from) {
  if (from === "VALIDATION" || from === "PUBLICATION") return "DEVELOPMENT";
  return null;
}

module.exports = {
  TRANSITIONS,
  canTransition,
  assertTransition,
  assertWorkflowStatus,
  rewindStatusForCorrection
};
