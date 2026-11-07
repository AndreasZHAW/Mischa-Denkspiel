/* ═══ ZExtra (v767): Zoo-Kiosk, Streichel-Zoo, Ambiente-Sound, Geheimnis-Karte mit Schatzpunkten ═══ */
(function(){
  'use strict';
  if(window.ZShop) return;
  const $=id=>document.getElementById(id);
  const MC={}; const mb=(c,o)=>{ const k=c+(o?JSON.stringify(o):''); return MC[k]||(MC[k]=new THREE.MeshBasicMaterial(Object.assign({color:c},o||{}))); };
  const bx=(w,h,d,c,x,y,z,g,o)=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mb(c,o)); m.position.set(x,y,z); g.add(m); return m; };
  const cy=(a,b,h,c,x,y,z,g,s,o)=>{ const m=new THREE.Mesh(new THREE.CylinderGeometry(a,b,h,s||10),mb(c,o)); m.position.set(x,y,z); g.add(m); return m; };
  const sp=(c,r,x,y,z,g,o)=>{ const m=new THREE.Mesh(new THREE.SphereGeometry(r,10,8),mb(c,o)); m.position.set(x,y,z); g.add(m); return m; };
  const cv=(w,h)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; };
  const emoTex={}; const emo=e=>{ if(emoTex[e]) return emoTex[e]; const c=cv(128,128), g=c.getContext('2d'); g.font='96px serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(e,64,68); return emoTex[e]=new THREE.CanvasTexture(c); };
  const signTex=(t,w,h,bg,fg,sz)=>{ const c=cv(w,h), g=c.getContext('2d'); g.fillStyle=bg; g.fillRect(0,0,w,h); g.strokeStyle='#fff'; g.lineWidth=6; g.strokeRect(5,5,w-10,h-10); g.fillStyle=fg; g.font='900 '+(sz||h*.45)+'px Arial Black,Arial'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(t,w/2,h/2+2); const x=new THREE.CanvasTexture(c); x.anisotropy=4; return x; };
  const price=p=>{ try{ return $mt(p); }catch(e){ return String(Math.round(p)); } };
  const zoo=()=>{ try{ return ZS.zoo; }catch(e){ return null; } };
  const toast=(m,ms)=>{ try{ ZP.toast(m,ms||2500); }catch(e){} };
  const btn=(id,txt,css)=>{ let b=$(id); if(b) return b; b=document.createElement('button'); b.id=id; b.textContent=txt; b.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:240px;z-index:130;display:none;padding:11px 22px;border:none;border-radius:28px;font:900 .95rem Arial;box-shadow:0 4px 0 rgba(0,0,0,.35),0 8px 16px rgba(0,0,0,.4);'+css; document.body.appendChild(b); return b; };
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  // gemeinsamer Einkommens-Schnitt pro Besuch-Tick (für Preise/Belohnungen)
  const Shop=window.ZShop={tick:0,lvl:0,pos:null};
  const tickInc=()=>Math.max(Shop.tick||0,0);
  // ═══ Kiosk ═══
  const MAXL=5;
  const kpos=()=>{ const slot=(typeof ZS.mySlot==='number')?ZS.mySlot:0, l=ZG._slotEncPos(slot), a=l.angle, rx=Math.cos(a), rz=Math.sin(a), tx=-rz, tz=rx; return {x:l.center.x-rx*10+tx*17,z:l.center.z-rz*10+tz*17,rx,rz,tx,tz,ang:a}; };
  Shop.cost=()=>Math.max(500,Math.round(tickInc()*150*(Shop.lvl+1)));
  Shop.build=function(){ try{ const z=zoo(); if(!z||typeof ZS.mySlot!=='number'||!ZG.scene) return; const L=(z.shop&&z.shop.l)||0; Shop.lvl=L; const kp=kpos(); const key=L+'|'+Math.round(kp.x)+','+Math.round(kp.z); if(Shop._key===key) return; Shop._key=key; if(Shop.g) ZG.scene.remove(Shop.g);
    const g=new THREE.Group(); g.position.set(kp.x,0,kp.z); g.rotation.y=Math.atan2(-kp.tx,-kp.tz); // lokale +z zeigt zum Tor (−tangente)
    Shop.pos={x:kp.x,z:kp.z,sx:kp.x-kp.tx*3.6,sz:kp.z-kp.tz*3.6};
    const gold=L>=5, roofC=gold?0xffc107:0xd32f2f;
    bx(5.6,.25,4.2,0xd9d2c3,0,.12,0,g); bx(4.6,1.3,2.0,0xf5e6c4,0,.9,-.6,g); bx(4.8,.15,2.2,0x8d6e63,0,1.6,-.6,g); // Sockel/Theke
    [-2.2,2.2].forEach(s=>bx(.2,3.2,.2,0xeeeeee,s,1.8,1.3,g)); [-2.2,2.2].forEach(s=>bx(.2,3.2,.2,0xeeeeee,s,1.8,-1.9,g));
    for(let i=0;i<8;i++) bx(.62,.14,3.6,i%2?0xffffff:roofC,-2.17+i*.62,3.5+(i%2?0:0),-.3,g); const rf=bx(5.2,.22,4.0,roofC,0,3.7,-.3,g); rf.rotation.x=.06;
    for(let i=0;i<8;i++) bx(.62,.5,.08,i%2?0xffffff:roofC,-2.17+i*.62,3.2,1.5,g);
    bx(4.4,2.2,.12,0x6d4c41,0,2.0,-2.05,g); [[-1.4,2.4],[0,2.0],[1.4,2.4]].forEach((q,i)=>{ bx(1.0,.1,.6,0x8d6e63,q[0],q[1],-1.8,g); }); [0xff5c8a,0x4fc3f7,0xffd54f,0x81c784,0xba68c8].forEach((c,i)=>{ bx(.4,.5,.3,c,-1.8+i*.9,2.7,-1.75,g); });
    const sg=new THREE.Mesh(new THREE.PlaneGeometry(4.2,1.0),new THREE.MeshBasicMaterial({map:signTex('🍦 EIS & SOUVENIRS',512,120,'#0d47a1','#fff',44),side:THREE.DoubleSide})); sg.position.set(0,4.6,.3); g.add(sg);
    const coneG=(x,col)=>{ const c=new THREE.Mesh(new THREE.ConeGeometry(.22,.6,8),mb(0xd9a441)); c.rotation.x=Math.PI; c.position.set(x,2.3,1.0); g.add(c); sp(col,.26,x,2.7,1.0,g); sp(col,.18,x,2.95,1.0,g); };
    coneG(-.6,0xff8fb1); coneG(.6,0xfff176);
    if(L>=2){ cy(.05,.05,5,0x9e9e9e,3.1,2.5,1.2,g,6); bx(1.4,.9,.05,0xe53935,3.8,4.6,1.2,g); }
    if(L>=3){ [-1,1].forEach((s,i)=>{ cy(.03,.03,2.2,0xeeeeee,s*3.0,3.3,1.6,g,4); sp([0xff5252,0x4fc3f7][i],.42,s*3.0,4.7,1.6,g).scale.y=1.2; }); bx(2.2,.9,1.0,0xf5e6c4,-4.2,.55,.6,g); bx(2.3,.1,1.1,0x8d6e63,-4.2,1.05,.6,g); for(let i=0;i<4;i++) sp([0xffb74d,0x81d4fa,0xf48fb1,0xc5e1a5][i],.22,-4.8+i*.4,1.35,.6,g); }
    if(L>=4){ for(let i=0;i<14;i++){ const b=sp(i%2?0xfff59d:0xffcc80,.1,-2.6+i*.4,3.55-Math.abs(i-6.5)*.03,1.55,g); } }
    if(L>=5){ cy(1.2,1.4,.3,0xcfc7dc,5.2,.15,.8,g,16); cy(.2,.3,1.3,0xe9e3f5,5.2,.9,.8,g,8); sp(0xffd54f,.5,5.2,1.8,.8,g); }
    const lb=ZG._txt('🍦 Kiosk Lv. '+L,.5,'#fff'); lb.scale.set(5,1.2,1); lb.position.set(0,6.0,0); g.add(lb);
    ZG.scene.add(g); Shop.g=g; }catch(e){ console.warn('ZShop',e); } };
  Shop.open=function(){ const z=zoo(); if(!z) return; let o=$('zshop-ov'); if(o) o.remove(); const L=(z.shop&&z.shop.l)||0; const cost=Shop.cost(), can=(z.mt||0)>=cost&&L<MAXL;
    o=document.createElement('div'); o.id='zshop-ov'; o.style.cssText='position:fixed;inset:0;z-index:600;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;font-family:Arial,sans-serif';
    const star='⭐'.repeat(L)+'☆'.repeat(MAXL-L);
    o.innerHTML='<div style="width:min(92vw,380px);background:#1b2438;border:3px solid #ffd54f;border-radius:18px;padding:16px;color:#fff;text-align:center"><div style="font-size:2.4rem">🍦</div><div style="font-weight:900;font-size:1.1rem;color:#ffd54f">Zoo-Kiosk</div><div style="margin:4px 0;letter-spacing:.2em">'+star+'</div>'
      +'<div style="font-size:.85rem;line-height:1.4;margin:8px 0;opacity:.9">Besucher kaufen Eis und Souvenirs. Jede Stufe bringt <b>+3 %</b> Extra-Geld auf deine Besucher-Einnahmen.<br>Jetzt: <b style="color:#7dffb0">+'+(L*3)+' %</b>'+(L<MAXL?' → nächste Stufe <b style="color:#7dffb0">+'+((L+1)*3)+' %</b>':' (Maximum)')+'</div>'
      +(L<MAXL?'<button id="zshop-up" style="width:100%;padding:11px;border:none;border-radius:12px;background:'+(can?'linear-gradient(135deg,#43a047,#2e7d32)':'#555')+';color:#fff;font:900 .95rem Arial">'+(L===0?'🏗️ Kiosk bauen':'⬆️ Ausbauen')+' – '+price(cost)+' MT</button>':'')
      +'<button id="zshop-x" style="margin-top:8px;width:100%;padding:9px;border:none;border-radius:12px;background:rgba(255,255,255,.14);color:#fff;font-weight:800">Schliessen</button></div>';
    document.body.appendChild(o); $('zshop-x').onclick=()=>o.remove(); const up=$('zshop-up'); if(up) up.onclick=()=>{ const c=Shop.cost(); if((z.mt||0)<c){ toast('❌ Zu wenig MT!'); return; } z.mt-=c; z.shop={l:L+1}; Shop.lvl=L+1; try{ ZS.save&&ZS.save(); ZG._updHUD&&ZG._updHUD(); }catch(e){} Shop.build(); o.remove(); toast('🍦 Kiosk auf Stufe '+(L+1)+' ausgebaut!',3000); try{ ZGfx.confetti(60); }catch(e){} Shop.open(); }; };
  // ═══ Streichel-Zoo ═══
  const Pet=window.ZPet={X:-62,Z:-48,R:9,list:[]};
  const PETS=[['🐰',-3,2],['🐑',3,-2],['🐥',-1,-4],['🐖',4,3],['🐐',-4,-2],['🐹',1,4]];
  Pet.build=function(){ try{ if(Pet.g||!ZG.scene) return; const g=new THREE.Group(); g.position.set(Pet.X,0,Pet.Z); const R=Pet.R;
    const fl=new THREE.Mesh(new THREE.CircleGeometry(R,32),mb(0x8fd36a)); fl.rotation.x=-Math.PI/2; fl.position.y=.08; g.add(fl); const fl2=new THREE.Mesh(new THREE.RingGeometry(R-1.2,R,32),mb(0xc8b27a)); fl2.rotation.x=-Math.PI/2; fl2.position.y=.09; g.add(fl2);
    for(let i=0;i<24;i++){ const a=i/24*6.283; if(Math.abs(a-Math.PI/2)<.3) continue; const x=Math.cos(a)*R, z=Math.sin(a)*R; bx(.25,1.1,.25,0x9c6b3c,x,.55,z,g); const nx=Math.cos(a+.131)*R, nz=Math.sin(a+.131)*R; if(!(Math.abs(a+.262-Math.PI/2)<.3)){ const r=bx(Math.hypot(nx-x,nz-z),.14,.14,0xb98550,(x+nx)/2,.85,(z+nz)/2,g); r.rotation.y=-Math.atan2(nz-z,nx-x); } }
    const sg=new THREE.Mesh(new THREE.PlaneGeometry(6,1.5),new THREE.MeshBasicMaterial({map:signTex('🐾 STREICHEL-ZOO',512,128,'#2e7d32','#fff',46),side:THREE.DoubleSide})); sg.position.set(0,3.4,R+.2); g.add(sg); bx(.25,3,.25,0x9c6b3c,-2.6,1.5,R+.2,g); bx(.25,3,.25,0x9c6b3c,2.6,1.5,R+.2,g);
    [[-6,-3],[6,-4],[5,5],[-6,5]].forEach(q=>{ cy(.15,.2,1.3,0x6d4c1d,q[0],.65,q[1],g,6); sp(0x43a047,1.0,q[0],2.0,q[1],g); });
    Pet.list=PETS.map((p,i)=>{ const s=new THREE.Sprite(new THREE.SpriteMaterial({map:emo(p[0]),transparent:true})); s.scale.set(1.7,1.7,1); s.position.set(p[1],.9,p[2]); g.add(s); return {s,x:p[1],z:p[2],tx:p[1],tz:p[2],ph:i*1.3,cd:0,e:p[0]}; });
    ZG.scene.add(g); Pet.g=g; }catch(e){ console.warn('ZPet',e); } };
  Pet.pet=function(){ const z=zoo(); if(!z||!Pet.g) return; const lx=ZG.pl.x-Pet.X, lz=ZG.pl.z-Pet.Z; let best=null,bd=99; Pet.list.forEach(p=>{ const d=Math.hypot(p.x-lx,p.z-lz); if(d<bd){ bd=d; best=p; } }); if(!best||bd>7) return toast('🐾 Geh näher an ein Tier heran!',1800);
    const now=Date.now(); if(best.cd>now){ return toast('💤 '+best.e+' mag gerade nicht mehr (noch '+Math.ceil((best.cd-now)/1000)+' s)',1800); } best.cd=now+40000;
    for(let i=0;i<5;i++){ const h=new THREE.Sprite(new THREE.SpriteMaterial({map:emo('💖'),transparent:true})); h.scale.set(.7,.7,1); const bp=best.s.position; h.position.set(bp.x+(Math.random()-.5)*1.2,bp.y+1.2,bp.z); Pet.g.add(h); const t0=performance.now(), dx=(Math.random()-.5)*1.6; const tick=()=>{ const k=(performance.now()-t0)/1100; if(k>=1){ Pet.g.remove(h); return; } h.position.y=bp.y+1.2+k*2.2; h.position.x+=dx*.01; h.material.opacity=1-k; requestAnimationFrame(tick); }; setTimeout(tick,i*90); }
    best.jump=performance.now(); z.pet=z.pet||{n:0,b:0}; z.pet.n++; const rew=Math.max(20,Math.round(tickInc()*2)); z.mt+=rew; try{ ZG._updHUD&&ZG._updHUD(); }catch(e){}
    toast(best.e+' 💖 Gestreichelt! +'+price(rew)+' MT',1800);
    if(z.pet.n%15===0&&Date.now()>(z.pet.b||0)){ z.pet.b=Date.now()+30*60000; try{ ZTread.tBoost('money',1.3,3); }catch(e){} toast('🥰 Die Tiere lieben dich! Geld ×1,3 · 3 Min',4000); try{ ZGfx.confetti(80); }catch(e){} }
    try{ ZS.save&&ZS.save(); }catch(e){} };
  Pet.frame=function(dt,t){ if(!Pet.g) return; Pet.list.forEach(p=>{ if(Math.hypot(p.tx-p.x,p.tz-p.z)<.2||Math.random()<.002){ const a=Math.random()*6.283, r=Math.random()*6.4; p.tx=Math.cos(a)*r; p.tz=Math.sin(a)*r; } const dx=p.tx-p.x, dz=p.tz-p.z, d=Math.hypot(dx,dz)||1; p.x+=dx/d*.6*dt; p.z+=dz/d*.6*dt; const hop=Math.abs(Math.sin(t*5+p.ph))*.25; const j=p.jump?Math.max(0,1-(performance.now()-p.jump)/500):0; p.s.position.set(p.x,.9+hop*(d>.3?1:.2)+j*.9,p.z); }); };
  // ═══ Ambiente-Sound (Vögel, Grillen, Gondel-Surren, Regen) ═══
  const Amb=window.ZAmb={};
  Amb._ctx=()=>{ try{ const c=window.ZSound&&ZSound.ctx; if(!c||c.state!=='running') return null; if(ZSound.style==='off') return null; return c; }catch(e){ return null; } };
  Amb._tick=function(){ const c=Amb._ctx(); if(!c){ if(Amb.m) Amb.m.gain.value=0; return; } try{
      if(!Amb.m){ Amb.m=c.createGain(); Amb.m.connect(c.destination); const o=c.createOscillator(); o.type='sawtooth'; o.frequency.value=62; const lp=c.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=180; Amb.hum=c.createGain(); Amb.hum.gain.value=0; o.connect(lp); lp.connect(Amb.hum); Amb.hum.connect(Amb.m); o.start();
        const n=c.sampleRate*2, b=c.createBuffer(1,n,c.sampleRate), d=b.getChannelData(0); for(let i=0;i<n;i++) d[i]=Math.random()*2-1; const ns=c.createBufferSource(); ns.buffer=b; ns.loop=true; const bp=c.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=2600; bp.Q.value=.4; Amb.rain=c.createGain(); Amb.rain.gain.value=0; ns.connect(bp); bp.connect(Amb.rain); Amb.rain.connect(Amb.m); ns.start(); }
      Amb.m.gain.value=.6; const pl=ZG.pl, ds=Math.hypot(pl.x,pl.z); Amb.hum.gain.setTargetAtTime(Math.max(0,.05*(1-Math.min(1,ds/70))),c.currentTime,.4); Amb.rain.gain.setTargetAtTime(Math.min(.05,(window.ZFx?ZFx.wet:0)*.05),c.currentTime,.8);
      const h=new Date().getHours(), day=h>=7&&h<19, now=performance.now(); if(now<(Amb._n||0)) return; Amb._n=now+(day?2500+Math.random()*4500:900+Math.random()*1200);
      const chirp=(f0,f1,d,v,at)=>{ const o=c.createOscillator(), g=c.createGain(); o.type='sine'; o.frequency.setValueAtTime(f0,at); o.frequency.exponentialRampToValueAtTime(f1,at+d); g.gain.setValueAtTime(0,at); g.gain.linearRampToValueAtTime(v,at+.01); g.gain.exponentialRampToValueAtTime(.0001,at+d); o.connect(g); g.connect(Amb.m); o.start(at); o.stop(at+d+.02); };
      const t=c.currentTime+.02; if(day&&(!window.ZFx||ZFx.wet<.3)){ const n=2+Math.floor(Math.random()*4), base=2600+Math.random()*1600; for(let i=0;i<n;i++) chirp(base,base*(1.2+Math.random()*.4),.09,.035,t+i*.13); }
      else if(!day){ for(let i=0;i<3;i++) chirp(4300,4500,.05,.02,t+i*.09); }
    }catch(e){} };
  // ═══ Geheimnis-Karte + Schatzpunkte ═══
  const MapX=window.ZSecMap={};
  const TRE=[{x:125,z:-115,h:'Weit im Osten, fast am Rand der Welt – dort wo das Gras flüstert.'},{x:-140,z:125,h:'Im Südwesten, jenseits der Gehege-Ringe. Nur ein Hügelchen aus Erde.'},{x:175,z:70,h:'Im Osten, auf Höhe des Marktplatzes, aber sehr weit draussen.'}];
  const CAVE={x:-205,z:-60,h:'Ein moosbewachsener Hügel im Westen, weit ausserhalb des Zoo-Rings. Eine Steintür verbirgt eine Schatzkammer – ein Rätsel öffnet sie.'};
  const sec=()=>{ const z=zoo(); if(!z) return {}; return z.sec||(z.sec={}); };
  MapX.build=function(){ try{ if(MapX.g||!ZG.scene) return; const g=new THREE.Group(); TRE.forEach((p,i)=>{ const m=new THREE.Mesh(new THREE.SphereGeometry(1.1,8,6),mb(0x7a5230)); m.scale.y=.35; m.position.set(p.x,.2,p.z); g.add(m); const a=bx(1.6,.08,.22,0x4e342e,p.x,.5,p.z,g); a.rotation.y=.8; const b=bx(1.6,.08,.22,0x4e342e,p.x,.5,p.z,g); b.rotation.y=-.8; }); ZG.scene.add(g); MapX.g=g; }catch(e){} };
  MapX.poll=function(){ const z=zoo(); if(!z||!ZG.pl) return; const s=sec(), pl=ZG.pl; let ch=false; if(!s.cave&&dist(pl,CAVE)<35){ s.cave=1; ch=true; toast('🗺️ Neuer Ort auf der Karte: Geheime Höhle!',3500); } if(!s.pet&&dist(pl,{x:Pet.X,z:Pet.Z})<35){ s.pet=1; ch=true; toast('🗺️ Neuer Ort auf der Karte: Streichel-Zoo!',3500); } if(ch){ try{ ZS.save&&ZS.save(); }catch(e){} } };
  MapX.dig=function(){ const z=zoo(), s=sec(), pl=ZG.pl; const i=TRE.findIndex(p=>dist(pl,p)<4.5); if(i<0) return; const k='t'+i; if((s[k]||0)>Date.now()) return toast('🕳️ Hier hast du schon gegraben – komm später wieder.',2500); s[k]=Date.now()+12*3600000; const rew=Math.max(300,Math.round(tickInc()*60)); z.mt+=rew; try{ ZG._updHUD&&ZG._updHUD(); ZS.save&&ZS.save(); ZGfx.confetti(100); }catch(e){} toast('⛏️ Schatz gefunden! +'+price(rew)+' MT',4000); };
  MapX.open=function(){ let o=$('zmap-ov'); if(o){ o.remove(); return; } const z=zoo(); if(!z) return; const s=sec(); o=document.createElement('div'); o.id='zmap-ov'; o.style.cssText='position:fixed;inset:0;z-index:600;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;font-family:Georgia,serif';
    const W=Math.min(340,innerWidth-40); o.innerHTML='<div style="background:#e9d9ac;border:4px solid #8d6e3f;border-radius:14px;padding:10px;max-width:min(94vw,380px);color:#3b2a10;text-align:center;max-height:94vh;overflow:auto"><div style="font:900 1.15rem Georgia;margin-bottom:4px">🗺️ Geheimnis-Karte</div><canvas id="zmap-c" width="'+W*2+'" height="'+W*2+'" style="width:'+W+'px;height:'+W+'px;border-radius:10px"></canvas><div id="zmap-h" style="font-size:.78rem;text-align:left;margin-top:6px;line-height:1.35"></div><button id="zmap-x" style="margin-top:8px;padding:8px 22px;border:none;border-radius:10px;background:#8d6e3f;color:#fff;font:800 .9rem Arial">Schliessen</button></div>';
    document.body.appendChild(o); $('zmap-x').onclick=()=>o.remove(); o.onclick=e=>{ if(e.target===o) o.remove(); };
    const c=$('zmap-c'), g=c.getContext('2d'), S=W*2, WR=(ZG.WR||335), k=S/2/(WR+10), cx=S/2, cz=S/2; const X=x=>cx+x*k, Y=y=>cz+y*k;
    g.fillStyle='#e9d9ac'; g.fillRect(0,0,S,S); g.beginPath(); g.arc(cx,cz,WR*k,0,6.283); g.fillStyle='#b9d79a'; g.fill(); g.lineWidth=5; g.strokeStyle='#8d6e3f'; g.stroke();
    g.setLineDash([10,8]); g.strokeStyle='rgba(60,90,40,.6)'; g.lineWidth=3; g.beginPath(); g.arc(X(0),Y(55),140*k,0,6.283); g.stroke(); g.setLineDash([]);
    const ic=(e,x,y,sz)=>{ g.font=(sz||30)+'px serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(e,X(x),Y(y)); };
    ic('🚡',0,0,34); ic('🏪',0,30,26);
    try{ const l=ZG._slotEncPos(typeof ZS.mySlot==='number'?ZS.mySlot:0); ic('🏠',l.center.x,l.center.z,30); }catch(e){}
    const hints=[]; hints.push('🚡 <b>Gondelstation</b> – in der Mitte. 🏪 Marktplatz davor.');
    if(s.pet){ ic('🐰',Pet.X,Pet.Z,32); hints.push('🐰 <b>Streichel-Zoo</b> – im Nordwesten, nahe der Mitte.'); } else { g.fillStyle='rgba(120,80,30,.3)'; g.beginPath(); g.arc(X(Pet.X+10),Y(Pet.Z-8),38*k+16,0,6.283); g.fill(); ic('❓',Pet.X+10,Pet.Z-8,30); hints.push('❓ Irgendwo im Nordwesten laufen kleine Tiere in einem Gehege herum.'); }
    if(s.cave){ ic('🗿',CAVE.x,CAVE.z,32); hints.push('🗿 <b>Geheime Höhle</b> – '+(s.cave?'entdeckt. ':'')+CAVE.h); } else { g.fillStyle='rgba(120,80,30,.3)'; g.beginPath(); g.arc(X(CAVE.x+18),Y(CAVE.z-22),55*k+16,0,6.283); g.fill(); ic('❓',CAVE.x+18,CAVE.z-22,30); hints.push('❓ '+CAVE.h); }
    TRE.forEach((p,i)=>{ const done=(s['t'+i]||0)>Date.now(); const off={x:(i%2?-1:1)*22,z:(i===1?-18:16)}; if(done){ ic('✅',p.x,p.z,26); hints.push('✅ Schatz '+(i+1)+' – gegraben (wieder in '+Math.ceil((s['t'+i]-Date.now())/3600000)+' Std).'); } else { g.fillStyle='rgba(120,80,30,.28)'; g.beginPath(); g.arc(X(p.x+off.x),Y(p.z+off.z),44*k+14,0,6.283); g.fill(); ic('❌',p.x+off.x,p.z+off.z,28); hints.push('❌ <b>Schatz '+(i+1)+'</b>: '+p.h); } });
    const pl=ZG.pl; g.save(); g.translate(X(pl.x),Y(pl.z)); g.rotate(-ZG.yaw+Math.PI); g.fillStyle='#d32f2f'; g.strokeStyle='#fff'; g.lineWidth=3; g.beginPath(); g.moveTo(0,-14); g.lineTo(10,10); g.lineTo(0,5); g.lineTo(-10,10); g.closePath(); g.fill(); g.stroke(); g.restore();
    $('zmap-h').innerHTML=hints.map(h=>'<div style="margin:2px 0">'+h+'</div>').join('')+'<div style="margin-top:4px;opacity:.7">Tipp: Mit „⛏️ Graben" direkt auf einem Erdhügel findest du den Schatz. Rote Pfeile = du.</div>'; };
  // ═══ UI + Frame ═══
  let uiOk=false; const ui=()=>{ if(uiOk) return; uiOk=true;
    btn('zx-shop','🍦 Kiosk','background:linear-gradient(135deg,#ffd54f,#ff9800);color:#2a1700').onclick=()=>Shop.open();
    btn('zx-pet','🤲 Streicheln','background:linear-gradient(135deg,#f48fb1,#ec407a);color:#fff').onclick=()=>Pet.pet();
    btn('zx-dig','⛏️ Graben','background:linear-gradient(135deg,#a1887f,#6d4c41);color:#fff').onclick=()=>MapX.dig();
    const m=document.createElement('button'); m.id='zx-map'; m.textContent='🗺️'; m.title='Geheimnis-Karte'; m.style.cssText='position:fixed;right:10px;bottom:190px;z-index:129;width:46px;height:46px;border-radius:50%;border:3px solid #8d6e3f;background:#e9d9ac;font-size:1.4rem;box-shadow:0 3px 8px rgba(0,0,0,.4)'; m.onclick=()=>MapX.open(); document.body.appendChild(m); };
  let last=performance.now(), upT=0;
  const frame=()=>{ const now=performance.now(), dt=Math.min(.1,(now-last)/1000); last=now; try{ Pet.frame(dt,now/1000); }catch(e){} upT+=dt; if(upT<.3) return; upT=0; try{ const z=zoo(), pl=ZG.pl; if(!z||!pl) return; if(!Shop._b||(Shop._key&&false)){ Shop._b=1; } Shop.build(); const riding=window.ZStation&&ZStation.riding; const nS=Shop.pos&&dist(pl,Shop.pos)<10&&pl.y<4&&!riding, nP=Pet.g&&dist(pl,{x:Pet.X,z:Pet.Z})<Pet.R+3&&!riding, nD=TRE.some(p=>dist(pl,p)<4.5)&&!riding;
      const sh=$('zx-shop'), pe=$('zx-pet'), di=$('zx-dig'); if(sh) sh.style.display=nS?'block':'none'; if(pe) pe.style.display=nP?'block':'none'; if(di) di.style.display=nD?'block':'none'; const mp=$('zx-map'); if(mp) mp.style.display=riding?'none':'block'; }catch(e){} };
  const boot=()=>{ try{ if(typeof ZG==='undefined'||!ZG.scene||!ZG.renderer||!ZG.cam||!zoo()||typeof ZS.mySlot!=='number') return setTimeout(boot,1000);
      ui(); Pet.build(); MapX.build(); Shop.build(); const r=ZG.renderer, o=r.render.bind(r); r.render=function(s,c){ if(s===ZG.scene){ try{ frame(); }catch(e){} } return o(s,c); };
      const vi=ZG._visitor; ZG._visitor=function(){ const z=zoo(), m0=z?z.mt:0; const res=vi.apply(this,arguments); try{ if(z){ const d=z.mt-m0; if(d>0){ Shop.tick=Shop.tick?Shop.tick*.8+d*.2:d; const L=(z.shop&&z.shop.l)||0; if(L>0){ const b=d*.03*L; z.mt+=b; z.te=(z.te||0)+b; } } } }catch(e){} return res; };
      setInterval(()=>{ try{ Amb._tick(); }catch(e){} },700); setInterval(()=>{ try{ MapX.poll(); }catch(e){} },1500);
    }catch(e){ setTimeout(boot,1500); } };
  window.addEventListener('load',()=>setTimeout(boot,2200));
})();
