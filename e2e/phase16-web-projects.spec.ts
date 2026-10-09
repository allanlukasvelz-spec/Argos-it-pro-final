import { test, expect, type Browser, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { resetAuthRateLimits } from "./helpers/resetRateLimits";
import { BACKEND } from "./helpers/e2eEnv";
import { loginViaUi } from "./helpers/loginUi";
import { promoteEmailToAdmin } from "./helpers/promoteNocAdmin";

const PASSWORD = "E2eSecure2026!x";
const SHOT_DIR = path.join(process.cwd(), "artifacts/phase16-web-projects");

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
  { fieldKey: "about_who", value: "Equipo demo" },
  { fieldKey: "about_what_you_do", value: "Servicios" },
  { fieldKey: "goals_objectives", value: ["professional_presence"] },
  { fieldKey: "goals_primary_success", value: "Web clara" },
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
  return `argos-e2e-p16-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.test`;
}

async function loginCookies(request: Page["request"], email: string) {
  const origin = process.env.E2E_ORIGIN || "http://127.0.0.1:3020";
  const res = await request.post(`${BACKEND}/api/auth/login`, {
    data: { email, password: PASSWORD },
    headers: { Origin: origin, "Content-Type": "application/json" }
  });
  expect(res.ok()).toBeTruthy();
  const setCookie = res.headers()["set-cookie"] || "";
  return setCookie.split(",").map((c) => c.split(";")[0]).join("; ");
}

async function completeRequiredDevelopment(
  request: Page["request"],
  projectId: number,
  organizationId: number
) {
  const origin = process.env.E2E_ORIGIN || "http://127.0.0.1:3020";
  const headers = { Origin: origin, "Content-Type": "application/json" };
  await request.post(
    `${BACKEND}/api/noc/web-projects/${projectId}/development/prepare?organization_id=${organizationId}`,
    { headers }
  );
  const payload = await (
    await request.get(
      `${BACKEND}/api/noc/web-projects/${projectId}/development?organization_id=${organizationId}`,
      { headers }
    )
  ).json();
  const order = ["TODO", "READY", "IN_PROGRESS", "REVIEW", "DONE"] as const;
  for (const item of payload.items.filter(
    (i: { required: boolean; status: string }) => i.required && i.status !== "NOT_APPLICABLE"
  )) {
    const start = order.indexOf(item.status as (typeof order)[number]);
    for (let i = Math.max(start + 1, 1); i < order.length; i += 1) {
      await request.patch(
        `${BACKEND}/api/noc/web-projects/${projectId}/development/items/${item.id}?organization_id=${organizationId}`,
        { data: { status: order[i] }, headers }
      );
    }
  }
}

const TOUR_RESPONSES = SERVICE_RESPONSES.map((r) => {
  if (r.fieldKey === "offer_kinds") return { ...r, value: ["experiences"] };
  if (r.fieldKey === "sales_mode") return { ...r, value: "online_booking" };
  if (r.fieldKey === "company_trade_name") return { ...r, value: "Demo Activities Co" };
  return r;
});

