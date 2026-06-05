import { BlurFilter, Container, Graphics } from "pixi.js";
import { ownerManager } from "./OwnerManager";
import {
  buildTerritoryMap,
  coreRadiusMinForInfluence,
  influenceRadiusForSize,
  OCCUPATION_INFLUENCE_FACTOR,
  TerritoryMapData,
  TerritorySeed,
  TERRITORY_CORE_RADIUS_FACTOR,
} from "./TerritoryMap";
import type { NodeSystem } from "./NodeSystem";

const FILL_ALPHA = 0.38;
const FILL_BLUR = 10;
const BORDER_COLOR = 0xc8d0e0;
const BORDER_ALPHA = 0.85;
const BORDER_WIDTH = 1.5;
const OCCUPATION_FILL_ALPHA = 0.42;
const OCCUPATION_BORDER_WIDTH = 2;

export class TerritoryRenderer {
  private fillLayer = new Graphics();
  private occupationLayer = new Graphics();
  private borderLayer = new Graphics();
  private lastData: TerritoryMapData | null = null;

  constructor(private parentLayer: Container) {
    this.fillLayer.label = "TerritoryFills";
    this.fillLayer.eventMode = "none";
    this.occupationLayer.label = "OccupationFills";
    this.occupationLayer.eventMode = "none";
    this.borderLayer.label = "TerritoryBorders";
    this.borderLayer.eventMode = "none";
    this.parentLayer?.addChild(this.fillLayer);
    this.parentLayer?.addChild(this.occupationLayer);
    this.parentLayer?.addChild(this.borderLayer);
  }

  public rebuild(systems: NodeSystem[]) {
    const seeds = this.collectOwnerSeeds(systems);
    const occupationSeeds = this.collectOccupationSeeds(systems);
    this.clear();

    if (seeds.length > 0) {
      const map = buildTerritoryMap(seeds);
      if (map) {
        this.lastData = map;
        this.drawOwnerFills(map);
        this.drawOwnerBorders(map);
      }
    }

    if (occupationSeeds.length > 0) {
      const sampleOccupationRadius = influenceRadiusForSize(1, OCCUPATION_INFLUENCE_FACTOR);
      const occupationMap = buildTerritoryMap(occupationSeeds, {
        coreRadiusMin: coreRadiusMinForInfluence(sampleOccupationRadius),
        coreRadiusFactor: TERRITORY_CORE_RADIUS_FACTOR,
      });
      if (occupationMap) {
        this.drawOccupationFills(occupationMap);
        this.drawOccupationBorders(occupationMap);
      }
    }
  }

  public clear() {
    this.fillLayer.clear();
    this.fillLayer.removeChildren();
    this.occupationLayer.clear();
    this.occupationLayer.removeChildren();
    this.borderLayer.clear();
    this.lastData = null;
  }

  public destroy() {
    this.clear();
    this.fillLayer.destroy();
    this.occupationLayer.destroy();
    this.borderLayer.destroy();
  }

  private collectOwnerSeeds(systems: NodeSystem[]): TerritorySeed[] {
    const seeds: TerritorySeed[] = [];

    for (const node of systems) {
      if (!node.visible) continue;
      const owner = node.getDisplayOwner();
      if (!owner || owner === "None" || owner === "none") continue;
      const radius = influenceRadiusForSize(node.data.size);
      seeds.push({
        x: node.x,
        y: node.y,
        ownerId: owner,
        radius,
      });
    }

    return seeds;
  }

  private collectOccupationSeeds(systems: NodeSystem[]): TerritorySeed[] {
    const seeds: TerritorySeed[] = [];

    for (const node of systems) {
      if (!node.visible || !node.isOccupied()) continue;
      const occupierId = node.getDisplayOccupiedBy()!;
      seeds.push({
        x: node.x,
        y: node.y,
        ownerId: occupierId,
        radius: influenceRadiusForSize(node.data.size, OCCUPATION_INFLUENCE_FACTOR),
      });
    }

    return seeds;
  }

  private drawOwnerFills(map: TerritoryMapData) {
    for (const region of map.regions) {
      const owner = ownerManager.get(region.ownerId);
      const g = new Graphics();
      g.eventMode = "none";

      for (const cell of region.cells) {
        const x = map.minX + cell.x * map.cellSize;
        const y = map.minY + cell.y * map.cellSize;
        g.rect(x, y, map.cellSize, map.cellSize);
      }

      g.fill({ color: owner.color, alpha: FILL_ALPHA });
      g.filters = [new BlurFilter(FILL_BLUR)];
      this.fillLayer.addChild(g);
    }
  }

  private drawOwnerBorders(map: TerritoryMapData) {
    if (map.borders.length === 0) return;

    const g = this.borderLayer;
    for (const seg of map.borders) {
      g.moveTo(seg.x1, seg.y1);
      g.lineTo(seg.x2, seg.y2);
    }

    g.stroke({
      width: BORDER_WIDTH,
      color: BORDER_COLOR,
      alpha: BORDER_ALPHA,
      cap: "round",
      join: "round",
    });
  }

  private drawOccupationFills(map: TerritoryMapData) {
    for (const region of map.regions) {
      const occupier = ownerManager.get(region.ownerId);
      const g = new Graphics();
      g.eventMode = "none";

      for (const cell of region.cells) {
        const x = map.minX + cell.x * map.cellSize;
        const y = map.minY + cell.y * map.cellSize;
        g.rect(x, y, map.cellSize, map.cellSize);
      }

      g.fill({ color: occupier.color, alpha: OCCUPATION_FILL_ALPHA });
      this.occupationLayer.addChild(g);
    }
  }

  private drawOccupationBorders(map: TerritoryMapData) {
    if (map.borders.length === 0) return;

    const g = new Graphics();
    g.eventMode = "none";

    for (const seg of map.borders) {
      g.moveTo(seg.x1, seg.y1);
      g.lineTo(seg.x2, seg.y2);
    }

    const occupierIds = [...new Set(map.regions.map((r) => r.ownerId))];
    const borderColor = occupierIds.length === 1
      ? ownerManager.get(occupierIds[0]).color
      : BORDER_COLOR;

    g.stroke({
      width: OCCUPATION_BORDER_WIDTH,
      color: borderColor,
      alpha: 0.9,
      cap: "round",
      join: "round",
    });

    this.occupationLayer.addChild(g);
  }
}
