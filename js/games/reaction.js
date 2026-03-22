/**
 * games/reaction.js v2 — Reaktionsspiel
 * Grün = tippen, Rot = NICHT tippen
 * Zeiterfassung & Fehlerstrafe
 */

const ReactionGame = {
  current: null,

  start(config) {
    const { onComplete } = config;
    this.current = {
      round: 0, totalRounds: 10,
      results: [],
      phase: 'wait',
      timer: null,
      startTime: Date.now(),
      errors: 0,
      onComplete,
      canTap: false,
    };
    this._render();
    setTimeout(() => this._nextRound(), 900);
  },

  _render() {
    const c = this.current;
    const dotsHTML = Array.from({length: c.totalRounds}, (_, i) => {
      const res = c.results[i];
      let cls = 'pending';
      if (res === 'correct') cls = 'correct';
      if (res === 'wrong')   cls = 'wrong';
      return `<div class="reaction-dot ${cls}">${res==='correct'?'✓':res==='wrong'?'✗':''}</div>`;
    }).join('');

    document.getElementById('game-area').innerHTML = `
      <div style="display:flex;justify-content:space-between;font-size:0.8rem;color:var(--text-mid);margin-bottom:10px">
        <span>🟢 Grün = TIPPEN &nbsp;|&nbsp; 🔴 Rot = WARTEN</span>
        <span>❌ ${c.errors}</span>
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
    const text   = document.getElementById('reaction-text');
    if (!screen) return;
    if (c.phase === 'red')   { screen.className = 'reaction-screen red';   if(text) text.textContent = '🛑 STOPP!'; }
    else if (c.phase === 'green') { screen.className = 'reaction-screen green'; if(text) text.textContent = '👆 JETZT TIPPEN!'; }
    else { screen.className = 'reaction-screen wait'; if(text) text.textContent = '⏳ Warte...'; }
  },

  _nextRound() {
    const c = this.current;
    if (c.round >= c.totalRounds) { this._showResult(); return; }
    clearTimeout(c.timer);
    c.canTap = false;
    c.phase = 'wait';
    this._updateScreen();

    c.timer = setTimeout(() => {
      const isGreen = Math.random() > 0.35;
      c.phase = isGreen ? 'green' : 'red';
      c.canTap = true;
      this._updateScreen();

      const showTime = isGreen ? 1000 + Math.random() * 900 : 1500 + Math.random() * 600;
      c.timer = setTimeout(() => {
        if (c.round >= c.totalRounds) return;
        if (isGreen) { c.results[c.round] = 'wrong'; c.errors++; }
        else         { c.results[c.round] = 'correct'; }
        c.round++;
        c.canTap = false;
        this._updateDots();
        this._nextRound();
      }, showTime);
    }, 700 + Math.random() * 1600);
  },

  _onTap() {
    const c = this.current;
    if (!c || !c.canTap) return;
    clearTimeout(c.timer);
    const wasGreen = c.phase === 'green';
    if (!wasGreen) c.errors++;
    c.results[c.round] = wasGreen ? 'correct' : 'wrong';
    c.round++;
    c.canTap = false;
    this._updateDots();
    setTimeout(() => this._nextRound(), 400);
  },

  _updateDots() {
    const c = this.current;
    document.querySelectorAll('.reaction-dot').forEach((dot, i) => {
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
    const timeMs  = Date.now() - c.startTime;
    const rawScore = Math.round((correct / c.totalRounds) * 100);
    const finalScore = State.calcFinalScore({ rawScore, timeMs, errors: c.errors, passed: correct >= 6 });

    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center;padding:20px 0">
        <div style="font-size:3rem">${correct >= 7 ? '⚡🏆' : '😅'}</div>
        <div style="font-family:'Fredoka One',cursive;font-size:1.8rem;color:var(--mountain-dark);margin:10px 0">
          ${correct}/${c.totalRounds} richtig!
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:12px 0">
          <div style="background:#F0F9FF;border-radius:10px;padding:10px;font-size:0.8rem">
            <div style="font-size:1.2rem">⏱</div><b>${Math.round(timeMs/1000)}s</b><br><span style="color:var(--text-mid)">Zeit</span>
          </div>
          <div style="background:#FFF5F5;border-radius:10px;padding:10px;font-size:0.8rem">
            <div style="font-size:1.2rem">❌</div><b>${c.errors}</b><br><span style="color:var(--text-mid)">Fehler</span>
          </div>
          <div style="background:#FFFFF0;border-radius:10px;padding:10px;font-size:0.8rem">
            <div style="font-size:1.2rem">⭐</div><b>${finalScore}</b><br><span style="color:var(--text-mid)">Punkte</span>
          </div>
        </div>
        <button class="btn btn-primary btn-full" onclick="ReactionGame._finish(${finalScore},${timeMs},${c.errors})">Weiter ➜</button>
      </div>
    `;
  },

  _finish(score, timeMs, errors) {
    if (this.current?.onComplete) {
      this.current.onComplete({ rawScore: score, timeMs, errors, passed: score >= 40 });
    }
  }
};

window.ReactionGame = ReactionGame;
