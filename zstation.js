/* ═══ ZStation (v763): realistische Gondelstation, Seilbahn mit Masten, Gondeln mit Türen, begehbare Halle ═══ */
(function(){
  if(window.ZStation) return;
  const S=window.ZStation={inside:false,cabins:[],built:false,owner:new WeakMap(),pylonX:[24,33]};
  // ── Strecke (geschlossene Schleife): Halle (Wende bei x=-9) → Seil → Gegenstation (Wende bei x=45) → zurück ──
  const R=5, AX=-9, CX=45, SL=54, ARC=Math.PI*R, L=2*SL+2*ARC, SP=11,VD=4.4, YH=1.3, YO=6.8;
  const hgt=x=>{ const t=Math.min(1,Math.max(0,(x-12)/16)); return YH+(YO-YH)*t*t*(3-2*t); };
  S.pathAt=function(u){ u=((u%L)+L)%L; let x,z,dx,dz,th;
    if(u<ARC/2){ th=Math.PI+u/R; x=AX+R*Math.cos(th); z=R*Math.sin(th); dx=-Math.sin(th); dz=Math.cos(th); }
    else if(u<ARC/2+SL){ x=AX+(u-ARC/2); z=-R; dx=1; dz=0; }
    else if(u<ARC/2+SL+ARC){ th=-Math.PI/2+(u-ARC/2-SL)/R; x=CX+R*Math.cos(th); z=R*Math.sin(th); dx=-Math.sin(th); dz=Math.cos(th); }
    else if(u<ARC/2+2*SL+ARC){ x=CX-(u-ARC/2-SL-ARC); z=R; dx=-1; dz=0; }
    else { th=Math.PI/2+(u-(ARC/2+2*SL+ARC))/R; x=AX+R*Math.cos(th); z=R*Math.sin(th); dx=-Math.sin(th); dz=Math.cos(th); }
    return {x,z,y:hgt(x),dx,dz}; };
  const RC={normal:0x95a5a6,rare:0x3498DB,epic:0x9B59B6,legendary:0xF39C12,ultralegendary:0xFFD700,god:0xE74C3C,mythic:0x00FF88,secret:0xFF1493,eternal:0xFFFFFF};
  const RN={normal:'Normal',rare:'Selten',epic:'Episch',legendary:'Legendär',god:'Gott',mythic:'Mythisch',ultralegendary:'Ultra Legendär',secret:'Geheim',eternal:'Ewig'};
  const hex=c=>'#'+('000000'+c.toString(16)).slice(-6);
  const price=p=>{ try{ return typeof $mt==='function'?$mt(p):String(p); }catch(e){ return String(p); } };
  // ── Materialien / Helfer ──
  const MC={}; const MB=(c,o)=>{ const k=c+(o?JSON.stringify(o):''); return MC[k]||(MC[k]=new THREE.MeshBasicMaterial(Object.assign({color:c},o||{}))); };
  const box=(w,h,d,c,x,y,z,p,o)=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),(c&&c.isMaterial)?c:MB(c,o)); m.position.set(x,y,z); if(p) p.add(m); return m; };
  const cv=(w,h)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; };
  const signTex=(txt,w,h,bg,fg,sz)=>{ const c=cv(w,h), g=c.getContext('2d'); g.fillStyle=bg; g.fillRect(0,0,w,h); g.strokeStyle='rgba(255,255,255,.85)'; g.lineWidth=6; g.strokeRect(5,5,w-10,h-10); g.fillStyle=fg; g.font='900 '+(sz||h*.5)+'px Arial Black,Arial,sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(txt,w/2,h/2+3); const t=new THREE.CanvasTexture(c); t.anisotropy=4; return t; };
  const sign=(txt,w,h,pw,ph,bg,fg,x,y,z,ry,p)=>{ const m=new THREE.Mesh(new THREE.PlaneGeometry(pw,ph),new THREE.MeshBasicMaterial({map:signTex(txt,w,h,bg,fg)})); m.position.set(x,y,z); m.rotation.y=ry||0; if(p) p.add(m); return m; };
  const solarTex=()=>{ const c=cv(128,64), g=c.getContext('2d'); g.fillStyle='#1d2e50'; g.fillRect(0,0,128,64); g.strokeStyle='rgba(190,205,230,.55)'; g.lineWidth=1.5; for(let x=0;x<=128;x+=16){ g.beginPath(); g.moveTo(x,0); g.lineTo(x,64); g.stroke(); } for(let y=0;y<=64;y+=16){ g.beginPath(); g.moveTo(0,y); g.lineTo(128,y); g.stroke(); } g.fillStyle='rgba(120,160,230,.12)'; g.fillRect(0,0,128,32); const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(7,4); t.anisotropy=4; return t; };
  const strut=(a,b,th,col,p)=>{ const d=new THREE.Vector3().subVectors(b,a), len=d.length(); const m=new THREE.Mesh(new THREE.BoxGeometry(th,th,len),MB(col)); m.position.copy(a).addScaledVector(d,.5); m.lookAt(b); p.add(m); return m; };
  const top=x=>10.5+(x+15.4)*0.0513;
  const trap=(x0,x1,y0,d,mat,p,z)=>{ const sh=new THREE.Shape(); sh.moveTo(x0,y0); sh.lineTo(x1,y0); sh.lineTo(x1,top(x1)); sh.lineTo(x0,top(x0)); sh.closePath(); const g=new THREE.ExtrudeGeometry(sh,{depth:d,bevelEnabled:false}); const m=new THREE.Mesh(g,mat); m.position.z=z-d/2; p.add(m); return m; };
  // ── Gondel ──
  const emTex={}; const emojiTex=e=>{ if(emTex[e]) return emTex[e]; const c=cv(128,128), g=c.getContext('2d'); g.font='96px serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(e,64,68); return emTex[e]=new THREE.CanvasTexture(c); };
  function mkCabin(i){
    const g=new THREE.Group(), b=new THREE.Group(); b.position.y=-2.6; g.add(b);
    const glass=MB(0xdcb98f,{transparent:true,opacity:.34,depthWrite:false}), dk=0x16181b;
    box(2.0,.85,2.6,0xaeb4ba,0,-.82,0,b); box(2.02,.07,2.62,0x8a9096,0,-.52,0,b); box(1.9,.2,2.5,0x2b2b2e,0,-1.35,0,b);
    for(let k=-1;k<=1;k+=2){ box(.03,.5,.9,0xc6ccd2,1.02,-.9,k*.65,b); }
    box(1.94,1.4,2.54,glass,0,.3,0,b); box(1.8,.06,2.4,0x6b5a4a,0,-.38,0,b); box(.5,.14,2.2,0x7a4b2a,-.7,-.28,0,b);
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(q=>box(.09,1.45,.09,dk,q[0]*.98,.3,q[1]*1.27,b));
    [-1,1].forEach(s=>{ box(2.0,.08,.08,dk,0,1.0,s*1.27,b); box(2.0,.08,.08,dk,0,-.38,s*1.27,b); box(.08,.08,2.6,dk,s*.98,1.0,0,b); box(.08,.08,2.6,dk,s*.98,-.38,0,b); });
    const mkDoor=()=>{ const d=new THREE.Group(); box(.05,1.34,1.1,glass,0,0,0,d); box(.07,.08,1.12,dk,0,.67,0,d); box(.07,.08,1.12,dk,0,-.67,0,d); box(.07,1.36,.08,dk,0,0,.55,d); box(.07,1.36,.08,dk,0,0,-.55,d); return d; };
    const dL=mkDoor(), dR=mkDoor(); dL.position.set(1.03,.3,-.55); dR.position.set(1.03,.3,.55); b.add(dL); b.add(dR);
    const roof=new THREE.Mesh(new THREE.SphereGeometry(1.5,14,6,0,6.283,0,1.5708),MB(0x8f959b)); roof.scale.set(.74,.5,1.75); roof.position.y=1.0; b.add(roof);
    const bar=box(.8,.1,.35,0xffffff,0,1.5,0,b); bar.material=new THREE.MeshBasicMaterial({color:0xffffff});
    [-1,1].forEach(s=>{ const bu=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.2,12),MB(0x101010)); bu.rotation.z=Math.PI/2; bu.position.set(s*1.12,.15,0); b.add(bu); });
    box(.16,1.2,.16,0x30343a,0,2.0,0,b); box(.5,.3,.8,0xc62828,0,2.6,0,b);
    const spr=new THREE.Sprite(new THREE.SpriteMaterial({transparent:true,depthWrite:false})); spr.scale.set(1.5,1.5,1); spr.position.set(0,.2,0); spr.visible=false; b.add(spr);
    const lab=new THREE.Sprite(new THREE.SpriteMaterial({transparent:true,depthTest:false})); lab.scale.set(4.2,2.1,1); lab.position.set(0,3.5,0); lab.renderOrder=20; lab.visible=false; b.add(lab);
    return {g,b,dL,dR,spr,lab,bar,u:-i*SP,door:0,fresh:true,obj:null,key:'',idx:i,sway:Math.random()*6};
  }
  const labTex=(a,sub)=>{ const c=cv(256,128), g=c.getContext('2d'); const col=hex(RC[a.r]||0x95a5a6); g.fillStyle='rgba(10,14,28,.88)'; g.strokeStyle=col; g.lineWidth=5; const r=14; g.beginPath(); g.moveTo(r,3); g.arcTo(253,3,253,125,r); g.arcTo(253,125,3,125,r); g.arcTo(3,125,3,3,r); g.arcTo(3,3,253,3,r); g.fill(); g.stroke();
    g.font='46px serif'; g.textAlign='left'; g.textBaseline='middle'; g.fillText(a.e,14,44); g.fillStyle='#fff'; g.font='900 25px Arial'; g.fillText(a.n.length>14?a.n.slice(0,13)+'…':a.n,70,34); g.fillStyle=col; g.font='900 21px Arial'; g.fillText((RN[a.r]||a.r).toUpperCase(),16,86); g.fillStyle='#ffd54f'; g.textAlign='right'; g.font='900 23px Arial'; g.fillText(sub,244,96); return new THREE.CanvasTexture(c); };
  // ── Bauen ──
  S.build=function(Z){
    if(S.built) return; S.built=true; const sc=Z.scene; const G=new THREE.Group(); sc.add(G); S.group=G; Z._carMeshes=[];
    const CON=0xc9ccd1, CON2=0xb2b6bc, RED=0xd32f2f, glassM=new THREE.MeshBasicMaterial({color:0x7fb8d8,transparent:true,opacity:.30,side:THREE.DoubleSide,depthWrite:false});
    // Platz & Sockel
    box(46,.1,34,0xcfd2d6,0,.05,3,G); box(32.6,.12,20.6,0xb4b8bd,0,.06,0,G); box(30,.06,18.4,0x6d7075,0,.1,0,G); box(.25,.02,11,0xffcc00,-11.6,.14,0,G);
    for(let k=0;k<6;k++) box(1.6,.02,.3,0xffffff,-6+k*2.6,.12,13.5,G);
    // Wände
    trap(-15.4,15.4,0,.8,MB(CON),G,-9.6); box(30.8,1.2,.84,0x9a9ea4,0,.6,-9.6,G);
    box(.8,top(-15.4),19.6,CON2,-15.4,top(-15.4)/2,0,G); box(.84,1.2,19.8,0x9a9ea4,-15.4,.6,0,G);
    [[-8.45,2.3],[0,5.4],[8.45,2.3]].forEach(q=>box(.8,12.1,q[1],CON,15.4,6.05,q[0],G)); box(.8,7.3,19.6,CON,15.4,8.45,0,G);
    [-5,5].forEach(sz=>{ box(.3,.35,4.8,RED,15.9,4.85,sz,G); [-1,1].forEach(s=>box(.3,4.4,.35,RED,15.9,2.6,sz+s*2.35,G)); box(.2,.9,4.2,0x16181b,15.95,5.3,sz,G); });
    // Südfront: Betonsockel, Glas, Tür, Schild
    [-9.2,9.2].forEach(x=>{ box(12.4,1.2,.6,0xb9bcc1,x,.6,9.6,G); });
    trap(-15.4,-3,1.2,.14,glassM,G,9.6); trap(3,15.4,1.2,.14,glassM,G,9.6); trap(-3,3,6.5,.6,MB(CON),G,9.6);
    for(let i=0;i<=4;i++){ [-1,1].forEach(s=>{ const x=s*(3.5+i*2.95); box(.14,top(x)-1.2,.24,0x16181b,x,(top(x)+1.2)/2,9.7,G); }); }
    box(6.4,.14,.5,0x16181b,0,6.5,9.8,G); [-1,1].forEach(s=>box(.3,6.5,.45,RED,s*3.15,3.25,9.75,G));
    sign('GONDELSTATION',512,120,5.9,1.4,'#0d47a1','#ffffff',0,8.55,9.94,0,G);
    sign('MISCHA ZOO',320,80,3,.75,'#c62828','#fff3c4',0,7.4,9.94,0,G);
    // Dach (Solar) + Rand
    const solM=[MB(0x4a4f57),MB(0x4a4f57),new THREE.MeshBasicMaterial({map:solarTex()}),MB(0x2d3036),MB(0x4a4f57),MB(0x4a4f57)];
    const roof=new THREE.Mesh(new THREE.BoxGeometry(36,.5,23.6),solM); roof.position.set(0,11.55,0); roof.rotation.z=.0513; G.add(roof);
    // Stahlbau innen (rot)
    [-12,-4,4,12].forEach(x=>{ [-9,8.9].forEach(z=>box(.6,top(x),.6,RED,x,top(x)/2,z,G)); box(.5,.7,18.4,RED,x,top(x)-.35,0,G); });
    [-5,5].forEach(z=>{ box(30,.7,.5,RED,0,9.2,z,G); });
    [-2.5,2.5].forEach(z=>box(26,.08,.5,0xfff6dc,0,10.2,z,G));
    // Große Wendescheibe (Seilumlenkung) mit Streben
    const wheel=new THREE.Group(); wheel.position.set(AX,YH+2.6,0); G.add(wheel); S.wheel=wheel;
    const tor=new THREE.Mesh(new THREE.TorusGeometry(R+.3,.28,6,40),MB(RED)); tor.rotation.x=Math.PI/2; wheel.add(tor);
    for(let k=0;k<6;k++){ const sp=box(R*2+.6,.16,.3,0xa82323,0,0,0,wheel); sp.rotation.y=k*Math.PI/6; } const hub=new THREE.Mesh(new THREE.CylinderGeometry(.7,.7,.6,12),MB(0x30343a)); wheel.add(hub);
    const post=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,9,10),MB(0x6b6f76)); post.position.set(AX,YH+2.6+4.5+.4,0); G.add(post);
    // Rollenbatterien entlang der Seile (instanziert)
    const nr=44, rm=new THREE.InstancedMesh(new THREE.CylinderGeometry(.22,.22,.5,8),MB(0x101010),nr), dm=new THREE.Object3D(); let ri=0;
    for(let x=AX;x<=15&&ri<nr;x+=1.5){ [-R,R].forEach(z=>{ if(ri>=nr) return; dm.position.set(x,YH+2.6-.2,z); dm.rotation.set(Math.PI/2,0,0); dm.updateMatrix(); rm.setMatrixAt(ri++,dm.matrix); }); } rm.count=ri; G.add(rm);
    // Schilder innen
    sign('MISCHA GONDEL',512,128,5,1.25,'#0d47a1','#ffffff',-14.95,7.4,0,Math.PI/2,G); sign('S1',128,64,1.2,.6,'#fdd835','#111',-14.95,5.6,0,Math.PI/2,G);
    sign('↻ Gondeln fahren hier ein',512,100,5.5,1.0,'#212121','#ffd54f',15.0-0.46,3.6,-8.2,-Math.PI/2,G);
    // Außendeko
    [-1,1].forEach(s=>{ const pl=box(2.2,.6,1.1,0x8d6e63,s*6.2,.3,12.5,G); for(let k=-1;k<=1;k++){ const b=new THREE.Mesh(new THREE.SphereGeometry(.5,8,6),MB(0x2e8b3d)); b.position.set(s*6.2+k*.6,.85,12.5); G.add(b); }
      const pole=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,6,6),MB(0x555a60)); pole.position.set(s*9.5,3,12.5); G.add(pole); const lp=new THREE.Mesh(new THREE.SphereGeometry(.35,8,6),MB(0xfff0b0)); lp.position.set(s*9.5,6.1,12.5); G.add(lp);
      const fp=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,9,6),MB(0xcccccc)); fp.position.set(s*17.2,4.5,10.8); G.add(fp); const fl=box(2.2,1.3,.05,s>0?0xd32f2f:0xffffff,s*17.2+s*1.1,8.2,10.8,G); });
    // Mast-Gegenstation
    const CS=new THREE.Group(); G.add(CS); box(17,5,19,0xb7bbc1,45,2.5,0,CS); box(17.4,.4,19.4,0x8f939a,45,5.2,0,CS);
    [-9.3,9.3].forEach(z=>box(17,6.8,.3,glassM,45,8.6,z,CS)); box(.3,6.8,19,glassM,53.7,8.6,0,CS);
    [[36.7,-9.3],[36.7,9.3],[53.4,-9.3],[53.4,9.3]].forEach(q=>box(.6,7.2,.6,RED,q[0],8.6,q[1],CS)); box(18,.5,20,0x3a4a6a,45,12.4,0,CS); box(17.4,.14,19.4,new THREE.MeshBasicMaterial({map:solarTex()}),45,12.7,0,CS);
    [-5,5].forEach(z=>box(17,.5,.4,RED,45,11.2,z,CS)); sign('GEGENSTATION',480,110,6,1.4,'#0d47a1','#fff',45,3.6,9.7,0,CS);
    const wh2=new THREE.Group(); wh2.position.set(CX,YO+2.6,0); CS.add(wh2); S.wheel2=wh2; const t2=new THREE.Mesh(new THREE.TorusGeometry(R+.3,.28,6,40),MB(RED)); t2.rotation.x=Math.PI/2; wh2.add(t2); for(let k=0;k<6;k++){ const sp=box(R*2+.6,.16,.3,0xa82323,0,0,0,wh2); sp.rotation.y=k*Math.PI/6; }
    const ps=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,YO+2.6-5.2,10),MB(0x6b6f76)); ps.position.set(CX,5.2+(YO+2.6-5.2)/2,0); CS.add(ps);
    // Masten (Gitter)
    S.pylonX.forEach(px=>{ const P=new THREE.Group(); P.position.set(px,0,0); G.add(P); const H=13, tp=.9, bs=2.1; const cor=[[-1,-1],[1,-1],[-1,1],[1,1]];
      cor.forEach(c=>strut(new THREE.Vector3(c[0]*bs,0,c[1]*bs),new THREE.Vector3(c[0]*tp,H,c[1]*tp),.32,0x8e9399,P));
      for(let lv=0;lv<4;lv++){ const y0=lv*H/4, y1=(lv+1)*H/4, w0=bs-(bs-tp)*lv/4, w1=bs-(bs-tp)*(lv+1)/4;
        [[-1,0],[1,0],[0,-1],[0,1]].forEach(f=>{ const a=f[0]!==0?[[f[0]*w0,y0,-w0],[f[0]*w0,y0,w0],[f[0]*w1,y1,-w1],[f[0]*w1,y1,w1]]:[[-w0,y0,f[1]*w0],[w0,y0,f[1]*w0],[-w1,y1,f[1]*w1],[w1,y1,f[1]*w1]]; const v=a.map(q=>new THREE.Vector3(q[0],q[1],q[2])); strut(v[0],v[3],.14,0xaab0b6,P); strut(v[1],v[2],.14,0xaab0b6,P); strut(v[0],v[1],.16,0x8e9399,P); });
      }
      box(1.8,.5,13.6,0x6e737a,0,H+.2,0,P); [-R,R].forEach(z=>{ box(.35,2.6,.35,0x30343a,0,H-1.2,z,P); box(1.4,.5,1.0,0x1d1f23,0,YO+2.6-.35+0,z,P); const sh=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,.3,12),MB(0xc62828)); sh.rotation.x=Math.PI/2; sh.position.set(0,YO+2.6,z); P.add(sh); });
      box(.9,.6,.9,0xd32f2f,0,H+.75,0,P); });
    // Seil (Röhre entlang der Schleife)
    const pts=[]; for(let u=0;u<L;u+=1.2){ const p=S.pathAt(u); pts.push(new THREE.Vector3(p.x,p.y+2.6,p.z)); } const cur=new THREE.CatmullRomCurve3(pts,true); const cab=new THREE.Mesh(new THREE.TubeGeometry(cur,360,.07,5,true),MB(0x2b2d31)); G.add(cab);
    // Gondeln
    for(let i=0;i<8;i++){ const c=mkCabin(i); c.u=0; c.g.visible=false; S.cabins.push(c); G.add(c.g); }
    // Eingangs-Knopf & Kaufleiste (HTML)
    S._ui();
    // Render-Hook
    const hook=()=>{ try{ if(!Z.renderer||S._hooked) return; S._hooked=1; const r=Z.renderer, o=r.render.bind(r); r.render=function(s,c){ try{ if(s===Z.scene) S.frame(); }catch(e){} return o(s,c); }; }catch(e){} }; hook(); setTimeout(hook,1000);
  };
  // ── Frame ──
  S._t=performance.now();
  const wrapD=d=>{ d%=L; if(d>L/2) d-=L; if(d<-L/2) d+=L; return d; };
  S.frame=function(){ const now=performance.now(), dt=Math.min(.1,(now-S._t)/1000); S._t=now; const Z=ZG; if(!S.built||!Z.gQ) return;
    // Zuordnung Warteschlange → Gondeln (nur Gondeln mit Tier sind sichtbar)
    const q=Z.gQ.slice(0,6);
    S.cabins.forEach(c=>{ if(c.obj&&!c.dep&&!q.includes(c.obj)){ c.dep=true; c.slot=-1; } });
    q.forEach((o,j)=>{ let c=S.owner.get(o); if(!c||c.obj!==o){ c=S.cabins.find(k=>!k.obj); if(!c) return; c.obj=o; c.dep=false; c.key=''; c.u=-j*SP; c.sc=0; c.door=0; S.owner.set(o,c); } c.slot=j; });
    S.cabins.forEach(c=>{ c.g.visible=!!c.obj; if(!c.obj) return;
      let d=0; if(c.dep){ c.u+=VD*dt; if(c.u>44){ c.obj=null; c.dep=false; c.g.visible=false; return; } }
      else { const tu=-c.slot*SP; d=wrapD(tu-c.u); if(d<-.5) d+=L; if(d>.02){ c.u+=Math.min(d,Math.min(VD*1.8,Math.max(.8,d*1.6))*dt); } else c.u=tu; }
      const p=S.pathAt(c.u); c.g.position.set(p.x,p.y+2.6,p.z); c.g.rotation.y=Math.atan2(-p.dx,-p.dz);
      c.sc=Math.min(1,(c.sc||0)+dt*.8); c.g.scale.setScalar(.4+.6*c.sc);
      const mov=d>.05||c.dep; c.sway+=dt*(mov?3:1.4); c.g.rotation.z=Math.sin(c.sway)*(p.x>16?.045:.012)*(mov?1.4:1); c.g.rotation.x=Math.sin(c.sway*.7)*.015;
      const open=(!c.dep&&c.slot===0&&d<.2)?1:0; c.door+=Math.sign(open-c.door)*Math.min(Math.abs(open-c.door),dt*.7);
      const o=c.door, ss=1-.6*o; c.dL.scale.z=ss; c.dR.scale.z=ss; c.dL.position.z=-(.55+.46*o); c.dR.position.z=.55+.46*o;
      const ob=c.obj; c.spr.visible=true; c.lab.visible=false;
      if(c.key!==(ob.isCloverOnly?'clover':ob.a.id)){ c.key=ob.isCloverOnly?'clover':ob.a.id; const e=ob.isCloverOnly?'🍀':ob.a.e; c.spr.material.map=emojiTex(e); c.spr.material.needsUpdate=true; const col=ob.isCloverOnly?0x4caf50:(RC[ob.a.r]||0x95a5a6); c.bar.material.color.setHex(col); c.lab.material.map=ob.isCloverOnly?labTex({e:'🍀',n:'Kleeblatt',r:'normal'},'Glück'):labTex(ob.a,price(ob.a.p)); c.lab.material.needsUpdate=true; }
      c.spr.position.y=.2+Math.sin(c.sway*1.3)*.04; c.lab.visible=S.inside&&p.x<15.6&&!c.dep&&c.slot<=1; });
    if(S.wheel) S.wheel.rotation.y+=dt*.55; if(S.wheel2) S.wheel2.rotation.y+=dt*.55;
    // Kollision + Innen-Erkennung
    try{ const pl=Z.pl; if(pl&&pl.y<4){ const x=pl.x,zz=pl.z, inO=Math.abs(x)<16.6&&Math.abs(zz)<10.8, inI=Math.abs(x)<14.4&&Math.abs(zz)<8.6, gap=zz>8.6&&Math.abs(x)<2.6;
        if(inO&&!inI&&!gap&&S._lp){ pl.x=S._lp.x; pl.z=S._lp.z; } else S._lp={x:pl.x,z:pl.z};
        const ins=Math.abs(pl.x)<14.4&&Math.abs(pl.z)<8.6&&pl.y<4; if(ins!==S.inside){ S.inside=ins; S._uiUpd(true); } } }catch(e){}
    S._uiUpd();
  };

  // Pfeil-Navigation: um die Gondelstation herumleiten (v763)
  (function(){ const HX=19,HZ=13;
    const inR=(x,z)=>Math.abs(x)<HX&&Math.abs(z)<HZ;
    const hit=(a,b)=>{ for(let i=0;i<=24;i++){ const t=i/24; if(inR(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t)) return true; } return false; };
    const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
    S.nav=function(p,t){ if(!S.built) return t; let tt=t; if(inR(t.x,t.z)) tt={x:0,z:HZ+3};
      if(inR(p.x,p.z)||!hit(p,tt)) return tt;
      let best=null,bl=1e9; [[-HX,-HZ],[HX,-HZ],[-HX,HZ],[HX,HZ]].forEach(c=>{ const w={x:c[0]*1.02,z:c[1]*1.02}; if(hit(p,w)||hit(w,tt)) return; const l=dist(p,w)+dist(w,tt); if(l<bl){ bl=l; best=w; } });
      if(best) return best;
      // zwei Ecken (gegenüberliegende Seite)
      [[-HX,-HZ],[HX,-HZ],[HX,HZ],[-HX,HZ]].forEach((c,i,a)=>{ const n=a[(i+1)%4], w1={x:c[0]*1.02,z:c[1]*1.02}, w2={x:n[0]*1.02,z:n[1]*1.02}; if(hit(p,w1)||hit(w1,w2)||hit(w2,tt)) return; const l=dist(p,w1)+dist(w1,w2)+dist(w2,tt); if(l<bl){ bl=l; best=w1; } });
      return best||tt; };
  })();
  // ── Rein/Raus ──
  S.enter=function(){ const pl=ZG.pl; pl.x=-3; pl.z=3.5; S._lp={x:pl.x,z:pl.z}; const dx=-14+3, dz=0-3.5; ZG.yaw=Math.atan2(-dx,-dz); ZG.pitch=-.02; };
  S.exit=function(){ const pl=ZG.pl; pl.x=0; pl.z=14.5; S._lp={x:pl.x,z:pl.z}; ZG.yaw=Math.PI; ZG.pitch=0; };
  // ── UI ──
  S._ui=function(){ if(document.getElementById('zs-in')) return;
    const b=document.createElement('button'); b.id='zs-in'; b.textContent='🚪 Drinnen'; b.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:196px;z-index:130;display:none;padding:12px 26px;border:none;border-radius:30px;background:linear-gradient(135deg,#ffd54f,#ff9800);color:#2a1700;font:900 1rem Arial;box-shadow:0 4px 0 #b35c00,0 8px 16px rgba(0,0,0,.4)'; b.onclick=()=>S.enter(); document.body.appendChild(b);
    const r=document.createElement('div'); r.id='zs-bar'; r.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:186px;z-index:130;display:none;width:min(94vw,430px);background:rgba(8,12,26,.92);border:2px solid #ffd54f;border-radius:16px;padding:8px 10px;color:#fff;font-family:Arial,sans-serif'; document.body.appendChild(r); };
  S._uiUpd=function(force){ const now=Date.now(); if(!force&&now-(S._ut||0)<250) return; S._ut=now; const ib=document.getElementById('zs-in'), bar=document.getElementById('zs-bar'); if(!ib||!bar) return; const Z=ZG, pl=Z.pl; const near=Math.hypot(pl.x,pl.z)<24&&!S.inside&&pl.y<4&&!Z.carrying;
    let tg=false; try{ const T=Tutorial; tg=T._active&&T._list()[T._stepIdx]&&['gondola','gluck','buy'].includes(T._list()[T._stepIdx].id); }catch(e){}
    ib.style.display=near&&!tg&&!(window.ZTread&&(ZTread.on||ZTread.tour))?'block':'none'; const wb=document.getElementById('wbar'); if(wb) wb.style.visibility=S.inside?'hidden':''; if(!S.inside){ bar.style.display='none'; bar.dataset.k=''; return; }
    const g=Z.gQ&&Z.gQ[0]; if(!g){ bar.style.display='none'; return; } bar.style.display='block'; const z=ZS.zoo, tm=(typeof ZS!=='undefined'&&ZS.dsMT||0);
    if(g.isCloverOnly){ bar.innerHTML='<div style="display:flex;align-items:center;gap:10px"><div style="font-size:2.2rem">🍀</div><div style="flex:1"><div style="font-weight:900;color:'+g.cloverStage.color+'">'+g.cloverStage.name+'-Glück</div><div style="font-size:.74rem;opacity:.75">Kleeblatt-Kette – kein Tier zum Kaufen</div></div>'+S._btns()+'</div>'; return; }
    const a=g.a, can=(tm+z.mt)>=a.p, slot=z.enc.some(e=>!e), col=hex(RC[a.r]||0x95a5a6);
    const gt=document.getElementById('gtimer'), key=a.id+'|'+can+'|'+slot;
    if(bar.dataset.k===key&&!force){ const t=document.getElementById('zs-tm'); if(t&&gt) t.textContent=gt.textContent; return; }
    bar.dataset.k=key;
    bar.innerHTML='<div style="display:flex;align-items:center;gap:10px"><div style="font-size:2.4rem;filter:drop-shadow(0 0 8px '+col+')">'+a.e+'</div><div style="flex:1;min-width:0"><div style="font-weight:900;font-size:1rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+a.n+'</div><div style="font-size:.72rem"><span style="background:'+col+';color:#111;font-weight:900;border-radius:8px;padding:1px 8px">'+(RN[a.r]||a.r)+'</span> <span style="color:#ffd54f;font-weight:900;font-size:.9rem">'+price(a.p)+'</span> <span style="opacity:.6" id="zs-tm">'+(document.getElementById('gtimer')?document.getElementById('gtimer').textContent:'')+'</span></div>'+(!can?'<div style="font-size:.68rem;color:#ff8a80">Zu wenig Mischataler</div>':(!slot?'<div style="font-size:.68rem;color:#ff8a80">Kein freies Gehege</div>':''))+'</div>'
      +'<button onpointerdown="ZStation.hold()" onclick="ZStation.buy(\''+a.id+'\')" style="padding:11px 16px;border:none;border-radius:12px;background:'+(can&&slot?'linear-gradient(135deg,#43a047,#2e7d32)':'#555')+';color:#fff;font:900 .95rem Arial">🛒 Kaufen</button></div>'+'<div style="display:flex;gap:6px;margin-top:6px">'+S._btns(1)+'</div>'; };
  S._btns=function(only){ const m='<button onclick="ZP.open(\'gond\')" style="flex:1;padding:7px;border:none;border-radius:10px;background:rgba(255,255,255,.14);color:#fff;font:700 .72rem Arial">🍀 Glück &amp; mehr</button><button onclick="ZStation.exit()" style="flex:1;padding:7px;border:none;border-radius:10px;background:rgba(231,76,60,.35);color:#fff;font:700 .72rem Arial">🚪 Raus</button>'; return only?m:'<div style="display:flex;flex-direction:column;gap:4px">'+m+'</div>'; };
  S.hold=function(){ try{ ZP._buyInFlight=true; clearTimeout(S._ht); S._ht=setTimeout(()=>{ ZP._buyInFlight=false; },2500); }catch(e){} };
  S.buy=function(id){ try{ const g=ZG.gQ[0]; if(!g||g.isCloverOnly) return; ZP._buyG(id||g.a.id); ZP._buyInFlight=false; S._uiUpd(true); setTimeout(()=>{ if(ZG.carrying) S.exit(); },250); }catch(e){} };
  window.addEventListener('load',()=>{ try{ S._ui(); }catch(e){} });
})();

