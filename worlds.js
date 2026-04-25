/**
 * worlds.js v7 — 2-Welten-System
 * Welt 1: Denkspiel (20 Spiele, MT verdienen)
 * Welt 2: Zoo (Teleport für 10 MT)
 */

// ══════════════════════════════════════════
// REFERENZ-SPIELER für MT-Kalibrierung
// Janoschtest: 1 MT = Referenz-Leistung
// Bu (Admin): schwarzer Name, nicht in Rangliste
// ══════════════════════════════════════════
const SPECIAL_PLAYERS = {
  'janoschtest': { isRef: true,  inLeaderboard: false, displayName: 'Janoschtest', style: 'color:#888' },
  'bu':          { isAdmin: true, inLeaderboard: false, displayName: '🌀 Bu 🌀',    style: 'color:#000;background:#FFD700;padding:0 4px;border-radius:4px;font-weight:900' },
};

// ══════════════════════════════════════════
// 20 SPIELE (keine Duplikate)
// ══════════════════════════════════════════
const GAME_LIST = [
  // ─ Pflicht-Spiele ─
  { id:'dart',       name:'Dart',           icon:'🎯', type:'dart',       baseReward:1.0, desc:'Wirf auf die Dartscheibe — Wind & Atmung!' },
  { id:'french',     name:'Französisch',    icon:'🇫🇷', type:'truefalse',  baseReward:1.0, desc:'Französische Vokabeln — richtig oder falsch?' },
  { id:'math',       name:'Rechnen',        icon:'🔢', type:'math',       baseReward:1.0, desc:'Schnell und richtig rechnen!' },
  { id:'train',      name:'Zug',            icon:'🚂', type:'train',      baseReward:1.0, desc:'Ordne die Schweizer Zugrouten!' },
  { id:'shutthebox', name:'Shut the Box',   icon:'🎲', type:'shutthebox', baseReward:1.0, desc:'Klassisches Würfelspiel — alle Felder schliessen!' },
  // ─ Weitere Spiele ─
  { id:'memory',     name:'Memory',         icon:'🧠', type:'memory',     baseReward:1.0, desc:'Finde die Paare — teste dein Gedächtnis!' },
  { id:'anagram',    name:'Anagramm',       icon:'🔤', type:'anagram',    baseReward:1.0, desc:'Ordne die Buchstaben zum richtigen Wort!' },
  { id:'simon',      name:'Simon',          icon:'🟢', type:'simon',      baseReward:1.0, desc:'Merke dir die Farb-Sequenz!' },
  { id:'wordsearch', name:'Wortsuche',      icon:'🔍', type:'wordsearch', baseReward:1.0, desc:'Finde alle versteckten Wörter!' },
  { id:'reaction',   name:'Reaktion',       icon:'⚡', type:'reaction',   baseReward:1.0, desc:'So schnell wie möglich auf das Signal reagieren!' },
  { id:'colormix',   name:'Farbmischung',   icon:'🎨', type:'colormix',   baseReward:1.0, desc:'Mische die richtige Farbe!' },
  { id:'slider',     name:'Schiebepuzzle',  icon:'🧩', type:'slider',     baseReward:1.0, desc:'Schiebe die Teile ins richtige Muster!' },
  { id:'differences',name:'Unterschiede',   icon:'👁️', type:'differences', baseReward:1.0, desc:'Finde alle Unterschiede zwischen den Bildern!' },
  { id:'balloon',    name:'Ballon',         icon:'🎈', type:'balloon',    baseReward:1.0, desc:'Pop die richtigen Ballons!' },
  { id:'typing',     name:'Tippen',         icon:'⌨️', type:'typing',     baseReward:1.0, desc:'Tippe den Text so schnell wie möglich!' },
  { id:'jenga',      name:'Jenga',          icon:'🏗️', type:'jenga',      baseReward:1.0, desc:'Ziehe Blöcke ohne den Turm umzuwerfen!' },
  { id:'search',     name:'Suchen',         icon:'🔭', type:'search',     baseReward:1.0, desc:'Finde das gesuchte Objekt!' },
  { id:'minigames',  name:'Mini-Spiele',    icon:'🎮', type:'minigames',  baseReward:1.0, desc:'Verschiedene Mini-Herausforderungen!' },
  { id:'truefalse',  name:'Wahr oder Falsch',icon:'✅', type:'truefalse', baseReward:1.0, desc:'Ist die Aussage wahr oder falsch?' },
  { id:'quiz',       name:'Frankreich-Quiz',icon:'🗼', type:'truefalse',  baseReward:1.0, desc:'Fragen über Frankreich — wie viel weisst du?' },
];

// ══════════════════════════════════════════
// MT-BERECHNUNG
// ══════════════════════════════════════════
function calcMT(gameId, result, playerName) {
  const game = GAME_LIST.find(g => g.id === gameId);
  if (!game) return 0;
  
  const base = game.baseReward; // 1.0 MT
  let multiplier = 1.0;
  
  // Performance bonus (max 1.5x)
  if (result.passed) {
    // Time bonus: faster = more MT
    const timeBonus = result.timeMs ? Math.max(0, 1 - result.timeMs / 120000) * 0.3 : 0;
    // Error bonus: fewer errors = more MT
    const errBonus = result.errors !== undefined ? Math.max(0, 1 - result.errors * 0.1) * 0.2 : 0;
    multiplier = Math.min(1.5, 1.0 + timeBonus + errBonus);
  } else {
    // Partial reward for trying
    multiplier = 0.2;
  }
  
  return Math.round(base * multiplier * 10) / 10;
}

// ══════════════════════════════════════════
// LEADERBOARD HELPERS
// ══════════════════════════════════════════
function isInLeaderboard(playerName) {
  const lc = playerName?.toLowerCase();
  if (!lc) return false;
  const special = SPECIAL_PLAYERS[lc];
  if (special) return special.inLeaderboard;
  return true; // Normal players are in leaderboard
}

function getDisplayName(playerName) {
  const lc = playerName?.toLowerCase();
  const special = SPECIAL_PLAYERS[lc];
  if (special) return special.displayName;
  return playerName;
}

function getNameStyle(playerName) {
  const lc = playerName?.toLowerCase();
  const special = SPECIAL_PLAYERS[lc];
  if (special) return special.style || '';
  return '';
}

// ══════════════════════════════════════════
// TELEPORT COST
// ══════════════════════════════════════════
const ZOO_TELEPORT_COST = 10; // MT to enter zoo
const ZOO_FIRST_ANIMAL_COST = 5; // Min MT needed for cheapest animal (Katze)

// ══════════════════════════════════════════
// WORLDS (legacy — kept for compatibility)
// ══════════════════════════════════════════
const WORLDS = [
  {id:1,name:'Welt 1 — Denkspiel',icon:'🎮',color:'#2980B9',description:'Spiele 20 Spiele und verdiene Mischa Taler!'},
  {id:2,name:'Welt 2 — Zoo',icon:'🦁',color:'#27AE60',description:'Kaufe Tiere und baue deinen Zoo auf!'},
];

window.GAME_LIST = GAME_LIST;
window.WORLDS = WORLDS;
window.SPECIAL_PLAYERS = SPECIAL_PLAYERS;
window.calcMT = calcMT;
window.isInLeaderboard = isInLeaderboard;
window.getDisplayName = getDisplayName;
window.getNameStyle = getNameStyle;
window.ZOO_TELEPORT_COST = ZOO_TELEPORT_COST;
window.ZOO_FIRST_ANIMAL_COST = ZOO_FIRST_ANIMAL_COST;
