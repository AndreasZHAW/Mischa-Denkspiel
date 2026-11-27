/* ZBots — Computerspieler (v858, Phase 1). Rein lokal berechnet, KEIN Traffic pro Bot:
   Position = Funktion von (Bot-Nr., Uhrzeit) mit festem Seed → alle Spieler sehen jeden Bot an derselben Stelle.
   Einzige Netzdaten: zoo_cfg/bots {n} (ein winziger Listener). Admin stellt n (0–20) ein.
   Bots stehen NICHT in ZG.otherPl (Events/Slap/Handel bleiben unberührt); Phase 2 verbindet sie gezielt. */
(function(){
  'use strict';
  if(window.ZBots) return;
  var MAXN=20;
  var B=window.ZBots={n:0, meshes:[], on:false, MAX:MAXN};
  function ZGet(){ try{ return (typeof ZG!=='undefined')?ZG:null; }catch(e){ return null; } }
  function RT(){ try{ return (typeof _rtdb!=='undefined'&&_rtdb)?_rtdb:null; }catch(e){ return null; } }
  function hash(s){ var h=2166136261; s=String(s); for(var i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
  function rnd(seed){ var t=(seed+0x6D2B79F5)>>>0; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }
  var ADJ=['Pixel','Turbo','Zoo','Mega','Mini','Super','Cosmo','Happy','Funky','Wilde','Coole','Flinke','Schlaue','Lustige','Sonnen','Nacht','Gold','Silber','Blitz','Zucker'];
  var NOUN=['Panda','Giraffe','Pinguin','Otter','Koala','Löwe','Tiger','Fuchs','Igel','Hase','Zebra','Lama','Affe','Frosch','Eule','Robbe','Elefant','Delfin','Gecko','Dino'];
  var CHAR=['🐼','🦒','🐧','🦦','🐨','🦁','🐯','🦊','🦔','🐰','🦓','🦙','🐵','🐸','🦉','🦭','🐘','🐬','🦎','🦖'];
  var COL=['#ff6b6b','#4fc3f7','#ffe082','#a5d6a7','#ce93d8','#ffab91','#80cbc4','#f48fb1','#b0bec5','#c5e1a5'];
  // ── Profil: Name, Aussehen, Level (wächst langsam über Tage; Anfänger / Mittel / Profi gemischt)
  B.profile=function(i){
    var s=hash('bot'+i); var a=ADJ[(s%ADJ.length)], nn=NOUN[(Math.floor(s/7))%NOUN.length];
    // eindeutig: Nummer anhängen wenn nötig
    var name='🤖 '+a+'-'+nn; if(i>=ADJ.length) name+=' '+(i+1);
    var tier=i%3; // 0 Anfänger, 1 Mittel, 2 Profi (gemischt, fest pro Bot)
    var day=Math.max(0,Math.floor((Date.now()-Date.UTC(2026,10,21))/86400000));
    var base=[3,12,30][tier], grow=[0.5,1.2,2.5][tier];
    var level=Math.round(base+rnd(s)*base*0.4+day*grow);
    var rank=['Anfänger','Fortgeschritten','Profi'][tier];
    return {i:i, name:name, char:CHAR[(s>>>3)%CHAR.length], color:COL[s%COL.length], level:level, tier:tier, rank:rank};
  };
  // ── Bewegung: feste Zyklen; Wegpunkte aus Seed → für alle identisch
  function centre(){ var g=ZGet(); var m=(g&&g.MARKET)||{x:0,z:30}; return m; }
  function wp(i,k){
    // Lissajous-Bahn um den Marktplatz + kleiner Zufall: aufeinanderfolgende Wegpunkte liegen immer nah beieinander (max ~55 Einheiten) → natürliches Gehtempo
    var c=centre(), ph=rnd(hash('ph'+i))*Math.PI*2, th=k*0.55+ph;
    var ax=25+(i%4)*14, az=20+(i%3)*14;
    var jx=(rnd(hash('jx'+i+'_'+k))-0.5)*12, jz=(rnd(hash('jz'+i+'_'+k))-0.5)*12;
    return {x:c.x+ax*Math.sin(th)+jx, z:c.z+az*Math.sin(th*1.37+1)+jz};
  }
  var SPEED=7;      // Einheiten/s ohne Tier (ein Spieler läuft 11–13, hier etwas gemütlicher)
  var CARRYSPD=2.4; // Einheiten/s MIT Tier: wie ein Mensch (Spieler: 11,2 × 0,21 ≈ 2,4 ohne Wanderschuhe)
  // Zeitverzerrung: während ein Bot ein Tier trägt (30 s im Takt, siehe carryAt) läuft seine Bahn nur mit CARRYSPD/SPEED ab,
  // danach etwas schneller – am Takt-Ende ist die Bahn-Zeit für alle Clients gleich → alle sehen weiter dieselbe Position.
  var SLOTMS=70000, PROGMS=62000, CARMS=30000;
  function carrySlot(i,s){ return rnd(hash('c'+i+'_'+s))<0.12; }
  function warp(i,t){
    var u=t+i*9000, s=Math.floor(u/SLOTMS), ph=u-s*SLOTMS, f=CARRYSPD/SPEED, loc;
    if(carrySlot(i,s)){ loc=ph<=CARMS ? ph*f : CARMS*f+(ph-CARMS)*((PROGMS-CARMS*f)/(SLOTMS-CARMS)); }
    else loc=ph*(PROGMS/SLOTMS);
    return s*PROGMS+loc;
  }
  B.posAt=function(i,t){ return B.rawPos(i,warp(i,t)); };
  B.rawPos=function(i,t){
    var dur=17000+(i%6)*1700, k=Math.floor((t+i*4321)/dur), ph=(t+i*4321)-k*dur;
    var A=wp(i,k-1), Bp=wp(i,k); var dx=Bp.x-A.x, dz=Bp.z-A.z, dist=Math.hypot(dx,dz);
    var walkMs=Math.min(dur-2500, dist/SPEED*1000);
    var f=Math.min(1,ph/Math.max(1,walkMs)); var walking=ph<walkMs;
    return {x:A.x+dx*f, z:A.z+dz*f, hd:Math.atan2(dx,dz), walking:walking};
  };
  // ── Figur (gleiche Optik wie die anderen Spieler, aber mit 🤖 und Bot-Label)
  function build(p){
    var g=ZGet(); var G=new THREE.Group();
    var col=parseInt(p.color.replace('#',''),16);
    var mat=new THREE.MeshBasicMaterial({color:col});
    var body=new THREE.Mesh(new THREE.SphereGeometry(.42,12,10),mat); body.scale.set(1,1.05,1); body.position.y=.58; G.add(body);
    var neck=new THREE.Mesh(new THREE.SphereGeometry(.2,8,6),mat); neck.position.y=1.02; G.add(neck);
    [-1,1].forEach(function(s){ var arm=new THREE.Mesh(new THREE.SphereGeometry(.16,8,6),mat); arm.scale.set(1,1.5,1); arm.position.set(s*.55,.62,0); arm.rotation.z=s*.35; G.add(arm); });
    var fm=new THREE.MeshBasicMaterial({color:0x5A4A3A}); G.feet=[];
    [-1,1].forEach(function(s){ var f=new THREE.Mesh(new THREE.SphereGeometry(.16,8,6),fm); f.scale.set(1,.6,1.2); f.position.set(s*.2,.06,.05); G.add(f); G.feet.push(f); });
    var head=g._makeEmojiSprite(p.char); head.position.set(0,1.38,0); head.scale.set(1.55,1.55,1); G.add(head);
    var rk=g._txt('Bot · Lv '+p.level+' · '+p.rank,.42,'#9fb4c7'); rk.position.set(0,2.62,0); rk.scale.set(6.4,1,1); G.add(rk);
    var nm=g._txt(p.name,.5,'#8be9ff'); nm.position.set(0,2.25,0); nm.scale.set(6.6,1.2,1); G.add(nm);
    G.userData={bob:Math.random()*10,noCull:false,isBot:true,botIdx:p.i};
    return G;
  }
  // ── Gehege: Plätze = die höchsten freien Slots (echte Spieler behalten ihre), Tiere wachsen mit dem Level
  B._real={has:function(){return false;}};
  B.setReal=function(set){ B._real=set; };
  B.slotOf=function(i){ var c=-1; for(var s=19;s>=0;s--){ if(B._real&&B._real.has&&B._real.has(s)) continue; c++; if(c===i) return s; } return -1; };
  var encCache={};
  B.encFor=function(i){
    var day=Math.floor((Date.now()-Date.UTC(2026,10,21))/86400000), key=i+'_'+day; if(encCache[key]) return encCache[key];
    var out=[null,null,null,null,null], A=null; try{ A=(typeof ANIMALS!=='undefined')?ANIMALS:null; }catch(e){}
    if(A&&A.length){
      var p=B.profile(i), cnt=Math.max(1,Math.min(5,1+Math.floor(p.level/7))), hi=Math.min(A.length-1,Math.round(5+p.level*0.8));
      for(var k=0;k<cnt;k++){ var idx=Math.floor(rnd(hash('an'+i+'_'+k+'_'+Math.floor(day/2)))*(hi+1)); var a=A[idx]; if(a) out[k]={animal:{id:a.id,n:a.n,e:a.e,r:a.r}}; }
    }
    encCache={}; encCache[key]=out; return out;
  };
  B.encMap=function(){
    var m={}; if(!active()||B.n<=0) return m;
    for(var i=0;i<Math.min(B.n,MAXN);i++){ var p=B.profile(i), sl=B.slotOf(i); if(sl<0) continue;
      var en=B.encFor(i).slice(), nowT=Date.now(); (stolen[i]||[]).forEach(function(q,j){ if(q.at<=nowT&&q.a) en[4-(j%5)]={animal:Object.assign({},q.a)}; });
      m[p.name]={name:p.name,char:p.char,color:p.color,slotIdx:sl,enc:en,isBot:true,x:0,z:0,rank:{name:'Bot · Lv '+p.level,color:'#9fb4c7'}}; }
    return m;
  };
  function active(){
    var g=ZGet(); if(!g||!g.scene) return false;
    try{ if(ZS.isPrivate||!ZS.player) return false; if(ZS.instanceId&&ZS.instanceId!=='main') return false; }catch(e){ return false; }
    return true;
  }
  function sync(){
    var g=ZGet(); var want=active()?Math.max(0,Math.min(MAXN,B.n|0)):0;
    while(B.meshes.length>want){ var m=B.meshes.pop(); try{ if(m.parent) m.parent.remove(m); if(g&&g.otherM&&m.userData&&g.otherM[m.userData.botName]===m) delete g.otherM[m.userData.botName]; }catch(e){} }
    for(var i=B.meshes.length;i<want;i++){ try{ var pr=B.profile(i); var G=build(pr); G.userData.botName=pr.name; g.scene.add(G); if(g.otherM) g.otherM[pr.name]=G; B.meshes.push(G); }catch(e){ break; } }
  }
  var last=0;
  function frame(ts){
    try{
      if(B.n>0||B.meshes.length){
        var g=ZGet();
        if(!last||ts-last>30){ // ~30 fps reicht
          last=ts; sync();
          var t=Date.now();
          for(var i=0;i<B.meshes.length;i++){
            var G=B.meshes[i]; if(g&&G.parent!==g.scene) g.scene.add(G); if(g&&g.otherM&&g.otherM[G.userData.botName]!==G) g.otherM[G.userData.botName]=G;
            var dts=Math.min(0.1,Math.max(0.001,(ts-(G._lts||ts))/1000)); G._lts=ts;
            var p=B.botPos(i,t,G,dts);
            G.position.x=p.x; G.position.z=p.z;
            var want=p.hd; var cur=G.rotation.y; var dd=Math.atan2(Math.sin(want-cur),Math.cos(want-cur)); G.rotation.y=cur+dd*0.15;
            var w=p.walking, ph=t*0.008+G.userData.bob;
            var sl=G.userData.slapT, sd=G.userData.slapDur||2000;
            if(!G._launching){
              if(sl&&t-sl<sd){ var u=(t-sl)/sd; G.position.y=Math.max(0,-4*u*(u-1))*2; G.rotation.z=Math.sin(t*0.01)*(1-u)*0.5; }
              else { G.position.y=w?Math.abs(Math.sin(ph))*0.12:Math.sin(t*0.003+G.userData.bob)*0.05; G.rotation.z=0; }
              if(G.visible===false&&(!sl||t-sl>sd+1500)) G.visible=true;
            }
            if(G.feet){ G.feet[0].position.z=.05+(w?Math.sin(ph)*.25:0); G.feet[1].position.z=.05-(w?Math.sin(ph)*.25:0); }
          }
        }
      }
    }catch(e){}
    requestAnimationFrame(frame);
  }
  // ── DIEBSTAHL: Bots greifen Spieler an, die ein gutes Tier tragen – wie ein Mensch:
  //    anrennen → Slap (Tier fällt, normale Slap-Logik) → zum fallenden Tier rennen → aufheben → ins eigene Gehege tragen.
  //    Autorität = Opfer-Client (er besitzt auch das Wander-Verhalten des fallenden Tiers). Gemeinsamer Zustand: zoo_cfg/botatk/<i> (winzig, nur bei Angriffen).
  var ep={}, stolen={}, steal=true, SPD=5.5;
  B.ep=ep;
  function me(){ try{ return ZS.player; }catch(e){ return null; } }
  function targetPos(name){ var g=ZGet(); if(!g) return null; if(name===me()) return {x:g.pl.x,z:g.pl.z}; var m=g.otherM&&g.otherM[name]; return m?{x:m.position.x,z:m.position.z}:null; }
  function dropOf(id){ var g=ZGet(); if(!g||!g.droppedAnimals||!id) return null; for(var k=0;k<g.droppedAnimals.length;k++){ if(g.droppedAnimals[k].id===id) return g.droppedAnimals[k]; } return null; }
  function stepTo(G,tp,dt){ var dx=tp.x-G._sx, dz=tp.z-G._sz, d=Math.hypot(dx,dz); if(d>0.05){ var st=Math.min(d,SPD*dt); G._sx+=dx/d*st; G._sz+=dz/d*st; } return {x:G._sx,z:G._sz}; }
  function epPos(i,t,G,e,dt){
    if(e.st==='chase'){ if(t>=e.t0+12000) return null; if(G._ep!==e.id){ G._ep=e.id; var q=B.posAt(i,e.t0); G._sx=q.x; G._sz=q.z; } var tp=targetPos(e.target); if(!tp) return null; return stepTo(G,tp,dt); }
    if(e.st==='grab'){ if(t>=e.tc+15000) return null; if(G._ep!==e.id){ G._ep=e.id; G._sx=e.cx; G._sz=e.cz; } var d=dropOf(e.dropId); return stepTo(G,d?{x:d.x,z:d.z}:{x:G._sx,z:G._sz},dt); }
    if(e.st==='carry'){ if(t>=e.ta+2500) return null; var f=Math.min(1,(t-e.tg)/Math.max(1,e.ta-e.tg)); return {x:e.gx+(e.hx-e.gx)*f, z:e.gz+(e.hz-e.gz)*f}; }
    return null;
  }
  B.botPos=function(i,t,G,dt){
    var det=B.posAt(i,t), e=ep[i], r=null;
    if(e&&e.id) r=epPos(i,t,G,e,dt);
    var inEp=!!r; if(G._inEp&&!inEp){ G._blF={x:G.position.x,z:G.position.z}; G._blT=t; } G._inEp=inEp;
    if(!r&&G._blT&&t-G._blT<9000){ var k=(t-G._blT)/9000; k=k*k*(3-2*k); r={x:G._blF.x+(det.x-G._blF.x)*k, z:G._blF.z+(det.z-G._blF.z)*k}; }
    if(!r) return det;
    var dx=r.x-G.position.x, dz=r.z-G.position.z, mv=Math.hypot(dx,dz)>0.002; if(mv) G._hd=Math.atan2(dx,dz);
    r.hd=G._hd||0; r.walking=mv; return r;
  };
  function epLive(e,t){ if(!e||!e.id) return false; if(e.st==='chase') return t<e.t0+12000; if(e.st==='grab') return t<e.tc+15000; if(e.st==='carry') return t<e.ta+2500; return false; }
  function upd(i,o){ var db=RT(); if(db) db.ref('zoo_cfg/botatk/'+i).update(o).catch(function(){}); }
  function good(a){ return !!a&&((a.r&&a.r!=='normal')||(a.p||0)>=500); }
  function doSteal(i,e){
    var g=ZGet(), db=RT(); if(!g||!db) return; var G=B.meshes[i], name=G.userData.botName, t=Date.now();
    try{ g._applyReceivedSlap({type:'slap',from:name,target:me(),slapId:'basic',dur:1500,fx:1500,dmg:0.3,at:t}); }catch(x){}
    var d=null; (g.droppedAnimals||[]).forEach(function(z){ if(z.droppedBy===me()&&z.slappedBy===name) d=z; });
    if(!d||!d.id){ upd(i,{st:'done'}); return; }
    upd(i,{st:'grab',tc:t,cx:G.position.x,cz:G.position.z,dropId:d.id});
  }
  function doGrab(i,e,d){
    var g=ZGet(), db=RT(); if(!g||!db) return; var G=B.meshes[i], t=Date.now(), name=G.userData.botName;
    var a=d.animal||{}; db.ref('zoo_dropped/'+d.id).remove().catch(function(){});
    var sl=B.slotOf(i), lay=(sl>=0&&g._slotEncPos)?g._slotEncPos(sl):null, cnt=(stolen[i]||[]).length;
    var pos=lay?lay.positions[Math.max(0,4-(cnt%5))]||lay.center:{x:G.position.x,z:G.position.z};
    var dist=Math.hypot(pos.x-G.position.x,pos.z-G.position.z), ta=t+dist/CARRYSPD*1000; /* mit Tier so langsam wie ein Mensch */
    var an={id:a.id,n:a.n,e:a.e,r:a.r,p:a.p};
    upd(i,{st:'carry',tg:t,gx:G.position.x,gz:G.position.z,hx:pos.x,hz:pos.z,ta:ta,animal:an});
    var db2=db.ref('zoo_cfg/botenc/'+i); db2.transaction(function(cur){ var l=(cur&&cur.l)||[]; l=l.concat([{a:an,at:ta}]).slice(-5); return {l:l}; },function(){},false);
    try{ if(window.ZP&&ZP.toast) ZP.toast('😱 '+name+' hat '+(an.e||'')+' '+(an.n||'Tier')+' geschnappt und rennt damit weg!',3500); }catch(x){}
  }
  var nextAtk=0;
  function victimTick(){
    var g=ZGet(), db=RT(); if(!g||!db||!g.pl||!active()||!me()) return; var t=Date.now(), mine=me(), busy=false;
    for(var i=0;i<B.meshes.length;i++){ var e=ep[i]; if(!e||e.target!==mine) continue; var G=B.meshes[i];
      if(e.st==='chase'&&epLive(e,t)){ busy=true; if(!g.carrying){ upd(i,{st:'done'}); continue; } if(Math.hypot(G.position.x-g.pl.x,G.position.z-g.pl.z)<2.6) doSteal(i,e); }
      else if(e.st==='grab'&&epLive(e,t)){ busy=true; var d=dropOf(e.dropId); if(!d){ if(t>e.tc+2500) upd(i,{st:'done'}); continue; } if(Math.hypot(G.position.x-d.x,G.position.z-d.z)<2.6) doGrab(i,e,d); }
    }
    if(busy||!steal||t<nextAtk||!g.carrying||!good(g.carrying.animal)) return;
    try{ if(window.evGateOk&&!evGateOk()) return; }catch(x){}
    try{ if(g.isPrivate||(window.ZHearts&&ZHearts.dead)||(window.ZBattle&&ZBattle.fighting&&ZBattle.fighting())) return; }catch(x){}
    var best=-1,bd=35; for(var j=0;j<B.meshes.length;j++){ var ej=ep[j]; if(ej&&ej.t0&&t<ej.t0+120000) continue; var Gj=B.meshes[j]; var d2=Math.hypot(Gj.position.x-g.pl.x,Gj.position.z-g.pl.z); if(d2<bd){ bd=d2; best=j; } }
    if(best<0||Math.random()>0.25) return;
    nextAtk=t+60000; var bi=best;
    db.ref('zoo_cfg/botatk/'+bi).transaction(function(cur){ if(cur&&epLive(cur,Date.now())) return; return {id:Date.now()+'_'+bi,st:'chase',t0:Date.now(),target:mine}; },function(err,ok){
      if(!err&&ok){ try{ if(window.ZP&&ZP.toast) ZP.toast('⚠️ '+B.meshes[bi].userData.botName+' hat es auf dein Tier abgesehen!',3000); }catch(x){} } },false);
  }
  B._victimTick=victimTick; setInterval(function(){ try{ victimTick(); }catch(e){} },250);
  B.status=function(){ try{ var act=0, t=Date.now(); Object.keys(ep).forEach(function(k){ if(epLive(ep[k],t)) act++; }); var enc=0; try{ enc=Object.keys(B.encMap()).length; }catch(e){}
    return 'n='+B.n+' Figuren='+B.meshes.length+' Gehege='+enc+' Diebstahl='+(steal?'an':'aus')+' Angriffe-aktiv='+act+' im-Zoo='+(active()?'ja':'nein'); }catch(e){ return 'n='+B.n; } };
  setInterval(function(){ try{ if(B.n>0||B.meshes.length) console.log('[Bots-debug] '+B.status()+' · '+((window.ZLook&&ZLook.info)?ZLook.info():'')); }catch(e){} },60000);
  // ── Tragen: fester Zeitplan (70-s-Takt je Bot), alle sehen dasselbe. Slap = Tier fällt (zoo_dropped) + gemeinsamer Cooldown
  function animals(){ try{ return (typeof ANIMALS!=='undefined')?ANIMALS:null; }catch(e){ return null; } }
  var fx={};  // Bot-Nr. → Takt-Nummer, in der ihm das Tier schon abgenommen wurde
  function slotOfT(i,t){ return Math.floor((t+i*9000)/70000); }
  B.carryAt=function(i,t){
    var e0=ep[i]; if(e0&&e0.id){ if(e0.st==='carry'&&t<e0.ta) return e0.animal||null; if((e0.st==='chase'||e0.st==='grab')&&epLive(e0,t)) return null; }
    var s=slotOfT(i,t), ph=(t+i*9000)-s*70000; if(ph>30000) return null;
    if(!carrySlot(i,s)) return null; /* selten: ~12 % der 70-s-Takte, je 30 s */
    if(fx[i]===s) return null;
    var A=animals(); if(!A||!A.length) return null; var lv=B.profile(i).level, hi=Math.min(A.length-1,Math.round(5+lv*0.8));
    return A[Math.floor(rnd(hash('ca'+i+'_'+s))*(hi+1))]||null;
  };
  function idxOf(name){ for(var i=0;i<B.meshes.length;i++){ if(B.meshes[i].userData.botName===name) return i; } return -1; }
  B.opOf=function(name){ var i=idxOf(name); if(i<0) return null; var t=Date.now(), p=B.posAt(i,t), a=B.carryAt(i,t);
    return {name:name,x:p.x,z:p.z,_heading:p.hd,carrying:a?{e:a.e,n:a.n}:null,isBot:true}; };
  B.carryMap=function(){ var m={}; if(!active()) return m; for(var i=0;i<B.meshes.length;i++){ var n=B.meshes[i].userData.botName, o=B.opOf(n); if(o&&o.carrying){ if(Object.keys(m).length>=2) break; m[n]=o; } } return m; }; // höchstens 2 Bot-Meldungen gleichzeitig
  B.onSlap=function(name){
    var i=idxOf(name); if(i<0) return; var t=Date.now(), a=B.carryAt(i,t);
    try{ console.log('[Bots] Slap auf '+name+' · trägt '+(a?a.n:'nichts')); }catch(_){}
    if(!a){ try{ if(window.ZP&&ZP.toast) ZP.toast('🤖 '+name+' trägt gerade kein Tier.',1500); }catch(_){} return; }
    var s=slotOfT(i,t), db=RT(), g=ZGet(); var pos=B.posAt(i,t);
    // Hat der Bot das Tier einem Spieler GEKLAUT (Diebstahl-Ablauf 'carry'), muss auch dieser Ablauf beendet werden –
    // sonst trägt er es nach dem Slap einfach weiter (so blieb das Tier trotz vieler Treffer beim Bot).
    var e0=ep[i], wasEp=!!(e0&&e0.id&&e0.st==='carry'&&t<e0.ta), txKey=wasEp?('e'+e0.id):s;
    if(wasEp){ try{ var cp=Object.assign({},e0); cp.st='done'; ep[i]=cp; var G0=B.meshes[i]; if(G0&&G0.userData){ pos={x:G0.position.x,z:G0.position.z}; } }catch(_){}
      upd(i,{st:'done'});
      try{ if(db) db.ref('zoo_cfg/botenc/'+i).transaction(function(cur){ var l=(cur&&cur.l)||[]; l=l.filter(function(q){ return !(q&&q.at===e0.ta); }); return {l:l}; },function(){},false); }catch(_){}
    }
    // Sofort lokal: Bot lässt das Tier fallen (wie bei einem echten Spieler – kein Warten auf die Datenbank)
    fx[i]=s;
    var ang=Math.random()*Math.PI*2, dist=3+Math.random()*3, x=pos.x+Math.cos(ang)*dist, z=pos.z+Math.sin(ang)*dist;
    var animal=Object.assign({},a), me_=(ZS&&ZS.player)||null, key=null, mine=null;
    try{ console.log('[Bots] Slap auf tragenden Bot '+name+': '+a.n+' fällt (Slapper '+(me_||'?')+')'); }catch(_){}
    try{
      if(db) key=db.ref('zoo_dropped').push().key;
      if(g&&g.droppedAnimals&&g._spawnDroppedMesh){
        mine={id:key, createdAt:t, animal:animal, shiny:null, traits:[], slot:null, x:x, z:z, droppedBy:name, slappedBy:me_,
          wanderCx:x, wanderCz:z, wanderTx:x, wanderTz:z, wanderOwner:true, _lastWanderPush:0};
        g.droppedAnimals.push(mine); g._spawnDroppedMesh(mine);
        if(window.ZP&&ZP.toast) ZP.toast('💥 '+a.e+' '+a.n+' von '+name+' fallen gelassen! Schnell aufheben!',3000);
      }
    }catch(e){ try{ console.log('[Bots] Drop-Fehler lokal: '+e.message); }catch(_){} }
    if(!db||!key) return;
    var cleanup=function(){ try{ if(mine&&g){ var k=g.droppedAnimals.indexOf(mine); if(k>=0){ g.droppedAnimals.splice(k,1); if(mine.mesh&&g.scene) g.scene.remove(mine.mesh); } } }catch(e){} };
    // Gemeinsam: nur EIN Client darf das Tier in die Datenbank legen (sonst fällt es doppelt)
    db.ref('zoo_cfg/botfx/'+i).transaction(function(cur){ if(cur&&cur.s===txKey) return; return {s:txKey,at:t}; },function(err,ok){
      if(err){ try{ console.log('[Bots] botfx-Fehler: '+(err.message||err)+' – Tier wird trotzdem abgelegt'); }catch(_){} }
      else if(!ok){ cleanup(); return; } // ein anderer Spieler war schneller
      db.ref('zoo_dropped/'+key).set({animal:animal,shiny:null,traits:[],x:x,z:z,droppedBy:name,slappedBy:me_,createdAt:t}).catch(function(e){ try{ console.log('[Bots] zoo_dropped-Fehler: '+(e&&e.message)); }catch(_){} });
    },false);
  };
  var carryTick=0;
  function carryUpdate(t){
    var g=ZGet(); if(!g) return;
    for(var i=0;i<B.meshes.length;i++){ var G=B.meshes[i], a=B.carryAt(i,t), e=a?a.e:null;
      if(G.userData.carryEmoji!==e){ if(G.userData.carrySprite){ G.remove(G.userData.carrySprite); G.userData.carrySprite=null; }
        if(e){ var cs=g._txt(e,1,'#fff'); cs.position.set(0,3.1,0); cs.scale.set(1.8,1.8,1); G.add(cs); G.userData.carrySprite=cs; }
        G.userData.carryEmoji=e; } }
  }
  // ── Marktplatz: ein Bot-Angebot alle 6 min (echte zoo_trades-Einträge → Kauf/Panel/Ablauf funktionieren wie bei Spielern); max. 3 gleichzeitig
  function postOffer(db,cur){
    var A=animals(); if(!A||!A.length||B.n<=0) return;
    var i=hash('tp'+cur.slot)%Math.max(1,B.n), p=B.profile(i), hi=Math.min(A.length-1,Math.round(5+p.level*0.8));
    var a=A[Math.floor(rnd(hash('ta'+cur.slot))*(hi+1))]; if(!a) return;
    var price=Math.max(1,Math.round((a.p||10)*(1.1+rnd(hash('tpr'+cur.slot))*0.3)*100)/100);
    var ref=db.ref('zoo_trades').push();
    var doc={seller:p.name,sellerKey:'bot_'+i,n:a.n,e:a.e,r:a.r,p:price,sh:null,tr:[],d:{animal:Object.assign({},a),shiny:null,traits:[],xm:1,sl:0},createdAt:Date.now(),bot:1};
    ref.set(doc).then(function(){
      try{ console.log('[Bots] Marktplatz-Angebot: '+p.name+' bietet '+a.n+' für '+price); }catch(_){}
      var keys=(cur.keys||[]).concat([ref.key]); while(keys.length>3){ var old=keys.shift(); db.ref('zoo_trades/'+old).remove().catch(function(){}); }
      db.ref('zoo_cfg/botTrade/keys').set(keys).catch(function(){});
    }).catch(function(){});
  }
  function tradeTick(){
    if(!active()||B.n<=0) return; var db=RT(); if(!db) return;
    var slot=Math.floor(Date.now()/360000); if(B._tradeSlot===slot) return; B._tradeSlot=slot;
    setTimeout(function(){ try{ db.ref('zoo_cfg/botTrade').transaction(function(cur){ if(cur&&cur.slot>=slot) return; return {slot:slot,keys:(cur&&cur.keys)||[],at:Date.now()}; },
      function(err,ok,snap){ if(err||!ok) return; postOffer(db,snap.val()); },false); }catch(e){} }, Math.random()*15000);
  }
  // ── Chat: seltene, feste Sätze (für alle gleich, nur lokal angezeigt → kein Traffic, nicht gespeichert)
  var LINES={
    all:['Hallo zusammen! 👋','Schöner Tag im Zoo 🌞','Wer tauscht ein Tier? 🔄','Schaut mal am Marktplatz vorbei 🛒','Ich suche noch ein seltenes Tier 🦄','Nicht slappen, ich bin nur ein Bot 😅','Wie viele Tiere habt ihr schon?','Mein Zoo wächst langsam 🐾'],
    0:['Ich bin noch neu hier, habt ihr Tipps?','Wie bekomme ich schneller MT?','Mein erstes Tier ist so süss 🥰'],
    1:['Gerade ein neues Tier gekauft ✅','Hat jemand ein Glücksrad-Tipp?','Mein Gehege füllt sich 😄'],
    2:['Rebirth lohnt sich, glaubt mir 🔄','Kleiner Tipp: Tiere vergolden bringt viel 💰','Ich hab fast alle Tiere 😎']
  };
  var REPL=['Gute Frage! 🤔','Ich bin ein Bot, aber ich drücke die Daumen 🤞','Klingt gut 👍','Viel Spass im Zoo! 🐾','Schau mal am Marktplatz 🛒','Haha 😄'];
  var chatShown={};
  B.chatLog=[];
  function say(i,text,t){ var p=B.profile(i); B.chatLog.push({from:p.name,msg:text,at:t}); if(B.chatLog.length>12) B.chatLog.shift();
    try{ if(typeof ZChat!=='undefined'&&ZChat._addMsg) ZChat._addMsg(p.name,text,false,null,null,'bot'+t,t); }catch(e){} }
  function chatTick(){
    if(!active()||B.n<=0) return; var now=Date.now();
    for(var s=Math.floor(now/75000)-1;s<=Math.floor(now/75000);s++){
      var tt=s*75000+Math.floor(rnd(hash('ct'+s))*70000); if(tt>now||now-tt>20000||chatShown[s]) continue; chatShown[s]=1;
      if(rnd(hash('cp'+s))>0.4) continue; // selten
      var i=hash('cb'+s)%Math.max(1,B.n), p=B.profile(i), pool=LINES.all.concat(LINES[p.tier]||[]);
      say(i,pool[hash('cl'+s)%pool.length],tt);
    }
  }
  B.reply=function(msg){
    try{ var m=String(msg||'').toLowerCase(); if(B.n<=0||!active()) return; if(!/\?|hallo|hi\b|hey|bot|tausch|tipp|moin/.test(m)) return;
      var now=Date.now(); if(B._lastReply&&now-B._lastReply<20000) return; B._lastReply=now;
      var i=Math.floor(Math.random()*B.n); setTimeout(function(){ say(i,REPL[Math.floor(Math.random()*REPL.length)],Date.now()); },3000+Math.random()*3000);
    }catch(e){}
  };
  setInterval(function(){ try{ var t=Date.now(); carryUpdate(t); chatTick(); tradeTick(); }catch(e){} },1000);
  // Chat-Verlauf lädt neu (leert die Liste) → letzte Bot-Zeilen wieder anhängen; Fragen an Bots beantworten
  setInterval(function(){ try{ if(typeof ZChat==='undefined'||B._wrapped||!ZChat.send||!ZChat._loadHistory) return; B._wrapped=true;
    var os=ZChat.send, oh=ZChat._loadHistory;
    ZChat.send=function(){ var inp=document.getElementById('chat-in'), v=inp?inp.value:''; var r=os.apply(this,arguments); B.reply(v); return r; };
    ZChat._loadHistory=function(){ var r=oh.apply(this,arguments); setTimeout(function(){ var n=Date.now(); B.chatLog.forEach(function(l){ if(n-l.at<600000&&typeof ZChat._addMsg==='function') ZChat._addMsg(l.from,l.msg,false,null,null,'bot'+l.at,l.at); }); },1500); return r; };
  }catch(e){} },2000);
  // ── Konfiguration: zoo_cfg/bots {n} (Listener, winzig) + lokaler Cache
  function setN(n){ var _o=B.n; B.n=Math.max(0,Math.min(MAXN,parseInt(n,10)||0)); if(_o!==B.n){ try{ console.log('[Bots] Anzahl Computerspieler: '+_o+' → '+B.n); }catch(_){} } try{ localStorage.setItem('zbots_n',String(B.n)); }catch(e){} try{ var e=document.getElementById('zbots-cur'); if(e) e.textContent=B.n; }catch(_){} }
  try{ setN(localStorage.getItem('zbots_n')||0); }catch(e){}
  var tries=0, iv=setInterval(function(){
    var db=RT(); if(!db){ if(++tries>120) clearInterval(iv); return; }
    clearInterval(iv);
    try{ db.ref('zoo_cfg/bots').on('value',function(s){ var v=s&&s.val(); setN(v&&v.n!=null?v.n:0); steal=!(v&&v.steal===false); },function(){}); }catch(e){}
    try{ db.ref('zoo_cfg/botatk').on('value',function(s){ var nv=s&&s.val()||{}; try{ Object.keys(nv).forEach(function(k){ var o=ep[k], n=nv[k]; if(n&&(!o||o.id!==n.id||o.st!==n.st)){ console.log('[Bots] Diebstahl Bot '+k+' ('+((B.meshes[k]&&B.meshes[k].userData.botName)||'?')+'): '+n.st+' → Ziel '+n.target+(n.animal?' · Tier '+(n.animal.n||'?'):'')); } }); }catch(_){} ep=B.ep=nv; },function(){}); }catch(e){}
    try{ db.ref('zoo_cfg/botenc').on('value',function(s){ var v=s&&s.val()||{}, m={}; Object.keys(v).forEach(function(k){ m[k]=(v[k]&&v[k].l)||[]; }); stolen=m; },function(){}); }catch(e){}
    try{ var _t0=Date.now(); db.ref('zoo_cfg/perftest').on('value',function(s){ var v=s&&s.val(); if(!v||!v.at||v.at<_t0||B._ptAt===v.at) return; B._ptAt=v.at; var ad=false; try{ ad=!!(ZS.isAdmin||(window.ZAdmin&&ZAdmin._hasAccess)); }catch(e){} if(ad&&active()&&!document.hidden){ console.log('[Perf-test] Fernstart von der Diagnose-Seite'); B.perfTest(); } },function(){}); }catch(e){}
    try{ db.ref('zoo_cfg/botfx').on('value',function(s){ var v=s&&s.val()||{}; var m={}; Object.keys(v).forEach(function(k){ m[k]=v[k]&&v[k].s; }); fx=m; },function(){}); }catch(e){}
  },1000);
  requestAnimationFrame(frame);
  // ── Admin
  B.save=function(){
    var db=RT(); var inp=document.getElementById('zbots-n'); var st=document.getElementById('zbots-st');
    if(!db){ if(st) st.textContent='❌ Keine Cloud-Verbindung.'; return; }
    var n=Math.max(0,Math.min(MAXN,parseInt(inp&&inp.value,10)||0));
    db.ref('zoo_cfg/bots').set({n:n,steal:!!(document.getElementById('zbots-steal')||{checked:true}).checked,ts:Date.now()}).then(function(){ if(st) st.textContent='✅ Gespeichert: '+n+' Computerspieler (gilt sofort für alle).'; },function(e){ if(st) st.textContent='❌ '+(e&&e.message||e); });
  };
  // ── Leistungs-Test (Admin): misst FPS mit Bots / ohne Bots / mit weniger Effekten, damit man sieht, was ruckelt
  function sceneStats(){
    var g=ZGet(), o={}; try{ var r=g&&g.renderer; if(r&&r.info){ o.calls=r.info.render.calls; o.tris=r.info.render.triangles; o.geo=r.info.memory.geometries; o.tex=r.info.memory.textures; } }catch(e){}
    try{ var n=0,sp=0,mesh=0; g.scene.traverse(function(x){ n++; if(x.isSprite) sp++; else if(x.isMesh) mesh++; }); o.objs=n; o.sprites=sp; o.meshes=mesh; }catch(e){}
    try{ o.otherM=Object.keys(g.otherM||{}).length; o.otherEnc=Object.keys(g.otherEnc||{}).filter(function(k){ return k.indexOf('_animalMeshes')<0; }).length; o.dropped=(g.droppedAnimals||[]).length; }catch(e){}
    return o;
  }
  function measure(ms){
    return new Promise(function(res){ var d=[],last=0,t0=performance.now();
      function f(ts){ if(last) d.push(ts-last); last=ts; if(performance.now()-t0<ms) requestAnimationFrame(f); else { d.sort(function(a,b){return a-b;}); var sum=d.reduce(function(a,b){return a+b;},0); res({fps:d.length?1000*d.length/sum:0,p95:d.length?d[Math.floor(d.length*0.95)]:0,max:d.length?d[d.length-1]:0,n:d.length}); } }
      requestAnimationFrame(f); });
  }
  function sleep(ms){ return new Promise(function(r){ setTimeout(r,ms); }); }
  B.perfTest=async function(){
    var out=document.getElementById('zbots-out'), st=document.getElementById('zbots-st'); var L=[];
    function say(t){ try{ console.log('[Perf-test] '+t); }catch(e){} }
    if(document.hidden){ say('abgebrochen: Tab nicht sichtbar'); return; } if(B._pt) return; B._pt=true;
    var g=ZGet(), LK=window.ZLook, n0=B.n, q0=LK&&LK.q;
    try{
      L.push('=== MISCHA LEISTUNGS-TEST (v862) ===','Zeit: '+new Date().toISOString(),'Gerät: '+(navigator.userAgent||'').slice(0,90),'Bots gesetzt: '+n0+' · Look: '+(LK&&LK.info?LK.info():'?'),'Fenster: '+innerWidth+'x'+innerHeight+' · DPR '+devicePixelRatio,'');
      var steps=[['A) so wie jetzt',function(){}],
        ['B) Bots lokal weg',function(){ B.n=0; }],
        ['C) ohne Bots + Look „Normal"',function(){ if(LK&&LK.set) LK.set('normal'); }],
        ['D) ohne Bots + Look „Klassisch"',function(){ if(LK&&LK.set) LK.set('classic'); }]];
      for(var k=0;k<steps.length;k++){
        say('Messe '+steps[k][0]+' … ('+(k+1)+'/4)'); steps[k][1](); await sleep(2500);
        var m=await measure(5000), ss=sceneStats();
        L.push(steps[k][0]+': '+m.fps.toFixed(1)+' FPS · p95-Frame '+m.p95.toFixed(0)+' ms · max '+m.max.toFixed(0)+' ms · Draw-Calls '+ss.calls+' · Dreiecke '+ss.tris+' · Geometrien '+ss.geo+' · Texturen '+ss.tex+' · Objekte '+ss.objs+' (Sprites '+ss.sprites+', Meshes '+ss.meshes+') · Spielerfiguren '+ss.otherM+' · Spieler-Gehege '+ss.otherEnc+' · fallende Tiere '+ss.dropped);
      }
    }catch(e){ L.push('Fehler: '+(e&&e.message||e)); }
    B.n=n0; try{ if(LK&&LK.set&&q0) LK.set(q0); }catch(e){}
    L.push('','Zurückgesetzt: Bots '+B.n+', Look '+(q0||'?'),'=== ENDE ===');
    B._pt=false; var txt=L.join('\n'); try{ console.log('[Perf-test] '+txt.replace(/\n+/g,' | ')); }catch(e){}
    try{ var db=RT(); if(db){ var id=(window.getDeviceId&&window.getDeviceId())||'dev'; db.ref('zoo_perf/'+id).set({ts:Date.now(),player:(ZS&&ZS.player)||'?',text:txt}).catch(function(){}); } }catch(e){}
  };
  B.copy=function(){ var ta=document.getElementById('zbots-out'); if(!ta) return; ta.select(); try{ navigator.clipboard.writeText(ta.value); }catch(e){ try{ document.execCommand('copy'); }catch(_){} } var st=document.getElementById('zbots-st'); if(st) st.textContent='📋 Kopiert.'; };
  B.adminHTML=function(){
    var rows=''; for(var i=0;i<MAXN;i++){ var p=B.profile(i); rows+='<div style="font-size:.7rem;opacity:.85">'+(i+1)+'. '+p.name+' · Lv '+p.level+' · '+p.rank+'</div>'; }
    return '<div style="font-size:.78rem;line-height:1.45;color:#fff;padding:6px">'
      +'Computerspieler sind für alle an derselben Stelle (aus der Uhrzeit berechnet, kein Traffic pro Bot). Sie tragen 🤖 im Namen, laufen herum und haben Level.<br><br>'
      +'Anzahl (0–'+MAXN+'): <input id="zbots-n" type="number" min="0" max="'+MAXN+'" value="'+B.n+'" style="width:60px"> '
      +'<button class="padmin-btn" style="background:#2980B9" onclick="ZBots.save()">💾 Speichern</button> '
      +'<button class="padmin-btn" style="background:#C0392B" onclick="document.getElementById(\'zbots-n\').value=0;ZBots.save()">⏹ Alle weg</button>'
      +'<div style="margin-top:8px"><label><input id="zbots-steal" type="checkbox" '+(steal?'checked':'')+'> Bots dürfen Spielern gute Tiere abnehmen (anrennen, slappen, wegtragen)</label></div>'
      +'<div style="margin-top:6px">Aktuell aktiv: <b id="zbots-cur">'+B.n+'</b></div><div id="zbots-st" style="color:#ffd54f;margin-top:4px"></div>'
      +'<div style="margin-top:8px;opacity:.7;font-size:.72rem">Tests (Traffic, Leistung) und Bot-Status stehen auf der Diagnose-Seite (Tab „🧪 Tests & Bots“). Bot-Ereignisse werden automatisch ins Log geschrieben.</div>'
      +'<details style="margin-top:8px"><summary>Alle möglichen Bots</summary>'+rows+'</details></div>';
  };
})();
