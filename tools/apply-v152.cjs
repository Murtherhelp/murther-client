'use strict';
/* v1.52.0: the menu pass — descriptions, feature-row cards, movable categories.
 * Every edit is anchored on an exact string that must occur EXACTLY ONCE, so a concurrent edit
 * from another Freebuff tab aborts the whole run instead of half-applying. */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'murther.user.js');
let src = fs.readFileSync(FILE, 'utf8');
const applied = [];

function sub(label, anchor, replacement) {
  const n = src.split(anchor).length - 1;
  if (n !== 1) throw new Error('[' + label + '] anchor matched ' + n + ' times (need exactly 1)');
  src = src.replace(anchor, replacement);
  applied.push(label);
}

/* ------------------------------------------------------------ names must be free */
['mxLayout', 'mxMenuOrder', 'mxPaneHost', 'mxSectionClosed', 'mxSectionSetClosed', 'mxPersistOrder',
 'mxReorderDom', 'mxWireSectionDrag', 'mxClearDragOver', 'MX_SECTION_COLORS', 'mxSectionColorVar',
 'mxDragSec', '__mxMenuCheck'].forEach(function (n) {
  const c = src.split(n).length - 1;
  if (c !== 0) throw new Error('name already present in the file: ' + n + ' (' + c + 'x)');
});

/* ------------------------------------------------------------ 1. version + history */
sub('version', '// @version      1.51.0', '// @version      1.52.0');

sub('history',
`// axes, and the tracks plus every count/chip gap.
//
// ---------------------------------------------------------------------------`,
`// axes, and the tracks plus every count/chip gap.
//
// v1.52.0: the menu pass on the three editor panes. The description that only Themes had now
// opens Settings and Hotkeys too, above the search bar. Every feature row is a CARD — a tinted
// header strip per category plus a bordered row carrying that category's own colour as a 2px
// accent — because "which of these am I changing" was unanswerable against a flat list of rows
// on one background; all three row shapes are covered (Settings .mx-set-row, Hotkeys .mx-kb,
// Themes .mx-trow) and the styling is scoped to a section's own body, so a row that lives
// inside a note card does not become a card inside a card. And a category is MOVABLE: the grip
// the stylesheet reserved (mx-tsec-grip / .dragging / .drag-over) is finally wired, HTML5 drag
// live-reorders a CLOSED category among the closed ones exactly like an open one, the order is
// written only on dragend (an interrupted drag can never persist half an arrangement), sorting
// is restricted to siblings so a drop in Settings cannot reach a category in Hotkeys, and
// dragging is refused while a search filter is active — a filtered list holds only the matches,
// so saving it would silently drop every hidden category's position. The arrangement is
// store-backed now: order AND open/closed live in S.menuLayout, ride the Settings backup group
// (the old open/closed flag lived only in localStorage, which is why no backup ever carried
// it), survive every pane rebuild (search keystroke, reset, import, native-panel flip), and are
// migrated once so nothing already collapsed re-opens itself. One real bug fell out of the
// keys: the Hotkeys "Game keybinds" section keyed itself on the live bind count, so its
// remembered open/closed state reset whenever the game's bind list changed.
//
// ---------------------------------------------------------------------------`);

/* ------------------------------------------------------------ 2. CSS */
sub('css-section',
`    '.mx-tsec{padding-bottom:8px}',`,
`    '.mx-tsec{padding-bottom:8px;border-radius:10px}',`);

sub('css-head',
`    '.mx-tsec-head{display:flex;align-items:center;gap:8px;cursor:pointer;user-select:none;padding:4px 0}',`,
`    /* v1.52.0: the header is a STRIP tinted with the category's own colour (--mx-feature-color,
     * set per section from the client's palette), so a pane reads as colour-coded groups. */
    '.mx-tsec-head{display:flex;align-items:center;gap:8px;cursor:pointer;user-select:none;padding:6px 9px;border-radius:8px;background:linear-gradient(90deg,color-mix(in srgb,var(--mx-feature-color,var(--mx-accent)) 16%,transparent),transparent 72%);transition:background .15s}',
    '.mx-tsec-head:hover{background:linear-gradient(90deg,color-mix(in srgb,var(--mx-feature-color,var(--mx-accent)) 26%,transparent),transparent 72%)}',`);

