import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { BACKEND } from "./helpers/e2eEnv";
import { loginViaUi } from "./helpers/loginUi";
import { promoteEmailToAdmin } from "./helpers/promoteNocAdmin";
import { resetAuthRateLimits } from "./helpers/resetRateLimits";
import {
  bootstrapCompletedProject,
  uniqueEmail
} from "./helpers/webProjectCompletedFixture";

const PASSWORD = "E2eSecure2026!x";
const SHOT_DIR = path.join(process.cwd(), "artifacts/phase18-web-projects");

test.beforeEach(async () => {
  try {
    await resetAuthRateLimits();
  } catch {
    /* reuse server */
  }
  mkdirSync(SHOT_DIR, { recursive: true });
});

test.describe("PHASE 18 archival lifecycle", () => {
  test.describe.configure({ mode: "serial", timeout: 900000 });

  test("FLOW A — completed project shows archive action", async ({ page, browser }) => {
    const { nocPage, nocContext } = await bootstrapCompletedProject(page, browser);
    await expect(nocPage.getByRole("button", { name: "Archivar expediente" })).toBeVisible({
      timeout: 15000
    });
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "01-completed-ready-to-archive.png"), fullPage: true });
    await nocContext.close();
  });

  test("FLOW B — non-completed hides archive and API rejects", async ({ page, browser }) => {
    const origin = process.env.E2E_ORIGIN || "http://127.0.0.1:3020";
    const staffEmail = uniqueEmail("staff-intake");
    await page.request.post(`${BACKEND}/api/auth/register`, {
      data: { email: staffEmail, password: PASSWORD, name: "NOC", company: "ARGOS" },
      headers: { Origin: origin, "Content-Type": "application/json" }
    });
    promoteEmailToAdmin(staffEmail);
    const nocContext = await browser.newContext();
    const nocPage = await nocContext.newPage();
    await loginViaUi(nocPage, staffEmail, PASSWORD);
    const orgRes = await nocPage.request.get(`${BACKEND}/api/noc/organizations`, {
      headers: { Origin: origin }
    });
    const organizationId = Number((await orgRes.json()).organizations[0].id);
    const created = await nocPage.request.post(
      `${BACKEND}/api/noc/web-projects?organization_id=${organizationId}`,
      {
        data: { title: "Intake only", projectType: "create" },
        headers: { Origin: origin, "Content-Type": "application/json" }
      }
    );
    const projectId = Number((await created.json()).project.id);
    await nocPage.goto(`${origin}/noc/projects/${projectId}?organization_id=${organizationId}`);
    await expect(nocPage.getByRole("button", { name: "Archivar expediente" })).toHaveCount(0);
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "02-non-completed-no-archive.png"), fullPage: true });
    const blocked = await nocPage.request.post(
      `${BACKEND}/api/noc/web-projects/${projectId}/archive?organization_id=${organizationId}`,
      { data: { reason: "early" }, headers: { Origin: origin, "Content-Type": "application/json" } }
    );
    expect(blocked.status()).toBe(409);
    await nocContext.close();
  });

  test("FLOW C — completed read-only in comments panel", async ({ page, browser }) => {
    const { nocPage, nocContext } = await bootstrapCompletedProject(page, browser);
    await nocPage.locator('a[href="#noc-actividad"]').click();
    await expect(nocPage.getByText(/Finalizado: solo lectura/i)).toBeVisible({
      timeout: 10000
    });
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "03-completed-read-only.png"), fullPage: true });
    await nocContext.close();
  });

  test("FLOW D — archive dialog with optional reason", async ({ page, browser }) => {
    const { nocPage, nocContext } = await bootstrapCompletedProject(page, browser);
    await nocPage.getByRole("button", { name: "Archivar expediente" }).click();
    await nocPage.getByPlaceholder(/cierre operativo/i).fill("Entrega confirmada E2E");
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "04-archive-dialog.png"), fullPage: true });
    await nocPage.getByRole("button", { name: "Confirmar archivo" }).click();
    await expect(nocPage.getByText(/Archivado/i).first()).toBeVisible({ timeout: 15000 });
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "05-archived-project.png"), fullPage: true });
    await nocContext.close();
  });

  test("FLOW E — archived project historical read-only", async ({ page, browser }) => {
    const { nocPage, nocContext, projectId, organizationId, origin } = await bootstrapCompletedProject(
      page,
      browser
    );
    await nocPage.request.post(
      `${BACKEND}/api/noc/web-projects/${projectId}/archive?organization_id=${organizationId}`,
      { data: { reason: "Histórico" }, headers: { Origin: origin, "Content-Type": "application/json" } }
    );
    await nocPage.reload();
    await expect(nocPage.getByRole("button", { name: "Archivar expediente" })).toHaveCount(0);
    await nocPage.locator('a[href="#noc-documentos"]').click();
    await expect(nocPage.getByText(/solo lectura/i).first()).toBeVisible();
    await nocContext.close();
  });

  test("FLOW F — include archived in NOC list", async ({ page, browser }) => {
    const { nocPage, nocContext, projectId, organizationId, origin } = await bootstrapCompletedProject(
      page,
      browser
    );
    await nocPage.request.post(
      `${BACKEND}/api/noc/web-projects/${projectId}/archive?organization_id=${organizationId}`,
      { data: {}, headers: { Origin: origin, "Content-Type": "application/json" } }
    );
    await nocPage.goto(`${origin}/noc/projects?organization_id=${organizationId}`);
    await expect(nocPage.getByText("E2E Archive Project")).toHaveCount(0);
    await nocPage.goto(`${origin}/noc/projects?organization_id=${organizationId}&include_archived=1`);
    await expect(nocPage.getByText("E2E Archive Project")).toBeVisible({ timeout: 15000 });
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "06-include-archived.png"), fullPage: true });
    await nocContext.close();
  });

  test("FLOW G — client direct archived project readable", async ({ page, browser }) => {
    const { nocPage, nocContext, projectId, organizationId, origin, clientEmail } =
      await bootstrapCompletedProject(page, browser);
    await nocPage.request.post(
      `${BACKEND}/api/noc/web-projects/${projectId}/archive?organization_id=${organizationId}`,
      { data: { reason: "Cliente histórico" }, headers: { Origin: origin, "Content-Type": "application/json" } }
    );
    await nocContext.close();
    const clientPage = await browser.newPage();
    await loginViaUi(clientPage, clientEmail, PASSWORD);
    await clientPage.goto(`${origin}/dashboard/proyectos/${projectId}`);
    await expect(clientPage.getByText(/archivado/i).first()).toBeVisible({ timeout: 20000 });
    await clientPage.screenshot({
      path: path.join(SHOT_DIR, "07-client-archived-readonly.png"),
      fullPage: true
    });
    await clientPage.close();
  });

  test("FLOW H — responsive archive + print", async ({ page, browser }) => {
    const { nocPage, nocContext } = await bootstrapCompletedProject(page, browser);
    await nocPage.setViewportSize({ width: 390, height: 844 });
    await expect(nocPage.getByRole("button", { name: "Archivar expediente" })).toBeVisible();
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "08-archive-390.png"), fullPage: true });
    await nocPage.emulateMedia({ media: "print" });
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "09-archive-print.png"), fullPage: true });
    await nocContext.close();
  });
});
