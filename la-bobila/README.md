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

`/carta` es la ruta estable. `GET /` redirige ahí. `QR_PRODUCTION` no se genera: no hay dominio. El código de la lámina es `QR_DEV` y no se imprime como carta final.

Documentos: `docs/LA-BOBILA-MASTER-SPEC.md`, `docs/LA-BOBILA-DATA-MODEL.md`, `docs/LA-BOBILA-DESIGN-SYSTEM.md`, `docs/LA-BOBILA-DECISIONS.md`, `docs/LA-BOBILA-STATUS.md`.

No hay logo ni carta real en este repositorio. Los huecos dicen «Per confirmar». No rellenar precios, alérgenos, horario ni dirección sin pasarlos a `CONFIRMADO` con fuente.
