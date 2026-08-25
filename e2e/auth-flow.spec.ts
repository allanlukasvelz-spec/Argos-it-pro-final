import { test, expect, type Page, type APIRequestContext, type Cookie } from "@playwright/test";
import { resetAuthRateLimits } from "./helpers/resetRateLimits";

const BACKEND = "http://127.0.0.1:4000";
const PASSWORD = "E2eSecure2026!x";

test.beforeEach(async () => {
  await resetAuthRateLimits();
});

function uniqueEmail(): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `argos-e2e-${ts}-${rand}@example.test`;
}

async function registerViaAPI(request: APIRequestContext, email: string): Promise<void> {
  const res = await request.post(`${BACKEND}/api/auth/register`, {
    data: { email, password: PASSWORD, name: "E2E User", company: "E2E Corp" },
  });
  expect(res.status(), `register API should return 201 (got ${res.status()})`).toBe(201);
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

function findCookie(cookies: Cookie[], name: string): Cookie | undefined {
  return cookies.find((c) => c.name === name);
}

test.describe("authenticated flow (HttpOnly cookies)", () => {

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
  });

  test("login sets HttpOnly cookies and reaches dashboard", async ({ page, request }) => {
    const email = uniqueEmail();
    await registerViaAPI(request, email);
    await loginViaUI(page, email);

    await expect(
      page.getByRole("heading", { name: /Portal de cliente|Client portal/i })
    ).toBeVisible();

    const cookies = await page.context().cookies();
    const access = findCookie(cookies, "argos_access");
    const refresh = findCookie(cookies, "argos_refresh");
    const session = findCookie(cookies, "argos_session");

    expect(access, "argos_access cookie should exist").toBeDefined();
    expect(access!.httpOnly, "argos_access should be HttpOnly").toBe(true);
    expect(access!.sameSite, "argos_access SameSite").toBe("Lax");

    expect(refresh, "argos_refresh cookie should exist").toBeDefined();
    expect(refresh!.httpOnly, "argos_refresh should be HttpOnly").toBe(true);
    expect(refresh!.path, "argos_refresh path").toBe("/api/auth");

    expect(session, "argos_session cookie should exist").toBeDefined();
    expect(session!.value).toBe("1");
    expect(session!.httpOnly, "argos_session should NOT be HttpOnly").toBe(false);

    const lsToken = await getLocalStorage(page, "token");
    expect(lsToken, "no access token in localStorage").toBeNull();

    const lsRefresh = await getLocalStorage(page, "refreshToken");
    expect(lsRefresh, "no refresh token in localStorage").toBeNull();
  });

  test("logout clears cookies and revokes refresh", async ({ page, request }) => {
    const email = uniqueEmail();
    await registerViaAPI(request, email);
    await loginViaUI(page, email);

    const preLogoutCookies = await page.context().cookies();
    const refreshBefore = findCookie(preLogoutCookies, "argos_refresh");
    expect(refreshBefore, "refresh cookie before logout").toBeDefined();

    await page
      .getByRole("button", { name: /Cerrar sesión|Sign out/i })
      .click();

    await expect(page).toHaveURL(/\/(auth\/login)?$/, { timeout: 10_000 });

    await page.waitForFunction(
      () => !document.cookie.includes("argos_session=1"),
      null,
      { timeout: 6_000 }
    );

    const postCookies = await page.context().cookies();
    expect(findCookie(postCookies, "argos_access"), "access cookie cleared").toBeUndefined();
    expect(findCookie(postCookies, "argos_session"), "session cookie cleared").toBeUndefined();

    const refreshResponse = await request.post(`${BACKEND}/api/auth/refresh`, {
      data: { refreshToken: refreshBefore!.value },
    });
    expect(refreshResponse.status(), "revoked refresh should return 401").toBe(401);
  });

  test("dashboard redirects unauthenticated visitor to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10_000 });
  });

  test("Bearer-only REST access is rejected with 401", async ({ page, request }) => {
    const email = uniqueEmail();
    await registerViaAPI(request, email);
    await loginViaUI(page, email);

    const cookies = await page.context().cookies();
    const access = findCookie(cookies, "argos_access");
    expect(access, "access cookie to reuse as Bearer").toBeDefined();

    await page.context().clearCookies();

    const bearerOnly = await request.get(`${BACKEND}/api/client/portal`, {
      headers: { Authorization: `Bearer ${access!.value}` },
    });
    expect(bearerOnly.status(), "Bearer-only REST must be 401").toBe(401);

    const noAuth = await request.get(`${BACKEND}/api/client/portal`);
    expect(noAuth.status(), "unauthenticated REST must be 401").toBe(401);
  });

  test("cookie auth works and CSRF Origin blocks refresh without Origin", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail();
    await registerViaAPI(request, email);
    await loginViaUI(page, email);

    const cookies = await page.context().cookies();
    const access = findCookie(cookies, "argos_access");
    const refresh = findCookie(cookies, "argos_refresh");
    expect(access).toBeDefined();
    expect(refresh).toBeDefined();

    const cookieHeader = `argos_access=${access!.value}; argos_refresh=${refresh!.value}`;

    const withCookies = await request.get(`${BACKEND}/api/client/portal`, {
      headers: { Cookie: `argos_access=${access!.value}` },
    });
    expect(withCookies.status(), "cookie access auth should be 200").toBe(200);

    const refreshNoOrigin = await request.post(`${BACKEND}/api/auth/refresh`, {
      headers: {
        Cookie: cookieHeader,
        "Content-Type": "application/json",
      },
      data: {},
    });
    expect(refreshNoOrigin.status(), "refresh without Origin must be 403").toBe(403);

    const refreshOk = await request.post(`${BACKEND}/api/auth/refresh`, {
      headers: {
        Cookie: cookieHeader,
        "Content-Type": "application/json",
        Origin: "http://127.0.0.1:3000",
      },
      data: {},
    });
    // Origin must be in CORS_ORIGINS / FRONTEND_URL; local default is localhost:3000
    const refreshLocalhost = refreshOk.status() === 200
      ? refreshOk
      : await request.post(`${BACKEND}/api/auth/refresh`, {
          headers: {
            Cookie: cookieHeader,
            "Content-Type": "application/json",
            Origin: "http://localhost:3000",
          },
          data: {},
        });
    expect(
      refreshLocalhost.status(),
      "refresh with allowed Origin must be 200"
    ).toBe(200);
  });
});
