/**
 * Atlas-based node rendering (sprites + dropdown panel).
 * Set to true when re-enabling sprite nodes; false = classic circles + overlays.
 */
export const USE_ATLAS_NODE_VISUAL = false;

export function isAtlasNodeVisualEnabled(): boolean {
  return USE_ATLAS_NODE_VISUAL;
}
