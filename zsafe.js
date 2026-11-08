/* ═══ ZSafe (v776): 💾 Sicherung & Wiederherstellung, 📜 Verlauf, 🔇 Chat-Schutz, 🔋 Sparmodus, 🐞 Fehler-Knopf, 📅 Wochen- & ⏱️ Spielzeit-Rangliste, Admin-Tab ═══ */
(function(){
  'use strict';
  if(window.ZSafe) return;
  const errBuf=[]; // Fehler schon früh sammeln
  window.addEventListener('error',e=>{ try{ errBuf.push(String(e.message||'').slice(0,140)+' @'+String(e.filename||'').split('/').pop()+':'+(e.lineno||'')); if(errBuf.length>8) errBuf.shift(); }catch(x){} });
  window.addEventListener('unhandledrejection',e=>{ try{ errBuf.push('Promise: '+String((e.reason&&e.reason.message)||e.reason||'').slice(0,140)); if(errBuf.length>8) errBuf.shift(); }catch(x){} });
  const wait=()=>{ if(typeof ZS==='undefined'||!ZS.zoo||!ZS.player||typeof ZP==='undefined'||typeof State==='undefined') return setTimeout(wait,1500); try{ init(); }catch(e){ console.warn('ZSafe init',e); } };
  function init(){
    const $=id=>document.getElementById(id), zoo=()=>ZS.zoo;
    const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const toast=(m,t)=>{ try{ ZP.toast(m,t||2500); }catch(e){} };
    const RTD=()=>{ try{ return (typeof _rtdb!=='undefined'&&_rtdb&&State._useCloud())?_rtdb:null; }catch(e){ return null; } };
    const key=n=>String(n||'').toLowerCase().replace(/[.#$\[\]\/]/g,'_');
    const me=()=>key(ZS.player);
    const lsGet=(k,d)=>{ try{ const v=localStorage.getItem(k); return v==null?d:v; }catch(e){ return d; } };
    const lsSet=(k,v)=>{ try{ localStorage.setItem(k,v); }catch(e){} };
    const fmt=n=>{ try{ return typeof formatMTRank==='function'?formatMTRank(n):(typeof formatMT==='function'?formatMT(n):String(Math.round(n))); }catch(e){ return String(Math.round(n)); } };
    const dayStr=()=>new Date().toISOString().slice(0,10);
    const weekId=()=>{ let d=new Date(); d.setHours(0,0,0,0); d=new Date(d.getTime()-((d.getDay()+6)%7)*864e5); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
    const isAdm=()=>{ try{ return !!(ZS.isAdmin||(typeof ZAdmin!=='undefined'&&ZAdmin._hasAccess)); }catch(e){ return false; } };
    const S=window.ZSafe={errBuf,fps:60};
    const modal=(id,html)=>{ const old=$(id); if(old) old.remove(); const o=document.createElement('div'); o.id=id; o.style.cssText='position:fixed;inset:0;z-index:700;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:14px'; o.onclick=e=>{ if(e.target===o) o.remove(); }; o.innerHTML='<div style="background:linear-gradient(160deg,#1a237e,#283593);border:3px solid #ffd54f;border-radius:18px;padding:16px;max-width:380px;width:100%;color:#fff;text-align:center;font-family:Arial,sans-serif;max-height:92vh;overflow:auto">'+html+'</div>'; document.body.appendChild(o); return o; };
    const bt='width:100%;padding:10px;border:none;border-radius:12px;font:900 .9rem Arial;margin-top:8px;color:#fff;cursor:pointer;';
    const GR=bt+'background:linear-gradient(135deg,#43a047,#1b5e20)', BL=bt+'background:linear-gradient(135deg,#1e88e5,#0d47a1)', GY=bt+'background:rgba(255,255,255,.18)';

    // ═══════ 📅 Wochen-Tracker & Verlauf (alle 5 s) ═══════
    const mult=z=>{ try{ return Math.max(1,typeof _rmult==='function'?_rmult(z):(z.rebirthMult||1)); }catch(e){ return 1; } };
    const encCount=z=>{ const m={}; (z.enc||[]).forEach(e=>{ if(e&&e.animal){ const k=(e.animal.e||'')+' '+e.animal.n; m[k]=(m[k]||0)+1; } }); return m; };
    let prev=null, histDirty=false;
    const log=txt=>{ const z=zoo(); const h=z.hist||(z.hist=[]); h.push({t:Date.now(),x:txt}); while(h.length>80) h.shift(); histDirty=true; };
    S.track=function(){ const z=zoo(); if(!z) return;
      const te=+z.te||0, wid=weekId(); let w=z.wk; if(!w||w.id!==wid){ w=z.wk={id:wid,g:0,last:te}; } if(typeof w.last!=='number') w.last=te; const d=te-w.last; if(d>0&&isFinite(d)) w.g+=d/mult(z); w.last=te;
      const cur={enc:encCount(z),reb:z.reb||0,mt:+z.mt||0};
      if(prev){ if(cur.reb>prev.reb) log('🔄 Rebirth '+cur.reb+' gemacht'); else {
          Object.keys(cur.enc).forEach(k=>{ const a=cur.enc[k]-(prev.enc[k]||0); if(a>0) log('➕ '+k+(a>1?' ×'+a:'')); });
          Object.keys(prev.enc).forEach(k=>{ const a=prev.enc[k]-(cur.enc[k]||0); if(a>0) log('➖ '+k+(a>1?' ×'+a:'')); });
          const dm=prev.mt-cur.mt; if(dm>=Math.max(1000,prev.mt*.2)) log('💸 −'+fmt(dm)+' MT ausgegeben'); } }
      prev=cur; };
    S.pushHist=function(){ const r=RTD(), z=zoo(); if(!r||!z||!histDirty) return; histDirty=false; try{ r.ref('zoo_hist/'+me()).set((z.hist||[]).slice(-60)); }catch(e){} };
    S.showHist=function(){ const h=(zoo().hist||[]).slice().reverse(); const f=t=>new Date(t).toLocaleString('de-CH',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
      const o=modal('zs-hist','<div style="font-size:2rem">📜</div><div style="font:900 1.1rem Arial;color:#ffd54f">Dein Verlauf</div><div style="font-size:.75rem;opacity:.8;margin:4px 0">Hier steht, welche Tiere du bekommen oder verloren hast. Bei Problemen kann der Admin nachsehen.</div><div style="text-align:left;font-size:.82rem;max-height:50vh;overflow:auto">'+(h.length?h.map(e=>'<div style="padding:4px 6px;border-top:1px solid rgba(255,255,255,.12)"><span style="opacity:.6;font-size:.7rem">'+f(e.t)+'</span><br>'+esc(e.x)+'</div>').join(''):'<div style="padding:10px;opacity:.7">Noch nichts aufgezeichnet.</div>')+'</div><button id="zs-hx" style="'+GY+'">Schliessen</button>'); $('zs-hx').onclick=()=>o.remove(); };

    // ═══════ 💾 Sicherung ═══════
    const snapJSON=()=>{ const z=zoo(); try{ return JSON.stringify(z); }catch(e){ return null; } };
    const tiny=z=>!(z.enc||[]).some(e=>e&&e.animal)&&(+z.te||0)<1000&&!(z.reb>0);
    const B=S.B={};
    B.write=async function(slot,force){ const r=RTD(), z=zoo(); if(!r||!z) return false; if(!force&&tiny(z)) return false; const j=snapJSON(); if(!j||j.length>900000) return false; const k=me();
      const meta={t:Date.now(),reb:z.reb||0,mt:+z.mt||0,te:+z.te||0,n:(z.enc||[]).filter(e=>e&&e.animal).length,sz:j.length};
      try{ await r.ref('zoo_backup/'+k+'/'+slot).set({t:meta.t,j}); await r.ref('zoo_backup_meta/'+k+'/'+slot).set(meta); return true; }catch(e){ return false; } };
    B.prune=async function(){ const r=RTD(); if(!r) return; try{ const k=me(), sn=await r.ref('zoo_backup_meta/'+k).once('value'), v=sn.val()||{}; const ds=Object.keys(v).filter(s=>/^d\d/.test(s)).sort(); ds.slice(0,Math.max(0,ds.length-4)).forEach(s=>{ r.ref('zoo_backup/'+k+'/'+s).remove(); r.ref('zoo_backup_meta/'+k+'/'+s).remove(); }); }catch(e){} };
    B.auto=async function(){ const z=zoo(); if(!z||!RTD()||document.hidden) return; const today='d'+dayStr();
      if(lsGet('zs_lastbk','')!==today){ if(await B.write(today)){ lsSet('zs_lastbk',today); B.prune(); } }
      const te=+z.te||0, best=+lsGet('zs_best','0'); if(te>best*1.1&&te>1000){ if(await B.write('best')) lsSet('zs_best',String(te)); }
      try{ lsSet('zs_local',JSON.stringify({t:Date.now(),j:snapJSON()}).slice(0,3000000)); }catch(e){} };
    B.list=async function(k){ const r=RTD(); if(!r) return {}; const sn=await r.ref('zoo_backup_meta/'+k).once('value'); return sn.val()||{}; };
    B.nowBtn=async function(btn){ if(btn){ btn.disabled=true; btn.textContent='⏳ …'; } const ok=await B.write('manual',true); toast(ok?'💾 Sicherung gespeichert!':'❌ Sicherung nicht möglich (offline?)',3000); if(btn){ btn.disabled=false; btn.textContent='💾 Jetzt sichern'; } B.open(); };
    B.request=function(){ const r=RTD(); if(!r) return toast('❌ Nur online möglich'); r.ref('zoo_restore_req/'+me()).set({n:String(ZS.player),t:Date.now()}).then(()=>toast('🆘 Anfrage gesendet. Der Admin schaut sie an.',3500)).catch(()=>toast('❌ Senden fehlgeschlagen')); };
    B.open=async function(){ const o=modal('zs-bk','<div style="font-size:2rem">💾</div><div style="font:900 1.1rem Arial;color:#ffd54f">Sicherung</div><div style="font-size:.78rem;opacity:.9;margin:4px 0">Dein Zoo wird automatisch jeden Tag gesichert (die letzten 4 Tage und dein bester Stand). Ist etwas Schlimmes passiert, kann der Admin einen alten Stand zurückholen.</div><div id="zs-bkl" style="font-size:.8rem;text-align:left;margin:6px 0">Lade …</div><button id="zs-bkn" style="'+GR+'">💾 Jetzt sichern</button><button id="zs-bkr" style="'+BL+'">🆘 Wiederherstellung anfragen</button><button id="zs-bkx" style="'+GY+'">Schliessen</button>');
      $('zs-bkx').onclick=()=>o.remove(); $('zs-bkn').onclick=function(){ B.nowBtn(this); }; $('zs-bkr').onclick=()=>B.request();
      try{ const v=await B.list(me()), ks=Object.keys(v).sort().reverse(); const l=$('zs-bkl'); if(l) l.innerHTML=ks.length?ks.map(s=>{ const m=v[s]; return '<div style="padding:4px 6px;border-top:1px solid rgba(255,255,255,.12)"><b>'+({best:'⭐ Bester Stand',manual:'✋ Manuell',prerestore:'↩️ Vor Wiederherstellung'}[s]||('📅 '+s.slice(1)))+'</b> · '+new Date(m.t).toLocaleString('de-CH',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})+'<br><span style="opacity:.8">Rebirth '+m.reb+' · '+m.n+' Tiere · '+fmt(m.mt)+' MT</span></div>'; }).join(''):'Noch keine Sicherung – die erste kommt gleich automatisch.'; }catch(e){ const l=$('zs-bkl'); if(l) l.textContent='Nicht verfügbar (offline).'; } };
    // Wiederherstellung (nur vom Admin ausgelöst)
    B.listen=function(){ const r=RTD(); if(!r||B._on) return; B._on=1; r.ref('zoo_restore/'+me()).on('value',sn=>{ const v=sn.val(); if(v&&v.slot&&v.id) B.apply(v); }); };
    B.apply=async function(v){ const r=RTD(); if(!r||String(lsGet('zs_done',''))===String(v.id)||B._busy) return; B._busy=1; try{ const k=me();
        const sn=await r.ref('zoo_backup/'+k+'/'+v.slot+'/j').once('value'), j=sn.val(); if(!j){ toast('❌ Wiederherstellung: Sicherung nicht gefunden',4000); B._busy=0; return; }
        lsSet('zs_done',String(v.id)); await B.write('prerestore',true); const obj=JSON.parse(j); obj.sv=Date.now(); obj.restoredAt=Date.now();
        ZS.save=async function(){}; // nichts mehr überschreiben
        if(State._useCloud()) await _db.collection('zoos').doc('zoo_'+String(ZS.player).toLowerCase()).set(obj);
        lsSet('zoo_'+String(ZS.player).toLowerCase(),JSON.stringify(obj)); try{ await r.ref('zoo_restore/'+k).remove(); await r.ref('zoo_restore_req/'+k).remove(); }catch(e){}
        const o=modal('zs-rs','<div style="font-size:2.4rem">♻️</div><div style="font:900 1.15rem Arial;color:#ffd54f">Dein Zoo wurde wiederhergestellt</div><div style="margin:8px 0;font-size:.88rem">Der Admin hat einen früheren Stand zurückgeholt. Das Spiel lädt gleich neu.</div>'); setTimeout(()=>location.reload(),2800);
      }catch(e){ console.warn('restore',e); toast('❌ Wiederherstellung fehlgeschlagen',4000); B._busy=0; } };

    // ═══════ 🔋 Sparmodus ═══════
    const Lw={low:lsGet('zs_low','0')==='1',n:0};
    Lw.apply=function(){ try{ const r=ZG.renderer; r.setPixelRatio(Lw.low?.6:Math.min(window.devicePixelRatio||1,2)); window.dispatchEvent(new Event('resize')); }catch(e){} };
    Lw.set=function(v){ Lw.low=!!v; lsSet('zs_low',v?'1':'0'); Lw.apply(); toast(v?'🔋 Sparmodus an: weniger Details, läuft flüssiger':'✨ Sparmodus aus',3000); };
    try{ const rr=ZG.renderer, o=rr.render.bind(rr); rr.render=function(s,c){ if(s===ZG.scene){ const n=performance.now(); S.fps=S.fps*.95+(1000/Math.max(1,n-(Lw._t||n-16)))*.05; Lw._t=n; if(Lw.low&&((Lw.n++)&1)) return; } return o(s,c); }; if(Lw.low) setTimeout(Lw.apply,1500); }catch(e){}
    setTimeout(()=>{ try{ if(!Lw.low&&S.fps<20&&lsGet('zs_lowask','0')!=='1'){ lsSet('zs_lowask','1'); const o=modal('zs-lw','<div style="font-size:2rem">🔋</div><div style="font:900 1.05rem Arial;color:#ffd54f">Läuft das Spiel ruckelig?</div><div style="font-size:.85rem;margin:6px 0">Der Sparmodus macht das Bild etwas weicher, dafür läuft es flüssiger.</div><button id="zs-lwy" style="'+GR+'">🔋 Sparmodus einschalten</button><button id="zs-lwn" style="'+GY+'">Nein danke</button>'); $('zs-lwy').onclick=()=>{ Lw.set(true); o.remove(); }; $('zs-lwn').onclick=()=>o.remove(); } }catch(e){} },30000);
    S.Lw=Lw;

    // ═══════ 🐞 Fehler melden ═══════
    S.bug=function(){ const o=modal('zs-bug','<div style="font-size:2rem">🐞</div><div style="font:900 1.1rem Arial;color:#ffd54f">Fehler melden</div><div style="font-size:.78rem;opacity:.9;margin:4px 0">Beschreibe kurz, was nicht stimmt. Dein Spielstand-Info (Rebirth, Ort, letzte Fehler) wird automatisch mitgeschickt.</div><textarea id="zs-bt" maxlength="400" rows="4" placeholder="z.B. Mein Einkommen ist plötzlich viel kleiner …" style="width:100%;box-sizing:border-box;border-radius:10px;border:none;padding:8px;font-size:.9rem"></textarea><button id="zs-bs" style="'+GR+'">📤 Absenden</button><button id="zs-bx" style="'+GY+'">Abbrechen</button>');
      $('zs-bx').onclick=()=>o.remove(); $('zs-bs').onclick=function(){ const t=($('zs-bt').value||'').trim(); if(t.length<4) return toast('Bitte kurz beschreiben.'); if(Date.now()-(+lsGet('zs_lastbug','0'))<60000) return toast('Bitte eine Minute warten.'); const r=RTD(); if(!r) return toast('❌ Nur online möglich'); const z=zoo(), pl=ZG.pl||{};
        r.ref('zoo_bugs').push({from:String(ZS.player),t:Date.now(),txt:t,ver:(S.ver||'v776'),reb:z.reb||0,mt:Math.round(+z.mt||0),te:Math.round(+z.te||0),inc:Math.round(+(window.ZReb6&&ZReb6.tick?ZReb6.tick():0)||0),pos:[Math.round(pl.x||0),Math.round(pl.z||0)],fps:Math.round(S.fps||0),low:Lw.low?1:0,ua:String(navigator.userAgent).slice(0,110),errs:errBuf.slice(-6),hist:(z.hist||[]).slice(-6)}).then(()=>{ lsSet('zs_lastbug',String(Date.now())); toast('🐞 Danke! Der Admin sieht deine Meldung.',3500); o.remove(); }).catch(()=>toast('❌ Senden fehlgeschlagen')); }; };

    // ═══════ 🔇 Chat-Schutz ═══════
    const BAD=['arschloch','scheisse','scheiße','scheiss','fick','ficken','hurensohn','wichser','fotze','schlampe','nutte','spast','missgeburt','nazi','fuck','shit','bitch','asshole','cunt','nigger'];
    const badRx=new RegExp('('+BAD.join('|')+')','gi');
    const filt=t=>String(t==null?'':t).replace(badRx,m=>'*'.repeat(m.length));
    const muted=()=>{ try{ return JSON.parse(lsGet('zs_mute','[]')); }catch(e){ return []; } };
    const setMuted=a=>lsSet('zs_mute',JSON.stringify(a));
    S.mute=function(n){ n=String(n||'').trim().toLowerCase(); if(!n) return; const a=muted(); if(!a.includes(n)){ a.push(n); setMuted(a); } toast('🔇 '+n+' ist stumm geschaltet',2500); document.querySelectorAll('#chat-msgs [data-zs-from="'+CSS.escape(n)+'"]').forEach(e=>e.style.display='none'); };
    S.unmute=function(n){ setMuted(muted().filter(x=>x!==n)); toast('🔊 '+n+' wieder hörbar',2000); };
    S.msgMenu=function(from){ const o=modal('zs-mm','<div style="font:900 1rem Arial;color:#ffd54f">'+esc(from)+'</div><button id="zs-m1" style="'+GY+'">🔇 Stumm schalten</button><button id="zs-m2" style="'+bt+'background:linear-gradient(135deg,#e53935,#b71c1c)">🚩 Melden</button><button id="zs-m3" style="'+GY+'">Abbrechen</button>'); $('zs-m1').onclick=()=>{ S.mute(from); o.remove(); }; $('zs-m2').onclick=()=>{ o.remove(); try{ ZP.open('report'); ZP._showReportKind('player'); }catch(e){ toast('Melden: öffne das Melde-Menü'); } }; $('zs-m3').onclick=()=>o.remove(); };
    try{ if(typeof ZChat!=='undefined'&&!ZChat._zsw){ ZChat._zsw=1; const o=ZChat._addMsg; ZChat._addMsg=function(from,msg,isMine,to,img,id,at){ const d=o.call(this,from,filt(msg),isMine,to,img,id,at); try{ if(d&&!isMine){ const f=String(from||'').toLowerCase(); d.dataset.zsFrom=f; if(muted().includes(f)) d.style.display='none'; d.addEventListener('contextmenu',e=>{ e.preventDefault(); S.msgMenu(from); }); const nm=d.querySelector('span[style*="FFD700"]'); if(nm){ nm.style.cursor='pointer'; nm.title='Tippen: stumm / melden'; nm.addEventListener('click',()=>S.msgMenu(from)); } } }catch(e){} return d; }; } }catch(e){ console.warn('ZSafe chat',e); }
    S.muteList=function(){ const a=muted(); const o=modal('zs-ml','<div style="font-size:2rem">🔇</div><div style="font:900 1.1rem Arial;color:#ffd54f">Stumm-Liste</div><div style="font-size:.78rem;opacity:.9;margin:4px 0">Im Chat kannst du auf einen Namen tippen, um jemanden stumm zu schalten oder zu melden. Schimpfwörter werden automatisch mit *** ersetzt.</div><div style="text-align:left;margin:6px 0">'+(a.length?a.map(n=>'<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 6px;border-top:1px solid rgba(255,255,255,.12)"><span>🔇 '+esc(n)+'</span><button data-u="'+esc(n)+'" style="border:none;border-radius:8px;padding:4px 8px;background:#43a047;color:#fff;font-weight:900">🔊</button></div>').join(''):'<div style="opacity:.7;padding:6px">Niemand ist stumm.</div>')+'</div><button id="zs-mlx" style="'+GY+'">Schliessen</button>'); $('zs-mlx').onclick=()=>o.remove(); o.querySelectorAll('button[data-u]').forEach(b=>b.onclick=()=>{ S.unmute(b.dataset.u); o.remove(); S.muteList(); }); };

    // ═══════ 🛠️ Menü ═══════
    const mb=document.createElement('button'); mb.id='zs-fab'; mb.textContent='🛠️'; mb.title='Hilfe & Sicherheit'; mb.style.cssText='position:fixed;left:192px;bottom:12px;z-index:127;width:40px;height:40px;border-radius:50%;border:2px solid #fff;background:rgba(30,40,90,.85);color:#fff;font-size:1.2rem;box-shadow:0 2px 8px rgba(0,0,0,.4)'; document.body.appendChild(mb);
    mb.onclick=function(){ const o=modal('zs-menu','<div style="font:900 1.15rem Arial;color:#ffd54f;margin-bottom:4px">🛠️ Hilfe &amp; Sicherheit</div>'
      +'<button id="zs-a1" style="'+GR+'">💾 Sicherung</button><button id="zs-a2" style="'+BL+'">📜 Verlauf</button><button id="zs-a3" style="'+GY+'">'+(Lw.low?'🔋 Sparmodus: AN (ausschalten)':'🔋 Sparmodus einschalten')+'</button><button id="zs-a4" style="'+GY+'">🔇 Stumm-Liste (Chat)</button><button id="zs-a5" style="'+bt+'background:linear-gradient(135deg,#e53935,#b71c1c)">🚩 Spieler melden</button><button id="zs-a6" style="'+bt+'background:linear-gradient(135deg,#8e24aa,#4a148c)">🐞 Fehler melden</button><button id="zs-ax" style="'+GY+'">Schliessen</button>');
      $('zs-a1').onclick=()=>{ o.remove(); B.open(); }; $('zs-a2').onclick=()=>{ o.remove(); S.showHist(); }; $('zs-a3').onclick=()=>{ Lw.set(!Lw.low); o.remove(); }; $('zs-a4').onclick=()=>{ o.remove(); S.muteList(); }; $('zs-a5').onclick=()=>{ o.remove(); try{ ZP.open('report'); }catch(e){} }; $('zs-a6').onclick=()=>{ o.remove(); S.bug(); }; $('zs-ax').onclick=()=>o.remove(); };
    setInterval(()=>{ try{ const hide=!!(window.ZStation&&ZStation.riding)||ZG._liftActive||ZG._arcadeActive||document.querySelector('#chat-panel')&&document.querySelector('#chat-panel').style.display==='flex'&&false; mb.style.display=hide?'none':'block'; }catch(e){} },1000);

    // ═══════ 📅 Wochen- & ⏱️ Spielzeit-Rangliste ═══════
    const R=S.R={};
    R.kinds=[['all','🏆 Gesamt'],['wk','📅 Woche'],['pt','⏱️ Spielzeit']];
    R.render=async function(kind,cl,el){ el.innerHTML='<div style="padding:20px;text-align:center;color:rgba(255,255,255,.5)">⏳ Lade...</div>'; let zs={}; try{ zs=await State.getAllZoos(); }catch(e){}
      const mine=String(ZS.player||'').toLowerCase(); if(zoo()) zs[mine]=Object.assign({},zs[mine]||{},zoo());
      const wid=weekId(); let rows=Object.keys(zs).filter(n=>n&&!/^test/i.test(n)).map(n=>{ const z=zs[n]||{}; return {n,reb:z.reb||0,cl:!!z.inChampionsLeague,v:kind==='wk'?((z.wk&&z.wk.id===wid)?+z.wk.g||0:0):(+z.totalPlaytimeSec||0),has:(+z.te||0)>0||(+z.mt||0)>0}; }).filter(r=>r.has&&r.cl===cl&&r.v>0).sort((a,b)=>b.v-a.v).slice(0,50);
      const head=kind==='wk'?'<div style="font-size:.72rem;opacity:.75;text-align:center;margin:2px 0 8px">Verdienst seit Montag, ohne Rebirth-Bonus gerechnet – so haben alle die gleiche Chance. Neustart jeden Montag.</div>':'<div style="font-size:.72rem;opacity:.75;text-align:center;margin:2px 0 8px">Wer hat am längsten im Zoo gespielt?</div>';
      if(!rows.length){ el.innerHTML=head+'<div style="padding:20px;text-align:center;color:rgba(255,255,255,.4)">Noch niemand in dieser Liste.</div>'; return; }
      const medals=['🥇','🥈','🥉'];
      el.innerHTML=head+rows.map((p,i)=>{ const isMe=p.n===mine; const val=kind==='wk'?'🌀'+fmt(p.v)+' MT':(()=>{ try{ return ZP._fmtDur(p.v*1000); }catch(e){ return Math.round(p.v/3600)+' Std'; } })();
        return '<div style="display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:8px;margin-bottom:4px;background:'+(isMe?'rgba(41,182,246,.15)':'rgba(255,255,255,.04)')+'"><span style="font-size:1rem;min-width:26px;text-align:center">'+(medals[i]||('#'+(i+1)))+'</span><span style="flex:1;min-width:0;font-weight:700;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(p.n)+'👑'.repeat(Math.min(3,p.reb))+(isMe?' (Du)':'')+'</span><span style="color:#FFD700;font-weight:900;font-size:.9rem">'+val+'</span></div>'; }).join(''); };
    R.bar=function(cl,orig){ const content=$(cl?'p-cl-rank-content':'p-rank-content'); if(!content) return; let bar=$('zs-rtabs'+(cl?'c':'n')); if(!bar){ bar=document.createElement('div'); bar.id='zs-rtabs'+(cl?'c':'n'); bar.style.cssText='display:flex;gap:6px;justify-content:center;margin:6px 0 8px;flex-wrap:wrap'; content.parentNode.insertBefore(bar,content); }
      const paint=a=>{ bar.innerHTML=R.kinds.map(k=>'<button data-k="'+k[0]+'" style="border:2px solid '+(a===k[0]?'#ffd54f':'rgba(255,255,255,.25)')+';background:'+(a===k[0]?'rgba(255,215,0,.2)':'rgba(255,255,255,.06)')+';color:#fff;border-radius:16px;padding:5px 10px;font:700 .76rem Arial;cursor:pointer">'+k[1]+'</button>').join(''); bar.querySelectorAll('button').forEach(b=>b.onclick=()=>{ const k=b.dataset.k; paint(k); if(k==='all') orig(); else R.render(k,cl,content); }); }; paint('all'); };
    try{ if(!ZP._zsr){ ZP._zsr=1; const o1=ZP.showZooRangliste.bind(ZP), o2=ZP.showChampionsLeagueRangliste.bind(ZP);
        ZP.showZooRangliste=function(){ const r=o1(); setTimeout(()=>R.bar(false,()=>o1()),0); return r; };
        ZP.showChampionsLeagueRangliste=function(){ const r=o2(); setTimeout(()=>R.bar(true,()=>o2()),0); return r; }; } }catch(e){ console.warn('ZSafe rank',e); }

    // ═══════ 🛠️ Admin-Tab ═══════
    const A=S.admin={};
    A.html=function(){ const inp='width:100%;box-sizing:border-box;padding:8px;border-radius:8px;background:#0d1f3c;color:#fff;border:1px solid rgba(255,255,255,.2);font-size:.82rem;margin:4px 0';
      return '<div style="font-size:.8rem;color:#fff;padding:6px;line-height:1.4"><div style="font-weight:900;color:#ffd54f">💾 Sicherungen &amp; 📜 Verlauf eines Spielers</div><input id="zs-an" placeholder="Spielername" style="'+inp+'"><button class="padmin-btn" onclick="ZSafe.admin.bk()">💾 Sicherungen</button> <button class="padmin-btn" onclick="ZSafe.admin.hist()" style="background:#3498DB">📜 Verlauf</button><div id="zs-ares" style="margin-top:8px"></div>'
        +'<div style="font-weight:900;color:#ffd54f;margin-top:14px">🆘 Wiederherstellungs-Anfragen</div><div id="zs-areq">…</div>'
        +'<div style="font-weight:900;color:#ffd54f;margin-top:14px">🐞 Fehlermeldungen</div><div id="zs-abug">…</div></div>'; };
    const fd=t=>new Date(t).toLocaleString('de-CH',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
    A.init=function(){ const r=RTD(); const rq=$('zs-areq'), bg=$('zs-abug'); if(!r){ if(rq) rq.textContent='Offline'; if(bg) bg.textContent=''; return; }
      r.ref('zoo_restore_req').once('value').then(sn=>{ const v=sn.val()||{}, ks=Object.keys(v); rq.innerHTML=ks.length?ks.map(k=>'<div style="padding:5px 0;border-top:1px solid rgba(255,255,255,.12)"><b>'+esc(v[k].n)+'</b> · '+fd(v[k].t)+' <button class="padmin-btn" style="font-size:.7rem;padding:3px 8px" onclick="document.getElementById(\'zs-an\').value=\''+esc(k)+'\';ZSafe.admin.bk()">Öffnen</button></div>').join(''):'Keine offenen Anfragen.'; }).catch(()=>{ rq.textContent='Fehler'; });
      r.ref('zoo_bugs').orderByChild('t').limitToLast(30).once('value').then(sn=>{ const a=[]; sn.forEach(c=>{ a.push([c.key,c.val()]); }); a.reverse(); bg.innerHTML=a.length?a.map(([id,b])=>'<div style="padding:6px 0;border-top:1px solid rgba(255,255,255,.12)"><b>'+esc(b.from)+'</b> · '+fd(b.t)+' · Reb '+b.reb+' · '+esc(b.ver||'')+' · '+(b.fps||'?')+' fps'+(b.low?' 🔋':'')+'<br>'+esc(b.txt)+'<div style="font-size:.68rem;opacity:.65">Pos '+(b.pos||[]).join('/')+' · Einkommen≈'+fmt(b.inc||0)+'/Tick · '+esc((b.errs||[]).slice(-2).join(' | '))+'</div><button class="padmin-btn" style="font-size:.7rem;padding:3px 8px;background:#c0392b" onclick="ZSafe.admin.delBug(\''+id+'\')">Erledigt</button></div>').join(''):'Keine Meldungen.'; }).catch(()=>{ bg.textContent='Fehler'; }); };
    A.delBug=function(id){ const r=RTD(); if(r) r.ref('zoo_bugs/'+id).remove().then(()=>A.init()); };
    A.bk=async function(){ const n=key(($('zs-an')||{}).value), out=$('zs-ares'); if(!n) return; out.textContent='Lade …'; try{ const v=await B.list(n), ks=Object.keys(v).sort().reverse(); out.innerHTML=ks.length?ks.map(s=>{ const m=v[s]; return '<div style="padding:5px 0;border-top:1px solid rgba(255,255,255,.12)"><b>'+({best:'⭐ Bester',manual:'✋ Manuell',prerestore:'↩️ Vor Restore'}[s]||('📅 '+s.slice(1)))+'</b> · '+fd(m.t)+'<br>Reb '+m.reb+' · '+m.n+' Tiere · '+fmt(m.mt)+' MT · '+Math.round((m.sz||0)/1024)+' KB <button class="padmin-btn" style="font-size:.7rem;padding:3px 8px;background:#27ae60" onclick="ZSafe.admin.restore(\''+n+'\',\''+s+'\')">♻️ Wiederherstellen</button></div>'; }).join('')+'<div style="font-size:.7rem;opacity:.7;margin-top:6px">Der Spieler bekommt den Stand beim nächsten Online-Sein (sein jetziger Stand wird vorher als „Vor Restore“ gesichert).</div>':'Keine Sicherungen für '+esc(n); }catch(e){ out.textContent='Fehler'; } };
    A.restore=function(n,slot){ if(!confirm('Zoo von '+n+' auf Stand "'+slot+'" zurücksetzen?')) return; const r=RTD(); if(!r) return; r.ref('zoo_restore/'+n).set({slot,id:Date.now(),by:String(ZS.player)}).then(()=>toast('♻️ Wiederherstellung ausgelöst für '+n,3500)); };
    A.hist=async function(){ const n=key(($('zs-an')||{}).value), out=$('zs-ares'), r=RTD(); if(!n||!r) return; out.textContent='Lade …'; try{ const sn=await r.ref('zoo_hist/'+n).once('value'); const h=(sn.val()||[]).slice().reverse(); out.innerHTML=h.length?h.map(e=>'<div style="padding:3px 0;border-top:1px solid rgba(255,255,255,.12)"><span style="opacity:.6;font-size:.7rem">'+fd(e.t)+'</span> '+esc(e.x)+'</div>').join(''):'Kein Verlauf für '+esc(n); }catch(e){ out.textContent='Fehler'; } };
    S.adminHTML=A.html;
    try{ if(typeof ZAdmin!=='undefined'&&!ZAdmin._zsw){ ZAdmin._zsw=1; const o=ZAdmin.switchTab; ZAdmin.switchTab=function(tab){ const r=o.apply(this,arguments); if(tab==='safe'){ const b=$('padmin-safe-body'); if(b){ b.innerHTML=A.html(); A.init(); } } return r; }; } }catch(e){}

    // ═══════ Loops ═══════
    setInterval(()=>{ try{ S.track(); }catch(e){} },5000);
    setInterval(()=>{ try{ S.pushHist(); }catch(e){} },120000);
    setInterval(()=>{ try{ B.auto(); }catch(e){} },25*60000);
    setTimeout(()=>{ try{ B.auto(); B.listen(); S.track(); }catch(e){} },25000);
    setInterval(()=>{ try{ B.listen(); }catch(e){} },60000);
    S.ver='v776';
  }
  wait();
})();
