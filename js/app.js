/**
 * app.js — Navigation, Charakterauswahl, Login, Pfad-Animation
 * Mischa Denkspiel v2
 */

// ============================================
// CHARACTERS (erweitert)
// ============================================
const CHARACTERS = [
  { id: 'spongebob',  emoji: '🧽', name: 'SpongeBob',     hasColors: false },
  { id: 'patrick',    emoji: '⭐', name: 'Patrick',        hasColors: false },
  { id: 'mario',      emoji: '🍄', name: 'Mario',          hasColors: false },
  { id: 'luigi',      emoji: '💚', name: 'Luigi',          hasColors: false },
  { id: 'stickman',   emoji: '🎨', name: 'Strichmännchen', hasColors: true  },
  { id: 'woman',      emoji: '👩', name: 'Wanderin',       hasColors: false },
  { id: 'man',        emoji: '👨', name: 'Wanderer',       hasColors: false },
  { id: 'ninja',      emoji: '🥷', name: 'Ninja',          hasColors: false },
  { id: 'astronaut',  emoji: '🧑‍🚀', name: 'Astronaut',   hasColors: false },
  { id: 'detective',  emoji: '🕵️', name: 'Detektiv',      hasColors: false },
  { id: 'princess',   emoji: '👸', name: 'Prinzessin',     hasColors: false },
  { id: 'knight',     emoji: '⚔️', name: 'Ritter',         hasColors: false },
  { id: 'scientist',  emoji: '🧪', name: 'Wissenschaftler',hasColors: false },
  { id: 'explorer',   emoji: '🧭', name: 'Entdecker',      hasColors: false },
];

const STICKMAN_COLORS = [
  { name: 'Blau',   color: '#3498DB' },
  { name: 'Rot',    color: '#E74C3C' },
  { name: 'Grün',   color: '#27AE60' },
  { name: 'Lila',   color: '#9B59B6' },
  { name: 'Orange', color: '#E67E22' },
  { name: 'Pink',   color: '#FF6B9D' },
];

