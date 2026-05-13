# Frames Chico / Dumbo — auditoría, plan y prompts de generación

Documento para dirección de arte y pipeline de assets. **No sustituye** los PNG actuales; los nuevos archivos complementan cuando existan en disco.

---

## 1. Auditoría de assets actuales

### Chico (`frontend/public/mascots/chico/`)

| Archivo | Dimensiones | RGBA | Uso en código (`spriteManifest.ts`) | Movimiento que representa |
|---------|-------------|------|-------------------------------------|---------------------------|
| `chico_esperando2.png` | 765×951 | sí | `idle`, `sit`, `active` | Espera / base |
| `chico_caminando.png` | 1443×791 | sí | `walk_01`, `walking` | Paso caminar |
| `chico_corriendo.png` | 1272×941 | sí | `walk_02` | Paso alterno / más dinámico |
| `chico_corriendofeliz.png` | 1272×941 | sí | `jump`, `playing` | Energía / juego |
| `chico_olfateando.png` | 1415×759 | sí | `turn`, `sniffing` | Olfato / giro |
| `chico_mirandoatento.png` | 870×943 | sí | `alert`, `guarding`, `looking`, `meeting` | Atención / guardia |
| `chico_reposo.png` | 1478×801 | sí | `lay`, `resting` | Reposación |
| `chico_durmiendo.png` | 1399×628 | sí | `sleep`, `sleeping` | Sueño |
| `chico_esperando.png` | 1215×1001 | sí | *(no referenciado en manifest)* | Variante espera — candidato referencia |

**Secuencia caminar actual:** solo **2** frames lógicos (`walk_01` ↔ `walk_02`). Saltos de tamaño entre canvas (p. ej. 765×951 vs 1443×791) contribuyen a sensación de “corte” si no se normaliza pie.

### Dumbo (`frontend/public/mascots/dumbo/`)

| Archivo | Dimensiones | RGBA | Uso en código (`spriteManifest.ts`) | Movimiento que representa |
|---------|-------------|------|-------------------------------------|---------------------------|
| `dumbo_frente.png` | 602×1271 | sí | `idle`, `active` | Frontal |
| `dumbo_caminando.png` | 1266×876 | sí | `walk_01`, `walking` | Paso 1 |
| `dumbo_caminando_2.png` | 1303×863 | sí | `walk_02` | Paso 2 |
| `dumbo_caminando_3.png` | 1307×897 | sí | `walk_03` | Paso 3 |
| `dumbo_turn.png` | 891×1235 | sí | `turn` | Giro |
| `dumbo_guide.png` | 1263×910 | sí | `guide`, `guiding` | Guía |
| `dumbo_esperando_atento.png` | 902×1227 | sí | `looking`, `waiting`, `meeting` | Espera atenta |
| `dumbo_vistacielo.png` | 925×1257 | sí | `look` | Mirada arriba (explainer) |
| `dumbo_sentado_atento.png` | 858×1196 | sí | `sit` | Sentado |
| `dumbo_relajado.png` | 1385×773 | sí | `lay`, `resting` | Relajado |
| `dumbo_jugando.png` | 1312×1030 | sí | `playing` | Juego |
| `dumbo_corriendofeliz.png` | 1269×860 | sí | `jump` | Carrera feliz |
| `dumbo_asustado.png` | 1355×932 | sí | `surprised` | Sorpresa |
| `dumbo_durmiendo.png` | 1402×614 | sí | `sleep` | Sueño |
| `dumbo_olfateando.png` | 1316×892 | sí | *(no en manifest)* | Olfato — referencia |
| `dumbo_olfateando2.png` | 1261×861 | sí | *(no en manifest)* | Olfato — referencia |

### Coherencia escala / alineación

- **Transparente:** todos los PNG analizados son **RGBA** (canal alpha disponible).
- **Canvas heterogéneo:** anchos entre ~602 y ~1478 px; altos entre ~614 y ~1271 px. Para **frames nuevos**, conviene **canvas unificado** y **pie anclado** (p. ej. misma línea de base / centro pelvis) para minimizar saltos al ciclar en el dock.
- **No redimensionar assets legacy** en esta entrega documental; solo **normalizar nuevos** respecto a referencias elegidas (`chico_caminando.png`, `dumbo_caminando.png`, etc.).

