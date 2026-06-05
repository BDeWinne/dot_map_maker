import { selectionManager } from "../editor/SelectionManager";
import { galaxyScene } from "../scene/GalaxyScene";
import { ownerManager } from "../galaxy/OwnerManager";
import { syncPresentFieldsFromTimeline } from "../data/timelineState";
import { formatFleetsSummary, type FleetPresence } from "../data/FleetTypes";
import {
  TimelineEntry,
  TimelineEntryType,
  TIMELINE_ENTRY_LABELS,
} from "../data/TimelineTypes";
import type { NodeSystem } from "../galaxy/NodeSystem";
import { FleetRowEditor } from "./FleetRowEditor";

export class TimelinePanel {
  private systemLabel = document.getElementById("timeline-system-label")!;
  private listEl = document.getElementById("timeline-entries-list")!;
  private emptyEl = document.getElementById("timeline-no-system")!;
  private formWrap = document.getElementById("timeline-form-wrap")!;
  private epochInput = document.getElementById("map-epoch") as HTMLInputElement;
  private defaultYearInput = document.getElementById("map-default-year") as HTMLInputElement;
  private entryYear = document.getElementById("entry-year") as HTMLInputElement;
  private entryType = document.getElementById("entry-type") as HTMLSelectElement;
  private entryActor = document.getElementById("entry-actor") as HTMLSelectElement;
  private entryTitle = document.getElementById("entry-title") as HTMLInputElement;
  private entryDescription = document.getElementById("entry-description") as HTMLTextAreaElement;
  private entryPopulation = document.getElementById("entry-population") as HTMLInputElement;
  private entryEconomy = document.getElementById("entry-economy") as HTMLInputElement;
  private entryMinerals = document.getElementById("entry-minerals") as HTMLInputElement;
  private entryFlavor = document.getElementById("entry-flavor") as HTMLInputElement;
  private entryTargetSystem = document.getElementById("entry-target-system") as HTMLSelectElement;
  private entryFleetCount = document.getElementById("entry-fleet-count") as HTMLInputElement;
  private fleetMoveFields = document.getElementById("entry-fleet-move-fields")!;
  private fleetChangeFields = document.getElementById("entry-fleet-change-fields")!;
  private fleetRowEditor = new FleetRowEditor(
    document.getElementById("entry-fleets-editor")!,
    () => {
      const node = this.getSelectedNode();
      return this.entryActor.value || node?.data.owner || "none";
    },
  );
  private editingId: string | null = null;

  constructor() {
    this.populateEntryTypes();
    this.populateActors();

    document.getElementById("entry-fleet-add")?.addEventListener("click", () => {
      this.fleetRowEditor.addRow();
    });

    this.epochInput.addEventListener("change", () => {
      galaxyScene.setCalendar(this.epochInput.value, Number(this.defaultYearInput.value) || 2200);
    });
    this.defaultYearInput.addEventListener("change", () => {
      galaxyScene.setCalendar(this.epochInput.value, Number(this.defaultYearInput.value) || 2200);
    });

    document.getElementById("entry-add-btn")?.addEventListener("click", () => this.saveEntry());
    document.getElementById("entry-clear-btn")?.addEventListener("click", () => this.resetForm());

    this.entryType.addEventListener("change", () => this.syncFleetFieldVisibility());

    selectionManager.on("node:selected", (node: NodeSystem) => this.onNodeSelected(node));
    document.addEventListener("node:selected", ((e: CustomEvent<NodeSystem>) => {
      this.onNodeSelected(e.detail);
    }) as EventListener);
    document.addEventListener("node:deselected", () => this.onNodeCleared());

    this.loadCalendarFields();
    this.onNodeCleared();
  }

  private populateEntryTypes() {
    this.entryType.innerHTML = "";
    (Object.keys(TIMELINE_ENTRY_LABELS) as TimelineEntryType[]).forEach((type) => {
      const opt = document.createElement("option");
      opt.value = type;
      opt.textContent = TIMELINE_ENTRY_LABELS[type];
      this.entryType.appendChild(opt);
    });
  }

