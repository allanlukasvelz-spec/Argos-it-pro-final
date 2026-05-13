# Plan final de optimización y cierre — ARGOS-IT

**Versión:** 1.1 · **Fecha:** 2026-05-12  
**Alcance:** monorepo (`frontend/` Next.js App Router, `backend/` Express, `database/`, `e2e/`, `scripts/`, `docker/`) **y** carpeta [`wordpress-export/`](../wordpress-export/) (HTML estático de referencia / posible legado).

**Principio de prioridad:** la **fuente canónica** desplegable en producción es el monorepo; el export WordPress debe documentarse y acotarse para evitar divergencia con la app Next.js.

**Reglas de engagement (aprobadas):**

- Se prioriza **auditoría, documentación, planificación** y **mejoras técnicas seguras** que no alteren identidad visual ni marca.
- **No** se rediseña la UI, **no** se cambian colores principales, logos, mascotas ni rutas comerciales sin confirmación explícita.
- Las **sugerencias visuales o de copy comercial** se listan como *pendientes de aprobación*; no se implementan hasta OK del producto.
- No se promete “cero errores absolutos” en producción sin validación en entorno real (TLS, CORS, Postgres, cuotas OpenAI, tráfico).

**Documentos relacionados (evitar duplicar sin necesidad):**

- [AUDIT_ENTREGA_FASES.md](AUDIT_ENTREGA_FASES.md) — 18 criterios de cierre y riesgos.
- [VERIFY.md](VERIFY.md) — checklists local / staging / producción.
- [EXPLAINER_GUION_GRABACION.md](EXPLAINER_GUION_GRABACION.md) — grabación `/explainer`, parámetros URL, guion por escenas.
- [README.md](../README.md) — instalación, verify, CI, troubleshooting build.

---

## Alcance dual: monorepo y `wordpress-export/`

| Superficie | Tecnología | Formularios | Chico / Dumbo | CI / verify | Uso recomendado |
|------------|------------|-------------|---------------|-------------|------------------|
| **Monorepo** | Next.js + Express + Postgres | Página `/contacto` publica contra **Formspree** desde el cliente; backend [`routes/contact.js`](../backend/routes/contact.js) puede reenviar con `CONTACT_FORM_ENDPOINT` | Chat real vía `POST /api/ai/public/mascot-chat` ([`ai-public.js`](../backend/routes/ai-public.js)) + sprites en frontend | [`npm run verify`](../package.json), GitHub Actions, Playwright | **Producción** y staging principal |
| **`wordpress-export/`** | HTML/CSS/JS estático, sin `package.json` propio | `action="https://formspree.io/f/xpqooedl"` en múltiples `.html` | `asistente-chico.html` / `asistente-dumbo.html`: **reglas locales** (texto indica futura IA vía backend sin exponer claves) | Ninguno en repo | **Referencia**, espejo offline, migración contenido, o dominio legacy; **no** debe desalinear mensaje de producto respecto al monorepo |

**Riesgos de convivencia**

- Copy, CTAs y flujo “IA” distintos entre estático y Next → confusión del visitante (**mitigación:** una sola URL pública; redirects 301 desde hosting estático si sigue publicado).
- Dos envíos Formspree posibles con payloads distintos → analíticas informales (**mitigación:** etiquetas `_subject` / campos ocultos ya presentes en ambos mundos donde aplique).
- SEO duplicado si ambos están indexados (**mitigación:** `noindex` en export o canonical al dominio Next — **requiere decisión Ops**).

**Qué NO hacer sin confirmación:** eliminar carpetas del export si contienen enlaces externos indexados; fusionar rutas `.html` con rutas Next sin tabla de redirecciones.

---

## TAREA 1 — Auditoría profesional (síntesis con referencias)

### 1. Arquitectura general

