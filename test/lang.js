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
  'welcome.world1.short':  { de:'🇫🇷 Welt 1: Frankreich', en:'🇫🇷 World 1: France', fr:'🇫🇷 Monde 1 : France' },
  'welcome.world1.desc':   { de:'Spiele 20 verschiedene Spiele und verdiene Mischa Taler (🌀 MT).', en:'Play 20 different games and earn Mischa Coins (🌀 MT).', fr:'Joue à 20 jeux différents et gagne des Mischa Pièces (🌀 MT).' },
  'welcome.world1.detail': { de:'Je besser du spielst, desto mehr MT bekommst du (bis 1.5 MT pro Spiel).', en:'The better you play, the more MT you earn (up to 1.5 MT per game).', fr:'Plus tu joues bien, plus tu gagnes de MT (jusqu\'à 1,5 MT par jeu).' },
  'welcome.world2.title':  { de:'Welt 2 — Zoo-Empire', en:'World 2 — Zoo Empire', fr:'Monde 2 — Empire du Zoo' },
  'welcome.world2.short':  { de:'🦁 Welt 2: Zoo Empire', en:'🦁 World 2: Zoo Empire', fr:'🦁 Monde 2 : Zoo Empire' },
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
  'welcome.world1.body1':   { de:'<b>20 Spiele</b>, verdiene <b>Mischa Taler</b> 🌀.', en:'<b>20 games</b>, earn <b>Mischa Coins</b> 🌀.', fr:'<b>20 jeux</b>, gagne des <b>Mischa Pièces</b> 🌀.' },
  'welcome.world1.body2':   { de:'', en:'', fr:'' },
  'welcome.world1.games':   { de:'🎯 Dart · 🔢 Rechnen · 🧠 Memory · und mehr', en:'🎯 Darts · 🔢 Math · 🧠 Memory · and more', fr:'🎯 Fléchettes · 🔢 Calcul · 🧠 Mémoire · et plus' },
  'welcome.world2.body1':   { de:'Teleportiere für <b>10 MT</b> 🌀 in den Zoo.', en:'Teleport to the Zoo for <b>10 MT</b> 🌀.', fr:'Téléporte-toi au Zoo pour <b>10 MT</b> 🌀.' },
  'welcome.world2.body2':   { de:'', en:'', fr:'' },
  'welcome.world2.feats':   { de:'🚡 Gondelbahn · 🎡 Glücksrad · 🌀 Multiplayer', en:'🚡 Gondola · 🎡 Lucky Wheel · 🌀 Multiplayer', fr:'🚡 Téléphérique · 🎡 Roue de la Chance · 🌀 Multijoueur' },
  'btn.login_short':        { de:'🔑 Anmelden', en:'🔑 Login', fr:'🔑 Connexion' },
  'btn.wallet_short':       { de:'👜 Geldbeutel', en:'👜 Wallet', fr:'👜 Portefeuille' },
  'btn.account_short':      { de:'📊 Konto', en:'📊 Account', fr:'📊 Compte' },

  // ── INTRO STORY (intro.html) ──
  'intro.next':            { de:'Weiter ›', en:'Next ›', fr:'Suivant ›' },
  'intro.ch0.label':       { de:'Prolog', en:'Prologue', fr:'Prologue' },
  'intro.ch0.title':       { de:'Irgendwo in der Welt...', en:'Somewhere in the world...', fr:'Quelque part dans le monde...' },
  'intro.ch0.text':        { de:'Die Brüder <b>Mischa</b> und <b>Janosch</b><br>hatten schon immer einen grossen Traum...<br><br><b>Ihr Traum: den grössten intergalaktischen Zoo zu bauen...</b><br><br>Dazu brauchen sie <b>Deine Hilfe!</b><br><br>⏳ <b>Achtung:</b> Das Abenteuer dauert nur bis zum <b>14. August 2026, 18 Uhr</b> — wer dann vorne liegt, gewinnt!',
                              en:'The brothers <b>Mischa</b> and <b>Janosch</b><br>always had a big dream...<br><br><b>Their dream: to build the biggest intergalactic zoo...</b><br><br>To do that, they need <b>your help!</b><br><br>⏳ <b>Heads up:</b> The adventure only runs until <b>August 14, 2026, 6 PM</b> — whoever is in the lead then wins!',
                              fr:'Les frères <b>Mischa</b> et <b>Janosch</b><br>ont toujours eu un grand rêve...<br><br><b>Leur rêve : construire le plus grand zoo intergalactique...</b><br><br>Pour cela, ils ont besoin de <b>ton aide !</b><br><br>⏳ <b>Attention :</b> L\'aventure ne dure que jusqu\'au <b>14 août 2026, 18h</b> — celui qui sera en tête à ce moment-là gagne !' },
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

  // ── WORLD-1 GAME LIST SCREEN ──
  'gamelist.back':        { de:'◀ Welten', en:'◀ Worlds', fr:'◀ Mondes' },
  'gamelist.wardrobe':    { de:'👗 Kleider', en:'👗 Wardrobe', fr:'👗 Garde-robe' },
  'gamelist.joker':       { de:'Joker', en:'Joker', fr:'Joker' },
  'gamelist.next_task':   { de:'Tippe auf die nächste Aufgabe:', en:'Tap the next task:', fr:'Touche la prochaine tâche :' },
  'gamelist.done_of20':   { de:'geschafft', en:'done', fr:'réussi' },
  'gamelist.font_hint_t': { de:'Schrift zu klein?', en:'Text too small?', fr:'Texte trop petit ?' },
  'gamelist.font_hint_b': { de:'Schrift optimieren — 10 Stufen, ~30 Sek.', en:'Optimize text size — 10 steps, ~30 sec.', fr:'Optimiser la taille du texte — 10 étapes, ~30 s.' },

  // ── MINI-GAME INSTRUCTIONS (shown before each game starts) ──
  'instr.dart':        { de:'🎯 <b>Dart!</b><br>Wirf 3 Pfeile auf die Scheibe. Klicke oder tippe auf die Scheibe — je näher zur Mitte, desto mehr Punkte!<br>📱 Handy/Tablet: Das Steuerkreuz rechts neben der Scheibe zum Zielen nutzen, loslassen = Wurf.',
    en:'🎯 <b>Darts!</b><br>Throw 3 darts at the board. Click or tap the board — the closer to the center, the more points!<br>📱 Phone/Tablet: use the control pad next to the board to aim, release = throw.',
    fr:'🎯 <b>Fléchettes !</b><br>Lance 3 fléchettes sur la cible. Clique ou touche la cible — plus tu es près du centre, plus tu marques de points !<br>📱 Téléphone/Tablette : utilise la croix de direction à côté de la cible pour viser, relâche = lancer.' },
  'instr.math':        { de:'🔢 <b>Rechnen!</b><br>Löse Mathe-Aufgaben so schnell wie möglich. Tippe die richtige Antwort ein und bestätige mit Enter.',
    en:'🔢 <b>Math!</b><br>Solve math problems as fast as you can. Type the correct answer and confirm with Enter.',
    fr:'🔢 <b>Calcul !</b><br>Résous des problèmes de maths le plus vite possible. Tape la bonne réponse et valide avec Entrée.' },
  'instr.reaction':    { de:'⚡ <b>Reaktion!</b><br>Drücke den Knopf so schnell wie möglich, sobald das Signal erscheint. Warte auf grün!',
    en:'⚡ <b>Reaction!</b><br>Press the button as fast as you can as soon as the signal appears. Wait for green!',
    fr:'⚡ <b>Réaction !</b><br>Appuie sur le bouton le plus vite possible dès que le signal apparaît. Attends le vert !' },
  'instr.memory':      { de:'🧠 <b>Memory!</b><br>Finde alle Paare! Drehe zwei Karten um — stimmen sie überein, bleiben sie offen.',
    en:'🧠 <b>Memory!</b><br>Find all the pairs! Flip two cards — if they match, they stay open.',
    fr:'🧠 <b>Memory !</b><br>Trouve toutes les paires ! Retourne deux cartes — si elles correspondent, elles restent ouvertes.' },
  'instr.train':       { de:'🚂 <b>Zug!</b><br>Lenke den Zug ans Ziel. Tippe auf die Weichen, um die Richtung zu ändern.',
    en:'🚂 <b>Train!</b><br>Guide the train to its destination. Tap the switches to change direction.',
    fr:'🚂 <b>Train !</b><br>Guide le train jusqu\'à destination. Touche les aiguillages pour changer de direction.' },
  'instr.shutthebox':  { de:'🎲 <b>Shut the Box!</b><br>Würfle und lege Zahlen um, deren Summe der Würfelzahl entspricht. Lege alle Zahlen um!',
    en:'🎲 <b>Shut the Box!</b><br>Roll the dice and flip down numbers that add up to the roll. Flip down every number!',
    fr:'🎲 <b>Shut the Box !</b><br>Lance les dés et rabats des nombres dont la somme correspond au résultat. Rabats tous les nombres !' },
  'instr.sokoban':     { de:'📦 <b>Sokoban!</b><br>Schiebe die Kisten auf die markierten Zielfelder. Du kannst Kisten nur schieben, nicht ziehen!',
    en:'📦 <b>Sokoban!</b><br>Push the boxes onto the marked target spots. You can only push boxes, not pull them!',
    fr:'📦 <b>Sokoban !</b><br>Pousse les caisses sur les cases cibles marquées. Tu ne peux que pousser les caisses, pas les tirer !' },
  'instr.jenga':       { de:'🏎️ <b>Race — 1km Rennen!</b><br>Fahre 1 km so schnell wie möglich.<br>📱 Mobile: Gas / Bremse / Drehen-Buttons<br>🖥️ Desktop: → Gas · ← Bremse · ↑ Drehen CW · ↓ Drehen CCW<br>Springe über Hügel — Überschlag = Ende!',
    en:'🏎️ <b>Race — 1km Race!</b><br>Drive 1 km as fast as you can.<br>📱 Mobile: Gas / Brake / Rotate buttons<br>🖥️ Desktop: → Gas · ← Brake · ↑ Rotate CW · ↓ Rotate CCW<br>Jump over hills — flipping over = game over!',
    fr:'🏎️ <b>Course — 1 km de course !</b><br>Parcours 1 km le plus vite possible.<br>📱 Mobile : boutons Accélérer / Freiner / Tourner<br>🖥️ Ordinateur : → Accélérer · ← Freiner · ↑ Tourner (horaire) · ↓ Tourner (antihoraire)<br>Saute par-dessus les collines — un tonneau = fin de partie !' },
  'instr.stunt':       { de:'🏎️ <b>Race — 1km Rennen!</b><br>Fahre 1 km so schnell wie möglich.<br>📱 Mobile: Gas / Bremse / Drehen-Buttons<br>🖥️ Desktop: → Gas · ← Bremse · ↑ Drehen CW · ↓ Drehen CCW<br>Springe über Hügel — Überschlag = Ende!',
    en:'🏎️ <b>Race — 1km Race!</b><br>Drive 1 km as fast as you can.<br>📱 Mobile: Gas / Brake / Rotate buttons<br>🖥️ Desktop: → Gas · ← Brake · ↑ Rotate CW · ↓ Rotate CCW<br>Jump over hills — flipping over = game over!',
    fr:'🏎️ <b>Course — 1 km de course !</b><br>Parcours 1 km le plus vite possible.<br>📱 Mobile : boutons Accélérer / Freiner / Tourner<br>🖥️ Ordinateur : → Accélérer · ← Freiner · ↑ Tourner (horaire) · ↓ Tourner (antihoraire)<br>Saute par-dessus les collines — un tonneau = fin de partie !' },
  'instr.slider':      { de:'🧩 <b>Schiebepuzzle!</b><br>Schiebe die Teile, bis das Bild vollständig ist. Tippe auf ein Teil neben dem Leerfeld, um es zu verschieben.',
    en:'🧩 <b>Sliding Puzzle!</b><br>Slide the pieces until the picture is complete. Tap a piece next to the empty space to move it.',
    fr:'🧩 <b>Puzzle coulissant !</b><br>Fais glisser les pièces jusqu\'à ce que l\'image soit complète. Touche une pièce à côté de la case vide pour la déplacer.' },
  'instr.wordsearch':  { de:'🔤 <b>Wortsuche!</b><br>Finde alle versteckten Wörter im Buchstabengitter. Wische über die Buchstaben.',
    en:'🔤 <b>Word Search!</b><br>Find all the hidden words in the letter grid. Swipe across the letters.',
    fr:'🔤 <b>Recherche de mots !</b><br>Trouve tous les mots cachés dans la grille de lettres. Glisse sur les lettres.' },
  'instr.typing':      { de:'🟩 <b>Tetris!</b><br>Bewege und drehe fallende Blöcke, um vollständige Reihen zu bilden.<br>📱 Mobile: Buttons zum Steuern<br>🖥️ Desktop: ← → bewegen · ↑ oder Leertaste drehen · ↓ schneller fallen lassen.',
    en:'🟩 <b>Tetris!</b><br>Move and rotate the falling blocks to form complete rows.<br>📱 Mobile: buttons to control<br>🖥️ Desktop: ← → move · ↑ or Space to rotate · ↓ drop faster.',
    fr:'🟩 <b>Tetris !</b><br>Déplace et fais pivoter les blocs qui tombent pour former des rangées complètes.<br>📱 Mobile : boutons pour contrôler<br>🖥️ Ordinateur : ← → déplacer · ↑ ou Espace pour pivoter · ↓ faire tomber plus vite.' },
  'instr.balloon':     { de:'🐍 <b>Snake!</b><br>Steuere die Schlange mit den Pfeiltasten oder Wischen. Friss Äpfel, werde länger — berühre nicht dich selbst!',
    en:'🐍 <b>Snake!</b><br>Steer the snake with the arrow keys or by swiping. Eat apples to grow longer — don\'t touch yourself!',
    fr:'🐍 <b>Snake !</b><br>Dirige le serpent avec les touches fléchées ou en glissant. Mange des pommes pour grandir — ne te touche pas toi-même !' },
  'instr.simon':       { de:'🎨 <b>Simon!</b><br>Merke dir die Farbfolge und wiederhole sie. Wird nach jeder Runde länger.',
    en:'🎨 <b>Simon!</b><br>Remember the color sequence and repeat it. It gets longer every round.',
    fr:'🎨 <b>Simon !</b><br>Mémorise la séquence de couleurs et reproduis-la. Elle s\'allonge à chaque tour.' },
  'instr.truefalse':   { de:'❓ <b>Wahr oder Falsch?</b><br>Beantworte Fragen mit Wahr oder Falsch. Tippe auf den richtigen Knopf.',
    en:'❓ <b>True or False?</b><br>Answer questions with True or False. Tap the correct button.',
    fr:'❓ <b>Vrai ou Faux ?</b><br>Réponds aux questions par Vrai ou Faux. Touche le bon bouton.' },
  'instr.anagram':     { de:'🔤 <b>Anagramm!</b><br>Ordne die durcheinander gewürfelten Buchstaben zum richtigen Wort.',
    en:'🔤 <b>Anagram!</b><br>Rearrange the scrambled letters to form the correct word.',
    fr:'🔤 <b>Anagramme !</b><br>Réorganise les lettres mélangées pour former le bon mot.' },
  'instr.colormix':    { de:'🎨 <b>Farben mischen!</b><br>Mische die richtigen Farben, um den gewünschten Farbton zu erreichen.',
    en:'🎨 <b>Color Mixing!</b><br>Mix the right colors to reach the target shade.',
    fr:'🎨 <b>Mélange de couleurs !</b><br>Mélange les bonnes couleurs pour obtenir la teinte demandée.' },
  'instr.clock':       { de:'🕐 <b>Uhr!</b><br>Stelle die Uhrzeiger auf die angezeigte Zeit.',
    en:'🕐 <b>Clock!</b><br>Set the clock hands to the displayed time.',
    fr:'🕐 <b>Horloge !</b><br>Règle les aiguilles sur l\'heure indiquée.' },
  'instr.flags':       { de:'🌍 <b>Flaggen!</b><br>Erkenne die Flagge und wähle das richtige Land.',
    en:'🌍 <b>Flags!</b><br>Recognize the flag and choose the correct country.',
    fr:'🌍 <b>Drapeaux !</b><br>Reconnais le drapeau et choisis le bon pays.' },
  'instr.hangman':     { de:'🎯 <b>Hangman!</b><br>Errate das versteckte Wort Buchstabe für Buchstabe.',
    en:'🎯 <b>Hangman!</b><br>Guess the hidden word letter by letter.',
    fr:'🎯 <b>Pendu !</b><br>Devine le mot caché lettre par lettre.' },
  'instr.tictactoe':   { de:'❌ <b>Tic-Tac-Toe!</b><br>Setze 3 in einer Reihe gegen den Computer.',
    en:'❌ <b>Tic-Tac-Toe!</b><br>Get 3 in a row against the computer.',
    fr:'❌ <b>Morpion !</b><br>Aligne 3 symboles contre l\'ordinateur.' },
  'instr.weight':      { de:'⚖️ <b>Gewichte!</b><br>Schätze welche Seite der Waage schwerer ist.',
    en:'⚖️ <b>Weights!</b><br>Guess which side of the scale is heavier.',
    fr:'⚖️ <b>Poids !</b><br>Devine quel côté de la balance est le plus lourd.' },
  'instr.basketball':  { de:'🏀 <b>Basketball!</b><br>Wirf den Ball ins Korb — tippe auf den Knopf im richtigen Moment.',
    en:'🏀 <b>Basketball!</b><br>Shoot the ball into the hoop — tap the button at the right moment.',
    fr:'🏀 <b>Basketball !</b><br>Lance le ballon dans le panier — touche le bouton au bon moment.' },
  'instr.emojistory':  { de:'📖 <b>Emoji Story!</b><br>Errate die Geschichte oder den Film hinter den Emojis.',
    en:'📖 <b>Emoji Story!</b><br>Guess the story or movie behind the emojis.',
    fr:'📖 <b>Histoire en emojis !</b><br>Devine l\'histoire ou le film derrière les emojis.' },
  'instr.geo':         { de:'🗺️ <b>Geografie!</b><br>Zeige auf die richtige Position auf der Karte.',
    en:'🗺️ <b>Geography!</b><br>Point to the correct location on the map.',
    fr:'🗺️ <b>Géographie !</b><br>Montre le bon endroit sur la carte.' },
  'instr.french':      { de:'🇫🇷 <b>Französisch!</b><br>Übersetze die Wörter von Deutsch nach Französisch.',
    en:'🇫🇷 <b>French!</b><br>Translate the words from German to French.',
    fr:'🇫🇷 <b>Français !</b><br>Traduis les mots de l\'allemand vers le français.' },
  'instr.riddle':      { de:'🧩 <b>Rätsel!</b><br>Löse das Rätsel und tippe deine Antwort ein.',
    en:'🧩 <b>Riddle!</b><br>Solve the riddle and type your answer.',
    fr:'🧩 <b>Énigme !</b><br>Résous l\'énigme et tape ta réponse.' },
  'instr.pacman':      { de:'🟡 <b>Pac-Man!</b><br>Friss alle Punkte im Labyrinth! Vermeide die Geister — oder friss sie nach einem Power-Pellet (grosser Punkt).<br>📱 Mobile: 4 Richtungstasten oder Gerät neigen (Button oben)<br>🖥️ Desktop: Pfeiltasten',
    en:'🟡 <b>Pac-Man!</b><br>Eat all the dots in the maze! Avoid the ghosts — or eat them after a power pellet (big dot).<br>📱 Mobile: 4 direction buttons or tilt your device (button above)<br>🖥️ Desktop: arrow keys',
    fr:'🟡 <b>Pac-Man !</b><br>Mange tous les points du labyrinthe ! Évite les fantômes — ou mange-les après un super-gomme (gros point).<br>📱 Mobile : 4 touches de direction ou incline l\'appareil (bouton en haut)<br>🖥️ Ordinateur : touches fléchées' },
  'instr.starwars':    { de:'🚀 <b>Star Wars — Weltraum-Shooter!</b><br>Schiesse die feindlichen Raumschiffe ab, bevor sie landen! Du hast 3 Leben.<br>📱 Mobile: ◀ ▶ zum Bewegen, Schiessen-Button<br>🖥️ Desktop: ← → bewegen, Leertaste schiessen',
    en:'🚀 <b>Star Wars — Space Shooter!</b><br>Shoot down the enemy ships before they land! You have 3 lives.<br>📱 Mobile: ◀ ▶ to move, Fire button<br>🖥️ Desktop: ← → move, Spacebar to fire',
    fr:'🚀 <b>Star Wars — Tireur spatial !</b><br>Abats les vaisseaux ennemis avant qu\'ils n\'atterrissent ! Tu as 3 vies.<br>📱 Mobile : ◀ ▶ pour te déplacer, bouton Tirer<br>🖥️ Ordinateur : ← → se déplacer, Espace pour tirer' },
  'instr.pong':        { de:'🏓 <b>Pong — Tennis-Klassiker!</b><br>Der Ball wird mit der Zeit SCHNELLER — reagiere rechtzeitig! Erste 7 Punkte gewinnt oder wer nach 60s mehr hat.<br>📱 Mobile: ▲ ▼ Buttons<br>🖥️ Desktop: ↑ ↓ Pfeiltasten',
    en:'🏓 <b>Pong — Classic Tennis!</b><br>The ball gets FASTER over time — react in time! First to 7 points wins, or whoever has more after 60s.<br>📱 Mobile: ▲ ▼ buttons<br>🖥️ Desktop: ↑ ↓ arrow keys',
    fr:'🏓 <b>Pong — Le classique du tennis !</b><br>La balle devient de plus en plus RAPIDE — réagis à temps ! Le premier à 7 points gagne, ou celui qui en a le plus après 60s.<br>📱 Mobile : boutons ▲ ▼<br>🖥️ Ordinateur : touches fléchées ↑ ↓' },
  'instr.fallback':    { de:'🎮 <b>Los geht\'s!</b><br>Spiele das Spiel so gut du kannst!',
    en:'🎮 <b>Let\'s go!</b><br>Play the game as well as you can!',
    fr:'🎮 <b>C\'est parti !</b><br>Joue le mieux possible !' },

  // ── SHARED IN-GAME UI (reused across many of the 20 mini-games) ──
  'game.continue':     { de:'Weiter ➜', en:'Next ➜', fr:'Suivant ➜' },
  'game.you':          { de:'Du', en:'You', fr:'Toi' },
  'game.cpu':          { de:'CPU', en:'CPU', fr:'Ordi' },
  'game.wait':         { de:'warte', en:'waiting', fr:'attente' },
  'game.remaining':    { de:'Rest:', en:'Left:', fr:'Reste :' },

  // ── DART ──
  'dart.wind.calm':    { de:'Windstill', en:'Calm', fr:'Calme' },
  'dart.wind.light':   { de:'Leichte Brise', en:'Light breeze', fr:'Brise légère' },
  'dart.wind.moderate':{ de:'Mäßig', en:'Moderate', fr:'Modéré' },
  'dart.wind.strong':  { de:'Stark', en:'Strong', fr:'Fort' },
  'dart.wind.storm':   { de:'Sturm', en:'Storm', fr:'Tempête' },
  'dart.dart_n':       { de:'Pfeil', en:'Dart', fr:'Fléchette' },
  'dart.doubleout_warn':{ de:'⚠️ Double-Out! Letzter Pfeil muss Double oder Bull treffen!', en:'⚠️ Double-Out! Last dart must hit a Double or Bull!', fr:'⚠️ Double sortie ! La dernière fléchette doit toucher un Double ou le centre !' },
  'dart.you_won':      { de:'Du hast gewonnen!', en:'You won!', fr:'Tu as gagné !' },
  'dart.cpu_won':      { de:'CPU hat gewonnen!', en:'CPU won!', fr:'L\'ordi a gagné !' },
  'dart.rematch':      { de:'🔄 Revanche!', en:'🔄 Rematch!', fr:'🔄 Revanche !' },
  'dart.release_throw':{ de:'los=Wurf', en:'release=throw', fr:'relâcher=lancer' },
  'dart.cpu_throwing': { de:'CPU wirft...', en:'CPU is throwing...', fr:'L\'ordi lance...' },

  // ── MATH ──
  'math.task_n':       { de:'Aufgabe', en:'Question', fr:'Question' },
  'math.errors':        { de:'Fehler', en:'errors', fr:'erreurs' },
  'math.times_table_hint': { de:'💡 Mal-Reihe!', en:'💡 Times table!', fr:'💡 Table de multiplication !' },
  'math.correct_n':     { de:'richtig!', en:'correct!', fr:'bonnes réponses !' },
  'math.time':          { de:'Zeit', en:'Time', fr:'Temps' },
  'math.points':        { de:'Punkte', en:'Points', fr:'Points' },
  'math.great_job':     { de:'Super gemacht! 🏆', en:'Great job! 🏆', fr:'Super boulot ! 🏆' },
  'math.need_6_of_10':  { de:'Mindestens 6/10 für die nächste Aufgabe!', en:'At least 6/10 needed for the next task!', fr:'Au moins 6/10 pour passer à la tâche suivante !' },
  'math.try_again':     { de:'🔄 Nochmal', en:'🔄 Try again', fr:'🔄 Recommencer' },
  'math.continue_anyway': { de:'Trotzdem weiter ➜', en:'Continue anyway ➜', fr:'Continuer quand même ➜' },

  // ── MEMORY ──
  'memory.found':       { de:'Gefunden:', en:'Found:', fr:'Trouvées :' },
  'memory.attempts':    { de:'Versuche:', en:'Attempts:', fr:'Essais :' },
  'memory.all_found':   { de:'Alle Paare gefunden!', en:'All pairs found!', fr:'Toutes les paires trouvées !' },
  'memory.mistakes':    { de:'Fehlversuche', en:'Mistakes', fr:'Erreurs' },

  // ── REACTION ──
  'reaction.round':     { de:'Runde', en:'Round', fr:'Manche' },
  'reaction.legend':    { de:'🟢 = Tippen · 🔴 = NICHT tippen', en:'🟢 = Tap · 🔴 = DO NOT tap', fr:'🟢 = Toucher · 🔴 = NE PAS toucher' },
  'reaction.too_slow':  { de:'Zu langsam!', en:'Too slow!', fr:'Trop lent !' },
  'reaction.dont_tap':  { de:'Falsch! Nicht tippen!', en:'Wrong! Don\'t tap!', fr:'Faux ! Ne touche pas !' },
  'reaction.avg':       { de:'Ø Reaktion', en:'Avg. reaction', fr:'Moy. réaction' },

  // ── TRUE/FALSE ──
  'tf.question_n':     { de:'Frage', en:'Question', fr:'Question' },
  'tf.true':            { de:'✅ Wahr', en:'✅ True', fr:'✅ Vrai' },
  'tf.false':           { de:'❌ Falsch', en:'❌ False', fr:'❌ Faux' },
  'tf.correct':         { de:'✅ Richtig!', en:'✅ Correct!', fr:'✅ Correct !' },
  'tf.wrong_answer_was':{ de:'❌ Falsch! Die Antwort war:', en:'❌ Wrong! The answer was:', fr:'❌ Faux ! La réponse était :' },
  'tf.answer_true':     { de:'Wahr', en:'True', fr:'Vrai' },
  'tf.answer_false':    { de:'Falsch', en:'False', fr:'Faux' },

  // ── SHUT THE BOX ──
  'stb.roll_n':         { de:'Wurf', en:'Roll', fr:'Lancer' },
  'stb.open':           { de:'Offen:', en:'Open:', fr:'Ouvert :' },
  'stb.roll_dice':      { de:'Würfeln!', en:'Roll!', fr:'Lancer !' },
  'stb.no_move':        { de:'❌ Kein Zug möglich! Spiel endet.', en:'❌ No move possible! Game over.', fr:'❌ Aucun coup possible ! Fin de partie.' },
  'stb.choose_sum':      { de:'Wähle Zahlen die zusammen', en:'Choose numbers that add up to', fr:'Choisis des nombres qui font ensemble' },
  'stb.close':          { de:'✅ Schliessen', en:'✅ Close', fr:'✅ Fermer' },
  'stb.cancel':         { de:'✕ Abbrechen', en:'✕ Cancel', fr:'✕ Annuler' },

  // ── SOKOBAN ──
  'sokoban.controls':  { de:'Pfeiltasten/WASD · Z=Rückgängig · Wischen', en:'Arrow keys/WASD · Z=Undo · Swipe', fr:'Flèches/WASD · Z=Annuler · Glisser' },

  // ── SIMON ──
  'simon.watch':        { de:'👀 Schau zu!', en:'👀 Watch!', fr:'👀 Regarde !' },
  'simon.your_turn':    { de:'👆 Deine Reihe!', en:'👆 Your turn!', fr:'👆 À toi !' },
  'simon.watch_sequence': { de:'Schau dir die Reihenfolge an!', en:'Watch the sequence!', fr:'Regarde la séquence !' },
  'simon.repeat_sequence': { de:'Tippe in der gleichen Reihenfolge!', en:'Tap in the same order!', fr:'Touche dans le même ordre !' },
  'simon.rounds_done':  { de:'Runden geschafft!', en:'rounds completed!', fr:'manches réussies !' },
  'simon.rounds':       { de:'Runden', en:'Rounds', fr:'Manches' },

  // ── COLORMIX ──
  'colormix.which_two': { de:'Welche 2 Farben ergeben zusammen...', en:'Which 2 colors together make...', fr:'Quelles 2 couleurs donnent ensemble...' },
  'colormix.pick_two':  { de:'Wähle 2 Farben!', en:'Pick 2 colors!', fr:'Choisis 2 couleurs !' },
  'colormix.wrong_correct_is': { de:'Falsch! Richtig:', en:'Wrong! Correct:', fr:'Faux ! Bonne réponse :' },

  // ── SLIDER ──
  'slider.moves':       { de:'Züge:', en:'Moves:', fr:'Coups :' },
  'slider.moves_label': { de:'Züge', en:'Moves', fr:'Coups' },
  'slider.hint':        { de:'Grün = am richtigen Platz ✅ · Tippe auf Nachbarfeld zum Schieben', en:'Green = in the right place ✅ · Tap an adjacent tile to slide', fr:'Vert = à la bonne place ✅ · Touche une case voisine pour glisser' },
  'slider.shuffle':     { de:'Neu mischen', en:'Shuffle again', fr:'Remélanger' },
  'slider.solved':      { de:'Puzzle gelöst!', en:'Puzzle solved!', fr:'Puzzle résolu !' },

  // ── SNAKE ──
  'snake.mode_buttons': { de:'🎮 Tasten', en:'🎮 Buttons', fr:'🎮 Boutons' },
  'snake.mode_tilt':    { de:'📱 Neigen', en:'📱 Tilt', fr:'📱 Inclinaison' },
  'snake.tilt_hint':    { de:'📱 Gerät neigen zum Steuern', en:'📱 Tilt your device to steer', fr:'📱 Incline l\'appareil pour diriger' },
  'snake.controls':     { de:'Pfeiltasten / Wischen / Neigen', en:'Arrow keys / Swipe / Tilt', fr:'Flèches / Glisser / Incliner' },
  'snake.sens_fine':    { de:'📶 Fein', en:'📶 Fine', fr:'📶 Fin' },
  'snake.sens_coarse':  { de:'📶 Grob', en:'📶 Coarse', fr:'📶 Brut' },

  // ── RACE (stunt/jenga) ──
  'race.goal':          { de:'ZIEL', en:'GOAL', fr:'BUT' },
  'race.starting':      { de:'Anfahren...', en:'Starting...', fr:'Démarrage...' },
  'race.crash':         { de:'💥 CRASH! Neu anfahren...', en:'💥 CRASH! Starting over...', fr:'💥 CRASH ! On redémarre...' },

  // ── PAC-MAN ──
  'pacman.hold_steady': { de:'gerade halten', en:'hold steady', fr:'tenir droit' },

  // ── STAR WARS ──
  'starwars.wave':      { de:'WELLE', en:'WAVE', fr:'VAGUE' },

  // ── PONG ──
  'pong.faster_in':     { de:'⚡ schneller in', en:'⚡ faster in', fr:'⚡ plus rapide dans' },

  // ── ANAGRAM ──
  'anagram.word_n':     { de:'Wort', en:'Word', fr:'Mot' },
  'anagram.tap_order':  { de:'Tippe die Buchstaben in der richtigen Reihenfolge!', en:'Tap the letters in the right order!', fr:'Touche les lettres dans le bon ordre !' },
  'anagram.reset':      { de:'🔄 Zurücksetzen', en:'🔄 Reset', fr:'🔄 Réinitialiser' },
  'anagram.words_n':    { de:'Wörter!', en:'words!', fr:'mots !' },

  // ── WORD SEARCH ──
  'wordsearch.swipe_hint': { de:'Wische über die Buchstaben um ein Wort zu markieren!', en:'Swipe across the letters to mark a word!', fr:'Glisse sur les lettres pour marquer un mot !' },
  'wordsearch.found':   { de:'gefunden!', en:'found!', fr:'trouvé !' },
  'wordsearch.not_a_word': { de:'❌ Kein Wort — versuche nochmal!', en:'❌ Not a word — try again!', fr:'❌ Pas un mot — réessaie !' },
  'wordsearch.all_found': { de:'Alle Wörter gefunden!', en:'All words found!', fr:'Tous les mots trouvés !' },

  // ── FRENCH ──
  'french.level_beginner':     { de:'Stufe: Anfänger', en:'Level: Beginner', fr:'Niveau : Débutant' },
  'french.level_basic':        { de:'Stufe: Grundkenntnisse', en:'Level: Basic', fr:'Niveau : Bases' },
  'french.level_intermediate': { de:'Stufe: Mittelstufe', en:'Level: Intermediate', fr:'Niveau : Intermédiaire' },
  'french.level_advanced':     { de:'Stufe: Fortgeschritten', en:'Level: Advanced', fr:'Niveau : Avancé' },

  // ── RANK NOTIFICATIONS ──
  'rank.now_first':    { de:'🎉 Du bist jetzt Platz 1!', en:'🎉 You\'re now #1!', fr:'🎉 Tu es maintenant 1er !' },
  'rank.now_place':    { de:'📈 Du bist jetzt Platz {n}!', en:'📈 You\'re now #{n}!', fr:'📈 Tu es maintenant {n}e !' },
  'rank.now_place_down': { de:'📉 Du bist jetzt Platz {n}.', en:'📉 You\'re now #{n}.', fr:'📉 Tu es maintenant {n}e.' },
  'rank.you_passed':   { de:'Du hast {name} überholt!', en:'You passed {name}!', fr:'Tu as dépassé {name} !' },
  'rank.passed_you':   { de:'{name} hat dich überholt!', en:'{name} passed you!', fr:'{name} t\'a dépassé !' },
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
