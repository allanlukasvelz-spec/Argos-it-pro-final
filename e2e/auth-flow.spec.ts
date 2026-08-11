import { test, expect, type Page, type APIRequestContext } from "@playwright/test";

const BACKEND = "http://127.0.0.1:4000";
const PASSWORD = "E2eSecure2026!x";

function uniqueEmail(): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `argos-e2e-${ts}-${rand}@example.test`;
}

async function registerViaAPI(request: APIRequestContext, email: string): Promise<void> {
  const res = await request.post(`${BACKEND}/api/auth/register`, {
    data: { email, password: PASSWORD, name: "E2E User", company: "E2E Corp" },
  });
  expect(res.status(), "register API should return 201").toBe(201);
}

async function loginViaUI(page: Page, email: string): Promise<void> {
  await page.goto("/auth/login");
  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(PASSWORD);

  const [response] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/api/auth/login") && r.request().method() === "POST",
      { timeout: 15_000 }
    ),
    page.getByRole("button", { name: /Iniciar sesion/i }).click(),
  ]);
  expect(response.status(), "login API should return 200").toBe(200);

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
}

async function getLocalStorage(page: Page, key: string): Promise<string | null> {
  return page.evaluate((k) => localStorage.getItem(k), key);
}

async function getCookie(page: Page, name: string): Promise<string | undefined> {
  const cookies = await page.context().cookies();
  return cookies.find((c) => c.name === name)?.value;
}

// Auth calls per test: register(1) = 1 auth req
test.describe("authenticated flow", () => {

  // Auth calls: 1 register (via UI)
  test("register a new user via UI", async ({ page }) => {
    const email = uniqueEmail();

    await page.goto("/auth/register");
    await expect(
      page.getByRole("heading", { name: /Crear cuenta ARGOS-IT/i })
    ).toBeVisible();

    await page.locator("#register-name").fill("E2E Test User");
    await page.locator("#register-email").fill(email);
    await page.locator("#register-company").fill("E2E Corp");
    await page.locator("#register-password").fill(PASSWORD);

    const [response] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes("/api/auth/register") && r.request().method() === "POST",
        { timeout: 15_000 }
      ),
      page.getByRole("button", { name: /Registrarse/i }).click(),
    ]);
    expect(response.status(), "register API should return 201").toBe(201);

    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10_000 });

    const token = await getLocalStorage(page, "token");
    expect(token).toBeNull();
  });

  // Auth calls: 1 register (API) + 1 login (UI) = 2 auth reqs
  test("login reaches dashboard with tokens and cookie", async ({ page, request }) => {
    const email = uniqueEmail();
    await registerViaAPI(request, email);

    await loginViaUI(page, email);

    await expect(
      page.getByRole("heading", { name: /Portal de cliente|Client portal/i })
    ).toBeVisible();

    const token = await getLocalStorage(page, "token");
    expect(token).toBeTruthy();

    const refreshToken = await getLocalStorage(page, "refreshToken");
    expect(refreshToken).toBeTruthy();

    const sessionCookie = await getCookie(page, "argos_session");
    expect(sessionCookie).toBe("1");
  });

  // Auth calls: 1 register (API) + 1 login (UI) + 1 refresh (API) = 3 auth reqs
  test("logout clears state and revokes refresh token", async ({ page, request }) => {
    const email = uniqueEmail();
    await registerViaAPI(request, email);
    await loginViaUI(page, email);

    const refreshToken = await getLocalStorage(page, "refreshToken");
    expect(refreshToken).toBeTruthy();

    await page
      .getByRole("button", { name: /Cerrar sesión|Sign out/i })
      .click();

    await expect(page).toHaveURL(/^\/$|\/auth\/login/, { timeout: 10_000 });

    await page.waitForFunction(
      () => localStorage.getItem("token") === null,
      null,
      { timeout: 6_000 }
    );

    const tokenAfter = await getLocalStorage(page, "token");
    expect(tokenAfter).toBeNull();

    const rtAfter = await getLocalStorage(page, "refreshToken");
    expect(rtAfter).toBeNull();

    const cookie = await getCookie(page, "argos_session");
    expect(cookie).toBeUndefined();

    const refreshResponse = await request.post(`${BACKEND}/api/auth/refresh`, {
      data: { refreshToken },
    });
    expect(refreshResponse.status(), "revoked refresh should return 401").toBe(401);
  });

  // Auth calls: 0 (no auth needed — unauthenticated access)
  test("dashboard redirects unauthenticated visitor to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10_000 });
  });
});
