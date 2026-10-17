/* zevents3.js — 🕵️ Verräter im Zoo (Rollenspiel mit Konferenz & Abstimmung) und 🧟 Zombie-Ausbruch.
 * Realtime Database. Nur auf zoo.html. Nutzt ZS, ZG, ZP, ZHearts, ZMusic, State, _rtdb, SLAPS.
 */
(function(){
  if(window.ZEvt3) return;
  const RT=()=> (typeof _rtdb!=='undefined'&&_rtdb&&typeof State!=='undefined'&&State._useCloud())?_rtdb:null;
  const K=n=>String(n||'').toLowerCase().replace(/[.#$\[\]]/g,'_');
  const me=()=>(typeof ZS!=='undefined'&&ZS&&ZS.player)||'';
  const inZoo=()=>{ try{ return !!(typeof ZG!=='undefined'&&ZG&&ZG.cam&&ZG.scene&&ZS&&ZS.zoo&&me()); }catch(e){ return false; } };
  const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const toast=(m,ms)=>{ try{ ZP.toast(m,ms||3000); }catch(e){} };
  const big=(t,c,ms)=>{ try{ ZG._bigText(t,c,ms||2500); }catch(e){} };
  const addMT=v=>{ try{ ZS.zoo.mt=(ZS.zoo.mt||0)+v; ZS.save&&ZS.save(); ZG._updHUD&&ZG._updHUD(); }catch(e){} };
  const seen=(k,id)=>{ try{ return localStorage.getItem('zevt3_'+K(me())+'_'+k)===String(id); }catch(e){ return false; } };
  const mark=(k,id)=>{ try{ localStorage.setItem('zevt3_'+K(me())+'_'+k,String(id)); }catch(e){} };
  const hash=s=>{ let h=2166136261; s=String(s); for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; };
  const hud=(id,html,css)=>{ let e=document.getElementById(id); if(!e){ e=document.createElement('div'); e.id=id; e.style.cssText='position:fixed;left:50%;transform:translateX(-50%);z-index:560;pointer-events:none;text-align:center;font:800 .82rem Arial,sans-serif;color:#fff;text-shadow:0 1px 3px #000;'+(css||''); document.body.appendChild(e); } if(e.innerHTML!==html) e.innerHTML=html; return e; };
  const hudOff=id=>{ const e=document.getElementById(id); if(e) e.remove(); };
  const mmss=ms=>{ ms=Math.max(0,ms); const s=Math.ceil(ms/1000); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); };
  // Glück stapelbar: Dauer wird an die Restzeit angehängt, Faktor = höchster
  const note=t=>{ try{ if(window.ZEvt&&ZEvt.note) ZEvt.note(t); else toast(t,5000); }catch(e){ toast(t,5000); } };
  const stackLuck=(mult,mins)=>{ try{ const z=ZS.zoo, now=Date.now(); const act=z.adminLuckExp>now; const base=act?z.adminLuckExp:now;
    z.adminLuckMult=Math.max(act?(z.adminLuckMult||0):0,mult); z.adminLuckExp=base+mins*60000; ZS.save&&ZS.save(); ZG._updHUD&&ZG._updHUD(); }catch(e){} };

  const MUSIC={
    // Hardstyle/Rawstyle-Gefühl: 150 BPM, Kick auf jedem Schlag, Offbeat-Bass, kreischender Lead, dunkles Fis-Moll
    zombie:{bpm:150,root:42,scale:[0,2,3,5,7,8,10],wave:'sawtooth',drive:true,bassEvery:2,riff:[0,-1,0,-1,3,-1,2,-1,0,-1,0,-1,5,-1,4,3],kick:'x...x...x...x...',snare:'....x.......x...',hat:'..x...x...x...x.'},
    // 5 Admin-Lieder (eigene Synth-Kompositionen, ohne Gesang) — Klang/Takt/Akkorde stehen in ZMusic._playSong
    party:{n:'Party-Alarm',e:'🎉',style:'party',bpm:128},
    mystery:{n:'Geheimnis',e:'🕵️',style:'mystery',bpm:84,echo:true},
    hero:{n:'Helden-Fanfare',e:'🏆',style:'hero',bpm:108},
    chase:{n:'Verfolgungsjagd',e:'🏃',style:'chase',bpm:172},
    disco:{n:'Disco-Fieber',e:'🪩',style:'disco',bpm:116},
    // Treibender Synth-Pop mit Moll-Arpeggio und Klatschen, 122 BPM
    sus:{bpm:122,root:45,scale:[0,2,3,5,7,8,10],wave:'square',bassEvery:2,riff:[0,2,4,2,0,2,4,7,0,2,4,2,5,4,2,0],kick:'x...x...x...x...',snare:'....x.......x...',hat:'x.x.x.x.x.x.x.x.'}
  };

  const E=window.ZEvt3={
    st:{}, role:null, MUSIC, _started:false, _bodies:{}, _hid:{}, _marks:{},
    init(){
      if(this._iv) return;
      this._iv=setInterval(()=>{
        if(this._started){ this._loop(); return; }
        if(!inZoo()||!RT()) return;
        this._started=true; this._listen();
      },1000);
    },
    _listen(){
      const r=RT();
      r.ref('zoo_traitor').on('value',s=>{ this.st.t=s.val(); this._tChanged(); });
      r.ref('zoo_traitor_roles/'+K(me())).on('value',s=>{ this.role=s.val(); this._tChanged(); });
      r.ref('zoo_zombie').on('value',s=>{ this.st.z=s.val(); this._zChanged(); });
      r.ref('zoo_music').on('value',s=>{ this.st.m=s.val(); this._musChanged(); });
    },
    _loop(){ try{ this._tLoop(); this._zLoop(); this._enforceEq(); this._musLoop(); }catch(e){ console.log('[ZEvt3-debug] '+e.message); } },

    /* ─── gemeinsame Hilfen ─── */
    _emo(emo,sz){
      // Textur pro Emoji nur einmal erzeugen (spart Speicher bei vielen Meteoren/Markierungen)
      const cache=(window.__zevtTex=window.__zevtTex||{});
      let t=cache[emo];
      if(!t){ const c=document.createElement('canvas'); c.width=c.height=128; const x=c.getContext('2d'); x.font='96px serif'; x.textAlign='center'; x.textBaseline='middle'; x.fillText(emo,64,70); t=cache[emo]=new THREE.CanvasTexture(c); }
      const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false})); s.scale.set(sz,sz,1); return s;
    },
    _online(name){ return name===me()||!!(ZG.otherPl&&ZG.otherPl[name]); },
    _music(on,key,mins){ try{ if(on){ if(!ZMusic.on) ZMusic.play((mins||10)*60000,'boss',MUSIC[key]); } else if(ZMusic.mode==='boss'&&ZMusic.on) ZMusic.stop(); }catch(e){} },
    _fx(id,col){ let e=document.getElementById(id); if(!e){ e=document.createElement('div'); e.id=id; e.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:300;background:'+col; document.body.appendChild(e); } },
    _tint(on,id,col){ if(on) this._fx(id,col); else hudOff(id); },
    _enforceEq(){
      const z=ZS.zoo; if(!z) return; const want=this._wantEq(); if(!want) return;
      if(want==='none'&&z.eq!=='none'){ z.eq='none'; try{ZG._updWBar();}catch(e){} }
      else if(want==='basic'&&z.eq!=='basic'&&z.eq!=='none'){ z.eq='basic'; try{ZG._updWBar();}catch(e){} }
    },
    _wantEq(){
      const t=this.st.t, zb=this.st.z;
      if(t&&t.state!=='over'&&this.role&&this.role.id===t.id){ if(!t.alive||!t.alive[K(me())]) return 'none'; return this.role.r==='T'?'basic':'none'; }
      if(zb&&zb.state==='run'&&zb.total&&(zb.alive||zb.zombies)){ const k=K(me()); if(zb.zombies&&zb.zombies[k]) return 'basic'; if(zb.alive&&zb.alive[k]) return 'none'; }
      return null;
    },
    /* Tipp auf den Bildschirm (aus ZG.slap, auch ohne Waffe): Leiche melden */
    tapHook(cx,cy){
      try{
        const t=this.st.t; if(!t||t.state!=='run'||Date.now()<t.startAt) return false;
        const k=K(me()); if(!t.alive||!t.alive[k]||!this.role||this.role.id!==t.id) return false;
        const metas=Object.values(this._bodies).filter(b=>b.mesh); if(!metas.length) return false;
        if(!this._rc) this._rc=new THREE.Raycaster();
        this._rc.setFromCamera({x:(cx/window.innerWidth)*2-1,y:-(cy/window.innerHeight)*2+1},ZG.cam);
        const hit=this._rc.intersectObjects(metas.map(b=>b.mesh),true); if(!hit.length) return false;
        let o=hit[0].object; while(o&&!o.userData.bodyKey) o=o.parent; if(!o) return false;
        if(hit[0].distance>16){ toast('❗ Näher an die Leiche herangehen!',1500); return true; }
        this._report(o.userData.bodyKey);
        return true;
      }catch(e){ return false; }
    },
    /* Slap auf einen Spieler (aus ZG._slapNearby) — true = vom Event behandelt */
    slapTarget(target,sl,dist){
      const k=K(me()), tk=K(target);
      const t=this.st.t;
      if(t&&t.state!=='over'&&this.role&&this.role.id===t.id){
        if(!t.alive||!t.alive[k]){ toast('👻 Als Geist kannst du niemanden berühren.',1800); return true; }
        if(Date.now()<t.startAt){ toast('⏳ Es geht gleich los!',1200); return true; }
        if(t.state==='meeting'){ toast('🚨 Gerade ist eine Besprechung!',1500); return true; }
        if(this.role.r!=='T'){ toast('🧑‍🚀 Neutrale Slap — du kannst niemandem schaden. Finde den Verräter!',2200); return true; }
        if(!t.alive[tk]){ return true; }
        if(!sl||sl.id!=='basic'){ toast('Als Verräter nur mit der Basic-Slap.',1500); return true; }
        this._kill(target,tk); return true;
      }
      const zb=this.st.z;
      if(zb&&zb.state==='run'&&zb.alive&&(zb.alive[k]||(zb.zombies&&zb.zombies[k]))){
        if(Date.now()<zb.startAt){ toast('⏳ Es geht gleich los!',1200); return true; }
        if(!(zb.zombies&&zb.zombies[k])){ toast('🧍 Menschen können nicht slappen — renne weg!',1800); return true; }
        if(!zb.alive[tk]){ toast('Der ist schon ein Zombie.',1200); return true; }
        if(dist>9){ toast('❗ Näher ran, um zu infizieren!',1200); return true; }
        this._infect(target,tk); return true;
      }
      return false;
    },

    /* ═══════════ 🕵️ VERRÄTER ═══════════ */
    adminTraitorStart(includeSelf,mins){
      const r=RT(); if(!r){ toast('❌ Keine Verbindung'); return; }
      const names=[...new Set([...Object.keys(ZG.otherPl||{}),...(includeSelf?[me()]:[])].filter(Boolean))];
      if(names.length<1){ note('❗ Keine Spieler gefunden — hake „ich spiele mit“ an oder warte, bis andere im Zoo aktiv sind (nur Spieler im selben Zoo, die in den letzten 10 s aktiv waren, werden erkannt).'); return; }
      const id=String(Date.now()); const tn=names[Math.floor(Math.random()*names.length)];
      const alive={}; names.forEach(n=>alive[K(n)]=n);
      const roles={}; names.forEach(n=>roles[K(n)]={id,r:n===tn?'T':'C'});
      const fail=e=>note('❌ Verräter-Start fehlgeschlagen: '+((e&&e.message)||e));
      Promise.all([
        r.ref('zoo_traitor_secret').set({id,key:K(tn)}),
        r.ref('zoo_traitor_chat').set(null),
        r.ref('zoo_traitor_roles').set(roles)
      ]).then(()=>r.ref('zoo_traitor').set({id,state:'run',startAt:Date.now()+16000,endAt:Date.now()+16000+Math.max(1,mins||5)*60000,alive,dead:{},total:names.length,names:alive}))
        .then(()=>note('🕵️ Verräter-Spiel gestartet mit '+names.length+' Spielern: '+names.join(', ')+(includeSelf?'':' (du schaust als Admin zu)')+'. Die Rollen erscheinen jetzt bei allen.'))
        .catch(fail);
    },
    adminTraitorStop(){ const r=RT(); if(r){ r.ref('zoo_traitor').set(null); r.ref('zoo_traitor_roles').set(null); r.ref('zoo_traitor_secret').set(null); r.ref('zoo_traitor_chat').set(null); } toast('⏹️ Verräter-Spiel beendet'); },
    _kill(target,tk){
      const r=RT(); if(!r) return; const m=ZG.otherM&&ZG.otherM[target]; const x=m?m.position.x:0, z=m?m.position.z:0;
      r.ref('zoo_traitor').transaction(c=>{
        if(!c||c.state!=='run'||!c.alive||!c.alive[tk]) return;
        const nm=c.alive[tk]; delete c.alive[tk]; c.dead=c.dead||{}; c.dead[tk]={n:nm,x,z,rep:0};
        if(Object.keys(c.alive).length<=((c.total||0)<=3?1:2)){ c.state='over'; c.winner='traitor'; c.why='Es sind nicht mehr genug Besatzungsmitglieder übrig'; }
        return c;
      });
      big('🔪','#ff3b3b',900); toast('🤫 '+target+' ausgeschaltet — verschwinde unauffällig!',2500);
    },
    _report(bodyKey){
      const r=RT(); if(!r) return; const now=Date.now();
      r.ref('zoo_traitor_chat').set(null);
      r.ref('zoo_traitor').transaction(c=>{
        if(!c||c.state!=='run'||!c.dead||!c.dead[bodyKey]||c.dead[bodyKey].rep) return;
        c.dead[bodyKey].rep=1; c.state='meeting';
        c.meeting={id:String(now),by:me(),body:c.dead[bodyKey].n,start:now,endAt:now+90000,votes:{}};
        return c;
      });
    },
    _tChanged(){
      const t=this.st.t;
      if(!t){ this._tClear(); return; }
      if(t.id!==this._tId){ this._tId=t.id; this._tOverAt=0; this._tClear(true); }
      if(this.role&&this.role.id===t.id&&!seen('trole',t.id)){ mark('trole',t.id); this._reveal(t); this._music(true,'sus',(t.endAt-Date.now())/60000+25);
        const isT=this.role.r==='T'; big(isT?'🕵️ DU BIST DER VERRÄTER':'🧑‍🚀 DU BIST BESATZUNG',isT?'#ff5a4a':'#7ff0ff',3500);
        toast(isT?'🕵️ Du bist der VERRÄTER — schalte die Besatzung unauffällig aus!':'🧑‍🚀 Du bist BESATZUNG — finde den Verräter unter uns!',7000); }
      if(this.role&&this.role.id===t.id){
        const k=K(me()), was=this._wasAlive; const now=!!(t.alive&&t.alive[k]);
        if(was===true&&!now&&t.state!=='over') this._becomeGhost();
        this._wasAlive=now;
      }
      if(t.msg&&!seen('tmsg',t.msg.id)){ mark('tmsg',t.msg.id); if(this.role&&this.role.id===t.id){ big(t.msg.big||'🗳️','#ffd166',3500); toast(t.msg.text,6000); } }
      if(t.state==='meeting'&&t.meeting) this._meetingUI(t); else this._meetingOff();
      if(t.state!=='over') this._tSaw=t.id;
      if(t.state==='over'&&!seen('tover',t.id)){ mark('tover',t.id); if((this.role&&this.role.id===t.id)||this._tSaw===t.id) this._tOver(t); }
      this._bodiesSync(t);
    },
    _reveal(t){
      const T=this.role.r==='T'; const col=T?'#ff3b3b':'#7ff0ff';
      const total=t.total||0; const names=Object.values(t.names||{});
      const row=names.slice(0,14).map(n=>'<span style="display:inline-block;margin:3px 6px;font-size:.7rem;color:'+(T&&n!==me()?'#aaa':'#ddd')+'">'+(n===me()?'⭐':'👤')+' '+esc(n)+'</span>').join('');
      const ov=document.createElement('div'); ov.id='ztreveal';
      ov.style.cssText='position:fixed;inset:0;z-index:99100;background:radial-gradient(ellipse at 50% 70%,'+(T?'#5a0000':'#06323a')+' 0,#000 70%);color:#fff;font-family:Arial,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:16px;gap:8px;overflow:auto';
      ov.innerHTML='<div style="font-size:clamp(2rem,9vw,3.4rem);font-weight:900;letter-spacing:2px;color:'+col+';text-shadow:0 0 18px '+col+'">'+(T?'VERRÄTER':'BESATZUNG')+'</div>'
        +'<div style="font-size:1rem">'+(T?'Du bist der <b style="color:#ff6b6b">Verräter</b> — niemand weiss es!':'Unter uns ist <b style="color:#ff6b6b">1 Verräter</b> …')+'</div>'
        +'<div style="font-size:3.4rem;filter:drop-shadow(0 0 12px '+col+')">'+(T?'🕵️':'🧑‍🚀')+'</div>'
        +'<div style="max-width:420px;font-size:.86rem;line-height:1.5;background:rgba(255,255,255,.08);border-radius:12px;padding:10px 14px;text-align:left">'
        +(T?'🔪 Slappe die Besatzung mit der <b>Basic-Slap</b> — wer getroffen wird, fällt um und wird zum <b>Geist</b> (unsichtbar).<br>👀 Lass dich nicht beim Slappen erwischen!<br>🚨 Findet jemand eine Leiche, gibt es eine Besprechung mit Abstimmung.<br>🏆 Überlebst du <b>5 Minuten</b> (oder bleibt niemand übrig), bekommst du <b>×50 Glück · 10 Min</b> (stapelbar).'
          :'🧑‍🚀 Du hast nur die <b>neutrale Slap</b> (kann nicht schaden).<br>💀 Findest du eine <b>Leiche</b>, tippe sie an → alle kommen zur <b>Besprechung</b>.<br>💬 Diskutiert im Chat, wer es war, und <b>stimmt ab</b>.<br>🏆 Richtig gewählt = alle von der Besatzung bekommen <b>×20 Glück · 20 Min</b> (stapelbar).<br>⏱️ Schafft ihr es nicht in 5 Minuten, gewinnt der Verräter!')
        +'</div><div style="font-size:.7rem;opacity:.7">'+total+' Spieler</div><div style="max-width:440px">'+row+'</div>'
        +'<button id="ztreveal-ok" style="margin-top:6px;padding:10px 26px;border:0;border-radius:12px;background:'+col+';color:#000;font-weight:900;font-size:1rem;cursor:pointer">Los geht\'s!</button>';
      document.body.appendChild(ov);
      const close=()=>{ ov.remove(); };
      ov.querySelector('#ztreveal-ok').onclick=close; setTimeout(close,18000);
    },
    _becomeGhost(){
      big('💀 Du wurdest ausgeschaltet!','#ff3b3b',2800);
      try{ ZG._deathAt=Date.now(); setTimeout(()=>{ ZG._deathAt=0; },2200); }catch(e){}
      setTimeout(()=>{ toast('👻 Du bist jetzt ein Geist — niemand kann dich sehen. Schau zu und hilf nicht beim Chat.',6000); this._fx('ztghost','rgba(120,140,255,.14)'); },2400);
    },
    _bodiesSync(t){
      const dead=t.dead||{};
      Object.keys(this._bodies).forEach(k=>{ if(!dead[k]||dead[k].rep||t.state==='over'){ const b=this._bodies[k]; if(b&&b.mesh){ try{ZG.scene.remove(b.mesh);}catch(e){} } delete this._bodies[k]; } });
      if(t.state==='over') return;
      Object.keys(dead).forEach(k=>{
        if(dead[k].rep||this._bodies[k]) return;
        const d=dead[k]; const g=new THREE.Group(); const hue=hash(d.n)%360;
        const col=new THREE.Color('hsl('+hue+',65%,50%)');
        const body=new THREE.Mesh(new THREE.CylinderGeometry(.38,.38,1.3,10),new THREE.MeshLambertMaterial({color:col})); body.rotation.z=Math.PI/2; body.position.y=.4; g.add(body);
        const head=new THREE.Mesh(new THREE.SphereGeometry(.33,10,8),new THREE.MeshLambertMaterial({color:0xf1c27d})); head.position.set(.95,.42,0); g.add(head);
        const sk=this._emo('💀',1.1); sk.position.y=1.5; g.add(sk);
        g.position.set(d.x,0,d.z); g.rotation.y=(hash(k)%628)/100; g.userData.bodyKey=k; ZG.scene.add(g);
        this._bodies[k]={mesh:g};
      });
    },
    _tClear(keep){
      Object.values(this._bodies).forEach(b=>{ try{ZG.scene.remove(b.mesh);}catch(e){} }); this._bodies={};
      this._meetingOff(); hudOff('zthud'); hudOff('ztghost'); hudOff('ztreveal');
      this._restoreHidden(); this._wasAlive=undefined;
      if(!keep){ this._tId=null; this._music(false); }
    },
    _tLoop(){
      const t=this.st.t; if(!t) return;
      this._tAdminCheck(t);
      if(!this.role||this.role.id!==t.id){
        if(ZS.isAdmin){ const d=Object.keys(t.dead||{}).length; hud('zthud','👁️ Admin-Ansicht · 🕵️ Verräter: '+({run:'läuft',meeting:'🚨 Besprechung',over:'vorbei'}[t.state]||t.state)+' · '+Object.keys(t.alive||{}).length+'/'+(t.total||0)+' am Leben · '+d+' Leichen'+(t.state!=='over'?' · ⏱ '+mmss(t.endAt-Date.now()):''),'top:160px;background:rgba(0,0,0,.6);padding:5px 12px;border-radius:12px'); }
        return;
      }
      const k=K(me()); const alive=!!(t.alive&&t.alive[k]);
      // Geister für alle anderen unsichtbar machen
      const dead=t.dead||{}; const deadNames=new Set(Object.values(dead).map(d=>d.n));
      Object.keys(ZG.otherM||{}).forEach(n=>{ const m=ZG.otherM[n]; if(!m) return;
        if(deadNames.has(n)&&t.state!=='over'){ if(m.visible!==false){ m.visible=false; this._hid[n]=1; } }
        else if(this._hid[n]){ m.visible=true; delete this._hid[n]; } });
      if(t.state==='over'){ this._restoreHidden(); }
      const left=t.state==='over'?'':('⏱ '+mmss(t.endAt-Date.now()));
      const role=this.role.r==='T'?'🕵️ Verräter':'🧑‍🚀 Besatzung';
      const n=Object.keys(t.alive||{}).length;
      if(t.state==='over'){ if(!this._tOverAt) this._tOverAt=Date.now(); }
      if(t.state==='over'&&Date.now()-this._tOverAt>5000) hudOff('zthud');
      else if(t.state==='over') hud('zthud','🏁 Spiel vorbei','top:160px;background:rgba(0,0,0,.6);padding:5px 12px;border-radius:12px');
      else if(Date.now()<t.startAt) hud('zthud','Gleich geht\'s los … '+Math.ceil((t.startAt-Date.now())/1000)+'s','top:160px;background:rgba(0,0,0,.6);padding:5px 12px;border-radius:12px');
      else hud('zthud',(alive?role:'👻 Geist')+' · '+n+' am Leben · '+left+(alive&&this.role.r!=='T'?'<br><span style="font-weight:600;font-size:.72rem">Tippe eine Leiche 💀 an, um sie zu melden</span>':''),'top:160px;background:rgba(0,0,0,.6);padding:5px 12px;border-radius:12px;border:2px solid '+(this.role.r==='T'?'#ff3b3b':'#7ff0ff'));
    },
    _tAdminCheck(t){
      if(ZS.isAdmin&&!this._tBusy){
        if(t.state==='run'&&Date.now()>t.endAt+300) this._tAdmin('time',t);
        else if(t.state==='meeting'&&t.meeting){
          const aliveOnline=Object.keys(t.alive||{}).filter(kk=>this._online(t.alive[kk]));
          const votes=Object.keys(t.meeting.votes||{}).filter(kk=>t.alive&&t.alive[kk]);
          if(Date.now()>t.meeting.endAt+300||(aliveOnline.length&&aliveOnline.every(kk=>votes.includes(kk)))) this._tAdmin('tally',t);
        }
      }
    },
    _restoreHidden(){ Object.keys(this._hid).forEach(n=>{ const m=ZG.otherM&&ZG.otherM[n]; if(m) m.visible=true; }); this._hid={}; },
    _tAdmin(kind,t0){
      const r=RT(); if(!r) return; this._tBusy=true; const done=()=>{ this._tBusy=false; };
      r.ref('zoo_traitor_secret').once('value').then(sn=>{
        const sec=sn.val()||{};
        return r.ref('zoo_traitor').transaction(c=>{
          if(!c||c.id!==t0.id) return;
          const now=Date.now();
          if(kind==='time'){ if(c.state!=='run'||now<=c.endAt) return; c.state='over'; c.winner='traitor'; c.why='Die Zeit ist abgelaufen'; c.traitor=(c.names||{})[sec.key]||''; return c; }
          if(c.state!=='meeting'||!c.meeting) return;
          const cnt={}; Object.keys(c.meeting.votes||{}).forEach(v=>{ if(!c.alive||!c.alive[v]) return; const tg=c.meeting.votes[v]; if(tg&&tg!=='skip') cnt[tg]=(cnt[tg]||0)+1; });
          const ks=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a]); const top=ks.length&&(ks.length===1||cnt[ks[0]]>cnt[ks[1]])?ks[0]:null;
          const dur=now-c.meeting.start; c.endAt+=dur;
          if(top&&top===sec.key){ c.state='over'; c.winner='crew'; c.traitor=(c.names||{})[sec.key]||''; c.why='Der Verräter wurde enttarnt'; c.meeting=null; return c; }
          c.msg={id:String(now),big:top?'❌ Falsch!':'🤷 Keine Entscheidung',text:top?('❌ '+((c.names||{})[top]||'?')+' war NICHT der Verräter! Der Verräter ist noch unter uns …'):'🤷 Niemand wurde gewählt. Der Verräter ist noch unter uns …'};
          c.state='run'; c.meeting=null; return c;
        });
      }).then(done).catch(done);
    },
    _tOver(t){
      this._music(false); this._meetingOff();
      if(!this.role||this.role.id!==t.id) return;
      const T=this.role.r==='T', crewWin=t.winner==='crew';
      big(crewWin?'🏆 Besatzung gewinnt!':'🔪 Verräter gewinnt!',crewWin?'#7ff0ff':'#ff5a4a',4500);
      toast((t.traitor?('Der Verräter war: '+t.traitor+'. '):'')+(t.why||''),7000);
      if(crewWin&&!T){ stackLuck(20,20); toast('🍀 ×20 Glück für 20 Min (stapelbar)!',7000); }
      else if(!crewWin&&T){ stackLuck(50,10); toast('🍀 ×50 Glück für 10 Min (stapelbar)!',7000); }
      setTimeout(()=>{ hudOff('ztghost'); hudOff('zthud'); },6000);
    },
    /* ── Besprechung (Chat + Abstimmung) ── */
    _meetingUI(t){
      const m=t.meeting; if(this._mtId!==m.id){ this._meetingOff(); this._mtId=m.id; this._buildMeeting(t); }
      const el=document.getElementById('ztmeet'); if(!el) return;
      const left=Math.max(0,Math.ceil((m.endAt-Date.now())/1000));
      el.querySelector('#ztm-timer').textContent='Abstimmung endet in '+left+'s';
      const votes=m.votes||{}; const k=K(me()); const aliveMe=!!(t.alive&&t.alive[k]);
      el.querySelector('#ztm-cnt').textContent=Object.keys(votes).length+' / '+Object.keys(t.alive||{}).length+' haben abgestimmt';
      el.querySelectorAll('[data-vote]').forEach(b=>{ const on=votes[k]===b.dataset.vote; b.style.outline=on?'3px solid #ffd166':'none'; b.style.opacity=aliveMe?1:.5; });
    },
    _buildMeeting(t){
      const m=t.meeting, r=RT(); const k=K(me()); const aliveMe=!!(t.alive&&t.alive[k]);
      const el=document.createElement('div'); el.id='ztmeet';
      el.style.cssText='position:fixed;inset:0;z-index:99200;background:rgba(5,8,20,.96);color:#fff;font-family:Arial,sans-serif;display:flex;flex-direction:column;padding:10px;gap:6px';
      const opts=Object.keys(t.alive||{}).map(kk=>'<button data-vote="'+esc(kk)+'" style="padding:8px 4px;border:0;border-radius:8px;background:#2b3a55;color:#fff;font-weight:700;font-size:.8rem;cursor:pointer">👤 '+esc(t.alive[kk])+(kk===k?' (du)':'')+'</button>').join('');
      el.innerHTML='<div style="text-align:center"><div style="font-size:1.15rem;font-weight:900;color:#ff6b6b">🚨 Leiche gefunden!</div>'
        +'<div style="font-size:.85rem"><b>'+esc(m.by)+'</b> hat die Leiche von <b>'+esc(m.body)+'</b> gemeldet. Wer war es?</div>'
        +'<div id="ztm-timer" style="font-size:.8rem;opacity:.8"></div></div>'
        +'<div id="ztm-chat" style="flex:1;min-height:60px;overflow-y:auto;background:rgba(255,255,255,.06);border-radius:10px;padding:8px;font-size:.84rem;line-height:1.4"></div>'
        +(aliveMe?'<div style="display:flex;gap:6px"><input id="ztm-in" maxlength="120" placeholder="Schreibe, wen du verdächtigst …" style="flex:1;padding:9px;border-radius:8px;border:0;font-size:.9rem"><button id="ztm-send" style="padding:9px 14px;border:0;border-radius:8px;background:#27AE60;color:#fff;font-weight:800">➤</button></div>':'<div style="text-align:center;font-size:.78rem;opacity:.7">👻 Geister können nur zuschauen</div>')
        +'<div style="font-weight:800;font-size:.85rem;text-align:center">Wähle den Verräter:</div>'
        +'<div id="ztm-opts" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:6px;max-height:32vh;overflow-y:auto">'+opts+'<button data-vote="skip" style="padding:8px 4px;border:0;border-radius:8px;background:#555;color:#fff;font-weight:700;font-size:.8rem">⏭️ Überspringen</button></div>'
        +'<div id="ztm-cnt" style="text-align:center;font-size:.75rem;opacity:.75"></div>';
      document.body.appendChild(el);
      ['keydown','keyup','keypress'].forEach(ev=>el.addEventListener(ev,e=>e.stopPropagation()));
      const chat=el.querySelector('#ztm-chat');
      const add=(d)=>{ const p=document.createElement('div'); p.innerHTML='<b style="color:#7ff0ff">'+esc(d.n)+':</b> '+esc(d.t); chat.appendChild(p); chat.scrollTop=chat.scrollHeight; };
      if(r){ this._chatRef=r.ref('zoo_traitor_chat'); this._chatCb=this._chatRef.on('child_added',s=>{ const d=s.val(); if(d&&d.m===m.id) add(d); }); }
      const send=()=>{ const inp=el.querySelector('#ztm-in'); if(!inp) return; const txt=inp.value.trim(); if(!txt||!r) return; inp.value=''; r.ref('zoo_traitor_chat').push({n:me(),t:txt.slice(0,120),m:m.id,at:Date.now()}); };
      const sb=el.querySelector('#ztm-send'); if(sb){ sb.onclick=send; el.querySelector('#ztm-in').addEventListener('keydown',e=>{ if(e.key==='Enter') send(); }); }
      el.querySelectorAll('[data-vote]').forEach(b=>{ b.onclick=()=>{ if(!aliveMe||!r){ toast('Geister dürfen nicht abstimmen.',1500); return; } r.ref('zoo_traitor/meeting/votes/'+k).set(b.dataset.vote); }; });
      this._mtEl=el;
      big('🚨 Leiche gefunden!','#ff3b3b',2200);
    },
    _meetingOff(){
      if(this._chatRef&&this._chatCb){ try{ this._chatRef.off('child_added',this._chatCb); }catch(e){} } this._chatRef=null; this._chatCb=null;
      this._mtId=null; const el=document.getElementById('ztmeet'); if(el) el.remove(); this._mtEl=null;
    },

    /* ═══════════ 🎵 ADMIN-MUSIK ═══════════ */
    adminMusicPlay(key,mins){
      const r=RT(); if(!r){ note('❌ Keine Verbindung'); return; } if(!MUSIC[key]||!MUSIC[key].n){ note('❌ Lied unbekannt'); return; }
      r.ref('zoo_music').set({id:String(Date.now()),song:key,until:Date.now()+Math.max(1,mins||5)*60000}).then(()=>note('🎵 '+MUSIC[key].e+' '+MUSIC[key].n+' läuft bei allen im Zoo ('+(mins||5)+' Min)')).catch(e=>note('❌ '+((e&&e.message)||e)));
    },
    adminMusicStop(){ const r=RT(); if(r) r.ref('zoo_music').set(null); note('⏹️ Admin-Musik gestoppt'); },
    songs(){ return Object.keys(MUSIC).filter(k=>MUSIC[k].n).map(k=>({key:k,n:MUSIC[k].n,e:MUSIC[k].e})); },
    _musChanged(){
      const m=this.st.m;
      if(!m||m.until<=Date.now()){ if(this._admMus){ this._admMus=null; try{ if(ZMusic.mode==='boss') ZMusic.stop(); }catch(e){} } return; }
      if(this._admMus===m.id||!MUSIC[m.song]) return;
      try{ if(ZMusic.on) ZMusic.stop(); }catch(e){}
      setTimeout(()=>{ try{ this._admMus=m.id; ZMusic.on=false; ZMusic.play(Math.max(1000,m.until-Date.now()),'boss',MUSIC[m.song]); toast('🎵 '+MUSIC[m.song].e+' '+MUSIC[m.song].n,3000); }catch(e){} },300);
    },
    _musLoop(){ const m=this.st.m; if(this._admMus&&(!m||m.until<=Date.now())){ this._admMus=null; try{ if(ZMusic.mode==='boss') ZMusic.stop(); }catch(e){} } },

    /* ═══════════ 🧟 ZOMBIE-AUSBRUCH ═══════════ */
    adminZombieStart(includeSelf,mins,prize){
      const r=RT(); if(!r){ toast('❌ Keine Verbindung'); return; }
      const names=[...new Set([...Object.keys(ZG.otherPl||{}),...(includeSelf?[me()]:[])].filter(Boolean))];
      if(names.length<1){ note('❗ Keine Spieler gefunden — hake „ich spiele mit“ an.'); return; }
      const z0=names[Math.floor(Math.random()*names.length)]; const alive={}, zombies={}; names.forEach(n=>{ if(n===z0) zombies[K(n)]=n; else alive[K(n)]=n; });
      r.ref('zoo_zombie').set({id:String(Date.now()),state:'run',startAt:Date.now()+15000,endAt:Date.now()+15000+Math.max(1,mins||5)*60000,alive,zombies,total:names.length,prize:Math.max(0,prize||0)});
      note('🧟 Zombie-Ausbruch gestartet mit '+names.length+' Spielern: '+names.join(', '));
    },
    adminZombieStop(){ const r=RT(); if(r) r.ref('zoo_zombie').set(null); toast('⏹️ Zombie-Event beendet'); },
    _infect(target,tk){
      const r=RT(); if(!r) return;
      r.ref('zoo_zombie').transaction(c=>{
        if(!c||c.state!=='run'||!c.alive||!c.alive[tk]) return;
        c.zombies=c.zombies||{}; c.zombies[tk]=c.alive[tk]; delete c.alive[tk];
        if(!Object.keys(c.alive).length){ c.state='over'; c.winner='zombies'; }
        return c;
      });
      toast('🧟 '+target+' infiziert!',1800);
    },
    _zChanged(){
      const c=this.st.z;
      if(!c){ this._zClear(); return; }
      if(c.id!==this._zId){ this._zId=c.id; this._zOverAt=0; this._zClear(true); }
      const k=K(me()); const inEv=!!((c.alive&&c.alive[k])||(c.zombies&&c.zombies[k]));
      if(inEv&&!seen('zstart',c.id)){ mark('zstart',c.id); this._music(true,'zombie',(c.endAt-Date.now())/60000+1);
        const zom=!!(c.zombies&&c.zombies[k]);
        big(zom?'🧟 DU BIST DER ZOMBIE!':'🧍 Ein Zombie ist unter uns!',zom?'#7bed4f':'#ffd166',3500);
        toast(zom?'🧟 Slappe Menschen (aus der Nähe), um sie zu infizieren. Infiziere alle!':'🧍 Du bist ein Mensch: Renne weg und überlebe 5 Minuten! Wer überlebt, teilt sich den Preis. Du kannst nicht slappen.',8000); }
      if(inEv&&this._zWas===true&&c.zombies&&c.zombies[k]&&c.state==='run'){ big('🧟 Du wurdest infiziert!','#7bed4f',3000); toast('Jetzt bist du ein Zombie — infiziere die anderen!',5000); }
      this._zWas=!!(c.alive&&c.alive[k]);
      if(c.state==='run') this._zSawRun=c.id;
      // Nur wer mitgespielt oder den Ausbruch live gesehen hat, bekommt das Ende gemeldet (Neue sehen keine alte Meldung)
      if(c.state==='over'&&!seen('zover',c.id)){ mark('zover',c.id); if(inEv||this._zSawRun===c.id) this._zOver(c,inEv); else { this._music(false); this._tint(false,'zzfx'); } }
    },
    _zOver(c,inEv){
      this._music(false); this._tint(false,'zzfx');
      const k=K(me()); const n=Object.keys(c.alive||{}).length;
      if(c.winner==='zombies'){ big('🧟 Die Zombies haben gewonnen!','#7bed4f',4500); return; }
      big('🏆 Menschen überlebt!','#ffd166',4500);
      if(inEv&&c.alive&&c.alive[k]){ const share=n>0?Math.floor((c.prize||0)/n):0; if(share>0){ addMT(share); toast('🏆 Du hast überlebt! +'+share+' MT ('+n+' Überlebende teilen sich '+c.prize+')',7000); } else toast('🏆 Du hast überlebt!',5000); }
    },
    _zLoop(){
      const c=this.st.z; if(!c){ return; }
      const k=K(me()); const zom=!!(c.zombies&&c.zombies[k]); const hum=!!(c.alive&&c.alive[k]);
      this._zAdminCheck(c);
      if(!zom&&!hum){ hudOff('zzhud'); return; }
      const nz=Object.keys(c.zombies||{}).length, nh=Object.keys(c.alive||{}).length;
      if(c.state==='over'){ if(!this._zOverAt) this._zOverAt=Date.now(); if(Date.now()-this._zOverAt>5000){ hudOff('zzhud'); this._tint(false,'zzfx'); return; } }
      if(c.state==='over') hud('zzhud','🏁 Zombie-Event vorbei · '+(c.winner==='zombies'?'🧟 Zombies gewinnen':'🧍 '+nh+' Menschen überlebt'),'top:160px;background:rgba(0,0,0,.6);padding:5px 12px;border-radius:12px');
      else if(Date.now()<c.startAt) hud('zzhud','Gleich geht\'s los … '+Math.ceil((c.startAt-Date.now())/1000)+'s','top:160px;background:rgba(0,0,0,.6);padding:5px 12px;border-radius:12px');
      else hud('zzhud',(zom?'🧟 Du bist Zombie':'🧍 Du bist Mensch')+' · 🧟 '+nz+' · 🧍 '+nh+' · ⏱ '+mmss(c.endAt-Date.now()),'top:160px;background:rgba(0,0,0,.6);padding:5px 12px;border-radius:12px;border:2px solid '+(zom?'#7bed4f':'#ffd166'));
      this._tint(zom&&c.state==='run','zzfx','radial-gradient(ellipse at center,rgba(0,0,0,0) 45%,rgba(60,160,30,.35) 100%)');
      if(zom){ if(!ZG._sizeMul) ZG._sizeSpd=1.1; } else if(!ZG._sizeMul&&ZG._sizeSpd===1.1) ZG._sizeSpd=0;
      // Zombie-Markierung über den Köpfen
      Object.keys(ZG.otherM||{}).forEach(n=>{ const m=ZG.otherM[n]; if(!m) return; const isZ=!!(c.zombies&&c.zombies[K(n)])&&c.state!=='over'; let s=m.userData&&m.userData._zomb;
        if(isZ&&!s){ s=this._emo('🧟',1.7); s.position.set(0,3.3,0); m.add(s); m.userData._zomb=s; } else if(!isZ&&s){ m.remove(s); m.userData._zomb=null; } });
    },
    _zAdminCheck(c){
      if(ZS.isAdmin&&!this._zBusy&&c.state==='run'&&Date.now()>c.endAt+300){
        this._zBusy=true; const r=RT();
        r.ref('zoo_zombie').transaction(x=>{ if(!x||x.state!=='run'||Date.now()<=x.endAt) return; x.state='over'; x.winner=Object.keys(x.alive||{}).length?'humans':'zombies'; return x; }).then(()=>{ this._zBusy=false; }).catch(()=>{ this._zBusy=false; });
      }
    },
    _zClear(keep){
      hudOff('zzhud'); hudOff('zzfx');
      Object.keys(ZG.otherM||{}).forEach(n=>{ const m=ZG.otherM[n]; if(m&&m.userData&&m.userData._zomb){ m.remove(m.userData._zomb); m.userData._zomb=null; } });
      if(!ZG._sizeMul&&ZG._sizeSpd===1.1) ZG._sizeSpd=0;
      if(!keep){ this._zId=null; this._music(false); }
    },
    freeSlap(){
      const a=this.st.t, z=this.st.z, k=K(me());
      if(a&&a.state!=='over'&&this.role&&this.role.id===a.id) return true;
      if(z&&z.state==='run'&&((z.alive&&z.alive[k])||(z.zombies&&z.zombies[k]))) return true;
      return false;
    },
    statusParts(){
      const out=[]; const t=this.st.t, z=this.st.z;
      if(t){ out.push('🕵️ Verräter: '+({run:'läuft',meeting:'🚨 Besprechung',over:'vorbei ('+(t.winner==='crew'?'Besatzung':'Verräter')+' gewinnt)'}[t.state]||t.state)+' · '+Object.keys(t.alive||{}).length+'/'+(t.total||0)+' am Leben'+(t.state!=='over'?' · '+mmss(t.endAt-Date.now()):'')); }
      if(z){ out.push('🧟 Zombie: '+(z.state==='run'?'läuft':'vorbei')+' · 🧟 '+Object.keys(z.zombies||{}).length+' · 🧍 '+Object.keys(z.alive||{}).length+(z.state==='run'?' · '+mmss(z.endAt-Date.now()):'')); }
      if(this.st.m&&this.st.m.until>Date.now()&&MUSIC[this.st.m.song]) out.push('🎵 Admin-Musik: '+MUSIC[this.st.m.song].e+' '+MUSIC[this.st.m.song].n+' · noch '+mmss(this.st.m.until-Date.now()));
      return out;
    }
  };
  E.init();
})();
