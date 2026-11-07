/* ═══ ZStation (v756): realistische Gondelstation, Seilbahn mit Masten, Gondeln mit Türen, begehbare Halle ═══ */
(function(){
  if(window.ZStation) return;
  const S=window.ZStation={inside:false,cabins:[],built:false,owner:new WeakMap(),pylonX:[24,33]};
  // ── Strecke (geschlossene Schleife): Halle (Wende bei x=-9) → Seil → Gegenstation (Wende bei x=45) → zurück ──
  const R=5, AX=-9, CX=45, SL=54, ARC=Math.PI*R, L=2*SL+2*ARC, SP=L/6, YH=1.3, YO=6.8;
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
    for(let i=0;i<6;i++){ const c=mkCabin(i); S.cabins.push(c); G.add(c.g); }
    // Eingangs-Knopf & Kaufleiste (HTML)
    S._ui();
    // Render-Hook
    const hook=()=>{ try{ if(!Z.renderer||S._hooked) return; S._hooked=1; const r=Z.renderer, o=r.render.bind(r); r.render=function(s,c){ try{ if(s===Z.scene) S.frame(); }catch(e){} return o(s,c); }; }catch(e){} }; hook(); setTimeout(hook,1000);
  };
  // ── Frame ──
  S._t=performance.now();
  const wrapD=d=>{ d%=L; if(d>L/2) d-=L; if(d<-L/2) d+=L; return d; };
  S.frame=function(){ const now=performance.now(), dt=Math.min(.1,(now-S._t)/1000); S._t=now; const Z=ZG; if(!S.built||!Z.gQ) return;
    // Zuordnung Warteschlange → Gondeln
    const q=Z.gQ.slice(0,6), used=new Set(); q.forEach(o=>{ const c=S.owner.get(o); if(c&&c.obj===o) used.add(c); });
    q.forEach((o,j)=>{ let c=S.owner.get(o); if(!c||c.obj!==o){ const free=S.cabins.filter(k=>!used.has(k)); const tu=-j*SP; free.sort((a,b)=>Math.abs(wrapD(tu-a.u))-Math.abs(wrapD(tu-b.u))); c=free[0]||S.cabins[j]; used.add(c); c.obj=o; c.fresh=true; c.key=''; S.owner.set(o,c); } c.slot=j; });
    S.cabins.forEach(c=>{ if(!q.includes(c.obj)){ c.obj=null; c.slot=-1; } });
    S.cabins.forEach(c=>{ const tu=(c.slot>=0?-c.slot*SP:c.u+SP); let d=wrapD(tu-c.u); if(d<-.5) d+=L; if(d>.03){ const v=Math.min(24,Math.max(2.5,d*4)); c.u+=Math.min(d,v*dt); } else c.u=tu;
      const p=S.pathAt(c.u); c.g.position.set(p.x,p.y+2.6,p.z); c.g.rotation.y=Math.atan2(-p.dx,-p.dz);
      const mov=d>.05; c.sway+=dt*(mov?3:1.4); c.g.rotation.z=Math.sin(c.sway)*(p.x>16?.045:.012)*(mov?1.4:1); c.g.rotation.x=Math.sin(c.sway*.7)*.015;
      const open=(c.slot===0&&d<.2)?1:0; c.door+=Math.sign(open-c.door)*Math.min(Math.abs(open-c.door),dt*1.6);
      const o=c.door, ss=1-.6*o; c.dL.scale.z=ss; c.dR.scale.z=ss; c.dL.position.z=-(.55+.46*o); c.dR.position.z=.55+.46*o;
      if(p.x>16.5||p.x<-9&&false) c.fresh=false; if(c.obj&&c.slot>=0&&p.x>16.5) c.fresh=false;
      const ob=c.obj, show=!!ob&&!c.fresh; c.spr.visible=show; c.lab.visible=false;
      if(show){ const key=ob.isCloverOnly?'clover':ob.a.id+(ob.a.e||''); if(c.key!==key){ c.key=key; const e=ob.isCloverOnly?'🍀':ob.a.e; c.spr.material.map=emojiTex(e); c.spr.material.needsUpdate=true; const col=ob.isCloverOnly?0x4caf50:(RC[ob.a.r]||0x95a5a6); c.bar.material.color.setHex(col); c.lab.material.map=ob.isCloverOnly?labTex({e:'🍀',n:'Kleeblatt',r:'normal'},'Glück'):labTex(ob.a,price(ob.a.p)); c.lab.material.needsUpdate=true; }
        c.spr.position.y=.2+Math.sin(c.sway*1.3)*.04; c.lab.visible=S.inside&&p.x<15.6&&c.slot<=1; } });
    if(S.wheel) S.wheel.rotation.y+=dt*.55; if(S.wheel2) S.wheel2.rotation.y+=dt*.55;
    // Kollision + Innen-Erkennung
    try{ const pl=Z.pl; if(pl&&pl.y<4){ const x=pl.x,zz=pl.z, inO=Math.abs(x)<16.6&&Math.abs(zz)<10.8, inI=Math.abs(x)<14.4&&Math.abs(zz)<8.6, gap=zz>8.6&&Math.abs(x)<2.6;
        if(inO&&!inI&&!gap&&S._lp){ pl.x=S._lp.x; pl.z=S._lp.z; } else S._lp={x:pl.x,z:pl.z};
        const ins=Math.abs(pl.x)<14.4&&Math.abs(pl.z)<8.6&&pl.y<4; if(ins!==S.inside){ S.inside=ins; S._uiUpd(true); } } }catch(e){}
    S._uiUpd();
  };
  // ── Rein/Raus ──
  S.enter=function(){ const pl=ZG.pl; pl.x=-3; pl.z=3.5; S._lp={x:pl.x,z:pl.z}; const dx=-14+3, dz=0-3.5; ZG.yaw=Math.atan2(-dx,-dz); ZG.pitch=-.02; };
  S.exit=function(){ const pl=ZG.pl; pl.x=0; pl.z=14.5; S._lp={x:pl.x,z:pl.z}; ZG.yaw=Math.PI; ZG.pitch=0; };
  // ── UI ──
  S._ui=function(){ if(document.getElementById('zs-in')) return;
    const b=document.createElement('button'); b.id='zs-in'; b.textContent='🚪 Drinnen'; b.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:196px;z-index:130;display:none;padding:12px 26px;border:none;border-radius:30px;background:linear-gradient(135deg,#ffd54f,#ff9800);color:#2a1700;font:900 1rem Arial;box-shadow:0 4px 0 #b35c00,0 8px 16px rgba(0,0,0,.4)'; b.onclick=()=>S.enter(); document.body.appendChild(b);
    const r=document.createElement('div'); r.id='zs-bar'; r.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:186px;z-index:130;display:none;width:min(94vw,430px);background:rgba(8,12,26,.92);border:2px solid #ffd54f;border-radius:16px;padding:8px 10px;color:#fff;font-family:Arial,sans-serif'; document.body.appendChild(r); };
  S._uiUpd=function(force){ const now=Date.now(); if(!force&&now-(S._ut||0)<250) return; S._ut=now; const ib=document.getElementById('zs-in'), bar=document.getElementById('zs-bar'); if(!ib||!bar) return; const Z=ZG, pl=Z.pl; const near=Math.hypot(pl.x,pl.z)<24&&!S.inside&&pl.y<4&&!Z.carrying;
    ib.style.display=near&&!(window.ZTread&&(ZTread.on||ZTread.tour))?'block':'none'; const wb=document.getElementById('wbar'); if(wb) wb.style.visibility=S.inside?'hidden':''; if(!S.inside){ bar.style.display='none'; return; }
    const g=Z.gQ&&Z.gQ[0]; if(!g){ bar.style.display='none'; return; } bar.style.display='block'; const z=ZS.zoo, tm=(typeof ZS!=='undefined'&&ZS.dsMT||0);
    if(g.isCloverOnly){ bar.innerHTML='<div style="display:flex;align-items:center;gap:10px"><div style="font-size:2.2rem">🍀</div><div style="flex:1"><div style="font-weight:900;color:'+g.cloverStage.color+'">'+g.cloverStage.name+'-Glück</div><div style="font-size:.74rem;opacity:.75">Kleeblatt-Kette – kein Tier zum Kaufen</div></div>'+S._btns()+'</div>'; return; }
    const a=g.a, can=(tm+z.mt)>=a.p, slot=z.enc.some(e=>!e), col=hex(RC[a.r]||0x95a5a6);
    bar.innerHTML='<div style="display:flex;align-items:center;gap:10px"><div style="font-size:2.4rem;filter:drop-shadow(0 0 8px '+col+')">'+a.e+'</div><div style="flex:1;min-width:0"><div style="font-weight:900;font-size:1rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+a.n+'</div><div style="font-size:.72rem"><span style="background:'+col+';color:#111;font-weight:900;border-radius:8px;padding:1px 8px">'+(RN[a.r]||a.r)+'</span> <span style="color:#ffd54f;font-weight:900;font-size:.9rem">'+price(a.p)+'</span> <span style="opacity:.6" id="zs-tm">'+(document.getElementById('gtimer')?document.getElementById('gtimer').textContent:'')+'</span></div>'+(!can?'<div style="font-size:.68rem;color:#ff8a80">Zu wenig Mischataler</div>':(!slot?'<div style="font-size:.68rem;color:#ff8a80">Kein freies Gehege</div>':''))+'</div>'
      +'<button onclick="ZStation.buy()" style="padding:11px 16px;border:none;border-radius:12px;background:'+(can&&slot?'linear-gradient(135deg,#43a047,#2e7d32)':'#555')+';color:#fff;font:900 .95rem Arial">🛒 Kaufen</button></div>'+'<div style="display:flex;gap:6px;margin-top:6px">'+S._btns(1)+'</div>'; };
  S._btns=function(only){ const m='<button onclick="ZP.open(\'gond\')" style="flex:1;padding:7px;border:none;border-radius:10px;background:rgba(255,255,255,.14);color:#fff;font:700 .72rem Arial">🍀 Glück &amp; mehr</button><button onclick="ZStation.exit()" style="flex:1;padding:7px;border:none;border-radius:10px;background:rgba(231,76,60,.35);color:#fff;font:700 .72rem Arial">🚪 Raus</button>'; return only?m:'<div style="display:flex;flex-direction:column;gap:4px">'+m+'</div>'; };
  S.buy=function(){ try{ const g=ZG.gQ[0]; if(!g||g.isCloverOnly) return; ZP._buyG(g.a.id); setTimeout(()=>{ if(ZG.carrying) S.exit(); },250); }catch(e){} };
  window.addEventListener('load',()=>{ try{ S._ui(); }catch(e){} });
})();
