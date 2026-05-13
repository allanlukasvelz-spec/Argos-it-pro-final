# Verificación ARGOS-IT

Guía repetible: API, calidad automatizada, checklists **local**, **staging** y **producción**. Complementa el [README.md](../README.md) y la [auditoría de entrega](AUDIT_ENTREGA_FASES.md).

## Requisitos

- Backend accesible (típico `http://127.0.0.1:4000` o URL de staging).
- Para JWT: usuario en BD y tokens de login o refresh.

---

## Checklist — Local (desarrollador)

- [ ] `npm ci` en raíz, `npm ci --prefix frontend`, `npm ci --prefix backend`.
- [ ] `npm run verify` sin errores.
- [ ] `npx playwright install chromium` (primera vez o tras actualizar Playwright).
- [ ] `CI=1 npm run test:e2e` sin fallos.
- [ ] `npm run build` (o confiar en que `verify` ya construyó; útil para comprobar build aislado).
- [ ] Si aparece **“Another next build process is already running”**: cerrar otros `next build` / reiniciar terminal; en macOS/Linux `pgrep -fl "next build"` y terminar proceso duplicado con cuidado. Si no hay otro proceso, borrar `frontend/.next` y repetir el build. Si `next build` falla con módulos internos de `framer-motion` faltantes, reinstalar solo ese paquete: `rm -rf frontend/node_modules/framer-motion && npm --prefix frontend install`.
- [ ] Con backend levantado y `DATABASE_URL`: `./scripts/verify-api.sh` (opcionalmente con `TOKEN_*`).

---

## Checklist — Staging (pre-producción)

### Repositorio y secretos

- [ ] Rama acordada; sin secretos en diff.
- [ ] Variables en el proveedor (no solo `.env` local): `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGINS`, `FRONTEND_URL`, `OPENAI_API_KEY` (si IA activa), `NEXT_PUBLIC_BACKEND_URL` apuntando al API **accesible desde el navegador del usuario**.

### Backend

- [ ] Migraciones aplicadas (`database/migrate.sh` o proceso propio).
- [ ] `GET /api/health` → 200.
- [ ] `./scripts/verify-api.sh` con `BASE_URL` de staging; con tokens de prueba si aplica.
- [ ] `mascot-chat` con mensaje válido: **200** si hay `OPENAI_API_KEY`, **503** `assistant_unavailable` si no (comportamiento esperado).
- [ ] Auth: login/registro según política del entorno.
- [ ] Socket.IO: si está activo, probar con JWT válido en handshake; si no aplica, `ENABLE_SOCKET_IO=false` documentado.

### Frontend

- [ ] Home carga; sin errores críticos en consola en flujo principal (F12).
- [ ] Servicios y slugs conocidos cargan.
- [ ] Header, menú móvil (hamburguesa), footer: enlaces correctos.
- [ ] Páginas legales: `/aviso-legal`, `/privacidad`, `/cookies` (y variantes `/legal/*` si las usáis) abren y enlazan.
- [ ] Explainer: sección en home y/o `/explainer` según entrega.
- [ ] Chat Chico y Dumbo: abre panel, envía mensaje, recibe respuesta o mensaje de indisponibilidad + enlace a contacto.
- [ ] Formulario contacto: validación cliente; envío Formspree (éxito o error visible); consentimiento si está en UI.
- [ ] Responsive: móvil ancho ~375px, tablet ~768px, desktop ≥1280px (rotación en dispositivo real recomendada).
- [ ] Contraste: textos principales legibles sobre fondos oscuros (revisión visual).
- [ ] Imágenes: mascotas, logos y fondos cargan (sin icono roto).
- [ ] Cambio de idioma y cookie `argos_locale` coherentes con metadata en rutas dinámicas si aplica.

### IA / chat mascotas

- [ ] `POST /api/ai/public/mascot-chat` con `persona` `dumbo` y `chico`.
- [ ] Vacío / persona inválida → 400.
- [ ] Rate limit no bloquea smoke razonable (evitar spam en prueba).

### SEO (staging con dominio real o preview)

- [ ] `robots.txt` y `sitemap.xml` accesibles.
- [ ] Títulos y meta por página principal razonables.
- [ ] Canonical / `metadataBase` coherentes con URL pública.

---

## Checklist — Producción (go-live)

- [ ] TLS activo; redirección HTTP → HTTPS si aplica.
- [ ] `CORS_ORIGINS` y `FRONTEND_URL` coinciden con el sitio público (con/sin `www`).
- [ ] `NEXT_PUBLIC_BACKEND_URL` en build del frontend = URL pública del API.
- [ ] Backups de Postgres programados y restauración probada al menos una vez.
- [ ] Logs del API accesibles; nivel `LOG_LEVEL` acordado.
- [ ] Alertas mínimas (proveedor o Uptime): API 5xx, 503 sostenido en `/api/ai/public/mascot-chat`, caída de BD, formulario con tasa de error alta (si métrica disponible).
- [ ] Procedimiento de **deploy** y **rollback** documentado y probado en staging.
- [ ] Revisión final de checklist staging en entorno de producción recién desplegado.

