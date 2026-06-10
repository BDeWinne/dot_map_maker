import { buildGalaxyChronicle, type ChronicleItem } from "../data/galaxyChronicle";
import type { TimelineEntryType } from "../data/TimelineTypes";
import type { RouteTimelineEntryType } from "../data/RouteTypes";
import { getTimelineEntryLabel } from "../i18n/timelineLabels";
import { getRouteTimelineLabel } from "../i18n/routeLabels";
import { getLocale, t } from "../i18n/locale";
import { selectionManager } from "../editor/SelectionManager";
import { ownerManager } from "../galaxy/OwnerManager";
import { galaxyScene } from "../scene/GalaxyScene";
import { sidebar } from "./Sidebar";

export class ChroniclePanel {
  private listEl = document.getElementById("chronicle-list")!;
  private ownerFilter = document.getElementById("chronicle-filter-owner") as HTMLSelectElement;
  private typeFilter = document.getElementById("chronicle-filter-type") as HTMLSelectElement;
  private searchInput = document.getElementById("chronicle-search") as HTMLInputElement;
  private limitYearCheck = document.getElementById("chronicle-limit-year") as HTMLInputElement;

  constructor() {
    this.populateFilters();
    this.ownerFilter.addEventListener("change", () => this.refresh());
    this.typeFilter.addEventListener("change", () => this.refresh());
    this.searchInput.addEventListener("input", () => this.refresh());
    this.limitYearCheck.addEventListener("change", () => this.refresh());

    document.addEventListener("map:updated", () => this.refresh());
    document.addEventListener("viewYear:changed", () => this.refresh());
    document.addEventListener("map:loaded", () => {
      this.populateFilters();
      this.refresh();
    });
    document.addEventListener("locale:changed", () => {
      this.populateFilters();
      this.refresh();
    });
    this.refresh();
  }

  private populateFilters() {
    this.ownerFilter.innerHTML = `<option value="">${t("chronicle.allActors")}</option>`;
    ownerManager.getAll().forEach((o) => {
      if (o.id === "none") return;
      const opt = document.createElement("option");
      opt.value = o.id;
      opt.textContent = `${o.short} — ${o.name}`;
      this.ownerFilter.appendChild(opt);
    });

    const locale = getLocale();
    this.typeFilter.innerHTML = `<option value="">${t("chronicle.allTypes")}</option>`;
    const types = new Map<string, string>();
    const timelineTypes: TimelineEntryType[] = [
      "colonized", "owner_change", "occupied", "liberated", "abandoned",
      "population", "fleet_change", "fleet_move", "economy", "minerals", "event", "custom",
    ];
    for (const k of timelineTypes) {
      types.set(k, getTimelineEntryLabel(k, locale));
    }
    const routeTypes: RouteTimelineEntryType[] = ["route_open", "route_close"];
    for (const k of routeTypes) {
      types.set(k, getRouteTimelineLabel(k, locale));
    }
    for (const [k, label] of types) {
      const opt = document.createElement("option");
      opt.value = k;
      opt.textContent = label;
      this.typeFilter.appendChild(opt);
    }
  }

  public refresh() {
    const items = buildGalaxyChronicle(
      galaxyScene.getSystems().map((n) => n.data),
      galaxyScene.getConnections(),
      {
        ownerId: this.ownerFilter.value || undefined,
        type: this.typeFilter.value || undefined,
        search: this.searchInput.value,
        maxYear: this.limitYearCheck.checked
          ? galaxyScene.getViewYear()
          : undefined,
      },
    );

    if (items.length === 0) {
      this.listEl.innerHTML = `<p class="panel-empty">${t("chronicle.empty")}</p>`;
      return;
    }

    const epoch = galaxyScene.getCalendar().epoch ?? "";
    this.listEl.innerHTML = items
      .map((item) => this.renderItem(item, epoch))
      .join("");

    this.listEl.querySelectorAll("[data-chronicle-id]").forEach((el) => {
      el.addEventListener("click", () => {
        const id = (el as HTMLElement).dataset.chronicleId!;
        const item = items.find((i) => i.id === id);
        if (item) this.goToItem(item);
      });
    });
  }

  private renderItem(item: ChronicleItem, epoch: string): string {
    const where =
      item.source === "system"
        ? item.systemName
        : item.routeName ?? "Route";
    const actor = item.actorId
      ? ownerManager.get(item.actorId).short
      : "";
    const meta = [where, actor, item.extras].filter(Boolean).join(" · ");
    return `
      <article class="chronicle-entry timeline-entry" data-chronicle-id="${item.id}" role="button" tabindex="0">
        <div class="timeline-entry-head">
          <span class="timeline-year">Y${item.year}${epoch ? ` ${epoch}` : ""}</span>
          <span class="timeline-type">${escapeHtml(item.typeLabel)}</span>
        </div>
        <strong>${escapeHtml(item.title)}</strong>
        ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ""}
        <p class="timeline-meta">${escapeHtml(meta)}</p>
      </article>`;
  }

  private goToItem(item: ChronicleItem) {
    galaxyScene.setViewYear(item.year);
    sidebar.activate("chronicle");

    if (item.systemId) {
      const node = galaxyScene.getSystems().find((n) => n.data.id === item.systemId);
      if (node) selectionManager.selectNode(node);
      return;
    }

    if (item.connectionId) {
      const line = galaxyScene
        .getConnectionLines()
        .find((l) => l.connectionId === item.connectionId);
      if (line) selectionManager.selectConnection(line);
    }
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export const chroniclePanel = new ChroniclePanel();
