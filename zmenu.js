/* ═══ ZMenu (v788): ☰ Ein Menü für alle kleinen Knöpfe, „NEU“-Markierungen und „Neu im Zoo“-Fenster beim Start ═══ */
(function(){
  'use strict';
  if(window.ZMenu) return;
  const wait=()=>{ if(typeof ZS==='undefined'||!ZS.zoo||!ZS.player||typeof ZP==='undefined') return setTimeout(wait,1500); try{ init(); }catch(e){ console.warn('ZMenu',e); } };
  function init(){
    const $=id=>document.getElementById(id), zoo=()=>ZS.zoo;
    const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const toast=(m,t)=>{ try{ ZP.toast(m,t||2500); }catch(e){} };
    const save=()=>{ try{ ZS.save&&ZS.save(); }catch(e){} };
    const M=window.ZMenu={};
    const adm=()=>{ try{ return !!(ZS.isAdmin||(typeof ZAdmin!=='undefined'&&ZAdmin._hasAccess)); }catch(e){ return false; } };
    // alte Einzel-Knöpfe ausblenden (bleiben aber funktionsfähig)
    const st=document.createElement('style'); st.textContent='#zs-fab,#zn-bell,#zd-fab,#zpi-fab,#zr6-hub{display:none!important}@keyframes zmPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}'; document.head.appendChild(st);
    const click=id=>{ const b=$(id); if(b) b.click(); else toast('Gerade nicht verfügbar.'); };
    // ═══ Einträge ═══
    const E=M.entries=[
      {id:'detektiv',ic:'🕵️',n:'Detektiv-Fälle',d:'5 Fälle, alleine lösen',since:'n787',go:()=>window.ZDetective?ZDetective.list():toast('Noch nicht geladen.')},
      {id:'piraten',ic:'🏴‍☠️',n:'Piraten-Welt',d:'Meer, Bosse, eigene Insel',since:'n787',show:()=>window.ZPirate&&ZPirate.has(),lock:'Ab Rebirth 7',go:()=>ZPirate.openWorld()},
      {id:'pass',ic:'🎫',n:'MT-Pass',d:'Belohnungen für Fortschritt',show:()=>typeof rebHas!=='function'||rebHas('mtpass'),go:()=>MTPass.open()},
      {id:'hub',ic:'👑',n:'Rebirth-6-Hub',d:'Alle neuen Orte & Dinge',show:()=>window.ZReb6&&ZReb6.has&&ZReb6.has(),go:()=>ZReb6.openHub()},
      {id:'weg',ic:'🧭',n:'Wegweiser',d:'Zeigt dir den Weg zu Orten',go:()=>openPlaces()},
      {id:'bell',ic:'🔔',n:'Meldungen',d:'Eier, Wetter, Arena …',badge:()=>{ const b=$('zn-badge'); return b&&b.style.display!=='none'?b.textContent:''; },go:()=>click('zn-bell')},
      {id:'regeln',ic:'📜',n:'Spielregeln',d:'Was erlaubt ist',go:()=>window.ZRules?ZRules.open():toast('Noch nicht geladen.')},
      {id:'sicher',ic:'🛠️',n:'Sicherung & Hilfe',d:'Backup, Verlauf, Melden',go:()=>click('zs-fab')},
      {id:'news',ic:'📣',n:'Neuigkeiten',d:'Was ist neu im Zoo?',go:()=>M.news(true)}
    ];
    const seen=()=>{ const z=zoo(); return z.menuSeen||(z.menuSeen={}); };
    const vis=e=>{ try{ return !e.show||e.show()||(e.lock&&true); }catch(er){ return false; } };
    const isNew=e=>!!e.since&&!seen()[e.id]&&(!e.show||e.show());
    M.markNew=(id,since)=>{ const e=E.find(x=>x.id===id); if(e){ e.since=since||'x'; delete seen()[id]; fab(); } };
    // ═══ Knopf ═══
    const fb=document.createElement('button'); fb.id='zm-fab'; fb.innerHTML='☰<span id="zm-dot" style="display:none;position:absolute;top:-3px;right:-3px;min-width:16px;height:16px;border-radius:8px;background:#e53935;color:#fff;font:900 .65rem/16px Arial;text-align:center;padding:0 3px"></span>'; fb.title='Menü'; fb.style.cssText='position:fixed;left:192px;bottom:12px;z-index:128;width:46px;height:46px;border-radius:50%;border:3px solid #fff;background:linear-gradient(135deg,#5c6bc0,#283593);color:#fff;font-size:1.4rem;box-shadow:0 2px 10px rgba(0,0,0,.5)'; document.body.appendChild(fb); fb.onclick=()=>M.open();
    function fab(){ let n=0; E.forEach(e=>{ if(isNew(e)) n++; if(e.badge&&e.badge()) n+=parseInt(e.badge())||1; }); const d=$('zm-dot'); if(!d) return; d.style.display=n?'block':'none'; d.textContent=n>9?'9+':n; fb.style.animation=n?'zmPulse 1.6s infinite':'none'; }
    setInterval(()=>{ try{ fb.style.display=((window.ZStation&&ZStation.riding)||ZG._liftActive||ZG._arcadeActive||(window.ZPirate&&ZPirate.open))?'none':'block'; fab(); }catch(e){} },1500);
    // ═══ Menü ═══
    function ov(html){ let o=$('zm-ov'); if(o) o.remove(); o=document.createElement('div'); o.id='zm-ov'; o.style.cssText='position:fixed;inset:0;z-index:790;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:10px;font-family:Arial,sans-serif'; o.innerHTML='<div style="background:linear-gradient(160deg,#283593,#1a237e);border:3px solid #fff;border-radius:18px;padding:14px;max-width:460px;width:100%;max-height:92vh;overflow-y:auto;color:#fff">'+html+'</div>'; o.onclick=e=>{ if(e.target===o) o.remove(); }; document.body.appendChild(o); return o; }
    const close=()=>{ const o=$('zm-ov'); if(o) o.remove(); };
    M.open=function(){ const list=E.filter(vis); const o=ov('<div style="display:flex;align-items:center"><div style="flex:1;font:900 1.15rem Arial">☰ Menü</div><button id="zm-x" style="border:none;background:rgba(255,255,255,.18);color:#fff;border-radius:8px;width:32px;height:32px;font-size:1rem">✕</button></div><div style="font-size:.74rem;opacity:.8;margin:2px 0 10px">Alle wichtigen Dinge an einem Ort. <span style="background:#e53935;border-radius:6px;padding:1px 5px;font-weight:900">NEU</span> = noch nicht angesehen.</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'+list.map(e=>{ let locked=false; try{ locked=e.show&&!e.show(); }catch(er){} const bd=e.badge?e.badge():''; return '<button data-e="'+e.id+'" style="position:relative;text-align:left;border:2px solid '+(locked?'rgba(255,255,255,.2)':'#fff')+';border-radius:14px;background:rgba(255,255,255,'+(locked?'.05':'.12')+');color:#fff;padding:10px;'+(locked?'opacity:.55':'')+'"><div style="font-size:1.7rem">'+(locked?'🔒':e.ic)+'</div><div style="font:900 .85rem Arial">'+esc(e.n)+'</div><div style="font-size:.68rem;opacity:.8">'+esc(locked?e.lock:e.d)+'</div>'+(isNew(e)?'<span style="position:absolute;top:6px;right:6px;background:#e53935;border-radius:6px;padding:1px 6px;font:900 .65rem Arial">NEU</span>':'')+(bd?'<span style="position:absolute;top:6px;right:6px;background:#e53935;border-radius:10px;padding:1px 7px;font:900 .7rem Arial">'+esc(bd)+'</span>':'')+'</button>'; }).join('')+'</div>');
      $('zm-x').onclick=close; o.querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>{ const e=E.find(x=>x.id===b.dataset.e); let locked=false; try{ locked=e.show&&!e.show(); }catch(er){} if(locked) return toast('🔒 '+e.lock); seen()[e.id]=1; save(); close(); try{ e.go(); }catch(er){ console.warn(er); } fab(); }); };
    function openPlaces(){ let pl=[]; try{ pl=ZGuide.places(); }catch(e){} const o=ov('<div style="display:flex"><div style="flex:1;font:900 1.1rem Arial">🧭 Wegweiser</div><button id="zm-x" style="border:none;background:rgba(255,255,255,.18);color:#fff;border-radius:8px;width:32px;height:32px">✕</button></div><div style="font-size:.74rem;opacity:.8;margin:2px 0 8px">Tippe auf „Hin“, dann zeigt dir ein Pfeil den Weg.</div>'+(pl.length?pl.map((p,i)=>'<div style="display:flex;align-items:center;gap:8px;background:rgba(0,0,0,.25);border-radius:10px;padding:8px;margin-bottom:6px"><span style="font-size:1.4rem">'+(p.ic||'📍')+'</span><b style="flex:1;font-size:.85rem">'+esc(p.n||p.name||'Ort')+'</b><button data-p="'+i+'" style="border:none;border-radius:8px;padding:7px 10px;background:#ffb300;font-weight:900">📍 Hin</button></div>').join(''):'<div style="opacity:.8">Noch keine Orte bekannt.</div>')); $('zm-x').onclick=close; o.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{ close(); try{ ZGuide.go(pl[+b.dataset.p]); }catch(e){} }); }
    // ═══ „Neu im Zoo“ ═══
    const NEWS_ID='n787';
    const NEWS=[['🏴‍☠️','Piraten-Welt (ab Rebirth 7)','Segle im gemeinsamen Meer, kämpfe gegen 4 Bosse (täglich ein anderer), baue deine eigene Insel.','piraten'],
      ['🕵️','Detektiv-Fälle','5 Fälle zum Alleinlösen: Orte erkunden, Rätsel lösen, Täter anklagen. Belohnung: Boosts und Geld.','detektiv'],
      ['🎫','MT-Pass neu','Neuer Pass zum Seitwärts-Wischen mit Gratis-, VIP- und VIP+-Reihe.','pass'],
      ['🧭','Ein Menü für alles','Alle kleinen Knöpfe sind jetzt im ☰-Menü. Neue Dinge sind rot markiert.','news'],
      ['🪙','Kleinere Taler','Die fliegenden Münzen stören den Bildschirm nicht mehr.',null]];
    M.news=function(force){ const z=zoo(); if(!force&&z.newsSeen===NEWS_ID) return; const o=ov('<div style="font:900 1.2rem Arial;color:#ffd54f">📣 Neu im Zoo!</div><div style="font-size:.75rem;opacity:.8;margin:2px 0 8px">Das ist neu seit deinem letzten Besuch:</div>'+NEWS.map((n,i)=>'<div style="display:flex;align-items:center;gap:10px;background:rgba(0,0,0,.25);border-radius:12px;padding:9px;margin-bottom:6px"><span style="font-size:1.7rem">'+n[0]+'</span><div style="flex:1"><b style="font-size:.88rem">'+esc(n[1])+'</b><div style="font-size:.72rem;opacity:.85">'+esc(n[2])+'</div></div>'+(n[3]?'<button data-n="'+i+'" style="border:none;border-radius:8px;padding:7px 9px;background:#ffb300;font-weight:900;font-size:.74rem">Ansehen</button>':'')+'</div>').join('')+'<button id="zm-ok" style="width:100%;margin-top:6px;padding:11px;border:none;border-radius:12px;background:#43a047;color:#fff;font:900 .95rem Arial">Alles klar!</button>');
      const done=()=>{ z.newsSeen=NEWS_ID; save(); close(); fab(); };
      $('zm-ok').onclick=done; o.onclick=e=>{ if(e.target===o) done(); };
      o.querySelectorAll('[data-n]').forEach(b=>b.onclick=()=>{ const id=NEWS[+b.dataset.n][3]; done(); if(id==='news'){ M.open(); return; } const e=E.find(x=>x.id===id); let lk=false; try{ lk=e.show&&!e.show(); }catch(er){} if(lk) return toast('🔒 '+e.lock); seen()[id]=1; save(); try{ e.go(); }catch(er){} }); };
    // beim Start einmal zeigen (erst wenn das Spiel läuft und nichts anderes offen ist)
    let tries=0; const iv=setInterval(()=>{ tries++; try{ const z=zoo(); if(!z||tries>60){ clearInterval(iv); return; } if(z.newsSeen===NEWS_ID){ clearInterval(iv); return; } if(tries<4||$('s-login')&&$('s-login').offsetParent||document.querySelector('[id*="intro"]:not([style*="none"])')&&0) return; if(document.querySelector('#zm-ov,#zd-ov,#zpi-ov')) return; clearInterval(iv); M.news(); }catch(e){} },2500);
  }
  wait();
})();
