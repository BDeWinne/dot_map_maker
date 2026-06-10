import { galaxyScene } from "../scene/GalaxyScene";
import {
  ownerManager,
  normalizeLeader,
  getLeaderAgeAtYear,
  type OwnerJSON,
  type OwnerLeader,
} from "../galaxy/OwnerManager";
import { nodeInspector } from "./NodeInspector";
import { timelinePanel } from "./TimelinePanel";
import { statsPanel } from "./StatsPanel";
import { t } from "../i18n/locale";

export class OwnerEditor {
  private listEl = document.getElementById("owner-list")!;
  private formWrap = document.getElementById("owner-form-wrap")!;
  private statusEl = document.getElementById("owner-editor-status")!;
  private idInput = document.getElementById("owner-id") as HTMLInputElement;
  private nameInput = document.getElementById("owner-name") as HTMLInputElement;
  private shortInput = document.getElementById("owner-short") as HTMLInputElement;
  private colorInput = document.getElementById("owner-color") as HTMLInputElement;
  private colorHexInput = document.getElementById("owner-color-hex") as HTMLInputElement;
  private leaderNameInput = document.getElementById("owner-leader-name") as HTMLInputElement;
  private leaderAgeInput = document.getElementById("owner-leader-age") as HTMLInputElement;
  private leaderPersonalityInput = document.getElementById(
    "owner-leader-personality",
  ) as HTMLTextAreaElement;
  private usageHint = document.getElementById("owner-usage-hint")!;

  private editingId: string | null = null;
  private originalId: string | null = null;

  constructor() {
    document.getElementById("owner-add-btn")?.addEventListener("click", () => this.startNew());
    document.getElementById("owner-save-btn")?.addEventListener("click", () => this.save());
    document.getElementById("owner-delete-btn")?.addEventListener("click", () => this.remove());
    document.getElementById("owner-export-btn")?.addEventListener("click", () => this.exportOwners());
    document.getElementById("owner-import-btn")?.addEventListener("click", () => {
      document.getElementById("owner-import-file")?.click();
    });
    document.getElementById("owner-reset-btn")?.addEventListener("click", () => this.resetDefaults());

    const importFile = document.getElementById("owner-import-file") as HTMLInputElement;
    importFile?.addEventListener("change", () => this.importOwners(importFile));

    this.colorInput.addEventListener("input", () => {
      this.colorHexInput.value = this.colorInput.value;
    });
    this.colorHexInput.addEventListener("change", () => {
      const parsed = ownerManager.parseColor(this.colorHexInput.value);
      if (parsed !== null) {
        this.colorInput.value = ownerManager.numberToHex(parsed);
      }
    });

    document.addEventListener("owners:changed", () => this.renderList());
    document.addEventListener("locale:changed", () => this.renderList());
    document.addEventListener("map:loaded", () => this.renderList());
    document.addEventListener("map:updated", () => {
      if (this.editingId) this.updateUsageHint(this.editingId);
    });
    document.addEventListener("viewYear:changed", () => {
      this.renderList();
      if (this.editingId && ownerManager.exists(this.editingId)) {
        this.loadLeaderFields(ownerManager.get(this.editingId).leader);
      }
    });

    this.renderList();
    this.startNew();
  }

  public refresh() {
    this.renderList();
    if (this.editingId && ownerManager.exists(this.editingId)) {
      this.selectOwner(this.editingId);
    }
  }

  private setStatus(message: string, isError = false) {
    this.statusEl.textContent = message;
    this.statusEl.style.color = isError ? "#f88" : "#8c8";
  }

