# Auditoría full-stack ARGOS-IT y plan de entrega por fases

**Última actualización:** 2026-05-11 (Fase A documental).  
**Alcance:** monorepo (`frontend/` Next.js 16, `backend/` Express, `database/`, `e2e/`, `scripts/`, `docs/`, `docker/`).

**Nota profesional:** no se garantiza “cero errores absolutos” en producción sin validación en el entorno real (TLS, CORS, Postgres, cuotas OpenAI, tráfico). Sí se define **cierre verificable** con comandos y checklists.

**Plan maestro (fases 0–F, riesgos, ideas, storyboard):** [PLAN_FINAL_OPTIMIZACION_ARGOS.md](PLAN_FINAL_OPTIMIZACION_ARGOS.md).

## 1. Estado actual del proyecto

| Área | Estado |
|------|--------|
| Frontend | Next.js App Router, i18n (7 locales), páginas públicas, auth, dashboard, explainer, mascotas con chat → `POST /api/ai/public/mascot-chat` |
| Backend | Express: health, auth, contact relay opcional, IA pública (`mascot-chat`, `dumbo-chat`), IA protegida `/api/ai`, seguridad, cliente portal |
| Base de datos | Postgres vía `DATABASE_URL`; arranque del API **falla** sin ella (diseño intencional) |
| Tests | Playwright smoke en `e2e/smoke.spec.ts`; `npm run verify` = tsc + build frontend + `node --check` backend |
| CI | Workflow GitHub Actions en `.github/workflows/ci.yml` (push y PR a `main`) |
| Documentación | README, VERIFY (checklists), este documento, EXPLAINER_GUION_GRABACION, DEPLOY_AUTH |

---

## 2. Matriz: 18 criterios de cierre

| # | Criterio | Estado típico en repo | Responsable |
|---|----------|----------------------|---------------|
| 1 | `npm run verify` pasa | Automatizable en CI y local | Desarrollador / CI |
| 2 | `CI=1 npm run test:e2e` pasa | Requiere `npx playwright install chromium` | CI |
| 3 | `npm run build` pasa limpio | Incluido en `verify`; paso extra en CI por redundancia explícita | CI |
| 4 | `.env.example` completo | Raíz + `frontend/` + `backend/` alineados con `process.env` usados | Repo |
| 5 | README: install, dev, build, test, deploy, variables | README + VERIFY | Repo |
| 6 | `docs/VERIFY.md` checklist manual | Secciones local / staging / producción + por dominio | Repo |
| 7 | `docs/AUDIT_ENTREGA_FASES.md` | Este archivo | Repo |
| 8 | CI ejecuta verify, e2e, build | `.github/workflows/ci.yml` | Repo |
| 9 | Backend con `DATABASE_URL` real en staging | **Manual / entorno** | Operaciones |
| 10 | IA con `OPENAI_API_KEY` real o documentada pendiente | 503 sin clave documentado; 200 en staging con clave | Operaciones |
| 11 | Formularios probados | Contacto → Formspree; checklist manual VERIFY | QA |
| 12 | Chats Chico/Dumbo probados | E2E abre diálogo; API vía `verify-api.sh` | CI + QA |
| 13 | Responsive revisado | **Manual** (o futuros e2e viewport) | QA |
| 14 | Páginas legales accesibles | Rutas existentes; checklist VERIFY | QA |
| 15 | Sin rutas rotas conocidas | Smoke parcial; matriz manual ampliada | QA |
| 16 | Sin imágenes rotas conocidas | **Manual** o crawl | QA |
| 17 | Sin errores consola flujo principal | **Manual** o Playwright `page.on('pageerror')` | QA |
| 18 | Riesgos abiertos documentados | Sección 6 de este doc + VERIFY producción | Repo + equipo |

---

## 3. Gaps frente a los 18 criterios

- **9–11, 13–17:** no son “fallos de código” sino **evidencia de entorno** o cobertura de pruebas; el repo entrega automatización parcial (1–3, 8, 12 parcial).
- **E2E:** no envía mensaje real al chat ni valida respuesta OpenAI; no cubre formulario Formspree end-to-end (dependencia externa).
- **`verify-api.sh`:** valida health, registro 400, IA vacía/persona, **mensaje válido → 200 o 503**; tokens opcionales para rutas protegidas.

---

## 4. Problemas encontrados (consolidado)

