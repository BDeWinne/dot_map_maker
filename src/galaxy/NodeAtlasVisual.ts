import { Container, Sprite, Text } from "pixi.js";
import type { FacilityId } from "../data/FacilityTypes";
import { getFacilityAtlasIcon, getFacilityDef } from "../data/FacilityTypes";
import {
  formatFleetDisplayCount,
  maxFacilityIconsForLod,
  shouldShowFacilityIconsAtLod,
  shouldShowFleetsAtLod,
  type MapOverlayLod,
} from "./mapOverlayLod";
import { normalizeFleets, sortFleetsForDisplay, type FleetPresence } from "../data/FleetTypes";
import { ownerManager } from "./OwnerManager";
import { createEmblemDisplay, hasFactionEmblem } from "./factionEmblems";
import {
  createAtlasSprite,
  createDigitSprites,
  isNodesAtlasReady,
  NODES_ATLAS_FRAMES,
  tintAtlasSprite,
} from "./nodesAtlas";

/** Target ring diameter at node size=1 (matches legacy 10px radius circle). */
export const ATLAS_RING_DIAMETER = 20;

const RING = NODES_ATLAS_FRAMES.nodeRingPlain;
const PANEL = NODES_ATLAS_FRAMES.panelBlank;
const RING_SCALE = ATLAS_RING_DIAMETER / RING.h;
const PANEL_SCALE = 0.16;
const RING_PANEL_OVERLAP = 4;

const PANEL_DIVIDER_Y = 168;
const PANEL_ICONS_Y = 210;
const PANEL_FLEET_Y = 288;
const PANEL_CHEVRON_Y = 372;

export class NodeAtlasVisual extends Container {
  private ring: Sprite;
  private emblemLayer: Container;
  private detailPanel: Container;
  private panelBg: Sprite;
  private panelContent: Container;
  private expanded = false;

  constructor() {
    super();
    this.eventMode = "none";

    this.ring = createAtlasSprite("nodeRingPlain");
    this.ring.scale.set(RING_SCALE);
    this.emblemLayer = new Container();
    this.detailPanel = new Container();
    this.detailPanel.visible = false;

    this.panelBg = createAtlasSprite("panelBlank");
    this.panelBg.anchor.set(0.5, 0);
    this.panelBg.scale.set(PANEL_SCALE);
    this.panelContent = new Container();

    this.detailPanel.addChild(this.panelBg);
    this.detailPanel.addChild(this.panelContent);

    this.addChild(this.detailPanel);
    this.addChild(this.ring);
    this.addChild(this.emblemLayer);

    this.layoutChrome();
  }

  private layoutChrome(): void {
    const ringR = (RING.h * RING_SCALE) / 2;
    this.detailPanel.position.set(0, ringR - RING_PANEL_OVERLAP);
  }

  public setExpanded(value: boolean): void {
    this.expanded = value;
    this.detailPanel.visible = value;
  }

  public isExpanded(): boolean {
    return this.expanded;
  }

  public setFactionColor(color: number, selected: boolean): void {
    tintAtlasSprite(this.ring, selected ? 0xffd54a : color);
    tintAtlasSprite(this.panelBg, color, selected ? 1 : 0.88);
  }

  public refreshEmblem(ownerId: string, resolution: number): void {
    this.emblemLayer.removeChildren();
    if (!hasFactionEmblem(ownerId)) return;
    const emblem = createEmblemDisplay(ownerId, resolution, ATLAS_RING_DIAMETER * 0.45);
    if (emblem) this.emblemLayer.addChild(emblem);
  }

