import type { Locale } from "../i18n/locale";

export type HelpLang = Locale;

const HELP_ES = `
<h3 class="section-title">Guía rápida</h3>
<p class="mode-hint">Un motor para mapas de galaxia, mundos fantasy, campañas de rol y aventuras por nodos. Al abrir la app verás la <strong>galería de mapas</strong> (8 presets). El mapa se <strong>guarda solo</strong> en este navegador.</p>

<h4 class="subsection-title">HUD del mapa (arriba a la derecha)</h4>
<ul class="help-bullets">
  <li><strong>Perfil</strong> — cambia vocabulario (sistema/región/ubicación) y nombre del export.</li>
  <li><strong>Editor / Play</strong> — Editor = diseño del mapa; Play = solo marcar progreso de partida.</li>
  <li><strong>Modo de clic</strong> — colocar nodos, mover fondo o mover todos los nodos (solo Editor).</li>
  <li><strong>Búsqueda</strong> — localiza nodos por nombre o id; al elegir uno, la cámara salta ahí.</li>
</ul>

<h4 class="subsection-title">Hitos (panel al seleccionar un nodo)</h4>
<p class="mode-hint">Diseño en <strong>Editor</strong>; progreso en <strong>Play</strong>. Todo se guarda automáticamente.</p>
<ul class="help-bullets">
  <li><strong>Inicio / Bloq. / Oculto</strong> — nodo inicial, bloqueado o invisible en play (niebla de guerra).</li>
  <li><strong>Desbloqueo</strong> — ids de nodos requeridos (sección colapsable).</li>
  <li><strong>Encuentros</strong> — título, tipo, descripción (jugador), notas GM (solo editor), recompensas.</li>
  <li><strong>Play mode</strong> — tarjetas de encuentro colapsables; notas GM y notas de recompensa ocultas; barra de progreso.</li>
  <li><strong>Hito completado</strong> — tarjeta verde; se marca solo si todos los encuentros están hechos.</li>
</ul>
<p class="mode-hint">El progreso vive en <code>metadata.playProgress</code>, no en el diseño del mapa. Podés exportar/importar solo progreso desde Mapa.</p>

<h4 class="subsection-title">Perfiles de mapa</h4>
<div class="help-profiles">
  <article class="help-profile-card"><strong>Galaxia / sci-fi</strong><p>Sistemas, imperios, hipervías, flotas, timeline.</p></article>
  <article class="help-profile-card"><strong>Fantasy</strong><p>Regiones, reinos, caminos, ejércitos.</p></article>
  <article class="help-profile-card"><strong>Mesa / D&amp;D</strong><p>Ubicaciones, facciones, party, POIs.</p></article>
  <article class="help-profile-card"><strong>Aventura</strong><p>Hitos, desbloqueos, encuentros, play mode, niebla de guerra.</p></article>
</div>

<h4 class="subsection-title">Galería y persistencia</h4>
<ul class="help-bullets">
  <li><strong>Galería</strong> — al iniciar o Mapa → Galería. Incluye preset <em>Niebla de guerra</em>.</li>
  <li><strong>Continuar último mapa</strong> — restaura el auto-guardado del navegador.</li>
  <li><strong>Validación</strong> — Mapa → Validar mapa (ids, rutas, unlock refs, capitales).</li>
  <li><strong>Export JSON</strong> — diseño completo; <strong>Export play progress</strong> — solo partida.</li>
</ul>

<h4 class="subsection-title">Pestañas del sidebar</h4>
<ul class="help-bullets">
  <li><strong>Sistema</strong> — id, nombre, dueño, población, instalaciones, flotas (auto-guardado).</li>
  <li><strong>Mapa</strong> — calendario, fondo, validación, progreso de play, export/import.</li>
  <li><strong>Facciones</strong> — colores, nombres, líderes (auto-guardado).</li>
  <li><strong>Timeline</strong> — eventos históricos del nodo (auto-guardado).</li>
  <li><strong>Crónica</strong> — todos los eventos; clic salta al año.</li>
  <li><strong>Rutas</strong> — tipo, nombre, eventos abrir/cerrar (auto-guardado).</li>
  <li><strong>Stats</strong> — resumen por facción.</li>
</ul>

<h4 class="subsection-title">Atajos (Editor)</h4>
<dl class="help-list">
  <div><dt>Clic vacío</dt><dd>Añadir nodo</dd></div>
  <div><dt>Shift + clic</dt><dd>Crear ruta</dd></div>
  <div><dt>Ctrl+Z / Ctrl+Y</dt><dd>Deshacer / rehacer (nodos, rutas, mover, editar)</dd></div>
  <div><dt>Ctrl+C / Ctrl+V</dt><dd>Copiar / pegar nodo</dd></div>
  <div><dt>Ctrl+D</dt><dd>Duplicar nodo</dd></div>
  <div><dt>F2</dt><dd>Renombrar id del nodo</dd></div>
  <div><dt>Supr</dt><dd>Borrar nodo o ruta seleccionada</dd></div>
  <div><dt>Clic medio en ruta</dt><dd>Borrar ruta</dd></div>
</dl>

<h4 class="subsection-title">Toggles del mapa (abajo izquierda)</h4>
<ul class="help-bullets">
  <li><strong>Iconos / Textos / Flotas / Progreso</strong> — visibilidad en el canvas.</li>
  <li>Nodos <strong>ocultos</strong> en editor se ven como fantasmas (contorno azul).</li>
  <li><strong>Año</strong> (arriba izquierda) — scrubber de timeline histórica.</li>
</ul>
`;

