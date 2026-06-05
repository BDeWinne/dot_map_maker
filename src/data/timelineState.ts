import { normalizeFleets, type FleetPresence } from "./FleetTypes";
import { parsePopulationToInt } from "./population";
import type { SystemData } from "../galaxy/NodeSystem";
import type { TimelineEntry } from "./TimelineTypes";

export interface SystemBaseline {
  visible: boolean;
  owner: string;
  occupiedBy?: string;
  population: number;
  isCapital: boolean;
  fleets: FleetPresence[];
}

/** Primer sistema colonizado por owner → capital de ese imperio (desde su año de colonización). */
const ownerCapitalSystemId = new Map<string, string>();

export function recomputeOwnerCapitalOrigins(allSystems: SystemData[]): void {
  ownerCapitalSystemId.clear();

  type Candidate = { systemId: string; year: number; score: number };
  const best = new Map<string, Candidate>();

  for (const data of allSystems) {
    for (const entry of data.timeline ?? []) {
      if (entry.type !== "colonized") continue;
      const owner = entry.actorId?.trim();
      if (!owner || owner === "none") continue;

      const score =
        (data.isCapital ? 10_000 : 0) +
        (entry.isCapital ? 5_000 : 0) +
        (data.size ?? 1) * 100;

      const cur = best.get(owner);
      if (
        !cur ||
        entry.year < cur.year ||
        (entry.year === cur.year && score > cur.score)
      ) {
        best.set(owner, { systemId: data.id, year: entry.year, score });
      }
    }
  }

  for (const [owner, cand] of best) {
    ownerCapitalSystemId.set(owner, cand.systemId);
  }
}

export function ensureBaseline(data: SystemData): SystemBaseline {
  if (data.baseline) return data.baseline;

  const firstColonizedYear = (data.timeline ?? [])
    .filter((e) => e.type === "colonized")
    .reduce<number | null>((min, e) => (min === null || e.year < min ? e.year : min), null);

  if (firstColonizedYear !== null) {
    data.baseline = {
      visible: false,
      owner: "none",
      population: 0,
      isCapital: false,
      fleets: [],
    };
  } else {
    data.baseline = {
      visible: true,
      owner: data.owner || "none",
      occupiedBy: data.occupiedBy,
      population: parsePopulationToInt(data.population),
      isCapital: !!data.isCapital,
      fleets: normalizeFleets(data.fleets),
    };
  }

  return data.baseline;
}

export function getMaxTimelineYear(systems: SystemData[], defaultYear: number): number {
  let max = defaultYear;
  for (const data of systems) {
    for (const entry of data.timeline ?? []) {
      if (entry.year > max) max = entry.year;
    }
  }
  return max;
}

/** Estado del sistema en un año (simulación hacia adelante desde baseline). */
function cloneBaselineState(base: SystemBaseline): SystemBaseline {
  return {
    ...base,
    fleets: normalizeFleets(base.fleets).map((f) => ({ ...f })),
  };
}

export function computeStateAtYear(data: SystemData, year: number): SystemBaseline {
  const state = cloneBaselineState(ensureBaseline(data));
  const events = [...(data.timeline ?? [])]
    .filter((e) => e.year <= year)
    .sort((a, b) => a.year - b.year || a.title.localeCompare(b.title));

  for (const entry of events) {
    applyTimelineEvent(state, entry, data);
  }

  return state;
}

/** Presente manual en el JSON (sin simular timeline). */
export function getPresentState(data: SystemData): SystemBaseline {
  return {
    visible: true,
    owner: data.owner || "none",
    occupiedBy: data.occupiedBy,
    population: parsePopulationToInt(data.population),
    isCapital: !!data.isCapital,
    fleets: normalizeFleets(data.fleets),
  };
}

export function getDisplayStateAtYear(
  data: SystemData,
  year: number,
  presentYear: number
): SystemBaseline {
  const effectiveYear = year >= presentYear ? presentYear : year;

  if ((data.timeline?.length ?? 0) > 0) {
    const simulated = computeStateAtYear(data, effectiveYear);
    if (year >= presentYear) {
      const manualPop = parsePopulationToInt(data.population);
      if (manualPop > 0) {
        simulated.population = manualPop;
      }
      if (data.isCapital) {
        simulated.isCapital = true;
      }
      if (data.fleets !== undefined) {
        simulated.fleets = normalizeFleets(data.fleets).map((f) => ({ ...f }));
      }
    }
    return simulated;
  }

  if (year >= presentYear) return getPresentState(data);
  return computeStateAtYear(data, effectiveYear);
}

/** Alinea owner/población del sistema con la simulación al año presente. */
export function syncPresentFieldsFromTimeline(
  data: SystemData,
  presentYear: number
): void {
  if ((data.timeline?.length ?? 0) === 0) return;

  const state = computeStateAtYear(data, presentYear);
  data.owner = state.owner;
  data.occupiedBy = state.occupiedBy;
  data.isCapital = state.isCapital;
  data.population = state.population;
  data.fleets =
    state.fleets.length > 0
      ? state.fleets.map((f) => ({ ...f }))
      : undefined;
}

function resolveCapitalOnColonized(
  entry: TimelineEntry,
  ownerId: string,
  data: SystemData
): boolean {
  if (entry.isCapital === true) return true;
  if (entry.isCapital === false) return false;
  return ownerCapitalSystemId.get(ownerId) === data.id;
}

function applyTimelineEvent(
  state: SystemBaseline,
  entry: TimelineEntry,
  data: SystemData
): void {
  const actor = entry.actorId?.trim() || "none";

  switch (entry.type) {
    case "colonized":
      state.visible = true;
      if (entry.actorId?.trim()) {
        state.owner = actor;
      }
      state.occupiedBy = undefined;
      state.isCapital = resolveCapitalOnColonized(entry, actor, data);
      break;
    case "owner_change":
      state.owner = actor;
      state.occupiedBy = undefined;
      break;
    case "occupied":
      state.occupiedBy = actor;
      break;
    case "liberated":
      state.occupiedBy = undefined;
      break;
    case "abandoned":
      state.visible = false;
      state.occupiedBy = undefined;
      state.isCapital = false;
      state.fleets = [];
      break;
    case "fleet_change":
      break;
    case "population":
      break;
    default:
      break;
  }

  if (entry.population) {
    state.population = parsePopulationToInt(entry.population);
  }

  if (entry.fleets !== undefined) {
    state.fleets = normalizeFleets(entry.fleets).map((f) => ({ ...f }));
  }
}
