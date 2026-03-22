/**
 * games/math.js — Rechenspiel
 * Passt sich dem Alter an (ageGroup)
 */

const MathGame = {
  current: null,

  /**
   * Startet das Rechenspiel
   * @param {Object} config - { ageGroup, worldId, onComplete }
   */
  start(config) {
    const { ageGroup = 'einfach', worldId = 1, onComplete } = config;
    this.current = {
      questions: this._generateQuestions(ageGroup, worldId),
      index: 0,
      results: [],
      onComplete,
    };
    this._render();
  },

  /** Aufgaben generieren nach Alter & Welt */
  _generateQuestions(ageGroup, worldId) {
    const count = 10;
    const questions = [];
    const difficulty = worldId; // 1=leicht ... 5=schwer

    for (let i = 0; i < count; i++) {
      let a, b, op, answer;
      const ops = this._getOps(ageGroup, difficulty);
      op = ops[Math.floor(Math.random() * ops.length)];
      const range = this._getRange(ageGroup, difficulty);

      if (op === '+') {
        a = this._rand(range.min, range.max);
        b = this._rand(range.min, range.max);
        answer = a + b;
      } else if (op === '-') {
        a = this._rand(range.min + range.max / 2, range.max);
        b = this._rand(range.min, Math.floor(a / 2));
        answer = a - b;
      } else if (op === '×') {
        a = this._rand(2, range.multMax);
        b = this._rand(2, range.multMax);
        answer = a * b;
      } else if (op === '÷') {
        b = this._rand(2, range.divMax);
        answer = this._rand(2, range.divMax);
        a = b * answer;
      }

      // Falsche Antworten generieren
      const wrong = this._generateWrongAnswers(answer, op);

      questions.push({ a, b, op, answer, wrong });
    }
    return questions;
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
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  _generateWrongAnswers(correct, op) {
    const wrongs = new Set();
    while (wrongs.size < 3) {
      let offset = this._rand(1, Math.max(3, Math.ceil(correct * 0.3)));
      if (Math.random() > 0.5) offset = -offset;
      const w = correct + offset;
      if (w !== correct && w > 0) wrongs.add(w);
    }
    return Array.from(wrongs);
  },

  _render() {
    const c = this.current;
    if (!c || c.index >= c.questions.length) {
      this._showResult();
      return;
    }

    const q = c.questions[c.index];
    const allAnswers = [q.answer, ...q.wrong].sort(() => Math.random() - 0.5);

    const dotsHTML = c.questions.map((_, i) => {
      const res = c.results[i];
      let cls = 'pending';
      if (res === true) cls = 'correct';
      if (res === false) cls = 'wrong';
      return `<div class="math-dot ${cls}"></div>`;
    }).join('');

    document.getElementById('game-area').innerHTML = `
      <div class="math-problem">
        <div class="math-progress-dots">${dotsHTML}</div>
        <div class="math-equation">${q.a} ${q.op} ${q.b} = ?</div>
        <div style="font-size:0.85rem;color:var(--text-mid)">Aufgabe ${c.index + 1} von 10</div>
      </div>
      <div class="math-answers" id="math-answers">
        ${allAnswers.map(ans => `
          <button class="math-answer-btn" onclick="MathGame._answer(${ans})">${ans}</button>
        `).join('')}
      </div>
    `;
  },

  _answer(chosen) {
    const c = this.current;
    const q = c.questions[c.index];
    const correct = chosen === q.answer;
    c.results[c.index] = correct;

    // Visuelle Rückmeldung
    document.querySelectorAll('.math-answer-btn').forEach(btn => {
      btn.disabled = true;
      if (parseInt(btn.textContent) === q.answer) btn.classList.add('correct');
      if (parseInt(btn.textContent) === chosen && !correct) btn.classList.add('wrong');
    });

    setTimeout(() => {
      c.index++;
      this._render();
    }, 900);
  },

  _showResult() {
    const c = this.current;
    const correct = c.results.filter(Boolean).length;
    const score = Math.round((correct / 10) * 100);
    const passed = correct >= 6; // mind. 6/10 richtig

    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center;padding:20px 0">
        <div style="font-size:3.5rem">${passed ? '🌟' : '😅'}</div>
        <div style="font-family:'Fredoka One',cursive;font-size:1.8rem;color:var(--mountain-dark);margin:12px 0">
          ${correct}/10 richtig!
        </div>
        <div style="color:var(--text-mid);margin-bottom:20px">
          ${passed ? 'Super gemacht! ⭐' : 'Nicht ganz - versuche es nochmal!'}
        </div>
        <div style="display:flex;gap:12px;flex-direction:column">
          ${passed 
            ? `<button class="btn btn-primary btn-full" onclick="MathGame._finish(${score})">Weiter ➜</button>`
            : `<button class="btn btn-secondary btn-full" onclick="MathGame.start(MathGame._lastConfig)">Nochmal versuchen 🔄</button>
               <button class="btn btn-primary btn-full" onclick="MathGame._finish(${score})">Trotzdem weiter ➜</button>`
          }
        </div>
      </div>
    `;
  },

  _finish(score) {
    if (this.current.onComplete) {
      this.current.onComplete({ score, passed: score >= 60 });
    }
  },

  // Für Neustart gespeichert
  _lastConfig: null,
};

// Überschreibung damit retry funktioniert
const _origStart = MathGame.start.bind(MathGame);
MathGame.start = function(config) {
  MathGame._lastConfig = config;
  _origStart(config);
};

window.MathGame = MathGame;
