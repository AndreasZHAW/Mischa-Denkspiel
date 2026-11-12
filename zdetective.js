/* ═══ ZDetective (v783): 🕵️ Detektiv-Fälle – Orte erkunden, Rätsel lösen, Verdächtige befragen, Täter anklagen (Solo) ═══ */
(function(){
  'use strict';
  if(window.ZDetective) return;
  const wait=()=>{ if(typeof ZS==='undefined'||!ZS.zoo||!ZS.player||typeof ZP==='undefined') return setTimeout(wait,2000); try{ init(); }catch(e){ console.warn('ZDetective',e); } };
  function init(){
    const $=id=>document.getElementById(id), zoo=()=>ZS.zoo;
    const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const toast=(m,t)=>{ try{ ZP.toast(m,t||3000); }catch(e){} };
    const save=()=>{ try{ ZS.save&&ZS.save(); }catch(e){} };
    const D=window.ZDetective={};
    const norm=s=>String(s||'').toLowerCase().trim().replace(/ö/g,'oe').replace(/ä/g,'ae').replace(/ü/g,'ue').replace(/ß/g,'ss').replace(/[^a-z0-9 ]/g,'').replace(/^(der|die|das|ein|eine) /,'').trim();
    // ═══════ Die Fälle ═══════
    const CASES=[
     {id:'c1',lvl:1,ic:'🥕',t:'Der verschwundene Futtersack',
      intro:'Im Zoo ist ein ganzer Futtersack für die Elefanten verschwunden! Der Direktor bittet dich um Hilfe: Finde den Dieb. Schau dir die Orte an, befrage die Verdächtigen und klage am Ende den Täter an.',
      clues:{tuer:['🚪','Die Lagertür wurde mit einem Schlüssel geöffnet – sie ist nicht aufgebrochen.'],fuss:['👢','Hinter dem Lager sind tiefe Stiefel-Abdrücke: Schuhgrösse 46.'],liste:['📋','Nur Lena und Paul haben einen Lagerschlüssel.']},
      places:[{id:'lager',ic:'🏚️',n:'Futterlager',txt:'Der Raum ist leer. Die Tür hängt gerade in den Angeln – nichts ist aufgebrochen. Jemand hat sie mit einem Schlüssel geöffnet.',find:'tuer'},
              {id:'wiese',ic:'🌿',n:'Wiese hinter dem Lager',txt:'Im weichen Boden siehst du tiefe, grosse Abdrücke von Stiefeln. Du misst nach: Schuhgrösse 46.',find:'fuss'},
              {id:'buero',ic:'📋',n:'Direktionsbüro',txt:'An der Wand hängt die Schlüsselliste. Nur zwei Namen stehen bei «Lager»: Lena und Paul.',find:'liste'}],
      sus:[{id:'lena',ic:'👩‍🌾',n:'Lena',b:'Tierpflegerin · Schuhgrösse 38',talk:'«Ich habe heute die Elefanten gewaschen. Mit dem Sack habe ich nichts zu tun!»'},
           {id:'tom',ic:'👨‍🍳',n:'Tom',b:'Koch · Schuhgrösse 46',talk:'«Ich koche nur. Einen Lagerschlüssel habe ich nicht – frag den Direktor!»'},
           {id:'max',ic:'🧒',n:'Max',b:'Besucherkind · Schuhgrösse 32',talk:'«Ich bin erst 9! Ich war die ganze Zeit bei den Affen.»'},
           {id:'paul',ic:'🧑‍🔧',n:'Paul',b:'Hausmeister · Schuhgrösse 46',talk:'«Ich habe den ganzen Tag den Zaun repariert. Meine Stiefel? Ja, Grösse 46.»',conf:{need:'liste',txt:'Paul schluckt. «Na gut, den Schlüssel habe ich … aber das heisst gar nichts!»'}}],
      culprit:'paul',why:['Nur Paul hat einen Lagerschlüssel und Schuhgrösse 46.','Tom hat am lautesten gestritten.','Max stand die ganze Zeit neben dem Lager.'],
      hint:'Wer hat einen Schlüssel UND grosse Füsse?',
      end:'Paul gesteht: Er wollte den Sack für sein Pony. Der Sack kommt zurück zu den Elefanten – gut gemacht, Detektiv!',
      rew:[{k:'money',m:2,min:10},{k:'pct',p:1}]},
     {id:'c2',lvl:1,ic:'🥚',t:'Das verschwundene Pinguin-Ei',
      intro:'Das kostbare Pinguin-Ei ist zwischen 14:10 und 14:25 Uhr aus der Brutstation verschwunden. Wer hatte in dieser Zeit kein Alibi?',
      clues:{zeit:['⏰','Das Ei ist zwischen 14:10 und 14:25 Uhr verschwunden.'],foto:['📸','Mias Fotos mit Zeitstempel: 14:10, 14:15 und 14:20 am Eingang.'],plan:['📅','Ben fütterte 14:00–14:45 die Pinguine vor Publikum. Dr. Rosa untersuchte um 14:15 ein Zebra (Protokoll).'],kasse:['🧾','Die Eis-Kasse zeigt: Verkauf um 14:08, dann erst wieder um 14:27.']},
      places:[{id:'brut',ic:'🥚',n:'Brutstation',txt:'Die Wärmelampe brennt noch. Am leeren Nest klebt ein Zettel: «Ei weg um 14:10–14:25».',find:'zeit'},
              {id:'foto',ic:'📸',n:'Foto-Wand am Eingang',txt:'Mia hat den Eingang fotografiert. Die Zeitstempel: 14:10, 14:15, 14:20 – sie war die ganze Zeit dort.',find:'foto'},
              {id:'plan',ic:'📅',n:'Tagesplan',txt:'Ben fütterte von 14:00 bis 14:45 die Pinguine – vor vielen Zuschauern. Und Dr. Rosa untersuchte um 14:15 ein Zebra im Tierhaus.',find:'plan'},
              {id:'eis',ic:'🍦',n:'Eisstand',txt:'Du schaust auf den Kassenzettel: Letzter Verkauf um 14:08, der nächste erst um 14:27. Dazwischen war niemand am Stand!',need:'zeit',find:'kasse'}],
      sus:[{id:'ben',ic:'🐧',n:'Ben',b:'Pinguin-Pfleger',talk:'«Ich war bei der Fütterung. Fast 100 Leute haben mir zugeschaut.»'},
           {id:'mia',ic:'📷',n:'Mia',b:'Fotografin',talk:'«Ich fotografiere am Eingang. Meine Bilder haben alle einen Zeitstempel.»'},
           {id:'ali',ic:'🍦',n:'Ali',b:'Eisverkäufer',talk:'«Ich habe den ganzen Nachmittag Eis verkauft!»',conf:{need:'kasse',txt:'Ali schaut weg. «Äh … ich hatte kurz Pause. Aber ich war es nicht!»'}},
           {id:'rosa',ic:'🩺',n:'Dr. Rosa',b:'Tierärztin',talk:'«Um 14:15 untersuchte ich ein Zebra. Das steht im Protokoll.»'}],
      culprit:'ali',why:['Er hat als Einziger kein Alibi zwischen 14:10 und 14:25.','Er hat die meisten Eis verkauft.','Er stand neben den Pinguinen.'],
      hint:'Wer hatte zwischen 14:10 und 14:25 kein Alibi?',
      end:'Ali hatte das Ei nur „zum Aufwärmen“ mitgenommen. Es ist wieder im Nest. Super Arbeit!',
      rew:[{k:'luck',m:2,min:15},{k:'pct',p:1}]},
     {id:'c3',lvl:2,ic:'🔐',t:'Der geheime Safe',
      intro:'Im Büro des Direktors steht ein Safe. Jemand hat einen Drohbrief hinterlassen. Öffne den Safe, finde den Brief und überführe den Schreiber. Tipp: Der Safe-Code steht irgendwo im Zoo.',
      clues:{z3:['3️⃣','Elefantenhaus: «Hier leben 3 Elefanten.»'],z5:['5️⃣','Giraffenhof: «Hier leben 5 Giraffen.»'],z8:['8️⃣','Zebra-Wiese: «Hier leben 8 Zebras.»'],brief:['✉️','Der Drohbrief: Die Tinte ist nach rechts verschmiert – so schreibt nur ein Linkshänder.'],links:['🍴','In der Kantine hält nur Fritz die Gabel in der linken Hand.']},
      places:[{id:'ele',ic:'🐘',n:'Elefantenhaus',txt:'Am Schild steht: «Hier leben 3 Elefanten.»',find:'z3'},
              {id:'gir',ic:'🦒',n:'Giraffenhof',txt:'Am Schild steht: «Hier leben 5 Giraffen.»',find:'z5'},
              {id:'zeb',ic:'🦓',n:'Zebra-Wiese',txt:'Am Schild steht: «Hier leben 8 Zebras.»',find:'z8'},
              {id:'safe',ic:'🔐',n:'Safe im Büro',txt:'Ein Zahlenschloss mit 3 Ziffern. Auf einem Zettel: «Elefanten, Giraffen, Zebras – in dieser Reihenfolge.»',puz:{q:'Wie lautet der 3-stellige Code?',a:['358'],tip:'Zähle die Tiere auf den Schildern: erst Elefanten, dann Giraffen, dann Zebras.'},find:'brief',solved:'Klick! Der Safe geht auf. Du findest den Drohbrief. Die Tinte ist nach rechts verschmiert – so schreibt nur ein Linkshänder.'},
              {id:'kant',ic:'🍽️',n:'Kantine',txt:'Du beobachtest, wer wie isst: Fritz hält die Gabel in der linken Hand. Nora, Ivo und Uta essen alle mit rechts.',need:'brief',find:'links'}],
      sus:[{id:'fritz',ic:'🧑‍💼',n:'Fritz',b:'Kassierer',talk:'«Ich zähle den ganzen Tag Münzen. Briefe schreibe ich nie!»',conf:{need:'links',txt:'Fritz wird rot. «Na ja … ich bin Linkshänder. Aber das beweist doch nichts!»'}},
           {id:'nora',ic:'👩‍🍳',n:'Nora',b:'Köchin',talk:'«Ich koche, keine Zeit für Briefe.»'},
           {id:'ivo',ic:'🧑‍🎤',n:'Ivo',b:'Musiker',talk:'«Ich spiele Gitarre in der Pause – rechtshändig, wie alle.»'},
           {id:'uta',ic:'👩‍🔬',n:'Uta',b:'Forscherin',talk:'«Ich habe heute Pinguine gezählt, sonst nichts.»'}],
      culprit:'fritz',why:['Der Brief wurde mit der linken Hand geschrieben – und nur Fritz ist Linkshänder.','Fritz trug heute einen Hut.','Nora hat am wenigsten gelacht.'],
      hint:'Der Safe-Code steht auf drei Schildern: 3 · 5 · 8.',
      end:'Fritz gibt zu, dass er den Direktor ärgern wollte. Er entschuldigt sich. Fall gelöst!',
      rew:[{k:'money',m:3,min:10},{k:'pct',p:2}]},
     {id:'c4',lvl:2,ic:'🚧',t:'Wer hat das Tor offen gelassen?',
      intro:'Nachts war das Haupttor offen und ein Pony ist ausgebüxt! Zum Glück ist nichts passiert. Aber: Wer hat das Tor nicht richtig geschlossen?',
      clues:{riegel:['🔩','Das Schloss am Haupttor ist ganz – nur der Riegel wurde nicht vorgeschoben.'],pony:['🐴','Hufspuren: Das Pony kam raus, aber Tiere können keine Riegel öffnen.'],log:['📖','Logbuch: Das Haupttor wurde um 17:00 zuletzt von «J.» zugemacht – aber nicht verriegelt.'],zettel:['📝','In Jonas’ Spind: ein halber Burger und ein Zettel: «Pause! Tor später zuriegeln.»']},
      places:[{id:'tor',ic:'🚧',n:'Haupttor',txt:'Das Schloss ist völlig in Ordnung. Nur der Riegel war nicht vorgeschoben.',find:'riegel'},
              {id:'weg',ic:'🌳',n:'Weg ausserhalb',txt:'Du findest Hufspuren. Das Pony ist hinausgelaufen – aber ein Pony kann keinen Riegel öffnen.',find:'pony'},
              {id:'log',ic:'📖',n:'Logbuch am Pförtnerhaus',txt:'Das Logbuch ist mit einem Zahlenschloss gesichert. Auf dem Deckel steht die Reihe: 2, 4, 8, 16, ?',puz:{q:'Welche Zahl kommt als Nächstes?',a:['32'],tip:'Jede Zahl ist doppelt so gross wie die davor.'},find:'log',solved:'Das Schloss springt auf! Im Logbuch steht: Das Tor wurde um 17:00 zuletzt von «J.» zugemacht – aber nicht verriegelt.'},
              {id:'spind',ic:'🧥',n:'Umkleide',txt:'In Jonas’ Spind liegt ein halber Burger und ein Zettel: «Pause! Tor später zuriegeln.»',need:'log',find:'zettel'}],
      sus:[{id:'jonas',ic:'🧑‍🎓',n:'Jonas',b:'Praktikant (J.)',talk:'«Ich habe das Tor zugemacht, wie immer. Ganz bestimmt!»',conf:{need:'zettel',txt:'Jonas wird bleich. «Okay … ich wollte nur schnell Pause machen und es später verriegeln. Dann habe ich es vergessen.»'}},
           {id:'gisela',ic:'👵',n:'Gisela',b:'Kassiererin (G.)',talk:'«Ich schliesse nur die Kasse. Am Tor habe ich nichts zu tun.»'},
           {id:'karl',ic:'🧔',n:'Karl',b:'Nachtwächter (K.)',talk:'«Ich komme erst um 21 Uhr. Da war das Tor schon offen.»'},
           {id:'sara',ic:'👩‍⚕️',n:'Sara',b:'Tierärztin (S.)',talk:'«Ich war bis 18 Uhr bei den Kängurus.»'}],
      culprit:'jonas',why:['Im Logbuch steht «J.», und Jonas hat einen Zettel, dass er das Tor später verriegeln wollte.','Karl hat nachts immer das Tor offen gelassen.','Gisela hat das Tor vorher geöffnet.'],
      hint:'Das Logbuch nennt nur einen Buchstaben. Wer passt dazu?',
      end:'Jonas verspricht, nie wieder das Verriegeln zu vergessen. Das Pony ist zurück im Stall. Fall gelöst!',
      rew:[{k:'visitor',m:3,min:15},{k:'pct',p:2}]},
     {id:'c5',lvl:3,ic:'🧩',t:'Das Rätsel des Direktors',
      intro:'Der Direktor hat dir eine Nachricht hinterlassen: «Mein goldener Schlüssel ist weg! Drei Rätsel führen zum Dieb. Löse sie alle.» Die Antworten sind drei Tiere.',
      clues:{rG:['🅖','Rätsel 1 gelöst: GIRAFFE – der Anfangsbuchstabe ist G.'],rI:['🅘','Rätsel 2 gelöst: IGEL – der Anfangsbuchstabe ist I.'],rL:['🅛','Rätsel 3 gelöst: LÖWE – der Anfangsbuchstabe ist L.'],name:['🪧','Die drei Anfangsbuchstaben G · I · L ergeben das Wort GIL – wie der Gärtner!']},
      places:[{id:'r1',ic:'🧩',n:'Rätsel 1 (Giraffenhaus)',txt:'Ein Zettel hängt am Tor: «Ich habe einen sehr langen Hals und Flecken. Ich fresse Blätter hoch oben im Baum.»',puz:{q:'Welches Tier bin ich?',a:['giraffe'],tip:'Ein Tier mit ganz langem Hals und Flecken.'},find:'rG',solved:'Richtig! GIRAFFE – der erste Buchstabe ist G.'},
              {id:'r2',ic:'🧩',n:'Rätsel 2 (Wald)',txt:'Ein Zettel am Baum: «Ich habe Stacheln, rolle mich zusammen und schlafe im Winter.»',puz:{q:'Welches Tier bin ich?',a:['igel'],tip:'Er hat Stacheln und rollt sich zur Kugel.'},find:'rI',solved:'Richtig! IGEL – der erste Buchstabe ist I.'},
              {id:'r3',ic:'🧩',n:'Rätsel 3 (Savanne)',txt:'Ein Zettel am Felsen: «Ich bin der König der Tiere, habe eine Mähne und brülle laut.»',puz:{q:'Welches Tier bin ich?',a:['loewe','lowe'],tip:'Der König der Tiere – er brüllt.'},find:'rL',solved:'Richtig! LÖWE – der erste Buchstabe ist L.'},
              {id:'tafel',ic:'🪧',n:'Tafel beim Direktor',txt:'Auf der Tafel steht: «Schreibe die Anfangsbuchstaben deiner drei Lösungen nacheinander auf.» Du schreibst G … I … L. Das Wort heisst GIL!',need:['rG','rI','rL'],find:'name'}],
      sus:[{id:'gil',ic:'🧑‍🌾',n:'Gil',b:'Gärtner',talk:'«Ich habe heute nur Blumen gegossen. Den Schlüssel habe ich nie gesehen!»',conf:{need:'name',txt:'Gil lächelt verlegen. «Hm … du hast mein Rätsel gelöst. Ich wollte wissen, ob jemand schlau genug ist!»'}},
           {id:'kim',ic:'🧑‍🔧',n:'Kim',b:'Mechanikerin',talk:'«Ich repariere die Bahn. Mit Schlüsseln habe ich nichts zu tun.»'},
           {id:'ole',ic:'🧔',n:'Ole',b:'Wächter',talk:'«Ich war am Tor. Mir ist nichts aufgefallen.»'},
           {id:'uta',ic:'👩‍🏫',n:'Uta',b:'Lehrerin',talk:'«Ich führe Schulklassen durch den Zoo. Ich war den ganzen Tag unterwegs.»'}],
      culprit:'gil',why:['Die Anfangsbuchstaben der drei Lösungen ergeben den Namen GIL.','Gil hat sich im Garten verspätet.','Kim ist die Einzige mit einem Schlüssel.'],
      hint:'Schreibe die ersten Buchstaben der drei Rätsel-Lösungen auf.',
      end:'Gil hatte den Schlüssel nur versteckt, um ein Rätsel-Spiel zu machen. Der Direktor lacht und gibt dir den goldenen Schlüssel als Dank. Meisterdetektiv!',
      rew:[{k:'money',m:5,min:15},{k:'luck',m:3,min:15},{k:'pct',p:5}]}
    ];
    D.cases=CASES;
    // ═══════ Spielstand ═══════
    const st=()=>{ const z=zoo(); return z.det||(z.det={done:{},prog:{}}); };
    const pr=id=>{ const s=st(); return s.prog[id]||(s.prog[id]={found:[],talked:[],solved:[],mist:0,seen:[]}); };
    const unlocked=i=>i===0||!!st().done[CASES[i-1].id];
    const has=(p,need)=>!need||[].concat(need).every(n=>p.found.includes(n));
    // ═══════ Oberfläche ═══════
    const shell=()=>{ let o=$('zd-ov'); if(o) return o; o=document.createElement('div'); o.id='zd-ov'; o.style.cssText='position:fixed;inset:0;z-index:800;background:rgba(0,0,0,.82);display:flex;align-items:center;justify-content:center;padding:10px;font-family:Arial,sans-serif'; o.onclick=e=>{ if(e.target===o) o.remove(); }; o.innerHTML='<div id="zd-box" style="background:linear-gradient(160deg,#3e2c1c,#2a1d12);border:3px solid #c9a24b;border-radius:16px;padding:14px;max-width:480px;width:100%;max-height:94vh;overflow-y:auto;color:#f5e9d0"></div>'; document.body.appendChild(o); return o; };
    const box=()=>{ shell(); return $('zd-box'); };
    const btn=(id,t,c)=>'<button id="'+id+'" style="width:100%;padding:11px;border:none;border-radius:12px;font:900 .9rem Arial;color:#fff;margin-top:8px;cursor:pointer;background:'+(c||'linear-gradient(135deg,#8d6e3f,#5d4524)')+'">'+t+'</button>';
    const head=(t,back)=>'<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">'+(back?'<button id="zd-back" style="border:none;background:rgba(255,255,255,.15);color:#fff;border-radius:8px;padding:6px 10px;font-weight:900">◀</button>':'')+'<div style="flex:1;font:900 1.08rem Arial;color:#ffd54f">'+t+'</div><button id="zd-x" style="border:none;background:rgba(255,255,255,.15);color:#fff;border-radius:8px;width:30px;height:30px;font-size:1rem">✕</button></div>';
    const bindX=()=>{ const x=$('zd-x'); if(x) x.onclick=()=>{ const o=$('zd-ov'); if(o) o.remove(); }; };
    D.list=function(){ const b=box(); const s=st(); const dn=Object.keys(s.done).length;
      b.innerHTML=head('🕵️ Detektiv-Fälle')+'<div style="font-size:.78rem;opacity:.85;margin-bottom:8px">Löse Fälle ganz allein: Erkunde Orte, löse Rätsel, befrage Verdächtige und klage den Täter an. Gelöst: <b>'+dn+'/'+CASES.length+'</b></div>'
        +CASES.map((c,i)=>{ const open=unlocked(i), done=!!s.done[c.id]; return '<div data-i="'+i+'" style="display:flex;align-items:center;gap:10px;background:rgba(0,0,0,.25);border:2px solid '+(done?'#7dffb0':open?'#c9a24b':'#555')+';border-radius:12px;padding:10px;margin-bottom:7px;'+(open?'cursor:pointer':'opacity:.5')+'"><div style="font-size:1.8rem">'+(open?c.ic:'🔒')+'</div><div style="flex:1"><div style="font-weight:900;font-size:.9rem">'+(i+1)+'. '+esc(c.t)+'</div><div style="font-size:.7rem;opacity:.8">'+'⭐'.repeat(c.lvl)+' · '+(done?'✅ gelöst':open?'▶ offen':'Löse erst Fall '+i)+'</div></div></div>'; }).join('');
      bindX(); b.querySelectorAll('[data-i]').forEach(e=>{ const i=+e.dataset.i; if(unlocked(i)) e.onclick=()=>D.open(i); else e.onclick=()=>toast('🔒 Löse erst den vorherigen Fall!'); }); };
    D.open=function(i,tab){ const c=CASES[i], p=pr(c.id), b=box(); tab=tab||'places'; const done=!!st().done[c.id];
      const tabs=[['places','📍 Orte'],['sus','🗣️ Verdächtige'],['book','📒 Notizbuch ('+p.found.length+'/'+Object.keys(c.clues).length+')'],['acc','⚖️ Anklage']];
      let body='';
      if(tab==='places') body=c.places.map((pl,k)=>{ const ok=has(p,pl.need), seen=p.seen.includes(pl.id), solved=p.solved.includes(pl.id); return '<div data-p="'+k+'" style="display:flex;align-items:center;gap:10px;background:rgba(0,0,0,.25);border:2px solid '+(ok?(seen||solved?'#7dffb0':'#c9a24b'):'#555')+';border-radius:12px;padding:9px;margin-bottom:6px;cursor:pointer"><div style="font-size:1.6rem">'+(ok?pl.ic:'🔒')+'</div><div style="flex:1"><b style="font-size:.88rem">'+esc(ok?pl.n:'???')+'</b><div style="font-size:.68rem;opacity:.75">'+(ok?(seen||solved?(pl.puz&&!solved?'🧩 Rätsel offen':'✔ untersucht'):'neu'):'Dir fehlt noch ein Hinweis')+'</div></div></div>'; }).join('');
      else if(tab==='sus') body=c.sus.map((s,k)=>{ const talked=p.talked.includes(s.id); let t=''; if(talked){ t='<div style="margin-top:6px;font-size:.82rem;background:rgba(0,0,0,.25);border-radius:8px;padding:7px">'+esc(s.talk)+'</div>'; if(s.conf&&p.found.includes(s.conf.need)) t+='<div style="margin-top:5px;font-size:.82rem;background:rgba(255,213,79,.15);border:1px solid #c9a24b;border-radius:8px;padding:7px">🔎 Du zeigst deinen Hinweis: '+esc(s.conf.txt)+'</div>'; } return '<div style="background:rgba(0,0,0,.2);border-radius:12px;padding:9px;margin-bottom:6px"><div style="display:flex;align-items:center;gap:10px"><div style="font-size:1.8rem">'+s.ic+'</div><div style="flex:1"><b>'+esc(s.n)+'</b><div style="font-size:.7rem;opacity:.75">'+esc(s.b)+'</div></div><button data-s="'+k+'" style="border:none;border-radius:8px;padding:6px 10px;background:#8d6e3f;color:#fff;font-weight:900;font-size:.75rem">'+(talked?'🔁 Nochmal':'🗣️ Befragen')+'</button></div>'+t+'</div>'; }).join('');
      else if(tab==='book') body=p.found.length?p.found.map(k=>'<div style="display:flex;gap:10px;align-items:center;background:rgba(0,0,0,.25);border-radius:10px;padding:8px;margin-bottom:5px"><div style="font-size:1.5rem">'+c.clues[k][0]+'</div><div style="font-size:.82rem">'+esc(c.clues[k][1])+'</div></div>').join(''):'<div style="opacity:.7;padding:10px">Noch keine Hinweise. Besuche die Orte!</div>';
      else body=done?'<div style="padding:10px;text-align:center">✅ <b>Fall gelöst!</b><div style="font-size:.85rem;margin-top:6px">'+esc(c.end)+'</div></div>':'<div style="font-size:.8rem;margin-bottom:6px">Wer ist der Täter? Wähle einen Verdächtigen. Danach musst du begründen, warum.</div>'+c.sus.map((s,k)=>'<div data-a="'+k+'" style="display:flex;align-items:center;gap:10px;background:rgba(0,0,0,.25);border:2px solid #c9a24b;border-radius:12px;padding:9px;margin-bottom:6px;cursor:pointer"><div style="font-size:1.6rem">'+s.ic+'</div><b>'+esc(s.n)+'</b><span style="flex:1"></span><span style="font-size:.75rem;opacity:.8">⚖️ Anklagen</span></div>').join('')+(p.mist?'<div style="font-size:.72rem;opacity:.7;margin-top:4px">Fehlversuche: '+p.mist+'</div>':'')+(p.mist>=2?'<div style="margin-top:6px;font-size:.8rem;background:rgba(255,213,79,.15);border-radius:8px;padding:7px">💡 Tipp: '+esc(c.hint)+'</div>':'');
      b.innerHTML=head(c.ic+' '+esc(c.t),true)+(tab==='places'?'<div style="font-size:.78rem;opacity:.9;margin-bottom:8px">'+esc(c.intro)+'</div>':'')+'<div style="display:flex;gap:4px;margin-bottom:8px;flex-wrap:wrap">'+tabs.map(t=>'<button data-t="'+t[0]+'" style="flex:1;border:none;border-radius:8px;padding:7px 4px;font-size:.72rem;font-weight:900;color:#fff;background:'+(t[0]===tab?'#c9a24b':'rgba(255,255,255,.12)')+(t[0]===tab?';color:#000':'')+'">'+t[1]+'</button>').join('')+'</div>'+body;
      bindX(); $('zd-back').onclick=()=>D.list(); b.querySelectorAll('[data-t]').forEach(e=>e.onclick=()=>D.open(i,e.dataset.t));
      b.querySelectorAll('[data-p]').forEach(e=>e.onclick=()=>{ const pl=c.places[+e.dataset.p]; if(!has(p,pl.need)) return toast('🔒 Dir fehlt noch ein Hinweis aus einem anderen Ort.'); D.place(i,+e.dataset.p); });
      b.querySelectorAll('[data-s]').forEach(e=>e.onclick=()=>{ const s=c.sus[+e.dataset.s]; if(!p.talked.includes(s.id)){ p.talked.push(s.id); save(); } D.open(i,'sus'); });
      b.querySelectorAll('[data-a]').forEach(e=>e.onclick=()=>D.accuse(i,+e.dataset.a)); };
    const addClue=(c,p,k)=>{ if(k&&!p.found.includes(k)){ p.found.push(k); save(); toast('🔎 Neuer Hinweis im Notizbuch!',2500); return true; } return false; };
    D.place=function(i,k){ const c=CASES[i], pl=c.places[k], p=pr(c.id), b=box(); const solved=p.solved.includes(pl.id); let extra='', msg='';
      if(!pl.puz){ if(!p.seen.includes(pl.id)){ p.seen.push(pl.id); addClue(c,p,pl.find); save(); } }
      else if(!solved) extra='<div style="margin-top:8px;font-weight:900">🧩 '+esc(pl.puz.q)+'</div><input id="zd-ans" placeholder="Deine Antwort" style="width:100%;box-sizing:border-box;padding:10px;border-radius:10px;border:none;font-size:1rem;margin-top:6px">'+btn('zd-chk','✅ Prüfen','linear-gradient(135deg,#43a047,#1b5e20)')+btn('zd-tip','💡 Tipp','rgba(255,255,255,.15)')+'<div id="zd-msg" style="margin-top:6px;font-size:.82rem"></div>';
      else extra='<div style="margin-top:8px;color:#7dffb0">✔ Gelöst. '+esc(pl.solved||'')+'</div>';
      const cl=pl.find&&p.found.includes(pl.find)?'<div style="margin-top:8px;background:rgba(255,213,79,.15);border:1px solid #c9a24b;border-radius:10px;padding:8px;font-size:.82rem">'+c.clues[pl.find][0]+' <b>Hinweis:</b> '+esc(c.clues[pl.find][1])+'</div>':'';
      b.innerHTML=head(pl.ic+' '+esc(pl.n),true)+'<div style="font-size:.9rem;line-height:1.45;background:rgba(0,0,0,.25);border-radius:10px;padding:10px">'+esc(pl.txt)+'</div>'+cl+extra; bindX(); $('zd-back').onclick=()=>D.open(i,'places');
      if(pl.puz&&!solved){ const go=()=>{ const v=norm($('zd-ans').value); if(!v) return; if(pl.puz.a.some(a=>norm(a)===v)){ p.solved.push(pl.id); p.seen.push(pl.id); addClue(c,p,pl.find); save(); try{ ZGfx.confetti(60); }catch(e){} D.place(i,k); toast('🎉 '+(pl.solved||'Richtig!'),4500); } else { $('zd-msg').textContent='❌ Leider falsch. Versuch es nochmal!'; $('zd-msg').style.color='#ff8a80'; } }; $('zd-chk').onclick=go; $('zd-ans').onkeydown=e=>{ if(e.key==='Enter') go(); }; $('zd-tip').onclick=()=>{ $('zd-msg').textContent='💡 '+pl.puz.tip; $('zd-msg').style.color='#ffd54f'; }; } };
    const shuffle=a=>{ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
    D.accuse=function(i,k){ const c=CASES[i], s=c.sus[k], p=pr(c.id), b=box();
      if(s.id!==c.culprit){ p.mist++; save(); toast('❌ '+s.n+' ist nicht der Täter! Schau dir die Hinweise nochmal an.',4000); return D.open(i,'acc'); }
      const opts=shuffle(c.why.map((t,q)=>({t,ok:q===0})));
      b.innerHTML=head('⚖️ Anklage: '+s.ic+' '+esc(s.n),true)+'<div style="font-size:.9rem;margin-bottom:8px">Warum ist <b>'+esc(s.n)+'</b> der Täter? Wähle die richtige Begründung:</div>'+opts.map((o,q)=>'<div data-o="'+q+'" style="background:rgba(0,0,0,.25);border:2px solid #c9a24b;border-radius:12px;padding:10px;margin-bottom:6px;cursor:pointer;font-size:.88rem">'+esc(o.t)+'</div>').join(''); bindX(); $('zd-back').onclick=()=>D.open(i,'acc');
      b.querySelectorAll('[data-o]').forEach(e=>e.onclick=()=>{ if(!opts[+e.dataset.o].ok){ p.mist++; save(); toast('❌ Diese Begründung passt nicht. Denk nochmal nach!',3500); return D.open(i,'acc'); } D.win(i); }); };
    const rewTxt=r=>r.k==='pct'?'💵 +'+r.p+'% deines Geldes':({money:'💰 Geld',visitor:'👥 Besucher',luck:'🍀 Glück'}[r.k])+' ×'+r.m+' für '+r.min+' Min';
    D.win=function(i){ const c=CASES[i], z=zoo(), s=st(), first=!s.done[c.id]; if(first){ s.done[c.id]=Date.now(); c.rew.forEach(r=>{ if(r.k==='pct'){ const add=Math.round((z.mt||0)*r.p)/100; z.mt=(z.mt||0)+add; z.te=(z.te||0)+add; } else { try{ ZTread.tBoost(r.k,r.m,r.min); }catch(e){} } }); try{ MTPass.addXP(40*c.lvl,'Detektiv-Fall'); }catch(e){} save(); try{ ZG._updHUD&&ZG._updHUD(); }catch(e){} }
      try{ ZGfx.confetti(180); }catch(e){} const b=box(); b.innerHTML=head('🎉 Fall gelöst!')+'<div style="text-align:center"><div style="font-size:3rem">'+c.ic+'</div><div style="font:900 1.1rem Arial;color:#7dffb0;margin:4px 0">'+esc(c.t)+'</div><div style="font-size:.9rem;line-height:1.45;background:rgba(0,0,0,.25);border-radius:10px;padding:10px;margin:8px 0">'+esc(c.end)+'</div>'+(first?'<div style="font-weight:900;color:#ffd54f">🎁 Belohnung</div>'+c.rew.map(r=>'<div style="margin-top:3px">'+rewTxt(r)+'</div>').join(''):'<div style="opacity:.7;font-size:.8rem">Belohnung hast du schon bekommen.</div>')+'</div>'+btn('zd-ok','Weiter',i+1<CASES.length?'linear-gradient(135deg,#43a047,#1b5e20)':null); bindX(); $('zd-ok').onclick=()=>D.list(); };
    // ═══════ Knopf ═══════
    const mb=document.createElement('button'); mb.id='zd-fab'; mb.textContent='🕵️'; mb.title='Detektiv-Fälle'; mb.style.cssText='position:fixed;left:288px;bottom:12px;z-index:127;width:40px;height:40px;border-radius:50%;border:2px solid #fff;background:rgba(80,55,20,.9);color:#fff;font-size:1.2rem;box-shadow:0 2px 8px rgba(0,0,0,.4)'; document.body.appendChild(mb); mb.onclick=()=>D.list();
    setInterval(()=>{ try{ mb.style.display=((window.ZStation&&ZStation.riding)||ZG._liftActive||ZG._arcadeActive)?'none':'block'; }catch(e){} },1000);
  }
  wait();
})();
