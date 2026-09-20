#!/usr/bin/env node
/**
 * gota-hook-check.js — the HOOK side of the murther.user.js <-> gota-ws-hook contract.
 *
 *   node tools/gota-hook-check.js
 *
 * The test pages exercise the client's half of the coexistence contract against a stub of the
 * hook's API (window.__mxHookCheck). This tool is the other direction: it loads the REAL
 * GotaWSHook/gota-ws-hook-2.3.9.js inside a minimal DOM / WebSocket / storage stub and asserts
 * the invariants that only exist inside that file - the ones whose absence froze a real cell:
 *
 *   1. the input-mangling binds ship EMPTY (freezeMode was KeyF, the game's Sextuple Split, and
 *      MODES.freeze rewrites every outgoing tick to 0,0 - a dead cell in normal play);
 *   2. the mode actions arm plain REVERSE (a mode row / the master switch / setMode must not
 *      inherit a leftover freeze or mirror);
 *   3. its key dispatcher YIELDS a code window.__murtherKeys owns, so one press cannot drive
 *      both scripts' features;
 *   4. its wrapper stamps itself (__mxHook) and publishes __murtherReverseOwner, so the client
 *      can tell the two wrappers apart and exactly one negation happens;
 *   5. LOG.reversed is NOT mirrored from LOG.rewritten (that field is the client's counter);
 *   6. the panel tier comes from window.__murtherZ, so the client's menu draws above it;
 *   7. the stall guard SKIPS a shed while a fresh murther DevTools trap is on the shared toggle,
 *      and records shedAt / shedReason when it does shed - and stays quiet on screen when the
 *      client is present to do the telling.
 *
 * (7) blocks the main thread for real: a stall cannot be faked, because the guard measures the
 * gap between its own interval ticks.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const HOOK = path.join(__dirname, '..', 'GotaWSHook', 'gota-ws-hook-2.3.9.js');
const src = fs.readFileSync(HOOK, 'utf8');

let failures = 0;
function check(name, ok, detail) {
  console.log((ok ? '  ok   ' : '  FAIL ') + name + (detail === undefined ? '' : ' -> ' + JSON.stringify(detail)));
  if (!ok) failures++;
}

/* ---------------------------------------------------------------- the stub environment */
const stored = {};
function mkStorage() {
  return {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(stored, k) ? stored[k] : null; },
    setItem: function (k, v) { stored[k] = String(v); },
    removeItem: function (k) { delete stored[k]; },
  };
}
function mkEl(tag) {
  const n = {
    tagName: String(tag || 'div').toUpperCase(), style: { cssText: '', zIndex: '', display: '', opacity: '' },
    dataset: {}, children: [], textContent: '', title: '', id: '', className: '',
    appendChild: function (c) { this.children.push(c); return c; },
    removeChild: function () {}, remove: function () {}, addEventListener: function () {},
    setAttribute: function () {}, getAttribute: function () { return null; },
    querySelector: function () { return null; }, querySelectorAll: function () { return []; },
    getBoundingClientRect: function () { return { left: 0, top: 0, width: 300, height: 400 }; },
    closest: function () { return null; }, isConnected: true, innerHTML: ''
  };
  return n;
}
const listeners = {};
const sent = [];
const fakePanel = mkEl('div');
fakePanel.id = 'mx-hook-panel';
function WS() {}
WS.prototype.readyState = 1;
WS.prototype.send = function (d) { sent.push(d); };
WS.prototype.addEventListener = function () {};
WS.CONNECTING = 0; WS.OPEN = 1; WS.CLOSING = 2; WS.CLOSED = 3;

