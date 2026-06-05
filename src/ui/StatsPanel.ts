import { formatPopulation, parsePopulationToInt } from "../data/population";
import { galaxyScene } from "../scene/GalaxyScene";
import { ownerManager, getLeaderAgeAtYear } from "../galaxy/OwnerManager";
import type { NodeSystem } from "../galaxy/NodeSystem";

const MAJOR_SYSTEM_SIZE = 1.15;

interface OwnerStats {
  ownerId: string;
  name: string;
  short: string;
  color: string;
  ownedSystems: number;
  capitalName: string | null;
  majorSystems: number;
  underOccupation: number;
  militaryPresence: number;
  populationSum: number;
  populationDisplay: string;
  timelineEvents: number;
  occupyingNames: string[];
}

function ensureOwnerRow(map: Map<string, OwnerStats>, ownerId: string): OwnerStats {
  if (!map.has(ownerId)) {
    const o = ownerManager.get(ownerId);
    map.set(ownerId, {
      ownerId,
      name: o.name,
      short: o.short,
      color: `#${(o.color >>> 0).toString(16).padStart(6, "0")}`,
      ownedSystems: 0,
      capitalName: null,
      majorSystems: 0,
      underOccupation: 0,
      militaryPresence: 0,
      populationSum: 0,
      populationDisplay: "0",
      timelineEvents: 0,
      occupyingNames: [],
    });
  }
  return map.get(ownerId)!;
}

export class StatsPanel {
  private container = document.getElementById("stats-by-owner")!;

  constructor() {
    this.refresh();
  }

  public refresh() {
    const systems = galaxyScene.getSystems();
    const byOwner = new Map<string, OwnerStats>();

    for (const node of systems) {
      if (!node.visible) continue;

      const ownerId = node.getDisplayOwner();
      if (!ownerId || ownerId === "None" || ownerId === "none") continue;

      const row = ensureOwnerRow(byOwner, ownerId);
      row.ownedSystems += 1;
      row.populationSum += node.getDisplayPopulation();
      row.timelineEvents += node.data.timeline?.length ?? 0;

      if ((node.data.size ?? 1) >= MAJOR_SYSTEM_SIZE) {
        row.majorSystems += 1;
      }

      if (node.getDisplayIsCapital()) {
        row.capitalName = node.data.name;
      }

      if (node.isOccupied()) {
        row.underOccupation += 1;
        const occupierId = node.getDisplayOccupiedBy()!;
        const occupierRow = ensureOwnerRow(byOwner, occupierId);
        occupierRow.militaryPresence += 1;
        occupierRow.occupyingNames.push(`${node.data.name} (${ownerManager.get(ownerId).short})`);
      }
    }

    const rows = [...byOwner.values()]
      .filter((r) => r.ownedSystems > 0 || r.militaryPresence > 0)
      .sort((a, b) => b.ownedSystems - a.ownedSystems);

    if (rows.length === 0) {
      this.container.innerHTML = `<p class="panel-empty">No owned systems yet.</p>`;
      return;
    }

    const ownedTotal = systems.filter(
      (n) => n.data.owner && n.data.owner !== "None" && n.data.owner !== "none"
    ).length;

    let html = `<p class="stats-summary">${ownedTotal} systems · ${galaxyScene.getConnections().length} hyperlanes</p>`;
    html += `<p class="mode-hint">Legal owner ≠ military control. Size ≈ economy / population weight.</p>`;

    for (const row of rows) {
      row.populationDisplay = formatPopulation(row.populationSum);
      const capital = row.capitalName ?? "—";
      const occupying =
        row.occupyingNames.length > 0
          ? row.occupyingNames.slice(0, 4).join(", ") +
            (row.occupyingNames.length > 4 ? "…" : "")
          : "—";

      const owner = ownerManager.get(row.ownerId);
      const leader = owner.leader;
      const leaderAge = getLeaderAgeAtYear(
        leader,
        galaxyScene.getViewYear(),
        galaxyScene.getCalendar().defaultYear,
      );
      const leaderHtml = leader
        ? `<div class="stat-wide"><dt>Leader</dt><dd>${escapeHtml(leader.name)}${leaderAge !== undefined ? ` (${leaderAge})` : ""}${leader.personality ? ` — ${escapeHtml(leader.personality)}` : ""}</dd></div>`
        : "";

      html += `
        <article class="owner-stat-card" style="--owner-color: ${row.color}">
          <header class="owner-stat-header">
            <span class="owner-swatch"></span>
            <strong>${row.short}</strong>
            <span class="owner-stat-name">${row.name}</span>
          </header>
          <dl class="owner-stat-grid">
            ${leaderHtml}
            <div><dt>Owned</dt><dd>${row.ownedSystems}</dd></div>
            <div><dt>Capital</dt><dd>${escapeHtml(capital)}</dd></div>
            <div><dt>Population</dt><dd>${row.populationDisplay}</dd></div>
            <div><dt>Major (size)</dt><dd>${row.majorSystems}</dd></div>
            <div><dt>Lost to enemy</dt><dd>${row.underOccupation}</dd></div>
            <div><dt>Holding (occ.)</dt><dd>${row.militaryPresence}</dd></div>
            <div class="stat-wide"><dt>Occupying</dt><dd>${escapeHtml(occupying)}</dd></div>
            <div><dt>Timeline</dt><dd>${row.timelineEvents}</dd></div>
          </dl>
        </article>
      `;
    }

    this.container.innerHTML = html;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const statsPanel = new StatsPanel();
