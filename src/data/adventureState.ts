import type { SystemConnection } from "./ConnectionTypes";
import type { NodeAdventure } from "./AdventureTypes";
import type { PlayProgress } from "./playProgress";
import { isNodeCompletedInProgress } from "./playProgress";

export type AdventureVisibility = "hidden" | "locked" | "unlocked" | "completed";

export interface AdventureNodeState {
  visibility: AdventureVisibility;
  unlocked: boolean;
}

function isDesignCompleted(adv?: NodeAdventure): boolean {
  return !!adv?.completed;
}

function resolveCompleted(
  nodeId: string,
  adv: NodeAdventure | undefined,
  playMode: boolean,
  playProgress: PlayProgress | null,
): boolean {
  if (playMode && playProgress) {
    return isNodeCompletedInProgress(playProgress, nodeId);
  }
  return isDesignCompleted(adv);
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

function isAdventureUnlocked(
  nodeId: string,
  adventure: NodeAdventure | undefined,
  systemsById: Map<string, { id: string; adventure?: NodeAdventure }>,
  connections: SystemConnection[],
  isCompleted: (id: string) => boolean,
): boolean {
  if (!adventure) return true;
  if (adventure.startNode) return true;
  if (!adventure.locked) return true;

  const requires = adventure.unlockRequires ?? [];
  if (requires.length > 0) {
    return requires.every((id) => isCompleted(id));
  }

  return neighborsOf(nodeId, connections).some((nid) => isCompleted(nid));
}

function isAdventureDiscovered(
  nodeId: string,
  adventure: NodeAdventure | undefined,
  systemsById: Map<string, { id: string; adventure?: NodeAdventure }>,
  connections: SystemConnection[],
  isCompleted: (id: string) => boolean,
): boolean {
  if (!adventure?.hidden) return true;
  if (adventure.startNode) return true;
  if (isCompleted(nodeId)) return true;
  return isAdventureUnlocked(nodeId, adventure, systemsById, connections, isCompleted);
}

/** Whether adventure rules allow accessing this node in play mode. */
export function isAdventureUnlockedForNode(
  nodeId: string,
  adventure: NodeAdventure | undefined,
  systemsById: Map<string, { id: string; adventure?: NodeAdventure }>,
  connections: SystemConnection[],
  playProgress: PlayProgress | null,
  playMode: boolean,
): boolean {
  const isCompleted = (id: string) => {
    const adv = systemsById.get(id)?.adventure;
    return resolveCompleted(id, adv, playMode, playProgress);
  };
  return isAdventureUnlocked(nodeId, adventure, systemsById, connections, isCompleted);
}

export function computeAdventureStates(
  systems: { id: string; adventure?: NodeAdventure }[],
  connections: SystemConnection[],
  playMode: boolean,
  playProgress: PlayProgress | null = null,
): Map<string, AdventureNodeState> {
  const byId = new Map(systems.map((s) => [s.id, s]));
  const out = new Map<string, AdventureNodeState>();

  const isCompleted = (id: string) => {
    const adv = byId.get(id)?.adventure;
    return resolveCompleted(id, adv, playMode, playProgress);
  };

  for (const sys of systems) {
    const adv = sys.adventure;
    if (!playMode) {
      out.set(sys.id, {
        visibility: adv?.completed ? "completed" : "unlocked",
        unlocked: true,
      });
      continue;
    }

    if (!isAdventureDiscovered(sys.id, adv, byId, connections, isCompleted)) {
      out.set(sys.id, { visibility: "hidden", unlocked: false });
      continue;
    }

    const unlocked = isAdventureUnlocked(sys.id, adv, byId, connections, isCompleted);
    if (isCompleted(sys.id)) {
      out.set(sys.id, { visibility: "completed", unlocked: true });
    } else if (!unlocked) {
      out.set(sys.id, { visibility: "locked", unlocked: false });
    } else {
      out.set(sys.id, { visibility: "unlocked", unlocked: true });
    }
  }

  return out;
}
