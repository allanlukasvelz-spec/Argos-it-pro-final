# INSTRUCCIONES HOSTINGER / WORDPRESS

## Objetivo de Publicación
Publicar ARGOS-IT como consultoría tecnológica premium para empresas, autónomos y profesionales.

Mensaje central:
> Tecnología que protege, acompaña y simplifica.

## Archivos Base
Usa los archivos de `wordpress-export/`:
- `index.html`
- `contacto.html`
- `aviso-legal.html`
- `privacidad.html`
- `cookies.html`
- `style.css`
- `script.js`
- `logo-argos-it.png`
- `chico-dumbo-historia.png`
- `asistente-chico.html`
- `asistente-dumbo.html`
- `portal.html`
- Carpeta `servicios/`
- Carpeta `metodo/`
- Carpeta `planes/`
- Carpeta `portal/`
- Carpeta `assets/` para sprites de asistentes si se conserva el sistema flotante.

## Páginas Recomendadas en WordPress
Crea una página por cada archivo principal:
- Inicio.
- Contacto.
- Aviso legal.
- Privacidad.
- Cookies.
- Asistente Chico.
- Asistente Dumbo.

Crea páginas de servicio:
- Consultoría IT premium.
- Mantenimiento informático para empresas.
- Seguridad informática y protección digital.
- Web, WordPress y presencia digital.
- Automatización con IA.
- Auditoría digital continua.

Crea páginas de apoyo si quieres mantener toda la arquitectura futura visible:
- Método ARGOS: Analizar, Reforzar, Gestionar, Optimizar y Sostener.
- Planes: Essential, Professional y Elite.
- Portal Fase 2: cuenta de cliente, servicios activos, solicitudes/incidencias, mensajes, auditorías/recomendaciones y formularios inteligentes.

## Integración con Elementor o Bloque HTML
1. Crea la página en WordPress.
2. Añade un bloque HTML o widget HTML de Elementor.
3. Pega el contenido del archivo correspondiente.
4. Añade `style.css` como CSS global:
   - Apariencia -> Personalizar -> CSS adicional.
   - o CSS global de Elementor.
5. Carga `script.js` antes de `</body>` o mediante un plugin de snippets/footer.

Para producción WordPress, define `window.ARGOS_EXPORT` **antes** de `script.js` y `js/argos-assistants.js` (origen del sitio, `assetsRoot` y rutas de asistentes/servicios/método). Plantilla: `wordpress-export/argos-export-config.sample.js`. Checklist y tabla slug→URL: `wordpress-export/WP_DEPLOY.md`.

Si usas solo el contenido interior de cada HTML, evita duplicar `<html>`, `<head>` y `<body>`.

## Imágenes y Rutas
Para pruebas locales se mantienen rutas relativas:
- `./logo-argos-it.png`
- `../logo-argos-it.png`
- `./chico-dumbo-historia.png`
- `./assets/mascots/...`

En WordPress debes subir las imágenes a Medios y reemplazarlas por URLs reales:
- `./logo-argos-it.png` -> URL real de Medios del logo.
- `../logo-argos-it.png` -> URL real de Medios del logo.
- `./chico-dumbo-historia.png` -> URL real de Medios de la imagen narrativa.
- Rutas de `assets/mascots/` -> URLs reales si se conserva el asistente flotante.

No uses `chico-dumbo-historia.png` como logo. Solo debe aparecer en la sección "El origen de ARGOS-IT".

## Navegación
- Las tarjetas de servicios de la home apuntan a páginas independientes dentro de `servicios/`.
- En WordPress, reemplaza `./servicios/consultoria-it.html` por la URL real de la página publicada si cambias slugs.
- Las tarjetas del método ARGOS apuntan a páginas independientes dentro de `metodo/`.
- En WordPress, reemplaza `./metodo/analizar.html`, `./metodo/reforzar.html`, `./metodo/gestionar.html`, `./metodo/optimizar.html` y `./metodo/sostener.html` por las URLs reales de las páginas publicadas si cambias slugs.
- Los CTA internos hacia formularios usan `#formulario`.
- Mantén las páginas legales enlazadas en footer.