| Área | Hallazgo | Rutas / notas |
|------|-----------|----------------|
| Frontend | Next.js 16 App Router, i18n multilocale, layout global con metadata OG/Twitter, `SiteShell` / `ClientShell`, proxy Next 16 en `frontend/proxy.ts` | `frontend/app/`, `frontend/components/` |
| Backend | Express + `http` + Socket.IO opcional; CORS por lista; Helmet; Morgan; límites de tasa | `backend/server.js` |
| API pública | Auth, contacto relay, IA pública (`/api/ai/public`), health | `backend/routes/*` |
| API protegida | IA autenticada, security, cliente | `authMiddleware` + rutas |
| Base de datos | Postgres vía `DATABASE_URL`; servidor falla al arrancar si falta tabla refresh (ensure) | `backend/db.js`, `lib/ensureRefreshSessions.js` |
| Scripts | `verify-api.sh` para smoke HTTP del API | `scripts/verify-api.sh` |
| CI | push/PR `main`: npm ci ×3, verify, Playwright, build | `.github/workflows/ci.yml` |
| Documentación | README, VERIFY, AUDIT, guion explainer, deploy | `docs/` |
| Assets / sprites | Mascotas Chico/Dumbo: manifiesto de sprites compartido con explainer | `frontend/sprites/spriteManifest.ts`, `frontend/src/data/explainerScenes.ts` |
| Sitio estático | Export HTML paralelo (portal, servicios, método, legales); Formspree inline; chats locales | `wordpress-export/**/*.html` |

### 2. Frontend (funcional vs manual)

**Verificado en código:** rutas públicas (home, servicios con slug, contacto, legal, explainer dedicado `/explainer`), chat mascotas (`MascotChatProvider`, `postMascotChat` → `/api/ai/public/mascot-chat`), formulario contacto Next (**Formspree directo desde navegador** en [`ContactView.tsx`](../frontend/components/pages/ContactView.tsx); relay backend opcional para otros flujos), metadata y schema en `layout.tsx`, sitemap/robots en App Router.

**Requiere QA manual:** contrastes finos en todos los modos, Lighthouse/a11y completo, consola limpia en todos los flujos, hover/focus en cada componente interactivo, responsive en dispositivos reales.

### 3. Backend / API

| Ruta montaje | Notas |
|--------------|--------|
| `/api/auth` | JWT, refresh; rate limit auth en rutas sensibles |
| `/api/ai/public` | `aiLimiter`; `mascot-chat`, `dumbo-chat`; validación mensaje `normalizeChatMessage` |
| `/api/contact` | `contactLimiter`; validación básica; relay opcional Formspree |
| `/api/ai` | Protegida + `aiLimiter` |
| `/api/security`, `/api/client` | Protegidas |
| `/api/health` | 200 JSON |

**HTTP:** 400 validación; 401/403 en rutas protegidas; 502 contacto si Formspree falla vía relay; **503 IA:** sin `OPENAI_API_KEY` o timeout de proveedor → cuerpo JSON controlado (`assistant_unavailable`, mensaje fijo al cliente en [`ai-public.js`](../backend/routes/ai-public.js)); 500 genérico en otros fallos del asistente público.

**Socket.IO:** JWT en handshake; desactivable con `ENABLE_SOCKET_IO=false`.

### 4. Chico y Dumbo IA

| Aspecto | Estado actual | Brechas suaves |
|---------|---------------|----------------|
| Personas separadas | `persona` en body + `DUMBO_SYSTEM` / `CHICO_SYSTEM` en `ai-public.js` | Iterar prompts con más preguntas guía si producto lo pide (**confirmación copy**) |
| Límites | `AI_MESSAGE_MAX_LEN` (default 6000) | OK |
| Rate limit | `AI_RATE_LIMIT_*` | OK |
| Fallback sin OpenAI | 503 + JSON estable | Sin exponer detalle interno al cliente (**implementado**) |
| Timeout proveedor IA | 503 + mismo contrato que indisponibilidad (**implementado**, ver Anexo A) | Revisar umbral `OPENAI_TIMEOUT_MS` en staging |
| UX errores | i18n `mascots.chat.error*` en contexto | OK |

### 5. Video / animación explicativa

- **Implementación:** 6 escenas indexadas 0–5 (`EXPLAINER_SCENE_COUNT`), datos en `explainerScenes.ts`, textos i18n `home.explainer.s0`…`s5`, componente `ArgosExplainerAnimation.tsx`, página limpia `/explainer` (sin chrome global para grabación).
- **Narrativa pedida (7 escenas):** se mapea a la estructura actual: intro+logo (s0), problemas (s1), soluciones (s2), entrada Chico (s3), protección (s4), CTA conjunto (s5). Una “escena 7” explícita de handoff al formulario puede ser **solo copy/CTA** en s5 o **séptima escena futura** — requiere aprobación de producto y toque en datos/i18n (no obligatorio para estabilidad técnica).

