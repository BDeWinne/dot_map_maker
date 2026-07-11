import { getPresetsForAppMode, presetUrl } from "../data/presetCatalog";
import { clearSavedMap, hasSavedMap, loadSavedMap } from "../data/mapPersistence";
import { isDemoMode } from "../config/demoMode";
import { galaxyScene } from "../scene/GalaxyScene";
import { t } from "../i18n/locale";

export class StartupScreen {
  private root = document.getElementById("startup-overlay");
  private presetsEl = document.getElementById("startup-presets");
  private continueBtn = document.getElementById("startup-continue") as HTMLButtonElement | null;
  private emptyBtn = document.getElementById("startup-empty");
  private closeBtn = document.getElementById("startup-close");
  private titleEl = document.getElementById("startup-title");
  private leadEl = document.querySelector(".startup-lead");

  public init() {
    if (!this.root) return;

    this.continueBtn?.addEventListener("click", () => {
      void this.continueLast();
    });
    this.emptyBtn?.addEventListener("click", () => {
      void this.startEmpty();
    });
    this.closeBtn?.addEventListener("click", () => this.hide());

    document.getElementById("open-startup-gallery")?.addEventListener("click", () => {
      this.show();
    });
    document.getElementById("map-new-empty")?.addEventListener("click", () => {
      if (window.confirm(t("startup.emptyConfirm"))) {
        void this.startEmpty();
      }
    });

    document.addEventListener("locale:changed", () => this.renderPresets());
    if (!isDemoMode()) {
      document.addEventListener("map:persisted", () => this.syncContinueButton());
      document.addEventListener("map:persist-cleared", () => this.syncContinueButton());
    }
    this.renderPresets();
    this.syncContinueButton();
  }

  public show() {
    if (!this.root) return;
    this.applyDemoCopy();
    this.syncContinueButton();
    this.root.hidden = false;
  }

  /** Demo entry: limited gallery, no continue / empty map. */
  public showDemo() {
    this.applyDemoCopy();
    this.show();
  }

  public hide() {
    if (this.root) this.root.hidden = true;
  }

  private applyDemoCopy() {
    if (!isDemoMode()) return;
    if (this.titleEl) this.titleEl.textContent = t("demo.startupTitle");
    if (this.leadEl) this.leadEl.textContent = t("demo.startupLead");
  }

  private syncContinueButton() {
    if (!this.continueBtn || isDemoMode()) return;
    const canContinue = hasSavedMap();
    this.continueBtn.disabled = !canContinue;
    this.continueBtn.classList.toggle("is-disabled", !canContinue);
    this.continueBtn.title = canContinue
      ? t("startup.continueHint")
      : t("startup.continueUnavailable");
  }

  private renderPresets() {
    if (!this.presetsEl) return;
    this.presetsEl.innerHTML = "";

    const presets = getPresetsForAppMode(isDemoMode());
    for (const preset of presets) {
      const card = document.createElement("article");
      card.className = "startup-preset-card";

      const title = document.createElement("h4");
      title.className = "startup-preset-title";
      title.textContent = t(preset.titleKey as "preset.galaxy.title");

      const desc = document.createElement("p");
      desc.className = "startup-preset-desc";
      desc.textContent = t(preset.descKey as "preset.galaxy.desc");

      const tags = document.createElement("div");
      tags.className = "startup-preset-tags";
      for (const key of preset.featureKeys) {
        const tag = document.createElement("span");
        tag.className = "startup-preset-tag";
        tag.textContent = t(key as "preset.feat.timeline");
        tags.appendChild(tag);
      }

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "startup-preset-load";
      btn.textContent = isDemoMode() ? t("demo.loadExplore") : t("startup.loadPreset");
      btn.addEventListener("click", () => {
        void this.loadPreset(preset.file);
      });

      card.append(title, desc, tags, btn);
      this.presetsEl.appendChild(card);
    }
  }

  private async continueLast() {
    if (isDemoMode() || !hasSavedMap()) {
      this.syncContinueButton();
      return;
    }
    const ok = await loadSavedMap();
    if (ok) {
      this.hide();
      return;
    }
    window.alert(t("startup.continueFailed"));
    this.syncContinueButton();
  }

  private async startEmpty() {
    if (isDemoMode()) return;
    galaxyScene.clearMap();
    clearSavedMap();
    galaxyScene.setPlayMode(false);
    document.dispatchEvent(new CustomEvent("mapProfile:changed"));
    document.dispatchEvent(new CustomEvent("map:loaded"));
    document.dispatchEvent(new CustomEvent("map:updated"));
    this.hide();
  }

  public async loadPreset(file: string) {
    try {
      const res = await fetch(presetUrl(file));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as unknown;
      const ok = await galaxyScene.loadMapData(data);
      if (ok) this.hide();
    } catch (err) {
      console.error("Failed to load preset", file, err);
    }
  }
}

export const startupScreen = new StartupScreen();
