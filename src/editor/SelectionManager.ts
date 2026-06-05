import { EventEmitter } from "pixi.js";
import { NodeSystem } from "../galaxy/NodeSystem";
import { ConnectionLine } from "../galaxy/ConnectionLine";

export class SelectionManager extends EventEmitter {
  private selectedNode: NodeSystem | null = null;
  selectedConnection: ConnectionLine | null = null;
  private lastSelected: NodeSystem | null = null;
  selectNode(node: NodeSystem, shiftKey = false) {
    if (shiftKey && this.selectedNode && this.selectedNode !== node) {
        this.emit("connection:request", this.selectedNode, node);
        return;
    }

    if (this.selectedNode === node) {
        this.clear();
        return;
    }

    this.clearConnection(false);

    if (this.selectedNode) {
        this.selectedNode.setSelected(false);
    }

    this.selectedNode = node;

    if (node) {
        node.setSelected(true);
        this.emit("node:selected", node);
        document.dispatchEvent(new CustomEvent("node:selected", { detail: node }));
    }
}

selectConnection(conn: ConnectionLine) {
  if (this.selectedNode) {
    this.selectedNode.setSelected(false);
    this.selectedNode = null;
    this.emit("node:deselected");
    document.dispatchEvent(new CustomEvent("node:deselected"));
  }
  if (this.selectedConnection && this.selectedConnection !== conn) {
    this.selectedConnection.redraw();
  }
  this.selectedConnection = conn;
  conn.redraw();
  document.dispatchEvent(new CustomEvent("connection:selected", { detail: conn }));
}

clearConnection(emit = true) {
  if (!this.selectedConnection) return;
  this.selectedConnection.redraw();
  this.selectedConnection = null;
  if (emit) {
    document.dispatchEvent(new CustomEvent("connection:deselected"));
  }
}

deleteSelectedNode() {
  if (!this.selectedNode) return;

  this.emit("node:delete", this.selectedNode);
  this.selectedNode = null;
}

  clear() {
    if (this.selectedNode) {
      this.selectedNode.setSelected(false);
    }
    this.selectedNode = null;
    this.clearConnection(false);
    this.emit("node:deselected");
    document.dispatchEvent(new CustomEvent("node:deselected"));
  }

  getSelected() {
    return this.selectedNode;
  }
}

export const selectionManager = new SelectionManager();
