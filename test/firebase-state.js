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
  _col() { return _db ? _db.collection('mischa_players') : null; },

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

  // Fetch every player's Zoo economy state (for combined Denkspiel+Zoo leaderboard).
  // Keyed by lowercase player name (matching the 'zoo_<name>' doc id / localStorage key,
  // with the 'zoo_' prefix stripped so it lines up with mischa_players' name keys).
  async getAllZoos() {
    const result = {};
    if (this._useCloud()) {
      try {
        const snap = await _db.collection('zoos').get();
        snap.forEach(doc => {
          const name = doc.id.startsWith('zoo_') ? doc.id.slice(4) : doc.id;
          result[name] = doc.data();
        });
      } catch(e) {}
    }
    // Also scan local storage (covers players who only ever played offline/local)
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('zoo_')) {
          const name = k.slice(4);
          if (!result[name]) {
            try { result[name] = JSON.parse(localStorage.getItem(k)); } catch(e) {}
          }
        }
      }
    } catch(e) {}
    return result;
  },

  // Repair: any task marked done but with mt<=0 or NaN gets minimum 0.2 MT.
  // Fixes legacy saves where the MT calc failed (showed raw score with ⭐ instead of MT).
  _repairPlayerMT(player) {
    if(!player || !player.worlds) return player;
    let changed = false;
    for(const wk of Object.keys(player.worlds)) {
      const w = player.worlds[wk];
      if(!w || !Array.isArray(w.tasks)) continue;
      for(const t of w.tasks) {
        if(t && t.done) {
          const m = t.mt;
          if(typeof m !== 'number' || isNaN(m) || !isFinite(m) || m <= 0) {
            t.mt = 0.2; changed = true;
          }
        }
      }
    }
    if(changed) {
      // Recompute totalScore — worlds are mirrored under number+string keys, so dedup by world id
      const seen = {}; let total = 0;
      for(const wk of Object.keys(player.worlds)) {
        const wid = String(parseInt(wk));
        if(seen[wid]) continue; seen[wid] = true;
        const w = player.worlds[wk];
        if(w && Array.isArray(w.tasks)) {
          for(const t of w.tasks) if(t && t.done && typeof t.mt==='number' && !isNaN(t.mt)) total += t.mt;
        }
      }
      if(!isNaN(total) && isFinite(total)) player.totalScore = Math.round(total*10)/10;
      if(typeof console!=='undefined') console.log('[Repair] Fixed MT for', player.name, '→ total', player.totalScore);
      player._needsSave = true; // mark for persistence
    }
    return player;
  },

  async getPlayer(name) {
    const key = name.toLowerCase();
    if (this._useCloud()) {
      try {
        const doc = await Promise.race([
          this._col().doc(key).get(),
          new Promise((_,rej) => setTimeout(() => rej(new Error('timeout')), 4000))
        ]);
        if(!doc.exists) return null;
        const _p = this._repairPlayerMT(doc.data());
        if(_p && _p._needsSave){ delete _p._needsSave; this._col().doc(key).set(_p).catch(()=>{}); this._local.save(_p); }
        return _p;
      } catch(e) {
        console.warn('getPlayer cloud timeout, using local fallback');
        const _pl = this._repairPlayerMT(this._local.get(key));
        if(_pl && _pl._needsSave){ delete _pl._needsSave; this._local.save(_pl); }
        return _pl;
      }
    }
    const _pl2 = this._repairPlayerMT(this._local.get(key));
    if(_pl2 && _pl2._needsSave){ delete _pl2._needsSave; this._local.save(_pl2); }
    return _pl2;
  },

  async savePlayer(player) {
    const key = player.name.toLowerCase();
    // Only attach a device ID if this player doesn't already have one recorded —
    // otherwise an admin action (e.g. resetting someone else's score) would end up
    // stamping the ADMIN's own device ID over the target player's real one.
    let deviceId; if(!player.deviceId){ try{ deviceId = window.getDeviceId && window.getDeviceId(); }catch(e){} }
    const data = { ...player, updatedAt: Date.now(), ...(deviceId?{deviceId}:{}) };
    this._local.save(data); // Always save locally FIRST (instant)
    this.currentPlayer = data; // Update in-memory state immediately
    if (this._useCloud()) {
      // Fire and forget for Firebase - local is already updated
      this._col().doc(key).set(data).catch(()=>{});
      try {
        // Also try with legacy await for callers that depend on it
        await Promise.race([
          Promise.resolve(), // resolve immediately since we already saved locally
          new Promise(r => setTimeout(r, 0))
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
    // Language bonus: +1 MT, ONCE, for non-German UI languages (not de_simple — still German).
    // Stored in its own field (not totalScore) so it's clearly a one-time bonus,
    // and the World Map adds it into the visible Welt-1 MT total.
    let _langBonus = 0;
    let _langBonusLang = null;
    try {
      if (typeof LANG !== 'undefined') { _langBonus = LANG.getBonus(); _langBonusLang = LANG._cur; }
    } catch(e) {}
    const player = {
      name, password,
      birthYear: parseInt(birthYear),
      character,
      characterColor: characterColor || null,
      currentWorld: 1,
      worlds: this._emptyWorlds(),
      totalScore: 0,
      langBonusMT: _langBonus,
      langBonusGranted: _langBonus > 0 ? _langBonusLang : null, // used to show the one-time popup
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
  _detectDevice() {
    if(typeof navigator==='undefined') return 'desktop';
    const ua = navigator.userAgent || '';
    const touch = (navigator.maxTouchPoints||0) > 0;
    const w = typeof window!=='undefined'?window.innerWidth:1920;
    const h = typeof window!=='undefined'?window.innerHeight:1080;
    const minDim = Math.min(w,h), maxDim = Math.max(w,h);
    if(/iPad/.test(ua) || (navigator.platform==='MacIntel' && touch)) return 'ipad';
    if(/iPhone|iPod/.test(ua)) return 'iphone';
    if(/Android/.test(ua)) return (/Mobile/.test(ua)||minDim<600) ? 'android' : 'android-tablet';
    // Desktop-mode browsers (Android/iOS "Request Desktop Site"):
    // These strip the mobile UA but keep hardware signals.
    const dpr = typeof window!=='undefined' ? (window.devicePixelRatio||1) : 1;
    // Strong mobile signal: touchscreen + high pixel density (phones are 2.5-4, desktops 1-2)
    if(touch && dpr >= 2.4) return 'android'; // high DPR + touch = phone (even in desktop mode)
    // Touch + small viewport = mobile in desktop mode
    if(touch && minDim < 820 && maxDim < 1400) return minDim < 600 ? 'android' : 'tablet';
    // Touch + medium viewport but portrait-ish aspect = likely tablet/phone
    if(touch && maxDim < 1100) return minDim < 600 ? 'android' : 'tablet';
    return 'desktop';
  },

  _cleanPoisonedCal() {
    try {
      let cal = JSON.parse(localStorage.getItem('cal_data_v3')||'{}');
      let changed = false;
      Object.keys(cal).forEach(key => {
        // ONLY clean starwars (17_*) — other games CAN legitimately have 100 scores
        if(!key.startsWith('17_')) return;
        const scores = cal[key] || [];
        if(scores.length < 3) return;
        const hundreds = scores.filter(s => s === 100).length;
        if(hundreds / scores.length > 0.8) { // 80% threshold for starwars only
          console.log('[Cal] Reset poisoned starwars key:', key);
          cal[key] = [];
          changed = true;
        }
      });
      if(changed) localStorage.setItem('cal_data_v3', JSON.stringify(cal));
    } catch(e) {}
  },

  // Repair tasks that are done but have mt<=0 / NaN (legacy data showed raw score with a star)
  _repairZeroMt(player) {
    if(!player || !player.worlds) return false;
    let fixed = false;
    Object.keys(player.worlds).forEach(wid => {
      const ws = player.worlds[wid];
      if(!ws || !Array.isArray(ws.tasks)) return;
      ws.tasks.forEach(t => {
        if(t && t.done) {
          const m = t.mt;
          if(typeof m !== 'number' || isNaN(m) || !isFinite(m) || m <= 0) {
            t.mt = 0.2; // minimum MT for a completed game
            fixed = true;
          }
        }
      });
    });
    // Note: we only fix per-task mt (fixes the star-instead-of-MT display).
    // totalScore is left untouched — worlds are mirrored under number+string keys,
    // so recomputing here would risk double-counting.
    return fixed;
  },

  async completeTask(playerName, worldIndex, taskIndex, result) {
    // First-run: clean up poisoned cal data from old broken formula
    if(!this._calCleanDone) { this._cleanPoisonedCal(); this._calCleanDone=true; }
    // Use LOCAL player data (instant) - no Firebase fetch that could block
    let player = this._local.get(playerName);
    if (!player) {
      // Fallback: try to get from Firebase with short timeout
      try {
        player = await Promise.race([
          this.getPlayer(playerName),
          new Promise(r => setTimeout(() => r(this.currentPlayer), 500))
        ]);
      } catch(e) { player = this.currentPlayer; }
    }
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
      const raw = (result.rawScore !== undefined && result.rawScore !== null && !isNaN(result.rawScore)) ? Math.max(0, result.rawScore) : 50;
      const dev = this._detectDevice();
      const key = taskIndex + '_' + dev;

      // Load scores and overrides
      let calStore = {};
      try { calStore = JSON.parse(localStorage.getItem('cal_data_v3')||'{}'); } catch(e){}
      let overrides = {};
      try { overrides = JSON.parse(localStorage.getItem('cal_overrides_local')||'{}'); } catch(e){}

      // Filter out any NaN/invalid values from stored scores
      let rawScores = (calStore[key] || []).filter(s => typeof s==='number' && !isNaN(s) && s>=0);
      // Only reset for starwars (key 17_*) where formula was historically broken
      // Do NOT reset for other games where identical scores are legitimate
      if(key.startsWith('17_') && rawScores.length>=3 && rawScores.every(s=>s===rawScores[0])) {
        rawScores = []; calStore[key] = [];
        console.log('[Cal] Reset poisoned starwars key:', key);
      }

      // Effective min/avg/max: use override if set, else compute from previous scores
      let minS, avgS, maxS;
      if (rawScores.length === 0 && !overrides[key+'_avg']) {
        mtEarned = 1.0; // First play ever → always exactly 1 MT
      } else {
        const _ov_min = overrides[key+'_min'];
        const _ov_max = overrides[key+'_max'];
        const _ov_avg = overrides[key+'_avg'];
        minS = (_ov_min !== undefined && !isNaN(_ov_min)) ? _ov_min : (rawScores.length ? Math.min(...rawScores) : raw);
        maxS = (_ov_max !== undefined && !isNaN(_ov_max)) ? _ov_max : (rawScores.length ? Math.max(...rawScores) : raw);
        avgS = (_ov_avg !== undefined && !isNaN(_ov_avg)) ? _ov_avg : (rawScores.length ? rawScores.reduce((a,b)=>a+b,0)/rawScores.length : raw);

        // Guard against division by zero and NaN — robust MT calculation
        if (isNaN(minS)||isNaN(maxS)||isNaN(avgS)||isNaN(raw)) {
          mtEarned = 1.0;
        } else if (maxS <= minS || maxS === minS) {
          // All scores identical: compare to average (or just give 1.0)
          mtEarned = raw >= (avgS||maxS) ? 1.0 : 0.8;
        } else if (raw <= minS) {
          mtEarned = 0.2;
        } else if (raw >= maxS) {
          mtEarned = 2.0;
        } else if (avgS <= minS || avgS >= maxS) {
          // avgS outside valid range (e.g. only _avg override set): linear min→max
          const range = maxS - minS;
          mtEarned = 0.2 + (raw - minS) / range * 1.8;
        } else if (raw < avgS) {
          const rangeBelow = avgS - minS;
          mtEarned = rangeBelow > 0 ? 0.2 + (raw - minS) / rangeBelow * 0.8 : 0.6;
        } else {
          const rangeAbove = maxS - avgS;
          mtEarned = rangeAbove > 0 ? 1.0 + (raw - avgS) / rangeAbove : 1.0;
        }
        mtEarned = Math.round(Math.min(2.0, Math.max(0.2, mtEarned)) * 10) / 10;
        // Final NaN guard (belt-and-suspenders)
        if (isNaN(mtEarned) || !isFinite(mtEarned)) mtEarned = 1.0;
      }

      // Log MT calculation
      if(typeof GameLog !== 'undefined') GameLog.log('mt','key='+key+' raw='+raw+' mt='+mtEarned+' scores='+rawScores.length+(rawScores.length?(' min='+Math.min(...rawScores)+' max='+Math.max(...rawScores)):''));
      // Save current score to cal store
      rawScores.push(raw);
      calStore[key] = rawScores;
      try { localStorage.setItem('cal_data_v3', JSON.stringify(calStore)); } catch(e){}

      // Sync aggregated + individual record to Firebase
      if (typeof _db !== 'undefined' && _db) {
        try {
          const upd = {}; upd[key] = rawScores; // was 'scores' (undefined) — bug fixed
          _db.collection('calibration').doc('scores').set(upd, {merge:true}).catch(()=>{});
          // Save record with dedup key to prevent duplicates
          const dedupKey = playerName+'_'+taskIndex+'_'+dev+'_'+Math.floor(Date.now()/5000);
          _db.collection('calibration_records').doc(dedupKey).set({
            gameIdx: taskIndex, device: dev, player: playerName,
            rawScore: raw, ts: Date.now(),
            tsStr: typeof window !== 'undefined' ? new Date().toLocaleString('de-CH',{timeZone:'Europe/Zurich'}) : new Date().toISOString()
          }).then(()=>{ if(typeof console!=='undefined') console.log('✅ Cal record saved:', dedupKey); })
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
    // Read OLD mt BEFORE overwriting (critical: prevent NaN from self-reference)
    const oldMt = (player.worlds[worldIndex].tasks[taskIndex]?.mt) || 0;

    player.worlds[worldIndex].tasks[taskIndex] = {
      done: true, score: finalScore, mt: mtEarned,
      rawScore: result.rawScore || 0,
      timeMs: result.timeMs || 0,
      calibrated: calRef !== null,
      plays: prevPlays + 1,
      lastPlayed: Date.now(),
    };

    // Update total score safely
    const prevTotal = isNaN(player.totalScore) ? 0 : (player.totalScore || 0);
    if (prevPlays > 0) {
      // Re-play: subtract old MT, add new (both validated)
      const safeOld = isNaN(oldMt) ? 0 : oldMt;
      player.totalScore = Math.max(0, Math.round((prevTotal - safeOld + mtEarned) * 10) / 10);
    } else {
      // First play: just add
      player.totalScore = Math.round((prevTotal + mtEarned) * 10) / 10;
    }
    // Final NaN guard on totalScore
    if (isNaN(player.totalScore) || !isFinite(player.totalScore)) {
      player.totalScore = prevTotal; // revert to last known good value
    }
    
    // If Janoschtest: save their raw scores as calibration data
    if (isRef) {
      this._saveRefScore(taskIndex, result.rawScore || 50, player);
    }
    
    // Check world completion — use actual world task length
    const _worldDef = (typeof WORLDS !== 'undefined' ? WORLDS : (typeof WORLD_DEFS !== 'undefined' ? WORLD_DEFS : [])).find(w=>w.id===worldIndex||w.id===Number(worldIndex));
    const _taskCount = _worldDef?.tasks?.length || 20;
    const doneCount = player.worlds[worldIndex].tasks.filter(t=>t&&t.done).length;
    const allDone = doneCount >= _taskCount;
    if (allDone) {
      player.worlds[worldIndex].completed = true;
      if ((player.currentWorld||1) <= worldIndex) player.currentWorld = Number(worldIndex) + 1;
    }
    // Also mirror under string key to prevent lookup mismatches
    player.worlds[String(worldIndex)] = player.worlds[worldIndex];

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
      const dev = this._detectDevice();
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
  getAge(player) {
    const by = parseInt(player?.birthYear);
    if(!by||isNaN(by)||by<1900) return 25; // default: adult if unknown
    return new Date().getFullYear() - by;
  },

  getAgeGroup(player) {
    const age = this.getAge(player);
    if (age < 10)  return 'sehr_einfach';  // unter 10
    if (age <= 14) return 'einfach';        // 10-14
    if (age <= 18) return 'mittel';         // 14-18 (schwer)
    return 'schwer';                         // über 18 (Abi-Niveau)
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
    // Sync to Firebase - force update all player tasks
    try {
      if (this._useCloud()) {
        for (const p of players) {
          const key = p.name.toLowerCase();
          // Use update to only reset the worlds field, more reliable than full set
          await this._col().doc(key).set(p).catch(async () => {
            // Try again with just worlds reset
            await this._col().doc(key).update({
              'worlds.1.tasks': Array(20).fill(null),
              'worlds.1.completed': false,
              "worlds['1'].tasks": Array(20).fill(null),
              totalScore: 0,
              updatedAt: Date.now()
            }).catch(()=>{});
          });
        }
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
        // Compare MT values: local MT should NEVER be overwritten by lower cloud MT
        const getPlayerMT = (p) => {
          try {
            const ws = p?.worlds?.['1'] || p?.worlds?.[1] || {};
            return (ws.tasks||[]).reduce((s,t) => s+(t&&t.mt||0), 0);
          } catch(e) { return 0; }
        };
        const localMT = getPlayerMT(local);
        const cloudMT = getPlayerMT(cloud);
        const localDone = (() => { try { const ws=local?.worlds?.['1']||local?.worlds?.[1]||{}; return (ws.tasks||[]).filter(t=>t&&t.done).length; } catch(e){return 0;} })();
        const cloudDone = (() => { try { const ws=cloud?.worlds?.['1']||cloud?.worlds?.[1]||{}; return (ws.tasks||[]).filter(t=>t&&t.done).length; } catch(e){return 0;} })();
        
        // Use cloud ONLY if it has strictly MORE completed tasks AND more MT
        // This prevents cloud from ever overwriting newer local progress
        if (cloudDone > localDone && cloudMT >= localMT) {
          this.currentPlayer = cloud;
        }
        // else: keep local data (it has the freshest task/MT data)
      }
    } catch(e) {}
    // Repair legacy tasks that show a raw-score star instead of MT
    try {
      if(this._repairZeroMt(this.currentPlayer)) {
        this._local.save(this.currentPlayer);
        if(typeof this.savePlayer==='function') this.savePlayer(this.currentPlayer).catch(()=>{});
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

// ============================================================
// RANK NOTIFICATIONS — shared between Denkspiel (app.js) and Zoo (zoo.html)
// ============================================================
// Checks whether the player's combined global rank (Welt-1 MT + Zoo MT) has
// moved up or down since the last time we told them, at most once per hour.
// Plays a short chime on improvement, a bigger fanfare specifically for #1.
const RankNotify = {
  async check(playerName) {
    try {
      if (!playerName) return;
      const key = playerName.toLowerCase();
      const rankKey = 'mischa_notified_rank_' + key;
      const timeKey = 'mischa_rank_notif_time_' + key;

      const localAll = State._local.getAll() || {};
      let firebaseAll = {};
      let firebaseFetchOk = false;
      try {
        const fb = await Promise.race([State.getAll(), new Promise(r=>setTimeout(()=>r(null),3000))]);
        if (fb) { firebaseAll = fb; firebaseFetchOk = true; }
      } catch(e) {}
      let zoosAll = {};
      try {
        zoosAll = await Promise.race([State.getAllZoos(), new Promise(r=>setTimeout(()=>r({}),3000))]);
      } catch(e) {}
      const merged = {...firebaseAll};
      Object.entries(localAll).forEach(([name, localP]) => {
        const fbP = firebaseAll[name];
        if (!fbP) { if (!firebaseFetchOk) { merged[name] = localP; } return; }
        const localWs = localP.worlds?.['1'] || localP.worlds?.[1] || {};
        const fbWs = fbP.worlds?.['1'] || fbP.worlds?.[1] || {};
        const localDone = (localWs.tasks||[]).filter(t=>t?.done).length;
        const fbDone = (fbWs.tasks||[]).filter(t=>t?.done).length;
        if (localDone > fbDone || (localP.updatedAt||0) > (fbP.updatedAt||0)) merged[name] = localP;
      });
      const _zooMTFor = (name) => {
        const z = zoosAll[name?.toLowerCase()];
        return (z && typeof z.mt === 'number' && isFinite(z.mt)) ? z.mt : 0;
      };
      const players = Object.values(merged)
        .filter(p => p.name)
        .map(p => ({ name:p.name, _mt: (()=>{const ws=p.worlds?.[1]||p.worlds?.['1']||{}; return (ws.tasks||[]).reduce((s,t)=>s+(t&&t.mt!=null?t.mt:0),0) + _zooMTFor(p.name);})() }))
        .sort((a,b) => b._mt - a._mt);

      // A player who only ever played the Zoo (no mischa_players entry at all)
      // still needs to appear in the ranking — add them in if missing.
      if (!players.some(p => p.name.toLowerCase() === key) && zoosAll[key]) {
        players.push({ name: playerName, _mt: _zooMTFor(playerName) });
        players.sort((a,b) => b._mt - a._mt);
      }

      const myIdx = players.findIndex(p => p.name.toLowerCase() === key);
      if (myIdx === -1) return;
      const newRank = myIdx + 1;

      const prevRank = parseInt(localStorage.getItem(rankKey) || '0');
      if (!prevRank) { localStorage.setItem(rankKey, String(newRank)); return; } // first check, just establish baseline

      if (newRank === prevRank) return; // no change

      const lastNotif = parseInt(localStorage.getItem(timeKey) || '0');
      const throttled = (Date.now() - lastNotif) < 60*60*1000; // max 1× pro Stunde
      if (throttled) return; // rank change noted, but we already told them once this hour — wait for next check

      const improved = newRank < prevRank;
      // Neighbor heuristic: who I likely just passed / who just passed me
      const neighbor = improved ? players[myIdx+1] : players[myIdx-1];
      const neighborName = neighbor ? neighbor.name : null;

      localStorage.setItem(rankKey, String(newRank));
      localStorage.setItem(timeKey, String(Date.now()));

      this._showToast(newRank, improved, neighborName);
      if (improved) this._playSound(newRank === 1);
    } catch(e) {}
  },

  _showToast(newRank, improved, neighborName) {
    const medal = newRank===1?'🥇':newRank===2?'🥈':newRank===3?'🥉':'📊';
    const _tt = (key, vars) => {
      let s = (typeof t!=='undefined' && typeof t==='function') ? t(key) : null;
      if (!s || s===key) {
        const fallback = { 'rank.now_first':'🎉 Du bist jetzt Platz 1!', 'rank.now_place':'📈 Du bist jetzt Platz {n}!',
          'rank.now_place_down':'📉 Du bist jetzt Platz {n}.', 'rank.you_passed':'Du hast {name} überholt!', 'rank.passed_you':'{name} hat dich überholt!' };
        s = fallback[key] || key;
      }
      if (vars) Object.keys(vars).forEach(k => { s = s.split('{'+k+'}').join(vars[k]); });
      return s;
    };
    const headline = improved
      ? (newRank===1 ? _tt('rank.now_first') : _tt('rank.now_place', {n:newRank}))
      : _tt('rank.now_place_down', {n:newRank});
    const sub = neighborName
      ? (improved ? _tt('rank.you_passed', {name:neighborName}) : _tt('rank.passed_you', {name:neighborName}))
      : '';
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;top:16px;left:50%;transform:translateX(-50%) translateY(-20px);z-index:100000;
      background:${improved?'linear-gradient(135deg,#27AE60,#1E8449)':'linear-gradient(135deg,#5D6D7E,#34495E)'};
      color:white;padding:14px 22px;border-radius:16px;font-family:'Fredoka One',cursive,Arial,sans-serif;
      box-shadow:0 8px 28px rgba(0,0,0,0.35);max-width:min(340px,90vw);text-align:center;
      opacity:0;transition:all 0.4s ease;pointer-events:none`;
    el.innerHTML = `<div style="font-size:1.5rem;margin-bottom:2px">${medal}</div>
      <div style="font-size:1.05rem">${headline}</div>
      ${sub?`<div style="font-size:0.82rem;font-family:Arial,sans-serif;opacity:.85;margin-top:3px">${sub}</div>`:''}`;
    document.body.appendChild(el);
    requestAnimationFrame(()=>{ el.style.opacity='1'; el.style.transform='translateX(-50%) translateY(0)'; });
    setTimeout(()=>{
      el.style.opacity='0'; el.style.transform='translateX(-50%) translateY(-20px)';
      setTimeout(()=>el.remove(), 400);
    }, 5000);
  },

  _playSound(isFirstPlace) {
    try {
      const ctx = new (window.AudioContext||window.webkitAudioContext)();
      const notes = isFirstPlace
        ? [[523,.14],[659,.14],[784,.14],[1047,.32]]   // bigger fanfare for #1
        : [[523,.1],[659,.18]];                          // short chime for any improvement
      let t = ctx.currentTime;
      notes.forEach(([freq,dur])=>{
        const o=ctx.createOscillator(), g=ctx.createGain();
        o.type='triangle'; o.frequency.setValueAtTime(freq,t);
        g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(isFirstPlace?0.18:0.12,t+0.02);
        g.gain.exponentialRampToValueAtTime(0.001,t+dur);
        o.connect(g); g.connect(ctx.destination);
        o.start(t); o.stop(t+dur+0.05);
        t += dur*0.85;
      });
    } catch(e) {}
  },
};
window.RankNotify = RankNotify;

// ============================================================
// CONTEST COUNTDOWN & FREEZE — shared between Denkspiel and Zoo
// ============================================================
// Countdown to 14.08.2026 18:00 (contest deadline). The leaderboard then
// freezes for 2 days (until 16.08.2026 18:00) on a snapshot taken by
// whichever client happens to check first after the deadline — there's no
// server cron here, so the exact freeze moment can lag by however long it
// takes for someone to open the app after 18:00. After the freeze window,
// everything resumes live, including whatever was earned during the freeze.
const Contest = {
  START: new Date(2026, 6, 10, 22, 0, 0).getTime(),   // TEMP TEST VALUE: 10.07.2026 22:00 — remind to revert to 14.08.2026 18:00!
  END:   new Date(2026, 6, 12, 22, 0, 0).getTime(),    // TEMP TEST VALUE: 12.07.2026 22:00 (2 Tage später) — remind to revert to 16.08.2026 18:00!

  phase() {
    const now = Date.now();
    if (now < this.START) return 'countdown';
    if (now < this.END) return 'frozen';
    return 'ended';
  },

  // Builds the combined (Welt-1 + Zoo) ranked player list — same logic as
  // RankNotify.check(), factored out so the frozen snapshot can reuse it.
  async _computeStandings() {
    const localAll = State._local.getAll() || {};
    let firebaseAll = {};
    let firebaseFetchOk = false;
    try {
      const fb = await Promise.race([State.getAll(), new Promise(r=>setTimeout(()=>r(null),4000))]);
      if (fb) { firebaseAll = fb; firebaseFetchOk = true; }
    } catch(e) {}
    let zoosAll = {};
    try {
      zoosAll = await Promise.race([State.getAllZoos(), new Promise(r=>setTimeout(()=>r({}),4000))]);
    } catch(e) {}
    const merged = {...firebaseAll};
    Object.entries(localAll).forEach(([name, localP]) => {
      const fbP = firebaseAll[name];
      if (!fbP) { if (!firebaseFetchOk) { merged[name] = localP; } return; }
      const localWs = localP.worlds?.['1'] || localP.worlds?.[1] || {};
      const fbWs = fbP.worlds?.['1'] || fbP.worlds?.[1] || {};
      const localDone = (localWs.tasks||[]).filter(t=>t?.done).length;
      const fbDone = (fbWs.tasks||[]).filter(t=>t?.done).length;
      if (localDone > fbDone || (localP.updatedAt||0) > (fbP.updatedAt||0)) merged[name] = localP;
    });
    const _zooMTFor = (name) => {
      const z = zoosAll[name?.toLowerCase()];
      return (z && typeof z.mt === 'number' && isFinite(z.mt)) ? z.mt : 0;
    };
    const allNames = new Set([...Object.keys(merged), ...Object.keys(zoosAll)]);
    const players = [...allNames]
      .filter(name => name)
      .map(name => {
        const p = merged[name];
        const ws = p?.worlds?.[1] || p?.worlds?.['1'] || {};
        const dsMT = (ws.tasks||[]).reduce((s,t)=>s+(t&&t.mt!=null?t.mt:0),0);
        return { name: p?.name || name, _mt: dsMT + _zooMTFor(name) };
      })
      .sort((a,b) => b._mt - a._mt);
    return players;
  },

  // Returns the frozen standings, creating the shared snapshot in Firebase
  // the first time anyone asks for it after the deadline has passed.
  async getFrozenStandings() {
    try {
      if (State._useCloud() && _db) {
        const doc = await _db.collection('config').doc('contest_result').get();
        if (doc.exists && doc.data()?.standings) return doc.data().standings;
      }
    } catch(e) {}
    // No snapshot yet — compute and save it now (first client to check wins)
    const standings = await this._computeStandings();
    try {
      if (State._useCloud() && _db) {
        await _db.collection('config').doc('contest_result').set({
          standings, snapshotAt: Date.now(),
        });
      }
    } catch(e) {}
    return standings;
  },

  // Shows the "🏆 result" popup with the frozen leaderboard + congrats sound.
  // Safe to call repeatedly (e.g. every app open) — it just re-renders.
  async showResultPopup() {
    const standings = await this.getFrozenStandings();
    const medal = (i) => i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}.`;
    const rows = standings.slice(0, 10).map((p,i) => `
      <div style="display:flex;justify-content:space-between;padding:6px 10px;border-radius:8px;
        background:${i===0?'rgba(255,215,0,.15)':'rgba(255,255,255,.05)'};margin-bottom:4px;font-size:.92rem">
        <span>${medal(i)} ${p.name}</span><span style="font-weight:700">🌀 ${p._mt.toFixed(1)} MT</span>
      </div>`).join('');
    const overlay = document.createElement('div');
    overlay.style.cssText = `position:fixed;inset:0;z-index:200000;background:rgba(0,0,0,.75);
      display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;transition:opacity .4s`;
    overlay.innerHTML = `
      <div style="background:linear-gradient(135deg,#1a1a3d,#0a0a2e);border:2px solid #FFD700;border-radius:20px;
        padding:24px 20px;max-width:min(420px,92vw);max-height:85vh;overflow-y:auto;text-align:center;
        box-shadow:0 0 60px rgba(255,215,0,.3);font-family:'Fredoka One',cursive,Arial,sans-serif">
        <div style="font-size:2.2rem;margin-bottom:6px">🏆</div>
        <div style="color:#FFD700;font-size:1.3rem;margin-bottom:4px">Das Ergebnis steht fest!</div>
        <div style="color:rgba(255,255,255,.6);font-size:.8rem;font-family:Arial,sans-serif;margin-bottom:16px">
          ${standings[0]?`${standings[0].name} gewinnt mit ${standings[0]._mt.toFixed(1)} MT! 🎉`:''}
        </div>
        <div style="text-align:left;color:white;font-family:Arial,sans-serif">${rows}</div>
        <button onclick="this.closest('div[style*=fixed]').remove()"
          style="margin-top:16px;background:#FFD700;color:#2C3E50;border:none;padding:10px 24px;
          border-radius:12px;font-weight:900;cursor:pointer;font-family:Arial,sans-serif">Schliessen</button>
      </div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(()=>{ overlay.style.opacity='1'; });
    this._playCongratsSound();
  },

  _playCongratsSound() {
    try {
      const ctx = new (window.AudioContext||window.webkitAudioContext)();
      const notes = [[523,.15],[659,.15],[784,.15],[1047,.15],[1319,.4]]; // bigger fanfare arpeggio
      let t = ctx.currentTime;
      notes.forEach(([freq,dur])=>{
        const o=ctx.createOscillator(), g=ctx.createGain();
        o.type='triangle'; o.frequency.setValueAtTime(freq,t);
        g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(0.2,t+0.02);
        g.gain.exponentialRampToValueAtTime(0.001,t+dur);
        o.connect(g); g.connect(ctx.destination);
        o.start(t); o.stop(t+dur+0.05);
        t += dur*0.8;
      });
    } catch(e) {}
  },

  // Live-updating "days:hours:min:sec" countdown, rendered into the given element.
  // Call once; it re-renders itself every second until the deadline passes.
  renderCountdown(el) {
    if (!el) return;
    const tick = () => {
      const diff = this.START - Date.now();
      if (diff <= 0) { clearInterval(iv); return; }
      const d = Math.floor(diff/86400000);
      const h = Math.floor(diff%86400000/3600000);
      const m = Math.floor(diff%3600000/60000);
      const s = Math.floor(diff%60000/1000);
      el.innerHTML = `
        <div style="font-size:.72rem;color:rgba(255,255,255,.5);letter-spacing:1px;margin-bottom:4px">⏳ NOCH ZEIT BIS ZUM STICHTAG</div>
        <div style="display:flex;gap:10px;justify-content:center;font-family:'Fredoka One',cursive">
          ${[[d,'Tage'],[h,'Std'],[m,'Min'],[s,'Sek']].map(([v,l])=>`
            <div style="text-align:center">
              <div style="font-size:1.6rem;color:#FFD700;font-weight:900;line-height:1">${String(v).padStart(2,'0')}</div>
              <div style="font-size:.62rem;color:rgba(255,255,255,.4)">${l}</div>
            </div>`).join('')}
        </div>`;
    };
    tick();
    const iv = setInterval(tick, 1000);
  },
};
window.Contest = Contest;

// ============================================================
// CUSTOM ALERT — replaces native alert() so the browser's own
// "Auf <site> wird Folgendes angezeigt:" chrome never shows up.
// ============================================================
// ============================================================
// CUSTOM CONFIRM — replaces native confirm(), which some mobile
// browsers/PWA contexts silently block or auto-reject, making
// "if(!confirm(...)) return;" fail invisibly with no error at all.
// Usage: if (!(await showConfirm('Really?'))) return;
// ============================================================
// ============================================================
// CUSTOM PASSWORD PROMPT — Promise-based, returns the entered string,
// or null if cancelled. Used for the admin-login gate (avoids native
// prompt(), which some environments silently block).
// ============================================================
window.showPasswordPrompt = function(title, message) {
  return new Promise((resolve) => {
    try {
      const existing = document.getElementById('custom-pw-overlay');
      if (existing) existing.remove();
      const overlay = document.createElement('div');
      overlay.id = 'custom-pw-overlay';
      overlay.style.cssText = `position:fixed;inset:0;z-index:300000;background:rgba(0,0,0,.65);
        display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;transition:opacity .25s`;
      overlay.innerHTML = `
        <div style="background:linear-gradient(135deg,#1a1a3d,#0a0a2e);border:1.5px solid rgba(255,215,0,.4);
          border-radius:16px;padding:20px 22px;max-width:min(360px,90vw);text-align:center;
          box-shadow:0 10px 40px rgba(0,0,0,.5);font-family:Arial,sans-serif">
          <div style="color:#FFD700;font-weight:900;font-size:1.05rem;margin-bottom:6px">${title||'Passwort'}</div>
          <div style="color:#fff;font-size:.88rem;margin-bottom:14px">${message||'Bitte Passwort eingeben:'}</div>
          <input id="custom-pw-input" type="password" autocomplete="off" style="width:100%;box-sizing:border-box;
            background:#0d1f3c;color:#fff;border:1px solid rgba(255,255,255,.25);padding:10px 12px;
            border-radius:10px;font-size:1rem;margin-bottom:14px;text-align:center">
          <div style="display:flex;gap:10px">
            <button id="custom-pw-cancel" style="flex:1;background:rgba(255,255,255,.12);color:#fff;border:1px solid rgba(255,255,255,.25);padding:9px;border-radius:10px;font-weight:700;cursor:pointer;font-size:.88rem">Abbrechen</button>
            <button id="custom-pw-ok" style="flex:1;background:#FFD700;color:#2C3E50;border:none;padding:9px;border-radius:10px;font-weight:900;cursor:pointer;font-size:.88rem">OK</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      const input = overlay.querySelector('#custom-pw-input');
      const finish = (result) => { overlay.style.opacity='0'; setTimeout(()=>overlay.remove(), 250); resolve(result); };
      overlay.addEventListener('click', (e)=>{ if(e.target===overlay) finish(null); });
      overlay.querySelector('#custom-pw-cancel').addEventListener('click', ()=>finish(null));
      overlay.querySelector('#custom-pw-ok').addEventListener('click', ()=>finish(input.value));
      input.addEventListener('keydown', (e)=>{ if(e.key==='Enter') finish(input.value); if(e.key==='Escape') finish(null); });
      requestAnimationFrame(()=>{ overlay.style.opacity='1'; input.focus(); });
    } catch(e) { try{ resolve(prompt(message)); }catch(e2){ resolve(null); } }
  });
};

// ============================================================
// CUSTOM NUMBER PROMPT — like showPasswordPrompt, but a plain number input
// with a pre-filled default value. Returns the number, or null if cancelled.
// ============================================================
window.showNumberPrompt = function(title, message, defaultValue) {
  return new Promise((resolve) => {
    try {
      const existing = document.getElementById('custom-num-overlay');
      if (existing) existing.remove();
      const overlay = document.createElement('div');
      overlay.id = 'custom-num-overlay';
      overlay.style.cssText = `position:fixed;inset:0;z-index:300000;background:rgba(0,0,0,.65);
        display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;transition:opacity .25s`;
      overlay.innerHTML = `
        <div style="background:linear-gradient(135deg,#1a1a3d,#0a0a2e);border:1.5px solid rgba(255,215,0,.4);
          border-radius:16px;padding:20px 22px;max-width:min(360px,90vw);text-align:center;
          box-shadow:0 10px 40px rgba(0,0,0,.5);font-family:Arial,sans-serif">
          <div style="color:#FFD700;font-weight:900;font-size:1.05rem;margin-bottom:6px">${title||'Wert eingeben'}</div>
          <div style="color:#fff;font-size:.88rem;margin-bottom:14px">${message||''}</div>
          <input id="custom-num-input" type="text" inputmode="decimal" value="${defaultValue!=null?defaultValue:0}" style="width:100%;box-sizing:border-box;
            background:#0d1f3c;color:#fff;border:1px solid rgba(255,255,255,.25);padding:10px 12px;
            border-radius:10px;font-size:1rem;margin-bottom:14px;text-align:center">
          <div style="display:flex;gap:10px">
            <button id="custom-num-cancel" style="flex:1;background:rgba(255,255,255,.12);color:#fff;border:1px solid rgba(255,255,255,.25);padding:9px;border-radius:10px;font-weight:700;cursor:pointer;font-size:.88rem">Abbrechen</button>
            <button id="custom-num-ok" style="flex:1;background:#FFD700;color:#2C3E50;border:none;padding:9px;border-radius:10px;font-weight:900;cursor:pointer;font-size:.88rem">OK</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      const input = overlay.querySelector('#custom-num-input');
      const finish = (result) => { overlay.style.opacity='0'; setTimeout(()=>overlay.remove(), 250); resolve(result); };
      overlay.addEventListener('click', (e)=>{ if(e.target===overlay) finish(null); });
      overlay.querySelector('#custom-num-cancel').addEventListener('click', ()=>finish(null));
      overlay.querySelector('#custom-num-ok').addEventListener('click', ()=>finish(parseFloat(input.value.replace(',','.'))));
      input.addEventListener('keydown', (e)=>{ if(e.key==='Enter') finish(parseFloat(input.value.replace(',','.'))); if(e.key==='Escape') finish(null); });
      requestAnimationFrame(()=>{ overlay.style.opacity='1'; input.focus(); try{input.select();}catch(e){} });
    } catch(e) { try{ const v=prompt(message,defaultValue); resolve(v===null?null:parseFloat(v)); }catch(e2){ resolve(null); } }
  });
};

window.showConfirm = function(message) {
  return new Promise((resolve) => {
    try {
      const existing = document.getElementById('custom-confirm-overlay');
      if (existing) existing.remove();
      const overlay = document.createElement('div');
      overlay.id = 'custom-confirm-overlay';
      overlay.style.cssText = `position:fixed;inset:0;z-index:300000;background:rgba(0,0,0,.6);
        display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;transition:opacity .25s`;
      overlay.innerHTML = `
        <div style="background:linear-gradient(135deg,#1a1a3d,#0a0a2e);border:1.5px solid rgba(255,215,0,.4);
          border-radius:16px;padding:20px 22px;max-width:min(380px,90vw);text-align:center;
          box-shadow:0 10px 40px rgba(0,0,0,.5);font-family:Arial,sans-serif">
          <div style="color:#fff;font-size:.95rem;line-height:1.5;white-space:pre-line;margin-bottom:18px">${message}</div>
          <div style="display:flex;gap:10px">
            <button id="custom-confirm-cancel" style="flex:1;background:rgba(255,255,255,.12);color:#fff;border:1px solid rgba(255,255,255,.25);padding:9px;border-radius:10px;font-weight:700;cursor:pointer;font-size:.88rem">Abbrechen</button>
            <button id="custom-confirm-ok" style="flex:1;background:#E74C3C;color:#fff;border:none;padding:9px;border-radius:10px;font-weight:900;cursor:pointer;font-size:.88rem">OK</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      const finish = (result) => { overlay.style.opacity='0'; setTimeout(()=>overlay.remove(), 250); resolve(result); };
      overlay.addEventListener('click', (e)=>{ if(e.target===overlay) finish(false); });
      overlay.querySelector('#custom-confirm-cancel').addEventListener('click', ()=>finish(false));
      overlay.querySelector('#custom-confirm-ok').addEventListener('click', ()=>finish(true));
      requestAnimationFrame(()=>{ overlay.style.opacity='1'; });
    } catch(e) { try{ resolve(confirm(message)); }catch(e2){ resolve(false); } }
  });
};

// ============================================================
// DEVICE ID — a random identifier persisted in localStorage, so a player
// can be recognized (and banned) across name changes on the SAME browser.
// This is a soft deterrent, not a hard guarantee: clearing site data,
// incognito mode, a different browser, or a different device all produce
// a fresh ID. Still useful to stop a quick "just retype a new name".
// ============================================================
// ============================================================
// PLAYTIME & LOGIN TRACKING — shared between Denkspiel (app.js) and Zoo
// (zoo.html). Tracks: how many times logged in, when last, and total
// session time. Stored separately per world (mischa_players / zoos docs)
// since a player might have very different history in each; the Admin
// Panel sums/merges them for a combined view.
// ============================================================
const PlayTime = {
  _intervals: {},

  // Call once, right after a successful login, before starting tracking.
  async recordLogin(kind, name) {
    try {
      if (typeof _db === 'undefined' || !_db) return;
      const col = kind === 'zoo' ? 'zoos' : 'mischa_players';
      const key = kind === 'zoo' ? 'zoo_' + name.toLowerCase() : name.toLowerCase();
      const inc = (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue)
        ? firebase.firestore.FieldValue.increment(1) : 1;
      await _db.collection(col).doc(key).set({
        loginCount: inc,
        lastLogin: Date.now(),
      }, { merge: true });
    } catch(e) {}
  },

  // Starts a periodic accumulator that adds elapsed seconds to totalPlaytimeSec
  // every 60s while this tab/session stays open. Call once after login.
  startTracking(kind, name) {
    try {
      const col = kind === 'zoo' ? 'zoos' : 'mischa_players';
      const key = kind === 'zoo' ? 'zoo_' + name.toLowerCase() : name.toLowerCase();
      if (this._intervals[key]) return; // already tracking
      this._intervals[key] = setInterval(async () => {
        try {
          if (typeof _db === 'undefined' || !_db) return;
          const inc = (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue)
            ? firebase.firestore.FieldValue.increment(60) : 60;
          await _db.collection(col).doc(key).set({ totalPlaytimeSec: inc }, { merge: true });
        } catch(e) {}
      }, 60000);
      // Separate, faster heartbeat so the admin panel's "online now" check also
      // recognizes Welt-1 (Denkspiel) activity — previously "online" only ever
      // reflected being physically inside the Zoo's 3D world (zoo_players pings),
      // so a player actively doing Welt-1 tasks looked permanently offline.
      if (kind === 'ds' && !this._heartbeats) this._heartbeats = {};
      if (kind === 'ds' && !this._heartbeats[key]) {
        const ping = async () => { try{ if(typeof _db!=='undefined'&&_db) await _db.collection('mischa_players').doc(key).set({lastActive:Date.now()},{merge:true}); }catch(e){} };
        ping();
        this._heartbeats[key] = setInterval(ping, 15000);
      }
    } catch(e) {}
  },
};
window.PlayTime = PlayTime;

window.getDeviceId = function() {
  try {
    let id = localStorage.getItem('mischa_device_id');
    if (!id) {
      id = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 12);
      localStorage.setItem('mischa_device_id', id);
    }
    return id;
  } catch(e) { return null; }
};

// Checks whether the CURRENT device is on the ban list. Call at login time
// (both Denkspiel and Zoo) before letting someone in.
window.checkDeviceBanned = async function() {
  try {
    const id = window.getDeviceId();
    if (!id || typeof _db === 'undefined' || !_db) return null;
    const doc = await _db.collection('banned_devices').doc(id).get();
    return doc.exists ? doc.data() : null;
  } catch(e) { return null; }
};

window.showAlert = function(message) {
  try {
    const existing = document.getElementById('custom-alert-overlay');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.id = 'custom-alert-overlay';
    overlay.style.cssText = `position:fixed;inset:0;z-index:300000;background:rgba(0,0,0,.55);
      display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;transition:opacity .25s`;
    overlay.innerHTML = `
      <div style="background:linear-gradient(135deg,#1a1a3d,#0a0a2e);border:1.5px solid rgba(255,215,0,.4);
        border-radius:16px;padding:20px 22px;max-width:min(360px,90vw);text-align:center;
        box-shadow:0 10px 40px rgba(0,0,0,.5);font-family:Arial,sans-serif">
        <div style="color:#fff;font-size:.95rem;line-height:1.5;white-space:pre-line;margin-bottom:16px">${message}</div>
        <button id="custom-alert-ok" style="background:#FFD700;color:#2C3E50;border:none;padding:9px 28px;
          border-radius:10px;font-weight:900;cursor:pointer;font-size:.92rem">OK</button>
      </div>`;
    document.body.appendChild(overlay);
    const close = () => { overlay.style.opacity='0'; setTimeout(()=>overlay.remove(), 250); };
    overlay.addEventListener('click', (e)=>{ if(e.target===overlay) close(); });
    overlay.querySelector('#custom-alert-ok').addEventListener('click', close);
    requestAnimationFrame(()=>{ overlay.style.opacity='1'; });
  } catch(e) { /* last-resort fallback */ try{ alert(message); }catch(e2){} }
};
window.initFirebase = initFirebase;
