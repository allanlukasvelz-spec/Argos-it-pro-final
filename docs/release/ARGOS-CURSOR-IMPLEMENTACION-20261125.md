# ARGOS-CURSOR-IMPLEMENTACION-20261125

**Fecha:** 25/11/2026, Europe/Madrid.
**Veredicto:** NO-GO a producción. Continuación ejecutada el 25/11/2026 sobre el commit `76f3324c28f1fc1aacefd89fc9410381e42d9ca1`, sin fusión ni despliegue.

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
| A1-006 | Aislamiento de tenant y NOC | `npm run test:isolation` 311/311 sobre el SHA, sin navegador ni clientes reales | Parcial | `76f3324` | exit 0 | Sigue pendiente la prueba real de permisos, de dos clientes y del acceso a la IA |
| A1-007 | Proyectos web | `npm run test:web-projects` 270/270 | Hecho | `76f3324` | exit 0 | — |
| A1-008 | `npm run verify` y `CI=1 npm run test:e2e` | PostgreSQL sintético `127.0.0.1:55434/argos_it`, usuario `postgres`, trust. El 5432 local no se ha usado. Logs `/tmp/argos-a1-verify.log` y `/tmp/argos-a1-e2e.log` | Hecho | `76f3324` | verify exit 0, 649 pruebas de Node y 0 fallos. E2E exit 1: 102 aprobadas, 3 fallidas, 3 omitidas | Las 3 fallidas son capturas. Las 3 omitidas son de staging |
| A1-009 | Cinco capturas frente al diseño aprobado | Darwin en este SHA: método y servicios coinciden. Home, contacto y dashboard no. Linux del run 41172079066 no se ha repetido: no hay Docker | Abierto | `76f3324` | Home 13 %; contacto 38 %; dashboard 1280×1574 frente a 1032×988 | No se regeneran baselines ni se toca Home sin aprobación |
| A1-010 | Puerta de producción y de Actions | El workflow `ci.yml` solo escucha `pull_request` y `push` hacia `main`. El PR #40 apunta a `feature/argos-multitenant-platform`. `gh run list` para este SHA no devuelve ejecuciones | NO-GO | `76f3324` | — | Autorización para cambiar el destino o el workflow; después CI verde, staging, backup, restore y GO |

## Qué cambia

- Se elimina la opción de validación que la versión instalada rechaza. No se desactiva el rate limit ni se sube el máximo de 8.
- El título vuelve a `Sistemas que no fallen cuando no deben.`
- Se retira solo el `display:block !important` del dock por debajo de 1024 px. La cabecera blanca del commit dd4e44f permanece.

## Continuación sobre `76f3324`

### Archivos sin confirmar

Antes de esta continuación el worktree solo tenía cuatro rutas sin seguimiento. Ninguna es una modificación de código:

- `node_modules`, `backend/node_modules` y `frontend/node_modules` eran enlaces al otro árbol. Se han sustituido por `npm ci` local, como en el workflow. Siguen en `.gitignore`. El árbol de `/Users/allanlukasvelz/Dev/Argos-it-pro-final` no se ha borrado ni modificado: sigue en `dd4e44f`, con 158 modificados y 75 sin seguimiento.
- `artifacts/visual-adoption-01/*.png` son capturas generadas por la prueba anterior. Se conservan y no forman parte del commit.

### Suites

`npm run verify` terminó con exit 0. La build de producción compiló en 2,8 s. Las pruebas de Node suman 649 aprobadas y 0 fallidas. La compuerta MinIO se omitió porque `ARGOS_MINIO_POC` no estaba definido, que es el comportamiento del script.

`CI=1 npm run test:e2e` terminó con exit 1 a los 3,0 minutos: 102 aprobadas, 3 fallidas y 3 omitidas. Las omitidas son `noc-visual-staging`, `phase7-agents-staging` y `staging-harness-security`, porque este entorno no es staging. El H1 en 1440, 1024, 768 y 390 pasó dentro de esta misma suite. No apareció `ValidationError`.

La base fue `postgresql://postgres@127.0.0.1:55434/argos_it`, creada con `initdb` y el `schema.sql` del commit. El PostgreSQL que escucha en el puerto 5432 no se ha usado. No hay Docker, así que las capturas comparan las PNG de Darwin, no las de Linux del run 41172079066.

### Las cinco capturas

No se ha cambiado ningún PNG, ningún umbral ni la Home.

| Captura | Baseline aprobada | Esta ejecución, Darwin | Lectura |
|---|---|---|---|
| Home | `2c65c3f`, 9/10/2026, Golden Master. H1 «Sistemas que no fallen cuando no deben.» y el botón «Hablar con ARGOS» abajo a la izquierda, en contorno | Falla. 119428 píxeles, ratio 0,13. El H1 ya coincide. El botón queda centrado, blanco y sólido | El resto del CSS de cabecera de `dd4e44f` sigue. Corregirlo sería otro cambio de Home y no está aprobado |
| Método | Misma baseline Golden Master | Pasa | Coincide con la PNG de Darwin. La diferencia de Linux del run antiguo no se ha repetido |
| Servicios | Misma baseline Golden Master | Pasa | Igual que método |
| Contacto | `6ef707f`, 17/09/2026. Página en inglés, aviso en banda verde y el botón del asistente encima de la ficha de correo | Falla. 349907 píxeles, ratio 0,38. La página sale en español, el aviso es una banda clara y el botón queda fuera de la ficha | No es un píxel suelto. La página y la baseline no describen el mismo diseño |
| Dashboard | `6ef707f`. Portal en inglés, 1280×1574, con empresa, mejoras, mensajería y diagnósticos | Falla. Se recibió 1032×988, ratio 0,38. El portal actual es el resumen en español de salud, monitores y proyecto web | La página cambió de estructura después de esa baseline. No se regenera |

### Cómo verificar el PR #40 en Actions sin tocar la configuración

`.github/workflows/ci.yml` se activa solo con `pull_request` o `push` cuya rama de destino es `main`. No tiene `workflow_dispatch`. El PR #40 tiene base `feature/argos-multitenant-platform`, así que Actions no lo ejecuta. `gh run list --commit 76f3324c28f1fc1aacefd89fc9410381e42d9ca1` no devuelve ninguna ejecución.

Para que el workflow actual corra hace falta un acontecimiento que ya esté declarado: un pull request hacia `main` o un push a `main`. Cambiar la base del PR #40 o editar `ci.yml` no se ha hecho. Queda a la espera de autorización.

### Pendiente de validación real

Las 311 pruebas de aislamiento y las 102 de E2E no sustituyen una sesión con dos clientes reales, la denegación de `org_admin` en el NOC publicado ni una llamada real al asistente. Esas tres comprobaciones siguen abiertas.

## Qué no se ha ejecutado

- Repetición de las cinco capturas en Linux. No hay Docker y no se ha usado el PostgreSQL del puerto 5432.
- Actions sobre este SHA.
- Restore de producción, cambio de VPS, DNS o deploy.

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
