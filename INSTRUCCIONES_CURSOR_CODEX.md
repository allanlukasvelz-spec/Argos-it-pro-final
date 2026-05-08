# INSTRUCCIONES CURSOR / CODEX

## Objetivo del proyecto
ARGOS-IT debe percibirse como una consultoría tecnológica premium para empresas, autónomos y profesionales.

Mensaje central:
> Tecnología que protege, acompaña y simplifica.

Propuesta:
> Ayudamos a empresas y profesionales a mantener su infraestructura digital segura, estable y preparada para crecer, combinando soporte IT, ciberseguridad, mantenimiento web, automatización con IA y mejora continua.

## Verificación local
```bash
cd frontend
npm install
npm run build
```

```bash
cd backend
npm install
node --check server.js
node --check routes/contact.js
```

No hay script `npm test` definido actualmente.

## WordPress export
Los archivos listos para publicación están en `wordpress-export/`.

Mantener:
- Rutas relativas de imágenes para pruebas locales.
- Formulario Formspree `https://formspree.io/f/xpqooedl`.
- Páginas legales.
- Español profesional.
- Los asistentes Chico y Dumbo deben estar visibles como módulo funcional y enlazar a sus páginas/formularios contextuales.
- Las tarjetas de servicios de la home no deben hacer scroll interno: cada una debe abrir una página independiente de detalle.
- Cada página de servicio debe incluir explicación completa, beneficios, proceso de trabajo, CTA y formulario específico conectado a Formspree.
- Debe existir la carpeta `wordpress-export/servicios/` con una página HTML por cada servicio oficial.


## Servicios oficiales
1. Consultoría IT premium.
2. Mantenimiento informático para empresas.
3. Seguridad informática y protección digital.
4. Web, WordPress y presencia digital.
5. Automatización con IA.
6. Auditoría digital continua.

## Navegación obligatoria de servicios
La home debe funcionar como resumen visual y puerta de entrada. No debe resolver todos los servicios dentro de la misma página ni depender de desplazamientos internos.

Cada tarjeta de servicio debe ser un enlace real hacia una página independiente de detalle. Al hacer clic, debe abrirse la página del servicio correspondiente, preferiblemente en una nueva pestaña para que el usuario no pierda la home.

Rutas obligatorias:
- Consultoría IT premium → `wordpress-export/servicios/consultoria-it.html`
- Mantenimiento informático para empresas → `wordpress-export/servicios/mantenimiento-informatico.html`
- Seguridad informática y protección digital → `wordpress-export/servicios/seguridad-informatica.html`
- Web, WordPress y presencia digital → `wordpress-export/servicios/web-wordpress.html`
- Automatización con IA → `wordpress-export/servicios/automatizacion-ia.html`
- Auditoría digital continua → `wordpress-export/servicios/auditoria-digital.html`

En `wordpress-export/index.html`, cada tarjeta debe envolver su contenido con un enlace similar a:
```html
<a href="./servicios/mantenimiento-informatico.html" target="_blank" rel="noopener" class="service-card-link">
  <!-- contenido de la tarjeta -->
</a>
```

No usar enlaces tipo `#servicio`, `scrollIntoView`, acordeones o bloques que solo despliegan información dentro de la home.

## Estructura obligatoria de cada página de servicio
Cada archivo dentro de `wordpress-export/servicios/` debe mantener el diseño premium de ARGOS-IT y contener:

1. Header con logo oficial `logo-argos-it.png`.
2. Título claro del servicio.
3. Subtítulo orientado a negocio.
4. Explicación completa de qué incluye el servicio.
5. Beneficios concretos para empresas, autónomos o profesionales.
6. Casos de uso o situaciones en las que el cliente necesita ese servicio.
7. Proceso de trabajo de ARGOS-IT para ese servicio.
8. CTA principal: `Solicitar este servicio`.
9. Formulario específico conectado a Formspree.
10. Footer con enlaces legales y logo oficial.

## Formularios específicos por servicio
Todos los formularios de las páginas de servicio deben enviar a:
`https://formspree.io/f/xpqooedl`

