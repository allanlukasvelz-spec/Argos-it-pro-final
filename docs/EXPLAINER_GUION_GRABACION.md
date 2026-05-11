# Explainer Dumbo y Chico: guion, tiempos y grabación

Ruta limpia para pantalla completa sin cabecera, pie, banner de cookies ni mascotas flotantes globales: `/explainer` (`robots: noindex`). En home el bloque es el mismo componente dentro del layout habitual.

## Parámetros URL (OBS / QuickTime)

| Parámetro | Efecto |
|-----------|--------|
| `explainerRecord=1` | No pausa el autoavance al pasar el ratón por la sección (evita cortes accidentales al mover el cursor). |
| `explainerManual=1` | Solo avance manual (pestañas, Anterior, Siguiente); sin temporizador entre escenas. |
| `explainerAutoMs=8000` | Intervalo entre escenas en milisegundos (entre 3000 y 60000). Tiene prioridad sobre el multiplicador. |
| `explainerAutoMult=1.5` | Multiplica el intervalo por defecto (6500 ms). Solo si no se define `explainerAutoMs`. |

Ejemplos:

- Auto continuo, sin pausa por hover, 8 s por escena:  
  `/explainer?explainerRecord=1&explainerAutoMs=8000`
- Ritmo por defecto pero sin hover-pause:  
  `/explainer?explainerRecord=1`

## Guión visible (ES) y duración orientativa

Intervalo por defecto en código: **6,5 s** por escena (6 × 6,5 s ≈ 39 s solo de autoavance). Ajustar con `explainerAutoMs` o `explainerAutoMult` según locución.

| Escena | Título (ES) | Notas VO / post |
|--------|-------------|-----------------|
| 0 — Introducción | Dumbo te guía. Chico te protege. | Presentar pareja guía + guardián y acompañamiento a empresas. |
| 1 — Problemas | La plataforma también tiene fricción | Enumerar dolores (equipos lentos, web, formularios, correo…). Ritmo ágil. |
| 2 — Soluciones | ARGOS-IT transforma el recorrido | Dos Dumbo en pantalla: reforzar “recorrido ordenado” y servicios alineados. |
| 3 — Guardián | Entra Chico: seguridad y vigilancia | Transición narrativa a modo protección; badges de escudo/monitorización/políticas. |
| 4 — Protección | Áreas de protección | Perímetro digital estructurado (equipos, accesos, backups, continuidad…). |
| 5 — Contacto | Cuéntanos qué necesita tu empresa | Cierre con CTA a formulario y servicios; tiempo extra si hay voz en off con llamada a la acción. |

Textos exactos por idioma: claves `home.explainer.s0` … `s5` en `frontend/i18n/locales/*.json`.

## Checklist antes de grabar

1. **Build de producción**: `npm run build` y `npm --prefix frontend run start` (evita overlays de desarrollo).
2. **Resolución**: objetivo **1920×1080**, zoom del navegador **100 %**, ventana maximizada o viewport estable.
3. **Idioma**: fijar el idioma de entrega (p. ej. español) como en producción o vía selector del sitio.
4. **Movimiento reducido**: comprobar que el público objetivo no dependa solo de `prefers-reduced-motion` para el vídeo; para pruebas A11y, pasar una toma con teclado (tabs, foco visible en controles).
5. **Post**: recorte mínimo si se graba home en lugar de `/explainer`; export H.264/MP4; subtítulos opcionales (.srt) alineados al mismo guion.

## Referencia de código

- Componente: `frontend/components/ArgosExplainerAnimation.tsx`
- Escenas: `frontend/src/data/explainerScenes.ts` (estados alineados con `frontend/sprites/spriteManifest.ts`, mismos PNG que el dock de mascotas)
- Parámetros de grabación: `frontend/src/lib/explainerRecordParams.ts`
- Página dedicada: `frontend/app/explainer/page.tsx`
- Chrome del sitio: `frontend/components/layout/SiteShell.tsx` (oculta header/footer/cookies/asistentes en `/explainer`)
