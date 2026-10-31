/**
 * Hostname validation + SSRF guards for domain discovery (Phase 2).
 * Discovery is READ-ONLY and must not become an open proxy.
 */
const dns = require("node:dns").promises;
const net = require("node:net");
const tls = require("node:tls");
const { deriveTlsObservationStatus, detectWildcard, providerFromIssuer } = require("./tlsStatus");

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "metadata"
]);

const BLOCKED_SUFFIXES = [".localhost", ".local", ".internal", ".intranet", ".lan"];

/**
 * Normalize and validate a public DNS hostname (no scheme, no path, no IP literal).
 * @param {unknown} raw
 * @returns {{ ok: true, hostname: string } | { ok: false, error: string }}
 */
function validatePublicHostname(raw) {
  let host = String(raw ?? "")
    .trim()
    .toLowerCase();

  if (!host) {
    return { ok: false, error: "Hostname requerido." };
  }

  // Strip accidental schemes / paths
  host = host.replace(/^https?:\/\//i, "");
  host = host.split("/")[0];
  host = host.split("?")[0];
  host = host.split("#")[0];
  if (host.includes("@")) {
    return { ok: false, error: "Hostname no valido." };
  }
  // Strip port
  if (host.includes(":")) {
    const [h, port] = host.split(":");
    if (!/^\d+$/.test(port) || Number(port) !== 443) {
      return { ok: false, error: "Solo se permite el puerto 443 para discovery HTTPS/TLS." };
    }
    host = h;
  }

  if (host.length > 253) {
    return { ok: false, error: "Hostname demasiado largo." };
  }

  if (net.isIP(host)) {
    return { ok: false, error: "No se permiten direcciones IP literales." };
  }

  if (BLOCKED_HOSTNAMES.has(host)) {
    return { ok: false, error: "Hostname no permitido." };
  }

  for (const suffix of BLOCKED_SUFFIXES) {
    if (host.endsWith(suffix)) {
      return { ok: false, error: "Hostname no permitido." };
    }
  }

  // Basic FQDN: labels of alnum/hyphen, at least one dot
  if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/.test(host)) {
    return { ok: false, error: "Formato de hostname no valido." };
  }

  return { ok: true, hostname: host };
}

function isPrivateOrReservedIp(ip) {
  if (!ip || !net.isIP(ip)) return true;

  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    const [a, b] = parts;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a >= 224) return true; // multicast/reserved
    return false;
  }

  // IPv6
  const normalized = ip.toLowerCase();
  if (normalized === "::1") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // ULA
  if (normalized.startsWith("fe80")) return true; // link-local
  if (normalized.startsWith("::ffff:")) {
    const v4 = normalized.slice(7);
    return isPrivateOrReservedIp(v4);
  }
  return false;
}

/**
 * Resolve DNS and reject if any address is private/reserved.
 */
async function resolvePublicAddresses(hostname) {
  const result = { a: [], aaaa: [], cname: [], ns: [], mx: [], blocked: false, error: null };
  try {
    const [a, aaaa, cname, ns, mx] = await Promise.all([
      dns.resolve4(hostname).catch(() => []),
      dns.resolve6(hostname).catch(() => []),
      dns.resolveCname(hostname).catch(() => []),
      dns.resolveNs(hostname).catch(() => []),
      dns.resolveMx(hostname).catch(() => [])
    ]);
    result.a = a;
    result.aaaa = aaaa;
    result.cname = cname;
    result.ns = ns;
    result.mx = (mx || [])
      .sort((x, y) => x.priority - y.priority)
      .slice(0, 5)
      .map((m) => ({ exchange: m.exchange, priority: m.priority }));

    const allIps = [...a, ...aaaa];
    if (allIps.length === 0 && cname.length === 0) {
      // Might be apex with only NS — still allow TLS attempt if public DNS exists via lookup
    }
    for (const ip of allIps) {
      if (isPrivateOrReservedIp(ip)) {
        result.blocked = true;
        result.error = "Resolucion DNS hacia red privada/reservada bloqueada (SSRF).";
        return result;
      }
    }
  } catch (err) {
    result.error = "No se pudo resolver DNS.";
  }
  return result;
}

/**
 * Final lookup before connect — defend against DNS rebinding.
 */
async function assertHostnameResolvesPublic(hostname) {
  const lookup = await dns.lookup(hostname, { all: true, verbatim: true });
  if (!lookup.length) {
    throw Object.assign(new Error("Sin direcciones publicas resolubles."), { code: "SSRF_BLOCKED" });
  }
  for (const entry of lookup) {
    if (isPrivateOrReservedIp(entry.address)) {
      throw Object.assign(new Error("Destino privado bloqueado (SSRF)."), { code: "SSRF_BLOCKED" });
    }
  }
  return lookup;
}

/**
 * READ-ONLY TLS leaf observation on port 443.
 */
