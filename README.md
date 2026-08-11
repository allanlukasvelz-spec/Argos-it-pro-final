# ARGOS-IT

Web de consultoría tecnológica premium para empresas, autónomos y profesionales, con foco en soporte IT, mantenimiento informático, seguridad informática, WordPress, automatización con IA y auditoría digital continua.

## Stack principal

- Frontend: Next.js (App Router) + React + TypeScript + Tailwind
- Backend: Node.js + Express (en `backend/`)
- Formularios: Formspree (`https://formspree.io/f/xpqooedl`)
- i18n frontend: sistema propio con `localStorage` y detección de idioma del navegador

## Estructura relevante

```txt
.github/
  workflows/
    ci.yml                # GitHub Actions: verify + e2e + build en main
frontend/
  app/                   # Rutas Next.js
  components/            # Layout, páginas, mascotas, SEO
  i18n/
    locales/             # es, en, ca, fr, de, it, pt
  hooks/                 # hooks de servicios e interacción
  lib/                   # utilidades y catálogo de slugs
  public/
    mascots/             # sprites PNG de Chico y Dumbo
database/
  schema.sql
  migrate.sh
  seed_admin.sql        # rol admin/super_admin para un usuario existente
  refresh_sessions.sql  # migración: rotación de refresh tokens (jti)
scripts/
  verify-api.sh         # smoke HTTP del backend (opcional, ver checklist abajo)
docs/
  VERIFY.md             # verificación por fases (API, npm run verify, manual)
  AUDIT_ENTREGA_FASES.md # auditoría y plan por fases para cierre del proyecto
  DEPLOY_AUTH.md        # auth, refresh_sessions y admin (fuente viva vs planes .cursor)
```

## Checklist de verificación (API)

Guía ampliada: [docs/VERIFY.md](docs/VERIFY.md). Auditoría y fases de cierre: [docs/AUDIT_ENTREGA_FASES.md](docs/AUDIT_ENTREGA_FASES.md).

Con el backend en marcha (por defecto `http://localhost:4000`), puedes comprobar regresiones en pocos minutos.

**Manual (ejemplos con curl):**

```bash
export BASE=http://localhost:4000

curl -sS "$BASE/api/health"

curl -sS -o /dev/null -w "%{http_code}\n" -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"no-es-un-email","password":"ValidPass123a"}'
# Esperado: 400

curl -sS -o /dev/null -w "%{http_code}\n" -X POST "$BASE/api/ai/public/dumbo-chat" \
  -H "Content-Type: application/json" \
  -d '{"message":""}'
# Esperado: 400

curl -sS -o /dev/null -w "%{http_code}\n" -X POST "$BASE/api/ai/public/mascot-chat" \
  -H "Content-Type: application/json" \
  -d '{"persona":"dumbo","message":""}'
# Esperado: 400

# Rutas protegidas usan cookies HttpOnly (no Bearer).
# Para probar manualmente con curl, hacer login y usar cookie jar:
# curl -sS -c /tmp/cookies.txt -X POST "$BASE/api/auth/login" \
#   -H "Content-Type: application/json" -H "Origin: http://127.0.0.1:3000" \
#   -d '{"email":"tu@email","password":"tupass"}'
# curl -sS -b /tmp/cookies.txt -H "Origin: http://127.0.0.1:3000" "$BASE/api/client/portal"
# Esperado: 200
```

**Automático:** desde la raíz del repo (tras `chmod +x scripts/verify-api.sh` si hace falta). Sin `OPENAI_API_KEY` en el servidor, las pruebas con mensaje válido aceptan **503** `assistant_unavailable`; con clave, **200** y JSON con `reply`. Para forzar 200 en staging: `VERIFY_MASCOT_REQUIRES_200=1 ./scripts/verify-api.sh`. Para pruebas autenticadas: `VERIFY_AUTH=1 ./scripts/verify-api.sh`.

```bash
./scripts/verify-api.sh
VERIFY_AUTH=1 ./scripts/verify-api.sh
```

**Portal (UI honesta):** con un usuario sin filas en `website_audits` ni `client_services`, el dashboard debe mostrar puntuación ausente (`—`), mensajes de auditoría/mejoras vacíos y el estado de verificación según `client_verified` en base de datos.

## Calidad y pull requests

