# Fuente documental

Fecha: 2026-10-16. Indica qué archivo responde cada pregunta. No convierte un documento antiguo en falso: lo deja en su fecha.

| Pregunta | Consultar primero | No usar como presente |
|---|---|---|
| ¿Qué hay en este HEAD? | Código del repositorio y [ARCHITECTURE_CURRENT_STATUS.md](./ARCHITECTURE_CURRENT_STATUS.md) | Cualquier párrafo que cite `111ed70` como HEAD actual |
| ¿Qué se observó en público y cuándo? | [INFRASTRUCTURE_EVIDENCE_MATRIX.md](./INFRASTRUCTURE_EVIDENCE_MATRIX.md) y los expedientes V7.18 y V7.19 | Un HTTP 200 como prueba de versión |
| ¿Cómo estaba descrita la infraestructura en agosto? | `docs/infrastructure/`, con la advertencia del 2026-10-16 | Esas páginas como runbook vigente |
| ¿Qué preparación de producción sigue escrita? | [PRODUCTION_PLAN.md](./PRODUCTION_PLAN.md), leyendo antes la nota del 2026-10-16 | Las frases de WordPress actual o de portal aún no creado, sin esa nota |
| ¿Staging estuvo operativo? | [STAGING_RESULTADOS.md](./STAGING_RESULTADOS.md), fecha 2026-08-02 | Ese estado como situación actual |
| ¿Qué pasó en la última mirada a staging? | Expediente V7.19: HTTP 503 el 2026-10-14 | Afirmar que hoy sigue igual |
| ¿Se puede recuperar producción? | [PRODUCTION_READINESS_STATUS.md](./PRODUCTION_READINESS_STATUS.md) | `docs/infrastructure/15_DISASTER_RECOVERY.md` como capacidad confirmada |
| ¿Hay copia de los expedientes locales? | Control V7.23 en `/Users/allanlukasvelz/ARGOS-IT_BACKUP_MAESTRO/02_CONTROL/RESULTADO_INTEGRIDAD.md` | Esa copia como backup de base o de aplicación |
| ¿Qué CI existe? | `.github/workflows/ci.yml`: pull request y push a `main` | Suponer que la rama de integración dispara ese workflow |
| ¿Qué compuerta de build existe? | `npm run check:release-build`, solo con `ARGOS_RELEASE_BUILD=1` | Suponer que `npm run build` o el CI la ejecutan |
| ¿Dónde desplegar según una guía genérica? | [DEPLOYMENT.md](./DEPLOYMENT.md), como guía no verificada en producción | Railway, Heroku o el compose de esa guía como alojamiento real |

## Reglas de lectura

- VERIFIED_CURRENT: comprobado en esta fase o todavía vigente por una comprobación directa del repositorio.
- VERIFIED_AT_DATE: observado en la fecha indicada.
- HISTORICAL_DOCUMENTED: escrito en un registro que se conserva.
- SOURCE_CODE_CONFIRMED: está en el código de este HEAD y no prueba el despliegue.
- CONTRADICTED: el texto choca con una evidencia posterior o con el código.
- UNKNOWN: no hay evidencia suficiente. La falta de acceso no demuestra que el servicio no exista.

## Expedientes que no se editan

Los informes de `artifacts/argos-v7-*` anteriores a V7.24 quedan como estaban, incluidas sus fechas y sus errores de registro. La reconciliación vive en `docs/` y en `artifacts/argos-v7-24-documentation-reconciliation/`.
