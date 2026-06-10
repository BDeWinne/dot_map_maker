/**
 * Entry point: wait for DOM before loading app modules that query the document.
 */
function startApp() {
  void import("./main");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startApp);
} else {
  startApp();
}
