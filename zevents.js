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
  const seen=(k,id)=>{ try{ return localStorage.getItem('zevt_'+K(me())+'_'+k)===id; }catch(e){ return false; } };
  const mark=(k,id)=>{ try{ localStorage.setItem('zevt_'+K(me())+'_'+k,id); }catch(e){} };

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
    // ── Team-Planer (Admin): zufällig oder von Hand einteilen ──
    _tList:[],
    adminTeamLoad(){
      const names=[...new Set([...Object.keys(ZG.otherPl||{}),me()].filter(Boolean))];
      const old={}; this._tList.forEach(x=>{ old[x.n]=x.t; });
      this._tList=names.map(n=>({n,t:old[n]||''}));
      this.adminTeamRender();
    },
    adminTeamRandom(){
      if(!this._tList.length) this.adminTeamLoad();
      const a=this._tList.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
      a.forEach((x,i)=>{ x.t=i%2===0?'r':'b'; }); this.adminTeamRender();
    },
    adminTeamSet(i,t){ if(this._tList[i]){ this._tList[i].t=t; this.adminTeamRender(); } },
    adminTeamClear(){ this._tList.forEach(x=>{ x.t=''; }); this.adminTeamRender(); },
    adminTeamRender(){
      const el=document.getElementById('zev-t-plan'); if(!el) return;
      const r=this._tList.filter(x=>x.t==='r').length, b=this._tList.filter(x=>x.t==='b').length;
      const btn=(i,t,lab,on,col)=>'<button onclick="ZEvt.adminTeamSet('+i+',\''+t+'\')" style="border:1px solid '+col+';background:'+(on?col:'transparent')+';color:#fff;border-radius:8px;padding:3px 9px;font-size:.74rem;font-weight:800;cursor:pointer">'+lab+'</button>';
      el.innerHTML='<div style="font-size:.74rem;color:rgba(255,255,255,.6);margin-bottom:5px">🔴 Rot: <b>'+r+'</b> · 🔵 Blau: <b>'+b+'</b> · ohne Team: '+(this._tList.length-r-b)+'</div>'
        +this._tList.map((x,i)=>'<div style="display:flex;gap:5px;align-items:center;padding:3px 0;border-bottom:1px solid rgba(255,255,255,.07)"><div style="flex:1;font-size:.8rem">'+esc(x.n)+'</div>'+btn(i,'r','🔴',x.t==='r','#c0392b')+btn(i,'b','🔵',x.t==='b','#2980b9')+btn(i,'','–',x.t==='','#666')+'</div>').join('')
        ||'<span style="color:rgba(255,255,255,.4)">Keine Spieler gefunden — „Spieler laden" drücken.</span>';
    },
    adminTeamStartPlanned(secs,mins){
      const r=RT(); if(!r){ toast('❌ Keine Verbindung'); return; }
      const sel=this._tList.filter(x=>x.t);
      if(sel.filter(x=>x.t==='r').length<1||sel.filter(x=>x.t==='b').length<1){ toast('❗ Jedes Team braucht mindestens 1 Spieler',3500); return; }
      const players={}; sel.forEach(x=>{ players[K(x.n)]={n:x.n,t:x.t}; });
      const startAt=Date.now()+(secs||10)*1000, endAt=startAt+(mins||5)*60000;
      return r.ref('zoo_team').set({id:'t'+Date.now(),startAt,endAt,players,created:Date.now()}).then(()=>toast('🔴🔵 Team-Event gestartet ('+sel.length+' Spieler, eigene Teams)',4000));
    },
    adminTeamStop(){
      const r=RT(); if(!r||!this.st.team) return;
      return r.ref('zoo_team/endAt').set(Date.now()).then(()=>toast('⏹️ Team-Event beendet',2500));
    },
    _myTeam(){ const t=this.st.team; const p=t&&t.players&&t.players[K(me())]; return p?p.t:null; },
    _teamChanged(){
      const t=this.st.team;
      if(!t){ this._hudRemove('zteam'); if(ZMusic.mode==='team') ZMusic.stop(); return; }
      if(Date.now()>t.endAt+30000){ return; }
      const mine=this._myTeam();
      if(mine && !seen('teamjoin',t.id) && Date.now()<t.endAt){
        mark('teamjoin',t.id);
        try{ ZHearts._toZoo&&ZHearts._toZoo(); }catch(e){}
        this.earn.total=0; this.earn._last=total();
        big(mine==='r'?'🔴 TEAM ROT':'🔵 TEAM BLAU',mine==='r'?'#ff5a5a':'#5aa8ff',3000);
        const mates=Object.values(t.players||{}).filter(p=>p.t===mine&&p.n.toLowerCase()!==me().toLowerCase()).map(p=>p.n);
        toast((mine==='r'?'🔴':'🔵')+' Dein Team: '+(mates.length?mates.join(', '):'du kämpfst allein')+'\nVerdiene in der Zeit mehr als das andere Team! Das Gewinner-Team bekommt das Verdiente ×5!',10000);
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
      this._hudRemove('zteam'); if(ZMusic.mode==='team') ZMusic.stop(); this._clearMarkers();
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
      el.innerHTML='<div style="display:inline-block;background:rgba(0,0,0,.6);border-radius:12px;padding:3px 10px"><span style="color:#ff7a7a">🔴 '+fmt(rt)+'</span> &nbsp;·&nbsp; <span style="color:#7ab8ff">🔵 '+fmt(bt)+'</span> &nbsp;·&nbsp; ⏱ '+right+' <span style="opacity:.7">· Du: '+(mine==='r'?'🔴':'🔵')+'</span>'
        +(function(){ const m=Object.values(t.players||{}).filter(p=>p.t===mine&&p.n.toLowerCase()!==me().toLowerCase()).map(p=>p.n); const shown=m.slice(0,5).join(', ')+(m.length>5?' +'+(m.length-5):''); return '<div style="font-size:.66rem;opacity:.85;font-weight:700;margin-top:1px">'+(mine==='r'?'🔴':'🔵')+' Team: '+esc(shown||'nur du')+'</div>'; })()
        +'</div>';
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
      if(c&&c.until>Date.now()){ ZG._gravMul=1/(c.mult||5); if(!seen('chaos',c.id)){ mark('chaos',c.id); big('🌙 MOND-NACHT','#c9b6ff',3500); toast('Du kannst jetzt '+(c.mult||5)+'× höher und länger springen! (Leertaste / Springen)',6000); } }
      else { ZG._gravMul=1; this._hudRemove('zchaos'); this._moonOff(); }
    },
    // 🌙 Nacht in Lila: Himmel, Mond, Sterne, lila Farbschleier, Wiegenlied
    _moonOn(c){
      try{
        if(!ZG._moonMode){
          ZG._moonMode=true;
          if(ZG._sunMesh){ this._sunOld={s:ZG._sunMesh.scale.x,c:ZG._sunMesh.material.color.getHex(),p:ZG._sunMesh.position.clone()}; }
        }
        if(ZG._skyMat) ZG._skyMat.color.setHex(0x1b0f45);
        if(ZG._sunMesh){ ZG._sunMesh.visible=true; ZG._sunMesh.material.color.setHex(0xf3eeff); ZG._sunMesh.scale.setScalar(2.6); ZG._sunMesh.position.set(-70,85,-110); }
        if(ZG._starsGroup) ZG._starsGroup.visible=true;
        let o=document.getElementById('zmoon-tint');
        if(!o){ o=document.createElement('div'); o.id='zmoon-tint';
          o.style.cssText='position:fixed;inset:0;z-index:40;pointer-events:none;background:radial-gradient(ellipse at 50% 45%,rgba(120,90,200,.55),rgba(50,20,110,.78));mix-blend-mode:multiply;transition:opacity 2s;opacity:0';
          document.body.appendChild(o); requestAnimationFrame(()=>{ o.style.opacity='1'; });
          const g=document.createElement('div'); g.id='zmoon-glow';
          g.style.cssText='position:fixed;inset:0;z-index:41;pointer-events:none;background:radial-gradient(ellipse at 50% 30%,rgba(190,160,255,.16),rgba(0,0,0,0) 65%);';
          document.body.appendChild(g);
        }
        if(!ZMusic.on) ZMusic.play(Math.max(0,c.until-Date.now()),'lullaby');
      }catch(e){}
    },
    _moonOff(){
      try{
        if(!ZG._moonMode) return;
        ZG._moonMode=false;
        if(ZG._sunMesh&&this._sunOld){ ZG._sunMesh.scale.setScalar(this._sunOld.s||1); ZG._sunMesh.material.color.setHex(this._sunOld.c); ZG._sunMesh.position.copy(this._sunOld.p); }
        try{ ZG._updateTimeOfDay(); }catch(e){}
        ['zmoon-tint','zmoon-glow'].forEach(id=>{ const o=document.getElementById(id); if(o) o.remove(); });
        if(ZMusic.mode==='lullaby') ZMusic.stop();
      }catch(e){}
    },
    _chaosLoop(){
      const c=this.st.chaos; const on=c&&c.until>Date.now();
      if(!on){ if(ZG._gravMul!==1) ZG._gravMul=1; this._hudRemove('zchaos'); this._moonOff(); return; }
      ZG._gravMul=1/(c.mult||5);
      this._moonOn(c);
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
        // Nach 1 Stunde nicht mehr anzeigen (auch nicht für Spieler, die sich erst später anmelden)
        const age=Date.now()-(c.endedAt||c.startAt||0);
        if(c.summary && !seen('recap',c.id)){ mark('recap',c.id); if(age<3600000) this._recapShow(c.summary); }
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
    note(t){ this._note={t,until:Date.now()+12000}; toast(t,5000); try{ this.adminStatus(); }catch(x){} },
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
      try{ if(this._note&&Date.now()<this._note.until) parts.unshift('<b style="color:#ffd166">'+esc(this._note.t)+'</b>'); }catch(x){}
      try{ if(window.ZEvt2) parts.push(...ZEvt2.statusParts()); if(window.ZEvt3) parts.push(...ZEvt3.statusParts()); }catch(x){}
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
    play(durMs,mode,cfg){
      if(this.on) return;
      this.mode=mode||'team'; this.cfg=cfg||null; this.bpm=this.mode==='lullaby'?54:(this.mode==='boss'&&cfg?cfg.bpm:126);
      try{
        const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return;
        this.ctx=this.ctx||new AC(); if(this.ctx.state==='suspended') this.ctx.resume();
        this._master=this.ctx.createGain(); this._master.gain.value=0.0; this._master.connect(this.ctx.destination);
        this._master.gain.linearRampToValueAtTime(this.mode==='lullaby'?0.30:0.32,this.ctx.currentTime+(this.mode==='lullaby'?4:2));
        // Rauschen-Buffer für Snare/Hats
        const len=this.ctx.sampleRate; const b=this.ctx.createBuffer(1,len,this.ctx.sampleRate); const d=b.getChannelData(0); for(let i=0;i<len;i++) d[i]=Math.random()*2-1; this._noise=b;
        this.on=true; this._step=0; this._next=this.ctx.currentTime+0.15; this._stopAt=Date.now()+(durMs||300000); this._t0=Date.now();
        this._timer=setInterval(()=>this._sched(),80);
        if(this.mode==='team') this._lyrUI();
        if(this.mode==='lullaby'||(cfg&&cfg.echo)) this._lullSetup();
      }catch(e){ console.log('[Music-debug] '+e.message); }
    },
    stop(){
      if(!this.on) return; this.on=false;
      clearInterval(this._timer);
      try{ this._master.gain.cancelScheduledValues(this.ctx.currentTime); this._master.gain.setTargetAtTime(0,this.ctx.currentTime,0.5); const m=this._master; setTimeout(()=>{ try{m.disconnect();}catch(e){} },2500); }catch(e){}
      if(this._lyr){ this._lyr.remove(); this._lyr=null; }
      try{ if(this._echo){ const e=this._echo; setTimeout(()=>{ try{e.disconnect();}catch(x){} },3000); this._echo=null; } }catch(x){}
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
      const c=this.ctx, spb=60/this.bpm;
      if(this.mode==='lullaby'){
        const s8=spb/2;
        while(this._next<c.currentTime+0.5){ this._playLull(this._step,this._next,spb); this._next+=s8; this._step++; }
        return;
      }
      const s16=spb/4;
      if(this.mode==='boss'){ const fn=(this.cfg&&this.cfg.style)?'_playSong':'_playBoss'; while(this._next<c.currentTime+0.35){ this[fn](this._step,this._next,spb); this._next+=s16; this._step++; } return; }
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
    // ── Wiegenlied „Mondlicht" (ohne Gesang): Spieluhr, warme Flächen, sanfter Bass, Echo ──
    _lullSetup(){
      const c=this.ctx; const d=c.createDelay(1.5); d.delayTime.value=0.52; const fb=c.createGain(); fb.gain.value=0.42; const lp=c.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=2200;
      d.connect(lp); lp.connect(fb); fb.connect(d); this._echo=d; const send=c.createGain(); send.gain.value=0.5; this._echoIn=send; send.connect(d); lp.connect(this._master);
    },
    _bell(t,m,len,vol){
      const c=this.ctx; const f=this._note(m);
      [[1,1],[2,.28],[3,.08]].forEach(([mul,a])=>{
        const o=c.createOscillator(),g=c.createGain(); o.type='sine'; o.frequency.value=f*mul;
        g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime((vol||.2)*a,t+.012); g.gain.exponentialRampToValueAtTime(0.0001,t+len*(mul===1?1:.55));
        o.connect(g); g.connect(this._master); g.connect(this._echoIn); o.start(t); o.stop(t+len+.1);
      });
    },
    _warm(t,ms,len){
      const c=this.ctx; ms.forEach(m=>{ [-5,5].forEach(det=>{ const o=c.createOscillator(),g=c.createGain(),f=c.createBiquadFilter(); o.type='triangle'; o.frequency.value=this._note(m); o.detune.value=det; f.type='lowpass'; f.frequency.value=900;
        g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(0.05,t+len*.45); g.gain.linearRampToValueAtTime(0.0001,t+len);
        o.connect(f); f.connect(g); g.connect(this._master); o.start(t); o.stop(t+len+.1); }); });
    },
    _playLull(step,t,spb){
      const s=step%8, bar=Math.floor(step/8)%8;
      const MEL=[[76,0,79,0,81,0,79,0],[76,0,74,0,72,0,0,0],[74,0,76,0,79,0,76,0],[74,0,0,0,72,0,0,0],[67,0,72,0,76,0,74,0],[72,0,0,0,69,0,0,0],[74,0,76,0,74,0,72,0],[72,0,0,0,0,0,0,0]];
      const CH=[[48,55,64],[48,55,64],[45,52,60],[45,52,60],[41,48,57],[41,48,57],[43,50,59],[48,55,64]];
      const m=MEL[bar][s]; if(m) this._bell(t,m,spb*1.9,.2);
      if(s===0){ this._warm(t,CH[bar],spb*4); const o=this.ctx.createOscillator(),g=this.ctx.createGain(); o.type='sine'; o.frequency.value=this._note(CH[bar][0]-12); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(0.16,t+.4); g.gain.linearRampToValueAtTime(0.0001,t+spb*4); o.connect(g); g.connect(this._master); o.start(t); o.stop(t+spb*4+.1); }
      // verträumte hohe Funken (Sterne)
      if(s===5 && Math.random()<.45){ const P=[84,86,88,91,93]; this._bell(t+Math.random()*.2,P[Math.floor(Math.random()*P.length)],spb*2.2,.07); }
    },
    // ── Boss-Musik (5 Themen über cfg): Bass, Riff, Drums, Boss-Puls ──
    _playBoss(step,t,spb){
      const C=this.cfg||{}, s=step%16, bar=Math.floor(step/16);
      const sc=C.scale||[0,2,3,5,7,8,10];
      const deg=d=>{ const o=Math.floor(d/sc.length); return C.root+sc[((d%sc.length)+sc.length)%sc.length]+12*o; };
      if(C.kick&&C.kick[s]==='x') this._kick(t);
      if(C.snare&&C.snare[s]==='x') this._snare(t);
      if(C.hat&&C.hat[s]==='x') this._hat(t,s===14);
      const rf=C.riff[s]; const shift=[0,0,3,2][bar%4];
      if(rf>=0){
        this._bossNote(t,deg(rf+shift)+12,spb/4*1.6,C.wave||'sawtooth',C.drive?.13:.10,C.drive);
        if(!C.bassEvery && s%4===0) this._bass(t,deg(rf+shift)-12,spb/2*.9);
      }
      if(C.bassEvery && s%C.bassEvery===0) this._bass(t,deg(shift)-12+(s%4===2?0:0),spb/4*C.bassEvery*.9);
      if(s===0) this._pad(t,[deg(shift),deg(shift+2),deg(shift+4)].map(m=>m+12),spb*4);
    },
    _bossNote(t,m,len,wave,vol,drive){ const c=this.ctx,o=c.createOscillator(),g=c.createGain(),f=c.createBiquadFilter(); o.type=wave; o.frequency.value=this._note(m); f.type='lowpass'; f.frequency.value=drive?4200:2400; this._env(g,t,.008,len,vol); o.connect(f); if(drive){ const w=c.createWaveShaper(); const cv=new Float32Array(257); for(let i=0;i<257;i++){ const x=i/128-1; cv[i]=Math.tanh(x*5); } w.curve=cv; f.connect(w); w.connect(g); } else f.connect(g); g.connect(this._master); o.start(t); o.stop(t+len+.05); },

    /* ═══ 5 Admin-Lieder — jedes mit eigenem Klang, Takt, Akkorden und Schlagzeug ═══ */
    _clap(t){ const c=this.ctx,s=c.createBufferSource(); s.buffer=this._noise; const f=c.createBiquadFilter(); f.type='bandpass'; f.frequency.value=1250; f.Q.value=.8; const g=c.createGain(); this._env(g,t,.002,.13,.8); s.connect(f); f.connect(g); g.connect(this._master); s.start(t); s.stop(t+.3); },
    _tom(t,fr){ const c=this.ctx,o=c.createOscillator(),g=c.createGain(); o.type='sine'; o.frequency.setValueAtTime(fr,t); o.frequency.exponentialRampToValueAtTime(fr/2.2,t+.22); this._env(g,t,.004,.3,.9); o.connect(g); g.connect(this._master); o.start(t); o.stop(t+.4); },
    _stab(t,ms,len,wave,vol,drive){ ms.forEach(m=>this._bossNote(t,m,len,wave,vol,drive)); },
    _playSong(step,t,spb){
      const st=this.cfg.style, s=step%16, bar=Math.floor(step/16), b4=bar%4, b8=bar%8;
      const rest=-1;
      if(st==='party'){
        // C-Dur Party: I–V–vi–IV, Four-on-the-floor, Offbeat-Hi-Hat, Klatschen, hüpfender Bass, Synth-Hook
        const ROOT=[48,43,45,41][b4], TRI=[[60,64,67],[59,62,67],[60,64,69],[60,65,69]][b4];
        const HOOK=[[76,rest,79,rest,84,rest,79,rest,76,rest,74,rest,72,rest,rest,rest],[74,rest,79,rest,83,rest,79,rest,74,rest,71,rest,67,rest,rest,rest],[72,rest,76,rest,81,rest,76,rest,72,rest,69,rest,72,rest,76,rest],[77,rest,81,rest,84,rest,81,rest,77,rest,76,rest,74,rest,72,rest]][b4];
        if(s%4===0) this._kick(t);
        if(s===4||s===12) this._clap(t);
        if(s%4===2) this._hat(t,true); else if(s%2===0) this._hat(t,false);
        if(s%2===0) this._bass(t,ROOT+(s%4===2?12:0),spb/2*.8);
        if(s%4===2) this._stab(t,TRI.map(m=>m+12),spb*.22,'sawtooth',.045);
        if(HOOK[s]>0) this._bossNote(t,HOOK[s],spb/4*1.7,'square',.075);
        return;
      }
      if(st==='mystery'){
        // A-harmonisch-Moll, kein Beat: Herzschlag, Spieluhr-Glocken, tiefer Drone, Echo
        const CH=[[45,52,57],[41,48,57],[40,47,56],[45,52,57]][b4];
        const MEL=[{0:76,6:72,10:74},{0:77,6:72,10:69},{0:76,8:80,12:76},{0:72,8:69}][b4];
        if(s===0){ this._warm(t,CH,spb*4); const o=this.ctx.createOscillator(),g=this.ctx.createGain(); o.type='sine'; o.frequency.value=this._note(CH[0]-12); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(.16,t+spb); g.gain.linearRampToValueAtTime(0.0001,t+spb*4); o.connect(g); g.connect(this._master); o.start(t); o.stop(t+spb*4+.1); }
        if(s===0||s===3) this._tom(t,s===0?70:60);
        if(MEL[s]) this._bell(t,MEL[s],spb*2.2,.2);
        if(s===13&&Math.random()<.5) this._bell(t+Math.random()*.15,[88,91,93][Math.floor(Math.random()*3)],spb*2,.06);
        if(s===8&&b4%2===1) this._hat(t,true);
        return;
      }
      if(st==='hero'){
        // C-Dur Fanfare: Pauken, Marsch-Snare, strahlende Blechbläser in Terzen, grosse Flächen
        const ROOT=[48,53,55,48][b4], TRI=[[60,64,67],[60,65,69],[59,62,67],[60,64,67]][b4];
        const M=[[[0,72,2],[2,72,1],[3,72,1],[4,76,4],[8,79,6]],[[0,77,2],[2,77,1],[3,77,1],[4,81,4],[8,84,6]],[[0,79,2],[2,79,1],[3,79,1],[4,83,4],[8,86,6]],[[0,84,8],[8,79,4],[12,72,4]]][b4];
        if(s%4===0) this._tom(t,85);
        if(s===4||s===12||(b4===3&&s>=12)) this._snare(t);
        if(s===0) { this._hat(t,true); this._pad(t,TRI,spb*4); }
        if(s%8===0) this._bass(t,ROOT-12,spb*1.8);
        M.forEach(([ns,n,l])=>{ if(ns===s){ this._bossNote(t,n,spb/4*l*.95,'sawtooth',.075); this._bossNote(t,n-5,spb/4*l*.95,'sawtooth',.05); this._bossNote(t,n-12,spb/4*l*.95,'square',.03); } });
        return;
      }
      if(st==='chase'){
        // D-Moll Verfolgungsjagd: 172 BPM, Sechzehntel-Bass, verzerrtes Chromatik-Riff, Snare-Wirbel, Sirene
        const OFF=[0,rest,0,1,0,rest,rest,3,0,rest,0,1,0,rest,5,3][s], SH=[0,0,-2,-5][b4];
        if(s%4===0||s===10) this._kick(t);
        if(s===4||s===12||(b4===3&&s>=8)) this._snare(t);
        this._hat(t,s%4===2);
        this._bass(t,38+SH+(s%8>=6?12:0),spb/4*.85);
        if(OFF>=0) this._bossNote(t,62+SH+OFF,spb/4*1.1,'sawtooth',.06,true);
        if(s%8===0) this._bossNote(t,(b4%2?84:81)+SH,spb*1.9,'sine',.05);
        return;
      }
      if(st==='disco'){
        // Disco-Fieber: Oktav-Bass, Hi-Hat-"Chicka", E-Piano-Akkorde auf Offbeats, Streicher, Klatschen
        const ROOT=[38,43,36,41][b4], CH=[[62,65,69,72],[59,62,65,67],[60,64,67,71],[60,65,69,72]][b4];
        const LEAD=[{0:74,6:72,10:69},{0:71,6:74,10:79},{0:76,6:72,10:71},{0:77,6:76,10:72}][b4];
        if(s%4===0) this._kick(t);
        if(s===4||s===12) this._clap(t);
        this._hat(t,s%4===2);
        if(s%2===0) this._bass(t,ROOT+(s%4===2?12:0),spb/2*.7);
        if(s===3||s===6||s===11||s===14) this._stab(t,CH,spb*.2,'triangle',.05);
        if(s===0) this._pad(t,CH.slice(0,3).map(m=>m+12),spb*4);
        if(LEAD[s]) this._bossNote(t,LEAD[s],spb*.9,'triangle',.09);
        return;
      }
    },
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

;
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
    _winShown:{},
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
      if(!p){ hudOff('zpotato'); this._potClear(); this._potOverAt=0; return; }
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
      if(!p||p.state!=='run'){ if(p&&p.state==='over'&&(this._potOverAt=this._potOverAt||Date.now())&&Date.now()-this._potOverAt<5000) hud('zpotato','🏆 Kartoffel-Event vorbei'+(p.winner?' · Sieger: '+esc(p.winner):''),'top:160px;background:rgba(0,0,0,.6);padding:6px 14px;border-radius:12px'); else hudOff('zpotato'); this._potMarks(null); return; }
      this._potOverAt=0;
      const left=Math.max(0,Math.ceil((p.roundEnd-Date.now())/1000));
      const n=Object.keys(p.alive||{}).length;
      const mine=!!(p.alive&&p.alive[K(me())]);
      let t;
      if(!mine) t='👀 Du bist raus · '+n+' übrig · 💣 bei <b>'+esc(p.holder)+'</b> ('+left+'s)';
      else if(p.holder===me()) t='<span style="color:#ff6b6b">💣 DU HAST DIE KARTOFFEL! Slappe jemanden! '+left+'s</span>';
      else t='💣 '+esc(p.holder)+' hat die Kartoffel ('+left+'s) · '+n+' übrig — lauf weg!';
      hud('zpotato',t,'top:160px;background:rgba(0,0,0,.65);padding:6px 14px;border-radius:12px;border:2px solid '+(p.holder===me()?'#ff3b3b':'rgba(255,255,255,.25)'));
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
      // Textur pro Emoji nur einmal erzeugen (spart Speicher bei vielen Meteoren/Markierungen)
      const cache=(window.__zevtTex=window.__zevtTex||{});
      let t=cache[emo];
      if(!t){ const c=document.createElement('canvas'); c.width=c.height=128; const x=c.getContext('2d'); x.font='96px serif'; x.textAlign='center'; x.textBaseline='middle'; x.fillText(emo,64,70); t=cache[emo]=new THREE.CanvasTexture(c); }
      const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false})); s.scale.set(sz,sz,1); return s;
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
        hud('zsize','Riesen- & Zwergen-Tag · noch '+Math.ceil((s.until-Date.now())/60000)+' Min · du: '+(mul>1?'🦣 Riese (hohe Sprünge)':'🐜 Zwerg (schnell)'),'top:160px;background:rgba(0,0,0,.55);padding:5px 12px;border-radius:12px;font-size:.78rem');
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
      if(b.state==='on') this._sawOn=b.id;
      if(b.state==='won' && !seen('bosswin',b.id) && !this._winShown[b.id]){
        this._winShown[b.id]=1; mark('bosswin',b.id);
        const d=b.dmg||{}; const my=d[K(me())]||0;
        if(this._sawOn!==b.id && !(my>0)){ /* Spätankömmling / anderes Gerät: Kampf nicht miterlebt → keine Meldung */ } else {
        big('🏆 BOSS BESIEGT!','#FFD700',4500);
        const top=Object.keys(d).sort((a,c)=>d[c]-d[a])[0];
        if(my>0 && b.prize>0){ let pr=b.prize; if(top===K(me())) pr*=3; addMT(pr); toast('🏆 Boss besiegt! +'+pr+' MT'+(top===K(me())?' (Top-Schaden ×3!)':''),6000); }
        else toast('🏆 '+BOSSES[b.boss].n+' wurde besiegt! Top-Schaden: '+(top?esc(top):'–'),5000);
        }
        this._stopMusic();
      }
      if(b.state==='lost' && !seen('bosslost',b.id) && this._sawOn===b.id){ mark('bosslost',b.id); big('⏰ Zeit um — der Boss hat gewonnen','#ff6b6b',4000); this._stopMusic(); }
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
        +'<div style="width:min(80vw,340px);height:14px;background:rgba(0,0,0,.6);border:2px solid #fff;border-radius:8px;overflow:hidden;margin:3px auto"><div style="height:100%;width:'+pct+'%;background:linear-gradient(90deg,'+B.col+',#fff3)"></div></div>','top:160px');
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