// ============================================
// APP
// ============================================
const App = {
  selectedChar: null,
  selectedColor: null,
  _taskStartTime: null,

  // ---- WELCOME ----
  showWelcome() {
    document.getElementById('app').innerHTML = `
      <div class="mountain-bg">
        <div class="sky-gradient"></div>
        <div class="cloud cloud-1"></div><div class="cloud cloud-2"></div><div class="cloud cloud-3"></div>
        ${mountainSVG()}
      </div>
      <div class="page">
        <div class="game-logo">
          <span class="logo-emoji">🏔️</span>
          <h1>Das Mischa<br>Denkspiel</h1>
          <p class="subtitle">Eine Wanderung durch die Schweizer Berge 🇨🇭</p>
        </div>
        <div class="card">
          <div class="card-title">Willkommen! 👋</div>
          <div class="card-subtitle">
            Begleite Mischa auf seiner Wanderung durch die wunderschönen Schweizer Berge!
            Löse Aufgaben und erklimme alle 5 Welten bis zum Gipfel! ⛰️
          </div>
          <div style="background:#F0F9FF;border:2px solid #85C1E9;border-radius:14px;padding:14px;margin-bottom:20px;font-size:0.9rem;line-height:1.8">
            🌲 Welt 1: Wanderweg im Wald<br>
            🚡 Welt 2: Skilift zum Berggipfel<br>
            🍽️ Welt 3: Essen im Bergrestaurant<br>
            🥾 Welt 4: Schneeschuh-Wanderung<br>
            🎿 Welt 5: Die grosse Ski-Abfahrt!
          </div>
          <div style="display:flex;flex-direction:column;gap:12px">
            <button class="btn btn-primary btn-full btn-big" onclick="App.showCharSelect()">🆕 Neu starten</button>
            <button class="btn btn-secondary btn-full" onclick="App.showLogin()">🔑 Anmelden</button>
          </div>
        </div>
      </div>`;
  },

  // ---- CHARACTER SELECT ----
  showCharSelect() {
    this.selectedChar = null; this.selectedColor = null;
    document.getElementById('app').innerHTML = `
      <div class="mountain-bg"><div class="sky-gradient"></div><div class="cloud cloud-1"></div>${mountainSVG()}</div>
      <div class="page">
        <div class="card" style="max-width:560px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
            <button onclick="App.showWelcome()" style="background:none;border:none;font-size:1.4rem;cursor:pointer">◀</button>
            <div class="card-title" style="margin-bottom:0">Wähle deinen Charakter</div>
          </div>
          <div class="card-subtitle">Wer soll wandern? 🥾</div>
          <div class="char-grid" style="grid-template-columns:repeat(4,1fr)">
            ${CHARACTERS.map(ch => `
              <div class="char-card" id="char-${ch.id}" onclick="App.selectChar('${ch.id}')">
                <span class="char-img">${ch.emoji}</span>
                <span class="char-name">${ch.name}</span>
              </div>`).join('')}
          </div>
          <div id="color-section" style="display:none;margin:12px 0;text-align:center">
            <div style="font-size:0.85rem;font-weight:700;color:var(--text-mid);margin-bottom:8px">🎨 Farbe:</div>
            <div class="color-picker">
              ${STICKMAN_COLORS.map(c => `
                <div class="color-dot" id="cdot-${c.color.replace('#','')}"
                  style="background:${c.color}" title="${c.name}"
                  onclick="App.selectColor('${c.color}')"></div>`).join('')}
            </div>
          </div>
          <button id="char-next-btn" class="btn btn-primary btn-full" style="margin-top:16px;display:none" onclick="App.showProfile()">Weiter ➜</button>
        </div>
      </div>`;
  },

  selectChar(id) {
    this.selectedChar = id;
    document.querySelectorAll('.char-card').forEach(el => el.classList.remove('selected'));
    document.getElementById(`char-${id}`)?.classList.add('selected');
    const ch = CHARACTERS.find(c => c.id === id);
    const cs = document.getElementById('color-section');
    if (ch?.hasColors) { cs.style.display = 'block'; document.getElementById('char-next-btn').style.display = 'none'; }
    else { cs.style.display = 'none'; this.selectedColor = null; document.getElementById('char-next-btn').style.display = 'flex'; }
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
    const years = Array.from({length:15},(_,i) => yr - 5 - i);
    document.getElementById('app').innerHTML = `
      <div class="mountain-bg"><div class="sky-gradient"></div><div class="cloud cloud-1"></div>${mountainSVG()}</div>
      <div class="page">
        <div class="card">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
            <button onclick="App.showCharSelect()" style="background:none;border:none;font-size:1.4rem;cursor:pointer">◀</button>
            <div class="card-title" style="margin-bottom:0">Dein Profil</div>
          </div>
          <div style="text-align:center;font-size:3.5rem;margin:10px 0">${ch.emoji}</div>
          <div class="input-group"><label>Dein Name</label>
            <input type="text" id="p-name" placeholder="z.B. Mischa" maxlength="20" autocomplete="off"/></div>
          <div class="input-group"><label>Passwort</label>
            <input type="password" id="p-pw" placeholder="Geheimwort" maxlength="20"/></div>
          <div class="input-group"><label>Geburtsjahr</label>
            <select id="p-year"><option value="">-- wählen --</option>
              ${years.map(y=>`<option value="${y}">${y}</option>`).join('')}
            </select></div>
          <div id="p-err" style="color:#E74C3C;font-size:0.9rem;text-align:center;display:none;margin-bottom:8px"></div>
          <button class="btn btn-primary btn-full btn-big" onclick="App.createProfile()">Los geht's! 🚀</button>
        </div>
      </div>`;
  },

  createProfile() {
    const name = document.getElementById('p-name')?.value.trim();
    const pw   = document.getElementById('p-pw')?.value.trim();
    const year = document.getElementById('p-year')?.value;
    const err = t => { const e=document.getElementById('p-err'); if(e){e.textContent=t;e.style.display='block';} };
    if (!name || name.length < 2) return err('Name mindestens 2 Zeichen!');
    if (!pw)   return err('Bitte Passwort eingeben!');
    if (!year) return err('Bitte Geburtsjahr wählen!');
    const player = State.createPlayer({ name, password:pw, birthYear:year, character:this.selectedChar, characterColor:this.selectedColor });
    if (!player) return err(`Name "${name}" bereits vergeben!`);
    State.setCurrentPlayer(player);
    this.showWorldMap();
  },

  // ---- LOGIN ----
  showLogin() {
    document.getElementById('app').innerHTML = `
      <div class="mountain-bg"><div class="sky-gradient"></div><div class="cloud cloud-1"></div>${mountainSVG()}</div>
      <div class="page">
        <div class="card">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
            <button onclick="App.showWelcome()" style="background:none;border:none;font-size:1.4rem;cursor:pointer">◀</button>
            <div class="card-title" style="margin-bottom:0">Anmelden 🔑</div>
          </div>
          <div class="card-subtitle">Willkommen zurück!</div>
          <div class="input-group"><label>Name</label><input type="text" id="l-name" autocomplete="off"/></div>
          <div class="input-group"><label>Passwort</label><input type="password" id="l-pw" onkeyup="if(event.key==='Enter')App.doLogin()"/></div>
          <div id="l-err" style="color:#E74C3C;font-size:0.9rem;text-align:center;display:none;margin-bottom:8px"></div>
          <button class="btn btn-primary btn-full btn-big" onclick="App.doLogin()">Anmelden ➜</button>
        </div>
      </div>`;
  },

  doLogin() {
    const name = document.getElementById('l-name')?.value.trim();
    const pw   = document.getElementById('l-pw')?.value.trim();
    const res  = State.login(name, pw);
    if (!res.ok) { const e=document.getElementById('l-err'); if(e){e.textContent=res.error;e.style.display='block';} return; }
    State.setCurrentPlayer(res.player);
    this.showWorldMap();
  },

  // ---- WORLD MAP ----
  showWorldMap() {
    const player = State.refreshCurrentPlayer();
    if (!player) { this.showWelcome(); return; }
    const ch = CHARACTERS.find(c => c.id === player.character);

    document.getElementById('app').innerHTML = `
      <div class="mountain-bg">
        <div class="sky-gradient"></div>
        <div class="cloud cloud-1"></div><div class="cloud cloud-2"></div>
        ${mountainSVG()}
      </div>
      <div class="page" style="padding-top:28px">
        <div style="display:flex;justify-content:space-between;align-items:center;width:100%;max-width:480px;margin-bottom:14px">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:2rem">${ch?.emoji || '🧭'}</span>
            <div>
              <div style="font-family:'Fredoka One',cursive;font-size:1.1rem;color:white;text-shadow:0 2px 4px rgba(0,0,0,0.3)">${player.name}</div>
              <div class="score-badge" style="font-size:0.85rem;padding:4px 12px">⭐ ${player.totalScore} Punkte</div>
            </div>
          </div>
          <button onclick="App.showWelcome()" style="background:rgba(255,255,255,0.3);border:2px solid white;color:white;padding:8px 14px;border-radius:50px;font-weight:700;cursor:pointer;font-size:0.85rem">Abmelden</button>
        </div>

        <div style="font-family:'Fredoka One',cursive;font-size:1.4rem;color:white;text-align:center;text-shadow:0 2px 6px rgba(0,0,0,0.3);margin-bottom:14px">
          🏔️ Wähle deine Welt!
        </div>

        <div class="world-map">
          ${WORLDS.map(world => {
            const ws = player.worlds[world.id];
            const done = ws.tasks.filter(t => t && t.done).length;
            const unlocked = world.id <= player.currentWorld;
            const completed = ws.completed;
            let cls = unlocked ? 'unlocked' : 'locked';
            if (completed) cls = 'completed';
            return `
              <div class="world-item ${cls}" onclick="${unlocked ? `App.showWorld(${world.id})` : 'void(0)'}">
                <span class="world-icon">${world.icon}</span>
                <div class="world-info">
                  <div class="world-name">${world.name}</div>
                  <div class="world-desc">${world.difficulty} · ${world.description}</div>
                  <div class="world-progress">${done}/10 Aufgaben ✓</div>
                </div>
                <span class="world-lock">${completed ? '🏆' : unlocked ? '▶' : '🔒'}</span>
              </div>`;
          }).join('')}
        </div>
      </div>`;
  },

  // ---- WORLD VIEW (with animated path) ----
  showWorld(worldId) {
    const player = State.refreshCurrentPlayer();
    if (!player) { this.showWelcome(); return; }
    const world = WORLDS.find(w => w.id === worldId);
    const ws = player.worlds[worldId];
    const done = ws.tasks.filter(t => t && t.done).length;
    const ch = CHARACTERS.find(c => c.id === player.character);

    document.getElementById('app').innerHTML = `
      <div class="mountain-bg">
        <div class="sky-gradient"></div>
        <div class="cloud cloud-1"></div>
        ${mountainSVG()}
      </div>
      <div class="page" style="padding-top:16px">
        <div class="world-banner ${world.bannerClass}" style="margin-bottom:12px">
          <span class="banner-icon">${world.icon}</span>
          <div class="banner-title">${world.name}</div>
          <div class="banner-sub">${world.difficulty} · ${done}/10 geschafft</div>
        </div>

        <!-- Animated Path Scene -->
        <div style="background:rgba(255,255,255,0.9);border-radius:16px;overflow:hidden;margin-bottom:12px;width:100%;max-width:480px;box-shadow:var(--shadow)">
          ${worldPathSVG(worldId, done, ch?.emoji || '🧭')}
        </div>

        <div class="card" style="max-width:480px;padding:18px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <button onclick="App.showWorldMap()" style="background:none;border:none;font-size:1rem;cursor:pointer;color:var(--text-mid)">◀ Welten</button>
            <div class="joker-badge ${ws.jokerUsed ? 'used' : ''}" onclick="${ws.jokerUsed ? '' : `App.showJokerMenu(${worldId})`}">
              🃏 Joker ${ws.jokerUsed ? '(benutzt)' : 'verfügbar'}
            </div>
          </div>

          <div style="font-size:0.85rem;color:var(--text-mid);margin-bottom:10px">Tippe auf die nächste Aufgabe:</div>

          <div class="task-grid">
            ${world.tasks.map((task, i) => {
              const tdone = ws.tasks[i] && ws.tasks[i].done;
              const tjok  = ws.tasks[i] && ws.tasks[i].joker;
              const firstUndone = ws.tasks.findIndex(t => !t || !t.done);
              const isActive = i === firstUndone;
              let cls = 'locked';
              if (tdone) cls = tjok ? 'joker' : 'done';
              else if (isActive) cls = 'active';
              return `
                <button class="task-btn ${cls}"
                  onclick="${(isActive || tdone) ? `App.startTask(${worldId},${i})` : 'void(0)'}"
                  title="${task.title}">
                  <span style="font-size:1.2rem">${task.icon}</span>
                  <span style="font-size:0.65rem">${i+1}</span>
                </button>`;
            }).join('')}
          </div>

          <div style="margin-top:14px">
            <div style="font-size:0.8rem;color:var(--text-mid);margin-bottom:5px">Fortschritt</div>
            <div class="progress-bar-wrap">
              <div class="progress-bar-fill" style="width:${done*10}%"></div>
            </div>
          </div>
        </div>
      </div>`;
  },

  showJokerMenu(worldId) {
    const player = State.refreshCurrentPlayer();
    const ws = player.worlds[worldId];
    const activeTask = ws.tasks.findIndex(t => !t || !t.done);
    if (activeTask < 0) return;
    if (confirm(`🃏 Joker einsetzen?\nDie aktuelle Aufgabe zählt dann als geschafft. Du hast nur einen Joker pro Welt!`)) {
      State.useJoker(player.name, worldId, activeTask);
      this.showWorld(worldId);
    }
  },

  // ---- TASK INSTRUCTION ----
  startTask(worldId, taskIndex) {
    const player = State.refreshCurrentPlayer();
    const world  = WORLDS.find(w => w.id === worldId);
    const task   = world.tasks[taskIndex];

    document.getElementById('app').innerHTML = `
      <div class="mountain-bg"><div class="sky-gradient"></div>${mountainSVG()}</div>
      <div class="page">
        <div class="card" style="max-width:480px">
          <div style="text-align:center">
            <span style="font-size:3rem">${task.icon}</span>
            <div class="card-title">${task.title}</div>
            <div style="background:linear-gradient(135deg,#EBF5FB,#D6EAF8);border:2px solid #85C1E9;border-radius:14px;padding:16px;margin:16px 0;text-align:left;font-size:0.95rem;line-height:1.6">
              ${getTaskInstruction(task.type, worldId)}
            </div>
            <button class="btn btn-primary btn-big btn-full" onclick="App.launchGame(${worldId},${taskIndex})">
              Verstanden! ✅ Los geht's!
            </button>
            <button class="btn btn-secondary btn-full" style="margin-top:10px" onclick="App.showWorld(${worldId})">◀ Zurück</button>
          </div>
        </div>
      </div>`;
  },

  // ---- LAUNCH GAME ----
  launchGame(worldId, taskIndex) {
    const player = State.refreshCurrentPlayer();
    const world  = WORLDS.find(w => w.id === worldId);
    const task   = world.tasks[taskIndex];
    const ageGroup = State.getAgeGroup(player);
    this._taskStartTime = Date.now();

    document.getElementById('app').innerHTML = `
      <div class="mountain-bg"><div class="sky-gradient"></div>${mountainSVG()}</div>
      <div class="page">
        <div class="game-container">
          <div class="game-header">
            <div class="game-title">${task.icon} ${task.title}</div>
            <div class="joker-badge ${player.worlds[worldId].jokerUsed ? 'used' : ''}"
              onclick="${player.worlds[worldId].jokerUsed ? '' : `App.useJokerInGame(${worldId},${taskIndex})`}">
              🃏
            </div>
          </div>
          <div id="game-area">
            <div style="text-align:center;padding:40px;color:var(--text-mid)">Wird geladen...</div>
          </div>
        </div>
      </div>`;

    const onComplete = (result) => {
      State.completeTask(player.name, worldId, taskIndex, result);
      this._showTaskComplete(worldId, taskIndex, result);
    };

    setTimeout(() => {
      switch (task.type) {
        case 'math':        MathGame.start({ ageGroup, worldId, onComplete }); break;
        case 'reaction':    ReactionGame.start({ onComplete }); break;
        case 'memory':      MemoryGame.start({ emojis: world.memoryEmojis, onComplete }); break;
        case 'train':       TrainGame.start({ worldId, onComplete }); break;
        case 'search':      SearchGame.start({ worldId, theme: world.searchTheme, onComplete }); break;
        case 'differences': DifferencesGame.start({ worldId, theme: world.diffTheme, onComplete }); break;
        case 'shutthebox':  ShutTheBoxGame.start({ onComplete }); break;
        case 'jenga':       JengaGame.start({ worldId, ageGroup, onComplete }); break;
        default:
          document.getElementById('game-area').innerHTML = '<div style="padding:20px;text-align:center">Spiel kommt bald! 🚧</div>';
      }
    }, 100);
  },

  useJokerInGame(worldId, taskIndex) {
    const player = State.refreshCurrentPlayer();
    if (player.worlds[worldId].jokerUsed) return;
    if (confirm('🃏 Joker einsetzen? Diese Aufgabe zählt dann als geschafft!')) {
      State.useJoker(player.name, worldId, taskIndex);
      this._showTaskComplete(worldId, taskIndex, { rawScore:0, timeMs:0, errors:0, passed:true }, true);
    }
  },

  _showTaskComplete(worldId, taskIndex, result, wasJoker = false) {
    const player = State.refreshCurrentPlayer();
    const world  = WORLDS.find(w => w.id === worldId);
    const allDone = player.worlds[worldId].tasks.every(t => t && t.done);
    const finalScore = wasJoker ? 0 : State.calcFinalScore(result);

    document.getElementById('app').innerHTML = `
      <div class="mountain-bg"><div class="sky-gradient"></div>${mountainSVG()}</div>
      <div class="page">
        <div class="overlay-box">
          <div class="overlay-emoji">${wasJoker ? '🃏' : allDone ? '🏆' : '⭐'}</div>
          <div class="overlay-title">${wasJoker ? 'Joker eingesetzt!' : 'Super gemacht!'}</div>
          <div class="overlay-msg">
            ${wasJoker ? 'Aufgabe zählt als geschafft.' : `⭐ ${finalScore} Punkte!`}
            ${allDone ? `<br><br>🎉 Welt "${world.name}" ist komplett!` : ''}
          </div>
          ${allDone && worldId < 5 ? `
            <button class="btn btn-gold btn-full" style="margin-bottom:10px" onclick="App._portalTransition(${worldId})">
              🌀 Portal zur nächsten Welt!
            </button>` : ''}
          <button class="btn btn-primary btn-full" onclick="App.showWorld(${worldId})">Weiter in Welt ${worldId} ➜</button>
          <br><br>
          <button class="btn" style="background:#F5F5F5;color:var(--text-mid)" onclick="App.showWorldMap()">Welten-Übersicht</button>
        </div>
      </div>`;
  },

  /** Portal-Übergang zur nächsten Welt */
  _portalTransition(fromWorldId) {
    const nextWorldId = fromWorldId + 1;
    const nextWorld = WORLDS.find(w => w.id === nextWorldId);

    document.getElementById('app').innerHTML = `
      <div style="position:fixed;inset:0;background:#1a0535;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:999">
        <div style="font-size:5rem;animation:spin 1s linear infinite">🌀</div>
        <div style="font-family:'Fredoka One',cursive;color:white;font-size:1.8rem;margin:20px 0;text-align:center">
          Du wirst teleportiert...
        </div>
        <div style="color:rgba(255,255,255,0.6);font-size:1rem">
          → ${nextWorld?.icon} ${nextWorld?.name}
        </div>
        <!-- Stars animation -->
        <div style="position:absolute;inset:0;pointer-events:none;overflow:hidden">
          ${Array.from({length:20},(_,i)=>`
            <div style="position:absolute;color:white;font-size:${8+Math.random()*16}px;
              left:${Math.random()*100}%;top:${Math.random()*100}%;
              animation:twinkle ${1+Math.random()*2}s ease-in-out infinite ${Math.random()}s;
              opacity:0.6">⭐</div>`).join('')}
        </div>
      </div>
      <style>
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes twinkle { 0%,100%{opacity:0.2} 50%{opacity:1} }
      </style>`;

    setTimeout(() => this.showWorld(nextWorldId), 2800);
  },
};

// ============================================
// WORLD PATH SVG — animated character on trail
// ============================================
function worldPathSVG(worldId, doneCount, charEmoji) {
  const configs = {
    1: { // Forest path
      bg: 'linear-gradient(180deg,#87CEEB 0%,#B8DCE8 40%,#7BC47F 60%,#5AAE5E 100%)',
      pathColor: '#D4A04A', label: '🌲 Waldweg',
      waypoints: [[8,85],[18,78],[30,68],[42,58],[55,50],[65,42],[75,35],[83,28],[90,20],[96,14]],
      icons: [{x:95,y:8,t:'🏁'}], bg2: null,
    },
    2: { // Ski lift
      bg: 'linear-gradient(180deg,#87CEEB 0%,#B8DCE8 50%,#E8F4FD 100%)',
      pathColor: '#5D6D7E', label: '🚡 Skilift',
      waypoints: [[8,90],[16,82],[24,74],[32,66],[40,58],[50,50],[58,42],[66,34],[76,24],[88,14]],
      icons: [{x:87,y:7,t:'⛷️'}],
    },
    3: { // Restaurant
      bg: 'linear-gradient(180deg,#FAD7A0 0%,#FDEBD0 100%)',
      pathColor: '#A07040', label: '🍽️ Restaurant',
      waypoints: [[8,88],[20,80],[30,70],[42,62],[52,55],[62,48],[70,40],[78,32],[86,24],[94,16]],
      icons: [{x:92,y:9,t:'🏠'}],
    },
    4: { // Snow
      bg: 'linear-gradient(180deg,#87CEEB 0%,#C8E8F8 40%,#E8F4FD 100%)',
      pathColor: '#95A5A6', label: '🥾 Schneeschuh',
      waypoints: [[8,88],[18,80],[28,70],[38,62],[48,54],[56,46],[65,38],[74,28],[83,20],[92,12]],
      icons: [{x:90,y:5,t:'🏔️'}],
    },
    5: { // Ski slope
      bg: 'linear-gradient(180deg,#87CEEB 0%,#D0E8F0 40%,#E8F4FD 100%)',
      pathColor: '#E74C3C', label: '🎿 Ski-Abfahrt',
      waypoints: [[90,10],[82,20],[72,30],[62,40],[52,50],[42,58],[34,66],[24,74],[16,82],[8,90]],
      icons: [{x:6,y:84,t:'🏁'}],
    },
  };

  const cfg = configs[worldId] || configs[1];
  const wps = cfg.waypoints;
  const charPos = doneCount > 0 ? wps[Math.min(doneCount-1, wps.length-1)] : wps[0];

  // Build path string
  const pathD = wps.map((p, i) => `${i===0?'M':'L'}${p[0]},${p[1]}`).join(' ');

  return `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"
      style="width:100%;height:140px;display:block">
      <defs>
        <linearGradient id="bg${worldId}" x1="0" y1="0" x2="0" y2="1">
          ${worldId === 1 ? '<stop offset="0%" stop-color="#87CEEB"/><stop offset="60%" stop-color="#B8DCE8"/><stop offset="100%" stop-color="#7BC47F"/>' : ''}
          ${worldId === 2 ? '<stop offset="0%" stop-color="#87CEEB"/><stop offset="100%" stop-color="#E8F4FD"/>' : ''}
          ${worldId === 3 ? '<stop offset="0%" stop-color="#FAD7A0"/><stop offset="100%" stop-color="#FDEBD0"/>' : ''}
          ${worldId === 4 ? '<stop offset="0%" stop-color="#87CEEB"/><stop offset="100%" stop-color="#E8F4FD"/>' : ''}
          ${worldId === 5 ? '<stop offset="0%" stop-color="#87CEEB"/><stop offset="100%" stop-color="#E8F4FD"/>' : ''}
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#bg${worldId})"/>

      <!-- World decorations -->
      ${worldId === 1 ? `
        <polygon points="0,100 15,55 30,100" fill="#27AE60" opacity="0.6"/>
        <polygon points="65,100 80,50 95,100" fill="#1E8449" opacity="0.7"/>
        <circle cx="88" cy="15" r="7" fill="#FFD700"/>` : ''}
      ${worldId === 2 ? `
        <polygon points="5,100 25,40 45,100" fill="#6B7F5E"/>
        <polygon points="12,68 25,40 38,68" fill="white"/>
        <polygon points="55,100 75,30 95,100" fill="#5D7050"/>
        <polygon points="63,62 75,30 87,62" fill="white"/>
        <line x1="25" y1="40" x2="85" y2="40" stroke="#5D6D7E" stroke-width="0.8"/>` : ''}
      ${worldId === 3 ? `
        <rect x="60" y="12" width="30" height="25" rx="2" fill="#A07040"/>
        <polygon points="55,12 75,4 95,12" fill="#8B6914"/>
        <rect x="64" y="20" width="8" height="10" rx="1" fill="#87CEEB" opacity="0.7"/>
        <rect x="75" y="20" width="8" height="10" rx="1" fill="#87CEEB" opacity="0.7"/>` : ''}
      ${worldId === 4 ? `
        <ellipse cx="50" cy="88" rx="40" ry="16" fill="white"/>
        <polygon points="10,100 22,72 34,100" fill="#27AE60"/>
        <polygon points="10,86 22,72 34,86" fill="white" opacity="0.8"/>
        <text x="38" y="30" font-size="12">❄️</text>
        <text x="72" y="55" font-size="8">❄️</text>` : ''}
      ${worldId === 5 ? `
        <polygon points="0,0 100,0 100,100 0,100" fill="white" opacity="0.6"/>
        <line x1="30" y1="15" x2="90" y2="90" stroke="#D0E8F0" stroke-width="1.5"/>
        <text x="8" y="22" font-size="10">🚀</text>` : ''}

      <!-- Path (trail) -->
      <path d="${pathD}" fill="none" stroke="${cfg.pathColor}" stroke-width="2.5"
        stroke-dasharray="2,1.5" stroke-linecap="round" opacity="0.8"/>

      <!-- Completed waypoints (green dots) -->
      ${wps.slice(0, doneCount).map(wp => `
        <circle cx="${wp[0]}" cy="${wp[1]}" r="1.8" fill="#27AE60" opacity="0.8"/>`).join('')}

      <!-- Remaining waypoints (gray) -->
      ${wps.slice(doneCount).map(wp => `
        <circle cx="${wp[0]}" cy="${wp[1]}" r="1.5" fill="#95A5A6" opacity="0.5"/>`).join('')}

      <!-- Goal icons -->
      ${cfg.icons.map(ic => `<text x="${ic.x}" y="${ic.y}" font-size="8" text-anchor="middle">${ic.t}</text>`).join('')}

      <!-- Character -->
      <text x="${charPos[0]}" y="${charPos[1]}"
        font-size="9" text-anchor="middle" dominant-baseline="middle"
        style="filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3))">
        ${charEmoji}
      </text>

      <!-- Label -->
      <text x="2" y="6" font-size="4" fill="rgba(0,0,0,0.4)">${cfg.label}</text>
      <text x="98" y="6" font-size="4" fill="rgba(0,0,0,0.4)" text-anchor="end">${doneCount}/10 ✓</text>
    </svg>`;
}

// ============================================
// MOUNTAIN BACKGROUND SVG
// ============================================
function mountainSVG() {
  return `
    <svg class="mountain-svg" viewBox="0 0 375 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">
      <polygon points="0,200 60,60 120,200" fill="#A8C898" opacity="0.6"/>
      <polygon points="80,200 180,20 280,200" fill="#8FAF6F" opacity="0.7"/>
      <polygon points="220,200 310,50 400,200" fill="#9BBE82" opacity="0.6"/>
      <polygon points="60,60 75,95 45,95" fill="white" opacity="0.9"/>
      <polygon points="180,20 200,65 160,65" fill="white" opacity="0.9"/>
      <polygon points="310,50 328,85 292,85" fill="white" opacity="0.9"/>
      <rect y="160" width="375" height="40" fill="#7BC47F"/>
      ${[20,60,100,140,180,220,260,300,340].map((x,i)=>`
        <circle cx="${x}" cy="162" r="4" fill="${['#FF6B9D','#FFD700','#9B59B6','#FF6B9D','#FFD700'][i%5]}"/>
        <line x1="${x}" y1="162" x2="${x}" y2="178" stroke="#27AE60" stroke-width="1.5"/>`).join('')}
      <line x1="160" y1="20" x2="380" y2="155" stroke="#5D6D7E" stroke-width="1.5" opacity="0.4" stroke-dasharray="4,4"/>
    </svg>`;
}

// ============================================
// TASK INSTRUCTIONS
// ============================================
function getTaskInstruction(type, worldId) {
  const map = {
    math:        '🔢 <b>Rechenaufgabe!</b><br>Löse 10 Rechenaufgaben. Wähle die richtige Antwort. <b>Schnelle Antworten geben mehr Punkte!</b> Fehleingaben kosten Punkte.',
    reaction:    '⚡ <b>Reaktionsspiel!</b><br>🟢 <b>Grün = TIPPEN</b> &nbsp;|&nbsp; 🔴 <b>Rot = NICHTS TUN</b><br>Sei so schnell wie möglich!',
    memory:      '🧠 <b>Memory!</b><br>Finde alle 5 Kartenpaare. Decke zwei Karten auf – sind sie gleich, bleiben sie offen. Merke dir die Positionen!',
    train:       '🚂 <b>Zugweichen-Spiel!</b><br>Lenke den Zug bei jeder Weiche nach <b>links oder rechts</b>. Nur eine Seite führt zum Ziel!',
    search:      '🔍 <b>VfB Stuttgart Wappen suchen!</b><br>Es sind 5 VfB Stuttgart Wappen im Bild versteckt. Tippe genau auf ein Wappen wenn du es siehst. Fehlklicks kosten Punkte!',
    differences: '🖼️ <b>Unterschiede finden!</b><br>Diese zwei Bilder haben 5 Unterschiede. Tippe auf die Stelle wo du einen Unterschied siehst. Fehlklicks kosten Punkte!',
    shutthebox:  '🎲 <b>Shut the Box!</b><br>Würfle und schliesse Zahlen die zusammen die Würfelsumme ergeben. Ziel: alle 9 Zahlen schliessen! Falsche Kombinationen kosten Punkte.',
    jenga:       '🗼 <b>Jenga-Turm!</b><br>Beantworte 10 Fragen richtig. Bei jeder falschen Antwort fällt ein Stein aus dem Turm. Verhindere den Einsturz!',
  };
  return map[type] || 'Mach dich bereit!';
}

window.App = App;
window.mountainSVG = mountainSVG;
window.worldPathSVG = worldPathSVG;
window.getTaskInstruction = getTaskInstruction;