### 6. SEO y rendimiento

- **Presente:** `metadataBase`, title/description/keywords, Open Graph, Twitter card, robots, canonical, JSON-LD ProfessionalService en layout, rutas `sitemap.xml` y `robots.txt`.
- **Manual/futuro:** auditoría Lighthouse, Core Web Vitals en producción, alt text exhaustivo en contenido dinámico, SEO local (schema LocalBusiness si aplica — **confirmación**).

### 7. Seguridad y riesgos

- Secretos solo en env; `.env.example` en raíz, `frontend/`, `backend/` documentan variables.
- CORS explícito; no exponer stack traces al cliente en rutas auditadas de IA pública.
- Producción: TLS, backups Postgres, logs centralizados, alertas — **operaciones**, no solo repo.

### 8. QA y pruebas

| Comando / artefacto | Uso |
|---------------------|-----|
| `npm run verify` | lint TS frontend + `next build` + `node --check` backend |
| `CI=1 npm run test:e2e` | Playwright smoke (8 tests en `e2e/smoke.spec.ts`) |
| `npm run build` | build frontend desde raíz |
| `./scripts/verify-api.sh` | API real con `BASE_URL` |

**Limitación:** E2E no valida respuesta OpenAI real ni envío Formspree end-to-end.

---

## TAREA 2 — Plan por fases (0–F)

### FASE 0 — Auditoría y diagnóstico

- **Bien:** CI, verify, e2e smoke, IA pública con límites y mensajes de error controlados, explainer grabable documentado, metadata rica, prompts separados Chico/Dumbo en backend.
- **Incompleto:** evidencia manual responsive/a11y/consola; staging con dominio real; observabilidad prod; **decisión explícita sobre rol público de `wordpress-export/`** (redirect, archivo o sólo desarrollo).
- **Bloquea producción:** `DATABASE_URL`, JWT fuertes, CORS/orígenes correctos, `OPENAI_API_KEY` si el producto promete IA en vivo; TLS y backups fuera del repo.
- **Mejoras sin tocar diseño:** timeouts OpenAI; validación/longitud formulario alineada a backend; scripts; matrices de riesgo en este documento.

### FASE A — Estabilidad técnica

- Mantener verde: verify, e2e, build.
- Reproducibilidad `npm ci` en los tres paquetes; troubleshooting `.next` y `node_modules` corruptos (README/VERIFY).

### FASE B — Frontend “profesional” (sin rediseño)

- Pulido **técnico:** foco visible, labels en formularios, mensajes de error ya mapeados en chat.
- **Sugerencias visuales (requieren aprobación):** microajustes de espaciado tipográfico, ilustraciones adicionales, nuevos bloques en home.

### FASE C — Chico y Dumbo IA

- Refinar prompts (backend) y, si se aprueba, copy de bienvenida en `i18n` (afecta texto, no marca gráfica).
- Revisar logs: nunca loguear body del usuario completo en producción sin política (evaluar).

### FASE D — Video / animación

- Seguir [EXPLAINER_GUION_GRABACION.md](EXPLAINER_GUION_GRABACION.md); ampliar a 7 escenas narrativas en guion corporativo; implementación incremental vía `explainerScenes.ts` + locales (**confirmación** si cambia duración/tiempos VO).

### FASE E — SEO, performance, conversión

- Revisión técnica de metadatos por página si faltan overrides por ruta.
- Imágenes: `next/image` donde ya esté; lazy sobre secciones pesadas (**evaluar sin cambiar diseño**).

### FASE F — Seguridad y producción

- Staging con TLS; backups; runbook rollback; checklist VERIFY producción.

---

## TAREA 3 — Ideas de mejora (valor sin romper identidad)

Formato: **Mejora | Por qué | Riesgo | Archivos | ¿Confirmación?**

