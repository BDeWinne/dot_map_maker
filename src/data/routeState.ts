import type { RouteStatus, SystemConnection } from "./ConnectionTypes";
import type { RouteTimelineEntry } from "./RouteTypes";

export function getRouteStatusAtYear(
  conn: SystemConnection,
  year: number,
): RouteStatus {
  let status: RouteStatus = conn.status ?? "open";
  const events = [...(conn.timeline ?? [])]
    .filter((e) => e.year <= year)
    .sort((a, b) => a.year - b.year || a.title.localeCompare(b.title));

  for (const entry of events) {
    status = entry.type === "route_close" ? "closed" : "open";
  }
  return status;
}

export function syncPresentRouteStatus(
  conn: SystemConnection,
  presentYear: number,
): void {
  if ((conn.timeline?.length ?? 0) === 0) return;
  conn.status = getRouteStatusAtYear(conn, presentYear);
}

export function ensureRouteTimelineEntry(
  partial: Partial<RouteTimelineEntry> & { year: number; type: RouteTimelineEntry["type"]; title: string },
): RouteTimelineEntry {
  return {
    id: partial.id ?? crypto.randomUUID(),
    year: partial.year,
    type: partial.type,
    title: partial.title,
    description: partial.description?.trim() || undefined,
  };
}
