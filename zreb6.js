/* ═══ ZReb6 (v768): Rebirth 6 (nur Bu:) bis zur Veröffentlichung), Zoo-Zeitung (ab Rebirth 1), Wetter-Meister, Pfleger-Roboter, Hub ═══ */
(function(){
  'use strict';
  if(window.ZReb6) return;
  const $=id=>document.getElementById(id);
  const MC={}; const mb=(c,o)=>{ const k=c+(o?JSON.stringify(o):''); return MC[k]||(MC[k]=new THREE.MeshBasicMaterial(Object.assign({color:c},o||{}))); };
  const bx=(w,h,d,c,x,y,z,g,o)=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mb(c,o)); m.position.set(x,y,z); g.add(m); return m; };
  const cy=(a,b,h,c,x,y,z,g,s,o)=>{ const m=new THREE.Mesh(new THREE.CylinderGeometry(a,b,h,s||10),mb(c,o)); m.position.set(x,y,z); g.add(m); return m; };
  const sp=(c,r,x,y,z,g,o)=>{ const m=new THREE.Mesh(new THREE.SphereGeometry(r,10,8),mb(c,o)); m.position.set(x,y,z); g.add(m); return m; };
  const cv=(w,h)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; };
  const emoTex={}; const emo=e=>{ if(emoTex[e]) return emoTex[e]; const c=cv(128,128), g=c.getContext('2d'); g.font='96px serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(e,64,68); return emoTex[e]=new THREE.CanvasTexture(c); };
  const signTex=(t,w,h,bg,fg,sz)=>{ const c=cv(w,h), g=c.getContext('2d'); g.fillStyle=bg; g.fillRect(0,0,w,h); g.strokeStyle='#fff'; g.lineWidth=6; g.strokeRect(5,5,w-10,h-10); g.fillStyle=fg; g.font='900 '+(sz||h*.45)+'px Arial'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(t,w/2,h/2+2); return new THREE.CanvasTexture(c); };
  const price=p=>{ try{ return $mt(p); }catch(e){ return String(Math.round(p)); } };
  const zoo=()=>{ try{ return ZS.zoo; }catch(e){ return null; } };
  const toast=(m,ms)=>{ try{ ZP.toast(m,ms||2500); }catch(e){} };
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const RTD=()=>{ try{ return (typeof _rtdb!=='undefined'&&_rtdb&&State._useCloud())?_rtdb:null; }catch(e){ return null; } };
  const save=()=>{ try{ ZS.save&&ZS.save(); }catch(e){} };
  const hud=()=>{ try{ ZG._updHUD&&ZG._updHUD(); }catch(e){} };
  const day=()=>{ const d=new Date(); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); };
  const hash=s=>{ let h=2166136261; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; };
  const lsGet=k=>{ try{ return localStorage.getItem(k); }catch(e){ return null; } };
  const lsSet=(k,v)=>{ try{ localStorage.setItem(k,v); }catch(e){} };
  const modal=(id,html)=>{ let o=$(id); if(o) o.remove(); o=document.createElement('div'); o.id=id; o.style.cssText='position:fixed;inset:0;z-index:650;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;font-family:Arial,sans-serif;color:#fff';
    o.innerHTML='<div class="zr6-card" style="width:min(94vw,400px);max-height:92vh;overflow:auto;background:#1b2438;border:3px solid #ffd54f;border-radius:18px;padding:14px;text-align:center">'+html+'</div>';
    o.addEventListener('click',e=>{ if(e.target===o) o.remove(); }); document.body.appendChild(o); return o; };
  const GREEN='linear-gradient(135deg,#43a047,#2e7d32)', GREY='#555', GLASS='rgba(255,255,255,.14)';
  const bs=(bg)=>'width:100%;padding:10px;margin-top:6px;border:none;border-radius:12px;background:'+bg+';color:#fff;font:900 .9rem Arial;cursor:pointer';
  const fbtn=(id,txt,css)=>{ let b=$(id); if(b) return b; b=document.createElement('button'); b.id=id; b.textContent=txt; b.style.cssText='position:fixed;right:10px;z-index:129;width:46px;height:46px;border-radius:50%;border:3px solid #fff;font-size:1.35rem;box-shadow:0 3px 8px rgba(0,0,0,.4);display:none;'+css; document.body.appendChild(b); return b; };
  const nbtn=(id,txt,css)=>{ let b=$(id); if(b) return b; b=document.createElement('button'); b.id=id; b.textContent=txt; b.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:240px;z-index:130;display:none;padding:12px 22px;border:3px solid #fff;border-radius:30px;font:900 1rem Arial;box-shadow:0 4px 12px rgba(0,0,0,.45);'+css; document.body.appendChild(b); return b; };

  const Core=window.ZReb6={pub:false,feats:[],U:{$,mb,bx,cy,sp,cv,emo,signTex,price,zoo,toast,dist,RTD,save,hud,day,hash,modal,bs,GREEN,GREY,GLASS,nbtn,fbtn}};
  Core.isBu=function(){ try{ return String(ZS.player||'').toLowerCase()==='bu:)'; }catch(e){ return false; } };
  Core.isAdmin=function(){ try{ const n=String(ZS.player||'').toLowerCase(); return n==='bu:)'||n==='bu:3'; }catch(e){ return false; } };
  Core.on=function(){ return Core.isBu()||!!Core.pub; };
  Core.has=function(){ const z=zoo(); return Core.isBu()||!!(z&&(z.reb||0)>=6); };
  Core.r6=function(){ const z=zoo(); if(!z) return {}; return z.r6||(z.r6={}); };
  Core.tick=function(){ return Math.max((window.ZShop&&ZShop.tick)||0,0); };
  Core.addFeature=function(f){ if(!Core.feats.find(x=>x.id===f.id)) Core.feats.push(f); };
  Core.boostM=function(){ const b=Core.r6().bst; return (b&&b.u>Date.now())?b.m:1; };
  Core.setBoost=function(m,min){ const r=Core.r6(); const cur=r.bst&&r.bst.u>Date.now()?r.bst:null; r.bst={m:Math.max(m,cur?cur.m:1),u:Math.max(Date.now()+min*60000,cur?cur.u:0)}; save(); };
  Core.goto=function(x,z){ try{ ZG.pl.x=x; ZG.pl.z=z; ZG.pl.y=0; }catch(e){} };

  // ═══ Veröffentlichen ═══
  Core.publish=function(on){ if(!Core.isAdmin()) return; const r=RTD(); Core.pub=!!on; lsSet('zr6pub',on?'1':'0');
    if(r){ try{ if(on) r.ref('zoo_reb6/pub').set({t:Date.now(),by:ZS.player}); else r.ref('zoo_reb6/pub').remove(); }catch(e){} }
    toast(on?'✅ Rebirth 6 veröffentlicht – alle bekommen die Meldung!':'Rebirth 6 wieder nur für Bu:)',3500); Core._pubChanged(true); };
  Core.adminHTML=function(){ const on=Core.pub; return '<div style="font-size:.8rem;line-height:1.4;color:#fff;padding:6px">Status: <b style="color:'+(on?'#7dffb0':'#ffd54f')+'">'+(on?'VERÖFFENTLICHT – alle können Rebirth 6 machen':'Nur für Bu:)')+'</b><br>Kosten: 100\'000\'000\'000 MT · Einkommen ×100<br>Beim Veröffentlichen bekommen alle Spieler die Meldung „Rebirth 6 ist da“ (mit Tutorial beim Rebirth).</div>'
    +'<button id="zr6-pubbtn" onclick="if(confirm(\'Rebirth 6 für ALLE veröffentlichen?\'))ZReb6.publish(true)" style="'+bs(on?GREY:GREEN)+'">🚀 Veröffentlichen</button>'
    +'<button onclick="ZReb6.publish(false)" style="'+bs('#b71c1c')+'">↩️ Zurückziehen (nur Bu:))</button>'; };
  Core._pubChanged=function(local){ try{ if($('padmin-reb6-body')) $('padmin-reb6-body').innerHTML=Core.adminHTML(); }catch(e){}
    if(Core.pub&&!local&&!Core.isAdmin()&&lsGet('zr6seen')!=='1'){ lsSet('zr6seen','1'); Core.announce(); }
    if(Core.pub&&local) lsSet('zr6seen','1'); Core.ui(); };
  Core.announce=function(){ const z=zoo(); const rb=z?(z.reb||0):0;
    const o=modal('zr6-ann','<div style="font-size:3rem">🔄</div><div style="font:900 1.4rem Arial;color:#ffd54f;margin:4px 0">Rebirth 6 ist da!</div><div style="font-size:.9rem;line-height:1.45;margin:8px 0">Einkommen <b>×100</b>, Wetter-Meister, Pfleger-Roboter, Tier-Arena, Schatz-Insel, Legenden-Turm.<br>Rebirth 6 kostet <b>100\'000\'000\'000 MT</b>.'+(rb<5?'<br><span style="opacity:.8">Du bist bei Rebirth '+rb+' – erst die früheren Rebirths machen, dann geht es weiter.</span>':'')+'<br>Beim Rebirth zeigt dir ein Tutorial alles Neue.</div><button id="zr6-ann-x" style="'+bs(GREEN)+'">🎉 Super!</button>');
    $('zr6-ann-x').onclick=()=>o.remove(); try{ ZGfx.confetti(150); }catch(e){} };
  Core.listen=function(){ Core.pub=lsGet('zr6pub')==='1'; const r=RTD(); if(!r) return; Core.pub=false; try{ r.ref('zoo_reb6/pub').on('value',s=>{ const v=!!s.val(); const ch=v!==Core.pub; Core.pub=v; lsSet('zr6pub',v?'1':'0'); if(ch) Core._pubChanged(false); else Core.ui(); }); }catch(e){} };

  // ═══ Hub (👑) ═══
  Core.openHub=function(){ const z=zoo(); if(!z) return; const rows=Core.feats.map(f=>'<div style="display:flex;align-items:center;gap:8px;text-align:left;background:rgba(255,255,255,.08);border-radius:12px;padding:8px;margin-top:6px"><div style="font-size:1.7rem">'+f.ic+'</div><div style="flex:1;font-size:.8rem;line-height:1.3"><b>'+f.name+'</b><br><span style="opacity:.8">'+f.desc+'</span></div><button data-f="'+f.id+'" style="padding:8px 10px;border:none;border-radius:10px;background:#ffd54f;color:#2a1700;font:900 .78rem Arial">'+(f.btn||'📍 Hin')+'</button></div>').join('');
    const o=modal('zr6-hubov','<div style="font:900 1.2rem Arial;color:#ffd54f">👑 Rebirth-6-Hub</div><div style="font-size:.78rem;opacity:.85;margin-top:2px">Einkommen ×100 · alle neuen Dinge</div>'+rows+'<button id="zr6-hubx" style="'+bs(GLASS)+'">Schliessen</button>');
    $('zr6-hubx').onclick=()=>o.remove(); o.querySelectorAll('button[data-f]').forEach(b=>b.onclick=()=>{ const f=Core.feats.find(x=>x.id===b.dataset.f); o.remove(); try{ f&&f.go&&f.go(); }catch(e){ console.warn(e); } }); };
  Core.ui=function(){ const z=zoo(); const rd=window.ZStation&&ZStation.riding; const h=$('zr6-hub'); if(h) h.style.display=(z&&Core.has()&&!rd)?'block':'none';
    const p=$('zp-btn'); if(p) p.style.display=(z&&(Core.isBu()||(z.reb||0)>=1)&&!rd)?'block':'none'; };

  // ═══ Zoo-Zeitung (ab Rebirth 1) ═══
  const Paper=window.ZPaper={};
  const TASKS=[
    {k:'visits',ic:'👥',t:'Besucher kommen lassen',g:[25,40,60],m:1},
    {k:'earn',ic:'💰',t:'Geld verdienen',m:2},
    {k:'pet',ic:'🤲',t:'Tiere im Streichel-Zoo streicheln',g:[3,5],m:1},
    {k:'dig',ic:'⛏️',t:'Einen Schatz ausgraben',g:[1],m:3},
    {k:'map',ic:'🗺️',t:'Geheimnis-Karte öffnen',g:[1],m:.5},
    {k:'shop',ic:'🍦',t:'Das Kiosk öffnen',g:[1],m:.5},
    {k:'arena',ic:'⚔️',t:'Kämpfe in der Tier-Arena gewinnen',g:[1,2],m:3,r6:1},
    {k:'tower',ic:'🗼',t:'Stockwerke im Legenden-Turm schaffen',g:[5,10],m:3,r6:1},
    {k:'wx',ic:'🌦️',t:'Das Wetter ändern',g:[1],m:1,r6:1}
  ];
  const TIPS=['Tiere mit seltenerer Stufe bringen viel mehr Geld.','Das Kiosk gibt auf jede Besucher-Einnahme einen Extra-Anteil.','Streichel-Zoo, Höhle und Schatzpunkte stehen in der Geheimnis-Karte.','Gewitter bringen Pfützen – und Besucher mit Regenschirmen!','Die Gondel bringt dich schnell in dein Gehege.','Jeder Rebirth erhöht dein Einkommen dauerhaft.'];
  Paper.state=function(){ const z=zoo(); if(!z) return null; let p=z.paper; const d=day(); const h6=Core.has()?1:0;
    if(!p||p.d!==d||p.r6!==h6){ const pool=TASKS.filter(t=>!t.r6||h6); const seed=hash(d+'|'+(ZS.player||'')); const pick=[]; const idx=pool.map((_,i)=>i); let s=seed;
      while(pick.length<3&&idx.length){ s=(Math.imul(s,1103515245)+12345)>>>0; const j=s%idx.length; pick.push(pool[idx.splice(j,1)[0]]); }
      const tk=Math.max(Core.tick(),200);
      const keep=(p&&p.d===d)?p.p:{}; const keepAll=(p&&p.d===d)?p.all:0;
      p={d,r6:h6,p:keep,cl:[],all:keepAll,t:pick.map((t,i)=>{ let g=t.g?t.g[(seed>>>(i*3))%t.g.length]:0; if(t.k==='earn') g=Math.round(tk*[40,70,110][(seed>>>(i*3))%3]); return {k:t.k,g,rw:Math.max(1000,Math.round(tk*80*t.m))}; })}; z.paper=p; save(); }
    return p; };
  Paper.add=function(k,n){ try{ const p=Paper.state(); if(!p) return; p.p[k]=(p.p[k]||0)+(n||1); }catch(e){} };
  Paper.open=function(){ const z=zoo(); const p=Paper.state(); if(!p) return;
    const W=window.ZWeather&&ZWeather.cur, wn={clear:'Klar',sun:'Sonnig',rain:'Regen',storm:'STURM'}; let rating=''; try{ if(window.ZFx&&ZFx.rating){ const r=ZFx.rating(z.enc); rating=(typeof r==='number'?'⭐'.repeat(Math.max(0,Math.min(5,Math.round(r)))):String(r||'')); } }catch(e){}
    const tiers=(z.enc||[]).filter(e=>e&&e.animal).length, dt=new Date();
    const news=['<b>🌦️ Wetter:</b> '+(W?(wn[W.type]||W.type):'ruhig')+(Core.wxActive()?' (von dir bestimmt)':''),'<b>🐾 Tiere im Zoo:</b> '+tiers+(rating?' · Bewertung '+rating:''),'<b>💰 Pro Besucher-Tick:</b> ca. '+price(Core.tick())+' MT','<b>💡 Tipp des Tages:</b> '+TIPS[hash(p.d)%TIPS.length]];
    const done=p.t.filter(t=>(p.p[t.k]||0)>=t.g).length;
    const rows=p.t.map((t,i)=>{ const def=TASKS.find(x=>x.k===t.k), cur=Math.min(p.p[t.k]||0,t.g), ok=cur>=t.g, cl=p.cl.includes(i); const nm=t.k==='earn'?price(t.g)+' MT':t.g;
      return '<div style="background:rgba(255,255,255,.08);border-radius:12px;padding:8px;margin-top:6px;text-align:left"><div style="font-size:.82rem">'+def.ic+' '+def.t+': <b>'+nm+'</b></div><div style="height:8px;border-radius:5px;background:rgba(255,255,255,.18);margin:5px 0"><div style="height:100%;border-radius:5px;width:'+Math.round(cur/t.g*100)+'%;background:'+(ok?'#7dffb0':'#ffd54f')+'"></div></div><div style="display:flex;align-items:center;justify-content:space-between;font-size:.76rem"><span>'+(t.k==='earn'?price(cur)+' / '+price(t.g):cur+' / '+t.g)+' · 🎁 '+price(t.rw)+' MT</span><button data-i="'+i+'" style="padding:6px 12px;border:none;border-radius:9px;background:'+((!cl&&ok)?GREEN:GREY)+';color:#fff;font:900 .76rem Arial">'+(cl?'✅ Abgeholt':(ok?'Abholen':'Offen'))+'</button></div></div>'; }).join('');
    const o=modal('zp-ov','<div style="font:900 1.25rem Georgia,serif;color:#ffd54f">📰 Zoo-Zeitung</div><div style="font-size:.72rem;opacity:.7;margin-bottom:6px">'+dt.toLocaleDateString('de-CH',{weekday:'long',day:'numeric',month:'long'})+'</div><div style="text-align:left;font-size:.8rem;line-height:1.5;background:rgba(255,255,255,.07);border-radius:12px;padding:8px">'+news.join('<br>')+'</div><div style="font:900 .95rem Arial;margin-top:10px">📋 Tages-Aufgaben ('+done+'/3)</div>'+rows
      +'<div style="font-size:.76rem;margin-top:8px;opacity:.9">'+(p.all?'🎉 Bonus für alle 3 Aufgaben: erhalten!':'Alle 3 abgeholt = <b>Geld-Boost ×2 für 10 Minuten</b>')+'</div><button id="zp-x" style="'+bs(GLASS)+'">Schliessen</button>');
    $('zp-x').onclick=()=>o.remove();
    o.querySelectorAll('button[data-i]').forEach(b=>b.onclick=()=>{ const i=+b.dataset.i, t=p.t[i]; if(p.cl.includes(i)||(p.p[t.k]||0)<t.g) return; p.cl.push(i); z.mt=(z.mt||0)+t.rw; z.te=(z.te||0)+t.rw; hud(); toast('🎁 +'+price(t.rw)+' MT',2500);
      if(p.cl.length>=3&&!p.all){ p.all=1; Core.setBoost(2,10); toast('🎉 Alle Aufgaben! Geld-Boost ×2 für 10 Minuten!',4000); try{ ZGfx.confetti(120); }catch(e){} } save(); Paper.open(); }); };

  // ═══ Wetter-Meister (Rebirth 6) ═══
  const WX={clear:{ic:'🌤️',n:'Klar',m:1.1,d:'+10 % Geld'},sun:{ic:'☀️',n:'Sonne',m:1.3,d:'+30 % Geld'},rain:{ic:'🌧️',n:'Regen',m:1.2,d:'+20 % Geld'},storm:{ic:'⛈️',n:'Sturm',m:1.5,d:'+50 % Geld'}};
  Core.wxActive=function(){ const w=Core.r6().wx; return !!(w&&w.u>Date.now()); };
  Core.wxM=function(){ const w=Core.r6().wx; return (w&&w.u>Date.now()&&WX[w.t])?WX[w.t].m:1; };
  Core.wxOpen=function(){ const r=Core.r6(), w=r.wx||{}, now=Date.now(); const act=w.u>now, cd=!act&&w.c>now;
    let h='<div style="font:900 1.2rem Arial;color:#ffd54f">🌦️ Wetter-Meister</div><div style="font-size:.8rem;margin:6px 0;opacity:.9">Du bestimmst 10 Minuten lang das Wetter in deinem Zoo. Danach 30 Minuten Pause.</div>';
    if(act) h+='<div style="font-size:.85rem;margin:6px 0">Aktiv: <b>'+WX[w.t].ic+' '+WX[w.t].n+'</b> – noch '+Math.ceil((w.u-now)/60000)+' Min.</div>';
    if(cd) h+='<div style="font-size:.85rem;margin:6px 0">⏳ Pause: noch '+Math.ceil((w.c-now)/60000)+' Min.</div>';
    h+=Object.keys(WX).map(k=>'<button data-w="'+k+'" style="'+bs((act||cd)?GREY:GREEN)+'">'+WX[k].ic+' '+WX[k].n+' – '+WX[k].d+'</button>').join('')+'<button id="zwx-x" style="'+bs(GLASS)+'">Schliessen</button>';
    const o=modal('zwx-ov',h); $('zwx-x').onclick=()=>o.remove();
    o.querySelectorAll('button[data-w]').forEach(b=>b.onclick=()=>{ if(act||cd) return toast(act?'Das Wetter läuft schon.':'Noch Pause.'); const k=b.dataset.w; r.wx={t:k,u:Date.now()+10*60000,c:Date.now()+40*60000}; save(); Paper.add('wx',1); toast(WX[k].ic+' '+WX[k].n+' für 10 Minuten! '+WX[k].d,3500); try{ ZWeather.calc&&ZWeather.calc(); }catch(e){} o.remove(); }); };

  // ═══ Pfleger-Roboter (Rebirth 6) ═══
  const Rob=window.ZRobot={g:null,i:0,wait:2,fl:[],p:null};
  const MOD={tempo:{n:'Tempo',ic:'⚡',d:'Füttert schneller'},luck:{n:'Glück',ic:'🍀',d:'Chance auf Geld-Boost'},coll:{n:'Sammler',ic:'🪙',d:'Mehr Münzen pro Fütterung'}};
  Rob.mods=function(){ const r=Core.r6(); return r.rob||(r.rob={tempo:0,luck:0,coll:0}); };
  Rob.cost=function(l){ return Math.max(25000,Math.round(Math.max(Core.tick(),100)*600*Math.pow(2,l))); };
  Rob.build=function(){ try{ if(Rob.g||!ZG.scene) return; const g=new THREE.Group(); bx(1.4,1.2,1.0,0xcfd8dc,0,1.0,0,g); bx(1.1,.7,.9,0x90a4ae,0,1.85,0,g); bx(.9,.5,.05,0x263238,0,1.9,.47,g); [-.2,.2].forEach(x=>sp(0x00e5ff,.09,x,1.92,.5,g)); cy(.04,.04,.6,0x90a4ae,0,2.45,0,g,6); sp(0xff5252,.12,0,2.8,0,g);
      [-.6,.6].forEach(x=>{ cy(.34,.34,.3,0x37474f,x,.34,0,g,10).rotation.z=Math.PI/2; bx(.18,.8,.18,0x90a4ae,x*1.25,1.1,.2,g); }); const lb=ZG._txt('🤖 Pfleger',.5,'#fff'); lb.scale.set(3.2,.8,1); lb.position.set(0,3.6,0); g.add(lb);
      g.visible=false; ZG.scene.add(g); Rob.g=g; const q=Rob.points()[0]||ZG.pl; Rob.p={x:q.x+2,z:q.z+2}; }catch(e){ console.warn('ZRobot',e); } };
  Rob.points=function(){ try{ const l=ZG._slotEncPos(typeof ZS.mySlot==='number'?ZS.mySlot:0); const a=(l.positions||[]).map(p=>({x:p.x,z:p.z})); return a.length?a:[{x:l.center.x,z:l.center.z}]; }catch(e){ return []; } };
  Rob.pop=function(e,x,z){ const s=new THREE.Sprite(new THREE.SpriteMaterial({map:emo(e),transparent:true})); s.scale.set(1.4,1.4,1); s.position.set(x,2.2,z); ZG.scene.add(s); Rob.fl.push({s,t:0}); };
  Rob.feed=function(){ const z=zoo(); if(!z) return; const m=Rob.mods(); const base=Math.max(100,Core.tick()*.8); const rew=Math.round(base*(1+m.coll*.6)); z.mt=(z.mt||0)+rew; z.te=(z.te||0)+rew; hud(); const ic=['🍖','🧹','🤲'][Rob.i%3]; Rob.pop(ic,Rob.p.x,Rob.p.z); Rob.pop('🪙',Rob.p.x+.6,Rob.p.z);
    if(m.luck>0&&Math.random()<.04*m.luck){ Core.setBoost(1.5,1); toast('🍀 Glücks-Boost! ×1.5 für 1 Minute',2500); } };
  Rob.frame=function(dt,t){ if(!Rob.g||!Rob.p) return; const on=Core.has(); Rob.g.visible=on; if(!on){ Rob.fl.forEach(f=>ZG.scene.remove(f.s)); Rob.fl=[]; return; }
    const pts=Rob.points(); if(!pts.length) return; const m=Rob.mods(); const tg=pts[Rob.i%pts.length]; const dx=tg.x+1.6-Rob.p.x, dz=tg.z+1.6-Rob.p.z, d=Math.hypot(dx,dz);
    if(Rob.wait>0){ Rob.wait-=dt; }
    else if(d>.5){ const v=3+m.tempo*.7; Rob.p.x+=dx/d*v*dt; Rob.p.z+=dz/d*v*dt; Rob.g.rotation.y=Math.atan2(dx,dz); Rob.g.position.y=Math.abs(Math.sin(t*9))*.05; }
    else { Rob.feed(); Rob.i++; Rob.wait=Math.max(1.2,4-m.tempo*.5); }
    Rob.g.position.x=Rob.p.x; Rob.g.position.z=Rob.p.z;
    for(let k=Rob.fl.length-1;k>=0;k--){ const f=Rob.fl[k]; f.t+=dt; f.s.position.y+=dt*1.6; f.s.material.opacity=Math.max(0,1-f.t/1.3); if(f.t>1.3){ ZG.scene.remove(f.s); Rob.fl.splice(k,1); } } };
  Rob.open=function(){ const z=zoo(); const m=Rob.mods(); const rows=Object.keys(MOD).map(k=>{ const l=m[k], c=Rob.cost(l), max=l>=5; return '<div style="background:rgba(255,255,255,.08);border-radius:12px;padding:8px;margin-top:6px;text-align:left"><div style="font-size:.85rem">'+MOD[k].ic+' <b>'+MOD[k].n+'</b> Stufe '+l+'/5<br><span style="opacity:.8;font-size:.76rem">'+MOD[k].d+'</span></div><button data-m="'+k+'" style="'+bs((!max&&(z.mt||0)>=c)?GREEN:GREY)+'">'+(max?'Maximal':'Ausbauen – '+price(c)+' MT')+'</button></div>'; }).join('');
    const o=modal('zrob-ov','<div style="font-size:2.4rem">🤖</div><div style="font:900 1.15rem Arial;color:#ffd54f">Pfleger-Roboter</div><div style="font-size:.8rem;opacity:.9;margin:4px 0">Füttert, putzt und streichelt deine Tiere und bringt dir Münzen.</div>'+rows+'<button id="zrob-x" style="'+bs(GLASS)+'">Schliessen</button>'); $('zrob-x').onclick=()=>o.remove();
    o.querySelectorAll('button[data-m]').forEach(b=>b.onclick=()=>{ const k=b.dataset.m, l=m[k], c=Rob.cost(l); if(l>=5) return; if((z.mt||0)<c) return toast('❌ Zu wenig MT!'); z.mt-=c; m[k]=l+1; hud(); save(); toast('✅ '+MOD[k].n+' Stufe '+(l+1),2000); Rob.open(); }); };

  // ═══ Besucher-Tick: Zeitungs-Zähler + Boosts ═══
  Core.hookVisitor=function(){ const vi=ZG._visitor; ZG._visitor=function(){ const z=zoo(), m0=z?z.mt:0; const res=vi.apply(this,arguments); try{ if(z){ const d=z.mt-m0; if(d>0){ Paper.add('visits',1); Paper.add('earn',d);
      if(Core.has()){ const m=Core.wxM()*Core.boostM(); if(m>1){ const b=d*(m-1); z.mt+=b; z.te=(z.te||0)+b; } } } } }catch(e){} return res; }; };
  // ═══ UI + Frame ═══
  let uiOk=false;
  const ui=()=>{ if(uiOk) return; uiOk=true;
    fbtn('zr6-hub','👑','bottom:244px;background:linear-gradient(135deg,#ffd54f,#ff9800);color:#2a1700').onclick=()=>Core.openHub();
    fbtn('zp-btn','📰','bottom:298px;background:#f5efdc').onclick=()=>Paper.open();
    nbtn('zr6-rob','🤖 Roboter ausbauen','background:linear-gradient(135deg,#00bcd4,#0097a7);color:#fff').onclick=()=>Rob.open(); };
  Core.addFeature({id:'wx',ic:'🌦️',name:'Wetter-Meister',desc:'Bestimme 10 Min. das Wetter – jedes gibt Geld-Bonus',btn:'🌦️ Öffnen',go:()=>Core.wxOpen()});
  Core.addFeature({id:'rob',ic:'🤖',name:'Pfleger-Roboter',desc:'Füttert deine Tiere. Module: Tempo, Glück, Sammler',btn:'🤖 Zum Roboter',go:()=>{ const p=Rob.p; if(p) Core.goto(p.x-3,p.z-3); Rob.open(); }});
  let last=performance.now(), upT=0;
  const frame=()=>{ const now=performance.now(), dt=Math.min(.1,(now-last)/1000); last=now; try{ Rob.frame(dt,now/1000); }catch(e){} upT+=dt; if(upT<.4) return; upT=0; try{ Core.ui(); const pl=ZG.pl; const rb=$('zr6-rob'); if(rb) rb.style.display=(Core.has()&&Rob.p&&pl&&dist(pl,Rob.p)<7&&!(window.ZStation&&ZStation.riding))?'block':'none'; }catch(e){} };
  const boot=()=>{ try{ if(typeof ZG==='undefined'||!ZG.scene||!ZG.renderer||!ZG.cam||!zoo()||typeof ZS.mySlot!=='number') return setTimeout(boot,1000);
      ui(); Rob.build(); Core.listen(); Core.hookVisitor();
      if(window.ZWeather&&!ZWeather._r6){ ZWeather._r6=1; const c0=ZWeather.calc; ZWeather.calc=function(){ const w=Core.r6().wx; if(w&&w.u>Date.now()&&WX[w.t]){ return ZWeather.cur={type:w.t,dir:0,ovr:1,until:w.u}; } return c0.apply(this,arguments); }; }
      if(window.ZShop&&ZShop.open&&!ZShop._p){ ZShop._p=1; const o0=ZShop.open; ZShop.open=function(){ Paper.add('shop',1); return o0.apply(this,arguments); }; }
      if(window.ZSecMap&&!ZSecMap._p){ ZSecMap._p=1; const o1=ZSecMap.open; ZSecMap.open=function(){ const had=!!$('zmap-ov'); if(!had) Paper.add('map',1); const r=o1.apply(this,arguments); try{ if(!had&&Core.mapExtra) Core.mapExtra(); }catch(e){} return r; }; const d0=ZSecMap.dig; ZSecMap.dig=function(){ const z=zoo(), m0=z?z.mt:0; const r=d0.apply(this,arguments); if(z&&z.mt>m0) Paper.add('dig',1); return r; }; }
      if(window.ZPet&&!ZPet._p){ ZPet._p=1; const p0=ZPet.pet; ZPet.pet=function(){ const z=zoo(), m0=z?z.mt:0, c0=JSON.stringify((z&&z.pet)||{}); const r=p0.apply(this,arguments); if(z&&(z.mt>m0||JSON.stringify(z.pet||{})!==c0)) Paper.add('pet',1); return r; }; }
      const r=ZG.renderer, o=r.render.bind(r); r.render=function(s,c){ if(s===ZG.scene){ try{ frame(); }catch(e){} } return o(s,c); };
    }catch(e){ console.warn('ZReb6 boot',e); setTimeout(boot,1500); } };
  window.addEventListener('load',()=>setTimeout(boot,2300));
})();