;
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
    // Sturm-Lied: düsteres, treibendes Moll, 140 BPM, Sägezahn-Lead mit Verzerrung, Donner-Kicks
    storm:{n:'Gewitter-Sturm',e:'⛈️',bpm:140,root:38,scale:[0,2,3,5,7,8,10],wave:'sawtooth',drive:true,bassEvery:4,riff:[0,-1,-1,2,-1,3,-1,-1,5,-1,3,-1,2,-1,0,-1],kick:'x..x..x...x..x..',snare:'....x.......x..x',hat:'x.x.x.x.x.x.x.xx'},
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

;
/* ZEvt4 — Admin-Events (v660): ⛈️ Sturm, 🚨 Zoo-Räumung, 🪤 Fallen-Fest. Admin startet, alle im Zoo bekommen Ansage + Effekte (RTDB zoo_aevent). */
(function(){
  'use strict';
  let _off=0; const tn=()=>Date.now()+_off; /* Serverzeit, damit abweichende Geräte-Uhren Events nicht verpassen */
  const RT=()=>{ try{ return (typeof _rtdb!=='undefined'&&_rtdb&&State._useCloud())?_rtdb:null; }catch(e){ return null; } };
  const toast=(m,ms)=>{ try{ ZP.toast(m,ms||3000); }catch(e){} };
  const big=(t,c,ms)=>{ try{ ZG._bigText(t,c||'#fff',ms||2500); }catch(e){} };
  const me=()=>(typeof ZS!=='undefined'&&ZS&&ZS.player)||'';
  const inZoo=()=>{ try{ return !!(ZG&&ZG.cam&&ZG.scene&&ZS&&ZS.zoo&&me()); }catch(e){ return false; } };
  const rng=seed=>{ let a=seed>>>0; return ()=>{ a=(a+0x6D2B79F5)>>>0; let t=a; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }; };
  const INFO={storm:{e:'⛈️',n:'STURM',c:'#7fb3ff',t:'Es wird Nacht, Regen & Blitze schlagen überall ein! Achte auf die gelben Warnkreise am Boden — wer getroffen wird, verliert 3 ❤.'},
    evac:{e:'🚨',n:'ZOO-RÄUMUNG',c:'#ff5252',t:'Alle raus aus fremden Gehegen — sonst wirst du zum Platz geschickt!'},
    traps:{e:'🪤',n:'FALLEN-FEST',c:'#ffb74d',t:'Überall Fallen! Pass auf, wo du hintrittst.'},
    magnet:{e:'🧲',n:'MAGNET-ADMIN',c:'#ff6bd6',t:'Der Admin zieht dich zu sich! Wer ihn als Erster berührt, gewinnt den Preis.'},
    poll:{e:'🏆',n:'MINI-WAHL',c:'#ffd54f',t:'Abstimmen! Wähle deine Antwort oben auf dem Bildschirm.'},
    mystery:{e:'📦',n:'MYSTERY-BOX',c:'#c58bff',t:'Vor dir liegt eine Kiste! Geh hin und öffne sie — was drin ist, weiss keiner.'},
    color:{e:'🌈',n:'FARB-CHAOS',c:'#7dffb0',t:'Die ganze Welt wechselt die Farben!'}};
  const K=n=>String(n||'').toLowerCase().replace(/[.#$\[\]\/]/g,'_');
  const addMT=n=>{ try{ ZS.zoo.mt=(ZS.zoo.mt||0)+n; ZS.save&&ZS.save(); ZG._updHUD&&ZG._updHUD(); }catch(e){} };
  const E=window.ZEvt4={
    cur:null, _started:false, _id:null, _traps:[], _tg:null, _hitCd:{},
    init(){ if(E._iv) return; E._iv=setInterval(()=>{ if(E._started){ E._loop(); return; } const r=RT(); if(!r||!inZoo()) return; E._started=true; try{ r.ref('.info/serverTimeOffset').on('value',o=>{ _off=+o.val()||0; try{ E._changed(); }catch(_){} }); }catch(e){} try{ r.ref('zoo_aevent').on('value',s=>{ E.cur=s.val()||null; E._changed(); }); }catch(e){} },1000); },
    active(){ const c=E.cur; return (c&&c.until>tn()&&INFO[c.type])?c:null; },
    // ── Admin ──
    adminStart(type,mins,o){
      const r=RT(); if(!r){ toast('❌ Keine Verbindung'); return; } if(!INFO[type]) return; mins=Math.max(1,mins||5); o=o||{};
      const id=String(tn()), until=tn()+mins*60000, ev={id,type,until,by:me()};
      if(type==='magnet'||type==='mystery') ev.prize=Math.max(0,Math.round(+o.prize||0));
      if(type==='poll'){ const opts=String(o.opts||'').split(',').map(x=>x.trim()).filter(Boolean).slice(0,4); if(!o.q||opts.length<2){ toast('❗ Frage und mindestens 2 Optionen (mit Komma getrennt) eingeben'); return; } ev.q=String(o.q).slice(0,80); ev.opts=opts.map(x=>x.slice(0,30)); r.ref('zoo_aevent_votes/'+id).remove(); }
      r.ref('zoo_aevent').set(ev);
      if(type==='color'){ try{ ZEvt3.adminMusicPlay('disco',mins); }catch(e){} }
      if(type==='storm'){
        try{ ZWeather.adminSet('storm',Math.random()*Math.PI*2,mins); }catch(e){}
        try{ ZEvt3.adminMusicPlay('storm',mins); }catch(e){}
      }
      toast(INFO[type].e+' '+INFO[type].n+' gestartet ('+mins+' Min)',4000);
    },
    adminStop(){ const r=RT(); if(!r) return; r.ref('zoo_aevent').set(null); try{ r.ref('zoo_weather').remove(); }catch(e){} try{ ZEvt3.adminMusicStop(); }catch(e){} toast('⏹️ Admin-Event beendet'); },
    // ── Clients ──
    _changed(){
      const c=E.active();
      if(!c){ if(E._id&&!(E.cur&&E.cur.type==='poll'&&E.cur.id===E._id&&E.cur.until<=tn()&&E._pollEl)){ E._clear(); } return; }
      if(c.id===E._id) return; E._clear(); E._id=c.id; const I=INFO[c.type];
      big(I.e+' '+I.n+'!',I.c,3500); toast(I.e+' '+I.t,6000);
      try{ if(navigator.vibrate) navigator.vibrate([200,100,200]); }catch(e){}
      if(c.type==='traps') E._spawnTraps(c);
      if(c.type==='mystery') E._spawnBox(c);
      if(c.type==='magnet'){ E._magWon=false; E._magFree=(c.by===me()); }
      if(c.type==='poll') E._pollOpen(c);
      if(c.type==='evac') E._evacTick(true);
      if(c.type==='color') E._colorOn();
    },
    _clear(){
      E._id=null; E._hitCd={}; E._traps=[]; E._pollClose(); E._boxOff(); E._colorOff();
      if(E._tg){ try{ ZG.scene.remove(E._tg); }catch(e){} E._tg=null; }
    },
    _spawnTraps(c){
      const g=rng(parseInt(c.id.slice(-9))||7), R=(ZG.WR||120)-8, grp=new THREE.Group(); E._traps=[];
      for(let i=0;i<70;i++){ const a=g()*Math.PI*2, d=14+Math.sqrt(g())*(R-14); const x=Math.cos(a)*d, z=Math.sin(a)*d;
        const cache=(window.__zevtTex=window.__zevtTex||{}); let t=cache['🪤'];
        if(!t){ const cv=document.createElement('canvas'); cv.width=cv.height=128; const cx=cv.getContext('2d'); cx.font='96px serif'; cx.textAlign='center'; cx.textBaseline='middle'; cx.fillText('🪤',64,70); t=cache['🪤']=new THREE.CanvasTexture(cv); }
        const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true})); s.scale.set(1.8,1.8,1); s.position.set(x,.9,z); grp.add(s); E._traps.push({x,z}); }
      ZG.scene.add(grp); E._tg=grp;
    },
    // ── 📦 Mystery-Box ──
    _spawnBox(c){
      try{ const a=ZG.yaw, x=ZG.pl.x-Math.sin(a)*5, z=ZG.pl.z-Math.cos(a)*5; const cache=(window.__zevtTex=window.__zevtTex||{}); let t=cache['📦'];
        if(!t){ const cv=document.createElement('canvas'); cv.width=cv.height=128; const cx=cv.getContext('2d'); cx.font='96px serif'; cx.textAlign='center'; cx.textBaseline='middle'; cx.fillText('📦',64,70); t=cache['📦']=new THREE.CanvasTexture(cv); }
        const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true})); s.scale.set(2.4,2.4,1); s.position.set(x,1.3,z); ZG.scene.add(s); E._box={s,x,z,c}; }catch(e){}
    },
    _boxOff(){ if(E._box){ try{ ZG.scene.remove(E._box.s); }catch(e){} E._box=null; } },
    _openBox(c){
      E._boxOff(); const r=Math.random(), base=Math.max(100,c.prize||500);
      if(r<.55){ const amt=Math.round(base*(.5+Math.random()*2.5)); addMT(amt); big('📦 +'+amt+' MT!','#ffd54f',2500); toast('📦 Mystery-Box: '+amt+' MT gefunden!',4000); }
      else if(r<.8){ try{ const z=ZS.zoo, now=tn(); const act=z.adminLuckExp>now; z.adminLuckMult=Math.max(act?(z.adminLuckMult||0):0,3); z.adminLuckExp=(act?z.adminLuckExp:now)+3*60000; ZS.save&&ZS.save(); ZG._updHUD&&ZG._updHUD(); }catch(e){} big('🍀 ×3 GLÜCK!','#7dffb0',2500); toast('📦 Mystery-Box: ×3 Glück für 3 Minuten!',4500); }
      else { ZG._minusUntil=tn()+6000; ZG._minusF=.35; big('🐔 STREICH!','#ff8a65',2500); toast('📦 Mystery-Box: Streich! 6 Sekunden Schneckentempo 🐌',4500); }
    },
    // ── 🧲 Magnet-Admin ──
    _magnet(c,dt){
      if(E._magFree||c.by===me()||!inZoo()||(typeof ZHearts!=='undefined'&&ZHearts.dead)||ZG._spaceActive||ZG._jumpActive||ZG._arcadeActive||ZG._mazeActive||ZG._trashActive||ZG._iceRoomActive) return;
      const a=(ZG.otherPl||{})[c.by]; if(!a) return; const dx=a.x-ZG.pl.x, dz=a.z-ZG.pl.z, d=Math.hypot(dx,dz);
      if(d<2.6){ E._magFree=true; E._magReach(c); return; }
      const sp=Math.min(d,4.5*dt); ZG.pl.x+=dx/d*sp; ZG.pl.z+=dz/d*sp; try{ ZBases.collide(ZG.pl); }catch(e){}
    },
    _magReach(c){
      const r=RT(); if(!r){ return; }
      r.ref('zoo_aevent/win').transaction(v=>v?undefined:{n:me(),at:tn()},(err,ok)=>{
        if(ok){ if(c.prize>0) addMT(c.prize); big('🧲 DU BIST ERSTER!','#ff6bd6',3000); toast('🧲 Du hast den Admin zuerst berührt!'+(c.prize>0?' +'+c.prize+' MT':''),5000); }
        else toast('🧲 Admin berührt — du bist frei!',2500); });
    },
    // ── 🏆 Mini-Wahl ──
    _pollOpen(c){
      E._pollClose(); const r=RT(); const el=document.createElement('div'); el.id='zev4-poll';
      el.style.cssText='position:fixed;left:50%;top:70px;transform:translateX(-50%);z-index:562;background:rgba(20,16,42,.94);border:2px solid #ffd54f;border-radius:16px;padding:12px 14px;color:#fff;font-family:Arial,sans-serif;text-align:center;width:min(92vw,360px);box-shadow:0 6px 30px rgba(0,0,0,.5)';
      document.body.appendChild(el); E._pollEl=el; E._votes={}; E._myVote=null;
      if(r){ E._pollRef=r.ref('zoo_aevent_votes/'+c.id); E._pollCb=E._pollRef.on('value',s=>{ E._votes=s.val()||{}; E._pollDraw(); }); }
      E._pollDraw();
    },
    _pollTally(c){ const t=(c.opts||[]).map(()=>0); Object.keys(E._votes||{}).forEach(k=>{ const v=E._votes[k]; if(t[v]!=null) t[v]++; }); return t; },
    _pollDraw(){
      const c=E.cur, el=E._pollEl; if(!c||!el||c.type!=='poll') return; const t=E._pollTally(c), tot=t.reduce((a,b)=>a+b,0), left=Math.max(0,Math.ceil((c.until-tn())/1000)), over=left<=0;
      const mx=Math.max.apply(null,t);
      el.innerHTML='<div style="font-weight:900;color:#ffd54f;font-size:.95rem">🏆 '+(over?'ERGEBNIS':'MINI-WAHL')+' · '+(over?'beendet':left+' s')+'</div><div style="font-weight:800;margin:6px 0 8px;font-size:1rem">'+c.q.replace(/</g,'&lt;')+'</div>'
        +(c.opts||[]).map((o,i)=>{ const pct=tot?Math.round(t[i]/tot*100):0, win=over&&tot&&t[i]===mx; return '<button data-i="'+i+'" '+(over?'disabled':'')+' style="display:block;width:100%;margin:5px 0;padding:9px 10px;border-radius:10px;border:2px solid '+(E._myVote===i?'#7dffb0':win?'#ffd54f':'rgba(255,255,255,.25)')+';background:linear-gradient(90deg,rgba(255,213,79,.35) '+pct+'%,rgba(255,255,255,.07) '+pct+'%);color:#fff;font-weight:800;font-size:.9rem;text-align:left;cursor:pointer">'+(win?'👑 ':'')+o.replace(/</g,'&lt;')+' <span style="float:right">'+t[i]+' ('+pct+'%)</span></button>'; }).join('')
        +'<div style="font-size:.7rem;color:rgba(255,255,255,.55)">'+tot+' Stimme'+(tot===1?'':'n')+(E._myVote!=null?' · du hast abgestimmt (änderbar)':'')+'</div>';
      el.querySelectorAll('button[data-i]').forEach(b=>b.onclick=()=>{ const i=+b.dataset.i, r=RT(); if(!r||c.until<tn()) return; E._myVote=i; r.ref('zoo_aevent_votes/'+c.id+'/'+K(me())).set(i); E._votes[K(me())]=i; E._pollDraw(); });
    },
    _pollClose(){ try{ if(E._pollRef&&E._pollCb) E._pollRef.off('value',E._pollCb); }catch(e){} E._pollRef=null; E._pollCb=null; if(E._pollEl){ E._pollEl.remove(); E._pollEl=null; } },
    // ── 🌈 Farb-Chaos ──
    _colorOn(){ try{ if(window.ZCalm&&ZCalm.on) return; const cv=ZG.renderer&&ZG.renderer.domElement; if(!cv) return; cv.style.transition='filter 1.6s ease-in-out'; E._cv=cv; const sw=()=>{ cv.style.filter='hue-rotate('+Math.floor(Math.random()*360)+'deg) saturate('+(1.3+Math.random()*.9).toFixed(2)+')'; }; sw(); E._cIv=setInterval(sw,2800); }catch(e){} },
    _colorOff(){ if(E._cIv){ clearInterval(E._cIv); E._cIv=null; } if(E._cv){ E._cv.style.filter=''; setTimeout(()=>{ try{ if(E._cv&&!E._cIv) E._cv.style.transition=''; }catch(e){} },1800); } },
    _evacTick(first){
      try{
        if(!inZoo()||(typeof ZHearts!=='undefined'&&ZHearts.dead)) return;
        const others=ZG.otherPl||{}, k=n=>String(n||'').toLowerCase(); let hit=null;
        Object.keys(others).forEach(n=>{ if(k(n)===k(me())) return; const op=others[n]; if(op&&window.ZBases&&ZBases._inEnc(ZG.pl,op)) hit=n; });
        if(!hit) return;
        const a=Math.random()*Math.PI*2, d=3+Math.random()*5; ZG.pl.x=Math.cos(a)*d; ZG.pl.z=Math.sin(a)*d;
        big('🚨 RAUS!','#ff5252',1800); toast('🚨 Zoo-Räumung! Du warst im Gehege von '+hit+' und wurdest zum Platz geschickt.',4000);
      }catch(e){}
    },
    _loop(){
      try{
        const raw=E.cur; if(raw&&raw.type==='poll'&&raw.id===E._id&&raw.until<=tn()&&E._pollEl){ E._pollDraw(); if(!E._pollEndAt) E._pollEndAt=tn(); if(tn()-E._pollEndAt>9000){ E._pollEndAt=0; E._clear(); } return; }
        const c=E.active(); if(!c){ if(E._id) E._clear(); return; }
        if(c.id!==E._id) return;
        const now=tn();
        if(c.type==='evac'&&now-(E._ev||0)>900){ E._ev=now; E._evacTick(); }
        if(c.type==='poll'&&now-(E._pd||0)>1000){ E._pd=now; E._pollDraw(); }
        if(c.type==='mystery'&&E._box&&Math.hypot(ZG.pl.x-E._box.x,ZG.pl.z-E._box.z)<2.2) E._openBox(c);
        if(c.type==='magnet'){ const dt=Math.min(.2,(now-(E._mt||now))/1000); E._mt=now; E._magnet(c,dt); }
        if(c.type==='traps'&&inZoo()&&!(typeof ZHearts!=='undefined'&&ZHearts.dead)){
          E._traps.forEach((t,i)=>{ if(Math.hypot(ZG.pl.x-t.x,ZG.pl.z-t.z)>1.6||now<(E._hitCd[i]||0)) return; E._hitCd[i]=now+3000;
            try{ ZBases._hurt(.5,'🪤 Fallen-Fest! −0,5 ❤','Falle'); ZG._minusUntil=now+2000; ZG._minusF=.5; }catch(e){} });
        }
      }catch(e){}
    }
  };
  // ── 👋 Freunde-Winken ──
  const Wv=window.ZWave={
    last:{}, seen:0, _l:false,
    near(){ const o=ZG.otherPl||{}; let best=null, bd=8; Object.keys(o).forEach(n=>{ if(K(n)===K(me())||!o[n]) return; const d=Math.hypot(o[n].x-ZG.pl.x,o[n].z-ZG.pl.z); if(d<bd){ bd=d; best=n; } }); return best; },
    heal(){ try{ if(typeof ZHearts!=='undefined'&&!ZHearts.dead){ ZHearts.hp=Math.min(ZHearts.max,(ZHearts.hp||0)+1); ZHearts._render(); } }catch(e){} },
    sprite(name){ try{ const op=(name===me())?ZG.pl:(ZG.otherPl||{})[name]; if(!op) return; const cache=(window.__zevtTex=window.__zevtTex||{}); let t=cache['👋']; if(!t){ const cv=document.createElement('canvas'); cv.width=cv.height=128; const cx=cv.getContext('2d'); cx.font='96px serif'; cx.textAlign='center'; cx.textBaseline='middle'; cx.fillText('👋',64,70); t=cache['👋']=new THREE.CanvasTexture(cv); }
      const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false})); s.scale.set(2.2,2.2,1); ZG.scene.add(s); const t0=tn(); const iv=setInterval(()=>{ const o2=(name===me())?ZG.pl:(ZG.otherPl||{})[name]; const age=tn()-t0; if(!o2||age>2600){ clearInterval(iv); ZG.scene.remove(s); return; } s.position.set(o2.x,3.6+Math.sin(age/120)*.25,o2.z); },40); }catch(e){} },
    wave(name){
      const r=RT(); if(!r||!name) return; const now=tn(); if(now-(Wv.last[K(name)]||0)<300000){ toast('👋 Du hast '+name+' gerade erst gewunken (alle 5 Min.)',2500); return; }
      Wv.last[K(name)]=now; r.ref('zoo_wave/'+K(name)+'/'+K(me())).set({by:me(),t:now}); Wv.heal(); Wv.sprite(name); toast('👋 Du winkst '+name+'! +1 ❤',2500); Wv._btn();
    },
    _listen(){ if(Wv._l) return; const r=RT(); if(!r||!me()) return; Wv._l=true; const f=s=>{ const v=s.val(); if(!v||!v.t||tn()-v.t>15000||v.t<=Wv.seen) return; Wv.seen=v.t; Wv.heal(); Wv.sprite(v.by); toast('👋 '+v.by+' winkt dir zu! +1 ❤',3500); }; const q=r.ref('zoo_wave/'+K(me())); q.on('child_added',f); q.on('child_changed',f); },
    _btn(){
      let b=document.getElementById('zwave-btn'); const n=(inZoo()&&(typeof rebHas!=='function'||rebHas('weather'))&&!(typeof ZHearts!=='undefined'&&ZHearts.dead)&&!(ZG._jumpActive||ZG._arcadeActive||ZG._mazeActive||ZG._trashActive||ZG._iceRoomActive||ZG._spaceActive))?Wv.near():null; const ok=n&&(tn()-(Wv.last[K(n)]||0)>=300000);
      if(!ok){ if(b) b.style.display='none'; return; }
      if(!b){ b=document.createElement('button'); b.id='zwave-btn'; b.style.cssText='position:fixed;right:12px;bottom:170px;z-index:575;background:linear-gradient(135deg,#ffd54f,#ff9800);border:none;color:#1a1a2e;font:900 .85rem Arial;padding:10px 14px;border-radius:22px;box-shadow:0 4px 14px rgba(0,0,0,.4);cursor:pointer'; document.body.appendChild(b); ['pointerup','click'].forEach(ev=>b.addEventListener(ev,e=>{ try{ e.preventDefault(); }catch(x){} if(b._n) Wv.wave(b._n); },{passive:false})); }
      b._n=n; b.style.display=''; b.textContent='👋 Winken: '+n;
    }
  };
  setInterval(()=>{ try{ Wv._listen(); Wv._btn(); }catch(e){} },500);
  setInterval(()=>{ try{ if(E._started) E._loop(); }catch(e){} },100);
  E.init();
})();
