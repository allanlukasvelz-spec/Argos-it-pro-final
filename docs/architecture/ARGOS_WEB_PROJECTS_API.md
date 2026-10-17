# ARGOS Web Projects — contrato técnico (FASE 3)

Módulo de expedientes web. No es Platform Map. No es `website_audits`. No reutiliza `evidence_objects`.

Envelope CURRENT: `{ project }`, `{ items }`, `{ item }`, `{ form }`, `{ documents }`, `{ document }`, `{ reviews }`, `{ comment }`, `{ credentialStatus }`. Errores: `{ error, code }`.

## Roles

| Rol | Lectura / descarga | Form / items / upload / comentarios | Crear expediente | Workflow / archive / reviews |
|---|---|---|---|---|
| `org_owner` / `org_admin` | sí | sí | solicitud INTAKE | no |
| `org_member` | sí | sí | no | no |
| `org_viewer` | sí | no | no | no |
| NOC (`admin` / `super_admin`) | con `organization_id` | sí | sí (INTAKE) | sí |

`org_admin` no entra en `/noc`. `requireNocAccess` CURRENT es la autoridad.

POST cliente = solicitud `INTAKE` controlada (`policy: INTAKE_SOLICITUD_ONLY`).

## Tenant

Cliente: `req.tenant.id` CURRENT. Nunca body.

NOC: `organization_id` query o `organizationId` body JSON, obligatorio. En upload multipart el tenant va en query (`?organization_id=`). `project_id` + `organization_id` + relación. Cross-tenant → `404 NOT_FOUND`. RBAC intra-tenant → `403 FORBIDDEN`.

La object key **no autoriza**. Autorización: actor autenticado + org + fila de proyecto + fila de documento + RBAC. Después se lee el store.

## Workflow

`INTAKE → REVIEW → ARCHITECTURE → MOCKUP → DEVELOPMENT → VALIDATION → PUBLICATION → COMPLETED`

`COMPLETED` es terminal. `completed_at` solo al entrar en `COMPLETED`.

`ARCHIVED` no es fase. `archived_at` lifecycle. Cliente: lectura/descarga sí, mutación/upload `409 PROJECT_ARCHIVED`. No hay restore en v1.

## Formulario

Definición v1 en código (`web-project-intake.v1`). Respuestas por campo, upsert `UNIQUE(project_id, schema_version, field_key)`.

## Progreso

Único cálculo: `calculateProgress`. No se persiste. Un documento requerido solo cuenta si `status=AVAILABLE` **y** `upload_status=STORED`.

## Items

Tipos: `page|service|product|tour|team_member|location|deliverable|custom`.

Sin DELETE destructivo. Retirada = `archived_at`.

## Upload contract

Un solo camino HTTP. No hay POST JSON de metadata equivalente.

```
POST /api/client/web-projects/:id/documents
POST /api/noc/web-projects/:id/documents?organization_id=:orgId
Content-Type: multipart/form-data
campo file = bytes
campo requirementKey = opcional
```

Respuesta `201 { document }` (NOC añade `organizationId`).

El backend genera `id`, `object_key` y `sha256`. Rechaza `objectKey`, `object_key`, `storageKey`, `path`, `bucket`, `sha256`, `scanStatus`, `id` del cliente (`400 DOCUMENT_INVALID`).

JSON a este endpoint → `400 DOCUMENT_INVALID` (se requiere multipart).

Proyecto archivado → `409 PROJECT_ARCHIVED`.

Store no configurado o `put` fallido → `503 STORAGE_UNAVAILABLE`. Sin fallback a `/tmp`, `public/` ni disco de proyecto.

## Download contract

```
GET /api/client/web-projects/:id/documents/:documentId/content
GET /api/noc/web-projects/:id/documents/:documentId/content?organization_id=:orgId
```

Stream backend (no presigned, no CDN, no Range). Solo documentos `upload_status=STORED`. Metadata PENDING no se descarga.

Headers:

```
Content-Type: <mime persistido>
Content-Length: <bytes>
Content-Disposition: attachment; filename="..."; filename*=UTF-8''...
Cache-Control: private, no-store
X-Content-Type-Options: nosniff
```

SVG y cualquier tipo activo se sirven como `attachment`. No se renderizan inline.

Objeto ausente o checksum distinto → error seguro (`404`/`503`). Nunca se devuelve la ruta física.

## Object key

`org/{organizationId}/wp/{documentId}`

La genera el backend. Namespace `wp` en el **mismo** object store CURRENT que evidence (`ev`). No comparte filas `evidence_objects`.

## Storage policy