Antes de fusionar cambios que toquen el frontend:

```bash
cd frontend
npm run lint
npm run build
```

Tras cambios en el backend Node, conviene comprobar sintaxis (ejemplo):

```bash
node --check backend/server.js
```

Esta convención reduce regresiones de TypeScript y errores de arranque del API.

Desde la **raíz** del repo, `npm run verify` ejecuta lint + build del frontend y comprobación de sintaxis de archivos clave del backend. `npm run verify:full` añade las pruebas E2E de Playwright (`npm run test:e2e`).

Pruebas **E2E** mínimas (Playwright): `npx playwright install chromium` la primera vez; `npm run test:e2e` arranca el frontend con **build de producción + `next start`** (ver [`playwright.config.ts`](playwright.config.ts)), no `next dev`, para evitar problemas de file watchers en macOS.

### Build bloqueado (“Another next build process is already running”)

Si `next build` falla con ese mensaje, suele haber **otro** `next build` o el servidor de Playwright aún compilando. Cierre: esperar unos segundos; cerrar otras terminales o el IDE ejecutando build; en macOS/Linux puede localizarse con `pgrep -fl "next build"` y terminar el proceso duplicado (con cuidado de no matar el trabajo legítimo). Si no ves ningún proceso, prueba `rm -rf frontend/.next` y vuelve a `npm run build` o `npm run verify`. Errores de resolución de módulos **dentro** de `node_modules/framer-motion` suelen deberse a una instalación incompleta: `rm -rf frontend/node_modules/framer-motion && npm --prefix frontend install`.

## CI en GitHub Actions

En cada **push** o **pull_request** a la rama **`main`**, el workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) ejecuta:

1. `npm ci` (raíz), `npm ci --prefix frontend`, `npm ci --prefix backend` (necesario para `npm run verify` y resolución de módulos del backend).
2. `npm run verify` (lint + build frontend + `node --check` backend).
3. `npx playwright install chromium --with-deps`
4. `CI=1 npm run test:e2e`
5. `npm run build` (segundo build explícito como gate adicional; `verify` ya incluye un build del frontend).

**Riesgos conocidos:** doble build aumenta tiempo de CI; CORS y URLs incorrectas en staging/prod solo se detectan con checklist manual o entorno real.

## Staging y producción (resumen)

- **Staging:** checklist completo en [docs/VERIFY.md](docs/VERIFY.md) (sección “Staging”). Incluye BD real, `OPENAI_API_KEY` si se prueba IA, chat mascotas, formulario, responsive, legales.
- **Producción:** misma guía, sección “Producción”; TLS, backups, variables definitivas, alertas y rollback descritos en [docs/AUDIT_ENTREGA_FASES.md](docs/AUDIT_ENTREGA_FASES.md) y VERIFY.

La protección ligera de rutas `/dashboard` y cabeceras en `/auth/*` está en [`frontend/proxy.ts`](frontend/proxy.ts) (convención **proxy** de Next.js 16, equivalente al antiguo `middleware.ts`).

## Instalación (primera vez)

Desde la raíz del repositorio (requiere Node 18+ recomendado 20 LTS):

```bash
npm ci
npm ci --prefix frontend
npm ci --prefix backend
```

El **CI** en GitHub ejecuta los tres `npm ci` antes de `verify` (ver `.github/workflows/ci.yml`).

## Desarrollo local

- **Backend:** copia `backend/.env.example` a `backend/.env`, define `DATABASE_URL` y secretos JWT; `npm --prefix backend run dev` (o `start`).
- **Frontend:** copia `frontend/.env.example` a `frontend/.env.local` con `BACKEND_URL` o `NEXT_PUBLIC_BACKEND_URL` apuntando al API (por defecto `http://127.0.0.1:4000`). El chat de Chico/Dumbo llama al mismo origen (`POST /api/ai/public/mascot-chat`) y Next **reenvía** al backend (menos problemas de CORS entre puertos). Desde la raíz `npm run dev` (equivale a `next dev` en `frontend/`).

**Chat IA:** el backend debe estar en marcha y tener `OPENAI_API_KEY` si quieres respuestas reales; si no, el API devuelve 503 y la UI enlaza a contacto.

```bash
npm run dev
```

Otros comandos útiles en `frontend/`:

