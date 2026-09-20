/* v1.54.1: finish the OtoRev repairs in murther.user.js (see RELEASE HISTORY, v1.54.1).
 * Every edit must match EXACTLY ONCE or the script aborts without writing anything.
 * Run: node tools/apply-v1541.cjs */
const fs = require('fs');
const P = 'murther.user.js';
let s = fs.readFileSync(P, 'utf8');
if (s.indexOf('// @version      1.54.1') !== -1) { console.log('murther.user.js is already at 1.54.1 - nothing to do'); process.exit(0); }

const edits = [];
const E = (o, w) => edits.push([o.join('\n'), w.join('\n')]);

/* 1. fireTrigger: accept the bind channel; a bind press that wants aim locks it through the call */
E([
  "    function fireTrigger(why) {",
  "      state.triggers++;",
  "      state.lastTriggerAt = Date.now();",
  "      state.lastTriggerWhy = why;",
], [
  "    function fireTrigger(why, opts) {",
  "      state.triggers++;",
  "      state.lastTriggerAt = Date.now();",
  "      state.lastTriggerWhy = why;",
  "      /* v1.54.1: a bind press that wants aim locks it HERE, through the call - never parked on state, so a throw can no longer latch it on. */",
  "      if (opts && opts.aim && state.autoAim !== 'off') { try { acquireLock('bind press'); } catch (eAim) { state.errors++; } }",
]);

/* 2. fireTrigger: restore the reverse-arming block an earlier edit dropped (the trigger armed the window but never the reversal) */
E([
  "      var wasSolo = state.reverseMode === 'solo64x';   // v1.54.1: solo holds the aim lock through the fanout",
], [
  "      try {",
  "        var R2 = window.__murtherReverse = window.__murtherReverse || { on: false, flips: 0, at: 0 };",
  "        R2.on = true; R2.at = Date.now();",
  "      } catch (e3) {}",
  "      var wasSolo = state.reverseMode === 'solo64x';   // v1.54.1: solo holds the aim lock through the fanout",
]);

/* 3. aimTick: only read a vector out of a 9-byte tick (a 1-byte split frame has none; reading past its end threw RangeError) */
E([
  "    function aimTick(dv) {",
  "      if (state.autoAim === 'off' && !state.acquireLockNow) return false;",
  "      if (Date.now() - state.lock.at > state.lockMaxAgeMs) { state.lock = null; if (!state.acquireLockNow) return false; }",
], [
  "    function aimTick(dv) {",
  "      if (state.autoAim === 'off' || !state.lock) return false;",
  "      if (!dv || dv.byteLength < 9) return false;   // v1.54.1: a 1-byte split frame carries no aim vector",
  "      if (Date.now() - state.lock.at > state.lockMaxAgeMs) { state.lock = null; return false; }",
]);

/* 4. inspect: branch on the frame's own shape (9-byte tick vs 1-byte split); drop the parked aim-request mechanism */
E([
  "    function inspect(u8, dv) {",
  "      if (!state.enabled) return false;",
  "      var bindAim = !!state.acquireLockNow;         // v1.54.1: a bind press wants aim even with auto aim off",
  "      state.ticks++;",
  "      if (u8 && u8.length) state.lastOp = u8[0];",
  "      refreshOwnCells();",
  "      try { aimTick(dv); } catch (eA) { state.errors++; }",
  "      if (bindAim || (u8 && isSplitTick(u8))) {",
  "        try { acquireLock(bindAim ? 'bind press' : true); } catch (eL) { state.errors++; }",
  "      }",
  "      if (bindAim) return true;",
  "      return Date.now() < state.windowUntil;",
  "    }",
], [
  "    /* v1.54.1: branch on the frame's own shape. The 9-byte 0x10 tick gets aimTick and the",
  "     * reverse decision; the 1-byte 0x11 split gets its classification. aimTick never runs on",
  "     * a split frame - it carries no vector, and reading one past its end threw RangeError. */",
  "    function inspect(u8, dv) {",
  "      if (!state.enabled) return false;",
  "      var isTickShape = !!(u8 && u8.length === 9 && u8[0] === 0x10);",
  "      var isSplitShape = !!(u8 && isSplitTick(u8));",
  "      state.ticks++;",
  "      if (u8 && u8.length) state.lastOp = u8[0];",
  "      if (isTickShape || isSplitShape) refreshOwnCells();",
  "      if (isSplitShape) {",
  "        try { classifySplit(dv); } catch (eC) { state.errors++; }",
  "        if (state.autoAim !== 'off') { try { acquireLock(true); } catch (eL) { state.errors++; } }",
  "      }",
  "      if (!isTickShape) return false;",
  "      try { aimTick(dv); } catch (eA) { state.errors++; }",
  "      return Date.now() < state.windowUntil;",
  "    }",
]);

