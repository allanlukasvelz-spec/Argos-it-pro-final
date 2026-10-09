import { test, expect, type Browser, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { resetAuthRateLimits } from "./helpers/resetRateLimits";
import { BACKEND } from "./helpers/e2eEnv";
import { loginViaUi } from "./helpers/loginUi";
import { promoteEmailToAdmin } from "./helpers/promoteNocAdmin";

const PASSWORD = "E2eSecure2026!x";
const SHOT_DIR = path.join(process.cwd(), "artifacts/phase17-web-projects");

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
  return `argos-e2e-p17-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.test`;
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

async function passAllRequiredChecks(
  request: Page["request"],
  projectId: number,
  organizationId: number,
  origin: string
) {
  const headers = { Origin: origin, "Content-Type": "application/json" };
  const val = await (
    await request.get(
      `${BACKEND}/api/noc/web-projects/${projectId}/validation?organization_id=${organizationId}`,
      { headers }
    )
  ).json();
  for (const check of val.checks.filter((c: { required: boolean }) => c.required)) {
    if (check.status === "NOT_APPLICABLE" || check.status === "PASS") continue;
    await request.patch(
      `${BACKEND}/api/noc/web-projects/${projectId}/validation/checks/${check.id}?organization_id=${organizationId}`,
      { data: { status: "IN_PROGRESS" }, headers }
    );
    const passBody =
      check.category === "BOOKING" || check.category === "ECOMMERCE"
        ? { status: "NOT_APPLICABLE", statusReason: "No aplica en fixture E2E" }
        : { status: "PASS" };
    await request.patch(
      `${BACKEND}/api/noc/web-projects/${projectId}/validation/checks/${check.id}?organization_id=${organizationId}`,
      { data: passBody, headers }
    );
  }
}

async function completeRequiredPublicationSteps(
  request: Page["request"],
  projectId: number,
  organizationId: number,
  origin: string
) {
  const headers = { Origin: origin, "Content-Type": "application/json" };
  const pub = await (
    await request.get(
      `${BACKEND}/api/noc/web-projects/${projectId}/publication?organization_id=${organizationId}`,
      { headers }
    )
  ).json();
  const order = ["READY", "IN_PROGRESS", "REVIEW", "DONE"] as const;
  for (const step of pub.steps.filter(
    (s: { required: boolean; status: string }) => s.required && s.status !== "NOT_APPLICABLE"
  )) {
    let current = step.status;
    if (current === "TODO") {
      await request.patch(
        `${BACKEND}/api/noc/web-projects/${projectId}/publication/steps/${step.id}?organization_id=${organizationId}`,
        { data: { status: "READY" }, headers }
      );
      current = "READY";
    }
    const start = order.indexOf(current as (typeof order)[number]);
    for (let i = Math.max(start + 1, 0); i < order.length; i += 1) {
      await request.patch(
        `${BACKEND}/api/noc/web-projects/${projectId}/publication/steps/${step.id}?organization_id=${organizationId}`,
        { data: { status: order[i] }, headers }
      );
    }
  }
}

async function createPublicationProject(page: Page, browser: Browser) {
  await resetAuthRateLimits();
  const origin = process.env.E2E_ORIGIN || "http://127.0.0.1:3020";
  const clientEmail = uniqueEmail("client");
  await page.request.post(`${BACKEND}/api/auth/register`, {
    data: { email: clientEmail, password: PASSWORD, name: "Demo Client", company: "ARGOS" },
    headers: { Origin: origin, "Content-Type": "application/json" }
  });
  const clientCookie = await loginCookies(page.request, clientEmail);
  const clientHeaders = { Origin: origin, "Content-Type": "application/json", Cookie: clientCookie };
  const createRes = await page.request.post(`${BACKEND}/api/client/web-projects`, {
    data: { title: "E2E Publication Project", projectType: "create" },
    headers: clientHeaders
  });
  expect(createRes.ok()).toBeTruthy();
  const projectId = Number((await createRes.json()).project.id);
  await page.request.post(`${BACKEND}/api/client/web-projects/${projectId}/form`, {
    data: { responses: SERVICE_RESPONSES },
    headers: clientHeaders
  });
  await page.request.post(`${BACKEND}/api/client/web-projects/${projectId}/items`, {
    data: { itemType: "service", title: "Demo Service", payload: { summary: "S" } },
    headers: clientHeaders
  });
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
    { data: { acknowledgeOpenItems: true, reason: "E2E P17" }, headers: nocHeaders }
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
  await staffPage.request.post(
    `${BACKEND}/api/noc/web-projects/${projectId}/development/prepare?organization_id=${organizationId}`,
    { headers: nocHeaders }
  );
  const dev = await (
    await staffPage.request.get(
      `${BACKEND}/api/noc/web-projects/${projectId}/development?organization_id=${organizationId}`,
      { headers: nocHeaders }
    )
  ).json();
  for (const item of dev.items.filter(
    (i: { required: boolean; status: string }) => i.required && i.status !== "NOT_APPLICABLE"
  )) {
    for (const status of ["READY", "IN_PROGRESS", "REVIEW", "DONE"]) {
      await staffPage.request.patch(
        `${BACKEND}/api/noc/web-projects/${projectId}/development/items/${item.id}?organization_id=${organizationId}`,
        { data: { status }, headers: nocHeaders }
      );
    }
  }
  await staffPage.request.post(
    `${BACKEND}/api/noc/web-projects/${projectId}/start-validation?organization_id=${organizationId}`,
    { data: { acknowledgeWarnings: true }, headers: nocHeaders }
  );
  await staffPage.request.post(
    `${BACKEND}/api/noc/web-projects/${projectId}/validation/prepare?organization_id=${organizationId}`,
    { headers: nocHeaders }
  );
  await passAllRequiredChecks(staffPage.request, projectId, organizationId, origin);
  await staffPage.request.post(
    `${BACKEND}/api/noc/web-projects/${projectId}/start-publication?organization_id=${organizationId}`,
    { data: { acknowledgeWarnings: true }, headers: nocHeaders }
  );

  await staffCtx.close();

  const nocContext = await browser.newContext();
  const nocPage = await nocContext.newPage();
  await loginViaUi(nocPage, staffEmail, PASSWORD);
  await nocPage.goto(`${origin}/noc/projects/${projectId}?organization_id=${organizationId}`);
  await nocPage.locator('a[href="#noc-publicacion"]').click();
  return { nocPage, nocContext, projectId, organizationId, origin };
}

function publicationPanel(nocPage: Page) {
  return nocPage.locator("#noc-publicacion");
}

async function preparePublicationIfNeeded(nocPage: Page) {
  const panel = publicationPanel(nocPage);
  await panel.scrollIntoViewIfNeeded();
  await expect(panel.getByText("Cargando plan de publicación…")).toHaveCount(0, { timeout: 60000 });
  if (await panel.getByTestId("prepare-publication-btn").isVisible()) {
    await panel.getByTestId("prepare-publication-btn").click();
    await expect(panel.getByTestId("publication-board")).toBeVisible({ timeout: 60000 });
  }
}

test.describe("PHASE 17 publication closure", () => {
  test.describe.configure({ mode: "serial", timeout: 720000 });

  test("FLOW A — empty publication + prepare", async ({ page, browser }) => {
    const { nocPage, nocContext } = await createPublicationProject(page, browser);
    await expect(publicationPanel(nocPage).getByTestId("publication-handoff")).toBeVisible({
      timeout: 15000
    });
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "01-publication-handoff.png"), fullPage: true });
    await preparePublicationIfNeeded(nocPage);
    await expect(publicationPanel(nocPage).getByTestId("publication-board")).toBeVisible({
      timeout: 20000
    });
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "02-publication-prepared.png"), fullPage: true });
    await nocContext.close();
  });

  test("FLOW B — step DONE lifecycle", async ({ page, browser }) => {
    const { nocPage, nocContext } = await createPublicationProject(page, browser);
    await preparePublicationIfNeeded(nocPage);
    await nocPage.locator("#noc-publicacion .noc-dev-list__item").first().click();
    await expect(nocPage.locator("#noc-pub-step-detail")).toBeVisible({ timeout: 10000 });
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "03-step-detail.png"), fullPage: true });
    const status = nocPage.locator('#noc-pub-step-detail select[aria-label="Estado del paso"]');
    for (const value of ["READY", "IN_PROGRESS", "REVIEW", "DONE"] as const) {
      await Promise.all([
        nocPage.waitForResponse(
          (r) =>
            r.url().includes("/publication/steps/") &&
            r.request().method() === "PATCH" &&
            r.status() === 200
        ),
        status.selectOption(value)
      ]);
    }
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "04-step-done.png"), fullPage: true });
    await expect(publicationPanel(nocPage).getByTestId("publication-progress")).not.toContainText("0%", {
      timeout: 15000
    });
    await nocContext.close();
  });

  test("FLOW C — blocker unblock", async ({ page, browser }) => {
    const { nocPage, nocContext } = await createPublicationProject(page, browser);
    await preparePublicationIfNeeded(nocPage);
    await nocPage.locator("#noc-publicacion .noc-dev-list__item").first().click();
    const stepDetail = nocPage.locator("#noc-pub-step-detail");
    await stepDetail.getByRole("button", { name: "Bloquear" }).click();
    await nocPage.locator("dialog textarea").fill("Esperando acceso DNS");
    await nocPage.getByLabel("Bloquear paso").getByRole("button", { name: "Bloquear" }).click();
    await expect(publicationPanel(nocPage).getByTestId("publication-readiness")).toContainText(/No listo/i);
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "05-step-blocked.png"), fullPage: true });
    await stepDetail.getByRole("button", { name: "Desbloquear" }).click();
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "06-step-unblocked.png"), fullPage: true });
    await nocContext.close();
  });

  test("FLOW D — NOT_APPLICABLE optional", async ({ page, browser }) => {
    const { nocPage, nocContext } = await createPublicationProject(page, browser);
    await preparePublicationIfNeeded(nocPage);
    const optional = nocPage.locator('#noc-publicacion .noc-dev-list__item[data-step-status="TODO"]').last();
    await optional.click();
    await nocPage.locator('#noc-pub-step-detail select[aria-label="Estado del paso"]').selectOption("NOT_APPLICABLE");
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "07-not-applicable.png"), fullPage: true });
    await nocContext.close();
  });

  test("FLOW E — publication overview", async ({ page, browser }) => {
    const { nocPage, nocContext } = await createPublicationProject(page, browser);
    await preparePublicationIfNeeded(nocPage);
    await expect(publicationPanel(nocPage).getByTestId("publication-progress")).toBeVisible();
    await expect(publicationPanel(nocPage).getByTestId("publication-readiness")).toBeVisible();
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "08-publication-overview.png"), fullPage: true });
    await nocContext.close();
  });

  test("FLOW F — readiness not ready then ready", async ({ page, browser }) => {
    const { nocPage, nocContext, projectId, organizationId, origin } = await createPublicationProject(
      page,
      browser
    );
    await preparePublicationIfNeeded(nocPage);
    await expect(publicationPanel(nocPage).getByTestId("publication-readiness")).toContainText(/No listo/i);
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "09-readiness-not-ready.png"), fullPage: true });
    await completeRequiredPublicationSteps(nocPage.request, projectId, organizationId, origin);
    await nocPage.reload();
    await nocPage.locator('a[href="#noc-publicacion"]').click();
    await expect(publicationPanel(nocPage).getByTestId("complete-project-btn")).toBeVisible({
      timeout: 15000
    });
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "10-readiness-ready.png"), fullPage: true });
    await nocContext.close();
  });

  test("FLOW G — complete project + completion handoff", async ({ page, browser }) => {
    const { nocPage, nocContext, projectId, organizationId, origin } = await createPublicationProject(
      page,
      browser
    );
    await preparePublicationIfNeeded(nocPage);
    await completeRequiredPublicationSteps(nocPage.request, projectId, organizationId, origin);
    await nocPage.reload();
    await nocPage.locator('a[href="#noc-publicacion"]').click();
    await publicationPanel(nocPage).getByTestId("complete-project-btn").click();
    await publicationPanel(nocPage).getByTestId("confirm-complete-btn").click();
    await expect(publicationPanel(nocPage).getByTestId("completion-handoff")).toBeVisible({
      timeout: 15000
    });
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "11-completion-handoff.png"), fullPage: true });
    await nocContext.close();
  });

  test("FLOW H — responsive + print", async ({ page, browser }) => {
    const { nocPage, nocContext } = await createPublicationProject(page, browser);
    await preparePublicationIfNeeded(nocPage);
    await nocPage.setViewportSize({ width: 390, height: 844 });
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "12-publication-390.png"), fullPage: true });
    await nocPage.emulateMedia({ media: "print" });
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "13-publication-print.png"), fullPage: true });
    await nocContext.close();
  });
});
