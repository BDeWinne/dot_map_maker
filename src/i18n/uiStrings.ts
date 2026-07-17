export type UiStringKey = keyof typeof UI_STRINGS;

type L10n = { es: string; en: string };

export const UI_STRINGS = {
  "locale.es": { es: "Español", en: "Español" },
  "locale.en": { es: "English", en: "English" },
  "locale.label": { es: "Idioma", en: "Language" },

  "toggle.icons": { es: "Iconos", en: "Icons" },
  "toggle.labels": { es: "Textos", en: "Labels" },
  "toggle.progress": { es: "Progreso", en: "Progress" },
  "toggle.mapAria": { es: "Visibilidad en el mapa", en: "Map visibility" },
  "year.scrubberAria": { es: "Año del mapa", en: "Map year" },
  "year.prev": { es: "Año anterior", en: "Previous year" },
  "year.next": { es: "Año siguiente", en: "Next year" },
  "year.change": { es: "Cambiar año", en: "Change year" },
  "year.prompt": { es: "Año a visualizar", en: "Year to display" },
  "year.historicalTitle": {
    es: "Vista histórica · presente: año {present}",
    en: "Historical view · present: year {present}",
  },
  "year.presentTitle": {
    es: "Vista presente (año {present})",
    en: "Present view (year {present})",
  },

  "tab.map": { es: "Mapa", en: "Map" },
  "tab.owners": { es: "Facciones", en: "Owners" },
  "tab.timeline": { es: "Timeline", en: "Timeline" },
  "tab.chronicle": { es: "Crónica", en: "Chronicle" },
  "tab.routes": { es: "Rutas", en: "Routes" },
  "tab.stats": { es: "Stats", en: "Stats" },
  "tab.help": { es: "Ayuda", en: "Help" },

  "system.popHint": {
    es: "Puntos = miles (300.000). También 12M, 30 B, ~30 mil millones al importar.",
    en: "Dots = thousands (300,000). Also 12M, 30 B, ~30 billion when importing.",
  },
  "system.facilitiesHint": {
    es: "Iconos sobre el nodo en el mapa. Abajo a la izquierda: mostrar/ocultar iconos y textos.",
    en: "Icons above the node on the map. Bottom-left toggles show/hide icons and labels.",
  },
  "system.fleetsHint": {
    es: "Nave + número por imperio (color del dueño). «+ Añadir flota» usa el dueño del nodo. El año de vista y la timeline también cambian las flotas visibles.",
    en: "Ship + count per empire (owner color). «+ Add fleet» uses the node owner. View year and timeline also affect visible fleets.",
  },
  "system.addFleet": { es: "+ Añadir flota", en: "+ Add fleet" },
  "system.descPlaceholder": {
    es: "Descripción del sistema…",
    en: "System description…",
  },
  "system.occupiedHint": {
    es: "Ocupado: el dueño legal se mantiene; rayas rojas = ocupante militar.",
    en: "Occupied: legal owner stays; red stripes = military occupier.",
  },

  "adventure.title": { es: "Aventura / progresión", en: "Adventure / progression" },
  "adventure.hint": {
    es: "Reglas de desbloqueo opcionales. Usa <strong>Play mode</strong> (pestaña Mapa) para probar.",
    en: "Optional unlock rules. Use <strong>Play mode</strong> (Map tab) to test.",
  },
  "adventure.start": { es: "Inicio", en: "Start" },
  "adventure.hidden": { es: "Oculto", en: "Hidden" },
  "adventure.locked": { es: "Bloq.", en: "Locked" },
  "adventure.completed": { es: "Hecho", en: "Done" },
  "adventure.requires": {
    es: "Desbloqueo (ids)",
    en: "Unlock (ids)",
  },
  "adventure.requiresHint": {
    es: "Si está vacío y bloqueado: se desbloquea cuando un vecino conectado está completado.",
    en: "If empty and locked: unlocks when a connected neighbor is completed.",
  },
  "adventure.encounter": { es: "Encuentro", en: "Encounter" },
  "adventure.encounterPh": {
    es: "Combate, puzzle, escena social…",
    en: "Combat, puzzle, social scene…",
  },
  "adventure.reward": { es: "Recompensa / resultado", en: "Reward / outcome" },
  "adventure.rewardPh": { es: "Loot, lore, notas de XP…", en: "Loot, lore, XP notes…" },
  "adventure.requiresPh": { es: "nodo_a, nodo_b", en: "node_a, node_b" },

  "owners.title": { es: "Editor de facciones", en: "Owner editor" },
  "owners.hint": {
    es: "Facciones en el mapa: color, nombre y etiqueta corta (labels y stats).",
    en: "Factions on the map: color, name, and short tag (labels & stats).",
  },
  "owners.edit": { es: "Editar facción", en: "Edit owner" },
  "owners.id": { es: "Id (clave única)", en: "Id (unique key)" },
  "owners.name": { es: "Nombre", en: "Name" },
  "owners.short": { es: "Etiqueta corta", en: "Short tag" },
  "owners.color": { es: "Color", en: "Color" },
  "owners.leader": { es: "Líder", en: "Leader" },
  "owners.leaderHint": {
    es: "Gobernante o jefe de gobierno (lore / narrativa).",
    en: "Ruler or head of government (lore / narrative).",
  },
  "owners.leaderName": { es: "Nombre del líder", en: "Leader name" },
  "owners.leaderAge": { es: "Edad", en: "Age" },
  "owners.leaderAgeHint": { es: "(en el año de vista)", en: "(at view year)" },
  "owners.leaderPersonality": { es: "Personalidad", en: "Personality" },
  "owners.save": { es: "Guardar facción", en: "Save owner" },
  "owners.new": { es: "Nueva facción", en: "New owner" },
  "owners.delete": { es: "Eliminar facción", en: "Delete owner" },
  "owners.file": { es: "Archivo de facciones", en: "Owners file" },
  "owners.export": { es: "Exportar owners JSON", en: "Export owners JSON" },
  "owners.import": { es: "Importar owners JSON", en: "Import owners JSON" },
  "owners.reset": { es: "Restaurar valores por defecto", en: "Reset to defaults" },
  "owners.empty": { es: "No hay facciones definidas.", en: "No owners defined." },
  "owners.defaultMeta": { es: "por defecto", en: "default" },

  "map.title": { es: "Controles del mapa", en: "Map Controls" },
  "map.calendar": { es: "Calendario", en: "Calendar" },
  "map.epoch": { es: "Época / era", en: "Epoch / era name" },
  "map.epochPh": { es: "p. ej. Era Imperial", en: "e.g. Imperial Era" },
  "map.defaultYear": { es: "Año por defecto", en: "Default year" },
  "map.defaultYearHint": {
    es: "Para eventos nuevos y edad del líder. Se guarda en <code>metadata.defaultYear</code>.",
    en: "For new events and leader age. Saved in <code>metadata.defaultYear</code>.",
  },
  "map.setViewDefault": { es: "Poner año de vista al default", en: "Set view year to default" },
  "map.playMode": {
    es: "Play mode (probar desbloqueos — nodos locked no se pueden seleccionar)",
    en: "Play mode (test unlocks — locked nodes cannot be selected)",
  },

  "hud.profile": { es: "Perfil", en: "Profile" },
  "hud.mode": { es: "Modo", en: "Mode" },
  "hud.modePlay": { es: "Play", en: "Play" },
  "hud.modeEditor": { es: "Editor", en: "Editor" },

  "search.placeholder": {
    es: "Buscar nodo por nombre o id…",
    en: "Search node by name or id…",
  },
  "search.noResults": {
    es: "Sin coincidencias",
    en: "No matches",
  },

  "validation.title": { es: "Validación del mapa", en: "Map validation" },
  "validation.hint": {
    es: "Comprueba ids, rutas, referencias de desbloqueo y capitales.",
    en: "Checks IDs, routes, unlock refs, and capitals.",
  },
  "validation.run": { es: "Validar mapa", en: "Validate map" },
  "validation.ok": { es: "Sin problemas detectados", en: "No issues found" },
  "validation.summary": {
    es: "{errors} errores · {warnings} avisos",
    en: "{errors} errors · {warnings} warnings",
  },
  "validation.jump": { es: "Ir", en: "Go" },
  "validation.duplicateId": {
    es: "Id duplicado: {id} ({count}×)",
    en: "Duplicate id: {id} ({count}×)",
  },
  "validation.emptyName": {
    es: "Nodo sin nombre: {id}",
    en: "Node without name: {id}",
  },
  "validation.missingFrom": {
    es: "Ruta {conn}: origen inexistente ({id})",
    en: "Route {conn}: missing from node ({id})",
  },
  "validation.missingTo": {
    es: "Ruta {conn}: destino inexistente ({id})",
    en: "Route {conn}: missing to node ({id})",
  },
  "validation.duplicateConn": {
    es: "Id de ruta duplicado: {id} ({count}×)",
    en: "Duplicate route id: {id} ({count}×)",
  },
  "validation.badUnlockRef": {
    es: "Nodo {node}: unlockRequires apunta a {ref} (no existe)",
    en: "Node {node}: unlockRequires references {ref} (missing)",
  },
  "validation.multiCapital": {
    es: "Facción {owner}: varias capitales ({ids})",
    en: "Owner {owner}: multiple capitals ({ids})",
  },
  "validation.orphanNode": {
    es: "Nodo sin conexiones: {id}",
    en: "Node with no connections: {id}",
  },

  "play.reset": { es: "Resetear progreso de play", en: "Reset play progress" },
  "play.resetConfirm": {
    es: "¿Borrar todo el progreso de play mode? El diseño del mapa no cambia.",
    en: "Clear all play mode progress? Map design is unchanged.",
  },
  "play.export": { es: "Exportar progreso de play", en: "Export play progress" },
  "play.import": { es: "Importar progreso de play", en: "Import play progress" },
  "play.importOk": {
    es: "Progreso de play importado.",
    en: "Play progress imported.",
  },

  "system.nodeId": { es: "Id (clave única)", en: "Id (unique key)" },
  "system.nodeIdPh": { es: "nodo_alpha", en: "node_alpha" },
  "system.nodeIdHint": {
    es: "F2 para renombrar. Actualiza rutas y referencias de desbloqueo.",
    en: "F2 to rename. Updates routes and unlock references.",
  },

  "milestone.playModeHint": {
    es: "Modo play — solo marcar progreso. Cambia a Editor para editar el mapa.",
    en: "Play mode — mark progress only. Switch to Editor to change the map.",
  },
  "milestone.completeTitle": {
    es: "Hito completado",
    en: "Milestone completed",
  },
  "milestone.completeHint": {
    es: "Marca el nodo como superado en play mode y desbloquea vecinos",
    en: "Marks this node as cleared in play mode and unlocks neighbors",
  },
  "milestone.encountersTitle": { es: "Encuentros", en: "Encounters" },
  "milestone.addEncounter": { es: "+ Añadir", en: "+ Add" },
  "milestone.noEncounters": {
    es: "Sin encuentros — añade uno para esta escena.",
    en: "No encounters — add one for this scene.",
  },
  "milestone.newEncounter": { es: "Nuevo encuentro", en: "New encounter" },
  "milestone.encounterTitlePh": { es: "Título del encuentro", en: "Encounter title" },
  "milestone.encounterDescPh": {
    es: "Combate, puzzle, social, notas de DM…",
    en: "Combat, puzzle, social, DM notes…",
  },
  "milestone.encounterDone": { es: "Hecho", en: "Done" },
  "milestone.encounterDoneHint": {
    es: "Marca este encuentro como superado en play mode",
    en: "Mark this encounter cleared in play mode",
  },
  "milestone.gmNotesPh": {
    es: "Notas de GM (ocultas en play mode)…",
    en: "GM notes (hidden in play mode)…",
  },
  "milestone.encountersProgress": {
    es: "Encuentros: {done} / {total}",
    en: "Encounters: {done} / {total}",
  },
  "milestone.allEncountersDone": {
    es: "Todos los encuentros completados — el hito se marca automáticamente.",
    en: "All encounters done — milestone auto-completes.",
  },
  "milestone.removeEncounter": { es: "Quitar encuentro", en: "Remove encounter" },
  "milestone.kindAny": { es: "Tipo…", en: "Kind…" },
  "milestone.kind.combat": { es: "Combate", en: "Combat" },
  "milestone.kind.social": { es: "Social", en: "Social" },
  "milestone.kind.puzzle": { es: "Puzzle", en: "Puzzle" },
  "milestone.kind.exploration": { es: "Exploración", en: "Exploration" },
  "milestone.kind.other": { es: "Otro", en: "Other" },
  "milestone.rewards": { es: "Recompensas", en: "Rewards" },
  "milestone.addReward": { es: "+ Recompensa", en: "+ Reward" },
  "milestone.rewardLabelPh": { es: "Loot, XP, llave…", en: "Loot, XP, key…" },
  "milestone.rewardNotesPh": { es: "Notas (opcional)", en: "Notes (optional)" },
  "map.legend": { es: "Leyenda de iconos", en: "Installation icon legend" },
  "map.chooseBg": { es: "Elegir imagen…", en: "Choose image..." },
  "map.clearBg": { es: "Quitar fondo", en: "Remove background" },
  "map.bgOpacity": { es: "Opacidad del fondo", en: "Background opacity" },
  "map.clickMode": { es: "Modo de clic", en: "Click mode" },
  "map.clickEdit": { es: "Colocar nodos", en: "Place nodes" },
  "map.clickMoveBg": { es: "Mover fondo", en: "Move background" },
  "map.clickMoveNodes": { es: "Mover todos los nodos", en: "Move all nodes" },
  "map.export": { es: "Exportar", en: "Export" },
  "map.exportJson": { es: "Exportar JSON", en: "Export JSON" },
  "map.exportPng": { es: "Exportar PNG (vista)", en: "Export PNG (view)" },
  "map.importJson": { es: "Importar JSON", en: "Import JSON" },
  "map.importLoading": { es: "Cargando…", en: "Loading…" },
  "map.importOk": { es: "Cargados {n} sistemas.", en: "Loaded {n} systems." },
  "map.importInvalid": { es: "JSON de mapa inválido (ver consola).", en: "Invalid map JSON (see console)." },
  "map.importBadJson": { es: "Archivo JSON inválido.", en: "Invalid JSON file." },
  "map.importReadFail": { es: "No se pudo leer el archivo.", en: "Could not read file." },
  "map.importEmpty": { es: "Archivo vacío.", en: "Empty file." },
  "map.exportPngBusy": { es: "Exportando PNG…", en: "Exporting PNG…" },
  "map.exportPngOk": { es: "PNG exportado.", en: "PNG exported." },
  "map.exportPngFail": { es: "Falló la exportación PNG.", en: "PNG export failed." },

  "timeline.defaultYearHint": {
    es: "Igual que Mapa → Calendario. El import restaura <code>metadata.defaultYear</code> si existe.",
    en: "Same as Map → Calendar. Import restores <code>metadata.defaultYear</code> when present.",
  },
  "timeline.systemTitle": { es: "Timeline del sistema", en: "System timeline" },
  "timeline.hint": {
    es: "Eventos ≤ año de vista cambian el mapa. <strong>Colonized</strong> = aparece; <strong>Owner change</strong> = conquista; <strong>Abandoned</strong> = oculto.",
    en: "Events ≤ view year change the map. <strong>Colonized</strong> = appears; <strong>Owner change</strong> = conquest; <strong>Abandoned</strong> = hidden.",
  },
  "timeline.systemLabel": { es: "Sistema:", en: "System:" },
  "timeline.noSystem": {
    es: "Selecciona un sistema para añadir eventos históricos.",
    en: "Select a system to add historical events.",
  },
  "timeline.addEvent": { es: "Añadir / editar evento", en: "Add / edit event" },
  "timeline.year": { es: "Año", en: "Year" },
  "timeline.eventType": { es: "Tipo de evento", en: "Event type" },
  "timeline.actor": { es: "Actor (quién)", en: "Actor (who)" },
  "timeline.title": { es: "Título", en: "Title" },
  "timeline.titlePh": { es: "Batalla de…", en: "Battle of ..." },
  "timeline.description": { es: "Descripción", en: "Description" },
  "timeline.population": { es: "Población", en: "Population" },
  "timeline.fleets": { es: "Flotas", en: "Fleets" },
  "timeline.fleetChangeHint": {
    es: "Tipo <strong>Fleet change</strong>: dueño + cantidad abajo.",
    en: "Type <strong>Fleet change</strong>: owner + count below.",
  },
  "timeline.destSystem": { es: "Sistema destino", en: "Destination system" },
  "timeline.fleetCount": { es: "Cantidad de flotas", en: "Fleet count" },
  "timeline.fleetMoveHint": {
    es: "Tipo <strong>Fleet movement</strong>: mueve flotas al destino. Actor = imperio.",
    en: "Type <strong>Fleet movement</strong>: moves fleets to destination. Actor = empire.",
  },
  "timeline.economy": { es: "Economía", en: "Economy" },
  "timeline.economyPh": { es: "Hub comercial, recesión…", en: "Trade hub, recession..." },
  "timeline.minerals": { es: "Minerales / recursos", en: "Minerals / resources" },
  "timeline.flavor": { es: "Notas / flavor", en: "Flavor / notes" },
  "timeline.saveEvent": { es: "Guardar evento", en: "Save event" },
  "timeline.clearForm": { es: "Limpiar formulario", en: "Clear form" },
  "timeline.noEvents": { es: "Sin eventos en este sistema.", en: "No events for this system yet." },

  "chronicle.hint": {
    es: "Todos los eventos de sistemas y rutas, por año. Clic en una entrada salta a ese año.",
    en: "All system and route events, sorted by year. Click an entry to jump to that year.",
  },
  "chronicle.limitYear": { es: "Solo eventos ≤ año de vista", en: "Only events ≤ view year" },
  "chronicle.filterActor": { es: "Filtrar por actor", en: "Filter by actor" },
  "chronicle.filterType": { es: "Filtrar por tipo", en: "Filter by type" },
  "chronicle.search": { es: "Buscar", en: "Search" },
  "chronicle.searchPh": { es: "Título, sistema, ruta…", en: "Title, system, route..." },
  "chronicle.allActors": { es: "Todos los actores", en: "All actors" },
  "chronicle.allTypes": { es: "Todos los tipos", en: "All types" },
  "chronicle.empty": { es: "Ningún evento coincide con los filtros.", en: "No events match the filters." },

  "routes.empty": { es: "Selecciona una ruta en el mapa.", en: "Select a route on the map." },
  "routes.routeLabel": { es: "Ruta:", en: "Route:" },
  "routes.name": { es: "Nombre (opcional)", en: "Name (optional)" },
  "routes.namePh": { es: "Corredor Solar — Wolf", en: "Solar — Wolf corridor" },
  "routes.type": { es: "Tipo de ruta", en: "Route type" },
  "routes.save": { es: "Guardar ruta", en: "Save route" },
  "routes.timeline": { es: "Timeline de ruta", en: "Route timeline" },
  "routes.timelineHint": {
    es: "Abrir / cerrar la ruta en un año (afecta el mapa en el año de vista).",
    en: "Open / close the route at a given year (affects map at view year).",
  },
  "routes.addEvent": { es: "Añadir / editar evento de ruta", en: "Add / edit route event" },
  "routes.saveEvent": { es: "Guardar evento de ruta", en: "Save route event" },
  "routes.noEvents": { es: "Sin eventos de ruta aún.", en: "No route events yet." },

  "stats.title": { es: "Por facción", en: "By owner" },
  "stats.hint": { es: "Resumen en vivo de todos los sistemas del mapa.", en: "Live summary from all systems on the map." },
  "stats.empty": { es: "Aún no hay sistemas con dueño.", en: "No owned systems yet." },
  "stats.hintOcc": {
    es: "Dueño legal ≠ control militar. Tamaño ≈ peso económico / población.",
    en: "Legal owner ≠ military control. Size ≈ economy / population weight.",
  },
  "stats.leader": { es: "Líder", en: "Leader" },
  "stats.owned": { es: "Controlados", en: "Owned" },
  "stats.capital": { es: "Capital", en: "Capital" },
  "stats.population": { es: "Población", en: "Population" },
  "stats.major": { es: "Mayores (tamaño)", en: "Major (size)" },
  "stats.lost": { es: "Perdidos", en: "Lost to enemy" },
  "stats.holding": { es: "Ocupando", en: "Holding (occ.)" },
  "stats.occupying": { es: "Ocupando", en: "Occupying" },
  "stats.timeline": { es: "Timeline", en: "Timeline" },

  "help.title": { es: "Ayuda", en: "Help" },

  "editMode.edit": {
    es: "Clic izquierdo en espacio vacío para añadir un nodo. Clic medio o Espacio+arrastrar para mover la cámara.",
    en: "Left-click empty space to add a node. Middle-click or Space+drag pans the view.",
  },
  "editMode.moveBg": {
    es: "Arrastrar con clic izquierdo mueve solo la imagen de fondo (no la cámara).",
    en: "Left-click drag moves only the background image (not the camera).",
  },
  "editMode.moveNodes": {
    es: "Arrastrar con clic izquierdo mueve todos los nodos juntos (no la cámara).",
    en: "Left-click drag moves all nodes together (not the camera).",
  },

  "profile.galaxy": { es: "Galaxia / sci-fi", en: "Galaxy / sci-fi" },
  "profile.fantasy": { es: "Mundo fantasy", en: "Fantasy world" },
  "profile.dnd": { es: "Mesa / D&D", en: "Tabletop / D&D" },
  "profile.adventure": { es: "Aventura / desbloqueo", en: "Adventure / unlock" },

  "profile.desc.galaxy": {
    es: "Sistemas estelares, imperios, hipervías, flotas.",
    en: "Star systems, empires, hyperlanes, fleets.",
  },
  "profile.desc.fantasy": {
    es: "Regiones, reinos, caminos, ejércitos.",
    en: "Regions, kingdoms, roads, armies.",
  },
  "profile.desc.dnd": {
    es: "Ubicaciones de campaña, facciones, caminos, party.",
    en: "Campaign locations, factions, paths, party.",
  },
  "profile.desc.adventure": {
    es: "Grafo de hitos con progresión, niebla y desbloqueos.",
    en: "Milestone graph with progression, fog, and unlocks.",
  },

  "common.edit": { es: "Editar", en: "Edit" },
  "common.delete": { es: "Borrar", en: "Delete" },

  "map.persistHint": {
    es: "Los cambios se guardan automáticamente en este navegador.",
    en: "Changes auto-save in this browser.",
  },
  "map.persisted": {
    es: "Mapa guardado automáticamente en este navegador.",
    en: "Map auto-saved in this browser.",
  },

  "startup.title": { es: "Dot Map Maker", en: "Dot Map Maker" },
  "startup.lead": {
    es: "Crea mapas de galaxia, mundos fantasy, campañas de mesa o aventuras por nodos.",
    en: "Create galaxy maps, fantasy worlds, tabletop campaigns, or node-based adventures.",
  },
  "startup.continue": { es: "Continuar último mapa", en: "Continue last map" },
  "startup.empty": { es: "Mapa vacío", en: "Empty map" },
  "startup.close": { es: "Cerrar", en: "Close" },
  "startup.emptyConfirm": {
    es: "¿Empezar un mapa vacío? Se borrará el guardado automático.",
    en: "Start an empty map? This clears the auto-saved map.",
  },
  "startup.openGallery": { es: "Galería de mapas", en: "Map gallery" },
  "startup.presetsTitle": { es: "Mapas de ejemplo", en: "Example maps" },
  "startup.presetsHint": {
    es: "Carga un preset para explorar funciones — timeline, rutas, play mode, hitos y más.",
    en: "Load a preset to explore features — timeline, routes, play mode, milestones, and more.",
  },
  "startup.loadPreset": { es: "Cargar", en: "Load" },

  "welcome.title": { es: "Bienvenido a Dot Map Maker", en: "Welcome to Dot Map Maker" },
  "welcome.subtitle": {
    es: "Guía rápida antes de elegir tu mapa",
    en: "Quick guide before you pick a map",
  },
  "welcome.continue": {
    es: "Entendido, elegir mapa",
    en: "Got it, choose a map",
  },
  "welcome.demoTitle": {
    es: "Demo de Dot Map Maker",
    en: "Dot Map Maker Demo",
  },
  "welcome.demoSubtitle": {
    es: "Leé esto primero — después elegís un mapa de ejemplo",
    en: "Read this first — then pick a sample map",
  },
  "welcome.demoContinue": {
    es: "Entendido, ver presets",
    en: "Got it, see presets",
  },

  "exitGuard.title": { es: "¿Salir del mapa?", en: "Leave the map?" },
  "exitGuard.lead": {
    es: "Si cerrás la pestaña podés perder cambios. El auto-guardado en este navegador no es 100% fiable (modo privado, borrar datos, otro dispositivo).",
    en: "If you close the tab you may lose changes. Browser auto-save is not 100% reliable (private mode, cleared data, another device).",
  },
  "exitGuard.tip": {
    es: "Recomendado: exportá el JSON antes de irte.",
    en: "Recommended: export the JSON before you leave.",
  },
  "exitGuard.export": { es: "Exportar JSON", en: "Export JSON" },
  "exitGuard.stay": { es: "Seguir editando", en: "Keep editing" },
  "exitGuard.leave": { es: "Salir igual", en: "Leave anyway" },

  "startup.continueHint": {
    es: "Restaura el último JSON guardado en localStorage de este navegador.",
    en: "Restores the last JSON saved in this browser's localStorage.",
  },
  "startup.continueUnavailable": {
    es: "No hay guardado en este navegador todavía.",
    en: "No save in this browser yet.",
  },
  "startup.continueFailed": {
    es: "No se pudo cargar el guardado (JSON dañado o incompleto). Probá cargar un preset o importar un export.",
    en: "Could not load the save (corrupt or incomplete JSON). Try a preset or import an export.",
  },

  "demo.banner": {
    es: "Modo demo — edición sin guardar",
    en: "Demo mode — edit without saving",
  },
  "demo.fullEditor": {
    es: "Editor completo",
    en: "Full editor",
  },
  "demo.switchMap": {
    es: "Cambiar mapa",
    en: "Switch map",
  },
  "demo.startupTitle": {
    es: "Dot Map Maker — Demo",
    en: "Dot Map Maker — Demo",
  },
  "demo.startupLead": {
    es: "Cargá un preset y editá a gusto: nodos, rutas, timeline, facciones. No se guarda en el navegador, no hay play mode ni import/export.",
    en: "Load a preset and edit freely: nodes, routes, timeline, factions. Nothing is saved in the browser — no play mode, import, or export.",
  },
  "demo.loadExplore": {
    es: "Probar",
    en: "Try it",
  },
  "demo.watermark": {
    es: "Cambios no se guardan",
    en: "Changes are not saved",
  },
  "demo.noSaveHint": {
    es: "Demo: podés editar, pero no se guarda ni se exporta. Al recargar se pierde todo.",
    en: "Demo: you can edit, but nothing is saved or exported. Reload clears everything.",
  },

  "preset.csh.title": { es: "Confederación Solar Humana", en: "Human Solar Confederation" },
  "preset.csh.desc": {
    es: "2200–2213: la humanidad unificada frente a los K'thrak. 8 sistemas, timeline completa y la caída de Wolf 359.",
    en: "2200–2213: unified humanity against the K'thrak. 8 systems, full timeline, and the fall of Wolf 359.",
  },
  "preset.galaxy.title": { es: "Guerra galáctica", en: "Galactic war" },
  "preset.galaxy.desc": {
    es: "4X sci-fi: imperios, flotas, hipervías y timeline histórica.",
    en: "Sci-fi 4X: empires, fleets, hyperlanes, and historical timeline.",
  },
  "preset.fantasy.title": { es: "Mundo fantasy", en: "Fantasy world" },
  "preset.fantasy.desc": {
    es: "Reinos, ejércitos y caminos con vocabulario de región.",
    en: "Kingdoms, armies, and paths with region vocabulary.",
  },
  "preset.dnd.title": { es: "Campaña D&D", en: "D&D campaign" },
  "preset.dnd.desc": {
    es: "Overworld de mesa con ubicaciones, facciones y hitos.",
    en: "Tabletop overworld with locations, factions, and milestones.",
  },
  "preset.adventure.title": { es: "Aventura por isla", en: "Island adventure" },
  "preset.adventure.desc": {
    es: "Grafo lineal de hitos con desbloqueos y encuentros.",
    en: "Linear milestone graph with unlocks and encounters.",
  },
  "preset.timelineWars.title": { es: "Guerra cronológica", en: "Timeline wars" },
  "preset.timelineWars.desc": {
    es: "Conquistas por año — prueba el scrubber y la crónica.",
    en: "Conquests by year — try the year scrubber and chronicle.",
  },
  "preset.tradeRoutes.title": { es: "Rutas comerciales", en: "Trade routes" },
  "preset.tradeRoutes.desc": {
    es: "Caminos que se abren y cierran según eventos de ruta.",
    en: "Paths that open and close via route timeline events.",
  },
  "preset.richMilestones.title": { es: "Hitos avanzados", en: "Rich milestones" },
  "preset.richMilestones.desc": {
    es: "Varios encuentros y recompensas por nodo — ideal para el HUD de hitos.",
    en: "Multiple encounters and rewards per node — great for the milestone HUD.",
  },
  "preset.fogOfWar.title": { es: "Niebla de guerra", en: "Fog of war" },
  "preset.fogOfWar.desc": {
    es: "Nodos ocultos hasta descubrirlos — prueba play mode y la búsqueda.",
    en: "Hidden nodes until discovered — try play mode and search.",
  },

  "preset.feat.timeline": { es: "Timeline", en: "Timeline" },
  "preset.feat.fleets": { es: "Flotas", en: "Fleets" },
  "preset.feat.owners": { es: "Facciones", en: "Factions" },
  "preset.feat.regions": { es: "Regiones", en: "Regions" },
  "preset.feat.armies": { es: "Ejércitos", en: "Armies" },
  "preset.feat.paths": { es: "Caminos", en: "Paths" },
  "preset.feat.locations": { es: "Ubicaciones", en: "Locations" },
  "preset.feat.play": { es: "Play mode", en: "Play mode" },
  "preset.feat.milestones": { es: "Hitos", en: "Milestones" },
  "preset.feat.unlock": { es: "Desbloqueo", en: "Unlock" },
  "preset.feat.encounters": { es: "Encuentros", en: "Encounters" },
  "preset.feat.yearScrub": { es: "Año de vista", en: "View year" },
  "preset.feat.chronicle": { es: "Crónica", en: "Chronicle" },
  "preset.feat.conquest": { es: "Conquista", en: "Conquest" },
  "preset.feat.routeEvents": { es: "Eventos de ruta", en: "Route events" },
  "preset.feat.routeTypes": { es: "Tipos de ruta", en: "Route types" },
  "preset.feat.stats": { es: "Estadísticas", en: "Stats" },
  "preset.feat.multiEncounter": { es: "Multi-encuentro", en: "Multi-encounter" },
  "preset.feat.rewards": { es: "Recompensas", en: "Rewards" },
  "preset.feat.milestoneHud": { es: "HUD de hitos", en: "Milestone HUD" },
  "preset.feat.fogOfWar": { es: "Niebla de guerra", en: "Fog of war" },
  "preset.feat.hiddenNodes": { es: "Nodos ocultos", en: "Hidden nodes" },

  "owners.autoSaveHint": {
    es: "Los cambios se guardan automáticamente.",
    en: "Changes save automatically.",
  },
  "timeline.autoSaveHint": {
    es: "Los eventos se guardan solos al rellenar el título.",
    en: "Events save automatically when the title is filled in.",
  },
  "routes.autoSaveHint": {
    es: "Los datos de la ruta se guardan automáticamente.",
    en: "Route data saves automatically.",
  },
  "routes.eventAutoSaveHint": {
    es: "Los eventos de ruta se guardan solos al rellenar el título.",
    en: "Route events save automatically when the title is filled in.",
  },
  "routes.delete": { es: "Borrar ruta", en: "Delete route" },
} as const satisfies Record<string, L10n>;
