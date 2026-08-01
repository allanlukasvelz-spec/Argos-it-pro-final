-- Elevar un usuario EXISTENTE a administrador (después de registrarse en la app).
-- MANUAL: no se ejecuta en migraciones automáticas ni en producción sin operador.
-- No crea cuentas nuevas: el email debe existir en `users`.
--
-- 1. Sustituye el valor de target_email (no dejes el placeholder).
-- 2. Ejecuta desde la raíz del repo:
--      psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/seed_admin.sql
--
-- Comprueba:
--   SELECT id, email, role FROM users WHERE email = 'tu_email@ejemplo.com';
--
-- Para super_admin, cambia 'admin' por 'super_admin' en el UPDATE.

BEGIN;

DO $$
DECLARE
  -- >>> Edita SOLO esta línea con un correo real ya registrado <<<
  target_email text := 'CAMBIAR_EMAIL_AQUI';
  updated_count int;
BEGIN
  IF target_email IS NULL
     OR btrim(target_email) = ''
     OR lower(btrim(target_email)) IN ('cambiar_email_aqui', 'cambiar@tu-dominio.com') THEN
    RAISE EXCEPTION
      'seed_admin.sql: edita target_email con el correo de un usuario existente antes de ejecutar';
  END IF;

  UPDATE users
  SET role = 'admin',
      updated_at = NOW()
  WHERE lower(trim(email)) = lower(trim(target_email));

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  IF updated_count = 0 THEN
    RAISE EXCEPTION 'seed_admin.sql: no existe usuario con email %', target_email;
  END IF;

  RAISE NOTICE 'Usuario % elevado a admin (% fila(s))', target_email, updated_count;
END $$;

COMMIT;
