/* ZWorld — Welt-Bauer (nur Admin): Objekte im ganzen Zoo platzieren, für alle sichtbar (RTDB zoo_world/objs). (v705)
   ~80 Elemente aus dem Base-Katalog + 35 neue, lebendige (animierte) 3D-Elemente. */
(function(){
  'use strict';
  const MAXW=500;
  const RT=()=>{ try{ return (typeof _rtdb!=='undefined'&&_rtdb&&State._useCloud())?_rtdb:null; }catch(e){ return null; } };
  const toast=(m,ms)=>{ try{ ZP.toast(m,ms||2500); }catch(e){} };
  const ZB=()=>window.ZBases;
  const isAdm=()=>{ try{ return !!(ZB()&&ZB().isEd&&ZB().isEd()); }catch(e){ return false; } };

  /* ═══════════ Lebendige Elemente ═══════════ */
  const LIVE={}; const LCAT=[];
  const TAU=Math.PI*2;
  const emo=(e,sz)=>{ const sp=ZB().sprite(e,1); sp.scale.set(sz,sz,1); sp.position.y=0; return sp; };
  const mk=(geo,col,o)=>new THREE.Mesh(geo,new THREE.MeshLambertMaterial(Object.assign({color:col},o||{})));
  const bs=(geo,col,o)=>new THREE.Mesh(geo,new THREE.MeshBasicMaterial(Object.assign({color:col},o||{})));
  let _glow=null; const glowTex=()=>{ if(_glow) return _glow; const c=document.createElement('canvas'); c.width=c.height=64; const x=c.getContext('2d'); const g=x.createRadialGradient(32,32,2,32,32,30); g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(.4,'rgba(255,255,255,.45)'); g.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=g; x.fillRect(0,0,64,64); return _glow=new THREE.CanvasTexture(c); };
  const glow=(col,sz,op)=>{ const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(),color:col,transparent:true,opacity:op==null?.9:op,depthWrite:false,blending:THREE.AdditiveBlending})); sp.scale.set(sz,sz,1); return sp; };
  const pts=(n,col,size,opts)=>{ const geo=new THREE.BufferGeometry(); const pos=new Float32Array(n*3); geo.setAttribute('position',new THREE.BufferAttribute(pos,3)); const o=Object.assign({color:col,size:size,transparent:true,depthWrite:false,sizeAttenuation:true},opts||{}); const m=new THREE.Points(geo,new THREE.PointsMaterial(o)); m.frustumCulled=false; m.userData.pos=pos; return m; };
  const flush=p=>{ p.geometry.attributes.position.needsUpdate=true; };
  const rnd=(a,b)=>a+Math.random()*(b-a);
  const pond=(r,col)=>{ const m=mk(new THREE.CylinderGeometry(r,r,.14,20),col||0x3aa0ff); m.position.y=.08; return m; };
  const add=(id,n,ic,grp,fn)=>{ LIVE[id]={id,n,ic,build:fn}; let g=LCAT.find(x=>x.g===grp); if(!g){ g={g:grp,items:[]}; LCAT.push(g); } g.items.push({t:id,n,ic,k:'L'}); };
  const GRP_A='🦋 Lebendig: Tiere', GRP_B='✨ Lebendig: Effekte', GRP_C='🎡 Lebendig: Bauten';

  // ── Tiere ──
  add('w_butterflies','Schmetterlinge','🦋',GRP_A,()=>{ const g=new THREE.Group(), a=[]; for(let i=0;i<6;i++){ const s=emo('🦋',.9); g.add(s); a.push(s); }
    g.userData.upd=t=>{ a.forEach((s,i)=>{ s.position.set(Math.cos(t*.6+i*1.1)*3.5+Math.sin(t*1.3+i)*.8,1.3+Math.sin(t*2+i*2)*.6+i*.15,Math.sin(t*.5+i*1.7)*3.5); s.scale.x=.9*(.55+.45*Math.abs(Math.sin(t*9+i))); }); }; return g; });
  add('w_birds','Vogelschwarm','🐦',GRP_A,()=>{ const g=new THREE.Group(), a=[]; for(let i=0;i<5;i++){ const s=emo('🐦',1.4); g.add(s); a.push(s); }
    g.userData.upd=t=>{ a.forEach((s,i)=>{ const r=7+i*.8, an=t*(.5-i*.03)+i*1.3; s.position.set(Math.cos(an)*r,9+Math.sin(t*1.5+i)*.7,Math.sin(an)*r); }); }; return g; });
  add('w_bunny','Hüpfender Hase','🐇',GRP_A,()=>{ const g=new THREE.Group(), s=emo('🐇',1.5); g.add(s); g.userData.upd=t=>{ const a=t*.5; s.position.set(Math.cos(a)*4,.8+Math.abs(Math.sin(t*5))*.9,Math.sin(a)*4); s.scale.x=-1.5; }; return g; });
  add('w_ducks','Enten-Teich','🦆',GRP_A,()=>{ const g=new THREE.Group(); g.add(pond(4)); const a=[]; for(let i=0;i<3;i++){ const s=emo('🦆',1.1); g.add(s); a.push(s); }
    g.userData.upd=t=>{ a.forEach((s,i)=>{ const an=t*.35+i*2.1; s.position.set(Math.cos(an)*2.4,.6+Math.sin(t*3+i)*.06,Math.sin(an)*2.4); }); }; return g; });
  add('w_fishpond','Fisch-Teich','🐟',GRP_A,()=>{ const g=new THREE.Group(); g.add(pond(3.2,0x2a8fd6)); const a=[]; for(let i=0;i<3;i++){ const s=emo('🐟',.9); g.add(s); a.push(s); }
    g.userData.upd=t=>{ a.forEach((s,i)=>{ const an=t*.6+i*2.1, r=1.4+i*.5; const j=Math.pow(Math.max(0,Math.sin(t*1.1+i*2.4)),6); s.position.set(Math.cos(an)*r,.3+j*2,Math.sin(an)*r); }); }; return g; });
  add('w_cat','Spazier-Katze','🐈',GRP_A,()=>{ const g=new THREE.Group(), s=emo('🐈',1.5); g.add(s); g.userData.upd=t=>{ const p=(t*.12)%2, x=(p<1?p:2-p)*12-6, d=(p<1?1:-1); s.position.set(x,.75+Math.abs(Math.sin(t*6))*.12,0); s.scale.x=-1.5*d; }; return g; });
  add('w_dog','Rennender Hund','🐕',GRP_A,()=>{ const g=new THREE.Group(), s=emo('🐕',1.5); g.add(s); g.userData.upd=t=>{ const a=t*.9; s.position.set(Math.cos(a)*5,.8+Math.abs(Math.sin(t*8))*.25,Math.sin(a)*5); s.scale.x=1.5; }; return g; });
  add('w_chickens','Hühner-Gruppe','🐔',GRP_A,()=>{ const g=new THREE.Group(), a=[]; for(let i=0;i<3;i++){ const s=emo('🐔',1.1); g.add(s); a.push(s); }
    g.userData.upd=t=>{ a.forEach((s,i)=>{ s.position.set(Math.cos(i*2.1+t*.15)*1.6,.55+Math.max(0,Math.sin(t*4+i*2))*.25,Math.sin(i*2.1+t*.15)*1.6); }); }; return g; });
  add('w_bees','Bienen & Blumen','🐝',GRP_A,()=>{ const g=new THREE.Group(); [[-.8,0],[.8,.3],[0,-.8]].forEach(([x,z],i)=>{ const f=emo(['🌻','🌼','🌷'][i],1.3); f.position.set(x,.7,z); g.add(f); }); const a=[]; for(let i=0;i<4;i++){ const s=emo('🐝',.55); g.add(s); a.push(s); }
    g.userData.upd=t=>{ a.forEach((s,i)=>{ const an=t*3+i*1.6; s.position.set(Math.cos(an)*1.4,1.4+Math.sin(t*5+i)*.35,Math.sin(an)*1.4); }); }; return g; });
  add('w_trampoline','Trampolin-Hase','🐰',GRP_A,()=>{ const g=new THREE.Group(); const d=mk(new THREE.CylinderGeometry(2,2,.2,16),0x2c3e50); d.position.y=.6; g.add(d); const m=mk(new THREE.CylinderGeometry(1.8,1.8,.08,16),0xe74c3c); m.position.y=.72; g.add(m); [[1.7,0],[-1.7,0],[0,1.7],[0,-1.7]].forEach(([x,z])=>{ const l=mk(new THREE.CylinderGeometry(.1,.1,.6,5),0x555555); l.position.set(x,.3,z); g.add(l); });
    const s=emo('🐰',1.4); g.add(s); g.userData.upd=t=>{ s.position.set(0,1.5+Math.abs(Math.sin(t*3))*3.2,0); m.scale.set(1,1,1); }; return g; });
  add('w_seesaw','Wippe mit Kindern','🧒',GRP_A,()=>{ const g=new THREE.Group(); const b=mk(new THREE.CylinderGeometry(.1,.7,1,3),0x7a5230); b.position.y=.5; b.rotation.y=Math.PI/2; g.add(b); const pl=new THREE.Group(); pl.position.y=1.05; g.add(pl); const p=mk(new THREE.BoxGeometry(6,.18,.7),0xc8a165); pl.add(p); const k1=emo('🧒',1.3), k2=emo('👧',1.3); k1.position.set(-2.4,.9,0); k2.position.set(2.4,.9,0); pl.add(k1); pl.add(k2);
    g.userData.upd=t=>{ pl.rotation.z=Math.sin(t*1.6)*.28; }; return g; });
  add('w_cloudwalk','Wolken am Himmel','☁️',GRP_A,()=>{ const g=new THREE.Group(), cl=[]; for(let i=0;i<3;i++){ const c=new THREE.Group(); [[0,0,0,2],[1.8,-.2,0,1.5],[-1.7,-.3,.2,1.4],[.4,.6,.3,1.3]].forEach(([x,y,z,r])=>{ const m=bs(new THREE.SphereGeometry(r,8,6),0xffffff,{transparent:true,opacity:.92}); m.position.set(x,y,z); c.add(m); }); c.position.y=13+i*1.5; g.add(c); cl.push(c); }
    g.userData.upd=t=>{ cl.forEach((c,i)=>{ c.position.x=((t*1.2+i*14)%40)-20; c.position.z=(i-1)*7; }); }; return g; });

  // ── Effekte ──
  add('w_fireflies','Glühwürmchen','✨',GRP_B,()=>{ const g=new THREE.Group(), a=[]; for(let i=0;i<14;i++){ const s=glow(0xfff176,.9,.9); s.userData.b=[rnd(-5,5),rnd(.6,3),rnd(-5,5),rnd(0,TAU)]; g.add(s); a.push(s); }
    g.userData.upd=t=>{ a.forEach((s,i)=>{ const b=s.userData.b; s.position.set(b[0]+Math.sin(t*.7+b[3])*1.2,b[1]+Math.sin(t*1.1+b[3]*2)*.5,b[2]+Math.cos(t*.6+b[3])*1.2); s.material.opacity=.15+.85*Math.max(0,Math.sin(t*2.2+b[3]*3)); }); }; return g; });
  add('w_bubbles','Seifenblasen','🫧',GRP_B,()=>{ const g=new THREE.Group(), a=[]; for(let i=0;i<10;i++){ const s=emo('🫧',.7+i%3*.2); g.add(s); a.push(s); }
    g.userData.upd=t=>{ a.forEach((s,i)=>{ const p=(t*.12+i/10)%1; s.position.set(Math.sin(t*.9+i*2)*1.4,.3+p*6.5,Math.cos(t*.7+i)*1.4); s.material.opacity=1; }); }; return g; });
  add('w_smoke','Rauchsäule','💨',GRP_B,()=>{ const g=new THREE.Group(), a=[]; for(let i=0;i<9;i++){ const s=glow(0x9aa0a6,2,.5); g.add(s); a.push(s); } const b=mk(new THREE.CylinderGeometry(.6,.8,.5,8),0x6b6b6b); b.position.y=.25; g.add(b);
    g.userData.upd=t=>{ a.forEach((s,i)=>{ const p=(t*.18+i/9)%1; s.position.set(Math.sin(t+i)*.4*p+p*1.2,.6+p*7,0); const z=1.2+p*3.5; s.scale.set(z,z,1); s.material.opacity=.55*(1-p); }); }; return g; });
  add('w_jet','Fontäne','⛲',GRP_B,()=>{ const g=new THREE.Group(); const b=mk(new THREE.CylinderGeometry(2.6,2.8,.7,16),0x9aa5ab); b.position.y=.35; g.add(b); const w=mk(new THREE.CylinderGeometry(2.3,2.3,.1,16),0x3aa0ff); w.position.y=.72; g.add(w); const N=36, p=pts(N,0x9ad7ff,.38); g.add(p);
    g.userData.upd=t=>{ const q=p.userData.pos; for(let i=0;i<N;i++){ const ph=(t*.8+i/N)%1, an=i*2.4; const c=i%3===0; const r=c?ph*.5:ph*2.2; q[i*3]=Math.cos(an)*r; q[i*3+1]=.8+(c?5*ph*(1-ph)*3.4:4*ph*(1-ph)*3.4); q[i*3+2]=Math.sin(an)*r; } flush(p); }; return g; });
  add('w_firework','Dauer-Feuerwerk','🎆',GRP_B,()=>{ const g=new THREE.Group(); const N=70, p=pts(N,0xffffff,.55,{vertexColors:false}); g.add(p); const dirs=[]; for(let i=0;i<N;i++){ const a=Math.random()*TAU, b=Math.acos(rnd(-1,1)); dirs.push([Math.sin(b)*Math.cos(a),Math.cos(b),Math.sin(b)*Math.sin(a)]); } let cyc=-1;
    g.userData.upd=t=>{ const T=3.6, c=Math.floor(t/T), tt=t%T, q=p.userData.pos; if(c!==cyc){ cyc=c; p.material.color.setHSL(Math.random(),1,.6); } if(tt<.9){ const y=tt/.9*11; for(let i=0;i<N;i++){ q[i*3]=0; q[i*3+1]=y; q[i*3+2]=0; } p.material.opacity=1; } else { const e=tt-.9; for(let i=0;i<N;i++){ const d=dirs[i], sp=5.5; q[i*3]=d[0]*sp*e; q[i*3+1]=11+d[1]*sp*e-2.2*e*e; q[i*3+2]=d[2]*sp*e; } p.material.opacity=Math.max(0,1-e/2.2); } flush(p); }; return g; });
  add('w_snow','Schneefall','❄️',GRP_B,()=>{ const g=new THREE.Group(); const N=180, p=pts(N,0xffffff,.28); g.add(p); const b=[]; for(let i=0;i<N;i++) b.push([rnd(-6,6),rnd(0,9),rnd(-6,6),rnd(0,TAU)]);
    g.userData.upd=t=>{ const q=p.userData.pos; for(let i=0;i<N;i++){ const o=b[i], y=9-((t*1.1+o[1])%9); q[i*3]=o[0]+Math.sin(t*.8+o[3])*.5; q[i*3+1]=y; q[i*3+2]=o[2]+Math.cos(t*.6+o[3])*.5; } flush(p); }; return g; });
  add('w_confetti','Konfetti-Regen','🎊',GRP_B,()=>{ const g=new THREE.Group(); const N=130, p=pts(N,0xffffff,.32,{vertexColors:true}); const col=new Float32Array(N*3); const c=new THREE.Color(); for(let i=0;i<N;i++){ c.setHSL(Math.random(),1,.6); col[i*3]=c.r; col[i*3+1]=c.g; col[i*3+2]=c.b; } p.geometry.setAttribute('color',new THREE.BufferAttribute(col,3)); g.add(p); const b=[]; for(let i=0;i<N;i++) b.push([rnd(-4,4),rnd(0,8),rnd(-4,4),rnd(0,TAU)]);
    g.userData.upd=t=>{ const q=p.userData.pos; for(let i=0;i<N;i++){ const o=b[i]; q[i*3]=o[0]+Math.sin(t*2+o[3])*.6; q[i*3+1]=8-((t*1.6+o[1])%8); q[i*3+2]=o[2]+Math.cos(t*1.7+o[3])*.6; } flush(p); }; return g; });
  add('w_lanterns','Himmelslaternen','🏮',GRP_B,()=>{ const g=new THREE.Group(), a=[]; for(let i=0;i<6;i++){ const l=new THREE.Group(); const b=bs(new THREE.BoxGeometry(.7,.9,.7),0xff9a3c); l.add(b); const gl=glow(0xffb74d,2.4,.8); l.add(gl); g.add(l); a.push(l); }
    g.userData.upd=t=>{ a.forEach((l,i)=>{ const p=(t*.045+i/6)%1; l.position.set(Math.sin(t*.4+i*2)*3+i-2.5,1.5+p*22,Math.cos(t*.3+i)*3); }); }; return g; });
  add('w_balloons','Ballon-Bündel','🎈',GRP_B,()=>{ const g=new THREE.Group(), a=[]; [0xe74c3c,0xf1c40f,0x3498db,0x2ecc71,0xe056fd].forEach((c,i)=>{ const b=new THREE.Group(); const m=mk(new THREE.SphereGeometry(.8,10,8),c); m.scale.y=1.2; m.position.y=4.2; b.add(m); const s=mk(new THREE.CylinderGeometry(.015,.015,4,3),0xffffff); s.position.y=2; b.add(s); b.position.x=(i-2)*.7; g.add(b); a.push(b); }); const w=mk(new THREE.BoxGeometry(.6,.5,.6),0x7a5230); w.position.y=.25; g.add(w);
    g.userData.upd=t=>{ a.forEach((b,i)=>{ b.rotation.z=Math.sin(t*1.1+i)*.09; b.position.y=Math.sin(t*1.4+i*1.3)*.25; }); }; return g; });
  add('w_ripples','Teich mit Wellen','🌊',GRP_B,()=>{ const g=new THREE.Group(); g.add(pond(3.4,0x2f9bd6)); const a=[]; for(let i=0;i<3;i++){ const r=bs(new THREE.RingGeometry(.9,1,24),0xffffff,{transparent:true,opacity:.6,side:THREE.DoubleSide,depthWrite:false}); r.rotation.x=-Math.PI/2; r.position.y=.17; g.add(r); a.push(r); }
    g.userData.upd=t=>{ a.forEach((r,i)=>{ const p=(t*.35+i/3)%1; r.scale.setScalar(.3+p*3.1); r.material.opacity=.7*(1-p); }); }; return g; });
  add('w_rainbow','Regenbogen','🌈',GRP_B,()=>{ const g=new THREE.Group(), a=[]; [0xe74c3c,0xe67e22,0xf1c40f,0x2ecc71,0x3498db,0x8e44ad].forEach((c,i)=>{ const t=bs(new THREE.TorusGeometry(8-i*.55,.3,6,32,Math.PI),c,{transparent:true,opacity:.85}); g.add(t); a.push(t); });
    g.userData.upd=t=>{ a.forEach((m,i)=>{ m.material.opacity=.7+.2*Math.sin(t*1.2+i*.7); }); }; return g; });
  add('w_aurora','Polarlicht','🌌',GRP_B,()=>{ const g=new THREE.Group(), a=[]; [0x39ff9a,0x35d0ff,0xb26bff].forEach((c,i)=>{ const m=bs(new THREE.PlaneGeometry(26,7,12,1),c,{transparent:true,opacity:.22,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}); m.position.set(0,13+i*1.5,-i*2); g.add(m); a.push(m); });
    g.userData.upd=t=>{ a.forEach((m,i)=>{ m.material.opacity=.15+.12*Math.sin(t*.8+i*1.7); m.scale.x=1+.08*Math.sin(t*.5+i); m.position.x=Math.sin(t*.3+i)*2; const p=m.geometry.attributes.position; for(let k=0;k<p.count;k++){ const x=p.getX(k); p.setZ(k,Math.sin(t*1.2+x*.35+i)*1.4); } p.needsUpdate=true; }); }; return g; });
  add('w_comet','Komet-Flug','☄️',GRP_B,()=>{ const g=new THREE.Group(), s=emo('☄️',5); g.add(s); g.userData.upd=t=>{ const T=12, p=(t%T)/T; s.visible=p<.5; const q=p/.5; s.position.set(-40+q*80,28-q*14,-12+q*14); }; return g; });
  add('w_star','Goldener Stern','⭐',GRP_B,()=>{ const g=new THREE.Group(); const st=new THREE.Group(); const m=bs(new THREE.OctahedronGeometry(1.3,0),0xffd54f); m.scale.set(1,1.6,1); st.add(m); const m2=bs(new THREE.OctahedronGeometry(1.3,0),0xffe98a); m2.rotation.y=Math.PI/4; m2.scale.set(1,1.6,1); st.add(m2); st.position.y=3.2; g.add(st); const gl=glow(0xffd54f,5,.7); gl.position.y=3.2; g.add(gl);
    g.userData.upd=t=>{ st.rotation.y=t*1.2; st.position.y=3.2+Math.sin(t*1.5)*.35; gl.position.y=st.position.y; gl.scale.setScalar(4.4+Math.sin(t*3)*.8); }; return g; });
  add('w_disco','Disco-Kugel','🪩',GRP_B,()=>{ const g=new THREE.Group(); const p=mk(new THREE.CylinderGeometry(.08,.08,4,5),0x444444); p.position.y=2; g.add(p); const b=mk(new THREE.IcosahedronGeometry(1.2,1),0xcfd8dc,{flatShading:true}); b.position.y=4.4; g.add(b); const a=[]; [0xff4d4d,0x4dff88,0x4da6ff,0xffd24d,0xe056fd,0x4dfff3].forEach((c)=>{ const s=glow(c,1.6,.85); g.add(s); a.push(s); });
    g.userData.upd=t=>{ b.rotation.y=t*.9; a.forEach((s,i)=>{ const an=t*1.4+i*Math.PI/3; s.position.set(Math.cos(an)*2.6,4.4+Math.sin(t*2+i)*.8,Math.sin(an)*2.6); }); }; return g; });
  add('w_lamp','Leuchtende Laterne','💡',GRP_B,()=>{ const g=new THREE.Group(); const p=mk(new THREE.CylinderGeometry(.1,.14,3.6,6),0x2c3e50); p.position.y=1.8; g.add(p); const h=bs(new THREE.SphereGeometry(.35,8,6),0xfff3b0); h.position.y=3.8; g.add(h); const gl=glow(0xfff0a0,3.4,.8); gl.position.y=3.8; g.add(gl);
    g.userData.upd=t=>{ gl.material.opacity=.65+.2*Math.sin(t*3.1)+.08*Math.sin(t*11); }; return g; });
  add('w_campfire','Lagerfeuer lebendig','🔥',GRP_B,()=>{ const g=new THREE.Group(); for(let i=0;i<4;i++){ const l=mk(new THREE.CylinderGeometry(.12,.12,1.3,5),0x6b4a2a); const a=i/4*TAU; l.position.set(Math.cos(a)*.4,.2,Math.sin(a)*.4); l.rotation.z=Math.PI/2.4; l.rotation.y=-a; g.add(l); } const fl=[]; [[0xff6a00,.7,1.8],[0xffa600,.5,1.4],[0xffe066,.3,1]].forEach(([c,r,h])=>{ const m=bs(new THREE.ConeGeometry(r,h,7),c,{transparent:true,opacity:.92}); m.position.y=h/2+.2; g.add(m); fl.push(m); }); const N=14, sp=pts(N,0xffc266,.22); g.add(sp); const gl=glow(0xff9a3c,5,.55); gl.position.y=1; g.add(gl);
    g.userData.upd=t=>{ fl.forEach((m,i)=>{ m.scale.set(1+Math.sin(t*9+i*2)*.12,1+Math.sin(t*13+i)*.2,1+Math.cos(t*11+i)*.12); m.rotation.y=t*2+i; }); const q=sp.userData.pos; for(let i=0;i<N;i++){ const p=(t*.6+i/N)%1; q[i*3]=Math.sin(i*2.7+t)*.5*p; q[i*3+1]=.6+p*4; q[i*3+2]=Math.cos(i*1.9+t)*.5*p; } flush(sp); gl.material.opacity=.45+.15*Math.sin(t*10); }; return g; });

  // ── Bauten ──
  add('w_flag','Wehende Flagge','🚩',GRP_C,()=>{ const g=new THREE.Group(); const p=mk(new THREE.CylinderGeometry(.08,.1,6.5,6),0xcfd2d6); p.position.y=3.25; g.add(p); const seg=[]; for(let i=0;i<6;i++){ const m=mk(new THREE.BoxGeometry(.7,1.6,.04),i%2?0xffffff:0xe74c3c); m.position.set(.35+i*.7,5.6,0); g.add(m); seg.push(m); }
    g.userData.upd=t=>{ seg.forEach((m,i)=>{ m.position.z=Math.sin(t*4-i*.8)*.2*(i+1)/3; m.rotation.y=Math.cos(t*4-i*.8)*.25; }); }; return g; });
  add('w_windmill','Windmühle (dreht sich)','🌬️',GRP_C,()=>{ const g=new THREE.Group(); const t=mk(new THREE.CylinderGeometry(1.2,2,6,8),0xe8dcc8); t.position.y=3; g.add(t); const r=mk(new THREE.ConeGeometry(1.7,1.8,8),0xb5532f); r.position.y=6.9; g.add(r); const d=mk(new THREE.BoxGeometry(.8,1.4,.1),0x6b4a2a); d.position.set(0,.7,1.95); g.add(d); const bl=new THREE.Group(); bl.position.set(0,6,1.5); g.add(bl); const hub=mk(new THREE.CylinderGeometry(.25,.25,.5,8),0x444444); hub.rotation.x=Math.PI/2; bl.add(hub); for(let i=0;i<4;i++){ const w=new THREE.Group(); w.rotation.z=i*Math.PI/2; const b=mk(new THREE.BoxGeometry(.5,3.6,.08),0xf4efe6); b.position.y=2.1; w.add(b); const s=mk(new THREE.BoxGeometry(.1,3.6,.1),0x6b4a2a); s.position.set(-.3,2.1,0); w.add(s); bl.add(w); }
    g.userData.upd=(t,dt)=>{ bl.rotation.z-=dt*.9; }; return g; });
  add('w_ferris','Riesenrad (dreht sich)','🎡',GRP_C,()=>{ const g=new THREE.Group(); const wh=new THREE.Group(); wh.position.y=8; g.add(wh); [-.5,.5].forEach(z=>{ const r=mk(new THREE.TorusGeometry(6,.16,6,36),0xeeeeee); r.position.z=z; wh.add(r); }); const cab=[]; for(let i=0;i<8;i++){ const a=i/8*TAU; const sp=mk(new THREE.BoxGeometry(12,.1,.1),0xcccccc); sp.rotation.z=a; wh.add(sp); const c=new THREE.Group(); c.position.set(Math.cos(a)*6,Math.sin(a)*6,0); const b=mk(new THREE.BoxGeometry(1.1,.9,1.1),[0xe74c3c,0xf1c40f,0x3498db,0x2ecc71][i%4]); b.position.y=-.55; c.add(b); wh.add(c); cab.push(c); }
    [-1,1].forEach(s=>{ const l=mk(new THREE.CylinderGeometry(.18,.22,9,6),0x7a5230); l.position.set(s*3,4,0); l.rotation.z=-s*.33; g.add(l); }); const hub=mk(new THREE.CylinderGeometry(.5,.5,1.4,10),0x444444); hub.rotation.x=Math.PI/2; hub.position.y=8; g.add(hub);
    g.userData.upd=(t,dt)=>{ wh.rotation.z+=dt*.28; cab.forEach(c=>{ c.rotation.z=-wh.rotation.z; }); }; return g; });
  add('w_carousel','Karussell (dreht sich)','🎠',GRP_C,()=>{ const g=new THREE.Group(); const rot=new THREE.Group(); g.add(rot); const b=mk(new THREE.CylinderGeometry(3.4,3.5,.35,20),0xf1c40f); b.position.y=.2; rot.add(b); const hs=[]; for(let i=0;i<6;i++){ const a=i/6*TAU, x=Math.cos(a)*2.3, z=Math.sin(a)*2.3; const p=mk(new THREE.CylinderGeometry(.06,.06,3,5),0xdddddd); p.position.set(x,1.8,z); rot.add(p); const h=emo(['🐴','🦄','🐴'][i%3],1.3); h.position.set(x,1.6,z); rot.add(h); hs.push(h); } const r=mk(new THREE.ConeGeometry(3.9,1.8,16),0xe74c3c); r.position.y=4.2; rot.add(r); const c=mk(new THREE.CylinderGeometry(.3,.3,3.3,8),0xffd54f); c.position.y=2; rot.add(c);
    g.userData.upd=(t,dt)=>{ rot.rotation.y+=dt*.8; hs.forEach((h,i)=>{ h.position.y=1.5+Math.sin(t*3+i*1.1)*.5; }); }; return g; });
  add('w_ufo','UFO (schwebt)','🛸',GRP_C,()=>{ const g=new THREE.Group(); const u=new THREE.Group(); u.position.y=6; g.add(u); const d=mk(new THREE.SphereGeometry(2.2,14,8),0xb0bec5); d.scale.y=.28; u.add(d); const c=mk(new THREE.SphereGeometry(1,12,8,0,TAU,0,Math.PI/2),0x7ad0ff,{transparent:true,opacity:.8}); c.position.y=.2; u.add(c); const ls=[]; for(let i=0;i<6;i++){ const a=i/6*TAU; const l=glow(0xffee58,.9,.9); l.position.set(Math.cos(a)*1.9,-.1,Math.sin(a)*1.9); u.add(l); ls.push(l); } const bm=bs(new THREE.ConeGeometry(2.4,6,16,1,true),0xfff59d,{transparent:true,opacity:.2,side:THREE.DoubleSide,depthWrite:false}); bm.position.y=-3; u.add(bm);
    g.userData.upd=t=>{ u.position.y=6+Math.sin(t*1.2)*.5; u.rotation.y=t*.7; bm.material.opacity=.14+.08*Math.sin(t*3); ls.forEach((l,i)=>{ l.material.opacity=.5+.5*Math.abs(Math.sin(t*4+i)); }); }; return g; });
  add('w_robot','Roboter (winkt)','🤖',GRP_C,()=>{ const g=new THREE.Group(); const b=mk(new THREE.BoxGeometry(1.4,1.8,.9),0x90a4ae); b.position.y=1.9; g.add(b); const h=mk(new THREE.BoxGeometry(1,.9,.9),0xb0bec5); h.position.y=3.2; g.add(h); [-.25,.25].forEach(x=>{ const e=bs(new THREE.SphereGeometry(.12,6,5),0x00e5ff); e.position.set(x,3.25,.46); g.add(e); }); [-.45,.45].forEach(x=>{ const l=mk(new THREE.BoxGeometry(.4,1.1,.5),0x607d8b); l.position.set(x,.55,0); g.add(l); }); const arm=new THREE.Group(); arm.position.set(.85,2.6,0); const a=mk(new THREE.BoxGeometry(.3,1.2,.3),0x607d8b); a.position.y=-.5; arm.add(a); g.add(arm); const a2=mk(new THREE.BoxGeometry(.3,1.2,.3),0x607d8b); a2.position.set(-.95,2,0); g.add(a2); const ant=mk(new THREE.CylinderGeometry(.04,.04,.6,4),0x444444); ant.position.y=3.9; g.add(ant); const al=glow(0xff5252,.7,1); al.position.y=4.25; g.add(al);
    g.userData.upd=t=>{ arm.rotation.z=Math.PI*.7+Math.sin(t*5)*.45; al.material.opacity=.4+.6*Math.abs(Math.sin(t*3)); b.position.y=1.9+Math.sin(t*2)*.03; }; return g; });
  add('w_lighthouse','Leuchtturm','🗼',GRP_C,()=>{ const g=new THREE.Group(); const t=mk(new THREE.CylinderGeometry(1.2,1.9,9,10),0xffffff); t.position.y=4.5; g.add(t); [1.5,4,6.5].forEach((y,i)=>{ const s=mk(new THREE.CylinderGeometry(1.7-i*.28,1.78-i*.28,1.1,10),0xe74c3c); s.position.y=y; g.add(s); }); const top=mk(new THREE.CylinderGeometry(1.5,1.5,.3,10),0x444444); top.position.y=9.1; g.add(top); const lan=bs(new THREE.CylinderGeometry(.7,.7,1.1,8),0xfff59d); lan.position.y=9.8; g.add(lan); const r=mk(new THREE.ConeGeometry(1,1,8),0xe74c3c); r.position.y=10.8; g.add(r); const beam=new THREE.Group(); beam.position.y=9.8; g.add(beam); const bm=bs(new THREE.ConeGeometry(1.4,14,12,1,true),0xfff9c4,{transparent:true,opacity:.22,side:THREE.DoubleSide,depthWrite:false}); bm.rotation.z=-Math.PI/2; bm.position.x=7; beam.add(bm); const gl=glow(0xfff59d,4,.9); gl.position.y=9.8; g.add(gl);
    g.userData.upd=(t,dt)=>{ beam.rotation.y+=dt*1.1; gl.material.opacity=.6+.3*Math.sin(t*4); }; return g; });
  add('w_swing','Schaukel (schwingt)','🪢',GRP_C,()=>{ const g=new THREE.Group(); [-1.6,1.6].forEach(x=>{ [-.6,.6].forEach(z=>{ const l=mk(new THREE.CylinderGeometry(.08,.08,3.8,5),0x7a5230); l.position.set(x,1.8,z*.9); l.rotation.x=z>0?.18:-.18; g.add(l); }); }); const top=mk(new THREE.CylinderGeometry(.09,.09,3.5,5),0x6b4a2a); top.rotation.z=Math.PI/2; top.position.y=3.65; g.add(top); const sw=new THREE.Group(); sw.position.y=3.6; g.add(sw); [-.5,.5].forEach(x=>{ const r=mk(new THREE.CylinderGeometry(.015,.015,2.6,3),0xdddddd); r.position.set(x,-1.3,0); sw.add(r); }); const s=mk(new THREE.BoxGeometry(1.2,.12,.5),0xc8a165); s.position.y=-2.6; sw.add(s); const k=emo('🧒',1.2); k.position.y=-2; sw.add(k);
    g.userData.upd=t=>{ sw.rotation.x=Math.sin(t*1.7)*.7; }; return g; });
  add('w_pinwheel','Windrad-Blume','🌀',GRP_C,()=>{ const g=new THREE.Group(); const p=mk(new THREE.CylinderGeometry(.06,.08,3,5),0x7cc24a); p.position.y=1.5; g.add(p); const w=new THREE.Group(); w.position.set(0,3.1,.1); g.add(w); [0xe74c3c,0xf1c40f,0x3498db,0x2ecc71].forEach((c,i)=>{ const b=mk(new THREE.BoxGeometry(.9,.9,.04),c); b.position.set(.45,.45,0); const h=new THREE.Group(); h.rotation.z=i*Math.PI/2; h.add(b); w.add(h); });
    g.userData.upd=(t,dt)=>{ w.rotation.z-=dt*3.2; }; return g; });

  /* ═══════════ Kern ═══════════ */
  const W=window.ZWorld={
    LIVE, objs:{}, nodes:{}, grp:null, solids:[], open:false, tab:0, pick:null, rot:0, sc:1, col:null, dist:10, lat:0, ghost:null, ring:null, sel:null, mine:[], tap:null, tapMode:false, _inited:false, _t0:performance.now(), _q:'',
    cats(){ const B=ZB(); const base=(B.CAT||[]).filter(c=>!c.adm).map(c=>({g:c.g,items:c.items.filter(i=>i.k!=='s')})); const wall=B.ALL&&B.ALL.wall?[{t:'wall',n:'Mauer (blockt)',ic:'🧱',k:'p'}]:[]; if(wall.length) base.push({g:'🧱 Mauer',items:wall}); return base.concat(LCAT); },
    total(){ return W.cats().reduce((a,c)=>a+c.items.length,0); },
    toggle(){ if(!isAdm()){ toast('Nur für den Admin'); return; } W.open?W.close():W.show(); },
    init(){
      if(W._inited) return; W._inited=true;
      const r=RT(); if(r){ const q=r.ref('zoo_world/objs');
        q.on('child_added',s=>W._set(s.key,s.val())); q.on('child_changed',s=>W._set(s.key,s.val())); q.on('child_removed',s=>W._del(s.key)); }
      else { try{ const l=JSON.parse(localStorage.getItem('zoo_world_local')||'{}'); Object.keys(l).forEach(k=>W._set(k,l[k])); }catch(e){} }
    },
    _ensureGrp(){ if(W.grp||typeof ZG==='undefined'||!ZG.scene) return !!W.grp; W.grp=new THREE.Group(); ZG.scene.add(W.grp); return true; },
    _build(v){
      let node=null; const L=LIVE[v.t];
      if(L){ node=L.build(); }
      else { node=ZB().buildObj([v.t,0,0,0,1,v.c||null],'__world',0); }
      if(!node) return null; node.scale.multiplyScalar(v.s||1); node.position.set(v.x,v.y||0,v.z); node.rotation.y=(v.r||0)*Math.PI/180; return node;
    },
    _set(id,v){
      if(!v||!v.t) return; W.objs[id]=v; if(!W._ensureGrp()){ return; }
      W._drop3(id); const n=W._build(v); if(!n) return; n.userData.wid=id; n.userData.ph=Math.random()*TAU; n.userData.by=n.position.y; W.grp.add(n); W.nodes[id]=n; W._solids();
    },
    _del(id){ delete W.objs[id]; W._drop3(id); W._solids(); if(W.sel===id) W.sel=null; },
    _drop3(id){ const n=W.nodes[id]; if(n){ try{ W.grp.remove(n); }catch(e){} delete W.nodes[id]; } },
    _solids(){
      const a=[]; Object.keys(W.objs).forEach(id=>{ const v=W.objs[id], n=W.nodes[id]; if(!n||v.t!=='wall') return; const sd=n.userData.solid; if(!sd) return; const k=(v.s||1); a.push({kind:'wall',hx:sd.hx*k,hz:sd.hz*k,x:v.x,z:v.z,th:(v.r||0)*Math.PI/180,owner:'__world'}); });
      W.solids=a;
    },
    // ── Schreiben ──
    _save(id,v){ const r=RT(); if(r) return r.ref('zoo_world/objs/'+id).set(v).catch(e=>toast('❌ '+e.message)); try{ const l=JSON.parse(localStorage.getItem('zoo_world_local')||'{}'); if(v) l[id]=v; else delete l[id]; localStorage.setItem('zoo_world_local',JSON.stringify(l)); }catch(e){} if(v) W._set(id,v); else W._del(id); },
    _newId(){ const r=RT(); return r?r.ref('zoo_world/objs').push().key:('l'+Date.now().toString(36)+Math.floor(Math.random()*1e4)); },
    target(){ if(W.tap) return W.tap; const a=ZG.yaw, fx=-Math.sin(a), fz=-Math.cos(a), rx=Math.cos(a), rz=-Math.sin(a); let x=ZG.pl.x+fx*W.dist+rx*W.lat, z=ZG.pl.z+fz*W.dist+rz*W.lat; const R=(ZG.WR||150)-3, d=Math.hypot(x,z); if(d>R){ x*=R/d; z*=R/d; } return {x:Math.round(x*2)/2,z:Math.round(z*2)/2}; },
    place(){
      if(!W.pick){ toast('Erst links ein Element wählen'); return; } if(Object.keys(W.objs).length>=MAXW){ toast('Maximum '+MAXW+' Objekte erreicht'); return; }
      const t=W.target(), id=W._newId(), v={t:W.pick,x:t.x,z:t.z,r:W.rot,s:W.sc,c:W.col||null,by:ZS.player,at:Date.now()}; if(!v.c) delete v.c; W.mine.push(id); W._save(id,v); toast('📍 Platziert ('+(Object.keys(W.objs).length+(RT()?1:0))+')',1200);
    },
    undo(){ const id=W.mine.pop(); if(!id){ toast('Nichts zum Zurücknehmen'); return; } W._save(id,null); },
    near(n){ const t=W.target(); return Object.keys(W.objs).map(id=>({id,d:Math.hypot(W.objs[id].x-t.x,W.objs[id].z-t.z)})).filter(o=>o.d<9).sort((a,b)=>a.d-b.d).slice(0,n||5); },
    select(){ const l=W.near(6); if(!l.length){ W.sel=null; toast('Nichts in der Nähe vom Zielpunkt'); return; } const i=l.findIndex(o=>o.id===W.sel); W.sel=(i+1<l.length)?l[i+1].id:(i<0?l[0].id:null); if(W.sel){ const v=W.objs[W.sel]; W.rot=v.r||0; W.sc=v.s||1; toast('👆 Gewählt: '+W._name(v.t),1500); } else toast('Auswahl aufgehoben',1200); },
    _name(t){ const c=W.cats(); for(const g of c){ const i=g.items.find(x=>x.t===t); if(i) return i.ic+' '+i.n; } return t; },
    _upd(patch){ const id=W.sel; if(!id||!W.objs[id]) return false; const v=Object.assign({},W.objs[id],patch); clearTimeout(W._ut); W.objs[id]=v; W._set(id,v); W._ut=setTimeout(()=>{ if(W.objs[id]) W._save(id,v); },250); return true; },
    rotate(d){ W.rot=((W.rot+d)%360+360)%360; if(W.sel) W._upd({r:W.rot}); W._ghostUpd(true); },
    scale(f){ W.sc=Math.max(.3,Math.min(5,Math.round(W.sc*f*100)/100)); if(W.sel) W._upd({s:W.sc}); W._ghostUpd(true); },
    setCol(c){ W.col=c; if(W.sel) W._upd({c:c||null}); W._ghostUpd(true); },
    moveHere(){ if(!W.sel){ toast('Erst ein Objekt wählen (👆)'); return; } const t=W.target(); W._upd({x:t.x,z:t.z}); },
    copy(){ if(!W.sel||!W.objs[W.sel]) { toast('Erst ein Objekt wählen (👆)'); return; } const t=W.target(), id=W._newId(), v=Object.assign({},W.objs[W.sel],{x:t.x+2,z:t.z+2,by:ZS.player,at:Date.now()}); W.mine.push(id); W._save(id,v); },
    del(){ if(!W.sel){ const l=W.near(1); if(!l.length){ toast('Nichts in der Nähe'); return; } W.sel=l[0].id; } const id=W.sel; W.sel=null; W._save(id,null); toast('🗑 Gelöscht',1200); },
    async clearAll(){ if(!Object.keys(W.objs).length) return; let ok=true; try{ ok=await new Promise(res=>{ const o=window.confirm?window.confirm('Wirklich ALLE '+Object.keys(W.objs).length+' Welt-Objekte löschen?'):true; res(o); }); }catch(e){} if(!ok) return; const r=RT(); if(r) await r.ref('zoo_world/objs').remove(); else { localStorage.removeItem('zoo_world_local'); Object.keys(W.objs).forEach(id=>W._del(id)); } W.sel=null; W.mine=[]; toast('🧹 Alles gelöscht'); },
    // ── Ghost / Markierung ──
    _ghostUpd(force){
      if(!W.open||!W._ensureGrp()) return; const t=W.target();
      if(W.sel&&W.nodes[W.sel]){ if(W.ghost){ W.ghost.visible=false; } }
      else if(W.pick){ if(force||!W.ghost||W.ghost.userData.k!==W.pick+'|'+W.sc+'|'+W.col){ if(W.ghost) W.grp.remove(W.ghost); const g=W._build({t:W.pick,x:0,z:0,r:0,s:W.sc,c:W.col}); if(g){ g.userData.k=W.pick+'|'+W.sc+'|'+W.col; W.ghost=g; W.grp.add(g); } } if(W.ghost){ W.ghost.visible=true; W.ghost.position.set(t.x,0,t.z); W.ghost.rotation.y=W.rot*Math.PI/180; } }
      else if(W.ghost){ W.ghost.visible=false; }
      if(!W.ring){ W.ring=new THREE.Mesh(new THREE.RingGeometry(1.2,1.5,24),new THREE.MeshBasicMaterial({color:0xffd54f,side:THREE.DoubleSide,transparent:true,opacity:.85,depthWrite:false})); W.ring.rotation.x=-Math.PI/2; W.ring.position.y=.06; W.grp.add(W.ring); }
      W.ring.visible=true; if(W.sel&&W.objs[W.sel]){ const v=W.objs[W.sel]; W.ring.position.set(v.x,.06,v.z); W.ring.scale.setScalar(1.2*(v.s||1)+.6); W.ring.material.color.setHex(0x00e5ff); } else { W.ring.position.set(t.x,.06,t.z); W.ring.scale.setScalar(Math.max(.8,W.sc*1.1)); W.ring.material.color.setHex(0xffd54f); }
    },
    // ── Anzeige-Schleife (Animation + Entfernungs-Culling) ──
    _ANIM:{ sway:['pine','oak','palm','cherry','autumn','bush','birch','bamboo','snowpine','flowerbed'], bob:['balloon','star','comet','shooting','satellite','ufo','rocket','alien','astronaut','galaxy','planet','moon','sun','earth','crystal','lantern','rainbow','tulip','sunflower','hibiscus','mushroom','xmas','telescope','spacecrystal'] },
    frame(dt){
      if(!W.grp) return; const t=(performance.now()-W._t0)/1000, cam=ZG.cam&&ZG.cam.position; if(!cam) return;
      const hide=!!(ZG._jumpActive||ZG._arcadeActive||ZG._mazeActive||ZG._trashActive||ZG._iceRoomActive||ZG._spaceActive); W.grp.visible=!hide; if(hide) return;
      Object.keys(W.nodes).forEach(id=>{ const n=W.nodes[id], v=W.objs[id]; const d=Math.hypot(n.position.x-cam.x,n.position.z-cam.z); n.visible=d<150; if(!n.visible||d>90) return;
        if(n.userData.upd){ n.userData.upd(t,dt); return; } const tp=v&&v.t; if(!tp) return; const ph=n.userData.ph;
        if(W._ANIM.sway.indexOf(tp)>=0) n.rotation.z=Math.sin(t*1.3+ph)*.035; else if(W._ANIM.bob.indexOf(tp)>=0) n.position.y=(n.userData.by||0)+Math.sin(t*1.5+ph)*.3; else if(tp==='campfire') n.scale.y=(v.s||1)*(1+Math.sin(t*13+ph)*.07); });
      if(W.open) W._ghostUpd(false); else if(W.ring) W.ring.visible=false, W.ghost&&(W.ghost.visible=false);
      if(W.ghost&&W.ghost.userData.upd&&W.ghost.visible) W.ghost.userData.upd(t,dt);
    },
    // ── UI ──
    close(){ W.open=false; W.tapMode=false; W.tap=null; const p=document.getElementById('zwb-panel'); if(p) p.remove(); const o=document.getElementById('zwb-tapov'); if(o) o.remove(); if(W.ghost) W.ghost.visible=false; if(W.ring) W.ring.visible=false; },
    show(){
      W.open=true; W.init(); W._ensureGrp(); const old=document.getElementById('zwb-panel'); if(old) old.remove();
      const p=document.createElement('div'); p.id='zwb-panel';
      p.style.cssText='position:fixed;left:0;top:56px;bottom:86px;width:248px;z-index:585;background:rgba(14,18,34,.95);border-right:2px solid #9b59b6;border-radius:0 14px 14px 0;color:#fff;font-family:Arial,sans-serif;display:flex;flex-direction:column;box-shadow:4px 0 24px rgba(0,0,0,.45)';
      document.body.appendChild(p); W._ui();
    },
    _ui(){
      const p=document.getElementById('zwb-panel'); if(!p) return; const cats=W.cats(); if(W.tab>=cats.length) W.tab=0; const q=W._q.toLowerCase();
      const items=q?cats.reduce((a,c)=>a.concat(c.items),[]).filter(i=>(i.n+i.t).toLowerCase().indexOf(q)>=0):cats[W.tab].items;
      const btn='style="flex:1;min-width:0;padding:7px 2px;border:none;border-radius:8px;background:#2b3354;color:#fff;font-weight:800;font-size:.7rem;cursor:pointer"';
      const sw=['#ffffff','#e74c3c','#f1c40f','#2ecc71','#3498db','#9b59b6','#e67e22','#2c3e50'];
      p.innerHTML='<div style="display:flex;align-items:center;padding:8px 10px;gap:6px"><div style="flex:1;font-weight:900;color:#e0aaff;font-size:.9rem">🌍 Welt-Bauer <span style="font-size:.62rem;color:#99a">'+Object.keys(W.objs).length+'/'+MAXW+' · '+W.total()+' Elemente</span></div><button id="zwb-x" style="background:#3a2a4a;border:none;color:#fff;border-radius:50%;width:26px;height:26px;cursor:pointer">✕</button></div>'
        +'<input id="zwb-q" placeholder="🔍 suchen …" value="'+W._q.replace(/"/g,'')+'" style="margin:0 8px 6px;padding:6px 8px;border-radius:8px;border:1px solid #445;background:#161c2c;color:#fff;font-size:.78rem">'
        +'<div style="display:flex;gap:4px;flex-wrap:wrap;padding:0 8px 6px;max-height:70px;overflow-y:auto">'+cats.map((c,i)=>'<button data-tab="'+i+'" style="padding:4px 7px;border:none;border-radius:12px;font-size:.62rem;font-weight:800;cursor:pointer;background:'+((!q&&i===W.tab)?'#9b59b6':'#2b3354')+';color:#fff">'+c.g+'</button>').join('')+'</div>'
        +'<div id="zwb-grid" style="flex:1;overflow-y:auto;display:grid;grid-template-columns:repeat(3,1fr);gap:5px;padding:0 8px 8px;align-content:start;-webkit-overflow-scrolling:touch">'+items.map(i=>'<button data-t="'+i.t+'" title="'+i.n+'" style="padding:6px 2px;border-radius:10px;border:2px solid '+(W.pick===i.t?'#ffd54f':'transparent')+';background:#222b4a;color:#fff;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px"><span style="font-size:1.4rem;line-height:1">'+i.ic+'</span><span style="font-size:.55rem;line-height:1.1;text-align:center;word-break:break-word">'+i.n+'</span></button>').join('')+'</div>'
        +'<div style="padding:6px 8px;border-top:1px solid #334;font-size:.66rem">'
          +'<div style="color:#bbc;margin-bottom:3px">Gewählt: <b style="color:#ffd54f">'+(W.sel?('👆 '+W._name((W.objs[W.sel]||{}).t)):(W.pick?W._name(W.pick):'–'))+'</b> · '+W.rot+'° · ×'+W.sc+'</div>'
          +'<div style="display:flex;gap:4px;align-items:center;margin-bottom:3px"><span style="width:44px">Abstand</span><input id="zwb-d" type="range" min="3" max="60" value="'+W.dist+'" style="flex:1"></div>'
          +'<div style="display:flex;gap:4px;align-items:center;margin-bottom:5px"><span style="width:44px">Seitlich</span><input id="zwb-l" type="range" min="-25" max="25" value="'+W.lat+'" style="flex:1"></div>'
          +'<div style="display:flex;gap:4px;margin-bottom:4px"><button id="zwb-rl" '+btn+'>⟲ 15°</button><button id="zwb-rr" '+btn+'>⟳ 15°</button><button id="zwb-sm" '+btn+'>− Grösse</button><button id="zwb-sp" '+btn+'>+ Grösse</button></div>'
          +'<div style="display:flex;gap:3px;margin-bottom:5px;align-items:center"><button data-c="" style="width:22px;height:22px;border-radius:50%;border:2px solid '+(W.col?'#556':'#fff')+';background:linear-gradient(135deg,#fff 50%,#999 50%);cursor:pointer" title="Originalfarbe"></button>'+sw.map(c=>'<button data-c="'+c+'" style="width:22px;height:22px;border-radius:50%;border:2px solid '+(W.col===c?'#fff':'#556')+';background:'+c+';cursor:pointer"></button>').join('')+'</div>'
          +'<div style="display:flex;gap:4px;margin-bottom:4px"><button id="zwb-pl" '+btn.replace('#2b3354','#27ae60')+'>📍 Platzieren</button><button id="zwb-un" '+btn+'>↩️ Zurück</button></div>'
          +'<div style="display:flex;gap:4px;margin-bottom:4px"><button id="zwb-se" '+btn+'>👆 Auswahl</button><button id="zwb-mv" '+btn+'>➡ Hierher</button><button id="zwb-cp" '+btn+'>⧉ Kopie</button><button id="zwb-dl" '+btn.replace('#2b3354','#a93226')+'>🗑</button></div>'
          +'<div style="display:flex;gap:4px"><button id="zwb-tp" '+btn.replace('#2b3354',W.tapMode?'#d68910':'#2b3354')+'>📌 Tippen: '+(W.tapMode?'AN':'aus')+'</button><button id="zwb-ca" '+btn+'>🧹 Alle</button></div>'
        +'</div>';
      const $=s=>p.querySelector(s);
      $('#zwb-x').onclick=()=>W.close();
      $('#zwb-q').oninput=e=>{ W._q=e.target.value; const pos=e.target.selectionStart; W._ui(); const n=p.querySelector('#zwb-q'); n.focus(); try{ n.setSelectionRange(pos,pos); }catch(x){} };
      p.querySelectorAll('button[data-tab]').forEach(b=>b.onclick=()=>{ W._q=''; W.tab=+b.dataset.tab; W._ui(); });
      p.querySelectorAll('button[data-t]').forEach(b=>b.onclick=()=>{ W.pick=b.dataset.t; W.sel=null; W._ghostUpd(true); W._ui(); });
      p.querySelectorAll('button[data-c]').forEach(b=>b.onclick=()=>{ W.setCol(b.dataset.c||null); W._ui(); });
      $('#zwb-d').oninput=e=>{ W.dist=+e.target.value; W.tap=null; }; $('#zwb-l').oninput=e=>{ W.lat=+e.target.value; W.tap=null; };
      $('#zwb-rl').onclick=()=>{ W.rotate(-15); W._ui(); }; $('#zwb-rr').onclick=()=>{ W.rotate(15); W._ui(); };
      $('#zwb-sm').onclick=()=>{ W.scale(1/1.2); W._ui(); }; $('#zwb-sp').onclick=()=>{ W.scale(1.2); W._ui(); };
      $('#zwb-pl').onclick=()=>W.place(); $('#zwb-un').onclick=()=>W.undo();
      $('#zwb-se').onclick=()=>{ W.select(); W._ghostUpd(true); W._ui(); }; $('#zwb-mv').onclick=()=>W.moveHere(); $('#zwb-cp').onclick=()=>W.copy(); $('#zwb-dl').onclick=()=>{ W.del(); W._ui(); };
      $('#zwb-ca').onclick=()=>W.clearAll();
      $('#zwb-tp').onclick=()=>{ W.tapMode=!W.tapMode; W.tap=null; W._tapOv(); W._ui(); };
    },
    // Tippen-Modus: ein Tipp auf den Boden setzt den Zielpunkt
    _tapOv(){
      let o=document.getElementById('zwb-tapov'); if(o) o.remove(); if(!W.tapMode) return;
      o=document.createElement('div'); o.id='zwb-tapov'; o.style.cssText='position:fixed;left:250px;right:0;top:0;bottom:90px;z-index:570;background:rgba(155,89,182,.04)';
      o.addEventListener('pointerdown',ev=>{ try{ ev.preventDefault(); const r=ZG.renderer.domElement.getBoundingClientRect(), nx=((ev.clientX-r.left)/r.width)*2-1, ny=-((ev.clientY-r.top)/r.height)*2+1; const rc=new THREE.Raycaster(); rc.setFromCamera({x:nx,y:ny},ZG.cam); const d=rc.ray.direction, o2=rc.ray.origin; if(d.y>=-.02){ toast('Tippe auf den Boden',1200); return; } const k=-o2.y/d.y, x=o2.x+d.x*k, z=o2.z+d.z*k; const R=(ZG.WR||150)-3, dd=Math.hypot(x,z); const s=dd>R?R/dd:1; W.tap={x:Math.round(x*s*2)/2,z:Math.round(z*s*2)/2}; }catch(e){} });
      document.body.appendChild(o);
    }
  };
  // Initialisieren, sobald der Zoo läuft; Knopf nur für Admin
  setInterval(()=>{ try{
    if(typeof ZG==='undefined'||!ZG.scene||!ZS.zoo||!ZS.player) return;
    W.init(); W._ensureGrp(); const hb=document.getElementById('hb-world-editor'); if(hb) hb.style.display=isAdm()?'':'none'; if(W.open&&!isAdm()) W.close();
    if(Object.keys(W.objs).length&&W.grp&&!Object.keys(W.nodes).length) Object.keys(W.objs).forEach(id=>W._set(id,W.objs[id]));
  }catch(e){} },1500);
  let _lt=performance.now(); const loop=()=>{ try{ const n=performance.now(), dt=Math.min(.1,(n-_lt)/1000); _lt=n; if(W.grp&&typeof ZG!=='undefined'&&ZG.cam) W.frame(dt); }catch(e){} requestAnimationFrame(loop); }; requestAnimationFrame(loop);
})();

;
/* ZCodes — Admin-Codes (v705): Admin erstellt Codes (nur 1 Person oder alle je 1×, mit Belohnung), Spieler lösen sie im Shop unter „Code einlösen“ ein.
   Dazu: Geld-Multi für alle (zoo_cfg/moneyMult). RTDB: zoo_codes/<code>. */
(function(){
  'use strict';
  const RT=()=>{ try{ return (typeof _rtdb!=='undefined'&&_rtdb)?_rtdb:null; }catch(e){ return null; } };
  const toast=(m,ms)=>{ try{ ZP.toast(m,ms||3000); }catch(e){} };
  const K=n=>String(n||'').toLowerCase().replace(/[.#$\[\]\/]/g,'_');
  const norm=c=>String(c||'').trim().toLowerCase();
  const okCode=c=>/^[a-z0-9äöüß_-]{3,24}$/.test(c);
  const isAdm=()=>{ try{ return !!(window.ZBases&&ZBases.isEd&&ZBases.isEd()); }catch(e){ return false; } };
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const RTYPE={mt:{n:'💰 MT',u:'MT'},money:{n:'💰 Geld-Multi',u:'×'},luck:{n:'🍀 Glück',u:'×'},visitor:{n:'👥 Besucher',u:'×'}};
  const descr=r=>r.type==='mt'?('+'+Math.round(r.amount)+' MT'):(RTYPE[r.type]?RTYPE[r.type].n+' ×'+r.amount+' für '+r.mins+' Min':'?');
  const Z=window.ZCodes={
    codes:{}, mm:null, _inited:false, _admL:false,
    init(){
      const r=RT(); if(!r||typeof ZS==='undefined'||!ZS.player) return;
      if(!Z._inited){ Z._inited=true; try{ r.ref('zoo_cfg/moneyMult').on('value',s=>{ Z.mm=s.val()||null; Z._chip(); }); }catch(e){} }
      if(!Z._admL&&isAdm()){ Z._admL=true; try{ r.ref('zoo_codes').on('value',s=>{ Z.codes=s.val()||{}; Z.adminRender(); }); }catch(e){} }
    },
    // Geld-Multi für alle (wird in earn() eingerechnet)
    gm(){ const m=Z.mm; return (m&&m.until>Date.now()&&m.mult>0)?m.mult:1; },
    _chip(){
      let c=document.getElementById('zc-mm'); const m=Z.mm, on=m&&m.until>Date.now();
      if(!on){ if(c) c.style.display='none'; return; }
      if(!c){ c=document.createElement('div'); c.id='zc-mm'; c.style.cssText='position:fixed;left:8px;top:98px;z-index:600;background:rgba(0,0,0,.6);color:#ffd54f;font:800 .72rem Arial;padding:4px 9px;border-radius:14px;pointer-events:none'; document.body.appendChild(c); }
      const left=Math.max(0,Math.ceil((m.until-Date.now())/1000)); c.style.display=''; c.textContent='💰 Geld ×'+m.mult+' (Admin) · '+Math.floor(left/60)+':'+String(left%60).padStart(2,'0');
    },
    adminMoney(mult,mins){
      const r=RT(); if(!r){ toast('❌ Keine Verbindung'); return; } mult=Math.max(1,Math.min(1000,+mult||2)); mins=Math.max(1,Math.min(240,+mins||10));
      r.ref('zoo_cfg/moneyMult').set({mult,until:Date.now()+mins*60000,by:ZS.player,id:Date.now()}).then(()=>{ toast('💰 Geld ×'+mult+' für ALLE ('+mins+' Min) gestartet'); try{ ZG._bigText&&0; }catch(e){} }).catch(e=>toast('❌ '+e.message));
    },
    adminMoneyStop(){ const r=RT(); if(r) r.ref('zoo_cfg/moneyMult').remove().then(()=>toast('⏹️ Geld-Multi beendet')); },
    // ── Codes anlegen/löschen (Admin) ──
    adminCreate(){
      const r=RT(); if(!r){ toast('❌ Keine Verbindung'); return; } const $=id=>document.getElementById(id);
      let code=norm($('zc-code').value); if(!code){ const a='abcdefghjkmnpqrstuvwxyz23456789'; code=''; for(let i=0;i<6;i++) code+=a[Math.floor(Math.random()*a.length)]; }
      if(!okCode(code)){ toast('❗ Code: 3–24 Zeichen, nur Buchstaben, Zahlen, - und _'); return; }
      const type=$('zc-type').value, amount=+$('zc-amt').value||0, mins=Math.max(1,+$('zc-min').value||10), hrs=Math.max(0,+$('zc-exp').value||0);
      if(amount<=0){ toast('❗ Bitte eine Belohnung > 0 eingeben'); return; }
      const rec={code,scope:$('zc-scope').value==='one'?'one':'all',reward:{type,amount:type==='mt'?Math.round(amount):Math.min(1000,amount),mins:type==='mt'?0:mins},by:ZS.player,at:Date.now(),exp:hrs>0?Date.now()+hrs*3600000:0};
      r.ref('zoo_codes/'+code).transaction(v=>v?undefined:rec,(err,ok)=>{ if(err||!ok){ toast('❗ Diesen Code gibt es schon'); return; } $('zc-code').value=''; toast('🎟️ Code „'+code+'“ erstellt: '+descr(rec.reward)+' · '+(rec.scope==='one'?'nur 1 Person':'alle')); });
    },
    adminDelete(code){ const r=RT(); if(r) r.ref('zoo_codes/'+code).remove().then(()=>toast('🗑 Code gelöscht')); },
    adminRender(){
      const el=document.getElementById('zc-list'); if(!el) return; const l=Object.keys(Z.codes||{}).map(k=>Z.codes[k]).filter(c=>c&&c.code).sort((a,b)=>(b.at||0)-(a.at||0));
      if(!l.length){ el.innerHTML='<div style="font-size:.72rem;color:rgba(255,255,255,.5)">Noch keine Codes.</div>'; return; }
      el.innerHTML=l.map(c=>{ const used=c.scope==='one'?(c.claimedBy?('✅ von '+esc(c.claimedBy.n)):'⏳ frei'):('👥 '+Object.keys(c.used||{}).length+' eingelöst'); const ex=c.exp?(c.exp<Date.now()?' · ⌛ abgelaufen':' · bis '+new Date(c.exp).toLocaleString('de-CH',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})):'';
        return '<div style="display:flex;gap:6px;align-items:center;padding:5px 0;border-top:1px solid rgba(255,255,255,.1);font-size:.74rem"><div style="flex:1;min-width:0"><b style="color:#ffd54f;font-size:.85rem">'+esc(c.code)+'</b> · '+(c.scope==='one'?'1 Person':'alle')+'<br><span style="color:rgba(255,255,255,.65)">'+esc(descr(c.reward||{}))+' · '+used+ex+'</span></div><button onclick="ZCodes.adminDelete(\''+esc(c.code)+'\')" style="background:#6b1f1f;border:none;color:#fff;border-radius:8px;padding:6px 9px;cursor:pointer">🗑</button></div>'; }).join('');
    },
    // ── Einlösen (Spieler) → true, wenn der Code in der Cloud existiert (egal ob erfolgreich) ──
    async redeem(raw){
      const code=norm(raw); if(!okCode(code)) return false; const r=RT(); if(!r||!ZS.zoo){ toast('❌ Keine Verbindung zur Datenbank – Code kann nicht geprüft werden.',3500); return true; }
      let c=null; try{ c=(await r.ref('zoo_codes/'+code).once('value')).val(); }catch(e){ toast('❌ Datenbank-Fehler: '+(e&&e.message||e),4500); try{console.warn('ZCodes',e);}catch(_){} return true; }
      if(!c) return false; const now=Date.now(), z=ZS.zoo, me=K(ZS.player);
      if(c.exp&&c.exp<now){ toast('⌛ Dieser Code ist abgelaufen.',3000); return true; }
      let ok=false;
      if(c.scope==='one'){ ok=await new Promise(res=>r.ref('zoo_codes/'+code+'/claimedBy').transaction(v=>v?undefined:{n:ZS.player,t:now},(e,cm)=>res(!e&&cm))); if(!ok){ const w=(await r.ref('zoo_codes/'+code+'/claimedBy').once('value')).val(); toast('❌ Dieser Code wurde schon'+(w&&w.n?' von '+w.n:'')+' eingelöst.',3500); return true; } }
      else { ok=await new Promise(res=>r.ref('zoo_codes/'+code+'/used/'+me).transaction(v=>v?undefined:now,(e,cm)=>res(!e&&cm))); if(!ok){ toast('❗ Du hast diesen Code schon eingelöst.',3000); return true; } }
      const rw=c.reward||{};
      if(rw.type==='mt'){ z.mt=(z.mt||0)+Math.round(rw.amount||0); }
      else if(RTYPE[rw.type]){ if(!z.mtPassBoosts) z.mtPassBoosts={}; const cur=z.mtPassBoosts[rw.type], base=(cur&&cur.until>now)?cur.until:now; z.mtPassBoosts[rw.type]={mult:rw.amount,until:base+(rw.mins||10)*60000}; }
      try{ ZS.save&&ZS.save(true); ZG._updHUD&&ZG._updHUD(); }catch(e){}
      toast('🎁 Code eingelöst! '+descr(rw),4500); try{ ZG._bigText('🎁 CODE!','#ffd54f',2200); }catch(e){}
      return true;
    }
  };
  setInterval(()=>{ try{ Z.init(); Z._chip(); }catch(e){} },1000);
})();

;
// ZWeather — Wetter im Zoo (ab Rebirth 1): Sonne, Regen, Sturm (mit Blitzen, 3 ❤ Schaden). Zufällig (für alle gleich per Uhr), Admin kann es überschreiben. (v659)
(function(){
  'use strict';
  const TYPES={clear:{ic:'🌤️',n:'Klar'},sun:{ic:'☀️',n:'Sonne'},rain:{ic:'🌧️',n:'Regen'},storm:{ic:'⛈️',n:'STURM'}};
  const R=()=>{ try{ return (typeof _rtdb!=='undefined'&&_rtdb&&State._useCloud())?_rtdb:null; }catch(e){ return null; } };
  const rng=seed=>{ let a=seed>>>0; return ()=>{ a=(a+0x6D2B79F5)>>>0; let t=a; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }; };
  const W=window.ZWeather={
    TYPES, cur:{type:'clear',dir:0}, ovr:null, _inited:false, _last:null, _ui:null, _rain:null, _strikes:[], _nextStrike:0,
    init(){ if(W._inited) return; const r=R(); if(!r) return; W._inited=true; try{ r.ref('zoo_weather').on('value',s=>{ W.ovr=s.val()||null; }); }catch(e){} },
    // Zufälliges Wetter: alle 8 Minuten neu, bei allen Spielern gleich
    _auto(){ const slot=Math.floor(Date.now()/480000), g=rng(slot*7919+13), r=g(); return {type:r<.3?'clear':r<.6?'sun':r<.85?'rain':'storm',dir:g()*Math.PI*2,auto:1}; },
    calc(){ const o=W.ovr; W.cur=(o&&o.until>Date.now()&&TYPES[o.type])?{type:o.type,dir:+o.dir||0,ovr:1,until:o.until}:W._auto(); return W.cur; },
    on(){ try{ if(typeof ZG==='undefined'||!ZG.scene||!ZG.cam||!ZS.zoo) return false; if(typeof rebHas==='function'&&!rebHas('weather')&&!(W.ovr&&W.ovr.type==='storm'&&W.ovr.until>Date.now())) return false; if(ZG._jumpActive||ZG._arcadeActive||ZG._mazeActive||ZG._trashActive||ZG._iceRoomActive||ZG._meadowActive) return false; return true; }catch(e){ return false; } },
    adminSet(type,dirRad,mins){ const r=R(); if(!r) return Promise.reject(new Error('Keine Cloud')); if(!type){ return r.ref('zoo_weather').remove(); } return r.ref('zoo_weather').set({type,dir:(dirRad==null?Math.random()*Math.PI*2:dirRad),until:Date.now()+Math.max(1,mins||10)*60000,by:ZS.player,id:Date.now()}); },
    _mkUI(){
      if(W._ui) return; const d=document.createElement('div'); d.id='zw-ui';
      d.innerHTML='<div id="zw-tint" style="position:fixed;inset:0;pointer-events:none;z-index:2;opacity:0;transition:opacity 1.5s"></div><div id="zw-sun" style="position:fixed;top:-20px;right:-20px;font-size:7rem;pointer-events:none;z-index:2;opacity:0;transition:opacity 1.5s;filter:drop-shadow(0 0 30px rgba(255,220,80,.9))">☀️</div>'
        +'<div id="zw-chip" style="position:fixed;left:8px;top:70px;z-index:600;background:rgba(0,0,0,.55);color:#fff;font:700 .72rem Arial;padding:4px 9px;border-radius:14px;display:none;align-items:center;gap:6px;pointer-events:none"><span id="zw-t"></span></div>';
      (document.getElementById('s-zoo')||document.body).appendChild(d); W._ui=d;
    },
    _mkRain(){
      if(W._rain) return; const N=520, pos=new Float32Array(N*6), dr=[]; for(let i=0;i<N;i++) dr.push({x:(Math.random()-.5)*50,y:Math.random()*24,z:(Math.random()-.5)*50});
      const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); const m=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0xa9d0ff,transparent:true,opacity:.65})); m.frustumCulled=false; m.visible=false; ZG.scene.add(m); W._rain={m,g,dr,N};
    },
    // ⚡ Blitze: Warnkreis am Boden (1,2 s), dann Einschlag. Wer im Kreis steht: 3 Herzen Schaden + „BLITZ"
    _flash(op){ let f=document.getElementById('zw-bolt'); if(!f){ f=document.createElement('div'); f.id='zw-bolt'; f.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:105;background:#fff;opacity:0'; (document.getElementById('s-zoo')||document.body).appendChild(f); } f.style.transition='none'; f.style.opacity=op; setTimeout(()=>{ f.style.transition='opacity .5s'; f.style.opacity=0; },60); },
    _thunder(delay,vol){ setTimeout(()=>{ try{ const A=window.AudioContext||window.webkitAudioContext; if(!A) return; const c=W._ac=W._ac||new A(); const n=c.sampleRate*1.8, b=c.createBuffer(1,n,c.sampleRate), d=b.getChannelData(0); for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.2); const s=c.createBufferSource(); s.buffer=b; const lp=c.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=380; const g=c.createGain(); g.gain.value=vol; s.connect(lp); lp.connect(g); g.connect(c.destination); s.start(); }catch(e){} },delay); },
    _mkBolt(x,z){
      const g=new THREE.Group(), pts=[]; let px=x, pz=z; for(let i=0;i<=9;i++){ const y=36-i*4; pts.push(new THREE.Vector3(px,Math.max(0,y),pz)); px=x+(i<9?(Math.random()-.5)*5:0); pz=z+(i<9?(Math.random()-.5)*5:0); }
      for(let i=0;i<9;i++){ const a=pts[i], b=pts[i+1], len=a.distanceTo(b); [[.13,0xffffff,1],[.45,0xbfd8ff,.35]].forEach(([r,col,op])=>{ const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,5),new THREE.MeshBasicMaterial({color:col,transparent:op<1,opacity:op,depthWrite:false})); m.position.copy(a).add(b).multiplyScalar(.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize()); g.add(m); }); }
      const gl=new THREE.Mesh(new THREE.CircleGeometry(3.2,16),new THREE.MeshBasicMaterial({color:0xcfe4ff,transparent:true,opacity:.8,depthWrite:false})); gl.rotation.x=-Math.PI/2; gl.position.set(x,.1,z); g.add(gl); return g;
    },
    _strikeTick(dt){
      const now=performance.now(), p=ZG.pl;
      if(now>=W._nextStrike){ W._nextStrike=now+1100+Math.random()*2200;
        const near=Math.random()<.35, R=near?9:34, a=Math.random()*Math.PI*2, d=Math.sqrt(Math.random())*R; const x=p.x+Math.cos(a)*d, z=p.z+Math.sin(a)*d;
        const ring=new THREE.Mesh(new THREE.RingGeometry(1.7,2.5,24),new THREE.MeshBasicMaterial({color:0xfff176,transparent:true,opacity:.9,side:THREE.DoubleSide,depthWrite:false})); ring.rotation.x=-Math.PI/2; ring.position.set(x,.1,z); ZG.scene.add(ring);
        W._strikes.push({x,z,at:now+1200,ring,bolt:null,end:0}); }
      for(let i=W._strikes.length-1;i>=0;i--){ const s=W._strikes[i];
        if(!s.bolt){ s.ring.material.opacity=.45+.45*Math.abs(Math.sin(now/90)); s.ring.scale.setScalar(1+.12*Math.sin(now/110));
          if(now>=s.at){ ZG.scene.remove(s.ring); s.bolt=W._mkBolt(s.x,s.z); ZG.scene.add(s.bolt); s.end=now+380; const dist=Math.hypot(p.x-s.x,p.z-s.z); W._flash(Math.max(.2,.8-dist/60)); W._thunder(Math.min(1200,dist*18),Math.max(.15,.6-dist/80));
            if(dist<2.7&&!(typeof ZHearts!=='undefined'&&ZHearts.dead)){ try{ ZHearts.hit(3,{name:'Blitz',guard:true}); }catch(e){} try{ ZG._bigText('⚡ BLITZ!','#ffee58',2000); ZP.toast('⚡ BLITZ! −3 ❤',3500); }catch(e){} } } }
        else if(now>=s.end){ ZG.scene.remove(s.bolt); W._strikes.splice(i,1); } }
    },
    _clearStrikes(){ W._strikes.forEach(s=>{ try{ ZG.scene.remove(s.ring); if(s.bolt) ZG.scene.remove(s.bolt); }catch(e){} }); W._strikes=[]; },
    // 💦 Pfützen bei Regen/Sturm (für alle gleich, alle 8 Min neu verteilt). Landest du nach einem Sprung in einer Pfütze, spritzt es.
    _puddles(c,dt){
      const rain=(c.type==='rain'||c.type==='storm');
      if(!rain){ if(W._pg) W._pg.visible=false; W._pj=!!ZG._jumping; return; }
      if(!W._pg){ W._pg=new THREE.Group(); ZG.scene.add(W._pg); W._spl=[]; }
      const slot=Math.floor(Date.now()/480000);
      if(W._pslot!==slot){ W._pslot=slot; while(W._pg.children.length) W._pg.remove(W._pg.children[0]); const g=rng(slot*131+7), R=(ZG.WR||150)-12; W._pgl=[];
        for(let i=0;i<45;i++){ const a=g()*Math.PI*2, d=14+Math.sqrt(g())*(R-14), r=.9+g()*.9, x=Math.cos(a)*d, z=Math.sin(a)*d;
          const m=new THREE.Mesh(new THREE.CircleGeometry(1,18),new THREE.MeshBasicMaterial({color:0x5fa8e8,transparent:true,opacity:.55,depthWrite:false})); m.rotation.x=-Math.PI/2; m.position.set(x,.05,z); m.scale.setScalar(r); W._pg.add(m); W._pgl.push({x,z,r}); } }
      W._pg.visible=true;
      const j=!!ZG._jumping; if(W._pj&&!j){ const p=ZG.pl; (W._pgl||[]).forEach(q=>{ if(Math.hypot(p.x-q.x,p.z-q.z)<q.r+.5) W._splash(q.x,q.z,q.r); }); } W._pj=j;
      for(let i=(W._spl||[]).length-1;i>=0;i--){ const o=W._spl[i]; o.t+=dt; const a=o.m.geometry.attributes.position.array; for(let k=0;k<o.v.length;k++){ const v=o.v[k]; v[1]-=14*dt; a[k*3]+=v[0]*dt; a[k*3+1]=Math.max(.05,a[k*3+1]+v[1]*dt); a[k*3+2]+=v[2]*dt; } o.m.geometry.attributes.position.needsUpdate=true; o.m.material.opacity=Math.max(0,1-o.t/.9); if(o.t>.9){ ZG.scene.remove(o.m); W._spl.splice(i,1); } }
    },
    _splash(x,z,r){
      const N=22, geo=new THREE.BufferGeometry(), pos=new Float32Array(N*3), v=[]; for(let i=0;i<N;i++){ pos[i*3]=x; pos[i*3+1]=.2; pos[i*3+2]=z; const a=Math.random()*Math.PI*2, sp=1.2+Math.random()*2.2*(r||1); v.push([Math.cos(a)*sp,4+Math.random()*3.5,Math.sin(a)*sp]); }
      geo.setAttribute('position',new THREE.BufferAttribute(pos,3)); const m=new THREE.Points(geo,new THREE.PointsMaterial({color:0xbfe3ff,size:.35,transparent:true,depthWrite:false})); m.frustumCulled=false; ZG.scene.add(m); W._spl.push({m,v,t:0});
      W._pc=(W._pc||0)+1; try{ ZP.toast('💦 Platsch!'+(W._pc%5===0?' ('+W._pc+' Pfützen-Sprünge)':''),900); }catch(e){}
    },
    frame(dt){
      const c=W.cur, cam=ZG.cam.position, cx=cam.x, cz=cam.z;
      if((c.type==='rain'||c.type==='storm')&&W._rain){ const q=W._rain, a=q.g.attributes.position.array; q.m.visible=true;
        q.dr.forEach((p,i)=>{ p.y-=30*dt; if(p.y<0){ p.y=22+Math.random()*3; p.x=cx+(Math.random()-.5)*50; p.z=cz+(Math.random()-.5)*50; } if(p.x-cx>25)p.x-=50; if(p.x-cx<-25)p.x+=50; if(p.z-cz>25)p.z-=50; if(p.z-cz<-25)p.z+=50; const o=i*6; a[o]=p.x; a[o+1]=p.y; a[o+2]=p.z; a[o+3]=p.x; a[o+4]=p.y+.9; a[o+5]=p.z; }); q.g.attributes.position.needsUpdate=true; } else if(W._rain) W._rain.m.visible=false;
    },
    _step(){
      const now=performance.now(), dt=Math.min(.1,(now-(W._tt||now))/1000); W._tt=now;
      const ui=W._ui; if(!W.on()){ if(ui){ ui.querySelector('#zw-chip').style.display='none'; ui.querySelector('#zw-tint').style.opacity=0; ui.querySelector('#zw-sun').style.opacity=0; } if(W._rain) W._rain.m.visible=false; if(W._strikes.length) W._clearStrikes(); if(W._pg) W._pg.visible=false; return; }
      W.init(); W._mkUI(); W._mkRain(); const c=W.calc(), T=TYPES[c.type];
      const tint=W._ui.querySelector('#zw-tint'), sun=W._ui.querySelector('#zw-sun'), chip=W._ui.querySelector('#zw-chip');
      tint.style.background=c.type==='storm'?'radial-gradient(ellipse at 50% 38%,rgba(4,7,26,.68),rgba(0,2,12,.88))':c.type==='rain'?'rgba(35,50,85,.4)':c.type==='sun'?'radial-gradient(circle at 90% 0%,rgba(255,220,100,.28),rgba(255,200,80,.06) 60%)':'transparent'; tint.style.opacity=(c.type==='clear')?0:1;
      sun.style.opacity=c.type==='sun'?1:0; chip.style.display='flex'; W._ui.querySelector('#zw-t').textContent=T.ic+' '+T.n+(c.ovr?' (Admin)':'');
      W.frame(dt); W._puddles(c,dt);
      if(c.type==='storm') W._strikeTick(dt); else if(W._strikes.length) W._clearStrikes();
    }
  };
  setInterval(()=>{ try{ W._step(); }catch(e){} },33);
})();

;
/* ZHelp (v705) — 💬 sprechende Fehlermeldungen (Wartezeit-Schätzung) + 🎬 Mini-Tipp-Animation beim ersten Öffnen einer Funktion. */
(function(){
  'use strict';
  const TIPS={
    shop:{t:'Shop',s:['🪙','➜','🛒','➜','🐘'],d:'Hier gibst du Münzen (MT) aus: Tiere, Upgrades, Codes. Tippe auf etwas, um es zu kaufen!'},
    gond:{t:'Gondel',s:['🚡','➜','🎰','➜','🍀'],d:'Die Gondel schenkt dir neue Tiere. Mehr Glück = seltenere Tiere!'},
    trade:{t:'Tauschen',s:['🙂','⇄','🤝','⇄','🙂'],d:'Tausche Tiere mit anderen Spielern. Beide müssen zustimmen.'},
    reb:{t:'Rebirth',s:['🐘','➜','🔄','➜','✨'],d:'Du fängst von vorn an, bekommst aber mehr Einkommen und neue Funktionen.'},
    menu:{t:'Menü',s:['☰','➜','⚙️','➜','📖'],d:'Hier findest du Einstellungen, Profil und Hilfe.'},
    mtpass:{t:'MT-Pass',s:['⭐','➜','🎫','➜','🎁'],d:'Sammle XP und hole dir Belohnungen Stufe für Stufe.'},
    report:{t:'Melden',s:['🚩','➜','📝','➜','✅'],d:'Hier meldest du Spieler, die sich nicht fair verhalten.'},
    basebuild:{t:'Eigene Base bauen',s:['🌳','➜','🏗️','➜','🏡'],d:'Tippe aufs Feld, um Bäume, Deko und Schild zu setzen und deine 5 Gehege zu platzieren. Beim ersten Speichern zahlst du 50 % deines Guthabens – danach darfst du gratis umbauen.'},
    sound:{t:'Ton',s:['🔈','➜','🎚️','➜','🔊'],d:'Hier stellst du Musik und Geräusche ein.'}
  };
  const css=document.createElement('style'); css.textContent='@keyframes zhp-pop{0%{opacity:0;transform:scale(.2) translateY(14px)}60%{opacity:1;transform:scale(1.25)}100%{opacity:1;transform:scale(1)}}@keyframes zhp-fin{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}@keyframes zhp-in{from{opacity:0;transform:translateX(-50%) translateY(30px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}#zhp-tip span.zi{display:inline-block;opacity:0;animation:zhp-pop .5s forwards}';
  document.head.appendChild(css);
  const H=window.ZHelp={
    TIPS, _el:null, _t:0,
    seen(k){ try{ return !!(ZS.zoo&&ZS.zoo.tipsSeen&&ZS.zoo.tipsSeen[k]); }catch(e){ return true; } },
    tip(k,force){
      const T=TIPS[k]; if(!T||typeof ZS==='undefined'||!ZS.zoo) return; if(!force&&H.seen(k)) return;
      if(!force){ if(!ZS.zoo.tipsSeen) ZS.zoo.tipsSeen={}; ZS.zoo.tipsSeen[k]=1; try{ ZS.save&&ZS.save(); }catch(e){} }
      H.hide(); const el=document.createElement('div'); el.id='zhp-tip';
      el.style.cssText='position:fixed;left:50%;bottom:90px;transform:translateX(-50%);z-index:2147483000;background:rgba(14,12,34,.97);border:2px solid #ffd54f;border-radius:18px;padding:12px 16px;color:#fff;font-family:Arial,sans-serif;text-align:center;width:min(88vw,330px);box-shadow:0 8px 30px rgba(0,0,0,.6);animation:zhp-in .35s;cursor:pointer';
      el.innerHTML='<div style="font-weight:900;color:#ffd54f;font-size:.85rem">💡 Kurz erklärt: '+T.t+'</div><div style="font-size:2rem;margin:8px 0;white-space:nowrap">'+T.s.map((e,i)=>'<span class="zi" style="animation-delay:'+(.25+i*.5)+'s">'+e+'</span>').join(' ')+'</div><div style="font-size:.82rem;line-height:1.35">'+T.d+'</div><div style="font-size:.66rem;color:rgba(255,255,255,.5);margin-top:6px">Tippen zum Schliessen · wird nur einmal gezeigt</div>';
      el.onclick=H.hide; document.body.appendChild(el); H._el=el; clearTimeout(H._t); H._t=setTimeout(H.hide,8000);
    },
    hide(){ clearTimeout(H._t); if(H._el){ H._el.remove(); H._el=null; } }
  };
  // ── Tipps beim ersten Öffnen einhängen ──
  const hook=(obj,fn,key)=>{ try{ if(!obj||typeof obj[fn]!=='function'||obj[fn]._zh) return false; const o=obj[fn]; const w=function(){ const r=o.apply(this,arguments); try{ const k=typeof key==='function'?key.apply(null,arguments):key; if(k) setTimeout(()=>H.tip(k),350); }catch(e){} return r; }; w._zh=1; obj[fn]=w; return true; }catch(e){ return false; } };
  // ── Sprechende Fehlermeldungen ──
  let last=0, rate=0; const num=s=>{ const m=String(s).match(/([\d][\d'’.,]*)\s*([KMBTkmbt]|Mio|Mrd)?/); if(!m) return NaN; let t=m[1].replace(/['’]/g,''); if(/,\d{1,2}$/.test(t)) t=t.replace(',','.'); else t=t.replace(/[.,](?=\d{3})/g,''); let v=parseFloat(t); const u=(m[2]||'').toLowerCase(); v*=({k:1e3,m:1e6,mio:1e6,b:1e9,mrd:1e9,t:1e12}[u]||1); return v; };
  const bal=()=>{ try{ return (ZS.dsMT||0)+(ZS.zoo.mt||0); }catch(e){ return 0; } };
  const fmt=v=>{ try{ if(typeof $mt==='function') return $mt(v); }catch(e){} return Math.round(v).toLocaleString('de-CH'); };
  const dur=s=>{ if(s<10) return 'ein paar Sekunden'; if(s<90) return 'ca. '+Math.round(s)+' Sek.'; if(s<5400) return 'ca. '+Math.round(s/60)+' Min.'; if(s<172800) return 'ca. '+(s/3600).toFixed(1).replace('.',',')+' Std.'; return 'sehr, sehr lange 😅'; };
  const JOKES=['Deine Tiere arbeiten schon dran! 🐘','Geduld – der Löwe zählt noch die Münzen. 🦁','Tipp: Schau bei Codes, Events & Gondel vorbei! 🎁','Die Affen verhandeln noch den Preis. 🐒'];
  const hint=msg=>{
    try{
      if(!/^❌/.test(msg)||!/(Zu wenig|Nicht genug|brauch)/i.test(msg)||/Taler|XP|Speed|Rebirth|Wiedergeburt/i.test(msg)||msg.indexOf('\n')>=0) return msg;
      const m=msg.match(/[Bb]rauch\w*\s+(?:mindestens\s+)?([^!.\n]*)/); let cost=m?num(m[1]):NaN, add='';
      if(isFinite(cost)&&cost>0){ const miss=cost-bal(); if(miss>0){ add='\nEs fehlen noch '+fmt(miss); if(rate>0) add+=' – dein Zoo schafft das in '+dur(miss/rate); else add+=' MT'; add+='.'; } }
      if(!add){ add='\n'+JOKES[Math.floor(Math.random()*JOKES.length)]; if(rate>0) add+=' (Zoo verdient ~'+fmt(rate)+'/Sek.)'; }
      return msg+add;
    }catch(e){ return msg; }
  };
  let _hooked=false;
  setInterval(()=>{ try{
    if(typeof ZS==='undefined'||!ZS.zoo) return;
    const b=bal(), n=Date.now(); if(last){ const dt=(n-last.t)/1000, d=b-last.b; if(dt>0.5&&dt<5){ const r=Math.max(0,d)/dt; if(r>0) rate=rate?rate*.8+r*.2:r; } } last={t:n,b};
    if(_hooked) return;
    if(typeof ZP!=='undefined'&&ZP.open&&ZP.toast){
      hook(ZP,'open',p=>TIPS[p]?p:null);
      const ot=ZP.toast; if(!ot._zh){ const nt=function(m,ms){ const t=hint(m); return ot.call(this,t,t!==m?Math.max(ms||2500,3800):ms); }; nt._zh=1; ZP.toast=nt; }
      if(typeof MTPass!=='undefined') hook(MTPass,'open','mtpass');
      _hooked=true;
    }
  }catch(e){} },1000);
})();

;
/* ZTipp (v705) — ⚽ Tippspiel: VfB-Stuttgart-Spiele (OpenLigaDB), Tipp abgeben, bei richtigem Ergebnis +20 % des Guthabens. Tipps liegen in ZS.zoo.tips. */
(function(){
  'use strict';
  const CLUBS=[[65,'1. FC Köln'],[80,'1. FC Union Berlin'],[81,'1. FSV Mainz 05'],[6,'Bayer 04 Leverkusen'],[7,'Borussia Dortmund'],[87,'Borussia Mönchengladbach'],[91,'Eintracht Frankfurt'],[95,'FC Augsburg'],[40,'FC Bayern München'],[9,'FC Schalke 04'],[100,'Hamburger SV'],[1635,'RB Leipzig'],[112,'SC Freiburg'],[31,'SC Paderborn 07'],[198,'SV 07 Elversberg'],[134,'SV Werder Bremen'],[175,'TSG Hoffenheim'],[16,'VfB Stuttgart']];
  const fmt=v=>{ try{ if(typeof $mt==='function') return $mt(v); }catch(e){} return Math.round(v).toLocaleString('de-CH'); };
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const toast=(m,ms)=>{ try{ ZP.toast(m,ms||3000); }catch(e){} };
  const bal=()=>{ try{ return (ZS.dsMT||0)+(ZS.zoo.mt||0); }catch(e){ return 0; } };
  const T=window.ZTipp={
    clubs:CLUBS.map(c=>({id:c[0],name:c[1]})), games:[], err:null, at:0, el:null, sel:null, _iv:null, loading:false,
    // Lieblingsverein (ZS.zoo.favClub = {id,name})
    fav(){ try{ const f=ZS.zoo&&ZS.zoo.favClub; return (f&&f.id)?f:null; }catch(e){ return null; } },
    fid(){ const f=T.fav(); return f?f.id:16; }, fname(){ const f=T.fav(); return f?f.name:'VfB Stuttgart'; },
    setFav(id){ const c=T.clubs.find(x=>x.id===+id); if(!c||!ZS.zoo) return; ZS.zoo.favClub={id:c.id,name:c.name}; try{ ZS.save&&ZS.save(true); }catch(e){} T.games=[]; T.at=0; T.err=null; T.sel=null; T.pick=false; T.draw(); T.load(); },
    // Normalisiert ein Spiel: s = Tore des Lieblingsvereins, o = Gegner-Tore (links Lieblingsverein, rechts Gegner – egal ob Heim oder Auswärts)
    _norm(m){
      const home=m.team1&&m.team1.teamId===T.fid(), opp=home?m.team2:m.team1, ko=Date.parse(m.matchDateTimeUTC||m.matchDateTime||'')||0;
      let r1=null,r2=null; const res=(m.matchResults||[]).find(x=>x.resultTypeID===2)||null;
      if(res){ r1=res.pointsTeam1; r2=res.pointsTeam2; }
      else if(m.goals&&m.goals.length){ const g=m.goals[m.goals.length-1]; r1=g.scoreTeam1; r2=g.scoreTeam2; }
      const fin=!!m.matchIsFinished&&res!=null;
      return {id:String(m.matchID),ko,opp:(opp&&(opp.shortName||opp.teamName))||'Gegner',oppFull:(opp&&opp.teamName)||'',league:(m.leagueName||'').replace(/\s*\d{4}\/\d{4}/,''),home,fin,s:r1==null?null:(home?r1:r2),o:r1==null?null:(home?r2:r1),live:!fin&&ko<=Date.now()};
    },
    async load(){
      if(T.loading||!T.fav()) return; T.loading=true; const fid=T.fid();
      try{
        const r=await fetch('https://api.openligadb.de/getmatchesbyteamid/'+fid+'/2/6',{cache:'no-store'}); if(!r.ok) throw new Error('HTTP '+r.status);
        const a=await r.json(); const lim=Date.now()+35*86400000;
        if(fid!==T.fid()){ T.loading=false; return; } T.games=(a||[]).map(T._norm).filter(g=>g.ko&&(g.ko<lim)).sort((x,y)=>x.ko-y.ko); T.err=null; T.at=Date.now();
        T.settle(); T._autoAnim();
      }catch(e){ T.err=(e&&e.message)||'Fehler'; }
      T.loading=false; T.draw();
    },
    // ── 🎉 Sieges-Animation: Stuttgart schiesst ein Tor ──
    anim(s,o,opp,test,club){
      try{
        if(document.getElementById('ztipp-anim')) return;
        if(!document.getElementById('ztipp-css')){ const c=document.createElement('style'); c.id='ztipp-css'; c.textContent='@keyframes za-ball{0%{transform:translate(0,0) scale(1.6);opacity:1}55%{transform:translate(-8px,-150px) scale(1)}100%{transform:translate(18px,-250px) scale(.55)}}@keyframes za-keep{0%{transform:translateX(0)}35%{transform:translateX(0)}60%{transform:translateX(-62px) rotate(-35deg)}100%{transform:translateX(-62px) rotate(-35deg)}}@keyframes za-net{0%,52%{transform:scale(1)}58%{transform:scale(1.06,1.14)}66%{transform:scale(.97)}74%,100%{transform:scale(1)}}@keyframes za-txt{0%,55%{opacity:0;transform:scale(.2) rotate(-8deg)}70%{opacity:1;transform:scale(1.25) rotate(3deg)}85%,100%{opacity:1;transform:scale(1) rotate(-2deg)}}@keyframes za-fall{0%{transform:translateY(-40px) rotate(0);opacity:1}100%{transform:translateY(105vh) rotate(540deg);opacity:.9}}@keyframes za-fl{0%,53%{opacity:0}57%{opacity:.7}100%{opacity:0}}@keyframes za-out{to{opacity:0}}'; document.head.appendChild(c); }
        const el=document.createElement('div'); el.id='ztipp-anim';
        el.style.cssText='position:fixed;inset:0;z-index:2147482000;background:linear-gradient(#0b1d3a 0%,#123a1c 38%,#1f7a34 100%);overflow:hidden;font-family:Arial,sans-serif;cursor:pointer;animation:za-out .6s 5.4s forwards';
        let conf=''; const cs=['⚽','🔴','⚪','🎉','⭐','🔴','⚪']; for(let i=0;i<46;i++) conf+='<span style="position:absolute;top:-30px;left:'+Math.round(Math.random()*100)+'%;font-size:'+(14+Math.round(Math.random()*18))+'px;animation:za-fall '+(2.2+Math.random()*2.4).toFixed(2)+'s '+(2.6+Math.random()*1.6).toFixed(2)+'s linear forwards;opacity:0">'+cs[i%cs.length]+'</span>';
        el.innerHTML='<div style="position:absolute;inset:0;background:#fff;opacity:0;animation:za-fl 4s forwards"></div>'
          +'<div style="position:absolute;left:calc(50% - min(39vw,150px));top:15%;width:min(78vw,300px);height:130px;border:6px solid #fff;border-bottom:none;border-radius:6px 6px 0 0;background:repeating-linear-gradient(0deg,rgba(255,255,255,.35) 0 2px,transparent 2px 12px),repeating-linear-gradient(90deg,rgba(255,255,255,.35) 0 2px,transparent 2px 12px);animation:za-net 4s forwards;transform-origin:50% 100%"></div>'
          +'<div style="position:absolute;left:50%;top:calc(15% + 70px);margin-left:20px;font-size:42px;animation:za-keep 4s forwards">🧤</div>'
          +'<div style="position:absolute;left:50%;bottom:20%;margin-left:-20px;font-size:40px;animation:za-ball 1.9s .6s cubic-bezier(.3,.6,.5,1) forwards">⚽</div>'
          +'<div style="position:absolute;left:0;right:0;bottom:6%;text-align:center"><div style="display:inline-block;font-size:clamp(2.2rem,12vw,4rem);font-weight:900;color:#fff;text-shadow:0 0 0 #e32219,3px 3px 0 #e32219,-3px -3px 0 #e32219,3px -3px 0 #e32219,-3px 3px 0 #e32219,0 8px 24px rgba(0,0,0,.6);animation:za-txt 4s forwards;opacity:0">TOOOOR!</div><div style="margin-top:6px;font-size:1.05rem;font-weight:900;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.7);opacity:0;animation:za-txt 4s forwards">⚪🔴 '+esc(club||T.fname())+' '+(s==null?'':s+' : '+o+' ')+esc(opp||'')+(test?' · Test':'')+'</div></div>'+conf;
        el.onclick=()=>el.remove(); document.body.appendChild(el); setTimeout(()=>{ try{ el.remove(); }catch(e){} },6200); setTimeout(()=>T.song(),5500);
      }catch(e){}
    },
    // ── 🎼 Eigenes Siegeslied (original, ~2 Min, "Freizeitpark-Fanfare" in D-Dur, 96 BPM, 48 Takte) ──
    song(){
      try{
        if(T._song) return; const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return;
        const ctx=new AC(); if(ctx.state==='suspended') ctx.resume();
        const master=ctx.createGain(); master.gain.value=0; const warm=ctx.createBiquadFilter(); warm.type='lowpass'; warm.frequency.value=3200; warm.Q.value=.3; const comp=ctx.createDynamicsCompressor(); master.connect(warm); warm.connect(comp); comp.connect(ctx.destination);
        const t0=ctx.currentTime+0.2, BEAT=60/96, BAR=BEAT*4, TOTAL=48*BAR;
        master.gain.setValueAtTime(0,t0); master.gain.linearRampToValueAtTime(.55,t0+2.5); master.gain.setValueAtTime(.55,t0+TOTAL-6); master.gain.linearRampToValueAtTime(0,t0+TOTAL);
        const mf=m=>440*Math.pow(2,(m-69)/12);
        const nb=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate), nd=nb.getChannelData(0); for(let i=0;i<nd.length;i++) nd[i]=Math.random()*2-1;
        const env=(g,t,a,d,pk,end)=>{ g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(pk,t+a); g.gain.exponentialRampToValueAtTime(Math.max(.0002,end==null?.0002:end),t+d); };
        const tone=(type,m,t,dur,vol,opt)=>{ opt=opt||{}; const o=ctx.createOscillator(), g=ctx.createGain(); o.type=type; o.frequency.value=mf(m); if(opt.det) o.detune.value=opt.det; let n=o; if(opt.lp){ const f=ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=opt.lp; o.connect(f); n=f; }
          const a=opt.a==null?.02:opt.a; g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol,t+a); g.gain.setValueAtTime(vol,t+Math.max(a,dur-(opt.r||.12))); g.gain.linearRampToValueAtTime(0,t+dur);
          if(opt.vib){ const l=ctx.createOscillator(), lg=ctx.createGain(); l.frequency.value=5.2; lg.gain.value=opt.vib; l.connect(lg); lg.connect(o.detune); l.start(t); l.stop(t+dur+.05); }
          n.connect(g); g.connect(master); o.start(t); o.stop(t+dur+.05); };
        const pluck=(m,t,vol)=>{ const o=ctx.createOscillator(), g=ctx.createGain(); o.type='triangle'; o.frequency.value=mf(m); env(g,t,.005,.5,vol,.0005); o.connect(g); g.connect(master); o.start(t); o.stop(t+.55); };
        const timp=(t,vol)=>{ const o=ctx.createOscillator(), g=ctx.createGain(); o.type='sine'; o.frequency.setValueAtTime(110,t); o.frequency.exponentialRampToValueAtTime(52,t+.25); env(g,t,.004,.6,vol,.0005); o.connect(g); g.connect(master); o.start(t); o.stop(t+.65); };
        const snare=(t,vol)=>{ const s=ctx.createBufferSource(), g=ctx.createGain(), f=ctx.createBiquadFilter(); s.buffer=nb; f.type='bandpass'; f.frequency.value=1400; env(g,t,.004,.16,vol*.7,.0005); s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t+.16); };
        const cym=(t,vol)=>{ const s=ctx.createBufferSource(), g=ctx.createGain(), f=ctx.createBiquadFilter(); s.buffer=nb; f.type='bandpass'; f.frequency.value=2600; f.Q.value=.5; env(g,t,.05,1.8,vol*.5,.0005); s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t+1.7); };
        // Akkorde je Takt (Grundton-MIDI, Moll?) – D-Dur: D A Bm G
        const CH={D:[62,66,69],A:[57,61,64],Bm:[59,62,66],G:[55,59,62]}, ROOT={D:38,A:45,Bm:47,G:43};
        const prog=['D','A','Bm','G','D','A','G','A'], progB=['Bm','G','D','A','Bm','G','A','A'];
        const bars=[]; // [chord, section]
        for(let i=0;i<4;i++) bars.push([prog[i<2?0:i===2?2:3],'intro']);              // 0-3 Intro: D D Bm G
        for(let i=0;i<8;i++) bars.push([prog[i],'A']);                                  // 4-11
        for(let i=0;i<8;i++) bars.push([progB[i],'B']);                                 // 12-19
        ['Bm','G','Bm','G','A','A','A','A'].forEach(c=>bars.push([c,'build']));         // 20-27
        for(let i=0;i<8;i++) bars.push([prog[i],'A2']);                                 // 28-35
        for(let i=0;i<8;i++) bars.push([progB[i],'B2']);                                // 36-43
        ['G','A','D','D'].forEach(c=>bars.push([c,'end']));                             // 44-47
        const MA=[[[0,1.5,69],[1.5,.5,66],[2,1,69],[3,1,74]],[[0,1.5,73],[1.5,.5,69],[2,2,76]],[[0,1,74],[1,1,71],[2,2,78]],[[0,1.5,76],[1.5,.5,74],[2,1,71],[3,1,67]],[[0,1.5,69],[1.5,.5,66],[2,1,69],[3,1,74]],[[0,1.5,76],[1.5,.5,73],[2,1,69],[3,1,73]],[[0,1,71],[1,1,74],[2,2,79]],[[0,2,78],[2,1,76],[3,1,73]]];
        const MB=[[[0,1,78],[1,1,74],[2,1,71],[3,1,74]],[[0,1,79],[1,1,74],[2,2,71]],[[0,1,78],[1,1,74],[2,1,69],[3,1,74]],[[0,2,76],[2,2,73]],[[0,1,78],[1,1,81],[2,1,78],[3,1,74]],[[0,2,79],[2,1,76],[3,1,74]],[[0,1.5,73],[1.5,.5,76],[2,2,81]],[[0,4,81]]];
        bars.forEach((b,i)=>{
          const t=t0+i*BAR, c=b[0], sec=b[1], ch=CH[c], big=(sec==='A2'||sec==='B2'||sec==='end'), mid=(sec!=='intro');
          // Streicher-Teppich
          ch.forEach(m=>{ tone('sawtooth',m,t,BAR,big?.034:.026,{a:.6,r:.6,lp:big?1100:800,det:-5,vib:2}); tone('triangle',m+12,t,BAR,big?.045:.03,{a:.7,r:.6,det:6}); });
          // Bass
          tone('triangle',ROOT[c],t,BEAT*1.9,.2,{a:.02,r:.2}); if(sec!=='intro'&&sec!=='end') tone('triangle',ROOT[c],t+BEAT*2,BEAT*1.9,.17,{a:.02,r:.2});
          // Harfe (Arpeggio)
          if(sec==='intro'||sec==='A'||sec==='B'||sec==='build'){ for(let k=0;k<8;k++){ const m=ch[k%3]+12*(k>=3&&k<6?1:k>=6?1:0)+(sec==='build'&&i>=24?12:0); pluck(m,t+k*BEAT/2,.075); } }
          if(sec==='A'||sec==='A2'||sec==='B2'){ for(let k=1;k<4;k+=2){ ch.forEach(m=>tone('triangle',m,t+k*BEAT,BEAT*.28,.045,{a:.005,r:.12})); } }
          // Pauke / Becken / Snare
          if(sec==='intro'){ timp(t,.3); if(i===3){ for(let k=0;k<8;k++) timp(t+k*BEAT/2,.08+.05*k); cym(t+BAR-.01,.1); } }
          if(sec==='A'||sec==='B') timp(t,.22);
          if(sec==='build'){ timp(t,.28); timp(t+BEAT*2,.22); const stp=BAR/(i<24?4:i<26?8:16); for(let tt=0;tt<BAR-.001;tt+=stp) snare(t+tt,.03+.12*((i-20)/8)+(tt/BAR)*.05); if(i===27) cym(t+BAR-.02,.12); }
          if(big){ timp(t,.34); timp(t+BEAT*2,.28); if(sec!=='end'){ snare(t+BEAT,.08); snare(t+BEAT*3,.1); timp(t+BEAT*2.5,.2); } if(i%2===0||sec==='end') cym(t,.07); }
          if(sec==='end'&&i===47){ cym(t,.2); ch.forEach(m=>tone('sawtooth',m,t,BAR*1.0,.05,{a:.05,r:1.2,lp:1100})); }
          // Melodie
          const mel=sec==='A'?MA[i-4]:sec==='A2'?MA[i-28]:sec==='B'?MB[i-12]:sec==='B2'?MB[i-36]:null;
          if(mel) mel.forEach(n=>{ const st=t+n[0]*BEAT, du=n[1]*BEAT, p=n[2]>77?n[2]-12:n[2]; if(sec==='A'||sec==='B'){ tone('sine',p,st,du*.98,.2,{a:.04,r:.15,vib:5}); tone('triangle',p,st,du*.98,.09,{a:.04,r:.15,vib:5}); } else { tone('sawtooth',p,st,du*.98,.05,{a:.05,r:.15,lp:1000,vib:5}); tone('triangle',p,st,du*.98,.13,{a:.04,r:.15,vib:5}); tone('sine',p-12,st,du*.98,.1,{a:.05,r:.15}); tone('sine',p+12,st,Math.min(du*.98,.5),.022,{a:.01,r:.3}); } });
          if(sec==='end'){ const E=[[0,2,74],[2,2,78]],E2=[[0,2,76],[2,2,79-12]],E3=[[0,1,74],[1,1,66],[2,2,69]],E4=[[0,4,74]]; ((i===44?E:i===45?E2:i===46?E3:E4)).forEach(n=>{ tone('triangle',n[2],t+n[0]*BEAT,n[1]*BEAT*.98,.14,{a:.04,r:.3,vib:5}); tone('sawtooth',n[2],t+n[0]*BEAT,n[1]*BEAT*.98,.04,{a:.06,r:.3,lp:1000}); }); }
          if(sec==='build'){ // ansteigende Linie
            const up=[62,64,66,67,69,71,73,74]; tone('triangle',up[i-20],t,BAR,.12,{a:.2,r:.3,vib:4}); }
        });
        T._song={ctx,master,end:Date.now()+TOTAL*1000+500};
        // Stopp-Knopf
        const b=document.createElement('button'); b.id='ztipp-song'; b.textContent='🎼 Lied stoppen';
        b.style.cssText='position:fixed;right:8px;top:112px;z-index:2147481000;background:rgba(227,34,25,.92);color:#fff;border:none;border-radius:18px;padding:7px 13px;font:800 .75rem Arial;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.5)';
        b.onclick=()=>T.songStop(); document.body.appendChild(b);
        T._songT=setTimeout(()=>T.songStop(),TOTAL*1000+800);
      }catch(e){ try{ console.warn('ZTipp song',e); }catch(_){} }
    },
    songStop(){ try{ clearTimeout(T._songT); const s=T._song; T._song=null; const b=document.getElementById('ztipp-song'); if(b) b.remove(); if(s){ s.master.gain.cancelScheduledValues(s.ctx.currentTime); s.master.gain.setValueAtTime(s.master.gain.value,s.ctx.currentTime); s.master.gain.linearRampToValueAtTime(0,s.ctx.currentTime+.6); setTimeout(()=>{ try{ s.ctx.close(); }catch(e){} },900); } }catch(e){} },
    _autoAnim(){
      try{
        const sn=(ZS.zoo.tippAnim=ZS.zoo.tippAnim||{}); const first=!Object.keys(sn).length&&!ZS.zoo._tippInit; let play=null, ch=false;
        T.games.forEach(g=>{ if(!g.fin||g.s==null||sn[g.id]) return; sn[g.id]=1; ch=true; if(g.s>g.o&&g.ko>Date.now()-12*3600000&&!first) play=g; });
        ZS.zoo._tippInit=1; if(ch){ try{ ZS.save&&ZS.save(); }catch(e){} }
        if(play) T.anim(play.s,play.o,play.opp,false,T.fname());
      }catch(e){}
    },
    tips(){ try{ if(!ZS.zoo.tips) ZS.zoo.tips={}; return ZS.zoo.tips; }catch(e){ return {}; } },
    // Abgepfiffene Spiele auswerten → 20 % des Guthabens bei richtigem Tipp (einmalig)
    settle(){
      try{
        const tp=T.tips(); let win=0, rw=0;
        T.games.forEach(g=>{ const t=tp[g.id]; if(!t||t.paid||!g.fin||g.s==null) return; t.paid=1;
          if(t.t<g.ko&&t.h===g.s&&t.a===g.o){ const add=Math.floor(bal()*0.2); ZS.zoo.mt=(ZS.zoo.mt||0)+add; t.won=1; t.rw=add; win++; rw+=add; } else t.won=0; });
        if(win||Object.keys(tp).length){ try{ ZS.save&&ZS.save(true); }catch(e){} }
        if(win){ toast('⚽ RICHTIG GETIPPT! +'+fmt(rw)+' MT (20 % deines Guthabens)',6000); try{ ZG._bigText('⚽ TIPP RICHTIG!','#7dffb0',3000); ZG._updHUD&&ZG._updHUD(); }catch(e){} }
      }catch(e){}
    },
    open(){
      if(T.el){ T.close(); return; } if(typeof ZS==='undefined'||!ZS.zoo) return;
      const el=document.createElement('div'); el.id='ztipp';
      el.style.cssText='position:fixed;inset:0;z-index:99991;background:rgba(10,14,24,.98);color:#fff;font-family:Arial,sans-serif;overflow-y:auto;-webkit-overflow-scrolling:touch';
      document.body.appendChild(el); T.el=el; T.sel=null; T.draw(); T.load();
      clearInterval(T._iv); T._iv=setInterval(()=>{ if(T.el) T.load(); },30000); // lädt sich selbst neu
      try{ if(typeof ZHelp!=='undefined') setTimeout(()=>ZHelp.tip('tipp'),400); }catch(e){}
    },
    close(){ clearInterval(T._iv); if(T.el){ T.el.remove(); T.el=null; } },
    _when(ko){ try{ return new Date(ko).toLocaleString('de-CH',{weekday:'short',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Zurich'}); }catch(e){ return new Date(ko).toLocaleString(); } },
    draw(){
      const el=T.el; if(!el) return; const tp=T.tips(); const g=T.sel&&T.games.find(x=>x.id===T.sel);
      let h='<div style="max-width:440px;margin:0 auto;padding:12px 12px 40px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><div style="flex:1;font-weight:900;color:#ff6b6b;font-size:1.05rem">⚽ Tippspiel'+(T.fav()?' · '+esc(T.fname()):'')+'</div><button id="zt-x" style="background:rgba(255,255,255,.12);border:none;color:#fff;border-radius:50%;width:34px;height:34px;font-size:1rem;cursor:pointer">✕</button></div>';
      if(!T.fav()||T.pick){
        h+='<div style="font-size:.85rem;margin:2px 0 10px">'+(T.fav()?'Wähle deinen neuen Lieblingsverein:':'<b>Wähle deinen Lieblingsverein!</b><br><span style="font-size:.74rem;color:rgba(255,255,255,.6)">Danach siehst du alle seine Spiele und kannst tippen.</span>')+'</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:7px">'+T.clubs.map(c=>'<button data-club="'+c.id+'" style="padding:11px 8px;border-radius:11px;border:2px solid '+((T.fav()&&T.fav().id===c.id)?'#7dffb0':'rgba(255,255,255,.18)')+';background:rgba(255,255,255,.07);color:#fff;font-weight:800;font-size:.78rem;cursor:pointer">'+esc(c.name)+'</button>').join('')+'</div>'+(T.fav()?'<button id="zt-pc" style="margin-top:10px;background:rgba(255,255,255,.1);border:none;color:#fff;border-radius:8px;padding:7px 12px;cursor:pointer">Abbrechen</button>':'')+'</div>';
        el.innerHTML=h; el.querySelector('#zt-x').onclick=T.close; el.querySelectorAll('[data-club]').forEach(b=>b.onclick=()=>T.setFav(b.dataset.club)); const pc=el.querySelector('#zt-pc'); if(pc) pc.onclick=()=>{ T.pick=false; T.draw(); }; return;
      }
      if(g){
        const t=tp[g.id], can=g.ko>Date.now()&&!g.fin;
        h+='<button id="zt-back" style="background:rgba(255,255,255,.1);border:none;color:#fff;border-radius:8px;padding:6px 12px;cursor:pointer;margin-bottom:8px">← Alle Spiele</button>'
          +'<div style="text-align:center;font-size:.78rem;color:rgba(255,255,255,.6)">'+esc(g.league)+' · '+T._when(g.ko)+' · '+(g.home?'Heim':'Auswärts')+'</div>'
          +'<div style="display:flex;align-items:center;justify-content:center;gap:10px;margin:14px 0"><div style="flex:1;text-align:center"><div style="font-weight:900;font-size:.95rem">'+esc(T.fname())+'</div><input id="zt-h" type="number" min="0" max="20" inputmode="numeric" value="'+(t?t.h:0)+'" '+(can?'':'disabled')+' style="width:74px;margin-top:8px;padding:12px 4px;font-size:1.6rem;font-weight:900;text-align:center;border-radius:12px;border:2px solid #ff6b6b;background:#161c2c;color:#fff"></div><div style="font-size:1.6rem;font-weight:900">:</div><div style="flex:1;text-align:center"><div style="font-weight:900;font-size:.95rem">'+esc(g.opp)+'</div><input id="zt-a" type="number" min="0" max="20" inputmode="numeric" value="'+(t?t.a:0)+'" '+(can?'':'disabled')+' style="width:74px;margin-top:8px;padding:12px 4px;font-size:1.6rem;font-weight:900;text-align:center;border-radius:12px;border:2px solid #64b5f6;background:#161c2c;color:#fff"></div></div>';
        if(can) h+='<button id="zt-go" style="display:block;width:100%;padding:12px;border-radius:12px;border:none;background:#ff6b6b;color:#fff;font-weight:900;font-size:1rem;cursor:pointer">'+(t?'Tipp ändern':'Tipp abgeben')+'</button><div style="font-size:.7rem;color:rgba(255,255,255,.55);text-align:center;margin-top:6px">Du kannst bis zum Anpfiff ändern. Richtiges Ergebnis = 20 % deines Guthabens.</div>';
        else h+='<div style="text-align:center;font-weight:800;margin-top:6px">'+(g.fin?'Endstand ':'🔴 läuft · Stand ')+(g.s==null?'?':g.s+' : '+g.o)+'</div>'+(t?'<div style="text-align:center;margin-top:8px">Dein Tipp: <b>'+t.h+' : '+t.a+'</b> '+(t.paid?(t.won?'✅ richtig! +'+fmt(t.rw||0):'❌ leider falsch'):'· wird nach dem Abpfiff ausgewertet')+'</div>':'<div style="text-align:center;margin-top:8px;color:rgba(255,255,255,.55)">Du hast nicht getippt.</div>');
      } else {
        h+='<div style="font-size:.74rem;color:rgba(255,255,255,.6);margin-bottom:8px">Tippe auf ein Spiel und gib dein Ergebnis ein (links '+esc(T.fname())+', rechts Gegner). Nach dem Abpfiff gewinnst du bei richtigem Tipp 20 % deines Guthabens. <a id="zt-ch" style="color:#64b5f6;text-decoration:underline;cursor:pointer">Verein wechseln</a></div>';
        if(T.err&&!T.games.length) h+='<div style="padding:14px;border-radius:10px;background:rgba(255,80,80,.15);font-size:.8rem">❌ Spielplan konnte nicht geladen werden ('+esc(T.err)+'). Prüfe deine Verbindung – es versucht es alle 30 Sek. neu.</div>';
        else if(!T.games.length) h+='<div style="padding:14px;text-align:center;color:rgba(255,255,255,.6)">'+(T.at?'Keine Spiele im nächsten Monat gefunden.':'Lade Spielplan …')+'</div>';
        h+=T.games.map(x=>{ const t=tp[x.id]; const st=x.fin?('Endstand '+x.s+':'+x.o):x.live?'🔴 läuft '+(x.s==null?'':x.s+':'+x.o):'';
          const badge=t?('<span style="font-size:.7rem;background:rgba(125,255,176,.18);border:1px solid #7dffb0;border-radius:8px;padding:2px 7px">'+(t.paid?(t.won?'✅ ':'❌ '):'')+'Tipp '+t.h+':'+t.a+'</span>'):'<span style="font-size:.7rem;color:rgba(255,255,255,.45)">kein Tipp</span>';
          return '<div data-g="'+x.id+'" style="padding:11px 12px;margin:7px 0;border-radius:12px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);cursor:pointer"><div style="font-size:.7rem;color:rgba(255,255,255,.55)">'+T._when(x.ko)+' · '+esc(x.league)+'</div><div style="font-weight:900;margin:3px 0">'+esc(T.fname())+' – '+esc(x.oppFull||x.opp)+'</div><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:.78rem;color:#ffd54f">'+st+'</span>'+badge+'</div></div>'; }).join('');
      }
      el.innerHTML=h+'</div>';
      const q=id=>el.querySelector(id); q('#zt-x').onclick=T.close;
      const chg=el.querySelector('#zt-ch'); if(chg) chg.onclick=()=>{ T.pick=true; T.draw(); };
      el.querySelectorAll('[data-g]').forEach(d=>d.onclick=()=>{ T.sel=d.dataset.g; const gg=T.games.find(x=>x.id===T.sel); if(gg&&gg.fin&&gg.s!=null&&gg.s>gg.o) T.anim(gg.s,gg.o,gg.opp,false,T.fname()); T.draw(); });
      if(g){ q('#zt-back').onclick=()=>{ T.sel=null; T.draw(); };
        const go=q('#zt-go'); if(go) go.onclick=()=>{ if(g.ko<=Date.now()){ toast('⏱️ Das Spiel hat schon begonnen.'); T.draw(); return; } const hh=Math.max(0,Math.min(20,Math.floor(+q('#zt-h').value||0))), aa=Math.max(0,Math.min(20,Math.floor(+q('#zt-a').value||0))); const tp=T.tips(); tp[g.id]={h:hh,a:aa,t:Date.now()}; try{ ZS.save&&ZS.save(true); }catch(e){} toast('✅ Tipp gespeichert: '+T.fname()+' '+hh+' : '+aa+' '+g.opp,3000); T.sel=null; T.draw(); }; }
    }
  };
  // Im Hintergrund auswerten, solange offene Tipps existieren
  setInterval(()=>{ try{ if(typeof ZS==='undefined'||!ZS.zoo||!T.fav()) return; const tp=ZS.zoo.tips||{}; const g=T.games, near=g.some(x=>!x.fin&&x.ko<Date.now()+600000&&x.ko>Date.now()-5*3600000); const wait=(Object.keys(tp).some(k=>!tp[k].paid)||near)?180000:(T.at?1800000:0); if(Date.now()-T.at>wait) T.load(); }catch(e){} },30000);
  try{ if(window.ZHelp) ZHelp.TIPS.tipp={t:'Tippspiel',s:['⚽','➜','🔢','➜','💰'],d:'Wähle deinen Lieblingsverein und tippe seine Spiele (links dein Verein, rechts Gegner). Stimmt es nach dem Abpfiff, bekommst du 20 % deines Guthabens!'}; }catch(e){}
})();

;
/* ZFun (v705) — 🧑 Besucher-Wünsche (ab Rebirth 3) + 🎪 Wanderzirkus (alle, automatisch alle 3 Std. 10 Min + Admin-Start). */
(function(){
  'use strict';
  const RT=()=>{ try{ return (typeof _rtdb!=='undefined'&&_rtdb)?_rtdb:null; }catch(e){ return null; } };
  let _off=0; const tn=()=>Date.now()+_off;
  const toast=(m,ms)=>{ try{ ZP.toast(m,ms||3000); }catch(e){} };
  const big=(t,c,ms)=>{ try{ ZG._bigText(t,c||'#fff',ms||2500); }catch(e){} };
  const bal=()=>{ try{ return (ZS.dsMT||0)+(ZS.zoo.mt||0); }catch(e){ return 0; } };
  const fmt=v=>{ try{ if(typeof $mt==='function') return $mt(v); }catch(e){} return Math.round(v).toLocaleString('de-CH'); };
  const ready=()=>{ try{ return !!(typeof ZG!=='undefined'&&ZG.scene&&ZG.pl&&typeof ZS!=='undefined'&&ZS.zoo&&ZS.player&&typeof THREE!=='undefined'); }catch(e){ return false; } };
  const busy=()=>{ try{ return !!(ZG._arcadeActive||ZG._jumpActive||ZG._mazeActive||ZG._trashActive||ZG._iceRoomActive||ZG._meadowActive); }catch(e){ return false; } };
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const boost=(type,mult,mins)=>{ const z=ZS.zoo, now=Date.now(); if(!z.mtPassBoosts) z.mtPassBoosts={}; const cur=z.mtPassBoosts[type], base=(cur&&cur.until>now)?cur.until:now; z.mtPassBoosts[type]={mult:Math.max(mult,(cur&&cur.until>now)?cur.mult:0),until:base+mins*60000}; };
  const giveMT=n=>{ const z=ZS.zoo; z.mt=(z.mt||0)+Math.round(n); };
  const save=()=>{ try{ ZS.save&&ZS.save(true); ZG._updHUD&&ZG._updHUD(); }catch(e){} };
  const spr=(draw,w,h,sx,sy)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h); const tex=new THREE.CanvasTexture(c); const m=new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false}); const s=new THREE.Sprite(m); s.scale.set(sx,sy,1); return s; };
  const rrect=(x,a,b,w,h,r)=>{ x.beginPath(); x.moveTo(a+r,b); x.arcTo(a+w,b,a+w,b+h,r); x.arcTo(a+w,b+h,a,b+h,r); x.arcTo(a,b+h,a,b,r); x.arcTo(a,b,a+w,b,r); x.closePath(); };
  const chip=(id,top)=>{ let c=document.getElementById(id); if(!c){ c=document.createElement('div'); c.id=id; c.style.cssText='position:fixed;left:8px;top:'+top+'px;z-index:600;background:rgba(0,0,0,.62);color:#fff;font:800 .72rem Arial;padding:5px 10px;border-radius:14px;display:none;cursor:pointer'; document.body.appendChild(c); } return c; };
  const arrow=(tx,tz)=>{ try{ const dx=tx-ZG.pl.x, dz=tz-ZG.pl.z, d=Math.hypot(dx,dz), y=ZG.yaw||0; const f=-(Math.sin(y)*dx)-(Math.cos(y)*dz), r=(Math.cos(y)*dx)-(Math.sin(y)*dz); const a=Math.atan2(r,f); const i=Math.round(a/(Math.PI/4)); const A=['⬆️','↗️','➡️','↘️','⬇️','↙️','⬅️','↖️'][((i%8)+8)%8]; return {d,A}; }catch(e){ return {d:999,A:'⬆️'}; } };

  // ═════════════ 🧑 Besucher-Wünsche ═════════════
  const WISHER=['🧑','👩','👨','🧒','👵','👴','🧔'];
  const Wi=window.ZWish={
    w:null, nextAt:0, sp:null,
    _animals(){ try{ return (typeof ANIMALS!=='undefined')?ANIMALS:[]; }catch(e){ return []; } },
    _owned(id){ try{ return (ZS.zoo.enc||[]).some(e=>e&&e.animal&&e.animal.id===id); }catch(e){ return false; } },
    _pick(){
      const A=Wi._animals(), z=ZS.zoo, own=[]; (z.enc||[]).forEach(e=>{ if(e&&e.animal&&e.animal.id&&!own.find(a=>a.id===e.animal.id)) own.push(e.animal); });
      const rare=A.filter(a=>(a.r==='rare'||a.r==='epic')&&a.e);
      if(Math.random()<.3&&rare.length){ const a=rare[Math.floor(Math.random()*rare.length)]; return {a,rare:1}; }
      if(own.length){ const a=own[Math.floor(Math.random()*own.length)]; return {a,rare:0}; }
      if(rare.length){ const a=rare[Math.floor(Math.random()*rare.length)]; return {a,rare:1}; }
      return null;
    },
    spawn(){
      const p=Wi._pick(); if(!p) { Wi.nextAt=Date.now()+60000; return; }
      const ang=Math.random()*Math.PI*2, d=7+Math.random()*6, x=ZG.pl.x+Math.cos(ang)*d, z=ZG.pl.z+Math.sin(ang)*d;
      const who=WISHER[Math.floor(Math.random()*WISHER.length)], a=p.a;
      const s=spr((c,w,h)=>{ c.clearRect(0,0,w,h); c.fillStyle='rgba(255,255,255,.97)'; rrect(c,8,6,w-16,150,26); c.fill(); c.strokeStyle=p.rare?'#ff9800':'#7dffb0'; c.lineWidth=7; c.stroke(); c.beginPath(); c.moveTo(w/2-16,156); c.lineTo(w/2,184); c.lineTo(w/2+16,156); c.closePath(); c.fillStyle='rgba(255,255,255,.97)'; c.fill();
        c.fillStyle='#222'; c.textAlign='center'; c.font='bold 26px Arial'; c.fillText(p.rare?'Ich suche etwas Seltenes!':'Ich wünsche mir …',w/2,40); c.font='64px Arial'; c.fillText(a.e,w/2,112); c.font='bold 28px Arial'; c.fillText(a.n,w/2,146); c.font='110px Arial'; c.fillText(who,w/2,310); },256,330,2.4,3.1);
      s.position.set(x,1.55,z); ZG.scene.add(s);
      Wi.w={id:String(Date.now()),a:{id:a.id,n:a.n,e:a.e,r:a.r},rare:p.rare,x,z,until:Date.now()+(p.rare?6:3)*60000}; Wi.sp=s;
      toast('🧑 Ein Besucher hat einen Wunsch: '+a.e+' '+a.n+'!',3500); try{ if(typeof ZHelp!=='undefined') ZHelp.tip('wish'); }catch(e){}
    },
    clear(){ try{ if(Wi.sp){ ZG.scene.remove(Wi.sp); Wi.sp.material.map.dispose(); Wi.sp.material.dispose(); } }catch(e){} Wi.sp=null; Wi.w=null; const c=document.getElementById('zwish-chip'); if(c) c.style.display='none'; const b=document.getElementById('zwish-btn'); if(b) b.style.display='none'; Wi.nextAt=Date.now()+(90+Math.random()*90)*1000; },
    fulfil(){
      const w=Wi.w; if(!w) return; if(!Wi._owned(w.a.id)){ toast('Du hast noch kein '+w.a.e+' '+w.a.n+'! Hol dir eins (z. B. in der Gondel).',3800); return; }
      const r=Math.random(), base=Math.max(50,bal()*(w.rare?.03:.01)); let msg;
      if(r<.6){ giveMT(base); msg='+'+fmt(base)+' MT Trinkgeld'; }
      else if(r<.8){ boost('luck',w.rare?3:2,3); msg='🍀 Glück ×'+(w.rare?3:2)+' für 3 Min'; }
      else if(r<.93){ boost('money',w.rare?3:2,3); msg='💰 Geld ×'+(w.rare?3:2)+' für 3 Min'; }
      else { giveMT(base*3); msg='🎉 Jackpot! +'+fmt(base*3)+' MT'; }
      ZS.zoo.wishDone=(ZS.zoo.wishDone||0)+1; save(); toast('🧑 „Danke!“ '+msg,5000); big('🎁 WUNSCH ERFÜLLT!','#7dffb0',2200);
      try{ const old=document.getElementById('zwish-got'); if(old) old.remove(); const d=document.createElement('div'); d.id='zwish-got'; d.style.cssText='position:fixed;left:50%;top:38%;transform:translate(-50%,0) scale(.8);z-index:2147482000;background:rgba(14,30,20,.97);border:2px solid #7dffb0;border-radius:18px;padding:14px 20px;color:#fff;font-family:Arial,sans-serif;text-align:center;width:min(78vw,300px);box-shadow:0 8px 30px rgba(0,0,0,.6);opacity:0;transition:all .3s'; d.innerHTML='<div style="font-size:2.2rem">'+w.a.e+' 🧑 🎁</div><div style="font-weight:900;color:#7dffb0;margin:4px 0">Wunsch erfüllt!</div><div style="font-size:.78rem;color:rgba(255,255,255,.7)">Der Besucher bedankt sich und schenkt dir:</div><div style="font-weight:900;font-size:1.05rem;margin-top:5px;color:#ffd54f">'+msg+'</div>'; document.body.appendChild(d); requestAnimationFrame(()=>{ d.style.opacity='1'; d.style.transform='translate(-50%,0) scale(1)'; }); d.onclick=()=>d.remove(); setTimeout(()=>{ d.style.opacity='0'; setTimeout(()=>d.remove(),400); },5200); }catch(e){}
      Wi.clear();
    },
    tick(){
      try{
        if(!ready()||typeof rebHas!=='function'||!rebHas('wish')){ if(Wi.w) Wi.clear(); return; }
        if(busy()){ return; }
        if(!Wi.w){ if(!Wi.nextAt) Wi.nextAt=Date.now()+25000; if(Date.now()>=Wi.nextAt) Wi.spawn(); return; }
        const w=Wi.w, left=w.until-Date.now(); if(left<=0){ toast('🧑 Der Besucher ist weitergegangen …',2500); Wi.clear(); return; }
        const ar=arrow(w.x,w.z), c=chip('zwish-chip',154), own=Wi._owned(w.a.id); c.style.display='block'; c.style.borderLeft='4px solid '+(w.rare?'#ff9800':'#7dffb0');
        c.textContent='🧑 Wunsch: '+w.a.e+' '+w.a.n+(own?' ✅':' ❌ fehlt')+' · '+Math.floor(left/60000)+':'+String(Math.floor(left/1000)%60).padStart(2,'0')+' · '+ar.A+' '+Math.round(ar.d)+' m';
        c.onclick=()=>{ if(ar.d<=5) Wi.fulfil(); else toast('Lauf zum Besucher: '+ar.A+' '+Math.round(ar.d)+' m',2200); };
        let b=document.getElementById('zwish-btn'); if(!b){ b=document.createElement('button'); b.id='zwish-btn'; b.style.cssText='position:fixed;left:50%;bottom:150px;transform:translateX(-50%);z-index:620;background:#2ecc71;color:#fff;border:none;border-radius:22px;padding:11px 20px;font:900 .95rem Arial;box-shadow:0 4px 16px rgba(0,0,0,.5);display:none;cursor:pointer'; b.onclick=()=>Wi.fulfil(); document.body.appendChild(b); }
        if(ar.d<=5){ b.style.display='block'; b.textContent='🎁 '+w.a.e+' '+w.a.n+' zeigen'; } else b.style.display='none';
      }catch(e){}
    }
  };
  setInterval(Wi.tick,1000);

  // ═════════════ 🎪 Wanderzirkus ═════════════
  const CX=40, CZ=48, PER=3*3600000, DUR=10*60000;
  const C=window.ZCircus={
    adm:null, grp:null, ann:null, id:null, until:0, ui:null, _t:0, _loop:false,
    _inited:false,
    init(){ if(C._inited) return; const r=RT(); if(!r) return; C._inited=true; try{ r.ref('.info/serverTimeOffset').on('value',s=>{ _off=+s.val()||0; }); }catch(e){} try{ r.ref('zoo_circus').on('value',s=>{ C.adm=s.val()||null; }); }catch(e){} },
    // aktiv? → {id,until}
    state(){ const n=tn(), a=C.adm; if(a&&a.until>n) return {id:'a'+a.id,until:a.until,adm:1};
      const ph=n%PER; if(ph<DUR) return {id:'t'+Math.floor(n/PER),until:n-ph+DUR}; return null; },
    adminStart(mins){ const r=RT(); if(!r){ toast('❌ Keine Verbindung'); return; } mins=Math.max(1,Math.min(120,+mins||10)); r.ref('zoo_circus').set({id:String(Date.now()),until:tn()+mins*60000,by:ZS.player}).then(()=>toast('🎪 Wanderzirkus für alle gestartet ('+mins+' Min)')).catch(e=>toast('❌ '+e.message)); },
    adminStop(){ const r=RT(); if(!r) return; r.ref('zoo_circus').set({id:String(Date.now()),until:0,by:ZS.player}).then(()=>toast('⏹️ Zirkus beendet (der automatische Zirkus-Termin bleibt)')); },
    _build(){
      if(C.grp) return; const g=new THREE.Group(); g.position.set(CX,0,CZ);
      const stripes=(()=>{ const c=document.createElement('canvas'); c.width=256; c.height=64; const x=c.getContext('2d'); for(let i=0;i<8;i++){ x.fillStyle=i%2?'#ffffff':'#e32219'; x.fillRect(i*32,0,32,64); } const t=new THREE.CanvasTexture(c); t.wrapS=THREE.RepeatWrapping; t.repeat.set(2,1); return t; })();
      const floor=new THREE.Mesh(new THREE.CylinderGeometry(9,9,.06,40),new THREE.MeshBasicMaterial({color:0xd9b77a})); floor.position.y=.03; g.add(floor);
      const body=new THREE.Mesh(new THREE.CylinderGeometry(5,5,2.6,32,1,true),new THREE.MeshBasicMaterial({map:stripes,side:THREE.DoubleSide})); body.position.y=1.3; g.add(body);
      const roof=new THREE.Mesh(new THREE.ConeGeometry(5.6,3.2,32,1,true),new THREE.MeshBasicMaterial({map:stripes,side:THREE.DoubleSide})); roof.position.y=4.2; g.add(roof);
      const pole=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,2.4,8),new THREE.MeshBasicMaterial({color:0xffd54f})); pole.position.y=6.6; g.add(pole);
      const flag=spr((c,w,h)=>{ c.font='90px Arial'; c.textAlign='center'; c.fillText('🚩',w/2,80); },128,128,1.6,1.6); flag.position.set(.7,7.6,0); g.add(flag);
      const sign=spr((c,w,h)=>{ c.fillStyle='rgba(0,0,0,.65)'; rrect(c,4,4,w-8,h-8,22); c.fill(); c.strokeStyle='#ffd54f'; c.lineWidth=5; c.stroke(); c.fillStyle='#ffd54f'; c.font='bold 40px Arial'; c.textAlign='center'; c.fillText('🎪 WANDERZIRKUS',w/2,64); },512,96,6.4,1.2); sign.position.set(0,9,0); g.add(sign);
      // Eingang (dunkles Tor) + Tiere
      const door=new THREE.Mesh(new THREE.PlaneGeometry(2.2,2.2),new THREE.MeshBasicMaterial({color:0x2a0a0a,side:THREE.DoubleSide})); door.position.set(0,1.1,5.02); g.add(door);
      const AN=[['🐘','Elefant'],['🦁','Löwe'],['🐅','Tiger'],['🐒','Affe'],['🦓','Zebra'],['🐻','Bär']]; C.an=[];
      AN.forEach((a,i)=>{ const ang=Math.PI*.8+i*(Math.PI*1.4/5), r=7.6; const s=spr((c,w,h)=>{ c.font='120px Arial'; c.textAlign='center'; c.fillText(a[0],w/2,130); c.fillStyle='rgba(0,0,0,.6)'; rrect(c,40,150,176,40,12); c.fill(); c.fillStyle='#fff'; c.font='bold 26px Arial'; c.fillText(a[1],w/2,180); },256,200,2.6,2.0); s.position.set(Math.cos(ang)*r,1.2,Math.sin(ang)*r); s.userData.y0=1.2; s.userData.ph=i; g.add(s); C.an.push(s); });
      ZG.scene.add(g); C.grp=g;
    },
    _destroy(){ try{ if(C.grp){ ZG.scene.remove(C.grp); C.grp.traverse(o=>{ if(o.material){ if(o.material.map) o.material.map.dispose(); o.material.dispose(); } if(o.geometry) o.geometry.dispose(); }); } }catch(e){} C.grp=null; C.an=[]; const c=document.getElementById('zcirc-chip'); if(c) c.style.display='none'; const ob0=document.getElementById('zcirc-open'); if(ob0) ob0.style.display='none'; C.closePanel(); },
    _used(id){ const z=ZS.zoo; if(!z.circ||z.circ.id!==id) z.circ={id,trick:0,wheel:0}; return z.circ; },
    openPanel(){
      const st=C.state(); if(!st) return; const u=C._used(st.id); C.closePanel();
      const el=document.createElement('div'); el.id='zcirc-panel'; el.style.cssText='position:fixed;inset:0;z-index:2147480000;background:rgba(10,4,20,.9);color:#fff;font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;padding:14px';
      el.innerHTML='<div style="width:min(94vw,380px);background:linear-gradient(135deg,#3a0a14,#1a1038);border:2px solid #ffd54f;border-radius:20px;padding:16px;text-align:center"><div style="display:flex;align-items:center"><div style="flex:1;font-weight:900;color:#ffd54f;font-size:1.1rem">🎪 Wanderzirkus</div><button id="zc-x" style="background:rgba(255,255,255,.14);border:none;color:#fff;border-radius:50%;width:32px;height:32px;cursor:pointer">✕</button></div><div id="zc-body" style="margin-top:12px"></div></div>';
      document.body.appendChild(el); C.ui=el; el.querySelector('#zc-x').onclick=C.closePanel; C._home();
    },
    closePanel(){ cancelAnimationFrame(C._raf); if(C.ui){ C.ui.remove(); C.ui=null; } },
    _home(){
      const b=C.ui&&C.ui.querySelector('#zc-body'); if(!b) return; const st=C.state(); if(!st){ C.closePanel(); return; } const u=C._used(st.id);
      b.innerHTML='<div style="font-size:.78rem;color:rgba(255,255,255,.7);margin-bottom:10px">Pro Zirkus-Besuch darfst du jedes einmal probieren.</div>'
        +'<button id="zc-t" '+(u.trick?'disabled':'')+' style="display:block;width:100%;padding:13px;margin:6px 0;border-radius:14px;border:none;background:'+(u.trick?'#555':'#e32219')+';color:#fff;font-weight:900;font-size:1rem;cursor:pointer">🎭 Kunststück einüben'+(u.trick?' ✔ erledigt':'')+'</button>'
        +'<button id="zc-w" '+(u.wheel?'disabled':'')+' style="display:block;width:100%;padding:13px;margin:6px 0;border-radius:14px;border:none;background:'+(u.wheel?'#555':'#8E44AD')+';color:#fff;font-weight:900;font-size:1rem;cursor:pointer">🎡 Glücksrad drehen'+(u.wheel?' ✔ erledigt':'')+'</button>'
        +'<div style="font-size:.74rem;color:rgba(255,255,255,.55);margin-top:8px">Schau dir auch die Zirkustiere draussen an 🐘🦁🐅</div>';
      const t=b.querySelector('#zc-t'), w=b.querySelector('#zc-w'); if(t&&!u.trick) t.onclick=C._trick; if(w&&!u.wheel) w.onclick=C._wheel;
    },
    _trick(){
      const b=C.ui&&C.ui.querySelector('#zc-body'); if(!b) return; const st=C.state(); if(!st) return; const u=C._used(st.id); u.trick=1; save();
      let tries=0, hits=0, zone=.25+Math.random()*.4, pos=0, dir=1, run=true; const W=.2;
      b.innerHTML='<div style="font-weight:800;margin-bottom:8px">Triff die grüne Zone! (3 Versuche)</div><div id="zc-bar" style="position:relative;height:34px;border-radius:17px;background:#2a2342;overflow:hidden"><div id="zc-zone" style="position:absolute;top:0;bottom:0;background:#2ecc71;opacity:.85"></div><div id="zc-mk" style="position:absolute;top:2px;bottom:2px;width:8px;border-radius:4px;background:#fff"></div></div><div id="zc-st" style="margin:8px 0;font-size:.85rem">Versuch 1 von 3 · Treffer: 0</div><button id="zc-go" style="width:100%;padding:13px;border:none;border-radius:14px;background:#ffd54f;color:#000;font-weight:900;font-size:1.05rem;cursor:pointer">🎯 JETZT!</button>';
      const zn=b.querySelector('#zc-zone'), mk=b.querySelector('#zc-mk'), stt=b.querySelector('#zc-st'), go=b.querySelector('#zc-go');
      const setZone=()=>{ zone=.12+Math.random()*(.76-W); zn.style.left=(zone*100)+'%'; zn.style.width=(W*100)+'%'; }; setZone();
      let last=performance.now(); const loop=n=>{ if(!run) return; const dt=(n-last)/1000; last=n; pos+=dir*dt*(.9+tries*.35); if(pos>=1){ pos=1; dir=-1; } if(pos<=0){ pos=0; dir=1; } mk.style.left='calc('+(pos*100)+'% - 4px)'; C._raf=requestAnimationFrame(loop); }; C._raf=requestAnimationFrame(loop);
      go.onclick=()=>{ tries++; const hit=pos>=zone&&pos<=zone+W; if(hit) hits++; stt.textContent=(hit?'✅ Treffer! ':'❌ Daneben! ')+(tries<3?'Versuch '+(tries+1)+' von 3':'')+' · Treffer: '+hits;
        if(tries>=3){ run=false; cancelAnimationFrame(C._raf); go.disabled=true; setTimeout(()=>{ let msg; if(hits>=2){ const rw=Math.max(200,bal()*.02); giveMT(rw); save(); msg='🎭 Bravo! Der Zirkusdirektor schenkt dir <b>+'+fmt(rw)+' MT</b>!'; big('🎭 BRAVO!','#ffd54f',2000); } else msg='Fast! Diesmal hat es nicht gereicht – beim nächsten Zirkus klappt es bestimmt.'; const bb=C.ui&&C.ui.querySelector('#zc-body'); if(bb){ bb.innerHTML='<div style="font-size:1rem;margin:8px 0">'+msg+'</div><button id="zc-b" style="padding:10px 18px;border:none;border-radius:12px;background:#555;color:#fff;font-weight:800;cursor:pointer">Zurück</button>'; bb.querySelector('#zc-b').onclick=C._home; } },700); } else setZone(); };
    },
    _wheel(){
      const b=C.ui&&C.ui.querySelector('#zc-body'); if(!b) return; const st=C.state(); if(!st) return; const u=C._used(st.id); u.wheel=1; save();
      const P=[[35,'mt1','+1 % deines Guthabens'],[15,'mt3','+3 % deines Guthabens'],[15,'luck','🍀 Glück ×2 (5 Min)'],[15,'money','💰 Geld ×2 (5 Min)'],[10,'vis','👥 Besucher ×2 (5 Min)'],[10,'nix','🎊 Konfetti – diesmal nichts']];
      let r=Math.random()*100, pr=P[P.length-1]; for(const p of P){ if(r<p[0]){ pr=p; break; } r-=p[0]; }
      b.innerHTML='<div id="zc-wh" style="font-size:5rem;display:inline-block;transition:transform 2.4s cubic-bezier(.1,.7,.2,1)">🎡</div><div id="zc-wt" style="margin-top:8px;font-weight:800;min-height:40px">Das Rad dreht sich …</div>';
      const wh=b.querySelector('#zc-wh'); setTimeout(()=>{ wh.style.transform='rotate('+(1080+Math.floor(Math.random()*360))+'deg)'; },30);
      setTimeout(()=>{ const bb=C.ui&&C.ui.querySelector('#zc-wt'); let txt=pr[2]; const k=pr[1];
        if(k==='mt1') giveMT(Math.max(100,bal()*.01)); else if(k==='mt3') giveMT(Math.max(300,bal()*.03)); else if(k==='luck') boost('luck',2,5); else if(k==='money') boost('money',2,5); else if(k==='vis') boost('visitor',2,5);
        save(); if(k!=='nix') big('🎡 GEWONNEN!','#ffd54f',2000);
        if(bb){ bb.innerHTML='<div style="font-size:1.05rem">'+esc(txt)+'</div><button id="zc-b" style="margin-top:10px;padding:10px 18px;border:none;border-radius:12px;background:#555;color:#fff;font-weight:800;cursor:pointer">Zurück</button>'; bb.querySelector('#zc-b').onclick=C._home; } },2700);
    },
    tick(){
      try{
        if(!ready()){ return; } C.init(); const st=C.state();
        if(!st){ if(C.grp||C.id){ C._destroy(); C.id=null; } return; }
        if(C.id!==st.id){ C.id=st.id; C.until=st.until; if(C.ann!==st.id&&st.until-tn()>20000){ C.ann=st.id; big('🎪 Der Wanderzirkus ist da!','#ffd54f',3500); toast('🎪 Wanderzirkus im Zoo (Osten)! Noch '+Math.ceil((st.until-tn())/60000)+' Min – Kunststücke, Glücksrad & Zirkustiere.',6000); try{ if(typeof ZHelp!=='undefined') setTimeout(()=>ZHelp.tip('circus'),1800); }catch(e){} } }
        C._build();
        const ar=arrow(CX,CZ), left=Math.max(0,st.until-tn()), c=chip('zcirc-chip',126); c.style.display='block'; c.style.borderLeft='4px solid #e32219';
        c.textContent='🎪 Zirkus · '+Math.floor(left/60000)+':'+String(Math.floor(left/1000)%60).padStart(2,'0')+' · '+(ar.d<=11?'tippen zum Mitmachen':ar.A+' '+Math.round(ar.d)+' m');
        c.onclick=()=>{ if(ar.d<=11) C.openPanel(); else toast('🎪 Zelt: '+ar.A+' '+Math.round(ar.d)+' m (Osten, hinter dem Eingang)',2600); };
        let ob=document.getElementById('zcirc-open'); if(!ob){ ob=document.createElement('button'); ob.id='zcirc-open'; ob.style.cssText='position:fixed;left:50%;bottom:210px;transform:translateX(-50%);z-index:630;background:#e32219;color:#fff;border:2px solid #ffd54f;border-radius:24px;padding:12px 24px;font:900 1rem Arial;box-shadow:0 4px 16px rgba(0,0,0,.5);cursor:pointer;display:none'; ob.textContent='🎪 Öffnen'; ob.onclick=()=>C.openPanel(); document.body.appendChild(ob); }
        ob.style.display=(ar.d<=11&&!C.ui&&!busy())?'block':'none';
      }catch(e){}
    }
  };
  setInterval(C.tick,1000);
  // Zirkustiere wippen
  const loop=()=>{ try{ if(C.grp&&C.an){ const t=performance.now()/500; C.an.forEach(s=>{ s.position.y=s.userData.y0+Math.abs(Math.sin(t+s.userData.ph))*.35; }); } }catch(e){} requestAnimationFrame(loop); }; requestAnimationFrame(loop);
  try{ if(window.ZHelp){ ZHelp.TIPS.circus={t:'Wanderzirkus',s:['🎪','➜','🎭','➜','🎡'],d:'Der Zirkus ist kurz im Zoo (im Osten). Lauf hin und tippe auf „🎪 Öffnen“: Kunststück üben oder am Glücksrad drehen!'}; ZHelp.TIPS.wish={t:'Besucher-Wunsch',s:['🧑','➜','🐧','➜','🎁'],d:'Ein Besucher wünscht sich ein Tier. Lauf hin und tippe „zeigen“ – du bekommst Trinkgeld!'}; } }catch(e){}
})();

;
/* ZCoaster (v705) — 🎢 Admin-Event: begehbare 3D-Achterbahn (Lift, Ausblick, Abfahrt, Looping, Hügel, Kurven). RTDB zoo_coaster {id,until}. */
(function(){
  'use strict';
  const RT=()=>{ try{ return (typeof _rtdb!=='undefined'&&_rtdb)?_rtdb:null; }catch(e){ return null; } };
  let _off=0; const tn=()=>Date.now()+_off;
  const toast=(m,ms)=>{ try{ ZP.toast(m,ms||3000); }catch(e){} };
  const big=(t,c,ms)=>{ try{ ZG._bigText(t,c||'#fff',ms||2500); }catch(e){} };
  const isAdm=()=>{ try{ return !!(window.ZBases&&ZBases.isEd&&ZBases.isEd()); }catch(e){ return false; } };
  const ready=()=>{ try{ return !!(typeof ZG!=='undefined'&&ZG.scene&&ZG.pl&&ZG.cam&&typeof ZS!=='undefined'&&ZS.zoo&&ZS.player&&typeof THREE!=='undefined'); }catch(e){ return false; } };
  const busy=()=>{ try{ return !!(ZG._arcadeActive||ZG._jumpActive||ZG._mazeActive||ZG._trashActive||ZG._iceRoomActive||ZG._meadowActive); }catch(e){ return false; } };
  const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
  const smooth=t=>t*t*(3-2*t);
  const G=9.81, X0=-70, ZST=-12;           // Station / Streckenstart (Welt-Koordinaten)
  const SPACING=0.7;

  // ── Strecke (Polylinie, 1 Runde, Start+Ende an der Station) ──
  function raw(){
    const P=[]; const add=(x,y,z)=>P.push(V3(x,y,z));
    const ST=(z0,z1,y,x)=>{ const n=Math.max(2,Math.round(Math.abs(z1-z0)/SPACING)); for(let i=0;i<n;i++) add(x,y,z0+(z1-z0)*i/n); };
    // Station + Lift (ansteigend, ca. 36 m) bis zur Kuppe
    ST(-8,-2,0.9,X0);
    { const z0=-2,z1=34,n=Math.round((z1-z0)/SPACING); for(let i=0;i<n;i++){ const t=i/n; add(X0,0.9+29*t*(0.85+0.15*t),z0+(z1-z0)*t); } }
    // Kuppe (Ausblick): rundet oben ab
    { const n=14; for(let i=0;i<n;i++){ const t=i/n; add(X0+ Math.sin(t*Math.PI)*0.0,29.9+Math.sin(t*Math.PI)*1.3,34+t*6); } }
    // 1. Abfahrt: S-Kurve von 31 m auf 2,5 m
    { const z0=40,z1=58,n=Math.round((z1-z0)/SPACING*1.5); for(let i=0;i<=n;i++){ const t=i/n; add(X0,2.5+28.5*(0.5+0.5*Math.cos(Math.PI*t)),z0+(z1-z0)*t); } }
    // Looping (R=8, seitlicher Versatz 4 m, Vorwärtsdrift)
    { const R=8,n=Math.round(2*Math.PI*R*1.5/SPACING); for(let i=1;i<=n;i++){ const t=2*Math.PI*i/n; add(X0+4*(t/(2*Math.PI)),2.5+R*(1-Math.cos(t)),58+R*Math.sin(t)+2.8*t); } }
    // Rechts-Kehre (R=10, überhöht) → Rückweg bei x=-86
    { const cx=X0+4-10, cz=58+2.8*2*Math.PI, n=Math.round(Math.PI*10/SPACING); for(let i=1;i<=n;i++){ const a=Math.PI*i/n; add(cx+10*Math.cos(a),2.5+1.6*Math.sin(a),cz+10*Math.sin(a)); } }
    // Rückweg mit Hügeln und S-Schwüngen
    { const zs=58+2.8*2*Math.PI, z1=-12, xr=X0+4-20, n=Math.round((zs-z1)/SPACING);
      for(let i=1;i<=n;i++){ const u=i/n, z=zs+(z1-zs)*u; const hill=10.5*Math.exp(-Math.pow((z-52)/6.5,2))+7.5*Math.exp(-Math.pow((z-28)/5.5,2))+9.5*Math.exp(-Math.pow((z-6)/5,2));
        const wig=3.2*Math.sin(4*Math.PI*u)*Math.sin(Math.PI*u); add(xr+wig,2.5+hill*Math.min(1,u*8)*Math.min(1,(1-u)*8),z); } }
    // Linkskehre zurück zur Station
    { const xr=X0+4-20, cx=xr+8, n=Math.round(Math.PI*8/SPACING); for(let i=1;i<=n;i++){ const a=Math.PI*i/n; add(cx-8*Math.cos(a),2.5-1.6*smooth(i/n),-12-8*Math.sin(a)); } }
    // Einfahrt in die Station
    { const n=Math.round(4/SPACING); for(let i=1;i<=n;i++){ add(X0,0.9,-12+4*i/n); } }
    return P;
  }
  function resample(P){ // gleichmässiger Abstand
    const out=[P[0].clone()]; let acc=0; for(let i=1;i<P.length;i++){ let a=P[i-1], b=P[i], d=a.distanceTo(b); while(acc+d>=SPACING){ const t=(SPACING-acc)/d; const q=a.clone().lerp(b,t); out.push(q); a=q; d=a.distanceTo(b); acc=0; } acc+=d; } return out;
  }
  function frames(P){
    const N=P.length, T=[], U=[], R=[]; for(let i=0;i<N;i++){ const a=P[(i+N-1)%N], b=P[(i+1)%N]; T.push(b.clone().sub(a).normalize()); }
    let u=V3(0,1,0); u.sub(T[0].clone().multiplyScalar(u.dot(T[0]))).normalize(); U.push(u);
    for(let i=1;i<N;i++){ const q=new THREE.Quaternion().setFromUnitVectors(T[i-1],T[i]); u=U[i-1].clone().applyQuaternion(q); u.sub(T[i].clone().multiplyScalar(u.dot(T[i]))).normalize(); U.push(u); }
    // Verdrillung am Ende gleichmässig ausgleichen, Banking in Kurven
    const e=U[N-1], s0=U[0]; const ang=Math.atan2(T[0].clone().dot(e.clone().cross(s0)),e.dot(s0));
    for(let i=0;i<N;i++){ const k=(T[(i+1)%N].clone().cross(T[(i+N-1)%N])).y/(2*SPACING); // >0: Linkskurve (grob)
      const bank=Math.max(-.75,Math.min(.75,-k*55)); const roll=ang*(i/(N-1))+((T[i].y>.97||T[i].y<-.97)?0:bank*(1-Math.abs(T[i].y)));
      U[i].applyAxisAngle(T[i],roll); R.push(T[i].clone().cross(U[i]).normalize()); }
    return {T,U,R};
  }
  function sweep(P,F,off,up,w,h){ // Schiene als Quader-Schlauch
    const N=P.length, pos=[], idx=[]; const cs=[[-w,-h],[w,-h],[w,h],[-w,h]];
    for(let i=0;i<N;i++){ const c=P[i].clone().addScaledVector(F.R[i],off).addScaledVector(F.U[i],up); cs.forEach(([a,b])=>{ const v=c.clone().addScaledVector(F.R[i],a).addScaledVector(F.U[i],b); pos.push(v.x,v.y,v.z); }); }
    for(let i=0;i<N-1;i++) for(let k=0;k<4;k++){ const a=i*4+k, b=i*4+(k+1)%4, c=(i+1)*4+k, d=(i+1)*4+(k+1)%4; idx.push(a,c,b,b,c,d); }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setIndex(idx); g.computeVertexNormals(); return g;
  }
  const spr=(draw,w,h,sx,sy)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h); const tex=new THREE.CanvasTexture(c); const m=new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false}); const s=new THREE.Sprite(m); s.scale.set(sx,sy,1); return s; };

  const C=window.ZCoaster={
    adm:null, local:0, grp:null, P:null, F:null, S:null, L:0, trainG:null, ride:null, id:null, ann:null, _inited:false, view:'ego', _ac:null,
    init(){ if(C._inited) return; const r=RT(); if(!r) return; C._inited=true; try{ r.ref('.info/serverTimeOffset').on('value',s=>{ _off=+s.val()||0; }); }catch(e){} try{ r.ref('zoo_coaster').on('value',s=>{ C.adm=s.val()||null; }); }catch(e){} },
    state(){ const n=tn(), a=C.adm; if(a&&a.until>n) return {id:String(a.id),until:a.until}; if(C.local>Date.now()) return {id:'local',until:C.local}; return null; },
    adminStart(mins){ const r=RT(); if(!r){ toast('❌ Keine Verbindung'); return; } mins=Math.max(1,Math.min(180,+mins||15)); r.ref('zoo_coaster').set({id:String(Date.now()),until:tn()+mins*60000,by:ZS.player}).then(()=>toast('🎢 Achterbahn für alle gestartet ('+mins+' Min)')).catch(e=>toast('❌ '+e.message)); },
    adminStop(){ const r=RT(); if(r) r.ref('zoo_coaster').set({id:String(Date.now()),until:0,by:ZS.player}).then(()=>toast('⏹️ Achterbahn beendet')); C.local=0; },
    adminLocal(){ C.local=Date.now()+30*60000; toast('🎢 Test: Achterbahn nur bei dir (30 Min)'); },
    // ── Aufbau ──
    _build(){
      if(C.grp) return; const P=resample(raw()); const F=frames(P); C.P=P; C.F=F; const N=P.length;
      const S=new Float32Array(N); for(let i=1;i<N;i++) S[i]=S[i-1]+P[i].distanceTo(P[i-1]); C.S=S; C.L=S[N-1];
      const g=new THREE.Group();
      const matR=new THREE.MeshLambertMaterial({color:0x4aa3ff}), matS=new THREE.MeshLambertMaterial({color:0xd62828}), matT=new THREE.MeshLambertMaterial({color:0x5a4632}), matP=new THREE.MeshLambertMaterial({color:0xb0b0b8});
      [-0.62,0.62].forEach(o=>{ g.add(new THREE.Mesh(sweep(P,F,o,0,.07,.07),matR)); });
      g.add(new THREE.Mesh(sweep(P,F,0,-.5,.17,.17),matS));
      // Schwellen
      const step=4, nt=Math.floor(N/step); const tie=new THREE.InstancedMesh(new THREE.BoxGeometry(1.5,.07,.16),matT,nt); const m4=new THREE.Matrix4();
      for(let k=0;k<nt;k++){ const i=k*step; m4.makeBasis(F.R[i],F.U[i],F.T[i]); m4.setPosition(P[i].x,P[i].y-.07,P[i].z); tie.setMatrixAt(k,m4); } g.add(tie);
      // Stützen
      const sup=[]; for(let i=0;i<N;i+=Math.round(9/SPACING)){ if(P[i].y>1.8&&F.U[i].y>-.2) sup.push(i); }
      const col=new THREE.InstancedMesh(new THREE.CylinderGeometry(.17,.21,1,8),matP,sup.length); sup.forEach((i,k)=>{ const h=P[i].y-.7; m4.makeScale(1,h,1); m4.setPosition(P[i].x,h/2,P[i].z); col.setMatrixAt(k,m4); }); g.add(col);
      // Station
      const plat=new THREE.Mesh(new THREE.BoxGeometry(3.4,.6,14),new THREE.MeshLambertMaterial({color:0xcfc2a8})); plat.position.set(X0+3,.3,-7); g.add(plat);
      const roof=new THREE.Mesh(new THREE.BoxGeometry(6.2,.25,14.4),new THREE.MeshLambertMaterial({color:0xd62828})); roof.position.set(X0+1.2,4.3,-7); g.add(roof);
      [[-6,X0-1.7],[-6,X0+4.6],[-13,X0-1.7],[-13,X0+4.6]].forEach(([z,x])=>{ const p=new THREE.Mesh(new THREE.CylinderGeometry(.15,.15,4.2,8),matP); p.position.set(x,2.1,z+3); g.add(p); });
      const sign=spr((c,w,h)=>{ c.fillStyle='rgba(0,0,0,.75)'; c.fillRect(0,0,w,h); c.strokeStyle='#ffd54f'; c.lineWidth=6; c.strokeRect(6,6,w-12,h-12); c.fillStyle='#ffd54f'; c.font='bold 46px Arial'; c.textAlign='center'; c.fillText('🎢 RIESEN-ACHTERBAHN',w/2,72); },640,110,8,1.4); sign.position.set(X0+1.2,6.2,-7); g.add(sign);
      g.userData.board={x:X0+2.7,z:-6};
      ZG.scene.add(g); C.grp=g;
      // Zug (3 Wagen)
      const train=new THREE.Group(); C.cars=[];
      for(let k=0;k<3;k++){ const car=new THREE.Group(); const body=new THREE.Mesh(new THREE.BoxGeometry(1.5,.5,2.1),new THREE.MeshLambertMaterial({color:k?0xe63946:0xffb703})); body.position.y=.05; car.add(body);
        const back=new THREE.Mesh(new THREE.BoxGeometry(1.4,.8,.25),new THREE.MeshLambertMaterial({color:0x222})); back.position.set(0,.6,.8); car.add(back);
        const bar=new THREE.Mesh(new THREE.BoxGeometry(1.3,.12,.12),new THREE.MeshLambertMaterial({color:0xcccccc})); bar.position.set(0,.55,-.3); car.add(bar); train.add(car); C.cars.push(car); }
      g.add(train); C.trainG=train; C._poseTrain(C._boardS());
    },
    _boardS(){ return 0; },
    // Pose an Bogenlänge s (Position, T, U, R)
    _pose(s){
      const N=C.P.length, L=C.L; s=((s%L)+L)%L; let lo=0, hi=N-1; const S=C.S; while(hi-lo>1){ const m=(lo+hi)>>1; if(S[m]<=s) lo=m; else hi=m; }
      const t=(s-S[lo])/Math.max(1e-6,S[hi]-S[lo]), i=lo, j=hi%N;
      const p=C.P[i].clone().lerp(C.P[j],t), T=C.F.T[i].clone().lerp(C.F.T[j],t).normalize(), U=C.F.U[i].clone().lerp(C.F.U[j],t).normalize(); U.sub(T.clone().multiplyScalar(U.dot(T))).normalize(); const R=T.clone().cross(U).normalize();
      return {p,T,U,R};
    },
    _poseTrain(s){
      C.cars.forEach((car,k)=>{ const q=C._pose(s-k*2.7); const m=new THREE.Matrix4(); m.makeBasis(q.R,q.U,q.T.clone().negate()); car.position.copy(q.p).addScaledVector(q.U,.45); car.quaternion.setFromRotationMatrix(m); });
    },
    _destroy(){ try{ if(C.grp){ ZG.scene.remove(C.grp); C.grp.traverse(o=>{ if(o.material){ if(o.material.map) o.material.map.dispose(); o.material.dispose(); } if(o.geometry) o.geometry.dispose(); }); } }catch(e){} C.grp=null; C.P=null; C.F=null; C.trainG=null; ['zcoaster-chip','zcoaster-btn'].forEach(id=>{ const e=document.getElementById(id); if(e) e.remove(); }); },
    // ── Fahrt ──
    board(){
      if(C.ride||!C.grp||busy()) return; try{ if(ZG.carrying){ toast('🐾 Setz zuerst dein Tier im Gehege ab!',2500); return; } }catch(e){}
      C.ride={s:0,v:0,t:0,phase:'lift',yaw0:ZG.yaw||0,saved:{x:ZG.pl.x,y:ZG.pl.y,z:ZG.pl.z},tick:0}; C.view='ego'; ZG._coasterRide=true;
      C._ui(); C._audio(true); big('🎢 LOS GEHT’S!','#ffd54f',2200); toast('Zieh am Bildschirm, um dich umzuschauen – oben gibt es eine tolle Aussicht!',4200);
    },
    _end(){ const r=C.ride; if(!r) return; C.ride=null; ZG._coasterRide=false; C._audio(false); const u=document.getElementById('zcoaster-ui'); if(u) u.remove(); ZG.pl.x=X0+4.4; ZG.pl.z=-6; ZG.pl.y=1.7; ZG.pitch=0; ZG.yaw=Math.PI/2; C._poseTrain(C._boardS()); toast('🎢 Das war die Fahrt! Nochmal? Geh zum Bahnsteig.',3500); },
    _ui(){
      let u=document.getElementById('zcoaster-ui'); if(u) u.remove(); u=document.createElement('div'); u.id='zcoaster-ui';
      u.innerHTML='<div id="zcr-info" style="position:fixed;left:50%;top:104px;transform:translateX(-50%);z-index:640;background:rgba(0,0,0,.55);color:#fff;font:800 .8rem Arial;padding:5px 12px;border-radius:14px;pointer-events:none"></div>'
        +'<button id="zcr-view" style="position:fixed;right:10px;top:150px;z-index:640;background:rgba(0,0,0,.6);color:#fff;border:1px solid rgba(255,255,255,.4);border-radius:16px;padding:8px 12px;font:800 .75rem Arial;cursor:pointer">👁️ Ansicht</button>'
        +'<button id="zcr-exit" style="position:fixed;right:10px;top:192px;z-index:640;background:rgba(150,20,20,.85);color:#fff;border:none;border-radius:16px;padding:8px 12px;font:800 .75rem Arial;cursor:pointer;display:none">🚪 Aussteigen</button>';
      document.body.appendChild(u); u.querySelector('#zcr-view').onclick=()=>{ C.view=C.view==='ego'?'chase':'ego'; };
      u.querySelector('#zcr-exit').onclick=()=>{ if(confirm('Fahrt abbrechen und aussteigen?')) C._end(); };
    },
    _audio(on){
      try{ if(on){ const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return; const c=C._ac||(C._ac=new AC()); if(c.state==='suspended') c.resume();
          const nb=c.createBuffer(1,c.sampleRate*2,c.sampleRate), d=nb.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; const src=c.createBufferSource(); src.buffer=nb; src.loop=true; const bp=c.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=500; bp.Q.value=.6; const g=c.createGain(); g.gain.value=0; src.connect(bp); bp.connect(g); g.connect(c.destination); src.start(); C._wind={src,bp,g}; }
        else if(C._wind){ const w=C._wind; C._wind=null; try{ w.g.gain.setTargetAtTime(0,C._ac.currentTime,.2); setTimeout(()=>{ try{ w.src.stop(); }catch(e){} },700); }catch(e){} } }catch(e){}
    },
    _click(){ try{ const c=C._ac; if(!c) return; const o=c.createOscillator(), g=c.createGain(); o.type='square'; o.frequency.value=150+Math.random()*30; g.gain.setValueAtTime(.05,c.currentTime); g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.05); o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime+.06); }catch(e){} },
    _step(dt){
      const r=C.ride; if(!r) return; dt=Math.min(.1,dt); r.t+=dt;
      const q=C._pose(r.s), y=q.p.y, crestY=31, Lc=C._crestS||(C._crestS=C._findCrest());
      let v;
      if(r.s<Lc-6){ v=4.4; r.phase='lift'; }
      else { r.phase=r.s<Lc+8?'crest':'run'; v=Math.sqrt(Math.max(9,2*G*.86*(crestY-y))); if(r.s<Lc+4) v=Math.min(v,3.2); }
      const rem=C.L-r.s; if(rem<16) v=Math.min(v,Math.max(1.4,rem*.85)); v=Math.min(v,24);
      r.v+= (v-r.v)*Math.min(1,dt*3); if(r.phase==='lift'&&Math.abs(r.v-4.4)<.5) r.tick+=r.v*dt; if(r.tick>1.2){ r.tick=0; C._click(); }
      r.s+=r.v*dt; if(r.s>=C.L-.15){ C._end(); return; }
      C._poseTrain(r.s);
      const seat=C._pose(r.s).p; // Sitz im ersten Wagen
      const qq=C._pose(r.s); const sp=qq.p.clone().addScaledVector(qq.U,.62); ZG.pl.x=sp.x; ZG.pl.z=sp.z; ZG.pl.y=sp.y+1.2;
      const inf=document.getElementById('zcr-info'); if(inf) inf.textContent='🎢 '+Math.round(r.v*3.6)+' km/h · Höhe '+Math.max(0,Math.round(q.p.y-.9))+' m · '+Math.round(r.s/C.L*100)+'%'+(r.phase==='lift'?' · ⬆ Lift':(r.phase==='crest'?' · 🌄 Aussicht!':''));
      const ex=document.getElementById('zcr-exit'); if(ex) ex.style.display=r.t>4?'block':'none';
      if(C._wind){ const k=Math.min(1,r.v/22); C._wind.g.gain.setTargetAtTime(.02+.2*k*k,C._ac.currentTime,.1); C._wind.bp.frequency.setTargetAtTime(300+1500*k,C._ac.currentTime,.1); }
    },
    _findCrest(){ let b=0,by=-1; for(let i=0;i<C.P.length;i++){ if(C.P[i].y>by){ by=C.P[i].y; b=i; } } return C.S[b]; },
    // Kamera (wird nach ZG._camUpdate aufgerufen)
    _cam(){
      const r=C.ride; if(!r||!C.P) return; const q=C._pose(r.s), cam=ZG.cam;
      if(C.view==='ego'){
        cam.position.copy(q.p).addScaledVector(q.U,1.25).addScaledVector(q.T,.15);
        const m=new THREE.Matrix4(); m.makeBasis(q.R,q.U,q.T.clone().negate()); const qf=new THREE.Quaternion().setFromRotationMatrix(m);
        let dy=(ZG.yaw||0)-r.yaw0; while(dy>Math.PI) dy-=2*Math.PI; while(dy<-Math.PI) dy+=2*Math.PI; dy=Math.max(-2.2,Math.min(2.2,dy));
        const qy=new THREE.Quaternion().setFromAxisAngle(V3(0,1,0),dy), qx=new THREE.Quaternion().setFromAxisAngle(V3(1,0,0),Math.max(-1.2,Math.min(1.2,ZG.pitch||0)));
        cam.quaternion.copy(qf).multiply(qy).multiply(qx);
      } else {
        const back=C._pose(r.s-8).p; const tgt=q.p.clone().addScaledVector(q.U,.8); cam.position.copy(back).add(V3(0,3.6,0)).addScaledVector(q.U,1.2); cam.lookAt(tgt); cam.up.set(0,1,0);
      }
    },
    tick(){
      try{
        if(!ready()) return; C.init(); const st=C.state();
        if(!st){ if(C.ride) return; if(C.grp){ C._destroy(); C.id=null; } return; }
        if(C.id!==st.id){ C.id=st.id; if(C.ann!==st.id&&st.until-tn()>30000){ C.ann=st.id; big('🎢 Die Riesen-Achterbahn ist da!','#ffd54f',3500); toast('🎢 Admin-Event: Riesen-Achterbahn im Westen des Zoos! Geh zum Bahnsteig und steig ein.',6500); } }
        C._build();
        const b=C.grp.userData.board, dx=b.x-ZG.pl.x, dz=b.z-ZG.pl.z, d=Math.hypot(dx,dz);
        let chip=document.getElementById('zcoaster-chip'); if(!chip){ chip=document.createElement('div'); chip.id='zcoaster-chip'; chip.style.cssText='position:fixed;left:8px;top:182px;z-index:600;background:rgba(0,0,0,.62);color:#fff;font:800 .72rem Arial;padding:5px 10px;border-radius:14px;cursor:pointer;border-left:4px solid #4aa3ff'; chip.onclick=()=>{ if(C.ride) return; const dd=Math.hypot(b.x-ZG.pl.x,b.z-ZG.pl.z); if(dd>12&&!busy()){ ZG.pl.x=b.x+3; ZG.pl.z=b.z; ZG.pl.y=1.7; ZG.yaw=Math.PI/2; toast('📍 Du stehst jetzt am Bahnsteig der Achterbahn.',2500); } else toast('Geh zum Zug am Gleis und tippe auf „Einsteigen“.',2500); }; document.body.appendChild(chip); }
        const left=Math.max(0,st.until-tn()); chip.style.display=C.ride?'none':'block'; chip.textContent='🎢 Achterbahn · '+Math.floor(left/60000)+':'+String(Math.floor(left/1000)%60).padStart(2,'0')+' · '+(d>12?'tippen = hinbeamen':'am Bahnsteig');
        let btn=document.getElementById('zcoaster-btn'); if(!btn){ btn=document.createElement('button'); btn.id='zcoaster-btn'; btn.style.cssText='position:fixed;left:50%;bottom:210px;transform:translateX(-50%);z-index:630;background:#e63946;color:#fff;border:none;border-radius:24px;padding:12px 22px;font:900 1rem Arial;box-shadow:0 4px 16px rgba(0,0,0,.5);cursor:pointer;display:none'; btn.textContent='🎢 Einsteigen'; btn.onclick=()=>C.board(); document.body.appendChild(btn); }
        btn.style.display=(!C.ride&&d<6&&st.until>tn()&&!busy())?'block':'none';
      }catch(e){}
    }
  };
  setInterval(C.tick,1000);
  let _last=performance.now();
  const loop=()=>{ const n=performance.now(), dt=(n-_last)/1000; _last=n; try{ if(C.ride){ C._step(dt); } }catch(e){} requestAnimationFrame(loop); }; requestAnimationFrame(loop);
  // Kamera nach dem normalen Kamera-Update überschreiben
  const hook=()=>{ try{ if(typeof ZG==='undefined'||!ZG._camUpdate||ZG._camUpdate._zc) return false; const o=ZG._camUpdate; const w=function(){ o.apply(this,arguments); if(C.ride){ try{ C._cam(); }catch(e){} } }; w._zc=1; ZG._camUpdate=w; return true; }catch(e){ return false; } };
  const iv=setInterval(()=>{ if(hook()) clearInterval(iv); },500);
})();

;
/* ZGoals (v705) — 🎯 Tagesziele · 🗂️ gruppierte, einklappbare linke Leiste · ❓ Hilfe-Fenster („Tipps nochmal zeigen“). Für alle Rebirth-Stufen. */
(function(){
  'use strict';
  const toast=(m,ms)=>{ try{ ZP.toast(m,ms||3000); }catch(e){} };
  const big=(t,c,ms)=>{ try{ ZG._bigText(t,c||'#fff',ms||2500); }catch(e){} };
  const ready=()=>{ try{ return !!(typeof ZS!=='undefined'&&ZS.zoo&&typeof ZG!=='undefined'&&ZG.pl&&typeof ZP!=='undefined'&&ZP.open); }catch(e){ return false; } };
  const fmt=v=>{ try{ if(typeof $mt==='function') return $mt(v); }catch(e){} return Math.round(v).toLocaleString('de-CH'); };
  const bal=()=>{ try{ return (ZS.dsMT||0)+(ZS.zoo.mt||0); }catch(e){ return 0; } };
  const day=()=>{ const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
  const hash=s=>{ let h=2166136261; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; };
  // Ziele: ev = Ereignis, n = Anzahl, lvl 0 leicht / 1 mittel / 2 schwer
  const POOL=[
    {id:'shop',lvl:0,e:'🛒',t:'Öffne den Shop',ev:'shop',n:1},
    {id:'gond',lvl:0,e:'🚡',t:'Besuche die Gondel',ev:'gond',n:1},
    {id:'pass',lvl:0,e:'🎫',t:'Schau in den MT-Pass',ev:'mtpass',n:1},
    {id:'walk1',lvl:0,e:'🚶',t:'Laufe 150 Meter',ev:'walk',n:150},
    {id:'buy1',lvl:1,e:'🐾',t:'Kaufe 1 Tier',ev:'buy',n:1},
    {id:'walk2',lvl:1,e:'🏃',t:'Laufe 500 Meter',ev:'walk',n:500},
    {id:'time1',lvl:1,e:'⏱️',t:'Spiele 10 Minuten',ev:'time',n:600},
    {id:'buy3',lvl:2,e:'🐘',t:'Kaufe 3 Tiere',ev:'buy',n:3},
    {id:'time2',lvl:2,e:'🕒',t:'Spiele 25 Minuten',ev:'time',n:1500},
    {id:'walk3',lvl:2,e:'🥾',t:'Laufe 1200 Meter',ev:'walk',n:1200}
  ];
  const PCT=[.01,.02,.03], MINR=[100,300,800];
  const G=window.ZGoals={
    POOL, el:null, _lx:null, _lz:null,
    st(){ const z=ZS.zoo; if(!z) return null; let g=z.goals; if(!g||g.d!==day()){ const d=day(); const used=[]; const ids=[0,1,2].map(l=>{ let L=POOL.filter(q=>q.lvl===l&&!used.includes(q.ev)); if(!L.length) L=POOL.filter(q=>q.lvl===l); const q=L[hash(d+':'+(ZS.player||'')+':'+l)%L.length]; used.push(q.ev); return q.id; }); g=z.goals={d,ids,p:{},done:{},bonus:0}; try{ ZS.save&&ZS.save(); }catch(e){} } return g; },
    quests(){ const g=G.st(); return g?g.ids.map(id=>POOL.find(q=>q.id===id)).filter(Boolean):[]; },
    add(ev,n){ try{ if(!ready()) return; const g=G.st(); if(!g) return; let ch=false; G.quests().forEach(q=>{ if(q.ev!==ev||g.done[q.id]) return; g.p[q.id]=Math.min(q.n,(g.p[q.id]||0)+(n||1)); ch=true; if(g.p[q.id]>=q.n) G._finish(q); }); if(ch){ G._badge(); if(G.el) G.draw(); } }catch(e){} },
    _finish(q){
      const g=G.st(); if(g.done[q.id]) return; g.done[q.id]=1; const z=ZS.zoo, r=Math.max(MINR[q.lvl],Math.floor(bal()*PCT[q.lvl])); z.mt=(z.mt||0)+r;
      big('🎯 Ziel geschafft!','#7CFC00',2200); toast('🎯 '+q.t+' ✓  +'+fmt(r)+' MT',3500);
      if(G.quests().every(x=>g.done[x.id])&&!g.bonus){ g.bonus=1; const b=Math.floor(bal()*.03); z.mt+=b; try{ if(!z.mtPassBoosts) z.mtPassBoosts={}; const cur=z.mtPassBoosts.luck; const base=(cur&&cur.until>Date.now())?cur.until:Date.now(); z.mtPassBoosts.luck={mult:2,until:base+10*60000}; }catch(e){} setTimeout(()=>{ big('🏆 Alle Tagesziele!','#ffd54f',3000); toast('🏆 Bonus: +'+fmt(b)+' MT und 10 Min Glück ×2 🍀',5000); },1600); }
      try{ ZS.save&&ZS.save(); ZG._updHUD&&ZG._updHUD(); }catch(e){}
    },
    _badge(){ const b=document.getElementById('zgoals-badge'); if(!b||!ready()) return; const g=G.st(); if(!g) return; const n=g.ids.filter(id=>g.done[id]).length; b.textContent=n+'/3'; b.style.background=n>=3?'#27ae60':'#e63946'; },
    open(){ try{ ['gond','index','shop','reb','enc','menu','adm','sound','report','rank'].forEach(p=>ZP.close(p)); }catch(e){} G.close(); const o=document.createElement('div'); o.id='zgoals'; o.style.cssText='position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,.78);display:flex;align-items:center;justify-content:center;padding:16px'; o.onclick=e=>{ if(e.target===o) G.close(); }; document.body.appendChild(o); G.el=o; G.draw(); },
    close(){ if(G.el){ G.el.remove(); G.el=null; } },
    draw(){
      const o=G.el; if(!o) return; const g=G.st(); const Ls=['Leicht','Mittel','Schwer'], Cs=['#27ae60','#f39c12','#e74c3c'];
      const rows=G.quests().map(q=>{ const p=g.p[q.id]||0, dn=!!g.done[q.id], pc=Math.round(Math.min(1,p/q.n)*100), r=Math.max(MINR[q.lvl],Math.floor(bal()*PCT[q.lvl]));
        return '<div style="background:rgba(255,255,255,'+(dn?'.04':'.08')+');border-left:4px solid '+Cs[q.lvl]+';border-radius:10px;padding:10px 12px;margin-bottom:8px;'+(dn?'opacity:.7':'')+'"><div style="display:flex;align-items:center;gap:8px"><span style="font-size:1.4rem">'+q.e+'</span><div style="flex:1"><div style="font-weight:900;font-size:.88rem">'+q.t+(dn?' ✅':'')+'</div><div style="font-size:.68rem;color:rgba(255,255,255,.55)">'+Ls[q.lvl]+' · Belohnung ca. '+fmt(r)+' MT</div></div></div><div style="height:8px;border-radius:5px;background:rgba(255,255,255,.12);margin-top:7px;overflow:hidden"><div style="height:100%;width:'+pc+'%;background:'+(dn?'#27ae60':Cs[q.lvl])+'"></div></div><div style="font-size:.64rem;color:rgba(255,255,255,.5);margin-top:3px;text-align:right">'+(q.ev==='walk'?Math.round(p)+' / '+q.n+' m':q.ev==='time'?Math.floor(p/60)+' / '+Math.round(q.n/60)+' Min':p+' / '+q.n)+'</div></div>'; }).join('');
      const all=G.quests().every(x=>g.done[x.id]);
      o.innerHTML='<div style="background:linear-gradient(135deg,#1c2b1f,#10161f);border:1px solid rgba(124,252,0,.4);border-radius:16px;padding:16px;max-width:420px;width:100%;max-height:88vh;overflow-y:auto;color:#fff;font-family:Arial,sans-serif"><div style="display:flex;align-items:center;margin-bottom:6px"><h2 style="flex:1;margin:0;font-size:1.1rem;color:#7CFC00">🎯 Tagesziele</h2><button onclick="ZGoals.close()" style="background:none;border:none;color:#fff;font-size:1.2rem;cursor:pointer">✕</button></div><div style="font-size:.72rem;color:rgba(255,255,255,.6);margin-bottom:10px">Jeden Tag 3 neue Ziele. Schaffst du alle, gibt es einen Bonus: 3 % deines Guthabens + 10 Min Glück ×2 🍀</div>'+rows+'<div style="text-align:center;font-weight:900;font-size:.8rem;margin-top:4px;color:'+(all?'#7CFC00':'rgba(255,255,255,.5)')+'">'+(all?'🏆 Alle Ziele heute geschafft – bis morgen!':'Noch '+G.quests().filter(x=>!g.done[x.id]).length+' offen')+'</div></div>';
    }
  };
  // ── Ereignisse einhängen + Lauf-/Zeit-Zähler ──
  let hooked=false;
  const hookAll=()=>{
    if(hooked||!ready()) return;
    const wrap=(obj,fn,cb)=>{ try{ if(!obj||typeof obj[fn]!=='function'||obj[fn]._zg) return; const o=obj[fn]; const w=function(){ const r=o.apply(this,arguments); try{ cb.apply(null,arguments); }catch(e){} return r; }; w._zg=1; obj[fn]=w; }catch(e){} };
    wrap(ZP,'open',p=>{ if(p==='shop') G.add('shop'); else if(p==='gond') G.add('gond'); });
    if(typeof MTPass!=='undefined') wrap(MTPass,'open',()=>G.add('mtpass'));
    if(typeof ZNews!=='undefined') wrap(ZNews,'push',t=>{ if(t==='animal_bought') G.add('buy'); });
    hooked=true;
  };
  setInterval(()=>{ try{
    if(!ready()) return; hookAll(); G.st(); G._badge();
    if(document.visibilityState==='visible'){ G.add('time',1); }
    const x=ZG.pl.x,z=ZG.pl.z; if(G._lx!=null&&!ZG._coasterRide){ const d=Math.hypot(x-G._lx,z-G._lz); if(d>0&&d<8) G.add('walk',d); } G._lx=x; G._lz=z;
  }catch(e){} },1000);

  // ── Linke Leiste: gruppieren & einklappen ──
  const css=document.createElement('style'); css.textContent='#hleft .zb-grp{display:flex;flex-direction:column;align-items:center;gap:5px;width:62px}#hleft .zb-grp.zb-c{display:none!important}#hleft .zb-hd .hbb{background:rgba(255,255,255,.14)!important;font-size:1.15rem!important}#zgoals-badge{position:absolute;top:-4px;right:-2px;color:#fff;font:900 .6rem Arial;border-radius:9px;padding:1px 5px;pointer-events:none}';
  document.head.appendChild(css);
  const getC=k=>{ try{ const v=localStorage.getItem('zbar_'+k); if(v!==null) return v==='1'; }catch(e){} return window.innerHeight<720; };
  const setC=(k,v)=>{ try{ localStorage.setItem('zbar_'+k,v?'1':'0'); }catch(e){} };
  let built=false;
  const build=()=>{
    if(built) return true; const hl=document.getElementById('hleft'); if(!hl||!document.getElementById('hb-shop')||!document.getElementById('hb-menu')) return false;
    const by=sel=>{ try{ return hl.querySelector(sel); }catch(e){ return null; } };
    const q=(a)=>by(a), hbs=[...hl.querySelectorAll(':scope > .hb')];
    const find=re=>hbs.find(e=>re.test(e.getAttribute('onclick')||''));
    // neue Knöpfe
    const mk=(id,ic,lb,bg,fn)=>{ const d=document.createElement('div'); d.className='hb'; d.id=id; d.style.position='relative'; d.innerHTML='<div class="hbb" style="background:'+bg+'">'+ic+'</div><div class="hbl">'+lb+'</div>'; d.onclick=fn; return d; };
    const goals=mk('hb-goals','🎯','Ziele','rgba(46,160,67,.9)',()=>G.open()); const bd=document.createElement('span'); bd.id='zgoals-badge'; bd.textContent='0/3'; goals.firstChild.style.position='relative'; goals.appendChild(bd);
    const help=mk('hb-help','❓','Hilfe','rgba(90,110,200,.9)',()=>ZHelpPanel.open());
    const always=[by('#hud-toggle'),goals,q('#hb-shop'),find(/goToMarket/),q('#rewardHbZoo'),q('#hb-footstep-style')].filter(Boolean);
    const gb=mk('hb-guest','📖','Gästebuch','rgba(176,120,60,.95)',()=>ZGuest.open()); const gbd=document.createElement('span'); gbd.id='zguest-badge'; gbd.style.cssText='position:absolute;top:-4px;right:-2px;color:#fff;background:#e63946;font:900 .6rem Arial;border-radius:9px;padding:1px 5px;pointer-events:none;display:none'; gb.appendChild(gbd);
    const social=[gb,find(/open\('report'\)/),find(/open\('trade'\)/),q('#hb-group-join'),find(/showZooRangliste/),q('#hb-tipp')].filter(Boolean);
    const more=[help,q('#tipsToggleBtn'),q('#hb-mtpass'),find(/DailyCalendar/),find(/open\('sound'\)/),q('#hb-base-editor'),q('#hb-world-editor'),q('#hb-tester-panel'),find(/location\.reload/)].filter(Boolean);
    const menu=q('#hb-menu');
    const group=(k,ic,lb,items)=>{ const hd=mk('hb-grp-'+k,ic,lb+' ▾','rgba(255,255,255,.14)',()=>{}); hd.classList.add('zb-hd'); const c=document.createElement('div'); c.className='hb zb-grp'; c.id='zb-grp-'+k; items.forEach(i=>c.appendChild(i)); const set=v=>{ c.classList.toggle('zb-c',v); hd.querySelector('.hbl').textContent=lb+(v?' ▸':' ▾'); setC(k,v); }; hd.onclick=()=>set(!c.classList.contains('zb-c')); const v=getC(k); c.classList.toggle('zb-c',v); hd.querySelector('.hbl').textContent=lb+(v?' ▸':' ▾'); return [hd,c]; };
    const seq=[...always,...group('soz','👥','Sozial',social),...group('mehr','🧰','Mehr',more)];
    seq.forEach(e=>hl.insertBefore(e,menu)); built=true; return true;
  };
  const bi=setInterval(()=>{ try{ if(build()) clearInterval(bi); }catch(e){ clearInterval(bi); } },700);

  // ── ❓ Hilfe-Fenster ──
  const H=window.ZHelpPanel={
    el:null,
    close(){ if(H.el){ H.el.remove(); H.el=null; } },
    open(){
      H.close(); try{ ['gond','index','shop','reb','enc','menu','adm','sound','report','rank'].forEach(p=>ZP.close(p)); }catch(e){}
      const o=document.createElement('div'); o.id='zhelp-panel'; o.style.cssText='position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;padding:16px'; o.onclick=e=>{ if(e.target===o) H.close(); }; H.el=o;
      const T=(window.ZHelp&&ZHelp.TIPS)||{}; const reb=(ZS.zoo&&ZS.zoo.reb)||0; let rr='';
      for(let n=1;n<=Math.min(reb,12);n++){ try{ if(typeof REB_TUT!=='undefined'&&REB_TUT[n]) rr+='<button class="zhp-b" data-r="'+n+'">🔄 Neu durch Rebirth '+n+'</button>'; }catch(e){} }
      o.innerHTML='<div style="background:linear-gradient(135deg,#1c2040,#11142a);border:1px solid rgba(140,160,255,.45);border-radius:16px;padding:16px;max-width:420px;width:100%;max-height:88vh;overflow-y:auto;color:#fff;font-family:Arial,sans-serif"><div style="display:flex;align-items:center;margin-bottom:8px"><h2 style="flex:1;margin:0;font-size:1.1rem;color:#9fb3ff">❓ Hilfe &amp; Tipps</h2><button onclick="ZHelpPanel.close()" style="background:none;border:none;color:#fff;font-size:1.2rem;cursor:pointer">✕</button></div>'
        +'<style>.zhp-b{display:block;width:100%;text-align:left;background:rgba(255,255,255,.1);color:#fff;border:1px solid rgba(255,255,255,.15);border-radius:10px;padding:10px 12px;margin-bottom:6px;font:700 .82rem Arial;cursor:pointer}.zhp-b:active{background:rgba(255,255,255,.2)}</style>'
        +'<div style="font-size:.72rem;color:rgba(255,255,255,.6);margin-bottom:8px">Tippe auf etwas, um es dir nochmal zeigen zu lassen.</div>'
        +'<button class="zhp-b" data-t="1" style="background:rgba(124,252,0,.18)">🎓 Ganzes Tutorial nochmal von vorne</button>'
        +rr
        +'<div style="font-weight:900;font-size:.8rem;margin:10px 0 6px;color:#ffd54f">💡 Kurz erklärt</div>'
        +Object.keys(T).map(k=>'<button class="zhp-b" data-k="'+k+'">'+((T[k].s||[])[0]||'💡')+' '+T[k].t+'</button>').join('')
        +'<div style="font-size:.66rem;color:rgba(255,255,255,.45);margin-top:8px">Tipp: Im Chat geht auch /tipps.</div></div>';
      document.body.appendChild(o);
      o.querySelectorAll('.zhp-b').forEach(b=>b.onclick=()=>{ const k=b.dataset.k, r=b.dataset.r; H.close(); setTimeout(()=>{ try{ if(k) ZHelp.tip(k,true); else if(r) Tutorial.startReb(+r); else Tutorial.start(); }catch(e){ toast('❌ Das ging gerade nicht'); } },200); });
    }
  };
})();

;
/* ZCoaster2 (v705) — 🎢 Mega-Achterbahn (Admin-Event): ~700 m, 58 m hoch, Kurven. Mit ◀ ▶ in die Kurve lehnen – falsch lehnen = Absturz (alle Herzen weg), Ziel erreicht = 5 % Guthaben. RTDB zoo_coaster2 {id,until}. */
/* ZDrone (v705) — 🚁 zweite Kameraansicht (Drohne hinter dir), Knopf unter dem Heim-Pfeil oben rechts. */
(function(){
  'use strict';
  const RT=()=>{ try{ return (typeof _rtdb!=='undefined'&&_rtdb)?_rtdb:null; }catch(e){ return null; } };
  let _off=0; const tn=()=>Date.now()+_off;
  const toast=(m,ms)=>{ try{ ZP.toast(m,ms||3000); }catch(e){} };
  const big=(t,c,ms)=>{ try{ ZG._bigText(t,c||'#fff',ms||2500); }catch(e){} };
  const ready=()=>{ try{ return !!(typeof ZG!=='undefined'&&ZG.scene&&ZG.pl&&ZG.cam&&typeof ZS!=='undefined'&&ZS.zoo&&ZS.player&&typeof THREE!=='undefined'); }catch(e){ return false; } };
  const busy=()=>{ try{ return !!(ZG._arcadeActive||ZG._jumpActive||ZG._mazeActive||ZG._trashActive||ZG._iceRoomActive||ZG._meadowActive); }catch(e){ return false; } };
  const bal=()=>{ try{ return (ZS.dsMT||0)+(ZS.zoo.mt||0); }catch(e){ return 0; } };
  const fmt=v=>{ try{ if(typeof $mt==='function') return $mt(v); }catch(e){} return Math.round(v).toLocaleString('de-CH'); };
  const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
  const G=9.81, OX=140, OZ=-35, SP=.8;
  // Strecke: S = gerade (m) · L/R = Winkel, Radius (L = Rechtskurve des Fahrgasts in Fahrtrichtung, siehe cv)
  const PROG=[['S',12],['S',74],['S',16],['S',38],['L',180,22],['R',180,19],['L',180,17],['S',28],['S',30],['L',180,16],['R',90,21],['R',180,20],['L',180,20],['S',33],['L',90,19],['S',38],['R',180,15],['L',6,15],['S',103],['R',186,15],['S',26]];
  const KEY=[[0,.9],[12,.9],[86,58],[102,60],[140,3],[160,3],[205,26],[245,5],[290,30],[330,6],[375,24],[410,4],[450,27],[490,5],[530,22],[570,4],[610,18],[650,3],[690,.9]];
  let KEYX=KEY; const hgt=s=>{ const K=KEYX; if(s<=K[0][0]) return K[0][1]; for(let i=1;i<K.length;i++){ if(s<=K[i][0]){ const a=K[i-1], b=K[i], t=(s-a[0])/(b[0]-a[0]); return a[1]+(b[1]-a[1])*(0.5-0.5*Math.cos(Math.PI*t)); } } return K[K.length-1][1]; };
  const spr=(draw,w,h,sx,sy)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h); const tex=new THREE.CanvasTexture(c); const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false})); s.scale.set(sx,sy,1); return s; };
  const sweep=(P,F,off,up,w,h)=>{ const N=P.length, pos=[], idx=[]; const cs=[[-w,-h],[w,-h],[w,h],[-w,h]];
    for(let i=0;i<N;i++){ const c=P[i].clone().addScaledVector(F.R[i],off).addScaledVector(F.U[i],up); cs.forEach(([a,b])=>{ const v=c.clone().addScaledVector(F.R[i],a).addScaledVector(F.U[i],b); pos.push(v.x,v.y,v.z); }); }
    for(let i=0;i<N-1;i++) for(let k=0;k<4;k++){ const a=i*4+k, b=i*4+(k+1)%4, c=(i+1)*4+k, d=(i+1)*4+(k+1)%4; idx.push(a,c,b,b,c,d); }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setIndex(idx); g.computeVertexNormals(); return g; };

  function gen(){
    // horizontale Bahn in 0,5-m-Schritten + Höhenprofil
    let x=0,z=0,psi=0,sh=0; const h=.5, raw=[{x:0,z:0,sh:0,cv:0}];
    for(const g of PROG){
      if(g[0]==='S'){ const n=Math.max(1,Math.round(g[1]/h)), l=g[1]/n; for(let i=0;i<n;i++){ x+=Math.sin(psi)*l; z+=Math.cos(psi)*l; sh+=l; raw.push({x,z,sh,cv:0}); } }
      else { const sg=g[0]==='R'?1:-1, r=g[2], A=g[1]*Math.PI/180, n=Math.max(1,Math.round(A*r/h)), dp=sg*A/n, ch=2*r*Math.sin(Math.abs(dp)/2); for(let i=0;i<n;i++){ const pm=psi+dp/2; x+=Math.sin(pm)*ch; z+=Math.cos(pm)*ch; psi+=dp; sh+=ch; raw.push({x,z,sh,cv:-sg}); } }
    }
    // Schleife schliessen: Endfehler über die letzten 40 m ausgleichen → Ende = Startbahnhof
    { const ex=x, ez=z, n=raw.length; for(let i=0;i<n;i++){ const f=Math.max(0,(raw[i].sh-(sh-40))/40); raw[i].x-=ex*f*f*(3-2*f); raw[i].z-=ez*f*f*(3-2*f); } }
    { const K=KEY.slice(); let a=690,i=0; while(a+45<sh-40){ a+=45; K.push([a,(i++%2)?4:14]); } K.push([sh-30,2]); K.push([sh,.9]); KEYX=K; }
    const P3=raw.map(p=>V3(OX+p.x,hgt(p.sh),OZ+p.z));
    // gleichmässig neu abtasten
    const P=[P3[0].clone()], SH=[0], CV=[0]; let acc=0;
    for(let i=1;i<P3.length;i++){ let a=P3[i-1], b=P3[i], d=a.distanceTo(b); while(acc+d>=SP){ const t=(SP-acc)/d; const q=a.clone().lerp(b,t); P.push(q); SH.push(raw[i-1].sh+(raw[i].sh-raw[i-1].sh)*t); CV.push(raw[i].cv); a=q; d=a.distanceTo(b); acc=0; } acc+=d; }
    const N=P.length, T=[]; for(let i=0;i<N;i++){ const a=P[Math.max(0,i-1)], b=P[Math.min(N-1,i+1)]; T.push(b.clone().sub(a).normalize()); }
    // geglättete Kurvenrichtung → Schräglage
    const sm=[]; for(let i=0;i<N;i++){ let s=0,c=0; for(let k=-14;k<=14;k++){ const j=i+k; if(j>=0&&j<N){ s+=CV[j]; c++; } } sm.push(s/c); }
    const U=[], R=[]; let u=V3(0,1,0); u.sub(T[0].clone().multiplyScalar(u.dot(T[0]))).normalize(); U.push(u);
    for(let i=1;i<N;i++){ const q=new THREE.Quaternion().setFromUnitVectors(T[i-1],T[i]); u=U[i-1].clone().applyQuaternion(q); u.sub(T[i].clone().multiplyScalar(u.dot(T[i]))).normalize(); U.push(u); }
    for(let i=0;i<N;i++){ const r0=T[i].clone().cross(U[i]).normalize(); const fl=Math.abs(T[i].y)>.93?0:1; const phi=.55*sm[i]*fl; U[i]=U[i].clone().multiplyScalar(Math.cos(phi)).addScaledVector(r0,Math.sin(phi)).normalize(); R.push(T[i].clone().cross(U[i]).normalize()); }
    const S=new Float32Array(N); for(let i=1;i<N;i++) S[i]=S[i-1]+P[i].distanceTo(P[i-1]);
    return {P,T,U,R,S,SH,CV,N,L:S[N-1]};
  }

  const C=window.ZCoaster2={
    adm:null, local:0, grp:null, K:null, cars:[], ride:null, id:null, ann:null, _inited:false, view:'ego', _ac:null, inp:{l:0,r:0}, lean:0,
    init(){ if(C._inited) return; const r=RT(); if(!r) return; C._inited=true; try{ r.ref('.info/serverTimeOffset').on('value',s=>{ _off=+s.val()||0; }); }catch(e){} try{ r.ref('zoo_coaster2').on('value',s=>{ C.adm=s.val()||null; }); }catch(e){} },
    state(){ const n=tn(), a=C.adm; if(a&&a.until>n) return {id:String(a.id),until:a.until}; if(C.local>Date.now()) return {id:'local',until:C.local}; return null; },
    adminStart(mins){ const r=RT(); if(!r){ toast('❌ Keine Verbindung'); return; } mins=Math.max(1,Math.min(180,+mins||15)); r.ref('zoo_coaster2').set({id:String(Date.now()),until:tn()+mins*60000,by:ZS.player}).then(()=>toast('🎢 Mega-Achterbahn für alle gestartet ('+mins+' Min)')).catch(e=>toast('❌ '+e.message)); },
    adminStop(){ const r=RT(); if(r) r.ref('zoo_coaster2').set({id:String(Date.now()),until:0,by:ZS.player}).then(()=>toast('⏹️ Mega-Achterbahn beendet')); C.local=0; },
    adminLocal(){ C.local=Date.now()+30*60000; toast('🎢 Test: Mega-Achterbahn nur bei dir (30 Min)'); },
    _build(){
      if(C.grp) return; const K=gen(); C.K=K; const {P,R,U,T,N}=K; const g=new THREE.Group();
      const mR=new THREE.MeshLambertMaterial({color:0xffb703}), mS=new THREE.MeshLambertMaterial({color:0x7b2cbf}), mT=new THREE.MeshLambertMaterial({color:0x4a3a2a}), mP=new THREE.MeshLambertMaterial({color:0xb8b8c4});
      [-0.62,0.62].forEach(o=>g.add(new THREE.Mesh(sweep(P,K,o,0,.07,.07),mR))); g.add(new THREE.Mesh(sweep(P,K,0,-.5,.17,.17),mS));
      const step=4, nt=Math.floor(N/step); const tie=new THREE.InstancedMesh(new THREE.BoxGeometry(1.5,.07,.16),mT,nt); const m4=new THREE.Matrix4();
      for(let k=0;k<nt;k++){ const i=k*step; m4.makeBasis(R[i],U[i],T[i]); m4.setPosition(P[i].x,P[i].y-.07,P[i].z); tie.setMatrixAt(k,m4); } g.add(tie);
      const sup=[]; for(let i=0;i<N;i+=Math.round(10/SP)){ if(P[i].y>2) sup.push(i); }
      const col=new THREE.InstancedMesh(new THREE.CylinderGeometry(.2,.28,1,8),mP,sup.length); sup.forEach((i,k)=>{ const hh=P[i].y-.7; m4.makeScale(1,hh,1); m4.setPosition(P[i].x,hh/2,P[i].z); col.setMatrixAt(k,m4); }); g.add(col);
      const plat=new THREE.Mesh(new THREE.BoxGeometry(3.4,.6,14),new THREE.MeshLambertMaterial({color:0xcfc2a8})); plat.position.set(OX+3.2,.3,OZ+5); g.add(plat);
      const roof=new THREE.Mesh(new THREE.BoxGeometry(6.2,.25,14.4),new THREE.MeshLambertMaterial({color:0x7b2cbf})); roof.position.set(OX+1.2,4.3,OZ+5); g.add(roof);
      [[0,-1.7],[0,4.6],[10,-1.7],[10,4.6]].forEach(([dz,dx])=>{ const p=new THREE.Mesh(new THREE.CylinderGeometry(.15,.15,4.2,8),mP); p.position.set(OX+dx,2.1,OZ+dz); g.add(p); });
      const sign=spr((c,w,h)=>{ c.fillStyle='rgba(0,0,0,.78)'; c.fillRect(0,0,w,h); c.strokeStyle='#ffb703'; c.lineWidth=6; c.strokeRect(6,6,w-12,h-12); c.fillStyle='#ffb703'; c.font='bold 44px Arial'; c.textAlign='center'; c.fillText('🎢 MEGA-ACHTERBAHN',w/2,70); },640,110,8,1.4); sign.position.set(OX+1.2,6.3,OZ+5); g.add(sign);
      g.userData.board={x:OX+3.2,z:OZ+5};
      // Kurven-Schilder an Kurveneinfahrten (gross, gut sichtbar)
      let prev=0; for(let i=0;i<N;i++){ if(K.CV[i]!==0&&prev===0){ const sgn=K.CV[i], q=P[i].clone().addScaledVector(U[i],4.2); const s=spr((c,w,h)=>{ c.fillStyle=sgn>0?'rgba(30,130,230,.9)':'rgba(230,80,40,.9)'; c.fillRect(0,0,w,h); c.fillStyle='#fff'; c.font='bold 70px Arial'; c.textAlign='center'; c.fillText(sgn>0?'RECHTS ▶':'◀ LINKS',w/2,86); },420,120,3.4,1); s.position.copy(q); g.add(s); } prev=K.CV[i]; }
      ZG.scene.add(g); C.grp=g;
      const train=new THREE.Group(); C.cars=[];
      for(let k=0;k<3;k++){ const car=new THREE.Group(); const body=new THREE.Mesh(new THREE.BoxGeometry(1.5,.5,2.1),new THREE.MeshLambertMaterial({color:k?0x7b2cbf:0xffb703})); body.position.y=.05; car.add(body); const back=new THREE.Mesh(new THREE.BoxGeometry(1.4,.8,.25),new THREE.MeshLambertMaterial({color:0x222222})); back.position.set(0,.6,.8); car.add(back); train.add(car); C.cars.push(car); }
      g.add(train); C.train=train; C._poseTrain(0);
    },
    _pose(s){
      const K=C.K, N=K.N; s=Math.max(0,Math.min(K.L,s)); let lo=0, hi=N-1; while(hi-lo>1){ const m=(lo+hi)>>1; if(K.S[m]<=s) lo=m; else hi=m; }
      const t=(s-K.S[lo])/Math.max(1e-6,K.S[hi]-K.S[lo]), i=lo, j=hi;
      const p=K.P[i].clone().lerp(K.P[j],t), T=K.T[i].clone().lerp(K.T[j],t).normalize(), U=K.U[i].clone().lerp(K.U[j],t).normalize(); U.sub(T.clone().multiplyScalar(U.dot(T))).normalize(); const R=T.clone().cross(U).normalize();
      return {p,T,U,R,i,sh:K.SH[i],cv:K.CV[i]};
    },
    _poseTrain(s){ C.cars.forEach((car,k)=>{ const q=C._pose(s-k*2.7); const m=new THREE.Matrix4(); m.makeBasis(q.R,q.U,q.T.clone().negate()); car.position.copy(q.p).addScaledVector(q.U,.45); car.quaternion.setFromRotationMatrix(m); }); },
    _destroy(){ try{ if(C.grp){ ZG.scene.remove(C.grp); C.grp.traverse(o=>{ if(o.material){ if(o.material.map) o.material.map.dispose(); o.material.dispose(); } if(o.geometry) o.geometry.dispose(); }); } }catch(e){} C.grp=null; C.K=null; C.cars=[]; ['zc2-chip','zc2-btn'].forEach(id=>{ const e=document.getElementById(id); if(e) e.remove(); }); },
    // ── Fahrt ──
    board(){
      if(C.ride||!C.grp||busy()||ZG._coasterRide) return; try{ if(ZG.carrying){ toast('🐾 Setz zuerst dein Tier im Gehege ab!',2500); return; } }catch(e){}
      C.ride={s:0,v:0,t:0,phase:'lift',yaw0:ZG.yaw||0,zone:0,zt:0,bad:0,done:false,fall:null}; C.lean=0; C.view='ego'; ZG._coasterRide=true;
      C._ui(); C._audio(true); big('🎢 LOS GEHT’S!','#ffb703',2200); toast('⬆️ Lift: Gleich kommen Kurven! In Rechtskurven nach RECHTS lehnen, in Linkskurven nach LINKS – sonst fällst du runter!',6000);
    },
    _cleanup(){ C.ride=null; ZG._coasterRide=false; C._audio(false); ['zc2-ui','zc2-av'].forEach(id=>{ const u=document.getElementById(id); if(u) u.remove(); }); try{ document.removeEventListener('keydown',C._kd); document.removeEventListener('keyup',C._ku); }catch(e){} C.inp={l:0,r:0}; if(C.avatar){ try{ ZG.scene.remove(C.avatar); }catch(e){} C.avatar=null; } try{ ZG.cam.up.set(0,1,0); }catch(e){} if(C.cars&&C.cars.length&&C.K) C._poseTrain(0); },
    _toStation(){ ZG.pl.x=OX+3.2; ZG.pl.z=OZ+5; ZG.pl.y=1.7; ZG.pitch=0; ZG.yaw=-Math.PI/2; },
    _finish(){ const r=C.ride; if(!r||r.done) return; r.done=true; const z=ZS.zoo, rw=Math.max(200,Math.floor(bal()*.05)); z.mt=(z.mt||0)+rw; try{ ZS.save&&ZS.save(); ZG._updHUD&&ZG._updHUD(); }catch(e){} C._cleanup(); C._toStation(); big('🏆 GESCHAFFT!','#ffd54f',3000); toast('🎢 Perfekte Fahrt! +'+fmt(rw)+' MT (5 % deines Guthabens)',6000); },
    _crash(){ const r=C.ride; if(!r||r.done) return; r.done=true; C._cleanup(); C._toStation(); big('💥 RUNTERGEFALLEN!','#ff5252',3000); toast('💥 Du bist aus der Achterbahn gefallen – alle Herzen verloren!',5000); setTimeout(()=>{ try{ ZHearts.hit(ZHearts.max+5,'coaster'); }catch(e){} },150); },
    exit(){ if(!C.ride||C.ride.fall) return; C._cleanup(); C._toStation(); toast('🚪 Du bist ausgestiegen.',2500); },
    _ui(){
      let u=document.getElementById('zc2-ui'); if(u) u.remove(); u=document.createElement('div'); u.id='zc2-ui';
      const b='position:fixed;bottom:200px;z-index:645;width:min(40vw,170px);height:90px;border:3px solid rgba(255,255,255,.7);border-radius:22px;color:#fff;font:900 1.15rem Arial;display:flex;align-items:center;justify-content:center;touch-action:none;user-select:none;-webkit-user-select:none;';
      u.innerHTML='<div id="zc2-info" style="position:fixed;left:50%;top:104px;transform:translateX(-50%);z-index:640;background:rgba(0,0,0,.55);color:#fff;font:800 .8rem Arial;padding:5px 12px;border-radius:14px;pointer-events:none;white-space:nowrap"></div>'
       +'<div id="zc2-warn" style="position:fixed;left:50%;top:138px;transform:translateX(-50%);z-index:641;font:900 1.25rem Arial;padding:8px 18px;border-radius:16px;pointer-events:none;display:none;white-space:nowrap;box-shadow:0 4px 14px rgba(0,0,0,.5)"></div>'
       +'<div id="zc2-bar" style="position:fixed;left:50%;bottom:300px;transform:translateX(-50%);z-index:641;width:160px;height:12px;border-radius:7px;background:rgba(0,0,0,.55);pointer-events:none"><div style="position:absolute;left:50%;top:-2px;width:2px;height:16px;background:#fff"></div><div id="zc2-mk" style="position:absolute;top:-4px;width:16px;height:20px;border-radius:8px;background:#ffd54f;left:72px"></div></div>'
       +'<div id="zc2-l" style="'+b+'left:8px;background:rgba(230,80,40,.78)">◀ LINKS</div><div id="zc2-r" style="'+b+'right:8px;background:rgba(30,130,230,.78)">RECHTS ▶</div>'
       +'<button id="zc2-view" style="position:fixed;right:10px;top:150px;z-index:640;background:rgba(0,0,0,.6);color:#fff;border:1px solid rgba(255,255,255,.4);border-radius:16px;padding:8px 12px;font:800 .75rem Arial;cursor:pointer">👁️ Ansicht</button>'
       +'<button id="zc2-exit" style="position:fixed;right:10px;top:192px;z-index:640;background:rgba(150,20,20,.85);color:#fff;border:none;border-radius:16px;padding:8px 12px;font:800 .75rem Arial;cursor:pointer;display:none">🚪 Aussteigen</button>';
      document.body.appendChild(u);
      const hold=(id,k)=>{ const e=u.querySelector(id); const on=ev=>{ ev.preventDefault(); ev.stopPropagation(); C.inp[k]=1; }, off=ev=>{ ev.preventDefault(); ev.stopPropagation(); C.inp[k]=0; };
        e.addEventListener('touchstart',on,{passive:false}); e.addEventListener('touchend',off,{passive:false}); e.addEventListener('touchcancel',off,{passive:false}); e.addEventListener('mousedown',on); e.addEventListener('mouseup',off); e.addEventListener('mouseleave',off); };
      hold('#zc2-l','l'); hold('#zc2-r','r');
      C._kd=e=>{ if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A') C.inp.l=1; if(e.key==='ArrowRight'||e.key==='d'||e.key==='D') C.inp.r=1; }; C._ku=e=>{ if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A') C.inp.l=0; if(e.key==='ArrowRight'||e.key==='d'||e.key==='D') C.inp.r=0; };
      document.addEventListener('keydown',C._kd); document.addEventListener('keyup',C._ku);
      u.querySelector('#zc2-view').onclick=()=>{ C.view=C.view==='ego'?'chase':'ego'; };
      u.querySelector('#zc2-exit').onclick=()=>{ if(confirm('Fahrt abbrechen und aussteigen?')) C.exit(); };
    },
    _audio(on){ try{ if(on){ const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return; const c=C._ac||(C._ac=new AC()); if(c.state==='suspended') c.resume(); const nb=c.createBuffer(1,c.sampleRate*2,c.sampleRate), d=nb.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; const src=c.createBufferSource(); src.buffer=nb; src.loop=true; const bp=c.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=500; bp.Q.value=.6; const g=c.createGain(); g.gain.value=0; src.connect(bp); bp.connect(g); g.connect(c.destination); src.start(); C._wind={src,bp,g}; } else if(C._wind){ const w=C._wind; C._wind=null; try{ w.g.gain.setTargetAtTime(0,C._ac.currentTime,.2); setTimeout(()=>{ try{ w.src.stop(); }catch(e){} },700); }catch(e){} } }catch(e){} },
    _step(dt){
      const r=C.ride; if(!r||r.done) return; dt=Math.min(.08,dt); r.t+=dt; const K=C.K;
      if(r.fall){ // freier Fall
        const f=r.fall; f.vel.y-=G*dt; f.pos.addScaledVector(f.vel,dt); f.rot+=dt*5; if(C.avatar){ C.avatar.position.copy(f.pos); }
        ZG.pl.x=f.pos.x; ZG.pl.z=f.pos.z; ZG.pl.y=Math.max(1.7,f.pos.y);
        if(f.pos.y<=.5){ C._crash(); } return; }
      const q=C._pose(r.s), crestI=C._crestI||(C._crestI=(()=>{ let b=0; for(let i=0;i<K.N;i++) if(K.P[i].y>K.P[b].y) b=i; return b; })()), crestS=K.S[crestI], crestY=K.P[crestI].y;
      const rem=K.L-r.s; let v;
      if(r.s<crestS-8){ v=5.2; r.phase='lift'; } else { r.phase=r.s<crestS+10?'crest':'run'; v=Math.sqrt(Math.max(16,2*G*.8*(crestY-q.p.y))); if(r.s<crestS+4) v=Math.min(v,3.5); }
      if(q.cv!==0) v=Math.min(v,17); if(rem<22) v=Math.min(v,Math.max(2,rem*.6)); v=Math.min(v,28);
      r.v+=(v-r.v)*Math.min(1,dt*3); r.s+=r.v*dt;
      // Lehnen
      const tgt=(C.inp.r?1:0)-(C.inp.l?1:0); C.lean+=(tgt-C.lean)*Math.min(1,dt*7);
      // Kurven-Prüfung (erst nach der ersten Abfahrt)
      const armed=q.sh>150; const zv=q.cv;
      if(zv!==r.zone){ r.zone=zv; r.zt=0; } else r.zt+=dt;
      if(armed&&r.zt>.9){
        if(zv!==0){ const ok=C.lean*zv; if(ok<-.5&&r.zt>1.1) r.bad=9; else if(ok<.4) r.bad+=dt; else r.bad=Math.max(0,r.bad-dt*2); }
        else { if(Math.abs(C.lean)>.55) r.bad+=dt; else r.bad=Math.max(0,r.bad-dt*2); }
        if(r.bad>(zv!==0?.85:.7)){ // Absturz!
          const p=q.p.clone().addScaledVector(q.U,.9); r.fall={pos:p,vel:q.T.clone().multiplyScalar(r.v*.8).add(q.R.clone().multiplyScalar(C.lean*4)).add(V3(0,2,0)),rot:0};
          const av=C._avatar(); av.position.copy(p); big('😱 AAAH!','#ff5252',1400); try{ if(C._ac){ const c=C._ac,o=c.createOscillator(),g=c.createGain(); o.type='sawtooth'; o.frequency.setValueAtTime(700,c.currentTime); o.frequency.exponentialRampToValueAtTime(120,c.currentTime+1.1); g.gain.setValueAtTime(.12,c.currentTime); g.gain.exponentialRampToValueAtTime(.001,c.currentTime+1.2); o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime+1.3); } }catch(e){} return; }
      } else if(r.zt>.9) r.bad=Math.max(0,r.bad-dt*2);
      if(r.s>=K.L-.2){ C._finish(); return; }
      C._poseTrain(r.s);
      const sp=q.p.clone().addScaledVector(q.U,.62); ZG.pl.x=sp.x; ZG.pl.z=sp.z; ZG.pl.y=sp.y+1.2;
      // Hinweis (vorausschauend 32 m)
      let warn=0, dist=0; if(armed){ if(zv!==0){ warn=zv; } else { for(let k=1;k<42;k++){ const j=Math.min(K.N-1,q.i+k*2); if(K.CV[j]!==0){ warn=K.CV[j]; dist=k*2*SP; break; } } } }
      const w=document.getElementById('zc2-warn'); if(w){ if(warn){ w.style.display='block'; const inCurve=zv!==0; w.style.background=warn>0?'rgba(30,130,230,.92)':'rgba(230,80,40,.92)'; w.style.color='#fff'; w.textContent=(warn>0?'RECHTSKURVE ▶ nach RECHTS lehnen!':'◀ LINKSKURVE – nach LINKS lehnen!')+(inCurve?'':' · in '+Math.round(dist)+' m'); } else w.style.display='none'; }
      const inf=document.getElementById('zc2-info'); if(inf) inf.textContent='🎢 '+Math.round(r.v*3.6)+' km/h · Höhe '+Math.max(0,Math.round(q.p.y-.9))+' m · '+Math.round(r.s/K.L*100)+'%'+(r.phase==='lift'?' · ⬆ Lift':'');
      const mk=document.getElementById('zc2-mk'); if(mk){ mk.style.left=(72+C.lean*72)+'px'; mk.style.background=r.bad>.3?'#ff5252':'#ffd54f'; }
      const ex=document.getElementById('zc2-exit'); if(ex) ex.style.display=r.t>4?'block':'none';
      if(C._wind){ const k=Math.min(1,r.v/24); C._wind.g.gain.setTargetAtTime(.02+.2*k*k,C._ac.currentTime,.1); C._wind.bp.frequency.setTargetAtTime(300+1500*k,C._ac.currentTime,.1); }
    },
    _avatar(){ if(C.avatar) return C.avatar; const g=new THREE.Group(); const b=new THREE.Mesh(new THREE.SphereGeometry(.4,10,8),new THREE.MeshBasicMaterial({color:0xffcc66})); g.add(b); let e='🧭'; try{ e=(ZS.char&&(ZS.char.e||ZS.char.emoji))||'🧭'; }catch(x){} const h=ZG._makeEmojiSprite(e); h.position.y=.9; h.scale.set(1.5,1.5,1); g.add(h); ZG.scene.add(g); C.avatar=g; return g; },
    _cam(){
      const r=C.ride; if(!r||!C.K) return; const cam=ZG.cam;
      if(r.fall){ const f=r.fall; cam.position.set(f.pos.x-f.vel.x*.25,f.pos.y+3.2,f.pos.z-f.vel.z*.25); cam.lookAt(f.pos); return; }
      const q=C._pose(r.s);
      if(C.view==='ego'){
        cam.position.copy(q.p).addScaledVector(q.U,1.25).addScaledVector(q.T,.15);
        const m=new THREE.Matrix4(); m.makeBasis(q.R,q.U,q.T.clone().negate()); const qf=new THREE.Quaternion().setFromRotationMatrix(m);
        let dy=(ZG.yaw||0)-r.yaw0; while(dy>Math.PI) dy-=2*Math.PI; while(dy<-Math.PI) dy+=2*Math.PI; dy=Math.max(-2.2,Math.min(2.2,dy));
        const qy=new THREE.Quaternion().setFromAxisAngle(V3(0,1,0),dy), qx=new THREE.Quaternion().setFromAxisAngle(V3(1,0,0),Math.max(-1.2,Math.min(1.2,ZG.pitch||0))), qz=new THREE.Quaternion().setFromAxisAngle(V3(0,0,1),-C.lean*.3);
        cam.quaternion.copy(qf).multiply(qy).multiply(qx).multiply(qz);
      } else { const back=C._pose(r.s-8).p; const tgt=q.p.clone().addScaledVector(q.U,.8); cam.position.copy(back).add(V3(0,3.6,0)).addScaledVector(q.U,1.2); cam.lookAt(tgt); }
    },
    tick(){
      try{
        if(!ready()) return; C.init(); const st=C.state();
        if(!st){ if(C.ride) return; if(C.grp){ C._destroy(); C.id=null; } return; }
        if(C.id!==st.id){ C.id=st.id; if(C.ann!==st.id&&st.until-tn()>30000){ C.ann=st.id; big('🎢 Die MEGA-Achterbahn ist da!','#ffb703',3500); toast('🎢 Admin-Event: Mega-Achterbahn im Osten! Hoch hinaus, aber in den Kurven richtig lehnen – sonst Absturz! Gelingt die ganze Fahrt: +5 % Guthaben.',8000); } }
        C._build(); const b=C.grp.userData.board, d=Math.hypot(b.x-ZG.pl.x,b.z-ZG.pl.z);
        let chip=document.getElementById('zc2-chip'); if(!chip){ chip=document.createElement('div'); chip.id='zc2-chip'; chip.style.cssText='position:fixed;left:8px;top:214px;z-index:600;background:rgba(0,0,0,.62);color:#fff;font:800 .72rem Arial;padding:5px 10px;border-radius:14px;cursor:pointer;border-left:4px solid #7b2cbf'; chip.onclick=()=>{ if(C.ride) return; const dd=Math.hypot(b.x-ZG.pl.x,b.z-ZG.pl.z); if(dd>12&&!busy()){ C._toStation(); toast('📍 Du stehst am Bahnsteig der Mega-Achterbahn.',2500); } else toast('Geh zum Zug am Gleis und tippe auf „Einsteigen“.',2500); }; document.body.appendChild(chip); }
        const left=Math.max(0,st.until-tn()); chip.style.display=C.ride?'none':'block'; chip.textContent='🎢 Mega-Bahn · '+Math.floor(left/60000)+':'+String(Math.floor(left/1000)%60).padStart(2,'0')+' · '+(d>12?'tippen = hinbeamen':'am Bahnsteig');
        let btn=document.getElementById('zc2-btn'); if(!btn){ btn=document.createElement('button'); btn.id='zc2-btn'; btn.style.cssText='position:fixed;left:50%;bottom:210px;transform:translateX(-50%);z-index:630;background:#7b2cbf;color:#fff;border:2px solid #ffb703;border-radius:24px;padding:12px 22px;font:900 1rem Arial;box-shadow:0 4px 16px rgba(0,0,0,.5);cursor:pointer;display:none'; btn.textContent='🎢 Einsteigen'; btn.onclick=()=>C.board(); document.body.appendChild(btn); }
        btn.style.display=(!C.ride&&d<6&&st.until>tn()&&!busy())?'block':'none';
      }catch(e){}
    }
  };
  setInterval(C.tick,1000);
  let _last=performance.now();
  const loop=()=>{ const n=performance.now(), dt=(n-_last)/1000; _last=n; try{ if(C.ride) C._step(dt); }catch(e){} requestAnimationFrame(loop); }; requestAnimationFrame(loop);

  // ═════════════ 🚁 Drohnen-Kamera ═════════════
  const D=window.ZDrone={
    on:false, pos:null, av:null, _ch:null, _t:performance.now(),
    set(v){ D.on=!!v; try{ localStorage.setItem('zdrone',D.on?'1':'0'); }catch(e){} D.pos=null; if(!D.on) D._rm(); const b=document.getElementById('zdrone-btn'); if(b) b.style.background=D.on?'rgba(46,160,255,.92)':'rgba(0,0,0,.7)'; toast(D.on?'🚁 Drohnen-Kamera an – wische zum Drehen':'👁️ Ego-Ansicht',2200); },
    toggle(){ D.set(!D.on); },
    _rm(){ if(D.av){ try{ ZG.scene.remove(D.av); }catch(e){} D.av=null; D._ch=null; } },
    _avatar(){ let e='🧭'; try{ e=(ZS.char&&(ZS.char.e||ZS.char.emoji))||'🧭'; }catch(x){} if(D.av&&D._ch===e) return D.av; D._rm(); const g=new THREE.Group(); const body=new THREE.Mesh(new THREE.SphereGeometry(.42,12,10),new THREE.MeshBasicMaterial({color:0xffcc66})); body.scale.set(1,1.05,1); body.position.y=.58; g.add(body); const feet=new THREE.MeshBasicMaterial({color:0x5a4a3a}); [-1,1].forEach(s=>{ const f=new THREE.Mesh(new THREE.SphereGeometry(.16,8,6),feet); f.scale.set(1,.6,1.2); f.position.set(s*.2,.06,.05); g.add(f); }); const h=ZG._makeEmojiSprite(e); h.position.y=1.38; h.scale.set(1.55,1.55,1); g.add(h); ZG.scene.add(g); D.av=g; D._ch=e; return g; },
    cam(){
      if(!D.on||ZG._coasterRide||busy()){ if(D.av) D._rm(); return; }
      const now=performance.now(), dt=Math.min(.1,(now-D._t)/1000); D._t=now; const cam=ZG.cam, p=ZG.pl;
      const feet=p.y-(ZG._sizeMul?p.y*(1-1/ZG._sizeMul):0)-1.7+0; const av=D._avatar(); av.position.set(p.x,Math.max(0,p.y-1.7),p.z); av.rotation.y=(ZG.yaw||0);
      const yaw=ZG.yaw||0, pitch=Math.max(-1.2,Math.min(1.2,ZG.pitch||0)), fx=-Math.sin(yaw), fz=-Math.cos(yaw);
      const dist=6.2, hh=Math.max(1.4,3.4-pitch*5);
      const want=V3(p.x-fx*dist,p.y-1.7+hh,p.z-fz*dist); if(!D.pos) D.pos=want.clone(); D.pos.lerp(want,Math.min(1,dt*7)); if(D.pos.y<.7) D.pos.y=.7;
      cam.position.copy(D.pos); cam.lookAt(p.x+fx*2,p.y-1.7+1.2,p.z+fz*2);
    }
  };
  try{ D.on=localStorage.getItem('zdrone')==='1'; }catch(e){}
  const mkBtn=()=>{ if(document.getElementById('zdrone-btn')) return true; const w=document.getElementById('home-arrow-wrap'); if(!w||!document.getElementById('hud')) return false; const b=document.createElement('button'); b.id='zdrone-btn'; b.innerHTML='🚁<div style="font:800 .55rem Arial;margin-top:-2px">Kamera</div>'; const r=w.getBoundingClientRect(); b.style.cssText='position:fixed;right:34px;top:'+(Math.round(r.bottom)+6)+'px;z-index:140;width:52px;height:46px;border-radius:14px;border:2px solid rgba(255,255,255,.55);color:#fff;font-size:1.25rem;line-height:1;cursor:pointer;background:'+(D.on?'rgba(46,160,255,.92)':'rgba(0,0,0,.7)')+';padding:2px'; b.onclick=D.toggle; document.body.appendChild(b); return true; };
  setInterval(()=>{ try{ if(!ready()) return; mkBtn(); const b=document.getElementById('zdrone-btn'); if(b){ const hud=document.getElementById('hud'); const vis=!ZG._coasterRide&&!busy()&&(!hud||!hud.classList.contains('off')); b.style.display=vis?'block':'none'; const w=document.getElementById('home-arrow-wrap'); if(w){ const rr=w.getBoundingClientRect(); if(rr.bottom>0) b.style.top=(Math.round(rr.bottom)+6)+'px'; } } }catch(e){} },1000);
  // Kamera-Hooks (nach dem normalen Kamera-Update)
  const hook=()=>{ try{ if(typeof ZG==='undefined'||!ZG._camUpdate||ZG._camUpdate._zc2) return false; const o=ZG._camUpdate; const w=function(){ o.apply(this,arguments); try{ if(C.ride) C._cam(); else if(window.ZMeadow&&ZMeadow.cut) ZMeadow.cam(); else D.cam(); }catch(e){} }; w._zc2=1; ZG._camUpdate=w; return true; }catch(e){ return false; } };
  setInterval(()=>{ try{ hook(); }catch(e){} },700);
  try{ if(window.ZHelp) ZHelp.TIPS.coaster2={t:'Mega-Achterbahn',s:['🎢','➜','◀▶','➜','🏆'],d:'Lehne dich mit den zwei Knöpfen in jede Kurve: Rechtskurve = RECHTS, Linkskurve = LINKS. Falsch lehnen oder auf der Geraden wackeln = Absturz. Geschafft = 5 % Guthaben!'}; }catch(e){}
})();

;
/* v705 — Meldungen (#zt) liegen immer ÜBER den Herzen: Toast direkt an <body> hängen, damit er nicht in einem tieferen Stapel (#hud) steckt. */
(function(){ const fix=()=>{ try{ const t=document.getElementById('zt'); if(t&&t.parentElement!==document.body){ document.body.appendChild(t); } if(t){ t.style.zIndex='2147483000'; } }catch(e){} }; fix(); setInterval(fix,1500); })();


;
/* ZGuest (v705) — 📖 Besucher-Gästebuch: Gruß in fremdem Zoo hinterlassen (1× pro Tag je Spieler). RTDB zoo_guest/<spieler>/<von>_<tag>.
   ZQuiz (v705) — 🧠 Tier-Quiz nach dem Absetzen im Gehege (richtig = +1 % Guthaben). */
(function(){
  'use strict';
  const RT=()=>{ try{ return (typeof _rtdb!=='undefined'&&_rtdb)?_rtdb:null; }catch(e){ return null; } };
  const toast=(m,ms)=>{ try{ ZP.toast(m,ms||3000); }catch(e){} };
  const big=(t,c,ms)=>{ try{ ZG._bigText(t,c||'#fff',ms||2500); }catch(e){} };
  const ready=()=>{ try{ return !!(typeof ZS!=='undefined'&&ZS.zoo&&ZS.player&&typeof ZG!=='undefined'&&ZG.pl&&typeof ZP!=='undefined'); }catch(e){ return false; } };
  const busy=()=>{ try{ return !!(ZG._arcadeActive||ZG._jumpActive||ZG._mazeActive||ZG._trashActive||ZG._iceRoomActive||ZG._coasterRide); }catch(e){ return false; } };
  const bal=()=>{ try{ return (ZS.dsMT||0)+(ZS.zoo.mt||0); }catch(e){ return 0; } };
  const fmt=v=>{ try{ if(typeof $mt==='function') return $mt(v); }catch(e){} return Math.round(v).toLocaleString('de-CH'); };
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const key=n=>String(n||'').trim().toLowerCase().replace(/[.#$\[\]\/]/g,'_').slice(0,40);
  const day=()=>{ const d=new Date(); return d.getFullYear()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0'); };
  const PRE=[['❤️','Schöner Zoo!'],['🐘','Tolle Tiere!'],['🌟','Super gemacht!'],['😄','Hallo, ich war hier!'],['🎢','Bis zur Achterbahn!'],['🍀','Viel Glück!'],['🥟','Guten Appetit!'],['🏆','Du bist Spitze!']];
  const css=document.createElement('style'); css.textContent='.zgb-b{display:block;width:100%;text-align:left;background:rgba(255,255,255,.1);color:#fff;border:1px solid rgba(255,255,255,.15);border-radius:10px;padding:9px 11px;margin-bottom:6px;font:700 .8rem Arial;cursor:pointer}.zgb-b:active{background:rgba(255,255,255,.22)}.zgb-c{display:inline-block;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);color:#fff;border-radius:14px;padding:5px 10px;margin:0 5px 5px 0;font:700 .74rem Arial;cursor:pointer}.zgb-c.on{background:#b07a3c;border-color:#ffd54f}';
  document.head.appendChild(css);
  const Gu=window.ZGuest={
    el:null, entries:[], tab:'book', to:null, _inited:false, _maxT:0, _first:true, _tw:0,
    init(){ if(Gu._inited) return; const r=RT(); if(!r||!ready()) return; Gu._inited=true;
      try{ r.ref('zoo_guest/'+key(ZS.player)).on('value',s=>{ const v=s.val()||{}; const a=Object.keys(v).map(k=>Object.assign({k},v[k])).filter(x=>x&&x.from).sort((x,y)=>(y.t||0)-(x.t||0)).slice(0,40); const mx=a.length?Math.max(...a.map(x=>x.t||0)):0;
        if(!Gu._first){ a.filter(x=>(x.t||0)>Gu._maxT).forEach(x=>{ toast('📖 '+x.e+' '+x.from+' war in deinem Zoo: „'+x.msg+'“',5000); }); }
        Gu._first=false; Gu._maxT=Math.max(Gu._maxT,mx); Gu.entries=a; Gu._badge(); if(Gu.el) Gu.draw(); }); }catch(e){} },
    _seen(){ try{ return +ZS.zoo.gbSeen||0; }catch(e){ return 0; } },
    _unseen(){ const sn=Gu._seen(); return Gu.entries.filter(x=>(x.t||0)>sn).length; },
    _badge(){ const b=document.getElementById('zguest-badge'); if(!b) return; const n=Gu._unseen(); b.textContent=n; b.style.display=n?'block':'none'; },
    close(){ if(Gu.el){ Gu.el.remove(); Gu.el=null; } },
    open(){ Gu.init(); try{ ['gond','index','shop','reb','enc','menu','adm','sound','report','rank'].forEach(p=>ZP.close(p)); }catch(e){} Gu.close(); const o=document.createElement('div'); o.id='zguest'; o.style.cssText='position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;padding:16px'; o.onclick=e=>{ if(e.target===o) Gu.close(); }; document.body.appendChild(o); Gu.el=o; Gu.tab='book'; Gu.draw(); try{ if(typeof ZHelp!=='undefined') ZHelp.tip('guest'); }catch(e){} },
    _names(){ const set=[]; try{ Object.keys(ZG.otherPl||{}).forEach(n=>{ if(n&&n.toLowerCase()!==String(ZS.player).toLowerCase()&&!set.includes(n)) set.push(n); }); }catch(e){} return set; },
    send(msgIdx){
      const to=(Gu.to||'').trim(); if(!to){ toast('❌ Wähle zuerst einen Spieler.'); return; } if(key(to)===key(ZS.player)){ toast('😄 In deinen eigenen Zoo kannst du dir keinen Gruß schreiben!'); return; }
      const r=RT(); if(!r){ toast('❌ Keine Verbindung'); return; } const p=PRE[msgIdx]; if(!p) return; const path='zoo_guest/'+key(to)+'/'+key(ZS.player)+'_'+day();
      r.ref(path).once('value').then(sn=>{ if(sn.val()){ toast('📖 Du hast '+to+' heute schon gegrüsst. Morgen wieder!',3500); return; }
        const t=Date.now(); return r.ref(path).set({from:ZS.player,e:p[0],msg:p[1],t}).then(()=>{ big('📖 GRUSS GESENDET!','#ffd54f',1800); toast('📖 '+p[0]+' Gruss an '+to+' hinterlassen!',3500); try{ if(typeof ZGoals!=='undefined') ZGoals.add('guest',1); }catch(e){} Gu.tab='book'; Gu.draw(); }); }).catch(e=>toast('❌ '+(e&&e.message||'Fehler')));
    },
    draw(){
      const o=Gu.el; if(!o) return; const me=Gu.tab==='book';
      if(me){ try{ ZS.zoo.gbSeen=Math.max(Gu._seen(),Gu._maxT); ZS.save&&ZS.save(); }catch(e){} Gu._badge(); }
      let body='';
      if(me){ body=Gu.entries.length?Gu.entries.map(x=>'<div style="background:rgba(255,255,255,.08);border-radius:10px;padding:9px 11px;margin-bottom:6px;display:flex;gap:10px;align-items:center"><div style="font-size:1.6rem">'+esc(x.e||'💬')+'</div><div style="flex:1"><div style="font-weight:900;font-size:.82rem">'+esc(x.from)+'</div><div style="font-size:.76rem;color:rgba(255,255,255,.75)">'+esc(x.msg)+'</div></div><div style="font-size:.6rem;color:rgba(255,255,255,.4)">'+new Date(x.t||0).toLocaleDateString('de-CH')+'</div></div>').join(''):'<div style="text-align:center;color:rgba(255,255,255,.55);font-size:.8rem;padding:16px 0">Noch niemand war in deinem Zoo.<br>Besuche andere und hinterlasse einen Gruss! 😊</div>'; }
      else { const nm=Gu._names(); body='<div style="font-size:.74rem;color:rgba(255,255,255,.65);margin-bottom:6px">Wem möchtest du einen Gruss hinterlassen? (1× pro Tag je Spieler)</div>'+(nm.length?nm.map(n=>'<span class="zgb-c'+(Gu.to===n?' on':'')+'" data-n="'+esc(n)+'">'+esc(n)+'</span>').join(''):'<div style="font-size:.7rem;color:rgba(255,255,255,.45);margin-bottom:4px">Gerade ist niemand sonst im Zoo – schreib einen Namen:</div>')
        +'<input id="zgb-in" placeholder="Name eines Spielers" value="'+esc(Gu.to||'')+'" style="width:100%;box-sizing:border-box;margin:6px 0 8px;padding:9px;border-radius:9px;border:1px solid rgba(255,255,255,.25);background:rgba(0,0,0,.4);color:#fff;font:700 .85rem Arial">'
        +PRE.map((p,i)=>'<button class="zgb-b" data-m="'+i+'">'+p[0]+' '+p[1]+'</button>').join(''); }
      o.innerHTML='<div style="background:linear-gradient(135deg,#3b2a14,#1c140a);border:1px solid rgba(255,200,100,.45);border-radius:16px;padding:16px;max-width:420px;width:100%;max-height:88vh;overflow-y:auto;color:#fff;font-family:Arial,sans-serif"><div style="display:flex;align-items:center;margin-bottom:8px"><h2 style="flex:1;margin:0;font-size:1.1rem;color:#ffd08a">📖 Besucher-Gästebuch</h2><button onclick="ZGuest.close()" style="background:none;border:none;color:#fff;font-size:1.2rem;cursor:pointer">✕</button></div>'
        +'<div style="display:flex;gap:6px;margin-bottom:10px"><button class="zgb-c'+(me?' on':'')+'" data-t="book">📖 Mein Buch'+(Gu.entries.length?' ('+Gu.entries.length+')':'')+'</button><button class="zgb-c'+(me?'':' on')+'" data-t="send">✍️ Gruss hinterlassen</button></div>'+body+'</div>';
      o.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{ Gu.tab=b.dataset.t; Gu.draw(); });
      o.querySelectorAll('[data-n]').forEach(b=>b.onclick=()=>{ Gu.to=b.dataset.n; Gu.draw(); });
      const inp=o.querySelector('#zgb-in'); if(inp) inp.oninput=()=>{ Gu.to=inp.value; };
      o.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>Gu.send(+b.dataset.m));
    }
  };
  setInterval(()=>{ try{ if(ready()){ Gu.init(); Gu._badge(); } }catch(e){} },2000);

  // ═════════ 🧠 Tier-Quiz ═════════
  const F={ 'Pinguin':['Wo leben Pinguine?','Auf der Südhalbkugel (z. B. Antarktis)',['Am Nordpol','In der Sahara']],'Känguru':['Auf welchem Kontinent leben Kängurus?','Australien',['Afrika','Südamerika']],'Koala':['Was frisst der Koala?','Eukalyptus-Blätter',['Fisch','Gras']],'Panda':['Was frisst der Panda am liebsten?','Bambus',['Honig','Fleisch']],'Giraffe':['Was ist an der Giraffe besonders?','Ihr sehr langer Hals',['Ihr Rüssel','Ihre Streifen']],'Elefant':['Wie heisst die lange Nase des Elefanten?','Rüssel',['Schnabel','Fühler']],'Zebra':['Welches Muster hat ein Zebra?','Streifen',['Punkte','Karos']],'Schildkröte':['Was trägt die Schildkröte auf dem Rücken?','Einen Panzer',['Ein Fell','Flügel']],'Schmetterling':['Woraus wird ein Schmetterling?','Aus einer Raupe',['Aus einer Kaulquappe','Aus einem Welpen']],'Frosch':['Wie heissen Frosch-Babys?','Kaulquappen',['Küken','Welpen']],'Kuh':['Was gibt uns die Kuh?','Milch',['Eier','Wolle']],'Schaf':['Was bekommt man vom Schaf?','Wolle',['Federn','Honig']],'Huhn':['Was legt das Huhn?','Eier',['Milch','Nüsse']],'Flamingo':['Warum sind Flamingos rosa?','Wegen ihres Futters',['Sie werden angemalt','Vom Sonnenbrand']],'Delphin':['Ist ein Delphin ein Fisch?','Nein, ein Säugetier',['Ja, ein Fisch','Nein, ein Vogel']],'Wal':['Was ist der Blauwal?','Das grösste Tier der Erde',['Das schnellste Tier','Das kleinste Tier']],'Oktopus':['Wie viele Arme hat ein Oktopus?','8',['6','10']],'Nashorn':['Was hat das Nashorn auf der Nase?','Ein Horn',['Einen Rüssel','Eine Krone']],'Nilpferd':['Wo verbringt das Nilpferd den Tag?','Im Wasser',['Auf Bäumen','In der Wüste']],'Kamel':['Was speichert der Höcker des Kamels?','Fett',['Wasser','Luft']],'Wolf':['Wie nennt man eine Wolfs-Gruppe?','Rudel',['Schwarm','Herde']],'Bär':['Was machen Braunbären im Winter?','Winterruhe',['Sie fliegen weg','Sie tauchen']],'Fuchs':['Wo wohnt der Fuchs?','In einem Bau',['In einem Nest','Im Stall']],'Papagei':['Was können manche Papageien?','Sprechen',['Bellen','Tauchen']],'Pfau':['Was zeigt der Pfau beim Rad?','Seine Federn',['Seine Zähne','Seine Flossen']],'Löwe':['Wer jagt im Löwenrudel meistens?','Die Löwinnen',['Die Männchen','Die Babys']],'Seepferd':['Wer trägt beim Seepferdchen die Babys?','Das Männchen',['Das Weibchen','Die Möwe']],'Mammut':['Wann lebte das Mammut?','In der Eiszeit',['Im Mittelalter','Vor 5 Jahren']],'Hamster':['Wo versteckt der Hamster Futter?','In den Backentaschen',['In den Ohren','Im Schwanz']],'Ente':['Was ist besonders an Entenfedern?','Sie halten Wasser ab',['Sie leuchten','Sie sind sehr schwer']],'Hund':['Was wedelt ein froher Hund?','Den Schwanz',['Die Ohren','Die Nase']],'Katze':['Was macht eine zufriedene Katze?','Schnurren',['Bellen','Muhen']],'Tiger':['Welches Muster hat ein Tiger?','Streifen',['Punkte','Karos']] };
  const Q={ el:null, last:0,
    off(){ try{ return localStorage.getItem('zquiz_off')==='1'; }catch(e){ return false; } },
    maybe(name,emoji){
      try{ if(!ready()||Q.off()||Q.el||busy()) return; if(Date.now()-Q.last<150000) return; if(Math.random()>.6) return; Q.last=Date.now(); setTimeout(()=>Q.show(name,emoji),1800); }catch(e){}
    },
    _build(name,emoji){
      const f=F[name]; if(f){ return {q:emoji+' '+f[0],ok:f[1],opts:[f[1]].concat(f[2])}; }
      let names=[]; try{ ANIMALS.forEach(a=>{ if(a&&a.n&&a.n!==name&&!/SLAP/i.test(a.n)&&!names.includes(a.n)) names.push(a.n); }); }catch(e){}
      for(let i=names.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [names[i],names[j]]=[names[j],names[i]]; }
      return {q:'Welches Tier ist das?  '+emoji,ok:name,opts:[name,names[0]||'Hund',names[1]||'Katze']};
    },
    show(name,emoji){
      if(Q.el||busy()) return; const b=Q._build(name,emoji); const opts=b.opts.map(t=>({t,ok:t===b.ok})); for(let i=opts.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [opts[i],opts[j]]=[opts[j],opts[i]]; }
      const o=document.createElement('div'); o.id='zquiz'; o.style.cssText='position:fixed;inset:0;z-index:10002;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:16px'; Q.el=o;
      o.innerHTML='<div style="background:linear-gradient(135deg,#1b2f4a,#101a2c);border:2px solid #7fd1ff;border-radius:18px;padding:16px;max-width:360px;width:100%;color:#fff;font-family:Arial,sans-serif;text-align:center"><div style="font-weight:900;color:#7fd1ff;font-size:.95rem">🧠 Tier-Quiz zu deinem neuen Tier!</div><div style="font-size:1.05rem;font-weight:800;margin:12px 0">'+esc(b.q)+'</div>'+opts.map((x,i)=>'<button class="zgb-b" data-i="'+i+'" style="text-align:center">'+esc(x.t)+'</button>').join('')+'<div id="zq-res" style="min-height:22px;font-weight:900;margin:6px 0"></div><div style="display:flex;gap:8px;justify-content:center"><button id="zq-x" style="background:none;border:1px solid rgba(255,255,255,.3);color:#fff;border-radius:10px;padding:6px 12px;font:700 .72rem Arial;cursor:pointer">Überspringen</button><button id="zq-off" style="background:none;border:1px solid rgba(255,255,255,.2);color:rgba(255,255,255,.6);border-radius:10px;padding:6px 12px;font:700 .72rem Arial;cursor:pointer">Nicht mehr fragen</button></div></div>';
      document.body.appendChild(o); let done=false;
      const end=()=>{ if(Q.el){ Q.el.remove(); Q.el=null; } };
      o.querySelectorAll('[data-i]').forEach(btn=>btn.onclick=()=>{ if(done) return; done=true; const x=opts[+btn.dataset.i]; const res=o.querySelector('#zq-res');
        o.querySelectorAll('[data-i]').forEach(bb=>{ const oo=opts[+bb.dataset.i]; if(oo.ok) bb.style.background='rgba(46,204,113,.55)'; else if(bb===btn) bb.style.background='rgba(231,76,60,.55)'; });
        if(x.ok){ try{ ZSfx.play('quiz'); }catch(e){} const rw=Math.max(50,Math.floor(bal()*.01)); try{ ZS.zoo.mt=(ZS.zoo.mt||0)+rw; ZS.save&&ZS.save(); ZG._updHUD&&ZG._updHUD(); }catch(e){} res.style.color='#7dffb0'; res.textContent='✅ Richtig! +'+fmt(rw)+' MT'; big('🧠 RICHTIG!','#7dffb0',1500); }
        else { res.style.color='#ffb199'; res.textContent='❌ Fast! Richtig war: '+b.ok; }
        setTimeout(end,x.ok?1700:2600); });
      o.querySelector('#zq-x').onclick=()=>{ if(!done) end(); }; o.querySelector('#zq-off').onclick=()=>{ try{ localStorage.setItem('zquiz_off','1'); }catch(e){} toast('🧠 Quiz ausgeschaltet.',2500); end(); };
    }
  };
  window.ZQuiz=Q;
  let hk=false; setInterval(()=>{ try{ if(hk||typeof ZNews==='undefined'||!ZNews.push) return; if(ZNews.push._zq){ hk=true; return; } const o=ZNews.push; const w=function(t,d){ const r=o.apply(this,arguments); try{  }catch(e){} return r; }; w._zq=1; ZNews.push=w; hk=true; }catch(e){} },1000);
  try{ if(window.ZHelp){ ZHelp.TIPS.guest={t:'Gästebuch',s:['🧑','➜','📖','➜','❤️'],d:'Hinterlasse anderen Spielern einen Gruss (1× pro Tag je Spieler). Wer bei dir war, steht in deinem Buch.'}; } }catch(e){}
})();


;
/* ZMeadow (v705) — 🌿 Tutorial-Station „Laufen lernen“ auf einer fernen Wiese + 🌀 Portal-Zwischensequenz (Drohne steigt auf, Schrauben-Kamera, Verwischen) in den Zoo. */
(function(){
  'use strict';
  const MX=1200, MZ=1200, PX=MX+15, PZ=MZ-15, PY=2.7, HALF=20.5, NEED=15;
  const SPX=0, SPZ=62; // Ankunft im Zoo
  const ready=()=>{ try{ return !!(typeof ZG!=='undefined'&&ZG.scene&&ZG.pl&&ZG.cam&&ZG.renderer&&typeof THREE!=='undefined'&&typeof ZS!=='undefined'&&ZS.zoo); }catch(e){ return false; } };
  const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
  const sm=t=>{ t=Math.max(0,Math.min(1,t)); return t*t*(3-2*t); };
  const toast=(m,ms)=>{ try{ ZP.toast(m,ms||3000); }catch(e){} };
  function drawPortal(ctx,w,h,rot){
    ctx.clearRect(0,0,w,h); const cx=w/2, cy=h/2, R=w*.36; let _sd=12345; const Math2=Object.create(Math); Math2.random=()=>{ _sd=(_sd*1664525+1013904223)%4294967296; return _sd/4294967296; };
    let g=ctx.createRadialGradient(cx,cy,0,cx,cy,w*.5); g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(.25,'rgba(200,235,255,.95)'); g.addColorStop(.5,'rgba(60,140,255,.6)'); g.addColorStop(.8,'rgba(20,70,200,.25)'); g.addColorStop(1,'rgba(0,30,120,0)'); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
    ctx.lineCap='round'; ctx.lineJoin='round'; ctx.shadowColor='#5cf'; ctx.shadowBlur=16;
    for(let k=0;k<34;k++){ const a0=Math2.random()*Math.PI*2, len=.25+Math2.random()*.9, rr=R*(.86+Math2.random()*.3); ctx.strokeStyle=k%3?'rgba(255,255,255,.95)':'rgba(130,200,255,.9)'; ctx.lineWidth=1+Math2.random()*2.6; ctx.beginPath();
      const n=7+Math.floor(Math2.random()*6); for(let i=0;i<=n;i++){ const a=a0+len*i/n, r2=rr+(Math2.random()-.5)*w*.07; const x=cx+Math.cos(a+rot)*r2, y=cy+Math.sin(a+rot)*r2; if(i) ctx.lineTo(x,y); else ctx.moveTo(x,y); } ctx.stroke(); }
    for(let k=0;k<14;k++){ const a=Math2.random()*Math.PI*2, r1=R*.9, r2=R*(1.2+Math2.random()*.25); ctx.strokeStyle='rgba(190,225,255,.8)'; ctx.lineWidth=1+Math2.random()*1.6; ctx.beginPath(); ctx.moveTo(cx+Math.cos(a)*r1,cy+Math.sin(a)*r1); let px=cx+Math.cos(a)*r1, py=cy+Math.sin(a)*r1; for(let i=1;i<=4;i++){ const t=i/4, rr=r1+(r2-r1)*t; px=cx+Math.cos(a+(Math2.random()-.5)*.2)*rr; py=cy+Math.sin(a+(Math2.random()-.5)*.2)*rr; ctx.lineTo(px,py); } ctx.stroke(); }
    ctx.shadowBlur=0;
  }
  function mkPortal(size){
    const c=document.createElement('canvas'); c.width=c.height=256; const ctx=c.getContext('2d'); drawPortal(ctx,256,256,0); const tex=new THREE.CanvasTexture(c);
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})); sp.scale.set(size,size,1); sp.frustumCulled=false; sp.renderOrder=999; sp.material.depthTest=false; sp.userData={ctx,tex,rot:0,at:0,size}; return sp;
  }
  function animPortal(sp,now){ if(!sp) return; const u=sp.userData; if(u.t0==null) u.t0=now; const t=(now-u.t0)/1000; sp.material.rotation=t*.9; const k=1+Math.sin(t*3.1)*.035+Math.sin(t*7.3)*.015; sp.scale.set(u.size*k,u.size*k,1); }
  const M=window.ZMeadow={
    on:false, cut:null, grp:null, portal:null, portal2:null, stage:'walk', prog:{l:0,r:0,f:0,b:0}, _last:null, saved:null, _raf:0, _ov:null, _ac:null,
    _build(){
      if(M.grp) return; const g=new THREE.Group();
      const ground=new THREE.Mesh(new THREE.PlaneGeometry(900,900),new THREE.MeshBasicMaterial({color:0x5DBB63})); ground.rotation.x=-Math.PI/2; ground.position.set(MX,-.03,MZ); g.add(ground);
      const plat=new THREE.Mesh(new THREE.BoxGeometry(44,.3,44),new THREE.MeshBasicMaterial({color:0x8be58f})); plat.position.set(MX,.15,MZ); g.add(plat);
      const bm=new THREE.MeshBasicMaterial({color:0x2f9e4a}); [[0,-22,46,1],[0,22,46,1],[-22,0,1,46],[22,0,1,46]].forEach(([x,z,w,d])=>{ const b=new THREE.Mesh(new THREE.BoxGeometry(w,.5,d),bm); b.position.set(MX+x,.25,MZ+z); g.add(b); });
      // Blumen
      [[0xff5c8a],[0xffd54f],[0xffffff],[0x9b6bff]].forEach(([col])=>{ const im=new THREE.InstancedMesh(new THREE.SphereGeometry(.16,6,5),new THREE.MeshBasicMaterial({color:col}),70); const m4=new THREE.Matrix4(); for(let i=0;i<70;i++){ m4.makeTranslation(MX+(Math.random()-.5)*40,.42,MZ+(Math.random()-.5)*40); im.setMatrixAt(i,m4); } g.add(im); });
      // Bäume am Rand
      for(let i=0;i<22;i++){ const a=i/22*Math.PI*2, r=36+Math.random()*10, x=MX+Math.cos(a)*r, z=MZ+Math.sin(a)*r; const tr=new THREE.Mesh(new THREE.CylinderGeometry(.35,.45,2.2,6),new THREE.MeshBasicMaterial({color:0x6b4a2b})); tr.position.set(x,1.1,z); g.add(tr); const cr=new THREE.Mesh(new THREE.ConeGeometry(2.1,5.5,8),new THREE.MeshBasicMaterial({color:i%2?0x2e8b3d:0x3aa64d})); cr.position.set(x,4.6,z); g.add(cr); }
      // Startpunkt-Markierung
      const sp=new THREE.Mesh(new THREE.RingGeometry(1.6,2.1,32),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.7,side:THREE.DoubleSide})); sp.rotation.x=-Math.PI/2; sp.position.set(MX,.33,MZ+12); g.add(sp);
      // Portal-Sockel in der Ecke (anfangs unsichtbar)
      const pad=new THREE.Mesh(new THREE.CircleGeometry(2.6,32),new THREE.MeshBasicMaterial({color:0x58b6ff,transparent:true,opacity:.55,side:THREE.DoubleSide})); pad.rotation.x=-Math.PI/2; pad.position.set(PX,.34,PZ); pad.visible=false; g.add(pad); g.userData.pad=pad;
      ZG.scene.add(g); M.grp=g;
    },
    _showPortal(){ if(M.portal) return; const p=mkPortal(7.2); p.position.set(PX,PY,PZ); p.material.opacity=0; ZG.scene.add(p); M.portal=p; M.grp.userData.pad.visible=true; M._pt=performance.now(); },
    _sfx(kind){ try{ const A=window.AudioContext||window.webkitAudioContext; if(!A) return; const c=M._ac||(M._ac=new A()); if(c.state==='suspended') c.resume(); const now=c.currentTime;
        if(kind==='chime'){ [660,880,1320].forEach((f,i)=>{ const o=c.createOscillator(),g=c.createGain(); o.type='sine'; o.frequency.value=f; g.gain.setValueAtTime(0,now+i*.12); g.gain.linearRampToValueAtTime(.12,now+i*.12+.03); g.gain.exponentialRampToValueAtTime(.001,now+i*.12+.7); o.connect(g); g.connect(c.destination); o.start(now+i*.12); o.stop(now+i*.12+.8); }); }
        else if(kind==='whoosh'){ const nb=c.createBuffer(1,c.sampleRate*6,c.sampleRate), d=nb.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; const src=c.createBufferSource(); src.buffer=nb; const bp=c.createBiquadFilter(); bp.type='bandpass'; bp.Q.value=2; bp.frequency.setValueAtTime(200,now); bp.frequency.exponentialRampToValueAtTime(3000,now+4.5); bp.frequency.exponentialRampToValueAtTime(400,now+6); const g=c.createGain(); g.gain.setValueAtTime(0,now); g.gain.linearRampToValueAtTime(.35,now+2); g.gain.linearRampToValueAtTime(.05,now+5.4); g.gain.linearRampToValueAtTime(.3,now+5.6); g.gain.linearRampToValueAtTime(0,now+9); src.connect(bp); bp.connect(g); g.connect(c.destination); src.start(now); src.stop(now+9); } }catch(e){} },
    begin(){
      if(M.on||!ready()){ if(!ready()&&typeof Tutorial!=='undefined') setTimeout(()=>Tutorial.advance(),200); return; }
      M.on=true; M.stage='joy'; M._compact=false; M.prog={l:0,r:0,f:0,b:0}; M._build(); M.saved={x:ZG.pl.x,z:ZG.pl.z,yaw:ZG.yaw};
      ZG._meadowActive=true; ZG.pl.x=MX; ZG.pl.z=MZ+2; ZG.pl.y=1.7; ZG.yaw=0; ZG.pitch=0; M._last={x:ZG.pl.x,z:ZG.pl.z};
      M._flash(); M._startLoop(); M._renderList();
      setTimeout(()=>{ try{ M._joyStage(); }catch(e){ M.stage='info'; } },60);
    },
    _flash(){ const f=document.createElement('div'); f.style.cssText='position:fixed;inset:0;z-index:9690;background:#fff;opacity:1;transition:opacity 1.1s;pointer-events:none'; document.body.appendChild(f); requestAnimationFrame(()=>requestAnimationFrame(()=>{ f.style.opacity='0'; })); setTimeout(()=>f.remove(),1400); },
    _ov(){ return document.getElementById('tut-overlay'); },
    _box(){ const o=M._ov(); if(!o) return null; return Array.from(o.children).find(e=>e.style&&e.style.zIndex==='9701'&&e.tagName==='DIV'&&!e.id)||null; },
    _killFx(){ ['zm-dim','zm-ring'].forEach(id=>{ const e=document.getElementById(id); if(e) e.remove(); }); },
    _joyVisible(){ let touch=false; try{ touch=matchMedia('(pointer:coarse)').matches&&matchMedia('(hover:none)').matches; }catch(e){} if(!touch) return null; const j=document.getElementById('jzone'); if(!j) return null; const r=j.getBoundingClientRect(); return (r.width>20&&r.height>20&&getComputedStyle(j).display!=='none')?j:null; },
    // Stufe 1: alles schwarz ausser dem Joystick (nur wenn es einen Joystick gibt)
    _joyStage(){
      const j=M._joyVisible(), o=M._ov(), box=M._box(); if(!o) return;
      const td=o.firstElementChild; if(td&&td!==box) td.style.display='none';
      if(!j){ M._infoStage(); return; }
      const r=j.getBoundingClientRect(), pad=14, L=Math.max(0,r.left-pad), T=Math.max(0,r.top-pad), R=r.right+pad, B=r.bottom+pad;
      const d=document.createElement('div'); d.id='zm-dim'; d.style.cssText='position:fixed;inset:0;z-index:9699;pointer-events:none;background:rgba(0,0,0,.95);clip-path:polygon(evenodd,0 0,100% 0,100% 100%,0 100%,0 0,'+L+'px '+T+'px,'+R+'px '+T+'px,'+R+'px '+B+'px,'+L+'px '+B+'px,'+L+'px '+T+'px)'; document.body.appendChild(d);
      const ring=document.createElement('div'); ring.id='zm-ring'; ring.style.cssText='position:fixed;z-index:9699;pointer-events:none;left:'+L+'px;top:'+T+'px;width:'+(R-L)+'px;height:'+(B-T)+'px;border:3px solid #FFD700;border-radius:50%;box-shadow:0 0 24px rgba(255,215,0,.9);animation:tutPulse 1.1s infinite'; document.body.appendChild(ring);
      if(box){ box.style.top='14%'; box.style.bottom='auto'; box.innerHTML='<div style="font-weight:900;color:#FFD700;font-size:1.05rem;margin-bottom:6px">🕹️ Das ist dein Joystick</div><div style="font-size:.85rem;color:rgba(255,255,255,.85);line-height:1.4">Er ist unten links. <b>Berühre ihn</b> und schiebe ihn in eine Richtung — dann läufst du los. Mit dem Finger auf dem restlichen Bildschirm schaust du dich um.</div><div style="margin-top:10px;font-size:.72rem;color:rgba(255,215,0,.8);font-weight:700">👉 Tippe auf den Joystick</div>'; }
      M._yaw0=ZG.yaw;
    },
    // Stufe 2: Erklärung mit „Verstanden“
    _infoStage(){
      M.stage='info'; M._killFx(); const o=M._ov(), box=M._box(); if(!o||!box){ M.stage='walk'; return; }
      const d=document.createElement('div'); d.id='zm-dim'; d.style.cssText='position:fixed;inset:0;z-index:9699;pointer-events:none;background:rgba(0,0,0,.5)'; document.body.appendChild(d);
      box.style.top='auto'; box.style.bottom='190px'; box.style.pointerEvents='auto';
      box.innerHTML='<div style="font-weight:900;color:#FFD700;font-size:1.05rem;margin-bottom:6px">🌿 Laufen lernen</div><div style="font-size:.85rem;color:rgba(255,255,255,.85);line-height:1.4">Lauf mit dem Joystick (am Computer: W A S D) je <b>'+NEED+' Meter</b> nach <b>links</b>, <b>rechts</b>, <b>vorne</b> und <b>hinten</b>. Wenn du auf „Verstanden“ tippst, rückt dieser Kasten nach oben, damit du alles siehst.</div><div id="tm-list" style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px"></div><button id="tm-ok" style="margin-top:12px;background:linear-gradient(135deg,#FFD700,#E0A800);border:none;color:#000;font-weight:900;padding:9px 24px;border-radius:50px;cursor:pointer;font-size:.9rem">Verstanden ✓</button>';
      M._compact=false; M._renderList();
      const ok=box.querySelector('#tm-ok'); ok.onclick=()=>M._walkStage();
    },
    // Stufe 3: Kasten klein nach oben, freie Sicht
    _walkStage(){
      M._killFx(); const box=M._box(); M.stage='walk'; M._last={x:ZG.pl.x,z:ZG.pl.z}; if(!box) return;
      box.style.pointerEvents='none'; box.style.top='58px'; box.style.bottom='auto'; box.style.padding='9px 12px'; box.style.maxWidth='min(92vw,360px)';
      box.innerHTML='<div style="font-weight:900;color:#FFD700;font-size:.9rem;margin-bottom:6px">🌿 Wohin noch? <span style="font-weight:600;font-size:.72rem;color:rgba(255,255,255,.7)">(je '+NEED+' m)</span></div><div id="tm-list" style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:5px"></div>';
      M._compact=true; M._renderList();
    },
    _renderList(){ const l=document.getElementById('tm-list'); if(!l) return; const it=[['l','⬅️','Links'],['r','➡️','Rechts'],['f','⬆️','Vorne'],['b','⬇️','Zurück']]; l.innerHTML=it.map(([k,ic,n])=>{ const v=Math.min(1,M.prog[k]/NEED), ok=v>=1; return '<div style="background:'+(ok?'rgba(46,204,113,.28)':'rgba(255,255,255,.1)')+';border-radius:10px;padding:'+(M._compact?'4px 5px':'6px 8px')+';text-align:left"><div style="font-weight:900;font-size:'+(M._compact?'.66rem':'.8rem')+'">'+ic+' '+(M._compact?'':n)+(ok?' ✅':(M._compact?' '+Math.max(0,Math.ceil(NEED-M.prog[k]))+' m':''))+'</div><div style="height:6px;border-radius:4px;background:rgba(255,255,255,.15);margin-top:4px;overflow:hidden"><div style="height:100%;width:'+Math.round(v*100)+'%;background:'+(ok?'#2ecc71':'#ffd54f')+'"></div></div></div>'; }).join(''); },
    _startLoop(){ cancelAnimationFrame(M._raf); let t0=performance.now(); const lp=n=>{ if(!M.on) return; const dt=Math.min(.1,(n-t0)/1000); t0=n; try{ M._tick(dt,n); }catch(e){} M._raf=requestAnimationFrame(lp); }; M._raf=requestAnimationFrame(lp); },
    _tick(dt,now){
      if(M.portal){ animPortal(M.portal,now); const a=Math.max(0,Math.min(1,(now-M._pt)/1200)); if(!(a>=0)) M.portal.material.opacity=1; if(!M.cut||M.cut.phase==='A') M.portal.material.opacity=a; M.portal.position.y=PY+Math.sin(now/600)*.12; }
      if(M.portal2){ animPortal(M.portal2,now); }
      if(M.cut) return;
      const p=ZG.pl; // Plattform-Rand
      p.x=Math.max(MX-HALF,Math.min(MX+HALF,p.x)); p.z=Math.max(MZ-HALF,Math.min(MZ+HALF,p.z));
      if(M.stage==='joy'){
        let moved=false; try{ moved=!!ZG.joy.on; }catch(e){} try{ const K=ZG.keys||{}; if(K.KeyW||K.KeyA||K.KeyS||K.KeyD||K.ArrowUp||K.ArrowDown||K.ArrowLeft||K.ArrowRight) moved=true; }catch(e){} if(M._yaw0!=null&&Math.abs((ZG.yaw||0)-M._yaw0)>.08) moved=true;
        if(moved) M._infoStage(); M._last={x:p.x,z:p.z};
      } else if(M.stage==='walk'){
        const dx=p.x-M._last.x, dz=p.z-M._last.z; M._last={x:p.x,z:p.z}; const d=Math.hypot(dx,dz);
        if(d>0&&d<3){ const y=ZG.yaw||0, fw=dx*(-Math.sin(y))+dz*(-Math.cos(y)), rt=dx*Math.cos(y)-dz*Math.sin(y); const P=M.prog; const th=.02; if(fw>th) P.f+=fw; else if(fw<-th) P.b-=fw; if(rt>th) P.r+=rt; else if(rt<-th) P.l-=rt; M._renderList(); }
        if(['l','r','f','b'].every(k=>M.prog[k]>=NEED)){ M.stage='portal'; M._showPortal(); M._sfx('chime'); toast('🌀 Ein Portal ist aufgegangen!',3000); setTimeout(()=>{ try{ Tutorial.advance(); }catch(e){} },900); }
      } else if(M.stage==='portal'){
        if(Math.hypot(p.x-PX,p.z-PZ)<2.5) M._startCut();
      }
    },
    abort(){ // Tutorial abgebrochen/übersprungen → sofort in den Zoo
      if(!M.on) return; M._end(true); },
    // ── Zwischensequenz ──
    _startCut(){
      if(M.cut) return; M.stage='cut'; ZG._meadowCut=true; try{ ZG.joy.on=false; }catch(e){}
      const ov=document.getElementById('tut-overlay'); if(ov) ov.style.display='none';
      const av=(window.ZDrone&&ZDrone._avatar)?ZDrone._avatar():null; const p=ZG.pl;
      const d=V3(PX-p.x,0,PZ-p.z).normalize(); const c1=V3(p.x-d.x*7,8,p.z-d.z*7);
      M.cut={phase:'A',t0:performance.now(),av,s0:V3(p.x,0,p.z),eye:V3(p.x,p.y,p.z),d,c1,R0:Math.hypot(c1.x-PX,c1.z-PZ),th0:Math.atan2(c1.x-PX,c1.z-PZ),fovIn:true,tele:false,_ov:M._mkOverlay()};
      ZG.pitch=0; M._sfx('whoosh');
    },
    _mkOverlay(){ const o=document.createElement('div'); o.id='zmeadow-fx'; o.style.cssText='position:fixed;inset:0;z-index:9691;pointer-events:none;opacity:0'; o.innerHTML='<div id="zmf-sw" style="position:absolute;left:50%;top:50%;width:230vmax;height:230vmax;margin:-115vmax 0 0 -115vmax;border-radius:50%;background:repeating-conic-gradient(from 0deg,rgba(10,40,140,.0) 0deg 9deg,rgba(90,170,255,.55) 9deg 18deg,rgba(220,245,255,.4) 18deg 20deg);-webkit-mask:radial-gradient(circle,transparent 4%,#000 38%,#000 60%,transparent 70%);mask:radial-gradient(circle,transparent 4%,#000 38%,#000 60%,transparent 70%);mix-blend-mode:screen"></div><div id="zmf-wh" style="position:absolute;inset:0;background:radial-gradient(circle,#fff,#bfe3ff);opacity:0"></div>'; document.body.appendChild(o); return o; },
    cam(){
      const C=M.cut; if(!C||!M.on) return; const now=performance.now(), t=(now-C.t0)/1000, cam=ZG.cam, av=C.av, ov=C._ov, sw=ov&&ov.querySelector('#zmf-sw'), wh=ov&&ov.querySelector('#zmf-wh'), cv=ZG.renderer.domElement;
      const T_RISE=1.3, T_END=5.4, T_B=4.4;
      if(C.phase==='A'){
        const ctr=V3(PX,PY,PZ);
        // Figur: läuft zum Portal, schrumpft und wird hineingesogen
        if(av){ const w=sm(t/1.6); av.position.set(C.s0.x+(PX-C.s0.x)*w*.82,.3,C.s0.z+(PZ-C.s0.z)*w*.82); av.rotation.y=Math.atan2(C.d.x,C.d.z); const k=sm((t-1.5)/1.9); const sc=1-k; av.scale.setScalar(Math.max(.001,sc)); if(k>0){ av.position.x+= (PX-av.position.x)*k; av.position.z+=(PZ-av.position.z)*k; av.position.y=.3+(PY-.3)*k; av.rotation.y+=k*14; } }
        let lookAt, pos, roll=0;
        if(t<T_RISE){ const e=sm(t/T_RISE); pos=C.eye.clone().lerp(C.c1,e); const a=av?av.position.clone().add(V3(0,1,0)):C.s0; const fwd=C.eye.clone().add(C.d.clone().multiplyScalar(5)); lookAt=fwd.lerp(a.clone().lerp(ctr,.35),e); }
        else { const u=Math.min(1,(t-T_RISE)/(T_END-T_RISE)), e=sm(u), R=C.R0*(1-e)+2.4*e, H=C.c1.y*(1-e)+PY*e, th=C.th0+Math.PI*5*e; pos=V3(PX+Math.sin(th)*R,H,PZ+Math.cos(th)*R); lookAt=ctr; roll=Math.PI*5*e; }
        cam.position.copy(pos); cam.lookAt(lookAt); cam.rotateZ(roll);
        const b=sm((t-2)/3.2); cv.style.filter=b>0?'blur('+(b*16).toFixed(1)+'px) saturate('+(1+b*.8).toFixed(2)+')':''; if(ov){ ov.style.opacity=String(Math.min(.9,b*1.1)); if(sw) sw.style.transform='rotate('+(t*220)+'deg) scale('+(1+b*.3)+')'; if(wh) wh.style.opacity=String(sm((t-4.7)/.7)); }
        if(t>=T_END&&!C.tele){ C.tele=true; M._teleport(); }
      } else if(C.phase==='B'){
        const tt=(now-C.tB)/1000, u=Math.min(1,tt/T_B), ctr=V3(SPX,PY,SPZ-6);
        if(av){ const k=sm((tt-.3)/1.8); av.scale.setScalar(Math.max(.001,k)); const w=sm((tt-.6)/2.2); av.position.set(SPX,.3+(PY-.3)*(1-k),SPZ-6+6*w); av.rotation.y=(1-k)*14+Math.PI; }
        let pos,roll=0; const e1=sm(tt/2.6), e2=sm((tt-2.4)/(T_B-2.4));
        const R=2.4+(8.5-2.4)*e1, H=PY+(7.5-PY)*e1, th=Math.PI*4*(1-e1); pos=V3(SPX+Math.sin(th)*R,H,(SPZ-6)+Math.cos(th)*R); roll=Math.PI*4*(1-e1);
        cam.position.copy(pos); cam.lookAt(ctr.clone().lerp(V3(SPX,1.2,SPZ-3),e1)); cam.rotateZ(roll);
        if(e2>0){ const q0=cam.quaternion.clone(), qe=new THREE.Quaternion(); cam.position.lerp(V3(SPX,1.7,SPZ),e2); cam.quaternion.copy(q0.slerp(qe,e2)); }
        const b=1-sm(tt/2.8); cv.style.filter=b>.01?'blur('+(b*16).toFixed(1)+'px)':''; if(ov){ ov.style.opacity=String(Math.max(0,b*.9)); if(sw) sw.style.transform='rotate('+(-tt*180)+'deg)'; if(wh) wh.style.opacity=String(Math.max(0,1-tt/.8)); }
        if(M.portal2) M.portal2.material.opacity=Math.max(0,1-sm((tt-2.4)/1.2));
        if(u>=1) M._end(false);
      }
    },
    _teleport(){
      const C=M.cut; ZG.pl.x=SPX; ZG.pl.z=SPZ; ZG.pl.y=1.7; ZG.yaw=0; ZG.pitch=0;
      if(M.portal){ ZG.scene.remove(M.portal); M.portal=null; } if(M.grp) M.grp.visible=false;
      const p2=mkPortal(7.2); p2.position.set(SPX,PY,SPZ-6); ZG.scene.add(p2); M.portal2=p2; M._pt2=performance.now();
      C.phase='B'; C.tB=performance.now(); M._sfx('chime');
    },
    _end(abortNow){
      const was=M.cut; M.on=false; cancelAnimationFrame(M._raf); M.cut=null; ZG._meadowCut=false; ZG._meadowActive=false; M.stage='walk';
      try{ ZG.renderer.domElement.style.filter=''; }catch(e){}
      if(was&&was._ov) was._ov.remove(); document.querySelectorAll('#zmeadow-fx').forEach(e=>e.remove());
      M._killFx(); if(M.portal){ ZG.scene.remove(M.portal); M.portal=null; } if(M.portal2){ ZG.scene.remove(M.portal2); M.portal2=null; }
      try{ if(window.ZDrone&&!ZDrone.on) ZDrone._rm(); else if(window.ZDrone&&ZDrone.on) ZDrone.pos=null; }catch(e){}
      if(M.grp){ ZG.scene.remove(M.grp); M.grp.traverse(o=>{ if(o.geometry) o.geometry.dispose(); if(o.material){ if(o.material.map) o.material.map.dispose(); o.material.dispose(); } }); M.grp=null; }
      ZG.pl.x=SPX; ZG.pl.z=SPZ; ZG.pl.y=1.7; ZG.yaw=0; ZG.pitch=0;
      const ov=document.getElementById('tut-overlay'); if(ov) ov.style.display='';
      if(!abortNow){ toast('✨ Willkommen in deinem Zoo!',3000); setTimeout(()=>{ try{ if(typeof Tutorial!=='undefined'&&Tutorial._active) Tutorial.advance(); }catch(e){} },300); }
    }
  };
})();

/* ZMap (v705) — 🗺️ Grosse 3D-Karte: Klick auf die Mini-Karte → Blick von oben, Klick irgendwohin → hinbeamen */
(function(){
  const ready=()=>{ try{ return !!(typeof ZG!=='undefined'&&ZG.renderer&&ZG.scene&&ZG.pl&&typeof THREE!=='undefined'); }catch(e){ return false; } };
  const busy=()=>{ try{ return !!(ZG._arcadeActive||ZG._jumpActive||ZG._mazeActive||ZG._trashActive||ZG._iceRoomActive||ZG._meadowActive||ZG._coasterRide||(window.ZCoaster2&&ZCoaster2.ride)||(window.ZCoaster&&ZCoaster.ride)); }catch(e){ return false; } };
  const R=215, POI=[['⛩️ Gondel',0,0],['🚪 Eingang',0,62],['🎪 Zirkus',40,48],['🎢 Mega-Achterbahn',140,-35]];
  const K=window.ZMap={ el:null, cam:null,
    open(){
      if(K.el||!ready()) return; if(busy()){ try{ ZP.toast('🗺️ Die Karte geht gerade nicht.',2000); }catch(e){} return; }
      const rd=ZG.renderer, cv=rd.domElement, W=cv.width, H=cv.height, asp=W/H;
      const hw=asp>=1?R*asp:R, hh=asp>=1?R:R/asp; const cam=new THREE.OrthographicCamera(-hw,hw,hh,-hh,1,2000); cam.position.set(0,700,0); cam.up.set(0,0,-1); cam.lookAt(0,0,0); cam.updateMatrixWorld(); cam.updateProjectionMatrix(); K.cam=cam;
      const sc=ZG.scene, fog=sc.fog, wtint=document.getElementById('zw-tint'); sc.fog=null;
      const hid=[]; try{ sc.traverse(o=>{ if(o.isSprite&&o.visible&&o.scale.x>40){ hid.push(o); o.visible=false; } }); }catch(e){}
      const old=rd.getRenderTarget(); let ok=true;
      const o=document.createElement('div'); o.id='zmap'; o.style.cssText='position:fixed;left:0;top:0;width:100vw;height:100vh;height:100dvh;z-index:10003;background:#0a1a0a;overflow:hidden;display:flex;align-items:center;justify-content:center;touch-action:none';
      const sc0=Math.min(1,1280/Math.max(W,H)); const c=document.createElement('canvas'); c.width=Math.round(W*sc0); c.height=Math.round(H*sc0); c.style.cssText='width:100%;height:100%;object-fit:contain;cursor:crosshair'; o.appendChild(c);
      try{ rd.render(sc,cam); c.getContext('2d').drawImage(cv,0,0,c.width,c.height); }catch(e){ ok=false; }
      sc.fog=fog; hid.forEach(h=>h.visible=true); try{ rd.setRenderTarget(old); }catch(e){}
      if(!ok){ try{ ZP.toast('🗺️ Karte konnte nicht geladen werden.',2500); }catch(e){} return; }
      const top=document.createElement('div'); top.style.cssText='position:absolute;top:12px;left:10px;right:130px;text-align:left;line-height:1.25;color:#fff;font:900 1rem Arial;text-shadow:0 2px 6px #000;pointer-events:none'; top.innerHTML='🗺️ Zoo-Karte <span style="font-weight:600;font-size:.78rem;opacity:.85">– tippe irgendwohin, um dich hinzubeamen</span>'; o.appendChild(top);
      const x=document.createElement('button'); x.textContent='✕ Schliessen'; x.style.cssText='position:absolute;top:10px;right:12px;background:rgba(0,0,0,.6);border:1px solid rgba(255,255,255,.4);color:#fff;border-radius:20px;padding:7px 14px;font-size:.8rem;cursor:pointer'; x.onclick=e=>{ e.stopPropagation(); K.close(); }; o.appendChild(x);
      const mk=document.createElement('div'); mk.style.cssText='position:absolute;inset:0;pointer-events:none'; o.appendChild(mk); K.mk=mk;
      document.body.appendChild(o); K.el=o; K.c=c; K._marks();
      c.addEventListener('click',ev=>K._click(ev)); document.addEventListener('keydown',K._key);
      window.addEventListener('resize',K._marks);
    },
    _key(e){ if(e.key==='Escape'||e.code==='KeyM') K.close(); },
    // Bildschirm-Position (innerhalb von c, object-fit:contain) ⇄ Welt
    _rect(){ const c=K.c, r=c.getBoundingClientRect(), a=c.width/c.height, ra=r.width/r.height; let w=r.width,h=r.height,l=r.left,t=r.top; if(ra>a){ w=h*a; l+=(r.width-w)/2; } else { h=w/a; t+=(r.height-h)/2; } return {l,t,w,h}; },
    _w2s(x,z){ const q=K._rect(), v=new THREE.Vector3(x,0,z).project(K.cam); return {x:q.l+(v.x+1)/2*q.w, y:q.t+(1-v.y)/2*q.h}; },
    _s2w(px,py){ const q=K._rect(), nx=(px-q.l)/q.w*2-1, ny=1-(py-q.t)/q.h*2; if(Math.abs(nx)>1||Math.abs(ny)>1) return null; const v=new THREE.Vector3(nx,ny,0).unproject(K.cam); return {x:v.x,z:v.z}; },
    _marks(){
      if(!K.el) return; const mk=K.mk; mk.innerHTML='';
      const add=(x,z,html,css)=>{ const p=K._w2s(x,z); const d=document.createElement('div'); d.style.cssText='position:absolute;left:'+p.x+'px;top:'+p.y+'px;transform:translate(-50%,-50%);white-space:nowrap;font:800 '+(innerWidth<700?'.6':'.72')+'rem Arial;color:#fff;text-shadow:0 1px 4px #000,0 0 6px #000;'+(css||''); d.innerHTML=html; mk.appendChild(d); };
      POI.forEach(p=>add(p[1],p[2],p[0])); try{ ZG.ENCPOS().slice(0,ZS.maxE()).forEach((e,i)=>add(e.x,e.z,'🏞️'+(i+1),'font-size:.62rem;opacity:.9')); }catch(e){}
      try{ Object.values(ZG.otherPl||{}).forEach(op=>add(op.x,op.z,'<span style="color:#ff6b6b">●</span> '+(op.name||''),'font-size:.62rem')); }catch(e){}
      add(ZG.pl.x,ZG.pl.z,'<div style="transform:rotate('+(-ZG.yaw*180/Math.PI+180)+'deg);font-size:1.5rem;color:#FFD700;filter:drop-shadow(0 0 4px #000)">⬆️</div><div style="color:#FFD700;text-align:center">Du</div>','z-index:2');
    },
    _click(ev){
      if(ZG.carrying){ try{ ZP.toast('🐾 Du trägst noch ein Tier!',2500); }catch(e){} return; }
      const w=K._s2w(ev.clientX,ev.clientY); if(!w) return; let tx=w.x,tz=w.z, best=14;
      POI.forEach(p=>{ const d=Math.hypot(p[1]-w.x,p[2]-w.z); if(d<best){ best=d; tx=p[1]; tz=p[2]; } });
      try{ ZG.ENCPOS().slice(0,ZS.maxE()).forEach(e=>{ const d=Math.hypot(e.x-w.x,e.z-w.z); if(d<best){ best=d; tx=e.x; tz=e.z; } }); }catch(e){}
      const rr=Math.hypot(tx,tz), lim=(ZG.WR||210)-4; if(rr>lim){ tx*=lim/rr; tz*=lim/rr; }
      ZG.pl.x=tx; ZG.pl.z=tz+(best<14?3:0); try{ ZG.pl.y=1.7; ZG.vy=0; }catch(e){} try{ ZG._recentlyBeamedAt=Date.now(); }catch(e){}
      K.close(); try{ ZP.toast('✨ Hingebeamt!',1500); }catch(e){}
    },
    close(){ if(!K.el) return; K.el.remove(); K.el=null; document.removeEventListener('keydown',K._key); window.removeEventListener('resize',K._marks); }
  };
  const hook=()=>{ const m=document.getElementById('mmap'); if(!m||m._zm) return; m._zm=1; m.style.pointerEvents='auto'; m.style.cursor='pointer'; m.title='Grosse Karte'; m.addEventListener('click',e=>{ e.stopPropagation(); K.open(); }); };
  setInterval(()=>{ try{ hook(); }catch(e){} },1500);
})();

/* ZSweeper (v705) — 🧹 Kehrmaschine: 10 % Guthaben, 10 Min, 15 m/s, Gas/Bremse, Einsaugen, Rächen (5 %) */
(function(){
  const RT=()=>{ try{ return (typeof _rtdb!=='undefined'&&_rtdb)?_rtdb:null; }catch(e){ return null; } };
  const K=n=>String(n||'').toLowerCase().replace(/[.#$\[\]\/]/g,'_');
  let _off=0; const tn=()=>Date.now()+_off;
  const toast=(m,ms)=>{ try{ ZP.toast(m,ms||3000); }catch(e){} };
  const big=(t,c,ms)=>{ try{ ZG._bigText(t,c||'#fff',ms||2500); }catch(e){} };
  const bal=()=>{ try{ return (ZS.dsMT||0)+(ZS.zoo.mt||0); }catch(e){ return 0; } };
  const fmt=v=>{ try{ if(typeof $mt==='function') return $mt(v); }catch(e){} return Math.round(v).toLocaleString('de-CH'); };
  const me=()=>{ try{ return K(ZS.player); }catch(e){ return ''; } };
  const isTouch=()=>{ try{ return matchMedia('(pointer:coarse)').matches&&matchMedia('(hover:none)').matches; }catch(e){ return false; } };
  const busy=()=>{ try{ return !!(ZG._arcadeActive||ZG._jumpActive||ZG._mazeActive||ZG._trashActive||ZG._iceRoomActive||ZG._meadowActive||ZG._coasterRide||(window.ZCoaster2&&ZCoaster2.ride)||(window.ZCoaster&&ZCoaster.ride)); }catch(e){ return false; } };
  const PC=.10, DUR=600000, SPEED=15, SUCK=15000, REV_PC=.05;
  const S=window.ZSweeper={ on:false, until:0, v:0, gas:false, brk:false, all:{}, seen:{}, hitCd:{}, rev:null, _inited:false,
    init(){
      if(S._inited) return; const r=RT(); if(!r||typeof ZS==='undefined'||!ZS.player) return; S._inited=true;
      try{ r.ref('.info/serverTimeOffset').on('value',s=>{ _off=+s.val()||0; }); }catch(e){}
      r.ref('zoo_sweeper').on('value',s=>{ const v=s.val()||{}; const first=!S._got; S._got=true; const now=tn();
        Object.keys(v).forEach(k=>{ const e=v[k]; if(!e||e.until<=now) return; const id=k+'_'+e.at; if(S.seen[id]) return; S.seen[id]=1; if(!first&&k!==me()&&now-e.at<20000) S._banner('🧹 '+e.name+' ist Kehrmaschine geworden!'); });
        S.all=v; });
      r.ref('zoo_sweeper_hit/'+me()).on('value',s=>{ const v=s.val(); if(v&&tn()-v.at<8000&&!S.seen['h'+v.at]){ S.seen['h'+v.at]=1; S._sucked(v.from); } });
      r.ref('zoo_sweeper_kill/'+me()).on('value',s=>{ const v=s.val(); if(v&&tn()-v.at<20000&&!S.seen['k'+v.at]){ S.seen['k'+v.at]=1; if(S.on) S._licenseGone(v.by); } });
      setInterval(S._slow,500); S._loop();
    },
    // ── Kauf ──
    buy(){
      const z=ZS.zoo; if(!z) return;
      if(S.on){ toast('🧹 Du bist schon Kehrmaschine!',2000); return; }
      if(ZG.carrying){ toast('🐾 Du trägst noch ein Tier!',2500); return; }
      if(busy()){ toast('🧹 Jetzt gerade nicht möglich.',2000); return; }
      const cost=Math.floor(bal()*PC); if(bal()<10||z.mt<cost){ toast('❌ Zu wenig MT!'); return; }
      z.mt-=cost; try{ ZS.save&&ZS.save(); ZG._updHUD&&ZG._updHUD(); }catch(e){}
      try{ ZP._updShopBal&&ZP._updShopBal(); }catch(e){}
      try{ ZP.close('shop'); }catch(e){}
      S.start(tn()+DUR,true);
    },
    start(until,announce){
      S.on=true; S.until=until; S.v=0; S._hud(true);
      const r=RT(); if(r&&announce){ try{ r.ref('zoo_sweeper/'+me()).set({name:ZS.player,until,at:tn()}); r.ref('zoo_sweeper/'+me()).onDisconnect().remove(); }catch(e){} }
      big('🧹 KEHRMASCHINE!','#ffd54f',2200); toast(isTouch()?'🧹 Unten rechts: Gas & Bremse · Joystick lenkt':'🧹 W = Gas · S = Bremse · A/D lenken',5000);
      try{ ZG.pl.y=1.7; }catch(e){}
    },
    stop(msg){
      if(!S.on) return; S.on=false; S.v=0; S.gas=S.brk=false; S._hud(false); const r=RT(); try{ r&&r.ref('zoo_sweeper/'+me()).remove(); }catch(e){}
      if(msg) toast(msg,3500);
    },
    // ── Fahren (wird aus ZG._move aufgerufen) ──
    move(dt){
      dt=Math.min(.1,dt); const k=ZG.keys||{}; const gas=S.gas||k.KeyW||k.ArrowUp, brk=S.brk||k.KeyS||k.ArrowDown;
      let st=0; if(k.KeyD||k.ArrowRight) st+=1; if(k.KeyA||k.ArrowLeft) st-=1; try{ if(ZG.joy&&ZG.joy.on) st+=ZG.joy.dx||0; }catch(e){} st=Math.max(-1,Math.min(1,st));
      if(brk) S.v=Math.max(0,S.v-45*dt); else if(gas) S.v=Math.min(SPEED,S.v+11*dt); else S.v=Math.max(0,S.v-5*dt);
      ZG.yaw-=st*2.1*dt*(.35+.65*Math.min(1,S.v/6));
      const p=ZG.pl; p.x+=-Math.sin(ZG.yaw)*S.v*dt; p.z+=-Math.cos(ZG.yaw)*S.v*dt;
      const lim=(ZG.WR||210)-3, rr=Math.hypot(p.x,p.z); if(rr>lim){ p.x*=lim/rr; p.z*=lim/rr; S.v*=.5; }
    },
    _slow(){
      try{
        if(S.on){ const left=S.until-tn(); if(left<=0){ S.stop('🧹 Deine Kehrmaschinen-Zeit ist um.'); return; }
          const h=document.getElementById('zsw-hud'); if(h){ const m=Math.floor(left/60000), s=Math.floor(left/1000)%60; h.innerHTML='🧹 Kehrmaschine · '+m+':'+String(s).padStart(2,'0')+' · '+Math.round(S.v*3.6)+' km/h'; }
          // einsaugen
          const now=tn(), r=RT(); if(S.v>1.5&&r){ Object.values(ZG.otherPl||{}).forEach(op=>{ const k=K(op.name); if(!op.name||k===me()) return; if(Math.hypot(op.x-ZG.pl.x,op.z-ZG.pl.z)<3.2&&(!S.hitCd[k]||now-S.hitCd[k]>25000)){ S.hitCd[k]=now; try{ r.ref('zoo_sweeper_hit/'+k).set({from:ZS.player,at:now}); }catch(e){} toast('🧹 '+op.name+' eingesaugt!',2000); big('🌀 EINGESAUGT','#7fd1ff',1200); S._tone(300,90,.45); } }); }
        }
      }catch(e){}
    },
    _loop(){ const f=()=>{ try{ S._dress(); }catch(e){} requestAnimationFrame(f); }; requestAnimationFrame(f); },
    // ── Optik bei anderen Spielern ──
    _model(){
      const g=new THREE.Group(); g.userData.zsw=1; const M=(c)=>new THREE.MeshBasicMaterial({color:c});
      const body=new THREE.Mesh(new THREE.BoxGeometry(1.5,.8,2.6),M(0xffc107)); body.position.y=.75; g.add(body);
      const cab=new THREE.Mesh(new THREE.BoxGeometry(1.2,.7,1.1),M(0x37474f)); cab.position.set(0,1.45,-.35); g.add(cab);
      const win=new THREE.Mesh(new THREE.BoxGeometry(1.0,.45,.05),M(0x81d4fa)); win.position.set(0,1.5,.22); g.add(win);
      [[-.8,-.9],[.8,-.9],[-.8,.9],[.8,.9]].forEach(p=>{ const w=new THREE.Mesh(new THREE.CylinderGeometry(.38,.38,.28,12),M(0x212121)); w.rotation.z=Math.PI/2; w.position.set(p[0],.38,p[1]); g.add(w); });
      const br=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,1.5,10),M(0xe53935)); br.rotation.z=Math.PI/2; br.position.set(0,.34,1.55); g.add(br); g.userData.brush=br;
      const bc=new THREE.Mesh(new THREE.SphereGeometry(.18,8,6),M(0xff6d00)); bc.position.set(0,1.95,-.4); g.add(bc); g.userData.beacon=bc;
      g.scale.setScalar(1.25); return g;
    },
    _dress(){
      const now=tn(), t=performance.now()/1000;
      Object.keys(ZG.otherM||{}).forEach(n=>{
        const m=ZG.otherM[n]; if(!m) return; const e=S.all[K(n)]; const act=!!(e&&e.until>now); let sw=m.userData._zsw;
        if(act&&!sw){ sw=S._model(); m.add(sw); m.userData._zsw=sw; m.children.forEach(c=>{ if(c!==sw){ c.userData._zwas=c.visible; c.visible=false; } }); }
        if(act&&sw){ const op=(ZG.otherPl||{})[n]; if(op&&op._heading!=null) sw.rotation.y=op._heading; if(sw.userData.brush) sw.userData.brush.rotation.x=t*14; if(sw.userData.beacon) sw.userData.beacon.visible=Math.sin(t*10)>0; m.children.forEach(c=>{ if(c!==sw&&c.visible) c.visible=false; }); }
        if(!act&&sw){ m.remove(sw); m.userData._zsw=null; m.children.forEach(c=>{ c.visible=true; }); }
      });
    },
    // ── Eingesaugt / Rächen ──
    _sucked(from){
      if(S.on) return; try{ if(ZG.carrying) ZG._dropCarried(from); }catch(e){}
      const end=Date.now()+SUCK; try{ ZG._slapStunEnd=end; ZG._stunType='suck'; }catch(e){}
      S._tone(120,500,.5); big('🌀 EINGESAUGT!','#7fd1ff',1800);
      S.rev={from,till:end+45000,done:false}; S._revUI(from,end);
    },
    _revUI(from,end){
      const old=document.getElementById('zsw-rev'); if(old) old.remove();
      const o=document.createElement('div'); o.id='zsw-rev'; o.style.cssText='position:fixed;left:50%;top:22%;transform:translateX(-50%);z-index:10004;background:rgba(10,20,40,.94);border:2px solid #7fd1ff;border-radius:16px;padding:14px 18px;color:#fff;font-family:Arial,sans-serif;text-align:center;max-width:90vw;box-shadow:0 0 30px rgba(80,180,255,.5)';
      document.body.appendChild(o);
      const tick=()=>{ if(!document.body.contains(o)) return; const w=Math.ceil((end-Date.now())/1000), cost=Math.floor(bal()*REV_PC);
        const stillOn=(S.all[K(from)]&&S.all[K(from)].until>tn());
        if(w>0){ o.innerHTML='<div style="font-weight:900;color:#7fd1ff;font-size:1rem">🌀 Du wurdest eingesaugt von '+from+'!</div><div style="margin-top:6px;font-size:.85rem">Du musst noch <b>'+w+' s</b> warten …</div>'; }
        else if(!stillOn||S.rev.done||Date.now()>S.rev.till){ o.remove(); return; }
        else { o.innerHTML='<div style="font-weight:900;color:#ffd54f;font-size:1rem">Frei! 😈 Willst du dich rächen?</div><div style="font-size:.74rem;opacity:.8;margin:6px 0">Du zahlst 5 % deines Guthabens ('+fmt(cost)+' MT) — dafür wird <b>'+from+'</b> die Kehrmaschinen-Lizenz abgezogen.</div><button id="zsw-rb" style="background:linear-gradient(135deg,#e74c3c,#a93226);border:none;color:#fff;font-weight:900;padding:9px 22px;border-radius:50px;cursor:pointer;margin-right:6px">😈 Rächen</button><button id="zsw-no" style="background:rgba(255,255,255,.15);border:none;color:#fff;padding:9px 14px;border-radius:50px;cursor:pointer">Nein</button>';
          o.querySelector('#zsw-rb').onclick=()=>S.revenge(from,o); o.querySelector('#zsw-no').onclick=()=>{ S.rev.done=true; o.remove(); }; }
        setTimeout(tick,w>0?500:3000); };
      tick();
    },
    revenge(from,o){
      const z=ZS.zoo, cost=Math.floor(bal()*REV_PC), r=RT(); if(!z||!r) return;
      if(z.mt<cost){ toast('❌ Zu wenig MT!'); return; }
      z.mt-=cost; try{ ZS.save&&ZS.save(); ZG._updHUD&&ZG._updHUD(); }catch(e){}
      S.rev.done=true; if(o) o.remove();
      try{ r.ref('zoo_sweeper_kill/'+K(from)).set({by:ZS.player,at:tn()}); r.ref('zoo_sweeper/'+K(from)).remove(); }catch(e){}
      toast('😈 Rache! '+from+' wurde die Lizenz abgezogen. (−'+fmt(cost)+' MT)',4000); S._tone(500,80,.6);
    },
    _licenseGone(by){
      S.stop(); const o=document.createElement('div'); o.style.cssText='position:fixed;inset:0;z-index:10005;background:rgba(0,0,0,.78);display:flex;align-items:center;justify-content:center;font-family:Arial,sans-serif;overflow:hidden';
      o.innerHTML='<style>@keyframes zswStamp{0%{transform:scale(4) rotate(-25deg);opacity:0}60%{transform:scale(.9) rotate(-14deg);opacity:1}75%{transform:scale(1.1) rotate(-14deg)}100%{transform:scale(1) rotate(-14deg);opacity:1}}@keyframes zswCard{0%{transform:translateY(-120vh) rotate(8deg)}60%{transform:translateY(6px) rotate(-2deg)}100%{transform:none}}@keyframes zswShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}@keyframes zswFly{to{transform:translate(var(--x),var(--y)) rotate(720deg);opacity:0}}</style>'
        +'<div style="position:relative;animation:zswCard .7s ease-out both"><div style="background:linear-gradient(135deg,#fff8e1,#ffe082);border:4px solid #8d6e63;border-radius:16px;padding:18px 26px;text-align:center;color:#4e342e;min-width:250px"><div style="font-size:.8rem;font-weight:900;letter-spacing:2px">KEHRMASCHINEN-LIZENZ</div><div style="font-size:3rem">🧹🪪</div><div style="font-weight:900">'+(ZS.player||'')+'</div></div>'
        +'<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><div style="font-weight:900;font-size:2rem;color:#d50000;border:6px solid #d50000;border-radius:10px;padding:4px 14px;background:rgba(255,255,255,.2);animation:zswStamp .5s .8s ease-out both;opacity:0">ENTZOGEN!</div></div></div>'
        +'<div style="position:absolute;bottom:18%;left:0;right:0;text-align:center;color:#fff;font-weight:900;font-size:1.05rem;text-shadow:0 2px 8px #000;animation:zswShake .4s 1.1s 3">'+by+' hat dir die Lizenz abgezogen!</div>';
      for(let i=0;i<18;i++){ const p=document.createElement('div'); p.textContent=['🧹','💥','🪪','✨'][i%4]; const a=Math.random()*6.28, d=200+Math.random()*260; p.style.cssText='position:absolute;left:50%;top:44%;font-size:1.6rem;--x:'+Math.cos(a)*d+'px;--y:'+Math.sin(a)*d+'px;animation:zswFly 1.3s '+(1.0+Math.random()*.3)+'s ease-out both;opacity:1'; o.appendChild(p); }
      document.body.appendChild(o); S._tone(700,60,.7); setTimeout(()=>o.remove(),3600);
    },
    _tone(f0,f1,d){ try{ const A=window.AudioContext||window.webkitAudioContext; const c=S._ac||(S._ac=new A()); const o=c.createOscillator(), g=c.createGain(); o.type='sawtooth'; o.frequency.setValueAtTime(f0,c.currentTime); o.frequency.exponentialRampToValueAtTime(f1,c.currentTime+d); g.gain.setValueAtTime(.12,c.currentTime); g.gain.exponentialRampToValueAtTime(.001,c.currentTime+d); o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime+d); }catch(e){} },
    _banner(t){
      const b=document.createElement('div'); b.style.cssText='position:fixed;top:64px;left:50%;transform:translateX(-50%);z-index:10001;background:linear-gradient(135deg,#ffc107,#ff8f00);color:#000;font:900 .9rem Arial;padding:9px 18px;border-radius:30px;box-shadow:0 4px 18px rgba(0,0,0,.5);max-width:92vw;text-align:center;pointer-events:none'; b.textContent=t; document.body.appendChild(b); setTimeout(()=>b.remove(),6000);
    },
    // ── HUD + Pedale ──
    _hud(on){
      ['zsw-hud','zsw-gas','zsw-brk'].forEach(id=>{ const e=document.getElementById(id); if(e) e.remove(); }); S.gas=S.brk=false; if(!on) return;
      const h=document.createElement('div'); h.id='zsw-hud'; h.style.cssText='position:fixed;top:118px;left:50%;transform:translateX(-50%);z-index:9000;background:rgba(0,0,0,.65);border:2px solid #ffc107;color:#ffd54f;font:900 .85rem Arial;padding:5px 14px;border-radius:20px;pointer-events:none'; document.body.appendChild(h);
      if(!isTouch()) return;
      const mk=(id,txt,col,right,key)=>{ const b=document.createElement('div'); b.id=id; b.style.cssText='position:fixed;bottom:22px;right:'+right+'px;width:92px;height:112px;z-index:9001;border-radius:18px;background:rgba(0,0,0,.55);border:4px solid '+col+';color:#fff;font:900 .95rem Arial;display:flex;align-items:center;justify-content:center;text-align:center;user-select:none;-webkit-user-select:none;touch-action:none;box-shadow:0 0 14px '+col; b.textContent=txt;
        const set=v=>{ S[key]=v; b.style.background=v?col.replace('#','#')+'88':'rgba(0,0,0,.55)'; };
        b.addEventListener('pointerdown',e=>{ e.preventDefault(); e.stopPropagation(); try{ b.setPointerCapture(e.pointerId); }catch(x){} set(true); }); ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>b.addEventListener(ev,()=>set(false)));
        document.body.appendChild(b); };
      mk('zsw-gas','GAS','#2ecc71',128,'gas'); mk('zsw-brk','BREMSEN','#e74c3c',22,'brk');
    }
  };
  setInterval(()=>{ try{ S.init(); }catch(e){} },2000);
})();

/* ZSfx (v705) — 🎙️ Admin nimmt eigene Sounds auf (Mikro) und ordnet sie Ereignissen zu; alle Spieler hören sie */
(function(){
  const RT=()=>{ try{ return (typeof _rtdb!=='undefined'&&_rtdb)?_rtdb:null; }catch(e){ return null; } };
  const toast=(m,ms)=>{ try{ ZP.toast(m,ms||3000); }catch(e){} };
  const EVENTS=[['walk','👣 Laufen'],['click','👆 Auf etwas klicken'],['jump','🦘 Springen'],['buy','🛒 Etwas kaufen'],['pickup','🎒 Tier aufnehmen'],['placed','🏠 Tier abgesetzt'],['eat','🥟 Essen'],['heart','❤️ Herz verlieren'],['death','💀 Alle Herzen weg'],['slapped','💫 Getroffen (Slap)'],['rebirth','🔄 Rebirth'],['money','💰 Geld bekommen'],['wish','🌟 Wunsch erfüllt'],['coaster','🎢 Achterbahn startet'],['fall','😱 Runterfallen'],['circus','🎪 Zirkus betreten'],['map','🗺️ Per Karte hinbeamen'],['sweeper','🧹 Kehrmaschine startet'],['sucked','🌀 Eingesaugt werden'],['revenge','😈 Rache'],['quiz','🧠 Quiz richtig'],['goal','🎯 Tagesziel geschafft']];
  const NSLOT=8, MAXMS=4000;
  const X=window.ZSfx={ adm(){ try{ const n=String(ZS.player||'').toLowerCase(); return !!(ZS.isAdmin||(typeof ZAdmin!=='undefined'&&ZAdmin._hasAccess)||localStorage.getItem('zoo_secret_admin')===ZS.player||n==='bu:)'||n==='bu:3'); }catch(e){ return false; } }, data:{slots:{},map:{}}, cache:{}, _inited:false, _last:{},
    init(){
      const r=RT(); if(r&&!X._listen&&typeof ZS!=='undefined'&&ZS.player){ X._listen=true; r.ref('zoo_sounds').on('value',s=>{ const v=s.val()||{}; X.data={slots:v.slots||{},map:v.map||{}}; X.cache={}; if(X.el) X._draw(); }); }
      if(X._inited) return; if(typeof ZS==='undefined'||!ZS.player||typeof ZG==='undefined'||!ZG.pl) return; X._inited=true;
      document.addEventListener('pointerdown',e=>{ if(e.target&&e.target.closest&&e.target.closest('button,.ab,.hb,[onclick]')&&!e.target.closest('#zsfx-panel')) X.play('click'); },true);
      let lx=0,lz=0; setInterval(()=>{ try{ const p=ZG.pl; const d=Math.hypot(p.x-lx,p.z-lz); lx=p.x; lz=p.z; if(d>.3&&d<8&&!(ZG._meadowCut)) X.play('walk',420); }catch(e){} },200);
      try{ const o=ZG._applyReceivedSlap; if(o&&!o._zs){ ZG._applyReceivedSlap=function(){ X.play('slapped'); return o.apply(this,arguments); }; ZG._applyReceivedSlap._zs=1; } }catch(e){}
      try{ const o=ZG._placeCarried; if(o&&!o._zs){ ZG._placeCarried=function(){ const had=!!this.carrying; const r=o.apply(this,arguments); if(had) X.play('placed'); return r; }; ZG._placeCarried._zs=1; } }catch(e){}
      const wrap=(obj,name,ev,cond)=>{ try{ const o=obj&&obj[name]; if(typeof o!=='function'||o._zs) return; obj[name]=function(){ let pre; try{ pre=cond&&cond.pre?cond.pre():null; }catch(e){} const r=o.apply(this,arguments); try{ if(!cond||!cond.post||cond.post(pre)) X.play(ev); }catch(e){} return r; }; obj[name]._zs=1; }catch(e){} };
      const mt=()=>{ try{ return ZS.zoo.mt||0; }catch(e){ return 0; } }; const spent={pre:mt,post:p=>mt()<p};
      try{ ['_buyG','_bLuck','_buyPT','_bZ','_buyEgg','_buyEggLuck','_bSlapPack','_bT','_buyGondolaIdx'].forEach(n=>{ wrap(ZP,n,'buy',spent); wrap(ZG,n,'buy',spent); }); }catch(e){}
      wrap(ZP,'_buyFood','eat',spent); wrap(ZG,'_startCarry','pickup');
      try{ if(typeof ZHearts!=='undefined'){ wrap(ZHearts,'hit','heart',{pre:()=>ZHearts.hp,post:p=>ZHearts.hp<p}); wrap(ZHearts,'burn','heart'); wrap(ZHearts,'die','death'); } }catch(e){}
      try{ if(window.ZSweeper){ wrap(ZSweeper,'_sucked','sucked'); wrap(ZSweeper,'revenge','revenge',{post:()=>ZSweeper.rev&&ZSweeper.rev.done}); } }catch(e){}
      try{ if(window.ZMap) wrap(ZMap,'_click','map',{pre:()=>ZG.pl.x+','+ZG.pl.z,post:p=>p!==ZG.pl.x+','+ZG.pl.z}); }catch(e){}
      try{ if(window.ZGoals) wrap(ZGoals,'_finish','goal'); }catch(e){}
      // Zustands-Beobachtung
      let pj=false, prb=null, pmt=null, pfall=false, pcz=false;
      setInterval(()=>{ try{
        const j=!!ZG._jumping; if(j&&!pj) X.play('jump'); pj=j;
        const z=ZS.zoo; if(z){ if(prb!=null&&(z.reb||0)>prb) X.play('rebirth'); prb=z.reb||0; const m=z.mt||0; if(pmt!=null&&m-pmt>Math.max(50,pmt*.02)) X.play('money',2000); pmt=m; }
        const c2=window.ZCoaster2&&ZCoaster2.ride, f=!!(c2&&c2.fall); if(f&&!pfall) X.play('fall'); pfall=f;
        const cz=!!((window.ZCoaster&&ZCoaster.ride)||c2); if(cz&&!pcz) X.play('coaster'); pcz=cz;
      }catch(e){} },100);
      try{ new MutationObserver(ms=>{ ms.forEach(m=>m.addedNodes.forEach(n=>{ if(n.id==='zwish-got') X.play('wish'); })); }).observe(document.body,{childList:true}); }catch(e){}
      document.addEventListener('pointerdown',e=>{ try{ if(e.target&&e.target.id==='zcirc-open') X.play('circus'); }catch(x){} },true);
      try{ const o=window.ZSweeper&&ZSweeper.start; if(o&&!o._zs){ ZSweeper.start=function(){ X.play('sweeper'); return o.apply(this,arguments); }; ZSweeper.start._zs=1; } }catch(e){}
    },
    play(ev,minGap){
      const n=X.data.map&&X.data.map[ev]; if(!n) return; const u=X.data.slots&&X.data.slots[n]; if(!u) return;
      const now=Date.now(); if(minGap&&now-(X._last[ev]||0)<minGap) return; if(now-(X._last[ev]||0)<80) return; X._last[ev]=now;
      try{ const a=X.cache[n]||(X.cache[n]=new Audio(u)); const b=a.cloneNode(); b.volume=.9; b.play().catch(()=>{}); }catch(e){}
    },
    // ── Admin-Panel ──
    open(){
      if(!X.adm()||X.el) return;
      const o=document.createElement('div'); o.id='zsfx-panel'; o.style.cssText='position:fixed;inset:0;z-index:10006;background:rgba(0,0,0,.82);display:flex;align-items:center;justify-content:center;padding:14px'; X.el=o; document.body.appendChild(o);
      X._draw(true);
    },
    close(){ if(X.el){ X.el.remove(); X.el=null; } try{ X._stream&&X._stream.getTracks().forEach(t=>t.stop()); }catch(e){} X._stream=null; },
    _draw(first){
      const o=X.el; if(!o) return; const D=X.data;
      let rows=''; for(let i=1;i<=NSLOT;i++){ const has=!!D.slots[i]; rows+='<div style="display:flex;align-items:center;gap:6px;margin:5px 0;background:rgba(255,255,255,.07);border-radius:10px;padding:6px 8px"><b style="width:62px;font-size:.8rem">Sound '+i+'</b>'
        +'<button data-rec="'+i+'" style="background:'+(X._recN===i?'#e74c3c':'#c0392b')+';border:none;color:#fff;border-radius:8px;padding:6px 10px;font-weight:900;cursor:pointer">'+(X._recN===i?'⏹ Stopp':'🔴 Aufnehmen')+'</button>'
        +'<button data-pl="'+i+'" '+(has?'':'disabled')+' style="background:#2d7;border:none;color:#000;border-radius:8px;padding:6px 10px;font-weight:900;cursor:pointer;opacity:'+(has?1:.35)+'">▶</button>'
        +'<button data-del="'+i+'" '+(has?'':'disabled')+' style="background:rgba(255,255,255,.15);border:none;color:#fff;border-radius:8px;padding:6px 8px;cursor:pointer;opacity:'+(has?1:.35)+'">🗑</button></div>'; }
      let mp=''; EVENTS.forEach(([k,l])=>{ let op='<option value="">— kein Sound —</option>'; for(let i=1;i<=NSLOT;i++) if(D.slots[i]) op+='<option value="'+i+'"'+(String(D.map[k])===String(i)?' selected':'')+'>Sound '+i+'</option>'; mp+='<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin:5px 0;font-size:.8rem"><span>'+l+'</span><select data-map="'+k+'" style="background:#1d2540;color:#fff;border:1px solid rgba(255,255,255,.3);border-radius:8px;padding:5px">'+op+'</select></div>'; });
      o.innerHTML='<div style="background:linear-gradient(135deg,#1c2040,#11142a);border:1px solid rgba(140,160,255,.45);border-radius:16px;padding:16px;max-width:420px;width:100%;max-height:90vh;overflow-y:auto;color:#fff;font-family:Arial,sans-serif"><div style="display:flex;align-items:center;margin-bottom:8px"><h2 style="flex:1;margin:0;font-size:1.05rem">🎙️ Sound-Studio (Admin)</h2><button id="zsfx-x" style="background:none;border:none;color:#fff;font-size:1.3rem;cursor:pointer">✕</button></div>'
        +'<div style="font-size:.72rem;opacity:.75;margin-bottom:8px">Nimm bis zu 4 Sekunden auf. Danach wählst du unten, wann welcher Sound für <b>alle Spieler</b> abgespielt wird.</div><div id="zsfx-st" style="font-size:.75rem;color:#ffd54f;min-height:1em">'+(X._msg||'')+'</div>'+rows
        +'<div style="font-weight:900;margin:12px 0 4px;font-size:.85rem">Wann abspielen?</div>'+mp+'</div>';
      o.querySelector('#zsfx-x').onclick=()=>X.close();
      o.querySelectorAll('[data-rec]').forEach(b=>b.onclick=()=>X._rec(+b.dataset.rec));
      o.querySelectorAll('[data-pl]').forEach(b=>b.onclick=()=>{ try{ new Audio(D.slots[+b.dataset.pl]).play(); }catch(e){} });
      o.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{ const r=RT(); r&&r.ref('zoo_sounds/slots/'+b.dataset.del).remove(); Object.keys(D.map).forEach(k=>{ if(String(D.map[k])===b.dataset.del) r.ref('zoo_sounds/map/'+k).remove(); }); });
      o.querySelectorAll('[data-map]').forEach(s=>s.onchange=()=>{ const r=RT(); if(!r) return; if(s.value) r.ref('zoo_sounds/map/'+s.dataset.map).set(+s.value); else r.ref('zoo_sounds/map/'+s.dataset.map).remove(); X.play(s.dataset.map); });
    },
    _say(t){ X._msg=t; const e=document.getElementById('zsfx-st'); if(e) e.textContent=t; },
    async _rec(n){
      if(X._recN===n){ try{ X._mr&&X._mr.stop(); }catch(e){} return; } if(X._recN) return;
      try{
        if(!navigator.mediaDevices||!window.MediaRecorder){ X._say('❌ Dieses Gerät kann keine Aufnahme.'); return; }
        X._say('🎙️ Mikro wird angefragt … bitte erlauben.'); const st=await navigator.mediaDevices.getUserMedia({audio:true}); X._stream=st;
        const chunks=[]; const mr=new MediaRecorder(st); X._mr=mr; X._recN=n; X._draw();
        mr.ondataavailable=e=>{ if(e.data&&e.data.size) chunks.push(e.data); };
        mr.onstop=()=>{ clearTimeout(X._rt); X._recN=0; try{ st.getTracks().forEach(t=>t.stop()); }catch(e){} X._stream=null;
          const bl=new Blob(chunks,{type:mr.mimeType||'audio/webm'}); const fr=new FileReader(); fr.onload=()=>{ const r=RT(); const u=String(fr.result); if(u.length>200000){ X._say('❌ Zu lang/gross, bitte kürzer.'); X._draw(); return; } r&&r.ref('zoo_sounds/slots/'+n).set(u).then(()=>{ X._say('✅ Sound '+n+' gespeichert.'); }).catch(()=>X._say('❌ Speichern fehlgeschlagen.')); X._draw(); }; fr.readAsDataURL(bl); };
        mr.start(); X._say('🔴 Aufnahme läuft … (max. 4 s)'); X._rt=setTimeout(()=>{ try{ mr.stop(); }catch(e){} },MAXMS);
      }catch(e){ X._recN=0; X._say('❌ Mikro nicht erlaubt: '+(e&&e.name||'Fehler')); X._draw(); }
    }
  };
  const hook=()=>{ try{ if(!X.adm()||document.getElementById('hb-sfx')) return; const hl=document.getElementById('hleft'); if(!hl) return; const d=document.createElement('div'); d.className='hb'; d.id='hb-sfx'; d.style.position='relative'; d.innerHTML='<div class="hbb" style="background:rgba(200,60,60,.9)">🎙️</div><div class="hbl">Sounds</div>'; d.onclick=()=>X.open(); const menu=document.getElementById('hb-menu'); hl.insertBefore(d,menu||null); }catch(e){} };
  setInterval(()=>{ try{ X.init(); hook(); }catch(e){} },2000);
})();


/* ZLoginLog (v705) — 📋 Login-Protokoll: jeder Login wird gespeichert, Admin sieht die Liste */
(function(){
  const RT=()=>{ try{ return (typeof _rtdb!=='undefined'&&_rtdb)?_rtdb:null; }catch(e){ return null; } };
  const K=n=>String(n||'').toLowerCase().replace(/[.#$\[\]\/]/g,'_');
  const dev=()=>{ const u=navigator.userAgent||''; return /iPad/.test(u)?'iPad':/iPhone/.test(u)?'iPhone':/Android/.test(u)?(/Mobile/.test(u)?'Android-Handy':'Android-Tablet'):/Mac/.test(u)&&navigator.maxTouchPoints>1?'iPad':/Windows/.test(u)?'Windows-PC':/Mac/.test(u)?'Mac':/Linux/.test(u)?'Linux':'?'; };
  const L=window.ZLoginLog={ el:null, done:false,
    init(){
      if(L.done) return; const r=RT(); if(!r||typeof ZS==='undefined'||!ZS.player) return; L.done=true;
      try{ if(sessionStorage.getItem('zlog_'+ZS.player)) return; sessionStorage.setItem('zlog_'+ZS.player,'1'); }catch(e){}
      try{ const at=Date.now(); r.ref('zoo_loginlog/'+at+'_'+K(ZS.player)).set({name:ZS.player,at,dev:dev(),v:'v705'}); }catch(e){}
    },
    open(){
      if(L.el||!(window.ZSfx&&ZSfx.adm())) return; const r=RT(); if(!r) return;
      const o=document.createElement('div'); L.el=o; o.style.cssText='position:fixed;inset:0;z-index:10006;background:rgba(0,0,0,.82);display:flex;align-items:center;justify-content:center;padding:14px';
      o.innerHTML='<div style="background:#141a30;border:1px solid rgba(140,160,255,.45);border-radius:16px;padding:14px;max-width:460px;width:100%;max-height:90vh;overflow-y:auto;color:#fff;font-family:Arial,sans-serif"><div style="display:flex;align-items:center;margin-bottom:8px"><h2 style="flex:1;margin:0;font-size:1.05rem">📋 Login-Protokoll</h2><button id="zll-x" style="background:none;border:none;color:#fff;font-size:1.3rem;cursor:pointer">✕</button></div><div id="zll-b" style="font-size:.78rem">Lade …</div></div>';
      document.body.appendChild(o); o.querySelector('#zll-x').onclick=()=>L.close(); o.onclick=e=>{ if(e.target===o) L.close(); };
      r.ref('zoo_loginlog').limitToLast(400).once('value').then(s=>{ const v=s.val()||{}; const arr=Object.values(v).sort((a,b)=>b.at-a.at); const cnt={}, last={}; arr.forEach(e=>{ const k=e.name; cnt[k]=(cnt[k]||0)+1; if(!last[k]) last[k]=e; });
        const fmt=t=>new Date(t).toLocaleString('de-CH',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
        const users=Object.keys(last).sort((a,b)=>last[b].at-last[a].at).map(n=>'<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(255,255,255,.08)"><b>'+n+'</b><span style="opacity:.8">'+cnt[n]+'× · zuletzt '+fmt(last[n].at)+' · '+last[n].dev+'</span></div>').join('');
        const list=arr.slice(0,150).map(e=>'<div style="padding:2px 0;opacity:.9">'+fmt(e.at)+' · <b>'+e.name+'</b> · '+(e.dev||'?')+'</div>').join('');
        const b=o.querySelector('#zll-b'); if(b) b.innerHTML='<div style="font-weight:900;margin:2px 0 4px">👥 Alle Spieler ('+users.split('<div').length+')</div>'+users+'<div style="font-weight:900;margin:12px 0 4px">🕒 Letzte Logins</div>'+list+'<button id="zll-del" style="margin-top:12px;background:rgba(231,76,60,.7);border:none;color:#fff;border-radius:8px;padding:7px 12px;cursor:pointer;font-size:.72rem">🗑 Protokoll leeren</button>';
        const d=o.querySelector('#zll-del'); if(d) d.onclick=()=>{ if(confirm('Wirklich alles löschen?')){ r.ref('zoo_loginlog').remove(); L.close(); } };
      }).catch(()=>{ const b=o.querySelector('#zll-b'); if(b) b.textContent='❌ Konnte nicht laden.'; });
    },
    close(){ if(L.el){ L.el.remove(); L.el=null; } }
  };
  const hook=()=>{ try{ if(!(window.ZSfx&&ZSfx.adm())||document.getElementById('hb-llog')) return; const hl=document.getElementById('hleft'); if(!hl) return; const d=document.createElement('div'); d.className='hb'; d.id='hb-llog'; d.style.position='relative'; d.innerHTML='<div class="hbb" style="background:rgba(60,110,200,.9)">📋</div><div class="hbl">Logins</div>'; d.onclick=()=>L.open(); hl.insertBefore(d,document.getElementById('hb-menu')||null); }catch(e){} };
  setInterval(()=>{ try{ L.init(); hook(); }catch(e){} },2000);
})();
