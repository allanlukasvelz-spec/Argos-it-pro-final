# ARGOS — Test strategy

```
CURRENT = isolation P0–P2, auth, hostname/TLS unit, e2e smoke/auth/visual
MISSING = monitoring, IDOR on future resources, failure injection
```

---

## Pyramid

```
UNIT (pure functions: health, fingerprint, hostname, TLS classify)
  INTEGRATION (DB + tenant WHERE)
    API (supertest)
      TENANT ISOLATION (mandatory every resource)
        SECURITY (SSRF, CSRF, cookie, RBAC)
          FRONTEND (states)
            E2E (Playwright)
              FAILURE INJECTION (scheduler down, DB down)
                REGRESSION (visual + API)
                  PRODUCTION READINESS (backup restore drill P12)
```

---

## Critical cases (must not regress)

| Case | How |
|------|-----|
| IDOR | org A token + org B ids → 404 |
| SSRF | monitor/discover to 169.254.169.254 / localhost → block |
| Auth bypass | no cookie; Bearer header rejected |
| Tenant leakage | list endpoints only own org |
| Role escalation | viewer cannot DELETE assets (P4); client cannot `/api/noc` |
| Secret exposure | TLS JSON no private key; logs no JWT |
| False HEALTHY | 0 observations ⇒ not HEALTHY |
| False positive | 1 timeout ≠ CRITICAL incident |
| False negative | runner stale ⇒ UNKNOWN not silent green |
| Alert storm | fingerprint dedup |
| Unsafe remediation | L3 without approval rejected |
| Agent compromise | invalid agent token rejected (P7) |

---

## Phase mapping

| Phase | Tests to add |
|-------|----------------|
| 0–2 | EXISTS (`npm test`, client isolation, assets isolation) |
| 3 | monitor isolation, SSRF probe, health UNKNOWN, alert fingerprint, incident group |
| 4 | org_role, portal routes, no-green-without-coverage e2e |
| 5 | noc authz, org filter on staff APIs |
| 6 | approval gate, rollback recorded, L4 rejected |
| 7 | agent auth, heartbeat isolation |
| 10 | /api/health degraded; freeze HEALTHY flag |
| 12 | restore drill documented |

---

## CURRENT commands

- `npm test` (backend)
- `cd frontend && npm test` if present
- Playwright e2e: smoke, auth, visual, corporate chrome
- `./scripts/verify-api.sh` with backend up

Do not weaken visual thresholds.

---

## Honesty rule for tests

A test that seeds a fake `score: 96` and asserts “protected” is **invalid**. Tests must include the UNKNOWN path.
