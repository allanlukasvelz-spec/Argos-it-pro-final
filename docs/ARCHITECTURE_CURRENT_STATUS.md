# Arquitectura — estado clasificado

Fecha de esta clasificación: 2026-10-16.\
V7.24 no ha repetido observaciones de red, DNS ni HTTP. Una fecha de observación no es el estado de hoy.

## Código de este repositorio

Clasificación: SOURCE_CODE_CONFIRMED en el HEAD `e1c9a5db03e52e8f637fc4f8c4d7c4b7e25ba88c`.\
No demuestra qué revisión está desplegada.

| Pieza | Qué confirma el código |
|---|---|
| Frontend | Aplicación Next.js |
| Backend | API Express |
| Datos de aplicación | Esquema PostgreSQL en el repositorio |
| Sonda de la imagen backend | `GET http://127.0.0.1:4000/api/live` |
| Ruta de salud de la aplicación | `GET /api/health`, distinta de la sonda de imagen |
| Sonda de la imagen frontend | `GET http://127.0.0.1:3000/` |
| Repositorio Git | `https://github.com/allanlukasvelz-spec/Argos-it-pro-final.git` |
| Rama de integración | `integration/gm-v3-main-b608665` |

Las auditorías V7.21 no encontraron Bitbucket en las fuentes revisadas. Este documento no lo incorpora como remoto ni como origen de despliegue.

## Observación pública del 2026-10-14

Clasificación: VERIFIED_AT_DATE. No se repitió en V7.24.

| Nombre | Observación de aquel día | Límite |
|---|---|---|
| `argos-it.com` | HTTP 200, Next.js, dirección `31.97.52.181` | No identifica el commit. No prueba que WordPress haya desaparecido de todos los servidores. |
| `www.argos-it.com` | Sin A ni CNAME en la consulta de aquel día | No es un estado eterno. |
| `portal.argos-it.com` | HTTP 200, Next.js, dirección `91.108.121.181` | El documento no era el mismo build que el apex. SHA desplegado: UNKNOWN. |
| `api.portal.argos-it.com` | HTTP 200 en `/api/health`; la respuesta indicó base conectada | Motor y servidor de base: UNKNOWN. No es una verificación administrativa. |
| `staging.argos-it.com` y `api-staging.argos-it.com` | HTTP 503, texto de proxy sin servidor disponible | No se mantiene como estado actual. Causa: no cerrada. |
| `coolify.argos-it.com` | Sin registro A en aquella consulta | No demuestra que Coolify esté apagado ni que siga administrando el servicio. |

## Infraestructura de agosto de 2026

Clasificación: HISTORICAL_DOCUMENTED en `docs/infrastructure/`.\
Registra Coolify, un VPS, PostgreSQL, R2 y WordPress en hosting aparte. Varias de esas afirmaciones quedaron contradichas por la observación del 2026-10-14 o por el código de este HEAD. El detalle está en [INFRASTRUCTURE_EVIDENCE_MATRIX.md](./INFRASTRUCTURE_EVIDENCE_MATRIX.md).

## Lo que esta clasificación no afirma

- Que el HEAD de integración sea el código público.
- Que Coolify sea, o haya dejado de ser, el sistema de despliegue.
- Que exista una copia recuperable de la base, la aplicación o el almacenamiento de producción.
- Que el rollback esté disponible.
- Que staging siga en HTTP 503.
- Que la producción esté lista.

Preparación de publicación: [PRODUCTION_READINESS_STATUS.md](./PRODUCTION_READINESS_STATUS.md).\
Qué documento usar para cada pregunta: [DOCUMENTATION_SOURCE_OF_TRUTH.md](./DOCUMENTATION_SOURCE_OF_TRUTH.md).