### Qué falta para continuidad (resumen)

| Área | Gap actual |
|------|------------|
| Caminar Chico | Solo 2 poses distintas; faltan intermedios de ciclo completo (4 pasos). |
| Caminar Dumbo | 3 pasos — mejor con cuarto paso simétrico. |
| Giros | Un solo “turn” genérico; faltan izquierda/derecha explícitos y micro-blends. |
| Miradas | `look`/`mirandoatento` mezclan roles; faltan “mirada usuario” / “mirada arriba” dedicadas para Chico. |
| Guardia / alerta | Una sola imagen para varios estados semánticos — falta segundo fotograma para respiración sutil. |
| Sniff Chico | Un frame — falta pareja para ciclo corto. |
| Juego | Una pose fuerte cada uno — falta segundo fotograma para loop corto. |
| Encuentro | Reutiliza poses genéricas — falta **meet** específico por personaje. |
| Dumbo “happy” / CTAs | No hay frames dedicados “feliz neutro” ni “señalar formulario/servicios” sin inventar UI en la escena (solo gesto). |

---

## 2. Frames nuevos solicitados (plan)

Los nombres siguen **minúsculas y guiones bajos**. Destino:

- Chico → `frontend/public/mascots/chico/`
- Dumbo → `frontend/public/mascots/dumbo/`

### Chico (18)

`chico_walk_01.png` … `chico_walk_04.png`, `chico_turn_left.png`, `chico_turn_right.png`, `chico_look_up.png`, `chico_look_user.png`, `chico_guard_01.png`, `chico_guard_02.png`, `chico_sniff_01.png`, `chico_sniff_02.png`, `chico_play_01.png`, `chico_play_02.png`, `chico_rest_01.png`, `chico_sleep_01.png`, `chico_alert_01.png`, `chico_meet_dumbo_01.png`.

### Dumbo (18)

`dumbo_walk_01.png` … `dumbo_walk_04.png`, `dumbo_turn_left.png`, `dumbo_turn_right.png`, `dumbo_guide_01.png`, `dumbo_guide_02.png`, `dumbo_look_user.png`, `dumbo_wait_01.png`, `dumbo_play_01.png`, `dumbo_play_02.png`, `dumbo_surprised_01.png`, `dumbo_rest_01.png`, `dumbo_meet_chico_01.png`, `dumbo_point_form_01.png`, `dumbo_point_services_01.png`, `dumbo_happy_01.png`.

**Nota de nomenclatura:** Ya existen `dumbo_caminando*.png`. Los nuevos `dumbo_walk_*` deben ser **fotogramas del ciclo expandido** o, si el equipo prefiere evitar duplicidad conceptual, renombrar en revisión artística manteniendo los archivos legacy intactos.

---

## 3. Prompt negativo global (para cualquier herramienta de imagen)

```
different breed, different dog, puppy substitute, cartoon redesign, flat corporate mascot redesign,
wrong proportions, extra limbs, cropped ears, wrong fur pattern, sunglasses, hats, collars added,
new accessories, weapons, UI mockup, text, watermark, logo redesign, background scene, gradient backdrop,
heavy drop shadow, rim light inconsistent with reference, motion blur smear, noise, jpeg artifacts,
low resolution, anthropomorphic hands, human posture, standing on two legs unless matching reference exactly,
different color palette, outline thickness change, another art style, 3D render look,
duplicate character, second dog, wolves, cats, foxes mixed breed
```

---

## 4. Prompt base (adaptar [POSE] y personaje)

```
Genera un frame PNG transparente del personaje [CHICO/DUMBO], manteniendo exactamente el mismo estilo visual,
proporciones, colores, línea, expresión general y diseño de las imágenes de referencia existentes en
frontend/public/mascots/[chico|dumbo]/ (usa principalmente [LISTA_REFERENCIA_ESPECÍFICA]).
El personaje debe estar en pose [DESCRIPCIÓN_POSE], mirando coherente con el encuadre frontal/lateral del set actual,
con fondo completamente transparente, bordes limpios anti-alias consistentes con los PNG existentes,
mismo tamaño relativo dentro del lienzo recomendado, misma estética corporativa de mascota digital ARGOS-IT,
sin texto, sin fondo, sin accesorios nuevos, sin cambiar raza ni identidad. Export PNG RGBA.
```

