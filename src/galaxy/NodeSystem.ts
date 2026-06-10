import {
  Container,
  Graphics,
  FederatedPointerEvent,
  Point,
  Text,
} from "pixi.js";
import { selectionManager } from "../editor/SelectionManager";
import { ConnectionLine } from "./ConnectionLine";
import { ownerManager } from "./OwnerManager";
import {
  createFacilityBadge,
  getFacilityBadgeDisplayRadius,
  getFacilityBadgeMapScale,
  getFacilityDef,
  normalizeFacilities,
  type FacilityId,
} from "../data/FacilityTypes";
import {
  createFleetMarker,
  getFleetMarkerWidth,
  normalizeFleets,
  sortFleetsForDisplay,
  type FleetPresence,
} from "../data/FleetTypes";
import { parsePopulationToInt } from "../data/population";
import { galaxyScene } from "../scene/GalaxyScene";
import type { SystemBaseline } from "../data/timelineState";
import type { TimelineEntry } from "../data/TimelineTypes";
import type { NodeAdventure } from "../data/AdventureTypes";
import type { AdventureNodeState } from "../data/adventureState";

export class NodeSystem extends Container {
  public data: SystemData;
  private circle: Graphics;
  private selected = false;
  public isSystemNode = true;

  private dragging = false;
  private dragOffset = new Point();
  private activePointerId: number | null = null;
  private dragRoot: Container;
  private occupationRing: Graphics;
  private occupationOverlay: Graphics;
  private occupationMask: Graphics;
  private capitalRing: Graphics;
  private facilityLayer: Container;
  private fleetLayer: Container;
  private adventureFog: Graphics;
  private visual: Container;
  private statusLabel: Text;
  /** Vista por año; no modifica `data` (export / inspector). */
  private viewState: SystemBaseline | null = null;
  private adventureVisual: AdventureNodeState | null = null;
  private static readonly NODE_RADIUS = 10;
  private static readonly LABEL_GAP = 4;
  private static readonly FACILITY_ABOVE_GAP = 4;
  private static readonly FLEET_LEFT_GAP = 5;
  private static readonly FLEET_ROW_HEIGHT = 12;
  private static readonly OCCUPATION_STRIPE_SPACING = 7;
  private static readonly CAPITAL_RING_OFFSET = 3;
  constructor(
    x: number,
    y: number,
    color: number,
    dragRoot: Container,
    data: SystemData
  ) {
    super();

    this.dragRoot = dragRoot;
    this.data = data;
    this.position.set(data.x, data.y);
    this.visual = new Container();

    const circle = new Graphics()
      .circle(0, 0, 10)
      .fill(color);

    this.circle = circle;
    this.label = 'Sistema: ' + data.name;
    this.position.set(x, y);
    this.occupationRing = new Graphics();
    this.occupationOverlay = new Graphics();
    this.occupationMask = new Graphics()
      .circle(0, 0, NodeSystem.NODE_RADIUS)
      .fill(0xffffff);
    this.occupationOverlay.mask = this.occupationMask;
    this.capitalRing = new Graphics();
    this.facilityLayer = new Container();
    this.facilityLayer.eventMode = "none";
    this.fleetLayer = new Container();
    this.fleetLayer.eventMode = "none";
    this.adventureFog = new Graphics();
    this.adventureFog.eventMode = "none";
    this.visual.addChild(circle);
    this.visual.addChild(this.occupationRing);
    this.visual.addChild(this.occupationMask);
    this.visual.addChild(this.occupationOverlay);
    this.visual.addChild(this.capitalRing);
    this.visual.addChild(this.adventureFog);
    this.addChild(this.visual);
    this.addChild(this.fleetLayer);
    this.addChild(this.facilityLayer);
    const labelResolution = Math.max(2, window.devicePixelRatio || 1);
    this.statusLabel = new Text({
      text: "",
      resolution: labelResolution,
      style: {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: 10,
        fontWeight: "600",
        fill: 0xeeeeee,
        stroke: { color: 0x000000, width: 2.5, join: "round" },
        align: "center",
        lineHeight: 12,
      },
    });
    this.statusLabel.anchor.set(0.5, 0);
    this.statusLabel.scale.set(1);
    this.statusLabel.eventMode = "none";
    this.addChild(this.statusLabel);
    this.applyNodeSizeScale();
    this.eventMode = "static";
    this.cursor = "pointer";
    this.on("pointerdown", this.onDragStart, this);
    this.on("pointerdown", (e) => {
      if (e.button !== 0) return;
      if (galaxyScene.getEditMode() !== "edit") {
        galaxyScene.beginRepositionDrag(e);
        return;
      }
      if (
        galaxyScene.getPlayMode() &&
        !galaxyScene.isNodeAdventureAccessible(this.data.id)
      ) {
        return;
      }
      selectionManager.selectNode(this, e.shiftKey && !galaxyScene.getPlayMode());
    });
    this.updateOwnerVisual();
    this.updateOccupationVisual();
    this.updateCapitalVisual();
    this.updateFacilityIcons();
    this.updateFleetMarkers();
    this.updateStatusLabel();
  }

