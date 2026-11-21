/* ZLoad — Traffic-Kurztest (v857). Nur für Admin. Schreibt NUR nach zoo_loadtest/ (nie zoo_hot/zoo_cold),
   räumt danach auf, läuft max. ~12 s mit höchstens 1 echten Leser; der Rest wird hochgerechnet.
   Ergebnis = Textbericht zum Kopieren. */
(function(){
  'use strict';
  if(window.ZLoad) return;
  var $=function(id){ return document.getElementById(id); };
  var RT=function(){ try{ return (typeof _rtdb!=='undefined'&&_rtdb&&State._useCloud())?_rtdb:null; }catch(e){ return null; } };
  var L=window.ZLoad={ running:false, N:20, secs:10, report:'' };
  var OVH=60; // geschätzter Protokoll-Overhead pro Firebase-Nachricht in Byte (Annahme, im Bericht ausgewiesen)
  function jl(v){ try{ return JSON.stringify(v).length; }catch(e){ return 0; } }
  function kb(b){ return (b/1024).toFixed(1)+' KB'; }
  function mb(b){ return (b/1048576).toFixed(b>1e8?0:1)+' MB'; }
  function gb(b){ return (b/1073741824).toFixed(2)+' GB'; }
  function say(t){ var s=$('zload-st'); if(s) s.textContent=t; }
  function sleep(ms){ return new Promise(function(r){ setTimeout(r,ms); }); }
  function hotTemplate(i,now){
    // gleiche Felder wie _syncMP (zoo_hot): x,z,t,carrying,slotIdx,aim,dead,be,tb,sk
    var o={x:Math.round(Math.random()*300-150), z:Math.round(Math.random()*300-150), t:now, carrying:(i%5===0)?{e:'🦒',n:'Giraffe'}:null,
      slotIdx:i, aim:0, dead:0, tb:'', sk:(i%3===0)?'gold':''};
    if(i%4===0) o.be='base'+i;
    return JSON.parse(JSON.stringify(o));
  }
  function coldTemplate(i){
    // gleiche Struktur wie coldData in _syncMP; Gehege-Inhalt aus dem eigenen Zoo als realistische Vorlage
    var enc=[]; try{ enc=((ZS.zoo&&ZS.zoo.enc)||[]).map(function(e){ return e?{animal:e.animal}:null; }); }catch(e){}
    return JSON.parse(JSON.stringify({name:'TESTBOT'+i, char:'🐼', color:'#'+(Math.random()*16777215|0).toString(16).padStart(6,'0'), charId:'explorer',
      locked:false, lockedUntil:0, rank:{n:'Bot',l:1}, baseEq:null, enc:enc}));
  }
  L.start=async function(){
    if(L.running) return;
    var db=RT(); if(!db){ say('❌ Keine Cloud-Verbindung (lokaler Modus).'); return; }
    var okAdmin=false; try{ okAdmin=!!(ZS.isAdmin||(window.ZAdmin&&ZAdmin._hasAccess)); }catch(e){}
    if(!okAdmin){ say('❌ Nur für Admins.'); return; }
    var N=Math.max(2,Math.min(20,parseInt(($('zload-n')||{}).value,10)||L.N));
    var T=Math.max(5,Math.min(15,parseInt(($('zload-t')||{}).value,10)||L.secs));
    L.running=true; var btn=$('zload-go'); if(btn){ btn.disabled=true; btn.style.opacity='.5'; }
    var root=db.ref('zoo_loadtest'); var inst='t'+Date.now().toString(36);
    var R={N:N,T:T,cycles:0,wB:[],rB:[],wMs:[],rMs:[],errs:0,coldW:0,coldR:0,coldRMs:0,hotEntry:0,coldEntry:0};
    var bytesSent=0, bytesRecv=0, ops=0;
    try{
      say('Räume alte Testdaten auf …'); await root.remove().catch(function(){});
      var cold={}, hot={}; var now=Date.now();
      for(var i=0;i<N;i++){ cold['b'+i]=coldTemplate(i); hot['b'+i]=hotTemplate(i,now); }
      R.hotEntry=jl(hot.b0); R.coldEntry=Math.round(jl(cold)/N);
      say('Kalt-Daten schreiben …');
      var t0=performance.now(); await db.ref('zoo_loadtest/cold/'+inst).set(cold); R.coldW=performance.now()-t0; bytesSent+=jl(cold)+OVH; ops++;
      var tc=performance.now(); var cs=await db.ref('zoo_loadtest/cold/'+inst).once('value'); R.coldRMs=performance.now()-tc; R.coldR=jl(cs.val()); bytesRecv+=R.coldR+OVH; ops++;
      var end=Date.now()+T*1000, step=500;
      while(Date.now()<end){
        var c0=Date.now(); say('Test läuft … '+Math.max(0,Math.round((end-c0)/1000))+' s');
        var up={}; for(var k in hot){ hot[k].t=c0; hot[k].x+=Math.round(Math.random()*4-2); hot[k].z+=Math.round(Math.random()*4-2); up[k]=hot[k]; }
        try{
          var w0=performance.now(); await db.ref('zoo_loadtest/hot/'+inst).update(up); R.wMs.push(performance.now()-w0);
          var wb=jl(up); R.wB.push(wb); bytesSent+=wb+OVH; ops++;
          var r0=performance.now(); var hs=await db.ref('zoo_loadtest/hot/'+inst).once('value'); R.rMs.push(performance.now()-r0);
          var rb=jl(hs.val()); R.rB.push(rb); bytesRecv+=rb+OVH; ops++; R.cycles++;
        }catch(e){ R.errs++; }
        var left=step-(Date.now()-c0); if(left>0) await sleep(left);
      }
      say('Räume auf …'); await root.remove().catch(function(){});
    }catch(e){ R.errs++; R.fatal=String(e&&e.message||e); try{ await root.remove(); }catch(_){} }
    L.running=false; if(btn){ btn.disabled=false; btn.style.opacity='1'; }
    R.sent=bytesSent; R.recv=bytesRecv; R.ops=ops;
    L.report=L.build(R); var ta=$('zload-out'); if(ta){ ta.value=L.report; }
    try{ localStorage.setItem('zload_last',L.report); }catch(e){}
    say(R.errs?'⚠️ Fertig mit '+R.errs+' Fehler(n) – Bericht unten.':'✅ Fertig – Bericht unten kopieren und an Claude schicken.');
  };
  function avg(a){ return a.length?a.reduce(function(x,y){return x+y;},0)/a.length:0; }
  function med(a){ if(!a.length) return 0; var s=a.slice().sort(function(x,y){return x-y;}); return s[s.length>>1]; }
  // Hochrechnung: pro Client und Stunde, mit exakt den Raten aus _syncMP (Basis 500 ms in Stunde 1, 1000 ms Std 2–3, 1500 ms Std 4, 2500 ms danach; Cold-Read alle 20 s)
  function model(n,R){
    var hotW=R.hotEntry+OVH;                       // 1 Schreibvorgang pro Zyklus
    var hotR=(R.hotEntry*n)+OVH;                   // gesamter zoo_hot wird gelesen
    var coldR=((R.coldEntry*n)+OVH);               // gesamter zoo_cold alle 20 s
    var rates=[500,1000,1500,2500];
    var per=rates.map(function(g){ var cyc=3600000/g; return { up:cyc*hotW, down:cyc*hotR+180*coldR }; });
    return {per:per,hotW:hotW,hotR:hotR,coldR:coldR};
  }
  L.build=function(R){
    var n=R.N, l=[], now=new Date();
    var wB=med(R.wB), rB=med(R.rB);
    l.push('=== MISCHA ZOO TRAFFIC-TEST (v857) ===');
    l.push('Zeit: '+now.toISOString()+' | Gerät: '+(navigator.userAgent||'').slice(0,80));
    l.push('Bots: '+n+' | Dauer: '+R.T+' s | Zyklen: '+R.cycles+' | Fehler: '+R.errs+(R.fatal?' ('+R.fatal+')':''));
    l.push('');
    l.push('-- Gemessen (echte Firebase-Aufrufe, Pfad zoo_loadtest) --');
    l.push('Hot-Eintrag pro Spieler: '+R.hotEntry+' B');
    l.push('Hot-Schreiben (alle '+n+' Bots / Zyklus): Median '+wB+' B, Latenz Ø '+avg(R.wMs).toFixed(0)+' ms');
    l.push('Hot-Lesen (ganzer Knoten, '+n+' Spieler): Median '+rB+' B, Latenz Ø '+avg(R.rMs).toFixed(0)+' ms (max '+Math.max.apply(null,R.rMs.concat([0])).toFixed(0)+' ms)');
    l.push('Cold pro Spieler: '+R.coldEntry+' B | Cold-Lesen ganz: '+R.coldR+' B in '+R.coldRMs.toFixed(0)+' ms | Cold-Schreiben: '+R.coldW.toFixed(0)+' ms');
    l.push('Echt verbraucht im Test: gesendet '+kb(R.sent)+', empfangen '+kb(R.recv)+' ('+R.ops+' Aufrufe)');
    l.push('');
    l.push('-- Hochrechnung pro Spieler und Stunde (Raten wie im Spiel; Overhead '+OVH+' B/Aufruf geschätzt) --');
    var m=model(n,R);
    ['Std 1 (500 ms)','Std 2–3 (1 s)','Std 4 (1,5 s)','ab Std 5 (2,5 s)'].forEach(function(nm,i){
      l.push(nm+': Upload '+mb(m.per[i].up)+' | Download '+mb(m.per[i].down));
    });
    l.push('');
    l.push('-- Alle Spieler zusammen, 1 Stunde (erste Stunde, Basisrate) --');
    [5,10,15,20].forEach(function(k){
      var mk=model(k,R); var up=mk.per[0].up*k, dn=mk.per[0].down*k;
      l.push(k+' Spieler gleichzeitig: Download '+mb(dn)+' (Firebase rechnet Download), Upload '+mb(up));
    });
    l.push('');
    l.push('-- Monat (Beispiel: 20 Spieler, 2 h/Tag, 30 Tage, nur Stunde 1–2 Raten) --');
    var m20=model(20,R); var dmon=(m20.per[0].down+m20.per[1].down)*20*30;
    l.push('Download gesamt ≈ '+gb(dmon)+' (Spark-Limit: 10 GB/Monat; Firebase zählt zusätzlich Overhead, daher eher Untergrenze)');
    l.push('Gleichzeitige Verbindungen: 20 Spieler = 20 (Limit 100)');
    l.push('');
    try{ if(window.ZNet){ var s=['-- ZNet dieses Geräts seit Seitenstart (echte Spiel-Pfade) --']; var o=ZNet.out||{}, i=ZNet.inn||{};
      Object.keys(i).sort(function(a,b){return i[b]-i[a];}).slice(0,8).forEach(function(k){ s.push('Download '+k+': '+kb(i[k])+' ('+(ZNet.cnt.r[k]||0)+' Aufrufe)'); });
      Object.keys(o).sort(function(a,b){return o[b]-o[a];}).slice(0,6).forEach(function(k){ s.push('Upload '+k+': '+kb(o[k])+' ('+(ZNet.cnt.w[k]||0)+' Aufrufe)'); });
      s.push('Seit '+Math.round((Date.now()-ZNet.t0)/60000)+' min'); l.push(s.join('\n')); } }catch(e){}
    l.push('=== ENDE ===');
    return l.join('\n');
  };
  L.adminHTML=function(){
    var last=''; try{ last=localStorage.getItem('zload_last')||''; }catch(e){}
    return '<div style="font-size:.78rem;line-height:1.45;color:#fff;padding:6px">'
      +'Kurztest mit simulierten Spielern. Schreibt nur in <code>zoo_loadtest</code> (echte Spielerdaten bleiben unberührt) und löscht danach alles. '
      +'Misst echte Grössen und Zeiten, rechnet den Rest hoch → minimaler Traffic (ca. 1–2 MB).<br><br>'
      +'Bots: <input id="zload-n" type="number" min="2" max="20" value="20" style="width:56px"> &nbsp; Sekunden: <input id="zload-t" type="number" min="5" max="15" value="10" style="width:56px"><br>'
      +'<button id="zload-go" class="padmin-btn" style="background:#2980B9;margin-top:8px" onclick="ZLoad.start()">▶️ Test starten</button> '
      +'<button class="padmin-btn" style="background:#27AE60;margin-top:8px" onclick="ZLoad.copy()">📋 Bericht kopieren</button>'
      +'<div id="zload-st" style="margin-top:6px;color:#ffd54f"></div>'
      +'<textarea id="zload-out" readonly style="width:100%;height:260px;margin-top:6px;background:#0d1117;color:#9fe;font:11px monospace;border:1px solid #345;border-radius:6px">'+last.replace(/</g,'&lt;')+'</textarea></div>';
  };
  L.copy=function(){
    var ta=$('zload-out'); if(!ta) return; ta.select();
    try{ navigator.clipboard.writeText(ta.value).then(function(){ say('📋 Kopiert.'); },function(){ document.execCommand('copy'); say('📋 Kopiert.'); }); }
    catch(e){ try{ document.execCommand('copy'); say('📋 Kopiert.'); }catch(_){} }
  };
})();
