/**
 * Prove staging harness fail-closed + org_admin NEVER gets NOC.
 */
import { test, expect } from "@playwright/test";
import { BACKEND, isStagingE2e, e2eAuthHeaders } from "./helpers/e2eEnv";
import {
  assertStagingHarnessDeniedWithoutToken,
  provisionOrgAdminFixture,
  provisionStagingHarness
} from "./helpers/stagingHarness";

test.describe("Staging harness security", () => {
  test.skip(!isStagingE2e, "Only against staging Compose (E2E_STAGING=1)");

  test("harness denied without token; /api/test absent; org_admin NOC denied", async ({
    request
  }) => {
    await assertStagingHarnessDeniedWithoutToken();

    const testSurface = await request.post(`${BACKEND}/api/test/reset-rate-limits`, {
      headers: e2eAuthHeaders()
    });
    expect(testSurface.status(), "test surface must be absent on staging").toBe(404);

    const wrong = await request.get(`${BACKEND}/api/staging-harness/health`, {
      headers: {
        "X-Argos-Staging-Harness": "x".repeat(40)
      }
    });
    expect(wrong.status()).toBe(404);

    const orgAdm = await provisionOrgAdminFixture();
    const login = await request.post(`${BACKEND}/api/auth/login`, {
      data: { email: orgAdm.email, password: orgAdm.password },
      headers: e2eAuthHeaders()
    });
    expect(login.status()).toBe(200);

    const nocMe = await request.get(`${BACKEND}/api/noc/me`, {
      headers: e2eAuthHeaders()
    });
    expect(nocMe.status(), "org_admin must not access NOC").toBe(403);

    // Sanity: real admin still works via harness + requireNocAccess
    const adminFx = await provisionStagingHarness();
    const adminLogin = await request.post(`${BACKEND}/api/auth/login`, {
      data: { email: adminFx.admin.email, password: adminFx.admin.password },
      headers: e2eAuthHeaders()
    });
    expect(adminLogin.status()).toBe(200);
    const adminNoc = await request.get(`${BACKEND}/api/noc/me`, {
      headers: e2eAuthHeaders()
    });
    expect(adminNoc.status()).toBe(200);
    const me = await adminNoc.json();
    expect(me.allowed).toBe(true);
    expect(["admin", "super_admin"]).toContain(me.role);
  });
});
