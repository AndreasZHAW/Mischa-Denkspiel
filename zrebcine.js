/* ═══ ZRebCine (v894): 3D-Trailer zur Freischaltung von Rebirth 6+7 und Rebirth 8 (ca. 1 Minute, echte 3D-Kamerafahrt) ═══
   • Läuft in der echten 3D-Welt des Spiels (Drohnenflug über den Zoo) + eigener Bühne (Bu:), Feuerwerk, Laternen mit Spielernamen, Scheinwerfer …
   • 'A' = Rebirth 6 & 7 (Zoo, Bu:) drückt FREIGEBEN, Feuerwerk, Piraten-Schiff & Kraken)
   • 'B' = Rebirth 8 (Freizeitpark: Band durchschneiden, Achterbahn-Fahrt, Riesenrad, Heissluftballon)
   • Online-Spieler sehen ihn sofort, wenn der Admin veröffentlicht; wer offline war, sieht ihn beim nächsten Login (bis 3 Tage danach), jeweils nur einmal.
   • Admin-Panel: „Trailer testen" – spielt nur beim Admin. */
(function(){
  'use strict';
  if(window.ZRebCine) return;
  const C=window.ZRebCine={on:false,test:false};
  const T=()=>window.THREE, ZGg=()=>(typeof ZG!=='undefined'?ZG:null);
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)), seg=(t,a,b)=>clamp((t-a)/(b-a),0,1), sm=x=>x*x*(3-2*x), lerp=(a,b,u)=>a+(b-a)*u;
  const rnd=(()=>{ let s=1234567; return ()=>{ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; })();
  const SX=-1800, SZ=-1800, DUR=62;
  const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ls={ get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }, set(k,v){ try{ localStorage.setItem(k,v); }catch(e){} } };
  const RTD=()=>{ try{ return (typeof _rtdb!=='undefined'&&_rtdb&&State._useCloud())?_rtdb:null; }catch(e){ return null; } };
  // ── Material / Sprites ──
  const MC={}; const mb=(c,o)=>{ const k=c+(o?JSON.stringify(o):''); return MC[k]||(MC[k]=new (T().MeshBasicMaterial)(Object.assign({color:c},o||{}))); };
  const bx=(w,h,d,c,x,y,z,g,o)=>{ const m=new (T().Mesh)(new (T().BoxGeometry)(w,h,d),mb(c,o)); m.position.set(x,y,z); if(g) g.add(m); return m; };
  const cy=(a,b,h,c,x,y,z,g,n,o)=>{ const m=new (T().Mesh)(new (T().CylinderGeometry)(a,b,h,n||12),mb(c,o)); m.position.set(x,y,z); if(g) g.add(m); return m; };
  const sp=(c,r,x,y,z,g,o)=>{ const m=new (T().Mesh)(new (T().SphereGeometry)(r,14,10),mb(c,o)); m.position.set(x,y,z); if(g) g.add(m); return m; };
  const cvs=(w,h)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; };
  const label=(txt,sx,sy,o)=>{ o=o||{}; const w=o.w||512,h=o.h||Math.round(w*sy/sx), c=cvs(w,h), g=c.getContext('2d'); if(o.bg){ g.fillStyle=o.bg; g.beginPath(); g.moveTo(24,0); g.arcTo(w,0,w,h,24); g.arcTo(w,h,0,h,24); g.arcTo(0,h,0,0,24); g.arcTo(0,0,w,0,24); g.fill(); }
    g.font='900 '+(o.fs||h*.55)+'px Arial Black, Arial, sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.lineJoin='round'; g.lineWidth=(o.fs||h*.55)/7; g.strokeStyle=o.stroke||'rgba(0,0,0,.8)'; if(o.glow){ g.shadowColor=o.glow; g.shadowBlur=26; } g.strokeText(txt,w/2,h/2+2); g.fillStyle=o.col||'#fff'; g.fillText(txt,w/2,h/2+2);
    const sp=new (T().Sprite)(new (T().SpriteMaterial)({map:new (T().CanvasTexture)(c),transparent:true,depthWrite:false,depthTest:o.depth!==false,fog:false})); sp.scale.set(sx,sy,1); return sp; };
  const emo=e=>{ const c=cvs(128,128), g=c.getContext('2d'); g.font='96px serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(e,64,68); return new (T().Sprite)(new (T().SpriteMaterial)({map:new (T().CanvasTexture)(c),transparent:true,depthWrite:false})); };
  // ── Audio ──
  let AC=null, AG=null, snd=true;
  const audioOn=()=>{ try{ AC=AC||new (window.AudioContext||window.webkitAudioContext)(); if(AC.state==='suspended') AC.resume(); AG=AC.createGain(); AG.gain.value=snd?1:0; AG.connect(AC.destination); }catch(e){ AC=null; } };
  const tone=(f,t0,d,type,v)=>{ if(!AC||!AG) return; try{ const o=AC.createOscillator(), g=AC.createGain(); o.type=type||'triangle'; o.frequency.value=f; const t=AC.currentTime+t0; g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(v||.12,t+.03); g.gain.exponentialRampToValueAtTime(.0001,t+d); o.connect(g); g.connect(AG); o.start(t); o.stop(t+d+.05); }catch(e){} };
  const noise=(t0,d,v,f)=>{ if(!AC||!AG) return; try{ const n=AC.sampleRate*d, b=AC.createBuffer(1,n,AC.sampleRate), a=b.getChannelData(0); for(let i=0;i<n;i++) a[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.2); const s=AC.createBufferSource(); s.buffer=b; const fl=AC.createBiquadFilter(); fl.type='lowpass'; fl.frequency.value=f||900; const g=AC.createGain(); g.gain.value=v||.3; s.connect(fl); fl.connect(g); g.connect(AG); s.start(AC.currentTime+t0); }catch(e){} };
  const NOTES={C:261.6,D:293.7,E:329.6,F:349.2,G:392,A:440,B:493.9,c:523.3,d:587.3,e:659.3,g:784};
  let musicIv=null; const music=kind=>{ clearInterval(musicIv); let beat=0; const ch=kind==='B'?[['C','E','G'],['F','A','c'],['G','B','d'],['C','E','G']]:[['A','c','e'],['F','A','c'],['C','E','G'],['G','B','d']];
    const step=()=>{ const c=ch[Math.floor(beat/4)%4]; const n=c[beat%3]; tone(NOTES[n]*(beat%8===0?.5:1),0,.5,'triangle',.07); if(beat%4===0) tone(NOTES[c[0]]*.5,0,1.2,'sine',.09); if(beat%2===0) noise(0,.08,.05,3000); beat++; };
    step(); musicIv=setInterval(step,270); };
  // ── Feuerwerk ──
  const FW={N:5000};
  const fwInit=g=>{ const N=FW.N, geo=new (T().BufferGeometry)(); FW.pos=new Float32Array(N*3); FW.col=new Float32Array(N*3); FW.vel=new Float32Array(N*3); FW.life=new Float32Array(N); FW.base=new Float32Array(N*3); FW.i=0;
    for(let i=0;i<N;i++) FW.pos[i*3+1]=-9999;
    geo.setAttribute('position',new (T().BufferAttribute)(FW.pos,3)); geo.setAttribute('color',new (T().BufferAttribute)(FW.col,3));
    FW.pts=new (T().Points)(geo,new (T().PointsMaterial)({size:5,vertexColors:true,transparent:true,blending:T().AdditiveBlending,depthWrite:false,sizeAttenuation:true,fog:false})); FW.pts.frustumCulled=false; g.add(FW.pts); FW.rk=[]; };
  const fwEmit=(x,y,z,col,n,spd,g)=>{ const c=new (T().Color)(col); for(let k=0;k<n;k++){ const i=FW.i=(FW.i+1)%FW.N; const a=rnd()*6.283, b=Math.acos(2*rnd()-1), s=spd*(.55+.45*rnd());
      FW.pos[i*3]=x; FW.pos[i*3+1]=y; FW.pos[i*3+2]=z; FW.vel[i*3]=Math.sin(b)*Math.cos(a)*s; FW.vel[i*3+1]=Math.cos(b)*s; FW.vel[i*3+2]=Math.sin(b)*Math.sin(a)*s; FW.base[i*3]=c.r; FW.base[i*3+1]=c.g; FW.base[i*3+2]=c.b; FW.life[i]=1+rnd()*.8; } };
  const COLS=[0xff3b30,0xffd60a,0x30d158,0x0a84ff,0xbf5af2,0xff9f0a,0xffffff,0x64d2ff];
  const burst=(x,y,z,big)=>{ const c1=COLS[Math.floor(rnd()*COLS.length)], c2=COLS[Math.floor(rnd()*COLS.length)]; fwEmit(x,y,z,c1,big?170:110,big?34:26); fwEmit(x,y,z,c2,big?70:40,big?16:12); noise(.05,.9,big?.35:.22,700+rnd()*500); };
  const rocket=(x,z,y0,y1)=>{ FW.rk.push({x,z,y:y0,y1,v:(y1-y0)/.85}); try{ noise(0,.5,.08,2400); }catch(e){} };
  const fwUpdate=dt=>{ if(!FW.pts) return; const N=FW.N; for(let i=0;i<N;i++){ if(FW.life[i]<=0){ FW.col[i*3]=FW.col[i*3+1]=FW.col[i*3+2]=0; continue; } FW.life[i]-=dt; FW.vel[i*3+1]-=7*dt; FW.vel[i*3]*=.985; FW.vel[i*3+2]*=.985; FW.pos[i*3]+=FW.vel[i*3]*dt; FW.pos[i*3+1]+=FW.vel[i*3+1]*dt; FW.pos[i*3+2]+=FW.vel[i*3+2]*dt; const f=clamp(FW.life[i],0,1); FW.col[i*3]=FW.base[i*3]*f; FW.col[i*3+1]=FW.base[i*3+1]*f; FW.col[i*3+2]=FW.base[i*3+2]*f; }
    for(let k=FW.rk.length-1;k>=0;k--){ const r=FW.rk[k]; r.y+=r.v*dt; fwEmit(r.x,r.y,r.z,0xffd27f,2,3); if(r.y>=r.y1){ burst(r.x,r.y,r.z,r.big); FW.rk.splice(k,1); } }
    FW.pts.geometry.attributes.position.needsUpdate=true; FW.pts.geometry.attributes.color.needsUpdate=true; };
  // ── Figur: Bu:) ──
  const mkBu=()=>{ const g=new (T().Group)(); const legs=[-.18,.18].map(x=>{ const l=new (T().Group)(); l.position.set(x,.9,0); bx(.28,.9,.3,0x1a237e,0,-.45,0,l); g.add(l); return l; });
    bx(.8,.95,.45,0xe53935,0,1.4,0,g); bx(.84,.18,.5,0xffd54f,0,.98,0,g);
    const arms=[-.55,.55].map(x=>{ const a=new (T().Group)(); a.position.set(x,1.8,0); bx(.24,.8,.26,0xe53935,0,-.4,0,a); sp(0xffcc99,.15,0,-.85,0,a); g.add(a); return a; });
    sp(0xffcc99,.42,0,2.3,0,g); sp(0x3e2723,.44,0,2.42,-.04,g).scale.set(1,.6,1); bx(.08,.1,.05,0x000,-.15,2.33,.38,g); bx(.08,.1,.05,0x000,.15,2.33,.38,g); bx(.22,.05,.05,0x8b0000,0,2.16,.4,g);
    const cape=bx(.95,1.35,.06,0xb71c1c,0,1.35,-.3,g); const crown=cy(.3,.38,.25,0xffd54f,0,2.85,0,g,8); const nm=label('Bu:)',3.2,1,{w:384,h:120,col:'#ffd54f',glow:'#ff0'}); nm.position.set(0,3.6,0); g.add(nm);
    g.userData={legs,arms,cape}; return g; };
  // ── Aufbau ──
  const stageBase=(G,night)=>{ const gr=new (T().Mesh)(new (T().CircleGeometry)(520,48),mb(night?0x1b3a2a:0x5fbf5a)); gr.rotation.x=-Math.PI/2; gr.position.set(SX,0,SZ); G.add(gr);
    const st=cy(24,26,.9,night?0x37474f:0xb0bec5,SX,.45,SZ,G,40); bx(1,.1,1,0xfff,0,-9,0,G); return st; };
  const stars=G=>{ const g=new (T().BufferGeometry)(), n=900, p=new Float32Array(n*3); for(let i=0;i<n;i++){ const a=rnd()*6.283, b=Math.acos(rnd()*.95+.05), r=3000; p[i*3]=SX+r*Math.sin(b)*Math.cos(a); p[i*3+1]=r*Math.cos(b); p[i*3+2]=SZ+r*Math.sin(b)*Math.sin(a); } g.setAttribute('position',new (T().BufferAttribute)(p,3)); const m=new (T().Points)(g,new (T().PointsMaterial)({size:7,color:0xffffff,sizeAttenuation:false,fog:false})); m.frustumCulled=false; G.add(m); };
  const beams=(G,n,R,cols)=>{ const arr=[]; for(let i=0;i<n;i++){ const a=i/n*6.283; const b=new (T().Mesh)(new (T().CylinderGeometry)(.6,7,90,14,1,true),new (T().MeshBasicMaterial)({color:cols?cols[i%cols.length]:0xbfe4ff,transparent:true,opacity:.17,blending:T().AdditiveBlending,depthWrite:false,side:T().DoubleSide,fog:false})); b.position.set(SX+Math.cos(a)*R,45,SZ+Math.sin(a)*R); b.userData={a0:a,R}; G.add(b); arr.push(b); } return arr; };
  const lanterns=(G,names,cx,cz)=>{ const arr=[]; names.forEach((nm,i)=>{ const a=i*2.4, r=18+(i%5)*9; const l=new (T().Group)(); const e=emo('🏮'); e.scale.set(5,5,1); l.add(e); const t=label(nm,6,1.6,{w:512,h:136,col:'#fff'}); t.position.y=-3.6; l.add(t); l.position.set(cx+Math.cos(a)*r,-10,cz+Math.sin(a)*r); l.userData={y0:-10-(i%4)*6,vy:3+(i%3),a,r,cx,cz}; G.add(l); arr.push(l); }); return arr; };
  const mkShip=()=>{ const g=new (T().Group)(); const hull=new (T().Mesh)(new (T().BoxGeometry)(7,2.6,22),mb(0x5d3a1a)); hull.position.y=1.3; g.add(hull); bx(7.6,.5,22.6,0x3e2410,0,2.7,0,g); const bow=new (T().Mesh)(new (T().ConeGeometry)(3.5,8,4),mb(0x5d3a1a)); bow.rotation.x=-Math.PI/2; bow.rotation.y=Math.PI/4; bow.position.set(0,1.4,15); g.add(bow);
    [-4,3.5].forEach((z,i)=>{ cy(.35,.4,i?16:20,0x3e2410,0,12,z,g,8); const s=bx(8,i?9:11,.2,0xf5f0e1,0,i?13:14.5,z+.4,g); s.userData.sail=1; }); const fl=bx(3,1.8,.1,0x111,1.6,22.4,-4,g); sp(0xffffff,.4,1.6,22.4,-3.9,g); g.userData.flag=fl;
    bx(1,.8,.8,0xffb300,0,3.4,-10,g); return g; };
  const mkKraken=()=>{ const g=new (T().Group)(), arms=[]; for(let i=0;i<6;i++){ const a=i/6*6.283; const arm=new (T().Group)(); arm.position.set(Math.cos(a)*24,0,Math.sin(a)*24); for(let k=0;k<8;k++){ const s=cy(1.8-k*.18,1.8-(k+1)*.18,3,0x7b1fa2,0,k*3+1.5,0,arm,8); s.userData.k=k; } arm.userData={a,ph:i*1.1}; g.add(arm); arms.push(arm); } sp(0x7b1fa2,6,0,2,60,g).visible=false; g.userData.arms=arms; return g; };
  const mkFerris=(g,x,z)=>{ const w=new (T().Group)(); w.position.set(x,24,z); const R=20; const ring=new (T().Mesh)(new (T().TorusGeometry)(R,.5,6,48),mb(0xffffff)); w.add(ring); const ring2=new (T().Mesh)(new (T().TorusGeometry)(R*.55,.35,6,36),mb(0xffd54f)); w.add(ring2);
    const gs=[]; for(let i=0;i<12;i++){ const a=i/12*6.283; const sp1=bx(.25,R,.25,0xe0e0e0,0,0,0,w); sp1.rotation.z=a; sp1.position.set(Math.cos(a)*R/2,Math.sin(a)*R/2,0); sp1.rotation.z=a-Math.PI/2; const gon=new (T().Group)(); gon.position.set(Math.cos(a)*R,Math.sin(a)*R,0); bx(2.2,1.8,2.4,[0xff3b30,0x0a84ff,0xffd60a,0x30d158][i%4],0,-1.4,0,gon); bx(.1,1.4,.1,0x888,0,-.2,0,gon); w.add(gon); gs.push(gon); }
    g.add(w); const a1=bx(.8,26,.8,0xeeeeee,0,13,z-3,g); a1.position.x=x; const a2=bx(.8,26,.8,0xeeeeee,0,13,z+3,g); a2.position.x=x; a1.rotation.x=.12; a2.rotation.x=-.12; w.userData.gs=gs; return w; };
  const mkCarousel=(g,x,z)=>{ const c=new (T().Group)(); c.position.set(x,0,z); cy(12,12,1,0xffd54f,0,.5,0,c,24); const rot=new (T().Group)(); c.add(rot); cy(1.4,1.4,10,0xffffff,0,5,0,rot,10); for(let i=0;i<8;i++){ const a=i/8*6.283; const h=new (T().Group)(); h.position.set(Math.cos(a)*8,0,Math.sin(a)*8); cy(.12,.12,7,0xffd54f,0,4.5,0,h,6); bx(1.2,1.6,2.4,[0xffffff,0xff7043,0x4fc3f7,0xba68c8][i%4],0,3,0,h); sp(0xffffff,.55,0,4.2,1.3,h); h.userData.ph=a; rot.add(h); }
    const roof=new (T().Mesh)(new (T().ConeGeometry)(13,5,24),mb(0xe53935)); roof.position.y=11; c.add(roof); g.add(c); c.userData.rot=rot; return c; };
  const mkCoaster=(g,cx,cz)=>{ const pts=[]; for(let i=0;i<14;i++){ const a=i/14*6.283; const r=70+Math.sin(a*3)*14; pts.push(new (T().Vector3)(cx+Math.cos(a)*r,10+Math.abs(Math.sin(a*2.5))*30+(i%4===1?14:0),cz+Math.sin(a)*r*.8)); }
    const cur=new (T().CatmullRomCurve3)(pts,true); const tube=new (T().Mesh)(new (T().TubeGeometry)(cur,240,.55,5,true),mb(0xe53935)); g.add(tube); const tube2=new (T().Mesh)(new (T().TubeGeometry)(cur,240,.18,4,true),mb(0xffffff)); tube2.position.y=-1.1; g.add(tube2);
    for(let k=0;k<60;k++){ const p=cur.getPoint(k/60); cy(.25,.25,p.y,0xcfd8dc,p.x,p.y/2,p.z,g,5); }
    const cart=new (T().Group)(); bx(2,1,3.2,0xffd54f,0,.3,0,cart); bx(1.8,.8,.2,0x4a4a4a,0,.8,-.9,cart); g.add(cart); return {cur,cart}; };
  const mkBalloon=g=>{ const b=new (T().Group)(); const cols=[0xff3b30,0xffd60a,0x30d158,0x0a84ff,0xbf5af2,0xff9f0a]; for(let i=0;i<6;i++){ const m=new (T().Mesh)(new (T().SphereGeometry)(9,14,10,i/6*6.283,6.283/6,0,2.4),new (T().MeshBasicMaterial)({color:cols[i],side:T().DoubleSide})); b.add(m); } bx(2.4,1.6,2.4,0x8d6e63,0,-11,0,b); [[1,1],[-1,1],[1,-1],[-1,-1]].forEach(q=>bx(.08,5,.08,0x444,q[0]*.9,-8.3,q[1]*.9,b)); const bn=label('REBIRTH 8',16,3.6,{w:768,h:172,col:'#ffd54f',glow:'#fa0'}); bn.position.set(0,-18,0); b.add(bn); return b; };
  const mkGate=g=>{ const G2=new (T().Group)(); G2.position.set(SX,0,SZ+40); [-14,14].forEach(x=>{ bx(3,22,3,0xe53935,x,11,0,G2); sp(0xffd54f,2.2,x,23,0,G2); }); bx(32,4,3,0xffd54f,0,22,0,G2); const bn=label('MISCHA PARK',26,6,{w:768,h:180,col:'#fff',glow:'#f0f'}); bn.position.set(0,26.5,.5); G2.add(bn);
    const lights=[]; for(let i=0;i<24;i++){ const l=sp(0x333333,.55,-14+i*28/23,19.8-Math.sin(i/23*Math.PI)*2,2,G2); l.material=l.material.clone(); lights.push(l); } const rib=bx(26,.7,.4,0xff1744,0,6,0,G2); const rL=bx(13,.7,.4,0xff1744,-6.5,6,0,G2), rR=bx(13,.7,.4,0xff1744,6.5,6,0,G2); rib.visible=false; g.add(G2); G2.userData={lights,rL,rR}; return G2; };
  // ── Kamera-Regie ──
  const orb=(cx,cz,r,h,a,ly,ty)=>[cx+Math.cos(a)*r,h,cz+Math.sin(a)*r,cx,ly,cz];
  const shotA=(t,S)=>{ const bu=S.bu, p=bu.position;
    if(t<9){ const u=t/9; return [...orb(0,0,150-40*u,95-45*u,.3+.9*u,6),55+5*u]; }
    if(t<18){ const u=(t-9)/9; const x=-24+48*Math.sin(u*2.2), z=88-132*u; return [x,14-5*Math.sin(u*3),z,x*.7,7,z-30,72]; }
    if(t<25){ const u=(t-18)/7; return [p.x-6.5,2.1,p.z+7.5,p.x,1.7,p.z,60]; }
    if(t<31){ const u=sm((t-25)/6); return [lerp(p.x-6,SX+1.2,u),lerp(2.3,3.1,u),lerp(p.z+7,SZ-0.4,u),SX,lerp(2.2,1.9,u),SZ-6.2,lerp(60,50,u)]; }
    if(t<46){ const u=sm((t-31)/15); return [lerp(SX-6,SX-48,u),lerp(3,52,u),lerp(SZ+8,SZ+78,u),SX,lerp(3,26,u),SZ-14,lerp(55,62,u)]; }
    if(t<56){ const u=(t-46)/10, o=S.ocean; return [...orb(o.x,o.z,lerp(60,95,u),lerp(16,34,u),-1.6+u*1.5,10),58]; }
    const u=sm((t-56)/6), o=S.ocean; return [o.x+lerp(-60,-10,u),lerp(30,95,u),o.z+lerp(70,160,u),o.x,lerp(14,70,u),o.z-20,66]; };
  const shotB=(t,S)=>{ const c=S.coaster;
    if(t<10){ const u=t/10; return [...orb(SX,SZ-10,lerp(190,125,u),lerp(80,38,u),.2+1.3*u,8),60]; }
    if(t<20){ const u=sm((t-10)/10); return [SX-lerp(24,5,u),lerp(3.5,5.5,u),SZ+lerp(78,64,u),SX,9,SZ+40,lerp(62,50,u)]; }
    if(t<38){ const u=((t-20)/18)*1, f=(u*1.0)%1, p=c.cur.getPointAt(f), q=c.cur.getPointAt((f+.012)%1); return [p.x,p.y+1.7,p.z,q.x,q.y+1.2,q.z,78]; }
    if(t<50){ const u=(t-38)/12; return [...orb(SX,SZ-30,lerp(70,95,u),lerp(18,48,u),lerp(2.2,.2,u),22),64]; }
    const u=sm((t-50)/12); return [SX+lerp(-60,0,u),lerp(30,70,u),SZ+lerp(150,190,u),SX,lerp(24,40,u),SZ-25,66]; };
  // ── Texte unten ──
  const CAPA=[[0,5.5,'MISCHA ZOO 3D','präsentiert'],[5.5,9,'Euer Zoo …','wächst und wächst'],[9.5,17.5,'Tiere. Gehege. Tausende Besucher.','Und jetzt: ein neues Kapitel'],[19,24.5,'Bu:)','Erfinder · Admin · „Schwamm“'],[25.5,29.5,'Der grosse Moment','Bu:) macht es offiziell …'],[32,45.5,'REBIRTH 6 IST DA!','Freigegeben für alle Spieler'],[47,52,'REBIRTH 7','🏴‍☠️ Die Piraten-Welt'],[52,55.5,'Meer · Schiff · Inseln','Seeschlangen · Kraken-Boss · Crew'],[57,61.2,'Viel Spass!','— Bu:) & das ganze Team']];
  const CAPB=[[0,6,'MISCHA PARK','etwas Grosses wird gebaut …'],[6.2,9.8,'REBIRTH 8','🎡 Der Freizeitpark'],[10.5,17.5,'Die Eröffnung','Bu:) schneidet das Band durch'],[21,28,'Achterbahnen','Halt dich fest!'],[28.5,38,'Fahrgeschäfte · Wege · Warteschlangen','Dein eigener Themenpark-Tycoon'],[39,48.5,'Riesenrad · Karussell · Feuerwerk','Baue, verwalte, verdiene'],[52,56,'FREIZEITPARK ERÖFFNET','🎢 Rebirth 8 ist freigeschaltet'],[57,61.2,'Viel Spass!','— Bu:) & das ganze Team']];
  const CAPSA=[[0,5.5,'Etwas verändert sich …','im Mischa Zoo'],[6,11.5,'Bu:) arbeitet an etwas Neuem','geheim · nachts · ganz leise'],[12.5,18,'Hinter dem Horizont …','❓'],[18.8,22,'REBIRTH 6 · 7','Bald!']];
  const CAPSB=[[0,5.5,'Etwas Grosses wird gebaut …','🎡'],[6,11,'Lichter. Musik. Spass.','…'],[11.8,16,'REBIRTH 8','Bald!']];
  const FEATA=[[34.2,'💰 Einkommen ×100'],[35.8,'🌦️ Wetter-Meister'],[37.4,'🤖 Pfleger-Roboter'],[39,'⚔️ Tier-Arena'],[40.6,'🏝️ Schatz-Insel'],[42.2,'🗼 Legenden-Turm'],[43.8,'🚂 Zoo-Bahn · 🥚 Ei-Brüterei']];
  // ── UI ──
  const ui=()=>{ let o=document.getElementById('zrc'); if(o) return o; o=document.createElement('div'); o.id='zrc'; o.style.cssText='position:fixed;inset:0;z-index:2147483000;pointer-events:none;font-family:Arial Black,Arial,sans-serif';
    o.innerHTML='<div id="zrc-t" style="position:absolute;left:0;right:0;top:0;height:11vh;background:#000"></div><div id="zrc-b" style="position:absolute;left:0;right:0;bottom:0;height:11vh;background:#000"></div>'
      +'<div id="zrc-cap" style="position:absolute;left:4vw;right:4vw;bottom:13vh;text-align:center;color:#fff;text-shadow:0 2px 10px #000,0 0 22px #000;opacity:0;transition:opacity .5s"><div id="zrc-c1" style="font-size:clamp(1.5rem,5.5vw,3.4rem);font-weight:900;letter-spacing:.04em"></div><div id="zrc-c2" style="font-size:clamp(.85rem,2.6vw,1.5rem);opacity:.92;margin-top:4px"></div></div>'
      +'<div id="zrc-ft" style="position:absolute;left:50%;top:14vh;transform:translateX(-50%) scale(.8);padding:8px 22px;border-radius:30px;background:rgba(255,213,79,.95);color:#2a1700;font-size:clamp(1rem,3.2vw,1.8rem);font-weight:900;opacity:0;transition:all .35s;white-space:nowrap"></div>'
      +'<div id="zrc-num" style="position:absolute;left:0;right:0;top:30vh;text-align:center;font-size:22vh;font-weight:900;color:#fff;text-shadow:0 0 40px #ff0,0 4px 14px #000;opacity:0"></div>'
      +'<div id="zrc-fl" style="position:absolute;inset:0;background:#fff;opacity:0;transition:opacity .25s"></div><div id="zrc-bk" style="position:absolute;inset:0;background:#000;opacity:1;transition:opacity .8s"></div>'
      +'<button id="zrc-sk" style="position:absolute;right:10px;bottom:1.5vh;pointer-events:auto;padding:8px 14px;border:2px solid rgba(255,255,255,.7);border-radius:14px;background:rgba(0,0,0,.55);color:#fff;font:800 .8rem Arial">⏭ Überspringen</button><button id="zrc-sn" style="position:absolute;left:10px;bottom:1.5vh;pointer-events:auto;padding:8px 12px;border:2px solid rgba(255,255,255,.7);border-radius:14px;background:rgba(0,0,0,.55);color:#fff;font:800 .8rem Arial">🔊</button>';
    document.body.appendChild(o); o.querySelector('#zrc-sk').onclick=()=>C.stop(); o.querySelector('#zrc-sn').onclick=e=>{ snd=!snd; e.target.textContent=snd?'🔊':'🔇'; if(AG) AG.gain.value=snd?1:0; };
    const st=document.createElement('style'); st.id='zrc-css'; st.textContent='body.zrc #s-zoo>*:not(#zc){display:none!important}body.zrc>*:not(#s-zoo):not(#zrc):not(script):not(style):not(link){display:none!important}body.zrc #padm-wrap,body.zrc [id^="padmin"]{display:none!important}'; document.head.appendChild(st); return o; };
  const $=id=>document.getElementById(id);
  // ── Abspielen ──
  C.play=function(kind,opts){ opts=opts||{}; const Z=ZGg(); if(C.on||!Z||!Z.renderer||!Z.scene||!Z.cam||!T()) return false; C.on=true; C.test=!!opts.test; C.kind=kind; C.opts=opts; const teaser=kind[0]==='S'; C.teaser=teaser; C.base=teaser?kind.slice(1):kind; C.dur=teaser?(C.base==='A'?23:17):DUR; kind=C.base;
    const THREE=T(), sc=Z.scene; try{ ['adm','menu','gond','shop','index','reb','enc','sound','report','rank','trade'].forEach(p=>{ try{ ZP.close(p); }catch(e){} }); }catch(e){} const adm=document.getElementById('zi-adm'); if(adm) adm.remove();
    C.save={fov:Z.cam.fov,far:Z.cam.far,fog:sc.fog,bg:sc.background,px:Z.pl.x,py:Z.pl.y,pz:Z.pl.z,yaw:Z.yaw,pitch:Z.pitch}; sc.fog=null;
    try{ Z.cam.far=7000; Z.cam.updateProjectionMatrix(); if(window.ZLook) ZLook.cullOff=true; Z._mtnView=true; }catch(e){}
    document.body.classList.add('zrc'); const o=ui(); o.style.display='block'; $('zrc-bk').style.transition='none'; $('zrc-bk').style.opacity=1; setTimeout(()=>{ $('zrc-bk').style.transition='opacity .9s'; $('zrc-bk').style.opacity=0; },60); $('zrc-sn').textContent=snd?'🔊':'🔇';
    const G=new THREE.Group(); sc.add(G); const night=kind==='A'; C.G=G; C.S={}; const S=C.S;
    S.base=stageBase(G,night); fwInit(G); S.sky=night?0x0b1030:0x8ad4ff; sc.background=new THREE.Color(S.sky); if(night) stars(G);
    S.bu=mkBu(); S.bu.visible=true; G.add(S.bu); S.ocean={x:SX+420,z:SZ};
    const names=[]; try{ names.push(String(ZS.player||'')); Object.values(Z.otherPl||{}).forEach(op=>{ if(op&&op.name) names.push(op.name); }); }catch(e){} ['Bu:)','Andi5','j.t','Mischa'].forEach(n=>{ if(names.indexOf(n)<0) names.push(n); }); S.names=names.slice(0,14);
    if(kind==='A'){ S.bu.position.set(SX+16,.9,SZ+12); S.bu.rotation.y=-2.2;
      const pod=bx(5,2.2,3,0x263238,SX,1.9,SZ-6,G); bx(5.2,.25,3.2,0xffd54f,SX,3.1,SZ-6,G); S.btn=cy(.9,1,.5,0xd50000,SX,3.5,SZ-6.3,G,20); S.btnGlow=sp(0xff5252,1.4,SX,3.7,SZ-6.3,G,{transparent:true,opacity:.35,blending:THREE.AdditiveBlending}); const fl=label('FREIGEBEN',5,1.2,{w:512,h:120,col:'#fff',glow:'#f00'}); fl.position.set(SX,5.2,SZ-6.2); G.add(fl);
      for(const sx of[-1,1]){ bx(.8,30,.8,0x90a4ae,SX+sx*18,15,SZ-10,G); sp(0xffe082,1.3,SX+sx*18,30.5,SZ-10,G); }
      S.beams=beams(G,8,34); S.lan=lanterns(G,S.names,SX,SZ); S.title=label('REBIRTH 6',60,14,{w:1024,h:240,col:'#ffd54f',glow:'#ff8f00'}); S.title.position.set(SX,40,SZ-22); S.title.material.opacity=0; G.add(S.title);
      S.title7=label('REBIRTH 7',46,11,{w:1024,h:250,col:'#80d8ff',glow:'#00b0ff'}); S.title7.position.set(S.ocean.x,55,S.ocean.z-30); S.title7.material.opacity=0; G.add(S.title7);
      const oc=new THREE.Mesh(new THREE.CircleGeometry(180,40),mb(0x0d47a1)); oc.rotation.x=-Math.PI/2; oc.position.set(S.ocean.x,.4,S.ocean.z); G.add(oc); S.oc=oc;
      for(let i=0;i<30;i++){ const w=new THREE.Mesh(new THREE.RingGeometry(2+rnd()*2,2.6+rnd()*2,16),new THREE.MeshBasicMaterial({color:0x90caf9,transparent:true,opacity:.5,side:THREE.DoubleSide})); w.rotation.x=-Math.PI/2; const a=rnd()*6.283, r=15+rnd()*150; w.position.set(S.ocean.x+Math.cos(a)*r,.55,S.ocean.z+Math.sin(a)*r); w.userData.ph=rnd()*6; G.add(w); (S.waves=S.waves||[]).push(w); }
      S.ship=mkShip(); S.ship.position.set(S.ocean.x,.3,S.ocean.z); G.add(S.ship); S.kr=mkKraken(); S.kr.position.set(S.ocean.x,0,S.ocean.z+10); G.add(S.kr);
      S.ring=new THREE.Mesh(new THREE.TorusGeometry(1,.12,6,64),new THREE.MeshBasicMaterial({color:0xfff176,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false})); S.ring.rotation.x=Math.PI/2; S.ring.position.set(SX,2,SZ); G.add(S.ring);
    } else { S.bu.position.set(SX+26,.9,SZ+42); S.bu.rotation.y=-1.6; S.gate=mkGate(G); S.ferris=mkFerris(G,SX-60,SZ-34); S.carousel=mkCarousel(G,SX+50,SZ-22); S.coaster=mkCoaster(G,SX,SZ-40); S.balloon=mkBalloon(G); S.lan=lanterns(G,S.names,SX,SZ-20); S.scis=emo('✂️'); S.scis.scale.set(2.6,2.6,1); S.scis.visible=false; G.add(S.scis); S.title=label('REBIRTH 8',70,16,{w:1024,h:240,col:'#ffd54f',glow:'#ff4081'}); S.title.position.set(SX,52,SZ-60); S.title.material.opacity=0; G.add(S.title);
      S.beams=beams(G,6,60,[0xff80ab,0x80d8ff]); S.beams.forEach(b=>b.material.opacity=0);
      const bh=(x,z,c)=>{ for(let i=0;i<14;i++){ const p=new THREE.Mesh(new THREE.BoxGeometry(.9,1.8,.6),mb([0xff3b30,0x0a84ff,0xffd60a,0x30d158][i%4])); p.position.set(x+(rnd()-.5)*30,1.4,z+(rnd()-.5)*10); G.add(p); (S.crowd=S.crowd||[]).push(p); } }; bh(SX,SZ+55); }
    C.done={}; if(teaser){ ['18_cut','30_press','46_cut2','20_cut2','38_cut3','50_cut4'].forEach(k=>C.done[k]=1); try{ if(S.title7) S.title7.visible=false; if(S.title) S.title.visible=false; if(S.kr) S.kr.visible=false; if(S.btnGlow) S.btnGlow.visible=false; }catch(e){} }
    C.t0=performance.now(); C.lastT=0; C.sched=[]; C.lastFt=-9; audioOn(); music(C.base);
    const sk=document.querySelector('#zrc-sk'); document.addEventListener('keydown',C._key); if(!C.hooked){ C.hooked=1; const r=Z.renderer, orig=r.render.bind(r); r.render=function(s,c){ try{ if(C.on&&s===Z.scene) C.frame(); }catch(e){ try{ console.log('[Trailer] '+e.message); }catch(_){} } return orig(s,c); }; }
    return true; };
  C._key=e=>{ if(e.key==='Escape') C.stop(); };
  C.stop=function(){ if(!C.on) return; C.on=false; document.removeEventListener('keydown',C._key); clearInterval(musicIv); const Z=ZGg(), sc=Z.scene; try{ sc.remove(C.G); C.G.traverse(o=>{ if(o.geometry) o.geometry.dispose(); }); }catch(e){}
    try{ const s=C.save; sc.fog=s.fog; sc.background=s.bg; Z.cam.far=s.far; Z.cam.fov=s.fov; Z.cam.updateProjectionMatrix(); Z.pl.x=s.px; Z.pl.y=s.py; Z.pl.z=s.pz; Z.yaw=s.yaw; Z.pitch=s.pitch; if(window.ZLook) ZLook.cullOff=false; Z._mtnView=false; }catch(e){}
    try{ if(AC&&AG){ AG.gain.setTargetAtTime(0,AC.currentTime,.2); } }catch(e){} document.body.classList.remove('zrc'); const o=$('zrc'); if(o) o.style.display='none'; FW.pts=null; C.G=null;
    if(C.test){ try{ ZAdmin.open(); }catch(e){} } };
  C.frame=function(){ const Z=ZGg(), cam=Z.cam, S=C.S, now=performance.now(), tr=(now-C.t0)/1000; let t=tr; if(C.teaser){ t=C.base==='A'?(tr<12?tr:46+(tr-12)*.8):Math.min(14.4,tr*.9); } const dt=Math.min(.1,Math.max(0,tr-C.lastT)); C.lastT=tr; if(tr>=C.dur){ C.stop(); return; }
    Z.pl.x=C.save.px; Z.pl.z=C.save.pz; Z.pl.y=C.save.py; const A=C.base==='A'; try{ Z.scene.fog=null; if(Z.scene.background!==undefined&&C.S&&C.S.sky!=null&&(!Z.scene.background||Z.scene.background.getHex!==undefined&&Z.scene.background.getHex()!==C.S.sky)) Z.scene.background=new (T().Color)(C.S.sky); if(cam.far!==7000){ cam.far=7000; cam.updateProjectionMatrix(); } }catch(e){}
    const sh=A?shotA(t,S):shotB(t,S); cam.position.set(sh[0],sh[1],sh[2]); cam.lookAt(sh[3],sh[4],sh[5]); if(sh[6]&&Math.abs(cam.fov-sh[6])>.1){ cam.fov=sh[6]; cam.updateProjectionMatrix(); }
    const fl=(a,b)=>t>=a&&!C.done[a+'_'+b]&&(C.done[a+'_'+b]=1); const flash=(o)=>{ const f=$('zrc-fl'); f.style.transition='none'; f.style.opacity=o||1; setTimeout(()=>{ f.style.transition='opacity .6s'; f.style.opacity=0; },40); };
    const shake=(m)=>{ C.shk=m; };
    // Untertitel
    const caps=C.teaser?(A?CAPSA:CAPSB):(A?CAPA:CAPB); let cur=null; const tc=C.teaser?tr:t; caps.forEach(c=>{ if(tc>=c[0]&&tc<c[1]) cur=c; }); const cp=$('zrc-cap'); if(cur){ if(C.curCap!==cur){ C.curCap=cur; $('zrc-c1').textContent=cur[2]; $('zrc-c2').textContent=cur[3]; } cp.style.opacity=1; } else cp.style.opacity=0;
    if(tr>C.dur-1.2) $('zrc-bk').style.opacity=clamp((tr-(C.dur-1.2))/1.1,0,1);
    // Feuerwerk-Planer
    const rain=(a,b,rate,cx,cz,spread,hh)=>{ if(!C.teaser&&t>=a&&t<b){ C.fa=(C.fa||0)+dt*rate; while(C.fa>=1){ C.fa-=1; const x=cx+(rnd()-.5)*spread, z=cz+(rnd()-.5)*spread*.6, y=hh+rnd()*hh*.6; const r={x,z,y:3,y1:y,v:0,big:rnd()<.25}; r.v=(y-3)/.85; FW.rk.push(r); noise(0,.5,.06,2400); } } };
    // ── Trailer A ──
    if(A){ const bu=S.bu, U=bu.userData;
      // Lichtkegel kreisen
      if(S.beams) S.beams.forEach((b,i)=>{ const a=b.userData.a0+t*.5; b.position.set(SX+Math.cos(a)*b.userData.R,45,SZ+Math.sin(a)*b.userData.R); b.rotation.set(Math.sin(a*2)*.35,0,Math.cos(a)*.35); b.material.opacity=t>30?.2:.08; });
      // Bu läuft herein, bleibt am Pult
      const wu=seg(t,18,25); const tx=SX+2.2, tz=SZ-3.9; if(t<25){ bu.position.x=lerp(SX+16,tx,sm(wu)); bu.position.z=lerp(SZ+12,tz,sm(wu)); bu.rotation.y=wu<1?Math.atan2(-(tx-(SX+16)),-(tz-(SZ+12))):Math.PI; U.legs[0].rotation.x=Math.sin(t*9)*.7*(wu<1?1:0); U.legs[1].rotation.x=-Math.sin(t*9)*.7*(wu<1?1:0); U.arms[0].rotation.x=-Math.sin(t*9)*.6; U.arms[1].rotation.x=Math.sin(t*9)*.6; }
      else { bu.position.x=tx; bu.position.z=tz; bu.rotation.y=Math.PI+.35; U.legs[0].rotation.x=U.legs[1].rotation.x=0; const pr=seg(t,29.2,30.1); U.arms[1].rotation.x=-1.5*sm(pr)+(t>30.6?1.5*seg(t,30.6,31.5):0); U.arms[0].rotation.x=-.2; }
      U.cape.rotation.x=.12+Math.sin(t*3)*.06;
      if(t>=27&&t<30){ const n=3-Math.floor(t-27); const e=$('zrc-num'); if(e.dataset.n!==String(n)){ e.dataset.n=n; e.textContent=n; e.style.transition='none'; e.style.opacity=1; e.style.transform='scale(1.5)'; setTimeout(()=>{ e.style.transition='all .9s'; e.style.opacity=0; e.style.transform='scale(.7)'; },30); tone(520,0,.18,'square',.15); } }
      if(S.btn){ const pressed=t>=30; S.btn.position.y=pressed?3.2:3.5; S.btnGlow.material.opacity=.35+(pressed?.5:Math.sin(t*6)*.15); }
      if(fl(30,'press')){ flash(1); shake(1.4); tone(NOTES.c,0,1.2,'sawtooth',.12); tone(NOTES.e,.1,1.2,'sawtooth',.1); tone(NOTES.g,.2,1.6,'sawtooth',.1); noise(0,1.2,.5,500); S.ringT=t; }
      if(S.ringT!=null){ const u=(t-S.ringT)/2.6; if(u<1){ const r=2+u*500; S.ring.scale.set(r,r,r); S.ring.material.opacity=(1-u)*.9; } else S.ring.material.opacity=0; }
      rain(30.4,46,3.2,SX,SZ-20,90,26); rain(56,61,6,S.ocean.x,S.ocean.z,150,40); if(t>=44&&t<47) rain(44,47,8,SX,SZ-20,120,30);
      if(fl(18,'cut')) { flash(1); tone(180,0,.8,'sawtooth',.1); noise(0,.8,.25,1200); }
      if(fl(46,'cut2')) { flash(1); tone(NOTES.G*.5,0,.8,'sawtooth',.1); noise(0,.8,.25,1200); }
      if(S.title){ const a=seg(t,32,34)*(1-seg(t,44.5,46)); S.title.material.opacity=a; S.title.position.y=40+Math.sin(t*2)*.8; S.title.scale.set(60*(.8+.2*sm(seg(t,32,34))),14*(.8+.2*sm(seg(t,32,34))),1); }
      if(S.title7){ const a=seg(t,47,49)*(1-seg(t,55.5,57)); S.title7.material.opacity=a; S.title7.position.y=55+Math.sin(t*2)*.8; }
      // Laternen
      if(S.lan) S.lan.forEach((l,i)=>{ const u=l.userData; if(t>31){ l.position.y=u.y0+Math.max(0,t-31)*u.vy*1.4; l.position.x=u.cx+Math.cos(u.a+t*.06)*(u.r+i); l.position.z=u.cz+Math.sin(u.a+t*.06)*(u.r+i)-10; } else l.position.y=-50; });
      // Features einblenden
      const ft=$('zrc-ft'); let fcur=null; if(!C.teaser) FEATA.forEach((f,i)=>{ const nx=FEATA[i+1]?FEATA[i+1][0]:f[0]+1.6; if(t>=f[0]&&t<nx-.1) fcur=f; }); if(fcur){ if(ft.textContent!==fcur[1]) ft.textContent=fcur[1]; ft.style.opacity=1; ft.style.transform='translateX(-50%) scale(1)'; } else { ft.style.opacity=0; ft.style.transform='translateX(-50%) scale(.8)'; }
      // Meer, Schiff, Kraken
      if(S.waves) S.waves.forEach(w=>{ w.material.opacity=.25+.25*Math.sin(t*2+w.userData.ph); });
      S.ship.rotation.z=Math.sin(t*1.1)*.06; S.ship.rotation.x=Math.sin(t*.8)*.04; S.ship.position.y=.3+Math.sin(t*1.3)*.5; S.ship.userData.flag.rotation.y=Math.sin(t*5)*.3;
      S.kr.userData.arms.forEach(a=>{ const rise=sm(seg(t,44,50)); a.children.forEach((s,k)=>{ s.position.x=Math.sin(t*1.6+a.userData.ph+k*.5)*k*.5; s.position.z=Math.cos(t*1.3+a.userData.ph+k*.5)*k*.5; s.scale.y=Math.max(.01,rise); s.position.y=(k*3+1.5)*rise; }); });
    }
    // ── Trailer B ──
    else { const bu=S.bu, U=bu.userData; const g=S.gate.userData;
      S.balloon.position.set(SX+Math.cos(t*.12+1)*110,Math.min(70,38+t*2.5),SZ-20+Math.sin(t*.12+1)*100); S.balloon.rotation.y=t*.3; S.balloon.visible=t<50||t>56?t<50:false;
      S.ferris.rotation.z=-t*.25; S.ferris.userData.gs.forEach(gn=>gn.rotation.z=t*.25); S.carousel.userData.rot.rotation.y=t*.9; S.carousel.userData.rot.children.forEach(h=>{ if(h.userData.ph!=null) h.position.y=Math.sin(t*3+h.userData.ph*3)*.7; });
      const cart=S.coaster; const cf=((t-20)/18)%1; if(t>=0){ const f=(t*.045)%1; const p=cart.cur.getPointAt(f), q=cart.cur.getPointAt((f+.01)%1); cart.cart.position.set(p.x,p.y+.9,p.z); cart.cart.lookAt(q.x,q.y+.9,q.z); }
      if(S.crowd) S.crowd.forEach((p,i)=>{ p.position.y=1.4+Math.abs(Math.sin(t*5+i))*(t>18?1.6:.4); });
      // Bu läuft zum Band
      const wu=seg(t,10,15); const bx0=SX+26, bz0=SZ+42, tx=SX+3.5, tz=SZ+44.5; if(t<15){ bu.position.x=lerp(bx0,tx,sm(wu)); bu.position.z=lerp(bz0,tz,sm(wu)); bu.rotation.y=Math.atan2(-(tx-bx0),-(tz-bz0)); U.legs[0].rotation.x=Math.sin(t*9)*.7; U.legs[1].rotation.x=-Math.sin(t*9)*.7; U.arms[0].rotation.x=-Math.sin(t*9)*.6; U.arms[1].rotation.x=Math.sin(t*9)*.6; } else { bu.position.x=tx; bu.position.z=tz; bu.rotation.y=Math.PI; U.legs[0].rotation.x=U.legs[1].rotation.x=0; U.arms[1].rotation.x=-1.4+Math.sin(t*14)*(t>16.5&&t<18?.5:0); }
      bu.visible=t>=9.5&&t<38; S.scis.visible=t>=15&&t<18.4; S.scis.position.set(bu.position.x-.9,bu.position.y+2.2+Math.sin(t*14)*(t>16.5?.3:0),bu.position.z+.6);
      const cut=t>=18; g.rL.visible=true; g.rR.visible=true; g.rL.position.x=cut?-6.5-seg(t,18,19.5)*8:-6.5; g.rR.position.x=cut?6.5+seg(t,18,19.5)*8:6.5; g.rL.position.y=cut?6-seg(t,18,19.5)*5:6; g.rR.position.y=cut?6-seg(t,18,19.5)*5:6; g.rL.rotation.z=cut?-seg(t,18,19.5)*1.2:0; g.rR.rotation.z=cut?seg(t,18,19.5)*1.2:0;
      if(t>=15.5&&t<18){ const n=3-Math.floor((t-15.5)/.85); const e=$('zrc-num'); if(n>0&&e.dataset.n!==String(n)){ e.dataset.n=n; e.textContent=n; e.style.transition='none'; e.style.opacity=1; e.style.transform='scale(1.5)'; setTimeout(()=>{ e.style.transition='all .8s'; e.style.opacity=0; e.style.transform='scale(.7)'; },30); tone(520,0,.18,'square',.15); } }
      g.lights.forEach((l,i)=>{ const on=t>=18+i*.06; l.material.color.setHex(on?[0xffeb3b,0xff4081,0x40c4ff,0x69f0ae][i%4]:0x333333); });
      if(fl(18.0,'cut')){ flash(1); shake(1.2); tone(NOTES.c,0,1.1,'sawtooth',.12); tone(NOTES.e,.12,1.1,'sawtooth',.1); tone(NOTES.g,.24,1.5,'sawtooth',.1); noise(0,.8,.4,600); }
      rain(18.3,24,5,SX,SZ+20,70,26); rain(39,50,3,SX,SZ-30,120,34); rain(50,61,7,SX,SZ-20,140,38);
      if(fl(20,'cut2')||fl(38,'cut3')||fl(50,'cut4')){ flash(1); tone(200,0,.7,'sawtooth',.1); noise(0,.7,.25,1200); }
      if(S.beams) S.beams.forEach((b,i)=>{ const a=b.userData.a0+t*.6; b.position.set(SX+Math.cos(a)*b.userData.R,45,SZ-20+Math.sin(a)*b.userData.R); b.rotation.set(Math.sin(a*2)*.35,0,Math.cos(a)*.35); b.material.opacity=t>18?.2:0; });
      if(S.lan) S.lan.forEach((l,i)=>{ const u=l.userData; if(t>39){ l.position.y=u.y0+Math.max(0,t-39)*u.vy*1.6+8; l.position.x=u.cx+Math.cos(u.a+t*.06)*(u.r+i+30); l.position.z=u.cz+Math.sin(u.a+t*.06)*(u.r+i+30); } else l.position.y=-50; });
      if(S.title){ const a=seg(t,51,53.5); S.title.material.opacity=a; S.title.position.y=52+Math.sin(t*2)*.9; }
    }
    fwUpdate(dt);
    // Kamerawackeln
    if(C.shk>.02){ cam.position.x+=(rnd()-.5)*C.shk; cam.position.y+=(rnd()-.5)*C.shk; C.shk*=.9; }
  };
  // ── Auslöser: Admin-Test (nur lokal) + Broadcast an alle ──
  C.askTest=function(){ const old=document.getElementById('zrc-ask'); if(old) old.remove(); const o=document.createElement('div'); o.id='zrc-ask'; o.style.cssText='position:fixed;inset:0;z-index:2147483200;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;font-family:Arial,sans-serif'; const bt='width:100%;padding:13px;margin-top:8px;border:none;border-radius:12px;color:#fff;font:900 .95rem Arial;';
    o.innerHTML='<div style="background:#101827;border:3px solid #ffd54f;border-radius:18px;padding:16px;width:min(92vw,360px);color:#fff;text-align:center"><div style="font:900 1.15rem Arial;color:#ffd54f">🎬 Welchen Trailer testen?</div><div style="font-size:.78rem;opacity:.7;margin:4px 0 6px">Er läuft nur bei dir (ca. 1 Minute). Alle anderen sehen nichts.</div><button data-k="A" style="'+bt+'background:linear-gradient(135deg,#e53935,#8e24aa)">🔄 Rebirth 6 &amp; 7 (Zoo, Bu:), Piraten)</button><button data-k="B" style="'+bt+'background:linear-gradient(135deg,#ff9100,#e91e63)">🎡 Rebirth 8 (Freizeitpark)</button><button data-k="x" style="'+bt+'background:#555">Abbrechen</button></div>';
    o.onclick=e=>{ const b=e.target.closest('button'); if(e.target===o||(b&&b.dataset.k==='x')){ o.remove(); return; } if(b){ o.remove(); if(!C.play(b.dataset.k,{test:true})){ try{ ZP.toast('Trailer geht gerade nicht',2500); }catch(x){} } } }; document.body.appendChild(o); };
  // Broadcast-Empfang
  const busy=()=>{ try{ const Z=ZGg(); return !!(!Z||!Z.pl||(window.Tutorial&&Tutorial._active)||(window.ZStation&&ZStation.riding)||(window.ZMountain&&(ZMountain.riding||ZMountain.on))||Z._arcadeActive||Z._jumpActive||Z._mazeActive||Z._trashActive||Z._iceRoomActive||Z._meadowActive||Z._alienActive||Z._coasterRide||(window.ZCoaster2&&ZCoaster2.ride)||(window.ZCoaster&&ZCoaster.ride)||document.getElementById('tut-overlay')||document.getElementById('zi-modal')); }catch(e){ return true; } };
  const pend={};
  const consider=(k,v)=>{ if(!v||!v.t) return; const key='zrc_seen_'+k+'_'+v.t; if(ls.get(key)) return; const age=Date.now()-v.t; if(age>3*864e5) return; if(pend[k]===v.t) return; pend[k]=v.t; C.kindOf=C.kindOf||{};
    const iv=setInterval(()=>{ if(ls.get(key)){ clearInterval(iv); return; } if(C.on||busy()) return; try{ if(!ZS.zoo||!ZS.player||!ZS.zoo.tutorialSeen) return; }catch(e){ return; } clearInterval(iv); ls.set(key,'1'); setTimeout(()=>C.play(k==='67'?'A':'B',{}),800); },3000); };
  const listen=()=>{ const r=RTD(); if(!r) return setTimeout(listen,4000); if(C._ln) return; C._ln=1; try{ r.ref('zoo_reb6/pub').on('value',s=>consider('67',s.val())); r.ref('zoo_park/pub').on('value',s=>consider('8',s.val())); }catch(e){} };
  window.addEventListener('load',()=>setTimeout(listen,6000));
  // ═══ Countdown & Mini-Spoiler (v898): Admin stellt ein, bis wann; solange sichtbar im ☰-Menü, danach verschwindet es ═══
  C.tz={'67':0,'8':0};
  C.left=k=>Math.max(0,(C.tz[k]||0)-Date.now());
  const fmtL=ms=>{ let s=Math.floor(ms/1000); const d=Math.floor(s/86400); s%=86400; const h=Math.floor(s/3600); s%=3600; const m=Math.floor(s/60); s%=60; const p=n=>('0'+n).slice(-2); return (d?d+' T ':'')+p(h)+':'+p(m)+':'+p(s); };
  const TZI={'67':{ic:'⏳',n:'Rebirth 6/7',kind:'SA',col:'#ffd54f'},'8':{ic:'🎡',n:'Rebirth 8',kind:'SB',col:'#ff80ab'}};
  let tzl=0; const tzListen=()=>{ const r=RTD(); if(!r){ if(++tzl<120) setTimeout(tzListen,3000); return; } if(C._tl) return; C._tl=1; try{ r.ref('zoo_teaser').on('value',s=>{ const v=s.val()||{}; C.tz={'67':+(v['67']&&v['67'].until)||0,'8':+(v['8']&&v['8'].until)||0}; }); }catch(e){} };
  let tzm=0; const tzMenu=()=>{ try{ if(window.ZMenu&&ZMenu.entries&&!C._tm){ C._tm=1; ['8','67'].forEach(k=>{ const I=TZI[k]; ZMenu.entries.unshift({id:'tz'+k,ic:I.ic,n:I.n,get d(){ return '❓ Was wird mich erwarten? · noch '+fmtL(C.left(k)); },show:()=>C.left(k)>0,go:()=>{ if(!C.play(I.kind,{})){ try{ ZP.toast('Gerade nicht möglich',2000); }catch(e){} } }}); }); }
    else if(!C._tm&&++tzm<80) setTimeout(tzMenu,1500); }catch(e){ if(++tzm<80) setTimeout(tzMenu,1500); } };
  // Countdown live im offenen Menü mitlaufen lassen
  setInterval(()=>{ try{ const o=document.getElementById('zm-ov'); if(!o) return; ['67','8'].forEach(k=>{ const b=o.querySelector('[data-e="tz'+k+'"]'); if(!b) return; const ds=[...b.querySelectorAll('div')].find(d=>/noch /.test(d.textContent)&&!d.querySelector('div')); if(ds) ds.textContent='❓ Was wird mich erwarten? · noch '+fmtL(C.left(k)); }); }catch(e){} },1000);
  const isAdmL=()=>{ try{ return !!(ZS.isAdmin||(typeof ZAdmin!=='undefined'&&ZAdmin._hasAccess)); }catch(e){ return false; } };
  C.setTeaser=function(k,until){ const r=RTD(); if(!r){ try{ ZP.toast('Keine Cloud-Verbindung',2500); }catch(e){} return; } try{ if(until>Date.now()) r.ref('zoo_teaser/'+k).set({until:until,by:String(ZS.player||'admin'),t:Date.now()}); else r.ref('zoo_teaser/'+k).remove(); C.tz[k]=until>Date.now()?until:0; }catch(e){} };
  C.teaserAdmin=function(){ if(!isAdmL()) return; const old=document.getElementById('zrc-tz'); if(old) old.remove(); const o=document.createElement('div'); o.id='zrc-tz'; o.style.cssText='position:fixed;inset:0;z-index:2147483200;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;padding:10px;font-family:Arial,sans-serif;overflow:auto';
    const toLocal=ms=>{ const d=new Date(ms-new Date(ms).getTimezoneOffset()*60000); return d.toISOString().slice(0,16); };
    const blk=k=>{ const I=TZI[k], l=C.left(k); return '<div style="background:rgba(255,255,255,.07);border:2px solid '+I.col+';border-radius:14px;padding:10px;margin-top:10px;text-align:left"><div style="font:900 1rem Arial;color:'+I.col+'">'+I.ic+' '+I.n+' – „Was wird mich erwarten?“</div><div style="font-size:.78rem;margin:4px 0">'+(l>0?'Läuft: noch <b>'+fmtL(l)+'</b> (bis '+new Date(C.tz[k]).toLocaleString('de-CH')+')':'Nicht aktiv (für niemanden sichtbar)')+'</div>'
      +'<input type="datetime-local" data-i="'+k+'" value="'+toLocal(l>0?C.tz[k]:Date.now()+864e5)+'" style="width:100%;box-sizing:border-box;padding:8px;border-radius:8px;border:none;font-size:.9rem"><div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:6px">'
      +[['+1 Std.',36e5],['+1 Tag',864e5],['+3 Tage',3*864e5],['+7 Tage',7*864e5]].map(q=>'<button data-a="add" data-k="'+k+'" data-ms="'+q[1]+'" style="padding:7px 10px;border:none;border-radius:9px;background:#37474f;color:#fff;font:800 .75rem Arial">'+q[0]+'</button>').join('')+'</div>'
      +'<div style="display:flex;gap:6px;margin-top:8px"><button data-a="set" data-k="'+k+'" style="flex:2;padding:10px;border:none;border-radius:10px;background:#2e7d32;color:#fff;font:900 .85rem Arial">✅ Countdown setzen</button><button data-a="test" data-k="'+k+'" style="flex:1;padding:10px;border:none;border-radius:10px;background:#1565c0;color:#fff;font:900 .8rem Arial">👁 Spoiler</button><button data-a="off" data-k="'+k+'" style="flex:1;padding:10px;border:none;border-radius:10px;background:#b71c1c;color:#fff;font:900 .8rem Arial">⏹ Aus</button></div></div>'; };
    o.innerHTML='<div style="background:#101827;border:3px solid #ffd54f;border-radius:18px;padding:14px;width:min(94vw,420px);color:#fff;max-height:94vh;overflow:auto"><div style="font:900 1.15rem Arial;color:#ffd54f;text-align:center">⏳ Countdown &amp; Mini-Spoiler</div><div style="font-size:.75rem;opacity:.75;text-align:center;margin-top:4px">Erscheint für alle im ☰-Menü mit Countdown. Ist die Zeit um, verschwindet er von selbst.</div>'+blk('67')+blk('8')+'<button data-a="x" style="width:100%;margin-top:12px;padding:10px;border:none;border-radius:10px;background:rgba(255,255,255,.15);color:#fff;font:800 .85rem Arial">Schliessen</button></div>';
    o.onclick=e=>{ const b=e.target.closest('button'); if(e.target===o||(b&&b.dataset.a==='x')){ o.remove(); return; } if(!b) return; const k=b.dataset.k, a=b.dataset.a;
      if(a==='add'){ const inp=o.querySelector('input[data-i="'+k+'"]'); const base=Math.max(Date.now(),C.tz[k]||0); inp.value=toLocal(base+(+b.dataset.ms)); return; }
      if(a==='set'){ const v=o.querySelector('input[data-i="'+k+'"]').value; const u=v?new Date(v).getTime():0; if(!u||u<=Date.now()){ try{ ZP.toast('Bitte eine Zeit in der Zukunft wählen',2500); }catch(x){} return; } C.setTeaser(k,u); try{ ZP.toast('✅ Countdown läuft bis '+new Date(u).toLocaleString('de-CH'),3500); }catch(x){} o.remove(); setTimeout(C.teaserAdmin,150); return; }
      if(a==='off'){ C.setTeaser(k,0); try{ ZP.toast('Countdown beendet',2000); }catch(x){} o.remove(); setTimeout(C.teaserAdmin,150); return; }
      if(a==='test'){ o.remove(); C.play(TZI[k].kind,{test:true}); } };
    document.body.appendChild(o); };
  window.addEventListener('load',()=>{ setTimeout(tzListen,6000); setTimeout(tzMenu,3000); });
  // ═══ ☠️ Todesstunde (v902): Admin stellt Ja/Nein + von/bis ein, für alle – dunkle Spannung mit Musik & Herzschlag ═══
  const DH={cfg:{on:false,from:0,until:0},ph:'off',au:null,ac:null,hb:0,intro:0,test:0};
  C.dh=DH;
  const dhAdm=()=>{ try{ return ['bu:)','bu:3'].includes(String(ZS.player||'').trim().toLowerCase()); }catch(e){ return false; } };
  const dhCss=document.createElement('style'); dhCss.textContent='@keyframes zdhP{0%,100%{opacity:.55}12%{opacity:1}24%{opacity:.6}36%{opacity:.95}60%{opacity:.55}}@keyframes zdhF{0%,92%,100%{opacity:0}94%{opacity:.5}96%{opacity:0}98%{opacity:.3}}@keyframes zdhT{0%{transform:scale(1.5);opacity:0}15%{opacity:1}80%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(.96)}}body.zdh #s-zoo canvas{filter:saturate(.55) contrast(1.1) brightness(.82)}#zdh-v{position:fixed;inset:0;z-index:84;pointer-events:none;background:radial-gradient(ellipse at center,rgba(0,0,0,0) 38%,rgba(90,0,0,.55) 78%,rgba(20,0,0,.9) 100%);animation:zdhP 1.2s ease-in-out infinite}#zdh-f{position:fixed;inset:0;z-index:85;pointer-events:none;background:#fff;opacity:0;animation:zdhF 7s linear infinite}#zdh-h{position:fixed;left:50%;top:86px;transform:translateX(-50%);z-index:9500;pointer-events:none;padding:6px 16px;border-radius:14px;background:rgba(40,0,0,.88);border:2px solid #d50000;color:#ff5252;font:900 .95rem Arial,sans-serif;letter-spacing:.06em;box-shadow:0 0 18px rgba(213,0,0,.7);white-space:nowrap}#zdh-t{position:fixed;inset:0;z-index:2147483000;pointer-events:none;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(circle,rgba(60,0,0,.6),rgba(0,0,0,.92));color:#ff1744;font:900 2.2rem Arial,sans-serif;text-align:center;text-shadow:0 0 24px #d50000;animation:zdhT 4.2s ease-out forwards}';
  document.head.appendChild(dhCss);
  const dhTone=(f,d,v,type,delay)=>{ try{ const a=DH.ac||(DH.ac=new (window.AudioContext||window.webkitAudioContext)()); if(a.state==='suspended') a.resume().catch(()=>{}); const t=a.currentTime+(delay||0), o=a.createOscillator(), g=a.createGain(); o.type=type||'sine'; o.frequency.setValueAtTime(f,t); o.frequency.exponentialRampToValueAtTime(Math.max(20,f*.5),t+d); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(v,t+.02); g.gain.exponentialRampToValueAtTime(.001,t+d); o.connect(g); g.connect(a.destination); o.start(t); o.stop(t+d+.05); }catch(e){} };
  const dhBeat=(vol)=>{ dhTone(62,.22,vol,'sine',0); dhTone(52,.28,vol*.8,'sine',.2); };
  const dhAllowed=()=>{ try{ return !(window.ZBgm&&ZBgm.on===false); }catch(e){ return true; } };
  const dhMusic=(on,vol)=>{ try{ if(on){ if(!DH.au){ if(window.ZSUSP){ DH.au=new Audio(window.ZSUSP); DH.au.loop=true; } else { if(!DH._ld){ DH._ld=1; const sc=document.createElement('script'); sc.src='zsuspense.js?v=902'; sc.onerror=()=>{ DH.au=new Audio('music/suspense.mp3'); DH.au.loop=true; }; document.head.appendChild(sc); } if(!window.ZSUSP&&!DH.au) return; } } DH.au.volume=Math.max(0,Math.min(1,vol)); if(DH.au.paused&&dhAllowed()){ const p=DH.au.play(); if(p&&p.catch) p.catch(()=>{}); } if(!dhAllowed()&&!DH.au.paused) DH.au.pause(); } else if(DH.au&&!DH.au.paused){ DH.au.pause(); DH.au.currentTime=0; } }catch(e){} };
  ['pointerdown','keydown','touchstart'].forEach(t=>document.addEventListener(t,()=>{ if(DH.ph==='act'&&DH.au&&DH.au.paused&&dhAllowed()) dhMusic(true,DH.au.volume||.6); },{passive:true}));
  const dhEl=(id,mk)=>{ let e=document.getElementById(id); if(!e){ e=document.createElement('div'); e.id=id; if(mk) mk(e); document.body.appendChild(e); } return e; };
  const dhFmt=ms=>{ let s=Math.max(0,Math.ceil(ms/1000)); const h=Math.floor(s/3600); s%=3600; const m=Math.floor(s/60); s%=60; const p=n=>('0'+n).slice(-2); return (h?h+':':'')+p(m)+':'+p(s); };
  const dhIntro=()=>{ const t=document.createElement('div'); t.id='zdh-t'; t.innerHTML='<div style="font-size:4.5rem">☠️</div><div>DIE TODESSTUNDE<br>BEGINNT</div><div style="font:700 .9rem Arial;color:#ffcdd2;margin-top:14px;text-shadow:none">Bleib wachsam …</div>'; document.body.appendChild(t); setTimeout(()=>t.remove(),4300); dhBeat(.5); setTimeout(()=>dhBeat(.5),900); setTimeout(()=>dhBeat(.6),1800); setTimeout(()=>dhBeat(.7),2600); };
  const dhSet=(ph)=>{ const was=DH.ph; DH.ph=ph; if(ph===was) return;
    document.body.classList.toggle('zdh',ph==='act');
    if(ph==='act'){ dhEl('zdh-v'); dhEl('zdh-f'); if(was!=='act'&&!document.body.classList.contains('zrc')) dhIntro(); }
    else{ ['zdh-v','zdh-f'].forEach(i=>{ const e=document.getElementById(i); if(e) e.remove(); }); dhMusic(false); if(was==='act'){ try{ ZP.toast('☠️ Die Todesstunde ist vorbei …',4000); }catch(e){} } }
    if(ph==='off'){ const h=document.getElementById('zdh-h'); if(h) h.remove(); } };
  const dhTick=()=>{ try{ const c=DH.cfg, now=Date.now(); let ph='off', left=0;
    if(DH.test&&DH.test>now){ ph='act'; left=DH.test-now; }
    else if(c.on&&c.until>now){ if(c.from<=now){ ph='act'; left=c.until-now; } else if(c.from-now<=5*60000){ ph='pre'; left=c.from-now; } }
    const cin=!!(C.on||document.body.classList.contains('zrc')); // läuft gerade ein Trailer? Dann schweigt die Todesstunde (Trailer hat Vorrang)
    dhSet(ph);
    ['zdh-v','zdh-f','zdh-h'].forEach(i=>{ const e=document.getElementById(i); if(e) e.style.display=cin?'none':''; });
    if(cin){ dhMusic(false); return; }
    if(ph==='off') return;
    const h=dhEl('zdh-h'); h.textContent=ph==='act'?'☠️ TODESSTUNDE · noch '+dhFmt(left):'⏳ Todesstunde in '+dhFmt(left)+' …'; h.style.background=ph==='act'?'rgba(40,0,0,.88)':'rgba(30,20,0,.88)'; h.style.borderColor=ph==='act'?'#d50000':'#ff9100'; h.style.color=ph==='act'?'#ff5252':'#ffab40';
    if(ph==='act'){ const v=document.getElementById('zdh-v'); const urg=left<5*60000?1:0; if(v) v.style.animationDuration=(left<10000?.45:left<60000?.7:urg?.9:1.2)+'s';
      dhMusic(true,.75); try{ if(window.ZBgm&&ZBgm.holdFor) ZBgm.holdFor('death',2500); }catch(e){}
      const gap=left<10000?600:left<60000?800:1200; if(now-DH.hb>=gap){ DH.hb=now; dhBeat(left<60000?.55:.38); } }
    else{ const gap=left<10000?700:2200; if(now-DH.hb>=gap){ DH.hb=now; dhBeat(left<10000?.45:.22); } if(left<=10000&&Math.floor(left/1000)!==DH._s){ DH._s=Math.floor(left/1000); dhTone(left<=3000?900:600,.12,.15,'square'); } }
  }catch(e){} };
  setInterval(dhTick,500);
  let dhl=0; const dhListen=()=>{ const r=RTD(); if(!r){ if(++dhl<120) setTimeout(dhListen,3000); return; } if(DH._l) return; DH._l=1; try{ r.ref('zoo_deathhour').on('value',s=>{ const v=s.val()||{}; DH.cfg={on:!!v.on,from:+v.from||0,until:+v.until||0}; dhTick(); }); }catch(e){} };
  setTimeout(dhListen,5000);
  C.deathSave=function(on,from,until){ const r=RTD(); if(!dhAdm()) return; if(!r){ try{ ZP.toast('Keine Cloud-Verbindung',2500); }catch(e){} return; } try{ r.ref('zoo_deathhour').set({on:!!on,from:from||0,until:until||0,by:String(ZS.player||''),t:Date.now()}); DH.cfg={on:!!on,from:from||0,until:until||0}; dhTick(); }catch(e){} };
  C.deathAdmin=function(){ if(!dhAdm()){ try{ ZP.toast('Nur für Bu:) und Bu:3',2500); }catch(e){} return; } const old=document.getElementById('zdh-adm'); if(old) old.remove(); const o=document.createElement('div'); o.id='zdh-adm'; o.style.cssText='position:fixed;inset:0;z-index:2147483200;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;padding:10px;font-family:Arial,sans-serif;overflow:auto';
    const toL=ms=>{ const d=new Date(ms-new Date(ms).getTimezoneOffset()*60000); return d.toISOString().slice(0,16); }; const c=DH.cfg, now=Date.now();
    const st=c.on&&c.until>now?(c.from<=now?'🔴 LÄUFT: noch '+dhFmt(c.until-now):'🟠 Geplant: startet in '+dhFmt(c.from-now)):'⚪ Aus';
    const b='border:none;border-radius:10px;color:#fff;font:900 .8rem Arial;padding:9px 10px;cursor:pointer;';
    o.innerHTML='<div style="background:#150404;border:3px solid #d50000;border-radius:18px;padding:14px;width:min(94vw,420px);color:#fff;max-height:94vh;overflow:auto;box-shadow:0 0 30px rgba(213,0,0,.5)"><div style="font:900 1.2rem Arial;color:#ff5252;text-align:center">☠️ Todesstunde</div><div style="text-align:center;font-size:.8rem;margin:6px 0 10px">Status: <b>'+st+'</b></div>'
      +'<div style="font:800 .8rem Arial;margin-bottom:4px">Für alle Spieler aktiv?</div><div style="display:flex;gap:6px"><button id="zdh-y" style="'+b+'flex:1;background:'+(c.on?'#2e7d32':'#455a64')+'">✅ Ja</button><button id="zdh-n" style="'+b+'flex:1;background:'+(!c.on?'#c62828':'#455a64')+'">⛔ Nein</button></div>'
      +'<div style="font:800 .8rem Arial;margin:10px 0 4px">Ab wann?</div><input id="zdh-f" type="datetime-local" value="'+toL(c.from>now?c.from:now+6e4)+'" style="width:100%;box-sizing:border-box;padding:8px;border-radius:8px;border:none;font-size:.9rem">'
      +'<div style="font:800 .8rem Arial;margin:8px 0 4px">Bis wann?</div><input id="zdh-u" type="datetime-local" value="'+toL(c.until>now?c.until:now+66*6e4)+'" style="width:100%;box-sizing:border-box;padding:8px;border-radius:8px;border:none;font-size:.9rem">'
      +'<div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:8px"><button data-q="5" style="'+b+'background:#37474f">Start in 5 Min.</button><button data-q="30" style="'+b+'background:#37474f">Start in 30 Min.</button><button data-d="30" style="'+b+'background:#37474f">Dauer 30 Min.</button><button data-d="60" style="'+b+'background:#37474f">Dauer 1 Std.</button></div>'
      +'<div style="font-size:.7rem;opacity:.7;margin-top:8px">5 Minuten vor Start läuft bei allen ein Countdown mit Herzschlag. Dann wird der Bildschirm dunkelrot, die Spannungs-Musik spielt und die Hintergrundmusik schweigt. Spielwerte ändern sich nicht.</div>'
      +'<div style="display:flex;gap:6px;margin-top:10px"><button id="zdh-s" style="'+b+'flex:2;background:#2e7d32;font-size:.9rem">💾 Speichern</button><button id="zdh-t2" style="'+b+'flex:1;background:#1565c0">👁 Test (nur ich)</button></div><button id="zdh-x" style="'+b+'width:100%;margin-top:8px;background:rgba(255,255,255,.15)">Schliessen</button></div>';
    let on=!!c.on; const F=o.querySelector('#zdh-f'), U=o.querySelector('#zdh-u'), y=o.querySelector('#zdh-y'), n=o.querySelector('#zdh-n'); const paint=()=>{ y.style.background=on?'#2e7d32':'#455a64'; n.style.background=!on?'#c62828':'#455a64'; };
    y.onclick=()=>{ on=true; paint(); }; n.onclick=()=>{ on=false; paint(); };
    o.querySelectorAll('[data-q]').forEach(q=>q.onclick=()=>{ const f=Date.now()+(+q.dataset.q)*6e4; const dur=Math.max(6e4,(new Date(U.value).getTime()||0)-(new Date(F.value).getTime()||0))||36e5; F.value=toL(f); U.value=toL(f+dur); });
    o.querySelectorAll('[data-d]').forEach(q=>q.onclick=()=>{ const f=new Date(F.value).getTime()||Date.now(); U.value=toL(f+(+q.dataset.d)*6e4); });
    o.querySelector('#zdh-s').onclick=()=>{ const f=new Date(F.value).getTime(), u=new Date(U.value).getTime(); if(on&&(!f||!u||u<=f||u<=Date.now())){ try{ ZP.toast('Bitte gültige Zeiten wählen (Ende nach Start, in der Zukunft)',3000); }catch(e){} return; } C.deathSave(on,f,u); try{ ZP.toast(on?'☠️ Todesstunde gespeichert':'Todesstunde ausgeschaltet',2500); }catch(e){} o.remove(); setTimeout(C.deathAdmin,150); };
    o.querySelector('#zdh-t2').onclick=()=>{ o.remove(); DH.test=Date.now()+25000; dhTick(); setTimeout(()=>{ DH.test=0; dhTick(); },25500); };
    o.querySelector('#zdh-x').onclick=()=>o.remove(); document.body.appendChild(o); };
})();
