-- Elevar un usuario existente a administrador (después de registrarse en la app).
-- No crea cuentas nuevas: el email debe existir en `users`.
--
-- 1. Edita el correo en el UPDATE de abajo.
-- 2. Ejecuta desde la raíz del repo:
--      psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/seed_admin.sql
--
-- Comprueba:
--   SELECT id, email, role FROM users WHERE email = 'tu_email@ejemplo.com';
--
-- Para super_admin, cambia 'admin' por 'super_admin' en el SET.

BEGIN;

UPDATE users
SET role = 'admin',
    updated_at = NOW()
WHERE lower(trim(email)) = lower(trim('cambiar@tu-dominio.com'));

COMMIT;
