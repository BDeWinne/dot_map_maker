import { Container, Graphics, Text } from "pixi.js";

export const FACILITY_IDS = [
  "bastion",
  "shipyard",
  "mining",
  "research",
  "refinery",
  "trade",
  "agri",
  "observatory",
  "gateway",
  "ruins",
  "logistics",
  "energy",
] as const;

export type FacilityId = (typeof FACILITY_IDS)[number];

export interface FacilityDef {
  id: FacilityId;
  /** Nombre en UI / leyenda */
  label: string;
  /** Texto en checkbox */
  checkboxLabel: string;
  /** Símbolo en el badge del mapa */
  symbol: string;
  color: number;
}

export const FACILITY_DEFS: FacilityDef[] = [
  { id: "bastion", label: "Bastión / fortaleza", checkboxLabel: "Bastión", symbol: "🛡", color: 0xc0392b },
  { id: "shipyard", label: "Astillero naval", checkboxLabel: "Astillero", symbol: "⚓", color: 0x3498db },
  { id: "mining", label: "Minería", checkboxLabel: "Minería", symbol: "⛏", color: 0xf39c12 },
  { id: "research", label: "Investigación", checkboxLabel: "Investigación", symbol: "🔬", color: 0x9b59b6 },
  { id: "refinery", label: "Refinería", checkboxLabel: "Refinería", symbol: "🏭", color: 0xe67e22 },
  { id: "trade", label: "Comercio", checkboxLabel: "Comercio", symbol: "💱", color: 0x1abc9c },
  { id: "agri", label: "Agro / alimentos", checkboxLabel: "Agro", symbol: "🌾", color: 0x27ae60 },
  { id: "observatory", label: "Observatorio", checkboxLabel: "Observatorio", symbol: "🔭", color: 0x5dade2 },
  { id: "gateway", label: "Portal / hipervía", checkboxLabel: "Portal", symbol: "🌀", color: 0xbb8fce },
  { id: "ruins", label: "Ruinas", checkboxLabel: "Ruinas", symbol: "🏛", color: 0x95a5a6 },
  { id: "logistics", label: "Logística", checkboxLabel: "Logística", symbol: "📦", color: 0xd4ac6e },
  { id: "energy", label: "Energía", checkboxLabel: "Energía", symbol: "⚡", color: 0xf4d03f },
];

const FACILITY_BY_ID = new Map(FACILITY_DEFS.map((d) => [d.id, d]));

export function getFacilityDef(id: FacilityId): FacilityDef {
  return FACILITY_BY_ID.get(id)!;
}

export function isFacilityId(value: string): value is FacilityId {
  return (FACILITY_IDS as readonly string[]).includes(value);
}

export function normalizeFacilities(raw?: unknown): FacilityId[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<FacilityId>();
  const out: FacilityId[] = [];
  for (const item of raw) {
    if (typeof item !== "string" || !isFacilityId(item) || seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  return out;
}

const BADGE_R = 5.5;
/** Dibuja el badge a mayor tamaño y lo escala para evitar pixelado al ampliar. */
const BADGE_SUPERSAMPLE = 2;

/** Tope de escala en el mapa (referencia: se ve bien en nodos size 2–3). */
export const FACILITY_BADGE_MAP_SCALE = 2 * 0.78;

/** Escala según size del nodo: crece hasta el tope; size≥3 no agranda más. */
export function getFacilityBadgeMapScale(nodeSize: number): number {
  const size = Math.max(0.25, nodeSize);
  return Math.min(FACILITY_BADGE_MAP_SCALE, Math.max(0.65, size * 0.78));
}

/** Radio visible del badge en el mapa (sin supersample). */
export function getFacilityBadgeDisplayRadius(displayScale: number): number {
  return BADGE_R * displayScale;
}

/** Badge pequeño: círculo de color + símbolo legible. */
export function createFacilityBadge(
  id: FacilityId,
  displayScale = 1,
  resolution = 2,
): Container {
  const def = getFacilityDef(id);
  const r = BADGE_R * displayScale * BADGE_SUPERSAMPLE;
  const root = new Container();
  root.eventMode = "none";

  const inner = new Container();
  inner.scale.set(1 / BADGE_SUPERSAMPLE);

  const disc = new Graphics();
  disc.circle(0, 0, r).fill({ color: def.color, alpha: 0.95 });
  disc.circle(0, 0, r).stroke({ width: 1.2, color: 0x000000, alpha: 0.7 });
  inner.addChild(disc);

  const sym = new Text({
    text: def.symbol,
    resolution: resolution * BADGE_SUPERSAMPLE,
    style: {
      fontFamily: "Segoe UI Emoji, Apple Color Emoji, Arial, sans-serif",
      fontSize: Math.max(10, Math.round(r * 1.35)),
      fill: 0xffffff,
      stroke: { color: 0x000000, width: 2, join: "round" },
    },
  });
  sym.anchor.set(0.5);
  sym.roundPixels = true;
  inner.addChild(sym);

  root.addChild(inner);
  return root;
}

export function formatFacilityList(ids: FacilityId[], max = 4): string {
  const names = ids.slice(0, max).map((id) => getFacilityDef(id).checkboxLabel);
  const extra = ids.length > max ? ` +${ids.length - max}` : "";
  return names.join(" · ") + extra;
}