1. **Mensaje 503 IA sin detalle interno** | Evita filtrar configuración | Bajo | `backend/routes/ai-public.js` | No — **implementado (v1.0)**  
2. **Prompts Dumbo/Chico más guiados (preguntas + CTA formulario)** | Mejor conversión y rol claro | Bajo respuesta larga | `ai-public.js` | No  
3. **Timeout explícito en llamada OpenAI** | Evita colgados | Medio si mal calibrado | `ai-public.js`, `ai.js`, `.env.example` | No — **implementado (v1.1)**  
4. **Tests E2E: enviar un mensaje mock con MSW o API stub** | Más confianza sin OpenAI | Esfuerzo | `e2e/`, mock server | Opcional  
5. **verify-api.sh en CI contra contenedor API** | Regresión API | Complejidad CI | `.github/workflows/ci.yml` | Sí (infra)  
6. **`aria-live` en panel chat + alertas en error** | A11y lectores de pantalla | Bajo | `MascotChatPanel.tsx` | No — lista `polite`; bloque error `role="alert"` (**v1.1**)  
7. **Reducir motion ya respetado** | Comprobar `useReducedMotion` en explainer | Bajo | `ArgosExplainerAnimation.tsx` | No  
8. **OG por página de servicio** | Mejor sharing | Copy por página | `app/servicios/**/metadata` | Sí (copy)  
9. **Schema Service por slug** | SEO rich | Mantenimiento | `app/servicios/[slug]/page.tsx` | Sí  
10. **Rate limit por IP+usuario si escala** | Abuso | Complejidad | `middleware/security.js` | Sí  
11. **Export explainer a vídeo MP4 offline** | Marketing | Pipeline externo | fuera de repo | Sí  
12. **Panel admin métricas uso IA** | Producto | Privacidad | nuevo módulo | Sí  
13. **Caché CDN assets estáticos** | Performance | Ops | hosting | Sí  
14. **Formulario: validación cliente alineada a backend** | Menos truncado silencioso / frustración | Bajo | `ContactView.tsx`, locales `contact.form.errors.maxLength` | No — **límite 2000 caracteres por campo (v1.1)**  
15. **Documentar RUNBOOK incidentes** | Operación | — | `docs/` | No  
16. **Microcopy post-error en chat con enlace contacto visible** | Conversión cuando IA falla | Bajo | ya existe link; revisar traducciones | No  
17. **Checklist enterprise en página contacto** | Confianza B2B | Copy | `contact` copy i18n | Sí  
18. **Bloque “cómo trabajamos” reutilizado en servicios** | Clarifica proceso | Diseño/copy | páginas servicio | Sí  
19. **Sitemap priorizado por URLs ingresadas en Search Console** | SEO técnico | Bajo | `app/sitemap*` | No  
20. **Política retención logs IA (RGPD)** | Legal/confianza | Medio | `docs/` + DPO | Sí  
21. **301 / noindex para `wordpress-export` si sigue público** | Evita contenido duplicado | Medio SEO | infra hosting | Sí (Ops)  
22. **Contraste foco visible global `:focus-visible`** | WCAG | Riesgo visual mínimo | `globals.css` | Sí (si toca tono UI)  

---

## TAREA 4 — Chico vs Dumbo (rol y matriz)

| Dimensión | Dumbo (guía) | Chico (guardián) |
|-----------|--------------|-------------------|
| Objetivo | Diagnosticar necesidad, orientar servicios, llevar al contacto | Seguridad, continuidad, prevención, confianza |
| Tono | Cercano, claro | Sereno, protector |
| Evita | Precios/legal inventados | Alarmismo, incidentes inventados |
| Cierre | Formulario / servicios | Formulario si intervención real |

**Implementación referenciada:** prompts en [backend/routes/ai-public.js](../backend/routes/ai-public.js); bienvenidas: claves `mascots.messages.idle.*` en locales frontend.

---

## TAREA 5 — Storyboard narrativo (7 escenas) y mapeo

| Escena narrativa | Contenido | Mapeo actual / notas |
|------------------|-----------|----------------------|
| 1 | Logo ARGOS-IT, Dumbo guía entra | `s0`, `showLogo: true`, walking |
| 2 | Dumbo guía por “plataforma” digital | Transición s0→s1 (problemas como fricción) |
| 3 | Paneles: problemas comunes | `s1` + lista `home.explainer.problems` |
| 4 | Problemas → soluciones ARGOS | `s2` + `home.explainer.solutions` |
| 5 | Chico guardián aparece | `s3` guardian phases |
| 6 | Chico: seguridad y confianza | `s4` + `home.explainer.protection` |
| 7 | Handoff Dumbo+Chico → formulario | `s5` CTAs i18n; ampliar copy si hace falta (**confirmación**) |

Paleta y assets: **sin cambiar**; animaciones suaves y `prefers-reduced-motion` ya contemplados en documentación de grabación.

