/**
 * games/memory.js — Memory Spiel (10 Karten = 5 Paare)
 */

const MemoryGame = {
  current: null,

  start(config) {
    const { emojis = ['🌲','🦊','🐦','🍄','🌿'], onComplete } = config;
    // 5 Paare = 10 Karten
    const pairs = emojis.slice(0, 5);
    const cards = [...pairs, ...pairs]
      .map((emoji, id) => ({ emoji, id, pairId: emoji, flipped: false, matched: false }))
      .sort(() => Math.random() - 0.5);

    this.current = {
      cards,
      flipped: [],
      matched: 0,
      moves: 0,
      locked: false,
      startTime: Date.now(),
      onComplete,
    };
    this._render();
  },

  _render() {
    const c = this.current;
    document.getElementById('game-area').innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <span style="font-size:0.9rem;color:var(--text-mid)">Gefunden: <b>${c.matched}/5</b></span>
        <span style="font-size:0.9rem;color:var(--text-mid)">Versuche: <b id="move-count">${c.moves}</b></span>
      </div>
      <div class="memory-grid" id="memory-grid">
        ${c.cards.map((card, i) => this._cardHTML(card, i)).join('')}
      </div>
    `;
  },

  _cardHTML(card, index) {
    const flippedClass = card.flipped || card.matched ? 'flipped' : '';
    const matchedClass = card.matched ? 'matched' : '';
    return `
      <div class="memory-card ${flippedClass} ${matchedClass}" id="mcard-${index}" onclick="MemoryGame._flip(${index})">
        <div class="memory-front">🏔️</div>
        <div class="memory-back">${card.emoji}</div>
      </div>
    `;
  },

  _flip(index) {
    const c = this.current;
    if (c.locked) return;
    const card = c.cards[index];
    if (card.flipped || card.matched) return;
    if (c.flipped.length >= 2) return;

    card.flipped = true;
    const el = document.getElementById(`mcard-${index}`);
    if (el) el.classList.add('flipped');
    c.flipped.push(index);

    if (c.flipped.length === 2) {
      c.moves++;
      document.getElementById('move-count').textContent = c.moves;
      c.locked = true;
      this._checkMatch();
    }
  },

  _checkMatch() {
    const c = this.current;
    const [a, b] = c.flipped;
    const cardA = c.cards[a];
    const cardB = c.cards[b];

    if (cardA.pairId === cardB.pairId) {
      // Match!
      setTimeout(() => {
        cardA.matched = true;
        cardB.matched = true;
        document.getElementById(`mcard-${a}`)?.classList.add('matched');
        document.getElementById(`mcard-${b}`)?.classList.add('matched');
        c.flipped = [];
        c.matched++;
        c.locked = false;

        if (c.matched >= 5) {
          setTimeout(() => this._showResult(), 500);
        }
      }, 400);
    } else {
      // Kein Match — zurückdrehen
      setTimeout(() => {
        cardA.flipped = false;
        cardB.flipped = false;
        document.getElementById(`mcard-${a}`)?.classList.remove('flipped');
        document.getElementById(`mcard-${b}`)?.classList.remove('flipped');
        c.flipped = [];
        c.locked = false;
      }, 900);
    }
  },

  _showResult() {
    const c = this.current;
    const seconds = Math.round((Date.now() - c.startTime) / 1000);
    // Score: schneller & weniger Versuche = mehr Punkte
    const baseScore = 100;
    const timePenalty = Math.min(40, Math.floor(seconds / 5));
    const movePenalty = Math.min(30, Math.max(0, c.moves - 5) * 3);
    const score = Math.max(20, baseScore - timePenalty - movePenalty);

    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center;padding:20px 0">
        <div style="font-size:3.5rem">🧠✨</div>
        <div style="font-family:'Fredoka One',cursive;font-size:1.8rem;color:var(--mountain-dark);margin:12px 0">
          Alle Paare gefunden!
        </div>
        <div style="color:var(--text-mid);margin-bottom:8px">${c.moves} Versuche · ${seconds} Sekunden</div>
        <div class="score-badge" style="margin:12px auto;display:inline-flex">⭐ ${score} Punkte</div>
        <br><br>
        <button class="btn btn-primary btn-full" onclick="MemoryGame._finish(${score})">Weiter ➜</button>
      </div>
    `;
  },

  _finish(score) {
    if (this.current.onComplete) {
      this.current.onComplete({ score, passed: true });
    }
  }
};

window.MemoryGame = MemoryGame;
