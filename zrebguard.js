/* ═══ ZRebGuard (v777): grosse Rebirth-Warnung (Tiere im Tausch) + Admin-Meldung bei Ignorieren ═══ */
(function(){
  'use strict';
  if(window.ZRebGuard) return;
  const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const RTD=()=>{ try{ return (typeof _rtdb!=='undefined'&&_rtdb&&State._useCloud())?_rtdb:null; }catch(e){ return null; } };
  const G=window.ZRebGuard={};
  // ── Spieler: Vollbild-Warnung (Schwarzbild), erscheint 1× pro Rebirth-Versuch ──
  G.warn=function(n,names){ return new Promise(res=>{
    const old=document.getElementById('zrg-warn'); if(old) old.remove();
    const o=document.createElement('div'); o.id='zrg-warn'; o.style.cssText='position:fixed;inset:0;z-index:99990;background:#000;display:flex;align-items:center;justify-content:center;padding:16px;overflow:auto;font-family:Arial,sans-serif';
    o.innerHTML='<div style="max-width:560px;width:100%;text-align:center;color:#fff"><div style="font-size:4.5rem">⚠️</div><div style="font:900 2.1rem Arial;color:#ff5252;margin:6px 0">STOPP!</div>'
      +'<div style="font:900 1.5rem Arial;line-height:1.3;margin:10px 0">Du hast noch <span style="color:#ffd54f">'+n+' Tier'+(n>1?'e':'')+'</span> im Tausch!</div>'
      +'<div style="font-size:1.05rem;line-height:1.5;margin:10px 0;opacity:.95">'+esc((names||[]).join(', '))+'</div>'
      +'<div style="font-size:1.1rem;line-height:1.55;margin:14px 0;background:rgba(255,82,82,.15);border:2px solid #ff5252;border-radius:14px;padding:14px">Tiere vor dem Rebirth in den Tausch zu legen und danach zurückzuholen ist <b>nicht erlaubt</b>.<br><br>Bitte nimm sie zuerst zu dir:<br><b>Shop → Tauschen → Meine Angebote</b></div>'
      +'<button id="zrg-ok" style="width:100%;padding:18px;border:none;border-radius:16px;background:linear-gradient(135deg,#43a047,#1b5e20);color:#fff;font:900 1.3rem Arial;cursor:pointer">✅ Verstanden – ich nehme sie zurück</button></div>';

    document.body.appendChild(o);
    document.getElementById('zrg-ok').onclick=()=>{ o.remove(); res('stop'); };
  }); };
  G.report=function(v){ const r=RTD(); if(!r) return; try{ r.ref('zoo_viol').push({n:String(ZS.player),k:String(ZS.player).toLowerCase(),t:Date.now(),cnt:v.n,names:(v.names||[]).slice(0,10),reb:(ZS.zoo&&ZS.zoo.reb)||0}); }catch(e){} };
  // ── Admin: grosse Meldung beim Öffnen des Admin-Panels ──
  G.adminAlert=async function(){ const r=RTD(); if(!r) return; let v={}; try{ v=(await r.ref('zoo_viol').once('value')).val()||{}; }catch(e){ return; }
    const ids=Object.keys(v); if(!ids.length) return; const old=document.getElementById('zrg-adm'); if(old) old.remove();
    const f=t=>new Date(t).toLocaleString('de-CH',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
    const o=document.createElement('div'); o.id='zrg-adm'; o.style.cssText='position:fixed;inset:0;z-index:99995;background:#000;display:flex;align-items:flex-start;justify-content:center;padding:16px;overflow:auto;font-family:Arial,sans-serif';
    o.innerHTML='<div style="max-width:620px;width:100%;color:#fff;text-align:center"><div style="font-size:4rem">🚨</div><div style="font:900 1.8rem Arial;color:#ff5252">Regelverstoss!</div><div style="opacity:.8;margin:6px 0 14px;font-size:.95rem">Diese Spieler haben gegen die Regeln verstossen (oder die Rebirth-Warnung ignoriert):</div>'
      +ids.sort((a,b)=>v[b].t-v[a].t).map(id=>{ const x=v[id]; const rule=x.ty==='rule'&&window.ZRules?ZRules.byN(x.rn):null; return '<div data-id="'+id+'" style="background:rgba(255,82,82,.12);border:2px solid #ff5252;border-radius:14px;padding:14px;margin:10px 0;text-align:left"><div style="font:900 1.25rem Arial;color:#ffd54f">'+esc(x.n)+' <span style="font-size:.8rem;opacity:.7;font-weight:400">· '+f(x.t)+' · Rebirth '+x.reb+'</span></div><div style="margin:6px 0;font-size:.98rem;line-height:1.45">'+(rule?'hat gegen <b>Regel '+rule.n+' – '+esc(rule.t)+'</b> verstossen:<br><span style="background:rgba(255,255,255,.1);padding:2px 6px;border-radius:6px">'+esc(x.txt||'')+'</span>':'hat die Rebirth-Nachricht <b>nicht ernst genommen</b>. Im Tausch waren <b>'+x.cnt+'</b> Tier(e): '+esc((x.names||[]).join(', ')))+'</div>'
        +'<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center"><select class="zrg-d" style="padding:8px;border-radius:8px;font-size:.9rem"><option value="60">1 Std.</option><option value="1440" selected>24 Std.</option><option value="10080">7 Tage</option></select><button class="zrg-s" style="padding:9px 14px;border:none;border-radius:10px;background:#f57c00;color:#fff;font:900 .9rem Arial">⏳ Sperre geben</button><button class="zrg-b" style="padding:9px 14px;border:none;border-radius:10px;background:#c62828;color:#fff;font:900 .9rem Arial">🚫 Bannen</button><button class="zrg-o" style="padding:9px 14px;border:none;border-radius:10px;background:#455a64;color:#fff;font:900 .9rem Arial">✔ Erledigt / keine Strafe</button></div></div>'; }).join('')
      +'<button id="zrg-close" style="margin-top:12px;width:100%;padding:14px;border:none;border-radius:14px;background:rgba(255,255,255,.18);color:#fff;font:900 1rem Arial">Später ansehen</button></div>';
    document.body.appendChild(o); document.getElementById('zrg-close').onclick=()=>o.remove();
    const done=(row,id)=>{ r.ref('zoo_viol/'+id).remove().catch(()=>{}); row.remove(); if(!o.querySelector('[data-id]')) o.remove(); };
    o.querySelectorAll('[data-id]').forEach(row=>{ const id=row.dataset.id, x=v[id];
      row.querySelector('.zrg-o').onclick=()=>done(row,id);
      const sanc=async kind=>{ const mins=parseInt(row.querySelector('.zrg-d').value)||60; const reason=(x.ty==='rule'&&window.ZRules)?('Regel '+x.rn+': '+ZRules.byN(x.rn).t):'Rebirth-Warnung ignoriert (Tiere im Tausch)';
        if(!confirm(kind==='ban'?('🚫 '+x.n+' wirklich BANNEN?'):('⏳ '+x.n+' für '+mins+' Min. sperren?'))) return;
        const nm=x.k; const data={player:nm,kind,reason,bannedAt:Date.now(),by:String(ZS.player||'admin'),permanent:kind==='ban',expiresAt:null,durationMs:kind==='ban'?null:mins*60000,started:kind==='ban',duration:kind==='ban'?'perm':(mins+'min')};
        try{ await _db.collection('banned_players').doc(nm).set(data); await r.ref('zoo_sanction/'+(typeof ZAdmin!=='undefined'&&ZAdmin._rk?ZAdmin._rk(nm):nm.replace(/[.#$\[\]\/]/g,'_'))).set(data); try{ ZP.toast((kind==='ban'?'🚫 ':'⏳ ')+x.n+' ist jetzt gesperrt',3000); }catch(e){} done(row,id); }catch(e){ try{ ZP.toast('❌ '+e.message,3500); }catch(z){} } };
      row.querySelector('.zrg-s').onclick=()=>sanc('timeout'); row.querySelector('.zrg-b').onclick=()=>sanc('ban'); }); };
  const wait=()=>{ if(typeof ZAdmin==='undefined'||typeof ZP==='undefined') return setTimeout(wait,1500); if(ZAdmin._rgw) return; ZAdmin._rgw=1; const o=ZAdmin.open; ZAdmin.open=function(){ const r=o.apply(this,arguments); setTimeout(()=>{ try{ G.adminAlert(); }catch(e){} },400); return r; }; };
  wait();
})();
