# Staging ARGOS-IT — preparación

Estado del repositorio: **preparado para staging**. Despliegue real **bloqueado** hasta disponer de proveedor, dominios y secretos.

Arquitectura recomendada (sustituir por dominios reales confirmados):

| Capa | URL sugerida |
|------|----------------|
| Frontend | `https://staging.argos-it.com` |
| Backend API | `https://api-staging.argos-it.com` |
| PostgreSQL | Privada (sin puerto público) |

## Proveedor

En este repositorio **no** hay `vercel.json`, `render.yaml`, `railway.json`, `fly.toml`, `Procfile` ni config Coolify/Hostinger versionada.
Hasta que se confirme el proveedor y el acceso CLI, no se ejecuta despliegue remoto.

## Variables (solo en el proveedor — nunca en Git)

### Backend

```text
NODE_ENV=production
PORT=<asignado_por_proveedor>
DATABASE_URL=<secreto proveedor>
JWT_SECRET=<openssl rand -hex 48>
JWT_REFRESH_SECRET=<otro openssl rand -hex 48>
CORS_ORIGINS=https://staging.argos-it.com
FRONTEND_URL=https://staging.argos-it.com
ENABLE_SOCKET_IO=false
OPENAI_API_KEY=<opcional>
OPENAI_MODEL=gpt-4o-mini
CONTACT_FORM_ENDPOINT=https://formspree.io/f/xpqooedl
LOG_LEVEL=info
```

### Frontend

```text
NEXT_PUBLIC_BACKEND_URL=https://api-staging.argos-it.com
```

## Migraciones

```bash
DATABASE_URL="<staging>" ./database/migrate.sh
```

Idempotente. Rol de migración (DDL) preferible distinto del rol de aplicación.
`database/seed_admin.sql` es **manual** y exige editar el correo.

## Datos necesarios del usuario

1. Proveedor del frontend
2. Proveedor del backend
3. Proveedor PostgreSQL
4. Dominio staging frontend
5. Dominio staging API
6. Acceso o CLI autenticada
7. `DATABASE_URL` de staging
8. `OPENAI_API_KEY` de staging (si se activa IA)
9. Permiso para crear DNS
10. Política de backups
11. Política de logs y alertas

## Validación tras despliegue

Ver [STAGING_RESULTADOS.md](./STAGING_RESULTADOS.md) y [VERIFY.md](./VERIFY.md).

## Docker local

Desde la raíz del repo (carga el override local de Postgres en `:5433`):

```bash
docker compose -f docker/docker-compose.yml -f docker/docker-compose.override.yml --env-file docker/.env up -d
```

O bien: `cd docker && docker compose --env-file .env up -d` (Compose carga `docker-compose.override.yml` automáticamente en ese directorio).

El compose base **no** publica el puerto de PostgreSQL. Solo la red interna (`db:5432`).
