/* panels-fixture.js — shared fixture for the v1.38.0 hosted native panels
 * (Appearance / Theme tabs).
 *
 * Loaded by test/preview.html and test/harness.html BEFORE the userscript, so the two
 * entry buttons already exist when Murther discovers the native menu. It models the real
 * client's two editors with the anchors its own stylesheet ships (Ci3kQZaT.css):
 *
 *   • #popup-asset-skinner + .asset-skinner-center input + .asset-skinner-last — the look
 *     editor, created LAZILY on the palette click (that is what exercises Murther's
 *     observe-then-adopt path);
 *   • #main-themes with .theme-options-container and the World … Presets rail — the theme
 *     editor, already in the DOM but hidden, which exercises the reveal path (inline
 *     display:none plus the `hidden` attribute).
 *
 * The cockpit at the bottom clicks Murther's REAL nav tabs and reports what the two hosts
 * hold, where the game's nodes live right now (home vs Murther's shell) and what the look
 * strip makes of a pasted imgur page link — so the no-interference promise (the game gets
 * its panel back) is visible instead of assumed.
 */
(function () {
  'use strict';

  var CSS = [
    '.mx-editor-btn{width:30px;height:30px;border-radius:6px;border:1px solid #2a3040;background:#1c2231;color:#cfd4e0;font-size:14px;cursor:pointer}',
    '.mx-editor-btn:hover{background:#2a3247}',
    '#popup-asset-skinner{background:#181c28;border:1px solid #2a3040;border-radius:8px;padding:12px;width:340px;color:#e8e8f0;font-size:12px}',
    '.asset-skinner-head{font-weight:800;font-size:14px;margin-bottom:8px}',
    '.asset-skinner-tabs{display:flex;gap:4px;margin-bottom:8px}',
    '.asset-skinner-tab{flex:1;padding:5px;border-radius:5px;border:1px solid #2a3040;background:#1c2231;color:#8a92a6;font-size:11px;font-weight:700;cursor:pointer}',
    '.asset-skinner-tab.active{background:#f5b53a;color:#1a1a1a}',
    '.asset-skinner-center input{width:100%;height:26px;font-size:12px;margin-bottom:5px;padding:0 7px;box-sizing:border-box;background:#10131c;border:1px solid #2a3040;border-radius:5px;color:#e8e8f0}',
    '.asset-skinner-row{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:4px 0}',
    '.asset-skinner-last{display:flex;gap:6px;margin-top:8px}',
    '.asset-skinner-last input{flex:1;height:26px;background:#10131c;border:1px solid #2a3040;border-radius:5px;color:#e8e8f0;padding:0 7px}',
    '.asset-skinner-last button{padding:0 10px;border-radius:5px;border:none;background:#f5b53a;color:#1a1a1a;font-weight:800;cursor:pointer}',
    '#main-themes .theme-options-tabs{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px}',
    '#main-themes .theme-options-tab{padding:5px 9px;border-radius:5px;border:1px solid #2a3040;background:#1c2231;color:#8a92a6;font-size:11px;font-weight:700;cursor:pointer}',
    '#main-themes .theme-options-tab.active{background:#f5b53a;color:#1a1a1a}',
    /* v1.42.2: an ANCESTOR-SCOPED rule, exactly the shape the real stylesheet is full of
       (#subpanel-content .color-setting__control, #main-themes .options-table input). It is
       the measurable half of the proxy chain: the row labels can only be gold while the
       panel sits inside an element carrying #subpanel-content - which is the whole reason
       Murther lowers the hosted panel into copies of its real ancestors. */
    '#subpanel-content .asset-skinner-row span{color:#f5b53a}',
    '#subpanel-content .asset-skinner-row input[type=color]{border:1px solid #f5b53a}'
  ].join('\n');

  function style() {
    if (document.getElementById('mx-fixture-style')) return;
    var s = document.createElement('style');
    s.id = 'mx-fixture-style';
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  function skinner() {
    var n = document.getElementById('popup-asset-skinner');
    if (n) return n;
    n = document.createElement('div');
    n.id = 'popup-asset-skinner';
    n.innerHTML = [
      '<div class="asset-skinner-head">Appearance</div>',
      '<div class="asset-skinner-tabs">',
      '  <button class="asset-skinner-tab active">My cells</button>',
      '  <button class="asset-skinner-tab">Friends</button>',
      '  <button class="asset-skinner-tab">Bots</button>',
      '  <button class="asset-skinner-tab">Enemies</button>',
      '</div>',
      '<div class="asset-skinner-center">',
      '  <input id="spSkinName" placeholder="https://i.imgur.com/xxxxxx.png">',
      '  <button id="spSkinApply">Apply skin</button>',
      '</div>',
      '<div class="asset-skinner-row"><span>Cell color</span><input type="color" value="#3b82f6"></div>',
      '<div class="asset-skinner-row"><span>Show name</span><input type="checkbox" checked></div>',
      '<div class="asset-skinner-row"><span>Style</span><select><option>Default</option><option>Vignette</option><option>Two-tone</option></select></div>',
      '<div class="asset-skinner-row"><span>Show mass</span><input type="checkbox" checked></div>',
      '<div class="asset-skinner-last">',
      '  <input id="spPresetName" placeholder="Preset name">',
      '  <button id="spSaveLook">Save look</button>',
      '</div>'
    ].join('');
    n.style.display = 'none';
    /* The real game builds this editor inside its shared sub-panel container, so the fixture
       does too: #subpanel-content is an id-bearing ancestor, which is what gives the proxy
       chain something to reproduce (see mxPanelChain in the userscript). */
    var main = document.getElementById('main') || document.body;
    var sub = document.getElementById('subpanel-content');
    if (!sub) { sub = document.createElement('div'); sub.id = 'subpanel-content'; main.appendChild(sub); }
    sub.appendChild(n);
    var tabs = n.querySelectorAll('.asset-skinner-tab');
    for (var i = 0; i < tabs.length; i++) {
      (function (t) {
        t.addEventListener('click', function () {
          var all = n.querySelectorAll('.asset-skinner-tab');
          for (var j = 0; j < all.length; j++) all[j].classList.remove('active');
          t.classList.add('active');
        });
      })(tabs[i]);
    }
    return n;
  }

  function openAppearance() {
    var n = skinner();
    n.style.display = n.style.display === 'none' ? 'block' : 'none';
  }

  function openTheme() {
    var n = document.getElementById('main-themes');
    if (!n) return;
    if (n.hasAttribute('hidden') || n.style.display === 'none') {
      n.removeAttribute('hidden');
      n.style.display = 'block';
    } else {
      n.setAttribute('hidden', '');
      n.style.display = 'none';
    }
  }

  /* The theme panel's own category rail lives inside #main-themes in the real client. The
   * fixture prepends it when the page's stub does not carry one, and parks the panel
   * hidden — so both pages start from the same state Murther has to reveal. */
  function themeStub() {
    var n = document.getElementById('main-themes');
    if (!n) return;
    if (!n.querySelector('.theme-options-tabs')) {
      var rail = document.createElement('div');
      rail.className = 'theme-options-tabs';
      rail.innerHTML = ['world', 'interface', 'grid', 'objects', 'effects', 'presets'].map(function (c, i) {
        return '<button class="theme-options-tab' + (i ? '' : ' active') + '" data-cat="' + c + '">' + c.charAt(0).toUpperCase() + c.slice(1) + '</button>';
      }).join('');
      n.insertBefore(rail, n.firstChild);
    }
    if (!n.hasAttribute('hidden')) n.setAttribute('hidden', '');
    n.style.display = 'none';
  }

  /* The two game buttons, appended to the game's own menu. */
  function entries() {
    var m = document.getElementById('main');
    if (!m || document.getElementById('btn-appearance')) return;
    var host = document.createElement('div');
    host.style.cssText = 'display:flex;gap:6px;margin-top:4px';
    var a = document.createElement('button');
    a.id = 'btn-appearance';
    a.className = 'mx-editor-btn';
    a.setAttribute('aria-label', 'Appearance');
    a.setAttribute('title', 'Appearance');
    a.textContent = '\u25d0';
    var t = document.createElement('button');
    t.id = 'btn-theme';
    t.className = 'mx-editor-btn';
    t.setAttribute('aria-label', 'Theme');
    t.setAttribute('title', 'Theme');
    t.textContent = '\u25a4';
    a.addEventListener('click', openAppearance);
    t.addEventListener('click', openTheme);
    host.appendChild(a);
    host.appendChild(t);
    m.appendChild(host);
  }

  /* ---------- cockpit ---------- */
  function cockpit() {
    if (document.getElementById('mx-np-fixture')) return;
    var box = document.createElement('div');
    box.id = 'mx-np-fixture';
    box.style.cssText = 'position:fixed;right:8px;bottom:8px;z-index:2147483602;background:#0d0d14;border:1px solid #3a3a4a;border-radius:8px;padding:8px 10px;font:11px/1.6 monospace;color:#cfcfe0;max-width:340px';
    box.innerHTML = [
      '<b style="color:#f5b53a">hosted native panels fixture</b><br>',
      'appearance host: <span id="np-app">\u2013</span><br>',
      'theme host: <span id="np-theme">\u2013</span><br>',
      'game nodes live in: <span id="np-home">\u2013</span><br>',
      'saved looks: <span id="np-looks">0</span> \u00b7 strip: <span id="np-chip">\u2013</span><br>',
      'ancestor proxies: <span id="np-proxy">\u2013</span><br>',
      'engine: <span id="np-app-gate">\u2013</span><br>',
      '<button id="np-tab-app" style="font:10px monospace;margin-right:3px">Appearance tab</button>',
      '<button id="np-tab-theme" style="font:10px monospace;margin-right:3px">Theme tab</button>',
      '<button id="np-tab-servers" style="font:10px monospace">Servers tab</button><br>',
      '<button id="np-paste" style="font:10px monospace;margin-right:3px">paste imgur page link</button>',
      '<button id="np-save" style="font:10px monospace;margin-right:3px">save look</button>',
      '<button id="np-retry" style="font:10px monospace">Retry both</button><br>',
      '<span id="np-status" style="color:#8f8ba0;word-break:break-word"></span>'
    ].join('');
    document.body.appendChild(box);

    function bind(id, fn) { var b = document.getElementById(id); if (b) b.addEventListener('click', fn); }
    function tab(label) {
      var tabs = document.querySelectorAll('#murther-root .mx-tab');
      for (var i = 0; i < tabs.length; i++) {
        var lbl = String(tabs[i].textContent || '').trim().toLowerCase();
        if (lbl === label) { tabs[i].click(); return true; }
      }
      return false;
    }
    function setText(id, v) { var n = document.getElementById(id); if (n) n.textContent = v; }
    function status(msg) { setText('np-status', msg); }
    function skinField() {
      return document.querySelector('#murther-root .mx-native-host--appearance #spSkinName') || document.getElementById('spSkinName');
    }

    bind('np-tab-app', function () { status(tab('appearance') ? 'clicked the Appearance tab' : 'Appearance tab not found'); });
    bind('np-tab-theme', function () { status(tab('theme') ? 'clicked the Theme tab' : 'Theme tab not found'); });
    bind('np-tab-servers', function () { status(tab('servers') ? 'clicked the Servers tab' : 'Servers tab not found'); });
    /* v1.44.0: the hosted-panel engine is GATED OFF (MX_HOST = false in the client), because the
     * Appearance and Theme tabs that used to enter it were removed in v1.43.0. This cockpit is
     * kept as the regression rig for that: both entry points must refuse, panels() must say so,
     * and nothing may ever be adopted into the dock - if a future change re-enables hosting
     * without re-adding a tab, this button and the GATED flag below are what say so. */
    var engineGated = null;
    function gateFlag() {
      if (engineGated !== null) return engineGated;
      var d = null;
      try { d = window.__murther && window.__murther.panels(); } catch (e) { d = null; }
      if (!d) return false;                     // client has not booted yet: ask again next tick
      engineGated = d.gated === true;
      return engineGated;
    }
    bind('np-retry', function () {
      try {
        var a = window.__murther.panelOpen('appearance');
        var t = window.__murther.panelOpen('theme');
        status(gateFlag()
          ? ('engine GATED (MX_HOST = false) - panelOpen returned ' + a + ' / ' + t + ', nothing adopted')
          : ('retry forced (hosting is live) - panelOpen returned ' + a + ' / ' + t));
      } catch (e) { status('retry failed: ' + e.message); }
    });
    bind('np-paste', function () {
      var f = skinField();
      if (!f) { status('no skin field on the page yet'); return; }
      f.value = 'https://imgur.com/abc1234';
      f.dispatchEvent(new Event('input', { bubbles: true }));
      f.dispatchEvent(new Event('change', { bubbles: true }));
      status('pasted an imgur PAGE link into the game\u2019s own field');
    });
    bind('np-save', function () {
      var f = skinField();
      if (!f) { status('no skin field on the page yet'); return; }
      var p = document.getElementById('spPresetName');
      if (p) p.value = 'Haruhi';
      f.value = 'https://i.imgur.com/abc1234.png';
      f.dispatchEvent(new Event('input', { bubbles: true }));
      f.dispatchEvent(new Event('change', { bubbles: true }));
      var nameBox = document.querySelector('#murther-root .mx-look-strip .mx-look-name');
      if (nameBox) nameBox.value = 'Haruhi';
      status('set a link + preset name \u2014 now press Save look in Murther\u2019s strip');
    });

    setInterval(function () {
      var app = document.querySelector('#murther-root .mx-native-host--appearance > *');
      var th = document.querySelector('#murther-root .mx-native-host--theme > *');
      function idOf(n) { return n ? ('#' + (n.id || '') + (n.id ? ' ' : '') + '.' + String(n.className || '').split(' ')[0]) : '\u2013'; }
      function where(n) {
        if (!n) return 'absent';
        if (!n.parentElement) return 'detached';
        var p = n.parentElement;
        return p.id || String(p.className || '').split(' ')[0] || '?';
      }
      setText('np-app', idOf(app));
      setText('np-theme', idOf(th));
      setText('np-app-gate', gateFlag() ? 'GATED (MX_HOST = false)' : 'hosting live');
      setText('np-home', 'skinner=' + where(document.getElementById('popup-asset-skinner')) + ' \u00b7 main-themes=' + where(document.getElementById('main-themes')));
      setText('np-looks', String(document.querySelectorAll('#murther-root .mx-look-row').length));
      // v1.42.2: the proxy chain, measured - how many inert ancestors the hosted panel sits
      // in, and whether the ancestor-scoped rule above is matching again (gold labels).
      var appHost = document.querySelector('#murther-root .mx-native-host--appearance');
      var nProx = appHost ? appHost.querySelectorAll('.mx-nav-proxy').length : 0;
      var rowLab = appHost ? appHost.querySelector('.asset-skinner-row span') : null;
      var rowCol = rowLab ? getComputedStyle(rowLab).color : '';
      setText('np-proxy', nProx + ' proxy \u00b7 ancestor rule ' + (rowCol === 'rgb(245, 181, 58)' ? 'LIVE' : (rowCol || '\u2013')));
      var chip = document.querySelector('#murther-root .mx-look-chip span');
      setText('np-chip', chip ? chip.textContent : '\u2013');
    }, 700);
  }

  function boot() {
    style();
    themeStub();
    entries();
    cockpit();
    // the stub menu may be built after us on the harness pages
    setTimeout(entries, 200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.__mxNativeEditors = { appearance: openAppearance, theme: openTheme, skinner: skinner };
})();

/* ---- v1.38.1 UI Scale fixture --------------------------------------------------------
 * The game's own "UI Scale:" control can be serialised in more than one way and this
 * checkout cannot say which build ships which (its bundles are obfuscated, its CSS
 * declares --ui-scale with no consumer, and its config only proves minUiScale/maxUiScale
 * exist). So the settings bridge is exercised in all three shapes it has to survive:
 *
 *   fraction : <input type=range min=0.5 max=1.5 step=0.05 value=1>    a scale factor
 *   percent  : <input type=range min=50  max=150 step=10  value=100>   the same factor in %
 *   preset   : <select> Small / Normal / Large </select>               an option list
 *
 * Swapping the control in place (same id, same cell, same label) is deliberate: that is
 * what a build change looks like to Murther, so the row's re-adoption path
 * (`units: 'auto'` -> refreshBounds on the 500 ms sync) is what gets tested, not only a
 * cold boot. The readout in the cockpit reports the control the bridge found, the serial
 * it classified it as, the factor it applied, and the computed transform of Murther's own
 * panels - plus the adopted native chat panel, which must stay `none` (the reskin pins
 * it), proving the game's own scale can never stack with ours.
 */
(function () {
  'use strict';

  /* The control carries NO id on purpose: the real panel's rows are id-less and the
   * bridge has to match them by LABEL, so the fixture must not hand it an easier path.
   * The node is found back through its row instead. */
  var SHAPES = {
    fraction: { label: 'fraction 0.5..1.5', html: '<input type="range" min="0.5" max="1.5" step="0.05" value="1">' },
    percent: { label: 'percent 50..150', html: '<input type="range" min="50" max="150" step="10" value="100">' },
    preset: { label: 'preset list', html: '<select><option>Small</option><option selected>Normal</option><option>Large</option></select>' }
  };
  var order = ['fraction', 'percent', 'preset'];
  var shape = 'fraction';
  var cur = null;   // the control this fixture last installed

  function controlIn(row) {
    return row ? row.querySelector('input[type=range], input[type=number], select') : null;
  }
  function uiScaleRow() {
    var rows = document.querySelectorAll('#main-options .settings-row, #main-options tr, #main-options li, #main-options td');
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var lbl = r.querySelector('.settings-row__label-text, .settings-row__label, .label-text, label');
      var t = ((lbl && lbl.textContent) || r.textContent || '').trim();
      if (/^ui\s*scale\s*:?/i.test(t)) return r;
    }
    return null;
  }
  /* The harness's panel is the smaller new-markup stub and carries no UI Scale row, so
   * one is created there - in the SAME shape the real workspace uses - instead of leaving
   * the row unexercised on one page and asserted on the other. */
  function ensureRow() {
    var r = uiScaleRow();
    if (r) return r;
    var panel = document.getElementById('main-options');
    if (!panel) return null;
    var div = document.createElement('div');
    div.className = 'settings-row';
    var lab = document.createElement('span');
    lab.className = 'settings-row__label-text';
    lab.textContent = 'UI Scale:';
    div.appendChild(lab);
    panel.appendChild(div);
    return div;
  }

  function install(next, quiet) {
    if (!SHAPES[next]) return false;
    var row = ensureRow();
    if (!row) return false;
    var tmp = document.createElement('div');
    tmp.innerHTML = SHAPES[next].html;
    var node = tmp.firstChild;
    if (!node) return false;
    var old = controlIn(row);
    if (old && old.parentNode) old.parentNode.replaceChild(node, old);   // same row, new serial
    else row.appendChild(node);
    cur = node;
    shape = next;
    try {
      node.addEventListener('input', function () { node.__mxLastNative = node.value; });
      node.addEventListener('change', function () { node.__mxLastNative = node.value; });
    } catch (e) {}
    if (!quiet) paint();
    return true;
  }

  function info() {
    var r = uiScaleRow();
    var c = (cur && cur.isConnected) ? cur : controlIn(r);
    return {
      shape: shape,
      tag: c ? (c.tagName || '').toLowerCase() : null,
      value: c ? String(c.value) : null,
      min: c && c.min !== undefined ? c.min : null,
      max: c && c.max !== undefined ? c.max : null,
      step: c && c.step !== undefined ? c.step : null,
      lastNative: c && c.__mxLastNative !== undefined ? c.__mxLastNative : null,
      selected: c && c.options && c.selectedIndex >= 0 ? c.options[c.selectedIndex].text : null
    };
  }

  var out = null;
  function matrixOf(sel) {
    try {
      var e = document.querySelector(sel);
      if (!e) return 'n/a';
      var t = getComputedStyle(e).transform;
      if (!t || t === 'none') return 'none';
      var m = /matrix\(([^)]+)\)/.exec(t);
      if (m) { var parts = m[1].split(','); return 'scale ' + (parseFloat(parts[0]) || 1).toFixed(2); }
      return String(t).slice(0, 24);
    } catch (e) { return '?'; }
  }
  function paint() {
    if (!out) return false;
    var m = (window.__murther && window.__murther.uiScale) ? window.__murther.uiScale() : null;
    var css = '';
    try { css = getComputedStyle(document.documentElement).getPropertyValue('--mx-ui-scale').trim(); } catch (e) {}
    var n = info(), b = m && m.native ? m.native : {};
    out.textContent =
      'ui scale fixture [' + SHAPES[shape].label + '] · native ' + n.tag + '=' + (n.selected || n.value) +
      (n.tag === 'input' && n.max !== null ? ' (' + n.min + '..' + n.max + ' step ' + n.step + ')' : '') +
      ' · bridge saw ' + (b.found ? b.tag + (b.id ? '#' + b.id : '') + ' ' + b.shape : 'nothing') +
      ' · factor ' + (m ? m.factor : '?') + ' · --mx-ui-scale ' + (css || 'unset') +
      ' · board ' + matrixOf('.mx-lb') + ' · minimap ' + matrixOf('.mx-mm') +
      ' · chat ' + matrixOf('.mx-chat') + ' · adopted #chat-panel ' + matrixOf('#murther-root #chat-panel');
    return true;
  }

  function build() {
    var kb = document.getElementById('mx-test-kb');
    if (!kb) return false;
    var btn = document.createElement('button');
    btn.id = 'fake-uiscale-shape';
    btn.style.cssText = 'font:10px monospace';
    btn.textContent = '[SIM] UI scale shape';
    out = document.createElement('span');
    out.id = 'fake-uiscale-state';
    out.style.color = '#8f8ba0';
    out.style.wordBreak = 'break-word';
    kb.appendChild(document.createElement('br'));
    kb.appendChild(btn);
    kb.appendChild(document.createElement('br'));
    kb.appendChild(out);
    btn.addEventListener('click', function () {
      var next = order[(order.indexOf(shape) + 1) % order.length];
      if (!install(next)) { out.textContent = 'ui scale fixture: no native stub cell found'; return; }
      if (window.__murther && window.__murther.sync) { try { window.__murther.sync(); } catch (e) {} }
    });
    return true;
  }

  var tries = 0;
  (function boot() {
    if (!build()) { if (++tries < 40) setTimeout(boot, 250); return; }
    install('fraction', true);
    paint();
  })();
  setInterval(function () { try { paint(); } catch (e) {} }, 500);

  window.__mxUiScale = { shape: function () { return shape; }, set: install, info: info, readout: paint, shapes: order.slice() };
})();