  public setSelected(value: boolean) {
    this.selected = value;
    this.circle.clear();

    if (value) {
      this.circle.circle(0, 0, 12).fill(0xffff00);
      this.occupationRing.visible = false;
      this.capitalRing.visible = false;
      this.facilityLayer.visible = false;
      this.fleetLayer.visible = false;
    } else {
      const owner = ownerManager.get(this.getDisplayOwner());
      this.circle.circle(0, 0, 10).fill(owner.color);
      this.capitalRing.visible = true;
      this.updateOccupationVisual();
      this.updateCapitalVisual();
      this.updateFacilityIcons();
      this.updateFleetMarkers();
      this.updateStatusLabel();
    }
  }

  public refreshTextResolution(resolution: number) {
    if (!this.statusLabel) return;
    this.statusLabel.resolution = resolution;
    if (this.facilityLayer.visible && this.facilityLayer.children.length > 0) {
      this.updateFacilityIcons(resolution);
    }
    if (this.fleetLayer.visible && this.fleetLayer.children.length > 0) {
      this.updateFleetMarkers(resolution);
    }
  }

  private applyNodeSizeScale() {
    const size = Math.max(0.25, this.data.size ?? 1);
    this.visual.scale.set(size);
    this.scale.set(1);
    if (this.statusLabel) {
      this.statusLabel.scale.set(1);
      this.updateLabelPosition();
    }
    this.updateFacilityIcons();
    this.updateFleetMarkers();
  }

  private updateLabelPosition() {
    if (!this.statusLabel) return;
    const size = Math.max(0.25, this.data.size ?? 1);
    this.statusLabel.position.set(
      0,
      NodeSystem.NODE_RADIUS * size + NodeSystem.LABEL_GAP
    );
  }

  public updateNodes() {
    this.position.set(this.data.x, this.data.y);
    this.applyNodeSizeScale();
    this.label = "Sistema: " + this.data.name;
    this.updateStatusLabel();
  }

  setOccupiedBy(ownerId: string | null) {
    this.data.occupiedBy = ownerId ?? undefined;
    this.updateOccupationVisual();
    galaxyScene.regenerateTerritories();
  }

  public getDisplayOwner(): string {
    if (this.viewState !== null) return this.viewState.owner;
    return this.data.owner;
  }

  public getDisplayOccupiedBy(): string | undefined {
    if (this.viewState !== null) return this.viewState.occupiedBy;
    return this.data.occupiedBy;
  }

  public getDisplayIsCapital(): boolean {
    if (this.viewState !== null) return this.viewState.isCapital;
    return !!this.data.isCapital;
  }

  public getDisplayPopulation(): number {
    if (this.viewState !== null) return this.viewState.population;
    return parsePopulationToInt(this.data.population);
  }

  public getDisplayFleets(): FleetPresence[] {
    if (this.viewState !== null) return normalizeFleets(this.viewState.fleets);
    return normalizeFleets(this.data.fleets);
  }

