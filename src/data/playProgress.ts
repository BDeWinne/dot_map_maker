import type { AdventureEncounter, NodeAdventure } from "./AdventureTypes";
import { syncMilestoneCompletedFromEncounters } from "./AdventureTypes";

export interface PlayMilestoneProgress {
  completed?: boolean;
  encounters?: Record<string, { completed?: boolean }>;
}

export interface PlayProgress {
  version: 1;
  milestones: Record<string, PlayMilestoneProgress>;
}

export function emptyPlayProgress(): PlayProgress {
  return { version: 1, milestones: {} };
}

export function isNodeCompletedInProgress(
  progress: PlayProgress,
  nodeId: string,
): boolean {
  return !!progress.milestones[nodeId]?.completed;
}

export function isEncounterCompletedInProgress(
  progress: PlayProgress,
  nodeId: string,
  encounterId: string,
): boolean {
  return !!progress.milestones[nodeId]?.encounters?.[encounterId]?.completed;
}

/** Merge design adventure with session progress for display / play logic. */
export function mergeAdventureWithProgress(
  design: NodeAdventure | undefined,
  progress: PlayProgress,
  nodeId: string,
): NodeAdventure | undefined {
  if (!design) return undefined;
  const mp = progress.milestones[nodeId];
  if (!mp) return { ...design };

  const encounters = design.encounters?.map((enc) => ({
    ...enc,
    completed: mp.encounters?.[enc.id]?.completed ?? enc.completed,
  }));

  let merged: NodeAdventure = {
    ...design,
    completed: mp.completed ?? design.completed,
  };
  if (encounters) merged.encounters = encounters;
  merged = syncMilestoneCompletedFromEncounters(merged) ?? merged;
  return merged;
}

/** Strip completion flags from design data (GM setup only). */
export function stripCompletionFromDesign(
  adv: NodeAdventure | undefined,
): NodeAdventure | undefined {
  if (!adv) return undefined;
  const encounters = adv.encounters?.map((enc) => {
    const { completed: _c, ...rest } = enc;
    return rest as AdventureEncounter;
  });
  const out: NodeAdventure = { ...adv };
  delete out.completed;
  if (encounters) out.encounters = encounters;
  return out;
}

/** Pull legacy completion from design into play progress on import. */
export function migrateProgressFromDesign(
  progress: PlayProgress,
  nodeId: string,
  design: NodeAdventure | undefined,
): { progress: PlayProgress; design: NodeAdventure | undefined } {
  if (!design) return { progress, design };

  const existing = progress.milestones[nodeId];
  const mp: PlayMilestoneProgress = { ...existing };
  let changed = false;

  if (design.completed && !mp.completed) {
    mp.completed = true;
    changed = true;
  }

  for (const enc of design.encounters ?? []) {
    if (enc.completed) {
      if (!mp.encounters) mp.encounters = {};
      if (!mp.encounters[enc.id]?.completed) {
        mp.encounters[enc.id] = { ...mp.encounters[enc.id], completed: true };
        changed = true;
      }
    }
  }

  const next = changed
    ? { ...progress, milestones: { ...progress.milestones, [nodeId]: mp } }
    : progress;

  return { progress: next, design: stripCompletionFromDesign(design) };
}

export function buildPlayProgressUpdate(
  design: NodeAdventure | undefined,
  milestoneCompleted: boolean,
  encounterCompleted: Map<string, boolean>,
): PlayMilestoneProgress {
  const mp: PlayMilestoneProgress = { completed: milestoneCompleted };

  if (design?.encounters?.length) {
    mp.encounters = {};
    for (const enc of design.encounters) {
      mp.encounters[enc.id] = { completed: !!encounterCompleted.get(enc.id) };
    }
    const allDone = design.encounters.every((enc) => mp.encounters![enc.id].completed);
    if (allDone) mp.completed = true;
  }

  return mp;
}
