// ==UserScript==
// @name         Camlan Probe (tracker beacon)
// @namespace    murther.tracker
// @version      1.18.0
// @description  Beacon for camlan_tracker.py. CSP-proof: page hooks run on the real page via unsafeWindow, exfil goes over GM_xmlhttpRequest (Tampermonkey sandbox, bypasses the page's connect-src). You browse manually - this only watches and reports.
// @match        https://gota.io/camlan/*
// @match        https://play.gota.io/*
// @grant        GM_xmlhttpRequest
// @connect      127.0.0.1
// @run-at       document-start
// ==/UserScript==

(() => {
  'use strict';
  // Page objects MUST come from unsafeWindow: with a @grant the script runs
  // sandboxed, and touching the sandbox's window would hook nothing. Murther
  // itself runs grant-less (page context), so unsafeWindow IS the world it
  // lives in - every hook below lands on the exact objects Murther uses.
  const W = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;
  const DOC = (W.document || document);
  if (W.__camlanProbeArmed) return;
  W.__camlanProbeArmed = true;

  // v1.5.0: Pixi capture. v1.4.0 looked for W.__mxPixiApp / W.__pixiApp /
  // M.pixi().app - none of those exist. Murther's real handles are
  // window.__murtherPixiApp / window.__murtherRenderer (murther.user.js
  // claim('__PIXI_APP_INIT__'/'__PIXI_RENDERER_INIT__')), and M.pixi()
  // returns a diag object with app:boolean, not the app. Worse: this build
  // is renderer-only (renderer True, app False) - __PIXI_APP_INIT__ never
  // fires, so app.stage walking stays at 0 forever.
  // Fix: cooperatively chain BOTH dev hooks (same claim pattern Murther
  // uses, so whichever script runs first the other still gets called),
  // plus wrap renderer.render to capture the root container passed each
  // frame - that IS the stage-equivalent when no Application exists.
  // Read-only, never blocks render, failures swallowed.
  // v1.5.1: Pixi v8 render-signature fix. v1.5.0 stored arguments[0]
  // directly, but v8 calls renderer.render({container, target, ...}) -
  // an options object, not the container. Walking it gave Object:1 /
  // sceneKids:0 / texts:[]. Unwrap .container first, forward args
  // untouched via .apply so render never breaks.
  try {
    const G = W;
    const camlanUnwrapScene = (a0) => {
      try {
        if (!a0 || typeof a0 !== 'object') return a0;
        // Already a container: has children array.
        if (Array.isArray(a0.children) || Array.isArray(a0._children)) return a0;
        // v8 options object: {container, target, ...}
        const c = a0.container;
        if (c && typeof c === 'object' && (Array.isArray(c.children) || Array.isArray(c._children) || typeof c.addChild === 'function')) return c;
        // Some builds pass {target: container} or render(target) - accept.
        const t = a0.target;
        if (t && typeof t === 'object' && (Array.isArray(t.children) || Array.isArray(t._children))) return t;
      } catch (eU) {}
      return a0;
    };
    const camlanNoteScene = (a0) => {
      try {
        const root = camlanUnwrapScene(a0);
        if (root) {
          G.__camlanLastScene = root;
          G.__camlanLastSceneRaw = (root !== a0) ? true : false;
        }
      } catch (eS) {}
    };
    const camlanNoteApp = (a, b) => {
      try {
        // Accept (app, ver) and (renderer, app) shapes: whichever arg has
        // .stage is the app, whichever has .render is the renderer.
        const cands = [a, b];
        for (const c of cands) {
          if (c && typeof c === 'object' && c.stage) {
            G.__camlanPixiApp = c;
            try { G.__mxPixiApp = c; } catch (eM1) {}
            try { G.__mxPixiStage = c.stage; } catch (eM2) {}
            if (c.renderer) { G.__camlanRenderer = c.renderer; wrapRendererRender(c.renderer); }
          }
        }
        for (const c of cands) {
          if (c && typeof c === 'object' && typeof c.render === 'function' && !c.stage) {
            if (!G.__camlanRenderer) G.__camlanRenderer = c;
            wrapRendererRender(c);
          }
        }
      } catch (eA) {}
    };
    const claimDevHook = (name, onCall) => {
      let cur = null;
      try { cur = G[name]; } catch (eGet) { return; }
      if (cur && cur.__camlanHook) return; // ours already in place
      const prev = (typeof cur === 'function') ? cur : null;
      const wrapper = function (a, b) {
        try { onCall(a, b); } catch (eOn) {}
        if (prev) { try { return prev.call(this, a, b); } catch (ePrev) {} }
      };
      try { wrapper.__camlanHook = true; } catch (eS) {}
      try {
        G[name] = wrapper;
        // Mark Murther-chained so diagnostics can see coexistence.
        if (prev && prev.__murtherHook) { try { G.__camlanChainedMurther = true; } catch (eC) {} }
      } catch (eSet) {}
    };
    const wrapRendererRender = (r) => {
      if (!r || r.__camlanRenderWrapped) return;
      try {
        const protoRender = (typeof r.render === 'function') ? r.render : null;
        // Wrap instance first (cheapest, no proto pollution).
        // Forward via .apply: v7 render(container, opts), v8
        // render({container, target}) - never reshape the call.
        if (protoRender) {
          const orig = r.render.bind(r);
          const w = function () {
            try { camlanNoteScene(arguments[0]); } catch (eS) {}
            return orig.apply(r, arguments);
          };
          try { w.__camlanRenderWrapped = true; } catch (eW) {}
          try { r.render = w; r.__camlanRenderWrapped = true; } catch (eR) {}
          return;
        }
      } catch (e) {}
      // Fallback: wrap prototype render once (covers future renderers).
      try {
        const RP = Object.getPrototypeOf(r);
        if (RP && typeof RP.render === 'function' && !RP.render.__camlanRenderWrapped) {
          const origP = RP.render;
          const wP = function () {
            try { camlanNoteScene(arguments[0]); } catch (eS2) {}
            return origP.apply(this, arguments);
          };
          try { wP.__camlanRenderWrapped = true; } catch (eW2) {}
          RP.render = wP;
        }
      } catch (e2) {}
    };
    claimDevHook('__PIXI_APP_INIT__', (app, b) => { camlanNoteApp(app, b); });
    claimDevHook('__PIXI_RENDERER_INIT__', (r, b) => {
      try {
        if (r) { G.__camlanRenderer = r; wrapRendererRender(r); }
        // Some builds call it as (renderer, app)-ish - check second arg.
        if (b && typeof b === 'object' && b.stage) camlanNoteApp(b, null);
      } catch (e) {}
    });
    // Late-attach: Murther may have captured the renderer before we ran.
    try {
      if (G.__murtherPixiApp && !G.__camlanPixiApp) G.__camlanPixiApp = G.__murtherPixiApp;
      if (G.__murtherRenderer && !G.__camlanRenderer) G.__camlanRenderer = G.__murtherRenderer;
      if (G.__camlanRenderer) wrapRendererRender(G.__camlanRenderer);
      if (G.__camlanPixiApp && G.__camlanPixiApp.renderer) wrapRendererRender(G.__camlanPixiApp.renderer);
    } catch (eL) {}
    // v1.7.0: Sprite width/height setter tap. 024617 proved sx stays
    // 0.498 across spawn/split/merge - scale may be a base constant while
    // the engine resizes via width/height (which sets scale under the
    // hood) or via shader. Wrap once PIXI exists; record only for nodes
    // the census tagged __camlanOwn, so cost is ~0 for the other 300+.
    // Cooperative: chains to whatever descriptor is installed now.
    const installSpriteWHHook = () => {
      try {
        const P = G.PIXI;
        const proto = P && P.Sprite && P.Sprite.prototype;
        if (!proto || proto.__camlanWHHooked) return false;
        for (const prop of ['width', 'height']) {
          try {
            const desc = Object.getOwnPropertyDescriptor(proto, prop);
            if (!desc || typeof desc.set !== 'function' || desc.set.__camlanWHHooked) continue;
            const origSet = desc.set, origGet = desc.get;
            const wrappedSet = function (v) {
              try {
                if (this && this.__camlanOwn) {
                  this.__camlanMassPx = +v || 0;
                  this.__camlanMassPxAt = Date.now();
                }
              } catch (eTag) {}
              return origSet.call(this, v);
            };
            try { wrappedSet.__camlanWHHooked = true; } catch (eF) {}
            Object.defineProperty(proto, prop, { configurable: true, enumerable: desc.enumerable, get: origGet, set: wrappedSet });
          } catch (eProp) {}
        }
        try { proto.__camlanWHHooked = true; } catch (eH) {}
        return true;
      } catch (e) { return false; }
    };
    try { installSpriteWHHook(); } catch (eI) {}
    setInterval(() => { try { installSpriteWHHook(); } catch (eR2) {} }, 2000);
    // v1.9.0: syncRuntimeState this-capture. 025430 proved the chain:
    // Qe (ChkOWSCx.js:1:116402) <- Object.Xe [as syncRuntimeState]
    // (:1:116945) on every multibox/ID write. Its receiver `this` is the
    // DOM-facing state object. Deliberately NOT a fetch rewrite (game
    // loads bundles via <script>, not fetch - a fetch wrapper would miss)
    // and NOT a Function.prototype.call filter (hot path, recursion/perf
    // risk). Bounded BFS for the own property, then wrap that ONE method
    // (fires per HUD tick, low frequency). One-shot: stops scanning once
    // hooked, captures keys once.
    const camlanStateScan = () => {
      try {
        if (G.__camlanStateHooked || G.__camlanStateFound) return;
        const seen = (typeof WeakSet === 'function') ? new WeakSet() : null;
        const queue = [{ o: G, d: 0 }];
        let n = 0;
        const isDom = (v) => {
          try {
            const N = G.Node;
            if (N && v instanceof N) return true;
            if (v && (v.tagName || v.nodeType !== undefined)) return true;
          } catch (eD) {}
          return false;
        };
        while (queue.length && n < 1500) {
          const cur = queue.shift();
          const o = cur.o, d = cur.d;
          if (!o || (typeof o !== 'object' && typeof o !== 'function')) continue;
          try { if (seen) { if (seen.has(o)) continue; seen.add(o); } } catch (eS) { continue; }
          n++;
          let keys = null;
          try { keys = Object.keys(o); } catch (eK) { continue; }
          if (!keys || keys.length > 300) continue;
          for (const k of keys) {
            if (k === 'syncRuntimeState') {
              try {
                const fn = o[k];
              if (typeof fn === 'function' && !fn.__camlanStateHooked) {
                const orig = fn;
                const w = function () {
                  // v1.15.2: funnel through the structural gate. The old
                  // code blind-copied `this` here and poisoned 050227 with
                  // a Pixi render-group (no check, no event, one-shot block
                  // on the real capture). Gate rejects it; miss reasons go
                  // to the log via the setter path's state-miss.
                  try { camlanPublishState(this, 'bfs'); } catch (ePub) {}
                  return orig.apply(this, arguments);
                };
                  try { w.__camlanStateHooked = true; } catch (eF2) {}
                  o[k] = w;
                  G.__camlanStateFound = true;
                  G.__camlanStateHooked = true;
                  return;
                }
              } catch (eW) {}
            }
          }
          if (d >= 3) continue;
          for (const k of keys) {
            if (k === 'syncRuntimeState') continue;
            let v = null;
            try { v = o[k]; } catch (eG) { continue; }
            if (!v || (typeof v !== 'object' && typeof v !== 'function')) continue;
            if (isDom(v)) continue;
            try {
              if (v === G || v === DOC || v === G.document) continue;
              if (v === Math || v === JSON || v === Object) continue;
            } catch (eSk) { continue; }
            queue.push({ o: v, d: d + 1 });
          }
        }
      } catch (eScan) {}
    };
    try { camlanStateScan(); } catch (eS0) {}
    setInterval(() => { try { camlanStateScan(); } catch (eSS) {} }, 5000);
    // v1.10.0: one-shot apply trap for the syncRuntimeState receiver.
    // Why: v1.9.0 BFS never fired (stateFound:false in 030023) because the
    // module object holding syncRuntimeState lives in a bundle closure -
    // it is NOT reachable from window, so no window BFS can find it. The
    // setter stack (Qe 116402 <- Xe [as syncRuntimeState] 116945) proves
    // the function runs per HUD tick, so intercept the call itself.
    // Safety: pre-filters are one boolean + one name read per apply;
    // key enumeration runs only on short-named receivers passing the
    // cells+score/mass `in` checks; disarms (restores original apply)
    // on first capture. No fetch rewrite (bundles load via <script>).
    const installApplyTrap = () => {
      // v1.15.0 Patch 2: thisArg AND args scan. The 1.14.0 log proved
      // getThis() comes back null (arrow/strict callees), so the state
      // hides in args (Xe.call(undefined, state) style). Pre-gate stays
      // (short fn name = one name read per call) to keep the hot path
      // cheap; full checks + disarm on first capture. Wraps BOTH apply
      // and call: .call() does NOT route through an apply wrapper, so an
      // apply-only trap is blind to .call invocations.
      // v1.15.1 HOTFIX: forward via Reflect.apply, NEVER via _orig.call /
      // _orig.apply. The 1.15.0 build forwarded wc->_call.apply (which hits
      // the wrapped FP.apply) and w->_apply.call (which hits the wrapped
      // FP.call): mutual infinite recursion -> "Maximum call stack size
      // exceeded" on page load. Reflect.apply consults neither wrapper.
      // Invocation is DIRECT (R(...), never R.call(...)) because .call
      // itself is wrapped. No Reflect -> traps don't install at all: an
      // untrapped page always beats a crashed one.
      // Plus a busy re-entry guard as belt and suspenders.
      let R = null;
      try { R = (W.Reflect && W.Reflect.apply) || Reflect.apply; } catch (eR0) { R = null; }
      if (!R) return;
      const fwd = (fn, recv, argList) => {
        return R(fn, recv, argList);
      };
      try {
        const FP = W.Function && W.Function.prototype;
        if (!FP) return;
        const consider = (fn, thisArg, cands) => {
          try {
            if (W.__camlanState) return;
            const nm = (fn && fn.name) || '';
            if (nm.length > 3) return;
            for (const c of cands) {
              if (c && typeof c === 'object' && camlanPublishState(c, 'apply')) break;
            }
          } catch (eO) {}
        };
        if (FP.apply && !FP.apply.__camlanApplyTrap) {
          const _apply = FP.apply;
          const w = function (thisArg, args) {
            if (!W.__camlanTrapBusy) {
              W.__camlanTrapBusy = true;
              try {
                if (!W.__camlanState) {
                  const cands = [thisArg];
                  if (args && args.length > 0) {
                    for (let i = 0; i < args.length && i < 6; i++) cands.push(args[i]);
                  }
                  consider(this, thisArg, cands);
                }
              } catch (eW) {}
              try { W.__camlanTrapBusy = false; } catch (eB) {}
            }
            return fwd(_apply, this, [thisArg, args]);
          };
          try { w.__camlanApplyTrap = true; w.__camlanOrig = _apply; } catch (eF) {}
          FP.apply = w;
        }
        if (FP.call && !FP.call.__camlanCallTrap) {
          const _call = FP.call;
          const wc = function () {
            if (!W.__camlanTrapBusy) {
              W.__camlanTrapBusy = true;
              try {
                if (!W.__camlanState && arguments.length > 1) {
                  const nm = (this && this.name) || '';
                  if (nm.length <= 3) {
                    const cands = [];
                    for (let i = 0; i < arguments.length && i < 7; i++) cands.push(arguments[i]);
                    consider(this, arguments[0], cands);
                  }
                }
              } catch (eW2) {}
              try { W.__camlanTrapBusy = false; } catch (eB2) {}
            }
            return fwd(_call, this, arguments);
          };
          try { wc.__camlanCallTrap = true; wc.__camlanOrig = _call; } catch (eF2) {}
          FP.call = wc;
        }
      } catch (eT) {}
    };
    try { installApplyTrap(); } catch (eI3) {}
    setInterval(() => { try { if (!G.__camlanState) installApplyTrap(); } catch (eR4) {} }, 5000);
    // Periodic re-attach: whoever installed second already chains, but a
    // later page script can replace the global outright. Cheap re-claim.
    setInterval(() => {
      try {
        if (G.__murtherPixiApp && G.__camlanPixiApp !== G.__murtherPixiApp) G.__camlanPixiApp = G.__murtherPixiApp;
        if (G.__murtherRenderer && G.__camlanRenderer !== G.__murtherRenderer) { G.__camlanRenderer = G.__murtherRenderer; wrapRendererRender(G.__camlanRenderer); }
        if (G.__camlanRenderer && !G.__camlanRenderer.__camlanRenderWrapped) wrapRendererRender(G.__camlanRenderer);
        const a = G.__PIXI_APP_INIT__, r = G.__PIXI_RENDERER_INIT__;
        if (a && !a.__camlanHook && !a.__murtherHook) claimDevHook('__PIXI_APP_INIT__', (app) => { try { if (app) G.__camlanPixiApp = app; } catch (e) {} });
        if (r && !r.__camlanHook && !r.__murtherHook) claimDevHook('__PIXI_RENDERER_INIT__', (rr) => { try { if (rr) G.__camlanRenderer = rr; } catch (e) {} });
      } catch (eP) {}
    }, 2000);
  } catch (ePixi) {}

  const BEACON = 'http://127.0.0.1:18721/event';
  const queue = [];
  const href = () => { try { return W.location.href; } catch (e) { return ''; } };
  const push = (kind, data) => {
    queue.push(Object.assign({ t: Date.now(), kind, url: href() }, data));
    if (queue.length > 2000) queue.splice(0, 500);
  };
  // v1.15.0 shared state-capture core. Bundle forensics proved key names
  // can NEVER match ($g-hash keys, no mass/score literals anywhere), so
  // everything here matches SHAPE: the pt-facade signature (15-60 keys,
  // >=12 functions). One funnel for the sprite / DOM / args / callsite
  // paths. Side-effect note: reading values invokes getters - the engine's
  // are pure delegates, and every read is try/caught and bounded.
  // v1.16.0: explicit Pixi render-group blacklist (defense in depth).
  // 050227 poisoned via the old blind BFS, but the key set
  // (renderPipeId/worldTransform/updateTick/...) is a stable Pixi v8
  // fingerprint - reject on >=3 hits BEFORE counting functions, so a
  // future loose matcher can never re-admit it. Thresholds stay tight
  // (15-60 keys, fn>=12): lowkeyy's 8-140/8-120 proposal is rejected as
  // re-poisoning risk.
  const PIXI_STATE_BLACKLIST = ['renderPipeId', 'renderGroupParent', 'renderGroupChildren', 'worldTransform', 'worldColorAlpha', 'worldColor', 'worldAlpha', 'childrenToUpdate', 'updateTick', 'gcTick', 'childrenRenderablesToUpdate', 'structureDidChange', 'instructionSet', 'canBundle'];
  const camlanIsFacade = (o) => {
    try {
      const ks = Object.keys(o);
      if (ks.length < 15 || ks.length > 60) return false;
      let pixiHits = 0;
      for (const k of ks) { if (PIXI_STATE_BLACKLIST.indexOf(k) >= 0 && ++pixiHits >= 3) return false; }
      let fn = 0;
      for (const k of ks) { try { if (typeof o[k] === 'function') fn++; } catch (eF) {} }
      return fn >= 12;
    } catch (e) { return false; }
  };
  const camlanReadNums = (th, out, budget) => {
    // Own enumerable values + prototype accessors (class getters are
    // non-enumerable proto props - Object.keys alone misses them).
    let names = [];
    try {
      names = Object.keys(th).slice(0, 150);
      let p = null;
      try { p = Object.getPrototypeOf(th); } catch (eP) {}
      for (let depth = 0; depth < 2 && p && p !== Object.prototype; depth++) {
        try {
          for (const pn of Object.getOwnPropertyNames(p).slice(0, 80)) {
            if (names.indexOf(pn) < 0 && pn !== 'constructor') names.push(pn);
          }
        } catch (ePn) {}
        try { p = Object.getPrototypeOf(p); } catch (eP2) { break; }
      }
    } catch (eN) { return 0; }
    let n = 0;
    for (const key of names) {
      if (n >= budget) break;
      if (typeof key !== 'string' || key === '__proto__') continue;
      let vv = null;
      try { vv = th[key]; } catch (eV) { continue; }
      if (typeof vv === 'number' && isFinite(vv)) { out[key] = Math.round(vv * 1000) / 1000; n++; }
    }
    return n;
  };
  // Non-minified fallback shape REMOVED in v1.15.2: the 050227 session
  // proved it false-positives on Pixi render-group Containers (children
  // array + worldAlpha/updateTick numerics), poisoning all 58 snaps and
  // one-shot-blocking the real capture. Facade shape is the only signal.
  // (Kept as a documented stub so nobody re-adds it blindly.)
  const camlanLooseState = (o) => { return false; };
  // Central capture: facade itself, or owner with a facade child.
  // Requires >=2 numerics (mass + score at minimum). One-shot.
  // NOTE (v1.15.2): the loose array+numerics fallback is gone - it
  // captured a Pixi render-group in 050227. Facade shape only.
  const camlanPublishState = (o, via) => {
    try {
      if (!o || typeof o !== 'object' || W.__camlanState) return null;
      let target = null, fk = null;
      if (camlanIsFacade(o)) { target = o; }
      else {
        try {
          const ks = Object.keys(o).slice(0, 150);
          for (const k of ks) {
            let cv = null;
            try { cv = o[k]; } catch (eCv) { continue; }
            if (cv && typeof cv === 'object' && camlanIsFacade(cv)) { target = o; fk = k; break; }
          }
        } catch (eFk) {}
        if (!target) return null;
      }
      const nums = {};
      camlanReadNums(target, nums, 40);
      if (fk) {
        try {
          const fo = target[fk], fks = Object.keys(fo).slice(0, 60);
          for (const k2 of fks) {
            let dv = null;
            try { dv = fo[k2]; } catch (eDv) { continue; }
            if (typeof dv === 'number' && isFinite(dv) && !(k2 in nums)) nums['~' + k2] = Math.round(dv * 1000) / 1000;
          }
        } catch (eFd) {}
      }
      if (Object.keys(nums).length < 2) return null;
      W.__camlanState = target;
      try { W.__camlanKeys = Object.keys(target).slice(0, 80); } catch (eK) { W.__camlanKeys = []; }
      try { W.__camlanProto = Object.getOwnPropertyNames(Object.getPrototypeOf(target)).slice(0, 40); } catch (ePr) {}
      W.__camlanStateNums = nums;
      W.__camlanStateFound = true;
      try { W.__camlanStateVia = String(via || '').slice(0, 32); } catch (eVia) {}
      try { push('state-capture', { keys: W.__camlanKeys, nums: nums, via: W.__camlanStateVia }); } catch (ePu) {}
      try { camlanDisarmTraps(); } catch (eD2) {}
      return { fk: fk };
    } catch (e) { return null; }
  };
  const camlanDisarmTraps = () => {
    // Restore pre-trap apply/call (whoever chained above us keeps working:
    // each wrapper captured its predecessor at install).
    try {
      const FP = W.Function && W.Function.prototype;
      if (!FP) return;
      if (FP.apply && FP.apply.__camlanApplyTrap && FP.apply.__camlanOrig) {
        try { FP.apply = FP.apply.__camlanOrig; } catch (eA) {}
      }
      if (FP.call && FP.call.__camlanCallTrap && FP.call.__camlanOrig) {
        try { FP.call = FP.call.__camlanOrig; } catch (eC) {}
      }
    } catch (e) {}
  };
  // Exfil over GM_xmlhttpRequest: privileged Tampermonkey context, NOT page
  // fetch - the page's Content-Security-Policy (connect-src) refuses every
  // page-side request to 127.0.0.1 (the red wall in the console). Never blocks
  // the game: async, fire-and-forget, failures swallowed.
  const beacon = (batch) => {
    try {
      GM_xmlhttpRequest({
        method: 'POST', url: BEACON, data: JSON.stringify(batch),
        headers: { 'Content-Type': 'text/plain' },
        timeout: 4000, onload: () => {}, onerror: () => {}, ontimeout: () => {}
      });
    } catch (e) {}
  };
  setInterval(() => {
    if (!queue.length) return;
    beacon(queue.splice(0, queue.length));
  }, 500);

  const NodeProto = (W.Node && W.Node.prototype) || Node.prototype;
  const ElProto = (W.Element && W.Element.prototype) || Element.prototype;
  const IDS = ['pmass','pscore','playerScore','pcells','pid','pfps','pping',
               'score-panel','scorePanel','player-score','player-mass',
               'pId','pServer','pFps','pPing','pMass','pScore','pCells',
               'playerId','playerFps','playerPing','playerCells'];
  // v1.3.0: overlay-label census. The engine draws cell name+mass glyphs on
  // screen (enemy "1.9K" is visible); if those are DOM nodes absolutely
  // positioned over #canvas (not canvas pixels), they are a direct Mass/Score
  // source Murther can read structurally. Bounded: 3000 nodes walked, 60 kept.
  // v1.4.0: scene census. The game runs WebGL (Pixi v8 app via
  // __PIXI_APP_INIT__), so the 2D fillText path is blind and DOM overlays are
  // HUD-only. Walk the captured Pixi stage for Text nodes (name+mass sibling
  // pairs = the structural own-mass source), count 2D fillText calls per
  // canvas (a WebGL build stays at zero here), and report Murther's own
  // stats/ledger readouts when present. Never touches the scene, read-only.
  // v1.5.0: also skips Murther's own HUD (mx-* classes / murther ids) -
  // v1.4.0 counted the client's own strip (mx-accent-t, mx-tb-server)
  // as "cell labels".
  const overlayCensus = () => {
    const out = [];
    try {
      const cv = DOC.getElementById('canvas');
      if (!cv) return out;
      const r = cv.getBoundingClientRect();
      if (r.width < 50) return out;
      const walker = DOC.createTreeWalker(DOC.body || DOC.documentElement, 4 /* SHOW_TEXT */);
      let n, count = 0;
      const seen = new Set();
      while ((n = walker.nextNode()) && count < 3000) {
        count++;
        const t = (n.nodeValue || '').trim();
        if (t.length < 1 || t.length > 18) continue;
        const isNum = /^[0-9][0-9.,]*[kKmM%]?$/.test(t);
        const isNick = /[A-Za-z]/.test(t) && t.length <= 16;
        if (!isNum && !isNick) continue;
        const el = n.parentElement;
        if (!el || seen.has(el)) continue;
        seen.add(el);
        const ecls = (el.className || '').toString();
        const eid = el.id || '';
        // Own-HUD filter: never count the client conducting the census.
        if (/mx-|murther/i.test(ecls) || /mx-|murther/i.test(eid)) continue;
        let p = el;
        for (let d = 0; d < 4 && p; d++) {  // skip HUD subtrees
          const pid = p.id || '';
          const pcls = (p.className || '').toString();
          if (/mx-|murther/i.test(pid) || /mx-|murther/i.test(pcls)) { p = null; break; }
          if (/score|leader|chat|minimap|hud|menu|panel|party|server|stat/i.test(pid)) { p = null; break; }
          p = p.parentElement;
        }
        if (!p) continue;
        let b;
        try { b = el.getBoundingClientRect(); } catch (e) { continue; }
        if (b.width <= 0 || b.width > 300) continue;
        if (b.left < r.left - 20 || b.top < r.top - 20 || b.left > r.right + 20 || b.top > r.bottom + 20) continue;
        out.push({ text: t, x: Math.round(b.left - r.left), y: Math.round(b.top - r.top),
                   cls: (el.className || '').toString().slice(0, 40), id: el.id || '' });
        if (out.length >= 60) break;
      }
    } catch (e) {}
    return out;
  };
  // v1.4.0 scene census: read-only walk of the captured Pixi stage (Murther
  // holds the same app via __PIXI_APP_INIT__). Collects up to 40 short texts
  // with world/screen positions, plus 2D fillText counters per canvas id
  // (proves WebGL vs 2D), plus Murther's own readouts when present.
  const __fillCount = {};
  try {
    const _proto = (W.CanvasRenderingContext2D && W.CanvasRenderingContext2D.prototype)
      || (typeof CanvasRenderingContext2D !== 'undefined' && CanvasRenderingContext2D.prototype);
    if (_proto && !_proto.fillText.__camlanCount) {
      const _orig = _proto.fillText;
      const _w = function (t) {
        try { const id = (this.canvas && this.canvas.id) || '(no id)'; __fillCount[id] = (__fillCount[id] || 0) + 1; } catch (e) {}
        return _orig.apply(this, arguments);
      };
      try { _w.__camlanCount = true; } catch (e) {}
      _proto.fillText = _w;
    }
  } catch (e) {}
  // v1.5.0 scene census: v1.4.0 read W.__mxPixiApp / W.__pixiApp /
  // M.pixi().app - none exist, so app stayed False forever. Real handles:
  // W.__camlanPixiApp / W.__camlanRenderer (ours), W.__murtherPixiApp /
  // W.__murtherRenderer (Murther's). Renderer-only build has no app at
  // all, so fall back to W.__camlanLastScene (root container captured by
  // wrapping renderer.render). Reports which source fed the walk so a
  // zero is a measurement (no-scene vs no-Text-nodes).
  const sceneCensus = () => {
    const out = { app: false, via: 'none', texts: [], fill: {}, murther: null,
      kinds: {}, sceneKids: 0, meshCount: 0, gfxSeen: false };
    try {
      for (const k in __fillCount) out.fill[k] = __fillCount[k];
      try { out.counterSite = W.__camlanCounterSite || null; } catch (eCS) { out.counterSite = null; }
      // Tag each canvas with its backing size so "(no id)" stops being a
      // mystery (Murther particle canvas vs arena vs leaderboard).
      try {
        const cvs = DOC.getElementsByTagName('canvas');
        out.canvases = [];
        for (let i = 0; i < Math.min(cvs.length, 8); i++) {
          const c = cvs[i];
          out.canvases.push({ id: c.id || '(no id)', w: c.width || 0, h: c.height || 0,
            cw: Math.round((c.getBoundingClientRect && c.getBoundingClientRect().width) || 0) });
        }
      } catch (eCv) {}
      const M = W.__murther;
      if (M) {
        try {
          out.murther = {
            pixi: (M.pixi ? M.pixi() : null),
            pos: (M.pos ? M.pos() : null),
            net: (M.netStats ? M.netStats() : null)
          };
        } catch (e) { out.murther = { err: String(e).slice(0, 80) }; }
      }
      const app = W.__camlanPixiApp || W.__murtherPixiApp
        || W.__mxPixiApp || W.__pixiApp || (M && M.pixi && M.pixi().app && typeof M.pixi().app === 'object' ? M.pixi().app : null) || null;
      const renderer = W.__camlanRenderer || W.__murtherRenderer || (app && app.renderer) || null;
      if (renderer && !renderer.__camlanRenderWrapped) {
        try {
          // Late renderer (Murther captured it first): wrap now so the
          // next frame gives us the scene root. Forward via .apply -
          // v8 render({container}) must never be reshaped.
          const orig = renderer.render && renderer.render.bind(renderer);
          if (orig) {
            const w = function () {
              try {
                const a0 = arguments[0];
                let root2 = a0;
                try {
                  if (a0 && typeof a0 === 'object' && !Array.isArray(a0.children) && !Array.isArray(a0._children)) {
                    if (a0.container) root2 = a0.container;
                    else if (a0.target && typeof a0.target === 'object' && (a0.target.children || a0.target._children)) root2 = a0.target;
                  }
                } catch (eU2) {}
                if (root2) W.__camlanLastScene = root2;
              } catch (eS) {}
              return orig.apply(renderer, arguments);
            };
            try { w.__camlanRenderWrapped = true; } catch (eW) {}
            renderer.render = w;
            renderer.__camlanRenderWrapped = true;
          }
        } catch (eW2) {}
      }
      out.renderer = !!renderer;
      try {
        out.chainedMurther = !!W.__camlanChainedMurther;
        out.hasMurtherApp = !!W.__murtherPixiApp;
        out.hasMurtherRenderer = !!W.__murtherRenderer;
        out.hasLastScene = !!W.__camlanLastScene;
        out.unwrapped = !!W.__camlanLastSceneRaw;
      } catch (eF) {}
      const unwrapScene = (a0) => {
        try {
          if (!a0 || typeof a0 !== 'object') return a0;
          if (Array.isArray(a0.children) || Array.isArray(a0._children)) return a0;
          if (a0.container && typeof a0.container === 'object') return a0.container;
          if (a0.target && typeof a0.target === 'object' && (a0.target.children || a0.target._children)) return a0.target;
        } catch (eU3) {}
        return a0;
      };
      let root = (app && app.stage) || W.__mxPixiStage || null;
      if (root) out.via = 'app.stage';
      if (!root && W.__camlanLastScene) {
        const uw = unwrapScene(W.__camlanLastScene);
        // v1.5.0 stored the raw options object - unwrap it in place so the
        // very next census walks the container, no re-hook wait.
        if (uw !== W.__camlanLastScene) {
          try { W.__camlanLastScene = uw; W.__camlanLastSceneRaw = true; } catch (eFix) {}
          root = uw; out.via = 'renderer.render arg (unwrapped v8)';
        } else { root = uw; out.via = 'renderer.render arg'; }
      }
      // Last resort: some builds stash the root on the renderer.
      if (!root && renderer) {
        for (const k of ['_lastObjectRendered', 'lastObjectRendered', '_scene', 'scene']) {
          try { if (renderer[k] && (renderer[k].children || renderer[k]._children)) { root = renderer[k]; out.via = 'renderer.' + k; break; } } catch (eR) {}
        }
      }
      const stage = root;
      if (!stage) return out;
      out.app = !!(app && app.stage);
      out.hasScene = true;
      // v1.8.0: own nick FIRST (needed during the walk). 024957 proved
      // the v1.6/1.7 cap (stop at 40 texts) drops own nick in crowded
      // arenas (40x amzk19 pushes ss out -> ownVia flips nick->centre
      // with dOwn=1e9). Own matches are now uncapped (to 16); the walk
      // continues until own matches == cell count or 4000 nodes.
      let ownNick = '';
      try {
        const p1 = DOC.getElementById('multibox-p1-name');
        const p2 = DOC.getElementById('multibox-p2-name');
        ownNick = ((p1 && p1.textContent) || '').trim().slice(0, 16) || ((p2 && p2.textContent) || '').trim().slice(0, 16);
      } catch (eN0) {}
      out.ownNick = ownNick;
      let wantOwn = 0;
      try {
        const pc = DOC.getElementById('pCells');
        const m = pc && String(pc.textContent || '').match(/(\d+)\s*\//);
        wantOwn = m ? Math.min(16, Math.max(0, parseInt(m[1], 10) || 0)) : 0;
      } catch (ePC) {}
      const stack = [stage];
      let walked = 0;
      const sprites = []; // diagnostics only: scale/width DISPROVEN as mass (flat 0.498 across 1->2->4 splits, px never fired)
      const ownHits = [];
      try { out.sceneKids = (stage.children || stage._children || []).length; } catch (eSK) {}
      while (stack.length && walked < 4000 && (out.texts.length < 40 || sprites.length < 400 || (wantOwn > 0 && ownHits.length < wantOwn))) {
        const n = stack.pop();
        walked++;
        let cname = '';
        try {
          cname = (n.constructor && n.constructor.name) || '';
          if (cname) out.kinds[cname] = (out.kinds[cname] || 0) + 1;
        } catch (eK) {}
        // v1.10.0: Mesh count (v8 Mesh/NineSlicePlane do NOT extend Sprite -
        // kinds would silently miss them as cell bodies) + single-Graphics
        // geometry bbox (vector-drawn cells live in the geometry buffer).
        // v1.11.0: ALWAYS report (seen/why/attr), so "not measured" can
        // never again read as "measured zero".
        try {
          if (cname === 'Mesh' || (n && n.isMesh)) out.meshCount = (out.meshCount || 0) + 1;
        } catch (eM) {}
        if ((cname === 'Graphics' || (n && n.isGraphics)) && !out.gfx) {
          out.gfxSeen = true;
          try {
            const g = n.geometry;
            if (!g) { out.gfxWhy = 'no-geometry'; }
            else {
              const attrs = g.attributes || {};
              const anames = Object.keys(attrs);
              out.gfxAttrs = anames.slice(0, 8);
              const attr = attrs.aPosition || attrs.position || attrs.aVertexPosition || null;
              out.gfxAttr = attr ? (attrs.aPosition ? 'aPosition' : (attrs.position ? 'position' : 'aVertexPosition')) : 'none';
              const arr = attr && attr.data;
              if (!arr || arr.length < 4) { out.gfxWhy = 'no-data:' + (arr ? arr.length : -1); }
              else {
                let minX = 1e18, maxX = -1e18, minY = 1e18, maxY = -1e18;
                const step = arr.length > 40000 ? Math.floor(arr.length / 40000) * 2 : 2;
                let cnt = 0;
                for (let i = 0; i + 1 < arr.length; i += step) {
                  const vx = +arr[i], vy = +arr[i + 1];
                  if (!isFinite(vx) || !isFinite(vy)) continue;
                  if (vx < minX) minX = vx; if (vx > maxX) maxX = vx;
                  if (vy < minY) minY = vy; if (vy > maxY) maxY = vy;
                  cnt++;
                }
                if (cnt > 0) out.gfx = { n: arr.length / 2, minX: Math.round(minX), maxX: Math.round(maxX), minY: Math.round(minY), maxY: Math.round(maxY) };
                else out.gfxWhy = 'no-finite-verts';
              }
            }
          } catch (eG) { out.gfxWhy = 'err:' + String(eG && eG.message || eG).slice(0, 40); }
        }
        try {
          const kids = n.children || n._children;
          if (kids && kids.length) for (let i = kids.length - 1; i >= 0; i--) stack.push(kids[i]);
        } catch (e) {}
        // Keep Sprite transform for the own-cell proxy (bounded, read-only).
        // v1.7.0: keep the node ref + width-hook px so we can tag own cells
        // and report engine-driven width writes (the discriminating test
        // for "scale is constant, width moves").
        try {
          if (cname === 'Sprite' && sprites.length < 400) {
            let sx = 0, sy = 0, w = 0, h = 0, px = 0, py = 0, mpx = 0, mpxAge = -1;
            try { sx = n.scale ? +n.scale.x || 0 : 0; sy = n.scale ? +n.scale.y || 0 : 0; } catch (eSc) {}
            try { w = +n.width || 0; h = +n.height || 0; } catch (eWh) {}
            try {
              const gp = (typeof n.getGlobalPosition === 'function') ? n.getGlobalPosition() : (n.worldTransform ? { x: n.worldTransform.tx, y: n.worldTransform.ty } : null);
              if (gp) { px = Math.round(gp.x); py = Math.round(gp.y); }
            } catch (eGp) {}
            try { mpx = +n.__camlanMassPx || 0; mpxAge = (n.__camlanMassPxAt ? Date.now() - n.__camlanMassPxAt : -1); } catch (ePx) {}
            // Only keep plausible cells (visible size, finite scale).
            if (isFinite(sx) && isFinite(sy) && w > 0 && w < 4000) sprites.push({ node: n, x: px, y: py, sx: Math.round(sx * 1000) / 1000, sy: Math.round(sy * 1000) / 1000, w: Math.round(w), h: Math.round(h), px: Math.round(mpx), pxAge: mpxAge });
          }
        } catch (eSp) {}
        let s = null;
        try { s = (typeof n.text === 'string') ? n.text : null; } catch (e) {}
        if (s === null || s === undefined) continue;
        s = String(s).trim().slice(0, 18);
        if (!s) continue;
        const isNum = /^[0-9][0-9.,]*[kKmM%]?$/.test(s);
        const isNick = /[A-Za-z]/.test(s) && s.length <= 16;
        if (!isNum && !isNick) continue;
        let wx = 0, wy = 0;
        try { const p = (typeof n.getGlobalPosition === 'function') ? n.getGlobalPosition() : (n.worldTransform ? { x: n.worldTransform.tx, y: n.worldTransform.ty } : null); if (p) { wx = Math.round(p.x); wy = Math.round(p.y); } } catch (e) {}
        let sib = '';
        try {
          const par = n.parent;
          const ks = par && (par.children || par._children);
          if (ks) for (const k2 of ks) {
            if (k2 === n) continue;
            const t2 = k2 && (typeof k2.text === 'string' ? String(k2.text).trim().slice(0, 18) : '');
            if (t2) { sib = t2; break; }
          }
        } catch (e) {}
        // v1.8.0: own matches bypass the 40-cap (to 16). Everything else
        // shares the 40 general slots. v1.9.0: keep the text node ref for
        // the body-sibling walk below (stripped before beacon).
        if (ownNick && s === ownNick) {
          if (ownHits.length < 16) ownHits.push({ node: n, text: s, x: wx, y: wy, sib: sib.slice(0, 18) });
          if (out.texts.length < 40) out.texts.push({ text: s, x: wx, y: wy, sib: sib.slice(0, 18) });
        } else if (out.texts.length < 40) out.texts.push({ text: s, x: wx, y: wy, sib: sib.slice(0, 18) });
      }
      out.walked = walked;
      out.ownHits = ownHits.length;
      out.wantOwn = wantOwn;
      // v1.6.0 own-cell proxy: nearest sprites to own nick (fallback
      // screen centre - camera tracks local player).
      // v1.7.0: UNVALIDATED - 024617 held sx=0.498 (no eat).
      // v1.8.0: DISPROVEN as mass - 024957 held sx=0.498 + px=0/never
      // fired across 1->2->4 splits. Kept as position grouping only;
      // mass lives in JS player state (updateCellCounter scope), not nodes.
      try {
        out.sprites = sprites.length;
        const ownTexts = ownHits.slice(0, 4);
        const cx = Math.round((W.innerWidth || 1868) / 2), cy = Math.round((W.innerHeight || 949) / 2);
        const scored = sprites.map(sp => {
          let dOwn = 1e9;
          for (const t of ownTexts) { const d = Math.hypot(sp.x - t.x, sp.y - t.y); if (d < dOwn) dOwn = d; }
          const dCtr = Math.hypot(sp.x - cx, sp.y - cy);
          return { sp, dOwn: Math.round(dOwn), dCtr: Math.round(dCtr) };
        });
        // Prefer nick-anchored, fall back to screen-centre.
        const anchored = scored.filter(s => s.dOwn < 400).sort((a, b) => a.dOwn - b.dOwn).slice(0, 4);
        const centred = scored.slice().sort((a, b) => a.dCtr - b.dCtr).slice(0, 4);
        const pick = anchored.length ? anchored : centred;
        // Tag picked live nodes; untag previous picks (bounded, ≤4+4).
        try {
          const prev = W.__camlanOwnNodes || [];
          for (const pn of prev) { try { if (pn && pn.node) pn.node.__camlanOwn = false; } catch (eU) {} }
          for (const s of pick) { try { if (s.sp && s.sp.node) s.sp.node.__camlanOwn = true; } catch (eT) {} }
          W.__camlanOwnNodes = pick.map(s => s.sp);
        } catch (eTag2) {}
        out.own = pick.map(s => ({ x: s.sp.x, y: s.sp.y, sx: s.sp.sx, sy: s.sp.sy, w: s.sp.w, h: s.sp.h, px: s.sp.px, pxAge: s.sp.pxAge, dOwn: s.dOwn, dCtr: s.dCtr }));
        out.ownVia = anchored.length ? 'nick' : 'centre';
        // v1.15.0 Patch 1: sprite-attached state scan (entity-component
        // pattern - logical state rides on the display object). Capped at
        // ~40 censuses so a permanent miss can't jank the game loop.
        try {
          W.__camlanSpriteTries = (W.__camlanSpriteTries || 0) + 1;
          if (!W.__camlanState && pick.length > 0 && W.__camlanSpriteTries <= 40) {
            for (const s of pick) {
              const node = s.sp && s.sp.node;
              if (!node) continue;
              let hit = null;
              try {
                const nks = Object.keys(node).slice(0, 100);
                for (const k of nks) {
                  let val = null;
                  try { val = node[k]; } catch (eV2) { continue; }
                  if (val && typeof val === 'object' && (hit = camlanPublishState(val, 'sprite:' + k))) break;
                }
              } catch (eS2) {}
              if (hit || W.__camlanState) break;
            }
          }
        } catch (eSp2) {}
        // v1.11.0: body-sibling walk RETIRED (030851: 2 bodies for 4 own
        // texts, offset ~50px - unstable across builds; the one useful
        // result, fixed 256x256, stands on direct sx/w evidence).
        // v1.9.0: state-object readout. v1.15.0: refreshes live numerics
        // every census once captured, giving the mass time-series for the
        // split-diff without per-write snapshots.
        try {
          out.stateKeys = W.__camlanKeys || null;
          if (W.__camlanState) {
            const live = {};
            camlanReadNums(W.__camlanState, live, 40);
            out.stateNums = live;
          } else {
            out.stateNums = W.__camlanStateNums || null;
          }
          out.stateFound = !!W.__camlanStateFound;
          out.stateSource = W.__camlanStateVia || null;
        } catch (eSt) {}
      } catch (eOwn) {}
    } catch (e) {}
    return out;
  };
  const panel = () => {
    const out = {};
    // v1.13.0: armed-time clock for bundle-grep retries (load-time shots
    // are lost when the tracker arms late).
    try {
      W.__camlanSnaps = (W.__camlanSnaps || 0) + 1;
      if (W.__camlanSnaps === 5 || W.__camlanSnaps === 30) bundleGrep();
    } catch (eSn) {}
    for (const id of IDS) {
      const el = DOC.getElementById(id);
      if (el) out[id] = { html: el.outerHTML.slice(0, 400), text: (el.textContent || '').slice(0, 120) };
    }
    // v1.16.0: pCells transition arms the wire split-keep (see logBin)
    // and beacons a 'pcells' marker so the offline diff no longer depends
    // on 5Hz snapshot alignment. Also re-runs bundleGrep once per
    // transition: by then all lazy chunks (BQDE/DKA/Br4a) are loaded,
    // fixing 052527 where grep only ever saw Cnr6gQmz.
    try {
      const cur = (out.pCells && out.pCells.text) || '';
      const prev = W.__camlanPrevCells || null;
      if (prev !== null && cur && cur !== prev) {
        try { W.__camlanSplitKeepUntil = Date.now() + 2000; } catch (eK) {}
        try { push('pcells', { from: String(prev).slice(0, 24), to: String(cur).slice(0, 24) }); } catch (eP) {}
        try { bundleGrep(); } catch (eG) {}
      }
      if (cur) W.__camlanPrevCells = cur;
    } catch (ePc) {}
    out.__overlays = overlayCensus();
    out.__scene = sceneCensus();
    return out;
  };
  // v1.17.0: caller-code dump. Passive shape-scanning is exhausted -
  // 054235 has clean Pixi rejection + 70 split-kept fulls but still only
  // ONE <script src> visible (Cnr6gQmz); the writers (DKA/BQDE/Br4a) are
  // dynamic chunks, and the facade lives in a closure. So on each novel
  // cell-write (1/64, 2/64...) fetch the exact bundle bytes around the
  // stack offsets and beacon them. Page-context fetch (cookies, no 403);
  // deduped per url:off; code truncated to 1800 chars; failures beaconed.
  // v1.18.0: fix multi-off-per-URL (055954 dumped 7637 but skipped 7665
  // in the same file via seen[url]). Now matches url:line:col triples,
  // dedupes per triple, col~=offset on line 1. Also records line+col.
  const camlanDumpCallerStack = (stack, tag) => {
    try {
      if (!stack || !W.fetch) return;
      W.__camlanDumpedSites = W.__camlanDumpedSites || {};
      let triples = null;
      try {
        triples = Array.from(String(stack).matchAll(/https:\/\/play\.gota\.io\/assets\/js\/[A-Za-z0-9_-]+\.js:\d+:\d+/g)).map(function (m) { return m[0]; });
      } catch (eM) { triples = null; }
      if (!triples || !triples.length) return;
      const seenThis = {};
      for (const t of triples) {
        if (seenThis[t]) continue;
        seenThis[t] = true;
        let u = t, line = 1, col = 0;
        try {
          const mm = t.match(/(https:\/\/play\.gota\.io\/assets\/js\/[A-Za-z0-9_-]+\.js):(\d+):(\d+)/);
          if (mm) { u = mm[1]; line = parseInt(mm[2], 10) || 1; col = parseInt(mm[3], 10) || 0; }
        } catch (eP) {}
        const off = (line === 1 && col > 0) ? col : 0;
        const key = u + ':' + line + ':' + col;
        if (W.__camlanDumpedSites[key]) continue;
        W.__camlanDumpedSites[key] = true;
        (function (uu, ll, cc, oo, kk) {
          try {
            W.fetch(uu, { cache: 'no-store' }).then(function (r) { return r.text(); }).then(function (src) {
              try {
                let code = '', start = 0;
                if (ll === 1 && oo > 0) { start = Math.max(0, oo - 900); code = src.slice(start, start + 1800); }
                else { const ls = src.split('\n'); start = Math.max(0, ll - 20); code = ls.slice(start, start + 40).join('\n').slice(0, 1800); }
                push('caller-code', { tag: String(tag).slice(0, 40), url: uu.slice(-48), line: ll, col: cc, off: oo, start: start, code: code.slice(0, 1800) });
              } catch (eG) {}
            }).catch(function (err) {
              try { push('caller-code-fail', { tag: String(tag).slice(0, 40), url: uu.slice(-48), line: ll, col: cc, off: oo, err: String(err).slice(0, 80) }); } catch (eF) {}
            });
          } catch (eT) {}
        })(u, line, col, off, key);
      }
    } catch (e) {}
  };
  const hookNode = (el) => {
    if (!el || el.__camlanHooked) return;
    el.__camlanHooked = true;
    const label = (el.id ? '#' + el.id : el.tagName) + '::' + ((el.className || '').toString().slice(0, 40));
    for (const prop of ['textContent', 'innerText', 'innerHTML']) {
      try {
        // Read the CURRENT descriptor (Murther's prototype wrapper if it got
        // there first) and chain: probe logs, then calls straight through.
        const desc = Object.getOwnPropertyDescriptor(NodeProto, prop)
                  || Object.getOwnPropertyDescriptor(ElProto, prop);
        if (!desc || !desc.set) continue;
        Object.defineProperty(el, prop, {
          configurable: true,
          get() { return desc.get.call(this); },
          set(v) {
            // v1.15.0 Patch 3: DOM-attached state scan (el.__state/entity
            // pattern). Skips the node itself, the document and window;
            // setter fires only on engine writes, and capture is one-shot.
            try {
              if (!W.__camlanState) {
                let seenD = 0;
                for (const k in this) {
                  if (seenD++ > 150) break;
                  let val = null;
                  try { val = this[k]; } catch (eD2) { continue; }
                  if (!val || typeof val !== 'object') continue;
                  try {
                    if (val === DOC || val === W.document || val === W || val.nodeType !== undefined) continue;
                  } catch (eSk2) { continue; }
                  if (camlanPublishState(val, 'dom:' + k)) break;
                }
              }
            } catch (eDs) {}
            const stk = new Error().stack.split('\n').slice(1, 4).join(' <- ').slice(0, 400);
            push('setter', { node: label, prop, value: String(v).slice(0, 200), stack: stk });
            // v1.17.0: cell-write marker + caller-code dump + saw-counter
            // debug. 054235 fired DKA updateCellCounter setters with ZERO
            // state-miss, so we no longer infer the miss block ran - beacon
            // an explicit saw event (proves stk match + W.Error presence)
            // and dump the writer bytes (proves which bundle scope holds
            // mass). Bounded: dump deduped per url:off, novel values only.
            try {
              const vStr = String(v).slice(0, 24);
              if (/^\d+\s*\/\s*\d+$/.test(vStr)) {
                const norm = vStr.replace(/\s+/g, '');
                if (W.__camlanLastCellWrite !== norm) {
                  W.__camlanLastCellWrite = norm;
                  try { push('cell-write', { value: norm, node: label.slice(0, 48), stack: stk }); } catch (eCw) {}
                  try { camlanDumpCallerStack(stk, 'cell-write:' + norm); } catch (eDc) {}
                }
              }
              if (/syncRuntimeState|updateCellCounter|updateScorePanel/.test(stk) && !W.__camlanSawLogged) {
                W.__camlanSawLogged = true;
                try { push('saw-counter', { hasErr: !!W.Error, stk: stk.slice(0, 200) }); } catch (eSaw) {}
              }
            } catch (eCw2) {}
            // v1.8.0: stash the counter write site (file+offset) for
            // static analysis: the stack string names the exact bundle +
            // function. Throttled: rewrite only when the site changes.
            // (v1.15.0: the old "never wrap .call" rule is lifted - the
            // trap now wraps both apply and call, pre-gated and disarming.)
            // v1.12.0: also matches the state fan-out bundle. String-pinned
            // symbols only (syncRuntimeState/updateCellCounter survive
            // rotation; hash names like ChkOWSCx/DyBRNzbX do not).
            try {
              if (/updateCellCounter|updateScorePanel|syncRuntimeState/.test(stk)) {
                // v1.18.0: strict site parse (was /[^)\s]+/ which kept the
                // trailing ')' from "at b (url:1:88752)" -> "...88752)").
                const m = String(stk || '').match(/https:\/\/play\.gota\.io\/assets\/js\/[A-Za-z0-9_-]+\.js:\d+:\d+/);
                const site = (m ? m[0].slice(0, 160) : stk.slice(0, 160));
                if (W.__camlanCounterSite !== site) W.__camlanCounterSite = site;
              }
            } catch (eSite) {}
            // v1.14.0: STRUCTURAL owner capture. Bundle forensics on
            // DyBRNzbX.js proved key names can NEVER match: the state is
            // pt({...26 closures...}) with $g-hash keys, and pMass/pScore
            // appear in NO bundle at all. So instead of names, match SHAPE:
            // the owner instance from the $g1cliwrh/$g1wulwqx frame carries
            // a child object with 15-60 keys of which >=12 are functions
            // (the pt facade signature), plus numeric getters (mass lives
            // behind get[$g-hash] delegating to the facade). Beacons a
            // 'state-snapshot' on EVERY counter/panel setter fire (~30 per
            // session): the written DOM value is already in the paired
            // setter event, so offline diff across a split finds the getter
            // that halves. No key names anywhere: rotation-proof.
            // Structural owner capture now funnels through the shared
            // v1.15.0 core (camlanIsFacade/camlanReadNums/camlanPublishState).
            const isFacade = camlanIsFacade;
            const readNums = camlanReadNums;
            try {
              if (/syncRuntimeState|updateCellCounter|updateScorePanel/.test(stk) && W.Error) {
                const _pst = W.Error.prepareStackTrace;
                let miss = 'unknown', bundleFrames = 0;
                try {
                  W.Error.prepareStackTrace = function (_, frames) { return frames; };
                  const err2 = new W.Error();
                  const frames = err2.stack;
                  if (!frames || typeof frames.length !== 'number') { miss = 'no-frames'; }
                  else {
                    miss = 'no-bundle-frame';
                    for (let fi = 0; fi < Math.min(frames.length, 12); fi++) {
                      let th = null, file = '';
                      try {
                        const fr = frames[fi];
                        file = (fr.getFileName && fr.getFileName()) || '';
                        if (!/play\.gota\.io\/assets\/js\//.test(file)) continue;
                        bundleFrames++;
                        th = (fr.getThis && fr.getThis()) || null;
                      } catch (eFr) { th = null; continue; }
                      if (!th || typeof th !== 'object') { miss = 'this-null'; continue; }
                      // Facade child? (the owner signature)
                      let fk = null;
                      try {
                        const tks = Object.keys(th).slice(0, 150);
                        for (const k of tks) {
                          let cv = null;
                          try { cv = th[k]; } catch (eCv) { continue; }
                          if (cv && typeof cv === 'object' && isFacade(cv)) { fk = k; break; }
                        }
                      } catch (eFk) {}
                      const nums = {};
                      const nNums = readNums(th, nums, 40);
                      if (fk) {
                        try {
                          const fo = th[fk];
                          const fks = Object.keys(fo).slice(0, 60);
                          for (const k2 of fks) {
                            let dv = null;
                            try { dv = fo[k2]; } catch (eDv) { continue; }
                            if (typeof dv === 'number' && isFinite(dv) && !(k2 in nums)) nums['~' + k2] = Math.round(dv * 1000) / 1000;
                          }
                        } catch (eFd) {}
                      }
                      const nTotal = Object.keys(nums).length;
                      if (fk && nTotal >= 2) {
                        try { push('state-snapshot', { fk: String(fk).slice(0, 24), nums: nums, w: String(v).slice(0, 24) }); } catch (ePu) {}
                        miss = '';
                        break;
                      }
                      miss = fk ? ('few-nums:' + nTotal) : 'no-facade';
                    }
                  }
                } catch (eInner) {
                  // v1.16.0: never go silent. 052527 fired counter setters
                  // with zero miss events - an inner throw (CSP/readonly
                  // prepareStackTrace, strict-this) skipped the push via
                  // finally->outer-catch. Record the throw instead.
                  try { miss = 'inner-throw:' + String((eInner && eInner.message) || eInner).slice(0, 60); } catch (eM) {}
                } finally {
                  try { W.Error.prepareStackTrace = _pst; } catch (eRs) {}
                }
                // v1.16.0: log up to 3 DISTINCT miss reasons (was one-shot).
                // One-shot hid whether later setters failed differently;
                // 3 distinct whys is still bounded (~3 events/session).
                if (miss) {
                  try {
                    W.__camlanMissSeen = W.__camlanMissSeen || {};
                    if (!W.__camlanMissSeen[miss]) {
                      const seenN = Object.keys(W.__camlanMissSeen).length;
                      if (seenN < 3) {
                        W.__camlanMissSeen[miss] = true;
                        push('state-miss', { why: miss.slice(0, 120), bundleFrames: bundleFrames, stk: String(stk).slice(0, 160) });
                      }
                    }
                  } catch (eMl) {}
                }
              }
            } catch (eSt8) {}
            return desc.set.call(this, v);
          }
        });
      } catch (e) {}
    }
  };
  const hookScoreNodes = () => {
    for (const id of IDS) { const el = DOC.getElementById(id); if (el) hookNode(el); }
    const p = DOC.getElementById('score-panel') || DOC.getElementById('scorePanel');
    if (p) p.querySelectorAll('*').forEach(hookNode);
  };
  const MO = W.MutationObserver || MutationObserver;
  const mo = new MO((muts) => {
    for (const m of muts.slice(-60)) {
      const t = m.target;
      push('mutation', { type: m.type,
        node: (t.id ? '#' + t.id : t.nodeName) + '::' + ((t.className || '').toString().slice(0, 40)),
        value: (t.textContent || '').slice(0, 160) });
    }
  });
  const observe = () => {
    const p = DOC.getElementById('score-panel') || DOC.getElementById('scorePanel') || DOC.body;
    if (p && !p.__camlanObserved) {
      p.__camlanObserved = true;
      mo.observe(p, { childList: true, subtree: true, characterData: true });
    }
  };
  // fetch / XHR tap (heads only). Murther touches neither; once-guarded.
  try {
    if (W.fetch && !W.fetch.__camlanProbe) {
      const _fetch = W.fetch;
      const wrappedFetch = async (...a) => {
        const r = await _fetch(...a);
        try { const c = r.clone(); c.text().then(t => push('fetch', { url: String(a[0]).slice(0, 200), bytes: t.length, head: t.slice(0, 200) })).catch(() => {}); } catch (e) {}
        return r;
      };
      try { wrappedFetch.__camlanProbe = true; } catch (eF) {}
      W.fetch = wrappedFetch;
    }
    const XHR = W.XMLHttpRequest || XMLHttpRequest;
    if (XHR && !XHR.prototype.open.__camlanProbe) {
      const _open = XHR.prototype.open, _send = XHR.prototype.send;
      const wrappedOpen = function (m, u) { this.__camlanUrl = String(u).slice(0, 200); return _open.apply(this, arguments); };
      const wrappedSend = function (b) {
        this.addEventListener('load', function () { try { push('xhr', { url: this.__camlanUrl || '', bytes: (this.responseText || '').length, head: (this.responseText || '').slice(0, 200) }); } catch (e) {} });
        return _send.apply(this, arguments);
      };
      try { wrappedOpen.__camlanProbe = true; wrappedSend.__camlanProbe = true; } catch (eX) {}
      XHR.prototype.open = wrappedOpen;
      XHR.prototype.send = wrappedSend;
    }
  } catch (e) {}
  // WebSocket tap - INVISIBLE by design, so Murther's own socket layer
  // (its window.WebSocket replacement + its once-guarded prototype.send
  // wrapper for reverse mode) keeps working untouched:
  //  - the constructor wrapper only LOGS the url, then constructs through
  //    whatever is installed (native or Murther's), shares the SAME prototype
  //    object (never a copy), and never overrides the instance's .send.
  //  - incoming frames are read by wrapping addEventListener (once-guarded):
  //    any 'message' listener - the game's or Murther's - gets a transparent
  //    logging shell that calls straight through with identical this/args.
  // Full-frame beacon (v1.2.0): 32-byte heads can fingerprint opcodes but can
  // never DECODE mass. Full bodies + the cells-count timeline (splits halve
  // mass exactly when the counter jumps) give an offline known-event decode.
  // Bounded: bodies over 8KB are head-only; binary is throttled to ~4 posts/s
  // so the beacon never floods the game loop.
  // v1.5.0: large snapshots (len>1000, the nick+skin frames that map ID <->
  // cell blob) bypass the throttle - they are rare and are the only frames
  // that can ground the delta decode. Small deltas stay throttled.
  // v1.6.0: rare control/event ops always keep full bodies (they are tiny
  // and carry the local ID: 0x40 spawn = [1..2] is pId, 0x7A tick event =
  // [2..3] is pId). v1.5.x throttled them to 32-byte heads, losing the
  // 0x7A tail (len 42-43). Small op=0x02 deltas stay throttled.
  // v1.13.0: tiny op=2 ticks full-keep. The 91/94/95-byte frames carry
  // the record/trailer boundary the offline decode needs (94 = 9+10x8+5
  // proven; 91 undecided for lack of ONE full body), and at ~150B b64
  // each they cost nothing. Rare ops keep their bypass below.
  const B64_MAX = 8192;
  let lastBinPost = 0;
  let lastSnapPost = 0;
  const RARE_OPS = { 10: 1, 64: 1, 68: 1, 69: 1, 122: 1, 124: 1, 197: 1, 239: 1 };
  const b64enc = (u8) => {
    try {
      let s = '';
      for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
      return btoa(s);
    } catch (e) { return ''; }
  };
  const logBin = (len, u8full) => {
    try {
      const now = Date.now();
      const head = Array.from(u8full.slice(0, 32));
      const op = u8full.length ? (u8full[0] | 0) : -1;
      const isSnap = len > 1000;
      if (len > B64_MAX) {
        push('ws-msg-bin', { dir: 'in', len, head, full: false });
        return;
      }
      if (isSnap) {
        // Snapshots are ~1-5KB and infrequent: keep every other one max.
        if (now - lastSnapPost < 500) { push('ws-msg-bin', { dir: 'in', len, head, full: false, throttled: 'snap' }); return; }
        lastSnapPost = now;
        lastBinPost = now;
        push('ws-msg-bin', { dir: 'in', len, head, full: true, b64: b64enc(u8full), snap: true });
        return;
      }
      // Rare ops are tiny (<100B) and infrequent: never throttle them.
      // This is what carries 0x40 spawn + 0x7A local-player events fully.
      if (RARE_OPS[op]) {
        push('ws-msg-bin', { dir: 'in', len, head, full: true, b64: b64enc(u8full), rare: op });
        return;
      }
      if (op === 2 && len < 160) {
        push('ws-msg-bin', { dir: 'in', len, head, full: true, b64: b64enc(u8full), tiny: true });
        return;
      }
      // v1.16.0: split-keep window. 052527 proved the 250ms throttle eats
      // the exact split burst (713/682/689 heads-only around the 1->2
      // flip; only far-apart len326 pair survived -> halved NONE on churn).
      // panel() arms a 2s full-keep on every pCells transition, so the
      // frames that matter bypass the throttle. Marked kept:'split'.
      try {
        if (op === 2 && W.__camlanSplitKeepUntil && now < W.__camlanSplitKeepUntil) {
          lastBinPost = now;
          push('ws-msg-bin', { dir: 'in', len, head, full: true, b64: b64enc(u8full), kept: 'split' });
          return;
        }
      } catch (eSk) {}
      if (now - lastBinPost < 250) {
        push('ws-msg-bin', { dir: 'in', len, head, full: false });
        return;
      }
      lastBinPost = now;
      push('ws-msg-bin', { dir: 'in', len, head, full: true, b64: b64enc(u8full) });
    } catch (e) {}
  };
  const logMsgData = (data) => {
    try {
      const UA = W.Uint8Array || Uint8Array, BB = W.Blob || Blob, AB = W.ArrayBuffer || ArrayBuffer;
      if (typeof data === 'string') push('ws-msg', { dir: 'in', text: data.slice(0, 600), len: data.length });
      else if (AB && data instanceof AB) { const u = new UA(data); logBin(u.length, u); }
      else if (BB && data instanceof BB) data.arrayBuffer().then(ab => { const u = new UA(ab); logBin(u.length, u); }).catch(() => {});
    } catch (e) {}
  };
  try {
    if (W.WebSocket && !W.WebSocket.__camlanProbe) {
      const _WS = W.WebSocket;
      const WSWrapper = function (url, proto) {
        push('ws-open', { url: String(url).slice(0, 200) });
        return proto ? new _WS(url, proto) : new _WS(url);
      };
      WSWrapper.__camlanProbe = true;
      WSWrapper.prototype = _WS.prototype;   // same object, never a copy
      W.WebSocket = WSWrapper;
    }
    const wproto = W.WebSocket && W.WebSocket.prototype;
    if (wproto && !wproto.addEventListener.__camlanProbe) {
      const _ael = wproto.addEventListener;
      const wrappedAEL = function (type, listener, opts) {
        if (type === 'message' && typeof listener === 'function' && !listener.__camlanProbeMsg) {
          const _l = listener;
          const shell = function (ev) { logMsgData(ev && ev.data); return _l.apply(this, arguments); };
          try { shell.__camlanProbeMsg = true; } catch (e) {}
          return _ael.call(this, type, shell, opts);
        }
        return _ael.apply(this, arguments);
      };
      try { wrappedAEL.__camlanProbe = true; } catch (e) {}
      wproto.addEventListener = wrappedAEL;
    }
  } catch (e) {}
  // panel snapshot ~5Hz
  setInterval(() => {
    try { push('panel-snap', { panel: panel() }); } catch (e) {}
  }, 200);
  // re-hook new nodes (engine rebuilds panels)
  setInterval(() => { try { hookScoreNodes(); observe(); } catch (e) {} }, 2000);
  hookScoreNodes();
  observe();
  // v1.12.0: in-probe bundle grep. Hashes rotate every build, but the DOM
  // strings pin the symbols (syncRuntimeState/updateCellCounter/multibox).
  // Page-context fetch carries cookies (no 403); beacons ±400 chars around
  // the first hit of each term (bounded 800).
  // v1.13.0: armed-time retries. The 8s post-load shot fires before the
  // user presses Start (032728 lost hello+snips to late arming), so retry
  // on snap #5 and #30 with per-bundle+term dedup.
  const bundleGrep = () => {
    // v1.15.2: bounded attempts (load + snap retries + 60s periodic, max
    // 6 total). 050227 proved load-relative shots are ALL lost when the
    // user arms late - and per-attempt (not one-shot) miss events, so an
    // armed session always catches one. Snip dedup stays per bundle+term.
    // v1.16.0: 052527 proved the slice(0,3) cap + no try-tag + no script
    // list hides the real bundles (grep only ever saw Cnr6gQmz while the
    // setter stacks proved BQDE/DKA/Br4a were loaded). Now: up to 8
    // scripts, iterate ALL, tag every miss with try, beacon a bundle-list
    // per attempt. Extra trigger: panel() calls this on pCells flips.
    try {
      W.__camlanGrepTries = (W.__camlanGrepTries || 0) + 1;
      if (W.__camlanGrepTries > 8) return;
      const myTry = W.__camlanGrepTries;
      // v1.18.0: old literals dead (055954: DKA itself has neither
      // syncRuntimeState nor updateCellCounter - display names only,
      // jsconfuser string-table build). Search DOM/i18n/facade markers.
      const terms = ['pCells', 'pMass', 'score-panel', 'shell.k080', '$g'];
      const urls = [];
      try {
        const scripts = DOC.getElementsByTagName('script');
        for (let i = 0; i < scripts.length && urls.length < 12; i++) {
          const s = (scripts[i] && scripts[i].src) || '';
          if (/play\.gota\.io\/assets\/js\//.test(s) && urls.indexOf(s) < 0) urls.push(s);
        }
      } catch (eS) {}
      // v1.17.0: 054235 proved <script src> only ever shows Cnr6gQmz -
      // DKA/BQDE/Br4a are dynamic chunks. Enumerate performance resources
      // too (covers import()/chunk loads without extra permissions).
      try {
        const perf = W.performance;
        if (perf && typeof perf.getEntriesByType === 'function') {
          const res = perf.getEntriesByType('resource') || [];
          for (let i = 0; i < res.length && urls.length < 12; i++) {
            const s = (res[i] && res[i].name) || '';
            if (/play\.gota\.io\/assets\/js\//.test(s) && urls.indexOf(s) < 0) urls.push(s);
          }
        }
      } catch (eP) {}
      if (!urls.length || !W.fetch) {
        try { push('bundle-miss', { why: !urls.length ? 'no-script-tags' : 'no-fetch', try: myTry }); } catch (eMm) {}
        return;
      }
      try {
        push('bundle-list', { try: myTry, bundles: urls.map(function (u) { return u.slice(-40); }).slice(0, 8) });
      } catch (eBl) {}
      W.__camlanSnipped = W.__camlanSnipped || {};
      W.__camlanMissed = W.__camlanMissed || {};
      for (const u of urls) {
        (function (url) {
          try {
            W.fetch(url).then(function (r) { return r.text(); }).then(function (src) {
              try {
                for (const t of terms) {
                  const key = url + '|' + t;
                  if (W.__camlanSnipped[key] || W.__camlanMissed[key]) continue;
                  const ix = src.indexOf(t);
                  if (ix >= 0) {
                    W.__camlanSnipped[key] = true;
                    push('bundle-snip', { bundle: url.slice(-40), term: t,
                      snip: src.slice(Math.max(0, ix - 400), ix + 400).slice(0, 800) });
                  } else {
                    // v1.18.0: dedupe misses too (was 144 repeat events in
                    // 055954: 12 bundles x 2 terms x 6 tries). One miss per
                    // bundle+term, still tagged with first-try number.
                    W.__camlanMissed[key] = true;
                    push('bundle-miss', { why: 'term-absent:' + t, bundle: url.slice(-40), bytes: src.length, try: myTry });
                  }
                }
              } catch (eG) {}
            }).catch(function (err) {
              try { push('bundle-miss', { why: 'fetch-rejected', bundle: url.slice(-40), try: myTry }); } catch (eMr) {}
            });
          } catch (eF) {
            try { push('bundle-miss', { why: 'fetch-threw', bundle: url.slice(-40), try: myTry }); } catch (eMf) {}
          }
        })(u);
      }
    } catch (e) {}
  };
  setTimeout(() => { try { bundleGrep(); } catch (e) {} }, 8000);
  setInterval(() => { try { bundleGrep(); } catch (e) {} }, 60000);
  // v1.13.2: heartbeat hello every 5s (in addition to the load hello),
  // so late Start presses still see a live probe. Tiny, same beacon pipe.
  setInterval(() => {
    try { push('probe-hello', { via: 'gm-xhr', probe: '1.18.0', hb: true }); } catch (e) {}
  }, 5000);
  push('probe-hello', { via: 'gm-xhr', probe: '1.18.0', ua: (W.navigator.userAgent || '').slice(0, 120) });
})();
