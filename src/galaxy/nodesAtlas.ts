import { Assets, Rectangle, Sprite, Texture } from "pixi.js";
import atlasFramesJson from "../data/nodesAtlasFrames.json";

/** Atlas source: assets/sprites/nodesAtlas.png (1536×1024, transparent). */
export const NODES_ATLAS_URL = "assets/sprites/nodesAtlas.png";

export interface AtlasFrame {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Content centroid anchor (0–1). Defaults to 0.5. */
  anchorX?: number;
  anchorY?: number;
}

/** Sprite rectangles — edit src/data/nodesAtlasFrames.json, then npm run atlas:slice to preview. */
export type NodesAtlasFrameId = keyof typeof atlasFramesJson;
export const NODES_ATLAS_FRAMES = atlasFramesJson as Record<
  NodesAtlasFrameId,
  AtlasFrame
>;

export type FacilityAtlasIconId = Extract<
  NodesAtlasFrameId,
  | "iconShield"
  | "iconAnchor"
  | "iconFactory"
  | "iconSwords"
  | "iconStar"
  | "iconRadar"
  | "iconFlask"
  | "iconCube"
  | "iconPeople"
  | "iconGear"
>;

const DIGIT_FRAMES: Record<string, NodesAtlasFrameId> = {
  "0": "digit0",
  "1": "digit1",
  "2": "digit2",
  "3": "digit3",
  "4": "digit4",
  "5": "digit5",
  "6": "digit6",
  "7": "digit7",
  "8": "digit8",
  "9": "digit9",
};

let baseTexture: Texture | null = null;
let atlasReady = false;

export function isNodesAtlasReady(): boolean {
  return atlasReady;
}

export async function loadNodesAtlas(): Promise<void> {
  if (atlasReady && baseTexture) return;
  baseTexture = await Assets.load({
    src: NODES_ATLAS_URL,
    data: { alphaMode: "no-premultiply-alpha" },
  });
  atlasReady = true;
}

export function getAtlasTexture(): Texture {
  if (!baseTexture) {
    throw new Error("nodes atlas not loaded — call loadNodesAtlas() first");
  }
  return baseTexture;
}

export function atlasFrameTexture(frameId: NodesAtlasFrameId): Texture {
  const frame = NODES_ATLAS_FRAMES[frameId];
  const source = getAtlasTexture().source;
  return new Texture({
    source,
    frame: new Rectangle(frame.x, frame.y, frame.w, frame.h),
  });
}

export function createAtlasSprite(
  frameId: NodesAtlasFrameId,
  tint?: number,
): Sprite {
  const frame = NODES_ATLAS_FRAMES[frameId];
  const sprite = new Sprite(atlasFrameTexture(frameId));
  sprite.anchor.set(frame.anchorX ?? 0.5, frame.anchorY ?? 0.5);
  sprite.tint = tint ?? 0xffffff;
  return sprite;
}

export function tintAtlasSprite(sprite: Sprite, color: number, alpha = 1): void {
  sprite.tint = color;
  sprite.alpha = alpha;
}

export function createDigitSprites(
  value: string,
  tint: number,
  scale = 1,
): Sprite[] {
  const sprites: Sprite[] = [];
  for (const ch of value) {
    const frameId = DIGIT_FRAMES[ch];
    if (!frameId) continue;
    const digit = createAtlasSprite(frameId, tint);
    digit.scale.set(scale);
    sprites.push(digit);
  }
  return sprites;
}

export function digitRowWidth(value: string, scale = 1): number {
  let w = 0;
  for (const ch of value) {
    if (!DIGIT_FRAMES[ch]) continue;
    const frame = NODES_ATLAS_FRAMES[DIGIT_FRAMES[ch]];
    w += frame.w * scale * 0.78;
  }
  return w;
}
