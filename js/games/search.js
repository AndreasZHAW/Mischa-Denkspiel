/**
 * games/search.js — VfB Stuttgart Logo Suchspiel v2
 * Echte VfB Stuttgart Wappen versteckt in Welt-Szenen
 */

const SearchGame = {
  current: null,

  start(config) {
    const { worldId = 1, theme = 'forest', onComplete } = config;
    this.current = {
      worldId, theme,
      found: 0, total: 5,
      logos: this._getLogoPositions(theme),
      foundSet: new Set(),
      startTime: Date.now(),
      errors: 0,
      onComplete,
    };
    this._render();
  },

  // VfB-Logo als inline SVG (vereinfachtes Wappen in Rot/Weiß)
  _vfbLogoSVG(size = 28) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <!-- Schild -->
      <path d="M5,5 L55,5 L55,40 L30,58 L5,40 Z" fill="#E30613" stroke="white" stroke-width="2"/>
      <!-- Weißer Querstreifen -->
      <rect x="5" y="18" width="50" height="13" fill="white"/>
      <!-- VfB Text -->
      <text x="30" y="29" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900"
        font-size="10" fill="#E30613">VfB</text>
      <!-- Sterne oben -->
      <text x="18" y="16" text-anchor="middle" font-size="8" fill="white">★</text>
      <text x="30" y="16" text-anchor="middle" font-size="8" fill="white">★</text>
      <text x="42" y="16" text-anchor="middle" font-size="8" fill="white">★</text>
    </svg>`;
  },

  _getLogoPositions(theme) {
    const positions = {
      forest: [
        { x: 15, y: 20 }, { x: 70, y: 42 }, { x: 40, y: 68 },
        { x: 83, y: 18 }, { x: 52, y: 80 },
      ],
      mountain: [
        { x: 12, y: 28 }, { x: 58, y: 12 }, { x: 78, y: 52 },
        { x: 35, y: 72 }, { x: 88, y: 78 },
      ],
      restaurant: [
        { x: 18, y: 18 }, { x: 68, y: 32 }, { x: 44, y: 62 },
        { x: 84, y: 72 }, { x: 8,  y: 78 },
      ],
      snow: [
        { x: 22, y: 16 }, { x: 62, y: 28 }, { x: 40, y: 52 },
        { x: 78, y: 62 }, { x: 12, y: 70 },
      ],
      ski: [
        { x: 28, y: 12 }, { x: 72, y: 25 }, { x: 18, y: 52 },
        { x: 58, y: 65 }, { x: 86, y: 42 },
      ],
    };
    return (positions[theme] || positions.forest).map(p => ({ ...p, found: false }));
  },

  _render() {
    const c = this.current;
    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center;margin-bottom:8px;font-size:0.85rem;color:var(--text-mid)">
        🔍 Finde alle 5 VfB Stuttgart Wappen!
      </div>

      <!-- Found stars -->
      <div style="display:flex;gap:8px;justify-content:center;margin-bottom:10px">
        ${Array.from({length: 5}, (_, i) =>
          `<span id="star-${i}" style="font-size:1.4rem;filter:${i < c.found ? 'none' : 'grayscale(1)'};transition:filter 0.3s">⭐</span>`
        ).join('')}
      </div>

      <!-- Scene -->
      <div id="search-scene" style="position:relative;border-radius:14px;overflow:hidden;cursor:crosshair;user-select:none"
           onclick="SearchGame._handleMiss(event)">
        ${this._getSceneSVG(c.theme)}

        <!-- Hidden VfB logos -->
        ${c.logos.map((logo, i) => `
          <div id="logo-spot-${i}"
            style="position:absolute;left:calc(${logo.x}% - 16px);top:calc(${logo.y}% - 16px);
              width:32px;height:32px;border-radius:50%;
              cursor:pointer;z-index:10;
              background:${logo.found ? 'rgba(39,174,96,0.3)' : 'rgba(255,255,255,0.05)'};
              border:${logo.found ? '3px solid #27AE60' : '2px dashed transparent'};
              display:flex;align-items:center;justify-content:center;
              transition:all 0.3s;"
            onclick="event.stopPropagation();SearchGame._tapLogo(${i})">
            ${logo.found ? `<div style="transform:scale(0.6)">${this._vfbLogoSVG(28)}</div>` : ''}
          </div>
        `).join('')}
      </div>

      <!-- Hint -->
      <div id="search-hint" style="text-align:center;margin-top:8px;font-size:0.85rem;color:var(--text-mid);min-height:22px">
        ${c.found > 0 ? `✅ ${c.found}/5 gefunden!` : ''}
      </div>

      <!-- Error count -->
      <div style="text-align:center;font-size:0.75rem;color:var(--text-mid);margin-top:4px">
        Fehlklicks: ${c.errors}
      </div>
    `;
  },

  _getSceneSVG(theme) {
    const scenes = {
      forest: `
        <svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg" style="width:100%;display:block">
          <rect width="320" height="220" fill="#87CEEB"/>
          <rect y="155" width="320" height="65" fill="#7BC47F"/>
          <!-- Mountains bg -->
          <polygon points="0,155 60,80 120,155" fill="#9BBE82" opacity="0.5"/>
          <polygon points="200,155 280,60 320,155" fill="#8FAF6F" opacity="0.5"/>
          <!-- Trees -->
          <polygon points="30,155 55,75 80,155" fill="#27AE60"/>
          <rect x="48" y="143" width="14" height="18" fill="#8B6914"/>
          <polygon points="90,155 112,85 134,155" fill="#1E8449"/>
          <rect x="106" y="143" width="12" height="16" fill="#8B6914"/>
          <polygon points="170,155 198,65 226,155" fill="#27AE60"/>
          <rect x="190" y="140" width="16" height="20" fill="#8B6914"/>
          <polygon points="245,155 268,78 291,155" fill="#1E8449"/>
          <rect x="261" y="142" width="14" height="18" fill="#8B6914"/>
          <!-- Stones path -->
          <ellipse cx="155" cy="195" rx="70" ry="14" fill="#C4A44A" opacity="0.5"/>
          <!-- Sun -->
          <circle cx="285" cy="38" r="22" fill="#FFD700"/>
          <line x1="285" y1="8" x2="285" y2="14" stroke="#FFD700" stroke-width="2"/>
          <line x1="308" y1="15" x2="304" y2="19" stroke="#FFD700" stroke-width="2"/>
          <line x1="307" y1="62" x2="303" y2="58" stroke="#FFD700" stroke-width="2"/>
          <!-- Clouds -->
          <ellipse cx="80" cy="28" rx="28" ry="11" fill="white" opacity="0.9"/>
          <ellipse cx="93" cy="21" rx="19" ry="13" fill="white" opacity="0.9"/>
          <ellipse cx="67" cy="24" rx="14" ry="9" fill="white" opacity="0.9"/>
          <!-- Flowers -->
          <circle cx="22" cy="158" r="5" fill="#FF6B9D"/>
          <circle cx="34" cy="160" r="4" fill="#FFD700"/>
          <circle cx="295" cy="159" r="5" fill="#9B59B6"/>
          <circle cx="308" cy="157" r="4" fill="#FF6B9D"/>
          <!-- Rabbit -->
          <text x="143" y="175" font-size="18">🐇</text>
          <!-- Mushroom -->
          <text x="112" y="170" font-size="14">🍄</text>
        </svg>`,
      mountain: `
        <svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg" style="width:100%;display:block">
          <rect width="320" height="220" fill="#87CEEB"/>
          <polygon points="0,220 80,50 160,220" fill="#6B7F5E"/>
          <polygon points="70,220 175,25 280,220" fill="#5D7050"/>
          <polygon points="180,220 270,68 320,220" fill="#6B7F5E"/>
          <polygon points="80,50 97,88 63,88" fill="white"/>
          <polygon points="175,25 197,72 153,72" fill="white"/>
          <polygon points="270,68 288,102 252,102" fill="white"/>
          <!-- Ski lift -->
          <line x1="80" y1="50" x2="280" y2="50" stroke="#5D6D7E" stroke-width="2"/>
          <rect x="112" y="42" width="12" height="14" rx="2" fill="#E74C3C"/>
          <rect x="182" y="42" width="12" height="14" rx="2" fill="#E74C3C"/>
          <rect x="252" y="42" width="12" height="14" rx="2" fill="#E74C3C"/>
          <!-- Skier -->
          <text x="148" y="188" font-size="22">⛷️</text>
          <!-- Flag -->
          <line x1="50" y1="100" x2="50" y2="160" stroke="#E74C3C" stroke-width="2"/>
          <polygon points="50,100 50,120 72,110" fill="#E74C3C"/>
        </svg>`,
      restaurant: `
        <svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg" style="width:100%;display:block">
          <rect width="320" height="220" fill="#FAD7A0"/>
          <rect x="10" y="10" width="300" height="200" rx="8" fill="#FDEBD0"/>
          <!-- Window with mountain view -->
          <rect x="90" y="18" width="140" height="70" rx="4" fill="#87CEEB" stroke="#8B6914" stroke-width="3"/>
          <polygon points="100,88 160,38 220,88" fill="#6B7F5E"/>
          <polygon points="118,60 160,38 202,60" fill="white" opacity="0.7"/>
          <!-- Tables -->
          <rect x="25" y="105" width="65" height="38" rx="4" fill="#A07040"/>
          <rect x="128" y="105" width="65" height="38" rx="4" fill="#A07040"/>
          <rect x="232" y="105" width="65" height="38" rx="4" fill="#A07040"/>
          <!-- Chairs -->
          <rect x="30" y="148" width="20" height="14" rx="3" fill="#7A5030"/>
          <rect x="62" y="148" width="20" height="14" rx="3" fill="#7A5030"/>
          <!-- Food -->
          <text x="42" y="128" font-size="18">🍜</text>
          <text x="146" y="128" font-size="18">🧀</text>
          <text x="250" y="128" font-size="18">🍰</text>
          <!-- Menu board -->
          <rect x="248" y="12" width="55" height="70" rx="4" fill="#3D2B1A"/>
          <text x="275" y="32" text-anchor="middle" font-size="7" fill="#FFD700">MENÜ</text>
          <line x1="255" y1="38" x2="298" y2="38" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
          <text x="275" y="50" text-anchor="middle" font-size="6" fill="white">Rösti 12.-</text>
          <text x="275" y="60" text-anchor="middle" font-size="6" fill="white">Fondue 18.-</text>
          <text x="275" y="70" text-anchor="middle" font-size="6" fill="white">Kuchen 8.-</text>
        </svg>`,
      snow: `
        <svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg" style="width:100%;display:block">
          <rect width="320" height="220" fill="#E8F4FD"/>
          <ellipse cx="160" cy="195" rx="165" ry="40" fill="white"/>
          <!-- Snowman -->
          <circle cx="80" cy="175" r="22" fill="white" stroke="#BDC3C7" stroke-width="1.5"/>
          <circle cx="80" cy="140" r="15" fill="white" stroke="#BDC3C7" stroke-width="1.5"/>
          <circle cx="75" cy="137" r="2.5" fill="#2C3E50"/>
          <circle cx="85" cy="137" r="2.5" fill="#2C3E50"/>
          <path d="M77,143 Q80,147 83,143" fill="none" stroke="#E74C3C" stroke-width="1.5"/>
          <!-- Carrot nose -->
          <polygon points="80,140 92,143 80,146" fill="#E67E22"/>
          <!-- Hat -->
          <rect x="67" y="118" width="26" height="18" fill="#2C3E50"/>
          <rect x="62" y="133" width="36" height="5" rx="2" fill="#2C3E50"/>
          <!-- Trees with snow -->
          <polygon points="185,200 210,120 235,200" fill="#27AE60"/>
          <polygon points="185,165 210,120 235,165" fill="white" opacity="0.8"/>
          <polygon points="255,200 278,130 301,200" fill="#1E8449"/>
          <polygon points="255,168 278,130 301,168" fill="white" opacity="0.8"/>
          <!-- Snowflakes -->
          <text x="22" y="52" font-size="20">❄️</text>
          <text x="82" y="32" font-size="14">❄️</text>
          <text x="198" y="48" font-size="20">❄️</text>
          <text x="278" y="26" font-size="14">❄️</text>
          <text x="145" y="68" font-size="10">❄️</text>
          <!-- Igloo -->
          <path d="M115,200 Q115,168 145,168 Q175,168 175,200" fill="white" stroke="#BDC3C7" stroke-width="1.5"/>
          <rect x="127" y="183" width="18" height="18" rx="2" fill="#87CEEB" opacity="0.6"/>
        </svg>`,
      ski: `
        <svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg" style="width:100%;display:block">
          <rect width="320" height="220" fill="#87CEEB"/>
          <polygon points="0,0 320,0 320,220 0,200" fill="white"/>
          <!-- Slope lines (ski tracks) -->
          <line x1="40" y1="30" x2="200" y2="210" stroke="#D0E8F0" stroke-width="2" opacity="0.6"/>
          <line x1="80" y1="30" x2="240" y2="210" stroke="#D0E8F0" stroke-width="2" opacity="0.6"/>
          <!-- Race gates -->
          <line x1="85" y1="45" x2="85" y2="130" stroke="#E74C3C" stroke-width="2.5"/>
          <polygon points="85,45 85,72 112,58" fill="#E74C3C"/>
          <line x1="200" y1="80" x2="200" y2="168" stroke="#2980B9" stroke-width="2.5"/>
          <polygon points="200,80 200,108 228,94" fill="#2980B9"/>
          <!-- Skier 1 -->
          <text x="42" y="82" font-size="22">⛷️</text>
          <!-- Skier 2 -->
          <text x="142" y="148" font-size="22">🎿</text>
          <!-- Finish line -->
          <rect x="0" y="193" width="320" height="27" fill="#2C3E50" opacity="0.8"/>
          <text x="118" y="212" fill="white" font-family="Arial" font-size="13" font-weight="bold">🏁 ZIEL 🏁</text>
          <!-- Mountain peaks in back -->
          <polygon points="260,0 295,65 230,65" fill="#6B7F5E" opacity="0.35"/>
          <polygon points="290,0 320,55 260,55" fill="#5D7050" opacity="0.35"/>
          <!-- Helicopter (hidden logo spot helper) -->
          <text x="252" y="38" font-size="14">🚁</text>
        </svg>`,
    };
    return scenes[theme] || scenes.forest;
  },

  _tapLogo(index) {
    const c = this.current;
    if (c.foundSet.has(index)) return;

    c.foundSet.add(index);
    c.logos[index].found = true;
    c.found++;

    // Light up star
    const star = document.getElementById(`star-${c.found - 1}`);
    if (star) {
      star.style.filter = 'none';
      star.style.animation = 'starPop 0.5s';
    }

    document.getElementById('search-hint').textContent = `✅ VfB-Wappen gefunden! (${c.found}/5)`;

    this._render();

    if (c.found >= c.total) {
      setTimeout(() => this._showResult(), 600);
    }
  },

  _handleMiss(event) {
    const c = this.current;
    // Don't count if clicking on a logo spot
    if (event.target.closest('[id^="logo-spot-"]')) return;
    c.errors++;
    const hint = document.getElementById('search-hint');
    if (hint) hint.textContent = '❌ Nicht hier... such weiter!';
    setTimeout(() => {
      if (document.getElementById('search-hint') && c.found < c.total)
        document.getElementById('search-hint').textContent = c.found > 0 ? `✅ ${c.found}/5 gefunden!` : '';
    }, 1000);
    // Re-render to update error count
    const errEl = document.querySelector('#game-area > div > div:last-of-type');
    if (errEl) errEl.textContent = `Fehlklicks: ${c.errors}`;
  },

  _showResult() {
    const c = this.current;
    const timeMs = Date.now() - c.startTime;
    const timeSec = Math.round(timeMs / 1000);
    const rawScore = 100;
    const finalScore = State.calcFinalScore({ rawScore, timeMs, errors: c.errors, passed: true });

    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center;padding:20px 0">
        <div style="font-size:3.5rem">🔍🏆</div>
        <div style="font-family:'Fredoka One',cursive;font-size:1.8rem;color:var(--mountain-dark);margin:12px 0">
          Alle VfB-Wappen gefunden!
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:12px 0">
          <div style="background:#F0F9FF;border-radius:10px;padding:10px;font-size:0.8rem">
            <div style="font-size:1.2rem">⏱</div><b>${timeSec}s</b><br><span style="color:var(--text-mid)">Zeit</span>
          </div>
          <div style="background:#FFF5F5;border-radius:10px;padding:10px;font-size:0.8rem">
            <div style="font-size:1.2rem">❌</div><b>${c.errors}</b><br><span style="color:var(--text-mid)">Fehlklicks</span>
          </div>
          <div style="background:#FFFFF0;border-radius:10px;padding:10px;font-size:0.8rem">
            <div style="font-size:1.2rem">⭐</div><b>${finalScore}</b><br><span style="color:var(--text-mid)">Punkte</span>
          </div>
        </div>
        <button class="btn btn-primary btn-full" onclick="SearchGame._finish(${finalScore},${timeMs},${c.errors})">Weiter ➜</button>
      </div>
    `;
  },

  _finish(score, timeMs, errors) {
    if (this.current?.onComplete) {
      this.current.onComplete({ rawScore: score, timeMs, errors, passed: true });
    }
  }
};

window.SearchGame = SearchGame;