---

## TAREA 6 — Plan de prevención de riesgos (matrices)

**Leyenda:** Impacto y probabilidad en escala relativa (Alto / Medio / Bajo). **Resp.** sugerido: Dev | Ops | Producto | QA.

### 6.1 Riesgos técnicos

| ID | Riesgo | Impacto | Prob. | Prevención | Detección | Resolución | Fase | Resp. |
|----|--------|---------|-------|------------|-----------|------------|------|-------|
| RT01 | Fallo `npm run verify` / `next build` | Alto | Media | CI en `main`; una instancia build local | CI rojo / exit≠0 | Leer log; `rm -rf frontend/.next`; `npm ci` | A | Dev |
| RT02 | Variables `.env` incorrectas | Alto | Media | `.env.example`, [VERIFY.md](VERIFY.md) | 500 auth, JWT, health | Corregir secretos y URLs | F | Ops |
| RT03 | Backend sin `DATABASE_URL` | Alto | Media staging | Checklist pre-deploy | Pool / crash al arrancar | Configurar Postgres | F | Ops |
| RT04 | Sin `OPENAI_API_KEY` | Medio UX | Media | Documentar 503 | JSON `assistant_unavailable` | Configurar clave o mantener copy | C/F | Ops |
| RT05 | Timeout o caída API OpenAI | Medio | Media | `OPENAI_TIMEOUT_MS`; monitoreo proveedor | 503 mascot-chat | Revisar cuotas/red; ajustar timeout | C | Dev |
| RT06 | CORS mal configurado | Alto | Media | Lista `CORS_ORIGINS` explícita | Errores CORS en navegador | Añadir origen del frontend | F | Ops |
| RT07 | Formulario Formspree no entrega | Alto conv. | Baja | Prueba en staging | Usuario / 4xx red | Endpoint Formspree / spam | B | Dev |
| RT08 | `/api/contact` sin `CONTACT_FORM_ENDPOINT` | Medio | Baja | Logs `[CONTACT]` | HTTP 202 sin envío externo | Configurar relay si se usa API | F | Ops |
| RT09 | Chat 503 percibido como rotura | Medio | Media | Mensaje claro + CTA contacto | Soporte | Mejorar copy i18n (**confirmación**) | B | Producto |
| RT10 | Imágenes / assets 404 | Medio | Baja | Rutas `public/` | Crawl manual | Corregir rutas | B | Dev |
| RT11 | Rutas internas rotas (404) | Alto | Baja | E2E smoke | Usuarios / logs | Corregir `Link` / redirects | B | Dev |
| RT12 | Fallos responsive | Medio | Media | QA dispositivos reales | Feedback | Fixes CSS puntuales (**confirmación** si layout) | B | QA |
| RT13 | Errores consola en producción | Medio | Media | Revisar tras cambios | DevTools | Corregir datos/efectos | B | Dev |
| RT14 | JWT débil o mal rotado | Alto | Media | Secretos ≥32 chars | 401 masivo | Rotar `JWT_*` coordinado | F | Ops |
| RT15 | Socket.IO sin token válido | Medio | Baja | Doc handshake | WS no conecta en admin | Pasar JWT en cliente | F | Dev |
| RT16 | **Dos superficies públicas** (export estático + Next) indexadas | Medio SEO | Media | Redirect 301 o `noindex` export | Search Console duplicados | Una URL canónica | E | Ops |
| RT17 | Colisión “Another next build…” / EMFILE | Alto dev | Media | `playwright` usa `next start`; ver README | Mensaje CLI | Cerrar procesos; aumentar ulimit macOS | A | Dev |

### 6.2 Riesgos de producto

| ID | Riesgo | Impacto | Prob. | Prevención | Detección | Resolución | Fase | Resp. |
|----|--------|---------|-------|------------|-----------|------------|------|-------|
| RP01 | Mensajes IA robóticos | Medio | Media | Prompts humanos | Feedback | Iterar prompts / i18n (**confirmación**) | C | Producto |
| RP02 | Dumbo/Chico poco diferenciados | Medio | Media | Matriz TAREA 4 | Entrevistas | Aclarar microcopy (**confirmación**) | C | Producto |
| RP03 | CTA débil tras explainer | Medio | Media | Guion escenas + medición | Baja conversión | Mejorar CTAs (**confirmación**) | D/E | Producto |
| RP04 | Usuario no sabe qué hacer después | Alto | Media | Flujos guiados Dumbo | Abandono | Botones guía + formulario | B/C | Producto |
| RP05 | Servicio sin página clara | Medio | Baja | Auditar slugs | 404 / confusión | Contenido servicio | E | Producto |
| RP06 | Formularios confusos | Medio | Media | Labels y errores i18n | Drop-off | Revisar UX form | B | Producto |
| RP07 | **Incoherencia** export WordPress vs Next (IA, textos) | Alto | Alta | Una URL pública; doc en este plan | Comparación manual | Redirect o archivo export | F | Ops/Producto |

