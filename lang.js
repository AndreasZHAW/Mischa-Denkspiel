// Mischa Denkspiel — Language System
// Supports: de (Deutsch), en (English), fr (Français)
const LANG = {
  _cur: 'de',
  
  load() {
    try { this._cur = localStorage.getItem('mischa_lang') || 'de'; } catch(e) {}
    document.documentElement.lang = this._cur;
  },
  
  set(lang) {
    this._cur = lang;
    try { localStorage.setItem('mischa_lang', lang); } catch(e) {}
    document.documentElement.lang = lang;
    // Reload page to apply
    location.reload();
  },
  
  t(key) {
    const entry = STRINGS[key];
    if (!entry) return key;
    return entry[this._cur] || entry.de || key;
  },
  
  // Bonus MT for non-German speakers
  getBonus() {
    return this._cur !== 'de' ? 1 : 0;
  },
  
  // Flag emoji for current language
  flag() {
    return {de:'🇩🇪', en:'🇬🇧', fr:'🇫🇷'}[this._cur] || '🇩🇪';
  },
  
  // Language selector HTML
  selectorHTML(small) {
    const langs = [{id:'de',flag:'🇩🇪',name:'Deutsch'},{id:'en',flag:'🇬🇧',name:'English'},{id:'fr',flag:'🇫🇷',name:'Français'}];
    if(small) {
      return langs.map(l=>`<button onclick="LANG.set('${l.id}')" style="background:${l.id===LANG._cur?'rgba(255,255,255,.25)':'rgba(255,255,255,.08)'};border:1px solid rgba(255,255,255,${l.id===LANG._cur?'.5':'.15'});color:#fff;padding:5px 10px;border-radius:8px;cursor:pointer;font-size:.85rem">${l.flag} ${l.name}</button>`).join('');
    }
    return '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">'+
      langs.map(l=>`<button onclick="LANG.set('${l.id}')" style="background:${l.id===LANG._cur?'rgba(255,255,255,.2)':'rgba(255,255,255,.07)'};border:2px solid ${l.id===LANG._cur?'rgba(255,255,255,.6)':'rgba(255,255,255,.15)'};color:#fff;padding:8px 16px;border-radius:10px;cursor:pointer;font-size:.9rem;font-weight:${l.id===LANG._cur?'900':'400'}">${l.flag} ${l.name}${l.id!=='de'?' +1 MT':''}</button>`).join('')+
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
  'zoo.rebirth':           { de:'Rebirth', en:'Rebirth', fr:'Renaissance' },
  'zoo.shop':              { de:'Shop', en:'Shop', fr:'Boutique' },
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
  'gond.title':            { de:'Gondelbahn', en:'Gondola Station', fr:'Station du Téléphérique' },
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
  'sound.arcade':          { de:'Arcade', en:'Arcade', fr:'Arcade' },
  'sound.arcade.desc':     { de:'Retro 8-Bit Töne', en:'Retro 8-Bit Sounds', fr:'Sons Rétro 8-Bit' },
  'sound.normal':          { de:'Normal', en:'Normal', fr:'Normal' },
  'sound.normal.desc':     { de:'Standard Töne', en:'Standard Sounds', fr:'Sons Standards' },
  'sound.satisfying':      { de:'Satisfying', en:'Satisfying', fr:'Satisfaisant' },
  'sound.satisfying.desc': { de:'Weiche, angenehme Töne', en:'Soft, pleasant sounds', fr:'Sons doux et agréables' },

  // ── REBIRTH ──
  'reb.title':             { de:'Wiedergeburt', en:'Rebirth', fr:'Renaissance' },
  'reb.btn':               { de:'🔄 Wiedergeburt!', en:'🔄 Rebirth!', fr:'🔄 Renaissance !' },
  'reb.cant':              { de:'Noch nicht möglich', en:'Not possible yet', fr:'Pas encore possible' },
  'reb.mult':              { de:'Neuer Multiplikator', en:'New Multiplier', fr:'Nouveau Multiplicateur' },

  // ── CHEST ──
  'chest.open':            { de:'ÖFFNEN', en:'OPEN', fr:'OUVRIR' },
  'chest.claim':           { de:'Super! ➜', en:'Great! ➜', fr:'Super ! ➜' },
  'chest.ready':           { de:'✨ Bereit zum Öffnen!', en:'✨ Ready to open!', fr:'✨ Prêt à ouvrir !' },
  'chest.tap':             { de:'👆 Tippe', en:'👆 Tap', fr:'👆 Appuie' },
  'chest.to_open':         { de:'× zum Öffnen!', en:'× to open!', fr:'× pour ouvrir !' },
  'chest.rewards':         { de:'🎁 Belohnungs-Truhen', en:'🎁 Reward Chests', fr:'🎁 Coffres de Récompenses' },
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
  'jump.question':         { de:'🏃 Jump-Event läuft! Zur Obby teleportieren?', en:'🏃 Jump Event active! Teleport to Obby?', fr:'🏃 Jump Event actif ! Téléporter vers l\'Obby ?' },
  'jump.yes':              { de:'✅ Ja', en:'✅ Yes', fr:'✅ Oui' },
  'jump.no':               { de:'❌ Nein', en:'❌ No', fr:'❌ Non' },
  'jump.goal':             { de:'🏃 Obby · Ziel erreichen!', en:'🏃 Obby · Reach the goal!', fr:'🏃 Obby · Atteins l\'objectif !' },
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
};

// Helper: translate shorthand
const t = (key, ...args) => LANG.t(key);

window.LANG = LANG;
window.STRINGS = STRINGS;
window.t = t;
