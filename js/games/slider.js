/**
 * games/slider.js — Schiebepuzzle (Slider Puzzle)
 * 3x3 Raster mit Zahlen 1-8, ein leeres Feld — bringe alles in die richtige Reihenfolge
 * Einfach: 3x3, Schwer: 4x4
 */

const SliderGame = {
  current: null,

  start(config) {
    const { ageGroup = 'einfach', worldId = 1, onComplete } = config;
    SliderGame._lastConfig = config;
    const size = (ageGroup === 'sehr_einfach' || ageGroup === 'einfach') ? 3 : 4;
    const tiles = this._generatePuzzle(size);

    this.current = {
      size, tiles,
      moves: 0,
      errors: 0,
      startTime: Date.now(),
      solved: false,
      onComplete,
      // World-themed emoji tiles
      emojis: this._getEmojis(worldId, size),
    };
    this._render();
  },

  _getEmojis(worldId, size) {
    const sets = {
      1:  ['🚗','🗺️','⛽','🚦','🎒','🏔️','🌲','🌸','🦋','🏡','🌅','🚂','🌻','🎭','🏙️','🌙'],
      2:  ['🏰','👑','⚔️','🛡️','🗝️','🕯️','🦅','🌹','🐉','🗡️','🏹','🔮','📜','🦁','🌕','⚡'],
      3:  ['🏊','🌞','🏖️','🍦','🐠','🌊','🦀','🐚','🌴','🍹','🐬','🦞','🌺','🐟','🍉','☀️'],
      4:  ['🎾','🏆','🥎','🏸','⚡','🏅','🎯','🥊','🏋️','🤸','🤾','🥅','🎽','👟','🏟️','🌟'],
      5:  ['🎲','⚀','⚁','⚂','⚃','⚄','⚅','🃏','🎰','🎮','🕹️','🎯','🏆','🎪','🎭','🎉'],
      6:  ['🚴','🌻','🦋','🌿','🏡','🌸','🍃','🌾','🦜','🌈','🐝','🌼','🍀','🌵','🦔','🌙'],
      7:  ['🥐','🍷','🧀','🥗','🍰','🥩','🍜','🥨','🍮','🫕','🥖','🧄','🍓','🫐','🥂','🌹'],
      8:  ['⚽','🏆','🥅','👟','🎽','🏟️','🤾','🥇','🎯','👊','🏅','🌟','🎺','📣','🏴','🔥'],
      9:  ['🧳','👒','👓','📷','🪥','✈️','🌍','🎫','💺','🗺️','🏷️','🎁','📱','🔑','🪪','🛂'],
      10: ['🏠','🌟','❤️','🎉','🏆','🌈','🥂','🎆','🎊','🌺','💫','✨','🎈','🎀','🌸','🌙'],
    };
    return (sets[worldId] || sets[1]).slice(0, size * size);
  },

  _generatePuzzle(size) {
    const n = size * size;
    let tiles = Array.from({length: n}, (_, i) => i); // 0 = empty
    // Shuffle with guaranteed solvable state
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
    // Make solvable: if inversion count is odd and size is even, swap last two non-empty tiles
    if (!this._isSolvable(tiles, size)) {
      const a = tiles.findIndex(t => t !== 0);
      const b = tiles.findIndex((t, i) => t !== 0 && i > a);
      [tiles[a], tiles[b]] = [tiles[b], tiles[a]];
    }
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
    const cellSize = c.size === 3 ? 96 : 72;
    const boardSize = cellSize * c.size;

    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center">
        <div style="display:flex;justify-content:space-between;font-size:0.8rem;color:var(--text-mid);margin-bottom:10px">
          <span>Züge: <b id="sl-moves">0</b></span>
          <span>⏱ <span id="sl-timer">0s</span></span>
          <span>${c.size}×${c.size} Puzzle</span>
        </div>
        <div style="font-size:0.82rem;color:var(--text-mid);margin-bottom:10px">
          Bringe alle Felder in die richtige Reihenfolge! Tippe auf ein Feld neben dem leeren Feld.
        </div>

        <div id="sl-board" style="
          display:grid;
          grid-template-columns:repeat(${c.size},${cellSize}px);
          gap:4px;
          margin:0 auto;
          width:${boardSize + (c.size-1)*4}px;
          touch-action:none;">
          ${c.tiles.map((tile, i) => this._tileHTML(tile, i, c)).join('')}
        </div>

        <div style="margin-top:14px;display:flex;gap:10px;justify-content:center">
          <button class="btn btn-secondary" onclick="SliderGame._shuffle()" style="font-size:0.9rem;padding:10px 18px">🔀 Neu mischen</button>
        </div>
      </div>`;

    // Timer
    this._timerInterval = setInterval(() => {
      const el = document.getElementById('sl-timer');
      if (el) el.textContent = Math.round((Date.now()-c.startTime)/1000)+'s';
    }, 1000);
  },

  _tileHTML(tile, index, c) {
    const size = c.size;
    const cellSize = size === 3 ? 96 : 72;
    const fontSize = size === 3 ? '2.2rem' : '1.6rem';
    if (tile === 0) {
      return `<div style="width:${cellSize}px;height:${cellSize}px;border-radius:10px;background:rgba(0,0,0,0.08)"></div>`;
    }
    const emoji = c.emojis[tile - 1] || tile;
    const correctPos = tile - 1;
    const isCorrect = index === correctPos;
    return `<div onclick="SliderGame._tap(${index})"
      style="width:${cellSize}px;height:${cellSize}px;border-radius:10px;
        background:${isCorrect ? 'linear-gradient(135deg,#27AE60,#1E8449)' : 'linear-gradient(135deg,#4A90D9,#2C75C0)'};
        color:white;display:flex;align-items:center;justify-content:center;
        font-size:${fontSize};cursor:pointer;user-select:none;-webkit-user-select:none;
        box-shadow:0 3px 8px rgba(0,0,0,0.2);transition:all 0.15s;
        border:2px solid ${isCorrect ? '#1E8449' : '#2C75C0'}">
      ${emoji}
    </div>`;
  },

  _tap(index) {
    const c = this.current;
    if (c.solved) return;
    const emptyIdx = c.tiles.indexOf(0);
    const size = c.size;
    const row = Math.floor(index / size), col = index % size;
    const erow = Math.floor(emptyIdx / size), ecol = emptyIdx % size;

    // Can only move if adjacent to empty
    const adjacent = (Math.abs(row-erow)===1&&col===ecol) || (Math.abs(col-ecol)===1&&row===erow);
    if (!adjacent) { c.errors++; return; }

    // Swap
    [c.tiles[index], c.tiles[emptyIdx]] = [c.tiles[emptyIdx], c.tiles[index]];
    c.moves++;
    document.getElementById('sl-moves').textContent = c.moves;

    // Update board
    const board = document.getElementById('sl-board');
    if (board) {
      board.innerHTML = c.tiles.map((tile, i) => this._tileHTML(tile, i, c)).join('');
    }

    if (this._isSolved(c.tiles)) {
      c.solved = true;
      clearInterval(this._timerInterval);
      setTimeout(() => this._showResult(), 500);
    }
  },

  _shuffle() {
    const c = this.current;
    c.tiles = this._generatePuzzle(c.size);
    c.moves = 0;
    c.startTime = Date.now();
    document.getElementById('sl-moves').textContent = '0';
    const board = document.getElementById('sl-board');
    if (board) board.innerHTML = c.tiles.map((tile, i) => this._tileHTML(tile, i, c)).join('');
  },

  _showResult() {
    const c = this.current;
    clearInterval(this._timerInterval);
    const timeMs = Date.now()-c.startTime;
    const timeSec = Math.round(timeMs/1000);
    const rawScore = Math.max(20, 100 - Math.floor(c.moves/2) - Math.floor(timeSec/10));
    const finalScore = State.calcFinalScore({rawScore, timeMs, errors:c.errors, passed:true});

    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center;padding:20px 0">
        <div style="font-size:3rem">🧩🏆</div>
        <div style="font-family:'Fredoka One',cursive;font-size:1.7rem;color:var(--mountain-dark);margin:10px 0">Puzzle gelöst!</div>
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
        <button class="btn btn-primary btn-full" onclick="SliderGame._finish(${finalScore},${timeMs},${c.errors})">Weiter ➜</button>
      </div>`;
  },

  _finish(score, timeMs, errors) {
    clearInterval(this._timerInterval);
    if (this.current?.onComplete) this.current.onComplete({rawScore:score, timeMs, errors, passed:true});
  },

  _timerInterval: null,
  _lastConfig: null,
};

window.SliderGame = SliderGame;