  public populateActors() {
    this.entryActor.innerHTML = `<option value="">—</option>`;
    ownerManager.getAll().forEach((o) => {
      if (o.id === "none") return;
      const opt = document.createElement("option");
      opt.value = o.id;
      opt.textContent = `${o.short} — ${o.name}`;
      this.entryActor.appendChild(opt);
    });
  }

  private loadCalendarFields() {
    const cal = galaxyScene.getCalendar();
    this.epochInput.value = cal.epoch ?? "";
    this.defaultYearInput.value = String(cal.defaultYear ?? 2200);
  }

  private onNodeSelected(node: NodeSystem) {
    this.emptyEl.hidden = true;
    this.formWrap.hidden = false;
    this.systemLabel.textContent = node.data.name;
    this.populateTargetSystems(node);
    this.resetForm();
    this.renderList(node);
  }

  private populateTargetSystems(current: NodeSystem) {
    this.entryTargetSystem.innerHTML = "";
    for (const node of galaxyScene.getSystems()) {
      if (node.data.id === current.data.id) continue;
      const opt = document.createElement("option");
      opt.value = node.data.id;
      opt.textContent = node.data.name;
      this.entryTargetSystem.appendChild(opt);
    }
  }

  private syncFleetFieldVisibility() {
    const type = this.entryType.value;
    this.fleetMoveFields.hidden = type !== "fleet_move";
    this.fleetChangeFields.hidden = type !== "fleet_change";
  }

  private onNodeCleared() {
    this.emptyEl.hidden = false;
    this.formWrap.hidden = true;
    this.systemLabel.textContent = "—";
    this.listEl.innerHTML = "";
    this.resetForm();
  }

  private getSelectedNode(): NodeSystem | null {
    return selectionManager.getSelected();
  }

  private ensureTimeline(node: NodeSystem): TimelineEntry[] {
    if (!node.data.timeline) node.data.timeline = [];
    return node.data.timeline;
  }

