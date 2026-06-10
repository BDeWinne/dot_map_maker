import { galaxyScene } from "../scene/GalaxyScene";

const LS_ICONS = "mapShowFacilityIcons";
const LS_LABELS = "mapShowNodeLabels";
const LS_FLEETS = "mapShowFleets";
const LS_PROGRESS = "mapShowAdventureProgress";

function readBool(key: string, fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return raw === "1";
  } catch {
    return fallback;
  }
}

function writeBool(key: string, value: boolean) {
  try {
    localStorage.setItem(key, value ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export class MapViewToggles {
  private iconsBtn = document.getElementById(
    "toggle-map-icons",
  ) as HTMLButtonElement;
  private labelsBtn = document.getElementById(
    "toggle-map-labels",
  ) as HTMLButtonElement;
  private fleetsBtn = document.getElementById(
    "toggle-map-fleets",
  ) as HTMLButtonElement;
  private progressBtn = document.getElementById(
    "toggle-map-progress",
  ) as HTMLButtonElement;

  constructor() {
    const iconsOn = readBool(LS_ICONS, true);
    const labelsOn = readBool(LS_LABELS, true);
    const fleetsOn = readBool(LS_FLEETS, true);
    const progressOn = readBool(LS_PROGRESS, true);
    galaxyScene.setShowFacilityIcons(iconsOn);
    galaxyScene.setShowNodeLabels(labelsOn);
    galaxyScene.setShowFleets(fleetsOn);
    galaxyScene.setShowAdventureOverlay(progressOn);
    this.syncButton(this.iconsBtn, iconsOn);
    this.syncButton(this.labelsBtn, labelsOn);
    this.syncButton(this.fleetsBtn, fleetsOn);
    this.syncButton(this.progressBtn, progressOn);

    this.iconsBtn?.addEventListener("click", () => {
      const next = !galaxyScene.getShowFacilityIcons();
      galaxyScene.setShowFacilityIcons(next);
      writeBool(LS_ICONS, next);
      this.syncButton(this.iconsBtn, next);
    });

    this.labelsBtn?.addEventListener("click", () => {
      const next = !galaxyScene.getShowNodeLabels();
      galaxyScene.setShowNodeLabels(next);
      writeBool(LS_LABELS, next);
      this.syncButton(this.labelsBtn, next);
    });

    this.fleetsBtn?.addEventListener("click", () => {
      const next = !galaxyScene.getShowFleets();
      galaxyScene.setShowFleets(next);
      writeBool(LS_FLEETS, next);
      this.syncButton(this.fleetsBtn, next);
    });

    this.progressBtn?.addEventListener("click", () => {
      const next = !galaxyScene.getShowAdventureOverlay();
      galaxyScene.setShowAdventureOverlay(next);
      writeBool(LS_PROGRESS, next);
      this.syncButton(this.progressBtn, next);
    });
  }

  private syncButton(btn: HTMLButtonElement | null, on: boolean) {
    if (!btn) return;
    btn.classList.toggle("is-on", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  }
}

export const mapViewToggles = new MapViewToggles();
