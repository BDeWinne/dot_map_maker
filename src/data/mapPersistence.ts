import { galaxyScene } from "../scene/GalaxyScene";
import { isDemoMode } from "../config/demoMode";

const LS_MAP = "dotMapMaker:lastMap";
/** Skip embedding huge background blobs in autosave (localStorage ~5 MB). */
const MAX_AUTOSAVE_DATA_URL_CHARS = 400_000;

let suppressDepth = 0;
let timer: ReturnType<typeof setTimeout> | null = null;

export function hasSavedMap(): boolean {
  try {
    return !!localStorage.getItem(LS_MAP);
  } catch {
    return false;
  }
}

/** True when the current map has at least one node (worth warning on exit). */
export function mapHasContent(): boolean {
  try {
    return galaxyScene.getSystems().length > 0;
  } catch {
    return false;
  }
}

export function isPersistenceAvailable(): boolean {
  try {
    const key = "__dotMapMaker_ls_test__";
    localStorage.setItem(key, "1");
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function clearSavedMap() {
  try {
    localStorage.removeItem(LS_MAP);
    document.dispatchEvent(new CustomEvent("map:persist-cleared"));
  } catch {
    /* ignore */
  }
}

function buildPersistPayload() {
  const data = galaxyScene.getMapData();
  const payload = structuredClone(data);
  const dataUrl = payload.background?.dataUrl;
  if (dataUrl && dataUrl.length > MAX_AUTOSAVE_DATA_URL_CHARS) {
    delete payload.background!.dataUrl;
  }
  return payload;
}

export function saveMapNow(): boolean {
  if (isDemoMode()) return false;
  if (!mapHasContent()) {
    // Do not wipe an existing autosave while the in-memory scene is still empty (app boot).
    return false;
  }
  if (!isPersistenceAvailable()) {
    console.warn("localStorage unavailable — map will not auto-save");
    return false;
  }
  try {
    const json = JSON.stringify(buildPersistPayload());
    localStorage.setItem(LS_MAP, json);
    document.dispatchEvent(new CustomEvent("map:persisted"));
    return true;
  } catch (err) {
    console.warn("Could not persist map", err);
    document.dispatchEvent(
      new CustomEvent("map:persist-failed", { detail: { error: err } }),
    );
    return false;
  }
}

/** Immediate save (e.g. before closing the tab). */
export function flushMapSave(): boolean {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  return saveMapNow();
}

export async function loadSavedMap(): Promise<boolean> {
  try {
    const raw = localStorage.getItem(LS_MAP);
    if (!raw) return false;
    const data = JSON.parse(raw) as unknown;
    return galaxyScene.loadMapData(data);
  } catch (err) {
    console.warn("Could not load saved map", err);
    return false;
  }
}

export function runWithoutPersist<T>(fn: () => T | Promise<T>): T | Promise<T> {
  suppressDepth++;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result.finally(() => {
        suppressDepth = Math.max(0, suppressDepth - 1);
      });
    }
    suppressDepth = Math.max(0, suppressDepth - 1);
    return result;
  } catch (err) {
    suppressDepth = Math.max(0, suppressDepth - 1);
    throw err;
  }
}

function schedulePersist() {
  if (suppressDepth > 0) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    saveMapNow();
  }, 700);
}

export function initMapPersistence() {
  if (isDemoMode()) {
    return { runWithoutPersist };
  }

  document.addEventListener("map:loading", () => {
    suppressDepth++;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  });

  document.addEventListener("map:load-ended", () => {
    suppressDepth = Math.max(0, suppressDepth - 1);
  });

  document.addEventListener("map:updated", schedulePersist);

  document.addEventListener("map:loaded", () => {
    schedulePersist();
    saveMapNow();
  });

  return { runWithoutPersist };
}
