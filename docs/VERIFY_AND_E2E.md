# Verify, E2E y bloqueos de Next (`Another next build process is already running`)

## Causa habitual

Next solo permite **un `next build` activo** por árbol `.next`. El mensaje aparece cuando:

1. **Dos builds en paralelo**: por ejemplo `npm run verify` (incluye build del frontend) y a la vez `npm run test:e2e` en otra terminal; o un build anterior que sigue vivo.
2. **Lock residual**: proceso terminado mal dejando estado inconsistente en `.next` (menos frecuente).

Antes, Playwright arrancaba el servidor con `npm run build && next start` dentro de `webServer`, lo que podía solaparse con otro build si algo corría en paralelo.

## Orden recomendado (secuencial)

En la misma máquina, **no** mezcles builds en paralelo:

```bash
npm run verify
CI=1 npm run test:e2e
npm run build
```

`test:e2e` ejecuta **primero** `npm run build` y después Playwright; el `webServer` solo hace `next start` sobre el artefacto ya generado.

## Si el error persiste

- Cierra otros terminales con `next build` / `npm run verify` / servidores colgados en el puerto 3000.
- Como último recurso local: borrar `frontend/.next` y repetir el comando que falló (fuerza build limpio).

## Invocación sin script npm

Use siempre `npm run test:e2e`. Si ejecutas `playwright test` a mano, necesitas haber corrido antes `npm run build` y tener libre `127.0.0.1:3000`, o usar `reuseExistingServer` según tu flujo local.
