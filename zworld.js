/* ZWorld — Welt-Bauer (nur Admin): Objekte im ganzen Zoo platzieren, für alle sichtbar (RTDB zoo_world/objs). (v677)
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
/* ZCodes — Admin-Codes (v677): Admin erstellt Codes (nur 1 Person oder alle je 1×, mit Belohnung), Spieler lösen sie im Shop unter „Code einlösen“ ein.
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
    on(){ try{ if(typeof ZG==='undefined'||!ZG.scene||!ZG.cam||!ZS.zoo) return false; if(typeof rebHas==='function'&&!rebHas('weather')&&!(W.ovr&&W.ovr.type==='storm'&&W.ovr.until>Date.now())) return false; if(ZG._jumpActive||ZG._arcadeActive||ZG._mazeActive||ZG._trashActive||ZG._iceRoomActive) return false; return true; }catch(e){ return false; } },
    adminSet(type,dirRad,mins){ const r=R(); if(!r) return Promise.reject(new Error('Keine Cloud')); if(!type){ return r.ref('zoo_weather').remove(); } return r.ref('zoo_weather').set({type,dir:(dirRad==null?Math.random()*Math.PI*2:dirRad),until:Date.now()+Math.max(1,mins||10)*60000,by:ZS.player,id:Date.now()}); },
    _mkUI(){
      if(W._ui) return; const d=document.createElement('div'); d.id='zw-ui';
      d.innerHTML='<div id="zw-tint" style="position:fixed;inset:0;pointer-events:none;z-index:4;opacity:0;transition:opacity 1.5s"></div><div id="zw-sun" style="position:fixed;top:-20px;right:-20px;font-size:7rem;pointer-events:none;z-index:4;opacity:0;transition:opacity 1.5s;filter:drop-shadow(0 0 30px rgba(255,220,80,.9))">☀️</div>'
        +'<div id="zw-chip" style="position:fixed;left:8px;top:70px;z-index:600;background:rgba(0,0,0,.55);color:#fff;font:700 .72rem Arial;padding:4px 9px;border-radius:14px;display:none;align-items:center;gap:6px;pointer-events:none"><span id="zw-t"></span></div>';
      document.body.appendChild(d); W._ui=d;
    },
    _mkRain(){
      if(W._rain) return; const N=520, pos=new Float32Array(N*6), dr=[]; for(let i=0;i<N;i++) dr.push({x:(Math.random()-.5)*50,y:Math.random()*24,z:(Math.random()-.5)*50});
      const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); const m=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0xa9d0ff,transparent:true,opacity:.65})); m.frustumCulled=false; m.visible=false; ZG.scene.add(m); W._rain={m,g,dr,N};
    },
    // ⚡ Blitze: Warnkreis am Boden (1,2 s), dann Einschlag. Wer im Kreis steht: 3 Herzen Schaden + „BLITZ"
    _flash(op){ let f=document.getElementById('zw-bolt'); if(!f){ f=document.createElement('div'); f.id='zw-bolt'; f.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:5;background:#fff;opacity:0'; document.body.appendChild(f); } f.style.transition='none'; f.style.opacity=op; setTimeout(()=>{ f.style.transition='opacity .5s'; f.style.opacity=0; },60); },
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
      tint.style.background=c.type==='storm'?'rgba(3,5,22,.66)':c.type==='rain'?'rgba(45,65,100,.28)':c.type==='sun'?'radial-gradient(circle at 90% 0%,rgba(255,220,100,.28),rgba(255,200,80,.06) 60%)':'transparent'; tint.style.opacity=(c.type==='clear')?0:1;
      sun.style.opacity=c.type==='sun'?1:0; chip.style.display='flex'; W._ui.querySelector('#zw-t').textContent=T.ic+' '+T.n+(c.ovr?' (Admin)':'');
      W.frame(dt); W._puddles(c,dt);
      if(c.type==='storm') W._strikeTick(dt); else if(W._strikes.length) W._clearStrikes();
    }
  };
  setInterval(()=>{ try{ W._step(); }catch(e){} },33);
})();

;
/* ZHelp (v677) — 💬 sprechende Fehlermeldungen (Wartezeit-Schätzung) + 🎬 Mini-Tipp-Animation beim ersten Öffnen einer Funktion. */
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
/* ZTipp (v677) — ⚽ Tippspiel: VfB-Stuttgart-Spiele (OpenLigaDB), Tipp abgeben, bei richtigem Ergebnis +20 % des Guthabens. Tipps liegen in ZS.zoo.tips. */
(function(){
  'use strict';
  const TEAM=16, API='https://api.openligadb.de/getmatchesbyteamid/'+TEAM+'/2/6';
  const fmt=v=>{ try{ if(typeof $mt==='function') return $mt(v); }catch(e){} return Math.round(v).toLocaleString('de-CH'); };
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const toast=(m,ms)=>{ try{ ZP.toast(m,ms||3000); }catch(e){} };
  const bal=()=>{ try{ return (ZS.dsMT||0)+(ZS.zoo.mt||0); }catch(e){ return 0; } };
  const T=window.ZTipp={
    games:[], err:null, at:0, el:null, sel:null, _iv:null, loading:false,
    // Normalisiert ein Spiel: s = Stuttgart-Tore, o = Gegner-Tore (links Stuttgart, rechts Gegner – egal ob Heim oder Auswärts)
    _norm(m){
      const home=m.team1&&m.team1.teamId===TEAM, opp=home?m.team2:m.team1, ko=Date.parse(m.matchDateTimeUTC||m.matchDateTime||'')||0;
      let r1=null,r2=null; const res=(m.matchResults||[]).find(x=>x.resultTypeID===2)||null;
      if(res){ r1=res.pointsTeam1; r2=res.pointsTeam2; }
      else if(m.goals&&m.goals.length){ const g=m.goals[m.goals.length-1]; r1=g.scoreTeam1; r2=g.scoreTeam2; }
      const fin=!!m.matchIsFinished&&res!=null;
      return {id:String(m.matchID),ko,opp:(opp&&(opp.shortName||opp.teamName))||'Gegner',oppFull:(opp&&opp.teamName)||'',league:(m.leagueName||'').replace(/\s*\d{4}\/\d{4}/,''),home,fin,s:r1==null?null:(home?r1:r2),o:r1==null?null:(home?r2:r1),live:!fin&&ko<=Date.now()};
    },
    async load(){
      if(T.loading) return; T.loading=true;
      try{
        const r=await fetch(API,{cache:'no-store'}); if(!r.ok) throw new Error('HTTP '+r.status);
        const a=await r.json(); const lim=Date.now()+35*86400000;
        T.games=(a||[]).map(T._norm).filter(g=>g.ko&&(g.ko<lim)).sort((x,y)=>x.ko-y.ko); T.err=null; T.at=Date.now();
        T.settle();
      }catch(e){ T.err=(e&&e.message)||'Fehler'; }
      T.loading=false; T.draw();
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
      let h='<div style="max-width:440px;margin:0 auto;padding:12px 12px 40px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><div style="flex:1;font-weight:900;color:#ff6b6b;font-size:1.05rem">⚽ Tippspiel · VfB Stuttgart</div><button id="zt-x" style="background:rgba(255,255,255,.12);border:none;color:#fff;border-radius:50%;width:34px;height:34px;font-size:1rem;cursor:pointer">✕</button></div>';
      if(g){
        const t=tp[g.id], can=g.ko>Date.now()&&!g.fin;
        h+='<button id="zt-back" style="background:rgba(255,255,255,.1);border:none;color:#fff;border-radius:8px;padding:6px 12px;cursor:pointer;margin-bottom:8px">← Alle Spiele</button>'
          +'<div style="text-align:center;font-size:.78rem;color:rgba(255,255,255,.6)">'+esc(g.league)+' · '+T._when(g.ko)+' · '+(g.home?'Heim':'Auswärts')+'</div>'
          +'<div style="display:flex;align-items:center;justify-content:center;gap:10px;margin:14px 0"><div style="flex:1;text-align:center"><div style="font-weight:900;font-size:.95rem">VfB Stuttgart</div><input id="zt-h" type="number" min="0" max="20" inputmode="numeric" value="'+(t?t.h:0)+'" '+(can?'':'disabled')+' style="width:74px;margin-top:8px;padding:12px 4px;font-size:1.6rem;font-weight:900;text-align:center;border-radius:12px;border:2px solid #ff6b6b;background:#161c2c;color:#fff"></div><div style="font-size:1.6rem;font-weight:900">:</div><div style="flex:1;text-align:center"><div style="font-weight:900;font-size:.95rem">'+esc(g.opp)+'</div><input id="zt-a" type="number" min="0" max="20" inputmode="numeric" value="'+(t?t.a:0)+'" '+(can?'':'disabled')+' style="width:74px;margin-top:8px;padding:12px 4px;font-size:1.6rem;font-weight:900;text-align:center;border-radius:12px;border:2px solid #64b5f6;background:#161c2c;color:#fff"></div></div>';
        if(can) h+='<button id="zt-go" style="display:block;width:100%;padding:12px;border-radius:12px;border:none;background:#ff6b6b;color:#fff;font-weight:900;font-size:1rem;cursor:pointer">'+(t?'Tipp ändern':'Tipp abgeben')+'</button><div style="font-size:.7rem;color:rgba(255,255,255,.55);text-align:center;margin-top:6px">Du kannst bis zum Anpfiff ändern. Richtiges Ergebnis = 20 % deines Guthabens.</div>';
        else h+='<div style="text-align:center;font-weight:800;margin-top:6px">'+(g.fin?'Endstand ':'🔴 läuft · Stand ')+(g.s==null?'?':g.s+' : '+g.o)+'</div>'+(t?'<div style="text-align:center;margin-top:8px">Dein Tipp: <b>'+t.h+' : '+t.a+'</b> '+(t.paid?(t.won?'✅ richtig! +'+fmt(t.rw||0):'❌ leider falsch'):'· wird nach dem Abpfiff ausgewertet')+'</div>':'<div style="text-align:center;margin-top:8px;color:rgba(255,255,255,.55)">Du hast nicht getippt.</div>');
      } else {
        h+='<div style="font-size:.74rem;color:rgba(255,255,255,.6);margin-bottom:8px">Tippe auf ein Spiel und gib dein Ergebnis ein (links Stuttgart, rechts Gegner). Nach dem Abpfiff gewinnst du bei richtigem Tipp 20 % deines Guthabens.</div>';
        if(T.err&&!T.games.length) h+='<div style="padding:14px;border-radius:10px;background:rgba(255,80,80,.15);font-size:.8rem">❌ Spielplan konnte nicht geladen werden ('+esc(T.err)+'). Prüfe deine Verbindung – es versucht es alle 30 Sek. neu.</div>';
        else if(!T.games.length) h+='<div style="padding:14px;text-align:center;color:rgba(255,255,255,.6)">'+(T.at?'Keine Spiele im nächsten Monat gefunden.':'Lade Spielplan …')+'</div>';
        h+=T.games.map(x=>{ const t=tp[x.id]; const st=x.fin?('Endstand '+x.s+':'+x.o):x.live?'🔴 läuft '+(x.s==null?'':x.s+':'+x.o):'';
          const badge=t?('<span style="font-size:.7rem;background:rgba(125,255,176,.18);border:1px solid #7dffb0;border-radius:8px;padding:2px 7px">'+(t.paid?(t.won?'✅ ':'❌ '):'')+'Tipp '+t.h+':'+t.a+'</span>'):'<span style="font-size:.7rem;color:rgba(255,255,255,.45)">kein Tipp</span>';
          return '<div data-g="'+x.id+'" style="padding:11px 12px;margin:7px 0;border-radius:12px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);cursor:pointer"><div style="font-size:.7rem;color:rgba(255,255,255,.55)">'+T._when(x.ko)+' · '+esc(x.league)+'</div><div style="font-weight:900;margin:3px 0">VfB Stuttgart – '+esc(x.oppFull||x.opp)+'</div><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:.78rem;color:#ffd54f">'+st+'</span>'+badge+'</div></div>'; }).join('');
      }
      el.innerHTML=h+'</div>';
      const q=id=>el.querySelector(id); q('#zt-x').onclick=T.close;
      el.querySelectorAll('[data-g]').forEach(d=>d.onclick=()=>{ T.sel=d.dataset.g; T.draw(); });
      if(g){ q('#zt-back').onclick=()=>{ T.sel=null; T.draw(); };
        const go=q('#zt-go'); if(go) go.onclick=()=>{ if(g.ko<=Date.now()){ toast('⏱️ Das Spiel hat schon begonnen.'); T.draw(); return; } const hh=Math.max(0,Math.min(20,Math.floor(+q('#zt-h').value||0))), aa=Math.max(0,Math.min(20,Math.floor(+q('#zt-a').value||0))); const tp=T.tips(); tp[g.id]={h:hh,a:aa,t:Date.now()}; try{ ZS.save&&ZS.save(true); }catch(e){} toast('✅ Tipp gespeichert: Stuttgart '+hh+' : '+aa+' '+g.opp,3000); T.sel=null; T.draw(); }; }
    }
  };
  // Im Hintergrund auswerten, solange offene Tipps existieren
  setInterval(()=>{ try{ if(typeof ZS==='undefined'||!ZS.zoo) return; const tp=ZS.zoo.tips||{}; if(Object.keys(tp).some(k=>!tp[k].paid)&&Date.now()-T.at>180000) T.load(); }catch(e){} },30000);
  try{ if(window.ZHelp) ZHelp.TIPS.tipp={t:'Tippspiel',s:['⚽','➜','🔢','➜','💰'],d:'Wähle ein VfB-Spiel und tippe das Ergebnis (links Stuttgart, rechts Gegner). Stimmt es nach dem Abpfiff, bekommst du 20 % deines Guthabens!'}; }catch(e){}
})();