sub('css-grip',
`    '.mx-tsec-grip{font-size:13px;line-height:1;color:var(--mx-dim);cursor:grab;letter-spacing:-2px;padding:2px 3px;border-radius:4px;opacity:.8}',`,
`    '.mx-tsec-grip{margin-left:auto;flex:0 0 auto;font-size:13px;line-height:1;color:var(--mx-dim);cursor:grab;letter-spacing:-2px;padding:2px 4px;border-radius:4px;opacity:.75}',
    '.mx-tsec-grip-off{opacity:.28;cursor:default}',`);

sub('css-section-gap',
`    '.mx-tsec+.mx-tsec{margin-top:18px}',`,
`    '.mx-tsec+.mx-tsec{margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,.06)}',`);

sub('css-cards',
`    '.mx-trow:last-child{border-bottom:none}',`,
`    '.mx-trow:last-child{border-bottom:none}',
    /* v1.52.0: every feature row is a CARD. Scoped to a section's own body on purpose: the note
     * cards (Key health, WS hook) and the pane descriptions hold .mx-set-row children of their
     * own, and those are already a surface — a card inside a card is not a feature. */
    '.mx-tsec-body > .mx-set-row,.mx-tsec-body > .mx-kb,.mx-tsec-body > .mx-trow{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);border-left:2px solid var(--mx-feature-color,var(--mx-accent));border-radius:8px;padding:8px 10px;margin:0 0 6px;transition:background .15s,border-color .15s}',
    '.mx-tsec-body > .mx-set-row:hover,.mx-tsec-body > .mx-kb:hover,.mx-tsec-body > .mx-trow:hover{background:rgba(255,255,255,.06)}',
    '.mx-tsec-body > *:last-child{margin-bottom:0}',`);

