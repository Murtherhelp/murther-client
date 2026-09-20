# Murther — how to preview

Standalone static HTML. No dev server, no dependencies, no build step required to run.

## Reproduce the preview artifact
`test/preview.html` is generated: it is `test/harness.html` with the contents of
`murther.user.js` inlined in place of the
`<script src="../murther.user.js"></script>` tag (needed because the Preview tab
serves a single self-contained file).

Rebuild it after any change to the userscript or harness (run from repo root):

    cd test && python -c "userscript = open('../murther.user.js', encoding='utf-8').read(); harness = open('harness.html', encoding='utf-8').read(); tag = '<script src=\"../murther.user.js\"></script>'; open('preview.html', 'w', encoding='utf-8').write(harness.replace(tag, '<script>\n' + userscript + '\n</script>'))"

Syntax-check the userscript first: `node --check murther.user.js`.

## Run
No server needed. Preview is registered with `htmlPath` pointing at
`test/preview.html` (absolute: `C:\Users\Miyabo\Documents\MurtherClient\test\preview.html`).

The live-site flow for real use remains: install `murther.user.js` in Tampermonkey
and open `https://play.gota.io/`.