---

## 5. Prompts individuales (copiar/pegar por archivo)

Referencias sugeridas entre corchetes — sustituir por rutas al abrir en el tool.

### Chico

| Archivo | Pose / notas para [DESCRIPCIÓN_POSE] |
|---------|--------------------------------------|
| `chico_walk_01.png` | Paso caminar contacto inicial suelo; referencia peso en patas traseras; ref `[chico_caminando.png]` |
| `chico_walk_02.png` | Paso passthrough medio; ref interp entre `[chico_caminando.png]` y `[chico_corriendo.png]` |
| `chico_walk_03.png` | Paso elevación ligera pecho; coherente silueta mapache |
| `chico_walk_04.png` | Paso antes de cerrar ciclo; simetría respecto `_01` |
| `chico_turn_left.png` | Giro cabeza/hombros ~30° izquierda; ref `[chico_olfateando.png]` sin cambiar markings |
| `chico_turn_right.png` | Giro espejo derecha |
| `chico_look_up.png` | Cabeza alzada mirando arriba; ref attitude `[chico_mirandoatento.png]` pero inclinación vertical |
| `chico_look_user.png` | Mirada directa cámara/usuario; orejas alerta moderada |
| `chico_guard_01.png` | Postura vigilancia firme; micro diferencia respecto `_02` |
| `chico_guard_02.png` | Variante respiración/peso trasero |
| `chico_sniff_01.png` | Hocico bajo olfateando suelo |
| `chico_sniff_02.png` | Continuación ciclo corto olfato |
| `chico_play_01.png` | Juego bajo sin deformación; ref `[chico_corriendofeliz.png]` más cercano |
| `chico_play_02.png` | Contrapeso salto/play segundo fotograma |
| `chico_rest_01.png` | Reposición similar `[chico_reposo.png]` con micro variación piernas |
| `chico_sleep_01.png` | Dormido ojos cerrados coherente `[chico_durmiendo.png]` |
| `chico_alert_01.png` | Alerta alta sin duplicar guard exacto |
| `chico_meet_dumbo_01.png` | Postura encuentro social lateral suave (sin segundo personaje en canvas) |

### Dumbo

| Archivo | Pose / notas |
|---------|----------------|
| `dumbo_walk_01.png` | Paso alineado `[dumbo_caminando.png]` |
| `dumbo_walk_02.png` | Paso alineado `[dumbo_caminando_2.png]` |
| `dumbo_walk_03.png` | Paso alineado `[dumbo_caminando_3.png]` |
| `dumbo_walk_04.png` | Cuarto paso cerrando ciclo; referencia composición tres pasos existentes |
| `dumbo_turn_left.png` | Giro izquierda; ref `[dumbo_turn.png]` |
| `dumbo_turn_right.png` | Simetría derecha |
| `dumbo_guide_01.png` | Postura guía 1; ref `[dumbo_guide.png]` |
| `dumbo_guide_02.png` | Variante guía mano/hocico dirección sin texto |
| `dumbo_look_user.png` | Contacto visual usuario; ref `[dumbo_esperando_atento.png]` |
| `dumbo_wait_01.png` | Espera pacífica distinta de sitting |
| `dumbo_play_01.png` | Juego base `[dumbo_jugando.png]` |
| `dumbo_play_02.png` | Segundo fotograma juego |
| `dumbo_surprised_01.png` | Sorpresa ligera sin copiar exacto `[dumbo_asustado.png]` si se busca micro-loop |
| `dumbo_rest_01.png` | Reposo `[dumbo_relajado.png]` variante |
| `dumbo_meet_chico_01.png` | Encuentro orientación lateral |
| `dumbo_point_form_01.png` | Gestualidad “invitar contacto” sin dibujar formulario |
| `dumbo_point_services_01.png` | Gestualidad “servicios” dirección lateral |
| `dumbo_happy_01.png` | Felicidad contenida coherente `[dumbo_corriendofeliz.png]` menos extrema |

