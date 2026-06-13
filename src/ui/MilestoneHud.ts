import {
  ADVENTURE_ENCOUNTER_KINDS,
  normalizeAdventure,
  type AdventureEncounter,
  type AdventureEncounterKind,
  type AdventureReward,
  type NodeAdventure,
} from "../data/AdventureTypes";
import { buildPlayProgressUpdate, stripCompletionFromDesign } from "../data/playProgress";
import { selectionManager } from "../editor/SelectionManager";
import { galaxyScene } from "../scene/GalaxyScene";
import { getLocale, t } from "../i18n/locale";
import { attachAutoGrowTextarea, fitAutoGrowFields } from "./autoGrowTextarea";
import { isPlayMode } from "./playModeUi";

export class MilestoneHud {
  private root = document.getElementById("map-milestone-hud");
  private titleEl = document.getElementById("milestone-hud-title");
  private idEl = document.getElementById("milestone-hud-id");
  private startInput = document.getElementById("milestone-start") as HTMLInputElement | null;
  private hiddenInput = document.getElementById("milestone-hidden") as HTMLInputElement | null;
  private lockedInput = document.getElementById("milestone-locked") as HTMLInputElement | null;
  private completedInput = document.getElementById("milestone-completed") as HTMLInputElement | null;
  private requiresInput = document.getElementById("milestone-requires") as HTMLInputElement | null;
  private encountersEl = document.getElementById("milestone-encounters-list");
  private encountersFeedback = document.getElementById("milestone-encounters-feedback");
  private addEncounterBtn = document.getElementById("milestone-add-encounter");
  private suppressAutoSave = false;
  private autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

  public init() {
    if (!this.root) return;

    this.addEncounterBtn?.addEventListener("click", () => {
      if (isPlayMode()) return;
      this.addEncounter();
      this.save();
    });

    const schedule = () => this.scheduleSave();
    const saveNow = () => this.save();

    this.startInput?.addEventListener("change", saveNow);
    this.hiddenInput?.addEventListener("change", saveNow);
    this.lockedInput?.addEventListener("change", saveNow);
    this.completedInput?.addEventListener("change", saveNow);
    this.requiresInput?.addEventListener("input", schedule);
    this.requiresInput?.addEventListener("change", saveNow);

    selectionManager.on("node:selected", () => this.loadFromSelection());
    document.addEventListener("node:selected", () => this.loadFromSelection());
    document.addEventListener("node:deselected", () => this.hide());
    document.addEventListener("viewYear:changed", () => this.loadFromSelection());
    document.addEventListener("playMode:changed", () => {
      const node = selectionManager.getSelected();
      if (node) this.loadFromSelection();
    });
    document.addEventListener("playProgress:cleared", () => {
      const node = selectionManager.getSelected();
      if (node) this.loadFromSelection();
    });
    document.addEventListener("playProgress:imported", () => {
      const node = selectionManager.getSelected();
      if (node) this.loadFromSelection();
    });
    document.addEventListener("locale:changed", () => {
      const node = selectionManager.getSelected();
      if (node) {
        const adv = isPlayMode()
          ? galaxyScene.getMergedAdventure(node.data.id)
          : node.data.adventure;
        this.renderEncounters(adv);
      }
    });
  }

  private hide() {
    if (this.root) this.root.hidden = true;
  }

  private loadFromSelection() {
    const node = selectionManager.getSelected();
    if (!node || !this.root) {
      this.hide();
      return;
    }

    this.root.hidden = false;
    this.suppressAutoSave = true;
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }

    if (this.titleEl) this.titleEl.textContent = node.data.name;
    if (this.idEl) this.idEl.textContent = node.data.id;

    const design = normalizeAdventure(node.data.adventure) ?? {};
    const displayAdv = isPlayMode()
      ? galaxyScene.getMergedAdventure(node.data.id) ?? design
      : design;

