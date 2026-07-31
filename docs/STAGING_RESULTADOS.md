# Resultados de staging ARGOS-IT

Fecha: 2026-08-01
Commit: _commit de entrega de la rama; consultar el PR_
Rama: `deploy/staging-readiness`
Frontend URL: _PENDIENTE — sin dominio/proveedor confirmado_
Backend URL: _PENDIENTE — sin dominio/proveedor confirmado_
Proveedor frontend: _BLOQUEADO — no definido en el repositorio_
Proveedor backend: _BLOQUEADO — no definido en el repositorio_
Proveedor PostgreSQL: _BLOQUEADO — no definido en el repositorio_
Responsable: _(operador)_

## Automatizado

- [ ] CI verde
- [x] npm run verify — PASS local (2026-08-01)
- [x] E2E 8/8 — PASS local con `CI=1 E2E_PORT=3001 npx playwright test`
- [ ] API health 200 (staging remoto)
- [ ] verify-api público (staging remoto)
- [ ] cliente 403 stats (staging remoto)
- [ ] cliente 200 portal (staging remoto)
- [ ] admin 200 stats (staging remoto)
- [ ] refresh 200 (staging remoto)
- [ ] IA real 200 o 503 documentado

### Local (pre-staging)

- [x] `npm run verify` — TypeScript, build Next.js y `node --check` PASS
- [x] `CI=1 E2E_PORT=3001 npx playwright test` — 8/8 PASS
- [x] `./scripts/verify-api.sh` público — PASS; IA respondió 200 o 503 esperado
- [x] Roles locales — cliente stats 403, cliente portal 200, admin stats 200 y refresh 200
- [x] Docker health — PostgreSQL y backend healthy; `/api/health` y frontend HTTP OK

## Manual (staging remoto)

- [ ] Responsive
- [ ] Formulario
- [ ] Chat
- [ ] Idiomas
- [ ] Legal
- [ ] SEO
- [ ] Consola
- [ ] Imágenes
- [ ] Login
- [ ] Dashboard

## Riesgos abiertos

- sharp transitivo: dependencia de Next.js; no usar `npm audit fix --force` ni degradar Next.js
- OpenAI: sin clave → 503 `assistant_unavailable` (esperado)
- backups: política no definida por el usuario
- monitorización: no configurada en proveedor
- otros: despliegue remoto bloqueado por falta de proveedor/credenciales/DNS
- secretos: se recomienda rotar cualquier credencial local que haya aparecido previamente en logs; no se incluye su valor

## Rollback

Commit anterior: `640b95c` (ci: actualizar pipeline de GitHub Actions #4) en `main`
Imagen o release anterior: N/A (sin despliegue staging previo documentado)
Procedimiento: revertir PR / redeploy commit anterior en el proveedor; no `docker compose down -v`
Responsable: _(operador)_

## Notas

No marcar casillas de staging remoto sin evidencia HTTP/logs. Ver [STAGING.md](./STAGING.md).
