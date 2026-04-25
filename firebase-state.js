/**
 * firebase-state.js — Globaler Multiplayer via Firebase Firestore
 * Ersetzt localStorage mit echter Cloud-Datenbank
 * Alle Spieler weltweit sehen sich gegenseitig in der Rangliste
 *
 * SETUP: Ersetze die firebaseConfig unten mit deinen eigenen Firebase-Daten!
 * (Anleitung: siehe FIREBASE_SETUP.md)
 */

// ============================================================
// FIREBASE KONFIGURATION — hier deine eigenen Daten eintragen!
// ============================================================
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyBECgS_DLTmLTXABeyFQ2rNKISFyf6jwlE",
  authDomain:        "mischa-denkspiel.firebaseapp.com",
  projectId:         "mischa-denkspiel",
  storageBucket:     "mischa-denkspiel.firebasestorage.app",
  messagingSenderId: "272799969679",
  appId:             "1:272799969679:web:930490bc929b3b2747dbfa"
};

// ============================================================
// FIREBASE INITIALISIERUNG
// ============================================================
// Firebase SDK wird über CDN in index.html geladen
let _db = null;
let _firebaseReady = false;

function initFirebase() {
  try {
    if (typeof firebase === 'undefined') {
      console.warn('Firebase SDK nicht geladen — Fallback auf localStorage');
      return false;
    }
    if (!firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }
    _db = firebase.firestore();
    _firebaseReady = true;
    console.log('✅ Firebase verbunden');
    return true;
  } catch (e) {
    console.warn('Firebase Fehler:', e);
    return false;
  }
}

// ============================================================
// STATE MANAGER (Cloud + lokalem Fallback)
// ============================================================
const ADMIN_KEY = 'mischa_admin_pw';

