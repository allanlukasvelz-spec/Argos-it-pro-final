import { test, expect, type Page } from "@playwright/test";

const BACKEND = "http://127.0.0.1:4000";
const PASSWORD = "E2eSecure2026!x";

function uniqueEmail(): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `argos-e2e-${ts}-${rand}@example.test`;
}

async function getLocalStorage(page: Page, key: string): Promise<string | null> {
  return page.evaluate((k) => localStorage.getItem(k), key);
}

async function getCookie(page: Page, name: string): Promise<string | undefined> {
  const cookies = await page.context().cookies();
  return cookies.find((c) => c.name === name)?.value;
}

async function loginViaUI(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/auth/login");
  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(password);

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

test.describe.serial("authenticated flow: register → login → dashboard → logout", () => {
  const email = uniqueEmail();
  let capturedRefreshToken: string | null = null;

  test("register a new user", async ({ page }) => {
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

  test("login with the registered user and reach dashboard", async ({ page }) => {
    await loginViaUI(page, email, PASSWORD);

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

  test("logout clears all tokens and session cookie", async ({ page }) => {
    await loginViaUI(page, email, PASSWORD);

    capturedRefreshToken = await getLocalStorage(page, "refreshToken");
    expect(capturedRefreshToken).toBeTruthy();

    await page
      .getByRole("button", { name: /Cerrar sesión|Sign out/i })
      .click();

    await expect(page).toHaveURL(/^\/$|\/auth\/login/, { timeout: 10_000 });

    await page.waitForFunction(() => localStorage.getItem("token") === null, null, {
      timeout: 6_000
    });

    const token = await getLocalStorage(page, "token");
    expect(token).toBeNull();

    const refreshToken = await getLocalStorage(page, "refreshToken");
    expect(refreshToken).toBeNull();

    const sessionCookie = await getCookie(page, "argos_session");
    expect(sessionCookie).toBeUndefined();
  });

  test("revoked refresh token returns 401", async ({ request }) => {
    expect(capturedRefreshToken).toBeTruthy();

    const response = await request.post(`${BACKEND}/api/auth/refresh`, {
      data: { refreshToken: capturedRefreshToken },
    });

    expect(response.status()).toBe(401);
  });

  test("dashboard redirects to login after logout", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10_000 });
  });
});
