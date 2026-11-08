/* ═══ ZGuide (v775): 🧭 Wegweiser (Pfeil + Leuchtsäule zu Orten) und 🤝 Neulinge-Hilfe ═══ */
(function(){
  'use strict';
  if(window.ZGuide) return;
  const wait=()=>{ if(typeof THREE==='undefined'||typeof ZG==='undefined'||!ZG.scene||!ZG.renderer||!ZG.cam||typeof ZS==='undefined'||!ZS.zoo||!ZS.player||!window.ZSecMap) return setTimeout(wait,1000); init(); };
  function init(){
    const $=id=>document.getElementById(id), zoo=()=>ZS.zoo;
    const toast=(m,t)=>{ try{ ZP.toast(m,t||2500); }catch(e){} };
    const save=()=>{ try{ ZS.save&&ZS.save(); }catch(e){} };
    const RTD=()=>{ try{ return (typeof _rtdb!=='undefined'&&_rtdb&&State._useCloud())?_rtdb:null; }catch(e){ return null; } };
    const key=n=>String(n||'').toLowerCase().replace(/[.#$\[\]\/]/g,'_');
    const G=window.ZGuide={wp:null};
    const mbm=(c,o)=>new THREE.MeshBasicMaterial(Object.assign({color:c},o||{}));
    // ── Orte ──
    G.places=function(){ const z=zoo(), s=z.sec||{}, r=(z.reb||0), out=[];
      out.push({ic:'🚡',n:'Gondelstation',x:0,z:0},{ic:'🏪',n:'Marktplatz',x:0,z:30});
      try{ const l=ZG._slotEncPos(typeof ZS.mySlot==='number'?ZS.mySlot:0); out.push({ic:'🏠',n:'Mein Zoo',x:l.center.x,z:l.center.z}); }catch(e){}
      if(s.pet) out.push({ic:'🐰',n:'Streichel-Zoo',x:-62,z:-48});
      if(s.cave) out.push({ic:'🗿',n:'Geheime Höhle',x:-205,z:-60});
      if(r>=3) out.push({ic:'🛗',n:'Geheimer Aufzug',x:-30,z:-160});
      if(s.arena) out.push({ic:'⚔️',n:'Tier-Arena',x:130,z:-140});
      if(s.isl) out.push({ic:'🏝️',n:'Schatz-Insel',x:-160,z:115});
      if(s.tower) out.push({ic:'🗼',n:'Legenden-Turm',x:170,z:110});
      try{ if(window.ZFun){ if(s.train) out.push({ic:'🚂',n:'Zoo-Bahn',x:ZFun.C.x,z:ZFun.C.z-26}); if(s.egg) out.push({ic:'🥚',n:'Ei-Brüterei',x:ZFun.HP.x,z:ZFun.HP.z+12}); } }catch(e){}
      return out; };
    // ── 3D ──
    const root=new THREE.Group(); root.visible=false; ZG.scene.add(root);
    const arrow=new THREE.Group(); { const sh=new THREE.Mesh(new THREE.BoxGeometry(1.6,.08,.5),mbm(0xffd54f)); sh.position.x=-.3; arrow.add(sh); const hd=new THREE.Mesh(new THREE.ConeGeometry(.6,1,3),mbm(0xff7043)); hd.rotation.x=Math.PI/2*0; hd.rotation.z=-Math.PI/2; hd.rotation.x=0; hd.scale.set(1,1,.2); hd.position.x=.9; arrow.add(hd); }
    arrow.children.forEach(m=>{ m.material.depthTest=false; m.renderOrder=20; }); root.add(arrow);
    const beam=new THREE.Mesh(new THREE.CylinderGeometry(1.2,1.2,60,16,1,true),mbm(0xffee58,{transparent:true,opacity:.28,depthWrite:false,side:THREE.DoubleSide})); beam.renderOrder=3; beam.position.y=30; root.add(beam);
    const pinTex=(()=>{ const c=document.createElement('canvas'); c.width=c.height=128; const g=c.getContext('2d'); g.font='96px serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('📍',64,70); return new THREE.CanvasTexture(c); })();
    const pin=new THREE.Sprite(new THREE.SpriteMaterial({map:pinTex,transparent:true,depthTest:false})); pin.scale.set(5,5,1); pin.renderOrder=21; root.add(pin);
    // ── Chip ──
    const chip=document.createElement('div'); chip.id='zg-chip'; chip.style.cssText='position:fixed;top:104px;left:50%;transform:translateX(-50%);z-index:128;display:none;background:rgba(20,20,40,.82);color:#fff;border:2px solid #ffd54f;border-radius:20px;padding:6px 12px;font:700 .85rem Arial;box-shadow:0 3px 10px rgba(0,0,0,.4);white-space:nowrap';
    chip.innerHTML='<span id="zg-t"></span> <button id="zg-x" style="margin-left:8px;border:none;border-radius:50%;width:24px;height:24px;background:#e53935;color:#fff;font-weight:900">✕</button>'; document.body.appendChild(chip);
    $('zg-x').onclick=()=>G.clear();
    G.go=function(p){ G.wp=p; root.visible=true; beam.position.set(p.x,30,p.z); pin.position.set(p.x,9,p.z); toast('🧭 Wegweiser: '+p.ic+' '+p.n+' – folge dem gelben Pfeil!',3500); };
    G.clear=function(){ G.wp=null; root.visible=false; chip.style.display='none'; };
    G.frame=function(t){ const p=G.wp; if(!p) return; const pl=ZG.pl; if(!pl) return; if(Math.abs(pl.x)>1500){ root.visible=false; chip.style.display='none'; return; } root.visible=true;
      const dx=p.x-pl.x, dz=p.z-pl.z, d=Math.hypot(dx,dz);
      if(d<6){ toast('🎉 Angekommen: '+p.ic+' '+p.n,3000); try{ ZGfx.confetti(60); }catch(e){} return G.clear(); }
      const ux=dx/d, uz=dz/d; const gy=Math.max(0,(pl.y||1.7)-1.55); arrow.position.set(pl.x+ux*3.2,gy+.25+Math.sin(t*4)*.05,pl.z+uz*3.2); arrow.rotation.y=-Math.atan2(uz,ux);
      pin.position.y=9+Math.sin(t*3)*.6; chip.style.display='block'; $('zg-t').textContent='🧭 '+p.ic+' '+p.n+' · '+Math.round(d)+' m'; };
    // ── Karte: Wegweiser-Liste + Hilfe ──
    const o0=ZSecMap.open; ZSecMap.open=function(){ const had=!!$('zmap-ov'); const r=o0.apply(this,arguments); if(!had) setTimeout(()=>{ try{ G.mapUI(); }catch(e){ console.warn('ZGuide map',e); } },0); return r; };
    G.mapUI=function(){ const h=$('zmap-h'); if(!h||$('zg-list')) return; const d=document.createElement('div'); d.id='zg-list'; d.style.cssText='margin-top:8px;border-top:2px dashed #8d6e3f;padding-top:6px';
      d.innerHTML='<div style="font-weight:900;margin-bottom:4px">🧭 Wegweiser – wohin möchtest du?</div><div style="display:flex;flex-wrap:wrap;gap:5px;justify-content:center">'+G.places().map((p,i)=>'<button data-i="'+i+'" style="border:2px solid #8d6e3f;background:#fff8e1;color:#3b2a10;border-radius:14px;padding:6px 9px;font:700 .78rem Arial">'+p.ic+' '+p.n+'</button>').join('')+'</div>'
        +((zoo().reb||0)>=1?'<button id="zg-help" style="margin-top:8px;width:100%;border:none;border-radius:14px;padding:9px;background:linear-gradient(135deg,#66bb6a,#2e7d32);color:#fff;font:900 .85rem Arial">🤝 Neuen Spielern helfen</button>':'');
      h.parentNode.appendChild(d); const ps=G.places();
      d.querySelectorAll('button[data-i]').forEach(b=>b.onclick=()=>{ G.go(ps[+b.dataset.i]); const m=$('zmap-ov'); if(m) m.remove(); });
      const hb=$('zg-help'); if(hb) hb.onclick=()=>{ const m=$('zmap-ov'); if(m) m.remove(); H.open(); }; };
    // ── 🤝 Neulinge-Hilfe ──  (sicher: Helfer verliert/gewinnt kein Geld, Neuling bekommt kleines Geschenk, max. 3 insgesamt)
    const H=G.H={}; const GIFT=2500, MAXRECV=3, MAXSEND=5;
    const hs=()=>{ const z=zoo(); return z.help||(z.help={recv:0,sent:0,day:'',cnt:0,seen:[]}); };
    const today=()=>new Date().toISOString().slice(0,10);
    H.isNew=()=>{ const z=zoo(); return (z.reb||0)===0&&hs().recv<MAXRECV; };
    H.announce=function(){ const r=RTD(); if(!r||!H.isNew()) return; try{ const ref=r.ref('zoo_help/wanted/'+key(ZS.player)); ref.set({n:String(ZS.player),t:Date.now()}); ref.onDisconnect().remove(); }catch(e){} };
    H.open=function(){ const r=RTD(); const st=hs(); if(st.day!==today()){ st.day=today(); st.cnt=0; }
      const o=document.createElement('div'); o.id='zg-help-ov'; o.style.cssText='position:fixed;inset:0;z-index:610;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:14px'; o.onclick=e=>{ if(e.target===o) o.remove(); };
      o.innerHTML='<div style="background:linear-gradient(160deg,#1b5e20,#2e7d32);border:3px solid #ffd54f;border-radius:18px;padding:16px;max-width:360px;width:100%;color:#fff;text-align:center;font-family:Arial,sans-serif;max-height:90vh;overflow:auto"><div style="font-size:2.2rem">🤝</div><div style="font:900 1.15rem Arial;color:#ffd54f">Neuen Spielern helfen</div><div style="font-size:.8rem;margin:6px 0;opacity:.95">Hier siehst du Spieler, die gerade neu sind (Rebirth 0). Dein Geschenk: <b>'+GIFT+' MT + 10 Min. Geld ×2</b> für sie. Dich kostet es nichts. Heute geholfen: <b>'+st.cnt+'/'+MAXSEND+'</b> · Insgesamt: <b>'+(st.sent||0)+'</b> ⭐</div><div id="zg-hl" style="min-height:40px;font-size:.85rem">Suche …</div><button id="zg-hx" style="margin-top:10px;width:100%;padding:9px;border:none;border-radius:12px;background:rgba(255,255,255,.2);color:#fff;font:900 .9rem Arial">Schliessen</button></div>';
      document.body.appendChild(o); $('zg-hx').onclick=()=>o.remove();
      if(!r){ $('zg-hl').textContent='Keine Verbindung – das geht nur online.'; return; }
      r.ref('zoo_help/wanted').once('value').then(sn=>{ const v=sn.val()||{}, now=Date.now(), me=key(ZS.player); const L=Object.keys(v).filter(k=>k!==me&&v[k]&&now-v[k].t<20*60000).map(k=>({k,n:v[k].n}));
        const hl=$('zg-hl'); if(!hl) return; if(!L.length){ hl.innerHTML='😴 Gerade ist kein neuer Spieler online. Schau später wieder vorbei!'; return; }
        hl.innerHTML=L.map(p=>'<div style="display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,.12);border-radius:12px;padding:7px 10px;margin:5px 0"><b>👶 '+String(p.n).replace(/</g,'&lt;')+'</b><button data-k="'+p.k+'" data-n="'+String(p.n).replace(/"/g,'')+'" style="border:none;border-radius:10px;padding:6px 10px;background:#ffd54f;color:#3b2a10;font:900 .8rem Arial">🎁 Helfen</button></div>').join('');
        hl.querySelectorAll('button[data-k]').forEach(b=>b.onclick=()=>H.send(b.dataset.k,b.dataset.n,b)); }).catch(()=>{ const hl=$('zg-hl'); if(hl) hl.textContent='Fehler beim Laden.'; }); };
    H.send=function(k,n,btn){ const r=RTD(), st=hs(); if(!r) return; if(st.day!==today()){ st.day=today(); st.cnt=0; } if(st.cnt>=MAXSEND) return toast('🤝 Für heute hast du genug geholfen – danke! Morgen wieder.',3000);
      if(btn){ btn.disabled=true; btn.textContent='…'; }
      r.ref('zoo_help/gifts/'+k).push({from:String(ZS.player),t:Date.now()}).then(()=>{ st.cnt++; st.sent=(st.sent||0)+1; save(); toast('🤝 Du hast '+n+' geholfen. Danke!',3000); try{ ZGfx.confetti(60); }catch(e){} if(btn){ btn.textContent='✅ Gesendet'; } r.ref('zoo_help/wanted/'+k).remove().catch(()=>{}); }).catch(()=>{ toast('❌ Senden fehlgeschlagen'); if(btn){ btn.disabled=false; btn.textContent='🎁 Helfen'; } }); };
    H.listen=function(){ const r=RTD(); if(!r||H._on||!H.isNew()) return; H._on=1; r.ref('zoo_help/gifts/'+key(ZS.player)).on('child_added',sn=>{ const v=sn.val(), id=sn.key, st=hs(), z=zoo(); try{ sn.ref.remove(); }catch(e){} if(!v||st.seen.includes(id)||Date.now()-v.t>7*86400000) return; if(st.recv>=MAXRECV||(z.reb||0)>0) return; st.seen.push(id); if(st.seen.length>20) st.seen.shift(); st.recv++; z.mt=(z.mt||0)+GIFT; z.te=(z.te||0)+GIFT; try{ ZTread.tBoost('money',2,10); }catch(e){} try{ ZG._updHUD&&ZG._updHUD(); }catch(e){} save();
      const m=document.createElement('div'); m.style.cssText='position:fixed;inset:0;z-index:620;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:14px'; m.innerHTML='<div style="background:linear-gradient(160deg,#1b5e20,#2e7d32);border:3px solid #ffd54f;border-radius:18px;padding:18px;max-width:320px;color:#fff;text-align:center;font-family:Arial,sans-serif"><div style="font-size:2.6rem">🎁</div><div style="font:900 1.1rem Arial;color:#ffd54f">'+String(v.from).replace(/</g,'&lt;')+' hilft dir!</div><div style="margin:8px 0;font-size:.9rem">Du bekommst <b>'+GIFT+' MT</b> und <b>10 Min. Geld ×2</b>. Sag danke im Chat 😊</div><button style="width:100%;padding:9px;border:none;border-radius:12px;background:#ffd54f;font:900 .95rem Arial">Danke!</button></div>'; m.querySelector('button').onclick=()=>m.remove(); document.body.appendChild(m); try{ ZGfx.confetti(120); }catch(e){} }); };
    // ── Loop ──
    const rr=ZG.renderer, orig=rr.render.bind(rr); rr.render=function(s,c){ if(s===ZG.scene){ try{ G.frame(performance.now()/1000); }catch(e){} } return orig(s,c); };
    setInterval(()=>{ try{ H.announce(); H.listen(); }catch(e){} },120000); setTimeout(()=>{ try{ H.announce(); H.listen(); }catch(e){} },6000);
  }
  wait();
})();