Reutiliza `getEvidenceStore()`: `LocalPrivateObjectStore` o `S3CompatibleObjectStore`, mismas env, mismo bucket/root. `Noop` / no configurado = fail-closed.

Local: directorio privado (`ARGOS_EVIDENCE_ROOT` o `backend/data/evidence`). No está bajo `frontend/public`. No lo sirve static middleware. Path interno + `assertValidObjectKey`.

## MIME validation

`MIME_VALIDATION_LEVEL = header+extension+magic_where_available`

1. MIME declarado en allowlist
2. Extensión allowlist coherente con ese MIME
3. Magic bytes si el detector CURRENT/`sniffMime` + OLE/ZIP/SVG los reconoce

Office OOXML (docx/xlsx/pptx): magic ZIP + MIME declarado de Office. No se admite `application/zip`.
Office OLE (doc/xls/ppt): magic `D0 CF 11 E0` + MIME OLE.
No se afirma verificación profunda del interior de ZIP/OLE.

## File types allowed

PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV, JPEG, PNG, WEBP, SVG.

Prohibidos: EXE, DMG, PKG, BAT, CMD, PS1, JS, HTML, PHP, SH, JAR, ZIP, MP4.

MP4 y ZIP quedan fuera: 20 MB no justifica vídeo y ZIP es contenedor activo. Range/streaming de vídeo no está implementado.

## Max size

20 MB (`20971520`). Límite de backend (busboy `fileSize` + comprobación posterior). 0 bytes → `DOCUMENT_INVALID`.

## Checksum

SHA-256 del backend sobre los bytes reales. Nunca se acepta el hash del cliente. Se persiste solo tras `put` + confirmación.

## Storage status

`upload_status`: `PENDING` | `STORED` | `FAILED`

- `PENDING`: metadata sin bytes confirmados (`addDocumentMetadata` interno / tests)
- `STORED`: object confirmado
- `FAILED`: reservado; compensación que no puede borrar el object se registra en log `[WEB PROJECTS STORAGE] compensation failed`

`WEB_PROJECT_DOCUMENT_UPLOADED` solo con `STORED`.

## Scan status

`SCAN_NOT_AVAILABLE`. Nunca `CLEAN`. No hay antivirus. El archivo puede almacenarse y descargarse; la UI futura puede indicar ausencia de escaneo.

## Transaction / compensation

Postgres y el object store no son ACID conjunto.

1. Validar tenant / proyecto / RBAC
2. Generar id + key
3. Validar bytes / MIME / filename
4. SHA-256
5. `put` + `exists`
6. INSERT metadata + audit en transacción
7. Éxito

Si DB/audit falla después del `put`: `delete` compensatorio. Si el delete falla: log operativo, **no** se afirma éxito. Riesgo residual: object huérfano.

## Versioning / replace

Aplazado. Existe audit reservado `WEB_PROJECT_DOCUMENT_REPLACED`. No hay overwrite del object anterior. Un upload nuevo crea un `documentId` nuevo.

## Delete

Sin DELETE físico de cliente. Soft `DELETED` existía en FASE 1; no se expone endpoint de borrado en FASE 3.

## Auditoría — migración semántica

| Antes (FASE 1/2) | Ahora |
|---|---|
| `WEB_PROJECT_DOCUMENT_UPLOADED` al registrar metadata | `WEB_PROJECT_DOCUMENT_REGISTERED` |
| — | `WEB_PROJECT_DOCUMENT_UPLOADED` solo tras persistencia binaria confirmada |

## Credenciales

Solo estado. Nunca el secreto. FASE 3 no hace DLP sobre el binario.

## Errores usados

`VALIDATION_ERROR` `TENANT_REQUIRED` `FORBIDDEN` `NOT_FOUND` `INVALID_TRANSITION` `PROJECT_ARCHIVED` `INVALID_FORM_FIELD` `INVALID_FORM_VALUE` `UNSUPPORTED_ITEM_TYPE` `SECRET_REJECTED` `DOCUMENT_INVALID` `STORAGE_UNAVAILABLE`

## Multipart

Express 4 no incluye parser multipart. Dependencia: `busboy` (madura, streaming, límites). Superficie: parser de formularios; mitigada con `files: 1` y `fileSize: 20MB`. El store CURRENT recibe `Buffer` (no stream nativo), por eso se materializa hasta el límite.

## PATCH

Omitido = no tocar. `null` explícito = vaciar si el campo es nullable.

## Hostname

Se guarda hostname normalizado (`www.example.com`), no URL completa.

## Rollback de producción

No `DROP TABLE` con expedientes reales. Ver `008_web_projects_down.sql` y `009_web_project_document_storage_down.sql` (PRE-DATA only).
