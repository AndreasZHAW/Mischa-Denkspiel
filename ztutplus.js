/* ═══ ZTutPlus (v770): Tutorial-Hilfe – Fortschrittsbalken, ❓ „Genauer erklären“ (Bild + Text), 3D-Maskottchen,
   Hilfe bei Stillstand (20 Sek.), Wörter-Erklärer (Glossar) im ganzen Spiel ═══ */
(function(){
  'use strict';
  if(window.ZTutHelp) return;
  const $=id=>document.getElementById(id);
  const H=window.ZTutHelp={};
  const Z=2147483646;

  // ───────── Stile ─────────
  const css=document.createElement('style');
  css.textContent='@keyframes zhTap{0%,100%{transform:translate(0,0)}40%{transform:translate(0,-14px)}60%{transform:translate(0,6px) scale(.9)}}'
   +'@keyframes zhBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}'
   +'@keyframes zhJoy{0%{transform:translate(0,0)}20%{transform:translate(26px,0)}40%{transform:translate(0,-26px)}60%{transform:translate(-26px,0)}80%{transform:translate(0,26px)}100%{transform:translate(0,0)}}'
   +'@keyframes zhScroll{0%{transform:translateY(34px)}60%{transform:translateY(-34px)}100%{transform:translateY(-34px)}}'
   +'@keyframes zhList{0%{transform:translateY(0)}60%,100%{transform:translateY(-40px)}}'
   +'@keyframes zhWalk{0%{transform:translateY(24px);opacity:.3}60%{transform:translateY(-14px);opacity:1}100%{transform:translateY(-14px);opacity:1}}'
   +'@keyframes zhSwipe{0%,100%{transform:translateX(-40px)}50%{transform:translateX(40px)}}'
   +'@keyframes zhPop{0%{transform:scale(.6)}60%{transform:scale(1.15)}100%{transform:scale(1)}}'
   +'.zh-t{border-bottom:2px dotted #ffd54f;cursor:help;pointer-events:auto}'
   +'#tut-overlay[data-stuck="1"] div[style*="tutPulse"]{animation-duration:.45s!important;border-width:5px!important}'
   +'.zh-img{background:rgba(255,255,255,.08);border-radius:16px;padding:12px;margin:8px 0;min-height:96px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;overflow:hidden}'
   +'.zh-row{display:flex;align-items:center;justify-content:center;gap:10px;font-size:2.4rem}'
   +'.zh-cap{font-size:.72rem;opacity:.8}';
  document.head.appendChild(css);

  const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const strip=h=>String(h||'').replace(/<br\s*\/?>/gi,' ').replace(/<[^>]+>/g,'').replace(/&amp;/g,'&');
  const flow=(a,mid,b,c1,c2)=>'<div class="zh-row"><div style="text-align:center"><div>'+a+'</div><div class="zh-cap">'+(c1||'')+'</div></div><div style="font-size:1.6rem;opacity:.8">'+mid+'</div><div style="text-align:center;animation:zhPop 1.6s infinite"><div>'+b+'</div><div class="zh-cap">'+(c2||'')+'</div></div></div>';
  const big=(e,cap)=>'<div class="zh-row" style="animation:zhBob 1.6s infinite;font-size:3.2rem">'+e+'</div><div class="zh-cap">'+(cap||'')+'</div>';

  // ───────── Gesten-Bilder ─────────
  const GEST={
    tap:()=>'<div style="position:relative;width:130px;height:84px"><div style="position:absolute;left:15px;top:16px;width:100px;height:40px;border-radius:12px;background:linear-gradient(135deg,#43a047,#2e7d32);border:2px solid #fff;display:flex;align-items:center;justify-content:center;font:900 .85rem Arial;color:#fff">Knopf</div><div style="position:absolute;left:62px;top:34px;font-size:2.4rem;animation:zhTap 1.3s infinite">👆</div></div><div class="zh-cap">Mit dem Finger kurz auf den Knopf tippen</div>',
    joystick:()=>'<div style="position:relative;width:110px;height:110px;border-radius:50%;background:rgba(255,255,255,.14);border:3px solid rgba(255,255,255,.5)"><div style="position:absolute;left:34px;top:34px;width:42px;height:42px;border-radius:50%;background:#90caf9;animation:zhJoy 4s infinite;display:flex;align-items:center;justify-content:center;font-size:1.4rem">👆</div></div><div class="zh-cap">Finger auf den Kreis legen und in eine Richtung schieben – dein Männchen läuft dorthin</div>',
    scroll:()=>'<div style="position:relative;width:150px;height:96px;overflow:hidden;border-radius:12px;background:rgba(255,255,255,.1)"><div style="animation:zhList 2.4s infinite">'+[1,2,3,4,5,6].map(i=>'<div style="height:22px;margin:6px 10px;border-radius:8px;background:rgba(255,255,255,.28)"></div>').join('')+'</div><div style="position:absolute;right:12px;top:30px;font-size:2.2rem;animation:zhScroll 2.4s infinite">👆</div></div><div class="zh-cap">Finger auf die Liste legen und nach oben wischen – so scrollst du nach unten</div>',
    walk:()=>'<div style="display:flex;align-items:center;gap:18px"><div style="font-size:2.4rem;color:#7dffb0">➡️</div><div style="width:70px;height:96px;position:relative;border-radius:10px;background:rgba(255,255,255,.1)"><div style="position:absolute;left:18px;top:30px;font-size:2.2rem;animation:zhWalk 2s infinite">🚶</div></div></div><div class="zh-cap">Der grosse Pfeil zeigt die Richtung. Zeigt er nach oben, geh geradeaus (Joystick nach oben). Zeigt er seitlich, dreh dich erst dorthin (mit dem Finger über den Bildschirm ziehen)</div>',
    look:()=>'<div style="width:150px;height:70px;position:relative;border-radius:12px;background:rgba(255,255,255,.1);overflow:hidden"><div style="position:absolute;left:55px;top:16px;font-size:2.2rem;animation:zhSwipe 2.2s infinite">👆</div></div><div class="zh-cap">Zum Umschauen: Finger auf den Bildschirm legen und seitlich ziehen</div>'
  };
  const gestFor=s=>{ const a=(s&&s.action)||''; if(a==='move'||a==='meadow') return 'joystick'; if(a==='proximity'||a==='placed'||a==='meadowportal') return 'walk'; if(a.startsWith('seesec')) return 'scroll'; return 'tap'; };

  // ───────── Glossar ─────────
  const G=[];
  const T=(k,re,ic,name,img,text,ex)=>G.push({k,re,ic,name,img,text,ex});
  T('pass',/MT-Pass/,'🎫','MT-Pass',big('🎫','Belohnungs-Karte'),'Eine Karte mit vielen Belohnungen. Je mehr du spielst, desto mehr Felder werden frei – und du holst dir die Geschenke ab.','Wie eine Treuekarte im Laden.');
  T('mt',/Mischataler|\bMT(?![A-Za-zÄÖÜäöü])/,'🪙','Mischataler (MT)',flow('🐾','➜','🪙🪙🪙','Tiere','Geld'),'Das Geld im Spiel. Deine Tiere verdienen es für dich. Damit kaufst du neue Tiere und Extras.','Hast du 100 MT, kannst du etwas kaufen, das 100 MT kostet.');
  T('boost',/Boosts?(?![A-Za-zäöü])/,'🚀','Boost',flow('💰','➜','🚀💰💰','normal','mit Boost'),'Ein Boost ist ein <b>Schub</b>: Für eine bestimmte Zeit verdienst du mehr Geld als sonst. Danach ist alles wieder normal.','„Boost ×2 für 10 Minuten“ heisst: 10 Minuten lang bekommst du doppelt so viel Geld.');
  T('rebirth',/Wiedergeburt|Rebirths?(?![A-Za-zäöü])/,'🔄','Rebirth (Wiedergeburt)',flow('🏠🐾🐾🐾','➜','🏠🐾 💪','vorher','neu, aber stärker'),'Du fängst deinen Zoo noch einmal von vorne an. Dafür bekommst du <b>für immer</b> mehr Einkommen und neue Möglichkeiten.','Wie ein Neustart mit einem dauerhaften Bonus.');
  T('einkommen',/Einkommens?(?![A-Za-zäöü])|Einnahmen/,'💰','Einkommen',flow('👥','➜','💰','Besucher','Geld'),'Das Geld, das du automatisch verdienst, wenn Besucher deine Tiere ansehen.','Je besser deine Tiere, desto mehr Einkommen.');
  T('gehege',/Gehege/,'🏠','Gehege',big('🏠🐾','Hier wohnen deine Tiere'),'Der eingezäunte Platz in deinem Zoo, in dem deine Tiere stehen. Dort verdienen sie dein Geld.','Du trägst ein gekauftes Tier zu deinem Gehege und legst es dort ab.');
  T('gondel',/Gondel(?:station|-Karte)?/,'🚡','Gondel',big('🚡','Hier bekommst du Tiere'),'Die Gondel ist der „Laden“ für Tiere. Du kaufst dort ein Tier, und das Tier kommt zu dir.','Lauf zur Gondelstation, dann tippe irgendwo auf den Bildschirm.');
  T('glueck',/Glücks?(?![A-Za-zäöü])/,'🍀','Glück',flow('🍀','➜','💎','mehr Glück','seltenere Tiere'),'Mit mehr Glück bekommst du <b>öfter seltene, wertvolle Tiere</b>. Glück kostet Mischataler und gilt für eine bestimmte Zeit.','Glück ×2 = seltene Tiere kommen doppelt so oft.');
  T('selten',/Seltenheit|seltene[nr]?(?![A-Za-zäöü])|Legendär\w*/,'💎','Seltenheit',big('⚪ 🔵 🟣 🟡 💎','von normal bis sehr selten'),'Jedes Tier ist normal, selten, episch, legendär … Je seltener, desto mehr Geld bringt es.','Ein legendäres Tier verdient viel mehr als ein normales.');
  T('slap',/Slaps?(?![A-Za-zäöü])|[Ss]lappen/,'✋','Slap',flow('✋','➜','😵','Slap','trifft Spieler'),'Mit einem Slap „klatschst“ du einen anderen Spieler. Der verliert Herzen und lässt sein getragenes Tier fallen. Du musst nichts slappen – es ist optional.','Unten in der Waffen-Leiste wählst du, womit du slappst.');
  T('waffen',/Waffen-Leiste/,'🗡️','Waffen-Leiste',big('✋ ❄️ ✨ 💜 🔥','unten am Bildschirm'),'Die Leiste unten am Bildschirm. Dort wählst du, welchen Slap du benutzen willst.');
  T('herzen',/Herzen|Herz(?![A-Za-zäöü])/,'❤️','Herzen',big('❤️❤️❤️❤️❤️','dein Leben'),'Deine Lebenspunkte. Wirst du getroffen, verlierst du Herzen. Alle 15 Sekunden kommt eines zurück.','Bei 0 Herzen bist du kurz besiegt – das ist nicht schlimm.');
  T('laufband',/Laufbänd\w*|Laufband/,'🏃','Laufband',flow('🏃','➜','⚡','trainieren','schneller laufen'),'Ein Sportgerät. Du trainierst darauf und wirst dadurch <b>schneller</b> beim Laufen und Tragen.');
  T('event',/Events?(?![A-Za-zäöü])/,'🎉','Event',big('🎉⏳','kurze Sonderaktion'),'Eine Sonderaktion, die nur kurze Zeit läuft – oft mit Extra-Belohnungen.');
  T('tick',/Besucher-Tick|Tick(?![A-Za-zäöü])/,'👥','Besucher-Tick',flow('👥','➜','🪙','alle paar Sekunden','Geld'),'Alle paar Sekunden schaut ein Besucher bei deinen Tieren vorbei und lässt Geld da. Das ist ein „Tick“.');
  T('steuer',/Steuern?(?![A-Za-zäöü])/,'🏛️','Steuern',flow('🪙🪙🪙🪙','➜','🪙🪙🪙','100%','80%'),'Wenn du sehr viel Geld hast, will der „Staat“ einen Teil davon. Du kannst zahlen oder gegen eine kleine Gebühr weniger zahlen.');
  T('multi',/×\s?\d+(?:[.,]\d+)?/,'✖️','Mal-Zeichen (×)',flow('💰','×3','💰💰💰','1×','3×'),'„×3“ heisst <b>dreimal so viel</b>. „×1,5“ heisst anderthalb mal so viel.');
  T('joystick',/Joystick/,'🕹️','Joystick',GEST.joystick(),'Der Kreis unten links. Schiebst du den Finger darin, läuft dein Männchen.');
  T('portal',/Portal/,'🌀','Portal',big('🌀','ein magisches Tor'),'Ein Tor, das dich an einen anderen Ort bringt. Lauf einfach hinein.');
  T('shop',/Shop(?![A-Za-zäöü])/,'🛒','Shop',big('🛒','links in der Leiste'),'Der Laden im Spiel. Dort kaufst du Extras: mehr Besucher, mehr Geld, Laufbänder und mehr.');
  T('menue',/Menü(?![A-Za-zäöü])/,'☰','Menü',big('☰','links ganz unten'),'Hier sind Einstellungen, dein Rang und mehr.');
  T('gold',/Gold-Maschine/,'⚗️','Gold-Maschine',flow('🐱','➜','🐱✨','normal','vergoldet'),'Die Maschine macht aus einem deiner Tiere ein <b>vergoldetes</b> Tier. Das verdient mehr Geld.');
  T('leckerli',/Leckerli\w*/,'🍬','Leckerli',flow('🐱🍬','➜','⚡💰','Leckerli','5 Min. schneller'),'Ein Leckerli macht ein Tier 5 Minuten lang glücklich: Es verdient in dieser Zeit doppelt so viel Geld.');
  T('zucht',/Zucht\w*/,'🧬','Zucht-Maschine',flow('🐱 + 🐶','➜','🐾❓','2 Tiere','neues Tier'),'Du stellst zwei Tiere hinein, und es entsteht ein neues Tier.');
  T('base',/Basen?(?![A-Za-zäöü])/,'🏗️','Base',big('🏗️','dein eigenes Haus'),'Ein Gebäude in deinem Zoo, das dir einen Einkommens-Bonus gibt. Du baust es im Shop.');
  T('album',/Sammelalbum|Album/,'📖','Sammelalbum',big('📖','alle Tiere, die du hattest'),'Ein Buch, das zeigt, welche Tiere du schon besessen hast.');
  T('rang',/Ränge?(?![A-Za-zäöü])|Rang(?![A-Za-zäöü])/,'🏅','Rang',big('🏅','steht neben deinem Namen'),'Ein Titel, der über deinem Kopf und neben deinem Namen steht.');
  T('pause',/Wartezeit|Pause(?![A-Za-zäöü])/,'⏳','Wartezeit',big('⏳','kurz warten'),'Nach manchen Aktionen musst du eine Weile warten, bevor du sie wieder benutzen kannst.');
  T('wm',/Wetter-Meister/,'🌦️','Wetter-Meister',flow('☀️🌧️⛈️','➜','💰','Wetter wählen','Geld-Bonus'),'Du wählst 10 Minuten lang das Wetter. Jedes Wetter gibt einen anderen Geld-Bonus.');
  T('roboter',/Pfleger-Roboter|Roboter/,'🤖','Pfleger-Roboter',flow('🤖','➜','🍖🪙','füttert','bringt Münzen'),'Ein kleiner Roboter, der deine Tiere versorgt und dir dabei Münzen bringt. Du kannst ihn verbessern.');
  T('arena',/Tier-Arena|Arena/,'⚔️','Tier-Arena',flow('🐱','⚔️','🐗','dein Tier','Gegner'),'Dein Tier kämpft gegen einen Gegner. Gewinnst du, bekommst du Ruhm und Geld.');
  T('ruhm',/Ruhm/,'🏅','Ruhm',big('🏅','Sieg-Punkte'),'Punkte für gewonnene Kämpfe. Mehr Ruhm = ein besserer Titel.');
  T('insel',/Schatz-Insel/,'🏝️','Schatz-Insel',flow('⛵','➜','🏝️❌💰','Boot','Schatz graben'),'Eine Insel, die du mit dem Boot erreichst. Dort kannst du Schätze ausgraben.');
  T('turm',/Legenden-Turm/,'🗼','Legenden-Turm',big('🗼','50 Stockwerke'),'Ein hoher Turm mit 50 kleinen Aufgaben. Du hast pro Tag einen Versuch.');
  T('zeitung',/Zoo-Zeitung|Zeitung/,'📰','Zoo-Zeitung',big('📰','jeden Tag neu'),'Nachrichten aus deinem Zoo und jeden Tag 3 Aufgaben mit Belohnung.');
  T('kiosk',/Kiosk/,'🍦','Kiosk',flow('🍦','➜','🪙','Eis verkaufen','Extra-Geld'),'Ein Stand mit Eis. Besucher kaufen dort, und du bekommst Extra-Geld.');
  const COMBO=new RegExp(G.map(g=>'(?:'+g.re.source+')').join('|'),'g');
  const find=t=>{ for(const g of G){ if(new RegExp('^(?:'+g.re.source+')$').test(t)) return g; } return null; };
  const findIn=t=>{ for(const g of G){ if(g.re.test(t)) return g; } return null; };
  H.glossary=G;

  // ───────── Popup-Helfer ─────────
  const modal=(id,html,z)=>{ let o=$(id); if(o) o.remove(); o=document.createElement('div'); o.id=id; o.style.cssText='position:fixed;inset:0;z-index:'+(z||Z)+';background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;font-family:Arial,sans-serif;color:#fff';
    o.innerHTML='<div style="width:min(94vw,400px);max-height:92vh;overflow:auto;background:#1b2438;border:3px solid #ffd54f;border-radius:18px;padding:14px;text-align:center">'+html+'</div>';
    o.addEventListener('click',e=>{ if(e.target===o) o.remove(); }); document.body.appendChild(o); return o; };
  const btnS=bg=>'width:100%;padding:11px;margin-top:8px;border:none;border-radius:12px;background:'+bg+';color:#fff;font:900 .95rem Arial;cursor:pointer';
  H.term=function(k){ const g=G.find(x=>x.k===k); if(!g) return; const o=modal('zh-term','<div style="font-size:2.2rem">'+g.ic+'</div><div style="font:900 1.2rem Arial;color:#ffd54f">'+g.name+'</div><div class="zh-img">'+g.img+'</div><div style="text-align:left;font-size:.95rem;line-height:1.5"><b>Einfach gesagt:</b><br>'+g.text+(g.ex?'<br><br><b>Beispiel:</b><br>'+g.ex:'')+'</div><button id="zh-tx" style="'+btnS('#2e7d32')+'">Verstanden 👍</button>');
    $('zh-tx').onclick=()=>o.remove(); };
  H.openAll=function(){ const rows=G.map(g=>'<button data-k="'+g.k+'" style="display:flex;align-items:center;gap:10px;width:100%;margin-top:6px;padding:9px;border:none;border-radius:12px;background:rgba(255,255,255,.1);color:#fff;font:800 .9rem Arial;text-align:left"><span style="font-size:1.6rem">'+g.ic+'</span>'+g.name+'</button>').join('');
    const o=modal('zh-all','<div style="font:900 1.2rem Arial;color:#ffd54f">❓ Was heisst das?</div><div style="font-size:.8rem;opacity:.85;margin:4px 0 6px">Tippe auf ein Wort – ich erkläre es mit Bild und einfachen Worten.</div><input id="zh-q" placeholder="Wort suchen …" style="width:100%;padding:9px;border-radius:10px;border:none;font-size:1rem;box-sizing:border-box"><div id="zh-list">'+rows+'</div><button id="zh-ax" style="'+btnS('rgba(255,255,255,.16)')+'">Schliessen</button>');
    $('zh-ax').onclick=()=>o.remove(); const bind=()=>o.querySelectorAll('button[data-k]').forEach(b=>b.onclick=()=>H.term(b.dataset.k)); bind();
    $('zh-q').oninput=e=>{ const q=e.target.value.toLowerCase(); o.querySelectorAll('button[data-k]').forEach(b=>{ b.style.display=b.textContent.toLowerCase().includes(q)?'flex':'none'; }); }; };

  // ───────── Wörter im Text unterstreichen ─────────
  H.decorate=function(root){ try{ if(!root) return; const seen={}; const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,null); const nodes=[]; let n; while((n=w.nextNode())) nodes.push(n);
    nodes.forEach(tn=>{ const p=tn.parentNode; if(!p||!tn.nodeValue||tn.nodeValue.length<2) return; if(p.closest&&p.closest('button,a,input,textarea,select,script,style,canvas,[onclick],.zh-t,#zh-term,#zh-all,#zh-help')) return;
      COMBO.lastIndex=0; const txt=tn.nodeValue; let m, last=0, out=null; while((m=COMBO.exec(txt))){ const g=find(m[0])||findIn(m[0]); if(!g||seen[g.k]) continue; seen[g.k]=1; out=out||document.createDocumentFragment(); out.appendChild(document.createTextNode(txt.slice(last,m.index))); const sp=document.createElement('span'); sp.className='zh-t'; sp.dataset.k=g.k; sp.textContent=m[0]; sp.onclick=e=>{ e.stopPropagation(); e.preventDefault(); H.term(g.k); }; out.appendChild(sp); last=m.index+m[0].length; }
      if(out){ out.appendChild(document.createTextNode(txt.slice(last))); p.replaceChild(out,tn); } }); }catch(e){ console.warn('ZHelp.decorate',e); } };

  // ───────── Genaue Erklärung pro Schritt ─────────
  const D={
    welcome:['tap','Das ist ein Spiel mit Tieren. Du hast deinen <b>eigenen Zoo</b>. Du kaufst Tiere und stellst sie in dein Gehege. Die Tiere verdienen für dich <b>ganz von allein Geld</b> – auch wenn du gerade nichts machst. Das Geld heisst <b>Mischataler</b> (kurz MT). Damit kaufst du noch bessere Tiere.<br><br>Du kannst nichts kaputt machen. Ich erkläre dir alles in kleinen Schritten.<br><b>Jetzt:</b> Tippe unten im Kasten auf „Los geht’s“.'],
    meadow:['joystick','Du siehst unten links einen <b>Kreis</b> (das ist der Joystick).<br><b>1.</b> Lege einen Finger auf den Kreis.<br><b>2.</b> Schiebe den Finger in eine Richtung, zum Beispiel nach oben – dein Männchen läuft vorwärts.<br><b>3.</b> Probiere alle vier Richtungen: links, rechts, vorne, hinten.<br>Am Computer: die Tasten W, A, S, D.<br>Oben im Kasten siehst du, welche Richtungen schon geschafft sind.'],
    portal:['walk','Ein <b>Portal</b> ist wie eine Tür. In der Mitte des Bildschirms ist ein grosser <b>Pfeil</b>: Er zeigt dir, wo das Portal ist.<br><b>1.</b> Schau, wohin der Pfeil zeigt.<br><b>2.</b> Zeigt er nach rechts, ziehe mit dem Finger auf dem Bildschirm nach rechts, um dich zu drehen.<br><b>3.</b> Zeigt er nach oben, schiebe den Joystick nach oben und laufe los.'],
    gondola:['walk','Die <b>Gondel</b> ist wie ein Laden für Tiere. Der Pfeil zeigt dir den Weg.<br><b>1.</b> Laufe in Pfeilrichtung, bis du bei der Gondelstation bist.<br><b>2.</b> Tippe dann irgendwo auf den Bildschirm. Es öffnet sich ein Fenster mit Tieren zum Kaufen.'],
    gluck:['tap','<b>Glück</b> macht, dass du öfter <b>seltene und wertvolle Tiere</b> bekommst. Es kostet etwas Geld und hält eine Weile.<br>Du musst jetzt <b>nichts kaufen</b>. Lies es einfach und tippe unten im Kasten auf „Los geht’s“.'],
    buy:['tap','Unten siehst du Tiere mit Preisen.<br><b>1.</b> Suche ein Tier aus, das du dir leisten kannst.<br><b>2.</b> Tippe auf den Knopf mit dem Preis. Halte ihn eventuell kurz gedrückt.<br>Das Geld wird abgezogen, und das Tier gehört dir.'],
    carry:['walk','Dein Tier steht jetzt nicht von allein im Zoo – du <b>trägst</b> es auf dem Arm.<br><b>1.</b> Der Pfeil zeigt dir den Weg zu deinem Gehege.<br><b>2.</b> Laufe dorthin.<br><b>3.</b> Tippe auf <b>„ablegen“</b> (am Computer: Taste E). Jetzt verdient das Tier Geld für dich!'],
    shop:['tap','Links am Bildschirmrand ist eine <b>Leiste mit Knöpfen</b>. Der Knopf mit dem Einkaufswagen heisst <b>Shop</b>.<br>Wenn du ihn nicht siehst: Wische mit dem Finger in der Leiste nach oben oder unten – der gelbe Pfeil zeigt dir die Richtung.<br>Tippe dann auf den Knopf.'],
    shopcont:['scroll','Im Shop gibt es viele Extras: mehr Tempo, mehr Besucher, mehr Geld. Wische mit dem Finger nach oben, um nach unten zu scrollen und alles anzusehen. Du musst nichts kaufen. Tippe unten im Kasten auf „Los geht’s“, wenn du fertig bist.'],
    menu:['scroll','Die Knopf-Leiste links ist länger als der Bildschirm. Der Knopf <b>☰ Menü</b> ist ganz am Ende.<br><b>1.</b> Wische in der Leiste nach oben oder unten – der gelbe Pfeil zeigt dir die Richtung.<br><b>2.</b> Sobald du den Menü-Knopf siehst, hat er einen gelben Rahmen. Tippe darauf.'],
    menuinfo:['tap','Hier sind <b>Einstellungen</b> (zum Beispiel Ton) und dein <b>Rang</b>. Schau dich in Ruhe um. Zum Schliessen tippe auf das ✕ oben im Fenster.'],
    events:['tap','Manchmal gibt es kurze Sonderaktionen (Events). Unten rechts erscheint dann ein Kästchen mit einer Zeit. Solche Events geben oft <b>Extra-Geld</b>. Tippe unten im Kasten auf „Los geht’s“.'],
    goldmachine:['walk','Die <b>Gold-Maschine</b> macht aus einem Tier ein goldenes Tier. Es verdient dann mehr Geld. Folge dem Pfeil, bis du ganz nah bist.'],
    goldopen:['tap','Tippe auf die Maschine (am Computer: Taste E), damit sich ihr Fenster öffnet.'],
    goldinfo:['tap','Wähle ein Tier aus und bezahle mit Mischataler. Dann wird es golden und verdient mehr. Schliesse das Fenster mit dem ✕.'],
    slap:['tap','Mit einem <b>Slap</b> kannst du andere Spieler „klatschen“. Das ist <b>freiwillig</b>. Unten ist die Waffen-Leiste. <b>Jetzt:</b> Tippe einmal irgendwo auf den Bildschirm – dann machst du einen Slap.'],
    feeder:['walk','Der <b>Leckerli-Automat</b> macht ein Tier schneller. Folge dem Pfeil bis zum Automaten.'],
    feederopen:['tap','Tippe auf den Automaten (am Computer: Taste E), damit sich sein Fenster öffnet.'],
    feederinfo:['tap','Wähle ein Tier und gib ihm ein Leckerli. Es verdient 5 Minuten lang <b>doppelt so viel</b>. Schliesse das Fenster danach mit dem ✕.'],
    hearts:['tap','Oben siehst du <b>Herzen</b>: Das sind deine Lebenspunkte. Wirst du von einem Slap getroffen, verlierst du Herzen. Alle 15 Sekunden kommt eines zurück. Es ist nicht gefährlich.']
  };
  H.detail=function(){ const T_=window.Tutorial||(typeof Tutorial!=='undefined'?Tutorial:null); if(!T_) return; const s=T_._list()[T_._stepIdx]; if(!s) return;
    const d=D[s.id]; const ge=d?d[0]:gestFor(s); const plain=strip(s.text); const text=d?d[1]:('<b>Einfach gesagt:</b> '+esc(plain)+'<br><br><b>Was tue ich jetzt?</b> '+({tap:'Tippe auf das markierte Feld oder lies es einfach durch und tippe unten im Kasten auf „Los geht’s“.',walk:'Folge dem grossen Pfeil in der Mitte des Bildschirms und laufe in diese Richtung.',joystick:'Benutze den Kreis unten links zum Laufen.',scroll:'Wische mit dem Finger nach oben, um nach unten zu scrollen.'}[ge]||''));
    const chips=[]; G.forEach(g=>{ if(g.re.test(plain+' '+strip(s.title))) chips.push(g); });
    const cs=chips.slice(0,6).map(g=>'<button data-k="'+g.k+'" style="margin:3px;padding:6px 10px;border:none;border-radius:20px;background:rgba(255,213,79,.2);color:#ffd54f;font:800 .78rem Arial">'+g.ic+' '+g.name+'</button>').join('');
    const o=modal('zh-help','<div style="font:900 1.05rem Arial;color:#ffd54f">❓ '+strip(s.title)+'</div><div class="zh-img">'+(GEST[ge]||GEST.tap)()+'</div><div style="text-align:left;font-size:.95rem;line-height:1.55">'+text+'</div>'+(cs?'<div style="margin-top:10px;font-size:.78rem;opacity:.85;text-align:left">Wörter in diesem Schritt – tippe, wenn du eines nicht kennst:</div><div style="text-align:left">'+cs+'</div>':'')+'<button id="zh-hx" style="'+btnS('#2e7d32')+'">Jetzt habe ich es verstanden 👍</button>');
    $('zh-hx').onclick=()=>o.remove(); o.querySelectorAll('button[data-k]').forEach(b=>b.onclick=()=>H.term(b.dataset.k)); };

  // ───────── 3D-Maskottchen ─────────
  const M=H.mascot={r:null,on:false,jump:0,wave:0,t0:performance.now(),bubble:null};
  M.init=function(){ if(M.r||typeof THREE==='undefined') return; try{
    const c=document.createElement('canvas'); c.width=c.height=192; c.style.cssText='position:fixed;width:96px;height:96px;z-index:'+(Z-1)+';pointer-events:auto;cursor:pointer;display:none;left:0;top:0'; document.body.appendChild(c); M.c=c;
    const r=new THREE.WebGLRenderer({canvas:c,alpha:true,antialias:true}); r.setSize(192,192,false); r.setClearColor(0x000000,0); M.r=r;
    const sc=new THREE.Scene(), cam=new THREE.PerspectiveCamera(32,1,.1,50); cam.position.set(0,1.9,8.6); cam.lookAt(0,1.7,0); M.sc=sc; M.cam=cam;
    const mb=col=>new THREE.MeshBasicMaterial({color:col}); const sph=(rad,col,x,y,z,par,sx,sy,sz)=>{ const m=new THREE.Mesh(new THREE.SphereGeometry(rad,16,12),mb(col)); m.position.set(x,y,z); if(sx) m.scale.set(sx,sy,sz); (par||g).add(m); return m; };
    const g=new THREE.Group(); sc.add(g); M.g=g;
    sph(1,0xc98a4b,0,.95,0,g,1,.95,.9); sph(.68,0xffe0b2,0,.85,.62,g,1,1,.6);          // Körper+Bauch
    sph(.85,0xc98a4b,0,2.25,0,g);                                                          // Kopf
    sph(.32,0xc98a4b,-.72,2.95,0,g); sph(.32,0xc98a4b,.72,2.95,0,g); sph(.17,0xf8bbd0,-.72,2.95,.16,g); sph(.17,0xf8bbd0,.72,2.95,.16,g); // Ohren
    M.eyes=[-.33,.33].map(x=>{ const e=new THREE.Group(); e.position.set(x,2.36,.74); g.add(e); sph(.22,0xffffff,0,0,0,e); sph(.11,0x111111,0,0,.17,e); return e; });
    sph(.15,0x3e2723,0,2.12,.84,g,1,.8,.8); sph(.13,0xf48fb1,-.55,2.1,.62,g,1,.7,.5); sph(.13,0xf48fb1,.55,2.1,.62,g,1,.7,.5);
    const hat=new THREE.Mesh(new THREE.ConeGeometry(.78,1.15,16),mb(0xd32f2f)); hat.position.set(.05,3.35,-.05); hat.rotation.z=-.18; g.add(hat); sph(.2,0xffffff,.45,3.8,-.05,g); const br=new THREE.Mesh(new THREE.CylinderGeometry(.82,.82,.2,16),mb(0xffffff)); br.position.set(0,2.95,0); g.add(br);
    sph(.3,0xc98a4b,-1.05,1.0,.1,g); M.arm=new THREE.Group(); M.arm.position.set(.95,1.5,.1); g.add(M.arm); sph(.3,0xc98a4b,0,-.5,0,M.arm,1,1.5,1); // rechter Arm (winkt)
    sph(.35,0xb06f35,-.45,.0,.5,g,1,.6,1.2); sph(.35,0xb06f35,.45,.0,.5,g,1,.6,1.2);
    c.addEventListener('click',()=>{ H.detail(); });
    const bub=document.createElement('div'); bub.style.cssText='position:fixed;z-index:'+(Z-1)+';display:none;max-width:170px;background:#fff;color:#222;border-radius:14px;padding:7px 10px;font:800 .78rem Arial;box-shadow:0 3px 10px rgba(0,0,0,.4);pointer-events:none'; document.body.appendChild(bub); M.bubble=bub;
  }catch(e){ console.warn('mascot',e); M.r=null; } };
  M.say=function(t){ if(!M.bubble) return; M.bubble.textContent=t||''; M.bubble.style.display=t?'block':'none'; };
  M.loop=function(){ if(!M.on) return; requestAnimationFrame(M.loop); try{ const ov=$('tut-overlay'); if(!ov||!(window.Tutorial||Tutorial)._active){ M.hide(); return; }
    const box=[...ov.children].find(e=>/2147483600/.test(e.style.zIndex)); if(box){ const r=box.getBoundingClientRect(); let top=r.top-82; if(top<8) top=r.bottom-10; const left=Math.max(4,Math.min(innerWidth-100,r.left+6)); M.c.style.left=left+'px'; M.c.style.top=top+'px'; if(M.bubble.style.display!=='none'){ M.bubble.style.left=Math.min(innerWidth-180,left+92)+'px'; M.bubble.style.top=(top+14)+'px'; } }
    const t=(performance.now()-M.t0)/1000, g=M.g; let y=Math.sin(t*2.2)*.07; if(M.jump>0){ M.jump-=.035; y+=Math.sin(Math.max(0,M.jump)*Math.PI)*.9; } g.position.y=y; g.rotation.y=Math.sin(t*.9)*.3;
    const bl=(t%3.2)<.12?.1:1; M.eyes.forEach(e=>e.scale.y=bl); M.arm.rotation.z=M.wave?(2.3+Math.sin(t*11)*.45):(.35+Math.sin(t*2)*.05);
    M.r.render(M.sc,M.cam); }catch(e){} };
  M.show=function(){ M.init(); if(!M.r) return; M.c.style.display='block'; M.jump=1; if(!M.on){ M.on=true; M.loop(); } };
  M.hide=function(){ M.on=false; M.wave=0; if(M.c) M.c.style.display='none'; if(M.bubble) M.bubble.style.display='none'; };

  // ───────── Tutorial-Einhängung ─────────
  let stuckT=null;
  const enhance=function(i){ const Tu=Tutorial; const s=Tu._list()[i]; const ov=$('tut-overlay'); if(!ov||!s) return; const box=[...ov.children].find(e=>/2147483600/.test(e.style.zIndex)); if(!box) return;
    // Fortschritt
    const tot=Tu._list().length, pct=Math.round((i+1)/tot*100);
    const pb=document.createElement('div'); pb.style.cssText='margin:-4px 0 8px;pointer-events:none'; pb.innerHTML='<div style="font-size:.68rem;color:rgba(255,255,255,.65);margin-bottom:3px">Schritt '+(i+1)+' von '+tot+'</div><div style="height:6px;border-radius:4px;background:rgba(255,255,255,.18)"><div style="height:100%;width:'+pct+'%;border-radius:4px;background:linear-gradient(90deg,#ffd54f,#7dffb0)"></div></div>'; box.insertBefore(pb,box.firstChild);
    // ❓ Knopf
    const hb=document.createElement('button'); hb.textContent='❓ Genauer erklären (mit Bild)'; hb.style.cssText='display:block;margin:10px auto 0;padding:9px 16px;border:none;border-radius:20px;background:#ffd54f;color:#2a1700;font:900 .8rem Arial;pointer-events:auto;cursor:pointer'; hb.onclick=e=>{ e.stopPropagation(); H.detail(); }; box.appendChild(hb);
    H.decorate(box);
    // Maskottchen + Hilfe bei Stillstand
    M.show(); M.say(''); M.wave=0; if(stuckT) clearTimeout(stuckT);
    if(s.action&&s.action!=='button'){ stuckT=setTimeout(()=>{ try{ if(!Tu._active||Tu._stepIdx!==i) return; const o2=$('tut-overlay'); if(!o2) return; o2.dataset.stuck='1'; M.wave=1; M.say('Brauchst du Hilfe? Tippe mich an! 👆'); }catch(e){} },20000); } };
  const hook=function(){ if(typeof Tutorial==='undefined'||Tutorial._zh) return setTimeout(hook,800); Tutorial._zh=1;
    const o1=Tutorial._showStep; Tutorial._showStep=function(i){ const r=o1.apply(this,arguments); try{ enhance(i); }catch(e){ console.warn('ZHelp enhance',e); } return r; };
    const o2=Tutorial._cleanupStep; Tutorial._cleanupStep=function(){ if(stuckT){ clearTimeout(stuckT); stuckT=null; } const r=o2.apply(this,arguments); try{ if(!Tutorial._active) M.hide(); }catch(e){} return r; }; };
  hook();

  // ───────── Globaler ❓-Knopf + automatische Unterstreichung ─────────
  const ui=()=>{ if($('zh-btn')) return; const b=document.createElement('button'); b.id='zh-btn'; b.textContent='❓'; b.title='Was heisst das?'; b.style.cssText='position:fixed;right:10px;bottom:352px;z-index:129;width:46px;height:46px;border-radius:50%;border:3px solid #fff;font-size:1.4rem;background:linear-gradient(135deg,#29b6f6,#0277bd);color:#fff;box-shadow:0 3px 8px rgba(0,0,0,.4)'; b.onclick=()=>H.openAll(); document.body.appendChild(b); };
  const WATCH=/^(zp-ov|zr6-hubov|zwx-ov|zrob-ov|za-ov|zt-ov|zshop-ov|zr6-ann|zmap-ov)$/;
  const mo=new MutationObserver(ms=>{ ms.forEach(m=>m.addedNodes.forEach(n=>{ if(n.nodeType===1&&WATCH.test(n.id||'')) setTimeout(()=>H.decorate(n),60); })); });
  const boot=()=>{ try{ if(typeof ZS==='undefined'||!ZS.zoo||typeof ZP==='undefined') return setTimeout(boot,1000); ui(); mo.observe(document.body,{childList:true});
    if(!ZP._zh){ ZP._zh=1; const op=ZP.open; ZP.open=function(n){ const r=op.apply(this,arguments); setTimeout(()=>{ try{ H.decorate($('p-'+n)); }catch(e){} },350); return r; }; }
  }catch(e){ setTimeout(boot,1500); } };
  window.addEventListener('load',()=>setTimeout(boot,2000));
})();
