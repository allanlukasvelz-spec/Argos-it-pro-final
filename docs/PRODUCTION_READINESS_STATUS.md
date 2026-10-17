# Preparación de producción

Fecha: 2026-10-16.\
Estado: no lista para publicar. Este documento no autoriza despliegue, DNS ni cambios de infraestructura.

## Separación obligatoria

| Pregunta | Respuesta |
|---|---|
| ¿El código local existe y está identificado? | Sí. HEAD `e1c9a5db03e52e8f637fc4f8c4d7c4b7e25ba88c`. |
| ¿Ese commit está desplegado? | UNKNOWN. |
| ¿Una respuesta HTTP 200 demuestra la versión? | No. |
| ¿La documentación de agosto demuestra el sistema vigente? | No. |
| ¿La copia V7.23 recupera producción? | No. Solo conserva `artifacts/` en este Mac. |
| ¿Hay rollback ensayado? | No. ROLLBACK = BLOCKED. |
| ¿Staging está arreglado o sigue en 503? | UNKNOWN. La última observación, el 2026-10-14, fue HTTP 503. |

## Copias

| Copia | Estado |
|---|---|
| Evidencias locales V7.23 | `BACKUP_VERIFIED_PASS` en `/Users/allanlukasvelz/ARGOS-IT_BACKUP_MAESTRO/`. Restauración de prueba: NOT EXECUTED. |
| Base de datos de producción | NOT VERIFIED. |
| Aplicación de producción | NOT VERIFIED. |
| Almacenamiento de producción | NOT VERIFIED. |

## Bloqueos que siguen abiertos

Proceden de las auditorías V7.18, V7.19 y V7.20. V7.24 no los ha cerrado porque no ha accedido a paneles ni a producción.

1. SHA desplegado desconocido en el apex, el portal y la API.
2. Coolify y el repositorio que usaría: NOT VERIFIED.
3. Motor y servidor reales de la base que respondió «conectada»: UNKNOWN.
4. Copias y recuperación de producción: NOT VERIFIED. Rollback: BLOCKED.
5. Staging sin causa cerrada para el HTTP 503 del 2026-10-14.
6. Dos builds públicos distintos el 2026-10-14, apex y portal, sin relación demostrada con este HEAD.
7. La compuerta `check:release-build` existe en el repositorio y no está invocada por el workflow de CI auditado.

## Lo que sí puede usarse para preparar, sin desplegar

- Contrato de código de las sondas: `/api/live` en la imagen backend, `/` en la imagen frontend, `/api/health` como ruta de aplicación.
- Compuerta local de URL pública, solo cuando se ejecute de forma expresa con `ARGOS_RELEASE_BUILD=1`. La compilación ordinaria no la sustituye.
- Identidad Git de integración, sin confundirla con producción.

Clasificación de arquitectura: [ARCHITECTURE_CURRENT_STATUS.md](./ARCHITECTURE_CURRENT_STATUS.md).
