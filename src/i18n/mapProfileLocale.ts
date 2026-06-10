import type { MapProfileDef, MapProfileId, MapTerminology } from "../data/MapProfile";
import { t, type Locale } from "./locale";

const GALAXY_EN: MapTerminology = {
  nodeTab: "System",
  nodeEditor: "Node Editor",
  selectNodeEmpty: "Select a system on the map to edit it.",
  saveNode: "Save system",
  deleteNode: "Delete",
  nodeName: "Name",
  ownedBy: "Owned By",
  occupiedBy: "Occupied By",
  starType: "Star Type",
  description: "Description",
  capital: "Capital system (seat of government — one per owner)",
  population: "Population",
  size: "Size (economy / population weight)",
  installations: "Installations (map icons)",
  fleets: "Fleets (left of node)",
  fleetsToggle: "Fleets",
  background: "Galaxy background",
  placeNodesHint:
    "Left-click empty space to add a system. Middle-click or Space+drag pans the view.",
  timelineTitle: "Galaxy calendar",
  chronicleTitle: "Galaxy chronicle",
  routesTitle: "Hyperlane editor",
  routesHint:
    "Shift+click two systems to create a lane. Click a line on the map to edit it.",
  statsSummaryNode: "systems",
  statsSummaryConnection: "hyperlanes",
  exportFilename: "galaxy-map.json",
  mapProfileLabel: "Map profile",
};

const GALAXY_ES: MapTerminology = {
  nodeTab: "Sistema",
  nodeEditor: "Editor de nodo",
  selectNodeEmpty: "Selecciona un sistema en el mapa para editarlo.",
  saveNode: "Guardar sistema",
  deleteNode: "Eliminar",
  nodeName: "Nombre",
  ownedBy: "Dueño",
  occupiedBy: "Ocupado por",
  starType: "Tipo de estrella",
  description: "Descripción",
  capital: "Capital (sede de gobierno — una por facción)",
  population: "Población",
  size: "Tamaño (economía / peso poblacional)",
  installations: "Instalaciones (iconos en mapa)",
  fleets: "Flotas (a la izquierda del nodo)",
  fleetsToggle: "Flotas",
  background: "Fondo de galaxia",
  placeNodesHint:
    "Clic izquierdo en espacio vacío para añadir un sistema. Clic medio o Espacio+arrastrar mueve la cámara.",
  timelineTitle: "Calendario galáctico",
  chronicleTitle: "Crónica galáctica",
  routesTitle: "Editor de hipervías",
  routesHint:
    "Shift+clic en dos sistemas para crear una ruta. Clic en una línea del mapa para editarla.",
  statsSummaryNode: "sistemas",
  statsSummaryConnection: "hipervías",
  exportFilename: "galaxy-map.json",
  mapProfileLabel: "Perfil de mapa",
};

function terms(
  base: MapTerminology,
  patch: Partial<MapTerminology>,
): MapTerminology {
  return { ...base, ...patch };
}

