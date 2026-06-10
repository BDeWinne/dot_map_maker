export type MapProfileId = "galaxy" | "fantasy" | "dnd" | "adventure";

export interface MapTerminology {
  nodeTab: string;
  nodeEditor: string;
  selectNodeEmpty: string;
  saveNode: string;
  deleteNode: string;
  nodeName: string;
  ownedBy: string;
  occupiedBy: string;
  starType: string;
  description: string;
  capital: string;
  population: string;
  size: string;
  installations: string;
  fleets: string;
  fleetsToggle: string;
  background: string;
  placeNodesHint: string;
  timelineTitle: string;
  chronicleTitle: string;
  routesTitle: string;
  routesHint: string;
  statsSummaryNode: string;
  statsSummaryConnection: string;
  exportFilename: string;
  mapProfileLabel: string;
}

export interface MapProfileDef {
  id: MapProfileId;
  label: string;
  description: string;
  terms: MapTerminology;
}

const GALAXY_TERMS: MapTerminology = {
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
  fleetsToggle: "Flotas",
  background: "Galaxy background",
  placeNodesHint: "Left-click empty space to add a system. Middle-click or Space+drag pans the view.",
  timelineTitle: "Galaxy calendar",
  chronicleTitle: "Galaxy chronicle",
  routesTitle: "Hyperlane editor",
  routesHint: "Shift+click two systems to create a lane. Click a line on the map to edit it.",
  statsSummaryNode: "systems",
  statsSummaryConnection: "hyperlanes",
  exportFilename: "galaxy-map.json",
  mapProfileLabel: "Map profile",
};

export const MAP_PROFILES: Record<MapProfileId, MapProfileDef> = {
  galaxy: {
    id: "galaxy",
    label: "Galaxy / sci-fi",
    description: "Star systems, empires, hyperlanes, fleets.",
    terms: GALAXY_TERMS,
  },
  fantasy: {
    id: "fantasy",
    label: "Fantasy world",
    description: "Regions, kingdoms, roads, armies.",
    terms: {
      ...GALAXY_TERMS,
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
      placeNodesHint: "Left-click empty space to add a location. Middle-click or Space+drag pans the view.",
      timelineTitle: "World calendar",
      chronicleTitle: "World chronicle",
      routesTitle: "Road / path editor",
      routesHint: "Shift+click two locations to connect them. Click a line on the map to edit it.",
      statsSummaryNode: "locations",
      statsSummaryConnection: "paths",
      exportFilename: "world-map.json",
    },
  },
  dnd: {
    id: "dnd",
    label: "Tabletop / D&D",
    description: "Campaign locations, factions, paths, party.",
    terms: {
      ...GALAXY_TERMS,
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
      placeNodesHint: "Left-click empty space to add a location. Middle-click or Space+drag pans the view.",
      timelineTitle: "Campaign calendar",
      chronicleTitle: "Campaign chronicle",
      routesTitle: "Path editor",
      routesHint: "Shift+click two locations to link them. Click a line on the map to edit it.",
      statsSummaryNode: "locations",
      statsSummaryConnection: "paths",
      exportFilename: "campaign-map.json",
    },
  },
  adventure: {
    id: "adventure",
    label: "Adventure / unlock",
    description: "Node graph with progression, fog, and milestones.",
    terms: {
      ...GALAXY_TERMS,
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
      placeNodesHint: "Left-click empty space to add a milestone. Use Play mode to test unlocks.",
      timelineTitle: "Campaign calendar",
      chronicleTitle: "Adventure log",
      routesTitle: "Path editor",
      routesHint: "Paths between milestones. Locked paths stay hidden in Play mode until unlocked.",
      statsSummaryNode: "milestones",
      statsSummaryConnection: "paths",
      exportFilename: "adventure-map.json",
    },
  },
};

export function normalizeMapProfile(raw: unknown): MapProfileId {
  if (raw === "fantasy" || raw === "dnd" || raw === "adventure" || raw === "galaxy") {
    return raw;
  }
  return "galaxy";
}

/** Import: explicit `playMode` wins; otherwise adventure maps default to play mode on. */
export function resolveImportedPlayMode(
  profile: MapProfileId,
  raw: unknown,
): boolean {
  if (raw === true || raw === "true" || raw === 1 || raw === "1") return true;
  if (raw === false || raw === "false" || raw === 0 || raw === "0") return false;
  return profile === "adventure";
}

export function getMapProfileDef(id: MapProfileId): MapProfileDef {
  return MAP_PROFILES[id];
}
