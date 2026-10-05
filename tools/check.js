// node tools/check.js [portalURL] — loads portal at 390x844, checks cards/links/manifest/icons/SW, takes screenshot
const { chromium } = require('/workspace/geschenk/test/node_modules/playwright-core');
const URL0 = process.argv[2] || 'http://localhost:8790/fuusan-games/';
const LIVE = /github\.io/.test(URL0);
function check(c, m) { if (!c) throw new Error('FAIL: ' + m); console.log('✓', m); }
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await ctx.newPage(), errors = [];
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await p.goto(URL0); await p.waitForSelector('.card');
  const cards = await p.$$eval('.card', as => as.map(a => ({ href: a.href, t: a.querySelector('.ttl').textContent })));
  check(cards.length === 8, '8 game cards: ' + cards.map(c => c.t.slice(0, 10)).join(' / '));
  if (LIVE) for (const c of cards) { const r = await p.request.get(c.href); check(r.status() === 200, '200 ' + c.href); }
  const man = await (await p.request.get(new URL('manifest.json', URL0).href)).json();
  check(man.short_name === 'ふーさんゲーム' && man.display === 'standalone' && man.scope === '/fuusan-games/' && man.start_url.startsWith('/fuusan-games/'), 'manifest fields ok');
  for (const ic of man.icons.concat([{ src: 'icons/apple-touch-icon.png', sizes: '180x180' }])) {
    const r = await p.request.get(new URL(ic.src, URL0).href), buf = await r.body();
    const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
    check(r.status() === 200 && buf.slice(1, 4).toString() === 'PNG' && ic.sizes === w + 'x' + h, 'icon ' + ic.src + ' ' + w + 'x' + h);
  }
  const sw = await p.evaluate(async () => { const r = await navigator.serviceWorker.ready; return { scope: r.scope, state: r.active && r.active.state }; });
  check(/\/fuusan-games\/$/.test(sw.scope) && sw.state, 'service worker active, scope ' + sw.scope);
  const cached = await p.evaluate(async () => (await (await caches.open('fuusan-portal-v2')).keys()).map(r => new URL(r.url).pathname));
  check(cached.length >= 8 && cached.every(u => u.startsWith('/fuusan-games/')), 'SW cached portal shell only (' + cached.length + ' files)');
  // CDP manifest parse (installability)
  const cdp = await ctx.newCDPSession(p); const am = await cdp.send('Page.getAppManifest');
  check(!am.errors.length, 'Chrome manifest parse: no errors');
  try { const ie = await cdp.send('Page.getInstallabilityErrors'); console.log('  installability errors:', JSON.stringify(ie.installabilityErrors.map(e => e.errorId))); } catch (e) {}
  await p.screenshot({ path: '/workspace/fuusan-portal/screenshots/portal' + (LIVE ? '' : '_local') + '.png' });
  await p.$eval('.card[data-game="hitokoto-hint"]', el => el.scrollIntoView({ block: 'center' })); await p.waitForTimeout(300);
  await p.screenshot({ path: '/workspace/fuusan-portal/screenshots/portal_8' + (LIVE ? '' : '_local') + '.png' }); await p.evaluate(() => window.scrollTo(0, 0));
  await p.tap('.chip[data-f="loc"]'); check((await p.$$('.card')).length === 1, 'filter 1台でも → 1 card');
  await p.tap('.chip[data-f="all"]');
  // offline: shell served from SW
  await p.reload(); await ctx.setOffline(true); await p.reload(); check((await p.$$('.card')).length === 8, 'portal loads offline from SW cache'); await ctx.setOffline(false);
  // tapping a card opens the game in same tab; game page NOT controlled by portal SW
  const portalErrors = errors.slice();
  await p.tap('.card[data-game="moribiraki"]'); await p.waitForURL(/moribiraki/);
  if (LIVE) { await p.waitForLoadState('load'); check(!(await p.evaluate(() => navigator.serviceWorker.controller)), 'game page (moribiraki) not controlled by portal SW'); }
  check(portalErrors.length === 0, 'no JS errors on portal' + (portalErrors.length ? ': ' + portalErrors.join(' / ') : ''));
  if (LIVE) check(errors.length === 0, 'no JS errors after opening a game');
  console.log('\nPORTAL CHECK PASSED'); await b.close();
})().catch(e => { console.error(e.message); process.exit(1); });
