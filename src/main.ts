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
import { mapProfilePanel } from "./ui/MapProfilePanel";
import { mapCalendarSettings } from "./ui/MapCalendarSettings";
import { yearScrubber } from "./ui/YearScrubber";
import { getActiveTerminology } from "./ui/MapProfilePanel";
import { initLocaleController } from "./i18n/LocaleController";
import { getLocale, t } from "./i18n/locale";
import { exportMapAsPng } from "./ui/visualExport";
import { mapStatusHud } from "./ui/MapStatusHud";
import { milestoneHud } from "./ui/MilestoneHud";
import { nodeSearch } from "./ui/NodeSearch";
import { mapValidationPanel } from "./ui/MapValidationPanel";
import { exportPlayProgressFile, importPlayProgressFile } from "./ui/playProgressExport";
import { initPlayModeUi, syncPlayModeUi } from "./ui/playModeUi";
import { initMapPersistence } from "./data/mapPersistence";
import { startupScreen } from "./ui/StartupScreen";
import { undoManager } from "./editor/UndoManager";

new Game();
initMapPersistence();
nodeInspector;
timelinePanel;
ownerEditor;
yearScrubber;
chroniclePanel;
connectionInspector;
mapViewToggles;
mapProfilePanel;
mapCalendarSettings;

function syncEditModeHint() {
  const hint = document.getElementById("map-edit-mode-hint");
  if (!hint) return;
  const mode = galaxyScene.getEditMode();
  if (mode === "edit") {
    hint.textContent = getActiveTerminology().placeNodesHint;
  } else if (mode === "moveBackground") {
    hint.textContent = t("editMode.moveBg");
  } else {
    hint.textContent = t("editMode.moveNodes");
  }
}

function syncEditModeControls() {
  const modeSelect = document.getElementById("hud-map-edit-mode") as HTMLSelectElement | null;
  const hint = document.getElementById("map-edit-mode-hint");
  const moveBackgroundOption = modeSelect?.querySelector(
    'option[value="moveBackground"]',
  ) as HTMLOptionElement | null;

  if (moveBackgroundOption) {
    moveBackgroundOption.disabled = !galaxyScene.hasBackground();
  }

  if (modeSelect?.value === "moveBackground" && !galaxyScene.hasBackground()) {
    modeSelect.value = "edit";
    galaxyScene.setEditMode("edit");
  }

  if (modeSelect && modeSelect.value !== galaxyScene.getEditMode()) {
    modeSelect.value = galaxyScene.getEditMode();
  }

  if (hint) {
    syncEditModeHint();
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

function bootUi() {
  sidebar.init();
  nodeInspector.init();
  mapStatusHud.init();
  milestoneHud.init();
  nodeSearch.init();
  mapValidationPanel.init();
  undoManager.init();
  initLocaleController();
  mapProfilePanel.init();
  mapCalendarSettings.init();
  initPlayModeUi();
  startupScreen.init();
  populateFacilityLegend();

  document.addEventListener("map:persisted", () => {
    const el = document.getElementById("map-persist-status");
    if (el) el.textContent = t("map.persisted");
  });

  document.addEventListener("editMode:changed", syncEditModeControls);
  document.addEventListener("playMode:changed", syncEditModeControls);

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
  document.addEventListener("terminology:changed", syncEditModeControls);
  document.addEventListener("mapProfile:changed", syncEditModeControls);
  document.addEventListener("locale:changed", syncEditModeControls);
  galaxyScene.setViewYear(galaxyScene.getCalendar().defaultYear ?? 2200);

  syncEditModeControls();
  syncBackgroundControls();
  syncPlayModeUi();

  const importStatus = document.getElementById("import-status");
  const setImportStatus = (message: string, isError = false) => {
    if (!importStatus) return;
    importStatus.textContent = message;
    importStatus.style.color = isError ? "#f88" : "#8c8";
  };

  const exportPlayBtn = document.getElementById("export-play-progress");
  const importPlayBtn = document.getElementById("import-play-progress");
  const importPlayFile = document.getElementById("import-play-progress-file") as HTMLInputElement | null;
  const playProgressStatus = document.getElementById("play-progress-status");

  exportPlayBtn?.addEventListener("click", () => {
    exportPlayProgressFile();
    if (playProgressStatus) playProgressStatus.textContent = t("play.export");
  });

  importPlayBtn?.addEventListener("click", () => importPlayFile?.click());

  importPlayFile?.addEventListener("change", () => {
    const file = importPlayFile.files?.[0];
    if (!file) return;
    void importPlayProgressFile(file)
      .then((msg) => {
        if (playProgressStatus) playProgressStatus.textContent = msg;
      })
      .catch(() => {
        if (playProgressStatus) {
          playProgressStatus.textContent = t("map.importBadJson");
          playProgressStatus.style.color = "#f88";
        }
      })
      .finally(() => {
        importPlayFile.value = "";
      });
  });

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
    a.download = getActiveTerminology().exportFilename;
    a.click();
    URL.revokeObjectURL(url);
  });

  exportPngBtn?.addEventListener("click", () => {
    setImportStatus(t("map.exportPngBusy"));
    void exportMapAsPng()
      .then((ok) => {
        setImportStatus(ok ? t("map.exportPngOk") : t("map.exportPngFail"), !ok);
      })
      .catch((err) => {
        console.error("PNG export failed", err);
        setImportStatus(t("map.exportPngFail"), true);
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

    setImportStatus(t("map.importLoading"));

    const reader = new FileReader();

    reader.onerror = () => {
      setImportStatus(t("map.importReadFail"), true);
      fileInput.value = "";
    };

    reader.onload = (e) => {
      void (async () => {
        try {
          const text = e.target?.result;
          if (typeof text !== "string") {
            setImportStatus(t("map.importEmpty"), true);
            return;
          }

          const json = JSON.parse(text) as unknown;
          const ok = await galaxyScene.loadMapData(json);

          if (!ok) {
            setImportStatus(t("map.importInvalid"), true);
            return;
          }

          startupScreen.hide();
          syncBackgroundControls();
          syncEditModeControls();
          onMapUpdated();
          setImportStatus(
            t("map.importOk", getLocale(), { n: galaxyScene.getSystems().length }),
          );
        } catch (err) {
          console.error("Invalid JSON file", err);
          setImportStatus(t("map.importBadJson"), true);
        } finally {
          fileInput.value = "";
        }
      })();
    };

    reader.readAsText(file);
  });
}

bootUi();

void Game.whenReady().then(() => {
  startupScreen.show();
});
