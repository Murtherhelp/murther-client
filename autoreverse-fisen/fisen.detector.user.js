// ==UserScript==
// @name         Fisen Murther Detector
// @namespace    http://tampermonkey.net/
// @version      3.6
// @description  Stealth detector for the LIVE Fisen client (gde- DOM). Wire capture moved to CDP (python side). Murther = future deliverable.
// @match        *://play.gota.io/*
// @run-at       document-start
// @grant        GM_xmlhttpRequest
// @connect      localhost
// ==/UserScript==
(function() {
'use strict';
// top-frame guard: iframes on the same origin get their own documentElement.
if (window.self !== window.top) return;
// duplicate-install guard on a Symbol key: invisible to Object.keys(window) scans.
const GUARD = Symbol.for('fisen.detector.loaded');
if (window[GUARD]) return;
window[GUARD] = true;

const BRIDGE_URL = "http://localhost:8765";
const POLL_MS = 750;
const HANDSHAKE_RETRY_MS = 3000;
const FIRST_KNOCK_MS = 2000;
const DUMP_TRIGGER_MS = 5000;
const MAX_HANDSHAKE_TRIES = 20;
const INGAME_ACCUMULATE_MS = 3000;
const INGAME_WATCH_MS = 600000;
const HUD_SAMPLE_MS = 250;
const HUD_MAX_SAMPLES = 400;
// v3.6: default OFF. wire capture is the CDP observer in fisen.py now; in-page taps
// are opt-in diagnostics only: localStorage.setItem('fisen.tapMode','proxy'|'proto')
const TAP_MODE = (function() {
    try { return (localStorage.getItem('fisen.tapMode') || 'off').toLowerCase(); } catch (e) { return 'off'; }
})();
const CLIENT_FLAVOR = "fisen-gde"; // live client = Fisen client. Murther ships later.
const INSTANCE_ID = Math.random().toString(36).slice(2, 10);

const startTime = Date.now();
let clientDetected = false;
let confirmed = false;
let handshakeInFlight = false;
let handshakeTries = 0;
let detectionEvidence = null;
let captureArmed = false;
let menuReportSent = false;
let ingameReportSent = false;
let ingameTimer = null;
let ingameWatchTimer = null;
let hudTimer = null;
let dumpSent = false;
let pollTimer = null;
let pollCount = 0;
let lastCheck = 0;
let observer = null;

function log(msg, data) {
    console.log(`[Fisen Detector] ${msg}`, data || '');
}

const fnToString = Function.prototype.toString;
function nativeStringOf(fn) {
    return fnToString.call(fn);
}

function installOnWindowPrototype(propName, proxy) {
    const desc = Object.getOwnPropertyDescriptor(Window.prototype, propName);
    if (desc && desc.get) {
        Object.defineProperty(Window.prototype, propName, {
            configurable: true,
            enumerable: desc.enumerable,
            get: function() { return proxy; },
            set: function() { /* discard writes; the proxy is the constructor now */ }
        });
    } else {
        Object.defineProperty(Window.prototype, propName, {
            configurable: true, writable: true, value: proxy
        });
    }
}

function previewOf(data, dir) {
    try {
        if (data instanceof ArrayBuffer) return { dir, format: 'binary', preview: Array.from(new Uint8Array(data).slice(0, 64)), byteLength: data.byteLength, t: Date.now() };
        if (ArrayBuffer.isView(data)) return { dir, format: 'binary', preview: Array.from(new Uint8Array(data.buffer, data.byteOffset, Math.min(64, data.byteLength))), byteLength: data.byteLength, t: Date.now() };
        if (typeof data === 'string') return { dir, format: 'text', preview: data.substring(0, 256), byteLength: data.length, t: Date.now() };
        return { dir, format: 'json', preview: JSON.stringify(data).substring(0, 256), t: Date.now() };
    } catch (e) {
        return { dir, format: 'unknown', preview: null, t: Date.now() };
    }
}

// ---- opt-in WebSocket tap (default off in v3.6)
const wsTap = { hooked: false, mode: TAP_MODE, sockets: [], samplePackets: [] };
const NativeWS = window.WebSocket;
const NATIVE_ADD = NativeWS.prototype.addEventListener;
const tappedInstances = new WeakSet();

function tapSocket(instance) {
    if (tappedInstances.has(instance)) return;
    tappedInstances.add(instance);
    const meta = { url: String(instance.url || ''), openedAt: Date.now(), frames: 0 };
    wsTap.sockets.push(meta);
    NATIVE_ADD.call(instance, 'message', function(event) {
        if (!captureArmed) return;
        try {
            meta.frames++;
            if (wsTap.samplePackets.length < 50) wsTap.samplePackets.push(previewOf(event.data, 'ws-in'));
        } catch (e) { /* never throw into page context */ }
    });
}

if (TAP_MODE === 'proxy') {
    const wsProxy = new Proxy(NativeWS, {
        construct(target, args, newTarget) {
            const instance = Reflect.construct(target, args, newTarget);
            wsTap.hooked = true;
            tapSocket(instance);
            return instance;
        },
        get(target, prop) {
            if (prop === 'toString') return () => nativeStringOf(target);
            return Reflect.get(target, prop, target);
        }
    });
    NativeWS.prototype.constructor = wsProxy;
    installOnWindowPrototype('WebSocket', wsProxy);
} else if (TAP_MODE === 'proto') {
    const origAdd = NativeWS.prototype.addEventListener;
    const protoAdd = function addEventListener(type, listener, options) {
        if (type === 'message') tapSocket(this);
        return origAdd.call(this, type, listener, options);
    };
    Object.defineProperty(protoAdd, 'toString', { value: () => nativeStringOf(origAdd) });
    NativeWS.prototype.addEventListener = protoAdd;
    const nativeOnMsg = Object.getOwnPropertyDescriptor(NativeWS.prototype, 'onmessage');
    if (nativeOnMsg && nativeOnMsg.set) {
        const protoSet = function onmessage(handler) {
            tapSocket(this);
            return nativeOnMsg.set.call(this, handler);
        };
        Object.defineProperty(protoSet, 'toString', { value: () => nativeStringOf(nativeOnMsg.set) });
        Object.defineProperty(NativeWS.prototype, 'onmessage', {
            configurable: true, enumerable: nativeOnMsg.enumerable,
            get: nativeOnMsg.get, set: protoSet
        });
    }
    wsTap.hooked = true;
} // 'off' = zero in-page wire instrumentation (v3.6 default)

// ---- opt-in Worker tap (follows TAP_MODE)
const workerHook = { hooked: false, workers: [], inbound: [], outbound: [] };
const NativeWorker = window.Worker;
if (NativeWorker && TAP_MODE !== 'off') {
    const wkProxy = new Proxy(NativeWorker, {
        construct(target, args, newTarget) {
            const instance = Reflect.construct(target, args, newTarget);
            workerHook.hooked = true;
            const meta = { url: String(args[0] || ''), openedAt: Date.now(), inFrames: 0, outFrames: 0 };
            workerHook.workers.push(meta);
            NATIVE_ADD.call(instance, 'message', function(event) {
                if (!captureArmed) return;
                try {
                    meta.inFrames++;
                    if (workerHook.inbound.length < 50) workerHook.inbound.push(previewOf(event.data, 'worker-in'));
                } catch (e) { /* never throw */ }
            });
            const origPost = instance.postMessage.bind(instance);
            const wrappedPost = function postMessage(data, transfer) {
                if (captureArmed) {
                    try {
                        meta.outFrames++;
                        if (workerHook.outbound.length < 25) workerHook.outbound.push(previewOf(data, 'worker-out'));
                    } catch (e) { /* never throw */ }
                }
                return transfer !== undefined ? origPost(data, transfer) : origPost(data);
            };
            Object.defineProperty(wrappedPost, 'toString', { value: () => nativeStringOf(NativeWorker.prototype.postMessage) });
            instance.postMessage = wrappedPost;
            return instance;
        },
        get(target, prop) {
            if (prop === 'toString') return () => nativeStringOf(target);
            return Reflect.get(target, prop, target);
        }
    });
    installOnWindowPrototype('Worker', wkProxy);
}

// ---- live-client fingerprint: closure-scoped client, gde- DOM is the only signature.
const GDE_ANCHOR_IDS = ['gde-app', 'gde-hud-left', 'gde-auto-reverse', 'kAutoReverse1X', 'kHexaSplit'];
function detectClient() {
    if (clientDetected) return true;
    const evidence = { anchors: [], gdeIdCount: 0, title: document.title, titleMatch: false, globals: [], tapMode: TAP_MODE, instanceId: INSTANCE_ID };
    for (const id of GDE_ANCHOR_IDS) {
        if (document.getElementById(id)) evidence.anchors.push(id);
    }
    evidence.gdeIdCount = document.querySelectorAll('[id^="gde-"]').length;
    if (/gota dual client/i.test(document.title)) evidence.titleMatch = true;
    for (const key of Object.keys(window)) {
        if (/fisen|gde|dualclient/i.test(key)) evidence.globals.push(key);
    }
    if (evidence.anchors.length >= 2 || evidence.gdeIdCount >= 20) {
        clientDetected = true;
        detectionEvidence = evidence;
        return true;
    }
    return false;
}

// ---- live shortcut readout: the hotkey panel already carries the full contract
const BIND_IDS = ['kSplit', 'kEjectMass', 'kFastFeed', 'kFastFeedMothership', 'kFreezeMouse', 'kLineSplit',
    'kDoubleSplit', 'kTripleSplit', 'kQuadSplit', 'kSplit32', 'kHexaSplit', 'kSplit128', 'kSplit256',
    'kAutoReverse1X', 'kAutoReverse4X', 'kAutoReverse8X', 'kAutoReverse16X', 'kAutoReverse64X',
    'kSolotrickAutoReverse64', 'kDualSwitch', 'kContextMenu', 'kSolotrickMothership',
    'kDynamicDualFocus', 'kDualFocus', 'kToggleSpec', 'kHidePlayerIds'];
const SETTING_IDS = ['cAutoRespawn', 'cPersistentEject', 'sCameraMode', 'sFastFeed', 'sAutoReverseTrigger',
    'sHudAccent', 'sHudBackdrop', 'cSmoothRendering', 'cPastelCells', 'cHideFood', 'cSharedDualScale',
    'cDynamicDualFocus', 'cShowBorder', 'cHideStats', 'cHidePlayerIds'];

function readBind(el) {
    const text = (el.textContent || '').trim().substring(0, 40);
    return {
        id: el.id,
        text: text,
        unbound: /^none$/i.test(text),
        value: (el.value !== undefined && el.value !== null) ? String(el.value).substring(0, 40) : null,
        dataKey: el.getAttribute('data-key') || el.getAttribute('data-bind') || null
    };
}
function readSetting(el) {
    if (el.tagName === 'INPUT' && (el.type === 'checkbox')) return { id: el.id, kind: 'checkbox', checked: !!el.checked };
    if (el.tagName === 'SELECT') return { id: el.id, kind: 'select', value: String(el.value).substring(0, 60) };
    if (el.tagName === 'INPUT') return { id: el.id, kind: 'input', value: String(el.value).substring(0, 60) };
    return { id: el.id, kind: el.tagName.toLowerCase(), text: (el.textContent || '').trim().substring(0, 60) };
}
function gatherShortcutSet() {
    const binds = [];
    const missing = [];
    for (const id of BIND_IDS) {
        const el = document.getElementById(id);
        if (el) binds.push(readBind(el)); else missing.push(id);
    }
    const settings = [];
    for (const id of SETTING_IDS) {
        const el = document.getElementById(id);
        if (el) settings.push(readSetting(el));
    }
    const arPanel = document.getElementById('gde-auto-reverse');
    const arTarget = document.getElementById('gde-auto-reverse-target');
    return {
        binds: binds,
        missingBindIds: missing,
        unboundReturnTargets: binds.filter(b => b.unbound && ['kSplit32', 'kHexaSplit'].includes(b.id)).map(b => b.id),
        settings: settings,
        autoReversePanel: arPanel ? { present: true, text: (arPanel.textContent || '').trim().substring(0, 200) } : { present: false },
        autoReverseTarget: arTarget ? { present: true, text: (arTarget.textContent || '').trim().substring(0, 200) } : { present: false }
    };
}

// ---- HUD ground-truth timeline: own cell/mass counters at 4 Hz while in game.
const hudTimeline = [];
let hudLastKey = '';
function sampleHud() {
    if (!document.body || document.body.classList.contains('gde-menu-open')) return;
    const cells = (document.getElementById('pCellsYou')?.textContent || '').trim();
    const mass = (document.getElementById('pMassYou')?.textContent || '').trim();
    const key = cells + '|' + mass;
    if (key === hudLastKey) return;
    hudLastKey = key;
    if (hudTimeline.length < HUD_MAX_SAMPLES) hudTimeline.push({ t: Date.now(), cells, mass });
}

function postToBridge(endpoint, payload, callback) {
    GM_xmlhttpRequest({
        method: "POST",
        url: `${BRIDGE_URL}${endpoint}`,
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify(payload),
        onload: function(response) {
            try {
                callback(JSON.parse(response.responseText));
            } catch (e) {
                callback({ error: 'parse' });
            }
        },
        onerror: function() {
            callback({ error: 'bridge_unreachable' });
        }
    });
}

function sendHandshake() {
    if (handshakeInFlight || menuReportSent) return;
    handshakeInFlight = true;
    handshakeTries++;
    postToBridge("/handshake", {
        agent: "fisen.detector.user.js",
        clientFlavor: CLIENT_FLAVOR,
        clientDetected: clientDetected,
        instanceId: INSTANCE_ID,
        url: window.location.href,
        evidence: detectionEvidence
    }, (res) => {
        handshakeInFlight = false;
        if (res.action === "scan_environment" && !menuReportSent) {
            menuReportSent = true;
            log("Scan command received. Gathering menu-phase report (one shot).");
            postToBridge("/report", { data: gatherEnvironmentReport('menu') }, (res2) => {
                log("Menu-phase report submitted.", res2);
                startIngameWatch();
            });
        } else if (res.error) {
            if (handshakeTries <= MAX_HANDSHAKE_TRIES) setTimeout(sendHandshake, HANDSHAKE_RETRY_MS);
            else log("Bridge unreachable after retries. Going silent.");
        } else {
            if (handshakeTries <= MAX_HANDSHAKE_TRIES) setTimeout(sendHandshake, HANDSHAKE_RETRY_MS);
            else log("Client unverified after retries. Going silent (no flood).");
        }
    });
}

// ---- in-game phase: HUD movement is the trigger now; taps are opt-in extras.
function startIngameWatch() {
    if (ingameTimer || ingameWatchTimer) return;
    hudTimer = setInterval(sampleHud, HUD_SAMPLE_MS);
    ingameWatchTimer = setTimeout(() => {
        if (!ingameReportSent) log("In-game watch window closed with no activity.");
        ingameTimer = null;
        ingameWatchTimer = null;
        if (hudTimer) { clearInterval(hudTimer); hudTimer = null; }
    }, INGAME_WATCH_MS);
    ingameTimer = setInterval(() => {
        if (ingameReportSent) { clearInterval(ingameTimer); ingameTimer = null; return; }
        const wsFramed = wsTap.sockets.some(s => s.frames > 0);
        const wkFramed = workerHook.workers.some(w => w.inFrames > 0 || w.outFrames > 0);
        const hudLive = hudTimeline.length > 0;
        if (!wsFramed && !wkFramed && !hudLive) return;
        clearInterval(ingameTimer);
        ingameTimer = null;
        setTimeout(() => {
            if (ingameReportSent) return;
            ingameReportSent = true;
            log("In-game activity observed. Shipping in-game report.", { wsFramed, wkFramed, hudSamples: hudTimeline.length });
            postToBridge("/report", { data: gatherEnvironmentReport('ingame') }, (res2) => {
                log("In-game report submitted. Detector fully silent now.", res2);
                if (ingameWatchTimer) { clearTimeout(ingameWatchTimer); ingameWatchTimer = null; }
                if (hudTimer) { clearInterval(hudTimer); hudTimer = null; }
            });
        }, INGAME_ACCUMULATE_MS);
    }, 1000);
}

function sendDump() {
    if (dumpSent || clientDetected) return;
    dumpSent = true;
    const standard = new Set(['location', 'chrome', 'navigator', 'document', 'window', 'self', 'top', 'parent', 'frames', 'length', 'name', 'closed', 'opener', 'origin', 'history', 'navigation', 'customElements', 'screen', 'innerWidth', 'innerHeight', 'scrollX', 'pageXOffset', 'scrollY', 'pageYOffset', 'screenX', 'screenY', 'outerWidth', 'outerHeight', 'devicePixelRatio', 'performance', 'caches', 'cookieStore', 'scheduler', 'speechSynthesis', 'localStorage', 'sessionStorage', 'crypto', 'indexedDB', 'fetch', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'requestAnimationFrame', 'cancelAnimationFrame', 'structuredClone', 'WebSocket']);
    const customGlobals = Object.keys(window).filter(k => !standard.has(k) && !k.startsWith('on') && !k.startsWith('webkit')).slice(0, 200);
    const domIds = Array.from(document.querySelectorAll('[id]')).map(el => el.id).filter(Boolean).slice(0, 250);
    const domClasses = new Set();
    document.querySelectorAll('[class]').forEach(el => {
        if (el.className && typeof el.className === 'string') {
            el.className.split(/\s+/).forEach(c => { if (c) domClasses.add(c); });
        }
    });
    postToBridge("/dump", {
        customGlobals, domIds, domClasses: Array.from(domClasses).slice(0, 250),
        url: window.location.href, title: document.title, instanceId: INSTANCE_ID, timestamp: new Date().toISOString()
    }, () => {});
}

function onConfirmed() {
    if (confirmed) return;
    confirmed = true;
    captureArmed = true;
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    if (observer) { observer.disconnect(); observer = null; }
    log("LIVE CLIENT CONFIRMED (Fisen / gde- DOM). Loops latched. Tap mode: " + TAP_MODE + " (wire capture via CDP), instance " + INSTANCE_ID, detectionEvidence);
    sendHandshake();
}

function check() {
    if (confirmed) return;
    pollCount++;
    lastCheck = Date.now();
    if (clientDetected) { onConfirmed(); return; }
    if (detectClient()) { onConfirmed(); return; }
    if (!dumpSent && (lastCheck - startTime) >= DUMP_TRIGGER_MS) sendDump();
}

function startDetectionLoop() {
    pollTimer = setInterval(check, POLL_MS);
    observer = new MutationObserver(() => {
        const now = Date.now();
        if (now - lastCheck < 250) return;
        check();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
}

function gatherEnvironmentReport(phase) {
    const menuElements = Array.from(document.querySelectorAll('[id*="menu"], [class*="menu"], [id*="settings"], [class*="settings"], .gde-content-panel, .gde-settings-list'))
        .slice(0, 200)
        .map(el => ({ id: el.id || null, className: (el.className && el.className.toString) ? el.className.toString().substring(0, 120) : null, tagName: el.tagName }));
    const globals = Object.keys(window).filter(k => {
        const lower = k.toLowerCase();
        return lower.includes('fisen') || lower.includes('gde') || lower.includes('gota') || lower.includes('player') || lower.includes('cell') || lower.includes('split');
    });
    return {
        phase: phase,
        tapMode: TAP_MODE,
        instanceId: INSTANCE_ID,
        clientFlavor: CLIENT_FLAVOR,
        clientDetected: clientDetected,
        detectionEvidence: detectionEvidence,
        shortcutSet: gatherShortcutSet(),
        wsHook: wsTap,
        workerHook: workerHook,
        hudTimeline: hudTimeline,
        globals: globals,
        menuElements: menuElements,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
    };
}

function init() {
    log("Detector v3.6 live (tap OFF by default, wire capture via CDP observer in fisen.py). Instance " + INSTANCE_ID + ".");
    startDetectionLoop();
    setTimeout(() => { if (!menuReportSent) sendHandshake(); }, FIRST_KNOCK_MS);
}

if (document.readyState === 'loading' || !document.body) {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
})();
