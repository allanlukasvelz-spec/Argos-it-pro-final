# Despliegue WordPress (Hostinger) — ARGOS-IT

Guía operativa alineada con [INSTRUCCIONES_HOSTINGER_WORDPRESS.md](../INSTRUCCIONES_HOSTINGER_WORDPRESS.md). El código estático vive en esta carpeta `wordpress-export/`.

## Hitos G0–G4 (orden)

1. **G0:** Backup, SSL, subir Medios (logo, historia, `assets/mascots` completo), definir slugs y rellenar la tabla de URLs más abajo.
2. **G1:** Pegar **una vez** [style.css](style.css) + [assets/css/argos-backgrounds.css](assets/css/argos-backgrounds.css) en CSS global del tema o Elementor.
3. **G1b:** En el footer, **antes** de `script.js` y `argos-assistants.js`, definir `window.ARGOS_EXPORT` (ver [argos-export-config.sample.js](argos-export-config.sample.js)). Luego cargar `script.js` y [js/argos-assistants.js](js/argos-assistants.js) (misma versión que en el repo; si los subes a Medios, usa sus URLs absolutas).
4. **G2:** Publicar solo **Inicio** y **Contacto**; menú y footer con URLs reales (nada de `*.html`).
5. **G3:** Resto de páginas; un dueño actualiza el menú por lotes.
6. **G4:** Legales reales, Formspree en dominio final (`https://formspree.io/f/xpqooedl`), JSON-LD home.

## Tabla slug → URL (rellenar en producción)

Sustituye `REEMPLAZAR` por la URL canónica publicada (con barra final si WordPress la usa).

| Origen (export) | Slug sugerido | URL publicada |
|-----------------|---------------|---------------|
| index.html | inicio o home | REEMPLAZAR |
| contacto.html | contacto | REEMPLAZAR |
| aviso-legal.html | aviso-legal | REEMPLAZAR |
| privacidad.html | privacidad | REEMPLAZAR |
| cookies.html | cookies | REEMPLAZAR |
| asistente-chico.html | asistente-chico | REEMPLAZAR |
| asistente-dumbo.html | asistente-dumbo | REEMPLAZAR |
| servicios/consultoria-it.html | consultoria-it | REEMPLAZAR |
| servicios/mantenimiento-informatico.html | mantenimiento-informatico | REEMPLAZAR |
| servicios/seguridad-informatica.html | seguridad-informatica | REEMPLAZAR |
| servicios/web-wordpress.html | web-wordpress | REEMPLAZAR |
| servicios/automatizacion-ia.html | automatizacion-ia | REEMPLAZAR |
| servicios/auditoria-digital.html | auditoria-digital | REEMPLAZAR |
| metodo/index.html | metodo (índice) | REEMPLAZAR |
| metodo/analizar.html | analizar | REEMPLAZAR |
| metodo/reforzar.html | reforzar | REEMPLAZAR |
| metodo/gestionar.html | gestionar | REEMPLAZAR |
| metodo/optimizar.html | optimizar | REEMPLAZAR |
| metodo/sostener.html | sostener | REEMPLAZAR |
| planes/essential.html | essential | REEMPLAZAR |
| planes/professional.html | professional | REEMPLAZAR |
| planes/elite.html | elite | REEMPLAZAR |
| portal.html | portal | REEMPLAZAR |
| portal/preparar-portal.html | preparar-portal | REEMPLAZAR |
| portal/cuenta-cliente.html | cuenta-cliente | REEMPLAZAR |
| portal/servicios-activos.html | servicios-activos | REEMPLAZAR |
| portal/solicitudes-incidencias.html | solicitudes-incidencias | REEMPLAZAR |
| portal/mensajes.html | mensajes | REEMPLAZAR |
| portal/auditorias-recomendaciones.html | auditorias-recomendaciones | REEMPLAZAR |
| portal/formularios-inteligentes.html | formularios-inteligentes | REEMPLAZAR |

Tras rellenar la tabla, en cada página HTML pegada en WordPress sustituye enlaces relativos (`./servicios/…`, `../index.html`, etc.) por estas URLs.

## JS: `window.ARGOS_EXPORT`

Sin este objeto, los asistentes y sprites siguen usando rutas tipo `*.html` y `./assets/`, válidas solo en el export local.

Con `origin` + `paths` + `assetsRoot`, [script.js](script.js) y [js/argos-assistants.js](js/argos-assistants.js) resuelven URLs estilo WordPress (por ejemplo `/servicios/consultoria-it/`).

## Inventario de enlaces (referencia)

Archivo generado: [internal-links.inventory.txt](internal-links.inventory.txt) (lista de `href` locales únicos tras generar con `node tools/extract-hrefs.mjs`).
