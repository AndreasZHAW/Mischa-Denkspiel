// Game event logger
const GameLog = {
  _log: [],
  log(game, msg, level='info') {
    const ts=Date.now();
    const timeStr=new Date(ts).toLocaleTimeString('de-CH',{timeZone:'Europe/Zurich',hour:'2-digit',minute:'2-digit',second:'2-digit',fractionalSecondDigits:3});
    const entry = {ts, timeStr, game, msg, level};
    this._log.push(entry);
    if(this._log.length > 500) this._log.shift();
    try {
      const stored = JSON.parse(localStorage.getItem('mischa_game_log')||'[]');
      stored.push(entry);
      localStorage.setItem('mischa_game_log', JSON.stringify(stored.slice(-200)));
    } catch(e) {}
    const prefix = level==='err'?'[E|'+game+']':'[I|'+game+']';
    if(level==='err') console.error(prefix, msg);
    else console.log(prefix, msg);
  },
  error(game, msg) {
    this.log(game, 'ERROR: '+msg, 'err');
    try {
      const el = JSON.parse(localStorage.getItem('mischa_error_log')||'[]');
      const timeStr=new Date().toLocaleString('de-CH',{timeZone:'Europe/Zurich'});
      el.push(timeStr+' ['+game+']: '+msg);
      localStorage.setItem('mischa_error_log', JSON.stringify(el.slice(-100)));
    } catch(e) {}
  },
  warn(game, msg) { this.log(game, 'WARN: '+msg, 'warn'); },
  clear() { this._log=[]; localStorage.removeItem('mischa_game_log'); localStorage.removeItem('mischa_error_log'); },
  // Show log viewer overlay
  showViewer() {
    const stored=JSON.parse(localStorage.getItem('mischa_game_log')||'[]');
    const errors=JSON.parse(localStorage.getItem('mischa_error_log')||'[]');
    const el=document.createElement('div');
    el.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:99999;overflow-y:auto;padding:16px;font-family:monospace;font-size:12px;color:#aaa';
    const lines=[...stored].reverse().slice(0,150).map(e=>{
      const col=e.level==='err'?'#ff6b6b':e.level==='warn'?'#ffd700':'#7ec8e3';
      return`<div style="color:${col};margin-bottom:2px">[${e.timeStr||'?'}] [${e.level||'I'}|${e.game}] ${e.msg}</div>`;
    }).join('');
    el.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <b style="color:#FFD700;font-size:14px">📋 Game Log (${stored.length} Einträge)</b>
      <div style="display:flex;gap:8px">
        <button onclick="GameLog.clear();this.closest('div[style]').remove()" style="background:#E74C3C;border:none;color:white;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:11px">🗑️ Löschen</button>
        <button onclick="navigator.clipboard&&navigator.clipboard.writeText(JSON.stringify(${JSON.stringify(stored).replace(/'/g,"\'")}));showAlert('Kopiert!')" style="background:#3498DB;border:none;color:white;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:11px">📋 Kopieren</button>
        <button onclick="this.closest('div[style]').remove()" style="background:#555;border:none;color:white;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:12px">✕ ${typeof t!=='undefined'?t('worldmap.close'):'Schliessen'}</button>
      </div>
    </div>
    <div>${lines||'<div style="color:#555">Keine Einträge</div>'}</div>`;
    document.body.appendChild(el);
  }
};
window.GameLog = GameLog;

const APP_VERSION = 'v400';
/**
 * app.js v3 — Mischa Denkspiel
 * - Async/await für Firebase
 * - Übung verlassen Button
 * - Weltweite Rangliste
 * - Auto-Logout nach 15 min / Seitenschluss
 * - 10 Welten (Frankreich-Ferien)
 * - Jahrgänge bis 1940
 * - VfB-Logos korrekt
 * - Zugspiel-Lösung versteckt
 * - Fehler bei Unterschiede-Spiel gefixt
 */

// ============================================================
// CHARACTERS
// ============================================================
const CHARACTERS = [
  { id:'spongebob',  emoji:'🧽', name:'SpongeBob',      hasColors:false },
  { id:'patrick',    emoji:'⭐', name:'Patrick',         hasColors:false },
  { id:'mario',      emoji:'🍄', name:'Mario',           hasColors:false },
  { id:'luigi',      emoji:'💚', name:'Luigi',           hasColors:false },
  { id:'stickman',   emoji:'🎨', name:'Strichmännchen',  hasColors:true  },
  { id:'woman',      emoji:'👩', name:'Wanderin',        hasColors:false },
  { id:'man',        emoji:'👨', name:'Wanderer',        hasColors:false },
  { id:'girl',       emoji:'👧', name:'Mädchen',         hasColors:false },
  { id:'boy',        emoji:'👦', name:'Junge',           hasColors:false },
  { id:'ninja',      emoji:'🥷', name:'Ninja',           hasColors:false },
  { id:'astronaut',  emoji:'🧑‍🚀', name:'Astronaut',   hasColors:false },
  { id:'detective',  emoji:'🕵️', name:'Detektiv',       hasColors:false },
  { id:'princess',   emoji:'👸', name:'Prinzessin',      hasColors:false },
  { id:'knight',     emoji:'⚔️', name:'Ritter',          hasColors:false },
  { id:'scientist',  emoji:'🧪', name:'Wissenschaftler', hasColors:false },
  { id:'explorer',   emoji:'🧭', name:'Entdecker',       hasColors:false },
];

const STICKMAN_COLORS = [
  { name:'Blau',   color:'#3498DB' }, { name:'Rot',    color:'#E74C3C' },
  { name:'Grün',   color:'#27AE60' }, { name:'Lila',   color:'#9B59B6' },
  { name:'Orange', color:'#E67E22' }, { name:'Pink',   color:'#FF6B9D' },
];

// ============================================================
// APP
// ============================================================
// ══ FONT SCALE SYSTEM v267 — REBUILT FOR RELIABILITY ══
// Design goals:
//  1. ONE single global storage key — no device-fingerprint, no per-player key.
//     (Fingerprints changed silently when Android's display-density setting changed,
//      orphaning the saved value and causing it to look "reset".)
//  2. NEVER silently delete a valid user choice. Only clamp to a safe range on read.
//  3. Shared between Denkspiel (index.html) AND Zoo (zoo.html) — one setting, both worlds.
const FontScale = {
  KEY: 'mischa_font_size',           // the ONE key, shared everywhere
  MIN: 10, MAX: 40,                  // generous safe range — never destroys unusual choices
  DEFAULT: 16,

  // Detect system font size and generate 10 steps from 2× to 0.3× system size
  // (still used by the eye-test picker UI to offer sensible step choices)
  detectSizes() {
    let sysSize = 16;
    try {
      const probe = document.createElement('div');
      probe.style.cssText = 'position:fixed;visibility:hidden;font-size:1em;left:-9999px';
      document.body.appendChild(probe);
      const computed = parseFloat(window.getComputedStyle(probe).fontSize);
      probe.remove();
      if (computed >= 8 && computed <= 40) sysSize = computed;
    } catch(e) {}
    const dpr = window.devicePixelRatio || 1;
    const dprFactor = Math.min(dpr, 2.5) / 1.0;
    const effectiveSys = sysSize < 18 ? Math.round(sysSize * Math.min(dprFactor, 1.8)) : sysSize;
    const maxPx = Math.round(effectiveSys * 2.0);
    const minPx = Math.max(8, Math.round(effectiveSys * 0.30));
    const steps = [];
    for (let i = 0; i < 10; i++) {
      const t = i / 9;
      const logMax = Math.log(maxPx);
      const logMin = Math.log(minPx);
      const px = Math.round(Math.exp(logMax + t * (logMin - logMax)));
      if (steps.length === 0 || px !== steps[steps.length - 1]) steps.push(px);
    }
    while (steps.length < 10) steps.push(steps[steps.length - 1] - 1);
    steps.length = 10;
    return { steps, sysSize, effectiveSys, maxPx, minPx };
  },

  // One-time migration from the old fragile per-device/per-player keys, so
  // players who already ran the eye-test don't lose their chosen size.
  _migrateOnce() {
    try {
      // Stable flag name (not version-suffixed) — runs exactly once, ever.
      if (localStorage.getItem('mischa_font_migrated') === '1') return;
      let migrated = null;
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('mischa_fontscale_') && !k.endsWith('_tested')) keys.push(k);
      }
      // BUGFIX: take the LARGEST valid old value, not the first one found.
      // After many eye-test sessions across devices/versions, several old
      // fragile keys could exist (small early tests, later bigger choices).
      // Picking "first found" picked essentially a random one — often a
      // small leftover — silently shrinking the font. Largest-value is the
      // safer default: under-sizing hurts readability more than over-sizing.
      for (const k of keys) {
        const v = parseInt(localStorage.getItem(k));
        if (v >= 8 && v <= 60 && (migrated === null || v > migrated)) migrated = v;
      }
      if (migrated) localStorage.setItem(this.KEY, String(this.clamp(migrated)));
      // Clean up ALL old keys (fragile, no longer used)
      keys.forEach(k => { try { localStorage.removeItem(k); } catch(e) {} });
      localStorage.setItem('mischa_font_migrated', '1');
    } catch(e) {}
  },

  clamp(sizePx) {
    sizePx = parseInt(sizePx);
    if (isNaN(sizePx)) return this.DEFAULT;
    return Math.max(this.MIN, Math.min(this.MAX, sizePx));
  },

  // Load saved size — never deletes data, only clamps for safety.
  load() {
    this._migrateOnce();
    try {
      const saved = localStorage.getItem(this.KEY);
      if (saved !== null) {
        const size = parseInt(saved);
        if (!isNaN(size)) return this.clamp(size);
      }
    } catch(e) {}
    // No saved size yet: auto-detect a sensible default
    try {
      const d = this.detectSizes();
      return this.clamp(d.steps[4] || this.DEFAULT);
    } catch(e) {}
    return this.DEFAULT;
  },

  // Save — single key, applies everywhere (Denkspiel + Zoo) immediately.
  save(playerName, sizePx) {
    sizePx = this.clamp(sizePx);
    try { localStorage.setItem(this.KEY, String(sizePx)); } catch(e) {}
    // Optional: log to Firebase for diagnostics/support (best-effort, never blocks)
    try {
      if (typeof _db !== 'undefined' && _db) {
        _db.collection('player_device_fonts').doc(
          (playerName||'guest').toLowerCase() + '_' + Date.now()
        ).set({
          player: playerName || 'guest',
          screenW: screen.width, screenH: screen.height,
          dpr: window.devicePixelRatio||1,
          fontSizePx: sizePx,
          userAgent: navigator.userAgent.slice(0,120),
          updatedAt: Date.now(),
          updatedStr: new Date().toLocaleString('de-CH',{timeZone:'Europe/Zurich'}),
        }).catch(() => {});
      }
    } catch(e) {}
  },

  // Apply — sets ONE CSS variable. The stylesheet rule
  // `html{font-size:var(--user-font-size)!important}` does the rest.
  apply(sizePx) {
    sizePx = this.clamp(sizePx);
    window._userFontSize = sizePx;
    window._userFontScale = sizePx / 16;
    document.documentElement.style.setProperty('--user-font-size', sizePx + 'px');
    document.documentElement.style.setProperty('--user-font-scale', (sizePx/16).toFixed(3));
  },

  // Apply for player (load + apply). playerName kept only for Firebase logging.
  applyForPlayer(playerName) {
    const size = this.load();
    this.apply(size);
    return size;
  },

  // "tested" flag — still per-device-ish but harmless if it resets occasionally
  // (only gates a one-time hint UI, never destroys the actual font choice).
  testDone() {
    try { return localStorage.getItem('mischa_font_tested_v267') === '1'; } catch(e) { return false; }
  },
  markTested() {
    try { localStorage.setItem('mischa_font_tested_v267', '1'); } catch(e) {}
  },
};
window.FontScale = FontScale;

const App = {
  selectedChar: null,
  selectedColor: null,

  // ---- HELPERS ----
  _html(html) { document.getElementById('app').innerHTML = html; },
  _char(player) { return CHARACTERS.find(c => c.id === player?.character); },

  // ---- LOADING ----
  _loading(msg = 'Laden...') {
    this._html(`
      <div class="mountain-bg"><div class="sky-gradient"></div>${mountainSVG()}</div>
      <div class="page"><div style="text-align:center;color:white">
        <div style="font-size:3rem;animation:bounce 1s infinite">⏳</div>
        <div style="font-family:Arial,sans-serif;font-size:1.3rem;margin-top:10px">${msg}</div>
      </div></div>`);
  },

  // ── BACKGROUND COLOR DIAGNOSTIC ──
  // Shows the ACTUAL computed colors the browser is using, right on the
  // affected page, so we stop guessing and see real data from the device.
  _showBgDiagnostic() {
    const rows = [];
    const check = (label, el) => {
      if (!el) { rows.push([label, '❌ Element nicht gefunden']); return; }
      const cs = window.getComputedStyle(el);
      rows.push([label + ' background-color', cs.backgroundColor]);
      rows.push([label + ' background-image', cs.backgroundImage.slice(0,60)]);
      if (cs.filter && cs.filter !== 'none') rows.push([label + ' filter', cs.filter]);
      if (cs.mixBlendMode && cs.mixBlendMode !== 'normal') rows.push([label + ' mix-blend-mode', cs.mixBlendMode]);
      if (cs.opacity && cs.opacity !== '1') rows.push([label + ' opacity', cs.opacity]);
    };
    check('html', document.documentElement);
    check('body', document.body);
    check('#app (container)', document.getElementById('app'));
    check('.mountain-bg (first)', document.querySelector('.mountain-bg'));
    check('#wm-bg', document.getElementById('wm-bg'));
    check('#welcome-bg', document.getElementById('welcome-bg'));
    check('.page', document.querySelector('.page'));
    // Meta theme-color (affects browser chrome, not page, but worth logging)
    const meta = document.querySelector('meta[name="theme-color"]');
    rows.push(['<meta theme-color>', meta ? meta.content : '❌ nicht gefunden']);
    // Device info
    rows.push(['devicePixelRatio', window.devicePixelRatio]);
    rows.push(['prefers-color-scheme: dark', window.matchMedia('(prefers-color-scheme: dark)').matches]);
    rows.push(['User-Agent', navigator.userAgent.slice(0,80)]);

    // ── STACK CHECK: every element sitting at the screen's center point ──
    // This reveals any hidden overlay (semi-transparent color filter, extra
    // div, etc.) between the black background and what the eye sees —
    // without this, we'd only ever see the ONE element we guessed to check.
    rows.push(['── STACK @ screen center ──', '']);
    try {
      const cx = window.innerWidth/2, cy = window.innerHeight/2;
      const stack = document.elementsFromPoint(cx, cy);
      stack.slice(0,8).forEach((el,i) => {
        const cs = window.getComputedStyle(el);
        const tag = el.tagName.toLowerCase() + (el.id?'#'+el.id:'') + (el.className&&typeof el.className==='string'?'.'+el.className.split(' ').slice(0,2).join('.'):'');
        rows.push([`  [${i}] ${tag}`, `bg:${cs.backgroundColor} | filter:${cs.filter!=='none'?cs.filter:'-'} | opacity:${cs.opacity}`]);
      });
    } catch(e) { rows.push(['Stack-Check Fehler', e.message]); }

    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,.92);color:#0f0;font-family:monospace;font-size:.72rem;padding:16px;overflow-y:auto;box-sizing:border-box';
    ov.innerHTML = '<div style="color:#FFD700;font-weight:900;font-size:1rem;margin-bottom:10px">🔍 Hintergrund-Diagnose</div>' +
      rows.map(([k,v]) => `<div style="margin-bottom:6px;word-break:break-all"><span style="color:#7FDBFF">${k}:</span> ${v}</div>`).join('') +
      '<button onclick="this.parentElement.remove()" style="margin-top:16px;background:#FFD700;color:#000;border:none;padding:10px 20px;border-radius:8px;font-weight:900;cursor:pointer">Schliessen</button>' +
      '<button onclick="navigator.clipboard&&navigator.clipboard.writeText(this.parentElement.innerText);this.textContent=\'Kopiert!\'" style="margin-top:16px;margin-left:8px;background:#3498db;color:#fff;border:none;padding:10px 20px;border-radius:8px;font-weight:900;cursor:pointer">📋 Kopieren</button>';
    document.body.appendChild(ov);
  },

  // ---- WELCOME ----
  showWelcome() {
    // Apply saved font size immediately (new v267 single-key system)
    try { FontScale.apply(FontScale.load()); } catch(e) {}

    // Draw stars on canvas
    const wmc = document.getElementById('wm-stars');
    if(wmc){ const wctx=wmc.getContext('2d'); wmc.width=wmc.offsetWidth||window.innerWidth; wmc.height=wmc.offsetHeight||window.innerHeight;
      wctx.fillStyle='#000'; wctx.fillRect(0,0,wmc.width,wmc.height);
      for(let i=0;i<200;i++){const x=Math.random()*wmc.width,y=Math.random()*wmc.height*0.65,s=Math.random()*1.8+0.2,b=Math.random()*0.7+0.3;wctx.fillStyle=`rgba(255,255,${Math.floor(200+Math.random()*55)},${b})`;wctx.beginPath();wctx.arc(x,y,s,0,Math.PI*2);wctx.fill();}
      wmc.style.background='transparent';
    } const _ws = State.currentPlayer?.worlds?.[1] || State.currentPlayer?.worlds?.['1'] || {};
    // Use the same canonical dsMTFor helper everywhere (world card, pill,
    // leaderboard) so this screen can never disagree with the others.
    let mt = 0;
    try { mt = (typeof dsMTFor === 'function') ? dsMTFor(State.currentPlayer) : (_ws.tasks||[]).reduce((s,t)=>s+(t&&t.mt||0),0); } catch(_e) { mt = (_ws.tasks||[]).reduce((s,t)=>s+(t&&t.mt||0),0); }
    const hasEnough = mt >= 10;
    this._html(`
      <div class="mountain-bg" id="welcome-bg">
        <!-- Black/starfield background matching the Prolog/Intro — no castle
             here; the castle belongs to the Welt-1 game screens only. -->
        <div style="position:absolute;inset:0;background:#000"></div>
        <canvas id="wm-stars" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none"></canvas>
      </div>
      ${window.MISCHA_TESTMODE ? `<button onclick="App._showBgDiagnostic()" style="position:fixed;bottom:16px;right:16px;z-index:99998;background:#000;color:#0f0;border:2px solid #0f0;padding:8px 12px;border-radius:8px;font-size:.7rem;font-family:monospace;cursor:pointer">🔍 BG-Diagnose</button>` : ''}
      <div class="page">
        <div class="game-logo">
          <span class="logo-emoji">🎮</span>
          <h1>Mischa<br>Denkspiel</h1>
          <p class="subtitle">${typeof t!=='undefined'?t('welcome.subtitle'):'2 Welten · Verdiene 🌀 MT · Baue deinen Zoo!'}</p>
          <p style="font-size:var(--fs-sm);color:rgba(255,255,255,.4);margin-top:2px;letter-spacing:.5px">📦 v400 · 2026-07-20</p>
          <p style="font-size:.62rem;color:rgba(255,150,150,.7);margin-top:4px;font-family:monospace;word-break:break-all">pfad: ${window.location.pathname} → testmode: ${window.MISCHA_TESTMODE}</p>
        </div>
        <div class="card" style="background:linear-gradient(135deg,rgba(10,10,25,.95),rgba(20,20,40,.9));border:1px solid rgba(255,215,0,.25);box-shadow:0 0 30px rgba(255,165,0,.1)">
          <div style="text-align:center;margin-bottom:10px">${typeof LANG!=='undefined'?LANG.selectorHTML(true):''}</div>
          <div class="card-title" style="background:linear-gradient(135deg,#FFD700,#FF8C00);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">⚔️ ${typeof t!=='undefined'?t('welcome.title'):'Willkommen, Abenteurer'}</div>

          <!-- Welt 1 — informational label, not a button (no thick border/pill
               shape that invites clicking; a left accent bar reads as a
               section header instead) -->
          <div style="background:rgba(41,128,185,.1);border-left:4px solid #2980B9;border-radius:4px;padding:8px 12px;margin-bottom:8px;text-align:left">
            <div style="font-weight:700;color:#5DADE2;font-size:.92rem">${typeof t!=='undefined'?t('welcome.world1.short'):'🇫🇷 Welt 1: Frankreich'}</div>
          </div>

          <!-- Welt 2 - same treatment -->
          <div style="background:rgba(39,174,96,.1);border-left:4px solid #27AE60;border-radius:4px;padding:8px 12px;margin-bottom:14px;text-align:left">
            <div style="font-weight:700;color:#58D68D;font-size:.92rem">${typeof t!=='undefined'?t('welcome.world2.short'):'🦁 Welt 2: Zoo Empire'}</div>
          </div>

          <div style="display:flex;flex-direction:column;gap:8px">
            <button class="btn btn-primary btn-full btn-big" onclick="App.showCharSelect()">${typeof t!=='undefined'?t('btn.register'):'🆕 Neu registrieren'}</button>
            <button class="btn btn-secondary btn-full" onclick="App.showLogin()">${typeof t!=='undefined'?t('btn.login_short'):'🔑 Anmelden'}</button>
            <div style="display:flex;gap:6px;margin-top:6px;opacity:.8">
              <button class="btn" style="flex:1;background:rgba(255,255,255,0.35);color:var(--text-dark);padding:5px 10px;font-size:.72rem;border-radius:8px" onclick="App.showGlobalLeaderboard()">${typeof t!=='undefined'?t('wm.leaderboard'):'🌍 Rangliste'}</button>
              <button onclick="App.showQR()" style="background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.35);color:white;padding:5px 10px;border-radius:8px;font-size:.72rem;cursor:pointer" title="QR Code">📱 QR</button>
            </div>
            <button onclick="window.location.href='zoo.html?openadmin=1'" style="background:rgba(255,215,0,.1);border:1px solid rgba(255,215,0,.3);color:#FFD700;padding:5px 10px;border-radius:8px;font-weight:600;cursor:pointer;font-size:.72rem;margin-top:2px;opacity:.8">🔧 Admin-Login</button>
          </div>
        </div>
      </div>`);
    // Draw stars on the black welcome background (canvas now exists in DOM)
    setTimeout(()=>{
      const wmc = document.getElementById('wm-stars');
      if(wmc){ const wctx=wmc.getContext('2d'); wmc.width=wmc.offsetWidth||window.innerWidth; wmc.height=wmc.offsetHeight||window.innerHeight;
        for(let i=0;i<220;i++){const x=Math.random()*wmc.width,y=Math.random()*wmc.height,s=Math.random()*1.8+0.2,b=Math.random()*0.7+0.3;wctx.fillStyle=`rgba(255,255,${Math.floor(200+Math.random()*55)},${b})`;wctx.beginPath();wctx.arc(x,y,s,0,Math.PI*2);wctx.fill();}
      }
    },0);
  },

  // ── TELEPORT TO ZOO ──
  async teleportToZoo() {
    const p = State.currentPlayer;
    if (!p) { showAlert('Bitte erst anmelden!'); return; }
    // Use the EXACT same balance calculation as the world-map display that
    // decides whether this button even shows up (combinedMTFor: Welt-1
    // tasks + language bonus + Zoo MT, on the freshly-refreshed
    // State.currentPlayer). The previous version recomputed its own number
    // from State._local.get() — a separate local-storage cache that is NOT
    // updated when a value changes remotely (e.g. an admin resetting
    // someone's score from a different device/browser: refreshCurrentPlayer()
    // updates State.currentPlayer, but never touches State._local). Result:
    // the world map could correctly show "15.0 MT" and reveal the button
    // (mt>=15, computed via combinedMTFor(State.currentPlayer)), while this
    // check — reading the stale local cache instead — still saw the old
    // pre-reset value and rejected the click with "Du hast: 0.0 MT".
    let mt;
    try { mt = (typeof combinedMTFor === 'function') ? await combinedMTFor(p) : ((typeof dsMTFor === 'function') ? dsMTFor(p) : 0); }
    catch(_e) { mt = (typeof dsMTFor === 'function') ? dsMTFor(p) : 0; }
    const cost = 15;
    // Once unlocked (visited before), gate stays open permanently
    const _playerKey = p.name.toLowerCase();
    const _hasUnlocked = localStorage.getItem('zoo_unlocked_' + _playerKey) === '1';
    if (!_hasUnlocked && mt < cost) { showAlert('🦁 Zoo noch gesperrt! Du brauchst ' + cost + ' MT.\nDu hast: ' + formatMT(mt) + ' MT'); return; }
    // Remember unlock permanently
    if (mt >= cost) localStorage.setItem('zoo_unlocked_' + _playerKey, '1');
    if (!(await showConfirm('🦁 In den Zoo teleportieren?'))) return;
    // Zoo is FREE once unlocked - no MT deduction
    sessionStorage.setItem('mischa_current', p.name.toLowerCase());
    if(window.MISCHA_TESTMODE){try{sessionStorage.setItem('mischa_testmode','1');}catch(e){}}
    // Pass character so zoo skips its own login
    const charData = (window.CHARACTERS||CHARACTERS||[]).find(c=>c.id===p.character);
    const zooUsers = JSON.parse(localStorage.getItem('zoo_users')||'{}');
    const zKey = p.name.toLowerCase();
    const _charEmoji = charData?.emoji || (p.characterColor ? '🎮' : '🐾');
    const _charId = p.character || 'runner'; // always have a valid ID
    if(!zooUsers[zKey]) {
      zooUsers[zKey] = {n:p.name, pw:'auto', ch:{e:_charEmoji, id:_charId}};
    } else {
      // Always update character so it stays in sync
      zooUsers[zKey].ch = {e:_charEmoji, id:_charId};
      // Keep existing password (don't reset to 'auto' if user changed it)
    }
    localStorage.setItem('zoo_users', JSON.stringify(zooUsers));
    sessionStorage.setItem('mischa_birthyear', p.birthYear||2000);
    // ── BOARDING SCENE → then cinematic teleport ──
    this._showBoardingScene(p.name, charData?.emoji||'🧭', mt);
  },

  _showBoardingScene(playerName, charEmoji, mtLeft) {
    const PLAYER_NAME=playerName||'', PLAYER_EMOJI=charEmoji||'🧭';
    const ov=document.createElement('div'); ov.id='boarding-scene';
    document.body.style.background='#000';
    ov.style.cssText='position:fixed;inset:0;z-index:99999;background:#000;overflow:hidden;font-family:Arial,sans-serif';
    ov.innerHTML='<canvas id="bd-cv" style="position:absolute;inset:0;width:100%;height:100%"></canvas>'+
      '<audio id="bd-music" src="mischa_intro.mp3" preload="auto"></audio>'+
      '<div id="bd-title" style="position:absolute;top:9%;left:0;right:0;text-align:center;z-index:3;pointer-events:none;font-weight:900;letter-spacing:3px;opacity:0;transition:opacity .6s;font-family:Arial Black,Impact,sans-serif">'+
        '<span style="display:block;font-size:1.3rem;color:#ffe24a;letter-spacing:5px;text-shadow:0 0 18px rgba(255,210,74,.6);margin-bottom:4px">WELCOME TO THE</span>'+
        '<span style="display:block;font-size:3.4rem;background:linear-gradient(90deg,#4af0ff,#9fd8ff,#4af0ff);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;text-shadow:0 0 50px rgba(74,240,255,.5)">JANOSCH-SPACE-SHIP</span></div>'+
      '<div style="position:absolute;inset:0;z-index:3;pointer-events:none;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:7%"><div id="bd-speech" style="max-width:80%;background:linear-gradient(135deg,rgba(8,16,40,.94),rgba(2,6,20,.94));border:2px solid #4af0ff;border-radius:14px;padding:13px 22px;color:#fff;text-align:center;box-shadow:0 0 30px rgba(74,240,255,.45);opacity:0;transition:opacity .35s"><div style="font-size:.78rem;letter-spacing:2px;color:#4af0ff;font-weight:800;text-transform:uppercase;margin-bottom:3px">🚀 Janosch</div><div id="bd-msg" style="font-size:1.4rem;font-weight:700;line-height:1.3"></div></div></div>'+
      '<button id="bd-skip" style="position:absolute;bottom:14px;right:14px;z-index:10;background:rgba(255,255,255,.2);color:#fff;border:none;padding:8px 16px;border-radius:10px;font-weight:700;font-size:.85rem;cursor:pointer">'+(typeof window.t!=='undefined'?window.t('boarding.skip'):'Überspringen ⏭')+'</button>';
    document.body.appendChild(ov);
    const cv=document.getElementById('bd-cv'),ctx=cv.getContext('2d');
    const music=document.getElementById('bd-music');
    let W,H; const rs=()=>{W=cv.width=innerWidth;H=cv.height=innerHeight;}; rs(); window.addEventListener('resize',rs);
    const titleEl=document.getElementById('bd-title'),speechEl=document.getElementById('bd-speech'),msgEl=document.getElementById('bd-msg');
    let stars=Array.from({length:160},()=>({x:Math.random()*W,y:Math.random()*H*0.7,r:Math.random()*1.6+0.3,tw:Math.random()*7}));
    let frame=0,animId=null,_spoke={},done=false;
    const TOTAL=210;
    try{ music.volume=0; music.play().then(()=>{let v=0;const fd=setInterval(()=>{v=Math.min(0.75,v+0.05);music.volume=v;if(v>=0.75)clearInterval(fd);},60);}).catch(()=>{}); }catch(e){}
    const speak=(t)=>{try{if(!('speechSynthesis'in window))return;const u=new SpeechSynthesisUtterance(t);u.lang='en-US';u.rate=.92;u.pitch=1.05;u.volume=1;const vs=speechSynthesis.getVoices();const en=vs.find(v=>/^en/i.test(v.lang));if(en)u.voice=en;speechSynthesis.speak(u);}catch(e){}};
    const setSpeech=(msg,show)=>{msgEl.textContent=msg;speechEl.style.opacity=show?'1':'0';};
    const finish=()=>{ if(done)return; done=true; try{music.pause();}catch(e){} try{window.removeEventListener('resize',rs);}catch(e){} if(animId)cancelAnimationFrame(animId); ov.remove(); this._showTeleportCinema(playerName,charEmoji,mtLeft); };
    document.getElementById('bd-skip').onclick=finish;
    const drawShip=(cx,cy,s,doorOpen,glow)=>{ctx.save();ctx.translate(cx,cy);ctx.scale(s,s);const eg=ctx.createRadialGradient(-92,0,0,-92,0,70);eg.addColorStop(0,'rgba(120,200,255,'+(0.85*glow)+')');eg.addColorStop(.5,'rgba(60,120,255,'+(0.4*glow)+')');eg.addColorStop(1,'rgba(0,0,80,0)');ctx.fillStyle=eg;ctx.beginPath();ctx.arc(-92,0,70,0,7);ctx.fill();ctx.fillStyle='#1b2230';ctx.fillRect(-95,-22,22,16);ctx.fillRect(-95,6,22,16);const hull=ctx.createLinearGradient(0,-46,0,46);hull.addColorStop(0,'#d8e2f2');hull.addColorStop(.5,'#9aa6c0');hull.addColorStop(1,'#5a647e');ctx.fillStyle=hull;ctx.beginPath();ctx.moveTo(120,0);ctx.lineTo(20,-26);ctx.lineTo(-75,-22);ctx.lineTo(-88,-10);ctx.lineTo(-88,10);ctx.lineTo(-75,22);ctx.lineTo(20,26);ctx.closePath();ctx.fill();ctx.fillStyle='#6a7596';ctx.beginPath();ctx.moveTo(-10,-24);ctx.lineTo(-30,-58);ctx.lineTo(-46,-56);ctx.lineTo(-40,-22);ctx.closePath();ctx.fill();ctx.fillStyle='#7d88a8';ctx.beginPath();ctx.moveTo(-20,-18);ctx.lineTo(-70,-62);ctx.lineTo(-58,-60);ctx.lineTo(-8,-20);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(-20,18);ctx.lineTo(-70,62);ctx.lineTo(-58,60);ctx.lineTo(-8,20);ctx.closePath();ctx.fill();ctx.fillStyle='#c0392b';ctx.fillRect(-73,-64,7,5);ctx.fillRect(-73,60,7,5);const cg=ctx.createLinearGradient(40,-20,70,5);cg.addColorStop(0,'rgba(190,235,255,.95)');cg.addColorStop(.6,'rgba(70,150,255,.75)');cg.addColorStop(1,'rgba(15,45,110,.55)');ctx.fillStyle=cg;ctx.beginPath();ctx.moveTo(44,-14);ctx.lineTo(78,-6);ctx.lineTo(78,6);ctx.lineTo(44,14);ctx.closePath();ctx.fill();ctx.fillStyle='#e8533a';ctx.fillRect(-20,-4,90,4);ctx.fillStyle='#ffb24a';ctx.fillRect(-20,2,90,2);ctx.save();ctx.fillStyle='#161b28';ctx.fillRect(-46,16,34,10);if(doorOpen>0){ctx.fillStyle='rgba(255,220,140,'+(0.7*doorOpen)+')';ctx.fillRect(-44,16,30*doorOpen,9);}ctx.restore();ctx.fillStyle='rgba(0,0,0,.4)';ctx.fillRect(-8,-2,70,15);ctx.fillStyle='#4af0ff';ctx.font='bold 9px Arial';ctx.textAlign='center';ctx.fillText('JANOSCH-SPACE-SHIP',27,9);ctx.restore();};
    const drawJanosch=(cx,cy,s,wave)=>{ctx.save();ctx.translate(cx,cy);ctx.scale(s,s);ctx.fillStyle='#e8edf6';ctx.beginPath();ctx.roundRect(-20,-14,40,34,12);ctx.fill();ctx.fillStyle='#1b2230';ctx.beginPath();ctx.roundRect(-11,-6,22,14,3);ctx.fill();ctx.fillStyle='#27e070';ctx.fillRect(-8,-3,4,3);ctx.fillStyle='#4af0ff';ctx.fillRect(-8,3,16,2);const wa=Math.sin(wave*6)*0.5;ctx.strokeStyle='#e8edf6';ctx.lineWidth=9;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(16,-6);ctx.lineTo(28+wa*5,-26-wa*7);ctx.stroke();ctx.beginPath();ctx.moveTo(-16,-6);ctx.lineTo(-26,10);ctx.stroke();ctx.fillStyle='#eef2fa';ctx.beginPath();ctx.arc(0,-30,17,0,7);ctx.fill();const vg=ctx.createLinearGradient(-12,-38,12,-22);vg.addColorStop(0,'#0a2a4a');vg.addColorStop(.45,'#1d6fff');vg.addColorStop(.55,'#5fd0ff');vg.addColorStop(1,'#0a2a4a');ctx.fillStyle=vg;ctx.beginPath();ctx.ellipse(0,-30,12,11,0,0,7);ctx.fill();ctx.strokeStyle='#aab4c8';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(0,-30,17,0,7);ctx.stroke();ctx.fillStyle='#4af0ff';ctx.font='bold 10px Arial';ctx.textAlign='center';ctx.fillText('🚀 JANOSCH',0,62);ctx.restore();};
    const drawPlayer=(x,y,s,bob)=>{ctx.save();ctx.translate(x,y+Math.sin(bob)*3);ctx.scale(s,s);ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(0,30,20,6,0,0,7);ctx.fill();ctx.font='44px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(PLAYER_EMOJI,0,0);ctx.fillStyle='#fff';ctx.font='bold 13px Arial';ctx.fillText(PLAYER_NAME,0,34);ctx.restore();};
    const loop=()=>{
      const f=frame; ctx.clearRect(0,0,W,H);
      const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#03040c');bg.addColorStop(.6,'#080c1e');bg.addColorStop(1,'#0e1228');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
      stars.forEach(st=>{const a=0.4+Math.sin(f*0.05+st.tw)*0.4;ctx.globalAlpha=a;ctx.fillStyle='#cfe5ff';ctx.beginPath();ctx.arc(st.x,st.y,st.r,0,7);ctx.fill();});ctx.globalAlpha=1;
      const floorY=H*0.72;
      titleEl.style.opacity=(f>8&&f<170)?'1':'0';
      const shipS=Math.min(W,H)/560*1.2,shipX=W*0.64,shipY=floorY-40;
      const janoschS=Math.min(W,H)/560*0.85,janoschX=W*0.64-150*shipS,janoschY=floorY-4;
      const doorOpen=f<105?0:Math.min(1,(f-105)/25);
      const powerGlow=f>185?Math.min(1,(f-185)/18):(f>20?0.5:0);
      drawShip(shipX,shipY,shipS,doorOpen,powerGlow);
      if(f>10)drawJanosch(janoschX,janoschY,janoschS,f*0.04);
      const rampX=shipX-46*shipS;
      if(f<150){const t=Math.min(1,Math.max(0,(f-40)/70));const px=W*0.10+(rampX-W*0.10)*t;const walking=f>40&&f<105;drawPlayer(px,floorY-4,Math.min(W,H)/560*1.05,walking?f*0.3:0);}
      else if(f<170){const t=(f-150)/20;ctx.globalAlpha=1-t;drawPlayer(rampX,floorY-4,(Math.min(W,H)/560*1.05)*(1-t*0.6),0);ctx.globalAlpha=1;}
      if(f>=8&&!_spoke.w){_spoke.w=1;speak('Welcome to the Janosch Space Ship');}
      const _bt = (key, vars) => {
        let s = (typeof window.t!=='undefined') ? window.t(key) : null;
        if (!s || s===key) {
          const fb = {'boarding.get_in':'Steig ein, {name}!','boarding.buckle':'Festschnallen — wir fliegen zum Zoo!','boarding.countdown':'Triebwerke an… 3… 2… 1…'};
          s = fb[key] || key;
        }
        if (vars) Object.keys(vars).forEach(k => { s = s.split('{'+k+'}').join(vars[k]); });
        return s;
      };
      if(f>=14&&f<46)setSpeech('Welcome to the Janosch-Space-Ship!',true);
      else if(f>=52&&f<102)setSpeech(_bt('boarding.get_in',{name:PLAYER_NAME}),true);
      else if(f>=108&&f<170)setSpeech(_bt('boarding.buckle'),true);
      else if(f>=170)setSpeech(_bt('boarding.countdown'),f<200);
      else setSpeech('',false);
      if(f>195){ctx.fillStyle='rgba(120,200,255,'+((f-195)/12*0.6)+')';ctx.fillRect(0,0,W,H);}
      frame++;
      if(frame<=TOTAL && !done)animId=requestAnimationFrame(loop);
      else finish();
    };
    if('speechSynthesis'in window)speechSynthesis.getVoices();
    loop();
  },

  _showTeleportCinema(playerName, charEmoji, mtLeft) {
    const ov = document.createElement('div');
    ov.id = 'teleport-cinema';
    document.body.style.background='#000';
    ov.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#000;overflow:hidden;font-family:Arial,sans-serif';
    document.body.appendChild(ov);
    const W = window.innerWidth, H = window.innerHeight;
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
    cv.width = W; cv.height = H;
    ov.appendChild(cv);
    const ctx = cv.getContext('2d');
    const txt = document.createElement('div');
    txt.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:8%;pointer-events:none;z-index:2';
    ov.appendChild(txt);

    // === EPIC SOUND ===
    try {
      const ac = new (window.AudioContext||window.webkitAudioContext)();
      const note=(freq,start,dur,type='sine',vol=0.2)=>{const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(freq,ac.currentTime+start);g.gain.setValueAtTime(0,ac.currentTime+start);g.gain.linearRampToValueAtTime(vol,ac.currentTime+start+0.04);g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+start+dur);o.connect(g);g.connect(ac.destination);o.start(ac.currentTime+start);o.stop(ac.currentTime+start+dur);};
      [130,164,196,261,329,392,523,659,784,1047].forEach((n,i)=>{note(n,i*0.12,0.6,'sawtooth',0.07);note(n*2,i*0.12+0.06,0.3,'sine',0.04);});
      note(65,0,1.2,'square',0.12);note(523,1.2,0.8,'sine',0.18);note(659,1.35,0.7,'sine',0.18);note(784,1.5,0.6,'sine',0.18);note(1047,1.65,1.0,'sine',0.22);
      const wo=ac.createOscillator(),wg=ac.createGain();wo.type='sawtooth';wo.frequency.setValueAtTime(150,ac.currentTime);wo.frequency.exponentialRampToValueAtTime(5000,ac.currentTime+2.8);wg.gain.setValueAtTime(0.06,ac.currentTime);wg.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+2.8);wo.connect(wg);wg.connect(ac.destination);wo.start();wo.stop(ac.currentTime+2.8);
    } catch(e) {}

    // === STARS: fly outward from center ===
    const stars = Array.from({length: 500}, () => ({
      angle: Math.random() * Math.PI * 2,
      dist: Math.random() * 50,        // start near center
      speed: 0.5 + Math.random() * 2.5,
      size: 0.5 + Math.random() * 2,
      color: ['#fff','#adf','#faf','#ffd','#aff','#f9f','#9ff'][Math.floor(Math.random()*7)],
      trail: 0
    }));

    // Nebula clouds
    const nebulae = Array.from({length:8}, ()=>({
      x: W/2 + (Math.random()-0.5)*W*0.8,
      y: H/2 + (Math.random()-0.5)*H*0.8,
      r: 60+Math.random()*120,
      color: `hsl(${200+Math.random()*160},70%,60%)`
    }));

    let frame = 0;
    const TOTAL = 190;
    let animId;

    const drawSpaceship = (cx, cy, scale, engineOn) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);

      // Engine glow
      if(engineOn) {
        const eng = ctx.createRadialGradient(0, 28, 0, 0, 28, 40);
        eng.addColorStop(0, 'rgba(100,200,255,0.9)');
        eng.addColorStop(0.4, 'rgba(50,100,255,0.4)');
        eng.addColorStop(1, 'rgba(0,0,100,0)');
        ctx.fillStyle = eng;
        ctx.fillRect(-40, 20, 80, 60);
        // Engine exhaust flame
        ctx.fillStyle = 'rgba(150,220,255,0.8)';
        ctx.beginPath();
        ctx.moveTo(-12, 22); ctx.lineTo(12, 22);
        ctx.lineTo(6+Math.sin(frame*0.3)*4, 50+Math.sin(frame*0.2)*10);
        ctx.lineTo(0, 60+Math.sin(frame*0.4)*15);
        ctx.lineTo(-6-Math.sin(frame*0.3)*4, 50+Math.sin(frame*0.2)*10);
        ctx.closePath(); ctx.fill();
      }

      // Ship hull (sleek triangle body)
      const hullGrad = ctx.createLinearGradient(-25, -40, 25, 20);
      hullGrad.addColorStop(0, '#c8d8f0'); hullGrad.addColorStop(0.5, '#8090b0'); hullGrad.addColorStop(1, '#404860');
      ctx.fillStyle = hullGrad;
      ctx.beginPath();
      ctx.moveTo(0, -45);      // nose
      ctx.bezierCurveTo(18, -20, 22, 0, 20, 20);   // right
      ctx.lineTo(10, 22); ctx.lineTo(-10, 22);       // engine bottom
      ctx.lineTo(-20, 20);
      ctx.bezierCurveTo(-22, 0, -18, -20, 0, -45);
      ctx.fill();

      // Wings
      ctx.fillStyle='#5060a0';
      ctx.beginPath(); ctx.moveTo(20,5); ctx.lineTo(48,18); ctx.lineTo(40,22); ctx.lineTo(14,15); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-20,5); ctx.lineTo(-48,18); ctx.lineTo(-40,22); ctx.lineTo(-14,15); ctx.closePath(); ctx.fill();
      // Wing highlight
      ctx.fillStyle='rgba(255,255,255,.2)';
      ctx.beginPath(); ctx.moveTo(20,5); ctx.lineTo(48,18); ctx.lineTo(44,16); ctx.lineTo(20,7); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-20,5); ctx.lineTo(-48,18); ctx.lineTo(-44,16); ctx.lineTo(-20,7); ctx.closePath(); ctx.fill();

      // Cockpit dome
      const cockGrad = ctx.createRadialGradient(-5,-25,2,-2,-22,18);
      cockGrad.addColorStop(0,'rgba(200,240,255,0.95)'); cockGrad.addColorStop(0.5,'rgba(100,180,255,0.7)'); cockGrad.addColorStop(1,'rgba(20,60,120,0.4)');
      ctx.fillStyle=cockGrad;
      ctx.beginPath(); ctx.ellipse(0,-22,13,18,0,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='rgba(150,200,255,0.8)'; ctx.lineWidth=1.5; ctx.stroke();

      // Lights
      ctx.fillStyle=`rgba(0,255,200,${0.5+Math.sin(frame*0.15)*0.5})`;
      ctx.beginPath(); ctx.arc(-20,15,3,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=`rgba(255,100,0,${0.5+Math.sin(frame*0.15+Math.PI)*0.5})`;
      ctx.beginPath(); ctx.arc(20,15,3,0,Math.PI*2); ctx.fill();

      // Hull highlight
      ctx.strokeStyle='rgba(255,255,255,.25)'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(-8,-42); ctx.bezierCurveTo(-3,-40,3,-40,8,-42); ctx.stroke();

      ctx.restore();
    };

    const loop = () => {
      const t = frame / TOTAL;
      ctx.clearRect(0, 0, W, H);

      // Deep space background
      const bg = ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H));
      bg.addColorStop(0, t > 0.6 ? `rgba(10,0,40,1)` : '#000008');
      bg.addColorStop(1, '#000000');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      // Nebula clouds (fade in middle phase)
      if(frame > 30 && frame < 150) {
        const nAlpha = Math.min(1,(frame-30)/30) * Math.min(1,(150-frame)/30) * 0.25;
        nebulae.forEach(n => {
          const ng = ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,n.r*(0.5+t*1.5));
          ng.addColorStop(0,n.color.replace(')',`,${nAlpha})`).replace('hsl','hsla'));
          ng.addColorStop(1,'rgba(0,0,0,0)');
          ctx.fillStyle=ng; ctx.fillRect(0,0,W,H);
        });
      }

      // Stars flying outward from center
      const speedMult = Math.min(5, 0.3 + t*6);
      stars.forEach(s => {
        s.dist += s.speed * speedMult;
        if(s.dist > Math.max(W,H)) s.dist = Math.random()*20;

        const sx = W/2 + Math.cos(s.angle)*s.dist;
        const sy = H/2 + Math.sin(s.angle)*s.dist;
        const prevDist = s.dist - s.speed * speedMult * 3;
        const px = W/2 + Math.cos(s.angle)*Math.max(0,prevDist);
        const py = H/2 + Math.sin(s.angle)*Math.max(0,prevDist);

        const brightness = Math.min(1, s.dist/(Math.max(W,H)*0.3));
        ctx.globalAlpha = brightness * 0.9;
        ctx.strokeStyle = s.color;
        ctx.lineWidth = s.size * (0.5 + speedMult*0.3);
        ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(sx,sy); ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = s.color;
        ctx.beginPath(); ctx.arc(sx,sy,s.size*0.4,0,Math.PI*2); ctx.fill();
      });

      // Spaceship: starts small, flies toward viewer, then away
      const shipScale = frame < 80
        ? 0.4 + (frame/80)*0.8          // zoom in
        : 1.2 - ((frame-80)/110)*0.9;   // zoom out into distance
      const shipY = H/2 + Math.sin(frame*0.04)*20;
      const engineOn = frame > 20;
      if(shipScale > 0.05) drawSpaceship(W/2, shipY, shipScale, engineOn);

      // Text
      const phase = frame < 50 ? {t:typeof window.t!=='undefined'?window.t('teleport.phase1'):'🚀 Teleportation startet!', c:'#29B6F6'}
                  : frame < 100 ? {t:typeof window.t!=='undefined'?window.t('teleport.phase2'):'⭐ Durchs Universum...', c:'#FFD700'}
                  : frame < 150 ? {t:typeof window.t!=='undefined'?window.t('teleport.phase3'):'🌌 Fast da!', c:'#E91E8C'}
                  : {t:typeof window.t!=='undefined'?window.t('teleport.phase4'):'🦁 Willkommen im Zoo!', c:'#27AE60'};
      const fade = Math.min(1, (frame%50)/10);
      txt.innerHTML = `
        <div style="font-size:2rem;color:${phase.c};font-weight:900;
          text-shadow:0 0 20px ${phase.c};opacity:${fade};margin-bottom:8px">
          ${phase.t}
        </div>
        <div style="font-size:1.1rem;color:rgba(255,255,255,.7);opacity:${fade}">
          ${charEmoji} ${playerName} · 🌀 ${typeof mtLeft==='number'?mtLeft.toFixed(1):mtLeft} MT
        </div>`;

      frame++;
      if(frame >= TOTAL) { cancelAnimationFrame(animId); ov.remove(); window.location.href='zoo.html?autostart=1'; return; }
      animId = requestAnimationFrame(loop);
    };
    loop();
  },

  _teleportMusicCtx: null,
  _teleportMusicNodes: [],
  _playTeleportMusic(){
    try{
      const ctx=new(window.AudioContext||window.webkitAudioContext)();
      if(ctx.state==='suspended')ctx.resume();
      this._teleportMusicCtx=ctx;
      // Same cinematic melody as intro
      const melody=[
        [196,.6],[220,.6],[247,.4],[262,.8],
        [294,.6],[330,.6],[349,.4],[392,.8],
        [440,.6],[392,.4],[349,.4],[330,.8],
        [294,.6],[262,.4],[247,.4],[220,1.2],
      ];
      // Low drone
      const drone=ctx.createOscillator();const dg=ctx.createGain();
      drone.type='sawtooth';drone.frequency.setValueAtTime(55,ctx.currentTime);
      dg.gain.setValueAtTime(0,ctx.currentTime);dg.gain.linearRampToValueAtTime(0.04,ctx.currentTime+2);
      drone.connect(dg);dg.connect(ctx.destination);drone.start();
      // Melody
      let t=ctx.currentTime+.5;
      melody.forEach(([f,d])=>{
        const o=ctx.createOscillator();const g=ctx.createGain();
        o.type='triangle';o.frequency.setValueAtTime(f,t);
        g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.2,t+.04);
        g.gain.exponentialRampToValueAtTime(0.001,t+d*.9);
        o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+d);
        // Bass octave
        const o2=ctx.createOscillator();const g2=ctx.createGain();
        o2.type='sine';o2.frequency.setValueAtTime(f/2,t);
        g2.gain.setValueAtTime(0,t);g2.gain.linearRampToValueAtTime(.07,t+.04);
        g2.gain.exponentialRampToValueAtTime(0.001,t+d*.9);
        o2.connect(g2);g2.connect(ctx.destination);o2.start(t);o2.stop(t+d);
        t+=d;
      });
    }catch(e){}
  },


  showQR() {
    const url = window.location.origin + window.location.pathname;
    // Generate QR using free API
    const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' + encodeURIComponent(url);
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)';
    modal.onclick = () => modal.remove();
    modal.innerHTML = `
      <div style="background:white;border-radius:20px;padding:24px;text-align:center;max-width:280px;box-shadow:0 8px 32px rgba(0,0,0,.3)" onclick="event.stopPropagation()">
        <div style="font-family:Arial,sans-serif;color:#2980B9;font-size:1.1rem;margin-bottom:10px">📱 Neuer Spieler beitreten</div>
        <img src="${qrUrl}" style="width:200px;height:200px;border-radius:8px;display:block;margin:0 auto" alt="QR Code"/>
        <div style="font-size:0.95rem;color:#666;margin-top:10px;word-break:break-all">${url}</div>
        <button onclick="navigator.clipboard?.writeText('${url}').then(()=>this.textContent='✅ Kopiert!').catch(()=>{})" style="margin-top:10px;background:#2980B9;color:white;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:.85rem">📋 Link kopieren</button>
        <br><button onclick="this.closest('[style*=fixed]').remove()" style="margin-top:8px;background:none;border:none;color:#888;cursor:pointer;font-size:1rem">Schliessen</button>
      </div>`;
    document.body.appendChild(modal);
  },

  showCharSelect() {
    this.selectedChar = null; this.selectedColor = null;
    this._html(`
      <div class="mountain-bg"><div class="sky-gradient"></div><div class="cloud cloud-1"></div>${mountainSVG()}</div>
      <div class="page">
        <div class="card" style="max-width:560px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
            <button onclick="App.showWelcome()" style="background:none;border:none;font-size:1.3rem;cursor:pointer">◀</button>
            <div class="card-title" style="margin-bottom:0">Wähle deinen Charakter</div>
          </div>
          <div class="card-subtitle">Wer geht in die Ferien? ✈️</div>
          <div class="char-grid">
            ${CHARACTERS.map(ch => `
              <div class="char-card" id="char-${ch.id}" onclick="App.selectChar('${ch.id}')">
                <span class="char-img">${ch.emoji}</span>
                <span class="char-name">${ch.name}</span>
              </div>`).join('')}
          </div>
          <div id="color-section" style="display:none;margin:10px 0;text-align:center">
            <div style="font-size:1rem;font-weight:700;color:var(--text-mid);margin-bottom:7px">🎨 Farbe:</div>
            <div class="color-picker">
              ${STICKMAN_COLORS.map(c => `
                <div class="color-dot" id="cdot-${c.color.replace('#','')}" style="background:${c.color}" title="${c.name}"
                  onclick="App.selectColor('${c.color}')"></div>`).join('')}
            </div>
          </div>
          <button id="char-next-btn" class="btn btn-primary btn-full" style="margin-top:14px;display:none" onclick="App.showProfile()">Weiter ➜</button>
        </div>
      </div>`);
  },

  selectChar(id) {
    this.selectedChar = id;
    document.querySelectorAll('.char-card').forEach(el => el.classList.remove('selected'));
    document.getElementById(`char-${id}`)?.classList.add('selected');
    const ch = CHARACTERS.find(c => c.id === id);
    const cs = document.getElementById('color-section');
    if (ch?.hasColors) { cs.style.display='block'; document.getElementById('char-next-btn').style.display='none'; }
    else { cs.style.display='none'; this.selectedColor=null; document.getElementById('char-next-btn').style.display='flex'; }
  },

  selectColor(color) {
    this.selectedColor = color;
    document.querySelectorAll('.color-dot').forEach(el => el.classList.remove('selected'));
    document.getElementById(`cdot-${color.replace('#','')}`)?.classList.add('selected');
    document.getElementById('char-next-btn').style.display = 'flex';
  },

  // ---- PROFILE ----
  showProfile() {
    if (!this.selectedChar) { showAlert('Bitte Charakter wählen!'); return; }
    const ch = CHARACTERS.find(c => c.id === this.selectedChar);
    const yr = new Date().getFullYear();
    // Years from current-5 down to 1940
    const years = Array.from({length: yr - 1940 - 4}, (_, i) => yr - 5 - i);

    this._html(`
      <div class="mountain-bg"><div class="sky-gradient"></div><div class="cloud cloud-1"></div>${mountainSVG()}</div>
      <div class="page">
        <div class="card">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
            <button onclick="App.showCharSelect()" style="background:none;border:none;font-size:1.3rem;cursor:pointer">◀</button>
            <div class="card-title" style="margin-bottom:0">Dein Profil</div>
          </div>
          <div style="text-align:center;font-size:3rem;margin:8px 0">${ch.emoji}</div>
          <div class="input-group"><label>Dein Name</label>
            <input type="text" id="p-name" placeholder="z.B. Mischa" maxlength="20" autocomplete="off"/></div>
          <div class="input-group"><label>Passwort</label>
            <input type="password" id="p-pw" placeholder="Geheimwort" maxlength="20"/></div>
          <div class="input-group"><label>Geburtsjahr</label>
            <select id="p-year">
              <option value="">-- wählen --</option>
              ${years.map(y=>`<option value="${y}">${y}</option>`).join('')}
            </select></div>
          <div id="p-err" style="color:#E74C3C;font-size:0.88rem;text-align:center;display:none;margin-bottom:8px"></div>
          <button class="btn btn-primary btn-full btn-big" onclick="App.createProfile()">Los geht's! 🚀</button>
        </div>
      </div>`);
  },

  async createProfile() {
    const name = document.getElementById('p-name')?.value.trim();
    const pw   = document.getElementById('p-pw')?.value.trim();
    const year = document.getElementById('p-year')?.value;
    const err  = t => { const e=document.getElementById('p-err'); if(e){e.textContent=t;e.style.display='block';} };
    if (!name||name.length<2) return err('Name mindestens 2 Zeichen!');
    if (!pw) return err('Bitte Passwort eingeben!');
    if (!year) return err('Bitte Geburtsjahr wählen!');
    this._loading('Registrierung...');
    let player;
    try {
      player = await Promise.race([
        State.createPlayer({ name, password:pw, birthYear:year, character:this.selectedChar, characterColor:this.selectedColor }),
        new Promise((_,rej) => setTimeout(() => rej(new Error('Verbindungsfehler')), 8000))
      ]);
    } catch(e) {
      const errEl = document.getElementById('p-err');
      if(errEl){errEl.textContent='❌ '+e.message+' — Seite neu laden';errEl.style.display='block';}
      this.showProfile(); return;
    }
    if (!player) { this.showProfile(); setTimeout(()=>{ const e=document.getElementById('p-err'); if(e){e.textContent=`Name "${name}" bereits vergeben!`;e.style.display='block';}},50); return; }
    State.setCurrentPlayer(player);
    FontScale.applyForPlayer(player?.name||'');
    try{ if(typeof PlayTime!=='undefined'&&player?.name){ PlayTime.recordLogin('ds',player.name); PlayTime.startTracking('ds',player.name); } }catch(e){}
    this.showWorldMap();
    // One-time language bonus popup (only right after registration)
    if (player.langBonusGranted) {
      const langKey = player.langBonusGranted; // 'en' or 'fr'
      const langName = (typeof t!=='undefined') ? t('lang.name.'+langKey) : ({en:'Englisch',fr:'Französisch'}[langKey]||langKey);
      setTimeout(() => App._showLangBonusPopup(player.langBonusMT||1, langName), 600);
      // Clear the flag so it never shows again for this player
      player.langBonusGranted = null;
      State.savePlayer && State.savePlayer(player);
    }
  },

  _showLangBonusPopup(amount, langName) {
    const T = (k,fb) => (typeof t!=='undefined' ? t(k) : fb);
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:99995;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;padding:24px;font-family:Arial,sans-serif;overflow-y:auto';
    ov.onclick = (e) => { if(e.target===ov) ov.remove(); };
    const card = document.createElement('div');
    card.style.cssText = 'background:linear-gradient(135deg,#1a4a1a,#134d13);border:2px solid #FFD700;border-radius:20px;padding:26px 22px;max-width:340px;width:100%;text-align:center;box-shadow:0 0 40px rgba(255,215,0,.3);margin:auto';
    card.innerHTML = `
      <div style="font-size:2.4rem;margin-bottom:8px">🎉</div>
      <div style="color:#FFD700;font-weight:900;font-size:1.1rem;margin-bottom:10px">${T('langbonus.title','Sprach-Bonus erhalten!')}</div>
      <div style="color:#fff;font-size:.92rem;line-height:1.5;margin-bottom:18px">
        ${T('langbonus.body','Weil du {lang} gewählt hast, bekommst du einmalig').replace('{lang}','<b>'+langName+'</b>')}<br>
        <span style="color:#FFD700;font-weight:900;font-size:1.2rem">+${amount} 🌀 MT</span><br>
        ${T('langbonus.gift','geschenkt!')}
      </div>
      <button style="background:linear-gradient(135deg,#FFD700,#FF8C00);color:#1a1a2e;border:none;padding:12px 32px;border-radius:12px;font-weight:900;font-size:.95rem;cursor:pointer">${T('langbonus.btn','Super, danke!')}</button>
    `;
    card.querySelector('button').onclick = () => ov.remove();
    ov.appendChild(card);
    document.body.appendChild(ov);
  },

  // ---- LOGIN ----
  showLogin() {
    this._html(`
      <div class="mountain-bg" id="login-bg">
        <!-- Black/starfield background matching the Prolog/Intro, same as Welcome -->
        <div style="position:absolute;inset:0;background:#000"></div>
        <canvas id="login-stars" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none"></canvas>
      </div>
      <div class="page">
        <div class="card">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
            <button onclick="App.showWelcome()" style="background:none;border:none;font-size:1.3rem;cursor:pointer">◀</button>
            <div class="card-title" style="margin-bottom:0">${typeof t!=='undefined'?t('login.title'):'Anmelden 🔑'}</div>
          </div>
          <div class="card-subtitle">${typeof t!=='undefined'?t('login.welcome_back'):'Willkommen zurück!'}</div>
          <div class="input-group"><label>Name</label><input type="text" id="l-name" autocomplete="off"/></div>
          <div class="input-group"><label>Passwort</label>
            <input type="password" id="l-pw" onkeyup="if(event.key==='Enter')App.doLogin()"/></div>
          <div id="l-err" style="color:#E74C3C;font-size:0.88rem;text-align:center;display:none;margin-bottom:8px"></div>
          <button class="btn btn-primary btn-full btn-big" onclick="App.doLogin()">${typeof t!=='undefined'?t('login.btn'):'Anmelden ➜'}</button>
          ${window.MISCHA_TESTMODE?`<div style="text-align:center;margin-top:10px"><a href="javascript:void(0)" onclick="var p=window.location.pathname;var i=p.lastIndexOf('/test');window.location.href=window.location.origin+(i>=0?p.substring(0,i):p.replace(/\\/[^\\/]*$/,''))+'/index.html'" style="color:rgba(255,255,255,.5);font-size:.8rem;text-decoration:none">← Zurück zur normalen Welt</a></div>`:''}
        </div>
      </div>`);
    // Draw twinkling stars on the black login background (same technique as Welcome)
    setTimeout(()=>{
      const c = document.getElementById('login-stars');
      if(c){ const cx=c.getContext('2d'); c.width=c.offsetWidth||window.innerWidth; c.height=c.offsetHeight||window.innerHeight;
        for(let i=0;i<220;i++){const x=Math.random()*c.width,y=Math.random()*c.height,s=Math.random()*1.8+0.2,b=Math.random()*0.7+0.3;cx.fillStyle=`rgba(255,255,${Math.floor(200+Math.random()*55)},${b})`;cx.beginPath();cx.arc(x,y,s,0,Math.PI*2);cx.fill();}
      }
    },0);
    // On the TEST page: prefill name from the live-page redirect and auto-login with admin pw
    if (window.MISCHA_TESTMODE) {
      let tn = '';
      try { tn = sessionStorage.getItem('testmap_name') || ''; } catch(e) {}
      if (tn) {
        const ni = document.getElementById('l-name'); const pi = document.getElementById('l-pw');
        if (ni) ni.value = tn;
        if (pi) pi.value = 'mischa2026';
        try { sessionStorage.removeItem('testmap_name'); } catch(e) {}
        setTimeout(()=>this.doLogin(), 200);
      }
    }
  },

  async doLogin() {
    const name = document.getElementById('l-name')?.value.trim();
    const pw   = document.getElementById('l-pw')?.value.trim();
    // Validate BEFORE showing loading screen
    // More robust test page detection
    // On test page: empty name → go back to normal world
    if (!name && window.MISCHA_TESTMODE) {
      // Go back to normal world
      const _p=window.location.pathname, _i=_p.lastIndexOf('/test');
      window.location.href=window.location.origin+(_i>=0?_p.substring(0,_i):_p.replace(/\/[^\/]*$/,''))+'/index.html';
      return;
    }
    if (!name) {
      const e=document.getElementById('l-err'); if(e){e.textContent='Bitte Namen eingeben!';e.style.display='block';} return;
    }
    if (!pw) {
      const e=document.getElementById('l-err'); if(e){e.textContent='Bitte Passwort eingeben!';e.style.display='block';} return;
    }
    const nameLc = name.toLowerCase();
    const ADMIN_PW = 'mischa2024';
    const onTestPage = /\/test\//.test(window.location.pathname);
    // (Removed: a hidden "name + mischa2026 password on the LIVE page → jump to /test/"
    // shortcut used to live here. It caused real confusion once the site had its own
    // separate admin password system, so it's gone — logging in on the live page always
    // stays on the live page now. The ADMIN_PW/onTestPage constants above are still used
    // below, for the separate "admin password as master key while already on /test/" feature.)
    this._loading('Anmelden...');
    let res;
    // Admin password works as a master key for logging in as any named player,
    // on the live site or /test/ alike — handy when someone's own password is
    // unknown/forgotten. Uses the same password as the Zoo Admin Panel.
    if (pw === ADMIN_PW) {
      try {
        let p = await Promise.race([ State.getPlayer(name), new Promise(r=>setTimeout(()=>r(null),5000)) ]);
        if (p) {
          // Same device-id self-heal as the normal State.login() path (see
          // firebase-state.js). The master key is meant as a convenience for
          // a player who forgot their OWN password on their OWN device, so
          // treating it the same way as a normal login is the right default
          // here — without it, anyone using the master key as their everyday
          // login (which is apparently common) never gets this repair,
          // leaving their World Map/leaderboard total stuck showing only
          // part of their balance indefinitely.
          try { State._syncDeviceIdOnLogin(p); } catch(e) {}
          res = {ok:true, player:p};
        }
        else { res = {ok:false, error:'Spieler "'+name+'" nicht gefunden'}; }
      } catch(e) { res = {ok:false, error:'Verbindungsfehler'}; }
    } else {
      try {
        res = await Promise.race([
          State.login(name, pw),
          new Promise(r => setTimeout(() => r({ok:false, error:'Verbindungsfehler - bitte erneut versuchen'}), 6000))
        ]);
      } catch(e) { res = {ok:false, error:'Verbindungsfehler'}; }
    }
    if (!res.ok) {
      this.showLogin();
      setTimeout(()=>{ const e=document.getElementById('l-err'); if(e){e.textContent=res.error;e.style.display='block';}},50);
      return;
    }
    State.setCurrentPlayer(res.player);
    // Check if player is banned
    try {
      if(typeof _db !== 'undefined' && _db) {
        // IMPORTANT: timeout-protected, same reasoning as State.login() above
        // — an unprotected await here would hang the ENTIRE login at
        // "Anmelden..." forever if this one read ever failed to resolve,
        // even though the actual login itself had already succeeded.
        const banDoc = await Promise.race([
          _db.collection('banned_players').doc(res.player.name.toLowerCase()).get(),
          new Promise((_,rej)=>setTimeout(()=>rej(new Error('ban check timeout')),5000))
        ]);
        if(banDoc.exists) {
          const ban = banDoc.data();
          const now = Date.now();
          if(ban.permanent || !ban.expiresAt || ban.expiresAt > now) {
            State.currentPlayer = null;
            sessionStorage.removeItem('mischa_current');
            const until = ban.permanent ? 'permanent' : new Date(ban.expiresAt).toLocaleString('de-CH',{timeZone:'Europe/Zurich'});
            this.showLogin();
            setTimeout(()=>{
              const e=document.getElementById('l-err');
              if(e){
                e.textContent='🚫 Dein Konto ist gesperrt bis: '+until+(ban.reason?'\nGrund: '+ban.reason:'');
                e.style.display='block';
                e.style.whiteSpace='pre-line';
              }
            },50);
            return;
          }
        }
      }
    } catch(e) {} // ban check failed silently, allow login
    // Device ban check — catches someone banned by name trying to re-enter under a new one
    try {
      const devBan = await Promise.race([
        (window.checkDeviceBanned && window.checkDeviceBanned()) || Promise.resolve(null),
        new Promise((_,rej)=>setTimeout(()=>rej(new Error('device ban check timeout')),5000))
      ]);
      if(devBan) {
        State.currentPlayer = null;
        sessionStorage.removeItem('mischa_current');
        this.showLogin();
        setTimeout(()=>{
          const e=document.getElementById('l-err');
          if(e){ e.textContent='🚫 Dieses Gerät ist gesperrt.'+(devBan.reason?'\nGrund: '+devBan.reason:''); e.style.display='block'; e.style.whiteSpace='pre-line'; }
        },50);
        return;
      }
    } catch(e) {}
    FontScale.applyForPlayer(State.currentPlayer?.name||'');
    if(typeof Personality!=='undefined')Personality.init();
      if(typeof LANG!=='undefined')LANG.load();
    try{ if(typeof PlayTime!=='undefined'&&State.currentPlayer?.name){ PlayTime.recordLogin('ds',State.currentPlayer.name); PlayTime.startTracking('ds',State.currentPlayer.name); } }catch(e){}
    // Rank-change notifications used to only fire right after completing a
    // task — same fix as the Zoo side (see zoo.html init): RankNotify.check()
    // already throttles the actual popup to once per hour, so a periodic
    // call here just means a rank change gets noticed sooner instead of
    // only right after the next task.
    if(!this._rankNotifyIv){
      this._rankNotifyIv = setInterval(()=>{
        try{ if(State.currentPlayer?.name && typeof RankNotify!=='undefined') RankNotify.check(State.currentPlayer.name); }catch(e){}
      }, 8*60000);
    }
    this.showWorldMap();
  },

  // ---- WORLD MAP ----
  showWorld(id){ return this.showWorldMap(); },
  showZooCollection() {
    // Show animal collection page - what you have vs. what exists
    const player = State.currentPlayer;
    if(!player){ this.showLogin(); return; }
    
    // Load player's zoo data (from localStorage)
    const zooKey = 'zoo_'+player.name.toLowerCase();
    let zoo = null;
    try{ zoo = JSON.parse(localStorage.getItem(zooKey)||'null'); }catch(e){}
    
    // Get all animals the player has ever collected
    const owned = new Set();
    if(zoo && zoo.enc){
      zoo.enc.forEach(e => { if(e && e.animal) owned.add(e.animal.id||e.animal.n); });
    }
    // Also check history if available
    if(zoo && zoo.history){
      zoo.history.forEach(h => { if(h && h.id) owned.add(h.id); });
    }
    
    const RARITY_ORDER = ['normal','rare','epic','legendary','god','mythic','ultra','ultralegendary','secret'];
    const RARITY_COLORS = {
      normal:'#95A5A6', rare:'#3498DB', epic:'#8E44AD', legendary:'#F39C12',
      god:'#E74C3C', mythic:'#FF1493', ultra:'#00CFFF', ultralegendary:'#FFD700', secret:'#111'
    };
    const RARITY_LABELS = {
      normal:'Normal', rare:'Selten', epic:'Episch', legendary:'Legendär',
      god:'Gott', mythic:'Mythisch', ultra:'Ultra', ultralegendary:'Ultra-Legendär', secret:'SECRET'
    };
    
    const ch = this._char(player);
    
    // Group by rarity
    const byRarity = {};
    RARITY_ORDER.forEach(r => byRarity[r] = []);
    
    // Get ALL animals from zoo.html ANIMALS array (via global if available)
    const allAnimals = window.ANIMALS || [];
    allAnimals.forEach(a => {
      if(!byRarity[a.r]) byRarity[a.r] = [];
      byRarity[a.r].push(a);
    });
    
    const totalAnimals = allAnimals.length;
    const ownedCount = owned.size;
    const pct = totalAnimals > 0 ? Math.round(ownedCount/totalAnimals*100) : 0;
    
    // Build grid sections per rarity
    let gridHTML = '';
    RARITY_ORDER.forEach(r => {
      const animals = byRarity[r] || [];
      if(!animals.length) return;
      const col = RARITY_COLORS[r] || '#888';
      gridHTML += `<div style="margin-bottom:20px">
        <div style="font-size:0.95rem;font-weight:700;color:${col};margin-bottom:8px;padding:4px 10px;background:${col}22;border-radius:6px;display:inline-block">
          ${RARITY_LABELS[r]||r} (${animals.filter(a=>owned.has(a.id||a.n)).length}/${animals.length})
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(72px,1fr));gap:8px">`;
      animals.forEach(a => {
        const has = owned.has(a.id||a.n);
        gridHTML += `<div style="background:${has?col+'22':'rgba(255,255,255,.04)'};border:2px solid ${has?col:'rgba(255,255,255,.08)'};border-radius:12px;padding:8px 4px;text-align:center;transition:all .2s" title="${a.n}${has?'':' (noch nicht gefunden)'}">
          <div style="font-size:1.8rem;${has?'':'filter:grayscale(1) opacity(.25)'}">${has?a.e:'❓'}</div>
          <div style="font-size:.58rem;color:${has?'rgba(255,255,255,.7)':'rgba(255,255,255,.2)'};margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${has?a.n:'???'}</div>
          ${has?`<div style="font-size:.5rem;color:${col};font-weight:700">${RARITY_LABELS[r]||r}</div>`:''}
        </div>`;
      });
      gridHTML += '</div></div>';
    });
    
    this._html(`
      <div class="mountain-bg"><div class="sky-gradient"></div>${mountainSVG()}</div>
      <div class="page">
        <div style="display:flex;align-items:center;gap:10px;padding:10px 0;margin-bottom:10px">
          <button class="btn-back" onclick="App.showWorldMap()" style="background:rgba(255,255,255,.1);border:none;color:#fff;padding:8px 14px;border-radius:10px;cursor:pointer;font-size:.9rem">◀ Zurück</button>
          <div>
            <div style="font-size:1.1rem;font-weight:900;color:#FFD700">🦁 Tiersammlung</div>
            <div style="font-size:0.95rem;color:rgba(255,255,255,.5)">${ch} ${player.name}</div>
          </div>
        </div>
        
        <!-- Progress bar -->
        <div class="card" style="margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <div style="font-size:.85rem;font-weight:700;color:#fff">Gesammelt: ${ownedCount}/${totalAnimals}</div>
            <div style="font-size:1.1rem;font-weight:900;color:#FFD700">${pct}%</div>
          </div>
          <div style="background:rgba(255,255,255,.1);border-radius:50px;height:12px;overflow:hidden">
            <div style="height:100%;background:linear-gradient(90deg,#27AE60,#FFD700);width:${pct}%;transition:width 1s ease;border-radius:50px"></div>
          </div>
          <div style="font-size:0.9rem;color:rgba(255,255,255,.4);margin-top:6px;text-align:center">
            ${totalAnimals-ownedCount} Tiere noch nicht gefunden
          </div>
        </div>
        
        <!-- Animal grid -->
        <div class="card">
          ${allAnimals.length === 0 
            ? '<div style="text-align:center;color:rgba(255,255,255,.4);padding:30px">Zoo-Daten werden geladen...<br>Bitte erst Zoo besuchen.</div>'
            : gridHTML
          }
        </div>
      </div>
    `);
  },

  async showWorldMap() {
    this._loading('Laden...');
    const player = await State.refreshCurrentPlayer();
    // If a session got auto-restored (from sessionStorage/localStorage
    // backup — see State.getCurrentPlayer()) but the resulting player
    // object is missing basic required shape, treat it as broken rather
    // than rendering a World Map that then can't actually do anything
    // (every action needing player.name/worlds would silently fail).
    // Matches what a fresh login screen would give instead.
    if (player && (!player.name || typeof player.name !== 'string')) {
      try{ sessionStorage.removeItem('mischa_current'); localStorage.removeItem('mischa_current_backup'); State.currentPlayer=null; }catch(e){}
      this.showWelcome();
      setTimeout(() => {
        const err = document.getElementById('l-err');
        if (err) { err.textContent = '⚠️ Sitzung war ungültig — bitte neu einloggen!'; err.style.display = 'block'; }
      }, 500);
      return;
    }
    // IMPORTANT: always (re-)run the SAME setup a fresh login does — an
    // auto-restored session (page reload, or coming back from the Zoo)
    // used to skip this entirely, since setCurrentPlayer() was only ever
    // called from doLogin(). That meant session-watch (kicks you out if
    // another device logs in), the activity timeout, and the localStorage
    // backup never got (re-)established for anyone who didn't JUST type
    // their password — some buttons/actions that implicitly depend on
    // those being active could then silently do nothing, until logging
    // out and back in ran doLogin() properly. Safe to call repeatedly.
    if (player && player.name) { try{ State.setCurrentPlayer(player); }catch(e){} }
    // Contest freeze announcement — shows once per page load while frozen (14.–16.08.2026)
    if (typeof Contest!=='undefined' && Contest.phase()==='frozen' && !this._contestPopupShown) {
      this._contestPopupShown = true;
      setTimeout(()=>{ try{ Contest.showResultPopup(); }catch(e){} }, 600);
    }
    // Merge locally saved currentWorld in case Firebase was behind
    if (player) {
      const _appliedSize = FontScale.applyForPlayer(player.name);
      // Apply user personality (color + avatar)
      if(typeof Personality!=='undefined') Personality.init();
      // Check admin announcement (once per announcement)
      setTimeout(async ()=>{
        try{
          let ann=null;
          if(typeof _db!=='undefined'&&State._useCloud()){
            const doc=await _db.collection('config').doc('zoo_announcement').get().catch(()=>null);
            if(doc&&doc.exists) ann=doc.data();
          }
          if(!ann) ann=JSON.parse(localStorage.getItem('zoo_announcement')||'null');
          if(!ann||!ann.id) return;
          // Always show announcement (no seen filter)
          if(typeof _showDenkspielAnnouncement==='function') _showDenkspielAnnouncement(ann);
        }catch(e){}
      },2000);
      // Check update news (once per id)
      setTimeout(async ()=>{
        try{
          let news=null;
          if(typeof _db!=='undefined'&&State._useCloud()){
            const doc=await _db.collection('config').doc('zoo_news').get().catch(()=>null);
            if(doc&&doc.exists) news=doc.data();
          }
          if(!news) news=JSON.parse(localStorage.getItem('zoo_news')||'null');
          if(!news||!news.id) return;
          const seen=JSON.parse(localStorage.getItem('zoo_news_seen')||'[]');
          if(seen.includes(news.id)) return;
          if(typeof _showDenkspielNews==='function') _showDenkspielNews(news);
        }catch(e){}
      },2000);
      // Check for a changed contest deadline — this used to only notify
      // players inside the Zoo (via its news ticker); Welt-1 had no
      // listener for it at all, so anyone who mostly plays Welt-1 never
      // found out the Rangliste deadline had moved. Reads
      // config/contest_settings directly (written by Contest.saveConfig()
      // in firebase-state.js) rather than reusing the config/zoo_news doc
      // above, which is a separate, admin-authored "what's new" feature —
      // sharing it would mean a deadline change silently overwrites/gets
      // overwritten by an unrelated announcement.
      setTimeout(async ()=>{
        try{
          if(typeof _db==='undefined'||!State._useCloud())return;
          const doc=await _db.collection('config').doc('contest_settings').get().catch(()=>null);
          if(!doc||!doc.exists)return;
          const d=doc.data();
          if(!d.updatedAt||!d.start)return;
          const seenAt=parseInt(localStorage.getItem('mischa_deadline_seen')||'0',10);
          if(d.updatedAt<=seenAt)return;
          localStorage.setItem('mischa_deadline_seen', String(d.updatedAt));
          if(seenAt===0)return; // first time this device has ever checked — don't announce the initial value as "new"
          const startStr=new Date(d.start).toLocaleString('de-CH',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
          try{
            const el=document.createElement('div');
            el.style.cssText='position:fixed;top:16px;left:50%;transform:translate(-50%,-20px);z-index:99500;background:linear-gradient(135deg,#6c3483,#4a235a);border:2px solid #FFD700;border-radius:14px;padding:10px 18px;text-align:center;color:#fff;font-weight:700;font-size:.85rem;box-shadow:0 6px 20px rgba(0,0,0,.5);opacity:0;transition:all .4s ease;max-width:90vw';
            el.innerHTML='📅 <b>Neuer Rangliste-Stichtag:</b> '+startStr+' Uhr!';
            document.body.appendChild(el);
            requestAnimationFrame(()=>{ el.style.opacity='1'; el.style.transform='translate(-50%,0)'; });
            setTimeout(()=>{ el.style.opacity='0'; setTimeout(()=>el.remove(),500); }, 5000);
          }catch(e){}
        }catch(e){}
      },2200);
      // If test was never done on this device, remember to show hint
      if (!FontScale.testDone()) {
        window._showEyeTestHint = true;
      } else {
        window._showEyeTestHint = false;
      }
      try {
        const _ls = JSON.parse(localStorage.getItem('mischa_players')||'{}');
        const _lp = _ls[player.name];
        if (_lp && (_lp.currentWorld||1) > (player.currentWorld||1)) {
          player.currentWorld = _lp.currentWorld;
          State._local.set(player.name, player);
        }
      } catch(e) {}
    }
    if (!player) {
      // Clear bad backup if it points to non-existent player
      const backup = localStorage.getItem('mischa_current_backup');
      if (backup) {
        localStorage.removeItem('mischa_current_backup');
        sessionStorage.removeItem('mischa_current');
      }
      this.showWelcome();
      setTimeout(() => {
        const err = document.getElementById('l-err');
        if (err) { err.textContent = '⚠️ Spieler nicht gefunden — bitte neu einloggen!'; err.style.display = 'block'; }
      }, 500);
      return;
    }
    // Normalize worlds: convert array format ["1","2"...] to object format
    if (player && Array.isArray(player.worlds)) {
      player.worlds = {}; // reset to object format
    }
    if (player && !player.worlds) player.worlds = {};
    const _isRef = player.name.toLowerCase() === 'janoschtest';
    const _isAdmin = ['mischa','admin'].includes(player.name.toLowerCase());
    // Bu gets displayed with special black/gold style
    // Avatar from Personality module (if any)
    const _avatarHTML = (typeof Personality!=='undefined') ? Personality.getAvatarHTML(36) : '';
    const _avatarPrefix = _avatarHTML ? '<span style="display:inline-block;vertical-align:middle;margin-right:6px">'+_avatarHTML+'</span>' : '';
    const displayName = _avatarPrefix + (_isAdmin ? '<span style="background:#FFD700;color:#000;font-weight:900;padding:2px 8px;border-radius:6px;vertical-align:middle">Bu 🌀</span>' : '<span style="vertical-align:middle">'+player.name+'</span>');

    if (_isRef) setTimeout(() => {
      document.getElementById('ref-banner')?.remove();
      const b = document.createElement('div');
      b.id='ref-banner';
      b.style.cssText='position:fixed;top:0;left:0;right:0;z-index:9998;background:linear-gradient(135deg,#E74C3C,#C0392B);color:white;padding:8px 16px;text-align:center;font-family:Arial,sans-serif;font-size:.88rem;box-shadow:0 2px 8px rgba(0,0,0,.3)';
      b.innerHTML='🔬 KALIBRIERUNGS-MODUS — Spieler: Janoschtest · '+_deviceIcon+' '+_deviceType+' · Nicht in Rangliste <button onclick="this.parentElement.remove()" style="background:rgba(255,255,255,.2);border:none;color:white;padding:1px 7px;border-radius:4px;cursor:pointer;margin-left:8px">✕</button>';
      document.body.prepend(b);
    }, 600);
    const ch = this._char(player);
    // Check for admin messages to this player
    this._checkAdminMessages(player.name);

    // Calculate total MT — combined Denkspiel + Zoo balance (same as the
    // leaderboard), per the person's request that every screen show one
    // unified number instead of Denkspiel-only here and combined elsewhere.
    let mt = 0;
    try {
      mt = (typeof combinedMTFor === 'function') ? await combinedMTFor(player) : dsMTFor(player);
    } catch(_e) { mt = 0; }

    this._html(`
      ${window.MISCHA_TESTMODE ? `<button onclick="App._showBgDiagnostic()" style="position:fixed;bottom:16px;right:16px;z-index:99998;background:#000;color:#0f0;border:2px solid #0f0;padding:8px 12px;border-radius:8px;font-size:.7rem;font-family:monospace;cursor:pointer">🔍 BG-Diagnose</button>` : ''}
      <div class="mountain-bg" id="wm-bg">
        <!-- Pure black background, matching the Intro's aesthetic (was a
             dark-purple gradient that photographed/rendered as brownish on
             some Android screens) -->
        <div style="position:absolute;inset:0;background:#000"></div>
        <canvas id="wm-stars" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none"></canvas>
        <div style="position:absolute;top:5%;right:12%;width:46px;height:46px">
          <div style="width:46px;height:46px;border-radius:50%;background:#fffbe0;box-shadow:0 0 18px rgba(255,245,200,.5)"></div>
          <div style="position:absolute;top:5px;right:-7px;width:38px;height:38px;border-radius:50%;background:#000"></div>
        </div>
        ${mountainSVG(true)}
        <div style="position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,rgba(0,0,0,.75) 100%)"></div>
      </div>
      <div class="page" style="padding-top:16px;padding-left:4px;padding-right:4px;width:100%;max-width:100%;box-sizing:border-box;overflow-x:hidden">
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:center;width:100%;max-width:100%;margin-bottom:12px">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:2.4rem">${ch?.emoji||'🧭'}</span>
            <div>
              <div style="font-family:Arial,sans-serif;font-size:1.3rem;color:white;text-shadow:0 2px 4px rgba(0,0,0,0.3)">
                ${displayName}
                ${(()=>{ const _age=State.getAge(player); return (_age>4&&_age<130)?`<span style="font-size:0.85rem;color:rgba(255,255,255,.45);font-weight:400;margin-left:4px">${_age}J</span>`:''; })()}
              </div>
              <div style="background:rgba(255,215,0,.3);border:1px solid #FFD700;color:#FFD700;font-weight:900;font-size:1rem;padding:4px 12px;border-radius:20px">🌀 ${formatMT(mt)} MT</div>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;max-width:100%">
            <div style="display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end;max-width:100%">
              <button onclick="App.showGlobalLeaderboard()" style="background:rgba(255,255,255,0.25);border:1.5px solid rgba(255,255,255,.6);color:white;padding:7px 13px;border-radius:50px;font-weight:700;cursor:pointer;font-size:.82rem;white-space:nowrap;line-height:1.2">🌍 Rangliste</button>
              ${_isAdmin ? `<button onclick="App.showAdminReports()" style="background:rgba(231,76,60,0.3);border:1.5px solid #E74C3C;color:#E74C3C;padding:7px 13px;border-radius:50px;font-weight:700;cursor:pointer;font-size:.82rem;white-space:nowrap;line-height:1.2">⚑ Meldungen</button>` : ''}
              ${['mischa','admin'].includes(player.name.toLowerCase()) ? `<button onclick="window.location.href='zoo.html?autostart=1&openadmin=1'" style="background:rgba(255,215,0,0.25);border:1.5px solid #FFD700;color:#FFD700;padding:7px 13px;border-radius:50px;font-weight:700;cursor:pointer;font-size:.82rem;white-space:nowrap;line-height:1.2" title="Springt direkt ins Zoo-Adminpanel">🔧 Zoo-Admin</button>` : ''}
            </div>
            <div style="display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end;max-width:100%">
              <button onclick="App.showLanguagePicker()" style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,.35);color:rgba(255,255,255,.85);padding:5px 11px;border-radius:50px;font-weight:600;cursor:pointer;font-size:.74rem;white-space:nowrap;line-height:1.2" title="Sprache wählen">${typeof LANG!=='undefined'?LANG.flag():'🇩🇪'} <span style="font-size:.85em">▾</span></button>
              <button onclick="App.showEyeTest()" style="background:rgba(100,200,255,0.15);border:1px solid rgba(100,200,255,.45);color:rgba(180,240,255,1);padding:5px 11px;border-radius:50px;font-weight:600;cursor:pointer;font-size:.74rem;white-space:nowrap;line-height:1.2" title="Schriftgrösse anpassen">${typeof t!=='undefined'?t('worldmap.font'):'🔤 Schrift'}</button>
              <button onclick="location.reload()" style="background:rgba(52,200,120,0.15);border:1px solid rgba(52,200,120,.45);color:rgba(100,255,180,1);padding:5px 11px;border-radius:50px;font-weight:600;cursor:pointer;font-size:.74rem;white-space:nowrap;line-height:1.2" title="Seite neu laden">${typeof t!=='undefined'?t('worldmap.update'):'🔄 Update'}</button>
              <button onclick="App.showAbout()" style="background:rgba(255,215,0,0.12);border:1px solid rgba(255,215,0,.4);color:#FFD700;padding:5px 11px;border-radius:50px;font-weight:600;cursor:pointer;font-size:.74rem;white-space:nowrap;line-height:1.2" title="Über dieses Spiel">${typeof t!=='undefined'?t('wm.about'):'ℹ️ Über'}</button>
              <button onclick="App._logout()" style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,.35);color:rgba(255,255,255,.85);padding:5px 11px;border-radius:50px;font-weight:600;cursor:pointer;font-size:.74rem;white-space:nowrap;line-height:1.2">${typeof t!=='undefined'?t('worldmap.logout'):'Abmelden'}</button>
            </div>
          </div>
        </div>

        <!-- MT Counter prominent -->
        <div style="text-align:center;margin-bottom:10px">
          <div style="background:rgba(255,215,0,.2);border:2px solid #FFD700;border-radius:50px;padding:8px 20px;display:inline-block">
            <span style="font-size:1.4rem;font-weight:900;color:#FFD700">🌀 ${formatMT(mt)} MT</span>
            <span style="font-size:0.95rem;color:rgba(255,255,255,.7);margin-left:8px">${typeof t!=='undefined'?t('wm.mt_full'):'Mischa Taler'}</span>
          </div>
        </div>

        <!-- Belohnungen/Truhen wurden entfernt: gehören nur zu Welt 2 (Zoo), nicht zur Weltkarte -->
        <div style="margin-bottom:12px">
          <button onclick="App.showPersonality()" style="width:100%;background:linear-gradient(135deg,#FF6FB5,#9B59B6);color:#fff;border:none;padding:13px 20px;border-radius:16px;font-family:Arial,sans-serif;font-size:1.1rem;font-weight:900;cursor:pointer;box-shadow:0 4px 15px rgba(155,89,182,.4)">
            ${typeof t!=='undefined'?t('worldmap.personality'):'🎨 Persönlichkeit (Farbe + Avatar)'}
          </button>
        </div>

        <!-- Teleport Button -->
        ${mt>=15 ? `
        <div style="margin-bottom:12px">
          <button onclick="App.teleportToZoo()" style="width:100%;max-width:100%;background:linear-gradient(135deg,#27AE60,#1E8449);color:white;border:none;padding:14px 20px;border-radius:16px;font-family:Arial,sans-serif;font-size:1.1rem;cursor:pointer;box-shadow:0 4px 15px rgba(39,174,96,.4);animation:bounce 1s infinite">
            ${typeof t!=='undefined'?t('wm.teleport_btn'):'🚀 In den Zoo teleportieren! (15 🌀 MT)'}
          </button>
        </div>` : `
        <div style="margin-bottom:12px;background:rgba(39,174,96,.1);border:2px dashed rgba(39,174,96,.5);border-radius:14px;padding:12px;text-align:center;max-width:100%;width:100%">
          <div style="font-size:.9rem;color:rgba(255,255,255,.9);font-weight:700">${typeof t!=='undefined'?t('wm.zoo_unlock_title'):'🦁 Zoo freischalten'}</div>
          <div style="font-size:1rem;color:rgba(255,255,255,.6);margin-top:4px">${(typeof t!=='undefined'?t('wm.zoo_unlock_body'):'Noch {n} 🌀 MT bis zur Teleportation').replace('{n}',Math.max(0,(15-mt)).toFixed(1))}</div>
          <div style="background:rgba(255,255,255,.15);border-radius:6px;height:8px;margin-top:8px;max-width:200px;margin-left:auto;margin-right:auto">
            <div style="background:#27AE60;height:8px;border-radius:6px;width:${Math.min(100,mt/15*100)}%"></div>
          </div>
        </div>`}

        <div style="font-family:Arial,sans-serif;font-size:1.35rem;color:white;text-align:center;margin-bottom:10px">${typeof t!=='undefined'?t('wm.your_games'):'🎮 Deine 20 Spiele'}</div>

        <div class="world-map">
          ${WORLDS.map(world => {
            const ws = player.worlds?.[world.id] || player.worlds?.[String(world.id)] || { tasks:Array(20).fill(null), jokerUsed:false, completed:false };
            const done = ws.tasks.filter(t=>t&&t.done).length;
            const unlocked = world.id <= (player.currentWorld||1);
            const completed = ws.completed;
            let cls = unlocked ? 'unlocked' : 'locked';
            if (completed) cls = 'completed';
            return `
              <div class="world-item ${cls}" onclick="${unlocked?`App.showWorld(${world.id})`:'void(0)'}">
                <span class="world-icon">${world.icon}</span>
                <div class="world-info">
                  <div class="world-name" style="font-size:1.2rem;font-weight:900;color:#1a3a6e">${world.name}${world.subtitle?` <span style="font-size:0.92rem;font-weight:500;color:#555">· ${world.subtitle}</span>`:''}</div>
                  <div class="world-desc" style="font-size:1rem;font-weight:500">${world.difficulty}</div>
                  <div class="world-progress" style="font-size:0.97rem;font-weight:600">${done}/${ws.tasks.length} ${typeof t!=='undefined'?t('wm.games_done'):'Spiele ✓'} · 🌀 ${formatMT(world.id===1 ? mt : (ws.tasks||[]).reduce((s,t)=>s+(t&&(!isNaN(t.mt)&&isFinite(t.mt)?t.mt:0)||0),0))} MT</div>
                </div>
                <span style="font-size:1.3rem">${completed?'🏆':unlocked?'▶':'🔒'}</span>
              </div>`;
          }).join('')}
        </div>

        <!-- Floating gift button -->
        <div style="position:fixed;bottom:24px;right:20px;z-index:50">
          <button onclick="Shop.openGiftSelector()" style="width:54px;height:54px;border-radius:50%;
            background:linear-gradient(135deg,#FF69B4,#E91E8C);border:none;cursor:pointer;
            font-size:1.5rem;box-shadow:0 6px 20px rgba(233,30,140,0.4);
            display:flex;align-items:center;justify-content:center">
            🎁
          </button>
        </div>
      </div>`);
    // Start reward-chest badge timer
    if(typeof RewardChests!=='undefined'){ RewardChests.startBadgeTimer(); }
  },

  goToAdmin() {
    // admin.html was retired — everything moved into the Zoo's own admin panel.
    window.location.href = 'zoo.html?autostart=1&openadmin=1';
  },
  showPersonality(){
    if(typeof Personality==='undefined'){ showAlert('❌ Persönlichkeits-Modul nicht geladen! Bitte Seite neu laden.'); return; }
    try{ Personality.show(); }
    catch(e){ showAlert('❌ Fehler beim Öffnen: '+e.message); console.error(e); }
  },
  _logout() {
    State.logout();
    this.showWelcome();
  },

  // ══ SEHTEST — Augen-Test für optimale Schriftgrösse ══
  showLanguagePicker() {
    const ov = document.createElement('div');
    ov.id = 'lang-picker-overlay';
    ov.style.cssText = 'position:fixed;inset:0;z-index:99990;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;padding:24px;font-family:Arial,sans-serif;overflow-y:auto';
    ov.onclick = (e) => { if(e.target===ov) ov.remove(); };
    const card = document.createElement('div');
    card.style.cssText = 'background:linear-gradient(135deg,#1a1a2e,#16213e);border:2px solid rgba(255,255,255,.15);border-radius:20px;padding:24px;max-width:340px;width:100%;text-align:center;margin:auto';
    const title = document.createElement('div');
    title.style.cssText = 'color:#fff;font-weight:900;font-size:1.15rem;margin-bottom:16px';
    title.textContent = '🌐 Sprache / Language / Langue';
    card.appendChild(title);
    const sel = document.createElement('div');
    sel.innerHTML = typeof LANG!=='undefined' ? LANG.selectorHTML(false) : '';
    card.appendChild(sel);
    const closeBtn = document.createElement('button');
    closeBtn.textContent = typeof t!=='undefined'?t('worldmap.close'):'Schliessen';
    closeBtn.style.cssText = 'margin-top:18px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);color:#fff;padding:10px 24px;border-radius:10px;cursor:pointer;font-size:.9rem';
    closeBtn.onclick = () => ov.remove();
    card.appendChild(closeBtn);
    ov.appendChild(card);
    document.body.appendChild(ov);
  },

  showAbout() {
    const ov = document.createElement('div');
    ov.id = 'about-overlay';
    ov.style.cssText = 'position:fixed;inset:0;z-index:99990;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;padding:24px;font-family:Arial,sans-serif;overflow-y:auto';
    ov.onclick = (e) => { if(e.target===ov) ov.remove(); };
    const card = document.createElement('div');
    card.style.cssText = 'background:linear-gradient(135deg,#1a1a2e,#16213e);border:2px solid rgba(255,215,0,.25);border-radius:20px;padding:26px;max-width:400px;width:100%;text-align:center;margin:auto';
    const title = document.createElement('div');
    title.style.cssText = 'color:#FFD700;font-weight:900;font-size:1.2rem;margin-bottom:14px';
    title.textContent = typeof t!=='undefined'?t('wm.about_title'):'ℹ️ Über dieses Spiel';
    card.appendChild(title);
    const body = document.createElement('div');
    body.style.cssText = 'color:rgba(255,255,255,.85);font-size:.9rem;line-height:1.6;text-align:left';
    body.textContent = typeof t!=='undefined'?t('wm.about_text'):'Dieses Spiel wurde von Janosch, Mischa und Andi seit dem 15. April 2026 erstellt.';
    card.appendChild(body);
    const closeBtn = document.createElement('button');
    closeBtn.textContent = typeof t!=='undefined'?t('worldmap.close'):'Schliessen';
    closeBtn.style.cssText = 'margin-top:20px;background:linear-gradient(135deg,#FFD700,#F39C12);border:none;color:#1a1a2e;padding:10px 28px;border-radius:10px;cursor:pointer;font-size:.9rem;font-weight:900';
    closeBtn.onclick = () => ov.remove();
    card.appendChild(closeBtn);
    ov.appendChild(card);
    document.body.appendChild(ov);
  },

  showEyeTest() {
    const player = State.currentPlayer;
    const playerName = player?.name || '';
    const current = FontScale.load();
    this._sliderPreviewSize = current;

    const SAMPLE_TEXT = 'Mischa Denkspiel — 14/20 Spiele · 🌀 11.5 MT · Tippe auf die nächste Aufgabe';

    this._html(`
      <div style="min-height:100vh;background:linear-gradient(135deg,#0d1b2a,#1a2a3a);
           display:flex;flex-direction:column;align-items:center;justify-content:center;
           padding:20px;box-sizing:border-box;font-family:'Segoe UI',system-ui,sans-serif">

        <div style="text-align:center;margin-bottom:20px">
          <div style="font-size:3rem;margin-bottom:8px">🔤</div>
          <h2 style="color:#fff;font-size:1.4rem;font-weight:900;margin:0 0 6px">Schriftgrösse einstellen</h2>
          <p style="color:rgba(255,255,255,.55);font-size:.88rem;margin:0;max-width:320px;line-height:1.4">
            Schieb den Regler, bis es für dich passt — <b style="color:#4af">so klein wie möglich, so gross wie nötig.</b>
          </p>
        </div>

        <!-- Live preview -->
        <div style="width:100%;max-width:440px;background:rgba(255,255,255,.06);
             border:1.5px solid rgba(255,255,255,.12);border-radius:20px;
             padding:28px 24px;margin-bottom:20px;text-align:center">
          <div style="color:rgba(255,255,255,.35);font-size:.72rem;
               font-weight:700;text-transform:uppercase;letter-spacing:.1em;margin-bottom:14px">
            Vorschau
          </div>
          <div id="font-slider-preview" style="color:#fff;font-size:${current}px;line-height:1.55;font-weight:500;transition:font-size .05s">
            ${SAMPLE_TEXT}
          </div>
          <div id="font-slider-px" style="margin-top:14px;color:rgba(255,255,255,.4);font-size:.75rem;font-weight:700">
            ${current}px
          </div>
        </div>

        <!-- Slider -->
        <div style="width:100%;max-width:400px;margin-bottom:24px">
          <div style="display:flex;justify-content:space-between;color:rgba(255,255,255,.3);font-size:.68rem;margin-bottom:4px">
            <span>A klein</span><span>A gross</span>
          </div>
          <input id="font-slider" type="range" min="${FontScale.MIN}" max="${FontScale.MAX}" value="${current}" step="1"
            style="width:100%;height:8px;-webkit-appearance:none;appearance:none;background:linear-gradient(90deg,#4af,#27AE60);border-radius:20px;outline:none;cursor:pointer"
            oninput="App._onFontSliderInput(this.value)">
        </div>

        <div style="display:flex;flex-direction:column;gap:10px;width:100%;max-width:400px">
          <button onclick="App._saveFontSlider()"
            style="background:linear-gradient(135deg,#27AE60,#1E8449);color:#fff;border:none;
                   padding:16px;border-radius:14px;font-size:1.05rem;font-weight:900;
                   cursor:pointer;min-height:52px;box-shadow:0 4px 16px rgba(39,174,96,.4)">
            ✅ So ist es gut!
          </button>
          <button onclick="App.showWorldMap()"
            style="background:none;color:rgba(255,255,255,.3);border:none;
                   padding:10px;font-size:.82rem;cursor:pointer;margin-top:4px">
            Abbrechen
          </button>
        </div>
        <p style="color:rgba(255,255,255,.25);font-size:.7rem;margin-top:16px">
          Gerät: ${screen.width}x${screen.height} · Spieler: ${playerName}
        </p>
      </div>`);
  },

  // Live preview as the slider is dragged — doesn't save/apply anywhere
  // else until confirmed, so trying out sizes has no side effects.
  _onFontSliderInput(value) {
    const size = FontScale.clamp(value);
    this._sliderPreviewSize = size;
    const preview = document.getElementById('font-slider-preview');
    const pxLabel = document.getElementById('font-slider-px');
    if (preview) preview.style.fontSize = size + 'px';
    if (pxLabel) pxLabel.textContent = size + 'px';
  },

  _saveFontSlider() {
    const player = State.currentPlayer;
    const playerName = player?.name || '';
    const size = FontScale.clamp(this._sliderPreviewSize);
    FontScale.save(playerName, size);
    FontScale.markTested();
    FontScale.apply(size);
    this.showWorldMap();
  },

  // ---- GLOBAL LEADERBOARD ----
  async showGlobalLeaderboard() {
    this._loading('Rangliste laden...');
    const contestPhase = (typeof Contest!=='undefined') ? Contest.phase() : 'ended';
    const player = State.currentPlayer;
    let players, myMT;

    if (contestPhase === 'frozen') {
      // Use the shared frozen snapshot instead of a live computation
      players = await Contest.getFrozenStandings();
      const me = players.find(p => p.name?.toLowerCase() === player?.name?.toLowerCase());
      myMT = me ? me._mt : 0;
    } else {
      // Load from both Firebase AND local, merge with local priority
      const localAll = State._local.getAll() || {};
      let firebaseAll = {};
      let firebaseFetchOk = false;
      try {
        const fb = await Promise.race([State.getAll(), new Promise(r=>setTimeout(()=>r(null),3000))]);
        if (fb) { firebaseAll = fb; firebaseFetchOk = true; }
      } catch(e) {}
      // Zoo economy state per player — combined into the ranking alongside Welt-1 MT
      let zoosAll = {};
      try {
        zoosAll = await Promise.race([State.getAllZoos(), new Promise(r=>setTimeout(()=>r({}),3000))]);
      } catch(e) {}

      // Merge: only ever prefer the LOCAL cache for the CURRENTLY LOGGED-IN
      // player's own entry — never for anyone else. See the matching
      // comment in Contest._computeStandings() (firebase-state.js) for the
      // full story: savePlayer() always writes local first for whichever
      // player object it's given, including admin actions run against
      // OTHER accounts from this device — that leaves a frozen, falsely
      // "fresh-looking" snapshot of someone else's data sitting in this
      // browser's shared local cache indefinitely, silently overriding
      // correct live cloud data for that other player from then on.
      const myOwnKey = (player?.name || '').toLowerCase();
      const merged = {...firebaseAll};
      Object.entries(localAll).forEach(([name, localP]) => {
        if (!myOwnKey || name !== myOwnKey) return;
        const fbP = firebaseAll[name];
        if (!fbP) {
          // Player missing from the Firebase result. Only fall back to the local cache
          // if the Firebase fetch itself actually failed (offline/timeout) — otherwise
          // this player was deliberately deleted from the cloud, and stale local data
          // (which never gets cleared automatically on OTHER devices) shouldn't
          // resurrect them in the ranking.
          if (!firebaseFetchOk) { merged[name] = localP; }
          return;
        }
        // Count tasks in world 1
        const localWs = localP.worlds?.['1'] || localP.worlds?.[1] || {};
        const fbWs = fbP.worlds?.['1'] || fbP.worlds?.[1] || {};
        const localDone = (localWs.tasks||[]).filter(t=>t?.done).length;
        const fbDone = (fbWs.tasks||[]).filter(t=>t?.done).length;
        // Use local if it has more tasks OR newer timestamp
        if (localDone > fbDone || (localP.updatedAt||0) > (fbP.updatedAt||0)) {
          merged[name] = localP;
        }
      });

      // Helper: Welt-1 MT + Zoo MT for a given player object.
      // Zoo record is matched to a Denkspiel player by NAME only (no shared
      // account ID) — same account, same name, is trusted, matching the
      // combinedMTFor() policy in firebase-state.js. This used to
      // additionally require a matching deviceId before counting the Zoo MT
      // at all, which blocked the completely legitimate case of playing the
      // same account from two devices — and since only THIS copy of the
      // check got missed when combinedMTFor() was loosened, it's exactly
      // why the Zoo's own leaderboard and Welt 1's leaderboard showed
      // different totals for the same player.
      const _zooMTForChecked = (playerObj) => {
        const name = playerObj?.name;
        const z = zoosAll[name?.toLowerCase()];
        if (!z) return 0;
        return sanitizeMT(z.mt);
      };

      players = Object.values(merged)
        .filter(p => p.name && !/^test/i.test(p.name))
        .map(p => ({
          ...p,
          reb: zoosAll[p.name?.toLowerCase()]?.reb||0,
          _mt: (() => {
          // dsMTFor handles both task rewards AND the one-time language bonus,
          // then we sanitize + add zoo MT for the combined leaderboard total.
          const dsSum = sanitizeMT(dsMTFor(p));
          return sanitizeMT(dsSum + _zooMTForChecked(p));
        })()
        }))
        .sort((a,b) => b._mt - a._mt);

      myMT = (() => {
        const dsSum = sanitizeMT(dsMTFor(player));
        return sanitizeMT(dsSum + _zooMTForChecked(player));
      })();
    }

    let online = new Set();
    try{ if(typeof getOnlineNames==='function') online = await getOnlineNames(); }catch(e){}
    const rows = players.map((p, i) => {
      const isMe = p.name?.toLowerCase() === player?.name?.toLowerCase();
      const isOnline = online.has(p.name?.toLowerCase());
      const mt = formatMT(p._mt);
      const medal = i===0?'🥇':i===1?'🥈':i===2?'🥉':'';
      const tasksDone = p.worlds ? ((p.worlds?.[1]||p.worlds?.['1']||{}).tasks||[]).filter(t=>t?.done).length : null;
      return `<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:10px;margin-bottom:6px;background:${isMe?'rgba(41,182,246,.12)':'rgba(255,255,255,.04)'};border:${isMe?'1px solid rgba(41,182,246,.3)':'1px solid transparent'}">
        <div style="font-size:1.1rem;min-width:28px;text-align:center">${medal||('<span style="color:rgba(255,255,255,.3);font-size:.85rem">#'+(i+1)+'</span>')}</div>
        <span style="width:8px;height:8px;border-radius:50%;background:${isOnline?'#27AE60':'rgba(255,255,255,.15)'};flex-shrink:0" title="${isOnline?'Online':'Offline'}"></span>
        <div style="flex:1">
          <div style="font-weight:700;font-size:.92rem">${p.name}${'👑'.repeat(Math.min(3,p.reb||0))}${isMe?' <span style="font-size:1.05rem;color:#29B6F6">(Du)</span>':''}</div>
          ${tasksDone!==null?`<div style="font-size:.72rem;color:rgba(255,255,255,.4)">${tasksDone}/20 Aufgaben</div>`:''}
        </div>
        <div style="text-align:right">
          <div style="font-size:1rem;font-weight:900;color:${parseFloat(mt)>=10?'#27AE60':parseFloat(mt)>=5?'#FFD700':'#E67E22'}">🌀${mt} MT</div>
        </div>
        ${!isMe && contestPhase!=='frozen' ?
          `<button onclick="App.reportPlayer('${p.name}')" style="background:none;border:1px solid rgba(231,76,60,.3);color:rgba(231,76,60,.6);padding:3px 7px;border-radius:6px;cursor:pointer;font-size:1.18rem;touch-action:manipulation" title="Spieler melden">⚑</button>` : ''}
      </div>`;
    }).join('');

    this._html(`
      <div class="mountain-bg"><div class="sky-gradient"></div>${mountainSVG()}</div>
      <div class="page" style="padding-top:10px">
        <div class="card" style="background:linear-gradient(135deg,rgba(5,10,25,.97),rgba(10,20,45,.95));border:1px solid rgba(41,182,246,.3);padding:14px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
            <button class="btn" onclick="App.showWorldMap()" style="background:rgba(255,255,255,.1);color:#fff;padding:5px 12px;font-size:1rem">← Zurück</button>
            <h2 style="flex:1;font-family:Arial,sans-serif;color:#29B6F6;font-size:1.1rem;margin:0">🌍 Rangliste</h2>
            ${player ? `<div style="font-size:1rem;color:#FFD700">Du: 🌀${formatMT(myMT)} MT</div>` : ''}
          </div>
          ${contestPhase==='countdown' ? `<div id="contest-countdown" style="background:rgba(255,215,0,.08);border:1px solid rgba(255,215,0,.25);border-radius:12px;padding:12px;margin-bottom:14px;text-align:center"></div>` : ''}
          ${contestPhase==='frozen' ? `<div style="background:rgba(255,215,0,.12);border:1px solid rgba(255,215,0,.4);border-radius:12px;padding:10px 12px;margin-bottom:14px;text-align:center">
            <div style="font-size:1.3rem">🏆</div>
            <div style="color:#FFD700;font-weight:700;font-size:.92rem">Ergebnis fixiert bis ${(typeof Contest!=='undefined' && Contest.END) ? new Date(Contest.END).toLocaleDateString('de-CH',{day:'2-digit',month:'2-digit',year:'numeric'}) + ', ' + new Date(Contest.END).toLocaleTimeString('de-CH',{hour:'2-digit',minute:'2-digit'}) + ' Uhr' : '—'}</div>
            <div style="color:rgba(255,255,255,.5);font-size:.72rem;margin-top:2px">Danach geht's mit allem, was zwischenzeitlich verdient wurde, normal weiter.</div>
          </div>` : ''}
          ${rows || '<div style="text-align:center;padding:30px;color:rgba(255,255,255,.4)">Keine Spieler gefunden</div>'}
        </div>
      </div>`);
    if (contestPhase==='countdown' && typeof Contest!=='undefined') {
      Contest.renderCountdown(document.getElementById('contest-countdown'));
    }
  },

  // ---- KONTOAUSZUG ----
  async showKontoauszug() {
    let player;
    try { player = await Promise.race([State.refreshCurrentPlayer(), new Promise(r=>setTimeout(()=>r(State.currentPlayer),2000))]); }
    catch(e) { player = State.currentPlayer; }
    if (!player) { this.showWorldMap(); return; }

    const ws = player.worlds?.[1] || player.worlds?.['1'] || {};
    const tasks = ws.tasks || [];
    const gl = window.GAME_LIST || [];
    const isRef = false;

    // Calculate total MT (including one-time language bonus, if any — same as World Map)
    const langBonus = (typeof player.langBonusMT === 'number' && isFinite(player.langBonusMT)) ? player.langBonusMT : 0;
    // Zoo balance, combined in per the person's request that every screen
    // show one unified total (Denkspiel + Zoo), same deviceId check as
    // the leaderboard so an unrelated same-name zoo save can't leak in.
    let zooMT = 0;
    try {
      const zoo = await State.getZoo(player.name);
      if (zoo && player.deviceId && zoo.deviceId && player.deviceId === zoo.deviceId) {
        zooMT = (typeof sanitizeMT==='function') ? sanitizeMT(zoo.mt) : (zoo.mt||0);
      }
    } catch(e) {}
    const totalMT = tasks.reduce((s,t) => s + (t?.mt || 0), 0) + langBonus + zooMT;
    const doneTasks = tasks.filter(t => t?.done).length;

    // Build rows
    const tableRows = gl.map((game, i) => {
      const task = tasks[i];
      const mt = task?.mt || 0;
      const rawScore = task?.rawScore || 0;
      const plays = task?.plays || (task?.done ? 1 : 0);
      const done = task?.done || false;
      
      const mtColor = mt >= 1.3 ? '#27AE60' : mt >= 0.8 ? '#FFD700' : mt > 0 ? '#E67E22' : '#555';
      const mtDisplay = done ? `<span style="color:${mtColor};font-weight:700">${formatMT(mt)}</span>` : '—';
      // MT thresholds: passed=max, failed=0.2×base
      const base = game.baseReward || 1.0;
      const maxMT = (base * 1.5).toFixed(1);
      const minMT = (base * 0.2).toFixed(1);
      const bar = done ? Math.round((mt/(base*1.5))*100) : 0;

      return `<tr style="border-bottom:1px solid rgba(255,255,255,.05)">
        <td style="padding:5px 6px;font-size:0.92rem">${game.icon} ${game.name}</td>
        <td style="padding:5px 6px;text-align:center">${mtDisplay}</td>
        <td style="padding:5px 6px;text-align:center;font-size:0.82rem;color:rgba(255,255,255,.5)">${minMT}–${maxMT}</td>
        <td style="padding:5px 6px;text-align:center;color:rgba(255,255,255,.75);font-size:0.9rem">${rawScore > 0 ? rawScore : '—'}</td>
      </tr>`;
    }).join('');

    this._html(`
      <div class="mountain-bg"><div class="sky-gradient"></div>${mountainSVG()}</div>
      <div class="page" style="padding-top:10px">
        <div class="card" style="background:linear-gradient(135deg,rgba(5,10,25,.97),rgba(10,20,45,.95));border:1px solid rgba(41,182,246,.3);padding:12px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
            <button class="btn" onclick="App.showWorldMap()" style="background:rgba(255,255,255,.1);color:#fff;padding:5px 12px;font-size:1rem">← Zurück</button>
            <h2 style="flex:1;font-family:Arial,sans-serif;color:#29B6F6;font-size:1rem;margin:0">📊 Kontoauszug</h2>
          </div>
          <!-- Summary -->
          <div style="display:flex;gap:8px;margin-bottom:10px">
            <div style="flex:1;background:rgba(255,215,0,.1);border:1px solid rgba(255,215,0,.3);border-radius:10px;padding:10px;text-align:center">
              <div style="font-size:1.4rem;font-weight:900;color:#FFD700">🌀 ${formatMT(totalMT)}</div>
              <div style="font-size:.72rem;color:rgba(255,255,255,.8)">Gesamt MT</div>
            </div>
            <div style="flex:1;background:rgba(41,182,246,.1);border:1px solid rgba(41,182,246,.3);border-radius:10px;padding:10px;text-align:center">
              <div style="font-size:1.4rem;font-weight:900;color:#29B6F6">${doneTasks}/20</div>
              <div style="font-size:.72rem;color:rgba(255,255,255,.8)">Aufgaben</div>
            </div>
            <div style="flex:1;background:rgba(39,174,96,.1);border:1px solid rgba(39,174,96,.3);border-radius:10px;padding:10px;text-align:center">
              <div style="font-size:1.4rem;font-weight:900;color:#27AE60">${doneTasks > 0 ? (totalMT/doneTasks).toFixed(1) : '—'}</div>
              <div style="font-size:.72rem;color:rgba(255,255,255,.8)">Ø MT/Spiel</div>
            </div>
          </div>
          <div style="overflow-x:auto">
            <table style="width:100%;border-collapse:collapse;font-size:0.98rem">
              <thead>
                <tr style="border-bottom:1px solid rgba(41,182,246,.2);color:rgba(255,255,255,.75)">
                  <th style="padding:5px 6px;text-align:left;font-size:0.9rem">Spiel</th>
                  <th style="padding:5px 6px;text-align:center;font-size:0.9rem">MT</th>
                  <th style="padding:5px 6px;text-align:center;font-size:0.82rem;color:rgba(255,255,255,.5)">Bereich</th>
                  <th style="padding:5px 6px;text-align:center;font-size:0.9rem">Score</th>
                </tr>
              </thead>
              <tbody>
                ${langBonus > 0 ? `<tr style="border-bottom:1px solid rgba(255,255,255,.05);background:rgba(39,174,96,.05)">
                  <td style="padding:5px 6px;font-size:0.92rem">🌐 Sprachbonus</td>
                  <td style="padding:5px 6px;text-align:center"><span style="color:#27AE60;font-weight:700">${langBonus.toFixed(1)}</span></td>
                  <td style="padding:5px 6px;text-align:center;font-size:0.82rem;color:rgba(255,255,255,.5)">einmalig</td>
                  <td style="padding:5px 6px;text-align:center;color:rgba(255,255,255,.5);font-size:0.9rem">—</td>
                </tr>` : ''}
                ${zooMT > 0 ? `<tr style="border-bottom:1px solid rgba(255,255,255,.05);background:rgba(255,215,0,.05)">
                  <td style="padding:5px 6px;font-size:0.92rem">🦁 Zoo-Guthaben</td>
                  <td style="padding:5px 6px;text-align:center"><span style="color:#FFD700;font-weight:700">${formatMT(zooMT)}</span></td>
                  <td style="padding:5px 6px;text-align:center;font-size:0.82rem;color:rgba(255,255,255,.5)">aktuell</td>
                  <td style="padding:5px 6px;text-align:center;color:rgba(255,255,255,.5);font-size:0.9rem">—</td>
                </tr>` : ''}
              <tbody>${tableRows}</tbody>
            </table>
          </div>
        </div>
      </div>`);
  },

  _calEdit(gameIdx, dev) {
    const calStore = JSON.parse(localStorage.getItem('cal_data_v3')||'{}');
    const key = gameIdx+'_'+dev;
    const scores = calStore[key] || [];
    const newVal = prompt('Werte für Spiel '+gameIdx+' ('+dev+'):\n'+scores.join(', ')+'\n\nNeue Werte (kommagetrennt) eingeben, leer=löschen:');
    if (newVal === null) return; // cancelled
    if (newVal.trim() === '') {
      delete calStore[key];
    } else {
      calStore[key] = newVal.split(',').map(s=>parseFloat(s.trim())).filter(n=>!isNaN(n));
    }
    localStorage.setItem('cal_data_v3', JSON.stringify(calStore));
    this.showKontoauszug(); // refresh
  },

  async _calClearDev(dev) {
    if (!(await showConfirm('Alle Kalibrierungsdaten für '+dev+' löschen?'))) return;
    const calStore = JSON.parse(localStorage.getItem('cal_data_v3')||'{}');
    Object.keys(calStore).forEach(k=>{ if(k.endsWith('_'+dev)) delete calStore[k]; });
    localStorage.setItem('cal_data_v3', JSON.stringify(calStore));
    this.showKontoauszug();
  },

  // ---- GELDBEUTEL ----
  async showGeldbeutel() {
    const player = State.currentPlayer;
    if (!player) { this.showWorldMap(); return; }
    const ws = player.worlds?.[1] || player.worlds?.['1'] || player.worlds?.['1'] || {tasks: Array(20).fill(null)};
    // Ensure tasks array exists
    if (!ws.tasks) ws.tasks = Array(20).fill(null);
    const gl = window.GAME_LIST || [];
    const allRows = gl.map((game, i) => {
      const task = ws.tasks?.[i];
      const mt = task?.mt || 0;
      const score = task?.score || '—';
      const plays = task?.plays || (task?.done ? 1 : 0);
      return {game, mt, score, plays, done: task?.done||false};
    });
    const rows = allRows.filter(r => r.done).sort((a,b) => b.mt - a.mt);
    const unplayedRows = allRows.filter(r => !r.done);
    const langBonus = (typeof player.langBonusMT === 'number' && isFinite(player.langBonusMT)) ? player.langBonusMT : 0;
    // Zoo balance, combined in per the person's request that every screen
    // show one unified total (Denkspiel + Zoo).
    let zooMT = 0;
    try {
      const zoo = await State.getZoo(player.name);
      if (zoo && player.deviceId && zoo.deviceId && player.deviceId === zoo.deviceId) {
        zooMT = (typeof sanitizeMT==='function') ? sanitizeMT(zoo.mt) : (zoo.mt||0);
      }
    } catch(e) {}
    const totalMT = rows.reduce((s,r)=>s+r.mt,0) + langBonus + zooMT;
    const tableRows = rows.map((r,i)=>`<tr style="border-bottom:1px solid rgba(255,255,255,.05)${i<3?';background:rgba(255,215,0,.04)':''}"><td style="padding:6px 8px;font-size:1rem">${r.game.icon} ${r.game.name}</td><td style="padding:6px 8px;text-align:center;color:${r.mt>0?'#FFD700':'rgba(255,255,255,.3)'};font-weight:${r.mt>0?'700':'400'}">${r.mt>0?'🌀 '+r.mt:'—'}</td><td style="padding:6px 8px;text-align:center;color:rgba(255,255,255,.5);font-size:1rem">${r.done?r.score:'—'}</td><td style="padding:6px 8px;text-align:center;color:rgba(255,255,255,.4);font-size:0.95rem">${r.plays>0?r.plays+'×':'—'}</td></tr>`).join('');
    this._html(`<div class="mountain-bg"><div class="sky-gradient"></div>${mountainSVG()}</div><div class="page"><div class="card" style="background:linear-gradient(135deg,rgba(10,10,25,.95),rgba(20,20,40,.9));border:1px solid rgba(255,215,0,.25)"><div style="display:flex;align-items:center;gap:10px;margin-bottom:16px"><button class="btn" onclick="App.showWorldMap()" style="background:rgba(255,255,255,.1);color:#fff;padding:6px 14px">← Zurück</button><h2 style="flex:1;font-family:Arial,sans-serif;color:#FFD700;font-size:1.3rem">👜 Geldbeutel</h2><div style="text-align:right"><div style="font-size:0.95rem;color:rgba(255,255,255,.4)">Gesamt</div><div style="font-weight:900;color:#FFD700;font-size:1.1rem">🌀 ${formatMT(totalMT)} MT</div></div></div><div style="font-size:.72rem;color:rgba(255,255,255,.3);margin-bottom:10px">Jedes Spiel kann unbegrenzt wiederholt werden. Es zählt immer das letzte Ergebnis.</div><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:1rem"><thead><tr style="border-bottom:2px solid rgba(255,215,0,.3);color:rgba(255,255,255,.5)"><th style="padding:7px 8px;text-align:left">Spiel</th><th style="padding:7px 8px;text-align:center">MT</th><th style="padding:7px 8px;text-align:center">Score</th><th style="padding:7px 8px;text-align:center">Gespielt</th></tr></thead><tbody>${tableRows}</tbody></table></div></div></div>`);
  },

  // ---- WORLD VIEW ----
  async showWorld(worldId) {
    this._loading('Welt laden...');
    console.log('[showWorld] start, worldId=', worldId);
    // Safety net: if this whole method hangs for any reason, kick user back
    // to the world map after 8s so they aren't stuck on the loading screen.
    const _safetyTimer = setTimeout(()=>{
      console.warn('[showWorld] SAFETY TIMEOUT — falling back to world map');
      try{ this.showWorldMap(); }catch(e){}
    }, 8000);
    try {
      await this._showWorldInner(worldId);
    } catch(e) {
      console.error('[showWorld] failed with:', e);
      showAlert('❌ Fehler beim Laden der Welt: '+(e?.message||e)+'\n\nZurück zur Weltkarte.');
      this.showWorldMap();
    } finally {
      clearTimeout(_safetyTimer);
    }
  },

  async _showWorldInner(worldId) {
    console.log('[showWorld] refreshing player...');
    // 3s timeout - use cached player if Firebase is slow
    let player = null;
    try {
      player = await Promise.race([
        State.refreshCurrentPlayer(),
        new Promise(r => setTimeout(() => r(State.currentPlayer || null), 3000))
      ]);
    } catch(e) {
      player = State.currentPlayer || null;
    }
    if (!player) { this.showWelcome(); return; }
    // Defensive: if player object is somehow malformed (missing name), don't crash — bounce to welcome
    if (!player.name) { console.warn('[showWorld] player missing name field, back to welcome'); this.showWelcome(); return; }
    const world = WORLDS.find(w=>w.id===worldId);
    // Normalize worlds: handle both array-of-ids and object format
    let ws = null;
    if (player.worlds) {
      // worlds might be array ["1","2",...] or object {1:{tasks:...}}
      if (Array.isArray(player.worlds)) {
        // Old format: just an array of world IDs — treat as empty
        ws = { tasks: Array(20).fill(null), jokerUsed: false, completed: false };
        player.worlds = {}; // convert to object format
      } else {
        ws = (player.worlds?.[worldId] || player.worlds?.[String(worldId)] || {}) || player.worlds[String(worldId)];
      }
    }
    if (!ws) ws = { tasks: Array(20).fill(null), jokerUsed: false, completed: false };
    // Ensure tasks array is 20 items
    while((ws.tasks||[]).length < 20) ws.tasks = [...(ws.tasks||[]), ...Array(20).fill(null)].slice(0,20);
    const done = ws.tasks.filter(t=>t&&t.done).length;
    const ch = this._char(player);
    
    // Janoschtest: get calibration status
    const _isRefW = (player.name || '').toLowerCase() === 'janoschtest';
    let calStatus = '';
    // Declare outside if-block so template can access them
    let calCount = 0, runsCount = 0, lastRun = null, lastRunGames = 0;
    if (_isRefW) {
      const cal = State._getAllCalibration ? State._getAllCalibration() : {};
      const runs = State._getCalibrationRuns ? State._getCalibrationRuns() : [];
      calCount = Object.keys(cal).length;
      runsCount = runs.length;
      lastRun = runs[runs.length-1];
      lastRunGames = lastRun ? Object.keys(lastRun.games||{}).length : 0;
      const statusMsg = runsCount===0 ? 'Noch kein vollständiger Durchgang — alle Spiele einmal spielen!' :
            runsCount<3 ? 'Noch '+(3-runsCount)+' weitere Durchgänge für maximale Genauigkeit' : 'Kalibrierung vollständig (3 Durchgänge)';
      calStatus = '<div style="background:linear-gradient(135deg,#E74C3C,#C0392B);color:#fff;padding:10px 14px;border-radius:10px;margin-bottom:12px;font-size:1rem">'
        +'<div style="font-weight:900;font-size:.95rem;margin-bottom:4px">&#128302; KALIBRIERUNGS-MODUS</div>'
        +'<div>Deine Spiele kalibrieren die MT-Belohnungen für alle anderen Spieler.</div>'
        +'<div style="margin-top:6px">&#128202; Kalibriert: <b>'+calCount+'/20</b> &nbsp; &#128260; Durchgänge: <b>'+runsCount+'</b>'+(lastRun?'&nbsp; &#128197; Letzter Run: <b>'+lastRunGames+'/20</b>':'')+'</div>'
        +'<div style="margin-top:4px;font-size:.72rem;opacity:.7">'+statusMsg+'</div>'
        +'</div>';
    }

    this._html(`
      ${window.MISCHA_TESTMODE ? `<button onclick="App._showBgDiagnostic()" style="position:fixed;bottom:16px;right:16px;z-index:99998;background:#000;color:#0f0;border:2px solid #0f0;padding:8px 12px;border-radius:8px;font-size:.7rem;font-family:monospace;cursor:pointer">🔍 BG-Diagnose</button>` : ''}
      <div class="mountain-bg"><div class="sky-gradient"></div><div class="cloud cloud-1"></div>${mountainSVG()}</div>
      <div class="page" style="padding-top:14px">
        
            <div class="world-banner ${world.bannerClass}" style="margin-bottom:10px">
          <span class="banner-icon">${world.icon}</span>
          <div class="banner-title">${world.name}</div>
          <div class="banner-sub">${done}/20 ${typeof t!=='undefined'?t('gamelist.done_of20'):'geschafft'} · 🌀${formatMT((ws.tasks||[]).reduce((s,t)=>s+(t?.mt||0),0))} MT</div>
        </div>


        <div class="card" style="max-width:100%;padding:1.000rem;box-sizing:border-box">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
            <button onclick="App.showWorldMap()" style="background:none;border:none;font-size:0.95rem;cursor:pointer;color:var(--text-mid)">${typeof t!=='undefined'?t('gamelist.back'):'◀ Welten'}</button>
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
              <button onclick="App.showGlobalLeaderboard()" style="background:rgba(74,144,217,0.1);border:2px solid var(--sky-deep);color:var(--sky-deep);padding:5px 10px;border-radius:50px;font-weight:700;cursor:pointer;font-size:0.95rem">${typeof t!=='undefined'?t('wm.leaderboard'):'🌍 Rangliste'}</button>
              <button onclick="App.showKontoauszug()" style="background:rgba(41,182,246,0.1);border:2px solid #29B6F6;color:#29B6F6;padding:5px 10px;border-radius:50px;font-weight:700;cursor:pointer;font-size:1rem">${typeof t!=='undefined'?t('btn.account_short'):'📊 Konto'}</button>
              <button onclick="Wardrobe.open()" style="background:rgba(255,215,0,0.1);border:2px solid rgba(255,215,0,0.5);color:#FFD700;padding:0.500rem 0.750rem;border-radius:50px;font-weight:700;cursor:pointer;font-size:1rem;min-height:40px">${typeof t!=='undefined'?t('gamelist.wardrobe'):'👗 Kleider'}</button>
            </div>
          </div>

          ${window._showEyeTestHint ? `<div onclick="App.showEyeTest()" style="background:linear-gradient(135deg,rgba(100,200,255,.14),rgba(41,182,246,.08));border:1.5px solid rgba(100,200,255,.4);border-radius:12px;padding:10px 14px;margin-bottom:10px;cursor:pointer;display:flex;align-items:center;gap:10px">
            <span style="font-size:1.4rem">👁</span>
            <div style="flex:1">
              <div style="font-weight:900;color:rgba(180,240,255,1)">${typeof t!=='undefined'?t('gamelist.font_hint_t'):'Schrift zu klein?'}</div>
              <div style="color:rgba(255,255,255,.5);font-size:.82rem">${typeof t!=='undefined'?t('gamelist.font_hint_b'):'Schrift optimieren — mit dem Regler einstellen.'}</div>
            </div>
            <span style="color:rgba(100,200,255,.7)">›</span>
          </div>` : ''}
          <div style="font-size:1rem;color:var(--text-mid);margin-bottom:8px">${typeof t!=='undefined'?t('gamelist.next_task'):'Tippe auf die nächste Aufgabe:'}</div>

          ${_isRefW ? '<div style="background:rgba(231,76,60,.15);border:1px solid rgba(231,76,60,.4);border-radius:10px;padding:10px;margin-bottom:10px;font-size:1rem;color:#fff"><b style="color:#E74C3C">&#128302; Kalibrierung:</b> '+calCount+'/20 Spiele &middot; '+runsCount+' Durchgang'+(runsCount>=3?' &middot; ✅ Vollständig':runsCount>0?' &middot; '+Math.round(calCount/20*100)+'%':'')+'</div>' : ''}
      <div class="task-grid">
            ${world.tasks.map((task,i) => {
              const tdone = ws.tasks[i]&&ws.tasks[i].done;
              const tjok  = ws.tasks[i]&&ws.tasks[i].joker;
              // ALL tasks always playable (can replay, last score counts)
              let cls = tdone ? (tjok?'joker':'done') : 'active';
              const score = ws.tasks[i]?.score || '';
              const playCount = ws.tasks[i]?.plays || (tdone?1:0);
              // A done task ALWAYS has MT (min 0.2). Never show raw score with a star.
              let mtEarned = '';
              if(tdone){
                const _m = ws.tasks[i]?.mt;
                mtEarned = (typeof _m==='number' && !isNaN(_m) && _m>0) ? _m : 0.2;
              }
              return `
                <button class="task-btn ${cls}"
                  onclick="App.startTask(${worldId},${i})"
                  style="touch-action:manipulation"
                  title="${task.name||task.title||'Spiel '+(i+1)}">
                  <span class="task-icon" style="font-size:clamp(1.2rem, 2.1rem, 28px);display:block;margin-bottom:3px;line-height:1">${task.icon||'🎮'}</span>
                  <span class="task-name" style="font-size:clamp(0.6rem, 1.05rem, 14px);font-weight:700;line-height:1.2;display:block;overflow-wrap:break-word;hyphens:auto">${task.name||('Spiel '+(i+1))}</span>
                  ${mtEarned!==''?`<span style="font-size:0.97rem;color:#FFD700">🌀${mtEarned}</span>`:''}
                </button>`;
            }).join('')}
          </div>

          <div style="margin-top:12px">
            <div class="progress-bar-wrap">
              <div class="progress-bar-fill" style="width:${done*5}%"></div>
            </div>
            <div style="text-align:center;font-size:0.95rem;color:var(--text-mid)">${done}/20 ${typeof t!=='undefined'?t('gamelist.done_of20'):'geschafft'}</div>
          </div>
        </div>
      </div>`);
  },

  async showJokerMenu(worldId) {
    const player = await State.refreshCurrentPlayer();
    const ws = (player.worlds?.[worldId] || player.worlds?.[String(worldId)] || {});
    if (!ws) return;
    const activeTask = ws.tasks.findIndex(t=>!t||!t.done);
    if (activeTask<0) return;
    const rem = State.getJokersRemaining(player, worldId);
    if (rem === 0) { showAlert('Keine Joker mehr in dieser Welt!'); return; }
    if (await showConfirm(`🃏 Joker einsetzen?\nNoch ${rem} Joker in dieser Welt.\nDie aktuelle Aufgabe zählt als geschafft.`)) {
      await State.useJoker(player.name, worldId, activeTask);
      this.showWorld(worldId);
    }
  },

  // ---- TASK INSTRUCTION ----
  startTask(worldId, taskIndex) {
    const world = WORLDS.find(w=>w.id===worldId);
    const task  = world.tasks[taskIndex];
    this._html(`
      <div class="mountain-bg"><div class="sky-gradient"></div>${mountainSVG()}</div>
      <div class="page">
        <div class="card" style="max-width:480px">
          <div style="text-align:center">
            <span style="font-size:2.8rem">${task.icon}</span>
            <div class="card-title">${task.title}</div>
            <div style="background:linear-gradient(135deg,#EBF5FB,#D6EAF8);border:2px solid #85C1E9;border-radius:12px;padding:14px;margin:14px 0;text-align:left;font-size:0.9rem;line-height:1.6">
              ${getTaskInstruction(task.type, worldId)}
            </div>
            <button class="btn btn-primary btn-big btn-full" onclick="App.launchGame(${worldId},${taskIndex})">
              Verstanden! ✅ Los geht's!
            </button>
            <button class="btn btn-secondary btn-full" style="margin-top:10px" onclick="App.showWorld(${worldId})">◀ Zurück</button>
          </div>
        </div>
      </div>`);
  },

  // ---- LAUNCH GAME ----
  async launchGame(worldId, taskIndex) {
    const _taskInfo = WORLDS[0]?.tasks?.[taskIndex];
    GameLog.log(_taskInfo?.type||'unknown', 'launchGame started: world='+worldId+' idx='+taskIndex);
    // PHASE 1: Re-apply font scale (Android resets it on view changes)
    try { if(typeof FontScale!=='undefined' && window._userFontScale) FontScale.apply(window._userFontScale); } catch(e){}
    const player = await State.refreshCurrentPlayer();
    const world  = WORLDS.find(w=>w.id===worldId);
    const task   = world.tasks[taskIndex];
    const ageGroup = State.getAgeGroup(player);
    console.log('[showTask] player='+player.name+' birthYear='+player.birthYear+' age='+State.getAge(player)+' ageGroup='+ageGroup);
    const ws = (player.worlds?.[worldId] || player.worlds?.[String(worldId)] || {}) || {};

    this._html(`
      <div class="page" style="padding:2px;min-height:100vh;background:var(--bg)">
        <div class="game-container" style="margin:0;border-radius:8px">
          <div class="game-header">
            <div class="game-title">${task.icon} ${task.title}</div>
            <!-- Portrait rotate hint (mobile only) -->
            <div class="rotate-hint" style="display:none;background:rgba(255,165,0,.9);color:#000;padding:3px 8px;border-radius:6px;font-size:.72rem;font-weight:700;align-items:center;gap:4px">
              📱↻ Querformat
            </div>
            <div style="display:flex;gap:6px;align-items:center">
              <button onclick="App._toggleZoom()" id="zoom-btn"
                style="background:rgba(41,182,246,.12);border:2px solid rgba(41,182,246,.35);color:#29B6F6;padding:5px 9px;border-radius:50px;font-size:0.95rem;font-weight:700;cursor:pointer;touch-action:manipulation" title="Zoom">
                🔍
              </button>
              <button onclick="App._confirmLeave(${worldId})"
                style="background:#FFF5F5;border:2px solid #E74C3C;color:#E74C3C;padding:5px 10px;border-radius:50px;font-size:0.95rem;font-weight:700;cursor:pointer">
                ✕ Verlassen
              </button>
              <div class="joker-badge ${ws.jokerUsed?'used':''}"
                onclick="${ws.jokerUsed?'':  `App.useJokerInGame(${worldId},${taskIndex})`}">
                🃏
              </div>
            </div>
          </div>
          <div id="game-area" style="width:100%;transition:transform .2s;will-change:transform">
            <div style="text-align:center;padding:40px;color:var(--text-mid)">⏳ Laden...</div>
          </div>
        </div>
      </div>`);

    // PHASE 1: Re-apply font scale on game start (Android resets it otherwise)
    try{ if(window.FontScale && State.currentPlayer) FontScale.applyForPlayer(State.currentPlayer.name); }catch(e){}
    // ── AUTO-ZOOM: fit game to screen width on mobile ──
    const _taskType = task?.type || task?.id || '';
    setTimeout(() => {
      const ga = document.getElementById('game-area');
      const btn = document.getElementById('zoom-btn');
      // Skip auto-zoom only for a REAL desktop (no touch, wide screen) — an
      // iPad is basically always ≥700px wide even held in portrait, so
      // this used to treat it as "desktop" and skip fitting the game to
      // its screen entirely, regardless of orientation. Any touch device
      // (phone, iPad, Android tablet) now goes through the same fit logic
      // that phones already used — this doesn't change anything for phones
      // (they were always <700px and already went through this path).
      const _isTouchDevice = (navigator.maxTouchPoints||0)>0 || 'ontouchstart' in window;
      if (!ga || (window.innerWidth >= 700 && !_isTouchDevice)) return; // desktop: no auto-zoom
      const setZoom = (z) => {
        this._zoomLevel = z;
        ga.style.transform = `scale(${z})`;
        ga.style.transformOrigin = 'top left';
        ga.style.marginBottom = Math.round((z-1)*ga.offsetHeight*0.5)+'px';
        ga.style.marginRight = Math.round((z-1)*ga.offsetWidth*0.5)+'px';
        if (btn) { btn.textContent = `🔍 ${Math.round(z*100)}%`; btn.style.background = 'rgba(41,182,246,.25)'; }
      };
      const screenW = window.innerWidth;
      // Tennis/Pong: measure actual game content and fit to screen
      if (_taskType === 'pong') {
        const pongCanvas = ga.querySelector('canvas');
        const pongW = pongCanvas ? pongCanvas.offsetWidth : ga.scrollWidth;
        const idealZoomP = Math.min(screenW / (pongW + 80), 2.5); // +80 for touch strip
        const snappedP = [1.5, 1.75, 2.0, 2.25, 2.5].reduce((a,b)=>Math.abs(b-idealZoomP)<Math.abs(a-idealZoomP)?b:a);
        setZoom(Math.max(2.0, snappedP)); // min 200%
        return;
      }
      // Other games: auto-fill screen
      const inner = ga.querySelector('canvas') || ga.querySelector('div');
      const gameW = inner ? (inner.offsetWidth || inner.scrollWidth) : ga.scrollWidth;
      if (gameW > 10 && screenW > gameW * 1.05) {
        const idealZoom = Math.min(screenW / gameW, 2.5);
        const steps = [0.85, 1, 1.1, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5];
        const snapped = steps.reduce((a,b) => Math.abs(b-idealZoom)<Math.abs(a-idealZoom)?b:a);
        if (snapped > 1.05) setZoom(snapped);
      }
    }, 400);

    // Device detection helper
    const _getDevice=()=>{
      // Use unified detection from State (matches calibration detection)
      if(State._detectDevice) return State._detectDevice();
      const ua=navigator.userAgent||'';
      const touch=(navigator.maxTouchPoints||0)>0;
      const minDim=Math.min(window.innerWidth,window.innerHeight);
      const maxDim=Math.max(window.innerWidth,window.innerHeight);
      if(/iPad/.test(ua)||(navigator.platform==='MacIntel'&&touch))return'ipad';
      if(/iPhone|iPod/.test(ua))return'iphone';
      if(/Android/.test(ua))return(/Mobile/.test(ua)||minDim<600)?'android':'android-tablet';
      const dpr=window.devicePixelRatio||1;
      if(touch&&dpr>=2.4)return'android';
      if(touch&&minDim<820&&maxDim<1400)return minDim<600?'android':'tablet';
      if(touch&&maxDim<1100)return minDim<600?'android':'tablet';
      return'desktop';
    };

    const onComplete = async (result) => {
      const _player=State.currentPlayer?.name||'?';
      const _age=State.getAge?State.getAge(State.currentPlayer):'?';
      const _ageGrp=State.getAgeGroup?State.getAgeGroup(State.currentPlayer):'?';
      GameLog.log(task.type||task.id,
        'onComplete: player='+_player+' age='+_age+' ageGroup='+_ageGrp+
        ' rawScore='+result.rawScore+' passed='+result.passed+
        ' errors='+(result.errors||0)+' timeMs='+(result.timeMs||0));
      // Save score record for admin panel
      try {
        const recKey='admin_score_records';
        const recs=JSON.parse(localStorage.getItem(recKey)||'{}');
        const gId=task.type||task.id||'unknown';
        if(!recs[gId])recs[gId]=[];
        // Capture raw device signals for debugging detection
        const _dbg = {
          ua: (navigator.userAgent||'').slice(0,120),
          touch: navigator.maxTouchPoints||0,
          w: window.innerWidth, h: window.innerHeight,
          dpr: window.devicePixelRatio||1,
          plat: navigator.platform||'',
        };
        const _dev = _getDevice();
        const _rec = {
          date:new Date().toLocaleString('de-CH',{timeZone:'Europe/Zurich'}),
          player:State.currentPlayer?.name||'?',
          device:_dev,
          game:task.type||task.id||'unknown',  // CRITICAL: needed for Firebase query
          gameIdx:taskIndex,
          worldId:worldIndex,
          score:result.rawScore||0,
          mt:0,
          passed:result.passed||false,
          ts:Date.now(),
          dbg:_dbg, // raw signals for device-detection debugging
        };
        if(typeof GameLog!=='undefined') GameLog.log('device','detected='+_dev+' ua='+_dbg.ua.slice(0,40)+' touch='+_dbg.touch+' '+_dbg.w+'x'+_dbg.h+' dpr='+_dbg.dpr+' plat='+_dbg.plat);
        recs[gId].push(_rec);
        if(recs[gId].length>200)recs[gId]=recs[gId].slice(-200);
        localStorage.setItem(recKey,JSON.stringify(recs));
        // Also save to Firebase so admin can see records from ALL devices
        if(typeof _db !== 'undefined' && _db) {
          const dedupKey = (_rec.player+'_'+gId+'_'+_rec.ts+'_'+Math.floor(Math.random()*1000)).replace(/[^a-zA-Z0-9_-]/g,'_');
          _db.collection('score_records').doc(dedupKey).set(_rec).catch(()=>{});
        }
      }catch(e){}
      // Save task result to player immediately (localStorage)
      try {
        const mt = State.calcMT ? State.calcMT(taskIndex, result) : 1.0;
        const p = State.currentPlayer;
        if (p && p.worlds) {
          const wid = String(worldId); // Use string key for JSON consistency
          if (!p.worlds[wid]) p.worlds[wid] = {tasks:Array(20).fill(null),jokerUsed:false,completed:false};
          const prevPlays = p.worlds[wid].tasks[taskIndex]?.plays || 0;
          // Preliminary MT for local display (completeTask will update with accurate value)
          const taskMT = (() => {
            try {
              const raw = result.rawScore||0;
              if(result.passed===false) return 0.2;
              const ua=navigator.userAgent;
              const isIPad=/iPad/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
              const dev=isIPad?'ipad':/iPhone/.test(ua)?'iphone':/Android/.test(ua)?'android':'desktop';
              const calStore=JSON.parse(localStorage.getItem('cal_data_v3')||'{}');
              const scores=calStore[taskIndex+'_'+dev]||[];
              // These are ALL previous scores (current score not yet added)
              if(!scores.length) return 1.0; // First play always 1 MT
              const minS=Math.min(...scores),maxS=Math.max(...scores),avgS=scores.reduce((a,b)=>a+b,0)/scores.length;
              if(maxS===minS){
                // Same fix as completeTask: synthesize a spread instead of a
                // crude 1.2/0.8 coin-flip when all prior scores are identical.
                const synthMin=Math.max(0,minS*0.5), synthMax=Math.max(minS*1.5,minS+20);
                if(raw<=synthMin) return 0.0;
                if(raw>=synthMax) return 2.0;
                if(raw<minS) return synthMin<minS ? (raw-synthMin)/(minS-synthMin) : 1.0;
                return synthMax>minS ? 1+(raw-minS)/(synthMax-minS) : 1.0;
              }
              if(raw<=minS) return 0.0;
              if(raw>=maxS) return 2.0;
              return raw<avgS ? (raw-minS)/(avgS-minS) : 1+(raw-avgS)/(maxS-avgS);
            } catch(e){ return 1.0; }
          })();
          p.worlds[wid].tasks[taskIndex] = {
            done:true,
            score:State.calcFinalScore(result,p)||result.rawScore||0,
            mt: Math.round(Math.min(2.0,Math.max(0,taskMT))*10)/10,
            rawScore:result.rawScore||0, timeMs:result.timeMs||0,
            passed:result.passed!==false, plays:prevPlays+1, lastPlayed:Date.now()
          };
          State._local && State._local.set(p.name, p);
        }
      } catch(e) {}
      // Run completeTask first (local operations are instant, Firebase async)
      try {
        await Promise.race([
          State.completeTask(player.name, worldId, taskIndex, result),
          new Promise(r => setTimeout(r, 1500)) // 1.5s max for local+firebase start
        ]);
      } catch(e) {}
      // Show result with correct MT (completeTask updated State.currentPlayer)
      this._showTaskComplete(worldId, taskIndex, result);
    };

    setTimeout(() => {
      switch (task.type) {
        case 'math':        MathGame.start({ ageGroup, worldId, onComplete }); break;
        case 'reaction':    ReactionGame.start({ onComplete }); break;
        case 'memory':      MemoryGame.start({ emojis: world.memoryEmojis, onComplete }); break;
        case 'sokoban':     SokobanGame.start({ onComplete }); break;
        case 'shutthebox':  ShutTheBoxGame.start({ onComplete }); break;
        case 'jenga':       JengaGame.start({ worldId, ageGroup, onComplete }); break;
        case 'slider':      SliderGame.start({ ageGroup, worldId, onComplete }); break;
        case 'wordsearch':  WordSearchGame.start({ worldId, onComplete }); break;
        case 'typing':      TypingGame.start({ ageGroup, worldId, onComplete }); break;
        case 'balloon':     BalloonGame.start({ ageGroup, worldId, onComplete }); break;
        case 'simon':       SimonGame.start({ worldId, onComplete }); break;
        case 'truefalse':   TrueFalseGame.start({ worldId, ageGroup, onComplete }); break;
        case 'dart':        DartGame.start({ onComplete }); break;
        case 'pacman':      PacmanGame.start({ onComplete }); break;
        case 'catapult':    CatapultGame.start({ onComplete }); break;
        case 'starwars':    StarWarsGame.start({ onComplete }); break;
        case 'pong':        PongGame.start({ onComplete }); break;
        case 'tetris':      TetrisGame.start({ onComplete }); break;
        case 'stunt':       StuntGame.start({ onComplete }); break;
        case 'anagram':     AnagramGame.start({ worldId, onComplete }); break;
        case 'colormix':    ColorMixGame.start({ onComplete }); break;
        case 'clock':       ClockGame.start({ ageGroup, onComplete }); break;
        case 'flags':       FlagsGame.start({ onComplete }); break;
        case 'hangman':     HangmanGame.start({ worldId, onComplete }); break;
        case 'tictactoe':   TicTacToeGame.start({ onComplete }); break;
        case 'weight':      WeightGame.start({ onComplete }); break;
        case 'basketball':  BasketballGame.start({ onComplete }); break;
        case 'emojistory':  EmojiStoryGame.start({ onComplete }); break;
        case 'geo':         GeoGame.start({ onComplete }); break;
        case 'french':      FrenchGame.start({ ageGroup, onComplete }); break;
        case 'riddle':      RiddleGame.start({ onComplete }); break;
        default:
          document.getElementById('game-area').innerHTML = '<div style="padding:20px;text-align:center">🚧 Kommt bald!</div>';
          // Log unknown game type
          try {
            const el = JSON.parse(localStorage.getItem('mischa_error_log')||'[]');
            el.push(new Date().toLocaleString('de-CH',{timeZone:'Europe/Zurich'})+': Unbekannter Spieltyp: '+task.type);
            localStorage.setItem('mischa_error_log', JSON.stringify(el.slice(-20)));
          } catch(e2) {}
      }
    }, 120);
  },

  _zoomLevel: 1,

  reportPlayer(playerName) {
    const reasons = [
      {id:'harassment', label:'Belästigung / Stalking',      icon:'😤'},
      {id:'insults',    label:'Beleidigungen / Hass',         icon:'🤬'},
      {id:'exploit',    label:'Cheaten / Ausnutzung',         icon:'🎮'},
      {id:'violence',   label:'Gewalt / Extremismus',         icon:'⚠️'},
      {id:'inappropriate', label:'Unangemessener Inhalt',     icon:'🚫'},
      {id:'spam',       label:'Spam / Werbung',               icon:'📢'},
      {id:'other',      label:'Sonstiges',                    icon:'❓'},
    ];
    this._selectedReportReason = null;
    this._reportImageB64 = null;
    this._html(`
      <div style="max-width:500px;margin:0 auto;padding:10px">
        <div style="background:rgba(20,10,30,.97);border:1.5px solid rgba(231,76,60,.35);border-radius:16px;overflow:hidden">
          <div style="background:linear-gradient(135deg,rgba(231,76,60,.25),rgba(192,57,43,.15));padding:14px 18px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(231,76,60,.2)">
            <div style="font-weight:900;font-size:1.05rem;color:#ff6b6b">⚑ Spieler melden</div>
            <button onclick="App.showGlobalLeaderboard()" style="background:rgba(255,255,255,.1);border:none;color:#fff;cursor:pointer;font-size:1rem;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center">✕</button>
          </div>
          <div style="padding:12px 18px;display:flex;align-items:center;gap:12px;border-bottom:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.02)">
            <div style="width:42px;height:42px;border-radius:50%;background:rgba(231,76,60,.2);display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0">👤</div>
            <div><div style="font-weight:900">${playerName}</div><div style="font-size:.78rem;color:rgba(255,255,255,.35)">gemeldet von ${State.currentPlayer?.name||'?'}</div></div>
          </div>
          <div style="padding:12px 18px 0">
            <div style="font-size:.72rem;color:#aaa;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Grund wählen *</div>
            ${reasons.map(r => `<div data-rid="${r.id}" onclick="App._pickReason('${playerName}','${r.label}',this)"
              style="padding:10px 14px;margin-bottom:3px;border-radius:9px;cursor:pointer;display:flex;align-items:center;gap:10px;
                     border:1.5px solid rgba(255,255,255,.07);background:rgba(255,255,255,.02);transition:.12s">
              <span style="font-size:1.15rem">${r.icon}</span>
              <span style="flex:1;font-size:.88rem">${r.label}</span>
              <span class="rck" style="opacity:0;color:#E74C3C;font-weight:900">✓</span>
            </div>`).join('')}
          </div>
          <div style="padding:10px 18px 0">
            <div style="font-size:.72rem;color:#aaa;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px">Was ist passiert? *</div>
            <textarea id="rdesc" placeholder="Bitte genau beschreiben was passiert ist..." rows="3"
              style="width:100%;box-sizing:border-box;background:rgba(255,255,255,.05);border:1.5px solid rgba(255,255,255,.1);
                     color:#fff;padding:10px;border-radius:9px;font-size:.88rem;resize:vertical;font-family:inherit;outline:none"
              oninput="App._updateRBtn()"></textarea>
          </div>
          <div style="padding:8px 18px 0">
            <div style="font-size:.72rem;color:#aaa;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Screenshot als Beweis (optional)</div>
            <div id="img-drop-zone" onclick="document.getElementById('rimg').click()"
              style="border:2px dashed rgba(255,255,255,.18);border-radius:10px;padding:16px;text-align:center;cursor:pointer;transition:.15s;background:rgba(255,255,255,.02)"
              onmouseover="this.style.borderColor='rgba(74,144,226,.6)';this.style.background='rgba(74,144,226,.06)'"
              onmouseout="this.style.borderColor='rgba(255,255,255,.18)';this.style.background='rgba(255,255,255,.02)'"
              ondragover="event.preventDefault();this.style.borderColor='rgba(74,144,226,.8)';this.style.background='rgba(74,144,226,.1)'"
              ondragleave="this.style.borderColor='rgba(255,255,255,.18)';this.style.background='rgba(255,255,255,.02)'"
              ondrop="event.preventDefault();App._dropImg(event)">
              <input type="file" id="rimg" accept="image/*" style="display:none" onchange="App._loadImg(this.files[0])">
              <div id="img-placeholder">
                <div style="font-size:2rem;margin-bottom:6px">📸</div>
                <div style="font-size:.88rem;color:#ccc">Tippen oder Bild hierher ziehen</div>
                <div style="font-size:.72rem;color:rgba(255,255,255,.3);margin-top:3px">JPG · PNG · max 3MB</div>
              </div>
              <div id="img-preview-wrap" style="display:none">
                <img id="img-preview" style="max-width:100%;max-height:160px;border-radius:8px;object-fit:contain">
                <div style="margin-top:6px;font-size:.75rem;color:#4af">✅ Bild geladen — <span onclick="event.stopPropagation();App._clearImg()" style="color:#E74C3C;cursor:pointer;text-decoration:underline">entfernen</span></div>
              </div>
            </div>
          </div>
          <div style="padding:10px 18px 14px">
            <div style="font-size:.68rem;color:rgba(255,165,0,.6);padding:7px 10px;background:rgba(255,165,0,.07);border-radius:7px;margin-bottom:10px">
              ⚠️ Falsche Meldungen können zur Sperrung deines Kontos führen.
            </div>
            <div style="display:flex;gap:8px">
              <button onclick="App.showGlobalLeaderboard()" style="flex:1;padding:11px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.7);border-radius:9px;cursor:pointer">${typeof t!=='undefined'?t('worldmap.cancel'):'Abbrechen'}</button>
              <button id="rsend" onclick="App._sendReport('${playerName}')"
                style="flex:2;padding:11px;background:rgba(231,76,60,.12);border:1.5px solid rgba(231,76,60,.2);
                       color:rgba(231,76,60,.4);border-radius:9px;cursor:not-allowed;font-weight:900;transition:.2s" disabled>Meldung senden</button>
            </div>
          </div>
        </div>
      </div>`);
  },

  _selectedReportReason: null,
  _reportImageB64: null,

  _pickReason(playerName, label, el) {
    this._selectedReportReason = label;
    document.querySelectorAll('[data-rid]').forEach(e => {
      e.style.background = 'rgba(255,255,255,.02)';
      e.style.borderColor = 'rgba(255,255,255,.07)';
      e.querySelector('.rck').style.opacity = '0';
    });
    el.style.background = 'rgba(231,76,60,.15)';
    el.style.borderColor = 'rgba(231,76,60,.45)';
    el.querySelector('.rck').style.opacity = '1';
    this._updateRBtn();
  },

  _updateRBtn() {
    const btn = document.getElementById('rsend');
    const desc = (document.getElementById('rdesc')?.value||'').trim();
    const ok = !!this._selectedReportReason && desc.length >= 5;
    if(!btn) return;
    btn.disabled = !ok;
    btn.style.cursor = ok ? 'pointer' : 'not-allowed';
    btn.style.background = ok ? 'rgba(231,76,60,.5)' : 'rgba(231,76,60,.12)';
    btn.style.borderColor = ok ? '#E74C3C' : 'rgba(231,76,60,.2)';
    btn.style.color = ok ? '#fff' : 'rgba(231,76,60,.4)';
  },

  _dropImg(ev) {
    const file = ev.dataTransfer?.files?.[0];
    if(file && file.type.startsWith('image/')) this._loadImg(file);
  },

  _loadImg(file) {
    if(!file) return;
    if(file.size > 3*1024*1024) { showAlert('Bild zu groß! Bitte max. 3MB.'); return; }
    const reader = new FileReader();
    reader.onload = e => {
      // Compress to max 800px wide, quality 0.7
      const img = new Image();
      img.onload = () => {
        const MAX = 800;
        let w = img.width, h = img.height;
        if(w > MAX){ h = Math.round(h*MAX/w); w = MAX; }
        const cv = document.createElement('canvas');
        cv.width = w; cv.height = h;
        cv.getContext('2d').drawImage(img, 0, 0, w, h);
        // Use JPEG for photos, PNG for screenshots with transparency
        const b64 = cv.toDataURL('image/jpeg', 0.72);
        this._reportImageB64 = b64;
        const prev = document.getElementById('img-preview');
        const prevWrap = document.getElementById('img-preview-wrap');
        const placeholder = document.getElementById('img-placeholder');
        if(prev) prev.src = b64;
        if(prevWrap) prevWrap.style.display = 'block';
        if(placeholder) placeholder.style.display = 'none';
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  },

  _clearImg() {
    this._reportImageB64 = null;
    const inp = document.getElementById('rimg');
    const prevWrap = document.getElementById('img-preview-wrap');
    const placeholder = document.getElementById('img-placeholder');
    if(inp) inp.value = '';
    if(prevWrap) prevWrap.style.display = 'none';
    if(placeholder) placeholder.style.display = 'block';
  },

  async _sendReport(playerName) {
    const reason = this._selectedReportReason;
    if(!reason) { showAlert('Bitte Grund wählen.'); return; }
    const desc = (document.getElementById('rdesc')?.value||'').trim();
    if(desc.length < 5) { showAlert('Bitte Beschreibung ausfüllen.'); return; }
    const reporter = State.currentPlayer?.name||'?';
    const btn = document.getElementById('rsend');
    if(btn) { btn.disabled=true; btn.textContent='Wird gesendet...'; }
    try {
      if(typeof _db!=='undefined'&&_db) {
        // Split image into separate doc if present (Firestore 1MB limit)
        let imageDocId = null;
        if(this._reportImageB64) {
          const imgRef = await _db.collection('report_images').add({
            imageB64: this._reportImageB64,
            ts: Date.now(),
            reporter: reporter.toLowerCase(),
            reported: playerName.toLowerCase(),
          });
          imageDocId = imgRef.id;
        }
        await _db.collection('player_reports').add({
          reported: playerName.toLowerCase(),
          reportedDisplay: playerName,
          reporter: reporter.toLowerCase(),
          reporterDisplay: reporter,
          reason, desc,
          ts: Date.now(),
          tsStr: new Date().toLocaleString('de-CH',{timeZone:'Europe/Zurich'}),
          status: 'open',
          imageDocId,  // reference to separate image doc
          hasImage: !!this._reportImageB64,
        });
      }
    } catch(e) { console.warn('Report failed:', e.message); }
    this._reportImageB64 = null;
    this._selectedReportReason = null;
    this._html(`
      <div style="text-align:center;padding:50px 20px">
        <div style="font-size:4rem;margin-bottom:16px">✅</div>
        <div style="font-weight:900;font-size:1.15rem;margin-bottom:8px">Meldung eingereicht!</div>
        <div style="color:rgba(255,255,255,.45);font-size:.9rem;max-width:300px;margin:0 auto 24px;line-height:1.5">
          Danke! Wir prüfen den Fall und informieren dich falls Maßnahmen ergriffen werden.
        </div>
        <button onclick="App.showGlobalLeaderboard()" style="padding:11px 28px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.15);color:#fff;border-radius:10px;cursor:pointer">← Zurück</button>
      </div>`);
  },

  // ═══════════════════════════════
  // ADMIN — Meldungen verwalten
  // ═══════════════════════════════
  async showAdminReports() {
    const player = State.currentPlayer;
    const name = player?.name?.toLowerCase()||'';
    if (!player || (name !== 'mischa' && name !== 'admin')) { showAlert('Kein Zugriff.'); return; }
    this._loading('Lade Meldungen...');
    let reports = [];
    let zooReports = [];
    try {
      if(typeof _db !== 'undefined' && _db) {
        const snap = await _db.collection('player_reports').orderBy('ts','desc').limit(80).get();
        snap.forEach(doc => reports.push({id: doc.id, ...doc.data()}));
      }
    } catch(e) { console.warn('Load failed:', e); }
    // Also fetch Zoo feedback reports (questions/bugs sent via the 📢 button in the Zoo)
    // — a completely separate collection from player-vs-player reports above.
    try {
      if(typeof _db !== 'undefined' && _db) {
        const zsnap = await _db.collection('zoo_reports').orderBy('ts','desc').limit(50).get();
        zsnap.forEach(doc => zooReports.push({id: doc.id, ...doc.data()}));
      }
      const zlocal = JSON.parse(localStorage.getItem('zoo_reports')||'[]');
      zlocal.forEach(r => { if(!zooReports.find(x=>x.id===r.id)) zooReports.push(r); });
      zooReports.sort((a,b)=>(b.ts||0)-(a.ts||0));
    } catch(e) { console.warn('Zoo reports load failed:', e); }

    window._rCache = {};
    reports.forEach(r => window._rCache[r.id] = r);
    window._zrCache = {};
    zooReports.forEach(r => window._zrCache[r.id] = r);

    const SC = {open:'#E74C3C', reviewing:'#F39C12', resolved:'#2ecc71', dismissed:'#888'};
    const SL = {open:'Offen', reviewing:'In Prüfung', resolved:'Erledigt', dismissed:'Abgewiesen'};
    const openCount = reports.filter(r=>r.status==='open'||!r.status).length;

    this._html(`
      <div style="max-width:620px;margin:0 auto;padding:10px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap">
          <button onclick="App.showWorldMap()" style="background:rgba(255,255,255,.1);border:none;color:#fff;padding:8px 14px;border-radius:8px;cursor:pointer;font-size:.9rem">← Zurück</button>
          <h2 style="margin:0;flex:1;font-size:1.05rem">⚑ Meldungen <span style="color:#E74C3C">(${openCount} offen)</span></h2>
          <button onclick="App.showAdminReports()" style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);color:#fff;padding:7px 12px;border-radius:8px;cursor:pointer;font-size:.8rem">🔄 Aktualisieren</button>
        </div>

        <!-- ZOO FEEDBACK — separate from player-vs-player reports above -->
        <div style="background:rgba(52,152,219,.08);border:1.5px solid rgba(52,152,219,.3);border-radius:14px;padding:12px 14px;margin-bottom:16px">
          <div style="font-weight:900;font-size:.92rem;color:#3498db;margin-bottom:8px">🎮 Feedback aus dem Zoo (Fragen/Fehler, via 📢 Melden-Knopf)</div>
          ${zooReports.length===0
            ? '<div style="text-align:center;padding:16px;color:rgba(255,255,255,.3);font-size:.85rem">Keine Zoo-Meldungen</div>'
            : zooReports.map(r=>{
                const d = r.ts ? new Date(r.ts).toLocaleString('de-CH',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : '';
                return `<div style="background:${r.done?'rgba(39,174,96,.08)':'rgba(255,255,255,.04)'};border:1px solid ${r.done?'rgba(39,174,96,.25)':'rgba(255,255,255,.08)'};border-radius:10px;padding:9px 12px;margin-bottom:6px">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                    <span style="font-weight:900;color:#3498db;font-size:.82rem">👤 ${(r.player||'?').replace(/[<>]/g,'')}</span>
                    <span style="font-size:.65rem;color:rgba(255,255,255,.4)">${d}</span>
                  </div>
                  <div style="font-size:.82rem;color:#fff;white-space:pre-wrap">${(r.text||'').replace(/[<>]/g,'')}</div>
                </div>`;
              }).join('')
          }
        </div>

        <div style="font-weight:900;font-size:.92rem;color:#ff6b6b;margin-bottom:8px">⚑ Spieler-Meldungen (Verhalten/Regelverstösse)</div>
        ${reports.length === 0
          ? '<div style="text-align:center;padding:50px;color:rgba(255,255,255,.3);font-size:1.1rem">✅ Keine Meldungen</div>'
          : reports.map(r => {
              const st = r.status||'open';
              return `<div onclick="App._openReport('${r.id}')"
                style="background:rgba(255,255,255,.03);border:1.5px solid ${st==='open'?'rgba(231,76,60,.3)':'rgba(255,255,255,.07)'};
                       border-radius:12px;padding:13px 16px;margin-bottom:7px;cursor:pointer;transition:.15s;position:relative"
                onmouseover="this.style.background='rgba(255,255,255,.07)';this.style.transform='translateX(2px)'"
                onmouseout="this.style.background='rgba(255,255,255,.03)';this.style.transform=''">
                <div style="display:flex;align-items:flex-start;gap:10px">
                  <div style="flex:1">
                    <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:4px">
                      <span style="font-weight:900;color:#ff6b6b;font-size:.95rem">⚑ ${r.reportedDisplay||r.reported||'?'}</span>
                      <span style="font-size:.68rem;padding:2px 8px;border-radius:20px;background:${SC[st]}22;color:${SC[st]};border:1px solid ${SC[st]}55;font-weight:700">${SL[st]}</span>
                      ${r.hasImage ? '<span style="font-size:.68rem;color:#4af;background:rgba(74,144,226,.1);padding:2px 7px;border-radius:20px;border:1px solid rgba(74,144,226,.3)">📸 Screenshot</span>' : ''}
                    </div>
                    <div style="font-size:.82rem;color:rgba(255,255,255,.65);margin-bottom:3px">
                      <b style="color:#FFD700">${r.reason||'?'}</b>
                      <span style="color:rgba(255,255,255,.35)"> · von ${r.reporterDisplay||r.reporter||'?'}</span>
                    </div>
                    <div style="font-size:.77rem;color:rgba(255,255,255,.35);line-height:1.4">
                      ${(r.desc||'').slice(0,100)}${(r.desc||'').length>100?'…':''}
                    </div>
                  </div>
                  <div style="text-align:right;font-size:.68rem;color:rgba(255,255,255,.25);white-space:nowrap;flex-shrink:0">
                    ${(r.tsStr||'').split(',')[0]||''}<br>
                    <span style="font-size:1rem;color:rgba(255,255,255,.2)">›</span>
                  </div>
                </div>
              </div>`;
            }).join('')
        }
      </div>`);
  },

  async _openReport(reportId) {
    const r = (window._rCache||{})[reportId];
    if(!r) { showAlert('Nicht gefunden.'); return; }
    // Load image from separate collection if needed
    let imageB64 = r.imageB64 || null;
    if(!imageB64 && r.imageDocId && typeof _db !== 'undefined' && _db) {
      try {
        const imgDoc = await _db.collection('report_images').doc(r.imageDocId).get();
        if(imgDoc.exists) imageB64 = imgDoc.data().imageB64;
        r.imageB64 = imageB64; // cache
      } catch(e) { console.warn('Image load failed:', e); }
    }

    const SC = {open:'#E74C3C', reviewing:'#F39C12', resolved:'#2ecc71', dismissed:'#888'};
    const SL = {open:'Offen', reviewing:'In Prüfung', resolved:'Erledigt', dismissed:'Abgewiesen'};
    const st = r.status||'open';

    this._html(`
      <div style="max-width:560px;margin:0 auto;padding:10px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
          <button onclick="App.showAdminReports()" style="background:rgba(255,255,255,.1);border:none;color:#fff;padding:8px 14px;border-radius:8px;cursor:pointer;font-size:.9rem">← Meldungen</button>
          <div style="font-weight:700;font-size:.95rem">Meldung — Detail</div>
        </div>

        <div style="background:rgba(20,10,30,.97);border:1.5px solid rgba(255,255,255,.1);border-radius:16px;overflow:hidden">
          <!-- Status header -->
          <div style="background:rgba(231,76,60,.1);padding:14px 18px;border-bottom:1px solid rgba(255,255,255,.07);display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-size:.72rem;color:rgba(255,255,255,.35);margin-bottom:3px">GEMELDETER SPIELER</div>
              <div style="font-weight:900;font-size:1.1rem;color:#ff6b6b">⚑ ${r.reportedDisplay||r.reported}</div>
            </div>
            <span style="font-size:.75rem;padding:4px 12px;border-radius:20px;background:${SC[st]}22;color:${SC[st]};border:1.5px solid ${SC[st]}55;font-weight:700">${SL[st]}</span>
          </div>

          <!-- Info rows -->
          <div style="padding:14px 18px">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
              <div style="background:rgba(255,255,255,.03);border-radius:9px;padding:10px 12px">
                <div style="font-size:.67rem;color:rgba(255,255,255,.35);font-weight:700;text-transform:uppercase;margin-bottom:4px">Gemeldet von</div>
                <div style="font-size:.9rem;font-weight:700">${r.reporterDisplay||r.reporter||'?'}</div>
              </div>
              <div style="background:rgba(255,255,255,.03);border-radius:9px;padding:10px 12px">
                <div style="font-size:.67rem;color:rgba(255,255,255,.35);font-weight:700;text-transform:uppercase;margin-bottom:4px">Datum</div>
                <div style="font-size:.85rem">${r.tsStr||'?'}</div>
              </div>
            </div>

            <div style="background:rgba(231,76,60,.08);border:1px solid rgba(231,76,60,.2);border-radius:9px;padding:11px 13px;margin-bottom:12px">
              <div style="font-size:.67rem;color:rgba(255,255,255,.35);font-weight:700;text-transform:uppercase;margin-bottom:4px">Grund</div>
              <div style="font-size:.95rem;font-weight:900;color:#ff6b6b">${r.reason||'?'}</div>
            </div>

            <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:9px;padding:11px 13px;margin-bottom:14px">
              <div style="font-size:.67rem;color:rgba(255,255,255,.35);font-weight:700;text-transform:uppercase;margin-bottom:6px">Beschreibung</div>
              <div style="font-size:.88rem;line-height:1.6;color:rgba(255,255,255,.85)">${r.desc||'<i style="opacity:.4">Keine Beschreibung angegeben</i>'}</div>
            </div>

            ${imageB64 ? `
            <div style="margin-bottom:14px">
              <div style="font-size:.67rem;color:rgba(255,255,255,.35);font-weight:700;text-transform:uppercase;margin-bottom:7px">📸 BEWEIS-SCREENSHOT</div>
              <div style="border-radius:10px;overflow:hidden;border:2px solid rgba(74,144,226,.3);cursor:pointer;background:#000;text-align:center"
                onclick="App._fullscreenImg('${imageB64}')">
                <img src="${imageB64}" style="max-width:100%;max-height:220px;object-fit:contain;display:block;margin:0 auto">
                <div style="padding:5px;font-size:.72rem;color:rgba(74,144,226,.7);background:rgba(74,144,226,.06)">🔍 Tippen zum Vergrößern</div>
              </div>
            </div>` : r.hasImage ? `
            <div style="margin-bottom:14px;padding:12px;border-radius:9px;background:rgba(255,165,0,.07);border:1px solid rgba(255,165,0,.2);text-align:center;color:rgba(255,165,0,.7);font-size:.82rem">
              ⏳ Screenshot wird geladen...
            </div>` : ''}
          </div>

          <!-- Status buttons -->
          <div style="padding:0 18px 8px">
            <div style="font-size:.67rem;color:rgba(255,255,255,.35);font-weight:700;text-transform:uppercase;margin-bottom:7px">Status ändern</div>
            <div style="display:flex;gap:5px;flex-wrap:wrap">
              ${Object.entries(SL).map(([k,v]) => `
                <button onclick="App._setStatus('${reportId}','${k}')"
                  style="flex:1;min-width:70px;padding:8px 5px;border-radius:8px;font-size:.75rem;font-weight:700;cursor:pointer;transition:.15s;
                         background:${k===st?SC[k]+'44':'rgba(255,255,255,.06)'};
                         border:1.5px solid ${k===st?SC[k]:' rgba(255,255,255,.1)'};
                         color:${k===st?SC[k]:'rgba(255,255,255,.5)'}">${v}</button>
              `).join('')}
            </div>
          </div>

          <!-- Ban actions -->
          <div style="padding:10px 18px 16px">
            <div style="background:rgba(231,76,60,.07);border:1.5px solid rgba(231,76,60,.2);border-radius:12px;padding:14px">
              <div style="font-weight:900;color:#E74C3C;margin-bottom:10px;display:flex;align-items:center;gap:7px">
                🚫 <span>Spieler sperren</span>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
                <!-- Ban reported -->
                <div style="background:rgba(0,0,0,.2);border-radius:9px;padding:10px">
                  <div style="font-size:.72rem;color:rgba(255,255,255,.4);margin-bottom:7px;font-weight:700">⚑ ${r.reportedDisplay||r.reported}</div>
                  <select id="ban-dur-reported" style="width:100%;padding:7px 8px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);color:#fff;border-radius:7px;font-size:.8rem;margin-bottom:7px">
                    <option value="3600000">1 Stunde</option>
                    <option value="86400000" selected>24 Stunden</option>
                    <option value="259200000">3 Tage</option>
                    <option value="604800000">7 Tage</option>
                    <option value="2592000000">30 Tage</option>
                    <option value="0">Permanent</option>
                  </select>
                  <button onclick="App._doBan('${r.reportedDisplay||r.reported}','${reportId}','reported')"
                    style="width:100%;padding:9px;background:rgba(231,76,60,.4);border:1.5px solid rgba(231,76,60,.6);color:#fff;border-radius:8px;cursor:pointer;font-weight:700;font-size:.82rem">
                    🚫 Sperren
                  </button>
                  <button onclick="App._doUnban('${r.reportedDisplay||r.reported}')"
                    style="width:100%;margin-top:5px;padding:8px;background:rgba(39,174,96,.1);border:1px solid rgba(39,174,96,.25);color:#2ecc71;border-radius:7px;cursor:pointer;font-size:.78rem">
                    ✅ Freigeben
                  </button>
                </div>
                <!-- Ban reporter (false report) -->
                <div style="background:rgba(0,0,0,.2);border-radius:9px;padding:10px">
                  <div style="font-size:.72rem;color:rgba(255,255,255,.4);margin-bottom:7px;font-weight:700">📢 ${r.reporterDisplay||r.reporter} (Melder)</div>
                  <select id="ban-dur-reporter" style="width:100%;padding:7px 8px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);color:#fff;border-radius:7px;font-size:.8rem;margin-bottom:7px">
                    <option value="3600000">1 Stunde</option>
                    <option value="86400000" selected>24 Stunden</option>
                    <option value="259200000">3 Tage</option>
                    <option value="604800000">7 Tage</option>
                    <option value="2592000000">30 Tage</option>
                    <option value="0">Permanent</option>
                  </select>
                  <button onclick="App._doBan('${r.reporterDisplay||r.reporter}','${reportId}','reporter')"
                    style="width:100%;padding:9px;background:rgba(231,76,60,.4);border:1.5px solid rgba(231,76,60,.6);color:#fff;border-radius:8px;cursor:pointer;font-weight:700;font-size:.82rem">
                    🚫 Sperren
                  </button>
                  <button onclick="App._doUnban('${r.reporterDisplay||r.reporter}')"
                    style="width:100%;margin-top:5px;padding:8px;background:rgba(39,174,96,.1);border:1px solid rgba(39,174,96,.25);color:#2ecc71;border-radius:7px;cursor:pointer;font-size:.78rem">
                    ✅ Freigeben
                  </button>
                </div>
              </div>
              <input id="ban-reason-txt" value="${(r.reason||'').replace(/"/g,"'")}" placeholder="Sperrgrund"
                style="width:100%;box-sizing:border-box;padding:8px 10px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#fff;border-radius:7px;font-size:.85rem">
            </div>
          </div>
        </div>
      </div>`);
  },

  _fullscreenImg(src) {
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:99999;display:flex;align-items:center;justify-content:center;cursor:zoom-out;padding:10px';
    ov.onclick = () => ov.remove();
    const img = document.createElement('img');
    img.src = src;
    img.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;border-radius:8px;box-shadow:0 0 60px rgba(0,0,0,.8)';
    ov.appendChild(img);
    document.body.appendChild(ov);
  },

  async _setStatus(reportId, status) {
    try {
      if(typeof _db!=='undefined'&&_db) await _db.collection('player_reports').doc(reportId).update({status});
      if(window._rCache?.[reportId]) window._rCache[reportId].status = status;
      await this._openReport(reportId);
    } catch(e) { showAlert('Fehler: '+e.message); }
  },

  async _doBan(playerName, reportId, who) {
    const selectId = who === 'reported' ? 'ban-dur-reported' : 'ban-dur-reporter';
    const dur = parseInt(document.getElementById(selectId)?.value||'86400000');
    const reason = document.getElementById('ban-reason-txt')?.value||'Regelverstoß';
    if(!(await showConfirm(`"${playerName}" sperren?
Grund: ${reason}`))) return;
    try {
      if(typeof _db!=='undefined'&&_db) {
        await _db.collection('player_bans').doc(playerName.toLowerCase()).set({
          reason, bannedAt: Date.now(), permanent: dur===0,
          expiresAt: dur===0 ? null : Date.now()+dur,
          bannedBy: State.currentPlayer?.name||'admin', reportId,
        });
        if(who==='reported') await _db.collection('player_reports').doc(reportId).update({status:'resolved'});
      }
      showAlert(`✅ ${playerName} gesperrt${dur===0?' (permanent)':' für '+(dur/3600000<24?dur/3600000+'h':dur/86400000+'d')}.`);
      this.showAdminReports();
    } catch(e) { showAlert('Fehler: '+e.message); }
  },

  async _doUnban(playerName) {
    if(!(await showConfirm(`Sperrung von "${playerName}" aufheben?`))) return;
    try {
      if(typeof _db!=='undefined'&&_db) await _db.collection('player_bans').doc(playerName.toLowerCase()).delete();
      showAlert(`✅ ${playerName} freigegeben.`);
    } catch(e) { showAlert('Fehler: '+e.message); }
  },


  async _checkAdminMessages(playerName) {
    try {
      if(typeof _db === 'undefined' || !_db || !playerName) return;
      const snap = await _db.collection('player_messages')
        .where('target','==',playerName.toLowerCase())
        .limit(5).get();
      if(snap.empty) return;
      const msgs = [];
      snap.forEach(doc => msgs.push({id:doc.id,...doc.data()}));
      msgs.sort((a,b)=>(b.ts||0)-(a.ts||0));
      const latest = msgs[0];
      if(!latest) return;
      // Check if already seen
      const seenKey = 'msg_seen_'+latest.id;
      if(sessionStorage.getItem(seenKey)) return;
      sessionStorage.setItem(seenKey,'1');
      // Show message banner
      const icon = {info:'ℹ️',warn:'⚠️',ban_warn:'🚫',broadcast:'📢'}[latest.type]||'📢';
      const color = {info:'#29B6F6',warn:'#FFD700',ban_warn:'#E74C3C',broadcast:'#27AE60'}[latest.type]||'#29B6F6';
      const banner = document.createElement('div');
      banner.style.cssText=`position:fixed;top:0;left:0;right:0;z-index:9999;background:${color};color:#000;padding:12px 16px;text-align:center;font-weight:700;font-size:.92rem;animation:slideDown .4s ease;cursor:pointer`;
      banner.innerHTML=`${icon} ${latest.text} <span style="float:right;opacity:.7">✕</span>`;
      banner.onclick=()=>banner.remove();
      document.body.prepend(banner);
      setTimeout(()=>banner?.remove(),8000);
    } catch(e) {}
  },

  _setupOrientationHandler() {
    const handle = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      const isMobile = window.innerWidth < 900;
      document.body.classList.toggle('landscape-mode', isLandscape);
      document.body.classList.toggle('portrait-mode', !isLandscape);
      document.body.classList.toggle('mobile-device', isMobile);
      // Resize canvases dynamically
      document.querySelectorAll('#game-area canvas').forEach(cv => {
        if(isLandscape && isMobile) {
          cv.style.maxHeight = (window.innerHeight - 65) + 'px';
          cv.style.width = 'auto';
          cv.style.maxWidth = '100%';
        } else {
          cv.style.maxHeight = '';
          cv.style.width = '100%';
          cv.style.maxWidth = '';
        }
      });
    };
    window.addEventListener('resize', handle);
    window.addEventListener('orientationchange', () => setTimeout(handle, 100));
    handle(); // initial
  },
  
  _toggleZoom() {
    const levels = [1, 1.25, 1.5, 1.75, 2.0, 2.5, 0.85];
    this._zoomLevel = this._zoomLevel || 1;
    const currentIdx = levels.findIndex(l => Math.abs(l - this._zoomLevel) < 0.05);
    this._zoomLevel = levels[(currentIdx + 1) % levels.length];
    const ga = document.getElementById('game-area');
    const btn = document.getElementById('zoom-btn');
    if (ga) {
      ga.style.transform = `scale(${this._zoomLevel})`;
      ga.style.transformOrigin = 'top center';
      ga.style.marginBottom = this._zoomLevel > 1 ? 
        Math.round((this._zoomLevel - 1) * 200) + 'px' : '0';
    }
    if (btn) {
      btn.textContent = this._zoomLevel === 1 ? '🔍' : `🔍 ${Math.round(this._zoomLevel*100)}%`;
      btn.style.background = this._zoomLevel !== 1 ? 'rgba(41,182,246,.25)' : 'rgba(41,182,246,.12)';
    }
  },

  async _confirmLeave(worldId) {
    console.log('[iOS-debug] _confirmLeave() aufgerufen, worldId='+worldId);
    this._zoomLevel = 1; // Reset zoom on leave
    if(typeof SokobanGame !== 'undefined' && SokobanGame._cleanup) SokobanGame._cleanup();
    let confirmed=false;
    try{ confirmed = await showConfirm('Aufgabe verlassen?\nDein Fortschritt in dieser Aufgabe geht verloren.'); }
    catch(err){ console.warn('[iOS-debug] showConfirm() Fehler: '+(err&&err.message)); }
    console.log('[iOS-debug] showConfirm() Ergebnis: '+confirmed);
    if (confirmed) {
      // Stop any running timers in games
      try { clearInterval(MemoryGame._timerInterval); } catch(e){}
      try { clearInterval(DifferencesGame._timerInterval); } catch(e){}
      try { clearTimeout(ReactionGame.current?.timer); } catch(e){}
      this.showWorld(worldId);
    }
  },

  async useJokerInGame(worldId, taskIndex) {
    const player = await State.refreshCurrentPlayer();
    if (State.getJokersRemaining(player, worldId) === 0) return;
    if (await showConfirm('🃏 Joker einsetzen? Aufgabe zählt als geschafft!')) {
      await State.useJoker(player.name, worldId, taskIndex);
      this._showTaskComplete(worldId, taskIndex, { rawScore:0, timeMs:0, errors:0, passed:true }, true);
    }
  },

  async _showTaskComplete(worldId, taskIndex, result, wasJoker=false) {
    let player;
    try {
      player = await Promise.race([
        State.refreshCurrentPlayer(),
        new Promise(r => setTimeout(() => r(State.currentPlayer), 2000))
      ]);
    } catch(e) { player = State.currentPlayer; }
    if (!player) { this.showWorldMap(); return; }
    const world  = WORLDS.find(w=>w.id===worldId);
    const ws = player.worlds?.[worldId] || player.worlds?.[String(worldId)] || {};
    const allDone = (ws.tasks||[]).filter(t=>t&&t.done).length >= (world?.tasks?.length||20);
    const finalScore = wasJoker ? 0 : State.calcFinalScore(result);
    // Calculate MT earned for display
    // Read MT from locally saved task (set by preliminary calc in onComplete)
    const _wid = String(worldId);
    const _savedTask = player?.worlds?.[_wid]?.tasks?.[taskIndex] || player?.worlds?.[worldId]?.tasks?.[taskIndex];
    const mtEarned = wasJoker ? 0 : (_savedTask?.mt ?? (result.passed !== false ? 1.0 : 0.2));

    this._html(`
      <div class="mountain-bg"><div class="sky-gradient"></div>${mountainSVG()}</div>
      <div class="page">
        <div class="overlay-box">
          <div class="overlay-emoji">${wasJoker?'🃏':allDone?'🏆':'⭐'}</div>
          <div class="overlay-title">${wasJoker?'Joker!':'Super!'}</div>
          <div class="overlay-msg">
            ${wasJoker?'Aufgabe geschafft.':finalScore>0?`✅ Geschafft! +${(isNaN(mtEarned)||!isFinite(mtEarned))?'1.0':(mtEarned||1).toFixed(1)} 🌀 MT verdient!`:'Weiter geht\'s! +0.2 🌀 MT'}
            ${allDone?`<br><br>🎉 <b>Welt "${world.name}"</b> komplett!`:''}
          </div>

          ${allDone && worldId === 10 ? `
            <button class="btn btn-gold btn-full" style="margin-bottom:10px" onclick="App.showResetOffer()">
              🏆 Alle Welten geschafft! Reset?
            </button>` : ''}
          <button class="btn btn-primary btn-full" onclick="App.showWorld(${worldId})">Weiter in Welt ${worldId} ➜</button>
          <br><br>
          <button class="btn" style="background:#F5F5F5;color:var(--text-mid);font-size:0.9rem" onclick="App.showWorldMap()">Alle Welten</button>
        </div>
      </div>`);
    // Check for leaderboard rank changes (fire-and-forget, doesn't block the screen above)
    if (!wasJoker && typeof RankNotify!=='undefined') RankNotify.check(player.name);
  },

  async showResetOffer() {
    const player = await State.refreshCurrentPlayer();
    const resets = player.resets || 0;
    const newMult = State._resetMultiplier(resets + 1);
    const isAdminUnlock = resets >= 9; // 10 resets = admin chat

    this._html(`
      <div class="mountain-bg"><div class="sky-gradient"></div>${mountainSVG()}</div>
      <div class="page">
        <div class="card" style="max-width:400px;text-align:center">
          <div style="font-size:4rem;margin-bottom:10px">🏆</div>
          <div class="card-title">Alle 10 Welten geschafft!</div>
          <div style="font-size:1rem;color:var(--text-mid);margin-bottom:16px">
            Du hast das gesamte Spiel ${resets > 0 ? `zum ${resets+1}. Mal ` : ''}abgeschlossen!
          </div>
          <div style="background:linear-gradient(135deg,#EBF5FB,#D6EAF8);border-radius:14px;padding:16px;margin-bottom:16px">
            <div style="font-family:Arial,sans-serif;font-size:1.2rem;color:var(--mountain-dark);margin-bottom:6px">
              🔄 Neu starten mit Bonus
            </div>
            <div style="font-size:0.9rem;color:var(--text-mid);margin-bottom:8px">
              Wenn du zurücksetzt bekommst du einen permanenten Punkte-Multiplikator:
            </div>
            <div style="font-family:Arial,sans-serif;font-size:2rem;background:linear-gradient(90deg,#FF6B6B,#FFD700,#27AE60);
              -webkit-background-clip:text;-webkit-text-fill-color:transparent">
              ×${newMult.toFixed(1)} Multiplikator!
            </div>
            ${isAdminUnlock ? `<div style="margin-top:8px;font-size:1rem;color:#E74C3C;font-weight:700">
              🔐 Nach 10 Resets: Admin-Chat freigeschaltet!
            </div>` : `<div style="font-size:0.95rem;color:var(--text-mid);margin-top:6px">
              Nach 10 Resets: Admin-Chat freischalten 🔐
            </div>`}
          </div>
          <button class="btn btn-primary btn-full btn-big" onclick="App._doReset()">
            🔄 Zurücksetzen & ${newMult.toFixed(1)}× Bonus holen!
          </button>
          <button class="btn btn-secondary btn-full" style="margin-top:10px" onclick="App.showWorldMap()">
            Nein danke, weiter so
          </button>
        </div>
      </div>`);
  },

  async _doReset() {
    const player = await State.refreshCurrentPlayer();
    const resets = (player.resets || 0) + 1;
    const newMult = State._resetMultiplier(resets);
    player.resets = resets;
    player.resetMultiplier = newMult;
    player.currentWorld = 1;
    player.worlds = State._emptyWorlds ? State._emptyWorlds() : {};
    if (!player.worlds[1]) {
      for (let i=1;i<=10;i++) player.worlds[i]={tasks:Array(10).fill(null),jokerUsed:false,completed:false};
    }
    // Unlock admin chat after 10 resets
    if (resets >= 10) player.adminChatUnlocked = true;
    await State.savePlayer(player);
    State.currentPlayer = player;
    App.showWorldMap();
  },

  _portalTransition(fromWorldId) {
    const next = WORLDS.find(w=>w.id===fromWorldId+1);
    // ── Unlock next world immediately (local + saved) ──
    const _p = State.currentPlayer;
    if (_p) {
      if ((_p.currentWorld||1) <= fromWorldId) {
        _p.currentWorld = fromWorldId + 1;
        State._local.set(_p.name, _p);
        // Persist locally so it survives page refresh
        try {
          const _ls = JSON.parse(localStorage.getItem('mischa_players')||'{}');
          if (!_ls[_p.name]) _ls[_p.name] = {};
          _ls[_p.name].currentWorld = fromWorldId + 1;
          localStorage.setItem('mischa_players', JSON.stringify(_ls));
        } catch(e) {}
        State.savePlayer(_p).catch(()=>{});
      }
    }
    this._html(`
      <div style="position:fixed;inset:0;background:linear-gradient(135deg,#1a0535,#0a2a5e);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:999">
        <div style="font-size:5rem;animation:spin 1s linear infinite">🌀</div>
        <div style="font-family:Arial,sans-serif;color:white;font-size:1.6rem;margin:18px 0;text-align:center">Teleportation...</div>
        <div style="color:rgba(255,255,255,0.6);font-size:1rem">${next?.icon||''} ${next?.name||''}</div>
        <div style="position:absolute;inset:0;pointer-events:none;overflow:hidden">
          ${Array.from({length:25},(_,i)=>`<div style="position:absolute;color:white;font-size:${8+Math.random()*18}px;left:${Math.random()*100}%;top:${Math.random()*100}%;animation:twinkle ${1+Math.random()*2}s ease-in-out infinite ${Math.random()}s;opacity:0.7">⭐</div>`).join('')}
        </div>
      </div>
      <style>
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes twinkle{0%,100%{opacity:0.15}50%{opacity:1}}
      </style>`);
    setTimeout(() => this.showWorld(fromWorldId+1), 2600);
  },
};

// ============================================================
// HELPERS
// ============================================================
function mountainSVG(evening=false) {
  const lavRows = [0,1,2,3,4,5,6,7,8,9,10].map(i=>
    `<rect x="${i*34}" y="156" width="28" height="12" rx="6" fill="#9B59B6" opacity="0.65"/>` +
    `<rect x="${i*34+4}" y="162" width="20" height="6" rx="3" fill="#7D3C98" opacity="0.5"/>`
  ).join('');
  return `<svg class="mountain-svg" viewBox="0 0 375 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">
    <defs>
      <linearGradient id="chateau-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#5DADE2"/><stop offset="100%" stop-color="#AED6F1"/>
      </linearGradient>
    </defs>
    <rect width="375" height="200" fill="url(#chateau-sky)"/>
    <!-- Hügel -->
    <ellipse cx="60" cy="130" rx="100" ry="35" fill="#27AE60" opacity="0.3"/>
    <ellipse cx="310" cy="125" rx="120" ry="40" fill="#1E8449" opacity="0.25"/>
    <!-- Zypressen links -->
    <ellipse cx="18" cy="118" rx="7" ry="28" fill="#1A5276" opacity="0.8"/>
    <ellipse cx="32" cy="122" rx="6" ry="22" fill="#1A5276" opacity="0.7"/>
    <!-- Zypressen rechts -->
    <ellipse cx="344" cy="116" rx="7" ry="30" fill="#1A5276" opacity="0.8"/>
    <ellipse cx="358" cy="121" rx="6" ry="24" fill="#1A5276" opacity="0.7"/>
    <!-- Hauptgebäude -->
    <rect x="135" y="90" width="105" height="70" fill="#F0E6D3"/>
    <rect x="135" y="90" width="105" height="70" fill="none" stroke="#C8A97A" stroke-width="1.5"/>
    <!-- Dach -->
    <polygon points="130,90 187,55 245,90" fill="#C0392B"/>
    <!-- Fenster -->
    <rect x="148" y="100" width="14" height="18" rx="7" fill="#AED6F1" stroke="#C8A97A" stroke-width="1"/>
    <rect x="170" y="100" width="14" height="18" rx="7" fill="#AED6F1" stroke="#C8A97A" stroke-width="1"/>
    <rect x="213" y="100" width="14" height="18" rx="7" fill="#AED6F1" stroke="#C8A97A" stroke-width="1"/>
    <rect x="192" y="100" width="14" height="18" rx="7" fill="#AED6F1" stroke="#C8A97A" stroke-width="1"/>
    <!-- Türe -->
    <rect x="179" y="128" width="18" height="32" rx="9" fill="#8B6914"/>
    <!-- Linker Turm -->
    <rect x="108" y="98" width="32" height="62" fill="#E8DCC8"/>
    <polygon points="104,98 124,68 144,98" fill="#C0392B"/>
    <rect x="115" y="110" width="11" height="14" rx="5.5" fill="#AED6F1" stroke="#C8A97A" stroke-width="1"/>
    <!-- Rechter Turm -->
    <rect x="235" y="98" width="32" height="62" fill="#E8DCC8"/>
    <polygon points="231,98 251,68 271,98" fill="#C0392B"/>
    <rect x="249" y="110" width="11" height="14" rx="5.5" fill="#AED6F1" stroke="#C8A97A" stroke-width="1"/>
    <!-- Türmchen -->
    <rect x="120" y="62" width="8" height="14" fill="#E8DCC8"/>
    <polygon points="118,62 124,50 130,62" fill="#922B21"/>
    <rect x="247" y="62" width="8" height="14" fill="#E8DCC8"/>
    <polygon points="245,62 251,50 257,62" fill="#922B21"/>
    <!-- Fahne -->
    <line x1="188" y1="30" x2="188" y2="55" stroke="#5D6D7E" stroke-width="1.5"/>
    <polygon points="188,30 205,37 188,44" fill="#E74C3C"/>
    <!-- Lavendelfelder -->
    <rect x="0" y="160" width="375" height="40" fill="#7EC8A4"/>
    ${lavRows}
    <!-- Sonne -->
    <circle cx="342" cy="28" r="18" fill="#F9E79F" opacity="0.9"/>
    <circle cx="342" cy="28" r="13" fill="#F4D03F"/>
    <!-- Wolken -->
    <ellipse cx="75" cy="22" rx="26" ry="10" fill="white" opacity="0.85"/>
    <ellipse cx="88" cy="16" rx="18" ry="12" fill="white" opacity="0.85"/>
    <ellipse cx="60" cy="18" rx="14" ry="9" fill="white" opacity="0.85"/>
    <ellipse cx="212" cy="18" rx="22" ry="9" fill="white" opacity="0.75"/>
    <ellipse cx="224" cy="12" rx="15" ry="11" fill="white" opacity="0.75"/>
  </svg>`;
}

function worldPathSVG(worldId, doneCount, charEmoji, worldIcon) {
  const wps = [[8,85],[18,78],[30,68],[42,58],[55,50],[65,42],[75,35],[83,28],[90,20],[96,14]];
  const charPos = doneCount > 0 ? wps[Math.min(doneCount-1, wps.length-1)] : wps[0];
  const pathD = wps.map((p,i)=>`${i===0?'M':'L'}${p[0]},${p[1]}`).join(' ');
  const pathColors = {1:'#2980B9',2:'#8E44AD',3:'#27AE60',4:'#E67E22',5:'#E74C3C',6:'#16A085',7:'#D35400',8:'#E30613',9:'#7F8C8D',10:'#2C3E50'};
  const bgColors = {1:'#B8DCE8',2:'#E8D5F5',3:'#D5EFD8',4:'#FAD7A0',5:'#FADBD8',6:'#D5F0EB',7:'#FAD7B0',8:'#FFD5D5',9:'#E5E8EA',10:'#D5DAE0'};
  const col = pathColors[worldId]||'#5D6D7E';
  const bg  = bgColors[worldId]||'#E8F4FD';
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:120px;display:block">
    <rect width="100" height="100" fill="${bg}"/>
    <path d="${pathD}" fill="none" stroke="${col}" stroke-width="2.5" stroke-dasharray="2,1.5" stroke-linecap="round" opacity="0.7"/>
    ${wps.slice(0,doneCount).map(wp=>`<circle cx="${wp[0]}" cy="${wp[1]}" r="2" fill="${col}" opacity="0.7"/>`).join('')}
    ${wps.slice(doneCount).map(wp=>`<circle cx="${wp[0]}" cy="${wp[1]}" r="1.5" fill="#95A5A6" opacity="0.4"/>`).join('')}
    <text x="${wps[wps.length-1][0]}" y="${wps[wps.length-1][1]-4}" font-size="8" text-anchor="middle">${worldIcon}</text>
    <text x="${charPos[0]}" y="${charPos[1]}" font-size="9" text-anchor="middle" dominant-baseline="middle" style="filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3))">${charEmoji}</text>
    <text x="2" y="6" font-size="3.5" fill="rgba(0,0,0,0.35)">Welt ${worldId}</text>
    <text x="98" y="6" font-size="3.5" fill="rgba(0,0,0,0.35)" text-anchor="end">${doneCount}/10 ✓</text>
  </svg>`;
}

function getTaskInstruction(type, worldId) {
  const ICONS = {
    math:'🔢', reaction:'⚡', memory:'🧠', train:'🚂', shutthebox:'🎲',
    jenga:'🏎️', stunt:'🏎️', slider:'🧩', wordsearch:'🔤', typing:'⌨️', balloon:'🐍',
    simon:'🎨', truefalse:'❓', dart:'🎯', anagram:'🔤', colormix:'🎨',
    clock:'🕐', flags:'🌍', hangman:'🎯', tictactoe:'❌', weight:'⚖️',
    basketball:'🏀', emojistory:'📖', geo:'🗺️', french:'🇫🇷', riddle:'🧩',
    pacman:'🟡', starwars:'🚀', pong:'🏓', tetris:'🟩',
  };
  const icon = ICONS[type] || '🎮';
  const INSTRUCTIONS = {
    dart:        typeof t!=='undefined'?t('instr.dart'):'🎯 <b>Dart!</b><br>Wirf 3 Pfeile auf die Scheibe. Klicke oder tippe auf die Scheibe — je näher zur Mitte, desto mehr Punkte!<br>📱 Handy/Tablet: Das Steuerkreuz rechts neben der Scheibe zum Zielen nutzen, loslassen = Wurf.',
    math:        typeof t!=='undefined'?t('instr.math'):'🔢 <b>Rechnen!</b><br>Löse Mathe-Aufgaben so schnell wie möglich. Tippe die richtige Antwort ein und bestätige mit Enter.',
    reaction:    typeof t!=='undefined'?t('instr.reaction'):'⚡ <b>Reaktion!</b><br>Drücke den Knopf so schnell wie möglich, sobald das Signal erscheint. Warte auf grün!',
    memory:      typeof t!=='undefined'?t('instr.memory'):'🧠 <b>Memory!</b><br>Finde alle Paare! Drehe zwei Karten um — stimmen sie überein, bleiben sie offen.',
    train:       typeof t!=='undefined'?t('instr.train'):'🚂 <b>Zug!</b><br>Lenke den Zug ans Ziel. Tippe auf die Weichen, um die Richtung zu ändern.',
    shutthebox:  typeof t!=='undefined'?t('instr.shutthebox'):'🎲 <b>Shut the Box!</b><br>Würfle und lege Zahlen um, deren Summe der Würfelzahl entspricht. Lege alle Zahlen um!',
    sokoban:     typeof t!=='undefined'?t('instr.sokoban'):'📦 <b>Sokoban!</b><br>Schiebe die Kisten auf die markierten Zielfelder. Du kannst Kisten nur schieben, nicht ziehen!',
    jenga:       typeof t!=='undefined'?t('instr.jenga'):'🏎️ <b>Race — 1km Rennen!</b><br>Fahre 1 km so schnell wie möglich.<br>📱 Mobile: Gas / Bremse / Drehen-Buttons<br>🖥️ Desktop: → Gas · ← Bremse · ↑ Drehen CW · ↓ Drehen CCW<br>Springe über Hügel — Überschlag = Ende!',
    stunt:       typeof t!=='undefined'?t('instr.stunt'):'🏎️ <b>Race — 1km Rennen!</b><br>Fahre 1 km so schnell wie möglich.<br>📱 Mobile: Gas / Bremse / Drehen-Buttons<br>🖥️ Desktop: → Gas · ← Bremse · ↑ Drehen CW · ↓ Drehen CCW<br>Springe über Hügel — Überschlag = Ende!',
    slider:      typeof t!=='undefined'?t('instr.slider'):'🧩 <b>Schiebepuzzle!</b><br>Schiebe die Teile, bis das Bild vollständig ist. Tippe auf ein Teil neben dem Leerfeld, um es zu verschieben.',
    wordsearch:  typeof t!=='undefined'?t('instr.wordsearch'):'🔤 <b>Wortsuche!</b><br>Finde alle versteckten Wörter im Buchstabengitter. Wische über die Buchstaben.',
    typing:      typeof t!=='undefined'?t('instr.typing'):'🟩 <b>Tetris!</b><br>Bewege und drehe fallende Blöcke, um vollständige Reihen zu bilden.<br>📱 Mobile: Buttons zum Steuern<br>🖥️ Desktop: ← → bewegen · ↑ oder Leertaste drehen · ↓ schneller fallen lassen.',
    balloon:     typeof t!=='undefined'?t('instr.balloon'):'🐍 <b>Snake!</b><br>Steuere die Schlange mit den Pfeiltasten oder Wischen. Friss Äpfel, werde länger — berühre nicht dich selbst!',
    simon:       typeof t!=='undefined'?t('instr.simon'):'🎨 <b>Simon!</b><br>Merke dir die Farbfolge und wiederhole sie. Wird nach jeder Runde länger.',
    truefalse:   typeof t!=='undefined'?t('instr.truefalse'):'❓ <b>Wahr oder Falsch?</b><br>Beantworte Fragen mit Wahr oder Falsch. Tippe auf den richtigen Knopf.',
    anagram:     typeof t!=='undefined'?t('instr.anagram'):'🔤 <b>Anagramm!</b><br>Ordne die durcheinander gewürfelten Buchstaben zum richtigen Wort.',
    colormix:    typeof t!=='undefined'?t('instr.colormix'):'🎨 <b>Farben mischen!</b><br>Mische die richtigen Farben, um den gewünschten Farbton zu erreichen.',
    clock:       typeof t!=='undefined'?t('instr.clock'):'🕐 <b>Uhr!</b><br>Stelle die Uhrzeiger auf die angezeigte Zeit.',
    flags:       typeof t!=='undefined'?t('instr.flags'):'🌍 <b>Flaggen!</b><br>Erkenne die Flagge und wähle das richtige Land.',
    hangman:     typeof t!=='undefined'?t('instr.hangman'):'🎯 <b>Hangman!</b><br>Errate das versteckte Wort Buchstabe für Buchstabe.',
    tictactoe:   typeof t!=='undefined'?t('instr.tictactoe'):'❌ <b>Tic-Tac-Toe!</b><br>Setze 3 in einer Reihe gegen den Computer.',
    weight:      typeof t!=='undefined'?t('instr.weight'):'⚖️ <b>Gewichte!</b><br>Schätze welche Seite der Waage schwerer ist.',
    basketball:  typeof t!=='undefined'?t('instr.basketball'):'🏀 <b>Basketball!</b><br>Wirf den Ball ins Korb — tippe auf den Knopf im richtigen Moment.',
    emojistory:  typeof t!=='undefined'?t('instr.emojistory'):'📖 <b>Emoji Story!</b><br>Errate die Geschichte oder den Film hinter den Emojis.',
    geo:         typeof t!=='undefined'?t('instr.geo'):'🗺️ <b>Geografie!</b><br>Zeige auf die richtige Position auf der Karte.',
    french:      typeof t!=='undefined'?t('instr.french'):'🇫🇷 <b>Französisch!</b><br>Übersetze die Wörter von Deutsch nach Französisch.',
    riddle:      typeof t!=='undefined'?t('instr.riddle'):'🧩 <b>Rätsel!</b><br>Löse das Rätsel und tippe deine Antwort ein.',
    pacman:      typeof t!=='undefined'?t('instr.pacman'):'🎯 <b>Bomber!</b><br>Zerstöre ALLE Geister mit deinen Bomben. 💣 legt eine Bombe — sie explodiert nach 2 Sekunden in vier Richtungen. Wände blocken den Strahl. Sammle magische Steine 💎 (oder töte Geister), um den Bomben-Strahl zu verlängern!<br>📱 Mobil: Richtungstasten + 💣-Knopf, oder Gerät neigen<br>🖥️ Desktop: Pfeiltasten + Leertaste',
    catapult:    typeof t!=='undefined'?t('instr.catapult'):'🥐 <b>Croissant-Schleuder!</b><br>Ziehe die Schleuder zurück und lass los, um zu schiessen! Triff die Croissants 🥐 und Baguettes 🥖 — bewegte Ziele bringen mehr Punkte als stehende. Du hast 10 Schüsse.<br>📱 Mobile: mit dem Finger ziehen<br>🖥️ Desktop: mit der Maus ziehen',
    starwars:    typeof t!=='undefined'?t('instr.starwars'):'🚀 <b>Star Wars — Weltraum-Shooter!</b><br>Schiesse die feindlichen Raumschiffe ab, bevor sie landen! Du hast 3 Leben.<br>📱 Mobile: ◀ ▶ zum Bewegen, Schiessen-Button<br>🖥️ Desktop: ← → bewegen, Leertaste schiessen',
    pong:        typeof t!=='undefined'?t('instr.pong'):'🏓 <b>Pong — Tennis-Klassiker!</b><br>Der Ball wird mit der Zeit SCHNELLER — reagiere rechtzeitig! Erste 7 Punkte gewinnt oder wer nach 60s mehr hat.<br>📱 Mobile: ▲ ▼ Buttons<br>🖥️ Desktop: ↑ ↓ Pfeiltasten',
  };
  const instr = INSTRUCTIONS[type] || (typeof t!=='undefined'?t('instr.fallback'):`🎮 <b>Los geht's!</b><br>Spiele das Spiel so gut du kannst!`);
  return `<span style="font-size:1.5rem">${icon}</span><br>${instr}`;
}



// ══════════════════════════════════════════════
// REWARD CHESTS — Brawl-Stars-style timed chests (test mode)
// ══════════════════════════════════════════════
/* RewardChests is loaded from rewardchests.js */

window.App = App;
window.mountainSVG = mountainSVG;
window.worldPathSVG = worldPathSVG;
window.getTaskInstruction = getTaskInstruction;
