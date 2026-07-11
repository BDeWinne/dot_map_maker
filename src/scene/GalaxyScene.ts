import { Assets, Container, FederatedPointerEvent, Graphics, Point, Rectangle, Sprite } from "pixi.js";
import { NodeSystem, SystemData } from "../galaxy/NodeSystem";
import { normalizeConnection, connectionKey, type SystemConnection } from "../data/ConnectionTypes";
import { applyGlobalFleetTransfers } from "../data/fleetMovement";
import { getRouteStatusAtYear, syncPresentRouteStatus } from "../data/routeState";
import { selectionManager, SelectionManager } from "../editor/SelectionManager";
import { ConnectionLine } from "../galaxy/ConnectionLine";
import { TerritoryRenderer } from "../galaxy/TerritoryRenderer";
import { normalizeFacilities } from "../data/FacilityTypes";
import { normalizeFleets, type FleetPresence } from "../data/FleetTypes";
import { parsePopulationToInt } from "../data/population";
import { isAtlasNodeVisualEnabled } from "../galaxy/nodeVisualMode";
import { ownerManager } from "../galaxy/OwnerManager";
import { isDemoMode } from "../config/demoMode";
import { appAssetUrl } from "../config/publicPath";
import {
  getDisplayStateAtYear,
  getMaxTimelineYear,
  recomputeOwnerCapitalOrigins,
  syncPresentFieldsFromTimeline,
  type SystemBaseline,
} from "../data/timelineState";
import type { MapCalendar } from "../data/TimelineTypes";
import {
  normalizeMapProfile,
  resolveImportedPlayMode,
  type MapProfileId,
} from "../data/MapProfile";
import { normalizeAdventure } from "../data/AdventureTypes";
import {
  computeAdventureStates,
  type AdventureNodeState,
} from "../data/adventureState";
import {
  emptyPlayProgress,
  mergeAdventureWithProgress,
  migrateProgressFromDesign,
  type PlayMilestoneProgress,
  type PlayProgress,
} from "../data/playProgress";
import type { NodeAdventure } from "../data/AdventureTypes";

interface NodePresentSnapshot {
  owner: string;
  occupiedBy?: string;
  population?: number;
  isCapital?: boolean;
  fleets?: FleetPresence[];
}

export interface GalaxyBackgroundData {
  /** Embedded image (export / upload). */
  dataUrl?: string;
  /** Relative path under `/test-presets/` or absolute URL. */
  src?: string;
  x: number;
  y: number;
  scale: number;
  alpha: number;
}

export function resolveBackgroundSource(data: GalaxyBackgroundData): string {
  const embedded = data.dataUrl?.trim();
  if (embedded) return embedded;

  const src = data.src?.trim();
  if (!src) {
    throw new Error("Background missing dataUrl and src");
  }
  if (
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("data:")
  ) {
    return src;
  }
  if (src.startsWith("/test-presets/")) {
    return appAssetUrl(src.slice(1));
  }
  if (src.startsWith("/")) {
    return src;
  }
  return appAssetUrl(`test-presets/${src.replace(/^\.\//, "")}`);
}

export type MapEditMode = "edit" | "moveBackground" | "moveNodes";