const TERMS: Record<Locale, Record<MapProfileId, MapTerminology>> = {
  en: {
    galaxy: GALAXY_EN,
    fantasy: terms(GALAXY_EN, {
      nodeTab: "Region",
      nodeEditor: "Location Editor",
      selectNodeEmpty: "Select a location on the map to edit it.",
      saveNode: "Save location",
      ownedBy: "Controlled by",
      occupiedBy: "Occupied by",
      starType: "Terrain / biome",
      capital: "Capital (seat of power — one per faction)",
      installations: "Landmarks (map icons)",
      fleets: "Armies (left of node)",
      fleetsToggle: "Armies",
      background: "World map background",
      placeNodesHint:
        "Left-click empty space to add a location. Middle-click or Space+drag pans the view.",
      timelineTitle: "World calendar",
      chronicleTitle: "World chronicle",
      routesTitle: "Road / path editor",
      routesHint:
        "Shift+click two locations to connect them. Click a line on the map to edit it.",
      statsSummaryNode: "locations",
      statsSummaryConnection: "paths",
      exportFilename: "world-map.json",
    }),
    dnd: terms(GALAXY_EN, {
      nodeTab: "Location",
      nodeEditor: "Location Editor",
      selectNodeEmpty: "Select a location on the map to edit it.",
      saveNode: "Save location",
      ownedBy: "Faction",
      occupiedBy: "Contested by",
      starType: "Location type",
      capital: "Stronghold (faction HQ — one per faction)",
      population: "Population / size",
      installations: "POIs (tavern, dungeon…)",
      fleets: "Party / forces (left of node)",
      fleetsToggle: "Party",
      background: "Campaign map background",
      placeNodesHint:
        "Left-click empty space to add a location. Middle-click or Space+drag pans the view.",
      timelineTitle: "Campaign calendar",
      chronicleTitle: "Campaign chronicle",
      routesTitle: "Path editor",
      routesHint:
        "Shift+click two locations to link them. Click a line on the map to edit it.",
      statsSummaryNode: "locations",
      statsSummaryConnection: "paths",
      exportFilename: "campaign-map.json",
    }),
    adventure: terms(GALAXY_EN, {
      nodeTab: "Milestone",
      nodeEditor: "Milestone Editor",
      selectNodeEmpty: "Select a milestone on the map to edit it.",
      saveNode: "Save milestone",
      ownedBy: "Faction (optional)",
      starType: "Milestone type",
      capital: "Key milestone (optional highlight)",
      installations: "Icons (loot, trap, NPC…)",
      fleets: "Party marker (left of node)",
      fleetsToggle: "Party",
      background: "Adventure map background",
      placeNodesHint:
        "Left-click empty space to add a milestone. Use Play mode to test unlocks.",
      timelineTitle: "Campaign calendar",
      chronicleTitle: "Adventure log",
      routesTitle: "Path editor",
      routesHint:
        "Paths between milestones. Locked paths stay hidden in Play mode until unlocked.",
      statsSummaryNode: "milestones",
      statsSummaryConnection: "paths",
      exportFilename: "adventure-map.json",
    }),
  },
  es: {
    galaxy: GALAXY_ES,
    fantasy: terms(GALAXY_ES, {
      nodeTab: "Región",
      nodeEditor: "Editor de ubicación",
      selectNodeEmpty: "Selecciona una ubicación en el mapa para editarla.",
      saveNode: "Guardar ubicación",
      ownedBy: "Controlado por",
      occupiedBy: "Ocupado por",
      starType: "Terreno / bioma",
      capital: "Capital (sede de poder — una por facción)",
      installations: "Puntos de interés (iconos)",
      fleets: "Ejércitos (izquierda del nodo)",
      fleetsToggle: "Ejércitos",
      background: "Fondo del mundo",
      placeNodesHint:
        "Clic izquierdo en espacio vacío para añadir una ubicación. Clic medio o Espacio+arrastrar mueve la cámara.",
      timelineTitle: "Calendario del mundo",
      chronicleTitle: "Crónica del mundo",
      routesTitle: "Editor de caminos",
      routesHint:
        "Shift+clic en dos ubicaciones para conectarlas. Clic en una línea del mapa para editarla.",
      statsSummaryNode: "ubicaciones",
      statsSummaryConnection: "caminos",
      exportFilename: "world-map.json",
    }),
    dnd: terms(GALAXY_ES, {
      nodeTab: "Ubicación",
      nodeEditor: "Editor de ubicación",
      selectNodeEmpty: "Selecciona una ubicación en el mapa para editarla.",
      saveNode: "Guardar ubicación",
      ownedBy: "Facción",
      occupiedBy: "Disputado por",
      starType: "Tipo de ubicación",
      capital: "Fortaleza (HQ de facción — una por facción)",
      population: "Población / tamaño",
      installations: "POIs (taberna, dungeon…)",
      fleets: "Party / fuerzas (izquierda del nodo)",
      fleetsToggle: "Party",
      background: "Fondo de campaña",
      placeNodesHint:
        "Clic izquierdo en espacio vacío para añadir una ubicación. Clic medio o Espacio+arrastrar mueve la cámara.",
      timelineTitle: "Calendario de campaña",
      chronicleTitle: "Crónica de campaña",
      routesTitle: "Editor de caminos",
      routesHint:
        "Shift+clic en dos ubicaciones para enlazarlas. Clic en una línea del mapa para editarla.",
      statsSummaryNode: "ubicaciones",
      statsSummaryConnection: "caminos",
      exportFilename: "campaign-map.json",
    }),
    adventure: terms(GALAXY_ES, {
      nodeTab: "Hito",
      nodeEditor: "Editor de hito",
      selectNodeEmpty: "Selecciona un hito en el mapa para editarlo.",
      saveNode: "Guardar hito",
      ownedBy: "Facción (opcional)",
      starType: "Tipo de hito",
      capital: "Hito clave (resaltado opcional)",
      installations: "Iconos (loot, trampa, NPC…)",
      fleets: "Marcador de party (izquierda del nodo)",
      fleetsToggle: "Party",
      background: "Fondo de aventura",
      placeNodesHint:
        "Clic izquierdo en espacio vacío para añadir un hito. Usa Play mode para probar desbloqueos.",
      timelineTitle: "Calendario de campaña",
      chronicleTitle: "Log de aventura",
      routesTitle: "Editor de caminos",
      routesHint:
        "Caminos entre hitos. Rutas bloqueadas se ocultan en Play mode hasta desbloquear.",
      statsSummaryNode: "hitos",
      statsSummaryConnection: "caminos",
      exportFilename: "adventure-map.json",
    }),
  },
};

const PROFILE_LABEL_KEYS: Record<MapProfileId, "profile.galaxy" | "profile.fantasy" | "profile.dnd" | "profile.adventure"> = {
  galaxy: "profile.galaxy",
  fantasy: "profile.fantasy",
  dnd: "profile.dnd",
  adventure: "profile.adventure",
};

const PROFILE_DESC_KEYS: Record<MapProfileId, "profile.desc.galaxy" | "profile.desc.fantasy" | "profile.desc.dnd" | "profile.desc.adventure"> = {
  galaxy: "profile.desc.galaxy",
  fantasy: "profile.desc.fantasy",
  dnd: "profile.desc.dnd",
  adventure: "profile.desc.adventure",
};

export function getLocalizedMapProfile(id: MapProfileId, locale: Locale): MapProfileDef {
  return {
    id,
    label: t(PROFILE_LABEL_KEYS[id], locale),
    description: t(PROFILE_DESC_KEYS[id], locale),
    terms: TERMS[locale][id],
  };
}
