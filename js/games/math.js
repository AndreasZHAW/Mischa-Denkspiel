/**
 * games/math.js — Rechenspiel v2
 * - Zeiterfassung & Fehlerstrafe
 * - Welt 1: Fokus auf Mal-Reihen (5×6, 6×6, 6×7, 6×8, 6×9 etc.)
 * - Altersangepasst
 */

const MathGame = {
  current: null,

  start(config) {
    const { ageGroup = 'einfach', worldId = 1, onComplete } = config;
    MathGame._lastConfig = config;
    this.current = {
      questions: this._generateQuestions(ageGroup, worldId),
      index: 0,
      results: [],
      errors: 0,
      startTime: Date.now(),
      questionStartTime: Date.now(),
      onComplete,
      ageGroup,
      worldId,
    };
    this._render();
  },

  _generateQuestions(ageGroup, worldId) {
    const count = 10;
    const questions = [];

    for (let i = 0; i < count; i++) {
      let q;

      // Welt 1: Malreihen-Fokus (5×6, 6×6, 6×7, 6×8, 6×9, 7×7, 7×8 etc.)
      if (worldId === 1 && ageGroup !== 'sehr_einfach') {
        q = this._makeTimesTableQ(ageGroup, i);
      } else {
        q = this._makeGeneralQ(ageGroup, worldId, i);
      }

      // Falsche Antworten
      q.wrong = this._generateWrongAnswers(q.answer, q.op);
      questions.push(q);
    }
    return questions;
  },

  /** Malreihen-Aufgaben für Welt 1 */
  _makeTimesTableQ(ageGroup, index) {
    // Für kleine Kinder: einfache Reihen; für ältere: 6-9er Reihen
    const easyPairs = [[2,2],[2,3],[2,4],[2,5],[3,3],[3,4],[3,5],[4,4],[4,5],[5,5]];
    const medPairs  = [[5,6],[5,7],[5,8],[5,9],[6,6],[6,7],[6,8],[6,9],[7,7],[7,8]];
    const hardPairs = [[6,6],[6,7],[6,8],[6,9],[7,7],[7,8],[7,9],[8,8],[8,9],[9,9]];

    let pool;
    if (ageGroup === 'einfach')      pool = [...easyPairs, ...medPairs];
    else if (ageGroup === 'mittel')  pool = [...medPairs, ...hardPairs];
    else                              pool = hardPairs;

    const [a, b] = pool[index % pool.length];
    return { a, b, op: '×', answer: a * b };
  },

  /** Allgemeine Aufgaben */
  _makeGeneralQ(ageGroup, worldId, index) {
    const difficulty = worldId;
    const ops = this._getOps(ageGroup, difficulty);
    const op = ops[Math.floor(Math.random() * ops.length)];
    const range = this._getRange(ageGroup, difficulty);
    let a, b, answer;

    if (op === '+') {
      a = this._rand(range.min, range.max);
      b = this._rand(range.min, range.max);
      answer = a + b;
    } else if (op === '-') {
      a = this._rand(range.max / 2, range.max);
      b = this._rand(range.min, Math.floor(a / 2));
      answer = a - b;
    } else if (op === '×') {
      a = this._rand(2, range.multMax);
      b = this._rand(2, range.multMax);
      answer = a * b;
    } else {
      b = this._rand(2, range.divMax);
      answer = this._rand(2, range.divMax);
      a = b * answer;
    }
    return { a, b, op, answer };
  },

  _getOps(ageGroup, difficulty) {
    if (ageGroup === 'sehr_einfach') return ['+', '-'];
    if (ageGroup === 'einfach') return difficulty <= 2 ? ['+', '-'] : ['+', '-', '×'];
    if (ageGroup === 'mittel') return difficulty <= 3 ? ['+', '-', '×'] : ['+', '-', '×', '÷'];
    return ['+', '-', '×', '÷'];
  },

  _getRange(ageGroup, difficulty) {
    const base = { sehr_einfach: 10, einfach: 20, mittel: 50, schwer: 100 };
    const max = (base[ageGroup] || 20) + difficulty * 5;
    return { min: 1, max, multMax: Math.min(10 + difficulty, 15), divMax: Math.min(8 + difficulty, 12) };
  },

  _rand(min, max) {
    return Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1)) + Math.ceil(min);
  },

  _generateWrongAnswers(correct, op) {
    const wrongs = new Set();
    let attempts = 0;
    while (wrongs.size < 3 && attempts < 40) {
      attempts++;
      let offset = this._rand(1, Math.max(4, Math.ceil(Math.abs(correct) * 0.25)));
      if (Math.random() > 0.5) offset = -offset;
      const w = correct + offset;
      if (w !== correct && w >= 0) wrongs.add(w);
    }
    // Fallback
    while (wrongs.size < 3) wrongs.add(correct + wrongs.size + 1);
    return Array.from(wrongs);
  },

  _render() {
    const c = this.current;
    if (!c || c.index >= c.questions.length) { this._showResult(); return; }

    const q = c.questions[c.index];
    const allAnswers = [q.answer, ...q.wrong].sort(() => Math.random() - 0.5);
    c.questionStartTime = Date.now();

    const dotsHTML = c.questions.map((_, i) => {
      const res = c.results[i];
      let cls = 'pending';
      if (res === true) cls = 'correct';
      if (res === false) cls = 'wrong';
      return `<div class="math-dot ${cls}"></div>`;
    }).join('');

    // Timer display
    const elapsed = Math.round((Date.now() - c.startTime) / 1000);

    document.getElementById('game-area').innerHTML = `
      <div class="math-problem">
        <div class="math-progress-dots">${dotsHTML}</div>
        <div style="font-size:0.8rem;color:var(--text-mid);margin-bottom:8px">
          Aufgabe ${c.index + 1}/10 &nbsp;·&nbsp; ⏱ ${elapsed}s &nbsp;·&nbsp; ❌ ${c.errors} Fehler
        </div>
        <div class="math-equation">${q.a} ${q.op} ${q.b} = ?</div>
        ${c.worldId === 1 ? `<div style="font-size:0.75rem;color:var(--sky-deep);margin-top:4px">💡 Mal-Reihe!</div>` : ''}
      </div>
      <div class="math-answers" id="math-answers">
        ${allAnswers.map(ans => `
          <button class="math-answer-btn" onclick="MathGame._answer(${ans})">${ans}</button>
        `).join('')}
      </div>
    `;

    // Start per-question timer
    c._qTimer = setInterval(() => {
      const el = document.querySelector('.math-problem > div:nth-child(2)');
      if (el) {
        const e2 = Math.round((Date.now() - c.startTime) / 1000);
        el.textContent = `Aufgabe ${c.index + 1}/10 · ⏱ ${e2}s · ❌ ${c.errors} Fehler`;
      }
    }, 1000);
  },

  _answer(chosen) {
    const c = this.current;
    clearInterval(c._qTimer);
    const q = c.questions[c.index];
    const correct = chosen === q.answer;

    if (!correct) c.errors++;
    c.results[c.index] = correct;

    document.querySelectorAll('.math-answer-btn').forEach(btn => {
      btn.disabled = true;
      const val = parseInt(btn.textContent);
      if (val === q.answer) btn.classList.add('correct');
      if (val === chosen && !correct) btn.classList.add('wrong');
    });

    setTimeout(() => {
      c.index++;
      this._render();
    }, correct ? 700 : 1100);
  },

  _showResult() {
    const c = this.current;
    clearInterval(c?._qTimer);
    const correctCount = c.results.filter(Boolean).length;
    const totalTimeMs = Date.now() - c.startTime;
    const totalTimeSec = Math.round(totalTimeMs / 1000);
    const rawScore = Math.round((correctCount / 10) * 100);
    const finalScore = State.calcFinalScore({ rawScore, timeMs: totalTimeMs, errors: c.errors, passed: correctCount >= 6 });
    const passed = correctCount >= 6;

    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center;padding:20px 0">
        <div style="font-size:3rem">${passed ? '🌟' : '😅'}</div>
        <div style="font-family:'Fredoka One',cursive;font-size:1.8rem;color:var(--mountain-dark);margin:10px 0">
          ${correctCount}/10 richtig!
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:12px 0">
          <div style="background:#F0F9FF;border-radius:10px;padding:10px;font-size:0.8rem">
            <div style="font-size:1.3rem">⏱</div>
            <b>${totalTimeSec}s</b><br><span style="color:var(--text-mid)">Zeit</span>
          </div>
          <div style="background:#FFF5F5;border-radius:10px;padding:10px;font-size:0.8rem">
            <div style="font-size:1.3rem">❌</div>
            <b>${c.errors}</b><br><span style="color:var(--text-mid)">Fehler</span>
          </div>
          <div style="background:#FFFFF0;border-radius:10px;padding:10px;font-size:0.8rem">
            <div style="font-size:1.3rem">⭐</div>
            <b>${finalScore}</b><br><span style="color:var(--text-mid)">Punkte</span>
          </div>
        </div>
        <div style="color:var(--text-mid);margin-bottom:18px;font-size:0.85rem">
          ${passed ? 'Super gemacht! 🏆' : 'Mindestens 6/10 für die nächste Aufgabe!'}
        </div>
        <div style="display:flex;flex-direction:column;gap:10px">
          ${passed
            ? `<button class="btn btn-primary btn-full" onclick="MathGame._finish(${finalScore},${totalTimeMs},${c.errors})">Weiter ➜</button>`
            : `<button class="btn btn-secondary btn-full" onclick="MathGame.start(MathGame._lastConfig)">🔄 Nochmal</button>
               <button class="btn btn-primary btn-full" onclick="MathGame._finish(${finalScore},${totalTimeMs},${c.errors})">Trotzdem weiter ➜</button>`
          }
        </div>
      </div>
    `;
  },

  _finish(score, timeMs, errors) {
    if (this.current?.onComplete) {
      this.current.onComplete({ rawScore: score, timeMs, errors, passed: score > 0 });
    }
  },

  _lastConfig: null,
};

window.MathGame = MathGame;
