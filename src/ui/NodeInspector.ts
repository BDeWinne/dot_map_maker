import {
  FACILITY_DEFS,
  isFacilityId,
  normalizeFacilities,
  type FacilityId,
} from "../data/FacilityTypes";
import {
  formatNumberWithDots,
  formatPopulation,
  parsePopulationToInt,
} from "../data/population";
import { getDisplayStateAtYear } from "../data/timelineState";
import { selectionManager } from "../editor/SelectionManager";
import { NodeSystem, SystemData } from "../galaxy/NodeSystem";
import { ownerManager } from "../galaxy/OwnerManager";
import { galaxyScene } from "../scene/GalaxyScene";
import { FleetRowEditor } from "./FleetRowEditor";
import { sidebar } from "./Sidebar";

export class NodeInspector {
  private nameInput = document.getElementById("node-name") as HTMLInputElement;
  private sizeInput = document.getElementById("node-size") as HTMLInputElement;
  private starTypeInput = document.getElementById("node-star-type") as HTMLInputElement;
  private ownerSelect = document.getElementById("node-owned-by") as HTMLSelectElement;
  private descriptionInput = document.getElementById("node-description") as HTMLTextAreaElement;
  private populationInput = document.getElementById("node-population") as HTMLInputElement;
  private populationPreview = document.getElementById("node-population-preview")!;
  private isCapitalInput = document.getElementById("node-is-capital") as HTMLInputElement;
  private occupiedBySelect = document.getElementById("node-occupied-by") as HTMLSelectElement;
  private systemEmpty = document.getElementById("system-empty")!;
  private systemForm = document.getElementById("system-form")!;
  private facilitiesEl = document.getElementById("node-facilities")!;
  private fleetRowEditor = new FleetRowEditor(
    document.getElementById("node-fleets-editor")!,
    () =>
      selectionManager.getSelected()?.data.owner ??
      (document.getElementById("node-owned-by") as HTMLSelectElement).value,
  );
  private fleetAddBtn = document.getElementById("node-fleet-add") as HTMLButtonElement;
  private saveButton: HTMLButtonElement;
  private deleteButton: HTMLButtonElement;

  constructor() {
    this.buildFacilityCheckboxes();
    this.fleetAddBtn?.addEventListener("click", () => this.fleetRowEditor.addRow());
    this.saveButton = document.getElementById("save-node") as HTMLButtonElement;
    this.deleteButton = document.getElementById("delete-node") as HTMLButtonElement;
    this.saveButton.addEventListener("click", () => this.saveChanges());
    this.deleteButton.addEventListener("click", () => selectionManager.deleteSelectedNode());
    this.populateOwners();

    this.ownerSelect.addEventListener("change", () => this.syncCapitalCheckbox());
    this.populationInput.addEventListener("input", () => this.updatePopulationPreview());

    selectionManager.on("node:selected", () => {
      const node = selectionManager.getSelected();
      if (node) {
        this.load(node.data);
        sidebar.activate("system");
      }
    });

    document.addEventListener("node:deselected", () => this.clear());
    document.addEventListener("viewYear:changed", () => {
      const node = selectionManager.getSelected();
      if (node) this.load(node.data);
    });
  }

  public populateOwners() {
    if (!this.ownerSelect || !this.occupiedBySelect) return;

    this.ownerSelect.innerHTML = "";
    this.occupiedBySelect.innerHTML = "";

    ownerManager.getAll().forEach((owner) => {
      const option1 = document.createElement("option");
      option1.value = owner.id;
      option1.textContent = `${owner.short} - ${owner.name}`;

      const option2 = option1.cloneNode(true) as HTMLOptionElement;

      this.ownerSelect.appendChild(option1);
      this.occupiedBySelect.appendChild(option2);
    });

    const none = document.createElement("option");
    none.value = "";
    none.textContent = "None";
    this.occupiedBySelect.appendChild(none);
  }

  private syncCapitalCheckbox() {
    const node = selectionManager.getSelected();
    if (!node) return;
    if (node.data.owner !== this.ownerSelect.value) {
      this.isCapitalInput.checked = false;
    }
  }

