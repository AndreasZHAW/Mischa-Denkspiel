// Mischa Denkspiel — Language System
// Supports: de (Jugendsprache/Standard-Deutsch), de_simple (einfaches Deutsch
// für Eltern/Grosseltern — erklärt Denglisch-Begriffe wie "Jump-Event"),
// en (English), fr (Français)
const LANG = {
  _cur: 'de',
  
  load() {
    try { this._cur = localStorage.getItem('mischa_lang') || 'de'; } catch(e) {}
    document.documentElement.lang = (this._cur==='de_simple'?'de':this._cur);
  },
  
  set(lang) {
    this._cur = lang;
    try { localStorage.setItem('mischa_lang', lang); } catch(e) {}
    document.documentElement.lang = (lang==='de_simple'?'de':lang);
    // Reload page to apply
    location.reload();
  },
  
  t(key) {
    const entry = STRINGS[key];
    if (!entry) return key;
    // de_simple falls back to de.simple key if present, else plain 'de' text
    if (this._cur === 'de_simple') return entry.de_simple || entry.de || key;
    return entry[this._cur] || entry.de || key;
  },
  
  // Bonus MT for non-German speakers (de_simple is still German, no bonus)
  getBonus() {
    return (this._cur !== 'de' && this._cur !== 'de_simple') ? 1 : 0;
  },
  
  // Flag/icon for current language
  flag() {
    return {de:'🇩🇪', de_simple:'👴', en:'🇬🇧', fr:'🇫🇷'}[this._cur] || '🇩🇪';
  },
  
  // Language selector HTML
  selectorHTML(small) {
    const langs = [
      {id:'de',        flag:'🇩🇪', name:'Deutsch'},
      {id:'de_simple',  flag:'👴', name:'Deutsch (einfach)'},
      {id:'en',        flag:'🇬🇧', name:'English'},
      {id:'fr',        flag:'🇫🇷', name:'Français'},
    ];
    if(small) {
      return langs.map(l=>`<button onclick="LANG.set('${l.id}')" style="background:${l.id===LANG._cur?'rgba(255,255,255,.25)':'rgba(255,255,255,.08)'};border:1px solid rgba(255,255,255,${l.id===LANG._cur?'.5':'.15'});color:#fff;padding:5px 10px;border-radius:8px;cursor:pointer;font-size:.85rem">${l.flag} ${l.name}</button>`).join('');
    }
    return '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">'+
      langs.map(l=>`<button onclick="LANG.set('${l.id}')" style="background:${l.id===LANG._cur?'rgba(255,255,255,.2)':'rgba(255,255,255,.07)'};border:2px solid ${l.id===LANG._cur?'rgba(255,255,255,.6)':'rgba(255,255,255,.15)'};color:#fff;padding:8px 16px;border-radius:10px;cursor:pointer;font-size:.9rem;font-weight:${l.id===LANG._cur?'900':'400'}">${l.flag} ${l.name}${(l.id!=='de'&&l.id!=='de_simple')?' +1 MT':''}</button>`).join('')+
    '</div>';
  }
};

