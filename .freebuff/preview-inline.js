// ==UserScript==
// @name         Murther — gota.io client
// @namespace    murther.gota
// @version      1.14.0
// @description  High-performance UI/UX replacement client for play.gota.io. Dark purple theme, full HUD reskin that hosts the LIVE native panels (stats ID/Mass/Score/Cells top-center, connection FPS/ping/server above the chat, leaderboard top-right, minimap, party, chat) so everything stays synced with the game. Native-synced server list (players/bots). Client-level hotkeys (searchable) that complement the game's own keybinds without touching game internals. The Hotkeys tab also lists every gameplay bind (rebinding hands off to the game's own trusted editor), quick-chat macros (Alt+1..0) and a split-indicator helper.
// @author       Murther
// @match        https://play.gota.io/*
// @run-at       document-start
// @grant        none
// @noframes
// ==/UserScript==

(function () {
  'use strict';
  if (window.top !== window.self) return;

  /* ============================== helpers ============================== */
  var DOC = document;
  function $(sel, root) { return (root || DOC).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || DOC).querySelectorAll(sel)); }
  function el(tag, cls, parent) {
    var n = DOC.createElement(tag);
    if (cls) n.className = cls;
    if (parent) parent.appendChild(n);
    return n;
  }
  function txt(n, s) { if (n) n.textContent = s; return n; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function on(node, ev, fn, opt) { if (node) node.addEventListener(ev, fn, opt); }

  var LS_SETTINGS = 'murther_settings_v1';
  var LS_BACKUP_SEL = 'murther_backup_selection_v1';
  var LS_SECTION_STATE = 'murther_section_state_v1';

  // Client version, always synced with the @version header above: GM_info in
  // Tampermonkey, header parse as fallback (inlined preview builds).
  var VERSION = (function () {
    try { if (typeof GM_info !== 'undefined' && GM_info.script && GM_info.script.version) return String(GM_info.script.version); } catch (e) {}
    try {
      var scripts = document.getElementsByTagName('script');
      for (var i = 0; i < scripts.length; i++) {
        var m = /@version\s+([0-9][0-9.]*)/.exec(scripts[i].textContent || '');
        if (m) return m[1];
      }
    } catch (e) {}
    return '';
  })();

  var DEFAULTS = {
    accent: '#a855f7',
    accent2: '#c084fc',
    panelOpacity: 0.72,
    menuScale: 0.94,
    renderer: 'webgl',
    reduceEffects: false,
    hideAds: true,
    crosshair: false,
    crosshairColor: '#ffffff',
    crosshairSize: 24,
    splitIndicator: false,
    macros: ['Need backup!', 'Need a teammate!', 'Pop him!', 'We need to run!', 'Tricksplit!', 'Lets bait!', 'Split into me!', 'Feed me!', 'Tank the virus!', 'Roger that!'],
    panels: { topbar: true, score: true, leaderboard: true, minimap: true, chat: true, party: true },
    customTheme: false,
    game: {
      // --- native-bridged (game's own controls in #main-options) ---
      showNames: true, showSkins: true, showMass: true,
      hideFood: false,          // false = pellets visible ("Show pellets")
      showBorder: true,
      autoZoom: false,          // experimental: steers the game's own zoom
      zoomSpeed: 100,           // % wheel sensitivity (client-side scaling)
      cameraDelay: 50,          // % (native slider when present)
      quality: 'auto',          // auto | low | medium | high | retina
      antialias: 'default',     // default | on | off (applies after reload)
      // --- client-drawn indicators (fx overlay) ---
      cursorLine: false,
      cursorLineSize: 3,
      cursorLineColor: '',      // '' = follow the accent color
      lsArrows: false,
      lsArrowColor: '#a855f7',
      smoothCells: true,        // native "smooth movements" when present
      hideTag: false,           // native "hide tag" when present
      autoHideMass: false,      // native "auto hide mass" when present
      autoHideNames: false      // native "auto hide names" when present
    },
    gameplay: {
      // Ryuten-inspired input macros. Splits feed the game's own Space binding as a
      // rapid burst (donutextension-proven approach); feed holds the eject key down
      // on a fixed interval until released. Everything ships unbound/disabled.
      feedInterval: 40,         // ms between synthetic eject ticks (~2 game ticks)
      feedKey: 87,              // keyCode the game ejects with (KeyW)
      splitBurstDelay: 3,       // ms between the presses of a split burst
      mouseFeed: false,         // LMB hold = macro feed (while playing only)
      mouseSplit2: false,       // RMB = 2x split
      mouseSplit3: false,       // MB4 = 3x split
      mouseSplit4: false        // MB5 = 4x split
    },
    perf: {
      fpsCap: 0,                // 0 = uncapped; otherwise max frames per second (30-240)
      autoTune: true            // auto-enable Reduce effects on sustained low FPS
    },
    quick: { q1: '', q2: '', q3: '', q4: '', q5: '', q6: '', q7: '', q8: '', q9: '' },
    hud: {
      lbOpacity: 1, lbBlur: 0, chatOpacity: 1, chatBlur: 1,
      mmOpacity: 1, mmBlur: 2, lbHi: '#FFAAAA', lbHiParty: '#FFFF00', partyLeader: '#00FFFF'
    },
    theme: {
      bg: '#121212', bgOpacity: 1, border: '#FF0000', borderSize: 32,
      gridShow: false, gridStyle: 'none', gridColor: '#FF0000', gridOpacity: 0.8,
      gridThickness: 1, gridCols: 4, gridRows: 4, gridLabels: false,
      gridLabelFont: 'Verdana', gridLabelColor: '#FFFFFF', gridLabelSize: 18,
      pastel: false, pastelIntensity: 50, pastelTarget: 'All',
      tracers: false, tracerOpacity: 50, tracerColor: '#FFFFFF', tracerThickness: 2
    },
    keys: {
      menu: 'Escape',
      topbar: 'KeyG',
      score: 'KeyH',
      leaderboard: 'KeyI',
      minimap: 'KeyM',
      chat: 'KeyC',
      party: '',          // unbound by default (native-friendly)
      allPanels: '',
      crosshair: '',
      reduceEffects: '',
      customTheme: '',
      hideAds: '',
      cycleRegion: '',
      copyId: '',
      cursorLine: '',
      lsArrows: '',
      autoZoom: '',
      feed: '',                 // hold: macro eject
      split2: '', split3: '', split4: '', split6: '',
      zoomReset: '',            // reset the game zoom to neutral (synthetic wheel)
      fpsCap: ''                // cycle FPS cap
    }
  };

  var S = load();
  function load() {
    try {
      var raw = localStorage.getItem(LS_SETTINGS);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULTS));
      var obj = JSON.parse(raw);
      var out = JSON.parse(JSON.stringify(DEFAULTS));
      Object.keys(out).forEach(function (k) {
        if (obj[k] !== undefined) {
          if (typeof out[k] === 'object' && out[k] !== null && !Array.isArray(out[k])) {
            Object.keys(out[k]).forEach(function (k2) { if (obj[k] && obj[k][k2] !== undefined) out[k][k2] = obj[k][k2]; });
          } else out[k] = obj[k];
        }
      });
      // upgrade: panels toggles became HUD opacity sliders in 1.5.0 - carry old flags once
      if (obj.panels && !obj.hud) {
        if (obj.panels.leaderboard === false) out.hud.lbOpacity = 0;
        if (obj.panels.chat === false) out.hud.chatOpacity = 0;
        if (obj.panels.minimap === false) out.hud.mmOpacity = 0;
      }
      // upgrade 1.6.0: keybinds must carry over exactly as the user saved them —
      // including "" (unbound) — so the DEFAULTS merge above is bypassed for keys.
      if (obj.keys) out.keys = Object.assign({}, out.keys, obj.keys);
      return out;
    } catch (e) { return JSON.parse(JSON.stringify(DEFAULTS)); }
  }
  function save() { try { localStorage.setItem(LS_SETTINGS, JSON.stringify(S)); } catch (e) {} }

  /* ---------- renderer selection (WebGL / WebGPU) ----------
   * The game renders with PixiJS 8 (Game Files/BwavBt3c.js), whose
   * autoDetectRenderer probes renderers in the order webgl -> webgpu -> canvas
   * and picks the first supported one — so WebGL is the natural default.
   * Murther steers that choice at document-start:
   * - "webgl" (default): the page is left untouched.
   * - "webgpu": Pixi's WebGL support probe (the first webgl/webgl2 context
   *   request of the page load) is answered with null until the renderer is
   *   resolved, so autoDetectRenderer falls through to the WebGPU renderer.
   *   The gate self-opens once the renderer is captured (or after 8s) so any
   *   later WebGL canvases on the page keep working.
   * The live renderer is captured through the bundle's own dev hooks
   * (__PIXI_RENDERER_INIT__ / __PIXI_APP_INIT__) and surfaced in Settings.
   * NOTE: switching renderers applies on the next page load.
   */
  var rendererGateDeadline = 0;
  function installRendererHook() {
    if (S.renderer !== 'webgpu') return;      // webgl (default): never patch anything
    if (!navigator.gpu) return;               // WebGPU unsupported: keep WebGL rather than degrade to 2D canvas
    try {
      var proto = HTMLCanvasElement.prototype;
      if (proto.__murtherGetContext) return;
      proto.__murtherGetContext = proto.getContext;
      rendererGateDeadline = Date.now() + 8000;
      proto.getContext = function (type) {
        var t = String(type || '');
        var resolved = !!window.__murtherRenderer || Date.now() > rendererGateDeadline;
        if (t.indexOf('webgl') === 0 && !resolved) return null;
        return proto.__murtherGetContext.apply(this, arguments);
      };
    } catch (e) {}
  }
  function currentRendererType() {
    try {
      var r = window.__murtherRenderer;
      if (r && r.type) return /webgpu/i.test(String(r.type)) ? 'webgpu' : 'webgl';
    } catch (e) {}
    return null;
  }
  function captureRenderer() {
    try {
      var g = globalThis;
      function wire(name, pick) {
        var cur = g[name];
        if (typeof cur === 'function' && !cur.__murthered) {
          g[name] = function (a, b) { try { window.__murtherRenderer = pick(a) || window.__murtherRenderer; if (UI.renderStatus) UI.renderStatus(); } catch (e) {} return cur.call(this, a, b); };
          g[name].__murthered = true;
        } else if (typeof cur !== 'function') {
          g[name] = function (a) { try { window.__murtherRenderer = pick(a) || window.__murtherRenderer; if (UI.renderStatus) UI.renderStatus(); } catch (e) {} };
        }
      }
      wire('__PIXI_RENDERER_INIT__', function (a) { return a; });
      wire('__PIXI_APP_INIT__', function (a) { return a && a.renderer; });
    } catch (e) {}
  }
  installRendererHook();
  captureRenderer();

  /* ---------- graphics quality + antialiasing (document-start) ----------
   * Both are canvas-creation-time choices the engine makes once, so they are
   * installed before any game code runs and apply on the next page load.
   * - Quality maps to the canvas backing-store density: the engine reads
   *   window.devicePixelRatio when sizing its renderer (resolution), so a
   *   definedProperty override (0.75 / 1 / native up to 1.5 / native) scales
   *   rendered detail and GPU fill cost. 'auto' / 'high' leave it untouched.
   * - Antialias wraps getContext and rewrites the WebGL context attributes
   *   (antialias:true/false); the engine passes its own options in, so the
   *   override wins. 'default' never patches.
   */
  function dprValue() {
    var nat = window.devicePixelRatio || 1;
    switch (S.game.quality) {
      case 'low': return 0.75;
      case 'medium': return 1;
      case 'high': return Math.min(nat, 1.5);
      case 'retina': return nat;
      default: return nat;                    // auto
    }
  }
  function installQualityHook() {
    if (S.game.quality === 'auto' || S.game.quality === 'retina') return;
    try {
      var v = dprValue();
      if (String(window.devicePixelRatio) === String(v)) return;
      Object.defineProperty(window, 'devicePixelRatio', {
        get: function () { try { return dprValue(); } catch (e) { return v; } },
        set: function () {}, configurable: true
      });
    } catch (e) {}
  }
  function installAntialiasHook() {
    if (S.game.antialias === 'default') return;
    var want = S.game.antialias === 'on';
    try {
      var proto = HTMLCanvasElement.prototype;
      if (proto.__murtherAA) return;
      proto.__murtherAA = true;
      var orig = proto.__murtherGetContext || proto.getContext;
      proto.getContext = function (type, opts) {
        var t = String(type || '');
        if (t.indexOf('webgl') === 0) {
          var o = Object.assign({}, opts || {});
          o.antialias = want;
          return orig.call(this, type, o);
        }
        return orig.apply(this, arguments);
      };
    } catch (e) {}
  }
  installQualityHook();
  installAntialiasHook();
  function refreshNativeOptions() {   // live engine hooks exist: repaint options UI
    if (UI.syncNativeRows) { try { UI.syncNativeRows(); } catch (e) {} }
  }

  /* ---------- native options bridge ----------
   * The game's own Options panel lives in the ghosted #main -> #main-options
   * (its <select>/<input> controls keep working — donutextension.js drives them
   * the same way). Murther reads/writes those controls so its Settings rows
   * control the GAME's real settings (names/skins/mass/food/border/zoom…).
   * Each bridge degrades gracefully: when a control is missing (different
   * markup, not rendered yet) the row explains itself instead of breaking.
   */
  var nativeOpt = { found: false, at: 0, map: {} };
  function nativeOptionsRoot() { return DOC.getElementById('main-options'); }
  function scanNativeOptions(force) {
    if (nativeOpt.map && !force && Date.now() - nativeOpt.at < 2000) return nativeOpt;
    var map = {};
    var root = nativeOptionsRoot();
    if (root) {
      // by id (donutextension-proven names)…
      ['sShowSkins', 'sShowNames', 'cShowMass', 'cHideFood', 'cAutoDecline', 'cAutoRespawn'].forEach(function (id) {
        var n = DOC.getElementById(id);
        if (n) map[id] = n;
      });
      // …then by label text for the rest (the game renders rows as label + control)
      var rows = root.querySelectorAll('tr, .options-row, div');
      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var kids = row.querySelectorAll('select, input[type="checkbox"]');
        if (!kids.length) continue;
        var label = (row.textContent || '').toLowerCase();
        if (!map.zoomSpeed && kids.length === 1 && /zoom speed/.test(label)) map.zoomSpeed = kids[0];
        else if (!map.cameraDelay && kids.length === 1 && /camera (delay|focus)|smooth mouse/.test(label)) map.cameraDelay = kids[0];
        else if (!map.autoZoom && /disable auto zoom|auto zoom/.test(label)) map.autoZoom = kids[0];
        else if (!map.showBorder && /show border/.test(label)) map.showBorder = kids[0];
        else if (!map.hideTag && /hide tag/.test(label)) map.hideTag = kids[0];
        else if (!map.autoHideMass && /auto hide mass|auto-hide mass/.test(label)) map.autoHideMass = kids[0];
        else if (!map.autoHideNames && /auto hide name/.test(label)) map.autoHideNames = kids[0];
        else if (!map.smoothCells && /smooth (mouse|cell|movement)/.test(label)) map.smoothCells = kids[0];
      }
    }
    nativeOpt = { found: !!root, at: Date.now(), map: map, any: Object.keys(map).length };
    return nativeOpt;
  }
  // One entry per native-backed row; each: {key, sel, kind, is}
  //  key: S.game field  sel: known control id (or '' for label-scan only)
  //  kind: select|check  is: matcher for the value read-back
  var NATIVE_ROWS = [
    { key: 'showSkins', sel: 'sShowSkins', kind: 'select' },
    { key: 'showNames', sel: 'sShowNames', kind: 'select' },
    { key: 'showMass', sel: 'cShowMass', kind: 'check' },
    { key: 'hideFood', sel: 'cHideFood', kind: 'check' },
    { key: 'showBorder', sel: '', kind: 'check' },
    { key: 'autoZoom', sel: '', kind: 'check' },
    { key: 'zoomSpeed', sel: '', kind: 'select' },
    { key: 'cameraDelay', sel: '', kind: 'select' },
    { key: 'hideTag', sel: '', kind: 'check' },
    { key: 'autoHideMass', sel: '', kind: 'check' },
    { key: 'autoHideNames', sel: '', kind: 'check' },
    { key: 'smoothCells', sel: '', kind: 'check' }
  ];
  function findNativeControl(def) {
    var st = scanNativeOptions();
    if (def.sel && st.map[def.sel]) return st.map[def.sel];
    return st.map[def.key] || null;
  }
  function nativeValue(def) {
    var c = findNativeControl(def);
    if (!c) return undefined;
    if (def.kind === 'select') {
      // selects encode category (e.g. Show Names: All/Self/Off) — ON means the
      // current selection is NOT the off/disable/hide option
      var off = /off|disable|hide/i;
      return !off.test(c.options[c.selectedIndex].text);
    }
    return !!c.checked;
  }
  function setNativeValue(def, v) {
    var c = findNativeControl(def);
    if (!c) return false;
    try {
      if (def.kind === 'select') {
        var off = /off|disable|hide/i;
        var idx = v ? 0 : -1;
        if (v) {
          // prefer a non-off, non-first "All"-style option when present
          idx = 0;
          for (var i = 0; i < c.options.length; i++) if (!off.test(c.options[i].text)) { idx = i; if (/all/i.test(c.options[i].text)) break; }
        } else {
          for (var j = 0; j < c.options.length; j++) if (off.test(c.options[j].text)) { idx = j; break; }
          if (idx < 0) idx = Math.max(0, c.options.length - 1);
        }
        c.selectedIndex = idx;
      } else {
        c.checked = !!v;
      }
      c.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    } catch (e) { return false; }
  }
  function setGame(key, v) { S.game[key] = v; save(); refreshNativeOptions(); }

  /* ---------- fx overlay: cursor line + linesplit arrows ----------
   * A dedicated pointer-events:none canvas over the game, drawn only while
   * actually playing (menu closed). The rAF loop starts/stops with the toggles
   * so an off state costs nothing (same lifecycle rule as the particle field).
   * - Cursor line: from screen center (your cell) to the mouse. Size = line
   *   width; color follows the accent unless a color is picked in Themes.
   * - Linesplit indicators: split-axis arrow at the mouse, showing where a
   *   linesplit would send cells (double-headed arrow along the aim axis).
   */
  var fxCanvas = null, fxCtx = null, fxRAF = 0;
  var fxMouse = { x: -1e4, y: -1e4, has: false };
  function fxLineColor() { return S.game.cursorLineColor || S.accent || '#a855f7'; }
  function fxEnsure() {
    if (fxCanvas && fxCanvas.isConnected) return true;
    if (!DOC.body) return false;
    fxCanvas = DOC.createElement('canvas');
    fxCanvas.id = 'murther-fx-canvas';
    fxCanvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:2147482991';
    DOC.body.appendChild(fxCanvas);
    fxCtx = fxCanvas.getContext('2d');
    return true;
  }
  function fxSize() {
    if (!fxCanvas) return false;
    var w = window.innerWidth || DOC.documentElement.clientWidth;
    var h = window.innerHeight || DOC.documentElement.clientHeight;
    if (fxCanvas.width !== w || fxCanvas.height !== h) { fxCanvas.width = w; fxCanvas.height = h; }
    return w > 0 && h > 0;
  }
  function fxNeeded() { return !menuOpen && (S.game.cursorLine || S.game.lsArrows); }
  function fxFrame() {
    fxRAF = 0;
    if (!fxNeeded()) { fxClear(); return; }
    if (!fxEnsure() || !fxCtx || !fxSize()) { fxRAF = requestAnimationFrame(fxFrame); return; }
    var x = fxCtx, w = fxCanvas.width, h = fxCanvas.height;
    x.clearRect(0, 0, w, h);
    var cx = w / 2, cy = h / 2;
    if (S.game.cursorLine && fxMouse.has) {
      x.save();
      x.globalAlpha = 0.85;
      x.strokeStyle = fxLineColor();
      x.lineWidth = clamp(parseFloat(S.game.cursorLineSize), 1, 20) || 3;
      x.lineCap = 'round';
      x.beginPath(); x.moveTo(cx, cy); x.lineTo(fxMouse.x, fxMouse.y); x.stroke();
      x.restore();
    }
    if (S.game.lsArrows && fxMouse.has) {
      var dx = fxMouse.x - cx, dy = fxMouse.y - cy;
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      var ux = dx / len, uy = dy / len;
      var size = 26;
      x.save();
      x.globalAlpha = 0.9;
      x.strokeStyle = S.game.lsArrowColor || '#a855f7';
      x.fillStyle = S.game.lsArrowColor || '#a855f7';
      x.lineWidth = 3; x.lineCap = 'round';
      // double-headed arrow along the aim axis through the mouse point
      var ax = fxMouse.x, ay = fxMouse.y;
      var bx = ax - ux * size, by = ay - uy * size;   // backward head
      x.beginPath(); x.moveTo(bx, by); x.lineTo(ax + ux * size * 0.2, ay + uy * size * 0.2); x.stroke();
      function head(px, py, dirx, diry) {
        var wing = size * 0.42;
        var pxp = -diry, pyp = dirx;
        x.beginPath();
        x.moveTo(px, py);
        x.lineTo(px - dirx * wing + pxp * wing, py - diry * wing + pyp * wing);
        x.moveTo(px, py);
        x.lineTo(px - dirx * wing - pxp * wing, py - diry * wing - pyp * wing);
        x.stroke();
      }
      head(bx, by, -ux, -uy);
      head(ax + ux * size * 0.2, ay + uy * size * 0.2, ux, uy);
      x.restore();
    }
    fxRAF = requestAnimationFrame(fxFrame);
  }
  function fxClear() {
    if (fxCtx && fxCanvas) fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
  }
  function fxKick() {
    if (fxRAF) return;
    if (fxNeeded()) fxRAF = requestAnimationFrame(fxFrame);
    else fxClear();
  }
  function onFxMouseMove(e) { fxMouse.x = e.clientX; fxMouse.y = e.clientY; fxMouse.has = true; }
  function onFxMouseOut(e) { if (!e.relatedTarget) fxMouse.has = false; }
  var fxWired = false;
  function fxWire() {
    if (fxWired) return;
    fxWired = true;
    window.addEventListener('mousemove', onFxMouseMove, true);
    window.addEventListener('mouseout', onFxMouseOut, true);
  }

  /* ---------- zoom: speed scaling + auto zoom ---------- */
  var zoomWired = false;
  function installZoomHooks() {
    if (zoomWired) return;
    zoomWired = true;
    // Wheel speed: capture-phase scaling of deltaY toward the canvas while
    // playing. Menu wheel (scrolling Settings) is never touched.
    window.addEventListener('wheel', function (e) {
      if (menuOpen) return;
      var sc = clamp(parseFloat(S.game.zoomSpeed), 25, 300) / 100;
      if (sc === 1 || e.ctrlKey) return;
      if (e.target && e.target.closest && e.target.closest('#murther-root')) return;
      var dy = e.deltaY;
      if (!dy) return;
      var scaled = dy * sc;
      e.preventDefault();
      e.stopImmediatePropagation();
      var clone = new WheelEvent(e.type, {
        bubbles: true, cancelable: true, composed: e.composed,
        deltaX: e.deltaX, deltaY: scaled, deltaZ: e.deltaZ, deltaMode: e.deltaMode,
        clientX: e.clientX, clientY: e.clientY, screenX: e.screenX, screenY: e.screenY,
        button: e.button, buttons: e.buttons,
        ctrlKey: e.ctrlKey, altKey: e.altKey, shiftKey: e.shiftKey, metaKey: e.metaKey
      });
      (e.target || DOC).dispatchEvent(clone);
    }, { capture: true, passive: false });
    // Auto zoom: rate-limited synthetic wheel ticks that steer the game's own
    // zoom toward a mass-based target (experimental approximation).
    setInterval(autoZoomTick, 100);
  }
  var lastZoomTarget = null;
  function autoZoomTick() {
    if (!S.game.autoZoom || menuOpen) { lastZoomTarget = null; return; }
    var mass = null;
    try {
      if (UI.scMass) {
        var b = $('b', UI.scMass);
        var m = /([0-9][0-9,\. ]*)/.exec(b ? (b.textContent || '') : '');
        if (m) mass = parseFloat(m[1].replace(/[\s,]/g, ''));
      }
    } catch (e) {}
    if (!mass || !isFinite(mass) || mass <= 0) { lastZoomTarget = null; return; }
    // target zoom shrinks as you grow: 10 mass -> 1.0, 1000 -> ~0.32, 10000 -> ~0.21
    var target = 0.2 + 0.8 / (1 + Math.log10(1 + mass / 10));
    var key = Math.round(target * 100);
    var speed = clamp(parseInt(S.game.zoomSpeed, 10) || 100, 25, 300) / 100;
    if (lastZoomTarget !== null && Math.abs(lastZoomTarget - key) < 3) return; // stable: no spam
    lastZoomTarget = key;
    var cv = N.canvas || DOC.getElementById('canvas');
    if (!cv) return;
    // relative correction against the last tick's target (kept simple + bounded)
    var dir = 0;
    try {
      var cur = window.__murtherZoomEst;
      if (cur != null) dir = target < cur ? 1 : -1;
    } catch (e2) {}
    if (!dir) return;
    var ev = new WheelEvent('wheel', {
      bubbles: true, cancelable: true,
      deltaX: 0, deltaY: dir * 40 * speed, deltaMode: 0,
      clientX: (window.innerWidth / 2) | 0, clientY: (window.innerHeight / 2) | 0
    });
    cv.dispatchEvent(ev);
  }
  fxWire();
  installZoomHooks();

  /* ---------- global FPS cap (installed at document-start) ----------
   * Wraps requestAnimationFrame BEFORE any game code runs. When a cap is set,
   * frames are spaced out to the target rate, throttling the game loop, the HUD
   * loops and Murther's own menu canvas together. Toggling applies LIVE (no
   * reload): the wrapper re-reads the setting on every frame.
   * Mechanics: per-callback state (WeakMap) remembers the last frame time, so a
   * game loop that re-registers itself every frame keeps its spacing. An early
   * frame re-queues the WRAPPER (not the callback) — it is retried on the next
   * vsync until the target spacing elapsed, so a 60 cap on a 240Hz monitor
   * simply skips 3 of every 4 vsyncs while a 144 cap on a 60Hz monitor degrades
   * gracefully to the native rate. cancelAnimationFrame keeps working untouched.
   */
  var MURTHER_CAPS = [0, 30, 60, 90, 120, 144, 165, 240];
  var fpsCapStates = new WeakMap();
  (function installFpsCap() {
    try {
      if (window.requestAnimationFrame.__murtherCap) return;
      var orig = window.requestAnimationFrame.bind(window);
      function capped(fn) {
        if (typeof fn !== 'function') return orig(fn);
        var st = fpsCapStates.get(fn);
        if (!st) { st = { last: 0 }; fpsCapStates.set(fn, st); }
        function wrapper(t) {
          var cap = parseInt(S.perf && S.perf.fpsCap, 10) || 0;
          if (cap > 0 && t > 0) {
            var minDt = 1000 / cap - 1;   // 1ms tolerance: slightly off-spec monitors still reach the cap
            if (t - st.last < minDt) { orig(wrapper); return; }   // skip this vsync
          }
          st.last = t;
          fn(t);
        }
        return orig(wrapper);
      }
      capped.__murtherCap = true;
      window.requestAnimationFrame = capped;
    } catch (e) {}
  })();
  function cycleFpsCap() {
    var i = MURTHER_CAPS.indexOf(parseInt(S.perf.fpsCap, 10) || 0);
    i = (i + 1) % MURTHER_CAPS.length;
    S.perf.fpsCap = MURTHER_CAPS[i];
    save();
    if (UI.paintFpsCap) UI.paintFpsCap();
    toast(S.perf.fpsCap ? 'FPS cap: ' + S.perf.fpsCap : 'FPS cap: off (uncapped)');
  }

  /* ---------- icon font (Ryuten iconfont.woff, embedded) ----------
   * Extracted from the Ryuten Files folder into the client so nothing is loaded
   * from disk at runtime. Original asset: ryuten.io icon glyph font (WOFF).
   */
  var MURTHER_ICONFONT_B64 =
    "d09GRgABAAAAABZMAAsAAAAAJkgAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAABHU1VCAAABCAAAAn4AAASIaHNtI09TLzIAAAOIAAAAQQAAAGBWT1N4Y21hcAAAA8wAAAHmAAAFnHfGb39nbHlmAAAFtAAADKIAABQICBlMVGhlYWQAABJYAAAAMAAAADZ2zcSCaGhlYQAAEogAAAAWAAAAJAfRBDVobXR4AAASoAAAABcAAAEw" +
    "xrsAAGxvY2EAABK4AAAAdQAAAJr0WPBqbWF4cAAAEzAAAAAfAAAAIAFiAIJuYW1lAAATUAAAASkAAAIWm5e+CnBvc3QAABR8AAABzQAAAp6lNxp+eJxdk7tSFFEQhv/ZGS4qlxUQFRUUURFvqLM7sDsLs8NwN7IMDEww0LKKsijL2JDAZzDwCQyNfAAfwNjYgNjYr3tmBd2tmTnn9N/9/305CiSd1qJWVCs2njzTyP7e+7ea" +
    "UqTyZ/aT62D/zes9DfZ22CL/DiqIJjWmBb3Uob7rKFAwFxwEH2oHtcPa73A2TMOd8HP4NTxSCHoazhrMTf6JlrSshn9bbj0+bSsleoi1Ab5fxjGgDWUoTkA1dJbTQms8OU9EzCnNY1kAV4DLFbPLdctxPa9536X4xdrRbfU51mJYTrMaxVagZhkue3cqRYZpOuYx8S1yyxHbru6yrsGfOF8XrwKEKbhKBgXepm7erTc1UnF3" +
    "eK9oFXTmnAXq5lxdk5OE2NdRF1MJ475BjNKvrH1UeQ+RdarneqeP+qQv+kYPfuinflHNOloKR3WItw5TQrScOKa80BkNO2LTc7Rsm1i2OcvRO/SfzSq9haUfvy7suVenzdNx2ykY/+Ub5SRB3Q7IGMwaMfthaIIxjwHy63kMs14Dbbn2eXYZthFWiaut+yqt8p8icuE1TLwXDWLVqe0SCp/qhV7pvvejXfVjqZqIu+6X8y97" +
    "l+kBnqnvWl75O869yfqeM1rPFlmV0/TQV4nPZqRHGveKxR7LMlqurCcrmfmE1HUJD+NZZVoin+Ry5sZ5GuxzvwFznJ+nGrtEKdltmtb/7i5ga5FlwvkWzJZb170LXSTnnu341DgmiGzzUnjFEjSYpgWd4xbFcNmNiFFhHc2JkbGyO2KzN1l1pgPKFE4w1Vf83jS8q9Osk2pKZ+BqV6xjHrFZ3e4Uf+tz5vNXoG2L+uz+AdrL" +
    "dPkAAHicY2Bhmss4gYGVgYGpimkPAwNDD4RmfMBgyMgEFGVgZWbACgLSXFMYDjDofjRmfgHkRrE4gYUZURQJAwBH0ApoAAAAeJy11AdO3FAYReEzM3SG0Hvvdei997oK0hEpiFT2kbVlH14B+S/3ZQFEypM+H9vy2M+y3gDlQCHMhDLIV5GLPXL5OJt7Ol+g5ul8Gb/juEgV+dgvccMdD9nS42OcLXHNLfdZ7uno78jF1UV6" +
    "GGM5jjZiu8MuKxxzzgUHnLLHEVdsssY2q+xzyBZnrHPCZfxacyiLGVZQGU+tjnnUxv3qeEE9DTTSRDMttNJGOx100kV3PK2XPvoZYJAhhhlhNJ4/zgSTTDEd71NiljnmWWCRpZhkBc8bG8+8XmN5Z3fl+PziIN746GpzLV52/3DrbP3k8h/u9T9GUZvCr3R0hb6o6W2vE33Fl8lOeJXshtfJSniTHIe3yXl4l1yE98lBuElO" +
    "w22yFz4kR+Fjorl9SjbD52Qt3CXb4T5ZDV+S/fA1OQzfkq3wPTkLP5L18DM5CQ9JfLUsZ1ojWd5QC6Y1lZWZ1lVWblpvWYWhVhpqlaFWG2qNaR1mtYZaNH29rM5QXxhqvaE2GGqjoTYZarOhthhqq6G2GWq7oXYYaqehdhlqt6H2GGqvofYZar+hDhjqoKEOGeqwoY4Y6qihjhnquKFOGOqkoU4Z6rShzpj+O7OSac1ks4Y6" +
    "Z6jzhrpgqIuGumQs/QG706aKAAB4nJVYb2zbxhXnkbZoS7RkWqIoxbYskrJoO7FkivpjW4mTOk4cp3ETh3LcOIn/JE2axG4bdytctBCGrWm7LEAzuMiwNW2XYJsEDGuxrUDRNkXyYUnQpSumAMWwYt4+NE3RbJg/+ZNWEXt3+mO7cQeMJo93x6e7d+9+773fmUIUXIyH8VA2ikKKoMSUmB7TBZ3x5FN5uNFtXOaxGJGlb9K7" +
    "KBoaYgIFcjl6MJdb/W2OfEuI+Bu6svrbeXqJqoaGyooJlf5Rbz7fe41+J5nPJ69jFYge15l+kKml3CDHSzGJZyReYqMhJNuRy4cifYi59vV9+oZRaKCX8nLPQK8k9Q70yPSNwl0D3TbPoeW8XOqTeypzMxeZi1QdNCTZIvAJKRKP8dEg81DhhKJl6UFF05iLmlJoyGoyWla0ld/NgFolnZGK5t9O3kfLSbSz+MYrBZlZZga0" +
    "dxKN+VYyg8utl+fwFN6jdxXekzVNpndBWewwNHmlrzTODIzjoISylitjIBXMKeIfVkYxH7+T/AnanGRmVg9UeD+XvAi9KzZ/YY3Nf0CMvWLzosylkgwrghC6krx+PZmnl8hrjf1c0JBZC2txiW7RHUnEE/GoGlSDaHluejLR05OYnP68XGEurmmSSnmsMtZUViVTgmaMJ3n/fvmm/76qUbJNcf5d36IBA6iFl6oXe2OkUw3G" +
    "oiABUIZeUYE2WNWF624BhlhP6/hTvQG1aj/jbXpig9PVuC3V0RVUep7qbvHR+2lBPBKP9O1Vu1GrvN7yCtN793FysDcAczR4fU6vQ5DUzdGAzO0bqWtvjbQ63cGWxkC90NwxGFf8eFlWsrZ+WJsD8CNSjVQLpVBt1CYqQnU/iAPsCwjWo+qCguBpjenNSA7GdBFcVtRiusuCNEGJxukl8xzGBJrHJTjFfOGCARcKGIa5aMia" +
    "sWAYdwzNfN4gwDc5Ig3IL7yHls24YdwzzDdTC6nUgqak4FI0+hL8jKr46SxznaqhPFRTWUudl8R11KUvmZyipdBy2oyROT4mGsXQx8w1QO779KABfvc+ATC4YeE4PYghWcLJDEQCnqIS5TGlVkVVWEWQ8jDSI7JmcrRvoSPXsUDvyhVXkO7oMCiqquRP90FHngpQz4CWLksIReMRtypbIJDEwav4MAKVQwh07UMwgQ8xBDhh" +
    "FCy+WIBKC244EIZaQsXQYy0ORF6CSLAkJogsCEIDhIiMiMXjWxG9w7exuXmj75+Cz9fh86H/zM03Fv7YFG6Cm36zMdz0Clfr4Oo4T5NbrHdwbNAvNtgfPT51sNnu9Mht1ZyjXnQ3ebg6W32trcbmcG/wB6UmN2+rtXBM/8jYsK+pluNFnxSUNgj1thq6TpSQPyTBFfIjKSShzV9/77EnD+PpfkmmNa2J3nBI8okNnNVShVAN" +
    "V8/VWcMMo9ptdRzPWRCqsli5BhgzFO5N2OxcvZVDHTUOW52NqUGtFlayOm12m6OmHXHWes5uq+zXLDMLlrdTlFPQkVodj4IhZQcS06+jT15HAscd5WRu+A3kxW0F6kc5bs8ba2N0OzTIJhA3F1yiD4k8TkiwRUkkKLKlGSOfJ/Zd5YWdHT+dTKXU7W0nU7wnnT55YFTTV3n43LFHR59xosb0ybbtatrTYKTNf9h6e8aPlLGC" +
    "564CtNlJHI8pgqgqgp5gBT2mJlhRj9Fz+fTVL79Mb82nP0yn79G/vXcv3VfsuppO58t+UYxTEtX3bZEqhEhcEiES6a0htBHFokEo9Eh8CyIFLNgtuNaPT5dGXgyqNR8B0P01mxo7PA15WG1K1rZMbGgUxXWDkmA9PDiUCqgfdciad4M/3eAxvDz4HO89srlvx7ZkN7XG3ywkS7I6+LPu5BVegYwwn02n0nBns8xMxlxEAXMC" +
    "nsVMprTmz5jPIBJI1DayZjvCi8ariCT6EF42XjIbcbsscjAad7osGyFmbQFfTIKdy7WIG/Y14hbQ8rHxAy8HgsHAywfGb61Uj8ldXQNdXRfqrL+x1tVZPR5cpq120VrH/BUkxg6uEr51cAyqf9G2a3Cbjlq7vTZstacB5la73foHu3UljuGcy1L1JLdJLC9KCR5hNbG6CcAdfcG8vbiI4ovmObHF39nid6VSzMxisdP8ob/T" +
    "D/c7OE9ypf33rInlKrWRClM6laCSpUjJrATIakCyAI9afG+kAecwJwLeQ0iYUozs+E2oShfSFPo1ICvmCRyU07hoxwWaN3+PHqn0MR4I6VMgp6DLipYGmTtYrj1lnjOMUquMV/omrN0DGYdyEheDLSFMi9RCECBjEHQFHYKjyw5ohVofAjr2C3mzksn0THV3T/VkMspm+dfoEdBhHtcVpfINUkpS2ds9+fRk914lyaYyUO4s" +
    "91CANrIHoAMDu2ArWY5ywpIFvWgCrICAiSAUaYNcQNhw4sAPup3KG/AHJRo2jAqW6ZvED71FTuaC4AxxiE2IaiKMAJUOpPI6fcOcslrfbn9lVnruOf/shfa3rdZMR0eKjqEp87LNWX1quu7I+d27zx+pmz5V7dzm9aLvV3DTz3wI2rtgl/EMGONoxdO3IAlhNxAk2ocUNfii2d25ac/wu8N7NnUWTiAFezFSmKvmu6mhwcOF" +
    "W4fwByxxKIveIP5a8cliPPF8SzRxgmHWixOT5hS6vF44MGN46ErM6weLe6lWQOcD2AS9BYw/DEGhhNOYXl32XjgfxMizFpgFM3I6Gj0ZvXMKrmwWKR4+y3ujYfhjHuoCnqF0dSkAii4zvrCQX1iIhmOhaD7X4PE05D58deEqtZoj1kBDkJCIIBiheeQ0m3vRXQB3ilTMf6MrK7FrFtYiUr4VzoTxC1uPoVv0NbaobolEZ7P0" +
    "rmwWE+kPcHRjHgJSAiTIQFfMSQMTCVnLZ8ihp4inJdAHY5RK6LwigUJ5WN1wNoepPRyHKnr0gx4cQUXRT4rOJJLNawbHLhHmzuHOzuFxXHT27U5Ft9CvbYmmdkP/nkPDmzYNH9rTaTgFpV03DL1dEZzUGrvg8xWP0DBwKFgNClDYUmQ/Xy35UQPsqh9iD85CKg+YLz5MDFApxlkVXnqcVUCxRBCHaiDPyEWIS6wSsmOE3dD+" +
    "7+WfJ/edvjPh5NDZpBpmR222UTasJru7w3NbDg7RT0S01NjjI2eDcJ0deXwspUXofVPmuauHKwXaXfzFd5LhM30H38Jj7bpGhupG7OnD4z1J26h1YudQZmjnhHXUluwZP1xZM7YpxGfnN8BPbJqtOFalgpYPrWnjyip/miXsuuRPAuQ3BZ8S4hE8OLEB5CQVMz99ZSpWgDNKjPadeDQV0dOZbLot2D/w84F+Fa7+gb2bT7cl" +
    "o9t3DJ8YG9WiUW107Me/8y8wM3pkdOxEJrMX5NraQO5NXAmBaJMPf/rT2GhEz905FR97awU/OB/VUDHMguC44nJH4sz/oyg9qA1ocBsn8ODpbCZdmRhX9oYOtCa7ejZvJZ+xEhjo+CfoZ0TbbHatts3eZBDYXFnb1bHjIsFaEwWHAsLI4HGuy3hkXH5DdYjbcHU8PT2Bg9PE9N3pie6enu6J6bkH9w7NG+hyHn28DrlpeHD3" +
    "V53J60r/RQAaU45r1QmRhcM0T+KAUTw0m+/M9uZyvbNwSCHkZpGcJAJNs8lcLjmLXq3szfPMi9QANQJjwsogi4RRCDJJEL8gKJJjgRrEL0g3mLoCFWoBOrcVnw1wQo3AgSCeEN34FVSrIbtCxi0mVsZHM6PVDLOvys4+JgFpttVcZm20Q5IfY+3Qy1hGq9YI0Db2co0NORR/WcB8oX1HW9uO/bhAnzg7+P4qh+W8pZpu89pP" +
    "s1Yre9rubaOr2PMWR1W/m3f/r++dpXGgKPMkeqkUWyACQmSFbIxpSjqfp5cKDWA5DjLwFXy6TK3xW4hMrZCjVASbQM9BzL7bazancinyhpA+WZL9jPkzhf9BgA/oZQbMWuTSKb4PJ20gikHCLkWCsESRXsaK/NJC607Hw89Kshbeb9ww9oc1WXr2YYer1X0yE+pC27c9eebs0fGxlwLBcPhXJ90B5nWp3lslHN85NHIUS+Of" +
    "HR0Z2nlcqPLWS2KTpfHc9LEzL8w9sbUfBVtfGhs/+tSxqXMbLE2rziq1oG81k2i1oWqRQctw2PvC/PSZZ8xPvxhAnkuo9aYXCea/vDfNv638P2aJ2JFywtE4j60GJ3WubK+vmK8w0gCwuPq1p8w1XmIG4VyC+SSVkCCtqAA4C4ssPlQi0pg8uyyYKn5Af7el0+Ywb9V3d9ebtxy2TnSQ93plr9cL3FBNNtK+RpersfB5Y1JF" +
    "AQ8PxwdSZI3/ApiML8wAAHicY2BkYGAA4pfmEuHx/DZfGbiZXwAFojgf72tA0AwMzC+YXwIpDgYmEA8AO7ULEnicY2BkYGB+wcCARDIyoAIfAEWGAxAAAHicY2BgYGB+QQWcTSVzKMS0BgD3gi5VAHicY2AAAjEGFQYjBheGAoYehnkMhxjeMPxjFGA0Ywxg3MckweTFlMWsxOzE3MC8hIWJRY6lhmUJyx9WO9YM1hmsZ1h/" +
    "sXmwJbBNYFvCdoXtEbsfewn7EQ4JjgyOSZwCnFqcDpwzOLdwHuI8x8VCKgQAOdUZkAAAAHicY2BkYGDwYShj4GEAASYg5gJCBob/YD4DABzoAeUAeJxlkD1uwkAUhMdgSAJSghQpKbNVCiKZn5IDQE9Bl8KYtTGyvdZ6QaLLCXKEHCGniHKCHChj82hgLT9/M2/e7soABviFh3p5uG1qvVq4oTpxm/Qg7JOfhTvo40W4S38o" +
    "3MMbpsJ9POKdO3j+HZ0BSuEW7vEh3Kb/KeyTv4Q7eMK3cJf+j3APK/wJ9/HqDdPIFLEp3FIn+yy0Z3n+rrStUlOoSTA+WwtdaBs6vVHro6oOydS5WMXW5GrOrs4yo0prdjpywda5cjYaxeIHkcmRIoJBgbipDktoJNgjQwh71b3UK6YtKvq1VpggwPgqtWCqaJIhlcaGyTWOrBUOPG1K1zGt+FrO5KS5zGreJCMr/u+6t6MT" +
    "0Q+wbaZKzDDiE1/kg+YO+T89EV6oAAAAeJxtUdeS2zAM1J4lW9Gdr+TSe+9M773Xy0dQEixxRJEckrLsvw9lz70FD4sFBlhiltFGtI4s+n8cYAMjxEgwxgQpjiDDJrYwxTZ2sIs9HMU+juE4TuAkTuE0zuAszuE8LuAiLuEyruAqruE6buAmbuE27uAu7oHhPh7gIR7hMZ7gKZ7hOV7gJV7hNd7gLd7hPT7gIz7hM77gK77h" +
    "O37gJ37hN/7gAH+jES/LjFure1bqXqVr2pk450UTF9zVm0XNPcu7PJeUFDUVze4Kc71guvNSKEoPG1uBzK1WTNLMTw8LK6rajwthi0FBakdxoYVKC22WjEsZD2RckiRPk1K4QtsyplL4dMYLyrVu9irekuEly71yzMjOJZXUOU1Fa7T1jBZDmgo102zGWV8LT9mqWtG0oWWueVAN1zYBnE9aKrlMWt2Fa9rO00hRn6mgUjPi" +
    "zu9oQ4oJxfLghyObGB4mx4as0yo2ki+3BxhcYs4QlWNLw90hDf3EkiM/Cei59bHjc0pDwwtVudiFVzIXvKtZHwYmzgilyMbDbABt9r0VXFWSWCjW9rlJz60K6+AoYaHRh99X6GCQo0ADhxoeEoQFBOaYocISbRT9Awccs+gAAAA=";

  /* ============================== style ============================== */
  var CSS = [
    ':root{--mx-accent:#a855f7;--mx-accent2:#c084fc;--mx-bg:#0a0a0c;--mx-panel:rgba(10,10,12,var(--mx-pop));--mx-pop:.72;',
    '--mx-border:rgba(255,255,255,.08);--mx-text:#ececf1;--mx-dim:#9a9aa6;--mx-radius:10px;',
    '--mx-shadow:0 10px 30px rgba(0,0,0,.55);--mx-font:Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif}',
    /* icon glyphs: Ryuten's iconfont.woff embedded as base64 (no network, no folder dependency) */
    '@font-face{font-display:block;font-family:mx-icons;src:url(data:font/woff;base64,' + MURTHER_ICONFONT_B64 + ') format("woff")}',
    '.mx-if{font-family:mx-icons,Inter,system-ui,sans-serif;font-style:normal;font-weight:400;line-height:1;display:inline-block;vertical-align:-1px}',
    '.mx-if-copy:before{content:"\\f110"}',
    '.mx-if-keyboard:before{content:"\\f11a"}',
    '.mx-if-mouse:before{content:"\\f11e"}',
    '.mx-if-play:before{content:"\\f125"}',
    '.mx-if-gear:before{content:"\\f12c"}',
    '.mx-if-copy{font-size:13px}',
    'body.murther *{scrollbar-width:thin}',
    '#murther-root{position:fixed;inset:0;z-index:2147483000;pointer-events:none;font-family:var(--mx-font);color:var(--mx-text)}',
    '#murther-root *{box-sizing:border-box}',
    '#murther-root .mx-click{pointer-events:auto}',
    'body.mx-zoom .mx-menu{zoom:var(--mx-menu-scale,0.94)}',
    'body.mx-zoom .mx-menu{transform:translate(-50%,-50%) scale(var(--mx-menu-scale,0.94))}',
    '@supports (zoom:0.9){body.mx-zoom .mx-menu{transform:translate(-50%,-50%)}}',

    /* ---------- menu ---------- */
    '.mx-menu{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;gap:14px;align-items:stretch;',
    'width:min(790px,90vw);max-height:92vh;pointer-events:auto}',
    '.mx-card{background:var(--mx-panel);backdrop-filter:blur(10px);border:1px solid var(--mx-border);border-radius:12px;',
    'box-shadow:var(--mx-shadow);display:flex;flex-direction:column;gap:8px;padding:14px}',
    'body.mx-reduce .mx-card,body.mx-reduce #murther-root .mx-stats,body.mx-reduce #murther-root .mx-pane{backdrop-filter:none!important}',
    '.mx-left{width:296px;flex:0 0 296px;justify-content:center}',
    '.mx-logo{display:flex;align-items:center;justify-content:space-between;position:relative;font-weight:800;margin:2px 0 8px;color:#fff;min-width:0}',
    '.mx-word{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:16.5px;letter-spacing:1.2px;white-space:nowrap;pointer-events:none}',
    '.mx-logo b{color:var(--mx-accent)}',
    '.mx-ver{flex:0 0 auto;font-size:10px;font-weight:600;letter-spacing:.4px;',
    'color:var(--mx-dim);background:#16161a;border:1px solid var(--mx-border);border-radius:6px;padding:2px 7px;line-height:1.4;white-space:nowrap}',
    '.mx-renderer{flex:0 0 auto;display:flex;gap:3px;position:relative;z-index:1}',
    '.mx-rbtn{font-size:9px;font-weight:700;letter-spacing:.3px;color:var(--mx-dim);background:#16161a;border:1px solid var(--mx-border);border-radius:6px;padding:2px 5px;line-height:1.4;cursor:pointer;white-space:nowrap;transition:color .12s,border-color .12s}',
    '.mx-rbtn:hover{color:var(--mx-text);border-color:var(--mx-accent)}',
    '.mx-rbtn.active{color:var(--mx-accent2);border-color:var(--mx-accent)}',
    '.mx-particles{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:.9;z-index:-1}',
    '.mx-input{width:100%;background:#16161a;border:1px solid var(--mx-border);border-radius:8px;color:var(--mx-text);',
    'padding:8px 11px;font-size:13px;font-family:inherit;outline:none;transition:border-color .15s}',
    '.mx-input:focus{border-color:var(--mx-accent)}',
    '.mx-btn{width:100%;border:none;border-radius:8px;padding:10px;font-size:14px;font-weight:700;cursor:pointer;',
    'font-family:inherit;transition:filter .12s,transform .05s;color:#fff}',
    '.mx-btn:active{transform:translateY(1px)}',
    '.mx-btn-play{background:linear-gradient(135deg,var(--mx-accent),var(--mx-accent2));font-size:15px;padding:12px;',
    'box-shadow:0 6px 18px rgba(168,85,247,.35)}',
    'body.mx-reduce .mx-btn-play{box-shadow:none}',
    '.mx-btn-play:hover{filter:brightness(1.12)}',
    '.mx-btn-spec{background:#16161a;border:1px solid var(--mx-border)}',
    '.mx-btn-spec:hover{border-color:var(--mx-accent)}',
    '.mx-tabs{display:flex;gap:2px;margin-top:10px;padding:4px 2px;border-radius:12px;background:rgba(0,0,0,.35);border:1px solid var(--mx-border)}',
    '.mx-tab{flex:1;min-width:0;text-align:center;padding:8px 0;border-radius:9px;cursor:pointer;font-size:9.5px;font-weight:700;letter-spacing:.3px;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;',
    'color:var(--mx-dim);background:transparent;border:1px solid transparent;user-select:none;transition:color .15s,background .15s}',
    '.mx-tab:hover{color:var(--mx-text);background:rgba(255,255,255,.05)}',
    '.mx-tab.active{background:linear-gradient(135deg,var(--mx-accent),var(--mx-accent2));color:#fff;box-shadow:0 2px 10px rgba(0,0,0,.35)}',

    /* ---------- servers ---------- */
    '.mx-right{flex:1;min-width:0;flex-direction:column;padding:0;overflow:hidden}',
    '.mx-srv-head{display:flex;gap:7px;align-items:center;padding:11px 14px 8px}',
    '.mx-region{padding:6px 14px;border-radius:8px;background:#16161a;color:var(--mx-dim);font-weight:700;font-size:12px;cursor:pointer;border:1px solid transparent}',
    '.mx-region.active{background:var(--mx-accent);color:#fff}',
    '.mx-srv-cols{display:grid;grid-template-columns:1fr 95px 130px;padding:4px 16px;color:#777780;font-size:10px;',
    'letter-spacing:1.5px;text-transform:uppercase}',
    '.mx-srv-body{flex:1;overflow-y:auto;padding:0 8px 10px;min-height:180px;max-height:52vh}',
    '.mx-srv-body::-webkit-scrollbar{width:6px}',
    '.mx-srv-body::-webkit-scrollbar-thumb{background:#2a2a33;border-radius:3px}',
    '.mx-srv-row{display:grid;grid-template-columns:1fr 95px 130px;padding:8px 8px;border-radius:8px;cursor:pointer;',
    'font-size:13px;align-items:center;border:1px solid transparent}',
    '.mx-srv-row:hover{background:#16161a}',
    '.mx-srv-row.mx-sel{background:rgba(168,85,247,.16);border-color:rgba(168,85,247,.45)}',
    '.mx-srv-row.mx-sel .mx-srv-name{color:var(--mx-accent2);font-weight:700}',
    '.mx-srv-name{color:var(--mx-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.mx-srv-players{color:var(--mx-dim);font-size:12px;display:flex;gap:6px;align-items:center;justify-content:center;position:relative;min-width:0}',
    '.mx-srv-players b{color:var(--mx-text);font-weight:600}',
    '.mx-srv-mode{color:var(--mx-dim);font-size:11px;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    /* bots indicator chip on a server row */
    '.mx-bot-chip{flex:0 0 auto;font-size:9px;font-weight:800;letter-spacing:.5px;line-height:1;padding:3px 5px;border-radius:5px;',
    'color:var(--mx-accent2);background:rgba(168,85,247,.14);border:1px solid rgba(168,85,247,.35);user-select:none}',
    'body.mx-reduce .mx-bot-chip{background:transparent}',
    /* hover tooltip on the players cell — mirrors the native "Players: X / Bots: Y" info */
    '.mx-srv-players:after{content:attr(data-tip);position:absolute;right:calc(100% + 10px);top:50%;transform:translateY(-50%);',
    'background:#0b0b0e;border:1px solid rgba(168,85,247,.45);border-radius:8px;box-shadow:0 8px 22px rgba(0,0,0,.6);',
    'color:#ececf1;font-size:12px;font-weight:500;line-height:1.45;letter-spacing:0;text-transform:none;text-align:left;',
    'white-space:pre-line;padding:7px 11px;opacity:0;visibility:hidden;pointer-events:none;transition:opacity .12s ease;z-index:30}',
    '.mx-srv-players:hover:after{opacity:1;visibility:visible}',
    'body.mx-reduce .mx-srv-players:after{transition:none}',
    '.mx-srv-empty{padding:26px 10px;text-align:center;color:var(--mx-dim);font-size:13px}',

    /* ---------- settings ---------- */
    '.mx-pane-settings{padding:14px 16px;overflow-y:auto;max-height:56vh;display:flex;flex-direction:column;gap:12px}',
    '.mx-set-row{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:13px;padding:7px 0;min-height:34px}',
    '.mx-set-row label{color:var(--mx-dim)}',
    '.mx-select{background:var(--mx-panel);color:var(--mx-text);border:1px solid var(--mx-border);border-radius:8px;padding:5px 8px;font:600 12.5px var(--mx-font);outline:none}',
    '.mx-select:focus{border-color:var(--mx-accent)}',
    '.mx-select option{background:#141418;color:var(--mx-text)}',
    '.mx-swatch-row{display:flex;align-items:center;gap:9px;min-width:118px}',
    '.mx-swatch-row .mx-chex{width:26px;height:26px;border-radius:6px;border:1px solid var(--mx-border);flex:0 0 auto}',
    '#murther-root .mx-theme-canvas.hih{outline:2px solid var(--mx-accent);outline-offset:2px}',
    '.mx-theme-search{width:100%;background:rgba(255,255,255,.05);border:1px solid var(--mx-border);border-radius:8px;',
    'color:var(--mx-text);padding:9px 11px;font-size:12px;outline:none;font-family:var(--mx-font);margin-bottom:10px}',
    '.mx-theme-search::placeholder{color:var(--mx-dim)}',
    '.mx-tsec{padding-bottom:8px}',
    '.mx-tsec-body{padding-top:2px}',
    '.mx-tsec-head{display:flex;align-items:center;gap:8px;cursor:pointer;user-select:none;padding:4px 0}',
    '.mx-tsec-head:hover .mx-tsec-title{color:var(--mx-accent2)}',
    '.mx-tsec-chev{flex:0 0 auto;width:7px;height:7px;border-right:2px solid var(--mx-dim);border-bottom:2px solid var(--mx-dim);border-radius:1px;transform:rotate(45deg);transition:transform .15s,border-color .15s;margin-top:-3px}',
    '.mx-tsec-head:hover .mx-tsec-chev{border-color:var(--mx-accent2)}',
    '.mx-tsec.closed .mx-tsec-chev{transform:rotate(-45deg);margin-top:0}',
    '.mx-tsec.closed .mx-tsec-body{display:none}',
    '.mx-tsec-title{cursor:pointer}',
    '.mx-bk-part{display:flex;align-items:flex-start;gap:10px;padding:11px 0;border-bottom:1px solid rgba(255,255,255,.05)}',
    '.mx-bk-part .mx-sw{margin-top:2px}',
    '.mx-bk-part-label{font-weight:600;font-size:13px;color:var(--mx-text)}',
    '.mx-bk-part-desc{font-size:10.5px;color:var(--mx-dim);line-height:1.4;margin-top:2px}',
    '.mx-bk-size{font-size:11px;color:var(--mx-accent2);margin-top:8px}',
    '.mx-tsec+.mx-tsec{margin-top:18px}',
    '.mx-tsec-title{font-weight:700;font-size:13.5px;margin:0 0 2px;color:var(--mx-text);letter-spacing:.2px}',
    '.mx-trow{padding:12px 0;border-bottom:1px solid rgba(255,255,255,.05)}',
    '.mx-trow:last-child{border-bottom:none}',
    '.mx-trow-main{display:flex;align-items:center;justify-content:space-between;gap:14px}',
    '.mx-tlabel{font-size:13px;color:var(--mx-text);font-weight:500;line-height:1.45}',
    '.mx-hint{font-size:10.5px;color:var(--mx-dim);margin-top:4px;line-height:1.45}',
    '.mx-sw{position:relative;width:38px;height:20px;border-radius:10px;background:#26262e;cursor:pointer;transition:background .15s;flex:0 0 auto}',
    '.mx-sw:after{content:"";position:absolute;left:2px;top:2px;width:16px;height:16px;border-radius:50%;background:#666;transition:all .15s}',
    '.mx-sw.on{background:var(--mx-accent)}',
    '.mx-sw.on:after{left:20px;background:#fff}',
    '.mx-swatches{display:flex;gap:7px}',
    '.mx-swatch{width:24px;height:24px;border-radius:6px;cursor:pointer;border:2px solid transparent}',
    '.mx-swatch.sel{border-color:#fff}',
    '.mx-color{width:34px;height:26px;padding:0;border:1px solid var(--mx-border);border-radius:6px;background:#16161a;cursor:pointer}',
    '.mx-slider{accent-color:var(--mx-accent);width:130px}',
    '.mx-theme-actions{display:flex;gap:12px;margin-top:8px;padding-top:4px}',
    '.mx-mini{flex:1;padding:11px 10px;border-radius:9px;background:#16161a;border:1px solid var(--mx-border);color:var(--mx-text);cursor:pointer;font-family:inherit;font-size:12.5px;transition:border-color .15s,background .15s}',
    '.mx-mini:hover{border-color:var(--mx-accent);background:#1a1a20}',
    '.mx-mini-legacy{flex:1;padding:8px;border-radius:8px;background:#16161a;border:1px solid var(--mx-border);color:var(--mx-text);',
    'font-size:12px;cursor:pointer;font-family:inherit}',
    '.mx-kb{display:grid;grid-template-columns:1fr 110px;gap:8px;align-items:center;font-size:13px;padding:6px 0}',
    '.mx-kb button{background:#16161a;border:1px solid var(--mx-border);color:var(--mx-accent2);border-radius:6px;',
    'padding:6px;font-family:monospace;font-size:12px;cursor:pointer;transition:background .12s,border-color .12s,color .12s}',
    '.mx-kb button:hover{border-color:var(--mx-accent)}',
    '.mx-kb button.listen{background:var(--mx-accent);color:#fff;border-color:var(--mx-accent)}',
    '.mx-kb button.unbound{color:#6a6a74;border-color:rgba(255,255,255,.06)}',
    '.mx-kb button.gconf{color:#fbbf24;border-color:rgba(251,191,36,.45)}',
    '.mx-kb button.gconf.listen{background:var(--mx-accent);color:#fff;border-color:var(--mx-accent)}',
    /* game-owned gameplay bind rows + macro message column + N/A box */
    '.mx-kb.mx-kb-macro{grid-template-columns:1fr 96px 1.2fr}',
    '.mx-kb-macro button{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.mx-kb-static{background:#16161a;border:1px solid rgba(255,255,255,.06);color:var(--mx-dim);border-radius:6px;padding:6px;font-family:monospace;font-size:12px;text-align:center;user-select:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.mx-macro-msg{background:#16161a;border:1px solid var(--mx-border);border-radius:6px;color:var(--mx-text);padding:6px 9px;font-size:12px;font-family:inherit;outline:none;width:100%;min-width:0;transition:border-color .15s}',
    '.mx-macro-msg:focus{border-color:var(--mx-accent)}',
    '.mx-macro-msg:disabled{color:#6a6a74;cursor:default}',
    '.mx-kb button.gown{color:#93c5fd;border-color:rgba(147,197,253,.35)}',
    '.mx-kb button.gown:hover{border-color:#93c5fd}',
    '.mx-kb-na-btn{background:#16161a;border:1px dashed rgba(255,255,255,.12);color:#6a6a74;border-radius:6px;padding:6px;font-family:monospace;font-size:12px;text-align:center;user-select:none;width:110px;box-sizing:border-box}',
    '.mx-kb-sec{font-weight:700;font-size:13px;margin:10px 0 2px;color:var(--mx-text)}',
    '.mx-kb-note{font-size:10.5px;color:var(--mx-dim);line-height:1.4;background:rgba(255,255,255,.03);',
    'border:1px solid var(--mx-border);border-radius:8px;padding:8px 11px;margin-bottom:8px}',

    /* ---------- HUD shared ---------- */
    '.mx-hud{position:absolute;pointer-events:auto;font-family:var(--mx-font)}',
    '.mx-hidden{display:none!important}',

    /* ---------- stats strip (top-center: ID / Mass / Score / Cells) ---------- */
    '.mx-stats{left:50%;top:0;transform:translateX(-50%);display:flex;flex-wrap:nowrap;gap:1px;background:var(--mx-panel);',
    'border:1px solid var(--mx-border);border-top:none;border-radius:0 0 10px 10px;overflow:hidden;z-index:5;max-width:92vw;pointer-events:none}',
    '.mx-stats>div{padding:6px 14px;font-size:12px;font-weight:600;color:var(--mx-dim);display:flex;gap:6px;align-items:center;white-space:nowrap}',
    '.mx-stats b{color:var(--mx-text);font-weight:700}',
    '.mx-stats .mx-accent-t{color:var(--mx-accent2)}',
    /* native score panel adopted as the live stats strip; its Server/FPS/Ping lines
       are filtered out (that info moved to the chat connection strip) */
    '#murther-root #score-panel{position:static!important;display:flex!important;flex-wrap:nowrap;align-items:stretch;width:auto!important;min-width:0!important;height:auto!important;',
    'margin:0!important;padding:0!important;gap:0!important;color:var(--mx-dim)!important;background:transparent!important;border:none!important;box-shadow:none!important;transform:none!important;cursor:default!important;',
    'font-size:12px!important;font-weight:600!important;font-family:var(--mx-font)!important;pointer-events:none;user-select:none}',
    '#murther-root #score-panel p{margin:0!important;padding:6px 14px!important;line-height:1.35!important;white-space:nowrap;display:flex;align-items:center;gap:6px}',
    '#murther-root #score-panel p+p{border-left:1px solid var(--mx-border)}',
    '#murther-root #score-panel p[data-mx-hide="1"]{display:none!important}',
    '#murther-root #score-panel b,#murther-root #score-panel span{color:var(--mx-accent2)!important;font:inherit!important}',
    /* native extra strip (FPS / Spectators / Reset): replaced by the chat connection
       strip; kept in the DOM but never shown — its text is still parsed every tick */
    '#murther-root #extra-panel{display:none!important;visibility:hidden!important;pointer-events:none!important}',

    /* ---------- chat connection strip (FPS / Ping / Server, top of the chat) ---------- */
    '.mx-net{display:flex;flex-wrap:wrap;gap:4px;pointer-events:none;max-width:100%}',
    '.mx-net>div{padding:4px 12px;font-size:12px;font-weight:600;color:var(--mx-dim);display:flex;gap:6px;align-items:center;white-space:nowrap;',
    'background:var(--mx-panel);border:1px solid var(--mx-border);border-radius:8px}',
    '.mx-net b{color:var(--mx-text);font-weight:700}',
    '.mx-net .mx-accent-t{color:var(--mx-accent2)}',
    '.mx-net .mx-tb-server b{max-width:160px;overflow:hidden;text-overflow:ellipsis;display:inline-block;vertical-align:bottom}',
    /* connection net graph: 48-sample FPS/ping sparkline (Ryuten-style always-visible connection health) */
    '.mx-netgraph{width:64px;height:18px;flex:0 0 64px;image-rendering:auto}',
    /* icon copy buttons (server rows, stats ID chip) — pointer-events re-enabled per element */
    '.mx-cpy{pointer-events:auto;width:18px;height:18px;border:none;background:transparent;color:var(--mx-dim);cursor:pointer;padding:0;border-radius:4px;display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;transition:color .12s,background .12s}',
    '.mx-cpy:hover{color:var(--mx-accent2);background:rgba(255,255,255,.08)}',
    '.mx-srv-name-text{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}',
    '.mx-dot{width:7px;height:7px;border-radius:50%;background:#4ade80;display:inline-block}',
    '.mx-dot.warn{background:#facc15}.mx-dot.bad{background:#ef4444}',

    /* ---------- leaderboard ---------- */
    '.mx-lb{right:12px;top:12px;width:210px;border-radius:10px;background:var(--mx-panel);border:1px solid var(--mx-border);overflow:hidden;z-index:4;max-height:52vh}',
    '.mx-lb-body{overflow-y:auto}',
    '.mx-lb-head{padding:7px 12px;font-size:12px;font-weight:700;letter-spacing:1px;color:#fff;text-transform:uppercase;',
    'background:linear-gradient(90deg,rgba(168,85,247,.25),transparent);border-bottom:1px solid var(--mx-border);text-align:center}',
    '.mx-lb-body{padding:6px}',
    /* native leaderboard adopted, live (canvas keeps its game-drawn pixels) */
    '#murther-root #leaderboard-panel{position:static!important;display:block!important;width:100%!important;height:auto!important;',
    'margin:0!important;padding:0!important;color:var(--mx-text)!important;background:transparent!important;border:none!important;box-shadow:none!important;transform:none!important;pointer-events:none}',
    '#murther-root #leaderboard-header{display:none!important}',
    '#murther-root #leaderboard-canvas{display:block!important;width:100%!important;height:auto!important;margin:0 auto!important;',
    'max-height:46vh;object-fit:contain;background:transparent!important;border:none!important;border-radius:0!important}',

    /* ---------- minimap ---------- */
    '.mx-mm{right:12px;bottom:12px;border-radius:10px;background:var(--mx-panel);border:1px solid var(--mx-border);padding:6px;z-index:4}',
    '.mx-mm-body{position:relative;width:180px;height:180px}',
    '.mx-mm-body canvas{width:100%!important;height:100%!important;border-radius:6px;display:block}',
    '.mx-mm-coords{margin-top:4px;text-align:center;font-size:10px;color:var(--mx-dim);font-family:monospace}',
    /* native minimap adopted, live */
    '#murther-root #minimap-panel{position:static!important;display:block!important;width:180px!important;height:auto!important;',
    'margin:0!important;padding:0!important;background:transparent!important;border:none!important;box-shadow:none!important;transform:none!important;overflow:visible!important;pointer-events:none}',
    '#murther-root #minimap-panel canvas{width:100%!important;height:auto!important;border-radius:6px!important;display:block;aspect-ratio:1/1;object-fit:fill;background:#0a0c12!important}',
    '#murther-root #minimap-coordinates{margin-top:4px!important;text-align:center!important;font-size:10px!important;color:var(--mx-dim)!important;',
    'font-family:monospace!important;background:transparent!important;border:none!important;box-shadow:none!important;height:auto!important;width:auto!important;padding:0!important}',

    /* ---------- chat ---------- */
    '.mx-chat{left:12px;bottom:12px;width:340px;display:flex;flex-direction:column;gap:6px;z-index:5;font-family:var(--mx-font)}',
    '.mx-chat-body{height:170px;overflow-y:auto;border-radius:12px;background:var(--mx-panel);border:1px solid var(--mx-border);padding:9px 12px;backdrop-filter:blur(6px);box-shadow:0 6px 18px rgba(0,0,0,.35)}',
    '.mx-chat-body::-webkit-scrollbar{width:5px}',
    '.mx-chat-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,.14);border-radius:3px}',
    '.mx-chat-line{font-size:12.5px;line-height:1.55;word-wrap:break-word;color:#cfcfda;animation:mx-chat-in .18s ease-out}',
    '.mx-chat-line .mx-cn{font-weight:700;color:var(--mx-accent2)}',
    '@keyframes mx-chat-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}',
    '.mx-chat-tabs{display:flex;gap:5px}',
    '.mx-chat-tab{padding:4px 12px;border-radius:6px;font-size:11.5px;font-weight:600;background:var(--mx-panel);',
    'border:1px solid var(--mx-border);color:var(--mx-dim);cursor:pointer}',
    '.mx-chat-tab.active{background:rgba(168,85,247,.2);border-color:rgba(168,85,247,.5);color:#fff}',
    '.mx-chat-entry{display:flex;gap:6px;align-items:center;background:var(--mx-panel);border:1px solid var(--mx-border);border-radius:12px;padding:2px 8px;transition:border-color .15s,box-shadow .15s;backdrop-filter:blur(6px)}',
    '.mx-chat-entry input{flex:1;background:transparent;border:none;outline:none;color:var(--mx-text);font-size:13px;padding:8px 4px;font-family:var(--mx-font)}',
    '.mx-chat-entry:focus-within{border-color:var(--mx-accent);box-shadow:0 0 0 2px rgba(168,85,247,.18)}',
    /* native chat adopted, live (resizable pane with its own input) */
    '#murther-root #chat-panel{position:static!important;display:flex!important;flex-direction:column;gap:6px;width:100%!important;',
    'min-width:0!important;height:auto!important;max-height:46vh;margin:0!important;padding:0!important;background:transparent!important;border:none!important;',
    'box-shadow:none!important;transform:none!important;overflow:visible!important;font-family:var(--mx-font)!important}',
    '#murther-root #chat-panel #chat-container{position:static!important;display:block;width:100%!important;height:170px!important;',
    'min-height:80px!important;max-height:42vh!important;overflow-y:auto!important;overflow-x:hidden!important;border-radius:10px!important;background:var(--mx-panel)!important;',
    'border:1px solid var(--mx-border)!important;padding:8px 10px!important;resize:vertical;transform:none!important;backdrop-filter:none!important;box-shadow:none!important}',
    '#murther-root #chat-panel #chat-input{display:block;width:100%!important;min-width:0!important;margin:0!important;padding:8px 12px!important;background:var(--mx-panel)!important;',
    'border:1px solid var(--mx-border)!important;border-radius:10px!important;color:var(--mx-text)!important;font-size:13px!important;font-family:var(--mx-font)!important;outline:none}',
    '#murther-root #chat-panel #chat-input:focus{border-color:var(--mx-accent)!important;box-shadow:0 0 0 2px rgba(168,85,247,.18)!important}',
    '#murther-root #chat-panel #chat-container .chat-table{width:100%;border-collapse:collapse;background:transparent}',
    '#murther-root #chat-panel #chat-container td{color:#cfcfda!important;font-size:12.5px!important;line-height:1.5!important;padding:1px 0!important;white-space:normal;word-wrap:break-word;background:transparent!important;border:none!important}',
    '#murther-root #chat-panel #chat-container .chat-tab-container,#murther-root #chat-panel #chat-container #chat-tab-container{',
    'position:static!important;display:flex;gap:5px;flex-wrap:wrap;width:100%!important;height:auto!important;transform:none!important;background:transparent!important;',
    'border:none!important;padding:0;margin:0 0 4px}',
    '#murther-root #chat-panel #chat-container .chat-tab,#murther-root #chat-panel #chat-container #chat-tab-container .chat-tab{',
    'display:inline-block;padding:3px 10px;border-radius:6px;font-size:11.5px;font-weight:600;background:#16161a;border:1px solid var(--mx-border);color:var(--mx-dim);cursor:pointer}',
    '#murther-root #chat-panel #chat-container .chat-active-tab{background:rgba(168,85,247,.25);border-color:rgba(168,85,247,.5);color:#fff!important}',
    '#murther-root #chat-panel #chat-container::-webkit-scrollbar{width:5px}',
    '#murther-root #chat-panel #chat-container::-webkit-scrollbar-thumb{background:rgba(255,255,255,.14);border-radius:3px}',
    '#murther-root #chat-panel .chat-resize,#murther-root #chat-panel #chat-resize,#murther-root #chat-panel #chat-emote-btn{display:none}',

    /* ---------- party (native panel adopted) ---------- */
    '.mx-party{left:12px;top:96px;display:flex;flex-direction:column;gap:4px;z-index:4;max-width:230px}',
    '.mx-party-head{padding:6px 12px;font-size:11px;font-weight:700;letter-spacing:1px;color:#fff;text-transform:uppercase;',
    'background:linear-gradient(90deg,rgba(168,85,247,.25),transparent);border:1px solid var(--mx-border);border-radius:10px;text-align:center}',
    '.mx-party[data-empty="1"]{display:none}',
    '#murther-root #party-panel{position:static!important;display:block!important;width:fit-content!important;max-width:280px!important;height:auto!important;margin:0!important;padding:6px 10px!important;',
    'background:var(--mx-panel)!important;border:1px solid var(--mx-border)!important;border-radius:10px!important;color:var(--mx-text)!important;box-shadow:none!important;transform:none!important;top:auto!important;left:auto!important;right:auto!important;bottom:auto!important;',
    'font-size:12.5px!important;font-weight:600!important;font-family:var(--mx-font)!important}',
    '#murther-root #party-panel p{margin:1px 0!important;white-space:nowrap;line-height:1.4;color:#cfcfda!important}',
    '#murther-root #party-panel b,#murther-root #party-panel span{color:var(--mx-accent2)!important;font:inherit!important}',

    /* ---------- menu chip ---------- */
    '.mx-chip{position:absolute;left:12px;top:12px;width:34px;height:34px;border-radius:9px;pointer-events:auto;cursor:pointer;',
    'background:linear-gradient(135deg,var(--mx-accent),var(--mx-accent2));color:#fff;font-weight:800;font-size:15px;',
    'display:flex;align-items:center;justify-content:center;font-family:var(--mx-font);z-index:2147483600;border:none;',
    'box-shadow:0 4px 14px rgba(168,85,247,.4)}',

    /* ---------- in-game menu-open state ---------- */
    'body.mx-in-menu #canvas{filter:blur(6px) brightness(.55)}',
    'body.mx-reduce.mx-in-menu #canvas{filter:brightness(.55)}',
    'body.mx-in-menu .mx-stats,body.mx-in-menu .mx-lb,body.mx-in-menu .mx-mm,body.mx-in-menu .mx-chat,body.mx-in-menu .mx-party,body.mx-in-menu .mx-chip{display:none!important}',
    'body.mx-reduce:not(.mx-in-menu) .mx-net,body.mx-reduce:not(.mx-in-menu) .mx-mm-coords{display:none!important}',
    'body.mx-reduce:not(.mx-in-menu) .mx-stats{opacity:.35}',
    'body.mx-reduce .mx-particles{display:none!important}',
    /* ---------- boot cover ---------- */
    '#mx-boot-cover{position:fixed!important;inset:0!important;z-index:2147483600!important;background:#121016!important;',
    'display:flex!important;align-items:center!important;justify-content:center!important;flex-direction:column!important;gap:14px!important}',
    '#mx-boot-cover .mx-bc-bar{width:180px;height:3px;border-radius:2px;background:rgba(255,255,255,.08);overflow:hidden}',
    '#mx-boot-cover .mx-bc-bar i{display:block;width:40%;height:100%;border-radius:2px;background:linear-gradient(90deg,var(--mx-accent),var(--mx-accent2));animation:mxbcSlide 1.1s ease-in-out infinite}',
    '@keyframes mxbcSlide{0%{transform:translateX(-100%)}100%{transform:translateX(450%)}}',
    '#mx-boot-cover .mx-bc-txt{color:#8f8ba0;font:600 12px var(--mx-font,system-ui,sans-serif);letter-spacing:.4px}',
    /* the game replaced #main and its ghost rules with it: park the old node off-screen so */
    /* the native menu never flashes back while Murther re-adopts it                          */
    '.mx-ghost-dead{position:fixed!important;left:-99999px!important;top:0!important;opacity:0!important;pointer-events:none!important;z-index:-1!important}',

    /* ---------- ghosted natives (inline-styled at runtime; rules here are just a fallback) ---------- */
    '.mx-ghost{position:fixed!important;left:-99999px!important;top:0!important;opacity:0!important;pointer-events:none!important;z-index:-1!important}',

    /* ---------- responsive ---------- */
    '@media (max-width:920px), (max-height:700px){',
    '.mx-menu{flex-direction:column;overflow-y:auto;width:min(500px,92vw)}',
    '.mx-left{flex:0 0 auto;width:auto}',
    '.mx-right{min-height:260px}',
    '.mx-srv-body{max-height:34vh}',
    '.mx-pane-settings{max-height:38vh}',
    '.mx-lb{width:170px;top:12px}',
    '.mx-mm-body{width:140px;height:140px}',
    '#murther-root .mx-mm #minimap-panel{width:140px!important;height:auto!important}',
    '.mx-chat{width:280px}',
    '.mx-party{max-width:220px}',
    '#murther-root #party-panel{max-width:220px}',
    '}'
  ].join('\n');

  var styleTag = null;
  // Boot cover: from document-start, a full-viewport blank swallows the native UI
  // (menu + canvas) so a refresh never flashes the native client before the boot
  // gate passes and buildAll() swaps the UI in. Strictly CF-safe: stays hidden
  // while a challenge page is up, and a 20s failsafe removes it no matter what.
  var bootCover = null;
  function removeBootCover() {
    if (bootCover) { try { bootCover.remove(); } catch (e) {} bootCover = null; }
  }
  function armBootCover() {
    if (bootCover || cfChallengePage()) return;   // captcha page: stay invisible
    bootCover = DOC.createElement('div');
    bootCover.id = 'mx-boot-cover';
    bootCover.innerHTML = '<div class="mx-bc-bar"><i></i></div><div class="mx-bc-txt">Murther</div>';
    (DOC.body || DOC.documentElement).appendChild(bootCover);
    setTimeout(removeBootCover, 20000);            // failsafe: never trap the user
  }
  function injectStyle() {
    styleTag = DOC.createElement('style');
    styleTag.id = 'murther-style';
    styleTag.textContent = CSS;
    (DOC.head || DOC.documentElement).appendChild(styleTag);
  }

  function applyMenuScale() {
    var scale = clamp(parseFloat(S.menuScale), 0.8, 1.1) || 0.94;
    if (scale === 1) scale = 0.999;   // keep .mx-zoom active so the layout is identical either way
    DOC.body.classList.add('mx-zoom');
    DOC.documentElement.style.setProperty('--mx-menu-scale', String(scale));
  }

  function applyTheme() {
    var r = DOC.documentElement.style;
    r.setProperty('--mx-accent', S.accent);
    applyMenuScale();
    r.setProperty('--mx-accent2', S.accent2);
    r.setProperty('--mx-pop', String(S.panelOpacity));
    DOC.body.classList.toggle('mx-reduce', !!S.reduceEffects);
    if (S.reduceEffects) stopParticles();
    else if (menuOpen) { stopParticles(); try { startParticles(); } catch (e) {} }
    [
      ['topbar', '.mx-net'], ['score', '.mx-stats'], ['leaderboard', '.mx-lb'],
      ['minimap', '.mx-mm'], ['chat', '.mx-chat'], ['party', '.mx-party']
    ].forEach(function (p) {
      var n = $(p[1]);
      if (n) {
        var zeroOp = S.customTheme && parseFloat(
          S.hud[p[0] === 'leaderboard' ? 'lbOpacity' : p[0] === 'chat' ? 'chatOpacity' : 'mmOpacity']
        ) === 0;
        n.classList.toggle('mx-hidden', S.panels[p[0]] === false || zeroOp);
      }
    });
    applyHudTheme();
    save();
  }

  // -------- Custom Theme engine (HUD styling + world canvas) --------
  function applyHudTheme() {
    if (!$('body')) return;
    var hud = S.hud || {}, t = S.theme || {}, on = !!S.customTheme;
    function hudCss(sel, op, blur) {
      if (!on) return '';
      var c = [];
      if (parseFloat(op) < 1) c.push('opacity:' + clamp(parseFloat(op), 0, 1));
      if (parseInt(blur, 10) > 0) c.push('backdrop-filter:blur(' + parseInt(blur, 10) + 'px)');
      return c.length ? sel + '{' + c.join(';') + ' !important}' : '';
    }
    var hs = $('#murther-hud-style');
    if (!hs) {
      hs = DOC.createElement('style');
      hs.id = 'murther-hud-style';
      (DOC.head || DOC.documentElement).appendChild(hs);
    }
    hs.textContent = [
      hudCss('#murther-root .mx-lb', hud.lbOpacity, hud.lbBlur),
      hudCss('#murther-root .mx-chat', hud.chatOpacity, hud.chatBlur),
      hudCss('#murther-root .mx-mm', hud.mmOpacity, hud.mmBlur),
      on && hud.lbHiParty ? '#murther-root .mx-party{box-shadow:0 0 0 2px ' + hud.lbHiParty + ' !important}' : '',
      on && hud.partyLeader ? '#murther-root .mx-party-head{color:' + hud.partyLeader + ' !important}' : '',
      on && hud.lbHi ? '#murther-root .mx-lb{box-shadow:inset 0 -3px 0 ' + hud.lbHi + ' !important}' : ''
    ].join('\n');
    applyWorldTheme();
  }

  function applyWorldTheme() {
    var t = S.theme || {}, on = !!S.customTheme;
    var live = on && (parseFloat(t.bgOpacity) > 0 || t.gridShow || t.tracers);
    DOC.body.classList.toggle('mx-theme-live', !!live);
    var c = $('#murther-theme-canvas');
    if (!live) {
      if (c) c.getContext('2d').clearRect(0, 0, c.width, c.height);
      var wx0 = $('#murther-world-style');
      if (wx0) wx0.textContent = '';
      return;
    }
    if (!c) {
      c = DOC.createElement('canvas');
      c.id = 'murther-theme-canvas';
      c.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:2147482990';
      (DOC.body || DOC.documentElement).appendChild(c);
    }
    var w = window.innerWidth || DOC.documentElement.clientWidth;
    var h = window.innerHeight || DOC.documentElement.clientHeight;
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    var x = c.getContext('2d');
    x.clearRect(0, 0, w, h);
    if (parseFloat(t.bgOpacity) > 0) {
      x.globalAlpha = clamp(parseFloat(t.bgOpacity), 0, 1);
      x.fillStyle = t.bg || '#121212';
      x.fillRect(0, 0, w, h);
    }
    if (t.gridShow) drawA1Grid(x, w, h, t);
    if (t.tracers) drawTracers(x, w, h, t);
    x.globalAlpha = 1;
    var wx = $('#murther-world-style');
    if (!wx) {
      wx = DOC.createElement('style');
      wx.id = 'murther-world-style';
      (DOC.head || DOC.documentElement).appendChild(wx);
    }
    wx.textContent = [
      'body.mx-theme-live #canvas{background:' + (t.bg || '#121212') + ' !important}',
      'body.mx-theme-live #canvas{box-shadow:inset 0 0 0 ' + clamp(parseInt(t.borderSize, 10) || 0, 0, 200) + 'px ' + (t.border || '#FF0000') + ' !important}'
    ].join('\n');
  }

  function drawA1Grid(x, w, h, t) {
    if (t.gridStyle === 'none') return;
    var cols = clamp(parseInt(t.gridCols, 10) || 4, 1, 64), rows = clamp(parseInt(t.gridRows, 10) || 4, 1, 64);
    var cw = w / cols, ch = h / rows;
    x.save();
    x.globalAlpha = clamp(parseFloat(t.gridOpacity), 0, 1) * 0.9;
    if (t.gridStyle === 'checker') {
      x.fillStyle = t.gridColor || '#FF0000';
      for (var i = 0; i < cols; i++) for (var j = 0; j < rows; j++) {
        if ((i + j) % 2 === 0) x.fillRect(i * cw, j * ch, cw, ch);
      }
    } else {
      x.strokeStyle = t.gridColor || '#FF0000';
      x.lineWidth = clamp(parseFloat(t.gridThickness), 0.5, 12) || 1;
      for (var i2 = 0; i2 <= cols; i2++) { x.beginPath(); x.moveTo(i2 * cw, 0); x.lineTo(i2 * cw, h); x.stroke(); }
      for (var j2 = 0; j2 <= rows; j2++) { x.beginPath(); x.moveTo(0, j2 * ch); x.lineTo(w, j2 * ch); x.stroke(); }
    }
    if (t.gridLabels) {
      var names = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      x.globalAlpha = clamp(parseFloat(t.gridOpacity), 0, 1);
      x.fillStyle = t.gridLabelColor || '#FFFFFF';
      x.font = (t.gridLabelSize || 18) + 'px ' + (t.gridLabelFont || 'Verdana');
      for (var c2 = 0; c2 < cols; c2++) {
        var lab = names[c2 % 26] + String(c2 + 1);
        for (var r2 = 0; r2 < rows; r2++) x.fillText(lab, c2 * cw + 6, r2 * ch + (t.gridLabelSize || 18));
      }
    }
    x.restore();
  }

  function drawTracers(x, w, h, t) {
    var pos = [];
    try { pos = (window.__murtherCells && window.__murtherCells()) || []; } catch (e) {}
    if (!pos.length) return;
    x.save();
    x.globalAlpha = clamp(parseFloat(t.tracerOpacity), 0, 100) / 100 * 0.9;
    x.strokeStyle = t.tracerColor || '#FFFFFF';
    x.lineWidth = clamp(parseFloat(t.tracerThickness), 1, 10) || 2;
    var cx = w / 2, cy = h / 2;
    pos.forEach(function (c) {
      if (c && isFinite(c.x) && isFinite(c.y)) { x.beginPath(); x.moveTo(cx, cy); x.lineTo(clamp(c.x, 0, w), clamp(c.y, 0, h)); x.stroke(); }
    });
    x.restore();
  }

  /* ---------- macOS crosshair pointer ---------- */
  // A fine + with a small gap at the hot point, drawn in the user's chosen color
  // and size. The image ships as a runtime-rasterized PNG data-URL because
  // Chromium on macOS silently drops SVG cursor images at the platform layer (the
  // rule parses, then renders an invisible pointer); PNG is universally supported
  // and the `crosshair` keyword stays as the last-ditch fallback. Over Murther's
  // own open menu the pointer reverts to the normal arrow, so UI stays precise;
  // the crosshair re-engages everywhere else. Everything is forced with
  // !important and re-asserted every second, so it can never disappear until the
  // user turns the setting off in Murther's Settings tab.
  function drawCrosshair(color, size) {
    var c = DOC.createElement('canvas');
    c.width = size; c.height = size;
    var x = c.getContext('2d');
    if (!x) return null;
    var h = size / 2, arm = size / 2 - Math.max(1.5, size / 16), w = Math.max(1.4, size / 11);
    x.strokeStyle = color; x.lineWidth = w; x.lineCap = 'round';
    x.beginPath();
    x.moveTo(h, h - arm); x.lineTo(h, h + arm);
    x.moveTo(h - arm, h); x.lineTo(h + arm, h);
    x.stroke();
    return c.toDataURL('image/png');
  }
  var crosshairPngCache = { color: '', size: 0, url: '' };
  function crosshairCursor() {
    var color = S.crosshairColor || '#ffffff';
    var size = clamp(parseInt(S.crosshairSize, 10) || 24, 16, 48);
    if (crosshairPngCache.url && crosshairPngCache.color === color && crosshairPngCache.size === size) {
      return 'url("' + crosshairPngCache.url + '") ' + (size / 2) + ' ' + (size / 2) + ', crosshair';
    }
    try {
      var png = drawCrosshair(color, size);
      if (png) crosshairPngCache = { color: color, size: size, url: png };
      var u = png
        ? 'url("' + png + '") ' + (size / 2) + ' ' + (size / 2)
        : 'url("data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><g fill="none" stroke="' + color + '" stroke-linecap="round"><line x1="12" y1="2.5" x2="12" y2="21.5"/><line x1="2.5" y1="12" x2="21.5" y2="12"/></svg>') + '") 12 12';
      return u + ', crosshair';
    } catch (e) {
      return 'crosshair';
    }
  }
  // PixiJS's EventSystem writes canvas.style.cursor='default' on every mousemove,
  // so #canvas needs a same-origin-value inline stamp; a <style> tag with !important
  // wins the cascade but is re-asserted on the 1s integrity pass in case the tag is
  // stripped by DOM rebuilds. While Murther's menu is open under the pointer
  // (.mx-hot) the global !important rule swaps to a menu-scoped cursor:auto so the
  // normal arrow returns over the UI.
  function applyCursor() {
    if (!S.crosshair) {                       // fast path: full teardown
      var t0 = DOC.getElementById('mx-cursor-style');
      if (t0) t0.textContent = '';
      var s0 = DOC.getElementById('mx-canvas-cursor');
      if (s0) s0.textContent = '';
      DOC.documentElement.classList.remove('mx-crosshair');
      DOC.body.classList.remove('mx-crosshair', 'mx-hot');
      var c0 = N.canvas || DOC.getElementById('canvas');
      try { if (c0) c0.style.setProperty('cursor', '', 'important'); } catch (e) {}
      return;
    }
    var overMurther = !!(menuEl && menuEl.classList.contains('mx-hot'));
    var t = DOC.getElementById('mx-cursor-style');
    if (!t) {
      t = DOC.createElement('style');
      t.id = 'mx-cursor-style';
      (DOC.head || DOC.documentElement).appendChild(t);
    }
    t.textContent = overMurther
      ? '.mx-crosshair .mx-menu,.mx-crosshair .mx-menu *{cursor:auto !important}'
      : '.mx-crosshair, .mx-crosshair *{cursor:' + crosshairCursor() + ' !important}' +
        '.mx-crosshair input, .mx-crosshair textarea{cursor:text !important}';
    var stamp = DOC.getElementById('mx-canvas-cursor');
    if (stamp) {
      stamp.textContent = '#canvas,#canvas-container{cursor:' + crosshairCursor() + ' !important}';
    }
    DOC.documentElement.classList.add('mx-crosshair');
    DOC.body.classList.add('mx-crosshair');
    var cv = N.canvas || DOC.getElementById('canvas');
    try { if (cv) cv.style.setProperty('cursor', crosshairCursor(), 'important'); } catch (e) {}
    save();
  }

  /* ============================== discovery ============================== */
  // True native gota.io IDs/classes, verified from the site's shipped CSS (Ci3kQZaT.css):
  // #main #name-box #id-box #btn-play #btn-spec #main-servers .server-row .server-tab #server-tab-container
  // #server-content #score-panel #leaderboard-panel #leaderboard-canvas #leaderboard-header
  // #minimap-panel #minimap-canvas #minimap-coordinates #chat-panel #chat-container #chat-input
  // #chat-tab-container .chat-tab .chat-active-tab #canvas #canvas-container #extra-panel #logo #party-panel
  var N = {}; // native node registry
  function discover() {
    var ids = ['main', 'name-box', 'id-box', 'btn-play', 'btn-spec', 'main-servers', 'server-tab-container',
      'server-content', 'score-panel', 'leaderboard-panel', 'leaderboard-canvas', 'leaderboard-header',
      'minimap-panel', 'minimap-canvas', 'minimap-coordinates', 'chat-panel', 'chat-container', 'chat-input',
      'chat-tab-container', 'canvas-container', 'canvas', 'extra-panel', 'logo', 'main-right', 'main-side',
      'party-panel'];
    ids.forEach(function (id) { N[id] = DOC.getElementById(id); });

    // The game canvas can be moved (or recreated) by the engine; fall back to a
    // document-wide lookup so the cursor rules always have a live target.
    if (!N.canvas || !N.canvas.isConnected) N.canvas = DOC.getElementById('canvas');

    N.serverRows = $all('.server-row');
    N.serverTabs = $all('.server-tab');
    N.chatTabs = $all('.chat-tab');
    return !!(N.main || N['btn-play']);
  }

  /* ============================== menu ============================== */
  var menuEl = null, menuTab = 'servers', menuOpen = true;
  var UI = {}; // murther nodes

  function buildMenu() {
    menuEl = el('div', 'mx-menu', UI.root);
    // Instant cursor handoff while the crosshair is active: hovering any part of
    // the menu reverts to the normal arrow, leaving re-engages the crosshair.
    // (The 1s heal pass re-applies the same state as a backstop.)
    on(menuEl, 'mouseenter', function () { if (S.crosshair) { menuEl.classList.add('mx-hot'); applyCursor(); } });
    on(menuEl, 'mouseleave', function () { if (menuEl.classList.contains('mx-hot')) { menuEl.classList.remove('mx-hot'); applyCursor(); } });
    var left = el('div', 'mx-card mx-left mx-click', menuEl);

    var logo = el('div', 'mx-logo', left);
    logo.innerHTML = '<span class="mx-word">MURT<b>H</b>ER</span>';

    // Renderer quick-switch: two buttons at the logo's left. Selection applies on
    // the next page load (Pixi picks its renderer once, at init).
    var rend = el('div', 'mx-renderer', logo);
    var rbtns = {};
    function paintRendBtns() {
      rbtns.webgl.classList.toggle('active', S.renderer !== 'webgpu');
      rbtns.webgpu.classList.toggle('active', S.renderer === 'webgpu');
    }
    [['webgl', 'WebGL', 'Default renderer — best compatibility, always available. Click to make it the selected renderer.'],
     ['webgpu', 'WebGPU', 'Experimental renderer — enable only if your browser supports it. Applies after reload.']].forEach(function (d) {
      var b = el('button', 'mx-rbtn', rend);
      txt(b, d[1]);
      b.title = d[2];
      rbtns[d[0]] = b;
      on(b, 'click', function () {
        if (d[0] === 'webgpu' && !navigator.gpu) { toast('WebGPU is not supported in this browser — staying on WebGL', 'bad'); return; }
        S.renderer = d[0];
        save();
        paintRendBtns();
        if (UI.renderStatus) UI.renderStatus();
        toast('Renderer: ' + d[1] + (d[0] === 'webgpu' ? ' — applies after reload' : ' (default)'));
      });
    });
    paintRendBtns();
    UI.paintRendBtns = paintRendBtns;

    if (VERSION) {
      var ver = el('span', 'mx-ver', logo);
      ver.textContent = 'v' + VERSION;
      ver.title = 'Murther client version';
    }
    // wordmark centered: buttons left, badge right
    logo.insertBefore(rend, logo.firstChild);

    // Shadow inputs: natives (#name-box/#id-box) stay inside #main; Murther edits its
    // own fields and mirrors values into the natives on every keystroke.
    var nameShadow = el('input', 'mx-input', left);
    nameShadow.placeholder = 'Nick';
    nameShadow.maxLength = 15;
    UI.nameShadow = nameShadow;
    var idShadow = el('input', 'mx-input', left);
    idShadow.placeholder = 'Tag';
    idShadow.maxLength = 5;
    UI.idShadow = idShadow;
    on(nameShadow, 'input', function () { pushIdentity(); });
    on(idShadow, 'input', function () { pushIdentity(); });

    // Shadow controls: the native buttons stay inside #main (their handlers are wired
    // there); Murther shows its own buttons and forwards activation to the natives.
    var play = el('button', 'mx-btn mx-btn-play', left);
    txt(play, 'Play');
    on(play, 'click', function () { forwardPlay(); });
    UI.playBtn = play;

    var spec = el('button', 'mx-btn mx-btn-spec', left);
    txt(spec, 'Spectate');
    on(spec, 'click', function () { forwardSpectate(); });
    UI.specBtn = spec;

    var tabs = el('div', 'mx-tabs', left);
    ['servers', 'settings', 'gameplay', 'hotkeys', 'themes', 'backup'].forEach(function (t) {
      var b = el('div', 'mx-tab' + (t === menuTab ? ' active' : ''), tabs);
      txt(b, t[0].toUpperCase() + t.slice(1));
      on(b, 'click', function () {
        menuTab = t;
        $all('.mx-tab', tabs).forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        showTab(t);
      });
    });

    // right panel: servers / settings / hotkeys views
    var right = el('div', 'mx-card mx-right mx-click', menuEl);
    UI.serverView = el('div', 'mx-server-view', right);
    UI.settingsView = el('div', 'mx-pane-settings', right);
    UI.settingsView.classList.add('mx-hidden');
    UI.gameplayView = el('div', 'mx-pane-settings', right);
    UI.gameplayView.classList.add('mx-hidden');
    UI.hotkeysView = el('div', 'mx-pane-settings', right);
    UI.hotkeysView.classList.add('mx-hidden');
    UI.themesView = el('div', 'mx-pane-settings mx-themes', right);
    UI.themesView.classList.add('mx-hidden');
    UI.backupView = el('div', 'mx-pane-settings', right);
    UI.backupView.classList.add('mx-hidden');

    buildServerView(UI.serverView);
    buildSettingsView(UI.settingsView);
    buildGameplayView(UI.gameplayView);
    buildHotkeysView(UI.hotkeysView);
    buildThemesView(UI.themesView);
    buildBackupView(UI.backupView);
    showTab(menuTab);
    // defer until the card has laid out, so the canvas is sized to the real logo area
    setTimeout(startParticles, 80);
  }

  function showTab(t) {
    if (!UI.serverView) return;
    UI.serverView.classList.toggle('mx-hidden', t !== 'servers');
    UI.settingsView.classList.toggle('mx-hidden', t !== 'settings');
    UI.gameplayView.classList.toggle('mx-hidden', t !== 'gameplay');
    UI.hotkeysView.classList.toggle('mx-hidden', t !== 'hotkeys');
    UI.themesView.classList.toggle('mx-hidden', t !== 'themes');
    UI.backupView.classList.toggle('mx-hidden', t !== 'backup');
    if (t === 'servers') syncServerRows();
    if (t === 'settings' && UI.syncCrosshairRows) UI.syncCrosshairRows();
  }

  var currentRegion = null;   // region key matching the native tab's own label
  var regionOrder = [];       // ['eu','na'] as discovered from the native tabs

  // Regions hidden from Murther's UI entirely (pills + collection). gota ships
  // an ASIA PACIFIC tab we deliberately do not show.
  var HIDDEN_REGIONS = ['ap'];
  var REGION_LABELS = { eu: 'EUROPE', na: 'NORTH AMERICA', ap: 'ASIA PACIFIC' };
  function nativeRegionKey(tab) {
    // Derive the region key from the tab itself (its data-region attr or text),
    // normalized to canonical keys so scope lookups and comparisons are stable.
    var t = (tab.getAttribute('data-region') || tab.textContent || '').trim().toLowerCase();
    if (/^eu(|$)|europe/.test(t)) return 'eu';
    if (/^na(|$)|north|america/.test(t)) return 'na';
    if (/^ap(|$)|asia|pacific/.test(t)) return 'ap';
    return t || ('tab' + regionOrder.length);
  }
  function regionVisible(k) { return HIDDEN_REGIONS.indexOf(k) === -1; }

  function discoverRegions() {
    var tabs = $all('#server-tab-container .server-tab');
    if (!tabs.length) tabs = N.serverTabs || [];
    var keys = [];
    tabs.forEach(function (t) {
      var k = nativeRegionKey(t);
      t.setAttribute('data-mx-region', k);
      if (keys.indexOf(k) === -1 && regionVisible(k)) keys.push(k);
    });
    if (keys.length) regionOrder = keys;
    if (currentRegion === null || regionOrder.indexOf(currentRegion) === -1) {
      // keep whatever the game has selected, else first visible region
      var act = $('.server-tab-active', N['server-tab-container']) || $('.chat-active-tab');
      var actKey = act ? nativeRegionKey(act) : null;
      currentRegion = (actKey && regionOrder.indexOf(actKey) !== -1) ? actKey : (regionOrder[0] || 'eu');
    }
  }

  function buildServerView(host) {
    var head = el('div', 'mx-srv-head', host);
    UI.regionBtns = {};
    UI.regionHead = head;
    renderRegionPills();
    var cols = el('div', 'mx-srv-cols', host);
    ['Name', 'Players', 'Mode'].forEach(function (c, i) {
      var d = el('div', '', cols);
      d.textContent = c;
      if (i === 2) d.style.textAlign = 'right';
    });
    UI.srvBody = el('div', 'mx-srv-body', host);
  }

  function renderRegionPills() {
    discoverRegions();
    if (!UI.regionHead) return;
    // Skip the rebuild when labels/order/active pill are unchanged, so hovering a
    // pill doesn't flicker on the 500ms sync tick.
    var sig = regionOrder.join('\u0001') + '|' + currentRegion;
    if (sig === UI.regionPillSig) return;
    UI.regionPillSig = sig;
    UI.regionHead.innerHTML = '';
    UI.regionBtns = {};
    regionOrder.forEach(function (r) {
      var b = el('div', 'mx-region' + (r === currentRegion ? ' active' : ''), UI.regionHead);
      txt(b, REGION_LABELS[r] || r.toUpperCase());
      UI.regionBtns[r] = b;
      on(b, 'click', function () {
        currentRegion = r;
        Object.keys(UI.regionBtns).forEach(function (k) {
          UI.regionBtns[k].classList.toggle('active', k === r);
        });
        lastPillClickAt = Date.now();
        activateNativeRegion(r);
        [120, 450, 900, 1500].forEach(function (d) { setTimeout(syncServerRows, d); });
      });
    });
  }

  function activateNativeRegion(r) {
    // Click the native tab that carries this exact region key.
    var tabs = $all('#server-tab-container .server-tab');
    for (var i = 0; i < tabs.length; i++) {
      if ((tabs[i].getAttribute('data-mx-region') || nativeRegionKey(tabs[i])) === r) {
        try { tabs[i].click(); } catch (e) {}
        return true;
      }
    }
    return false;
  }

  /*
   * Native server list (CvtptewX.js) renders one players cell per row with the raw
   * count, and exposes the exact breakdown as title="Players: X\nBots: Y" on that
   * cell (row-level title/aria-label as fallback). We mirror the cell text verbatim
   * — never reformat — so counts always match play.gota.io, and we update rows by
   * diffing so hover tooltips never flicker.
   */
  function parseBots(title, rowText) {
    var t = String(title || '');
    var m = /bots?\s*[:=]\s*(\d+)/i.exec(t);
    if (m) return parseInt(m[1], 10);
    m = /players?\s*[:=]\s*(\d+)/i.exec(t);
    if (m) {
      var n = parseInt(m[1], 10);
      var rm = /(\d+)/.exec(String(rowText || '').replace(/[\s\u00a0]/g, ''));
      if (rm && parseInt(rm[1], 10) > n) return parseInt(rm[1], 10) - n;
    }
    return 0;
  }

  function cellText(row, cls, idx) {
    var c = $('.' + cls, row) || row.children[idx];
    return c ? (c.textContent || '').trim() : '';
  }

  function nativeTitleOf(row) {
    var pc = $('.server-table-players', row) || row.children[1];
    if (pc && pc.title) return pc.title;
    return row.title || row.getAttribute('aria-label') || '';
  }

  function rowSignature(row) {
    return cellText(row, 'server-table-name', 0) + '\u0001' +
      cellText(row, 'server-table-players', 1) + '\u0001' +
      parseBots(nativeTitleOf(row), cellText(row, 'server-table-players', 1)) + '\u0001' +
      cellText(row, 'server-table-mode', 2) + '\u0001' +
      (row.classList.contains('server-selected') ? 1 : 0);
  }

  function playersTip(players, bots) {
    return 'Players: ' + players + '\nBots: ' + bots;
  }

  function botChip(host, bots) {
    var chip = $('.mx-bot-chip', host);
    if (bots > 0) {
      if (!chip) chip = el('span', 'mx-bot-chip', host);
      txt(chip, 'BOT ×' + bots);
    } else if (chip) chip.remove();
  }

  function ensureEmptyState() {
    if (!UI.srvBody) return;
    var empty = $('.mx-srv-empty', UI.srvBody);
    var has = $all('.mx-srv-row', UI.srvBody).length > 0;
    if (!has && !empty) txt(el('div', 'mx-srv-empty', UI.srvBody), 'No servers found — waiting for the native list…');
    else if (has && empty) empty.remove();
  }

  function makeRow(row, selectedName) {
    var name = cellText(row, 'server-table-name', 0);
    var players = cellText(row, 'server-table-players', 1);
    var mode = cellText(row, 'server-table-mode', 2);
    var bots = parseBots(nativeTitleOf(row), players);
    var r = el('div', 'mx-srv-row');
    if (row.classList.contains('server-selected') || (selectedName && name.toLowerCase() === selectedName)) r.classList.add('mx-sel');
    var c1 = el('div', 'mx-srv-name', r);
    var c1t = el('span', 'mx-srv-name-text', c1); txt(c1t, name);
    var c1b = el('button', 'mx-cpy mx-click', c1);
    c1b.type = 'button';
    c1b.innerHTML = '<span class="mx-if mx-if-copy" aria-hidden="true"></span>';
    c1b.title = 'Copy server name';
    on(c1b, 'click', function (ev) {
      ev.stopPropagation();   // must not select the server row
      copyText(name, 'Server name copied: ' + name);
    });
    var c2 = el('div', 'mx-srv-players', r);
    var tip = playersTip(players, bots);
    c2.setAttribute('data-tip', tip);
    c2.title = tip; // native-equivalent fallback tooltip
    c2.innerHTML = '<b>' + esc(players) + '</b>';
    botChip(c2, bots);
    var c3 = el('div', 'mx-srv-mode', r); txt(c3, mode || 'FFA');
    r.setAttribute('data-mx-name', name);
    r.setAttribute('data-sig', rowSignature(row));
    on(r, 'click', function () {
      $all('.mx-srv-row', UI.srvBody).forEach(function (x) { x.classList.remove('mx-sel'); });
      r.classList.add('mx-sel');
      try { row.click(); } catch (e) {}
    });
    return r;
  }

  function patchRow(r, src, selectedName) {
    var name = cellText(src, 'server-table-name', 0);
    var players = cellText(src, 'server-table-players', 1);
    var mode = cellText(src, 'server-table-mode', 2);
    var bots = parseBots(nativeTitleOf(src), players);
    var c1t = $('.mx-srv-name-text', r);
    if (c1t) txt(c1t, name);
    var c2 = $('.mx-srv-players', r);
    if (c2) {
      var tip = playersTip(players, bots);
      c2.setAttribute('data-tip', tip);
      c2.title = tip;
      var b = $('b', c2);
      if (b) txt(b, players);
      else c2.innerHTML = '<b>' + esc(players) + '</b>';
      botChip(c2, bots);
    }
    txt($('.mx-srv-mode', r), mode || 'FFA');
    r.setAttribute('data-mx-name', name);
    r.setAttribute('data-sig', rowSignature(src));
    r.classList.toggle('mx-sel', src.classList.contains('server-selected') ||
      (!!selectedName && name.toLowerCase() === selectedName));
  }

  var lastPillClickAt = 0;
  function syncServerRows() {
    if (!UI.srvBody) return;
    discoverRegions();
    renderRegionPills();
    // Follow the game if IT switches the visible region — but never into a
    // hidden one (ASIA PACIFIC): there Murther re-asserts the user's chosen tab
    // and mirrors nothing until the game swaps the rows back, so AP rows can
    // never appear regardless of what the native UI does.
    var nat = $('.server-tab-active', N['server-tab-container']);
    if (nat) {
      var natKey = nat.getAttribute('data-mx-region') || nativeRegionKey(nat);
      if (!regionVisible(natKey)) {
        if (Date.now() - lastPillClickAt > 1200) { try { activateNativeRegion(currentRegion); } catch (e) {} }
        $all('.mx-srv-row', UI.srvBody).forEach(function (r) { r.remove(); });
        ensureEmptyState();
        return;
      }
      if (natKey !== currentRegion && regionOrder.indexOf(natKey) !== -1 && Date.now() - lastPillClickAt > 2500) {
        currentRegion = natKey;
        renderRegionPills();
      }
    }
    // STRICT region scoping: only rows whose containing region body matches the
    // active pill. Handles servers-body-eu / servers-body-na style containers and
    // per-region tables; falls back to rows visible inside the active native tab.
    var scope = null;
    if (currentRegion) {
      scope = DOC.getElementById('servers-body-' + currentRegion) ||
              DOC.getElementById('servers-' + currentRegion) ||
              $('.servers-body-' + currentRegion) ||
              $('#server-content [data-region="' + currentRegion + '"]');
    }
    function renderedRows(list) {
      // rows the game hid (display:none) belong to other regions — exclude them
      return list.filter(function (r) {
        if (r.style && r.style.display === 'none') return false;
        return !r.getClientRects || r.getClientRects().length > 0;
      });
    }
    var rows;
    if (scope) {
      rows = renderedRows($all('.server-row, tr', scope));
      // scope exists but is empty because the game toggles per-region tables:
      // fall through to the visible-table sweep instead of showing a false empty state
      if (!rows.length) {
        var visT = $all('#server-content table, #main-servers .server-table').filter(function (t) {
          return t.getClientRects && t.getClientRects().length > 0;
        });
        if (visT.length === 1) {
          rows = renderedRows($all('.server-row, tr', $('tbody', visT[0]) || visT[0]));
        }
      }
    } else {
      // no per-region container found: exclude rows only when their container is
      // definitively ANOTHER known region (containers like #servers-tbody that don't
      // carry a region key stay in — the game swaps their rows per active region)
      rows = renderedRows($all('.server-row').filter(function (row) {
        var p = row.closest ? row.closest('[id^="servers-"], [data-region]') : null;
        if (!p) return true;
        var pkey = p.getAttribute('data-region') || (p.id || '').replace(/^servers-?(body-)?/, '').toLowerCase();
        return regionOrder.indexOf(pkey) === -1 || pkey === currentRegion;
      }));
    }
    var selectedName = null;
    var sel = scope ? $('.server-selected', scope) : $('.server-selected');
    if (sel) selectedName = (rowName(sel) || '').toLowerCase();

    if (!rows.length) { ensureEmptyState(); return; }

    // ---- diff pass: patch in place; rebuild only when the row set/order changes ----
    var cur = $all('.mx-srv-row', UI.srvBody);
    var nativeSigs = rows.map(rowSignature);
    var nativeNames = rows.map(function (row) { return cellText(row, 'server-table-name', 0).toLowerCase(); });
    var curNames = cur.map(function (r) { return (r.getAttribute('data-mx-name') || '').toLowerCase(); });
    var sameSet = curNames.length === nativeNames.length && nativeNames.every(function (n, i) { return n === curNames[i]; });

    if (sameSet) {
      var changed = false;
      cur.forEach(function (r, i) {
        if (r.getAttribute('data-sig') !== nativeSigs[i]) { patchRow(r, rows[i], selectedName); changed = true; }
      });
      if (!changed) return; // nothing changed — keep hover/tooltip state perfectly stable
      ensureEmptyState();
    } else {
      UI.srvBody.innerHTML = '';
      var frag = DOC.createDocumentFragment();
      rows.forEach(function (row) { frag.appendChild(makeRow(row, selectedName)); });
      UI.srvBody.appendChild(frag);
      ensureEmptyState();
    }
  }

  function rowName(row) {
    var c = $('.server-table-name', row) || row.children[0];
    return c ? c.textContent.trim() : '';
  }

  /* ---------- settings view ---------- */
  var PRESETS = ['#a855f7', '#8b5cf6', '#d946ef', '#ec4899', '#ef4444', '#f59e0b', '#22c55e', '#06b6d4', '#3b82f6'];

  function buildSettingsView(host) {
    host.innerHTML = '';

    function section(title, key) {
      var sec = buildCollapsibleSection(host, title, 'settings', key);
      return sec.querySelector('.mx-tsec-body');
    }

    // ---- Appearance ----
    var apBody = section('Appearance', 'appearance');
    var rowA = el('div', 'mx-set-row', apBody);
    txt(el('label', '', rowA), 'Accent color');
    var sw = el('div', 'mx-swatches', rowA);
    PRESETS.forEach(function (c) {
      var sc = el('div', 'mx-swatch' + (S.accent.toLowerCase() === c ? ' sel' : ''), sw);
      sc.style.background = c;
      sc.setAttribute('data-c', c);
      on(sc, 'click', function () {
        setAccent(c, c);
        $all('.mx-swatch', sw).forEach(function (x) { x.classList.remove('sel'); });
        sc.classList.add('sel');
      });
    });
    var rowC = el('div', 'mx-set-row', apBody);
    txt(el('label', '', rowC), 'Custom Accent color');
    var pick = el('input', 'mx-color', rowC);
    pick.type = 'color';
    pick.value = S.accent;
    on(pick, 'input', function () { setAccent(pick.value, pick.value); $all('.mx-swatch', host).forEach(function (x) { x.classList.remove('sel'); }); });
    var rowO = el('div', 'mx-set-row', apBody);
    var lab = el('label', '', rowO);
    lab.textContent = 'Panel opacity';
    var range = el('input', 'mx-slider', rowO);
    range.type = 'range'; range.min = '30'; range.max = '100'; range.value = String(Math.round(S.panelOpacity * 100));
    on(range, 'input', function () {
      S.panelOpacity = clamp(parseInt(range.value, 10) / 100, .3, 1);
      lab.textContent = 'Panel opacity ' + range.value + '%';
      applyTheme();
    });
    var rowM = el('div', 'mx-set-row', apBody);
    var labM = el('label', '', rowM);
    labM.textContent = 'Menu size ' + Math.round((S.menuScale || 0.94) * 100) + '%';
    var rangeM = el('input', 'mx-slider', rowM);
    rangeM.type = 'range'; rangeM.min = '80'; rangeM.max = '110'; rangeM.step = '1';
    rangeM.value = String(Math.round((S.menuScale || 0.94) * 100));
    on(rangeM, 'input', function () {
      S.menuScale = clamp(parseInt(rangeM.value, 10), 80, 110) / 100;
      labM.textContent = 'Menu size ' + rangeM.value + '%';
      applyTheme();
    });

    // ---- Camera & Zoom ----
    var czBody = section('Camera & Zoom', 'camera');
    var g = S.game;
    var azRow = addToggle(czBody, 'Auto zoom (experimental)', !!g.autoZoom, function (v) {
      g.autoZoom = v;
      var ok = setNativeValue(NATIVE_ROWS.filter(function (r) { return r.key === 'autoZoom'; })[0], !v);   // native row is "Disable Auto Zoom"
      setGame('autoZoom', v);
      if (!ok) toast(v ? 'Auto zoom on — experimental engine steering' : 'Auto zoom off');
      else toast(v ? 'Auto zoom on (game setting updated)' : 'Auto zoom off');
      fxKick();
    });
    azRow.title = 'Steers the game zoom toward a mass-based target. Experimental — switch off if it fights your wheel.';
    var zsLab = el('label', '', czBody);
    zsLab.textContent = 'Zoom speed ' + (g.zoomSpeed || 100) + '%';
    var zs = el('input', 'mx-slider', czBody);
    zs.type = 'range'; zs.min = '25'; zs.max = '300'; zs.step = '5'; zs.value = String(g.zoomSpeed || 100);
    zs.style.width = '150px';
    var zsWrap = el('div', 'mx-set-row', czBody);
    if (zsWrap.firstChild) zsWrap.removeChild(zsWrap.firstChild);
    zsWrap.appendChild(zsLab); zsWrap.appendChild(zs);
    on(zs, 'input', function () {
      zsLab.textContent = 'Zoom speed ' + zs.value + '%';
      setGame('zoomSpeed', parseInt(zs.value, 10));
    });
    var cdRow = el('div', 'mx-set-row', czBody);
    var cdLab = el('label', '', cdRow);
    cdLab.textContent = 'Camera delay ' + (g.cameraDelay || 50) + '%';
    var cd = el('input', 'mx-slider', cdRow);
    cd.type = 'range'; cd.min = '0'; cd.max = '100'; cd.step = '5'; cd.value = String(g.cameraDelay || 50);
    cd.style.width = '150px';
    on(cd, 'input', function () {
      cdLab.textContent = 'Camera delay ' + cd.value + '%';
      setGame('cameraDelay', parseInt(cd.value, 10));
    });
    UI.cameraNativeNote = el('div', 'mx-hint', czBody);
    UI.cameraNativeNote.textContent = 'Camera delay uses the game\u2019s own setting when its Options panel is present.';

    // ---- Graphics ----
    var grBody = section('Graphics', 'graphics');
    var qRow = el('div', 'mx-set-row', grBody);
    txt(el('label', '', qRow), 'Graphics quality');
    var qSel = el('select', 'mx-select', qRow);
    [['auto', 'Auto (no change)'], ['low', 'Low \u00b7 0.75x'], ['medium', 'Medium \u00b7 1x'], ['high', 'High \u00b7 up to 1.5x'], ['retina', 'Retina \u00b7 full DPR']].forEach(function (d) {
      var o = el('option', '', qSel); o.value = d[0]; txt(o, d[1]);
    });
    qSel.value = g.quality || 'auto';
    on(qSel, 'change', function () {
      g.quality = qSel.value; save();
      toast('Quality: ' + qSel.options[qSel.selectedIndex].text + ' \u2014 refresh to apply');
    });
    var aaRow = el('div', 'mx-set-row', grBody);
    txt(el('label', '', aaRow), 'Antialiasing');
    var aaSel = el('select', 'mx-select', aaRow);
    [['default', 'Default (game chooses)'], ['on', 'On \u2014 force smooth edges'], ['off', 'Off \u2014 max performance (refresh)']].forEach(function (d) {
      var o = el('option', '', aaSel); o.value = d[0]; txt(o, d[1]);
    });
    aaSel.value = g.antialias || 'default';
    on(aaSel, 'change', function () {
      g.antialias = aaSel.value; save();
      toast('Antialiasing: ' + aaSel.options[aaSel.selectedIndex].text + ' \u2014 refresh to apply');
    });
    el('div', 'mx-hint', grBody).textContent = 'Both apply on the next page load \u2014 the renderer reads them once, at canvas creation.';

    // ---- Visuals & Cells (native-bridged) ----
    var vbBody = section('Visuals & Cells', 'visuals');
    UI.nativeRows = {};
    [
      ['showNames', 'Show names'],
      ['showSkins', 'Show skins'],
      ['showMass', 'Show mass'],
      ['hideFood', 'Show pellets', true],   // inverted: native cHideFood
      ['showBorder', 'Show borders'],
      ['smoothCells', 'Smooth cells (smooth movements)'],
      ['hideTag', 'Hide tag'],
      ['autoHideMass', 'Auto hide mass'],
      ['autoHideNames', 'Auto hide names']
    ].forEach(function (d) {
      var key = d[0], label = d[1], invert = !!d[2];
      var def = NATIVE_ROWS.filter(function (r) { return r.key === key; })[0];
      if (!def) return;
      var cur = invert ? !g[key] : !!g[key];
      var row = addToggle(vbBody, label, cur, function (v) {
        var nv = invert ? !v : v;
        var ok = setNativeValue(def, nv);
        setGame(key, nv);
        if (!ok && UI.nativeNote) UI.nativeNote.textContent = 'Some rows apply through the game\u2019s own Options \u2014 they activate on play.gota.io when the panel exists (this preview has stubs).';
        toast(label + (v ? ' on' : ' off') + (ok ? '' : ' \u00b7 game control not found'));
      });
      UI.nativeRows[key] = { row: row, def: def, invert: invert };
    });
    UI.nativeNote = el('div', 'mx-hint', vbBody);
    UI.nativeNote.textContent = 'These drive the game\u2019s own options (names / skins / mass / food / border) \u2014 nothing is faked.';
    el('div', 'mx-hint', vbBody).textContent = 'Movement speed, pellet size, animation delay and per-enemy/team name\/skin\/mass filters are engine-side (server or renderer internals) and have no client hook.';

    // ---- Indicators ----
    var inBody = section('Indicators', 'indicators');
    addToggle(inBody, 'Cursor line', !!g.cursorLine, function (v) { g.cursorLine = v; setGame('cursorLine', v); fxKick(); toast(v ? 'Cursor line on' : 'Cursor line off'); });
    var clRow = el('div', 'mx-set-row', inBody);
    UI.clsLabel = el('label', '', clRow);
    UI.clsLabel.textContent = 'Cursor line size ' + (g.cursorLineSize || 3) + 'px';
    var cls = el('input', 'mx-slider', clRow);
    cls.type = 'range'; cls.min = '1'; cls.max = '12'; cls.step = '1'; cls.value = String(g.cursorLineSize || 3);
    cls.style.width = '150px';
    on(cls, 'input', function () {
      UI.clsLabel.textContent = 'Cursor line size ' + cls.value + 'px';
      setGame('cursorLineSize', parseInt(cls.value, 10));
      fxKick();
    });
    var clrRow = el('div', 'mx-set-row', inBody);
    txt(el('label', '', clrRow), 'Cursor line color');
    var clr = el('input', 'mx-color', clrRow);
    clr.type = 'color'; clr.value = g.cursorLineColor || S.accent;
    on(clr, 'input', function () {
      setGame('cursorLineColor', clr.value);
      fxKick();
    });
    var clrNote = el('div', 'mx-hint', inBody);
    clrNote.textContent = 'Color also lives in Themes \u2192 Cells & Effects; empty = follows the accent color.';
    addToggle(inBody, 'Linesplit indicators (arrows)', !!g.lsArrows, function (v) { g.lsArrows = v; setGame('lsArrows', v); fxKick(); toast(v ? 'Linesplit arrows on' : 'Linesplit arrows off'); });
    var lsaRow = el('div', 'mx-set-row', inBody);
    txt(el('label', '', lsaRow), 'Linesplit arrow color');
    var lsa = el('input', 'mx-color', lsaRow);
    lsa.type = 'color'; lsa.value = g.lsArrowColor || '#a855f7';
    on(lsa, 'input', function () {
      setGame('lsArrowColor', lsa.value);
      fxKick();
    });

    // ---- Performance & Renderer ----
    var pfBody = section('Performance', 'perf');
    addToggle(pfBody, 'Reduce effects (performance)', S.reduceEffects, function (v) { S.reduceEffects = v; applyTheme(); toast(v ? 'Reduce effects on: particles off, details hidden while playing' : 'Reduce effects off'); });
    var reHint = el('div', 'mx-hint', pfBody);
    reHint.textContent = 'Disables the menu particle field and auto-hides in-game details (connection bar, coordinates, dimmed stats) while you play.';
    reHint.style.marginTop = '-2px';
    // ---- FPS cap (live-toggleable global frame limiter) ----
    var fcRow = el('div', 'mx-set-row', pfBody);
    txt(el('label', '', fcRow), 'FPS cap');
    var fcSel = el('select', 'mx-select', fcRow);
    MURTHER_CAPS.forEach(function (c) {
      var o = el('option', '', fcSel);
      o.value = String(c); txt(o, c ? c + ' FPS' : 'Off (uncapped)');
    });
    fcSel.value = String(parseInt(S.perf.fpsCap, 10) || 0);
    on(fcSel, 'change', function () {
      S.perf.fpsCap = parseInt(fcSel.value, 10) || 0; save();
      toast(S.perf.fpsCap ? 'FPS cap: ' + S.perf.fpsCap + ' — applies live' : 'FPS cap off — uncapped');
    });
    UI.paintFpsCap = function () { fcSel.value = String(parseInt(S.perf.fpsCap, 10) || 0); };
    el('div', 'mx-hint', pfBody).textContent = 'Caps the whole page\u2019s frame rate (game + client) by spacing requestAnimationFrame callbacks — lowers GPU/CPU use and heat. Toggles live, no reload needed.';
    // ---- auto performance mode ----
    addToggle(pfBody, 'Auto performance mode', !!S.perf.autoTune, function (v) {
      S.perf.autoTune = v; save();
      if (v) { autoTunedOnce = false; lowFpsSince = 0; }
      toast(v ? 'Auto performance on — Reduce effects engages below 45 FPS' : 'Auto performance off');
    });
    el('div', 'mx-hint', pfBody).textContent = 'When playing and FPS stays under 45 for 4 seconds, Reduce effects switches on once per session to stabilize the frame rate.';
    var rNote = el('div', 'mx-hint', pfBody);
    rNote.style.marginTop = '2px';
    function paintRenderStatus() {
      var live = currentRendererType();
      var gpuOk = !!navigator.gpu;
      var chosen = S.renderer === 'webgpu' ? 'WebGPU' : 'WebGL (default)';
      var running = live ? ' · Running: ' + live.toUpperCase() : '';
      if (!live && S.renderer === 'webgpu' && !gpuOk) {
        rNote.textContent = 'This browser does not support WebGPU — WebGL will be used.';
      } else {
        rNote.textContent = 'Renderer selection lives beside the logo (WebGL is the default' +
          (running ? '' : ', applies after reload') + ')' + running + '.';
      }
    }
    paintRenderStatus();
    UI.renderStatus = paintRenderStatus;

    // ---- Gameplay & Crosshair ----
    var gpBody = section('Gameplay & Crosshair', 'gameplay');
    addToggle(gpBody, 'macOS crosshair pointer (always visible)', S.crosshair, function (v) { S.crosshair = v; if (UI.syncCrosshairRows) UI.syncCrosshairRows(); applyCursor(); toast(v ? 'Crosshair pointer enabled' : 'Crosshair pointer disabled'); });
    var rowCc = el('div', 'mx-set-row', gpBody);
    txt(el('label', '', rowCc), 'Crosshair color');
    var cc = el('input', 'mx-color', rowCc);
    cc.type = 'color';
    cc.value = S.crosshairColor || '#ffffff';
    on(cc, 'input', function () {
      S.crosshairColor = cc.value;
      applyCursor();
    });
    var rowCs = el('div', 'mx-set-row', gpBody);
    UI.csLabel = el('label', '', rowCs);
    UI.csLabel.textContent = 'Crosshair size ' + (S.crosshairSize || 24) + 'px';
    var cs = el('input', 'mx-slider', rowCs);
    cs.type = 'range'; cs.min = '16'; cs.max = '48'; cs.step = '2'; cs.value = String(S.crosshairSize || 24);
    on(cs, 'input', function () {
      S.crosshairSize = parseInt(cs.value, 10);
      UI.csLabel.textContent = 'Crosshair size ' + cs.value + 'px';
      applyCursor();
    });
    function syncCrosshairRows() {
      rowCc.classList.toggle('mx-hidden', !S.crosshair);
      rowCs.classList.toggle('mx-hidden', !S.crosshair);
    }
    syncCrosshairRows();
    UI.syncCrosshairRows = syncCrosshairRows;

    // keep the toggle rows honest on rebuild/import: read back the live native
    // controls (when present) so the UI never shows a stale state
    UI.syncNativeRows = function () {
      var st = scanNativeOptions(true);
      Object.keys(UI.nativeRows || {}).forEach(function (key) {
        var entry = UI.nativeRows[key];
        var v = nativeValue(entry.def);
        if (v === undefined) return;
        var shown = entry.invert ? !v : v;
        entry.row.classList.toggle('on', shown);
        S.game[key] = v;
      });
      if (st.any && UI.cameraNativeNote) UI.cameraNativeNote.textContent = 'Linked to the game\u2019s own Options panel (' + st.any + ' control' + (st.any === 1 ? '' : 's') + ' found) — changes there stay in sync.';
    };
    try { UI.syncNativeRows(); } catch (e) {}

    // ---- Panels & HUD ----
    var pnBody = section('Panels & HUD', 'panels');
    var labels = { topbar: 'Connection bar — FPS / Ping / Server (above chat)', score: 'Stats bar — ID / Mass / Score / Cells (top center)', leaderboard: 'Leaderboard', minimap: 'Minimap', chat: 'Chat', party: 'Party panel' };
    Object.keys(S.panels).forEach(function (k) {
      addToggle(pnBody, 'Show ' + (labels[k] || k), S.panels[k], function (v) { S.panels[k] = v; applyTheme(); });
    });

    // ---- Advanced ----
    var adBody = section('Advanced', 'advanced');
    addToggle(adBody, 'Enable Custom Theme', !!S.customTheme, function (v) { S.customTheme = v; applyTheme(); toast(v ? 'Custom theme enabled' : 'Custom theme disabled'); });
    addToggle(adBody, 'Hide ads / banners', S.hideAds, function (v) { S.hideAds = v; applyAds(); });
    var acts = el('div', 'mx-theme-actions', adBody);
    var ex = el('button', 'mx-mini', acts); txt(ex, 'Export settings');
    on(ex, 'click', function () { exportThemeFile(); });
    var im = el('button', 'mx-mini', acts); txt(im, 'Import settings');
    on(im, 'click', function () { importThemeFile(); });
    var rs = el('button', 'mx-mini', acts); txt(rs, 'Reset settings');
    on(rs, 'click', function () { resetThemeSettings(); });

    // row counts on the section headers (same style as Hotkeys/Themes)
    $all('.mx-tsec', host).forEach(function (sec) {
      var n = sec.querySelector('.mx-tsec-body').children.length;
      var ti = sec.querySelector('.mx-tsec-title');
      if (n && ti) ti.textContent = ti.textContent.replace(/s*·s*d+$/, '') + ' · ' + n;
    });
  }

  /* ---------- settings/theme io (shared by Settings, Themes and Backup) ---------- */
  function downloadJSON(name, data) {
    var blob = new Blob([data], { type: 'application/json' });
    var a = el('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    DOC.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }
  function themeExportPayload() {
    // the user theme: every cosmetic choice (accent, panels, HUD styling, custom theme, menu size)
    return JSON.stringify({ v: 3, kind: 'theme', accent: S.accent, accent2: S.accent2, panelOpacity: S.panelOpacity, reduceEffects: S.reduceEffects, crosshair: S.crosshair, crosshairColor: S.crosshairColor, crosshairSize: S.crosshairSize, panels: S.panels, customTheme: !!S.customTheme, hud: S.hud, theme: S.theme, game: S.game, gameplay: S.gameplay, perf: S.perf, quick: S.quick, menuScale: S.menuScale }, null, 2);
  }
  function exportThemeFile() {
    downloadJSON('murther-theme.json', themeExportPayload());
    toast('Theme exported');
  }
  function importThemeFile() {
    var inp = el('input');
    inp.type = 'file'; inp.accept = '.json,application/json';
    on(inp, 'change', function () {
      var f = inp.files && inp.files[0];
      if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        try {
          var j = JSON.parse(String(rd.result));
          if (j.kind === 'backup') { applyBackup(j); return; }
          // theme file (or legacy v1-v3 settings export)
          if (j.accent) S.accent = j.accent;
          if (j.accent2) S.accent2 = j.accent2;
          if (typeof j.panelOpacity === 'number') S.panelOpacity = clamp(j.panelOpacity, .3, 1);
          if (typeof j.reduceEffects === 'boolean') S.reduceEffects = j.reduceEffects;
          if (typeof j.crosshair === 'boolean') S.crosshair = j.crosshair;
          if (typeof j.crosshairColor === 'string') S.crosshairColor = j.crosshairColor;
          if (typeof j.crosshairSize === 'number') S.crosshairSize = clamp(j.crosshairSize, 16, 48);
          if (j.panels) Object.keys(S.panels).forEach(function (k) { if (typeof j.panels[k] === 'boolean') S.panels[k] = j.panels[k]; });
          if (typeof j.customTheme === 'boolean') S.customTheme = j.customTheme;
          if (typeof j.menuScale === 'number') S.menuScale = clamp(j.menuScale, 0.8, 1.1);
          if (j.hud) Object.keys(S.hud).forEach(function (k) { if (j.hud[k] !== undefined) S.hud[k] = j.hud[k]; });
          if (j.game) Object.keys(S.game).forEach(function (k) { if (j.game[k] !== undefined) S.game[k] = j.game[k]; });
          if (j.gameplay) Object.keys(S.gameplay).forEach(function (k) { if (j.gameplay[k] !== undefined) S.gameplay[k] = j.gameplay[k]; });
          if (j.perf) Object.keys(S.perf).forEach(function (k) { if (j.perf[k] !== undefined) S.perf[k] = j.perf[k]; });
          if (j.quick) Object.keys(S.quick).forEach(function (k) { if (j.quick[k] !== undefined) S.quick[k] = String(j.quick[k]); });
          if (j.theme) Object.keys(S.theme).forEach(function (k) { if (j.theme[k] !== undefined) S.theme[k] = j.theme[k]; });
          afterSettingsChanged('Theme imported');
        } catch (e) { toast('Invalid theme file', 'bad'); }
      };
      rd.readAsText(f);
    });
    inp.click();
  }
  function resetThemeSettings() {
    S.accent = DEFAULTS.accent;
    S.accent2 = DEFAULTS.accent2;
    S.panelOpacity = DEFAULTS.panelOpacity;
    S.reduceEffects = DEFAULTS.reduceEffects;
    S.hideAds = DEFAULTS.hideAds;
    S.panels = JSON.parse(JSON.stringify(DEFAULTS.panels));
    S.customTheme = DEFAULTS.customTheme;
    S.menuScale = DEFAULTS.menuScale;
    S.renderer = DEFAULTS.renderer;
    S.hud = JSON.parse(JSON.stringify(DEFAULTS.hud));
    S.theme = JSON.parse(JSON.stringify(DEFAULTS.theme));
    S.game = JSON.parse(JSON.stringify(DEFAULTS.game));
    S.gameplay = JSON.parse(JSON.stringify(DEFAULTS.gameplay));
    S.perf = JSON.parse(JSON.stringify(DEFAULTS.perf));
    S.quick = JSON.parse(JSON.stringify(DEFAULTS.quick));
    afterSettingsChanged('Theme reset to defaults');
  }    // re-apply + rebuild every view that renders settings state
  function afterSettingsChanged(msg) {
    save();
    applyTheme(); applyAds(); applyCursor(); buildAll();
    if (UI.themesView) { UI.themesView.innerHTML = ''; buildThemesView(UI.themesView); }
    if (UI.settingsView) { UI.settingsView.innerHTML = ''; buildSettingsView(UI.settingsView); }
    if (UI.gameplayView) { UI.gameplayView.innerHTML = ''; buildGameplayView(UI.gameplayView); }
    if (UI.hotkeysView) { UI.hotkeysView.innerHTML = ''; buildHotkeysView(UI.hotkeysView); }
    if (msg) toast(msg);
  }

  /* ---------- Backup tab: the whole client state in one file ---------- */
  // Selective backup: the three user-facing groups, mapped onto the settings store.
  // Descriptions here feed the check rows in the Backup tab.
  var BACKUP_PARTS = [
    { key: 'settings', label: 'Settings', store: ['accent', 'accent2', 'panelOpacity', 'reduceEffects', 'hideAds', 'crosshair', 'crosshairColor', 'crosshairSize', 'menuScale', 'renderer', 'panels', 'game', 'gameplay', 'perf'],
      desc: 'Accent colors, panel opacity, menu size, crosshair, ads, renderer choice, panel visibility, native/graphics options and the gameplay macros.' },
    { key: 'quickchat', label: 'Quick chat', store: ['quick'],
      desc: 'The nine quick chat slot messages.' },
    { key: 'hotkeys', label: 'Hotkeys', store: ['keys'],
      desc: 'Every client keybind, including intentionally unbound keys.' },
    { key: 'themes', label: 'Themes', store: ['customTheme', 'hud', 'theme'],
      desc: 'Custom Theme master switch, HUD opacity/blur/highlights and all Game World + Cells & Effects values.' }
  ];
  function backupSelection() {
    var raw = null;
    try { raw = JSON.parse(localStorage.getItem(LS_BACKUP_SEL) || 'null'); } catch (e) {}
    var sel = {};
    BACKUP_PARTS.forEach(function (pt) { sel[pt.key] = !(raw && raw[pt.key] === false); });
    return sel;
  }
  function saveBackupSelection(sel) { try { localStorage.setItem(LS_BACKUP_SEL, JSON.stringify(sel)); } catch (e) {} }

  function backupPayload(sel) {
    // full store when no selection is given; otherwise only the checked groups
    var selection = sel || null;
    var part = {};
    var allow = {};
    if (selection) {
      BACKUP_PARTS.forEach(function (pt) {
        part[pt.key] = !!selection[pt.key];
        if (selection[pt.key]) pt.store.forEach(function (k) { allow[k] = true; });
      });
    }
    var out = {};
    Object.keys(S).forEach(function (k) {
      if (!selection || allow[k]) out[k] = S[k];
    });
    var payload = { v: 3, kind: 'backup', client: 'Murther', settings: out };
    if (selection) payload.selected = part;
    return JSON.stringify(payload, null, 2);
  }
  function backupFileName(sel) {
    var selection = sel || backupSelection();
    var names = [];
    if (selection.settings) names.push('settings');
    if (selection.quickchat) names.push('quickchat');
    if (selection.hotkeys) names.push('hotkeys');
    if (selection.themes) names.push('theme');
    return names.length === BACKUP_PARTS.length ? 'murther-backup.json'
      : names.length === 0 ? 'murther-backup-empty.json'
      : ('murther-' + names.join('-') + '.json');
  }
  function backupSizeEstimate(sel) {
    var bytes = backupPayload(sel || backupSelection()).length;
    return bytes < 1024 ? bytes + ' B'
      : bytes < 1024 * 1024 ? (bytes / 1024).toFixed(1) + ' KB'
      : (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }
  function applyBackup(j) {
    if (!j || j.kind !== 'backup' || !j.settings || typeof j.settings !== 'object') { toast('Invalid backup file', 'bad'); return; }
    var inc = j.settings;
    // restore against defaults so unknown/missing keys can never poison the store.
    // Unselected groups keep their CURRENT values (restore-on-top semantics).
    var fresh = JSON.parse(JSON.stringify(DEFAULTS));
    Object.keys(fresh).forEach(function (k) {
      if (inc[k] === undefined) return;
      if (typeof fresh[k] === 'object' && fresh[k] !== null && !Array.isArray(fresh[k])) {
        Object.keys(fresh[k]).forEach(function (k2) { if (inc[k] && inc[k][k2] !== undefined) fresh[k][k2] = inc[k][k2]; });
      } else fresh[k] = inc[k];
    });
    // a selective file marks the groups it carries; full files restore everything
    var carries = j.selected || null;
    if (carries) {
      Object.keys(fresh).forEach(function (k) {
        var inSel = BACKUP_PARTS.some(function (pt) {
          return carries[pt.key] && pt.store.indexOf(k) !== -1;
        });
        if (!inSel) fresh[k] = S[k]; // keep current value for groups not in this file
      });
    }
    Object.keys(fresh).forEach(function (k) { S[k] = fresh[k]; });
    afterSettingsChanged('Backup restored — imported: ' + (carries
      ? BACKUP_PARTS.map(function (pt) { return pt.key; }).filter(function (g) { return carries[g]; }).join(', ')
      : 'everything'));
  }
  function buildBackupView(host) {
    host.innerHTML = '';
    var note = el('div', 'mx-kb-note', host);
    note.textContent = 'Choose what to save, then export. The file name and size follow your selection — importing a file restores only the groups it contains.';
    var partsHost = el('div', '', host);
    var size = el('div', 'mx-bk-size', host);
    var acts = el('div', 'mx-theme-actions', host);

    var sel = backupSelection();
    var sws = {};

    function paintSize() { txt(size, 'Estimated backup size: ' + backupSizeEstimate(sel)); }
    function paintExport() {
      ex.disabled = !BACKUP_PARTS.some(function (pt) { return sel[pt.key]; });
    }

    BACKUP_PARTS.forEach(function (pt) {
      var row = el('div', 'mx-bk-part', partsHost);
      var sw = el('div', 'mx-sw' + (sel[pt.key] ? ' on' : ''), row);
      sws[pt.key] = sw;
      on(sw, 'click', function () {
        sel[pt.key] = !sel[pt.key];
        sw.classList.toggle('on', sel[pt.key]);
        saveBackupSelection(sel);
        paintSize(); paintExport();
      });
      var body = el('div', '', row);
      txt(el('div', 'mx-bk-part-label', body), pt.label);
      txt(el('div', 'mx-bk-part-desc', body), pt.desc);
    });

    var ex = el('button', 'mx-mini', acts); txt(ex, 'Export backup');
    on(ex, 'click', function () {
      downloadJSON(backupFileName(sel), backupPayload(sel));
      toast('Backup exported: ' + backupFileName(sel));
    });
    var im = el('button', 'mx-mini', acts); txt(im, 'Import backup');
    on(im, 'click', function () { importThemeFile(); });
    var rs = el('button', 'mx-mini', acts); txt(rs, 'Reset everything');
    on(rs, 'click', function () {
      Object.keys(DEFAULTS).forEach(function (k) { S[k] = JSON.parse(JSON.stringify(DEFAULTS[k])); });
      afterSettingsChanged('All Murther settings reset');
    });

    paintSize(); paintExport();
  }

  /* ---------- Themes: row builders ---------- */
  function themeRow(host, label, hint, ctrl) {
    var row = el('div', 'mx-trow', host);
    var main = el('div', 'mx-trow-main', row);
    txt(el('div', 'mx-tlabel', main), label);
    main.appendChild(ctrl);
    if (hint) txt(el('div', 'mx-hint', row), hint);
    return row;
  }

  function themeSlider(host, label, hint, get, set, disp) {
    var range = el('input', 'mx-slider');
    var row = themeRow(host, label, hint, range);
    var lab = row.querySelector('.mx-tlabel');
    function paint() { lab.textContent = label + ': ' + (disp ? disp() : get()); }
    paint();
    range.type = 'range'; range.min = '0'; range.max = '100'; range.step = '1';
    range.value = String(Math.round(parseFloat(get()) * 100));
    on(range, 'input', function () { set(parseFloat(range.value) / 100); paint(); applyTheme(); });
    return row;
  }

  function themeNumber(host, label, hint, min, max, get, set) {
    var box = el('input', 'mx-input');
    box.type = 'number'; box.min = String(min); box.max = String(max);
    box.value = String(get());
    box.style.width = '74px';
    on(box, 'change', function () {
      var v = clamp(parseFloat(box.value), min, max);
      if (!isFinite(v)) v = min;
      box.value = String(v);
      set(v); applyTheme();
    });
    return themeRow(host, label, hint, box);
  }

  function themeColor(host, label, hint, get, set) {
    var wrap = el('div', 'mx-swatch-row');
    var chex = el('div', 'mx-chex', wrap);
    var pick = el('input', 'mx-color', wrap);
    pick.type = 'color';
    pick.value = get();
    function paint() { chex.style.background = get(); }
    on(pick, 'input', function () { set(pick.value); paint(); applyTheme(); });
    paint();
    return themeRow(host, label, hint, wrap);
  }

  function themeSelect(host, label, hint, opts, get, set) {
    var sel = el('select', 'mx-input');
    opts.forEach(function (o) {
      var op = el('option', '', sel);
      op.value = o; op.textContent = o[0].toUpperCase() + o.slice(1);
    });
    sel.value = String(get());
    on(sel, 'change', function () { set(sel.value); applyTheme(); });
    return themeRow(host, label, hint, sel);
  }

  function themeToggle(host, label, hint, get, set) {
    var t = el('div', 'mx-sw' + (get() ? ' on' : ''));
    on(t, 'click', function () {
      var v = !t.classList.contains('on');
      t.classList.toggle('on', v);
      set(v); applyTheme();
    });
    return themeRow(host, label, hint, t);
  }

  // -------- Themes: feature catalog (search + rows) --------
  function featureDefs() {
    var th = S.theme, hud = S.hud;
    function sl(cat, key, label, hint, get, set, disp) { return { cat: cat, key: key, label: label, hint: hint, get: get, set: set, disp: disp }; }
    function co(cat, key, label, hint, get, set) { return { cat: cat, key: key, label: label, hint: hint, kind: 'color', get: get, set: set }; }
    function tg(cat, key, label, hint, get, set) { return { cat: cat, key: key, label: label, hint: hint, kind: 'toggle', get: get, set: set }; }
    function se(cat, key, label, hint, opts, get, set) { return { cat: cat, key: key, label: label, hint: hint, kind: 'select', opts: opts, get: get, set: set }; }
    function nu(cat, key, label, hint, min, max, get, set) { return { cat: cat, key: key, label: label, hint: hint, kind: 'number', min: min, max: max, get: get, set: set }; }
    return [
      // Interface
      tg('interface', 'customTheme', 'Enable Custom Theme', 'Master switch — turns every option below on or off at once', function () { return !!S.customTheme; }, function (v) { S.customTheme = v; }),
      // HUD
      sl('hud', 'lbOpacity', 'Leaderboard Opacity', 'Transparency of the leaderboard panel — 0 hides it, 1 keeps it solid', function () { return hud.lbOpacity; }, function (v) { hud.lbOpacity = v; }),
      sl('hud', 'lbBlur', 'Leaderboard Blur', 'Frosted-glass blur behind the leaderboard, in pixels', function () { return hud.lbBlur / 10; }, function (v) { hud.lbBlur = Math.round(v * 10); }, function () { return hud.lbBlur; }),
      sl('hud', 'chatOpacity', 'Chat Opacity', 'Transparency of the chat panel — 0 hides it, 1 keeps it solid', function () { return hud.chatOpacity; }, function (v) { hud.chatOpacity = v; }),
      sl('hud', 'chatBlur', 'Chat Blur', 'Frosted-glass blur behind the chat, in pixels', function () { return hud.chatBlur / 10; }, function (v) { hud.chatBlur = Math.round(v * 10); }, function () { return hud.chatBlur; }),
      sl('hud', 'mmOpacity', 'Minimap Opacity', 'Transparency of the minimap panel — 0 hides it, 1 keeps it solid', function () { return hud.mmOpacity; }, function (v) { hud.mmOpacity = v; }),
      sl('hud', 'mmBlur', 'Minimap Blur', 'Frosted-glass blur behind the minimap, in pixels', function () { return hud.mmBlur / 10; }, function (v) { hud.mmBlur = Math.round(v * 10); }, function () { return hud.mmBlur; }),
      co('hud', 'lbHi', 'Leaderboard Highlight', 'Colored bar drawn on the leaderboard panel', function () { return hud.lbHi; }, function (v) { hud.lbHi = v; }),
      co('hud', 'lbHiParty', 'Leaderboard Highlight (Party)', 'Bar color used while you are in a party', function () { return hud.lbHiParty; }, function (v) { hud.lbHiParty = v; }),
      co('hud', 'partyLeader', 'Party Leader Color', 'Color of the leader’s name in the party roster', function () { return hud.partyLeader; }, function (v) { hud.partyLeader = v; }),
      // Game World
      co('world', 'bg', 'Game Background', 'Color painted behind the arena', function () { return th.bg; }, function (v) { th.bg = v; }),
      sl('world', 'bgOpacity', 'BG Opacity', 'Strength of that color over the game’s own background — 0 shows the original, 1 fully replaces it', function () { return th.bgOpacity; }, function (v) { th.bgOpacity = v; }),
      co('world', 'border', 'Game Border', 'Color of the arena edge line', function () { return th.border; }, function (v) { th.border = v; }),
      sl('world', 'borderSize', 'Border Size', 'Thickness of the arena edge, in pixels', function () { return th.borderSize / 200; }, function (v) { th.borderSize = Math.round(v * 200); }, function () { return th.borderSize; }),
      tg('world', 'gridShow', 'Show A1/B1 Grid', 'Draw a coordinate grid over the game world', function () { return th.gridShow; }, function (v) { th.gridShow = v; }),
      se('world', 'gridStyle', 'Grid Style', 'Whether the grid draws as lines or filled checker squares', ['none', 'lines', 'checker'], function () { return th.gridStyle; }, function (v) { th.gridStyle = v; }),
      co('world', 'gridColor', 'Grid Color', 'Color of the grid lines or checker squares', function () { return th.gridColor; }, function (v) { th.gridColor = v; }),
      sl('world', 'gridOpacity', 'Grid Opacity', 'Strength of the grid against the background', function () { return th.gridOpacity; }, function (v) { th.gridOpacity = v; }),
      sl('world', 'gridThickness', 'Grid Line Thickness', 'Width of each grid line, in pixels', function () { return th.gridThickness / 12; }, function (v) { th.gridThickness = Math.max(0.5, v * 12); }, function () { return Math.round(th.gridThickness * 10) / 10; }),
      nu('world', 'gridCols', 'Grid Columns', 'Grid cells across the arena, labeled A, B, C…', 1, 64, function () { return th.gridCols; }, function (v) { th.gridCols = v; }),
      nu('world', 'gridRows', 'Grid Rows', 'Grid cells down the arena, labeled 1, 2, 3…', 1, 64, function () { return th.gridRows; }, function (v) { th.gridRows = v; }),
      tg('world', 'gridLabels', 'Grid Labels', 'Show A1, B1, A2... text inside each cell', function () { return th.gridLabels; }, function (v) { th.gridLabels = v; }),
      se('world', 'gridLabelFont', 'Grid Label Font', 'Font used for the cell labels', ['Verdana', 'Arial', 'Georgia', 'Courier New', 'Inter'], function () { return th.gridLabelFont; }, function (v) { th.gridLabelFont = v; }),
      co('world', 'gridLabelColor', 'Grid Label Color', 'Color of the cell label text', function () { return th.gridLabelColor; }, function (v) { th.gridLabelColor = v; }),
      sl('world', 'gridLabelSize', 'Grid Label Size', 'Size of the cell label text, in pixels', function () { return th.gridLabelSize / 48; }, function (v) { th.gridLabelSize = Math.max(6, Math.round(v * 48)); }, function () { return th.gridLabelSize; }),
      // Cells & Effects
      tg('cells', 'pastel', 'Pastel Mode', 'Soften all cell colors toward pastel tones', function () { return th.pastel; }, function (v) { th.pastel = v; }),
      sl('cells', 'pastelIntensity', 'Pastel Intensity', 'How far colors are shifted toward pastel', function () { return th.pastelIntensity / 100; }, function (v) { th.pastelIntensity = Math.round(v * 100); }, function () { return th.pastelIntensity; }),
      se('cells', 'pastelTarget', 'Pastel Applies To', 'Which cells get the pastel treatment: everyone, only you, or only enemies', ['All', 'Player', 'Enemies'], function () { return th.pastelTarget; }, function (v) { th.pastelTarget = v; }),
      tg('cells', 'tracers', 'Show Tracer Lines', 'Draw lines from your cell toward other cells', function () { return th.tracers; }, function (v) { th.tracers = v; }),
      co('cells', 'cursorLineColor', 'Cursor Line Color', 'Color of the cursor line (empty = follows the accent color) — enable the line itself in Settings → Indicators', function () { return S.game.cursorLineColor || ''; }, function (v) { S.game.cursorLineColor = v; setGame('cursorLineColor', v); fxKick(); }),
      sl('cells', 'tracerOpacity', 'Tracer Opacity', 'Strength of the tracer lines', function () { return th.tracerOpacity / 100; }, function (v) { th.tracerOpacity = Math.round(v * 100); }, function () { return th.tracerOpacity; }),
      co('cells', 'tracerColor', 'Tracer Color', 'Color of the tracer lines', function () { return th.tracerColor; }, function (v) { th.tracerColor = v; }),
      sl('cells', 'tracerThickness', 'Tracer Thickness', 'Width of the tracer lines, in pixels', function () { return th.tracerThickness / 10; }, function (v) { th.tracerThickness = Math.round(v * 10); }, function () { return th.tracerThickness; })
    ];
  }
  // collapsible section with a burger (three-line) handle; remembers open/closed per pane
  function buildCollapsibleSection(host, title, pane, key, count, forceOpen) {
    var closed = false;
    if (!forceOpen) try {
      var st = JSON.parse(localStorage.getItem(LS_SECTION_STATE) || '{}');
      closed = !!(st[pane] && st[pane][key]);
    } catch (e) {}
    var sec = el('div', 'mx-tsec' + (closed ? ' closed' : ''), host);
    var head = el('div', 'mx-tsec-head', sec);
    el('span', 'mx-tsec-chev', head);
    txt(el('span', 'mx-tsec-title', head), title + (typeof count === 'number' ? ' · ' + count : ''));
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
  }
  function buildThemesView(host) {
    host.innerHTML = '';
    var intro = el('div', 'mx-kb-note', host);
    intro.textContent = 'Every value below is saved in the Themes backup group and only applies while “Enable Custom Theme” is on.';
    var search = el('input', 'mx-theme-search', host);
    search.placeholder = 'Search features...';
    var body = el('div', 'mx-theme-body', host);
    var cats = { interface: 'Interface', hud: 'HUD', world: 'Game World', cells: 'Cells & Effects' };
    var order = ['interface', 'hud', 'world', 'cells'];
    function render(q) {
      q = String(q || '').trim().toLowerCase();
      body.innerHTML = '';
      order.forEach(function (cat) {
        var vis = featureDefs().filter(function (f) { return f.cat === cat; })
          .filter(function (f) { return !q || (f.label + ' ' + (f.hint || '')).toLowerCase().indexOf(q) !== -1; });
        if (!vis.length) return;
        var sec = buildCollapsibleSection(body, cats[cat], 'themes', cat, vis.length, !!q);
        vis.forEach(function (f) {
          var row;
          if (f.kind === 'color') row = themeColor(sec, f.label, f.hint, f.get, f.set);
          else if (f.kind === 'toggle') row = themeToggle(sec, f.label, f.hint, f.get, f.set);
          else if (f.kind === 'select') row = themeSelect(sec, f.label, f.hint, f.opts, f.get, f.set);
          else if (f.kind === 'number') row = themeNumber(sec, f.label, f.hint, f.min, f.max, f.get, f.set);
          else row = themeSlider(sec, f.label, f.hint, f.get, f.set, f.disp);
          row.setAttribute('data-feature', f.key);
        });
      });
      if (!body.children.length) {
        var empty = el('div', 'mx-tsec', body);
        txt(el('div', 'mx-hint', empty), 'No features match');
      }
    }
    render('');
    on(search, 'input', function () { render(search.value); });
    UI.themesSearch = search;

    // theme io: save/restore just the theme (.json)
    var tact = el('div', 'mx-theme-actions', host);
    var tex = el('button', 'mx-mini', tact); txt(tex, 'Export theme');
    on(tex, 'click', function () { exportThemeFile(); });
    var tim = el('button', 'mx-mini', tact); txt(tim, 'Import theme');
    on(tim, 'click', function () { importThemeFile(); });
    var trs = el('button', 'mx-mini', tact); txt(trs, 'Reset theme');
    on(trs, 'click', function () { resetThemeSettings(); });
  }
  function addToggle(host, label, val, cb) {
    var row = el('div', 'mx-set-row', host);
    txt(el('label', '', row), label);
    var t = el('div', 'mx-sw' + (val ? ' on' : ''), row);
    on(t, 'click', function () {
      var v = !t.classList.contains('on');
      t.classList.toggle('on', v);
      cb(v);
    });
    return t;
  }

  function setAccent(a, a2) {
    S.accent = a; S.accent2 = a2;
    applyTheme();
    $all('.mx-swatch', DOC).forEach(function (x) {
      x.classList.toggle('sel', (x.getAttribute('data-c') || '').toLowerCase() === a.toLowerCase());
    });
  }

  /* ---------- gameplay view (Ryuten-inspired macros + quick chat) ---------- */
  function quickSlotRow(host, n) {
    var row = el('div', 'mx-set-row', host);
    var lab = el('label', '', row);
    lab.textContent = 'Slot ' + n;
    lab.style.minWidth = '46px';
    var inp = el('input', 'mx-input', row);
    inp.type = 'text'; inp.maxLength = 80; inp.placeholder = 'empty';
    inp.value = S.quick['q' + n] || '';
    inp.style.flex = '1';
    on(inp, 'input', function () { S.quick['q' + n] = inp.value.slice(0, 80); save(); });
    var hint = el('div', 'mx-hint', host);
    hint.textContent = 'Press ' + n + ' in game to send' + (n === 1 ? ' \u00b7 digits 1-9 send their slot' : '');
    hint.style.marginTop = '-6px';
    return inp;
  }
  function buildGameplayView(host) {
    host.innerHTML = '';
    var g = S.gameplay;

    var note = el('div', 'mx-kb-note', host);
    note.textContent = 'Input macros drive the game through its own keys (Space = split, W = eject) with synthetic key events — the game\u2019s own keybinds stay authoritative. Bind keys in the Hotkeys tab; everything ships unbound.';

    // ---- macros ----
    var sec1 = buildCollapsibleSection(host, 'Macros', 'gameplay', 'macros', 6);
    var b1 = sec1.querySelector('.mx-tsec-body');
    addToggle(b1, 'Mouse: left button = Macro Feed (hold)', !!g.mouseFeed, function (v) {
      g.mouseFeed = v; save();
      toast(v ? 'LMB feed on — hold to keep ejecting' : 'LMB feed off');
    });
    addToggle(b1, 'Mouse: right button = 2x split', !!g.mouseSplit2, function (v) { g.mouseSplit2 = v; save(); });
    addToggle(b1, 'Mouse: back button 1 = 3x split', !!g.mouseSplit3, function (v) { g.mouseSplit3 = v; save(); });
    addToggle(b1, 'Mouse: back button 2 = 4x split', !!g.mouseSplit4, function (v) { g.mouseSplit4 = v; save(); });
    var mfHint = el('div', 'mx-hint', b1);
    mfHint.textContent = 'Mouse actions only fire while playing (menu closed) and never over Murther panels.';
    var fiRow = el('div', 'mx-set-row', b1);
    UI.fiLabel = el('label', '', fiRow);
    UI.fiLabel.textContent = 'Feed tick ' + (g.feedInterval || 40) + 'ms';
    var fi = el('input', 'mx-slider', fiRow);
    fi.type = 'range'; fi.min = '20'; fi.max = '200'; fi.step = '5'; fi.value = String(g.feedInterval || 40);
    fi.style.width = '150px';
    on(fi, 'input', function () {
      UI.fiLabel.textContent = 'Feed tick ' + fi.value + 'ms';
      g.feedInterval = parseInt(fi.value, 10); save();
    });
    var sbRow = el('div', 'mx-set-row', b1);
    UI.sbLabel = el('label', '', sbRow);
    UI.sbLabel.textContent = 'Split burst gap ' + (g.splitBurstDelay || 3) + 'ms';
    var sb = el('input', 'mx-slider', sbRow);
    sb.type = 'range'; sb.min = '2'; sb.max = '20'; sb.step = '1'; sb.value = String(g.splitBurstDelay || 3);
    sb.style.width = '150px';
    on(sb, 'input', function () {
      UI.sbLabel.textContent = 'Split burst gap ' + sb.value + 'ms';
      g.splitBurstDelay = parseInt(sb.value, 10); save();
    });

    // ---- quick chat ----
    var sec2 = buildCollapsibleSection(host, 'Quick chat (1-9)', 'gameplay', 'quick', 9);
    var b2 = sec2.querySelector('.mx-tsec-body');
    for (var qi = 1; qi <= 9; qi++) quickSlotRow(b2, qi);

    // ---- how it works ----
    var sec3 = buildCollapsibleSection(host, 'How it works', 'gameplay', 'how', 3);
    var b3 = sec3.querySelector('.mx-tsec-body');
    var h1 = el('div', 'mx-hint', b3);
    h1.textContent = 'Macro Feed (hold): fires the eject key every tick until you release — Ryuten\u2019s "Macro eject" pattern.';
    var h2 = el('div', 'mx-hint', b3);
    h2.textContent = 'Split 2x/3x/4x/6x: presses Space N times a few ms apart (one burst at a time).';
    var h3 = el('div', 'mx-hint', b3);
    h3.textContent = 'gota\u2019s cell physics run on the server — no client can change them. This layer makes INPUT faster, not the simulation different.';
  }

  /* ---------- hotkeys view ---------- */
  // CLIENT actions only. The native client owns all gameplay keybinds (split /
  // eject / linesplit / freeze / multibox / spectate / respawn / cycle displays /
  // context menu) — those live in the game's own Hotkeys panel and are intentionally
  // absent here; GAME_KEYS below is only used to warn when a Murther binding would
  // overlap a key the game already uses.
  var KEY_LABELS = {
    menu: 'Toggle menu', topbar: 'Toggle connection bar', score: 'Toggle stats bar',
    leaderboard: 'Toggle leaderboard', minimap: 'Toggle minimap', chat: 'Toggle chat',
    party: 'Toggle party panel', allPanels: 'Toggle all HUD panels',
    crosshair: 'Toggle crosshair pointer', reduceEffects: 'Toggle reduce effects (performance)',
    customTheme: 'Toggle custom theme', hideAds: 'Toggle hide ads',
    cycleRegion: 'Cycle server region', copyId: 'Copy player ID',
    cursorLine: 'Toggle cursor line', lsArrows: 'Toggle linesplit arrows', autoZoom: 'Toggle auto zoom',
    feed: 'Macro feed (hold)', split2: 'Split 2x', split3: 'Split 3x', split4: 'Split 4x', split6: 'Split 6x',
    zoomReset: 'Reset zoom', fpsCap: 'Cycle FPS cap'
  };
  var KEY_SECTIONS = [
    ['Panels & HUD', ['menu', 'topbar', 'score', 'leaderboard', 'minimap', 'chat', 'party', 'allPanels']],
    ['Client', ['crosshair', 'reduceEffects', 'customTheme', 'hideAds']],
    ['Gameplay', ['cursorLine', 'lsArrows', 'autoZoom']],
    ['Macros', ['feed', 'split2', 'split3', 'split4', 'split6']],
    ['Game helpers', ['cycleRegion', 'copyId', 'zoomReset', 'fpsCap']]
  ];
  // Default gameplay keys seen on play.gota.io (per the game's own hotkeys panel).
  // Informational only — the live native panel is scanned too when present.
  var GAME_KEYS = {
    KeyQ: 'Toggle Spectate Mode', KeyU: 'Respawn', KeyW: 'Eject Mass', Space: 'Split',
    KeyE: 'Double Split (4x)', KeyT: 'Triple Split (8x)', KeyR: 'Quad Split (16x)',
    KeyF: 'Sextuple Split (64x)', KeyZ: 'Freeze Mouse (Hold)', KeyA: 'Line Split (Toggle)',
    Tab: 'Multibox Switch'
  };
  var gameKeyCache = null;
  function gameKeyScan() {
    if (gameKeyCache && Date.now() - gameKeyCache.at < 5000) return gameKeyCache.map;
    var map = Object.assign({}, GAME_KEYS);
    try {
      // Native hotkeys panel (when it is open) marks bound buttons with a live key
      // caption; pick those up so the warning stays truthful if the game adds keys.
      $all('.keybinds-btn').forEach(function (b) {
        var t = (b.textContent || '').trim();
        var row = b.closest && b.closest('tr, .options-section-table tr, div');
        var name = row ? (row.textContent || '').toLowerCase() : '';
        if (t && t.length <= 24 && t !== '—' && name) map[t] = map[t] || (b.title || name.slice(0, 40));
      });
    } catch (e) {}
    gameKeyCache = { at: Date.now(), map: map };
    return map;
  }
  function gameKeyHint(code) {
    if (!code) return null;
    var map = gameKeyScan();
    if (map[code]) return map[code];
    var lab = keyLabel(code);
    if (GAME_KEYS[code] || (map[code] !== undefined)) return map[code] || GAME_KEYS[code];
    if (/^(Key[A-Z]|Digit[0-9]|Space|Tab)$/.test(code) && map[lab]) return map[lab];
    return null;
  }

  /* ---------- logo particle field ----------
   * Canvas layered behind the MURTHER wordmark. Particles drift upward with a
   * sine wander and fade in/out over their life. Colors lerp between the accent
   * pair, re-sampled whenever Accent color changes in Settings, so the field is
   * always in sync with the theme. Particles close to the cursor swirl around
   * it (orbit + gentle push). Pauses while the menu is closed or the tab is
   * hidden; runs fewer, dimmer particles under "Reduce effects".
   */
  var particleRAF = 0, particleCanvas = null, particleCtx = null, particles = [];
  var particleHost = null;
  var CURSOR_R = 110, CURSOR_R2 = CURSOR_R * CURSOR_R;
  var particleMouse = { x: -1e4, y: -1e4, in: false };
  function particleMove(e) {
    if (!particleCanvas) return;
    var r = particleCanvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    // canvas coordinates: rect is already scale-aware (menu zoom/transform),
    // the ratio maps visual px back onto the backing store
    particleMouse.x = (e.clientX - r.left) * (particleCanvas.width / r.width);
    particleMouse.y = (e.clientY - r.top) * (particleCanvas.height / r.height);
    particleMouse.in = true;
  }
  function particleLeave() { particleMouse.in = false; particleMouse.x = -1e4; particleMouse.y = -1e4; }
  function particleRGB(hex) {
    var h = String(hex || '').replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    if (isNaN(n)) return [168, 85, 247];
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function accentPalette() {
    var a = particleRGB(S.accent), b = particleRGB(S.accent2 || S.accent);
    return function (t) {
      return 'rgba(' + Math.round(a[0] + (b[0] - a[0]) * t) + ',' + Math.round(a[1] + (b[1] - a[1]) * t) + ',' + Math.round(a[2] + (b[2] - a[2]) * t) + ',';
    };
  }
  function newParticle(w, h, anywhere) {
    return {
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : h + 8,
      v: 0.16 + Math.random() * 0.38,
      r: 0.8 + Math.random() * 1.7,
      hue: Math.random(),
      a: 0.55 + Math.random() * 0.45,
      vx: 0, vy: 0,
      seed: Math.random() * 1000
    };
  }
  function startParticles() {
    if (S.reduceEffects) return;
    if (particleRAF || !menuEl) return;
    var left = $('.mx-left', menuEl);
    if (!left) return;
    particleCanvas = el('canvas', 'mx-particles', left);
    var rect = left.getBoundingClientRect();
    particleCanvas.width = Math.max(120, Math.round(rect.width));
    particleCanvas.height = Math.max(90, Math.round(rect.height));
    particleCtx = particleCanvas.getContext('2d');
    // cursor tracking: the canvas is pointer-events:none, so pointer events land
    // on the panel; nearby particles swirl around the last known cursor position
    particleHost = left;
    left.addEventListener('mousemove', particleMove);
    left.addEventListener('mouseleave', particleLeave);
    var count = S.reduceEffects ? 14 : 26;
    particles = [];
    for (var i = 0; i < count; i++) particles.push(newParticle(particleCanvas.width, particleCanvas.height, true));
    var lastA = '', lastA2 = '', pal = accentPalette();
    function frame() {
      particleRAF = requestAnimationFrame(frame);
      if (!menuOpen || document.hidden || !particleCtx) return;
      // live accent sync: rebuild the palette as soon as Settings changes it
      if (S.accent !== lastA || S.accent2 !== lastA2) { lastA = S.accent; lastA2 = S.accent2; pal = accentPalette(); }
      var c = particleCanvas, x = particleCtx;
      x.clearRect(0, 0, c.width, c.height);
      var mx = particleMouse.x, my = particleMouse.y, mIn = particleMouse.in;
      for (var i = 0; i < particles.length; i++) {
        var pt = particles[i];
        pt.y -= pt.v;
        pt.x += Math.sin((pt.y + pt.seed) * 0.045) * 0.24;
        // cursor swirl: particles near the pointer orbit around it — a dominant
        // tangential spin plus a gentle outward push, both fading with distance.
        // Velocity EASES toward the orbit target (never accumulates), so the
        // field stays bounded: an orbit, not a slingshot.
        if (mIn) {
          var dx = pt.x - mx, dy = pt.y - my, d2 = dx * dx + dy * dy;
          if (d2 < CURSOR_R2 && d2 > 0.01) {
            var d = Math.sqrt(d2), f = 1 - d / CURSOR_R, nx = dx / d, ny = dy / d;
            var sp = 2.4 * f;                      // orbit speed: quicker close in
            var tx = -ny * sp + nx * sp * 0.35;    // tangential + outward push
            var ty = nx * sp + ny * sp * 0.35;
            pt.vx += (tx - pt.vx) * 0.14;
            pt.vy += (ty - pt.vy) * 0.14;
          }
        }
        pt.vx *= 0.94; pt.vy *= 0.94;   // free particles settle back into the drift
        if (pt.vx > 3.4) pt.vx = 3.4; else if (pt.vx < -3.4) pt.vx = -3.4;
        if (pt.vy > 3.4) pt.vy = 3.4; else if (pt.vy < -3.4) pt.vy = -3.4;
        pt.x += pt.vx; pt.y += pt.vy;
        // no bottom cull: fresh spawns start just below the view (h+8) and rise in.
        // Off-canvas particles (top/left/right) recycle to the bottom spawn row.
        if (pt.y < -6 || pt.x < -6 || pt.x > c.width + 6) { particles[i] = newParticle(c.width, c.height, false); continue; }
        var life = Math.sin((1 - pt.y / c.height) * Math.PI);
        x.beginPath();
        x.arc(pt.x, pt.y, pt.r, 0, 6.2832);
        x.fillStyle = pal(pt.hue) + (0.10 + 0.5 * life * pt.a).toFixed(3) + ')';
        x.fill();
      }
    }
    frame();
  }
  function stopParticles() {
    if (particleRAF) cancelAnimationFrame(particleRAF);
    if (particleHost) {
      particleHost.removeEventListener('mousemove', particleMove);
      particleHost.removeEventListener('mouseleave', particleLeave);
      particleHost = null;
    }
    particleRAF = 0; particles = []; particleCanvas = null; particleCtx = null;
    particleMouse.in = false; particleMouse.x = -1e4; particleMouse.y = -1e4;
  }

  function keyConflicts(action, code) {
    // returns the other Murther action bound to the same key, if any
    if (!code) return null;
    for (var a in S.keys) {
      if (a !== action && S.keys[a] === code) return a;
    }
    return null;
  }

  function buildHotkeysView(host) {
    host.innerHTML = '';
    var search = el('input', 'mx-theme-search', host);
    search.placeholder = 'Search hotkeys…';
    var note = el('div', 'mx-kb-note', host);
    note.textContent = 'Client hotkeys — including the Macros section (feed / split bursts / FPS cap / zoom reset). The game\u2019s own split, eject, freeze and multibox keys still live in the game\u2019s Hotkeys panel. Keys marked \u26a0 are also used by the game.';
    var meta = el('div', 'mx-kb-note', host);
    meta.style.opacity = '.8';
    function paintMeta() {
      if (kbLayoutMap) {
        meta.textContent = 'Keyboard layout: ' + (kbLayoutName || 'custom') + ' — key labels match what is printed on your keys.';
        meta.style.color = 'var(--mx-accent2)';
      } else {
        meta.textContent = 'Key labels show the physical (QWERTY) position — this browser does not expose your layout.';
        meta.style.color = 'var(--mx-dim)';
      }
    }
    paintMeta();
    UI.hotkeysMeta = paintMeta;
    var body = el('div', 'mx-theme-body', host);

    function paintBtn(b, action) {
      var code = S.keys[action];
      b.textContent = keyLabelFor(code);
      b.classList.remove('listen');
      var hint = gameKeyHint(code);
      b.classList.toggle('unbound', !code);
      b.classList.toggle('gconf', !!hint);
      var pos = code && !kbLayoutMap ? keyPosHint(code) : '';
      b.title = hint
        ? ('Also used by the game: ' + hint)
        : (code
          ? ('Click to rebind — press Esc to clear' + (pos ? ' · ' + pos : ''))
          : 'Not bound — click to set a key');
    }

    function render(q) {
      q = String(q || '').trim().toLowerCase();
      body.innerHTML = '';
      var shown = 0;
      KEY_SECTIONS.forEach(function (sec) {
        var actions = sec[1].filter(function (a) { return KEY_LABELS[a]; });
        var vis = actions.filter(function (a) { return !q || KEY_LABELS[a].toLowerCase().indexOf(q) !== -1; });
        if (!vis.length) return;
        shown += vis.length;
        var secEl = buildCollapsibleSection(body, sec[0], 'hotkeys', sec[0], vis.length, !!q);
        vis.forEach(function (action) {
          var row = el('div', 'mx-kb', secEl.querySelector('.mx-tsec-body'));
          txt(el('span', '', row), KEY_LABELS[action]);
          var b = el('button', '', row);
          paintBtn(b, action);
          on(b, 'click', function () {
            // One capture at a time: clicking a second row while listening would
            // stack two keydown handlers fighting over the same key.
            if (UI.kbListening) return;
            b.classList.add('listen');
            b.textContent = 'press a key…';
            b.title = 'Press Esc while listening to clear it';
            function handler(e) {
              e.preventDefault(); e.stopPropagation();
              window.removeEventListener('keydown', handler, true);
              UI.kbListening = false;
              if (e.code !== 'Escape') {
                var prev = keyConflicts(action, e.code);
                if (prev) {
                  S.keys[prev] = '';
                  toast('"' + KEY_LABELS[prev] + '" is now unbound');
                }
                S.keys[action] = e.code;
                save();
              } else {
                if (S.keys[action]) { S.keys[action] = ''; save(); }
              }
              paintBtn(b, action);
              refreshAll();
            }
            UI.kbListening = true;
            window.addEventListener('keydown', handler, true);
          });
          row.setAttribute('data-kb-action', action);
        });
      });
      if (!shown) {
        var empty = el('div', 'mx-tsec', body);
        txt(el('div', 'mx-hint', empty), 'No hotkeys match');
      }
    }
    function refreshAll() {
      // repaint every visible row (used after a steal/clear so duplicates resolve)
      $all('.mx-kb', body).forEach(function (row) {
        var action = row.getAttribute('data-kb-action');
        var b = $('button', row);
        if (action && b && !b.classList.contains('listen')) paintBtn(b, action);
      });
    }

    render('');
    on(search, 'input', function () { render(search.value); });
    UI.hotkeysSearch = search;

    var reset = el('button', 'mx-mini', host);
    reset.style.marginTop = '8px';
    txt(reset, 'Reset keybinds');
    on(reset, 'click', function () {
      S.keys = JSON.parse(JSON.stringify(DEFAULTS.keys));
      save();
      buildHotkeysView(UI.hotkeysView);
      toast('Keybinds reset');
    });
  }

  function keyLabel(code) {
    if (!code) return '—';
    if (code === 'Escape') return 'Esc';
    if (code.indexOf('Key') === 0) return code.slice(3);
    if (code.indexOf('Digit') === 0) return code.slice(5);
    return code.replace('Arrow', '');
  }

  /* ---------- keyboard-layout-aware labels ----------
   * Bindings are stored as physical e.code (layout-independent), but the LABEL
   * must show what is printed on the user's keycaps: physical KeyA prints "Q"
   * on AZERTY. The browser's KeyboardLayoutMap gives exactly that mapping, so
   * keyLabelFor() prefers it and only falls back to the code-derived QWERTY
   * letter when unavailable. The map also names the layout family (AZERTY /
   * QWERTZ / QWERTY) shown in the Hotkeys tab.
   */
  var kbLayoutMap = null;      // e.code -> keycap character, when the browser exposes it
  var kbLayoutName = null;     // 'azerty' | 'qwertz' | 'qwerty' | ... (best-effort)
  (function detectKbLayout() {
    try {
      if (navigator.keyboard && typeof navigator.keyboard.getLayoutMap === 'function') {
        navigator.keyboard.getLayoutMap().then(function (m) {
          kbLayoutMap = m;
          var a = m.get('KeyQ') || '', w = m.get('KeyW') || '', y = m.get('KeyY') || '', z = m.get('KeyZ') || '';
          // Family is identified by what is PRINTED on the physical Q/W/Y/Z
          // positions: AZERTY prints A/Z there, QWERTZ prints Y/Z swapped.
          if (a === 'A' && w === 'Z') kbLayoutName = 'AZERTY';
          else if (y === 'Z' && z === 'Y') kbLayoutName = 'QWERTZ';
          else if (a === 'Q' && w === 'W') kbLayoutName = 'QWERTY';
          else kbLayoutName = null;
          if (UI.hotkeysMeta) UI.hotkeysMeta();
        }).catch(function () {});
      }
    } catch (e) {}
  })();

  function keyLabelFor(code) {
    if (!code) return '—';
    if (kbLayoutMap) {
      try {
        var k = kbLayoutMap.get(code);
        if (k) {
          if (code.indexOf('Key') === 0 || code.indexOf('Digit') === 0) return k.toUpperCase();
          if (code === 'Space') return 'Space';
          return k.length === 1 ? k.toUpperCase() : k;
        }
      } catch (e) {}
    }
    return keyLabel(code);
  }

  // Physical position of a key on the reference (QWERTY) block, used to show WHERE
  // a bound key sits on layouts we cannot query (fallback hint).
  function keyPosHint(code) {
    if (!code) return '';
    if (kbLayoutName) return kbLayoutName;
    if (/^Key[A-Z]$/.test(code)) {
      return 'physical ' + code.slice(3) + ' (QWERTY position)';
    }
    return '';
  }

  function keyMatches(e, code) {
    return !!code && e.code === code;
  }

  // Streamer blackout: hide every panel at once, restore the previous per-panel
  // state on the second press.
  var panelsBeforeBlackout = null;
  function toggleAllPanels() {
    var anyVisible = ['topbar', 'score', 'leaderboard', 'minimap', 'chat', 'party'].some(function (k) { return S.panels[k]; });
    if (anyVisible) {
      panelsBeforeBlackout = JSON.parse(JSON.stringify(S.panels));
      Object.keys(S.panels).forEach(function (k) { S.panels[k] = false; });
      toast('HUD hidden');
    } else {
      if (panelsBeforeBlackout) S.panels = panelsBeforeBlackout;
      panelsBeforeBlackout = null;
      toast('HUD restored');
    }
    applyTheme();
  }

  // Reuses the native region tabs via activateNativeRegion — the same machinery as
  // the region pills (AP stays hidden exactly as in the Servers tab).
  function cycleRegion() {
    discoverRegions();
    if (!regionOrder.length) { toast('No server regions found yet', 'bad'); return; }
    var idx = regionOrder.indexOf(currentRegion);
    var next = regionOrder[(idx + 1) % regionOrder.length];
    if (next === currentRegion) return;
    currentRegion = next;
    lastPillClickAt = Date.now();
    renderRegionPills();
    if (activateNativeRegion(next)) {
      toast('Region: ' + (REGION_LABELS[next] || next.toUpperCase()));
      [120, 450, 900, 1500].forEach(function (d) { setTimeout(syncServerRows, d); });
    } else {
      toast('Could not switch region', 'bad');
    }
  }

  // The live native score panel carries the authoritative ID line; the synthetic
  // fallback chips feed the same regex when it is missing.
  function copyText(text, okMsg) {
    function done() { toast(okMsg); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { legacyCopy(text, done); });
    } else legacyCopy(text, done);
  }
  function copyPlayerId() {
    var idm = /ID:\s*(\d+)/i.exec(((DOC.getElementById('score-panel') || {}).textContent) || '');
    if (!idm) { toast('Player ID not available yet', 'bad'); return; }
    copyText(idm[1], 'Player ID copied: ' + idm[1]);
  }
  function legacyCopy(text, done) {
    try {
      var ta = DOC.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;left:-9999px;top:0';
      DOC.body.appendChild(ta);
      ta.select();
      DOC.execCommand('copy');
      ta.remove();
      done();
    } catch (e) { toast('Copy failed', 'bad'); }
  }

  /* ============================== gameplay engine ============================== */
  /* Ryuten-inspired input layer. gota's physics are server-authoritative — no
   * client can change them — so this layer shapes INPUT, not simulation: hold-to
   * feed, multi-split bursts, mouse-button actions, quick chat. Everything drives
   * the game through the same synthetic key events donutextension.js has used on
   * gota for years (window-level keydown/keyup with keyCode/which), so the game's
   * own keybinds stay authoritative and Murther never touches its internals.
   */
  var GP = {
    feedOn: false,
    feedTimer: 0,
    burstKey: null,        // 'Space' while a split burst is in flight
    mo: null               // MutationObserver for the feed input-focus guard
  };
  function gpTyping() {
    var a = DOC.activeElement;
    return !!(a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable));
  }
  function gpPlaying() { return !menuOpen && !gpTyping(); }
  function synthKey(keyCode, down) {
    try {
      window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', {
        key: (keyCode === 32 ? ' ' : String.fromCharCode(keyCode)).toLowerCase(),
        code: keyCode === 32 ? 'Space' : 'Key' + String.fromCharCode(keyCode).toUpperCase(),
        keyCode: keyCode, which: keyCode, bubbles: true, cancelable: true
      }));
    } catch (e) {}
  }
  function gpFeed(on) {
    if (on === GP.feedOn) return;
    GP.feedOn = on;
    if (on) {
      if (!gpPlaying()) { GP.feedOn = false; return; }
      synthKey(S.gameplay.feedKey || 87, true);
      GP.feedTimer = setInterval(function () {
        // a chat focus mid-feed must never leave the eject key latched down
        if (!GP.feedOn || !gpPlaying()) { gpFeed(false); return; }
        synthKey(S.gameplay.feedKey || 87, true);
        synthKey(S.gameplay.feedKey || 87, false);
      }, clamp(parseInt(S.gameplay.feedInterval, 10) || 40, 20, 200));
    } else {
      if (GP.feedTimer) { clearInterval(GP.feedTimer); GP.feedTimer = 0; }
      synthKey(S.gameplay.feedKey || 87, false);
    }
  }
  function gpSplitBurst(times) {
    if (!gpPlaying() || GP.burstKey) return;   // one burst at a time
    var n = clamp(parseInt(times, 10) || 2, 2, 6);
    var gap = clamp(parseInt(S.gameplay.splitBurstDelay, 10) || 3, 2, 20);
    GP.burstKey = 'Space';
    var i = 0;
    (function fire() {
      if (i >= n) { GP.burstKey = null; return; }
      i++;
      synthKey(32, true);
      synthKey(32, false);
      setTimeout(fire, gap);
    })();
  }
  // quick chat: Digit1-9 sends the stored message through the native input's own
  // Enter path (the same one the Enter hotkey machinery below uses).
  function quickChat(n) {
    if (menuOpen || gpTyping()) return;
    var msg = (S.quick && S.quick['q' + n]) || '';
    if (!msg) { toast('Quick chat ' + n + ' is empty — set it in Gameplay', 'bad'); return; }
    var inp = DOC.getElementById('chat-input');
    if (!inp || !inp.isConnected) { toast('Chat not available yet', 'bad'); return; }
    try {
      inp.value = msg.slice(0, 80);
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }));
      setTimeout(function () { try { if (inp.value === msg) { inp.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', keyCode: 13, which: 13 })); inp.blur(); } } catch (e2) {} }, 60);
    } catch (e) {}
  }
  // mouse-button actions: only while actually playing, never over Murther UI
  function gpMouseAllowed(e) {
    if (!gpPlaying()) return false;
    var t = e.target;
    if (t && t.closest && t.closest('#murther-root')) return false;
    return true;
  }
  function gpWireMouse() {
    window.addEventListener('mousedown', function (e) {
      if (!gpMouseAllowed(e)) return;
      if (e.button === 0 && S.gameplay.mouseFeed) gpFeed(true);
      else if (e.button === 2 && S.gameplay.mouseSplit2) gpSplitBurst(2);
      else if (e.button === 3 && S.gameplay.mouseSplit3) gpSplitBurst(3);
      else if (e.button === 4 && S.gameplay.mouseSplit4) gpSplitBurst(4);
    }, true);
    window.addEventListener('mouseup', function (e) {
      if (e.button === 0 && S.gameplay.mouseFeed) gpFeed(false);
    }, true);
    // safety: any blur/visibility loss must release a held feed
    window.addEventListener('blur', function () { gpFeed(false); });
    DOC.addEventListener('visibilitychange', function () { if (DOC.hidden) gpFeed(false); });
  }
  function gpWireFeedFocusGuard() {
    // if an input gains focus mid-feed (chat open), stop feeding immediately
    GP.mo = new MutationObserver(function () { if (GP.feedOn && gpTyping()) gpFeed(false); });
    GP.mo.observe(DOC.documentElement, { childList: true, subtree: true });
    DOC.addEventListener('focusin', function () { if (GP.feedOn && gpTyping()) gpFeed(false); });
  }
  function zoomReset() {
    var cv = N.canvas || DOC.getElementById('canvas');
    if (!cv) { toast('Canvas not ready', 'bad'); return; }
    var ev = new WheelEvent('wheel', {
      bubbles: true, cancelable: true, deltaX: 0,
      deltaY: -1200 * (clamp(parseInt(S.game.zoomSpeed, 10) || 100, 25, 300) / 100),
      deltaMode: 0, clientX: (window.innerWidth / 2) | 0, clientY: (window.innerHeight / 2) | 0
    });
    cv.dispatchEvent(ev);
    toast('Zoom reset sent');
  }
  gpWireMouse();
  gpWireFeedFocusGuard();

  /* ---------- connection history + auto performance mode ---------- */
  var netHist = { fps: [], ping: [] }, NET_MAX = 48, netPushAt = 0;
  function netPush(f, p) {
    var now = Date.now();
    if (now - netPushAt < 500) return;
    netPushAt = now;
    netHist.fps.push(f); netHist.ping.push(p);
    if (netHist.fps.length > NET_MAX) netHist.fps.shift();
    if (netHist.ping.length > NET_MAX) netHist.ping.shift();
    paintNetGraph();
  }
  function paintNetGraph() {
    var c = UI.netGraph;
    if (!c || !c.isConnected || !S.panels.topbar) return;
    var x = c.getContext('2d');
    if (!x) return;
    var w = c.width, h = c.height;
    x.clearRect(0, 0, w, h);
    x.globalAlpha = 1;
    var i, v, px, py;
    // FPS trace: 0 -> bottom, 120+ -> top; color shifts green/amber/red with the level
    x.lineWidth = 1;
    x.beginPath();
    for (i = 0; i < netHist.fps.length; i++) {
      v = clamp(netHist.fps[i] / 120, 0, 1);
      px = (i / (NET_MAX - 1)) * w;
      py = h - 1 - v * (h - 2);
      if (i === 0) x.moveTo(px, py); else x.lineTo(px, py);
    }
    var lastF = netHist.fps.length ? netHist.fps[netHist.fps.length - 1] : 0;
    x.strokeStyle = lastF >= 50 ? 'rgba(74,222,128,.9)' : lastF >= 30 ? 'rgba(250,204,21,.9)' : 'rgba(239,68,68,.9)';
    x.stroke();
    // ping trace: 0 -> top, 250ms+ -> bottom
    x.beginPath();
    for (i = 0; i < netHist.ping.length; i++) {
      v = clamp(netHist.ping[i] / 250, 0, 1);
      px = (i / (NET_MAX - 1)) * w;
      py = 1 + v * (h - 2);
      if (i === 0) x.moveTo(px, py); else x.lineTo(px, py);
    }
    x.strokeStyle = 'rgba(192,132,252,.55)';
    x.stroke();
  }
  var lowFpsSince = 0, autoTunedOnce = false;
  function autoTuneCheck() {
    if (!S.perf.autoTune || autoTunedOnce || menuOpen) return;
    // the rAF meter (startLoops) always runs, so `fps` is the live frame rate
    var cur = fps;
    if (cur > 0 && cur < 45) {
      if (!lowFpsSince) lowFpsSince = Date.now();
      else if (Date.now() - lowFpsSince > 4000) {
        autoTunedOnce = true;
        S.reduceEffects = true;
        applyTheme();
        toast('Low FPS detected — Reduce effects enabled automatically', 'bad');
      }
    } else lowFpsSince = 0;
  }

  /* ============================== native forwarding ============================== */
  // The game wires its menu handlers inside #main; natives stay there (ghosted) and
  // Murther forwards activation with a realistic pointer/mouse/click sequence.
  function nativeClick(node) {
    if (!node || !node.isConnected) return false;
    try {
      var r = node.getBoundingClientRect();
      var opts = {
        bubbles: true, cancelable: true, view: window,
        clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, button: 0
      };
      try { node.dispatchEvent(new PointerEvent('pointerover', opts)); } catch (e) {}
      try { node.dispatchEvent(new PointerEvent('pointerdown', opts)); } catch (e) {}
      try { node.dispatchEvent(new MouseEvent('mousedown', opts)); } catch (e) {}
      try { node.focus(); } catch (e) {}
      try { node.dispatchEvent(new PointerEvent('pointerup', opts)); } catch (e) {}
      try { node.dispatchEvent(new MouseEvent('mouseup', opts)); } catch (e) {}
      node.click();
    } catch (e) {
      try { node.click(); } catch (e2) { return false; }
    }
    return true;
  }

  function forwardPlay() {
    var b = DOC.getElementById('btn-play');
    if (!b) { toast('Native menu is still loading…', 'bad'); return; }
    pushIdentity();
    nativeClick(b);
    // If the native menu hid itself, the join watcher closes our menu. If it did not
    // (network stall, locked name prompt…), keep our menu open and tell the user.
    setTimeout(function () {
      if (!menuOpen) return;
      var m = DOC.getElementById('main');
      var hiddenNow = m && (m.style.display === 'none' || getComputedStyle(m).display === 'none');
      if (hiddenNow || !b.isConnected) setMenu(false);
      else toast('Game did not start — try again', 'bad');
    }, 900);
  }

  function forwardSpectate() {
    var b = DOC.getElementById('btn-spec');
    if (!b) { toast('Native menu is still loading…', 'bad'); return; }
    pushIdentity();
    nativeClick(b);
    setTimeout(function () {
      if (!menuOpen) return;
      var m = DOC.getElementById('main');
      var hiddenNow = m && (m.style.display === 'none' || getComputedStyle(m).display === 'none');
      if (hiddenNow || !b.isConnected) setMenu(false);
      else toast('Could not start spectating — try again', 'bad');
    }, 900);
  }

  function pushIdentity() {
    var nb = DOC.getElementById('name-box');
    var ib = DOC.getElementById('id-box');
    try {
      if (UI.nameShadow && nb && nb.value !== UI.nameShadow.value) {
        nb.value = UI.nameShadow.value;
        nb.dispatchEvent(new Event('input', { bubbles: true }));
        nb.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (UI.idShadow && ib && ib.value !== UI.idShadow.value) {
        ib.value = UI.idShadow.value;
        ib.dispatchEvent(new Event('input', { bubbles: true }));
        ib.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } catch (e) {}
  }

  function pullIdentity() {
    var nb = DOC.getElementById('name-box');
    var ib = DOC.getElementById('id-box');
    try {
      if (UI.nameShadow && nb && DOC.activeElement !== UI.nameShadow && nb.value !== UI.nameShadow.value) {
        UI.nameShadow.value = nb.value;
      }
      if (UI.idShadow && ib && DOC.activeElement !== UI.idShadow && ib.value !== UI.idShadow.value) {
        UI.idShadow.value = ib.value;
      }
    } catch (e) {}
  }

  /* ============================== HUD ============================== */
  var fps = 0, ping = 0;
  var frames = 0, lastFpsT = 0;

  function buildHud() {
    // stats strip (top-center): hosts the live native #score-panel when present;
    // synthetic ID/Mass/Score/Cells chips render until (or after) adoption.
    UI.stats = el('div', 'mx-hud mx-stats', UI.root);
    UI.stId = statChip(UI.stats, 'ID');
    UI.scMass = statChip(UI.stats, 'Mass');
    UI.scScore = statChip(UI.stats, 'Score');
    UI.scCells = statChip(UI.stats, 'Cells');

    // leaderboard (native canvas is adopted into the body when present)
    UI.lb = el('div', 'mx-hud mx-lb', UI.root);
    txt(el('div', 'mx-lb-head', UI.lb), 'Leaderboard');
    UI.lbBody = el('div', 'mx-lb-body', UI.lb);

    // minimap (native panel is adopted into the body when present)
    UI.mm = el('div', 'mx-hud mx-mm', UI.root);
    UI.mmBody = el('div', 'mx-mm-body', UI.mm);
    UI.mmCoords = el('div', 'mx-mm-coords', UI.mm);
    txt(UI.mmCoords, 'x:0 y:0');

    // chat (native #chat-panel is adopted into this root when present)
    UI.chat = el('div', 'mx-hud mx-chat', UI.root);
    buildChatFallback();
    buildNetStrip(); // FPS / Ping / Server — always the top of the chat

    // party (native #party-panel is adopted here when present)
    UI.party = el('div', 'mx-hud mx-party', UI.root);
    txt(el('div', 'mx-party-head', UI.party), 'Party');
    UI.partyBody = el('div', 'mx-party-body', UI.party);

    // menu-open chip (always clickable to reopen)
    UI.chip = el('button', 'mx-chip', UI.root);
    txt(UI.chip, 'M');
    on(UI.chip, 'click', function () { setMenu(true); });

    applyTheme();
    applyAds();
    applyCursor();
  }

  function statChip(host, label) {
    var c = el('div', '', host);
    c.innerHTML = esc(label) + ': <b class="mx-accent-t">—</b>';
    // the ID chip gets an iconfont copy button (glyph ships embedded in the client)
    if (label === 'ID') {
      var cp = el('button', 'mx-cpy mx-click', c);
      cp.type = 'button';
      cp.innerHTML = '<span class="mx-if mx-if-copy" aria-hidden="true"></span>';
      cp.title = 'Copy player ID (I key does the same)';
      on(cp, 'click', function (ev) { ev.stopPropagation(); copyPlayerId(); });
    }
    return c;
  }

  /* ---------- chat connection strip (FPS / Ping / Server) ---------- */
  // Lives as the first child of the chat HUD, so it sits exactly at the top of the
  // chat and follows every chat resize. ensureNetStrip() re-homes it after any chat
  // rebuild (synthetic fallback or native adoption wipe) and applies the toggle.
  function buildNetStrip() {
    var net = el('div', 'mx-net');
    UI.netServer = el('div', 'mx-tb-server', net);
    UI.netServer.innerHTML = '<span class="mx-dot"></span>Server: <b>—</b>';
    UI.netFps = el('div', '', net);
    UI.netFps.innerHTML = 'FPS: <b class="mx-accent-t">—</b>';
    UI.netPing = el('div', '', net);
    UI.netPing.innerHTML = 'Ping: <b class="mx-accent-t">—</b>';
    // 48-sample connection sparkline (Ryuten-style always-visible connection health)
    UI.netGraph = el('canvas', 'mx-netgraph', net);
    UI.netGraph.width = 128; UI.netGraph.height = 36;   // 2x backing for crisp lines
    UI.net = net;
    ensureNetStrip();
  }
  function ensureNetStrip() {
    if (!UI.chat || !UI.net) return;
    if (UI.net.parentElement !== UI.chat) UI.chat.insertBefore(UI.net, UI.chat.firstChild);
    UI.net.classList.toggle('mx-hidden', !S.panels.topbar);
  }

  // Synthetic chat HUD (used until the native #chat-panel is adopted, and rebuilt
  // if the game later destroys it — keeps the chat toggle key meaningful either way).
  function buildChatFallback() {
    if (!UI.chat) return;
    UI.chat.innerHTML = '';
    UI.chatAdopted = false;
    UI.chatBody = el('div', 'mx-chat-body mx-click', UI.chat);
    UI.chatTabs = el('div', 'mx-chat-tabs', UI.chat);
    UI.chatEntry = el('div', 'mx-chat-entry mx-click', UI.chat);
    UI.chatInput = el('input', '', UI.chatEntry);
    UI.chatInput.placeholder = 'Message';
    UI.chatInput.maxLength = 80;
    ensureNetStrip();
  }

  /* ---------- ads ---------- */
  var adSel = ['#ad-wrapper', '#preroll', '.adinplay-consent', '#aip-consent', '#aip_gdpr', '#GOT_gota-io_336x280', '#adblock-fallback'];
  function applyAds() {
    adSel.forEach(function (s) {
      $all(s).forEach(function (n) { n.classList.add('mx-hidden'); });
    });
  }

  /* ============================== native adoption ============================== */
  // The only way to be truly synced with the game is to show the game's own HUD
  // nodes: Murther reparents the live native panels into its chrome and neutralizes
  // their skin with ID-specific CSS. The game keeps updating its own DOM/canvas —
  // whatever it draws is exactly what the player sees. No parsing, no mirroring.
  var nativeHudIds = ['extra-panel', 'score-panel', 'leaderboard-panel', 'minimap-panel', 'party-panel', 'chat-panel'];

  function adoptInto(nativeId, host, stateKey) {
    var n = DOC.getElementById(nativeId);
    // A torn-down root (mid-rebuild) must never swallow the game's own panel.
    if (!n || !host || (stateKey === 'party' && host.isConnected === false)) { setAdoptState(stateKey, false); return; }
    if (n.parentElement !== host) {
      host.appendChild(n);
    }
    // Hidden chat pane must never keep focus: with the pane display:none the
    // game's own Escape/send blur path is unreachable, and a stray focused input
    // would swallow the very Enter/typing keys the player needs next.
    if (nativeId === 'chat-panel') {
      var inp = DOC.getElementById('chat-input');
      var hidden = host.classList.contains('mx-hidden');
      if (hidden && inp && DOC.activeElement === inp) { try { inp.blur(); } catch (e) {} }
    }
    setAdoptState(stateKey, true);
  }

  function adoptNativeHud() {
    if (!UI.root || !UI.root.isConnected) return;

    // The native extra strip (Server / FPS / Ping / Spectators / Reset) is replaced
    // by Murther's own strips: stats top-center, connection above the chat. The
    // live node stays in the DOM (syncFallbacks reads its text) but never shows.
    var extra = DOC.getElementById('extra-panel');
    if (extra) {
      extra.classList.add('mx-hidden');
      if (extra.style.display !== 'none') extra.style.display = 'none';
      setAdoptState('extra', true);
    } else setAdoptState('extra', false);

    // Stats: the native score panel IS the top-center strip (Server/FPS/Ping lines
    // filtered out in CSS+JS). If the game destroys it later, rebuild the synthetic
    // ID/Mass/Score/Cells chips on the next tick.
    var sc = DOC.getElementById('score-panel');
    if (sc && UI.stats) {
      if (UI.scNative !== sc) {
        UI.stats.innerHTML = '';
        UI.stId = UI.scMass = UI.scScore = UI.scCells = null;
        UI.stats.appendChild(sc);
        UI.scNative = sc;
      }
      setAdoptState('score', true);
    } else {
      if (UI.scNative) {
        UI.scNative = null;
        UI.stats.innerHTML = '';
        UI.stId = statChip(UI.stats, 'ID');
        UI.scMass = statChip(UI.stats, 'Mass');
        UI.scScore = statChip(UI.stats, 'Score');
        UI.scCells = statChip(UI.stats, 'Cells');
      }
      setAdoptState('score', false);
    }

    // Leaderboard: live native canvas (game draws it for its own size — a mirror
    // of a ghosted off-screen canvas renders as smeared bars).
    var lb = DOC.getElementById('leaderboard-panel');
    if (lb && UI.lbBody) {
      if (lb.parentElement !== UI.lbBody) {
        UI.lbBody.innerHTML = '';
        UI.lbBody.appendChild(lb);
      }
      setAdoptState('lb', true);
    } else setAdoptState('lb', false);

    // Minimap: live native panel (canvas + coordinates) inside the body.
    var mm = DOC.getElementById('minimap-panel');
    if (mm && UI.mmBody) {
      if (mm.parentElement !== UI.mmBody) {
        UI.mmBody.innerHTML = '';
        UI.mmBody.appendChild(mm);
      }
      setAdoptState('mm', true);
    } else setAdoptState('mm', false);
    // native panel renders its own coordinates: hide the fallback readout when adopted
    if (UI.mmCoords) UI.mmCoords.classList.toggle('mx-hidden', !!mm);

    // Chat: the native pane (container + tab bar + input) becomes the chat HUD.
    // If the game destroys it later, rebuild the synthetic fallback (input included)
    // so the chat HUD and its toggle key never go dead.
    var ch = DOC.getElementById('chat-panel');
    if (ch && UI.chat) {
      if (!UI.chatAdopted) {
        // drop the synthetic fallback children (rebuildable via buildChatFallback)
        UI.chat.innerHTML = '';
        UI.chat.classList.add('mx-click');
        UI.chatAdopted = true;
      }
      if (ch.parentElement !== UI.chat) UI.chat.appendChild(ch);
      ensureNetStrip();
      setAdoptState('chat', true);
    } else {
      if (UI.chatAdopted || !UI.chatInput || !UI.chatInput.isConnected) buildChatFallback();
      setAdoptState('chat', false);
    }

    // Party: native roster gets Murther chrome at top-left (below the menu chip).
    adoptInto('party-panel', UI.partyBody, 'party');
    if (UI.party && UI.partyBody) {
      // Trust the game's own visibility state first: it hides #party-panel while
      // the player has no team (and it comes back the moment a team exists).
      // dedupe rebuild copies: only one native panel may exist
      var copies = $all('#party-panel');
      var nat = copies.length ? copies[copies.length - 1] : null;
      copies.forEach(function (c) { if (c !== nat && c.isConnected && (!nat || nat.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_CONTAINS)) c.remove(); });
      // "game hid it" is ONLY the game's own inline style/class on the panel.
      // Ancestor-based visibility (rects/offsetParent) is off-limits here: when
      // Murther itself hides .mx-party, descendants measure as invisible and the
      // check would feed back into itself, locking the panel hidden forever.
      var natHidden = !nat || nat.style.display === 'none' || nat.classList.contains('hidden');
      // Text fallback for variants where the game keeps it rendered: teamless
      // placeholders never carry a code/number; real rosters do.
      var txtv = ((nat && nat.textContent) || '').trim();
      var hasText = !!txtv;
      var placeholderish = /no party|not in a party|create a party|join a party|you are (alone|not)|^party$/i.test(txtv);
      var empty = natHidden || !hasText || placeholderish;
      UI.party.setAttribute('data-empty', empty ? '1' : '0');
      UI.hasParty = !empty;
    }
  }

  var adoptState = {};
  function setAdoptState(key, ok) { adoptState[key] = !!ok; }

  /* ============================== native bridging ============================== */
  var relocated = false;
  function relocateNative() {
    try {
      if (!N.main) return false;
      ghostNatives();          // #main (menu) lives on, off-screen; Murther drives it
      discoverRegions();
      renderRegionPills();
      syncServerRows();
      relocated = true;
      return true;
    } catch (e) { return false; }
  }

  var GHOST_CSS = 'mx-ghost';
  var GHOSTED = false;
  var joiningGuard = false; // declared early: shared by ghost writes and the join watcher
  function ghostNatives() {
    // Only the native MENU is ghosted — every HUD panel is adopted (shown live)
    // inside Murther's chrome instead of hidden, so it stays perfectly synced.
    joiningGuard = true; // our own style writes must not trip the join watcher
    try {
      var n = DOC.getElementById('main');
      if (n) {
        n.style.setProperty('position', 'fixed', 'important');
        n.style.setProperty('left', '-99999px', 'important');
        n.style.setProperty('top', '0', 'important');
        n.style.setProperty('opacity', '0', 'important');
        n.style.setProperty('pointer-events', 'none', 'important');
        n.style.setProperty('z-index', '-1', 'important');
        n.classList.add(GHOST_CSS);
      }
    } finally {
      setTimeout(function () { joiningGuard = false; }, 350);
    }
    GHOSTED = true;
  }

  function unghostNatives() {
    // Menu stays ghosted permanently while Murther's menu replaces it visually;
    // adopted HUD panels are live children of the Murther root — nothing to restore.
  }

  /* ============================== loops ============================== */
  function startLoops() {
    // FPS fallback meter via rAF — only shown when the native FPS strip is missing.
    function raf(t) {
      frames++;
      if (t - lastFpsT >= 500) {
        fps = Math.round(frames * 1000 / (t - lastFpsT));
        frames = 0; lastFpsT = t;
      }
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // keep adoption tight: the game can rebuild its HUD nodes at any time.
    function tick() {
      try { adoptNativeHud(); } catch (e) {}
      try { syncFallbacks(); } catch (e) {}
      try { pullIdentity(); } catch (e) {}
    }
    setInterval(tick, 500);

    // server rows refresh ~2Hz while menu open
    setInterval(function () {
      if (menuOpen) { try { syncServerRows(); } catch (e) {} }
    }, 500);

    // integrity: re-assert ghosts + settings 1Hz
    setInterval(function () {
      if (S.hideAds) applyAds();
      if (relocated) ghostNatives();
      if (S.crosshair) applyCursor();
      try { autoTuneCheck(); } catch (e) {}
    }, 1000);

    // MutationObserver: catch DOM rebuilds and re-adopt immediately.
    // One cheap boolean read when everything is already cached — the observer
    // fires on every HUD text mutation, so the steady state must cost nothing.
    var mo = new MutationObserver(function () {
      if (N['minimap-canvas'] && N['leaderboard-canvas'] && N['score-panel'] &&
          N['extra-panel'] && N['party-panel'] && N['chat-panel']) return;
      if (!N['minimap-canvas']) N['minimap-canvas'] = DOC.getElementById('minimap-canvas');
      if (!N['leaderboard-canvas']) N['leaderboard-canvas'] = DOC.getElementById('leaderboard-canvas');
      if (!N['score-panel']) N['score-panel'] = DOC.getElementById('score-panel');
      if (!N['extra-panel']) N['extra-panel'] = DOC.getElementById('extra-panel');
      if (!N['party-panel']) N['party-panel'] = DOC.getElementById('party-panel');
      if (!N['chat-panel']) N['chat-panel'] = DOC.getElementById('chat-panel');
    });
    mo.observe(DOC.documentElement, { childList: true, subtree: true });
  }

  // When a native HUD node is missing (page layout changed, panels not yet created),
  // keep the Murther-rendered fallbacks alive so nothing ever goes blank. The native
  // nodes stay in the DOM (hidden or adopted), so their text feeds the strips either
  // way: Server/Ping/FPS come from #extra-panel + #score-panel, stats from #score-panel.
  function syncFallbacks() {
    ensureNetStrip(); // self-heal the strip position after any chat rebuild

    var epn = DOC.getElementById('extra-panel');
    var spn = DOC.getElementById('score-panel');
    // textContent glues adjacent inline elements ("VendettaPing: 110ms") when the
    // source HTML has no whitespace between them (harness + minified pages), so put
    // every known stat label on its own line before parsing.
    var t = ((spn && spn.textContent) || '') + '\n' + ((epn && epn.textContent) || '');
    // (no \b: "VendettaPing" has no word char boundary before "Ping")
    t = t.replace(/(Server|Ping|FPS|Spectators|Reset|ID|Mass|Score|Cells)\s*:/g, '\n$1:');
    var nm = /Server:\s*([^\n|]+)/i.exec(t);
    var pm = /Ping:\s*(\d+)/i.exec(t);
    var fm = /FPS:\s*(\d+)/i.exec(t);
    netPush(fm ? parseInt(fm[1], 10) : fps, pm ? parseInt(pm[1], 10) : ping);   // feed the sparkline (throttled inside)

    // connection strip (FPS / Ping / Server) at the top of the chat
    if (UI.net) {
      var show = !!S.panels.topbar;
      UI.net.classList.toggle('mx-hidden', !show);
      if (show) {
        if (UI.netServer) {
          var name = nm ? nm[1].trim() : '';
          var cur = $('b', UI.netServer);
          if (cur && cur.textContent !== (name || '—')) txt(cur, name || '—');
          var dot = $('.mx-dot', UI.netServer);
          if (!dot) { dot = el('span', 'mx-dot', UI.netServer); UI.netServer.insertBefore(dot, UI.netServer.firstChild); }
          ping = pm ? parseInt(pm[1], 10) : 0;
          dot.className = 'mx-dot' + (ping > 140 ? ' bad' : ping > 70 ? ' warn' : '');
        }
        if (UI.netPing) {
          var pb = $('b', UI.netPing);
          if (pb && pm) txt(pb, pm[1] + 'ms');
        }
        if (UI.netFps) {
          // The native strip carries the authoritative FPS; the rAF meter (monitor
          // refresh rate) only shows while the native FPS value is absent.
          var fb = $('b', UI.netFps);
          if (fb) txt(fb, fm ? fm[1] : String(fps));
        }
      }
    }

    // the native extra strip stays hidden — the game may recreate it or clear styles
    if (epn) {
      if (epn.style.display !== 'none') epn.style.display = 'none';
      epn.classList.add('mx-hidden');
    }

    // adopted score panel: tag its Server/FPS/Ping lines so the CSS filter hides them
    if (adoptState.score && spn) {
      var lines = spn.children;
      for (var i = 0; i < lines.length; i++) {
        var tn = (lines[i].textContent || '').trim();
        var hide = /^Server:/i.test(tn) || /^FPS:/i.test(tn) || /^Ping:/i.test(tn);
        if ((lines[i].getAttribute('data-mx-hide') === '1') !== hide) {
          if (hide) lines[i].setAttribute('data-mx-hide', '1');
          else lines[i].removeAttribute('data-mx-hide');
        }
      }
    }

    // stats fallbacks (top-center ID/Mass/Score/Cells): only when the native panel is absent
    if (!adoptState.score && spn) {
      var idm = /ID:\s*(\d+)/i.exec(t);
      var mass = /Mass:\s*([\d.,]+)/i.exec(t);
      var score = /Score:\s*([\d.,]+)/i.exec(t);
      var cells = /Cells:\s*(\d+)/i.exec(t);
      if (idm && UI.stId) txt(UI.stId, idm[1]);
      if (mass && UI.scMass) txt(UI.scMass, mass[1]);
      if (score && UI.scScore) txt(UI.scScore, score[1]);
      if (cells && UI.scCells) txt(UI.scCells, cells[1]);
    }
  }

  /* ============================== toast ============================== */
  var toastHost = null;
  var TOAST_MAX = 4;   // a macro misfire can toast rapidly — cap the visible stack
  function toast(msg, kind) {
    if (!toastHost) {
      toastHost = el('div', '');
      toastHost.style.cssText = 'position:fixed;left:50%;bottom:70px;transform:translateX(-50%);display:flex;flex-direction:column;gap:6px;z-index:2147483646;pointer-events:none;font-family:var(--mx-font)';
      DOC.body.appendChild(toastHost);
    }
    // overflow: oldest toasts fade out immediately (no stack flooding)
    while (toastHost.childElementCount >= TOAST_MAX) {
      var old = toastHost.firstChild;
      if (!old) break;
      old.style.opacity = '0';
      setTimeout(function (n) { return function () { if (n && n.parentNode) n.remove(); }; }(old), 60);
    }
    var t = el('div', '', toastHost);
    t.textContent = msg;
    t.style.cssText = 'background:rgba(10,10,12,.92);border:1px solid ' + (kind === 'bad' ? '#ef4444' : 'rgba(168,85,247,.5)') + ';color:#fff;padding:8px 16px;border-radius:8px;font-size:13px;opacity:0;transition:opacity .2s';
    requestAnimationFrame(function () { t.style.opacity = '1'; });
    setTimeout(function () {
      t.style.opacity = '0';
      setTimeout(function () { t.remove(); }, 250);
    }, 1800);
  }

  /* ============================== menu state ============================== */
  function setMenu(open) {
    menuOpen = open;
    if (menuEl) menuEl.classList.toggle('mx-hidden', !open);
    DOC.body.classList.toggle('mx-in-menu', open);
    if (open) { syncServerRows(); if (GHOSTED) unghostNatives(); }
    else if (GHOSTED) ghostNatives();
    fxKick();   // indicators draw only while actually playing
  }

  // When the native game hides its own menu (join/spectate), close the Murther menu too.
  // Only arms after boot settles, so load-time races (native show/hide during init) can't close it.
  var joinWatchArmed = false;
  var joinWatchMo = null;
  function watchNativeJoin() {
    var m = N.main || DOC.getElementById('main');
    if (!m) return;
    if (joinWatchMo) { try { joinWatchMo.disconnect(); } catch (e) {} joinWatchMo = null; }   // fresh #main: re-arm
    var mo = new MutationObserver(function () {
      if (!joinWatchArmed || joiningGuard || !menuOpen) return;
      var hidden = m.style.display === 'none' || m.classList.contains('mx-hidden');
      if (hidden) {
        joiningGuard = true;
        try { setMenu(false); } finally { setTimeout(function () { joiningGuard = false; }, 300); }
      }
    });
    joinWatchMo = mo;
    mo.observe(m, { attributes: true, attributeFilter: ['style', 'class'] });
    setTimeout(function () { joinWatchArmed = true; }, 4000);
  }

  /* ============================== keyboard ============================== */
  function wireKeys() {
    // feed hotkey releases on keyup (hold-to-feed); keydown only starts it
    window.addEventListener('keyup', function (e) {
      if (UI.kbListening) return;
      var t = e.target;
      var typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
      if (typing) return;
      if (keyMatches(e, S.keys.feed) || (S.gameplay.mouseFeed && e.button === 0)) gpFeed(false);
    });
    window.addEventListener('keydown', function (e) {
      var t = e.target;
      var typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
      if (typing) return;
      // A hotkey capture is in progress (user is rebinding): those keydowns belong
      // to the picker (it stops them) — never act on them here as well.
      if (UI.kbListening) return;

      if (keyMatches(e, S.keys.menu)) { setMenu(!menuOpen); return; }
      if (keyMatches(e, S.keys.topbar)) { S.panels.topbar = !S.panels.topbar; applyTheme(); return; }
      if (keyMatches(e, S.keys.score)) { S.panels.score = !S.panels.score; applyTheme(); return; }
      if (keyMatches(e, S.keys.leaderboard)) { S.panels.leaderboard = !S.panels.leaderboard; applyTheme(); return; }
      if (keyMatches(e, S.keys.minimap)) { S.panels.minimap = !S.panels.minimap; applyTheme(); return; }
      if (keyMatches(e, S.keys.chat)) { S.panels.chat = !S.panels.chat; applyTheme(); return; }
      if (keyMatches(e, S.keys.party)) { S.panels.party = !S.panels.party; applyTheme(); return; }
      if (keyMatches(e, S.keys.allPanels)) { toggleAllPanels(); return; }
      if (keyMatches(e, S.keys.crosshair)) { S.crosshair = !S.crosshair; if (UI.syncCrosshairRows) UI.syncCrosshairRows(); applyCursor(); toast(S.crosshair ? 'Crosshair pointer enabled' : 'Crosshair pointer disabled'); return; }
      if (keyMatches(e, S.keys.reduceEffects)) { S.reduceEffects = !S.reduceEffects; applyTheme(); return; }
      if (keyMatches(e, S.keys.customTheme)) { S.customTheme = !S.customTheme; applyTheme(); toast(S.customTheme ? 'Custom theme enabled' : 'Custom theme disabled'); return; }
      if (keyMatches(e, S.keys.hideAds)) { S.hideAds = !S.hideAds; applyAds(); save(); toast(S.hideAds ? 'Ads hidden' : 'Ads visible'); return; }
      if (keyMatches(e, S.keys.cycleRegion)) { cycleRegion(); return; }
      if (keyMatches(e, S.keys.copyId)) { copyPlayerId(); return; }
      // gameplay layer: hold-to-feed, split bursts, zoom reset, FPS cap cycle
      if (keyMatches(e, S.keys.feed)) { if (!e.repeat) gpFeed(true); return; }
      if (keyMatches(e, S.keys.split2)) { if (!e.repeat) gpSplitBurst(2); return; }
      if (keyMatches(e, S.keys.split3)) { if (!e.repeat) gpSplitBurst(3); return; }
      if (keyMatches(e, S.keys.split4)) { if (!e.repeat) gpSplitBurst(4); return; }
      if (keyMatches(e, S.keys.split6)) { if (!e.repeat) gpSplitBurst(6); return; }
      if (keyMatches(e, S.keys.zoomReset)) { if (!e.repeat) zoomReset(); return; }
      if (keyMatches(e, S.keys.fpsCap)) { if (!e.repeat) cycleFpsCap(); return; }
      // quick chat slots: Digit1-9 (no client bind needed)
      if (!menuOpen && !e.repeat && e.code && /^Digit[1-9]$/.test(e.code)) { quickChat(parseInt(e.code.slice(5), 10)); return; }
      if (keyMatches(e, S.keys.cursorLine)) { S.game.cursorLine = !S.game.cursorLine; setGame('cursorLine', S.game.cursorLine); fxKick(); toast(S.game.cursorLine ? 'Cursor line on' : 'Cursor line off'); return; }
      if (keyMatches(e, S.keys.lsArrows)) { S.game.lsArrows = !S.game.lsArrows; setGame('lsArrows', S.game.lsArrows); fxKick(); toast(S.game.lsArrows ? 'Linesplit arrows on' : 'Linesplit arrows off'); return; }
      if (keyMatches(e, S.keys.autoZoom)) { S.game.autoZoom = !S.game.autoZoom; setGame('autoZoom', S.game.autoZoom); toast(S.game.autoZoom ? 'Auto zoom on (experimental)' : 'Auto zoom off'); return; }

      // Native chat: gota binds Enter to open chat (focus #chat-input) — and the
      // same handler turns an Enter while the input is focused into "send & blur".
      // Murther's capture handler ran BEFORE the game's, so focusing there made
      // the game see the input as already focused and immediately blur it: a tap
      // never stuck and the key had to be held (key-repeat re-opened it). Focus
      // is now deferred to AFTER the game's handler ran, skipped entirely when
      // the input already has focus (repeat events, or the game opened chat from
      // a click), and cancelled if the game acted on this same event first.
      if (e.key === 'Enter' && !e.repeat && !menuOpen && adoptState.chat && N['chat-input']) {
        var inp = N['chat-input'];
        if (DOC.activeElement === inp) return;   // already typing; nothing to do
        e.cancelChatFocus = false;               // readable by later listeners
        setTimeout(function () {
          // game handled this event (sent/closed chat) -> do not steal focus
          if (e.cancelChatFocus || !inp.isConnected || !adoptState.chat) return;
          if (menuOpen) return;                  // menu opened in the meantime
          if (DOC.activeElement && DOC.activeElement !== DOC.body) return; // user typed elsewhere
          try { inp.focus(); } catch (err) {}
        }, 0);
      }
    }, true);
  }

  /* ============================== boot ============================== */
  function buildAll() {
    // Adopted native HUD panels are children of the Murther root — re-home them to
    // <body> first so tearing down the old root cannot destroy the game's own nodes.
    nativeHudIds.forEach(function (id) {
      var n = DOC.getElementById(id);
      if (n && UI.root && UI.root.contains(n)) DOC.body.appendChild(n);
    });
    if (UI.root) UI.root.remove();
    UI = {};
    adoptState = {};
    var root = el('div');
    root.id = 'murther-root';
    DOC.body.appendChild(root);
    UI.root = root;
    var stamp = DOC.createElement('style');
    stamp.id = 'mx-canvas-cursor';
    root.appendChild(stamp);

    discover();
    buildMenu();
    buildHud();
    relocateNative();
    watchNativeJoin();
    adoptNativeHud();
    applyTheme();
    setMenu(true);
  }

  function boot() {
    if (window.top !== window.self) return;
    // Stage-guarded: a throw in one stage (native DOM still settling after a
    // warm Ctrl+R reload) must not abort the rest or leave the native UI showing.
    // Errors are logged (once) so a broken stage never fails silently.
    function stage(name, fn) { try { fn(); } catch (e) { try { console.error('[murther] boot stage failed: ' + name, e); } catch (e2) {} } }
    stage('style', injectStyle);
    removeBootCover();   // client UI is live: stop hiding the native page
    stage('buildAll', buildAll);
    stage('startLoops', startLoops);
    stage('wireKeys', wireKeys);
  }

  /* ---------- self-heal watchdog (permanent) ----------
   * Warm reloads (Ctrl+R) and slow native bootstraps can leave the client in a
   * broken state: styles stripped, shell detached, or natives un-ghosted (the
   * "native client is back" symptom). The watchdog re-asserts Murther every
   * second, forever, and rebuilds whatever piece went missing. Native JS may
   * also re-render its UI at any time; this heals after that too.
   */
  function heal() {
    if (!booted) return;
    try {
      if (!styleTag || !styleTag.isConnected) injectStyle();
      if (!UI.root || !UI.root.isConnected) { buildAll(); return; }
      if (DOC.body && !DOC.body.classList.contains('murther')) DOC.body.classList.add('murther');
      if (DOC.body && !DOC.body.classList.contains('mx-zoom')) applyMenuScale();
      discover();
      // natives visible but not ghosted/adopted -> re-run the bridge
      var m = DOC.getElementById('main');
      if (m && !m.classList.contains(GHOST_CSS)) {
        var r = m.getBoundingClientRect();
        if (r.width > 1 && r.height > 1) { try { relocateNative(); } catch (e) {} }
        else { try { m.classList.add('mx-ghost-dead'); } catch (e2) {} }   // replaced by a fresh #main: park it off-screen
      }
      if (relocated) { try { renderRegionPills(); } catch (e) {} }
      if (S.crosshair) { try { applyCursor(); } catch (e) {} }
      if (S.customTheme) { try { applyHudTheme(); } catch (e) {} }
      if (menuOpen && !S.reduceEffects && (!particleCanvas || !particleCanvas.isConnected)) { stopParticles(); try { startParticles(); } catch (e) {} }
    } catch (e) {}
  }
  setInterval(heal, 1000);

  /* ---------- boot gate ----------
   * Cloudflare's interstitial ("Performing security verification", Turnstile) is
   * served from play.gota.io itself, so @match fires on it too. Murther must stay
   * fully hidden there and appear only once the user passed the captcha and the
   * real game page is up. Two conditions, both required to boot:
   *   - NO Cloudflare challenge markers (form iframes, _cf_chl_opt, challenge titles)
   *   - native game DOM present (#main / #btn-play / startup loading screen / canvas)
   * A 300ms poll covers soft completions; a hard navigation re-runs the script.
   */
  function cfChallengePage() {
    if (DOC.getElementById('challenge-form') || DOC.getElementById('challenge-running') ||
        DOC.getElementById('challenge-stage') || DOC.getElementById('cf-please-wait') ||
        DOC.getElementById('cf-spinner-please-wait') || DOC.getElementById('challenge-error-title')) return true;
    if (DOC.querySelector('.cf-turnstile, [class*="cf-turnstile"], iframe[src*="challenges.cloudflare.com"], iframe[src*="/cdn-cgi/"]')) return true;
    try { if (window._cf_chl_opt || window._cf_chl_entry) return true; } catch (e) {}
    var t = (DOC.title || '').toLowerCase();
    if (/just a moment|please wait|checking (your browser|if the site connection)|security verification|attention required|verifying you are human/.test(t)) return true;
    return false;
  }
  function gameDomReady() {
    return !!(DOC.getElementById('main') || DOC.getElementById('btn-play') ||
              DOC.getElementById('name-box') || DOC.querySelector('.startup-loading-screen') ||
              DOC.getElementById('canvas') || DOC.getElementById('canvas-container'));
  }
  var booted = false;
  var bootAttempts = 0;
  var bootLastError = null;
  function tryBoot() {
    bootAttempts++;
    if (booted) return;
    if (cfChallengePage()) { removeBootCover(); return; }   // captcha page: stay invisible until it is done
    if (!gameDomReady()) {                                  // not the game yet: keep waiting, keep covered
      if (!bootCover) { try { armBootCover(); } catch (e) {} }
      return;
    }
    booted = true;
    clearInterval(bootPoll);
    try { boot(); } catch (e) { bootLastError = (e && (e.stack || e.message)) || String(e); try { console.error('[murther] boot failed', e); } catch (e2) {} }
  }
  var bootPoll = setInterval(tryBoot, 300);
  if (DOC.readyState === 'loading') on(DOC, 'DOMContentLoaded', tryBoot);
  else tryBoot();

  // debug/diagnostics handle (harmless in production)
  window.__murther = {
    state: function () {
      return JSON.parse(JSON.stringify({
        booted: booted, menuOpen: menuOpen, ghosted: GHOSTED,
        joinWatchArmed: joinWatchArmed, relocated: relocated,
        nativeMainFound: !!N.main, regions: regionOrder.join(','),
        currentRegion: currentRegion, serverRows: N.serverRows ? N.serverRows.length : 0,
        crosshair: !!S.crosshair,
        menuScale: S.menuScale, renderer: S.renderer, rendererLive: currentRendererType(),
        adopted: JSON.parse(JSON.stringify(adoptState)),
        gameplay: { feedOn: GP.feedOn, burst: !!GP.burstKey,
          mouse: [!!S.gameplay.mouseFeed, !!S.gameplay.mouseSplit2, !!S.gameplay.mouseSplit3, !!S.gameplay.mouseSplit4] },
        perf: { fpsCap: S.perf.fpsCap, fps: fps, ping: ping, autoTune: !!S.perf.autoTune, autoTuned: autoTunedOnce,
          netSamples: netHist.fps.length }
      }));
    },
    gate: function () { return { cf: cfChallengePage(), game: gameDomReady(), booted: booted, attempts: bootAttempts, lastError: bootLastError, covered: !!bootCover }; },
    openMenu: function () { setMenu(true); },
    closeMenu: function () { setMenu(false); },
    sync: function () { adoptNativeHud(); syncServerRows(); syncFallbacks(); },
    restoreBackup: function (j) { applyBackup(typeof j === 'string' ? JSON.parse(j) : j); },
    backupPayload: function () { return backupPayload(); },
    particles: function () {
      return { count: particles.length, cursor: particleMouse.in,
        cursorXY: [Math.round(particleMouse.x), Math.round(particleMouse.y)],
        sample: particles.slice(0, 16).map(function (p) { return [Math.round(p.x), Math.round(p.y), Math.round(p.vx * 10) / 10, Math.round(p.vy * 10) / 10]; }) };
    },
  };
})();
