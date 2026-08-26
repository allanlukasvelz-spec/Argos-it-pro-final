import { test, expect, type Page, type APIRequestContext } from "@playwright/test";
import { createRequire } from "node:module";
import path from "node:path";
import { resetAuthRateLimits } from "./helpers/resetRateLimits";
import { BACKEND, ORIGIN, e2eAuthHeaders } from "./helpers/e2eEnv";

const require = createRequire(path.join(process.cwd(), "backend/package.json"));
const { Client } = require("pg");
const bcrypt = require("bcrypt");
require("dotenv").config({ path: path.join(process.cwd(), "backend/.env") });

const PASSWORD = "E2ePhase7Agents2026!x";

test.beforeAll(() => {
  if (process.env.E2E_STAGING === "1") {
    test.skip(
      true,
      "Phase 7 agent E2E needs direct local DATABASE_URL; staging Postgres is private-network only"
    );
  }
});

async function assertLocalDb() {
  const u = process.env.DATABASE_URL || "";
  if (!/127\.0\.0\.1|localhost/.test(u)) {
    throw new Error("E2E Phase 7 refuses non-local DATABASE_URL");
  }
  return u;
}

async function seedAdminAndTopology() {
  const dbUrl = await assertLocalDb();
  const ts = Date.now();
  const adminEmail = `e2e-p7-admin-${ts}@example.test`;
  const clientEmail = `e2e-p7-client-${ts}@example.test`;
  const hash = await bcrypt.hash(PASSWORD, 10);
  const pg = new Client({ connectionString: dbUrl });
  await pg.connect();
  try {
    const admin = await pg.query(
      `INSERT INTO users (email, password, name, company, role, client_verified)
       VALUES ($1,$2,'E2E P7 Admin','ORG-PHASE7-E2E','admin',true) RETURNING id`,
      [adminEmail, hash]
    );
    const client = await pg.query(
      `INSERT INTO users (email, password, name, company, role, client_verified)
       VALUES ($1,$2,'E2E P7 Client','ORG-PHASE7-E2E','cliente',true) RETURNING id`,
      [clientEmail, hash]
    );
    const org = await pg.query(
      `INSERT INTO organizations (slug, name, status)
       VALUES ($1,'ORG-PHASE7-E2E','active') RETURNING id`,
      [`org-phase7-e2e-${ts}`]
    );
    const orgId = org.rows[0].id as number;
    await pg.query(
      `INSERT INTO organization_members (organization_id, user_id, org_role)
       VALUES ($1,$2,'org_owner'), ($1,$3,'org_member')
       ON CONFLICT DO NOTHING`,
      [orgId, admin.rows[0].id, client.rows[0].id]
    );
    const asset = await pg.query(
      `INSERT INTO assets (organization_id, type, hostname, status, name)
       VALUES ($1,'SERVER','asset-phase7-e2e.local','active','ASSET-PHASE7-E2E')
       RETURNING id`,
      [orgId]
    );
    return {
      adminEmail,
      clientEmail,
      orgId,
      assetId: asset.rows[0].id as number
    };
  } finally {
    await pg.end();
  }
}

async function loginUi(page: Page, email: string) {
  await page.goto("/auth/login");
  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(PASSWORD);
  await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/api/auth/login") && r.request().method() === "POST"
    ),
    page.getByRole("button", { name: /Iniciar sesion/i }).click()
  ]);
}

async function loginApi(request: APIRequestContext, email: string) {
  const res = await request.post(`${BACKEND}/api/auth/login`, {
    data: { email, password: PASSWORD },
    headers: { Origin: ORIGIN }
  });
  expect(res.status(), `login ${email}`).toBe(200);
  return res;
}

test.describe("Phase 7 agents lifecycle (local)", () => {
  test.beforeEach(async () => {
    await resetAuthRateLimits();
  });

  test("enrollment → heartbeat → NOC visible → guardian → revoke", async ({
    page,
    request
  }) => {
    const topo = await seedAdminAndTopology();

    await loginApi(request, topo.adminEmail);

    const enroll = await request.post(`${BACKEND}/api/noc/agents/enrollments`, {
      data: { organizationId: topo.orgId, assetId: topo.assetId },
      headers: { Origin: ORIGIN }
    });
    expect(enroll.status()).toBe(201);
    const enrollBody = await enroll.json();
    expect(enrollBody.token).toBeTruthy();
    expect(enrollBody.expiresAt).toBeTruthy();

    const agentEnroll = await request.post(`${BACKEND}/api/agent/v1/enroll`, {
      data: {
        token: enrollBody.token,
        name: "e2e-ref-agent",
        agentVersion: "0.0.1-e2e"
      },
      headers: { Origin: ORIGIN }
    });
    expect(agentEnroll.status()).toBe(201);
    const agentBody = await agentEnroll.json();
    expect(agentBody.agentId).toBeTruthy();
    expect(agentBody.credential).toBeTruthy();

    const hb = await request.post(`${BACKEND}/api/agent/v1/heartbeat`, {
      data: { seq: 1, status: "ONLINE" },
      headers: {
        Authorization: `Bearer ${agentBody.credential}`,
        Origin: ORIGIN
      }
    });
    expect(hb.status()).toBe(200);

    await loginUi(page, topo.adminEmail);
    await page.goto("/noc/agents");
    await expect(page.getByRole("heading", { name: /Agents/i })).toBeVisible({
      timeout: 15_000
    });
    await expect(page.getByText("ONLINE").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Crear enrollment|Enrollment/i).first()).toBeVisible();

    await resetAuthRateLimits();
    await page.context().clearCookies();
    await loginUi(page, topo.clientEmail);
    await page.goto("/dashboard");
    await expect(page.locator("[data-chico-state]").first()).toBeVisible({
      timeout: 15_000
    });
    const chicoState = await page.locator("[data-chico-state]").first().getAttribute("data-chico-state");
    expect(["UNKNOWN", "ATTENTION", "NORMAL", "CRITICAL", "VERIFYING", "RESOLVED"]).toContain(
      chicoState
    );
    // ONLINE agent alone must not imply HEALTHY presentation without evidence
    if (chicoState === "UNKNOWN") {
      await expect(page.getByText(/evidencia reciente|Sin monitors|no dispon/i).first()).toBeVisible();
    }

    await resetAuthRateLimits();
    await page.context().clearCookies();
    await loginUi(page, topo.adminEmail);
    const revoke = await request.post(
      `${BACKEND}/api/noc/agents/${agentBody.agentId}/revoke`,
      { headers: { Origin: ORIGIN } }
    );
    expect(revoke.status()).toBe(200);

    const hbAfter = await request.post(`${BACKEND}/api/agent/v1/heartbeat`, {
      data: { seq: 2, status: "ONLINE" },
      headers: {
        Authorization: `Bearer ${agentBody.credential}`,
        Origin: ORIGIN
      }
    });
    expect([401, 403]).toContain(hbAfter.status());

    await page.goto("/noc/agents");
    await expect(page.getByText("REVOKED").first()).toBeVisible({ timeout: 10_000 });
  });
});
