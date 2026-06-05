export const TERRITORY_INFLUENCE_RADIUS = 88;
export const TERRITORY_CELL_SIZE = 14;
export const TERRITORY_PADDING = 96;
/** Radio mínimo de territorio garantizado alrededor de cada sistema. */
export const TERRITORY_CORE_RADIUS_MIN = 36;
export const TERRITORY_CORE_RADIUS_FACTOR = 0.36;
/** Ocupación militar: 40 % de la influencia normal (incluye size). */
export const OCCUPATION_INFLUENCE_FACTOR = 0.4;
/** Cuánto modifica el size el radio (bajo = diferencias sutiles entre tamaños). */
export const TERRITORY_SIZE_INFLUENCE_STRENGTH = 0.08;

/**
 * Radio de influencia con variación suave por size.
 * size 1 → 100 %, size 2 → +12 %, size 0.5 → −6 % (aprox., con límites).
 */
export function influenceRadiusForSize(size: number | undefined, scale = 1): number {
  const clampedSize = Math.max(0.5, Math.min(2.5, size ?? 1));
  const sizeFactor = 1 + (clampedSize - 1) * TERRITORY_SIZE_INFLUENCE_STRENGTH;
  return TERRITORY_INFLUENCE_RADIUS * sizeFactor * scale;
}

export function coreRadiusMinForInfluence(influenceRadius: number): number {
  const scaledMin = TERRITORY_CORE_RADIUS_MIN * (influenceRadius / TERRITORY_INFLUENCE_RADIUS);
  return Math.max(26, scaledMin);
}

export interface TerritorySeed {
  x: number;
  y: number;
  ownerId: string;
  radius: number;
}

export interface TerritoryBorderSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface TerritoryOwnerRegion {
  ownerId: string;
  cells: { x: number; y: number }[];
}

export interface TerritoryMapData {
  cellSize: number;
  minX: number;
  minY: number;
  cols: number;
  rows: number;
  ownerIndex: Int16Array;
  ownerIds: string[];
  regions: TerritoryOwnerRegion[];
  borders: TerritoryBorderSegment[];
}

export interface TerritoryMapOptions {
  coreRadiusMin?: number;
  coreRadiusFactor?: number;
}

/** Power diagram: cada celda pertenece al sistema con menor (dist² - radio²). */
export function buildTerritoryMap(
  seeds: TerritorySeed[],
  options?: TerritoryMapOptions
): TerritoryMapData | null {
  const coreRadiusMin = options?.coreRadiusMin ?? TERRITORY_CORE_RADIUS_MIN;
  const coreRadiusFactor = options?.coreRadiusFactor ?? TERRITORY_CORE_RADIUS_FACTOR;
  if (seeds.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const seed of seeds) {
    const pad = seed.radius + TERRITORY_PADDING;
    minX = Math.min(minX, seed.x - pad);
    minY = Math.min(minY, seed.y - pad);
    maxX = Math.max(maxX, seed.x + pad);
    maxY = Math.max(maxY, seed.y + pad);
  }

  const cellSize = TERRITORY_CELL_SIZE;
  const cols = Math.ceil((maxX - minX) / cellSize);
  const rows = Math.ceil((maxY - minY) / cellSize);
  const ownerIndex = new Int16Array(cols * rows);
  ownerIndex.fill(-1);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const px = minX + (col + 0.5) * cellSize;
      const py = minY + (row + 0.5) * cellSize;

      let best = -1;
      let bestCost = Infinity;

      for (let i = 0; i < seeds.length; i++) {
        const seed = seeds[i];
        const dx = px - seed.x;
        const dy = py - seed.y;
        const cost = dx * dx + dy * dy - seed.radius * seed.radius;
        if (cost < bestCost) {
          bestCost = cost;
          best = i;
        }
      }

      if (best >= 0 && bestCost <= 0) {
        ownerIndex[row * cols + col] = best;
      }
    }
  }

  smoothOwnerGrid(ownerIndex, cols, rows, 1);
  stampCoreTerritories(
    ownerIndex,
    cols,
    rows,
    minX,
    minY,
    cellSize,
    seeds,
    coreRadiusMin,
    coreRadiusFactor
  );

  const ownerIds = [...new Set(seeds.map((s) => s.ownerId))];
  const regions: TerritoryOwnerRegion[] = ownerIds.map((ownerId) => ({
    ownerId,
    cells: [],
  }));
  const regionByOwner = new Map(regions.map((r) => [r.ownerId, r]));

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = ownerIndex[row * cols + col];
      if (idx < 0) continue;
      const ownerId = seeds[idx].ownerId;
      regionByOwner.get(ownerId)!.cells.push({ x: col, y: row });
    }
  }

  const borders = extractBorderSegments(ownerIndex, cols, rows, minX, minY, cellSize, seeds);

  return {
    cellSize,
    minX,
    minY,
    cols,
    rows,
    ownerIndex,
    ownerIds,
    regions: regions.filter((r) => r.cells.length > 0),
    borders,
  };
}