/* ═══ ZEncDecor (v763): Gehege-Details je nach Tierart ═══ */
(function(){
  if(window.ZEncDecor) return;
  const D=window.ZEncDecor={};
  const MC={}; const mb=c=>MC[c]||(MC[c]=new THREE.MeshBasicMaterial({color:c}));
  const bx=(w,h,d,c,x,y,z,g)=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mb(c)); m.position.set(x,y,z); g.add(m); return m; };
  const cyl=(r1,r2,h,c,x,y,z,g,s)=>{ const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,s||10),mb(c)); m.position.set(x,y,z); g.add(m); return m; };
  const sph=(r,c,x,y,z,g,sy)=>{ const m=new THREE.Mesh(new THREE.SphereGeometry(r,10,8),mb(c)); m.position.set(x,y,z); if(sy) m.scale.y=sy; g.add(m); return m; };
  const RC={normal:'#95a5a6',rare:'#3498DB',epic:'#9B59B6',legendary:'#F39C12',ultralegendary:'#FFD700',god:'#E74C3C',mythic:'#00FF88',secret:'#FF1493',eternal:'#FFFFFF'};
  const RN={normal:'Normal',rare:'Selten',epic:'Episch',legendary:'Legendär',god:'Gott',mythic:'Mythisch',ultralegendary:'Ultra Legendär',secret:'Geheim',eternal:'Ewig'};
  const sets={
    water:'🐟🐠🐡🐬🐳🐋🦈🐙🦑🦀🦞🦐🐚🦭🐊🐢🐸🦆🦢🦩🦦🪼',
    arctic:'🐧🐻‍❄️❄️🦌🦣',
    desert:'🐪🐫🦂🦎🐍🌵🦅🦔',
    savanna:'🦁🐘🦒🦓🦏🦛🐆🐃🦬🦘🐅',
    jungle:'🐒🦍🦧🦜🦥🐦🦚🐜🐝🦋🐛',
    farm:'🐄🐖🐑🐴🐔🐓🐐🦃🐷🐮🐏🐎🦆🐇🐰🐕🐈🐶🐱🐹🐭',
    fantasy:'🦄🐉🐲🔥👻👽🤖🦖🦕😈⚡'
  };
  const kindOf=a=>{ const e=a.e||''; for(const k in sets){ for(const ch of Array.from(sets[k])) if(ch!=='‍'&&e.indexOf(ch)>=0) return k; }
    let h=0; const s=a.id||a.n||''; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))|0; return ['forest','forest','farm','jungle'][Math.abs(h)%4]; };
  const FLOOR={water:0x6fae6a,arctic:0xe9f2f7,desert:0xd9bd7a,savanna:0xc9b45a,jungle:0x2f7a35,farm:0x6fae45,fantasy:0x8c6fd0,forest:0x4f8f3a};
  const tree=(g,x,z,s,kind)=>{ cyl(.18*s,.25*s,1.8*s,0x6b4423,x,.9*s,z,g,6); if(kind==='arctic'){ [[1,.9],[1.4,.6],[1.9,.4]].forEach((q,i)=>{ const c=new THREE.Mesh(new THREE.ConeGeometry(q[1]*s,1.1*s,7),mb(i%2?0xf2f6f8:0x2e6b4a)); c.position.set(x,(1.5+i*.8)*s,z); g.add(c); }); }
    else if(kind==='jungle'){ [0,1,2,3,4].forEach(i=>{ const a=i*1.26; const l=bx(1.5*s,.06,.4*s,0x1f8a3a,x+Math.cos(a)*.7*s,2.0*s,z+Math.sin(a)*.7*s,g); l.rotation.y=-a; l.rotation.z=.4; }); }
    else sph(1.0*s,kind==='fantasy'?0xff8bd1:0x2e8b3d,x,2.3*s,z,g,.85); };
  const cactus=(g,x,z)=>{ cyl(.22,.22,1.8,0x3f8f4a,x,.9,z,g,8); cyl(.14,.14,.7,0x3f8f4a,x-.4,1.1,z,g,6); cyl(.14,.14,.6,0x3f8f4a,x+.4,1.3,z,g,6); };
  const rocks=(g,x,z,c)=>{ [[0,0,.55],[.6,.2,.38],[-.4,.5,.32]].forEach(q=>{ const r=new THREE.Mesh(new THREE.DodecahedronGeometry(q[2],0),mb(c)); r.position.set(x+q[0],q[2]*.6,z+q[1]); r.scale.y=.7; g.add(r); }); };
  const trough=(g,x,z,ry)=>{ const t=new THREE.Group(); bx(1.5,.35,.6,0x8d6e63,0,.3,0,t); bx(1.3,.08,.4,0xd9a441,0,.5,0,t); t.position.set(x,0,z); t.rotation.y=ry||0; g.add(t); };
  const bowl=(g,x,z,col)=>{ cyl(.55,.45,.2,0x9aa3ab,x,.2,z,g,14); cyl(.46,.46,.05,col||0x4fc3f7,x,.31,z,g,14); };
  const textTex=(a)=>{ const c=document.createElement('canvas'); c.width=256; c.height=128; const g=c.getContext('2d'); const col=RC[a.r]||'#95a5a6';
    g.fillStyle='#6b4423'; g.fillRect(0,0,256,128); g.fillStyle='#f5e6c4'; g.fillRect(8,8,240,112); g.strokeStyle=col; g.lineWidth=7; g.strokeRect(8,8,240,112);
    g.font='38px serif'; g.textAlign='left'; g.textBaseline='middle'; g.fillText(a.e||'',18,40); g.fillStyle='#2a1a0a'; g.font='900 25px Arial'; const n=a.n||''; g.fillText(n.length>12?n.slice(0,11)+'…':n,66,40);
    g.fillStyle=col; g.fillRect(18,70,220,30); g.fillStyle=(a.r==='eternal'||a.r==='ultralegendary'||a.r==='mythic')?'#222':'#fff'; g.font='900 20px Arial'; g.textAlign='center'; g.fillText((RN[a.r]||a.r||'').toUpperCase(),128,86);
    const t=new THREE.CanvasTexture(c); t.anisotropy=4; return t; };
  D.make=function(a,i){ const g=new THREE.Group(); if(!a) return g; const k=kindOf(a);
    // Bodenbelag je Lebensraum
    const fl=new THREE.Mesh(new THREE.BoxGeometry(6.6,.06,6.6),mb(FLOOR[k]||0x4f8f3a)); fl.position.y=.23; g.add(fl);
    if(k==='water'){ const p=new THREE.Mesh(new THREE.CylinderGeometry(2.1,2.1,.05,20),mb(0x3fa7e8)); p.position.set(0,.27,0); p.scale.z=.8; g.add(p); const ring=new THREE.Mesh(new THREE.TorusGeometry(2.1,.12,6,24),mb(0xb0a48a)); ring.rotation.x=Math.PI/2; ring.position.set(0,.27,0); ring.scale.y=.8; g.add(ring); rocks(g,-2.4,-2.3,0x9aa0a6); [[2.3,-2.2],[2.6,-1.8]].forEach(q=>cyl(.04,.04,1.1,0x3f7f2f,q[0],.8,q[1],g,4)); trough(g,2.2,2.0,.4); }
    else if(k==='arctic'){ [[-2.2,-2.2,.9],[2.0,2.1,.7]].forEach(q=>{ const m=new THREE.Mesh(new THREE.SphereGeometry(q[2],10,6),mb(0xffffff)); m.position.set(q[0],.2,q[1]); m.scale.y=.45; g.add(m); }); tree(g,2.3,-2.3,1.0,'arctic'); bowl(g,-2.2,2.0,0x9fdcff); trough(g,2.0,1.4,0); rocks(g,-2.3,-1.3,0xcfd8dc); }
    else if(k==='desert'){ cactus(g,-2.3,-2.2); cactus(g,2.4,-2.1); rocks(g,2.2,2.2,0xb08a5a); bowl(g,-2.2,1.8,0x4fc3f7); trough(g,2.0,1.0,.3); }
    else if(k==='savanna'){ tree(g,-2.3,-2.2,1.1,'savanna'); const t=g.children[g.children.length-1]; t.scale.set(1.6,.5,1.6); t.position.y=2.6; rocks(g,2.3,-2.2,0xa89878); bowl(g,-2.2,1.9); trough(g,2.0,1.4,.2); [[2.0,2.2],[1.5,2.4],[2.5,2.4]].forEach(q=>cyl(.03,.03,.7,0xd4b84a,q[0],.55,q[1],g,3)); }
    else if(k==='jungle'){ tree(g,-2.3,-2.2,1.1,'jungle'); tree(g,2.3,-2.3,.9,'jungle'); bowl(g,-2.0,2.0); trough(g,2.1,1.5,.2); [[-2.6,0.5],[2.7,.3]].forEach(q=>{ sph(.35,0xff4f8b,q[0],.5,q[1],g); sph(.25,0xffd54f,q[0]+.3,.4,q[1]+.2,g); }); }
    else if(k==='farm'){ bx(1.8,.9,1.1,0xd9a441,-2.1,.6,-2.1,g); bx(1.8,.2,1.2,0xb87a2a,-2.1,1.15,-2.1,g); bx(1.8,.1,.1,0x8d6e63,-2.1,.35,2.2,g); trough(g,2.1,1.7,0); bowl(g,-2.2,1.8); tree(g,2.4,-2.3,.8,'farm'); }
    else if(k==='fantasy'){ [[-2.3,-2.2],[2.3,-2.2],[-2.3,2.0]].forEach((q,j)=>{ const c=new THREE.Mesh(new THREE.OctahedronGeometry(.45+j*.08,0),mb([0xc77dff,0x7df3ff,0xff7dc9][j])); c.position.set(q[0],.7+j*.1,q[1]); g.add(c); }); bowl(g,2.1,2.0,0xc77dff); tree(g,2.3,-2.3,.9,'fantasy'); }
    else { tree(g,-2.3,-2.2,1.1,'forest'); tree(g,2.4,-2.3,.9,'forest'); rocks(g,2.3,2.1,0x8d9399); bowl(g,-2.1,1.9); trough(g,1.9,1.2,.2); [[-1.2,2.4],[1.0,2.5]].forEach(q=>{ sph(.12,0xff5c7a,q[0],.3,q[1],g); cyl(.02,.02,.3,0x3f7f2f,q[0],.28,q[1],g,3); }); }
    // Schild mit Name + Seltenheit (steht vor dem Gehege)
    const sp=new THREE.Mesh(new THREE.PlaneGeometry(1.9,.95),new THREE.MeshBasicMaterial({map:textTex(a),side:THREE.DoubleSide})); sp.position.set(0,.95,3.55); g.add(sp);
    cyl(.06,.06,.7,0x6b4423,-.8,.35,3.5,g,5); cyl(.06,.06,.7,0x6b4423,.8,.35,3.5,g,5);
    const sb=sp.clone(); sb.position.z=-3.55; g.add(sb);
    return g; };
  D.add=function(g,a,i){ try{ const d=D.make(a,i); g.add(d); g.userData.decor=d; }catch(e){ console.warn('ZEncDecor',e); } };
})();

