# ARGOS — Client portal blueprint

```
ROOT = /dashboard
CURRENT = SINGLE PAGE PARTIAL
TARGET = TREE (PHASE_4)
TONE = calm, clear, premium, not NOC
```

Preguntas en 10s: ¿protegido? ¿riesgo? ¿incidencias? ¿qué previno ARGOS? ¿qué requiere atención? ¿qué está cubierto?

---

## Shell TARGET

Header: ARGOS · **org name** · profile/logout  
Sidebar: nav IA. Mobile: status first, nav drawer.  
Guard: cookie + membership. `org_viewer` = read only.

---

## Page contracts

Shared states: `loading` `empty` `unknown` `warning` `critical` `error` (+ `healthy` only with evidence).  
Shared security: tenant JWT. Mock numbers labeled MOCK.

### Resumen `/dashboard`

| | |
|--|--|
| PURPOSE | Situación de protección |
| PRIMARY QUESTION | ¿Estoy protegido ahora? |
| DATA CURRENT | portal, assets, TLS |
| DATA TARGET | + health, alerts, incidents, preventive |
| API CURRENT | GET `/api/client/portal` `/assets` `/tls` |
| COMPONENTS | ProtectionStatus, HealthOverview, PreventiveList, AttentionRequired |
| PRIMARY ACTION | Atender ítems de atención |
| SECONDARY | Ver activos / soporte |
| EMPTY | Org sin assets: CTA añadir dominio (owner/admin) |
| UNKNOWN | “Aún no hay datos suficientes para confirmar el estado.” |
| MOBILE | status → atención → resto |
| CLIENT LANGUAGE | Protección / atención / HTTPS / servicios de datos |
| INTERNAL SOURCE | health engine + TLS observation_status |

Wireframe estructural: Master §7.2.

### Mis activos `/dashboard/activos` (+ tipos)

PURPOSE: inventario. DATA: assets (+ TLS). API: CRUD `/api/client/assets` (EXISTS), discover domains (EXISTS).  
PRIMARY: añadir activo (owner/admin). SECONDARY: detalle.  
EMPTY: CTA discover hostname.  
PERMISSIONS: viewer no POST/PATCH/DELETE.

Subrutas filtran `type`. Detalle: hostname, env, status, last_observed, children, TLS if any.

### Monitorización `/dashboard/monitorizacion`

PHASE_3/4. PURPOSE: qué se vigila y último check. DATA: monitors + last observation.  
UNKNOWN si no hay monitors. No mostrar uptime inventado.

### Seguridad `/dashboard/seguridad`

No es `/api/security/dashboard` (user logs). TARGET: postura (TLS, headers audit **si** existe website_audits, coverage). CURRENT audit score puede mostrarse como **auditoría web puntual**, no como health 24/7.

### Alertas / Incidentes

PHASE_3. Cliente ve impacto y estado, no panel A/B/C completo. PRIMARY: entender / contactar soporte. SECONDARY: aprobar L3 si policy lo pide.

### Prevención

PHASE_6. Lista acciones preventivas en lenguaje cliente. Why-this-action simplificado.

### Auditorías

CURRENT: website_audits + client_diagnostics. Keep. No mezclar con monitors.

### Informes

PHASE_8. EMPTY until then.

### Soporte

CURRENT: POST messages/improvements (EXISTS). Keep as soporte.

### Cuenta

Org name, members (read), role. Membership admin UI PHASE_4. Logout EXISTS.

---

## Language matrix (extract)

| INTERNAL | CLIENT |
|----------|--------|
| TLS hostname mismatch | Se ha detectado una incompatibilidad en la protección HTTPS. |
| TLS EXPIRING | El certificado de seguridad caduca pronto. ARGOS lo está siguiendo. |
| HTTP 5xx confirmed | Su sitio web no está respondiendo correctamente. |
| Database connection refused | Uno de sus servicios de datos no está respondiendo correctamente. |
| UNKNOWN coverage | Todavía no hay información suficiente para confirmar que todo está protegido. |
| Incident MITIGATED | El impacto está contenido. Seguimos trabajando en el origen. |
| Action L3 pending | Se requiere su autorización para una intervención. |

---

## CURRENT UI honesty

Hoy el dashboard ya evita inventar score si no hay auditoría (`—`). **Conservar** ese principio al añadir health: nunca rellenar con 96/99.99 salvo MOCK explícito en prototipos Relume/Framer.