  private renderList(node: NodeSystem) {
    const entries = [...(node.data.timeline ?? [])].sort((a, b) => a.year - b.year || a.title.localeCompare(b.title));

    if (entries.length === 0) {
      this.listEl.innerHTML = `<p class="panel-empty">No events for this system yet.</p>`;
      return;
    }

    const cal = galaxyScene.getCalendar();
    const epoch = cal.epoch ? ` ${cal.epoch}` : "";

    this.listEl.innerHTML = entries
      .map((entry) => {
        const actor = entry.actorId ? ownerManager.get(entry.actorId).short : "—";
        const extras = [
          entry.population && `Pop: ${entry.population}`,
          entry.fleets?.length && `Flotas: ${formatFleetsSummary(entry.fleets)}`,
          entry.type === "fleet_move" &&
            entry.targetSystemId &&
            `→ ${galaxyScene.getSystems().find((n) => n.data.id === entry.targetSystemId)?.data.name ?? entry.targetSystemId}: ${entry.fleetCount ?? 0}`,
          entry.economy && `Eco: ${entry.economy}`,
          entry.minerals && `Res: ${entry.minerals}`,
        ]
          .filter(Boolean)
          .join(" · ");

        return `
          <article class="timeline-entry" data-entry-id="${entry.id}">
            <div class="timeline-entry-head">
              <span class="timeline-year">Y${entry.year}${epoch}</span>
              <span class="timeline-type">${TIMELINE_ENTRY_LABELS[entry.type]}</span>
            </div>
            <strong>${escapeHtml(entry.title)}</strong>
            ${entry.description ? `<p>${escapeHtml(entry.description)}</p>` : ""}
            <p class="timeline-meta">${escapeHtml(actor)}${extras ? ` · ${escapeHtml(extras)}` : ""}</p>
            ${entry.flavor ? `<p class="timeline-flavor">${escapeHtml(entry.flavor)}</p>` : ""}
            <div class="timeline-entry-actions">
              <button type="button" class="btn-small" data-edit="${entry.id}">Edit</button>
              <button type="button" class="btn-small btn-danger" data-delete="${entry.id}">Delete</button>
            </div>
          </article>
        `;
      })
      .join("");

    this.listEl.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = (btn as HTMLElement).dataset.edit!;
        const entry = node.data.timeline?.find((e) => e.id === id);
        if (entry) this.loadEntryToForm(entry);
      });
    });

    this.listEl.querySelectorAll("[data-delete]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = (btn as HTMLElement).dataset.delete!;
        node.data.timeline = (node.data.timeline ?? []).filter((e) => e.id !== id);
        delete node.data.baseline;
        this.renderList(node);
        galaxyScene.applyTimelineView();
        document.dispatchEvent(new CustomEvent("map:updated"));
      });
    });
  }

  private loadEntryToForm(entry: TimelineEntry) {
    this.editingId = entry.id;
    this.entryYear.value = String(entry.year);
    this.entryType.value = entry.type;
    this.entryActor.value = entry.actorId ?? "";
    this.entryTitle.value = entry.title;
    this.entryDescription.value = entry.description ?? "";
    this.entryPopulation.value = entry.population ?? "";
    this.entryEconomy.value = entry.economy ?? "";
    this.entryMinerals.value = entry.minerals ?? "";
    this.entryFlavor.value = entry.flavor ?? "";
    this.entryTargetSystem.value = entry.targetSystemId ?? "";
    this.entryFleetCount.value = entry.fleetCount ? String(entry.fleetCount) : "";
    this.fleetRowEditor.render(entry.fleets ?? []);
    this.syncFleetFieldVisibility();
  }

  private resetForm() {
    this.editingId = null;
    this.entryYear.value = String(galaxyScene.getViewYear());
    this.entryType.value = "event";
    this.entryActor.value = "";
    this.entryTitle.value = "";
    this.entryDescription.value = "";
    this.entryPopulation.value = "";
    this.entryEconomy.value = "";
    this.entryMinerals.value = "";
    this.entryFlavor.value = "";
    this.entryTargetSystem.value = "";
    this.entryFleetCount.value = "";
    this.fleetRowEditor.clear();
    this.syncFleetFieldVisibility();
  }

  /** Sin filas = no cambia flotas; tipo fleet_change sin filas = quitar todas. */
  private readTimelineFleets(): FleetPresence[] | undefined {
    const fleets = this.fleetRowEditor.read();
    if (fleets.length === 0) {
      return this.entryType.value === "fleet_change" ? [] : undefined;
    }
    return fleets;
  }

  private saveEntry() {
    const node = this.getSelectedNode();
    if (!node) return;

    const title = this.entryTitle.value.trim();
    if (!title) return;

    const type = this.entryType.value as TimelineEntryType;
    const fleets = type === "fleet_change" ? this.readTimelineFleets() : undefined;
    const entry: TimelineEntry = {
      id: this.editingId ?? crypto.randomUUID(),
      year: Number(this.entryYear.value) || galaxyScene.getCalendar().defaultYear || 2200,
      type,
      title,
      description: this.entryDescription.value.trim() || undefined,
      actorId: this.entryActor.value || undefined,
      population: this.entryPopulation.value.trim() || undefined,
      economy: this.entryEconomy.value.trim() || undefined,
      minerals: this.entryMinerals.value.trim() || undefined,
      flavor: this.entryFlavor.value.trim() || undefined,
    };
    if (type === "fleet_move") {
      const target = this.entryTargetSystem.value.trim();
      const count = Math.max(1, Math.round(Number(this.entryFleetCount.value)));
      if (target) {
        entry.targetSystemId = target;
        entry.fleetCount = count;
      }
    }
    if (fleets !== undefined) entry.fleets = fleets;

    const list = this.ensureTimeline(node);
    const idx = list.findIndex((e) => e.id === entry.id);
    if (idx >= 0) list[idx] = entry;
    else list.push(entry);

    delete node.data.baseline;
    syncPresentFieldsFromTimeline(node.data, galaxyScene.getPresentYear());
    this.resetForm();
    this.renderList(node);
    galaxyScene.applyTimelineView();
    document.dispatchEvent(new CustomEvent("map:updated"));
    if (selectionManager.getSelected() === node) {
      document.dispatchEvent(new CustomEvent("node:selected", { detail: node }));
    }
  }

  public refresh() {
    this.loadCalendarFields();
    const node = this.getSelectedNode();
    if (node) this.renderList(node);
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const timelinePanel = new TimelinePanel();
