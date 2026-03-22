/**
 * games/differences.js — Unterschiede finden
 * 2 Bilder, 5 Unterschiede per Klick markieren
 */

const DifferencesGame = {
  current: null,

  start(config) {
    const { worldId = 1, theme = 'forest', onComplete } = config;
    const scene = this._getScene(theme);
    this.current = {
      scene,
      foundLeft: new Set(),
      foundRight: new Set(),
      total: 5,
      found: 0,
      startTime: Date.now(),
      onComplete,
    };
    this._render();
  },

  _getScene(theme) {
    // Each scene has base SVG + differences (positions where right image differs)
    const scenes = {
      forest: {
        title: 'Im Wald — Was ist anders?',
        differences: [
          { id: 0, rx: 72, ry: 25, label: 'Sonne fehlt' },
          { id: 1, rx: 18, ry: 45, label: 'Blume andere Farbe' },
          { id: 2, rx: 50, ry: 70, label: 'Stein weg' },
          { id: 3, rx: 85, ry: 60, label: 'Vogel weg' },
          { id: 4, rx: 35, ry: 20, label: 'Wolke anders' },
        ],
      },
      mountain: {
        title: 'Am Berg — Was ist anders?',
        differences: [
          { id: 0, rx: 60, ry: 20, label: 'Adler fehlt' },
          { id: 1, rx: 25, ry: 50, label: 'Ski-Gondel fehlt' },
          { id: 2, rx: 80, ry: 65, label: 'Snowboarder fehlt' },
          { id: 3, rx: 45, ry: 80, label: 'Spur weg' },
          { id: 4, rx: 15, ry: 30, label: 'Schneeflocke fehlt' },
        ],
      },
      restaurant: {
        title: 'Im Restaurant — Was ist anders?',
        differences: [
          { id: 0, rx: 70, ry: 25, label: 'Bild an Wand fehlt' },
          { id: 1, rx: 20, ry: 55, label: 'Stuhl fehlt' },
          { id: 2, rx: 50, ry: 75, label: 'Teller anders' },
          { id: 3, rx: 85, ry: 45, label: 'Glas fehlt' },
          { id: 4, rx: 35, ry: 30, label: 'Pflanze fehlt' },
        ],
      },
      snow: {
        title: 'Im Schnee — Was ist anders?',
        differences: [
          { id: 0, rx: 65, ry: 20, label: 'Schneeflocke fehlt' },
          { id: 1, rx: 20, ry: 40, label: 'Baum fehlt' },
          { id: 2, rx: 48, ry: 55, label: 'Schneemann-Knopf fehlt' },
          { id: 3, rx: 82, ry: 70, label: 'Fußspur fehlt' },
          { id: 4, rx: 30, ry: 75, label: 'Iglu fehlt' },
        ],
      },
      ski: {
        title: 'Auf der Piste — Was ist anders?',
        differences: [
          { id: 0, rx: 55, ry: 15, label: 'Flagge fehlt' },
          { id: 1, rx: 25, ry: 40, label: 'Skifahrer fehlt' },
          { id: 2, rx: 75, ry: 55, label: 'Tor anders' },
          { id: 3, rx: 40, ry: 72, label: 'Spur fehlt' },
          { id: 4, rx: 88, ry: 30, label: 'Hubschrauber fehlt' },
        ],
      },
    };
    return scenes[theme] || scenes.forest;
  },

  _render() {
    const c = this.current;
    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center;font-size:0.85rem;color:var(--text-mid);margin-bottom:10px">
        ${c.scene.title} — Tippe auf den Unterschied!
      </div>

      <!-- Found stars -->
      <div style="display:flex;gap:8px;justify-content:center;margin-bottom:10px">
        ${Array.from({length: 5}, (_, i) => 
          `<span id="diff-star-${i}" style="font-size:1.4rem;filter:grayscale(1);transition:filter 0.3s">⭐</span>`
        ).join('')}
      </div>

      <!-- Two images side by side -->
      <div class="diff-container">
        <!-- Left image (original) -->
        <div class="diff-img-wrap" id="diff-left" onclick="DifferencesGame._handleLeftClick(event)">
          ${this._buildSVG(false, c.scene)}
          <div style="position:absolute;top:4px;left:4px;background:rgba(0,0,0,0.5);color:white;font-size:0.7rem;padding:2px 8px;border-radius:8px">Bild 1</div>
        </div>
        <!-- Right image (with differences) -->
        <div class="diff-img-wrap" id="diff-right" onclick="DifferencesGame._handleRightClick(event)">
          ${this._buildSVG(true, c.scene)}
          <div style="position:absolute;top:4px;left:4px;background:rgba(0,0,0,0.5);color:white;font-size:0.7rem;padding:2px 8px;border-radius:8px">Bild 2</div>
        </div>
      </div>
      <div id="diff-hint" style="text-align:center;font-size:0.85rem;color:var(--text-mid);margin-top:8px;min-height:20px"></div>
    `;
  },

  _buildSVG(withDifferences, scene) {
    const w = 140, h = 110;
    // Build a nature scene - differences are hidden elements
    const diffIds = scene.differences.map(d => d.id);

    return `
      <svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="width:100%;display:block">
        <!-- Sky -->
        <rect width="${w}" height="${h}" fill="#87CEEB"/>
        <!-- Ground -->
        <rect y="${h*0.65}" width="${w}" height="${h*0.35}" fill="#7BC47F"/>
        <!-- Mountain -->
        <polygon points="${w*0.3},${h*0.65} ${w*0.5},${h*0.15} ${w*0.7},${h*0.65}" fill="#6B7F5E"/>
        <polygon points="${w*0.38},${h*0.38} ${w*0.5},${h*0.15} ${w*0.62},${h*0.38}" fill="white"/>
        
        <!-- Sun (difference 0: missing in right image if with-diff) -->
        ${(!withDifferences || !diffIds.includes(0)) ? `
          <circle cx="${w*0.82}" cy="${h*0.18}" r="${h*0.1}" fill="#FFD700"/>
          <circle cx="${w*0.82}" cy="${h*0.18}" r="${h*0.07}" fill="#FFF176"/>
        ` : ''}

        <!-- Left tree -->
        <polygon points="${w*0.08},${h*0.65} ${w*0.16},${h*0.35} ${w*0.24},${h*0.65}" fill="#27AE60"/>
        <rect x="${w*0.14}" y="${h*0.58}" width="${w*0.04}" height="${h*0.12}" fill="#8B6914"/>

        <!-- Right tree -->
        <polygon points="${w*0.76},${h*0.65} ${w*0.84},${h*0.38} ${w*0.92},${h*0.65}" fill="#1E8449"/>
        <rect x="${w*0.82}" y="${h*0.58}" width="${w*0.04}" height="${h*0.1}" fill="#8B6914"/>

        <!-- Flower (difference 1: color change) -->
        <circle cx="${w*0.15}" cy="${h*0.7}" r="${h*0.04}" fill="${withDifferences && diffIds.includes(1) ? '#FF6B9D' : '#FFD700'}"/>
        <circle cx="${w*0.85}" cy="${h*0.72}" r="${h*0.03}" fill="#FF6B9D"/>

        <!-- Cloud (difference 4: shape/position) -->
        ${(!withDifferences || !diffIds.includes(4)) ? `
          <ellipse cx="${w*0.3}" cy="${h*0.15}" rx="${w*0.12}" ry="${h*0.07}" fill="white" opacity="0.9"/>
          <ellipse cx="${w*0.37}" cy="${h*0.1}" rx="${w*0.09}" ry="${h*0.07}" fill="white" opacity="0.9"/>
        ` : `
          <ellipse cx="${w*0.3}" cy="${h*0.15}" rx="${w*0.08}" ry="${h*0.05}" fill="white" opacity="0.9"/>
        `}

        <!-- Bird (difference 3: missing in right) -->
        ${(!withDifferences || !diffIds.includes(3)) ? `
          <text x="${w*0.78}" y="${h*0.35}" font-size="${h*0.1}">🦅</text>
        ` : ''}

        <!-- Stone (difference 2: missing in right) -->
        ${(!withDifferences || !diffIds.includes(2)) ? `
          <ellipse cx="${w*0.5}" cy="${h*0.78}" rx="${w*0.06}" ry="${h*0.04}" fill="#95A5A6"/>
        ` : ''}

        <!-- Path -->
        <ellipse cx="${w*0.5}" cy="${h*0.9}" rx="${w*0.2}" ry="${h*0.06}" fill="#D4A04A" opacity="0.5"/>
      </svg>
    `;
  },

  _handleLeftClick(event) {
    this._processClick(event, 'left');
  },
  _handleRightClick(event) {
    this._processClick(event, 'right');
  },

  _processClick(event, side) {
    const c = this.current;
    const wrap = document.getElementById(`diff-${side}`);
    if (!wrap) return;

    const rect = wrap.getBoundingClientRect();
    const xPct = ((event.clientX - rect.left) / rect.width) * 100;
    const yPct = ((event.clientY - rect.top) / rect.height) * 100;

    // Check if near a difference
    const HIT_RADIUS = 15;
    let hit = null;
    for (const diff of c.scene.differences) {
      const dist = Math.hypot(xPct - diff.rx, yPct - diff.ry);
      if (dist < HIT_RADIUS) { hit = diff; break; }
    }

    if (hit && !c.foundLeft.has(hit.id)) {
      // Found a difference!
      c.foundLeft.add(hit.id);
      c.foundRight.add(hit.id);
      c.found++;

      // Draw circles on both images
      this._drawCircle('diff-left', hit.rx, hit.ry, hit.id, true);
      this._drawCircle('diff-right', hit.rx, hit.ry, hit.id, true);

      // Light up star
      const star = document.getElementById(`diff-star-${c.found - 1}`);
      if (star) { star.style.filter = 'none'; star.style.animation = 'starPop 0.5s'; }

      document.getElementById('diff-hint').textContent = `✅ ${hit.label}! (${c.found}/5)`;

      if (c.found >= c.total) {
        setTimeout(() => this._showResult(), 700);
      }
    } else if (!hit) {
      // Misclick
      this._drawCircle(`diff-${side}`, xPct, yPct, `miss-${Date.now()}`, false);
      document.getElementById('diff-hint').textContent = '❌ Nicht hier... such weiter!';
      setTimeout(() => {
        if (document.getElementById('diff-hint'))
          document.getElementById('diff-hint').textContent = '';
      }, 1200);
    }
  },

  _drawCircle(wrapperId, xPct, yPct, id, confirmed) {
    const wrap = document.getElementById(wrapperId);
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const circle = document.createElement('div');
    circle.className = `diff-circle${confirmed ? ' confirmed' : ''}`;
    circle.id = `circle-${wrapperId}-${id}`;
    circle.style.left = `${xPct}%`;
    circle.style.top = `${yPct}%`;
    circle.style.marginLeft = '-21px';
    circle.style.marginTop = '-21px';
    wrap.appendChild(circle);

    if (!confirmed) {
      setTimeout(() => circle.remove(), 1000);
    }
  },

  _showResult() {
    const c = this.current;
    const seconds = Math.round((Date.now() - c.startTime) / 1000);
    const score = Math.max(50, 100 - Math.floor(seconds / 8) * 5);

    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center;padding:20px 0">
        <div style="font-size:3.5rem">🖼️✨</div>
        <div style="font-family:'Fredoka One',cursive;font-size:1.8rem;color:var(--mountain-dark);margin:12px 0">
          Alle 5 Unterschiede!
        </div>
        <div style="color:var(--text-mid);margin-bottom:8px">In ${seconds} Sekunden</div>
        <div class="score-badge" style="display:inline-flex;margin:12px auto">⭐ ${score} Punkte</div>
        <br><br>
        <button class="btn btn-primary btn-full" onclick="DifferencesGame._finish(${score})">Weiter ➜</button>
      </div>
    `;
  },

  _finish(score) {
    if (this.current.onComplete) {
      this.current.onComplete({ score, passed: true });
    }
  }
};

window.DifferencesGame = DifferencesGame;
