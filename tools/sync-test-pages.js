#!/usr/bin/env node
/**
 * sync-test-pages.js — keeps the inline userscript copies in test pages in sync
 * with murther.user.js.
 *
 *   node tools/sync-test-pages.js           regenerate inline copies
 *   node tools/sync-test-pages.js --check   verify only; exit 1 on drift
 *
 * Since v1.38.0 the same tool also owns the hosted-panel FIXTURE in preview.html: the
 * page inlines test/panels-fixture.js (the native Appearance / Theme editor stubs and the
 * cockpit that proves Murther hosts them) between the mx-fixture markers. The preview
 * server exposes ONLY the page it was given, so a <script src> could never resolve there —
 * inlining is what keeps that page self-contained while test/panels-fixture.js stays the
 * single source (harness.html loads it by src, preview.html gets it inlined). cf-sim.html
 * is deliberately NOT given the fixture: it must keep exercising the 'panel not found'
 * degradation path.
 *
 * v1.58.0: the anti-debug kit is removed - no vectors are inlined any more and the
 * mx-ad-vectors markers are gone from preview.html for good.
 *
 * The test pages embed the full userscript so the harness exercises the exact
 * code that ships. Rebuilding them by hand has produced duplicated
 * ==UserScript== headers and stale bodies before, so this tool owns the
 * replacement: in each page it finds the inline <script> block that contains
 * the // ==UserScript== marker (block order differs between pages) and
 * rewrites its entire content with the current script text. Pages whose
 * userscript block has lost the marker are reported and left untouched.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SCRIPT = path.join(ROOT, 'murther.user.js');
const PAGES = [
  path.join(ROOT, 'test', 'preview.html'),
  path.join(ROOT, 'test', 'cf-sim.html'),
];

const script = fs.readFileSync(SCRIPT, 'utf8').replace(/\r\n/g, '\n');
if (!script.includes('// ==UserScript==') || !script.includes('// ==/UserScript==')) {
  console.error('sync-test-pages: murther.user.js has no userscript header?!');
  process.exit(1);
}

const FIXTURE = path.join(ROOT, 'test', 'panels-fixture.js');
const FIXTURE_START = '<!-- mx-fixture:start -->';
const FIXTURE_END = '<!-- mx-fixture:end -->';
const fixtureBlock = () => [
  FIXTURE_START,
  '<script>',
  fs.readFileSync(FIXTURE, 'utf8').replace(/\r\n/g, '\n').trim(),
  '</script>',
  FIXTURE_END,
].join('\n');

// replace a marker-delimited block, or drop it in above the userscript block on first run
function replaceBlock(text, start, end, block, cutAt) {
  const at = text.indexOf(start);
  if (at >= 0) {
    const e = text.indexOf(end, at);
    if (e < 0) return null;
    return text.slice(0, at) + block + text.slice(e + end.length);
  }
  if (cutAt < 0) return null;
  return text.slice(0, cutAt) + block + '\n\n' + text.slice(cutAt);
}

const checkOnly = process.argv.includes('--check');
let failed = false;

for (const page of PAGES) {
  const rel = path.relative(ROOT, page);
  const html = fs.readFileSync(page, 'utf8').replace(/\r\n/g, '\n');

  // Find every inline <script>…</script> block and locate the userscript one.
  const re = /<script>\n?([\s\S]*?)\n?<\/script>/g;
  let m, usOpen = -1, usClose = -1, blocks = 0;
  while ((m = re.exec(html)) !== null) {
    blocks++;
    if (m[1].includes('// ==UserScript==')) {
      if (usOpen >= 0) { console.error(`sync-test-pages: ${rel}: MULTIPLE userscript blocks (${blocks}) — fix by hand`); usOpen = -2; break; }
      usOpen = m.index + '<script>'.length;
      usClose = m.index + m[0].length - '</script>'.length;
    }
  }
  if (usOpen === -2) { failed = true; continue; }
  if (usOpen < 0) {
    console.error(`sync-test-pages: ${rel}: no <script> block carries // ==UserScript== — refusing to guess`);
    failed = true; continue;
  }

  let expected = html.slice(0, usOpen) + '\n' + script + '\n' + html.slice(usClose);
  if (path.basename(page) === 'preview.html') {
    const cut = expected.lastIndexOf('<script>', usOpen);
    if (cut < 0) { console.error(`sync-test-pages: ${rel}: no <script> before the userscript block`); failed = true; continue; }
    const withFixture = replaceBlock(expected, FIXTURE_START, FIXTURE_END, fixtureBlock(), cut);
    if (withFixture === null) { console.error(`sync-test-pages: ${rel}: mx-fixture:start without mx-fixture:end`); failed = true; continue; }
    expected = withFixture;
  }
  if (html === expected) {
    console.log(`OK  ${rel} (in sync)`);
    continue;
  }
  if (checkOnly) {
    console.error(`DRIFT ${rel} — inline userscript copy differs from murther.user.js`);
    failed = true;
    continue;
  }
  fs.writeFileSync(page, expected);
  console.log(`SYNCED ${rel}`);
}

process.exit(failed ? 1 : 0);
