/* Find where the game USES the stats templates k074..k083 (usage = ["k080"] bracket access)
 * and where the score panel is built/updated. */
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'Game Files');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
const needles = ['["k080"]', '["k081"]', '["k074"]', '["k077"]', '["k078"]', '["k082"]', '["k083"]'];
for (const f of files) {
  const s = fs.readFileSync(path.join(dir, f), 'utf8');
  for (const n of needles) {
    let i = -1, c = 0;
    while ((i = s.indexOf(n, i + 1)) !== -1 && c < 4) {
      console.log(`=== ${f} :: ${n} @${i} ===`);
      console.log(s.slice(Math.max(0, i - 900), i + 900).replace(/\n/g, ' '));
      console.log('');
      c++;
    }
  }
}
console.log('done');
