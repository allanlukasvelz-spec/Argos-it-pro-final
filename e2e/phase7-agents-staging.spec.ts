/**
 * Phase 7 agents E2E against staging — no host Postgres publish.
 * Uses token-gated /api/staging-harness for synthetic topology only.
 */
import { test, expect, type APIRequestContext } from "@playwright/test";
import { BACKEND, isStagingE2e, e2eAuthHeaders } from "./helpers/e2eEnv";
import {
  ageStagingAgent,
  provisionStagingHarness
} from "./helpers/stagingHarness";
import { gotoE2e } from "./helpers/e2eNav";
import { loginViaUi } from "./helpers/loginUi";

test.describe("Phase 7 agents lifecycle (staging)", () => {
  test.skip(!isStagingE2e, "Only against staging Compose (E2E_STAGING=1)");

  async function loginApi(request: APIRequestContext, email: string, password: string) {
    const res = await request.post(`${BACKEND}/api/auth/login`, {
      data: { email, password },
      headers: e2eAuthHeaders()
    });
    expect(res.status(), `login ${email}`).toBe(200);
    return res;
  }

  test("enroll → heartbeat → observation → ONLINE → STALE → OFFLINE → revoke", async ({
    page,
    request
  }) => {
    const topo = await provisionStagingHarness();
    await loginApi(request, topo.admin.email, topo.admin.password);

    const enroll = await request.post(`${BACKEND}/api/noc/agents/enrollments`, {
      data: { organizationId: topo.organizationId, assetId: topo.assetId },
      headers: e2eAuthHeaders()
    });
    expect(enroll.status()).toBe(201);
    const enrollBody = await enroll.json();
    expect(enrollBody.token).toBeTruthy();

    const agentEnroll = await request.post(`${BACKEND}/api/agent/v1/enroll`, {
      data: {
        token: enrollBody.token,
        name: "stg-e2e-agent",
        agentVersion: "0.0.1-stg"
      },
      headers: e2eAuthHeaders()
    });
    expect(agentEnroll.status()).toBe(201);
    const agentBody = await agentEnroll.json();
    expect(agentBody.agentId).toBeTruthy();
    expect(agentBody.credential).toBeTruthy();
    expect(Number(agentBody.organizationId)).toBe(Number(topo.organizationId));
    expect(Number(agentBody.assetId)).toBe(Number(topo.assetId));

    const replayEnroll = await request.post(`${BACKEND}/api/agent/v1/enroll`, {
      data: { token: enrollBody.token, name: "replay" },
      headers: e2eAuthHeaders()
    });
    expect([401, 400]).toContain(replayEnroll.status());

    const hb = await request.post(`${BACKEND}/api/agent/v1/heartbeat`, {
      data: { seq: 1, status: "ONLINE" },
      headers: {
        Authorization: `Bearer ${agentBody.credential}`,
        ...e2eAuthHeaders()
      }
    });
    expect(hb.status()).toBe(200);

    const hbReplay = await request.post(`${BACKEND}/api/agent/v1/heartbeat`, {
      data: { seq: 1, status: "ONLINE" },
      headers: {
        Authorization: `Bearer ${agentBody.credential}`,
        ...e2eAuthHeaders()
      }
    });
    expect(hbReplay.status()).toBe(409);

    const obs = await request.post(`${BACKEND}/api/agent/v1/observations`, {
      data: {
        observations: [
          {
            type: "CPU",
            idempotencyKey: `cpu-${Date.now()}`,
            observedAt: new Date().toISOString(),
            measurement: { usagePercent: 18 },
            organizationId: topo.organizationId,
            assetId: topo.assetId
          }
        ]
      },
      headers: {
        Authorization: `Bearer ${agentBody.credential}`,
        ...e2eAuthHeaders()
      }
    });
    expect(obs.status()).toBe(200);
    const obsBody = await obs.json();
    expect(obsBody.accepted?.length).toBeGreaterThan(0);

    const spoof = await request.post(`${BACKEND}/api/agent/v1/observations`, {
      data: {
        observations: [
          {
            type: "CPU",
            idempotencyKey: `spoof-${Date.now()}`,
            observedAt: new Date().toISOString(),
            measurement: { usagePercent: 1 },
            organizationId: Number(topo.organizationId) + 99999
          }
        ]
      },
      headers: {
        Authorization: `Bearer ${agentBody.credential}`,
        ...e2eAuthHeaders()
      }
    });
    expect(spoof.status()).toBe(200);
    const spoofBody = await spoof.json();
    expect(spoofBody.rejected?.some((r: { code: string }) => r.code === "TENANT_SPOOF")).toBeTruthy();

    for (const path of ["/api/agent/v1/exec", "/api/agent/v1/shell", "/api/agent/v1/sql"]) {
      const bad = await request.post(`${BACKEND}${path}`, {
        data: {},
        headers: {
          Authorization: `Bearer ${agentBody.credential}`,
          ...e2eAuthHeaders()
        }
      });
      expect(bad.status(), path).toBe(404);
    }

    await loginViaUi(page, topo.admin.email, topo.admin.password);
    await gotoE2e(page, "/noc/agents");
    await expect(page.getByText("ONLINE").first()).toBeVisible({ timeout: 15_000 });

    await ageStagingAgent(agentBody.agentId, 4 * 60 * 1000);
    await gotoE2e(page, "/noc/agents");
    await expect(page.getByText("STALE").first()).toBeVisible({ timeout: 15_000 });

    await ageStagingAgent(agentBody.agentId, 20 * 60 * 1000);
    await gotoE2e(page, "/noc/agents");
    await expect(page.getByText("OFFLINE").first()).toBeVisible({ timeout: 15_000 });

    await page.context().clearCookies();
    await loginViaUi(page, topo.client.email, topo.client.password);
    await gotoE2e(page, "/dashboard");
    await expect(page.locator("[data-chico-state]").first()).toBeVisible({ timeout: 15_000 });
    const chicoState = await page
      .locator("[data-chico-state]")
      .first()
      .getAttribute("data-chico-state");
    expect(["UNKNOWN", "ATTENTION", "NORMAL", "CRITICAL", "VERIFYING", "RESOLVED"]).toContain(
      chicoState
    );
    if (chicoState === "UNKNOWN") {
      await expect(
        page.getByText(/evidencia reciente|Sin monitors|no dispon/i).first()
      ).toBeVisible();
    }

    await page.context().clearCookies();
    await loginApi(request, topo.admin.email, topo.admin.password);
    const revoke = await request.post(
      `${BACKEND}/api/noc/agents/${agentBody.agentId}/revoke`,
      { headers: e2eAuthHeaders() }
    );
    expect(revoke.status()).toBe(200);

    const hbAfter = await request.post(`${BACKEND}/api/agent/v1/heartbeat`, {
      data: { seq: 99, status: "ONLINE" },
      headers: {
        Authorization: `Bearer ${agentBody.credential}`,
        ...e2eAuthHeaders()
      }
    });
    expect([401, 403]).toContain(hbAfter.status());

    await loginViaUi(page, topo.admin.email, topo.admin.password);
    await gotoE2e(page, "/noc/agents");
    await expect(page.getByText("REVOKED").first()).toBeVisible({ timeout: 15_000 });
  });
});
