import { galaxyScene, type MapEditMode } from "../scene/GalaxyScene";
import { selectionManager } from "../editor/SelectionManager";

export class MapStatusHud {
  private root = document.getElementById("map-status-hud");
  private playModeCheck = document.getElementById("hud-play-mode") as HTMLInputElement | null;
  private editModeRow = document.getElementById("hud-edit-mode-row");
  private editModeSelect = document.getElementById("hud-map-edit-mode") as HTMLSelectElement | null;

  public init() {
    if (!this.root) return;

    this.editModeSelect?.addEventListener("change", () => {
      if (!this.editModeSelect) return;
      galaxyScene.setEditMode(this.editModeSelect.value as MapEditMode);
      document.dispatchEvent(new CustomEvent("editMode:changed"));
    });

    const refresh = () => this.sync();
    document.addEventListener("mapProfile:changed", refresh);
    document.addEventListener("playMode:changed", refresh);
    document.addEventListener("editMode:changed", refresh);
    document.addEventListener("locale:changed", refresh);
    document.addEventListener("map:loaded", refresh);
    selectionManager.on("node:selected", refresh);
    document.addEventListener("node:deselected", refresh);
    this.sync();
  }

  private sync() {
    if (!this.root) return;

    const play = galaxyScene.getPlayMode();
    if (this.playModeCheck) this.playModeCheck.checked = play;

    if (this.editModeRow) {
      this.editModeRow.hidden = play;
    }
    if (this.editModeSelect) {
      this.editModeSelect.value = galaxyScene.getEditMode();
      this.editModeSelect.disabled = play;
    }

    this.root.classList.toggle("is-play-mode", play);
  }
}

export const mapStatusHud = new MapStatusHud();
