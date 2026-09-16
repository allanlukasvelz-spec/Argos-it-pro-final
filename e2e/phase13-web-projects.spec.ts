import { test, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { resetAuthRateLimits } from "./helpers/resetRateLimits";
import { BACKEND } from "./helpers/e2eEnv";
import { gotoE2e } from "./helpers/e2eNav";
import { dismissCookieBanner } from "./helpers/loginUi";
import { promoteEmailToAdmin } from "./helpers/promoteNocAdmin";

const PASSWORD = "E2eSecure2026!x";
const SHOT_DIR = path.join(process.cwd(), "artifacts/phase13-web-projects");

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

const TOUR_RESPONSES = SERVICE_RESPONSES.map((row) =>
  row.fieldKey === "company_trade_name"
    ? { fieldKey: "company_trade_name", value: "Demo Activities" }
    : row.fieldKey === "offer_kinds"
      ? { fieldKey: "offer_kinds", value: ["experiences"] }
      : row.fieldKey === "sales_mode"
        ? { fieldKey: "sales_mode", value: "online_booking" }
        : row
);

test.beforeEach(async () => {
  try {
    await resetAuthRateLimits();
  } catch {
    // Backend reutilizado sin /api/test/reset-rate-limits; emails únicos aíslan el límite.
  }
  mkdirSync(SHOT_DIR, { recursive: true });
});

function uniqueEmail(prefix: string) {
  return `argos-e2e-p13-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.test`;
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

async function createArchitectureProject(
  page: Page,
  browser: Browser,
  responses: typeof SERVICE_RESPONSES,
  items: Array<{ itemType: string; title: string; payload?: Record<string, string> }>
) {
  try {
    await resetAuthRateLimits();
  } catch {
    // Backend reutilizado sin endpoint de reset.
  }
  const clientEmail = uniqueEmail("client");
  const origin = process.env.E2E_ORIGIN || "http://127.0.0.1:3000";
  const reg = await page.request.post(`${BACKEND}/api/auth/register`, {
    data: { email: clientEmail, password: PASSWORD, name: "Demo Client", company: "ARGOS" },
    headers: { Origin: origin, "Content-Type": "application/json" }
  });
  expect(reg.ok()).toBeTruthy();
  const clientCookie = await loginCookies(page.request, clientEmail);

  const createRes = await page.request.post(`${BACKEND}/api/client/web-projects`, {
    data: { title: "Demo Architecture Project", projectType: "create" },
    headers: { Origin: origin, "Content-Type": "application/json", Cookie: clientCookie }
  });
  expect(createRes.ok()).toBeTruthy();
  const projectId = Number((await createRes.json()).project.id);
  const clientHeaders = { Origin: origin, "Content-Type": "application/json", Cookie: clientCookie };
  const formRes = await page.request.post(`${BACKEND}/api/client/web-projects/${projectId}/form`, {
    data: { responses },
    headers: clientHeaders
  });
  expect(formRes.ok()).toBeTruthy();
  for (const item of items) {
    await page.request.post(`${BACKEND}/api/client/web-projects/${projectId}/items`, {
      data: item,
      headers: clientHeaders
    });
  }
  const submit = await page.request.post(`${BACKEND}/api/client/web-projects/${projectId}/submit-review`, {
    headers: clientHeaders
  });
  expect(submit.ok()).toBeTruthy();

  const projectRes = await page.request.get(`${BACKEND}/api/client/web-projects/${projectId}`, {
    headers: { Origin: origin, Cookie: clientCookie }
  });
  const projectJson = await projectRes.json();
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
  const nocOrigin = origin;
  await nocPage.request.post(
    `${BACKEND}/api/noc/web-projects/${projectId}/start-architecture?organization_id=${organizationId}`,
    {
      data: { acknowledgeOpenItems: true, reason: "E2E Phase 13 — avisos conocidos en fixture." },
      headers: { Origin: nocOrigin, "Content-Type": "application/json" }
    }
  );
  await nocPage.goto(`/noc/projects/${projectId}?organization_id=${organizationId}`);
  await nocPage.locator('a[href="#noc-arquitectura"]').click();
  return { nocPage, nocContext, projectId, organizationId, nocOrigin };
}

async function closeNoc(nocPage: Page, nocContext: BrowserContext) {
  await nocPage.close();
  await nocContext.close();
}

async function generateArchitecture(nocPage: Page) {
  await expect(nocPage.locator("#noc-arch-empty")).toBeVisible({ timeout: 15000 });
  await nocPage.getByRole("button", { name: "Crear propuesta de arquitectura" }).click();
  await expect(nocPage.getByRole("heading", { name: "Sitemap" })).toBeVisible({ timeout: 20000 });
}

test.describe("PHASE 13 information architecture closure", () => {
  test.describe.configure({ mode: "serial", timeout: 360000 });

  test("FLOW A — service business generate proposal", async ({ page, browser }) => {
    const { nocPage, nocContext } = await createArchitectureProject(page, browser, SERVICE_RESPONSES, [
      { itemType: "service", title: "Consultoría", payload: { summary: "Servicio A" } },
      { itemType: "service", title: "Implementación", payload: { summary: "Servicio B" } }
    ]);
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "01-architecture-empty.png"), fullPage: true });
    await generateArchitecture(nocPage);
    await expect(nocPage.locator("#noc-arch-tree").getByRole("button", { name: /^Inicio/ })).toBeVisible();
    await expect(nocPage.locator("#noc-arch-tree").getByRole("button", { name: /Servicios/ })).toBeVisible();
    await expect(nocPage.locator("#noc-arch-tree").getByRole("button", { name: /Contacto/ })).toBeVisible();
    await expect(
      nocPage.locator("#noc-arch-tree").getByRole("button", { name: /Servicio \/servicios\/\[slug\]/ })
    ).toBeVisible();
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "02-architecture-generated.png"), fullPage: true });
    await nocPage.locator("#noc-arch-tree").screenshot({ path: path.join(SHOT_DIR, "03-sitemap-tree.png") });
    await closeNoc(nocPage, nocContext);
  });

  test("FLOW B — edit page, navigation, blocks, reorder", async ({ page, browser }) => {
    const { nocPage, nocContext } = await createArchitectureProject(page, browser, SERVICE_RESPONSES, [
      { itemType: "service", title: "Consultoría", payload: { summary: "A" } },
      { itemType: "service", title: "Implementación", payload: { summary: "B" } }
    ]);
    await generateArchitecture(nocPage);
    await nocPage.getByRole("button", { name: "Contacto" }).click();
    await nocPage.getByLabel("CTA principal").fill("Solicitar presupuesto");
    await nocPage.getByLabel("Prioridad SEO").selectOption("HIGH");
    await nocPage.getByLabel("Navegación").selectOption("PRIMARY");
    await nocPage.getByRole("button", { name: "Guardar página" }).click();
    await nocPage.getByRole("button", { name: "+ Añadir bloque" }).click();
    await expect(nocPage.getByText("Personalizado").first()).toBeVisible();
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "04-page-editor.png"), fullPage: true });
    await nocPage.locator(".noc-arch-blocks").screenshot({ path: path.join(SHOT_DIR, "05-page-blocks.png") });
    await closeNoc(nocPage, nocContext);
  });

  test("FLOW C — route conflict INVALID then fix READY", async ({ page, browser }) => {
    const { nocPage, nocContext, projectId, organizationId } = await createArchitectureProject(page, browser, SERVICE_RESPONSES, [
      { itemType: "service", title: "A", payload: { summary: "A" } },
      { itemType: "service", title: "B", payload: { summary: "B" } }
    ]);
    await expect(nocPage.locator("#noc-arch-empty")).toBeVisible({ timeout: 15000 });
    const [generateRes] = await Promise.all([
      nocPage.waitForResponse(
        (r) => r.url().includes("/architecture/generate") && r.request().method() === "POST" && r.status() === 201
      ),
      nocPage.getByRole("button", { name: "Crear propuesta de arquitectura" }).click()
    ]);
    await expect(nocPage.getByRole("heading", { name: "Sitemap" })).toBeVisible({ timeout: 20000 });
    const contactPage = (await generateRes.json()).pages.find(
      (p: { pageType: string }) => p.pageType === "CONTACT"
    );
    expect(contactPage?.id).toBeTruthy();
    const conflictStatus = await nocPage.evaluate(
      async ({ backend, urlPath, body }) => {
        const r = await fetch(`${backend}${urlPath}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        return r.status;
      },
      {
        backend: BACKEND,
        urlPath: `/api/noc/web-projects/${projectId}/architecture/pages/${contactPage.id}?organization_id=${organizationId}`,
        body: { slug: "servicios" }
      }
    );
    expect(conflictStatus).toBe(200);
    await nocPage.getByRole("button", { name: "Revalidar" }).click();
    await expect(nocPage.locator(".noc-arch-validation strong")).toHaveText("Necesita correcciones", {
      timeout: 15000
    });
    await expect(nocPage.getByText(/Ruta duplicada|duplicad/i)).toBeVisible();
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "06-route-validation-error.png"), fullPage: true });
    const fixStatus = await nocPage.evaluate(
      async ({ backend, urlPath, body }) => {
        const r = await fetch(`${backend}${urlPath}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        return r.status;
      },
      {
        backend: BACKEND,
        urlPath: `/api/noc/web-projects/${projectId}/architecture/pages/${contactPage.id}?organization_id=${organizationId}`,
        body: { slug: "contacto" }
      }
    );
    expect(fixStatus).toBe(200);
    await nocPage.getByRole("button", { name: "Revalidar" }).click();
    await expect(nocPage.locator(".noc-arch-validation strong")).toHaveText(/Lista|Lista con avisos/, {
      timeout: 15000
    });
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "07-architecture-ready.png"), fullPage: true });
    await closeNoc(nocPage, nocContext);
  });

  test("FLOW D — Demo Activities tour architecture", async ({ page, browser }) => {
    const { nocPage, nocContext } = await createArchitectureProject(page, browser, TOUR_RESPONSES, [
      { itemType: "tour", title: "City Walk", payload: { summary: "Paseo urbano" } },
      { itemType: "tour", title: "Coast Tour", payload: { summary: "Ruta costera" } }
    ]);
    await generateArchitecture(nocPage);
    await expect(nocPage.locator("#noc-arch-tree").getByRole("button", { name: /Actividades/ })).toBeVisible();
    await expect(
      nocPage.locator("#noc-arch-tree").getByRole("button", { name: /Actividad \/actividades\/\[slug\]/ })
    ).toBeVisible();
    await expect(nocPage.locator("#noc-resumen, .noc-wp-detail").getByText("Demo Activities")).toBeVisible();
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "11-tour-architecture.png"), fullPage: true });
    await closeNoc(nocPage, nocContext);
  });

  test("FLOW E — approve v1, revision v2, supersede", async ({ page, browser }) => {
    const { nocPage, nocContext } = await createArchitectureProject(page, browser, SERVICE_RESPONSES, [
      { itemType: "service", title: "A", payload: { summary: "A" } },
      { itemType: "service", title: "B", payload: { summary: "B" } }
    ]);
    await generateArchitecture(nocPage);
    await nocPage.getByRole("button", { name: "Aprobar arquitectura" }).click();
    await expect(nocPage.locator("#noc-arquitectura .noc-badge")).toContainText("Aprobada", { timeout: 15000 });
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "08-architecture-approval.png"), fullPage: true });
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "09-approved-architecture.png"), fullPage: true });
    await expect(nocPage.getByRole("button", { name: "Guardar página" })).toHaveCount(0);
    await nocPage.getByRole("button", { name: "Crear revisión" }).click();
    await expect(nocPage.locator("#noc-arquitectura .noc-badge")).toContainText(/v2 · Borrador/, { timeout: 15000 });
    await nocPage.getByRole("button", { name: "Contacto" }).click();
    await nocPage.getByLabel("Objetivo").fill("Canal de contacto revisado en v2.");
    await nocPage.getByRole("button", { name: "Guardar página" }).click();
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "10-architecture-revision.png"), fullPage: true });
    await nocPage.getByRole("button", { name: "Aprobar arquitectura" }).click();
    await expect(nocPage.locator("#noc-arquitectura .noc-badge")).toContainText("Aprobada", { timeout: 15000 });
    await closeNoc(nocPage, nocContext);
  });

  test("FLOW F — start mockup modal and transition", async ({ page, browser }) => {
    const { nocPage, nocContext, projectId, organizationId } = await createArchitectureProject(page, browser, SERVICE_RESPONSES, [
      { itemType: "service", title: "A", payload: { summary: "A" } },
      { itemType: "service", title: "B", payload: { summary: "B" } }
    ]);
    await generateArchitecture(nocPage);
    await nocPage.getByRole("button", { name: "Aprobar arquitectura" }).click();
    await expect(nocPage.locator("#noc-arquitectura .noc-badge")).toContainText("Aprobada", { timeout: 15000 });
    await nocPage.getByRole("button", { name: "Pasar a maqueta" }).click();
    await expect(nocPage.getByRole("heading", { name: "Pasar a maqueta" })).toBeVisible();
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "12-start-mockup-confirmation.png"), fullPage: true });
    await nocPage.getByRole("button", { name: "Confirmar" }).click();
    await expect(nocPage.locator(".noc-brief__header, .noc-panel").getByText(/Maqueta/i).first()).toBeVisible({
      timeout: 15000
    });
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "13-project-mockup-state.png"), fullPage: true });

    for (const width of [1440, 1024, 768, 390] as const) {
      await nocPage.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      const overflow = await nocPage.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
      );
      expect(overflow, `overflow at ${width}`).toBeFalsy();
    }
    await nocPage.setViewportSize({ width: 390, height: 844 });
    await nocPage.locator("#noc-arquitectura").screenshot({ path: path.join(SHOT_DIR, "14-architecture-390.png") });
    await nocPage.setViewportSize({ width: 1440, height: 900 });
    await nocPage.emulateMedia({ media: "print" });
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "15-architecture-print.png"), fullPage: true });
    await closeNoc(nocPage, nocContext);

    expect(projectId).toBeGreaterThan(0);
    expect(organizationId).toBeGreaterThan(0);
  });

  test("Home regression — editorial order frozen", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("argos_locale", "es");
    });
    await gotoE2e(page, "/");
    await dismissCookieBanner(page);
    const indexes = page.locator(".argos-corp-section-index");
    await expect(indexes.nth(0)).toHaveText(/01 \/ Proyecto web/i);
    await expect(page.getByRole("link", { name: "Comenzar mi proyecto" })).toHaveAttribute("href", "/proyecto-web");
    const texts = (await indexes.allTextContents()).map((t) => t.replace(/\s+/g, " ").trim());
    expect(texts.some((t) => /^07 \/ Realidad del cliente/.test(t))).toBeTruthy();
    expect(texts.some((t) => /^08 \/ Continuidad/.test(t))).toBeTruthy();
  });
});
