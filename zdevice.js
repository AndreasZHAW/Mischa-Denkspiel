/* ═══ ZDevice (v789): 📱 Handy- & Controller-Funktionen – Vibration, Benachrichtigungen, Ton-Komfort, grosse Bildschirme, Gamepad ═══ */
(function(){
  'use strict';
  if(window.ZDevice) return;
  const D=window.ZDevice={};
  const ls=(k,d)=>{ try{ const v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } };
  const lsw=(k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} };
  const S=D.s=Object.assign({vib:true,tick:true,notif:false,night:true,hidMute:true},ls('zdev_set',{}));
  D.save=()=>lsw('zdev_set',S);
  const toast=(m,t)=>{ try{ ZP.toast(m,t||2500); }catch(e){} };
  const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  // ═══ 1 · Vibration ═══
  const PAT={tick:[6],tap:[10],coin:[14],boom:[35],hit:[70],win:[80,50,80,50,160],death:[220,90,320]};
  let lastV=0;
  D.vib=function(k){ try{ if(!S.vib||!navigator.vibrate) return false; if(k==='tick'&&!S.tick) return false; const n=Date.now(); if(n-lastV<(k==='tick'?120:50)) return false; lastV=n; return navigator.vibrate(PAT[k]||PAT.tap); }catch(e){ return false; } };
  document.addEventListener('click',e=>{ try{ const t=e.target&&e.target.closest&&e.target.closest('button,.btn,[onclick]'); if(t&&e.isTrusted) D.vib('tick'); }catch(er){} },true);
  // Konfetti / Töne verknüpfen (sobald sie da sind)
  let hk=0; const hook=()=>{ try{
    if(window.ZGfx&&ZGfx.confetti&&!ZGfx._vh){ ZGfx._vh=1; const o=ZGfx.confetti; ZGfx.confetti=function(n){ D.vib((n||110)>=100?'win':'coin'); return o.apply(this,arguments); }; }
    if(typeof ZSound!=='undefined'&&!ZSound._vh){ ZSound._vh=1; const W=(name,k)=>{ const o=ZSound[name]; if(typeof o==='function') ZSound[name]=function(){ D.vib(k); return o.apply(this,arguments); }; }; W('coin','coin'); W('buy','coin'); W('rare','win'); W('_sndUpgrade','win'); W('_sndSuperEpic','win'); W('slap','hit'); W('_sndOuch','hit'); W('_sndNetCatch','tap'); W('_sndDelivered','tap'); W('wheelSpin','tap');
      // ═══ 5 · Ton-Komfort: nachts leiser, im Hintergrund still ═══
      const vm=()=>{ if(!S.night) return 1; const h=new Date().getHours(); return (h>=22||h<7)?.45:1; };
      const t0=ZSound._tone; if(typeof t0==='function') ZSound._tone=function(f,d,ty,v,dl){ return t0.call(this,f,d,ty,(v==null?.3:v)*vm(),dl); };
      const p0=ZSound._playFile; if(typeof p0==='function') ZSound._playFile=function(k,v,dl,r){ return p0.call(this,k,(v==null?.55:v)*vm(),dl,r); };
      document.addEventListener('visibilitychange',()=>{ try{ if(!S.hidMute) return; if(document.hidden){ ZSound._wasMel=!!ZSound._melodyIv; ZSound.stopMelody&&ZSound.stopMelody(); ZSound.ctx&&ZSound.ctx.suspend&&ZSound.ctx.suspend(); } else { ZSound.ctx&&ZSound.ctx.resume&&ZSound.ctx.resume(); if(ZSound._wasMel&&ZSound.style!=='off'&&!ZSound._melodyIv) ZSound.startMelody&&ZSound.startMelody(); } }catch(e){} });
    }
    if(window.ZNotify&&ZNotify.add&&!ZNotify._vh){ ZNotify._vh=1; const o=ZNotify.add; ZNotify.add=function(key,ic,txt,place){ const had=ZNotify.seen.includes(key); const r=o.apply(this,arguments); if(!had) D.notify('Mischa Zoo',ic+' '+txt); return r; }; }
    if(window.ZPirate&&window.ZMenu&&!D._me){ D._me=1; const E=ZMenu.entries, i=E.findIndex(e=>e.id==='news'); E.splice(i<0?E.length:i,0,{id:'geraet',ic:'📱',n:'Handy & Controller',d:'Vibration, Töne, Meldungen, 🎮',since:'n789',go:()=>D.panel()}); }
    if(!window.ZPirate||!window.ZMenu||!window.ZNotify||typeof ZSound==='undefined'||!window.ZGfx) { if(++hk<80) setTimeout(hook,1500); }
  }catch(e){ if(++hk<80) setTimeout(hook,1500); } }; hook();
  // ═══ 3 · Benachrichtigungen (nur solange Browser/App im Hintergrund läuft) ═══
  D.canNotify=()=>typeof Notification!=='undefined';
  D.notify=function(title,body){ try{ if(!S.notif||!D.canNotify()||Notification.permission!=='granted'||!document.hidden) return; if(navigator.serviceWorker&&navigator.serviceWorker.ready){ navigator.serviceWorker.ready.then(r=>r.showNotification(title,{body,tag:'zoo-'+Date.now()%9})).catch(()=>{ try{ new Notification(title,{body}); }catch(e){} }); } else new Notification(title,{body}); D.vib('tap'); }catch(e){} };
  D.askNotif=function(){ if(!D.canNotify()){ toast('Dieses Gerät/dieser Browser unterstützt keine Benachrichtigungen.',4000); return; } try{ if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{}); }catch(e){} const done=r=>{ S.notif=(r==='granted'); D.save(); toast(r==='granted'?'🔔 Benachrichtigungen an!':'Benachrichtigungen nicht erlaubt.',3000); D.panel(); }; try{ const p=Notification.requestPermission(done); if(p&&p.then) p.then(done); }catch(e){ done('denied'); } };
  // ═══ 12 · Controller ═══
  let held={}, prevB=[], last=performance.now();
  const kev=(type,code)=>{ try{ document.dispatchEvent(new KeyboardEvent(type,{code,key:code,bubbles:true})); }catch(e){} };
  const press=(code,on)=>{ if(!!held[code]===on) return; held[code]=on; kev(on?'keydown':'keyup',code); };
  const closeTop=()=>{ const sel=['#zpi-death .zpi-x','.zpi-x','#zm-x','#zd-x','#zd-ov','#zm-ov']; for(const s of sel){ const e=document.querySelector(s); if(e){ if(e.click&&e.tagName==='BUTTON') e.click(); else e.remove(); return true; } } return false; };
  function poll(){ requestAnimationFrame(poll); const now=performance.now(), dt=Math.min(.05,(now-last)/1000); last=now;
    const gp=(navigator.getGamepads?[...navigator.getGamepads()]:[]).find(g=>g&&g.connected); if(!gp){ if(window.ZPirate) ZPirate.pad=null; ['KeyW','KeyA','KeyS','KeyD','Space','ShiftLeft'].forEach(c=>press(c,false)); return; }
    const ax=i=>Math.abs(gp.axes[i]||0)>.2?gp.axes[i]:0, lx=ax(0), ly=ax(1), rx=ax(2), ry=ax(3), b=i=>!!(gp.buttons[i]&&gp.buttons[i].pressed), edge=i=>b(i)&&!prevB[i];
    const pir=window.ZPirate&&ZPirate.open;
    if(edge(9)&&!pir&&window.ZMenu) { if(document.getElementById('zm-ov')) closeTop(); else ZMenu.open(); }
    if(edge(1)) closeTop();
    if(pir){ ZPirate.pad={x:lx,y:ly}; if(edge(0)||edge(7)) ZPirate.fire(); if(edge(2)){ const c=ZPirate.ctx(); if(c) c.f(); } if(b(6)) ZPirate.zoomBy&&ZPirate.zoomBy(dt*.8); if(b(7)) ZPirate.zoomBy&&ZPirate.zoomBy(-dt*.8); if(b(4)) ZPirate.zoomBy&&ZPirate.zoomBy(dt*.8); if(b(5)) ZPirate.zoomBy&&ZPirate.zoomBy(-dt*.8); }
    else { if(window.ZPirate) ZPirate.pad=null; press('KeyW',ly<-.45); press('KeyS',ly>.45); press('KeyA',lx<-.45); press('KeyD',lx>.45); press('Space',b(0)); press('ShiftLeft',b(5));
      if(edge(2)){ kev('keydown','KeyE'); kev('keyup','KeyE'); } if(edge(3)){ kev('keydown','KeyQ'); kev('keyup','KeyQ'); }
      try{ if((rx||ry)&&typeof ZG!=='undefined'&&ZG.pl){ ZG.yaw-=rx*dt*2.6; ZG.pitch=Math.max(-1.3,Math.min(1.3,ZG.pitch-ry*dt*1.8)); } }catch(e){} }
    prevB=gp.buttons.map(x=>x.pressed); }
  addEventListener('gamepadconnected',e=>{ toast('🎮 Controller verbunden: '+String(e.gamepad.id).slice(0,28),3500); });
  requestAnimationFrame(poll);
  // ═══ 10 · Grosse Bildschirme (Samsung DeX, Tablet, PC) ═══
  const st=document.createElement('style'); st.textContent='@media (min-width:900px) and (min-height:560px){#zm-ov>div,.zpi-m>div,#zd-box,#zdev-box{max-width:680px!important;font-size:1.1em}#zpi-hud{transform:scale(1.2);transform-origin:top left}#zpi-joy,#zpi-fire,#zpi-ctx{transform-origin:bottom center}#zpi-fire{transform:scale(1.15)}#zm-fab{transform:scale(1.15)}}@media (pointer:fine){#zpi-joy{opacity:.4}}'; document.head.appendChild(st);
  // ═══ Panel ═══
  D.panel=function(){ let o=document.getElementById('zdev-ov'); if(o) o.remove(); o=document.createElement('div'); o.id='zdev-ov'; o.style.cssText='position:fixed;inset:0;z-index:795;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:10px;font-family:Arial,sans-serif'; o.onclick=e=>{ if(e.target===o) o.remove(); };
    const row=(id,ic,t,d,on,extra)=>'<div style="display:flex;align-items:center;gap:10px;background:rgba(0,0,0,.25);border-radius:12px;padding:9px;margin-bottom:6px"><span style="font-size:1.5rem">'+ic+'</span><div style="flex:1"><b style="font-size:.88rem">'+t+'</b><div style="font-size:.7rem;opacity:.8">'+d+'</div></div>'+(extra||'')+'<button data-k="'+id+'" style="border:none;border-radius:20px;padding:7px 12px;font-weight:900;font-size:.75rem;background:'+(on?'#43a047':'#757575')+';color:#fff">'+(on?'AN':'AUS')+'</button></div>';
    const perm=D.canNotify()?Notification.permission:'nicht möglich';
    o.innerHTML='<div id="zdev-box" style="background:linear-gradient(160deg,#283593,#1a237e);border:3px solid #fff;border-radius:18px;padding:14px;max-width:460px;width:100%;max-height:92vh;overflow-y:auto;color:#fff"><div style="display:flex"><div style="flex:1;font:900 1.15rem Arial">📱 Handy & Controller</div><button id="zdev-x" style="border:none;background:rgba(255,255,255,.18);color:#fff;border-radius:8px;width:32px;height:32px">✕</button></div><div style="font-size:.72rem;opacity:.8;margin:2px 0 8px">Gilt nur für dieses Gerät.</div>'
     +row('vib','📳','Vibration','Bei Treffern, Siegen, Münzen (Android). iPhone: meist nicht möglich.',S.vib,'<button id="zdev-tv" style="border:none;border-radius:8px;padding:6px 8px;background:#ffb300;font-weight:900;font-size:.7rem">Test</button>')
     +row('tick','👆','Tipp-Gefühl','Kurzes Ticken bei jedem Knopfdruck.',S.tick)
     +row('notif','🔔','Benachrichtigungen','Meldung, wenn das Spiel im Hintergrund ist (Ei fertig, Wetter bereit …). Status: '+perm+'. Funktioniert nicht, wenn der Browser ganz geschlossen ist.',S.notif&&perm==='granted')
     +row('night','🌙','Nachts leiser','Zwischen 22 und 7 Uhr sind Töne leiser.',S.night)
     +row('hidMute','🔇','Ton aus im Hintergrund','Töne und Musik stoppen, wenn du die App wechselst.',S.hidMute)
     +'<div style="background:rgba(0,0,0,.25);border-radius:12px;padding:9px;font-size:.74rem;line-height:1.5"><b>🎮 Controller</b> (Bluetooth/USB, einfach verbinden und eine Taste drücken)<br>Zoo: Linker Stick laufen · Rechter Stick schauen · A springen · X benutzen · Y Slap · RB rennen · Start Menü · B schliessen<br>Piraten-Welt: Linker Stick segeln · A oder RT feuern · X Aktion · LB/RB zoomen<br><br><b>🖥️ Grosser Bildschirm</b> (Tablet, Samsung DeX, PC): Menüs und Knöpfe werden automatisch grösser.<br><b>🤏 Zoomen</b> in der Piraten-Welt: zwei Finger oder Mausrad.</div></div>';
    document.body.appendChild(o); document.getElementById('zdev-x').onclick=()=>o.remove(); const tv=document.getElementById('zdev-tv'); if(tv) tv.onclick=()=>{ if(!navigator.vibrate) toast('Dieses Gerät kann nicht vibrieren.'); else PAT&&navigator.vibrate([80,50,160]); };
    o.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{ const k=b.dataset.k; if(k==='notif'){ if(S.notif&&D.canNotify()&&Notification.permission==='granted'){ S.notif=false; D.save(); D.panel(); } else D.askNotif(); return; } S[k]=!S[k]; D.save(); D.panel(); }); };
})();
