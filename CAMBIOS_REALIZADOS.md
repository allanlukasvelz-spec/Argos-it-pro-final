# CAMBIOS REALIZADOS

## Reposicionamiento Premium
- ARGOS-IT queda posicionada como consultoría tecnológica premium y socio tecnológico externo.
- Mensaje principal integrado: "Tecnología que protege, acompaña y simplifica."
- Propuesta reforzada para empresas, autónomos y profesionales que necesitan soporte IT, seguridad, mantenimiento web, automatización con IA y mejora continua.
- Se evita presentar la marca como simple reparación informática.

## Home WordPress
- `wordpress-export/index.html` incorpora hero premium con propuesta de valor clara.
- Se han actualizado las señales de cobertura: servicio disponible para cualquier lugar mediante atención telemática, telefónica o presencial según proyecto.
- SEO actualizado para consultoría informática, servicios informáticos, mantenimiento informático, soporte IT, seguridad informática, diseño web WordPress y automatización con IA.
- Structured data ajustado como `ProfessionalService` con área servida y servicios oficiales.
- CTA principales mantenidos: solicitar consulta, ver servicios, abrir portal de clientes y formularios.
- Se reforzó el mensaje: "En ARGOS-IT no solo resolvemos problemas: los prevenimos."
- Se añadió la sección "Herramientas y tecnología con las que trabajamos" con WordPress, Hostinger, React/Next.js, Node.js, PostgreSQL, OpenAI API, seguridad JWT, copias, SEO, monitorización, servidor propio y mantenimiento preventivo.
- Se añadió "Infraestructura propia, privacidad y control" con lenguaje profesional de reducción de riesgos y mejores prácticas, sin prometer seguridad absoluta.
- Se añadió "Acompañamiento continuo" para explicar seguimiento, revisión periódica, comunicación clara, soporte preventivo y relación a largo plazo.
- Se añadió "Clientes que confían en ARGOS-IT" con reseñas placeholder editables.

## Servicios Oficiales
Servicios reorganizados en:
- Consultoría IT premium.
- Mantenimiento informático para empresas.
- Seguridad informática y protección digital.
- Web, WordPress y presencia digital.
- Automatización con IA.
- Auditoría digital continua.

Las tarjetas de servicios de la home enlazan a páginas independientes:
- `wordpress-export/servicios/consultoria-it.html`
- `wordpress-export/servicios/mantenimiento-informatico.html`
- `wordpress-export/servicios/seguridad-informatica.html`
- `wordpress-export/servicios/web-wordpress.html`
- `wordpress-export/servicios/automatizacion-ia.html`
- `wordpress-export/servicios/auditoria-digital.html`

Cada página incluye explicación del servicio, qué incluye, beneficios, casos de uso, proceso ARGOS, CTA "Solicitar este servicio" y formulario específico conectado a Formspree.

## Método ARGOS
Se mantiene e integra la metodología:
- A - Analizar.
- R - Reforzar.
- G - Gestionar.
- O - Optimizar.
- S - Sostener.

El método aparece en la home, páginas de servicio y documentación. Las tarjetas de la home son enlaces reales a páginas independientes:
- `wordpress-export/metodo/analizar.html`
- `wordpress-export/metodo/reforzar.html`
- `wordpress-export/metodo/gestionar.html`
- `wordpress-export/metodo/optimizar.html`
- `wordpress-export/metodo/sostener.html`

Cada página explica qué significa la fase, qué hace ARGOS-IT, qué obtiene el cliente, qué problemas se evitan, qué herramientas se usan y contiene formulario Formspree con `origen=metodo-argos` y `fase_argos`.

## Planes
Se mantiene estructura comercial sin precios:
- Essential.
- Professional.
- Elite.

Cada plan se enfoca por nivel de acompañamiento, soporte, seguridad y evolución digital. La propuesta se cierra tras diagnóstico.

## Portal de Clientes
El portal queda documentado e integrado como visión de Fase 2:
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

No se han inventado APIs ni funcionalidades privadas no implementadas. Las páginas de `wordpress-export/portal/` actúan como preparación de alcance.

Además:
- Se creó `wordpress-export/portal.html` como página principal "Portal de clientes ARGOS-IT".
- El botón "Portal" de la home ahora abre `./portal.html`.
- La nueva página explica el área privada profesional y mantiene el formulario de activación al final.
- El acceso privado se comunica como "en preparación", sin login ficticio.

