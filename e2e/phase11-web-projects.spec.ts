import { test, expect, type APIRequestContext, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { resetAuthRateLimits } from "./helpers/resetRateLimits";
import { BACKEND, e2eAuthHeaders } from "./helpers/e2eEnv";
import { gotoE2e } from "./helpers/e2eNav";
import { dismissCookieBanner, loginViaUi } from "./helpers/loginUi";
import { promoteEmailToAdmin } from "./helpers/promoteNocAdmin";

const PASSWORD = "E2eSecure2026!x";
const SHOT_DIR = path.join(process.cwd(), "artifacts/phase11-web-projects");
const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=",
  "base64"
);

test.beforeEach(async () => {
  await resetAuthRateLimits();
  mkdirSync(SHOT_DIR, { recursive: true });
});

function uniqueEmail(): string {
  return `argos-e2e-p11-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;
}

const MIN_RESPONSES = [
  { fieldKey: "company_trade_name", value: "Example Studio" },
  { fieldKey: "company_city", value: "Valencia" },
  { fieldKey: "company_country", value: "España" },
  { fieldKey: "company_phone", value: "+34 600 000 000" },
  { fieldKey: "company_email", value: "hola@example-studio.test" },
  { fieldKey: "company_contact_name", value: "Ana Pérez" },
  { fieldKey: "company_entity_type", value: "company" },
  { fieldKey: "company_multiple_locations", value: "no" },
  { fieldKey: "has_existing_site", value: "no" },
  { fieldKey: "brand_has_logo", value: "yes" },
  { fieldKey: "brand_has_manual", value: "no" },
  { fieldKey: "about_who", value: "Un equipo de diseño" },
  { fieldKey: "about_what_you_do", value: "Diseñamos espacios y experiencias" },
  { fieldKey: "goals_objectives", value: ["professional_presence"] },
  { fieldKey: "goals_primary_success", value: "Una web clara" },
  { fieldKey: "goals_b2b_b2c", value: "both" },
  { fieldKey: "goals_priority", value: "normal" },
  { fieldKey: "offer_kinds", value: ["services", "experiences"] },
  { fieldKey: "content_has_texts", value: "no" },
  { fieldKey: "content_needs_copy", value: "yes" },
  { fieldKey: "media_has_photos", value: "no" },
  { fieldKey: "media_has_videos", value: "no" },
  { fieldKey: "media_needs_production", value: "yes" },
  { fieldKey: "media_commercial_rights", value: "pending" },
  { fieldKey: "primary_language", value: "es" },
  { fieldKey: "languages_multilingual", value: "no" },
  { fieldKey: "sales_mode", value: "contact_forms" },
  { fieldKey: "access_ack_no_secrets", value: "yes" },
  { fieldKey: "confirm_reviewed", value: "yes" },
  { fieldKey: "confirm_use_material", value: "yes" },
  { fieldKey: "confirm_authorization", value: "yes" }
];

async function saveField(page: Page, key: string, value: string) {
  const root = page.locator(`#wp-field-${key}`);
  const radio = root.getByRole("radio", { name: value, exact: false });
  if (await radio.count()) {
    await radio.first().check();
  } else {
    const control = root.locator("textarea, input:not([type=radio]):not([type=checkbox]), select").first();
    await control.fill(value);
  }
  await root.getByRole("button", { name: "Guardar" }).click();
  await expect(root.getByText("Guardado")).toBeVisible({ timeout: 15000 });
}

async function registerViaAPI(request: APIRequestContext, email: string, name = "ARGOS Staff") {
  const res = await request.post(`${BACKEND}/api/auth/register`, {
    data: { email, password: PASSWORD, name, company: "ARGOS" },
    headers: e2eAuthHeaders()
  });
  expect(res.status()).toBe(201);
}

function itemBlock(page: Page, heading: string) {
  return page.locator(".wp-item-block").filter({ hasText: heading });
}

