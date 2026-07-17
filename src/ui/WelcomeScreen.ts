import { getLocale, t } from "../i18n/locale";
import { isDemoMode } from "../config/demoMode";
import { getWelcomeHelpHtml } from "./welcomeHelpContent";

const LS_INTRO_SEEN = "dotMapMaker:introSeen";

export class WelcomeScreen {
  private root = document.getElementById("welcome-overlay");
  private contentEl = document.getElementById("welcome-content");
  private continueBtn = document.getElementById("welcome-continue");
  private titleEl = document.getElementById("welcome-title");
  private subEl = document.querySelector(".welcome-sub");
  private onContinue: (() => void) | null = null;

  public init() {
    if (!this.root) return;

    this.continueBtn?.addEventListener("click", () => {
      this.markSeen();
      this.hide();
      this.onContinue?.();
      this.onContinue = null;
    });

    document.addEventListener("locale:changed", () => {
      if (this.root && !this.root.hidden) this.renderContent();
    });
  }

  public shouldShow(): boolean {
    // Demo visitors should always see the intro before presets.
    if (isDemoMode()) return true;
    return !this.hasSeen();
  }

  public show(then: () => void) {
    if (!this.root) {
      then();
      return;
    }
    this.onContinue = then;
    this.renderContent();
    this.root.hidden = false;
  }

  public hide() {
    if (this.root) this.root.hidden = true;
  }

  public renderContent() {
    if (!this.contentEl) return;
    this.contentEl.innerHTML = getWelcomeHelpHtml(getLocale());

    if (isDemoMode()) {
      if (this.titleEl) this.titleEl.textContent = t("welcome.demoTitle");
      if (this.subEl) this.subEl.textContent = t("welcome.demoSubtitle");
      if (this.continueBtn) this.continueBtn.textContent = t("welcome.demoContinue");
    } else {
      if (this.titleEl) this.titleEl.textContent = t("welcome.title");
      if (this.subEl) this.subEl.textContent = t("welcome.subtitle");
      if (this.continueBtn) this.continueBtn.textContent = t("welcome.continue");
    }
  }

  private hasSeen(): boolean {
    try {
      return localStorage.getItem(LS_INTRO_SEEN) === "1";
    } catch {
      return false;
    }
  }

  private markSeen() {
    // Demo does not persist "seen" — intro shows every visit.
    if (isDemoMode()) return;
    try {
      localStorage.setItem(LS_INTRO_SEEN, "1");
    } catch {
      /* ignore */
    }
  }
}

export const welcomeScreen = new WelcomeScreen();
