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
    this._html(`
      <div class="mountain-bg">
        <div class="sky-gradient"></div>
        <div class="cloud cloud-1"></div><div class="cloud cloud-2"></div><div class="cloud cloud-3"></div>
        ${mountainSVG()}
      </div>
      <div class="page">
        <div class="game-logo">
          <span class="logo-emoji">✈️</span>
          <h1>Das Mischa<br>Denkspiel</h1>
          <p class="subtitle">Ferien in Frankreich 🇫🇷</p>
        </div>
        <div class="card">
          <div class="card-title">Willkommen! 👋</div>
          <div class="card-subtitle">
            Begleite Mischa auf seinen Ferien in Frankreich!
            Löse Aufgaben in allen 10 Welten! 🏆
          </div>
          <div style="background:#F0F9FF;border:2px solid #85C1E9;border-radius:12px;padding:12px;margin-bottom:18px;font-size:0.85rem;line-height:1.8;max-height:180px;overflow-y:auto">
            🚗 Welt 1: Anreise · 🏰 Welt 2: Schloss · 🏊 Welt 3: Pool<br>
            🎾 Welt 4: Tennis · 🎲 Welt 5: Kniffel · 🚴 Welt 6: Fahrrad<br>
            🍽️ Welt 7: Essen · ⚽ Welt 8: Fussball · 🧳 Welt 9: Packen<br>
            🏠 Welt 10: Abreise
          </div>
          <div style="display:flex;flex-direction:column;gap:10px">
            <button class="btn btn-primary btn-full btn-big" onclick="App.showCharSelect()">🆕 Neu starten</button>
            <button class="btn btn-secondary btn-full" onclick="App.showLogin()">🔑 Anmelden</button>
            <button class="btn btn-full" style="background:rgba(255,255,255,0.5);color:var(--text-dark)" onclick="App.showGlobalLeaderboard()">🌍 Weltrangliste</button>
          </div>
        </div>
      </div>`);
  },

  // ---- CHARACTER SELECT ----
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
    const player = await State.createPlayer({ name, password:pw, birthYear:year, character:this.selectedChar, characterColor:this.selectedColor });
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
    this._loading('Anmelden...');
    const res = await State.login(name, pw);
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
              <div style="font-family:'Fredoka One',cursive;font-size:1rem;color:white;text-shadow:0 2px 4px rgba(0,0,0,0.3)">${player.name}</div>
              <div class="score-badge" style="font-size:0.8rem;padding:3px 10px">⭐ ${player.totalScore||0}</div>
            </div>
          </div>
          <div style="display:flex;gap:6px">
            <button onclick="App.showGlobalLeaderboard()" style="background:rgba(255,255,255,0.25);border:2px solid white;color:white;padding:6px 12px;border-radius:50px;font-weight:700;cursor:pointer;font-size:0.78rem">🌍 Rangliste</button>
            <button onclick="App._logout()" style="background:rgba(255,255,255,0.25);border:2px solid white;color:white;padding:6px 12px;border-radius:50px;font-weight:700;cursor:pointer;font-size:0.78rem">Abmelden</button>
          </div>
        </div>

        <div style="font-family:'Fredoka One',cursive;font-size:1.3rem;color:white;text-align:center;text-shadow:0 2px 6px rgba(0,0,0,0.3);margin-bottom:12px">
          ✈️ Wähle deine Welt!
        </div>

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
                  <div class="world-progress">${done}/10 ✓</div>
                </div>
                <span style="font-size:1.3rem">${completed?'🏆':unlocked?'▶':'🔒'}</span>
              </div>`;
          }).join('')}
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
    const players = await State.getLeaderboard(30);
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
    const ws = player.worlds?.[worldId] || { tasks:Array(10).fill(null), jokerUsed:false, completed:false };
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
            <div style="display:flex;gap:8px;align-items:center">
              <button onclick="App.showGlobalLeaderboard()" style="background:rgba(74,144,217,0.1);border:2px solid var(--sky-deep);color:var(--sky-deep);padding:5px 10px;border-radius:50px;font-weight:700;cursor:pointer;font-size:0.75rem">🌍 Rangliste</button>
              <div class="joker-badge ${ws.jokerUsed?'used':''}" onclick="${ws.jokerUsed?'':  `App.showJokerMenu(${worldId})`}">
                🃏 ${ws.jokerUsed?'(benutzt)':'Joker'}
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
              return `
                <button class="task-btn ${cls}"
                  onclick="${(isActive||tdone)?`App.startTask(${worldId},${i})`:'void(0)'}"
                  title="${task.title}">
                  <span style="font-size:1.1rem">${task.icon}</span>
                  <span style="font-size:0.6rem">${i+1}</span>
                  ${score?`<span style="font-size:0.55rem;opacity:0.8">⭐${score}</span>`:''}
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
    if (confirm(`🃏 Joker einsetzen?\nDie aktuelle Aufgabe zählt als geschafft. Nur ein Joker pro Welt!`)) {
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
        case 'search':      SearchGame.start({ worldId, theme: world.searchTheme, onComplete }); break;
        case 'differences': DifferencesGame.start({ worldId, theme: world.diffTheme, onComplete }); break;
        case 'shutthebox':  ShutTheBoxGame.start({ onComplete }); break;
        case 'jenga':       JengaGame.start({ worldId, ageGroup, onComplete }); break;
        case 'balloon':     BalloonGame.start({ ageGroup, worldId, onComplete }); break;
        case 'simon':       SimonGame.start({ worldId, onComplete }); break;
        case 'truefalse':   TrueFalseGame.start({ worldId, onComplete }); break;
        case 'slider':      SliderGame.start({ ageGroup, worldId, onComplete }); break;
        case 'wordsearch':  WordSearchGame.start({ worldId, onComplete }); break;
        case 'typing':      TypingGame.start({ ageGroup, worldId, onComplete }); break;
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
    if (player.worlds?.[worldId]?.jokerUsed) return;
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

    this._html(`
      <div class="mountain-bg"><div class="sky-gradient"></div>${mountainSVG()}</div>
      <div class="page">
        <div class="overlay-box">
          <div class="overlay-emoji">${wasJoker?'🃏':allDone?'🏆':'⭐'}</div>
          <div class="overlay-title">${wasJoker?'Joker!':'Super!'}</div>
          <div class="overlay-msg">
            ${wasJoker?'Aufgabe geschafft.':finalScore>0?`⭐ ${finalScore} Punkte!`:'Weiter geht\'s!'}
            ${allDone?`<br><br>🎉 <b>Welt "${world.name}"</b> komplett!`:''}
          </div>
          ${allDone && worldId < 10 ? `
            <button class="btn btn-gold btn-full" style="margin-bottom:10px" onclick="App._portalTransition(${worldId})">
              🌀 Nächste Welt!
            </button>` : ''}
          ${allDone && worldId === 10 ? `
            <button class="btn btn-gold btn-full" style="margin-bottom:10px" onclick="App.showGlobalLeaderboard()">
              🏆 Zur Weltrangliste!
            </button>` : ''}
          <button class="btn btn-primary btn-full" onclick="App.showWorld(${worldId})">Weiter in Welt ${worldId} ➜</button>
          <br><br>
          <button class="btn" style="background:#F5F5F5;color:var(--text-mid);font-size:0.9rem" onclick="App.showWorldMap()">Alle Welten</button>
        </div>
      </div>`);
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
  return `<svg class="mountain-svg" viewBox="0 0 375 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">
    <polygon points="0,200 60,60 120,200" fill="#A8C898" opacity="0.6"/>
    <polygon points="80,200 180,20 280,200" fill="#8FAF6F" opacity="0.7"/>
    <polygon points="220,200 310,50 400,200" fill="#9BBE82" opacity="0.6"/>
    <polygon points="60,60 75,95 45,95" fill="white" opacity="0.9"/>
    <polygon points="180,20 200,65 160,65" fill="white" opacity="0.9"/>
    <polygon points="310,50 328,85 292,85" fill="white" opacity="0.9"/>
    <rect y="160" width="375" height="40" fill="#7BC47F"/>
    ${[20,60,100,140,180,220,260,300,340].map((x,i)=>`<circle cx="${x}" cy="162" r="4" fill="${['#FF6B9D','#FFD700','#9B59B6','#FF6B9D','#FFD700'][i%5]}"/><line x1="${x}" y1="162" x2="${x}" y2="178" stroke="#27AE60" stroke-width="1.5"/>`).join('')}
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
  const map = {
    math:        '🔢 <b>Rechenaufgabe!</b><br>Löse 10 Aufgaben. Schnelle & fehlerfreie Antworten geben mehr Punkte!',
    reaction:    '⚡ <b>Reaktionsspiel!</b><br>🟢 <b>Grün = TIPPEN</b> &nbsp;|&nbsp; 🔴 <b>Rot = NICHTS TUN</b>',
    memory:      '🧠 <b>Memory!</b><br>Finde alle 5 Kartenpaare. Weniger Versuche = mehr Punkte!',
    train:       '🚂 <b>Zugweichen!</b><br>Lenke den Zug richtig. Tippe auf <b>Links</b> oder <b>Rechts</b>.',
    search:      '🔍 <b>VfB Wappen suchen!</b><br>Finde 5 versteckte VfB Stuttgart Wappen im Bild. Fehlklicks kosten Punkte!',
    differences: '🖼️ <b>Unterschiede finden!</b><br>Tippe auf Stellen die zwischen den zwei Bildern unterschiedlich sind. Fehlklicks kosten Punkte!',
    shutthebox:  '🎲 <b>Shut the Box!</b><br>Würfle und schliesse Zahlen die zusammen die Würfelsumme ergeben. Ziel: alle 9 Felder schliessen!',
    jenga:       '🗼 <b>Jenga-Turm!</b><br>Beantworte 10 Fragen. Jeder Fehler = ein Stein fällt. Verhindere den Einsturz!',
    balloon:     '🎈 <b>Ballon-Mathe!</b><br>Eine Rechenaufgabe erscheint — tippe auf den Ballon mit der richtigen Antwort! Sei schnell, falsche Ballons platzen rot.',
    simon:       '🎨 <b>Simon Says!</b><br>Eine Farb-Sequenz wird angezeigt — merke dir die Reihenfolge und tippe die Farben in der gleichen Reihenfolge nach. Jede Runde wird die Sequenz länger!',
    truefalse:   '❓ <b>Wahr oder Falsch?</b><br>Lies die Aussage und entscheide schnell: ist sie <b>Wahr ✅</b> oder <b>Falsch ❌</b>? 10 Fragen zur aktuellen Welt!',
    pacman:      '👾 <b>Pac-Man!</b><br>Fresse alle Punkte und weiche den Geistern aus! Steuere mit den Pfeiltasten ← ↑ → ↓ oder wische über den Bildschirm.',
    slider:      '🧩 <b>Schiebepuzzle!</b><br>Schiebe die Felder in die richtige Reihenfolge. Tippe auf ein Feld neben dem leeren Feld um es zu verschieben. Weniger Züge = mehr Punkte!',
    wordsearch:  '🔤 <b>Wörter suchen!</b><br>Finde alle 5 Wörter im Buchstaben-Raster. Wische von einem Buchstaben zum nächsten um ein Wort zu markieren.',
    typing:      '⌨️ <b>Tipp-Spiel!</b><br>Tippe die angezeigten Wörter so schnell und genau wie möglich ab. 10 Wörter — schnell und fehlerlos tippen gibt die meisten Punkte!',
  };
  return map[type] || 'Los geht\'s!';
}

window.App = App;
window.mountainSVG = mountainSVG;
window.worldPathSVG = worldPathSVG;
window.getTaskInstruction = getTaskInstruction;
