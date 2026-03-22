/**
 * state.js — Spielstand & localStorage
 * v2: Zeiterfassung, Fehlerstrafe, erweitertes Scoring
 */

const STATE_KEY = 'mischa_players';
const ADMIN_KEY = 'mischa_admin_pw';

const State = {

  getAll() {
    try { return JSON.parse(localStorage.getItem(STATE_KEY)) || {}; }
    catch { return {}; }
  },

  getPlayer(name) {
    const all = this.getAll();
    return all[name.toLowerCase()] || null;
  },

  savePlayer(player) {
    const all = this.getAll();
    all[player.name.toLowerCase()] = { ...player, updatedAt: Date.now() };
    localStorage.setItem(STATE_KEY, JSON.stringify(all));
  },

  createPlayer({ name, password, birthYear, character, characterColor }) {
    if (this.getPlayer(name)) return null;
    const player = {
      name, password,
      birthYear: parseInt(birthYear),
      character,
      characterColor: characterColor || null,
      currentWorld: 1,
      worlds: {
        1: { tasks: Array(10).fill(null), jokerUsed: false, completed: false },
        2: { tasks: Array(10).fill(null), jokerUsed: false, completed: false },
        3: { tasks: Array(10).fill(null), jokerUsed: false, completed: false },
        4: { tasks: Array(10).fill(null), jokerUsed: false, completed: false },
        5: { tasks: Array(10).fill(null), jokerUsed: false, completed: false },
      },
      totalScore: 0,
      createdAt: Date.now(),
    };
    this.savePlayer(player);
    return player;
  },

  login(name, password) {
    const player = this.getPlayer(name);
    if (!player) return { ok: false, error: 'Spieler nicht gefunden' };
    if (player.password !== password) return { ok: false, error: 'Falsches Passwort' };
    return { ok: true, player };
  },

  /**
   * Aufgabe abschließen — mit Zeit & Fehleranzahl
   * result = { rawScore, timeMs, errors, passed }
   */
  completeTask(playerName, worldIndex, taskIndex, result) {
    const player = this.getPlayer(playerName);
    if (!player) return;
    const finalScore = this.calcFinalScore(result);
    player.worlds[worldIndex].tasks[taskIndex] = {
      done: true,
      score: finalScore,
      rawScore: result.rawScore || 0,
      timeMs: result.timeMs || 0,
      errors: result.errors || 0,
      passed: result.passed !== false,
      ts: Date.now()
    };
    player.totalScore = Object.values(player.worlds)
      .flatMap(w => w.tasks)
      .filter(t => t && t.done)
      .reduce((sum, t) => sum + (t.score || 0), 0);
    const tasks = player.worlds[worldIndex].tasks;
    if (tasks.every(t => t && t.done)) {
      player.worlds[worldIndex].completed = true;
      if (worldIndex < 5) player.currentWorld = Math.max(player.currentWorld, worldIndex + 1);
    }
    this.savePlayer(player);
    return player;
  },

  /**
   * Score-Formel:
   * Basis 100 - Zeitstrafe (1pt/3sek, max -40) - Fehlerstrafe (8pt/Fehler, max -60)
   * Minimum: 5 Punkte
   */
  calcFinalScore({ rawScore = 100, timeMs = 0, errors = 0, passed = true }) {
    if (!passed) return 0;
    const timePenalty = Math.min(40, Math.floor(timeMs / 3000));
    const errorPenalty = Math.min(60, errors * 8);
    return Math.max(5, Math.round(Math.min(100, rawScore) - timePenalty - errorPenalty));
  },

  useJoker(playerName, worldIndex, taskIndex) {
    const player = this.getPlayer(playerName);
    if (!player || player.worlds[worldIndex].jokerUsed) return false;
    player.worlds[worldIndex].jokerUsed = true;
    player.worlds[worldIndex].tasks[taskIndex] = { done: true, score: 0, joker: true, ts: Date.now() };
    this.savePlayer(player);
    return true;
  },

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

  deletePlayer(name) {
    const all = this.getAll();
    delete all[name.toLowerCase()];
    localStorage.setItem(STATE_KEY, JSON.stringify(all));
  },

  resetPlayerProgress(name) {
    const player = this.getPlayer(name);
    if (!player) return;
    player.currentWorld = 1;
    player.totalScore = 0;
    player.worlds = {
      1: { tasks: Array(10).fill(null), jokerUsed: false, completed: false },
      2: { tasks: Array(10).fill(null), jokerUsed: false, completed: false },
      3: { tasks: Array(10).fill(null), jokerUsed: false, completed: false },
      4: { tasks: Array(10).fill(null), jokerUsed: false, completed: false },
      5: { tasks: Array(10).fill(null), jokerUsed: false, completed: false },
    };
    this.savePlayer(player);
  },

  currentPlayer: null,

  setCurrentPlayer(player) {
    this.currentPlayer = player;
    sessionStorage.setItem('mischa_current', player.name.toLowerCase());
  },

  getCurrentPlayer() {
    if (this.currentPlayer) return this.currentPlayer;
    const name = sessionStorage.getItem('mischa_current');
    if (!name) return null;
    this.currentPlayer = this.getPlayer(name);
    return this.currentPlayer;
  },

  refreshCurrentPlayer() {
    const player = this.getCurrentPlayer();
    if (player) this.currentPlayer = this.getPlayer(player.name);
    return this.currentPlayer;
  }
};

window.State = State;
