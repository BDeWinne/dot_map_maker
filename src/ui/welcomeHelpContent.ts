import type { Locale } from "../i18n/locale";

const WELCOME_ES = `
<p class="welcome-lead">Motor de mapas por <strong>nodos</strong> y <strong>rutas</strong>. El diseño se guarda como <strong>JSON en localStorage</strong> de este navegador (~700 ms después de cada cambio). Para no perderlo: exportá el JSON desde Mapa, o usá <strong>Continuar último mapa</strong> al volver.</p>

<h4 class="welcome-section">Cómo empezar</h4>
<ul class="welcome-bullets">
  <li><strong>Mapa de ejemplo</strong> — ideal la primera vez: timeline, flotas, facciones y más.</li>
  <li><strong>Mapa vacío</strong> — lienzo en blanco para crear desde cero.</li>
  <li><strong>Continuar</strong> — restaura el último auto-guardado (si existe).</li>
</ul>

<h4 class="welcome-section">Dos modos</h4>
<ul class="welcome-bullets">
  <li><strong>Editor</strong> — colocar nodos, rutas, facciones, timeline e hitos.</li>
  <li><strong>Play</strong> — marcar progreso de partida sin editar el mapa.</li>
</ul>

<h4 class="welcome-section">Atajos útiles</h4>
<dl class="welcome-shortcuts">
  <div><dt>Clic en vacío</dt><dd>Añadir nodo</dd></div>
  <div><dt>Shift + clic</dt><dd>Crear ruta entre nodos</dd></div>
  <div><dt>Rueda del ratón</dt><dd>Zoom del mapa</dd></div>
  <div><dt>Clic en nodo</dt><dd>Ver detalle en el panel derecho</dd></div>
</dl>

<p class="welcome-foot">La ayuda completa está en la pestaña <strong>Ayuda</strong> del panel lateral.</p>
`;

const WELCOME_EN = `
<p class="welcome-lead">A <strong>node</strong> and <strong>route</strong> map engine. Your design is saved as <strong>JSON in this browser's localStorage</strong> (~700 ms after each change). To avoid losing work: export JSON from Map, or use <strong>Continue last map</strong> when you return.</p>

<h4 class="welcome-section">Getting started</h4>
<ul class="welcome-bullets">
  <li><strong>Example map</strong> — best for a first visit: timeline, fleets, factions, and more.</li>
  <li><strong>Empty map</strong> — blank canvas to build from scratch.</li>
  <li><strong>Continue</strong> — restores the last auto-save (if any).</li>
</ul>

<h4 class="welcome-section">Two modes</h4>
<ul class="welcome-bullets">
  <li><strong>Editor</strong> — place nodes, routes, factions, timeline, and milestones.</li>
  <li><strong>Play</strong> — track session progress without editing the map.</li>
</ul>

<h4 class="welcome-section">Handy shortcuts</h4>
<dl class="welcome-shortcuts">
  <div><dt>Click empty space</dt><dd>Add node</dd></div>
  <div><dt>Shift + click</dt><dd>Create route between nodes</dd></div>
  <div><dt>Mouse wheel</dt><dd>Zoom the map</dd></div>
  <div><dt>Click a node</dt><dd>Inspect it in the right panel</dd></div>
</dl>

<p class="welcome-foot">Full documentation lives in the sidebar <strong>Help</strong> tab.</p>
`;

export function getWelcomeHelpHtml(lang: Locale): string {
  return lang === "en" ? WELCOME_EN : WELCOME_ES;
}
