import type { SystemConnection } from "./ConnectionTypes";
import type { NodeAdventure } from "./AdventureTypes";

export type AdventureVisibility = "hidden" | "locked" | "unlocked" | "completed";

export interface AdventureNodeState {
  visibility: AdventureVisibility;
  unlocked: boolean;
}

function isCompleted(adv?: NodeAdventure): boolean {
  return !!adv?.completed;
}

function neighborsOf(
  nodeId: string,
  connections: SystemConnection[],
): string[] {
  const out: string[] = [];
  for (const c of connections) {
    if (c.from === nodeId) out.push(c.to);
    else if (c.to === nodeId) out.push(c.from);
  }
  return out;
}

/** Whether adventure rules allow accessing this node in play mode. */
export function isAdventureUnlocked(
  nodeId: string,
  adventure: NodeAdventure | undefined,
  systemsById: Map<string, { id: string; adventure?: NodeAdventure }>,
  connections: SystemConnection[],
): boolean {
  if (!adventure) return true;
  if (adventure.startNode) return true;
  if (!adventure.locked) return true;

  const requires = adventure.unlockRequires ?? [];
  if (requires.length > 0) {
    return requires.every((id) => isCompleted(systemsById.get(id)?.adventure));
  }

  return neighborsOf(nodeId, connections).some((nid) => {
    const neighbor = systemsById.get(nid);
    return neighbor && isCompleted(neighbor.adventure);
  });
}

export function computeAdventureStates(
  systems: { id: string; adventure?: NodeAdventure }[],
  connections: SystemConnection[],
  playMode: boolean,
): Map<string, AdventureNodeState> {
  const byId = new Map(systems.map((s) => [s.id, s]));
  const out = new Map<string, AdventureNodeState>();

  for (const sys of systems) {
    const adv = sys.adventure;
    if (!playMode) {
      out.set(sys.id, {
        visibility: adv?.completed ? "completed" : "unlocked",
        unlocked: true,
      });
      continue;
    }

    const unlocked = isAdventureUnlocked(sys.id, adv, byId, connections);
    if (adv?.completed) {
      out.set(sys.id, { visibility: "completed", unlocked: true });
    } else if (!unlocked) {
      out.set(sys.id, { visibility: "locked", unlocked: false });
    } else {
      out.set(sys.id, { visibility: "unlocked", unlocked: true });
    }
  }

  return out;
}
