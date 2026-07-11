import { getHelpHtml } from "../ui/helpContent";
import { welcomeScreen } from "../ui/WelcomeScreen";
import { mapProfilePanel } from "../ui/MapProfilePanel";
import { applyLocaleToDom, getLocale, setLocale, type Locale } from "./locale";

let bound = false;

export function initLocaleController() {
  bindLocaleButtons();
  applyLocaleToDom();
  onLocaleApplied();
}

function bindLocaleButtons() {
  if (bound) return;
  bound = true;

  document.querySelectorAll<HTMLButtonElement>("[data-locale-set]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const loc = btn.dataset.localeSet as Locale;
      if (loc === "es" || loc === "en") setLocale(loc);
    });
  });

  document.addEventListener("locale:changed", () => onLocaleApplied());
}

function onLocaleApplied() {
  renderHelpContent();
  welcomeScreen.renderContent();
  mapProfilePanel.buildProfileOptions();
  mapProfilePanel.applyTerminology();
}

function renderHelpContent() {
  const container = document.getElementById("help-content");
  if (!container) return;
  container.innerHTML = getHelpHtml(getLocale());
}
