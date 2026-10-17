/* ZEvt4 — Admin-Events (v660): ⛈️ Sturm, 🚨 Zoo-Räumung, 🪤 Fallen-Fest. Admin startet, alle im Zoo bekommen Ansage + Effekte (RTDB zoo_aevent). */
(function(){
  'use strict';
  const RT=()=>{ try{ return (typeof _rtdb!=='undefined'&&_rtdb&&State._useCloud())?_rtdb:null; }catch(e){ return null; } };
  const toast=(m,ms)=>{ try{ ZP.toast(m,ms||3000); }catch(e){} };
  const big=(t,c,ms)=>{ try{ ZG._bigText(t,c||'#fff',ms||2500); }catch(e){} };
  const me=()=>(typeof ZS!=='undefined'&&ZS&&ZS.player)||'';
  const inZoo=()=>{ try{ return !!(ZG&&ZG.cam&&ZG.scene&&ZS&&ZS.zoo&&me()); }catch(e){ return false; } };
  const rng=seed=>{ let a=seed>>>0; return ()=>{ a=(a+0x6D2B79F5)>>>0; let t=a; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }; };
  const INFO={storm:{e:'⛈️',n:'STURM',c:'#7fb3ff',t:'Wind, Regen & Blitze! Wer stehen bleibt, wird weggeweht.'},
    evac:{e:'🚨',n:'ZOO-RÄUMUNG',c:'#ff5252',t:'Alle raus aus fremden Gehegen — sonst wirst du zum Platz geschickt!'},
    traps:{e:'🪤',n:'FALLEN-FEST',c:'#ffb74d',t:'Überall Fallen! Pass auf, wo du hintrittst.'},
    magnet:{e:'🧲',n:'MAGNET-ADMIN',c:'#ff6bd6',t:'Der Admin zieht dich zu sich! Wer ihn als Erster berührt, gewinnt den Preis.'},
    poll:{e:'🏆',n:'MINI-WAHL',c:'#ffd54f',t:'Abstimmen! Wähle deine Antwort oben auf dem Bildschirm.'},
    mystery:{e:'📦',n:'MYSTERY-BOX',c:'#c58bff',t:'Vor dir liegt eine Kiste! Geh hin und öffne sie — was drin ist, weiss keiner.'},
    color:{e:'🌈',n:'FARB-CHAOS',c:'#7dffb0',t:'Die ganze Welt wechselt die Farben!'}};
  const K=n=>String(n||'').toLowerCase().replace(/[.#$\[\]\/]/g,'_');
  const addMT=n=>{ try{ ZS.zoo.mt=(ZS.zoo.mt||0)+n; ZS.save&&ZS.save(); ZG._updHUD&&ZG._updHUD(); }catch(e){} };
  const E=window.ZEvt4={
    cur:null, _started:false, _id:null, _traps:[], _tg:null, _hitCd:{},
    init(){ if(E._iv) return; E._iv=setInterval(()=>{ if(E._started){ E._loop(); return; } const r=RT(); if(!r||!inZoo()) return; E._started=true; try{ r.ref('zoo_aevent').on('value',s=>{ E.cur=s.val()||null; E._changed(); }); }catch(e){} },1000); },
    active(){ const c=E.cur; return (c&&c.until>Date.now()&&INFO[c.type])?c:null; },
    // ── Admin ──
    adminStart(type,mins,o){
      const r=RT(); if(!r){ toast('❌ Keine Verbindung'); return; } if(!INFO[type]) return; mins=Math.max(1,mins||5); o=o||{};
      const id=String(Date.now()), until=Date.now()+mins*60000, ev={id,type,until,by:me()};
      if(type==='magnet'||type==='mystery') ev.prize=Math.max(0,Math.round(+o.prize||0));
      if(type==='poll'){ const opts=String(o.opts||'').split(',').map(x=>x.trim()).filter(Boolean).slice(0,4); if(!o.q||opts.length<2){ toast('❗ Frage und mindestens 2 Optionen (mit Komma getrennt) eingeben'); return; } ev.q=String(o.q).slice(0,80); ev.opts=opts.map(x=>x.slice(0,30)); r.ref('zoo_aevent_votes/'+id).remove(); }
      r.ref('zoo_aevent').set(ev);
      if(type==='color'){ try{ ZEvt3.adminMusicPlay('disco',mins); }catch(e){} }
      if(type==='storm'){
        try{ ZWeather.adminSet('storm',Math.random()*Math.PI*2,mins); }catch(e){}
        try{ ZEvt3.adminMusicPlay('storm',mins); }catch(e){}
      }
      toast(INFO[type].e+' '+INFO[type].n+' gestartet ('+mins+' Min)',4000);
    },
    adminStop(){ const r=RT(); if(!r) return; r.ref('zoo_aevent').set(null); try{ r.ref('zoo_weather').remove(); }catch(e){} try{ ZEvt3.adminMusicStop(); }catch(e){} toast('⏹️ Admin-Event beendet'); },
    // ── Clients ──
    _changed(){
      const c=E.active();
      if(!c){ if(E._id&&!(E.cur&&E.cur.type==='poll'&&E.cur.id===E._id&&E.cur.until<=Date.now()&&E._pollEl)){ E._clear(); } return; }
      if(c.id===E._id) return; E._clear(); E._id=c.id; const I=INFO[c.type];
      big(I.e+' '+I.n+'!',I.c,3500); toast(I.e+' '+I.t,6000);
      try{ if(navigator.vibrate) navigator.vibrate([200,100,200]); }catch(e){}
      if(c.type==='traps') E._spawnTraps(c);
      if(c.type==='mystery') E._spawnBox(c);
      if(c.type==='magnet'){ E._magWon=false; E._magFree=(c.by===me()); }
      if(c.type==='poll') E._pollOpen(c);
      if(c.type==='evac') E._evacTick(true);
      if(c.type==='color') E._colorOn();
    },
    _clear(){
      E._id=null; E._hitCd={}; E._traps=[]; E._pollClose(); E._boxOff(); E._colorOff();
      if(E._tg){ try{ ZG.scene.remove(E._tg); }catch(e){} E._tg=null; }
    },
    _spawnTraps(c){
      const g=rng(parseInt(c.id.slice(-9))||7), R=(ZG.WR||120)-8, grp=new THREE.Group(); E._traps=[];
      for(let i=0;i<70;i++){ const a=g()*Math.PI*2, d=14+Math.sqrt(g())*(R-14); const x=Math.cos(a)*d, z=Math.sin(a)*d;
        const cache=(window.__zevtTex=window.__zevtTex||{}); let t=cache['🪤'];
        if(!t){ const cv=document.createElement('canvas'); cv.width=cv.height=128; const cx=cv.getContext('2d'); cx.font='96px serif'; cx.textAlign='center'; cx.textBaseline='middle'; cx.fillText('🪤',64,70); t=cache['🪤']=new THREE.CanvasTexture(cv); }
        const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true})); s.scale.set(1.8,1.8,1); s.position.set(x,.9,z); grp.add(s); E._traps.push({x,z}); }
      ZG.scene.add(grp); E._tg=grp;
    },
    // ── 📦 Mystery-Box ──
    _spawnBox(c){
      try{ const a=ZG.yaw, x=ZG.pl.x-Math.sin(a)*5, z=ZG.pl.z-Math.cos(a)*5; const cache=(window.__zevtTex=window.__zevtTex||{}); let t=cache['📦'];
        if(!t){ const cv=document.createElement('canvas'); cv.width=cv.height=128; const cx=cv.getContext('2d'); cx.font='96px serif'; cx.textAlign='center'; cx.textBaseline='middle'; cx.fillText('📦',64,70); t=cache['📦']=new THREE.CanvasTexture(cv); }
        const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true})); s.scale.set(2.4,2.4,1); s.position.set(x,1.3,z); ZG.scene.add(s); E._box={s,x,z,c}; }catch(e){}
    },
    _boxOff(){ if(E._box){ try{ ZG.scene.remove(E._box.s); }catch(e){} E._box=null; } },
    _openBox(c){
      E._boxOff(); const r=Math.random(), base=Math.max(100,c.prize||500);
      if(r<.55){ const amt=Math.round(base*(.5+Math.random()*2.5)); addMT(amt); big('📦 +'+amt+' MT!','#ffd54f',2500); toast('📦 Mystery-Box: '+amt+' MT gefunden!',4000); }
      else if(r<.8){ try{ const z=ZS.zoo, now=Date.now(); const act=z.adminLuckExp>now; z.adminLuckMult=Math.max(act?(z.adminLuckMult||0):0,3); z.adminLuckExp=(act?z.adminLuckExp:now)+3*60000; ZS.save&&ZS.save(); ZG._updHUD&&ZG._updHUD(); }catch(e){} big('🍀 ×3 GLÜCK!','#7dffb0',2500); toast('📦 Mystery-Box: ×3 Glück für 3 Minuten!',4500); }
      else { ZG._minusUntil=Date.now()+6000; ZG._minusF=.35; big('🐔 STREICH!','#ff8a65',2500); toast('📦 Mystery-Box: Streich! 6 Sekunden Schneckentempo 🐌',4500); }
    },
    // ── 🧲 Magnet-Admin ──
    _magnet(c,dt){
      if(E._magFree||c.by===me()||!inZoo()||(typeof ZHearts!=='undefined'&&ZHearts.dead)||ZG._spaceActive||ZG._jumpActive||ZG._arcadeActive||ZG._mazeActive||ZG._trashActive||ZG._iceRoomActive) return;
      const a=(ZG.otherPl||{})[c.by]; if(!a) return; const dx=a.x-ZG.pl.x, dz=a.z-ZG.pl.z, d=Math.hypot(dx,dz);
      if(d<2.6){ E._magFree=true; E._magReach(c); return; }
      const sp=Math.min(d,4.5*dt); ZG.pl.x+=dx/d*sp; ZG.pl.z+=dz/d*sp; try{ ZBases.collide(ZG.pl); }catch(e){}
    },
    _magReach(c){
      const r=RT(); if(!r){ return; }
      r.ref('zoo_aevent/win').transaction(v=>v?undefined:{n:me(),at:Date.now()},(err,ok)=>{
        if(ok){ if(c.prize>0) addMT(c.prize); big('🧲 DU BIST ERSTER!','#ff6bd6',3000); toast('🧲 Du hast den Admin zuerst berührt!'+(c.prize>0?' +'+c.prize+' MT':''),5000); }
        else toast('🧲 Admin berührt — du bist frei!',2500); });
    },
    // ── 🏆 Mini-Wahl ──
    _pollOpen(c){
      E._pollClose(); const r=RT(); const el=document.createElement('div'); el.id='zev4-poll';
      el.style.cssText='position:fixed;left:50%;top:70px;transform:translateX(-50%);z-index:562;background:rgba(20,16,42,.94);border:2px solid #ffd54f;border-radius:16px;padding:12px 14px;color:#fff;font-family:Arial,sans-serif;text-align:center;width:min(92vw,360px);box-shadow:0 6px 30px rgba(0,0,0,.5)';
      document.body.appendChild(el); E._pollEl=el; E._votes={}; E._myVote=null;
      if(r){ E._pollRef=r.ref('zoo_aevent_votes/'+c.id); E._pollCb=E._pollRef.on('value',s=>{ E._votes=s.val()||{}; E._pollDraw(); }); }
      E._pollDraw();
    },
    _pollTally(c){ const t=(c.opts||[]).map(()=>0); Object.keys(E._votes||{}).forEach(k=>{ const v=E._votes[k]; if(t[v]!=null) t[v]++; }); return t; },
    _pollDraw(){
      const c=E.cur, el=E._pollEl; if(!c||!el||c.type!=='poll') return; const t=E._pollTally(c), tot=t.reduce((a,b)=>a+b,0), left=Math.max(0,Math.ceil((c.until-Date.now())/1000)), over=left<=0;
      const mx=Math.max.apply(null,t);
      el.innerHTML='<div style="font-weight:900;color:#ffd54f;font-size:.95rem">🏆 '+(over?'ERGEBNIS':'MINI-WAHL')+' · '+(over?'beendet':left+' s')+'</div><div style="font-weight:800;margin:6px 0 8px;font-size:1rem">'+c.q.replace(/</g,'&lt;')+'</div>'
        +(c.opts||[]).map((o,i)=>{ const pct=tot?Math.round(t[i]/tot*100):0, win=over&&tot&&t[i]===mx; return '<button data-i="'+i+'" '+(over?'disabled':'')+' style="display:block;width:100%;margin:5px 0;padding:9px 10px;border-radius:10px;border:2px solid '+(E._myVote===i?'#7dffb0':win?'#ffd54f':'rgba(255,255,255,.25)')+';background:linear-gradient(90deg,rgba(255,213,79,.35) '+pct+'%,rgba(255,255,255,.07) '+pct+'%);color:#fff;font-weight:800;font-size:.9rem;text-align:left;cursor:pointer">'+(win?'👑 ':'')+o.replace(/</g,'&lt;')+' <span style="float:right">'+t[i]+' ('+pct+'%)</span></button>'; }).join('')
        +'<div style="font-size:.7rem;color:rgba(255,255,255,.55)">'+tot+' Stimme'+(tot===1?'':'n')+(E._myVote!=null?' · du hast abgestimmt (änderbar)':'')+'</div>';
      el.querySelectorAll('button[data-i]').forEach(b=>b.onclick=()=>{ const i=+b.dataset.i, r=RT(); if(!r||c.until<Date.now()) return; E._myVote=i; r.ref('zoo_aevent_votes/'+c.id+'/'+K(me())).set(i); E._votes[K(me())]=i; E._pollDraw(); });
    },
    _pollClose(){ try{ if(E._pollRef&&E._pollCb) E._pollRef.off('value',E._pollCb); }catch(e){} E._pollRef=null; E._pollCb=null; if(E._pollEl){ E._pollEl.remove(); E._pollEl=null; } },
    // ── 🌈 Farb-Chaos ──
    _colorOn(){ try{ if(window.ZCalm&&ZCalm.on) return; const cv=ZG.renderer&&ZG.renderer.domElement; if(!cv) return; cv.style.transition='filter 1.6s ease-in-out'; E._cv=cv; const sw=()=>{ cv.style.filter='hue-rotate('+Math.floor(Math.random()*360)+'deg) saturate('+(1.3+Math.random()*.9).toFixed(2)+')'; }; sw(); E._cIv=setInterval(sw,2800); }catch(e){} },
    _colorOff(){ if(E._cIv){ clearInterval(E._cIv); E._cIv=null; } if(E._cv){ E._cv.style.filter=''; setTimeout(()=>{ try{ if(E._cv&&!E._cIv) E._cv.style.transition=''; }catch(e){} },1800); } },
    _evacTick(first){
      try{
        if(!inZoo()||(typeof ZHearts!=='undefined'&&ZHearts.dead)) return;
        const others=ZG.otherPl||{}, k=n=>String(n||'').toLowerCase(); let hit=null;
        Object.keys(others).forEach(n=>{ if(k(n)===k(me())) return; const op=others[n]; if(op&&window.ZBases&&ZBases._inEnc(ZG.pl,op)) hit=n; });
        if(!hit) return;
        const a=Math.random()*Math.PI*2, d=3+Math.random()*5; ZG.pl.x=Math.cos(a)*d; ZG.pl.z=Math.sin(a)*d;
        big('🚨 RAUS!','#ff5252',1800); toast('🚨 Zoo-Räumung! Du warst im Gehege von '+hit+' und wurdest zum Platz geschickt.',4000);
      }catch(e){}
    },
    _loop(){
      try{
        const raw=E.cur; if(raw&&raw.type==='poll'&&raw.id===E._id&&raw.until<=Date.now()&&E._pollEl){ E._pollDraw(); if(!E._pollEndAt) E._pollEndAt=Date.now(); if(Date.now()-E._pollEndAt>9000){ E._pollEndAt=0; E._clear(); } return; }
        const c=E.active(); if(!c){ if(E._id) E._clear(); return; }
        if(c.id!==E._id) return;
        const now=Date.now();
        if(c.type==='evac'&&now-(E._ev||0)>900){ E._ev=now; E._evacTick(); }
        if(c.type==='poll'&&now-(E._pd||0)>1000){ E._pd=now; E._pollDraw(); }
        if(c.type==='mystery'&&E._box&&Math.hypot(ZG.pl.x-E._box.x,ZG.pl.z-E._box.z)<2.2) E._openBox(c);
        if(c.type==='magnet'){ const dt=Math.min(.2,(now-(E._mt||now))/1000); E._mt=now; E._magnet(c,dt); }
        if(c.type==='traps'&&inZoo()&&!(typeof ZHearts!=='undefined'&&ZHearts.dead)){
          E._traps.forEach((t,i)=>{ if(Math.hypot(ZG.pl.x-t.x,ZG.pl.z-t.z)>1.6||now<(E._hitCd[i]||0)) return; E._hitCd[i]=now+3000;
            try{ ZBases._hurt(.5,'🪤 Fallen-Fest! −0,5 ❤','Falle'); ZG._minusUntil=now+2000; ZG._minusF=.5; }catch(e){} });
        }
      }catch(e){}
    }
  };
  setInterval(()=>{ try{ if(E._started) E._loop(); }catch(e){} },100);
  E.init();
})();
