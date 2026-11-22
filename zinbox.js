/* ═══ ZInbox (v886): Meldungen an den Admin ═══
   • Tutorial-Knopf "🐞 Hier klemmt was" → Meldung mit Schritt, Beschreibung und Gerät
   • Fehler-/Frage-Meldungen aus dem Melden-Panel landen ebenfalls hier
   • Admin: beim Öffnen des Admin-Panels grosse Vollbild-Übersicht, Aktionen je nach Art der Meldung
     (Fehler → "Erledigt"/"Schritt ansehen"; nur wenn Troll → Auszeit mit Begründung + Dauer, oder Bann)
   Speicherort: RTDB zoo_viol mit Feld ty ('tutorial'|'bug'|'msg'), wie die Rebirth-Warnungen. */
(function(){
  'use strict';
  if(window.ZInbox) return;
  const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const RTD=()=>{ if(window.ZInbox&&ZInbox.rtd) return ZInbox.rtd; try{ return (typeof _rtdb!=='undefined'&&_rtdb&&State._useCloud())?_rtdb:null; }catch(e){ return null; } };
  const TYPES={tutorial:{ic:'🎓',t:'Tutorial-Schritt klemmt',c:'#42a5f5'},bug:{ic:'🐞',t:'Fehler-/Frage-Meldung',c:'#ffa726'},msg:{ic:'💬',t:'Nachricht',c:'#66bb6a'}};
  const VER=(()=>{ try{ const m=document.currentScript.src.match(/v=(\d+)/); return m?('v'+m[1]):'?'; }catch(e){ return '?'; } })();
  const Z=window.ZInbox={TYPES};
  // ── letzte JS-Fehler mitschreiben (helfen dem Admin beim Nachvollziehen) ──
  const errs=[]; addEventListener('error',e=>{ try{ errs.push(String(e.message||'').slice(0,140)+' @'+String(e.filename||'').split('/').pop()+':'+(e.lineno||'')); if(errs.length>5) errs.shift(); }catch(x){} });
  // ── Gerät ──
  Z.device=function(){ const n=navigator, ua=n.userAgent||''; let dev='?';
    let m=ua.match(/Android [\d.]+; ([^)]+?)(?: Build|\))/); if(m) dev='Android · '+m[1]; else if(/iPhone/.test(ua)) dev='iPhone'; else if(/iPad/.test(ua)) dev='iPad'; else if(/Macintosh/.test(ua)&&n.maxTouchPoints>1) dev='iPad (Desktop-Modus)'; else if(/Windows/.test(ua)) dev='Windows-PC'; else if(/Macintosh/.test(ua)) dev='Mac'; else if(/Linux/.test(ua)) dev='Linux';
    let br='?'; if(/SamsungBrowser\/([\d.]+)/.test(ua)) br='Samsung Browser '+RegExp.$1; else if(/(?:Chrome|CriOS)\/([\d]+)/.test(ua)) br='Chrome '+RegExp.$1; else if(/Version\/([\d.]+).*Safari/.test(ua)) br='Safari '+RegExp.$1; else if(/Firefox\/([\d]+)/.test(ua)) br='Firefox '+RegExp.$1;
    let fs=false; try{ fs=!!document.fullscreenElement||matchMedia('(display-mode: standalone)').matches; }catch(e){}
    return {dev:dev,br:br,scr:innerWidth+'×'+innerHeight,dpr:+(devicePixelRatio||1).toFixed(2),or:innerWidth>innerHeight?'quer':'hoch',touch:!!('ontouchstart' in window||n.maxTouchPoints>0),lang:(localStorage.getItem('mischa_lang')||n.language||'').slice(0,8),ver:VER,mem:n.deviceMemory||null,fs:fs,errs:errs.slice(-3)}; };
  Z.context=function(){ const c={}; try{ c.reb=(ZS.zoo&&ZS.zoo.reb)||0; c.mt=Math.floor((ZS.zoo&&ZS.zoo.mt)||0); c.tutSeen=!!(ZS.zoo&&ZS.zoo.tutorialSeen); }catch(e){} try{ c.tutStep=Tutorial._active?(Tutorial._list()[Tutorial._stepIdx]||{}).id:null; }catch(e){} try{ c.panels=['gond','index','shop','reb','enc','menu','adm','sound','report','rank','trade'].filter(p=>{ const el=document.getElementById('p-'+p); return el&&!el.classList.contains('off')&&el.style.display!=='none'&&getComputedStyle(el).display!=='none'; }); }catch(e){} return c; };
  let last=0;
  Z.send=function(ty,text,extra){ const r=RTD(); const now=Date.now(); if(now-last<15000&&ty==='tutorial') return Promise.reject(new Error('Bitte kurz warten')); last=now;
    const rec=Object.assign({ty:ty,n:String(ZS.player||'?'),k:String(ZS.player||'?').toLowerCase(),t:now,txt:String(text||'').slice(0,600),dev:Z.device(),ctx:Z.context(),reb:(ZS.zoo&&ZS.zoo.reb)||0},extra||{});
    if(!r) return Promise.reject(new Error('Keine Verbindung')); return r.ref('zoo_viol').push(rec); };
  // ── Tutorial: Melde-Knopf ──
  const css=document.createElement('style'); css.textContent='#zi-tb{position:absolute;right:10px;bottom:8px;border:1.5px solid rgba(255,255,255,.35);background:rgba(255,255,255,.1);color:#fff;border-radius:14px;padding:4px 10px;font:800 .7rem Arial;cursor:pointer;z-index:5}.tut-compact #zi-tb{position:static;margin-left:auto;display:block;margin-top:6px}';
  document.head.appendChild(css);
  function modal(html){ const o=document.createElement('div'); o.id='zi-modal'; o.style.cssText='position:fixed;inset:0;z-index:2147483640;background:rgba(0,0,0,.82);display:flex;align-items:center;justify-content:center;padding:10px;font-family:Arial,sans-serif'; o.innerHTML='<div style="background:#101827;border:2.5px solid #ffd54f;border-radius:18px;max-width:560px;width:100%;max-height:96vh;overflow:auto;padding:14px 16px;color:#fff">'+html+'</div>'; document.body.appendChild(o); return o; }
  Z.tutReport=function(){ let id='?',idx=0,title=''; try{ const L=Tutorial._list(); idx=Tutorial._stepIdx; const s=L[idx]||{}; id=s.id||'?'; title=s.title||''; }catch(e){}
    if(document.getElementById('zi-modal')) return;
    const chips=['Ich komme nicht weiter','Ein Knopf ist nicht sichtbar','Etwas verdeckt den Bildschirm','Text ist zu klein / abgeschnitten','Der Pfeil zeigt falsch'];
    const o=modal('<div style="font:900 1.1rem Arial;color:#ffd54f">🐞 Was funktioniert hier nicht?</div><div style="opacity:.75;font-size:.8rem;margin:3px 0 8px">Schritt: '+esc(title||id)+'</div>'
      +'<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px">'+chips.map(c=>'<button class="zi-chip" style="padding:6px 10px;border-radius:14px;border:1.5px solid rgba(255,255,255,.3);background:rgba(255,255,255,.08);color:#fff;font:700 .75rem Arial">'+esc(c)+'</button>').join('')+'</div>'
      +'<textarea id="zi-txt" rows="3" maxlength="500" placeholder="Beschreibe kurz, was nicht geht…" style="width:100%;box-sizing:border-box;border-radius:10px;border:none;padding:9px;font-size:.9rem"></textarea>'
      +'<div style="display:flex;gap:8px;margin-top:10px"><button id="zi-no" style="flex:1;padding:12px;border:none;border-radius:12px;background:rgba(255,255,255,.15);color:#fff;font:800 .9rem Arial">Abbrechen</button><button id="zi-go" style="flex:2;padding:12px;border:none;border-radius:12px;background:#2e7d32;color:#fff;font:900 .95rem Arial">📨 An Admin senden</button></div>'
      +'<div style="opacity:.55;font-size:.68rem;margin-top:6px">Der Admin sieht dazu auch dein Gerät (Handy/Browser, Bildschirmgrösse).</div>');
    const ta=o.querySelector('#zi-txt'); o.querySelectorAll('.zi-chip').forEach(b=>b.onclick=()=>{ ta.value=(ta.value?ta.value+'\n':'')+b.textContent; });
    o.querySelector('#zi-no').onclick=()=>o.remove();
    o.querySelector('#zi-go').onclick=()=>{ const t=ta.value.trim(); if(t.length<3){ ta.style.outline='3px solid #ff5252'; return; } Z.send('tutorial',t,{step:id,idx:idx,stepTitle:title}).then(()=>{ o.remove(); try{ ZP.toast('✅ Danke! Der Admin schaut sich das an.',3500); }catch(e){} }).catch(e=>{ try{ ZP.toast('❌ '+e.message,3000); }catch(x){} }); };
  };
  setInterval(()=>{ try{ const ov=document.getElementById('tut-overlay'); if(!ov||ov.querySelector('#zi-tb')) return; const box=[...ov.querySelectorAll('div')].find(d=>/2147483600/.test(d.getAttribute('style')||'')); if(!box) return; if(getComputedStyle(box).position==='static') box.style.position='relative';
      const b=document.createElement('button'); b.id='zi-tb'; b.textContent='🐞 Hier klemmt was'; b.onclick=e=>{ e.stopPropagation(); Z.tutReport(); }; box.appendChild(b); }catch(e){} },800);
  // ── Melden-Panel: Fehler/Fragen zusätzlich in die Admin-Übersicht ──
  const hook=()=>{ if(typeof ZP==='undefined'||!ZP._sendReport) return setTimeout(hook,1500); if(ZP._ziH) return; ZP._ziH=1; const o=ZP._sendReport; ZP._sendReport=async function(){ let t=''; try{ t=(document.getElementById('report-text')||{}).value||''; t=t.trim(); }catch(e){} const r=await o.apply(this,arguments); if(t) Z.send('bug',t).catch(()=>{}); return r; }; };
  hook();
  // ── Admin: grosse Übersicht ──
  const f=t=>new Date(t).toLocaleString('de-CH',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
  Z.preview=function(id){ try{ const L=Tutorial._list(); const i=L.findIndex(s=>s.id===id); if(i<0){ ZP.toast('Schritt nicht gefunden',2500); return; } const o=document.getElementById('zi-adm'); if(o) o.remove(); try{ ZP.closeAll&&ZP.closeAll(); ['adm','menu'].forEach(p=>ZP.close(p)); }catch(e){} Tutorial._active=true; Tutorial._stepIdx=i; Tutorial._showStep(i); ZP.toast('👁 Vorschau: Schritt '+(i+1)+' ('+id+') – „Tutorial überspringen“ beendet sie',5000); }catch(e){ try{ ZP.toast('❌ '+e.message,3000); }catch(x){} } };
  Z.adminAlert=async function(){ const r=RTD(); if(!r) return; let v={}; try{ v=(await r.ref('zoo_viol').once('value')).val()||{}; }catch(e){ return; }
    const ids=Object.keys(v).filter(k=>TYPES[v[k].ty]); const old=document.getElementById('zi-adm'); if(old) old.remove(); if(!ids.length) return;
    const o=document.createElement('div'); o.id='zi-adm'; o.style.cssText='position:fixed;inset:0;z-index:99996;background:#05080f;display:flex;align-items:flex-start;justify-content:center;padding:14px;overflow:auto;font-family:Arial,sans-serif';
    const card=id=>{ const x=v[id], T=TYPES[x.ty], d=x.dev||{}, c=x.ctx||{};
      const dev=d.dev?('<div style="margin-top:8px;background:rgba(255,255,255,.07);border-radius:10px;padding:8px 10px;font-size:.8rem;line-height:1.55">📱 <b>'+esc(d.dev)+'</b> · '+esc(d.br)+'<br>Bildschirm '+esc(d.scr)+' ('+esc(d.or)+') · '+(d.touch?'Touch':'Maus')+' · Skalierung '+esc(d.dpr)+(d.fs?' · Vollbild/App':'')+'<br>Sprache '+esc(d.lang)+' · Version '+esc(d.ver)+(d.mem?' · RAM ≥'+esc(d.mem)+' GB':'')+(c.panels&&c.panels.length?'<br>Offene Fenster: '+esc(c.panels.join(', ')):'')+(d.errs&&d.errs.length?'<br><span style="color:#ff8a80">JS-Fehler: '+esc(d.errs.join(' | '))+'</span>':'')+'</div>'):'';
      return '<div data-id="'+id+'" style="background:rgba(255,255,255,.05);border:3px solid '+T.c+';border-radius:16px;padding:14px;margin:12px 0;text-align:left">'
        +'<div style="font:900 1.2rem Arial;color:'+T.c+'">'+T.ic+' '+T.t+(x.ty==='tutorial'?' – Schritt '+((x.idx||0)+1)+': '+esc(x.stepTitle||x.step):'')+'</div>'
        +'<div style="font:900 1.05rem Arial;color:#ffd54f;margin:4px 0">'+esc(x.n)+' <span style="font-size:.75rem;opacity:.7;font-weight:400">· '+f(x.t)+' · Rebirth '+(x.reb||0)+(c.mt!=null?' · '+c.mt+' MT':'')+'</span></div>'
        +'<div style="background:#000;border-radius:10px;padding:10px;font-size:1rem;line-height:1.45;white-space:pre-wrap;color:#fff">'+esc(x.txt||'(kein Text)')+'</div>'+dev
        +'<div class="zi-act" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">'
        +(x.ty==='tutorial'?'<button class="zi-pv" style="padding:10px 14px;border:none;border-radius:10px;background:#1565c0;color:#fff;font:900 .9rem Arial">👁 Schritt ansehen</button>':'')
        +'<button class="zi-ok" style="padding:10px 14px;border:none;border-radius:10px;background:#2e7d32;color:#fff;font:900 .9rem Arial">✅ Erledigt</button>'
        +'<button class="zi-tr" style="padding:10px 14px;border:none;border-radius:10px;background:#6d4c41;color:#fff;font:900 .9rem Arial">🤡 Nur Troll / Missbrauch …</button></div>'
        +'<div class="zi-sanc" style="display:none;margin-top:10px;background:rgba(198,40,40,.15);border:2px solid #c62828;border-radius:12px;padding:10px"><div style="font:800 .85rem Arial;margin-bottom:6px">Auszeit für '+esc(x.n)+'</div>'
        +'<select class="zi-d" style="padding:8px;border-radius:8px;font-size:.9rem;margin-right:6px"><option value="10">10 Min.</option><option value="60">1 Std.</option><option value="1440" selected>24 Std.</option><option value="10080">7 Tage</option><option value="43200">30 Tage</option><option value="ban">Dauerhaft bannen</option></select>'
        +'<input class="zi-r" value="'+esc(x.ty==='tutorial'?'Missbrauch der Tutorial-Meldung':'Missbrauch der Meldefunktion')+'" placeholder="Begründung" style="padding:8px;border-radius:8px;border:none;font-size:.9rem;width:min(100%,320px);box-sizing:border-box;margin:4px 0">'
        +'<div><button class="zi-go" style="margin-top:4px;padding:10px 14px;border:none;border-radius:10px;background:#c62828;color:#fff;font:900 .9rem Arial">⏳ Jetzt sperren</button></div></div></div>'; };
    o.innerHTML='<div style="max-width:660px;width:100%;color:#fff"><div style="text-align:center"><div style="font-size:3.6rem">📬</div><div style="font:900 1.8rem Arial;color:#ffd54f">'+ids.length+' neue Meldung'+(ids.length>1?'en':'')+'</div><div style="opacity:.75;margin:4px 0 6px;font-size:.9rem">Fehler und Tutorial-Probleme: erst nachsehen &amp; beheben. Sperren nur bei Troll/Missbrauch.</div></div>'
      +ids.sort((a,b)=>v[b].t-v[a].t).map(card).join('')+'<button id="zi-close" style="margin:6px 0 20px;width:100%;padding:14px;border:none;border-radius:14px;background:rgba(255,255,255,.18);color:#fff;font:900 1rem Arial">Später ansehen</button></div>';
    document.body.appendChild(o); o.querySelector('#zi-close').onclick=()=>o.remove();
    const done=(row,id)=>{ r.ref('zoo_viol/'+id).remove().catch(()=>{}); row.remove(); if(!o.querySelector('[data-id]')) o.remove(); };
    o.querySelectorAll('[data-id]').forEach(row=>{ const id=row.dataset.id, x=v[id];
      row.querySelector('.zi-ok').onclick=()=>done(row,id);
      const pv=row.querySelector('.zi-pv'); if(pv) pv.onclick=()=>Z.preview(x.step);
      row.querySelector('.zi-tr').onclick=()=>{ const s=row.querySelector('.zi-sanc'); s.style.display=s.style.display==='none'?'block':'none'; };
      row.querySelector('.zi-go').onclick=async()=>{ const dv=row.querySelector('.zi-d').value, ban=dv==='ban', mins=ban?0:(parseInt(dv)||60), reason=(row.querySelector('.zi-r').value||'').trim()||'Missbrauch';
        if(!confirm((ban?'🚫 ':'⏳ ')+x.n+(ban?' wirklich BANNEN?':' für '+mins+' Min. sperren?')+'\nBegründung: '+reason)) return;
        const nm=x.k, data={player:nm,kind:ban?'ban':'timeout',reason:reason,bannedAt:Date.now(),by:String(ZS.player||'admin'),permanent:ban,expiresAt:null,durationMs:ban?null:mins*60000,started:ban,duration:ban?'perm':(mins+'min')};
        try{ await _db.collection('banned_players').doc(nm).set(data); await r.ref('zoo_sanction/'+(typeof ZAdmin!=='undefined'&&ZAdmin._rk?ZAdmin._rk(nm):nm.replace(/[.#$\[\]\/]/g,'_'))).set(data); try{ ZP.toast((ban?'🚫 ':'⏳ ')+x.n+' ist jetzt gesperrt',3000); }catch(e){} done(row,id); }catch(e){ try{ ZP.toast('❌ '+e.message,3500); }catch(z){} } }; }); };
  const wait=()=>{ if(typeof ZAdmin==='undefined'||typeof ZP==='undefined') return setTimeout(wait,1500); if(ZAdmin._ziw) return; ZAdmin._ziw=1; const o=ZAdmin.open; ZAdmin.open=function(){ const r=o.apply(this,arguments); setTimeout(()=>{ try{ Z.adminAlert(); }catch(e){} },600); return r; }; };
  wait();
})();