  private renderList() {
    this.listEl.innerHTML = "";
    const owners = ownerManager.getAll();

    if (owners.length === 0) {
      this.listEl.innerHTML = `<p class="panel-empty">${t("owners.empty")}</p>`;
      return;
    }

    for (const owner of owners) {
      const usage = galaxyScene.countOwnerUsage(owner.id);
      const card = document.createElement("article");
      card.className = "owner-list-item";
      card.style.setProperty("--owner-color", ownerManager.numberToHex(owner.color));
      if (owner.id === this.editingId) card.classList.add("is-selected");

      const isDefault = owner.id === ownerManager.defaultOwnerId;
      const leaderAge = getLeaderAgeAtYear(
        owner.leader,
        galaxyScene.getViewYear(),
        galaxyScene.getCalendar().defaultYear,
      );
      const leaderLine = owner.leader
        ? `<span class="owner-list-leader">👤 ${escapeHtml(owner.leader.name)}${leaderAge !== undefined ? `, ${leaderAge}` : ""}</span>`
        : "";

      card.innerHTML = `
        <button type="button" class="owner-list-main" data-owner-id="${owner.id}">
          <span class="owner-swatch"></span>
          <span class="owner-list-text">
            <strong>${escapeHtml(owner.short)}</strong>
            <span>${escapeHtml(owner.name)}</span>
            ${leaderLine}
          </span>
          <code class="owner-list-id">${escapeHtml(owner.id)}</code>
        </button>
        <span class="owner-list-meta">${usage} system${usage === 1 ? "" : "s"}</span>
      `;

      card.querySelector(".owner-list-main")?.addEventListener("click", () => {
        this.selectOwner(owner.id);
      });

      this.listEl.appendChild(card);

      if (isDefault) {
        card.querySelector(".owner-list-meta")!.textContent = "default";
      }
    }
  }

  private startNew() {
    this.editingId = null;
    this.originalId = null;
    this.idInput.disabled = false;
    this.idInput.value = `empire_${Date.now().toString(36).slice(-4)}`;
    this.nameInput.value = "New faction";
    this.shortInput.value = "NEW";
    this.colorInput.value = "#5a9fd4";
    this.colorHexInput.value = "#5a9fd4";
    this.clearLeaderFields();
    this.formWrap.hidden = false;
    document.getElementById("owner-delete-btn")!.setAttribute("disabled", "true");
    this.updateUsageHint(null);
    this.setStatus("New owner — set id, name, short, color, then Save.");
    this.renderList();
  }

  private selectOwner(id: string) {
    const owner = ownerManager.get(id);
    this.editingId = id;
    this.originalId = id;
    this.idInput.disabled = id === ownerManager.defaultOwnerId;
    this.idInput.value = owner.id;
    this.nameInput.value = owner.name;
    this.shortInput.value = owner.short;
    this.colorInput.value = ownerManager.numberToHex(owner.color);
    this.colorHexInput.value = this.colorInput.value;
    this.loadLeaderFields(owner.leader);
    this.formWrap.hidden = false;

    const deleteBtn = document.getElementById("owner-delete-btn") as HTMLButtonElement;
    deleteBtn.disabled = id === ownerManager.defaultOwnerId;

    this.updateUsageHint(id);
    this.setStatus(`Editing ${owner.short}.`);
    this.renderList();
  }

  private updateUsageHint(id: string | null) {
    if (!id) {
      this.usageHint.textContent = "";
      return;
    }
    const usage = galaxyScene.countOwnerUsage(id);
    this.usageHint.textContent =
      usage > 0
        ? `Used on ${usage} system(s) (owner, occupier, or timeline actor).`
        : "Not used on any system yet.";
  }

  private save() {
    const id = this.idInput.value.trim();
    const name = this.nameInput.value.trim();
    const short = this.shortInput.value.trim();
    const color = ownerManager.parseColor(this.colorHexInput.value || this.colorInput.value);

    if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
      this.setStatus("Id: letters, numbers, underscore, hyphen only.", true);
      return;
    }
    if (!name) {
      this.setStatus("Name is required.", true);
      return;
    }
    if (!short) {
      this.setStatus("Short tag is required.", true);
      return;
    }
    if (color === null) {
      this.setStatus("Invalid color (use #RRGGBB).", true);
      return;
    }

    const isNew = !this.originalId;
    const idChanged = this.originalId && this.originalId !== id;

    if (isNew && ownerManager.exists(id)) {
      this.setStatus("That id already exists.", true);
      return;
    }