## Formularios
Todos los formularios usan Formspree:
`https://formspree.io/f/xpqooedl`

No eliminar Formspree salvo que se implemente y pruebe otra solución.

Comprobar antes de publicar:
- Email destino correcto en Formspree.
- Envío desde home.
- Envío desde `contacto.html`.
- Envío desde una página de servicio.
- Consentimiento de privacidad visible.
- Envío desde una página del método ARGOS.

## Método ARGOS
Páginas obligatorias si se publica toda la arquitectura:
- `metodo/analizar.html`
- `metodo/reforzar.html`
- `metodo/gestionar.html`
- `metodo/optimizar.html`
- `metodo/sostener.html`

Cada página debe conservar:
- Explicación de la fase.
- Qué hace ARGOS-IT.
- Qué obtiene el cliente.
- Qué problemas se evitan.
- Herramientas usadas.
- CTA "Solicitar diagnóstico ARGOS".
- Formulario Formspree con `origen=metodo-argos` y `fase_argos`.

Mensaje clave:
> No esperamos a que algo falle. Analizamos, reforzamos y acompañamos para prevenir problemas antes de que afecten a tu negocio.

## Reseñas
La sección "Clientes que confían en ARGOS-IT" contiene textos placeholder.

Nota interna:
> Estas reseñas son textos placeholder y deben sustituirse por testimonios reales cuando estén disponibles.

No publicar nombres reales de clientes o empresas sin autorización.

## Servicios Oficiales
Mantener estas seis categorías:
1. Consultoría IT premium.
2. Mantenimiento informático para empresas.
3. Seguridad informática y protección digital.
4. Web, WordPress y presencia digital.
5. Automatización con IA.
6. Auditoría digital continua.

## Planes
Planes comerciales:
- Essential.
- Professional.
- Elite.

No añadir precios si no están definidos. La propuesta debe cerrarse tras diagnóstico.

## Portal de Clientes
`portal.html` es la página principal informativa y de activación del área privada.

El login real queda para fase avanzada. No prometer acceso funcional inmediato si todavía no está implementado.

El formulario de `portal.html` sirve para solicitar activación del portal y se mantiene conectado a Formspree.

Elementos documentados:
- Cuenta de cliente.
- Perfil de empresa.
- Servicios activos.
- Solicitudes.
- Incidencias.
- Mejoras propuestas.
- Mensajes.
- Auditorías.
- Historial.
- Recomendaciones.
- Formularios inteligentes.

No inventar APIs ni prometer acceso privado hasta implementarlo.

## Regla de posicionamiento
No usar ese término comercial salvo petición expresa del propietario.

## Marca
- Logo oficial: `logo-argos-it.png`.
- Imagen narrativa: `chico-dumbo-historia.png`.
- Chico = protección, diagnóstico, seguridad, orientación y firmeza.
- Dumbo = acompañamiento, seguimiento, recordatorios, cercanía y soporte.
- Chico y Dumbo son asistentes de marca, no el logo principal.

## SEO
Conservar o replicar estos enfoques en Rank Math, Yoast o el plugin SEO elegido:
- Consultoría informática premium.
- Servicios informáticos para empresas.
- Mantenimiento informático.
- Soporte IT.
- Seguridad informática.
- Diseño web WordPress.
- Automatización con IA.
- Atención telemática, telefónica o presencial según proyecto, sin limitar la cobertura a una ciudad concreta.

## Legal
Antes de publicar, completar en páginas legales:
- Razón social o nombre del titular.
- NIF/CIF.
- Domicilio fiscal.
- Email legal definitivo.
- Teléfono si aplica.

## Checklist de Publicación
1. Revisar desktop y móvil.
2. Confirmar logo oficial en header/footer.
3. Confirmar que `chico-dumbo-historia.png` solo aparece en "El origen de ARGOS-IT".
4. Confirmar que cada servicio abre su página independiente.
5. Probar formularios Formspree.
6. Reemplazar rutas relativas por URLs reales de WordPress.
7. Revisar política de cookies si se añaden analítica, mapas, píxeles, vídeos o chat.
8. Publicar.
