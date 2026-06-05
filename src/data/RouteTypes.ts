export type RouteTimelineEntryType = "route_open" | "route_close";

export interface RouteTimelineEntry {
  id: string;
  year: number;
  type: RouteTimelineEntryType;
  title: string;
  description?: string;
}

export const ROUTE_TIMELINE_LABELS: Record<RouteTimelineEntryType, string> = {
  route_open: "Route opened",
  route_close: "Route closed / blocked",
};
