/**
 * games/simon.js — Simon Says Farbgedächtnis
 * Eine Sequenz aus Farben wird angezeigt — merke dir die Reihenfolge und tippe sie nach!
 * Beginnt mit 3 Farben, wird länger nach jeder Runde.
 */

const SimonGame = {
  current: null,
  _lastConfig: null,

  // Welt-Farbthemen: jede Welt hat andere Farben
  _worldColors: {
    1:  [{c:'#2980B9',n:{de:'Blau',en:'Blue',fr:'Bleu'}},{c:'#E74C3C',n:{de:'Rot',en:'Red',fr:'Rouge'}},{c:'#27AE60',n:{de:'Grün',en:'Green',fr:'Vert'}},{c:'#F39C12',n:{de:'Gelb',en:'Yellow',fr:'Jaune'}}],
    2:  [{c:'#8E44AD',n:{de:'Lila',en:'Purple',fr:'Violet'}},{c:'#E74C3C',n:{de:'Rot',en:'Red',fr:'Rouge'}},{c:'#F39C12',n:{de:'Gold',en:'Gold',fr:'Or'}},{c:'#2C3E50',n:{de:'Dunkel',en:'Dark',fr:'Sombre'}}],
    3:  [{c:'#3498DB',n:{de:'Blau',en:'Blue',fr:'Bleu'}},{c:'#1ABC9C',n:{de:'Türkis',en:'Turquoise',fr:'Turquoise'}},{c:'#F1C40F',n:{de:'Gelb',en:'Yellow',fr:'Jaune'}},{c:'#FF6B9D',n:{de:'Pink',en:'Pink',fr:'Rose'}}],
    4:  [{c:'#E67E22',n:{de:'Orange',en:'Orange',fr:'Orange'}},{c:'#27AE60',n:{de:'Grün',en:'Green',fr:'Vert'}},{c:'#E74C3C',n:{de:'Rot',en:'Red',fr:'Rouge'}},{c:'#9B59B6',n:{de:'Lila',en:'Purple',fr:'Violet'}}],
    5:  [{c:'#E74C3C',n:{de:'Rot',en:'Red',fr:'Rouge'}},{c:'#F39C12',n:{de:'Orange',en:'Orange',fr:'Orange'}},{c:'#27AE60',n:{de:'Grün',en:'Green',fr:'Vert'}},{c:'#3498DB',n:{de:'Blau',en:'Blue',fr:'Bleu'}}],
    6:  [{c:'#27AE60',n:{de:'Grün',en:'Green',fr:'Vert'}},{c:'#16A085',n:{de:'Dunkelgrün',en:'Dark green',fr:'Vert foncé'}},{c:'#F1C40F',n:{de:'Gelb',en:'Yellow',fr:'Jaune'}},{c:'#E67E22',n:{de:'Orange',en:'Orange',fr:'Orange'}}],
    7:  [{c:'#D35400',n:{de:'Braun',en:'Brown',fr:'Marron'}},{c:'#922B21',n:{de:'Dunkelrot',en:'Dark red',fr:'Rouge foncé'}},{c:'#F39C12',n:{de:'Gold',en:'Gold',fr:'Or'}},{c:'#27AE60',n:{de:'Grün',en:'Green',fr:'Vert'}}],
    8:  [{c:'#E30613',n:{de:'VfB Rot',en:'VfB Red',fr:'Rouge VfB'}},{c:'#FFFFFF',n:{de:'Weiß',en:'White',fr:'Blanc'}},{c:'#2C3E50',n:{de:'Schwarz',en:'Black',fr:'Noir'}},{c:'#F39C12',n:{de:'Gold',en:'Gold',fr:'Or'}}],
    9:  [{c:'#7F8C8D',n:{de:'Grau',en:'Gray',fr:'Gris'}},{c:'#2C3E50',n:{de:'Dunkel',en:'Dark',fr:'Sombre'}},{c:'#3498DB',n:{de:'Blau',en:'Blue',fr:'Bleu'}},{c:'#27AE60',n:{de:'Grün',en:'Green',fr:'Vert'}}],
    10: [{c:'#E74C3C',n:{de:'Rot',en:'Red',fr:'Rouge'}},{c:'#F1C40F',n:{de:'Gelb',en:'Yellow',fr:'Jaune'}},{c:'#3498DB',n:{de:'Blau',en:'Blue',fr:'Bleu'}},{c:'#27AE60',n:{de:'Grün',en:'Green',fr:'Vert'}}],
  },

  start(config) {
    const { worldId = 1, onComplete } = config;
    SimonGame._lastConfig = config;
    const colors = this._worldColors[worldId] || this._worldColors[1];
    this.current = {
      colors,
      sequence: [],
      playerSeq: [],
      round: 0,
      maxRounds: 8,
      phase: 'watch', // 'watch' | 'input' | 'done'
      errors: 0,
      startTime: Date.now(),
      flashing: -1,
      worldId,
      onComplete,
    };
    this._render();
    setTimeout(() => this._nextSequence(), 800);
  },

  _render() {
    const c = this.current;
    const colors = c.colors;
    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center">
        <div style="display:flex;justify-content:space-between;font-size:0.82rem;color:var(--text-mid);margin-bottom:10px">
          <span>Runde <b>${c.round}/${c.maxRounds}</b></span>
          <span>${c.phase==='watch'?(typeof t!=='undefined'?t('simon.watch'):'👀 Schau zu!'):(typeof t!=='undefined'?t('simon.your_turn'):'👆 Deine Reihe!')}</span>
          <span>❌ ${c.errors}</span>
        </div>

        <!-- Sequence length indicator -->
        <div style="display:flex;gap:5px;justify-content:center;margin-bottom:14px">
          ${Array.from({length:c.maxRounds},(_,i)=>`
            <div style="width:22px;height:8px;border-radius:4px;background:${i<c.sequence.length?'#27AE60':'#E0E6EE'}"></div>`).join('')}
        </div>

        <!-- 4 color buttons in 2x2 grid -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;max-width:280px;margin:0 auto 16px">
          ${colors.map((col, i) => `
            <div id="simon-${i}"
              onclick="SimonGame._playerTap(${i})"
              style="height:100px;border-radius:20px;cursor:pointer;
                background:${col.c};
                opacity:${c.phase==='input'?1:0.55};
                display:flex;align-items:center;justify-content:center;
                font-family:'Fredoka One',cursive;font-size:0.9rem;
                color:${col.c==='#FFFFFF'?'#333':'white'};
                text-shadow:0 1px 3px rgba(0,0,0,0.3);
                box-shadow:0 6px 16px rgba(0,0,0,0.2),inset 0 2px 4px rgba(255,255,255,0.2);
                user-select:none;-webkit-user-select:none;
                transition:all 0.15s">
              ${(typeof LANG!=='undefined' && LANG._cur && col.n[LANG._cur]) ? col.n[LANG._cur] : col.n.de}
            </div>`).join('')}
        </div>

        <!-- Player progress -->
        <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;min-height:28px">
          ${c.playerSeq.map((idx,i)=>`
            <div style="width:22px;height:22px;border-radius:50%;background:${colors[idx].c};
              border:2px solid rgba(0,0,0,0.1);box-shadow:0 2px 4px rgba(0,0,0,0.15)"></div>`).join('')}
        </div>

        <div id="simon-msg" style="margin-top:10px;font-size:0.85rem;color:var(--text-mid);min-height:20px">
          ${c.phase==='watch'?(typeof t!=='undefined'?t('simon.watch_sequence'):'Schau dir die Reihenfolge an!'):(typeof t!=='undefined'?t('simon.repeat_sequence'):'Tippe in der gleichen Reihenfolge!')}
        </div>
      </div>`;
  },

  _nextSequence() {
    const c = this.current;
    c.round++;
    c.sequence.push(Math.floor(Math.random() * 4));
    c.playerSeq = [];
    c.phase = 'watch';
    this._render();
    setTimeout(() => this._playSequence(0), 500);
  },

  _playSequence(idx) {
    const c = this.current;
    if (idx >= c.sequence.length) {
      c.phase = 'input';
      this._render();
      return;
    }
    const colorIdx = c.sequence[idx];
    this._flashButton(colorIdx, () => {
      setTimeout(() => this._playSequence(idx + 1), 300);
    });
  },

  _flashButton(colorIdx, cb) {
    const btn = document.getElementById(`simon-${colorIdx}`);
    if (btn) {
      btn.style.opacity = '1';
      btn.style.transform = 'scale(1.08)';
      btn.style.boxShadow = '0 0 0 6px rgba(255,255,255,0.5), 0 6px 16px rgba(0,0,0,0.2)';
      setTimeout(() => {
        if (btn) { btn.style.opacity='0.55'; btn.style.transform=''; btn.style.boxShadow='0 6px 16px rgba(0,0,0,0.2),inset 0 2px 4px rgba(255,255,255,0.2)'; }
        if (cb) cb();
      }, 500);
    } else if (cb) cb();
  },

  _playerTap(colorIdx) {
    const c = this.current;
    if (c.phase !== 'input') return;

    // Flash the tapped button
    const btn = document.getElementById(`simon-${colorIdx}`);
    if (btn) {
      btn.style.transform = 'scale(0.93)';
      btn.style.opacity = '0.8';
      setTimeout(() => { if(btn){btn.style.transform='';btn.style.opacity='1';} }, 120);
    }

    const pos = c.playerSeq.length;
    const expected = c.sequence[pos];

    if (colorIdx !== expected) {
      // Wrong!
      c.errors++;
      const msg = document.getElementById('simon-msg');
      if (msg) msg.textContent = '❌ Falsch! Sequenz wird wiederholt...';
      if (btn) { btn.style.background = '#E74C3C'; setTimeout(()=>{ if(btn) btn.style.background=c.colors[colorIdx].c; },500); }
      // Replay sequence
      c.playerSeq = [];
      c.phase = 'watch';
      setTimeout(() => this._playSequence(0), 1000);
      return;
    }

    c.playerSeq.push(colorIdx);

    // Redraw dots
    const dotsEl = document.getElementById('game-area').querySelector('div[style*="min-height:28px"]');
    if (dotsEl) {
      dotsEl.innerHTML = c.playerSeq.map(idx=>`
        <div style="width:22px;height:22px;border-radius:50%;background:${c.colors[idx].c};border:2px solid rgba(0,0,0,0.1)"></div>`).join('');
    }

    if (c.playerSeq.length === c.sequence.length) {
      // Round complete!
      const msg = document.getElementById('simon-msg');
      if (msg) msg.textContent = '✅ Richtig! Weiter...';
      if (c.round >= c.maxRounds) {
        c.phase = 'done';
        setTimeout(() => this._showResult(), 800);
      } else {
        setTimeout(() => this._nextSequence(), 1000);
      }
    }
  },

  _showResult() {
    const c = this.current;
    const timeMs = Date.now() - c.startTime;
    const rawScore = Math.max(20, 100 - c.errors * 10);
    const finalScore = State.calcFinalScore({rawScore, timeMs, errors:c.errors, passed:c.round>=5});

    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center;padding:20px 0">
        <div style="font-size:3rem">${c.errors===0?'🧠🏆':c.round>=5?'🧠😊':'🧠😅'}</div>
        <div style="font-family:'Fredoka One',cursive;font-size:1.7rem;color:var(--mountain-dark);margin:10px 0">
          ${c.round}/${c.maxRounds} ${typeof t!=='undefined'?t('simon.rounds_done'):'Runden geschafft!'}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:12px 0">
          <div style="background:#F0F9FF;border-radius:10px;padding:10px;font-size:0.8rem">
            <div style="font-size:1.2rem">🎯</div><b>${c.round}</b><br><span style="color:var(--text-mid)">${typeof t!=='undefined'?t('simon.rounds'):'Runden'}</span>
          </div>
          <div style="background:#FFF5F5;border-radius:10px;padding:10px;font-size:0.8rem">
            <div style="font-size:1.2rem">❌</div><b>${c.errors}</b><br><span style="color:var(--text-mid)">${typeof t!=='undefined'?t('math.errors'):'Fehler'}</span>
          </div>
          <div style="background:#FFFFF0;border-radius:10px;padding:10px;font-size:0.8rem">
            <div style="font-size:1.2rem">⭐</div><b>${finalScore}</b><br><span style="color:var(--text-mid)">${typeof t!=='undefined'?t('math.points'):'Punkte'}</span>
          </div>
        </div>
        <button class="btn btn-primary btn-full" onclick="SimonGame._finish(${finalScore},${timeMs},${c.errors})">${typeof t!=='undefined'?t('game.continue'):'Weiter ➜'}</button>
      </div>`;
  },

  _finish(score, timeMs, errors) {
    if (this.current?.onComplete) this.current.onComplete({rawScore:score,timeMs,errors,passed:score>=30});
  },
};

window.SimonGame = SimonGame;
