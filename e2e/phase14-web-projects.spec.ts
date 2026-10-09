import { test, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { resetAuthRateLimits } from "./helpers/resetRateLimits";
import { BACKEND } from "./helpers/e2eEnv";
import { gotoE2e } from "./helpers/e2eNav";
import { dismissCookieBanner } from "./helpers/loginUi";
import { promoteEmailToAdmin } from "./helpers/promoteNocAdmin";

const PASSWORD = "E2eSecure2026!x";
const SHOT_DIR = path.join(process.cwd(), "artifacts/phase14-web-projects");

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
  { fieldKey: "about_who", value: "Equipo de actividades de ejemplo" },
  { fieldKey: "about_what_you_do", value: "Experiencias guiadas" },
  { fieldKey: "goals_objectives", value: ["professional_presence"] },
  { fieldKey: "goals_primary_success", value: "Web clara de actividades" },
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
    // Backend reutilizado sin reset de rate limit.
  }
  mkdirSync(SHOT_DIR, { recursive: true });
});

function uniqueEmail(prefix: string) {
  return `argos-e2e-p14-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.test`;
}

async function createClientBrowserContext(
  browser: Browser,
  clientEmail: string,
  origin: string
) {
  const apiContext = await browser.newContext();
  const apiPage = await apiContext.newPage();
  const login = await apiPage.request.post(`${BACKEND}/api/auth/login`, {
    data: { email: clientEmail, password: PASSWORD },
    headers: { Origin: origin, "Content-Type": "application/json" }
  });
  expect(login.ok(), `client browser login ${clientEmail} → ${login.status()}`).toBeTruthy();
  const viewContext = await browser.newContext({ storageState: await apiContext.storageState() });
  await apiContext.close();
  return viewContext;
}

async function loginCookies(request: Page["request"], email: string) {
  const origin = process.env.E2E_ORIGIN || "http://127.0.0.1:3000";
  const res = await request.post(`${BACKEND}/api/auth/login`, {
    data: { email, password: PASSWORD },
    headers: { Origin: origin, "Content-Type": "application/json" }
  });
  expect(res.ok(), `login ${email} → ${res.status()}`).toBeTruthy();
  const setCookie = res.headers()["set-cookie"] || "";
  return setCookie.split(",").map((c) => c.split(";")[0]).join("; ");
}

async function createMockupProject(
  page: Page,
  browser: Browser,
  mode: "service" | "tour" = "service"
) {
  const clientEmail = uniqueEmail("client");
  const origin = process.env.E2E_ORIGIN || "http://127.0.0.1:3000";
  await page.request.post(`${BACKEND}/api/auth/register`, {
    data: { email: clientEmail, password: PASSWORD, name: "Demo Client", company: "ARGOS" },
    headers: { Origin: origin, "Content-Type": "application/json" }
  });
  const clientCookie = await loginCookies(page.request, clientEmail);
  const createRes = await page.request.post(`${BACKEND}/api/client/web-projects`, {
    data: { title: "Demo Mockup Project", projectType: "create" },
    headers: { Origin: origin, "Content-Type": "application/json", Cookie: clientCookie }
  });
  const projectId = Number((await createRes.json()).project.id);
  const clientHeaders = { Origin: origin, "Content-Type": "application/json", Cookie: clientCookie };
  await page.request.post(`${BACKEND}/api/client/web-projects/${projectId}/form`, {
    data: { responses: mode === "tour" ? TOUR_RESPONSES : SERVICE_RESPONSES },
    headers: clientHeaders
  });
  const items =
    mode === "tour"
      ? [
          { itemType: "tour", title: "Demo Activity A", payload: { summary: "Actividad demo A" } },
          { itemType: "tour", title: "Demo Activity B", payload: { summary: "Actividad demo B" } }
        ]
      : [
          { itemType: "service", title: "Demo Service", payload: { summary: "Servicio demo" } },
          { itemType: "service", title: "Consultoría", payload: { summary: "Consultoría demo" } }
        ];
  for (const item of items) {
    await page.request.post(`${BACKEND}/api/client/web-projects/${projectId}/items`, {
      data: item,
      headers: clientHeaders
    });
  }
  await page.request.post(`${BACKEND}/api/client/web-projects/${projectId}/submit-review`, { headers: clientHeaders });
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
  const staffLogin = await page.request.post(`${BACKEND}/api/auth/login`, {
    data: { email: staffEmail, password: PASSWORD },
    headers: { Origin: origin, "Content-Type": "application/json" }
  });
  expect(staffLogin.ok(), `staff login → ${staffLogin.status()}`).toBeTruthy();

  const nocContext = await browser.newContext({ storageState: await page.request.storageState() });
  const nocPage = await nocContext.newPage();
  await nocPage.request.post(
    `${BACKEND}/api/noc/web-projects/${projectId}/start-architecture?organization_id=${organizationId}`,
    {
      data: { acknowledgeOpenItems: true, reason: "E2E Phase 14 — avisos conocidos." },
      headers: { Origin: origin, "Content-Type": "application/json" }
    }
  );
  await nocPage.request.post(
    `${BACKEND}/api/noc/web-projects/${projectId}/architecture/generate?organization_id=${organizationId}`,
    { headers: { Origin: origin, "Content-Type": "application/json" } }
  );
  await nocPage.request.post(
    `${BACKEND}/api/noc/web-projects/${projectId}/architecture/approve?organization_id=${organizationId}`,
    { data: { acknowledgeWarnings: true }, headers: { Origin: origin, "Content-Type": "application/json" } }
  );
  await nocPage.request.post(
    `${BACKEND}/api/noc/web-projects/${projectId}/start-mockup?organization_id=${organizationId}`,
    { headers: { Origin: origin, "Content-Type": "application/json" } }
  );
  await nocPage.goto(`/noc/projects/${projectId}?organization_id=${organizationId}`);
  await expect(nocPage.locator('a[href="#noc-maqueta"]')).toBeVisible({ timeout: 30000 });
  await nocPage.locator('a[href="#noc-maqueta"]').click();
  return { nocPage, nocContext, projectId, organizationId, clientEmail, origin };
}

