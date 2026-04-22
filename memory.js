/**
 * games/memory.js v2 — Memory Spiel (5 Paare = 10 Karten)
 * Zeiterfassung & Fehlerstrafe
 */

const MemoryGame = {
  current: null,

  start(config) {
    const { emojis = ['🌲','🦊','🐦','🍄','🌿'], onComplete } = config;
    const pairs = emojis.slice(0, 5);
    const cards = [...pairs, ...pairs]
      .map((emoji, id) => ({ emoji, id, pairId: emoji, flipped: false, matched: false }))
      .sort(() => Math.random() - 0.5);

    this.current = {
      cards, flipped: [], matched: 0,
      moves: 0, errors: 0,
      startTime: Date.now(),
      locked: false,
      onComplete,
    };
    this._render();
  },

  _render() {
    const c = this.current;
    document.getElementById('game-area').innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-size:0.85rem;color:var(--text-mid)">
        <span>⏱ <span id="mem-time">0s</span></span>
        <span>Gefunden: <b>${c.matched}/5</b></span>
        <span>Versuche: <b id="move-count">${c.moves}</b></span>
      </div>
      <div class="memory-grid" id="memory-grid">
        ${c.cards.map((card, i) => this._cardHTML(card, i)).join('')}
      </div>
    `;
    // Live timer
    this._timerInterval = setInterval(() => {
      const el = document.getElementById('mem-time');
      if (el) el.textContent = Math.round((Date.now() - c.startTime) / 1000) + 's';
    }, 1000);
  },

  _cardHTML(card, index) {
    const flippedClass = card.flipped || card.matched ? 'flipped' : '';
    const matchedClass = card.matched ? 'matched' : '';
    return `
      <div class="memory-card ${flippedClass} ${matchedClass}" id="mcard-${index}" onclick="MemoryGame._flip(${index})">
        <div class="memory-front">🏔️</div>
        <div class="memory-back">${card.emoji}</div>
      </div>`;
  },

  _flip(index) {
    const c = this.current;
    if (c.locked) return;
    const card = c.cards[index];
    if (card.flipped || card.matched || c.flipped.length >= 2) return;
    card.flipped = true;
    document.getElementById(`mcard-${index}`)?.classList.add('flipped');
    c.flipped.push(index);
    if (c.flipped.length === 2) { c.moves++; document.getElementById('move-count').textContent = c.moves; c.locked = true; this._checkMatch(); }
  },

  _checkMatch() {
    const c = this.current;
    const [a, b] = c.flipped;
    const cA = c.cards[a], cB = c.cards[b];
    if (cA.pairId === cB.pairId) {
      setTimeout(() => {
        cA.matched = cB.matched = true;
        document.getElementById(`mcard-${a}`)?.classList.add('matched');
        document.getElementById(`mcard-${b}`)?.classList.add('matched');
        c.flipped = []; c.matched++; c.locked = false;
        if (c.matched >= 5) { clearInterval(this._timerInterval); setTimeout(() => this._showResult(), 500); }
      }, 400);
    } else {
      c.errors++;
      setTimeout(() => {
        cA.flipped = cB.flipped = false;
        document.getElementById(`mcard-${a}`)?.classList.remove('flipped');
        document.getElementById(`mcard-${b}`)?.classList.remove('flipped');
        c.flipped = []; c.locked = false;
      }, 900);
    }
  },

  _showResult() {
    const c = this.current;
    clearInterval(this._timerInterval);
    const timeMs = Date.now() - c.startTime;
    const timeSec = Math.round(timeMs / 1000);
    const rawScore = 100;
    const finalScore = State.calcFinalScore({ rawScore, timeMs, errors: c.errors, passed: true });

    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center;padding:20px 0">
        <div style="font-size:3rem">🧠✨</div>
        <div style="font-family:'Fredoka One',cursive;font-size:1.8rem;color:var(--mountain-dark);margin:10px 0">Alle Paare gefunden!</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:12px 0">
          <div style="background:#F0F9FF;border-radius:10px;padding:10px;font-size:0.8rem">
            <div style="font-size:1.2rem">⏱</div><b>${timeSec}s</b><br><span style="color:var(--text-mid)">Zeit</span>
          </div>
          <div style="background:#FFF5F5;border-radius:10px;padding:10px;font-size:0.8rem">
            <div style="font-size:1.2rem">❌</div><b>${c.errors}</b><br><span style="color:var(--text-mid)">Fehlversuche</span>
          </div>
          <div style="background:#FFFFF0;border-radius:10px;padding:10px;font-size:0.8rem">
            <div style="font-size:1.2rem">⭐</div><b>${finalScore}</b><br><span style="color:var(--text-mid)">Punkte</span>
          </div>
        </div>
        <button class="btn btn-primary btn-full" onclick="MemoryGame._finish(${finalScore},${timeMs},${c.errors})">Weiter ➜</button>
      </div>`;
  },

  _finish(score, timeMs, errors) {
    if (this.current?.onComplete) this.current.onComplete({ rawScore: score, timeMs, errors, passed: true });
  }
};

window.MemoryGame = MemoryGame;
