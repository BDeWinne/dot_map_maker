import type { RouteTimelineEntry } from "./RouteTypes";

export type RouteType = "hyperlane" | "trade" | "military" | "clandestine";
export type RouteStatus = "open" | "closed";

export interface SystemConnection {
  id: string;
  from: string;
  to: string;
  name?: string;
  routeType?: RouteType;
  /** Estado presente (export). */
  status?: RouteStatus;
  timeline?: RouteTimelineEntry[];
}

export const ROUTE_TYPE_LABELS: Record<RouteType, string> = {
  hyperlane: "Hyperlane",
  trade: "Trade route",
  military: "Military corridor",
  clandestine: "Clandestine path",
};

export const ROUTE_TYPE_COLORS: Record<RouteType, number> = {
  hyperlane: 0xffffff,
  trade: 0x5a9fd4,
  military: 0xe8a040,
  clandestine: 0x9966cc,
};

export function normalizeConnection(
  raw: Partial<SystemConnection> & { from: string; to: string },
): SystemConnection {
  return {
    id: raw.id ?? crypto.randomUUID(),
    from: raw.from,
    to: raw.to,
    name: raw.name?.trim() || undefined,
    routeType: raw.routeType ?? "hyperlane",
    status: raw.status ?? "open",
    timeline: Array.isArray(raw.timeline) ? [...raw.timeline] : undefined,
  };
}

export function connectionKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function routeLabel(
  conn: SystemConnection,
  fromName: string,
  toName: string,
): string {
  return conn.name?.trim() || `${fromName} ↔ ${toName}`;
}
