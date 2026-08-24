# ARGOS — Handoff Relume

```
STATUS = READY_FOR_RELUME
STAGE = 1_ARCHITECTURAL_PRODUCT_BLUEPRINT
AUDIENCE = Relume (IA + UX + wireframes)
SECRETS = NONE
BACKEND_DETAIL = MINIMAL
```

Relume diseña **sitemap, jerarquía, navegación, journeys, secciones, jerarquía de componentes, wireframes y prioridades responsive**.

Relume **no** decide: aislamiento de tenants, niveles de automatización, semántica UNKNOWN, ni implementación.

Si un wireframe contradice el Nivel 1–2, gana el blueprint de producto.

**UI final = PENDING FRAMER.** Los wireframes de Relume no se presentan como diseño visual definitivo.

---

## 0. Tres productos visuales, un sistema

```
PUBLIC WEBSITE     CLIENT PORTAL      INTERNAL NOC
        \                |                 /
                     ARGOS CORE
```

Diseñar las tres. No fusionarlas. No convertir la web pública en dashboard.

---

## 1. Restricciones que Relume no puede romper

1. ORG A no ve datos de ORG B (ni en chrome, ni en switcher, ni en URL).
2. `UNKNOWN != HEALTHY`. Empty/unknown no se ilustran como «todo protegido».
3. Números de ejemplo: **MOCK / DEMO / PLACEHOLDER**.
4. Automation Level 3+: la UI muestra aprobación humana, no «Auto Fix».
5. Level 4: no control automático.
6. Toda recomendación expone «Why this action?» (evidencia, hipótesis, alternativas, rollback).
7. Logo, Chico y Dumbo: PROTECTED. Mascotas = ASSISTANT_ONLY. No en header Corporate.
8. No inventar servicios, precios, SLAs, testimonios, logos de clientes, certificaciones.
9. **No eliminar** rutas públicas actuales sin aprobación humana. TARGET es **superconjunto**, no reemplazo.
10. Método ARGOS: exactamente cinco pasos — Analizar → Reforzar → Guiar → Optimizar → Supervisar. Sin sexto.
11. Servicios oficiales (slugs inmutables): `consultoria-it`, `mantenimiento-informatico`, `seguridad-informatica`, `web-wordpress`, `automatizacion-ia`, `auditoria-digital`.
12. Copy: tono calm / trustworthy. `AI_DRAFT_DO_NOT_SHIP` no se convierte en producto.
13. Web pública vende ARGOS. Portal tranquiliza. NOC opera.

---

## 2. PUBLIC WEBSITE

### 2.1 Sitemap CURRENT (obligatorio preservar)

Implementado y canónico hoy:

```
/
/servicios
/servicios/consultoria-it
/servicios/mantenimiento-informatico
/servicios/seguridad-informatica
/servicios/web-wordpress
/servicios/automatizacion-ia
/servicios/auditoria-digital
/metodo
/metodo/analizar
/metodo/reforzar
/metodo/guiar
/metodo/optimizar
/metodo/supervisar
/sobre-argos-it
/contacto
/aviso-legal
/privacidad
/cookies
/auth/login
/auth/register
```

Nav Corporate actual: Inicio · Servicios · Método · Sobre ARGOS-IT · Contacto.  
Legal en footer. Login no es ítem Corporate principal.

### 2.2 Sitemap TARGET (propuesto; Relume reconcilia)

Relume **puede añadir** destinos. **No puede borrar** los de 2.1.

Propuesta de narrativa de captación (labels en español; URLs nuevas las propone Relume):

| Intención | Relación con CURRENT |
|-----------|----------------------|
| Inicio | `/` |
| Cómo funciona | Mapear a `/metodo` **o** página nueva que enlace a `/metodo`. `/metodo` no desaparece. |
| Protección preventiva | **Nueva** (TARGET). Explica prevención ≠ monitoring básico. |
| Ciberseguridad | Enlaza `/servicios/seguridad-informatica`; no duplicar el servicio. |
| Auditoría | Enlaza `/servicios/auditoria-digital`. |
| Monitorización 24/7 | **Nueva**. Explica vigilancia continua y qué ve el cliente. |
| Servicios / Planes | `/servicios` + ancla de planes existente. No inventar precios. |
| Casos de uso | **Nueva**. Sin nombres de clientes reales ni logos. |
| Sobre ARGOS | `/sobre-argos-it` (URL canónica). |
| Contacto | `/contacto`. |
| Login | `/auth/login` (fuera del lab Corporate visual, pero en sitemap). |
| Legal | rutas legales actuales. |

Labs (`/explainer`, `/mascot-motion-lab`): **fuera** del sitemap de marketing.

### 2.3 Propósito por página pública (TARGET)

