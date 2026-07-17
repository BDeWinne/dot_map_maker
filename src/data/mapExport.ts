import { galaxyScene } from "../scene/GalaxyScene";
import { getActiveTerminology } from "../ui/MapProfilePanel";
import { isDemoMode } from "../config/demoMode";

/** Download current map as JSON (same as Map → Export). */
export function downloadMapJson(): void {
  if (isDemoMode()) return;
  const data = galaxyScene.getMapData();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = getActiveTerminology().exportFilename;
  a.click();
  URL.revokeObjectURL(url);
}
