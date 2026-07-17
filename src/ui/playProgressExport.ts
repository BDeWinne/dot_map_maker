import { galaxyScene } from "../scene/GalaxyScene";
import type { PlayProgress } from "../data/playProgress";
import { isDemoMode } from "../config/demoMode";
import { t } from "../i18n/locale";

export interface PlayProgressFile {
  version: 1;
  playProgress: PlayProgress;
  exportedAt: number;
}

export function exportPlayProgressFile() {
  if (isDemoMode()) return;
  const payload: PlayProgressFile = {
    version: 1,
    playProgress: galaxyScene.getPlayProgress(),
    exportedAt: Date.now(),
  };
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "play-progress.json";
  a.click();
  URL.revokeObjectURL(url);
}

export async function importPlayProgressFile(file: File): Promise<string> {
  if (isDemoMode()) return t("demo.noSaveHint");
  const text = await file.text();
  const json = JSON.parse(text) as Partial<PlayProgressFile> & Partial<PlayProgress>;

  const progress: PlayProgress =
    json.version === 1 && json.playProgress?.milestones
      ? { version: 1, milestones: { ...json.playProgress.milestones } }
      : json.version === 1 && json.milestones
        ? { version: 1, milestones: { ...json.milestones } }
        : { version: 1, milestones: {} };

  galaxyScene.importPlayProgress(progress);
  return t("play.importOk");
}