test.describe("PHASE 11 home swap + questionnaire", () => {
  test.describe.configure({ timeout: 240000 });

  test("FLOW home swap 01 project / 07 reality and 02-06 stay put", async ({ page }) => {
    await gotoE2e(page, "/");
    await dismissCookieBanner(page);
    const indexes = page.locator(".argos-corp-section-index");
    await expect(indexes.nth(0)).toHaveText(/01 \/ Proyecto web|01 \/ Projecte web|01 \/ Web project/i);
    await expect(page.getByRole("link", { name: "Comenzar mi proyecto" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Crea o mejora tu web con ARGOS" })).toBeVisible();
    const texts = await indexes.allTextContents();
    const normalized = texts.map((text) => text.replace(/\s+/g, " ").trim());
    expect(normalized[0]).toMatch(/^01 \//);
    expect(normalized.some((text) => /^02 \//.test(text))).toBeTruthy();
    expect(normalized.some((text) => /^03 \//.test(text))).toBeTruthy();
    expect(normalized.some((text) => /^06 \//.test(text))).toBeTruthy();
    expect(normalized.some((text) => /^07 \/ (Realidad del cliente|Realitat del client|Client reality)/.test(text))).toBeTruthy();
    const i01 = normalized.findIndex((text) => text.startsWith("01 /"));
    const i02 = normalized.findIndex((text) => text.startsWith("02 /"));
    const i03 = normalized.findIndex((text) => text.startsWith("03 /"));
    const i06 = normalized.findIndex((text) => text.startsWith("06 /"));
    const i07 = normalized.findIndex((text) => text.startsWith("07 /"));
    expect(i01).toBeLessThan(i02);
    expect(i02).toBeLessThan(i03);
    expect(i03).toBeLessThan(i06);
    expect(i06).toBeLessThan(i07);
    await page.screenshot({ path: path.join(SHOT_DIR, "01-home-project-web-position-01.png"), fullPage: true });
    await page.locator("#home-problem-title").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(SHOT_DIR, "03-home-reality-client-position-07.png"), fullPage: false });
    await page.screenshot({ path: path.join(SHOT_DIR, "02-home-middle-blocks-02-06.png"), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoE2e(page, "/");
    await expect(page.getByRole("heading", { name: "Crea o mejora tu web con ARGOS" })).toBeVisible();
    await page.screenshot({ path: path.join(SHOT_DIR, "04-home-project-web-390.png"), fullPage: true });
  });

  test("FLOW 1-8 public start, questionnaire, items, submit, NOC correction", async ({
    page,
    request,
    browser
  }) => {
    const email = uniqueEmail();
    const staffEmail = uniqueEmail();
    await gotoE2e(page, "/");
    await dismissCookieBanner(page);
    await page.getByRole("link", { name: "Comenzar mi proyecto" }).click();
    await expect(page).toHaveURL(/\/proyecto-web/);
    await page.getByRole("link", { name: "Comenzar mi proyecto" }).last().click();
    await expect(page).toHaveURL(/\/proyecto-web\/comenzar/);

    await page.getByRole("radio", { name: /Crear una web nueva/i }).check();
    await page.getByLabel("Nombre").fill("Demo Client");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Contraseña").fill(PASSWORD);
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.waitForURL(/\/dashboard\/proyectos\/\d+/, { timeout: 30000 });

    await expect(page.getByRole("heading", { name: "Tu proyecto" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Apartados del cuestionario" })).toBeVisible();
    await page.screenshot({ path: path.join(SHOT_DIR, "05-questionnaire-overview.png"), fullPage: true });
    await page.screenshot({ path: path.join(SHOT_DIR, "06-section-company.png") });

    await saveField(page, "company_trade_name", "Example Studio");
    await saveField(page, "company_city", "Valencia");
    await page.getByRole("navigation", { name: "Apartados del cuestionario" }).getByRole("button", { name: /Tu marca/ }).click();
    await expect(page.getByRole("heading", { name: /Tu marca/ })).toBeVisible();
    await page.screenshot({ path: path.join(SHOT_DIR, "07-section-brand.png") });

    const origin = new URL(page.url()).origin;
    const id = Number(page.url().match(/proyectos\/(\d+)/)?.[1]);
    const formRes = await page.request.post(`${BACKEND}/api/client/web-projects/${id}/form`, {
      data: { responses: MIN_RESPONSES },
      headers: { Origin: origin, "Content-Type": "application/json" }
    });
    expect(formRes.ok()).toBeTruthy();

    await page.reload();
    await page.getByRole("navigation", { name: "Apartados del cuestionario" }).getByRole("button", { name: /Sobre vosotros/ }).click();
    await page.getByRole("button", { name: "Añadir persona" }).click();
    await itemBlock(page, "Equipo").locator('input[name="title"]').fill("Marta López");
    await itemBlock(page, "Equipo").locator('textarea[name="role"]').fill("Dirección");
    await itemBlock(page, "Equipo").getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText("Marta López")).toBeVisible({ timeout: 15000 });

    await page.getByRole("navigation", { name: "Apartados del cuestionario" }).getByRole("button", { name: /Servicios y productos/ }).click();
    await page.screenshot({ path: path.join(SHOT_DIR, "08-section-services.png") });
    await page.getByRole("button", { name: "Añadir servicio" }).click();
    await itemBlock(page, "Servicio").locator('input[name="title"]').fill("Consultoría de marca");
    await itemBlock(page, "Servicio").locator('textarea[name="summary"]').fill("Acompañamos el posicionamiento.");
    await itemBlock(page, "Servicio").getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText("Consultoría de marca")).toBeVisible();
    await page.screenshot({ path: path.join(SHOT_DIR, "09-repeatable-service.png") });

    await page.getByRole("button", { name: "Añadir actividad" }).click();
    await itemBlock(page, "Tour").locator('input[name="title"]').fill("Ruta costera");
    await itemBlock(page, "Tour").locator('textarea[name="itinerary"]').fill("Salida a las 09:00 y paseo hasta el mirador.");
    await itemBlock(page, "Tour").locator('textarea[name="price_adult"]').fill("45");
    await itemBlock(page, "Tour").getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText("Ruta costera")).toBeVisible();
    await page.screenshot({ path: path.join(SHOT_DIR, "10-repeatable-tour.png") });

    await page.getByRole("navigation", { name: "Apartados del cuestionario" }).getByRole("button", { name: /Contenido/ }).click();
    await page.getByRole("button", { name: "Añadir página" }).click();
    await itemBlock(page, "Página").locator('input[name="title"]').fill("Inicio");
    await itemBlock(page, "Página").locator('textarea[name="purpose"]').fill("Presentar el estudio.");
    await itemBlock(page, "Página").getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText("Inicio")).toBeVisible();

    await page.getByRole("navigation", { name: "Apartados del cuestionario" }).getByRole("button", { name: /Fotos y vídeos/ }).click();
    await expect(page.getByRole("heading", { name: /Documentación/ })).toBeVisible();
    const logoPath = path.join(SHOT_DIR, "fixture-logo.png");
    writeFileSync(logoPath, PNG_1X1);
    await page.locator('input[name="file"]').setInputFiles(logoPath);
    await page.locator('select[name="requirementKey"]').selectOption("LOGO");
    await page.getByRole("button", { name: "Subir documento" }).click();
    await expect(page.getByText("Documento guardado.")).toBeVisible({ timeout: 20000 });
    await page.screenshot({ path: path.join(SHOT_DIR, "11-documents.png") });

    await page.getByRole("navigation", { name: "Apartados del cuestionario" }).getByRole("button", { name: /Revisión final/ }).click();
    await page.screenshot({ path: path.join(SHOT_DIR, "12-validation-summary.png") });
    await page.getByRole("button", { name: "Enviar a ARGOS para revisión" }).click();
    await page.getByRole("button", { name: "Confirmar envío" }).click();
    await expect(page.getByText("Gracias. Hemos recibido la información para revisarla.")).toBeVisible();

    const projectRes = await page.request.get(`${BACKEND}/api/client/web-projects/${id}`, {
      headers: { Origin: origin }
    });
    expect(projectRes.ok()).toBeTruthy();
    const projectJson = await projectRes.json();
    const organizationId = Number(projectJson.project?.organizationId || projectJson.organizationId);

    await registerViaAPI(request, staffEmail);
    promoteEmailToAdmin(staffEmail);
    const nocPage = await browser.newPage();
    await loginViaUi(nocPage, staffEmail, PASSWORD);
    await nocPage.goto(`/noc/projects/${id}?organization_id=${organizationId}`);
    await expect(nocPage.getByText("Cuestionario (solo lectura)")).toBeVisible({ timeout: 20000 });
    await expect(nocPage.getByText("01 · Tu empresa")).toBeVisible();
    const fieldRow = nocPage.locator("li").filter({ hasText: "company_trade_name" });
    await fieldRow.getByLabel("Motivo de corrección").fill("Usa el nombre comercial público.");
    await fieldRow.getByRole("button", { name: "Solicitar corrección" }).click();
    await expect(fieldRow.getByText(/Usa el nombre comercial público/)).toBeVisible({ timeout: 15000 });
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "13-noc-review.png"), fullPage: true });
    await nocPage.close();

    await page.reload();
    await expect(page.getByRole("heading", { name: /Necesitamos que revises/ })).toBeVisible();
    await page.getByRole("navigation", { name: "Apartados del cuestionario" }).getByRole("button", { name: /Tu empresa/ }).click();
    await expect(page.getByText(/ARGOS necesita que revises este dato/)).toBeVisible();
    await page.screenshot({ path: path.join(SHOT_DIR, "14-client-correction.png"), fullPage: true });
    await saveField(page, "company_trade_name", "Example Studio Public");
    await expect(page.getByText(/ARGOS necesita que revises este dato/)).toHaveCount(0);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(SHOT_DIR, "15-questionnaire-390.png"), fullPage: true });
  });
});