Cada formulario debe incluir:
```html
<input type="hidden" name="origen" value="servicio-argos-it">
<input type="hidden" name="servicio" value="NOMBRE EXACTO DEL SERVICIO">
```

Campos mínimos comunes:
- Nombre y apellidos.
- Empresa o actividad profesional.
- Email.
- Teléfono.
- Web actual, si aplica.
- Urgencia.
- Descripción de la necesidad.
- Consentimiento de privacidad.

Además, cada servicio debe tener campos contextuales:

### Consultoría IT premium
- Área que desea revisar.
- Número aproximado de usuarios/equipos.
- Principales problemas actuales.
- Objetivo de la consultoría.

### Mantenimiento informático para empresas
- Número de equipos.
- Tipo de soporte requerido.
- Frecuencia deseada.
- Herramientas o sistemas actuales.

### Seguridad informática y protección digital
- Incidencias recientes.
- Uso de copias de seguridad.
- Uso de doble factor.
- Sistemas críticos a proteger.

### Web, WordPress y presencia digital
- URL actual.
- Tipo de web.
- Idiomas necesarios.
- Objetivo principal: captar clientes, informar, vender o reservar.

### Automatización con IA
- Tarea que se desea automatizar.
- Herramientas actuales.
- Volumen aproximado de trabajo.
- Resultado esperado.

### Auditoría digital continua
- URL o sistema a revisar.
- Área prioritaria: SEO, seguridad, velocidad, conversión, formularios o mantenimiento.
- Frecuencia deseada de revisión.
- Problemas detectados por el cliente.

## Requisitos CSS para páginas de servicio
Actualizar `wordpress-export/style.css` con estilos para:
- `.service-card-link`
- `.service-detail-hero`
- `.service-detail-grid`
- `.service-benefits`
- `.service-process`
- `.service-form`
- `.service-cta`

Requisitos:
- Mantener diseño premium, limpio y B2B.
- Responsive perfecto en móvil.
- Botones visibles y claros.
- Tarjetas clicables con estado hover.
- No deformar imágenes ni logos.
- Mantener coherencia con la home.

## Método ARGOS
- A — Analizar.
- R — Reforzar.
- G — Gestionar.
- O — Optimizar.
- S — Sostener.

## Planes
Planes comerciales sin precios:
- Essential.
- Professional.
- Elite.

No inventar precios. La propuesta debe cerrarse tras diagnóstico.

## Marca
- Logo oficial: `wordpress-export/logo-argos-it.png`.
- Imagen narrativa: `wordpress-export/chico-dumbo-historia.png`.
- Chico = protección, diagnóstico, seguridad, orientación, firmeza.
- Dumbo = acompañamiento, seguimiento, recordatorios, cercanía, soporte.
- Chico y Dumbo no son el logo principal.

## Asistentes Chico y Dumbo — implementación obligatoria
Chico y Dumbo deben existir como asistentes funcionales de la experiencia ARGOS-IT, no solo como concepto de marca.

Chico y Dumbo también deben conectarse con la navegación de servicios: Chico debe poder orientar hacia las páginas de diagnóstico, seguridad, mantenimiento y auditoría; Dumbo debe poder orientar hacia contacto, ayuda rápida, seguimiento y formularios. Ambos asistentes deben enlazar a páginas/formularios contextuales, no limitarse a abrir bloques dentro de la misma home.

### Ubicación funcional
- En la web pública, Chico debe aparecer como asistente flotante de diagnóstico y orientación.
- En la web pública, Dumbo debe aparecer como asistente secundario para ayuda rápida, formularios y seguimiento.
- En la futura plataforma privada, Chico se usará para diagnóstico, seguridad, auditoría y recomendaciones.
- En la futura plataforma privada, Dumbo se usará para acompañamiento, recordatorios, incidencias y mensajería.

### Reglas visuales
- Chico representa protección, diagnóstico, seguridad, orientación y firmeza.
- Dumbo representa acompañamiento, seguimiento, cercanía, soporte y recordatorios.
- No usar Chico ni Dumbo como logo principal.
- La imagen `chico-dumbo-historia.png` se usa solo para contar el origen de ARGOS-IT.
- Si todavía no existen avatares individuales, usar una interfaz visual elegante con nombres, iconos y tarjetas; dejar preparadas las rutas futuras:
  - `wordpress-export/chico-asistente.png`
  - `wordpress-export/dumbo-asistente.png`

