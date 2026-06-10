import type { Locale } from "../i18n/locale";

export type HelpLang = Locale;

const HELP_ES = `
<h3 class="section-title">Guía rápida</h3>
<p class="mode-hint">El mismo motor sirve para mapas de galaxia, mundos fantasy, campañas de rol y aventuras por nodos. Elige un <strong>Map profile</strong> en la pestaña Map; no borra datos, solo cambia etiquetas y el nombre del export.</p>

<h4 class="subsection-title">Map profiles — ¿para qué sirve cada uno?</h4>
<div class="help-profiles">
  <article class="help-profile-card">
    <strong>Galaxy / sci-fi</strong>
    <p>Mapas estelares 4X: sistemas, imperios, hipervías, flotas, timeline histórica. Es el perfil por defecto.</p>
    <p class="help-profile-use"><em>Ideal para:</em> universos sci-fi, guerras galácticas, cronologías por año.</p>
  </article>
  <article class="help-profile-card">
    <strong>Fantasy world</strong>
    <p>Mismas mecánicas; la UI dice <em>Region</em>, <em>Controlled by</em>, <em>Armies</em>, <em>paths</em> en lugar de sistemas e imperios.</p>
    <p class="help-profile-use"><em>Ideal para:</em> mapas de continentes, reinos, rutas comerciales o militares.</p>
  </article>
  <article class="help-profile-card">
    <strong>Tabletop / D&amp;D</strong>
    <p>Vocabulario de mesa: <em>Location</em>, <em>Faction</em>, <em>Party</em>, POIs (taberna, dungeon…). Timeline = calendario de campaña.</p>
    <p class="help-profile-use"><em>Ideal para:</em> overworld de campaña, facciones, notas por ubicación, crónica de sesiones.</p>
  </article>
  <article class="help-profile-card">
    <strong>Adventure / unlock</strong>
    <p>Hitos con progresión: nodos bloqueados, requisitos, completados, encuentros y recompensas. Combina con <strong>Play mode</strong>.</p>
    <p class="help-profile-use"><em>Ideal para:</em> aventuras lineales o ramificadas, dungeon graphs, “completa A para ir a B”.</p>
  </article>
</div>

<h4 class="subsection-title">Progreso de aventura (cualquier perfil)</h4>
<p class="mode-hint">En la pestaña <strong>System</strong>, sección <strong>Adventure / progression</strong> (opcional por nodo):</p>
<ul class="help-bullets">
  <li><strong>Start node</strong> — visible y accesible al empezar en Play mode.</li>
  <li><strong>Locked</strong> — bloqueado hasta cumplir requisitos (niebla + 🔒 en el mapa).</li>
  <li><strong>Completed</strong> — hito superado (borde verde + ✓ en la etiqueta).</li>
  <li><strong>Unlock requires</strong> — ids de nodos separados por coma; todos deben estar <em>Completed</em>.</li>
  <li>Si está <em>Locked</em> sin ids: se desbloquea cuando un <strong>vecino conectado</strong> (ruta) está completado.</li>
  <li><strong>Encounter / Reward</strong> — texto libre (combate, puzzle, loot, lore).</li>
</ul>
<p class="mode-hint">Guarda con <strong>Save</strong> (nombre según perfil). Los datos van en el JSON del nodo bajo <code>adventure</code>.</p>

<h4 class="subsection-title">Calendario y año por defecto</h4>
<ul class="help-bullets">
  <li><strong>Map → Calendar</strong> o <strong>Timeline → Default year</strong> — mismo valor en ambos sitios.</li>
  <li>El <strong>default year</strong> se usa al crear eventos nuevos y como referencia de edad del líder.</li>
  <li><strong>Set view year to default</strong> — mueve el año de vista (arriba izquierda) al default.</li>
  <li>Al <strong>importar JSON</strong>, si el archivo trae <code>metadata.defaultYear</code> y/o <code>metadata.viewYear</code>, se aplican automáticamente.</li>
</ul>

<h4 class="subsection-title">Play mode y toggles del mapa</h4>
<ul class="help-bullets">
  <li><strong>Map → Play mode</strong> — simula la experiencia jugador: nodos locked no se pueden seleccionar; rutas hacia locked se ocultan.</li>
  <li>Desactiva Play mode para seguir editando como GM/diseñador.</li>
  <li><strong>Progreso</strong> (abajo izquierda) — muestra u oculta overlays de locked/completed en modo editor.</li>
  <li><strong>Iconos / Textos / Flotas</strong> — visibilidad de instalaciones, etiquetas y flotas/party en el canvas.</li>
  <li><strong>Año</strong> (arriba izquierda) — sigue aplicando la timeline; colonización, conquistas y eventos históricos conviven con el progreso de aventura.</li>
</ul>

<h4 class="subsection-title">Flujo recomendado — aventura por nodos</h4>
<ol class="help-steps">
  <li>Perfil <strong>Adventure / unlock</strong> (o D&amp;D si prefieres ese vocabulario).</li>
  <li>Coloca nodos y conéctalos con <strong>Shift + clic</strong> en dos nodos.</li>
  <li>Marca un nodo como <strong>Start node</strong> + <strong>Completed</strong> si ya empezaste la campaña ahí.</li>
  <li>En nodos siguientes: <strong>Locked</strong> + <strong>Unlock requires</strong> (ids) o solo <strong>Locked</strong> si dependen del vecino.</li>
  <li>Activa <strong>Play mode</strong> y prueba qué se ve y qué se puede clickear.</li>
  <li>Al superar un hito en mesa: marca <strong>Completed</strong> y guarda.</li>
</ol>

<h4 class="subsection-title">Otras pestañas (todas las plantillas)</h4>
<ul class="help-bullets">
  <li><strong>System</strong> — datos del nodo seleccionado: dueño, población, instalaciones, flotas, aventura.</li>
  <li><strong>Owners</strong> — facciones / reinos / imperios: color, nombre, líder (nombre, edad con el año, personalidad).</li>
  <li><strong>Timeline</strong> — eventos por año en el nodo seleccionado (colonización, cambio de dueño, flotas…).</li>
  <li><strong>Chronicle</strong> — todos los eventos del mapa; clic salta al año y selecciona sistema/ruta.</li>
  <li><strong>Routes</strong> — editar hipervía/ruta: tipo, nombre, abrir/cerrar por año.</li>
  <li><strong>Stats</strong> — resumen en vivo por facción (territorio, capital, ocupación…).</li>
</ul>

<h4 class="subsection-title">Atajos y controles</h4>
<dl class="help-list">
  <div><dt>Clic vacío</dt><dd>Añadir nodo — modo Place nodes</dd></div>
  <div><dt>Arrastrar</dt><dd>Mover fondo o todos los nodos — según Click mode</dd></div>
  <div><dt>Rueda / medio</dt><dd>Zoom / pan (medio o Space+arrastrar)</dd></div>
  <div><dt>Clic nodo</dt><dd>Seleccionar · pestaña System</dd></div>
  <div><dt>Shift + clic</dt><dd>Crear ruta entre dos nodos</dd></div>
  <div><dt>Clic ruta</dt><dd>Seleccionar · pestaña Routes</dd></div>
</dl>

<h4 class="subsection-title">Click modes (Map)</h4>
<ul class="help-bullets">
  <li><strong>Place nodes</strong> — añadir nodos en espacio vacío</li>
  <li><strong>Move background</strong> — arrastrar imagen de fondo</li>
  <li><strong>Move all nodes</strong> — mover todos los nodos a la vez</li>
</ul>

<h4 class="subsection-title">Export / import</h4>
<ul class="help-bullets">
  <li><strong>Export JSON</strong> — mapa completo (nodos, rutas, owners, <code>metadata.profile</code>, fondo).</li>
  <li><strong>Export PNG</strong> — captura la vista actual del canvas.</li>
  <li><strong>Import JSON</strong> — carga mapa; owners embebidos o los de localStorage.</li>
  <li>Nombre del archivo según perfil: <code>galaxy-map.json</code>, <code>world-map.json</code>, <code>campaign-map.json</code>, <code>adventure-map.json</code>.</li>
</ul>
`;