const STRINGS = {
  // ── WELCOME PAGE ──
  'welcome.title':         { de:'Willkommen, Abenteurer', en:'Welcome, Adventurer', fr:'Bienvenue, Aventurier' },
  'welcome.subtitle':      { de:'2 Welten · Verdiene 🌀 MT · Baue deinen Zoo!', en:'2 Worlds · Earn 🌀 MT · Build your Zoo!', fr:'2 Mondes · Gagne 🌀 MT · Construis ton Zoo!' },
  'welcome.world1.title':  { de:'Welt 1 — Denkspiel', en:'World 1 — Puzzle Game', fr:'Monde 1 — Jeu de Réflexion' },
  'welcome.world1.desc':   { de:'Spiele 20 verschiedene Spiele und verdiene Mischa Taler (🌀 MT).', en:'Play 20 different games and earn Mischa Coins (🌀 MT).', fr:'Joue à 20 jeux différents et gagne des Mischa Pièces (🌀 MT).' },
  'welcome.world1.detail': { de:'Je besser du spielst, desto mehr MT bekommst du (bis 1.5 MT pro Spiel).', en:'The better you play, the more MT you earn (up to 1.5 MT per game).', fr:'Plus tu joues bien, plus tu gagnes de MT (jusqu\'à 1,5 MT par jeu).' },
  'welcome.world2.title':  { de:'Welt 2 — Zoo-Empire', en:'World 2 — Zoo Empire', fr:'Monde 2 — Empire du Zoo' },
  'welcome.world2.desc':   { de:'Teleportiere für 10 🌀 MT in den Zoo. Kaufe Tiere mit der Gondelbahn · Baue Gehege auf · Verdiene automatisch MT.', en:'Teleport to the Zoo for 10 🌀 MT. Buy animals with the gondola · Build enclosures · Earn MT automatically.', fr:'Téléporte-toi au Zoo pour 10 🌀 MT. Achète des animaux avec le téléphérique · Construis des enclos · Gagne des MT automatiquement.' },
  'welcome.world2.features': { de:'Gondelbahn · Glücksrad · Multiplayer · Slap-System', en:'Gondola · Lucky Wheel · Multiplayer · Slap System', fr:'Téléphérique · Roue de la Chance · Multijoueur · Système de Claque' },
  'btn.register':          { de:'🆕 Neu registrieren', en:'🆕 Register', fr:'🆕 S\'inscrire' },
  'btn.login':             { de:'🔑 Anmelden', en:'🔑 Login', fr:'🔑 Connexion' },
  'btn.leaderboard':       { de:'🌍 Rangliste', en:'🌍 Leaderboard', fr:'🌍 Classement' },
  'btn.wallet':            { de:'👜 Geldbeutel', en:'👜 Wallet', fr:'👜 Portefeuille' },
  'btn.account':           { de:'📊 Konto', en:'📊 Account', fr:'📊 Compte' },

  // ── LOGIN / REGISTER ──
  'login.title':           { de:'Anmelden 🔑', en:'Login 🔑', fr:'Connexion 🔑' },
  'login.welcome_back':    { de:'Willkommen zurück!', en:'Welcome back!', fr:'Content de te revoir !' },
  'login.name':            { de:'Name', en:'Name', fr:'Nom' },
  'login.password':        { de:'Passwort', en:'Password', fr:'Mot de passe' },
  'login.btn':             { de:'Anmelden ➜', en:'Login ➜', fr:'Connexion ➜' },
  'login.back_normal':     { de:'← Zurück zur normalen Welt', en:'← Back to normal world', fr:'← Retour au monde normal' },
  'register.title':        { de:'Neu registrieren 🆕', en:'Register 🆕', fr:'S\'inscrire 🆕' },
  'register.name':         { de:'Dein Name', en:'Your Name', fr:'Ton Nom' },
  'register.password':     { de:'Geheimwort', en:'Secret Word', fr:'Mot Secret' },
  'register.btn':          { de:'Konto erstellen ➜', en:'Create Account ➜', fr:'Créer un Compte ➜' },
  'lang.bonus':            { de:'', en:'🎁 +1 MT Bonus für Englisch!', fr:'🎁 +1 MT Bonus pour le Français !' },

  // ── WORLDMAP ──
  'worldmap.title':        { de:'Weltkarte', en:'World Map', fr:'Carte du Monde' },
  'worldmap.teleport':     { de:'🚀 Teleportiere in den Zoo', en:'🚀 Teleport to Zoo', fr:'🚀 Téléporter au Zoo' },
  'worldmap.personality':  { de:'🎨 Persönlichkeit (Farbe + Avatar)', en:'🎨 Personality (Color + Avatar)', fr:'🎨 Personnalité (Couleur + Avatar)' },
  'worldmap.font':         { de:'🔤 Schrift', en:'🔤 Font', fr:'🔤 Police' },
  'worldmap.update':       { de:'🔄 Update', en:'🔄 Update', fr:'🔄 Mise à jour' },
  'worldmap.logout':       { de:'Abmelden', en:'Logout', fr:'Déconnexion' },
  'worldmap.tasks':        { de:'Aufgaben', en:'Tasks', fr:'Tâches' },
  'worldmap.all_worlds':   { de:'Alle Welten', en:'All Worlds', fr:'Tous les Mondes' },
  'worldmap.completed':    { de:'Alle 10 Welten geschafft!', en:'All 10 worlds completed!', fr:'Tous les 10 mondes terminés !' },
  'worldmap.profile':      { de:'Dein Profil', en:'Your Profile', fr:'Ton Profil' },
  'worldmap.close':        { de:'Schliessen', en:'Close', fr:'Fermer' },
  'worldmap.cancel':       { de:'Abbrechen', en:'Cancel', fr:'Annuler' },

  // ── ZOO HUD ──
  'zoo.gondola':           { de:'Gondel', en:'Gondola', fr:'Gondole' },
  'zoo.wheel':             { de:'Rad', en:'Wheel', fr:'Roue' },
  'zoo.rebirth':           { de:'Rebirth', de_simple:'Neustart (Bonus)', en:'Rebirth', fr:'Renaissance' },
  'zoo.shop':              { de:'Shop', de_simple:'Laden', en:'Shop', fr:'Boutique' },
  'zoo.trade':             { de:'Tauschen', en:'Trade', fr:'Échanger' },
  'zoo.menu':              { de:'Menü', en:'Menu', fr:'Menu' },
  'zoo.sound':             { de:'Sound', en:'Sound', fr:'Son' },
  'zoo.update':            { de:'Update', en:'Update', fr:'Mise à jour' },
  'zoo.admin':             { de:'Admin', en:'Admin', fr:'Admin' },

  // ── ZOO SHOP ──
  'shop.animals':          { de:'Tiere', en:'Animals', fr:'Animaux' },
  'shop.enclosures':       { de:'Gehege', en:'Enclosures', fr:'Enclos' },
  'shop.boosts':           { de:'Boosts', en:'Boosts', fr:'Boosts' },
  'shop.eggs':             { de:'Eier', en:'Eggs', fr:'Œufs' },
  'shop.buy':              { de:'Kaufen', en:'Buy', fr:'Acheter' },
  'shop.not_enough':       { de:'❌ Zu wenig MT!', en:'❌ Not enough MT!', fr:'❌ Pas assez de MT !' },
  'shop.full':             { de:'❌ Alle Gehege belegt!', en:'❌ All enclosures full!', fr:'❌ Tous les enclos sont pleins !' },

  // ── ZOO GONDOLA ──
  'gond.title':            { de:'Gondelbahn', de_simple:'Tier-Kaufstation (Gondel)', en:'Gondola Station', fr:'Station du Téléphérique' },
  'gond.buy':              { de:'🛒 Kaufen', en:'🛒 Buy', fr:'🛒 Acheter' },
  'gond.buy_egg':          { de:'🥚 Kaufen & Öffnen!', en:'🥚 Buy & Open!', fr:'🥚 Acheter & Ouvrir !' },
  'gond.not_enough':       { de:'❌ Zu wenig MT!', en:'❌ Not enough MT!', fr:'❌ Pas assez de MT !' },
  'gond.full':             { de:'❌ Gehege voll', en:'❌ Enclosure full', fr:'❌ Enclos plein' },
  'gond.arrive':           { de:'Ein Tier kommt an!', en:'An animal arrives!', fr:'Un animal arrive !' },

  // ── ZOO MENU ──
  'menu.settings':         { de:'⚙️ EINSTELLUNGEN ⚙️', en:'⚙️ SETTINGS ⚙️', fr:'⚙️ PARAMÈTRES ⚙️' },
  'menu.sound':            { de:'🎵 Sound', en:'🎵 Sound', fr:'🎵 Son' },
  'menu.daytime':          { de:'🌅 Tageszeiten', en:'🌅 Time of Day', fr:'🌅 Heure du Jour' },
  'menu.on':               { de:'✓ An', en:'✓ On', fr:'✓ Activé' },
  'menu.off':              { de:'✗ Aus', en:'✗ Off', fr:'✗ Désactivé' },

  // ── SOUND PANEL ──
  'sound.mute':            { de:'Stumm', en:'Mute', fr:'Muet' },
  'sound.mute.desc':       { de:'Kein Sound', en:'No Sound', fr:'Pas de Son' },
  'sound.arcade':          { de:'Arcade', de_simple:'Retro-Spielhalle', en:'Arcade', fr:'Arcade' },
  'sound.arcade.desc':     { de:'Retro 8-Bit Töne', en:'Retro 8-Bit Sounds', fr:'Sons Rétro 8-Bit' },
  'sound.normal':          { de:'Normal', en:'Normal', fr:'Normal' },
  'sound.normal.desc':     { de:'Standard Töne', en:'Standard Sounds', fr:'Sons Standards' },
  'sound.satisfying':      { de:'Satisfying', de_simple:'Angenehm', en:'Satisfying', fr:'Satisfaisant' },
  'sound.satisfying.desc': { de:'Weiche, angenehme Töne', en:'Soft, pleasant sounds', fr:'Sons doux et agréables' },

  // ── REBIRTH ──
  'reb.title':             { de:'Wiedergeburt', de_simple:'Neustart mit Bonus', en:'Rebirth', fr:'Renaissance' },
  'reb.btn':               { de:'🔄 Wiedergeburt!', de_simple:'🔄 Neu starten (mit Bonus)!', en:'🔄 Rebirth!', fr:'🔄 Renaissance !' },
  'reb.cant':              { de:'Noch nicht möglich', en:'Not possible yet', fr:'Pas encore possible' },
  'reb.mult':              { de:'Neuer Multiplikator', en:'New Multiplier', fr:'Nouveau Multiplicateur' },

  // ── CHEST ──
  'chest.open':            { de:'ÖFFNEN', en:'OPEN', fr:'OUVRIR' },
  'chest.claim':           { de:'Super! ➜', en:'Great! ➜', fr:'Super ! ➜' },
  'chest.ready':           { de:'✨ Bereit zum Öffnen!', en:'✨ Ready to open!', fr:'✨ Prêt à ouvrir !' },
  'chest.tap':             { de:'👆 Tippe', en:'👆 Tap', fr:'👆 Appuie' },
  'chest.to_open':         { de:'× zum Öffnen!', en:'× to open!', fr:'× pour ouvrir !' },
  'chest.rewards':         { de:'🎁 Belohnungs-Truhen', de_simple:'🎁 Geschenk-Kisten', en:'🎁 Reward Chests', fr:'🎁 Coffres de Récompenses' },
  'chest.opened':          { de:'Schon geöffnet', en:'Already opened', fr:'Déjà ouvert' },

  // ── ANIMALS ──
  'animal.normal':         { de:'Normal', en:'Normal', fr:'Normal' },
  'animal.rare':           { de:'Selten', en:'Rare', fr:'Rare' },
  'animal.epic':           { de:'Episch', en:'Epic', fr:'Épique' },
  'animal.legendary':      { de:'Legendär', en:'Legendary', fr:'Légendaire' },
  'animal.ultralegendary': { de:'Ultra-Legendär', en:'Ultra-Legendary', fr:'Ultra-Légendaire' },
  'animal.god':            { de:'Göttlich', en:'Godly', fr:'Divin' },
  'animal.mythic':         { de:'Mythisch', en:'Mythic', fr:'Mythique' },
  'animal.secret':         { de:'SECRET', en:'SECRET', fr:'SECRET' },

  // ── JUMP EVENT ──
  'jump.question':         { de:'🏃 Jump-Event läuft! Zur Obby teleportieren?', de_simple:'🏃 Ein Sprung-Geschicklichkeitsspiel hat begonnen! Möchtest du hingehen?', en:'🏃 Jump Event active! Teleport to Obby?', fr:'🏃 Jump Event actif ! Téléporter vers l\'Obby ?' },
  'jump.yes':              { de:'✅ Ja', en:'✅ Yes', fr:'✅ Oui' },
  'jump.no':               { de:'❌ Nein', en:'❌ No', fr:'❌ Non' },
  'jump.goal':             { de:'🏃 Obby · Ziel erreichen!', de_simple:'🏃 Sprung-Spiel · Kletter zum Ziel!', en:'🏃 Obby · Reach the goal!', fr:'🏃 Obby · Atteins l\'objectif !' },
  'jump.won':              { de:'GEWONNEN!', en:'YOU WON!', fr:'GAGNÉ !' },
  'jump.reward':           { de:'5-Minuten-Einnahmen:', en:'5-Minute Earnings:', fr:'Revenus de 5 Minutes :' },
  'jump.back':             { de:'Zurück zum Zoo', en:'Back to Zoo', fr:'Retour au Zoo' },

  // ── PERSONALITY ──
  'pers.title':            { de:'🎨 Persönlichkeit', en:'🎨 Personality', fr:'🎨 Personnalité' },
  'pers.color':            { de:'🎨 Farbe', en:'🎨 Color', fr:'🎨 Couleur' },
  'pers.avatar':           { de:'👤 Avatar', en:'👤 Avatar', fr:'👤 Avatar' },
  'pers.face':             { de:'😀 Gesicht / Tier', en:'😀 Face / Animal', fr:'😀 Visage / Animal' },
  'pers.hat':              { de:'🎩 Hut / Kopf', en:'🎩 Hat / Head', fr:'🎩 Chapeau / Tête' },
  'pers.glasses':          { de:'👓 Brille', en:'👓 Glasses', fr:'👓 Lunettes' },
  'pers.earring':          { de:'💎 Ohrring', en:'💎 Earring', fr:'💎 Boucle d\'oreille' },
  'pers.reset':            { de:'↺ Avatar zurücksetzen', en:'↺ Reset Avatar', fr:'↺ Réinitialiser l\'Avatar' },
  'pers.color.reset':      { de:'↺ Auf Standardfarbe zurücksetzen', en:'↺ Reset to default color', fr:'↺ Réinitialiser la couleur' },
  'pers.preview':          { de:'Dein Avatar', en:'Your Avatar', fr:'Ton Avatar' },
  'pers.color.preview':    { de:'Aktive Farbe:', en:'Active color:', fr:'Couleur active :' },

  // ── FEEDER (Leckerli-Automat) ──
  'feeder.title':          { de:'🍬 Leckerli-Automat', en:'🍬 Treat Dispenser', fr:'🍬 Distributeur de Friandises' },
  'feeder.yours':          { de:'Deine Leckerlis:', en:'Your treats:', fr:'Tes friandises :' },
  'feeder.choose':         { de:'Wähle ein Tier, das du fütterst', en:'Choose an animal to feed', fr:'Choisis un animal à nourrir' },
  'feeder.none':           { de:'Keine Tiere im Zoo zum Füttern.', en:'No animals in the zoo to feed.', fr:'Aucun animal à nourrir dans le zoo.' },
  'feeder.feed_btn':       { de:'🍬 Füttern (1 Leckerli)', en:'🍬 Feed (1 treat)', fr:'🍬 Nourrir (1 friandise)' },
  'feeder.already':        { de:'⚡ Schon gefüttert! Läuft noch.', en:'⚡ Already fed! Still active.', fr:'⚡ Déjà nourri ! Toujours actif.' },
  'feeder.none_left':      { de:'Keine Leckerlis! Im Shop kaufen.', en:'No treats left! Buy some in the shop.', fr:'Plus de friandises ! Achète-en dans la boutique.' },
  'feeder.hint':           { de:'Ein Leckerli macht ein Tier 5 Min lang 2× so schnell Geld.', en:'A treat makes an animal earn 2× money for 5 minutes.', fr:'Une friandise fait gagner 2× plus d\'argent pendant 5 min.' },
  'feeder.buy_shop':       { de:'Leckerlis im Shop kaufen (1000 MT).', en:'Buy treats in the shop (1000 MT).', fr:'Achète des friandises dans la boutique (1000 MT).' },
  'feeder.slot':           { de:'Gehege', en:'Enclosure', fr:'Enclos' },

  // ── WORLD MAP (Weltkarte, expanded) ──
  'wm.leaderboard':        { de:'🌍 Rangliste', en:'🌍 Leaderboard', fr:'🌍 Classement' },
  'wm.log':                { de:'📋 Log', en:'📋 Log', fr:'📋 Journal' },
  'wm.mt_full':            { de:'Mischa Taler', en:'Mischa Coins', fr:'Mischa Pièces' },
  'wm.rewards_btn':        { de:'🎁 Belohnungen abholen', en:'🎁 Collect rewards', fr:'🎁 Récupérer récompenses' },
  'wm.zoo_unlock_title':   { de:'🦁 Zoo freischalten', en:'🦁 Unlock the Zoo', fr:'🦁 Débloquer le Zoo' },
  'wm.zoo_unlock_body':    { de:'Noch {n} 🌀 MT bis zur Teleportation', en:'{n} more 🌀 MT until teleportation', fr:'Encore {n} 🌀 MT avant la téléportation' },
  'wm.teleport_btn':       { de:'🚀 In den Zoo teleportieren! (10 🌀 MT)', en:'🚀 Teleport to the Zoo! (10 🌀 MT)', fr:'🚀 Téléporter au Zoo ! (10 🌀 MT)' },
  'wm.your_games':         { de:'🎮 Deine 20 Spiele', en:'🎮 Your 20 games', fr:'🎮 Tes 20 jeux' },
  'wm.games_done':         { de:'Spiele ✓', en:'games ✓', fr:'jeux ✓' },
  'wm.games_count':        { de:'{n} Spiele · bis {m} 🌀 MT pro Spiel', en:'{n} games · up to {m} 🌀 MT per game', fr:'{n} jeux · jusqu\'à {m} 🌀 MT par jeu' },
  'world1.subtitle':       { de:'Reise nach Frankreich', en:'Journey to France', fr:'Voyage en France' },
  'world1.description':    { de:'Verdiene Mischa Taler — baue dein Zoo-Empire!', en:'Earn Mischa Coins — build your Zoo Empire!', fr:'Gagne des Mischa Pièces — construis ton Empire du Zoo !' },

  // ── WELCOME PAGE BODY TEXT (previously missing) ──
  'welcome.world1.body1':   { de:'Spiele <b>20 verschiedene Spiele</b> und verdiene <b>Mischa Taler (🌀 MT)</b>.', en:'Play <b>20 different games</b> and earn <b>Mischa Coins (🌀 MT)</b>.', fr:'Joue à <b>20 jeux différents</b> et gagne des <b>Mischa Pièces (🌀 MT)</b>.' },
  'welcome.world1.body2':   { de:'Je besser du spielst, desto mehr MT bekommst du (bis 1.5 MT pro Spiel).', en:'The better you play, the more MT you earn (up to 1.5 MT per game).', fr:'Plus tu joues bien, plus tu gagnes de MT (jusqu\'à 1,5 MT par jeu).' },
  'welcome.world1.games':   { de:'🎯 Dart · 🔢 Rechnen · 🚂 Zug · 🧠 Memory · ⚡ Reaktion · und mehr...', en:'🎯 Darts · 🔢 Math · 🚂 Train · 🧠 Memory · ⚡ Reaction · and more...', fr:'🎯 Fléchettes · 🔢 Calcul · 🚂 Train · 🧠 Mémoire · ⚡ Réaction · et plus...' },
  'welcome.world2.body1':   { de:'Teleportiere für <b>10 🌀 MT</b> in den Zoo.', en:'Teleport to the Zoo for <b>10 🌀 MT</b>.', fr:'Téléporte-toi au Zoo pour <b>10 🌀 MT</b>.' },
  'welcome.world2.body2':   { de:'Kaufe Tiere mit der Gondelbahn · Baue Gehege auf · Verdiene automatisch MT.', en:'Buy animals with the gondola · Build enclosures · Earn MT automatically.', fr:'Achète des animaux avec le téléphérique · Construis des enclos · Gagne des MT automatiquement.' },
  'welcome.world2.feats':   { de:'🚡 Gondelbahn · 🎡 Glücksrad · 🌀 Multiplayer · Slap-System', en:'🚡 Gondola · 🎡 Lucky Wheel · 🌀 Multiplayer · Slap System', fr:'🚡 Téléphérique · 🎡 Roue de la Chance · 🌀 Multijoueur · Système de Claque' },
  'btn.login_short':        { de:'🔑 Anmelden', en:'🔑 Login', fr:'🔑 Connexion' },
  'btn.wallet_short':       { de:'👜 Geldbeutel', en:'👜 Wallet', fr:'👜 Portefeuille' },
  'btn.account_short':      { de:'📊 Konto', en:'📊 Account', fr:'📊 Compte' },

  // ── INTRO STORY (intro.html) ──
  'intro.next':            { de:'Weiter ›', en:'Next ›', fr:'Suivant ›' },
  'intro.ch0.label':       { de:'Prolog', en:'Prologue', fr:'Prologue' },
  'intro.ch0.title':       { de:'Irgendwo in der Welt...', en:'Somewhere in the world...', fr:'Quelque part dans le monde...' },
  'intro.ch0.text':        { de:'Die Brüder <b>Mischa</b> und <b>Janosch</b><br>hatten schon immer einen grossen Traum...<br><br><b>Ihr Traum: den grössten intergalaktischen Zoo zu bauen...</b><br><br>Dazu brauchen sie <b>Deine Hilfe!</b>',
                              en:'The brothers <b>Mischa</b> and <b>Janosch</b><br>always had a big dream...<br><br><b>Their dream: to build the biggest intergalactic zoo...</b><br><br>To do that, they need <b>your help!</b>',
                              fr:'Les frères <b>Mischa</b> et <b>Janosch</b><br>ont toujours eu un grand rêve...<br><br><b>Leur rêve : construire le plus grand zoo intergalactique...</b><br><br>Pour cela, ils ont besoin de <b>ton aide !</b>' },
  'intro.ch1.label':       { de:'Die Helden', en:'The Heroes', fr:'Les Héros' },
  'intro.ch1.mischa_desc': { de:'Der Kreative. Einfallsreich, ruhig, unglaublich klug, ein echter Teamplayer.', en:'The Creative One. Resourceful, calm, incredibly smart, a true team player.', fr:'Le Créatif. Ingénieux, calme, incroyablement intelligent, un vrai joueur d\'équipe.' },
  'intro.ch1.janosch_desc':{ de:'Der Starke. Schnell, ehrgeizig, mit Herz.', en:'The Strong One. Fast, ambitious, with heart.', fr:'Le Fort. Rapide, ambitieux, avec du cœur.' },
  'intro.ch1.text':        { de:'Los geht es auf unserer Erde!<br>Genauer gesagt geht es zuerst auf eine Reise nach <b>Frankreich</b> —<br>in ein wunderschönes Schloss.<br><br>Dort gilt es <b>Startkapital zu erkämpfen</b>,<br>denn ohne Startkapital kein Zoo.',
                              en:'It all begins on our Earth!<br>More precisely, it starts with a journey to <b>France</b> —<br>to a beautiful castle.<br><br>There you must <b>earn starting capital</b>,<br>because without it, there\'s no zoo.',
                              fr:'Tout commence sur notre Terre !<br>Plus précisément, ça commence par un voyage en <b>France</b> —<br>dans un magnifique château.<br><br>Là, il faut <b>gagner un capital de départ</b>,<br>car sans capital, pas de zoo.' },
  'intro.ch2.label':       { de:'Die Herausforderung', en:'The Challenge', fr:'Le Défi' },
  'intro.ch2.title':       { de:'Erkämpfe dein Startkapital', en:'Earn your starting capital', fr:'Gagne ton capital de départ' },
  'intro.ch2.text':        { de:'Es braucht <b>Köpfchen und Ausdauer</b>.<br><br>Aber zusammen ist alles möglich!',
                              en:'It takes <b>brains and stamina</b>.<br><br>But together, anything is possible!',
                              fr:'Il faut de la <b>matière grise et de l\'endurance</b>.<br><br>Mais ensemble, tout est possible !' },
  'intro.ch3.label':       { de:'Der Traum', en:'The Dream', fr:'Le Rêve' },
  'intro.ch3.title':       { de:'Baue deinen eigenen Zoo', en:'Build your own zoo', fr:'Construis ton propre zoo' },
  'intro.ch3.text':        { de:'Mit deinem Startkapital kannst du dich in die <b>nächste Welt teleportieren</b><br>und dort helfen, den <b>intergalaktischen Mega-Zoo</b> zu erschaffen —<br>mit bekannten Tieren aus unserer Welt<br>und mit Kreaturen, die du <b>noch nie gesehen hast</b>...',
                              en:'With your starting capital you can <b>teleport to the next world</b><br>and help create the <b>intergalactic mega-zoo</b> there —<br>with familiar animals from our world<br>and creatures you\'ve <b>never seen before</b>...',
                              fr:'Avec ton capital de départ, tu peux <b>te téléporter dans le monde suivant</b><br>et aider à créer le <b>méga-zoo intergalactique</b> —<br>avec des animaux familiers de notre monde<br>et des créatures que tu n\'as <b>jamais vues</b>...' },
  'intro.ch4.label':       { de:'Zusammen stärker', en:'Stronger together', fr:'Plus forts ensemble' },
  'intro.ch4.title':       { de:'Du bist nicht allein', en:'You are not alone', fr:'Tu n\'es pas seul' },
  'intro.ch4.text':        { de:'Mischa und Janosch zählen auf dich.<br><br><b>Machst du mit?</b><br>Mach den ersten Schritt. <b>Jetzt!</b>',
                              en:'Mischa and Janosch are counting on you.<br><br><b>Will you join in?</b><br>Take the first step. <b>Now!</b>',
                              fr:'Mischa et Janosch comptent sur toi.<br><br><b>Tu participes ?</b><br>Fais le premier pas. <b>Maintenant !</b>' },
  'intro.ch5.label':       { de:'Deine Geschichte beginnt', en:'Your story begins', fr:'Ton histoire commence' },
  'intro.ch5.title':       { de:'Bist du bereit?', en:'Are you ready?', fr:'Es-tu prêt ?' },
  'intro.ch5.text':        { de:'Die Reise beginnt.<br>Lös die Rätsel. Bau den Zoo.<br><br><b>Werde Teil von etwas Grossem.</b>',
                              en:'The journey begins.<br>Solve the puzzles. Build the zoo.<br><br><b>Become part of something big.</b>',
                              fr:'Le voyage commence.<br>Résous les énigmes. Construis le zoo.<br><br><b>Fais partie de quelque chose de grand.</b>' },
  'intro.ch5.btn':         { de:'🚀 Abenteuer starten', en:'🚀 Start Adventure', fr:'🚀 Démarrer l\'Aventure' },
  'intro.end.sub':         { de:'+ Zoo 3D · Das Abenteuer', en:'+ Zoo 3D · The Adventure', fr:'+ Zoo 3D · L\'Aventure' },
  'intro.end.btn':         { de:'▶ Jetzt spielen', en:'▶ Play Now', fr:'▶ Jouer Maintenant' },

  // ── LANGUAGE BONUS POPUP (one-time, after registration) ──
  'langbonus.title':  { de:'Sprach-Bonus erhalten!', en:'Language Bonus received!', fr:'Bonus de langue reçu !' },
  'langbonus.body':   { de:'Weil du {lang} gewählt hast, bekommst du einmalig',
                         en:'Because you chose {lang}, you get a one-time',
                         fr:'Parce que tu as choisi {lang}, tu reçois un bonus unique de' },
  'langbonus.gift':   { de:'geschenkt!', en:'as a gift!', fr:'en cadeau !' },
  'langbonus.btn':    { de:'Super, danke!', en:'Great, thanks!', fr:'Super, merci !' },
  'lang.name.en':     { de:'Englisch', en:'English', fr:'Anglais' },
  'lang.name.fr':     { de:'Französisch', en:'French', fr:'Français' },
};

// Helper: translate shorthand
const t = (key, ...args) => LANG.t(key);

window.LANG = LANG;
window.STRINGS = STRINGS;
window.t = t;

// CRITICAL FIX: load the saved language IMMEDIATELY when this script runs,
// not just after login. Without this, LANG._cur stays at the hardcoded
// default ('de') for any screen shown before login (Welcome, Intro),
// making language selection look broken even though it saved correctly.
LANG.load();