const HELP_EN = `
<h3 class="section-title">Quick guide</h3>
<p class="mode-hint">One engine for galaxy maps, fantasy worlds, tabletop campaigns, and node adventures. On launch you get the <strong>map gallery</strong> (8 presets). The map <strong>auto-saves</strong> in this browser.</p>

<h4 class="subsection-title">Map HUD (top right)</h4>
<ul class="help-bullets">
  <li><strong>Profile</strong> — changes vocabulary and export filename.</li>
  <li><strong>Editor / Play</strong> — Editor = map design; Play = session progress only.</li>
  <li><strong>Click mode</strong> — place nodes, move background, or move all nodes (Editor only).</li>
  <li><strong>Search</strong> — find nodes by name or id; selecting one pans the camera there.</li>
</ul>

<h4 class="subsection-title">Milestones (panel when a node is selected)</h4>
<p class="mode-hint">Design in <strong>Editor</strong>; progress in <strong>Play</strong>. Everything auto-saves.</p>
<ul class="help-bullets">
  <li><strong>Start / Locked / Hidden</strong> — start node, locked, or fog-of-war hidden in play.</li>
  <li><strong>Unlock</strong> — required node ids (collapsible section).</li>
  <li><strong>Encounters</strong> — title, kind, player description, GM notes (editor only), rewards.</li>
  <li><strong>Play mode</strong> — collapsible encounter cards; GM/reward notes hidden; progress bar.</li>
  <li><strong>Milestone completed</strong> — green card; auto-checks when all encounters are done.</li>
</ul>
<p class="mode-hint">Progress lives in <code>metadata.playProgress</code>, separate from map design. Export/import play-only from Map tab.</p>

<h4 class="subsection-title">Map profiles</h4>
<div class="help-profiles">
  <article class="help-profile-card"><strong>Galaxy / sci-fi</strong><p>Systems, empires, hyperlanes, fleets, timeline.</p></article>
  <article class="help-profile-card"><strong>Fantasy</strong><p>Regions, kingdoms, paths, armies.</p></article>
  <article class="help-profile-card"><strong>Tabletop / D&amp;D</strong><p>Locations, factions, party, POIs.</p></article>
  <article class="help-profile-card"><strong>Adventure</strong><p>Milestones, unlocks, encounters, play mode, fog of war.</p></article>
</div>

<h4 class="subsection-title">Gallery &amp; persistence</h4>
<ul class="help-bullets">
  <li><strong>Gallery</strong> — on launch or Map → Gallery. Includes <em>Fog of war</em> preset.</li>
  <li><strong>Continue last map</strong> — restores browser auto-save.</li>
  <li><strong>Validation</strong> — Map → Validate map (ids, routes, unlock refs, capitals).</li>
  <li><strong>Export JSON</strong> — full design; <strong>Export play progress</strong> — session only.</li>
</ul>

<h4 class="subsection-title">Sidebar tabs</h4>
<ul class="help-bullets">
  <li><strong>System</strong> — id, name, owner, population, facilities, fleets (auto-save).</li>
  <li><strong>Map</strong> — calendar, background, validation, play progress, export/import.</li>
  <li><strong>Owners</strong> — colors, names, leaders (auto-save).</li>
  <li><strong>Timeline</strong> — historical events (auto-save).</li>
  <li><strong>Chronicle</strong> — all events; click jumps to year.</li>
  <li><strong>Routes</strong> — type, name, open/close events (auto-save).</li>
  <li><strong>Stats</strong> — per-faction summary.</li>
</ul>

<h4 class="subsection-title">Shortcuts (Editor)</h4>
<dl class="help-list">
  <div><dt>Empty click</dt><dd>Add node</dd></div>
  <div><dt>Shift + click</dt><dd>Create route</dd></div>
  <div><dt>Ctrl+Z / Ctrl+Y</dt><dd>Undo / redo (nodes, routes, move, edits)</dd></div>
  <div><dt>Ctrl+C / Ctrl+V</dt><dd>Copy / paste node</dd></div>
  <div><dt>Ctrl+D</dt><dd>Duplicate node</dd></div>
  <div><dt>F2</dt><dd>Rename node id</dd></div>
  <div><dt>Delete</dt><dd>Delete selected node or route</dd></div>
  <div><dt>Middle-click route</dt><dd>Delete route</dd></div>
</dl>

<h4 class="subsection-title">Map toggles (bottom left)</h4>
<ul class="help-bullets">
  <li><strong>Icons / Labels / Fleets / Progress</strong> — canvas visibility.</li>
  <li><strong>Hidden</strong> nodes in editor appear as ghosts (blue outline).</li>
  <li><strong>Year</strong> (top left) — historical timeline scrubber.</li>
</ul>
`;

export function getHelpHtml(lang: Locale): string {
  return lang === "en" ? HELP_EN : HELP_ES;
}