  public isOccupied(): boolean {
    const occupier = this.getDisplayOccupiedBy();
    const owner = this.getDisplayOwner();
    return !!occupier && occupier !== owner && occupier !== "None" && occupier !== "none";
  }

  public setCapital(isCapital: boolean) {
    this.data.isCapital = isCapital;
    if (isCapital) {
      galaxyScene.clearCapitalForOwner(this.data.owner, this);
    }
    this.updateCapitalVisual();
    document.dispatchEvent(new CustomEvent("map:updated"));
  }

  updateCapitalVisual() {
    this.capitalRing.clear();
    if (!this.getDisplayIsCapital() || this.selected) return;

    const owner = ownerManager.get(this.getDisplayOwner());
    const r = NodeSystem.NODE_RADIUS + NodeSystem.CAPITAL_RING_OFFSET;
    this.capitalRing
      .circle(0, 0, r)
      .stroke({ width: 1.5, color: 0xffd700, alpha: 0.95 });
    this.capitalRing
      .circle(0, 0, r + 1)
      .stroke({ width: 1, color: owner.color, alpha: 0.65 });
  }

  updateStatusLabel() {
    if (this.selected || !galaxyScene.getShowNodeLabels()) {
      this.statusLabel.visible = false;
      return;
    }

    this.statusLabel.visible = true;
    const owner = ownerManager.get(this.getDisplayOwner());
    const name = this.data.name?.trim() || "System";
    let prefix = this.getDisplayIsCapital() ? "★ " : "";
    if (this.adventureVisual?.visibility === "completed") {
      prefix = "✓ " + prefix;
    } else if (this.adventureVisual?.visibility === "locked") {
      prefix = "🔒 " + prefix;
    }
    let text = `${prefix}${name} (${owner.short})`;

    if (this.isOccupied()) {
      const occupier = ownerManager.get(this.getDisplayOccupiedBy()!);
      text += `\nocc: ${occupier.short}`;
    }

    this.statusLabel.text = text;
  }

  updateOccupationVisual() {
    this.occupationRing.clear();
    this.occupationOverlay.clear();

    if (!this.isOccupied()) {
      this.occupationRing.visible = false;
      return;
    }

    const occupier = ownerManager.get(this.getDisplayOccupiedBy()!);
    const r = NodeSystem.NODE_RADIUS;

    this.occupationRing.visible = true;
    this.occupationRing
      .circle(0, 0, r + 3)
      .stroke({ width: 3, color: occupier.color, alpha: 0.95 });

    for (let i = -r; i < r; i += NodeSystem.OCCUPATION_STRIPE_SPACING) {
      this.occupationOverlay
        .moveTo(i, -r)
        .lineTo(i + r, r);
    }

    this.occupationOverlay.stroke({
      width: 2,
      color: occupier.color,
      alpha: 0.9,
    });
    this.updateStatusLabel();
    galaxyScene.refreshLabelResolution();
  }

  public refreshDisplayVisuals() {
    if (!this.visible) return;

    const owner = ownerManager.get(this.getDisplayOwner());
    this.circle.clear();
    this.circle.circle(0, 0, 10).fill(owner.color);
    this.updateOccupationVisual();
    this.updateCapitalVisual();
    this.updateFacilityIcons();
    this.updateFleetMarkers();
    this.updateStatusLabel();
  }

  public updateFleetMarkers(resolution?: number) {
    this.fleetLayer.removeChildren();
    const fleets = this.getDisplayFleets();
    if (
      fleets.length === 0 ||
      this.selected ||
      !galaxyScene.getShowFleets()
    ) {
      this.fleetLayer.visible = false;
      return;
    }

    this.fleetLayer.visible = true;
    const nodeSize = Math.max(0.25, this.data.size ?? 1);
    const nodeR = NodeSystem.NODE_RADIUS * nodeSize;
    const textRes =
      resolution ??
      Math.max(2, (window.devicePixelRatio || 1) * galaxyScene.getZoom());
    const sorted = sortFleetsForDisplay(fleets, this.getDisplayOwner());
    const markerW = getFleetMarkerWidth();
    const baseX = -(nodeR + NodeSystem.FLEET_LEFT_GAP + markerW);
    const rowH = NodeSystem.FLEET_ROW_HEIGHT;

    sorted.forEach((fleet, i) => {
      const marker = createFleetMarker(fleet.owner, fleet.count, textRes);
      const y = (i - (sorted.length - 1) / 2) * rowH;
      marker.position.set(baseX, y);
      marker.eventMode = "static";
      marker.cursor = "help";
      const owner = ownerManager.get(fleet.owner);
      marker.label = `${owner.name}: ${fleet.count} flota${fleet.count === 1 ? "" : "s"}`;
      this.fleetLayer.addChild(marker);
    });
  }

