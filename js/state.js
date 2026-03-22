/**
 * state.js — Spielstand & localStorage
 * Mischa Denkspiel
 */

const STATE_KEY = 'mischa_players';

const State = {

  /** Alle Spieler laden */
  getAll() {
    try {
      return JSON.parse(localStorage.getItem(STATE_KEY)) || {};
    } catch {
      return {};
    }
  },

  /** Einen Spieler laden (by name, case-insensitive) */
  getPlayer(name) {
    const all = this.getAll();
    const key = name.toLowerCase();
    return all[key] || null;
  },

  /** Spieler speichern / aktualisieren */
  savePlayer(player) {
    const all = this.getAll();
    const key = player.name.toLowerCase();
    all[key] = { ...player, updatedAt: Date.now() };
    localStorage.setItem(STATE_KEY, JSON.stringify(all));
  },

  /** Neuen Spieler erstellen */
  createPlayer({ name, password, birthYear, character, characterColor }) {
    const existing = this.getPlayer(name);
    if (existing) return null; // Name schon vergeben
    const player = {
      name,
      password,
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

  /** Login: Name + Passwort prüfen */
  login(name, password) {
    const player = this.getPlayer(name);
    if (!player) return { ok: false, error: 'Spieler nicht gefunden' };
    if (player.password !== password) return { ok: false, error: 'Falsches Passwort' };
    return { ok: true, player };
  },

  /** Aufgabe als erledigt markieren */
  completeTask(playerName, worldIndex, taskIndex, score) {
    const player = this.getPlayer(playerName);
    if (!player) return;
    player.worlds[worldIndex].tasks[taskIndex] = { done: true, score, ts: Date.now() };
    // Gesamtscore aktualisieren
    player.totalScore = Object.values(player.worlds)
      .flatMap(w => w.tasks)
      .filter(t => t && t.done)
      .reduce((sum, t) => sum + (t.score || 0), 0);
    // Welt abgeschlossen?
    const tasks = player.worlds[worldIndex].tasks;
    const allDone = tasks.every(t => t && t.done);
    if (allDone) {
      player.worlds[worldIndex].completed = true;
      if (worldIndex < 5) player.currentWorld = Math.max(player.currentWorld, worldIndex + 1);
    }
    this.savePlayer(player);
    return player;
  },

  /** Joker einsetzen */
  useJoker(playerName, worldIndex, taskIndex) {
    const player = this.getPlayer(playerName);
    if (!player) return false;
    if (player.worlds[worldIndex].jokerUsed) return false;
    player.worlds[worldIndex].jokerUsed = true;
    player.worlds[worldIndex].tasks[taskIndex] = { done: true, score: 0, joker: true, ts: Date.now() };
    this.savePlayer(player);
    return true;
  },

  /** Hilfsfunktion: Alter berechnen */
  getAge(player) {
    return new Date().getFullYear() - player.birthYear;
  },

  /** Alter-Kategorie für Aufgaben-Anpassung */
  getAgeGroup(player) {
    const age = this.getAge(player);
    if (age <= 7)  return 'sehr_einfach';
    if (age <= 10) return 'einfach';
    if (age <= 13) return 'mittel';
    return 'schwer';
  },

  /** Aktueller Spieler (Session) */
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
    if (player) {
      this.currentPlayer = this.getPlayer(player.name);
    }
    return this.currentPlayer;
  }
};

window.State = State;
