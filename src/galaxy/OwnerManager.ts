import ownersData from "../owners.json";
import { isDemoMode } from "../config/demoMode";

export const OWNERS_STORAGE_KEY = "galaxy-map-owners";

export interface OwnerLeader {
  name: string;
  /** Age at `ageYear` (defaults to map default year when missing). */
  age?: number;
  ageYear?: number;
  personality?: string;
}

export interface OwnerJSON {
  id: string;
  name: string;
  short: string;
  color: string;
  leader?: OwnerLeader;
}

export interface OwnerData {
  id: string;
  name: string;
  short: string;
  color: number;
  leader?: OwnerLeader;
}

export class OwnerManager {
  private owners = new Map<string, OwnerData>();
  readonly defaultOwnerId = "none";

  public loadFromJSON(data: { owners: OwnerJSON[] }, options?: { persist?: boolean }) {
    if (!data?.owners || !Array.isArray(data.owners)) {
      console.error("Invalid owners JSON format");
      return false;
    }

    this.owners.clear();

    data.owners.forEach((o) => {
      if (!o.id) return;
      this.owners.set(o.id, this.jsonToOwner(o));
    });

    this.ensureDefaultOwner();

    if (options?.persist !== false) {
      this.persist();
    }
    this.notifyChange();
    return true;
  }

  public upsert(owner: OwnerData, options?: { persist?: boolean }) {
    this.owners.set(owner.id, owner);
    this.ensureDefaultOwner();
    if (options?.persist !== false) {
      this.persist();
    }
    this.notifyChange();
  }

  public renameId(oldId: string, newId: string): boolean {
    const trimmed = newId.trim();
    if (!trimmed || oldId === trimmed) return true;
    if (oldId === this.defaultOwnerId) return false;
    if (!this.owners.has(oldId) || this.owners.has(trimmed)) return false;

    const owner = this.owners.get(oldId)!;
    this.owners.delete(oldId);
    this.owners.set(trimmed, { ...owner, id: trimmed });
    this.persist();
    this.notifyChange();
    return true;
  }

  public register(owner: OwnerData) {
    this.upsert(owner);
  }

  public get(id: string | undefined | null): OwnerData {
    if (!id || !this.owners.has(id)) {
      return this.owners.get(this.defaultOwnerId)!;
    }
    return this.owners.get(id)!;
  }

  public exists(id: string): boolean {
    return this.owners.has(id);
  }

  public getAll(): OwnerData[] {
    return Array.from(this.owners.values()).sort((a, b) => {
      if (a.id === this.defaultOwnerId) return 1;
      if (b.id === this.defaultOwnerId) return -1;
      return a.name.localeCompare(b.name);
    });
  }

  public remove(id: string, options?: { persist?: boolean }) {
    if (id === this.defaultOwnerId) return;
    this.owners.delete(id);
    this.ensureDefaultOwner();
    if (options?.persist !== false) {
      this.persist();
    }
    this.notifyChange();
  }

  public exportJSON(): OwnerJSON[] {
    return this.getAll().map((o) => {
      const row: OwnerJSON = {
        id: o.id,
        name: o.name,
        short: o.short,
        color: this.numberToHex(o.color),
      };
      if (o.leader) row.leader = { ...o.leader };
      return row;
    });
  }

  public exportData(): { owners: OwnerJSON[] } {
    return { owners: this.exportJSON() };
  }

  public resetToBundledDefaults() {
    localStorage.removeItem(OWNERS_STORAGE_KEY);
    this.loadFromJSON(ownersData as { owners: OwnerJSON[] }, { persist: false });
  }

  public persist() {
    if (isDemoMode()) return;
    try {
      localStorage.setItem(OWNERS_STORAGE_KEY, JSON.stringify(this.exportData()));
    } catch (err) {
      console.warn("Could not persist owners", err);
    }
  }

  public numberToHex(color: number): string {
    return `#${(color & 0xffffff).toString(16).padStart(6, "0")}`;
  }

  public parseColor(input: string): number | null {
    const hex = input.trim();
    if (!/^#?[0-9a-fA-F]{6}$/.test(hex)) return null;
    return Number(hex.replace("#", "0x"));
  }

  private jsonToOwner(o: OwnerJSON): OwnerData {
    return {
      id: o.id,
      name: o.name ?? o.id,
      short: o.short ?? o.id.substring(0, 3).toUpperCase(),
      color: this.hexToNumber(o.color ?? "#666666"),
      leader: normalizeLeader(o.leader),
    };
  }

  private hexToNumber(hex: string): number {
    return Number(hex.replace("#", "0x"));
  }

  private ensureDefaultOwner() {
    if (!this.owners.has(this.defaultOwnerId)) {
      this.owners.set(this.defaultOwnerId, {
        id: this.defaultOwnerId,
        name: "Unclaimed",
        short: "-",
        color: 0x666666,
      });
    }
  }

  private notifyChange() {
    document.dispatchEvent(new CustomEvent("owners:changed"));
  }
}

export const ownerManager = new OwnerManager();

export function getLeaderAgeAtYear(
  leader: OwnerLeader | undefined,
  year: number,
  fallbackAgeYear?: number,
): number | undefined {
  if (!leader || leader.age === undefined) return undefined;
  const anchorYear = leader.ageYear ?? fallbackAgeYear ?? year;
  return Math.max(0, leader.age + (year - anchorYear));
}

export function normalizeLeader(raw: unknown): OwnerLeader | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Partial<OwnerLeader>;
  const name = String(o.name ?? "").trim();
  if (!name) return undefined;
  const ageRaw = o.age;
  const age =
    ageRaw !== undefined && ageRaw !== null && String(ageRaw).trim() !== ""
      ? Math.max(0, Math.round(Number(ageRaw)))
      : undefined;
  const ageYearRaw = o.ageYear;
  const ageYear =
    ageYearRaw !== undefined &&
    ageYearRaw !== null &&
    String(ageYearRaw).trim() !== "" &&
    age !== undefined
      ? Math.round(Number(ageYearRaw))
      : undefined;
  const personality = String(o.personality ?? "").trim() || undefined;
  const leader: OwnerLeader = { name, personality };
  if (age !== undefined && Number.isFinite(age)) leader.age = age;
  if (ageYear !== undefined && Number.isFinite(ageYear)) leader.ageYear = ageYear;
  return leader;
}

function loadInitialOwners() {
  try {
    const raw = localStorage.getItem(OWNERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { owners: OwnerJSON[] };
      if (ownerManager.loadFromJSON(parsed, { persist: false })) return;
    }
  } catch {
    /* use bundled */
  }
  ownerManager.loadFromJSON(ownersData as { owners: OwnerJSON[] }, { persist: false });
}

loadInitialOwners();