  public updateFacilityIcons(resolution?: number) {
    this.facilityLayer.removeChildren();
    const ids = normalizeFacilities(this.data.facilities);
    if (
      ids.length === 0 ||
      this.selected ||
      !galaxyScene.getShowFacilityIcons()
    ) {
      this.facilityLayer.visible = false;
      return;
    }

    this.facilityLayer.visible = true;
    const nodeSize = Math.max(0.25, this.data.size ?? 1);
    const badgeScale = getFacilityBadgeMapScale(nodeSize);
    const textRes =
      resolution ??
      Math.max(2, (window.devicePixelRatio || 1) * galaxyScene.getZoom());
    const nodeR = NodeSystem.NODE_RADIUS * nodeSize;
    const badgeRadius = getFacilityBadgeDisplayRadius(badgeScale);
    const spacing = badgeRadius * 2.2 + 4;
    const maxShown = 8;
    const shown = ids.slice(0, maxShown);
    const y = -(nodeR + NodeSystem.FACILITY_ABOVE_GAP + badgeRadius);
    const startX = -((shown.length - 1) * spacing) / 2;

    for (let i = 0; i < shown.length; i++) {
      const badge = createFacilityBadge(shown[i], badgeScale, textRes);
      badge.position.set(startX + i * spacing, y);
      badge.eventMode = "static";
      badge.cursor = "help";
      badge.label = getFacilityDef(shown[i]).label;
      this.facilityLayer.addChild(badge);
    }

    if (ids.length > maxShown) {
      const more = new Text({
        text: `+${ids.length - maxShown}`,
        resolution: textRes,
        style: {
          fontSize: 8,
          fontWeight: "700",
          fill: 0xcccccc,
          stroke: { color: 0x000000, width: 1.5 },
        },
      });
      more.anchor.set(0, 0.5);
      more.roundPixels = true;
      more.position.set(
        startX + (shown.length - 1) * spacing + badgeRadius + 5,
        y,
      );
      more.eventMode = "none";
      this.facilityLayer.addChild(more);
    }
  }

  public applyAdventureVisual(state: AdventureNodeState | null) {
    this.adventureVisual = state;
    this.adventureFog.clear();

    if (!state || state.visibility === "unlocked") {
      this.visual.alpha = 1;
      this.adventureFog.visible = false;
      if (this.visible && galaxyScene.getPlayMode() && state?.unlocked) {
        this.eventMode = "static";
      }
      this.updateStatusLabel();
      return;
    }

    const size = Math.max(0.25, this.data.size ?? 1);
    const r = NodeSystem.NODE_RADIUS * size + 4;

    if (state.visibility === "completed") {
      this.visual.alpha = 1;
      this.adventureFog.visible = true;
      this.adventureFog
        .circle(0, 0, r + 2)
        .stroke({ width: 2, color: 0x2ecc71, alpha: 0.9 });
      this.eventMode = this.visible ? "static" : "none";
    } else if (state.visibility === "locked") {
      this.visual.alpha = galaxyScene.getPlayMode() ? 0.35 : 0.55;
      this.adventureFog.visible = true;
      this.adventureFog
        .circle(0, 0, r + 1)
        .fill({ color: 0x111122, alpha: 0.55 });
      this.adventureFog
        .circle(0, 0, r + 1)
        .stroke({ width: 1.5, color: 0x888899, alpha: 0.7 });
      if (galaxyScene.getPlayMode()) {
        this.eventMode = "none";
      } else {
        this.eventMode = this.visible ? "static" : "none";
      }
    }

    this.updateStatusLabel();
  }

