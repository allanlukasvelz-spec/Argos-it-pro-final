/**
 * Allowlisted remediation actions.
 * No dynamic import from user input. No arbitrary shell/SQL/HTTP mutation.
 */

const { LEVEL_RANK } = require("./constants");

/** @typedef {{ type: string, safetyLevel: string, description: string, validateInput: Function, preconditions: Function, dryRun: Function, execute: Function, verify: Function, rollback: Function|null, timeoutMs: number, requiresApproval?: boolean, mutatesCustomer?: boolean }} ActionDef */

function rejectL4() {
  const err = new Error("L4 actions are never executable by the remediation engine");
  err.code = "L4_FORBIDDEN";
  throw err;
}

function baseValidate(input) {
  if (input == null || typeof input !== "object" || Array.isArray(input)) {
    const err = new Error("input must be an object");
    err.code = "INVALID_INPUT";
    throw err;
  }
  if (Object.keys(input).length > 40) {
    const err = new Error("input too large");
    err.code = "INVALID_INPUT";
    throw err;
  }
  // Reject command injection shapes
  for (const [k, v] of Object.entries(input)) {
    if (typeof v === "string" && /[;|&`$]/.test(v) && /(sh|bash|cmd|powershell|exec)/i.test(v)) {
      const err = new Error("Rejected dangerous input pattern");
      err.code = "INVALID_INPUT";
      throw err;
    }
    if (k === "command" || k === "shell" || k === "sql" || k === "path") {
      const err = new Error(`Forbidden input key: ${k}`);
      err.code = "INVALID_INPUT";
      throw err;
    }
  }
}

const ACTIONS = {
  HTTP_RECHECK: {
    type: "HTTP_RECHECK",
    safetyLevel: "L0",
    description: "Re-run HTTP probe via ARGOS monitor runner (control-plane observation only).",
    timeoutMs: 15000,
    mutatesCustomer: false,
    validateInput(input) {
      baseValidate(input);
      if (input.monitorId != null && !Number.isInteger(Number(input.monitorId))) {
        const err = new Error("monitorId must be integer");
        err.code = "INVALID_INPUT";
        throw err;
      }
    },
    async preconditions(ctx) {
      return require("./actions/recheck").preconditionsHttp(ctx);
    },
    async dryRun(ctx) {
      return require("./actions/recheck").dryRunHttp(ctx);
    },
    async execute(ctx) {
      return require("./actions/recheck").executeHttp(ctx);
    },
    async verify(ctx, result) {
      return require("./actions/recheck").verifyRecheck(ctx, result);
    },
    rollback: null
  },

  TLS_RECHECK: {
    type: "TLS_RECHECK",
    safetyLevel: "L0",
    description: "Re-run TLS observation via ARGOS monitor runner.",
    timeoutMs: 15000,
    mutatesCustomer: false,
    validateInput(input) {
      baseValidate(input);
    },
    async preconditions(ctx) {
      return require("./actions/recheck").preconditionsTls(ctx);
    },
    async dryRun(ctx) {
      return require("./actions/recheck").dryRunTls(ctx);
    },
    async execute(ctx) {
      return require("./actions/recheck").executeTls(ctx);
    },
    async verify(ctx, result) {
      return require("./actions/recheck").verifyRecheck(ctx, result);
    },
    rollback: null
  },

  DNS_RECHECK: {
    type: "DNS_RECHECK",
    safetyLevel: "L0",
    description: "Re-run DNS observation via ARGOS monitor runner.",
    timeoutMs: 15000,
    mutatesCustomer: false,
    validateInput(input) {
      baseValidate(input);
    },
    async preconditions(ctx) {
      return require("./actions/recheck").preconditionsDns(ctx);
    },
    async dryRun(ctx) {
      return require("./actions/recheck").dryRunDns(ctx);
    },
    async execute(ctx) {
      return require("./actions/recheck").executeDns(ctx);
    },
    async verify(ctx, result) {
      return require("./actions/recheck").verifyRecheck(ctx, result);
    },
    rollback: null
  },

  MONITOR_RECHECK: {
    type: "MONITOR_RECHECK",
    safetyLevel: "L0",
    description: "Re-run a specific monitor by id (HTTP/TLS/DNS).",
    timeoutMs: 15000,
    mutatesCustomer: false,
    validateInput(input) {
      baseValidate(input);
      if (!Number.isInteger(Number(input.monitorId))) {
        const err = new Error("monitorId required");
        err.code = "INVALID_INPUT";
        throw err;
      }
    },
    async preconditions(ctx) {
      return require("./actions/recheck").preconditionsMonitor(ctx);
    },
    async dryRun(ctx) {
      return require("./actions/recheck").dryRunMonitor(ctx);
    },
    async execute(ctx) {
      return require("./actions/recheck").executeMonitor(ctx);
    },
    async verify(ctx, result) {
      return require("./actions/recheck").verifyRecheck(ctx, result);
    },
    rollback: null
  },

  HEALTH_REEVALUATE: {
    type: "HEALTH_REEVALUATE",
    safetyLevel: "L1",
    description: "Recompute asset/org health from existing observations (no customer mutation).",
    timeoutMs: 10000,
    mutatesCustomer: false,
    validateInput(input) {
      baseValidate(input);
    },
    async preconditions(ctx) {
      return require("./actions/health").preconditions(ctx);
    },
    async dryRun(ctx) {
      return require("./actions/health").dryRun(ctx);
    },
    async execute(ctx) {
      return require("./actions/health").execute(ctx);
    },
    async verify(ctx, result) {
      return require("./actions/health").verify(ctx, result);
    },
    rollback: null
  },

  INCIDENT_EVIDENCE_REFRESH: {
    type: "INCIDENT_EVIDENCE_REFRESH",
    safetyLevel: "L1",
    description: "Append sanitized evidence snapshot to incident events (control-plane only).",
    timeoutMs: 5000,
    mutatesCustomer: false,
    validateInput(input) {
      baseValidate(input);
    },
    async preconditions(ctx) {
      return require("./actions/evidence").preconditions(ctx);
    },
    async dryRun(ctx) {
      return require("./actions/evidence").dryRun(ctx);
    },
    async execute(ctx) {
      return require("./actions/evidence").execute(ctx);
    },
    async verify(ctx, result) {
      return require("./actions/evidence").verify(ctx, result);
    },
    rollback: null
  },

  TEST_SET_FLAG: {
    type: "TEST_SET_FLAG",
    safetyLevel: "L2",
    description: "Simulator: set remediation_test_flags value (reversible).",
    timeoutMs: 5000,
    mutatesCustomer: false,
    validateInput(input) {
      baseValidate(input);
      if (!input.flagKey || typeof input.flagKey !== "string" || input.flagKey.length > 64) {
        const err = new Error("flagKey required (≤64)");
        err.code = "INVALID_INPUT";
        throw err;
      }
      if (typeof input.flagValue !== "string" || input.flagValue.length > 256) {
        const err = new Error("flagValue string required (≤256)");
        err.code = "INVALID_INPUT";
        throw err;
      }
    },
    async preconditions(ctx) {
      return require("./actions/simulator").preconditions(ctx);
    },
    async dryRun(ctx) {
      return require("./actions/simulator").dryRunSet(ctx);
    },
    async execute(ctx) {
      return require("./actions/simulator").executeSet(ctx);
    },
    async verify(ctx, result) {
      return require("./actions/simulator").verifySet(ctx, result);
    },
    async rollback(ctx) {
      return require("./actions/simulator").rollbackSet(ctx);
    }
  },

  TEST_INCREMENT_VERSION: {
    type: "TEST_INCREMENT_VERSION",
    safetyLevel: "L2",
    description: "Simulator: increment version on test flag (reversible).",
    timeoutMs: 5000,
    mutatesCustomer: false,
    validateInput(input) {
      baseValidate(input);
      if (!input.flagKey || typeof input.flagKey !== "string") {
        const err = new Error("flagKey required");
        err.code = "INVALID_INPUT";
        throw err;
      }
    },
    async preconditions(ctx) {
      return require("./actions/simulator").preconditions(ctx);
    },
    async dryRun(ctx) {
      return require("./actions/simulator").dryRunIncrement(ctx);
    },
    async execute(ctx) {
      return require("./actions/simulator").executeIncrement(ctx);
    },
    async verify(ctx, result) {
      return require("./actions/simulator").verifyIncrement(ctx, result);
    },
    async rollback(ctx) {
      return require("./actions/simulator").rollbackIncrement(ctx);
    }
  },

  TEST_RESTORE_VERSION: {
    type: "TEST_RESTORE_VERSION",
    safetyLevel: "L2",
    description: "Simulator: restore prior version snapshot.",
    timeoutMs: 5000,
    mutatesCustomer: false,
    validateInput(input) {
      baseValidate(input);
      if (!input.flagKey || typeof input.flagKey !== "string") {
        const err = new Error("flagKey required");
        err.code = "INVALID_INPUT";
        throw err;
      }
    },
    async preconditions(ctx) {
      return require("./actions/simulator").preconditions(ctx);
    },
    async dryRun(ctx) {
      return require("./actions/simulator").dryRunRestore(ctx);
    },
    async execute(ctx) {
      return require("./actions/simulator").executeRestore(ctx);
    },
    async verify(ctx, result) {
      return require("./actions/simulator").verifyRestore(ctx, result);
    },
    async rollback(ctx) {
      return require("./actions/simulator").rollbackRestore(ctx);
    }
  },

  /** L3 gate demo — still only mutates simulator table; requires approval */
  TEST_L3_SET_FLAG: {
    type: "TEST_L3_SET_FLAG",
    safetyLevel: "L3",
    description: "Simulator L3: same as TEST_SET_FLAG but requires human approval.",
    timeoutMs: 5000,
    mutatesCustomer: false,
    requiresApproval: true,
    validateInput(input) {
      baseValidate(input);
      if (!input.flagKey || typeof input.flagKey !== "string" || input.flagKey.length > 64) {
        const err = new Error("flagKey required (≤64)");
        err.code = "INVALID_INPUT";
        throw err;
      }
      if (typeof input.flagValue !== "string" || input.flagValue.length > 256) {
        const err = new Error("flagValue string required (≤256)");
        err.code = "INVALID_INPUT";
        throw err;
      }
    },
    async preconditions(ctx) {
      return require("./actions/simulator").preconditions(ctx);
    },
    async dryRun(ctx) {
      const d = await require("./actions/simulator").dryRunSet(ctx);
      if (d.ok && d.plan) {
        d.plan.action = "TEST_L3_SET_FLAG";
        d.plan.risk_level = "L3";
        d.plan.approval_required = true;
      }
      return d;
    },
    async execute(ctx) {
      return require("./actions/simulator").executeSet(ctx);
    },
    async verify(ctx, result) {
      return require("./actions/simulator").verifySet(ctx, result);
    },
    async rollback(ctx) {
      return require("./actions/simulator").rollbackSet(ctx);
    }
  },

  // Explicit L4 denials (never executable)
  DROP_DATABASE: {
    type: "DROP_DATABASE",
    safetyLevel: "L4",
    description: "PROHIBITED",
    timeoutMs: 0,
    mutatesCustomer: true,
    validateInput: rejectL4,
    preconditions: rejectL4,
    dryRun: rejectL4,
    execute: rejectL4,
    verify: rejectL4,
    rollback: null
  },
  ARBITRARY_SHELL: {
    type: "ARBITRARY_SHELL",
    safetyLevel: "L4",
    description: "PROHIBITED",
    timeoutMs: 0,
    mutatesCustomer: true,
    validateInput: rejectL4,
    preconditions: rejectL4,
    dryRun: rejectL4,
    execute: rejectL4,
    verify: rejectL4,
    rollback: null
  }
};

function getAction(type) {
  const t = String(type || "").toUpperCase();
  const action = ACTIONS[t];
  if (!action) {
    const err = new Error(`Unknown action type: ${type}`);
    err.code = "UNKNOWN_ACTION";
    throw err;
  }
  if (action.safetyLevel === "L4" || LEVEL_RANK[action.safetyLevel] >= 4) {
    const err = new Error(`Action ${t} is L4 and never executable`);
    err.code = "L4_FORBIDDEN";
    throw err;
  }
  return action;
}

function listActions() {
  return Object.values(ACTIONS)
    .filter((a) => a.safetyLevel !== "L4")
    .map((a) => ({
      type: a.type,
      safetyLevel: a.safetyLevel,
      description: a.description,
      timeoutMs: a.timeoutMs,
      mutatesCustomer: a.mutatesCustomer,
      hasRollback: typeof a.rollback === "function"
    }));
}

function isRegistered(type) {
  return Object.prototype.hasOwnProperty.call(ACTIONS, String(type || "").toUpperCase());
}

module.exports = {
  ACTIONS,
  getAction,
  listActions,
  isRegistered,
  baseValidate
};
