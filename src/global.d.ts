export {};

declare global {
  /** Set by webpack DefinePlugin when building with `--env demo`. */
  const __DEMO_BUILD__: boolean;

  /** Injected by webpack from `output.publicPath` (`auto` at runtime). */
  let __webpack_public_path__: string;
}
