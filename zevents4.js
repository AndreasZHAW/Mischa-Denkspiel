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
    traps:{e:'🪤',n:'FALLEN-FEST',c:'#ffb74d',t:'Überall Fallen! Pass auf, wo du hintrittst.'}};
  const E=window.ZEvt4={
    cur:null, _started:false, _id:null, _traps:[], _tg:null, _hitCd:{},
    init(){ if(E._iv) return; E._iv=setInterval(()=>{ if(E._started){ E._loop(); return; } const r=RT(); if(!r||!inZoo()) return; E._started=true; try{ r.ref('zoo_aevent').on('value',s=>{ E.cur=s.val()||null; E._changed(); }); }catch(e){} },1000); },
    active(){ const c=E.cur; return (c&&c.until>Date.now()&&INFO[c.type])?c:null; },
    // ── Admin ──
    adminStart(type,mins){
      const r=RT(); if(!r){ toast('❌ Keine Verbindung'); return; } if(!INFO[type]) return; mins=Math.max(1,mins||5);
      const id=String(Date.now()), until=Date.now()+mins*60000;
      r.ref('zoo_aevent').set({id,type,until,by:me()});
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
      if(!c){ if(E._id){ E._clear(); } return; }
      if(c.id===E._id) return; E._clear(); E._id=c.id; const I=INFO[c.type];
      big(I.e+' '+I.n+'!',I.c,3500); toast(I.e+' '+I.t,6000);
      try{ if(navigator.vibrate) navigator.vibrate([200,100,200]); }catch(e){}
      if(c.type==='traps') E._spawnTraps(c);
      if(c.type==='evac') E._evacTick(true);
    },
    _clear(){
      E._id=null; E._hitCd={}; E._traps=[];
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
        const c=E.active(); if(!c){ if(E._id) E._clear(); return; }
        if(c.id!==E._id) return;
        const now=Date.now();
        if(c.type==='evac'&&now-(E._ev||0)>900){ E._ev=now; E._evacTick(); }
        if(c.type==='traps'&&inZoo()&&!(typeof ZHearts!=='undefined'&&ZHearts.dead)){
          E._traps.forEach((t,i)=>{ if(Math.hypot(ZG.pl.x-t.x,ZG.pl.z-t.z)>1.6||now<(E._hitCd[i]||0)) return; E._hitCd[i]=now+3000;
            try{ ZBases._hurt(.5,'🪤 Fallen-Fest! −0,5 ❤','Falle'); ZG._minusUntil=now+2000; ZG._minusF=.5; }catch(e){} });
        }
      }catch(e){}
    }
  };
  setInterval(()=>{ try{ if(E._started) E._loop(); }catch(e){} },120);
  E.init();
})();