function observeTlsCertificate(hostname, timeoutMs = 8000) {
  return new Promise(async (resolve) => {
    let settled = false;
    const finish = (payload) => {
      if (settled) return;
      settled = true;
      resolve(payload);
    };

    try {
      await assertHostnameResolvesPublic(hostname);
    } catch (err) {
      return finish({
        ok: false,
        error: err.message,
        code: err.code || "SSRF_BLOCKED",
        observationStatus: "UNKNOWN"
      });
    }

    const socket = tls.connect(
      {
        host: hostname,
        port: 443,
        servername: hostname,
        rejectUnauthorized: false, // observe even with chain issues; report separately
        timeout: timeoutMs
      },
      () => {
        try {
          const cert = socket.getPeerCertificate(true);
          const authorized = socket.authorized;
          const authError = socket.authorizationError || null;

          if (!cert || !cert.raw) {
            socket.end();
            return finish({
              ok: false,
              error: "Sin certificado peer.",
              observationStatus: "UNKNOWN"
            });
          }

          const sans = parseSan(cert.subjectaltname);
          const subjectCn = cert.subject?.CN || null;
          const issuer = formatDn(cert.issuer);
          const subject = formatDn(cert.subject);
          const notBefore = cert.valid_from ? new Date(cert.valid_from) : null;
          const notAfter = cert.valid_to ? new Date(cert.valid_to) : null;
          const fingerprint = String(cert.fingerprint256 || "")
            .replace(/:/g, "")
            .toLowerCase();
          const serial = String(cert.serialNumber || "");
          const hostnameMatch = matchesHostname(hostname, sans, subjectCn);
          const chainError = !authorized;

          const derived = deriveTlsObservationStatus({
            notAfter,
            hostnameMatch,
            chainError,
            hasObservation: true
          });

          socket.end();
          finish({
            ok: true,
            provider: providerFromIssuer(issuer),
            serial,
            fingerprintSha256: fingerprint || null,
            issuer,
            subject,
            notBefore,
            notAfter,
            sans,
            isWildcard: detectWildcard(sans),
            hostnameMatch,
            chainError,
            authorizationError: authError ? String(authError) : null,
            observationStatus: derived.status,
            daysRemaining: derived.daysRemaining,
            riskHint: derived.riskHint,
            autoRenew: /let'?s encrypt/i.test(issuer || "") ? true : null,
            renewalMethod: /let'?s encrypt/i.test(issuer || "") ? "acme" : null
          });
        } catch (err) {
          try {
            socket.destroy();
          } catch {
            /* ignore */
          }
          finish({
            ok: false,
            error: "Error leyendo certificado.",
            observationStatus: "UNKNOWN"
          });
        }
      }
    );

    socket.on("error", (err) => {
      finish({
        ok: false,
        error: "No se pudo conectar por TLS.",
        detail: String(err.message || "").slice(0, 200),
        observationStatus: "UNKNOWN"
      });
    });

    socket.setTimeout(timeoutMs, () => {
      socket.destroy();
      finish({
        ok: false,
        error: "Timeout TLS.",
        observationStatus: "UNKNOWN"
      });
    });
  });
}

function parseSan(subjectaltname) {
  if (!subjectaltname || typeof subjectaltname !== "string") return [];
  return subjectaltname
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.toLowerCase().startsWith("dns:"))
    .map((part) => part.slice(4).trim().toLowerCase())
    .filter(Boolean);
}

function formatDn(dn) {
  if (!dn || typeof dn !== "object") return null;
  return Object.entries(dn)
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");
}

function matchesHostname(hostname, sans, cn) {
  const host = String(hostname).toLowerCase();
  const candidates = [...(sans || [])];
  if (cn) candidates.push(String(cn).toLowerCase());
  return candidates.some((pattern) => hostnameMatchesPattern(host, pattern));
}

function hostnameMatchesPattern(hostname, pattern) {
  const p = String(pattern || "").toLowerCase();
  if (!p) return false;
  if (p.startsWith("*.")) {
    const suffix = p.slice(1); // .example.com
    return hostname.endsWith(suffix) && hostname.length > suffix.length;
  }
  return hostname === p;
}

/**
 * Full READ-ONLY discovery for a validated hostname.
 */
async function discoverHostname(rawHostname) {
  const validated = validatePublicHostname(rawHostname);
  if (!validated.ok) {
    return { ok: false, error: validated.error, code: "INVALID_HOSTNAME" };
  }

  const hostname = validated.hostname;
  const dnsInfo = await resolvePublicAddresses(hostname);
  if (dnsInfo.blocked) {
    return { ok: false, error: dnsInfo.error, code: "SSRF_BLOCKED", hostname };
  }

  const tlsInfo = await observeTlsCertificate(hostname);

  return {
    ok: true,
    hostname,
    dns: {
      a: dnsInfo.a,
      aaaa: dnsInfo.aaaa,
      cname: dnsInfo.cname,
      ns: dnsInfo.ns,
      mx: dnsInfo.mx
    },
    tls: tlsInfo,
    observedAt: new Date().toISOString()
  };
}

module.exports = {
  validatePublicHostname,
  isPrivateOrReservedIp,
  resolvePublicAddresses,
  assertHostnameResolvesPublic,
  observeTlsCertificate,
  discoverHostname,
  parseSan,
  matchesHostname,
  hostnameMatchesPattern
};
