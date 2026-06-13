import { galaxyScene } from "../scene/GalaxyScene";

interface CalendarInputs {
  epoch: HTMLInputElement;
  defaultYear: HTMLInputElement;
}

export class MapCalendarSettings {
  private groups: CalendarInputs[] = [];
  private bound = false;

  constructor() {
    document.addEventListener("map:loaded", () => this.syncFromScene());
    document.addEventListener("calendar:changed", () => this.syncFromScene());
  }

  public init() {
    this.bindControls();
    this.syncFromScene();
  }

  private bindControls() {
    if (this.bound) return;
    this.bound = true;

    this.registerGroup("map-epoch", "map-default-year");
    this.registerGroup("map-epoch-map", "map-default-year-map");

    document.getElementById("map-set-view-default-year")?.addEventListener("click", () => {
      galaxyScene.setViewYear(galaxyScene.getCalendar().defaultYear ?? 2200);
    });
  }

  private registerGroup(epochId: string, yearId: string) {
    const epoch = document.getElementById(epochId) as HTMLInputElement | null;
    const defaultYear = document.getElementById(yearId) as HTMLInputElement | null;
    if (!epoch || !defaultYear) return;
    if (this.groups.some((g) => g.epoch === epoch)) return;

    this.groups.push({ epoch, defaultYear });

    const apply = () => {
      const y = Math.round(Number(defaultYear.value));
      galaxyScene.setCalendar(epoch.value, Number.isFinite(y) ? y : 2200);
    };

    epoch.addEventListener("input", apply);
    epoch.addEventListener("change", apply);
    defaultYear.addEventListener("input", apply);
    defaultYear.addEventListener("change", apply);
  }

  public syncFromScene() {
    const cal = galaxyScene.getCalendar();
    const epoch = cal.epoch ?? "";
    const defaultYear = String(cal.defaultYear ?? 2200);
    for (const g of this.groups) {
      g.epoch.value = epoch;
      g.defaultYear.value = defaultYear;
    }
  }
}

export const mapCalendarSettings = new MapCalendarSettings();
