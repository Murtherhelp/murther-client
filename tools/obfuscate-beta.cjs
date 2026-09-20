#!/usr/bin/env node
// Obfuscate Murther Beta userscript with the recommended conservative preset:
// identifier renaming + string array (base64) only. No CFF, no dead code,
// no self-defending, no debug protection — keeps Tampermonkey stable + fast.
const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'Murther Beta Version', 'murther.user.beta.js');
const OUT = path.join(ROOT, 'Murther Beta Version', 'murther.user.beta.obfuscated.js');

const OPTIONS = {
  compact: true,
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false,
  // BETA GATE (OPAQUE TO OBFUSCATORS): the access-gate vars must survive as
  // plain names + plain strings at top scope. The gate's "not configured"
  // branch keys off BETA_HASHES.length / BETA_SALT / BETA_AUTH_URL, so if the
  // string array swallows their values the published build locks everyone out.
  reservedNames: [
    '^BETA_SALT$', '^BETA_HASHES$', '^BETA_AUTH_URL$',
    '^BETA_AUTH_TIMEOUT_MS$', '^BETA_MAX_ATTEMPTS$', '^BETA_COOLDOWN_MS$',
    '^mxBeta.*',
  ],
  reservedStrings: [
    '315672eab78c24b901a19c019cc126b021ddf89600194d01fcf92a6d3863dc86',
    '292d45747e9e64226f49e5646fb9a65bc638a91c83e87fd14f1a6e1ab5bfb82e',
    'murther-beta\\/main\\/beta_auth\\.json',
  ],
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.75,
  rotateStringArray: true,
  shuffleStringArray: true,
  splitStrings: false,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  debugProtection: false,
  disableConsoleOutput: true,
  selfDefending: false,
  transformObjectKeys: false,
  numbersToExpressions: false,
  simplify: true,
  sourceMap: false,
  target: 'browser',
};

function splitHeader(src) {
  const endMarker = '==/UserScript==';
  const idx = src.indexOf(endMarker);
  if (idx === -1) throw new Error('userscript header end marker not found');
  const lineEnd = src.indexOf('\n', idx);
  const header = src.slice(0, lineEnd + 1);
  const body = src.slice(lineEnd + 1);
  return { header, body };
}

function main() {
  const raw = fs.readFileSync(SRC, 'utf8');
  const { header, body } = splitHeader(raw);
  // Tampermonkey lists scripts by @name: tag the published build so the
  // source (local-only) and the obfuscated build are distinguishable.
  // Source header is never touched — this patch applies to the output only.
  const outHeader = header.replace(
    /\/\/ @name([ \t]+)(.*)/,
    (m, ws, name) => (/obfusc/i.test(name) ? m : `// @name${ws}${name.trimEnd()} (Obfuscated)`)
  );
  console.log(`[obf] src: ${SRC} (${(raw.length / 1024).toFixed(1)} KB, ${(raw.split('\n').length)} lines)`);
  console.log('[obf] header preserved verbatim, obfuscating body only…');
  const t0 = Date.now();
  const result = JavaScriptObfuscator.obfuscate(body, OPTIONS);
  const obfuscated = result.getObfuscatedCode();
  const out = outHeader + obfuscated + '\n';
  fs.writeFileSync(OUT, out, 'utf8');
  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`[obf] wrote: ${OUT} (${(out.length / 1024).toFixed(1)} KB) in ${dt}s`);
  console.log('[obf] preset: hex ids + stringArray/base64@0.75 + rotate, CFF/deadCode/selfDefend/debugProt OFF');
}

main();
