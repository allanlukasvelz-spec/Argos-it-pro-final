import { test, expect, type Browser, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { resetAuthRateLimits } from "./helpers/resetRateLimits";
import { BACKEND } from "./helpers/e2eEnv";
import { loginViaUi } from "./helpers/loginUi";
import { promoteEmailToAdmin } from "./helpers/promoteNocAdmin";

const PASSWORD = "E2eSecure2026!x";
const SHOT_DIR = path.join(process.cwd(), "artifacts/phase15-web-projects");

const TOUR_RESPONSES = [
  { fieldKey: "company_trade_name", value: "Demo Activities" },
  { fieldKey: "company_city", value: "Valencia" },
  { fieldKey: "company_country", value: "España" },
  { fieldKey: "company_phone", value: "+34 600 000 000" },
  { fieldKey: "company_email", value: "hola@demo-activities.test" },
  { fieldKey: "company_contact_name", value: "Ana Pérez" },
  { fieldKey: "company_entity_type", value: "company" },
  { fieldKey: "company_multiple_locations", value: "no" },
  { fieldKey: "has_existing_site", value: "no" },
  { fieldKey: "brand_has_logo", value: "no" },
  { fieldKey: "brand_has_manual", value: "no" },
  { fieldKey: "about_who", value: "Equipo demo" },
  { fieldKey: "about_what_you_do", value: "Actividades guiadas" },
  { fieldKey: "goals_objectives", value: ["professional_presence"] },
  { fieldKey: "goals_primary_success", value: "Web de actividades" },
  { fieldKey: "goals_b2b_b2c", value: "b2c" },
  { fieldKey: "goals_priority", value: "normal" },
  { fieldKey: "offer_kinds", value: ["experiences"] },
  { fieldKey: "content_has_texts", value: "no" },
  { fieldKey: "content_needs_copy", value: "yes" },
  { fieldKey: "media_has_photos", value: "no" },
  { fieldKey: "media_has_videos", value: "no" },
  { fieldKey: "media_needs_production", value: "yes" },
  { fieldKey: "media_commercial_rights", value: "pending" },
  { fieldKey: "primary_language", value: "es" },
  { fieldKey: "languages_multilingual", value: "no" },
  { fieldKey: "sales_mode", value: "online_booking" },
  { fieldKey: "legal_notice", value: "yes" },
  { fieldKey: "legal_privacy", value: "yes" },
  { fieldKey: "legal_cookies", value: "yes" },
  { fieldKey: "access_ack_no_secrets", value: "yes" },
  { fieldKey: "confirm_reviewed", value: "yes" },
  { fieldKey: "confirm_use_material", value: "yes" },
  { fieldKey: "confirm_authorization", value: "yes" }
];

const SERVICE_RESPONSES = [
  { fieldKey: "company_trade_name", value: "Demo Services Co" },
  { fieldKey: "company_city", value: "Valencia" },
  { fieldKey: "company_country", value: "España" },
  { fieldKey: "company_phone", value: "+34 600 000 000" },
  { fieldKey: "company_email", value: "hola@demo-services.test" },
  { fieldKey: "company_contact_name", value: "Ana Pérez" },
  { fieldKey: "company_entity_type", value: "company" },
  { fieldKey: "company_multiple_locations", value: "no" },
  { fieldKey: "has_existing_site", value: "no" },
  { fieldKey: "brand_has_logo", value: "no" },
  { fieldKey: "brand_has_manual", value: "no" },
  { fieldKey: "about_who", value: "Equipo de servicios de ejemplo" },
  { fieldKey: "about_what_you_do", value: "Servicios profesionales" },
  { fieldKey: "goals_objectives", value: ["professional_presence"] },
  { fieldKey: "goals_primary_success", value: "Web clara de servicios" },
  { fieldKey: "goals_b2b_b2c", value: "b2b" },
  { fieldKey: "goals_priority", value: "normal" },
  { fieldKey: "offer_kinds", value: ["services"] },
  { fieldKey: "content_has_texts", value: "no" },
  { fieldKey: "content_needs_copy", value: "yes" },
  { fieldKey: "media_has_photos", value: "no" },
  { fieldKey: "media_has_videos", value: "no" },
  { fieldKey: "media_needs_production", value: "yes" },
  { fieldKey: "media_commercial_rights", value: "pending" },
  { fieldKey: "primary_language", value: "es" },
  { fieldKey: "languages_multilingual", value: "no" },
  { fieldKey: "sales_mode", value: "contact_forms" },
  { fieldKey: "legal_notice", value: "yes" },
  { fieldKey: "legal_privacy", value: "yes" },
  { fieldKey: "legal_cookies", value: "yes" },
  { fieldKey: "access_ack_no_secrets", value: "yes" },
  { fieldKey: "confirm_reviewed", value: "yes" },
  { fieldKey: "confirm_use_material", value: "yes" },
  { fieldKey: "confirm_authorization", value: "yes" }
];

test.beforeEach(async () => {
  try {
    await resetAuthRateLimits();
  } catch {
    /* reuse server */
  }
  mkdirSync(SHOT_DIR, { recursive: true });
});

function uniqueEmail(prefix: string) {
  return `argos-e2e-p15-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.test`;
}

async function loginCookies(request: Page["request"], email: string) {
  const origin = process.env.E2E_ORIGIN || "http://127.0.0.1:3020";
  const res = await request.post(`${BACKEND}/api/auth/login`, {
    data: { email, password: PASSWORD },
    headers: { Origin: origin, "Content-Type": "application/json" }
  });
  expect(res.ok(), `login ${email} → ${res.status()}`).toBeTruthy();
  const setCookie = res.headers()["set-cookie"] || "";
  return setCookie.split(",").map((c) => c.split(";")[0]).join("; ");
}

async function createDevelopmentProject(
  page: Page,
  browser: Browser,
  mode: "service" | "tour" = "service",
  extraTours = 0
) {
  try {
    await resetAuthRateLimits();
  } catch {
    /* reuse server */
  }
  const clientEmail = uniqueEmail("client");
  const origin = process.env.E2E_ORIGIN || "http://127.0.0.1:3020";
  await page.request.post(`${BACKEND}/api/auth/register`, {
    data: { email: clientEmail, password: PASSWORD, name: "Demo Client", company: "ARGOS" },
    headers: { Origin: origin, "Content-Type": "application/json" }
  });
  const clientCookie = await loginCookies(page.request, clientEmail);
  const createRes = await page.request.post(`${BACKEND}/api/client/web-projects`, {
    data: { title: "Demo Development Project", projectType: "create" },
    headers: { Origin: origin, "Content-Type": "application/json", Cookie: clientCookie }
  });
  const projectId = Number((await createRes.json()).project.id);
  const clientHeaders = { Origin: origin, "Content-Type": "application/json", Cookie: clientCookie };
  await page.request.post(`${BACKEND}/api/client/web-projects/${projectId}/form`, {
    data: { responses: mode === "tour" ? TOUR_RESPONSES : SERVICE_RESPONSES },
    headers: clientHeaders
  });
  const baseItems =
    mode === "tour"
      ? [
          { itemType: "tour", title: "Demo Activity A", payload: { summary: "A" } },
          { itemType: "tour", title: "Demo Activity B", payload: { summary: "B" } }
        ]
      : [{ itemType: "service", title: "Demo Service", payload: { summary: "Servicio" } }];
  for (const item of baseItems) {
    await page.request.post(`${BACKEND}/api/client/web-projects/${projectId}/items`, {
      data: item,
      headers: clientHeaders
    });
  }
  for (let i = 0; i < extraTours; i += 1) {
    await page.request.post(`${BACKEND}/api/client/web-projects/${projectId}/items`, {
      data: { itemType: "tour", title: `Demo Activity ${i + 3}`, payload: { summary: "Tour demo" } },
      headers: clientHeaders
    });
  }
  const submitRes = await page.request.post(`${BACKEND}/api/client/web-projects/${projectId}/submit-review`, {
    headers: clientHeaders
  });
  expect(submitRes.ok(), `submit-review → ${submitRes.status()}`).toBeTruthy();
  const projectJson = await (
    await page.request.get(`${BACKEND}/api/client/web-projects/${projectId}`, {
      headers: { Origin: origin, Cookie: clientCookie }
    })
  ).json();
  const organizationId = Number(projectJson.project?.organizationId);

  const staffEmail = uniqueEmail("staff");
  await page.request.post(`${BACKEND}/api/auth/register`, {
    data: { email: staffEmail, password: PASSWORD, name: "NOC Staff", company: "ARGOS" },
    headers: { Origin: origin, "Content-Type": "application/json" }
  });
  promoteEmailToAdmin(staffEmail);

  const staffApiContext = await browser.newContext();
  const staffApiPage = await staffApiContext.newPage();
  const staffLogin = await staffApiPage.request.post(`${BACKEND}/api/auth/login`, {
    data: { email: staffEmail, password: PASSWORD },
    headers: { Origin: origin, "Content-Type": "application/json" }
  });
  expect(staffLogin.ok(), `staff login → ${staffLogin.status()}`).toBeTruthy();
  const nocHeaders = { Origin: origin, "Content-Type": "application/json" };
  await staffApiPage.request.post(
    `${BACKEND}/api/noc/web-projects/${projectId}/start-architecture?organization_id=${organizationId}`,
    { data: { acknowledgeOpenItems: true, reason: "E2E Phase 15" }, headers: nocHeaders }
  );
  await staffApiPage.request.post(
    `${BACKEND}/api/noc/web-projects/${projectId}/architecture/generate?organization_id=${organizationId}`,
    { headers: nocHeaders }
  );
  await staffApiPage.request.post(
    `${BACKEND}/api/noc/web-projects/${projectId}/architecture/approve?organization_id=${organizationId}`,
    { data: { acknowledgeWarnings: true }, headers: nocHeaders }
  );
  await staffApiPage.request.post(
    `${BACKEND}/api/noc/web-projects/${projectId}/start-mockup?organization_id=${organizationId}`,
    { headers: nocHeaders }
  );
  const genMockup = await staffApiPage.request.post(
    `${BACKEND}/api/noc/web-projects/${projectId}/mockup/generate?organization_id=${organizationId}`,
    { headers: nocHeaders }
  );
  expect(genMockup.ok(), `mockup generate → ${genMockup.status()}`).toBeTruthy();
  const mockupBundle = await (
    await staffApiPage.request.get(
      `${BACKEND}/api/noc/web-projects/${projectId}/mockup?organization_id=${organizationId}`,
      { headers: nocHeaders }
    )
  ).json();
  expect(mockupBundle.mockup?.id, "mockup id").toBeTruthy();
  await staffApiPage.request.post(
    `${BACKEND}/api/noc/web-projects/${projectId}/mockup/send-client?organization_id=${organizationId}`,
    { data: { mockupId: mockupBundle.mockup.id, acknowledgeWarnings: true }, headers: nocHeaders }
  );
  await page.request.post(`${BACKEND}/api/client/web-projects/${projectId}/mockup/approve`, {
    headers: { Origin: origin, Cookie: clientCookie }
  });
  await staffApiPage.request.post(
    `${BACKEND}/api/noc/web-projects/${projectId}/start-development?organization_id=${organizationId}`,
    { headers: nocHeaders }
  );
  await staffApiContext.close();

  const nocContext = await browser.newContext();
  const nocPage = await nocContext.newPage();
  await loginViaUi(nocPage, staffEmail, PASSWORD);
  await nocPage.goto(`/noc/projects/${projectId}?organization_id=${organizationId}`);
  await expect(nocPage.locator('a[href="#noc-desarrollo"]')).toBeVisible({ timeout: 30000 });
  await expect(nocPage.getByText("Acceso NOC denegado")).toHaveCount(0);
  await nocPage.locator('a[href="#noc-desarrollo"]').click();
  return { nocPage, nocContext, projectId, organizationId, clientCookie, origin };
}

async function completeRequiredViaApi(
  request: Page["request"],
  projectId: number,
  organizationId: number
) {
  const origin = process.env.E2E_ORIGIN || "http://127.0.0.1:3020";
  const headers = { Origin: origin, "Content-Type": "application/json" };
  const prep = await request.post(
    `${BACKEND}/api/noc/web-projects/${projectId}/development/prepare?organization_id=${organizationId}`,
    { headers }
  );
  expect(prep.ok()).toBeTruthy();
  const payload = await prep.json();
  const order = ["TODO", "READY", "IN_PROGRESS", "REVIEW", "DONE"] as const;
  for (const item of payload.items.filter(
    (i: { status: string; required: boolean }) => i.required && i.status !== "NOT_APPLICABLE"
  )) {
    const start = order.indexOf(item.status as (typeof order)[number]);
    for (let i = start + 1; i < order.length; i += 1) {
      const status = order[i];
      const res = await request.patch(
        `${BACKEND}/api/noc/web-projects/${projectId}/development/items/${item.id}?organization_id=${organizationId}`,
        { data: { status }, headers }
      );
      expect(res.ok(), `item ${item.id} → ${status}`).toBeTruthy();
    }
  }
}

test.describe("PHASE 15 development closure", () => {
  test.describe.configure({ mode: "serial", timeout: 480000 });

  test("FLOW A — prepare development", async ({ page, browser }) => {
    const { nocPage, nocContext } = await createDevelopmentProject(page, browser);
    await expect(nocPage.getByTestId("development-empty")).toBeVisible({ timeout: 15000 });
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "01-development-empty.png"), fullPage: true });
    await nocPage.locator("#noc-dev-prepare").click();
    await expect(nocPage.getByTestId("development-board")).toBeVisible({ timeout: 20000 });
    await expect(nocPage.getByTestId("development-handoff")).toContainText(/arquitectura v/i);
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "02-development-prepared.png"), fullPage: true });
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "03-development-board.png"), fullPage: true });
    await nocContext.close();
  });

  test("FLOW B — work item lifecycle", async ({ page, browser }) => {
    const { nocPage, nocContext } = await createDevelopmentProject(page, browser);
    await nocPage.locator("#noc-dev-prepare").click();
    await expect(nocPage.getByTestId("development-board")).toBeVisible({ timeout: 20000 });
    await nocPage.locator('.noc-dev-list__item[data-item-type="GLOBAL_STYLES"]').click();
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "04-work-item-detail.png"), fullPage: true });
    const status = nocPage.locator('#noc-dev-item-detail select[aria-label="Estado de la tarea"]');
    await status.selectOption("IN_PROGRESS");
    await expect(nocPage.locator('[data-item-status="IN_PROGRESS"]').first()).toBeVisible({ timeout: 10000 });
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "05-work-item-in-progress.png"), fullPage: true });
    await status.selectOption("REVIEW");
    await status.selectOption("DONE");
    await expect(nocPage.getByTestId("development-progress")).not.toContainText("0%");
    await nocContext.close();
  });

  test("FLOW C — blocker", async ({ page, browser }) => {
    const { nocPage, nocContext } = await createDevelopmentProject(page, browser);
    await nocPage.locator("#noc-dev-prepare").click();
    await nocPage.locator('.noc-dev-list__item[data-item-type="PAGE"]').first().click();
    await nocPage.getByTestId("development-board").getByRole("button", { name: "Bloquear" }).click();
    const blockDialog = nocPage.getByRole("dialog", { name: "Bloquear tarea" });
    await blockDialog.getByLabel("Descripción del bloqueo").fill("Falta texto del hero neutral");
    await blockDialog.getByRole("button", { name: "Bloquear" }).click();
    await expect(nocPage.getByTestId("development-readiness")).toContainText(/No listo/i, { timeout: 10000 });
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "06-work-item-blocked.png"), fullPage: true });
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "11-readiness-not-ready.png"), fullPage: true });
    await nocPage.getByRole("button", { name: "Resolver bloqueo" }).click();
    await expect(nocPage.locator(".noc-dev-blockers")).toContainText(/resuelto/i);
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "07-blocker-resolved.png"), fullPage: true });
    await nocContext.close();
  });

  test("FLOW D — template reuse", async ({ page, browser }) => {
    const { nocPage, nocContext } = await createDevelopmentProject(page, browser, "tour", 8);
    await nocPage.locator("#noc-dev-prepare").click();
    await expect(nocPage.getByTestId("development-board")).toBeVisible({ timeout: 20000 });
    const templates = nocPage.locator('.noc-dev-list__item[data-item-type="TEMPLATE"]');
    await expect(templates).toHaveCount(1);
    await expect(templates.first()).toContainText(/Actividad/i);
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "08-template-reuse.png"), fullPage: true });
    await nocContext.close();
  });

  test("FLOW E — dependencies", async ({ page, browser }) => {
    const { nocPage, nocContext } = await createDevelopmentProject(page, browser);
    await nocPage.locator("#noc-dev-prepare").click();
    await nocPage.locator('.noc-dev-list__item[data-item-type="HEADER"]').click();
    await nocPage.getByLabel("Tarea de la que depende").selectOption({ label: "Estilos globales y tokens" });
    await nocPage.getByRole("button", { name: "Añadir dependencia" }).click();
    await expect(nocPage.locator(".noc-dev-dependencies")).toContainText(/Estilos globales y tokens/i);
    await nocPage.locator('.noc-dev-list__item[data-item-type="GLOBAL_STYLES"]').click();
    await nocPage.getByLabel("Tarea de la que depende").selectOption({ label: "Cabecera global" });
    await nocPage.getByRole("button", { name: "Añadir dependencia" }).click();
    await expect(nocPage.locator(".noc-error")).toContainText(/Dependencia circular/i);
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "09-dependencies.png"), fullPage: true });
    await nocContext.close();
  });

  test("FLOW F — progress and readiness", async ({ page, browser }) => {
    const { nocPage, nocContext, projectId, organizationId } = await createDevelopmentProject(page, browser);
    await completeRequiredViaApi(nocPage.request, projectId, organizationId);
    await nocPage.reload();
    await nocPage.locator('a[href="#noc-desarrollo"]').click();
    await expect(nocPage.getByTestId("development-progress")).toContainText(/Progreso: (9[0-9]|100)%/i, {
      timeout: 15000
    });
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "10-development-progress.png"), fullPage: true });
    await expect(nocPage.getByTestId("development-readiness")).toContainText(/Listo/i);
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "12-readiness-ready.png"), fullPage: true });
    await nocContext.close();
  });

  test("FLOW G — start validation + responsive + print", async ({ page, browser }) => {
    const { nocPage, nocContext, projectId, organizationId } = await createDevelopmentProject(page, browser);
    await completeRequiredViaApi(nocPage.request, projectId, organizationId);
    await nocPage.reload();
    await nocPage.locator('a[href="#noc-desarrollo"]').click();
    await nocPage.getByRole("button", { name: "Pasar a validación" }).click();
    await expect(nocPage.locator("#noc-start-validation")).toContainText(/Progreso/i);
    await expect(nocPage.locator("#noc-start-validation")).toContainText(/Maqueta: v/i);
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "13-start-validation.png"), fullPage: true });
    await nocPage.locator("#noc-start-validation").getByRole("button", { name: "Confirmar" }).click();
    await expect(nocPage.getByTestId("development-readiness")).toBeVisible({ timeout: 15000 });
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "14-validation-state.png"), fullPage: true });

    for (const width of [1440, 1024, 768] as const) {
      await nocPage.setViewportSize({ width, height: 900 });
      const overflow = await nocPage.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
      );
      expect(overflow, `overflow at ${width}`).toBeFalsy();
    }
    await nocPage.setViewportSize({ width: 390, height: 844 });
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "15-development-390.png"), fullPage: true });

    await nocPage.keyboard.press("Tab");
    await nocPage.keyboard.press("Tab");
    const focused = await nocPage.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();

    await nocPage.emulateMedia({ media: "print" });
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "16-development-print.png"), fullPage: true });
    await nocContext.close();
  });
});
