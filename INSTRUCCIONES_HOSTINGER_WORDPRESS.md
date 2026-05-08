# INSTRUCCIONES HOSTINGER / WORDPRESS

## Archivos a subir o copiar
Usa los archivos de `wordpress-export/`:
- `index.html`
- `contacto.html`
- `asistente-chico.html`
- `asistente-dumbo.html`
- `aviso-legal.html`
- `privacidad.html`
- `cookies.html`
- `style.css`
- `script.js`
- `logo-argos-it.png`
- `chico-dumbo-historia.png`
- Carpeta completa `servicios/`:
  - `consultoria-it.html`
  - `mantenimiento-informatico.html`
  - `seguridad-informatica.html`
  - `web-wordpress.html`
  - `automatizacion-ia.html`
  - `auditoria-digital.html`

## Integración en WordPress + Elementor
1. Crea páginas en WordPress:
   - Inicio
   - Contacto
   - Asistente Chico
   - Asistente Dumbo
   - Aviso legal
   - Privacidad
   - Cookies
   - Consultoría IT premium
   - Mantenimiento informático para empresas
   - Seguridad informática y protección digital
   - Web, WordPress y presencia digital
   - Automatización con IA
   - Auditoría digital continua
2. En cada página, añade un bloque HTML y pega el contenido del archivo correspondiente.
3. Copia `style.css` en:
   - Apariencia -> Personalizar -> CSS adicional
   - o CSS global de Elementor.
4. Si usas el HTML completo, asegúrate de incluir `script.js` antes de `</body>` o en el footer global.

## Navegación de servicios
- Las tarjetas de servicios de la home apuntan a páginas independientes dentro de `servicios/`.
- En WordPress, reemplaza las rutas relativas por las URLs reales de tus páginas publicadas si cambias los slugs.
- Mantén los enlaces con apertura en nueva pestaña si quieres conservar la home abierta.

## Idiomas
- El export incluye un selector global inyectado por `script.js`.
- Idiomas prioritarios:
  - `ES` español.
  - `EN` inglés.
  - `CA` catalán.
- El botón `Auto` detecta el idioma del dispositivo.
- Para idiomas distintos de español, el sistema usa traducción automática mediante el widget público de Google Translate.
- No necesita claves API ni configuración de backend.
- En WordPress, si prefieres una solución SEO multidioma más avanzada, puedes sustituir esta capa por Polylang, WPML o TranslatePress y conservar el diseño.

## Asistentes Chico y Dumbo
- La home incluye el módulo “Asistentes ARGOS”.
- Chico enlaza a `asistente-chico.html?asistente=chico` y orienta diagnóstico, seguridad, mantenimiento y auditoría.
- Dumbo enlaza a `asistente-dumbo.html?asistente=dumbo` y orienta ayuda rápida, seguimiento, contacto y formularios.
- Si en el futuro se crean avatares individuales, las rutas previstas son:
  - `chico-asistente.png`
  - `dumbo-asistente.png`
- No uses `chico-dumbo-historia.png` como avatar individual ni como logo.

## Imágenes de marca
Sube a Medios de WordPress:
- `logo-argos-it.png` como logo principal oficial.
- `chico-dumbo-historia.png` como imagen narrativa de “El origen de ARGOS-IT”.

Después de subirlas, reemplaza las rutas locales por URLs reales de Medios:
- `./logo-argos-it.png` -> `https://tudominio.com/wp-content/uploads/2026/05/logo-argos-it.png`
- `../logo-argos-it.png` -> `https://tudominio.com/wp-content/uploads/2026/05/logo-argos-it.png`
- `./chico-dumbo-historia.png` -> `https://tudominio.com/wp-content/uploads/2026/05/chico-dumbo-historia.png`

## Reglas de marca
- `logo-argos-it.png` es el logo principal oficial y debe usarse en header/footer y páginas legales.
- `chico-dumbo-historia.png` solo debe usarse en la sección narrativa “El origen de ARGOS-IT”.
- Chico y Dumbo son asistentes de marca, no el logo principal.

## Formulario
- El formulario apunta a Formspree:
  - `https://formspree.io/f/xpqooedl`
- Los formularios de servicio incluyen:
  - `origen=servicio-argos-it`
  - `servicio` con el nombre exacto del servicio.
- Los formularios de asistentes incluyen:
  - `origen=asistente-argos`
  - `asistente=chico` o `asistente=dumbo`.
- Verifica en Formspree que el email destino es correcto.
- Haz una prueba real antes de publicar.

## SEO recomendado
- Mantén el title y meta description del `index.html` si no usas plugin SEO.
- Si usas Rank Math, Yoast u otro plugin, replica estos textos:
  - Consultoría informática premium.
  - Servicios informáticos para empresas.
  - Mantenimiento informático.
  - Soporte IT.
  - Seguridad informática.
  - Diseño web WordPress.
  - Automatización con IA.
  - Barcelona y Sabadell.

## Publicación
1. Revisar móvil en 360px y 768px.
2. Confirmar que el logo aparece en header/footer.
3. Confirmar que `chico-dumbo-historia.png` aparece solo en “El origen de ARGOS-IT”.
4. Confirmar que cada tarjeta de servicio abre su página independiente.
5. Probar selector `ES`, `EN`, `CA` y `Auto` en navegador.
6. Probar el formulario de contacto, un formulario de servicio y los dos formularios de asistentes.
7. Confirmar que no se suben archivos `.env` con claves reales.
8. Publicar.
