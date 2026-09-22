# La Bòbila

Sistema de marca y carta, aislado del producto Argos IT.

La fuente única es `catalog/catalog.json`. La lámina no se edita a mano.

```bash
node la-bobila/print/render.mjs     # valida y escribe print/carta-a3.html
node la-bobila/mobile/render.mjs    # valida y escribe mobile/carta.html
node la-bobila/print/export.mjs     # HTML, PDF y PNG (Chrome del sistema)
node la-bobila/mobile/server.mjs    # http://127.0.0.1:4173/carta
node la-bobila/mobile/check.mjs     # comprobaciones automáticas, no sustituyen el QA de dispositivo
```

`CHROME_PATH` puede apuntar a otro binario compatible. `LA_BOBILA_PORT` cambia el puerto del servidor local; si cambia, hay que regenerar el QR_DEV. No se añade una dependencia al `package.json` de Argos.

```bash
node --test la-bobila/catalog/provenance.test.mjs
node --test la-bobila/print/production-guard.test.mjs
LA_BOBILA_BUILD=production node la-bobila/print/production-guard.mjs   # debe fallar: QR_DEV apunta a localhost
node la-bobila/print/export.mjs   # prototipo editorial y estudio de paleta
```

El prototipo es `print/renders/carta-a3-editorial-v1.pdf`. Lleva `PROVA / NO IMPRIMIR`. No es imprenta ni producción. `QR_PRODUCTION` sigue bloqueado.

`/carta` es la ruta estable. `GET /` redirige ahí. `QR_PRODUCTION` no se genera: no hay dominio. El código de la lámina es `QR_DEV` y no se imprime como carta final.

Documentos: `docs/LA-BOBILA-MASTER-SPEC.md`, `docs/LA-BOBILA-DATA-MODEL.md`, `docs/LA-BOBILA-DESIGN-SYSTEM.md`, `docs/LA-BOBILA-DECISIONS.md`, `docs/LA-BOBILA-STATUS.md`.

El logo y las dos cartas están en `source/` y no se editan. Los precios e ingredientes vigentes salen de la foto de la carta vigente tras doble contraste. Los huecos que la foto no cierra siguen en «Per confirmar». No hay alérgenos, horario ni dirección. `QR_PRODUCTION` sigue bloqueado.
