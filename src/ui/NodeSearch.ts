import { selectionManager } from "../editor/SelectionManager";
import { galaxyScene } from "../scene/GalaxyScene";
import { t } from "../i18n/locale";

export class NodeSearch {
  private input = document.getElementById("map-node-search") as HTMLInputElement | null;
  private resultsEl = document.getElementById("map-node-search-results");

  public init() {
    if (!this.input || !this.resultsEl) return;

    this.input.addEventListener("input", () => this.renderResults());
    this.input.addEventListener("focus", () => this.renderResults());
    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.input!.value = "";
        this.hideResults();
      }
    });

    document.addEventListener("click", (e) => {
      if (!this.input?.closest(".map-search-hud")?.contains(e.target as Node)) {
        this.hideResults();
      }
    });

    document.addEventListener("map:updated", () => {
      if (this.input?.value.trim()) this.renderResults();
    });
  }

  private hideResults() {
    if (this.resultsEl) this.resultsEl.hidden = true;
  }

  private renderResults() {
    if (!this.input || !this.resultsEl) return;

    const q = this.input.value.trim().toLowerCase();
    if (!q) {
      this.hideResults();
      return;
    }

    const matches = galaxyScene
      .getSystems()
      .filter((node) => {
        const name = node.data.name?.toLowerCase() ?? "";
        const id = node.data.id.toLowerCase();
        return name.includes(q) || id.includes(q);
      })
      .slice(0, 12);

    this.resultsEl.innerHTML = "";
    if (matches.length === 0) {
      const empty = document.createElement("p");
      empty.className = "map-search-empty";
      empty.textContent = t("search.noResults");
      this.resultsEl.appendChild(empty);
      this.resultsEl.hidden = false;
      return;
    }

    for (const node of matches) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "map-search-hit";
      const state = galaxyScene.getAdventureState(node.data.id);
      if (galaxyScene.getPlayMode() && state?.visibility === "hidden") {
        btn.classList.add("is-hidden");
      }
      btn.innerHTML = `<span class="map-search-name">${escapeHtml(node.data.name)}</span><code class="map-search-id">${escapeHtml(node.data.id)}</code>`;
      btn.addEventListener("click", () => {
        selectionManager.selectNode(node);
        galaxyScene.focusOnNode(node);
        this.input!.value = "";
        this.hideResults();
      });
      this.resultsEl.appendChild(btn);
    }

    this.resultsEl.hidden = false;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const nodeSearch = new NodeSearch();
