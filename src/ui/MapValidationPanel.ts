import { validateMap, type ValidationIssue } from "../data/mapValidation";
import { galaxyScene } from "../scene/GalaxyScene";
import { selectionManager } from "../editor/SelectionManager";
import { getLocale, t } from "../i18n/locale";

export class MapValidationPanel {
  private listEl = document.getElementById("map-validation-list");
  private summaryEl = document.getElementById("map-validation-summary");

  public init() {
    document.getElementById("map-validate-btn")?.addEventListener("click", () => {
      this.refresh();
    });

    document.getElementById("reset-play-progress")?.addEventListener("click", () => {
      const ok = window.confirm(t("play.resetConfirm"));
      if (!ok) return;
      galaxyScene.clearPlayProgress();
      const node = selectionManager.getSelected();
      if (node) {
        document.dispatchEvent(new CustomEvent("node:selected"));
      }
    });

    document.addEventListener("map:updated", () => this.refresh());
    document.addEventListener("map:loaded", () => this.refresh());
    document.addEventListener("locale:changed", () => this.refresh());
    this.refresh();
  }

  private refresh() {
    if (!this.listEl) return;

    const issues = validateMap({
      systems: galaxyScene.getSystems().map((n) => n.data),
      connections: galaxyScene.getConnections(),
    });

    this.listEl.innerHTML = "";

    if (this.summaryEl) {
      const errors = issues.filter((i) => i.severity === "error").length;
      const warnings = issues.filter((i) => i.severity === "warning").length;
      if (issues.length === 0) {
        this.summaryEl.textContent = t("validation.ok");
        this.summaryEl.className = "map-validation-summary is-ok";
      } else {
        this.summaryEl.textContent = t("validation.summary", getLocale(), {
          errors: String(errors),
          warnings: String(warnings),
        });
        this.summaryEl.className = `map-validation-summary${errors > 0 ? " has-errors" : ""}`;
      }
    }

    if (issues.length === 0) {
      const li = document.createElement("li");
      li.className = "map-validation-item is-ok";
      li.textContent = t("validation.ok");
      this.listEl.appendChild(li);
      return;
    }

    for (const issue of issues) {
      this.listEl.appendChild(this.buildItem(issue));
    }
  }

  private buildItem(issue: ValidationIssue): HTMLElement {
    const li = document.createElement("li");
    li.className = `map-validation-item is-${issue.severity}`;

    const label = document.createElement("span");
    label.textContent = this.formatMessage(issue);
    li.appendChild(label);

    if (issue.nodeId) {
      const jump = document.createElement("button");
      jump.type = "button";
      jump.className = "map-validation-jump";
      jump.textContent = t("validation.jump");
      jump.addEventListener("click", () => {
        const node = galaxyScene.getSystems().find((n) => n.data.id === issue.nodeId);
        if (node) {
          selectionManager.selectNode(node);
          galaxyScene.focusOnNode(node);
        }
      });
      li.appendChild(jump);
    }

    return li;
  }

  private formatMessage(issue: ValidationIssue): string {
    const locale = getLocale();
    const detail = issue.detail ?? "";
    const nodeId = issue.nodeId ?? "";
    const connId = issue.connectionId ?? "";
    const ownerId = issue.ownerId ?? "";

    switch (issue.messageKey) {
      case "validation.duplicateId":
        return t("validation.duplicateId", locale, { id: nodeId, count: detail });
      case "validation.emptyName":
        return t("validation.emptyName", locale, { id: nodeId });
      case "validation.missingFrom":
        return t("validation.missingFrom", locale, { conn: connId, id: nodeId });
      case "validation.missingTo":
        return t("validation.missingTo", locale, { conn: connId, id: nodeId });
      case "validation.duplicateConn":
        return t("validation.duplicateConn", locale, { id: connId, count: detail });
      case "validation.badUnlockRef":
        return t("validation.badUnlockRef", locale, { node: nodeId, ref: detail });
      case "validation.multiCapital":
        return t("validation.multiCapital", locale, { owner: ownerId, ids: detail });
      case "validation.orphanNode":
        return t("validation.orphanNode", locale, { id: nodeId });
      default:
        return issue.messageKey;
    }
  }
}

export const mapValidationPanel = new MapValidationPanel();