export class GalaxyScene extends Container {
  public world = new Container();
  private backgroundLayer: Container;
  private backgroundSprite: Sprite | null = null;
  private backgroundData: GalaxyBackgroundData | null = null;
  private nodeLayer: Container;
  private mapHitPlane: Graphics;
  private systems: NodeSystem[] = [];
  private connections: SystemConnection[] = []; // después lo tipamos mejor
  private connectionLayer: Container;
  private connectionLines: ConnectionLine[] = [];
  public territoryLayer: Container;
  private territoryRenderer: TerritoryRenderer;
  private zoom = 1;
  private minZoom = 0.12;
  private maxZoom = 3;
  private panning = false;
  private panStart = new Point();
  private editMode: MapEditMode = "edit";
  private repositionDragging = false;
  private repositionLastGlobal = new Point();
  private spacePressed = false;
  private mapEpoch = "";
  private defaultYear = 2200;
  private viewYear = 2200;
  private bulkLoadingMap = false;
  private presentSnapshots = new Map<string, NodePresentSnapshot>();
  private showFacilityIcons = true;
  private showNodeLabels = true;
  private showFleets = true;
  private mapProfile: MapProfileId = "galaxy";
  private playMode = false;
  private showAdventureOverlay = true;
  private adventureStates = new Map<string, AdventureNodeState>();
  private playProgress: PlayProgress = emptyPlayProgress();
  constructor() {
    super();
    this.cullable = false;
    this.world.cullable = false;
    this.addChild(this.world);
    this.mapHitPlane = new Graphics();
    this.mapHitPlane.eventMode = "static";
    this.mapHitPlane.label = "MapHitPlane";
    this.drawMapHitPlane();
    this.backgroundLayer = new Container();
    this.backgroundLayer.cullable = false;
    this.backgroundLayer.label = "BackgroundLayer";
    this.backgroundLayer.eventMode = "none";
    this.nodeLayer = new Container();
    this.nodeLayer.label = "NodeLayer";
    this.connectionLayer = new Container();
    this.connectionLayer.label = "ConnectionLayer";
    this.territoryLayer = new Container();
    this.territoryLayer.label = "TerritoryLayer";
    this.territoryRenderer = new TerritoryRenderer(this.territoryLayer);
    this.world.addChild(this.mapHitPlane);
    this.world.addChild(this.backgroundLayer);
    this.world.addChild(this.territoryLayer);
    this.world.addChild(this.connectionLayer);
    this.world.addChild(this.nodeLayer);

    this.eventMode = "static";

    this.updateLayerInteraction();
    this.setupViewportPanKeys();
    this.setupBackgroundInteraction();
    selectionManager.on("connection:request", (a, b) => {
      this.createConnection(a, b);
    });
    selectionManager.on("node:delete", (node) => {
      this.deleteNode(node);
    });

    this.on("pointerdown", (event) => {
      if (this.isUiTarget(event)) return;
      if (!this.shouldStartViewportPan(event)) return;

      this.panning = true;
      this.panStart.copyFrom(event.global);
      event.stopPropagation();
    });

    this.on("pointermove", (event) => {
      if (!this.panning || this.repositionDragging) return;
      if (!this.isViewportPanHeld(event)) {
        this.panning = false;
        return;
      }

      const current = event.global;
      const dx = current.x - this.panStart.x;
      const dy = current.y - this.panStart.y;

      this.world.position.x += dx;
      this.world.position.y += dy;

      this.panStart.copyFrom(current);
    });

    this.on("pointerup", (event) => {
      if (event.button === 0 || event.button === 1) this.panning = false;
    });

    this.on("pointerupoutside", (event) => {
      if (event.button === 0 || event.button === 1) this.panning = false;
    });
  }

  private setupViewportPanKeys() {
    window.addEventListener("keydown", (event) => {
      if (event.code !== "Space") return;
      if (isTypingInFormField(event)) return;

      this.spacePressed = true;
      event.preventDefault();
    });
    window.addEventListener("keyup", (event) => {
      if (event.code !== "Space") return;
      if (isTypingInFormField(event)) return;

      this.spacePressed = false;
      this.panning = false;
    });
    window.addEventListener("blur", () => {
      this.spacePressed = false;
      this.panning = false;
    });
  }

  private shouldStartViewportPan(event: FederatedPointerEvent): boolean {
    if (event.button === 1) return true;
    return event.button === 0 && this.spacePressed;
  }

  private isViewportPanHeld(event: FederatedPointerEvent): boolean {
    if (event.buttons & 4) return true;
    return !!(event.buttons & 1) && this.spacePressed;
  }

  public getSystems(): NodeSystem[] {
    return this.systems;
  }

  public getConnections(): SystemConnection[] {
    return this.connections;
  }

  public getConnectionLines(): ConnectionLine[] {
    return this.connectionLines;
  }

  public getCalendar(): MapCalendar {
    return { epoch: this.mapEpoch, defaultYear: this.defaultYear };
  }

  public setCalendar(epoch: string, defaultYear: number) {
    this.mapEpoch = epoch;
    this.defaultYear = Number.isFinite(defaultYear) ? Math.round(defaultYear) : 2200;
    if (this.viewYear < this.defaultYear) {
      this.setViewYear(this.defaultYear);
    }
    document.dispatchEvent(
      new CustomEvent("calendar:changed", {
        detail: { epoch: this.mapEpoch, defaultYear: this.defaultYear },
      }),
    );
  }

  public getViewYear(): number {
    return this.viewYear;
  }

  public getPresentYear(): number {
    return getMaxTimelineYear(
      this.systems.map((n) => n.data),
      this.defaultYear
    );
  }

  public isViewingPresent(): boolean {
    return this.viewYear >= this.getPresentYear();
  }

  public setViewYear(year: number) {
    const y = Math.round(Number(year));
    if (!Number.isFinite(y)) return;
    this.viewYear = y;
    this.applyTimelineView();
    document.dispatchEvent(
      new CustomEvent("viewYear:changed", { detail: { year: this.viewYear } })
    );
  }

  private capturePresentSnapshots() {
    this.presentSnapshots.clear();
    for (const node of this.systems) {
      this.presentSnapshots.set(node.data.id, {
        owner: node.data.owner,
        occupiedBy: node.data.occupiedBy,
        population: node.data.population,
        isCapital: node.data.isCapital,
        fleets: node.data.fleets
          ? node.data.fleets.map((f) => ({ ...f }))
          : undefined,
      });
    }
  }

  private restorePresentSnapshots() {
    for (const node of this.systems) {
      const snap = this.presentSnapshots.get(node.data.id);
      if (!snap) continue;
      node.data.owner = snap.owner;
      node.data.occupiedBy = snap.occupiedBy;
      node.data.population = snap.population;
      node.data.isCapital = snap.isCapital;
      node.data.fleets = snap.fleets
        ? snap.fleets.map((f) => ({ ...f }))
        : undefined;
      node.visible = true;
      node.eventMode = "static";
      node.applyDisplayFromData();
    }
    this.presentSnapshots.clear();
  }

