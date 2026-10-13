import os,sys,time
from playwright.sync_api import sync_playwright
B=os.environ.get('BASE','http://localhost:8931'); GAMES=sys.argv[1:]
def log(*a): print(time.strftime('%H:%M:%S'),*a,flush=True)
res={}
with sync_playwright() as p:
    br=p.chromium.launch(); dev=p.devices['iPhone 13']; pages=[]
    for i in range(3):
        pg=br.new_context(**dev).new_page(); pg.on('pageerror',lambda e,i=i: log('PAGEERR',i,str(e)[:150])); pg.on('dialog',lambda d: d.accept()); pages.append(pg)
    H,G1,G2=pages
    def wait(fn,t):
        e=time.time()+t
        while time.time()<e:
            try:
                if fn(): return True
            except Exception: pass
            H.wait_for_timeout(500)
        return False
    for q in pages: q.goto(B+'/fuusan-games/'); q.evaluate("localStorage.setItem('flatCreaturesSave_v2', JSON.stringify({team:['pikotto','mekapiko','gigapikoron','tanepon','tsubomin','sorndra'],moves:{},abil:{},cleared:0,wins:0}))")
    H.goto(B+'/fuusan-games/'); H.fill('#prName','ホスト'); H.click('#prMake')
    wait(lambda: len(H.inner_text('#prCode'))==4,30); code=H.inner_text('#prCode')
    for g,n in ((G1,'ミカ'),(G2,'ケン')): g.goto(B+'/fuusan-games/?join='+code); g.fill('#prName',n); g.click('#prJoin')
    assert wait(lambda: H.locator('#prList .pm').count()==3,40); log('hub ok',code)
    first=True
    for game in GAMES:
        t0=time.time()
        if first: H.click('a[data-game="%s"]'%game); first=False
        else:
            if not wait(lambda: H.locator('#fuuPartyBtn').is_visible(),10): log(game,'BTN HIDDEN'); 
            H.click('#fuuPartyBtn')
            if not wait(lambda: H.locator('#fuuPartySheet').count()>0,3): H.click('#fuuPartyBtn')
            try: H.click('#fuuPartySheet [data-g="%s"]'%game, timeout=8000)
            except Exception as ex:
                H.screenshot(path='/workspace/rooms-work/test/fail_sheet.png'); log('SHEETFAIL', game, H.evaluate("document.querySelectorAll('#fuuPartySheet').length+' '+(document.getElementById('fuuPartyBtn')||{}).outerHTML")); res[game]=False; break
        ok=wait(lambda: all('/%s/'%game in q.url for q in pages),25)
        ok=ok and wait(lambda: H.evaluate("FuuParty.status && FuuParty.status().n")==2 and all(q.evaluate("FuuParty.status().joined") for q in (G1,G2)),60)
        res[game]=ok; log(game,'OK' if ok else 'FAIL','%.1fs'%(time.time()-t0))
        H.screenshot(path='/workspace/rooms-work/test/b_%s.png'%game)
        if not ok:
            for q in pages:
                try: log(' ',q.url[:70],q.evaluate(os.environ.get('DBG','1')),q.evaluate("JSON.stringify(window.FuuParty&&FuuParty.status&&FuuParty.status())"),(q.evaluate("(document.getElementById('connecting')||{}).innerText||''") or '')[:80].replace('\n',' '))
                except Exception as e: log(' err',e)
            break
    log('RESULT',res)
