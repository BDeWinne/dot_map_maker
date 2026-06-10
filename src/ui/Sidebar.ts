export type SidebarTabId =
  | "system"
  | "map"
  | "owners"
  | "timeline"
  | "chronicle"
  | "routes"
  | "stats"
  | "help";

export class Sidebar {
  private activeTab: SidebarTabId = "map";
  private readonly tabButtons = new Map<SidebarTabId, HTMLButtonElement>();
  private readonly tabPanels = new Map<SidebarTabId, HTMLElement>();
  private onTabChange?: (tab: SidebarTabId) => void;
  private bound = false;

  public init() {
    if (this.bound) return;
    this.bound = true;

    document.querySelectorAll<HTMLButtonElement>("[data-sidebar-tab]").forEach((btn) => {
      const tab = btn.dataset.sidebarTab as SidebarTabId;
      this.tabButtons.set(tab, btn);
      btn.addEventListener("click", () => this.activate(tab));
    });

    document.querySelectorAll<HTMLElement>("[data-sidebar-panel]").forEach((panel) => {
      const tab = panel.dataset.sidebarPanel as SidebarTabId;
      this.tabPanels.set(tab, panel);
    });

    this.activate("map");
  }

  public onChange(handler: (tab: SidebarTabId) => void) {
    this.onTabChange = handler;
  }

  public getActiveTab(): SidebarTabId {
    return this.activeTab;
  }

  public activate(tab: SidebarTabId) {
    this.activeTab = tab;

    this.tabButtons.forEach((btn, id) => {
      btn.classList.toggle("is-active", id === tab);
      btn.setAttribute("aria-selected", id === tab ? "true" : "false");
    });

    this.tabPanels.forEach((panel, id) => {
      panel.classList.toggle("is-active", id === tab);
      panel.hidden = id !== tab;
    });

    this.onTabChange?.(tab);
  }
}

export const sidebar = new Sidebar();
