/**
 * games/reaction.js — Reaktionsspiel
 * Grün = tippen, Rot = NICHT tippen
 */

const ReactionGame = {
  current: null,

  start(config) {
    const { onComplete } = config;
    this.current = {
      round: 0,
      totalRounds: 10,
      results: [],
      phase: 'wait',
      timer: null,
      onComplete,
      canTap: false,
    };
    this._render();
    setTimeout(() => this._nextRound(), 800);
  },

  _render() {
    const c = this.current;
    const dotsHTML = Array.from({ length: c.totalRounds }, (_, i) => {
      const res = c.results[i];
      let cls = 'pending';
      if (res === 'correct') cls = 'correct';
      if (res === 'wrong') cls = 'wrong';
      return `<div class="reaction-dot ${cls}">${res === 'correct' ? '✓' : res === 'wrong' ? '✗' : ''}</div>`;
    }).join('');

    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center;margin-bottom:12px;color:var(--text-mid);font-size:0.9rem">
        🟢 Grün = TIPPEN &nbsp;|&nbsp; 🔴 Rot = WARTEN
      </div>
      <div class="reaction-screen wait" id="reaction-screen" onclick="ReactionGame._onTap()">
        <span id="reaction-text">Bereit machen...</span>
      </div>
      <div class="reaction-results" style="margin-top:14px">${dotsHTML}</div>
    `;
  },

  _updateScreen() {
    const c = this.current;
    const screen = document.getElementById('reaction-screen');
    const text = document.getElementById('reaction-text');
    if (!screen) return;

    if (c.phase === 'red') {
      screen.className = 'reaction-screen red';
      text.textContent = '🛑 STOPP!';
    } else if (c.phase === 'green') {
      screen.className = 'reaction-screen green';
      text.textContent = '👆 JETZT TIPPEN!';
    } else {
      screen.className = 'reaction-screen wait';
      text.textContent = c.round === 0 ? 'Bereit machen...' : '⏳ Warte...';
    }
  },

  _nextRound() {
    const c = this.current;
    if (c.round >= c.totalRounds) {
      this._showResult();
      return;
    }

    clearTimeout(c.timer);
    c.canTap = false;
    c.phase = 'wait';
    this._updateScreen();

    const waitTime = 800 + Math.random() * 1500;
    c.timer = setTimeout(() => {
      const isGreen = Math.random() > 0.35; // 65% grün, 35% rot
      c.phase = isGreen ? 'green' : 'red';
      c.canTap = true;
      this._updateScreen();

      // Timeout: wenn nicht reagiert
      const showTime = isGreen ? 1200 + Math.random() * 800 : 1500 + Math.random() * 500;
      c.timer = setTimeout(() => {
        if (c.round >= c.totalRounds) return;
        if (isGreen) {
          // Hätte tippen sollen — zu langsam
          c.results[c.round] = 'wrong';
        } else {
          // Richtig NICHT getippt
          c.results[c.round] = 'correct';
        }
        c.round++;
        c.canTap = false;
        this._updateDots();
        this._nextRound();
      }, showTime);
    }, waitTime);
  },

  _onTap() {
    const c = this.current;
    if (!c || !c.canTap) return;

    clearTimeout(c.timer);
    const wasGreen = c.phase === 'green';
    c.results[c.round] = wasGreen ? 'correct' : 'wrong';
    c.round++;
    c.canTap = false;

    // Flash Feedback
    const screen = document.getElementById('reaction-screen');
    if (screen && !wasGreen) {
      screen.style.animation = 'shake 0.4s';
    }

    this._updateDots();
    setTimeout(() => this._nextRound(), 400);
  },

  _updateDots() {
    const c = this.current;
    const dots = document.querySelectorAll('.reaction-dot');
    dots.forEach((dot, i) => {
      const res = c.results[i];
      dot.className = 'reaction-dot';
      if (res === 'correct') { dot.classList.add('correct'); dot.textContent = '✓'; }
      else if (res === 'wrong') { dot.classList.add('wrong'); dot.textContent = '✗'; }
    });
  },

  _showResult() {
    const c = this.current;
    clearTimeout(c.timer);
    const correct = c.results.filter(r => r === 'correct').length;
    const score = Math.round((correct / c.totalRounds) * 100);

    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center;padding:20px 0">
        <div style="font-size:3.5rem">${correct >= 7 ? '⚡' : '😅'}</div>
        <div style="font-family:'Fredoka One',cursive;font-size:1.8rem;color:var(--mountain-dark);margin:12px 0">
          ${correct}/${c.totalRounds} richtig!
        </div>
        <div style="color:var(--text-mid);margin-bottom:24px">
          ${correct >= 7 ? 'Blitzschnelle Reaktion! 🏆' : 'Übe weiter, du schaffst das!'}
        </div>
        <button class="btn btn-primary btn-full" onclick="ReactionGame._finish(${score})">Weiter ➜</button>
      </div>
    `;
  },

  _finish(score) {
    if (this.current.onComplete) {
      this.current.onComplete({ score, passed: score >= 60 });
    }
  }
};

window.ReactionGame = ReactionGame;