async function createValidationProject(page: Page, browser: Browser, extraTours = 0, serviceCount = 1) {
  await resetAuthRateLimits();
  const origin = process.env.E2E_ORIGIN || "http://127.0.0.1:3020";
  const responses = extraTours > 0 ? TOUR_RESPONSES : SERVICE_RESPONSES;
  const clientEmail = uniqueEmail("client");
  await page.request.post(`${BACKEND}/api/auth/register`, {
    data: { email: clientEmail, password: PASSWORD, name: "Demo Client", company: "ARGOS" },
    headers: { Origin: origin, "Content-Type": "application/json" }
  });
  const clientCookie = await loginCookies(page.request, clientEmail);
  const createRes = await page.request.post(`${BACKEND}/api/client/web-projects`, {
    data: { title: "Demo Validation Project", projectType: "create" },
    headers: { Origin: origin, "Content-Type": "application/json", Cookie: clientCookie }
  });
  const projectId = Number((await createRes.json()).project.id);
  const clientHeaders = { Origin: origin, "Content-Type": "application/json", Cookie: clientCookie };
  await page.request.post(`${BACKEND}/api/client/web-projects/${projectId}/form`, {
    data: { responses },
    headers: clientHeaders
  });
  if (extraTours === 0) {
    const serviceTitles =
      serviceCount >= 2
        ? ["Demo Service A", "Demo Service B"]
        : ["Demo Service"];
    for (const title of serviceTitles) {
      await page.request.post(`${BACKEND}/api/client/web-projects/${projectId}/items`, {
        data: { itemType: "service", title, payload: { summary: "S" } },
        headers: clientHeaders
      });
    }
  }
  for (let i = 0; i < extraTours; i += 1) {
    await page.request.post(`${BACKEND}/api/client/web-projects/${projectId}/items`, {
      data: { itemType: "tour", title: `Demo Activity ${String.fromCharCode(65 + i)}`, payload: {} },
      headers: clientHeaders
    });
  }
  await page.request.post(`${BACKEND}/api/client/web-projects/${projectId}/submit-review`, {
    headers: clientHeaders
  });
  const organizationId = Number(
    (await (
      await page.request.get(`${BACKEND}/api/client/web-projects/${projectId}`, {
        headers: { Origin: origin, Cookie: clientCookie }
      })
    ).json()).project.organizationId
  );

  const staffEmail = uniqueEmail("staff");
  await page.request.post(`${BACKEND}/api/auth/register`, {
    data: { email: staffEmail, password: PASSWORD, name: "NOC Staff", company: "ARGOS" },
    headers: { Origin: origin, "Content-Type": "application/json" }
  });
  promoteEmailToAdmin(staffEmail);

  const staffCtx = await browser.newContext();
  const staffPage = await staffCtx.newPage();
  const staffLogin = await staffPage.request.post(`${BACKEND}/api/auth/login`, {
    data: { email: staffEmail, password: PASSWORD },
    headers: { Origin: origin, "Content-Type": "application/json" }
  });
  expect(staffLogin.ok(), `staff login → ${staffLogin.status()}`).toBeTruthy();
  const nocHeaders = { Origin: origin, "Content-Type": "application/json" };
  await staffPage.request.post(
    `${BACKEND}/api/noc/web-projects/${projectId}/start-architecture?organization_id=${organizationId}`,
    { data: { acknowledgeOpenItems: true, reason: "E2E P16" }, headers: nocHeaders }
  );
  await staffPage.request.post(
    `${BACKEND}/api/noc/web-projects/${projectId}/architecture/generate?organization_id=${organizationId}`,
    { headers: nocHeaders }
  );
  await staffPage.request.post(
    `${BACKEND}/api/noc/web-projects/${projectId}/architecture/approve?organization_id=${organizationId}`,
    { data: { acknowledgeWarnings: true }, headers: nocHeaders }
  );
  await staffPage.request.post(
    `${BACKEND}/api/noc/web-projects/${projectId}/start-mockup?organization_id=${organizationId}`,
    { headers: nocHeaders }
  );
  await staffPage.request.post(
    `${BACKEND}/api/noc/web-projects/${projectId}/mockup/generate?organization_id=${organizationId}`,
    { headers: nocHeaders }
  );
  const mockup = await (
    await staffPage.request.get(
      `${BACKEND}/api/noc/web-projects/${projectId}/mockup?organization_id=${organizationId}`,
      { headers: nocHeaders }
    )
  ).json();
  await staffPage.request.post(
    `${BACKEND}/api/noc/web-projects/${projectId}/mockup/send-client?organization_id=${organizationId}`,
    { data: { mockupId: mockup.mockup.id, acknowledgeWarnings: true }, headers: nocHeaders }
  );
  await page.request.post(`${BACKEND}/api/client/web-projects/${projectId}/mockup/approve`, {
    headers: { Origin: origin, Cookie: clientCookie }
  });
  await staffPage.request.post(
    `${BACKEND}/api/noc/web-projects/${projectId}/start-development?organization_id=${organizationId}`,
    { headers: nocHeaders }
  );
  await completeRequiredDevelopment(staffPage.request, projectId, organizationId);
  const startValidation = await staffPage.request.post(
    `${BACKEND}/api/noc/web-projects/${projectId}/start-validation?organization_id=${organizationId}`,
    { data: { acknowledgeWarnings: true }, headers: nocHeaders }
  );
  expect(startValidation.ok(), `start-validation → ${startValidation.status()}`).toBeTruthy();
  await staffCtx.close();

  const nocContext = await browser.newContext();
  const nocPage = await nocContext.newPage();
  await loginViaUi(nocPage, staffEmail, PASSWORD);
  await nocPage.goto(`/noc/projects/${projectId}?organization_id=${organizationId}`);
  await nocPage.locator('a[href="#noc-validacion"]').click();
  return { nocPage, nocContext, projectId, organizationId, staffEmail, origin };
}

