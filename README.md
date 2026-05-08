# ARGOS-IT

Web profesional de consultoría informática para empresas, con foco en continuidad operativa, soporte técnico, ciberseguridad, redes, backup, automatización IA y desarrollo web empresarial.

## Stack principal

- Frontend: Next.js (App Router) + React + TypeScript + Tailwind
- Backend: Node.js + Express (en `backend/`)
- Formularios: Formspree (`https://formspree.io/f/xpqooedl`)
- i18n frontend: sistema propio con `localStorage` y detección de idioma del navegador

## Estructura relevante

```txt
frontend/
  app/                   # Rutas Next.js
  components/            # Layout, páginas, mascotas, SEO
  i18n/
    locales/             # es, en, ca, fr, de, it, pt
  hooks/                 # hooks de servicios e interacción
  lib/                   # utilidades y catálogo de slugs
  public/
    mascots/             # sprites PNG de Chico y Dumbo
```

## Comandos (frontend)

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Comandos desde raíz

También puedes usar los scripts proxy del root:

```bash
npm install
npm run dev
npm run build
npm run preview
```

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

En `frontend`:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

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
- La selección del usuario se guarda en `localStorage`.
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
