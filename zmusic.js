/* ═══ ZMusic (v790): 🎵 Hintergrundmusik – 4 Lieder im Wechsel, startet von selbst, Lautstärke/Aus im Sound-Menü ═══ */
(function(){
  'use strict';
  if(window.ZMusic) return;
  const TR=[['m1.mp3','Piano','Leberch'],['m2.mp3','Travel Piano','Leberch'],['m3.mp3','Sad','Leberch'],['m4.mp3','Background Music','Sub_Clair']];
  const ls=(k,d)=>{ try{ const v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } };
  const lsw=(k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} };
  const M=window.ZMusic={on:ls('zmusic_on',true),vol:ls('zmusic_vol',.35),i:ls('zmusic_i',-1),playing:false};
  const au=new Audio(); au.preload='none'; au.loop=false; M.au=au;
  const night=()=>{ try{ if(window.ZDevice&&!ZDevice.s.night) return 1; const h=new Date().getHours(); return (h>=22||h<7)?.6:1; }catch(e){ return 1; } };
  const muted=()=>{ try{ return typeof ZSound!=='undefined'&&ZSound.style==='off'; }catch(e){ return false; } };
  const apply=()=>{ au.volume=Math.max(0,Math.min(1,M.vol*night())); };
  const src=i=>'music/'+TR[i][0];
  M.next=function(userSkip){ M.i=(M.i+1+TR.length)%TR.length; lsw('zmusic_i',M.i); load(true); };
  function load(play){ try{ au.src=src(M.i); apply(); if(play&&M.on&&!muted()&&!document.hidden){ const p=au.play(); if(p&&p.then) p.then(()=>{ M.playing=true; fade(); }).catch(()=>{ M.playing=false; }); } }catch(e){} }
  function fade(){ const t=M.vol*night(); au.volume=0; let k=0; const iv=setInterval(()=>{ k++; au.volume=Math.min(1,t*k/15); if(k>=15){ clearInterval(iv); apply(); } },100); }
  M.start=function(){ if(!M.on||muted()) return; if(M.i<0){ M.i=Math.floor(Math.random()*TR.length); lsw('zmusic_i',M.i); } if(!au.src||au.src.indexOf(TR[M.i][0])<0) load(false); apply(); if(au.paused){ const p=au.play(); if(p&&p.then) p.then(()=>{ M.playing=true; fade(); stopSynth(); }).catch(()=>{ M.playing=false; }); } };
  M.stop=function(){ try{ au.pause(); }catch(e){} M.playing=false; };
  M.setOn=function(v){ M.on=!!v; lsw('zmusic_on',M.on); if(M.on) M.start(); else M.stop(); };
  M.setVol=function(v){ M.vol=Math.max(0,Math.min(1,+v)); lsw('zmusic_vol',M.vol); apply(); if(M.vol>0&&M.on&&au.paused) M.start(); };
  au.addEventListener('ended',()=>M.next());
  au.addEventListener('error',()=>{ setTimeout(()=>{ if(M.on) M.next(); },3000); });
  // Start nach erster Berührung (Browser erlauben sonst keinen Ton)
  const unlock=()=>{ M.start(); if(!au.paused){ ['pointerdown','keydown','touchstart'].forEach(e=>removeEventListener(e,unlock,true)); } };
  ['pointerdown','keydown','touchstart'].forEach(e=>addEventListener(e,unlock,true));
  // Im Hintergrund pausieren
  document.addEventListener('visibilitychange',()=>{ if(document.hidden){ if(!au.paused){ au.pause(); M._wasP=true; } } else if(M._wasP){ M._wasP=false; M.start(); } });
  // Stumm-Stellung des Sound-Menüs gilt auch für die Musik
  setInterval(()=>{ try{ if(muted()&&!au.paused) au.pause(); else if(!muted()&&M.on&&au.paused&&!document.hidden&&M.playing===false&&au.src&&M._wasMuted){ M.start(); } M._wasMuted=muted(); apply(); stopSynth(); }catch(e){} },2000);
  function stopSynth(){ try{ if(!au.paused&&typeof ZSound!=='undefined'&&ZSound._melodyIv){ ZSound.stopMelody(); } }catch(e){} }
  // ═══ Oberfläche ═══
  M.card=function(){ const d=document.createElement('div'); d.id='zmusic-card'; d.style.cssText='margin:10px 4px 4px;padding:12px;border:2px solid #9b59b6;border-radius:12px;background:rgba(155,89,182,.18);color:#fff';
    const cur=M.i>=0?TR[M.i]:null; const pct=Math.round(M.vol*100);
    d.innerHTML='<div style="display:flex;align-items:center;gap:10px"><span style="font-size:1.6rem">🎵</span><div style="flex:1"><div style="font-weight:900;font-size:.95rem">Hintergrundmusik</div><div id="zmusic-now" style="font-size:.75rem;color:rgba(255,255,255,.65)">'+(cur&&M.on?'♪ '+cur[1]+' · '+cur[2]:(M.on?'Startet gleich …':'Aus'))+'</div></div><button id="zmusic-t" style="border:none;border-radius:20px;padding:7px 13px;font-weight:900;color:#fff;background:'+(M.on?'#43a047':'#757575')+'">'+(M.on?'AN':'AUS')+'</button></div>'
      +'<div style="display:flex;align-items:center;gap:8px;margin-top:10px"><span>🔈</span><input id="zmusic-v" type="range" min="0" max="100" value="'+pct+'" style="flex:1"><span>🔊</span><b id="zmusic-p" style="width:38px;text-align:right;font-size:.8rem">'+pct+'%</b></div>'
      +'<button id="zmusic-n" style="width:100%;margin-top:8px;padding:8px;border:none;border-radius:10px;background:rgba(255,255,255,.14);color:#fff;font-weight:900">⏭ Nächstes Lied</button><div style="font-size:.65rem;opacity:.55;margin-top:6px">Lieder: Leberch, Sub_Clair</div>';
    setTimeout(()=>{ const t=document.getElementById('zmusic-t'), v=document.getElementById('zmusic-v'), n=document.getElementById('zmusic-n'); if(!t) return;
      t.onclick=()=>{ M.setOn(!M.on); const c=document.getElementById('zmusic-card'); if(c&&c.parentNode){ c.parentNode.replaceChild(M.card(),c); } };
      v.oninput=()=>{ M.setVol(v.value/100); document.getElementById('zmusic-p').textContent=v.value+'%'; };
      n.onclick=()=>{ if(!M.on) M.setOn(true); M.next(); setTimeout(()=>{ const c=document.getElementById('zmusic-card'); if(c&&c.parentNode) c.parentNode.replaceChild(M.card(),c); },300); }; },0);
    return d; };
  M.panel=function(){ let o=document.getElementById('zmusic-ov'); if(o) o.remove(); o=document.createElement('div'); o.id='zmusic-ov'; o.style.cssText='position:fixed;inset:0;z-index:796;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:10px;font-family:Arial,sans-serif'; o.onclick=e=>{ if(e.target===o) o.remove(); }; const b=document.createElement('div'); b.style.cssText='background:linear-gradient(160deg,#4a148c,#1a237e);border:3px solid #fff;border-radius:18px;padding:12px;max-width:420px;width:100%;color:#fff'; b.innerHTML='<div style="display:flex"><div style="flex:1;font:900 1.15rem Arial">🎵 Musik</div><button id="zmusic-x" style="border:none;background:rgba(255,255,255,.18);color:#fff;border-radius:8px;width:32px;height:32px">✕</button></div>'; b.appendChild(M.card()); o.appendChild(b); document.body.appendChild(o); document.getElementById('zmusic-x').onclick=()=>o.remove(); };
  // Einhängen: Sound-Menü + Menü-Eintrag
  let hk=0; const hook=()=>{ try{
    if(typeof ZP!=='undefined'&&ZP._rSound&&!ZP._rSound._mh){ const o=ZP._rSound; ZP._rSound=function(){ const r=o.apply(this,arguments); try{ const el=document.getElementById('psound'); if(el){ const old=document.getElementById('zmusic-card'); if(old) old.remove(); el.appendChild(M.card()); } }catch(e){} return r; }; ZP._rSound._mh=1; }
    if(window.ZMenu&&!M._me){ M._me=1; const E=ZMenu.entries, i=E.findIndex(e=>e.id==='news'); E.splice(i<0?E.length:i,0,{id:'musik',ic:'🎵',n:'Musik',d:'Lautstärke, nächstes Lied',since:'n790',go:()=>M.panel()}); }
    if(typeof ZSound!=='undefined'&&!ZSound._mu){ ZSound._mu=1; const o=ZSound.startMelody; if(typeof o==='function') ZSound.startMelody=function(){ if(M.on&&!muted()&&!au.paused) return; return o.apply(this,arguments); }; }
    if(!(ZP._rSound&&ZP._rSound._mh)||!M._me||!ZSound._mu){ if(++hk<80) setTimeout(hook,1500); }
  }catch(e){ if(++hk<80) setTimeout(hook,1500); } }; hook();
  if(M.i<0) M.i=Math.floor(Math.random()*TR.length);
})();