```bash
npm --prefix frontend run lint
npm --prefix frontend run build
npm --prefix frontend run start
```

## Comandos desde raíz

También puedes usar los scripts proxy del root:

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Docker Compose (API + Postgres + Next)

Desde la carpeta [docker/](docker/):

```bash
cd docker
docker compose up --build
```

El servicio **frontend** del Compose usa el script `npm run dev:docker` (Next escucha en `0.0.0.0:3000` dentro del contenedor; el host usa `http://localhost:3000`). El backend expone `http://localhost:4000`. La variable `NEXT_PUBLIC_BACKEND_URL` del frontend en Compose apunta a `http://localhost:4000`, coherente con el **navegador en el host** que llama al API publicado en el mismo equipo.

### Si `docker compose` o `docker pull` fallan

- Mensajes como **`context deadline exceeded`** al descargar capas (p. ej. `postgres:16-alpine`) suelen ser **red lenta, firewall o VPN**. Prueba: desactivar VPN temporalmente, otra red, o `docker pull postgres:16-alpine` suelto y repetir `docker compose up --build`.
- **`bind: address already in use`** en **3000** o **4000**: ya hay Next o el API en el host. Para Compose, detén esos procesos o cambia los mapeos de puertos en [docker/docker-compose.yml](docker/docker-compose.yml).

## Publicación

1. Construir:
```bash
npm run build
```
2. Levantar en modo producción:
```bash
npm run preview
```
3. Configurar dominio y SSL en tu plataforma.
4. Verificar `robots.txt` y `sitemap.xml` generados por Next.

## Variables de entorno

| Contexto | Archivo de referencia | Notas |
|------------|------------------------|--------|
| Desarrollo local (sin Docker) | [frontend/.env.example](frontend/.env.example) | `NEXT_PUBLIC_BACKEND_URL` hacia `http://127.0.0.1:4000` o `http://localhost:4000` |
| Backend local | [backend/.env.example](backend/.env.example) | `DATABASE_URL`, `JWT_SECRET` (≥32), `JWT_REFRESH_SECRET`, `CORS_ORIGINS` alineados con la URL real del frontend |
| Docker Compose | [docker/docker-compose.yml](docker/docker-compose.yml) | Ejecutar desde la carpeta `docker/`; variables en el propio Compose o `.env` en esa carpeta |
| Resumen / plantilla amplia | [.env.example](.env.example) | Mezcla documental; **no** es cargado automáticamente salvo que lo configures tú |

En `frontend` el mínimo suele ser:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

### Base de datos con Docker

El `schema.sql` solo se aplica al **primer arranque** del volumen de Postgres. Si cambias el esquema, recrea el volumen o aplica migraciones con [database/migrate.sh](database/migrate.sh) y `DATABASE_URL`.

**`refresh_sessions` (rotación de refresh):** al arrancar, el backend ejecuta el mismo DDL que [database/refresh_sessions.sql](database/refresh_sessions.sql) vía [backend/lib/ensureRefreshSessions.js](backend/lib/ensureRefreshSessions.js), así que las bases antiguas reciben la tabla sin un paso manual obligatorio (requiere que el rol de BD pueda `CREATE TABLE`). El archivo SQL sigue siendo útil para revisión o entornos donde el API no debe migrar solo.

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/refresh_sessions.sql
```

### WebSockets (Socket.IO)

Si `ENABLE_SOCKET_IO=false` en el backend ([backend/.env.example](backend/.env.example)), el servidor **no** monta Socket.IO (menos superficie hasta tener cliente). Valor por defecto: activo.

Las conexiones al servidor Socket.IO **requieren un JWT de acceso** en `handshake.auth.token` o `handshake.query.token`. El servidor ignora cualquier `userId` enviado en el cuerpo del evento y usa el usuario del token.

Desde el navegador, cuando añadas un cliente real, instala antes la dependencia en `frontend/` (`npm install socket.io-client`) y usa por ejemplo:

```javascript
import { io } from "socket.io-client";