async function prepareValidationIfNeeded(nocPage: Page) {
  await resetAuthRateLimits();
  await nocPage.locator("#noc-validacion").scrollIntoViewIfNeeded();
  await expect(nocPage.getByText("Cargando validación…")).toHaveCount(0, { timeout: 60000 });
  const panelError = nocPage.locator("#noc-validacion .noc-error");
  if (await panelError.count()) {
    throw new Error(`Validación no cargó: ${await panelError.first().textContent()}`);
  }
  await expect(
    nocPage.getByTestId("validation-empty").or(nocPage.getByTestId("validation-qa-matrix"))
  ).toBeVisible({
    timeout: 30000
  });
  if (await nocPage.getByTestId("validation-empty").isVisible()) {
    await nocPage.locator("#noc-val-prepare").click();
    await expect(nocPage.getByTestId("validation-qa-matrix")).toBeVisible({ timeout: 60000 });
  }
}

async function passAllRequiredChecks(
  request: Page["request"],
  projectId: number,
  organizationId: number,
  origin: string
) {
  await resetAuthRateLimits();
  const headers = { Origin: origin, "Content-Type": "application/json" };
  const val = await (
    await request.get(
      `${BACKEND}/api/noc/web-projects/${projectId}/validation?organization_id=${organizationId}`,
      { headers }
    )
  ).json();
  for (const check of val.checks.filter((c: { required: boolean }) => c.required)) {
    if (check.status === "NOT_APPLICABLE") continue;
    await request.patch(
      `${BACKEND}/api/noc/web-projects/${projectId}/validation/checks/${check.id}?organization_id=${organizationId}`,
      { data: { status: "IN_PROGRESS" }, headers }
    );
    const passBody =
      check.category === "BOOKING" || check.status === "NOT_TESTABLE"
        ? { status: "NOT_APPLICABLE", statusReason: "No aplica en fixture E2E" }
        : { status: "PASS" };
    const done = await request.patch(
      `${BACKEND}/api/noc/web-projects/${projectId}/validation/checks/${check.id}?organization_id=${organizationId}`,
      { data: passBody, headers }
    );
    expect(done.ok(), `check ${check.id} → ${done.status()}`).toBeTruthy();
  }
  const valAfter = await (
    await request.get(
      `${BACKEND}/api/noc/web-projects/${projectId}/validation?organization_id=${organizationId}`,
      { headers }
    )
  ).json();
  for (const check of valAfter.checks.filter(
    (c: { status: string }) => !["PASS", "NOT_APPLICABLE"].includes(c.status)
  )) {
    if (check.status === "PENDING") {
      await request.patch(
        `${BACKEND}/api/noc/web-projects/${projectId}/validation/checks/${check.id}?organization_id=${organizationId}`,
        { data: { status: "IN_PROGRESS" }, headers }
      );
    }
    await request.patch(
      `${BACKEND}/api/noc/web-projects/${projectId}/validation/checks/${check.id}?organization_id=${organizationId}`,
      { data: { status: "PASS" }, headers }
    );
  }
  const readyProbe = await (
    await request.get(
      `${BACKEND}/api/noc/web-projects/${projectId}/validation?organization_id=${organizationId}`,
      { headers }
    )
  ).json();
  expect(
    readyProbe.readiness.state,
    JSON.stringify(readyProbe.readiness.errors || [])
  ).not.toBe("NOT_READY");
}

