import { FACILITY_DEFS } from "./data/FacilityTypes";
import { Game } from "./core/Game";
import { galaxyScene, MapEditMode } from "./scene/GalaxyScene";
import { nodeInspector } from "./ui/NodeInspector";
import { sidebar } from "./ui/Sidebar";
import { statsPanel } from "./ui/StatsPanel";
import { timelinePanel } from "./ui/TimelinePanel";
import { ownerEditor } from "./ui/OwnerEditor";
import { chroniclePanel } from "./ui/ChroniclePanel";
import { connectionInspector } from "./ui/ConnectionInspector";
import { mapViewToggles } from "./ui/MapViewToggles";
import { yearScrubber } from "./ui/YearScrubber";
import { exportMapAsPng } from "./ui/visualExport";

new Game();
nodeInspector;
timelinePanel;
ownerEditor;
yearScrubber;
chroniclePanel;
connectionInspector;
mapViewToggles;

const EDIT_MODE_HINTS: Record<MapEditMode, string> = {
  edit: "Left-click empty space to add a system. Middle-click or Space+drag pans the view.",
  moveBackground: "Left-click drag moves only the galaxy image (not the camera).",
  moveNodes: "Left-click drag moves all systems together (not the camera).",
};

function syncEditModeControls() {
  const modeSelect = document.getElementById("map-edit-mode") as HTMLSelectElement | null;
  const hint = document.getElementById("map-edit-mode-hint");
  const moveBackgroundOption = modeSelect?.querySelector(
    'option[value="moveBackground"]'
  ) as HTMLOptionElement | null;

  if (moveBackgroundOption) {
    moveBackgroundOption.disabled = !galaxyScene.hasBackground();
  }

  if (modeSelect?.value === "moveBackground" && !galaxyScene.hasBackground()) {
    modeSelect.value = "edit";
    galaxyScene.setEditMode("edit");
  }

  if (hint) {
    hint.textContent = EDIT_MODE_HINTS[galaxyScene.getEditMode()];
  }
}

function syncBackgroundControls() {
  const clearBtn = document.getElementById("clear-background") as HTMLButtonElement | null;
  const opacityInput = document.getElementById("background-opacity") as HTMLInputElement | null;
  const hasBackground = galaxyScene.hasBackground();

  if (clearBtn) clearBtn.disabled = !hasBackground;
  if (opacityInput) {
    opacityInput.disabled = !hasBackground;
    if (hasBackground) {
      opacityInput.value = String(Math.round(galaxyScene.getBackgroundAlpha() * 100));
    }
  }
}

function onMapUpdated() {
  nodeInspector.populateOwners();
  timelinePanel.populateActors();
  statsPanel.refresh();
}

function populateFacilityLegend() {
  const el = document.getElementById("facility-legend-map");
  if (!el) return;
  el.innerHTML = FACILITY_DEFS.map(
    (d) =>
      `<span><span class="facility-legend-sym">${d.symbol}</span>${d.label}</span>`
  ).join("");
}

window.addEventListener("DOMContentLoaded", () => {
  populateFacilityLegend();

  const mapEditModeSelect = document.getElementById("map-edit-mode") as HTMLSelectElement | null;

  mapEditModeSelect?.addEventListener("change", () => {
    galaxyScene.setEditMode(mapEditModeSelect.value as MapEditMode);
    syncEditModeControls();
  });

  sidebar.onChange((tab) => {
    if (tab === "stats") statsPanel.refresh();
    if (tab === "timeline") timelinePanel.refresh();
    if (tab === "chronicle") chroniclePanel.refresh();
    if (tab === "owners") ownerEditor.refresh();
  });

  document.addEventListener("owners:changed", () => {
    nodeInspector.populateOwners();
    timelinePanel.populateActors();
    statsPanel.refresh();
  });

  document.addEventListener("map:updated", onMapUpdated);
  document.addEventListener("viewYear:changed", onMapUpdated);
  galaxyScene.setViewYear(galaxyScene.getCalendar().defaultYear ?? 2200);

  syncEditModeControls();
  syncBackgroundControls();

  const importStatus = document.getElementById("import-status");
  const setImportStatus = (message: string, isError = false) => {
    if (!importStatus) return;
    importStatus.textContent = message;
    importStatus.style.color = isError ? "#f88" : "#8c8";
  };

  const exportMapBtn = document.getElementById("export-map");
  const exportPngBtn = document.getElementById("export-png");
  const setBackgroundBtn = document.getElementById("set-background");
  const backgroundFileInput = document.getElementById("background-file") as HTMLInputElement | null;
  const clearBackgroundBtn = document.getElementById("clear-background");
  const backgroundOpacityInput = document.getElementById("background-opacity") as HTMLInputElement | null;

  setBackgroundBtn?.addEventListener("click", () => backgroundFileInput?.click());

  backgroundFileInput?.addEventListener("change", async () => {
    const file = backgroundFileInput.files?.[0];
    if (!file) return;

    try {
      await galaxyScene.setBackgroundFromFile(file);
      syncBackgroundControls();
      syncEditModeControls();
    } catch (err) {
      console.error("Could not load background image", err);
    }

    backgroundFileInput.value = "";
  });

  clearBackgroundBtn?.addEventListener("click", () => {
    galaxyScene.removeBackground();
    syncBackgroundControls();
    syncEditModeControls();
  });

  backgroundOpacityInput?.addEventListener("input", () => {
    galaxyScene.setBackgroundAlpha(Number(backgroundOpacityInput.value) / 100);
  });

  exportMapBtn?.addEventListener("click", () => {
    const data = galaxyScene.getMapData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "galaxy-map.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  exportPngBtn?.addEventListener("click", () => {
    setImportStatus("Exporting PNG…");
    void exportMapAsPng()
      .then((ok) => {
        setImportStatus(ok ? "PNG exported." : "PNG export failed (see console).", !ok);
      })
      .catch((err) => {
        console.error("PNG export failed", err);
        setImportStatus("PNG export failed.", true);
      });
  });

  const importBtn = document.getElementById("import-map");
  const fileInput = document.getElementById("import-file") as HTMLInputElement | null;

  importBtn?.addEventListener("click", () => {
    fileInput?.click();
  });

  fileInput?.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    setImportStatus("Loading…");

    const reader = new FileReader();

    reader.onerror = () => {
      setImportStatus("Could not read file.", true);
      fileInput.value = "";
    };

    reader.onload = (e) => {
      void (async () => {
        try {
          const text = e.target?.result;
          if (typeof text !== "string") {
            setImportStatus("Empty file.", true);
            return;
          }

          const json = JSON.parse(text) as unknown;
          const ok = await galaxyScene.loadMapData(json);

          if (!ok) {
            setImportStatus("Invalid map JSON (see console).", true);
            return;
          }

          syncBackgroundControls();
          syncEditModeControls();
          onMapUpdated();
          setImportStatus(
            `Loaded ${galaxyScene.getSystems().length} systems.`
          );
        } catch (err) {
          console.error("Invalid JSON file", err);
          setImportStatus("Invalid JSON file.", true);
        } finally {
          fileInput.value = "";
        }
      })();
    };

    reader.readAsText(file);
  });
});
