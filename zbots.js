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
  var SPEED=3.4; // Einheiten/s (etwa wie ein gehender Spieler)
  B.posAt=function(i,t){
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
      m[p.name]={name:p.name,char:p.char,color:p.color,slotIdx:sl,enc:B.encFor(i),isBot:true,x:0,z:0,rank:{name:'Bot · Lv '+p.level,color:'#9fb4c7'}}; }
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
            var p=B.posAt(i,t);
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
  // ── Tragen: fester Zeitplan (70-s-Takt je Bot), alle sehen dasselbe. Slap = Tier fällt (zoo_dropped) + gemeinsamer Cooldown
  function animals(){ try{ return (typeof ANIMALS!=='undefined')?ANIMALS:null; }catch(e){ return null; } }
  var fx={};  // Bot-Nr. → Takt-Nummer, in der ihm das Tier schon abgenommen wurde
  function slotOfT(i,t){ return Math.floor((t+i*9000)/70000); }
  B.carryAt=function(i,t){
    var s=slotOfT(i,t), ph=(t+i*9000)-s*70000; if(ph>60000) return null;
    if(rnd(hash('c'+i+'_'+s))>=0.5) return null; if(fx[i]===s) return null;
    var A=animals(); if(!A||!A.length) return null; var lv=B.profile(i).level, hi=Math.min(A.length-1,Math.round(5+lv*0.8));
    return A[Math.floor(rnd(hash('ca'+i+'_'+s))*(hi+1))]||null;
  };
  function idxOf(name){ for(var i=0;i<B.meshes.length;i++){ if(B.meshes[i].userData.botName===name) return i; } return -1; }
  B.opOf=function(name){ var i=idxOf(name); if(i<0) return null; var t=Date.now(), p=B.posAt(i,t), a=B.carryAt(i,t);
    return {name:name,x:p.x,z:p.z,_heading:p.hd,carrying:a?{e:a.e,n:a.n}:null,isBot:true}; };
  B.carryMap=function(){ var m={}; if(!active()) return m; for(var i=0;i<B.meshes.length;i++){ var n=B.meshes[i].userData.botName, o=B.opOf(n); if(o&&o.carrying) m[n]=o; } return m; };
  B.onSlap=function(name){
    var i=idxOf(name); if(i<0) return; var t=Date.now(), a=B.carryAt(i,t); if(!a) return;
    var s=slotOfT(i,t), db=RT(), g=ZGet(); if(!db) return; var pos=B.posAt(i,t);
    db.ref('zoo_cfg/botfx/'+i).transaction(function(cur){ if(cur&&cur.s===s) return; return {s:s,at:t}; },function(err,ok){
      if(err||!ok) return; fx[i]=s;
      try{
        var ref=db.ref('zoo_dropped').push(); var d={animal:Object.assign({},a),shiny:null,traits:[],x:pos.x+1.5,z:pos.z+1.5,droppedBy:name,slappedBy:(ZS&&ZS.player)||null,createdAt:t};
        ref.set(d).catch(function(){});
        try{ if(g&&g._toastBot) g._toastBot(); else if(window.ZP&&ZP.toast) ZP.toast('🎁 '+name+' hat '+a.e+' '+a.n+' fallen gelassen – schnell fangen!',3500); }catch(e){}
      }catch(e){}
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
  function setN(n){ B.n=Math.max(0,Math.min(MAXN,parseInt(n,10)||0)); try{ localStorage.setItem('zbots_n',String(B.n)); }catch(e){} try{ var e=document.getElementById('zbots-cur'); if(e) e.textContent=B.n; }catch(_){} }
  try{ setN(localStorage.getItem('zbots_n')||0); }catch(e){}
  var tries=0, iv=setInterval(function(){
    var db=RT(); if(!db){ if(++tries>120) clearInterval(iv); return; }
    clearInterval(iv);
    try{ db.ref('zoo_cfg/bots').on('value',function(s){ var v=s&&s.val(); setN(v&&v.n!=null?v.n:0); },function(){}); }catch(e){}
    try{ db.ref('zoo_cfg/botfx').on('value',function(s){ var v=s&&s.val()||{}; var m={}; Object.keys(v).forEach(function(k){ m[k]=v[k]&&v[k].s; }); fx=m; },function(){}); }catch(e){}
  },1000);
  requestAnimationFrame(frame);
  // ── Admin
  B.save=function(){
    var db=RT(); var inp=document.getElementById('zbots-n'); var st=document.getElementById('zbots-st');
    if(!db){ if(st) st.textContent='❌ Keine Cloud-Verbindung.'; return; }
    var n=Math.max(0,Math.min(MAXN,parseInt(inp&&inp.value,10)||0));
    db.ref('zoo_cfg/bots').set({n:n,ts:Date.now()}).then(function(){ if(st) st.textContent='✅ Gespeichert: '+n+' Computerspieler (gilt sofort für alle).'; },function(e){ if(st) st.textContent='❌ '+(e&&e.message||e); });
  };
  B.adminHTML=function(){
    var rows=''; for(var i=0;i<MAXN;i++){ var p=B.profile(i); rows+='<div style="font-size:.7rem;opacity:.85">'+(i+1)+'. '+p.name+' · Lv '+p.level+' · '+p.rank+'</div>'; }
    return '<div style="font-size:.78rem;line-height:1.45;color:#fff;padding:6px">'
      +'Computerspieler sind für alle an derselben Stelle (aus der Uhrzeit berechnet, kein Traffic pro Bot). Sie tragen 🤖 im Namen, laufen herum und haben Level.<br><br>'
      +'Anzahl (0–'+MAXN+'): <input id="zbots-n" type="number" min="0" max="'+MAXN+'" value="'+B.n+'" style="width:60px"> '
      +'<button class="padmin-btn" style="background:#2980B9" onclick="ZBots.save()">💾 Speichern</button> '
      +'<button class="padmin-btn" style="background:#C0392B" onclick="document.getElementById(\'zbots-n\').value=0;ZBots.save()">⏹ Alle weg</button>'
      +'<div style="margin-top:6px">Aktuell aktiv: <b id="zbots-cur">'+B.n+'</b></div><div id="zbots-st" style="color:#ffd54f;margin-top:4px"></div>'
      +'<details style="margin-top:8px"><summary>Alle möglichen Bots</summary>'+rows+'</details></div>';
  };
})();