test.describe("PHASE 16 validation closure", () => {
  test.describe.configure({ mode: "serial", timeout: 720000 });

  test("FLOW A — empty validation + prepare", async ({ page, browser }) => {
    const { nocPage, nocContext } = await createValidationProject(page, browser);
    await expect(nocPage.getByTestId("validation-empty")).toBeVisible({ timeout: 15000 });
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "01-validation-empty.png"), fullPage: true });
    await prepareValidationIfNeeded(nocPage);
    await expect(nocPage.getByTestId("validation-qa-matrix")).toBeVisible({ timeout: 20000 });
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "02-validation-prepared.png"), fullPage: true });
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "03-qa-matrix.png"), fullPage: true });
    await nocContext.close();
  });

  test("FLOW B — check PASS lifecycle", async ({ page, browser }) => {
    const { nocPage, nocContext } = await createValidationProject(page, browser);
    await prepareValidationIfNeeded(nocPage);
    await expect(nocPage.getByTestId("validation-qa-matrix")).toBeVisible();
    await nocPage.locator("#noc-validacion .noc-dev-list__item").first().click();
    await expect(nocPage.locator("#noc-val-check-detail")).toBeVisible({ timeout: 10000 });
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "04-check-detail.png"), fullPage: true });
    const status = nocPage.locator('#noc-val-check-detail select[aria-label="Estado del check"]');
    await expect(status).toBeVisible({ timeout: 10000 });
    await status.selectOption("IN_PROGRESS");
    await status.selectOption("PASS");
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "05-check-pass.png"), fullPage: true });
    await expect(nocPage.getByTestId("validation-execution-progress")).not.toContainText("0%");
    await nocContext.close();
  });

  test("FLOW C — FAIL defect retest", async ({ page, browser }) => {
    const { nocPage, nocContext, projectId, organizationId, origin } = await createValidationProject(
      page,
      browser
    );
    await prepareValidationIfNeeded(nocPage);
    const item = nocPage.locator('#noc-validacion .noc-dev-list__item[data-check-required="yes"]').first();
    await item.click();
    const status = nocPage.locator('#noc-val-check-detail select[aria-label="Estado del check"]');
    await nocPage.locator('#noc-val-check-detail textarea[aria-label="Motivo o resultado"]').fill("Desalineado");
    await status.selectOption("IN_PROGRESS");
    await status.selectOption("FAIL");
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "06-check-fail.png"), fullPage: true });
    await nocPage.locator(".noc-val-defect-form").getByLabel("Título").fill("Defecto visual demo");
    await nocPage.locator(".noc-val-defect-form button[type='submit']").click();
    await expect(nocPage.getByTestId("validation-defects")).toBeVisible({ timeout: 10000 });
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "07-defect-open.png"), fullPage: true });
    await expect(nocPage.getByTestId("validation-readiness")).toContainText(/No listo/i);
    const headers = { Origin: origin, "Content-Type": "application/json" };
    const valBefore = await (
      await nocPage.request.get(
        `${BACKEND}/api/noc/web-projects/${projectId}/validation?organization_id=${organizationId}`,
        { headers }
      )
    ).json();
    const defectId = valBefore.defects[0].id;
    await nocPage.request.patch(
      `${BACKEND}/api/noc/web-projects/${projectId}/validation/defects/${defectId}?organization_id=${organizationId}`,
      { data: { status: "IN_PROGRESS" }, headers }
    );
    await nocPage.request.patch(
      `${BACKEND}/api/noc/web-projects/${projectId}/validation/defects/${defectId}?organization_id=${organizationId}`,
      { data: { status: "FIXED", resolutionNote: "Corregido en fixture E2E" }, headers }
    );
    await nocPage.reload();
    await nocPage.locator('a[href="#noc-validacion"]').click();
    await expect(nocPage.getByText("Cargando validación…")).toHaveCount(0, { timeout: 60000 });
    const defectsPanel = nocPage.getByTestId("validation-defects");
    await expect(defectsPanel.getByRole("button", { name: "Retest PASS" })).toBeVisible({
      timeout: 30000
    });
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "08-defect-retest.png"), fullPage: true });
    await defectsPanel.getByRole("button", { name: "Retest PASS" }).click();
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "09-defect-verified.png"), fullPage: true });
    await nocContext.close();
  });

  test("FLOW D — NOT_TESTABLE", async ({ page, browser }) => {
    const { nocPage, nocContext, projectId, organizationId, origin } = await createValidationProject(
      page,
      browser
    );
    await prepareValidationIfNeeded(nocPage);
    const booking = nocPage.locator('#noc-validacion .noc-dev-list__item[data-check-category="BOOKING"]');
    if (await booking.count()) {
      await booking.first().click();
      await nocPage.locator('#noc-val-check-detail textarea[aria-label="Motivo o resultado"]').fill("Sin staging");
      await nocPage.locator('#noc-val-check-detail select[aria-label="Estado del check"]').selectOption("NOT_TESTABLE");
    } else {
      await nocPage.locator("#noc-validacion .noc-dev-list__item").first().click();
      await nocPage.locator('#noc-val-check-detail textarea[aria-label="Motivo o resultado"]').fill("Sin evidencia");
      await nocPage.locator('#noc-val-check-detail select[aria-label="Estado del check"]').selectOption("NOT_TESTABLE");
    }
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "10-not-testable.png"), fullPage: true });
    await expect(nocPage.getByTestId("validation-readiness")).toContainText(/No listo/i);
    void projectId;
    void organizationId;
    void origin;
    await nocContext.close();
  });

  test("FLOW E — template sample visible", async ({ page, browser }) => {
    const { nocPage, nocContext, projectId, organizationId, origin } = await createValidationProject(
      page,
      browser,
      0,
      2
    );
    await resetAuthRateLimits();
    await prepareValidationIfNeeded(nocPage);
    const templateItems = nocPage.locator("#noc-validacion .noc-dev-list__item").filter({ hasText: /plantilla/i });
    await expect(templateItems.first()).toBeVisible({ timeout: 15000 });
    await templateItems.first().click();
    await expect(nocPage.getByTestId("template-group")).toBeVisible({ timeout: 10000 });
    void projectId;
    void organizationId;
    void origin;
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "11-template-sample.png"), fullPage: true });
    await nocContext.close();
  });

  test("FLOW F — evidence", async ({ page, browser }) => {
    const { nocPage, nocContext } = await createValidationProject(page, browser);
    await prepareValidationIfNeeded(nocPage);
    await nocPage.locator("#noc-validacion .noc-dev-list__item").first().click();
    await nocPage.locator('.noc-val-evidence-form input[type="text"]').fill("Captura revisada manualmente");
    await nocPage.locator(".noc-val-evidence-form button").click();
    await expect(nocPage.getByTestId("check-evidence")).toBeVisible({ timeout: 10000 });
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "12-evidence.png"), fullPage: true });
    await nocContext.close();
  });

  test("FLOW G — publication readiness", async ({ page, browser }) => {
    await resetAuthRateLimits();
    const { nocPage, nocContext, projectId, organizationId, origin } = await createValidationProject(
      page,
      browser
    );
    await prepareValidationIfNeeded(nocPage);
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "13-readiness-not-ready.png"), fullPage: true });
    await expect(nocPage.getByTestId("validation-readiness")).toContainText(/No listo/i);
    await passAllRequiredChecks(nocPage.request, projectId, organizationId, origin);
    await resetAuthRateLimits();
    await nocPage.reload();
    await nocPage.locator('a[href="#noc-validacion"]').click();
    await expect(nocPage.getByTestId("start-publication-btn")).toBeVisible({ timeout: 15000 });
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "14-readiness-ready.png"), fullPage: true });
    await nocPage.getByTestId("start-publication-btn").click();
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "15-start-publication.png"), fullPage: true });
    await nocPage.getByRole("button", { name: "Confirmar" }).click();
    await expect(nocPage.locator("#noc-validacion").getByTestId("publication-handoff")).toBeVisible({
      timeout: 15000
    });
    await resetAuthRateLimits();
    await nocPage.reload();
    await nocPage.locator('a[href="#noc-validacion"]').click();
    await expect(nocPage.locator("#noc-validacion").getByTestId("publication-handoff")).toBeVisible({
      timeout: 15000
    });
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "16-publication-state.png"), fullPage: true });
    await nocContext.close();
  });

  test("FLOW H — responsive + print", async ({ page, browser }) => {
    const { nocPage, nocContext } = await createValidationProject(page, browser);
    await nocPage.setViewportSize({ width: 390, height: 844 });
    await prepareValidationIfNeeded(nocPage);
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "17-validation-390.png"), fullPage: true });
    await nocPage.emulateMedia({ media: "print" });
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "18-validation-print.png"), fullPage: true });
    await nocContext.close();
  });
});