/* ------------------------------------------------------------ 3. the layout module */
sub('layout-module',
`  // collapsible section with a burger (three-line) handle; remembers open/closed per pane
  function buildCollapsibleSection(host, title, pane, key, count, forceOpen, defaultClosed) {
    var closed = false;
    if (!forceOpen) {
      var st = {};
      try { st = JSON.parse(localStorage.getItem(LS_SECTION_STATE) || '{}'); } catch (e) {}
      var flag = st[pane] ? st[pane][key] : undefined;
      // defaultClosed sections (e.g. Quick chat) start COLLAPSED; every other
      // section starts open. A stored true (user closed it) or false (user
      // opened it) always wins over the default.
      closed = defaultClosed ? flag !== false : flag === true;
    }
    var sec = el('div', 'mx-tsec' + (closed ? ' closed' : ''), host);
    var head = el('div', 'mx-tsec-head', sec);
    el('span', 'mx-tsec-chev', head);
    txt(el('span', 'mx-tsec-title', head), title + (typeof count === 'number' ? ' \u00b7 ' + count : ''));
    var body = el('div', 'mx-tsec-body', sec);
    on(head, 'click', function () {
      sec.classList.toggle('closed');
      try {
        var st2 = JSON.parse(localStorage.getItem(LS_SECTION_STATE) || '{}');
        st2[pane] = st2[pane] || {};
        st2[pane][key] = sec.classList.contains('closed');
        localStorage.setItem(LS_SECTION_STATE, JSON.stringify(st2));
      } catch (e2) {}
    });
    return sec;
  }`,
`  /* ---------- v1.52.0: the MENU LAYOUT (category order + open/closed) ----------
   * Both halves of "how my menu is arranged" live in the settings STORE, not in a localStorage
   * key of their own, because the store is what a Backup carries: the order of the categories
   * and which of them are folded are as much a user setting as an accent colour, and the old
   * arrangement (LS_SECTION_STATE) was the one thing a backup could never restore.
   * mxLayout() keeps the shape honest, every reader is defensive (a hand-edited or older file
   * can never break the menu), and the order is applied by mxReorderDom() from each pane's own
   * builder — so a saved arrangement survives every rebuild, which happens on a search
   * keystroke, a reset, an import and a native-panel flip. */

  /* A category's own accent, from the palette the client already ships (--mx-feature-*). The
   * section sets --mx-feature-color on itself, and its header strip and its row cards inherit
   * it, so a pane reads as colour-coded groups instead of one flat list. */
  var MX_SECTION_COLORS = {
    settings: {
      appearance: 'appearance', camera: 'camera', graphics: 'graphics', visuals: 'hud',
      gameplay: 'gameplay', indicators: 'indicators', perf: 'graphics', crosshair: 'indicators',
      panels: 'hud', streamer: 'chat', net: 'servers', devtools: 'safety'
    },
    themes: { interface: 'appearance', hud: 'hud', world: 'graphics', cells: 'hud' },
    hotkeys: {
      'Window & HUD keys': 'hud', 'Client features': 'indicators', 'Indicators & zoom': 'indicators',
      'Game display & match': 'gameplay', 'Servers & helpers': 'servers',
      'Gameplay keybinds (game-owned)': 'gameplay', 'Game keybinds': 'gameplay', 'Quick chat': 'chat'
    }
  };
  function mxSectionColorVar(pane, key) {
    var m = MX_SECTION_COLORS[pane];
    var g = m ? (m[key] || m[String(key).replace(/\\s*\\(\\d+\\)$/, '')]) : '';
    return g ? 'var(--mx-feature-' + g + ')' : 'var(--mx-accent)';
  }

  function mxLayout() {
    if (!S.menuLayout || typeof S.menuLayout !== 'object') S.menuLayout = { order: {}, closed: {} };
    if (!S.menuLayout.order || typeof S.menuLayout.order !== 'object') S.menuLayout.order = {};
    if (!S.menuLayout.closed || typeof S.menuLayout.closed !== 'object') S.menuLayout.closed = {};
    return S.menuLayout;
  }
  function mxMenuOrder(pane) {
    var a = mxLayout().order[pane];
    return Array.isArray(a) ? a.slice() : [];
  }
  /* The pane a section belongs to is ON the section (data-mx-pane), so this reaches the host of
   * a pane whose body is nested (Themes and Hotkeys build into a .mx-theme-body) — and it is the
   * same reader the console handle uses. */
  function mxPaneHost(pane) {
    try {
      var s = $('.mx-tsec[data-mx-pane="' + pane + '"]');
      return s ? s.parentNode : null;
    } catch (e) { return null; }
  }
  function mxSectionClosed(pane, key, defaultClosed) {
    var st = mxLayout().closed[pane];
    var flag = st && typeof st === 'object' ? st[key] : undefined;
    if (flag === undefined) return !!defaultClosed;   // a section this file has never seen
    // defaultClosed sections (e.g. Quick chat) start COLLAPSED; every other section starts open.
    // A stored true (the user closed it) or false (the user opened it) always wins.
    return defaultClosed ? flag !== false : flag === true;
  }
  function mxSectionSetClosed(pane, key, isClosed) {
    var L = mxLayout();
    L.closed[pane] = L.closed[pane] || {};
    L.closed[pane][key] = !!isClosed;
    save();
  }
  /* The order as the user left it in the DOM — written on a drop (and by __murther.menuMove),
   * read back on every rebuild. */
  function mxPersistOrder(host, pane) {
    var keys = $all(':scope > .mx-tsec', host)
      .map(function (s) { return String(s.getAttribute('data-mx-key') || ''); })
      .filter(function (k) { return !!k; });
    if (!keys.length) return [];
    mxLayout().order[pane] = keys;
    save();
    return keys;
  }
  /* Apply the saved order to a freshly built pane. A stable sort by saved position: sections the
   * file has never seen (the "no features match" placeholder, a header whose key carries a count)
   * sort to the end in the order they were built — never dropped, never shuffled at random. */
  function mxReorderDom(host, pane) {
    if (!host) return null;
    var secs = $all(':scope > .mx-tsec', host);
    if (secs.length < 2) return null;
    var saved = mxMenuOrder(pane);
    function pos(s) {
      var k = String(s.getAttribute('data-mx-key') || '');
      var i = saved.indexOf(k);
      return i === -1 ? saved.length : i;
    }
    secs.slice().sort(function (a, b) { return pos(a) - pos(b); })
      .forEach(function (s) { host.appendChild(s); });   // appendChild MOVES the existing node
    return mxMenuOrder(pane);
  }
  function mxClearDragOver(host) {
    if (!host) return;
    $all('.mx-tsec.drag-over', host).forEach(function (s) { s.classList.remove('drag-over'); });
  }
  /* ---------- v1.52.0: drag a category by its grip ----------
   * Native HTML5 drag (the client is Chromium, and so is every browser the script targets),
   * live-reordering on dragover so the drop point is always visible, and the ARRANGEMENT IS
   * WRITTEN ON DRAGEND — never during the drag, so an interrupted drag cannot leave half an
   * order saved. Sorting is restricted to siblings of the dragged section, which is what keeps a
   * drop in Settings from reaching a category in Hotkeys. */
  var mxDragSec = null;
  function mxWireSectionDrag(sec, grip, pane, enabled) {
    /* the header toggles collapse on click; the grip must never do both, whatever mode it is in */
    on(grip, 'mousedown', function (e) { e.stopPropagation(); });
    on(grip, 'click', function (e) { e.stopPropagation(); });
    if (!enabled) {
      /* A search filter is active: the pane holds only the MATCHES, so saving an order from it
       * would silently drop every hidden category's position. */
      grip.setAttribute('draggable', 'false');
      grip.classList.add('mx-tsec-grip-off');
      grip.title = 'Clear the search box to drag categories around';
      return;
    }
    try { grip.style.webkitUserDrag = 'element'; } catch (eW) {}
    on(grip, 'dragstart', function (e) {
      mxDragSec = sec;
      sec.classList.add('dragging');
      try {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(sec.getAttribute('data-mx-key') || ''));
      } catch (eD) {}
      try { e.dataTransfer.setDragImage(sec, 24, 14); } catch (eD2) {}
    });
    on(sec, 'dragover', function (e) {
      if (!mxDragSec || mxDragSec === sec || mxDragSec.parentNode !== sec.parentNode) return;
      e.preventDefault();                       // without this the browser refuses the drop
      try { e.dataTransfer.dropEffect = 'move'; } catch (eD3) {}
      var r = sec.getBoundingClientRect();
      var after = (e.clientY - r.top) > (r.height / 2);
      mxClearDragOver(sec.parentNode);
      sec.classList.add('drag-over');
      try { sec.parentNode.insertBefore(mxDragSec, after ? sec.nextSibling : sec); } catch (eD4) {}
    });
    on(sec, 'drop', function (e) { e.preventDefault(); });
    on(grip, 'dragend', function () {
      sec.classList.remove('dragging');
      var h = sec.parentNode;
      mxDragSec = null;
      if (!h) return;
      mxClearDragOver(h);
      var keys = mxPersistOrder(h, pane);
      if (keys.length) toast('Category order saved');
    });
  }

  // collapsible section with a burger (three-line) handle; remembers open/closed per pane
  function buildCollapsibleSection(host, title, pane, key, count, forceOpen, defaultClosed) {
    var closed = false;
    if (!forceOpen) closed = mxSectionClosed(pane, key, defaultClosed);
    var sec = el('div', 'mx-tsec' + (closed ? ' closed' : ''), host);
    /* v1.52.0: pane + key live ON the element, which is what makes the arrangement readable
     * from the DOM — one reader for the drag, for mxReorderDom and for the console handle. */
    sec.setAttribute('data-mx-pane', pane);
    sec.setAttribute('data-mx-key', key);
    sec.style.setProperty('--mx-feature-color', mxSectionColorVar(pane, key));
    var head = el('div', 'mx-tsec-head', sec);
    el('span', 'mx-tsec-chev', head);
    txt(el('span', 'mx-tsec-title', head), title + (typeof count === 'number' ? ' \u00b7 ' + count : ''));
    var grip = el('span', 'mx-tsec-grip', head);
    txt(grip, '\u2261');
    grip.setAttribute('draggable', 'true');
    grip.title = 'Drag to move this category \u2014 the arrangement is saved in the Settings backup group';
    var body = el('div', 'mx-tsec-body', sec);
    on(head, 'click', function () {
      sec.classList.toggle('closed');
      mxSectionSetClosed(pane, key, sec.classList.contains('closed'));
    });
    mxWireSectionDrag(sec, grip, pane, !forceOpen);
    return sec;
  }`);

