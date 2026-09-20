const h = require('./mx-patch-helpers.js');
const EM = String.fromCharCode(8212);
// 2a: remove the Settings toggle row (comment .. toast handler close)
h.cut("    // v1.27.0: spectate on death (engine: installDeathWatch)\n",
"      toast(sdTg.checked ? 'Spectate on death: on " + EM + " dying opens spectator mode' : 'Spectate on death: off " + EM + " stock auto-respawn');\n    });\n",
"    // v1.28.0: spectate on death is now AUTOMATIC (engine: installDeathWatch)\n    // " + EM + " no setting, no toggle. It no longer mistakes Esc for death either.\n",
  '2a settings row removed');
// 2b: default comment
h.rep("      spectateOnDeath: true,    // v1.27.0: dying opens the game spectator instead of auto-respawn",
"      spectateOnDeath: true,    // v1.28.0: automatic (no user setting any more)",
  '2b default comment');
// 2c: loader forces the flag on
h.rep("      if (out.game && out.game.spectateOnDeath === undefined) out.game.spectateOnDeath = true;",
"      // 1.28.0: spectate-on-death is automatic " + EM + " force the engine flag on so\n      // legacy installs that once unticked the removed setting get it back.\n      if (out.game) out.game.spectateOnDeath = true;",
  '2c loader forces automatic');
// 2d: suppress field
h.rep("  var deathWatch = { mo: null, live: false, busy: 0 };",
"  var deathWatch = { mo: null, live: false, busy: 0, suppress: 0 };",
  '2d suppress field');
// 2e: Esc window respected in the observer
h.rep("    var mo = new MutationObserver(function () {\n      var now = Date.now();\n      if (now < deathWatch.busy) return;\n      var v = vis();\n      if (v && !deathWatch.live) {",
"    var mo = new MutationObserver(function () {\n      var now = Date.now();\n      if (now < deathWatch.busy) return;\n      var v = vis();\n      if (v && !deathWatch.live) {\n        // 1.28.0: pressing Esc re-shows the native menu while still alive " + EM + "\n        // that used to be misread as a death and spectate was pressed (the\n        // freeze report). A recent Escape marks this transition as menu-open.\n        if (now < deathWatch.suppress) { deathWatch.live = true; return; }",
  '2e Esc window respected');
// 2f: Escape marks the window in keydown
h.rep("      if (keyMatches(e, S.keys.menu)) { setMenu(!menuOpen); return; }",
"      // 1.28.0: any Escape opens the native menu look-alike " + EM + " tell the death\n      // watch it is a menu, not a death (prevents the spectate freeze).\n      if (e.key === 'Escape') { try { deathWatch.suppress = Date.now() + 900; } catch (eEsc) {} }\n      if (keyMatches(e, S.keys.menu)) { setMenu(!menuOpen); return; }",
  '2f Esc marked in keydown');
h.saveNow();
console.log('P2 SAVED');
