# 12 — GitHub

## Resumen

Monorepo aplicación ARGOS-IT; CI en `main`; deploys vía Coolify GitHub App desde ramas dedicadas.

## Estado

Remoto verificado desde workspace local.

**Última verificación UTC:** 2026-08-05T10:00Z

## Inventario

| Campo | Valor |
|---|---|
| Repo | `https://github.com/allanlukasvelz-spec/Argos-it-pro-final.git` |
| Default | `main` (origin/HEAD) |
| Rama local activa (workspace) | `deploy/production-v1` |

## Ramas relevantes

| Rama | Uso |
|---|---|
| `main` | Canónica + CI |
| `deploy/production-v1` | Producción Coolify |
| `deploy/staging-readiness` | Staging Coolify |
| `deploy/hostinger-staging` | Histórica |
| Otras `cursor/*`, `feature/*` | Desarrollo |

## Workflows

| Archivo | Trigger | Acción |
|---|---|---|
| `.github/workflows/ci.yml` | push/PR `main` | verify + Playwright e2e + Postgres 16 service |

## Secrets (referencia)

| Secreto | Dónde | Notas |
|---|---|---|
| GitHub Actions | repo secrets | CI usa credenciales **de test** embebidas en workflow (no prod) |
| Coolify GitHub App | instalación Coolify | Acceso repo |
| Deploy secrets app | Coolify UI | No en Git |

Valores: **nunca en docs**.

## Dependencias

GitHub disponibilidad · App Coolify.

## Riesgos

Staging auto-deploy ON · prod commits docs pueden etiquetar imágenes sin release producto explícito (histórico 651deb54).

## Rollback

Git revert + Coolify redeploy commit anterior.

## Observaciones

No se enumeran todos los remotes protegidos/branch protection: **PENDIENTE DE VALIDACIÓN**.

**Última verificación UTC:** 2026-08-05T10:00Z