/* ═══ ZCave (v763): Geheime Höhle mit Rätsel und Schatzkammer ═══ */
(function(){
  if(window.ZCave) return;
  const C=window.ZCave={built:false,CX:-205,CZ:-60,open:0,doorT:0,inside:false};
  const RID=[
    {q:'Ich habe Städte, aber keine Häuser. Ich habe Berge, aber keine Bäume. Ich habe Wasser, aber keine Fische. Was bin ich?',a:['karte','landkarte','weltkarte'],h:'K…'},
    {q:'Je mehr du davon nimmst, desto mehr lässt du zurück. Was ist es?',a:['schritt','schritte','spuren','spur','fussspuren','fussabdruecke','fussabdruck'],h:'S…'},
    {q:'Ich habe Hände, aber kann nicht klatschen. Was bin ich?',a:['uhr','armbanduhr','wanduhr'],h:'U…'},
    {q:'Was gehört dir, wird aber öfter von anderen benutzt als von dir?',a:['name','dein name','namen'],h:'N…'},
    {q:'Was wird nass, während es dich trocknet?',a:['handtuch','tuch','badetuch'],h:'H…'}];
  const norm=s=>String(s||'').toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').replace(/[^a-z ]/g,'').replace(/^(der|die|das|ein|eine|es ist|ein|ne) /,'').trim();
  const rid=()=>{ let h=0; const s=(typeof ZS!=='undefined'&&ZS.player)||'x'; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))|0; return RID[Math.abs(h)%RID.length]; };
  const st=()=>{ const z=ZS.zoo; if(!z) return {}; return z.cave||(z.cave={}); };
  const MC={}; const mb=(c,o)=>{ const k=c+(o?JSON.stringify(o):''); return MC[k]||(MC[k]=new THREE.MeshBasicMaterial(Object.assign({color:c},o||{}))); };
  const bx=(w,h,d,c,x,y,z,g)=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mb(c)); m.position.set(x,y,z); g.add(m); return m; };
  const spr=(txt,col,sx,sy,x,y,z,g)=>{ const s=ZG._txt(txt,.5,col); s.scale.set(sx,sy,1); s.position.set(x,y,z); g.add(s); return s; };
  C.build=function(){ if(C.built||typeof ZG==='undefined'||!ZG.scene) return; C.built=true;
    const G=new THREE.Group(); G.position.set(C.CX,0,C.CZ); ZG.scene.add(G); C.g=G;
    const ROCK=0x6f6a62, MOSS=0x4a6b3a, DK=0x1d1b1a;
    // Boden + Wände (Innenraum 14×14, Türlücke auf +x)
    bx(16.4,.12,16.4,0x3a3733,0,.06,0,G);
    bx(.8,6.4,16.4,ROCK,-7.6,3.2,0,G); bx(16.4,6.4,.8,ROCK,0,3.2,-7.6,G); bx(16.4,6.4,.8,ROCK,0,3.2,7.6,G);
    bx(.8,6.4,5.8,ROCK,7.6,3.2,-5.3,G); bx(.8,6.4,5.8,ROCK,7.6,3.2,5.3,G); bx(.8,2.4,4.8,ROCK,7.6,5.2,0,G);
    bx(16.4,.6,16.4,0x2b2926,0,6.5,0,G);
    // Hügel aussen (Tarnung)
    const dome=new THREE.Mesh(new THREE.SphereGeometry(11.5,18,10,0,6.283,0,1.5708),mb(MOSS)); dome.scale.y=.62; dome.position.y=6.4; G.add(dome);
    [[-3,2],[4,-4],[-6,-5],[6,5],[0,-7]].forEach((q,i)=>{ const r=new THREE.Mesh(new THREE.DodecahedronGeometry(1.4+i*.2,0),mb(ROCK)); r.position.set(q[0],7.2+(i%2)*.6,q[1]); r.scale.y=.7; G.add(r); });
    // Eingang: Steintür + Runenplatte
    const door=bx(.7,5,4.6,0x5b5750,7.7,2.5,0,G); C.door=door; const rune=spr('ᚱ ✦ ᛟ','#7df3ff',3,1.2,8.4,2.6,0,G); C.rune=rune;
    bx(.5,.1,2.2,0x3d3a36,9.2,.1,0,G); [-1,1].forEach(s=>{ const r=new THREE.Mesh(new THREE.DodecahedronGeometry(.9,0),mb(ROCK)); r.position.set(8.6,.6,s*3.4); G.add(r); });
    // Innenleben
    [[-6.4,-6.4],[-6.4,6.4],[6.4,-6.4],[6.4,6.4]].forEach(q=>{ bx(.35,2.2,.35,0x5a3d22,q[0],1.2,q[1],G); const f=new THREE.Mesh(new THREE.SphereGeometry(.35,8,6),mb(0xffa726)); f.position.set(q[0],2.5,q[1]); G.add(f); });
    [[-5,-5,0x7df3ff],[5,-5,0xc77dff],[-5,5,0xff7dc9],[0,-6,0x7dffb0]].forEach(q=>{ const c=new THREE.Mesh(new THREE.OctahedronGeometry(.9,0),mb(q[2])); c.scale.y=1.8; c.position.set(q[0],1.4,q[1]); G.add(c); });
    // Truhe
    const ch=new THREE.Group(); ch.position.set(-4.5,0,0); G.add(ch); bx(2.2,1,1.4,0x8b5a2b,0,.6,0,ch); bx(2.3,.2,1.5,0xffc107,0,1.15,0,ch); bx(.3,.5,.1,0xffe082,1.0,.8,.75,ch); const lid=bx(2.2,.5,1.4,0x8b5a2b,0,1.35,0,ch); C.lid=lid; C.chest=ch;
    const glow=new THREE.Mesh(new THREE.SphereGeometry(1.7,12,8),mb(0xffe082,{transparent:true,opacity:.22,depthWrite:false})); glow.position.set(0,1.1,0); ch.add(glow); C.glow=glow;
    spr('💰 SCHATZKAMMER','#ffd54f',7,1.6,0,4.6,0,G);
    // UI
    const mk=(id,txt,css)=>{ const b=document.createElement('button'); b.id=id; b.textContent=txt; b.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:200px;z-index:130;display:none;padding:12px 24px;border:none;border-radius:30px;font:900 1rem Arial;box-shadow:0 4px 0 rgba(0,0,0,.35),0 8px 16px rgba(0,0,0,.4);'+css; document.body.appendChild(b); return b; };
    mk('zc-riddle','🗝️ Rätsel lösen','background:linear-gradient(135deg,#7df3ff,#3f9fd8);color:#032235').onclick=C.ask;
    mk('zc-chest','🎁 Truhe öffnen','background:linear-gradient(135deg,#ffd54f,#ff9800);color:#2a1700').onclick=C.claim;
    mk('zc-out','🚪 Raus','bottom:150px;background:rgba(231,76,60,.9);color:#fff;padding:8px 18px;font-size:.85rem').onclick=()=>{ ZG.pl.x=C.CX+11.5; ZG.pl.z=C.CZ; ZG.yaw=-Math.PI/2; };
    const hook=()=>{ if(C._h) return; C._h=1; const r=ZG.renderer, o=r.render.bind(r); r.render=function(s,c){ try{ if(s===ZG.scene) C.frame(); }catch(e){} return o(s,c); }; }; hook(); setTimeout(hook,1000);
  };
  C.frame=function(){ const now=performance.now(), dt=Math.min(.1,(now-(C._t||now))/1000); C._t=now; const s=st(), pl=ZG.pl; if(!pl||!C.built) return;
    const t=now/1000; if(C.glow) C.glow.scale.setScalar(1+Math.sin(t*2)*.08); if(C.rune) C.rune.material.opacity=.55+Math.sin(t*2.4)*.45;
    const tgt=s.s?1:0; C.open+=Math.sign(tgt-C.open)*Math.min(Math.abs(tgt-C.open),dt*.35); if(C.door){ C.door.position.y=2.5-C.open*5; C.door.visible=C.open<.99; }
    if(C.lid) C.lid.position.y=1.35+(s.c?.5:0), C.lid.rotation.z=s.c?.5:0;
    const dx=pl.x-C.CX, dz=pl.z-C.CZ, passable=C.open>.9;
    if(pl.y<4){ const inO=Math.abs(dx)<8.6&&Math.abs(dz)<8.6, inI=Math.abs(dx)<7.2&&Math.abs(dz)<7.2, gap=dx>6.6&&Math.abs(dz)<2.2&&passable;
      if(inO&&!inI&&!gap&&C._lp){ pl.x=C._lp.x; pl.z=C._lp.z; } else if(!inO||inI||gap) C._lp={x:pl.x,z:pl.z}; }
    const ins=Math.abs(dx)<7.2&&Math.abs(dz)<7.2; C.inside=ins; const near=Math.hypot(dx-10,dz)<9&&!ins&&pl.y<4;
    const $=id=>document.getElementById(id); const r=$('zc-riddle'),c=$('zc-chest'),o=$('zc-out'); if(!r) return;
    r.style.display=(near&&!s.s&&!document.getElementById('zc-modal'))?'block':'none';
    c.style.display=(ins&&!s.c&&Math.hypot(dx+4.5,dz)<4.5)?'block':'none'; o.style.display=ins?'block':'none';
  };
  C.ask=function(){ if(document.getElementById('zc-modal')) return; const q=rid(); const m=document.createElement('div'); m.id='zc-modal';
    m.style.cssText='position:fixed;inset:0;z-index:600;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;font-family:Arial,sans-serif';
    m.innerHTML='<div style="width:min(92vw,400px);background:#14202e;border:3px solid #7df3ff;border-radius:18px;padding:18px;color:#fff;text-align:center"><div style="font-size:2.2rem">🗿</div><div style="font-weight:900;color:#7df3ff;margin:4px 0">Das Rätsel der Höhle</div><div style="font-size:.9rem;line-height:1.35;margin:8px 0 12px">'+q.q+'</div><input id="zc-in" autocomplete="off" placeholder="Deine Antwort …" style="width:100%;box-sizing:border-box;padding:10px;border-radius:10px;border:2px solid #3f9fd8;background:#0c141e;color:#fff;font-size:1rem;text-align:center"><div id="zc-msg" style="min-height:20px;font-size:.8rem;margin:6px 0;color:#ff8a80"></div><div style="display:flex;gap:8px"><button id="zc-hint" style="flex:1;padding:9px;border:none;border-radius:10px;background:rgba(255,255,255,.14);color:#fff;font-weight:700">💡 Tipp</button><button id="zc-ok" style="flex:2;padding:9px;border:none;border-radius:10px;background:linear-gradient(135deg,#43a047,#2e7d32);color:#fff;font-weight:900">✔ Antworten</button><button id="zc-x" style="flex:1;padding:9px;border:none;border-radius:10px;background:rgba(231,76,60,.5);color:#fff;font-weight:700">✖</button></div></div>';
    document.body.appendChild(m); const inp=document.getElementById('zc-in'), msg=document.getElementById('zc-msg'); setTimeout(()=>inp.focus(),50);
    const ok=()=>{ const a=norm(inp.value); if(q.a.indexOf(a)>=0){ st().s=1; try{ ZS.save&&ZS.save(); }catch(e){} m.remove(); try{ ZP.toast('🗿 Richtig! Die Steintür öffnet sich …',3500); }catch(e){} try{ ZTread&&ZTread.confetti; ZGfx&&ZGfx.confetti&&ZGfx.confetti(80); }catch(e){} } else { msg.textContent='❌ Nicht ganz … versuch es nochmal!'; inp.select(); } };
    document.getElementById('zc-ok').onclick=ok; inp.onkeydown=e=>{ if(e.key==='Enter') ok(); e.stopPropagation(); }; document.getElementById('zc-x').onclick=()=>m.remove(); document.getElementById('zc-hint').onclick=()=>{ msg.style.color='#ffd54f'; msg.textContent='💡 Beginnt mit: '+q.h; };
  };
  C.claim=function(){ const s=st(); if(s.c||!s.s) return; s.c=1; let out=[]; try{ const a=ZTread.tAnimal('legendary'); if(a) out.push('🐾 '+a); ZTread.tBoost('luck',2,15); out.push('🍀 Glück ×2 · 15 Min'); }catch(e){} try{ ZS.save&&ZS.save(); }catch(e){} try{ ZGfx.confetti(160); }catch(e){}
    try{ ZP.toast('🎁 Schatz gefunden! '+out.join(' · '),6000); }catch(e){} };
  const boot=()=>{ try{ if(typeof ZG!=='undefined'&&ZG.scene&&ZG.renderer) C.build(); else setTimeout(boot,800); }catch(e){ setTimeout(boot,1500); } };
  window.addEventListener('load',()=>setTimeout(boot,1500));
})();
