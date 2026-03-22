/**
 * games/differences.js v2 — Unterschiede finden
 * Zeiterfassung & Fehlerstrafe
 */

const DifferencesGame = {
  current: null,

  start(config) {
    const { worldId = 1, theme = 'forest', onComplete } = config;
    const scene = this._getScene(theme);
    this.current = {
      scene, worldId,
      foundIds: new Set(),
      total: 5, found: 0,
      errors: 0,
      startTime: Date.now(),
      onComplete,
    };
    this._render();
  },

  _getScene(theme) {
    const scenes = {
      forest: {
        title: 'Im Wald — Was ist anders?',
        differences: [
          { id: 0, rx: 82, ry: 18, label: 'Sonne fehlt' },
          { id: 1, rx: 15, ry: 68, label: 'Blume andere Farbe' },
          { id: 2, rx: 50, ry: 78, label: 'Stein weg' },
          { id: 3, rx: 78, ry: 55, label: 'Vogel weg' },
          { id: 4, rx: 32, ry: 22, label: 'Wolke fehlt' },
        ],
      },
      mountain: {
        title: 'Am Berg — Was ist anders?',
        differences: [
          { id: 0, rx: 60, ry: 18, label: 'Adler fehlt' },
          { id: 1, rx: 22, ry: 48, label: 'Gondel fehlt' },
          { id: 2, rx: 78, ry: 62, label: 'Skifahrer weg' },
          { id: 3, rx: 42, ry: 78, label: 'Spur weg' },
          { id: 4, rx: 12, ry: 28, label: 'Schneeflocke fehlt' },
        ],
      },
      restaurant: {
        title: 'Im Restaurant — Was ist anders?',
        differences: [
          { id: 0, rx: 72, ry: 28, label: 'Bild fehlt' },
          { id: 1, rx: 18, ry: 58, label: 'Stuhl fehlt' },
          { id: 2, rx: 50, ry: 72, label: 'Teller anders' },
          { id: 3, rx: 85, ry: 45, label: 'Glas fehlt' },
          { id: 4, rx: 35, ry: 32, label: 'Pflanze fehlt' },
        ],
      },
      snow: {
        title: 'Im Schnee — Was ist anders?',
        differences: [
          { id: 0, rx: 65, ry: 18, label: 'Schneeflocke fehlt' },
          { id: 1, rx: 18, ry: 42, label: 'Baum fehlt' },
          { id: 2, rx: 50, ry: 52, label: 'Knopf am Schneemann fehlt' },
          { id: 3, rx: 80, ry: 68, label: 'Spur fehlt' },
          { id: 4, rx: 28, ry: 78, label: 'Iglu fehlt' },
        ],
      },
      ski: {
        title: 'Auf der Piste — Was ist anders?',
        differences: [
          { id: 0, rx: 52, ry: 14, label: 'Flagge fehlt' },
          { id: 1, rx: 22, ry: 38, label: 'Skifahrer fehlt' },
          { id: 2, rx: 75, ry: 52, label: 'Tor anders' },
          { id: 3, rx: 38, ry: 70, label: 'Spur fehlt' },
          { id: 4, rx: 87, ry: 28, label: 'Hubschrauber fehlt' },
        ],
      },
    };
    return scenes[theme] || scenes.forest;
  },

  _render() {
    const c = this.current;
    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center;font-size:0.82rem;color:var(--text-mid);margin-bottom:8px">
        ${c.scene.title}
      </div>
      <div style="display:flex;justify-content:space-between;font-size:0.8rem;color:var(--text-mid);margin-bottom:8px">
        <span>Gefunden: <b>${c.found}/5</b></span>
        <span>⏱ <span id="diff-timer">0s</span></span>
        <span>❌ ${c.errors} Fehlklicks</span>
      </div>
      <!-- Stars -->
      <div style="display:flex;gap:8px;justify-content:center;margin-bottom:10px">
        ${Array.from({length:5},(_,i)=>`<span id="dstar-${i}" style="font-size:1.3rem;filter:${i<c.found?'none':'grayscale(1)'};transition:filter 0.3s">⭐</span>`).join('')}
      </div>
      <!-- Two images -->
      <div class="diff-container">
        <div class="diff-img-wrap" id="diff-left" onclick="DifferencesGame._handleClick(event,'left')">
          ${this._buildSVG(false, c.scene)}
          <div style="position:absolute;top:4px;left:4px;background:rgba(0,0,0,0.5);color:white;font-size:0.65rem;padding:2px 7px;border-radius:6px">Bild 1</div>
          ${this._renderCircles('left', c)}
        </div>
        <div class="diff-img-wrap" id="diff-right" onclick="DifferencesGame._handleClick(event,'right')">
          ${this._buildSVG(true, c.scene)}
          <div style="position:absolute;top:4px;left:4px;background:rgba(0,0,0,0.5);color:white;font-size:0.65rem;padding:2px 7px;border-radius:6px">Bild 2</div>
          ${this._renderCircles('right', c)}
        </div>
      </div>
      <div id="diff-hint" style="text-align:center;font-size:0.82rem;color:var(--text-mid);margin-top:8px;min-height:20px"></div>
    `;

    // Timer
    this._timerInterval = setInterval(() => {
      const el = document.getElementById('diff-timer');
      if (el) el.textContent = Math.round((Date.now() - c.startTime)/1000) + 's';
    }, 1000);
  },

  _renderCircles(side, c) {
    return Array.from(c.foundIds).map(id => {
      const diff = c.scene.differences.find(d => d.id === id);
      if (!diff) return '';
      return `<div class="diff-circle confirmed" style="left:${diff.rx}%;top:${diff.ry}%"></div>`;
    }).join('');
  },

  _buildSVG(withDiff, scene) {
    const diffs = withDiff ? scene.differences.map(d => d.id) : [];
    const w = 140, h = 110;
    return `
      <svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="width:100%;display:block">
        <rect width="${w}" height="${h}" fill="#87CEEB"/>
        <rect y="${h*.65}" width="${w}" height="${h*.35}" fill="#7BC47F"/>
        <polygon points="${w*.3},${h*.65} ${w*.5},${h*.15} ${w*.7},${h*.65}" fill="#6B7F5E"/>
        <polygon points="${w*.38},${h*.38} ${w*.5},${h*.15} ${w*.62},${h*.38}" fill="white"/>
        ${!diffs.includes(0)?`<circle cx="${w*.82}" cy="${h*.18}" r="${h*.1}" fill="#FFD700"/>`:''}
        <polygon points="${w*.08},${h*.65} ${w*.16},${h*.35} ${w*.24},${h*.65}" fill="#27AE60"/>
        <rect x="${w*.14}" y="${h*.58}" width="${w*.04}" height="${h*.12}" fill="#8B6914"/>
        <polygon points="${w*.76},${h*.65} ${w*.84},${h*.38} ${w*.92},${h*.65}" fill="#1E8449"/>
        <rect x="${w*.82}" y="${h*.58}" width="${w*.04}" height="${h*.1}" fill="#8B6914"/>
        <circle cx="${w*.15}" cy="${h*.7}" r="${h*.04}" fill="${withDiff&&diffs.includes(1)?'#FF6B9D':'#FFD700'}"/>
        <circle cx="${w*.85}" cy="${h*.72}" r="${h*.03}" fill="#FF6B9D"/>
        ${!diffs.includes(4)?`
          <ellipse cx="${w*.3}" cy="${h*.15}" rx="${w*.12}" ry="${h*.07}" fill="white" opacity="0.9"/>
          <ellipse cx="${w*.37}" cy="${h*.1}" rx="${w*.09}" ry="${h*.07}" fill="white" opacity="0.9"/>
        `:`<ellipse cx="${w*.3}" cy="${h*.15}" rx="${w*.07}" ry="${h*.05}" fill="white" opacity="0.7"/>`}
        ${!diffs.includes(3)?`<text x="${w*.78}" y="${h*.35}" font-size="${h*.1}">🦅</text>`:''}
        ${!diffs.includes(2)?`<ellipse cx="${w*.5}" cy="${h*.78}" rx="${w*.06}" ry="${h*.04}" fill="#95A5A6"/>`:''}
        <ellipse cx="${w*.5}" cy="${h*.9}" rx="${w*.2}" ry="${h*.06}" fill="#D4A04A" opacity="0.5"/>
      </svg>`;
  },

  _handleClick(event, side) {
    const c = this.current;
    const wrap = document.getElementById(`diff-${side}`);
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const xPct = ((event.clientX - rect.left) / rect.width) * 100;
    const yPct = ((event.clientY - rect.top) / rect.height) * 100;

    const HIT = 14;
    let hit = null;
    for (const diff of c.scene.differences) {
      if (!c.foundIds.has(diff.id) && Math.hypot(xPct - diff.rx, yPct - diff.ry) < HIT) {
        hit = diff; break;
      }
    }

    if (hit) {
      c.foundIds.add(hit.id);
      c.found++;
      const star = document.getElementById(`dstar-${c.found - 1}`);
      if (star) { star.style.filter = 'none'; star.style.animation = 'starPop 0.5s'; }
      document.getElementById('diff-hint').textContent = `✅ ${hit.label}! (${c.found}/5)`;
      this._addCircle('diff-left',  hit.rx, hit.ry, true);
      this._addCircle('diff-right', hit.rx, hit.ry, true);
      if (c.found >= c.total) { clearInterval(this._timerInterval); setTimeout(() => this._showResult(), 700); }
    } else {
      c.errors++;
      this._addCircle(`diff-${side}`, xPct, yPct, false);
      document.getElementById('diff-hint').textContent = '❌ Nicht hier...';
      setTimeout(() => { if(document.getElementById('diff-hint')) document.getElementById('diff-hint').textContent = ''; }, 1000);
      // Update error count
      const errSpan = document.querySelector('#game-area span:last-of-type');
      if(errSpan) errSpan.textContent = `❌ ${c.errors} Fehlklicks`;
    }
  },

  _addCircle(wrapperId, xPct, yPct, confirmed) {
    const wrap = document.getElementById(wrapperId);
    if (!wrap) return;
    const circle = document.createElement('div');
    circle.className = `diff-circle${confirmed ? ' confirmed' : ''}`;
    circle.style.left = `${xPct}%`;
    circle.style.top  = `${yPct}%`;
    wrap.appendChild(circle);
    if (!confirmed) setTimeout(() => circle.remove(), 900);
  },

  _showResult() {
    const c = this.current;
    clearInterval(this._timerInterval);
    const timeMs = Date.now() - c.startTime;
    const finalScore = State.calcFinalScore({ rawScore: 100, timeMs, errors: c.errors, passed: true });

    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center;padding:20px 0">
        <div style="font-size:3rem">🖼️✨</div>
        <div style="font-family:'Fredoka One',cursive;font-size:1.8rem;color:var(--mountain-dark);margin:10px 0">Alle 5 Unterschiede!</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:12px 0">
          <div style="background:#F0F9FF;border-radius:10px;padding:10px;font-size:0.8rem">
            <div style="font-size:1.2rem">⏱</div><b>${Math.round(timeMs/1000)}s</b><br><span style="color:var(--text-mid)">Zeit</span>
          </div>
          <div style="background:#FFF5F5;border-radius:10px;padding:10px;font-size:0.8rem">
            <div style="font-size:1.2rem">❌</div><b>${c.errors}</b><br><span style="color:var(--text-mid)">Fehlklicks</span>
          </div>
          <div style="background:#FFFFF0;border-radius:10px;padding:10px;font-size:0.8rem">
            <div style="font-size:1.2rem">⭐</div><b>${finalScore}</b><br><span style="color:var(--text-mid)">Punkte</span>
          </div>
        </div>
        <button class="btn btn-primary btn-full" onclick="DifferencesGame._finish(${finalScore},${timeMs},${c.errors})">Weiter ➜</button>
      </div>`;
  },

  _finish(score, timeMs, errors) {
    if (this.current?.onComplete) this.current.onComplete({ rawScore: score, timeMs, errors, passed: true });
  },
  _timerInterval: null,
};

window.DifferencesGame = DifferencesGame;
