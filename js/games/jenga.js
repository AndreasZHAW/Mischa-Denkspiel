/**
 * games/jenga.js — Jenga-Turm Spiel
 * 10 Versuche: beantworte Fragen richtig, sonst wackelt der Turm!
 * Falsche Antworten = Stein fällt raus → Turm kann einstürzen
 */

const JengaGame = {
  current: null,

  start(config) {
    const { worldId = 1, ageGroup = 'einfach', onComplete } = config;
    JengaGame._lastConfig = config;

    const questions = this._generateQuestions(worldId, ageGroup);
    this.current = {
      questions,
      index: 0,
      bricks: Array.from({ length: 15 }, (_, i) => ({ id: i, removed: false, shaky: false })),
      removedCount: 0,
      errors: 0,
      startTime: Date.now(),
      phase: 'question', // 'question' | 'result' | 'fallen'
      lastCorrect: null,
      onComplete,
    };
    this._render();
  },

  _generateQuestions(worldId, ageGroup) {
    const banks = {
      1: [ // Wald
        { q: 'Was klingt wie "Wald"?', opts: ['Kalt','Feld','Geld','Welt'], a: 0 },
        { q: '6 × 6 = ?',  opts: ['32','36','38','42'], a: 1 },
        { q: '6 × 7 = ?',  opts: ['40','42','44','48'], a: 1 },
        { q: '6 × 8 = ?',  opts: ['44','46','48','52'], a: 2 },
        { q: '6 × 9 = ?',  opts: ['52','54','56','58'], a: 1 },
        { q: 'Wie viele Beine hat eine Spinne?', opts: ['6','8','10','12'], a: 1 },
        { q: '7 × 7 = ?',  opts: ['45','47','49','51'], a: 2 },
        { q: '7 × 8 = ?',  opts: ['54','56','58','60'], a: 1 },
        { q: 'Was fressen Rehe?', opts: ['Fleisch','Pflanzen','Fisch','Käse'], a: 1 },
        { q: '9 × 9 = ?',  opts: ['79','81','83','85'], a: 1 },
      ],
      2: [ // Skilift
        { q: 'Auf welchem Berg liegt die Schweiz hauptsächlich?', opts: ['Himalaya','Alpen','Anden','Rocky'], a: 1 },
        { q: '8 × 7 = ?',  opts: ['52','54','56','58'], a: 2 },
        { q: 'Wie viele Meter hat 1 km?', opts: ['10','100','1000','10000'], a: 2 },
        { q: '9 × 6 = ?',  opts: ['52','54','56','58'], a: 1 },
        { q: 'Was misst man mit einem Thermometer?', opts: ['Druck','Höhe','Temperatur','Geschwindigkeit'], a: 2 },
        { q: '8 × 8 = ?',  opts: ['60','62','64','66'], a: 2 },
        { q: '150 + 75 = ?', opts: ['215','220','225','230'], a: 2 },
        { q: 'Wie heisst die Hauptstadt der Schweiz?', opts: ['Zürich','Genf','Bern','Basel'], a: 2 },
        { q: '9 × 8 = ?',  opts: ['68','70','72','74'], a: 2 },
        { q: '12 × 12 = ?', opts: ['132','140','144','148'], a: 2 },
      ],
      3: [ // Restaurant
        { q: 'Wie viel ist die Hälfte von 200?', opts: ['50','80','100','120'], a: 2 },
        { q: 'Was ist ein Rösti?', opts: ['Ein Kuchen','Ein Kartoffelgericht','Eine Suppe','Ein Salat'], a: 1 },
        { q: '15 × 4 = ?', opts: ['55','60','65','70'], a: 1 },
        { q: 'Wie viel Gramm hat 1 kg?', opts: ['10','100','500','1000'], a: 3 },
        { q: '25 × 4 = ?', opts: ['90','95','100','105'], a: 2 },
        { q: 'Was bedeutet "Bon appétit"?', opts: ['Hallo','Guten Appetit','Danke','Tschüss'], a: 1 },
        { q: '11 × 11 = ?', opts: ['111','121','131','141'], a: 1 },
        { q: 'Welches Tier gibt uns Milch?', opts: ['Pferd','Schaf','Kuh','Ziege'], a: 2 },
        { q: '13 × 7 = ?', opts: ['85','89','91','93'], a: 2 },
        { q: '200 ÷ 4 = ?', opts: ['40','45','50','55'], a: 2 },
      ],
      4: [ // Schneeschuh
        { q: 'Bei welcher Temperatur gefriert Wasser?', opts: ['-10°C','0°C','5°C','10°C'], a: 1 },
        { q: '14 × 6 = ?', opts: ['80','82','84','86'], a: 2 },
        { q: 'Wie viele cm hat 1 m?', opts: ['10','50','100','1000'], a: 2 },
        { q: '17 × 5 = ?', opts: ['80','85','90','95'], a: 1 },
        { q: 'Was ist eine Lawine?', opts: ['Ein Wind','Schnee der den Berg runterrutscht','Ein See','Ein Tier'], a: 1 },
        { q: '16 × 8 = ?', opts: ['120','124','128','132'], a: 2 },
        { q: '250 + 375 = ?', opts: ['600','615','625','635'], a: 2 },
        { q: 'Wie viele Monate hat ein Jahr?', opts: ['10','11','12','13'], a: 2 },
        { q: '18 × 9 = ?', opts: ['154','158','162','166'], a: 2 },
        { q: '144 ÷ 12 = ?', opts: ['10','11','12','13'], a: 2 },
      ],
      5: [ // Ski
        { q: 'Wie heisst das schnellste Skirennen?', opts: ['Slalom','Super-G','Abfahrt','Riesenslalom'], a: 2 },
        { q: '19 × 7 = ?', opts: ['127','131','133','137'], a: 2 },
        { q: '24 × 8 = ?', opts: ['188','192','196','200'], a: 1 },
        { q: 'Was ist √144?', opts: ['10','11','12','13'], a: 2 },
        { q: '35 × 12 = ?', opts: ['400','410','420','430'], a: 2 },
        { q: 'Wie viele Sekunden hat 1 Minute?', opts: ['50','60','70','100'], a: 1 },
        { q: '125 × 8 = ?', opts: ['900','950','1000','1050'], a: 2 },
        { q: 'Was ist 15% von 200?', opts: ['20','25','30','35'], a: 2 },
        { q: '999 + 1 = ?', opts: ['1000','1001','999','998'], a: 0 },
        { q: '23 × 23 = ?', opts: ['519','521','529','539'], a: 2 },
      ],
    };

    return (banks[worldId] || banks[1]).sort(() => Math.random() - 0.5);
  },

  _render() {
    const c = this.current;
    if (c.index >= c.questions.length) { this._showResult(); return; }

    const q = c.questions[c.index];
    const bricksTotal = c.bricks.length;
    const bricksLeft = c.bricks.filter(b => !b.removed).length;
    const towerPct = bricksLeft / bricksTotal;

    document.getElementById('game-area').innerHTML = `
      <div style="display:flex;gap:16px;align-items:flex-start">

        <!-- Tower visual -->
        <div style="flex-shrink:0;width:70px">
          <div style="font-size:0.7rem;color:var(--text-mid);text-align:center;margin-bottom:4px">${bricksLeft} Steine</div>
          <div style="display:flex;flex-direction:column;gap:2px;align-items:center" id="jenga-tower">
            ${this._renderTower()}
          </div>
        </div>

        <!-- Question area -->
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;font-size:0.8rem;color:var(--text-mid);margin-bottom:10px">
            <span>Frage ${c.index + 1}/${c.questions.length}</span>
            <span>❌ ${c.errors} Fehler</span>
          </div>

          <div style="background:linear-gradient(135deg,#EBF5FB,#D6EAF8);border-radius:14px;padding:16px;margin-bottom:14px;font-weight:700;font-size:1rem;color:var(--mountain-dark);min-height:60px;display:flex;align-items:center">
            ${q.q}
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            ${q.opts.map((opt, oi) => `
              <button class="math-answer-btn" onclick="JengaGame._answer(${oi})"
                style="font-size:0.95rem;padding:12px 8px">
                ${opt}
              </button>
            `).join('')}
          </div>

          ${c.lastCorrect === false ? `
            <div style="color:#E74C3C;font-size:0.85rem;margin-top:8px;text-align:center;animation:shake 0.4s">
              ❌ Falsch! Ein Stein fällt raus...
            </div>
          ` : c.lastCorrect === true ? `
            <div style="color:#27AE60;font-size:0.85rem;margin-top:8px;text-align:center">
              ✅ Richtig! Turm steht noch!
            </div>
          ` : ''}
        </div>
      </div>
    `;
  },

  _renderTower() {
    const c = this.current;
    return c.bricks.map(brick => {
      if (brick.removed) {
        return `<div style="width:60px;height:14px;background:transparent;border:1px dashed rgba(0,0,0,0.1);border-radius:4px"></div>`;
      }
      const colors = ['#D4A04A','#C49035','#E8B455','#BF8C2A'];
      const color = colors[brick.id % colors.length];
      return `<div style="width:${brick.shaky ? '54px' : '60px'};height:14px;background:${color};border-radius:4px;
        box-shadow:0 2px 4px rgba(0,0,0,0.2);transition:all 0.3s;
        ${brick.shaky ? 'animation:shake 0.3s ease;' : ''}">
      </div>`;
    }).reverse().join('');
  },

  _answer(chosenIdx) {
    const c = this.current;
    const q = c.questions[c.index];
    const correct = chosenIdx === q.a;
    c.lastCorrect = correct;

    document.querySelectorAll('.math-answer-btn').forEach((btn, i) => {
      btn.disabled = true;
      if (i === q.a) btn.classList.add('correct');
      if (i === chosenIdx && !correct) btn.classList.add('wrong');
    });

    if (!correct) {
      c.errors++;
      // Remove a random brick from the lower portion
      const available = c.bricks.filter((b, i) => !b.removed && i < 12);
      if (available.length > 0) {
        const pick = available[Math.floor(Math.random() * available.length)];
        pick.shaky = true;
        setTimeout(() => { pick.removed = true; pick.shaky = false; c.removedCount++; }, 500);
      }

      // Check if tower has fallen (more than 8 bricks removed)
      if (c.removedCount >= 8) {
        setTimeout(() => { c.phase = 'fallen'; this._showFallen(); }, 800);
        return;
      }
    }

    setTimeout(() => {
      c.index++;
      c.lastCorrect = null;
      if (c.index >= c.questions.length) this._showResult();
      else this._render();
    }, 1000);
  },

  _showFallen() {
    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center;padding:20px">
        <div style="font-size:4rem;animation:shake 0.5s">💥</div>
        <div style="font-family:'Fredoka One',cursive;font-size:1.8rem;color:#E74C3C;margin:12px 0">
          Der Turm ist gefallen!
        </div>
        <div style="color:var(--text-mid);margin-bottom:20px">
          Zu viele Fehler... 😅 Versuche es nochmal!
        </div>
        <div style="display:flex;flex-direction:column;gap:10px">
          <button class="btn btn-secondary btn-full" onclick="JengaGame.start(JengaGame._lastConfig)">🔄 Nochmal</button>
          <button class="btn btn-primary btn-full" onclick="JengaGame._finish(20)">Trotzdem weiter ➜</button>
        </div>
      </div>
    `;
  },

  _showResult() {
    const c = this.current;
    const correct = c.questions.length - c.errors;
    const bricksLeft = c.bricks.filter(b => !b.removed).length;
    const rawScore = Math.round((correct / c.questions.length) * 100);
    const timeMs = Date.now() - c.startTime;
    const finalScore = State.calcFinalScore({ rawScore, timeMs, errors: c.errors, passed: correct >= 6 });

    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center;padding:20px 0">
        <div style="font-size:3rem">${bricksLeft >= 10 ? '🗼🏆' : bricksLeft >= 7 ? '🗼😊' : '🗼😅'}</div>
        <div style="font-family:'Fredoka One',cursive;font-size:1.8rem;color:var(--mountain-dark);margin:10px 0">
          ${correct}/${c.questions.length} richtig!
        </div>
        <div style="color:var(--text-mid);margin-bottom:8px">
          Turm: ${bricksLeft}/15 Steine stehen noch
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:12px 0">
          <div style="background:#F0F9FF;border-radius:10px;padding:10px;font-size:0.8rem">
            <div style="font-size:1.2rem">🏗️</div><b>${bricksLeft}</b><br><span style="color:var(--text-mid)">Steine</span>
          </div>
          <div style="background:#FFF5F5;border-radius:10px;padding:10px;font-size:0.8rem">
            <div style="font-size:1.2rem">❌</div><b>${c.errors}</b><br><span style="color:var(--text-mid)">Fehler</span>
          </div>
          <div style="background:#FFFFF0;border-radius:10px;padding:10px;font-size:0.8rem">
            <div style="font-size:1.2rem">⭐</div><b>${finalScore}</b><br><span style="color:var(--text-mid)">Punkte</span>
          </div>
        </div>
        <button class="btn btn-primary btn-full" onclick="JengaGame._finish(${finalScore}, ${timeMs}, ${c.errors})">Weiter ➜</button>
      </div>
    `;
  },

  _finish(score, timeMs = 0, errors = 0) {
    if (this.current?.onComplete) {
      this.current.onComplete({ rawScore: score, timeMs, errors, passed: score >= 30 });
    }
  },

  _lastConfig: null,
};

window.JengaGame = JengaGame;