1. Backend no inicia sin `DATABASE_URL` (esperado).
2. Chat IA pública requiere backend accesible desde el navegador (`NEXT_PUBLIC_BACKEND_URL` + CORS).
3. Posible colisión `next build` si dos procesos compilan a la vez (documentado en README).
4. Cobertura manual grande aún dependiente de humanos para criterios 13–17.

---

## 5. Riesgos

### Críticos

- Despliegue sin Postgres o sin migraciones → API caído o datos inconsistentes.
- CORS / URL del API mal configurados → chat mascotas y `fetch` autenticado fallan en cliente.

### Medios

- Sin `OPENAI_API_KEY`: 503 en IA pública (correcto; producto debe comunicarlo).
- Socket.IO activo sin `JWT_SECRET` ≥32 → fallo al conectar WS (no bloquea sitio estático ni REST de mascotas).
- Doble build en CI (`verify` + `test:e2e` webServer + `build`) → tiempo y carga; aceptable para gate estricto.

### Bajos

- Tests unitarios backend ausentes (mitigado por `node --check` + smoke).
- `LOG_LEVEL=silent` solo afecta log de bot en `security.js`; no sustituye observabilidad externa.

---

## 6. Qué está listo / qué no / qué bloquea producción

**Listo en repo:** scripts verify/build/e2e, smoke API ampliado, CI GitHub, documentación de variables y flujos, IA pública con ramas 400/503/200.

**No listo sin acción externa:** TLS, DNS, secrets en el proveedor, backups, monitorización, ejecución de checklist staging (criterios 9–11, 13–17).

**Bloquea “publicar”:** configuración de entorno (Postgres, JWT, CORS, URLs), no un único archivo faltante en el repositorio auditado.

---

## 7. Plan por fases A–E

| Fase | Contenido |
|------|------------|
| **A** | Documentación (AUDIT, VERIFY, README), `.env.example`, `verify-api.sh` reforzado |
| **B** | CI GitHub + ejecución local `verify`, `test:e2e`, `build` |
| **C** | Staging manual: checklist VERIFY “Staging” (BD real, IA real, formularios, responsive, legales) |
| **D** | Producción: TLS, backups, alertas, runbook deploy/rollback (ampliar VERIFY “Producción” o doc aparte) |
| **E** | Pulido no invasivo (solo bugs demostrados; sin rediseño ni cambio de marca) |

---

## 8. Criterios de cierre por fase

- **A:** AUDIT y VERIFY actualizados; `verify-api.sh` ejecutable y documentado; `.env.example` refleja vars usadas en código.
- **B:** CI verde en `main`; comandos locales documentados con mitigación build bloqueado.
- **C:** Checklist staging firmado o ticket con resultados.
- **D:** Variables prod y procedimientos revisados por responsable de despliegue.
- **E:** Issues menores cerrados sin tocar identidad visual.

---

## 9. Comandos de verificación

```bash
cd /path/to/argos-it-pro-final
npm ci && npm ci --prefix frontend && npm ci --prefix backend
npm run verify
npx playwright install chromium   # si hace falta
CI=1 npm run test:e2e
npm run build
# Con API levantado:
./scripts/verify-api.sh
BASE_URL=http://127.0.0.1:4000 TOKEN_CLIENT=... TOKEN_ADMIN=... ./scripts/verify-api.sh
```

**Variable opcional:** `VERIFY_MASCOT_REQUIRES_200=1` — falla si `mascot-chat` con mensaje válido no devuelve 200 (útil en staging con OpenAI configurada).

---

## 10. Archivos clave

| Archivo | Rol |
|---------|-----|
| [package.json](package.json) | Scripts verify / e2e / build |
| [playwright.config.ts](playwright.config.ts) | E2E + webServer build+start |
| [scripts/verify-api.sh](scripts/verify-api.sh) | Smoke HTTP API |
| [.github/workflows/ci.yml](.github/workflows/ci.yml) | CI |
| [docs/VERIFY.md](docs/VERIFY.md) | Checklists |
| [backend/routes/ai-public.js](backend/routes/ai-public.js) | mascot-chat / dumbo-chat |

---

## 11. Qué no debe tocarse sin permiso explícito

Identidad visual, logos, sprites y narrativa Chico/Dumbo, rutas públicas acordadas, textos comerciales en i18n, rediseño de layout. Solo correcciones de bug demostradas (enlace roto, error 500 reproducible, etc.).
