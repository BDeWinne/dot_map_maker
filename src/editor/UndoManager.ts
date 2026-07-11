import type { SystemConnection } from "../data/ConnectionTypes";
import type { SystemData } from "../galaxy/NodeSystem";
import { selectionManager } from "./SelectionManager";
import { galaxyScene } from "../scene/GalaxyScene";
import { normalizeConnection } from "../data/ConnectionTypes";
import { isDemoMode } from "../config/demoMode";

type UndoAction =
  | { type: "create_node"; nodeId: string; data: SystemData }
  | { type: "delete_node"; data: SystemData; connections: SystemConnection[] }
  | {
      type: "move_node";
      nodeId: string;
      from: { x: number; y: number };
      to: { x: number; y: number };
    }
  | { type: "create_connection"; connection: SystemConnection }
  | { type: "delete_connection"; connection: SystemConnection }
  | { type: "patch_node"; nodeId: string; before: SystemData; after: SystemData };

function isTextInputTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return target.isContentEditable;
}

export class UndoManager {
  private undoStack: UndoAction[] = [];
  private redoStack: UndoAction[] = [];
  private applying = false;
  private clipboard: SystemData | null = null;
  private readonly maxStack = 60;

  public init() {
    if (isDemoMode()) return;

    document.addEventListener("node:created", ((e: CustomEvent<{ nodeId: string }>) => {
      if (this.applying) return;
      const node = galaxyScene.getNodeById(e.detail.nodeId);
      if (!node) return;
      this.push({
        type: "create_node",
        nodeId: e.detail.nodeId,
        data: structuredClone(node.data),
      });
    }) as EventListener);

    document.addEventListener(
      "node:deleted",
      ((
        e: CustomEvent<{ data: SystemData; connections: SystemConnection[] }>,
      ) => {
        if (this.applying) return;
        this.push({
          type: "delete_node",
          data: structuredClone(e.detail.data),
          connections: structuredClone(e.detail.connections),
        });
      }) as EventListener,
    );

    document.addEventListener(
      "node:moved",
      ((
        e: CustomEvent<{
          nodeId: string;
          from: { x: number; y: number };
          to: { x: number; y: number };
        }>,
      ) => {
        if (this.applying) return;
        this.push({
          type: "move_node",
          nodeId: e.detail.nodeId,
          from: { ...e.detail.from },
          to: { ...e.detail.to },
        });
      }) as EventListener,
    );

    document.addEventListener(
      "connection:created",
      ((e: CustomEvent<{ connection: SystemConnection }>) => {
        if (this.applying) return;
        this.push({
          type: "create_connection",
          connection: structuredClone(e.detail.connection),
        });
      }) as EventListener,
    );

    document.addEventListener(
      "connection:deleted",
      ((e: CustomEvent<{ connection: SystemConnection }>) => {
        if (this.applying) return;
        this.push({
          type: "delete_connection",
          connection: structuredClone(e.detail.connection),
        });
      }) as EventListener,
    );

    document.addEventListener(
      "node:patched",
      ((
        e: CustomEvent<{ nodeId: string; before: SystemData; after: SystemData }>,
      ) => {
        if (this.applying) return;
        this.push({
          type: "patch_node",
          nodeId: e.detail.nodeId,
          before: structuredClone(e.detail.before),
          after: structuredClone(e.detail.after),
        });
      }) as EventListener,
    );

    window.addEventListener("keydown", (e) => {
      if (isTextInputTarget(e.target)) return;
      if (galaxyScene.isEditorLocked()) return;

      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (mod && key === "z" && !e.shiftKey) {
        e.preventDefault();
        this.undo();
        return;
      }

      if (mod && (key === "y" || (key === "z" && e.shiftKey))) {
        e.preventDefault();
        this.redo();
        return;
      }

      if (mod && key === "c") {
        const node = selectionManager.getSelected();
        if (!node) return;
        e.preventDefault();
        this.clipboard = structuredClone(node.data);
        return;
      }

      if (mod && key === "v") {
        if (!this.clipboard) return;
        e.preventDefault();
        const dup = galaxyScene.duplicateNodeFromData(this.clipboard, { x: 32, y: 32 });
        if (dup) selectionManager.selectNode(dup);
        return;
      }

      if (mod && key === "d") {
        const node = selectionManager.getSelected();
        if (!node) return;
        e.preventDefault();
        const dup = galaxyScene.duplicateNode(node);
        if (dup) selectionManager.selectNode(dup);
        return;
      }

      if (e.key === "F2") {
        const node = selectionManager.getSelected();
        if (!node) return;
        e.preventDefault();
        const next = window.prompt("Node id", node.data.id);
        if (!next) return;
        if (galaxyScene.renameNodeId(node.data.id, next)) {
          document.dispatchEvent(new CustomEvent("node:selected"));
        }
        return;
      }

      if (e.key === "Delete") {
        e.preventDefault();
        if (selectionManager.selectedConnection) {
          galaxyScene.deleteSelectedConnection();
          return;
        }
        if (selectionManager.getSelected()) {
          selectionManager.deleteSelectedNode();
        }
      }
    });
  }