/* ------------------------------------------------------------ 4. the three descriptions */
sub('intro-settings',
`    var search = el('input', 'mx-settings-search', host);`,
`    /* v1.52.0: the pane describes itself, ABOVE the search bar (only Themes did) */
    var intro = el('div', 'mx-kb-note', host);
    intro.textContent = 'Every client setting lives here, grouped by what it affects. The bar below filters every group at once. Drag the \u2261 handle on a group header to move that group anywhere in this list \u2014 even a collapsed one \u2014 and the arrangement is saved in the Settings backup group.';
    var search = el('input', 'mx-settings-search', host);`);

sub('intro-hotkeys',
`    host.innerHTML = '';
    var search = el('input', 'mx-theme-search', host);`,
`    host.innerHTML = '';
    /* v1.52.0: the pane describes itself, ABOVE the search bar (only Themes did). The detailed
     * binding note stays below the bar: they answer different questions - what this pane is, and
     * how binding works - so neither is a copy of the other. */
    var intro = el('div', 'mx-kb-note', host);
    intro.textContent = 'Every key the client can bind lives here, in categories: client features, the game\u2019s own gameplay controls and the quick-chat macros. Drag the \u2261 handle on a category header to move that category anywhere in this list \u2014 even a collapsed one \u2014 and the arrangement is saved in the Settings backup group.';
    var search = el('input', 'mx-theme-search', host);`);

