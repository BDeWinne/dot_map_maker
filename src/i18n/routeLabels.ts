import type { RouteType } from "../data/ConnectionTypes";
import type { Locale } from "./locale";

const ROUTE_TYPES: Record<RouteType, { es: string; en: string }> = {
  hyperlane: { es: "Hipervía", en: "Hyperlane" },
  trade: { es: "Ruta comercial", en: "Trade route" },
  military: { es: "Corredor militar", en: "Military corridor" },
  clandestine: { es: "Camino clandestino", en: "Clandestine path" },
};

const ROUTE_EVENTS = {
  route_open: { es: "Ruta abierta", en: "Route opened" },
  route_close: { es: "Ruta cerrada / bloqueada", en: "Route closed / blocked" },
} as const;

export function getRouteTypeLabel(type: RouteType, locale: Locale): string {
  return ROUTE_TYPES[type][locale];
}

export function getRouteTimelineLabel(
  type: keyof typeof ROUTE_EVENTS,
  locale: Locale,
): string {
  return ROUTE_EVENTS[type][locale];
}
