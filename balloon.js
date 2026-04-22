/**
 * games/balloon.js — Ballon-Knall Mathe
 * Eine Rechenaufgabe erscheint, 4 Ballons mit Zahlen fliegen hoch.
 * Tippe auf den richtigen Ballon! Falscher Ballon = platzt rot.
 * 10 Runden, Zeitdruck, Fehler kosten Punkte.
 */

const BalloonGame = {
  current: null,
  _lastConfig: null,

  // Welt-Farbthemen
  _themes: {
    1:['#2980B9','#E74C3C','#27AE60','#F39C12'],
    2:['#8E44AD','#E74C3C','#2980B9','#F39C12'],
    3:['#27AE60','#2980B9','#E74C3C','#F39C12'],
    4:['#E67E22','#E74C3C','#27AE60','#9B59B6'],
    5:['#E74C3C','#F39C12','#27AE60','#2980B9'],
    6:['#16A085','#27AE60','#E67E22','#2980B9'],
    7:['#D35400','#E74C3C','#27AE60','#9B59B6'],
    8:['#E30613','#E67E22','#2980B9','#27AE60'],
    9:['#7F8C8D','#2C3E50','#E67E22','#27AE60'],
    10:['#2C3E50','#8E44AD','#27AE60','#E67E22'],
  },

  start(config) {
    const { ageGroup = 'einfach', worldId = 1, onComplete } = config;
    BalloonGame._lastConfig = config;
    this.current = {
      round: 0, totalRounds: 10,
      results: [], errors: 0,
      startTime: Date.now(),
      ageGroup, worldId,
      onComplete,
      answered: false,
    };
    this._nextRound();
  },

  _genQuestion(ageGroup, worldId) {
    const diff = worldId;
    const ops = ageGroup === 'sehr_einfach' ? ['+'] :
                ageGroup === 'einfach'       ? ['+','-'] :
                ageGroup === 'mittel'        ? ['+','-','×'] : ['+','-','×','÷'];
    const op = ops[Math.floor(Math.random()*ops.length)];
    const max = ageGroup === 'sehr_einfach' ? 10 :
                ageGroup === 'einfach'       ? 20 + diff*3 :
                ageGroup === 'mittel'        ? 50 + diff*5 : 100 + diff*5;
    let a, b, answer;
    if (op==='+') { a=Math.floor(Math.random()*max)+1; b=Math.floor(Math.random()*max)+1; answer=a+b; }
    else if (op==='-') { a=Math.floor(Math.random()*max)+max/2; b=Math.floor(Math.random()*(a-1))+1; answer=a-b; }
    else if (op==='×') { a=Math.floor(Math.random()*9)+2; b=Math.floor(Math.random()*9)+2; answer=a*b; }
    else { b=Math.floor(Math.random()*8)+2; answer=Math.floor(Math.random()*8)+2; a=b*answer; }
    // 3 wrong answers
    const wrongs = new Set();
    while (wrongs.size < 3) {
      let w = answer + (Math.random()>0.5?1:-1)*(Math.floor(Math.random()*Math.max(5,Math.ceil(answer*0.3)))+1);
      if (w>0 && w!==answer) wrongs.add(w);
    }
    const options = [answer,...wrongs].sort(()=>Math.random()-0.5);
    return { a, b, op, answer, options };
  },

  _nextRound() {
    const c = this.current;
    if (c.round >= c.totalRounds) { this._showResult(); return; }
    c.answered = false;
    const q = this._genQuestion(c.ageGroup, c.worldId);
    c.currentQ = q;
    const colors = this._themes[c.worldId] || this._themes[1];

    document.getElementById('game-area').innerHTML = `
      <div style="position:relative;overflow:hidden;border-radius:16px;min-height:340px;
        background:linear-gradient(180deg,#87CEEB 0%,#B8DCE8 60%,#D4EDDA 100%)">

        <!-- Header -->
        <div style="display:flex;justify-content:space-between;padding:10px 14px;font-size:0.8rem;color:rgba(0,0,0,0.6)">
          <span>Runde <b>${c.round+1}/10</b></span>
          <span>❌ ${c.errors} Fehler</span>
        </div>

        <!-- Question -->
        <div style="text-align:center;padding:10px 0 20px;font-family:'Fredoka One',cursive;
          font-size:2.2rem;color:#2C3E50;text-shadow:0 2px 4px rgba(255,255,255,0.8)">
          ${q.a} ${q.op} ${q.b} = ?
        </div>

        <!-- Balloons -->
        <div style="display:flex;justify-content:center;gap:14px;padding:0 10px;flex-wrap:wrap">
          ${q.options.map((opt, i) => `
            <div id="balloon-${i}" onclick="BalloonGame._pop(${i},${opt===q.answer},${opt})"
              style="cursor:pointer;animation:floatUp ${1.5+i*0.3}s ease-in-out infinite alternate;
                text-align:center;user-select:none;-webkit-user-select:none">
              <!-- Balloon body -->
              <div style="width:72px;height:88px;background:${colors[i%4]};border-radius:50% 50% 48% 48%;
                display:flex;align-items:center;justify-content:center;
                box-shadow:inset -6px -8px 0 rgba(0,0,0,0.15),0 6px 16px rgba(0,0,0,0.2);
                font-family:'Fredoka One',cursive;font-size:1.3rem;color:white;
                transition:transform 0.15s;position:relative">
                ${opt}
                <!-- Shine -->
                <div style="position:absolute;top:14px;left:18px;width:16px;height:10px;
                  background:rgba(255,255,255,0.35);border-radius:50%;transform:rotate(-30deg)"></div>
              </div>
              <!-- String -->
              <div style="width:2px;height:30px;background:${colors[i%4]};margin:0 auto;opacity:0.6"></div>
            </div>
          `).join('')}
        </div>

        <!-- Progress dots -->
        <div style="display:flex;justify-content:center;gap:6px;padding:18px 0 10px">
          ${Array.from({length:10},(_,i)=>{
            const r=c.results[i];
            return `<div style="width:10px;height:10px;border-radius:50%;background:${
              r===true?'#27AE60':r===false?'#E74C3C':'rgba(255,255,255,0.5)'}"></div>`;
          }).join('')}
        </div>
      </div>

      <style>
        @keyframes floatUp {
          0%{transform:translateY(0) rotate(-3deg)}
          100%{transform:translateY(-14px) rotate(3deg)}
        }
        @keyframes popBurst {
          0%{transform:scale(1);opacity:1}
          50%{transform:scale(1.5);opacity:0.5}
          100%{transform:scale(0);opacity:0}
        }
      </style>`;
  },

  _pop(index, correct, value) {
    const c = this.current;
    if (c.answered) return;
    c.answered = true;

    if (!correct) c.errors++;
    c.results[c.round] = correct;

    // Animate
    const balloon = document.getElementById(`balloon-${index}`);
    if (balloon) {
      balloon.style.animation = 'popBurst 0.4s ease forwards';
      balloon.children[0].textContent = correct ? '✅' : '💥';
    }

    // Show all answers briefly
    c.currentQ.options.forEach((opt, i) => {
      const b = document.getElementById(`balloon-${i}`);
      if (b && i !== index) {
        b.children[0].style.opacity = '0.4';
        if (opt === c.currentQ.answer) {
          b.children[0].style.background = '#27AE60';
          b.children[0].style.transform = 'scale(1.1)';
        }
      }
    });

    setTimeout(() => {
      c.round++;
      this._nextRound();
    }, correct ? 700 : 1200);
  },

  _showResult() {
    const c = this.current;
    const correct = c.results.filter(Boolean).length;
    const timeMs = Date.now() - c.startTime;
    const rawScore = Math.round((correct/10)*100);
    const finalScore = State.calcFinalScore({rawScore, timeMs, errors:c.errors, passed:correct>=6});

    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center;padding:20px 0">
        <div style="font-size:3rem">${correct>=8?'🎈🏆':correct>=6?'🎈😊':'🎈😅'}</div>
        <div style="font-family:'Fredoka One',cursive;font-size:1.7rem;color:var(--mountain-dark);margin:10px 0">
          ${correct}/10 Ballons richtig!
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
        <div style="display:flex;flex-direction:column;gap:10px">
          ${correct<6?`<button class="btn btn-secondary btn-full" onclick="BalloonGame.start(BalloonGame._lastConfig)">🔄 Nochmal</button>`:''}
          <button class="btn btn-primary btn-full" onclick="BalloonGame._finish(${finalScore},${timeMs},${c.errors})">Weiter ➜</button>
        </div>
      </div>`;
  },

  _finish(score, timeMs, errors) {
    if (this.current?.onComplete) this.current.onComplete({rawScore:score,timeMs,errors,passed:score>=40});
  },
};

window.BalloonGame = BalloonGame;