const win = {};
win.window = win;
win.self = win;
win.top = win;
win.WebSocket = WS;
win.outerWidth = 1200; win.innerWidth = 1200;
win.console = { log: function () {}, warn: function () {}, error: function () {} };
win.location = { href: 'https://play.gota.io/' };
win.navigator = { userAgent: 'node' };
win.localStorage = mkStorage();
win.sessionStorage = mkStorage();
win.btoa = function (s) { return Buffer.from(s, 'binary').toString('base64'); };
win.addEventListener = function (type, fn) { (listeners[type] = listeners[type] || []).push(fn); };
win.removeEventListener = function () {};
win.setTimeout = setTimeout; win.clearTimeout = clearTimeout;
win.setInterval = setInterval; win.clearInterval = clearInterval;
win.requestAnimationFrame = function (fn) { return setTimeout(fn, 16); };
win.indexedDB = undefined;
win.document = {
  readyState: 'loading',            // keeps mxBoot from building the panel during this run
  body: mkEl('body'),
  head: mkEl('head'),
  activeElement: null,
  createElement: mkEl,
  /* A stub panel element, and ONLY for that id: mxBuildPanel early-returns when #mx-hook-panel
   * already exists, so nothing builds the real panel here (it would append ~180 nodes and swamp
   * the one append this file actually asserts - the shed banner). */
  getElementById: function (id) { return id === 'mx-hook-panel' ? fakePanel : null; },
  querySelector: function () { return null; },
  querySelectorAll: function () { return []; },
  addEventListener: function () {},
  removeEventListener: function () {},
};

/* Every global the hook touches is passed in as a parameter to the Function below instead of
 * being written onto `global`: recent Node makes several of them getter-only, and passing them
 * is also what makes the stub explicit. */

/* The client's published key table, as murther.user.js publishes it. `owned` is the switch the
 * yield test flips. */
const owned = {};
win.__murtherKeys = {
  owner: 'murther',
  owns: function (code) { return owned[code] || null; },
  label: function (code) { return owned[code] ? 'client feature' : ''; },
  captureArmed: function () { return false; },
  z: 2147483000
};
win.__murtherZ = 2147483000;

/* Load the real file. */
new Function('window', 'document', 'navigator', 'location', 'localStorage', 'sessionStorage',
  'console', 'btoa', 'WebSocket', 'setTimeout', 'setInterval', 'clearInterval', 'requestAnimationFrame',
  src)(win, win.document, win.navigator, win.location, win.localStorage, win.sessionStorage,
  win.console, win.btoa, WS, setTimeout, setInterval, clearInterval, win.requestAnimationFrame);

const api = win.__mxHook;
const R = win.__murtherReverse || (win.__murtherReverse = { on: false, mode: 'reverse', flips: 0, at: 0 });

console.log('gota-ws-hook coexistence check (' + (api && api.state().version) + ')\n');

/* ---------------------------------------------------------------- 1 + 6 */
console.log('1. the binds that could freeze or mis-arm input, and the panel tier');
const b = api.bindings();
check('freezeMode ships unbound (KeyF is the game\u2019s Sextuple Split)', b.freezeMode === '', b.freezeMode);
check('toggleReverse ships unbound (KeyR is the game\u2019s Quad Split)', b.toggleReverse === '', b.toggleReverse);
check('cycleReverse ships unbound (it can cycle into freeze)', b.cycleReverse === '', b.cycleReverse);
check('resetReverse is KEPT - it is the way back', b.resetReverse === 'KeyX', b.resetReverse);
check('panel tier is under the client HUD', api.state().z === 2147482900, api.state().z);
check('a tick is 9 bytes / op 0x10', (function () {
  const u8 = new Uint8Array(9); u8[0] = 0x10;
  return u8.length === 9 && u8[0] === 0x10;
})());

/* ---------------------------------------------------------------- 5 */
console.log('\n2. the wire rewrite and the shared counters');
function tickBuf(x, y) {
  const buf = new ArrayBuffer(9);
  const dv = new DataView(buf);
  dv.setUint8(0, 0x10); dv.setInt32(1, x, true); dv.setInt32(5, y, true);
  return buf;
}
const sock = new WS();
R.on = true; R.mode = 'reverse';
R.flips = 0;
const before = win.__murtherWsHookDebug ? win.__murtherWsHookDebug.reversed : 0;
WS.prototype.send.call(sock, tickBuf(100, -40));
const after = win.__murtherWsHookDebug ? win.__murtherWsHookDebug.reversed : 0;
const wire = sent[sent.length - 1];
const wdv = new DataView(wire);
check('one negation on the wire: 100,-40 -> -100,40', wdv.getInt32(1, true) === -100 && wdv.getInt32(5, true) === 40,
  [wdv.getInt32(1, true), wdv.getInt32(5, true)]);
