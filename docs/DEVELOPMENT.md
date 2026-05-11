# Desarrollo ARGOS-IT — disciplina de repo

## Ramas

- **`main`**: solo cambios verificados (lint/build y checklist acordado).
- **`feature/nombre-corto`**: nuevas funcionalidades.
- **`fix/nombre-corto`**: correcciones.

Evita mezclar en un mismo PR varias tareas no relacionadas.

## Commits

- Mensaje en **imperativo**, una idea por commit.
- Ejemplos: `fix(backend): validate refresh token user active`, `docs: add VERIFY smoke curls`.

## Antes de abrir PR o fusionar

1. `git status` — cambios acotados al objetivo.
2. Ver [VERIFY.md](VERIFY.md) para comprobaciones rápidas del API (con backend levantado).
3. Frontend: `npm run lint` y `npm run build` en `frontend/` (o `npm run verify` desde la raíz del repo).
