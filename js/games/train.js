/**
 * games/train.js v2 — Zugweichen-Spiel
 * Zeiterfassung & Fehlerstrafe
 */

const TrainGame = {
  current: null,

  start(config) {
    const { worldId = 1, onComplete } = config;
    TrainGame._lastConfig = config;
    this.current = {
      questions: this._generateQuestions(worldId),
      index: 0, results: [],
      errors: 0, score: 0,
      startTime: Date.now(),
      animating: false,
      onComplete,
    };
    this._render();
  },

  _generateQuestions(worldId) {
    const theme = [
      { bg: '#A8D8A8', rail: '#8B6914', station: '🏠' },
      { bg: '#B8DCEF', rail: '#5D6D7E', station: '⛷️' },
      { bg: '#F9E4B7', rail: '#8B6914', station: '🏠' },
      { bg: '#E8F4FD', rail: '#7F8C8D', station: '🏔️' },
      { bg: '#FDECEA', rail: '#E74C3C', station: '🏁' },
    ][worldId - 1] || { bg: '#A8D8A8', rail: '#8B6914', station: '🏠' };

    const banks = {
      1: [
        { question: '5 + 3 = ?',            left: '8 ✓', right: '9 ✗', correct: 'left'  },
        { question: 'Welche Farbe hat Schnee?', left: 'Weiß ✓', right: 'Blau ✗', correct: 'left' },
        { question: '10 - 4 = ?',           left: '5 ✗', right: '6 ✓', correct: 'right' },
        { question: '4 Beine hat ein...?',   left: 'Hund ✓', right: 'Vogel ✗', correct: 'left' },
        { question: '3 × 3 = ?',            left: '6 ✗', right: '9 ✓', correct: 'right' },
        { question: 'Was reimt auf Berg?',   left: 'Burg ✓', right: 'Park ✗', correct: 'left' },
        { question: '20 ÷ 4 = ?',           left: '4 ✗', right: '5 ✓', correct: 'right' },
        { question: 'Nach Montag kommt?',    left: 'Dienstag ✓', right: 'Mittwoch ✗', correct: 'left' },
        { question: '7 + 8 = ?',            left: '14 ✗', right: '15 ✓', correct: 'right' },
        { question: 'Wo liegt die Schweiz?', left: 'Europa ✓', right: 'Asien ✗', correct: 'left' },
      ],
      2: [
        { question: '15 + 27 = ?',          left: '42 ✓', right: '40 ✗', correct: 'left'  },
        { question: 'Hauptstadt der Schweiz?', left: 'Zürich ✗', right: 'Bern ✓', correct: 'right' },
        { question: '100 - 37 = ?',         left: '63 ✓', right: '67 ✗', correct: 'left'  },
        { question: '6 × 7 = ?',            left: '42 ✓', right: '48 ✗', correct: 'left'  },
        { question: 'Was messen Thermometer?', left: 'Temp ✓', right: 'Druck ✗', correct: 'left' },
        { question: '48 ÷ 6 = ?',           left: '6 ✗', right: '8 ✓', correct: 'right'  },
        { question: '8 × 8 = ?',            left: '64 ✓', right: '56 ✗', correct: 'left'  },
        { question: '1 km = ? Meter',        left: '100 ✗', right: '1000 ✓', correct: 'right' },
        { question: '9 × 6 = ?',            left: '54 ✓', right: '56 ✗', correct: 'left'  },
        { question: 'Welcher Planet ist 1.?', left: 'Merkur ✓', right: 'Venus ✗', correct: 'left' },
      ],
      3: [
        { question: '25 × 4 = ?',           left: '90 ✗', right: '100 ✓', correct: 'right' },
        { question: 'Was ist ein Rösti?',    left: 'Kartoffelg. ✓', right: 'Kuchen ✗', correct: 'left' },
        { question: '150 + 75 = ?',         left: '225 ✓', right: '235 ✗', correct: 'left'  },
        { question: '11 × 11 = ?',          left: '111 ✗', right: '121 ✓', correct: 'right' },
        { question: '1 kg = ? g',           left: '500 ✗', right: '1000 ✓', correct: 'right' },
        { question: '13 × 7 = ?',           left: '91 ✓', right: '84 ✗', correct: 'left'  },
        { question: '200 ÷ 4 = ?',          left: '50 ✓', right: '40 ✗', correct: 'left'  },
        { question: 'Wie viele Tage hat Nov?', left: '30 ✓', right: '31 ✗', correct: 'left' },
        { question: '15 × 6 = ?',           left: '80 ✗', right: '90 ✓', correct: 'right' },
        { question: 'Bon appétit bedeutet?', left: 'Danke ✗', right: 'Guten Appetit ✓', correct: 'right' },
      ],
      4: [
        { question: '16 × 8 = ?',           left: '128 ✓', right: '124 ✗', correct: 'left'  },
        { question: 'Bei welcher Temp gefriert Wasser?', left: '0°C ✓', right: '-5°C ✗', correct: 'left' },
        { question: '250 + 375 = ?',        left: '615 ✗', right: '625 ✓', correct: 'right' },
        { question: '17 × 5 = ?',           left: '85 ✓', right: '80 ✗', correct: 'left'  },
        { question: 'Was ist eine Lawine?',  left: 'Schnee rutscht ✓', right: 'Ein Wind ✗', correct: 'left' },
        { question: '18 × 9 = ?',           left: '162 ✓', right: '158 ✗', correct: 'left'  },
        { question: '144 ÷ 12 = ?',         left: '11 ✗', right: '12 ✓', correct: 'right' },
        { question: '1 m = ? cm',           left: '100 ✓', right: '10 ✗', correct: 'left'  },
        { question: '14 × 6 = ?',           left: '84 ✓', right: '80 ✗', correct: 'left'  },
        { question: 'Wie viele Monate hat das Jahr?', left: '12 ✓', right: '10 ✗', correct: 'left' },
      ],
      5: [
        { question: '19 × 7 = ?',           left: '131 ✗', right: '133 ✓', correct: 'right' },
        { question: 'Schnellstes Skirennen?', left: 'Slalom ✗', right: 'Abfahrt ✓', correct: 'right' },
        { question: '24 × 8 = ?',           left: '192 ✓', right: '188 ✗', correct: 'left'  },
        { question: '√144 = ?',             left: '11 ✗', right: '12 ✓', correct: 'right' },
        { question: '35 × 12 = ?',          left: '420 ✓', right: '410 ✗', correct: 'left'  },
        { question: '60 Sekunden = ? Min',   left: '1 ✓', right: '2 ✗', correct: 'left'  },
        { question: '15% von 200 = ?',       left: '25 ✗', right: '30 ✓', correct: 'right' },
        { question: '999 + 1 = ?',           left: '1000 ✓', right: '1001 ✗', correct: 'left' },
        { question: '23 × 23 = ?',          left: '529 ✓', right: '519 ✗', correct: 'left'  },
        { question: '125 × 8 = ?',          left: '1000 ✓', right: '900 ✗', correct: 'left'  },
      ],
    };

    return ((banks[worldId] || banks[1]).sort(() => Math.random() - 0.5))
      .map(q => ({ ...q, theme }));
  },

  _render() {
    const c = this.current;
    if (c.index >= c.questions.length) { this._showResult(); return; }
    const q = c.questions[c.index];
    const elapsed = Math.round((Date.now() - c.startTime) / 1000);

    document.getElementById('game-area').innerHTML = `
      <div class="progress-bar-wrap">
        <div class="progress-bar-fill" style="width:${(c.index/10)*100}%"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:0.8rem;color:var(--text-mid);margin-bottom:8px">
        <span>Weiche ${c.index+1}/10</span>
        <span>⏱ ${elapsed}s &nbsp; ❌ ${c.errors}</span>
      </div>

      <!-- Train Scene -->
      <div style="position:relative;width:100%;border-radius:14px;overflow:hidden;min-height:160px">
        <svg viewBox="0 0 300 140" xmlns="http://www.w3.org/2000/svg" style="width:100%;display:block">
          <rect width="300" height="140" fill="${q.theme.bg}"/>
          <polygon points="0,140 50,55 100,140" fill="#8FAF6F" opacity="0.5"/>
          <polygon points="60,140 130,38 200,140" fill="#7A9C5E" opacity="0.6"/>
          <polygon points="160,140 230,50 300,140" fill="#6B8D4F" opacity="0.5"/>
          <polygon points="50,55 65,78 35,78" fill="white" opacity="0.8"/>
          <polygon points="130,38 148,65 112,65" fill="white" opacity="0.8"/>
          <polygon points="230,50 248,75 212,75" fill="white" opacity="0.8"/>
          <!-- Main track -->
          <line x1="150" y1="135" x2="150" y2="75" stroke="${q.theme.rail}" stroke-width="4"/>
          ${[90,100,110,120,130].map(y=>`<line x1="138" y1="${y}" x2="162" y2="${y}" stroke="${q.theme.rail}" stroke-width="2" opacity="0.5"/>`).join('')}
          <!-- Branches -->
          <line x1="150" y1="75" x2="55" y2="32" stroke="${q.theme.rail}" stroke-width="3"/>
          <line x1="150" y1="75" x2="245" y2="32" stroke="${q.theme.rail}" stroke-width="3"/>
          <!-- Stations -->
          <text x="40" y="30" text-anchor="middle" font-size="18">${q.theme.station}</text>
          <text x="260" y="30" text-anchor="middle" font-size="18">${q.theme.station}</text>
          <!-- Switch -->
          <circle cx="150" cy="75" r="7" fill="#F39C12" opacity="0.9"/>
          <text x="150" y="79" text-anchor="middle" font-size="9">⚡</text>
          <!-- Train -->
          <text x="145" y="122" font-size="18">🚂</text>
        </svg>
      </div>

      <!-- Question -->
      <div style="text-align:center;padding:10px;font-size:1.05rem;font-weight:700;color:var(--mountain-dark)">
        ❓ ${q.question}
      </div>

      <!-- Switch buttons -->
      <div class="switch-buttons">
        <button class="switch-btn switch-btn-left" onclick="TrainGame._choose('left')" ${c.animating?'disabled':''}>
          ◀ ${q.left}
        </button>
        <button class="switch-btn switch-btn-right" onclick="TrainGame._choose('right')" ${c.animating?'disabled':''}>
          ${q.right} ▶
        </button>
      </div>
    `;
  },

  _choose(direction) {
    const c = this.current;
    if (c.animating) return;
    c.animating = true;
    const q = c.questions[c.index];
    const correct = direction === q.correct;
    if (!correct) c.errors++;
    c.results.push(correct);
    if (correct) c.score += 10;

    document.querySelectorAll('.switch-btn').forEach(btn => {
      btn.disabled = true;
      if (btn.classList.contains(`switch-btn-${direction}`)) {
        btn.style.background = correct
          ? 'linear-gradient(135deg,#27AE60,#1E8449)'
          : 'linear-gradient(135deg,#E74C3C,#C0392B)';
      }
    });

    setTimeout(() => { c.index++; c.animating = false; this._render(); }, 1100);
  },

  _showResult() {
    const c = this.current;
    const correctCount = c.results.filter(Boolean).length;
    const timeMs = Date.now() - c.startTime;
    const rawScore = c.score;
    const finalScore = State.calcFinalScore({ rawScore, timeMs, errors: c.errors, passed: correctCount >= 6 });

    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center;padding:20px 0">
        <div style="font-size:3rem">🚂🏁</div>
        <div style="font-family:'Fredoka One',cursive;font-size:1.8rem;color:var(--mountain-dark);margin:10px 0">
          ${correctCount}/10 richtig!
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
        <button class="btn btn-primary btn-full" onclick="TrainGame._finish(${finalScore},${timeMs},${c.errors})">Weiter ➜</button>
      </div>`;
  },

  _finish(score, timeMs, errors) {
    if (this.current?.onComplete) this.current.onComplete({ rawScore: score, timeMs, errors, passed: score >= 40 });
  },

  _lastConfig: null,
};

window.TrainGame = TrainGame;
