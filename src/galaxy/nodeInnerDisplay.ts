import { Container, Text } from "pixi.js";
import { ownerManager } from "./OwnerManager";
import {
  createFacilityBadge,
  getFacilityDef,
  normalizeFacilities,
  type FacilityId,
} from "../data/FacilityTypes";
import {
  normalizeFleets,
  sortFleetsForDisplay,
  type FleetPresence,
} from "../data/FleetTypes";
import {
  formatFleetDisplayCount,
  type MapOverlayLod,
} from "./mapOverlayLod";

function innerBadgeScale(nodeSize: number): number {
  return Math.min(0.48, 0.34 + nodeSize * 0.07);
}

function innerFleetFontSize(nodeR: number): number {
  return Math.max(5, Math.min(9, nodeR * 0.5));
}

function maxInnerFacilities(lod: MapOverlayLod): number {
  if (lod === "minimal") return 0;
  if (lod === "compact") return 2;
  return 4;
}

export function buildNodeInnerInfo(options: {
  nodeR: number;
  nodeSize: number;
  lod: MapOverlayLod;
  resolution: number;
  facilities: FacilityId[];
  fleets: FleetPresence[];
  systemOwnerId: string;
  showIcons: boolean;
  showFleets: boolean;
}): Container {
  const root = new Container();
  root.eventMode = "none";

  const {
    nodeR,
    nodeSize,
    lod,
    resolution,
    facilities,
    fleets,
    systemOwnerId,
    showIcons,
    showFleets,
  } = options;

  const maxFac = maxInnerFacilities(lod);
  const facIds = showIcons ? normalizeFacilities(facilities).slice(0, maxFac) : [];
  const fleetRows =
    showFleets && lod !== "minimal"
      ? sortFleetsForDisplay(normalizeFleets(fleets), systemOwnerId)
      : [];

  if (facIds.length === 0 && fleetRows.length === 0) {
    return root;
  }

  const badgeScale = innerBadgeScale(nodeSize);
  const facY = -nodeR * 0.38;
  const facSpan = nodeR * 1.35;

  if (facIds.length > 0) {
    for (let i = 0; i < facIds.length; i++) {
      const t = facIds.length === 1 ? 0.5 : i / (facIds.length - 1);
      const badge = createFacilityBadge(facIds[i], badgeScale, resolution);
      badge.position.set((t - 0.5) * facSpan, facY);
      badge.eventMode = "static";
      badge.cursor = "help";
      badge.label = getFacilityDef(facIds[i]).label;
      root.addChild(badge);
    }
    const extra = normalizeFacilities(facilities).length - facIds.length;
    if (extra > 0) {
      const more = new Text({
        text: `+${extra}`,
        resolution,
        style: {
          fontSize: Math.max(5, innerFleetFontSize(nodeR) - 1),
          fontWeight: "700",
          fill: 0xdddddd,
          stroke: { color: 0x000000, width: 1.5 },
        },
      });
      more.anchor.set(0, 0.5);
      more.roundPixels = true;
      more.position.set(facSpan * 0.42, facY);
      root.addChild(more);
    }
  }

  if (fleetRows.length > 0) {
    const fontSize = innerFleetFontSize(nodeR);
    const lineH = fontSize + 2;
    const maxLines = lod === "compact" ? 1 : 3;
    const rows = fleetRows.slice(0, maxLines);
    const startY =
      facIds.length > 0 ? nodeR * 0.08 : nodeR * 0.05 - ((rows.length - 1) * lineH) / 2;

    rows.forEach((fleet, i) => {
      const owner = ownerManager.get(fleet.owner);
      const count = formatFleetDisplayCount(fleet.count, lod);
      const label = new Text({
        text: `${owner.short} ${count}`,
        resolution,
        style: {
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize,
          fontWeight: "700",
          fill: owner.color,
          stroke: { color: 0x000000, width: 2, join: "round" },
        },
      });
      label.anchor.set(0.5);
      label.roundPixels = true;
      label.position.set(0, startY + i * lineH);
      label.eventMode = "static";
      label.cursor = "help";
      label.label = `${owner.name}: ${fleet.count}`;
      root.addChild(label);
    });

    if (fleetRows.length > maxLines) {
      const extra = new Text({
        text: `+${fleetRows.length - maxLines}`,
        resolution,
        style: {
          fontSize: Math.max(4, fontSize - 1),
          fontWeight: "700",
          fill: 0xcccccc,
          stroke: { color: 0x000000, width: 1.5 },
        },
      });
      extra.anchor.set(0.5);
      extra.position.set(0, startY + rows.length * lineH);
      root.addChild(extra);
    }
  }

  return root;
}
