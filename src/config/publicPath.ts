/**
 * Resolve a path relative to the app public URL.
 * Works at site root (dot-map-maker.netlify.app) and under /dot-map-maker/.
 */
export function appAssetUrl(relativePath: string): string {
  const cleaned = relativePath.replace(/^\.\//, "").replace(/^\//, "");
  const base = (
    typeof __webpack_public_path__ !== "undefined"
      ? __webpack_public_path__
      : "/"
  ).replace(/\/$/, "");

  return `${base}/${cleaned}`;
}