/* 5. otorevFire: pass the aim request through the call; drop the parked-state mechanism */
E([
  "      var m = window.__murtherOtoRev;",
  "      if (!m || !m.state) { toast('OtoRev module not loaded', 'bad'); return; }",
  "      var prev = m.state.reverseMode;",
  "      m.state.reverseMode = mode;",
  "      try { m.state.acquireLockNow = true; } catch (eL2) {}",
  "      try { m.fireTrigger('bind: ' + mode); } catch (eF) { toast('OtoRev bind failed', 'bad'); }",
  "      try { delete m.state.acquireLockNow; } catch (eL3) {}",
  "      m.state.reverseMode = prev;",
], [
  "      var m = window.__murtherOtoRev;",
  "      if (!m || !m.fireTrigger) { toast('OtoRev module not loaded', 'bad'); return; }",
  "      var prev = m.state.reverseMode;",
  "      m.state.reverseMode = mode;",
  "      try { m.fireTrigger('bind: ' + mode, { aim: true }); } catch (eF) { toast('OtoRev bind failed', 'bad'); }",
  "      m.state.reverseMode = prev;",
]);

/* 6. fanout: make the documented anti-freeze real on a send throw */
E([
  "          } catch (eF) { state.errors++; return; }   // anti-freeze: a throw closes the chain",
], [
  "          } catch (eF) {",
  "            state.errors++;",
  "            /* v1.54.1: antiFreeze makes the documented finally real - a throw closes the window and releases the lock. */",
  "            if (state.antiFreeze) { try { state.windowUntil = 0; state.lock = null; state.lockName = ''; } catch (eR) {} }",
  "            return;",
  "          }",
]);

/* 7. OtoRev tab: the reverse-mode row names the real mechanism instead of the removed one */
E([
  "      'Which multi-split a single press fans out into. 1x = the stock single split; 4x/8x/16x/64x chain the engine\\u2019s own split actions together with splitDelayMs between them. Solotrick 64x is the same 64x fanout but the reverse window is held through the whole rollout (soloHoldMs) and the aim lock, if any, is not released until the fanout lands.',",
], [
  "      'Which multi-split a single press fans out into. 1x = the stock single split; 4x/8x/16x/64x send the extra real split frames (op 0x11) on the game socket, splitDelayMs apart - the press you made is the first one. Solotrick 64x is the same 64x fanout but the reverse window is held through the whole rollout (soloHoldMs) and the aim lock, if any, is not released until the fanout lands.',",
]);

/* 8. OtoRev tab: fanout frames sent joins the diagnostics counters */
E([
  "        '\\nTriggers fired: ' + d.triggers +",
  "        '   \\u00b7   errors: ' + d.errors +",
], [
  "        '\\nTriggers fired: ' + d.triggers +",
  "        '   \\u00b7   errors: ' + d.errors +",
  "        '   \\u00b7   fanout frames sent: ' + (d.fanoutFrames || 0) +",
]);

/* 9. version: the code is annotated v1.54.x; the header follows (GM_info fallback reads it) */
E([
  "// @version      1.53.0",
], [
  "// @version      1.54.1",
]);

/* 10. release note: newest last, right above the v1.44.0 signpost */
E([
  "// ---------------------------------------------------------------------------",
  "// v1.44.0: the header lives ABOVE the release history, not here. These six lines",
], [
  "// v1.54.1: OtoRev's four dead paths are live, and each fix is the honest one. The fanout no",
  "// longer dispatches synthetic key events the engine is known to ignore - it sends the real",
  "// 1-byte split frames (op 0x11) through the tracked game socket, the boundary the reverse",
  "// rewrite already owns, with splitDelayMs between presses and anti-freeze closing the window",
  "// and releasing the lock if a send throws. The mode -> split mapping is written ONCE",
  "// (1/2/3/4/6 presses reach 2/4/8/16/64 cells; the player's own trusted press is the first,",
  "// so 64x sends 5 extra frames where the old double map sent 4). Bind presses call",
  "// fireTrigger directly - a bind is an explicit user action, so the trigger mode governs the",
  "// AUTOMATIC detector only, and a bind can never be dead in confirmed mode again; the press",
  "// asks for a fresh aim lock through the call, never through parked state. The automatic",
  "// detector finally SEES the frames it classifies: the send wrapper inspects the 1-byte op",
  "// 0x11 shape beside the 9-byte tick, and isSplitTick tests the split frame's own shape",
  "// instead of the tick's 9 bytes, which nothing split-shaped can satisfy. 'Confirmed' now",
  "// means confirmed: a split is only counted ignored when the scene read shows the 16-cell cap",
  "// already reached (prevCellCount was never fed before), so plain second presses stay",
  "// 'predictive'. aimTick only reads a vector out of 9-byte ticks. Solo trick holds its lock",
  "// through the rollout and releases it when the window closes. The OtoRev tab's mode row and",
  "// diagnostics name the new mechanism, and fanout frames sent joins the counters.",
  "//",
  "// ---------------------------------------------------------------------------",
  "// v1.44.0: the header lives ABOVE the release history, not here. These six lines",
]);

let n = 0;
for (const [o, w] of edits) {
  const first = s.indexOf(o), last = s.lastIndexOf(o);
  if (first === -1 || first !== last) {
    console.error('EDIT ' + (n + 1) + '/' + edits.length + ': ' + (first === -1 ? 'NOT FOUND' : 'NOT UNIQUE') + ' :: ' + o.slice(0, 72).replace(/\n/g, ' | '));
    process.exit(1);
  }
  s = s.slice(0, first) + w + s.slice(first + o.length);
  n++;
}
fs.writeFileSync(P, s);
console.log('applied ' + n + '/' + edits.length + ' edits to ' + P);