    if (idChanged) {
      if (ownerManager.exists(id)) {
        this.setStatus("Target id already exists.", true);
        return;
      }
      if (!ownerManager.renameId(this.originalId!, id)) {
        this.setStatus("Could not rename id.", true);
        return;
      }
      galaxyScene.remapOwnerReferences(this.originalId!, id);
    }

    ownerManager.upsert({
      id,
      name,
      short,
      color,
      leader: this.readLeaderFields(),
    });

    this.editingId = id;
    this.originalId = id;
    this.idInput.disabled = id === ownerManager.defaultOwnerId;
    document.getElementById("owner-delete-btn")!.toggleAttribute(
      "disabled",
      id === ownerManager.defaultOwnerId
    );

    galaxyScene.refreshAllOwnerVisuals();
    this.afterOwnersChanged();
    this.updateUsageHint(id);
    this.setStatus(`Saved ${short}.`);
    this.renderList();
  }

  private clearLeaderFields() {
    this.leaderNameInput.value = "";
    this.leaderAgeInput.value = "";
    this.leaderPersonalityInput.value = "";
  }

  private loadLeaderFields(leader?: OwnerLeader) {
    const viewYear = galaxyScene.getViewYear();
    const age = getLeaderAgeAtYear(
      leader,
      viewYear,
      galaxyScene.getCalendar().defaultYear,
    );
    this.leaderNameInput.value = leader?.name ?? "";
    this.leaderAgeInput.value = age !== undefined ? String(age) : "";
    this.leaderPersonalityInput.value = leader?.personality ?? "";
    this.leaderAgeInput.placeholder = `Age at Y${viewYear}`;
  }

  private readLeaderFields() {
    return normalizeLeader({
      name: this.leaderNameInput.value,
      age: this.leaderAgeInput.value,
      ageYear: galaxyScene.getViewYear(),
      personality: this.leaderPersonalityInput.value,
    });
  }

  private remove() {
    if (!this.editingId || this.editingId === ownerManager.defaultOwnerId) return;

    const id = this.editingId;
    const usage = galaxyScene.countOwnerUsage(id);
    const owner = ownerManager.get(id);

    if (
      usage > 0 &&
      !confirm(
        `Delete "${owner.short}"? ${usage} reference(s) will become Unclaimed (none).`
      )
    ) {
      return;
    }

    if (usage > 0) {
      galaxyScene.remapOwnerReferences(id, ownerManager.defaultOwnerId);
    }

    ownerManager.remove(id);
    galaxyScene.refreshAllOwnerVisuals();
    this.afterOwnersChanged();
    this.setStatus(`Removed ${owner.short}.`);
    this.startNew();
  }

  private exportOwners() {
    const json = JSON.stringify(ownerManager.exportData(), null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "owners.json";
    a.click();
    URL.revokeObjectURL(url);
    this.setStatus("Owners exported.");
  }

  private importOwners(fileInput: HTMLInputElement) {
    const file = fileInput.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as { owners?: unknown };
        if (!ownerManager.loadFromJSON(data as { owners: OwnerJSON[] })) {
          this.setStatus("Invalid owners file.", true);
          return;
        }
        galaxyScene.refreshAllOwnerVisuals();
        this.afterOwnersChanged();
        this.setStatus(`Imported ${ownerManager.getAll().length} owners.`);
        this.startNew();
      } catch {
        this.setStatus("Invalid JSON.", true);
      } finally {
        fileInput.value = "";
      }
    };
    reader.readAsText(file);
  }

  private resetDefaults() {
    if (!confirm("Reset owners to built-in defaults? Map systems keep their owner ids.")) return;
    ownerManager.resetToBundledDefaults();
    galaxyScene.refreshAllOwnerVisuals();
    this.afterOwnersChanged();
    this.setStatus("Owners reset to defaults.");
    this.startNew();
  }

  private afterOwnersChanged() {
    nodeInspector.populateOwners();
    timelinePanel.populateActors();
    statsPanel.refresh();
    document.dispatchEvent(new CustomEvent("map:updated"));
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const ownerEditor = new OwnerEditor();