sub('intro-themes',
`    intro.textContent = 'Every value below is saved in the Themes backup group. Themes always apply \\u2014 there is no master switch to forget about anymore; a level of 0 simply means \\u201coff\\u201d for that one row.';`,
`    intro.textContent = 'Every value below is saved in the Themes backup group. Themes always apply \\u2014 there is no master switch to forget about anymore; a level of 0 simply means \\u201coff\\u201d for that one row. Drag the \\u2261 handle on a category header to move that category anywhere in this list \\u2014 even a collapsed one \\u2014 and the arrangement is saved in the Settings backup group.';`);

/* ------------------------------------------------------------ 5. apply the order on every rebuild */
sub('order-themes',
`      if (!body.children.length) {
        var empty = el('div', 'mx-tsec', body);
        txt(el('div', 'mx-hint', empty), 'No features match');
      }
    }`,
`      if (!body.children.length) {
        var empty = el('div', 'mx-tsec', body);
        txt(el('div', 'mx-hint', empty), 'No features match');
      }
      mxReorderDom(body, 'themes');   // v1.52.0: the saved arrangement wins on every rebuild
    }`);

sub('order-hotkeys',
`          on(inp, 'keydown', function (ev) { ev.stopPropagation(); });
        });
      }

    }
    function refreshAll() {`,
`          on(inp, 'keydown', function (ev) { ev.stopPropagation(); });
        });
      }

      mxReorderDom(body, 'hotkeys');   // v1.52.0: the saved arrangement wins on every rebuild
    }
    function refreshAll() {`);

sub('order-settings',
`    // row counts on the section headers (same style as Hotkeys/Themes)
    $all('.mx-tsec', host).forEach(function (sec) {
      var n = sec.querySelector('.mx-tsec-body').children.length;
      var ti = sec.querySelector('.mx-tsec-title');
      if (n && ti) ti.textContent = ti.textContent.replace(/\\s*\u00b7\\s*\\d+$/, '') + ' \u00b7 ' + n;
    });
  }`,
`    // row counts on the section headers (same style as Hotkeys/Themes)
    $all('.mx-tsec', host).forEach(function (sec) {
      var n = sec.querySelector('.mx-tsec-body').children.length;
      var ti = sec.querySelector('.mx-tsec-title');
      if (n && ti) ti.textContent = ti.textContent.replace(/\\s*\u00b7\\s*\\d+$/, '') + ' \u00b7 ' + n;
    });
    /* v1.52.0: LAST, after every section exists and its header has its count - the saved
     * arrangement is the final word on the order of this pane. */
    mxReorderDom(host, 'settings');
  }`);

/* ------------------------------------------------------------ 6. the unstable section key */
sub('keybinds-key',
`        var gsec = buildCollapsibleSection(body, 'Game keybinds', 'hotkeys', 'Game keybinds (' + glist.length + ')', glist.length, !!q, false);`,
`        /* v1.52.0: the key used to carry the live bind count, so the section's remembered
         * open/closed state - and now its saved position - reset itself the moment the game
         * exposed a different number of binds. The count stays in the TITLE, not in the key. */
        var gsec = buildCollapsibleSection(body, 'Game keybinds', 'hotkeys', 'Game keybinds', glist.length, !!q, false);`);

/* ------------------------------------------------------------ 7. the store + the backup */
sub('defaults-layout',
`    looks: []`,
`    /* v1.52.0: the MENU ARRANGEMENT - the order of the collapsible categories in Settings,
     * Hotkeys and Themes, and which of them the user folded. It lives in the settings store
     * rather than a localStorage key of its own so the Backup carries it; the Settings group
     * exports and resets it, and mxLayout() stays defensive against a hand-edited file. */
    menuLayout: { order: {}, closed: {} },
    looks: []`);

