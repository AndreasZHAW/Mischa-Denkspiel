/* ═══ ZSkill (v792): 🌳 Fähigkeitsbaum – 5 Punkte pro Rebirth, 4 Äste, alle Effekte wirken wirklich im Spiel ═══ */
(function(){
  'use strict';
  if(window.ZSkill) return;
  const wait=()=>{ if(typeof ZS==='undefined'||!ZS.zoo||!ZS.player||typeof ZP==='undefined') return setTimeout(wait,1500); try{ init(); }catch(e){ console.warn('ZSkill',e); } };
  function init(){
    const $=id=>document.getElementById(id), zoo=()=>ZS.zoo;
    const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const toast=(m,t)=>{ try{ ZP.toast(m,t||2500); }catch(e){} };
    const save=()=>{ try{ ZS.save&&ZS.save(); }catch(e){} };
    const K=window.ZSkill={};
    // ═══ Der Baum ═══
    const BR=[
      {id:'a',ic:'🏪',n:'Zoo-Chef',col:'#ffb300',nodes:[
        ['a1','👋','Freundlicher Empfang',1,{visitor:1.1},'Besucher ×1,1'],
        ['a2','💵','Gute Preise',1,{money:1.1},'Einkommen ×1,1'],
        ['a3','📢','Werbekampagne',2,{visitor:1.2},'Besucher ×1,2'],
        ['a4','⭐','Stammkunden',3,{money:1.25},'Einkommen ×1,25'],
        ['a5','🏰','Zoo-Imperium',3,{visitor:1.3,money:1.2},'Besucher ×1,3 und Einkommen ×1,2']]},
      {id:'b',ic:'🍀',n:'Glück & Boosts',col:'#43a047',nodes:[
        ['b1','🍀','Glückspilz',1,{luck:1.1},'Glück ×1,1'],
        ['b2','☘️','Kleeblatt',1,{luck:1.2},'Glück ×1,2'],
        ['b3','⏳','Langer Atem',2,{boostdur:1.25},'Alle Boosts halten 25 % länger'],
        ['b4','🌟','Glücksstern',3,{luck:1.5},'Glück ×1,5'],
        ['b5','🧪','Boost-Meister',3,{boostdur:1.5},'Boosts halten weitere 50 % länger']]},
      {id:'c',ic:'🧭',n:'Abenteuer',col:'#1e88e5',nodes:[
        ['c1','🚂','Lokführer-Lizenz',1,{train:1.25},'Bahn-Einnahmen ×1,25'],
        ['c2','🥚','Brutkasten',1,{hatch:.8},'Eier schlüpfen 20 % schneller'],
        ['c3','🏴‍☠️','Schatzjäger',2,{pgold:1.2},'Piraten-Gold ×1,2'],
        ['c4','🐣','Schnellbrüter',3,{hatch:.75},'Eier schlüpfen weitere 25 % schneller'],
        ['c5','⚓','Piraten-Kapitän',3,{phull:1.25,pdmg:1.25},'Schiff-Leben ×1,25 und Kanonen ×1,25']]},
      {id:'d',ic:'⏰',n:'Fleiss',col:'#8e24aa',nodes:[
        ['d1','🌙','Nachtschicht',1,{offline:1.5},'Einkommen, während du weg bist, ×1,5'],
        ['d2','🐷','Sparfuchs',1,{rebcost:.95},'Rebirth kostet 5 % weniger'],
        ['d3','😴','Schlaf-Gewinn',2,{offline:1.5},'Einkommen, während du weg bist, weitere ×1,5'],
        ['d4','🏦','Goldene Bank',3,{rebcost:.9},'Rebirth kostet weitere 10 % weniger'],
        ['d5','👑','Grosser Bonus',3,{money:1.3},'Einkommen ×1,3']]}
    ];
    const NODES={}; BR.forEach(b=>b.nodes.forEach((n,i)=>{ NODES[n[0]]={id:n[0],br:b.id,i,ic:n[1],n:n[2],cost:n[3],eff:n[4],d:n[5],req:i?b.nodes[i-1][0]:null}; }));
    K.nodes=NODES; K.branches=BR;
    const S=()=>{ const z=zoo(); return z.sk||(z.sk={u:{},resp:0}); };
    const total=()=>((zoo().reb||0)*5)+(S().bonus||0);
    const spent=()=>Object.keys(S().u).reduce((a,k)=>a+(NODES[k]?NODES[k].cost:0),0);
    const free=K.free=()=>Math.max(0,total()-spent());
    // ═══ Wirkung ═══
    let cache=null, ck='';
    const M=K.m=function(type){ try{ const u=S().u; const key=Object.keys(u).join(','); if(key!==ck){ ck=key; cache={}; Object.keys(u).forEach(id=>{ const n=NODES[id]; if(n) Object.keys(n.eff).forEach(t=>{ cache[t]=(cache[t]||1)*n.eff[t]; }); }); } return (cache&&cache[type])||1; }catch(e){ return 1; } };
    // Einkommen
    if(typeof earn==='function'&&!earn._sk){ const o=earn; const w=function(){ const v=o.apply(this,arguments); return v*M('money'); }; w._sk=1; window.earn=w; }
    // Besucher-Tempo
    if(ZS.visitMs&&!ZS.visitMs._sk){ const o=ZS.visitMs; ZS.visitMs=function(){ const v=o.apply(this,arguments); return Math.max(500,v/M('visitor')); }; ZS.visitMs._sk=1; }
    // Glück
    if(ZS.lk&&!ZS.lk._sk){ const o=ZS.lk; ZS.lk=function(){ return o.apply(this,arguments)*M('luck'); }; ZS.lk._sk=1; }
    // Rebirth-Kosten
    if(typeof rebReq==='function'&&!rebReq._sk){ const o=rebReq; const w=function(n){ const r=o.apply(this,arguments); if(r&&r.mt) r.mt=Math.round(r.mt*M('rebcost')); return r; }; w._sk=1; window.rebReq=w; }
    // Offline-Einkommen
    try{ if(ZG._catchUpOfflineEarnings&&!ZG._catchUpOfflineEarnings._sk){ const o=ZG._catchUpOfflineEarnings; ZG._catchUpOfflineEarnings=function(){ const z=zoo(), b=z?z.mt:0; const r=o.apply(this,arguments); try{ const d=(z.mt||0)-(b||0); const f=M('offline'); if(d>0&&f>1){ const ex=d*(f-1); z.mt+=ex; z.te=(z.te||0)+ex; ZP.toast('🌙 Nachtschicht-Bonus: +'+(typeof $mt==='function'?$mt(Math.round(ex)):Math.round(ex))+' MT extra!',5000); } }catch(e){} return r; }; ZG._catchUpOfflineEarnings._sk=1; } }catch(e){}
    // Boost-Dauer & Eier-Zeit (Überwachung, wirkt für ALLE Quellen)
    const lastB={}; { const b=zoo().mtPassBoosts||{}; ['money','visitor','luck'].forEach(t=>{ lastB[t]=(b[t]&&b[t].until)||0; }); }
    setInterval(()=>{ try{ const z=zoo(), now=Date.now(); const f=M('boostdur'); const b=z.mtPassBoosts; if(b) ['money','visitor','luck'].forEach(t=>{ const c=b[t]; if(!c){ lastB[t]=0; return; } const L=lastB[t]||0; if(c.until>L+1500&&c.until>now){ const base=Math.max(now,L); const gain=c.until-base; if(f>1&&gain>0){ c.until=Math.round(c.until+gain*(f-1)); save(); } } lastB[t]=c.until; });
      const eg=z.r6&&z.r6.egg; const h=M('hatch'); if(eg&&eg.slots&&h<1) eg.slots.forEach(s=>{ if(s&&!s.sk){ s.sk=1; const rest=s.until-now; if(rest>0) s.until=Math.round(now+rest*h); save(); } }); }catch(e){} },1000);
    // ═══ Oberfläche ═══
    function ov(){ let o=$('zsk-ov'); if(o) o.remove(); o=document.createElement('div'); o.id='zsk-ov'; o.style.cssText='position:fixed;inset:0;z-index:792;background:rgba(0,0,0,.78);display:flex;align-items:center;justify-content:center;padding:8px;font-family:Arial,sans-serif'; o.onclick=e=>{ if(e.target===o) o.remove(); }; document.body.appendChild(o); return o; }
    let sel=null;
    K.open=function(sel0){ sel=sel0||sel; const o=ov(); const s=S(), fr=free(), tot=total(); const can=id=>{ const n=NODES[id]; return !s.u[id]&&(!n.req||s.u[n.req])&&fr>=n.cost; };
      const nodeHtml=(b,n)=>{ const N=NODES[n[0]], own=!!s.u[N.id], avail=!own&&(!N.req||s.u[N.req]), aff=can(N.id); const bd=own?'#7dffb0':avail?(aff?b.col:'#9e9e9e'):'rgba(255,255,255,.18)'; return '<div data-n="'+N.id+'" style="flex:0 0 112px;position:relative;border:3px solid '+bd+';border-radius:14px;background:'+(own?'rgba(67,160,71,.3)':avail?'rgba(255,255,255,.1)':'rgba(0,0,0,.3)')+';padding:8px 6px;text-align:center;cursor:pointer;'+(!own&&!avail?'opacity:.5':'')+(aff?';box-shadow:0 0 12px '+b.col:'')+'"><div style="font-size:1.6rem">'+(own||avail?N.ic:'🔒')+'</div><div style="font:900 .72rem Arial;min-height:1.9em;line-height:1.15">'+esc(own||avail?N.n:'???')+'</div><div style="font-size:.65rem;margin-top:3px;font-weight:900;color:'+(own?'#7dffb0':'#ffd54f')+'">'+(own?'✅ aktiv':N.cost+' '+(N.cost===1?'Punkt':'Punkte'))+'</div></div>'; };
      let det=''; if(sel&&NODES[sel]){ const N=NODES[sel], own=!!s.u[N.id], avail=!N.req||s.u[N.req]; det='<div style="margin-top:8px;background:rgba(0,0,0,.35);border:2px solid #ffd54f;border-radius:12px;padding:10px"><div style="font:900 1rem Arial">'+N.ic+' '+esc(N.n)+'</div><div style="font-size:.85rem;margin:4px 0">'+esc(N.d)+'</div>'+(own?'<div style="color:#7dffb0;font-weight:900">✅ Schon freigeschaltet</div>':!avail?'<div style="color:#ff8a80;font-size:.8rem">🔒 Schalte zuerst „'+esc(NODES[N.req].n)+'“ frei.</div>':fr<N.cost?'<div style="color:#ff8a80;font-size:.8rem">Dir fehlen '+(N.cost-fr)+' Punkt(e). Mit jedem Rebirth bekommst du 5 neue.</div>':'<button id="zsk-buy" style="width:100%;margin-top:4px;padding:10px;border:none;border-radius:10px;background:#43a047;color:#fff;font:900 .95rem Arial">🔓 Freischalten ('+N.cost+' '+(N.cost===1?'Punkt':'Punkte')+')</button>')+'</div>'; }
      const rs=Date.now()-(s.resp||0)>864e5;
      o.innerHTML='<div style="background:linear-gradient(160deg,#1b3a2a,#12261c);border:3px solid #7dffb0;border-radius:18px;padding:12px;max-width:640px;width:100%;max-height:94vh;overflow-y:auto;color:#fff"><div style="display:flex;align-items:center;gap:8px"><div style="flex:1;font:900 1.2rem Arial">🌳 Fähigkeitsbaum</div><button id="zsk-x" style="border:none;background:rgba(255,255,255,.18);color:#fff;border-radius:8px;width:32px;height:32px">✕</button></div>'
        +'<div style="display:flex;gap:8px;align-items:center;margin:6px 0 4px"><div style="background:rgba(255,213,79,.2);border:2px solid #ffd54f;border-radius:12px;padding:6px 12px;font:900 1rem Arial">🔶 '+fr+' frei <span style="opacity:.7;font-weight:700;font-size:.75rem">von '+tot+'</span></div><div style="flex:1;font-size:.72rem;opacity:.85">Du bekommst <b>5 Punkte pro Rebirth</b>. Wähle weise: nicht alles ist gleichzeitig möglich!</div></div>'
        +BR.map(b=>'<div style="margin-top:8px"><div style="font:900 .9rem Arial;color:'+b.col+';margin-bottom:4px">'+b.ic+' '+b.n+'</div><div style="display:flex;align-items:center;gap:4px;overflow-x:auto;padding:4px 2px 8px">'+b.nodes.map((n,i)=>(i?'<span style="opacity:.6">➜</span>':'')+nodeHtml(b,n)).join('')+'</div></div>').join('')
        +det+'<div style="display:flex;gap:6px;margin-top:10px"><button id="zsk-rs" style="flex:1;padding:9px;border:none;border-radius:10px;background:'+(rs?'#e65100':'#555')+';color:#fff;font-weight:900;font-size:.78rem">↺ Alles zurücksetzen'+(rs?' (gratis)':' (1×/Tag)')+'</button></div><div style="font-size:.66rem;opacity:.6;margin-top:6px">Alle Fähigkeiten wirken sofort im echten Spiel.</div></div>';
      $('zsk-x').onclick=()=>o.remove();
      o.querySelectorAll('[data-n]').forEach(e=>e.onclick=()=>K.open(e.dataset.n));
      const bb=$('zsk-buy'); if(bb) bb.onclick=()=>{ const N=NODES[sel]; if(!can(N.id)) return; s.u[N.id]=1; save(); try{ ZGfx.confetti(60); }catch(e){} try{ window.ZDevice&&ZDevice.vib('win'); }catch(e){} toast('🔓 '+N.n+' freigeschaltet: '+N.d,4500); refresh(); K.open(N.id); };
      $('zsk-rs').onclick=()=>{ if(!rs) return toast('Du kannst nur 1× pro Tag zurücksetzen.'); if(!Object.keys(s.u).length) return toast('Es ist noch nichts freigeschaltet.'); if(!confirm('Alle Fähigkeiten zurücksetzen? Du bekommst alle Punkte zurück.')) return; s.u={}; s.resp=Date.now(); save(); toast('↺ Punkte zurückgegeben'); refresh(); K.open(null); }; };
    // ═══ Knopf (links) & Menü ═══
    const fb=document.createElement('button'); fb.id='zsk-fab'; fb.innerHTML='🌳<span id="zsk-dot" style="display:none;position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;border-radius:9px;background:#e53935;color:#fff;font:900 .68rem/18px Arial;text-align:center;padding:0 3px"></span>'; fb.title='Fähigkeitsbaum'; fb.style.cssText='position:fixed;left:8px;top:118px;z-index:127;width:44px;height:44px;border-radius:50%;border:3px solid #fff;background:linear-gradient(135deg,#2e7d32,#1b5e20);color:#fff;font-size:1.3rem;box-shadow:0 2px 8px rgba(0,0,0,.5)'; document.body.appendChild(fb); fb.onclick=()=>K.open();
    function refresh(){ const n=free(), d=$('zsk-dot'); if(d){ d.style.display=n>0?'block':'none'; d.textContent=n>99?'99+':n; } fb.style.animation=n>0?'zmPulse 1.6s infinite':'none'; }
    setInterval(()=>{ try{ fb.style.display=(zoo().reb>0||free()>0||Object.keys(S().u).length||(ZS.isAdmin))&&!((window.ZStation&&ZStation.riding)||ZG._liftActive||ZG._arcadeActive||(window.ZPirate&&ZPirate.open))?'block':'none'; refresh(); }catch(e){} },1500); refresh();
    let hk=0; const hook=()=>{ try{ if(window.ZMenu&&!K._me){ K._me=1; const E=ZMenu.entries, i=E.findIndex(e=>e.id==='detektiv'); E.splice(i<0?0:i,0,{id:'skill',ic:'🌳',n:'Fähigkeitsbaum',d:'5 Punkte pro Rebirth',badge:()=>{ const n=free(); return n>0?String(n):''; },show:()=>zoo().reb>0||ZS.isAdmin,lock:'Ab Rebirth 1',go:()=>K.open()}); } if(!K._me&&++hk<60) setTimeout(hook,1500); }catch(e){ if(++hk<60) setTimeout(hook,1500); } }; hook();
    K.on=true;
  }
  wait();
})();