  public applyTimelineView() {
    const presentYear = this.getPresentYear();
    recomputeOwnerCapitalOrigins(this.systems.map((n) => n.data));

    const states = new Map<string, SystemBaseline>();
    for (const node of this.systems) {
      states.set(
        node.data.id,
        getDisplayStateAtYear(node.data, this.viewYear, presentYear),
      );
    }
    applyGlobalFleetTransfers(
      states,
      this.systems.map((n) => n.data),
      this.viewYear,
    );

    for (const node of this.systems) {
      const state = states.get(node.data.id);
      if (state) node.applyViewState(state);
    }

    this.refreshConnectionVisuals();

    for (const line of this.connectionLines) {
      line.visible =
        line.fromNode.visible &&
        line.toNode.visible &&
        line.isRouteOpenAtViewYear();
    }

    this.regenerateTerritories();
    this.applyAdventureView();
    document.dispatchEvent(new CustomEvent("map:updated"));
  }

  public getMapProfile(): MapProfileId {
    return this.mapProfile;
  }

  public setMapProfile(profile: MapProfileId) {
    this.mapProfile = normalizeMapProfile(profile);
    document.dispatchEvent(new CustomEvent("mapProfile:changed"));
    this.applyAdventureView();
  }

  public getPlayMode(): boolean {
    return this.playMode;
  }

  /** Demo mode or play mode — structural edits disabled. */
  public isEditorLocked(): boolean {
    return isDemoMode() || this.playMode;
  }

  public setPlayMode(on: boolean) {
    this.playMode = on;
    this.applyTimelineView();
    document.dispatchEvent(new CustomEvent("playMode:changed"));
  }

  public getShowAdventureOverlay(): boolean {
    return this.showAdventureOverlay;
  }

  public setShowAdventureOverlay(on: boolean) {
    this.showAdventureOverlay = on;
    this.applyAdventureView();
  }

  public getAdventureState(nodeId: string): AdventureNodeState | undefined {
    return this.adventureStates.get(nodeId);
  }

  public isNodeAdventureAccessible(nodeId: string): boolean {
    const state = this.adventureStates.get(nodeId);
    if (!this.playMode) return true;
    if (state?.visibility === "hidden") return false;
    return state?.unlocked ?? true;
  }

  public getPlayProgress(): PlayProgress {
    return this.playProgress;
  }

  public getMergedAdventure(nodeId: string): NodeAdventure | undefined {
    const node = this.systems.find((n) => n.data.id === nodeId);
    if (!node?.data.adventure) return undefined;
    if (!this.playMode) return node.data.adventure;
    return mergeAdventureWithProgress(
      node.data.adventure,
      this.playProgress,
      nodeId,
    );
  }

  public setNodePlayProgress(
    nodeId: string,
    progress: PlayMilestoneProgress | undefined,
  ) {
    const milestones = { ...this.playProgress.milestones };
    if (!progress) {
      delete milestones[nodeId];
    } else {
      milestones[nodeId] = progress;
    }
    this.playProgress = { ...this.playProgress, milestones };
    this.applyTimelineView();
  }

  public clearPlayProgress() {
    this.playProgress = emptyPlayProgress();
    this.applyTimelineView();
    document.dispatchEvent(new CustomEvent("playProgress:cleared"));
  }

  public importPlayProgress(progress: PlayProgress) {
    this.playProgress = {
      version: 1,
      milestones: { ...progress.milestones },
    };
    this.applyTimelineView();
    document.dispatchEvent(new CustomEvent("map:updated"));
    document.dispatchEvent(new CustomEvent("playProgress:imported"));
  }

  private applyAdventureView() {
    this.adventureStates = computeAdventureStates(
      this.systems.map((n) => n.data),
      this.connections,
      this.playMode,
      this.playProgress,
    );

    for (const node of this.systems) {
      const state = this.adventureStates.get(node.data.id);

      if (this.playMode && state?.visibility === "hidden") {
        node.visible = false;
        node.eventMode = "none";
        node.applyAdventureVisual(null);
        continue;
      }

      if (!node.visible) {
        node.applyAdventureVisual(null);
        continue;
      }
      const designHidden = !this.playMode && !!node.data.adventure?.hidden;
      if (!this.showAdventureOverlay && !this.playMode && !designHidden) {
        node.applyAdventureVisual(null);
      } else {
        let visualState = state ?? null;
        if (designHidden) {
          visualState = { visibility: "hidden", unlocked: true };
        }
        node.applyAdventureVisual(visualState);
      }
    }

    for (const line of this.connectionLines) {
      const fromOk =
        line.fromNode.visible &&
        (!this.playMode || this.isNodeAdventureAccessible(line.fromNode.data.id));
      const toOk =
        line.toNode.visible &&
        (!this.playMode || this.isNodeAdventureAccessible(line.toNode.data.id));
      line.visible = fromOk && toOk && line.isRouteOpenAtViewYear();
      if (this.playMode) {
        line.alpha = line.visible ? 1 : 0;
      } else {
        line.alpha = 1;
      }
    }
  }

