import { downloadMapJson } from "../data/mapExport";
import { flushMapSave, mapHasContent } from "../data/mapPersistence";
import { isDemoMode } from "../config/demoMode";

let modalOpen = false;
let skipExitGuard = false;

export function initExitGuard() {
  if (isDemoMode()) return;
  const overlay = document.getElementById("exit-guard-overlay");
  const exportBtn = document.getElementById("exit-guard-export");
  const stayBtn = document.getElementById("exit-guard-stay");
  const leaveBtn = document.getElementById("exit-guard-leave");

  exportBtn?.addEventListener("click", () => {
    downloadMapJson();
    skipExitGuard = true;
    hideExitModal();
  });

  stayBtn?.addEventListener("click", () => hideExitModal());

  leaveBtn?.addEventListener("click", () => {
    skipExitGuard = true;
    flushMapSave();
    hideExitModal();
    window.close();
  });

  window.addEventListener("beforeunload", (event) => {
    if (skipExitGuard || modalOpen || !mapHasContent()) return;
    flushMapSave();
    event.preventDefault();
    event.returnValue = "";
  });

  window.addEventListener("pagehide", () => {
    flushMapSave();
  });

  document.documentElement.addEventListener("mouseleave", (event) => {
    if (event.clientY > 0 || skipExitGuard || modalOpen || !mapHasContent()) {
      return;
    }
    showExitModal();
  });

  function showExitModal() {
    if (!overlay || modalOpen) return;
    modalOpen = true;
    overlay.hidden = false;
  }

  function hideExitModal() {
    if (!overlay) return;
    modalOpen = false;
    overlay.hidden = true;
  }
}

/** Call after successful export if you want to suppress further warnings this session. */
export function suppressExitGuardForSession() {
  skipExitGuard = true;
}
