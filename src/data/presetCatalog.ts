import type { MapProfileId } from "./MapProfile";
import { appAssetUrl } from "../config/publicPath";

export interface PresetCatalogEntry {
  id: string;
  file: string;
  profile: MapProfileId;
  titleKey: string;
  descKey: string;
  featureKeys: string[];
  /** Shown in online demo gallery (`?demo=1` or `npm run build:demo`). */
  demoAllowed?: boolean;
}

export const PRESET_CATALOG: PresetCatalogEntry[] = [
  {
    id: "csh",
    file: "csh-preset.json",
    profile: "galaxy",
    titleKey: "preset.csh.title",
    descKey: "preset.csh.desc",
    featureKeys: ["preset.feat.timeline", "preset.feat.fleets", "preset.feat.conquest"],
    demoAllowed: true,
  },
  {
    id: "galaxy",
    file: "galaxy-preset.json",
    profile: "galaxy",
    titleKey: "preset.galaxy.title",
    descKey: "preset.galaxy.desc",
    featureKeys: ["preset.feat.timeline", "preset.feat.fleets", "preset.feat.owners"],
  },
  {
    id: "fantasy",
    file: "fantasy-preset.json",
    profile: "fantasy",
    titleKey: "preset.fantasy.title",
    descKey: "preset.fantasy.desc",
    featureKeys: ["preset.feat.regions", "preset.feat.armies", "preset.feat.paths"],
  },
  {
    id: "dnd",
    file: "dnd-preset.json",
    profile: "dnd",
    titleKey: "preset.dnd.title",
    descKey: "preset.dnd.desc",
    featureKeys: ["preset.feat.locations", "preset.feat.play", "preset.feat.milestones"],
    demoAllowed: true,
  },
  {
    id: "adventure",
    file: "adventure-preset.json",
    profile: "adventure",
    titleKey: "preset.adventure.title",
    descKey: "preset.adventure.desc",
    featureKeys: ["preset.feat.unlock", "preset.feat.encounters", "preset.feat.play"],
    demoAllowed: true,
  },
  {
    id: "timeline-wars",
    file: "timeline-wars-preset.json",
    profile: "galaxy",
    titleKey: "preset.timelineWars.title",
    descKey: "preset.timelineWars.desc",
    featureKeys: ["preset.feat.yearScrub", "preset.feat.chronicle", "preset.feat.conquest"],
  },
  {
    id: "trade-routes",
    file: "trade-routes-preset.json",
    profile: "fantasy",
    titleKey: "preset.tradeRoutes.title",
    descKey: "preset.tradeRoutes.desc",
    featureKeys: ["preset.feat.routeEvents", "preset.feat.routeTypes", "preset.feat.stats"],
  },
  {
    id: "rich-milestones",
    file: "rich-milestones-preset.json",
    profile: "adventure",
    titleKey: "preset.richMilestones.title",
    descKey: "preset.richMilestones.desc",
    featureKeys: ["preset.feat.multiEncounter", "preset.feat.rewards", "preset.feat.milestoneHud"],
  },
  {
    id: "fog-of-war",
    file: "fog-of-war-preset.json",
    profile: "adventure",
    titleKey: "preset.fogOfWar.title",
    descKey: "preset.fogOfWar.desc",
    featureKeys: ["preset.feat.fogOfWar", "preset.feat.hiddenNodes", "preset.feat.play"],
  },
];

export function presetUrl(file: string): string {
  return appAssetUrl(`test-presets/${file}`);
}

export function getPresetsForAppMode(demo: boolean): PresetCatalogEntry[] {
  if (!demo) return PRESET_CATALOG;
  const allowed = PRESET_CATALOG.filter((p) => p.demoAllowed);
  return allowed.length > 0 ? allowed : PRESET_CATALOG.slice(0, 3);
}
