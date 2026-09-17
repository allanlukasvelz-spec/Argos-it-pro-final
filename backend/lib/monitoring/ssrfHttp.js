/**
 * SSRF-safe HTTP GET/HEAD for Phase 3 monitors.
 * Ports 80/443 only. Revalidates DNS before connect. Blocks private redirects.
 */
const http = require("node:http");
const https = require("node:https");
const net = require("node:net");
const {
  validatePublicHostname,
  assertHostnameResolvesPublic,
  isPrivateOrReservedIp
} = require("../hostnameSecurity");
const { ERROR_CLASS } = require("./constants");

const MAX_REDIRECTS = 3;

/**
 * @param {string} hostname
 * @param {{ method?: string, path?: string, port?: number, timeoutMs?: number, protocol?: 'http'|'https' }} opts
 */
async function safeHttpProbe(hostname, opts = {}) {
  const v = validatePublicHostname(hostname);
  if (!v.ok) {
    return {
      ok: false,
      errorClass: ERROR_CLASS.SSRF_BLOCKED,
      error: v.error,
      statusCode: null,
      latencyMs: null,
      evidence: { blocked: true, reason: v.error }
    };
  }

  const protocol = opts.protocol === "http" ? "http" : "https";
  const port = opts.port != null ? Number(opts.port) : protocol === "https" ? 443 : 80;
  if (port !== 80 && port !== 443) {
    return {
      ok: false,
      errorClass: ERROR_CLASS.SSRF_BLOCKED,
      error: "Solo se permiten puertos 80 y 443.",
      statusCode: null,
      latencyMs: null,
      evidence: { blocked: true, port }
    };
  }

  const method = (opts.method || "GET").toUpperCase() === "HEAD" ? "HEAD" : "GET";
  const path = opts.path && String(opts.path).startsWith("/") ? String(opts.path).slice(0, 512) : "/";
  const timeoutMs = Math.min(Math.max(Number(opts.timeoutMs) || 8000, 1000), 60000);

  try {
    await assertHostnameResolvesPublic(v.hostname);
  } catch (err) {
    return {
      ok: false,
      errorClass: ERROR_CLASS.SSRF_BLOCKED,
      error: err.message,
      statusCode: null,
      latencyMs: null,
      evidence: { code: err.code || "SSRF_BLOCKED" }
    };
  }

  return followRequest({
    hostname: v.hostname,
    protocol,
    port,
    method,
    path,
    timeoutMs,
    redirectsLeft: MAX_REDIRECTS
  });
}

function followRequest(ctx) {
  return new Promise((resolve) => {
    const lib = ctx.protocol === "https" ? https : http;
    const started = Date.now();
    let settled = false;
    const finish = (payload) => {
      if (settled) return;
      settled = true;
      resolve(payload);
    };

    const req = lib.request(
      {
        hostname: ctx.hostname,
        port: ctx.port,
        path: ctx.path,
        method: ctx.method,
        timeout: ctx.timeoutMs,
        headers: {
          Host: ctx.hostname,
          "User-Agent": "ARGOS-Monitor/1.0",
          Accept: "*/*",
          Connection: "close"
        },
        // Observe TLS even with chain issues; health engine classifies separately for HTTP.
        rejectUnauthorized: false
      },
      (res) => {
        const statusCode = res.statusCode || 0;
        const location = res.headers.location;

        // Drain / abort body early
        res.resume();

        if (statusCode >= 300 && statusCode < 400 && location && ctx.redirectsLeft > 0) {
          const next = parseRedirect(ctx, location);
          if (!next.ok) {
            return finish({
              ok: false,
              errorClass: next.errorClass,
              error: next.error,
              statusCode,
              latencyMs: Date.now() - started,
              evidence: { redirect: location, blocked: true }
            });
          }
          res.destroy();
          return followRequest({
            ...next.ctx,
            redirectsLeft: ctx.redirectsLeft - 1,
            timeoutMs: ctx.timeoutMs,
            method: ctx.method
          }).then(finish);
        }

        const latencyMs = Date.now() - started;
        let errorClass = null;
        let ok = statusCode >= 200 && statusCode < 400;
        if (statusCode >= 500) {
          ok = false;
          errorClass = ERROR_CLASS.HTTP_5XX;
        } else if (statusCode >= 400) {
          ok = false;
          errorClass = ERROR_CLASS.HTTP_4XX;
        }

        finish({
          ok,
          errorClass,
          error: ok ? null : `HTTP ${statusCode}`,
          statusCode,
          latencyMs,
          evidence: {
            protocol: ctx.protocol,
            port: ctx.port,
            path: ctx.path,
            method: ctx.method,
            statusCode
          }
        });
      }
    );

    req.on("timeout", () => {
      req.destroy();
      finish({
        ok: false,
        errorClass: ERROR_CLASS.TIMEOUT,
        error: "Timeout de comprobacion HTTP.",
        statusCode: null,
        latencyMs: Date.now() - started,
        evidence: { timeoutMs: ctx.timeoutMs }
      });
    });

    req.on("error", (err) => {
      const msg = String(err.message || err);
      let errorClass = ERROR_CLASS.CONN_REFUSED;
      if (/ENOTFOUND|EAI_AGAIN/i.test(msg)) errorClass = ERROR_CLASS.DNS_FAILURE;
      if (/ETIMEDOUT|timeout/i.test(msg)) errorClass = ERROR_CLASS.TIMEOUT;
      finish({
        ok: false,
        errorClass,
        error: msg.slice(0, 200),
        statusCode: null,
        latencyMs: Date.now() - started,
        evidence: { code: err.code || null }
      });
    });

    req.end();
  });
}

function parseRedirect(ctx, location) {
  try {
    const base = `${ctx.protocol}://${ctx.hostname}:${ctx.port}${ctx.path}`;
    const url = new URL(location, base);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { ok: false, errorClass: ERROR_CLASS.REDIRECT_BLOCKED, error: "Protocolo de redirect no permitido." };
    }
    const host = url.hostname.toLowerCase();
    const v = validatePublicHostname(host);
    if (!v.ok) {
      return { ok: false, errorClass: ERROR_CLASS.SSRF_BLOCKED, error: v.error };
    }
    // IP literal in Location (hostnames already validated; isPrivateOrReservedIp is IP-only)
    if (net.isIP(host) && isPrivateOrReservedIp(host)) {
      return { ok: false, errorClass: ERROR_CLASS.SSRF_BLOCKED, error: "Redirect a IP privada bloqueado." };
    }
    const port = url.port
      ? Number(url.port)
      : url.protocol === "https:"
        ? 443
        : 80;
    if (port !== 80 && port !== 443) {
      return { ok: false, errorClass: ERROR_CLASS.SSRF_BLOCKED, error: "Redirect a puerto no permitido." };
    }
    return {
      ok: true,
      ctx: {
        hostname: v.hostname,
        protocol: url.protocol === "https:" ? "https" : "http",
        port,
        path: `${url.pathname || "/"}${url.search || ""}`.slice(0, 512)
      }
    };
  } catch {
    return { ok: false, errorClass: ERROR_CLASS.REDIRECT_BLOCKED, error: "Redirect invalido." };
  }
}

module.exports = {
  safeHttpProbe,
  parseRedirect
};
