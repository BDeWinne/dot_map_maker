import { galaxyScene } from "../scene/GalaxyScene";
import { getLocale, t } from "../i18n/locale";

export class YearScrubber {
  private valueEl = document.getElementById("year-value")!;
  private displayBtn = document.getElementById("year-display") as HTMLButtonElement;
  private epochEl = document.getElementById("year-epoch")!;

  constructor() {
    document.getElementById("year-prev")?.addEventListener("click", () => {
      galaxyScene.setViewYear(galaxyScene.getViewYear() - 1);
    });

    document.getElementById("year-next")?.addEventListener("click", () => {
      galaxyScene.setViewYear(galaxyScene.getViewYear() + 1);
    });

    this.displayBtn.addEventListener("click", () => this.promptYear());

    document.addEventListener("viewYear:changed", ((e: CustomEvent<{ year: number }>) => {
      this.sync(e.detail.year);
    }) as EventListener);

    document.addEventListener("map:loaded", () => this.sync(galaxyScene.getViewYear()));
    document.addEventListener("map:updated", () => this.syncEpoch());
    document.addEventListener("calendar:changed", () => this.syncEpoch());
    document.addEventListener("locale:changed", () => {
      this.sync(galaxyScene.getViewYear());
      this.syncEpoch();
    });

    this.sync(galaxyScene.getViewYear());
    this.syncEpoch();
  }

  private promptYear() {
    const current = galaxyScene.getViewYear();
    const raw = window.prompt(t("year.prompt"), String(current));
    if (raw === null || raw.trim() === "") return;
    galaxyScene.setViewYear(Number(raw));
  }

  private sync(year: number) {
    this.valueEl.textContent = String(year);
    const present = galaxyScene.getPresentYear();
    const historical = year < present;
    this.displayBtn.classList.toggle("is-historical", historical);
    const locale = getLocale();
    this.displayBtn.title = historical
      ? t("year.historicalTitle", locale).replace("{present}", String(present))
      : t("year.presentTitle", locale).replace("{present}", String(present));
  }

  private syncEpoch() {
    const epoch = galaxyScene.getCalendar().epoch?.trim();
    this.epochEl.textContent = epoch ? ` ${epoch}` : "";
  }
}

export const yearScrubber = new YearScrubber();
