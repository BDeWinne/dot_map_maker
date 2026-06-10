import type { TimelineEntryType } from "../data/TimelineTypes";
import type { Locale } from "./locale";

const LABELS: Record<TimelineEntryType, { es: string; en: string }> = {
  colonized: { es: "Colonizado / Aparece en mapa", en: "Colonized / Appears on map" },
  owner_change: { es: "Cambio de dueño", en: "Owner change" },
  occupied: { es: "Ocupado", en: "Occupied" },
  liberated: { es: "Liberado", en: "Liberated" },
  abandoned: { es: "Abandonado / Oculto", en: "Abandoned / Removed" },
  population: { es: "Cambio de población", en: "Population change" },
  fleet_change: { es: "Cambio de flotas", en: "Fleet change" },
  fleet_move: { es: "Movimiento de flotas", en: "Fleet movement" },
  economy: { es: "Economía", en: "Economy" },
  minerals: { es: "Minerales / recursos", en: "Minerals / Resources" },
  event: { es: "Evento", en: "Event" },
  custom: { es: "Personalizado", en: "Custom" },
};

export function getTimelineEntryLabel(type: TimelineEntryType, locale: Locale): string {
  return LABELS[type][locale];
}

export function getTimelineEntryLabels(locale: Locale): Record<TimelineEntryType, string> {
  const out = {} as Record<TimelineEntryType, string>;
  for (const type of Object.keys(LABELS) as TimelineEntryType[]) {
    out[type] = LABELS[type][locale];
  }
  return out;
}
