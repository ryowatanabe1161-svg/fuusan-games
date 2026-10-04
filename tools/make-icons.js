// node tools/make-icons.js — render the bear SVG to PNG icons with Chrome
const { chromium } = require('/workspace/geschenk/test/node_modules/playwright-core');
const fs = require('fs'), svg = fs.readFileSync(__dirname + '/bear.svg', 'utf8');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const out = [['icon-192.png', 192, 1], ['icon-512.png', 512, 1], ['apple-touch-icon.png', 180, 1], ['icon-maskable-512.png', 512, 0.78], ['favicon-32.png', 32, 1.08]];
  for (const [name, size, sc] of out) {
    const p = await b.newPage({ viewport: { width: size, height: size } });
    await p.setContent('<style>html,body{margin:0}svg{display:block;width:' + size + 'px;height:' + size + 'px}</style>' + svg.replace('SCALE', sc));
    await p.screenshot({ path: __dirname + '/../icons/' + name, omitBackground: false });
    await p.close();
  }
  await b.close(); console.log('icons done');
})();