  public applyDisplayFromData() {
    this.viewState = null;
    this.visible = true;
    this.eventMode = "static";
    this.refreshDisplayVisuals();
  }

  public applyViewState(state: SystemBaseline) {
    this.viewState = state;
    this.visible = state.visible;
    this.eventMode = state.visible ? "static" : "none";
    if (!state.visible) return;
    this.refreshDisplayVisuals();
  }

  /** @deprecated use applyViewState */
  public applyTimelineDisplayState(state: SystemBaseline) {
    this.applyViewState(state);
  }

  updateOwnerVisual() {
    this.viewState = null;
    this.refreshDisplayVisuals();
    galaxyScene.regenerateTerritories();
  }

  setOwner(ownerId: string) {
    this.data.owner = ownerId;
    this.updateOwnerVisual();
  }

  public getFacilities(): FacilityId[] {
    return normalizeFacilities(this.data.facilities);
  }

  public setFacilities(ids: FacilityId[]) {
    this.data.facilities = ids.length > 0 ? [...ids] : undefined;
    this.updateFacilityIcons();
  }

  public getFleets(): FleetPresence[] {
    return normalizeFleets(this.data.fleets);
  }

  public setFleets(fleets: FleetPresence[]) {
    const normalized = normalizeFleets(fleets);
    this.data.fleets = normalized.length > 0 ? normalized : undefined;
    this.updateFleetMarkers();
  }

  private onDragStart(event: FederatedPointerEvent) {
    if (event.button !== 0) return;
    if (galaxyScene.getPlayMode()) return;
    if (galaxyScene.getEditMode() !== "edit") return;

    event.stopPropagation();

    if (!this.parent) return;

    this.dragging = true;
    this.activePointerId = event.pointerId;

    const local = event.getLocalPosition(this.parent);

    this.dragOffset.set(
      this.x - local.x,
      this.y - local.y
    );

    // 🔥 Escuchamos en el root (GalaxyScene)
    this.dragRoot.on("pointermove", this.onDragMove, this);
    this.dragRoot.on("pointerup", this.onDragEnd, this);
    this.dragRoot.on("pointerupoutside", this.onDragEnd, this);
  }

  private onDragMove(event: FederatedPointerEvent) {
    if (
      !this.dragging ||
      !this.parent ||
      event.pointerId !== this.activePointerId
    ) return;

    const local = event.getLocalPosition(this.parent);

    this.position.set(
      local.x + this.dragOffset.x,
      local.y + this.dragOffset.y
    );
    this.emit("nodeMoved");
    galaxyScene.regenerateTerritories();
  }

  private onDragEnd(event: FederatedPointerEvent) {
    if (event.pointerId !== this.activePointerId) return;

    this.dragging = false;
    this.activePointerId = null;

    this.dragRoot.off("pointermove", this.onDragMove, this);
    this.dragRoot.off("pointerup", this.onDragEnd, this);
    this.dragRoot.off("pointerupoutside", this.onDragEnd, this);

    this.data.x = this.x;
    this.data.y = this.y;
  }
}

export interface SystemData {
  id: string;
  name: string;
  starType: string;
  owner: string;
  occupiedBy?: string | undefined;
  description?: string;
  /** Entero (habitantes). JSON antiguo puede traer string — se normaliza al cargar. */
  population?: number;
  /** Estado antes del primer evento de timeline (si hay colonized, empieza oculto). */
  baseline?: SystemBaseline;
  /** @deprecated legacy field — use isCapital */
  capital?: string;
  isCapital?: boolean;
  x: number;
  y: number;
  size?: number;
  timeline?: TimelineEntry[];
  /** Iconos de instalaciones (bastión, astillero, minería, etc.). */
  facilities?: FacilityId[];
  /** Flotas por imperio: `{ owner, count }[]` o `{ ownerId: count }`. */
  fleets?: FleetPresence[];
  /** Progreso de aventura / campaña (opcional). */
  adventure?: NodeAdventure;
}