async function closeNoc(nocPage: Page, nocContext: BrowserContext) {
  await nocPage.close();
  await nocContext.close();
}

test.describe("PHASE 14 mockup closure", () => {
  test.describe.configure({ mode: "serial", timeout: 420000 });

  test("FLOW A — generate mockup from approved architecture", async ({ page, browser }) => {
    const { nocPage, nocContext } = await createMockupProject(page, browser);
    await expect(nocPage.locator(".noc-mockup-empty")).toBeVisible({ timeout: 15000 });
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "01-mockup-empty.png"), fullPage: true });
    await nocPage.getByRole("button", { name: "Generar maqueta desde arquitectura" }).click();
    await expect(nocPage.locator(".noc-mockup-layout")).toBeVisible({ timeout: 20000 });
    await expect(nocPage.locator(".noc-mockup-nav").getByRole("button").first()).toBeVisible();
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "02-mockup-generated.png"), fullPage: true });
    await closeNoc(nocPage, nocContext);
  });

  test("FLOW B — edit visual direction and section variant", async ({ page, browser }) => {
    const { nocPage, nocContext } = await createMockupProject(page, browser);
    await nocPage.getByRole("button", { name: "Generar maqueta desde arquitectura" }).click();
    await expect(nocPage.locator(".noc-mockup-layout")).toBeVisible({ timeout: 20000 });
    await nocPage.getByLabel("Color primario").fill("#224488");
    await nocPage.getByRole("button", { name: "Guardar dirección visual" }).click();
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "03-visual-direction.png"), fullPage: true });
    await nocPage.locator(".noc-mockup-nav").getByRole("button").nth(1).click();
    await nocPage.locator(".noc-mockup-section-list").getByRole("button").first().click();
    await nocPage.locator(".noc-mockup-props").getByLabel("Variante").selectOption({ index: 1 });
    await nocPage.getByRole("button", { name: "Guardar sección" }).click();
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "04-page-editor.png"), fullPage: true });
    await closeNoc(nocPage, nocContext);
  });

  test("FLOW C — responsive preview modes", async ({ page, browser }) => {
    const { nocPage, nocContext } = await createMockupProject(page, browser);
    await nocPage.getByRole("button", { name: "Generar maqueta desde arquitectura" }).click();
    await expect(nocPage.locator(".noc-mockup-layout")).toBeVisible({ timeout: 20000 });
    await nocPage.getByRole("tab", { name: /Escritorio/i }).click();
    await nocPage.locator(".noc-mockup-preview").screenshot({
      path: path.join(SHOT_DIR, "05-desktop-preview.png")
    });
    await nocPage.getByRole("tab", { name: /Tablet/i }).click();
    await nocPage.locator(".noc-mockup-preview").screenshot({
      path: path.join(SHOT_DIR, "06-tablet-preview.png")
    });
    await nocPage.getByRole("tab", { name: /Móvil/i }).click();
    await nocPage.locator(".noc-mockup-preview").screenshot({
      path: path.join(SHOT_DIR, "07-mobile-preview.png")
    });
    for (const width of [1440, 1024, 768, 390] as const) {
      await nocPage.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      const overflow = await nocPage.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
      );
      expect(overflow, `overflow at ${width}`).toBeFalsy();
    }
    await closeNoc(nocPage, nocContext);
  });

  test("FLOW D — template preview selector reuses one TOUR_DETAIL template", async ({ page, browser }) => {
    const { nocPage, nocContext } = await createMockupProject(page, browser, "tour");
    await nocPage.getByRole("button", { name: "Generar maqueta desde arquitectura" }).click();
    await expect(nocPage.locator(".noc-mockup-layout")).toBeVisible({ timeout: 20000 });

    const pageButtons = nocPage.locator(".noc-mockup-nav-list").getByRole("button");
    let detailPagesWithPreview = 0;
    let detailPageIndex = -1;
    const totalPages = await pageButtons.count();
    for (let i = 0; i < totalPages; i += 1) {
      await pageButtons.nth(i).click();
      if (await nocPage.locator(".noc-mockup-preview-selector").isVisible()) {
        detailPagesWithPreview += 1;
        detailPageIndex = i;
      }
    }
    expect(detailPagesWithPreview).toBe(1);
    await pageButtons.nth(detailPageIndex).click();

    const previewSelect = nocPage.locator("#mockup-preview-item");
    await expect(previewSelect).toBeVisible({ timeout: 10000 });
    await previewSelect.selectOption({ label: "Demo Activity A" });
    await expect(nocPage.locator(".noc-mockup-preview__sample")).toContainText("Demo Activity A");
    await previewSelect.selectOption({ label: "Demo Activity B" });
    await expect(nocPage.locator(".noc-mockup-preview__sample")).toContainText("Demo Activity B");
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "08-template-preview.png"), fullPage: true });
    await closeNoc(nocPage, nocContext);
  });

  test("FLOW E — send to client and request changes", async ({ page, browser }) => {
    const { nocPage, nocContext, projectId, clientEmail, origin } = await createMockupProject(page, browser);
    await nocPage.getByRole("button", { name: "Generar maqueta desde arquitectura" }).click();
    await expect(nocPage.locator(".noc-mockup-layout")).toBeVisible({ timeout: 20000 });
    await nocPage.getByRole("button", { name: "Enviar al cliente" }).click();
    await nocPage.getByRole("button", { name: "Confirmar envío" }).click();
    await expect(nocPage.locator("#noc-maqueta .noc-badge")).toContainText(/Revisión cliente/i, {
      timeout: 15000
    });

    const clientContext = await createClientBrowserContext(browser, clientEmail, origin);
    const clientPage = await clientContext.newPage();
    await gotoE2e(clientPage, `/dashboard/proyectos/${projectId}#wp-mockup`);
    await expect(clientPage.locator(".wp-mockup")).toBeVisible({ timeout: 20000 });
    await clientPage.screenshot({ path: path.join(SHOT_DIR, "09-client-review.png"), fullPage: true });
    await clientPage.getByRole("button", { name: "Solicitar cambios" }).click();
    await clientPage.getByLabel("Describe qué quieres cambiar").fill("Ajustar hero y tipografía del título.");
    await clientPage.getByRole("button", { name: "Enviar comentarios" }).click();
    await clientPage.screenshot({ path: path.join(SHOT_DIR, "10-client-request-changes.png"), fullPage: true });
    await clientContext.close();
    await closeNoc(nocPage, nocContext);
  });

  test("FLOW F — revision v2 and client approval", async ({ page, browser }) => {
    const { nocPage, nocContext, projectId, organizationId, clientEmail, origin } =
      await createMockupProject(page, browser);
    await nocPage.getByRole("button", { name: "Generar maqueta desde arquitectura" }).click();
    await expect(nocPage.locator(".noc-mockup-layout")).toBeVisible({ timeout: 20000 });
    await nocPage.getByRole("button", { name: "Enviar al cliente" }).click();
    await nocPage.getByRole("button", { name: "Confirmar envío" }).click();
    const clientCookie = await loginCookies(page.request, clientEmail);
    const changesRes = await page.request.post(
      `${BACKEND}/api/client/web-projects/${projectId}/mockup/request-changes`,
      {
        data: { message: "Cambios en CTA principal" },
        headers: { Origin: origin, "Content-Type": "application/json", Cookie: clientCookie }
      }
    );
    expect(changesRes.ok(), `request-changes → ${changesRes.status()}`).toBeTruthy();
    await nocPage.reload();
    await nocPage.locator('a[href="#noc-maqueta"]').click();
    await expect(nocPage.locator("#noc-maqueta .noc-badge")).toContainText(/Cambios solicitados/i, {
      timeout: 15000
    });
    const revisionRes = await nocPage.request.post(
      `${BACKEND}/api/noc/web-projects/${projectId}/mockup/revisions?organization_id=${organizationId}`,
      { headers: { Origin: origin, "Content-Type": "application/json" } }
    );
    expect(
      revisionRes.ok(),
      `mockup revision → ${revisionRes.status()} ${await revisionRes.text()}`
    ).toBeTruthy();
    await nocPage.reload();
    await nocPage.locator('a[href="#noc-maqueta"]').click();
    await expect(nocPage.locator("#noc-maqueta .noc-badge")).toContainText(/v2/i, { timeout: 20000 });
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "11-mockup-revision.png"), fullPage: true });
    await nocPage.getByRole("button", { name: "Enviar al cliente" }).click();
    await nocPage.getByRole("button", { name: "Confirmar envío" }).click();
    await expect(nocPage.locator("#noc-maqueta .noc-badge")).toContainText(/Revisión cliente/i, {
      timeout: 15000
    });
    const approveRes = await page.request.post(
      `${BACKEND}/api/client/web-projects/${projectId}/mockup/approve`,
      { headers: { Origin: origin, Cookie: clientCookie } }
    );
    expect(approveRes.ok(), `mockup approve → ${approveRes.status()} ${await approveRes.text()}`).toBeTruthy();
    await nocPage.reload();
    await nocPage.locator('a[href="#noc-maqueta"]').click();
    await expect(nocPage.locator("#noc-maqueta .noc-badge")).toContainText(/Aprobada/i, { timeout: 15000 });
    const clientContext = await createClientBrowserContext(browser, clientEmail, origin);
    const clientPage = await clientContext.newPage();
    await gotoE2e(clientPage, `/dashboard/proyectos/${projectId}#wp-mockup`);
    await expect(clientPage.locator(".wp-mockup")).toBeVisible({ timeout: 20000 });
    await clientPage.screenshot({ path: path.join(SHOT_DIR, "12-client-approved.png"), fullPage: true });
    await clientContext.close();
    await closeNoc(nocPage, nocContext);
  });

  test("FLOW G — start development after approval", async ({ page, browser }) => {
    const { nocPage, nocContext, projectId, clientEmail, origin } = await createMockupProject(page, browser);
    await nocPage.getByRole("button", { name: "Generar maqueta desde arquitectura" }).click();
    await nocPage.getByRole("button", { name: "Enviar al cliente" }).click();
    await nocPage.getByRole("button", { name: "Confirmar envío" }).click();
    const clientCookie = await loginCookies(page.request, clientEmail);
    await page.request.post(`${BACKEND}/api/client/web-projects/${projectId}/mockup/approve`, {
      headers: { Origin: origin, Cookie: clientCookie }
    });
    await nocPage.reload();
    await nocPage.getByRole("button", { name: "Iniciar desarrollo" }).click();
    await expect(nocPage.getByRole("heading", { name: "Iniciar desarrollo" })).toBeVisible();
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "13-start-development.png"), fullPage: true });
    await nocPage.getByRole("button", { name: "Confirmar", exact: true }).click();
    await expect(nocPage.locator(".noc-panel").getByText(/Desarrollo/i).first()).toBeVisible({ timeout: 15000 });
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "14-development-state.png"), fullPage: true });
    await nocPage.emulateMedia({ media: "print" });
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "15-mockup-print.png"), fullPage: true });
    await closeNoc(nocPage, nocContext);
  });
});