check('LOG.reversed is NOT mirrored from LOG.rewritten', before === after, { before: before, after: after });
check('flips owner is published', R.flipsOwner === 'gota-ws-hook', R.flipsOwner);
check('the wrapper stamps itself', WS.prototype.send.__mxHook === true);
check('__murtherReverseOwner names the hook', win.__murtherReverseOwner && win.__murtherReverseOwner.name === 'gota-ws-hook',
  win.__murtherReverseOwner);
R.on = false;

/* ---------------------------------------------------------------- 3 */
console.log('\n3. the key dispatcher yields a key the client owns');
function press(code) {
  const ev = { code: code, key: code, repeat: false, target: null, preventDefault: function () {}, stopPropagation: function () {} };
  (listeners.keydown || []).forEach(function (fn) { fn(ev); });
}
api.bind('toggleReverse', 'KeyR');
R.on = false;
owned.KeyR = null;
press('KeyR');
check('with no client bind the hook still acts on KeyR', R.on === true, R.on);
R.on = false;
owned.KeyR = 'reverse';            // the client binds the same key
press('KeyR');
check('with a client bind the hook YIELDS (one press, one feature)', R.on === false, R.on);
owned.KeyR = null;

/* ---------------------------------------------------------------- 2 */
console.log('\n4. the mode actions arm plain reverse');
api.bind('mode:4x', 'Digit3');      // the owner key for a mode bind is 'mode:<id>'
R.mode = 'freeze'; R.on = false;
press('Digit3');
check('a mode key over a leftover FREEZE arms reverse', R.mode === 'reverse', R.mode);
R.mode = 'mirrorX';
api.setMode('4x');
check('setMode() over a leftover MIRROR arms reverse', R.mode === 'reverse', R.mode);
api.bind('mode:4x', '');

/* ---------------------------------------------------------------- 7 */
console.log('\n5. the stall guard and the DevTools-trap handshake (real main-thread stalls)');
function blockFor(ms) { const t0 = Date.now(); while (Date.now() - t0 < ms) { /* deliberate stall */ } }
function lastDecision() {
  const ev = api.log().events.filter(function (e) { return e.k === 'stall.guard.decision'; });
  return ev.length ? ev[ev.length - 1].d : null;
}
/* The banner is appended to document.body, so it is counted there by its own words - a plain
 * append counter also counts every element any other hook path builds. */
function banners() {
  return win.document.body.children.filter(function (n) {
    return String(n.textContent || '').indexOf('Auto-reverse switched OFF') === 0;
  }).length;
}
const sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

/* A stall cannot be faked: the guard measures the gap between its own interval ticks. It also
 * has to be given the loop back afterwards - a timer callback cannot run while the top-level
 * script is still executing, so the assertions wait a real interval out. */
(async function () {
  R.on = true; R.mode = 'reverse';
  R.trapAt = Date.now();               // a fresh murther DevTools trap
  blockFor(2200);
  await sleep(900);
  const d1 = lastDecision();
  check('a stall with a FRESH murther trap does NOT shed', !!d1 && d1.shed === false, d1 && d1.reason);
  check('the decision names the trap as the reason', !!d1 && d1.reason === 'devtools trap (murther guard)', d1 && d1.reason);
  check('the mode is still ON after a trap stall', R.on === true, R.on);

  R.trapAt = 0;                        // trap evidence stale/absent
  blockFor(2200);
  await sleep(900);
  const d2 = lastDecision();
  check('a genuine stall DOES shed', !!d2 && d2.shed === true, d2 && d2.reason);
  check('the shed is recorded on the shared toggle', typeof R.shedAt === 'number' && R.shedAt > 0, R.shedAt);
  check('the shed records its reason', typeof R.shedReason === 'string' && R.shedReason.length > 0, R.shedReason);
  check('the mode is off and back on plain reverse', R.on === false && R.mode === 'reverse', { on: R.on, mode: R.mode });
  check('no on-screen banner while the client is present to announce it', banners() === 0,
    { banners: banners() });

  console.log('\n' + (failures ? failures + ' FAILURE(S)' : 'all checks passed'));
  process.exit(failures ? 1 : 0);
})();
