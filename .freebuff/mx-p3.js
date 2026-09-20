const h = require('./mx-patch-helpers.js');
const EM = String.fromCharCode(8212);
// 3a: default on (the feature is now "enabled + key-driven")
h.rep("      lsArrows: false,",
"      lsArrows: true,           // v1.28.0: guide draws while the linesplit key is HELD (this only enables it)",
  '3a default on');
// 3b: lsCodes resolver + fxNeeded gate
h.rep("  function fxNeeded() { return !menuOpen && (S.game.cursorLine || S.game.lsArrows || S.splitIndicator || borderOverlayOn()); }",
"  var lsState = { codes: null, active: false };\n  function lsCodes() {\n    if (lsState.codes && Date.now() - lsState.codes.at < 5000) return lsState.codes.list;\n    var list = [];\n    ['kLineSplit', 'kLineSplitToggle'].forEach(function (f) {\n      var v = parseInt(gameFieldFor({ f: f }), 10);\n      if (v > 0 && list.indexOf(v) === -1) list.push(v);\n    });\n    lsState.codes = { at: Date.now(), list: list };\n    return list;\n  }\n  function fxNeeded() { return !menuOpen && (S.game.cursorLine || lsState.active || S.splitIndicator || borderOverlayOn()); }",
  '3b gate on held key');
h.saveNow();
console.log('P3a SAVED');
