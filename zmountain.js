/* ═══ ZMountain (v875): lange Seilbahn aus dem Zoo hinaus zu einem 400-m-Berg, Gipfelstation zum Herumlaufen, Rückfahrt ═══
   - Berg liegt AUSSERHALB der Zoo-Karte (Mitte bei x=1060). Seil + Masten vom Gondelhaus (ZStation) bis zur Gipfelstation.
   - Hinfahrt: Knopf "🏔️ Bergfahrt" im Gondelhaus. Oben aussteigen, auf dem Gipfel umherlaufen (Kreis r=45), "🚡 Zurück zum Zoo".
   - Flag ZG._mtnActive hebt die Karten-Begrenzung (zoo.html) und die automatische Boden-Höhe auf. */
(function(){
  if(window.ZMountain) return;
  const M=window.ZMountain={built:false,on:false,riding:false,MX:1060,MZ:0,MH:400,PR:45,CZ:-14,scene:null};
  const MX=M.MX, MZ=M.MZ, MH=M.MH, CZ=M.CZ;
  const X0=40, Y0=17.4, X1=MX-40, Y1=MH+.8; // Kabinenboden: x=40 → x=1020 (Gipfelstation)
  const SLOPE=(Y1-Y0)/(X1-X0);
  const T=()=>window.THREE;
  const ZGg=()=>(typeof ZG!=='undefined'?ZG:null);
  // ── Berg-Profil (Radius → Höhe) ──
  const PROF=[[720,0],[560,30],[420,90],[300,170],[200,250],[130,310],[90,350],[70,375],[55,392],[48,400]];
  const terr=r=>{ if(r>=PROF[0][0]) return 0; if(r<=48) return MH; for(let i=0;i<PROF.length-1;i++){ const a=PROF[i], b=PROF[i+1]; if(r<=a[0]&&r>=b[0]){ const k=(a[0]-r)/(a[0]-b[0]); return a[1]+(b[1]-a[1])*k; } } return 0; };
  const rad=(x,z)=>Math.hypot(x-MX,z-MZ);
  const floorY=x=>Y0+(x-X0)*SLOPE;
  M.terr=terr; M.floorY=floorY;
  const rnd=(()=>{ let s=1234567; return ()=>{ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; })();
  const MB=(c,o)=>new (T().MeshBasicMaterial)(Object.assign({color:c},o||{}));
  const box=(w,h,d,c,x,y,z,p)=>{ const m=new (T().Mesh)(new (T().BoxGeometry)(w,h,d),(c&&c.isMaterial)?c:MB(c)); m.position.set(x,y,z); if(p) p.add(m); return m; };
  const cv=(w,h)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; };
  const signTex=(txt,w,h,bg,fg)=>{ const c=cv(w,h), g=c.getContext('2d'); g.fillStyle=bg; g.fillRect(0,0,w,h); g.strokeStyle='rgba(255,255,255,.85)'; g.lineWidth=6; g.strokeRect(5,5,w-10,h-10); g.fillStyle=fg; g.font='900 '+Math.round(h*.46)+'px Arial'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(txt,w/2,h/2+2); const t=new (T().CanvasTexture)(c); return t; };
  const sign=(txt,w,h,pw,ph,bg,fg,x,y,z,ry,p)=>{ const m=new (T().Mesh)(new (T().PlaneGeometry)(pw,ph),new (T().MeshBasicMaterial)({map:signTex(txt,w,h,bg,fg),side:T().DoubleSide})); m.position.set(x,y,z); m.rotation.y=ry||0; if(p) p.add(m); return m; };

  // ── Bauen ──
  M.build=function(){
    const Z=ZGg(); if(!T()||!Z||!Z.scene||!Z.renderer) return;
    if(M.built&&M.scene===Z.scene) return;
    if(M.built){ try{ console.log('[Berg-debug] neue Szene erkannt → Berg wird neu gebaut'); }catch(e){} M.on=false; M.riding=false; M._cab=null; try{ ZG._mtnActive=false; ZG._mtnView=false; }catch(e){} }
    M.built=true; M.scene=Z.scene; M._tris=0;
    const THREE=T(); const G=new THREE.Group(); G.userData.noCull=true; Z.scene.add(G); M.group=G;
    // Boden außerhalb der Karte (unter dem Zoo-Boden → kein Flackern)
    const gm=new THREE.Mesh(new THREE.CircleGeometry(1200,48),MB(0x4f8a3a)); gm.rotation.x=-Math.PI/2; gm.position.set(MX,-.2,MZ); G.add(gm);
    // Berg (Drehkörper + Unregelmäßigkeit + Farbe nach Höhe)
    const pts=[]; for(let r=720;r>60;r-=18) pts.push(new THREE.Vector2(r,terr(r))); [60,55,48,30,12,0].forEach(r=>pts.push(new THREE.Vector2(r,terr(r))));
    const geo=new THREE.LatheGeometry(pts,96); const pos=geo.attributes.position, n=pos.count, col=new Float32Array(n*3);
    for(let i=0;i<n;i++){ const x=pos.getX(i), y=pos.getY(i), z=pos.getZ(i), r=Math.hypot(x,z), a=Math.atan2(z,x);
      const w=Math.min(1,Math.max(0,(r-62)/160))*Math.min(1,(720-r)/60);
      const nz=Math.sin(a*5+y*.021)+.6*Math.sin(a*11-y*.033)+.35*Math.sin(a*23+y*.05);
      const k=1+.075*nz*w; pos.setX(i,x*k); pos.setZ(i,z*k); pos.setY(i,y+ (y>2&&r>62?nz*5*w:0)); }
    geo.computeVertexNormals(); const nor=geo.attributes.normal; const sun=new THREE.Vector3(.5,.75,.35).normalize(); const c=new THREE.Color();
    for(let i=0;i<n;i++){ const y=pos.getY(i), h=y/MH, nm=new THREE.Vector3(nor.getX(i),nor.getY(i),nor.getZ(i));
      if(h<.06) c.setHex(0x4f8a3a); else if(h<.2) c.setHex(0x5d7f3b).lerp(new THREE.Color(0x7a7a63),(h-.06)/.14); else if(h<.62) c.setHex(0x7a7a63).lerp(new THREE.Color(0x8a8d93),(h-.2)/.42); else if(h<.78) c.setHex(0x8a8d93).lerp(new THREE.Color(0xf1f5f9),(h-.62)/.16); else c.setHex(0xf1f5f9);
      const sh=.62+.5*Math.max(0,nm.dot(sun)); col[i*3]=Math.min(1,c.r*sh); col[i*3+1]=Math.min(1,c.g*sh); col[i*3+2]=Math.min(1,c.b*sh); }
    geo.setAttribute('color',new THREE.BufferAttribute(col,3));
    const mt=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({vertexColors:true})); mt.position.set(MX,0,MZ); mt.userData.noCull=true; G.add(mt); M.mesh=mt;
    // Tannen am Fuß (instanziert)
    const nt=260, tm=new THREE.InstancedMesh(new THREE.ConeGeometry(3.2,11,6),MB(0x2f6b2f),nt), d=new THREE.Object3D(); let ti=0;
    for(let k=0;k<nt*2&&ti<nt;k++){ const a=rnd()*6.283, r=340+rnd()*380; if(terr(r)>110) continue; const x=MX+Math.cos(a)*r, z=MZ+Math.sin(a)*r;
      if(Math.abs(z-CZ)<12&&x<X1) continue; d.position.set(x,terr(r)+5.2,z); d.scale.setScalar(.7+rnd()*.9); d.updateMatrix(); tm.setMatrixAt(ti++,d.matrix); }
    tm.count=ti; tm.instanceMatrix.needsUpdate=true; tm.userData.noCull=true; G.add(tm);
    // ── Gipfel ──
    const plate=new THREE.Mesh(new THREE.CircleGeometry(47.5,48),MB(0xd6dde3)); plate.rotation.x=-Math.PI/2; plate.position.set(MX,MH+.08,MZ); G.add(plate);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(46,.14,6,72),MB(0xb71c1c)); ring.rotation.x=Math.PI/2; ring.position.set(MX,MH+1.3,MZ); G.add(ring);
    const post=new THREE.InstancedMesh(new THREE.CylinderGeometry(.16,.16,1.5,6),MB(0x6b6f76),48), pd=new THREE.Object3D(); for(let k=0;k<48;k++){ const a=k/48*6.283; pd.position.set(MX+Math.cos(a)*46,MH+.8,MZ+Math.sin(a)*46); pd.updateMatrix(); post.setMatrixAt(k,pd.matrix); } G.add(post);
    // Gipfelstation (offen an West-/Ostseite: Kabine fährt hinein)
    const SX=MX-34, SZ=CZ, RED=0xd32f2f, CON=0xc9ccd1;
    box(20,.3,12,0x9a9ea4,SX,MH+.15,SZ,G);
    [[-9.5,-5.6],[-9.5,5.6],[9.5,-5.6],[9.5,5.6]].forEach(q=>box(.7,9,.7,RED,SX+q[0],MH+4.5,SZ+q[1],G));
    box(21,.6,13,0x3a4a6a,SX,MH+9.3,SZ,G); box(20,.4,12,CON,SX,MH+9.9,SZ,G);
    [-5.9,5.9].forEach(z=>{ box(20,.8,.4,CON,SX,MH+1,SZ+z,G); box(20,5.5,.14,MB(0x7fb8d8,{transparent:true,opacity:.3,depthWrite:false}),SX,MH+4.2,SZ+z,G); });
    sign('GIPFELSTATION',512,120,9,2.1,'#0d47a1','#ffffff',SX,MH+11.5,SZ+6.2,0,G); sign('GIPFELSTATION',512,120,9,2.1,'#0d47a1','#ffffff',SX,MH+11.5,SZ-6.2,Math.PI,G);
    const wh=new THREE.Group(); wh.position.set(SX+8.5,Y1+2.6,SZ); G.add(wh); const tor=new THREE.Mesh(new THREE.TorusGeometry(4.7,.26,6,32),MB(RED)); tor.rotation.x=Math.PI/2; wh.add(tor); M.wheel=wh;
    // Schilder & Fahne
    sign('🏔️ 400 m ü. M.',512,128,10,2.5,'#1b5e20','#ffffff',MX-8,MH+4.5,MZ+8,-Math.PI/5,G);
    sign('ZURÜCK: 🚡 Knopf unten',512,128,9,2.2,'#b71c1c','#fff3c4',MX-18,MH+3.2,MZ-20,Math.PI/4,G);
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,16,6),MB(0xdddddd)); pole.position.set(MX+10,MH+8,MZ); G.add(pole);
    const fl=sign('MISCHA ZOO · 400 m',512,256,7,3.5,'#c62828','#fff3c4',MX+13.6,MH+13.5,MZ,0,G); M.flag=fl;
    [[18,10],[22,-14],[-4,30],[30,20],[-20,-25],[12,34]].forEach((q,i)=>{ const r=new THREE.Mesh(new THREE.DodecahedronGeometry(2+i%3,0),MB(i%2?0x8a8d93:0x9aa0a6)); r.position.set(MX+q[0],MH+1.2+(i%2),MZ+q[1]); r.scale.y=.7; G.add(r); });
    // ── Seil + Masten ──
    const poly=M.polyline(); M.poly=poly;
    const cabPts=[]; for(let i=0;i<poly.pts.length;i++){ const p=poly.pts[i]; if(p.x<27) continue; if(i%2===0||i===poly.pts.length-1) cabPts.push(new THREE.Vector3(p.x,p.y+2.6,p.z)); }
    const cur=new THREE.CatmullRomCurve3(cabPts,false); const cab=new THREE.Mesh(new THREE.TubeGeometry(cur,Math.min(900,cabPts.length*3),.16,5,false),MB(0x2a2d31)); cab.userData.noCull=true; G.add(cab);
    const RMX=[110,200,295,395,500,610,720,820,905,965];
    RMX.forEach(px=>{ const z=CZ, top=floorY(px)+2.6, base=terr(rad(px,z)), H=top-base+1.4, bs=Math.max(2.6,H*.07), tp=.7; const P=new THREE.Group(); P.position.set(px,base,z); P.userData.noCull=true; G.add(P);
      [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(q=>{ const a=new THREE.Vector3(q[0]*bs,0,q[1]*bs), b=new THREE.Vector3(q[0]*tp,H,q[1]*tp), dv=new THREE.Vector3().subVectors(b,a), len=dv.length(); const m=new THREE.Mesh(new THREE.BoxGeometry(.5,.5,len),MB(0x8e9399)); m.position.copy(a).addScaledVector(dv,.5); P.add(m); P.updateMatrixWorld(true); m.lookAt(P.localToWorld(b.clone())); });
      for(let lv=1;lv<=4;lv++){ const y=lv*H/5, w=bs-(bs-tp)*lv/5; box(w*2,.35,.35,0x8e9399,0,y,w,P); box(w*2,.35,.35,0x8e9399,0,y,-w,P); box(.35,.35,w*2,0x8e9399,w,y,0,P); box(.35,.35,w*2,0x8e9399,-w,y,0,P); }
      box(2.2,.7,5.6,0x6e737a,0,H+.2,0,P); box(1.1,.9,1.1,RED,0,H+.9,0,P); });
    // Wegweiser im Gondelhaus-Bereich (Außenseite)
    M._ui();
  };
  // ── Fahrstrecke (Kabinenboden-Koordinaten), vom Gondelhaus bis zur Gipfelstation ──
  M.polyline=function(){
    const S=window.ZStation, pts=[]; const add=(x,y,z)=>{ const l=pts.length?pts[pts.length-1]:null; pts.push({x,y,z,s:l?l.s+Math.hypot(x-l.x,y-l.y,z-l.z):0}); };
    if(S&&S.pathAt){ const L=S.L, ARC=Math.PI*5; for(let u=L-5.5;u<L;u+=1){ const p=S.pathAt(u); add(p.x,p.y,p.z); } for(let u=0;u<=ARC/2+37;u+=1){ const p=S.pathAt(u); add(p.x,p.y,p.z); } }
    else add(-9,3.9,-5);
    const last=pts[pts.length-1], x0=last.x, z0=last.z, y0=last.y;
    for(let k=1;k<=10;k++){ const t=k/10, sm=t*t*(3-2*t); add(x0+(X0-x0)*t, y0+(Y0-y0)*t, z0+(CZ-z0)*sm); }
    for(let x=X0+8;x<X1;x+=8) add(x,floorY(x),CZ); add(X1,Y1,CZ);
    return {pts,len:pts[pts.length-1].s};
  };
  // ── UI ──
  M._ui=function(){ if(document.getElementById('zm-go')) return;
    const mk=(id,t,css)=>{ const b=document.createElement('button'); b.id=id; b.textContent=t; b.style.cssText='position:fixed;left:50%;transform:translateX(-50%);z-index:131;display:none;padding:10px 22px;border:none;border-radius:28px;font:900 .95rem Arial;box-shadow:0 4px 14px rgba(0,0,0,.45);'+css; document.body.appendChild(b); return b; };
    mk('zm-go','🏔️ Bergfahrt zum Gipfel (400 m)','bottom:360px;background:linear-gradient(135deg,#a5d6a7,#388e3c);color:#06210a').onclick=()=>M.rideStart(1);
    mk('zm-back','🚡 Zurück zum Zoo','bottom:300px;background:linear-gradient(135deg,#ffcc80,#ef6c00);color:#2a1300').onclick=()=>M.rideStart(-1);
    const ch=document.createElement('div'); ch.id='zm-chip'; ch.style.cssText='position:fixed;left:50%;top:150px;transform:translateX(-50%);z-index:131;display:none;background:rgba(8,12,26,.88);border:2px solid #a5d6a7;color:#fff;border-radius:16px;padding:8px 16px;font:900 .9rem Arial;text-align:center'; document.body.appendChild(ch);
  };
  M._uiUpd=function(){ const S=window.ZStation; const go=document.getElementById('zm-go'), bk=document.getElementById('zm-back'); if(!go||!bk) return; 
    go.style.display=(S&&S.inside&&!S.riding&&!M.riding&&!M.on)?'block':'none';
    bk.style.display=(M.on&&!M.riding)?'block':'none'; };
  // ── Fahrt ──
  const speedAt=(s,len)=>{ const a=7, vmax=34, v=Math.sqrt(2*a*Math.max(0,Math.min(s,len-s)))+6; return Math.min(vmax,v); };
  M.rideStart=function(dir){
    const Z=ZGg(), S=window.ZStation; if(M.riding||!M.built||!Z) return;
    try{ if(dir>0&&Z.carrying){ ZP.toast('🐾 Erst das Tier ins Gehege tragen!',2000); return; } }catch(e){}
    if(dir>0&&S&&S.riding) return;
    const THREE=T(); const cab=(S&&S._mkCabin)?S._mkCabin(98):null; if(cab){ cab.spr.visible=false; cab.lab.visible=false; (S.group||M.group).add(cab.g); }
    M._cab=cab; M.dir=dir; M.s=dir>0?0:M.poly.len; M.riding=true; M.on=true; Z._mtnActive=true; M._view(true);
    if(S){ S.inside=false; S._lp=null; }
    const wb=document.getElementById('wbar'); if(wb) wb.style.visibility='hidden';
    M._chipShow(); try{ ZP.toast(dir>0?'🏔️ Bergfahrt! Schau dich um – es geht 400 m hoch.':'🚡 Talfahrt zurück zum Zoo …',3500); }catch(e){}
    M._cinStart('in'); M._uiUpd(); };
  M._view=function(on){ const Z=ZGg(); try{ Z._mtnView=on; if(window.ZLook) ZLook.cullOff=on; }catch(e){}
    try{ const far=on?7000:500; if(Z.cam&&Z.cam.far!==far){ Z.cam.far=far; Z.cam.updateProjectionMatrix(); } }catch(e){} };
  M._chipShow=function(){ const ch=document.getElementById('zm-chip'); if(ch) ch.style.display='block'; };
  M._chipUpd=function(y){ const ch=document.getElementById('zm-chip'); if(!ch) return; ch.innerHTML=(M.riding?(M.dir>0?'🚡 Bergfahrt':'🚡 Talfahrt'):'🏔️ Gipfel')+' · Höhe <b>'+Math.max(0,Math.round(y))+' m</b> / 400 m'; };
  M._pt=function(s){ const P=M.poly.pts; let lo=0, hi=P.length-1; while(hi-lo>1){ const m=(lo+hi)>>1; if(P[m].s<=s) lo=m; else hi=m; } const a=P[lo], b=P[hi], k=b.s>a.s?Math.min(1,Math.max(0,(s-a.s)/(b.s-a.s))):0; const dx=b.x-a.x, dy=b.y-a.y, dz=b.z-a.z, dl=Math.hypot(dx,dz)||1; return {x:a.x+dx*k,y:a.y+dy*k,z:a.z+dz*k,dx:dx/dl,dz:dz/dl}; };
  M._frame=function(){
    const Z=ZGg(); if(!Z||!M.built||!Z.pl) return; const now=performance.now(), dt=Math.min(.1,(now-(M._t||now))/1000); M._t=now; const pl=Z.pl;
    if(M.wheel) M.wheel.rotation.y+=dt*.55;
    if(M.riding&&M.poly&&M.cin){ M._cinFrame(dt); }
    else if(M.riding&&M.poly){
      const len=M.poly.len, along=M.dir>0?M.s:len-M.s; M.s+=M.dir*speedAt(along,len)*dt; if(M.s<0) M.s=0; if(M.s>len) M.s=len;
      const p=M._pt(M.s), sgn=M.dir>0?1:-1, t=now/1000;
      if(M._cab){ const c=M._cab; c.g.position.set(p.x,p.y+2.6,p.z); c.g.rotation.y=Math.atan2(-p.dx*sgn,-p.dz*sgn); c.g.rotation.z=Math.sin(t*1.4)*.02; c.g.rotation.x=Math.sin(t*1.1)*.012; }
      pl.x=p.x; pl.z=p.z; pl.y=p.y+1.3; try{ Z.cam.position.set(p.x+p.dx*sgn*.8,p.y+1.35,p.z+p.dz*sgn*.8); }catch(e){}
      M._chipUpd(p.y);
      if((M.dir>0&&M.s>=len-.1)||(M.dir<0&&M.s<=.1)) M._cinStart('out');
    } else if(M.on){
      // Gipfel: Kreis begrenzen, Höhe fest, Kamera-Höhe mitführen
      const dx=pl.x-MX, dz=pl.z-MZ, d=Math.hypot(dx,dz); if(d>M.PR){ pl.x=MX+dx/d*M.PR; pl.z=MZ+dz/d*M.PR; }
      pl.y=MH+1.7; try{ Z.cam.position.y=MH+1.7; }catch(e){} M._chipUpd(pl.y);
    }
    M._view(M.on||M.riding);
    M._uiUpd();
  };
  M.rideEnd=function(){ M._cinUI(false); M.cin=null; try{ if(window.ZStation) ZStation.hideQ=false; }catch(e){} const Z=ZGg(), S=window.ZStation, pl=Z.pl; try{ if(M._cab&&M._cab.g.parent) M._cab.g.parent.remove(M._cab.g); }catch(e){} M._cab=null; M.riding=false;
    if(M.dir>0){ pl.x=MX-28; pl.z=MZ-8; pl.y=MH+1.7; Z.yaw=-Math.PI/2; Z.pitch=-.05; M.on=true; Z._mtnActive=true; try{ ZP.toast('🏔️ Oben! 400 m Höhe. Schau dich um – zurück mit dem 🚡-Knopf.',4500); }catch(e){}
      try{ const z=ZS.zoo; if(z&&!z.mtnSeen){ z.mtnSeen=1; z.mt+=250; ZG._updHUD&&ZG._updHUD(); ZP.toast('🎉 Erster Gipfelbesuch: +250 MT',3500); ZS.save&&ZS.save(); } }catch(e){} }
    else { M.on=false; Z._mtnActive=false; M._view(false); pl.x=-3; pl.z=3.5; pl.y=1.7; Z.yaw=Math.atan2(11,-3.5); Z.pitch=-.02; if(S){ S._lp={x:pl.x,z:pl.z}; S.inside=true; } const ch=document.getElementById('zm-chip'); if(ch) ch.style.display='none'; try{ ZP.toast('🛬 Zurück im Zoo!',2000); }catch(e){} }
    M._uiUpd(); try{ ZS.save&&ZS.save(); }catch(e){} };

  // ═══ Einsteigen / Aussteigen als 3D-Kamerafahrt (v893) ═══
  const ease=t=>t<=0?0:t>=1?1:t*t*(3-2*t);
  const setDoor=(cab,o)=>{ if(!cab) return; const ss=1-.6*o; cab.dL.scale.z=ss; cab.dR.scale.z=ss; cab.dL.position.z=-(.55+.46*o); cab.dR.position.z=.55+.46*o; };
  M._cinUI=function(on){ let top=document.getElementById('zm-lbt'); if(!top){ top=document.createElement('div'); top.id='zm-lbt'; top.style.cssText='position:fixed;left:0;right:0;top:0;height:0;background:#000;z-index:130;pointer-events:none;transition:height .5s'; document.body.appendChild(top);
      const bt=document.createElement('div'); bt.id='zm-lbb'; bt.style.cssText='position:fixed;left:0;right:0;bottom:0;height:0;background:#000;z-index:130;pointer-events:none;transition:height .5s'; document.body.appendChild(bt);
      const fd=document.createElement('div'); fd.id='zm-fade'; fd.style.cssText='position:fixed;inset:0;background:#000;z-index:132;pointer-events:none;opacity:0;transition:opacity .3s'; document.body.appendChild(fd);
      const sk=document.createElement('button'); sk.id='zm-skip'; sk.textContent='⏭ Überspringen'; sk.style.cssText='position:fixed;right:10px;bottom:12px;z-index:133;display:none;padding:8px 14px;border:2px solid rgba(255,255,255,.7);border-radius:14px;background:rgba(0,0,0,.5);color:#fff;font:800 .8rem Arial'; sk.onclick=()=>M._cinSkip(); document.body.appendChild(sk); }
    if(!document.getElementById('zm-css')){ const st=document.createElement('style'); st.id='zm-css'; st.textContent='body.zmcin #s-zoo>*:not(#zc){visibility:hidden!important}body.zmcin>*:not(#s-zoo):not([id^="zm-"]):not(#zt):not(script):not(style):not(link){visibility:hidden!important}'; document.head.appendChild(st); }
    document.body.classList.toggle('zmcin',!!on); try{ if(window.ZStation) ZStation.hideQ=!!(on||M.riding); }catch(e){}
    const h=on?'11vh':'0'; document.getElementById('zm-lbt').style.height=h; document.getElementById('zm-lbb').style.height=h; document.getElementById('zm-skip').style.display=on?'block':'none';
    const ch=document.getElementById('zm-chip'); if(on&&ch) ch.style.display='none'; };
  M._fade=function(v,ms){ M._cinUI(M.cin?true:false); const f=document.getElementById('zm-fade'); if(!f) return; f.style.transition='opacity '+(ms==null?300:ms)+'ms'; f.style.opacity=v?'1':'0'; };
  M._cinStart=function(ph){ const cab=M._cab; if(!cab||!M.poly){ if(ph==='out') M.rideEnd(); return; }
    const p=M._pt(M.s), sgn=M.dir>0?1:-1, ry=Math.atan2(-p.dx*sgn,-p.dz*sgn);
    cab.g.position.set(p.x,p.y+2.6,p.z); cab.g.rotation.set(0,ry,0);
    M.cin={ph:ph,t:0,p:p,sgn:sgn,n:{x:Math.cos(ry),z:-Math.sin(ry)},f:{x:p.dx*sgn,z:p.dz*sgn},fired:false}; setDoor(cab,ph==='out'?0:0);
    M._cinUI(true); if(ph==='in'){ M._fade(1,0); setTimeout(()=>M._fade(0,500),60); } };
  M._cinFinish=function(){ const Z=ZGg(), c=M.cin; if(!c) return; setDoor(M._cab,0); M.cin=null; M._cinUI(false); M._fade(0,200); const chp=document.getElementById('zm-chip'); if(chp) chp.style.display='block'; try{ Z.yaw=Math.atan2(-c.f.x,-c.f.z); Z.pitch=0; }catch(e){} };
  M._cinSkip=function(){ const c=M.cin; if(!c) return; if(c.ph==='in') M._cinFinish(); else if(!c.fired){ c.fired=true; M._cinEndOut(); } };
  M._cinEndOut=function(){ M._fade(1,300); setTimeout(()=>{ try{ M.rideEnd(); }catch(e){} M._fade(0,500); },340); };
  M._cinFrame=function(dt){ const Z=ZGg(), c=M.cin, THREE=T(); if(!c||!Z||!Z.cam) return; c.t+=dt; const t=c.t, p=c.p, n=c.n, f=c.f, cab=M._cab, pl=Z.pl;
    const seat={x:p.x+f.x*.8,y:p.y+1.35,z:p.z+f.z*.8}; const C={x:p.x,y:p.y,z:p.z};
    const outP=(d)=>({x:C.x+n.x*d,y:p.y+1.55,z:C.z+n.z*d}); let cam, look;
    pl.x=p.x; pl.z=p.z; pl.y=p.y+1.3; if(cab) cab.g.rotation.z=Math.sin(performance.now()/1000*1.3)*.012;
    if(c.ph==='in'){
      const dolly=ease(t/2.4); const a=outP(6.2-1.8*dolly); a.x-=f.x*1.2; a.z-=f.z*1.2; const lk0={x:C.x+n.x*.6,y:p.y+.7,z:C.z+n.z*.6};
      const dO=Math.min(1,Math.max(0,(t-.6)/1.4)), dC=Math.min(1,Math.max(0,(t-4.6)/1.0)); setDoor(cab,t<4.6?dO:1-dC);
      const u=ease((t-2.8)/1.8); const a2=outP(4.4); a2.x-=f.x*1.2; a2.z-=f.z*1.2;
      if(t<2.8){ cam=a; look=lk0; } else { const bob=Math.sin(t*10)*.035*(u<1?1:0); cam={x:a2.x+(seat.x-a2.x)*u,y:a2.y+(seat.y-a2.y)*u+bob,z:a2.z+(seat.z-a2.z)*u}; const lk1={x:seat.x+f.x*12,y:seat.y,z:seat.z+f.z*12}; look={x:lk0.x+(lk1.x-lk0.x)*u,y:lk0.y+(lk1.y-lk0.y)*u,z:lk0.z+(lk1.z-lk0.z)*u}; }
      if(t>=5.7){ M._cinFinish(); return; }
    } else {
      const dO=Math.min(1,t/1.2); setDoor(cab,dO);
      const u=ease((t-1.3)/1.9); const e=outP(4.2); e.x+=f.x*.5; e.z+=f.z*.5; const bob=Math.sin(t*10)*.035*(u>0&&u<1?1:0);
      cam={x:seat.x+(e.x-seat.x)*u,y:seat.y+(e.y-seat.y)*u+bob,z:seat.z+(e.z-seat.z)*u};
      const lk0={x:seat.x+f.x*12,y:seat.y,z:seat.z+f.z*12}, k=ease(t/1.1), lk1={x:C.x+n.x*12,y:p.y+1.2,z:C.z+n.z*12}; look={x:lk0.x+(lk1.x-lk0.x)*k,y:lk0.y+(lk1.y-lk0.y)*k,z:lk0.z+(lk1.z-lk0.z)*k};
      if(t>=3.4&&!c.fired){ c.fired=true; M._cinEndOut(); }
    }
    try{ Z.cam.position.set(cam.x,cam.y,cam.z); Z.cam.lookAt(look.x,look.y,look.z); }catch(e){} M._chipUpd(p.y); };
  // Notausgang (z. B. bei Fehlern): zurück ins Gondelhaus
  M.abort=function(){ const Z=ZGg(); if(!Z) return; M.dir=-1; M.riding=false; M.cin=null; try{ if(M._cab&&M._cab.g.parent) M._cab.g.parent.remove(M._cab.g); }catch(e){} M._cab=null; M.rideEnd(); };
  // ── Einhängen ──
  const hook=()=>{ try{ const r=ZGg()&&ZG.renderer; if(!r||r._zmHook) return; r._zmHook=1; const o=r.render.bind(r); r.render=function(s,c){ try{ if(s===ZG.scene) M._frame(); }catch(e){ try{ console.log('[Berg-debug] Frame-Fehler: '+e.message); }catch(_){} } return o(s,c); }; }catch(e){} };
  const boot=()=>{ try{ if(typeof ZG!=='undefined'&&ZG.scene&&ZG.renderer){ M.build(); hook(); } }catch(e){ try{ console.log('[Berg-debug] Bau-Fehler: '+e.message); }catch(_){} } };
  window.addEventListener('load',()=>{ setTimeout(boot,2500); setInterval(boot,2000); });
})();