    if (this.startInput) this.startInput.checked = !!design.startNode;
    if (this.hiddenInput) this.hiddenInput.checked = !!design.hidden;
    if (this.lockedInput) this.lockedInput.checked = !!design.locked;
    if (this.completedInput) this.completedInput.checked = !!displayAdv.completed;
    if (this.requiresInput) {
      this.requiresInput.value = design.unlockRequires?.join(", ") ?? "";
    }
    this.renderEncounters(displayAdv);
    this.suppressAutoSave = false;
  }

  private renderEncounters(adv?: NodeAdventure) {
    if (!this.encountersEl) return;
    this.encountersEl.innerHTML = "";
    const encounters = adv?.encounters ?? [];
    if (encounters.length === 0) {
      const empty = document.createElement("p");
      empty.className = "milestone-empty";
      empty.textContent = t("milestone.noEncounters");
      this.encountersEl.appendChild(empty);
      return;
    }
    const play = isPlayMode();
    for (const enc of encounters) {
      this.encountersEl.appendChild(
        play ? this.buildEncounterCardView(enc) : this.buildEncounterCard(enc),
      );
    }
    if (!play) fitAutoGrowFields(this.encountersEl);
    this.updateEncountersFeedback(adv);
  }

  private updateEncountersFeedback(adv?: NodeAdventure) {
    if (!this.encountersFeedback) return;
    if (!isPlayMode()) {
      this.encountersFeedback.hidden = true;
      return;
    }
    const encounters = adv?.encounters ?? [];
    if (encounters.length === 0) {
      this.encountersFeedback.hidden = true;
      return;
    }
    const done = encounters.filter((e) => e.completed).length;
    if (done === encounters.length) {
      this.encountersFeedback.hidden = false;
      this.encountersFeedback.className = "milestone-encounters-feedback is-complete";
      this.encountersFeedback.textContent = t("milestone.allEncountersDone");
      return;
    }
    this.encountersFeedback.hidden = false;
    this.encountersFeedback.className = "milestone-encounters-feedback";
    this.encountersFeedback.textContent = t("milestone.encountersProgress", getLocale(), {
      done: String(done),
      total: String(encounters.length),
    });
  }

  private createAutoGrowField(className: string, value: string, placeholder: string): HTMLTextAreaElement {
    const field = document.createElement("textarea");
    field.className = `${className} milestone-auto-grow`;
    field.rows = 1;
    field.value = value;
    field.placeholder = placeholder;
    attachAutoGrowTextarea(field);
    field.addEventListener("input", () => this.scheduleSave());
    field.addEventListener("change", () => this.save());
    return field;
  }

  private buildEncounterCardView(enc: AdventureEncounter): HTMLElement {
    const details = document.createElement("details");
    details.className = "milestone-encounter-play";
    details.dataset.encounterId = enc.id;
    if (enc.completed) details.classList.add("is-done");
    details.open = !enc.completed;

    const summary = document.createElement("summary");
    summary.className = "milestone-encounter-play-summary";
    const title = document.createElement("span");
    title.className = "milestone-encounter-play-title";
    title.textContent = enc.title;
    summary.appendChild(title);

    const kindLabel =
      enc.kind && ADVENTURE_ENCOUNTER_KINDS.includes(enc.kind)
        ? t(`milestone.kind.${enc.kind}` as "milestone.kind.combat")
        : "";
    if (kindLabel) {
      const kind = document.createElement("span");
      kind.className = "milestone-encounter-kind-badge";
      kind.textContent = kindLabel;
      summary.appendChild(kind);
    }
    details.appendChild(summary);

    const toggle = document.createElement("label");
    toggle.className = "milestone-encounter-play-toggle";
    const doneCheck = document.createElement("input");
    doneCheck.type = "checkbox";
    doneCheck.className = "milestone-encounter-done-input";
    doneCheck.checked = !!enc.completed;
    doneCheck.addEventListener("change", () => this.save());

    const icon = document.createElement("span");
    icon.className = "milestone-complete-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "✓";

    const copy = document.createElement("span");
    copy.className = "milestone-complete-copy";
    const copyTitle = document.createElement("span");
    copyTitle.className = "milestone-complete-title";
    copyTitle.textContent = t("milestone.encounterDone");
    const copyHint = document.createElement("span");
    copyHint.className = "milestone-complete-hint";
    copyHint.textContent = t("milestone.encounterDoneHint");
    copy.append(copyTitle, copyHint);
    toggle.append(doneCheck, icon, copy);
    details.appendChild(toggle);

    const body = document.createElement("div");
    body.className = "milestone-encounter-play-body";

    if (enc.description?.trim()) {
      const desc = document.createElement("div");
      desc.className = "milestone-encounter-desc milestone-encounter-read";
      desc.textContent = enc.description;
      body.appendChild(desc);
    }

    const rewards = enc.rewards ?? [];
    if (rewards.length > 0) {
      const rewardsWrap = document.createElement("div");
      rewardsWrap.className = "milestone-rewards is-view-only";
      const rewardsLabel = document.createElement("span");
      rewardsLabel.className = "milestone-rewards-label";
      rewardsLabel.textContent = t("milestone.rewards");
      rewardsWrap.appendChild(rewardsLabel);

      const rewardsList = document.createElement("div");
      rewardsList.className = "milestone-rewards-list";
      for (const reward of rewards) {
        rewardsList.appendChild(this.buildRewardRowView(reward));
      }
      rewardsWrap.appendChild(rewardsList);
      body.appendChild(rewardsWrap);
    }

    details.appendChild(body);
    return details;
  }

  private buildRewardRowView(reward: AdventureReward): HTMLElement {
    const row = document.createElement("div");
    row.className = "milestone-reward-row is-view-only";
    row.dataset.rewardId = reward.id;

    const label = document.createElement("div");
    label.className = "milestone-reward-label milestone-encounter-read";
    label.textContent = reward.label;
    row.appendChild(label);
    return row;
  }

  private buildEncounterCard(enc: AdventureEncounter): HTMLElement {
    const card = document.createElement("div");
    card.className = "milestone-encounter";
    card.dataset.encounterId = enc.id;

    const head = document.createElement("div");
    head.className = "milestone-encounter-head";

    const title = this.createAutoGrowField(
      "milestone-encounter-title",
      enc.title,
      t("milestone.encounterTitlePh"),
    );

    const kind = document.createElement("select");
    kind.className = "milestone-encounter-kind";
    const blank = document.createElement("option");
    blank.value = "";
    blank.textContent = t("milestone.kindAny");
    kind.appendChild(blank);
    for (const k of ADVENTURE_ENCOUNTER_KINDS) {
      const opt = document.createElement("option");
      opt.value = k;
      opt.textContent = t(`milestone.kind.${k}` as "milestone.kind.combat");
      kind.appendChild(opt);
    }
    kind.value = enc.kind ?? "";
    kind.addEventListener("change", () => this.save());

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "milestone-encounter-remove";
    removeBtn.textContent = "×";
    removeBtn.title = t("milestone.removeEncounter");
    removeBtn.addEventListener("click", () => {
      card.remove();
      this.save();
    });

    head.append(title, kind, removeBtn);

    const desc = this.createAutoGrowField(
      "milestone-encounter-desc",
      enc.description ?? "",
      t("milestone.encounterDescPh"),
    );

    const gmNotes = this.createAutoGrowField(
      "milestone-encounter-gm",
      enc.gmNotes ?? "",
      t("milestone.gmNotesPh"),
    );

    const rewardsWrap = document.createElement("div");
    rewardsWrap.className = "milestone-rewards";
    const rewardsLabel = document.createElement("span");
    rewardsLabel.className = "milestone-rewards-label";
    rewardsLabel.textContent = t("milestone.rewards");
    rewardsWrap.appendChild(rewardsLabel);

    const rewardsList = document.createElement("div");
    rewardsList.className = "milestone-rewards-list";
    for (const reward of enc.rewards ?? []) {
      rewardsList.appendChild(this.buildRewardRow(reward));
    }
    rewardsWrap.appendChild(rewardsList);

    const addRewardBtn = document.createElement("button");
    addRewardBtn.type = "button";
    addRewardBtn.className = "btn-muted milestone-add-reward";
    addRewardBtn.textContent = t("milestone.addReward");
    addRewardBtn.addEventListener("click", () => {
      const row = this.buildRewardRow({ id: crypto.randomUUID(), label: "" });
      rewardsList.appendChild(row);
      fitAutoGrowFields(row);
      this.save();
    });
    rewardsWrap.appendChild(addRewardBtn);

    card.append(head, desc, gmNotes, rewardsWrap);
    return card;
  }

  private buildRewardRow(reward: AdventureReward): HTMLElement {
    const row = document.createElement("div");
    row.className = "milestone-reward-row";
    row.dataset.rewardId = reward.id;

    const fields = document.createElement("div");
    fields.className = "milestone-reward-fields";

    const label = this.createAutoGrowField(
      "milestone-reward-label",
      reward.label,
      t("milestone.rewardLabelPh"),
    );

    const notes = this.createAutoGrowField(
      "milestone-reward-notes",
      reward.notes ?? "",
      t("milestone.rewardNotesPh"),
    );

    fields.append(label, notes);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "milestone-reward-remove";
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      row.remove();
      this.save();
    });

    row.append(fields, remove);
    return row;
  }

  private addEncounter() {
    if (!this.encountersEl || isPlayMode()) return;
    const empty = this.encountersEl.querySelector(".milestone-empty");
    empty?.remove();
    const enc: AdventureEncounter = {
      id: crypto.randomUUID(),
      title: t("milestone.newEncounter"),
      kind: "other",
    };
    this.encountersEl.appendChild(this.buildEncounterCard(enc));
    fitAutoGrowFields(this.encountersEl);
  }

  private readEncountersFromDom(): AdventureEncounter[] {
    if (!this.encountersEl) return [];
    const out: AdventureEncounter[] = [];
    this.encountersEl.querySelectorAll<HTMLElement>(".milestone-encounter").forEach((card) => {
      const title = card.querySelector<HTMLTextAreaElement>(".milestone-encounter-title")?.value.trim();
      if (!title) return;
      const kindRaw = card.querySelector<HTMLSelectElement>(".milestone-encounter-kind")?.value;
      const kind = kindRaw as AdventureEncounterKind | "";
      const description =
        card.querySelector<HTMLTextAreaElement>(".milestone-encounter-desc")?.value.trim() || undefined;
      const gmNotes =
        card.querySelector<HTMLTextAreaElement>(".milestone-encounter-gm")?.value.trim() || undefined;

      const rewards: AdventureReward[] = [];
      card.querySelectorAll<HTMLElement>(".milestone-reward-row").forEach((row) => {
        const label = row.querySelector<HTMLTextAreaElement>(".milestone-reward-label")?.value.trim();
        if (!label) return;
        const notes =
          row.querySelector<HTMLTextAreaElement>(".milestone-reward-notes")?.value.trim() || undefined;
        rewards.push({
          id: row.dataset.rewardId ?? crypto.randomUUID(),
          label,
          notes,
        });
      });

      const enc: AdventureEncounter = {
        id: card.dataset.encounterId ?? crypto.randomUUID(),
        title,
      };
      if (kind) enc.kind = kind;
      if (description) enc.description = description;
      if (gmNotes) enc.gmNotes = gmNotes;
      if (rewards.length > 0) enc.rewards = rewards;
      out.push(enc);
    });
    return out;
  }

  private readPlayProgressSave(design?: NodeAdventure) {
    const milestoneCompleted = !!this.completedInput?.checked;
    const encounterCompleted = new Map<string, boolean>();

    for (const enc of design?.encounters ?? []) {
      const card = this.encountersEl?.querySelector<HTMLElement>(
        `[data-encounter-id="${enc.id}"]`,
      );
      encounterCompleted.set(
        enc.id,
        !!card?.querySelector<HTMLInputElement>(".milestone-encounter-done-input")?.checked,
      );
    }

    return buildPlayProgressUpdate(design, milestoneCompleted, encounterCompleted);
  }

  private readAdventureDesign(): NodeAdventure | undefined {
    const adv = normalizeAdventure({
      startNode: this.startInput?.checked,
      hidden: this.hiddenInput?.checked,
      locked: this.lockedInput?.checked,
      unlockRequires: this.requiresInput?.value
        .split(/[,;\s]+/)
        .map((s) => s.trim())
        .filter(Boolean),
      encounters: this.readEncountersFromDom(),
    });
    return stripCompletionFromDesign(adv);
  }

  private scheduleSave() {
    if (this.suppressAutoSave) return;
    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
    const delay = isPlayMode() ? 0 : 400;
    if (delay === 0) {
      this.save();
      return;
    }
    this.autoSaveTimer = setTimeout(() => {
      this.autoSaveTimer = null;
      this.save();
    }, delay);
  }

  private save() {
    if (this.suppressAutoSave) return;
    const node = selectionManager.getSelected();
    if (!node) return;

    if (isPlayMode()) {
      const design = normalizeAdventure(node.data.adventure);
      const progress = this.readPlayProgressSave(design);
      galaxyScene.setNodePlayProgress(node.data.id, progress);
      const merged = galaxyScene.getMergedAdventure(node.data.id);
      if (this.completedInput) this.completedInput.checked = !!merged?.completed;
      this.renderEncounters(merged);
      this.updateEncountersFeedback(merged);
      return;
    }

    node.data.adventure = this.readAdventureDesign();
    node.updateNodes();
    galaxyScene.applyTimelineView();
    document.dispatchEvent(new CustomEvent("map:updated"));
    document.dispatchEvent(new CustomEvent("node:saved"));
  }
}

export const milestoneHud = new MilestoneHud();
