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
        <div style="font-family:'Fredoka One',cursive;font-size:1.3rem;margin-top:10px">${msg}</div>
      </div></div>`);
  },

  // ---- WELCOME ----
  showWelcome() {
    const mt = State.currentPlayer?.totalScore || 0;
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
        </div>
        <div class="card">
          <div class="card-title">Willkommen! 👋</div>

          <!-- Welt 1 Box -->
          <div style="background:#EBF5FB;border:2px solid #2980B9;border-radius:14px;padding:14px;margin-bottom:12px">
            <div style="font-weight:900;color:#2980B9;font-size:1rem;margin-bottom:6px">🎮 Welt 1 — Denkspiel</div>
            <div style="font-size:.82rem;color:#333;line-height:1.6">
              Spiele <b>20 verschiedene Spiele</b> und verdiene <b>Mischa Taler (🌀 MT)</b>.<br>
              Je besser du spielst, desto mehr MT bekommst du (bis 1.5 MT pro Spiel).<br>
              <span style="color:#888;font-size:.76rem">🎯 Dart · 🔢 Rechnen · 🚂 Zug · 🧠 Memory · ⚡ Reaktion · und mehr...</span>
            </div>
          </div>

          <!-- Welt 2 Box -->
          <div style="background:#EAFAF1;border:2px solid #27AE60;border-radius:14px;padding:14px;margin-bottom:16px">
            <div style="font-weight:900;color:#27AE60;font-size:1rem;margin-bottom:6px">🦁 Welt 2 — Zoo-Empire</div>
            <div style="font-size:.82rem;color:#333;line-height:1.6">
              Teleportiere für <b>10 🌀 MT</b> in den Zoo.<br>
              Kaufe Tiere mit der Gondelbahn · Baue Gehege auf · Verdiene automatisch MT.<br>
              <span style="color:#888;font-size:.76rem">🚡 Gondelbahn · 🎡 Glücksrad · 🌀 Multiplayer · Slap-System</span>
            </div>
          </div>

          <div style="display:flex;flex-direction:column;gap:8px">
            <button class="btn btn-primary btn-full btn-big" onclick="App.showCharSelect()">🆕 Neu registrieren</button>
            <button class="btn btn-secondary btn-full" onclick="App.showLogin()">🔑 Anmelden</button>
            <div style="display:flex;gap:6px;margin-top:2px">
              <button class="btn btn-full" style="flex:1;background:rgba(255,255,255,0.5);color:var(--text-dark)" onclick="App.showGlobalLeaderboard()">🌍 Rangliste</button>
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
    const mt = p.totalScore || 0;
    const cost = 10;
    if (mt < cost) { alert('Zu wenig MT! Du brauchst 10 MT. Du hast: ' + mt + ' MT'); return; }
    if (!confirm(`🦁 Für ${cost} MT in den Zoo teleportieren?\nDu hast: ${mt} MT\nNach Teleport: ${mt-cost} MT`)) return;
    await State.addPoints(p.name, -cost);
    sessionStorage.setItem('mischa_current', p.name.toLowerCase());
    window.location.href = 'zoo.html';
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
        <div style="font-family:'Fredoka One',cursive;color:#2980B9;font-size:1.1rem;margin-bottom:10px">📱 Neuer Spieler beitreten</div>
        <img src="${qrUrl}" style="width:200px;height:200px;border-radius:8px;display:block;margin:0 auto" alt="QR Code"/>
        <div style="font-size:.75rem;color:#666;margin-top:10px;word-break:break-all">${url}</div>
        <button onclick="navigator.clipboard?.writeText('${url}').then(()=>this.textContent='✅ Kopiert!').catch(()=>{})" style="margin-top:10px;background:#2980B9;color:white;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:.85rem">📋 Link kopieren</button>
        <br><button onclick="this.closest('[style*=fixed]').remove()" style="margin-top:8px;background:none;border:none;color:#888;cursor:pointer;font-size:.82rem">Schliessen</button>
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
            <div style="font-size:0.82rem;font-weight:700;color:var(--text-mid);margin-bottom:7px">🎨 Farbe:</div>
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
    if (nameLc === 'janoschtest' && pw !== 'janoschtest') {
      const e=document.getElementById('l-err'); if(e){e.textContent='❌ Falsches Passwort für Janoschtest!';e.style.display='block';} return;
    }
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
    this.showWorldMap();
  },

  // ---- WORLD MAP ----
  async showWorldMap() {
    this._loading('Laden...');
    const player = await State.refreshCurrentPlayer();
    if (!player) { this.showWelcome(); return; }
    const _isRef = player.name.toLowerCase() === 'janoschtest';
    const _isAdmin = player.name.toLowerCase() === 'bu';
    // Bu gets displayed with special black/gold style
    const displayName = _isAdmin ? '<span style="background:#FFD700;color:#000;font-weight:900;padding:2px 8px;border-radius:6px">Bu 🌀</span>' : _isRef ? '<span style="color:#ff6b6b">🔬 '+player.name+'</span>' : player.name;
    // Show calibration banner for Janoschtest
    if (_isRef) setTimeout(() => {
      document.getElementById('ref-banner')?.remove();
      const b = document.createElement('div');
      b.id='ref-banner';
      b.style.cssText='position:fixed;top:0;left:0;right:0;z-index:9998;background:linear-gradient(135deg,#E74C3C,#C0392B);color:white;padding:8px 16px;text-align:center;font-family:"Fredoka One",cursive;font-size:.88rem;box-shadow:0 2px 8px rgba(0,0,0,.3)';
      b.innerHTML='🔬 KALIBRIERUNGS-MODUS — Spieler: Janoschtest · Deine Ergebnisse kalibrieren die MT-Belohnungen · Nicht in Rangliste <button onclick="this.parentElement.remove()" style="background:rgba(255,255,255,.2);border:none;color:white;padding:1px 7px;border-radius:4px;cursor:pointer;margin-left:8px">✕</button>';
      document.body.prepend(b);
    }, 600);
    const ch = this._char(player);

    this._html(`
      <div class="mountain-bg">
        <div class="sky-gradient"></div>
        <div class="cloud cloud-1"></div><div class="cloud cloud-2"></div>
        ${mountainSVG()}
      </div>
      <div class="page" style="padding-top:24px">
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:center;width:100%;max-width:480px;margin-bottom:12px">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:1.8rem">${ch?.emoji||'🧭'}</span>
            <div>
              <div style="font-family:'Fredoka One',cursive;font-size:1rem;color:white;text-shadow:0 2px 4px rgba(0,0,0,0.3)">${displayName}</div>
              <div style="background:rgba(255,215,0,.3);border:1px solid #FFD700;color:#FFD700;font-weight:900;font-size:.82rem;padding:3px 10px;border-radius:20px">🌀 ${player.totalScore||0} MT</div>
            </div>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button onclick="App.showGlobalLeaderboard()" style="background:rgba(255,255,255,0.25);border:2px solid white;color:white;padding:6px 12px;border-radius:50px;font-weight:700;cursor:pointer;font-size:0.78rem">🌍 Rangliste</button>
            <button onclick="Shop.open(null,()=>App.showWorldMap())" style="background:rgba(255,215,0,0.3);border:2px solid #FFD700;color:#FFD700;padding:6px 12px;border-radius:50px;font-weight:700;cursor:pointer;font-size:0.78rem">🛒 Shop</button>
            <button onclick="App._logout()" style="background:rgba(255,255,255,0.25);border:2px solid white;color:white;padding:6px 12px;border-radius:50px;font-weight:700;cursor:pointer;font-size:0.78rem">Abmelden</button>
          </div>
        </div>

        <!-- MT Counter prominent -->
        <div style="text-align:center;margin-bottom:10px">
          <div style="background:rgba(255,215,0,.2);border:2px solid #FFD700;border-radius:50px;padding:8px 20px;display:inline-block">
            <span style="font-size:1.4rem;font-weight:900;color:#FFD700">🌀 ${player.totalScore||0} MT</span>
            <span style="font-size:.75rem;color:rgba(255,255,255,.7);margin-left:8px">Mischa Taler</span>
          </div>
        </div>

        <!-- Teleport Button -->
        ${(player.totalScore||0)>=10 ? `
        <div style="margin-bottom:12px">
          <button onclick="App.teleportToZoo()" style="width:100%;max-width:480px;background:linear-gradient(135deg,#27AE60,#1E8449);color:white;border:none;padding:14px 20px;border-radius:16px;font-family:'Fredoka One',cursive;font-size:1.1rem;cursor:pointer;box-shadow:0 4px 15px rgba(39,174,96,.4);animation:bounce 1s infinite">
            🚀 In den Zoo teleportieren! (10 🌀 MT)
          </button>
        </div>` : `
        <div style="margin-bottom:12px;background:rgba(39,174,96,.1);border:2px dashed rgba(39,174,96,.5);border-radius:14px;padding:12px;text-align:center;max-width:480px;width:100%">
          <div style="font-size:.9rem;color:rgba(255,255,255,.9);font-weight:700">🦁 Zoo freischalten</div>
          <div style="font-size:.8rem;color:rgba(255,255,255,.6);margin-top:4px">Noch ${10-(player.totalScore||0)} 🌀 MT bis zur Teleportation</div>
          <div style="background:rgba(255,255,255,.15);border-radius:6px;height:8px;margin-top:8px;max-width:200px;margin-left:auto;margin-right:auto">
            <div style="background:#27AE60;height:8px;border-radius:6px;width:${Math.min(100,(player.totalScore||0)/10*100)}%"></div>
          </div>
        </div>`}

        <div style="font-family:'Fredoka One',cursive;font-size:1.1rem;color:white;text-align:center;margin-bottom:10px">🎮 Deine 20 Spiele</div>

        <div class="world-map">
          ${WORLDS.map(world => {
            const ws = player.worlds?.[world.id] || { tasks:Array(10).fill(null), jokerUsed:false, completed:false };
            const done = ws.tasks.filter(t=>t&&t.done).length;
            const unlocked = world.id <= (player.currentWorld||1);
            const completed = ws.completed;
            let cls = unlocked ? 'unlocked' : 'locked';
            if (completed) cls = 'completed';
            return `
              <div class="world-item ${cls}" onclick="${unlocked?`App.showWorld(${world.id})`:'void(0)'}">
                <span class="world-icon">${world.icon}</span>
                <div class="world-info">
                  <div class="world-name">${world.name}</div>
                  <div class="world-desc">${world.difficulty}</div>
                  <div class="world-progress">${done}/${ws.tasks.length} Spiele ✓ · 🌀 ${player.totalScore||0} MT</div>
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

  // ---- GLOBAL LEADERBOARD ----
  async showGlobalLeaderboard() {
    this._loading('Rangliste laden...');
    // Load from cloud with timeout, fallback to local
    let players = [];
    try {
      const result = await Promise.race([
        State.getLeaderboard(30),
        new Promise(r => setTimeout(() => r(null), 4000))
      ]);
      players = result || [];
    } catch(e) { players = []; }
    // If cloud fails, use local storage
    if (!players.length) {
      players = Object.values(State._local.getAll())
        .filter(p=>p&&p.name&&(window.isInLeaderboard?window.isInLeaderboard(p.name):true)).sort((a,b)=>(b.totalScore||0)-(a.totalScore||0));
    }
    const player = State.currentPlayer;

    this._html(`
      <div class="mountain-bg"><div class="sky-gradient"></div><div class="cloud cloud-1"></div>${mountainSVG()}</div>
      <div class="page" style="padding-top:20px">
        <div style="display:flex;align-items:center;gap:10px;width:100%;max-width:480px;margin-bottom:14px">
          <button onclick="${player?'App.showWorldMap()':'App.showWelcome()'}" style="background:rgba(255,255,255,0.3);border:2px solid white;color:white;padding:7px 14px;border-radius:50px;font-weight:700;cursor:pointer">◀</button>
          <div style="font-family:'Fredoka One',cursive;font-size:1.5rem;color:white;text-shadow:0 2px 6px rgba(0,0,0,0.3)">🌍 Weltrangliste</div>
        </div>

        <div style="background:rgba(255,255,255,0.92);border-radius:18px;padding:16px;width:100%;max-width:480px;box-shadow:var(--shadow-big);max-height:70vh;overflow-y:auto">
          ${players.length === 0
            ? '<div style="text-align:center;padding:30px;color:var(--text-mid)">Noch keine Spieler 😊</div>'
            : players.map((p, i) => {
                const ch = CHARACTERS.find(c=>c.id===p.character);
                const rankIcon = i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}.`;
                const isMe = player && p.name.toLowerCase()===player.name.toLowerCase();
                const worldsDone = Object.values(p.worlds||{}).filter(w=>w.completed).length;
                return `
                  <div style="display:flex;align-items:center;gap:10px;padding:10px 8px;border-radius:12px;margin-bottom:6px;
                    background:${isMe?'rgba(123,196,127,0.15)':'transparent'};
                    border:${isMe?'2px solid var(--meadow)':'2px solid transparent'}">
                    <div style="font-family:'Fredoka One',cursive;font-size:1.1rem;width:28px;text-align:center">${rankIcon}</div>
                    <span style="font-size:1.4rem">${ch?.emoji||'🧭'}</span>
                    <div style="flex:1">
                      <div style="font-weight:700;font-size:0.95rem">${p.name}${isMe?' (du)':''}</div>
                      <div style="font-size:0.72rem;color:var(--text-mid)">Welt ${p.currentWorld||1}/10 · ${worldsDone} ✓ · ${new Date().getFullYear()-(p.birthYear||2000)}J</div>
                    </div>
                    <div style="font-family:'Fredoka One',cursive;color:#E67E22;font-size:1rem">⭐ ${p.totalScore||0}</div>
                  </div>`;
              }).join('')
          }
        </div>
      </div>`);
  },

  // ---- WORLD VIEW ----
  async showWorld(worldId) {
    this._loading('Welt laden...');
    const player = await State.refreshCurrentPlayer();
    if (!player) { this.showWelcome(); return; }
    const world = WORLDS.find(w=>w.id===worldId);
    const ws = player.worlds?.[worldId] || { tasks:Array(20).fill(null), jokerUsed:false, completed:false };
    // Ensure tasks array is 20 items
    while((ws.tasks||[]).length < 20) ws.tasks = [...(ws.tasks||[]), ...Array(20).fill(null)].slice(0,20);
    const done = ws.tasks.filter(t=>t&&t.done).length;
    const ch = this._char(player);

    this._html(`
      <div class="mountain-bg"><div class="sky-gradient"></div><div class="cloud cloud-1"></div>${mountainSVG()}</div>
      <div class="page" style="padding-top:14px">
        <div class="world-banner ${world.bannerClass}" style="margin-bottom:10px">
          <span class="banner-icon">${world.icon}</span>
          <div class="banner-title">${world.name}</div>
          <div class="banner-sub">${world.difficulty} · ${done}/10 geschafft</div>
        </div>

        <!-- Path -->
        <div style="background:rgba(255,255,255,0.9);border-radius:14px;overflow:hidden;margin-bottom:10px;width:100%;max-width:480px;box-shadow:var(--shadow)">
          ${worldPathSVG(worldId, done, ch?.emoji||'🧭', world.icon)}
        </div>

        <div class="card" style="max-width:480px;padding:16px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
            <button onclick="App.showWorldMap()" style="background:none;border:none;font-size:0.95rem;cursor:pointer;color:var(--text-mid)">◀ Welten</button>
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
              <button onclick="App.showGlobalLeaderboard()" style="background:rgba(74,144,217,0.1);border:2px solid var(--sky-deep);color:var(--sky-deep);padding:5px 10px;border-radius:50px;font-weight:700;cursor:pointer;font-size:0.75rem">🌍 Rangliste</button>
              <button onclick="Wardrobe.open()" style="background:rgba(255,215,0,0.1);border:2px solid rgba(255,215,0,0.5);color:#FFD700;padding:5px 10px;border-radius:50px;font-weight:700;cursor:pointer;font-size:0.75rem">👗 Garderobe</button>
              <div class="joker-badge ${State.getJokersRemaining(player,worldId)===0?'used':''}"
              onclick="${State.getJokersRemaining(player,worldId)===0?'':  `App.showJokerMenu(${worldId})`}">
              🃏 ${State.getJokersRemaining(player,worldId)} Joker
            </div>
            </div>
          </div>

          <div style="font-size:0.8rem;color:var(--text-mid);margin-bottom:8px">Tippe auf die nächste Aufgabe:</div>

          <div class="task-grid">
            ${world.tasks.map((task,i) => {
              const tdone = ws.tasks[i]&&ws.tasks[i].done;
              const tjok  = ws.tasks[i]&&ws.tasks[i].joker;
              const firstUndone = ws.tasks.findIndex(t=>!t||!t.done);
              const isActive = i===firstUndone;
              let cls='locked';
              if(tdone) cls=tjok?'joker':'done';
              else if(isActive) cls='active';
              const score = tdone&&ws.tasks[i]?.score ? ws.tasks[i].score : '';
              const mtEarned = tdone&&ws.tasks[i]?.mt ? ws.tasks[i].mt : '';
              return `
                <button class="task-btn ${cls}"
                  onclick="${(isActive||tdone)?`App.startTask(${worldId},${i})`:'void(0)'}"
                  title="${task.name||task.title||'Spiel '+(i+1)}">
                  <span style="font-size:1.3rem">${task.icon||'🎮'}</span>
                  <span style="font-size:0.62rem;font-weight:700">${task.name||('Spiel '+(i+1))}</span>
                  ${mtEarned?`<span style="font-size:0.6rem;color:#FFD700">🌀${mtEarned}</span>`:score?`<span style="font-size:0.55rem;opacity:0.8">⭐${score}</span>`:''}
                </button>`;
            }).join('')}
          </div>

          <div style="margin-top:12px">
            <div class="progress-bar-wrap">
              <div class="progress-bar-fill" style="width:${done*10}%"></div>
            </div>
            <div style="text-align:center;font-size:0.75rem;color:var(--text-mid)">${done}/10 Aufgaben</div>
          </div>
        </div>
      </div>`);
  },

  async showJokerMenu(worldId) {
    const player = await State.refreshCurrentPlayer();
    const ws = player.worlds?.[worldId];
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
    const player = await State.refreshCurrentPlayer();
    const world  = WORLDS.find(w=>w.id===worldId);
    const task   = world.tasks[taskIndex];
    const ageGroup = State.getAgeGroup(player);
    const ws = player.worlds?.[worldId] || {};

    this._html(`
      <div class="mountain-bg"><div class="sky-gradient"></div>${mountainSVG()}</div>
      <div class="page">
        <div class="game-container">
          <div class="game-header">
            <div class="game-title">${task.icon} ${task.title}</div>
            <div style="display:flex;gap:8px;align-items:center">
              <button onclick="App._confirmLeave(${worldId})"
                style="background:#FFF5F5;border:2px solid #E74C3C;color:#E74C3C;padding:5px 10px;border-radius:50px;font-size:0.75rem;font-weight:700;cursor:pointer">
                ✕ Verlassen
              </button>
              <div class="joker-badge ${ws.jokerUsed?'used':''}"
                onclick="${ws.jokerUsed?'':  `App.useJokerInGame(${worldId},${taskIndex})`}">
                🃏
              </div>
            </div>
          </div>
          <div id="game-area">
            <div style="text-align:center;padding:40px;color:var(--text-mid)">⏳ Laden...</div>
          </div>
        </div>
      </div>`);

    const onComplete = async (result) => {
      await State.completeTask(player.name, worldId, taskIndex, result);
      this._showTaskComplete(worldId, taskIndex, result);
    };

    setTimeout(() => {
      switch (task.type) {
        case 'math':        MathGame.start({ ageGroup, worldId, onComplete }); break;
        case 'reaction':    ReactionGame.start({ onComplete }); break;
        case 'memory':      MemoryGame.start({ emojis: world.memoryEmojis, onComplete }); break;
        case 'train':       TrainGame.start({ worldId, onComplete }); break;
        case 'shutthebox':  ShutTheBoxGame.start({ onComplete }); break;
        case 'jenga':       JengaGame.start({ worldId, ageGroup, onComplete }); break;
        case 'slider':      SliderGame.start({ ageGroup, worldId, onComplete }); break;
        case 'wordsearch':  WordSearchGame.start({ worldId, onComplete }); break;
        case 'typing':      TypingGame.start({ ageGroup, worldId, onComplete }); break;
        case 'balloon':     BalloonGame.start({ ageGroup, worldId, onComplete }); break;
        case 'simon':       SimonGame.start({ worldId, onComplete }); break;
        case 'truefalse':   TrueFalseGame.start({ worldId, onComplete }); break;
        case 'dart':        DartGame.start({ onComplete }); break;
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
        case 'french':      FrenchGame.start({ onComplete }); break;
        case 'riddle':      RiddleGame.start({ onComplete }); break;
        default:
          document.getElementById('game-area').innerHTML = '<div style="padding:20px;text-align:center">🚧 Kommt bald!</div>';
      }
    }, 120);
  },

  _confirmLeave(worldId) {
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
    const player = await State.refreshCurrentPlayer();
    const world  = WORLDS.find(w=>w.id===worldId);
    const allDone = player.worlds?.[worldId]?.tasks.every(t=>t&&t.done);
    const finalScore = wasJoker ? 0 : State.calcFinalScore(result);
    // Calculate MT earned for display
    const mtEarned = wasJoker ? 0 : (result.passed !== false ? 
      Math.round(Math.min(1.5, 0.8 + (result.rawScore||50)/100 * 0.7) * 10) / 10 : 0.2);

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
          ${allDone && worldId < 10 ? `
            <button class="btn btn-gold btn-full" style="margin-bottom:10px" onclick="App._portalTransition(${worldId})">
              🌀 Nächste Welt!
            </button>` : ''}
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
            <div style="font-family:'Fredoka One',cursive;font-size:1.2rem;color:var(--mountain-dark);margin-bottom:6px">
              🔄 Neu starten mit Bonus
            </div>
            <div style="font-size:0.9rem;color:var(--text-mid);margin-bottom:8px">
              Wenn du zurücksetzt bekommst du einen permanenten Punkte-Multiplikator:
            </div>
            <div style="font-family:'Fredoka One',cursive;font-size:2rem;background:linear-gradient(90deg,#FF6B6B,#FFD700,#27AE60);
              -webkit-background-clip:text;-webkit-text-fill-color:transparent">
              ×${newMult.toFixed(1)} Multiplikator!
            </div>
            ${isAdminUnlock ? `<div style="margin-top:8px;font-size:0.82rem;color:#E74C3C;font-weight:700">
              🔐 Nach 10 Resets: Admin-Chat freigeschaltet!
            </div>` : `<div style="font-size:0.75rem;color:var(--text-mid);margin-top:6px">
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
    this._html(`
      <div style="position:fixed;inset:0;background:linear-gradient(135deg,#1a0535,#0a2a5e);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:999">
        <div style="font-size:5rem;animation:spin 1s linear infinite">🌀</div>
        <div style="font-family:'Fredoka One',cursive;color:white;font-size:1.6rem;margin:18px 0;text-align:center">Teleportation...</div>
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
function mountainSVG() {
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
    jenga:'🗼', slider:'🧩', wordsearch:'🔤', typing:'⌨️', balloon:'🎈',
    simon:'🎨', truefalse:'❓', dart:'🎯', anagram:'🔤', colormix:'🎨',
    clock:'🕐', flags:'🌍', hangman:'🎯', tictactoe:'❌', weight:'⚖️',
    basketball:'🏀', emojistory:'📖', geo:'🗺️', french:'🇫🇷', riddle:'🤔',
  };
  const map = {
    math:        '🔢 <b>Rechenaufgabe!</b><br>Löse 10 Aufgaben. Schnelle & fehlerfreie Antworten geben mehr Punkte!',
    reaction:    '⚡ <b>Reaktionsspiel!</b><br>🟢 <b>Grün = TIPPEN</b> &nbsp;|&nbsp; 🔴 <b>Rot = NICHTS TUN</b>. Sei blitzschnell!',
    memory:      '🧠 <b>Memory!</b><br>Finde alle 5 Kartenpaare. Tippe zwei Karten auf — passen sie? Weniger Versuche = mehr Punkte!',
    train:       '🚂 <b>Zugweichen!</b><br>Lenke den Zug bei jeder Weiche nach <b>Links ◀</b> oder <b>Rechts ▶</b>. Nur eine Seite führt zum Ziel!',
    shutthebox:  '🎲 <b>Shut the Box!</b><br>Würfle und schliesse Zahlen die zusammen die Würfelsumme ergeben. Ziel: alle 9 Felder schliessen! Falsche Auswahl kostet Punkte.',
    jenga:       '🗼 <b>Jenga-Turm!</b><br>Beantworte 10 Fragen. Jede falsche Antwort = ein Stein fällt. Verhindere den Einsturz des Turms!',
    slider:      '🧩 <b>Schiebepuzzle!</b><br>Tippe auf ein Feld neben dem leeren Feld um es zu verschieben. Bringe alle Felder in die richtige Reihenfolge! Grüne Felder = schon richtig ✅',
    wordsearch:  '🔤 <b>Wörter suchen!</b><br>Finde alle 5 Wörter im Buchstaben-Raster. <b>Wische</b> von Buchstabe zu Buchstabe um ein Wort zu markieren.',
    typing:      '⌨️ <b>Tipp-Spiel!</b><br>Tippe die angezeigten Wörter so schnell und genau wie möglich. 10 Wörter — Geschwindigkeit und Genauigkeit zählen!',
    balloon:     '🎈 <b>Ballon-Mathe!</b><br>Eine Rechenaufgabe erscheint — tippe auf den Ballon mit der richtigen Antwort! Falscher Ballon platzt rot.',
    simon:       '🎨 <b>Simon Says!</b><br>Schau dir die Farb-Sequenz an und tippe die Farben in <b>der gleichen Reihenfolge</b> nach. Jede Runde wird die Sequenz länger!',
    truefalse:   '❓ <b>Wahr oder Falsch?</b><br>Lies die Aussage und entscheide schnell: <b>✅ Wahr</b> oder <b>❌ Falsch</b>? 10 Fragen zur aktuellen Welt!',
    dart:        '🎯 <b>Dart mit Wind!</b><br>Tippe auf die Dartscheibe um zu werfen. Achte auf den Wind — er lenkt deinen Pfeil ab! Ziel: <b>400+ Punkte</b> in 10 Würfen.',
    anagram:     '🔤 <b>Buchstaben sortieren!</b><br>Tippe die Buchstaben in der <b>richtigen Reihenfolge</b> an um das Wort zu bilden. Falscher Buchstabe = alles zurücksetzen!',
    colormix:    '🎨 <b>Farben mischen!</b><br>Welche <b>zwei Farben</b> ergeben zusammen die gesuchte Farbe? Tippe auf beide richtigen Farbtöne!',
    clock:       '🕐 <b>Uhr lesen!</b><br>Schau dir die analoge Uhr an und wähle die richtige Zeit. Achte auf <b>Stunden- und Minutenzeiger</b>!',
    flags:       '🌍 <b>Flaggen raten!</b><br>Welches Land gehört zu dieser Flagge? 10 Flaggen aus der ganzen Welt!',
    hangman:     '🎯 <b>Galgenmännchen!</b><br>Rate das versteckte Wort Buchstabe für Buchstabe. Du hast <b>6 Fehler</b> bevor das Männchen komplett ist!',
    tictactoe:   '❌ <b>Tic-Tac-Toe!</b><br>Spiele 5 Runden gegen die KI. Du bist <b>❌</b>, die KI ist <b>⭕</b>. Drei in einer Reihe gewinnt!',
    weight:      '⚖️ <b>Gewicht schätzen!</b><br>Was ist schwerer? Tippe auf die richtigere Antwort. Manchmal sind beide <b>gleich schwer</b>!',
    basketball:  '🏀 <b>Basketball!</b><br>Tippe auf den Knopf wenn die Kraft-Anzeige im <b>grünen Bereich</b> ist. Zu viel oder zu wenig Kraft = kein Korb!',
    emojistory:  '📖 <b>Emoji-Geschichte!</b><br>Was erzählen diese Emojis? Lies die Geschichte und wähle die richtige Antwort!',
    geo:         '🗺️ <b>Geo-Quiz!</b><br>Wo liegt das? Beweise dein Wissen über Frankreich, die Schweiz und Europa!',
    french:      '🇫🇷 <b>Französisch lernen!</b><br>Was bedeutet dieses französische Wort auf Deutsch? Lerne die wichtigsten Wörter für den Frankreich-Urlaub!',
    riddle:      '🤔 <b>Rätsel!</b><br>Denke nach! Was bin ich? Lies das Rätsel sorgfältig und wähle die klügste Antwort.',
  };
  const icon = ICONS[type] || '🎮';
  const instr = map[type] || 'Los geht\'s! Viel Spaß!';
  return `<span style="font-size:1.5rem">${icon}</span><br>${instr}`;
}

window.App = App;
window.mountainSVG = mountainSVG;
window.worldPathSVG = worldPathSVG;
window.getTaskInstruction = getTaskInstruction;
