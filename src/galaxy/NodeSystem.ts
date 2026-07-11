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
  normalizeFacilities,
  type FacilityId,
} from "../data/FacilityTypes";
import { normalizeFleets, type FleetPresence } from "../data/FleetTypes";
import {
  getMapLabelFontSize,
  getMapOverlayLod,
  getMapOverlayScale,
  shouldShowFleetsAtLod,
  type MapOverlayLod,
} from "./mapOverlayLod";
import { buildNodeInnerInfo } from "./nodeInnerDisplay";
import { isAtlasNodeVisualEnabled } from "./nodeVisualMode";
import type { NodeAtlasVisual } from "./NodeAtlasVisual";
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
  private dragOrigin = { x: 0, y: 0 };
  private dragOffset = new Point();
  private activePointerId: number | null = null;
  private dragRoot: Container;
  private occupationRing: Graphics;
  private occupationOverlay: Graphics;
  private occupationMask: Graphics;
  private capitalRing: Graphics;
  private innerInfoLayer: Container;
  private atlasVisual: NodeAtlasVisual | null = null;
  private adventureFog: Graphics;
  private visual: Container;
  private statusLabel: Text;
  /** Vista por año; no modifica `data` (export / inspector). */
  private viewState: SystemBaseline | null = null;
  private adventureVisual: AdventureNodeState | null = null;
  private static readonly NODE_RADIUS = 10;
  private static readonly LABEL_GAP = 4;
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
      .circle(0, 0, NodeSystem.NODE_RADIUS)
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
    this.innerInfoLayer = new Container();
    this.innerInfoLayer.eventMode = "none";
    this.adventureFog = new Graphics();
    this.adventureFog.eventMode = "none";
    this.visual.addChild(circle);
    this.visual.addChild(this.occupationRing);
    this.visual.addChild(this.occupationMask);
    this.visual.addChild(this.occupationOverlay);
    this.visual.addChild(this.capitalRing);
    this.visual.addChild(this.innerInfoLayer);
    this.visual.addChild(this.adventureFog);
    this.addChild(this.visual);
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
      e.stopPropagation();
      selectionManager.selectNode(this, e.shiftKey && !galaxyScene.getPlayMode());
    });
    this.updateOwnerVisual();
    this.updateOccupationVisual();
    this.updateCapitalVisual();
    if (isAtlasNodeVisualEnabled()) {
      void this.applyAtlasVisual();
    } else {
      this.updateInnerInfo();
    }
    this.updateStatusLabel();
  }

  public async applyAtlasVisual(): Promise<void> {
    if (!isAtlasNodeVisualEnabled()) return;

    const { NodeAtlasVisual } = await import("./NodeAtlasVisual");
    if (!NodeAtlasVisual.canUse()) return;

    if (!this.atlasVisual) {
      this.atlasVisual = new NodeAtlasVisual();
      this.visual.addChildAt(this.atlasVisual, 0);
      this.circle.visible = false;
      this.innerInfoLayer.visible = false;
      this.occupationMask.clear().circle(0, 0, NodeSystem.NODE_RADIUS).fill(0xffffff);
    }

    const owner = ownerManager.get(this.getDisplayOwner());
    const resolution = Math.max(
      2,
      (window.devicePixelRatio || 1) * galaxyScene.getZoom(),
    );
    this.atlasVisual.setFactionColor(owner.color, this.selected);
    this.atlasVisual.refreshEmblem(this.getDisplayOwner(), resolution);
    this.updateLabelPosition();
  }

  private refreshAtlasDetails(
    resolution?: number,
    lod: MapOverlayLod = this.currentOverlayLod(),
  ): void {
    if (!isAtlasNodeVisualEnabled() || !this.atlasVisual) return;

    const expanded = this.selected && lod !== "minimal";
    this.atlasVisual.setExpanded(expanded);
    this.atlasVisual.setFactionColor(
      ownerManager.get(this.getDisplayOwner()).color,
      this.selected,
    );

    if (!expanded) return;

    const textRes =
      resolution ??
      Math.max(2, (window.devicePixelRatio || 1) * galaxyScene.getZoom());

    this.atlasVisual.refreshDetails({
      ownerId: this.getDisplayOwner(),
      facilities: this.getFacilities(),
      fleets: this.getDisplayFleets(),
      lod,
      resolution: textRes,
      showIcons: galaxyScene.getShowFacilityIcons(),
      showFleets: galaxyScene.getShowFleets() && shouldShowFleetsAtLod(lod),
    });
    this.updateLabelPosition();
  }

  public updateInnerInfo(
    resolution?: number,
    lod: MapOverlayLod = this.currentOverlayLod(),
  ) {
    if (isAtlasNodeVisualEnabled()) {
      this.refreshAtlasDetails(resolution, lod);
      return;
    }

    this.innerInfoLayer.removeChildren();

    if (this.selected) {
      this.innerInfoLayer.visible = false;
      return;
    }

    const nodeSize = Math.max(0.25, this.data.size ?? 1);
    const nodeR = NodeSystem.NODE_RADIUS;
    const textRes =
      resolution ??
      Math.max(2, (window.devicePixelRatio || 1) * galaxyScene.getZoom());

    const inner = buildNodeInnerInfo({
      nodeR,
      nodeSize,
      lod,
      resolution: textRes,
      facilities: this.getFacilities(),
      fleets: this.getDisplayFleets(),
      systemOwnerId: this.getDisplayOwner(),
      showIcons: galaxyScene.getShowFacilityIcons(),
      showFleets:
        galaxyScene.getShowFleets() && shouldShowFleetsAtLod(lod),
    });

    if (inner.children.length === 0) {
      this.innerInfoLayer.visible = false;
      return;
    }

    this.innerInfoLayer.visible = true;
    this.innerInfoLayer.addChild(inner);
  }

  public setSelected(value: boolean) {
    this.selected = value;

    if (isAtlasNodeVisualEnabled() && this.atlasVisual) {
      const owner = ownerManager.get(this.getDisplayOwner());
      this.atlasVisual.setFactionColor(owner.color, value);
      this.occupationRing.visible = !value && this.isOccupied();
      this.capitalRing.visible = !value && this.getDisplayIsCapital();
      this.refreshAtlasDetails();
      this.updateStatusLabel();
      this.updateLabelPosition();
      return;
    }

    this.circle.clear();

    if (value) {
      this.circle.circle(0, 0, 12).fill(0xffff00);
      this.occupationRing.visible = false;
      this.capitalRing.visible = false;
      this.innerInfoLayer.visible = false;
    } else {
      const owner = ownerManager.get(this.getDisplayOwner());
      this.circle.circle(0, 0, NodeSystem.NODE_RADIUS).fill(owner.color);
      this.capitalRing.visible = true;
      this.updateOccupationVisual();
      this.updateCapitalVisual();
      this.updateInnerInfo();
      this.refreshTextResolution(
        Math.max(2, (window.devicePixelRatio || 1) * galaxyScene.getZoom()),
      );
    }
    this.updateStatusLabel();
  }

  public refreshTextResolution(resolution: number) {
    this.refreshMapOverlays(galaxyScene.getZoom(), resolution);
  }

  public refreshMapOverlays(zoom: number, resolution: number) {
    const lod = getMapOverlayLod(zoom);
    const overlayScale = getMapOverlayScale(zoom);

    if (this.statusLabel) {
      this.statusLabel.resolution = resolution;
      this.statusLabel.style.fontSize = getMapLabelFontSize(lod);
      this.statusLabel.scale.set(overlayScale);
    }

    this.updateLabelPosition();
    this.updateStatusLabel(lod);
    this.updateInnerInfo(resolution, lod);
  }

  private currentOverlayLod(): MapOverlayLod {
    return getMapOverlayLod(galaxyScene.getZoom());
  }

  private applyNodeSizeScale() {
    const size = Math.max(0.25, this.data.size ?? 1);
    this.visual.scale.set(size);
    this.scale.set(1);
    if (this.statusLabel) {
      this.updateLabelPosition();
    }
    this.refreshTextResolution(
      Math.max(2, (window.devicePixelRatio || 1) * galaxyScene.getZoom()),
    );
  }

  private updateLabelPosition() {
    if (!this.statusLabel) return;
    const size = Math.max(0.25, this.data.size ?? 1);
    const bottomY =
      isAtlasNodeVisualEnabled() && this.atlasVisual
        ? this.atlasVisual.getContentBottomY() * size
        : NodeSystem.NODE_RADIUS * size;
    this.statusLabel.anchor.set(0.5, 0);
    this.statusLabel.position.set(0, bottomY + NodeSystem.LABEL_GAP);
  }

  public updateFleetMarkers(
    resolution?: number,
    lod: MapOverlayLod = this.currentOverlayLod(),
  ) {
    this.updateInnerInfo(resolution, lod);
  }

  public updateFacilityIcons(
    resolution?: number,
    lod: MapOverlayLod = this.currentOverlayLod(),
  ) {
    this.updateInnerInfo(resolution, lod);
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

  updateStatusLabel(lod: MapOverlayLod = this.currentOverlayLod()) {
    if (!galaxyScene.getShowNodeLabels()) {
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

    let text: string;
    if (lod === "minimal") {
      text = `${prefix}${name}`;
    } else if (lod === "compact") {
      text = `${prefix}${name} (${owner.short})`;
      if (this.isOccupied()) {
        const occupier = ownerManager.get(this.getDisplayOccupiedBy()!);
        text += ` ·${occupier.short}`;
      }
    } else {
      text = `${prefix}${name} (${owner.short})`;
      if (this.isOccupied()) {
        const occupier = ownerManager.get(this.getDisplayOccupiedBy()!);
        text += `\nocc: ${occupier.short}`;
      }
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
    if (isAtlasNodeVisualEnabled() && this.atlasVisual) {
      this.atlasVisual.setFactionColor(owner.color, this.selected);
      this.atlasVisual.refreshEmblem(
        this.getDisplayOwner(),
        Math.max(2, (window.devicePixelRatio || 1) * galaxyScene.getZoom()),
      );
    } else {
      this.circle.clear();
      this.circle.circle(0, 0, NodeSystem.NODE_RADIUS).fill(owner.color);
    }
    this.updateOccupationVisual();
    this.updateCapitalVisual();
    this.refreshTextResolution(
      Math.max(2, (window.devicePixelRatio || 1) * galaxyScene.getZoom()),
    );
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
    } else if (state.visibility === "hidden") {
      this.visual.alpha = 0.42;
      this.adventureFog.visible = true;
      this.adventureFog
        .circle(0, 0, r + 1)
        .fill({ color: 0x1a1a2a, alpha: 0.35 });
      this.adventureFog
        .circle(0, 0, r + 1)
        .stroke({ width: 1.5, color: 0x6688aa, alpha: 0.75 });
      this.eventMode = this.visible ? "static" : "none";
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
    this.updateInnerInfo();
  }

  public getFleets(): FleetPresence[] {
    return normalizeFleets(this.data.fleets);
  }

  public setFleets(fleets: FleetPresence[]) {
    const normalized = normalizeFleets(fleets);
    this.data.fleets = normalized.length > 0 ? normalized : undefined;
    this.updateInnerInfo();
  }

  private onDragStart(event: FederatedPointerEvent) {
    if (event.button !== 0) return;
    if (galaxyScene.isEditorLocked()) return;
    if (galaxyScene.getEditMode() !== "edit") return;

    event.stopPropagation();

    if (!this.parent) return;

    this.dragging = true;
    this.activePointerId = event.pointerId;
    this.dragOrigin = { x: this.x, y: this.y };

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

    if (
      Math.hypot(this.x - this.dragOrigin.x, this.y - this.dragOrigin.y) > 0.5
    ) {
      document.dispatchEvent(
        new CustomEvent("node:moved", {
          detail: {
            nodeId: this.data.id,
            from: { ...this.dragOrigin },
            to: { x: this.x, y: this.y },
          },
        }),
      );
      document.dispatchEvent(new CustomEvent("map:updated"));
    }
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