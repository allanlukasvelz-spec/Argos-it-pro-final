# La Bòbila

Sistema de marca y carta, aislado del producto Argos IT.

La fuente única es `catalog/catalog.json`. La lámina no se edita a mano.

```bash
node la-bobila/print/render.mjs    # valida y escribe print/carta-a3.html
node la-bobila/print/export.mjs    # HTML, PDF y PNG (Chrome del sistema)
```

`CHROME_PATH` puede apuntar a otro binario compatible. Hace falta el protocolo de depuración de Chrome; no se añade una dependencia al `package.json` de Argos.

Documentos: `docs/LA-BOBILA-MASTER-SPEC.md`, `docs/LA-BOBILA-DATA-MODEL.md`, `docs/LA-BOBILA-DESIGN-SYSTEM.md`, `docs/LA-BOBILA-DECISIONS.md`, `docs/LA-BOBILA-STATUS.md`.

No hay logo ni carta real en este repositorio. Los huecos dicen «Per confirmar». No rellenar precios, alérgenos, horario ni dirección sin pasarlos a `CONFIRMADO` con fuente.
