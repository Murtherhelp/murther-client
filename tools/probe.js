/* Scratch probe: find needle contexts in the saved game build.
 * Usage: node tools/probe.js <fileOrAll> <needle1> [needle2...] [--before=N] [--after=N] [--max=N]
 */
const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);
let before = 500, after = 500, max = 6;
const pos = [];
for (const a of args) {
  if (a.startsWith('--before=')) before = +a.slice(9);
  else if (a.startsWith('--after=')) after = +a.slice(8);
  else if (a.startsWith('--max=')) max = +a.slice(6);
  else pos.push(a);
}
const [file, ...needles] = pos;
const dir = path.join(__dirname, '..', 'Game Files');
const files = file === 'all'
  ? fs.readdirSync(dir).filter(f => f.endsWith('.js') || f.endsWith('.css') || f.endsWith('.html'))
  : [file];
for (const f of files) {
  const s = fs.readFileSync(path.join(dir, f), 'utf8');
  for (const n of needles) {
    let i = -1, c = 0;
    while ((i = s.indexOf(n, i + 1)) !== -1 && c < max) {
      console.log(`=== ${f} :: ${n} @${i} ===`);
      console.log(s.slice(Math.max(0, i - before), i + after).replace(/\n/g, ' '));
      console.log('');
      c++;
    }
    if (c === 0) console.log(`--- ${f} :: ${n} :: NOT FOUND`);
  }
}
