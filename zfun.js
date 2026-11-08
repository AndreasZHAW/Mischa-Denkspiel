/* ═══ ZFun (v774): Zoo-Bahn (Eisenbahn mit Bahnhöfen) und Ei-Brüterei – Rebirth 6 ═══ */
(function(){
  'use strict';
  if(window.ZTrain) return;
  const wait=()=>{ if(!window.ZReb6||!ZReb6.U||typeof THREE==='undefined') return setTimeout(wait,300); init(); };
  function init(){
  const Core=ZReb6, U=Core.U, {$,mb,bx,cy,sp,cv,emo,signTex,price,zoo,toast,dist,save,hud,modal,bs,GREEN,GREY,GLASS,nbtn}=U;
  const riding=()=>!!(window.ZStation&&ZStation.riding);
  const secO=()=>{ const z=zoo(); if(!z) return {}; return z.sec||(z.sec={}); };
  const r6=()=>Core.r6();
  const spr=(e,s,x,y,z,g,op)=>{ const m=new THREE.Sprite(new THREE.SpriteMaterial({map:emo(e),transparent:true,opacity:op==null?1:op})); m.scale.set(s,s,1); m.position.set(x,y,z); g.add(m); return m; };
  const lab=(txt,w,h,x,y,z,g)=>{ const l=ZG._txt(txt,.5,'#fff'); l.scale.set(w,h,1); l.position.set(x,y,z); g.add(l); return l; };
  const tick=()=>Math.max(Core.tick(),100);

  // ═══════════ ZOO-BAHN ═══════════
  const T=window.ZTrain={g:null,th:0,riding:false};
  const C={x:60,z:255}, R=34, NS=4;
  const SA=[0,Math.PI/2,Math.PI,Math.PI*1.5];            // Winkel der 4 Bahnhöfe
  const bahn=()=>{ const r=r6(); return r.bahn||(r.bahn={s:[0,0,0,0]}); };
  T.cost=l=>Math.max(20000,Math.round(tick()*500*Math.pow(2.2,l)));
  T.pos=(th)=>({x:C.x+Math.cos(th)*R,z:C.z+Math.sin(th)*R});
  T.build=function(){ try{ if(T.g||!ZG.scene) return; const g=new THREE.Group(); g.position.set(C.x,0,C.z);
    const bed=new THREE.Mesh(new THREE.RingGeometry(R-2,R+2,64),mb(0x9e9a90)); bed.rotation.x=-Math.PI/2; bed.position.y=.08; g.add(bed);
    [R-.8,R+.8].forEach(rr=>{ const rl=new THREE.Mesh(new THREE.RingGeometry(rr-.1,rr+.1,64),mb(0x37474f)); rl.rotation.x=-Math.PI/2; rl.position.y=.14; g.add(rl); });
    for(let i=0;i<72;i++){ const a=i/72*6.283; const s=bx(.4,.1,2.4,0x6d4c41,Math.cos(a)*R,.12,Math.sin(a)*R,g); s.rotation.y=-a; }
    const hill=new THREE.Mesh(new THREE.CircleGeometry(R-3,40),mb(0x7cb342)); hill.rotation.x=-Math.PI/2; hill.position.y=.06; g.add(hill);
    for(let i=0;i<9;i++){ const a=i*.7, r=Math.random()*(R-9); cy(.2,.25,1.6,0x6d4c1d,Math.cos(a)*r,.8,Math.sin(a)*r,g,6); sp(0x43a047,1.1,Math.cos(a)*r,2.1,Math.sin(a)*r,g); }
    lab('🚂 ZOO-BAHN',9,2.2,0,5,0,g);
    // Bahnhöfe
    T.st=[]; SA.forEach((a,i)=>{ const sg=new THREE.Group(); const px=Math.cos(a)*(R-5.5), pz=Math.sin(a)*(R-5.5); sg.position.set(px,0,pz); sg.rotation.y=-a+Math.PI/2; g.add(sg); T.st.push({g:sg,x:C.x+px,z:C.z+pz,lvl:-1,flag:null}); });
    // Zug
    const tr=new THREE.Group(); const loco=new THREE.Group(); bx(2.2,1.4,4.2,0xc62828,0,1.1,0,loco); cy(.8,.8,2.6,0x212121,0,1.9,.9,loco,12).rotation.x=Math.PI/2; cy(.28,.34,1.1,0x212121,0,3.0,1.4,loco,8); bx(2.4,2.2,1.6,0x8e0000,0,2.1,-1.5,loco); bx(2.6,.2,1.9,0x37474f,0,3.3,-1.5,loco); [-1.2,1.2].forEach(x=>[-1.4,.2,1.5].forEach(z=>cy(.5,.5,.3,0x424242,x,.5,z,loco,10).rotation.z=Math.PI/2)); sp(0xffee58,.3,0,1.2,2.2,loco); tr.add(loco);
    T.wag=[]; [0xffa000,0x1976d2,0x43a047].forEach((c,i)=>{ const w=new THREE.Group(); bx(2.3,.4,4,0x455a64,0,.5,0,w); bx(2.3,1.4,3.8,c,0,1.4,0,w); bx(2.5,.2,4.1,0x37474f,0,2.2,0,w); [-1.2,1.2].forEach(x=>[-1.2,1.2].forEach(z=>cy(.45,.45,.3,0x424242,x,.45,z,w,10).rotation.z=Math.PI/2)); [-.7,.7].forEach(z=>spr('🧑',1.1,0,2.2,z,w)); g.add(w); T.wag.push(w); });
    g.add(loco); T.loco=loco; T.smoke=[]; ZG.scene.add(g); T.g=g; T.refreshStations(); }catch(e){ console.warn('ZTrain build',e); } };
  T.refreshStations=function(){ if(!T.g) return; const b=bahn();
    T.st.forEach((s,i)=>{ const l=b.s[i]; if(s.lvl===l) return; s.lvl=l; const g=s.g; while(g.children.length) g.remove(g.children[0]);
      bx(7,.5,3,l>=5?0xffd54f:0xcfc8b8,0,.25,0,g); if(l===0){ lab('🚉 Bahnhof '+(i+1)+' bauen',6,1.5,0,3,0,g); bx(.2,2.4,.2,0x8d6e63,0,1.4,0,g); return; }
      const roof=l>=5?0xffc107:(l>=3?0x1976d2:0xd32f2f); [-3,3].forEach(x=>bx(.25,3.2,.25,0xeeeeee,x,2,0,g)); bx(7.6,.3,3.6,roof,0,3.7,0,g); bx(7,.1,3.4,0xffffff,0,3.5,0,g);
      for(let k=0;k<l;k++) spr('⭐',.9,-2+k*1,4.5,0,g); bx(5,.8,.2,0x6d4c41,0,.9,1.1,g); if(l>=2){ cy(.05,.05,3,0xeeeeee,3.6,2.5,0,g,5); bx(1.1,.7,.05,0xe53935,4.1,3.8,0,g); } if(l>=3){ cy(.5,.5,.15,0xffffff,0,3.1,-1.7,g,16); } if(l>=4){ [-2.5,2.5].forEach(x=>{ cy(.3,.25,.5,0xa1887f,x,.75,-1.1,g,8); sp(0xff8fb1,.3,x,1.15,-1.1,g); }); }
      lab('Bahnhof '+(i+1)+' · Stufe '+l,5.4,1.1,0,5.4,0,g); }); };
  T.nearStation=function(){ const pl=ZG.pl; let b=-1,bd=9; T.st.forEach((s,i)=>{ const d=dist(pl,s); if(d<bd){ bd=d; b=i; } }); return b; };
  T.arrive=function(i){ const b=bahn(); const l=b.s[i]; if(l<=0) return; const z=zoo(); const rew=Math.round(tick()*(.4+.5*l)); z.mt=(z.mt||0)+rew; z.te=(z.te||0)+rew; hud(); const s=T.st[i]; const p=spr('🪙',1.6,s.x-C.x,3,s.z-C.z,T.g); T.pops=T.pops||[]; T.pops.push({p,t:0}); };
  T.open=function(i){ const b=bahn(), z=zoo(), l=b.s[i], max=5, c=T.cost(l);
    const o=modal('zb-ov','<div style="font-size:2.4rem">🚉</div><div style="font:900 1.2rem Arial;color:#ffd54f">Bahnhof '+(i+1)+'</div><div style="font-size:.85rem;line-height:1.45;margin:6px 0">Stufe <b>'+l+'/'+max+'</b>. Bei jeder Ankunft des Zuges steigen Fahrgäste aus und bringen dir Münzen.<br>Jetzt: <b style="color:#7dffb0">'+(l?price(Math.round(tick()*(.4+.5*l)))+' MT pro Halt':'noch kein Halt')+'</b>'+(l<max?'<br>Nächste Stufe: '+price(Math.round(tick()*(.4+.5*(l+1))))+' MT pro Halt':'')+'</div>'
      +(l<max?'<button id="zb-up" style="'+bs((z.mt||0)>=c?GREEN:GREY)+'">'+(l?'⬆️ Ausbauen':'🏗️ Bauen')+' – '+price(c)+' MT</button>':'<div style="color:#ffd54f;font-weight:900">⭐ Maximal ausgebaut!</div>')+'<button id="zb-x" style="'+bs(GLASS)+'">Schliessen</button>'); $('zb-x').onclick=()=>o.remove();
    const up=$('zb-up'); if(up) up.onclick=()=>{ const cc=T.cost(l); if((z.mt||0)<cc) return toast('❌ Zu wenig MT!'); z.mt-=cc; b.s[i]=l+1; hud(); save(); T.refreshStations(); try{ ZGfx.confetti(60); }catch(e){} toast('🚉 Bahnhof '+(i+1)+' → Stufe '+(l+1),2500); o.remove(); T.open(i); }; };
  T.board=function(){ if(T.riding) return T.leave(); T.riding=true; T.rideStart=T.th; T.rideTx=0; toast('🚂 Einsteigen bitte! Eine Runde Fahrt …',2500); };
  T.leave=function(){ if(!T.riding) return; T.riding=false; const bs_=bahn().s.filter(x=>x>0).length; const z=zoo(); const rew=Math.round(tick()*2*bs_); if(rew>0){ z.mt=(z.mt||0)+rew; z.te=(z.te||0)+rew; hud(); toast('🎟️ Fahrt beendet! Trinkgeld +'+price(rew)+' MT',3000); } else toast('🚂 Fahrt beendet.',2000); const p=T.pos(T.th-.45); ZG.pl.x=p.x*0+C.x+Math.cos(T.th-.2)*(R-9); ZG.pl.z=C.z+Math.sin(T.th-.2)*(R-9); ZG.pl.y=1.7; save(); };
  T.frame=function(dt,t){ if(!T.g) return; const on=Core.has(); T.g.visible=on; if(!on){ if(T.riding) T.riding=false; return; }
    // Geschwindigkeit: vor Bahnhöfen langsamer
    let near=9; SA.forEach(a=>{ let d=Math.abs(((T.th-a)%6.283+9.425)%6.283-3.1416); d=Math.abs(3.1416-d); near=Math.min(near,d); });
    const mult=near<.22?.28+near*2.5:1; const prev=T.th; T.th+=.27*mult*dt;
    SA.forEach((a,i)=>{ const pa=((prev-a)%6.283+6.283)%6.283, ca=((T.th-a)%6.283+6.283)%6.283; if(pa>6.0&&ca<.3&&!(pa<.3)) T.arrive(i); });
    const place=(o,th)=>{ const x=Math.cos(th)*R, z=Math.sin(th)*R; o.position.set(x,0,z); o.rotation.y=-th; };
    place(T.loco,T.th); T.wag.forEach((w,i)=>place(w,T.th-(i+1)*.135));
    // Rauch
    if(Math.random()<dt*6){ const lp=T.loco.position, th=T.th; const s=spr('☁️',1.1,lp.x,3.6,lp.z,T.g,.85); T.smoke.push({s,t:0}); }
    for(let i=T.smoke.length-1;i>=0;i--){ const s=T.smoke[i]; s.t+=dt; s.s.position.y+=dt*1.5; s.s.scale.setScalar(1.1+s.t*.9); s.s.material.opacity=Math.max(0,.85-s.t*.5); if(s.t>1.7){ T.g.remove(s.s); T.smoke.splice(i,1); } }
    for(let i=(T.pops||[]).length-1;i>=0;i--){ const q=T.pops[i]; q.t+=dt; q.p.position.y+=dt*2.2; q.p.material.opacity=Math.max(0,1-q.t/1.2); if(q.t>1.2){ T.g.remove(q.p); T.pops.splice(i,1); } }
    // Mitfahren
    if(T.riding){ const w=T.wag[0], th=T.th-.135; const x=C.x+Math.cos(th)*R, z=C.z+Math.sin(th)*R; const pl=ZG.pl; pl.x=x; pl.z=z; pl.y=2.6; const dx=-Math.sin(T.th), dz=Math.cos(T.th); const yaw=Math.atan2(-dx,-dz); let dy=yaw-ZG.yaw; dy=Math.atan2(Math.sin(dy),Math.cos(dy)); ZG.yaw+=dy*Math.min(1,dt*3); ZG.pitch=.08; try{ ZG.cam.position.set(x,2.6,z); }catch(e){} if(T.th-T.rideStart>6.28) T.leave(); } };

  // ═══════════ EI-BRÜTEREI ═══════════
  const H=window.ZHatch={g:null};
  const HP={x:-110,z:-110};
  const EGGS={meadow:{n:'Wiesen-Ei',ic:'🥚',tint:0xffffff,h:1,min:5000,mul:250,w:[['rare',40],['epic',45],['legendary',15]],d:'schlüpft in 1 Std.'},
              mountain:{n:'Berg-Ei',ic:'🥚',tint:0x9fd8ff,h:6,min:30000,mul:1500,w:[['epic',30],['legendary',55],['ultralegendary',15]],d:'schlüpft in 6 Std.'},
              star:{n:'Sternen-Ei',ic:'🥚',tint:0xe1a8ff,h:24,min:150000,mul:8000,w:[['legendary',30],['ultralegendary',50],['god',18],['mythic',2]],d:'schlüpft in 24 Std.'}};
  const RNm={rare:'Selten',epic:'Episch',legendary:'Legendär',ultralegendary:'Ultra',god:'Gott',mythic:'Mythisch'};
  const eg=()=>{ const r=r6(); let e=r.egg; if(!e) e=r.egg={inv:{meadow:0,mountain:0,star:0},slots:[null,null,null]}; return e; };
  H.cost=k=>Math.max(EGGS[k].min,Math.round(tick()*EGGS[k].mul));
  H.found=function(k,why){ if(!Core.has()) return; const e=eg(); e.inv[k]=(e.inv[k]||0)+1; save(); toast('🥚 Du hast ein '+EGGS[k].n+' gefunden'+(why?' ('+why+')':'')+'! Bring es zur Brüterei.',4000); };
  H.build=function(){ try{ if(H.g||!ZG.scene) return; const g=new THREE.Group(); g.position.set(HP.x,0,HP.z);
    const fl=new THREE.Mesh(new THREE.CircleGeometry(10,32),mb(0xd7ccc8)); fl.rotation.x=-Math.PI/2; fl.position.y=.08; g.add(fl);
    cy(8,8.6,.7,0x8d6e63,0,.35,0,g,24); bx(18,.4,.4,0x5d4037,0,.9,-8.3,g);
    // Häuschen im Hintergrund
    bx(10,5,4,0xfff3e0,0,2.5,-8,g); bx(11,.5,5,0xd84315,0,5.3,-8,g); const rf=bx(11,.4,5,0xbf360c,0,5.8,-8,g); rf.rotation.x=.12; bx(2,3,.2,0x6d4c41,0,1.5,-5.9,g);
    const sg=new THREE.Mesh(new THREE.PlaneGeometry(8,1.8),new THREE.MeshBasicMaterial({map:signTex('🥚 EI-BRÜTEREI',512,115,'#e65100','#fff',46),side:THREE.DoubleSide})); sg.position.set(0,7.6,-5.7); g.add(sg);
    // 3 Brut-Kuppeln
    H.pods=[]; [-4.2,0,4.2].forEach((x,i)=>{ cy(1.9,2.1,1.3,0x546e7a,x,1.35,0,g,16); const dome=new THREE.Mesh(new THREE.SphereGeometry(1.8,16,12,0,6.283,0,1.57),mb(0xbbe4ff,{transparent:true,opacity:.3,side:THREE.DoubleSide,depthWrite:false})); dome.position.set(x,2.0,0); dome.renderOrder=2; g.add(dome);
      const lamp=sp(0xff9800,.3,x,4.1,0,g); const egg=new THREE.Sprite(new THREE.SpriteMaterial({map:emo('🥚'),transparent:true,depthWrite:false})); egg.scale.set(2,2,1); egg.position.set(x,2.9,0); egg.renderOrder=4; egg.visible=false; g.add(egg); const tx=lab('',3.4,.9,x,5.1,0,g); tx.visible=false; H.pods.push({egg,tx,x,lamp}); });
    for(let i=0;i<6;i++){ const a=i*1.05+.4; bx(.9,.6,.9,0xa1887f,Math.cos(a)*7,.5,Math.sin(a)*7+1,g); spr(['🪺','🌾','🥚'][i%3],1.1,Math.cos(a)*7,1.4,Math.sin(a)*7+1,g); }
    ZG.scene.add(g); H.g=g; }catch(e){ console.warn('ZHatch build',e); } };
  H.fmt=ms=>{ const s=Math.max(0,Math.ceil(ms/1000)), h=Math.floor(s/3600), m=Math.floor(s%3600/60); return (h?h+' Std. ':'')+(m||!h?m+' Min.':'')+(h?'':' '+(s%60)+' Sek.'); };
  H.roll=function(k){ let t=Math.random()*100, r='rare'; for(const w of EGGS[k].w){ t-=w[1]; if(t<=0){ r=w[0]; break; } } return r; };
  H.hatch=function(i){ const z=zoo(), e=eg(), s=e.slots[i]; if(!s||s.until>Date.now()) return; const r=H.roll(s.k); let res=null; try{ res=ZTread.tAnimal(r); }catch(er){} if(!res) res='ein Tier ('+RNm[r]+')'; e.slots[i]=null; save(); hud(); try{ ZGfx.confetti(200); }catch(er){}
    const o=modal('zh-hatch','<div style="font-size:3rem;animation:zhPop 1s">🐣</div><div style="font:900 1.3rem Arial;color:#ffd54f">Es ist geschlüpft!</div><div style="margin:10px 0">Aus dem '+EGGS[s.k].n+' ist<br><b style="font-size:1.25rem">'+res+'</b><br>geschlüpft ('+RNm[r]+').</div><button id="zh-hx" style="'+bs(GREEN)+'">Juhu!</button>'); $('zh-hx').onclick=()=>{ o.remove(); H.open(); }; };
  H.open=function(){ const z=zoo(), e=eg(), now=Date.now();
    const inv=Object.keys(EGGS).map(k=>'<div style="background:rgba(255,255,255,.08);border-radius:12px;padding:8px;margin-top:6px;text-align:left"><div style="font-size:.88rem"><span style="font-size:1.3rem">🥚</span> <b>'+EGGS[k].n+'</b> · im Beutel: <b>'+e.inv[k]+'</b><br><span style="font-size:.74rem;opacity:.8">'+EGGS[k].d+' · '+EGGS[k].w.map(w=>RNm[w[0]]+' '+w[1]+'%').join(', ')+'</span></div><div style="display:flex;gap:6px"><button data-b="'+k+'" style="'+bs((z.mt||0)>=H.cost(k)?'#1976d2':GREY)+'">Kaufen '+price(H.cost(k))+'</button><button data-p="'+k+'" style="'+bs(e.inv[k]>0?GREEN:GREY)+'">Einlegen</button></div></div>').join('');
    const slots=e.slots.map((s,i)=>{ if(!s) return '<div style="flex:1;background:rgba(255,255,255,.07);border-radius:12px;padding:8px;font-size:.78rem;opacity:.7">Platz '+(i+1)+'<br>leer</div>'; const rdy=s.until<=now, pct=rdy?100:Math.round((1-(s.until-now)/(EGGS[s.k].h*3600000))*100);
      return '<div style="flex:1;background:rgba(255,255,255,.12);border-radius:12px;padding:8px;font-size:.78rem"><div style="font-size:1.6rem">'+(rdy?'🐣':'🥚')+'</div>'+EGGS[s.k].n+'<div style="height:6px;border-radius:4px;background:rgba(255,255,255,.2);margin:4px 0"><div style="height:100%;width:'+pct+'%;border-radius:4px;background:#7dffb0"></div></div>'+(rdy?'<button data-h="'+i+'" style="'+bs(GREEN)+';padding:6px">Schlüpfen!</button>':H.fmt(s.until-now))+'</div>'; }).join('');
    const o=modal('zh-ov','<div style="font-size:2.2rem">🥚</div><div style="font:900 1.2rem Arial;color:#ffd54f">Ei-Brüterei</div><div style="font-size:.8rem;opacity:.9;margin:4px 0">Lege Eier in die Brut-Kuppeln. Es dauert eine Weile (auch wenn du nicht im Spiel bist). Dann schlüpft ein Tier. Eier findest du auch in der Arena, auf der Schatz-Insel und im Legenden-Turm.</div><div style="display:flex;gap:6px;margin:8px 0">'+slots+'</div>'+inv+'<button id="zh-x" style="'+bs(GLASS)+'">Schliessen</button>'); $('zh-x').onclick=()=>o.remove();
    o.querySelectorAll('button[data-b]').forEach(b=>b.onclick=()=>{ const k=b.dataset.b, c=H.cost(k); if((z.mt||0)<c) return toast('❌ Zu wenig MT!'); z.mt-=c; e.inv[k]++; hud(); save(); toast('🥚 '+EGGS[k].n+' gekauft',1800); H.open(); });
    o.querySelectorAll('button[data-p]').forEach(b=>b.onclick=()=>{ const k=b.dataset.p; if(e.inv[k]<=0) return toast('Du hast kein '+EGGS[k].n+'.'); const i=e.slots.findIndex(s=>!s); if(i<0) return toast('Alle 3 Plätze sind belegt.'); e.inv[k]--; e.slots[i]={k,until:Date.now()+EGGS[k].h*3600000}; save(); toast('🥚 Ei liegt in der Kuppel '+(i+1)+'!',2000); H.open(); });
    o.querySelectorAll('button[data-h]').forEach(b=>b.onclick=()=>{ o.remove(); H.hatch(+b.dataset.h); }); };
  H.frame=function(dt,t){ if(!H.g) return; const on=Core.has(); H.g.visible=on; if(!on) return; const e=eg(), now=Date.now(); H.pods.forEach((p,i)=>{ const s=e.slots[i]; if(!s){ p.egg.visible=false; p.tx.visible=false; p.lamp.visible=false; return; } p.egg.visible=true; p.lamp.visible=true; p.egg.material.color.setHex(EGGS[s.k].tint); const rdy=s.until<=now; p.egg.position.y=2.9+(rdy?Math.abs(Math.sin(t*8))*.35:Math.sin(t*2+i)*.05); p.egg.material.rotation=rdy?Math.sin(t*14)*.25:0; p.lamp.material.opacity=.6+Math.sin(t*3)*.4;
      const key=rdy?'ready':Math.ceil((s.until-now)/60000); if(p._k!==key){ p._k=key; p.tx.visible=true; const tex=ZG._txt(rdy?'🐣 fertig!':'⏳ '+H.fmt(s.until-now),.5,rdy?'#7dffb0':'#fff'); p.tx.material.map=tex.material.map; p.tx.material.needsUpdate=true; } }); };

  // ═══════════ Hub, Karte, UI ═══════════
  Core.addFeature({id:'train',ic:'🚂',name:'Zoo-Bahn',desc:'Eisenbahn mit 4 Bahnhöfen – bei jedem Halt Münzen. Steig ein und fahr mit!',go:()=>{ const s=secO(); s.train=1; Core.goto(C.x,C.z-R+8); }});
  Core.addFeature({id:'egg',ic:'🥚',name:'Ei-Brüterei',desc:'Eier ausbrüten – heraus kommen seltene Tiere',go:()=>{ const s=secO(); s.egg=1; Core.goto(HP.x,HP.z+14); }});
  const PL2=[{k:'train',ic:'🚂',n:'Zoo-Bahn',p:C,h:'Im Süden, weit hinter dem Zoo-Ring, fährt ein kleiner Zug im Kreis.'},{k:'egg',ic:'🥚',n:'Ei-Brüterei',p:HP,h:'Im Nordwesten steht ein Häuschen mit warmen Lampen und Eiern.'}];
  const prev=Core.mapExtra; Core.mapExtra=function(){ try{ if(prev) prev(); }catch(e){} if(!Core.has()) return; const c=$('zmap-c'); if(!c) return; const g=c.getContext('2d'), S=c.width, WRr=(ZG.WR||335), k=S/2/(WRr+10), X=x=>S/2+x*k, Y=y=>S/2+y*k, s=secO(); const hints=[];
    PL2.forEach(pl=>{ g.textAlign='center'; g.textBaseline='middle'; if(s[pl.k]){ g.font='32px serif'; g.fillStyle='#000'; g.fillText(pl.ic,X(pl.p.x),Y(pl.p.z)); hints.push(pl.ic+' <b>'+pl.n+'</b> – entdeckt.'); } else { g.fillStyle='rgba(120,80,30,.3)'; g.beginPath(); g.arc(X(pl.p.x+14),Y(pl.p.z-10),50*k+16,0,6.283); g.fill(); g.font='30px serif'; g.fillStyle='#000'; g.fillText('❓',X(pl.p.x+14),Y(pl.p.z-10)); hints.push('❓ '+pl.h); } });
    const h=$('zmap-h'); if(h) h.insertAdjacentHTML('beforeend',hints.map(x=>'<div style="margin:2px 0">'+x+'</div>').join('')); };
  const show=(id,v)=>{ const e=$(id); if(e) e.style.display=v?'block':'none'; };
  const ui=()=>{ nbtn('zb-btn','🚉 Bahnhof','background:linear-gradient(135deg,#ef5350,#b71c1c);color:#fff').onclick=function(){ if(this._i>=0) T.open(this._i); };
    { const rb=nbtn('zb-ride','🚂 Einsteigen','background:linear-gradient(135deg,#ffb300,#e65100);color:#fff'); rb.style.bottom='300px'; rb.onclick=()=>T.board(); }
    nbtn('zh-btn2','🥚 Brüterei','background:linear-gradient(135deg,#ffa726,#e65100);color:#fff').onclick=()=>H.open(); };
  let last=performance.now(), upT=0;
  const frame=()=>{ const now=performance.now(), dt=Math.min(.1,(now-last)/1000); last=now; try{ T.frame(dt,now/1000); H.frame(dt,now/1000); }catch(e){}
    upT+=dt; if(upT<.3) return; upT=0; try{ const has=Core.has(), pl=ZG.pl, rd=riding()||ZG._liftActive||ZG._jumpActive||ZG._arcadeActive; const ok=has&&!rd;
      const si=ok&&!T.riding?T.nearStation():-1; const b=$('zb-btn'); if(b){ b._i=si; if(si>=0){ b.textContent=bahn().s[si]?'🚉 Bahnhof '+(si+1)+' ausbauen':'🏗️ Bahnhof '+(si+1)+' bauen'; } } show('zb-btn',si>=0);
      const rb=$('zb-ride'); if(rb){ rb.textContent=T.riding?'🚪 Aussteigen':'🚂 Einsteigen'; } show('zb-ride',ok&&(T.riding||si>=0)); const bb=$('zb-btn'); if(bb&&T.riding) bb.style.display='none';
      show('zh-btn2',ok&&!T.riding&&dist(pl,HP)<14);
      if(has){ const s=secO(); let ch=0; PL2.forEach(p=>{ if(!s[p.k]&&dist(pl,p.p)<40){ s[p.k]=1; ch=1; toast('🗺️ Neuer Ort auf der Karte: '+p.n+'!',3500); } }); if(ch) save(); } }catch(e){} };
  const boot=()=>{ try{ if(typeof ZG==='undefined'||!ZG.scene||!ZG.renderer||!ZG.cam||!zoo()) return setTimeout(boot,1000); ui(); T.build(); H.build(); const r=ZG.renderer, o=r.render.bind(r); r.render=function(s,c){ if(s===ZG.scene){ try{ frame(); }catch(e){} } return o(s,c); }; }catch(e){ console.warn('ZFun boot',e); setTimeout(boot,1500); } };
  window.ZFun={T,H,C,HP,EGGS}; setTimeout(boot,2800);
  }
  wait();
})();