const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL, {
  auth: { token: accessToken }
});
```

Alternativa equivalente: `io(url, { query: { token: accessToken } })`.

### API REST: IA y estadísticas de seguridad

#### Política de producto (IA)

- **IA pública** (`POST /api/ai/public/mascot-chat` con `persona: "dumbo" | "chico"` y `message`; compatibilidad `POST /api/ai/public/dumbo-chat`): sin JWT. Protegida con **rate limiting** (`aiLimiter`) y validación de entrada (mensaje no vacío, longitud máxima en [backend/lib/aiMessage.js](backend/lib/aiMessage.js)). Cualquier visitante puede usarla dentro de esos límites. Sin `OPENAI_API_KEY`, respuesta **503** y el chat web muestra aviso y enlace a contacto.
- **IA autenticada** (montaje en [backend/server.js](backend/server.js): `/api/ai` con `authMiddleware`):
  - `POST /api/ai/dumbo`: chat UX con memoria por `user_id` en tabla `ai_memory`.
  - `POST /api/ai/chico`: análisis de seguridad; persiste en `security_logs` con el `user_id` del token.
  - **Quién puede llamar:** cualquier usuario con **JWT de acceso válido** (roles típicos `cliente`, `cliente_verificado`, `admin`, etc.). **No** hay `requireRole` en estas rutas: un cliente autenticado tiene las mismas capacidades de llamada que un admin salvo que el producto cambie (véase roadmap D2 más abajo).
  - **Requisitos de servidor:** `OPENAI_API_KEY` configurada; modelo por defecto `OPENAI_MODEL` o `gpt-4o-mini`. Sin clave, las rutas responderán error al invocar OpenAI.

- **Estadísticas globales de seguridad:** `GET /api/security/stats` agrega `security_logs` y **solo** permite `admin` o `super_admin` ([backend/routes/security.js](backend/routes/security.js)).

### Rol administrador

Para probar `GET /api/security/stats`, eleva a un usuario **ya registrado** con el SQL versionado en [database/seed_admin.sql](database/seed_admin.sql) (edita el email en el archivo antes de ejecutar):

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/seed_admin.sql
```

Comprueba con `SELECT id, email, role FROM users WHERE email = '...';`. Valores habituales de `role` en [database/schema.sql](database/schema.sql): `cliente`, `admin`, `super_admin`, etc.

## Idiomas

Idiomas soportados en frontend:

- Español (`es`)
- Inglés (`en`)
- Catalán (`ca`)
- Francés (`fr`)
- Alemán (`de`)
- Italiano (`it`)
- Portugués (`pt`)

Notas:

- El idioma se detecta automáticamente en la primera visita.
- La selección del usuario se guarda en `localStorage` y en la cookie `argos_locale` (para que el servidor pueda alinear metadata en páginas como `/servicios/[slug]`).
- Si una clave no existe en un idioma, se usa fallback a español.

## Formularios

- Endpoint: `https://formspree.io/f/xpqooedl`
- Subject: `Nueva solicitud desde ARGOS-IT`
- Campos incluidos: nombre, email, teléfono, empresa/proyecto, servicio, mensaje y consentimiento legal.
- Validación cliente con mensajes de error por campo.

## Assets

- Mascotas principales en `frontend/public/mascots/chico/` y `frontend/public/mascots/dumbo/`.
- Se prioriza el uso de assets reales del proyecto (no placeholders genéricos).

## SEO técnico implementado

- Metadata base global
- Metadata por página principal
- `robots.ts` (genera `robots.txt`)
- `sitemap.ts` (genera `sitemap.xml`)
- Open Graph / Twitter cards globales
- Estructura semántica con H1 único por vista principal

## Notas legales

Rutas públicas:

- `/aviso-legal`
- `/privacidad`
- `/cookies`

Banner de cookies activo con aceptación/rechazo y persistencia local.

## Roadmap opcional (post-calidad)

Trabajo posterior acotado por producto; cada bloque puede ser un PR independiente.

| Id | Alcance | Notas |
|----|---------|--------|
| D1 | Cliente Socket.IO en frontend con JWT | Instalar `socket.io-client`; ver ejemplo en la sección WebSockets de este README |
| D2 | Restringir `/api/ai` por rol | Ajustar montaje en `backend/server.js` y `requireRole` si solo ciertos perfiles deben usar IA autenticada |
| D3 | Pruebas E2E (p. ej. Playwright) | Carpeta `e2e/` y script en raíz; apuntar a entorno local |
| D4 | Rotación/revocación de refresh tokens | Campo `jti` o tabla de sesiones; cambios en `backend/routes/auth.js` y SQL de migración |
