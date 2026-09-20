const h = require('./mx-patch-helpers.js');
// one-time flip for existing installs: lsArrows false was the OLD design (always
// drawing); v1.28 makes it key-driven, so everyone gets the new behavior once.
h.rep("      if (out.game && out.game.spectateOnDeath === undefined) out.game.spectateOnDeath = true;",
"      if (out.game && out.game.spectateOnDeath === undefined) out.game.spectateOnDeath = true;\n      // v1.28.0: one-time flip " + String.fromCharCode(8212) + " old installs saved lsArrows:false under the\n      // always-draw design; the key-driven guide ships enabled and hides itself.\n      try {\n        if (out.game && out.game.lsArrows === false && !localStorage.getItem(LS_SETTINGS + '.ls128')) {\n          out.game.lsArrows = true;\n          localStorage.setItem(LS_SETTINGS + '.ls128', '1');\n        }\n      } catch (eLsM) {}",
  'lsArrows one-time migration');
h.saveNow();
console.log('P6 SAVED');
