/* ZLang2 (v882): Übersetzungs-Schicht für den Zoo (Englisch / Französisch / Italienisch→Englisch). Ersetzt deutsche Texte live im Bildschirm anhand eines Wörterbuchs.
   Deutsch / Einfaches Deutsch / Jugendsprache bleiben unverändert. Fehlende Texte bleiben deutsch → Wörterbuch D unten einfach erweitern. */
(function(){
  'use strict';
  if(window.ZLang2) return;
  const lang=()=>{ try{ return (window.LANG&&LANG._cur)||localStorage.getItem('mischa_lang')||'de_simple'; }catch(e){ return 'de_simple'; } };
  const target=()=>{ const l=lang(); if(/^de|jug/i.test(l)) return null; return l==='fr'?'fr':'en'; };
  // [Deutsch, Englisch, Französisch]
  const D=[
  // HUD
  ['Ziele','Goals','Objectifs'],['Shop','Shop','Boutique'],['Marktplatz','Market','Marché'],['Reward','Reward','Récompense'],['Sozial ▸','Social ▸','Social ▸'],['Mehr ▸','More ▸','Plus ▸'],
  ['WAFFEN (SLAPS)','WEAPONS (SLAPS)','ARMES (SLAPS)'],['Neutral','Neutral','Neutre'],['Interagieren','Interact','Interagir'],['Dein Platz: Slot','Your spot: slot','Ta place : emplacement'],
  ['Kamera','Camera','Caméra'],['Detektor','Detector','Détecteur'],['Sync-Fehler (antippen)','Sync error (tap)','Erreur de synchro (toucher)'],['Nebel','Fog','Brouillard'],['Menü','Menu','Menu'],['Chat','Chat','Chat'],
  ['Tipps & Tutorial nochmal zeigen','Show tips & tutorial again','Revoir les astuces et le tutoriel'],['Tipps','Tips','Astuces'],
  // Menü
  ['SETTINGS','SETTINGS','PARAMÈTRES'],['Ruhiger Modus','Calm mode','Mode calme'],['Aus','Off','Désactivé'],['An','On','Activé'],['Einfache Steuerung (Pfeile)','Simple controls (arrows)','Commandes simples (flèches)'],
  ['Tageszeiten','Times of day','Moments de la journée'],['-Effekte (fallende Sachen)','effects (falling things)','effets (choses qui tombent)'],['Wetter (wechselt von selbst)','Weather (changes by itself)','Météo (change toute seule)'],
  ['Grafik-Look (Licht, Nebel, Bloom …)','Graphics look (light, fog, bloom …)','Style graphique (lumière, brouillard, bloom …)'],['Grafik-Stufe','Graphics level','Niveau graphique'],['Klassisch','Classic','Classique'],['Normal','Normal','Normal'],['Schön','Pretty','Beau'],
  ['Touch-Gerät','Touch device','Appareil tactile'],['Körnung an','Grain on','Grain activé'],['Sicht','View','Vue'],['Abmelden','Log out','Se déconnecter'],['Welt 1 (Denkspiele)','World 1 (brain games)','Monde 1 (jeux de réflexion)'],
  ['Tiere','Animals','Animaux'],['verdient','earned','gagné'],['Rebirths','Rebirths','Renaissances'],['Gehege','Enclosures','Enclos'],
  // Shop
  ['Zoo-','Zoo ','Zoo '],['Boosts','Boosts','Boosts'],['Slaps','Slaps','Slaps'],['Skins','Skins','Skins'],['Fangnetz','Catch net','Filet'],['Fängt entlaufene Tiere zurück — unbedingt früh kaufen!','Catches escaped animals — buy it early!','Rattrape les animaux échappés — à acheter tôt !'],
  ['Fehlt','Missing','Manque'],['Besucher ×2','Visitors ×2','Visiteurs ×2'],['Besucher ×4','Visitors ×4','Visiteurs ×4'],['Schneller','Faster','Plus vite'],['Noch schneller!','Even faster!','Encore plus vite !'],['Erst vorherigen!','Previous one first!','D’abord le précédent !'],
  ['Doppelt viele','Twice as many','Deux fois plus'],['Einnahmen','Income','Revenus'],['Alle ×2','All ×2','Tout ×2'],['Nochmal ×2!','Another ×2!','Encore ×2 !'],
  ['Rote Turnschuhe','Red sneakers','Baskets rouges'],['Goldene Turnschuhe','Golden sneakers','Baskets dorées'],['Platin-Turnschuhe','Platinum sneakers','Baskets platine'],['Wanderschuhe','Hiking boots','Chaussures de randonnée'],
  ['+50% Laufgeschwindigkeit — tippen für Details','+50% running speed — tap for details','+50 % de vitesse de course — toucher pour les détails'],['Gesperrt','Locked','Verrouillé'],['Erst vorherige Schuhe kaufen!','Buy the previous shoes first!','Achète d’abord les chaussures précédentes !'],
  ['+30% Tragegeschwindigkeit beim Tragen von Tieren — tippen für Details','+30% carrying speed when carrying animals — tap for details','+30 % de vitesse en portant des animaux — toucher pour les détails'],
  ['Kehrmaschinenversicherung','Sweeper insurance','Assurance balayeuse'],['Nie wieder Müll aufheben — tippen für Details','Never pick up litter again — tap for details','Plus jamais de déchets à ramasser — toucher pour les détails'],
  ['Würfel-Maschine Lizenz','Dice machine licence','Licence machine à dés'],['Versicherung','Insurance','Assurance'],['keine Unfallkosten — tippen für Details','no accident costs — tap for details','pas de frais d’accident — toucher pour les détails'],['alle 5 Min','every 5 min','toutes les 5 min'],
  ['Abschliessen','Buy','Souscrire'],['Benötigt:','Needs:','Requis :'],['Öffnen','Open','Ouvrir'],['Code einlösen','Redeem code','Utiliser un code'],['Einlösen','Redeem','Utiliser'],['Rebirth (Stufe','Rebirth (level','Renaissance (niveau'],
  // Index
  ['Tier-Index','Animal index','Index des animaux'],['Zoo-Basis','Zoo base','Base du zoo'],['Goldener Zoo','Golden zoo','Zoo doré'],['Diamant Zoo','Diamond zoo','Zoo diamant'],['Regenbogen Zoo','Rainbow zoo','Zoo arc-en-ciel'],['Void Zoo','Void zoo','Zoo du vide'],['für Basis','for base','pour la base'],
  // Einstieg / Intro / Querformat / Tutorial-Kasten
  ['Überspringen','Skip','Passer'],['Tutorial überspringen','Skip tutorial','Passer le tutoriel'],['Schritt','Step','Étape'],['von','of','sur'],['Los geht’s →','Let’s go →','C’est parti →'],['Genauer erklären (mit Bild)','Explain in detail (with picture)','Expliquer en détail (avec image)'],
  ['Dreh dein Handy','Turn your phone','Tourne ton téléphone'],['Ab hier spielt es sich im','From here on it plays best in','À partir d’ici, c’est mieux en'],['Querformat','landscape','mode paysage'],['am besten.','.','.'],['Querformat starten','Start in landscape','Passer en paysage'],['Lieber Hochformat','Stay in portrait','Rester en portrait'],
  ['Tippe zum Start im Querformat','Tap to start in landscape','Touche pour passer en paysage'],
  ['Tipp: schreib jederzeit','Tip: type anytime','Astuce : écris à tout moment'],['in den Chat, um dieses Tutorial nochmal zu sehen!','in the chat to see this tutorial again!','dans le chat pour revoir ce tutoriel !'],
  ['Mach die Aktion, um weiterzugehen','Do the action to continue','Fais l’action pour continuer'],['Hinweis ausblenden','Hide hint','Masquer l’astuce'],
  ['Willkommen in deinem Weihnachts-Zoo!','Welcome to your Christmas zoo!','Bienvenue dans ton zoo de Noël !'],
  ['Baue deinen eigenen Zoo, sammle Tiere und verdiene Mischataler — und mit ein bisschen Glück bringt dir das Christkind die besten Tiere. Lass uns kurz die wichtigsten Sachen zeigen.','Build your own zoo, collect animals and earn Mischataler — and with a little luck the Christ Child brings you the best animals. Let’s quickly show you the most important things.','Construis ton propre zoo, collectionne des animaux et gagne des Mischataler — et avec un peu de chance, l’Enfant Jésus t’apporte les meilleurs animaux. Voyons vite l’essentiel.'],
  ['Laufen lernen','Learn to walk','Apprendre à marcher'],['Hier üben wir das Laufen — mitten auf einer grünen Wiese! Benutze den','Here we practise walking — in the middle of a green meadow! Use the','Ici on s’entraîne à marcher — au milieu d’un pré vert ! Utilise le'],
  ['(am Computer: W A S D) und lauf einmal nach','(on a computer: W A S D) and walk once to the','(sur ordinateur : W A S D) et marche une fois vers la'],['links','left','gauche'],['rechts','right','droite'],['vorne','forward','l’avant'],['hinten','back','l’arrière'],['Links','Left','Gauche'],['Rechts','Right','Droite'],['Vorne','Forward','Avant'],['Zurück','Back','Arrière'],
  ['Das ist dein Joystick','This is your joystick','Voici ton joystick'],['Er ist unten links.','It is at the bottom left.','Il est en bas à gauche.'],['Berühre ihn','Touch it','Touche-le'],['und schiebe ihn in eine Richtung — dann läufst du los. Mit dem Finger auf dem restlichen Bildschirm schaust du dich um.','and push it in one direction — then you walk. Use your finger on the rest of the screen to look around.','et pousse-le dans une direction — tu avances. Avec ton doigt sur le reste de l’écran, tu regardes autour de toi.'],
  ['Tippe auf den Joystick','Tap the joystick','Touche le joystick'],['Wohin noch?','Where next?','Et ensuite ?'],['Verstanden','Got it','Compris'],
  ['Das Portal','The portal','Le portail'],['Lauf ins Portal!','Walk into the portal!','Entre dans le portail !'],['Folge dem Pfeil – es bringt dich in deinen Zoo.','Follow the arrow – it takes you to your zoo.','Suis la flèche – elle t’emmène dans ton zoo.'],
  ['Super gemacht! 🎉 In der Ecke ist ein','Well done! 🎉 A','Bien joué ! 🎉 Un'],['Portal','portal','portail'],['aufgegangen. Folge dem Pfeil und lauf hinein — es bringt dich in deinen Zoo!','has opened in the corner. Follow the arrow and walk in — it takes you to your zoo!','s’est ouvert dans le coin. Suis la flèche et entre — il t’emmène dans ton zoo !'],
  ['Zur Gondel','To the gondola','Vers la télécabine'],['Folge dem Pfeil zur Gondelstation – dort tippst du auf den Bildschirm.','Follow the arrow to the gondola station – tap the screen there.','Suis la flèche jusqu’à la station – touche l’écran là-bas.'],
  ['Die Gondel ist dort, wo du Tiere bekommst. Folge dem Pfeil und lauf zur Gondelstation. Wenn du dort bist, tippe/klicke irgendwo auf den Bildschirm – dann öffnet sich die Gondel-Karte (dort kaufst du Tiere und Glück)!','The gondola is where you get animals. Follow the arrow and walk to the gondola station. When you are there, tap/click anywhere on the screen – the gondola card opens (you buy animals and luck there)!','La télécabine, c’est là qu’on obtient des animaux. Suis la flèche jusqu’à la station. Une fois là-bas, touche l’écran – la carte de la télécabine s’ouvre (tu y achètes animaux et chance) !'],
  ['Glück kaufen','Buy luck','Acheter de la chance'],['Dein erstes Tier','Your first animal','Ton premier animal'],
  ['Neu hier? Tippe oben auf','New here? Tap','Nouveau ? Touche'],
  ['Starterpaket','Starter pack','Pack de départ'],['Kaufe 1 weiteres Tier ODER vergolde 1 Tier','Buy 1 more animal OR gild 1 animal','Achète 1 animal de plus OU dore 1 animal'],
  ['Neu im Zoo!','New in the zoo!','Nouveau au zoo !'],['Das ist neu seit deinem letzten Besuch:','New since your last visit:','Nouveautés depuis ta dernière visite :'],['Ansehen','View','Voir'],
  ['Musik & Party-Zeit','Music & party time','Musique et fête'],['Hintergrundmusik','Background music','Musique de fond'],['Fähigkeitsbaum','Skill tree','Arbre de compétences'],['Detektiv-Fälle','Detective cases','Enquêtes'],['MT-Pass neu','MT pass (new)','Pass MT (nouveau)'],['Ein Menü für alles','One menu for everything','Un menu pour tout'],
  ['Freizeitpark','Theme park','Parc d’attractions'],['Piraten-Welt','Pirate world','Monde des pirates'],
  ['Lieder','Songs','Chansons'],['Endlosschleife (dieses Lied immer wieder)','Endless loop (repeat this song)','Boucle infinie (répéter ce morceau)'],['Nächstes Lied','Next song','Morceau suivant'],['Unser Zoo-Lied','Our zoo song','Notre chanson du zoo'],['Kino-Thema','Cinema theme','Thème du cinéma'],['Epische Weite (Filmmusik-Stil)','Epic Expanse (film score style)','Étendue épique (style musique de film)'],
  // Start-Seiten (Charakter, Profil, Login)
  ['Wähle deinen Charakter','Choose your character','Choisis ton personnage'],['Wer geht in die Ferien?','Who is going on holiday?','Qui part en vacances ?'],['Farbe:','Colour:','Couleur :'],['Weiter ➜','Next ➜','Suivant ➜'],
  ['Dein Profil','Your profile','Ton profil'],['Dein Name','Your name','Ton nom'],['Passwort','Password','Mot de passe'],['Alter','Age','Âge'],['Damit die Fragen und Aufgaben zum Alter passen — nicht zu leicht, nicht zu schwer.','So the questions and tasks fit your age — not too easy, not too hard.','Pour que les questions et les tâches correspondent à ton âge — ni trop facile, ni trop difficile.'],
  ['unter 7','under 7','moins de 7'],['8–11','8–11','8–11'],['Los geht\'s! 🚀','Let\'s go! 🚀','C\'est parti ! 🚀'],['Los geht’s! 🚀','Let’s go! 🚀','C’est parti ! 🚀'],['Name mindestens 2 Zeichen!','Name needs at least 2 characters!','Le nom doit avoir au moins 2 caractères !'],['Bitte Passwort eingeben!','Please enter a password!','Entre un mot de passe !'],['Bitte Alter wählen!','Please choose your age!','Choisis ton âge !'],['Bitte Charakter wählen!','Please choose a character!','Choisis un personnage !'],
  ['Anmelden ➜','Log in ➜','Connexion ➜'],['Willkommen zurück!','Welcome back!','Bon retour !'],['Registrierung...','Registering...','Inscription...'],
  ['Schön, dass du wieder da bist! Melde dich an – oder registriere einen neuen Spieler.','Nice to see you again! Log in – or register a new player.','Content de te revoir ! Connecte-toi – ou inscris un nouveau joueur.'],
  ['Legendär','Legendary','Légendaire'],['Selten','Rare','Rare'],['Episch','Epic','Épique'],['Ultra-Legendär','Ultra legendary','Ultra légendaire'],['Göttlich','Divine','Divin'],['Mystisch','Mythic','Mythique'],['Geheim','Secret','Secret'],['Ewig','Eternal','Éternel'],
  ['Nochmal +50% (braucht rote Schuhe) — tippen für Details','Another +50% (needs red shoes) — tap for details','Encore +50 % (il faut les baskets rouges) — toucher pour les détails'],
  ['Schaltet die Würfel-Maschine im Zoo frei','Unlocks the dice machine in the zoo','Débloque la machine à dés dans le zoo'],['plus Platin-Rush beim Geradeauslaufen','plus platinum rush when running straight','plus ruée platine en courant tout droit'],
  ['Trailer ansehen','Watch trailer','Voir la bande-annonce'],['Spielregeln','Game rules','Règles du jeu'],['z.B. Mischa','e.g. Mischa','p. ex. Mischa'],['Geheimwort','Secret word','Mot secret'],['Leaderboard','Leaderboard','Classement'],
  // Gondelstation Berg
  ['Bergfahrt zum Gipfel','Mountain ride to the summit','Trajet vers le sommet'],['Zurück zum Zoo','Back to the zoo','Retour au zoo'],
  ['Mischataler','Mischataler','Mischataler'],['Glück','luck','chance'],
  ];
  const LONGK=15;
  const longs=D.filter(r=>r[0].length>=LONGK).sort((a,b)=>b[0].length-a[0].length);
  const shorts=new Map(); D.filter(r=>r[0].length<LONGK).forEach(r=>shorts.set(r[0],r));
  const RX=[[/^Benötigt: ?(.*)$/,['Needs: $1','Requis : $1']],[/^Schritt (\d+) von (\d+)$/,['Step $1 of $2','Étape $1 sur $2']],[/^🏠 Dein Platz: Slot (.+)$/,['🏠 Your spot: slot $1','🏠 Ta place : emplacement $1']],[/^Nächstes: ?(.*)$/,['Next: $1','Suivant : $1']]];
  const seen=new WeakMap();
  function tr(v,t){ if(!/[A-Za-zÄÖÜäöüß]/.test(v)) return v; const i=t==='fr'?2:1; let o=v;
    { const r0=shorts.get(o.trim()); if(r0) return r0[i]; }
    const m=o.match(/^([^\p{L}]*)(.*?)([^\p{L}]*)$/su); if(m){ const r=shorts.get(m[2]); if(r) return m[1]+r[i]+m[3]; }
    for(const [rx,tt] of RX){ if(rx.test(o)) return o.replace(rx,tt[i-1]); }
    for(const r of longs){ if(o.indexOf(r[0])>=0) o=o.split(r[0]).join(r[i]); }
    return o; }
  let q=new Set(), sched=false;
  function flush(){ sched=false; const t=target(); if(!t){ q.clear(); return; } q.forEach(n=>{ try{ if(!n.isConnected) return; const v=n.nodeValue; if(seen.get(n)===v) return; const nv=tr(v,t); seen.set(n,nv); if(nv!==v) n.nodeValue=nv; }catch(e){} }); q.clear(); }
  function add(n){ if(n.nodeType===3){ q.add(n); } else if(n.nodeType===1&&!/^(SCRIPT|STYLE|CANVAS)$/.test(n.tagName)){ const w=document.createTreeWalker(n,NodeFilter.SHOW_TEXT); let x; while(x=w.nextNode()) q.add(x); }
    if(n.nodeType===1) attrs(n);
    if(!sched){ sched=true; (window.requestAnimationFrame||setTimeout)(flush); } }
  function attrs(root){ const t=target(); if(!t) return; (root.querySelectorAll?root.querySelectorAll('[title],[placeholder],[aria-label]'):[]).forEach(e=>['title','placeholder','aria-label'].forEach(a=>{ const v=e.getAttribute(a); if(v){ const nv=tr(v,t); if(nv!==v) e.setAttribute(a,nv); } })); }
  const mo=new MutationObserver(ms=>{ if(!target()) return; for(const m of ms){ if(m.type==='characterData') add(m.target); else m.addedNodes.forEach(add); } });
  function boot(){ if(!document.body) return setTimeout(boot,100); mo.observe(document.body,{childList:true,subtree:true,characterData:true}); if(target()){ add(document.body); attrs(document.body); } }
  boot();
  window.ZLang2={tr:v=>{ const t=target(); return t?tr(v,t):v; },target,rescan(){ add(document.body); attrs(document.body); },D};
})();
