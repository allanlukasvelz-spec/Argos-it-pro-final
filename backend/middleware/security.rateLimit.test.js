const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const secretKeys = [
  "SMTP_PASSWORD",
  "SMTP_USER",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_SECURE",
  "EMAIL_FROM",
  "ARGOS_EMAIL_TRANSPORT",
  "CONTACT_EMAIL_TO",
  "CONTACT_FORM_ENDPOINT"
];

function cleanedEnv(extra) {
  const env = { ...process.env, ...extra };
  for (const key of secretKeys) delete env[key];
  delete env.NODE_OPTIONS;
  return env;
}

if (process.env.ARGOS_RATE_LIMIT_PROBE === "1") {
  probe()
    .then((payload) => {
      process.stdout.write(JSON.stringify(payload));
    })
    .catch((error) => {
      process.stderr.write(error && error.stack ? error.stack : String(error));
      process.exit(1);
    });
} else {
  describe("auth rate limit", () => {
    it("keeps the approved default of 8", () => {
      const source = fs.readFileSync(path.join(__dirname, "security.js"), "utf8");
      assert.match(source, /AUTH_RATE_LIMIT_MAX \|\| 8\)/);
      assert.doesNotMatch(source, /keyGeneratorIpFallback/);
    });

    it("warns nothing, returns 429, and separates proxy and staging clients", () => {
      const result = spawnSync(process.execPath, [__filename], {
        env: cleanedEnv({
          ARGOS_RATE_LIMIT_PROBE: "1",
          AUTH_RATE_LIMIT_MAX: "1",
          NODE_ENV: "test"
        }),
        encoding: "utf8"
      });
      assert.equal(result.status, 0, result.stderr);
      assert.doesNotMatch(result.stderr, /ERR_ERL_UNKNOWN_VALIDATION/);
      const payload = JSON.parse(result.stdout);
      assert.equal(payload.warning, false);
      assert.deepEqual(payload.statuses, [200, 429, 200, 429, 200, 200, 429]);
    });
  });
}

async function hit(base, headers) {
  const response = await fetch(base, { headers });
  return response.status;
}

async function probe() {
  const errors = [];
  const original = console.error;
  console.error = (...args) => {
    errors.push(args.map((item) => String(item)).join(" "));
  };
  const express = require("express");
  const { authLimiter } = require("./security");
  console.error = original;

  const app = express();
  app.set("trust proxy", 1);
  app.get("/auth", authLimiter, (_req, res) => res.status(200).end());
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/auth`;
  const statuses = [];
  try {
    process.env.ARGOS_ENVIRONMENT = "production";
    statuses.push(await hit(base, { "x-forwarded-for": "203.0.113.10" }));
    statuses.push(await hit(base, { "x-forwarded-for": "203.0.113.10" }));
    statuses.push(await hit(base, {
      "x-forwarded-for": "203.0.113.11",
      "x-argos-staging-e2e-fwd": "203.0.113.50"
    }));
    statuses.push(await hit(base, { "x-forwarded-for": "203.0.113.11" }));
    process.env.ARGOS_ENVIRONMENT = "staging";
    statuses.push(await hit(base, {
      "x-forwarded-for": "198.51.100.8",
      "x-argos-staging-e2e-fwd": "203.0.113.20"
    }));
    statuses.push(await hit(base, {
      "x-forwarded-for": "198.51.100.8",
      "x-argos-staging-e2e-fwd": "203.0.113.21"
    }));
    statuses.push(await hit(base, {
      "x-forwarded-for": "198.51.100.8",
      "x-argos-staging-e2e-fwd": "203.0.113.20"
    }));
  } finally {
    server.close();
  }
  return {
    warning: errors.some((line) => line.includes("ERR_ERL_UNKNOWN_VALIDATION")),
    statuses
  };
}
