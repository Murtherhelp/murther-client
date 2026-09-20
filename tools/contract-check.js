#!/usr/bin/env node
/**
 * contract-check.js — what this client needs from play.gota.io, and whether the saved game
 * build still ships it.
 *
 *   node tools/contract-check.js            report; exit 1 if an id DISAPPEARED vs the baseline
 *   node tools/contract-check.js --update   rewrite tools/contract-baseline.json
 *   node tools/contract-check.js --json     machine-readable output
 *
 * Why it exists: every game update so far has broken something in this client by renaming or
 * moving ONE id (#pmass, #score-panel, #btn-play, the extra strip...). The userscript is the
 * source of the ids it queries; "Game Files/" is the saved build.
 *
 * What can and cannot be checked statically, stated plainly:
 *   - the game's BUNDLES are jsconfuser-obfuscated, so grepping them for a literal id mostly
 *     misses (strings get split and rebuilt) - they are searched, but a miss there proves
 *     nothing;
 *   - index.html is not part of the saved build at all;
 *   - an id does NOT need a CSS rule to exist, so a stylesheet miss is not proof of removal
 *     either. The stylesheet is still the best static inventory available, because it is
 *     plain CSS and every HUD id this client binds (#score-panel, #chat-panel, #minimap-panel,
 *     #leaderboard-panel, #party-panel, #extra-panel, #main-*, #btn-*) does appear in it.
 * For that reason an id found in neither is reported as UNVERIFIABLE, not as gone, and the
 * live answer always comes from the page: __murther.contract() reports the same ids with a
 * resolved flag from the real DOM.
 *
 * A baseline (tools/contract-baseline.json) keeps the noise down: the first run records
 * today's state, and later runs only shout about ids that CHANGED - newly unverifiable ids
 * (a game update moved something) or newly resolved ones (a rename was absorbed).
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const US = path.join(ROOT, 'murther.user.js');
const GAME_DIR = path.join(ROOT, 'Game Files');
const BASELINE = path.join(__dirname, 'contract-baseline.json');

const args = process.argv.slice(2);
const UPDATE = args.includes('--update');
const JSON_OUT = args.includes('--json');

/* Ids the CLIENT creates and owns: never part of the game contract. */
const OWN_PREFIX = /^(mx|murther|mx-)/;
/* Ids that look like a CSS colour literal (#a78bfa) rather than an element id. Only treated
 * as noise when the game's own stylesheet does not mention them. */
const HEXISH = /^[0-9a-f]{3,8}$/i;
/* Not the game contract: ad slots, cookie/GDPR furniture, the analytics preroll - the client
 * touches them, but a rename there is not a broken feature. */
const IGNORE = new Set([
  'GOT_gota-io_336x280', 'ad-wrapper', 'adblock-fallback', 'aip-consent', 'aip_gdpr',
  'acceptCookies', 'declineCookies', 'cookie-banner', 'preroll'
]);

function readIf(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch (e) { return ''; }
}

function gameText() {
  let out = '';
  let files = [];
  try {
    files = fs.readdirSync(GAME_DIR).filter(f => /\.(css|js|html)$/i.test(f));
  } catch (e) {
    return { text: '', files: [] };
  }
  for (const f of files) out += '\n' + readIf(path.join(GAME_DIR, f));
  return { text: out, files };
}

/* Strip line comments and block comments WITHOUT touching string literals - a selector that
 * only ever appears in a comment is not part of the contract, and a URL inside a string
 * (https://play.gota.io/...) must not be mistaken for a comment start or for a selector. */
function stripComments(src) {
  let out = '';
  let i = 0;
  let quote = null;
  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1];
    if (quote) {
      if (c === '\\') { out += c + (n || ''); i += 2; continue; }
      if (c === quote) quote = null;
      out += c; i++; continue;
    }
    if (c === '"' || c === "'" || c === '`') { quote = c; out += c; i++; continue; }
    if (c === '/' && n === '/') {
      while (i < src.length && src[i] !== '\n') i++;
      out += ' '; continue;
    }
    if (c === '/' && n === '*') {
      i += 2;
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++;
      i += 2; out += ' '; continue;
    }
    out += c; i++;
  }
  return out;
}

function collectIds(text) {
  const set = new Set();
  const re = /#([A-Za-z][A-Za-z0-9_-]*)/g;
  let m;
  while ((m = re.exec(text))) set.add(m[1]);
  return set;
}

