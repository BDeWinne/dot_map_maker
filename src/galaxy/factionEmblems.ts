import { Assets, Container, Sprite, Texture } from "pixi.js";

/** Optional emblem PNG per owner id (you add files under assets/sprites/emblems/). */
const EMBLEM_SOURCES: Record<string, string> = {
  // kthrak: "assets/sprites/emblems/kthrak.png",
};

const emblemTextures = new Map<string, Texture>();

export function hasFactionEmblem(ownerId: string): boolean {
  return emblemTextures.has(ownerId);
}

export async function preloadFactionEmblems(ownerIds: string[]): Promise<void> {
  const loads: Promise<void>[] = [];
  for (const id of ownerIds) {
    const src = EMBLEM_SOURCES[id];
    if (!src || emblemTextures.has(id)) continue;
    loads.push(
      Assets.load(src).then((tex) => {
        emblemTextures.set(id, tex);
      }),
    );
  }
  await Promise.all(loads);
}

export function registerFactionEmblem(ownerId: string, assetUrl: string): void {
  EMBLEM_SOURCES[ownerId] = assetUrl;
}

/**
 * Faction emblem centered inside the node ring.
 * Returns null when no PNG is registered for this owner (empty node interior).
 */
export function createEmblemDisplay(
  ownerId: string,
  _resolution: number,
  maxDiameter = 9,
): Container | null {
  const tex = emblemTextures.get(ownerId);
  if (!tex) return null;

  const root = new Container();
  root.eventMode = "none";

  const sprite = new Sprite(tex);
  sprite.anchor.set(0.5);
  const maxDim = Math.max(sprite.width, sprite.height) || 1;
  sprite.scale.set(maxDiameter / maxDim);
  root.addChild(sprite);
  return root;
}
