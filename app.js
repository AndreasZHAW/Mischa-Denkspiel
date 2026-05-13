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
   
    // Draw stars on canvas
    const wmc = document.getElementById('wm-stars');
    if(wmc){ const wctx=wmc.getContext('2d'); wmc.width=wmc.offsetWidth||window.innerWidth; wmc.height=wmc.offsetHeight||window.innerHeight;
      wctx.fillStyle='#000'; wctx.fillRect(0,0,wmc.width,wmc.height);
      for(let i=0;i<200;i++){const x=Math.random()*wmc.width,y=Math.random()*wmc.height*0.65,s=Math.random()*1.8+0.2,b=Math.random()*0.7+0.3;wctx.fillStyle=`rgba(255,255,${Math.floor(200+Math.random()*55)},${b})`;wctx.beginPath();wctx.arc(x,y,s,0,Math.PI*2);wctx.fill();}
      wmc.style.background='transparent';
    } const mt = State.currentPlayer?.totalScore || 0;
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
          <p style="font-size:.62rem;color:rgba(255,255,255,.4);margin-top:2px;letter-spacing:.5px">📦 v2026.05.05-1141</p>
        </div>
        <div class="card" style="background:linear-gradient(135deg,rgba(10,10,25,.95),rgba(20,20,40,.9));border:1px solid rgba(255,215,0,.25);box-shadow:0 0 30px rgba(255,165,0,.1)">
          <div class="card-title" style="background:linear-gradient(135deg,#FFD700,#FF8C00);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">⚔️ Willkommen, Abenteurer</div>

          <!-- Welt 1 Box - dark dramatic style -->
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
              <button class="btn" style="flex:1;background:rgba(255,215,0,0.2);color:#FFD700;border:1px solid rgba(255,215,0,.4)" onclick="App.showGeldbeutel()">👜 Geldbeutel</button>
              <button class="btn" style="flex:1;background:rgba(41,182,246,0.2);color:#29B6F6;border:1px solid rgba(41,182,246,.4)" onclick="App.showKontoauszug()">📊 Kontoauszug</button>
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
    // Pass character so zoo skips its own login
    const charData = (window.CHARACTERS||CHARACTERS||[]).find(c=>c.id===p.character);
    const zooUsers = JSON.parse(localStorage.getItem('zoo_users')||'{}');
    const zKey = p.name.toLowerCase();
    if(!zooUsers[zKey]) zooUsers[zKey] = {pw:'auto',ch:{e:charData?.emoji||'🧭',id:p.character}};
    else zooUsers[zKey].ch = {e:charData?.emoji||'🧭',id:p.character};
    localStorage.setItem('zoo_users', JSON.stringify(zooUsers));
    sessionStorage.setItem('mischa_birthyear', p.birthYear||2000);
    // ── CINEMATIC TELEPORT SCREEN ──
    this._showTeleportCinema(p.name, charData?.emoji||'🧭', mt-cost);
  },

  _showTeleportCinema(playerName, charEmoji, mtLeft){
    // Full-screen cinematic overlay
    const ov=document.createElement('div');
    ov.style.cssText='position:fixed;inset:0;z-index:99999;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;text-align:center;padding:24px';
    
    const phases=[
      {icon:'🌟',title:'Gut gemacht, '+playerName+'!',text:'Du hast dein Startkapital erkämpft. Jetzt beginnt das eigentliche Abenteuer!',delay:0},
      {icon:charEmoji,title:'Dein Zoo wartet',text:'In Welt 2 erwartet dich ein lebendiger 3D-Zoo. Mischa und Janosch sind stolz auf dich!',delay:3000},
      {icon:'\uD83E\uDD81',title:'Willkommen im Zoo!',text:'Die Tiere warten auf ihren neuen Besitzer. Bereit?',delay:5500},
    ];
    
    // Stars background
    const stars=document.createElement('canvas');
    stars.style.cssText='position:absolute;inset:0;z-index:0';
    stars.width=window.innerWidth;stars.height=window.innerHeight;
    const sctx=stars.getContext('2d');
    for(let i=0;i<150;i++){
      sctx.beginPath();sctx.arc(Math.random()*stars.width,Math.random()*stars.height,Math.random()*1.5+.3,0,Math.PI*2);
      sctx.fillStyle='rgba(255,255,255,'+(Math.random()*.6+.1)+')';sctx.fill();
    }
    ov.appendChild(stars);
    
    const content=document.createElement('div');
    content.style.cssText='position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:16px;';
    ov.appendChild(content);
    document.body.appendChild(ov);
    
    // Play intro theme
    this._playTeleportMusic();
    
    let phase=0;
    function showPhase(){
      if(phase>=phases.length){
        // Fade out and go to zoo
        ov.style.transition='opacity .8s';ov.style.opacity='0';
        setTimeout(()=>{ window.location.href='zoo.html'; },800);
        return;
      }
      const ph=phases[phase];
      content.style.opacity='0';content.style.transition='opacity .5s';
      setTimeout(()=>{
        content.innerHTML=
          '<div style="font-size:5rem;filter:drop-shadow(0 0 20px rgba(255,215,0,.7));animation:teleFloat 2s ease-in-out infinite">'+ph.icon+'</div>'+
          '<div style="font-size:clamp(1.3rem,4vw,2rem);font-weight:900;background:linear-gradient(135deg,#FFD700,#FF8C00);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">'+ph.title+'</div>'+
          '<div style="font-size:.95rem;color:rgba(255,255,255,.75);line-height:1.8;line-height:1.8">'+ph.text+'</div>'+
          (phase===phases.length-1?'<div style="font-size:.75rem;color:rgba(255,215,0,.5);letter-spacing:2px;margin-top:8px">🌀 '+Math.round(mtLeft)+' MT · Starte jetzt</div>':'');
        content.style.opacity='1';
        phase++;
        const nextDelay=phase<phases.length?(phases[phase]?.delay-ph.delay||2500):2500;
        setTimeout(showPhase, nextDelay);
      },300);
    }
    showPhase();
    
    // Add CSS animation
    const styleEl=document.createElement('style');
    styleEl.textContent='@keyframes teleFloat{0%,100%{transform:translateY(0);}50%{transform:translateY(-12px);}}';
    document.head.appendChild(styleEl);
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
        <div style="font-size:.75rem;font-weight:700;color:${col};margin-bottom:8px;padding:4px 10px;background:${col}22;border-radius:6px;display:inline-block">
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
            <div style="font-size:.75rem;color:rgba(255,255,255,.5)">${ch} ${player.name}</div>
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
          <div style="font-size:.68rem;color:rgba(255,255,255,.4);margin-top:6px;text-align:center">
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
      b.style.cssText='position:fixed;top:0;left:0;right:0;z-index:9998;background:linear-gradient(135deg,#E74C3C,#C0392B);color:white;padding:8px 16px;text-align:center;font-family:"Fredoka One",cursive;font-size:.88rem;box-shadow:0 2px 8px rgba(0,0,0,.3)';
      b.innerHTML='🔬 KALIBRIERUNGS-MODUS — Spieler: Janoschtest · '+_deviceIcon+' '+_deviceType+' · Nicht in Rangliste <button onclick="this.parentElement.remove()" style="background:rgba(255,255,255,.2);border:none;color:white;padding:1px 7px;border-radius:4px;cursor:pointer;margin-left:8px">✕</button>';
      document.body.prepend(b);
    }, 600);
    const ch = this._char(player);

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
        .filter(p=>p&&p.name&&(window.isInLeaderboard?window.isInLeaderboard(p.name):true)).filter(p=>p&&p.name&&p.name.toLowerCase()!=='janoschtest'&&p.name.toLowerCase()!=='bu').sort((a,b) => {
      const getMT = p => {
        const ws = p.worlds?.[1] || p.worlds?.['1'] || {};
        return (ws.tasks||[]).reduce((sum,t) => sum + (t?.mt||0), 0);
      };
      return getMT(b) - getMT(a);
    });
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
                    <div style="font-family:'Fredoka One',cursive;color:#E67E22;font-size:1rem">🌀 ${((p.worlds?.[1]||p.worlds?.['1']||{}).tasks||[]).reduce((s,t)=>s+(t?.mt||0),0).toFixed(1)} MT</div>
                  </div>`;
              }).join('')
          }
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
    const ua = navigator.userAgent;
    const isIPad = /iPad/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
    const devLabel = isIPad?'ipad':/iPhone/.test(ua)?'iphone':/Android/.test(ua)?'android':'desktop';
    const devName = {ipad:'iPad',iphone:'iPhone',android:'Android',desktop:'Desktop'}[devLabel];
    const isRef = false; // Admin sees cal table via admin panel

    // Load calibration store (all scores per game per device)
    let calStore = {};
    try { calStore = JSON.parse(localStorage.getItem('cal_data_v3')||'{}'); } catch(e){}

    const DEVS = ['desktop','ipad','iphone','android'];
    const DEV_ICONS = {desktop:'🖥️',ipad:'📱iPad',iphone:'📱Phone',android:'🤖'};

    // Build table rows
    const tableRows = gl.map((game,i) => {
      const task = tasks[i];
      const myScore = task?.mt || 0;  // MT earned (0-2 range)
      const myRaw = task?.rawScore || 0;
      const plays = task?.plays || (task?.done?1:0);

      // Calibration stats per device for this game
      const devStats = {};
      DEVS.forEach(d => {
        const key = i + '_' + d;
        const scores = calStore[key] || [];
        if (scores.length > 0) {
          devStats[d] = {
            min: Math.min(...scores),
            max: Math.max(...scores),
            avg: Math.round(scores.reduce((a,b)=>a+b,0)/scores.length),
            n: scores.length,
            scores
          };
        }
      });

      if (isRef) {
        // Janoschtest sees: min / avg / max per device + edit/delete buttons
        const devCells = DEVS.map(d => {
          const st = devStats[d];
          if (!st) return `<td colspan="3" style="padding:3px 4px;text-align:center;color:#444;font-size:.68rem">—</td>`;
          return `<td style="padding:3px 4px;text-align:center;font-size:.68rem;color:#E74C3C">${st.min}</td>
            <td style="padding:3px 4px;text-align:center;font-size:.68rem;color:#FFD700">${st.avg}</td>
            <td style="padding:3px 4px;text-align:center;font-size:.68rem;color:#27AE60">${st.max}
              <button onclick="App._calEdit(${i},'${d}')" style="background:none;border:none;cursor:pointer;font-size:.6rem;opacity:.6" title="Bearbeiten">✏️</button>
            </td>`;
        }).join('');
        return `<tr style="border-bottom:1px solid rgba(255,255,255,.05)">
          <td style="padding:4px 5px;font-size:.72rem">${game.icon} ${game.name}</td>
          <td style="padding:4px 5px;text-align:center;color:${myScore>=1.5?'#27AE60':myScore>=1?'#FFD700':myScore>0?'#E67E22':'#555'};font-weight:700;font-size:.75rem">${myScore>0?(myScore.toFixed(1)+' MT'):'—'}</td>
          ${devCells}
        </tr>`;
      } else {
        // Normal players: just show their score and MT, with comparison
        const allP_raw = (() => {
          const scores_all = calStore[i+'_'+devLabel]||[];
          if (!scores_all.length) return null;
          return {min:Math.min(...scores_all),max:Math.max(...scores_all),avg:Math.round(scores_all.reduce((a,b)=>a+b,0)/scores_all.length),n:scores_all.length};
        })();
        const rank = allP_raw && myRaw > 0 ? 
          (calStore[i+'_'+devLabel]||[]).filter(s=>s>myRaw).length + 1 : null;
        return `<tr style="border-bottom:1px solid rgba(255,255,255,.05)">
          <td style="padding:5px 6px;font-size:.78rem">${game.icon} ${game.name}</td>
          <td style="padding:5px 6px;text-align:center;color:${myScore>=1.5?'#27AE60':myScore>=1?'#FFD700':myScore>0?'#E67E22':'#555'};font-weight:700">${myScore||'—'}</td>
          <td style="padding:5px 6px;text-align:center;color:rgba(255,255,255,.4);font-size:.74rem">${allP_raw?allP_raw.avg:'—'}</td>
          <td style="padding:5px 6px;text-align:center;font-size:.74rem">${rank?`<span style="color:${rank<=3?'#FFD700':'#aaa'}">#${rank}</span>`:'—'}</td>
          <td style="padding:5px 6px;text-align:center;color:rgba(255,255,255,.4);font-size:.72rem">${plays||'—'}</td>
        </tr>`;
      }
    }).join('');

    // Ref header has device columns
    const refHeader = isRef ? DEVS.map(d=>`
      <th colspan="3" style="padding:4px 6px;text-align:center;font-size:.65rem;border-left:1px solid rgba(255,255,255,.1)">${DEV_ICONS[d]}<button onclick="App._calClearDev('${d}')" style="background:none;border:none;cursor:pointer;font-size:.55rem;opacity:.5" title="Gerät löschen">🗑️</button></th>`).join('') : '';
    const refSubHeader = isRef ? DEVS.map(d=>`
      <th style="padding:3px 4px;text-align:center;font-size:.6rem;color:#E74C3C">Min</th>
      <th style="padding:3px 4px;text-align:center;font-size:.6rem;color:#FFD700">Ø</th>
      <th style="padding:3px 4px;text-align:center;font-size:.6rem;color:#27AE60">Max</th>`).join('') : '';

    const normalHeader = !isRef ? `
      <th style="padding:5px 6px;text-align:center">Ø Alle</th>
      <th style="padding:5px 6px;text-align:center">Rang</th>
      <th style="padding:5px 6px;text-align:center">Spiele</th>` : '';

    this._html(`
      <div class="mountain-bg"><div class="sky-gradient"></div>${mountainSVG()}</div>
      <div class="page" style="padding-top:10px">
        <div class="card" style="background:linear-gradient(135deg,rgba(5,10,25,.97),rgba(10,20,45,.95));border:1px solid rgba(41,182,246,.3);padding:12px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
            <button class="btn" onclick="App.showWorldMap()" style="background:rgba(255,255,255,.1);color:#fff;padding:5px 12px;font-size:.82rem">← Zurück</button>
            <h2 style="flex:1;font-family:'Fredoka One',cursive;color:#29B6F6;font-size:1rem;margin:0">📊 Kontoauszug</h2>
            <div style="font-size:.66rem;color:rgba(255,255,255,.4)">${devName}${isRef?' · 🔬':''}</div>
          </div>
          ${isRef?`<div style="background:rgba(231,76,60,.12);border:1px solid rgba(231,76,60,.3);border-radius:8px;padding:6px 10px;margin-bottom:8px;font-size:.7rem;color:#E74C3C">
            🔬 Kalibrierungs-Modus · Aktuelles Gerät: <b>${devName}</b> · Min=0MT · Ø=1MT · Max=2MT
          </div>`:''}
          <div style="overflow-x:auto;-webkit-overflow-scrolling:touch">
            <table style="width:100%;border-collapse:collapse;font-size:.78rem">
              <thead>
                <tr style="border-bottom:1px solid rgba(41,182,246,.2);color:rgba(255,255,255,.4)">
                  <th style="padding:4px 6px;text-align:left">Spiel</th>
                  <th style="padding:4px 6px;text-align:center">MT</th>
                  ${isRef ? refHeader : normalHeader}
                </tr>
                ${isRef ? `<tr style="border-bottom:2px solid rgba(41,182,246,.2);color:rgba(255,255,255,.3)">${'<th></th><th></th>'+refSubHeader}</tr>` : ''}
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
    if (!player) return;
    const ws = player.worlds?.[1] || player.worlds?.['1'] || {tasks: Array(20).fill(null)};
    const gl = window.GAME_LIST || [];
    const rows = gl.map((game, i) => {
      const task = ws.tasks?.[i];
      const mt = task?.mt || 0;
      const score = task?.score || '—';
      const plays = task?.plays || (task?.done ? 1 : 0);
      return {game, mt, score, plays, done: task?.done||false};
    }).sort((a,b) => b.mt - a.mt);
    const totalMT = rows.reduce((s,r)=>s+r.mt,0);
    const tableRows = rows.map((r,i)=>`<tr style="border-bottom:1px solid rgba(255,255,255,.05)${i<3?';background:rgba(255,215,0,.04)':''}"><td style="padding:6px 8px;font-size:.82rem">${r.game.icon} ${r.game.name}</td><td style="padding:6px 8px;text-align:center;color:${r.mt>0?'#FFD700':'rgba(255,255,255,.3)'};font-weight:${r.mt>0?'700':'400'}">${r.mt>0?'🌀 '+r.mt:'—'}</td><td style="padding:6px 8px;text-align:center;color:rgba(255,255,255,.5);font-size:.8rem">${r.done?r.score:'—'}</td><td style="padding:6px 8px;text-align:center;color:rgba(255,255,255,.4);font-size:.75rem">${r.plays>0?r.plays+'×':'—'}</td></tr>`).join('');
    this._html(`<div class="mountain-bg"><div class="sky-gradient"></div>${mountainSVG()}</div><div class="page"><div class="card" style="background:linear-gradient(135deg,rgba(10,10,25,.95),rgba(20,20,40,.9));border:1px solid rgba(255,215,0,.25)"><div style="display:flex;align-items:center;gap:10px;margin-bottom:16px"><button class="btn" onclick="App.showWorldMap()" style="background:rgba(255,255,255,.1);color:#fff;padding:6px 14px">← Zurück</button><h2 style="flex:1;font-family:'Fredoka One',cursive;color:#FFD700;font-size:1.3rem">👜 Geldbeutel</h2><div style="text-align:right"><div style="font-size:.75rem;color:rgba(255,255,255,.4)">Gesamt</div><div style="font-weight:900;color:#FFD700;font-size:1.1rem">🌀 ${totalMT.toFixed(1)} MT</div></div></div><div style="font-size:.72rem;color:rgba(255,255,255,.3);margin-bottom:10px">Jedes Spiel kann unbegrenzt wiederholt werden. Es zählt immer das letzte Ergebnis.</div><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:.82rem"><thead><tr style="border-bottom:2px solid rgba(255,215,0,.3);color:rgba(255,255,255,.5)"><th style="padding:7px 8px;text-align:left">Spiel</th><th style="padding:7px 8px;text-align:center">MT</th><th style="padding:7px 8px;text-align:center">Score</th><th style="padding:7px 8px;text-align:center">Gespielt</th></tr></thead><tbody>${tableRows}</tbody></table></div></div></div>`);
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
      calStatus = '<div style="background:linear-gradient(135deg,#E74C3C,#C0392B);color:#fff;padding:10px 14px;border-radius:10px;margin-bottom:12px;font-size:.82rem">'
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


        <div class="card" style="max-width:480px;padding:16px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
            <button onclick="App.showWorldMap()" style="background:none;border:none;font-size:0.95rem;cursor:pointer;color:var(--text-mid)">◀ Welten</button>
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
              <button onclick="App.showGlobalLeaderboard()" style="background:rgba(74,144,217,0.1);border:2px solid var(--sky-deep);color:var(--sky-deep);padding:5px 10px;border-radius:50px;font-weight:700;cursor:pointer;font-size:0.75rem">🌍 Rangliste</button>
              <button onclick="App.showKontoauszug()" style="background:rgba(41,182,246,0.1);border:2px solid #29B6F6;color:#29B6F6;padding:5px 10px;border-radius:50px;font-weight:700;cursor:pointer;font-size:0.8rem">📊 Kontoauszug</button>
              <button onclick="Wardrobe.open()" style="background:rgba(255,215,0,0.1);border:2px solid rgba(255,215,0,0.5);color:#FFD700;padding:5px 10px;border-radius:50px;font-weight:700;cursor:pointer;font-size:0.75rem">👗 Garderobe</button>
              <div class="joker-badge ${State.getJokersRemaining(player,worldId)===0?'used':''}"
              onclick="${State.getJokersRemaining(player,worldId)===0?'':  `App.showJokerMenu(${worldId})`}">
              🃏 ${State.getJokersRemaining(player,worldId)} Joker
            </div>
            </div>
          </div>

          <div style="font-size:0.8rem;color:var(--text-mid);margin-bottom:8px">Tippe auf die nächste Aufgabe:</div>

          ${_isRefW ? '<div style="background:rgba(231,76,60,.15);border:1px solid rgba(231,76,60,.4);border-radius:10px;padding:10px;margin-bottom:10px;font-size:.82rem;color:#fff"><b style="color:#E74C3C">&#128302; Kalibrierung:</b> '+calCount+'/20 Spiele &middot; '+runsCount+' Durchgang'+(runsCount>=3?' &middot; ✅ Vollständig':runsCount>0?' &middot; '+Math.round(calCount/20*100)+'%':'')+'</div>' : ''}
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
    const player = await State.refreshCurrentPlayer();
    const world  = WORLDS.find(w=>w.id===worldId);
    const task   = world.tasks[taskIndex];
    const ageGroup = State.getAgeGroup(player);
    const ws = (player.worlds?.[worldId] || player.worlds?.[String(worldId)] || {}) || {};

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
      // Save ALL players' scores to cal_data_v3 for calibration
      if (result.rawScore > 0 && result.passed !== false) {
        try {
          const ua = navigator.userAgent;
          const isIPad = /iPad/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
          const dev = isIPad?'ipad':/iPhone/.test(ua)?'iphone':/Android/.test(ua)?'android':'desktop';
          const calStore = JSON.parse(localStorage.getItem('cal_data_v3')||'{}');
          const key = taskIndex + '_' + dev;
          if (!calStore[key]) calStore[key] = [];
          calStore[key].push(result.rawScore);
          localStorage.setItem('cal_data_v3', JSON.stringify(calStore));
          // Sync to Firebase
          try {
            if (typeof _db !== 'undefined' && _db) {
              const upd = {}; upd[key] = calStore[key];
              _db.collection('calibration').doc('scores').set(upd, {merge:true}).catch(()=>{});
              // Save individual record
              _db.collection('calibration_records').add({
                gameIdx: taskIndex, device: dev,
                player: (player?.name||'?').toLowerCase(),
                rawScore: result.rawScore, ts: Date.now(),
                tsStr: new Date().toLocaleString('de-CH')
              }).catch(()=>{});
            } else {
              // Firebase not ready - queue it
              try {
                const q = JSON.parse(localStorage.getItem('cal_sync_queue')||'{}');
                q[key] = calStore[key];
                localStorage.setItem('cal_sync_queue', JSON.stringify(q));
                // Try to flush after a delay
                setTimeout(()=>{
                  try {
                    if(typeof _db!=='undefined'&&_db){
                      const qq=JSON.parse(localStorage.getItem('cal_sync_queue')||'{}');
                      if(Object.keys(qq).length){
                        _db.collection('calibration').doc('scores').set(qq,{merge:true})
                          .then(()=>localStorage.removeItem('cal_sync_queue')).catch(()=>{});
                      }
                    }
                  }catch(e){}
                }, 4000);
              } catch(e2){}
            }
          } catch(e) {}
        } catch(e) {}
      }
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
              const scores=(calStore[taskIndex+'_'+dev]||[]).filter(s=>s!==raw);
              // Use PREVIOUS scores only (exclude current raw to avoid double-count)
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
      // Show result immediately
      this._showTaskComplete(worldId, taskIndex, result);
      // Full save in background
      try {
        await Promise.race([
          State.completeTask(player.name, worldId, taskIndex, result),
          new Promise(r => setTimeout(r, 4000))
        ]);
      } catch(e) {}
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
        case 'french':      FrenchGame.start({ onComplete }); break;
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
    jenga:'🏎️', stunt:'🏎️', slider:'🧩', wordsearch:'🔤', typing:'⌨️', balloon:'🎈',
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
    balloon:     '🎈 <b>Ballon!</b><br>Halte den Ballon in der Luft — tippe/klicke rhythmisch, damit er nicht fällt.',
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
