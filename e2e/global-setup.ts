/**
 * Playwright global setup — reset auth rate-limit counters before E2E when available.
 * Staging intentionally omits the endpoint; soft-skip (see E2E_STAGING=1).
 * Loads ARGOS_STAGING_HARNESS_TOKEN from docker/.env.staging when unset.
 */
import fs from "fs";
import path from "path";

function loadStagingEnvFile() {
  const envPath = path.join(process.cwd(), "docker", ".env.staging");
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined || process.env[key] === "") {
      process.env[key] = val;
    }
  }
}

async function globalSetup() {
  if (process.env.E2E_STAGING === "1") {
    loadStagingEnvFile();
  }

  const backend = process.env.E2E_BACKEND_URL || "http://127.0.0.1:4000";
  const origin = process.env.E2E_ORIGIN || "http://127.0.0.1:3000";
  try {
    const res = await fetch(`${backend}/api/test/reset-rate-limits`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: origin }
    });
    if (res.status === 404) {
      console.warn(
        "[e2e] rate-limit reset unavailable (staging fail-closed or flag unset)"
      );
      return;
    }
    if (!res.ok) {
      console.warn(`[e2e] rate-limit reset HTTP ${res.status}`);
      return;
    }
    const body = await res.json();
    console.log("[e2e] rate-limit stores reset:", body.storesReset);
  } catch (err) {
    console.warn("[e2e] rate-limit reset skipped:", (err as Error).message);
  }
}

export default globalSetup;
