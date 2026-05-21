// Game event logger
const GameLog = {
  _log: [],
  log(game, msg, level='info') {
    const entry = {ts: Date.now(), game, msg, level};
    this._log.push(entry);
    // Keep last 200 entries in memory
    if(this._log.length > 200) this._log.shift();
    // Save to localStorage (keep last 100)
    try {
      const stored = JSON.parse(localStorage.getItem('mischa_game_log')||'[]');
      stored.push(entry);
      localStorage.setItem('mischa_game_log', JSON.stringify(stored.slice(-100)));
    } catch(e) {}
    console.log('[GAME:'+game+']', msg);
  },
  error(game, msg) {
    this.log(game, msg, 'err');
    try {
      const el = JSON.parse(localStorage.getItem('mischa_error_log')||'[]');
      el.push(new Date().toLocaleString('de-CH')+' ['+game+']: '+msg);
      localStorage.setItem('mischa_error_log', JSON.stringify(el.slice(-50)));
    } catch(e) {}
  },
  clear() { this._log=[]; localStorage.removeItem('mischa_game_log'); localStorage.removeItem('mischa_error_log'); }
};
window.GameLog = GameLog;

const APP_VERSION = 'v88-isActive-fix';
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
// ══ FONT SCALE SYSTEM ══
// Device fingerprint: screenW x screenH x DPR
// Font scale stored per player+device in localStorage + Firebase admin_logs
const FontScale = {
  SIZES: [22, 20, 18, 16, 15, 14, 13, 12, 11, 10], // fallback (overridden by detectSizes)
  DEFAULT: 15,

  // Detect system font size and generate 10 steps from 2× to 0.3× system size
  detectSizes() {
    // Method 1: Read computed font-size from a fresh element (most reliable)
    let sysSize = 16; // browser default
    try {
      const probe = document.createElement('div');
      // No inline styles — inherits system/browser default
      probe.style.cssText = 'position:fixed;visibility:hidden;font-size:1em;left:-9999px';
      document.body.appendChild(probe);
      const computed = parseFloat(window.getComputedStyle(probe).fontSize);
      probe.remove();
      if (computed >= 8 && computed <= 40) sysSize = computed;
    } catch(e) {}

    // Method 2: Also check window.devicePixelRatio to scale up on high-DPI
    const dpr = window.devicePixelRatio || 1;
    // On high-DPI, effective minimum readable size is larger
    // e.g. DPR=3: system might report 16px but visually it's tiny
    // Scale system size by DPR factor (capped to avoid extreme values)
    const dprFactor = Math.min(dpr, 2.5) / 1.0;
    // Only apply DPR factor if system size seems small (< 18px means system isn't compensating)
    const effectiveSys = sysSize < 18 ? Math.round(sysSize * Math.min(dprFactor, 1.8)) : sysSize;

    // Generate 10 steps: from 2× effectiveSys down to 0.3× effectiveSys
    const maxPx = Math.round(effectiveSys * 2.0);   // top step
    const minPx = Math.max(8, Math.round(effectiveSys * 0.30)); // bottom step
    const steps = [];
    for (let i = 0; i < 10; i++) {
      // Logarithmic spacing (feels more natural than linear)
      const t = i / 9;
      const logMax = Math.log(maxPx);
      const logMin = Math.log(minPx);
      const px = Math.round(Math.exp(logMax + t * (logMin - logMax)));
      if (steps.length === 0 || px !== steps[steps.length - 1]) steps.push(px);
    }
    // Ensure we have exactly 10 steps (pad with linear if needed)
    while (steps.length < 10) steps.push(steps[steps.length - 1] - 1);
    steps.length = 10;

    return { steps, sysSize, effectiveSys, maxPx, minPx };
  },

  // Device key: unique per screen dimensions + pixel ratio
  deviceKey() {
    return `${screen.width}x${screen.height}x${(window.devicePixelRatio||1).toFixed(1)}`;
  },

  // Storage key: per player + device
  storageKey(playerName) {
    return `mischa_fontscale_${(playerName||'guest').toLowerCase()}_${this.deviceKey()}`;
  },

  // Load saved scale for current player+device
  load(playerName) {
    try {
      const saved = localStorage.getItem(this.storageKey(playerName));
      if (saved) {
        const size = parseInt(saved);
        if (size >= 8 && size <= 120) return size; // wider range for detected sizes
      }
    } catch(e) {}
    // No saved size: auto-detect effective default
    try {
      const d = this.detectSizes();
      // Use middle step (step 4 out of 10 = ~80% of system size) as default
      // This ensures first-time users get a reasonable size
      return d.steps[4] || this.DEFAULT;
    } catch(e) {}
    return this.DEFAULT;
  },

  // Save scale locally and to Firebase
  save(playerName, sizePx) {
    try {
      localStorage.setItem(this.storageKey(playerName), String(sizePx));
    } catch(e) {}
    // Save to Firebase admin_logs for visibility
    try {
      if (typeof _db !== 'undefined' && _db) {
        _db.collection('player_device_fonts').doc(
          (playerName||'guest').toLowerCase() + '_' + this.deviceKey().replace(/[.]/g,'_')
        ).set({
          player: playerName,
          deviceKey: this.deviceKey(),
          screenW: screen.width, screenH: screen.height,
          dpr: window.devicePixelRatio||1,
          fontSizePx: sizePx,
          userAgent: navigator.userAgent.slice(0,120),
          updatedAt: Date.now(),
          updatedStr: new Date().toLocaleString('de-CH'),
        }).catch(() => {});
      }
    } catch(e) {}
  },

  // Apply scale — sets root font + CSS vars + dynamic style injection
  apply(sizePx) {
    // Clamp to reasonable range (detectSizes gives 8-120px range)
    sizePx = Math.max(8, Math.min(120, parseInt(sizePx) || 15));
    const scale = sizePx / 15; // 15px is the base
    document.documentElement.style.setProperty('--user-font-size', sizePx + 'px');
    document.documentElement.style.setProperty('--user-font-scale', scale.toFixed(3));
    // Set root font-size so rem units scale everywhere
    document.documentElement.style.fontSize = sizePx + 'px';
    document.body.style.fontSize = sizePx + 'px';
    window._userFontSize = sizePx;
    window._userFontScale = scale;
    // Inject/update a persistent <style> that scales all UI text
    // This works even for hardcoded px values via zoom-like scaling
    let styleEl = document.getElementById('mischa-font-override');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'mischa-font-override';
      document.head.appendChild(styleEl);
    }
    // Scale factor: if user needs 20px (scale=1.33), make everything 33% bigger
    // We do this by setting html font-size and making all rem-based text scale
    // For hardcoded sizes in the app HTML, we use a zoom approach on #app
    const zoom = sizePx / 15;
    styleEl.textContent = [
      `:root { --ufs: ${sizePx}px; --ufz: ${zoom.toFixed(3)}; font-size: ${sizePx}px; }`,
      `body { font-size: ${sizePx}px; }`,
      // Scale the app container so all text inside scales proportionally
      `#app { font-size: ${sizePx}px; }`,
      // Override specific common patterns
      `.card, .btn, button, input, select, textarea, p, div, span, label { font-size: inherit; }`,
      // World map task items
      `.world-item { font-size: ${sizePx}px !important; }`,
    ].join('\n');
  },

  // Apply for player (load + apply)
  applyForPlayer(playerName) {
    const size = this.load(playerName);
    this.apply(size);
    return size;
  },

  // Check if test was done on this device for this player
  testDone(playerName) {
    return localStorage.getItem(this.storageKey(playerName) + '_tested') === '1';
  },

  markTested(playerName) {
    localStorage.setItem(this.storageKey(playerName) + '_tested', '1');
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

  // ---- WELCOME ----
  showWelcome() {
    // Apply font size immediately — use detected system size default
    try {
      const dKey = screen.width+'x'+screen.height+'x'+(window.devicePixelRatio||1).toFixed(1);
      const keys = Object.keys(localStorage).filter(k=>k.includes('fontscale')&&k.includes(dKey));
      if(keys.length) {
        const saved = parseInt(localStorage.getItem(keys[0]));
        if(saved>=8&&saved<=120) { FontScale.apply(saved); }
      } else {
        const d = FontScale.detectSizes();
        FontScale.apply(d.steps[3]||16); // step 3 ≈ 90% of system = good intro default
      }
    } catch(e) {}

    // Draw stars on canvas
    const wmc = document.getElementById('wm-stars');
    if(wmc){ const wctx=wmc.getContext('2d'); wmc.width=wmc.offsetWidth||window.innerWidth; wmc.height=wmc.offsetHeight||window.innerHeight;
      wctx.fillStyle='#000'; wctx.fillRect(0,0,wmc.width,wmc.height);
      for(let i=0;i<200;i++){const x=Math.random()*wmc.width,y=Math.random()*wmc.height*0.65,s=Math.random()*1.8+0.2,b=Math.random()*0.7+0.3;wctx.fillStyle=`rgba(255,255,${Math.floor(200+Math.random()*55)},${b})`;wctx.beginPath();wctx.arc(x,y,s,0,Math.PI*2);wctx.fill();}
      wmc.style.background='transparent';
    } const _ws = State.currentPlayer?.worlds?.[1] || State.currentPlayer?.worlds?.['1'] || {};
    const mt = (_ws.tasks||[]).reduce((s,t)=>s+(t&&t.mt||0),0);
    const hasEnough = mt >= 10;
    this._html(`
      <div class="mountain-bg">
        <div class="sky-gradient"></div>
        <div class="cloud cloud-1"></div><div class="cloud cloud-2"></div><div class="cloud cloud-3"></div>
        ${mountainSVG()}
      </div>
      <div class="page">
        <div class="game-logo">
          <span class="logo-emoji">🎮</span>
          <h1>Mischa<br>Denkspiel</h1>
          <p class="subtitle">2 Welten · Verdiene 🌀 MT · Baue deinen Zoo!</p>
          <p style="font-size:var(--fs-sm);color:rgba(255,255,255,.4);margin-top:2px;letter-spacing:.5px">📦 v2026.05.21-0648</p>
        </div>
        <div class="card" style="background:linear-gradient(135deg,rgba(10,10,25,.95),rgba(20,20,40,.9));border:1px solid rgba(255,215,0,.25);box-shadow:0 0 30px rgba(255,165,0,.1)">
          <div class="card-title" style="background:linear-gradient(135deg,#FFD700,#FF8C00);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">⚔️ Willkommen, Abenteurer</div>

          <!-- Welt 1 Box - dark dramatic style -->
          <div style="background:#EBF5FB;border:2px solid #2980B9;border-radius:14px;padding:14px;margin-bottom:12px">
            <div style="font-weight:900;color:#2980B9;font-size:1rem;margin-bottom:6px">🎮 Welt 1 — Denkspiel</div>
            <div style="font-size:clamp(0.9rem,3.7vw,1rem);color:#333;line-height:1.6">
              Spiele <b>20 verschiedene Spiele</b> und verdiene <b>Mischa Taler (🌀 MT)</b>.<br>
              Je besser du spielst, desto mehr MT bekommst du (bis 1.5 MT pro Spiel).<br>
              <span style="color:#888;font-size:var(--fs-sm)">🎯 Dart · 🔢 Rechnen · 🚂 Zug · 🧠 Memory · ⚡ Reaktion · und mehr...</span>
            </div>
          </div>

          <!-- Welt 2 Box -->
          <div style="background:#EAFAF1;border:2px solid #27AE60;border-radius:14px;padding:14px;margin-bottom:16px">
            <div style="font-weight:900;color:#27AE60;font-size:1rem;margin-bottom:6px">🦁 Welt 2 — Zoo-Empire</div>
            <div style="font-size:clamp(0.9rem,3.7vw,1rem);color:#333;line-height:1.6">
              Teleportiere für <b>10 🌀 MT</b> in den Zoo.<br>
              Kaufe Tiere mit der Gondelbahn · Baue Gehege auf · Verdiene automatisch MT.<br>
              <span style="color:#888;font-size:var(--fs-sm)">🚡 Gondelbahn · 🎡 Glücksrad · 🌀 Multiplayer · Slap-System</span>
            </div>
          </div>

          <div style="display:flex;flex-direction:column;gap:8px">
            <button class="btn btn-primary btn-full btn-big" onclick="App.showCharSelect()">🆕 Neu registrieren</button>
            <button class="btn btn-secondary btn-full" onclick="App.showLogin()">🔑 Anmelden</button>
            <div style="display:flex;gap:6px;margin-top:2px">
              <button class="btn btn-full" style="flex:1;background:rgba(255,255,255,0.5);color:var(--text-dark)" onclick="App.showGlobalLeaderboard()">🌍 Rangliste</button>
              <button class="btn" style="flex:1;background:rgba(255,215,0,0.2);color:#FFD700;border:1px solid rgba(255,215,0,.4)" onclick="App.showGeldbeutel()">👜 Geldbeutel</button>
              <button class="btn" style="flex:1;background:rgba(41,182,246,0.2);color:#29B6F6;border:1px solid rgba(41,182,246,.4)" onclick="App.showKontoauszug()" style="flex:1;background:rgba(255,215,0,.12);color:#FFD700;border:2px solid rgba(255,215,0,.3);font-size:clamp(0.9rem,4vw,1rem);min-height:40px;padding:6px 8px">📊 Konto</button>
              <button onclick="App.showQR()" style="background:rgba(255,255,255,.3);border:2px solid rgba(255,255,255,.5);color:white;padding:8px 14px;border-radius:10px;font-size:.85rem;cursor:pointer" title="QR Code">📱 QR</button>
            </div>
          </div>
        </div>
      </div>`);
  },

  // ── TELEPORT TO ZOO ──
  async teleportToZoo() {
    const p = State.currentPlayer;
    if (!p) { alert('Bitte erst anmelden!'); return; }
    // Use real MT from LOCAL player (don't trust cloud which may be stale)
    const _localP = State._local.get(p.name) || p;
    const _ws_tp = _localP.worlds?.['1'] || _localP.worlds?.[1] || {};
    const mt = (_ws_tp.tasks||[]).reduce((s,t) => s+(t&&t.mt||0), 0);
    const cost = 10;
    // Once unlocked (visited before), gate stays open permanently
    const _playerKey = p.name.toLowerCase();
    const _hasUnlocked = localStorage.getItem('zoo_unlocked_' + _playerKey) === '1';
    if (!_hasUnlocked && mt < cost) { alert('🦁 Zoo noch gesperrt! Du brauchst ' + cost + ' MT.\nDu hast: ' + mt.toFixed(1) + ' MT'); return; }
    // Remember unlock permanently
    if (mt >= cost) localStorage.setItem('zoo_unlocked_' + _playerKey, '1');
    if (!confirm('🦁 In den Zoo teleportieren?')) return;
    // Zoo is FREE once unlocked - no MT deduction
    sessionStorage.setItem('mischa_current', p.name.toLowerCase());
    // Pass character so zoo skips its own login
    const charData = (window.CHARACTERS||CHARACTERS||[]).find(c=>c.id===p.character);
    const zooUsers = JSON.parse(localStorage.getItem('zoo_users')||'{}');
    const zKey = p.name.toLowerCase();
    if(!zooUsers[zKey]) zooUsers[zKey] = {pw:'auto',ch:{e:charData?.emoji||'🧭',id:p.character}};
    else zooUsers[zKey].ch = {e:charData?.emoji||'🧭',id:p.character};
    localStorage.setItem('zoo_users', JSON.stringify(zooUsers));
    sessionStorage.setItem('mischa_birthyear', p.birthYear||2000);
    // ── CINEMATIC TELEPORT SCREEN ──
    this._showTeleportCinema(p.name, charData?.emoji||'🧭', mt);
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
      const phase = frame < 50 ? {t:'🚀 Teleportation startet!', c:'#29B6F6'}
                  : frame < 100 ? {t:'⭐ Durchs Universum...', c:'#FFD700'}
                  : frame < 150 ? {t:'🌌 Fast da!', c:'#E91E8C'}
                  : {t:'🦁 Willkommen im Zoo!', c:'#27AE60'};
      const fade = Math.min(1, (frame%50)/10);
      txt.innerHTML = `
        <div style="font-size:clamp(1.2rem,4vw,2rem);color:${phase.c};font-weight:900;
          text-shadow:0 0 20px ${phase.c};opacity:${fade};margin-bottom:8px">
          ${phase.t}
        </div>
        <div style="font-size:clamp(.85rem,2.5vw,1.1rem);color:rgba(255,255,255,.7);opacity:${fade}">
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
        <div style="font-size:clamp(0.85rem,3.5vw,0.95rem);color:#666;margin-top:10px;word-break:break-all">${url}</div>
        <button onclick="navigator.clipboard?.writeText('${url}').then(()=>this.textContent='✅ Kopiert!').catch(()=>{})" style="margin-top:10px;background:#2980B9;color:white;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:.85rem">📋 Link kopieren</button>
        <br><button onclick="this.closest('[style*=fixed]').remove()" style="margin-top:8px;background:none;border:none;color:#888;cursor:pointer;font-size:clamp(0.9rem,3.7vw,1rem)">Schliessen</button>
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
            <div style="font-size:clamp(0.9rem,3.7vw,1rem);font-weight:700;color:var(--text-mid);margin-bottom:7px">🎨 Farbe:</div>
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
    if (!this.selectedChar) { alert('Bitte Charakter wählen!'); return; }
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
    this.showWorldMap();
  },

  // ---- LOGIN ----
  showLogin() {
    this._html(`
      <div class="mountain-bg"><div class="sky-gradient"></div><div class="cloud cloud-1"></div>${mountainSVG()}</div>
      <div class="page">
        <div class="card">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
            <button onclick="App.showWelcome()" style="background:none;border:none;font-size:1.3rem;cursor:pointer">◀</button>
            <div class="card-title" style="margin-bottom:0">Anmelden 🔑</div>
          </div>
          <div class="card-subtitle">Willkommen zurück!</div>
          <div class="input-group"><label>Name</label><input type="text" id="l-name" autocomplete="off"/></div>
          <div class="input-group"><label>Passwort</label>
            <input type="password" id="l-pw" onkeyup="if(event.key==='Enter')App.doLogin()"/></div>
          <div id="l-err" style="color:#E74C3C;font-size:0.88rem;text-align:center;display:none;margin-bottom:8px"></div>
          <button class="btn btn-primary btn-full btn-big" onclick="App.doLogin()">Anmelden ➜</button>
        </div>
      </div>`);
  },

  async doLogin() {
    const name = document.getElementById('l-name')?.value.trim();
    const pw   = document.getElementById('l-pw')?.value.trim();
    // Validate BEFORE showing loading screen
    if (!name) {
      const e=document.getElementById('l-err'); if(e){e.textContent='Bitte Namen eingeben!';e.style.display='block';} return;
    }
    if (!pw) {
      const e=document.getElementById('l-err'); if(e){e.textContent='Bitte Passwort eingeben!';e.style.display='block';} return;
    }
    // Special player shortcuts
    const nameLc = name.toLowerCase();
    this._loading('Anmelden...');
    let res;
    try {
      res = await Promise.race([
        State.login(name, pw),
        new Promise(r => setTimeout(() => r({ok:false, error:'Verbindungsfehler - bitte erneut versuchen'}), 6000))
      ]);
    } catch(e) { res = {ok:false, error:'Verbindungsfehler'}; }
    if (!res.ok) {
      this.showLogin();
      setTimeout(()=>{ const e=document.getElementById('l-err'); if(e){e.textContent=res.error;e.style.display='block';}},50);
      return;
    }
    State.setCurrentPlayer(res.player);
    // Check if player is banned
    try {
      if(typeof _db !== 'undefined' && _db) {
        const banDoc = await _db.collection('banned_players').doc(res.player.name.toLowerCase()).get();
        if(banDoc.exists) {
          const ban = banDoc.data();
          const now = Date.now();
          if(ban.permanent || !ban.expiresAt || ban.expiresAt > now) {
            State.currentPlayer = null;
            sessionStorage.removeItem('mischa_current');
            const until = ban.permanent ? 'permanent' : new Date(ban.expiresAt).toLocaleString('de-CH');
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
    FontScale.applyForPlayer(State.currentPlayer?.name||'');
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
        <div style="font-size:clamp(0.85rem,3.5vw,0.95rem);font-weight:700;color:${col};margin-bottom:8px;padding:4px 10px;background:${col}22;border-radius:6px;display:inline-block">
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
            <div style="font-size:clamp(0.85rem,3.5vw,0.95rem);color:rgba(255,255,255,.5)">${ch} ${player.name}</div>
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
          <div style="font-size:clamp(0.8rem,3.4vw,0.9rem);color:rgba(255,255,255,.4);margin-top:6px;text-align:center">
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
    // Merge locally saved currentWorld in case Firebase was behind
    if (player) {
      const _appliedSize = FontScale.applyForPlayer(player.name);
      // If test was never done on this device, remember to show hint
      if (!FontScale.testDone(player.name)) {
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
    const _isAdmin = player.name.toLowerCase() === 'bu';
    // Bu gets displayed with special black/gold style
    const displayName = _isAdmin ? '<span style="background:#FFD700;color:#000;font-weight:900;padding:2px 8px;border-radius:6px">Bu 🌀</span>' : player.name;

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

    // Calculate total MT from LOCAL player data (most reliable)
    let mt = 0;
    try {
      const _localForMt = State._local.get(player.name) || player;
      const _wsmt = _localForMt.worlds?.['1'] || _localForMt.worlds?.[1] || {};
      mt = (Array.isArray(_wsmt.tasks) ? _wsmt.tasks : []).reduce((s, t) => s + (t && typeof t.mt === 'number' ? t.mt : 0), 0);
    } catch(_e) { mt = 0; }

    this._html(`
      <div class="mountain-bg" id="wm-bg">
        <div style="position:absolute;inset:0;background:linear-gradient(180deg,#020008 0%,#060015 30%,#0a001f 55%,#120028 75%,#1e0035 90%,#120020 100%)"></div>
        <canvas id="wm-stars" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none"></canvas>
        <div style="position:absolute;inset:0;background:radial-gradient(ellipse 70% 35% at 25% 18%,rgba(70,0,110,.3),transparent),radial-gradient(ellipse 50% 25% at 75% 35%,rgba(0,15,70,.25),transparent)"></div>
        <div style="position:absolute;top:5%;right:12%;width:46px;height:46px">
          <div style="width:46px;height:46px;border-radius:50%;background:#fffbe0;box-shadow:0 0 18px rgba(255,245,200,.5)"></div>
          <div style="position:absolute;top:5px;right:-7px;width:38px;height:38px;border-radius:50%;background:#020008"></div>
        </div>
        ${mountainSVG(true)}
        <div style="position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,rgba(0,0,10,.65) 100%)"></div>
      </div>
      <div class="page" style="padding-top:16px;padding-left:4px;padding-right:4px;width:100%;max-width:100%;box-sizing:border-box;overflow-x:hidden">
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:center;width:100%;max-width:100%;margin-bottom:12px">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:clamp(2rem,8vw,2.4rem)">${ch?.emoji||'🧭'}</span>
            <div>
              <div style="font-family:Arial,sans-serif;font-size:clamp(1.1rem,4.5vw,1.3rem);color:white;text-shadow:0 2px 4px rgba(0,0,0,0.3)">
                ${displayName}
                ${(()=>{ const _age=State.getAge(player); return (_age>4&&_age<130)?`<span style="font-size:clamp(0.75rem,3vw,0.85rem);color:rgba(255,255,255,.45);font-weight:400;margin-left:4px">${_age}J</span>`:''; })()}
              </div>
              <div style="background:rgba(255,215,0,.3);border:1px solid #FFD700;color:#FFD700;font-weight:900;font-size:clamp(0.9rem,3.8vw,1rem);padding:4px 12px;border-radius:20px">🌀 ${mt.toFixed(1)} MT</div>
            </div>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button onclick="App.showGlobalLeaderboard()" style="background:rgba(255,255,255,0.25);border:2px solid white;color:white;padding:clamp(6px,2vw,9px) clamp(10px,3vw,16px);border-radius:50px;font-weight:700;cursor:pointer;font-size:clamp(0.95rem,4.5vw,1.1rem);min-height:48px">🌍 Rangliste</button>
            <button onclick="Shop.open(null,()=>App.showWorldMap())" style="background:rgba(255,215,0,0.3);border:2px solid #FFD700;color:#FFD700;padding:clamp(6px,2vw,9px) clamp(10px,3vw,16px);border-radius:50px;font-weight:700;cursor:pointer;font-size:clamp(0.95rem,4.5vw,1.1rem);min-height:48px">🛒 Shop</button>
            ${_isAdmin ? `<button onclick="App.showAdminReports()" style="background:rgba(231,76,60,0.3);border:2px solid #E74C3C;color:#E74C3C;padding:clamp(6px,2vw,9px) clamp(10px,3vw,16px);border-radius:50px;font-weight:700;cursor:pointer;font-size:clamp(0.95rem,4.5vw,1.1rem);min-height:48px">⚑ Meldungen</button>` : ''}
            <button onclick="App.showEyeTest()" style="background:rgba(100,200,255,0.25);border:2px solid rgba(100,200,255,.7);color:rgba(180,240,255,1);padding:clamp(6px,2vw,9px) clamp(10px,3vw,16px);border-radius:50px;font-weight:700;cursor:pointer;font-size:clamp(0.95rem,4.5vw,1.1rem);min-height:48px" title="Schriftgrösse anpassen">🔤 Schrift</button>
            <button onclick="App._logout()" style="background:rgba(255,255,255,0.25);border:2px solid white;color:white;padding:clamp(6px,2vw,9px) clamp(10px,3vw,16px);border-radius:50px;font-weight:700;cursor:pointer;font-size:clamp(0.95rem,4.5vw,1.1rem);min-height:48px">Abmelden</button>
          </div>
        </div>

        <!-- MT Counter prominent -->
        <div style="text-align:center;margin-bottom:10px">
          <div style="background:rgba(255,215,0,.2);border:2px solid #FFD700;border-radius:50px;padding:8px 20px;display:inline-block">
            <span style="font-size:1.4rem;font-weight:900;color:#FFD700">🌀 ${mt.toFixed(1)} MT</span>
            <span style="font-size:clamp(0.85rem,3.5vw,0.95rem);color:rgba(255,255,255,.7);margin-left:8px">Mischa Taler</span>
          </div>
        </div>

        <!-- Teleport Button -->
        ${mt>=10 ? `
        <div style="margin-bottom:12px">
          <button onclick="App.teleportToZoo()" style="width:100%;max-width:100%;background:linear-gradient(135deg,#27AE60,#1E8449);color:white;border:none;padding:14px 20px;border-radius:16px;font-family:Arial,sans-serif;font-size:1.1rem;cursor:pointer;box-shadow:0 4px 15px rgba(39,174,96,.4);animation:bounce 1s infinite">
            🚀 In den Zoo teleportieren! (10 🌀 MT)
          </button>
        </div>` : `
        <div style="margin-bottom:12px;background:rgba(39,174,96,.1);border:2px dashed rgba(39,174,96,.5);border-radius:14px;padding:12px;text-align:center;max-width:100%;width:100%">
          <div style="font-size:.9rem;color:rgba(255,255,255,.9);font-weight:700">🦁 Zoo freischalten</div>
          <div style="font-size:clamp(0.9rem,3.7vw,1rem);color:rgba(255,255,255,.6);margin-top:4px">Noch ${Math.max(0,(10-mt)).toFixed(1)} 🌀 MT bis zur Teleportation</div>
          <div style="background:rgba(255,255,255,.15);border-radius:6px;height:8px;margin-top:8px;max-width:200px;margin-left:auto;margin-right:auto">
            <div style="background:#27AE60;height:8px;border-radius:6px;width:${Math.min(100,mt/10*100)}%"></div>
          </div>
        </div>`}

        <div style="font-family:Arial,sans-serif;font-size:clamp(1.1rem,5vw,1.35rem);color:white;text-align:center;margin-bottom:10px">🎮 Deine 20 Spiele</div>

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
                  <div class="world-name" style="font-size:clamp(1rem,4.5vw,1.25rem);font-weight:900">${world.name}</div>
                  <div class="world-desc" style="font-size:clamp(0.9rem,4.2vw,1rem);font-weight:500">${world.difficulty}</div>
                  <div class="world-progress" style="font-size:clamp(0.85rem,3.8vw,0.97rem);font-weight:600">${done}/${ws.tasks.length} Spiele ✓ · 🌀 ${(ws.tasks||[]).reduce((s,t)=>s+(t&&t.mt||0),0).toFixed(1)} MT</div>
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
  },

  _logout() {
    State.logout();
    this.showWelcome();
  },

  // ══ SEHTEST — Augen-Test für optimale Schriftgrösse ══
  showEyeTest() {
    const player = State.currentPlayer;
    const playerName = player?.name || '';
    // Detect system font size and compute 10 steps dynamically
    const detected = FontScale.detectSizes();
    const SIZES = detected.steps;
    const { sysSize, effectiveSys, maxPx, minPx } = detected;
    let step = 0;
    let lastReadable = 0;

    const SAMPLE_TEXTS = [
      'Mischa Denkspiel — Willkommen!',
      'Du hast 20 Aufgaben geschafft.',
      'Jetzt kannst du den Zoo besuchen.',
      '14/20 Spiele · 11.5 MT verdient',
      'Rangliste · Shop · Kontoauszug',
      'Tippe auf die nächste Aufgabe:',
      'Dart · Rechnen · Sokoban · Race',
      '🌀 Mischa Taler: 11.5 MT',
      'Welt 1 abgeschlossen! Weiter →',
      '🦁 Zoo · 🎡 Glücksrad · Slaps',
    ];

    const render = (s) => {
      const size = SIZES[s];
      const isFirst = s === 0;
      const isLast = s === SIZES.length - 1;
      const progress = Math.round((s / (SIZES.length-1)) * 100);
      const pctOfSys = Math.round((size / (effectiveSys||16)) * 100);

      this._html(`
        <div style="min-height:100vh;background:linear-gradient(135deg,#0d1b2a,#1a2a3a);
             display:flex;flex-direction:column;align-items:center;justify-content:center;
             padding:20px;box-sizing:border-box;font-family:'Segoe UI',system-ui,sans-serif">

          <!-- Header -->
          <div style="text-align:center;margin-bottom:28px">
            <div style="font-size:3rem;margin-bottom:8px">👁</div>
            <h2 style="color:#fff;font-size:1.4rem;font-weight:900;margin:0 0 4px">Schriftgrösse optimieren</h2>
            <p style="color:rgba(255,255,255,.5);font-size:.85rem;margin:0">
              Schritt ${s+1} von ${SIZES.length} — ${size}px
            </p>
            <p style="color:rgba(255,255,255,.3);font-size:clamp(11px,3vw,14px);margin:3px 0 0">
              Systemschrift: ${sysSize}px · DPR: ${(window.devicePixelRatio||1).toFixed(1)} · Bereich: ${maxPx}→${minPx}px
            </p>
          </div>

          <!-- Progress bar -->
          <div style="width:100%;max-width:400px;background:rgba(255,255,255,.1);
               border-radius:20px;height:6px;margin-bottom:32px;overflow:hidden">
            <div style="width:${progress}%;background:linear-gradient(90deg,#4af,#27AE60);
                 height:100%;border-radius:20px;transition:width .3s"></div>
          </div>

          <!-- Text sample card -->
          <div style="width:100%;max-width:440px;background:rgba(255,255,255,.06);
               border:1.5px solid rgba(255,255,255,.12);border-radius:20px;
               padding:28px 24px;margin-bottom:28px;text-align:center">
            <div style="color:rgba(255,255,255,.35);font-size:.75rem;
                 font-weight:700;text-transform:uppercase;letter-spacing:.1em;margin-bottom:14px">
              Kannst du diesen Text lesen?
            </div>
            <div style="color:#fff;font-size:${size}px;line-height:1.55;font-weight:500">
              ${SAMPLE_TEXTS[s]}
            </div>
            <div style="margin-top:14px;color:rgba(255,255,255,.3);font-size:.7rem">
              ${size}px · ${pctOfSys}% der Systemgrösse · ${isFirst?'▲ Grösste':isLast?'▼ Kleinste':'Stufe '+(s+1)}
            </div>
          </div>

          <!-- Buttons -->
          <div style="display:flex;flex-direction:column;gap:10px;width:100%;max-width:400px">
            <button onclick="App._eyeTestYes(${s})"
              style="background:linear-gradient(135deg,#27AE60,#1E8449);color:#fff;border:none;
                     padding:18px;border-radius:14px;font-size:1.1rem;font-weight:900;
                     cursor:pointer;min-height:56px;
                     box-shadow:0 4px 16px rgba(39,174,96,.4)">
              ✅ Ja, ich kann das lesen
            </button>
            <button onclick="App._eyeTestNo(${s})"
              style="background:rgba(231,76,60,.15);color:#E74C3C;
                     border:2px solid rgba(231,76,60,.4);
                     padding:16px;border-radius:14px;font-size:1rem;font-weight:700;
                     cursor:pointer;min-height:52px">
              ❌ Zu klein — nicht lesbar
            </button>
            ${!isFirst ? `<button onclick="App._eyeTestBack(${s})"
              style="background:rgba(255,255,255,.07);color:rgba(255,255,255,.6);border:none;
                     padding:12px;border-radius:12px;font-size:.9rem;cursor:pointer">
              ← Vorherige Stufe
            </button>` : ''}
            <button onclick="App.showWorldMap()"
              style="background:none;color:rgba(255,255,255,.3);border:none;
                     padding:10px;font-size:clamp(13px,3.5vw,16px);cursor:pointer;margin-top:4px">
              Überspringen (Standardgrösse beibehalten)
            </button>
          </div>
        </div>`);
    };

    // Store test state on App
    this._eyeStep = 0;
    this._eyeLastReadable = 0;
    this._eyeHadYes = false; // track if user ever clicked 'Yes'
    render(0);
  },

  _eyeTestYes(step) {
    const detected = FontScale.detectSizes();
    const SIZES = detected.steps;
    this._eyeLastReadable = step; // remember: this step WAS readable
    this._eyeHadYes = true;
    // Preview live
    FontScale.apply(SIZES[step]);
    if (step >= SIZES.length - 1) {
      // Reached smallest — save it as the minimum readable
      this._eyeTestFinish(step, detected);
    } else {
      this.showEyeTestStep(step + 1);
    }
  },

  _eyeTestNo(step) {
    const detected = FontScale.detectSizes();
    const SIZES = detected.steps;
    
    if (step === 0) {
      // "Cannot read" already at BIGGEST size → save biggest (step 0) anyway
      // This is the maximum we have — better than nothing
      this._eyeTestFinish(0, detected);
    } else if (this._eyeHadYes) {
      // We had at least one "Yes" — save the last readable step
      this._eyeTestFinish(this._eyeLastReadable, detected);
    } else {
      // Never clicked "Yes" before — save previous step (one bigger)
      this._eyeTestFinish(step - 1, detected);
    }
  },

  _eyeTestBack(step) {
    if (step > 0) {
      // If going back to step before last readable, reset tracker
      if (step - 1 < this._eyeLastReadable) {
        this._eyeLastReadable = step - 1;
        this._eyeHadYes = step > 1;
      }
      this.showEyeTestStep(step - 1);
    }
  },

  showEyeTestStep(step) {
    const detected = FontScale.detectSizes();
    const SIZES = detected.steps;
    const { sysSize, effectiveSys, maxPx, minPx } = detected;
    if (step < 0 || step >= SIZES.length) { this.showWorldMap(); return; }
    const size = SIZES[step];
    const SAMPLE_TEXTS = [
      'Mischa Denkspiel — Willkommen!',
      'Du hast 20 Aufgaben geschafft.',
      'Jetzt kannst du den Zoo besuchen.',
      '14/20 Spiele · 11.5 MT verdient',
      'Rangliste · Shop · Kontoauszug',
      'Tippe auf die nächste Aufgabe:',
      'Dart · Rechnen · Sokoban · Race',
      '🌀 Mischa Taler: 11.5 MT',
      'Welt 1 abgeschlossen! Weiter →',
      '🦁 Zoo · 🎡 Glücksrad · Slaps',
    ];
    const progress = Math.round((step / (SIZES.length-1)) * 100);
    const isFirst = step === 0;
    const isLast = step === SIZES.length - 1;
    const pctOfSys = Math.round((size / effectiveSys) * 100);
    this._html(`
      <div style="min-height:100vh;background:linear-gradient(135deg,#0d1b2a,#1a2a3a);
           display:flex;flex-direction:column;align-items:center;justify-content:center;
           padding:20px;box-sizing:border-box;font-family:'Segoe UI',system-ui,sans-serif">
        <div style="text-align:center;margin-bottom:28px">
          <div style="font-size:3rem;margin-bottom:8px">👁</div>
          <h2 style="color:#fff;font-size:1.4rem;font-weight:900;margin:0 0 4px">Schriftgrösse optimieren</h2>
          <p style="color:rgba(255,255,255,.5);font-size:clamp(13px,3.5vw,16px);margin:0">
            Schritt ${step+1} von ${SIZES.length} — ${size}px
          </p>
          <p style="color:rgba(255,255,255,.3);font-size:clamp(11px,3vw,13px);margin:3px 0 0">
            System: ${sysSize}px · DPR ${(window.devicePixelRatio||1).toFixed(1)} · Bereich: ${maxPx}→${minPx}px
          </p>
        </div>
        <div style="width:100%;max-width:400px;background:rgba(255,255,255,.1);
             border-radius:20px;height:6px;margin-bottom:32px;overflow:hidden">
          <div style="width:${progress}%;background:linear-gradient(90deg,#4af,#27AE60);
               height:100%;border-radius:20px;transition:width .3s"></div>
        </div>
        <div style="width:100%;max-width:440px;background:rgba(255,255,255,.06);
             border:1.5px solid rgba(255,255,255,.12);border-radius:20px;
             padding:28px 24px;margin-bottom:28px;text-align:center">
          <div style="color:rgba(255,255,255,.35);font-size:.75rem;
               font-weight:700;text-transform:uppercase;letter-spacing:.1em;margin-bottom:14px">
            Kannst du diesen Text lesen?
          </div>
          <div style="color:#fff;font-size:${size}px;line-height:1.55;font-weight:500">
            ${SAMPLE_TEXTS[step]}
          </div>
          <div style="margin-top:14px;color:rgba(255,255,255,.3);font-size:.7rem">
            ${size}px · ${isFirst?'▲ Grösste (2× System)':isLast?'▼ Kleinste (0.3× System)':'Stufe '+(step+1)+'/10'}
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;width:100%;max-width:400px">
          <button onclick="App._eyeTestYes(${step})"
            style="background:linear-gradient(135deg,#27AE60,#1E8449);color:#fff;border:none;
                   padding:18px;border-radius:14px;font-size:1.1rem;font-weight:900;
                   cursor:pointer;min-height:56px;box-shadow:0 4px 16px rgba(39,174,96,.4)">
            ✅ Ja, ich kann das lesen
          </button>
          <button onclick="App._eyeTestNo(${step})"
            style="background:rgba(231,76,60,.15);color:#E74C3C;
                   border:2px solid rgba(231,76,60,.4);
                   padding:16px;border-radius:14px;font-size:1rem;font-weight:700;
                   cursor:pointer;min-height:52px">
            ❌ Zu klein — nicht lesbar
          </button>
          ${!isFirst ? `<button onclick="App._eyeTestBack(${step})"
            style="background:rgba(255,255,255,.07);color:rgba(255,255,255,.6);border:none;
                   padding:12px;border-radius:12px;font-size:.9rem;cursor:pointer">
            ← Vorherige Stufe
          </button>` : ''}
          <button onclick="App.showWorldMap()"
            style="background:none;color:rgba(255,255,255,.3);border:none;
                   padding:10px;font-size:.82rem;cursor:pointer;margin-top:4px">
            Überspringen (Standardgrösse)
          </button>
        </div>
      </div>`);
  },

  _eyeTestFinish(stepIdx, detected) {
    const player = State.currentPlayer;
    const playerName = player?.name || '';
    // Use passed detected object or re-detect
    if (!detected) detected = FontScale.detectSizes();
    const size = detected.steps[stepIdx] ?? detected.steps[0] ?? 32;
    // Store the detected system size alongside for diagnostics
    const detectedInfo = { sysSize: detected.sysSize, effectiveSys: detected.effectiveSys, 
                           stepIdx, sizePx: size, steps: detected.steps };
    try { localStorage.setItem('mischa_eyetest_detected_'+FontScale.deviceKey(), JSON.stringify(detectedInfo)); } catch(e) {}
    // Save
    FontScale.save(playerName, size);
    FontScale.markTested(playerName);
    FontScale.apply(size);

    this._html(`
      <div style="min-height:100vh;background:linear-gradient(135deg,#0d1b2a,#1a2a3a);
           display:flex;flex-direction:column;align-items:center;justify-content:center;
           padding:24px;text-align:center;font-family:'Segoe UI',system-ui,sans-serif">
        <div style="font-size:4rem;margin-bottom:16px">✅</div>
        <h2 style="color:#fff;font-size:1.3rem;font-weight:900;margin:0 0 8px">Schriftgrösse gespeichert!</h2>
        <p style="color:rgba(255,255,255,.6);font-size:${Math.max(16,size)}px;margin:0 0 8px;max-width:340px;line-height:1.5">
          Optimale Grösse: <b style="color:#4af">${size}px</b>
          ${stepIdx===0&&!this._eyeHadYes?'<br><span style="color:#f39c12;font-size:.85em">⚠️ Grösste verfügbare Stufe gespeichert — du hast bei keiner Grösse ✅ geklickt.</span>':''}
        </p>
        <div style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);
             border-radius:14px;padding:16px 20px;margin-bottom:24px;max-width:360px">
          <div style="color:rgba(255,255,255,.4);font-size:.72rem;margin-bottom:6px">VORSCHAU bei ${size}px:</div>
          <div style="color:#fff;font-size:${size}px;line-height:1.6">
            14/20 Spiele · 🌀 11.5 MT<br>
            Tippe auf die nächste Aufgabe
          </div>
        </div>
        <button onclick="App.showWorldMap()"
          style="background:linear-gradient(135deg,#2980B9,#1a5a8a);color:#fff;border:none;
                 padding:16px 40px;border-radius:14px;font-size:${size}px;font-weight:900;
                 cursor:pointer;min-height:52px;box-shadow:0 4px 16px rgba(41,128,185,.4)">
          ← Zurück zu den Welten
        </button>
        <p style="color:rgba(255,255,255,.25);font-size:.72rem;margin-top:16px">
          Gerät: ${FontScale.deviceKey()} · Spieler: ${playerName}
        </p>
      </div>`);
  },

  // ---- GLOBAL LEADERBOARD ----
  async showGlobalLeaderboard() {
    this._loading('Rangliste laden...');
    // Load from both Firebase AND local, merge with local priority
    const localAll = State._local.getAll() || {};
    let firebaseAll = {};
    try {
      const fb = await Promise.race([State.getAll(), new Promise(r=>setTimeout(()=>r(null),3000))]);
      if (fb) firebaseAll = fb;
    } catch(e) {}
    
    // Merge: for each player, use whichever version has MORE completed tasks
    const merged = {...firebaseAll};
    Object.entries(localAll).forEach(([name, localP]) => {
      const fbP = firebaseAll[name];
      if (!fbP) { merged[name] = localP; return; }
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
    
    const player = State.currentPlayer;
    const players = Object.values(merged)
      .filter(p => p.name && p.name.toLowerCase() !== 'bu')
      .map(p => ({
        ...p,
        _mt: (() => {
        const ws = p.worlds?.[1] || p.worlds?.['1'] || p.worlds?.[String(1)] || {};
        return (ws.tasks||[]).reduce((s,t)=>s+(t&&t.mt!=null?t.mt:0),0);
      })()
      }))
      .sort((a,b) => b._mt - a._mt);

    const myMT = (() => {
      const ws = player?.worlds?.[1] || player?.worlds?.['1'] || {};
      return (ws.tasks||[]).reduce((s,t)=>s+(t&&t.mt!=null?t.mt:0),0);
    })();

    const rows = players.map((p, i) => {
      const isMe = p.name?.toLowerCase() === player?.name?.toLowerCase();
      const mt = p._mt.toFixed(1);
      const medal = i===0?'🥇':i===1?'🥈':i===2?'🥉':'';
      const tasksDone = ((p.worlds?.[1]||p.worlds?.['1']||{}).tasks||[]).filter(t=>t?.done).length;
      return `<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:10px;margin-bottom:6px;background:${isMe?'rgba(41,182,246,.12)':'rgba(255,255,255,.04)'};border:${isMe?'1px solid rgba(41,182,246,.3)':'1px solid transparent'}">
        <div style="font-size:1.1rem;min-width:28px;text-align:center">${medal||('<span style="color:rgba(255,255,255,.3);font-size:.85rem">#'+(i+1)+'</span>')}</div>
        <div style="flex:1">
          <div style="font-weight:700;font-size:.92rem">${p.name}${isMe?' <span style="font-size:clamp(0.92rem,4vw,1.05rem);color:#29B6F6">(Du)</span>':''}</div>
          <div style="font-size:.72rem;color:rgba(255,255,255,.4)">${tasksDone}/20 Aufgaben</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:1rem;font-weight:900;color:${parseFloat(mt)>=10?'#27AE60':parseFloat(mt)>=5?'#FFD700':'#E67E22'}">🌀${mt} MT</div>
        </div>
        ${p.name?.toLowerCase() !== player?.name?.toLowerCase() ? 
          `<button onclick="App.reportPlayer('${p.name}')" style="background:none;border:1px solid rgba(231,76,60,.3);color:rgba(231,76,60,.6);padding:3px 7px;border-radius:6px;cursor:pointer;font-size:clamp(1.05rem,5vw,1.18rem);touch-action:manipulation" title="Spieler melden">⚑</button>` : ''}
      </div>`;
    }).join('');

    this._html(`
      <div class="mountain-bg"><div class="sky-gradient"></div>${mountainSVG()}</div>
      <div class="page" style="padding-top:10px">
        <div class="card" style="background:linear-gradient(135deg,rgba(5,10,25,.97),rgba(10,20,45,.95));border:1px solid rgba(41,182,246,.3);padding:14px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
            <button class="btn" onclick="App.showWorldMap()" style="background:rgba(255,255,255,.1);color:#fff;padding:5px 12px;font-size:clamp(0.9rem,3.7vw,1rem)">← Zurück</button>
            <h2 style="flex:1;font-family:Arial,sans-serif;color:#29B6F6;font-size:1.1rem;margin:0">🌍 Rangliste</h2>
            ${player ? `<div style="font-size:clamp(0.9rem,3.7vw,1rem);color:#FFD700">Du: 🌀${myMT.toFixed(1)} MT</div>` : ''}
          </div>
          ${rows || '<div style="text-align:center;padding:30px;color:rgba(255,255,255,.4)">Keine Spieler gefunden</div>'}
        </div>
      </div>`);
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

    // Calculate total MT
    const totalMT = tasks.reduce((s,t) => s + (t?.mt || 0), 0);
    const doneTasks = tasks.filter(t => t?.done).length;

    // Build rows
    const tableRows = gl.map((game, i) => {
      const task = tasks[i];
      const mt = task?.mt || 0;
      const rawScore = task?.rawScore || 0;
      const plays = task?.plays || (task?.done ? 1 : 0);
      const done = task?.done || false;
      
      const mtColor = mt >= 1.3 ? '#27AE60' : mt >= 0.8 ? '#FFD700' : mt > 0 ? '#E67E22' : '#555';
      const mtDisplay = done ? `<span style="color:${mtColor};font-weight:700">${mt.toFixed(1)}</span>` : '—';
      // MT thresholds: passed=max, failed=0.2×base
      const base = game.baseReward || 1.0;
      const maxMT = (base * 1.5).toFixed(1);
      const minMT = (base * 0.2).toFixed(1);
      const bar = done ? Math.round((mt/(base*1.5))*100) : 0;

      return `<tr style="border-bottom:1px solid rgba(255,255,255,.05)">
        <td style="padding:5px 6px;font-size:clamp(0.82rem,3.4vw,0.92rem)">${game.icon} ${game.name}</td>
        <td style="padding:5px 6px;text-align:center">${mtDisplay}</td>
        <td style="padding:5px 6px;text-align:center;font-size:clamp(0.72rem,2.8vw,0.82rem);color:rgba(255,255,255,.5)">${minMT}–${maxMT}</td>
        <td style="padding:5px 6px;text-align:center;color:rgba(255,255,255,.75);font-size:clamp(0.82rem,3.2vw,0.9rem)">${rawScore > 0 ? rawScore : '—'}</td>
      </tr>`;
    }).join('');

    this._html(`
      <div class="mountain-bg"><div class="sky-gradient"></div>${mountainSVG()}</div>
      <div class="page" style="padding-top:10px">
        <div class="card" style="background:linear-gradient(135deg,rgba(5,10,25,.97),rgba(10,20,45,.95));border:1px solid rgba(41,182,246,.3);padding:12px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
            <button class="btn" onclick="App.showWorldMap()" style="background:rgba(255,255,255,.1);color:#fff;padding:5px 12px;font-size:clamp(0.9rem,3.7vw,1rem)">← Zurück</button>
            <h2 style="flex:1;font-family:Arial,sans-serif;color:#29B6F6;font-size:1rem;margin:0">📊 Kontoauszug</h2>
          </div>
          <!-- Summary -->
          <div style="display:flex;gap:8px;margin-bottom:10px">
            <div style="flex:1;background:rgba(255,215,0,.1);border:1px solid rgba(255,215,0,.3);border-radius:10px;padding:10px;text-align:center">
              <div style="font-size:1.4rem;font-weight:900;color:#FFD700">🌀 ${totalMT.toFixed(1)}</div>
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
            <table style="width:100%;border-collapse:collapse;font-size:clamp(0.88rem,3.6vw,0.98rem)">
              <thead>
                <tr style="border-bottom:1px solid rgba(41,182,246,.2);color:rgba(255,255,255,.75)">
                  <th style="padding:5px 6px;text-align:left;font-size:clamp(0.82rem,3.2vw,0.9rem)">Spiel</th>
                  <th style="padding:5px 6px;text-align:center;font-size:clamp(0.82rem,3.2vw,0.9rem)">MT</th>
                  <th style="padding:5px 6px;text-align:center;font-size:clamp(0.72rem,2.8vw,0.82rem);color:rgba(255,255,255,.5)">Bereich</th>
                  <th style="padding:5px 6px;text-align:center;font-size:clamp(0.82rem,3.2vw,0.9rem)">Score</th>
                </tr>
              </thead>
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

  _calClearDev(dev) {
    if (!confirm('Alle Kalibrierungsdaten für '+dev+' löschen?')) return;
    const calStore = JSON.parse(localStorage.getItem('cal_data_v3')||'{}');
    Object.keys(calStore).forEach(k=>{ if(k.endsWith('_'+dev)) delete calStore[k]; });
    localStorage.setItem('cal_data_v3', JSON.stringify(calStore));
    this.showKontoauszug();
  },

  // ---- GELDBEUTEL ----
  showGeldbeutel() {
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
    const totalMT = rows.reduce((s,r)=>s+r.mt,0);
    const tableRows = rows.map((r,i)=>`<tr style="border-bottom:1px solid rgba(255,255,255,.05)${i<3?';background:rgba(255,215,0,.04)':''}"><td style="padding:6px 8px;font-size:clamp(0.9rem,3.7vw,1rem)">${r.game.icon} ${r.game.name}</td><td style="padding:6px 8px;text-align:center;color:${r.mt>0?'#FFD700':'rgba(255,255,255,.3)'};font-weight:${r.mt>0?'700':'400'}">${r.mt>0?'🌀 '+r.mt:'—'}</td><td style="padding:6px 8px;text-align:center;color:rgba(255,255,255,.5);font-size:clamp(0.9rem,3.7vw,1rem)">${r.done?r.score:'—'}</td><td style="padding:6px 8px;text-align:center;color:rgba(255,255,255,.4);font-size:clamp(0.85rem,3.5vw,0.95rem)">${r.plays>0?r.plays+'×':'—'}</td></tr>`).join('');
    this._html(`<div class="mountain-bg"><div class="sky-gradient"></div>${mountainSVG()}</div><div class="page"><div class="card" style="background:linear-gradient(135deg,rgba(10,10,25,.95),rgba(20,20,40,.9));border:1px solid rgba(255,215,0,.25)"><div style="display:flex;align-items:center;gap:10px;margin-bottom:16px"><button class="btn" onclick="App.showWorldMap()" style="background:rgba(255,255,255,.1);color:#fff;padding:6px 14px">← Zurück</button><h2 style="flex:1;font-family:Arial,sans-serif;color:#FFD700;font-size:1.3rem">👜 Geldbeutel</h2><div style="text-align:right"><div style="font-size:clamp(0.85rem,3.5vw,0.95rem);color:rgba(255,255,255,.4)">Gesamt</div><div style="font-weight:900;color:#FFD700;font-size:1.1rem">🌀 ${totalMT.toFixed(1)} MT</div></div></div><div style="font-size:.72rem;color:rgba(255,255,255,.3);margin-bottom:10px">Jedes Spiel kann unbegrenzt wiederholt werden. Es zählt immer das letzte Ergebnis.</div><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:clamp(0.9rem,3.7vw,1rem)"><thead><tr style="border-bottom:2px solid rgba(255,215,0,.3);color:rgba(255,255,255,.5)"><th style="padding:7px 8px;text-align:left">Spiel</th><th style="padding:7px 8px;text-align:center">MT</th><th style="padding:7px 8px;text-align:center">Score</th><th style="padding:7px 8px;text-align:center">Gespielt</th></tr></thead><tbody>${tableRows}</tbody></table></div></div></div>`);
  },

  // ---- WORLD VIEW ----
  async showWorld(worldId) {
    this._loading('Welt laden...');
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
    const _isRefW = player.name.toLowerCase() === 'janoschtest';
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
      calStatus = '<div style="background:linear-gradient(135deg,#E74C3C,#C0392B);color:#fff;padding:10px 14px;border-radius:10px;margin-bottom:12px;font-size:clamp(0.9rem,3.7vw,1rem)">'
        +'<div style="font-weight:900;font-size:.95rem;margin-bottom:4px">&#128302; KALIBRIERUNGS-MODUS</div>'
        +'<div>Deine Spiele kalibrieren die MT-Belohnungen für alle anderen Spieler.</div>'
        +'<div style="margin-top:6px">&#128202; Kalibriert: <b>'+calCount+'/20</b> &nbsp; &#128260; Durchgänge: <b>'+runsCount+'</b>'+(lastRun?'&nbsp; &#128197; Letzter Run: <b>'+lastRunGames+'/20</b>':'')+'</div>'
        +'<div style="margin-top:4px;font-size:.72rem;opacity:.7">'+statusMsg+'</div>'
        +'</div>';
    }

    this._html(`
      <div class="mountain-bg"><div class="sky-gradient"></div><div class="cloud cloud-1"></div>${mountainSVG()}</div>
      <div class="page" style="padding-top:14px">
        
            <div class="world-banner ${world.bannerClass}" style="margin-bottom:10px">
          <span class="banner-icon">${world.icon}</span>
          <div class="banner-title">${world.name}</div>
          <div class="banner-sub">${done}/20 geschafft · 🌀${(ws.tasks||[]).reduce((s,t)=>s+(t?.mt||0),0).toFixed(1)} MT</div>
        </div>


        <div class="card" style="max-width:100%;padding:clamp(8px,2vw,16px);box-sizing:border-box">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
            <button onclick="App.showWorldMap()" style="background:none;border:none;font-size:0.95rem;cursor:pointer;color:var(--text-mid)">◀ Welten</button>
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
              <button onclick="App.showGlobalLeaderboard()" style="background:rgba(74,144,217,0.1);border:2px solid var(--sky-deep);color:var(--sky-deep);padding:5px 10px;border-radius:50px;font-weight:700;cursor:pointer;font-size:clamp(0.85rem,3.5vw,0.95rem)">🌍 Rangliste</button>
              <button onclick="App.showKontoauszug()" style="background:rgba(41,182,246,0.1);border:2px solid #29B6F6;color:#29B6F6;padding:5px 10px;border-radius:50px;font-weight:700;cursor:pointer;font-size:clamp(0.9rem,3.7vw,1rem)">📊 Kontoauszug</button>
              <button onclick="Wardrobe.open()" style="background:rgba(255,215,0,0.1);border:2px solid rgba(255,215,0,0.5);color:#FFD700;padding:clamp(5px,1.5vw,8px) clamp(8px,2.5vw,12px);border-radius:50px;font-weight:700;cursor:pointer;font-size:clamp(0.88rem,3.8vw,1rem);min-height:40px">👗 Kleider</button>
              <div class="joker-badge ${State.getJokersRemaining(player,worldId)===0?'used':''}"
              onclick="${State.getJokersRemaining(player,worldId)===0?'':  `App.showJokerMenu(${worldId})`}">
              🃏 ${State.getJokersRemaining(player,worldId)} Joker
            </div>
            </div>
          </div>

          ${window._showEyeTestHint ? `<div onclick="App.showEyeTest()" style="background:linear-gradient(135deg,rgba(100,200,255,.14),rgba(41,182,246,.08));border:1.5px solid rgba(100,200,255,.4);border-radius:12px;padding:10px 14px;margin-bottom:10px;cursor:pointer;display:flex;align-items:center;gap:10px">
            <span style="font-size:1.4rem">👁</span>
            <div style="flex:1">
              <div style="font-weight:900;color:rgba(180,240,255,1)">Schrift zu klein?</div>
              <div style="color:rgba(255,255,255,.5);font-size:.82rem">Schrift optimieren — 10 Stufen, ~30 Sek.</div>
            </div>
            <span style="color:rgba(100,200,255,.7)">›</span>
          </div>` : ''}
          <div style="font-size:clamp(0.9rem,3.7vw,1rem);color:var(--text-mid);margin-bottom:8px">Tippe auf die nächste Aufgabe:</div>

          ${_isRefW ? '<div style="background:rgba(231,76,60,.15);border:1px solid rgba(231,76,60,.4);border-radius:10px;padding:10px;margin-bottom:10px;font-size:clamp(0.9rem,3.7vw,1rem);color:#fff"><b style="color:#E74C3C">&#128302; Kalibrierung:</b> '+calCount+'/20 Spiele &middot; '+runsCount+' Durchgang'+(runsCount>=3?' &middot; ✅ Vollständig':runsCount>0?' &middot; '+Math.round(calCount/20*100)+'%':'')+'</div>' : ''}
      <div class="task-grid">
            ${world.tasks.map((task,i) => {
              const tdone = ws.tasks[i]&&ws.tasks[i].done;
              const tjok  = ws.tasks[i]&&ws.tasks[i].joker;
              // ALL tasks always playable (can replay, last score counts)
              let cls = tdone ? (tjok?'joker':'done') : 'active';
              const score = ws.tasks[i]?.score || '';
              const playCount = ws.tasks[i]?.plays || (tdone?1:0);
              const mtEarned = tdone&&ws.tasks[i]?.mt ? ws.tasks[i].mt : '';
              return `
                <button class="task-btn ${cls}"
                  onclick="App.startTask(${worldId},${i})"
                  style="touch-action:manipulation"
                  title="${task.name||task.title||'Spiel '+(i+1)}">
                  <span class="task-icon" style="font-size:clamp(1.7rem,7.5vw,2.1rem);display:block;margin-bottom:3px;line-height:1">${task.icon||'🎮'}</span>
                  <span class="task-name" style="font-size:clamp(0.9rem,4.2vw,1.05rem);font-weight:700;line-height:1.2;display:block">${task.name||('Spiel '+(i+1))}</span>
                  ${mtEarned?`<span style="font-size:clamp(0.88rem,3.8vw,0.97rem);color:#FFD700">🌀${mtEarned}</span>`:score?`<span style="font-size:clamp(0.85rem,3.5vw,0.95rem);opacity:0.8">⭐${score}</span>`:''}
                </button>`;
            }).join('')}
          </div>

          <div style="margin-top:12px">
            <div class="progress-bar-wrap">
              <div class="progress-bar-fill" style="width:${done*10}%"></div>
            </div>
            <div style="text-align:center;font-size:clamp(0.85rem,3.5vw,0.95rem);color:var(--text-mid)">${done}/10 Aufgaben</div>
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
    if (rem === 0) { alert('Keine Joker mehr in dieser Welt!'); return; }
    if (confirm(`🃏 Joker einsetzen?\nNoch ${rem} Joker in dieser Welt.\nDie aktuelle Aufgabe zählt als geschafft.`)) {
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
                style="background:rgba(41,182,246,.12);border:2px solid rgba(41,182,246,.35);color:#29B6F6;padding:5px 9px;border-radius:50px;font-size:clamp(0.85rem,3.5vw,0.95rem);font-weight:700;cursor:pointer;touch-action:manipulation" title="Zoom">
                🔍
              </button>
              <button onclick="App._confirmLeave(${worldId})"
                style="background:#FFF5F5;border:2px solid #E74C3C;color:#E74C3C;padding:5px 10px;border-radius:50px;font-size:clamp(0.85rem,3.5vw,0.95rem);font-weight:700;cursor:pointer">
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

    // ── AUTO-ZOOM: fit game to screen width on mobile ──
    const _taskType = task?.type || task?.id || '';
    setTimeout(() => {
      const ga = document.getElementById('game-area');
      const btn = document.getElementById('zoom-btn');
      if (!ga || window.innerWidth >= 700) return; // desktop: no auto-zoom
      const setZoom = (z) => {
        this._zoomLevel = z;
        ga.style.transform = `scale(${z})`;
        ga.style.transformOrigin = 'top left';
        ga.style.marginBottom = Math.round((z-1)*ga.offsetHeight*0.5)+'px';
        ga.style.marginRight = Math.round((z-1)*ga.offsetWidth*0.5)+'px';
        if (btn) { btn.textContent = `🔍 ${Math.round(z*100)}%`; btn.style.background = 'rgba(41,182,246,.25)'; }
      };
      // Tennis/Pong: measure actual game content and fit to screen
      if (_taskType === 'pong') {
        const pongCanvas = ga.querySelector('canvas');
        const pongW = pongCanvas ? pongCanvas.offsetWidth : ga.scrollWidth;
        const idealZoomP = Math.min(screenW / (pongW + 80), 2.5); // +80 for touch strip
        const snappedP = [1.5, 1.75, 2.0, 2.25, 2.5].reduce((a,b)=>Math.abs(b-idealZoomP)<Math.abs(a-idealZoomP)?b:a);
        setZoom(Math.max(1.75, snappedP)); // min 175%
        return;
      }
      // Other games: auto-fill screen
      const inner = ga.querySelector('canvas') || ga.querySelector('div');
      const gameW = inner ? (inner.offsetWidth || inner.scrollWidth) : ga.scrollWidth;
      const screenW = window.innerWidth;
      if (gameW > 10 && screenW > gameW * 1.05) {
        const idealZoom = Math.min(screenW / gameW, 2.5);
        const steps = [0.85, 1, 1.1, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5];
        const snapped = steps.reduce((a,b) => Math.abs(b-idealZoom)<Math.abs(a-idealZoom)?b:a);
        if (snapped > 1.05) setZoom(snapped);
      }
    }, 400);

    // Device detection helper
    const _getDevice=()=>{
      const ua=navigator.userAgent;
      if(/iPad/.test(ua))return'iPad';
      if(/iPhone/.test(ua))return'iPhone';
      if(/Android/.test(ua)&&/Mobile/.test(ua))return'Android';
      if(/Android/.test(ua))return'Android-Tablet';
      if(window.innerWidth>1200)return'Desktop';
      return'Sonstiges';
    };

    const onComplete = async (result) => {
      GameLog.log(task.type||task.id, 'onComplete: rawScore='+result.rawScore+' passed='+result.passed+' errors='+result.errors);
      // Save score record for admin panel
      try {
        const recKey='admin_score_records';
        const recs=JSON.parse(localStorage.getItem(recKey)||'{}');
        const gId=task.type||task.id||'unknown';
        if(!recs[gId])recs[gId]=[];
        recs[gId].push({
          date:new Date().toLocaleString('de-CH'),
          player:State.currentPlayer?.name||'?',
          device:_getDevice(),
          score:result.rawScore||0,
          mt:0, // will be updated after calcMT
          passed:result.passed||false,
        });
        if(recs[gId].length>200)recs[gId]=recs[gId].slice(-200); // keep last 200
        localStorage.setItem(recKey,JSON.stringify(recs));
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
              if(maxS===minS) return raw>=avgS?1.2:0.8;
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
            el.push(new Date().toLocaleString('de-CH')+': Unbekannter Spieltyp: '+task.type);
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
              <button onclick="App.showGlobalLeaderboard()" style="flex:1;padding:11px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.7);border-radius:9px;cursor:pointer">Abbrechen</button>
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
    if(file.size > 3*1024*1024) { alert('Bild zu groß! Bitte max. 3MB.'); return; }
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
    if(!reason) { alert('Bitte Grund wählen.'); return; }
    const desc = (document.getElementById('rdesc')?.value||'').trim();
    if(desc.length < 5) { alert('Bitte Beschreibung ausfüllen.'); return; }
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
          tsStr: new Date().toLocaleString('de-CH'),
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
    if (!player || (name !== 'bu' && name !== 'mischa' && name !== 'admin')) { alert('Kein Zugriff.'); return; }
    this._loading('Lade Meldungen...');
    let reports = [];
    try {
      if(typeof _db !== 'undefined' && _db) {
        const snap = await _db.collection('player_reports').orderBy('ts','desc').limit(80).get();
        snap.forEach(doc => reports.push({id: doc.id, ...doc.data()}));
      }
    } catch(e) { console.warn('Load failed:', e); }

    window._rCache = {};
    reports.forEach(r => window._rCache[r.id] = r);

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
    if(!r) { alert('Nicht gefunden.'); return; }
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
    } catch(e) { alert('Fehler: '+e.message); }
  },

  async _doBan(playerName, reportId, who) {
    const selectId = who === 'reported' ? 'ban-dur-reported' : 'ban-dur-reporter';
    const dur = parseInt(document.getElementById(selectId)?.value||'86400000');
    const reason = document.getElementById('ban-reason-txt')?.value||'Regelverstoß';
    if(!confirm(`"${playerName}" sperren?
Grund: ${reason}`)) return;
    try {
      if(typeof _db!=='undefined'&&_db) {
        await _db.collection('player_bans').doc(playerName.toLowerCase()).set({
          reason, bannedAt: Date.now(), permanent: dur===0,
          expiresAt: dur===0 ? null : Date.now()+dur,
          bannedBy: State.currentPlayer?.name||'admin', reportId,
        });
        if(who==='reported') await _db.collection('player_reports').doc(reportId).update({status:'resolved'});
      }
      alert(`✅ ${playerName} gesperrt${dur===0?' (permanent)':' für '+(dur/3600000<24?dur/3600000+'h':dur/86400000+'d')}.`);
      this.showAdminReports();
    } catch(e) { alert('Fehler: '+e.message); }
  },

  async _doUnban(playerName) {
    if(!confirm(`Sperrung von "${playerName}" aufheben?`)) return;
    try {
      if(typeof _db!=='undefined'&&_db) await _db.collection('player_bans').doc(playerName.toLowerCase()).delete();
      alert(`✅ ${playerName} freigegeben.`);
    } catch(e) { alert('Fehler: '+e.message); }
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

  _confirmLeave(worldId) {
    this._zoomLevel = 1; // Reset zoom on leave
    if(typeof SokobanGame !== 'undefined' && SokobanGame._cleanup) SokobanGame._cleanup();
    if (confirm('Aufgabe verlassen?\nDein Fortschritt in dieser Aufgabe geht verloren.')) {
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
    if (confirm('🃏 Joker einsetzen? Aufgabe zählt als geschafft!')) {
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
            ${wasJoker?'Aufgabe geschafft.':finalScore>0?`✅ Geschafft! +${mtEarned||1} 🌀 MT verdient!`:'Weiter geht\'s! +0.2 🌀 MT'}
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
            ${isAdminUnlock ? `<div style="margin-top:8px;font-size:clamp(0.9rem,3.7vw,1rem);color:#E74C3C;font-weight:700">
              🔐 Nach 10 Resets: Admin-Chat freigeschaltet!
            </div>` : `<div style="font-size:clamp(0.85rem,3.5vw,0.95rem);color:var(--text-mid);margin-top:6px">
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
    dart:        '🎯 <b>Dart!</b><br>Wirf 3 Pfeile auf die Scheibe. Klicke oder tippe auf die Scheibe — je näher zur Mitte, desto mehr Punkte!<br>📱 Handy/Tablet: Das Steuerkreuz rechts neben der Scheibe zum Zielen nutzen, loslassen = Wurf.',
    math:        '🔢 <b>Rechnen!</b><br>Löse Mathe-Aufgaben so schnell wie möglich. Tippe die richtige Antwort ein und bestätige mit Enter.',
    reaction:    '⚡ <b>Reaktion!</b><br>Drücke den Knopf so schnell wie möglich, sobald das Signal erscheint. Warte auf grün!',
    memory:      '🧠 <b>Memory!</b><br>Finde alle Paare! Drehe zwei Karten um — stimmen sie überein, bleiben sie offen.',
    train:       '🚂 <b>Zug!</b><br>Lenke den Zug ans Ziel. Tippe auf die Weichen, um die Richtung zu ändern.',
    shutthebox:  '🎲 <b>Shut the Box!</b><br>Würfle und lege Zahlen um, deren Summe der Würfelzahl entspricht. Lege alle Zahlen um!',
    jenga:       '🏎️ <b>Race — 1km Rennen!</b><br>Fahre 1 km so schnell wie möglich.<br>📱 Mobile: Gas / Bremse / Drehen-Buttons<br>🖥️ Desktop: → Gas · ← Bremse · ↑ Drehen CW · ↓ Drehen CCW<br>Springe über Hügel — Überschlag = Ende!',
    stunt:       '🏎️ <b>Race — 1km Rennen!</b><br>Fahre 1 km so schnell wie möglich.<br>📱 Mobile: Gas / Bremse / Drehen-Buttons<br>🖥️ Desktop: → Gas · ← Bremse · ↑ Drehen CW · ↓ Drehen CCW<br>Springe über Hügel — Überschlag = Ende!',
    slider:      '🧩 <b>Schiebepuzzle!</b><br>Schiebe die Teile, bis das Bild vollständig ist. Tippe auf ein Teil neben dem Leerfeld, um es zu verschieben.',
    wordsearch:  '🔤 <b>Wortsuche!</b><br>Finde alle versteckten Wörter im Buchstabengitter. Wische über die Buchstaben.',
    typing:      '🟩 <b>Tetris!</b><br>Bewege und drehe fallende Blöcke, um vollständige Reihen zu bilden.<br>📱 Mobile: Buttons zum Steuern<br>🖥️ Desktop: ← → bewegen · ↑ oder Leertaste drehen · ↓ schneller fallen lassen.',
    balloon:     '🐍 <b>Snake!</b><br>Steuere die Schlange mit den Pfeiltasten oder Wischen. Friss Äpfel, werde länger — berühre nicht dich selbst!',
    simon:       '🎨 <b>Simon!</b><br>Merke dir die Farbfolge und wiederhole sie. Wird nach jeder Runde länger.',
    truefalse:   '❓ <b>Wahr oder Falsch?</b><br>Beantworte Fragen mit Wahr oder Falsch. Tippe auf den richtigen Knopf.',
    anagram:     '🔤 <b>Anagramm!</b><br>Ordne die durcheinander gewürfelten Buchstaben zum richtigen Wort.',
    colormix:    '🎨 <b>Farben mischen!</b><br>Mische die richtigen Farben, um den gewünschten Farbton zu erreichen.',
    clock:       '🕐 <b>Uhr!</b><br>Stelle die Uhrzeiger auf die angezeigte Zeit.',
    flags:       '🌍 <b>Flaggen!</b><br>Erkenne die Flagge und wähle das richtige Land.',
    hangman:     '🎯 <b>Hangman!</b><br>Errate das versteckte Wort Buchstabe für Buchstabe.',
    tictactoe:   '❌ <b>Tic-Tac-Toe!</b><br>Setze 3 in einer Reihe gegen den Computer.',
    weight:      '⚖️ <b>Gewichte!</b><br>Schätze welche Seite der Waage schwerer ist.',
    basketball:  '🏀 <b>Basketball!</b><br>Wirf den Ball ins Korb — tippe auf den Knopf im richtigen Moment.',
    emojistory:  '📖 <b>Emoji Story!</b><br>Errate die Geschichte oder den Film hinter den Emojis.',
    geo:         '🗺️ <b>Geografie!</b><br>Zeige auf die richtige Position auf der Karte.',
    french:      '🇫🇷 <b>Französisch!</b><br>Übersetze die Wörter von Deutsch nach Französisch.',
    riddle:      '🧩 <b>Rätsel!</b><br>Löse das Rätsel und tippe deine Antwort ein.',
    pacman:      '🟡 <b>Pac-Man!</b><br>Friss alle Punkte im Labyrinth! Vermeide die Geister — oder friss sie nach einem Power-Pellet (grosser Punkt).<br>📱 Mobile: 4 Richtungstasten oder Gerät neigen (Button oben)<br>🖥️ Desktop: Pfeiltasten',
    starwars:    '🚀 <b>Star Wars — Weltraum-Shooter!</b><br>Schiesse die feindlichen Raumschiffe ab, bevor sie landen! Du hast 3 Leben.<br>📱 Mobile: ◀ ▶ zum Bewegen, Schiessen-Button<br>🖥️ Desktop: ← → bewegen, Leertaste schiessen',
    pong:        '🏓 <b>Pong — Tennis-Klassiker!</b><br>Der Ball wird mit der Zeit SCHNELLER — reagiere rechtzeitig! Erste 7 Punkte gewinnt oder wer nach 60s mehr hat.<br>📱 Mobile: ▲ ▼ Buttons<br>🖥️ Desktop: ↑ ↓ Pfeiltasten',
  };
  const instr = INSTRUCTIONS[type] || `🎮 <b>Los geht's!</b><br>Spiele das Spiel so gut du kannst!`;
  return `<span style="font-size:1.5rem">${icon}</span><br>${instr}`;
}

window.App = App;
window.mountainSVG = mountainSVG;
window.worldPathSVG = worldPathSVG;
window.getTaskInstruction = getTaskInstruction;
