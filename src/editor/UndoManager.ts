import type { SystemConnection } from "../data/ConnectionTypes";
import type { SystemData } from "../galaxy/NodeSystem";
import { selectionManager } from "./SelectionManager";
import { galaxyScene } from "../scene/GalaxyScene";

type UndoAction =
  | { type: "create_node"; nodeId: string }
  | { type: "delete_node"; data: SystemData; connections: SystemConnection[] };

function isTextInputTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return target.isContentEditable;
}

export class UndoManager {
  private stack: UndoAction[] = [];
  private applying = false;
  private readonly maxStack = 50;

  public init() {
    document.addEventListener("node:created", ((e: CustomEvent<{ nodeId: string }>) => {
      if (this.applying) return;
      this.push({ type: "create_node", nodeId: e.detail.nodeId });
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

    window.addEventListener("keydown", (e) => {
      if (isTextInputTarget(e.target)) return;

      if (galaxyScene.getPlayMode()) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        this.undo();
        return;
      }

      if (e.key === "Delete" && selectionManager.getSelected()) {
        e.preventDefault();
        selectionManager.deleteSelectedNode();
      }
    });
  }

  private push(action: UndoAction) {
    this.stack.push(action);
    if (this.stack.length > this.maxStack) {
      this.stack.shift();
    }
  }

  private undo() {
    const action = this.stack.pop();
    if (!action) return;

    this.applying = true;
    try {
      if (action.type === "create_node") {
        const node = galaxyScene.getNodeById(action.nodeId);
        if (node) galaxyScene.deleteNode(node);
        return;
      }

      galaxyScene.restoreNode(action.data, action.connections);
    } finally {
      this.applying = false;
    }
  }
}

export const undoManager = new UndoManager();