| Página | Propósito | Pregunta que responde | CTA primario |
|--------|-----------|----------------------|--------------|
| Inicio | Captar + explicar | ¿Qué es ARGOS y por qué confiar? | Contacto / Servicios |
| Cómo funciona | Método | ¿Cómo trabaja ARGOS? | Método / Contacto |
| Protección preventiva | Diferenciación | ¿En qué se diferencia de un monitor básico? | Contacto |
| Ciberseguridad | Servicio | ¿Cómo protege? | Ficha servicio / Contacto |
| Auditoría | Servicio | ¿Qué revisa? | Ficha / Contacto |
| Monitorización 24/7 | Capacidad | ¿Qué vigila y qué veo yo? | Contacto |
| Servicios / Planes | Elegir oferta | ¿Qué contratar? | Ficha o Contacto |
| Casos de uso | Identificación | ¿Me aplica? | Contacto |
| Sobre ARGOS | Confianza institucional | ¿Quién está detrás? | Contacto |
| Contacto | Convertir | ¿Cómo empiezo? | Enviar formulario |
| Login | Acceso cliente | Entrar al portal | Submit |
| Legal | Cumplimiento | Obligaciones | — |

### 2.4 User journeys públicos

1. **Visitante → lead:** Home → Cómo funciona / Método → Servicios → Contacto.
2. **Visitante → cliente existente:** Home → Login → Portal.
3. **Visitante escéptico:** Home → Protección preventiva → Monitorización → Contacto.

### 2.5 Navegación pública

- Un nav primario corto. Destinos TARGET nuevos pueden vivir en nav, en footer o como secciones de Home: Relume decide **sin** saturar.
- Un CTA primario por vista (consulta / contacto).
- Login visible pero no dominante.
- Footer: servicios, método, sobre, contacto, legal.
- No mascotas en header.
- No chrome de dashboard.

### 2.6 Componentes / secciones (jerarquía)

Home (narrativa, no inventario): problema → comprensión → prevención → método → servicios → protección continua → confianza → contacto.

Descartar ruido actual: galaxy como marca, fake command-center, prueba social inventada.

Componentes: Header, Footer, Hero editorial, Bloque método (5 pasos), Grid servicios (6), Plan cards (sin cifras inventadas), Formulario contacto, Artículo legal.

### 2.7 Responsive público

1. Desktop institucional.
2. Tablet: misma jerarquía, nav compacto.
3. Móvil: hero + CTA + método resumido; no tablas.

### 2.8 Estados públicos

Contacto: vacío, validación, envío, error, éxito.  
Login: vacío, error de credenciales, loading.  
Sin estados de salud de infraestructura en marketing.

---

## 3. CLIENT PORTAL

Usuario: miembro de una organización cliente (`org_owner` / `org_admin` / `org_member` / `org_viewer`).

Objetivo en 10 segundos:

1. ¿Estoy protegido?
2. ¿Hay algún riesgo?
3. ¿Hay incidencias?
4. ¿Qué ha prevenido ARGOS?
5. ¿Qué necesita mi atención?
6. ¿Qué servicios tengo protegidos?

Tono: simple, calm, premium, business-oriented. No jerga de NOC.

### 3.1 Sitemap TARGET

Ruta raíz actual: `/dashboard` (página única **CURRENT**). TARGET introduce hijos. Relume puede proponer URLs; la raíz `/dashboard` se conserva.

```
/dashboard                         Resumen
/dashboard/activos                 Mis activos
/dashboard/activos/dominios
/dashboard/activos/websites
/dashboard/activos/servidores
/dashboard/activos/apis
/dashboard/activos/bases-de-datos
/dashboard/activos/servicios
/dashboard/activos/certificados-tls
/dashboard/monitorizacion
/dashboard/seguridad
/dashboard/alertas
/dashboard/incidentes
/dashboard/prevencion
/dashboard/auditorias
/dashboard/informes
/dashboard/soporte
/dashboard/cuenta
```

Auth: `/auth/login`, `/auth/register`. Sin «olvidé contraseña» hoy — no diseñarlo como si existiera; Relume puede marcar el hueco como FUTURE.

### 3.2 Shell

```
Header: marca ARGOS | nombre de organización | perfil
Sidebar: nav de 3.1
Main: contenido
```

CURRENT no tiene sidebar. Relume debe diseñarlo. Móvil: Protection Status primero; sidebar en drawer.

### 3.3 Resumen (wireframe estructural)

```
PROTECTION STATUS     (PROTECTED | WARNING | CRITICAL | UNKNOWN)
Protection Score DEMO     Availability DEMO
HEALTH OVERVIEW       Web / TLS / DNS / Backups / Server  (+ UNKNOWN si no hay datos)
PREVENTIVE ACTIONS    lista de acciones (✓ / !)
ATTENTION REQUIRED    solo si hay algo que el cliente debe hacer
```

No pintar HEALTHY en filas sin cobertura.

### 3.4 Jerarquía de información (portal)

1. Estado de protección  
2. Atención requerida  
3. Salud por dominio (web, TLS, DNS, backups, server)  
4. Acciones preventivas  
5. Activos  
6. Historial / informes  

### 3.5 Acciones