### 6.3 Riesgos de producción

| ID | Riesgo | Impacto | Prob. | Prevención | Detección | Resolución | Fase | Resp. |
|----|--------|---------|-------|------------|-----------|------------|------|-------|
| RF01 | Sin backups Postgres | Alto | Media | Runbook + proveedor PG | Pérdida datos | Restauración; activar PITR/backups | F | Ops |
| RF02 | Sin logs agregados | Medio | Alta | Log drain (Dozzle/ELK/etc.) | Incidente ciego | Conectar logs | F | Ops |
| RF03 | Sin alertas uptime / latencia | Alto | Media | Synthetics mínimos | Caídas largas | Pingdom/UptimeRobot/APM | F | Ops |
| RF04 | Sin runbook rollback | Alto | Media | [DEPLOYMENT.md](DEPLOYMENT.md) | Deploy fallido | Volver versión anterior | F | Ops |
| RF05 | Sin entorno staging | Alto | Media | Clonar prod-like | Bugs solo en prod | Staging DNS + env | F | Ops |
| RF06 | Sin prueba TLS + dominio real | Alto | Baja | Checklist pre-prod | Mixed content / CORS | Ajustar URLs absolutas | F | Ops |
| RF07 | Formularios no verificados en dominio final | Medio | Media | Test real post-DNS | Correo no llega | DNS SPF/DKIM Formspree | F | Ops |
| RF08 | Sin observabilidad API (5xx, latencia) | Medio | Alta | Métricas mínimas | Usuarios reportan lentitud | APM / logs estructurados | F | Ops |
| RF09 | Filtración de secretos (commit, log) | Alto | Baja | secret scanning, no loguear bodies | Alerta repo | Rotar claves | F | Dev |

---

## TAREA 7 — Implementación controlada

**Permitido sin aprobación de producto visual:** documentación; validación y mensajes de error seguros; prompts backend; límites; scripts; pequeños `aria-*`; fixes de seguridad que no cambien UI.

**Requiere confirmación:** cambios de layout, colores, ilustraciones, textos comerciales largos, nuevas rutas, arquitectura mayor.

---

## TAREA 8 — Verificación (ejecutar fuera de Plan mode)

Desde la raíz del repo:

```bash
npm run verify
CI=1 npm run test:e2e
npm run build
```

Registrar salidas en **Anexo B** (abajo).

---

## TAREA 9 — Informe final (ejecución local 2026-05-12)

