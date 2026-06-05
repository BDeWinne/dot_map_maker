import { Graphics } from "pixi.js";
import {
  ROUTE_TYPE_COLORS,
  type RouteType,
} from "../data/ConnectionTypes";
import { getRouteStatusAtYear } from "../data/routeState";
import { NodeSystem } from "./NodeSystem";
import { selectionManager } from "../editor/SelectionManager";
import { galaxyScene } from "../scene/GalaxyScene";

export class ConnectionLine extends Graphics {
  constructor(
    public fromNode: NodeSystem,
    public toNode: NodeSystem,
    public connectionId: string,
  ) {
    super();
    this.eventMode = "static";
    this.cursor = "pointer";

    this.on("pointerdown", (e) => {
      if (e.button === 0) {
        selectionManager.selectConnection(this);
      }
      if (e.button === 1) {
        e.preventDefault();
        e.stopPropagation();
        galaxyScene.deleteSelectedConnection();
      }
    });

    fromNode.on("nodeMoved", this.redraw, this);
    toNode.on("nodeMoved", this.redraw, this);
    this.redraw();
  }

  public isRouteOpenAtViewYear(): boolean {
    const conn = galaxyScene.getConnectionById(this.connectionId);
    if (!conn) return true;
    return getRouteStatusAtYear(conn, galaxyScene.getViewYear()) === "open";
  }

  public override destroy(options?: Parameters<Graphics["destroy"]>[0]) {
    this.fromNode.off("nodeMoved", this.redraw, this);
    this.toNode.off("nodeMoved", this.redraw, this);
    super.destroy(options);
  }

  public redraw() {
    this.clear();
    const conn = galaxyScene.getConnectionById(this.connectionId);
    const routeType: RouteType = conn?.routeType ?? "hyperlane";
    const open = this.isRouteOpenAtViewYear();
    const color = ROUTE_TYPE_COLORS[routeType];
    const alpha = open ? 0.95 : 0.35;
    const width = routeType === "military" ? 3 : 2;

    this.moveTo(this.fromNode.x, this.fromNode.y);
    this.lineTo(this.toNode.x, this.toNode.y);

    if (open) {
      this.stroke({ width, color, alpha });
    } else {
      this.stroke({ width, color, alpha, cap: "round" });
      const dx = this.toNode.x - this.fromNode.x;
      const dy = this.toNode.y - this.fromNode.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const steps = Math.max(4, Math.floor(len / 14));
      for (let i = 1; i < steps; i += 2) {
        const t = i / steps;
        const px = this.fromNode.x + dx * t;
        const py = this.fromNode.y + dy * t;
        this.moveTo(px - nx * 4, py - ny * 4);
        this.lineTo(px + nx * 4, py + ny * 4);
      }
      this.stroke({ width: 1.5, color: 0x888888, alpha: 0.7 });
    }

    if (selectionManager.selectedConnection === this) {
      this.moveTo(this.fromNode.x, this.fromNode.y);
      this.lineTo(this.toNode.x, this.toNode.y);
      this.stroke({ width: width + 2, color: 0xffff00, alpha: 0.45 });
    }
  }
}
