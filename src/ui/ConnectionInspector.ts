import { selectionManager } from "../editor/SelectionManager";
import { ConnectionLine } from "../galaxy/ConnectionLine";
import { galaxyScene } from "../scene/GalaxyScene";
import {
  ROUTE_TYPE_LABELS,
  routeLabel,
  type RouteType,
  type SystemConnection,
} from "../data/ConnectionTypes";
import {
  ROUTE_TIMELINE_LABELS,
  type RouteTimelineEntryType,
} from "../data/RouteTypes";
import { ensureRouteTimelineEntry, syncPresentRouteStatus } from "../data/routeState";
import { sidebar } from "./Sidebar";

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

  constructor() {
    this.populateRouteTypes();
    this.populateEventTypes();

    document.getElementById("route-save-btn")?.addEventListener("click", () => {
      this.saveRouteMeta();
    });
    document.getElementById("route-event-save")?.addEventListener("click", () => {
      this.saveRouteEvent();
    });
    document.getElementById("route-event-clear")?.addEventListener("click", () => {
      this.resetEventForm();
    });

    document.addEventListener("connection:selected", ((e: CustomEvent<ConnectionLine>) => {
      this.load(e.detail);
    }) as EventListener);
    document.addEventListener("connection:deselected", () => this.clear());
  }

  private populateRouteTypes() {
    this.typeSelect.innerHTML = "";
    (Object.keys(ROUTE_TYPE_LABELS) as RouteType[]).forEach((type) => {
      const opt = document.createElement("option");
      opt.value = type;
      opt.textContent = ROUTE_TYPE_LABELS[type];
      this.typeSelect.appendChild(opt);
    });
  }

  private populateEventTypes() {
    this.eventType.innerHTML = "";
    (Object.keys(ROUTE_TIMELINE_LABELS) as RouteTimelineEntryType[]).forEach(
      (type) => {
        const opt = document.createElement("option");
        opt.value = type;
        opt.textContent = ROUTE_TIMELINE_LABELS[type];
        this.eventType.appendChild(opt);
      },
    );
  }

  private getConn(): SystemConnection | null {
    if (!this.activeLine) return null;
    return galaxyScene.getConnectionById(this.activeLine.connectionId) ?? null;
  }

  public load(line: ConnectionLine) {
    const conn = galaxyScene.getConnectionById(line.connectionId);
    if (!conn) return;

    this.activeLine = line;
    this.emptyEl.hidden = true;
    this.formEl.hidden = false;
    sidebar.activate("routes");

    this.labelEl.textContent = routeLabel(
      conn,
      line.fromNode.data.name,
      line.toNode.data.name,
    );
    this.nameInput.value = conn.name ?? "";
    this.typeSelect.value = conn.routeType ?? "hyperlane";
    this.renderEventList(conn);
    this.resetEventForm();
  }

  public clear() {
    this.activeLine = null;
    this.emptyEl.hidden = false;
    this.formEl.hidden = true;
    this.listEl.innerHTML = "";
    this.resetEventForm();
  }

  private saveRouteMeta() {
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
      this.listEl.innerHTML = `<p class="panel-empty">No route events yet.</p>`;
      return;
    }

    this.listEl.innerHTML = events
      .map(
        (e) => `
        <article class="timeline-entry" data-route-event="${e.id}">
          <div class="timeline-entry-head">
            <span class="timeline-year">Y${e.year}</span>
            <span class="timeline-type">${ROUTE_TIMELINE_LABELS[e.type]}</span>
          </div>
          <strong>${escapeHtml(e.title)}</strong>
          ${e.description ? `<p>${escapeHtml(e.description)}</p>` : ""}
          <div class="timeline-entry-actions">
            <button type="button" class="btn-small" data-route-edit="${e.id}">Edit</button>
            <button type="button" class="btn-small btn-danger" data-route-del="${e.id}">Delete</button>
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
    this.editingEventId = entry.id;
    this.eventYear.value = String(entry.year);
    this.eventType.value = entry.type;
    this.eventTitle.value = entry.title;
    this.eventDescription.value = entry.description ?? "";
  }

  private resetEventForm() {
    this.editingEventId = null;
    this.eventYear.value = String(galaxyScene.getViewYear());
    this.eventType.value = "route_close";
    this.eventTitle.value = "";
    this.eventDescription.value = "";
  }

  private saveRouteEvent() {
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
    this.resetEventForm();
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
