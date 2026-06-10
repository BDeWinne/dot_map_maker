import { routeLabel, type SystemConnection } from "./ConnectionTypes";
import type { RouteTimelineEntryType } from "./RouteTypes";
import type { TimelineEntry, TimelineEntryType } from "./TimelineTypes";
import { getTimelineEntryLabel } from "../i18n/timelineLabels";
import { getRouteTimelineLabel } from "../i18n/routeLabels";
import { getLocale } from "../i18n/locale";
import type { SystemData } from "../galaxy/NodeSystem";

export type ChronicleSource = "system" | "route";

export interface ChronicleItem {
  id: string;
  year: number;
  source: ChronicleSource;
  type: string;
  typeLabel: string;
  title: string;
  description?: string;
  actorId?: string;
  systemId?: string;
  systemName?: string;
  connectionId?: string;
  routeName?: string;
  extras?: string;
}

export interface ChronicleFilters {
  ownerId?: string;
  type?: string;
  search?: string;
  maxYear?: number;
}

function systemEvents(
  data: SystemData,
  nameById: Map<string, string>,
): ChronicleItem[] {
  const items: ChronicleItem[] = [];
  for (const entry of data.timeline ?? []) {
    const extras: string[] = [];
    if (entry.population) extras.push(`Pop: ${entry.population}`);
    if (entry.fleets?.length) {
      extras.push(
        `Flotas: ${entry.fleets.map((f) => `${f.owner}×${f.count}`).join(", ")}`,
      );
    }
    if (entry.type === "fleet_move") {
      const toName =
        nameById.get(entry.targetSystemId ?? "") ?? entry.targetSystemId ?? "?";
      extras.push(
        `${data.name} → ${toName}: ${entry.fleetCount ?? 0} flotas`,
      );
    }
    items.push({
      id: `sys-${data.id}-${entry.id}`,
      year: entry.year,
      source: "system",
      type: entry.type,
      typeLabel: getTimelineEntryLabel(entry.type as TimelineEntryType, getLocale()),
      title: entry.title,
      description: entry.description,
      actorId: entry.actorId,
      systemId: data.id,
      systemName: data.name,
      extras: extras.length ? extras.join(" · ") : undefined,
    });
  }
  return items;
}

function routeEvents(
  conn: SystemConnection,
  nameById: Map<string, string>,
): ChronicleItem[] {
  const fromName = nameById.get(conn.from) ?? conn.from;
  const toName = nameById.get(conn.to) ?? conn.to;
  const label = routeLabel(conn, fromName, toName);
  const items: ChronicleItem[] = [];
  for (const entry of conn.timeline ?? []) {
    items.push({
      id: `route-${conn.id}-${entry.id}`,
      year: entry.year,
      source: "route",
      type: entry.type,
      typeLabel: getRouteTimelineLabel(entry.type as RouteTimelineEntryType, getLocale()),
      title: entry.title,
      description: entry.description,
      connectionId: conn.id,
      routeName: label,
      extras: label,
    });
  }
  return items;
}

export function buildGalaxyChronicle(
  systems: SystemData[],
  connections: SystemConnection[],
  filters: ChronicleFilters = {},
): ChronicleItem[] {
  const nameById = new Map(systems.map((s) => [s.id, s.name]));
  let items: ChronicleItem[] = [];
  for (const sys of systems) items.push(...systemEvents(sys, nameById));
  for (const conn of connections) items.push(...routeEvents(conn, nameById));

  items.sort((a, b) => a.year - b.year || a.title.localeCompare(b.title));

  if (filters.maxYear !== undefined) {
    items = items.filter((i) => i.year <= filters.maxYear!);
  }
  if (filters.ownerId) {
    items = items.filter((i) => i.actorId === filters.ownerId);
  }
  if (filters.type) {
    items = items.filter((i) => i.type === filters.type);
  }
  if (filters.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    items = items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q) ||
        i.systemName?.toLowerCase().includes(q) ||
        i.routeName?.toLowerCase().includes(q) ||
        i.extras?.toLowerCase().includes(q),
    );
  }
  return items;
}
