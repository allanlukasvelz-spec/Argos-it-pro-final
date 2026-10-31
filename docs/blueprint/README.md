# ARGOS — Blueprint maestro de producto y arquitectura

**Estado de esta carpeta:** `STAGE_1_ARCHITECTURAL_PRODUCT_BLUEPRINT`  
**Fecha:** 2026-08-24  
**HEAD de referencia:** `ec27eb9` (`feature/argos-multitenant-platform`)  
**Checkpoint:** `argos-pre-multitenant-2026-08-24`  
**Fase 3:** no autorizada para implementación

Este directorio es el **plano de construcción** de ARGOS. No es un inventario pasivo de lo que hay hoy. Define qué existe, qué falta, qué será el producto final, cómo se navegará, cómo se aislarán clientes, cómo se decidirán acciones A/B/C y cuál es el camino hasta producción.

---

## Jerarquía de autoridad

| Nivel | Fuente | Puede contradecir niveles inferiores | No puede contradecir |
|-------|--------|--------------------------------------|----------------------|
| 1 | Seguridad / datos / sistema (código real + este blueprint en cláusulas de seguridad) | Sí | — |
| 2 | Función de producto — `ARGOS_MASTER_PRODUCT_BLUEPRINT.md` | Relume, Framer, implementación | Nivel 1 |
| 3 | IA / UX — salida Relume aprobada | Framer, implementación | Niveles 1–2 |
| 4 | Diseño visual — salida Framer aprobada | Implementación | Niveles 1–3 |
| 5 | Implementación Cursor | — | Niveles 1–4 |

Ejemplo: si Framer propone un botón «Auto Fix» y el blueprint clasifica esa acción como Automation Level 3, la UI debe exigir aprobación humana. No se cambia la arquitectura para acomodar el mockup.

---

## Flujo de herramientas (obligatorio)

```
1. CURSOR   → arquitectura técnica + funcional + producto   (ESTA EJECUCIÓN)
2. RELUME   → sitemap + UX + wireframes
3. FRAMER   → alta fidelidad visual + responsive + interacción
4. CURSOR   → reconciliación + implementación real
```

Esta carpeta **no** sustituye Relume ni Framer.

- **Wireframes aquí = estructurales.**
- **UI final = PENDING RELUME + FRAMER.**
- El contrato visual Client + NOC está en `docs/design/ARGOS_DESIGN_CONTRACT.md` (`SPEC_COMPLETE`). Este directorio no autoriza implementar esa UI ni Phase 3.

---

## Source of truth

| Artefacto | Rol |
|-----------|-----|
| [ARGOS_MASTER_PRODUCT_BLUEPRINT.md](./ARGOS_MASTER_PRODUCT_BLUEPRINT.md) | **SOURCE OF TRUTH** — especificación completa |
| [ARGOS_MASTER_BLUEPRINT.html](./ARGOS_MASTER_BLUEPRINT.html) | Plano navegable (local) |
| [ARGOS_MASTER_BLUEPRINT.pptx](./ARGOS_MASTER_BLUEPRINT.pptx) | Presentación de blueprint arquitectónico (no diseño visual final) |
| [ARGOS_DESIGN_CONTRACT.md](./ARGOS_DESIGN_CONTRACT.md) | Puntero al contrato visual en `docs/design/` — **SPEC_COMPLETE**; UI no autorizada |

---

## Índice de documentos

### Producto y experiencias

| Documento | Contenido |
|-----------|-----------|
| [ARGOS_FINAL_INFORMATION_ARCHITECTURE.md](./ARGOS_FINAL_INFORMATION_ARCHITECTURE.md) | Árbol de rutas PUBLIC / CLIENT / NOC |
| [ARGOS_FINAL_CLIENT_PORTAL_BLUEPRINT.md](./ARGOS_FINAL_CLIENT_PORTAL_BLUEPRINT.md) | Contrato funcional del portal cliente |
| [ARGOS_FINAL_NOC_BLUEPRINT.md](./ARGOS_FINAL_NOC_BLUEPRINT.md) | Contrato funcional del NOC interno |

### Arquitectura de sistema

| Documento | Contenido |
|-----------|-----------|
| [ARGOS_FINAL_SYSTEM_ARCHITECTURE.md](./ARGOS_FINAL_SYSTEM_ARCHITECTURE.md) | CURRENT vs TARGET, frontend, backend, dependencias |
| [ARGOS_FINAL_DATABASE_MODEL.md](./ARGOS_FINAL_DATABASE_MODEL.md) | Modelo de datos EXISTS / PHASE_n / FUTURE |
| [ARGOS_FINAL_SECURITY_MODEL.md](./ARGOS_FINAL_SECURITY_MODEL.md) | Auth, tenancy, aislamiento, amenazas |

