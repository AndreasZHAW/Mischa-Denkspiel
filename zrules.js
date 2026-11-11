/* ═══ ZRules (v779): Spielregeln (Startseite, Menü, Admin) + automatische Regelverstoss-Meldung an den Admin ═══ */
(function(){
  'use strict';
  if(window.ZRules) return;
  const R=window.ZRules={};
  R.list=[
    {n:1,ic:'🔁',t:'Kein Tier-Trick beim Rebirth',d:'Tiere nicht kurz in den Tausch legen, um sie nach dem Rebirth zurückzuholen.'},
    {n:2,ic:'🤬',t:'Respekt im Chat',d:'Keine Beleidigungen, Schimpfwörter oder Mobbing.'},
    {n:3,ic:'📢',t:'Kein Spam',d:'Nicht dieselbe Nachricht immer wieder schicken und nicht nur GROSS schreiben.'},
    {n:4,ic:'🔗',t:'Keine Werbung oder Links',d:'Keine Links zu fremden Seiten und keine Werbung im Chat.'},
    {n:5,ic:'🔑',t:'Passwörter bleiben geheim',d:'Gib dein Passwort nie weiter, auch nicht an Freunde. Frage auch nie nach dem Passwort von anderen.'},
    {n:7,ic:'🐛',t:'Fehler nicht ausnutzen',d:'Wenn du einen Fehler (Bug) findest, melde ihn mit dem 🛠️-Knopf, statt ihn auszunutzen.'},
    {n:8,ic:'🚫',t:'Keine Cheats',d:'Keine Skripte, Auto-Klicker oder andere Tricks, die das Spiel verändern.'},
    {n:10,ic:'🏷️',t:'Anständige Namen',d:'Dein Name darf niemanden beleidigen und keine echte Person oder einen Admin nachahmen.'},
    {n:14,ic:'👑',t:'Respekt vor Admins',d:'Entscheidungen der Admins werden respektiert.'},
    {n:15,ic:'🚩',t:'Nur echte Meldungen',d:'Melde nur echte Probleme. Falsche Meldungen sind nicht erlaubt.'},
    {n:17,ic:'🖼️',t:'Anständige Bilder',d:'Im Chat nur Bilder und Screenshots, die niemandem schaden und für alle passen.'},
    {n:18,ic:'💶',t:'Kein Handel mit echtem Geld',d:'Spielgeld, Tiere oder Konten dürfen nicht gegen echtes Geld verkauft oder gekauft werden.'},
    {n:19,ic:'🏆',t:'Fair spielen',d:'Arena, Ranglisten und Wettbewerbe fair spielen, ohne Absprachen oder Tricks.'},
    {n:20,ic:'🆕',t:'Strafen nicht umgehen',d:'Wer gesperrt ist, darf keine neuen Konten anlegen, um weiterzuspielen.'}
  ];
  R.byN=n=>R.list.find(r=>r.n===n)||{n,ic:'📜',t:'Regel '+n,d:''};
  R.html=function(compact){ return R.list.map(r=>'<div style="display:flex;gap:9px;align-items:flex-start;padding:'+(compact?'5px 0':'7px 0')+';border-top:1px solid rgba(255,255,255,.12);text-align:left"><span style="font-size:1.25rem;min-width:26px;text-align:center">'+r.ic+'</span><span style="flex:1"><b>'+r.t+'</b><br><span style="opacity:.85;font-size:.82em">'+r.d+'</span></span></div>').join(''); };
  R.open=function(){ const old=document.getElementById('zrules-ov'); if(old) old.remove(); const o=document.createElement('div'); o.id='zrules-ov'; o.style.cssText='position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;padding:14px'; o.onclick=e=>{ if(e.target===o) o.remove(); };
    o.innerHTML='<div style="background:linear-gradient(160deg,#1a237e,#283593);border:3px solid #ffd54f;border-radius:18px;padding:16px;max-width:420px;width:100%;color:#fff;font-family:Arial,sans-serif;max-height:90vh;overflow:auto"><div style="text-align:center;font-size:2rem">📜</div><div style="text-align:center;font:900 1.2rem Arial;color:#ffd54f;margin-bottom:6px">Spielregeln</div><div style="font-size:.88rem">'+R.html()+'</div><div style="font-size:.74rem;opacity:.75;margin:8px 0;text-align:center">Wer die Regeln bricht, kann gesperrt werden.</div><button style="width:100%;padding:11px;border:none;border-radius:12px;background:linear-gradient(135deg,#43a047,#1b5e20);color:#fff;font:900 .95rem Arial">Verstanden</button></div>'; o.querySelector('button').onclick=()=>o.remove(); document.body.appendChild(o); };
  // Startseite (Zoo-Login): Regeln direkt auflisten
  const start=function(){ const sl=document.getElementById('s-login'); if(!sl||document.getElementById('zrules-start')) return; const d=document.createElement('div'); d.id='zrules-start'; d.style.cssText='max-width:420px;margin:12px auto 20px;padding:12px 14px;background:rgba(255,255,255,.08);border:2px solid rgba(255,213,79,.5);border-radius:16px;color:#fff;font-family:Arial,sans-serif;font-size:.85rem';
    d.innerHTML='<div style="text-align:center;font:900 1.05rem Arial;color:#ffd54f;margin-bottom:4px">📜 Spielregeln</div>'+R.html(true)+'<div style="text-align:center;font-size:.72rem;opacity:.75;margin-top:6px">Mit dem Anmelden stimmst du den Regeln zu.</div>'; sl.appendChild(d); };
  setInterval(start,1000); start();
  // ── Meldung an den Admin ──
  const RTD=()=>{ try{ return (typeof _rtdb!=='undefined'&&_rtdb&&State._useCloud())?_rtdb:null; }catch(e){ return null; } };
  const lastRep={};
  R.report=function(rn,txt){ const r=RTD(); if(!r||typeof ZS==='undefined'||!ZS.player) return; const k=String(ZS.player).toLowerCase(), key=k+':'+rn; if(Date.now()-(lastRep[key]||0)<10*60000) return; lastRep[key]=Date.now(); try{ r.ref('zoo_viol').push({n:String(ZS.player),k,t:Date.now(),ty:'rule',rn,txt:String(txt||'').slice(0,160),reb:(ZS.zoo&&ZS.zoo.reb)||0}); }catch(e){} };
  const BAD=/(arschloch|scheisse|scheiße|scheiss|fick|hurensohn|wichser|fotze|schlampe|nutte|spast|missgeburt|nazi|fuck|shit|bitch|asshole|cunt|nigger)/i;
  const rx={ link:/(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|ch|de|net|org|io|gg|me|ly)\b|discord\.gg)/i, pw:/(passwort|password|kennwort|\bpw\b)\s*(ist|:|=|lautet)|(gib|sag|schick|sende)\w*\s+(mir\s+)?(dein|ein)\w*\s+(passwort|password|pw)/i, geld:/(paypal|twint|\bchf\b|\beuro\b|\bfranken\b|\bdollar\b|bezahl\w*\s+(mit|per)|(verkauf|kauf)\w*\s+.{0,25}(account|konto|tiere|mischataler|mt)\s+.{0,25}(für|fuer)\s+\d)/i };
  const hist=[];
  // Rückgabe: null = ok, sonst {rn,block}
  R.check=function(msg){ const m=String(msg||''); const now=Date.now();
    if(rx.pw.test(m)) return {rn:5,block:true,why:'Passwörter niemals weitergeben oder erfragen!'};
    if(rx.geld.test(m)) return {rn:18,block:true,why:'Kein Handel mit echtem Geld erlaubt!'};
    if(rx.link.test(m)) return {rn:4,block:true,why:'Links und Werbung sind nicht erlaubt!'};
    if(BAD.test(m)) return {rn:2,block:false};
    hist.push({m:m.toLowerCase(),t:now}); while(hist.length&&now-hist[0].t>60000) hist.shift(); const same=hist.filter(h=>h.m===m.toLowerCase()).length;
    const letters=m.replace(/[^a-zA-ZäöüÄÖÜ]/g,''); if(same>=3||(letters.length>=14&&letters===letters.toUpperCase())) return {rn:3,block:same>=3,why:'Bitte kein Spam!'};
    return null; };
  const hook=function(){ if(typeof ZChat==='undefined'||typeof ZP==='undefined'||ZChat._zr) return setTimeout(hook,2000); ZChat._zr=1; const o=ZChat.send; ZChat.send=function(){ try{ const inp=document.getElementById('chat-in'); if(inp&&inp.value.trim()){ const v=R.check(inp.value); if(v){ R.report(v.rn,inp.value.trim()); if(v.block){ inp.value=''; try{ ZP.toast('🚫 Regel '+v.rn+': '+v.why,4000); }catch(e){} return; } } } }catch(e){} return o.apply(this,arguments); }; };
  hook();
  // Name prüfen (Regel 10)
  const nameChk=function(){ if(typeof ZS==='undefined'||!ZS.player||typeof State==='undefined') return setTimeout(nameChk,3000); const nm=String(ZS.player); const adminNames=['bu:)','bu:3']; const low=nm.toLowerCase(); if(adminNames.includes(low)) return; if(BAD.test(low)||/(^|[^a-z])(admin|administrator|mischa|moderator)([^a-z]|$)/.test(low)) setTimeout(()=>R.report(10,'Name: '+nm),5000); };
  nameChk();
})();
