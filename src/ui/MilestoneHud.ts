import {
  ADVENTURE_ENCOUNTER_KINDS,
  normalizeAdventure,
  syncMilestoneCompletedFromEncounters,
  type AdventureEncounter,
  type AdventureEncounterKind,
  type AdventureReward,
  type NodeAdventure,
} from "../data/AdventureTypes";
import { selectionManager } from "../editor/SelectionManager";
import { galaxyScene } from "../scene/GalaxyScene";
import { t } from "../i18n/locale";
import { attachAutoGrowTextarea, fitAutoGrowFields } from "./autoGrowTextarea";
import { isPlayMode } from "./playModeUi";

export class MilestoneHud {
  private root = document.getElementById("map-milestone-hud");
  private titleEl = document.getElementById("milestone-hud-title");
  private idEl = document.getElementById("milestone-hud-id");
  private startInput = document.getElementById("milestone-start") as HTMLInputElement | null;
  private lockedInput = document.getElementById("milestone-locked") as HTMLInputElement | null;
  private completedInput = document.getElementById("milestone-completed") as HTMLInputElement | null;
  private requiresInput = document.getElementById("milestone-requires") as HTMLInputElement | null;
  private encountersEl = document.getElementById("milestone-encounters-list");
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
    document.addEventListener("locale:changed", () => {
      const node = selectionManager.getSelected();
      if (node) this.renderEncounters(node.data.adventure);
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

    const adv = normalizeAdventure(node.data.adventure) ?? {};
    if (this.startInput) this.startInput.checked = !!adv.startNode;
    if (this.lockedInput) this.lockedInput.checked = !!adv.locked;
    if (this.completedInput) this.completedInput.checked = !!adv.completed;
    if (this.requiresInput) {
      this.requiresInput.value = adv.unlockRequires?.join(", ") ?? "";
    }
    this.renderEncounters(adv);
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
    const card = document.createElement("div");
    card.className = "milestone-encounter is-view-only";
    card.dataset.encounterId = enc.id;
    if (enc.completed) card.classList.add("is-done");

    const head = document.createElement("div");
    head.className = "milestone-encounter-head";

    const title = document.createElement("div");
    title.className = "milestone-encounter-title milestone-encounter-read";
    title.textContent = enc.title;

    const kindLabel =
      enc.kind && ADVENTURE_ENCOUNTER_KINDS.includes(enc.kind)
        ? t(`milestone.kind.${enc.kind}` as "milestone.kind.combat")
        : "";
    if (kindLabel) {
      const kind = document.createElement("span");
      kind.className = "milestone-encounter-kind-badge";
      kind.textContent = kindLabel;
      head.appendChild(kind);
    }

    const doneLabel = document.createElement("label");
    doneLabel.className = "milestone-encounter-done checkbox-row";
    const doneCheck = document.createElement("input");
    doneCheck.type = "checkbox";
    doneCheck.checked = !!enc.completed;
    doneCheck.addEventListener("change", () => this.save());
    doneLabel.append(doneCheck, document.createTextNode(t("milestone.encounterDone")));
    head.prepend(title);
    head.append(doneLabel);

    card.appendChild(head);

    if (enc.description?.trim()) {
      const desc = document.createElement("div");
      desc.className = "milestone-encounter-desc milestone-encounter-read";
      desc.textContent = enc.description;
      card.appendChild(desc);
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
      card.appendChild(rewardsWrap);
    }

    return card;
  }

  private buildRewardRowView(reward: AdventureReward): HTMLElement {
    const row = document.createElement("div");
    row.className = "milestone-reward-row is-view-only";
    row.dataset.rewardId = reward.id;

    const label = document.createElement("div");
    label.className = "milestone-reward-label milestone-encounter-read";
    label.textContent = reward.label;

    row.appendChild(label);
    if (reward.notes?.trim()) {
      const notes = document.createElement("div");
      notes.className = "milestone-reward-notes milestone-encounter-read";
      notes.textContent = reward.notes;
      row.appendChild(notes);
    }
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

    const doneLabel = document.createElement("label");
    doneLabel.className = "milestone-encounter-done checkbox-row";
    const doneCheck = document.createElement("input");
    doneCheck.type = "checkbox";
    doneCheck.checked = !!enc.completed;
    doneCheck.addEventListener("change", () => this.save());
    doneLabel.append(doneCheck, document.createTextNode(t("milestone.encounterDone")));

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "milestone-encounter-remove";
    removeBtn.textContent = "×";
    removeBtn.title = t("milestone.removeEncounter");
    removeBtn.addEventListener("click", () => {
      card.remove();
      this.save();
    });

    head.append(title, kind, doneLabel, removeBtn);

    const desc = this.createAutoGrowField(
      "milestone-encounter-desc",
      enc.description ?? "",
      t("milestone.encounterDescPh"),
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

    card.append(head, desc, rewardsWrap);
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
      const completed = !!card.querySelector<HTMLInputElement>(
        ".milestone-encounter-done input",
      )?.checked;

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
      if (completed) enc.completed = true;
      if (rewards.length > 0) enc.rewards = rewards;
      out.push(enc);
    });
    return out;
  }

  private readPlayProgress(existing?: NodeAdventure): NodeAdventure | undefined {
    const base = existing ? { ...existing } : {};
    const encounters = (base.encounters ?? []).map((enc) => {
      const card = this.encountersEl?.querySelector<HTMLElement>(
        `.milestone-encounter[data-encounter-id="${enc.id}"]`,
      );
      const completed = !!card?.querySelector<HTMLInputElement>(
        ".milestone-encounter-done input",
      )?.checked;
      return { ...enc, completed };
    });

    let adv: NodeAdventure = {
      ...base,
      completed: this.completedInput?.checked,
      encounters: encounters.length > 0 ? encounters : base.encounters,
    };
    adv = syncMilestoneCompletedFromEncounters(adv) ?? adv;
    return adv;
  }

  private readAdventure(): NodeAdventure | undefined {
    const node = selectionManager.getSelected();
    const existing = normalizeAdventure(node?.data.adventure);

    if (isPlayMode()) {
      return this.readPlayProgress(existing);
    }

    let adv = normalizeAdventure({
      startNode: this.startInput?.checked,
      locked: this.lockedInput?.checked,
      completed: this.completedInput?.checked,
      unlockRequires: this.requiresInput?.value
        .split(/[,;\s]+/)
        .map((s) => s.trim())
        .filter(Boolean),
      encounters: this.readEncountersFromDom(),
    });
    if (adv) adv = syncMilestoneCompletedFromEncounters(adv);
    return adv;
  }

  private scheduleSave() {
    if (this.suppressAutoSave || isPlayMode()) return;
    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
    this.autoSaveTimer = setTimeout(() => {
      this.autoSaveTimer = null;
      this.save();
    }, 400);
  }

  private save() {
    if (this.suppressAutoSave) return;
    const node = selectionManager.getSelected();
    if (!node) return;

    node.data.adventure = this.readAdventure();
    if (this.completedInput) {
      this.completedInput.checked = !!node.data.adventure?.completed;
    }
    node.updateNodes();
    galaxyScene.applyTimelineView();
    document.dispatchEvent(new CustomEvent("map:updated"));
    document.dispatchEvent(new CustomEvent("node:saved"));
  }
}

export const milestoneHud = new MilestoneHud();