sub('backup-store',
`      store: ['accent', 'accent2', 'panelOpacity', 'reduceEffects', 'hideAds', 'notifications', 'chatAnimations', 'lobbyHud', 'lobbyChat', 'lbGlow', 'lbGlowTeam', 'devguard', 'crosshair', 'crosshairColor', 'crosshairSize', 'crosshairDot', 'crosshairDotColor', 'crosshairDotSize', 'crosshairDotCoords', 'splitIndicator', 'menuScale', 'renderer', 'panels', 'game', 'perf'],
      desc: 'Everything on the Settings tab: accent colors, panel opacity and visibility, notifications and leaderboard glow, crosshair, ads, renderer, menu size, the native/graphics bridges and performance (FPS cap, auto-tune).' },`,
`      store: ['accent', 'accent2', 'panelOpacity', 'reduceEffects', 'hideAds', 'notifications', 'chatAnimations', 'lobbyHud', 'lobbyChat', 'lbGlow', 'lbGlowTeam', 'devguard', 'crosshair', 'crosshairColor', 'crosshairSize', 'crosshairDot', 'crosshairDotColor', 'crosshairDotSize', 'crosshairDotCoords', 'splitIndicator', 'menuScale', 'renderer', 'panels', 'game', 'perf', 'menuLayout'],
      desc: 'Everything on the Settings tab: accent colors, panel opacity and visibility, notifications and leaderboard glow, crosshair, ads, renderer, menu size, the native/graphics bridges and performance (FPS cap, auto-tune) \\u2014 plus the menu arrangement (the order of the categories in Settings, Hotkeys and Themes and which of them are folded).' },`);

/* ------------------------------------------------------------ 8. the one-time migration */
sub('layout-migrate',
`  var S = load();
  function load() {`,
`  var S = load();
  /* v1.52.0: the arrangement lives in S.menuLayout now, but an install predating it kept
   * open/closed ONLY in localStorage (LS_SECTION_STATE), which no backup could ever carry - so
   * import it once, before anything reads it. Nothing already collapsed re-opens itself, and the
   * old key is deliberately left in place: this is a move, not a delete. */
  (function mxLayoutMigrate() {
    try {
      if (!S.menuLayout || typeof S.menuLayout !== 'object') return;
      var have = S.menuLayout.closed;
      if (have && typeof have === 'object' && Object.keys(have).length) return;   // already migrated
      var moved = {}, n = 0;
      function take(obj) {
        if (!obj || typeof obj !== 'object') return;
        Object.keys(obj).forEach(function (pane) {
          var p = obj[pane];
          if (!p || typeof p !== 'object') return;
          Object.keys(p).forEach(function (k) {
            if (typeof p[k] !== 'boolean') return;
            moved[pane] = moved[pane] || {};
            moved[pane][k] = p[k];
            n++;
          });
        });
      }
      try { take(JSON.parse(localStorage.getItem(LS_SECTION_STATE) || 'null')); } catch (e1) {}
      try { take(JSON.parse(localStorage.getItem(LS_SECTION_ORDER) || 'null')); } catch (e2) {}
      if (!n) return;
      S.menuLayout.closed = moved;
      try { localStorage.setItem(LS_SETTINGS, JSON.stringify(S)); } catch (e3) {}
    } catch (e) {}
  })();
  function load() {`);

/* ------------------------------------------------------------ 9. console handles */
sub('console-menu',
`    hookPick: function () { return { other: mxHookPickState(), murther: !!UI.kbListening }; },`,
`    hookPick: function () { return { other: mxHookPickState(), murther: !!UI.kbListening }; },
    /* v1.52.0: the menu arrangement, readable and movable from the console. menuMove() is the
     * exact path a drop ends on (order written to the store, DOM already moved), so a layout can
     * be reproduced or repaired without a mouse. */
    menu: function () {
      var d = {
        order: JSON.parse(JSON.stringify(mxLayout().order || {})),
        closed: JSON.parse(JSON.stringify(mxLayout().closed || {}))
      };
      try { console.log('[murther] menu layout', d); } catch (e) {}
      return d;
    },
    menuMove: function (pane, key, beforeKey) {
      try {
        var host = mxPaneHost(pane);
        if (!host) return null;
        var sec = $('.mx-tsec[data-mx-key="' + key + '"]', host);
        if (!sec) return null;
        var ref = beforeKey ? $('.mx-tsec[data-mx-key="' + beforeKey + '"]', host) : null;
        if (ref && ref !== sec) host.insertBefore(sec, ref); else host.appendChild(sec);
        var keys = mxPersistOrder(host, pane);
        try { console.log('[murther] menu order', pane, keys); } catch (e2) {}
        return keys;
      } catch (e3) { return null; }
    },`);

fs.writeFileSync(FILE, src);
console.log('applied ' + applied.length + ' edits:\n  ' + applied.join('\n  '));
