const h = require('./mx-patch-helpers.js');
// 8a: tracer rows removed from featureDefs (Show Tracer Lines .. Tracer Thickness)
h.cut("      tg('cells', 'tracers', 'Show Tracer Lines', 'Draw lines from your cell toward other cells', function () { return th.tracers; }, function (v) { th.tracers = v; }),\n",
"      sl('cells', 'tracerThickness', 'Tracer Thickness', 'Width of the tracer lines, in pixels', function () { return th.tracerThickness / 10; }, function (v) { th.tracerThickness = Math.round(v * 10); }, function () { return th.tracerThickness; })\n",
"      // v1.28.0: tracer rows removed from Themes (feature retired)\n",
  '8a tracer rows removed');
// 8b: draw call removed
h.cut("    if (t.tracers) drawTracers(x, w, h, t);\n", "    if (t.tracers) drawTracers(x, w, h, t);\n", '', '8b tracer draw call removed');
// 8c: dead function removed
const a = h.t.indexOf('  function drawTracers(');
if (a < 0) { console.error('MISS: 8c drawTracers fn'); process.exitCode = 1; }
else {
  const e2 = h.t.indexOf('\n  }\n', a);
  if (e2 < 0) { console.error('MISS: 8c end'); process.exitCode = 1; }
  else {
    h.t = h.t.slice(0, a) + '  // v1.28.0: drawTracers removed (feature retired)\n' + h.t.slice(e2 + 5);
    console.log('OK: 8c drawTracers fn removed');
  }
}
// 8d: the world-theme "live" flag must not reference t.tracers any more
h.rep("    var live = (on && (bgPaint > 0 || t.tracers)) || pastelLive;",
"    var live = (on && bgPaint > 0) || pastelLive;   // v1.28.0: tracers retired",
  '8d live flag cleaned');
// 9a: hotkeys reset button removed
h.cut("    var reset = el('button', 'mx-mini', host);\n    reset.style.marginTop = '8px';\n    txt(reset, 'Reset keybinds');\n",
"      toast('Keybinds reset');\n    });\n",
'',
  '9a hotkeys reset removed');
// 9b: themes reset button removed
h.cut("    var trs = el('button', 'mx-mini mx-bk-reset', tact); txt(trs, 'Reset theme');\n    on(trs, 'click', function () { resetThemeSettings(); });\n",
"    on(trs, 'click', function () { resetThemeSettings(); });\n",
'',
  '9b themes reset removed');
// 10: version
h.rep('// @version      1.27.0', '// @version      1.28.0', '10 version');
h.saveNow();
console.log('P5 SAVED');