  public load(data: SystemData) {
    this.systemEmpty.hidden = true;
    this.systemForm.hidden = false;
    this.nameInput.value = data.name;
    this.sizeInput.value = data.size?.toString() || "1";
    this.starTypeInput.value = data.starType;
    this.ownerSelect.value = data.owner;
    this.occupiedBySelect.value = data.occupiedBy ?? "";
    this.descriptionInput.value = data.description || "";
    const display = getDisplayStateAtYear(
      data,
      galaxyScene.getViewYear(),
      galaxyScene.getPresentYear()
    );
    this.populationInput.value = formatNumberWithDots(display.population);
    this.updatePopulationPreview();
    this.isCapitalInput.checked = !!data.isCapital;
    this.syncFacilityCheckboxes(normalizeFacilities(data.facilities));
    this.fleetRowEditor.render(display.fleets);
  }

  private buildFacilityCheckboxes() {
    this.facilitiesEl.innerHTML = "";
    for (const def of FACILITY_DEFS) {
      const label = document.createElement("label");
      label.className = "facility-option";
      label.title = def.label;

      const input = document.createElement("input");
      input.type = "checkbox";
      input.value = def.id;
      input.dataset.facilityId = def.id;

      const sym = document.createElement("span");
      sym.className = "facility-symbol";
      sym.textContent = def.symbol;
      sym.setAttribute("aria-hidden", "true");

      const text = document.createElement("span");
      text.className = "facility-name";
      text.textContent = def.checkboxLabel;

      label.append(input, sym, text);
      this.facilitiesEl.appendChild(label);
    }
  }

  private syncFacilityCheckboxes(active: FacilityId[]) {
    const set = new Set(active);
    this.facilitiesEl.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach((el) => {
      if (isFacilityId(el.value)) {
        el.checked = set.has(el.value);
      }
    });
  }

  private readFacilityCheckboxes(): FacilityId[] {
    const ids: FacilityId[] = [];
    this.facilitiesEl.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked').forEach((el) => {
      if (isFacilityId(el.value)) ids.push(el.value);
    });
    return ids;
  }

  private updatePopulationPreview() {
    const n = parsePopulationToInt(this.populationInput.value);
    this.populationPreview.textContent =
      n > 0 ? `≈ ${formatPopulation(n)}` : "";
  }

  public clear() {
    this.systemEmpty.hidden = false;
    this.systemForm.hidden = true;
    this.nameInput.value = "";
    this.starTypeInput.value = "";
    this.ownerSelect.value = "";
    this.descriptionInput.value = "";
    this.sizeInput.value = "1";
    this.populationInput.value = "0";
    this.populationPreview.textContent = "";
    this.isCapitalInput.checked = false;
    this.syncFacilityCheckboxes([]);
    this.fleetRowEditor.clear();
  }

  private saveChanges() {
    const selectedNode: NodeSystem | null = selectionManager.getSelected();
    if (!selectedNode) return;

    if (!galaxyScene.isViewingPresent()) {
      galaxyScene.setViewYear(galaxyScene.getPresentYear());
    }

    selectedNode.data.name = this.nameInput.value;
    selectedNode.data.starType = this.starTypeInput.value;
    selectedNode.data.owner = this.ownerSelect.value;
    selectedNode.data.description = this.descriptionInput.value;
    const owner = this.ownerSelect.value;
    const occupiedBy = this.occupiedBySelect.value;

    selectedNode.setOwner(owner);

    if (!occupiedBy || occupiedBy === owner) {
      selectedNode.setOccupiedBy(null);
    } else {
      selectedNode.setOccupiedBy(occupiedBy);
    }

    const pop = parsePopulationToInt(this.populationInput.value);
    selectedNode.data.population = pop;
    this.populationInput.value = formatNumberWithDots(pop);
    this.updatePopulationPreview();
    selectedNode.data.size = parseFloat(this.sizeInput.value) || 1;
    selectedNode.setCapital(this.isCapitalInput.checked);
    selectedNode.setFacilities(this.readFacilityCheckboxes());
    selectedNode.setFleets(this.fleetRowEditor.read());

    selectedNode.updateNodes();
    selectedNode.setSelected(true);

    document.dispatchEvent(new CustomEvent("map:updated"));
  }
}

export const nodeInspector = new NodeInspector();