  private push(action: UndoAction) {
    this.undoStack.push(action);
    if (this.undoStack.length > this.maxStack) this.undoStack.shift();
    this.redoStack = [];
  }

  private undo() {
    const action = this.undoStack.pop();
    if (!action) return;
    this.applying = true;
    try {
      this.applyInverse(action);
      this.redoStack.push(action);
    } finally {
      this.applying = false;
    }
  }

  private redo() {
    const action = this.redoStack.pop();
    if (!action) return;
    this.applying = true;
    try {
      this.applyForward(action);
      this.undoStack.push(action);
    } finally {
      this.applying = false;
    }
  }

  private applyInverse(action: UndoAction) {
    switch (action.type) {
      case "create_node": {
        const node = galaxyScene.getNodeById(action.nodeId);
        if (node) galaxyScene.deleteNode(node);
        break;
      }
      case "delete_node":
        galaxyScene.restoreNode(action.data, action.connections);
        break;
      case "move_node":
        this.setNodePosition(action.nodeId, action.from);
        break;
      case "create_connection":
        this.deleteConnectionById(action.connection.id);
        break;
      case "delete_connection":
        this.restoreConnection(action.connection);
        break;
      case "patch_node":
        this.applyNodeData(action.nodeId, action.before);
        break;
    }
  }

  private applyForward(action: UndoAction) {
    switch (action.type) {
      case "create_node":
        if (!galaxyScene.getNodeById(action.data.id)) {
          galaxyScene.restoreNode(action.data, []);
        }
        break;
      case "delete_node": {
        const node = galaxyScene.getNodeById(action.data.id);
        if (node) galaxyScene.deleteNode(node);
        break;
      }
      case "move_node":
        this.setNodePosition(action.nodeId, action.to);
        break;
      case "create_connection":
        this.restoreConnection(action.connection);
        break;
      case "delete_connection":
        this.deleteConnectionById(action.connection.id);
        break;
      case "patch_node":
        this.applyNodeData(action.nodeId, action.after);
        break;
    }
  }

  private setNodePosition(
    nodeId: string,
    pos: { x: number; y: number },
  ) {
    const node = galaxyScene.getNodeById(nodeId);
    if (!node) return;
    node.position.set(pos.x, pos.y);
    node.data.x = pos.x;
    node.data.y = pos.y;
    galaxyScene.regenerateTerritories();
    document.dispatchEvent(new CustomEvent("map:updated"));
  }

  private deleteConnectionById(id: string) {
    const line = galaxyScene
      .getConnectionLines()
      .find((l) => l.connectionId === id);
    if (!line) return;
    selectionManager.selectConnection(line);
    galaxyScene.deleteSelectedConnection();
  }

  private restoreConnection(conn: SystemConnection) {
    const normalized = normalizeConnection(conn);
    const from = galaxyScene.getNodeById(normalized.from);
    const to = galaxyScene.getNodeById(normalized.to);
    if (from && to) galaxyScene.createConnection(from, to, normalized);
  }

  private applyNodeData(nodeId: string, data: SystemData) {
    const node = galaxyScene.getNodeById(nodeId);
    if (!node) return;
    Object.assign(node.data, structuredClone(data));
    node.position.set(data.x, data.y);
    node.updateNodes();
    galaxyScene.applyTimelineView();
    document.dispatchEvent(new CustomEvent("map:updated"));
    document.dispatchEvent(new CustomEvent("node:selected"));
  }
}

export const undoManager = new UndoManager();
