import { galaxyScene } from "../scene/GalaxyScene";

const LS_MAP = "dotMapMaker:lastMap";

export function hasSavedMap(): boolean {
  try {
    return !!localStorage.getItem(LS_MAP);
  } catch {
    return false;
  }
}

export function clearSavedMap() {
  try {
    localStorage.removeItem(LS_MAP);
  } catch {
    /* ignore */
  }
}

export function saveMapNow() {
  try {
    const data = galaxyScene.getMapData();
    localStorage.setItem(LS_MAP, JSON.stringify(data));
    document.dispatchEvent(new CustomEvent("map:persisted"));
  } catch (err) {
    console.warn("Could not persist map", err);
  }
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

export function initMapPersistence() {
  let suppressDepth = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const schedule = () => {
    if (suppressDepth > 0) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      saveMapNow();
    }, 700);
  };

  document.addEventListener("map:updated", schedule);
  document.addEventListener("map:loaded", schedule);

  return {
    runWithoutPersist<T>(fn: () => T | Promise<T>): T | Promise<T> {
      suppressDepth++;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      try {
        const result = fn();
        if (result instanceof Promise) {
          return result.finally(() => {
            suppressDepth--;
          });
        }
        suppressDepth--;
        return result;
      } catch (err) {
        suppressDepth--;
        throw err;
      }
    },
  };
}
