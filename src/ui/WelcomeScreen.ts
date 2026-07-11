import { getLocale } from "../i18n/locale";
import { getWelcomeHelpHtml } from "./welcomeHelpContent";

const LS_INTRO_SEEN = "dotMapMaker:introSeen";

export class WelcomeScreen {
  private root = document.getElementById("welcome-overlay");
  private contentEl = document.getElementById("welcome-content");
  private continueBtn = document.getElementById("welcome-continue");
  private onContinue: (() => void) | null = null;

  public init() {
    if (!this.root) return;

    this.continueBtn?.addEventListener("click", () => {
      this.markSeen();
      this.hide();
      this.onContinue?.();
      this.onContinue = null;
    });

    document.addEventListener("locale:changed", () => this.renderContent());
  }

  public shouldShow(): boolean {
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
  }

  private hasSeen(): boolean {
    try {
      return localStorage.getItem(LS_INTRO_SEEN) === "1";
    } catch {
      return false;
    }
  }

  private markSeen() {
    try {
      localStorage.setItem(LS_INTRO_SEEN, "1");
    } catch {
      /* ignore */
    }
  }
}

export const welcomeScreen = new WelcomeScreen();
