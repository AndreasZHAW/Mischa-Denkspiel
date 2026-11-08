/* ═══ ZLift (v770): Geheimer Aufzug (ab Rebirth 3) – 5 Etagen unter der Erde, 10 Räume mit Tier-Gläsern und Hebel ═══ */
(function(){
  'use strict';
  if(window.ZLift) return;
  const wait=()=>{ if(!window.ZReb6||!ZReb6.U||typeof THREE==='undefined') return setTimeout(wait,300); init(); };
  function init(){
  const U=ZReb6.U, {$,mb,bx,cy,sp,cv,emo,price,zoo,toast,dist,save,hud,modal,bs,GREEN,GREY,GLASS,nbtn}=U;
  const L=window.ZLift={mode:'surface',floor:0,busy:false};
  const SPOT={x:-30,z:-165};              // Aufzug-Haus an der Oberfläche
  const HX=2400, HZ=2400;                 // Höhlen-Welt (weit weg von allem)
  const SX=HX+700;                        // Schacht (Fahrt)
  const HL=130, HW=20;                    // Halle: Länge, halbe Breite
  const RN={normal:'Normal',rare:'Selten',epic:'Episch',legendary:'Legendär',ultralegendary:'Ultra',god:'Gott',mythic:'Mythisch',secret:'SECRET',eternal:'ETERNEL'};
  const RC={normal:'#bdbdbd',rare:'#4fc3f7',epic:'#ba68c8',legendary:'#ffd54f',ultralegendary:'#ff8a65',god:'#fff59d',mythic:'#ff5252',secret:'#69f0ae',eternal:'#ffffff'};
  const A=(n,r)=>[n,r];
  // 10 Räume, die Tiere werden immer besser. [benötigt ×6, Belohnung]
  const ROOMS=[
    {req:[A('Hamster','normal'),A('Zebra','rare'),A('Bruder','rare'),A('Schwester','rare'),A('Giraffe','rare'),A('Wal','epic')],rew:A('Phönix','legendary')},
    {req:[A('Nashorn','rare'),A('Nilpferd','rare'),A('Elefant','rare'),A('Flamingo','epic'),A('Gorilla','epic'),A('Hai','epic')],rew:A('Tiger','legendary')},
    {req:[A('Capybara','epic'),A('Bär','epic'),A('Wolf','epic'),A('Panda','epic'),A('Delphin','epic'),A('Flamingo','epic')],rew:A('Gorilla','legendary')},
    {req:[A('Drache','legendary'),A('Dodo','legendary'),A('Kraken','legendary'),A('Qualle','legendary'),A('Mammut','legendary'),A('T-Rex','legendary')],rew:A('Roboter-Hund','ultralegendary')},
    {req:[A('Einhorn','legendary'),A('Yeti','legendary'),A('Fuchs','legendary'),A('Phönix','legendary'),A('Tiger','legendary'),A('Elefant','legendary')],rew:A('Alien-Tier','ultralegendary')},
    {req:[A('Alien-Tier','ultralegendary'),A('Meerjungfrau','ultralegendary'),A('Orca','ultralegendary'),A('Engel-Tier','ultralegendary'),A('Zeitreise-Tier','ultralegendary'),A('Galaxie-Kreatur','ultralegendary')],rew:A('Göttliches Wesen','god')},
    {req:[A('Roboter-Hund','ultralegendary'),A('Leere-Wesen','ultralegendary'),A('Drache','ultralegendary'),A('Phönix','ultralegendary'),A('Nessie','ultralegendary'),A('Göttliches Wesen','god')],rew:A('Löwe','god')},
    {req:[A('Göttliches Wesen','god'),A('Löwe','god'),A('Mammut','god'),A('Kraken','god'),A('Anubis','god'),A('Nessie','ultralegendary')],rew:A('Cerberus','mythic')},
    {req:[A('Mammut','god'),A('Kraken','god'),A('Anubis','god'),A('Cerberus','mythic'),A('Poseidon','mythic'),A('Zeus','mythic')],rew:A('Dinosaurier','secret')},
    {req:[A('Poseidon','mythic'),A('Zeus','mythic'),A('Thor','mythic'),A('Dinosaurier','secret'),A('Megalodon','secret'),A('Anubis','god')],rew:A('Aetheria','eternal')}
  ];
  const THEME=[0x6d5a46,0x5a5a66,0x4a6070,0x4a5a4a,0x5a4a6a]; // pro Etage
  const GLOW=[0xffb74d,0x90caf9,0x80deea,0x69f0ae,0xce93d8];
  L.rooms=ROOMS;
  const find=(n,r)=>{ try{ return ANIMALS.find(a=>a.n===n&&a.r===r); }catch(e){ return null; } };
  const has3=()=>{ const z=zoo(); return ZReb6.isBu()||!!(z&&(z.reb||0)>=3); };
  L.has3=has3;
  const st=()=>{ const z=zoo(); if(!z) return {r:[]}; let s=z.lift; if(!s) s=z.lift={r:[]}; for(let i=0;i<10;i++){ if(!s.r[i]) s.r[i]={p:[0,0,0,0,0,0],d:0}; } return s; };
  L.st=st;
  const roomDone=i=>!!st().r[i].d;
  const floorOpen=f=>f===1||(roomDone(2*f-4)&&roomDone(2*f-3));   // Etage f (1..5)
  L.floorOpen=floorOpen;

  // ───────── Texturen ─────────
  let rockTex=null;
  const rock=(rep,base)=>{ if(!rockTex){ const c=cv(256,256), g=c.getContext('2d'); g.fillStyle='#777'; g.fillRect(0,0,256,256); for(let i=0;i<900;i++){ const v=90+Math.floor(Math.random()*80); g.fillStyle='rgb('+v+','+(v-6)+','+(v-14)+')'; const w=4+Math.random()*22; g.fillRect(Math.random()*256,Math.random()*256,w,3+Math.random()*10); } g.strokeStyle='rgba(0,0,0,.35)'; g.lineWidth=2; for(let i=0;i<26;i++){ g.beginPath(); g.moveTo(Math.random()*256,Math.random()*256); g.lineTo(Math.random()*256,Math.random()*256); g.stroke(); } rockTex=new THREE.CanvasTexture(c); rockTex.wrapS=rockTex.wrapT=THREE.RepeatWrapping; }
    const t=rockTex.clone(); t.needsUpdate=true; t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(rep[0],rep[1]); return new THREE.MeshBasicMaterial({map:t,color:base||0xffffff}); };
  const frameTex=(a,col)=>{ const c=cv(256,330), g=c.getContext('2d'); g.fillStyle='#1b1b24'; g.fillRect(0,0,256,330); g.strokeStyle=col; g.lineWidth=12; g.strokeRect(8,8,240,314); g.fillStyle='rgba(255,255,255,.06)'; g.fillRect(20,20,216,200);
    g.font='130px serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillStyle='#fff'; g.fillText(a.e||'❓',128,125); g.font='900 34px Arial'; g.fillStyle='#fff'; g.fillText(a.n,128,252); g.font='900 28px Arial'; g.fillStyle=col; g.fillText(RN[a.r]||a.r,128,292); const t=new THREE.CanvasTexture(c); return t; };
  const signT=(txt,sub,col)=>{ const c=cv(640,160), g=c.getContext('2d'); g.fillStyle='rgba(20,20,28,.92)'; g.fillRect(0,0,640,160); g.strokeStyle=col||'#ffd54f'; g.lineWidth=8; g.strokeRect(6,6,628,148); g.fillStyle='#fff'; g.font='900 54px Arial'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(txt,320,56); g.fillStyle=col||'#ffd54f'; g.font='800 36px Arial'; g.fillText(sub||'',320,112); return new THREE.CanvasTexture(c); };
  const plane=(w,h,map,x,y,z,ry,g,tr)=>{ const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map,transparent:!!tr,side:THREE.DoubleSide})); m.position.set(x,y,z); m.rotation.y=ry||0; g.add(m); return m; };
  const spr=(e,s,x,y,z,g,op)=>{ const m=new THREE.Sprite(new THREE.SpriteMaterial({map:emo(e),transparent:true,opacity:op==null?1:op})); m.scale.set(s,s,1); m.position.set(x,y,z); g.add(m); return m; };

  // ───────── Oberfläche: Aufzug-Haus ─────────
  L.buildSurface=function(){ try{ if(L.sg||!ZG.scene) return; const g=new THREE.Group(); g.position.set(SPOT.x,0,SPOT.z);
    const hill=new THREE.Mesh(new THREE.SphereGeometry(11,16,10,0,6.283,0,1.57),rock([3,2],0x9a9a9a)); hill.scale.y=.45; g.add(hill);
    bx(9,5.2,6,0x8d8d95,0,2.6,0,g); bx(9.6,.6,6.6,0x5f5f68,0,5.4,0,g); bx(3.2,3.8,.3,0x37474f,0,1.9,3.05,g);
    bx(1.5,3.6,.2,0xb0bec5,-.78,1.9,3.2,g); bx(1.5,3.6,.2,0xb0bec5,.78,1.9,3.2,g); bx(.2,.2,.2,0xffeb3b,0,4.1,3.2,g);
    const sg=plane(6,1.5,signT('🛗 AUFZUG','nach unten · ab Rebirth 3','#7dffb0'),0,6.7,3.3,0,g);
    [-3.4,3.4].forEach(x=>{ cy(.15,.15,3,0x757575,x,1.5,3.6,g,6); sp(0xffcc80,.4,x,3.2,3.6,g); });
    for(let i=0;i<8;i++){ const a=i*.8+.3, r=9+Math.random()*3; const m=new THREE.Mesh(new THREE.DodecahedronGeometry(.9+Math.random()*.8),mb(0x7d7d85)); m.position.set(Math.cos(a)*r,.6,Math.sin(a)*r); g.add(m); }
    spr('⬇️',2,0,8.6,3.3,g);
    ZG.scene.add(g); L.sg=g; }catch(e){ console.warn('ZLift surface',e); } };

  // ───────── Schacht (Fahrt) ─────────
  L.buildShaft=function(){ if(L.shaft) return L.shaft; const g=new THREE.Group(); g.position.set(SX,0,HZ);
    const tube=new THREE.Mesh(new THREE.CylinderGeometry(6,6,300,20,1,true),(()=>{ const m=rock([6,30],0xcccccc); m.side=THREE.BackSide; return m; })()); tube.position.y=140; g.add(tube); L.tubeMat=tube.material;
    // Kabine
    const cab=new THREE.Group(); const metal=0x90a4ae;
    bx(6,.3,6,0x546e7a,0,0,0,cab); bx(6,.3,6,0x546e7a,0,3.8,0,cab);
    [[-3,-3],[3,-3],[-3,3],[3,3]].forEach(p=>bx(.25,3.8,.25,metal,p[0],1.9,p[1],cab));
    const glass=mb(0x9fd8ff,{transparent:true,opacity:.18,side:THREE.DoubleSide}); [[0,-3,6,3.5,0],[0,3,6,3.5,0],[-3,0,6,3.5,Math.PI/2],[3,0,6,3.5,Math.PI/2]].forEach(w=>{ const m=new THREE.Mesh(new THREE.PlaneGeometry(w[2],w[3]),glass); m.position.set(w[0],1.95,w[1]); m.rotation.y=w[4]; cab.add(m); });
    [.9,2.6].forEach(y=>[[0,-3,6,.12,0],[0,3,6,.12,0],[-3,0,6,.12,Math.PI/2],[3,0,6,.12,Math.PI/2]].forEach(w=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(w[2],.1,.1),mb(metal)); m.position.set(w[0],y,w[1]); m.rotation.y=w[4]; cab.add(m); }));
    bx(2,.5,.1,0x111111,0,3.4,2.9,cab); L.disp=plane(1.9,.45,signT('−1','',''),0,3.4,2.84,Math.PI,cab); g.add(cab); L.cab=cab;
    // vorbeiziehende Lampen & Kristalle
    const pass=new THREE.Group(); for(let i=0;i<30;i++){ const a=i*2.1, y=i*6-60; const lamp=sp(0xffe082,.35,Math.cos(a)*5.6,y,Math.sin(a)*5.6,pass); const crys=new THREE.Mesh(new THREE.ConeGeometry(.5,1.6,5),mb(i%2?0x80deea:0xce93d8)); crys.position.set(Math.cos(a+1.4)*5.4,y+3,Math.sin(a+1.4)*5.4); crys.lookAt(0,y+3,0); crys.rotateX(Math.PI/2); pass.add(crys); }
    g.add(pass); L.pass=pass; g.visible=false; ZG.scene.add(g); L.shaft=g; return g; };

  // ───────── Halle ─────────
  L.hall=null;
  L.disposeHall=function(){ if(!L.hall) return; ZG.scene.remove(L.hall); L.hall.traverse(o=>{ try{ if(o.geometry) o.geometry.dispose(); if(o.material){ if(o.material.map) o.material.map.dispose(); o.material.dispose(); } }catch(e){} }); L.hall=null; L.frames=[]; L.levers=[]; };
  L.buildHall=function(f){ L.disposeHall(); const g=new THREE.Group(); g.position.set(HX,0,HZ); const th=THEME[f-1], gl=GLOW[f-1]; L.frames=[]; L.levers=[]; L.glass=[];
    const fl=new THREE.Mesh(new THREE.PlaneGeometry(HL,HW*2),rock([16,5],th)); fl.rotation.x=-Math.PI/2; fl.position.set(HL/2,0,0); g.add(fl);
    const ce=new THREE.Mesh(new THREE.PlaneGeometry(HL,HW*2),rock([16,5],th-0x101010)); ce.rotation.x=Math.PI/2; ce.position.set(HL/2,10,0); g.add(ce);
    [[-HW,0],[HW,Math.PI]].forEach(w=>{ const m=new THREE.Mesh(new THREE.PlaneGeometry(HL,10),rock([16,2],th+0x080808)); m.position.set(HL/2,5,w[0]); m.rotation.y=w[1]; g.add(m); });
    [[0,Math.PI/2],[HL,-Math.PI/2]].forEach(w=>{ const m=new THREE.Mesh(new THREE.PlaneGeometry(HW*2,10),rock([5,2],th)); m.position.set(w[0],5,0); m.rotation.y=w[1]; g.add(m); });
    // Trennwand zwischen Raum 1 und 2 (Durchgang in der Mitte)
    [[-HW,-3.5],[3.5,HW]].forEach(w=>{ const len=w[1]-w[0]; const m=new THREE.Mesh(new THREE.BoxGeometry(2,10,len),rock([1,2],th)); m.position.set(69,5,(w[0]+w[1])/2); g.add(m); });
    bx(2.2,1.2,8,gl,69,9.4,0,g);
    for(let i=0;i<40;i++){ const c=new THREE.Mesh(new THREE.ConeGeometry(.5+Math.random()*.7,1.5+Math.random()*3,6),mb(th-0x151515)); c.rotation.x=Math.PI; c.position.set(3+Math.random()*(HL-6),10-.8,(Math.random()*2-1)*(HW-2)); g.add(c); }
    for(let i=0;i<22;i++){ const side=i%2?1:-1; const c=new THREE.Mesh(new THREE.ConeGeometry(.5,1.8+Math.random()*1.6,5),mb(gl)); c.position.set(6+Math.random()*(HL-12),.9,side*(HW-1.4)); c.rotation.z=(Math.random()-.5)*.5; g.add(c); }
    for(let x=14;x<HL;x+=22){ bx(.5,.5,.5,0x5d4037,x,4.6,-HW+.4,g); spr('🔥',1.6,x,5.5,-HW+.8,g); bx(.5,.5,.5,0x5d4037,x,4.6,HW-.4,g); spr('🔥',1.6,x,5.5,HW-.8,g); }
    // Aufzug-Kabine am Westende
    bx(.6,8,10,0x78909c,.4,4,0,g); bx(1.2,.5,10,0x546e7a,1,8.2,0,g); bx(.4,6,.4,0x90a4ae,1,3,-2.7,g); bx(.4,6,.4,0x90a4ae,1,3,2.7,g); bx(.2,3,.2,0x7dffb0,1.2,6.2,0,g); L.doorSign=plane(3.2,.9,signT('🛗 AUFZUG','Etage −'+f,'#7dffb0'),1.4,7.4,0,Math.PI/2,g);
    // 2 Räume
    [0,1].forEach(k=>{ const ri=(f-1)*2+k, R=ROOMS[ri], x0=k?80:26; const room={ri,k,frames:[],lever:null,glass:[]}; const rew=find(R.rew[0],R.rew[1]);
      plane(14,3.5,signT('RAUM '+(ri+1),'Belohnung: '+(rew?rew.e+' '+rew.n:'?')+' ('+RN[R.rew[1]]+')',RC[R.rew[1]]),x0+15,8.2,-HW+.2,0,g);
      R.req.forEach((rq,i)=>{ const a=find(rq[0],rq[1])||{n:rq[0],e:'❓',r:rq[1]}; const x=x0+i*6; const col=RC[a.r]||'#fff';
        const fr=plane(4.2,5.4,frameTex(a,col),x,5.0,-HW+.25,0,g); const slot={x,z:-HW+6.5,a,i,room};
        cy(1.7,1.9,1.3,0x455a64,x,.65,-HW+6.5,g,14); const jar=new THREE.Mesh(new THREE.CylinderGeometry(1.35,1.35,3.2,16,1,true),mb(0x9fe8ff,{transparent:true,opacity:.28,side:THREE.DoubleSide,depthWrite:false})); jar.position.set(x,2.9,-HW+6.5); jar.renderOrder=2; g.add(jar); cy(1.45,1.45,.25,0xb0bec5,x,4.55,-HW+6.5,g,14);
        slot.ghost=spr(a.e,1.8,x,2.7,-HW+6.5,g,.28); slot.fill=spr(a.e,2.2,x,2.8,-HW+6.5,g,1); slot.ghost.renderOrder=3; slot.fill.renderOrder=4; slot.ghost.material.depthWrite=false; slot.fill.material.depthWrite=false; slot.fill.visible=false; slot.glowRing=new THREE.Mesh(new THREE.RingGeometry(1.5,1.9,20),mb(gl,{transparent:true,opacity:.0,side:THREE.DoubleSide,depthWrite:false})); slot.glowRing.rotation.x=-Math.PI/2; slot.glowRing.position.set(x,1.35,-HW+6.5); g.add(slot.glowRing);
        room.frames.push(slot); L.frames.push(slot); });
      // Hebel
      const lx=x0+37, lg=new THREE.Group(); lg.position.set(lx,0,2); bx(1.6,1.6,1.6,0x37474f,0,.8,0,lg); bx(.5,1,.5,0x263238,0,1.9,0,lg); const arm=new THREE.Group(); arm.position.set(0,2.4,0); arm.rotation.z=.9; cy(.13,.13,3.2,0xb0bec5,0,1.6,0,arm,8); sp(0xd32f2f,.42,0,3.3,0,arm); lg.add(arm); g.add(lg); room.lever={x:lx,z:2,arm,g:lg}; L.levers.push(room); plane(4,1,signT('🔧 HEBEL','',RC[R.rew[1]]),lx,4.3,2,Math.PI,g);
      L.rooms2=L.rooms2||[]; room.sign=null; });
    g.userData.f=f; ZG.scene.add(g); L.hall=g; L.refresh(); };
  L.roomFrames=()=>L.frames||[];
  L.refresh=function(){ if(!L.hall) return; const s=st(); (L.frames||[]).forEach(sl=>{ const rs=s.r[sl.room.ri]; const on=!!rs.p[sl.i]; sl.fill.visible=on; sl.ghost.visible=!on; sl.glowRing.material.opacity=on?.7:0; }); };

  // ───────── Welt wechseln ─────────
  L.hideWorld=function(){ if(L._hid) return; L._hid=[]; ZG.scene.children.forEach(ch=>{ if(ch.type==='AmbientLight'||ch.type==='DirectionalLight'||ch.type==='HemisphereLight') return; if(ch.visible){ L._hid.push(ch); ch.visible=false; } }); L._fog=ZG.scene.fog; L._saved={x:ZG.pl.x,z:ZG.pl.z,yaw:ZG.yaw,pitch:ZG.pitch}; ZG.scene.fog=null; try{ ZG.renderer.setClearColor(0x0a0a10,1); }catch(e){} ZG._liftActive=true; ZG._meadowActive=true; };
  L.showWorld=function(){ (L._hid||[]).forEach(ch=>ch.visible=true); L._hid=null; if(L.shaft) L.shaft.visible=false; ZG._liftActive=false; ZG._meadowActive=false; try{ ZG.scene.fog=L._fog||null; ZG.renderer.setClearColor(0x87CEEB,1); }catch(e){} L.disposeHall(); L.mode='surface'; L.floor=0; };
  const fade=(on,ms)=>{ let o=$('zl-fade'); if(!o){ o=document.createElement('div'); o.id='zl-fade'; o.style.cssText='position:fixed;inset:0;background:#000;z-index:9400;pointer-events:none;opacity:0;transition:opacity .35s'; document.body.appendChild(o); } o.style.transition='opacity '+((ms||350)/1000)+'s'; requestAnimationFrame(()=>{ o.style.opacity=on?1:0; }); };
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const place=(x,z,yaw)=>{ const pl=ZG.pl; pl.x=x; pl.z=z; pl.y=1.7; ZG.yaw=yaw; ZG.pitch=0; try{ ZG.cam.position.set(x,1.7,z); }catch(e){} };

  L.go=async function(target){ if(L.busy) return; const z=zoo(); if(!z) return; if(target===L.floor) return; if(target>0&&!floorOpen(target)){ toast('🔒 Etage −'+target+' ist noch gesperrt: erst beide Räume der Etage darüber abschliessen.',3500); return; }
    L.busy=true; try{ const from=L.floor, down=target>from; fade(true); await sleep(380);
      if(from===0) L.hideWorld(); L.disposeHall(); L.buildShaft(); L.shaft.visible=true; L.mode='ride'; place(SX,HZ,0);
      const o=$('zl-ride'); if(o) o.remove(); const hudEl=document.createElement('div'); hudEl.id='zl-ride'; hudEl.style.cssText='position:fixed;top:12%;left:50%;transform:translateX(-50%);z-index:9500;color:#fff;font:900 2.2rem Arial;text-shadow:0 3px 8px #000;pointer-events:none;text-align:center'; document.body.appendChild(hudEl);
      fade(false); const dur=2800+Math.abs(target-from)*1300; const t0=performance.now(); L.ride={t0,dur,down,from,target};
      while(performance.now()-t0<dur){ const k=(performance.now()-t0)/dur; const fl=down?(from+(target-from)*k):(from+(target-from)*k); const fn=Math.round(fl); hudEl.innerHTML='🛗 '+(fn===0?'Oberfläche':'Etage −'+fn)+'<div style="font-size:1.1rem;opacity:.8">'+(down?'⬇️ fährt nach unten':'⬆️ fährt nach oben')+'</div>'; await sleep(120); }
      L.ride=null; hudEl.remove(); fade(true); await sleep(380);
      L.shaft.visible=false;
      if(target===0){ L.showWorld(); place(SPOT.x,SPOT.z+7,0); ZG.yaw=0; }
      else { L.buildHall(target); L.floor=target; L.mode='hall'; place(HX+9,HZ,-Math.PI/2); }
      L.floor=target; fade(false); if(target>0) toast('🛗 Etage −'+target,2500);
    }catch(e){ console.warn('ZLift go',e); try{ L.showWorld(); }catch(_e){} fade(false); } L.busy=false; };
  L.picker=function(){ if(L.busy) return; const s=st(); const rows=[0,1,2,3,4,5].map(f=>{ const open=f===0||floorOpen(f), cur=f===L.floor; const d=f===0?0:(s.r[2*f-2].d+s.r[2*f-1].d); const lab=f===0?'⬆️ Oberfläche':'Etage −'+f; return '<button data-f="'+f+'" style="'+bs(cur?'#1565c0':(open?GREEN:GREY))+';display:flex;justify-content:space-between;align-items:center"><span>'+(open?'':'🔒 ')+lab+(cur?' (hier)':'')+'</span><span style="font-size:.78rem;opacity:.9">'+(f===0?'':d+'/2 Räume')+'</span></button>'; }).join('');
    const o=modal('zl-pick','<div style="font-size:2.2rem">🛗</div><div style="font:900 1.2rem Arial;color:#ffd54f">Aufzug</div><div style="font-size:.78rem;opacity:.85;margin:4px 0">Jede Etage hat 2 Räume. Schliesst du beide ab, geht die nächste Etage auf.</div>'+rows+'<button id="zl-px" style="'+bs(GLASS)+'">Schliessen</button>'); o.style.zIndex=9300; $('zl-px').onclick=()=>o.remove();
    o.querySelectorAll('button[data-f]').forEach(b=>b.onclick=()=>{ const f=+b.dataset.f; o.remove(); L.go(f); }); };

  // ───────── Tiere ins Glas, Hebel ─────────
  const ann=(msg,color)=>{ const a=document.createElement('div'); a.style.cssText='position:fixed;top:14%;left:50%;transform:translate(-50%,-50%);z-index:9800;min-width:200px;max-width:min(90vw,480px);text-align:center;pointer-events:none;box-sizing:border-box'; a.innerHTML='<div style="font-size:1.5rem;margin-bottom:6px;text-shadow:0 2px 8px rgba(0,0,0,.8)">📢</div><div style="font-size:.75rem;font-weight:700;margin-bottom:8px;color:'+color+';text-shadow:0 2px 8px rgba(0,0,0,.8)">Ankündigung vom Aufzug</div><div style="font-size:1.9rem;line-height:1.3;font-weight:900;color:'+color+';text-shadow:0 2px 8px rgba(0,0,0,.8);white-space:normal;word-break:break-word">'+msg+'</div>'; document.body.appendChild(a); setTimeout(()=>a.remove(),9000); };
  L.nearSlot=function(){ const pl=ZG.pl; let best=null,bd=4.6; (L.frames||[]).forEach(sl=>{ const d=Math.hypot(pl.x-(HX+sl.x),pl.z-(HZ+sl.z)); if(d<bd){ bd=d; best=sl; } }); return best; };
  L.roomUnlocked=ri=>ri%2===0||roomDone(ri-1);
  L.nearLever=function(){ const pl=ZG.pl; let best=null,bd=4.6; (L.levers||[]).forEach(rm=>{ const d=Math.hypot(pl.x-(HX+rm.lever.x),pl.z-(HZ+rm.lever.z)); if(d<bd){ bd=d; best=rm; } }); return best; };
  L.allIn=ri=>st().r[ri].p.every(x=>x);
  L.put=async function(sl){ const z=zoo(); if(!z||!sl) return; const ri=sl.room.ri, rs=st().r[ri]; if(rs.d) return toast('Dieser Raum ist schon abgeschlossen.'); if(!L.roomUnlocked(ri)) return toast('🔒 Schliesse zuerst Raum '+ri+' ab.',3000); if(rs.p[sl.i]) return;
    const idx=z.enc.findIndex(e=>e&&e.animal&&e.animal.n===sl.a.n&&e.animal.r===sl.a.r);
    if(idx<0){ toast('❌ Dir fehlt: '+sl.a.e+' '+sl.a.n+' ('+RN[sl.a.r]+') in deinen Gehegen.',3500); return; }
    let ok=true; try{ if(typeof showConfirm==='function') ok=await showConfirm('Willst du '+sl.a.e+' '+sl.a.n+' wirklich ins Glas legen? Das Tier ist danach aus deinem Gehege weg.'); }catch(e){}
    if(!ok) return; const i2=z.enc.findIndex(e=>e&&e.animal&&e.animal.n===sl.a.n&&e.animal.r===sl.a.r); if(i2<0) return;
    z.enc[i2]=null; try{ ZG._encs(); }catch(e){} rs.p[sl.i]=1; save(); hud(); L.refresh(); try{ ZGfx.confetti(40); }catch(e){} toast('🫙 '+sl.a.e+' '+sl.a.n+' liegt im Glas!',2200);
    if(L.allIn(ri)){ setTimeout(()=>{ ann('Jetzt drücke den Hebel!','#2a5bff'); },700); } };
  L.pull=async function(rm){ const z=zoo(); if(!z||!rm||L.busy||L.pulling) return; const ri=rm.ri, rs=st().r[ri]; if(rs.d||!L.allIn(ri)) return; L.pulling=true; const R=ROOMS[ri], A_=find(R.rew[0],R.rew[1]);
    const arm=rm.lever.arm, t0=performance.now(); await new Promise(res=>{ const f=()=>{ const k=Math.min(1,(performance.now()-t0)/900); arm.rotation.z=.9-1.8*k; if(k<1) requestAnimationFrame(f); else res(); }; f(); });
    // Rütteln
    L.shake={until:performance.now()+3200,amp:.22}; fade(false); const fl=document.createElement('div'); fl.style.cssText='position:fixed;inset:0;background:#fff;opacity:0;z-index:9400;pointer-events:none;transition:opacity .25s'; document.body.appendChild(fl);
    const dust=[]; for(let i=0;i<40;i++){ const s=spr('🪨',.5+Math.random()*.5,HX+rm.lever.x-18+Math.random()*40,9.5,HZ+(Math.random()*30-15),ZG.scene); dust.push({s,v:3+Math.random()*5}); }
    const t1=performance.now(); await new Promise(res=>{ const f=()=>{ const t=performance.now()-t1; dust.forEach(d=>{ d.s.position.y-=d.v*.016; if(d.s.position.y<.3) d.s.position.y=9.5; }); (rm.frames||[]).forEach(()=>{}); (L.frames||[]).filter(s=>s.room===rm).forEach(s=>{ s.fill.scale.setScalar(2.2+Math.sin(t/60)*.35); s.glowRing.material.opacity=.4+Math.sin(t/80)*.4; }); if(t<2800) requestAnimationFrame(f); else res(); }; f(); });
    fl.style.opacity=1; await sleep(260); fl.style.opacity=0; dust.forEach(d=>ZG.scene.remove(d.s)); setTimeout(()=>fl.remove(),400);
    // Belohnung
    let msg='';
    if(A_){ const slot=z.enc.findIndex(e=>!e); if(slot>=0){ z.enc[slot]={animal:{...A_},shiny:null,traits:[],xm:1,addedAt:Date.now(),sl:0}; try{ ZG._encs(); }catch(e){} msg=A_.e+' '+A_.n+' ('+RN[A_.r]+')'; } else { z.mt=(z.mt||0)+A_.p; z.te=(z.te||0)+A_.p; msg=A_.e+' '+A_.n+' (Gehege voll → '+price(A_.p)+' MT)'; } }
    rs.d=1; save(); hud(); (L.frames||[]).filter(s=>s.room===rm).forEach(s=>{ s.fill.scale.setScalar(2.2); s.glowRing.material.opacity=.7; });
    const big=spr(A_?A_.e:'🎁',4,HX+rm.lever.x,5,HZ+2,ZG.scene); let tt=0; const rise=()=>{ tt+=.016; big.position.y=5+Math.sin(tt*3)*.4; if(tt<4.5) requestAnimationFrame(rise); else ZG.scene.remove(big); }; rise();
    try{ ZGfx.confetti(260); }catch(e){} const done=modal('zl-rew','<div style="font-size:3rem">🎉</div><div style="font:900 1.3rem Arial;color:#ffd54f">Raum '+(ri+1)+' geschafft!</div><div style="margin:10px 0;font-size:1rem">Du bekommst:<br><b style="font-size:1.3rem">'+msg+'</b></div>'+(ri%2===1&&ri<9?'<div style="font-size:.85rem;color:#7dffb0">🔓 Etage −'+(Math.floor(ri/2)+2)+' ist jetzt offen!</div>':'')+'<button id="zl-rx" style="'+bs(GREEN)+'">Juhu!</button>'); done.style.zIndex=9300; $('zl-rx').onclick=()=>done.remove();
    L.pulling=false; };

  // ───────── Frame ─────────
  let last=performance.now(), upT=0;
  const frame=()=>{ const now=performance.now(), dt=Math.min(.1,(now-last)/1000); last=now; const pl=ZG.pl;
    try{ if(L.mode==='ride'&&L.ride){ pl.x=SX; pl.z=HZ; pl.y=1.7; const k=Math.min(1,(now-L.ride.t0)/L.ride.dur); const sp_=(L.ride.down?1:-1)*(k<.15?k/.15:(k>.85?(1-k)/.15:1))*34; if(L.tubeMat&&L.tubeMat.map) L.tubeMat.map.offset.y+=sp_*dt*.06; L.pass.position.y+=sp_*dt; if(L.pass.position.y>12) L.pass.position.y-=12; if(L.pass.position.y<-12) L.pass.position.y+=12; ZG.cam.position.set(SX+(Math.random()-.5)*.05,1.7+(Math.random()-.5)*.04,HZ); }
      if(L.mode==='hall'&&L.hall){ let x=pl.x-HX, z=pl.z-HZ; x=Math.max(2.2,Math.min(HL-2,x)); z=Math.max(-HW+1.2,Math.min(HW-1.2,z)); if(x>66.6&&x<71.4&&Math.abs(z)>3){ x=x<69?66.6:71.4; } pl.x=HX+x; pl.z=HZ+z; pl.y=1.7; ZG.cam.position.set(pl.x,1.7,pl.z);
        if(L.shake&&now<L.shake.until){ const a=L.shake.amp; ZG.cam.position.x+=(Math.random()-.5)*a; ZG.cam.position.y+=(Math.random()-.5)*a; ZG.cam.position.z+=(Math.random()-.5)*a; }
        (L.frames||[]).forEach(s=>{ if(s.fill.visible&&!L.pulling) s.fill.position.y=2.8+Math.sin(now/600+s.i)*.12; }); } }catch(e){}
    upT+=dt; if(upT<.25) return; upT=0; L._rf=(L._rf||0)+1; if(L.mode==='hall'&&!L.pulling&&L._rf%4===0) try{ L.refresh(); }catch(e){} try{ const z=zoo(); const on=!!z&&has3(); if(L.sg) L.sg.visible=on&&!ZG._liftActive; const rd=window.ZStation&&ZStation.riding;
      const nearDoor=on&&L.mode==='surface'&&dist(pl,{x:SPOT.x,z:SPOT.z+4})<8&&!rd&&!ZG._jumpActive&&!ZG._arcadeActive; const inHall=L.mode==='hall'&&!L.busy;
      const nearLift=inHall&&(pl.x-HX)<9;
      show('zl-use',nearDoor||nearLift);
      const ns=inHall?L.nearSlot():null; const nb=$('zl-put'); if(nb){ if(ns){ const rs=st().r[ns.room.ri]; const lock=!L.roomUnlocked(ns.room.ri); nb.textContent=rs.d?'✅ Raum fertig':(lock?'🔒 Erst Raum '+ns.room.ri+' abschliessen':(rs.p[ns.i]?'✅ '+ns.a.e+' liegt im Glas':'🫙 '+ns.a.e+' '+ns.a.n+' ins Glas legen')); nb.style.display='block'; nb._sl=ns; } else nb.style.display='none'; }
      const nl=inHall&&!L.pulling?L.nearLever():null; show('zl-lever',!!nl&&L.allIn(nl.ri)&&!st().r[nl.ri].d); const lb=$('zl-lever'); if(lb) lb._rm=nl; }catch(e){} };
  const show=(id,v)=>{ const e=$(id); if(e) e.style.display=v?'block':'none'; };
  const ui=()=>{ nbtn('zl-use','🛗 Aufzug benutzen','background:linear-gradient(135deg,#607d8b,#37474f);color:#fff').onclick=()=>L.picker();
    nbtn('zl-put','🫙 ins Glas legen','background:linear-gradient(135deg,#29b6f6,#0277bd);color:#fff').onclick=function(){ if(this._sl) L.put(this._sl); };
    nbtn('zl-lever','🔧 Hebel umlegen','background:linear-gradient(135deg,#ff7043,#d84315);color:#fff;font-size:1.15rem').onclick=function(){ if(this._rm) L.pull(this._rm); }; };
  const boot=()=>{ try{ if(typeof ZG==='undefined'||!ZG.scene||!ZG.renderer||!ZG.cam||!zoo()) return setTimeout(boot,1000); ui(); L.buildSurface(); const r=ZG.renderer, o=r.render.bind(r); r.render=function(s,c){ if(s===ZG.scene){ try{ frame(); }catch(e){} } return o(s,c); }; }catch(e){ console.warn('ZLift boot',e); setTimeout(boot,1500); } };
  setTimeout(boot,2700);
  }
  wait();
})();