  public getConnectionById(id: string): SystemConnection | undefined {
    return this.connections.find((c) => c.id === id);
  }

  public updateConnection(conn: SystemConnection) {
    const idx = this.connections.findIndex((c) => c.id === conn.id);
    if (idx >= 0) this.connections[idx] = conn;
    this.refreshConnectionVisuals();
    if (this.isViewingPresent()) {
      syncPresentRouteStatus(conn, this.getPresentYear());
    }
  }

  public refreshConnectionVisuals() {
    for (const line of this.connectionLines) {
      line.redraw();
    }
  }

  public getZoom(): number {
    return this.zoom;
  }

  public refreshLabelResolution() {
    const resolution = Math.max(2, (window.devicePixelRatio || 1) * this.zoom);
    this.systems.forEach((node) => node.refreshMapOverlays(this.zoom, resolution));
  }

  public async onAtlasReady(): Promise<void> {
    if (!isAtlasNodeVisualEnabled()) return;
    const { preloadFactionEmblems } = await import("../galaxy/factionEmblems");
    const ownerIds = [...ownerManager.getAll().map((o) => o.id)];
    await preloadFactionEmblems(ownerIds);
    for (const node of this.systems) {
      await node.applyAtlasVisual();
    }
    this.refreshLabelResolution();
  }

  public getShowFacilityIcons(): boolean {
    return this.showFacilityIcons;
  }

  public getShowNodeLabels(): boolean {
    return this.showNodeLabels;
  }

  public setShowFacilityIcons(value: boolean) {
    this.showFacilityIcons = value;
    this.refreshLabelResolution();
  }

  public setShowNodeLabels(value: boolean) {
    this.showNodeLabels = value;
    this.refreshLabelResolution();
  }

  public getShowFleets(): boolean {
    return this.showFleets;
  }

  public setShowFleets(value: boolean) {
    this.showFleets = value;
    this.refreshLabelResolution();
  }

  public getMapBounds(): Rectangle {
    const b = this.world.getBounds();
    if (b.width > 0 && b.height > 0) {
      return new Rectangle(b.minX, b.minY, b.width, b.height);
    }
    return new Rectangle(-400, -300, 800, 600);
  }

  public clearCapitalForOwner(ownerId: string, except: NodeSystem) {
    for (const node of this.systems) {
      if (node === except) continue;
      if (node.data.owner !== ownerId) continue;
      if (!node.data.isCapital) continue;
      node.data.isCapital = false;
      node.updateCapitalVisual();
      node.updateStatusLabel();
    }
  }

  public regenerateTerritories() {
    this.territoryRenderer.rebuild(this.systems);
  }

  public deleteSelectedConnection() {
    if (this.isEditorLocked()) return;

    const selectedLine = selectionManager.selectedConnection;
    if (!selectedLine) return;

    const snapshot = this.connections.find(
      (conn) => conn.id === selectedLine.connectionId,
    );
    if (!snapshot) return;

    this.connections = this.connections.filter(
      (conn) => conn.id !== selectedLine.connectionId,
    );

    this.connectionLines = this.connectionLines.filter((line) => {
      if (line === selectedLine) {
        line.removeAllListeners();
        line.destroy();
        return false;
      }
      return true;
    });

    selectionManager.clearConnection();
    document.dispatchEvent(
      new CustomEvent("connection:deleted", {
        detail: { connection: structuredClone(snapshot) },
      }),
    );
    document.dispatchEvent(new CustomEvent("map:updated"));
  }

  public setEditMode(mode: MapEditMode | string) {
    this.editMode = this.normalizeEditMode(mode);
    this.panning = false;
    this.endRepositionDrag();
    this.updateLayerInteraction();
    this.updateEditModeCursor();
  }

  private normalizeEditMode(mode: MapEditMode | string): MapEditMode {
    if (mode === "move-background" || mode === "moveBackground") return "moveBackground";
    if (mode === "move-nodes" || mode === "moveNodes") return "moveNodes";
    return "edit";
  }

  private updateLayerInteraction() {
    const moveMode = this.editMode !== "edit";
    this.territoryLayer.eventMode = moveMode ? "none" : "passive";
    this.connectionLayer.eventMode = moveMode ? "none" : "passive";
    this.connectionLines.forEach((line) => {
      line.eventMode = moveMode ? "none" : "static";
    });
  }

  public getEditMode(): MapEditMode {
    return this.editMode;
  }

  private updateEditModeCursor() {
    if (this.editMode === "edit") {
      this.cursor = "default";
      return;
    }
    this.cursor = this.repositionDragging ? "grabbing" : "grab";
  }

