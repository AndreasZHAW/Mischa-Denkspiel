/* ═══ ZLegend (v768): Tier-Arena, Schatz-Insel mit Boot, Legenden-Turm, Karten-Erweiterung (Rebirth 6) ═══ */
(function(){
  'use strict';
  if(window.ZArena) return;
  const boot0=()=>{ if(!window.ZReb6||!ZReb6.U) return setTimeout(boot0,300); init(); };
  function init(){
  const Core=ZReb6, U=Core.U, {$,mb,bx,cy,sp,cv,emo,signTex,price,zoo,toast,dist,save,hud,day,hash,modal,bs,GREEN,GREY,GLASS,nbtn}=U;
  const rnd=(a,b)=>a+Math.random()*(b-a);
  const secO=()=>{ const z=zoo(); if(!z) return {}; return z.sec||(z.sec={}); };
  const paper=k=>{ try{ ZPaper.add(k,1); }catch(e){} };
  const RO=['normal','rare','epic','legendary','ultralegendary','god','mythic','secret','eternal'];
  const RN={normal:'Normal',rare:'Selten',epic:'Episch',legendary:'Legendär',ultralegendary:'Ultra',god:'Gott',mythic:'Mythisch',secret:'Secret',eternal:'Eternel'};
  const riding=()=>!!(window.ZStation&&ZStation.riding);
  const Pl=()=>ZG.pl;
  const PL={arena:{x:130,z:-140},tower:{x:170,z:110},isl:{x:-160,z:115}};
  const label=(txt,w,h,x,y,z,g)=>{ const l=ZG._txt(txt,.5,'#fff'); l.scale.set(w,h,1); l.position.set(x,y,z); g.add(l); return l; };

  // ═══════════ TIER-ARENA ═══════════
  const A=window.ZArena={g:null};
  A.st=function(){ const r=Core.r6(); let a=r.ar; if(!a) a=r.ar={f:0,w:0,d:'',n:0,s:0}; if(a.d!==day()){ a.d=day(); a.n=0; } return a; };
  A.title=function(f){ return f>=50?'🏆 Legende':f>=20?'🥇 Champion':f>=5?'🥈 Kämpfer':'🥉 Neuling'; };
  A.build=function(){ try{ if(A.g||!ZG.scene) return; const g=new THREE.Group(); g.position.set(PL.arena.x,0,PL.arena.z);
    const fl=new THREE.Mesh(new THREE.CircleGeometry(14,40),mb(0xe6c88f)); fl.rotation.x=-Math.PI/2; fl.position.y=.1; g.add(fl); const rg=new THREE.Mesh(new THREE.RingGeometry(5,5.6,40),mb(0xb71c1c)); rg.rotation.x=-Math.PI/2; rg.position.y=.13; g.add(rg);
    for(let row=0;row<3;row++){ const R=16+row*2.6, h=1.0+row*1.0; for(let i=0;i<28;i++){ const a=i/28*6.283; if(Math.abs(Math.atan2(Math.sin(a-1.5708),Math.cos(a-1.5708)))<.34) continue; const b=bx(4.6,h,2.4,[0x8d6e63,0x6d4c41,0x5d4037][row],Math.cos(a)*R,h/2,Math.sin(a)*R,g); b.rotation.y=-a+Math.PI/2; } }
    const faces=['👏','🙌','🎉','😮','📣','🐾']; for(let i=0;i<26;i++){ const a=rnd(0,6.283), row=i%3, R=16+row*2.6; if(Math.abs(Math.atan2(Math.sin(a-1.5708),Math.cos(a-1.5708)))<.4) continue; const s=new THREE.Sprite(new THREE.SpriteMaterial({map:emo(faces[i%faces.length]),transparent:true})); s.scale.set(1.3,1.3,1); s.position.set(Math.cos(a)*R,1.2+row*1.0+.9,Math.sin(a)*R); g.add(s); }
    [-1,1].forEach(s=>{ cy(.2,.2,6,0x9e9e9e,s*4,3,17.6,g,6); bx(2.2,3,.1,s<0?0xd32f2f:0x1976d2,s*4,4.2,17.6,g); });
    const sg=new THREE.Mesh(new THREE.PlaneGeometry(9,2.2),new THREE.MeshBasicMaterial({map:signTex('⚔️ TIER-ARENA',512,126,'#b71c1c','#fff',50),side:THREE.DoubleSide})); sg.position.set(0,8,17.6); g.add(sg); cy(.25,.25,8,0x9e9e9e,-4.6,4,17.6,g,6); cy(.25,.25,8,0x9e9e9e,4.6,4,17.6,g,6);
    label('⚔️ Tier-Arena',9,2.2,0,11,17.6,g);
    ZG.scene.add(g); A.g=g; }catch(e){ console.warn('ZArena',e); } };
  A.pool=function(){ const z=zoo(); return (z&&z.enc||[]).map((e,i)=>e&&e.animal?{i,a:e.animal}:null).filter(Boolean).sort((x,y)=>RO.indexOf(y.a.r)-RO.indexOf(x.a.r)); };
  A.open=function(){ const z=zoo(); const st=A.st(); const left=10-st.n; const list=A.pool();
    const rows=list.slice(0,10).map(p=>'<button data-i="'+p.i+'" style="'+bs((left>0)?GREEN:GREY)+';text-align:left">'+p.a.e+' '+p.a.n+' <span style="opacity:.8;font-size:.75rem">· '+RN[p.a.r]+'</span></button>').join('')||'<div style="margin:10px 0;opacity:.8">Du hast noch kein Tier im Gehege.</div>';
    const o=modal('za-ov','<div style="font:900 1.2rem Arial;color:#ffd54f">⚔️ Tier-Arena</div><div style="font-size:.8rem;margin:4px 0">Ruhm: <b>'+st.f+'</b> · '+A.title(st.f)+' · Siege: '+st.w+' · Serie: '+st.s+'<br>Heutige Kämpfe: '+st.n+'/10</div><div style="font-size:.78rem;opacity:.85;margin-bottom:4px">Wähle ein Tier für den Kampf:</div>'+rows+'<button id="za-x" style="'+bs(GLASS)+'">Schliessen</button>');
    $('za-x').onclick=()=>o.remove(); o.querySelectorAll('button[data-i]').forEach(b=>b.onclick=()=>{ if(left<=0) return toast('Heute keine Kämpfe mehr – morgen wieder!'); const p=list.find(x=>x.i==b.dataset.i); A.start(p.a); }); };
  A.stat=function(a,m){ const i=Math.max(0,RO.indexOf(a.r)); return {hp:Math.round((90+i*45)*m),atk:Math.round((11+i*5.5)*m)}; };
  A.start=function(a){ const st=A.st(); st.n++; const i=Math.max(0,RO.indexOf(a.r)); let pool=[]; try{ pool=ANIMALS.filter(x=>Math.abs(RO.indexOf(x.r)-i)<=1); }catch(e){} const en=pool.length?pool[Math.floor(Math.random()*pool.length)]:{e:'🐗',n:'Wildschwein',r:a.r};
    const m=Math.min(1.5,.85+.08*st.s+Math.random()*.15), me=A.stat(a,1), em=A.stat(en,m);
    A.F={me:{a,hp:me.hp,max:me.hp,atk:me.atk},en:{a:en,hp:em.hp,max:em.hp,atk:em.atk},blk:false,cd:0,log:'Der Kampf beginnt!',over:0}; save(); A.render(); };
  A.hit=(atk,k)=>Math.max(1,Math.round(atk*k*rnd(.85,1.15)));
  A.act=function(kind){ const F=A.F; if(!F||F.over) return; let log='';
    if(kind==='atk'){ const d=A.hit(F.me.atk,1); F.en.hp-=d; log='Du triffst für '+d+'. '; }
    else if(kind==='blk'){ F.blk=true; const h=Math.round(F.me.max*.08); F.me.hp=Math.min(F.me.max,F.me.hp+h); log='Du blockst und heilst '+h+'. '; }
    else if(kind==='spe'){ if(F.cd>0) return; F.cd=3; if(Math.random()<.25) log='Spezial daneben! '; else { const d=A.hit(F.me.atk,2.1); F.en.hp-=d; log='SPEZIAL! '+d+' Schaden. '; } }
    if(F.cd>0&&kind!=='spe') F.cd--;
    if(F.en.hp<=0){ F.en.hp=0; return A.end(true,log); }
    if(Math.random()<.7){ let d=A.hit(F.en.atk,1); if(F.blk) d=Math.round(d/2); F.me.hp-=d; log+='Gegner trifft '+d+'.'; } else if(Math.random()<.3){ log+='Gegner verfehlt!'; } else { let d=A.hit(F.en.atk,1.7); if(F.blk) d=Math.round(d/2); F.me.hp-=d; log+='Gegner-Spezial '+d+'!'; }
    F.blk=false; if(F.me.hp<=0){ F.me.hp=0; return A.end(false,log); } F.log=log; A.render(); };
  A.end=function(win,log){ const F=A.F, st=A.st(); F.over=win?1:2; let msg; if(win&&Math.random()<.2&&window.ZHatch) try{ ZHatch.found('meadow','Arena'); }catch(e){}
    if(win){ const rew=Math.max(2000,Math.round(Core.tick()*150*(1+Math.min(st.s,5)*.3))); const z=zoo(); z.mt=(z.mt||0)+rew; z.te=(z.te||0)+rew; st.f++; st.w++; st.s++; paper('arena'); hud(); msg='🏆 Sieg! +1 Ruhm, +'+price(rew)+' MT'; try{ ZGfx.confetti(100); }catch(e){} }
    else { st.s=0; msg='💀 Niederlage. Deine Serie ist weg – versuch es nochmal!'; } F.log=log+'<br><b>'+msg+'</b>'; save(); A.render(); };
  A.render=function(){ const F=A.F; if(!F) return; const bar=(c,m,col)=>'<div style="height:10px;border-radius:6px;background:rgba(255,255,255,.18);margin-top:3px"><div style="height:100%;border-radius:6px;width:'+Math.max(0,Math.round(c/m*100))+'%;background:'+col+'"></div></div>';
    const side=(s,t,col)=>'<div style="flex:1"><div style="font-size:2.6rem">'+s.a.e+'</div><div style="font-size:.78rem;font-weight:900">'+s.a.n+'</div><div style="font-size:.7rem;opacity:.8">'+t+' · ❤️ '+Math.max(0,s.hp)+'/'+s.max+' · ⚔️ '+s.atk+'</div>'+bar(s.hp,s.max,col)+'</div>';
    const btns=F.over?('<button id="za-back" style="'+bs(GREEN)+'">Zurück zur Auswahl</button>'):('<button data-k="atk" style="'+bs(GREEN)+'">🗡️ Angriff</button><button data-k="blk" style="'+bs('#1976d2')+'">🛡️ Block (heilt etwas)</button><button data-k="spe" style="'+bs(F.cd>0?GREY:'#c62828')+'">💥 Spezial '+(F.cd>0?'(noch '+F.cd+')':'(stark, kann verfehlen)')+'</button>');
    const o=modal('za-ov','<div style="font:900 1.1rem Arial;color:#ffd54f">⚔️ Kampf</div><div style="display:flex;gap:10px;align-items:flex-start;margin:8px 0">'+side(F.me,'Du','#7dffb0')+'<div style="align-self:center;font-size:1.4rem">VS</div>'+side(F.en,'Gegner','#ff8a80')+'</div><div id="za-log" style="font-size:.8rem;min-height:36px;line-height:1.35;margin:6px 0">'+F.log+'</div>'+btns+'<button id="za-x" style="'+bs(GLASS)+'">Schliessen</button>');
    $('za-x').onclick=()=>o.remove(); const bk=$('za-back'); if(bk) bk.onclick=()=>A.open(); o.querySelectorAll('button[data-k]').forEach(b=>b.onclick=()=>A.act(b.dataset.k)); };

  // ═══════════ SCHATZ-INSEL ═══════════
  const I=window.ZIsland={g:null,boat:null,at:'dock',sail:null,safe:null};
  const IC=PL.isl, WR_=46, IR=20, u={x:.935,z:-.354};
  const P=(r)=>({x:IC.x+u.x*r,z:IC.z+u.z*r});
  const dockBase=P(WR_+3), dockEnd=P(WR_-7), boatDock=P(WR_-9), boatIsl=P(IR+3);
  const SPOTS=[0.4,1.7,3.0,4.6,5.5].map((a,i)=>({x:IC.x+Math.cos(a)*(11+i%2*2),z:IC.z+Math.sin(a)*(11+i%2*2)}));
  const BOSS={x:IC.x-4,z:IC.z+3};
  I.build=function(){ try{ if(I.g||!ZG.scene) return; const g=new THREE.Group();
    const w=new THREE.Mesh(new THREE.CircleGeometry(WR_,48),mb(0x2196f3)); w.rotation.x=-Math.PI/2; w.position.set(IC.x,.16,IC.z); g.add(w); const w2=new THREE.Mesh(new THREE.RingGeometry(WR_-4,WR_,48),mb(0x64b5f6)); w2.rotation.x=-Math.PI/2; w2.position.set(IC.x,.17,IC.z); g.add(w2);
    const sd=new THREE.Mesh(new THREE.CircleGeometry(IR,36),mb(0xf1d58a)); sd.rotation.x=-Math.PI/2; sd.position.set(IC.x,.22,IC.z); g.add(sd); const gr=new THREE.Mesh(new THREE.CircleGeometry(IR-5,30),mb(0x7cb342)); gr.rotation.x=-Math.PI/2; gr.position.set(IC.x,.24,IC.z); g.add(gr);
    for(let i=0;i<6;i++){ const a=i/6*6.283+.3, r=IR-7; const x=IC.x+Math.cos(a)*r, z=IC.z+Math.sin(a)*r; cy(.25,.35,5,0x8d6e63,x,2.5,z,g,6).rotation.z=.15; for(let k=0;k<5;k++){ const l=bx(3.2,.12,.8,0x2e7d32,x+Math.cos(k*1.26)*1.5,5.1,z+Math.sin(k*1.26)*1.5,g); l.rotation.y=-k*1.26; l.rotation.z=.25; } }
    // Dock
    const dl=Math.hypot(dockBase.x-dockEnd.x,dockBase.z-dockEnd.z), da=Math.atan2(dockEnd.x-dockBase.x,dockEnd.z-dockBase.z); const dk=bx(3,.3,dl,0x8d6e63,(dockBase.x+dockEnd.x)/2,.5,(dockBase.z+dockEnd.z)/2,g); dk.rotation.y=da; for(let i=0;i<=4;i++){ const q=P(WR_+3-i*(dl/4)); cy(.15,.15,1.4,0x5d4037,q.x+1.3,.7,q.z,g,6); cy(.15,.15,1.4,0x5d4037,q.x-1.3,.7,q.z,g,6); }
    label('🏝️ Schatz-Insel',7,1.8,dockBase.x,5,dockBase.z,g);
    // Spots
    SPOTS.forEach((p,i)=>{ const m=new THREE.Mesh(new THREE.SphereGeometry(1,8,6),mb(0x7a5230)); m.scale.y=.3; m.position.set(p.x,.4,p.z); g.add(m); label('❌',1.4,1.4,p.x,1.4,p.z,g); });
    // Boss-Truhe
    const bc=new THREE.Group(); bc.position.set(BOSS.x,0,BOSS.z); bx(3,1.4,2,0x6d4c1d,0,1,0,bc); bx(3.1,.5,2.1,0xffc107,0,1.9,0,bc); bx(.5,.7,.1,0xffeb3b,0,1.3,1.05,bc); bx(3.2,.2,.3,0xffc107,0,1.15,.9,bc); label('🧰 Boss-Truhe',4,1.1,0,3.6,0,bc); g.add(bc); I.chest=bc;
    // Boot
    const bt=new THREE.Group(); bx(5,.9,2.2,0x8d6e63,0,.7,0,bt); bx(1.6,.9,2.0,0x6d4c41,2.6,1.0,0,bt); bx(1.6,.9,2.0,0x6d4c41,-2.6,1.0,0,bt); cy(.1,.1,5,0x5d4037,0,3.4,0,bt,6); const sl=new THREE.Mesh(new THREE.PlaneGeometry(3.4,3.6),new THREE.MeshBasicMaterial({color:0xfafafa,side:THREE.DoubleSide})); sl.position.set(0,3.4,0); sl.rotation.y=Math.PI/2; bt.add(sl); bx(.1,.8,.1,0xd32f2f,0,5.7,0,bt); label('⛵ Boot',2.6,.8,0,6.6,0,bt);
    bt.position.set(boatDock.x,.2,boatDock.z); bt.rotation.y=Math.atan2(boatIsl.x-boatDock.x,boatIsl.z-boatDock.z)+Math.PI/2; g.add(bt); I.boat=bt;
    ZG.scene.add(g); I.g=g; }catch(e){ console.warn('ZIsland',e); } };
  I.bpos=()=>I.at==='dock'?boatDock:boatIsl;
  I.onIsland=()=>dist(Pl(),IC)<=IR+1;
  I.go=function(){ if(I.sail) return; const pl=Pl(); const A_=I.at==='dock'?{x:pl.x,z:pl.z}:{x:pl.x,z:pl.z}; const to=I.at==='dock'?P(IR-2):dockEnd; const tb=I.at==='dock'?boatIsl:boatDock; I.sail={t:0,dur:5,a:{x:pl.x,z:pl.z},b:{x:to.x,z:to.z},ba:{x:I.bpos().x,z:I.bpos().z},bb:{x:tb.x,z:tb.z},dest:I.at==='dock'?'isl':'dock'}; paper('boat'); };
  I.frame=function(dt,t){ if(!I.boat) return; const pl=Pl(); const bp=I.bpos();
    if(I.sail){ const s=I.sail; s.t+=dt; const k=Math.min(1,s.t/s.dur), e=k*k*(3-2*k); pl.x=s.a.x+(s.b.x-s.a.x)*e; pl.z=s.a.z+(s.b.z-s.a.z)*e; pl.y=.6; I.boat.position.x=s.ba.x+(s.bb.x-s.ba.x)*e; I.boat.position.z=s.ba.z+(s.bb.z-s.ba.z)*e; I.boat.position.y=.2+Math.sin(t*3)*.12; I.boat.rotation.z=Math.sin(t*2.4)*.05;
      if(k>=1){ I.at=s.dest; I.sail=null; pl.y=0; I.safe={x:pl.x,z:pl.z}; if(I.at==='isl'){ const so=secO(); if(!so.isl){ so.isl=1; save(); toast('🗺️ Neuer Ort auf der Karte: Schatz-Insel!',3500); } } } return; }
    I.boat.position.set(bp.x,.2+Math.sin(t*2)*.08,bp.z);
    // Wasser-Sperre (nur mit Boot erreichbar)
    const r=dist(pl,IC); const d=distSeg(pl,dockBase,dockEnd); if(r<WR_&&r>IR&&d>3.2&&!riding()){ if(I.safe){ pl.x=I.safe.x; pl.z=I.safe.z; } } else I.safe={x:pl.x,z:pl.z}; };
  const distSeg=(p,a,b)=>{ const vx=b.x-a.x, vz=b.z-a.z, l2=vx*vx+vz*vz; let t=((p.x-a.x)*vx+(p.z-a.z)*vz)/l2; t=Math.max(0,Math.min(1,t)); return Math.hypot(p.x-(a.x+vx*t),p.z-(a.z+vz*t)); };
  const IS=()=>{ const r=Core.r6(); return r.isl||(r.isl={t:{},b:''}); };
  I.dig=function(){ const pl=Pl(), i=SPOTS.findIndex(p=>dist(pl,p)<4); if(i<0) return; const s=IS(); if((s.t[i]||0)>Date.now()) return toast('🕳️ Hier hast du schon gegraben – komm später wieder.',2500); s.t[i]=Date.now()+12*3600000; if(Math.random()<.15&&window.ZHatch) try{ ZHatch.found('mountain','Schatz-Insel'); }catch(e){} const rew=Math.max(800,Math.round(Core.tick()*120)); const z=zoo(); z.mt=(z.mt||0)+rew; z.te=(z.te||0)+rew; hud(); save(); try{ ZGfx.confetti(100); }catch(e){} toast('⛏️ Schatz gefunden! +'+price(rew)+' MT',3500); };
  const RID=[['Ich habe Städte, aber keine Häuser, Berge ohne Bäume und Wasser ohne Fische. Was bin ich?','Eine Karte',['Ein Traum','Der Zoo']],['Je mehr du davon nimmst, desto mehr lässt du zurück. Was ist es?','Schritte',['Geld','Zeit']],['Was wird nasser, je mehr es trocknet?','Ein Handtuch',['Eine Wolke','Ein Fisch']],['Was hat einen Hals, aber keinen Kopf?','Eine Flasche',['Ein Pinguin','Ein Hemd']],['Was kann man brechen, ohne es zu berühren?','Ein Versprechen',['Ein Glas','Eis']],['Ich bin leichter als eine Feder, doch kein Mensch kann mich lange halten. Was bin ich?','Der Atem',['Ein Stein','Wasser']]];
  I.boss=function(){ const s=IS(); if(s.b===day()) return toast('🧰 Die Boss-Truhe ist heute schon geöffnet (oder verschlossen). Morgen wieder!',3500); const q=RID[hash(day()+'|'+(ZS.player||''))%RID.length]; const opts=[q[1]].concat(q[2]).map(t=>({t,ok:t===q[1]})).sort(()=>Math.random()-.5);
    const o=modal('zi-ov','<div style="font-size:2.4rem">🧰</div><div style="font:900 1.1rem Arial;color:#ffd54f">Boss-Truhe</div><div style="font-size:.85rem;line-height:1.4;margin:8px 0">Löse das Rätsel! Du hast <b>einen</b> Versuch pro Tag.</div><div style="font-size:.9rem;font-style:italic;margin-bottom:6px">„'+q[0]+'“</div>'+opts.map((x,i)=>'<button data-o="'+i+'" style="'+bs('#1976d2')+'">'+x.t+'</button>').join('')+'<button id="zi-x" style="'+bs(GLASS)+'">Später</button>');
    $('zi-x').onclick=()=>o.remove(); o.querySelectorAll('button[data-o]').forEach(b=>b.onclick=()=>{ s.b=day(); const ok=opts[+b.dataset.o].ok; if(ok){ const rew=Math.max(20000,Math.round(Core.tick()*1500)); const z=zoo(); z.mt=(z.mt||0)+rew; z.te=(z.te||0)+rew; Core.setBoost(2,5); hud(); try{ ZGfx.confetti(220); }catch(e){} o.remove(); modal('zi-ov','<div style="font-size:3rem">🎉</div><div style="font:900 1.2rem Arial;color:#ffd54f">Richtig!</div><div style="margin:8px 0">Die Truhe springt auf:<br><b>+'+price(rew)+' MT</b> und Geld-Boost ×2 für 5 Minuten!</div><button onclick="this.closest(\'#zi-ov\').remove()" style="'+bs(GREEN)+'">Juhu!</button>'); }
      else { o.remove(); modal('zi-ov','<div style="font-size:3rem">🔒</div><div style="font:900 1.1rem Arial">Falsch!</div><div style="margin:8px 0;font-size:.85rem">Die richtige Antwort war: <b>'+q[1]+'</b>.<br>Die Truhe bleibt heute zu – morgen gibt es ein neues Rätsel.</div><button onclick="this.closest(\'#zi-ov\').remove()" style="'+bs(GLASS)+'">OK</button>'); } save(); }); };

  // ═══════════ LEGENDEN-TURM ═══════════
  const T=window.ZTower={g:null};
  T.st=function(){ const r=Core.r6(); let t=r.tw; if(!t) t=r.tw={d:'',used:0,f:0,cl:[],top:0,best:0}; if(t.d!==day()){ t.d=day(); t.used=0; t.f=0; t.cl=[]; } return t; };
  T.build=function(){ try{ if(T.g||!ZG.scene) return; const g=new THREE.Group(); g.position.set(PL.tower.x,0,PL.tower.z);
    cy(7,7.6,3,0x5d4e7a,0,1.5,0,g,20); cy(4.6,5.2,38,0xb0a8c0,0,22,0,g,18);
    for(let i=0;i<6;i++) cy(4.9,4.9,.6,0x7e57c2,0,6+i*6.5,0,g,18);
    for(let i=0;i<14;i++){ const a=i*.9, y=8+(i%7)*5; const wx=Math.cos(a)*4.7, wz=Math.sin(a)*4.7; const w=bx(.5,1.6,.9,0x1a1030,wx,y,wz,g); w.rotation.y=-a+Math.PI/2; }
    cy(5.8,5.8,.8,0x7e57c2,0,41.5,0,g,18); const cone=new THREE.Mesh(new THREE.ConeGeometry(5.6,9,18),mb(0x7e57c2)); cone.position.y=46.5; g.add(cone); sp(0xffc107,.9,0,51.5,0,g);
    const fire=new THREE.Sprite(new THREE.SpriteMaterial({map:emo('🔥'),transparent:true})); fire.scale.set(4,4,1); fire.position.set(0,54,0); g.add(fire); T.fire=fire;
    bx(2.4,3.4,.4,0x3e2723,0,1.7,5.4,g); const sg=new THREE.Mesh(new THREE.PlaneGeometry(8,1.8),new THREE.MeshBasicMaterial({map:signTex('🗼 LEGENDEN-TURM',512,115,'#4527a0','#ffd54f',46),side:THREE.DoubleSide})); sg.position.set(0,5.6,5.6); g.add(sg);
    label('🗼 50 Stockwerke',9,2,0,58,0,g);
    ZG.scene.add(g); T.g=g; }catch(e){ console.warn('ZTower',e); } };
  const MS=[[10,300],[20,800],[30,2000],[40,5000],[50,12000]];
  T.open=function(){ const st=T.st(); const ms=MS.map(m=>'<span style="display:inline-block;margin:2px;padding:3px 7px;border-radius:8px;font-size:.72rem;background:'+(st.cl.includes(m[0])?'#2e7d32':'rgba(255,255,255,.12)')+'">'+(m[0]===50?'👑 ':'')+'Stock '+m[0]+'</span>').join('');
    const o=modal('zt-ov','<div style="font-size:2.4rem">🗼</div><div style="font:900 1.2rem Arial;color:#ffd54f">Legenden-Turm</div><div style="font-size:.8rem;line-height:1.4;margin:6px 0">50 Stockwerke mit kleinen Aufgaben. <b>1 Versuch pro Tag</b> – bei einem Fehler ist der Versuch vorbei.<br>Belohnungen bei Stock 10, 20, 30, 40 und 50 (oben wartet etwas Einzigartiges!).</div><div>'+ms+'</div><div style="font-size:.8rem;margin:8px 0">Heute erreicht: <b>Stock '+st.f+'</b> · Rekord: <b>'+st.best+'</b></div><button id="zt-go" style="'+bs(st.used?GREY:GREEN)+'">'+(st.used?'Heute schon versucht':'🗼 Aufstieg starten')+'</button><button id="zt-x" style="'+bs(GLASS)+'">Schliessen</button>');
    $('zt-x').onclick=()=>o.remove(); $('zt-go').onclick=()=>{ if(st.used) return toast('Heute schon versucht – morgen wieder!'); st.used=1; st.f=0; save(); T.floor(1); }; };
  T.floor=function(n){ const st=T.st(); const type=(n-1)%4; const o=modal('zt-ov','<div id="zt-b"></div>'); const B=$('zt-b'); let done=false; const head='<div style="font:900 1.05rem Arial;color:#ffd54f">🗼 Stockwerk '+n+' / 50</div>';
    const ok=()=>{ if(done) return; done=true; st.f=n; st.best=Math.max(st.best,n); paper('tower'); let msg=''; const z=zoo();
      MS.forEach(m=>{ if(n>=m[0]&&!st.cl.includes(m[0])){ st.cl.push(m[0]); if(m[0]>=30&&window.ZHatch) try{ ZHatch.found(m[0]>=50?'star':'mountain','Turm'); }catch(e){} const rew=Math.max(3000,Math.round(Core.tick()*m[1])); z.mt=(z.mt||0)+rew; z.te=(z.te||0)+rew; msg+='<br>🎁 Stock '+m[0]+': +'+price(rew)+' MT'; try{ ZGfx.confetti(100); }catch(e){} } });
      if(n>=50&&!st.top){ st.top=1; let an=null; try{ an=ZTread.tAnimal('eternal')||ZTread.tAnimal('secret'); }catch(e){} Core.r6().towerKing=1; msg+='<br>👑 <b>Turmherr!</b> Einzigartig: Titel „Turmherr“'+(an?' + Tier: '+an:''); try{ ZGfx.confetti(300); }catch(e){} }
      hud(); save(); if(n>=50){ B.innerHTML=head+'<div style="font-size:3rem">👑</div><div style="margin:8px 0">Du hast den Gipfel erreicht!'+msg+'</div><button id="zt-c" style="'+bs(GREEN)+'">Fertig</button>'; $('zt-c').onclick=()=>o.remove(); return; }
      B.innerHTML=head+'<div style="font-size:2rem">✅</div><div style="margin:6px 0">Geschafft!'+msg+'</div><button id="zt-n" style="'+bs(GREEN)+'">Weiter zu Stock '+(n+1)+'</button><button id="zt-q" style="'+bs(GLASS)+'">Aufhören (Versuch bleibt verbraucht)</button>'; $('zt-n').onclick=()=>{ o.remove(); T.floor(n+1); }; $('zt-q').onclick=()=>o.remove(); };
    const bad=(why)=>{ if(done) return; done=true; B.innerHTML=head+'<div style="font-size:2rem">💥</div><div style="margin:6px 0">'+why+'<br>Du kamst bis <b>Stock '+st.f+'</b>. Morgen gibt es einen neuen Versuch!</div><button id="zt-c" style="'+bs(GLASS)+'">OK</button>'; $('zt-c').onclick=()=>o.remove(); };
    const alive=()=>o.isConnected&&!done;
    if(type===0){ const lim=Math.max(.45,1.2-n*.015); B.innerHTML=head+'<div style="font-size:.85rem;margin:6px 0">⚡ Reaktion: Tippe, sobald es <b style="color:#7dffb0">GRÜN</b> wird!</div><button id="zt-r" style="'+bs(GREY)+';padding:26px;font-size:1.1rem">Warte…</button>'; const b=$('zt-r'); let go=0; const t0=performance.now()+rnd(1000,2800);
      const iv=setInterval(()=>{ if(!alive()) return clearInterval(iv); if(!go&&performance.now()>=t0){ go=performance.now(); b.style.background='#2e7d32'; b.textContent='JETZT!'; } if(go&&performance.now()-go>lim*1000+250){ clearInterval(iv); bad('Zu langsam!'); } },30);
      b.onclick=()=>{ if(!alive()) return; if(!go){ bad('Zu früh gedrückt!'); } else if(performance.now()-go<=lim*1000+250) ok(); else bad('Zu langsam!'); }; }
    else if(type===1){ const A_=Math.floor(rnd(2,9+n)), B_=Math.floor(rnd(2,9+n)), mul=n>20&&Math.random()<.5, ans=mul?A_*B_:A_+B_; const o2=new Set([ans]); while(o2.size<3) o2.add(ans+Math.floor(rnd(-6,7))||ans+7); const opts=[...o2].sort(()=>Math.random()-.5); let left=Math.max(4,9-n*.08);
      B.innerHTML=head+'<div style="font-size:.85rem">🧮 Rechnen</div><div style="font:900 1.8rem Arial;margin:8px 0">'+A_+(mul?' × ':' + ')+B_+' = ?</div><div id="zt-tm" style="font-size:.8rem"></div>'+opts.map(v=>'<button data-v="'+v+'" style="'+bs('#1976d2')+'">'+v+'</button>').join('');
      const iv=setInterval(()=>{ if(!alive()) return clearInterval(iv); left-=.1; const e=$('zt-tm'); if(e) e.textContent='⏱️ '+left.toFixed(1)+' s'; if(left<=0){ clearInterval(iv); bad('Zeit abgelaufen!'); } },100);
      B.querySelectorAll('button[data-v]').forEach(b=>b.onclick=()=>{ if(!alive()) return; if(+b.dataset.v===ans) ok(); else bad('Falsche Antwort!'); }); }
    else if(type===2){ const E=['🐶','🐱','🐭','🦊','🐸','🐵'], len=Math.min(7,3+Math.floor(n/9)), seq=[]; for(let i=0;i<len;i++) seq.push(Math.floor(Math.random()*E.length)); let step=0, show=0;
      B.innerHTML=head+'<div style="font-size:.85rem">🧠 Merken: Schau gut hin!</div><div id="zt-s" style="font-size:3rem;height:64px;margin:8px 0"></div><div id="zt-pad" style="display:none">'+E.map((e,i)=>'<button data-e="'+i+'" style="width:30%;margin:1.5%;padding:12px 0;font-size:1.8rem;border:none;border-radius:12px;background:rgba(255,255,255,.15)">'+e+'</button>').join('')+'</div>';
      const iv=setInterval(()=>{ if(!alive()) return clearInterval(iv); const s=$('zt-s'); if(!s) return; if(show<len*2){ s.textContent=(show%2===0)?E[seq[show/2]]:''; show++; } else { clearInterval(iv); s.textContent='Jetzt du!'; s.style.fontSize='1.4rem'; $('zt-pad').style.display='block'; } },Math.max(280,650-n*6));
      B.querySelectorAll('button[data-e]').forEach(b=>b.onclick=()=>{ if(!alive()||show<len*2) return; if(+b.dataset.e===seq[step]){ step++; if(step>=len) ok(); } else bad('Falsche Reihenfolge!'); }); }
    else { const need=8+Math.floor(n/2); let c=0, left=5; B.innerHTML=head+'<div style="font-size:.85rem;margin:6px 0">👆 Tippen: '+need+'× in 5 Sekunden!</div><div id="zt-tm" style="font-size:.9rem"></div><button id="zt-tap" style="'+bs('#c62828')+';padding:26px;font-size:1.3rem">Tippen! 0 / '+need+'</button>'; let started=0;
      const iv=setInterval(()=>{ if(!alive()) return clearInterval(iv); if(!started) return; left-=.1; const e=$('zt-tm'); if(e) e.textContent='⏱️ '+left.toFixed(1)+' s'; if(left<=0){ clearInterval(iv); bad('Zu wenige Tipper!'); } },100);
      $('zt-tap').onclick=()=>{ if(!alive()) return; started=1; c++; $('zt-tap').textContent='Tippen! '+c+' / '+need; if(c>=need) ok(); }; } };

  // ═══════════ Hub, Karte, UI ═══════════
  Core.addFeature({id:'arena',ic:'⚔️',name:'Tier-Arena',desc:'Kämpfe mit deinen Tieren, sammle Ruhm',go:()=>{ const s=secO(); s.arena=1; Core.goto(PL.arena.x,PL.arena.z+24); }});
  Core.addFeature({id:'isl',ic:'🏝️',name:'Schatz-Insel',desc:'Mit dem Boot hinüber, Schätze & Boss-Truhe',go:()=>{ Core.goto(dockBase.x,dockBase.z); }});
  Core.addFeature({id:'tower',ic:'🗼',name:'Legenden-Turm',desc:'50 Stockwerke, 1 Versuch pro Tag',go:()=>{ const s=secO(); s.tower=1; Core.goto(PL.tower.x,PL.tower.z+13); }});
  const PLACES=[
    {k:'arena',ic:'⚔️',n:'Tier-Arena',p:PL.arena,h:'Im Nordosten, weit hinter dem Zoo-Ring, steht eine Kampfarena mit Zuschauerrängen.'},
    {k:'isl',ic:'🏝️',n:'Schatz-Insel',p:IC,h:'Im Südwesten glitzert ein See mit einer Insel. Am Steg wartet ein Boot.'},
    {k:'tower',ic:'🗼',n:'Legenden-Turm',p:PL.tower,h:'Im Südosten ragt ein sehr hoher Turm mit einer Flamme auf.'}];
  Core.mapExtra=function(){ if(!Core.has()) return; const c=$('zmap-c'); if(!c) return; const g=c.getContext('2d'), S=c.width, WRr=(ZG.WR||335), k=S/2/(WRr+10), X=x=>S/2+x*k, Y=y=>S/2+y*k, s=secO(); const hints=[];
    PLACES.forEach(pl=>{ if(s[pl.k]){ g.font='32px serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(pl.ic,X(pl.p.x),Y(pl.p.z)); hints.push(pl.ic+' <b>'+pl.n+'</b> – entdeckt.'); } else { g.fillStyle='rgba(120,80,30,.3)'; g.beginPath(); g.arc(X(pl.p.x+16),Y(pl.p.z-12),50*k+16,0,6.283); g.fill(); g.font='30px serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillStyle='#000'; g.fillText('❓',X(pl.p.x+16),Y(pl.p.z-12)); hints.push('❓ '+pl.h); } });
    const h=$('zmap-h'); if(h) h.insertAdjacentHTML('beforeend','<div style="margin-top:6px;border-top:1px solid rgba(0,0,0,.2);padding-top:4px"><b>Rebirth 6:</b></div>'+hints.map(x=>'<div style="margin:2px 0">'+x+'</div>').join('')); };
  let uiOk=false; const ui=()=>{ if(uiOk) return; uiOk=true;
    nbtn('za-btn','⚔️ Kämpfen','background:linear-gradient(135deg,#e53935,#b71c1c);color:#fff').onclick=()=>A.open();
    nbtn('zi-boat','⛵ Fahren','background:linear-gradient(135deg,#29b6f6,#0277bd);color:#fff').onclick=()=>I.go();
    nbtn('zi-dig','⛏️ Graben','background:linear-gradient(135deg,#a1887f,#6d4c41);color:#fff').onclick=()=>I.dig();
    nbtn('zi-boss','🧰 Boss-Truhe öffnen','background:linear-gradient(135deg,#ffc107,#ff6f00);color:#2a1700').onclick=()=>I.boss();
    nbtn('zt-btn','🗼 Turm betreten','background:linear-gradient(135deg,#7e57c2,#4527a0);color:#fff').onclick=()=>T.open(); };
  const show=(id,v)=>{ const e=$(id); if(e) e.style.display=v?'block':'none'; };
  let last=performance.now(), upT=0, fT=0;
  const frame=()=>{ const now=performance.now(), dt=Math.min(.1,(now-last)/1000); last=now; const has=Core.has(); try{ if(I.g) I.g.visible=has; if(A.g) A.g.visible=has; if(T.g) T.g.visible=has; if(has) I.frame(dt,now/1000); if(T.fire) T.fire.scale.setScalar(3.6+Math.sin(now/120)*.5); }catch(e){}
    upT+=dt; if(upT<.3) return; upT=0; try{ const pl=Pl(), rd=riding(), ok=has&&!rd&&!I.sail; const bp=I.bpos();
      show('za-btn',ok&&dist(pl,PL.arena)<22); show('zt-btn',ok&&dist(pl,PL.tower)<16);
      const nb=ok&&dist(pl,bp)<9&&(I.at==='dock'?!I.onIsland():I.onIsland()); const bt=$('zi-boat'); if(bt){ bt.textContent=I.at==='dock'?'⛵ Zur Schatz-Insel':'⛵ Zurück zum Festland'; } show('zi-boat',nb);
      show('zi-dig',ok&&I.onIsland()&&SPOTS.some(p=>dist(pl,p)<4)); show('zi-boss',ok&&dist(pl,BOSS)<5);
      if(has){ const s=secO(); let ch=0; PLACES.forEach(p=>{ if(!s[p.k]&&dist(pl,p.p)<40){ s[p.k]=1; ch=1; toast('🗺️ Neuer Ort auf der Karte: '+p.n+'!',3500); } }); if(ch) save(); } }catch(e){} };
  const boot=()=>{ try{ if(typeof ZG==='undefined'||!ZG.scene||!ZG.renderer||!zoo()||typeof ZS.mySlot!=='number') return setTimeout(boot,1000);
      ui(); A.build(); I.build(); T.build(); const r=ZG.renderer, o=r.render.bind(r); r.render=function(s,c){ if(s===ZG.scene){ try{ frame(); }catch(e){} } return o(s,c); };
    }catch(e){ console.warn('ZLegend boot',e); setTimeout(boot,1500); } };
  window.ZLegend={A,I,T,PL,SPOTS,BOSS,dockBase,dockEnd,boatDock,boatIsl};
  setTimeout(boot,2600);
  }
  boot0();
})();
