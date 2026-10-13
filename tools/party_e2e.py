import time, sys
from playwright.sync_api import sync_playwright
B='http://localhost:8931'
def log(*a): print(time.strftime('%H:%M:%S'),*a,flush=True)
PUMP=[None]; ALL=[]
def wait(fn,t=60,msg=''):
    e=time.time()+t
    while time.time()<e:
        try:
            if fn(): return
        except Exception as ex: pass
        PUMP[0].wait_for_timeout(500)
    for q in ALL:
        try: print(q.url[:60], q.evaluate("JSON.stringify({r:window.__sk&&__sk.role(),seats:window.__sk&&__sk.hostRoom()&&__sk.hostRoom().seats.map(s=>[s.name,s.connected]),ct:(document.getElementById('connecting')||{}).innerText,toast:(document.getElementById('toast')||{}).innerText})"))
        except Exception as ex: print('evalerr',ex)
    raise SystemExit('TIMEOUT '+msg)
with sync_playwright() as p:
    br=p.chromium.launch()
    dev=p.devices['iPhone 13']
    pages=[]
    for i in range(3):
        c=br.new_context(**dev); pg=c.new_page()
        pg.on('pageerror',lambda e,i=i: log('ERR',i,e))
        pages.append(pg)
    H,G1,G2=pages
    PUMP[0]=H; ALL.extend(pages)
    H.goto(B+'/fuusan-games/'); H.fill('#prName','ホスト'); H.click('#prMake')
    wait(lambda: len(H.inner_text('#prCode'))==4,30,'hub code'); code=H.inner_text('#prCode'); log('hub room',code)
    for g,n in ((G1,'ミカ'),(G2,'ケン')):
        g.goto(B+'/fuusan-games/?join='+code); g.fill('#prName',n); g.click('#prJoin')
    wait(lambda: H.locator('#prList .pm').count()==3,40,'hub members'); log('hub members', H.inner_text('#prList'))
    wait(lambda: G2.locator('#prList .pm').count()==3,20,'guest sees members')
    t0=time.time()
    H.click('a[data-game="shitterukko"]')
    for pg in pages: wait(lambda pg=pg: '/shitterukko/' in pg.url,20,'nav shitterukko')
    wait(lambda: H.evaluate("__sk.hostRoom() && __sk.hostRoom().seats.filter(s=>s.connected!==false).length")==3,60,'sk seats')
    log('shitterukko: 3 seats, code',H.evaluate("__sk.hostRoom().code"),'%.1fs'%(time.time()-t0))
    assert H.evaluate("__sk.hostRoom().code")==code
    H.screenshot(path='/workspace/rooms-work/test/sk_host.png'); G1.screenshot(path='/workspace/rooms-work/test/sk_guest.png')
    assert G1.locator('#fuuPartyBtn').inner_text().startswith('🏠')
    # host: next game -> iranai-kuma
    t0=time.time()
    H.click('#fuuPartyBtn'); H.click('#fuuPartySheet [data-g="iranai-kuma"]')
    for pg in pages: wait(lambda pg=pg: '/iranai-kuma/' in pg.url,20,'nav iranai-kuma')
    wait(lambda: H.evaluate("__nt.hostRoom() && __nt.hostRoom().seats.length")==3,60,'nt seats')
    log('iranai-kuma: 3 seats','%.1fs'%(time.time()-t0), H.evaluate("__nt.hostRoom().seats.map(s=>s.name).join(',')"))
    # start a match, check button hidden while playing
    H.click('#startBtn'); H.wait_for_timeout(2000)
    log('during play host btn visible:', H.locator('#fuuPartyBtn').is_visible(), 'phase', H.evaluate('__nt.hostRoom().phase'))
    # abort to lobby via menu if exists, else force via room phase
    H.evaluate("(()=>{const R=__nt.hostRoom(); R.G.over=true})()"); H.wait_for_timeout(1200)
    t0=time.time()
    H.click('#fuuPartyBtn'); H.click('#fuuPartySheet [data-g="hentekko-paint"]')
    for pg in pages: wait(lambda pg=pg: '/hentekko-paint/' in pg.url,20,'nav hentekko')
    wait(lambda: H.locator('#lobList .seat').count()==3,60,'hp seats')
    log('hentekko: 3 seats','%.1fs'%(time.time()-t0), H.inner_text('#lobList').replace('\n',' '))
    wait(lambda: G2.locator('#lobList .seat').count()==3,20,'hp guest lobby')
    H.screenshot(path='/workspace/rooms-work/test/hp_host.png')
    # back to hub room
    H.click('#fuuPartyBtn'); H.click('#fuuPartySheet [data-g="fuusan-games"]')
    for pg in pages: wait(lambda pg=pg: '/fuusan-games/' in pg.url,20,'nav hub')
    wait(lambda: H.locator('#prList .pm').count()==3,60,'hub again')
    log('back in hub room', H.inner_text('#prCode'), H.inner_text('#prList').replace('\n',' '))
    H.screenshot(path='/workspace/rooms-work/test/hub_host.png')
    log('ALL OK')
    br.close()