const HELP_EN = `
<h3 class="section-title">Quick guide</h3>
<p class="mode-hint">One engine for galaxy maps, fantasy worlds, tabletop campaigns, and node-based adventures. Pick a <strong>Map profile</strong> on the Map tab — it does not delete data; it only changes labels and the export filename.</p>

<h4 class="subsection-title">Map profiles — what each one is for</h4>
<div class="help-profiles">
  <article class="help-profile-card">
    <strong>Galaxy / sci-fi</strong>
    <p>4X star maps: systems, empires, hyperlanes, fleets, historical timeline. Default profile.</p>
    <p class="help-profile-use"><em>Best for:</em> sci-fi universes, galactic wars, year-by-year chronology.</p>
  </article>
  <article class="help-profile-card">
    <strong>Fantasy world</strong>
    <p>Same mechanics; UI says <em>Region</em>, <em>Controlled by</em>, <em>Armies</em>, <em>paths</em> instead of systems and empires.</p>
    <p class="help-profile-use"><em>Best for:</em> continent maps, kingdoms, trade or military routes.</p>
  </article>
  <article class="help-profile-card">
    <strong>Tabletop / D&amp;D</strong>
    <p>Table vocabulary: <em>Location</em>, <em>Faction</em>, <em>Party</em>, POIs (tavern, dungeon…). Timeline = campaign calendar.</p>
    <p class="help-profile-use"><em>Best for:</em> campaign overworlds, factions, location notes, session chronicle.</p>
  </article>
  <article class="help-profile-card">
    <strong>Adventure / unlock</strong>
    <p>Milestones with progression: locked nodes, requirements, completed flags, encounters and rewards. Use with <strong>Play mode</strong>.</p>
    <p class="help-profile-use"><em>Best for:</em> linear or branching adventures, dungeon graphs, “complete A to reach B”.</p>
  </article>
</div>

<h4 class="subsection-title">Adventure progression (any profile)</h4>
<p class="mode-hint">On the <strong>System</strong> tab, section <strong>Adventure / progression</strong> (optional per node):</p>
<ul class="help-bullets">
  <li><strong>Start node</strong> — visible and accessible when Play mode starts.</li>
  <li><strong>Locked</strong> — blocked until requirements are met (fog + 🔒 on the map).</li>
  <li><strong>Completed</strong> — milestone done (green ring + ✓ on the label).</li>
  <li><strong>Unlock requires</strong> — comma-separated node ids; all must be <em>Completed</em>.</li>
  <li>If <em>Locked</em> with no ids: unlocks when a connected <strong>neighbor</strong> (route) is completed.</li>
  <li><strong>Encounter / Reward</strong> — free text (combat, puzzle, loot, lore).</li>
</ul>
<p class="mode-hint">Save with <strong>Save</strong> (button label follows profile). Data is stored on the node JSON under <code>adventure</code>.</p>

<h4 class="subsection-title">Calendar &amp; default year</h4>
<ul class="help-bullets">
  <li><strong>Map → Calendar</strong> or <strong>Timeline → Default year</strong> — same value in both places.</li>
  <li><strong>Default year</strong> is used for new events and leader age reference.</li>
  <li><strong>Set view year to default</strong> — moves the view year (top-left) to the default.</li>
  <li>On <strong>JSON import</strong>, if the file includes <code>metadata.defaultYear</code> and/or <code>metadata.viewYear</code>, they are applied automatically.</li>
</ul>

<h4 class="subsection-title">Play mode and map toggles</h4>
<ul class="help-bullets">
  <li><strong>Map → Play mode</strong> — simulates the player view: locked nodes cannot be selected; routes to locked nodes are hidden.</li>
  <li>Turn off Play mode to keep editing as GM/designer.</li>
  <li><strong>Progreso / Progress</strong> (bottom-left) — show or hide locked/completed overlays while editing.</li>
  <li><strong>Icons / Labels / Fleets</strong> — toggle installations, names, and fleets/party on the canvas.</li>
  <li><strong>Year</strong> (top-left) — timeline still applies; colonization, conquests, and history coexist with adventure progress.</li>
</ul>

<h4 class="subsection-title">Recommended flow — node adventure</h4>
<ol class="help-steps">
  <li>Set profile <strong>Adventure / unlock</strong> (or D&amp;D for tabletop wording).</li>
  <li>Place nodes and connect them with <strong>Shift + click</strong> on two nodes.</li>
  <li>Mark one node as <strong>Start node</strong> + <strong>Completed</strong> if the campaign already began there.</li>
  <li>On later nodes: <strong>Locked</strong> + <strong>Unlock requires</strong> (ids), or only <strong>Locked</strong> if they depend on a neighbor.</li>
  <li>Enable <strong>Play mode</strong> and test what is visible and clickable.</li>
  <li>After a milestone at the table: mark <strong>Completed</strong> and save.</li>
</ol>

<h4 class="subsection-title">Other tabs (all profiles)</h4>
<ul class="help-bullets">
  <li><strong>System</strong> — selected node: owner, population, installations, fleets, adventure.</li>
  <li><strong>Owners</strong> — factions / kingdoms / empires: color, name, leader (name, age by view year, personality).</li>
  <li><strong>Timeline</strong> — per-year events on the selected node (colonized, owner change, fleets…).</li>
  <li><strong>Chronicle</strong> — all map events; click jumps to year and selects system/route.</li>
  <li><strong>Routes</strong> — edit lane/path: type, name, open/close by year.</li>
  <li><strong>Stats</strong> — live summary per faction (territory, capital, occupation…).</li>
</ul>

<h4 class="subsection-title">Shortcuts &amp; controls</h4>
<dl class="help-list">
  <div><dt>Empty click</dt><dd>Add node — Place nodes mode</dd></div>
  <div><dt>Drag</dt><dd>Move background or all nodes — per Click mode</dd></div>
  <div><dt>Wheel / middle</dt><dd>Zoom / pan (middle button or Space+drag)</dd></div>
  <div><dt>Click node</dt><dd>Select · System tab</dd></div>
  <div><dt>Shift + click</dt><dd>Create route between two nodes</dd></div>
  <div><dt>Click route</dt><dd>Select · Routes tab</dd></div>
</dl>

<h4 class="subsection-title">Click modes (Map)</h4>
<ul class="help-bullets">
  <li><strong>Place nodes</strong> — add nodes on empty space</li>
  <li><strong>Move background</strong> — drag background image</li>
  <li><strong>Move all nodes</strong> — drag every node together</li>
</ul>

<h4 class="subsection-title">Export / import</h4>
<ul class="help-bullets">
  <li><strong>Export JSON</strong> — full map (nodes, routes, owners, <code>metadata.profile</code>, background).</li>
  <li><strong>Export PNG</strong> — captures the current canvas view.</li>
  <li><strong>Import JSON</strong> — load map; embedded owners or localStorage defaults.</li>
  <li>Filename by profile: <code>galaxy-map.json</code>, <code>world-map.json</code>, <code>campaign-map.json</code>, <code>adventure-map.json</code>.</li>
</ul>
`;

export function getHelpHtml(lang: Locale): string {
  return lang === "en" ? HELP_EN : HELP_ES;
}
