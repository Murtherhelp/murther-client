const h = require('./mx-patch-helpers.js');
const EM = String.fromCharCode(8212);
const RS = String.fromCharCode(8217);
const AR = String.fromCharCode(8594);
// 4: remove the Split indicator color row + note
h.cut("    var siRow = el('div', 'mx-set-row', inBody);\n",
"siNote.textContent = 'Split indicator: rings preview each cell" + RS + "s post-split reach (toggle in Hotkeys " + AR + " Indicators; bind it there - it ships unbound). It draws only when a live cells feed exists.';\n",
'',
  '4 split indicator color removed');
// 5a: notifications default OFF
h.rep("    notifications: true,      // show the game's own top notification banners (gota-toast)",
"    notifications: false,     // v1.28.0: game banners ship OFF (re-enable in Settings)",
  '5a default off');
// 5b: one-time migration stamp so explicit opt-ins survive
h.rep("  function save() { try { localStorage.setItem(LS_SETTINGS, JSON.stringify(S)); } catch (e) {} }",
"  function save() { try { localStorage.setItem(LS_SETTINGS, JSON.stringify(S)); } catch (e) {} }\n  // v1.28.0: one-time stamp " + EM + " installs saved BEFORE notifications shipped OFF\n  // had the old default (true); they keep the old behavior unless they change it.\n  try {\n    var mxPrev = JSON.parse(localStorage.getItem(LS_SETTINGS) || 'null');\n    if (mxPrev && mxPrev.notifications === true) localStorage.setItem(LS_SETTINGS + '.notifs_legacy', '1');\n  } catch (eM) {}",
  '5b migration stamp');
// 6: searchbar text
h.rep("search.placeholder = 'Search theme...';", "search.placeholder = 'Search themes...';", '6 search placeholder');
// 7: blur scale fix
h.rep("    function hudCss(sel, op, blur) {\n      if (!on) return '';\n      var c = [];\n      if (parseFloat(op) < 1) c.push('opacity:' + clamp(parseFloat(op), 0, 1));\n      if (parseInt(blur, 10) > 0) c.push('backdrop-filter:blur(' + parseInt(blur, 10) + 'px)');\n      return c.length ? sel + '{' + c.join(';') + ' !important}' : '';\n    }",
"    function hudCss(sel, op, blur) {\n      if (!on) return '';\n      var c = [];\n      if (parseFloat(op) < 1) c.push('opacity:' + clamp(parseFloat(op), 0, 1));\n      // v1.28.0 fix: sliders store px*10 (0.1 steps). parseInt truncated every\n      // sub-px value to 0 (slider looked dead) and painted 10x above 1px\n      // (hundreds of px of blur = a solid smear = 'blur not working').\n      var bpx = (parseFloat(blur) || 0) / 10;\n      if (bpx > 0) c.push('backdrop-filter:blur(' + Math.round(bpx * 10) / 10 + 'px)');\n      return c.length ? sel + '{' + c.join(';') + ' !important}' : '';\n    }",
  '7 blur scale fixed');
h.saveNow();
console.log('P4 SAVED');
