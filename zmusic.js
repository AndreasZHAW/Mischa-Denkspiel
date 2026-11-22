/* ═══ ZBgm (v790): 🎵 Hintergrundmusik – 4 Lieder im Wechsel, startet von selbst, Lautstärke/Aus im Sound-Menü ═══ */
(function(){
  'use strict';
  if(window.ZBgm) return;
  const TR=[['m1.mp3','Piano','Leberch'],['m2.mp3','Travel Piano','Leberch'],['m3.mp3','Sad','Leberch'],['m4.mp3','Background Music','Sub_Clair'],['mischa_intro.mp3','Unser Zoo-Lied','Mischa Zoo'],['sounds/intro.mp3','Kino-Thema','Mischa Zoo'],['zimmer.mp3','Epische Weite (Filmmusik-Stil)','Mischa Zoo']];
  const ls=(k,d)=>{ try{ const v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } };
  const lsw=(k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} };
  const pk=k=>{ try{ return k+'_'+(((typeof ZS!=='undefined'&&ZS.player)||'')+'').toLowerCase(); }catch(e){ return k; } };
  const M=window.ZBgm={on:ls('zmusic_on',true),vol:ls('zmusic_vol',.35),i:ls('zmusic_i',-1),loop:false,playing:false,_pp:null};
  // v878: Lied-Wahl + Endlosschleife gelten je Spieler
  M.prefs=function(){ const p=pk('zmusic_pref'); if(M._pp===p) return; M._pp=p; const v=ls(p,null); if(v){ M.loop=!!v.loop; if(typeof v.i==='number'&&v.i>=0&&v.i<TR.length) M.i=v.i; } else M.loop=false; try{ au.loop=M.loop; }catch(e){} };
  M.savePrefs=function(){ lsw(pk('zmusic_pref'),{loop:M.loop,i:M.i}); };
  const BASE=(()=>{ try{ const c=document.currentScript&&document.currentScript.src; return c?c.replace(/[^\/]*$/,''):''; }catch(e){ return ''; } })();
  M.status='Wartet auf deine erste Berührung …';
  const au=new Audio(); au.preload='none'; au.loop=false; M.au=au;
  const night=()=>{ try{ if(window.ZDevice&&!ZDevice.s.night) return 1; const h=new Date().getHours(); return (h>=22||h<7)?.6:1; }catch(e){ return 1; } };
  const muted=()=>false; // v801: Spiel-Sounds sind immer aus, die Musik hat ihren eigenen Schalter
  const apply=()=>{ au.volume=Math.max(0,Math.min(1,M.vol*night())); };
  const src=i=>BASE+(TR[i][0].indexOf('/')>=0||TR[i][0]==='mischa_intro.mp3'?'':'music/')+TR[i][0];
  M.play=function(i){ M.prefs(); M.on=true; lsw('zmusic_on',true); M.i=i; lsw('zmusic_i',i); M.savePrefs(); au.loop=M.loop; load(true); };
  M.setLoop=function(v){ M.loop=!!v; au.loop=M.loop; M.savePrefs(); };
  M.next=function(userSkip){ M.i=(M.i+1+TR.length)%TR.length; lsw('zmusic_i',M.i); load(true); };
  function load(play){ try{ M.prefs(); au.loop=M.loop; au.src=src(M.i); apply(); if(play&&M.on&&!muted()&&!document.hidden&&!M._ev&&!M._adm){ const p=au.play(); if(p&&p.then) p.then(()=>{ M.playing=true; M.status='Läuft'; fade(); }).catch(e=>{ M.playing=false; M.status='Wartet auf deine erste Berührung …'; }); } }catch(e){} }
  function fade(){ const t=M.vol*night(); au.volume=0; let k=0; const iv=setInterval(()=>{ k++; au.volume=Math.min(1,t*k/15); if(k>=15){ clearInterval(iv); apply(); } },100); }
  M.start=function(){ M.prefs(); if(M._ev||M._adm) return; if(!M.on||muted()) return; if(M.i<0){ M.i=Math.floor(Math.random()*TR.length); lsw('zmusic_i',M.i); } if(!au.src||au.src.indexOf(TR[M.i][0])<0) load(false); apply(); if(au.paused){ const p=au.play(); if(p&&p.then) p.then(()=>{ M.playing=true; M.status='Läuft'; fade(); stopSynth(); done(); }).catch(e=>{ M.playing=false; M.status=(e&&e.name==='NotAllowedError')?'Wartet auf deine erste Berührung …':'Fehler: '+(e&&e.name||'?'); }); } };
  M.stop=function(){ try{ au.pause(); }catch(e){} M.playing=false; };
  M.setOn=function(v){ M.on=!!v; lsw('zmusic_on',M.on); if(M.on) M.start(); else M.stop(); };
  M.setVol=function(v){ M.vol=Math.max(0,Math.min(1,+v)); lsw('zmusic_vol',M.vol); apply(); if(M.vol>0&&M.on&&au.paused) M.start(); };
  M.test=function(){ M.setOn(true); M.start(); };
  au.addEventListener('ended',()=>{ if(M.loop){ try{ au.currentTime=0; au.play(); }catch(e){} } else M.next(); });
  let errN=0; au.addEventListener('error',()=>{ errN++; M.playing=false; M.status='Fehler: Datei nicht gefunden ('+TR[M.i][0]+'). Ist der Ordner „music“ mit hochgeladen?'; if(errN===1){ try{ ZP.toast('🎵 Musik-Datei nicht gefunden – Ordner „music“ hochladen!',6000); }catch(e){} } if(errN<8) setTimeout(()=>{ if(M.on) M.next(); },3000); });
  au.addEventListener('playing',()=>{ errN=0; M.playing=true; M.status='Läuft'; });
  // Start nach erster Berührung (Browser erlauben sonst keinen Ton)
  const EV=['pointerdown','pointerup','click','keydown','touchstart','touchend'];
  const unlock=()=>{ if(M.playing) return; M.start(); };
  const done=()=>{ EV.forEach(e=>removeEventListener(e,unlock,true)); };
  EV.forEach(e=>addEventListener(e,unlock,true));
  // Im Hintergrund pausieren
  document.addEventListener('visibilitychange',()=>{ if(document.hidden){ if(!au.paused){ au.pause(); M._wasP=true; } } else if(M._wasP){ M._wasP=false; M.start(); } });
  // Stumm-Stellung des Sound-Menüs gilt auch für die Musik
  setInterval(()=>{ try{ if(muted()&&!au.paused) au.pause(); else if(!muted()&&M.on&&au.paused&&!document.hidden&&M.playing===false&&au.src&&M._wasMuted){ M.start(); } M._wasMuted=muted(); apply(); stopSynth(); }catch(e){} },2000);
  function stopSynth(){ try{ if(!au.paused&&typeof ZSound!=='undefined'&&ZSound._melodyIv){ ZSound.stopMelody(); } }catch(e){} }
  // ═══ Oberfläche ═══
  M.card=function(){ const d=document.createElement('div'); d.id='zmusic-card'; d.style.cssText='margin:10px 4px 4px;padding:12px;border:2px solid #9b59b6;border-radius:12px;background:rgba(155,89,182,.18);color:#fff';
    const cur=M.i>=0?TR[M.i]:null; const pct=Math.round(M.vol*100);
    d.innerHTML='<div style="display:flex;align-items:center;gap:10px"><span style="font-size:1.6rem">🎵</span><div style="flex:1"><div style="font-weight:900;font-size:.95rem">Hintergrundmusik</div><div id="zmusic-now" style="font-size:.75rem;color:rgba(255,255,255,.65)">'+(M.on?(M.playing&&cur?'♪ '+cur[1]+' · '+cur[2]:M.status):'Aus')+'</div></div><button id="zmusic-t" style="border:none;border-radius:20px;padding:7px 13px;font-weight:900;color:#fff;background:'+(M.on?'#43a047':'#757575')+'">'+(M.on?'AN':'AUS')+'</button></div>'
      +'<div style="display:flex;align-items:center;gap:8px;margin-top:10px"><span>🔈</span><input id="zmusic-v" type="range" min="0" max="100" value="'+pct+'" style="flex:1"><span>🔊</span><b id="zmusic-p" style="width:38px;text-align:right;font-size:.8rem">'+pct+'%</b></div>'
      +'<label style="display:flex;align-items:center;gap:8px;margin-top:10px;font-size:.85rem;font-weight:800"><input id="zmusic-l" type="checkbox" '+(M.loop?'checked':'')+' style="width:18px;height:18px"> 🔁 Endlosschleife (dieses Lied immer wieder)</label>'
      +'<div style="margin-top:8px;display:flex;flex-direction:column;gap:5px">'+TR.map((t,k)=>'<button data-s="'+k+'" style="text-align:left;padding:8px 10px;border:none;border-radius:10px;font-weight:800;font-size:.82rem;color:#fff;background:'+(k===M.i&&M.on?'rgba(255,213,79,.35)':'rgba(255,255,255,.12)')+'">'+(k===M.i&&M.on&&M.playing?'♪ ':'')+t[1]+' <span style="opacity:.55;font-weight:400">· '+t[2]+'</span></button>').join('')+'</div>'
      +'<button id="zmusic-n" style="width:100%;margin-top:8px;padding:8px;border:none;border-radius:10px;background:rgba(255,255,255,.14);color:#fff;font-weight:900">⏭ Nächstes Lied</button><div style="font-size:.65rem;opacity:.55;margin-top:6px">Lieder: Leberch, Sub_Clair, Mischa Zoo</div>';
    setTimeout(()=>{ const t=document.getElementById('zmusic-t'), v=document.getElementById('zmusic-v'), n=document.getElementById('zmusic-n'); if(!t) return;
      t.onclick=()=>{ M.setOn(!M.on); const c=document.getElementById('zmusic-card'); if(c&&c.parentNode){ c.parentNode.replaceChild(M.card(),c); } };
      v.oninput=()=>{ M.setVol(v.value/100); document.getElementById('zmusic-p').textContent=v.value+'%'; };
      const lc=document.getElementById('zmusic-l'); if(lc) lc.onchange=()=>M.setLoop(lc.checked); document.querySelectorAll('#zmusic-card [data-s]').forEach(b=>b.onclick=()=>{ M.play(+b.dataset.s); setTimeout(()=>{ const c=document.getElementById('zmusic-card'); if(c&&c.parentNode) c.parentNode.replaceChild(M.card(),c); },400); });
      n.onclick=()=>{ if(!M.on) M.setOn(true); M.next(); setTimeout(()=>{ const c=document.getElementById('zmusic-card'); if(c&&c.parentNode) c.parentNode.replaceChild(M.card(),c); },300); }; },0);
    return d; };
  M.panel=function(){ let o=document.getElementById('zmusic-ov'); if(o) o.remove(); o=document.createElement('div'); o.id='zmusic-ov'; o.style.cssText='position:fixed;inset:0;z-index:796;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:10px;font-family:Arial,sans-serif'; o.onclick=e=>{ if(e.target===o) o.remove(); }; const b=document.createElement('div'); b.style.cssText='background:linear-gradient(160deg,#4a148c,#1a237e);border:3px solid #fff;border-radius:18px;padding:12px;max-width:420px;width:100%;color:#fff'; b.innerHTML='<div style="display:flex"><div style="flex:1;font:900 1.15rem Arial">🎵 Musik</div><button id="zmusic-x" style="border:none;background:rgba(255,255,255,.18);color:#fff;border-radius:8px;width:32px;height:32px">✕</button></div>'; b.appendChild(M.card()); o.appendChild(b); document.body.appendChild(o); document.getElementById('zmusic-x').onclick=()=>o.remove(); };
  // Einhängen: Sound-Menü + Menü-Eintrag
  let hk=0; const hook=()=>{ try{
    if(typeof ZP!=='undefined'&&ZP._rSound&&!ZP._rSound._mh){ const o=ZP._rSound; ZP._rSound=function(){ const r=o.apply(this,arguments); try{ const el=document.getElementById('psound'); if(el){ const old=document.getElementById('zmusic-card'); if(old) old.remove(); el.insertBefore(M.card(),el.firstChild); } }catch(e){} return r; }; ZP._rSound._mh=1; }
    if(window.ZMenu&&!M._me){ M._me=1; const E=ZMenu.entries, i=E.findIndex(e=>e.id==='news'); E.splice(i<0?E.length:i,0,{id:'musik',ic:'🎵',n:'Musik',d:'Lautstärke, nächstes Lied',since:'n790',go:()=>M.panel()}); }
    if(typeof ZSound!=='undefined'&&!ZSound._mu){ ZSound._mu=1; const o=ZSound.startMelody; if(typeof o==='function') ZSound.startMelody=function(){ if(M.on&&!muted()&&!au.paused) return; return o.apply(this,arguments); }; }
    if(!(ZP._rSound&&ZP._rSound._mh)||!M._me||!ZSound._mu){ if(++hk<80) setTimeout(hook,1500); }
  }catch(e){ if(++hk<80) setTimeout(hook,1500); } }; hook();
  if(M.i<0) M.i=Math.floor(Math.random()*TR.length);

  // ═══ Event-Musik (v798): Trailer + Motivation im Wechsel – für Admin-Timer und 🎉 Party-Zeit ═══
  const EVT=['e1.mp3','e2.mp3']; const ev=new Audio(); ev.preload='none'; ev.loop=false; M.ev=ev;
  const E=M.E={ until:0, kind:'', i:0, hud:null };
  const allowed=()=>M.on&&!muted();
  const evVol=()=>{ ev.volume=Math.max(0,Math.min(1,M.vol*night()*1.15)); };
  const evLoad=()=>{ ev.src=BASE+'music/'+EVT[E.i%EVT.length]; evVol(); };
  ev.addEventListener('ended',()=>{ if(E.until>Date.now()){ E.i++; evLoad(); ev.play().catch(()=>{}); } });
  E.running=()=>E.until>Date.now();
  E.begin=function(untilMs,kind){ E.until=untilMs; E.kind=kind||'timer'; if(!(E.i>=0)) E.i=0; E.tick(); };
  E.end=function(){ E.until=0; E.kind=''; try{ ev.pause(); }catch(e){} if(M._ev){ M._ev=false; if(M.on&&!muted()) M.start(); } hud(); };
  E.tick=function(){ try{
    if(!E.running()){ if(M._ev||!ev.paused) E.end(); hud(); return; }
    if(!allowed()){ if(!ev.paused) ev.pause(); if(M._ev){ M._ev=false; } hud(); return; }
    if(M._adm){ if(!ev.paused) ev.pause(); hud(); return; }
    if(document.hidden){ hud(); return; }
    if(!M._ev){ M._ev=true; try{ au.pause(); }catch(e){} }
    evVol();
    if(!ev.src||ev.src.indexOf('music/e')<0) evLoad();
    if(ev.paused){ const p=ev.play(); if(p&&p.catch) p.catch(()=>{}); }
    hud(); }catch(e){} };
  function hud(){ try{ let h=document.getElementById('zbgm-hud');
    if(E.kind!=='party'||!E.running()){ if(h) h.remove(); return; }
    if(!h){ h=document.createElement('div'); h.id='zbgm-hud'; h.style.cssText='position:fixed;left:50%;top:44px;transform:translateX(-50%);z-index:560;pointer-events:none;padding:5px 14px;border-radius:16px;background:linear-gradient(135deg,#8e24aa,#e91e63);border:2px solid #fff;color:#fff;font:900 .85rem Arial,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.5)'; document.body.appendChild(h); }
    const r=Math.max(0,Math.round((E.until-Date.now())/1000)); h.textContent='🎉 Party-Zeit · '+Math.floor(r/60)+':'+('0'+(r%60)).slice(-2)+(allowed()?'':' · 🔇'); }catch(e){} }
  setInterval(E.tick,1000);
  // ═══ Vorrang (v841): Admin-Lieder (Synth) > Event-Lieder (Party/Timer) > normale Hintergrundmusik – nie mehr übereinander ═══
  setInterval(()=>{ try{
    const Z=window.ZMusic, adm=!!(Z&&Z.on&&!Z._viaBgm);
    if(adm&&!M._adm){ M._adm=true; M.playing=false; }
    else if(!adm&&M._adm){ M._adm=false; if(E.running()) E.tick(); else if(M.on&&!muted()&&!document.hidden) M.start(); }
    if(adm){ if(!au.paused) au.pause(); if(!ev.paused) ev.pause(); }
    else if(E.running()&&M._ev&&!au.paused) au.pause();
    if((adm||E.running())&&window.ZSound&&ZSound._melodyIv){ try{ ZSound.stopMelody(); }catch(e){} }
  }catch(e){} },300);
  ['pointerdown','touchend','keydown'].forEach(e=>addEventListener(e,()=>{ if(E.running()&&ev.paused) E.tick(); },true));
  // Admin-Timer (zevents: ZMusic mode "team") → Event-Lieder statt Synthesizer; bei ausgeschalteter Musik bleibt es still
  let hz=0; const hookT=()=>{ try{ const Z=window.ZMusic; if(Z&&Z.play&&!Z._bg){ Z._bg=1; const op=Z.play, os=Z.stop;
      Z.play=function(d,mode,cfg){ const m=mode||'team'; if(m!=='team') return op.apply(this,arguments);
        if(this.on) return; this.mode='team'; this.on=true; this._stopAt=Date.now()+(d||300000); this._viaBgm=true; if(allowed()) E.begin(Date.now()+(d||300000),'timer'); else E.until=0; };
      Z.stop=function(){ if(this._viaBgm){ this._viaBgm=false; this.on=false; if(E.kind==='timer') E.end(); return; } return os.apply(this,arguments); };
      setInterval(()=>{ try{ if(Z._viaBgm&&Date.now()>Z._stopAt+1500) Z.stop(); }catch(e){} },2000); }
    else if(!Z||!Z._bg){ if(++hz<60) setTimeout(hookT,1500); } }catch(e){ if(++hz<60) setTimeout(hookT,1500); } }; hookT();
  // 🎉 Party-Zeit (Admin startet, alle hören mit) – RTDB zoo_party {until}
  const RT=()=>{ try{ return (typeof _rtdb!=='undefined'&&_rtdb&&State._useCloud())?_rtdb:null; }catch(e){ return null; } };
  let hl=0; const listen=()=>{ try{ const r=RT(); if(!r){ if(++hl<120) setTimeout(listen,2000); return; }
    r.ref('zoo_party').on('value',s=>{ const v=s.val(); const u=v&&+v.until||0; if(u>Date.now()){ if(!(E.kind==='party'&&E.until===u)){ E.begin(u,'party'); try{ ZGfx&&ZGfx.confetti&&ZGfx.confetti(); }catch(e){} try{ ZP.toast('🎉 Party-Zeit! Musik an für alle'); }catch(e){} } } else if(E.kind==='party') E.end(); }); }catch(e){ if(++hl<120) setTimeout(listen,2000); } }; listen();
  M.party=function(min){ const r=RT(); if(!r){ try{ ZP.toast('Keine Cloud-Verbindung'); }catch(e){} return; }
    if(min>0) r.ref('zoo_party').set({until:Date.now()+min*60000,by:(window.ZS&&ZS.player)||'admin',at:Date.now()}); else r.ref('zoo_party').remove(); };
  M.partyPanel=function(){ let o=document.getElementById('zparty-ov'); if(o) o.remove(); o=document.createElement('div'); o.id='zparty-ov'; o.style.cssText='position:fixed;inset:0;z-index:796;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:10px;font-family:Arial,sans-serif'; o.onclick=e=>{ if(e.target===o) o.remove(); };
    const b=document.createElement('div'); b.style.cssText='background:linear-gradient(160deg,#8e24aa,#ad1457);border:3px solid #fff;border-radius:18px;padding:14px;max-width:380px;width:100%;color:#fff;text-align:center';
    b.innerHTML='<div style="font:900 1.2rem Arial">🎉 Party-Zeit</div><div style="font-size:.8rem;opacity:.85;margin:6px 0 10px">Alle Spieler hören „Trailer“ und „Motivation“ im Wechsel (wer Musik aus hat, hört nichts).</div>'
     +[10,30,60].map(m=>'<button data-m="'+m+'" style="width:100%;margin:4px 0;padding:11px;border:none;border-radius:12px;background:#fff;color:#ad1457;font:900 .95rem Arial">▶ '+m+' Minuten starten</button>').join('')
     +'<button data-m="0" style="width:100%;margin:4px 0;padding:10px;border:none;border-radius:12px;background:rgba(0,0,0,.35);color:#fff;font:900 .9rem Arial">⏹ Beenden</button><button data-x="1" style="width:100%;margin-top:6px;padding:8px;border:none;background:none;color:#fff;opacity:.7">Schließen</button>';
    b.onclick=e=>{ const t=e.target.closest('button'); if(!t) return; if(t.dataset.x){ o.remove(); return; } M.party(+t.dataset.m); o.remove(); try{ ZP.toast(+t.dataset.m?'🎉 Party gestartet':'Party beendet'); }catch(x){} };
    o.appendChild(b); document.body.appendChild(o); };
  let hm=0; const hookM=()=>{ try{ if(window.ZMenu&&!M._pe){ M._pe=1; const Es=ZMenu.entries, i=Es.findIndex(e=>e.id==='news'); Es.splice(i<0?Es.length:i,0,{id:'party',ic:'🎉',n:'Party-Zeit (Admin)',d:'Musik-Event für alle starten',since:'n798',show:()=>!!(window.ZS&&ZS.isAdmin),go:()=>M.partyPanel()}); } else if(!M._pe&&++hm<60) setTimeout(hookM,1500); }catch(e){ if(++hm<60) setTimeout(hookM,1500); } }; hookM();
})();
