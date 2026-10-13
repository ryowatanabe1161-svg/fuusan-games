import sys,re,os
g=sys.argv[1]; os.chdir('/workspace/rooms-work/'+g)
net='net.js' if os.path.exists('net.js') else 'app.js'
gen='core.js' if os.path.exists('core.js') and 'function genCode' in open('core.js').read() else net
def sub(p,a,b,cnt=1,rx=False):
    h=open(p).read()
    n=len(re.findall(a,h)) if rx else h.count(a)
    if n<1: raise SystemExit('MISSING %s in %s: %r'%(g,p,a))
    h=re.sub(a,b,h,count=0 if cnt==0 else 1) if rx else h.replace(a,b) if cnt==0 else h.replace(a,b,1)
    open(p,'w').write(h)
before='core.js' if net=='net.js' else 'app.js'
sub('index.html','<script src="%s"></script>'%before,'<script src="../fuusan-games/party.js"></script>\n<script src="%s"></script>'%before)
sub(gen,r'(\n[ \t]*)function genCode\(\) \{',r'\1var PARTY = window.FuuParty && window.FuuParty.info;   // ひろばの「みんなの部屋」から来たとき\1function genCode() { if (PARTY && PARTY.host) return PARTY.code;',rx=True)
try: sub(net,'&& !host.resuming)','&& !host.resuming && !PARTY)',cnt=0)
except SystemExit as e: print('warn',e)
sub(net,r"if \(e\.type === 'peer-unavailable'\) \{",r"if (e.type === 'peer-unavailable') { if (PARTY && !client.everJoined && (client.ptries = (client.ptries || 0) + 1) < FuuParty.retries) { connecting(true, 'ホストを待っています…', '部屋 ' + client.code); setTimeout(clientConnect, FuuParty.retryMs); return; }",rx=True)
sub(net,"else if (m.t === 'state')","else if (m.t === 'fuu-goto') { if (PARTY) { try { sstore(SS_CLIENT, null); } catch (e) {} FuuParty.handle(m); } } else if (m.t === 'state')")
W="if (PARTY) client.watch = setInterval(function () { if (!client) return; if (client.everJoined) { clearInterval(client.watch); return; } if (client.peer.open && !(client.conn && client.conn.open)) clientConnect(); }, FuuParty.watchMs);   // みんなの部屋：ホストより先に着いたときの取りこぼし対策"
sub(net,r"(client\.peer = peer;)",r"\1 "+W.replace('\\','\\\\'),rx=True)
h=open('app.js').read()
three='solo' in open([f for f in ('host.js','app.js') if os.path.exists(f) and 'function startHost' in open(f).read()][0]).read().split('function startHost')[1][:40]
INT='''
// ---- ひろばの「みんなの部屋」：同じメンバーで自動入室＋ホストは「つぎのゲーム」 ----
if (PARTY) {
  FuuParty.init({ game: '%s',
    isHost: function () { return !!host && !host.room.solo; },
    inGame: function () { var R = host && host.room; return !!R && ['lobby', 'end', 'over', 'result'].indexOf(R.phase) < 0 && !(R.G && (R.G.over || R.G.phase === 'end' || R.G.phase === 'over')); },
    broadcast: function (m) { if (host) Object.keys(host.conns).forEach(function (cid) { try { host.conns[cid].send(m); } catch (e) {} }); } });
  FuuParty.status = function () { return host ? { host: 1, n: Object.keys(host.conns).filter(function (k) { return host.conns[k].open; }).length } : { host: 0, joined: !!(client && client.everJoined) }; };
  $('nameIn').value = cleanName(PARTY.name) || 'ななし';
  setTimeout(function () {
    if (PARTY.host) { try { store(LS_HOST, null); } catch (e) {} startHost(cleanName(PARTY.name) || 'ホスト', null%s); }
    else startClient(PARTY.code, cleanName(PARTY.name) || 'ななし');
  }, 50);
}
'''%(g, ', false' if three else '')
if h.rstrip().endswith('})();'):
    i=h.rstrip().rfind('})();'); h=h[:i]+INT.replace('\n','\n  ').rstrip()+'\n'+h[i:]
else: h+=INT
open('app.js','w').write(h)
print('patched',g,net,gen,'3arg' if three else '2arg')
