import { Assets, Container, FederatedPointerEvent, Graphics, Point, Rectangle, Sprite } from "pixi.js";
import { NodeSystem, SystemData } from "../galaxy/NodeSystem";
import { normalizeConnection, connectionKey, type SystemConnection } from "../data/ConnectionTypes";
import { applyGlobalFleetTransfers } from "../data/fleetMovement";
import { getRouteStatusAtYear, syncPresentRouteStatus } from "../data/routeState";
import { selectionManager, SelectionManager } from "../editor/SelectionManager";
import { ConnectionLine } from "../galaxy/ConnectionLine";
import { TerritoryRenderer } from "../galaxy/TerritoryRenderer";
import { nodeInspector } from "../ui/NodeInspector";
import { normalizeFacilities } from "../data/FacilityTypes";
import { normalizeFleets, type FleetPresence } from "../data/FleetTypes";
import { parsePopulationToInt } from "../data/population";
import { ownerManager } from "../galaxy/OwnerManager";
import {
  getDisplayStateAtYear,
  getMaxTimelineYear,
  recomputeOwnerCapitalOrigins,
  syncPresentFieldsFromTimeline,
  type SystemBaseline,
} from "../data/timelineState";
import type { MapCalendar } from "../data/TimelineTypes";

interface NodePresentSnapshot {
  owner: string;
  occupiedBy?: string;
  population?: number;
  isCapital?: boolean;
  fleets?: FleetPresence[];
}

export interface GalaxyBackgroundData {
  dataUrl: string;
  x: number;
  y: number;
  scale: number;
  alpha: number;
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
  private minZoom = 0.2;
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
    this.defaultYear = Number.isFinite(defaultYear) ? defaultYear : 2200;
    if (this.viewYear < this.defaultYear) {
      this.setViewYear(this.defaultYear);
    }
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
    document.dispatchEvent(new CustomEvent("map:updated"));
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

  public getShowFacilityIcons(): boolean {
    return this.showFacilityIcons;
  }

  public getShowNodeLabels(): boolean {
    return this.showNodeLabels;
  }

  public setShowFacilityIcons(value: boolean) {
    this.showFacilityIcons = value;
    for (const node of this.systems) node.updateFacilityIcons();
  }

  public setShowNodeLabels(value: boolean) {
    this.showNodeLabels = value;
    for (const node of this.systems) node.updateStatusLabel();
  }

  public getShowFleets(): boolean {
    return this.showFleets;
  }

  public setShowFleets(value: boolean) {
    this.showFleets = value;
    for (const node of this.systems) node.updateFleetMarkers();
  }

  public getMapBounds(): Rectangle {
    const b = this.world.getBounds();
    if (b.width > 0 && b.height > 0) {
      return new Rectangle(b.minX, b.minY, b.width, b.height);
    }
    return new Rectangle(-400, -300, 800, 600);
  }

  public refreshLabelResolution() {
    const resolution = Math.max(2, (window.devicePixelRatio || 1) * this.zoom);
    this.systems.forEach((node) => node.refreshTextResolution(resolution));
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
    const selectedLine = selectionManager.selectedConnection;
    if (!selectedLine) return;

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
    return !!htmlTarget.closest("#ui-wrapper, #year-scrubber");
  }

  private setupBackgroundInteraction() {
    this.on("pointerdown", (event: FederatedPointerEvent) => {
      if (event.button !== 0) return;
      if (this.isUiTarget(event)) return;
      if (this.spacePressed || this.panning) return;

      if (this.editMode === "edit") {
        if ((event.target as any)?.isSystemNode) return;

        const pos = this.world.toLocal(event.global);
        this.createNode({
          id: crypto.randomUUID(),
          name: "New System",
          starType: "G",
          owner: "None",
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
      owner: systemData?.owner || "None",
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
    });
    node.setOwner(node.data.owner);
    this.nodeLayer.addChild(node);
    this.systems.push(node);
    if (!this.bulkLoadingMap) {
      this.applyTimelineView();
    }
  }

  deleteNode(node: NodeSystem) {
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
    nodeInspector.clear();
    document.dispatchEvent(new CustomEvent("map:updated"));
  }

  public createConnection(nodeA: NodeSystem, nodeB: NodeSystem, data?: SystemConnection) {
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
  }

  public hasBackground(): boolean {
    return this.backgroundSprite !== null;
  }

  public getBackgroundAlpha(): number {
    return this.backgroundData?.alpha ?? 1;
  }

  public async setBackgroundFromFile(file: File): Promise<void> {
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

    const texture = await Assets.load(data.dataUrl);
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
    this.regenerateTerritories();
    selectionManager.clear();
    nodeInspector.clear();
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
      metadata?: { epoch?: string; defaultYear?: number; viewYear?: number };
    };

    if (!Array.isArray(map.systems)) {
      console.error("Invalid map format: missing systems array");
      return false;
    }

    try {
      this.clearMap();

      if (map.metadata) {
        this.setCalendar(map.metadata.epoch ?? "", map.metadata.defaultYear ?? 2200);
        this.viewYear = map.metadata.viewYear ?? this.defaultYear;
      } else {
        this.viewYear = this.defaultYear;
      }
      this.presentSnapshots.clear();

      if (Array.isArray(map.owners) && map.owners.length > 0) {
        ownerManager.loadFromJSON({ owners: map.owners });
      }

      const presentYear = getMaxTimelineYear(map.systems, this.defaultYear);
      recomputeOwnerCapitalOrigins(map.systems);
      this.bulkLoadingMap = true;
      for (const sys of map.systems) {
        syncPresentFieldsFromTimeline(sys, presentYear);
        this.createNode(sys);
      }
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

      if (map.background?.dataUrl) {
        await this.setBackground(map.background);
      } else {
        this.removeBackground();
      }

      this.applyTimelineView();
      this.refreshLabelResolution();
      document.dispatchEvent(new CustomEvent("map:loaded"));
      return true;
    } catch (err) {
      console.error("Failed to load map data", err);
      return false;
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
