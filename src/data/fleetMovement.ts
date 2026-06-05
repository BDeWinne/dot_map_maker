import { normalizeFleets, type FleetPresence } from "./FleetTypes";
import type { SystemBaseline } from "./timelineState";
import type { SystemData } from "../galaxy/NodeSystem";
import type { TimelineEntry } from "./TimelineTypes";

export interface FleetMoveEvent {
  year: number;
  title: string;
  fromSystemId: string;
  toSystemId: string;
  owner: string;
  count: number;
}

export function collectFleetMoves(
  systems: SystemData[],
  maxYear: number,
): FleetMoveEvent[] {
  const moves: FleetMoveEvent[] = [];
  for (const sys of systems) {
    for (const entry of sys.timeline ?? []) {
      if (entry.type !== "fleet_move" || entry.year > maxYear) continue;
      const toSystemId = entry.targetSystemId?.trim();
      const count = Math.max(0, Math.round(Number(entry.fleetCount ?? 0)));
      const owner = entry.actorId?.trim();
      if (!toSystemId || !owner || count <= 0) continue;
      moves.push({
        year: entry.year,
        title: entry.title,
        fromSystemId: sys.id,
        toSystemId,
        owner,
        count,
      });
    }
  }
  return moves.sort(
    (a, b) => a.year - b.year || a.title.localeCompare(b.title),
  );
}

function adjustFleet(
  fleets: FleetPresence[],
  owner: string,
  delta: number,
): FleetPresence[] {
  const map = new Map<string, number>();
  for (const f of normalizeFleets(fleets)) {
    map.set(f.owner, f.count);
  }
  const next = (map.get(owner) ?? 0) + delta;
  if (next <= 0) map.delete(owner);
  else map.set(owner, next);
  return [...map.entries()].map(([o, count]) => ({ owner: o, count }));
}

/** Aplica traslados de flotas sobre estados ya simulados por sistema. */
export function applyGlobalFleetTransfers(
  states: Map<string, SystemBaseline>,
  systems: SystemData[],
  year: number,
): void {
  for (const move of collectFleetMoves(systems, year)) {
    const from = states.get(move.fromSystemId);
    const to = states.get(move.toSystemId);
    if (!from || !to) continue;
    from.fleets = adjustFleet(from.fleets, move.owner, -move.count);
    to.fleets = adjustFleet(to.fleets, move.owner, move.count);
  }
}

export function fleetMoveSummary(entry: TimelineEntry, fromName: string): string {
  const to = entry.targetSystemId ?? "?";
  const count = entry.fleetCount ?? 0;
  const owner = entry.actorId ?? "?";
  return `${fromName} → ${to}: ${count} (${owner})`;
}
