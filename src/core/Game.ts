import { Application } from "pixi.js";
import { galaxyScene, GalaxyScene } from "../scene/GalaxyScene";
import { isAtlasNodeVisualEnabled } from "../galaxy/nodeVisualMode";
import { loadNodesAtlas } from "../galaxy/nodesAtlas";

let gameInstance: Game | null = null;

export class Game {
  private app!: Application;
  private readonly ready: Promise<void>;

  constructor() {
    gameInstance = this;
    this.ready = this.init();
  }

  public static getInstance(): Game | null {
    return gameInstance;
  }

  public static async whenReady(): Promise<void> {
    await gameInstance?.ready;
  }

  public getApp(): Application {
    return this.app;
  }

  private async init() {
    this.app = new Application();
    const resolution = Math.min(2, window.devicePixelRatio || 1);

    await this.app.init({
      resizeTo: window,
      resolution,
      autoDensity: true,
      background: 0x000000,
      backgroundAlpha: 1,
      antialias: true,
      preference: "webgl",
      webgl: {
        preserveDrawingBuffer: true,
      },
    });
    (globalThis as any).__PIXI_APP__ = this.app;
    document.body.appendChild(this.app.canvas);

    if (isAtlasNodeVisualEnabled()) {
      await loadNodesAtlas();
    }

    this.app.stage.addChild(galaxyScene);

    if (isAtlasNodeVisualEnabled()) {
      await galaxyScene.onAtlasReady();
    }

    galaxyScene.enableZoom(this.app.view);
    this.app.view.addEventListener("contextmenu", (e) => e.preventDefault());
    galaxyScene.refreshLabelResolution();
  }
}
