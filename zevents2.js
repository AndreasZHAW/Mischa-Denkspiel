/* zevents2.js — Admin-Events Teil 2: 💣 Heisse Kartoffel, 👹 Zoo-Boss (5 Bosse), 🦣🐜 Riesen- & Zwergen-Tag.
 * Alles über Realtime Database. Läuft nur auf zoo.html (nutzt ZS, ZG, ZP, ZHearts, ZMusic, State, _rtdb).
 */
(function(){
  if(window.ZEvt2) return;
  const RT=()=> (typeof _rtdb!=='undefined'&&_rtdb&&typeof State!=='undefined'&&State._useCloud())?_rtdb:null;
  const K=n=>String(n||'').toLowerCase().replace(/[.#$\[\]]/g,'_');
  const me=()=>(typeof ZS!=='undefined'&&ZS&&ZS.player)||'';
  const inZoo=()=>{ try{ return !!(typeof ZG!=='undefined'&&ZG&&ZG.cam&&ZG.scene&&ZS&&ZS.zoo&&me()); }catch(e){ return false; } };
  const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const toast=(m,ms)=>{ try{ ZP.toast(m,ms||3000); }catch(e){} };
  const big=(t,c,ms)=>{ try{ ZG._bigText(t,c,ms||2500); }catch(e){} };
  const addMT=v=>{ try{ ZS.zoo.mt=(ZS.zoo.mt||0)+v; ZS.save&&ZS.save(); ZG._updHUD&&ZG._updHUD(); }catch(e){} };
  const seen=(k,id)=>{ try{ return localStorage.getItem('zevt2_'+K(me())+'_'+k)===String(id); }catch(e){ return false; } };
  const mark=(k,id)=>{ try{ localStorage.setItem('zevt2_'+K(me())+'_'+k,String(id)); }catch(e){} };
  const hash=s=>{ let h=2166136261; s=String(s); for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; };
  const rng=seed=>{ let a=seed>>>0; return ()=>{ a=(a+0x6D2B79F5)>>>0; let t=a; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }; };
  const hud=(id,html,css)=>{ let e=document.getElementById(id); if(!e){ e=document.createElement('div'); e.id=id; e.style.cssText='position:fixed;left:50%;transform:translateX(-50%);z-index:560;pointer-events:none;text-align:center;font:800 .85rem Arial,sans-serif;color:#fff;text-shadow:0 1px 3px #000;'+(css||''); document.body.appendChild(e); } if(e.innerHTML!==html) e.innerHTML=html; return e; };
  const hudOff=id=>{ const e=document.getElementById(id); if(e) e.remove(); };
  const busy=()=>{ try{ return !!(ZG._arcadeActive||ZG._jumpActive||ZG._mazeActive||ZG._steActive||ZG._trashActive); }catch(e){ return false; } };

  /* ═══ Boss-Daten ═══ */
  const ARENA={x:0,z:-30,R:44};
  const BOSSES=[
    {n:'Feuer-Drache',e:'🐉',col:'#ff5a1f',gap:2300,atk:['meteor','meteor','stomp'],
      tip:'Der Drache lässt Meteore regnen und stampft auf den Boden.',
      music:{bpm:140,root:40,scale:[0,1,4,5,7,8,10],wave:'sawtooth',riff:[0,-1,0,2,-1,0,3,-1,0,-1,0,2,4,-1,3,2],kick:'x...x...x...x.x.',snare:'....x.......x...',hat:'x.x.x.x.x.x.x.xx'}},
    {n:'Laser-Roboter',e:'🤖',col:'#3fa9ff',gap:2000,atk:['beam','cross','beam','meteor'],
      tip:'Der Roboter schiesst rote Laserstreifen quer über die Arena.',
      music:{bpm:128,root:36,scale:[0,2,3,5,7,8,10],wave:'square',riff:[0,2,4,2,0,2,4,6,0,2,4,2,7,6,4,2],kick:'x...x...x...x...',snare:'....x.......x...',hat:'..x...x...x...x.'}},
    {n:'Geister-König',e:'👻',col:'#b78cff',gap:2600,superEvery:5,superR:32,superName:'👻 GEISTER-SCHREI!',atk:['ring','dark','ring','meteor'],
      tip:'Der Geist schickt Schockwellen-Ringe, löscht das Licht – und alle paar Sekunden kommt der Geister-Schrei: ein riesiger Kreis, nur AUSSEN ist frei, plus ein Ziel, das er verfolgt.',
      music:{bpm:92,root:45,scale:[0,2,3,6,7,8,11],wave:'sine',riff:[0,-1,-1,-1,3,-1,-1,-1,6,-1,-1,-1,4,-1,2,-1],kick:'x.......x.......',snare:'................',hat:'................'}},
    {n:'Riesen-Krake',e:'🐙',col:'#e84393',gap:2200,atk:['stomp','ring','meteor','beam'],
      tip:'Die Krake haut mit Tentakeln zu: Stampf-Kreise, Ringe und Meteore.',
      music:{bpm:110,root:38,scale:[0,2,3,5,7,9,10],wave:'triangle',riff:[0,-1,2,-1,0,-1,4,-1,0,-1,2,-1,5,-1,3,-1],kick:'x..x..x...x..x..',snare:'......x.......x.',hat:'x.x.x.x.x.x.x.x.'}},
    {n:'Vulkan-Gott',e:'🌋',col:'#ff2d2d',gap:1700,superEvery:6,atk:['meteor','beam','dark','cross','meteor','stomp'],
      tip:'Der Endboss: alles auf einmal, sehr schnell. Bleib in Bewegung!',
      music:{bpm:160,root:42,scale:[0,1,3,6,7,8,11],wave:'sawtooth',riff:[0,0,3,0,6,0,3,0,0,0,4,0,6,5,3,1],kick:'x.x.x.x.x.x.x.xx',snare:'....x.......x...',hat:'xxxxxxxxxxxxxxxx'}}
  ];
  const DIFF={leicht:400,normal:1000,schwer:2500,extrem:6000};
  const TELE=3000, IMPACT_FLASH=700, MULT=10, GUN_BOSS_DMG=10, SUPER_R=26, LOCK_AT=1500, LOCK_R=5;

  const E=window.ZEvt2={
    st:{}, _started:false, BOSSES, ARENA,
    init(){
      if(this._iv) return;
      this._iv=setInterval(()=>{
        if(this._started){ this._loop(); return; }
        if(!inZoo()||!RT()) return;
        this._started=true; this._listen();
        this._fast=setInterval(()=>{ try{ this._bossFast(); }catch(e){} },100);
      },1000);
    },
    _listen(){
      const r=RT();
      r.ref('zoo_boss').on('value',s=>{ this.st.boss=s.val(); this._bossChanged(); });
      r.ref('zoo_potato').on('value',s=>{ this.st.potato=s.val(); this._potChanged(); });
      r.ref('zoo_size').on('value',s=>{ this.st.size=s.val(); });
    },
    _loop(){
      try{ this._potLoop(); this._sizeLoop(); this._bossSlow(); }catch(e){ console.log('[ZEvt2-debug] '+e.message); }
    },

    /* ═══════════ 💣 HEISSE KARTOFFEL ═══════════ */
    adminPotatoStart(includeSelf,prize){
      const r=RT(); if(!r){ toast('❌ Keine Verbindung'); return; }
      const names=[...new Set([...Object.keys(ZG.otherPl||{}),...(includeSelf?[me()]:[])].filter(Boolean))];
      if(names.length<3){ toast('❗ Mindestens 3 Spieler nötig (gefunden: '+names.length+')',3500); return; }
      const alive={}; names.forEach(n=>alive[K(n)]=n);
      const holder=names[Math.floor(Math.random()*names.length)];
      r.ref('zoo_potato').set({id:String(Date.now()),state:'run',alive,holder,round:1,roundEnd:Date.now()+22000+3000,passAt:Date.now(),prize:Math.max(0,prize||0),total:names.length});
      toast('💣 Heisse Kartoffel gestartet ('+names.length+' Spieler)');
    },
    adminPotatoStop(){ const r=RT(); if(r) r.ref('zoo_potato').set(null); toast('⏹️ Kartoffel beendet'); },
    potatoSlap(target){
      const p=this.st.potato; if(!p||p.state!=='run'||!p.alive||!p.alive[K(me())]) return false;
      if(p.holder!==me()){ toast('💣 Du hast die Kartoffel nicht — weiche dem Besitzer aus!',1800); return true; }
      if(!p.alive[K(target)]){ toast('❗ '+target+' ist schon raus.',1500); return true; }
      if(Date.now()-(p.passAt||0)<1200){ toast('⏳ Gleich nochmal …',900); return true; }
      const r=RT(); if(!r) return true;
      r.ref('zoo_potato').transaction(c=>{ if(!c||c.holder!==me()||c.state!=='run') return; c.holder=target; c.passAt=Date.now(); return c; });
      toast('💣 Weitergegeben an '+target+'!',1500);
      return true;
    },
    _potChanged(){
      const p=this.st.potato;
      if(!p){ hudOff('zpotato'); this._potClear(); return; }
      if(p.state==='over' && !seen('potwin',p.id)){
        mark('potwin',p.id);
        if(p.winner){
          big('🏆 '+p.winner+' gewinnt!','#FFD700',4000);
          if(p.winner===me()){ if(p.prize>0){ addMT(p.prize); toast('🏆 Du hast gewonnen! +'+p.prize+' MT',5000); } else toast('🏆 Du hast gewonnen!',4000); }
        } else toast('💣 Kartoffel-Event beendet',3000);
      }
    },
    _potLoop(){
      const p=this.st.potato;
      if(!p||p.state!=='run'){ if(p&&p.state==='over') hud('zpotato','🏆 Kartoffel-Event vorbei'+(p.winner?' · Sieger: '+esc(p.winner):''),'top:96px;background:rgba(0,0,0,.6);padding:6px 14px;border-radius:12px'); else hudOff('zpotato'); this._potMarks(null); return; }
      const left=Math.max(0,Math.ceil((p.roundEnd-Date.now())/1000));
      const n=Object.keys(p.alive||{}).length;
      const mine=!!(p.alive&&p.alive[K(me())]);
      let t;
      if(!mine) t='👀 Du bist raus · '+n+' übrig · 💣 bei <b>'+esc(p.holder)+'</b> ('+left+'s)';
      else if(p.holder===me()) t='<span style="color:#ff6b6b">💣 DU HAST DIE KARTOFFEL! Slappe jemanden! '+left+'s</span>';
      else t='💣 '+esc(p.holder)+' hat die Kartoffel ('+left+'s) · '+n+' übrig — lauf weg!';
      hud('zpotato',t,'top:96px;background:rgba(0,0,0,.65);padding:6px 14px;border-radius:12px;border:2px solid '+(p.holder===me()?'#ff3b3b':'rgba(255,255,255,.25)'));
      this._potMarks(p.holder);
      // Admin steuert die Runden
      if(ZS.isAdmin && Date.now()>p.roundEnd+300 && !this._potBusy){
        this._potBusy=true; const r=RT();
        r.ref('zoo_potato').transaction(c=>{
          if(!c||c.state!=='run'||Date.now()<=c.roundEnd) return;
          delete c.alive[K(c.holder)];
          const ks=Object.keys(c.alive);
          if(ks.length<=1){ c.state='over'; c.winner=ks.length?c.alive[ks[0]]:''; return c; }
          const online=ks.filter(k=>{ const nm=c.alive[k]; return nm===me()||(ZG.otherPl&&ZG.otherPl[nm]); });
          const pool=online.length?online:ks;
          c.holder=c.alive[pool[Math.floor(Math.random()*pool.length)]];
          c.round=(c.round||1)+1; c.passAt=Date.now();
          c.roundEnd=Date.now()+Math.max(9000,22000-c.round*2500)+2000;
          c.boom=(c.boom||0)+1;
          return c;
        }).then(res=>{ this._potBusy=false; }).catch(()=>{ this._potBusy=false; });
      }
      if(p.boom && this._lastBoom!==p.boom){ this._lastBoom=p.boom; big('💥 BUMM!','#ff3b3b',1800); }
    },
    _potMarks(holder){
      try{
        Object.keys(ZG.otherM||{}).forEach(n=>{
          const m=ZG.otherM[n]; if(!m) return;
          let s=m.userData&&m.userData._potato;
          if(n===holder){
            if(!s){ s=this._emoSprite('💣',1.6); s.position.set(0,3.4,0); m.add(s); m.userData._potato=s; }
          } else if(s){ m.remove(s); m.userData._potato=null; }
        });
      }catch(e){}
    },
    _potClear(){ this._potMarks(null); },
    _emoSprite(emo,sz){
      const c=document.createElement('canvas'); c.width=c.height=128; const x=c.getContext('2d'); x.font='96px serif'; x.textAlign='center'; x.textBaseline='middle'; x.fillText(emo,64,70);
      const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthTest:false})); s.scale.set(sz,sz,1); return s;
    },

    /* ═══════════ 🦣🐜 RIESEN- & ZWERGEN-TAG ═══════════ */
    adminSizeStart(mins){
      const r=RT(); if(!r){ toast('❌ Keine Verbindung'); return; }
      r.ref('zoo_size').set({seed:String(Date.now()),until:Date.now()+Math.max(1,mins||5)*60000});
      toast('🦣🐜 Riesen- & Zwergen-Tag gestartet');
    },
    adminSizeStop(){ const r=RT(); if(r) r.ref('zoo_size').set(null); toast('⏹️ Riesen-/Zwergen-Tag beendet'); },
    sizeOf(name){ const s=this.st.size; if(!s||s.until<Date.now()) return 1; return (hash(name+s.seed)%2)===0?2.4:0.45; },
    _sizeLoop(){
      const s=this.st.size; const on=!!(s&&s.until>Date.now());
      if(on){
        const mul=this.sizeOf(me());
        if(ZG._sizeMul!==mul){ ZG._sizeMul=mul; ZG._sizeSpd=mul>1?0.85:1.35; ZG._sizeJump=mul>1?1.7:0.8;
          big(mul>1?'🦣 Du bist ein RIESE!':'🐜 Du bist ein ZWERG!',mul>1?'#ff9f43':'#7bed9f',2800); }
        hud('zsize','Riesen- & Zwergen-Tag · noch '+Math.ceil((s.until-Date.now())/60000)+' Min · du: '+(mul>1?'🦣 Riese (hohe Sprünge)':'🐜 Zwerg (schnell)'),'top:96px;background:rgba(0,0,0,.55);padding:5px 12px;border-radius:12px;font-size:.78rem');
      } else {
        if(ZG._sizeMul){ ZG._sizeMul=0; ZG._sizeSpd=0; ZG._sizeJump=0; hudOff('zsize'); toast('Alle sind wieder normal gross.',2500); }
      }
      Object.keys(ZG.otherM||{}).forEach(n=>{ const m=ZG.otherM[n]; if(!m) return; const t=on?this.sizeOf(n):1; if(m.scale.x!==t) m.scale.setScalar(t); });
    },

    /* ═══════════ 👹 ZOO-BOSS ═══════════ */
    adminBossStart(bi,diff,mins,prize){
      const r=RT(); if(!r){ toast('❌ Keine Verbindung'); return; }
      bi=Math.max(0,Math.min(4,bi|0)); const hp=DIFF[diff]||1000; mins=Math.max(1,mins||5);
      const now=Date.now();
      r.ref('zoo_boss').set({id:String(now),boss:bi,maxHp:hp,hp,briefAt:now,startAt:now+18000,endAt:now+18000+mins*60000,seed:(now%1000000)+7,prize:Math.max(0,prize||0),state:'on',dmg:{}});
      toast(BOSSES[bi].e+' '+BOSSES[bi].n+' erscheint in 18 s …');
    },
    adminBossStop(){ const r=RT(); if(r) r.ref('zoo_boss').set(null); toast('⏹️ Boss entfernt'); },
    _phase(){ const b=this.st.boss; if(!b) return 'none'; if(b.state!=='on') return b.state; const n=Date.now(); return n<b.startAt?'brief':(n<b.endAt?'fight':'timeup'); },
    _bossChanged(){
      const b=this.st.boss;
      if(!b){ this._bossClear(); return; }
      if(b.id!==this._bossId){ this._winAt=0; this._boom=0; this._bossId=b.id; this._bossClear(true); this._kDone=-1; this._act=[]; this._tele=false; }
      if(b.state==='won' && !this._winAt){ this._winAt=Date.now(); (this._act||[]).forEach(a=>{ (a.meshes||[]).forEach(m=>{ try{ ZG.scene.remove(m); }catch(e){} }); }); this._act=[]; hudOff('zbosshud'); }
      if(b.state==='won' && !seen('bosswin',b.id)){
        mark('bosswin',b.id);
        big('🏆 BOSS BESIEGT!','#FFD700',4500);
        const d=b.dmg||{}; const my=d[K(me())]||0;
        const top=Object.keys(d).sort((a,c)=>d[c]-d[a])[0];
        if(my>0 && b.prize>0){ let pr=b.prize; if(top===K(me())) pr*=3; addMT(pr); toast('🏆 Boss besiegt! +'+pr+' MT'+(top===K(me())?' (Top-Schaden ×3!)':''),6000); }
        else toast('🏆 '+BOSSES[b.boss].n+' wurde besiegt! Top-Schaden: '+(top?esc(top):'–'),5000);
        this._stopMusic();
      }
      if(b.state==='lost' && !seen('bosslost',b.id)){ mark('bosslost',b.id); big('⏰ Zeit um — der Boss hat gewonnen','#ff6b6b',4000); this._stopMusic(); }
    },
    _stopMusic(){ try{ if(ZMusic.mode==='boss') ZMusic.stop(); }catch(e){} },
    _bossClear(keepId){
      hudOff('zbosshud'); hudOff('zbossbrief');
      if(this._spr){ try{ ZG.scene.remove(this._spr); }catch(e){} this._spr=null; }
      (this._act||[]).forEach(a=>{ (a.meshes||[]).forEach(m=>{ try{ ZG.scene.remove(m); }catch(e){} }); }); this._act=[];
      this._stopMusic();
      if(!keepId) this._bossId=null;
    },
    _ensureSprite(b){
      if(this._spr) return;
      const B=BOSSES[b.boss];
      const c=document.createElement('canvas'); c.width=c.height=256; const x=c.getContext('2d'); x.font='190px serif'; x.textAlign='center'; x.textBaseline='middle'; x.fillText(B.e,128,140);
      const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,fog:false}));
      s.scale.set(22,22,1); s.position.set(ARENA.x,13,ARENA.z); ZG.scene.add(s); this._spr=s;
    },
    _bossSlow(){
      const b=this.st.boss; if(!b) return;
      if(b.state==='on' && b.hp<=0){ const r0=RT(); if(r0) r0.ref('zoo_boss/state').transaction(x=>x==='on'?'won':undefined); }
      const ph=this._phase();
      if(ph==='timeup'){ // irgendein Client beendet
        const r=RT(); if(r) r.ref('zoo_boss/state').transaction(s=>s==='on'?'lost':undefined);
        return;
      }
      if(ph==='brief'){
        const left=Math.max(0,Math.ceil((b.startAt-Date.now())/1000)); const B=BOSSES[b.boss];
        if(!seen('bossbrief',b.id)){
          hud('zbossbrief',
            '<div style="font-size:3rem">'+B.e+'</div><div style="font-size:1.3rem;font-weight:900;color:'+B.col+'">'+esc(B.n)+'</div>'
            +'<div style="text-align:left;margin:8px auto 0;max-width:340px;font-size:.84rem;line-height:1.45;font-weight:600">'
            +'<b>So geht\'s:</b><br>⚔️ <b>Slappe den Boss</b> — je stärker dein Slap, desto mehr HP verliert er.<br>'
            +'🔴 <b>Rote Stellen am Boden</b> = Einschlag in 3 Sekunden. Renne raus!<br>'
            +'💀 Wirst du getroffen, verlierst du <b>alle Herzen</b>.<br>'
            +'🏆 Boss besiegt = Belohnung'+(b.prize>0?' ('+b.prize+' MT, Top-Schaden ×3)':'')+'.<br>'
            +'ℹ️ '+esc(B.tip)+'</div>'
            +'<div style="margin-top:8px;font-size:1.1rem;font-weight:900">Start in '+left+' s</div>'
            +'<div style="font-size:.7rem;opacity:.7;margin:2px 0 6px">Du wirst automatisch zur Arena gebracht.</div>'
            +'<button onclick="ZEvt2.briefOk()" style="padding:8px 20px;border:0;border-radius:10px;background:'+B.col+';color:#fff;font-weight:800;font-size:.95rem;cursor:pointer">Verstanden</button>',
            'top:12%;pointer-events:auto;background:rgba(15,10,25,.92);border:3px solid '+B.col+';border-radius:16px;padding:14px 18px;width:min(92vw,400px)');
        }
      } else hudOff('zbossbrief');
    },
    briefOk(){ const b=this.st.boss; if(b) mark('bossbrief',b.id); hudOff('zbossbrief'); },
    _bossFast(){
      const b=this.st.boss;
      if(b&&b.state==='won'&&this._spr){ // Boss-Todesanimation: wackeln, aufblähen, verpuffen
        const t=Date.now()-(this._winAt||Date.now());
        if(t>3200){ try{ ZG.scene.remove(this._spr); }catch(e){} this._spr=null; return; }
        const k=t<1800?1+Math.sin(t/40)*.08:Math.max(0.01,1.15*(1-(t-1800)/1400));
        this._spr.scale.set(22*k,22*k,1); this._spr.position.y=13+Math.sin(t/60)*.6; if(this._spr.material) this._spr.material.opacity=t<1800?1:Math.max(0,1-(t-1800)/1400);
        if(t>1750&&!this._boom){ this._boom=1; try{ const e=this._emoSprite('💥',30); e.position.set(ARENA.x,13,ARENA.z); ZG.scene.add(e); setTimeout(()=>{ try{ZG.scene.remove(e);}catch(x){} },1200); }catch(x){} }
        return;
      }
      if(!b||b.state!=='on'){ if(b&&b.state!=='on') hudOff('zbosshud'); return; }
      if(!inZoo()||busy()) return;
      const ph=this._phase(); const B=BOSSES[b.boss];
      if(ph==='none') return;
      this._ensureSprite(b);
      if(this._spr){ const t=Date.now()/400; this._spr.position.y=13+Math.sin(t)*1.2; const k=this._hitFlash&&Date.now()<this._hitFlash?1.12:1; this._spr.scale.set(22*k,22*k,1); }
      if(ph==='brief') return;
      // Teleport + Musik beim Start
      if(!seen('bosstp',b.id)){
        mark('bosstp',b.id);
        const a=(hash(me()+b.id)%628)/100; ZG.pl.x=ARENA.x+Math.cos(a)*30; ZG.pl.z=ARENA.z+Math.sin(a)*30; ZG.yaw=Math.atan2(ARENA.x-ZG.pl.x,ARENA.z-ZG.pl.z)+Math.PI;
        big(B.e+' KAMPF BEGINNT!',B.col,2500);
      }
      if(!ZMusic.on && ph==='fight') ZMusic.play(Math.max(0,b.endAt-Date.now()),'boss',B.music);
      // HP-Leiste
      const pct=Math.max(0,b.hp/b.maxHp*100);
      hud('zbosshud','<div style="font-size:.8rem">'+B.e+' '+esc(B.n)+' · '+Math.ceil(Math.max(0,b.hp))+' / '+b.maxHp+' HP · ⏱ '+Math.max(0,Math.ceil((b.endAt-Date.now())/1000))+'s</div>'
        +'<div style="width:min(80vw,340px);height:14px;background:rgba(0,0,0,.6);border:2px solid #fff;border-radius:8px;overflow:hidden;margin:3px auto"><div style="height:100%;width:'+pct+'%;background:linear-gradient(90deg,'+B.col+',#fff3)"></div></div>','top:56px');
      // Angriffe (deterministisch aus Seed)
      const now=Date.now();
      const first=b.startAt+2500;
      const kNow=Math.floor((now-first)/B.gap);
      while(this._kDone<kNow){
        this._kDone++;
        const ts=first+this._kDone*B.gap;
        if(ts+TELE+IMPACT_FLASH<now) continue; // verpasst
        if(ts>b.endAt-TELE) continue;
        this._spawnAttack(b,B,this._kDone,ts);
      }
      this._tickAttacks(now);
    },
    _shapes(b,B,k){
      const R=rng(b.seed*131+k*7919), pick=a=>a[Math.floor(R()*a.length)];
      let type=pick(B.atk); const out=[];
      if(B.superEvery && k%B.superEvery===B.superEvery-1) type='super'; const rp=()=>{ const a=R()*Math.PI*2, d=Math.sqrt(R())*(ARENA.R-4); return [ARENA.x+Math.cos(a)*d,ARENA.z+Math.sin(a)*d]; };
      if(type==='meteor'){ const n=3+Math.floor(R()*3); for(let i=0;i<n;i++){ const p=rp(); out.push({t:'c',x:p[0],z:p[1],r:5.5,m:1}); } }
      else if(type==='stomp'){ out.push({t:'c',x:ARENA.x,z:ARENA.z,r:15}); }
      else if(type==='beam'){ const n=1+Math.floor(R()*2); for(let i=0;i<n;i++){ const p=rp(); out.push({t:'s',x:p[0],z:p[1],a:R()*Math.PI,w:6}); } }
      else if(type==='cross'){ const p=rp(); const a=R()*Math.PI; out.push({t:'s',x:p[0],z:p[1],a,w:6},{t:'s',x:p[0],z:p[1],a:a+Math.PI/2,w:6}); }
      else if(type==='ring'){ const r1=10+R()*14; out.push({t:'r',x:ARENA.x,z:ARENA.z,r1,r2:r1+9}); }
      else if(type==='dark'){ const p=rp(); out.push({t:'i',x:p[0],z:p[1],r:9}); }
      else if(type==='super'){ out.push({t:'c',x:ARENA.x,z:ARENA.z,r:B.superR||SUPER_R,sup:1}); }
      return {type,shapes:out};
    },
    _spawnAttack(b,B,k,ts){
      const {type,shapes}=this._shapes(b,B,k); const meshes=[];
      shapes.forEach(s=>{
        let g,m;
        const mat=new THREE.MeshBasicMaterial({color:0xff1010,transparent:true,opacity:.35,side:THREE.DoubleSide,depthWrite:false});
        if(s.t==='c'){ g=new THREE.CircleGeometry(s.r,40); m=new THREE.Mesh(g,mat); m.rotation.x=-Math.PI/2; m.position.set(s.x,0.15,s.z); }
        else if(s.t==='s'){ g=new THREE.PlaneGeometry(ARENA.R*3,s.w); m=new THREE.Mesh(g,mat); m.rotation.x=-Math.PI/2; m.rotation.z=s.a; m.position.set(s.x,0.15,s.z); }
        else if(s.t==='r'){ g=new THREE.RingGeometry(s.r1,s.r2,56); m=new THREE.Mesh(g,mat); m.rotation.x=-Math.PI/2; m.position.set(s.x,0.15,s.z); }
        else { g=new THREE.RingGeometry(s.r,ARENA.R*2.2,56); m=new THREE.Mesh(g,mat); m.rotation.x=-Math.PI/2; m.position.set(s.x,0.16,s.z); }
        ZG.scene.add(m); meshes.push(m);
        if(s.m){ const mt=this._emoSprite('☄️',7); mt.position.set(s.x,60,s.z); ZG.scene.add(mt); meshes.push(mt); s._met=mt; }
      });
      const act={k,ts,type,shapes,meshes,hit:false,sup:type==='super',seed:b.seed};
      if(act.sup){ meshes.forEach(m=>{ if(m.material) m.material.color.set(0xaa0000); }); big(BOSSES[b.boss].superName||'🌋 SUPER-ANGRIFF!','#ff2d2d',2200); toast('Der große Kreis tötet jeden darin — und außerhalb wählt der Vulkan-Gott ein Opfer! Renne nach AUSSEN und weiche dem Ziel-Kreis aus!',5000); }
      this._act.push(act);
    },
    inShape(s,x,z){
      const dx=x-s.x, dz=z-s.z;
      if(s.t==='c') return Math.hypot(dx,dz)<s.r+0.4;
      if(s.t==='s'){ // Streifen-Richtung wie im Mesh (rotation.x=-90°, rotation.z=a): (cos a, -sin a)
        const perp=Math.abs(dx*Math.sin(s.a)+dz*Math.cos(s.a)), along=dx*Math.cos(s.a)-dz*Math.sin(s.a); return perp<s.w/2+0.4 && Math.abs(along)<ARENA.R*1.5; }
      if(s.t==='r'){ const d=Math.hypot(dx,dz); return d>s.r1-0.4 && d<s.r2+0.4; }
      if(s.t==='i') return Math.hypot(dx,dz)>s.r-0.2;
      return false;
    },
    _tickAttacks(now){
      this._act=this._act.filter(a=>{
        const imp=a.ts+TELE, p=(now-a.ts)/TELE;
        if(a.sup && !a.tName && now>=a.ts+LOCK_AT && now<imp) this._lockTarget(a);
        if(a.tMesh && now<imp){ a.tMesh.material.opacity=.45+.35*Math.abs(Math.sin(now/90)); }
        if(now<imp){
          const pulse=0.28+0.22*Math.abs(Math.sin(now/130*(1+p*2)));
          a.meshes.forEach(m=>{ if(m.material&&m.material.opacity!==undefined&&!m.isSprite) m.material.opacity=pulse+p*.2; });
          a.shapes.forEach(s=>{ if(s._met) s._met.position.y=60*(1-p)+1; });
        } else if(!a.hit){
          a.hit=true;
          a.meshes.forEach(m=>{ if(m.isSprite){ try{ZG.scene.remove(m);}catch(e){} } else if(m.material){ m.material.color.set(0xffaa00); m.material.opacity=.8; } });
          if(a.tName===me() && !(window.ZHearts&&ZHearts.dead) && !busy()){
            if(Math.hypot(ZG.pl.x-a.tx,ZG.pl.z-a.tz)<LOCK_R+0.4 && ZG.pl.y<5){ try{ ZHearts.die({boss:true,name:BOSSES[(this.st.boss||{}).boss||0].n}); }catch(e){} }
          }
          if(!(window.ZHearts&&ZHearts.dead) && !busy()){
            const x=ZG.pl.x, z=ZG.pl.z;
            if(a.shapes.some(s=>this.inShape(s,x,z)) && ZG.pl.y<5){
              try{ ZHearts.die({boss:true,name:BOSSES[(this.st.boss||{}).boss||0].n}); }catch(e){ console.log('[ZEvt2-debug] die: '+e.message); }
            }
          }
        }
        if(now>imp+IMPACT_FLASH){ a.meshes.forEach(m=>{ try{ ZG.scene.remove(m); }catch(e){} }); return false; }
        return true;
      });
    },
    // Super-Angriff: außerhalb des großen Kreises wird 1 Spieler ausgewählt (Ziel-Kreis, 1,5 s Vorwarnung, danach fest)
    _lockTarget(a){
      const cx=ARENA.x, cz=ARENA.z, list=[]; const SR=a.shapes[0].r;
      const add=(n,x,z)=>{ const d=Math.hypot(x-cx,z-cz); if(d>SR+1&&d<ARENA.R+30) list.push({n,x,z,h:hash(n+a.seed+a.k)}); };
      if(!(window.ZHearts&&ZHearts.dead)) add(me(),ZG.pl.x,ZG.pl.z);
      Object.keys(ZG.otherPl||{}).forEach(n=>{ const o=ZG.otherPl[n]; if(o&&typeof o.x==='number') add(n,o.x,o.z); });
      a.tName=list.length?list.sort((p,q)=>p.h-q.h)[0].n:'-'; if(a.tName==='-') return;
      const t=list.find(p=>p.n===a.tName); a.tx=t.x; a.tz=t.z;
      const m=new THREE.Mesh(new THREE.CircleGeometry(LOCK_R,32),new THREE.MeshBasicMaterial({color:0xff0000,transparent:true,opacity:.7,side:THREE.DoubleSide,depthWrite:false}));
      m.rotation.x=-Math.PI/2; m.position.set(a.tx,0.25,a.tz); ZG.scene.add(m); a.tMesh=m; a.meshes.push(m);
      const sk=this._emoSprite('☠️',3); sk.position.set(a.tx,4.5,a.tz); ZG.scene.add(sk); a.meshes.push(sk);
      if(a.tName===me()) big('☠️ DU BIST DAS ZIEL! LAUF WEG!','#ff2d2d',1500); else toast('☠️ '+a.tName+' ist das Ziel!',1500);
    },
    /* Slap auf den Boss (aus ZG._slapNearby) — true = Boss getroffen/behandelt */
    tryHit(sl,cx,cy){
      try{
        const b=this.st.boss; if(!b||this._phase()!=='fight'||!this._spr||b.hp<=0) return false;
        const ndc={x:(cx/window.innerWidth)*2-1,y:-(cy/window.innerHeight)*2+1};
        if(!this._rc) this._rc=new THREE.Raycaster();
        this._rc.setFromCamera(ndc,ZG.cam);
        const hit=this._rc.intersectObject(this._spr,false);
        if(!hit.length) return false;
        const range=(sl.range||8)+10;
        if(!sl.isGun && hit[0].distance>range){ toast('❗ Zu weit weg vom Boss (max. '+range+' m)!',1400); return true; }
        const base=(typeof SLAP_DMG!=='undefined'&&SLAP_DMG[sl.id]!=null)?SLAP_DMG[sl.id]:.3;
        const dmg=sl.isGun?GUN_BOSS_DMG:Math.round(base*MULT*10)/10; // Geschenkeschleuder: immer genau 10 Schaden am Boss
        const r=RT(); if(!r) return true;
        r.ref('zoo_boss/hp').transaction(h=>{ if(h==null) return h; return Math.max(0,Math.round((h-dmg)*10)/10); }).then(res=>{
          if(res&&res.snapshot&&res.snapshot.val()<=0) r.ref('zoo_boss/state').transaction(s=>s==='on'?'won':undefined);
        }).catch(()=>{});
        r.ref('zoo_boss/dmg/'+K(me())).transaction(v=>(v||0)+dmg);
        this._hitFlash=Date.now()+200;
        try{ ZHearts.setCombat(); }catch(e){}
        try{ ZG._dmgPopup('−'+dmg+' HP',cx,cy-30); }catch(e){}
        try{ ZSound.slap(); }catch(e){}
        return true;
      }catch(e){ return false; }
    },
    // Während Boss-Kampf (und Briefing) kosten Slaps kein Geld
    freeSlap(){ const ph=this._phase(); return ph==='brief'||ph==='fight'; },
    statusParts(){
      const out=[]; const b=this.st.boss, p=this.st.potato, s=this.st.size;
      if(b){ const B=BOSSES[b.boss]; const ph=this._phase(); const d=b.dmg||{}; const top=Object.keys(d).sort((a,c)=>d[c]-d[a]).slice(0,3).map(k=>esc(k)+' '+Math.round(d[k])).join(', ');
        out.push(B.e+' Boss '+esc(B.n)+': '+({brief:'Briefing',fight:'Kampf',won:'✅ besiegt',lost:'❌ Zeit um',timeup:'Zeit um'}[ph]||ph)+' · '+Math.ceil(Math.max(0,b.hp))+'/'+b.maxHp+' HP'+(top?' · Top: '+top:'')); }
      if(p){ out.push('💣 Kartoffel: '+(p.state==='run'?('Runde '+p.round+' · '+Object.keys(p.alive||{}).length+' übrig · Besitzer '+esc(p.holder)):('vorbei · Sieger '+esc(p.winner||'–')))); }
      if(s&&s.until>Date.now()) out.push('🦣🐜 Riesen-/Zwergen-Tag läuft noch '+Math.ceil((s.until-Date.now())/60000)+' Min');
      return out;
    }
  };
  E.init();
})();