### Funciones mínimas en WordPress export
Implementar un módulo visible y funcional en `wordpress-export/index.html` llamado “Asistentes ARGOS”.

Debe incluir:
- Tarjeta de Chico con botón: `Iniciar diagnóstico con Chico`.
- Tarjeta de Dumbo con botón: `Pedir ayuda a Dumbo`.
- Ambos botones deben abrir una opción contextual sin hacer scroll interno.
- La opción puede abrir una página independiente o una nueva pestaña:
  - `./asistente-chico.html?asistente=chico`
  - `./asistente-dumbo.html?asistente=dumbo`
- Cada página debe incluir explicación del asistente y formulario conectado a Formspree.
- Cada formulario debe incluir campo oculto:
  - `asistente=chico` o `asistente=dumbo`.
- Cada formulario debe incluir campo oculto `origen=asistente-argos`.

### Funciones de Chico
Chico debe poder orientar al usuario en:
- Diagnóstico inicial.
- Selección de servicios.
- Seguridad informática.
- Mantenimiento IT.
- Auditoría digital.
- Priorización de necesidades.
- Redirección al formulario adecuado.

### Funciones de Dumbo
Dumbo debe poder orientar al usuario en:
- Ayuda rápida.
- Seguimiento de solicitudes.
- Explicación de formularios.
- Preparación de mensajes para ARGOS-IT.
- Incidencias simples.
- Recordatorios.
- Contacto y soporte.

### Seguridad y control
- Chico y Dumbo pueden guiar, recomendar y preparar solicitudes.
- No pueden ejecutar acciones críticas sin confirmación expresa del usuario.
- No deben prometer resultados garantizados.
- No deben recopilar datos sensibles innecesarios.
- Deben enviar solicitudes mediante Formspree o el backend existente, nunca exponer claves API.

### Requisitos de implementación
- Mantener diseño premium, B2B y profesional.
- Añadir estilos en `wordpress-export/style.css` para tarjetas, botones y layout responsive.
- No romper el formulario de contacto actual.
- No eliminar páginas legales.
- Documentar el funcionamiento en `CAMBIOS_REALIZADOS.md` e `INSTRUCCIONES_HOSTINGER_WORDPRESS.md`.
- Ejecutar verificación final de rutas y enlaces.

## Checklist final obligatorio antes de publicar
Confirmar que existen y funcionan:
- `wordpress-export/index.html`
- `wordpress-export/contacto.html`
- `wordpress-export/aviso-legal.html`
- `wordpress-export/privacidad.html`
- `wordpress-export/cookies.html`
- `wordpress-export/style.css`
- `wordpress-export/logo-argos-it.png`
- `wordpress-export/chico-dumbo-historia.png`
- `wordpress-export/servicios/consultoria-it.html`
- `wordpress-export/servicios/mantenimiento-informatico.html`
- `wordpress-export/servicios/seguridad-informatica.html`
- `wordpress-export/servicios/web-wordpress.html`
- `wordpress-export/servicios/automatizacion-ia.html`
- `wordpress-export/servicios/auditoria-digital.html`
- `wordpress-export/asistente-chico.html`
- `wordpress-export/asistente-dumbo.html`

Verificar:
- Cada tarjeta de servicio abre su página independiente.
- Cada página de servicio tiene formulario específico.
- Cada formulario conserva Formspree.
- Cada formulario incluye campo oculto `servicio` u `origen` según corresponda.
- Chico y Dumbo aparecen como asistentes funcionales.
- Chico y Dumbo enlazan a sus páginas/formularios propios.
- El logo oficial se usa como logo principal.
- `chico-dumbo-historia.png` se usa solo para la historia de marca.
- Las páginas legales siguen disponibles.
- No hay enlaces rotos.
- No hay claves API expuestas.
- Todo queda en español profesional.