---

## Fase 1 — API rápida (tabla de referencia)

| Paso | Comando / acción | Esperado |
|------|------------------|----------|
| Health | `GET /api/health` | HTTP 200, cuerpo con estado OK |
| Registro inválido | `POST /api/auth/register` con email inválido | HTTP 400 |
| IA `dumbo-chat` vacío | `POST /api/ai/public/dumbo-chat` `{"message":""}` | HTTP 400 |
| IA `mascot-chat` vacío / persona inválida | Ver script | HTTP 400 |
| IA `mascot-chat` válido | Mensaje no vacío | HTTP **200** (con OpenAI) o **503** (sin clave) |
| IA `dumbo-chat` válido (compat) | `{"message":"hola"}` | HTTP **200** o **503** (misma lógica) |
| Stats sin privilegio | `GET /api/security/stats` + JWT cliente | HTTP 403 |
| Stats admin | `GET /api/security/stats` + JWT admin | HTTP 200 |

**Automatizado** (backend en marcha). En staging con OpenAI configurada en el API, puedes exigir 200: `VERIFY_MASCOT_REQUIRES_200=1 ./scripts/verify-api.sh`.

```bash
./scripts/verify-api.sh
BASE_URL=https://api-staging.example TOKEN_CLIENT=eyJ... TOKEN_ADMIN=eyJ... TOKEN_REFRESH=eyJ... ./scripts/verify-api.sh
```

Variables opcionales del script: `TOKEN_CLIENT`, `TOKEN_ADMIN`, `TOKEN_REFRESH`. Opcional estricto: `VERIFY_MASCOT_REQUIRES_200=1` para exigir HTTP 200 en `mascot-chat` y `dumbo-chat` con mensaje válido (el servidor del API debe tener `OPENAI_API_KEY`).

## Fase 1b — Portal API

Con `TOKEN_CLIENT`, el script comprueba `GET /api/client/portal` → 200 y presencia de `user`.

## Fase 2 — Calidad frontend (gate)

```bash
npm run verify
```

Equivale a `tsc` + `next build` en frontend y `node --check` en archivos clave del backend.

## Fase 3 — Smoke manual breve (Docker / entrega rápida)

- Docker Compose según `docker/docker-compose.yml` si usáis contenedores.
- Rutas protegidas: `/dashboard` sin sesión → `/auth/login` (`frontend/proxy.ts`).

## Fase 7 — Pre-producción (resumen)

- TLS, CORS, JWT, backups antes de migraciones destructivas.

---

## Verificación por dominio (referencia rápida)

| Dominio | Qué mirar |
|---------|-----------|
| Frontend | Checklist staging: home, servicios, header/footer, legal, explainer, chat, formulario, responsive, consola, imágenes |
| Backend | health, auth, contact, IA pública, rutas con JWT, Socket.IO si aplica |
| IA / mascotas | `mascot-chat` y compatibilidad `dumbo-chat`; 400/503/200 según entorno |
| Formularios | Formspree desde `/contacto`; mensajes éxito/error |
| Responsive | Viewports móvil/tablet/desktop |
| Legal / SEO | Rutas legales, robots, sitemap, metadatos |

---

Para variables detalladas y Docker, ver el [README.md](../README.md).

---

## Plan maestro y cierre

- Estrategia, auditoría ampliada, fases 0–F, matriz de riesgos e ideas de mejora: [PLAN_FINAL_OPTIMIZACION_ARGOS.md](PLAN_FINAL_OPTIMIZACION_ARGOS.md).
- Este archivo (**VERIFY**) sigue siendo el **checklist operativo** (comandos y staging/prod).

**Recordatorio local (build / dependencias):**

- Build Next: si aparece *Another next build…*, cerrar procesos duplicados; si no hay ninguno, `rm -rf frontend/.next` y repetir (ver [README.md](../README.md)).
- `framer-motion` incompleto: `rm -rf frontend/node_modules/framer-motion && npm --prefix frontend install`.
- Playwright roto en raíz: `rm -rf node_modules && npm ci`.

**Siguiente:** staging con `./scripts/verify-api.sh` y `BASE_URL` real; aplicar parches de código descritos en el **Anexo A** de `PLAN_FINAL_OPTIMIZACION_ARGOS.md` (modo Agent en Cursor si Plan mode bloquea `.js`).

