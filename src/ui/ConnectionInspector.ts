import { selectionManager } from "../editor/SelectionManager";
import { ConnectionLine } from "../galaxy/ConnectionLine";
import { galaxyScene } from "../scene/GalaxyScene";
import { routeLabel, type RouteType, type SystemConnection } from "../data/ConnectionTypes";
import type { RouteTimelineEntryType } from "../data/RouteTypes";
import { getRouteTimelineLabel, getRouteTypeLabel } from "../i18n/routeLabels";
import { getLocale, t } from "../i18n/locale";
import { ensureRouteTimelineEntry, syncPresentRouteStatus } from "../data/routeState";
import { sidebar } from "./Sidebar";
import { createAutoSave } from "./autoSave";
import { isPlayMode } from "./playModeUi";

export class ConnectionInspector {
  private emptyEl = document.getElementById("route-empty")!;
  private formEl = document.getElementById("route-form")!;
  private labelEl = document.getElementById("route-endpoints-label")!;
  private nameInput = document.getElementById("route-name") as HTMLInputElement;
  private typeSelect = document.getElementById("route-type") as HTMLSelectElement;
  private listEl = document.getElementById("route-timeline-list")!;
  private eventYear = document.getElementById("route-event-year") as HTMLInputElement;
  private eventType = document.getElementById("route-event-type") as HTMLSelectElement;
  private eventTitle = document.getElementById("route-event-title") as HTMLInputElement;
  private eventDescription = document.getElementById(
    "route-event-description",
  ) as HTMLTextAreaElement;
  private editingEventId: string | null = null;
  private activeLine: ConnectionLine | null = null;
  private autoSave = createAutoSave();

  constructor() {
    this.populateRouteTypes();
    this.populateEventTypes();
    this.bindAutoSave();

    document.getElementById("route-delete-btn")?.addEventListener("click", () => {
      if (isPlayMode()) return;
      galaxyScene.deleteSelectedConnection();
      this.clear();
    });

    document.getElementById("route-event-clear")?.addEventListener("click", () => {
      this.resetEventForm();
    });

    document.addEventListener("connection:selected", ((e: CustomEvent<ConnectionLine>) => {
      this.load(e.detail);
    }) as EventListener);
    document.addEventListener("connection:deselected", () => this.clear());
    document.addEventListener("locale:changed", () => {
      this.populateRouteTypes();
      this.populateEventTypes();
      const conn = this.getConn();
      if (conn) this.renderEventList(conn);
    });
  }

  private bindAutoSave() {
    const scheduleMeta = () => this.autoSave.schedule(() => this.saveRouteMeta());
    const scheduleEvent = () => this.autoSave.schedule(() => this.saveRouteEvent());

    this.nameInput?.addEventListener("input", scheduleMeta);
    this.nameInput?.addEventListener("change", () => this.saveRouteMeta());
    this.typeSelect?.addEventListener("change", () => this.saveRouteMeta());

    for (const el of [this.eventYear, this.eventType, this.eventTitle, this.eventDescription]) {
      el?.addEventListener("input", scheduleEvent);
      el?.addEventListener("change", () => this.saveRouteEvent());
    }
  }

  private populateRouteTypes() {
    this.typeSelect.innerHTML = "";
    const locale = getLocale();
    const types: RouteType[] = ["hyperlane", "trade", "military", "clandestine"];
    types.forEach((type) => {
      const opt = document.createElement("option");
      opt.value = type;
      opt.textContent = getRouteTypeLabel(type, locale);
      this.typeSelect.appendChild(opt);
    });
  }

  private populateEventTypes() {
    this.eventType.innerHTML = "";
    const locale = getLocale();
    const types: RouteTimelineEntryType[] = ["route_open", "route_close"];
    types.forEach((type) => {
      const opt = document.createElement("option");
      opt.value = type;
      opt.textContent = getRouteTimelineLabel(type, locale);
      this.eventType.appendChild(opt);
    });
  }

  private getConn(): SystemConnection | undefined {
    if (!this.activeLine) return undefined;
    return galaxyScene.getConnectionById(this.activeLine.connectionId);
  }

  private load(line: ConnectionLine) {
    this.activeLine = line;
    sidebar.activate("routes");
    const conn = this.getConn();
    if (!conn) return;

    this.autoSave.runSuppressed(() => {
      this.emptyEl.hidden = true;
      this.formEl.hidden = false;
      this.labelEl.textContent = routeLabel(conn, line.fromNode.data.name, line.toNode.data.name);
      this.nameInput.value = conn.name ?? "";
      this.typeSelect.value = conn.routeType ?? "hyperlane";
      this.renderEventList(conn);
      this.resetEventForm();
    });
  }

