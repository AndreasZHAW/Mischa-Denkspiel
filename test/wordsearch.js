/**
 * games/wordsearch.js — Wörter suchen
 * Finde 5 versteckte Wörter im Buchstaben-Raster
 * Wische über die Buchstaben um ein Wort zu markieren
 */

const WordSearchGame = {
  current: null,

  start(config) {
    const { worldId = 1, onComplete } = config;
    WordSearchGame._lastConfig = config;
    const wordSet = this._getWords(worldId);
    const { grid, placements } = this._buildGrid(wordSet, 10, 10);

    this.current = {
      grid, placements,
      words: wordSet,
      found: new Set(),
      selecting: false,
      selStart: null,
      selEnd: null,
      startTime: Date.now(),
      errors: 0,
      onComplete,
    };
    this._render();
  },

  _getWords(worldId) {
    const sets = {
      1:  ['AUTO','KARTE','REISE','STRASSE','TANK'],
      2:  ['BURG','RITTER','KOENIG','TURM','SCHWERT'],
      3:  ['POOL','SOMMER','SONNE','WASSER','TAUCHEN'],
      4:  ['TENNIS','BALL','NETZ','PUNKT','MATCH'],
      5:  ['WUERFEL','ZAHL','SPIEL','SPASS','GEWINN'],
      6:  ['FAHRRAD','HELM','WALD','NATUR','LUFT'],
      7:  ['BROT','KAESE','WEIN','ESSEN','SUPPE'],
      8:  ['FUSSBALL','TOR','JUBEL','SPIEL','SIEG'],
      9:  ['KOFFER','REISE','PACKEN','HEIMWEG','FLUG'],
      10: ['ZUHAUSE','FERIEN','ENDE','SPASS','DANKE'],
    };
    return sets[worldId] || sets[1];
  },

  _buildGrid(words, rows, cols) {
    const grid = Array.from({length:rows}, () => Array(cols).fill(''));
    const placements = [];
    const directions = [{dr:0,dc:1},{dr:1,dc:0},{dr:1,dc:1}]; // right, down, diagonal

    for (const word of words) {
      let placed = false;
      for (let attempt = 0; attempt < 100 && !placed; attempt++) {
        const dir = directions[Math.floor(Math.random()*directions.length)];
        const maxR = rows - dir.dr*(word.length-1);
        const maxC = cols - dir.dc*(word.length-1);
        if (maxR<=0||maxC<=0) continue;
        const r = Math.floor(Math.random()*maxR);
        const c = Math.floor(Math.random()*maxC);
        // Check if fits
        let fits = true;
        for (let i=0;i<word.length;i++) {
          const ch = grid[r+dir.dr*i][c+dir.dc*i];
          if (ch && ch !== word[i]) { fits=false; break; }
        }
        if (fits) {
          for (let i=0;i<word.length;i++) grid[r+dir.dr*i][c+dir.dc*i]=word[i];
          placements.push({word, r, c, dr:dir.dr, dc:dir.dc});
          placed = true;
        }
      }
    }

    // Fill empty with random letters
    const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let r=0;r<rows;r++)
      for (let c=0;c<cols;c++)
        if (!grid[r][c]) grid[r][c]=alpha[Math.floor(Math.random()*alpha.length)];

    return {grid, placements};
  },

  _render() {
    const c = this.current;
    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center">
        <div style="font-size:0.82rem;color:var(--text-mid);margin-bottom:8px">
          Wische über die Buchstaben um ein Wort zu markieren!
          &nbsp;⏱ <span id="ws-timer">0s</span>
        </div>

        <!-- Word list -->
        <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-bottom:12px" id="ws-words">
          ${c.words.map(w => `
            <span id="wsw-${w}" style="padding:4px 10px;border-radius:50px;border:2px solid #E0E6EE;font-weight:700;font-size:0.82rem;color:var(--text-mid)">
              ${w}
            </span>`).join('')}
        </div>

        <!-- Grid -->
        <div id="ws-grid" style="
          display:inline-grid;
          grid-template-columns:repeat(10,32px);
          gap:2px;user-select:none;-webkit-user-select:none;touch-action:none">
          ${c.grid.map((row,r)=>row.map((ch,col)=>`
            <div class="ws-cell" data-r="${r}" data-c="${col}"
              style="width:32px;height:32px;border-radius:6px;display:flex;align-items:center;
                justify-content:center;font-weight:700;font-size:0.85rem;
                background:#F0F4F8;color:var(--text-dark);cursor:pointer;transition:background 0.1s">
              ${ch}
            </div>`).join('')).join('')}
        </div>

        <div id="ws-hint" style="margin-top:10px;font-size:0.82rem;color:var(--text-mid);min-height:20px"></div>
      </div>`;

    this._attachGridEvents();

    this._timerInterval = setInterval(() => {
      const el = document.getElementById('ws-timer');
      if (el) el.textContent = Math.round((Date.now()-c.startTime)/1000)+'s';
    }, 1000);
  },

  _attachGridEvents() {
    const grid = document.getElementById('ws-grid');
    if (!grid) return;

    const getCell = (el) => {
      const cell = el.closest('.ws-cell');
      if (!cell) return null;
      return {r:parseInt(cell.dataset.r), c:parseInt(cell.dataset.c)};
    };

    const highlight = (r1,c1,r2,c2) => {
      // Compute direction
      const dr = r2>r1?1:r2<r1?-1:0, dc=c2>c1?1:c2<c1?-1:0;
      const len = Math.max(Math.abs(r2-r1), Math.abs(c2-c1))+1;
      const cells = [];
      for (let i=0;i<len;i++) cells.push(`${r1+dr*i}-${c1+dc*i}`);
      document.querySelectorAll('.ws-cell').forEach(cell => {
        const key = `${cell.dataset.r}-${cell.dataset.c}`;
        if (cells.includes(key)) cell.style.background='#3498DB';
        else if (!cell.classList.contains('ws-found')) cell.style.background='#F0F4F8';
      });
    };

    const checkWord = (r1,c1,r2,c2) => {
      const c = this.current;
      const dr=r2>r1?1:r2<r1?-1:0, dc=c2>c1?1:c2<c1?-1:0;
      const len=Math.max(Math.abs(r2-r1),Math.abs(c2-c1))+1;
      let word='';
      for (let i=0;i<len;i++) word+=c.grid[r1+dr*i][c1+dc*i];

      // Check forward and backward
      const match = c.placements.find(p =>
        !c.found.has(p.word) &&
        (p.word===word || p.word===word.split('').reverse().join('')) &&
        ((p.r===r1&&p.c===c1&&p.dr===dr&&p.dc===dc) ||
         (p.r===r2&&p.c===c2&&p.dr===-dr&&p.dc===-dc))
      );

      // Reset highlight
      document.querySelectorAll('.ws-cell').forEach(cell => {
        if (!cell.classList.contains('ws-found')) cell.style.background='#F0F4F8';
      });

      if (match) {
        // Mark as found
        c.found.add(match.word);
        for (let i=0;i<match.word.length;i++) {
          const cell = document.querySelector(`.ws-cell[data-r="${match.r+match.dr*i}"][data-c="${match.c+match.dc*i}"]`);
          if (cell) { cell.style.background='#27AE60'; cell.style.color='white'; cell.classList.add('ws-found'); }
        }
        const wordEl = document.getElementById(`wsw-${match.word}`);
        if (wordEl) { wordEl.style.textDecoration='line-through'; wordEl.style.color='#27AE60'; wordEl.style.borderColor='#27AE60'; }
        document.getElementById('ws-hint').textContent = `✅ ${match.word} gefunden!`;
        if (c.found.size >= c.words.length) { clearInterval(this._timerInterval); setTimeout(()=>this._showResult(),600); }
      } else if (word.length > 1) {
        c.errors++;
        document.getElementById('ws-hint').textContent = '❌ Kein Wort — versuche nochmal!';
        setTimeout(()=>{ if(document.getElementById('ws-hint')) document.getElementById('ws-hint').textContent=''; },1000);
      }
    };

    // Mouse events
    grid.addEventListener('mousedown', e => {
      const cell = getCell(e.target);
      if (!cell) return;
      this.current.selecting=true; this.current.selStart=cell; this.current.selEnd=cell;
      highlight(cell.r,cell.c,cell.r,cell.c);
    });
    grid.addEventListener('mousemove', e => {
      if (!this.current.selecting) return;
      const cell = getCell(e.target);
      if (!cell) return;
      this.current.selEnd=cell;
      const s=this.current.selStart;
      highlight(s.r,s.c,cell.r,cell.c);
    });
    grid.addEventListener('mouseup', e => {
      if (!this.current.selecting) return;
      this.current.selecting=false;
      const s=this.current.selStart, end=this.current.selEnd;
      if (s&&end) checkWord(s.r,s.c,end.r,end.c);
    });

    // Touch events
    grid.addEventListener('touchstart', e => {
      e.preventDefault();
      const touch=e.touches[0];
      const el=document.elementFromPoint(touch.clientX,touch.clientY);
      const cell=getCell(el);
      if (!cell) return;
      this.current.selecting=true; this.current.selStart=cell; this.current.selEnd=cell;
      highlight(cell.r,cell.c,cell.r,cell.c);
    }, {passive:false});
    grid.addEventListener('touchmove', e => {
      e.preventDefault();
      if (!this.current.selecting) return;
      const touch=e.touches[0];
      const el=document.elementFromPoint(touch.clientX,touch.clientY);
      const cell=getCell(el);
      if (!cell) return;
      this.current.selEnd=cell;
      const s=this.current.selStart;
      highlight(s.r,s.c,cell.r,cell.c);
    }, {passive:false});
    grid.addEventListener('touchend', e => {
      if (!this.current.selecting) return;
      this.current.selecting=false;
      const s=this.current.selStart, end=this.current.selEnd;
      if (s&&end) checkWord(s.r,s.c,end.r,end.c);
    }, {passive:false});
  },

  _showResult() {
    const c = this.current;
    clearInterval(this._timerInterval);
    const timeMs=Date.now()-c.startTime;
    const finalScore=State.calcFinalScore({rawScore:100,timeMs,errors:c.errors,passed:true});

    document.getElementById('game-area').innerHTML=`
      <div style="text-align:center;padding:20px 0">
        <div style="font-size:3rem">🔤🏆</div>
        <div style="font-family:'Fredoka One',cursive;font-size:1.7rem;color:var(--mountain-dark);margin:10px 0">Alle Wörter gefunden!</div>
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
        <button class="btn btn-primary btn-full" onclick="WordSearchGame._finish(${finalScore},${timeMs},${c.errors})">Weiter ➜</button>
      </div>`;
  },

  _finish(score, timeMs, errors) {
    clearInterval(this._timerInterval);
    if (this.current?.onComplete) this.current.onComplete({rawScore:score,timeMs,errors,passed:true});
  },

  _timerInterval: null,
  _lastConfig: null,
};

window.WordSearchGame = WordSearchGame;
