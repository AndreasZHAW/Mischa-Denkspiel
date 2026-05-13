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
    get(name) { if(!name)return null; const lc=name.toLowerCase(); const all=this.getAll(); return all[lc]||all[name]||null; },
    set(name, player) {
      const all = this.getAll();
      player.updatedAt = Date.now(); // Always stamp with current time
      all[name.toLowerCase()] = player;
      localStorage.setItem('mischa_players', JSON.stringify(all));
    },
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
    // Special players: auto-accept Janoschtest and bu
    const nameLc = name.toLowerCase();
    if (nameLc === 'janoschtest' && password !== 'janoschtest') return null;
    if (nameLc === 'bu' && password !== 'mischa2026') return null;
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
    for (let i = 1; i <= 1; i++) {
      w[i] = { tasks: Array(20).fill(null), jokerUsed: false, completed: false };
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
    if (!player.worlds) player.worlds = {};
    if (!player.worlds[worldIndex]) player.worlds[worldIndex] = { tasks: Array(20).fill(null), jokerUsed: false, completed: false };
    // Ensure tasks array is long enough
    while (player.worlds[worldIndex].tasks.length < 20) player.worlds[worldIndex].tasks.push(null);

    const finalScore = this.calcFinalScore(result, player);
    
    // ── KALIBRIERUNG v4 ──
    // MT = linear: min→0MT, avg→1MT, max→2MT
    // Supports admin overrides from cal_overrides_local
    let mtEarned;
    if (result.passed === false) {
      mtEarned = 0.2;
    } else {
      const raw = result.rawScore || 50;
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
      const isIPad = /iPad/.test(ua)||(typeof navigator !== 'undefined'&&navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
      const dev = isIPad?'ipad':/iPhone/.test(ua)?'iphone':/Android/.test(ua)?'android':'desktop';
      const key = taskIndex + '_' + dev;

      // Load scores and overrides
      let calStore = {};
      try { calStore = JSON.parse(localStorage.getItem('cal_data_v3')||'{}'); } catch(e){}
      let overrides = {};
      try { overrides = JSON.parse(localStorage.getItem('cal_overrides_local')||'{}'); } catch(e){}

      const scores = calStore[key] || []; // Clean array - only previous scores (app.js no longer adds here)

      // Effective min/avg/max: use override if set, else compute from previous scores
      let minS, avgS, maxS;
      if (scores.length === 0 && !overrides[key+'_avg']) {
        mtEarned = 1.0; // First play ever → always exactly 1 MT
      } else {
        minS = overrides[key+'_min'] ?? (scores.length ? Math.min(...scores) : raw);
        maxS = overrides[key+'_max'] ?? (scores.length ? Math.max(...scores) : raw);
        avgS = overrides[key+'_avg'] ?? (scores.length ? scores.reduce((a,b)=>a+b,0)/scores.length : raw);

        if (maxS === minS) {
          // Same score as all previous → 1.0 exactly; better → 1.2; worse → 0.8
          mtEarned = raw === avgS ? 1.0 : raw > avgS ? 1.2 : 0.8;
        } else if (raw <= minS) {
          mtEarned = 0.0;
        } else if (raw >= maxS) {
          mtEarned = 2.0;
        } else if (raw < avgS) {
          mtEarned = (raw - minS) / (avgS - minS);
        } else {
          mtEarned = 1 + (raw - avgS) / (maxS - avgS);
        }
        mtEarned = Math.round(Math.min(2.0, Math.max(0.0, mtEarned)) * 10) / 10;
      }

      // Save current score to cal store
      scores.push(raw);
      calStore[key] = scores;
      try { localStorage.setItem('cal_data_v3', JSON.stringify(calStore)); } catch(e){}

      // Sync aggregated + individual record to Firebase
      if (typeof _db !== 'undefined' && _db) {
        try {
          const upd = {}; upd[key] = scores;
          _db.collection('calibration').doc('scores').set(upd, {merge:true}).catch(()=>{});
          _db.collection('calibration_records').add({
            gameIdx: taskIndex, device: dev, player: playerName,
            rawScore: raw, ts: Date.now(),
            tsStr: typeof window !== 'undefined' ? new Date().toLocaleString('de-CH') : new Date().toISOString()
          }).then(()=>{ if(typeof console!=='undefined') console.log('✅ Cal record saved'); })
            .catch(e=>{ if(typeof console!=='undefined') console.warn('Cal record failed:', e.message); });
        } catch(e){}
      } else {
        // Queue for retry on next boot
        try {
          const q = JSON.parse(localStorage.getItem('cal_sync_queue')||'{}');
          q[key] = scores;
          localStorage.setItem('cal_sync_queue', JSON.stringify(q));
        } catch(e){}
      }
    }
    
    const prevPlays = player.worlds[worldIndex].tasks[taskIndex]?.plays || 0;
    player.worlds[worldIndex].tasks[taskIndex] = {
      done: true, score: finalScore, mt: mtEarned,
      rawScore: result.rawScore || 0,
      timeMs: result.timeMs || 0,
      calibrated: calRef !== null,
      plays: prevPlays + 1,
      lastPlayed: Date.now(),
    };

    // Update total score: subtract old MT for this task, add new
    const oldMt = (player.worlds[worldIndex].tasks[taskIndex]?.mt) || 0;
    // Note: we already set the new mt above, so we need to use mtEarned
    // For re-plays: adjust totalScore by difference
    if (prevPlays > 0) {
      // Replace old score with new one
      player.totalScore = Math.max(0, (player.totalScore || 0) - oldMt + mtEarned);
    } else {
      // First play: just add
      player.totalScore = (player.totalScore || 0) + mtEarned;
    }
    
    // If Janoschtest: save their raw scores as calibration data
    if (isRef) {
      this._saveRefScore(taskIndex, result.rawScore || 50, player);
    }
    
    // Check world completion (all 20 tasks done)
    const allDone = player.worlds[worldIndex].tasks.filter(t=>t&&t.done).length >= 20;
    if (allDone) {
      player.worlds[worldIndex].completed = true;
      if (player.currentWorld <= worldIndex) player.currentWorld = worldIndex + 1;
    }

    await this.savePlayer(player);
    this.currentPlayer = player;
    

    return player;
  },

  // ── KALIBRIERUNGS-SYSTEM ──
  
  // Load calibration from Firebase and merge with local
  async loadCalibrationFromCloud() {
    try {
      if (typeof _db === 'undefined' || !_db || !this._useCloud()) return;
      // Load admin overrides first
      try {
        const ovDoc = await _db.collection('calibration_overrides').doc('values').get();
        if (ovDoc.exists) localStorage.setItem('cal_overrides_local', JSON.stringify(ovDoc.data()));
      } catch(e){}
      const doc = await _db.collection('calibration').doc('scores').get();
      if (!doc.exists) return;
      const cloudData = doc.data();
      // Merge cloud data with local (cloud takes precedence for unknown keys)
      let localStore = {};
      try { localStore = JSON.parse(localStorage.getItem('cal_data_v3')||'{}'); } catch(e){}
      let changed = false;
      Object.entries(cloudData).forEach(([key, scores]) => {
        if (!Array.isArray(scores)) return;
        if (!localStore[key] || localStore[key].length < scores.length) {
          localStore[key] = scores;
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem('cal_data_v3', JSON.stringify(localStore));
      }
    } catch(e) {}
  },

  // Get calibration stats for display (not used in MT calc - that's inline above)
  _getCalibration(taskIndex) {
    try {
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
      const isIPad = /iPad/.test(ua)||(typeof navigator !== 'undefined'&&navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
      const dev = isIPad?'ipad':/iPhone/.test(ua)?'iphone':/Android/.test(ua)?'android':'desktop';
      const calStore = JSON.parse(localStorage.getItem('cal_data_v3')||'{}');
      const scores = calStore[taskIndex+'_'+dev] || [];
      let overrides = {};
      try { overrides = JSON.parse(localStorage.getItem('cal_overrides_local')||'{}'); } catch(e){}
      const key = taskIndex+'_'+dev;
      if (!scores.length && !overrides[key+'_avg']) return null;
      const avg = overrides[key+'_avg'] ?? (scores.length ? scores.reduce((a,b)=>a+b,0)/scores.length : null);
      const min = overrides[key+'_min'] ?? (scores.length ? Math.min(...scores) : null);
      const max = overrides[key+'_max'] ?? (scores.length ? Math.max(...scores) : null);
      return {avg, min, max, n: scores.length};
    } catch(e) { return null; }
  },
  
  // Get ALL calibration data (for admin table)
  _getAllCalibration() {
    try {
      const raw = localStorage.getItem('janosch_cal');
      return raw ? JSON.parse(raw) : {};
    } catch(e) { return {}; }
  },
  
  // Get calibration runs metadata
  _getCalibrationRuns() {
    try {
      const raw = localStorage.getItem('janosch_runs');
      return raw ? JSON.parse(raw) : [];
    } catch(e) { return []; }
  },
  
  // Save Janoschtest's reference score for a game
  _saveRefScore(taskIndex, rawScore, player) {
    try {
      const raw = localStorage.getItem('janosch_cal');
      const cal = raw ? JSON.parse(raw) : {};
      if (!cal[taskIndex]) cal[taskIndex] = [];
      
      // Check if this is a new run (all 20 games of previous run complete)
      // A "run" = Janoschtest completed taskIndex 0 fresh
      // We track runs via a runs array
      const runs = this._getCalibrationRuns();
      const currentRun = runs.length > 0 ? runs[runs.length - 1] : null;
      
      if (taskIndex === 0 || !currentRun || currentRun.complete) {
        // Start new run
        const newRun = { id: Date.now(), games: {}, complete: false, startedAt: Date.now() };
        newRun.games[taskIndex] = rawScore;
        runs.push(newRun);
        // Keep only last 3 runs
        while (runs.length > 3) runs.shift();
        localStorage.setItem('janosch_runs', JSON.stringify(runs));
      } else {
        // Add to current run
        currentRun.games[taskIndex] = rawScore;
        // Check if run complete (all 20 games)
        if (Object.keys(currentRun.games).length >= 20) {
          currentRun.complete = true;
          currentRun.completedAt = Date.now();
        }
        localStorage.setItem('janosch_runs', JSON.stringify(runs));
      }
      
      // Update per-game calibration: store last 3 scores per game
      // Use all available runs (1-3)
      const gameCal = {};
      runs.forEach(run => {
        Object.keys(run.games).forEach(idx => {
          if (!gameCal[idx]) gameCal[idx] = [];
          gameCal[idx].push(run.games[idx]);
          // Keep last 3
          if (gameCal[idx].length > 3) gameCal[idx] = gameCal[idx].slice(-3);
        });
      });
      localStorage.setItem('janosch_cal', JSON.stringify(gameCal));
      
      // Also save to Firebase for cross-device access
      if (typeof _db !== 'undefined' && _db) {
        _db.collection('calibration').doc('janoschtest').set({
          cal: gameCal, runs: runs.length, lastUpdate: Date.now()
        }).catch(() => {});
      }
    } catch(e) {}
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

  getAdminPw() { return 'mischa2026'; }, // Fixed password
  setAdminPw(pw) { localStorage.setItem(ADMIN_KEY, pw); },
  checkAdmin(pw) { return pw === this.getAdminPw(); },
  
  async resetAllScores() {
    const all = this._local.getAll();
    const players = Object.values(all).filter(p=>p.name);
    players.forEach(player => {
      ['1',1].forEach(key => {
        if (player.worlds?.[key]) {
          player.worlds[key].tasks = Array(20).fill(null);
          player.worlds[key].completed = false;
        }
      });
      player.totalScore = 0;
      player.updatedAt = Date.now();
    });
    players.forEach(p => this._local.set(p.name, p));
    // Sync to Firebase
    try {
      for (const p of players) {
        if (this._useCloud()) await this._col().doc(p.name.toLowerCase()).set(p).catch(()=>{});
      }
    } catch(e) {}
    // Clear calibration data
    localStorage.removeItem('cal_data_v3');
    localStorage.removeItem('cal_overrides_local');
    localStorage.removeItem('cal_sync_queue');
    // Clear Firebase calibration
    try {
      if (typeof _db !== 'undefined' && _db) {
        await _db.collection('calibration').doc('scores').delete().catch(()=>{});
        const snap = await _db.collection('calibration_records').limit(500).get();
        const batch = _db.batch();
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit().catch(()=>{});
        await _db.collection('calibration_overrides').doc('values').delete().catch(()=>{});
      }
    } catch(e) {}
    return players.length;
  },

  // ---- SESSION (mit Auto-Logout) ----
  currentPlayer: null,
  _activityTimer: null,
  TIMEOUT_MS: 15 * 60 * 1000, // 15 Minuten

  setCurrentPlayer(player) {
    this.currentPlayer = player;
    sessionStorage.setItem('mischa_current', player.name.toLowerCase());
    // Also save to localStorage as backup (survives page refresh)
    localStorage.setItem('mischa_current_backup', player.name.toLowerCase());
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
    localStorage.removeItem('mischa_current_backup');
    clearTimeout(this._activityTimer);
  },

  async getCurrentPlayer() {
    if (this.currentPlayer) return this.currentPlayer;
    // Check sessionStorage first, then localStorage backup
    let name = sessionStorage.getItem('mischa_current');
    if (!name) {
      name = localStorage.getItem('mischa_current_backup');
      if (name) {
        // Restore session from backup
        sessionStorage.setItem('mischa_current', name);
      }
    }
    if (!name) return null;
    // Timeout: use local cache if Firebase is slow
    try {
      const p = await Promise.race([
        this.getPlayer(name),
        new Promise(r => setTimeout(() => r(this._local.get(name)), 3000))
      ]);
      this.currentPlayer = p;
    } catch(e) {
      this.currentPlayer = this._local.get(name);
    }
    // If still null: player not found locally and Firebase unavailable
    // Don't create fake player - clear backup and return null so login shows
    if (!this.currentPlayer) {
      // Don't clear backup here - Firebase might just be slow
      // Return null → app will show welcome/login screen
    }
    return this.currentPlayer;
  },

  async refreshCurrentPlayer() {
    const player = await this.getCurrentPlayer();
    if (!player) return null;
    // Try local first (instant)
    const local = this._local.get(player.name);
    if (local) { this.currentPlayer = local; }
    // Then try cloud - only use if NEWER than local (prevents overwriting fresh local save)
    try {
      const cloud = await Promise.race([
        this.getPlayer(player.name),
        new Promise(r => setTimeout(() => r(null), 3000))
      ]);
      if (cloud) {
        // Only use cloud data if it was updated more recently than local
        const cloudTime = cloud.updatedAt || 0;
        const localTime = local?.updatedAt || 0;
        if (cloudTime >= localTime) {
          this.currentPlayer = cloud;
        }
        // else: keep local (it has fresher task data)
      }
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

// Pre-populate State from localStorage backup on load
(function(){
  try {
    const backup = localStorage.getItem('mischa_current_backup') ||
                   sessionStorage.getItem('mischa_current');
    if (backup && !State.currentPlayer) {
      const p = State._local.get(backup);
      if (p) {
        State.currentPlayer = p;
        // Ensure sessionStorage is set
        if (!sessionStorage.getItem('mischa_current')) {
          sessionStorage.setItem('mischa_current', backup.toLowerCase());
        }
        console.log('✅ State pre-populated from localStorage:', p.name);
      }
    }
  } catch(e) {}
})();

window.State = State;
window.initFirebase = initFirebase;
