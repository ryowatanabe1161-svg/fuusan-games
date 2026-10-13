/* ひろばの「みんなの部屋」：ここで集まって、ホストがゲームを選ぶと全員でそのゲームへ */
(function () {
  'use strict';
  var P = window.FuuParty, $ = function (id) { return document.getElementById(id); };
  var PREFIX = 'fuuhub-v1-', CH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var Q = new URLSearchParams(location.search);
  var ICE = Q.get('ice') ? Q.get('ice').split(',').map(function (u) { return { urls: u }; }) : [{ urls: 'stun:stun.l.google.com:19302' }];
  var OPTS = { debug: 1, config: { iceServers: ICE } };
  var peer = null, conns = [], hostConn = null, members = [], me = null, tries = 0;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function gen() { var s = ''; for (var i = 0; i < 4; i++) s += CH[Math.floor(Math.random() * CH.length)]; return s; }
  function nameOf() { var n = $('prName').value.trim().slice(0, 8); if (!n) { alert('ニックネームを入れてね'); return null; } try { localStorage.setItem('fuu-name', n); } catch (e) {} return n; }
  function status(t) { $('prStatus').textContent = t || ''; }
  function render() {
    var on = !!me;
    $('prForm').style.display = on ? 'none' : '';
    $('prIn').style.display = on ? '' : 'none';
    document.body.classList.toggle('in-party', on);
    if (!on) return;
    $('prCode').textContent = me.code;
    $('prList').innerHTML = members.map(function (m) { return '<span class="pm">' + (m.host ? '👑' : '🙂') + esc(m.name) + '</span>'; }).join('');
    $('prHint').textContent = me.host ? '下の明るいカード（対応ゲーム）をタップすると、全員でそのゲームに移ります' : 'ホストがゲームを選ぶと自動で移動します';
  }
  function hostBroadcast() { members = [{ name: me.name, host: true }].concat(conns.filter(function (c) { return c.pname; }).map(function (c) { return { name: c.pname }; })); render(); conns.forEach(function (c) { try { c.send({ t: 'members', list: members }); } catch (e) {} }); }
  function openHost(inf) {
    me = inf; render(); status('部屋を開いています…');
    peer = new Peer(PREFIX + inf.code, OPTS);
    peer.on('open', function () { status(''); tries = 0; P.go && hostBroadcast(); });
    peer.on('connection', function (c) {
      c.on('data', function (m) { if (m && m.t === 'hello') { c.pname = String(m.name || 'ななし').slice(0, 8); conns.push(c); hostBroadcast(); } });
      c.on('close', function () { conns = conns.filter(function (x) { return x !== c; }); hostBroadcast(); });
    });
    peer.on('error', function (e) {
      if (e.type === 'unavailable-id' && ++tries < 25) { try { peer.destroy(); } catch (x) {} status('部屋を開きなおしています…（' + tries + '）'); setTimeout(function () { openHost(inf); }, 2500); }
      else if (e.type !== 'peer-unavailable') status('通信エラー：' + e.type);
    });
  }
  function openGuest(inf) {
    me = inf; render(); status('部屋 ' + inf.code + ' につないでいます…');
    peer = new Peer(OPTS);
    function connect() {
      hostConn = peer.connect(PREFIX + inf.code, { reliable: true });
      hostConn.on('open', function () { tries = 0; status(''); hostConn.send({ t: 'hello', name: inf.name }); });
      hostConn.on('data', function (m) { if (!m) return; if (m.t === 'members') { members = m.list; render(); } else if (m.t === 'fuu-goto' && /^[a-z0-9-]+$/.test(m.game)) setTimeout(function () { P.go(m.game, me); }, P.guestDelay); });
      hostConn.on('close', function () { status('ホストとの接続が切れました。再接続中…'); setTimeout(connect, 2000); });
    }
    peer.on('open', connect);
    peer.on('error', function (e) {
      if (e.type === 'peer-unavailable') { if (++tries < 40) { status('ホストを待っています…'); setTimeout(connect, 1500); } else status('部屋が見つかりません'); }
      else status('通信エラー：' + e.type);
    });
  }
  function leave() { P.leave(); try { if (peer) peer.destroy(); } catch (e) {} location.href = location.pathname; }
  $('prName').value = (P.info && P.info.name) || localStorage.getItem('fuu-name') || '';
  $('prMake').onclick = function () { var n = nameOf(); if (n) openHost({ code: gen(), name: n, host: true }); };
  $('prJoin').onclick = function () { var n = nameOf(); if (!n) return; var c = P.norm($('prCodeIn').value); if (c.length !== 4) return alert('4文字の部屋コードを入れてね'); openGuest({ code: c, name: n, host: false }); };
  $('prLeave').onclick = leave;
  $('prShare').onclick = function () {
    var u = location.origin + location.pathname + '?join=' + me.code;
    if (navigator.share) navigator.share({ title: 'ふーさんのゲームひろば', text: 'みんなの部屋 ' + me.code + ' に来てね', url: u }).catch(function () {});
    else (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(function () { alert('コピーしました'); }, function () { prompt('このリンクを送ってね', u); });
  };
  if (Q.get('join')) { $('prCodeIn').value = P.norm(Q.get('join')); $('prBox').scrollIntoView(); }
  // ゲームのカードを押したとき：部屋にいるなら全員で移動
  $('grid').addEventListener('click', function (e) {
    var a = e.target.closest('a[data-game]'); if (!a || !me) return;
    e.preventDefault();
    var g = a.dataset.game;
    if (!me.host) return alert('ゲームはホストが選びます');
    if (P.ready.indexOf(g) < 0) return alert('このゲームはまだ「みんなの部屋」に対応していません（準備中）');
    P.next(g);
  }, true);
  P.init({ game: P.hub, isHost: function () { return false; }, broadcast: function () {} });
  // ひろばでは右下ボタンは不要（部屋パネルがある）
  var b = document.getElementById('fuuPartyBtn'); if (b) b.remove();
  P.init = function () {};
  var origNext = P.next;
  P.next = function (g) { conns.forEach(function (c) { try { c.send({ t: 'fuu-goto', game: g }); } catch (e) {} }); setTimeout(function () { P.go(g, me); }, 900); };
  P.status = function () { return me && me.host ? { host: 1, n: conns.filter(function (c) { return c.open && c.pname; }).length } : { host: 0, joined: !!(hostConn && hostConn.open) }; };
  if (P.info) (P.info.host ? openHost : openGuest)(P.info);
})();