| Contexto | Primaria | Secundaria |
|----------|----------|------------|
| Resumen | Ver atención requerida | Abrir incidente / soporte |
| Activos | Añadir activo (owner/admin) | Ver detalle |
| Alertas | Entender impacto | Contactar soporte |
| Incidentes | Seguir estado | Aprobar acción Level 3 (si aplica) |
| Prevención | Ver «por qué» | Aprobar / posponer |
| Soporte | Enviar mensaje | Ver solicitudes |
| Cuenta | Ver org / miembros | Logout |

`org_viewer`: solo lectura.

### 3.6 Estados obligatorios en cada pantalla de datos

loading · empty · unknown · warning · critical · error · (healthy solo con evidencia)

Lenguaje cliente: ver matriz en el blueprint maestro (interno ≠ cliente). No ocultar la verdad; no saturar.

### 3.7 Journeys cliente

1. Login → Resumen → (si alerta) Alertas → Incidentes.  
2. Resumen → Mis activos → Añadir dominio.  
3. Incidente → resolución (el cliente observa; el NOC actúa).  
4. Prevención TLS → aprobación de renovación (si Level 3).

### 3.8 Responsive cliente

- Desktop: shell completo.  
- Móvil: estado + atención + 3 acciones; tablas en scroll horizontal o lista.  
- No Command Center en el portal.

---

## 4. INTERNAL NOC

Usuario: personal ARGOS (`admin`, `super_admin`; roles NOC futuros). **No** es el portal del cliente.

Tono: técnico, denso, rápido, evidence-driven, severidad clara, ownership claro.

Ruta raíz TARGET: `/noc`. **NOT_IMPLEMENTED** hoy.

### 4.1 Sitemap TARGET

```
/noc                         Command Center
/noc/customers
/noc/organizations
/noc/assets
/noc/health
/noc/monitoring
/noc/alerts
/noc/incidents
/noc/predicted-risks
/noc/preventive-actions
/noc/tls
/noc/dns
/noc/servers
/noc/databases
/noc/backups
/noc/agents
/noc/runbooks
/noc/remediations
/noc/reports
/noc/support
/noc/audit
/noc/platform-health
```

Relume puede agrupar (p. ej. Infrastructure = TLS/DNS/Servers/DB/Backups) **sin perder** destinos.

### 4.2 Shell Command Center (estructural)

```
Header: ARGOS NOC | GLOBAL PLATFORM HEALTH
Sidebar: nav 4.1
Main:
  KPI strip (Customers / Assets / Alerts / Incidents / Risks) — MOCK
  ACTIVE PRIORITIES (customer, signal, severity, action)
  PREDICTED INCIDENTS (asset, risk, ETA, plan)
  RUNBOOK / ACTION A-B-C PANEL (Why this action, rollback, safe stop)
```

### 4.3 Jerarquía NOC

1. Prioridades activas (severidad × impacto × cliente)  
2. Incidentes abiertos  
3. Riesgos predichos  
4. Salud global de plataforma ARGOS  
5. Cola de aprobaciones Level 3  
6. Exploración por cliente / activo  

### 4.4 Acciones NOC

Primaria: Inspect / Action A (si Level ≤ 2) / Request approval (Level 3).  
Secundaria: Action B/C, rollback, escalate, open runbook, switch customer.

Selector de cliente **nunca** mezcla datos de dos orgs en la misma vista.

### 4.5 Responsive NOC

- Desktop: experiencia completa.  
- Tablet: prioridades + incidente activo.  
- Móvil: cola de severidad; no diseñar el Command Center completo como destino móvil.

### 4.6 Journey NOC canónico

Alert → Investigation → Evidence → Hypothesis → Action A → (fail → evidence → B → fail → C) → Verify → Resolve **o** Safe Stop / Rollback / Escalate.

---

## 5. Componentes compartidos (contrato UX, no visual)

| Componente | Uso |
|------------|-----|
| StatusBadge | estados de §6 del Framer handoff |
| EvidenceStack | lista de señales + timestamps |
| WhyThisAction | evidencia, hipótesis, confianza (HIGH/MEDIUM/LOW/UNKNOWN, no % inventados), alternativas, resultado esperado, riesgo, failure signal, B, C, rollback |
| ApprovalGate | Level 3 |
| SafeStop | A/B/C agotados o riesgo inaceptable |
| TenantContextChip | org activa (portal) o cliente seleccionado (NOC) |
| EmptyState / UnknownState | distintos entre sí |
| MockLabel | DEMO/MOCK/PLACEHOLDER |

---

## 6. Prioridad de diseño Relume

1. Portal cliente — Resumen + shell (es la experiencia que falta estructuralmente).  
2. NOC Command Center.  
3. Web pública: reconciliar TARGET con sitemap CURRENT (Home + páginas nuevas propuestas).  
4. Resto de hojas portal.  
5. Resto de hojas NOC.

---

## 7. Entregable esperado de Relume

- Sitemap PUBLIC / CLIENT / NOC (superconjunto de CURRENT).  
- Nav + user journeys.  
- Wireframes estructurales por pantalla clave.  
- Inventario de secciones y componentes.  
- Notas responsive.  
- Lista de contradicciones detectadas contra este handoff (si las hay).

Tras aprobación humana → completar Framer handoff y Design Contract.
