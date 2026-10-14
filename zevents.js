/* zevents.js — Admin-Abuse-Events: Team-Event (Rot/Blau) + Musik, Schatzsuche, Mond-Schwerkraft,
 * Spotlight, Event-Rückblick, Fahrplan. Alles läuft über Realtime Database (kein Server nötig).
 * Wird nur auf zoo.html geladen. Nutzt die globalen Objekte ZS, ZG, ZP, ZHearts, State, _rtdb.
 */
(function(){
  if(window.ZEvt) return;
  const RT=()=> (typeof _rtdb!=='undefined'&&_rtdb&&typeof State!=='undefined'&&State._useCloud())?_rtdb:null;
  const K=n=>String(n||'').toLowerCase().replace(/[.#$\[\]]/g,'_');
  const me=()=>(typeof ZS!=='undefined'&&ZS&&ZS.player)||'';
  const inZoo=()=>{ try{ return !!(typeof ZG!=='undefined'&&ZG&&ZG.cam&&ZG.scene&&ZS&&ZS.zoo&&me()); }catch(e){ return false; } };
  const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const toast=(m,ms)=>{ try{ ZP.toast(m,ms||3000); }catch(e){} };
  const big=(t,c,ms)=>{ try{ ZG._bigText(t,c,ms||2500); }catch(e){} };
  const fmt=n=>(Math.round((n||0)*10)/10).toLocaleString('de-CH',{maximumFractionDigits:1});
  const mmss=ms=>{ ms=Math.max(0,ms); const s=Math.ceil(ms/1000); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); };
  const total=()=>{ try{ return (ZS.dsMT||0)+(ZS.zoo.mt||0); }catch(e){ return 0; } };
  const addMT=v=>{ try{ ZS.zoo.mt=(ZS.zoo.mt||0)+v; ZS.save&&ZS.save(); ZG._updHUD&&ZG._updHUD(); }catch(e){} };
  const seen=(k,id)=>{ try{ return localStorage.getItem('zevt_'+k)===id; }catch(e){ return false; } };
  const mark=(k,id)=>{ try{ localStorage.setItem('zevt_'+k,id); }catch(e){} };

  const E=window.ZEvt={
    st:{}, _started:false,
    // Eigene MT-Einnahmen (nur Zuwächse, Ausgaben zählen nicht negativ)
    earn:{total:0,_last:null},
    _sampleEarn(){
      const cur=total();
      if(this.earn._last==null){ this.earn._last=cur; return 0; }
      const d=cur-this.earn._last; this.earn._last=cur;
      if(d>0){ this.earn.total+=d; return d; }
      return 0;
    },
    stat(k,n){ const s=this.rec&&this.rec.on?this.rec.me:null; if(s){ s[k]=(s[k]||0)+(n||1); } },
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
      r.ref('zoo_team').on('value',s=>{ this.st.team=s.val(); this._teamChanged(); });
      r.ref('zoo_treasure').on('value',s=>{ this.st.tr=s.val(); this._trChanged(); });
      r.ref('zoo_chaos').on('value',s=>{ this.st.chaos=s.val(); this._chaosChanged(); });
      r.ref('zoo_spot').on('value',s=>{ this.st.spot=s.val(); });
      r.ref('zoo_recap/current').on('value',s=>{ this.st.recap=s.val(); this._recapChanged(); });
    },
    _loop(){
      try{
        this._teamLoop(); this._trLoop(); this._chaosLoop(); this._spotLoop(); this._recapLoop(); this._schedLoop();
      }catch(e){ console.log('[ZEvt-debug] loop-Fehler: '+e.message); }
    },

    /* ═══════════ TEAM-EVENT ═══════════ */
    adminTeamStart(secs,includeSelf,mins){
      const r=RT(); if(!r){ toast('❌ Keine Verbindung'); return; }
      const names=Object.keys(ZG.otherPl||{}); if(includeSelf) names.push(me());
      const uniq=[...new Set(names.filter(Boolean))];
      if(uniq.length<2){ toast('❗ Mindestens 2 Spieler nötig (gefunden: '+uniq.length+')',3500); return; }
      for(let i=uniq.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [uniq[i],uniq[j]]=[uniq[j],uniq[i]]; }
      const players={}; uniq.forEach((n,i)=>{ players[K(n)]={n,t:i%2===0?'r':'b'}; });
      const startAt=Date.now()+(secs||10)*1000, endAt=startAt+(mins||5)*60000;
      return r.ref('zoo_team').set({id:'t'+Date.now(),startAt,endAt,players,created:Date.now()}).then(()=>{
        toast('🔴🔵 Team-Event gestartet mit '+uniq.length+' Spielern',4000);
      });
    },
    adminTeamStop(){
      const r=RT(); if(!r||!this.st.team) return;
      return r.ref('zoo_team/endAt').set(Date.now()).then(()=>toast('⏹️ Team-Event beendet',2500));
    },
    _myTeam(){ const t=this.st.team; const p=t&&t.players&&t.players[K(me())]; return p?p.t:null; },
    _teamChanged(){
      const t=this.st.team;
      if(!t){ this._hudRemove('zteam'); ZMusic.stop(); return; }
      if(Date.now()>t.endAt+30000){ return; }
      const mine=this._myTeam();
      if(mine && !seen('teamjoin',t.id) && Date.now()<t.endAt){
        mark('teamjoin',t.id);
        try{ ZHearts._toZoo&&ZHearts._toZoo(); }catch(e){}
        this.earn.total=0; this.earn._last=total();
        big(mine==='r'?'🔴 TEAM ROT':'🔵 TEAM BLAU',mine==='r'?'#ff5a5a':'#5aa8ff',3000);
        toast('Verdiene in 5 Min mehr als das andere Team! Das Gewinner-Team bekommt das Verdiente ×5!',6000);
        ZMusic.play(Math.max(0,t.endAt-Date.now()));
      } else if(mine && Date.now()<t.endAt && !ZMusic.on){ ZMusic.play(Math.max(0,t.endAt-Date.now())); }
    },
    _teamLoop(){
      const t=this.st.team; if(!t) return;
      const now=Date.now(); const mine=this._myTeam();
      if(!mine){ this._hudRemove('zteam'); return; }
      if(now<t.startAt){ this._teamHud(t,'startet in '+Math.ceil((t.startAt-now)/1000)+'s'); this.earn._last=total(); this.earn.total=0; return; }
      if(now<t.endAt){
        this._sampleEarn();
        if(now-(this._tEarnSent||0)>2500){ this._tEarnSent=now; const r=RT(); if(r) r.ref('zoo_team/earn/'+K(me())).set({t:mine,v:Math.round(this.earn.total*10)/10}).catch(()=>{}); }
        this._teamHud(t,mmss(t.endAt-now));
        this._teamMarkers(t);
        return;
      }
      // beendet
      this._hudRemove('zteam'); ZMusic.stop(); this._clearMarkers();
      if(seen('teamdone',t.id)) return;
      if(!this._tFinal){
        this._tFinal=true;
        const r=RT(); if(r) r.ref('zoo_team/earn/'+K(me())).set({t:mine,v:Math.round(this.earn.total*10)/10}).catch(()=>{});
        setTimeout(()=>this._teamResult(t),4500);
      }
    },
    async _teamResult(t){
      const r=RT(); this._tFinal=false; if(!r||seen('teamdone',t.id)) return;
      mark('teamdone',t.id);
      let earn={}; try{ earn=(await r.ref('zoo_team/earn').once('value')).val()||{}; }catch(e){}
      let rt=0,bt=0; Object.values(earn).forEach(e=>{ if(e.t==='r') rt+=e.v||0; else bt+=e.v||0; });
      const mine=this._myTeam(); const mineV=(earn[K(me())]||{}).v||Math.round(this.earn.total*10)/10;
      const win=rt>bt?'r':(bt>rt?'b':null);
      const line=(win?(win==='r'?'🔴 Team ROT':'🔵 Team BLAU')+' gewinnt!':'🤝 Unentschieden!')+'  Rot '+fmt(rt)+' · Blau '+fmt(bt);
      big(win?(win==='r'?'🔴 ROT GEWINNT':'🔵 BLAU GEWINNT'):'🤝 UNENTSCHIEDEN',win==='r'?'#ff5a5a':(win==='b'?'#5aa8ff':'#fff'),4000);
      if(win && mine===win && mineV>0){
        const bonus=Math.round(mineV*4*10)/10; addMT(bonus); this.earn._last=total();
        toast('🏆 '+line+'\nDu hast '+fmt(mineV)+' MT verdient → Bonus +'+fmt(bonus)+' MT (×5 insgesamt)!',9000);
      } else toast((win&&mine!==win?'😅 ':'')+line,8000);
      this._recLog('🔴🔵 Team-Event: '+line);
    },
    _teamHud(t,right){
      let el=document.getElementById('zteam');
      if(!el){ el=document.createElement('div'); el.id='zteam';
        el.style.cssText='position:fixed;left:50%;transform:translateX(-50%);z-index:562;pointer-events:none;font:800 .78rem Arial,sans-serif;color:#fff;white-space:nowrap;text-align:center;text-shadow:0 1px 2px #000';
        document.body.appendChild(el); }
      let rt=0,bt=0; const earn=t.earn||{}; Object.keys(earn).forEach(k=>{ const e=earn[k]; if(k===K(me())) return; if(e.t==='r') rt+=e.v||0; else bt+=e.v||0; });
      const mine=this._myTeam(); if(mine==='r') rt+=this.earn.total; else bt+=this.earn.total;
      const h=document.getElementById('zhearts'); const hb=h?h.getBoundingClientRect().bottom:60;
      const c=document.getElementById('zcombat'); const cb=c&&c.style.display!=='none'?c.getBoundingClientRect().bottom:hb;
      el.style.top=(Math.max(hb,cb)+6)+'px';
      el.innerHTML='<div style="display:inline-block;background:rgba(0,0,0,.6);border-radius:12px;padding:3px 10px"><span style="color:#ff7a7a">🔴 '+fmt(rt)+'</span> &nbsp;·&nbsp; <span style="color:#7ab8ff">🔵 '+fmt(bt)+'</span> &nbsp;·&nbsp; ⏱ '+right+' <span style="opacity:.7">· Du: '+(mine==='r'?'🔴':'🔵')+'</span></div>';
    },
    _teamMarkers(t){
      try{
        Object.keys(t.players||{}).forEach(k=>{
          const p=t.players[k]; const m=ZG.otherM&&ZG.otherM[p.n]; if(!m||m._teamSpr) return;
          const spr=ZG._txt(p.t==='r'?'🔴 ROT':'🔵 BLAU',0.9,p.t==='r'?'#ff7a7a':'#7ab8ff'); spr.position.set(0,4.4,0); m.add(spr); m._teamSpr=spr;
        });
      }catch(e){}
    },
    _clearMarkers(){
      try{ Object.values(ZG.otherM||{}).forEach(m=>{ if(m&&m._teamSpr){ m.remove(m._teamSpr); m._teamSpr=null; } }); }catch(e){}
    },
    _hudRemove(id){ const e=document.getElementById(id); if(e) e.remove(); },

    /* ═══════════ SCHATZSUCHE ═══════════ */
    adminTreasureStart(n,prize){
      const r=RT(); if(!r){ toast('❌ Keine Verbindung'); return; }
      n=Math.max(1,Math.min(40,n||10)); prize=Math.max(0,prize||0);
      const R=Math.max(40,Math.min(120,(ZG.WR||210)-70)); const items={};
      for(let i=0;i<n;i++){ const a=Math.random()*Math.PI*2, d=18+Math.random()*(R-18); items['i'+i]={x:Math.round(Math.sin(a)*d*10)/10,z:Math.round(Math.cos(a)*d*10)/10}; }
      return r.ref('zoo_treasure').set({id:'s'+Date.now(),state:'running',prize,n,items,created:Date.now(),winner:''}).then(()=>toast('💰 Schatzsuche gestartet ('+n+' Schätze, Preis '+prize+' MT)',4000));
    },
    adminTreasureStop(){ const r=RT(); if(!r||!this.st.tr) return; return this._trEnd(true); },
    _trMeshes:{},
    _trChanged(){
      const t=this.st.tr;
      if(!t||t.state!=='running'){ this._trClear(); if(t&&t.state==='ended') this._trShowEnd(t); return; }
      if(!seen('trjoin',t.id) && Date.now()-t.created<40*60000){ mark('trjoin',t.id); big('💰 SCHATZSUCHE!','#ffd700',3000); toast('Finde die versteckten Schätze im Zoo! Wer die meisten sammelt, gewinnt '+fmt(t.prize)+' MT.',7000); }
      this._trSync(t);
    },
    _trSync(t){
      try{
        const items=t.items||{};
        Object.keys(this._trMeshes).forEach(id=>{ if(!items[id]||items[id].by){ const g=this._trMeshes[id]; try{ZG.scene.remove(g);}catch(e){} delete this._trMeshes[id]; } });
        Object.keys(items).forEach(id=>{
          if(items[id].by||this._trMeshes[id]) return;
          const g=new THREE.Group();
          const spr=ZG._txt('💰',1,'#fff'); spr.scale.set(5,1.25,1); spr.position.y=2.4; g.add(spr);
          const beam=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,50,8,1,true),new THREE.MeshBasicMaterial({color:0xffd34d,transparent:true,opacity:.35,depthWrite:false,side:THREE.DoubleSide})); beam.position.y=25; g.add(beam);
          g.position.set(items[id].x,0,items[id].z); ZG.scene.add(g); this._trMeshes[id]=g;
        });
      }catch(e){}
    },
    _trClear(){ Object.values(this._trMeshes).forEach(g=>{ try{ZG.scene.remove(g);}catch(e){} }); this._trMeshes={}; this._hudRemove('ztreasure'); },
    _trLoop(){
      const t=this.st.tr; if(!t||t.state!=='running'){ this._hudRemove('ztreasure'); return; }
      const items=t.items||{}; let left=0,mine=0; const cnt={};
      Object.keys(items).forEach(id=>{ const b=items[id].by; if(!b) left++; else { cnt[b]=(cnt[b]||0)+1; if(b===me()) mine++; } });
      // Wiederherstellen, falls Meshes verloren
      if(Object.keys(this._trMeshes).length!==left) this._trSync(t);
      // Einsammeln
      const R=RT();
      Object.keys(this._trMeshes).forEach(id=>{
        const it=items[id]; if(!it||it.by) return;
        if(Math.hypot(ZG.pl.x-it.x,ZG.pl.z-it.z)<3.2 && !(this._claiming||{})[id]){
          (this._claiming=this._claiming||{})[id]=1;
          R.ref('zoo_treasure/items/'+id+'/by').transaction(c=>c?undefined:me(),(err,ok)=>{
            if(ok){ toast('💰 Schatz gefunden!',1500); this.stat('treasures'); }
            setTimeout(()=>{ delete this._claiming[id]; },1500);
          });
        }
      });
      Object.values(this._trMeshes).forEach((g,i)=>{ g.children[0].position.y=2.4+Math.sin(Date.now()/400+i)*0.35; });
      let el=document.getElementById('ztreasure');
      if(!el){ el=document.createElement('div'); el.id='ztreasure';
        el.style.cssText='position:fixed;left:50%;transform:translateX(-50%);z-index:562;pointer-events:none;font:800 .78rem Arial,sans-serif;color:#ffd700;white-space:nowrap;text-shadow:0 1px 2px #000;background:rgba(0,0,0,.6);border-radius:12px;padding:3px 10px';
        document.body.appendChild(el); }
      const h=document.getElementById('zhearts'); el.style.top=((h?h.getBoundingClientRect().bottom:60)+(document.getElementById('zteam')?30:6))+'px';
      el.textContent='💰 Schätze übrig: '+left+'/'+t.n+' · Du: '+mine;
      if(left===0) this._trEnd(false);
    },
    _trEnd(force){
      const r=RT(); const t=this.st.tr; if(!r||!t||t.state!=='running') return;
      const cnt={}; Object.values(t.items||{}).forEach(i=>{ if(i.by) cnt[i.by]=(cnt[i.by]||0)+1; });
      let best=null,bc=0,tie=false; Object.keys(cnt).forEach(n=>{ if(cnt[n]>bc){ best=n; bc=cnt[n]; tie=false; } else if(cnt[n]===bc) tie=true; });
      const winner=(best&&!tie)?best:'';
      return r.ref('zoo_treasure/state').transaction(c=>c==='running'?'ended':undefined,(err,ok)=>{ if(ok) r.ref('zoo_treasure').update({winner,counts:cnt,endedAt:Date.now()}).catch(()=>{}); });
    },
    _trShowEnd(t){
      if(seen('trdone',t.id)||Date.now()-(t.endedAt||0)>10*60000) return;
      if(!seen('trjoin',t.id)) return;
      if(!t.endedAt) { setTimeout(()=>this._trShowEnd(this.st.tr||t),1200); return; }
      mark('trdone',t.id);
      const counts=t.counts||{}; const top=Object.keys(counts).sort((a,b)=>counts[b]-counts[a]).slice(0,3).map((n,i)=>['🥇','🥈','🥉'][i]+' '+n+' ('+counts[n]+')').join('  ');
      big(t.winner?('🏆 '+t.winner+' gewinnt!'):'💰 Schatzsuche vorbei','#ffd700',3500);
      toast('💰 Schatzsuche beendet. '+(top||'Niemand hat etwas gefunden.'),8000);
      if(t.winner && t.winner.toLowerCase()===me().toLowerCase() && t.prize>0 && !seen('trpaid',t.id)){ mark('trpaid',t.id); addMT(t.prize); toast('🏆 Du hast gewonnen: +'+fmt(t.prize)+' MT!',7000); }
      this._recLog('💰 Schatzsuche: '+(t.winner?t.winner+' gewinnt':'kein Sieger')+(top?' — '+top:''));
    },

    /* ═══════════ MOND-SCHWERKRAFT (Chaos) ═══════════ */
    adminChaosStart(mult,mins){
      const r=RT(); if(!r){ toast('❌ Keine Verbindung'); return; }
      mult=Math.max(1.5,Math.min(10,mult||5)); mins=Math.max(0.5,Math.min(60,mins||3));
      return r.ref('zoo_chaos').set({id:'c'+Date.now(),type:'lowgrav',mult,until:Date.now()+mins*60000}).then(()=>toast('🌙 Mond-Schwerkraft ×1/'+mult+' für '+mins+' Min',3500));
    },
    adminChaosStop(){ const r=RT(); if(!r) return; return r.ref('zoo_chaos').remove().then(()=>toast('🌙 Schwerkraft wieder normal',2500)); },
    _chaosChanged(){
      const c=this.st.chaos;
      if(c&&c.until>Date.now()){ ZG._gravMul=1/(c.mult||5); if(!seen('chaos',c.id)){ mark('chaos',c.id); big('🌙 MOND-SCHWERKRAFT','#9fd8ff',3000); toast('Du kannst jetzt '+(c.mult||5)+'× höher und länger springen! (Leertaste / Springen)',6000); } }
      else { ZG._gravMul=1; this._hudRemove('zchaos'); }
    },
    _chaosLoop(){
      const c=this.st.chaos; const on=c&&c.until>Date.now();
      if(!on){ if(ZG._gravMul!==1) ZG._gravMul=1; this._hudRemove('zchaos'); return; }
      ZG._gravMul=1/(c.mult||5);
      let el=document.getElementById('zchaos');
      if(!el){ el=document.createElement('div'); el.id='zchaos';
        el.style.cssText='position:fixed;right:10px;top:110px;z-index:562;pointer-events:none;font:800 .72rem Arial,sans-serif;color:#9fd8ff;background:rgba(0,0,0,.55);border-radius:10px;padding:3px 9px;text-shadow:0 1px 2px #000';
        document.body.appendChild(el); }
      el.textContent='🌙 Mond-Schwerkraft '+mmss(c.until-Date.now());
    },

    /* ═══════════ SPOTLIGHT ═══════════ */
    adminSpot(name,text,mins){
      const r=RT(); if(!r||!name){ toast('❗ Spieler wählen'); return; }
      return r.ref('zoo_spot').set({name,text:(text||'').slice(0,60),until:Date.now()+(mins||2)*60000,id:'p'+Date.now()}).then(()=>toast('🔦 Spotlight auf '+name,3000));
    },
    adminSpotStop(){ const r=RT(); if(r) r.ref('zoo_spot').remove(); },
    _spotMesh:null,
    _spotLoop(){
      const s=this.st.spot; const on=s&&s.until>Date.now();
      if(!on){ if(this._spotMesh){ try{this._spotMesh.parent&&this._spotMesh.parent.remove(this._spotMesh);}catch(e){} this._spotMesh=null; } this._hudRemove('zspot'); return; }
      const isMe=(s.name||'').toLowerCase()===me().toLowerCase();
      if(isMe){
        if(this._spotMesh){ try{this._spotMesh.parent&&this._spotMesh.parent.remove(this._spotMesh);}catch(e){} this._spotMesh=null; }
        let el=document.getElementById('zspot');
        if(!el){ el=document.createElement('div'); el.id='zspot';
          el.style.cssText='position:fixed;inset:0;z-index:555;pointer-events:none;background:radial-gradient(ellipse at 50% 40%,rgba(255,240,150,.30),rgba(0,0,0,0) 60%)';
          el.innerHTML='<div style="position:absolute;top:14%;left:50%;transform:translateX(-50%);font:900 clamp(1.1rem,4vw,1.8rem) Arial,sans-serif;color:#ffe066;text-shadow:0 2px 8px #000;text-align:center;white-space:nowrap">🔦 Du stehst im Scheinwerfer!'+(s.text?'<br><span style="font-size:.7em;color:#fff">'+esc(s.text)+'</span>':'')+'</div>';
          document.body.appendChild(el); }
        return;
      }
      this._hudRemove('zspot');
      const m=ZG.otherM&&ZG.otherM[s.name];
      if(!m){ return; }
      if(!this._spotMesh||this._spotMesh._for!==s.id||this._spotMesh.parent!==m){
        if(this._spotMesh&&this._spotMesh.parent) this._spotMesh.parent.remove(this._spotMesh);
        const g=new THREE.Group(); g._for=s.id;
        const cone=new THREE.Mesh(new THREE.CylinderGeometry(.9,3.2,60,16,1,true),new THREE.MeshBasicMaterial({color:0xfff2a0,transparent:true,opacity:.28,depthWrite:false,side:THREE.DoubleSide})); cone.position.y=30; g.add(cone);
        const lbl=ZG._txt('🔦 '+s.name+(s.text?' — '+s.text:''),1.1,'#ffe066'); lbl.position.y=5.4; g.add(lbl);
        m.add(g); this._spotMesh=g;
      }
    },

    /* ═══════════ EVENT-RÜCKBLICK ═══════════ */
    rec:{on:false,me:{},id:null},
    adminRecStart(){ const r=RT(); if(!r) return; return r.ref('zoo_recap/current').set({id:'r'+Date.now(),state:'rec',startAt:Date.now()}).then(()=>toast('⏺️ Rückblick-Aufnahme läuft — Event-Start!',3500)); },
    async adminRecStop(){
      const r=RT(); const c=this.st.recap; if(!r||!c||c.state!=='rec') { toast('Keine Aufnahme aktiv'); return; }
      await r.ref('zoo_recap/current/state').set('stopping'); toast('⏹️ Auswertung läuft … (6 Sek.)',3000);
      setTimeout(async()=>{
        try{
          const stats=(await r.ref('zoo_recap/stats/'+c.id).once('value')).val()||{};
          const log=Object.values((await r.ref('zoo_recap/log/'+c.id).once('value')).val()||{}).sort((a,b)=>a.at-b.at).map(x=>x.t);
          const rows=Object.values(stats);
          const top=(key,label,unit)=>{ let b=null; rows.forEach(s=>{ if((s[key]||0)>0&&(!b||s[key]>b[key])) b=s; }); return b?label+': '+b.n+' ('+fmt(b[key])+(unit||'')+')':null; };
          const lines=[
            '⏱ Dauer: '+Math.max(1,Math.round((Date.now()-c.startAt)/60000))+' Min · '+rows.length+' Spieler dabei',
            top('mt','💰 Meistverdiener',' MT'), top('slapsGiven','👋 Meiste Slaps verteilt'), top('slapsGot','🤕 Meiste Treffer kassiert'), top('deaths','💀 Meiste Tode'), top('treasures','🔎 Schatzjäger'),
            ...log
          ].filter(Boolean);
          await r.ref('zoo_recap/current').update({state:'done',summary:lines.join('\n'),endedAt:Date.now()});
        }catch(e){ toast('❌ '+e.message,3000); }
      },6000);
    },
    _recapChanged(){
      const c=this.st.recap;
      if(!c){ this.rec.on=false; return; }
      if(c.state==='rec'){
        if(!this.rec.on||this.rec.id!==c.id){ this.rec={on:true,id:c.id,me:{n:me(),mt:0,slapsGiven:0,slapsGot:0,deaths:0,treasures:0},_sent:0}; this.earn._last=total(); }
      } else if(c.state==='stopping'){
        this._recSend(true); this.rec.on=false;
      } else if(c.state==='done'){
        this.rec.on=false;
        if(c.summary && !seen('recap',c.id)){ mark('recap',c.id); this._recapShow(c.summary); }
      }
    },
    _recLog(t){ const r=RT(); const c=this.st.recap; if(!r||!c||c.state!=='rec') return; if(this._lastLogKey===t) return; this._lastLogKey=t; r.ref('zoo_recap/log/'+c.id).push({t,at:Date.now()}).catch(()=>{}); },
    _recSend(force){
      const r=RT(); const rc=this.rec; if(!r||!rc||!rc.id) return;
      if(!force && Date.now()-(rc._sent||0)<5000) return; rc._sent=Date.now();
      r.ref('zoo_recap/stats/'+rc.id+'/'+K(me())).set(rc.me).catch(()=>{});
    },
    _recapLoop(){
      if(!this.rec.on) return;
      const d=this._sampleEarn(); if(d>0) this.rec.me.mt=(this.rec.me.mt||0)+d;
      this._recSend(false);
    },
    _recapShow(text){
      document.getElementById('zrecap')?.remove();
      const ov=document.createElement('div'); ov.id='zrecap';
      ov.style.cssText='position:fixed;inset:0;z-index:99000;background:rgba(10,12,30,.82);display:flex;align-items:center;justify-content:center;padding:16px';
      ov.innerHTML='<div style="background:#1b2038;border:2px solid #ffd700;border-radius:16px;max-width:480px;width:100%;max-height:82vh;display:flex;flex-direction:column;overflow:hidden;color:#fff;font-family:Arial,sans-serif">'
        +'<div style="padding:12px 16px;font-weight:900;font-size:1.1rem;color:#ffd700;border-bottom:1px solid rgba(255,255,255,.15)">🎬 Event-Rückblick</div>'
        +'<div style="padding:14px 16px;overflow-y:auto;white-space:pre-line;line-height:1.7;font-size:.95rem">'+esc(text)+'</div>'
        +'<button style="margin:10px;padding:11px;border:none;border-radius:10px;background:#27ae60;color:#fff;font-weight:800;cursor:pointer" onclick="document.getElementById(\'zrecap\').remove()">Schön war\'s! 👍</button></div>';
      document.body.appendChild(ov);
    },

    /* ═══════════ FAHRPLAN (läuft im Admin-Fenster) ═══════════ */
    sched:{list:{},on:false,_poll:0},
    adminSchedOn(){ this.sched.on=true; },
    adminSchedAdd(atMs,type,params){
      const r=RT(); if(!r) return; if(!(atMs>Date.now()-1000)){ toast('❗ Zeitpunkt liegt in der Vergangenheit'); return; }
      return r.ref('zoo_sched').push({at:atMs,type,params:params||{},done:false}).then(()=>{ toast('📅 Eingeplant',2000); this.adminSchedRender(); });
    },
    adminSchedDel(id){ const r=RT(); if(r) r.ref('zoo_sched/'+id).remove().then(()=>this.adminSchedRender()); },
    async adminSchedRender(){
      const el=document.getElementById('zev-sched-list'); if(!el) return; const r=RT(); if(!r) return;
      const v=(await r.ref('zoo_sched').once('value')).val()||{}; this.sched.list=v;
      const NAMES={team:'🔴🔵 Team-Event',battle:'⚔️ Kampf-Event',treasure:'💰 Schatzsuche',lowgrav:'🌙 Mond-Schwerkraft',recstart:'⏺️ Rückblick START',recstop:'⏹️ Rückblick STOP'};
      const rows=Object.keys(v).sort((a,b)=>v[a].at-v[b].at).map(id=>{ const s=v[id];
        return '<div style="display:flex;gap:6px;align-items:center;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.08);font-size:.76rem"><div style="flex:1">'+new Date(s.at).toLocaleString('de-CH',{timeZone:'Europe/Zurich',weekday:'short',hour:'2-digit',minute:'2-digit'})+' · '+(NAMES[s.type]||esc(s.type))+(s.done?' <span style="color:#2ecc71">✔ erledigt</span>':'')+'</div><button class="padmin-btn" style="background:#C0392B;padding:3px 8px;font-size:.68rem" onclick="ZEvt.adminSchedDel(\''+id+'\')">✕</button></div>'; });
      el.innerHTML=rows.join('')||'<span style="color:rgba(255,255,255,.4)">Noch nichts eingeplant.</span>';
    },
    _schedLoop(){
      if(!this.sched.on||!ZS.isAdmin&&!(typeof ZAdmin!=='undefined'&&ZAdmin._hasAccess)) return;
      const now=Date.now(); if(now-this.sched._poll<5000) return; this.sched._poll=now;
      const r=RT(); if(!r) return;
      r.ref('zoo_sched').once('value').then(snap=>{
        const v=snap.val()||{};
        Object.keys(v).forEach(id=>{ const s=v[id]; if(s.done||s.at>Date.now()) return;
          r.ref('zoo_sched/'+id+'/done').transaction(c=>c?undefined:true,(err,ok)=>{ if(!ok) return; this._runSched(s); });
        });
      }).catch(()=>{});
    },
    _runSched(s){
      const p=s.params||{};
      try{
        if(s.type==='team') this.adminTeamStart(p.secs||10,true,p.mins||5);
        else if(s.type==='battle') ZBattle.adminStart(p.secs||20,true);
        else if(s.type==='treasure') this.adminTreasureStart(p.n||10,p.prize||200);
        else if(s.type==='lowgrav') this.adminChaosStart(p.mult||5,p.mins||3);
        else if(s.type==='recstart') this.adminRecStart();
        else if(s.type==='recstop') this.adminRecStop();
        toast('📅 Fahrplan: '+s.type+' gestartet',3000);
      }catch(e){ toast('❌ Fahrplan-Fehler: '+e.message,4000); }
    },

    /* ═══════════ Admin-Status ═══════════ */
    async adminStatus(){
      const el=document.getElementById('zev-status'); if(!el) return;
      const t=this.st.team, tr=this.st.tr, c=this.st.chaos, rc=this.st.recap, sp=this.st.spot;
      const parts=[];
      if(t){ let rt=0,bt=0,n=0; Object.values(t.earn||{}).forEach(e=>{ n++; if(e.t==='r') rt+=e.v||0; else bt+=e.v||0; });
        const run=Date.now()<t.endAt; parts.push('🔴🔵 Team: '+(Date.now()<t.startAt?'Countdown':(run?'läuft ('+mmss(t.endAt-Date.now())+')':'beendet'))+' · Rot '+fmt(rt)+' · Blau '+fmt(bt)+' · '+Object.keys(t.players||{}).length+' Spieler'); }
      if(tr){ const items=Object.values(tr.items||{}); const f=items.filter(i=>i.by).length; const cnt={}; items.forEach(i=>{ if(i.by) cnt[i.by]=(cnt[i.by]||0)+1; });
        parts.push('💰 Schatzsuche: '+tr.state+' · '+f+'/'+tr.n+' gefunden · '+(Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a]).slice(0,3).map(n=>esc(n)+' '+cnt[n]).join(', ')||'–')+(tr.winner?' · Sieger '+esc(tr.winner):'')); }
      if(c&&c.until>Date.now()) parts.push('🌙 Mond-Schwerkraft läuft noch '+mmss(c.until-Date.now()));
      if(sp&&sp.until>Date.now()) parts.push('🔦 Spotlight auf '+esc(sp.name));
      if(rc) parts.push('🎬 Rückblick: '+({rec:'⏺️ nimmt auf',stopping:'⏳ wertet aus',done:'✅ fertig'}[rc.state]||rc.state));
      el.innerHTML=parts.join('<br>')||'Nichts aktiv.';
      const sel=document.getElementById('zev-spot-name');
      if(sel){ const names=Object.keys(ZG.otherPl||{}); const cur=sel.value; sel.innerHTML=names.map(n=>'<option>'+esc(n)+'</option>').join('')+'<option>'+esc(me())+'</option>'; if(cur) sel.value=cur; }
    }
  };

  /* ═══════════ MUSIK: "Rot gegen Blau" — eigener Song (Synth), dunkler Elektro-Rock-Stil ═══════════ */
  const LYRICS=[
    'Rot gegen Blau — fünf Minuten Zeit',
    'Jeder Taler zählt, mach dich bereit',
    'Deine Tiere laufen, das Geld kommt rein',
    'Gemeinsam gewinnen — wir sind ein Team!',
    'Rot oder Blau — wer holt den Sieg?',
    'Sammle, sammle, bis zum Schluss!',
    'Fünfmal so viel für das Team, das gewinnt',
    'Rot oder Blau — wer holt den Sieg?',
    'Die Uhr tickt laut, die Zahlen steigen',
    'Nicht aufgeben, nicht schweigen!',
    'Jeder Schritt bringt Münzen ein',
    'Am Ende zeigt sich, wer vorn wird sein!',
    'Rot oder Blau — wer holt den Sieg?',
    'Sammle, sammle, bis zum Schluss!',
    'Die Zeit läuft ab … wer hat gewonnen?',
    'Gleich wissen wir es — halte durch!'
  ];
  const ZMusic=window.ZMusic={
    on:false, ctx:null, bpm:126, _timer:null, _next:0, _step:0, _stopAt:0, _master:null, _lyr:null,
    play(durMs){
      if(this.on) return;
      try{
        const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return;
        this.ctx=this.ctx||new AC(); if(this.ctx.state==='suspended') this.ctx.resume();
        this._master=this.ctx.createGain(); this._master.gain.value=0.0; this._master.connect(this.ctx.destination);
        this._master.gain.linearRampToValueAtTime(0.32,this.ctx.currentTime+2);
        // Rauschen-Buffer für Snare/Hats
        const len=this.ctx.sampleRate; const b=this.ctx.createBuffer(1,len,this.ctx.sampleRate); const d=b.getChannelData(0); for(let i=0;i<len;i++) d[i]=Math.random()*2-1; this._noise=b;
        this.on=true; this._step=0; this._next=this.ctx.currentTime+0.15; this._stopAt=Date.now()+(durMs||300000); this._t0=Date.now();
        this._timer=setInterval(()=>this._sched(),80);
        this._lyrUI();
      }catch(e){ console.log('[Music-debug] '+e.message); }
    },
    stop(){
      if(!this.on) return; this.on=false;
      clearInterval(this._timer);
      try{ this._master.gain.cancelScheduledValues(this.ctx.currentTime); this._master.gain.setTargetAtTime(0,this.ctx.currentTime,0.5); const m=this._master; setTimeout(()=>{ try{m.disconnect();}catch(e){} },2500); }catch(e){}
      if(this._lyr){ this._lyr.remove(); this._lyr=null; }
    },
    _lyrUI(){
      if(this._lyr) this._lyr.remove();
      const el=document.createElement('div'); el.id='zlyrics';
      el.style.cssText='position:fixed;left:50%;bottom:86px;transform:translateX(-50%);z-index:561;pointer-events:none;max-width:92vw;text-align:center;font:900 clamp(.9rem,3.6vw,1.25rem) Arial,sans-serif;color:#fff;text-shadow:0 2px 6px #000,0 0 14px #c0392b;background:rgba(0,0,0,.35);border-radius:12px;padding:4px 12px;transition:opacity .3s';
      document.body.appendChild(el); this._lyr=el;
    },
    _note(m){ return 440*Math.pow(2,(m-69)/12); },
    _sched(){
      if(!this.on) return;
      if(Date.now()>this._stopAt+1500){ this.stop(); return; }
      const c=this.ctx, spb=60/this.bpm, s16=spb/4;
      while(this._next<c.currentTime+0.35){ this._play16(this._step,this._next,spb); this._next+=s16; this._step++; }
      // Songtext nach Takt (2 Takte pro Zeile)
      if(this._lyr){ const bar=Math.floor(this._step/16); const li=Math.floor(bar/2)%LYRICS.length; const txt='🎵 '+LYRICS[li]; if(this._lyr.textContent!==txt) this._lyr.textContent=txt; }
    },
    _env(g,t,a,d,peak){ g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(peak,t+a); g.gain.exponentialRampToValueAtTime(0.0001,t+a+d); },
    _kick(t){ const c=this.ctx,o=c.createOscillator(),g=c.createGain(); o.type='sine'; o.frequency.setValueAtTime(150,t); o.frequency.exponentialRampToValueAtTime(42,t+.12); this._env(g,t,.005,.28,1); o.connect(g); g.connect(this._master); o.start(t); o.stop(t+.35); },
    _snare(t){ const c=this.ctx,s=c.createBufferSource(); s.buffer=this._noise; const f=c.createBiquadFilter(); f.type='bandpass'; f.frequency.value=1800; const g=c.createGain(); this._env(g,t,.003,.18,.7); s.connect(f); f.connect(g); g.connect(this._master); s.start(t,Math.random()*.5); s.stop(t+.25);
      const o=c.createOscillator(),g2=c.createGain(); o.type='triangle'; o.frequency.setValueAtTime(220,t); o.frequency.exponentialRampToValueAtTime(110,t+.1); this._env(g2,t,.003,.12,.5); o.connect(g2); g2.connect(this._master); o.start(t); o.stop(t+.18); },
    _hat(t,open){ const c=this.ctx,s=c.createBufferSource(); s.buffer=this._noise; const f=c.createBiquadFilter(); f.type='highpass'; f.frequency.value=7000; const g=c.createGain(); this._env(g,t,.002,open?.16:.05,.25); s.connect(f); f.connect(g); g.connect(this._master); s.start(t,Math.random()*.5); s.stop(t+.2); },
    _bass(t,m,len){ const c=this.ctx,o=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain(); o.type='sawtooth'; o.frequency.value=this._note(m); f.type='lowpass'; f.frequency.setValueAtTime(900,t); f.frequency.exponentialRampToValueAtTime(220,t+len); this._env(g,t,.01,len,.5); o.connect(f); f.connect(g); g.connect(this._master); o.start(t); o.stop(t+len+.05); },
    _pad(t,ms,len){ const c=this.ctx; ms.forEach(m=>{ [-7,7].forEach(det=>{ const o=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain(); o.type='sawtooth'; o.frequency.value=this._note(m); o.detune.value=det; f.type='lowpass'; f.frequency.value=1100; g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(0.055,t+len*.3); g.gain.linearRampToValueAtTime(0.0001,t+len); o.connect(f); f.connect(g); g.connect(this._master); o.start(t); o.stop(t+len+.05); }); }); },
    _lead(t,m,len,vol){ const c=this.ctx,o=c.createOscillator(),g=c.createGain(); o.type='square'; o.frequency.value=this._note(m); const f=c.createBiquadFilter(); f.type='lowpass'; f.frequency.value=2600; this._env(g,t,.005,len,vol||.11); o.connect(f); f.connect(g); g.connect(this._master); o.start(t); o.stop(t+len+.05); },
    // Dunkles A-Moll: Am – F – C – G (je 1 Takt), 126 BPM
    _play16(step,t,spb){
      const s=step%16, bar=Math.floor(step/16), ci=bar%4;
      const ROOT=[45,41,48,43][ci];                         // A2 F2 C3 G2
      const TRI=[[57,60,64],[53,57,60],[60,64,67],[55,59,62]][ci];
      const chorus=Math.floor(bar/8)%2===0 ? false : true;  // Wechsel alle 8 Takte: Strophe (ruhig) / Refrain (voll)
      if(s%4===0) this._kick(t);
      if(s===4||s===12) this._snare(t);
      if(s%2===0) this._hat(t,false); if(s===14) this._hat(t,true);
      if(s%2===0) this._bass(t,ROOT+(s===6||s===14?12:0),spb/2*.9);
      if(s===0) this._pad(t,TRI,spb*4);
      const arp=[0,2,1,2,0,2,1,2,0,2,1,2,0,2,1,2];
      if(chorus){ this._lead(t,TRI[arp[s]]+12,spb/4*.9,.10); if(s%4===0) this._lead(t,TRI[2]+24,spb*.9,.06); }
      else if(s%2===1){ this._lead(t,TRI[arp[s]]+12,spb/4*.8,.06); }
    }
  };

  E.init();
})();