  private drawMapHitPlane() {
    const extent = 50000;
    this.mapHitPlane.clear();
    this.mapHitPlane
      .rect(-extent, -extent, extent * 2, extent * 2)
      .fill({ color: 0x000000, alpha: 0.001 });
  }

  private isUiTarget(event: FederatedPointerEvent): boolean {
    const htmlTarget = event.nativeEvent.target as HTMLElement;
    return !!htmlTarget.closest(
      "#ui-wrapper, #year-scrubber, #map-viewport-hud, #map-view-toggles, #startup-overlay",
    );
  }

  private isMapEntityTarget(target: unknown): boolean {
    let node = target as { parent?: unknown; isSystemNode?: boolean } | null;
    while (node) {
      if (node.isSystemNode || node instanceof ConnectionLine) return true;
      node = node.parent as typeof node;
    }
    return false;
  }

  private setupBackgroundInteraction() {
    this.on("pointerdown", (event: FederatedPointerEvent) => {
      if (event.button !== 0) return;
      if (this.isUiTarget(event)) return;
      if (this.spacePressed || this.panning) return;

      if (this.editMode === "edit") {
        if (this.isEditorLocked()) return;
        if (this.isMapEntityTarget(event.target)) return;

        const pos = this.world.toLocal(event.global);
        this.createNode({
          id: crypto.randomUUID(),
          name: "New System",
          starType: "G",
          owner: "none",
          x: pos.x,
          y: pos.y,
        });
        return;
      }

      this.beginRepositionDrag(event);
    });
  }

  private onRepositionMove = (event: FederatedPointerEvent) => {
    if (!this.repositionDragging || this.panning) return;

    const dx = (event.global.x - this.repositionLastGlobal.x) / this.world.scale.x;
    const dy = (event.global.y - this.repositionLastGlobal.y) / this.world.scale.y;

    if (dx === 0 && dy === 0) return;

    if (this.editMode === "moveBackground") {
      this.translateBackground(dx, dy);
    } else if (this.editMode === "moveNodes") {
      this.translateAllNodes(dx, dy);
    }

    this.repositionLastGlobal.copyFrom(event.global);
  };

  private onRepositionEnd = () => {
    this.off("pointermove", this.onRepositionMove);
    this.off("pointerup", this.onRepositionEnd);
    this.off("pointerupoutside", this.onRepositionEnd);
    this.endRepositionDrag();
  };

  public beginRepositionDrag(event: FederatedPointerEvent) {
    if (event.button !== 0) return;
    if (this.isEditorLocked()) return;
    if (this.spacePressed || this.panning) return;
    if (this.editMode === "edit") return;
    if (this.editMode === "moveBackground" && !this.hasBackground()) return;
    if (this.editMode === "moveNodes" && this.systems.length === 0) return;

    this.repositionDragging = true;
    this.repositionLastGlobal.copyFrom(event.global);
    this.updateEditModeCursor();
    this.on("pointermove", this.onRepositionMove);
    this.on("pointerup", this.onRepositionEnd);
    this.on("pointerupoutside", this.onRepositionEnd);
    event.stopPropagation();
  }

  private endRepositionDrag() {
    if (!this.repositionDragging) return;
    this.repositionDragging = false;
    this.off("pointermove", this.onRepositionMove);
    this.off("pointerup", this.onRepositionEnd);
    this.off("pointerupoutside", this.onRepositionEnd);
    this.updateEditModeCursor();
  }

  private translateBackground(dx: number, dy: number) {
    if (!this.backgroundSprite || !this.backgroundData) return;

    this.backgroundSprite.x += dx;
    this.backgroundSprite.y += dy;
    this.backgroundData.x = this.backgroundSprite.x;
    this.backgroundData.y = this.backgroundSprite.y;
  }

  private translateAllNodes(dx: number, dy: number) {
    this.systems.forEach((node) => {
      node.position.x += dx;
      node.position.y += dy;
      node.data.x = node.position.x;
      node.data.y = node.position.y;
      node.emit("nodeMoved");
    });
    this.regenerateTerritories();
  }

  private createNode(systemData?: SystemData) {
    const node = new NodeSystem(systemData?.x ?? 0, systemData?.y ?? 0, 0x3498db, this, {
      id: systemData?.id || crypto.randomUUID(),
      name: systemData?.name || "New System",
      starType: systemData?.starType || "G",
      owner: systemData?.owner || "none",
      description: systemData?.description || "",
      population: parsePopulationToInt(systemData?.population as string | number | undefined),
      capital: systemData?.capital || "",
      isCapital: resolveIsCapital(systemData),
      x: systemData?.x ?? 0,
      y: systemData?.y ?? 0,
      size: systemData?.size ?? 1,
      occupiedBy: systemData?.occupiedBy,
      timeline: systemData?.timeline ? [...systemData.timeline] : undefined,
      facilities: normalizeFacilities(systemData?.facilities),
      fleets: normalizeFleets(systemData?.fleets),
      adventure: normalizeAdventure(systemData?.adventure),
    });
    node.setOwner(node.data.owner);
    this.nodeLayer.addChild(node);
    this.systems.push(node);
    if (!this.bulkLoadingMap) {
      this.applyTimelineView();
      document.dispatchEvent(
        new CustomEvent("node:created", { detail: { nodeId: node.data.id } }),
      );
      document.dispatchEvent(new CustomEvent("map:updated"));
    }
    return node;
  }

