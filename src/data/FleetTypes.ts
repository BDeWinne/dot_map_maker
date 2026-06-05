import { Container, Graphics, Text } from "pixi.js";
import { ownerManager } from "../galaxy/OwnerManager";

export interface FleetPresence {
  owner: string;
  count: number;
}

const SHIP_LEN = 9;
const SHIP_HALF_H = 3.5;
const FLEET_SUPERSAMPLE = 2;

export function normalizeFleets(raw: unknown): FleetPresence[] {
  const map = new Map<string, number>();

  const add = (owner: string, count: number) => {
    const id = owner.trim();
    const n = Math.max(0, Math.round(count));
    if (!id || n <= 0) return;
    map.set(id, (map.get(id) ?? 0) + n);
  };

  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (!item || typeof item !== "object") continue;
      const row = item as { owner?: unknown; count?: unknown };
      add(String(row.owner ?? ""), Number(row.count));
    }
  } else if (raw && typeof raw === "object") {
    for (const [owner, count] of Object.entries(raw)) {
      add(owner, Number(count));
    }
  }

  return [...map.entries()].map(([owner, count]) => ({ owner, count }));
}

/** Dueño del sistema primero; resto por etiqueta corta. */
export function sortFleetsForDisplay(
  fleets: FleetPresence[],
  systemOwnerId: string,
): FleetPresence[] {
  return [...fleets].sort((a, b) => {
    const aHost = a.owner === systemOwnerId ? 0 : 1;
    const bHost = b.owner === systemOwnerId ? 0 : 1;
    if (aHost !== bHost) return aHost - bHost;
    const aShort = ownerManager.get(a.owner).short;
    const bShort = ownerManager.get(b.owner).short;
    return aShort.localeCompare(bShort);
  });
}

/** Icono de nave + cantidad, color del imperio. Ancla a la derecha (junto al nodo). */
export function createFleetMarker(
  ownerId: string,
  count: number,
  resolution = 2,
): Container {
  const owner = ownerManager.get(ownerId);
  const root = new Container();
  root.eventMode = "none";

  const inner = new Container();
  inner.scale.set(1 / FLEET_SUPERSAMPLE);

  const ship = new Graphics();
  const len = SHIP_LEN * FLEET_SUPERSAMPLE;
  const h = SHIP_HALF_H * FLEET_SUPERSAMPLE;
  ship
    .moveTo(0, -h)
    .lineTo(len, 0)
    .lineTo(0, h)
    .closePath()
    .fill({ color: owner.color, alpha: 0.95 });
  ship
    .moveTo(0, -h)
    .lineTo(len, 0)
    .lineTo(0, h)
    .closePath()
    .stroke({ width: 1.4, color: 0x000000, alpha: 0.85 });
  inner.addChild(ship);

  const countLabel = new Text({
    text: String(count),
    resolution: resolution * FLEET_SUPERSAMPLE,
    style: {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: Math.round(10 * FLEET_SUPERSAMPLE),
      fontWeight: "700",
      fill: owner.color,
      stroke: { color: 0x000000, width: 2.5, join: "round" },
    },
  });
  countLabel.anchor.set(1, 0.5);
  countLabel.roundPixels = true;
  countLabel.position.set(-3 * FLEET_SUPERSAMPLE, 0);
  inner.addChild(countLabel);

  root.addChild(inner);
  return root;
}

export function getFleetMarkerWidth(): number {
  return SHIP_LEN + 14;
}

/** Texto en formulario timeline: JSON o `empire_01:50, empire_02:3`. */
export function parseFleetTimelineInput(raw: string): FleetPresence[] | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  try {
    return normalizeFleets(JSON.parse(t));
  } catch {
    const parts = t.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
    const rows: FleetPresence[] = [];
    for (const part of parts) {
      const sep = part.indexOf(":");
      if (sep < 1) continue;
      const owner = part.slice(0, sep).trim();
      const count = Number(part.slice(sep + 1).trim());
      if (!owner || !Number.isFinite(count)) continue;
      rows.push({ owner, count });
    }
    return normalizeFleets(rows);
  }
}

export function formatFleetTimelineInput(fleets: FleetPresence[] | undefined): string {
  const n = normalizeFleets(fleets);
  if (n.length === 0) return "";
  return JSON.stringify(n);
}

export function formatFleetsSummary(fleets: FleetPresence[]): string {
  if (fleets.length === 0) return "";
  return fleets
    .map((f) => `${ownerManager.get(f.owner).short}×${f.count}`)
    .join(", ");
}
