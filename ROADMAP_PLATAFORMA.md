# ROADMAP PLATAFORMA ARGOS-IT

## Visión
Convertir ARGOS-IT en una plataforma de consultoría tecnológica continua donde cada cliente pueda ver el estado de su infraestructura digital, solicitar soporte, revisar auditorías, priorizar mejoras y comunicarse con ARGOS-IT con contexto.

La plataforma debe reforzar el posicionamiento:
> Tecnología que protege, acompaña y simplifica.

## Fase 1 - Web Pública Premium
Estado: preparada en `wordpress-export/`.

Incluye:
- Home de consultoría tecnológica premium.
- Servicios oficiales reorganizados.
- Páginas independientes para cada servicio.
- Formularios específicos por servicio con Formspree.
- Método ARGOS: Analizar, Reforzar, Gestionar, Optimizar y Sostener, con páginas independientes por fase y formularios Formspree con `fase_argos`.
- Secciones públicas de herramientas tecnológicas, infraestructura propia, privacidad, control, prevención, acompañamiento continuo y reseñas placeholder.
- Planes Essential, Professional y Elite sin precios.
- Formulario inteligente por necesidad.
- Sección "El origen de ARGOS-IT".
- Asistentes Chico y Dumbo como experiencia pública.
- Cobertura flexible: atención telemática, telefónica o presencial según proyecto.
- Páginas legales.

Mensaje preventivo permanente:
> En ARGOS-IT no solo resolvemos problemas: los prevenimos.

Nota sobre prueba social:
> Las reseñas actuales son placeholders y deben sustituirse por testimonios reales cuando estén disponibles.

## Fase 2 - Portal de Clientes
Estado: base funcional en `frontend` + `backend`, con página principal de presentación/activación en `wordpress-export/portal.html` y páginas preparatorias en `wordpress-export/portal/`.

Módulos previstos:
- Cuenta de cliente: registro, login y sesión JWT.
- Perfil de empresa: datos básicos y estado de verificación.
- Servicios activos: estructura preparada para servicios disponibles/contratados.
- Solicitudes e incidencias: registro mediante `form_submissions`.
- Mejoras propuestas: envío desde dashboard y panel de recomendaciones.
- Mensajes: canal directo cliente/ARGOS-IT.
- Auditorías: estructura de score, checks y fecha de revisión.
- Historial: actividad y solicitudes recientes.
- Recomendaciones: sugerencias priorizadas.
- Formularios inteligentes: contacto público y formularios de servicio.

Objetivo de negocio:
- Reducir solicitudes sin contexto.
- Centralizar seguimiento.
- Priorizar mejoras por impacto y urgencia.
- Crear una relación de acompañamiento técnico recurrente.
- Anticiparse a incidencias mediante mantenimiento preventivo, auditorías periódicas y recomendaciones accionables.

## Fase 3 - Formularios Inteligentes
Estado: estructura comercial preparada en home, contacto y páginas de detalle.

Tipos de necesidad:
- Quiero una web profesional.
- Necesito soporte técnico.
- Quiero mejorar mi web.
- Seguridad informática.
- Automatización con IA.
- Hosting/WordPress.

Evolución futura:
- Campos dinámicos según necesidad.
- Priorización automática de solicitudes.
- Recomendación de servicio ARGOS.
- Preparación de contexto para soporte, web, seguridad o IA.

No implementar automatizaciones sin validación humana cuando afecten a acciones críticas.

## Fase 4 - Asistentes de Marca
Estado: experiencia pública preparada con páginas y formularios.

Chico:
- Protección.
- Diagnóstico.
- Seguridad.
- Orientación.
- Firmeza.

Dumbo:
- Acompañamiento.
- Seguimiento.
- Recordatorios.
- Cercanía.
- Soporte.

Uso futuro en portal:
- Chico orienta auditorías, riesgos, seguridad y priorización técnica.
- Dumbo acompaña solicitudes, recordatorios, mensajes y seguimiento.

Reglas:
- No son el logo principal.
- No prometen resultados garantizados.
- No ejecutan acciones críticas sin confirmación expresa.
- No recopilan datos sensibles innecesarios.

## Fase 5 - Auditoría Digital Continua
Módulos futuros:
- Estado web.
- Estado WordPress.
- Seguridad básica.
- Rendimiento.
- Formularios.
- SEO técnico.
- Recomendaciones priorizadas.
- Historial de mejoras.
- Registro de decisiones y seguimiento.
- Servidor e infraestructura propia cuando aplique, para mayor control técnico, mejor privacidad y reducción de dependencia de terceros.

## Fase 6 - Plataforma Privada
Base técnica preparada; pendiente de endurecimiento productivo y conexión a datos reales.

Implementado o documentado:
- Roles: visitante, cliente, cliente_verificado, admin y super_admin.
- Modelo de datos ampliado en `database/schema.sql`.
- Autenticación JWT y refresh token.
- Rutas privadas protegidas por middleware.
- Mensajes, mejoras, auditorías y servicios de cliente modelados.
- Rate limit, CORS y validación básica de formularios.

Pendiente avanzado:
- Panel admin real.
- Verificación de clientes desde backoffice.
- Adjuntos reales y almacenamiento seguro.
- Notificaciones transaccionales.
- Políticas RGPD finales, retención y exportación de datos.
- Conexión a auditorías reales y servicios contratados.

## Reglas Permanentes
- Mantener enfoque premium orientado a clientes de empresas, autónomos y profesionales.
- Mantener español profesional.
- No añadir precios ficticios.
- No guardar claves reales.
- No usar Chico ni Dumbo como logo.
- Usar `logo-argos-it.png` como logo oficial.
- Usar `chico-dumbo-historia.png` solo para "El origen de ARGOS-IT".