  public getNodeById(id: string): NodeSystem | undefined {
    return this.systems.find((n) => n.data.id === id);
  }

  public focusOnNode(node: NodeSystem, targetZoom?: number) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const zoom = targetZoom ?? Math.min(this.maxZoom, Math.max(this.getZoom(), 1.1));
    this.zoom = zoom;
    this.world.scale.set(zoom);
    this.world.position.x = w / 2 - node.x * zoom;
    this.world.position.y = h / 2 - node.y * zoom;
    this.refreshLabelResolution();
  }

  public duplicateNodeFromData(
    data: SystemData,
    offset = { x: 0, y: 0 },
  ): NodeSystem | undefined {
    if (this.isEditorLocked()) return undefined;
    const copy = structuredClone(data);
    copy.id = crypto.randomUUID();
    copy.x = (copy.x ?? 0) + offset.x;
    copy.y = (copy.y ?? 0) + offset.y;
    const adv = copy.adventure ? normalizeAdventure(copy.adventure) : undefined;
    if (adv) {
      delete adv.completed;
      adv.encounters?.forEach((enc) => {
        delete enc.completed;
      });
      copy.adventure = adv;
    }
    return this.createNode(copy);
  }

  public duplicateNode(
    source: NodeSystem,
    offset = { x: 24, y: 24 },
  ): NodeSystem | undefined {
    if (this.isEditorLocked()) return undefined;
    const data = structuredClone(source.data);
    data.name = `${data.name} copy`;
    return this.duplicateNodeFromData(data, offset);
  }

  public renameNodeId(oldId: string, newId: string): boolean {
    if (this.isEditorLocked()) return false;
    const trimmed = newId.trim();
    if (!trimmed || trimmed === oldId) return false;
    if (this.getNodeById(trimmed)) return false;

    const node = this.getNodeById(oldId);
    if (!node) return false;

    node.data.id = trimmed;
    for (const conn of this.connections) {
      if (conn.from === oldId) conn.from = trimmed;
      if (conn.to === oldId) conn.to = trimmed;
    }
    for (const sys of this.systems) {
      const requires = sys.data.adventure?.unlockRequires;
      if (!requires?.length) continue;
      sys.data.adventure!.unlockRequires = requires.map((id) =>
        id === oldId ? trimmed : id,
      );
    }
    if (this.playProgress.milestones[oldId]) {
      const milestones = { ...this.playProgress.milestones };
      milestones[trimmed] = milestones[oldId];
      delete milestones[oldId];
      this.playProgress = { ...this.playProgress, milestones };
    }
    this.applyTimelineView();
    document.dispatchEvent(new CustomEvent("map:updated"));
    return true;
  }

  public restoreNode(data: SystemData, connections: SystemConnection[]) {
    if (this.getNodeById(data.id)) return;
    this.createNode(structuredClone(data));
    for (const raw of connections) {
      const conn = normalizeConnection(raw);
      const fromNode = this.getNodeById(conn.from);
      const toNode = this.getNodeById(conn.to);
      if (fromNode && toNode) {
        this.createConnection(fromNode, toNode, conn);
      }
    }
    this.applyTimelineView();
    document.dispatchEvent(new CustomEvent("map:updated"));
  }

  public deleteNode(node: NodeSystem) {
    if (this.isEditorLocked()) return;

    const snapshot = structuredClone(node.data);
    const relatedConnections = this.connections
      .filter((conn) => conn.from === node.data.id || conn.to === node.data.id)
      .map((conn) => structuredClone(conn));

    // 1️⃣ Borrar conexiones de DATA
    this.connections = this.connections.filter((conn) => conn.from !== node.data.id && conn.to !== node.data.id);

    // 2️⃣ Borrar líneas visuales
    this.connectionLines = this.connectionLines.filter((line) => {
      if (line.fromNode === node || line.toNode === node) {
        line.destroy();
        return false;
      }
      return true;
    });

    // 3️⃣ Sacar nodo del array
    this.systems = this.systems.filter((n) => n !== node);

    // 4️⃣ Destruir nodo visual
    node.destroy();

    this.regenerateTerritories();
    document.dispatchEvent(
      new CustomEvent("node:deleted", {
        detail: { data: snapshot, connections: relatedConnections },
      }),
    );
    document.dispatchEvent(new CustomEvent("node:deselected"));
    document.dispatchEvent(new CustomEvent("map:updated"));
  }

  public createConnection(nodeA: NodeSystem, nodeB: NodeSystem, data?: SystemConnection) {
    if (this.isEditorLocked() && !data) return;

    const exists = this.connections.some(
      (c) =>
        connectionKey(c.from, c.to) ===
        connectionKey(nodeA.data.id, nodeB.data.id),
    );

    if (exists) return;

    const conn =
      data ??
      normalizeConnection({
        from: nodeA.data.id,
        to: nodeB.data.id,
      });
    this.addConnectionLine(conn, nodeA, nodeB);
  }

  private addConnectionLine(
    conn: SystemConnection,
    nodeA: NodeSystem,
    nodeB: NodeSystem,
  ) {
    this.connections.push(conn);
    const line = new ConnectionLine(nodeA, nodeB, conn.id);
    line.eventMode = this.editMode !== "edit" ? "none" : "static";
    this.connectionLayer.addChild(line);
    this.connectionLines.push(line);
    this.refreshConnectionVisuals();
    if (!this.bulkLoadingMap) {
      document.dispatchEvent(
        new CustomEvent("connection:created", {
          detail: { connection: structuredClone(conn) },
        }),
      );
    }
  }

  public hasBackground(): boolean {
    return this.backgroundSprite !== null;
  }

  public getBackgroundAlpha(): number {
    return this.backgroundData?.alpha ?? 1;
  }

  public async setBackgroundFromFile(file: File): Promise<void> {
    if (isDemoMode()) return;
    const dataUrl = await this.readFileAsDataUrl(file);
    await this.setBackground({
      dataUrl,
      x: 0,
      y: 0,
      scale: 1,
      alpha: this.backgroundData?.alpha ?? 1,
    });
  }

  public async setBackground(data: GalaxyBackgroundData): Promise<void> {
    this.removeBackgroundSprite();

    const texture = await Assets.load(resolveBackgroundSource(data));
    if (texture.source) {
      texture.source.style.addressMode = "clamp-to-edge";
    }
    const sprite = new Sprite(texture);
    sprite.cullable = false;
    sprite.anchor.set(0.5);
    sprite.position.set(data.x, data.y);
    sprite.scale.set(data.scale);
    sprite.alpha = data.alpha;
    sprite.eventMode = "none";

    this.backgroundLayer.addChild(sprite);
    this.backgroundSprite = sprite;
    this.backgroundData = { ...data };
  }

  public setBackgroundAlpha(alpha: number): void {
    if (!this.backgroundSprite || !this.backgroundData) return;
    const clamped = Math.max(0.05, Math.min(1, alpha));
    this.backgroundSprite.alpha = clamped;
    this.backgroundData.alpha = clamped;
  }

  public removeBackground(): void {
    this.removeBackgroundSprite();
    this.backgroundData = null;
  }

  private removeBackgroundSprite(): void {
    if (!this.backgroundSprite) return;
    const texture = this.backgroundSprite.texture;
    this.backgroundSprite.destroy();
    this.backgroundSprite = null;
    if (texture && !texture.destroyed) {
      texture.destroy(true);
    }
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  public countOwnerUsage(ownerId: string): number {
    return this.systems.filter((node) => {
      if (node.data.owner === ownerId) return true;
      if (node.data.occupiedBy === ownerId) return true;
      if (node.data.timeline?.some((e) => e.actorId === ownerId)) return true;
      return false;
    }).length;
  }

  public remapOwnerReferences(fromId: string, toId: string) {
    for (const node of this.systems) {
      if (node.data.owner === fromId) {
        node.data.owner = toId;
        node.setOwner(toId);
      }
      if (node.data.occupiedBy === fromId) {
        if (toId === ownerManager.defaultOwnerId) {
          node.setOccupiedBy(null);
        } else {
          node.setOccupiedBy(toId);
        }
      }
      if (node.data.timeline) {
        for (const entry of node.data.timeline) {
          if (entry.actorId === fromId) entry.actorId = toId;
        }
      }
    }
  }

  public refreshAllOwnerVisuals() {
    for (const node of this.systems) {
      node.updateOwnerVisual();
      node.updateOccupationVisual();
      node.updateCapitalVisual();
      node.updateStatusLabel();
    }
    this.regenerateTerritories();
    this.refreshLabelResolution();
  }

  public getMapData() {
    return {
      version: 1,
      systems: this.systems.map((node) => node.data),
      connections: this.connections ?? [],
      owners: ownerManager.exportJSON(),
      background: this.backgroundData ?? undefined,
      metadata: {
        createdAt: Date.now(),
        epoch: this.mapEpoch || undefined,
        defaultYear: this.defaultYear,
        viewYear: this.viewYear,
        profile: this.mapProfile,
        playMode: this.playMode,
        playProgress: this.playProgress,
      },
    };
  }
  public clearMap() {
    this.systems.forEach((node) => node.destroy());
    this.systems = [];

    this.connectionLines.forEach((line) => {
      line.removeAllListeners();
      line.destroy();
    });
    this.connectionLines = [];
    this.connections = [];

    this.presentSnapshots.clear();
    this.playProgress = emptyPlayProgress();
    this.regenerateTerritories();
    selectionManager.clear();
  }

  public async loadMapData(data: unknown): Promise<boolean> {
    if (!data || typeof data !== "object") {
      console.error("Invalid map format: not an object");
      return false;
    }

    const map = data as {
      systems?: SystemData[];
      connections?: SystemConnection[];
      owners?: import("../galaxy/OwnerManager").OwnerJSON[];
      background?: GalaxyBackgroundData;
      metadata?: {
        epoch?: string;
        defaultYear?: number;
        viewYear?: number;
        profile?: MapProfileId;
        playMode?: boolean;
        playProgress?: PlayProgress;
      };
    };

    if (!Array.isArray(map.systems)) {
      console.error("Invalid map format: missing systems array");
      return false;
    }

    try {
      document.dispatchEvent(new CustomEvent("map:loading"));
      this.clearMap();

      if (map.metadata) {
        const epoch = map.metadata.epoch ?? "";
        const importedDefault =
          map.metadata.defaultYear !== undefined &&
          map.metadata.defaultYear !== null &&
          Number.isFinite(Number(map.metadata.defaultYear))
            ? Math.round(Number(map.metadata.defaultYear))
            : this.defaultYear;
        this.setCalendar(epoch, importedDefault);

        const importedView =
          map.metadata.viewYear !== undefined &&
          map.metadata.viewYear !== null &&
          Number.isFinite(Number(map.metadata.viewYear))
            ? Math.round(Number(map.metadata.viewYear))
            : this.defaultYear;
        this.setViewYear(importedView);

        this.mapProfile = normalizeMapProfile(map.metadata.profile);
        this.setPlayMode(
          resolveImportedPlayMode(this.mapProfile, map.metadata.playMode),
        );
      } else {
        this.setViewYear(this.defaultYear);
        this.mapProfile = "galaxy";
        this.setPlayMode(false);
      }
      document.dispatchEvent(new CustomEvent("mapProfile:changed"));
      this.presentSnapshots.clear();

      if (Array.isArray(map.owners) && map.owners.length > 0) {
        ownerManager.loadFromJSON({ owners: map.owners });
      }

      let playProgress =
        map.metadata?.playProgress?.version === 1 &&
        map.metadata.playProgress.milestones
          ? {
              version: 1 as const,
              milestones: { ...map.metadata.playProgress.milestones },
            }
          : emptyPlayProgress();

      const presentYear = getMaxTimelineYear(map.systems, this.defaultYear);
      recomputeOwnerCapitalOrigins(map.systems);
      this.bulkLoadingMap = true;
      for (const sys of map.systems) {
        syncPresentFieldsFromTimeline(sys, presentYear);
        if (sys.adventure) {
          sys.adventure = normalizeAdventure(sys.adventure);
          const migrated = migrateProgressFromDesign(
            playProgress,
            sys.id,
            sys.adventure,
          );
          playProgress = migrated.progress;
          sys.adventure = migrated.design;
        }
        this.createNode(sys);
      }
      this.playProgress = playProgress;
      this.bulkLoadingMap = false;

      const connections = Array.isArray(map.connections) ? map.connections : [];
      for (const raw of connections) {
        const conn = normalizeConnection(raw);
        syncPresentRouteStatus(conn, presentYear);
        const fromNode = this.systems.find((n) => n.data.id === conn.from);
        const toNode = this.systems.find((n) => n.data.id === conn.to);
        if (fromNode && toNode) {
          this.createConnection(fromNode, toNode, conn);
        }
      }

      this.regenerateTerritories();

      if (map.background?.dataUrl || map.background?.src) {
        await this.setBackground(map.background);
      } else {
        this.removeBackground();
      }

      this.applyTimelineView();
      document.dispatchEvent(new CustomEvent("map:loaded"));
      return true;
    } catch (err) {
      console.error("Failed to load map data", err);
      return false;
    } finally {
      document.dispatchEvent(new CustomEvent("map:load-ended"));
    }
  }

  public enableZoom(canvas: HTMLCanvasElement) {
    canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
      
    const mousePosition = new Point(
      event.offsetX,
      event.offsetY
    );

    const worldPos = this.world.toLocal(mousePosition);

    const zoomSpeed = 0.1;
    const direction = event.deltaY > 0 ? -1 : 1;

    const newZoom = this.zoom + direction * zoomSpeed;
    const clampedZoom = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom));

    if (clampedZoom === this.zoom) return;

    this.zoom = clampedZoom;

    this.world.scale.set(this.zoom);

    const newScreenPos = this.world.toGlobal(worldPos);

    this.world.position.x += mousePosition.x - newScreenPos.x;
    this.world.position.y += mousePosition.y - newScreenPos.y;

    this.refreshLabelResolution();
  });
  }
}

function isTypingInFormField(event: KeyboardEvent): boolean {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;

  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function resolveIsCapital(data?: SystemData): boolean {
  if (data?.isCapital) return true;
  const legacy = (data?.capital ?? "").trim().toLowerCase();
  return legacy === "yes" || legacy === "true" || legacy === "1";
}

export const galaxyScene = new GalaxyScene();