### Operaciones

| Documento | Contenido |
|-----------|-----------|
| [ARGOS_FINAL_MONITORING_MODEL.md](./ARGOS_FINAL_MONITORING_MODEL.md) | Pipeline asset → monitor → observación → salud |
| [ARGOS_FINAL_INCIDENT_MODEL.md](./ARGOS_FINAL_INCIDENT_MODEL.md) | Alertas, incidentes, evidencias, estados |
| [ARGOS_FINAL_REMEDIATION_MODEL.md](./ARGOS_FINAL_REMEDIATION_MODEL.md) | Prevención, A/B/C, rollback, niveles de automatización |
| [ARGOS_FAILURE_ACTION_MATRIX.md](./ARGOS_FAILURE_ACTION_MATRIX.md) | Matriz de fallo por clase de problema |

### Planificación y calidad

| Documento | Contenido |
|-----------|-----------|
| [ARGOS_IMPLEMENTATION_ROADMAP.md](./ARGOS_IMPLEMENTATION_ROADMAP.md) | Fases 0–12, dependencias, DoD, plantilla de fase |
| [ARGOS_TEST_STRATEGY.md](./ARGOS_TEST_STRATEGY.md) | Pirámide de pruebas y casos críticos |
| [ARGOS_RISK_REGISTER.md](./ARGOS_RISK_REGISTER.md) | Registro de riesgos con A/B/C y rollback |

### Handoffs (herramientas de diseño)

| Documento | Contenido |
|-----------|-----------|
| [handoff/ARGOS_RELUME_HANDOFF.md](./handoff/ARGOS_RELUME_HANDOFF.md) | Entrada Relume: sitemap, journeys, secciones, wireframes |
| [handoff/ARGOS_FRAMER_HANDOFF.md](./handoff/ARGOS_FRAMER_HANDOFF.md) | **DRAFT** — principios visuales; se completa tras Relume |

---

## Estado de fases (código)

| Fase | Nombre | Estado | Commit |
|------|--------|--------|--------|
| 0 | Organization Foundation | **COMPLETE** | `3444916` |
| 1 | Tenant Scoping | **COMPLETE** | `c19a8ce` |
| 2 | Assets + TLS | **COMPLETE** | `ec27eb9` |
| 3 | Monitoring + Alerts + Incidents | **NOT AUTHORIZED** | — |

Existe `stash@{0}` con un intento incompleto de Fase 3. **No aplicar, extraer, eliminar ni reutilizar.**

---

## Estado de documentación previa (no borrar)

| Documento | Clasificación | Nota |
|-----------|---------------|------|
| `docs/design/ARGOS_DESIGN_DIRECTOR_BRIEF.md` | **CURRENT** | Contrato de marca Corporate |
| `docs/design/ARGOS_VISUAL_FREEZE_21_6B.md` | **CURRENT** | Dirección visual Quiet Authority; no es UI del portal/NOC |
| `docs/design/ARGOS_MASCOT_*` | **CURRENT** | Mascotas ASSISTANT_ONLY |
| `docs/design/source-hierarchy.md` | **CURRENT** (marca) | Jerarquía visual 21.3; la jerarquía de *producto* de este blueprint la complementa, no la borra |
| `docs/architecture/ARGOS_MULTITENANT_AUDIT_2026_08_24.md` | **HISTORICAL / STALE en mapa CURRENT** | Redactado antes de Fases 0–2; el mapa «no existen organizations/assets» es falso en `ec27eb9`. El plan de fases posteriores queda **SUPERSEDED** por este blueprint |
| `docs/design/ARGOS_RELUME_REVIEW_21_7C.md` | **HISTORICAL** (otra rama) | Principios extraídos: sitemap Corporate canónico, no inventar rutas, paywall Relume aceptado. No restaurado aquí |

No hay dos blueprints «current» contradictorios: **este directorio sustituye** cualquier plano de producto escrito como si Fase 3 ya existiera.

---

## Qué no hace este blueprint

- No implementa Fase 3.
- No crea tablas.
- No modifica comportamiento de la aplicación.
- No congela pixel-perfect, tipografía nueva, motion ni spacing exacto.
- No declara capacidades futuras como existentes.

---

## Cómo usar este plano

1. Un desarrollador construye siguiendo `ARGOS_MASTER_PRODUCT_BLUEPRINT.md`.
2. Relume diseña IA/UX usando `handoff/ARGOS_RELUME_HANDOFF.md`.
3. Tras Relume aprobado, se completa el handoff Framer y el Design Contract.
4. Cursor implementa solo lo autorizado por fase, sin contradecir Nivel 1.
