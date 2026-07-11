/**
 * Slice nodesAtlas.png into individual PNGs for visual QA.
 * Reads frames from src/data/nodesAtlasFrames.json (same source as the game).
 *
 * Output: atlas-slices/ at project root
 *   - {id}.png           raw crop
 *   - {id}__anchor.png   crop + anchor crosshair (red)
 *   - index.html         gallery
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PNG } from "pngjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ATLAS_PATH = path.join(ROOT, "assets", "sprites", "nodesAtlas.png");
const FRAMES_PATH = path.join(ROOT, "src", "data", "nodesAtlasFrames.json");
const OUT_DIR = path.join(ROOT, "atlas-slices");

function checkerPixel(x, y) {
  const size = 8;
  const light = ((Math.floor(x / size) + Math.floor(y / size)) % 2) === 0;
  return light ? 0x2a2a2a : 0x1a1a1a;
}

function copyCrop(src, frame) {
  const { x, y, w, h } = frame;
  const out = new PNG({ width: w, height: h });
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const sx = x + px;
      const sy = y + py;
      const si = (sy * src.width + sx) * 4;
      const oi = (py * w + px) * 4;
      if (sx < 0 || sy < 0 || sx >= src.width || sy >= src.height) {
        out.data[oi] = 0;
        out.data[oi + 1] = 0;
        out.data[oi + 2] = 0;
        out.data[oi + 3] = 0;
        continue;
      }
      out.data[oi] = src.data[si];
      out.data[oi + 1] = src.data[si + 1];
      out.data[oi + 2] = src.data[si + 2];
      out.data[oi + 3] = src.data[si + 3];
    }
  }
  return out;
}

function withCheckerAndAnchor(crop, frame) {
  const pad = 4;
  const w = crop.width + pad * 2;
  const h = crop.height + pad * 2;
  const out = new PNG({ width: w, height: h });
  const ax = pad + Math.round((frame.anchorX ?? 0.5) * crop.width);
  const ay = pad + Math.round((frame.anchorY ?? 0.5) * crop.height);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const c = checkerPixel(x, y);
      out.data[i] = c;
      out.data[i + 1] = c;
      out.data[i + 2] = c;
      out.data[i + 3] = 255;
    }
  }

  for (let py = 0; py < crop.height; py++) {
    for (let px = 0; px < crop.width; px++) {
      const si = (py * crop.width + px) * 4;
      const dx = px + pad;
      const dy = py + pad;
      const di = (dy * w + dx) * 4;
      const a = crop.data[si + 3] / 255;
      if (a <= 0) continue;
      out.data[di] = Math.round(crop.data[si] * a + out.data[di] * (1 - a));
      out.data[di + 1] = Math.round(crop.data[si + 1] * a + out.data[di + 1] * (1 - a));
      out.data[di + 2] = Math.round(crop.data[si + 2] * a + out.data[di + 2] * (1 - a));
      out.data[di + 3] = 255;
    }
  }

  const drawPixel = (px, py, r, g, b) => {
    if (px < 0 || py < 0 || px >= w || py >= h) return;
    const i = (py * w + px) * 4;
    out.data[i] = r;
    out.data[i + 1] = g;
    out.data[i + 2] = b;
    out.data[i + 3] = 255;
  };

  for (let d = -6; d <= 6; d++) {
    drawPixel(ax + d, ay, 255, 40, 40);
    drawPixel(ax, ay + d, 255, 40, 40);
  }

  return out;
}

function writePng(png, filePath) {
  return new Promise((resolve, reject) => {
    png
      .pack()
      .pipe(fs.createWriteStream(filePath))
      .on("finish", resolve)
      .on("error", reject);
  });
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function main() {
  if (!fs.existsSync(ATLAS_PATH)) {
    console.error("Atlas not found:", ATLAS_PATH);
    process.exit(1);
  }
  if (!fs.existsSync(FRAMES_PATH)) {
    console.error("Frames JSON not found:", FRAMES_PATH);
    process.exit(1);
  }

  const frames = JSON.parse(fs.readFileSync(FRAMES_PATH, "utf8"));
  const atlasBuffer = fs.readFileSync(ATLAS_PATH);
  const atlas = PNG.sync.read(atlasBuffer);

  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const entries = Object.entries(frames);
  const cards = [];

  console.log(`Atlas: ${atlas.width}x${atlas.height}`);
  console.log(`Frames: ${entries.length}`);
  console.log(`Output: ${OUT_DIR}\n`);

  for (const [id, frame] of entries) {
    const crop = copyCrop(atlas, frame);
    const preview = withCheckerAndAnchor(crop, frame);
    const rawPath = path.join(OUT_DIR, `${id}.png`);
    const anchorPath = path.join(OUT_DIR, `${id}__anchor.png`);

    await writePng(crop, rawPath);
    await writePng(preview, anchorPath);

    const meta = `{ x:${frame.x}, y:${frame.y}, w:${frame.w}, h:${frame.h}, anchor:${(frame.anchorX ?? 0.5).toFixed(3)},${(frame.anchorY ?? 0.5).toFixed(3)} }`;
    console.log(`  ${id.padEnd(16)} ${meta}`);
    cards.push({ id, meta, frame });
  }

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>nodesAtlas slices</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: #111; color: #eee; margin: 0; padding: 16px; }
    h1 { font-size: 1.1rem; font-weight: 600; }
    p { color: #aaa; font-size: 0.85rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
    .card { background: #1c1c1c; border: 1px solid #333; border-radius: 8px; padding: 10px; }
    .card h2 { margin: 0 0 6px; font-size: 0.9rem; }
    .card code { display: block; font-size: 0.65rem; color: #8cf; word-break: break-all; margin-bottom: 8px; }
    .imgs { display: flex; gap: 8px; align-items: flex-end; flex-wrap: wrap; }
    .imgs figure { margin: 0; text-align: center; }
    .imgs figcaption { font-size: 0.6rem; color: #888; margin-top: 4px; }
    .imgs img { max-width: 100%; height: auto; image-rendering: pixelated; background: #222; }
  </style>
</head>
<body>
  <h1>nodesAtlas — ${entries.length} frames</h1>
  <p>Generado desde <code>src/data/nodesAtlasFrames.json</code>. Cruz roja = anchor. Editá el JSON y volvé a correr <code>npm run atlas:slice</code>.</p>
  <div class="grid">
${cards
  .map(
    (c) => `    <div class="card">
      <h2>${escapeHtml(c.id)}</h2>
      <code>${escapeHtml(c.meta)}</code>
      <div class="imgs">
        <figure><img src="${c.id}.png" alt="${escapeHtml(c.id)}" width="${c.frame.w}" /><figcaption>raw</figcaption></figure>
        <figure><img src="${c.id}__anchor.png" alt="${escapeHtml(c.id)} anchor" /><figcaption>anchor</figcaption></figure>
      </div>
    </div>`,
  )
  .join("\n")}
  </div>
</body>
</html>
`;

  fs.writeFileSync(path.join(OUT_DIR, "index.html"), html, "utf8");
  console.log(`\nDone. Open atlas-slices/index.html in a browser.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
