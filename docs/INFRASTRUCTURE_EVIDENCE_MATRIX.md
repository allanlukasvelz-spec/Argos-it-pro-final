# Matriz de evidencias de infraestructura

Fecha: 2026-10-16. Cada fila separa el texto documental de la evidencia que lo sostiene. V7.24 no ha hecho nuevas comprobaciones de red ni de paneles.

| Afirmación | Dónde aparece | Evidencia | Clasificación |
|---|---|---|---|
| El repositorio oficial es GitHub `allanlukasvelz-spec/Argos-it-pro-final` | Git local, 2026-10-16 | `git remote get-url origin` | VERIFIED_CURRENT |
| HEAD de integración `e1c9a5d` | Git local, 2026-10-16 | `git rev-parse HEAD` | VERIFIED_CURRENT para el repositorio; no para producción |
| Bitbucket como origen | Auditoría V7.21 | No apareció en las fuentes revisadas | UNKNOWN como sistema externo; no consta en este repositorio |
| Apex en WordPress | `docs/infrastructure/`, `docs/PRODUCTION_PLAN.md` antes de la nota | Registro de agosto y plan de preparación | CONTRADICTED como tecnología observada el 2026-10-14; HISTORICAL_DOCUMENTED como antecedente |
| Apex en Next.js, `31.97.52.181` | Auditorías V7.18 y V7.19 | HTTP y DNS del 2026-10-14 | VERIFIED_AT_DATE |
| WordPress retirado de todos los servidores | No hay evidencia | La observación del apex no cubre otros alojamientos | UNKNOWN |
| Portal inexistente o pendiente de crear | `docs/PRODUCTION_PLAN.md`, sección de DNS de la preparación | El 2026-10-14 el nombre respondió HTTP 200 | CONTRADICTED para «no existe»; el SHA desplegado sigue UNKNOWN |
| Portal en Next.js, `91.108.121.181` | V7.19 | HTTP del 2026-10-14 | VERIFIED_AT_DATE |
| El portal ejecuta el HEAD de integración | No hay evidencia | Builds distintos entre apex y portal; sin SHA publicado | UNKNOWN |
| API con base conectada | V7.19, `/api/health` | JSON del 2026-10-14 | VERIFIED_AT_DATE para aquella respuesta |
| Motor y servidor de la base de producción | CMDB de agosto nombra PostgreSQL 16 en Coolify | Sin acceso administrativo posterior | HISTORICAL_DOCUMENTED; el servidor vigente es UNKNOWN |
| Staging operativo | `docs/STAGING_RESULTADOS.md`, 2026-08-02 | Registro de aquella fecha | HISTORICAL_DOCUMENTED |
| Staging en HTTP 503 | V7.19 | Observación del 2026-10-14 | VERIFIED_AT_DATE; no es estado actual |
| Causa del 503 | Texto de proxy «no available server» | No hubo sesión de administración | UNKNOWN |
| Coolify 4.2.0 administra producción | `docs/infrastructure/04_COOLIFY.md` | Cierre del 2026-08-06 | HISTORICAL_DOCUMENTED |
| Coolify vigente el 2026-10-16 | No hay sesión ni resolución confirmada del panel en V7.20 | El nombre no resolvió el 2026-10-14 | UNKNOWN; no equivale a «apagado» |
| Repositorio configurado en Coolify | CMDB de agosto cita ramas | No revalidado | UNKNOWN |
| Commit desplegado | No hay SHA en las respuestas públicas | — | UNKNOWN |
| Railway, Heroku o Vercel como producción | `docs/DEPLOYMENT.md` | Guía genérica, sin observación | HISTORICAL_DOCUMENTED como opción escrita; no es el alojamiento verificado |
| Copias de producción en R2 | `docs/infrastructure/07_BACKUPS.md` y `08_R2.md` | Últimos nombres de agosto; retención documentada de 30 días ya superada en la auditoría | HISTORICAL_DOCUMENTED; existencia actual NOT VERIFIED |
| Copia local V7.23 | `/Users/allanlukasvelz/ARGOS-IT_BACKUP_MAESTRO/` | `02_CONTROL/RESULTADO_INTEGRIDAD.md` = `BACKUP_VERIFIED_PASS` | VERIFIED_CURRENT para `artifacts/` de este Mac; no es copia de producción |
| Rollback disponible | Varios runbooks | No hay objetivo verificado ni ensayo | CONTRADICTED como capacidad actual; estado = BLOCKED |
| Sonda backend `/api/health` | Revisión del plan del 2026-10-14 | `backend/Dockerfile` llama a `/api/live` | CONTRADICTED para la imagen; `/api/health` sigue existiendo como ruta |
| Frontend sin HEALTHCHECK | Misma revisión | `frontend/Dockerfile` llama a `/` | CONTRADICTED para este HEAD |
| CI de la rama de integración | `.github/workflows/ci.yml` | El workflow auditado dispara en `main` | SOURCE_CODE_CONFIRMED: integration no está en ese trigger |
| Compuerta de build de publicación | `package.json` y `scripts/check-release-build-env.js` | Existe; `ci.yml` no la invoca | SOURCE_CODE_CONFIRMED |

Los expedientes `artifacts/argos-v7-18-production-infrastructure-audit/`, `argos-v7-19-production-discovery/`, `argos-v7-20-controlled-infrastructure-verification/` y `argos-v7-21-reconciliation-cleanup/` conservan el detalle. No se han modificado.