---

## 6. Exportación recomendada

- **Formato:** PNG **RGBA**, fondo transparente real (alpha sin halo sucio).
- **Tamaño lienzo nuevo (recomendado):** **1400×1000 px** (workspace único por especie), personaje ocupando ~85–92 % alto útil; **pie en misma coordenada Y** entre frames del mismo ciclo.
- **Chico referencia horizontal:** usar como guía composición los anchos ~1260–1480 px de poses ya existentes.
- **Dumbo referencia vertical:** muchas poses altas (~1200 px); mantener **altura cabeza consistente** entre walk frames.
- **Peso archivo:** objetivo web `< 350 KB` por frame tras optimización (`pngquant`/`oxipng`) sin pérdida visual perceptible.

---

## 7. Validación antes de producción

1. Abrir nuevo PNG junto a referencia en misma vista 100 % — comparar orejas, máscara facial, patas.
2. Blink rápido entre frames del ciclo — no debe haber **salto de silueta** ni cambio volumétrico brusco.
3. Superponer dos PNG con **difference blend** en editor — minimizar diferencias fuera de pose esperada.
4. Comprobar alpha en esquinas del pelo — sin halo blanco/negro.
5. Cargar en Next `<Image>` temporal en página dev — sin 404 ni warnings fuertes.

---

## 8. Integración técnica (cuando los archivos existan)

**No añadir rutas** en `spriteManifest.ts` hasta que cada PNG exista en `public/` (evita roturas).

### Paso A — Extender tipos y registros

1. Ampliar `ChicoSpriteState` / `DumboSpriteState` con claves por fotograma **sin romper** las existentes (`idle`, `walk_01`, … usadas por explainer).
2. Añadir entradas en `chicoSprites` / `dumboSprites` apuntando a `/mascots/.../nombre.png`.

### Paso B — Secuencias en `spriteManifest.ts`

Ejemplo de grupos exportados (implementar cuando assets listos):

```typescript
export const chicoWalkCycleExpanded = ["chico_walk_01", "chico_walk_02", "chico_walk_03", "chico_walk_04"] as const;
export const dumboWalkCycleExpanded = ["dumbo_walk_01", "dumbo_walk_02", "dumbo_walk_03", "dumbo_walk_04"] as const;
```

Los valores deben ser **claves válidas** del `Record` o paths consistentes con el tipo actual.

### Paso C — `spriteAnimator.ts`

- Ampliar `walkFrames.chico` / `walkFrames.dumbo` para usar las nuevas secuencias expandidas **o**
- Mantener legacy para explainer y añadir `dockWalkFrames` solo para `ChicoDumboSpriteSystem`.

**Explainer:** las escenas siguen usando `walk_01`, `walk_02`, … — no eliminar esas claves.

### Paso D — `useMascotController.ts`

- Opcional: mapear estados semánticos `walking` / `guiding` / … a los nuevos ciclos multi-frame si existen keys dedicadas.

---

## 9. Continuidad esperada tras integración

- **Ciclos más largos** reducen percepción de “slideshow”.
- **Canvas y baseline unificados** en frames nuevos eliminan jitter geométrico.
- **Pares guard/sniff/play** permiten loops de **respiración** y micro-acción sin disparar GSAP extra.

---

## 10. Generación automática desde Cursor

**No se han generado PNG en esta sesión** (sin pipeline de imagen acoplado al repo). Este archivo cumple el paso **QUINTO** del briefing: prompts listos para herramienta externa (Midjourney, SDXL + img2img fuerte sobre referencias, Photoshop timeline export, etc.).

---

## Checklist QA código (tras futuros cambios TS)

Cuando se integren rutas nuevas en código:

```bash
npm run verify
CI=1 npm run test:e2e
npm run build
```

*(Sin cambios en TS del proyecto en esta entrega documental — QA debe seguir pasando igual.)*