## Formularios Inteligentes
- Home y `contacto.html` ahora recogen necesidad principal y servicio ARGOS relacionado.
- Necesidades contempladas: web profesional, soporte técnico, mejora web, seguridad informática, automatización con IA y hosting/WordPress.
- Los formularios conservan Formspree `https://formspree.io/f/xpqooedl`.
- Se han añadido campos de origen para clasificar solicitudes.
- Los formularios específicos por servicio mantienen campos contextuales por necesidad.
- Los formularios de método usan CTA "Solicitar diagnóstico ARGOS" y quedan clasificados por fase.

## Reseñas y prueba social
- Se añadieron cuatro reseñas profesionales genéricas como placeholders editables.
- Nota interna: estas reseñas son textos placeholder y deben sustituirse por testimonios reales cuando estén disponibles.
- No se han inventado nombres reales de empresas ni clientes.

## Chico y Dumbo
- Chico se mantiene como protección, diagnóstico, seguridad, orientación y firmeza.
- Dumbo se mantiene como acompañamiento, seguimiento, recordatorios, cercanía y soporte.
- Chico y Dumbo no son el logo principal.
- `chico-dumbo-historia.png` se usa solo en "El origen de ARGOS-IT".
- `script.js` activa los asistentes flotantes y corrige rutas de sprites de movimiento.

## Diseño y UX
- `style.css` conserva el diseño premium profesional y añade señales visuales suaves para hero, marca y formularios.
- Se reforzaron estados focus, hover, responsive y animaciones suaves.
- Se corrigieron enlaces internos hacia formularios para que no abran pestañas nuevas innecesarias.

## Frontend Next
- Se alinearon metadatos globales y home con el nuevo posicionamiento premium.
- El catálogo de slugs del frontend pasa a los seis servicios oficiales.
- La traducción española principal queda actualizada con método ARGOS y servicios premium.
- Se eliminó un teléfono ficticio de la vista de contacto y se sustituyó por canal a confirmar tras solicitud.
- Se añadió el sistema visual premium de fondos dinámicos en `frontend/assets/css/argos-backgrounds.css` y wrapper `ArgosPageShell`.
- La cabecera pública queda con logo oficial, enlace a inicio y menú de tres barras desplegable.
- La cobertura ya no se limita a ciudades concretas: se comunica como telemática, telefónica o presencial.
- El portal privado existente queda conectado con login, registro, dashboard, mejoras, mensajería y estructura de roles.

## Backend y Portal
- Autenticación JWT con refresh token, rate limits y CORS configurado por entorno.
- `/api/client/portal` devuelve perfil, servicios disponibles, auditoría web, mejoras recomendadas, mensajes y actividad.
- `/api/client/improvements` registra solicitudes de mejora y puede notificar a Formspree.
- `/api/client/messages` registra mensajería directa cliente/ARGOS-IT y puede notificar a Formspree.
- `database/schema.sql` documenta roles, perfil de empresa, servicios contratados, auditorías, mejoras y mensajes.

## Archivos Actualizados
- `wordpress-export/index.html`
- `wordpress-export/contacto.html`
- `wordpress-export/portal.html`
- `wordpress-export/metodo/analizar.html`
- `wordpress-export/metodo/reforzar.html`
- `wordpress-export/metodo/gestionar.html`
- `wordpress-export/metodo/optimizar.html`
- `wordpress-export/metodo/sostener.html`
- `wordpress-export/aviso-legal.html`
- `wordpress-export/privacidad.html`
- `wordpress-export/cookies.html`
- `wordpress-export/style.css`
- `wordpress-export/script.js`
- `CHECKLIST_FINAL.md`
- `CAMBIOS_REALIZADOS.md`
- `INSTRUCCIONES_HOSTINGER_WORDPRESS.md`
- `INSTRUCCIONES_CURSOR_CODEX.md`
- `ROADMAP_PLATAFORMA.md`
- `frontend/app/layout.tsx`
- `frontend/app/page.tsx`
- `frontend/app/servicios/page.tsx`
- `frontend/components/pages/ContactView.tsx`
- `frontend/i18n/locales/es.json`
- `frontend/lib/services.ts`

## Pendiente Antes de Publicar
- Completar los datos legales reales del titular.
- Sustituir rutas relativas por URLs reales de Medios en WordPress cuando se publique mediante Elementor o bloques HTML.
- Probar envío real en Formspree desde dominio final.
