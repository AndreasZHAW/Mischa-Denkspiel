/**
 * app.js — Navigation, Charakterauswahl, Login
 * Mischa Denkspiel
 */

// ============================================
// CHARACTERS DEFINITION
// ============================================
const CHARACTERS = [
  { id: 'spongebob', emoji: '🧽', name: 'SpongeBob', hasColors: false },
  { id: 'patrick',   emoji: '⭐', name: 'Patrick',   hasColors: false },
  { id: 'mario',     emoji: '🍄', name: 'Mario',     hasColors: false },
  { id: 'luigi',     emoji: '🟢', name: 'Luigi',     hasColors: false },
  { id: 'stickman',  emoji: '🎨', name: 'Strichmännchen', hasColors: true },
  { id: 'explorer',  emoji: '🧭', name: 'Entdecker', hasColors: false },
];

const STICKMAN_COLORS = [
  { name: 'Blau',    color: '#3498DB', emoji: '🔵' },
  { name: 'Rot',     color: '#E74C3C', emoji: '🔴' },
  { name: 'Grün',    color: '#27AE60', emoji: '🟢' },
  { name: 'Lila',    color: '#9B59B6', emoji: '🟣' },
  { name: 'Orange',  color: '#E67E22', emoji: '🟠' },
  { name: 'Pink',    color: '#FF6B9D', emoji: '🩷' },
];