/** Cada sistema siempre reclama un núcleo local (aunque vecinos más fuertes dominen afuera). */
function stampCoreTerritories(
  grid: Int16Array,
  cols: number,
  rows: number,
  minX: number,
  minY: number,
  cellSize: number,
  seeds: TerritorySeed[],
  coreRadiusMin: number,
  coreRadiusFactor: number
) {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const px = minX + (col + 0.5) * cellSize;
      const py = minY + (row + 0.5) * cellSize;

      let best = -1;
      let bestDist2 = Infinity;

      for (let i = 0; i < seeds.length; i++) {
        const seed = seeds[i];
        const coreRadius = Math.max(coreRadiusMin, seed.radius * coreRadiusFactor);
        const dx = px - seed.x;
        const dy = py - seed.y;
        const dist2 = dx * dx + dy * dy;

        if (dist2 <= coreRadius * coreRadius && dist2 < bestDist2) {
          bestDist2 = dist2;
          best = i;
        }
      }

      if (best >= 0) {
        grid[row * cols + col] = best;
      }
    }
  }
}

function smoothOwnerGrid(
  grid: Int16Array,
  cols: number,
  rows: number,
  passes: number
) {
  const temp = new Int16Array(grid.length);

  for (let pass = 0; pass < passes; pass++) {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const i = row * cols + col;
        const counts = new Map<number, number>();
        let maxOwner = -1;
        let maxCount = 0;

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nc = col + dx;
            const nr = row + dy;
            if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
            const v = grid[nr * cols + nc];
            if (v < 0) continue;
            const c = (counts.get(v) ?? 0) + 1;
            counts.set(v, c);
            if (c > maxCount) {
              maxCount = c;
              maxOwner = v;
            }
          }
        }

        temp[i] = maxCount >= 5 ? maxOwner : grid[i];
      }
    }
    grid.set(temp);
  }
}

function extractBorderSegments(
  grid: Int16Array,
  cols: number,
  rows: number,
  minX: number,
  minY: number,
  cellSize: number,
  seeds: TerritorySeed[]
): TerritoryBorderSegment[] {
  const borders: TerritoryBorderSegment[] = [];
  const ownerAt = (col: number, row: number) => {
    if (col < 0 || row < 0 || col >= cols || row >= rows) return -1;
    return grid[row * cols + col];
  };
  const isClaimed = (idx: number) => idx >= 0;
  const differentOwners = (a: number, b: number) => {
    if (!isClaimed(a) || !isClaimed(b)) return false;
    return seeds[a].ownerId !== seeds[b].ownerId;
  };

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols - 1; col++) {
      const left = ownerAt(col, row);
      const right = ownerAt(col + 1, row);
      if (!differentOwners(left, right)) continue;

      const x = minX + (col + 1) * cellSize;
      const y1 = minY + row * cellSize;
      const y2 = minY + (row + 1) * cellSize;
      borders.push({ x1: x, y1, x2: x, y2 });
    }
  }

  for (let row = 0; row < rows - 1; row++) {
    for (let col = 0; col < cols; col++) {
      const top = ownerAt(col, row);
      const bottom = ownerAt(col, row + 1);
      if (!differentOwners(top, bottom)) continue;

      const y = minY + (row + 1) * cellSize;
      const x1 = minX + col * cellSize;
      const x2 = minX + (col + 1) * cellSize;
      borders.push({ x1, y1: y, x2, y2: y });
    }
  }

  return borders;
}
