/**
 * Staging harness client — provisions synthetic admin via token-gated API.
 * Never uses hardcoded production credentials. Login still goes through /api/auth/login.
 */
import { BACKEND, isStagingE2e } from "./e2eEnv";

export type StagingHarnessProvision = {
  admin: { email: string; password: string; role: string };
  client: { email: string; password: string; role: string };
  organizationId: number;
  assetId: number;
};

function harnessToken(): string {
  const t = String(process.env.ARGOS_STAGING_HARNESS_TOKEN || "").trim();
  if (t.length < 32) {
    throw new Error(
      "ARGOS_STAGING_HARNESS_TOKEN missing or too short for staging harness"
    );
  }
  return t;
}

function harnessHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "X-Argos-Staging-Harness": harnessToken()
  };
}

export async function provisionStagingHarness(): Promise<StagingHarnessProvision> {
  if (!isStagingE2e) {
    throw new Error("provisionStagingHarness only for E2E_STAGING=1");
  }
  const res = await fetch(`${BACKEND}/api/staging-harness/provision`, {
    method: "POST",
    headers: harnessHeaders(),
    body: "{}"
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`staging harness provision ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as StagingHarnessProvision & { ok?: boolean };
  if (!data?.admin?.email || !data?.admin?.password) {
    throw new Error("staging harness returned incomplete admin fixture");
  }
  return data;
}

export async function ageStagingAgent(agentId: number, ageMs: number): Promise<void> {
  const res = await fetch(`${BACKEND}/api/staging-harness/age-agent`, {
    method: "POST",
    headers: harnessHeaders(),
    body: JSON.stringify({ agentId, ageMs })
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`age-agent ${res.status}: ${body.slice(0, 200)}`);
  }
}

export async function provisionOrgAdminFixture(): Promise<{
  email: string;
  password: string;
  organizationId: number;
}> {
  const res = await fetch(`${BACKEND}/api/staging-harness/provision-org-admin`, {
    method: "POST",
    headers: harnessHeaders(),
    body: "{}"
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`provision-org-admin ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    user: { email: string; password: string };
    organizationId: number;
  };
  return {
    email: data.user.email,
    password: data.user.password,
    organizationId: data.organizationId
  };
}

export async function assertStagingHarnessDeniedWithoutToken(): Promise<void> {
  const res = await fetch(`${BACKEND}/api/staging-harness/health`);
  if (res.status !== 404) {
    throw new Error(`expected harness deny 404 without token, got ${res.status}`);
  }
}
