# ARGOS Local Canonical Wireframes — 21.7C

**Status:** REQUIRED_BY_PAYWALL_EXCEPTION
**Phase:** 21.7C
**Date:** 2026-08-19
**Source of truth:** repositorio + i18n + decisiones congeladas (no Relume premium)

---

## 0. Objetivo y límites

Este documento sustituye los wireframes no visibles en Relume por una especificación local auditable y transferible a Framer/implementación posterior.

No cambia:

- IA aprobada.
- Seis servicios.
- Cinco fases del método.
- Política legal.
- Política de mascotas.

No incluye producción ni cambios de código UI en esta fase.

---

## 1. Contratos técnicos usados

- `frontend/lib/corporateNav.ts`
- `frontend/lib/services.ts`
- `frontend/lib/methodArgosSteps.ts`
- `frontend/i18n/locales/es.json`
- `docs/design/ARGOS_DESIGN_DIRECTOR_BRIEF.md`
- `docs/design/corporate-chrome-21-5.md`
- `docs/design/ARGOS_MASCOT_LOW_MOTION_FREEZE_21_6B.md`

---

## 2. Wireframes canónicos locales (estructura por página)

## 2.1 Home `/`

Orden bloqueado:

1. Hero
2. Reality / Problem
3. Philosophy
4. Principles / Benefits
5. ARGOS Method
6. Five phases
7. Services
8. Stability / operational benefits
9. Trust / human accompaniment (sin testimonios)
10. Final CTA
11. Footer legal

Reglas:

- Sin newsletter.
- Sin logos de clientes/partners.
- Sin testimonios inventados.
- Sin "Equipo ARGOS IT" como prueba social.
- CTA principal: `Solicitar consulta` hacia `/contacto`.

## 2.2 Servicios `/servicios`

Bloques:

1. H1 + subtítulo desde `servicesPage`.
2. Grid de 6 servicios exactos.
3. Cada card: título, resumen, bullets (incluye), CTA a detalle.
4. Banda CTA final a `/contacto`.

## 2.3 Service detail template `/servicios/[slug]`

Bloques:

1. Hero de servicio (nombre + problema que resuelve).
2. Incluye.
3. Beneficios.
4. Proceso (alineado a ARGOS, sin crear fases nuevas).
5. Ideal para.
6. CTA a `/contacto?service={slug}`.

## 2.4 Método `/metodo`

Bloques:

1. H1 + subtítulo.
2. Línea/stack de 5 fases en orden cerrado.
3. Explicación de relación método-servicios (sin mezclar conceptos).
4. CTA a Contacto.

## 2.5 Method phase template `/metodo/[slug]`

Bloques:

1. Letra + fase (A/R/G/O/S).
2. Significado.
3. Qué hace ARGOS.
4. Qué obtiene cliente.
5. Señales/riesgos que evita.
6. Servicios relacionados (solo slugs existentes).
7. Navegación prev/next.

## 2.6 Sobre ARGOS-IT `/sobre-argos-it`

Bloques:

1. Título.
2. Párrafos `about.paragraphs`.
3. Valores `about.values`.
4. CTA sobrio a Contacto.

Prohibido: headcount, años, oficinas, equipo inventado, premios/certificaciones no verificadas.

## 2.7 Contacto `/contacto`

Bloques:

1. Título + intro.
2. Email verificado: `info@argos-it.com`.
3. Cobertura: telemático / telefónico / presencial según proyecto.
4. Formulario actual: name, email, phone, company, service, message, privacy.
5. CTA enviar.

Prohibido: teléfono inventado, horarios inventados, SLA inventado, mapas/chat/widgets nuevos.

---

## 3. Responsive obligatorio

Breakpoints a validar en todos los wireframes:

- 1440
- 1024
- 768
- 390

Checklist:

- Orden de lectura correcto.
- Sin overflow horizontal.
- Tipografía legible.
- Cards y timelines apilables.
- CTA visibles sin depender de hover.

---

## 4. Accesibilidad mínima obligatoria

- Un único `h1` por vista.
- Landmark semántico (`header`, `main`, `footer`).
- Contraste suficiente en texto principal y CTAs.
- Focus visible en enlaces/botones/campos.
- Targets táctiles razonables en mobile.
- Sin motion obligatoria para comprender contenido.

---

## 5. Truthfulness 5/5 (tolerancia cero)

Debe cumplirse en todas las páginas:

- Sin clientes/testimonios/partners inventados.
- Sin logos de terceros como prueba social.
- Sin métricas, SLAs, premios o certificaciones no verificadas.
- Sin newsletter.
- Sin servicios o rutas fuera de contrato.
- Sin sexta fase.

---

## 6. Factibilidad de implementación

El sistema propuesto debe ser trasladable a:

- Next.js + React + TypeScript actuales.
- `CorporateHeader`/`CorporateFooter`.
- `CorporatePageShell` y ownership existente.
- i18n real.
- Pruebas Playwright.

Patrones aceptados:

- `container`
- `grid`
- `stack`
- `section`
- `feature list`
- `timeline`
- `CTA band`

---

## 7. Resultado local 21.7C

```
LOCAL_CANONICAL_WIREFRAMES = READY
LOCAL_TRUTHFULNESS = REQUIRED_5_OF_5
LOCAL_RESPONSIVE = REQUIRED
LOCAL_ACCESSIBILITY = REQUIRED
LOCAL_FEASIBILITY = REQUIRED
PRODUCTION_IMPLEMENTATION = BLOCKED_UNTIL_HUMAN_FREEZE
```
