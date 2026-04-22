/**
 * games/slider.js v2 — Schiebepuzzle
 * Immer 3×3 (8 Felder + 1 leer) — einfach und spielbar
 * Thematischer farbiger Hintergrund je nach Welt
 */

const SliderGame = {
  current: null,
  _timerInterval: null,
  _lastConfig: null,

  // Weltspezifische Farb-Themen
  _themes: {
    1:  { bg:'#EBF5FB', tile:'#2980B9', tileGood:'#1A5276', empty:'#D6EAF8', text:'white', label:'🚗 Anreise' },
    2:  { bg:'#F4ECF7', tile:'#8E44AD', tileGood:'#6C3483', empty:'#E8DAEF', text:'white', label:'🏰 Schloss' },
    3:  { bg:'#E9F7EF', tile:'#27AE60', tileGood:'#1E8449', empty:'#D5F5E3', text:'white', label:'🏊 Pool' },
    4:  { bg:'#FEF9E7', tile:'#E67E22', tileGood:'#CA6F1E', empty:'#FDEBD0', text:'white', label:'🎾 Tennis' },
    5:  { bg:'#FDEDEC', tile:'#E74C3C', tileGood:'#B03A2E', empty:'#FADBD8', text:'white', label:'🎲 Kniffel' },
    6:  { bg:'#E8F8F5', tile:'#16A085', tileGood:'#0E6655', empty:'#D0ECE7', text:'white', label:'🚴 Fahrrad' },
    7:  { bg:'#FEF5E7', tile:'#D35400', tileGood:'#A04000', empty:'#FDEBD0', text:'white', label:'🍽️ Essen' },
    8:  { bg:'#FDEDEC', tile:'#E30613', tileGood:'#8B0000', empty:'#F5CBA7', text:'white', label:'⚽ Fussball' },
    9:  { bg:'#F2F3F4', tile:'#7F8C8D', tileGood:'#2C3E50', empty:'#D5D8DC', text:'white', label:'🧳 Packen' },
    10: { bg:'#EBF5FB', tile:'#2C3E50', tileGood:'#1A252F', empty:'#AED6F1', text:'white', label:'🏠 Heimreise' },
  },

  _getEmojis(worldId) {
    const sets = {
      1:  ['🚗','🗺️','⛽','🚦','🎒','🏔️','🌲','🌸'],
      2:  ['🏰','👑','⚔️','🛡️','🗝️','🕯️','🦅','🌹'],
      3:  ['🏊','🌞','🏖️','🍦','🐠','🌊','🦀','🐚'],
      4:  ['🎾','🏆','🥎','🏸','⚡','🏅','🎯','🥊'],
      5:  ['🎲','⚀','⚁','⚂','⚃','⚄','⚅','🃏'],
      6:  ['🚴','🌻','🦋','🌿','🏡','🌸','🍃','🌾'],
      7:  ['🥐','🍷','🧀','🥗','🍰','🥩','🍜','🥨'],
      8:  ['⚽','🏆','🥅','👟','🎽','🏟️','🤾','🥇'],
      9:  ['🧳','👒','👓','📷','🪥','✈️','🌍','🎫'],
      10: ['🏠','🌟','❤️','🎉','🏆','🌈','🥂','🎆'],
    };
    return sets[worldId] || sets[1];
  },

  start(config) {
    const { worldId = 1, onComplete } = config;
    SliderGame._lastConfig = config;
    const SIZE = 3; // Immer 3×3!
    const tiles = this._generatePuzzle(SIZE);
    const theme = this._themes[worldId] || this._themes[1];

    this.current = {
      size: SIZE,
      tiles,
      emojis: this._getEmojis(worldId),
      theme,
      moves: 0,
      errors: 0,
      startTime: Date.now(),
      solved: false,
      onComplete,
    };
    this._render();
  },

  _generatePuzzle(size) {
    const n = size * size;
    let tiles = Array.from({length: n}, (_, i) => i); // 0 = leer
    // Mischen bis lösbar
    do {
      for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
      }
    } while (!this._isSolvable(tiles, size) || this._isSolved(tiles));
    return tiles;
  },

  _isSolvable(tiles, size) {
    const flat = tiles.filter(t => t !== 0);
    let inv = 0;
    for (let i = 0; i < flat.length; i++)
      for (let j = i + 1; j < flat.length; j++)
        if (flat[i] > flat[j]) inv++;
    if (size % 2 === 1) return inv % 2 === 0;
    const emptyRow = Math.floor(tiles.indexOf(0) / size);
    return (inv + emptyRow) % 2 === 1;
  },

  _isSolved(tiles) {
    for (let i = 0; i < tiles.length - 1; i++)
      if (tiles[i] !== i + 1) return false;
    return tiles[tiles.length - 1] === 0;
  },

  _render() {
    const c = this.current;
    const t = c.theme;
    const CELL = 94; // px per Zelle bei 3×3
    const GAP = 6;
    const BOARD = CELL * 3 + GAP * 2;

    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center;background:${t.bg};border-radius:16px;padding:16px">

        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;font-size:0.82rem;color:var(--text-mid)">
          <span style="font-family:'Fredoka One',cursive;font-size:0.9rem">${t.label}</span>
          <span>Züge: <b id="sl-moves">0</b></span>
          <span>⏱ <span id="sl-timer">0s</span></span>
        </div>

        <div style="font-size:0.8rem;color:var(--text-mid);margin-bottom:12px">
          Tippe auf ein Feld neben dem leeren Feld!
          <br>Grün = schon am richtigen Platz ✅
        </div>

        <!-- Puzzle board -->
        <div id="sl-board" style="
          display:grid;
          grid-template-columns:repeat(3,${CELL}px);
          gap:${GAP}px;
          margin:0 auto ${GAP}px;
          width:${BOARD}px;
          background:${t.empty};
          padding:${GAP}px;
          border-radius:14px;
          box-shadow:0 4px 16px rgba(0,0,0,0.12)">
          ${c.tiles.map((tile, i) => this._tileHTML(tile, i, c)).join('')}
        </div>

        <!-- Shuffle button -->
        <button class="btn btn-secondary" onclick="SliderGame._shuffle()" style="font-size:0.88rem;padding:9px 20px;margin-top:8px">
          🔀 Neu mischen
        </button>
      </div>`;

    clearInterval(this._timerInterval);
    this._timerInterval = setInterval(() => {
      const el = document.getElementById('sl-timer');
      if (el) el.textContent = Math.round((Date.now() - c.startTime) / 1000) + 's';
    }, 1000);
  },

  _tileHTML(tile, index, c) {
    const t = c.theme;
    const CELL = 94;
    if (tile === 0) {
      return `<div style="width:${CELL}px;height:${CELL}px;border-radius:12px;background:${t.empty}"></div>`;
    }
    const emoji = c.emojis[tile - 1] || `${tile}`;
    const isCorrect = (index === tile - 1); // richtige Position
    const bg = isCorrect ? t.tileGood : t.tile;
    return `
      <div onclick="SliderGame._tap(${index})"
        style="width:${CELL}px;height:${CELL}px;border-radius:12px;
          background:${bg};
          color:${t.text};
          display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;
          font-size:2.4rem;cursor:pointer;
          box-shadow:0 4px 10px rgba(0,0,0,0.2);
          transition:all 0.15s;
          border:3px solid ${isCorrect ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)'}
          ${isCorrect ? ';transform:scale(0.97)' : ''}">
        ${emoji}
        <span style="font-size:0.6rem;opacity:0.7;font-weight:700">${tile}</span>
      </div>`;
  },

  _tap(index) {
    const c = this.current;
    if (c.solved) return;
    const emptyIdx = c.tiles.indexOf(0);
    const size = c.size;
    const row = Math.floor(index / size), col = index % size;
    const erow = Math.floor(emptyIdx / size), ecol = emptyIdx % size;
    const adjacent = (Math.abs(row-erow) === 1 && col === ecol) || (Math.abs(col-ecol) === 1 && row === erow);

    if (!adjacent) {
      // Flash brief error feedback on tapped tile
      const board = document.getElementById('sl-board');
      if (board) {
        const cells = board.children;
        if (cells[index]) {
          cells[index].style.opacity = '0.5';
          setTimeout(() => { if (cells[index]) cells[index].style.opacity = '1'; }, 200);
        }
      }
      return;
    }

    [c.tiles[index], c.tiles[emptyIdx]] = [c.tiles[emptyIdx], c.tiles[index]];
    c.moves++;

    // Update move counter
    const movEl = document.getElementById('sl-moves');
    if (movEl) movEl.textContent = c.moves;

    // Redraw board
    const board = document.getElementById('sl-board');
    if (board) board.innerHTML = c.tiles.map((tile, i) => this._tileHTML(tile, i, c)).join('');

    if (this._isSolved(c.tiles)) {
      c.solved = true;
      clearInterval(this._timerInterval);
      // Flash green celebration
      setTimeout(() => this._showResult(), 400);
    }
  },

  _shuffle() {
    const c = this.current;
    c.tiles = this._generatePuzzle(c.size);
    c.moves = 0;
    c.startTime = Date.now();
    const movEl = document.getElementById('sl-moves');
    if (movEl) movEl.textContent = '0';
    const board = document.getElementById('sl-board');
    if (board) board.innerHTML = c.tiles.map((tile, i) => this._tileHTML(tile, i, c)).join('');
  },

  _showResult() {
    const c = this.current;
    clearInterval(this._timerInterval);
    const timeMs = Date.now() - c.startTime;
    const timeSec = Math.round(timeMs / 1000);
    // Bonus für wenige Züge
    const movePenalty = Math.min(50, Math.max(0, c.moves - 10) * 2);
    const timePenalty = Math.min(30, Math.floor(timeSec / 15));
    const rawScore = Math.max(20, 100 - movePenalty - timePenalty);
    const finalScore = State.calcFinalScore({ rawScore, timeMs, errors: c.errors, passed: true });

    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center;padding:20px 0">
        <div style="font-size:3rem">🧩🏆</div>
        <div style="font-family:'Fredoka One',cursive;font-size:1.7rem;color:var(--mountain-dark);margin:10px 0">
          Puzzle gelöst! 🎉
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:12px 0">
          <div style="background:#F0F9FF;border-radius:10px;padding:10px;font-size:0.8rem">
            <div style="font-size:1.2rem">⏱</div><b>${timeSec}s</b><br><span style="color:var(--text-mid)">Zeit</span>
          </div>
          <div style="background:#F0FAF0;border-radius:10px;padding:10px;font-size:0.8rem">
            <div style="font-size:1.2rem">🎯</div><b>${c.moves}</b><br><span style="color:var(--text-mid)">Züge</span>
          </div>
          <div style="background:#FFFFF0;border-radius:10px;padding:10px;font-size:0.8rem">
            <div style="font-size:1.2rem">⭐</div><b>${finalScore}</b><br><span style="color:var(--text-mid)">Punkte</span>
          </div>
        </div>
        <button class="btn btn-primary btn-full" onclick="SliderGame._finish(${finalScore},${timeMs},${c.errors})">
          Weiter ➜
        </button>
      </div>`;
  },

  _finish(score, timeMs, errors) {
    clearInterval(this._timerInterval);
    if (this.current?.onComplete) {
      this.current.onComplete({ rawScore: score, timeMs, errors, passed: true });
    }
  },
};

window.SliderGame = SliderGame;
