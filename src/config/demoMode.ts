/** Default showcase map when entering demo without a picker choice. */
export const DEMO_DEFAULT_PRESET = "csh-preset.json";

/** Injected by webpack DefinePlugin (`--env demo`). */
declare const __DEMO_BUILD__: boolean;

let demoActive = false;

function detectDemoFromLocation(): boolean {
  try {
    if (__DEMO_BUILD__) return true;
    const params = new URLSearchParams(window.location.search);
    if (params.has("demo")) return true;
    if (params.get("mode") === "demo") return true;
    const path = window.location.pathname.replace(/\/+$/, "");
    return path.endsWith("/demo");
  } catch {
    return false;
  }
}

export function isDemoMode(): boolean {
  return demoActive;
}

export function getFullEditorUrl(): string {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete("demo");
    url.searchParams.delete("mode");
    if (url.pathname.replace(/\/+$/, "").endsWith("/demo")) {
      url.pathname = url.pathname.replace(/\/demo\/?$/, "/") || "/";
    }
    return url.toString();
  } catch {
    return "/";
  }
}

/** Call once at boot — sets body class and demo banner. */
export function initDemoMode(): boolean {
  demoActive = detectDemoFromLocation();
  if (!demoActive) return false;

  document.body.classList.add("is-demo-mode");
  document.documentElement.dataset.appMode = "demo";

  const banner = document.getElementById("demo-banner");
  if (banner) banner.hidden = false;

  const fullLink = document.getElementById("demo-full-link") as HTMLAnchorElement | null;
  if (fullLink) {
    fullLink.href = getFullEditorUrl();
  }

  return true;
}
