import { normalizeMapProfile, type MapProfileId } from "../data/MapProfile";
import { getLocalizedMapProfile } from "../i18n/mapProfileLocale";
import { getLocale } from "../i18n/locale";
import { galaxyScene } from "../scene/GalaxyScene";

const LS_PLAY_MODE = "mapPlayMode";

function readPlayMode(): boolean {
  try {
    return localStorage.getItem(LS_PLAY_MODE) === "1";
  } catch {
    return false;
  }
}

function writePlayMode(value: boolean) {
  try {
    localStorage.setItem(LS_PLAY_MODE, value ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export class MapProfilePanel {
  private bound = false;

  constructor() {
    document.addEventListener("map:loaded", () => {
      this.syncFromScene();
      writePlayMode(galaxyScene.getPlayMode());
    });
    document.addEventListener("playMode:changed", () => this.syncFromScene());
    document.addEventListener("mapProfile:changed", () => {
      this.syncFromScene();
      this.applyTerminology();
    });
    document.addEventListener("locale:changed", () => {
      this.buildProfileOptions();
      this.syncFromScene();
      this.applyTerminology();
    });
  }

  public init() {
    this.bindControls();
    galaxyScene.setPlayMode(readPlayMode());
    this.buildProfileOptions();
    this.syncFromScene();
    this.applyTerminology();
  }

  private bindControls() {
    if (this.bound) return;
    this.bound = true;

    const profileSelect = document.getElementById("hud-map-profile") as HTMLSelectElement | null;
    profileSelect?.addEventListener("change", () => {
      galaxyScene.setMapProfile(normalizeMapProfile(profileSelect.value));
    });

    const playModeCheck = document.getElementById("hud-play-mode") as HTMLInputElement | null;
    playModeCheck?.addEventListener("change", () => {
      galaxyScene.setPlayMode(playModeCheck.checked);
      writePlayMode(playModeCheck.checked);
    });
  }

  public buildProfileOptions() {
    const profileSelect = document.getElementById("hud-map-profile") as HTMLSelectElement | null;
    if (!profileSelect) return;

    const current = galaxyScene.getMapProfile();
    profileSelect.innerHTML = "";
    const ids: MapProfileId[] = ["galaxy", "fantasy", "dnd", "adventure"];
    const locale = getLocale();
    for (const id of ids) {
      const def = getLocalizedMapProfile(id, locale);
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = def.label;
      opt.title = def.description;
      profileSelect.appendChild(opt);
    }
    profileSelect.value = current;
  }

  private syncFromScene() {
    const profileSelect = document.getElementById("hud-map-profile") as HTMLSelectElement | null;
    const playModeCheck = document.getElementById("hud-play-mode") as HTMLInputElement | null;

    const profile = galaxyScene.getMapProfile();
    if (profileSelect) profileSelect.value = profile;
    if (playModeCheck) playModeCheck.checked = galaxyScene.getPlayMode();
  }

  public applyTerminology() {
    const terms = getLocalizedMapProfile(galaxyScene.getMapProfile(), getLocale()).terms;
    this.setText("term-node-tab", terms.nodeTab);
    this.setText("term-node-editor", terms.nodeEditor);
    this.setText("term-select-node-empty", terms.selectNodeEmpty);
    this.setText("term-delete-node", terms.deleteNode);
    this.setText("term-node-name", terms.nodeName);
    this.setText("term-owned-by", terms.ownedBy);
    this.setText("term-occupied-by", terms.occupiedBy);
    this.setText("term-star-type", terms.starType);
    this.setText("term-description", terms.description);
    this.setText("term-capital", terms.capital);
    this.setText("term-population", terms.population);
    this.setText("term-size", terms.size);
    this.setText("term-installations", terms.installations);
    this.setText("term-fleets", terms.fleets);
    this.setText("term-background", terms.background);
    this.setText("term-timeline-title", terms.timelineTitle);
    this.setText("term-chronicle-title", terms.chronicleTitle);
    this.setText("term-routes-title", terms.routesTitle);
    this.setText("term-routes-hint", terms.routesHint);

    const fleetsBtn = document.getElementById("toggle-map-fleets");
    if (fleetsBtn) fleetsBtn.textContent = terms.fleetsToggle;

    const editHint = document.getElementById("map-edit-mode-hint");
    if (editHint && galaxyScene.getEditMode() === "edit") {
      editHint.textContent = terms.placeNodesHint;
    }

    document.dispatchEvent(new CustomEvent("terminology:changed"));
  }

  private setText(id: string, text: string) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }
}

export const mapProfilePanel = new MapProfilePanel();

export function getActiveTerminology() {
  return getLocalizedMapProfile(galaxyScene.getMapProfile(), getLocale()).terms;
}