const State = {

  // ---- FIREBASE HELPERS ----
  _col() { return _db ? _db.collection('players') : null; },

  _useCloud() { return _firebaseReady && _db !== null; },

  // ---- LOCAL FALLBACK (wenn Firebase nicht konfiguriert) ----
  _local: {
    getAll() {
      try { return JSON.parse(localStorage.getItem('mischa_players')) || {}; } catch { return {}; }
    },
    get(name) { return this.getAll()[name.toLowerCase()] || null; },
    save(player) {
      const all = this.getAll();
      all[player.name.toLowerCase()] = { ...player, updatedAt: Date.now() };
      localStorage.setItem('mischa_players', JSON.stringify(all));
    },
    delete(name) {
      const all = this.getAll();
      delete all[name.toLowerCase()];
      localStorage.setItem('mischa_players', JSON.stringify(all));
    }
  },

  // ---- PLAYER CRUD ----
  async getAll() {
    if (this._useCloud()) {
      const snap = await this._col().get();
      const result = {};
      snap.forEach(doc => { result[doc.id] = doc.data(); });
      return result;
    }
    return this._local.getAll();
  },

  async getPlayer(name) {
    const key = name.toLowerCase();
    if (this._useCloud()) {
      try {
        const doc = await Promise.race([
          this._col().doc(key).get(),
          new Promise((_,rej) => setTimeout(() => rej(new Error('timeout')), 4000))
        ]);
        return doc.exists ? doc.data() : null;
      } catch(e) {
        console.warn('getPlayer cloud timeout, using local fallback');
        return this._local.get(key);
      }
    }
    return this._local.get(key);
  },

  async savePlayer(player) {
    const key = player.name.toLowerCase();
    const data = { ...player, updatedAt: Date.now() };
    this._local.save(data); // Always save locally FIRST (instant)
    if (this._useCloud()) {
      try {
        await Promise.race([
          this._col().doc(key).set(data),
          new Promise((_,rej) => setTimeout(() => rej(new Error('timeout')), 5000))
        ]);
      } catch(e) { console.warn('savePlayer cloud failed, local OK:', e.message); }
    }
  },

  async createPlayer({ name, password, birthYear, character, characterColor }) {
    const existing = await this.getPlayer(name);
    if (existing) return null; // Player already exists
    const player = {
      name, password,
      birthYear: parseInt(birthYear),
      character,
      characterColor: characterColor || null,
      currentWorld: 1,
      worlds: this._emptyWorlds(),
      totalScore: 0,
      createdAt: Date.now(),
    };
    await this.savePlayer(player);
    return player;
  },

  _emptyWorlds() {
    const w = {};
    for (let i = 1; i <= 10; i++) {
      w[i] = { tasks: Array(10).fill(null), jokerUsed: false, completed: false };
    }
    return w;
  },

  async login(name, password) {
    // First try local storage (instant, no network needed)
    const localPlayer = this._local.get(name.toLowerCase());
    if (localPlayer && localPlayer.password === password) {
      return { ok: true, player: localPlayer };
    }
    // Then try cloud with timeout
    let player = null;
    try {
      player = await Promise.race([
        this.getPlayer(name),
        new Promise(r => setTimeout(() => r(null), 5000))
      ]);
    } catch(e) { player = null; }
    if (!player) {
      // If local exists but wrong pw
      if (localPlayer) return { ok: false, error: 'Falsches Passwort' };
      return { ok: false, error: 'Spieler nicht gefunden (Verbindungsproblem?)' };
    }
    if (player.password !== password) return { ok: false, error: 'Falsches Passwort' };
    // Cache locally
    this._local.save(player);
    return { ok: true, player };
  },

  // ---- TASK COMPLETION ----
  async completeTask(playerName, worldIndex, taskIndex, result) {
    const player = await this.getPlayer(playerName);
    if (!player) return;
    if (!player.worlds[worldIndex]) player.worlds[worldIndex] = { tasks: Array(10).fill(null), jokerUsed: false, completed: false };

    const finalScore = this.calcFinalScore(result, player);
    player.worlds[worldIndex].tasks[taskIndex] = {
      done: true, score: finalScore,
      rawScore: result.rawScore || 0,
      timeMs: result.timeMs || 0,
      errors: result.errors || 0,
      passed: result.passed !== false,
      ts: Date.now()
    };

    player.totalScore = Object.values(player.worlds)
      .flatMap(w => w.tasks)
      .filter(t => t && t.done)
      .reduce((s, t) => s + (t.score || 0), 0);

    const tasks = player.worlds[worldIndex].tasks;
    if (tasks.every(t => t && t.done)) {
      player.worlds[worldIndex].completed = true;
      if (worldIndex < 10) player.currentWorld = Math.max(player.currentWorld, worldIndex + 1);
    }

    await this.savePlayer(player);
    this.currentPlayer = player;
    return player;
  },

  calcFinalScore({ rawScore = 100, timeMs = 0, errors = 0, passed = true }, player = null) {
    if (!passed) return 0;
    const timePenalty  = Math.min(40, Math.floor(timeMs / 3000));
    const errorPenalty = Math.min(60, errors * 8);
    let base = Math.max(5, Math.round(Math.min(100, rawScore) - timePenalty - errorPenalty));
    // Apply star multiplier from shop if active
    if (player && player.activeStarMultiplier && player.starMultiplierExpires) {
      if (Date.now() < player.starMultiplierExpires) {
        base = Math.round(base * player.activeStarMultiplier);
      } else {
        player.activeStarMultiplier = null;
        player.starMultiplierExpires = null;
      }
    }
    // Apply character multiplier (1.1x per owned skin)
    const charMult = this.getCharacterMultiplier(player);
    if (charMult > 1) base = Math.round(base * charMult);
    // Apply reset multiplier
    if (player?.resetMultiplier && player.resetMultiplier > 1) base = Math.round(base * player.resetMultiplier);
    return base;
  },

  async useJoker(playerName, worldIndex, taskIndex) {
    const player = await this.getPlayer(playerName);
    if (!player) return false;
    const ws = player.worlds[worldIndex];
    if (!ws) return false;
    // How many jokers does this player have per world?
    const maxJokers = player.maxJokersPerWorld || 1;
    const jokersUsed = ws.jokersUsed || (ws.jokerUsed ? 1 : 0);
    if (jokersUsed >= maxJokers) return false;
    ws.jokersUsed = jokersUsed + 1;
    ws.jokerUsed = true; // backwards compat
    ws.tasks[taskIndex] = { done: true, score: 0, joker: true, ts: Date.now() };
    await this.savePlayer(player);
    this.currentPlayer = player;
    return true;
  },

  getJokersRemaining(player, worldIndex) {
    const ws = player.worlds?.[worldIndex];
    if (!ws) return 0;
    const maxJokers = player.maxJokersPerWorld || 1;
    const jokersUsed = ws.jokersUsed || (ws.jokerUsed ? 1 : 0);
    return Math.max(0, maxJokers - jokersUsed);
  },

  // ---- ADMIN ACTIONS ----
  async addPoints(playerName, points) {
    const player = await this.getPlayer(playerName);
    if (!player) return false;
    player.totalScore = Math.max(0, (player.totalScore || 0) + points);
    await this.savePlayer(player);
    return true;
  },

  async setWorld(playerName, worldId) {
    const player = await this.getPlayer(playerName);
    if (!player) return false;
    player.currentWorld = Math.max(1, Math.min(10, worldId));
    await this.savePlayer(player);
    return true;
  },

  async resetTasksFromIndex(playerName, worldIndex, fromTaskIndex) {
    const player = await this.getPlayer(playerName);
    if (!player) return false;
    for (let i = fromTaskIndex; i < 10; i++) {
      player.worlds[worldIndex].tasks[i] = null;
    }
    player.worlds[worldIndex].completed = false;
    // Recalculate score
    player.totalScore = Object.values(player.worlds)
      .flatMap(w => w.tasks)
      .filter(t => t && t.done)
      .reduce((s, t) => s + (t.score || 0), 0);
    await this.savePlayer(player);
    return true;
  },

  async resetPlayerProgress(name) {
    const player = await this.getPlayer(name);
    if (!player) return;
    player.currentWorld = 1;
    player.totalScore = 0;
    player.worlds = this._emptyWorlds();
    await this.savePlayer(player);
  },

  async deletePlayer(name) {
    if (this._useCloud()) {
      await this._col().doc(name.toLowerCase()).delete();
    }
    this._local.delete(name);
  },

  // ---- GLOBAL LEADERBOARD ----
  async getLeaderboard(limit = 50) {
    const all = await this.getAll();
    return Object.values(all)
      .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
      .slice(0, limit);
  },

  // ---- HELPERS ----
  getAge(player) { return new Date().getFullYear() - player.birthYear; },

  getAgeGroup(player) {
    const age = this.getAge(player);
    if (age <= 7)  return 'sehr_einfach';
    if (age <= 10) return 'einfach';
    if (age <= 13) return 'mittel';
    return 'schwer';
  },

  getAdminPw() { return localStorage.getItem(ADMIN_KEY) || 'mischa2024'; },
  setAdminPw(pw) { localStorage.setItem(ADMIN_KEY, pw); },
  checkAdmin(pw) { return pw === this.getAdminPw(); },

  // ---- SESSION (mit Auto-Logout) ----
  currentPlayer: null,
  _activityTimer: null,
  TIMEOUT_MS: 15 * 60 * 1000, // 15 Minuten

  setCurrentPlayer(player) {
    this.currentPlayer = player;
    sessionStorage.setItem('mischa_current', player.name.toLowerCase());
    this._resetActivityTimer();
  },

  _resetActivityTimer() {
    clearTimeout(this._activityTimer);
    this._activityTimer = setTimeout(() => {
      this.logout();
      window.location.href = 'index.html';
    }, this.TIMEOUT_MS);
  },

  logout() {
    this.currentPlayer = null;
    sessionStorage.removeItem('mischa_current');
    clearTimeout(this._activityTimer);
  },

  async getCurrentPlayer() {
    if (this.currentPlayer) return this.currentPlayer;
    const name = sessionStorage.getItem('mischa_current');
    if (!name) return null;
    this.currentPlayer = await this.getPlayer(name);
    return this.currentPlayer;
  },

  async refreshCurrentPlayer() {
    const player = await this.getCurrentPlayer();
    if (!player) return null;
    // Try local first (instant)
    const local = this._local.get(player.name);
    if (local) { this.currentPlayer = local; }
    // Then try cloud with timeout (non-blocking if local worked)
    try {
      const cloud = await Promise.race([
        this.getPlayer(player.name),
        new Promise(r => setTimeout(() => r(null), 3000))
      ]);
      if (cloud) this.currentPlayer = cloud;
    } catch(e) {}
    return this.currentPlayer;
  },

  // ---- REAL-TIME BROADCAST ----
  _broadcastUnsub: null,
  async setBroadcast(text, durationMs, type='info', extra=null) {
    const data = { text, id: Date.now().toString(), expiresAt: Date.now()+durationMs, setAt: Date.now(), type, extra };
    if (this._useCloud()) await _db.collection('config').doc('broadcast').set(data);
    localStorage.setItem('mischa_broadcast', JSON.stringify(data));
  },
  listenBroadcast(callback) {
    if (this._broadcastUnsub) this._broadcastUnsub();
    if (this._useCloud()) {
      this._broadcastUnsub = _db.collection('config').doc('broadcast').onSnapshot(snap => {
        if (!snap.exists) return;
        const d = snap.data();
        if (d && d.expiresAt > Date.now()) callback(d);
      });
    } else {
      const poll = () => { try { const d=JSON.parse(localStorage.getItem('mischa_broadcast')||'null'); if(d&&d.expiresAt>Date.now()) callback(d); } catch(e){} };
      poll(); setInterval(poll, 5000);
    }
  },

  // ---- SURVEY RESULTS ----
  async voteSurvey(surveyId, choice) {
    const key = 'mischa_survey_vote';
    const votes = JSON.parse(localStorage.getItem(key)||'{}');
    votes[surveyId] = choice;
    localStorage.setItem(key, JSON.stringify(votes));
    if (this._useCloud()) {
      const ref = _db.collection('config').doc('survey_results');
      const snap = await ref.get();
      const data = snap.exists ? snap.data() : {};
      if (!data[surveyId]) data[surveyId] = {a:0, b:0};
      data[surveyId][choice]++;
      await ref.set(data);
    }
  },
  hasVoted(surveyId) {
    try { return JSON.parse(localStorage.getItem('mischa_survey_vote')||'{}')[surveyId] != null; } catch(e){ return false; }
  },

  // ---- GIFT RESET ----
  async giftReset(targetName) {
    const target = await this.getPlayer(targetName);
    if (!target) return false;
    target.resets = (target.resets || 0) + 1;
    const mult = this._resetMultiplier(target.resets);
    target.resetMultiplier = mult;
    target.currentWorld = 1;
    target.worlds = this._emptyWorlds();
    target.totalScore = 0;
    await this.savePlayer(target);
    return true;
  },
  _resetMultiplier(resets) {
    if (resets >= 10) return 2.0;
    return Math.round((1.0 + resets * 0.3) * 100) / 100;
  },

  // ---- REAL-TIME DISCOUNTS ----
  _discountUnsub: null,
  async setDiscount(itemId, pct, durationMs) {
    const data = { pct, expiresAt: Date.now()+durationMs, setAt: Date.now() };
    if (this._useCloud()) {
      const snap = await _db.collection('config').doc('discounts').get();
      const all = snap.exists ? snap.data() : {};
      all[itemId] = data;
      await _db.collection('config').doc('discounts').set(all);
    }
    const local = JSON.parse(localStorage.getItem('mischa_discounts')||'{}');
    local[itemId] = data; localStorage.setItem('mischa_discounts', JSON.stringify(local));
  },
  listenDiscounts(callback) {
    if (this._discountUnsub) this._discountUnsub();
    if (this._useCloud()) {
      this._discountUnsub = _db.collection('config').doc('discounts').onSnapshot(snap => {
        if (!snap.exists) return;
        const data = snap.data()||{};
        localStorage.setItem('mischa_discounts', JSON.stringify(data));
        callback(data);
      });
    }
  },

  // ---- CHARACTER MULTIPLIER ----
  getCharacterMultiplier(player) {
    const owned = (player?.unlockedSkins||[]).length;
    return Math.min(3.0, Math.round((1 + owned * 0.1) * 100) / 100);
  }
};

// Auto-logout on page close / visibility change
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Page hidden — start aggressive timer (2 min when hidden)
    clearTimeout(State._activityTimer);
    State._activityTimer = setTimeout(() => {
      State.logout();
    }, 2 * 60 * 1000);
  } else {
    if (State.currentPlayer) State._resetActivityTimer();
  }
});

// Reset timer on any user interaction
['click','touchstart','keydown'].forEach(ev => {
  document.addEventListener(ev, () => {
    if (State.currentPlayer) State._resetActivityTimer();
  }, { passive: true });
});

// Init Firebase when script loads
// Don't auto-init on DOMContentLoaded - boot() will call initFirebase() 
// after async Firebase SDK loads
// But try it anyway as fallback (will fail silently if SDK not loaded yet)
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    try { initFirebase(); } catch(e) {}
  }, 500);
});

window.State = State;
window.initFirebase = initFirebase;
