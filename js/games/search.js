/**
 * games/search.js — VfB Logo Suchspiel
 * 5 versteckte VfB-Logos in einer SVG-Szene finden
 */

const SearchGame = {
  current: null,

  start(config) {
    const { worldId = 1, theme = 'forest', onComplete } = config;
    this.current = {
      worldId,
      theme,
      found: 0,
      total: 5,
      logos: this._getLogoPositions(theme),
      foundSet: new Set(),
      startTime: Date.now(),
      onComplete,
    };
    this._render();
  },

  // Logo-Positionen je nach Welt-Thema (prozentual)
  _getLogoPositions(theme) {
    const positions = {
      forest: [
        { x: 18, y: 22, hint: 'hinter einem Baum' },
        { x: 72, y: 45, hint: 'im Gebüsch' },
        { x: 38, y: 68, hint: 'auf dem Stein' },
        { x: 85, y: 20, hint: 'am Himmel' },
        { x: 52, y: 82, hint: 'auf dem Weg' },
      ],
      mountain: [
        { x: 15, y: 30, hint: 'am Gipfel' },
        { x: 60, y: 15, hint: 'in der Wolke' },
        { x: 80, y: 55, hint: 'am Skilift' },
        { x: 35, y: 75, hint: 'im Schnee' },
        { x: 90, y: 80, hint: 'am Hang' },
      ],
      restaurant: [
        { x: 20, y: 20, hint: 'auf der Speisekarte' },
        { x: 70, y: 35, hint: 'am Fenster' },
        { x: 45, y: 60, hint: 'auf dem Tisch' },
        { x: 85, y: 75, hint: 'an der Wand' },
        { x: 10, y: 80, hint: 'auf dem Boden' },
      ],
      snow: [
        { x: 25, y: 18, hint: 'im Schneeball' },
        { x: 65, y: 30, hint: 'hinter dem Baum' },
        { x: 42, y: 55, hint: 'am Schneemann' },
        { x: 80, y: 65, hint: 'auf der Spur' },
        { x: 15, y: 72, hint: 'unter dem Schnee' },
      ],
      ski: [
        { x: 30, y: 15, hint: 'am Start' },
        { x: 75, y: 28, hint: 'auf der Flagge' },
        { x: 20, y: 55, hint: 'auf der Piste' },
        { x: 60, y: 68, hint: 'am Ziel' },
        { x: 88, y: 45, hint: 'auf dem Hang' },
      ],
    };
    return positions[theme] || positions.forest;
  },

  _render() {
    const c = this.current;
    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center;margin-bottom:10px">
        <div style="font-size:0.9rem;color:var(--text-mid)">Finde alle 5 versteckten VfB-Logos! 🔍</div>
      </div>
      
      <!-- Found counter -->
      <div class="found-counter" style="margin-bottom:12px">
        ${Array.from({length: 5}, (_, i) => 
          `<span class="found-star" id="star-${i}">⭐</span>`
        ).join('')}
      </div>

      <!-- Search scene -->
      <div class="search-scene" id="search-scene" onclick="SearchGame._handleClick(event)">
        ${this._getSceneSVG(c.theme)}
        ${c.logos.map((logo, i) => `
          <div id="logo-${i}" class="vfb-marker" 
               style="left:calc(${logo.x}% - 20px);top:calc(${logo.y}% - 20px);"
               onclick="SearchGame._tapLogo(event, ${i})">
          </div>
        `).join('')}
      </div>

      <div id="hint-text" style="text-align:center;margin-top:10px;font-size:0.9rem;color:var(--text-mid);min-height:24px"></div>
    `;

    // Grayscale stars initially
    document.querySelectorAll('.found-star').forEach(s => s.style.filter = 'grayscale(1)');
  },

  _getSceneSVG(theme) {
    const scenes = {
      forest: `
        <svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg" style="width:100%;display:block;border-radius:14px">
          <rect width="320" height="220" fill="#87CEEB"/>
          <rect y="150" width="320" height="70" fill="#7BC47F"/>
          <!-- Trees -->
          <polygon points="40,150 70,60 100,150" fill="#27AE60"/><rect x="62" y="140" width="16" height="20" fill="#8B6914"/>
          <polygon points="100,150 125,80 150,150" fill="#1E8449"/><rect x="117" y="140" width="16" height="18" fill="#8B6914"/>
          <polygon points="180,150 210,55 240,150" fill="#27AE60"/><rect x="202" y="138" width="16" height="22" fill="#8B6914"/>
          <polygon points="255,150 280,75 305,150" fill="#1E8449"/><rect x="272" y="138" width="16" height="20" fill="#8B6914"/>
          <!-- Path -->
          <ellipse cx="160" cy="200" rx="80" ry="20" fill="#D4A04A" opacity="0.6"/>
          <!-- Flowers -->
          <circle cx="20" cy="155" r="5" fill="#FF6B9D"/><circle cx="35" cy="158" r="4" fill="#FFD700"/>
          <circle cx="290" cy="157" r="5" fill="#9B59B6"/><circle cx="310" cy="155" r="4" fill="#FF6B9D"/>
          <!-- Sun -->
          <circle cx="290" cy="40" r="22" fill="#FFD700"/>
          <!-- Clouds -->
          <ellipse cx="80" cy="30" rx="30" ry="12" fill="white" opacity="0.9"/>
          <ellipse cx="95" cy="22" rx="20" ry="14" fill="white" opacity="0.9"/>
          <ellipse cx="65" cy="25" rx="15" ry="10" fill="white" opacity="0.9"/>
        </svg>
      `,
      mountain: `
        <svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg" style="width:100%;display:block;border-radius:14px">
          <rect width="320" height="220" fill="#87CEEB"/>
          <polygon points="0,220 80,50 160,220" fill="#6B7F5E"/>
          <polygon points="80,220 180,30 280,220" fill="#5D7050"/>
          <polygon points="180,220 270,70 320,220" fill="#6B7F5E"/>
          <!-- Snow -->
          <polygon points="80,50 95,85 65,85" fill="white"/>
          <polygon points="180,30 200,70 160,70" fill="white"/>
          <polygon points="270,70 285,100 255,100" fill="white"/>
          <!-- Ski lift -->
          <line x1="80" y1="50" x2="280" y2="50" stroke="#5D6D7E" stroke-width="2"/>
          <rect x="115" y="40" width="12" height="16" rx="2" fill="#E74C3C"/>
          <rect x="185" y="40" width="12" height="16" rx="2" fill="#E74C3C"/>
          <rect x="255" y="40" width="12" height="16" rx="2" fill="#E74C3C"/>
          <!-- Skier -->
          <text x="150" y="185" font-size="24">⛷️</text>
        </svg>
      `,
      restaurant: `
        <svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg" style="width:100%;display:block;border-radius:14px">
          <rect width="320" height="220" fill="#F5CBA7"/>
          <!-- Restaurant interior -->
          <rect x="10" y="10" width="300" height="200" rx="8" fill="#FAD7A0"/>
          <!-- Tables -->
          <rect x="30" y="100" width="60" height="40" rx="4" fill="#8B6914"/>
          <rect x="130" y="100" width="60" height="40" rx="4" fill="#8B6914"/>
          <rect x="230" y="100" width="60" height="40" rx="4" fill="#8B6914"/>
          <!-- Chairs -->
          <rect x="35" y="148" width="20" height="15" rx="3" fill="#5D4037"/>
          <rect x="65" y="148" width="20" height="15" rx="3" fill="#5D4037"/>
          <!-- Food -->
          <text x="45" y="125" font-size="18">🍜</text>
          <text x="148" y="125" font-size="18">🧀</text>
          <text x="248" y="125" font-size="18">🍰</text>
          <!-- Window -->
          <rect x="100" y="20" width="120" height="60" rx="4" fill="#87CEEB" opacity="0.7" stroke="#8B6914" stroke-width="2"/>
          <text x="130" y="60" font-size="30">🏔️</text>
        </svg>
      `,
      snow: `
        <svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg" style="width:100%;display:block;border-radius:14px">
          <rect width="320" height="220" fill="#E8F4FD"/>
          <ellipse cx="160" cy="180" rx="160" ry="50" fill="white"/>
          <!-- Snowman -->
          <circle cx="160" cy="170" r="25" fill="white" stroke="#BDC3C7" stroke-width="1"/>
          <circle cx="160" cy="130" r="18" fill="white" stroke="#BDC3C7" stroke-width="1"/>
          <circle cx="155" cy="127" r="3" fill="#2C3E50"/>
          <circle cx="165" cy="127" r="3" fill="#2C3E50"/>
          <circle cx="160" cy="134" r="2" fill="#E74C3C"/>
          <!-- Trees with snow -->
          <polygon points="30,180 55,100 80,180" fill="#27AE60"/><polygon points="30,140 55,100 80,140" fill="white" opacity="0.7"/>
          <polygon points="240,180 265,100 290,180" fill="#1E8449"/><polygon points="240,140 265,100 290,140" fill="white" opacity="0.7"/>
          <!-- Snowflakes -->
          <text x="20" y="50" font-size="20">❄️</text>
          <text x="80" y="30" font-size="14">❄️</text>
          <text x="200" y="45" font-size="20">❄️</text>
          <text x="280" y="25" font-size="14">❄️</text>
        </svg>
      `,
      ski: `
        <svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg" style="width:100%;display:block;border-radius:14px">
          <rect width="320" height="220" fill="#87CEEB"/>
          <!-- Slope -->
          <polygon points="0,0 320,0 320,220 0,200" fill="white"/>
          <!-- Race flags -->
          <line x1="80" y1="40" x2="80" y2="130" stroke="#E74C3C" stroke-width="2"/>
          <polygon points="80,40 80,70 110,55" fill="#E74C3C"/>
          <line x1="200" y1="80" x2="200" y2="170" stroke="#2980B9" stroke-width="2"/>
          <polygon points="200,80 200,110 230,95" fill="#2980B9"/>
          <!-- Skier -->
          <text x="40" y="80" font-size="24">⛷️</text>
          <text x="140" y="140" font-size="24">🎿</text>
          <!-- Finish line -->
          <rect x="0" y="190" width="320" height="30" fill="#2C3E50" opacity="0.7"/>
          <text x="120" y="212" fill="white" font-family="Arial" font-size="14" font-weight="bold">🏁 ZIEL 🏁</text>
          <!-- Mountain peaks -->
          <polygon points="270,0 300,60 240,60" fill="#6B7F5E" opacity="0.4"/>
        </svg>
      `,
    };
    return scenes[theme] || scenes.forest;
  },

  _tapLogo(event, index) {
    event.stopPropagation();
    const c = this.current;
    if (c.foundSet.has(index)) return;

    c.foundSet.add(index);
    c.found++;

    const el = document.getElementById(`logo-${index}`);
    if (el) {
      el.classList.add('found');
      el.innerHTML = '<div style="text-align:center;font-size:18px;line-height:36px">⚽</div>';
    }

    // Light up star
    const star = document.getElementById(`star-${c.found - 1}`);
    if (star) {
      star.classList.add('lit');
      star.style.filter = 'none';
    }

    document.getElementById('hint-text').textContent = `✅ Gefunden! (${c.found}/5)`;

    if (c.found >= c.total) {
      setTimeout(() => this._showResult(), 600);
    }
  },

  _handleClick(event) {
    // Misclick — no penalty, just feedback
    const hint = document.getElementById('hint-text');
    if (hint) {
      hint.textContent = '🔍 Nicht hier... such weiter!';
      setTimeout(() => {
        if (hint) hint.textContent = '';
      }, 1000);
    }
  },

  _showResult() {
    const c = this.current;
    const seconds = Math.round((Date.now() - c.startTime) / 1000);
    const score = Math.max(40, 100 - Math.floor(seconds / 10) * 5);

    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center;padding:20px 0">
        <div style="font-size:3.5rem">🔍🏆</div>
        <div style="font-family:'Fredoka One',cursive;font-size:1.8rem;color:var(--mountain-dark);margin:12px 0">
          Alle VfB-Logos gefunden!
        </div>
        <div style="color:var(--text-mid);margin-bottom:8px">In ${seconds} Sekunden!</div>
        <div class="score-badge" style="display:inline-flex;margin:12px auto">⭐ ${score} Punkte</div>
        <br><br>
        <button class="btn btn-primary btn-full" onclick="SearchGame._finish(${score})">Weiter ➜</button>
      </div>
    `;
  },

  _finish(score) {
    if (this.current.onComplete) {
      this.current.onComplete({ score, passed: true });
    }
  }
};

window.SearchGame = SearchGame;
