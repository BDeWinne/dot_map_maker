# Dot Map Maker

Editor de mapas nodales en el navegador: galaxias 4X, mundos fantasy, campañas de mesa y aventuras con desbloqueo por hitos. Construido con **Pixi.js** y **TypeScript**.

## Inicio rápido

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Verás la **galería de mapas** con presets de ejemplo o podés continuar el último mapa guardado en el navegador.

```bash
npm run build   # producción en dist/
```

## Qué puedes hacer

| Función | Descripción |
|---------|-------------|
| **Perfiles** | Galaxy, Fantasy, D&D, Adventure — cambian etiquetas sin borrar datos |
| **Nodos y rutas** | Clic vacío = nodo; Shift+clic = ruta entre dos nodos |
| **Timeline** | Eventos por año (colonización, conquista, flotas…) |
| **Facciones** | Dueños, colores, líderes con edad según año de vista |
| **Hitos** | Inicio, oculto, bloqueado, encuentros, recompensas (diseño) |
| **Play mode** | Progreso separado del diseño (`metadata.playProgress`) |
| **Niebla de guerra** | Nodos `hidden` invisibles en play hasta descubrirlos |
| **Búsqueda** | Campo en el HUD para localizar nodos por nombre/id |
| **Validación** | Detecta ids duplicados, rutas rotas, unlock refs inválidos |
| **Persistencia** | Auto-guardado en `localStorage` del navegador |
| **Export** | JSON completo, PNG de la vista, o solo progreso de play |

## Galería de presets (`test-presets/`)

| Preset | Muestra |
|--------|---------|
| `galaxy-preset.json` | Imperios, flotas, hipervías, timeline |
| `fantasy-preset.json` | Reinos, ejércitos, regiones |
| `dnd-preset.json` | Campaña de mesa con hitos |
| `adventure-preset.json` | Aventura lineal con desbloqueos |
| `timeline-wars-preset.json` | Guerra por años, scrubber, crónica |
| `trade-routes-preset.json` | Rutas que se abren/cierran por eventos |
| `rich-milestones-preset.json` | Varios encuentros y recompensas por nodo |
| `fog-of-war-preset.json` | Nodos ocultos y descubrimiento progresivo |

## Interfaz

- **HUD superior derecho** — perfil, Editor/Play, modo de clic, **búsqueda de nodos**
- **Panel de hitos** — diseño en Editor; progreso en Play (encuentros colapsables)
- **Sidebar** — sistema, mapa, facciones, timeline, crónica, rutas, stats, ayuda
- **Toggles inferiores** — iconos, textos, flotas, progreso de aventura
- **Año (arriba izquierda)** — navegar la timeline histórica

Todo guarda automáticamente salvo export/import explícito.

## Atajos (Editor)

| Atajo | Acción |
|-------|--------|
| **Ctrl+Z** | Deshacer |
| **Ctrl+Shift+Z / Ctrl+Y** | Rehacer |
| **Ctrl+C / Ctrl+V** | Copiar / pegar nodo |
| **Ctrl+D** | Duplicar nodo seleccionado |
| **F2** | Renombrar id del nodo |
| **Supr** | Borrar nodo o ruta seleccionada |
| **Shift+clic** | Crear ruta |
| **Clic medio en ruta** | Borrar ruta |
| **Rueda / Espacio+arrastrar** | Zoom y pan |

## Estructura del proyecto

```
src/
  boot.ts              # Espera DOM antes de cargar la app
  main.ts              # UI y eventos
  scene/GalaxyScene.ts # Mapa, nodos, rutas, fondo, play progress
  ui/                  # Paneles, HUD, galería de inicio
  data/                # Tipos, perfiles, persistencia, validación
  i18n/                # Español / English
test-presets/          # Mapas de ejemplo
```

## Formato JSON

El export incluye `systems`, `connections`, `owners`, `background` y `metadata`:

- `metadata.profile`, `defaultYear`, `viewYear`, `playMode`
- **`metadata.playProgress`** — progreso de partida (completados, encuentros hechos)
- **`systems[].adventure`** — solo diseño: `startNode`, `hidden`, `locked`, `unlockRequires`, `encounters[]` (sin flags de completado)

Podés exportar/importar solo el progreso con **Export play progress** en la pestaña Mapa.

## Licencia

Ver [LICENSE](LICENSE).
