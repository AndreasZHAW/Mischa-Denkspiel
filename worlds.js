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
  { id:'dart',       name:'Dart',           icon:'🎯', type:'dart',       baseReward:1.0, desc:'Wirf auf die Dartscheibe!' },
  { id:'french',     name:'Französisch',    icon:'🇫🇷', type:'french',     baseReward:1.0, desc:'Französische Grammatik & Vokabeln' },
  { id:'math',       name:'Rechnen',        icon:'🔢', type:'math',       baseReward:1.0, desc:'Löse Rechenaufgaben' },
  { id:'sokoban',    name:'Sokoban',        icon:'📦', type:'sokoban',    baseReward:1.0, desc:'Schieberätsel' },
  { id:'shutthebox', name:'Shut the Box',   icon:'🎲', type:'shutthebox', baseReward:1.0, desc:'Würfelspiel' },
  { id:'memory',     name:'Memory',         icon:'🧠', type:'memory',     baseReward:1.0, desc:'Finde die Paare' },
  { id:'anagram',    name:'Anagramm',       icon:'🔤', type:'anagram',    baseReward:1.0, desc:'Ordne die Buchstaben' },
  { id:'simon',      name:'Simon',          icon:'🟢', type:'simon',      baseReward:1.0, desc:'Merke die Farbreihenfolge' },
  { id:'wordsearch', name:'Wortsuche',      icon:'🔍', type:'wordsearch', baseReward:1.0, desc:'Finde versteckte Wörter' },
  { id:'reaction',   name:'Reaktion',       icon:'⚡', type:'reaction',   baseReward:1.0, desc:'Reagiere schnell!' },
  { id:'colormix',   name:'Farben',         icon:'🎨', type:'colormix',   baseReward:1.0, desc:'Mische die Farben' },
  { id:'slider',     name:'Schiebepuzzle',  icon:'🧩', type:'slider',     baseReward:1.0, desc:'Schiebe die Teile' },
  { id:'typing',     name:'Tetris',         icon:'🟩', type:'tetris',     baseReward:1.0, desc:'Tetris spielen' },
  { id:'balloon',    name:'Snake',           icon:'🐍', type:'balloon',    baseReward:1.0, desc:'Friss Äpfel, werde länger!' },
  { id:'jenga',      name:'Race',           icon:'🏎️', type:'stunt',      baseReward:1.0, desc:'Fahre 1km so schnell wie möglich' },
  { id:'simon2',     name:'Pac-Man',        icon:'🟡', type:'pacman',     baseReward:1.5, desc:'Friss alle Punkte im Labyrinth' },
  { id:'math2',      name:'Rechnen II',     icon:'➕', type:'math',       baseReward:1.5, desc:'Schwere Rechenaufgaben' },
  { id:'memory2',    name:'Star Wars',      icon:'🚀', type:'starwars',   baseReward:1.5, desc:'Schiesse die feindlichen Raumschiffe ab' },
  { id:'truefalse',  name:'Wahr/Falsch',    icon:'✅', type:'truefalse',  baseReward:1.0, desc:'Richtig oder Falsch?' },
  { id:'dart2',      name:'Pong',           icon:'🏓', type:'pong',       baseReward:1.5, desc:'Klassisches Tennis' },
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
const WORLD_DEFS = [
  {id:1, name:'Welt 1', get subtitle(){ return (typeof t!=='undefined'?t('world1.subtitle'):'Reise nach Frankreich'); }, icon:'🇫🇷', color:'#2980B9',
   get description(){ return (typeof t!=='undefined'?t('world1.description'):'Verdiene Mischa Taler — baue dein Zoo-Empire!'); },
   get difficulty(){ return (typeof t!=='undefined'?t('wm.games_count').replace('{n}','20').replace('{m}','2'):'20 Spiele · bis 2 🌀 MT pro Spiel'); },
   memoryEmojis:['🐱','🐶','🦊','🐼','🐨','🦁','🐯','🦒','🐘','🦓'],
   tasks:[
    {id:'dart',       type:'dart',       name:'Dart',          icon:'🎯', title:'Dart spielen'},
    {id:'french',     type:'french',     name:'Französisch',   icon:'🇫🇷', title:'Vokabeln & Grammatik'},
    {id:'math',       type:'math',       name:'Rechnen',       icon:'🔢', title:'Mathematik'},
    {id:'sokoban',    type:'sokoban',    name:'Sokoban',       icon:'📦', title:'Sokoban'},
    {id:'shutthebox', type:'shutthebox', name:'Shut the Box',  icon:'🎲', title:'Shut the Box'},
    {id:'memory',     type:'memory',     name:'Memory',        icon:'🧠', title:'Memory spielen'},
    {id:'anagram',    type:'anagram',    name:'Anagramm',      icon:'🔤', title:'Wörter erraten'},
    {id:'simon',      type:'simon',      name:'Simon',         icon:'🟢', title:'Simon Says'},
    {id:'wordsearch', type:'wordsearch', name:'Wortsuche',     icon:'🔍', title:'Wörter finden'},
    {id:'reaction',   type:'reaction',   name:'Reaktion',      icon:'⚡', title:'Reaktionszeit'},
    {id:'colormix',   type:'colormix',   name:'Farben',        icon:'🎨', title:'Farben mischen'},
    {id:'slider',     type:'slider',     name:'Schiebepuzzle', icon:'🧩', title:'Puzzle lösen'},
    {id:'typing',     type:'tetris',     name:'Tetris',        icon:'🟩', title:'Schnell tippen'},
    {id:'balloon',    type:'balloon',    name:'Snake',         icon:'🐍', title:'🐍 Snake!'},
    {id:'jenga',      type:'stunt',      name:'Race',          icon:'🏎️', title:'Race — 1km Rennen'},
    {id:'simon2',     type:'pacman',      name:'Pac-Man',      icon:'🟡', title:'Pac-Man'},
    {id:'math2',      type:'math',       name:'Rechnen II',    icon:'➕', title:'Mathe Schwer'},
    {id:'memory2',    type:'starwars',     name:'Star Wars',     icon:'🚀', title:'Sterne abschießen'},
    {id:'truefalse',  type:'truefalse',  name:'Wahr/Falsch',   icon:'✅', title:'Richtig oder falsch?'},
    {id:'dart2',      type:'pong',       name:'Pong',       icon:'🏓', title:'Tennis-Klassiker'},
  ]},
];

window.GAME_LIST = GAME_LIST;
window.WORLD_DEFS = WORLD_DEFS;
// Keep legacy WORLDS if app.js defines it
window.WORLDS = WORLD_DEFS; // Always use new game-based worlds
window.SPECIAL_PLAYERS = SPECIAL_PLAYERS;
window.calcMT = calcMT;
window.isInLeaderboard = isInLeaderboard;
window.getDisplayName = getDisplayName;
window.getNameStyle = getNameStyle;
window.ZOO_TELEPORT_COST = ZOO_TELEPORT_COST;
window.ZOO_FIRST_ANIMAL_COST = ZOO_FIRST_ANIMAL_COST;
