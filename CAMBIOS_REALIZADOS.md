# CAMBIOS REALIZADOS

## Reposicionamiento premium
- Se ha transformado el mensaje público de ARGOS-IT hacia consultoría tecnológica premium.
- Nuevo eje de comunicación: “Tecnología que protege, acompaña y simplifica.”
- ARGOS-IT queda presentada como socio tecnológico externo para negocios que necesitan soporte IT, seguridad, mantenimiento web, automatización con IA y mejora continua.

## Servicios
Servicios reorganizados en:
- Consultoría IT premium.
- Mantenimiento informático para empresas.
- Seguridad informática y protección digital.
- Web, WordPress y presencia digital.
- Automatización con IA.
- Auditoría digital continua.

Las tarjetas de servicios de la home ahora son enlaces reales y abren páginas independientes:
- `wordpress-export/servicios/consultoria-it.html`
- `wordpress-export/servicios/mantenimiento-informatico.html`
- `wordpress-export/servicios/seguridad-informatica.html`
- `wordpress-export/servicios/web-wordpress.html`
- `wordpress-export/servicios/automatizacion-ia.html`
- `wordpress-export/servicios/auditoria-digital.html`

Cada página incluye explicación del servicio, qué incluye, beneficios, casos de uso, proceso de trabajo, CTA “Solicitar este servicio” y formulario específico conectado a Formspree con campos ocultos `origen=servicio-argos-it` y `servicio`.

## Método ARGOS
Se ha creado e integrado la metodología:
- A — Analizar.
- R — Reforzar.
- G — Gestionar.
- O — Optimizar.
- S — Sostener.

## Planes
Se ha añadido estructura comercial sin precios:
- Essential.
- Professional.
- Elite.

Cada plan se enfoca por nivel de acompañamiento, soporte, seguridad y evolución digital.

## Portal de clientes
Se ha integrado la visión de Fase 2 en la home y en `ROADMAP_PLATAFORMA.md`:
- Cuenta de cliente.
- Perfil de empresa.
- Servicios activos.
- Solicitudes e incidencias.
- Mejoras propuestas.
- Mensajes.
- Auditorías.
- Historial.
- Recomendaciones.
- Formularios inteligentes.

## Formularios inteligentes
El formulario público mantiene Formspree y queda orientado por necesidad:
- Quiero una web profesional.
- Necesito soporte técnico.
- Quiero mejorar mi web.
- Seguridad informática.
- Automatización con IA.
- Hosting / WordPress.

Se han añadido formularios específicos para cada servicio oficial con campos contextuales según la necesidad seleccionada.

## Idiomas
- Se ha añadido un selector global de idioma en todas las páginas del export.
- Idiomas prioritarios visibles: español (`ES`), inglés (`EN`) y catalán (`CA`).
- Se ha añadido modo `Auto` para detectar el idioma del dispositivo.
- Para idiomas distintos de español, el export activa traducción automática mediante el widget público de Google Translate, sin claves API ni backend propio.
- Español se mantiene como idioma fuente del contenido.

## Asistentes ARGOS
- Se ha añadido el módulo visible “Asistentes ARGOS” en la home.
- Chico queda implementado como asistente de diagnóstico, protección, seguridad, mantenimiento, auditoría y priorización.
- Dumbo queda implementado como asistente de ayuda rápida, seguimiento, formularios, soporte inicial y preparación de mensajes.
- Se han creado `wordpress-export/asistente-chico.html` y `wordpress-export/asistente-dumbo.html`.
- Los formularios de asistentes envían a Formspree e incluyen `origen=asistente-argos` y `asistente=chico` o `asistente=dumbo`.
- Chico y Dumbo guían y preparan solicitudes, pero no ejecutan acciones críticas ni prometen resultados garantizados.

## Marca
- `logo-argos-it.png` se mantiene como logo principal oficial.
- `chico-dumbo-historia.png` se usa solo en “El origen de ARGOS-IT”.
- Chico = protección, diagnóstico, seguridad, orientación y firmeza.
- Dumbo = acompañamiento, seguimiento, recordatorios, cercanía y soporte.
- Chico y Dumbo no se usan como logo principal.

## Archivos actualizados
- `wordpress-export/index.html`
- `wordpress-export/style.css`
- `wordpress-export/script.js`
- `wordpress-export/contacto.html`
- `wordpress-export/asistente-chico.html`
- `wordpress-export/asistente-dumbo.html`
- `wordpress-export/servicios/consultoria-it.html`
- `wordpress-export/servicios/mantenimiento-informatico.html`
- `wordpress-export/servicios/seguridad-informatica.html`
- `wordpress-export/servicios/web-wordpress.html`
- `wordpress-export/servicios/automatizacion-ia.html`
- `wordpress-export/servicios/auditoria-digital.html`
- `CHECKLIST_FINAL.md`
- `CAMBIOS_REALIZADOS.md`
- `INSTRUCCIONES_HOSTINGER_WORDPRESS.md`
- `INSTRUCCIONES_CURSOR_CODEX.md`
- `ROADMAP_PLATAFORMA.md`

## Seguridad y dependencias
- Frontend actualizado a `next@16.2.5`.
- Frontend configurado con `turbopack.root` y sin `swcMinify` obsoleto.
- Frontend fuerza `postcss` seguro mediante `overrides`.
- Backend actualizado a `bcrypt@6.0.0`, eliminando la cadena vulnerable `node-pre-gyp/tar`.
- `.env` y `backend/.env` saneados con placeholders, sin claves reales.
- Docker y migración actualizados para no dejar credenciales débiles por defecto.
- `npm audit` queda sin vulnerabilidades en frontend y backend.
