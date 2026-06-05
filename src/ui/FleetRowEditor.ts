import { normalizeFleets, type FleetPresence } from "../data/FleetTypes";
import { ownerManager } from "../galaxy/OwnerManager";

/** Filas owner + cantidad (compartido por System y Timeline). */
export class FleetRowEditor {
  constructor(
    private container: HTMLElement,
    private getDefaultOwnerId: () => string,
  ) {}

  clear() {
    this.container.innerHTML = "";
  }

  render(fleets: FleetPresence[]) {
    this.clear();
    for (const fleet of fleets) {
      this.addRow(fleet);
    }
  }

  read(): FleetPresence[] {
    const rows: FleetPresence[] = [];
    this.container.querySelectorAll(".fleet-row").forEach((rowEl) => {
      const select = rowEl.querySelector<HTMLSelectElement>(".fleet-owner-select");
      const countInput = rowEl.querySelector<HTMLInputElement>(".fleet-count-input");
      if (!select || !countInput) return;
      const owner = select.value.trim();
      const raw = countInput.value.trim();
      if (!owner || raw === "") return;
      const n = Math.max(1, Math.round(Number(raw)));
      if (!Number.isFinite(n)) return;
      rows.push({ owner, count: n });
    });
    return normalizeFleets(rows);
  }

  addRow(entry?: FleetPresence) {
    const row = document.createElement("div");
    row.className = "fleet-row";

    const select = document.createElement("select");
    select.className = "fleet-owner-select";
    ownerManager.getAll().forEach((owner) => {
      const opt = document.createElement("option");
      opt.value = owner.id;
      opt.textContent = `${owner.short} — ${owner.name}`;
      select.appendChild(opt);
    });
    if (entry?.owner) {
      this.setOwnerSelect(select, entry.owner);
    } else {
      this.setOwnerSelect(select, this.getDefaultOwnerId());
    }

    const count = document.createElement("input");
    count.type = "number";
    count.className = "fleet-count-input";
    count.min = "1";
    count.max = "9999";
    count.step = "1";
    count.value = String(entry?.count ?? 1);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "fleet-remove-btn";
    remove.textContent = "×";
    remove.title = "Quitar flota";
    remove.addEventListener("click", () => row.remove());

    row.append(select, count, remove);
    this.container.appendChild(row);
  }

  private setOwnerSelect(select: HTMLSelectElement, ownerId: string) {
    if (!ownerId || !ownerManager.exists(ownerId)) return;
    select.value = ownerId;
    if (select.value !== ownerId) {
      const opt = document.createElement("option");
      opt.value = ownerId;
      opt.textContent = ownerId;
      select.appendChild(opt);
      select.value = ownerId;
    }
  }
}
