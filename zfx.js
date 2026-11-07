/* ═══ ZFx (v765): Wetter-Pfützen, Treffer-Effekte, Münzregen, Seltenheits-Auftritt, Zoo-Wahrzeichen ═══ */
(function(){
  'use strict';
  if(window.ZFx) return;
  const F=window.ZFx={items:[],wet:0,_sh:{t:0,a:0}};
  const RO=['normal','rare','epic','legendary','ultralegendary','god','mythic','secret','eternal'];
  const RCOL={normal:0x95a5a6,rare:0x3498DB,epic:0x9B59B6,legendary:0xF39C12,ultralegendary:0xFFD700,god:0xE74C3C,mythic:0x00FF88,secret:0xFF1493,eternal:0xFFFFFF};
  const RNAME={ultralegendary:'ULTRA LEGENDÄR',god:'GÖTTLICH',mythic:'MYTHISCH',secret:'GEHEIM',eternal:'EWIG'};
  const MC={}; const mb=(c,o)=>{ const k=c+(o?JSON.stringify(o):''); return MC[k]||(MC[k]=new THREE.MeshBasicMaterial(Object.assign({color:c},o||{}))); };
  const cvs=(w,h)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; };
  const sc=()=>ZG.scene;
  const add=(o,life,upd)=>{ sc().add(o); F.items.push({o,t0:performance.now(),life,upd}); return o; };
  // ── Hilfs-Texturen ──
  let starTex=null; const mkStar=()=>{ if(starTex) return starTex; const c=cvs(128,128), g=c.getContext('2d'); g.translate(64,64); for(let k=0;k<12;k++){ g.rotate(Math.PI/6); g.fillStyle=k%2?'#ff9800':'#fff176'; g.beginPath(); g.moveTo(0,0); g.lineTo(-7,-(k%2?34:60)); g.lineTo(7,-(k%2?34:60)); g.closePath(); g.fill(); } g.fillStyle='#fff'; g.beginPath(); g.arc(0,0,16,0,6.3); g.fill(); return starTex=new THREE.CanvasTexture(c); };
  const word=(txt,col)=>{ const c=cvs(256,96), g=c.getContext('2d'); g.font='900 64px Arial Black,Impact,Arial'; g.textAlign='center'; g.textBaseline='middle'; g.lineJoin='round'; g.lineWidth=12; g.strokeStyle='#1b1b1b'; g.strokeText(txt,128,52); g.fillStyle=col; g.fillText(txt,128,52); return new THREE.CanvasTexture(c); };
  // ── Treffer-Effekt ──
  const WORDS=['BAM!','PAFF!','KLATSCH!','WUMM!','ZACK!','PATSCH!','BOING!'], WCOL=['#ffeb3b','#ff5252','#4fc3f7','#ff9800','#69f0ae'];
  const SPEC={golden:['GOLD!','#ffd54f'],fire:['FEUER!','#ff7043'],void:['VOID!','#b388ff'],shadow:['SCHATTEN','#b0bec5'],gun:['PENG!','#ff5252'],bubble:['PLOPP!','#80deea'],snail:['SCHLEIM','#a5d6a7'],ice:['EIS!','#80d8ff']};
  F.shake=function(a,t){ F._sh={t:t||.3,a:a||.12,t0:performance.now()}; };
  F.hit=function(pos,id){ try{ if(!sc()||!pos) return; const sp=SPEC[id]||[WORDS[Math.floor(Math.random()*WORDS.length)],WCOL[Math.floor(Math.random()*WCOL.length)]];
    const star=new THREE.Sprite(new THREE.SpriteMaterial({map:mkStar(),transparent:true,depthTest:false,blending:THREE.AdditiveBlending})); star.position.set(pos.x,(pos.y||0)+1.3,pos.z); star.renderOrder=30; add(star,420,(o,k)=>{ o.scale.setScalar(1+k*4.2); o.material.opacity=1-k; o.material.rotation=k*1.4; });
    const ring=new THREE.Mesh(new THREE.RingGeometry(.8,1.0,28),new THREE.MeshBasicMaterial({color:new THREE.Color(sp[1]),transparent:true,side:THREE.DoubleSide,depthWrite:false})); ring.position.set(pos.x,(pos.y||0)+1.2,pos.z); add(ring,520,(o,k)=>{ o.scale.setScalar(.5+k*4.5); o.material.opacity=.9*(1-k); o.lookAt(ZG.cam.position); });
    const w=new THREE.Sprite(new THREE.SpriteMaterial({map:word(sp[0],sp[1]),transparent:true,depthTest:false})); w.scale.set(3.4,1.28,1); w.position.set(pos.x,(pos.y||0)+2.4,pos.z); w.renderOrder=31; const y0=w.position.y; add(w,1000,(o,k)=>{ o.position.y=y0+k*1.4; const s=k<.15?(.6+k/.15*.6):1.2-k*.2; o.scale.set(3.4*s,1.28*s,1); o.material.opacity=k<.7?1:(1-k)/.3; });
    for(let i=0;i<12;i++){ const p=new THREE.Mesh(new THREE.OctahedronGeometry(.09+Math.random()*.06,0),new THREE.MeshBasicMaterial({color:i%2?0xffee58:0xffffff,transparent:true})); p.position.set(pos.x,(pos.y||0)+1.3,pos.z); const a=Math.random()*6.283, v=2+Math.random()*3, vy=2+Math.random()*3; add(p,560,(o,k)=>{ const t=k*.56; o.position.x=pos.x+Math.cos(a)*v*t; o.position.z=pos.z+Math.sin(a)*v*t; o.position.y=(pos.y||0)+1.3+vy*t-9*t*t; o.material.opacity=1-k; }); }
    const d=ZG.cam?Math.hypot(ZG.cam.position.x-pos.x,ZG.cam.position.z-pos.z):99; F.shake(Math.max(.03,.16-d*.01),.28); }catch(e){} };
  // ── Münzregen ──
  F.coins=function(delta){ try{ if(document.hidden||!(delta>0)) return; const now=Date.now(); if(now-(F._cn||0)<900) return; F._cn=now; const tgt=document.getElementById('hmoney'); if(!tgt) return; const tr=tgt.getBoundingClientRect(); const tx=tr.left+tr.width/2, ty=tr.top+tr.height/2;
    const n=Math.min(8,3+Math.floor(Math.log10(delta+1))), W=innerWidth, H=innerHeight, encs=(ZG.encGr||[]).filter(g=>g&&g.userData&&g.userData.animalSprite);
    for(let i=0;i<n;i++){ let sx=W*(.3+Math.random()*.4), sy=H*.62; if(encs.length&&ZG.cam){ const g=encs[Math.floor(Math.random()*encs.length)]; const v=new THREE.Vector3(g.position.x,2.2,g.position.z).project(ZG.cam); if(v.z<1&&Math.abs(v.x)<1.1&&Math.abs(v.y)<1.1){ sx=(v.x+1)/2*W; sy=(1-v.y)/2*H; } }
      const el=document.createElement('div'); el.textContent='🪙'; el.style.cssText='position:fixed;left:'+sx+'px;top:'+sy+'px;font-size:'+(20+Math.random()*10)+'px;z-index:9000;pointer-events:none;transition:none;filter:drop-shadow(0 2px 3px rgba(0,0,0,.5));will-change:transform,opacity'; document.body.appendChild(el);
      const jx=(Math.random()-.5)*60, jy=-30-Math.random()*50; setTimeout(()=>{ el.style.transition='transform .28s ease-out'; el.style.transform='translate('+jx+'px,'+jy+'px) scale(1.15)'; setTimeout(()=>{ el.style.transition='transform .75s cubic-bezier(.5,0,.9,.4),opacity .75s'; el.style.transform='translate('+(tx-sx)+'px,'+(ty-sy)+'px) scale(.5)'; el.style.opacity='.4'; setTimeout(()=>{ el.remove(); if(i===n-1){ tgt.style.transition='transform .15s'; tgt.style.transform='scale(1.18)'; setTimeout(()=>{ tgt.style.transform=''; },160); } },780); },300); },i*90); } }catch(e){} };
  // ── Seltenheits-Auftritt (ab Ultra) ──
  const isRare=r=>RO.indexOf(r)>=RO.indexOf('ultralegendary');
  F.cabinRare=function(c){ try{ const ob=c.obj, r=ob&&ob.a&&ob.a.r, rare=!!(ob&&!ob.isCloverOnly&&isRare(r));
      if(!rare){ if(c.rb){ c.g.remove(c.rb.g); c.rb=null; } return; }
      if(!c.rb||c.rb.ob!==ob){ if(c.rb) c.g.remove(c.rb.g); const g=new THREE.Group(), col=RCOL[r]||0xffd700; const beam=new THREE.Mesh(new THREE.CylinderGeometry(.9,1.5,70,14,1,true),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.2,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide})); beam.position.y=35; g.add(beam);
        const spk=[]; for(let i=0;i<7;i++){ const s=new THREE.Mesh(new THREE.OctahedronGeometry(.18,0),new THREE.MeshBasicMaterial({color:i%2?0xffffff:col})); g.add(s); spk.push(s); } const halo=new THREE.Mesh(new THREE.TorusGeometry(1.9,.08,6,28),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.8})); halo.rotation.x=Math.PI/2; halo.position.y=.3; g.add(halo);
        g.position.y=-1.6; c.g.add(g); c.rb={g,beam,spk,halo,ob,arr:false}; }
      const t=performance.now()/1000, b=c.rb; b.beam.material.opacity=.14+.1*Math.sin(t*3); b.spk.forEach((s,i)=>{ const a=t*1.6+i/7*6.283; s.position.set(Math.cos(a)*1.9,1.6+Math.sin(t*2+i)*.9,Math.sin(a)*1.9); s.rotation.y=t*3; }); b.halo.rotation.z=t; b.halo.position.y=.6+Math.sin(t*2)*.3;
      // Ankunft an der Tür: grosser Auftritt (einmal)
      if(!b.arr&&!c.dep&&c.slot===0&&c.door>.5){ b.arr=true; const pl=ZG.pl, w=c.g.position, d=Math.hypot(pl.x-w.x,pl.z-w.z); if(d<80){ F.rareShow(r,ob.a,w); } }
    }catch(e){} };
  F.rareShow=function(r,a,w){ try{ const col='#'+('000000'+(RCOL[r]||0xffd700).toString(16)).slice(-6);
    let ov=document.getElementById('zfx-dim'); if(!ov){ ov=document.createElement('div'); ov.id='zfx-dim'; ov.style.cssText='position:fixed;inset:0;z-index:95;pointer-events:none;background:radial-gradient(ellipse at center,rgba(0,0,0,0) 30%,rgba(0,0,0,.65) 100%);opacity:0;transition:opacity .5s'; document.body.appendChild(ov); }
    ov.style.opacity='1'; setTimeout(()=>{ ov.style.opacity='0'; },1700);
    let ban=document.getElementById('zfx-ban'); if(ban) ban.remove(); ban=document.createElement('div'); ban.id='zfx-ban'; ban.style.cssText='position:fixed;left:50%;top:22%;transform:translate(-50%,-50%) scale(.6);z-index:96;pointer-events:none;text-align:center;font-family:Arial Black,Arial,sans-serif;opacity:0;transition:transform .5s cubic-bezier(.2,1.6,.4,1),opacity .4s';
    ban.innerHTML='<div style="font-size:3rem;filter:drop-shadow(0 0 14px '+col+')">'+(a.e||'✨')+'</div><div style="font-size:1.5rem;font-weight:900;color:'+col+';text-shadow:0 0 14px '+col+',0 2px 0 #000;letter-spacing:.06em">'+(RNAME[r]||r.toUpperCase())+'!</div><div style="font-size:1rem;color:#fff;text-shadow:0 2px 4px #000;font-weight:800">'+(a.n||'')+'</div>'; document.body.appendChild(ban);
    requestAnimationFrame(()=>{ ban.style.opacity='1'; ban.style.transform='translate(-50%,-50%) scale(1)'; }); setTimeout(()=>{ ban.style.opacity='0'; ban.style.transform='translate(-50%,-50%) scale(1.15)'; setTimeout(()=>ban.remove(),500); },2300);
    const c3=RCOL[r]||0xffd700; for(let k=0;k<3;k++){ const ring=new THREE.Mesh(new THREE.RingGeometry(.9,1.1,36),new THREE.MeshBasicMaterial({color:c3,transparent:true,side:THREE.DoubleSide,depthWrite:false})); ring.rotation.x=-Math.PI/2; ring.position.set(w.x,.4+k*.05,w.z); const dl=k*.18; add(ring,1400+dl*1000,(o,q)=>{ const t=Math.max(0,q*(1400+dl*1000)/1000-dl)/1.4; o.scale.setScalar(.5+t*14); o.material.opacity=Math.max(0,.9*(1-t)); }); }
    if(RO.indexOf(r)>=RO.indexOf('god')){ try{ ZGfx.confetti(100); }catch(e){} } F.shake(.07,.5); }catch(e){} };
  // ── Zoo-Wahrzeichen ──
  F.lm={};
  const nameTex=(name,col)=>{ const c=cvs(512,128), g=c.getContext('2d'); g.fillStyle='#1b1230'; g.fillRect(0,0,512,128); g.strokeStyle=col; g.lineWidth=8; g.strokeRect(6,6,500,116); g.fillStyle='#fff'; g.font='900 28px Arial'; g.textAlign='center'; g.fillText('WILLKOMMEN IM ZOO VON',256,40); g.fillStyle=col; g.font='900 '+(name.length>12?44:56)+'px Arial Black,Arial'; g.fillText(name,256,96); const t=new THREE.CanvasTexture(c); t.anisotropy=4; return t; };
  const emojiTex=e=>{ const c=cvs(128,128), g=c.getContext('2d'); g.font='96px serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(e,64,68); return new THREE.CanvasTexture(c); };
  const bx=(w,h,d,c,x,y,z,g)=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mb(c)); m.position.set(x,y,z); g.add(m); return m; };
  const cy=(a,b,h,c,x,y,z,g,s,o)=>{ const m=new THREE.Mesh(new THREE.CylinderGeometry(a,b,h,s||12),mb(c,o)); m.position.set(x,y,z); g.add(m); return m; };
  const top2=list=>{ const a=(list||[]).filter(e=>e&&e.animal).map(e=>e.animal); a.sort((x,y)=>(RO.indexOf(y.r)-RO.indexOf(x.r))||((y.earn||0)-(x.earn||0))); return a.slice(0,2); };
  F.landmark=function(name,layout,encs,color){ try{ if(!sc()||!name||!layout) return; const t2=top2(encs), key=t2.map(a=>a.id).join(',')+'|'+name; const cur=F.lm[name]; if(cur&&cur.key===key) return; if(cur) sc().remove(cur.g);
    const ang=layout.angle, rx=Math.cos(ang), rz=Math.sin(ang), tx=-rz, tz=rx, cx=layout.center.x, cz=layout.center.z; const col=(color&&/^#?[0-9a-fA-F]{6}$/.test(color))?(color[0]==='#'?color:'#'+color):'#ffd54f';
    const g=new THREE.Group(); g.position.set(cx-rx*13,0,cz-rz*13); g.rotation.y=Math.atan2(rx,rz); // lokale z-Achse zeigt zum Ring-Zentrum hin? (rx,rz = nach aussen)
    // Tor: zwei Säulen + Bogen + Namensschild
    [-1,1].forEach(s=>{ bx(2,1,2,0x6d5a8a,s*7,.5,0,g); cy(.7,.85,8,0xe9e3f5,s*7,5,0,g,10); cy(1.0,.8,.7,col,s*7,9.1,0,g,10); const l=new THREE.Mesh(new THREE.SphereGeometry(.55,10,8),mb(0xfff0b0)); l.position.set(s*7,10,0); g.add(l); });
    bx(15.6,.9,1.3,0x3b2a5a,0,8.7,0,g); bx(15.8,.18,1.4,col,0,9.2,0,g);
    const sg=new THREE.Mesh(new THREE.PlaneGeometry(10,2.5),new THREE.MeshBasicMaterial({map:nameTex(name,col),side:THREE.DoubleSide})); sg.position.set(0,11.1,0); sg.rotation.y=Math.PI; g.add(sg); bx(.3,2.2,.3,0x3b2a5a,-4.6,9.8,0,g); bx(.3,2.2,.3,0x3b2a5a,4.6,9.8,0,g);
    // Brunnen vor dem Tor (zum Ring-Zentrum hin)
    const fo=new THREE.Group(); fo.position.set(0,0,-9); g.add(fo); cy(3.2,3.4,.7,0xcfc7dc,0,.35,0,fo,20); cy(2.8,2.8,.1,0x4fc3f7,0,.72,0,fo,20); cy(.5,.7,2,0xe9e3f5,0,1.6,0,fo,10); cy(1.5,1.3,.3,0xcfc7dc,0,2.5,0,fo,14); cy(1.2,1.2,.08,0x4fc3f7,0,2.7,0,fo,14);
    const jets=[]; for(let i=0;i<14;i++){ const p=new THREE.Mesh(new THREE.SphereGeometry(.12,6,5),new THREE.MeshBasicMaterial({color:0xbfe9ff,transparent:true})); fo.add(p); jets.push([p,i/14,(i%5)/5*6.283]); } g.userData.jets=jets;
    // Statuen der 2 besten Tiere
    t2.forEach((a,i)=>{ const s=i?1:-1, st=new THREE.Group(); st.position.set(s*10.5,0,-3); g.add(st); bx(2.6,1.4,2.6,0x6d5a8a,0,.7,0,st); bx(2.9,.25,2.9,col,0,1.5,0,st); const m=new THREE.Sprite(new THREE.SpriteMaterial({map:emojiTex(a.e||'🐾'),transparent:true})); m.scale.set(4.2,4.2,1); m.position.y=4; st.add(m); const ha=new THREE.Mesh(new THREE.TorusGeometry(1.5,.09,6,24),mb(RCOL[a.r]||0xffd54f)); ha.rotation.x=Math.PI/2; ha.position.y=1.7; st.add(ha); const gl=new THREE.Mesh(new THREE.SphereGeometry(2.6,10,8),mb(RCOL[a.r]||0xffd54f,{transparent:true,opacity:.14,depthWrite:false})); gl.position.y=3.8; st.add(gl); });
    sc().add(g); F.lm[name]={g,key}; }catch(e){ console.warn('ZFx.landmark',e); } };
  F.landmarkClean=function(alive){ try{ Object.keys(F.lm).forEach(n=>{ if(!alive[n]&&n!==(ZS.player)){ sc().remove(F.lm[n].g); delete F.lm[n]; } }); }catch(e){} };
  // ── Wetter: Pfützen + Spritzer ──
  const wxInit=()=>{ if(F.wx) return; const g=new THREE.Group(); sc().add(g); const pud=[], spl=[];
    for(let i=0;i<18;i++){ const m=new THREE.Mesh(new THREE.CircleGeometry(1,18),new THREE.MeshBasicMaterial({color:0x7fa9cf,transparent:true,opacity:0,depthWrite:false})); m.rotation.x=-Math.PI/2; m.position.y=.09; m.userData.s=[1+Math.random()*2.2,1+Math.random()*1.4]; g.add(m); pud.push(m); }
    for(let i=0;i<45;i++){ const m=new THREE.Mesh(new THREE.RingGeometry(.1,.17,12),new THREE.MeshBasicMaterial({color:0xdff3ff,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false})); m.rotation.x=-Math.PI/2; m.userData.t=Math.random(); g.add(m); spl.push(m); }
    F.wx={g,pud,spl}; };
  const place=(m,pl,yaw,ahead)=>{ const a=Math.random()*6.283, r=ahead?(10+Math.random()*22):(3+Math.random()*30); const ox=ahead?(-Math.sin(yaw)*r+(Math.random()-.5)*26):Math.cos(a)*r, oz=ahead?(-Math.cos(yaw)*r+(Math.random()-.5)*26):Math.sin(a)*r; m.position.x=pl.x+ox; m.position.z=pl.z+oz; };
  const raining=()=>{ try{ if(window.ZWeather&&ZWeather.cur&&(ZWeather.cur.type==='rain'||ZWeather.cur.type==='storm')&&ZWeather.on&&ZWeather.on()) return ZWeather.cur.type==='storm'?1:.8; if(typeof Weather!=='undefined'&&Weather.isEnabled()&&Weather.current==='rain') return .7; }catch(e){} return 0; };
  F.wxFrame=function(dt,now){ const pl=ZG.pl; if(!pl) return; const rn=raining(); F.wet+=Math.sign(rn-F.wet)*Math.min(Math.abs(rn-F.wet),dt*(rn>F.wet?.18:.04)); if(F.wet<.01&&!F.wx) return; wxInit(); const W=F.wx; W.g.visible=F.wet>.01; if(!W.g.visible) return;
    W.pud.forEach(m=>{ const dx=m.position.x-pl.x, dz=m.position.z-pl.z; if(!m._i||dx*dx+dz*dz>1500){ place(m,pl,ZG.yaw,!!m._i); m._i=1; m.position.y=.09; m.scale.set(m.userData.s[0],m.userData.s[1],1); } m.material.opacity=F.wet*.38; });
    W.spl.forEach(m=>{ m.userData.t+=dt*(1.6+F.wet); if(m.userData.t>=1){ m.userData.t=0; place(m,pl,ZG.yaw,false); m.position.y=.12; } const k=m.userData.t; m.scale.setScalar(.4+k*2.2); m.material.opacity=F.wet*(rn>0?.75:0)*(1-k); }); };
  // ── Frame-Hook ──
  let last=performance.now();
  F.frame=function(){ const now=performance.now(), dt=Math.min(.1,(now-last)/1000); last=now; if(!ZG.cam) return;
    for(let i=F.items.length-1;i>=0;i--){ const it=F.items[i], k=(now-it.t0)/it.life; if(k>=1){ sc().remove(it.o); try{ it.o.geometry&&it.o.geometry.dispose(); }catch(e){} F.items.splice(i,1); continue; } try{ it.upd&&it.upd(it.o,k); }catch(e){} }
    try{ F.wxFrame(dt,now); }catch(e){}
    try{ Object.keys(F.lm).forEach(n=>{ const j=F.lm[n].g.userData.jets; if(!j) return; const t=now/1000; j.forEach(q=>{ const ph=(t*.9+q[1])%1; const r=Math.sin(ph*Math.PI)*1.9; q[0].position.set(Math.cos(q[2])*ph*1.5,2.8+Math.sin(ph*Math.PI)*2.2,Math.sin(q[2])*ph*1.5); q[0].material.opacity=1-ph*.6; }); }); }catch(e){}
    const s=F._sh; if(s&&s.t>0&&now-s.t0<s.t*1000){ const k=1-(now-s.t0)/(s.t*1000), a=s.a*k; F._off=[(Math.random()-.5)*a,(Math.random()-.5)*a,(Math.random()-.5)*a]; ZG.cam.position.x+=F._off[0]; ZG.cam.position.y+=F._off[1]; ZG.cam.position.z+=F._off[2]; } else F._off=null; };
  F.after=function(){ if(F._off&&ZG.cam){ ZG.cam.position.x-=F._off[0]; ZG.cam.position.y-=F._off[1]; ZG.cam.position.z-=F._off[2]; F._off=null; } };
  const boot=()=>{ try{
      if(typeof ZG==='undefined'||!ZG.scene||!ZG.renderer||!ZG.cam) return setTimeout(boot,800);
      const r=ZG.renderer, o=r.render.bind(r); r.render=function(s,c){ if(s===ZG.scene){ try{ F.frame(); }catch(e){} } const res=o(s,c); if(s===ZG.scene){ try{ F.after(); }catch(e){} } return res; };
      const se=ZG._slapEffect; if(se) ZG._slapEffect=function(sl,name,dur,mesh){ try{ const m=mesh||(ZG.otherM&&ZG.otherM[name]); if(m) F.hit(m.position,sl&&sl.id); }catch(e){} return se.apply(this,arguments); };
      const rs=ZG._receiveSlap; if(rs) ZG._receiveSlap=function(){ try{ F.shake(.22,.4); }catch(e){} return rs.apply(this,arguments); };
      const vi=ZG._visitor; if(vi) ZG._visitor=function(){ const z=ZS.zoo, m0=z?z.mt:0; const res=vi.apply(this,arguments); try{ if(z) F.coins(z.mt-m0); }catch(e){} return res; };
    }catch(e){ setTimeout(boot,1500); } };
  window.addEventListener('load',()=>setTimeout(boot,1800));
})();
