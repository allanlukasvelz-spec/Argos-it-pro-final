# ARGOS-CURSOR-IMPLEMENTACION-20261125

**Fecha:** 25/11/2026, Europe/Madrid.
**Veredicto:** NO-GO a producción. El parche está preparado y es reversible. No está fusionado ni desplegado.

## Base comprobada

| Ref | SHA | Uso |
|---|---|---|
| `origin/main` | `b608665e1c8c9697efba901de4dce327d3f7d097` | Protegida. No hay rama local `main`. |
| PR #36 | `dd4e44fce890cdba4773fc7e91eda965dfddf117` | Base de este worktree. CI run 41172079066: 9 fallos, 95 aprobadas, 3 omitidas. |
| PR #39 | `75c0048975385303ec2ddcdb133a8cfe193e0843` | Borrador, otro worktree. No se ha mezclado. |
| `deploy/production-v1` | `12678f37997479b6f58f11b16947a14e40309910` | Histórico. No se asume desplegado. |

El árbol de `/Users/allanlukasvelz/Dev/Argos-it-pro-final` sigue en `feature/argos-multitenant-platform` con sus 158 archivos modificados y 75 sin seguimiento. No se ha hecho reset, stash ni commit ahí. El worktree aislado es `/Users/allanlukasvelz/Dev/argos-ci-pr36-20261125`, rama `fix/pr36-ci-rate-limit-h1-20261125`.

Registro A1 citado: https://chatgpt.com/space/page_c2d78a7122748191a76f504e36fac2a2 . Esta tabla es la evidencia local; este entorno no escribe en ese Space.

## Matriz A1

| ID | Acción | Evidencia | Estado | Commit | Prueba | Pendiente |
|---|---|---|---|---|---|---|
| A1-001 | Inspección de rama, remotos y worktrees | `origin/main` b608665; PR36 dd4e44f; PR39 75c0048 en otro worktree | Hecho | no | `git worktree list` | Ninguno |
| A1-002 | Clasificar el CI 41172079066 | Log del run. H1: esperado `Sistemas que no fallen cuando no deben.`; DOM `Sistemas que no Fallan cuando no deben`. Píxeles: home 14 %, método 6390, servicios 579, contacto 39 %, dashboard 1032×1163 frente a 1032×1040. `maxDiffPixels` es 0 | Hecho | no | Log de GitHub | No son flakes |
| A1-003 | Quitar `validate.keyGeneratorIpFallback` | `express-rate-limit` 7.5.1 no reconoce esa clave y lanza `ValidationError`. El límite, la clave y `trust proxy` siguen | Hecho en el worktree | este parche | `security.rateLimit.test.js` 2/2, exit 0 | CI de GitHub aún no repetido |
| A1-004 | Restaurar el H1 aprobado | Contrato en main, PR39, manifiesto 15R y el propio e2e. El freeze se había cambiado para coincidir con la mayúscula | Hecho | este parche | content freeze 13/13. HTML compilado contiene la frase con punto | Ninguno de texto |
| A1-005 | No reabrir el dock de mascotas bajo 1024 px | El CSS de dd4e44f forzaba `display:block` y tapaba la regla aprobada | Hecho | este parche | 4 anchos, exit 0, 5,6 s | Las capturas de píxel no se han regenerado |
| A1-006 | Aislamiento de tenant y NOC | Sin base real | Hecho | no | `npm run test:isolation`: 311/311, exit 0 | No es el E2E de navegador |
| A1-007 | Proyectos web | Sin base real | Hecho | no | `npm run test:web-projects`: 270/270, exit 0 | — |
| A1-008 | Home en 1440, 1024, 768 y 390 | PostgreSQL sintético `127.0.0.1:55433`, usuario `argos_ci_synthetic`, trust, esquema aplicado, sin secretos del repositorio. Backend `:4927` sin `ValidationError`. Frontend compilado `:3927` | Hecho | no | 4 passed | El clúster temporal se ha detenido |
| A1-009 | Capturas home, método, servicios, contacto y dashboard | Diferencia real contra las baselines de Linux. No se han actualizado umbrales, skips ni PNG | Abierto | no | CI 41172079066 | Decisión de producto antes de tocar la Home aprobada o las baselines |
| A1-010 | Puerta de producción | Watchdog 45519428159 en verde no identifica SHA, roles ni restore. PR39 en verde no autoriza fusión | NO-GO | no | — | CI verde, denegación en staging, backup, restore aislado, rollback ensayado y GO del titular |

## Qué cambia

- Se elimina la opción de validación que la versión instalada rechaza. No se desactiva el rate limit ni se sube el máximo de 8.
- El título vuelve a `Sistemas que no fallen cuando no deben.`
- Se retira solo el `display:block !important` del dock por debajo de 1024 px. La cabecera blanca del commit dd4e44f permanece.

## Qué no se ha ejecutado

- `npm run verify` completo. Incluye otra build de producción y la compuerta MinIO en vivo.
- `CI=1 npm run test:e2e` completo. La suite de capturas sigue siendo un fallo real y no debía rebaselarse. El navegador local no reproduce las PNG de Linux.
- No hay restore de producción, cambio de VPS, DNS ni deploy.

## Plan de rollback

Revertir el commit de esta rama. Eso devuelve la opción incompatible, la mayúscula del H1 y el dock forzado. No toca datos. La rama se puede borrar sin afectar a `feature/argos-multitenant-platform` ni al árbol sucio.

## Plan de pruebas que falta para un GO

1. CI de esta rama en verde, incluidas las cinco capturas, sin regenerarlas a ciegas.
2. Repetir en staging la denegación: cliente y `org_admin` fuera del NOC; dos organizaciones sin cruce.
3. Backup consistente, copia independiente y restore aislado en un PostgreSQL que no sea el de producción.
4. Rollback ensayado del componente que se vaya a publicar.
5. GO explícito del titular para el SHA y el entorno concretos.

## Despliegue

No hay despliegue. Si más adelante se autoriza, el cambio es de frontend (texto y CSS) y de backend (arranque del limitador). No hay migración nueva. El rollback es revertir el commit y volver a construir.
