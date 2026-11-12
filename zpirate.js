/* ═══ ZPirate (v784): 🏴‍☠️ Piraten-Welt – Rebirth 7. Eigenes 3D-Meer, gemeinsame Meere (Multiplayer), Schiff, Inseln, Seeschlangen, Kraken-Boss, Crew, Flaschenpost ═══ */
(function(){
  'use strict';
  if(window.ZPirate) return;
  const wait=()=>{ if(typeof ZS==='undefined'||!ZS.zoo||!ZS.player||typeof ZP==='undefined'||typeof THREE==='undefined') return setTimeout(wait,2000); try{ init(); }catch(e){ console.warn('ZPirate',e); } };
  function init(){
    const $=id=>document.getElementById(id), zoo=()=>ZS.zoo;
    const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const toast=(m,t)=>{ try{ ZP.toast(m,t||2500); }catch(e){} };
    const RTD=()=>{ try{ return (typeof _rtdb!=='undefined'&&_rtdb&&State._useCloud())?_rtdb:null; }catch(e){ return null; } };
    const key=n=>String(n).toLowerCase().replace(/[.#$\[\]\/]/g,'_');
    const me=()=>ZS.player, myK=()=>key(me());
    const P=window.ZPirate={open:false};
    const isAdm=()=>{ try{ return !!(ZS.isAdmin||(typeof ZAdmin!=='undefined'&&ZAdmin._hasAccess)); }catch(e){ return false; } };
    P.has=()=>((zoo().reb||0)>=7)||isAdm();
    const pir=()=>{ const z=zoo(); return z.pir||(z.pir={gold:0,total:0,u:{spd:0,hull:0,can:0,cargo:0},crew:{parrot:0,monkey:0,kraken:0,turtle:0},dug:{},cd:{},bd:{id:0,dmg:0},bc:0,sent:{day:'',n:0},kills:0}); };
    let lastSave=0; const save=(f)=>{ const n=Date.now(); if(!f&&n-lastSave<4000) return; lastSave=n; try{ ZS.save&&ZS.save(); }catch(e){} };
    // ═══════ Werte ═══════
    const UP={spd:['⛵','Segel','Tempo',300],hull:['🛡️','Rumpf','Leben',300],can:['💣','Kanonen','Schaden',400],cargo:['📦','Laderaum','Gold-Bonus',500]};
    const CREW={parrot:['🦜','Papagei','+10 % Gold pro Stufe',250],monkey:['🐒','Affe','+20 % Gold beim Graben',300],kraken:['🐙','Kraken-Freund','+12 % Kanonen-Schaden',400],turtle:['🐢','Schildkröte','+15 % Rumpf-Leben',300]};
    const upCost=(k,l)=>Math.round(UP[k][3]*Math.pow(1.7,l)), crCost=(k,l)=>Math.round(CREW[k][3]*Math.pow(2,l));
    const MAXU=10, MAXC=5;
    const maxHull=()=>Math.round((100+30*pir().u.hull)*(1+.15*pir().crew.turtle));
    const speed=()=>16+1.8*pir().u.spd;
    const dmgMul=()=>(1+.35*pir().u.can)*(1+.12*pir().crew.kraken);
    const goldMul=()=>(1+.2*pir().u.cargo)*(1+.1*pir().crew.parrot);
    const addGold=(g)=>{ g=Math.round(g); const p=pir(); p.gold+=g; if(g>0) p.total=(p.total||0)+g; hud(); save(); pushRank(); return g; };
    // ═══════ Welt ═══════
    const ISL={
      hafen:{n:'Heimat-Hafen',ic:'⚓',x:0,z:0,r:26,col:0xe6c78c,top:0x7cb342},
      schatz:{n:'Schatzinsel',ic:'💰',x:-130,z:-95,r:30,col:0xf0d9a0,top:0x558b2f},
      schaedel:{n:'Totenkopf-Insel',ic:'💀',x:140,z:-120,r:28,col:0x6d6a66,top:0x4e4a46},
      handel:{n:'Händler-Insel',ic:'🏪',x:115,z:115,r:24,col:0xe6c78c,top:0x8bc34a},
      muschel:{n:'Muschel-Insel',ic:'🐚',x:-115,z:115,r:22,col:0xffe0b2,top:0x9ccc65}
    };
    const BOSSC={x:0,z:-215}, LIM=290;
    const DIG=5; const digPos=i=>{ const a=i/DIG*6.283+.6, I=ISL.schatz; return {x:I.x+Math.cos(a)*I.r*.92,z:I.z+Math.sin(a)*I.r*.92}; };
    // ═══════ 3D-Hilfen ═══════
    let R=null,S=null,CAM=null,root=null,ov=null,cv=null;
    const mat=(c)=>new THREE.MeshLambertMaterial({color:c}), mb=(c)=>new THREE.MeshBasicMaterial({color:c});
    const bx=(w,h,d,c,x,y,z,g)=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c)); m.position.set(x,y,z); (g||S).add(m); return m; };
    const cyl=(a,b,h,c,x,y,z,g,s)=>{ const m=new THREE.Mesh(new THREE.CylinderGeometry(a,b,h,s||10),mat(c)); m.position.set(x,y,z); (g||S).add(m); return m; };
    const ball=(r,c,x,y,z,g)=>{ const m=new THREE.Mesh(new THREE.SphereGeometry(r,8,6),mat(c)); m.position.set(x,y,z); (g||S).add(m); return m; };
    const eTex={}; const emo=e=>{ if(eTex[e]) return eTex[e]; const c=document.createElement('canvas'); c.width=c.height=96; const x=c.getContext('2d'); x.font='72px sans-serif'; x.textAlign='center'; x.textBaseline='middle'; x.fillText(e,48,52); return eTex[e]=new THREE.CanvasTexture(c); };
    const spr=(e,s,x,y,z,g)=>{ const m=new THREE.Sprite(new THREE.SpriteMaterial({map:emo(e),transparent:true})); m.scale.set(s,s,1); m.position.set(x,y,z); (g||S).add(m); return m; };
    const lbl=(t,col,w)=>{ const c=document.createElement('canvas'); c.width=256; c.height=64; const x=c.getContext('2d'); x.font='bold 30px Arial'; x.textAlign='center'; x.lineWidth=6; x.strokeStyle='rgba(0,0,0,.75)'; x.strokeText(t,128,42); x.fillStyle=col||'#fff'; x.fillText(t,128,42); const m=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthTest:false})); m.scale.set(w||12,3,1); return m; };
    const hash=s=>{ let h=0; for(const ch of String(s)) h=(h*31+ch.charCodeAt(0))|0; return Math.abs(h); };
    const flagCol=n=>new THREE.Color().setHSL((hash(n)%360)/360,.75,.55);
    function mkShip(name,own){ const g=new THREE.Group(); const body=new THREE.Group(); g.add(body); g.userData.body=body;
      bx(4.2,1.4,9,0x6d4c41,0,.9,0,body); bx(3.4,1,2.6,0x8d6e63,0,1.2,3.8,body); bx(3.6,.5,6,0x5d4037,0,1.7,-.3,body);
      cyl(.2,.25,9,0x4e342e,0,5.5,0,body,6); const sail=bx(.1,5.5,5.2,0xfff8e1,0,6,0,body); const f=bx(.1,1.1,1.8,0xffffff,0,10.2,.9,body); f.material.color=flagCol(name);
      bx(.12,1,1.2,0x212121,0,8.4,-1.6,body).visible=false; for(let i=0;i<3;i++) ball(.38,0x212121,i%2?1.5:-1.5,1.8,-1.5+i*1.5,body);
      const l=lbl(name,own?'#ffd54f':'#fff',11); l.position.set(0,13,0); g.add(l); return g; }
    // ═══════ Szene ═══════
    const ships={}; let me3=null, serp=[], bottles={}, boss3=null, wave=[], balls=[], isl3={};
    const st={x:0,z:20,h:0,v:0,hp:100,inp:{x:0,y:0},fireCd:0,dead:0,bite:0};
    function build(){ if(S) return; R=new THREE.WebGLRenderer({canvas:cv,antialias:false}); R.setPixelRatio(Math.min(devicePixelRatio||1,2)); S=new THREE.Scene(); S.background=new THREE.Color(0x9fd8ff); S.fog=new THREE.Fog(0x9fd8ff,200,460);
      CAM=new THREE.PerspectiveCamera(55,1,.5,700); S.add(new THREE.AmbientLight(0xffffff,.78)); const dl=new THREE.DirectionalLight(0xfff2cc,.7); dl.position.set(60,120,40); S.add(dl);
      const sea=new THREE.Mesh(new THREE.PlaneGeometry(1400,1400),mb(0x1e88e5)); sea.rotation.x=-Math.PI/2; S.add(sea);
      const rim=new THREE.Mesh(new THREE.RingGeometry(LIM,LIM+4,64),mb(0xffffff)); rim.rotation.x=-Math.PI/2; rim.position.y=.3; S.add(rim);
      for(let i=0;i<70;i++){ const w=bx(3+Math.random()*3,.12,.5,0xbbdefb,(Math.random()-.5)*600,.2,(Math.random()-.5)*600); w.userData.p=Math.random()*6; wave.push(w); }
      Object.keys(ISL).forEach(k=>{ const I=ISL[k], g=new THREE.Group(); g.position.set(I.x,0,I.z); S.add(g); isl3[k]=g;
        cyl(I.r,I.r+4,3,I.col,0,.8,0,g,24); cyl(I.r*.62,I.r*.85,3,I.top,0,2.6,0,g,20);
        const pn=k==='schaedel'?3:7; for(let i=0;i<pn;i++){ const a=i*2.4+hash(k)%7, rr=Math.random()*I.r*.5; const px=Math.cos(a)*rr, pz=Math.sin(a)*rr; cyl(.4,.55,6,0x6d4c41,px,7,pz,g,6); [0,1,2,3].forEach(q=>{ const l=bx(.5,.15,4.5,k==='schaedel'?0x5d4037:0x2e7d32,px,10,pz,g); l.rotation.y=q*Math.PI/2; l.position.x+=Math.cos(q*Math.PI/2)*1.4; l.position.z+=Math.sin(q*Math.PI/2)*1.4; l.rotation.z=.25; }); }
        const nm=lbl(I.ic+' '+I.n,'#fff',16); nm.position.set(0,22,0); g.add(nm);
        if(k==='hafen'){ bx(18,.6,5,0x8d6e63,0,1.7,I.r+3,g); [-6,6].forEach(x=>bx(2,6,2,0xd7ccc8,x,5,-8,g)); bx(14,1,7,0xc62828,-0,9,-8,g).scale.y=.6; spr('🏠',9,-8,8,-4,g); spr('⚓',7,8,8,-4,g); }
        if(k==='schatz'){ for(let i=0;i<DIG;i++){ const d=digPos(i); const s=spr('❌',4,d.x-I.x,3.5,d.z-I.z,g); s.userData.dig=i; } spr('💰',8,0,10,0,g); }
        if(k==='schaedel'){ spr('💀',16,0,14,0,g); spr('🏴‍☠️',8,10,12,6,g); }
        if(k==='handel'){ spr('🏪',11,0,10,0,g); spr('🧺',5,8,5,5,g); }
        if(k==='muschel'){ [0,1,2,3,4].forEach(i=>spr('🐚',4,Math.cos(i*1.3)*10,3.5,Math.sin(i*1.3)*10,g)); } });
      me3=mkShip(me(),true); S.add(me3); onResize(); }
    function onResize(){ if(!R||!ov) return; const w=ov.clientWidth||innerWidth, h=ov.clientHeight||innerHeight; R.setSize(w,h,false); cv.style.width='100%'; cv.style.height='100%'; CAM.aspect=w/h; CAM.updateProjectionMatrix(); }
    // ═══════ Multiplayer: Schiffe anderer ═══════
    let others={}, lastPos=0, posRef=null, bossRef=null, botRef=null, listening=false, rankRef=null;
    function listen(){ const d=RTD(); if(!d||listening) return; listening=true;
      try{ posRef=d.ref('zoo_pirate/pos'); const up=s=>{ const v=s.val(), k=s.key; if(!v||k===myK()) return; others[k]=Object.assign(others[k]||{},v,{k}); }; posRef.on('child_added',up); posRef.on('child_changed',up); posRef.on('child_removed',s=>{ const k=s.key; delete others[k]; if(ships[k]){ S.remove(ships[k]); delete ships[k]; } });
        d.ref('zoo_pirate/pos/'+myK()).onDisconnect().remove(); }catch(e){}
      try{ bossRef=d.ref('zoo_pirate/boss'); bossRef.on('value',s=>{ const v=s.val(); if(!v) { bossRef.transaction(c=>c||{id:1,hp:BMAX,max:BMAX,deadUntil:0}); return; } setBoss(v); }); }catch(e){}
      try{ botRef=d.ref('zoo_pirate/bottles').limitToLast(12); botRef.on('child_added',s=>addBottle(s.key,s.val())); botRef.on('child_removed',s=>delBottle(s.key)); }catch(e){}
      try{ rankRef=d.ref('zoo_pirate/rank'); }catch(e){} }
    function unlisten(){ const d=RTD(); try{ if(d){ d.ref('zoo_pirate/pos/'+myK()).remove(); } posRef&&posRef.off(); bossRef&&bossRef.off(); botRef&&botRef.off(); }catch(e){} listening=false; others={}; Object.keys(ships).forEach(k=>{ S&&S.remove(ships[k]); delete ships[k]; }); }
    function pushPos(t){ const d=RTD(); if(!d||t-lastPos<1500) return; lastPos=t; try{ d.ref('zoo_pirate/pos/'+myK()).set({n:me(),x:Math.round(st.x*10)/10,z:Math.round(st.z*10)/10,h:Math.round(st.h*100)/100,t:Date.now()}); }catch(e){} }
    let lastRank=0; function pushRank(){ const d=RTD(); const n=Date.now(); if(!d||n-lastRank<30000) return; lastRank=n; try{ d.ref('zoo_pirate/rank/'+myK()).set({n:me(),g:Math.round(pir().total||0)}); }catch(e){} }
    // ═══════ Boss (gemeinsam) ═══════
    const BMAX=2500; let B={id:1,hp:BMAX,max:BMAX,deadUntil:0}; let pend=0, lastFlush=0;
    function setBoss(v){ B=v; const p=pir(); if(v.hp<=0 && p.bd.id===v.id && p.bd.dmg>0 && (p.bc||0)<v.id){ p.bc=v.id; const g=addGold(400*goldMul()); try{ ZTread.tBoost('money',2,15); }catch(e){} toast('🦑 Kraken besiegt! +'+g+' 🪙 und Zoo-Geld ×2 für 15 Min!',6000); try{ ZGfx.confetti(150); }catch(e){} save(true); }
      if(v.hp<=0 && v.deadUntil && Date.now()>v.deadUntil) respawnBoss(); }
    function respawnBoss(){ const d=RTD(); if(d&&bossRef){ bossRef.transaction(c=>{ if(c&&c.hp<=0&&Date.now()>(c.deadUntil||0)) return {id:c.id+1,hp:BMAX,max:BMAX,deadUntil:0}; return c; }); } else if(B.hp<=0){ B={id:B.id+1,hp:BMAX,max:BMAX,deadUntil:0}; } }
    function hitBoss(d){ const p=pir(); if(B.hp<=0) return; if(p.bd.id!==B.id) p.bd={id:B.id,dmg:0}; p.bd.dmg+=d; B.hp=Math.max(0,B.hp-d); if(B.hp<=0){ B.deadUntil=Date.now()+600000; setBoss(Object.assign({},B)); } pend+=d; }
    function flushBoss(t){ if(!pend||t-lastFlush<1500) return; lastFlush=t; const dm=pend; pend=0; if(bossRef&&RTD()){ bossRef.transaction(c=>{ if(!c||c.hp<=0) return c; c.hp=Math.max(0,c.hp-dm); if(c.hp<=0) c.deadUntil=Date.now()+600000; return c; }); } }
    // ═══════ Flaschenpost ═══════
    function addBottle(id,v){ if(!v||bottles[id]||!S) return; if(Date.now()-(v.t||0)>86400000) return; const a=(hash(id)%628)/100, r=60+(hash(id+'r')%190); const b={id,v,x:Math.cos(a)*r*.9,z:Math.sin(a)*r*.9}; const s=spr('🍾',4,b.x,2.2,b.z); b.s=s; bottles[id]=b; }
    function delBottle(id){ const b=bottles[id]; if(b){ S&&S.remove(b.s); delete bottles[id]; } }
    function tryBottles(){ Object.keys(bottles).forEach(id=>{ const b=bottles[id]; if(Math.hypot(b.x-st.x,b.z-st.z)<7){ if(b.v.from===me()) return; delete bottles[id]; S.remove(b.s); const done=(g,msg)=>{ addGold(g); showMsg('🍾 Flaschenpost von '+esc(b.v.from),esc(b.v.msg||'')+'<div style="margin-top:8px;color:#ffd54f;font-weight:900">+'+g+' 🪙</div>'); };
        const d=RTD(); if(d){ d.ref('zoo_pirate/bottles/'+id).transaction(c=>c?null:c,(err,ok,snap)=>{ if(ok) done(Math.round((b.v.gold||40)*goldMul()),b.v.msg); }); } else done(b.v.gold||40); } }); }
    P.sendBottle=function(msg){ const p=pir(), day=new Date().toISOString().slice(0,10); if(p.sent.day!==day) p.sent={day,n:0}; if(p.sent.n>=3) return toast('📅 Maximal 3 Flaschen pro Tag.'); msg=String(msg||'').trim().slice(0,60); if(msg.length<2) return toast('Schreib eine kurze Nachricht.'); if(p.gold<50) return toast('Du brauchst 50 🪙.');
      try{ if(window.ZRules&&ZRules.check){ const v=ZRules.check(msg); if(v&&v.block){ ZRules.report&&ZRules.report(v.rn,msg); return toast('🚫 Regel '+v.rn+': '+v.why,4000); } } }catch(e){}
      p.gold-=50; p.sent.n++; const o={from:me(),msg,gold:40,t:Date.now()}; const d=RTD(); if(d){ try{ d.ref('zoo_pirate/bottles').push(o); }catch(e){} } else addBottle('l'+Date.now(),o); hud(); save(true); toast('🍾 Flasche ins Meer geworfen!'); closeMenu(); };
    // ═══════ Monster ═══════
    function spawnSerp(){ if(serp.length>=3||st.dead) return; const a=Math.random()*6.283, r=55+Math.random()*40; const x=st.x+Math.cos(a)*r, z=st.z+Math.sin(a)*r; if(Math.hypot(x,z)>LIM-10||Object.values(ISL).some(I=>Math.hypot(x-I.x,z-I.z)<I.r+8)||Math.hypot(x,z)<50) return; const e=Math.random()<.5?'🐍':'🦈'; const m={x,z,hp:40,max:40,s:spr(e,9,x,3,z),bar:bx(6,.5,.5,0x00e676,x,8,z),t:0}; serp.push(m); }
    function killSerp(m,k){ S.remove(m.s); S.remove(m.bar); serp.splice(serp.indexOf(m),1); if(k){ const p=pir(); p.kills=(p.kills||0)+1; const g=addGold((18+Math.random()*14)*goldMul()); toast('💥 Monster besiegt! +'+g+' 🪙',1800); } }
    // ═══════ Schiessen ═══════
    function fire(){ if(st.dead||st.fireCd>0) return; let tg=null,td=70; serp.forEach(m=>{ const d=Math.hypot(m.x-st.x,m.z-st.z); if(d<td){ td=d; tg={t:'s',m,x:m.x,z:m.z}; } }); if(B.hp>0){ const bp=bossPos(); const d=Math.hypot(bp.x-st.x,bp.z-st.z); if(d<95&&d-12<td){ td=d; tg={t:'b',x:bp.x,z:bp.z}; } }
      if(!tg) return toast('🎯 Kein Ziel in Reichweite.',1200); st.fireCd=.8; const b=ball(.9,0x212121,st.x,3,st.z); balls.push({m:b,sx:st.x,sz:st.z,tx:tg.x,tz:tg.z,t:0,tg,dur:Math.max(.2,td/110)}); }
    const bossPos=()=>{ const t=Date.now()/4000; return {x:BOSSC.x+Math.cos(t)*28,z:BOSSC.z+Math.sin(t)*20}; };
    function hurt(d){ if(st.dead) return; st.hp-=d; hud(); if(st.hp<=0){ st.dead=1; const p=pir(); const lose=Math.round(p.gold*.1); p.gold-=lose; save(true); toast('☠️ Dein Schiff ist gesunken! −'+lose+' 🪙. Du startest im Hafen neu.',4500); setTimeout(()=>{ st.x=0; st.z=ISL.hafen.r+14; st.hp=maxHull(); st.dead=0; hud(); },2200); } }
    // ═══════ Aktion (Insel-Interaktion) ═══════
    function nearIsle(){ let best=null,bd=1e9; Object.keys(ISL).forEach(k=>{ const I=ISL[k], d=Math.hypot(st.x-I.x,st.z-I.z); if(d<I.r+16&&d<bd){ bd=d; best=k; } }); return best; }
    function digSpot(){ let bi=-1,bd=22; for(let i=0;i<DIG;i++){ const d=digPos(i), dd=Math.hypot(st.x-d.x,st.z-d.z); if(dd<bd){ bd=dd; bi=i; } } return bi; }
    const cdLeft=(k)=>Math.max(0,((pir().cd[k]||0)-Date.now())/60000);
    function ctx(){ const k=nearIsle(); if(!k) return null;
      if(k==='hafen') return {l:'⚓ Hafen',f:openPort};
      if(k==='handel') return {l:'🏪 Händler',f:openTrade};
      if(k==='schatz'){ const i=digSpot(); if(i<0) return {l:'⛵ Näher ans ❌',f:()=>toast('Segle ganz nah an ein ❌ am Strand.')}; const w=cdLeft('d'+i); if(w>0) return {l:'⏳ '+Math.ceil(w)+' Min',f:()=>toast('Hier ist schon abgegraben. Probier ein anderes ❌!')}; return {l:'⛏️ Graben',f:()=>{ const p=pir(); p.cd['d'+i]=Date.now()+300000; const g=addGold((40+Math.random()*80)*goldMul()*(1+.2*p.crew.monkey)); toast('⛏️ Schatz gefunden! +'+g+' 🪙',2500); if(Math.random()<.5){ spawnSerp(); toast('⚠️ Ein Monster hat dich gehört!',2000); } try{ ZGfx.confetti(30); }catch(e){} save(true); }}; }
      if(k==='schaedel'){ const w=cdLeft('s'); if(w>0) return {l:'⏳ '+Math.ceil(w)+' Min',f:()=>toast('Der Fluch ruht noch.')}; return {l:'💀 Fluch-Schatz',f:()=>{ const p=pir(); p.cd.s=Date.now()+1800000; const g=addGold((220+Math.random()*180)*goldMul()); toast('💀 Fluch-Schatz! +'+g+' 🪙 … aber Monster tauchen auf!',3500); spawnSerp(); spawnSerp(); try{ ZGfx.confetti(50); }catch(e){} save(true); }}; }
      if(k==='muschel'){ const w=cdLeft('m'); if(w>0) return {l:'⏳ '+Math.ceil(w)+' Min',f:()=>toast('Alle Muscheln sind eingesammelt.')}; return {l:'🐚 Muscheln sammeln',f:()=>{ const p=pir(); p.cd.m=Date.now()+600000; const g=addGold((55+Math.random()*30)*goldMul()); toast('🐚 +'+g+' 🪙',2000); save(true); }}; }
      return null; }
    // ═══════ Oberfläche ═══════
    function css(){ if($('zpi-css')) return; const s=document.createElement('style'); s.id='zpi-css'; s.textContent='#zpi-ov{position:fixed;inset:0;z-index:720;background:#7fd0ff;font-family:Arial,sans-serif;touch-action:none;user-select:none}#zpi-ov canvas{display:block}.zpi-b{position:absolute;border:2px solid #fff;border-radius:12px;background:rgba(20,40,70,.85);color:#fff;font:900 .85rem Arial;padding:8px 11px}.zpi-m{position:absolute;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;padding:10px;z-index:3}.zpi-m>div{background:linear-gradient(160deg,#1e3a5f,#12263f);border:3px solid #ffd54f;border-radius:16px;padding:14px;max-width:460px;width:100%;max-height:92vh;overflow-y:auto;color:#fff}.zpi-r{display:flex;align-items:center;gap:8px;background:rgba(0,0,0,.25);border-radius:10px;padding:8px;margin-bottom:6px;font-size:.85rem}.zpi-r button{border:none;border-radius:8px;padding:7px 10px;background:#ffb300;color:#000;font-weight:900;font-size:.78rem}.zpi-r button:disabled{opacity:.4}'; document.head.appendChild(s); }
    let hudEl=null, mini=null, joy={a:false,id:null,cx:0,cy:0};
    function mkUI(){ css(); ov=document.createElement('div'); ov.id='zpi-ov'; cv=document.createElement('canvas'); ov.appendChild(cv);
      ov.insertAdjacentHTML('beforeend','<div id="zpi-hud" class="zpi-b" style="left:8px;top:8px;line-height:1.5"></div><button id="zpi-zoo" class="zpi-b" style="right:8px;top:8px">🦁 Zoo</button><button id="zpi-rank" class="zpi-b" style="right:8px;top:54px">🏆</button><button id="zpi-help" class="zpi-b" style="right:62px;top:54px">❓</button><canvas id="zpi-mini" width="110" height="110" style="position:absolute;right:8px;top:100px;border:2px solid #fff;border-radius:50%;background:rgba(10,40,90,.7)"></canvas><div id="zpi-ctx" style="position:absolute;left:50%;bottom:150px;transform:translateX(-50%)"></div><button id="zpi-fire" class="zpi-b" style="right:14px;bottom:30px;width:84px;height:84px;border-radius:50%;font-size:2rem;background:rgba(190,40,30,.9)">💥</button><div id="zpi-joy" style="position:absolute;left:18px;bottom:24px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,.18);border:2px solid rgba(255,255,255,.6)"><div id="zpi-knob" style="position:absolute;left:40px;top:40px;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.75)"></div></div><div id="zpi-boss" style="position:absolute;left:50%;top:8px;transform:translateX(-50%);display:none;width:min(46vw,300px);text-align:center;color:#fff;font:900 .75rem Arial;text-shadow:0 1px 3px #000"></div>');
      document.body.appendChild(ov); hudEl=$('zpi-hud'); mini=$('zpi-mini').getContext('2d'); build();
      $('zpi-zoo').onclick=()=>P.close(); $('zpi-rank').onclick=openRank; $('zpi-help').onclick=openHelp; $('zpi-fire').onclick=fire;
      const jy=$('zpi-joy'), kn=$('zpi-knob'); const mv=(e)=>{ const r=jy.getBoundingClientRect(), cx=r.left+60, cy=r.top+60; let dx=(e.clientX-cx)/50, dy=(e.clientY-cy)/50; const l=Math.hypot(dx,dy); if(l>1){ dx/=l; dy/=l; } st.inp.x=dx; st.inp.y=dy; kn.style.left=(40+dx*38)+'px'; kn.style.top=(40+dy*38)+'px'; };
      jy.addEventListener('pointerdown',e=>{ joy.a=true; try{ jy.setPointerCapture(e.pointerId); }catch(_){} mv(e); e.preventDefault(); }); jy.addEventListener('pointermove',e=>{ if(joy.a) mv(e); }); const end=()=>{ joy.a=false; st.inp.x=st.inp.y=0; kn.style.left=kn.style.top='40px'; }; jy.addEventListener('pointerup',end); jy.addEventListener('pointercancel',end);
      addEventListener('resize',onResize); }
    const keys={}; const KM={ArrowUp:'u',w:'u',W:'u',ArrowDown:'d',s:'d',S:'d',ArrowLeft:'l',a:'l',A:'l',ArrowRight:'r',d:'r',D:'r'};
    function kdown(e){ if(!P.open) return; if(KM[e.key]){ keys[KM[e.key]]=e.type==='keydown'; e.stopPropagation(); e.preventDefault(); } else if(e.type==='keydown'&&(e.key===' '||e.key==='f'||e.key==='F')){ if(!document.querySelector('.zpi-m')){ fire(); } e.stopPropagation(); e.preventDefault(); } else if(e.type==='keydown'&&(e.key==='e'||e.key==='E'||e.key==='Enter')){ const c=ctx(); if(c&&!document.querySelector('.zpi-m')) c.f(); e.stopPropagation(); } }
    addEventListener('keydown',kdown,true); addEventListener('keyup',kdown,true);
    function hud(){ if(!hudEl) return; const p=pir(); hudEl.innerHTML='🪙 <b>'+Math.round(p.gold)+'</b><br>🛡️ '+Math.max(0,Math.round(st.hp))+'/'+maxHull()+'<br>👥 '+(Object.keys(others).filter(k=>Date.now()-(others[k].t||0)<60000).length+1)+' Piraten'; }
    function modal(html){ closeMenu(); const m=document.createElement('div'); m.className='zpi-m'; m.innerHTML='<div>'+html+'<button class="zpi-x" style="width:100%;margin-top:6px;padding:10px;border:none;border-radius:10px;background:rgba(255,255,255,.18);color:#fff;font-weight:900">Schliessen</button></div>'; ov.appendChild(m); m.querySelector('.zpi-x').onclick=closeMenu; m.onclick=e=>{ if(e.target===m) closeMenu(); }; return m; }
    function closeMenu(){ document.querySelectorAll('.zpi-m').forEach(m=>m.remove()); }
    const showMsg=(t,b)=>{ modal('<div style="font:900 1.1rem Arial;color:#ffd54f;margin-bottom:8px">'+t+'</div><div style="font-size:.95rem;line-height:1.45">'+b+'</div>'); };
    function openPort(){ const p=pir(); st.hp=maxHull(); hud(); const m=modal('<div style="font:900 1.15rem Arial;color:#ffd54f">⚓ Heimat-Hafen</div><div style="font-size:.78rem;opacity:.85;margin-bottom:8px">Dein Schiff ist repariert. 🪙 '+Math.round(p.gold)+'</div><div style="font-weight:900;margin:4px 0">🔧 Werft</div>'+Object.keys(UP).map(k=>{ const l=p.u[k], mx=l>=MAXU; return '<div class="zpi-r"><span style="font-size:1.4rem">'+UP[k][0]+'</span><div style="flex:1"><b>'+UP[k][1]+' · Stufe '+l+'</b><div style="font-size:.7rem;opacity:.75">'+UP[k][2]+' +</div></div><button data-u="'+k+'" '+(mx||p.gold<upCost(k,l)?'disabled':'')+'>'+(mx?'MAX':upCost(k,l)+' 🪙')+'</button></div>'; }).join('')+'<div style="font-weight:900;margin:8px 0 4px">🐾 Crew</div>'+Object.keys(CREW).map(k=>{ const l=p.crew[k], mx=l>=MAXC; return '<div class="zpi-r"><span style="font-size:1.4rem">'+CREW[k][0]+'</span><div style="flex:1"><b>'+CREW[k][1]+' · Stufe '+l+'</b><div style="font-size:.7rem;opacity:.75">'+CREW[k][2]+'</div></div><button data-c="'+k+'" '+(mx||p.gold<crCost(k,l)?'disabled':'')+'>'+(mx?'MAX':(l?crCost(k,l):crCost(k,0))+' 🪙')+'</button></div>'; }).join('')+'<button id="zpi-bot" style="width:100%;margin-top:8px;padding:10px;border:none;border-radius:10px;background:#43a047;color:#fff;font-weight:900">🍾 Flaschenpost schicken (50 🪙)</button>');
      m.querySelectorAll('[data-u]').forEach(b=>b.onclick=()=>{ const k=b.dataset.u, l=p.u[k], c=upCost(k,l); if(p.gold<c||l>=MAXU) return; p.gold-=c; p.u[k]++; st.hp=maxHull(); save(true); hud(); openPort(); });
      m.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{ const k=b.dataset.c, l=p.crew[k], c=crCost(k,l); if(p.gold<c||l>=MAXC) return; p.gold-=c; p.crew[k]++; st.hp=maxHull(); save(true); hud(); openPort(); });
      $('zpi-bot').onclick=()=>{ const m2=modal('<div style="font:900 1.05rem Arial;color:#ffd54f">🍾 Flaschenpost</div><div style="font-size:.8rem;opacity:.85;margin:6px 0">Schreibe eine Nachricht (max. 60 Zeichen). Ein anderer Pirat findet die Flasche im Meer und bekommt 40 🪙. Max. 3 pro Tag.</div><input id="zpi-in" maxlength="60" placeholder="Hallo Pirat!" style="width:100%;box-sizing:border-box;padding:10px;border-radius:10px;border:none;font-size:1rem"><button id="zpi-send" style="width:100%;margin-top:8px;padding:10px;border:none;border-radius:10px;background:#43a047;color:#fff;font-weight:900">Ins Meer werfen</button>'); $('zpi-send').onclick=()=>P.sendBottle($('zpi-in').value); }; }
    function openTrade(){ const p=pir(); const m=modal('<div style="font:900 1.15rem Arial;color:#ffd54f">🏪 Händler-Insel</div><div style="font-size:.78rem;opacity:.85;margin-bottom:8px">Tausche Piratengold gegen Boosts für deinen Zoo! 🪙 '+Math.round(p.gold)+'</div>'+[['💰 Zoo-Geld ×2 · 10 Min',300,'money',2,10],['🍀 Glück ×2 · 10 Min',400,'luck',2,10],['👥 Besucher ×3 · 10 Min',350,'visitor',3,10]].map((o,i)=>'<div class="zpi-r"><div style="flex:1"><b>'+o[0]+'</b></div><button data-t="'+i+'" '+(p.gold<o[1]?'disabled':'')+'>'+o[1]+' 🪙</button></div>').join(''));
      const L=[['money',2,10,300],['luck',2,10,400],['visitor',3,10,350]]; m.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{ const o=L[+b.dataset.t]; if(p.gold<o[3]) return; p.gold-=o[3]; try{ ZTread.tBoost(o[0],o[1],o[2]); }catch(e){} save(true); hud(); toast('✅ Boost im Zoo aktiv!'); openTrade(); }); }
    function openRank(){ const d=RTD(); const m=modal('<div style="font:900 1.1rem Arial;color:#ffd54f">🏆 Top-Piraten (Gesamt-Gold)</div><div id="zpi-rk" style="margin-top:8px;font-size:.88rem">Lade …</div>'); const draw=a=>{ const e=$('zpi-rk'); if(e) e.innerHTML=a.map((r,i)=>'<div class="zpi-r"><b style="width:26px">'+(i+1)+'.</b><span style="flex:1">'+esc(r.n)+'</span><b>'+r.g+' 🪙</b></div>').join('')||'Noch keine Piraten.'; };
      if(d){ d.ref('zoo_pirate/rank').orderByChild('g').limitToLast(10).once('value').then(s=>{ const a=[]; s.forEach(c=>{ a.push(c.val()); }); a.sort((x,y)=>y.g-x.g); draw(a); }).catch(()=>draw([])); } else draw([{n:me(),g:Math.round(pir().total||0)}]); }
    function openHelp(){ showMsg('❓ So geht\'s','🕹️ Joystick (oder Pfeiltasten/WASD) = segeln<br>💥 Knopf (oder Leertaste) = Kanone auf das nächste Monster<br>🔘 Der Knopf unten in der Mitte erscheint bei Inseln (E-Taste)<br><br>⚓ <b>Hafen</b>: reparieren, Schiff & Crew verbessern, Flaschenpost<br>💰 <b>Schatzinsel</b>: an den ❌ graben<br>💀 <b>Totenkopf-Insel</b>: Fluch-Schatz (Monster!)<br>🏪 <b>Händler</b>: Gold gegen Zoo-Boosts<br>🐚 <b>Muschel-Insel</b>: Muscheln sammeln<br>🍾 Flaschen im Meer einsammeln<br>🦑 <b>Kraken</b> im Norden: alle Piraten kämpfen gemeinsam – wer mitgeholfen hat, bekommt die Belohnung!'); }
    // ═══════ Hauptschleife ═══════
    let raf=0, last=0, spT=0;
    function frame(ts){ if(!P.open) return; raf=requestAnimationFrame(frame); const dt=Math.min(.05,(ts-last)/1000||0); last=ts; const now=Date.now();
      let ix=st.inp.x, iy=st.inp.y; if(keys.l) ix-=1; if(keys.r) ix+=1; if(keys.u) iy-=1; if(keys.d) iy+=1; const mag=Math.min(1,Math.hypot(ix,iy));
      if(!st.dead){ if(mag>.12){ const th=Math.atan2(ix,iy); let dh=th-st.h; dh=Math.atan2(Math.sin(dh),Math.cos(dh)); st.h+=Math.max(-2.6*dt,Math.min(2.6*dt,dh)); st.v+=(speed()*mag-st.v)*Math.min(1,dt*2.5); } else st.v+=(0-st.v)*Math.min(1,dt*1.8);
        st.x+=Math.sin(st.h)*st.v*dt; st.z+=Math.cos(st.h)*st.v*dt; }
      const rr=Math.hypot(st.x,st.z); if(rr>LIM){ st.x*=LIM/rr; st.z*=LIM/rr; }
      Object.keys(ISL).forEach(k=>{ const I=ISL[k], dx=st.x-I.x, dz=st.z-I.z, d=Math.hypot(dx,dz), mn=I.r+5; if(d<mn){ st.x=I.x+dx/d*mn; st.z=I.z+dz/d*mn; } });
      st.fireCd-=dt; me3.visible=!st.dead; me3.position.set(st.x,Math.sin(now/500)*.3,st.z); me3.rotation.y=st.h; me3.userData.body.rotation.z=Math.sin(now/700)*.05;
      CAM.position.set(st.x,34,st.z+30); CAM.lookAt(st.x,0,st.z-3);
      wave.forEach(w=>{ w.position.y=.2+Math.sin(now/600+w.userData.p)*.1; });
      // andere Schiffe
      Object.keys(others).forEach(k=>{ const o=others[k]; if(now-(o.t||0)>60000){ if(ships[k]){ S.remove(ships[k]); delete ships[k]; } return; } if(!ships[k]){ ships[k]=mkShip(o.n||k,false); ships[k].position.set(o.x,0,o.z); S.add(ships[k]); } const s=ships[k]; s.position.x+=(o.x-s.position.x)*Math.min(1,dt*3); s.position.z+=(o.z-s.position.z)*Math.min(1,dt*3); let dh=(o.h||0)-s.rotation.y; dh=Math.atan2(Math.sin(dh),Math.cos(dh)); s.rotation.y+=dh*Math.min(1,dt*4); s.userData.body.rotation.z=Math.sin(now/700+hash(k))*.05; });
      // Monster
      spT-=dt; if(spT<=0){ spT=6; spawnSerp(); }
      serp.slice().forEach(m=>{ const dx=st.x-m.x, dz=st.z-m.z, d=Math.hypot(dx,dz); if(d<45&&!st.dead){ m.x+=dx/d*7*dt; m.z+=dz/d*7*dt; } else { m.t+=dt; m.x+=Math.cos(m.t)*2*dt; m.z+=Math.sin(m.t*.8)*2*dt; } if(d<9&&!st.dead){ m.bite=(m.bite||0)-dt; if(m.bite<=0){ m.bite=1.6; hurt(6); } } if(d>170){ killSerp(m,false); return; } m.s.position.set(m.x,2.5+Math.sin(now/300+m.x)*.5,m.z); m.bar.position.set(m.x,8,m.z); m.bar.scale.x=Math.max(.01,m.hp/m.max); });
      // Boss
      const bp=bossPos(); if(B.hp>0){ if(!boss3){ boss3=spr('🦑',34,bp.x,10,bp.z); } boss3.visible=true; boss3.position.set(bp.x,10+Math.sin(now/500)*1.2,bp.z); const d=Math.hypot(bp.x-st.x,bp.z-st.z); if(d<42&&!st.dead){ st.bite-=dt; if(st.bite<=0){ st.bite=2.2; hurt(10); } } } else { if(boss3) boss3.visible=false; if(B.deadUntil&&now>B.deadUntil){ B.deadUntil=now+5000; respawnBoss(); } }
      // Kugeln
      balls.slice().forEach(b=>{ b.t+=dt; const k=Math.min(1,b.t/b.dur); b.m.position.set(b.sx+(b.tx-b.sx)*k,3+Math.sin(k*Math.PI)*6,b.sz+(b.tz-b.sz)*k); if(k>=1){ S.remove(b.m); balls.splice(balls.indexOf(b),1); const dm=Math.round((14+Math.random()*8)*dmgMul()); if(b.tg.t==='s'){ const m=b.tg.m; if(serp.includes(m)){ m.hp-=dm; if(m.hp<=0) killSerp(m,true); } } else if(B.hp>0){ hitBoss(dm); } } });
      flushBoss(now); tryBottles(); pushPos(now);
      // HP-Regeneration auf See langsam
      if(!st.dead&&st.hp<maxHull()) { st.hp=Math.min(maxHull(),st.hp+dt*1.2); }
      const c=ctx(), cx=$('zpi-ctx'); const key2=c?c.l:''; if(cx._k!==key2){ cx._k=key2; cx.innerHTML=c?'<button class="zpi-b" style="position:static;font-size:1.05rem;padding:12px 18px;background:rgba(255,160,0,.95);color:#000">'+key2+'</button>':''; if(c) cx.firstChild.onclick=()=>{ const cc=ctx(); cc&&cc.f(); }; }
      else if(c&&cx.firstChild) cx.firstChild.onclick=()=>{ const cc=ctx(); cc&&cc.f(); };
      const be=$('zpi-boss'); if(B.hp>0&&Math.hypot(bp.x-st.x,bp.z-st.z)<140){ be.style.display='block'; be.innerHTML='🦑 KRAKEN '+Math.round(B.hp)+'/'+B.max+'<div style="height:8px;background:#400;border-radius:4px;margin-top:2px"><div style="height:100%;width:'+(B.hp/B.max*100)+'%;background:#e53935;border-radius:4px"></div></div>'; } else if(B.hp<=0&&B.deadUntil>now&&Math.hypot(bp.x-st.x,bp.z-st.z)<140){ be.style.display='block'; be.textContent='🦑 Kraken kommt in '+Math.ceil((B.deadUntil-now)/60000)+' Min wieder'; } else be.style.display='none';
      if((ts|0)%6===0) hud(); drawMini(); R.render(S,CAM); }
    function drawMini(){ const g=mini, W=110, k=W/2/(LIM+10); g.clearRect(0,0,W,W); g.fillStyle='#ffd54f'; Object.keys(ISL).forEach(n=>{ const I=ISL[n]; g.fillStyle=n==='hafen'?'#ffffff':'#e6c78c'; g.beginPath(); g.arc(W/2+I.x*k,W/2+I.z*k,Math.max(3,I.r*k),0,6.283); g.fill(); });
      if(B.hp>0){ const b=bossPos(); g.fillStyle='#e53935'; g.beginPath(); g.arc(W/2+b.x*k,W/2+b.z*k,4,0,6.283); g.fill(); } g.fillStyle='#69f0ae'; Object.keys(others).forEach(n=>{ const o=others[n]; if(Date.now()-(o.t||0)<60000){ g.fillRect(W/2+o.x*k-1.5,W/2+o.z*k-1.5,3,3); } }); g.fillStyle='#ffeb3b'; g.beginPath(); g.arc(W/2+st.x*k,W/2+st.z*k,3.2,0,6.283); g.fill(); }
    // ═══════ Öffnen / Schliessen ═══════
    P.openWorld=function(){ if(!P.has()) return toast('🔒 Ab Rebirth 7 kannst du die Piraten-Welt betreten.'); if(P.open) return; P.open=true; if(!ov){ mkUI(); } else { ov.style.display='block'; } const p=pir(); if(st.hp>maxHull()||!st.hp||st.hp<=0) st.hp=maxHull(); if(!st.x&&!st.z) { st.x=0; st.z=ISL.hafen.r+14; } onResize(); listen(); hud(); last=performance.now(); raf=requestAnimationFrame(frame);
      if(!p.seen){ p.seen=1; save(true); setTimeout(openHelp,400); } };
    P.close=function(){ if(!P.open) return; P.open=false; cancelAnimationFrame(raf); closeMenu(); if(ov) ov.style.display='none'; unlisten(); save(true); pushRank(); };
    // ═══════ Knopf im Zoo ═══════
    const fb=document.createElement('button'); fb.id='zpi-fab'; fb.textContent='🏴‍☠️'; fb.title='Piraten-Welt'; fb.style.cssText='position:fixed;left:336px;bottom:12px;z-index:127;width:40px;height:40px;border-radius:50%;border:2px solid #fff;background:rgba(20,50,90,.92);color:#fff;font-size:1.2rem;box-shadow:0 2px 8px rgba(0,0,0,.4);display:none'; document.body.appendChild(fb); fb.onclick=()=>P.openWorld();
    setInterval(()=>{ try{ fb.style.display=(P.has()&&!P.open&&!((window.ZStation&&ZStation.riding)||ZG._liftActive||ZG._arcadeActive))?'block':'none'; }catch(e){} },1000);
    P.st=st; P.B=()=>B; P.ISL=ISL; P.fire=fire; P.ctx=ctx; P.spawnSerp=spawnSerp;
  }
  wait();
})();