// ============================================
// APP STATE
// ============================================
const App = {
  selectedChar: null,
  selectedColor: null,
  isNewPlayer: true,

  // ---- WELCOME SCREEN ----
  showWelcome() {
    document.getElementById('app').innerHTML = `
      <div class="mountain-bg">
        <div class="sky-gradient"></div>
        <div class="cloud cloud-1"></div>
        <div class="cloud cloud-2"></div>
        <div class="cloud cloud-3"></div>
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
            Löse spannende Aufgaben und erklimme alle 5 Welten bis zum Gipfel! ⛰️
          </div>
          
          <div style="background:#F0F9FF;border:2px solid #85C1E9;border-radius:14px;padding:14px;margin-bottom:20px;font-size:0.9rem;line-height:1.6">
            🌲 <b>Welt 1:</b> Wanderweg im Wald<br>
            🚡 <b>Welt 2:</b> Skilift zum Berggipfel<br>
            🍽️ <b>Welt 3:</b> Essen im Bergrestaurant<br>
            🥾 <b>Welt 4:</b> Schneeschuh-Wanderung<br>
            🎿 <b>Welt 5:</b> Die grosse Ski-Abfahrt!
          </div>

          <div style="display:flex;flex-direction:column;gap:12px">
            <button class="btn btn-primary btn-full btn-big" onclick="App.showCharSelect(false)">
              🆕 Neu starten
            </button>
            <button class="btn btn-secondary btn-full" onclick="App.showLogin()">
              🔑 Anmelden (ich war schon hier)
            </button>
          </div>
        </div>
      </div>
    `;
  },

  // ---- CHARACTER SELECTION ----
  showCharSelect(isLogin) {
    this.isNewPlayer = !isLogin;
    this.selectedChar = null;
    this.selectedColor = null;

    document.getElementById('app').innerHTML = `
      <div class="mountain-bg">
        <div class="sky-gradient"></div>
        <div class="cloud cloud-1"></div>
        <div class="cloud cloud-2"></div>
        ${mountainSVG()}
      </div>

      <div class="page">
        <div class="card" style="max-width:520px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
            <button onclick="App.showWelcome()" style="background:none;border:none;font-size:1.4rem;cursor:pointer">◀</button>
            <div class="card-title" style="margin-bottom:0">Wähle deinen Charakter</div>
          </div>
          <div class="card-subtitle">Wer soll wandern? 🥾</div>

          <div class="char-grid">
            ${CHARACTERS.map(ch => `
              <div class="char-card" id="char-${ch.id}" onclick="App.selectChar('${ch.id}')">
                <span class="char-img">${ch.emoji}</span>
                <span class="char-name">${ch.name}</span>
              </div>
            `).join('')}
          </div>

          <!-- Stickman colors (hidden by default) -->
          <div id="color-section" style="display:none;margin:12px 0">
            <div style="font-size:0.9rem;font-weight:700;color:var(--text-mid);text-align:center;margin-bottom:8px">🎨 Farbe wählen:</div>
            <div class="color-picker">
              ${STICKMAN_COLORS.map(c => `
                <div class="color-dot" id="color-${c.color.replace('#','')}" 
                     style="background:${c.color}" 
                     title="${c.name}"
                     onclick="App.selectColor('${c.color}')"></div>
              `).join('')}
            </div>
          </div>

          <button id="char-next-btn" class="btn btn-primary btn-full" style="margin-top:16px;display:none" onclick="App.showProfile()">
            Weiter ➜
          </button>
        </div>
      </div>
    `;
  },

  selectChar(charId) {
    this.selectedChar = charId;
    document.querySelectorAll('.char-card').forEach(el => el.classList.remove('selected'));
    document.getElementById(`char-${charId}`)?.classList.add('selected');

    const char = CHARACTERS.find(c => c.id === charId);
    const colorSection = document.getElementById('color-section');
    if (char?.hasColors) {
      colorSection.style.display = 'block';
      this.selectedColor = null;
      document.getElementById('char-next-btn').style.display = 'none';
    } else {
      colorSection.style.display = 'none';
      this.selectedColor = null;
      document.getElementById('char-next-btn').style.display = 'flex';
    }
  },

  selectColor(color) {
    this.selectedColor = color;
    document.querySelectorAll('.color-dot').forEach(el => el.classList.remove('selected'));
    document.getElementById(`color-${color.replace('#','')}`)?.classList.add('selected');
    document.getElementById('char-next-btn').style.display = 'flex';
  },

  // ---- PROFILE CREATION ----
  showProfile() {
    if (!this.selectedChar) {
      alert('Bitte zuerst einen Charakter wählen!');
      return;
    }

    const char = CHARACTERS.find(c => c.id === this.selectedChar);
    const currentYear = new Date().getFullYear();
    const years = Array.from({length: 15}, (_, i) => currentYear - 5 - i);

    document.getElementById('app').innerHTML = `
      <div class="mountain-bg">
        <div class="sky-gradient"></div>
        <div class="cloud cloud-1"></div>
        ${mountainSVG()}
      </div>

      <div class="page">
        <div class="card">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
            <button onclick="App.showCharSelect(false)" style="background:none;border:none;font-size:1.4rem;cursor:pointer">◀</button>
            <div class="card-title" style="margin-bottom:0">Dein Profil</div>
          </div>
          
          <div style="text-align:center;font-size:3rem;margin:12px 0">${char.emoji}</div>

          <div class="input-group">
            <label>Dein Name</label>
            <input type="text" id="player-name" placeholder="z.B. Mischa" maxlength="20" autocomplete="off"/>
          </div>

          <div class="input-group">
            <label>Passwort (damit du weiter spielen kannst)</label>
            <input type="password" id="player-pw" placeholder="Geheimwort" maxlength="20"/>
          </div>

          <div class="input-group">
            <label>Dein Geburtsjahr</label>
            <select id="player-year">
              <option value="">-- wählen --</option>
              ${years.map(y => `<option value="${y}">${y}</option>`).join('')}
            </select>
          </div>

          <div id="profile-error" style="color:#E74C3C;font-size:0.9rem;text-align:center;display:none;margin-bottom:8px"></div>

          <button class="btn btn-primary btn-full btn-big" onclick="App.createProfile()">
            Los geht's! 🚀
          </button>
        </div>
      </div>
    `;
  },

  createProfile() {
    const name = document.getElementById('player-name')?.value.trim();
    const pw = document.getElementById('player-pw')?.value.trim();
    const year = document.getElementById('player-year')?.value;
    const errEl = document.getElementById('profile-error');

    if (!name) { this._showError('Bitte einen Namen eingeben!'); return; }
    if (name.length < 2) { this._showError('Name muss mindestens 2 Zeichen haben!'); return; }
    if (!pw) { this._showError('Bitte ein Passwort eingeben!'); return; }
    if (!year) { this._showError('Bitte dein Geburtsjahr wählen!'); return; }

    const player = State.createPlayer({
      name, password: pw, birthYear: year,
      character: this.selectedChar,
      characterColor: this.selectedColor,
    });

    if (!player) {
      this._showError(`Der Name "${name}" ist schon vergeben. Wähle einen anderen!`);
      return;
    }

    State.setCurrentPlayer(player);
    this.showWorldMap();
  },

  _showError(msg) {
    const el = document.getElementById('profile-error');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
  },

  // ---- LOGIN ----
  showLogin() {
    document.getElementById('app').innerHTML = `
      <div class="mountain-bg">
        <div class="sky-gradient"></div>
        <div class="cloud cloud-1"></div>
        ${mountainSVG()}
      </div>

      <div class="page">
        <div class="card">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
            <button onclick="App.showWelcome()" style="background:none;border:none;font-size:1.4rem;cursor:pointer">◀</button>
            <div class="card-title" style="margin-bottom:0">Anmelden 🔑</div>
          </div>
          <div class="card-subtitle">Willkommen zurück! Weiter geht die Reise!</div>

          <div class="input-group">
            <label>Dein Name</label>
            <input type="text" id="login-name" placeholder="Dein Name" autocomplete="off"/>
          </div>
          <div class="input-group">
            <label>Passwort</label>
            <input type="password" id="login-pw" placeholder="Dein Geheimwort"/>
          </div>

          <div id="login-error" style="color:#E74C3C;font-size:0.9rem;text-align:center;display:none;margin-bottom:8px"></div>

          <button class="btn btn-primary btn-full btn-big" onclick="App.doLogin()">
            Anmelden ➜
          </button>
        </div>
      </div>
    `;

    // Enter key support
    document.getElementById('login-pw')?.addEventListener('keyup', e => {
      if (e.key === 'Enter') App.doLogin();
    });
  },

  doLogin() {
    const name = document.getElementById('login-name')?.value.trim();
    const pw = document.getElementById('login-pw')?.value.trim();
    const result = State.login(name, pw);
    if (!result.ok) {
      const el = document.getElementById('login-error');
      if (el) { el.textContent = result.error; el.style.display = 'block'; }
      return;
    }
    State.setCurrentPlayer(result.player);
    this.showWorldMap();
  },

  // ---- WORLD MAP ----
  showWorldMap() {
    const player = State.refreshCurrentPlayer();
    if (!player) { this.showWelcome(); return; }
    const char = CHARACTERS.find(c => c.id === player.character);

    document.getElementById('app').innerHTML = `
      <div class="mountain-bg">
        <div class="sky-gradient"></div>
        <div class="cloud cloud-1"></div>
        <div class="cloud cloud-2"></div>
        ${mountainSVG()}
      </div>

      <div class="page" style="padding-top:30px">
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:center;width:100%;max-width:480px;margin-bottom:16px">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:2rem">${char?.emoji || '🧭'}</span>
            <div>
              <div style="font-family:'Fredoka One',cursive;font-size:1.1rem;color:white;text-shadow:0 2px 4px rgba(0,0,0,0.3)">${player.name}</div>
              <div class="score-badge" style="font-size:0.85rem;padding:4px 12px">⭐ ${player.totalScore} Punkte</div>
            </div>
          </div>
          <button onclick="App.showWelcome()" style="background:rgba(255,255,255,0.3);border:2px solid white;color:white;padding:8px 14px;border-radius:50px;font-weight:700;cursor:pointer;font-size:0.85rem">
            Abmelden
          </button>
        </div>

        <div style="font-family:'Fredoka One',cursive;font-size:1.5rem;color:white;text-align:center;text-shadow:0 2px 6px rgba(0,0,0,0.3);margin-bottom:16px">
          🏔️ Wähle deine Welt!
        </div>

        <!-- World list -->
        <div class="world-map">
          ${WORLDS.map(world => {
            const worldState = player.worlds[world.id];
            const done = worldState.tasks.filter(t => t && t.done).length;
            const unlocked = world.id <= player.currentWorld;
            const completed = worldState.completed;
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
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  // ---- WORLD VIEW ----
  showWorld(worldId) {
    const player = State.refreshCurrentPlayer();
    if (!player) { this.showWelcome(); return; }
    const world = WORLDS.find(w => w.id === worldId);
    const worldState = player.worlds[worldId];

    document.getElementById('app').innerHTML = `
      <div class="mountain-bg">
        <div class="sky-gradient"></div>
        <div class="cloud cloud-1"></div>
        ${mountainSVG()}
      </div>

      <div class="page">
        <!-- World banner -->
        <div class="world-banner ${world.bannerClass}" style="margin-bottom:12px">
          <span class="banner-icon">${world.icon}</span>
          <div class="banner-title">${world.name}</div>
          <div class="banner-sub">${world.difficulty} · ${worldState.tasks.filter(t=>t&&t.done).length}/10 geschafft</div>
        </div>

        <div class="card" style="max-width:420px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
            <button onclick="App.showWorldMap()" style="background:none;border:none;font-size:1rem;cursor:pointer;color:var(--text-mid)">◀ Welten</button>
            <div class="joker-badge ${worldState.jokerUsed ? 'used' : ''}" id="joker-badge"
                 onclick="${worldState.jokerUsed ? '' : 'App.showJokerMenu()'}">
              🃏 Joker ${worldState.jokerUsed ? '(benutzt)' : 'verfügbar'}
            </div>
          </div>

          <div class="card-subtitle" style="text-align:left;font-size:0.85rem">Tippe auf die nächste Aufgabe:</div>

          <div class="task-grid" id="task-grid">
            ${world.tasks.map((task, i) => {
              const done = worldState.tasks[i] && worldState.tasks[i].done;
              const jokerUsed = worldState.tasks[i] && worldState.tasks[i].joker;
              // First undone = active
              const firstUndone = worldState.tasks.findIndex(t => !t || !t.done);
              const isActive = i === firstUndone;
              const isLocked = i > firstUndone;

              let cls = 'locked';
              if (done) cls = jokerUsed ? 'joker' : 'done';
              else if (isActive) cls = 'active';

              return `
                <button class="task-btn ${cls}" 
                        onclick="${(isActive || done) ? `App.startTask(${worldId}, ${i})` : 'void(0)'}"
                        title="${task.title}">
                  <span style="font-size:1.2rem">${task.icon}</span>
                  <span style="font-size:0.65rem">${i+1}</span>
                </button>
              `;
            }).join('')}
          </div>

          <!-- Progress bar -->
          <div style="margin-top:16px">
            <div style="font-size:0.85rem;color:var(--text-mid);margin-bottom:6px">Fortschritt</div>
            <div class="progress-bar-wrap">
              <div class="progress-bar-fill" style="width:${worldState.tasks.filter(t=>t&&t.done).length*10}%"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  showJokerMenu() {
    const player = State.refreshCurrentPlayer();
    const worldId = parseInt(document.querySelector('.world-banner')?.className.match(/w(\d)/)?.[1] || 1);
    // Find current active task
    const worldState = player.worlds[worldId];
    const activeTask = worldState.tasks.findIndex(t => !t || !t.done);
    if (activeTask < 0) return;

    if (confirm(`🃏 Joker einsetzen?\n\nDie aktuelle Aufgabe wird damit als geschafft gezählt. Du hast nur einen Joker pro Welt!`)) {
      State.useJoker(player.name, worldId, activeTask);
      this.showWorld(worldId);
    }
  },

  // ---- TASK / GAME START ----
  startTask(worldId, taskIndex) {
    const player = State.refreshCurrentPlayer();
    const world = WORLDS.find(w => w.id === worldId);
    const task = world.tasks[taskIndex];

    // Show instruction first
    document.getElementById('app').innerHTML = `
      <div class="mountain-bg">
        <div class="sky-gradient"></div>
        ${mountainSVG()}
      </div>

      <div class="page">
        <div class="card" style="max-width:480px">
          <div style="text-align:center;margin-bottom:16px">
            <span style="font-size:3rem">${task.icon}</span>
            <div class="card-title">${task.title}</div>
            <div style="background:linear-gradient(135deg,#EBF5FB,#D6EAF8);border:2px solid #85C1E9;border-radius:14px;padding:16px;margin:16px 0;text-align:left;font-size:0.95rem;line-height:1.6">
              ${getTaskInstruction(task.type, worldId)}
            </div>
            <button class="btn btn-primary btn-big btn-full" onclick="App.launchGame(${worldId}, ${taskIndex})">
              Verstanden! ✅ Los geht's!
            </button>
            <button class="btn btn-secondary btn-full" style="margin-top:10px" onclick="App.showWorld(${worldId})">
              ◀ Zurück
            </button>
          </div>
        </div>
      </div>
    `;
  },

  launchGame(worldId, taskIndex) {
    const player = State.refreshCurrentPlayer();
    const world = WORLDS.find(w => w.id === worldId);
    const task = world.tasks[taskIndex];
    const ageGroup = State.getAgeGroup(player);

    document.getElementById('app').innerHTML = `
      <div class="mountain-bg">
        <div class="sky-gradient"></div>
        ${mountainSVG()}
      </div>

      <div class="page">
        <div class="game-container">
          <div class="game-header">
            <div class="game-title">${task.icon} ${task.title}</div>
            <div class="joker-badge ${player.worlds[worldId].jokerUsed ? 'used' : ''}"
                 onclick="${player.worlds[worldId].jokerUsed ? '' : `App.useJokerInGame(${worldId}, ${taskIndex})`}">
              🃏
            </div>
          </div>
          <div id="game-area">
            <div style="text-align:center;padding:40px;color:var(--text-mid)">Wird geladen...</div>
          </div>
        </div>
      </div>
    `;

    const onComplete = ({ score }) => {
      State.completeTask(player.name, worldId, taskIndex, score);
      this._showTaskComplete(worldId, taskIndex, score);
    };

    // Launch correct game
    setTimeout(() => {
      switch (task.type) {
        case 'math':
          MathGame.start({ ageGroup, worldId, onComplete });
          break;
        case 'reaction':
          ReactionGame.start({ onComplete });
          break;
        case 'memory':
          MemoryGame.start({ emojis: world.memoryEmojis, onComplete });
          break;
        case 'train':
          TrainGame.start({ worldId, onComplete });
          break;
        case 'search':
          SearchGame.start({ worldId, theme: world.searchTheme, onComplete });
          break;
        case 'differences':
          DifferencesGame.start({ worldId, theme: world.diffTheme, onComplete });
          break;
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
      this._showTaskComplete(worldId, taskIndex, 0, true);
    }
  },

  _showTaskComplete(worldId, taskIndex, score, wasJoker = false) {
    const player = State.refreshCurrentPlayer();
    const world = WORLDS.find(w => w.id === worldId);
    const allDone = player.worlds[worldId].tasks.every(t => t && t.done);
    const worldCompleted = player.worlds[worldId].completed;

    document.getElementById('app').innerHTML = `
      <div class="mountain-bg">
        <div class="sky-gradient"></div>
        ${mountainSVG()}
      </div>
      <div class="page">
        <div class="overlay-box" style="background:white;border-radius:24px;padding:36px 28px;text-align:center;max-width:340px;box-shadow:0 24px 64px rgba(0,0,0,0.3)">
          <div class="overlay-emoji">${wasJoker ? '🃏' : allDone ? '🏆' : '⭐'}</div>
          <div class="overlay-title" style="font-family:'Fredoka One',cursive;font-size:2rem">
            ${wasJoker ? 'Joker eingesetzt!' : 'Super gemacht!'}
          </div>
          <div class="overlay-msg" style="color:var(--text-mid);margin-bottom:24px">
            ${wasJoker ? 'Die Aufgabe zählt als geschafft.' : `${score} Punkte gesammelt!`}
            ${allDone ? `<br><br>🎉 Welt "${world.name}" ist komplett!` : ''}
          </div>
          ${allDone && worldId < 5 ? `
            <button class="btn btn-gold btn-full" onclick="App.showWorld(${worldId + 1})">
              Nächste Welt: ${WORLDS[worldId].name} ➜
            </button>
            <br><br>
          ` : ''}
          <button class="btn btn-primary btn-full" onclick="App.showWorld(${worldId})">
            Weiter in Welt ${worldId} ➜
          </button>
          <br><br>
          <button class="btn" style="background:#F5F5F5;color:var(--text-mid)" onclick="App.showWorldMap()">
            Zur Welten-Übersicht
          </button>
        </div>
      </div>
    `;
  },
};

// ============================================
// HELPER: Mountain SVG Background
// ============================================
function mountainSVG() {
  return `
    <svg class="mountain-svg" viewBox="0 0 375 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">
      <!-- Back mountains -->
      <polygon points="0,200 60,60 120,200" fill="#A8C898" opacity="0.6"/>
      <polygon points="80,200 180,20 280,200" fill="#8FAF6F" opacity="0.7"/>
      <polygon points="220,200 310,50 400,200" fill="#9BBE82" opacity="0.6"/>
      <!-- Snow caps -->
      <polygon points="60,60 75,95 45,95" fill="white" opacity="0.9"/>
      <polygon points="180,20 200,65 160,65" fill="white" opacity="0.9"/>
      <polygon points="310,50 328,85 292,85" fill="white" opacity="0.9"/>
      <!-- Meadow -->
      <rect y="160" width="375" height="40" fill="#7BC47F"/>
      <!-- Flowers -->
      ${[20,60,100,140,180,220,260,300,340].map((x, i) => `
        <circle cx="${x}" cy="162" r="4" fill="${['#FF6B9D','#FFD700','#9B59B6','#FF6B9D','#FFD700'][i % 5]}"/>
        <line x1="${x}" y1="162" x2="${x}" y2="178" stroke="#27AE60" stroke-width="1.5"/>
      `).join('')}
      <!-- Ski lift cable -->
      <line x1="160" y1="20" x2="380" y2="155" stroke="#5D6D7E" stroke-width="1.5" opacity="0.5" stroke-dasharray="4,4"/>
    </svg>
  `;
}

// ============================================
// HELPER: Task Instructions
// ============================================
function getTaskInstruction(type, worldId) {
  const instructions = {
    math: '🔢 <b>Rechenaufgabe!</b><br>Löse 10 Rechenaufgaben. Wähle die richtige Antwort aus den vier Möglichkeiten. Du hast für jede Aufgabe unbegrenzt Zeit – denke in Ruhe nach!',
    reaction: '⚡ <b>Reaktionsspiel!</b><br>Wenn der Bildschirm <span style="color:#27AE60;font-weight:700">GRÜN</span> leuchtet, tippe so schnell wie möglich drauf!<br>Wenn der Bildschirm <span style="color:#E74C3C;font-weight:700">ROT</span> leuchtet, <b>warte</b> und tippe NICHT!',
    memory: '🧠 <b>Memory!</b><br>Finde alle 5 Kartenpaare! Decke zwei Karten auf – wenn sie gleich sind, bleiben sie offen. Wenn nicht, werden sie wieder verdeckt. Merke dir gut wo welche Karte liegt!',
    train: '🚂 <b>Zugweichen-Spiel!</b><br>Bei jeder Weiche musst du den Zug nach <b>links</b> oder <b>rechts</b> lenken. Nur eine Seite führt zum Bahnhof! Lies die Frage sorgfältig.',
    search: '🔍 <b>VfB Logo suchen!</b><br>Es sind 5 VfB-Logos in diesem Bild versteckt. Tippe darauf, wenn du eines findest. Schau ganz genau!',
    differences: '🖼️ <b>Unterschiede finden!</b><br>Diese zwei Bilder sehen fast gleich aus – aber nicht ganz! Finde alle 5 Unterschiede. Tippe auf die Stelle wo du einen Unterschied siehst.',
  };
  return instructions[type] || 'Mach dich bereit für die nächste Aufgabe!';
}

window.App = App;
window.mountainSVG = mountainSVG;
window.getTaskInstruction = getTaskInstruction;
