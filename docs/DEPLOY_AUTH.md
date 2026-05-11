# Despliegue: auth, refresh y admin

Fuente útil cuando los planes en `.cursor/plans/` no reflejan el repo.

## Comprobación en el repo (sin editar planes)

Desde la raíz del proyecto:

1. `npm run verify` — lint + build del frontend y `node --check` del backend (incluye `ensureRefreshSessions.js`).
2. `npm run verify:full` — lo anterior más `npm run test:e2e` (Playwright; instala navegadores la primera vez con `npx playwright install chromium`).
3. Con el API en marcha y variables opcionales: `./scripts/verify-api.sh` (ver [docs/VERIFY.md](VERIFY.md)).

## Tabla `refresh_sessions`

El backend crea la tabla al arrancar (ver `backend/lib/ensureRefreshSessions.js`). El procedimiento `database/refresh_sessions.sql` replica el mismo DDL para auditoría o entornos donde el proceso Node no tiene permiso `CREATE TABLE`; en ese caso ejecuta el SQL con un rol adecuado antes de desplegar el API.

## Rol administrador

Usuarios con rol `admin` o `super_admin` para endpoints como `GET /api/security/stats`: [database/seed_admin.sql](../database/seed_admin.sql) (edita el email, luego login de nuevo). Detalle en el [README principal](../README.md).
