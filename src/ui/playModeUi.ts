import { galaxyScene } from "../scene/GalaxyScene";

export function isPlayMode(): boolean {
  return galaxyScene.getPlayMode();
}

export function syncPlayModeUi() {
  const play = galaxyScene.getPlayMode();
  document.body.classList.toggle("is-play-mode", play);

  const profileSelect = document.getElementById("hud-map-profile") as HTMLSelectElement | null;
  if (profileSelect) profileSelect.disabled = play;

  const milestoneHud = document.getElementById("map-milestone-hud");
  milestoneHud?.classList.toggle("is-play-mode", play);
}

export function initPlayModeUi() {
  document.addEventListener("playMode:changed", syncPlayModeUi);
  document.addEventListener("map:loaded", syncPlayModeUi);
  syncPlayModeUi();
}
