// Mischa Denkspiel — Language System
// Supports: de (Jugendsprache/Standard-Deutsch), de_simple (einfaches Deutsch
// für Eltern/Grosseltern — erklärt Denglisch-Begriffe wie "Jump-Event"),
// en (English), fr (Français)
const LANG = {
  _cur: 'de_simple',
  
  load() {
    try { this._cur = localStorage.getItem('mischa_lang') || 'de_simple'; } catch(e) {}
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
    return {de:'😎', de_simple:'🇩🇪', en:'🇬🇧', fr:'🇫🇷', it:'🇮🇹'}[this._cur] || '🇩🇪';
  },
  
  // Language selector HTML
  selectorHTML(small) {
    const langs = [
      {id:'de',        flag:'😎', name:'Jugendsprache'},
      {id:'de_simple',  flag:'🇩🇪', name:'Deutsch'},
      {id:'en',        flag:'🇬🇧', name:'English'},
      {id:'fr',        flag:'🇫🇷', name:'Français'},
      {id:'it',        flag:'🇮🇹', name:'Italiano'},
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
  'welcome.title':         { de:'Yo, willkommen, Abenteurer!', de_simple:'Willkommen, Abenteurer', en:'Welcome, Adventurer', fr:'Bienvenue, Aventurier' , it:'Ehi, benvenuto, avventuriero!'},
  'welcome.subtitle':      { de:'2 Welten · Verdien dir 🌀 MT · Bau deinen Zoo — richtig krass!', de_simple:'2 Welten · Verdiene 🌀 MT · Baue deinen Zoo!', en:'2 Worlds · Earn 🌀 MT · Build your Zoo!', fr:'2 Mondes · Gagne 🌀 MT · Construis ton Zoo!' , it:'2 Mondi · Guadagna 🌀 MT · Costruisci il tuo Zoo!'},
  'welcome.world1.title':  { de:'Welt 1 — Denkspiel', en:'World 1 — Puzzle Game', fr:'Monde 1 — Jeu de Réflexion' , it:'Mondo 1 — Gioco di Logica'},
  'welcome.world1.short':  { de:'🇫🇷 Welt 1: Frankreich', en:'🇫🇷 World 1: France', fr:'🇫🇷 Monde 1 : France' , it:'🇫🇷 Mondo 1: Francia'},
  'welcome.world1.desc':   { de:'Spiele 20 verschiedene Spiele und verdiene Mischa Taler (🌀 MT).', en:'Play 20 different games and earn Mischa Coins (🌀 MT).', fr:'Joue à 20 jeux différents et gagne des Mischa Pièces (🌀 MT).' , it:'Gioca a 20 giochi diversi e guadagna Monete Mischa (🌀 MT).'},
  'welcome.world1.detail': { de:'Je besser du spielst, desto mehr MT bekommst du (bis 1.5 MT pro Spiel).', en:'The better you play, the more MT you earn (up to 1.5 MT per game).', fr:'Plus tu joues bien, plus tu gagnes de MT (jusqu\'à 1,5 MT par jeu).' , it:'Più giochi bene, più MT guadagni (fino a 1.5 MT a partita).'},
  'welcome.world2.title':  { de:'Welt 2 — Zoo-Empire', en:'World 2 — Zoo Empire', fr:'Monde 2 — Empire du Zoo' , it:'Mondo 2 — Zoo Empire'},
  'welcome.world2.short':  { de:'🦁 Welt 2: Zoo Empire', en:'🦁 World 2: Zoo Empire', fr:'🦁 Monde 2 : Zoo Empire' , it:'🦁 Mondo 2: Zoo Empire'},
  'welcome.world2.desc':   { de:'Teleportiere für 15 🌀 MT in den Zoo. Kaufe Tiere mit der Gondelbahn · Baue Gehege auf · Verdiene automatisch MT.', en:'Teleport to the Zoo for 15 🌀 MT. Buy animals with the gondola · Build enclosures · Earn MT automatically.', fr:'Téléporte-toi au Zoo pour 15 🌀 MT. Achète des animaux avec le téléphérique · Construis des enclos · Gagne des MT automatiquement.' , it:'Teletrasportati allo Zoo per 15 🌀 MT. Compra animali con la funivia · Costruisci recinti · Guadagna MT automaticamente.'},
  'welcome.world2.features': { de:'Gondelbahn · Glücksrad · Multiplayer · Slap-System', en:'Gondola · Lucky Wheel · Multiplayer · Slap System', fr:'Téléphérique · Roue de la Chance · Multijoueur · Système de Claque' , it:'Funivia · Ruota della Fortuna · Multiplayer · Sistema Schiaffi'},
  'btn.register':          { de:'🆕 Neu registrieren', en:'🆕 Register', fr:'🆕 S\'inscrire' , it:'🆕 Registrati'},
  'btn.login':             { de:'🔑 Anmelden', en:'🔑 Login', fr:'🔑 Connexion' , it:'🔑 Accedi'},
  'btn.leaderboard':       { de:'🌍 Rangliste', en:'🌍 Leaderboard', fr:'🌍 Classement' , it:'🌍 Classifica'},
  'btn.wallet':            { de:'👜 Geldbeutel', en:'👜 Wallet', fr:'👜 Portefeuille' , it:'👜 Portafoglio'},
  'btn.account':           { de:'📊 Konto', en:'📊 Account', fr:'📊 Compte' , it:'📊 Account'},

  // ── LOGIN / REGISTER ──
  'login.title':           { de:'Anmelden 🔑', en:'Login 🔑', fr:'Connexion 🔑' , it:'Accedi 🔑'},
  'login.welcome_back':    { de:'Willkommen zurück!', en:'Welcome back!', fr:'Content de te revoir !' , it:'Bentornato!'},
  'login.name':            { de:'Name', en:'Name', fr:'Nom' , it:'Nome'},
  'login.password':        { de:'Passwort', en:'Password', fr:'Mot de passe' , it:'Password'},
  'login.btn':             { de:'Anmelden ➜', en:'Login ➜', fr:'Connexion ➜' , it:'Accedi ➜'},
  'login.back_normal':     { de:'← Zurück zur normalen Welt', en:'← Back to normal world', fr:'← Retour au monde normal' , it:'← Torna al mondo normale'},
  'register.title':        { de:'Neu registrieren 🆕', en:'Register 🆕', fr:'S\'inscrire 🆕' , it:'Registrati 🆕'},
  'register.name':         { de:'Dein Name', en:'Your Name', fr:'Ton Nom' , it:'Il tuo nome'},
  'register.password':     { de:'Geheimwort', en:'Secret Word', fr:'Mot Secret' , it:'Parola segreta'},
  'register.btn':          { de:'Konto erstellen ➜', en:'Create Account ➜', fr:'Créer un Compte ➜' , it:'Crea account ➜'},
  'lang.bonus':            { de:'', en:'🎁 +1 MT Bonus für Englisch!', fr:'🎁 +1 MT Bonus pour le Français !' , it:'🎁 Bonus di +1 MT per l\'italiano!'},

  // ── WORLDMAP ──
  'worldmap.title':        { de:'Weltkarte', en:'World Map', fr:'Carte du Monde' , it:'Mappa del Mondo'},
  'worldmap.teleport':     { de:'🚀 Teleportiere in den Zoo', en:'🚀 Teleport to Zoo', fr:'🚀 Téléporter au Zoo' , it:'🚀 Teletrasportati allo Zoo'},
  'worldmap.personality':  { de:'🎨 Persönlichkeit (Farbe + Avatar)', en:'🎨 Personality (Color + Avatar)', fr:'🎨 Personnalité (Couleur + Avatar)' , it:'🎨 Personalità (Colore + Avatar)'},
  'worldmap.font':         { de:'🔤 Schrift', en:'🔤 Font', fr:'🔤 Police' , it:'🔤 Carattere'},
  'worldmap.update':       { de:'🔄 Update', en:'🔄 Update', fr:'🔄 Mise à jour' , it:'🔄 Aggiorna'},
  'worldmap.logout':       { de:'Abmelden', en:'Logout', fr:'Déconnexion' , it:'Esci'},
  'worldmap.tasks':        { de:'Aufgaben', en:'Tasks', fr:'Tâches' , it:'Compiti'},
  'worldmap.all_worlds':   { de:'Alle Welten', en:'All Worlds', fr:'Tous les Mondes' , it:'Tutti i mondi'},
  'worldmap.completed':    { de:'Alle 10 Welten geschafft!', en:'All 10 worlds completed!', fr:'Tous les 10 mondes terminés !' , it:'Tutti i 10 mondi completati!'},
  'worldmap.profile':      { de:'Dein Profil', en:'Your Profile', fr:'Ton Profil' , it:'Il tuo profilo'},
  'worldmap.close':        { de:'Schliessen', en:'Close', fr:'Fermer' , it:'Chiudi'},
  'worldmap.cancel':       { de:'Abbrechen', en:'Cancel', fr:'Annuler' , it:'Annulla'},

  // ── ZOO HUD ──
  'zoo.gondola':           { de:'Gondel', en:'Gondola', fr:'Gondole' , it:'Gondola'},
  'zoo.wheel':             { de:'Rad', en:'Wheel', fr:'Roue' , it:'Ruota'},
  'zoo.rebirth':           { de:'Rebirth', de_simple:'Neustart (Bonus)', en:'Rebirth', fr:'Renaissance' , it:'Rinascita'},
  'zoo.shop':              { de:'Shop', de_simple:'Laden', en:'Shop', fr:'Boutique' , it:'Negozio'},
  'zoo.trade':             { de:'Tauschen', en:'Trade', fr:'Échanger' , it:'Scambia'},
  'zoo.menu':              { de:'Menü', en:'Menu', fr:'Menu' , it:'Menu'},
  'zoo.sound':             { de:'Sound', en:'Sound', fr:'Son' , it:'Audio'},
  'zoo.update':            { de:'Update', en:'Update', fr:'Mise à jour' , it:'Aggiorna'},
  'zoo.admin':             { de:'Admin', en:'Admin', fr:'Admin' , it:'Admin'},
  'zoo.profile':           { de:'Profil', en:'Profile', fr:'Profil' , it:'Profilo'},
  'zoo.report':            { de:'Melden', en:'Report', fr:'Signaler' , it:'Segnala'},
  'zoo.reward':            { de:'Belohnung', en:'Reward', fr:'Récompense' , it:'Ricompensa'},
  'zoo.gondola_station':   { de:'🚡 Gondel-Station', en:'🚡 Gondola Station', fr:'🚡 Station de gondole' , it:'🚡 Stazione della gondola'},
  'zoo.next':              { de:'Nächste:', en:'Next:', fr:'Prochain :' , it:'Prossimo:'},
  'zoo.more_luck':         { de:'🍀 Mehr Glück:', en:'🍀 More luck:', fr:'🍀 Plus de chance :' , it:'🍀 Più fortuna:'},
  'zoo.all_animals_rarity':{ de:'📋 Alle Tiere nach Seltenheit', en:'📋 All animals by rarity', fr:'📋 Tous les animaux par rareté' , it:'📋 Tutti gli animali per rarità'},
  'zoo.buy':               { de:'Kaufen', en:'Buy', fr:'Acheter' , it:'Compra'},
  'zoo.rarity_normal':     { de:'Normal', en:'Common', fr:'Normal' , it:'Normale'},
  'zoo.rarity_rare':       { de:'Selten', en:'Rare', fr:'Rare' , it:'Raro'},
  'zoo.rarity_epic':       { de:'Episch', en:'Epic', fr:'Épique' , it:'Epico'},
  'zoo.rarity_legendary':  { de:'Legendär', en:'Legendary', fr:'Légendaire' , it:'Leggendario'},
  'zoo.rarity_mythic':     { de:'Mythisch', en:'Mythic', fr:'Mythique' , it:'Mitico'},
  'zoo.rarity_secret':     { de:'Geheim', en:'Secret', fr:'Secret' , it:'Segreto'},
  'zoo.gondola_enter':     { de:'🚪 Gondel-Station (hineinlaufen)', en:'🚪 Gondola Station (walk in)', fr:'🚪 Station de gondole (entrer)' , it:'🚪 Stazione della gondola (entra a piedi)'},
  'zoo.popular_title':     { de:'BELIEBT!', en:'POPULAR!', fr:'POPULAIRE !' , it:'POPOLARE!'},
  'zoo.popular_desc':      { de:'{n} Besucher in deinem Zoo! +{mt} MT!', en:'{n} visitors in your zoo! +{mt} MT!', fr:'{n} visiteurs dans ton zoo ! +{mt} MT !' , it:'{n} visitatori nel tuo zoo! +{mt} MT!'},
  'zoo.tiktok_event':      { de:'Unseriöse TikToker haben sich als Tierschützer ausgegeben und in allen Zoobereichen das wertvollste Tier freigelassen. Schnell Tiere suchen und wieder einfangen!',
                             de_simple:'Ein paar TikToker haben sich als Tierschützer ausgegeben und überall im Zoo das wertvollste Tier freigelassen. Schnell suchen und wieder einfangen!',
                             en:'Shady TikTokers posed as animal rights activists and set the most valuable animal in every zoo area free. Go find them and catch them again — fast!',
                             fr:'De faux défenseurs des animaux sur TikTok ont libéré l’animal le plus précieux de chaque zone du zoo. Vite, retrouve-les et rattrape-les !' , it:'Falsi TikToker si sono spacciati per animalisti e hanno liberato l\'animale più prezioso in ogni area dello zoo. Vai a cercarli e ricatturali — in fretta!'},
  'zoo.shoe_red_title':    { de:'👟 Rote Turnschuhe', en:'👟 Red Sneakers', fr:'👟 Baskets rouges' , it:'👟 Scarpe da ginnastica rosse'},
  'zoo.shoe_red_desc':     { de:'Erhöhen deine Laufgeschwindigkeit dauerhaft um 50%. Einmal gekauft, für immer aktiv — die erste von drei Stufen (rot → gold → platin), die sich alle gegenseitig aufaddieren.',
                             de_simple:'Machen dich dauerhaft 50% schneller beim Laufen. Erste von drei Stufen — gold und platin bauen später darauf auf.',
                             en:'Permanently increases your walking speed by 50%. The first of three tiers (red → gold → platinum) that all stack together.',
                             fr:'Augmentent définitivement ta vitesse de déplacement de 50 %. La première de trois étapes (rouge → or → platine) qui se cumulent toutes.' , it:'Aumentano permanentemente la tua velocità di camminata del 50%. Il primo di tre livelli (rosso → oro → platino) che si sommano tutti tra loro.'},
  'zoo.shoe_gold_title':   { de:'✨ Goldene Turnschuhe', en:'✨ Golden Sneakers', fr:'✨ Baskets dorées' , it:'✨ Scarpe da ginnastica dorate'},
  'zoo.shoe_gold_desc':    { de:'Erhöhen deine Laufgeschwindigkeit um weitere 50% — zusätzlich zu den roten Turnschuhen (braucht diese zuerst). Zusammen mit Rot: +100%.',
                             de_simple:'Machen dich nochmal 50% schneller — zusätzlich zu den roten Schuhen. Braucht die roten zuerst.',
                             en:'Increases your walking speed by another 50% — stacking on top of the red sneakers (requires owning those first). Together with red: +100%.',
                             fr:'Augmentent ta vitesse de déplacement de 50 % supplémentaires — en plus des baskets rouges (nécessite de les posséder d\'abord). Avec les rouges : +100 %.' , it:'Aumentano la tua velocità di camminata di un altro 50% — si sommano alle scarpe rosse (richiede di possederle prima). Insieme al rosso: +100%.'},
  'zoo.shoe_platinum_title':{ de:'💎 Platin-Turnschuhe', en:'💎 Platinum Sneakers', fr:'💎 Baskets en platine', it:'💎 Scarpe da ginnastica di platino' },
  'zoo.shoe_platinum_desc': { de:'Erhöhen deine Laufgeschwindigkeit um weitere 50% (braucht goldene Schuhe zuerst — zusammen +150%). Dazu exklusiv der Platin-Rush: läufst du 2 Sekunden geradeaus, wirst du 1.5× schneller, nach 3 Sekunden 3×, nach 4 Sekunden 6×! Richtungswechsel setzt alles zurück. Funktioniert nicht, während du ein Tier trägst.',
                             de_simple:'Machen dich nochmal 50% schneller (brauchen goldene Schuhe zuerst). Extra: läufst du 2-4 Sekunden geradeaus, wirst du immer schneller, bis zu 6x! Richtung ändern setzt es zurück.',
                             en:'Increases your walking speed by another 50% (requires owning gold shoes first — together +150%). Also unlocks the exclusive Platinum Rush: run straight for 2 seconds and you get 1.5× faster, 3 seconds for 3×, 4 seconds for 6×! Changing direction resets it. Doesn\'t work while carrying an animal.',
                             fr:'Augmentent ta vitesse de déplacement de 50 % supplémentaires (nécessite les baskets dorées d\'abord — ensemble +150 %). Débloque aussi la Ruée Platine exclusive : cours tout droit pendant 2 secondes pour être 1,5× plus rapide, 3 secondes pour 3×, 4 secondes pour 6× ! Changer de direction réinitialise tout. Ne fonctionne pas en portant un animal.',
                             it:'Aumentano la tua velocità di camminata di un altro 50% (richiede prima le scarpe dorate — insieme +150%). Sblocca anche la Corsa di Platino esclusiva: corri dritto per 2 secondi per essere 1,5× più veloce, 3 secondi per 3×, 4 secondi per 6×! Cambiare direzione azzera tutto. Non funziona mentre trasporti un animale.' },
  'zoo.shoe_hiking_title': { de:'🥾 Wanderschuhe', en:'🥾 Hiking Boots', fr:'🥾 Chaussures de randonnée', it:'🥾 Scarponi da trekking' },
  'zoo.shoe_hiking_desc':  { de:'Machen dich beim Tragen eines Tieres in ein Gehege 30% schneller. Wirkt nur beim Tragen — auf deine normale Laufgeschwindigkeit haben sie keinen Einfluss. Dein allererstes (geschütztes) Tier trägst du schon automatisch 50% schneller, ganz ohne Kauf — die Wanderschuhe helfen dir bei allen Tieren danach.',
                             de_simple:'Machen dich schneller, wenn du ein Tier zu einem Gehege trägst — 30% schneller. Beim normalen Laufen bringen sie nichts. Dein erstes Tier ist schon automatisch 50% schneller getragen, ohne dass du dafür etwas kaufen musst.',
                             en:'Makes you 30% faster while carrying an animal to an enclosure. Only affects carrying — has no effect on your normal walking speed. Your very first (protected) animal is already carried 50% faster automatically, no purchase needed — the hiking boots help with every animal after that.',
                             fr:'Te rend 30 % plus rapide lorsque tu transportes un animal vers un enclos. N\'affecte que le transport — aucun effet sur ta vitesse de marche normale. Ton tout premier animal (protégé) est déjà transporté 50 % plus vite automatiquement, sans achat — les chaussures de randonnée t\'aident pour tous les animaux suivants.',
                             it:'Ti rende il 30% più veloce mentre trasporti un animale verso un recinto. Influisce solo sul trasporto — nessun effetto sulla tua normale velocità di camminata. Il tuo primissimo animale (protetto) viene già trasportato automaticamente il 50% più veloce, senza bisogno di acquisti — gli scarponi da trekking ti aiutano con tutti gli animali successivi.'},
  'zoo.shopinfo_net_title': { de:'🥅 Fangnetz', en:'🥅 Net', fr:'🥅 Filet', it:'🥅 Rete' },
  'zoo.shopinfo_net_desc':  { de:'Mit dem Fangnetz kannst du entlaufene Tiere zurückfangen, die z.B. durch einen Slap fallen gelassen wurden. Ohne Fangnetz kannst du sie nicht einsammeln — unbedingt früh kaufen!',
                             en:'The net lets you catch roaming animals that got loose — for example after being dropped in a slap. Without it, you can\'t pick them back up — buy it early!',
                             fr:'Le filet te permet de rattraper les animaux en liberté, par exemple après qu\'ils soient tombés lors d\'une gifle. Sans lui, impossible de les récupérer — à acheter tôt !',
                             it:'La rete ti permette di riprendere gli animali in fuga, ad esempio quelli caduti durante uno schiaffo. Senza di essa non puoi recuperarli — compratela presto!' },
  'zoo.shopinfo_vis_title': { de:'🚀 Besucher ×2', en:'🚀 Visitors ×2', fr:'🚀 Visiteurs ×2', it:'🚀 Visitatori ×2' },
  'zoo.shopinfo_vis_desc':  { de:'Verdoppelt dauerhaft, wie oft Besucher in deinen Zoo kommen — dadurch verdienst du schneller Geld, ohne mehr Tiere kaufen zu müssen.',
                             en:'Permanently doubles how often visitors come to your zoo — you earn money faster without needing more animals.',
                             fr:'Double définitivement la fréquence des visiteurs dans ton zoo — tu gagnes de l\'argent plus vite sans avoir besoin de plus d\'animaux.',
                             it:'Raddoppia permanentemente la frequenza dei visitatori nel tuo zoo — guadagni più velocemente senza dover comprare altri animali.' },
  'zoo.shopinfo_vis2_title':{ de:'🚀🚀 Besucher ×4', en:'🚀🚀 Visitors ×4', fr:'🚀🚀 Visiteurs ×4', it:'🚀🚀 Visitatori ×4' },
  'zoo.shopinfo_vis2_desc': { de:'Baut auf «Besucher ×2» auf und verdoppelt die Besucherfrequenz nochmal — zusammen ×4 so viele Besucher wie am Anfang.',
                             en:'Builds on "Visitors ×2" and doubles the visitor frequency again — together, ×4 as many visitors as at the start.',
                             fr:'S\'appuie sur « Visiteurs ×2 » et double encore la fréquence des visiteurs — au total ×4 par rapport au départ.',
                             it:'Si basa su "Visitatori ×2" e raddoppia ancora la frequenza — insieme, ×4 rispetto all\'inizio.' },
  'zoo.shopinfo_vis_m_title':{ de:'👥 ×2 Besucher', en:'👥 Visitors ×2 (count)', fr:'👥 Visiteurs ×2 (nombre)', it:'👥 Visitatori ×2 (numero)' },
  'zoo.shopinfo_vis_m_desc': { de:'Verdoppelt, wie viele Besucher gleichzeitig zu jedem Besuch kommen — zusätzlich zur Besuchsfrequenz.',
                             en:'Doubles how many visitors arrive per visit — on top of the visit frequency.',
                             fr:'Double le nombre de visiteurs qui arrivent à chaque visite — en plus de la fréquence.',
                             it:'Raddoppia il numero di visitatori che arrivano a ogni visita — in aggiunta alla frequenza.' },
  'zoo.shopinfo_earn_title':{ de:'💰 ×2 Einnahmen', en:'💰 Income ×2', fr:'💰 Revenus ×2', it:'💰 Guadagni ×2' },
  'zoo.shopinfo_earn_desc': { de:'Verdoppelt dauerhaft alle Einnahmen aus deinem Zoo — jedes Tier bringt doppelt so viel MT pro Besuch.',
                             en:'Permanently doubles all income from your zoo — every animal earns twice as much MT per visit.',
                             fr:'Double définitivement tous les revenus de ton zoo — chaque animal rapporte deux fois plus de MT par visite.',
                             it:'Raddoppia permanentemente tutti i guadagni del tuo zoo — ogni animale frutta il doppio di MT per visita.' },
  'zoo.shopinfo_earn2_title':{ de:'💰💰 ×4 Einnahmen', en:'💰💰 Income ×4', fr:'💰💰 Revenus ×4', it:'💰💰 Guadagni ×4' },
  'zoo.shopinfo_earn2_desc': { de:'Baut auf «×2 Einnahmen» auf und verdoppelt die Einnahmen nochmal — zusammen ×4 so viel wie ohne Boosts.',
                             en:'Builds on "Income ×2" and doubles income again — together, ×4 as much as without boosts.',
                             fr:'S\'appuie sur « Revenus ×2 » et double encore les revenus — au total ×4 par rapport à la normale.',
                             it:'Si basa su "Guadagni ×2" e raddoppia ancora — insieme, ×4 rispetto al normale.' },
  'zoo.shopinfo_insurance_title':{ de:'🛡️ Versicherung', en:'🛡️ Insurance', fr:'🛡️ Assurance', it:'🛡️ Assicurazione' },
  'zoo.shopinfo_insurance_desc': { de:'Schützt dich automatisch vor den Kosten von Unfällen (z.B. Polizei-Razzia) — die Versicherung übernimmt das stattdessen. Kostet ca. 1 MT pro 100 Gesamt-Besucher deines Zoos, alle 5 Minuten abgebucht. Reicht das Geld nicht, läuft sie automatisch ab.',
                             en:'Automatically protects you from accident costs (e.g. a police raid) — the insurance covers it instead. Costs roughly 1 MT per 100 total visitors your zoo has had, charged every 5 minutes. If you can\'t afford it, it lapses automatically.',
                             fr:'Te protège automatiquement des coûts d\'incidents (par ex. une descente de police) — l\'assurance les prend en charge à ta place. Coûte environ 1 MT pour 100 visiteurs au total de ton zoo, prélevé toutes les 5 minutes. Si tu ne peux plus payer, elle expire automatiquement.',
                             it:'Ti protegge automaticamente dai costi di incidenti (ad es. un\'irruzione della polizia) — l\'assicurazione se ne occupa al posto tuo. Costa circa 1 MT ogni 100 visitatori totali del tuo zoo, addebitato ogni 5 minuti. Se non puoi permettertelo, scade automaticamente.' },
  'zoo.shopinfo_rebirth_title':{ de:'🔄 Rebirth', en:'🔄 Rebirth', fr:'🔄 Renaissance', it:'🔄 Rinascita' },
  'zoo.shopinfo_rebirth_desc': { de:'Setzt fast deinen ganzen Zoo zurück (MT, fast alle Tiere) — dafür bekommst du einen dauerhaften Einnahmen-Bonus, der für immer bleibt. Kostet immer 1 Mio. MT, maximal 3× möglich.',
                             de_simple:'Setzt fast deinen ganzen Zoo zurück, dafür bekommst du einen dauerhaften Bonus für immer. Kostet immer 1 Million MT, geht maximal 3 Mal.',
                             en:'Resets almost your entire zoo (MT, almost all animals) — in exchange you get a permanent income bonus that stays forever. Always costs 1 million MT, possible up to 3 times.',
                             fr:'Réinitialise presque tout ton zoo (MT, presque tous les animaux) — en échange, tu obtiens un bonus de revenus permanent qui reste pour toujours. Coûte toujours 1 million de MT, possible jusqu\'à 3 fois.',
                             it:'Azzera quasi tutto il tuo zoo (MT, quasi tutti gli animali) — in cambio ottieni un bonus di guadagno permanente per sempre. Costa sempre 1 milione di MT, possibile fino a 3 volte.' },
  'zoo.shopinfo_sweepIns_title':{ de:'🧹🛡️ Kehrmaschinenversicherung', en:'🧹🛡️ Sweeper Insurance', fr:'🧹🛡️ Assurance balayeuse', it:'🧹🛡️ Assicurazione spazzatrice' },
  'zoo.shopinfo_sweepIns_desc': { de:'Einmalig 50 MT, für immer aktiv: Die Kehrmaschine kann dich nie mehr überfahren und in den Müllraum schicken — du musst nie wieder Müll aufsammeln.',
                             de_simple:'Einmal 50 MT bezahlen, dann für immer sicher: Die Kehrmaschine kann dich nicht mehr erwischen, du musst nie wieder Müll aufsammeln.',
                             en:'One-time 50 MT, active forever: the sweeper machine can never run you over and send you to the trash room again — you never have to pick up trash.',
                             fr:'Un paiement unique de 50 MT, actif pour toujours : la balayeuse ne pourra plus jamais te renverser et t\'envoyer dans la salle à ordures — tu n\'auras plus jamais à ramasser de déchets.',
                             it:'Pagamento unico di 50 MT, attivo per sempre: la spazzatrice non potrà più investirti e mandarti nella stanza dei rifiuti — non dovrai mai più raccogliere spazzatura.' },
  'zoo.sweeper_go':        { de:'🧹 Die Kehrmaschine fährt los und kehrt alle Gehege!', en:'🧹 The sweeper is heading out to clean all enclosures!', fr:'🧹 La balayeuse part nettoyer tous les enclos !' , it:'🧹 La spazzatrice parte per pulire tutti i recinti!'},
  'zoo.waiting_gondola':   { de:'Warte auf Gondel...', en:'Waiting for gondola...', fr:'En attente de la gondole...' , it:'In attesa della gondola...'},
  'zoo.traits_events_only':{ de:'Traits nur während Events!', en:'Traits only during events!', fr:'Traits uniquement pendant les événements !' , it:'I tratti sono disponibili solo durante gli eventi!'},
  'zoo.gondola_locked_police': { de:'🚓🔒 Gondel gesperrt!', en:'🚓🔒 Gondola locked!', fr:'🚓🔒 Gondole bloquée !' , it:'🚓🔒 Gondola bloccata!'},
  'zoo.police_raid':       { de:'Polizei-Razzia · noch {n} Min', en:'Police raid · {n} min left', fr:'Descente de police · encore {n} min' , it:'Retata della polizia · ancora {n} min'},
  'zoo.open_after_buy':    { de:'🥚 Sofort öffnen nach Kauf!', en:'🥚 Opens instantly after buying!', fr:'🥚 S\'ouvre tout de suite après achat !' , it:'🥚 Si apre subito dopo l\'acquisto!'},
  'zoo.too_little':        { de:'❌ Zu wenig', en:'❌ Not enough', fr:'❌ Pas assez' , it:'❌ Non abbastanza'},
  'zoo.buy_and_open':      { de:'🥚 Kaufen & Öffnen!', en:'🥚 Buy & Open!', fr:'🥚 Acheter et ouvrir !' , it:'🥚 Compra e apri!'},
  'zoo.buy_cart':          { de:'🛒 Kaufen', en:'🛒 Buy', fr:'🛒 Acheter' , it:'🛒 Compra'},
  'zoo.gondola_locked_toast': { de:'🚓 Gondel gesperrt (Polizei)! Noch {n} Min', en:'🚓 Gondola locked (police)! {n} min left', fr:'🚓 Gondole bloquée (police) ! Encore {n} min' , it:'🚓 Gondola bloccata (polizia)! Ancora {n} min'},
  'zoo.all_enc_full':      { de:'❌ Alle Gehege belegt!', en:'❌ All enclosures full!', fr:'❌ Tous les enclos sont pleins !' , it:'❌ Tutti i recinti sono pieni!'},
  'zoo.too_little_mt':     { de:'❌ Zu wenig MT!', en:'❌ Not enough MT!', fr:'❌ Pas assez de MT !' , it:'❌ MT insufficienti!'},

  // ── ZOO SHOP ──
  'shop.animals':          { de:'Tiere', en:'Animals', fr:'Animaux' , it:'Animali'},
  'shop.enclosures':       { de:'Gehege', en:'Enclosures', fr:'Enclos' , it:'Recinti'},
  'shop.boosts':           { de:'Boosts', en:'Boosts', fr:'Boosts' , it:'Boost'},
  'shop.eggs':             { de:'Eier', en:'Eggs', fr:'Œufs' , it:'Uova'},
  'shop.buy':              { de:'Kaufen', en:'Buy', fr:'Acheter' , it:'Compra'},
  'shop.not_enough':       { de:'❌ Zu wenig MT!', en:'❌ Not enough MT!', fr:'❌ Pas assez de MT !' , it:'❌ MT insufficienti!'},
  'shop.full':             { de:'❌ Alle Gehege belegt!', en:'❌ All enclosures full!', fr:'❌ Tous les enclos sont pleins !' , it:'❌ Tutti i recinti sono pieni!'},

  // ── ZOO GONDOLA ──
  'gond.title':            { de:'Gondelbahn', de_simple:'Tier-Kaufstation (Gondel)', en:'Gondola Station', fr:'Station du Téléphérique' , it:'Stazione della Gondola'},
  'gond.buy':              { de:'🛒 Kaufen', en:'🛒 Buy', fr:'🛒 Acheter' , it:'🛒 Compra'},
  'gond.buy_egg':          { de:'🥚 Kaufen & Öffnen!', en:'🥚 Buy & Open!', fr:'🥚 Acheter & Ouvrir !' , it:'🥚 Compra e apri!'},
  'gond.not_enough':       { de:'❌ Zu wenig MT!', en:'❌ Not enough MT!', fr:'❌ Pas assez de MT !' , it:'❌ MT insufficienti!'},
  'gond.full':             { de:'❌ Gehege voll', en:'❌ Enclosure full', fr:'❌ Enclos plein' , it:'❌ Recinto pieno'},
  'gond.arrive':           { de:'Ein Tier kommt an!', en:'An animal arrives!', fr:'Un animal arrive !' , it:'Un animale sta arrivando!'},

  // ── ZOO MENU ──
  'menu.settings':         { de:'⚙️ EINSTELLUNGEN ⚙️', en:'⚙️ SETTINGS ⚙️', fr:'⚙️ PARAMÈTRES ⚙️' , it:'⚙️ IMPOSTAZIONI ⚙️'},
  'menu.sound':            { de:'🎵 Sound', en:'🎵 Sound', fr:'🎵 Son' , it:'🎵 Audio'},
  'menu.daytime':          { de:'🌅 Tageszeiten', en:'🌅 Time of Day', fr:'🌅 Heure du Jour' , it:'🌅 Ora del giorno'},
  'menu.on':               { de:'✓ An', en:'✓ On', fr:'✓ Activé' , it:'✓ Attivo'},
  'menu.off':              { de:'✗ Aus', en:'✗ Off', fr:'✗ Désactivé' , it:'✗ Disattivo'},

  // ── SOUND PANEL ──
  'sound.mute':            { de:'Stumm', en:'Mute', fr:'Muet' , it:'Muto'},
  'sound.mute.desc':       { de:'Kein Sound', en:'No Sound', fr:'Pas de Son' , it:'Nessun audio'},
  'sound.arcade':          { de:'Arcade', de_simple:'Retro-Spielhalle', en:'Arcade', fr:'Arcade' , it:'Arcade'},
  'sound.arcade.desc':     { de:'Retro 8-Bit Töne', en:'Retro 8-Bit Sounds', fr:'Sons Rétro 8-Bit' , it:'Suoni retrò a 8-bit'},
  'sound.normal':          { de:'Normal', en:'Normal', fr:'Normal' , it:'Normale'},
  'sound.normal.desc':     { de:'Standard Töne', en:'Standard Sounds', fr:'Sons Standards' , it:'Suoni standard'},
  'sound.satisfying':      { de:'Satisfying', de_simple:'Angenehm', en:'Satisfying', fr:'Satisfaisant' , it:'Piacevole'},
  'sound.satisfying.desc': { de:'Weiche, angenehme Töne', en:'Soft, pleasant sounds', fr:'Sons doux et agréables' , it:'Suoni morbidi e piacevoli'},

  // ── REBIRTH ──
  'reb.title':             { de:'Wiedergeburt', de_simple:'Neustart mit Bonus', en:'Rebirth', fr:'Renaissance' , it:'Rinascita'},
  'reb.btn':               { de:'🔄 Wiedergeburt!', de_simple:'🔄 Neu starten (mit Bonus)!', en:'🔄 Rebirth!', fr:'🔄 Renaissance !' , it:'🔄 Rinascita!'},
  'reb.cant':              { de:'Noch nicht möglich', en:'Not possible yet', fr:'Pas encore possible' , it:'Non ancora possibile'},
  'reb.mult':              { de:'Neuer Multiplikator', en:'New Multiplier', fr:'Nouveau Multiplicateur' , it:'Nuovo moltiplicatore'},

  // ── CHEST ──
  'chest.open':            { de:'ÖFFNEN', en:'OPEN', fr:'OUVRIR' , it:'APRI'},
  'chest.claim':           { de:'Super! ➜', en:'Great! ➜', fr:'Super ! ➜' , it:'Fantastico! ➜'},
  'chest.ready':           { de:'✨ Bereit zum Öffnen!', en:'✨ Ready to open!', fr:'✨ Prêt à ouvrir !' , it:'✨ Pronto da aprire!'},
  'chest.tap':             { de:'👆 Tippe', en:'👆 Tap', fr:'👆 Appuie' , it:'👆 Tocca'},
  'chest.to_open':         { de:'× zum Öffnen!', en:'× to open!', fr:'× pour ouvrir !' , it:'× per aprire!'},
  'chest.rewards':         { de:'🎁 Belohnungs-Truhen', de_simple:'🎁 Geschenk-Kisten', en:'🎁 Reward Chests', fr:'🎁 Coffres de Récompenses' , it:'🎁 Forzieri di Ricompensa'},
  'chest.opened':          { de:'Schon geöffnet', en:'Already opened', fr:'Déjà ouvert' , it:'Già aperto'},

  // ── ANIMALS ──
  'animal.normal':         { de:'Normal', en:'Normal', fr:'Normal' , it:'Normale'},
  'animal.rare':           { de:'Selten', en:'Rare', fr:'Rare' , it:'Raro'},
  'animal.epic':           { de:'Episch', en:'Epic', fr:'Épique' , it:'Epico'},
  'animal.legendary':      { de:'Legendär', en:'Legendary', fr:'Légendaire' , it:'Leggendario'},
  'animal.ultralegendary': { de:'Ultra-Legendär', en:'Ultra-Legendary', fr:'Ultra-Légendaire' , it:'Ultra-Leggendario'},
  'animal.god':            { de:'Göttlich', en:'Godly', fr:'Divin' , it:'Divino'},
  'animal.mythic':         { de:'Mythisch', en:'Mythic', fr:'Mythique' , it:'Mitico'},
  'animal.secret':         { de:'SECRET', en:'SECRET', fr:'SECRET' , it:'SEGRETO'},

  // ── JUMP EVENT ──
  'jump.question':         { de:'🏃 Jump-Event läuft! Zur Obby teleportieren?', de_simple:'🏃 Ein Sprung-Geschicklichkeitsspiel hat begonnen! Möchtest du hingehen?', en:'🏃 Jump Event active! Teleport to Obby?', fr:'🏃 Jump Event actif ! Téléporter vers l\'Obby ?' , it:'🏃 Evento Salto in corso! Teletrasportarsi all\'Obby?'},
  'jump.yes':              { de:'✅ Ja', en:'✅ Yes', fr:'✅ Oui' , it:'✅ Sì'},
  'jump.no':               { de:'❌ Nein', en:'❌ No', fr:'❌ Non' , it:'❌ No'},
  'jump.goal':             { de:'🏃 Obby · Ziel erreichen!', de_simple:'🏃 Sprung-Spiel · Kletter zum Ziel!', en:'🏃 Obby · Reach the goal!', fr:'🏃 Obby · Atteins l\'objectif !' , it:'🏃 Obby · Raggiungi il traguardo!'},
  'jump.won':              { de:'GEWONNEN!', en:'YOU WON!', fr:'GAGNÉ !' , it:'HAI VINTO!'},
  'jump.reward':           { de:'5-Minuten-Einnahmen:', en:'5-Minute Earnings:', fr:'Revenus de 5 Minutes :' , it:'Guadagni di 5 minuti:'},
  'jump.back':             { de:'Zurück zum Zoo', en:'Back to Zoo', fr:'Retour au Zoo' , it:'Torna allo Zoo'},

  // ── PERSONALITY ──
  'pers.title':            { de:'🎨 Persönlichkeit', en:'🎨 Personality', fr:'🎨 Personnalité' , it:'🎨 Personalità'},
  'pers.color':            { de:'🎨 Farbe', en:'🎨 Color', fr:'🎨 Couleur' , it:'🎨 Colore'},
  'pers.avatar':           { de:'👤 Avatar', en:'👤 Avatar', fr:'👤 Avatar' , it:'👤 Avatar'},
  'pers.face':             { de:'😀 Gesicht / Tier', en:'😀 Face / Animal', fr:'😀 Visage / Animal' , it:'😀 Viso / Animale'},
  'pers.hat':              { de:'🎩 Hut / Kopf', en:'🎩 Hat / Head', fr:'🎩 Chapeau / Tête' , it:'🎩 Cappello / Testa'},
  'pers.glasses':          { de:'👓 Brille', en:'👓 Glasses', fr:'👓 Lunettes' , it:'👓 Occhiali'},
  'pers.earring':          { de:'💎 Ohrring', en:'💎 Earring', fr:'💎 Boucle d\'oreille' , it:'💎 Orecchino'},
  'pers.reset':            { de:'↺ Avatar zurücksetzen', en:'↺ Reset Avatar', fr:'↺ Réinitialiser l\'Avatar' , it:'↺ Ripristina Avatar'},
  'pers.color.reset':      { de:'↺ Auf Standardfarbe zurücksetzen', en:'↺ Reset to default color', fr:'↺ Réinitialiser la couleur' , it:'↺ Ripristina colore predefinito'},
  'pers.preview':          { de:'Dein Avatar', en:'Your Avatar', fr:'Ton Avatar' , it:'Il tuo Avatar'},
  'pers.color.preview':    { de:'Aktive Farbe:', en:'Active color:', fr:'Couleur active :' , it:'Colore attivo:'},

  // ── FEEDER (Leckerli-Automat) ──
  'feeder.title':          { de:'🍬 Leckerli-Automat', en:'🍬 Treat Dispenser', fr:'🍬 Distributeur de Friandises' , it:'🍬 Distributore di Snack'},
  'feeder.yours':          { de:'Deine Leckerlis:', en:'Your treats:', fr:'Tes friandises :' , it:'I tuoi snack:'},
  'feeder.choose':         { de:'Wähle ein Tier, das du fütterst', en:'Choose an animal to feed', fr:'Choisis un animal à nourrir' , it:'Scegli un animale da nutrire'},
  'feeder.none':           { de:'Keine Tiere im Zoo zum Füttern.', en:'No animals in the zoo to feed.', fr:'Aucun animal à nourrir dans le zoo.' , it:'Nessun animale nello zoo da nutrire.'},
  'feeder.feed_btn':       { de:'🍬 Füttern (1 Leckerli)', en:'🍬 Feed (1 treat)', fr:'🍬 Nourrir (1 friandise)' , it:'🍬 Nutri (1 snack)'},
  'feeder.already':        { de:'⚡ Schon gefüttert! Läuft noch.', en:'⚡ Already fed! Still active.', fr:'⚡ Déjà nourri ! Toujours actif.' , it:'⚡ Già nutrito! Ancora attivo.'},
  'feeder.none_left':      { de:'Keine Leckerlis! Im Shop kaufen.', en:'No treats left! Buy some in the shop.', fr:'Plus de friandises ! Achète-en dans la boutique.' , it:'Nessuno snack rimasto! Comprane nel negozio.'},
  'feeder.hint':           { de:'Ein Leckerli macht ein Tier 5 Min lang 2× so schnell Geld.', en:'A treat makes an animal earn 2× money for 5 minutes.', fr:'Une friandise fait gagner 2× plus d\'argent pendant 5 min.' , it:'Uno snack fa guadagnare a un animale 2× i soldi per 5 minuti.'},
  'feeder.buy_shop':       { de:'Kostet 5% des Preises des gefütterten Tieres.', en:'Costs 5% of the fed animal\'s price.', fr:'Coûte 5% du prix de l\'animal nourri.' , it:'Costa il 5% del prezzo dell\'animale nutrito.'},
  'feeder.slot':           { de:'Gehege', en:'Enclosure', fr:'Enclos' , it:'Recinto'},

  // ── WORLD MAP (Weltkarte, expanded) ──
  'wm.leaderboard':        { de:'🌍 Rangliste', en:'🌍 Leaderboard', fr:'🌍 Classement' , it:'🌍 Classifica'},
  'wm.about':              { de:'ℹ️ Über', en:'ℹ️ About', fr:'ℹ️ À propos' , it:'ℹ️ Info'},
  'wm.about_title':        { de:'ℹ️ Über dieses Spiel', en:'ℹ️ About this game', fr:'ℹ️ À propos de ce jeu' , it:'ℹ️ Informazioni su questo gioco'},
  'wm.about_text':         { de:'Dieses Spiel wurde von Janosch, Mischa und Andi seit dem 15. April 2026 erstellt. Insgesamt haben wir dazu über 30\'000 Zeilen Code generiert und über 360 Deployments erstellt und getestet, was insgesamt über 200 Arbeitsstunden entspricht. Wir wünschen euch viel Spass!',
                             de_simple:'Dieses Spiel wurde von Janosch, Mischa und Andi seit dem 15. April 2026 gemacht. Insgesamt haben wir dafür über 30\'000 Zeilen Code geschrieben (mit Hilfe von KI) und über 360 Mal eine neue Version hochgeladen und getestet — das sind über 200 Arbeitsstunden. Wir wünschen euch viel Spass!',
                             en:'This game was created by Janosch, Mischa and Andi since April 15, 2026. In total, we generated over 30,000 lines of code and built and tested over 360 deployments, which adds up to more than 200 hours of work. We hope you have fun!',
                             fr:'Ce jeu a été créé par Janosch, Mischa et Andi depuis le 15 avril 2026. Au total, nous avons généré plus de 30 000 lignes de code et créé et testé plus de 360 déploiements, ce qui représente plus de 200 heures de travail. On vous souhaite beaucoup de plaisir !' , it:'Questo gioco è stato creato da Janosch, Mischa e Andi a partire dal 15 aprile 2026. In totale abbiamo generato oltre 30\'000 righe di codice e creato e testato oltre 360 deployment, il che corrisponde a oltre 200 ore di lavoro. Vi auguriamo tanto divertimento!'},
  'wm.mt_full':            { de:'Mischa Taler', en:'Mischa Coins', fr:'Mischa Pièces' , it:'Monete Mischa'},
  'wm.rewards_btn':        { de:'🎁 Belohnungen abholen', en:'🎁 Collect rewards', fr:'🎁 Récupérer récompenses' , it:'🎁 Ritira ricompense'},
  'wm.zoo_unlock_title':   { de:'🦁 Zoo freischalten', en:'🦁 Unlock the Zoo', fr:'🦁 Débloquer le Zoo' , it:'🦁 Sblocca lo Zoo'},
  'wm.zoo_unlock_body':    { de:'Noch {n} 🌀 MT bis zur Teleportation', en:'{n} more 🌀 MT until teleportation', fr:'Encore {n} 🌀 MT avant la téléportation' , it:'Ancora {n} 🌀 MT prima del teletrasporto'},
  'wm.teleport_btn':       { de:'🚀 In den Zoo teleportieren! (15 🌀 MT)', en:'🚀 Teleport to the Zoo! (15 🌀 MT)', fr:'🚀 Téléporter au Zoo ! (15 🌀 MT)' , it:'🚀 Teletrasportati allo Zoo! (15 🌀 MT)'},
  'wm.your_games':         { de:'🎮 Deine 20 Spiele', en:'🎮 Your 20 games', fr:'🎮 Tes 20 jeux' , it:'🎮 I tuoi 20 giochi'},
  'wm.games_done':         { de:'Spiele ✓', en:'games ✓', fr:'jeux ✓' , it:'giochi ✓'},
  'wm.games_count':        { de:'{n} Spiele · bis {m} 🌀 MT pro Spiel', en:'{n} games · up to {m} 🌀 MT per game', fr:'{n} jeux · jusqu\'à {m} 🌀 MT par jeu' , it:'{n} giochi · fino a {m} 🌀 MT a partita'},
  'world1.subtitle':       { de:'Reise nach Frankreich', en:'Journey to France', fr:'Voyage en France' , it:'Viaggio in Francia'},
  'world1.description':    { de:'Verdiene Mischa Taler — baue dein Zoo-Empire!', en:'Earn Mischa Coins — build your Zoo Empire!', fr:'Gagne des Mischa Pièces — construis ton Empire du Zoo !' , it:'Guadagna Monete Mischa — costruisci il tuo Zoo Empire!'},

  // ── WELCOME PAGE BODY TEXT (previously missing) ──
  'welcome.world1.body1':   { de:'<b>20 Spiele</b>, verdiene <b>Mischa Taler</b> 🌀.', en:'<b>20 games</b>, earn <b>Mischa Coins</b> 🌀.', fr:'<b>20 jeux</b>, gagne des <b>Mischa Pièces</b> 🌀.' , it:'<b>20 giochi</b>, guadagna <b>Monete Mischa</b> 🌀.'},
  'welcome.world1.body2':   { de:'', en:'', fr:'' , it:''},
  'welcome.world1.games':   { de:'🎯 Dart · 🔢 Rechnen · 🧠 Memory · und mehr', en:'🎯 Darts · 🔢 Math · 🧠 Memory · and more', fr:'🎯 Fléchettes · 🔢 Calcul · 🧠 Mémoire · et plus' , it:'🎯 Freccette · 🔢 Calcolo · 🧠 Memory · e altro'},
  'welcome.world2.body1':   { de:'Teleportiere für <b>15 MT</b> 🌀 in den Zoo.', en:'Teleport to the Zoo for <b>15 MT</b> 🌀.', fr:'Téléporte-toi au Zoo pour <b>15 MT</b> 🌀.' , it:'Teletrasportati per <b>15 MT</b> 🌀 allo Zoo.'},
  'welcome.world2.body2':   { de:'', en:'', fr:'' , it:''},
  'welcome.world2.feats':   { de:'🚡 Gondelbahn · 🎡 Glücksrad · 🌀 Multiplayer', en:'🚡 Gondola · 🎡 Lucky Wheel · 🌀 Multiplayer', fr:'🚡 Téléphérique · 🎡 Roue de la Chance · 🌀 Multijoueur' , it:'🚡 Funivia · 🎡 Ruota della Fortuna · 🌀 Multiplayer'},
  'btn.login_short':        { de:'🔑 Anmelden', en:'🔑 Login', fr:'🔑 Connexion' , it:'🔑 Accedi'},
  'btn.wallet_short':       { de:'👜 Geldbeutel', en:'👜 Wallet', fr:'👜 Portefeuille' , it:'👜 Portafoglio'},
  'btn.account_short':      { de:'📊 Konto', en:'📊 Account', fr:'📊 Compte' , it:'📊 Account'},

  // ── INTRO STORY (intro.html) ──
  'intro.next':            { de:'Weiter ›', de_simple:'Weiter ›', en:'Next ›', fr:'Suivant ›' , it:'Avanti ›'},
  'intro.ch0.label':       { de:'Prolog', de_simple:'Prolog', en:'Prologue', fr:'Prologue' , it:'Prologo'},
  'intro.ch0.title':       { de:'Irgendwo in der Welt...', de_simple:'Irgendwo in der Welt...', en:'Somewhere in the world...', fr:'Quelque part dans le monde...' , it:'Da qualche parte nel mondo...'},
  'intro.ch0.text':        { de:'Yo, die Brüder <b>Mischa</b> und <b>Janosch</b><br>hatten schon immer einen richtig krassen Traum...<br><br><b>Ihr Move: den grössten intergalaktischen Zoo bauen — no cap.</b><br><br>Dafür brauchen sie <b>dich, Bro!</b>',
                              de_simple:'Die Brüder <b>Mischa</b> und <b>Janosch</b><br>hatten schon immer einen grossen Traum...<br><br><b>Ihr Traum: den grössten intergalaktischen Zoo zu bauen...</b><br><br>Dazu brauchen sie <b>Deine Hilfe!</b>',
                              en:'The brothers <b>Mischa</b> and <b>Janosch</b><br>always had a big dream...<br><br><b>Their dream: to build the biggest intergalactic zoo...</b><br><br>To do that, they need <b>your help!</b>',
                              fr:'Les frères <b>Mischa</b> et <b>Janosch</b><br>ont toujours eu un grand rêve...<br><br><b>Leur rêve : construire le plus grand zoo intergalactique...</b><br><br>Pour cela, ils ont besoin de <b>ton aide !</b>' , it:'I fratelli <b>Mischa</b> e <b>Janosch</b><br>hanno sempre avuto un grande sogno...<br><br><b>Il loro sogno: costruire il più grande zoo intergalattico...</b><br><br>Per farlo, hanno bisogno del <b>tuo aiuto!</b>'},
  'intro.ch1.label':       { de:'Die Helden', de_simple:'Die Helden', en:'The Heroes', fr:'Les Héros' , it:'Gli Eroi'},
  'intro.ch1.mischa_desc': { de:'Der Kreative. Einfallsreich, chillig, unglaublich clever — echte Aura.', de_simple:'Der Kreative. Einfallsreich, ruhig, unglaublich klug, ein echter Teamplayer.', en:'The Creative One. Resourceful, calm, incredibly smart, a true team player.', fr:'Le Créatif. Ingénieux, calme, incroyablement intelligent, un vrai joueur d\'équipe.' , it:'Il Creativo. Ingegnoso, tranquillo, incredibilmente intelligente, un vero giocatore di squadra.'},
  'intro.ch1.janosch_desc':{ de:'Der Starke. Schnell, ehrgeizig, mit Herz — absoluter Main Character.', de_simple:'Der Starke. Schnell, ehrgeizig, mit Herz.', en:'The Strong One. Fast, ambitious, with heart.', fr:'Le Fort. Rapide, ambitieux, avec du cœur.' , it:'Il Forte. Veloce, ambizioso, con cuore.'},
  'intro.ch1.text':        { de:'Los geht\'s, Bro!<br>Erstmal geht die Reise nach <b>Frankreich</b> —<br>in ein Schloss, das richtig lit ist.<br><br>Dort musst du dir dein <b>Startkapital erkämpfen</b>,<br>denn ohne Kohle kein Zoo. Isso.',
                              de_simple:'Los geht es auf unserer Erde!<br>Genauer gesagt geht es zuerst auf eine Reise nach <b>Frankreich</b> —<br>in ein wunderschönes Schloss.<br><br>Dort gilt es <b>Startkapital zu erkämpfen</b>,<br>denn ohne Startkapital kein Zoo.',
                              en:'It all begins on our Earth!<br>More precisely, it starts with a journey to <b>France</b> —<br>to a beautiful castle.<br><br>There you must <b>earn starting capital</b>,<br>because without it, there\'s no zoo.',
                              fr:'Tout commence sur notre Terre !<br>Plus précisément, ça commence par un voyage en <b>France</b> —<br>dans un magnifique château.<br><br>Là, il faut <b>gagner un capital de départ</b>,<br>car sans capital, pas de zoo.' , it:'Si parte sulla nostra Terra!<br>Più precisamente, il viaggio inizia in <b>Francia</b> —<br>in un bellissimo castello.<br><br>Lì bisogna <b>guadagnarsi il capitale di partenza</b>,<br>perché senza capitale niente zoo.'},
  'intro.ch2.label':       { de:'Die Herausforderung', de_simple:'Die Herausforderung', en:'The Challenge', fr:'Le Défi' , it:'La Sfida'},
  'intro.ch2.title':       { de:'Erkämpfe dein Startkapital', de_simple:'Erkämpfe dein Startkapital', en:'Earn your starting capital', fr:'Gagne ton capital de départ' , it:'Guadagna il tuo capitale di partenza'},
  'intro.ch2.text':        { de:'Du brauchst Köpfchen und Ausdauer, Digga.<br><br>Aber zusammen ist einfach alles möglich — das wird ein absolutes W!',
                              de_simple:'Es braucht <b>Köpfchen und Ausdauer</b>.<br><br>Aber zusammen ist alles möglich!',
                              en:'It takes <b>brains and stamina</b>.<br><br>But together, anything is possible!',
                              fr:'Il faut de la <b>matière grise et de l\'endurance</b>.<br><br>Mais ensemble, tout est possible !' , it:'Ci vogliono <b>cervello e resistenza</b>.<br><br>Ma insieme tutto è possibile!'},
  'intro.ch3.label':       { de:'Der Traum', de_simple:'Der Traum', en:'The Dream', fr:'Le Rêve' , it:'Il Sogno'},
  'intro.ch3.title':       { de:'Baue deinen eigenen Zoo', de_simple:'Baue deinen eigenen Zoo', en:'Build your own zoo', fr:'Construis ton propre zoo' , it:'Costruisci il tuo zoo'},
  'intro.ch3.text':        { de:'Mit deinem Startkapital teleportierst du dich in die <b>nächste Welt</b><br>und hilfst dort, den <b>intergalaktischen Mega-Zoo</b> zu bauen —<br>mit Tieren, die du kennst,<br>und mit Kreaturen, die du <b>noch nie gesehen hast</b>... 6/7, einfach nur krass.',
                              de_simple:'Mit deinem Startkapital kannst du dich in die <b>nächste Welt teleportieren</b><br>und dort helfen, den <b>intergalaktischen Mega-Zoo</b> zu erschaffen —<br>mit bekannten Tieren aus unserer Welt<br>und mit Kreaturen, die du <b>noch nie gesehen hast</b>...',
                              en:'With your starting capital you can <b>teleport to the next world</b><br>and help create the <b>intergalactic mega-zoo</b> there —<br>with familiar animals from our world<br>and creatures you\'ve <b>never seen before</b>...',
                              fr:'Avec ton capital de départ, tu peux <b>te téléporter dans le monde suivant</b><br>et aider à créer le <b>méga-zoo intergalactique</b> —<br>avec des animaux familiers de notre monde<br>et des créatures que tu n\'as <b>jamais vues</b>...' , it:'Con il tuo capitale di partenza puoi <b>teletrasportarti nel prossimo mondo</b><br>e aiutare a creare lì il <b>mega-zoo intergalattico</b> —<br>con animali familiari del nostro mondo<br>e creature che <b>non hai mai visto prima</b>...'},
  'intro.ch4.label':       { de:'Zusammen stärker', de_simple:'Zusammen stärker', en:'Stronger together', fr:'Plus forts ensemble' , it:'Più forti insieme'},
  'intro.ch4.title':       { de:'Du bist nicht allein', de_simple:'Du bist nicht allein', en:'You are not alone', fr:'Tu n\'es pas seul' , it:'Non sei solo'},
  'intro.ch4.text':        { de:'Mischa und Janosch zählen auf dich, Bro.<br><br><b>Bist du dabei?</b><br>Mach den ersten Move. <b>Jetzt!</b>',
                              de_simple:'Mischa und Janosch zählen auf dich.<br><br><b>Machst du mit?</b><br>Mach den ersten Schritt. <b>Jetzt!</b>',
                              en:'Mischa and Janosch are counting on you.<br><br><b>Will you join in?</b><br>Take the first step. <b>Now!</b>',
                              fr:'Mischa et Janosch comptent sur toi.<br><br><b>Tu participes ?</b><br>Fais le premier pas. <b>Maintenant !</b>' , it:'Mischa e Janosch contano su di te.<br><br><b>Ci stai?</b><br>Fai il primo passo. <b>Adesso!</b>'},
  'intro.ch5.label':       { de:'Deine Geschichte beginnt', de_simple:'Deine Geschichte beginnt', en:'Your story begins', fr:'Ton histoire commence' , it:'La tua storia inizia'},
  'intro.ch5.title':       { de:'Bist du bereit?', de_simple:'Bist du bereit?', en:'Are you ready?', fr:'Es-tu prêt ?' , it:'Sei pronto?'},
  'intro.ch5.text':        { de:'Die Reise startet.<br>Lös die Rätsel. Bau den Zoo.<br><br><b>Werde Teil von was richtig Grossem.</b><br><br>⏳ <b>Heads up:</b> Das Ganze läuft nur bis zum <b>{deadline}</b> — wer dann oben steht, hat gewonnen. No cap!',
                              de_simple:'Die Reise beginnt.<br>Lös die Rätsel. Bau den Zoo.<br><br><b>Werde Teil von etwas Grossem.</b><br><br>⏳ <b>Achtung:</b> Das Abenteuer dauert nur bis zum <b>{deadline}</b> — wer dann vorne liegt, gewinnt!',
                              en:'The journey begins.<br>Solve the puzzles. Build the zoo.<br><br><b>Become part of something big.</b><br><br>⏳ <b>Heads up:</b> The adventure only runs until <b>{deadline}</b> — whoever is in the lead then wins!',
                              fr:'Le voyage commence.<br>Résous les énigmes. Construis le zoo.<br><br><b>Fais partie de quelque chose de grand.</b><br><br>⏳ <b>Attention :</b> L\'aventure ne dure que jusqu\'au <b>{deadline}</b> — celui qui sera en tête à ce moment-là gagne !' , it:'Il viaggio inizia.<br>Risolvi gli enigmi. Costruisci lo zoo.<br><br><b>Diventa parte di qualcosa di grande.</b><br><br>⏳ <b>Attenzione:</b> L\'avventura dura solo fino al <b>{deadline}</b> — chi sarà in testa in quel momento vince!'},
  'intro.ch5.btn':         { de:'🚀 Auf geht\'s, Bro!', de_simple:'🚀 Abenteuer starten', en:'🚀 Start Adventure', fr:'🚀 Démarrer l\'Aventure' , it:'🚀 Inizia l\'Avventura'},
  'intro.end.sub':         { de:'+ Zoo 3D · Das Abenteuer', de_simple:'+ Zoo 3D · Das Abenteuer', en:'+ Zoo 3D · The Adventure', fr:'+ Zoo 3D · L\'Aventure' , it:'+ Zoo 3D · L\'Avventura'},
  'intro.end.btn':         { de:'▶ Jetzt spielen', de_simple:'▶ Jetzt spielen', en:'▶ Play Now', fr:'▶ Jouer Maintenant' , it:'▶ Gioca Ora'},

  // ── LANGUAGE BONUS POPUP (one-time, after registration) ──
  'langbonus.title':  { de:'Sprach-Bonus erhalten!', en:'Language Bonus received!', fr:'Bonus de langue reçu !' , it:'Bonus lingua ricevuto!'},
  'langbonus.body':   { de:'Weil du {lang} gewählt hast, bekommst du einmalig',
                         en:'Because you chose {lang}, you get a one-time',
                         fr:'Parce que tu as choisi {lang}, tu reçois un bonus unique de' , it:'Perché hai scelto {lang}, ricevi in regalo una tantum'},
  'langbonus.gift':   { de:'geschenkt!', en:'as a gift!', fr:'en cadeau !' , it:'in regalo!'},
  'langbonus.btn':    { de:'Super, danke!', en:'Great, thanks!', fr:'Super, merci !' , it:'Ottimo, grazie!'},
  'lang.name.en':     { de:'Englisch', en:'English', fr:'Anglais' , it:'Inglese'},
  'lang.name.fr':     { de:'Französisch', en:'French', fr:'Français' , it:'Francese'},

  // ── WORLD-1 GAME LIST SCREEN ──
  'gamelist.back':        { de:'◀ Welten', en:'◀ Worlds', fr:'◀ Mondes' , it:'◀ Mondi'},
  'gamelist.wardrobe':    { de:'👗 Kleider', en:'👗 Wardrobe', fr:'👗 Garde-robe' , it:'👗 Guardaroba'},
  'gamelist.joker':       { de:'Joker', en:'Joker', fr:'Joker' , it:'Jolly'},
  'gamelist.next_task':   { de:'Tippe auf die nächste Aufgabe:', en:'Tap the next task:', fr:'Touche la prochaine tâche :' , it:'Tocca il prossimo compito:'},
  'gamelist.done_of20':   { de:'geschafft', en:'done', fr:'réussi' , it:'completati'},
  'gamelist.font_hint_t': { de:'Schrift zu klein?', en:'Text too small?', fr:'Texte trop petit ?' , it:'Testo troppo piccolo?'},
  'gamelist.font_hint_b': { de:'Schrift optimieren — mit dem Regler einstellen.', en:'Optimize text size — adjust with the slider.', fr:'Optimiser la taille du texte — ajuste avec le curseur.' , it:'Ottimizza la dimensione del testo — regola con il cursore.'},
  'fontslider.title': { de:'Schriftgrösse einstellen', en:'Adjust text size', fr:'Régler la taille du texte', it:'Regola la dimensione del testo'},
  'fontslider.subtitle': { de:'Schieb den Regler, bis es für dich passt — <b style="color:#4af">so klein wie möglich, so gross wie nötig.</b>', en:'Move the slider until it feels right — <b style="color:#4af">as small as possible, as big as needed.</b>', fr:'Déplace le curseur jusqu\'à ce que ça te convienne — <b style="color:#4af">aussi petit que possible, aussi grand que nécessaire.</b>', it:'Sposta il cursore finché non ti sembra giusto — <b style="color:#4af">il più piccolo possibile, il più grande necessario.</b>'},
  'fontslider.preview_label': { de:'Vorschau', en:'Preview', fr:'Aperçu', it:'Anteprima'},
  'fontslider.sample_text': { de:'Mischa Denkspiel — 14/20 Spiele · 🌀 11.5 MT · Tippe auf die nächste Aufgabe', en:'Mischa Denkspiel — 14/20 games · 🌀 11.5 MT · Tap the next task', fr:'Mischa Denkspiel — 14/20 jeux · 🌀 11.5 MT · Touche la prochaine tâche', it:'Mischa Denkspiel — 14/20 giochi · 🌀 11.5 MT · Tocca il prossimo compito'},
  'fontslider.small': { de:'A klein', en:'A small', fr:'A petit', it:'A piccola'},
  'fontslider.big': { de:'A gross', en:'A big', fr:'A grand', it:'A grande'},
  'fontslider.save': { de:'✅ So ist es gut!', en:'✅ This looks good!', fr:'✅ Ça me convient !', it:'✅ Va bene così!'},
  'fontslider.cancel': { de:'Abbrechen', en:'Cancel', fr:'Annuler', it:'Annulla'},
  'fontslider.device_line': { de:'Gerät: {w}x{h} · Spieler: {name}', en:'Device: {w}x{h} · Player: {name}', fr:'Appareil : {w}x{h} · Joueur : {name}', it:'Dispositivo: {w}x{h} · Giocatore: {name}'},
  'zoo.cl_banner': { de:'🏆 CHAMPIONS LEAGUE ZOO 🏆', en:'🏆 CHAMPIONS LEAGUE ZOO 🏆', fr:'🏆 ZOO CHAMPIONS LEAGUE 🏆', it:'🏆 ZOO CHAMPIONS LEAGUE 🏆'},
  'zoo.cl_rank_link': { de:'🏆 Champions League Rangliste →', en:'🏆 Champions League Ranking →', fr:'🏆 Classement Champions League →', it:'🏆 Classifica Champions League →'},
  'zoo.cl_rank_title': { de:'🏆 Champions League Rangliste', en:'🏆 Champions League Ranking', fr:'🏆 Classement Champions League', it:'🏆 Classifica Champions League'},
  'zoo.cl_rank_back': { de:'← Normale Rangliste', en:'← Normal Ranking', fr:'← Classement normal', it:'← Classifica normale'},
  'zoo.cl_rank_empty': { de:'Noch keine Champions-League-Teilnehmer.', en:'No Champions League participants yet.', fr:'Pas encore de participants Champions League.', it:'Ancora nessun partecipante alla Champions League.'},
  'pacman.invert_label': { de:'🔄 Invertieren, falls verkehrt:', en:'🔄 Invert if reversed:', fr:'🔄 Inverser si c\'est à l\'envers :', it:'🔄 Inverti se al contrario:'},
  'pacman.invert_title': { de:'Falls sich die Neigungssteuerung verkehrt herum anfühlt (z.B. rechts neigen bewegt nach links), hier ankreuzen.', en:'If the tilt controls feel reversed (e.g. tilting right moves left), check this.', fr:'Si les commandes d\'inclinaison semblent inversées (ex. incliner à droite déplace à gauche), coche ici.', it:'Se i controlli di inclinazione sembrano invertiti (es. inclinare a destra sposta a sinistra), seleziona qui.'},
  'pacman.invert_x': { de:'Links/Rechts ↔', en:'Left/Right ↔', fr:'Gauche/Droite ↔', it:'Sinistra/Destra ↔'},
  'pacman.invert_y': { de:'Oben/Unten ↕', en:'Up/Down ↕', fr:'Haut/Bas ↕', it:'Su/Giù ↕'},
  'ds.cl_rank_title': { de:'🏆 Champions League', en:'🏆 Champions League', fr:'🏆 Champions League', it:'🏆 Champions League'},
  'ds.cl_rank_link': { de:'🏆 Champions League Rangliste →', en:'🏆 Champions League Ranking →', fr:'🏆 Classement Champions League →', it:'🏆 Classifica Champions League →'},
  'ds.cl_rank_back': { de:'← Normale Rangliste', en:'← Normal Ranking', fr:'← Classement normal', it:'← Classifica normale'},
  'ds.cl_rank_empty': { de:'Noch keine Champions-League-Teilnehmer', en:'No Champions League participants yet', fr:'Pas encore de participants Champions League', it:'Ancora nessun partecipante alla Champions League'},
  'zoo.tips_label': { de:'Tipps', en:'Tips', fr:'Astuces', it:'Consigli'},
  'zoo.tips_on': { de:'💡 Tipps aktiviert!', en:'💡 Tips enabled!', fr:'💡 Astuces activées !', it:'💡 Consigli attivati!'},
  'zoo.tips_off': { de:'💡 Tipps deaktiviert.', en:'💡 Tips disabled.', fr:'💡 Astuces désactivées.', it:'💡 Consigli disattivati.'},

  // ── MINI-GAME INSTRUCTIONS (shown before each game starts) ──
  'instr.dart':        { de:'🎯 <b>Dart!</b><br>Wirf 3 Pfeile auf die Scheibe. Klicke oder tippe auf die Scheibe — je näher zur Mitte, desto mehr Punkte!<br>📱 Handy/Tablet: Das Steuerkreuz rechts neben der Scheibe zum Zielen nutzen, loslassen = Wurf.',
    en:'🎯 <b>Darts!</b><br>Throw 3 darts at the board. Click or tap the board — the closer to the center, the more points!<br>📱 Phone/Tablet: use the control pad next to the board to aim, release = throw.',
    fr:'🎯 <b>Fléchettes !</b><br>Lance 3 fléchettes sur la cible. Clique ou touche la cible — plus tu es près du centre, plus tu marques de points !<br>📱 Téléphone/Tablette : utilise la croix de direction à côté de la cible pour viser, relâche = lancer.' , it:'🎯 <b>Freccette!</b><br>Lancia 3 freccette sul bersaglio. Clicca o tocca il bersaglio — più vicino al centro, più punti!<br>📱 Telefono/Tablet: usa il pad di controllo accanto al bersaglio per mirare, rilascia = lancio.'},
  'instr.math':        { de:'🔢 <b>Rechnen!</b><br>Löse Mathe-Aufgaben so schnell wie möglich. Tippe die richtige Antwort ein und bestätige mit Enter.',
    en:'🔢 <b>Math!</b><br>Solve math problems as fast as you can. Type the correct answer and confirm with Enter.',
    fr:'🔢 <b>Calcul !</b><br>Résous des problèmes de maths le plus vite possible. Tape la bonne réponse et valide avec Entrée.' , it:'🔢 <b>Calcolo!</b><br>Risolvi i problemi di matematica il più velocemente possibile. Digita la risposta corretta e conferma con Invio.'},
  'instr.reaction':    { de:'⚡ <b>Reaktion!</b><br>Drücke den Knopf so schnell wie möglich, sobald das Signal erscheint. Warte auf grün!',
    en:'⚡ <b>Reaction!</b><br>Press the button as fast as you can as soon as the signal appears. Wait for green!',
    fr:'⚡ <b>Réaction !</b><br>Appuie sur le bouton le plus vite possible dès que le signal apparaît. Attends le vert !' , it:'⚡ <b>Reazione!</b><br>Premi il pulsante il più velocemente possibile appena appare il segnale. Aspetta il verde!'},
  'instr.memory':      { de:'🧠 <b>Memory!</b><br>Finde alle Paare! Drehe zwei Karten um — stimmen sie überein, bleiben sie offen.',
    en:'🧠 <b>Memory!</b><br>Find all the pairs! Flip two cards — if they match, they stay open.',
    fr:'🧠 <b>Memory !</b><br>Trouve toutes les paires ! Retourne deux cartes — si elles correspondent, elles restent ouvertes.' , it:'🧠 <b>Memory!</b><br>Trova tutte le coppie! Gira due carte — se corrispondono, restano aperte.'},
  'instr.train':       { de:'🚂 <b>Zug!</b><br>Lenke den Zug ans Ziel. Tippe auf die Weichen, um die Richtung zu ändern.',
    en:'🚂 <b>Train!</b><br>Guide the train to its destination. Tap the switches to change direction.',
    fr:'🚂 <b>Train !</b><br>Guide le train jusqu\'à destination. Touche les aiguillages pour changer de direction.' , it:'🚂 <b>Treno!</b><br>Guida il treno a destinazione. Tocca gli scambi per cambiare direzione.'},
  'instr.shutthebox':  { de:'🎲 <b>Shut the Box!</b><br>Würfle und lege Zahlen um, deren Summe der Würfelzahl entspricht. Lege alle Zahlen um!',
    en:'🎲 <b>Shut the Box!</b><br>Roll the dice and flip down numbers that add up to the roll. Flip down every number!',
    fr:'🎲 <b>Shut the Box !</b><br>Lance les dés et rabats des nombres dont la somme correspond au résultat. Rabats tous les nombres !' , it:'🎲 <b>Shut the Box!</b><br>Lancia i dadi e abbassa i numeri la cui somma corrisponde al risultato. Abbassa tutti i numeri!'},
  'instr.sokoban':     { de:'📦 <b>Sokoban!</b><br>Schiebe die Kisten auf die markierten Zielfelder. Du kannst Kisten nur schieben, nicht ziehen!',
    en:'📦 <b>Sokoban!</b><br>Push the boxes onto the marked target spots. You can only push boxes, not pull them!',
    fr:'📦 <b>Sokoban !</b><br>Pousse les caisses sur les cases cibles marquées. Tu ne peux que pousser les caisses, pas les tirer !' , it:'📦 <b>Sokoban!</b><br>Spingi le casse sulle caselle bersaglio segnate. Puoi solo spingere le casse, non tirarle!'},
  'instr.jenga':       { de:'🏎️ <b>Race — 1km Rennen!</b><br>Fahre 1 km so schnell wie möglich.<br>📱 Mobile: Gas / Bremse / Drehen-Buttons<br>🖥️ Desktop: → Gas · ← Bremse · ↑ Drehen CW · ↓ Drehen CCW<br>Springe über Hügel — Überschlag = Ende!',
    en:'🏎️ <b>Race — 1km Race!</b><br>Drive 1 km as fast as you can.<br>📱 Mobile: Gas / Brake / Rotate buttons<br>🖥️ Desktop: → Gas · ← Brake · ↑ Rotate CW · ↓ Rotate CCW<br>Jump over hills — flipping over = game over!',
    fr:'🏎️ <b>Course — 1 km de course !</b><br>Parcours 1 km le plus vite possible.<br>📱 Mobile : boutons Accélérer / Freiner / Tourner<br>🖥️ Ordinateur : → Accélérer · ← Freiner · ↑ Tourner (horaire) · ↓ Tourner (antihoraire)<br>Saute par-dessus les collines — un tonneau = fin de partie !' , it:'🏎️ <b>Corsa — Gara di 1km!</b><br>Percorri 1 km il più velocemente possibile.<br>📱 Mobile: pulsanti Acceleratore / Freno / Ruota<br>🖥️ Desktop: → Acceleratore · ← Freno · ↑ Ruota orario · ↓ Ruota antiorario<br>Salta sopra le colline — un ribaltamento = fine partita!'},
  'instr.stunt':       { de:'🏎️ <b>Race — 1km Rennen!</b><br>Fahre 1 km so schnell wie möglich.<br>📱 Mobile: Gas / Bremse / Drehen-Buttons<br>🖥️ Desktop: → Gas · ← Bremse · ↑ Drehen CW · ↓ Drehen CCW<br>Springe über Hügel — Überschlag = Ende!',
    en:'🏎️ <b>Race — 1km Race!</b><br>Drive 1 km as fast as you can.<br>📱 Mobile: Gas / Brake / Rotate buttons<br>🖥️ Desktop: → Gas · ← Brake · ↑ Rotate CW · ↓ Rotate CCW<br>Jump over hills — flipping over = game over!',
    fr:'🏎️ <b>Course — 1 km de course !</b><br>Parcours 1 km le plus vite possible.<br>📱 Mobile : boutons Accélérer / Freiner / Tourner<br>🖥️ Ordinateur : → Accélérer · ← Freiner · ↑ Tourner (horaire) · ↓ Tourner (antihoraire)<br>Saute par-dessus les collines — un tonneau = fin de partie !' , it:'🏎️ <b>Corsa — Gara di 1km!</b><br>Percorri 1 km il più velocemente possibile.<br>📱 Mobile: pulsanti Acceleratore / Freno / Ruota<br>🖥️ Desktop: → Acceleratore · ← Freno · ↑ Ruota orario · ↓ Ruota antiorario<br>Salta sopra le colline — un ribaltamento = fine partita!'},
  'instr.slider':      { de:'🧩 <b>Schiebepuzzle!</b><br>Schiebe die Teile, bis das Bild vollständig ist. Tippe auf ein Teil neben dem Leerfeld, um es zu verschieben.',
    en:'🧩 <b>Sliding Puzzle!</b><br>Slide the pieces until the picture is complete. Tap a piece next to the empty space to move it.',
    fr:'🧩 <b>Puzzle coulissant !</b><br>Fais glisser les pièces jusqu\'à ce que l\'image soit complète. Touche une pièce à côté de la case vide pour la déplacer.' , it:'🧩 <b>Puzzle scorrevole!</b><br>Sposta i pezzi finché l\'immagine è completa. Tocca un pezzo accanto allo spazio vuoto per spostarlo.'},
  'instr.wordsearch':  { de:'🔤 <b>Wortsuche!</b><br>Finde alle versteckten Wörter im Buchstabengitter. Wische über die Buchstaben.',
    en:'🔤 <b>Word Search!</b><br>Find all the hidden words in the letter grid. Swipe across the letters.',
    fr:'🔤 <b>Recherche de mots !</b><br>Trouve tous les mots cachés dans la grille de lettres. Glisse sur les lettres.' , it:'🔤 <b>Cerca parole!</b><br>Trova tutte le parole nascoste nella griglia di lettere. Scorri sulle lettere.'},
  'instr.typing':      { de:'🟩 <b>Tetris!</b><br>Bewege und drehe fallende Blöcke, um vollständige Reihen zu bilden.<br>📱 Mobile: Buttons zum Steuern<br>🖥️ Desktop: ← → bewegen · ↑ oder Leertaste drehen · ↓ schneller fallen lassen.',
    en:'🟩 <b>Tetris!</b><br>Move and rotate the falling blocks to form complete rows.<br>📱 Mobile: buttons to control<br>🖥️ Desktop: ← → move · ↑ or Space to rotate · ↓ drop faster.',
    fr:'🟩 <b>Tetris !</b><br>Déplace et fais pivoter les blocs qui tombent pour former des rangées complètes.<br>📱 Mobile : boutons pour contrôler<br>🖥️ Ordinateur : ← → déplacer · ↑ ou Espace pour pivoter · ↓ faire tomber plus vite.' , it:'🟩 <b>Tetris!</b><br>Muovi e ruota i blocchi che cadono per formare righe complete.<br>📱 Mobile: pulsanti per il controllo<br>🖥️ Desktop: ← → muovi · ↑ o Spazio ruota · ↓ fai cadere più velocemente.'},
  'instr.balloon':     { de:'🐍 <b>Snake!</b><br>Steuere die Schlange mit den Pfeiltasten oder Wischen. Friss Äpfel, werde länger — berühre nicht dich selbst!',
    en:'🐍 <b>Snake!</b><br>Steer the snake with the arrow keys or by swiping. Eat apples to grow longer — don\'t touch yourself!',
    fr:'🐍 <b>Snake !</b><br>Dirige le serpent avec les touches fléchées ou en glissant. Mange des pommes pour grandir — ne te touche pas toi-même !' , it:'🐍 <b>Snake!</b><br>Guida il serpente con le frecce o scorrendo. Mangia le mele per allungarti — non toccarti da solo!'},
  'instr.simon':       { de:'🎨 <b>Simon!</b><br>Merke dir die Farbfolge und wiederhole sie. Wird nach jeder Runde länger.',
    en:'🎨 <b>Simon!</b><br>Remember the color sequence and repeat it. It gets longer every round.',
    fr:'🎨 <b>Simon !</b><br>Mémorise la séquence de couleurs et reproduis-la. Elle s\'allonge à chaque tour.' , it:'🎨 <b>Simon!</b><br>Memorizza la sequenza di colori e ripetila. Si allunga a ogni round.'},
  'instr.truefalse':   { de:'❓ <b>Wahr oder Falsch?</b><br>Beantworte Fragen mit Wahr oder Falsch. Tippe auf den richtigen Knopf.',
    en:'❓ <b>True or False?</b><br>Answer questions with True or False. Tap the correct button.',
    fr:'❓ <b>Vrai ou Faux ?</b><br>Réponds aux questions par Vrai ou Faux. Touche le bon bouton.' , it:'❓ <b>Vero o Falso?</b><br>Rispondi alle domande con Vero o Falso. Tocca il pulsante corretto.'},
  'instr.anagram':     { de:'🔤 <b>Anagramm!</b><br>Ordne die durcheinander gewürfelten Buchstaben zum richtigen Wort.',
    en:'🔤 <b>Anagram!</b><br>Rearrange the scrambled letters to form the correct word.',
    fr:'🔤 <b>Anagramme !</b><br>Réorganise les lettres mélangées pour former le bon mot.' , it:'🔤 <b>Anagramma!</b><br>Riordina le lettere mescolate per formare la parola corretta.'},
  'instr.colormix':    { de:'🎨 <b>Farben mischen!</b><br>Mische die richtigen Farben, um den gewünschten Farbton zu erreichen.',
    en:'🎨 <b>Color Mixing!</b><br>Mix the right colors to reach the target shade.',
    fr:'🎨 <b>Mélange de couleurs !</b><br>Mélange les bonnes couleurs pour obtenir la teinte demandée.' , it:'🎨 <b>Mescola i colori!</b><br>Mescola i colori giusti per ottenere la tonalità richiesta.'},
  'instr.clock':       { de:'🕐 <b>Uhr!</b><br>Stelle die Uhrzeiger auf die angezeigte Zeit.',
    en:'🕐 <b>Clock!</b><br>Set the clock hands to the displayed time.',
    fr:'🕐 <b>Horloge !</b><br>Règle les aiguilles sur l\'heure indiquée.' , it:'🕐 <b>Orologio!</b><br>Imposta le lancette sull\'ora mostrata.'},
  'instr.flags':       { de:'🌍 <b>Flaggen!</b><br>Erkenne die Flagge und wähle das richtige Land.',
    en:'🌍 <b>Flags!</b><br>Recognize the flag and choose the correct country.',
    fr:'🌍 <b>Drapeaux !</b><br>Reconnais le drapeau et choisis le bon pays.' , it:'🌍 <b>Bandiere!</b><br>Riconosci la bandiera e scegli il paese corretto.'},
  'instr.hangman':     { de:'🎯 <b>Hangman!</b><br>Errate das versteckte Wort Buchstabe für Buchstabe.',
    en:'🎯 <b>Hangman!</b><br>Guess the hidden word letter by letter.',
    fr:'🎯 <b>Pendu !</b><br>Devine le mot caché lettre par lettre.' , it:'🎯 <b>Impiccato!</b><br>Indovina la parola nascosta lettera per lettera.'},
  'instr.tictactoe':   { de:'❌ <b>Tic-Tac-Toe!</b><br>Setze 3 in einer Reihe gegen den Computer.',
    en:'❌ <b>Tic-Tac-Toe!</b><br>Get 3 in a row against the computer.',
    fr:'❌ <b>Morpion !</b><br>Aligne 3 symboles contre l\'ordinateur.' , it:'❌ <b>Tris!</b><br>Allinea 3 simboli contro il computer.'},
  'instr.weight':      { de:'⚖️ <b>Gewichte!</b><br>Schätze welche Seite der Waage schwerer ist.',
    en:'⚖️ <b>Weights!</b><br>Guess which side of the scale is heavier.',
    fr:'⚖️ <b>Poids !</b><br>Devine quel côté de la balance est le plus lourd.' , it:'⚖️ <b>Pesi!</b><br>Indovina quale lato della bilancia è più pesante.'},
  'instr.basketball':  { de:'🏀 <b>Basketball!</b><br>Wirf den Ball ins Korb — tippe auf den Knopf im richtigen Moment.',
    en:'🏀 <b>Basketball!</b><br>Shoot the ball into the hoop — tap the button at the right moment.',
    fr:'🏀 <b>Basketball !</b><br>Lance le ballon dans le panier — touche le bouton au bon moment.' , it:'🏀 <b>Basket!</b><br>Tira la palla nel canestro — tocca il pulsante al momento giusto.'},
  'instr.emojistory':  { de:'📖 <b>Emoji Story!</b><br>Errate die Geschichte oder den Film hinter den Emojis.',
    en:'📖 <b>Emoji Story!</b><br>Guess the story or movie behind the emojis.',
    fr:'📖 <b>Histoire en emojis !</b><br>Devine l\'histoire ou le film derrière les emojis.' , it:'📖 <b>Storia in Emoji!</b><br>Indovina la storia o il film dietro le emoji.'},
  'instr.geo':         { de:'🗺️ <b>Geografie!</b><br>Zeige auf die richtige Position auf der Karte.',
    en:'🗺️ <b>Geography!</b><br>Point to the correct location on the map.',
    fr:'🗺️ <b>Géographie !</b><br>Montre le bon endroit sur la carte.' , it:'🗺️ <b>Geografia!</b><br>Indica il posto giusto sulla mappa.'},
  'instr.french':      { de:'🇫🇷 <b>Französisch!</b><br>Übersetze die Wörter von Deutsch nach Französisch.',
    en:'🇫🇷 <b>French!</b><br>Translate the words from German to French.',
    fr:'🇫🇷 <b>Français !</b><br>Traduis les mots de l\'allemand vers le français.' , it:'🇫🇷 <b>Francese!</b><br>Traduci le parole dal tedesco al francese.'},
  'instr.riddle':      { de:'🧩 <b>Rätsel!</b><br>Löse das Rätsel und tippe deine Antwort ein.',
    en:'🧩 <b>Riddle!</b><br>Solve the riddle and type your answer.',
    fr:'🧩 <b>Énigme !</b><br>Résous l\'énigme et tape ta réponse.' , it:'🧩 <b>Indovinello!</b><br>Risolvi l\'indovinello e digita la tua risposta.'},
  'instr.pacman':      { de:'🎯 <b>Bomber!</b><br>Zerstöre ALLE Geister mit deinen Bomben. 💣 legt eine Bombe — sie explodiert nach 2 Sekunden in vier Richtungen. Wände blocken den Strahl. Sammle magische Steine 💎 (oder töte Geister), um den Bomben-Strahl zu verlängern!<br>📱 Mobil: Richtungstasten + 💣-Knopf, oder Gerät neigen<br>🖥️ Desktop: Pfeiltasten + Leertaste',
    en:'🎯 <b>Bomber!</b><br>Destroy ALL ghosts with your bombs. 💣 places a bomb — it explodes after 2 seconds in four directions. Walls block the blast. Collect magic stones 💎 (or kill ghosts) to extend your bomb range!<br>📱 Mobile: direction buttons + 💣 button, or tilt device<br>🖥️ Desktop: arrow keys + spacebar',
    fr:'🎯 <b>Bomber !</b><br>Détruis TOUS les fantômes avec tes bombes. 💣 pose une bombe — elle explose après 2 secondes dans quatre directions. Les murs bloquent l\'explosion. Collecte les pierres magiques 💎 (ou tue des fantômes) pour augmenter la portée de tes bombes !<br>📱 Mobile : touches directionnelles + bouton 💣, ou incline l\'appareil<br>🖥️ Ordinateur : touches fléchées + barre d\'espace' , it:'🎯 <b>Bomber!</b><br>Distruggi TUTTI i fantasmi con le tue bombe. 💣 posiziona una bomba — esplode dopo 2 secondi in quattro direzioni. I muri bloccano l\'esplosione. Raccogli pietre magiche 💎 (o uccidi i fantasmi) per allungare la portata delle bombe!<br>📱 Mobile: tasti direzionali + pulsante 💣, o inclina il dispositivo<br>🖥️ Desktop: frecce + barra spaziatrice'},
  'instr.catapult':    { de:'🥐 <b>Croissant-Schleuder!</b><br>Ziehe die Schleuder zurück und lass los, um zu schiessen! Triff die Croissants 🥐 und Baguettes 🥖 — bewegte Ziele bringen mehr Punkte als stehende. Du hast 10 Schüsse.<br>📱 Mobile: mit dem Finger ziehen<br>🖥️ Desktop: mit der Maus ziehen',
    en:'🥐 <b>Croissant Catapult!</b><br>Pull back the slingshot and let go to shoot! Hit the croissants 🥐 and baguettes 🥖 — moving targets are worth more than still ones. You have 10 shots.<br>📱 Mobile: drag with your finger<br>🖥️ Desktop: drag with the mouse',
    fr:'🥐 <b>Catapulte à croissants !</b><br>Tire sur la fronde et relâche pour tirer ! Touche les croissants 🥐 et les baguettes 🥖 — les cibles en mouvement rapportent plus de points que les fixes. Tu as 10 tirs.<br>📱 Mobile : fais glisser avec le doigt<br>🖥️ Ordinateur : fais glisser avec la souris' , it:'🥐 <b>Catapulta di Croissant!</b><br>Tira indietro la fionda e rilascia per sparare! Colpisci i croissant 🥐 e le baguette 🥖 — i bersagli in movimento valgono di più di quelli fermi. Hai 10 tiri.<br>📱 Mobile: trascina con il dito<br>🖥️ Desktop: trascina con il mouse'},
  'instr.starwars':    { de:'🚀 <b>Star Wars — Weltraum-Shooter!</b><br>Schiesse die feindlichen Raumschiffe ab, bevor sie landen! Du hast 3 Leben.<br>📱 Mobile: ◀ ▶ zum Bewegen, Schiessen-Button<br>🖥️ Desktop: ← → bewegen, Leertaste schiessen',
    en:'🚀 <b>Star Wars — Space Shooter!</b><br>Shoot down the enemy ships before they land! You have 3 lives.<br>📱 Mobile: ◀ ▶ to move, Fire button<br>🖥️ Desktop: ← → move, Spacebar to fire',
    fr:'🚀 <b>Star Wars — Tireur spatial !</b><br>Abats les vaisseaux ennemis avant qu\'ils n\'atterrissent ! Tu as 3 vies.<br>📱 Mobile : ◀ ▶ pour te déplacer, bouton Tirer<br>🖥️ Ordinateur : ← → se déplacer, Espace pour tirer' , it:'🚀 <b>Star Wars — Sparatutto Spaziale!</b><br>Abbatti le astronavi nemiche prima che atterrino! Hai 3 vite.<br>📱 Mobile: ◀ ▶ per muoverti, pulsante Spara<br>🖥️ Desktop: ← → muoviti, Spazio per sparare'},
  'instr.pong':        { de:'🏓 <b>Pong — Tennis-Klassiker!</b><br>Der Ball wird mit der Zeit SCHNELLER — reagiere rechtzeitig! Erste 7 Punkte gewinnt oder wer nach 60s mehr hat.<br>📱 Mobile: ▲ ▼ Buttons<br>🖥️ Desktop: ↑ ↓ Pfeiltasten',
    en:'🏓 <b>Pong — Classic Tennis!</b><br>The ball gets FASTER over time — react in time! First to 7 points wins, or whoever has more after 60s.<br>📱 Mobile: ▲ ▼ buttons<br>🖥️ Desktop: ↑ ↓ arrow keys',
    fr:'🏓 <b>Pong — Le classique du tennis !</b><br>La balle devient de plus en plus RAPIDE — réagis à temps ! Le premier à 7 points gagne, ou celui qui en a le plus après 60s.<br>📱 Mobile : boutons ▲ ▼<br>🖥️ Ordinateur : touches fléchées ↑ ↓' , it:'🏓 <b>Pong — Il classico del tennis!</b><br>La palla diventa sempre più VELOCE — reagisci in tempo! Vince chi arriva prima a 7 punti, o chi ne ha di più dopo 60s.<br>📱 Mobile: pulsanti ▲ ▼<br>🖥️ Desktop: frecce ↑ ↓'},
  'instr.fallback':    { de:'🎮 <b>Los geht\'s!</b><br>Spiele das Spiel so gut du kannst!',
    en:'🎮 <b>Let\'s go!</b><br>Play the game as well as you can!',
    fr:'🎮 <b>C\'est parti !</b><br>Joue le mieux possible !' , it:'🎮 <b>Si comincia!</b><br>Gioca al meglio delle tue capacità!'},

  // ── SHARED IN-GAME UI (reused across many of the 20 mini-games) ──
  'game.continue':     { de:'Weiter ➜', en:'Next ➜', fr:'Suivant ➜' , it:'Avanti ➜'},
  'game.you':          { de:'Du', en:'You', fr:'Toi' , it:'Tu'},
  'game.cpu':          { de:'CPU', en:'CPU', fr:'Ordi' , it:'CPU'},
  'game.wait':         { de:'warte', en:'waiting', fr:'attente' , it:'attesa'},
  'game.remaining':    { de:'Rest:', en:'Left:', fr:'Reste :' , it:'Rimasti:'},

  // ── DART ──
  'dart.wind.calm':    { de:'Windstill', en:'Calm', fr:'Calme' , it:'Calmo'},
  'dart.wind.light':   { de:'Leichte Brise', en:'Light breeze', fr:'Brise légère' , it:'Brezza leggera'},
  'dart.wind.moderate':{ de:'Mäßig', en:'Moderate', fr:'Modéré' , it:'Moderato'},
  'dart.wind.strong':  { de:'Stark', en:'Strong', fr:'Fort' , it:'Forte'},
  'dart.wind.storm':   { de:'Sturm', en:'Storm', fr:'Tempête' , it:'Tempesta'},
  'dart.dart_n':       { de:'Pfeil', en:'Dart', fr:'Fléchette' , it:'Freccetta'},
  'dart.doubleout_warn':{ de:'⚠️ Double-Out! Letzter Pfeil muss Double oder Bull treffen!', en:'⚠️ Double-Out! Last dart must hit a Double or Bull!', fr:'⚠️ Double sortie ! La dernière fléchette doit toucher un Double ou le centre !' , it:'⚠️ Doppio finale! L\'ultima freccetta deve colpire un Doppio o il centro!'},
  'dart.you_won':      { de:'Du hast gewonnen!', en:'You won!', fr:'Tu as gagné !' , it:'Hai vinto!'},
  'dart.cpu_won':      { de:'CPU hat gewonnen!', en:'CPU won!', fr:'L\'ordi a gagné !' , it:'Il CPU ha vinto!'},
  'dart.rematch':      { de:'🔄 Revanche!', en:'🔄 Rematch!', fr:'🔄 Revanche !' , it:'🔄 Rivincita!'},
  'dart.release_throw':{ de:'los=Wurf', en:'release=throw', fr:'relâcher=lancer' , it:'rilascia=lancia'},
  'dart.cpu_throwing': { de:'CPU wirft...', en:'CPU is throwing...', fr:'L\'ordi lance...' , it:'Il CPU sta lanciando...'},

  // ── MATH ──
  'math.task_n':       { de:'Aufgabe', en:'Question', fr:'Question' , it:'Domanda'},
  'math.errors':        { de:'Fehler', en:'errors', fr:'erreurs' , it:'errori'},
  'math.times_table_hint': { de:'💡 Mal-Reihe!', en:'💡 Times table!', fr:'💡 Table de multiplication !' , it:'💡 Tabellina!'},
  'math.correct_n':     { de:'richtig!', en:'correct!', fr:'bonnes réponses !' , it:'corrette!'},
  'math.time':          { de:'Zeit', en:'Time', fr:'Temps' , it:'Tempo'},
  'math.points':        { de:'Punkte', en:'Points', fr:'Points' , it:'Punti'},
  'math.great_job':     { de:'Super gemacht! 🏆', en:'Great job! 🏆', fr:'Super boulot ! 🏆' , it:'Ottimo lavoro! 🏆'},
  'math.need_6_of_10':  { de:'Mindestens 6/10 für die nächste Aufgabe!', en:'At least 6/10 needed for the next task!', fr:'Au moins 6/10 pour passer à la tâche suivante !' , it:'Servono almeno 6/10 per il prossimo compito!'},
  'math.try_again':     { de:'🔄 Nochmal', en:'🔄 Try again', fr:'🔄 Recommencer' , it:'🔄 Riprova'},
  'math.continue_anyway': { de:'Trotzdem weiter ➜', en:'Continue anyway ➜', fr:'Continuer quand même ➜' , it:'Continua comunque ➜'},

  // ── MEMORY ──
  'memory.found':       { de:'Gefunden:', en:'Found:', fr:'Trouvées :' , it:'Trovate:'},
  'memory.attempts':    { de:'Versuche:', en:'Attempts:', fr:'Essais :' , it:'Tentativi:'},
  'memory.all_found':   { de:'Alle Paare gefunden!', en:'All pairs found!', fr:'Toutes les paires trouvées !' , it:'Tutte le coppie trovate!'},
  'memory.mistakes':    { de:'Fehlversuche', en:'Mistakes', fr:'Erreurs' , it:'Errori'},

  // ── REACTION ──
  'reaction.round':     { de:'Runde', en:'Round', fr:'Manche' , it:'Round'},
  'reaction.legend':    { de:'🟢 = Tippen · 🔴 = NICHT tippen', en:'🟢 = Tap · 🔴 = DO NOT tap', fr:'🟢 = Toucher · 🔴 = NE PAS toucher' , it:'🟢 = Tocca · 🔴 = NON toccare'},
  'reaction.too_slow':  { de:'Zu langsam!', en:'Too slow!', fr:'Trop lent !' , it:'Troppo lento!'},
  'reaction.dont_tap':  { de:'Falsch! Nicht tippen!', en:'Wrong! Don\'t tap!', fr:'Faux ! Ne touche pas !' , it:'Sbagliato! Non toccare!'},
  'reaction.avg':       { de:'Ø Reaktion', en:'Avg. reaction', fr:'Moy. réaction' , it:'Reazione media'},

  // ── TRUE/FALSE ──
  'tf.question_n':     { de:'Frage', en:'Question', fr:'Question' , it:'Domanda'},
  'tf.true':            { de:'✅ Wahr', en:'✅ True', fr:'✅ Vrai' , it:'✅ Vero'},
  'tf.false':           { de:'❌ Falsch', en:'❌ False', fr:'❌ Faux' , it:'❌ Falso'},
  'tf.correct':         { de:'✅ Richtig!', en:'✅ Correct!', fr:'✅ Correct !' , it:'✅ Corretto!'},
  'tf.wrong_answer_was':{ de:'❌ Falsch! Die Antwort war:', en:'❌ Wrong! The answer was:', fr:'❌ Faux ! La réponse était :' , it:'❌ Sbagliato! La risposta era:'},
  'tf.answer_true':     { de:'Wahr', en:'True', fr:'Vrai' , it:'Vero'},
  'tf.answer_false':    { de:'Falsch', en:'False', fr:'Faux' , it:'Falso'},

  // ── SHUT THE BOX ──
  'stb.roll_n':         { de:'Wurf', en:'Roll', fr:'Lancer' , it:'Lancio'},
  'stb.open':           { de:'Offen:', en:'Open:', fr:'Ouvert :' , it:'Aperto:'},
  'stb.roll_dice':      { de:'Würfeln!', en:'Roll!', fr:'Lancer !' , it:'Lancia!'},
  'stb.no_move':        { de:'❌ Kein Zug möglich! Spiel endet.', en:'❌ No move possible! Game over.', fr:'❌ Aucun coup possible ! Fin de partie.' , it:'❌ Nessuna mossa possibile! Partita finita.'},
  'stb.choose_sum':      { de:'Wähle Zahlen die zusammen', en:'Choose numbers that add up to', fr:'Choisis des nombres qui font ensemble' , it:'Scegli numeri che sommati fanno'},
  'stb.close':          { de:'✅ Schliessen', en:'✅ Close', fr:'✅ Fermer' , it:'✅ Chiudi'},
  'stb.cancel':         { de:'✕ Abbrechen', en:'✕ Cancel', fr:'✕ Annuler' , it:'✕ Annulla'},
  'stb.scoring_info':   { de:'💡 Alles geschlossen = beste Wertung. Sonst: je weniger am Ende offen bleibt, desto besser.', en:'💡 Everything closed = best score. Otherwise: the less that stays open at the end, the better.', fr:'💡 Tout fermé = meilleur score. Sinon : moins il reste ouvert à la fin, mieux c\'est.', it:'💡 Tutto chiuso = punteggio migliore. Altrimenti: meno resta aperto alla fine, meglio è.'},
  'reaction.percentile': { de:'Deine Reaktion war schneller als {n}% aller Spieler!', en:'Your reaction was faster than {n}% of all players!', fr:'Ta réaction était plus rapide que {n}% de tous les joueurs !', it:'La tua reazione è stata più veloce del {n}% di tutti i giocatori!'},

  // ── SOKOBAN ──
  'sokoban.controls':  { de:'Pfeiltasten/WASD · Z=Rückgängig · Wischen', en:'Arrow keys/WASD · Z=Undo · Swipe', fr:'Flèches/WASD · Z=Annuler · Glisser' , it:'Frecce/WASD · Z=Annulla · Scorri'},

  // ── SIMON ──
  'simon.watch':        { de:'👀 Schau zu!', en:'👀 Watch!', fr:'👀 Regarde !' , it:'👀 Guarda!'},
  'simon.your_turn':    { de:'👆 Deine Reihe!', en:'👆 Your turn!', fr:'👆 À toi !' , it:'👆 Tocca a te!'},
  'simon.watch_sequence': { de:'Schau dir die Reihenfolge an!', en:'Watch the sequence!', fr:'Regarde la séquence !' , it:'Guarda la sequenza!'},
  'simon.repeat_sequence': { de:'Tippe in der gleichen Reihenfolge!', en:'Tap in the same order!', fr:'Touche dans le même ordre !' , it:'Tocca nello stesso ordine!'},
  'simon.rounds_done':  { de:'Runden geschafft!', en:'rounds completed!', fr:'manches réussies !' , it:'round completati!'},
  'simon.rounds':       { de:'Runden', en:'Rounds', fr:'Manches' , it:'Round'},

  // ── COLORMIX ──
  'colormix.which_two': { de:'Welche 2 Farben ergeben zusammen...', en:'Which 2 colors together make...', fr:'Quelles 2 couleurs donnent ensemble...' , it:'Quali 2 colori insieme danno...'},
  'colormix.pick_two':  { de:'Wähle 2 Farben!', en:'Pick 2 colors!', fr:'Choisis 2 couleurs !' , it:'Scegli 2 colori!'},
  'colormix.wrong_correct_is': { de:'Falsch! Richtig:', en:'Wrong! Correct:', fr:'Faux ! Bonne réponse :' , it:'Sbagliato! Corretto:'},

  // ── SLIDER ──
  'slider.moves':       { de:'Züge:', en:'Moves:', fr:'Coups :' , it:'Mosse:'},
  'slider.moves_label': { de:'Züge', en:'Moves', fr:'Coups' , it:'Mosse'},
  'slider.hint':        { de:'Grün = am richtigen Platz ✅ · Tippe auf Nachbarfeld zum Schieben', en:'Green = in the right place ✅ · Tap an adjacent tile to slide', fr:'Vert = à la bonne place ✅ · Touche une case voisine pour glisser' , it:'Verde = al posto giusto ✅ · Tocca una casella vicina per farla scorrere'},
  'slider.shuffle':     { de:'Neu mischen', en:'Shuffle again', fr:'Remélanger' , it:'Rimescola'},
  'slider.solved':      { de:'Puzzle gelöst!', en:'Puzzle solved!', fr:'Puzzle résolu !' , it:'Puzzle risolto!'},

  // ── SNAKE ──
  'snake.mode_buttons': { de:'🎮 Tasten', en:'🎮 Buttons', fr:'🎮 Boutons' , it:'🎮 Pulsanti'},
  'snake.mode_tilt':    { de:'📱 Neigen', en:'📱 Tilt', fr:'📱 Inclinaison' , it:'📱 Inclinazione'},
  'snake.tilt_hint':    { de:'📱 Gerät neigen zum Steuern', en:'📱 Tilt your device to steer', fr:'📱 Incline l\'appareil pour diriger' , it:'📱 Inclina il dispositivo per guidare'},
  'snake.controls':     { de:'Pfeiltasten / Wischen / Neigen', en:'Arrow keys / Swipe / Tilt', fr:'Flèches / Glisser / Incliner' , it:'Frecce / Scorri / Inclina'},
  'snake.sens_fine':    { de:'📶 Fein', en:'📶 Fine', fr:'📶 Fin' , it:'📶 Fine'},
  'snake.sens_coarse':  { de:'📶 Grob', en:'📶 Coarse', fr:'📶 Brut' , it:'📶 Grossa'},

  // ── RACE (stunt/jenga) ──
  'race.goal':          { de:'ZIEL', en:'GOAL', fr:'BUT' , it:'TRAGUARDO'},
  'race.starting':      { de:'Anfahren...', en:'Starting...', fr:'Démarrage...' , it:'Partenza...'},
  'race.crash':         { de:'💥 CRASH! Neu anfahren...', en:'💥 CRASH! Starting over...', fr:'💥 CRASH ! On redémarre...' , it:'💥 SCHIANTO! Si riparte...'},

  // ── PAC-MAN ──
  'pacman.hold_steady': { de:'gerade halten', en:'hold steady', fr:'tenir droit' , it:'tieni fermo'},

  // ── STAR WARS ──
  'starwars.wave':      { de:'WELLE', en:'WAVE', fr:'VAGUE' , it:'ONDATA'},

  // ── PONG ──
  'pong.faster_in':     { de:'⚡ schneller in', en:'⚡ faster in', fr:'⚡ plus rapide dans' , it:'⚡ più veloce tra'},

  // ── ANAGRAM ──
  'anagram.word_n':     { de:'Wort', en:'Word', fr:'Mot' , it:'Parola'},
  'anagram.tap_order':  { de:'Tippe die Buchstaben in der richtigen Reihenfolge!', en:'Tap the letters in the right order!', fr:'Touche les lettres dans le bon ordre !' , it:'Tocca le lettere nell\'ordine giusto!'},
  'anagram.reset':      { de:'🔄 Zurücksetzen', en:'🔄 Reset', fr:'🔄 Réinitialiser' , it:'🔄 Reimposta'},
  'anagram.words_n':    { de:'Wörter!', en:'words!', fr:'mots !' , it:'parole!'},

  // ── WORD SEARCH ──
  'wordsearch.swipe_hint': { de:'Wische über die Buchstaben um ein Wort zu markieren!', en:'Swipe across the letters to mark a word!', fr:'Glisse sur les lettres pour marquer un mot !' , it:'Scorri sulle lettere per segnare una parola!'},
  'wordsearch.found':   { de:'gefunden!', en:'found!', fr:'trouvé !' , it:'trovata!'},
  'wordsearch.not_a_word': { de:'❌ Kein Wort — versuche nochmal!', en:'❌ Not a word — try again!', fr:'❌ Pas un mot — réessaie !' , it:'❌ Non è una parola — riprova!'},
  'wordsearch.all_found': { de:'Alle Wörter gefunden!', en:'All words found!', fr:'Tous les mots trouvés !' , it:'Tutte le parole trovate!'},

  // ── FRENCH ──
  'french.level_beginner':     { de:'Stufe: Anfänger', en:'Level: Beginner', fr:'Niveau : Débutant' , it:'Livello: Principiante'},
  'french.level_basic':        { de:'Stufe: Grundkenntnisse', en:'Level: Basic', fr:'Niveau : Bases' , it:'Livello: Base'},
  'french.level_intermediate': { de:'Stufe: Mittelstufe', en:'Level: Intermediate', fr:'Niveau : Intermédiaire' , it:'Livello: Intermedio'},
  'french.level_advanced':     { de:'Stufe: Fortgeschritten', en:'Level: Advanced', fr:'Niveau : Avancé' , it:'Livello: Avanzato'},

  // ── RANK NOTIFICATIONS ──
  'rank.now_first':    { de:'🎉 Du bist jetzt Platz 1!', en:'🎉 You\'re now #1!', fr:'🎉 Tu es maintenant 1er !' , it:'🎉 Ora sei 1°!'},
  'rank.now_place':    { de:'📈 Du bist jetzt Platz {n}!', en:'📈 You\'re now #{n}!', fr:'📈 Tu es maintenant {n}e !' , it:'📈 Ora sei {n}°!'},
  'rank.now_place_down': { de:'📉 Du bist jetzt Platz {n}.', en:'📉 You\'re now #{n}.', fr:'📉 Tu es maintenant {n}e.' , it:'📉 Ora sei {n}°.'},
  'rank.now_first_cl':    { de:'🎉 Du bist jetzt Platz 1 der Champions League!', en:'🎉 You\'re now #1 in the Champions League!', fr:'🎉 Tu es maintenant 1er de la Champions League !' , it:'🎉 Ora sei 1° nella Champions League!'},
  'rank.now_place_cl':    { de:'📈 Du bist jetzt Platz {n} der Champions League!', en:'📈 You\'re now #{n} in the Champions League!', fr:'📈 Tu es maintenant {n}e de la Champions League !' , it:'📈 Ora sei {n}° nella Champions League!'},
  'rank.now_place_down_cl': { de:'📉 Du bist jetzt Platz {n} der Champions League.', en:'📉 You\'re now #{n} in the Champions League.', fr:'📉 Tu es maintenant {n}e de la Champions League.' , it:'📉 Ora sei {n}° nella Champions League.'},
  'rank.you_passed':   { de:'Du hast {name} überholt!', en:'You passed {name}!', fr:'Tu as dépassé {name} !' , it:'Hai superato {name}!'},
  'rank.passed_you':   { de:'{name} hat dich überholt!', en:'{name} passed you!', fr:'{name} t\'a dépassé !' , it:'{name} ti ha superato!'},

  // ── TELEPORT CINEMA ──
  'teleport.phase1': { de:'🚀 Teleportation startet!', en:'🚀 Teleportation starting!', fr:'🚀 Téléportation en cours !' , it:'🚀 Teletrasporto in corso!'},
  'teleport.phase2': { de:'⭐ Durchs Universum...', en:'⭐ Through the universe...', fr:'⭐ À travers l\'univers...' , it:'⭐ Attraverso l\'universo...'},
  'teleport.phase3': { de:'🌌 Fast da!', en:'🌌 Almost there!', fr:'🌌 Presque arrivé !' , it:'🌌 Quasi arrivato!'},
  'teleport.phase4': { de:'🦁 Willkommen im Zoo!', en:'🦁 Welcome to the Zoo!', fr:'🦁 Bienvenue au Zoo !' , it:'🦁 Benvenuto allo Zoo!'},
  'boarding.skip':    { de:'Überspringen ⏭', en:'Skip ⏭', fr:'Passer ⏭' , it:'Salta ⏭'},
  'boarding.get_in':  { de:'Steig ein, {name}!', en:'Get in, {name}!', fr:'Monte, {name} !' , it:'Sali, {name}!'},
  'boarding.buckle':  { de:'Festschnallen — wir fliegen zum Zoo!', en:'Buckle up — we\'re flying to the Zoo!', fr:'Attache ta ceinture — direction le Zoo !' , it:'Allaccia la cintura — voliamo verso lo Zoo!'},
  'boarding.countdown': { de:'Triebwerke an… 3… 2… 1…', en:'Engines on… 3… 2… 1…', fr:'Moteurs allumés… 3… 2… 1…' , it:'Motori accesi… 3… 2… 1…'},
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
