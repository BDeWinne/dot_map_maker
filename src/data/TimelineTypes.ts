import type { FleetPresence } from "./FleetTypes";

export type TimelineEntryType =
  | "colonized"
  | "owner_change"
  | "occupied"
  | "liberated"
  | "abandoned"
  | "population"
  | "fleet_change"
  | "fleet_move"
  | "economy"
  | "minerals"
  | "event"
  | "custom";

export interface TimelineEntry {
  id: string;
  year: number;
  type: TimelineEntryType;
  title: string;
  description?: string;
  actorId?: string;
  population?: string;
  economy?: string;
  minerals?: string;
  flavor?: string;
  /** Capital del imperio (actor) desde este evento; en colonized por defecto el primer mundo colonizado. */
  isCapital?: boolean;
  /** Flotas en el sistema desde este año (reemplaza el estado anterior). */
  fleets?: FleetPresence[];
  /** Destino del traslado (evento fleet_move en sistema origen). */
  targetSystemId?: string;
  /** Cantidad de flotas que se mueven (fleet_move). */
  fleetCount?: number;
}

export interface MapCalendar {
  epoch?: string;
  defaultYear?: number;
  viewYear?: number;
}

export const TIMELINE_ENTRY_LABELS: Record<TimelineEntryType, string> = {
  colonized: "Colonized / Appears on map",
  owner_change: "Owner change",
  occupied: "Occupied",
  liberated: "Liberated",
  abandoned: "Abandoned / Removed",
  population: "Population change",
  fleet_change: "Fleet change",
  fleet_move: "Fleet movement",
  economy: "Economy",
  minerals: "Minerals / Resources",
  event: "Event",
  custom: "Custom",
};
