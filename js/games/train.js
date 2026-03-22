/**
 * games/train.js — Zugweichen-Spiel
 * Bei jeder Weiche links oder rechts drücken
 */

const TrainGame = {
  current: null,

  start(config) {
    const { worldId = 1, onComplete } = config;
    const questions = this._generateQuestions(worldId);
    this.current = {
      questions,
      index: 0,
      results: [],
      score: 0,
      onComplete,
      animating: false,
    };
    this._render();
  },

  _generateQuestions(worldId) {
    const themes = {
      1: { bg: '#A8D8A8', rail: '#8B6914', station: '🏠' },
      2: { bg: '#B8DCEF', rail: '#5D6D7E', station: '⛷️' },
      3: { bg: '#F9E4B7', rail: '#8B6914', station: '🏠' },
      4: { bg: '#E8F4FD', rail: '#7F8C8D', station: '🏔️' },
      5: { bg: '#FDECEA', rail: '#E74C3C', station: '🏁' },
    };
    const theme = themes[worldId] || themes[1];

    // 10 Fragen mit links/rechts Logik
    const puzzles = [
      { question: '5 + 3 = ?', left: '8 ✓', right: '9 ✗', correct: 'left' },
      { question: 'Welche Farbe hat Schnee?', left: 'Weiß ✓', right: 'Blau ✗', correct: 'left' },
      { question: '10 - 4 = ?', left: '5 ✗', right: '6 ✓', correct: 'right' },
      { question: 'Wie viele Beine hat ein Hund?', left: '4 ✓', right: '6 ✗', correct: 'left' },
      { question: '3 × 3 = ?', left: '6 ✗', right: '9 ✓', correct: 'right' },
      { question: 'Was klingt wie "Berg"?', left: 'Burg ✓', right: 'Park ✗', correct: 'left' },
      { question: '20 ÷ 4 = ?', left: '4 ✗', right: '5 ✓', correct: 'right' },
      { question: 'Was kommt nach Montag?', left: 'Dienstag ✓', right: 'Mittwoch ✗', correct: 'left' },
      { question: '7 + 8 = ?', left: '14 ✗', right: '15 ✓', correct: 'right' },
      { question: 'Wo liegt die Schweiz?', left: 'Europa ✓', right: 'Asien ✗', correct: 'left' },
    ].sort(() => Math.random() - 0.5).slice(0, 10);

    return puzzles.map(p => ({ ...p, theme }));
  },

  _render() {
    const c = this.current;
    if (c.index >= c.questions.length) {
      this._showResult();
      return;
    }
    const q = c.questions[c.index];
    const progressPct = (c.index / 10) * 100;

    document.getElementById('game-area').innerHTML = `
      <div class="progress-bar-wrap">
        <div class="progress-bar-fill" style="width:${progressPct}%"></div>
      </div>
      <div style="text-align:center;font-size:0.85rem;color:var(--text-mid);margin-bottom:10px">
        Weiche ${c.index + 1} von 10
      </div>
      
      <!-- Train Scene -->
      <div class="train-track" id="train-scene">
        <svg viewBox="0 0 300 160" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0;width:100%;height:100%">
          <!-- Sky -->
          <rect width="300" height="160" fill="${q.theme.bg}"/>
          <!-- Mountains -->
          <polygon points="0,160 50,60 100,160" fill="#8FAF6F" opacity="0.5"/>
          <polygon points="60,160 130,40 200,160" fill="#7A9C5E" opacity="0.6"/>
          <polygon points="160,160 230,55 300,160" fill="#6B8D4F" opacity="0.5"/>
          <!-- Snow caps -->
          <polygon points="50,60 65,80 35,80" fill="white" opacity="0.8"/>
          <polygon points="130,40 148,68 112,68" fill="white" opacity="0.8"/>
          <polygon points="230,55 248,80 212,80" fill="white" opacity="0.8"/>
          <!-- Main track -->
          <line x1="150" y1="155" x2="150" y2="80" stroke="${q.theme.rail}" stroke-width="4"/>
          <!-- Track ties -->
          ${[100,110,120,130,140].map(y => `<line x1="138" y1="${y}" x2="162" y2="${y}" stroke="${q.theme.rail}" stroke-width="2" opacity="0.6"/>`).join('')}
          <!-- Left branch -->
          <line x1="150" y1="80" x2="60" y2="40" stroke="${q.theme.rail}" stroke-width="3" id="track-left"/>
          <!-- Right branch -->
          <line x1="150" y1="80" x2="240" y2="40" stroke="${q.theme.rail}" stroke-width="3" id="track-right"/>
          <!-- Station left -->
          <text x="45" y="38" text-anchor="middle" font-size="20">${q.theme.station}</text>
          <!-- Station right -->
          <text x="255" y="38" text-anchor="middle" font-size="20">${q.theme.station}</text>
          <!-- Train (locomotive) -->
          <g id="train-anim" transform="translate(138, 130)">
            <rect x="0" y="0" width="24" height="18" rx="3" fill="#E74C3C"/>
            <rect x="4" y="-6" width="14" height="10" rx="2" fill="#C0392B"/>
            <circle cx="5" cy="18" r="3" fill="#2C3E50"/>
            <circle cx="19" cy="18" r="3" fill="#2C3E50"/>
            <rect x="8" y="4" width="8" height="5" rx="1" fill="#F39C12"/>
            <text x="4" y="12" font-size="9" fill="white">🚂</text>
          </g>
          <!-- Switch indicator -->
          <circle cx="150" cy="80" r="8" fill="#F39C12" opacity="0.9"/>
          <text x="150" y="84" text-anchor="middle" font-size="10">⚡</text>
        </svg>
      </div>

      <!-- Question -->
      <div class="train-question">
        <span style="font-size:1.5rem">❓</span> ${q.question}
      </div>

      <!-- Switch buttons -->
      <div class="switch-buttons">
        <button class="switch-btn switch-btn-left" onclick="TrainGame._choose('left')" ${c.animating ? 'disabled' : ''}>
          ◀ ${q.left}
        </button>
        <button class="switch-btn switch-btn-right" onclick="TrainGame._choose('right')" ${c.animating ? 'disabled' : ''}>
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

    // Animate train direction
    const trainEl = document.getElementById('train-anim');
    const leftTrack = document.getElementById('track-left');
    const rightTrack = document.getElementById('track-right');

    if (direction === 'left' && leftTrack) leftTrack.style.strokeWidth = '5';
    if (direction === 'right' && rightTrack) rightTrack.style.strokeWidth = '5';

    // Disable buttons
    document.querySelectorAll('.switch-btn').forEach(btn => {
      btn.disabled = true;
      if (btn.classList.contains(`switch-btn-${direction}`)) {
        btn.style.background = correct
          ? 'linear-gradient(135deg,#27AE60,#1E8449)'
          : 'linear-gradient(135deg,#E74C3C,#C0392B)';
      }
    });

    c.results.push(correct);
    if (correct) c.score += 10;

    setTimeout(() => {
      c.index++;
      c.animating = false;
      this._render();
    }, 1200);
  },

  _showResult() {
    const c = this.current;
    const correctCount = c.results.filter(Boolean).length;
    const score = c.score;

    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center;padding:20px 0">
        <div style="font-size:3.5rem">🚂🏁</div>
        <div style="font-family:'Fredoka One',cursive;font-size:1.8rem;color:var(--mountain-dark);margin:12px 0">
          ${correctCount}/10 Weichen richtig!
        </div>
        <div style="color:var(--text-mid);margin-bottom:20px">
          ${correctCount >= 7 ? '🏆 Der Zug ist pünktlich angekommen!' : '😅 Nächstes Mal klappt es besser!'}
        </div>
        <div class="score-badge" style="display:inline-flex;margin-bottom:20px">⭐ ${score} Punkte</div>
        <br>
        <button class="btn btn-primary btn-full" onclick="TrainGame._finish(${score})">Weiter ➜</button>
      </div>
    `;
  },

  _finish(score) {
    if (this.current.onComplete) {
      this.current.onComplete({ score, passed: score >= 60 });
    }
  }
};

window.TrainGame = TrainGame;