  public clear() {
    this.activeLine = null;
    this.emptyEl.hidden = false;
    this.formEl.hidden = true;
    this.listEl.innerHTML = "";
    this.resetEventForm();
  }

  private saveRouteMeta() {
    if (isPlayMode()) return;
    const conn = this.getConn();
    if (!conn) return;
    conn.name = this.nameInput.value.trim() || undefined;
    conn.routeType = this.typeSelect.value as RouteType;
    galaxyScene.updateConnection({ ...conn });
    document.dispatchEvent(new CustomEvent("map:updated"));
  }

  private renderEventList(conn: SystemConnection) {
    const events = [...(conn.timeline ?? [])].sort(
      (a, b) => a.year - b.year || a.title.localeCompare(b.title),
    );
    if (events.length === 0) {
      this.listEl.innerHTML = `<p class="panel-empty">${t("routes.noEvents")}</p>`;
      return;
    }

    this.listEl.innerHTML = events
      .map(
        (e) => `
        <article class="timeline-entry" data-route-event="${e.id}">
          <div class="timeline-entry-head">
            <span class="timeline-year">Y${e.year}</span>
            <span class="timeline-type">${getRouteTimelineLabel(e.type, getLocale())}</span>
          </div>
          <strong>${escapeHtml(e.title)}</strong>
          ${e.description ? `<p>${escapeHtml(e.description)}</p>` : ""}
          <div class="timeline-entry-actions">
            <button type="button" class="btn-small" data-route-edit="${e.id}">${t("common.edit")}</button>
            <button type="button" class="btn-small btn-danger" data-route-del="${e.id}">${t("common.delete")}</button>
          </div>
        </article>`,
      )
      .join("");

    this.listEl.querySelectorAll("[data-route-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = (btn as HTMLElement).dataset.routeEdit!;
        const entry = conn.timeline?.find((e) => e.id === id);
        if (entry) this.loadEventToForm(entry);
      });
    });

    this.listEl.querySelectorAll("[data-route-del]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (isPlayMode()) return;
        const id = (btn as HTMLElement).dataset.routeDel!;
        conn.timeline = (conn.timeline ?? []).filter((e) => e.id !== id);
        syncPresentRouteStatus(conn, galaxyScene.getPresentYear());
        galaxyScene.updateConnection({ ...conn });
        this.renderEventList(conn);
        galaxyScene.applyTimelineView();
        document.dispatchEvent(new CustomEvent("map:updated"));
      });
    });
  }

  private loadEventToForm(entry: import("../data/RouteTypes").RouteTimelineEntry) {
    this.autoSave.runSuppressed(() => {
      this.editingEventId = entry.id;
      this.eventYear.value = String(entry.year);
      this.eventType.value = entry.type;
      this.eventTitle.value = entry.title;
      this.eventDescription.value = entry.description ?? "";
    });
  }

  private resetEventForm() {
    this.autoSave.runSuppressed(() => {
      this.editingEventId = null;
      this.eventYear.value = String(galaxyScene.getViewYear());
      this.eventType.value = "route_close";
      this.eventTitle.value = "";
      this.eventDescription.value = "";
    });
  }

  private saveRouteEvent() {
    if (isPlayMode()) return;
    const conn = this.getConn();
    if (!conn) return;
    const title = this.eventTitle.value.trim();
    if (!title) return;

    const entry = ensureRouteTimelineEntry({
      id: this.editingEventId ?? undefined,
      year: Number(this.eventYear.value) || galaxyScene.getViewYear(),
      type: this.eventType.value as RouteTimelineEntryType,
      title,
      description: this.eventDescription.value,
    });

    if (!conn.timeline) conn.timeline = [];
    const idx = conn.timeline.findIndex((e) => e.id === entry.id);
    if (idx >= 0) conn.timeline[idx] = entry;
    else conn.timeline.push(entry);

    syncPresentRouteStatus(conn, galaxyScene.getPresentYear());
    galaxyScene.updateConnection({ ...conn });
    this.editingEventId = entry.id;
    this.renderEventList(conn);
    galaxyScene.applyTimelineView();
    document.dispatchEvent(new CustomEvent("map:updated"));
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export const connectionInspector = new ConnectionInspector();
