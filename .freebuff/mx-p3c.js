const h = require('./mx-patch-helpers.js');
const EM = String.fromCharCode(8212);
// 3e: release paths in fxWire
h.rep("  function fxWire() {\n    if (fxWired) return;\n    fxWired = true;\n    window.addEventListener('mousemove', onFxMouseMove, true);\n    window.addEventListener('mouseout', onFxMouseOut, true);\n  }",
"  function fxWire() {\n    if (fxWired) return;\n    fxWired = true;\n    window.addEventListener('mousemove', onFxMouseMove, true);\n    window.addEventListener('mouseout', onFxMouseOut, true);\n    // v1.28.0: release paths for the guide " + EM + " keyup (capture, runs even while\n    // typing) and mouse buttons bound in the game (LMB=1, RMB=2, MMB=3).\n    window.addEventListener('keyup', function (e) {\n      if (lsState.active && lsCodes().indexOf(e.keyCode) !== -1) { lsState.active = false; fxKick(); }\n    }, true);\n    window.addEventListener('mouseup', function (e) {\n      var code = e.button === 0 ? 1 : (e.button === 2 ? 2 : 3);\n      if (lsState.active && lsCodes().indexOf(code) !== -1) { lsState.active = false; fxKick(); }\n    }, true);\n  }",
  '3e release paths wired');
// 3f: menu-open belt-and-suspenders clear (lsState is in scope: same IIFE)
h.rep("  function setMenu(open) {\n    menuOpen = open;",
"  function setMenu(open) {\n    menuOpen = open;\n    try { if (typeof lsState !== 'undefined') lsState.active = false; } catch (eLs) {}   // v1.28.0: menu never keeps the guide alive",
  '3f menu clears guide');
h.saveNow();
console.log('P3c SAVED');