1. **Resumen ejecutivo:** Documentación maestro actualizada (v1.1): alcance dual monorepo + `wordpress-export/`, matrices de riesgo RT/RP/RF, anexos alineados al código. Parches seguros: timeout OpenAI (`OPENAI_TIMEOUT_MS`), 503 por timeout en mascot público, validación/longitud contacto (2000 chars), `role="alert"` en errores del chat.  
2. **Estado actual:** `npm run verify` y `npm run build` OK en máquina local; `CI=1 npm run test:e2e` OK tras instalar binarios Playwright (`npx playwright install chromium`).  
3. **Archivos creados:** ninguno nuevo obligatorio (solo contenido actualizado en este `.md`).  
4. **Archivos modificados:** `docs/PLAN_FINAL_OPTIMIZACION_ARGOS.md`, `backend/routes/ai-public.js`, `backend/routes/ai.js`, `backend/.env.example`, `.env.example`, `frontend/components/mascots/MascotChatPanel.tsx`, `frontend/components/pages/ContactView.tsx`, `frontend/i18n/locales/*.json` (7 idiomas).  
5. **Auditoría:** ver TAREA 1 y tabla alcance dual.  
6. **Plan por fases:** TAREA 2 (FASE 0–F).  
7. **Ideas de mejora:** TAREA 3 (ampliada).  
8. **Implementadas:** ver Anexo A (última revisión).  
9. **Requieren confirmación:** ítems TAREA 3 marcados «Sí» (OG por servicio, schema slug, infra CI API, redirects export, etc.).  
10. **Chico IA — estado:** `CHICO_SYSTEM` en [`ai-public.js`](../backend/routes/ai-public.js); mismo endpoint que Dumbo con `persona: "chico"`; timeouts compartidos.  
11. **Dumbo IA — estado:** idem con `DUMBO_SYSTEM`; compat `/dumbo-chat`.  
12. **Video/explainer:** 6 escenas en código; guion 7 pasos narrativos mapeados en TAREA 5; opción séptima escena = decisión producto.  
13. **Riesgos detectados:** principalmente convivencia export vs Next (RP07/RT16), observabilidad prod (RF02–RF08).  
14. **Prevención:** matrices §6.1–6.3.  
15. **Comandos:** TAREA 8 + `npx playwright install chromium` (local si faltaban binarios).  
16. **`npm run verify`:** exit code **0** (tsc + `next build` + `node --check` backend).  
17. **`CI=1 npm run test:e2e`:** exit code **0** — **8 passed** (~10.6s).  
18. **`npm run build`:** exit code **0** (tras breve espera si otro proceso Next había liberado lock; si falla con «Another next build…», esperar o cerrar proceso previo).  
19. **Falta staging:** dominio/API URL definitivos; env staging; prueba Formspree real; IA con `OPENAI_API_KEY`; decisión sobre `wordpress-export` público.  
20. **Falta producción:** TLS, backups Postgres, logs/alertas, runbook rollback ejecutado al menos una vez, Core Web Vitals en entorno real.  
21. **Próximos pasos:** commitear cambios; desplegar staging; ejecutar [VERIFY.md](VERIFY.md); cerrar política sobre export estático (301/noindex).

---

## Anexo A — Parches de código aplicados

### Histórico ya presente en producción (`ai-public.js`)

1. **503 sin filtrar detalle interno** cuando falta `OPENAI_API_KEY`: respuesta JSON `assistant_unavailable` + `message` fijo; causa solo en log servidor.  
2. **Prompts Dumbo/Chico:** rol guía vs guardián, CTA formulario, líneas anti-abuso (sin cambiar contrato API).

### Revisión v1.1 (esta entrega)

3. **`OPENAI_TIMEOUT_MS`** (default `45000`): cliente OpenAI con timeout en [`backend/routes/ai-public.js`](../backend/routes/ai-public.js) y [`backend/routes/ai.js`](../backend/routes/ai.js); documentado en [`backend/.env.example`](../backend/.env.example) y [`.env.example`](../.env.example).  
4. **503 por timeout / latencia OpenAI** en chat público: mismo contrato JSON que indisponibilidad (`assistant_unavailable`), mensaje distinto para el usuario.  
5. **Contacto Next:** validación y `maxLength={2000}` alineados a `clean(..., 2000)` del relay backend; clave i18n `contact.form.errors.maxLength` en los 7 locales.  
6. **A11y chat:** panel de mensajes ya tenía `aria-live="polite"`; bloque de error con `role="alert"` y `aria-live="assertive"` en [`MascotChatPanel.tsx`](../frontend/components/mascots/MascotChatPanel.tsx).

---

## Anexo B — Resultados de verificación

| Comando | Fecha | Resultado | Notas |
|---------|-------|-----------|--------|
| `npm run verify` | 2026-05-12 | **OK** (exit 0) | Next 16.2.5 Turbopack build + `node --check` backend |
| `CI=1 npm run test:e2e` | 2026-05-12 | **OK** (exit 0) | **8 passed** (~10.6s). Requiere binarios Playwright: `npx playwright install chromium` si aparece «Executable doesn't exist» |
| `npm run build` | 2026-05-12 | **OK** (exit 0) | Si falla «Another next build process is already running», esperar cierre del `webServer` de Playwright u otro build y reintentar |

**Nota entorno CI/GitHub Actions:** el workflow ya ejecuta `npx playwright install chromium --with-deps`; en desarrollo local hay que instalar browsers la primera vez.

---

## Enlace con VERIFY

El checklist operativo sigue en [VERIFY.md](VERIFY.md). El plan maestro de producto y riesgos es **este archivo**.
