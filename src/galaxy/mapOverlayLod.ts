export type MapOverlayLod = "minimal" | "compact" | "full";

/** Zoom tier: less detail when the whole map is visible. */
export function getMapOverlayLod(zoom: number): MapOverlayLod {
  if (zoom < 0.42) return "minimal";
  if (zoom < 0.82) return "compact";
  return "full";
}

/**
 * Extra scale for labels/icons/fleets in world space when zoomed out.
 * World scale already shrinks everything; this shrinks overlays a bit more
 * so they overlap less than node circles.
 */
export function getMapOverlayScale(zoom: number): number {
  if (zoom >= 1) return 1;
  return Math.max(0.5, 0.55 + zoom * 0.45);
}

export function getMapLabelFontSize(lod: MapOverlayLod): number {
  if (lod === "minimal") return 8;
  if (lod === "compact") return 9;
  return 10;
}

export function formatFleetDisplayCount(
  count: number,
  lod: MapOverlayLod,
): string {
  if (lod === "full") return String(count);
  if (count >= 1000) {
    const k = count / 1000;
    return k >= 10 ? `${Math.round(k)}k` : `${k.toFixed(1).replace(/\.0$/, "")}k`;
  }
  if (lod === "minimal" && count >= 100) {
    return `${Math.round(count / 100) * 100}`;
  }
  return String(count);
}

export function maxFacilityIconsForLod(lod: MapOverlayLod): number {
  if (lod === "minimal") return 0;
  if (lod === "compact") return 3;
  return 8;
}

export function shouldShowFleetsAtLod(lod: MapOverlayLod): boolean {
  return lod !== "minimal";
}

export function shouldShowFacilityIconsAtLod(lod: MapOverlayLod): boolean {
  return lod !== "minimal";
}
