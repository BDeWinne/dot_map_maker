export type AdventureEncounterKind =
  | "combat"
  | "social"
  | "puzzle"
  | "exploration"
  | "other";

export const ADVENTURE_ENCOUNTER_KINDS: AdventureEncounterKind[] = [
  "combat",
  "social",
  "puzzle",
  "exploration",
  "other",
];

export interface AdventureReward {
  id: string;
  label: string;
  notes?: string;
}

export interface AdventureEncounter {
  id: string;
  title: string;
  kind?: AdventureEncounterKind;
  description?: string;
  /** GM-only notes; hidden in play mode. */
  gmNotes?: string;
  completed?: boolean;
  rewards?: AdventureReward[];
}

export interface NodeAdventure {
  /** Visible and unlocked at the start of play mode. */
  startNode?: boolean;
  /** Hidden on the map in play mode until discovery rules are met (fog of war). */
  hidden?: boolean;
  /** Requires unlock rules before the player can interact. */
  locked?: boolean;
  /** Node ids that must be marked completed before this unlocks. */
  unlockRequires?: string[];
  /** Milestone done — unlocks neighbors / required nodes. */
  completed?: boolean;
  /** Ordered encounters at this milestone (combat, social, etc.). */
  encounters?: AdventureEncounter[];
  /** @deprecated migrated to encounters[] */
  encounter?: string;
  /** @deprecated migrated to encounters[].rewards */
  reward?: string;
}

function normalizeKind(raw: unknown): AdventureEncounterKind | undefined {
  if (
    raw === "combat" ||
    raw === "social" ||
    raw === "puzzle" ||
    raw === "exploration" ||
    raw === "other"
  ) {
    return raw;
  }
  return undefined;
}

function normalizeReward(raw: unknown): AdventureReward | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Partial<AdventureReward>;
  const label = String(o.label ?? "").trim();
  if (!label) return null;
  const notes = String(o.notes ?? "").trim() || undefined;
  return {
    id: String(o.id ?? crypto.randomUUID()),
    label,
    notes,
  };
}

function normalizeEncounter(raw: unknown): AdventureEncounter | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Partial<AdventureEncounter>;
  const title = String(o.title ?? "").trim();
  if (!title) return null;
  const description = String(o.description ?? "").trim() || undefined;
  const gmNotes = String(o.gmNotes ?? "").trim() || undefined;
  const rewards = Array.isArray(o.rewards)
    ? o.rewards.map(normalizeReward).filter((r): r is AdventureReward => r !== null)
    : undefined;
  const enc: AdventureEncounter = {
    id: String(o.id ?? crypto.randomUUID()),
    title,
  };
  const kind = normalizeKind(o.kind);
  if (kind) enc.kind = kind;
  if (description) enc.description = description;
  if (gmNotes) enc.gmNotes = gmNotes;
  if (o.completed) enc.completed = true;
  if (rewards && rewards.length > 0) enc.rewards = rewards;
  return enc;
}

function migrateLegacyEncounter(o: Partial<NodeAdventure>): AdventureEncounter[] | undefined {
  const legacyText = String(o.encounter ?? "").trim();
  const legacyReward = String(o.reward ?? "").trim();
  if (!legacyText && !legacyReward) return undefined;

  const enc: AdventureEncounter = {
    id: crypto.randomUUID(),
    title: legacyText ? "Encounter" : "Reward",
  };
  if (legacyText) enc.description = legacyText;
  if (legacyReward) {
    enc.rewards = [{ id: crypto.randomUUID(), label: legacyReward }];
  }
  return [enc];
}

export function normalizeAdventure(raw: unknown): NodeAdventure | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Partial<NodeAdventure>;

  const unlockRequires = Array.isArray(o.unlockRequires)
    ? o.unlockRequires.map((id) => String(id).trim()).filter(Boolean)
    : undefined;

  let encounters = Array.isArray(o.encounters)
    ? o.encounters.map(normalizeEncounter).filter((e): e is AdventureEncounter => e !== null)
    : undefined;

  if (!encounters?.length) {
    encounters = migrateLegacyEncounter(o);
  }

  const adv: NodeAdventure = {};
  if (o.startNode) adv.startNode = true;
  if (o.hidden) adv.hidden = true;
  if (o.locked) adv.locked = true;
  if (o.completed) adv.completed = true;
  if (unlockRequires && unlockRequires.length > 0) adv.unlockRequires = unlockRequires;
  if (encounters && encounters.length > 0) adv.encounters = encounters;

  if (
    !adv.startNode &&
    !adv.hidden &&
    !adv.locked &&
    !adv.completed &&
    !adv.unlockRequires &&
    !adv.encounters
  ) {
    return undefined;
  }
  return adv;
}

export function mapHasAdventureData(
  systems: { adventure?: NodeAdventure }[],
): boolean {
  return systems.some((s) => s.adventure !== undefined);
}

export function syncMilestoneCompletedFromEncounters(adv: NodeAdventure): NodeAdventure {
  const encounters = adv.encounters ?? [];
  if (encounters.length > 0 && encounters.every((e) => e.completed)) {
    return { ...adv, completed: true };
  }
  return adv;
}
