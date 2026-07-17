import { Rectangle } from "pixi.js";
import { Game } from "../core/Game";
import { isDemoMode } from "../config/demoMode";
import { galaxyScene } from "../scene/GalaxyScene";

const EXPORT_PADDING = 48;
const EXPORT_RESOLUTION = 2;

function padBounds(bounds: Rectangle, padding: number): Rectangle {
  return new Rectangle(
    bounds.x - padding,
    bounds.y - padding,
    Math.max(1, bounds.width + padding * 2),
    Math.max(1, bounds.height + padding * 2)
  );
}

export async function exportMapAsPng(filename = "galaxy-map.png"): Promise<boolean> {
  if (isDemoMode()) return false;
  await Game.whenReady();
  const app = Game.getInstance()?.getApp();
  if (!app) {
    console.error("Renderer not ready");
    return false;
  }

  app.renderer.render(app.stage);

  const bounds = padBounds(galaxyScene.getMapBounds(), EXPORT_PADDING);

  try {
    const extracted = await app.renderer.extract.canvas({
      target: galaxyScene.world,
      frame: bounds,
      resolution: EXPORT_RESOLUTION,
      clearColor: 0x000000,
      antialias: true,
    });

    const canvas = extracted as HTMLCanvasElement;
    const dataUrl =
      typeof canvas.toDataURL === "function"
        ? canvas.toDataURL("image/png")
        : await app.renderer.extract.base64({
            target: galaxyScene.world,
            frame: bounds,
            resolution: EXPORT_RESOLUTION,
            format: "png",
          });

    const link = document.createElement("a");
    link.download = filename;
    link.href = dataUrl.startsWith("data:") ? dataUrl : `data:image/png;base64,${dataUrl}`;
    link.click();
    return true;
  } catch (err) {
    console.warn("Extract failed, falling back to screen canvas", err);
  }

  try {
    app.renderer.render(app.stage);
    const screenCanvas = app.canvas as HTMLCanvasElement;
    const link = document.createElement("a");
    link.download = filename;
    link.href = screenCanvas.toDataURL("image/png");
    link.click();
    return true;
  } catch (err) {
    console.error("PNG export failed", err);
    return false;
  }
}