function main() {
  const us = readIf(US);
  if (!us) {
    console.error('murther.user.js not found at ' + US);
    process.exit(2);
  }
  const game = gameText();
  if (!game.text) {
    console.error('No game build found in ' + GAME_DIR + ' - the contract cannot be checked.');
    process.exit(2);
  }

  /* The game's own stylesheet is the only part of the saved build that declares ids in
   * plain text; the bundles are searched too, but a hit there is treated as found anyway. */
  const cssIds = new Set();
  try {
    for (const f of fs.readdirSync(GAME_DIR)) {
      if (/\.css$/i.test(f)) collectIds(readIf(path.join(GAME_DIR, f))).forEach(id => cssIds.add(id));
    }
  } catch (e) { /* handled above */ }
  const bundleIds = new Set();
  try {
    for (const f of fs.readdirSync(GAME_DIR)) {
      if (/\.js$/i.test(f)) collectIds(readIf(path.join(GAME_DIR, f))).forEach(id => bundleIds.add(id));
    }
  } catch (e) { /* handled above */ }

  const used = collectIds(stripComments(us));

  /* The hosted-panel engine (v1.38.0) is GATED OFF in the client (MX_HOST = false), so the
   * selectors only it references are not part of the live contract: they are reported apart
   * instead of as unverifiable contract, or a game update would look like ten breakages when
   * nothing can call them. */
  const panelBlock = (() => {
    const i = us.indexOf('var MX_PANEL_DEFS');
    if (i < 0) return '';
    const j = us.indexOf('function mxPanelDef(', i);
    return us.slice(i, j > i ? j : i + 20000);
  })();
  const count = (hay, needle) => hay.split(needle).length - 1;
  const gated = [];
  const inCss = [];
  const inBundleOnly = [];
  const unverifiable = [];
  const own = [];

  for (const id of used) {
    if (OWN_PREFIX.test(id) || IGNORE.has(id)) { own.push(id); continue; }
    if (cssIds.has(id)) { inCss.push(id); continue; }
    if (HEXISH.test(id)) continue;                 // colour literal, not an id
    if (bundleIds.has(id)) { inBundleOnly.push(id); continue; }
    if (panelBlock && count(us, '#' + id) === count(panelBlock, '#' + id)) { gated.push(id); continue; }
    unverifiable.push(id);
  }

  inCss.sort(); inBundleOnly.sort(); unverifiable.sort(); own.sort(); gated.sort();

  const baseline = (() => {
    try { return JSON.parse(readIf(BASELINE)) || {}; } catch (e) { return {}; }
  })();
  const known = new Set(baseline.unverifiable || []);

  const newlyUnverifiable = unverifiable.filter(id => !known.has(id));
  const newlyResolved = (baseline.unverifiable || []).filter(id => !unverifiable.includes(id));

  const report = {
    checked: used.size,
    own: own.length,
    foundInCss: inCss,
    foundInBundlesOnly: inBundleOnly,
    unverifiable,
    gatedPanelEngineOnly: gated,
    newlyUnverifiable,
    newlyResolved,
    files: game.files
  };

  if (UPDATE) {
    fs.writeFileSync(BASELINE, JSON.stringify({
      note: 'Generated by tools/contract-check.js --update. Ids here are referenced by murther.user.js but appear in neither the saved game stylesheet nor its bundles; they may still exist in the live DOM.',
      generated: new Date().toISOString().slice(0, 10),
      gameFiles: game.files.length,
      inCss: inCss,
      unverifiable
    }, null, 2) + '\n');
  }

  if (JSON_OUT) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    const line = n => String(n).padStart(4);
    console.log('murther.user.js contract check against Game Files/ (' + game.files.length + ' files)');
    console.log('');
    console.log(line(inCss.length) + '  ids the client uses that the game build declares  (healthy)');
    console.log(line(inBundleOnly.length) + '  ids found only in a game bundle (obfuscated builds hide strings; treat as healthy)');
    console.log(line(unverifiable.length) + '  ids the client uses that the saved build never mentions');
    console.log(line(gated.length) + '  selectors only the GATED panel engine references (MX_HOST = false - not the live contract)');
    console.log(line(own.length) + '  client-owned / non-contract ids ignored (mx*, ad and consent furniture)');
    console.log('');
    if (unverifiable.length) {
      console.log('Unverifiable (a rename here is a broken feature - __murther.contract() is the live answer):');
      console.log('  ' + unverifiable.join(' '));
      console.log('');
    }
    if (newlyUnverifiable.length) {
      console.log('DRIFT - newly unverifiable since the baseline:');
      console.log('  ' + newlyUnverifiable.join(' '));
    }
    if (newlyResolved.length) {
      console.log('Resolved since the baseline (a rename was absorbed, or the build changed):');
      console.log('  ' + newlyResolved.join(' '));
    }
    if (!newlyUnverifiable.length && !newlyResolved.length) {
      console.log('No drift against ' + path.relative(ROOT, BASELINE) + '.');
    }
    if (UPDATE) console.log('\nBaseline written to ' + path.relative(ROOT, BASELINE) + '.');
  }

  process.exit(newlyUnverifiable.length ? 1 : 0);
}

main();
