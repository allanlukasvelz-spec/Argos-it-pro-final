const IS_PROD = process.env.NODE_ENV === "production";

const ACCESS_COOKIE = "argos_access";
const REFRESH_COOKIE = "argos_refresh";
const SESSION_COOKIE = "argos_session";

const ACCESS_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const baseCookieOpts = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: "lax",
};

function setTokenCookies(res, accessToken, refreshToken) {
  res.cookie(ACCESS_COOKIE, accessToken, {
    ...baseCookieOpts,
    path: "/",
    maxAge: ACCESS_MAX_AGE_MS,
  });

  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...baseCookieOpts,
    path: "/api/auth",
    maxAge: REFRESH_MAX_AGE_MS,
  });

  res.cookie(SESSION_COOKIE, "1", {
    httpOnly: false,
    secure: IS_PROD,
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_MAX_AGE_MS,
  });
}

function clearTokenCookies(res) {
  res.clearCookie(ACCESS_COOKIE, { path: "/" });
  res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}

module.exports = {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  SESSION_COOKIE,
  setTokenCookies,
  clearTokenCookies,
};
