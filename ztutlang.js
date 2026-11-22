/* ZTutL (v883): Tutorial-Schritte auf Englisch / Französisch (ganze Texte, damit die <b>-Teile sauber sitzen). Schlüssel = Schritt-ID aus TUTORIAL_STEPS.
   Aufbau: id → { en:[Titel, Text, Kurztext?], fr:[Titel, Text, Kurztext?] } */
(function(){
  'use strict';
  window.ZTutL={
    welcome:{
      en:['🎄 Welcome to your Christmas zoo!','Build your own zoo, collect animals and earn Mischataler — and with a bit of luck the Christkind brings you the best animals. Let us quickly show you the most important things.'],
      fr:['🎄 Bienvenue dans ton zoo de Noël !','Construis ton propre zoo, collectionne des animaux et gagne des Mischataler — et avec un peu de chance, l’Enfant Jésus t’apporte les meilleurs animaux. Voyons vite les choses les plus importantes.']},
    meadow:{
      en:['🌿 Learn to walk','Here we practise walking — in the middle of a green meadow! Use the <b>joystick</b> (on a computer: W A S D) and walk once to the <b>left</b>, to the <b>right</b>, <b>forwards</b> and <b>backwards</b>.<div id="tm-list" style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px"></div>'],
      fr:['🌿 Apprendre à marcher','Ici, on s’entraîne à marcher — au milieu d’une prairie verte ! Utilise le <b>joystick</b> (sur ordinateur : W A S D) et marche une fois vers la <b>gauche</b>, la <b>droite</b>, l’<b>avant</b> et l’<b>arrière</b>.<div id="tm-list" style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px"></div>']},
    portal:{
      en:['🌀 The portal','Well done! 🎉 A <b>portal</b> has opened in the corner. Follow the arrow and walk into it — it takes you to your zoo!','Follow the arrow and walk into the portal – it takes you to your zoo.'],
      fr:['🌀 Le portail','Bien joué ! 🎉 Un <b>portail</b> s’est ouvert dans le coin. Suis la flèche et entre dedans — il t’emmène dans ton zoo !','Suis la flèche et entre dans le portail – il t’emmène dans ton zoo.']},
    gondola:{
      en:['🚡 To the gondola','The gondola is where you get animals. Follow the arrow and walk to the gondola station. When you are there, tap/click anywhere on the screen – the gondola map opens (that is where you buy animals and luck)!','Follow the arrow to the gondola station – tap the screen there.'],
      fr:['🚡 Vers la télécabine','La télécabine, c’est là que tu obtiens des animaux. Suis la flèche et marche jusqu’à la station. Une fois là-bas, touche/clique n’importe où sur l’écran – la carte de la télécabine s’ouvre (tu y achètes des animaux et de la chance) !','Suis la flèche jusqu’à la station de télécabine – touche l’écran là-bas.']},
    gluck:{
      en:['🍀 Buy luck','Here in the gondola you can buy luck permanently — more luck means rarer animals, almost like a particularly nice Christmas present!'],
      fr:['🍀 Acheter de la chance','Ici, dans la télécabine, tu peux acheter de la chance de façon permanente — plus de chance, c’est des animaux plus rares, presque comme un très beau cadeau de Noël !']},
    buy:{
      en:['🐱 Your first animal','You start with some credit — buy your first animal here, your first Christmas present to the zoo!'],
      fr:['🐱 Ton premier animal','Tu commences avec un peu de crédit — achète ici ton premier animal, ton premier cadeau de Noël pour le zoo !']},
    carry:{
      en:['🏠 Carry it to the enclosure','The animal does not come by itself — you carry it! Follow the arrow to your enclosure and tap “put down” there (or press [E]).','Follow the arrow to your enclosure and tap “put down” (or press [E]).'],
      fr:['🏠 Porter dans l’enclos','L’animal ne vient pas tout seul — tu le portes ! Suis la flèche jusqu’à ton enclos et touche « poser » (ou appuie sur [E]).','Suis la flèche jusqu’à ton enclos et touche « poser » (ou appuie sur [E]).']},
    shop:{
      en:['🛒 The shop','Here you can buy boosts and extras. Try opening it!'],
      fr:['🛒 La boutique','Ici, tu peux acheter des boosts et des extras. Ouvre-la !']},
    shopcont:{
      en:['🎁 What is in the shop? (wish list)','Shoes for more speed, more visitors, more income and much more — take a look around! At the very bottom you will find the “Dice machine licence”: once bought, you can place money in the zoo and double it 50/50 (or lose it). Close the shop when you are done.'],
      fr:['🎁 Qu’y a-t-il dans la boutique ? (liste de souhaits)','Des chaussures pour aller plus vite, plus de visiteurs, plus de revenus et bien plus encore — regarde tranquillement ! Tout en bas, tu trouveras la « Licence machine à dés » : une fois achetée, tu peux miser de l’argent dans le zoo et le doubler à 50/50 (ou le perdre). Ferme la boutique quand tu as fini.']},
    menu:{
      en:['☰ The menu','Here you find settings, your rank and more. Try opening it!'],
      fr:['☰ Le menu','Ici, tu trouves les réglages, ton rang et plus encore. Ouvre-le !']},
    menuinfo:{
      en:['⚙️ Settings & rank','Here you find settings, your rank and more — take a look around! Close the menu when you are done.'],
      fr:['⚙️ Réglages et rang','Ici, tu trouves les réglages, ton rang et plus encore — regarde tranquillement ! Ferme le menu quand tu as fini.']},
    events:{
      en:['🎉 Events','Down here on the right you can see when a time-limited event is running (e.g. family hut or Christmas magic) — they often give big bonuses!'],
      fr:['🎉 Événements','Ici, en bas à droite, tu vois quand un événement à durée limitée est en cours (p. ex. cabane familiale ou magie de Noël) — ils donnent souvent de gros bonus !']},
    goldmachine:{
      en:['⚗️ Gold machine','The gold machine upgrades your animals! Follow the arrow and walk over!','Follow the arrow to the gold machine.'],
      fr:['⚗️ Machine à or','La machine à or améliore tes animaux ! Suis la flèche et va-y !','Suis la flèche jusqu’à la machine à or.']},
    goldopen:{
      en:['⚗️ Open the gold machine','Now tap the machine (or press [E]) to open it!'],
      fr:['⚗️ Ouvrir la machine à or','Touche maintenant la machine (ou appuie sur [E]) pour l’ouvrir !']},
    goldinfo:{
      en:['⚗️ How the gold machine works','Here you pick one of your animals and upgrade it for MT into a <b>gilded animal</b> — it earns more money. Take a look around. Close the machine with the ✕, then we carry on.'],
      fr:['⚗️ Comment fonctionne la machine à or','Ici, tu choisis un de tes animaux et tu l’améliores contre des MT en <b>animal doré</b> — il rapporte plus d’argent. Regarde tranquillement. Ferme la machine avec la ✕, puis on continue.']},
    slap:{
      en:['✋ Slapping — your weapons','Below you see your <b>weapon bar</b>. Every slap can hit other players; they drop a carried animal and lose hearts:<br>'
        +'🤚 <b>Basic</b> – 2 sec. out of action, 15 m range<br>'
        +'❄️ <b>Ice</b> – freezes for 3 sec. · ✨ <b>Golden</b> – 3 sec. gold bar<br>'
        +'💜 <b>Shadow</b> – glows purple for 3 sec. · 🔥 <b>Fire</b> – burns for 5 sec. (3 hearts)<br>'
        +'🪞 <b>Mirror</b> – tap first, then 3 sec. protected: deflects slaps and throws slingshot shots back twice as hard<br>'
        +'🌈 <b>Rainbow</b> – 2 sec. · 🌌 <b>Void</b> – 5 sec. into space<br>'
        +'🎁 <b>Gift slingshot</b> – scope, hits from anywhere, direct hit = 6 sec.<br>'
        +'The stronger the slap, the more hearts of damage — but it also costs you more. You start with Basic (already equipped), the others you unlock with rebirths.<br><b>Tap the screen once now to slap!</b>'],
      fr:['✋ Gifler — tes armes','En bas, tu vois ta <b>barre d’armes</b>. Chaque gifle peut toucher d’autres joueurs ; ils lâchent l’animal qu’ils portent et perdent des cœurs :<br>'
        +'🤚 <b>Basic</b> – 2 s hors-jeu, 15 m de portée<br>'
        +'❄️ <b>Ice</b> – gèle 3 s · ✨ <b>Golden</b> – 3 s lingot d’or<br>'
        +'💜 <b>Shadow</b> – brille en violet 3 s · 🔥 <b>Fire</b> – brûle 5 s (3 cœurs)<br>'
        +'🪞 <b>Miroir</b> – touche d’abord, puis 3 s protégé : repousse les gifles et renvoie les tirs de lance-pierre deux fois plus fort<br>'
        +'🌈 <b>Rainbow</b> – 2 s · 🌌 <b>Void</b> – 5 s dans l’espace<br>'
        +'🎁 <b>Lance-cadeaux</b> – lunette, touche de partout, coup au but = 6 s<br>'
        +'Plus la gifle est forte, plus elle fait de dégâts en cœurs — mais elle te coûte aussi plus cher. Tu commences avec Basic (déjà équipée), les autres se débloquent avec les renaissances.<br><b>Touche l’écran une fois maintenant pour gifler !</b>']},
    feeder:{
      en:['🍬 Treat machine','The treat machine makes your animals faster. Follow the arrow and walk over!','Follow the arrow to the treat machine.'],
      fr:['🍬 Distributeur de friandises','Le distributeur de friandises rend tes animaux plus rapides. Suis la flèche et va-y !','Suis la flèche jusqu’au distributeur de friandises.']},
    feederopen:{
      en:['🍬 Open the treat machine','Now tap the machine (or press [E]) to open it!'],
      fr:['🍬 Ouvrir le distributeur','Touche maintenant le distributeur (ou appuie sur [E]) pour l’ouvrir !']},
    feederinfo:{
      en:['🍬 How the treat machine works','Pick an animal in your enclosures and give it a treat: it <b>earns money 2× as fast for 5 min</b> and costs only 5% of the animal’s price. Take a look around. Close the machine with the ✕, then we carry on.'],
      fr:['🍬 Comment fonctionne le distributeur','Choisis un animal dans tes enclos et donne-lui une friandise : il <b>gagne de l’argent 2× plus vite pendant 5 min</b> et ne coûte que 5 % du prix de l’animal. Regarde tranquillement. Ferme le distributeur avec la ✕, puis on continue.']},
    hearts:{
      en:['❤️ Your hearts','Right above your weapon bar you see your <b>10 hearts</b>. Every slap that hits you costs hearts (Basic 0.3 · Ice 0.5 · … · Hut slap 5). Every <b>15 sec.</b> a heart comes back. At 0 you are defeated — then you choose <b>Respawn</b> or <b>Main menu</b>.'],
      fr:['❤️ Tes cœurs','Juste au-dessus de ta barre d’armes, tu vois tes <b>10 cœurs</b>. Chaque gifle qui te touche coûte des cœurs (Basic 0,3 · Ice 0,5 · … · gifle de cabane 5). Toutes les <b>15 s</b>, un cœur revient. À 0, tu es vaincu — tu choisis alors <b>Réapparaître</b> ou <b>Menu principal</b>.']}
  };
  window.ZTutL.menuOv=function(){ const t=window.ZLang2&&ZLang2.target&&ZLang2.target(); if(t==='fr') return 'Ici, tu trouves les réglages, ton rang et plus encore.<br><b>📜 Fais défiler la barre à gauche</b> – la flèche t’indique dans quelle direction se trouve le bouton Menu – puis touche <b>☰ Menu</b>.'; if(t==='en') return 'Here you find settings, your rank and more.<br><b>📜 Scroll the bar on the left</b> – the arrow shows which direction the menu button is – then tap <b>☰ Menu</b>.'; return null; };
  window.ZTutL.get=function(s){
    try{ const t=window.ZLang2&&ZLang2.target&&ZLang2.target(); if(!t||!s||!s.id) return s; const r=window.ZTutL[s.id]; if(!r||!r[t]) return s; const a=r[t];
      return Object.assign({},s,{title:a[0],text:a[1],short:a[2]||s.short}); }catch(e){ return s; }
  };
})();
