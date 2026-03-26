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
      const doc = await this._col().doc(key).get();
      return doc.exists ? doc.data() : null;
    }
    return this._local.get(key);
  },

  async savePlayer(player) {
    const key = player.name.toLowerCase();
    const data = { ...player, updatedAt: Date.now() };
    if (this._useCloud()) {
      await this._col().doc(key).set(data);
    }
    this._local.save(data); // immer auch lokal speichern
  },

  async createPlayer({ name, password, birthYear, character, characterColor }) {
    const existing = await this.getPlayer(name);
    if (existing) return null;
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
    const player = await this.getPlayer(name);
    if (!player) return { ok: false, error: 'Spieler nicht gefunden' };
    if (player.password !== password) return { ok: false, error: 'Falsches Passwort' };
    return { ok: true, player };
  },

  // ---- TASK COMPLETION ----
  async completeTask(playerName, worldIndex, taskIndex, result) {
    const player = await this.getPlayer(playerName);
    if (!player) return;
    if (!player.worlds[worldIndex]) player.worlds[worldIndex] = { tasks: Array(10).fill(null), jokerUsed: false, completed: false };

    const finalScore = this.calcFinalScore(result);
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

  calcFinalScore({ rawScore = 100, timeMs = 0, errors = 0, passed = true }) {
    if (!passed) return 0;
    const timePenalty  = Math.min(40, Math.floor(timeMs / 3000));
    const errorPenalty = Math.min(60, errors * 8);
    return Math.max(5, Math.round(Math.min(100, rawScore) - timePenalty - errorPenalty));
  },

  async useJoker(playerName, worldIndex, taskIndex) {
    const player = await this.getPlayer(playerName);
    if (!player || player.worlds[worldIndex]?.jokerUsed) return false;
    player.worlds[worldIndex].jokerUsed = true;
    player.worlds[worldIndex].tasks[taskIndex] = { done: true, score: 0, joker: true, ts: Date.now() };
    await this.savePlayer(player);
    this.currentPlayer = player;
    return true;
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
    if (player) this.currentPlayer = await this.getPlayer(player.name);
    return this.currentPlayer;
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
document.addEventListener('DOMContentLoaded', () => {
  initFirebase();
});

window.State = State;
window.initFirebase = initFirebase;
