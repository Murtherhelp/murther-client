const fs = require('fs');
const EM = String.fromCharCode(8212);
const RS = String.fromCharCode(8217);
const AR = String.fromCharCode(8594);
const F = 'murther.user.js';
let t = fs.readFileSync(F, 'utf8');
let n = 0;
function rep(oldS, newS, label) {
  if (!t.includes(oldS)) { console.error('MISS: ' + label); process.exitCode = 1; return; }
  t = t.split(oldS).join(newS); n++; console.log('OK: ' + label);
}
function cut(startMark, endMark, newS, label) {
  const a = t.indexOf(startMark);
  if (a < 0) { console.error('CUT-MISS(start): ' + label); process.exitCode = 1; return; }
  const b = t.indexOf(endMark, a);
  if (b < 0) { console.error('CUT-MISS(end): ' + label); process.exitCode = 1; return; }
  t = t.slice(0, a) + newS + t.slice(b + endMark.length);
  n++; console.log('OK: ' + label);
}
module.exports = { get t() { return t; }, set t(v) { t = v; }, rep, cut, bump: () => n++, saveNow: () => { fs.writeFileSync(F, t); } };
