# CHECKLIST FINAL ARGOS-IT

## Posicionamiento
- [x] ARGOS-IT queda posicionada como consultoría tecnológica premium, no como reparación informática puntual.
- [x] Mensaje principal integrado: “Tecnología que protege, acompaña y simplifica.”
- [x] Propuesta de valor integrada para empresas, autónomos y profesionales.
- [x] SEO reforzado para consultoría informática, servicios informáticos, mantenimiento informático, soporte IT, seguridad informática, WordPress, automatización con IA y alcance internacional.

## Web pública WordPress
- [x] `wordpress-export/index.html` actualizado con hero premium.
- [x] Idiomas prioritarios integrados: español, inglés y catalán con selector global en todas las páginas.
- [x] Modo `Auto` añadido para detectar el idioma del dispositivo y activar traducción automática para otros idiomas.
- [x] Servicios reorganizados en seis categorías premium.
- [x] Tarjetas de servicios convertidas en enlaces reales a páginas independientes, con apertura en nueva pestaña.
- [x] Carpeta `wordpress-export/servicios/` creada con una página HTML por servicio oficial.
- [x] Cada página de servicio incluye explicación, qué incluye, beneficios, casos de uso, proceso, CTA y formulario específico.
- [x] Cada formulario de servicio envía a Formspree e incluye `origen=servicio-argos-it` y `servicio` con el nombre exacto.
- [x] Método ARGOS integrado: Analizar, Reforzar, Gestionar, Optimizar, Sostener.
- [x] Planes comerciales creados: Essential, Professional y Elite, sin precios inventados.
- [x] Visión del portal de clientes documentada como Fase 2 en la home.
- [x] Formulario inteligente mantenido con Formspree `https://formspree.io/f/xpqooedl`.
- [x] Página `contacto.html` actualizada con necesidades guiadas.
- [x] Páginas legales mantenidas: `aviso-legal.html`, `privacidad.html`, `cookies.html`.
- [x] Módulo visible “Asistentes ARGOS” añadido en la home.
- [x] `asistente-chico.html` y `asistente-dumbo.html` creadas con formularios propios.
- [x] Los formularios de asistentes incluyen `origen=asistente-argos` y `asistente=chico` o `asistente=dumbo`.

## Marca
- [x] `logo-argos-it.png` es el logo principal oficial.
- [x] El logo oficial aparece en header/footer y páginas legales con alt SEO.
- [x] `chico-dumbo-historia.png` se usa solo en “El origen de ARGOS-IT”.
- [x] Chico y Dumbo quedan definidos como asistentes de marca, no como logo.
- [x] CSS mantiene proporción de imágenes con `height:auto` y `object-fit:contain`.

## WordPress / Hostinger
- [x] Rutas relativas mantenidas para pruebas locales.
- [x] Documentado que en WordPress deben sustituirse por URLs reales de Medios.
- [x] Documentado el funcionamiento multidioma y la dependencia de traducción automática sin claves.
- [x] Archivos listos para copiar/pegar en Elementor o subir como HTML estático.

## Verificación técnica
- [x] `wordpress-export/` contiene `index.html`, `style.css`, `script.js`, `contacto.html`, `aviso-legal.html`, `privacidad.html`, `cookies.html`, `logo-argos-it.png` y `chico-dumbo-historia.png`.
- [x] `wordpress-export/servicios/` contiene las seis páginas de servicio obligatorias.
- [x] `wordpress-export/asistente-chico.html` y `wordpress-export/asistente-dumbo.html` existen y enlazan a formularios Formspree.
- [x] `npm install` ejecutado en frontend y backend.
- [x] `npm run build` ejecutado en frontend correctamente.
- [x] `node --check server.js` y `node --check routes/contact.js` ejecutados correctamente en backend.
- [x] `npm audit` sin vulnerabilidades en frontend y backend tras actualizar dependencias.
- [x] No hay rutas locales rotas en los 13 HTML de `wordpress-export/`.
- [x] No se han añadido APIs ni precios ficticios.
- [x] No se ha eliminado el formulario ni las páginas legales.
- [x] No hay claves API expuestas en el export WordPress.
