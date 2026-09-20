'use strict';
/* v1.52.1: the two defects the live check found — Themes rows were never carded (they anchor
 * on the SECTION, not on .mx-tsec-body) and a zero-height drop target flipped the drop side. */
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'murther.user.js');
let src = fs.readFileSync(FILE, 'utf8');
const applied = [];
function sub(label, anchor, replacement) {
  const n = src.split(anchor).length - 1;
  if (n !== 1) throw new Error('[' + label + '] anchor matched ' + n + ' times (need exactly 1)');
  src = src.replace(anchor, replacement);
  applied.push(label);
}

sub('version', '// @version      1.52.0', '// @version      1.52.1');

sub('history',
`// remembered open/closed state reset whenever the game's bind list changed.
//
// ---------------------------------------------------------------------------`,
`// remembered open/closed state reset whenever the game's bind list changed.
//
// v1.52.1: two defects the live check caught before they shipped. The cards were scoped to a
// section's BODY, which is where Settings and Hotkeys anchor their rows — but Themes anchors its
// rows on the SECTION itself (.mx-tsec > .mx-trow), so every Themes row silently kept the old
// flat look, which was the pane the pass was for. Both parents are covered now, and the note
// cards' own .mx-set-row action strips stay uncarded on purpose: a card inside a card is not a
// feature. And a drag target with NO layout box (a 0x0 rect, which a synthesized or mid-rebuild
// drop can produce) made the midpoint test read "after" for every pointer position, so a move
// could land on the wrong side of a category the pointer never passed; no box now means no guess
// — the drop stays before the target. __mxMenuCheck() is the fixture that found both, and it is
// corrected too: the card assertion compares the accent against the row's own other borders
// (the shell carries zoom: 0.94, so a literal "2px" reads as 1.06px and a literal assertion is a
// false negative), the description is read from the search bar's OWN parent with the lookup
// scoped to the pane that is not .mx-hidden (Hotkeys and Themes wrap their categories in
// .mx-theme-body, so "is the intro above the bar" cannot be answered from the section's parent),
// the note-card probe looks where that card actually lives (it is not in Settings) and reports
// skipped rather than passing vacuously, its restore reorders sections PAIRWISE among themselves
// so a non-section sibling can never be displaced (the old fixed-slot restore wedged the intro
// and the search box into the middle of the category list), and its drag waits for real layout
// and computes the midpoint from the target's live rect.
//
// ---------------------------------------------------------------------------`);

sub('css-cards',
`    /* v1.52.0: every feature row is a CARD. Scoped to a section's own body on purpose: the note
     * cards (Key health, WS hook) and the pane descriptions hold .mx-set-row children of their
     * own, and those are already a surface — a card inside a card is not a feature. */
    '.mx-tsec-body > .mx-set-row,.mx-tsec-body > .mx-kb,.mx-tsec-body > .mx-trow{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);border-left:2px solid var(--mx-feature-color,var(--mx-accent));border-radius:8px;padding:8px 10px;margin:0 0 6px;transition:background .15s,border-color .15s}',
    '.mx-tsec-body > .mx-set-row:hover,.mx-tsec-body > .mx-kb:hover,.mx-tsec-body > .mx-trow:hover{background:rgba(255,255,255,.06)}',
    '.mx-tsec-body > *:last-child{margin-bottom:0}',`,
`    /* v1.52.0: every feature row is a CARD — a dark surface, a hairline border and the
     * category's own colour as a 2px left accent. Scoped to a section's own children on
     * purpose: the note cards (Key health, WS hook) and the pane descriptions hold .mx-set-row
     * children of their own, and those are already a surface — a card inside a card is not a
     * feature. v1.52.1: BOTH parents are needed. Settings and Hotkeys anchor their rows on
     * .mx-tsec-body, Themes anchors its .mx-trow rows on the SECTION itself, and a rule that
     * only knew the first shape left the entire Themes pane flat. */
    '.mx-tsec-body > .mx-set-row,.mx-tsec-body > .mx-kb,.mx-tsec-body > .mx-trow,.mx-tsec > .mx-set-row,.mx-tsec > .mx-kb,.mx-tsec > .mx-trow{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);border-left:2px solid var(--mx-feature-color,var(--mx-accent));border-radius:8px;padding:8px 10px;margin:0 0 6px;transition:background .15s,border-color .15s}',
    '.mx-tsec-body > .mx-set-row:hover,.mx-tsec-body > .mx-kb:hover,.mx-tsec-body > .mx-trow:hover,.mx-tsec > .mx-set-row:hover,.mx-tsec > .mx-kb:hover,.mx-tsec > .mx-trow:hover{background:rgba(255,255,255,.06)}',
    '.mx-tsec-body > *:last-child,.mx-tsec > *:last-child{margin-bottom:0}',`);

sub('drag-guard',
`      var r = sec.getBoundingClientRect();
      var after = (e.clientY - r.top) > (r.height / 2);`,
`      var r = sec.getBoundingClientRect();
      /* v1.52.1: a target with NO layout box (0x0) makes the midpoint test read "after" for
       * every pointer position, so a move could land on the wrong side of a category the
       * pointer never passed. No box, no guess: the drop stays before the target. */
      var after = r.height > 0 && (e.clientY - r.top) > (r.height / 2);`);

fs.writeFileSync(FILE, src);
console.log('applied ' + applied.length + ' edits:\n  ' + applied.join('\n  '));