  public refreshDetails(options: {
    ownerId: string;
    facilities: FacilityId[];
    fleets: FleetPresence[];
    lod: MapOverlayLod;
    resolution: number;
    showIcons: boolean;
    showFleets: boolean;
  }): void {
    if (!this.expanded) return;

    this.panelContent.removeChildren();
    const {
      ownerId,
      facilities,
      fleets,
      lod,
      resolution,
      showIcons,
      showFleets,
    } = options;
    const owner = ownerManager.get(ownerId);
    const tint = owner.color;
    const s = PANEL_SCALE;

    const divider = createAtlasSprite("divider", tint);
    divider.scale.set(s * 0.9);
    divider.position.set(0, PANEL_DIVIDER_Y * s);
    this.panelContent.addChild(divider);

    const iconsRow = new Container();
    iconsRow.y = PANEL_ICONS_Y * s;
    if (showIcons && shouldShowFacilityIconsAtLod(lod)) {
      const maxIcons = maxFacilityIconsForLod(lod);
      const ids = facilities.slice(0, maxIcons);
      const spacing = NODES_ATLAS_FRAMES.iconShield.w * s * 1.08;
      const startX = -((ids.length - 1) * spacing) / 2;
      ids.forEach((id, i) => {
        const frameId = getFacilityAtlasIcon(id);
        const icon = createAtlasSprite(frameId, tint);
        icon.scale.set(s);
        icon.position.set(startX + i * spacing, 0);
        icon.eventMode = "static";
        icon.cursor = "help";
        icon.label = getFacilityDef(id).label;
        iconsRow.addChild(icon);
      });
      if (facilities.length > maxIcons) {
        const more = new Text({
          text: `+${facilities.length - maxIcons}`,
          resolution,
          style: {
            fontSize: 7,
            fontWeight: "700",
            fill: 0xcccccc,
            stroke: { color: 0x000000, width: 1.5 },
          },
        });
        more.anchor.set(0, 0.5);
        more.position.set(startX + ids.length * spacing, 0);
        iconsRow.addChild(more);
      }
    }
    this.panelContent.addChild(iconsRow);

    const fleetRow = new Container();
    fleetRow.y = PANEL_FLEET_Y * s;
    if (showFleets && shouldShowFleetsAtLod(lod)) {
      const sorted = sortFleetsForDisplay(normalizeFleets(fleets), ownerId);
      const primary = sorted[0];
      if (primary) {
        const fleetOwner = ownerManager.get(primary.owner);
        const countStr = formatFleetDisplayCount(primary.count, lod);

        const flotas = createAtlasSprite("labelFlotas", fleetOwner.color);
        flotas.scale.set(s * 0.85);
        flotas.anchor.set(0, 0.5);
        flotas.position.set(-PANEL.w * s * 0.38, 0);

        const ships = createAtlasSprite("iconFleetShips", fleetOwner.color);
        ships.scale.set(s * 0.95);
        ships.anchor.set(0, 0.5);
        ships.position.set(-PANEL.w * s * 0.04, 0);

        const digitScale = s * 0.82;
        const digits = createDigitSprites(countStr, 0xffffff, digitScale);
        let dx = PANEL.w * s * 0.08;
        for (let i = 0; i < digits.length; i++) {
          const d = digits[i];
          const ch = countStr[i];
          const frameKey = `digit${ch}` as keyof typeof NODES_ATLAS_FRAMES;
          const frame = NODES_ATLAS_FRAMES[frameKey] ?? NODES_ATLAS_FRAMES.digit0;
          d.anchor.set(0, 0.5);
          d.position.set(dx, 0);
          dx += frame.w * digitScale * 0.78;
          fleetRow.addChild(d);
        }

        fleetRow.addChild(flotas);
        fleetRow.addChild(ships);

        if (sorted.length > 1) {
          const extra = new Text({
            text: `+${sorted.length - 1}`,
            resolution,
            style: {
              fontSize: 7,
              fontWeight: "700",
              fill: 0xaaaaaa,
              stroke: { color: 0x000000, width: 1.5 },
            },
          });
          extra.anchor.set(0, 0.5);
          extra.position.set(dx + 4, 0);
          fleetRow.addChild(extra);
        }

        fleetRow.eventMode = "static";
        fleetRow.cursor = "help";
        fleetRow.label = sorted
          .map((f) => `${ownerManager.get(f.owner).name}: ${f.count}`)
          .join("\n");
      }
    }
    this.panelContent.addChild(fleetRow);

    const chevron = createAtlasSprite("chevronDown", tint);
    chevron.scale.set(s * 0.85);
    chevron.position.set(0, PANEL_CHEVRON_Y * s);
    this.panelContent.addChild(chevron);
  }

  public getRingBottomY(): number {
    return (RING.h * RING_SCALE) / 2;
  }

  public getContentBottomY(): number {
    if (!this.expanded) return this.getRingBottomY();
    return this.detailPanel.y + PANEL.h * PANEL_SCALE;
  }

  public static canUse(): boolean {
    return isNodesAtlasReady();
  }
}
