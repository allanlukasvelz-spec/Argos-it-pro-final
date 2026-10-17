import fs from "fs";
import path from "path";
import { expect, type APIRequestContext } from "@playwright/test";
import { BACKEND, e2eAuthHeaders } from "./e2eEnv";
import { promoteEmailToAdmin } from "./promoteNocAdmin";

const ARTIFACT_DIR = path.join("docs", "architecture", "phase8-validation-artifacts");

export function loadPhase81Fixtures() {
  const glob = fs
    .readdirSync(ARTIFACT_DIR)
    .filter((f) => f.startsWith("phase81-results-") && f.endsWith(".json"))
    .sort();
  const latest = glob[glob.length - 1];
  if (!latest) {
    throw new Error("Missing phase81 fixtures JSON under docs/architecture/phase8-validation-artifacts");
  }
  return JSON.parse(fs.readFileSync(path.join(ARTIFACT_DIR, latest), "utf8")).fixtures as {
    emails: { userA: string; noc: string };
  };
}

/** Fresh CI DB has no phase81 harness users; register fixture emails before UI login. */
export async function ensurePhase81FixtureUsers(
  request: APIRequestContext,
  password: string
): Promise<void> {
  if (!process.env.CI) return;

  const fx = loadPhase81Fixtures();
  for (const [email, name] of [
    [fx.emails.userA, "Phase81 Client"],
    [fx.emails.noc, "Phase81 NOC"]
  ] as const) {
    const reg = await request.post(`${BACKEND}/api/auth/register`, {
      data: { email, password, name, company: "Phase81 Corp" },
      headers: e2eAuthHeaders()
    });
    expect([201, 409]).toContain(reg.status());
  }
  promoteEmailToAdmin(fx.emails.noc);
}
