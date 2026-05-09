# CHECKLIST FINAL ARGOS-IT

## Posicionamiento
- [x] ARGOS-IT se presenta como consultoría tecnológica premium, no como empresa de reparación informática puntual.
- [x] Mensaje central integrado: "Tecnología que protege, acompaña y simplifica."
- [x] Propuesta de valor integrada para empresas, autónomos y profesionales.
- [x] Enfoque de socio tecnológico externo: soporte IT, seguridad, mantenimiento web, automatización con IA y mejora continua.
- [x] SEO reforzado para consultoría informática, servicios informáticos, mantenimiento informático, soporte IT, seguridad informática, diseño web WordPress y automatización con IA.

## Web pública WordPress
- [x] `wordpress-export/index.html` incluye hero premium, mensaje de valor, CTA claros y cobertura flexible: telemática, telefónica o presencial.
- [x] Servicios reorganizados en las seis categorías oficiales.
- [x] Las tarjetas de servicios de la home son enlaces reales a páginas independientes de detalle.
- [x] `wordpress-export/servicios/` contiene una página HTML por cada servicio oficial.
- [x] Cada página de servicio incluye explicación, qué incluye, beneficios, casos de uso, proceso, CTA y formulario específico.
- [x] Cada formulario de servicio conserva Formspree e incluye `origen=servicio-argos-it` y `servicio` con el nombre exacto.
- [x] Método ARGOS integrado: Analizar, Reforzar, Gestionar, Optimizar y Sostener.
- [x] Las tarjetas del método ARGOS son enlaces reales a páginas independientes: `analizar.html`, `reforzar.html`, `gestionar.html`, `optimizar.html` y `sostener.html`.
- [x] Cada página de método explica significado, trabajo realizado, entregables, problemas evitados, herramientas usadas y CTA "Solicitar diagnóstico ARGOS".
- [x] Cada formulario de método conserva Formspree e incluye `origen=metodo-argos` y `fase_argos` con la fase correspondiente.
- [x] La home incluye "Herramientas y tecnología con las que trabajamos".
- [x] La home incluye "Infraestructura propia, privacidad y control" con lenguaje de reducción de riesgos, sin prometer seguridad absoluta.
- [x] La home incluye "Clientes que confían en ARGOS-IT" con reseñas placeholder marcadas como editables.
- [x] La home incluye "Acompañamiento continuo" y refuerza el mensaje preventivo.
- [x] Planes comerciales creados: Essential, Professional y Elite, sin precios inventados.
- [x] Portal de clientes integrado como visión premium de Fase 2.
- [x] `wordpress-export/portal.html` creado como página premium "Portal de clientes ARGOS-IT" para explicar el área privada y solicitar activación.
- [x] El botón Portal de la home enlaza a `./portal.html`.
- [x] La sección de activación del portal está al final de la página y conectada a Formspree.
- [x] El acceso privado se comunica como "en preparación", sin login falso ni promesas de disponibilidad inmediata.
- [x] Formulario de home y `contacto.html` preparados como formularios inteligentes por necesidad.
- [x] Páginas legales mantenidas: `aviso-legal.html`, `privacidad.html` y `cookies.html`.
- [x] Diseño responsive y animaciones suaves mantenidas en `style.css`.
- [x] `assets/css/argos-backgrounds.css` añade sistema visual premium con fondos tecnológicos, grid, glows, diagonales y safe-zones para mascotas.

## Formularios inteligentes
- [x] Necesidades contempladas: web profesional, soporte técnico, mejora web, seguridad informática, automatización con IA y hosting/WordPress.
- [x] El formulario no solicita datos sensibles innecesarios.
- [x] Se mantiene Formspree `https://formspree.io/f/xpqooedl`.
- [x] Los formularios de servicios, método, planes y portal quedan marcados con campos ocultos de origen.
- [x] Las reseñas son textos placeholder y deben sustituirse por testimonios reales cuando estén disponibles.

## Marca
- [x] `logo-argos-it.png` se mantiene como logo principal oficial.
- [x] El logo oficial aparece en header/footer y páginas legales.
- [x] `chico-dumbo-historia.png` se usa solo en "El origen de ARGOS-IT".
- [x] Chico = protección, diagnóstico, seguridad, orientación y firmeza.
- [x] Dumbo = acompañamiento, seguimiento, recordatorios, cercanía y soporte.
- [x] Chico y Dumbo no se usan como logo principal.

## Portal de Clientes
- [x] El frontend incluye registro, login y dashboard privado en `/auth/register`, `/auth/login` y `/dashboard`.
- [x] El backend incluye JWT, refresh token, rutas privadas, rate limit, CORS y endpoints de portal.
- [x] La estructura incluye cuenta de cliente, perfil de empresa, servicios activos, solicitudes, incidencias, mejoras propuestas, mensajes, auditorías, historial, recomendaciones y formularios inteligentes.
- [x] Las páginas de `wordpress-export/portal/` funcionan como preparación comercial/documental para WordPress.

## WordPress / Hostinger
- [x] Rutas relativas mantenidas para pruebas locales en `wordpress-export/`.
- [x] Documentado que en WordPress deben reemplazarse imágenes y rutas por URLs reales de Medios y páginas publicadas.
- [x] Archivos listos para copiar/pegar en WordPress/Hostinger.
- [x] No se han añadido APIs, precios ficticios ni claves.
- [x] La página `portal.html` es compatible con Elementor Pro (widget HTML + CSS adicional o Custom CSS).
- [x] Documentado que en WordPress se deben sustituir imágenes por URLs reales de Medios cuando aplique.
- [x] Queda prohibido usar ese término comercial salvo petición expresa del propietario.

## Verificación Técnica
- [x] `wordpress-export/index.html`, `contacto.html`, páginas legales, `style.css` y `script.js` presentes.
- [x] Las seis páginas de servicio existen.
- [x] Las páginas de planes, método y portal existen.
- [x] Existen `wordpress-export/metodo/analizar.html`, `reforzar.html`, `gestionar.html`, `optimizar.html` y `sostener.html`.
- [x] Los asistentes Chico y Dumbo enlazan a sus páginas/formularios propios.
- [x] El JS activa los asistentes flotantes y conserva el selector de idioma.
- [x] `npm install` ejecutado en frontend y backend sin vulnerabilidades.
- [x] `npm run build` ejecutado en frontend correctamente.
- [x] `/api/health` verificado correctamente en backend local.
- [x] `node --check server.js` y `node --check routes/contact.js` ejecutados correctamente en backend.
- [x] Verificadas rutas relativas internas de los 28 HTML del export WordPress.
- [x] Pendiente de publicar: completar datos legales reales del titular antes de producción.
