const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

if (process.env.ARGOS_RATE_LIMIT_PROBE === "1") {
  probe()
    .then((payload) => process.stdout.write(JSON.stringify(payload)))
    .catch((error) => {
      process.stderr.write(error && error.stack ? error.stack : String(error));
      process.exit(1);
    });
} else {
  describe("auth rate limit on express-rate-limit 7.5.1", () => {
    it("does not pass a validation key this version rejects", () => {
      const source = fs.readFileSync(path.join(__dirname, "security.js"), "utf8");
      assert.match(source, /AUTH_RATE_LIMIT_MAX \|\| 8\)/);
      assert.match(source, /keyGenerator: authRateLimitKey/);
      assert.doesNotMatch(source, /keyGeneratorIpFallback/);
      assert.doesNotMatch(source, /validate:\s*false/);
    });

    it("starts, limits the same client and keeps another client separate", () => {
      const result = spawnSync(process.execPath, [__filename], {
        env: {
          ...process.env,
          ARGOS_RATE_LIMIT_PROBE: "1",
          AUTH_RATE_LIMIT_MAX: "1",
          NODE_ENV: "test"
        },
        encoding: "utf8"
      });
      assert.equal(result.status, 0, result.stderr);
      assert.doesNotMatch(result.stderr, /ERR_ERL_UNKNOWN_VALIDATION/);
      assert.doesNotMatch(result.stderr, /ValidationError/);
      const payload = JSON.parse(result.stdout);
      assert.deepEqual(payload.statuses, [200, 429, 200]);
    });
  });
}

async function probe() {
  const express = require("express");
  const { authLimiter } = require("./security");
  const app = express();
  app.set("trust proxy", 1);
  app.get("/auth", authLimiter, (_req, res) => res.status(200).end());
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const port = server.address().port;
  async function hit(forwardedFor) {
    const response = await fetch(`http://127.0.0.1:${port}/auth`, {
      headers: { "x-forwarded-for": forwardedFor }
    });
    return response.status;
  }
  try {
    const statuses = [
      await hit("203.0.113.10"),
      await hit("203.0.113.10"),
      await hit("203.0.113.11")
    ];
    process.stdout.write("");
    return { statuses };
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}
