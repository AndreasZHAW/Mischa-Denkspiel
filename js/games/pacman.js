/**
 * games/pacman.js — Mini Pac-Man
 * Pac-Man frisst Punkte auf einem kleinen Raster, weiche Geistern aus
 * Steuerung: Pfeiltasten oder Wisch-Gesten auf Mobile
 */

const PacmanGame = {
  current: null,
  _raf: null,

  start(config) {
    const { onComplete } = config;
    PacmanGame._lastConfig = config;

    // 13x11 Raster, 0=Wand, 1=Punkt, 2=frei, 3=Power-Punkt
    const MAP = [
      [0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,1,1,1,1,1,0,1,1,1,1,1,0],
      [0,3,0,0,1,0,0,0,1,0,0,3,0],
      [0,1,0,0,1,0,0,0,1,0,0,1,0],
      [0,1,1,1,1,1,1,1,1,1,1,1,0],
      [0,1,0,0,1,0,2,0,1,0,0,1,0],
      [0,1,1,1,1,0,2,0,1,1,1,1,0],
      [0,0,0,0,1,0,2,0,1,0,0,0,0],
      [0,0,0,0,1,0,0,0,1,0,0,0,0],
      [0,1,1,1,1,1,1,1,1,1,1,1,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0],
    ];

    const ROWS = MAP.length, COLS = MAP[0].length;
    let totalDots = 0;
    const grid = MAP.map(row => row.map(cell => {
      if (cell === 1 || cell === 3) totalDots++;
      return cell;
    }));

    this.current = {
      grid, ROWS, COLS,
      totalDots,
      dotsEaten: 0,
      pac: { x: 1, y: 9, dir: { dx:1, dy:0 }, nextDir: { dx:1, dy:0 }, mouth: 0 },
      ghosts: [
        { x:5, y:5, dx:1, dy:0, color:'#FF4444', scared:false },
        { x:7, y:5, dx:-1,dy:0, color:'#FFB8FF', scared:false },
      ],
      score: 0,
      lives: 3,
      powered: false,
      powerTimer: 0,
      tick: 0,
      gameOver: false,
      won: false,
      startTime: Date.now(),
      errors: 0,
      onComplete,
      touchStart: null,
    };

    this._render();
    this._startLoop();
    this._setupControls();
  },

  _setupControls() {
    this._keyHandler = (e) => {
      const dirs = {
        ArrowLeft:{dx:-1,dy:0}, ArrowRight:{dx:1,dy:0},
        ArrowUp:{dx:0,dy:-1},   ArrowDown:{dx:0,dy:1}
      };
      if (dirs[e.key]) { e.preventDefault(); this.current.pac.nextDir = dirs[e.key]; }
    };
    document.addEventListener('keydown', this._keyHandler);

    // Touch support
    const canvas = document.getElementById('pacman-canvas');
    if (canvas) {
      canvas.addEventListener('touchstart', e => {
        this.current.touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }, { passive: true });
      canvas.addEventListener('touchend', e => {
        if (!this.current.touchStart) return;
        const dx = e.changedTouches[0].clientX - this.current.touchStart.x;
        const dy = e.changedTouches[0].clientY - this.current.touchStart.y;
        if (Math.abs(dx) > Math.abs(dy)) {
          this.current.pac.nextDir = dx > 0 ? {dx:1,dy:0} : {dx:-1,dy:0};
        } else {
          this.current.pac.nextDir = dy > 0 ? {dx:0,dy:1} : {dx:0,dy:-1};
        }
        this.current.touchStart = null;
      }, { passive: true });
    }
  },

  _render() {
    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center">
        <div style="display:flex;justify-content:space-between;font-size:0.85rem;color:var(--text-mid);margin-bottom:8px;padding:0 4px">
          <span>⭐ <b id="pm-score">0</b></span>
          <span style="font-size:0.75rem;color:var(--text-mid)">← → ↑ ↓ oder Wischen</span>
          <span>❤️ <b id="pm-lives">3</b></span>
        </div>
        <canvas id="pacman-canvas" width="390" height="330"
          style="border-radius:12px;background:#000;max-width:100%;touch-action:none;display:block;margin:0 auto"></canvas>
        <div style="margin-top:10px;display:flex;gap:8px;justify-content:center">
          <button onclick="PacmanGame._dir(-1,0)" class="btn btn-secondary" style="padding:10px 18px;font-size:1.2rem">◀</button>
          <div style="display:flex;flex-direction:column;gap:6px">
            <button onclick="PacmanGame._dir(0,-1)" class="btn btn-secondary" style="padding:8px 18px;font-size:1.2rem">▲</button>
            <button onclick="PacmanGame._dir(0,1)"  class="btn btn-secondary" style="padding:8px 18px;font-size:1.2rem">▼</button>
          </div>
          <button onclick="PacmanGame._dir(1,0)"  class="btn btn-secondary" style="padding:10px 18px;font-size:1.2rem">▶</button>
        </div>
      </div>`;
    setTimeout(() => this._setupControls(), 50);
  },

  _dir(dx, dy) { if (this.current) this.current.pac.nextDir = {dx, dy}; },

  _startLoop() {
    cancelAnimationFrame(this._raf);
    let lastTime = 0;
    const STEP_MS = 200; // Pac-Man moves every 200ms
    const GHOST_MS = 280;
    let lastGhost = 0;

    const loop = (ts) => {
      const c = this.current;
      if (!c || c.gameOver || c.won) return;

      if (ts - lastTime > STEP_MS) {
        lastTime = ts;
        this._movePac();
        c.tick++;
        c.pac.mouth = c.tick % 4 < 2 ? 0.25 : 0.05;
        if (c.powered) { c.powerTimer--; if (c.powerTimer <= 0) { c.powered=false; c.ghosts.forEach(g=>g.scared=false); } }
        this._checkCollision();
        this._draw();
      }
      if (ts - lastGhost > GHOST_MS) {
        lastGhost = ts;
        this._moveGhosts();
        this._checkCollision();
        this._draw();
      }

      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  },

  _movePac() {
    const c = this.current;
    const p = c.pac;
    // Try next direction first
    const nx = p.x + p.nextDir.dx, ny = p.y + p.nextDir.dy;
    if (nx >= 0 && nx < c.COLS && ny >= 0 && ny < c.ROWS && c.grid[ny][nx] !== 0) {
      p.dir = {...p.nextDir};
    }
    const cx = p.x + p.dir.dx, cy = p.y + p.dir.dy;
    if (cx >= 0 && cx < c.COLS && cy >= 0 && cy < c.ROWS && c.grid[cy][cx] !== 0) {
      p.x = cx; p.y = cy;
      if (c.grid[cy][cx] === 1) { c.grid[cy][cx]=2; c.score+=10; c.dotsEaten++; document.getElementById('pm-score').textContent=c.score; }
      else if (c.grid[cy][cx] === 3) { c.grid[cy][cx]=2; c.score+=50; c.dotsEaten++; c.powered=true; c.powerTimer=30; c.ghosts.forEach(g=>g.scared=true); document.getElementById('pm-score').textContent=c.score; }
    }
    if (c.dotsEaten >= c.totalDots) { c.won=true; cancelAnimationFrame(this._raf); this._showEnd(true); }
  },

  _moveGhosts() {
    const c = this.current;
    c.ghosts.forEach(g => {
      const opts = [{dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:0,dy:-1}]
        .filter(d => !(d.dx===-g.dx&&d.dy===-g.dy))
        .filter(d => { const nx=g.x+d.dx,ny=g.y+d.dy; return nx>=0&&nx<c.COLS&&ny>=0&&ny<c.ROWS&&c.grid[ny][nx]!==0; });
      if (opts.length === 0) return;
      let move;
      if (Math.random() < 0.6 && !g.scared) {
        // Chase pac
        move = opts.reduce((best,d) => {
          const dist = Math.abs((g.x+d.dx)-c.pac.x)+Math.abs((g.y+d.dy)-c.pac.y);
          return dist < best.dist ? {d, dist} : best;
        }, {d:opts[0], dist:999}).d;
      } else {
        move = opts[Math.floor(Math.random()*opts.length)];
      }
      g.dx=move.dx; g.dy=move.dy; g.x+=move.dx; g.y+=move.dy;
    });
  },

  _checkCollision() {
    const c = this.current;
    c.ghosts.forEach(g => {
      if (g.x===c.pac.x && g.y===c.pac.y) {
        if (c.powered && g.scared) {
          g.scared=false; g.x=5; g.y=5; c.score+=200;
        } else {
          c.lives--; c.errors++;
          document.getElementById('pm-lives').textContent=c.lives;
          c.pac.x=1; c.pac.y=9; c.pac.dir={dx:1,dy:0};
          if (c.lives<=0) { c.gameOver=true; cancelAnimationFrame(this._raf); this._showEnd(false); }
        }
      }
    });
  },

  _draw() {
    const c = this.current;
    const canvas = document.getElementById('pacman-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const CW = canvas.width / c.COLS, CH = canvas.height / c.ROWS;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    for (let y=0;y<c.ROWS;y++) {
      for (let x=0;x<c.COLS;x++) {
        const cx=x*CW, cy=y*CH;
        if (c.grid[y][x]===0) {
          ctx.fillStyle='#1A1AFF'; ctx.fillRect(cx+1,cy+1,CW-2,CH-2);
          ctx.strokeStyle='#4444FF'; ctx.strokeRect(cx+2,cy+2,CW-4,CH-4);
        } else if (c.grid[y][x]===1) {
          ctx.fillStyle='#FFD700'; ctx.beginPath();
          ctx.arc(cx+CW/2,cy+CH/2,3,0,Math.PI*2); ctx.fill();
        } else if (c.grid[y][x]===3) {
          ctx.fillStyle='#FFD700'; ctx.beginPath();
          ctx.arc(cx+CW/2,cy+CH/2,7,0,Math.PI*2); ctx.fill();
        }
      }
    }

    // Draw ghosts
    c.ghosts.forEach(g => {
      const gx=g.x*CW+CW/2, gy=g.y*CH+CH/2, r=CW*0.42;
      ctx.fillStyle = g.scared ? '#4444FF' : g.color;
      ctx.beginPath(); ctx.arc(gx,gy-r*0.1,r,Math.PI,0); ctx.lineTo(gx+r,gy+r);
      // Wavy bottom
      for(let i=0;i<3;i++) {
        ctx.quadraticCurveTo(gx+r-r*2/3*(i+0.5),gy+r*(i%2===0?0.6:1),gx+r-r*2/3*(i+1),gy+r);
      }
      ctx.closePath(); ctx.fill();
      // Eyes
      if (!g.scared) {
        ctx.fillStyle='white'; ctx.beginPath(); ctx.ellipse(gx-r*0.3,gy-r*0.2,r*0.25,r*0.3,0,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='white'; ctx.beginPath(); ctx.ellipse(gx+r*0.3,gy-r*0.2,r*0.25,r*0.3,0,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#00F'; ctx.beginPath(); ctx.arc(gx-r*0.25+(g.dx*r*0.1),gy-r*0.2+(g.dy*r*0.1),r*0.14,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#00F'; ctx.beginPath(); ctx.arc(gx+r*0.35+(g.dx*r*0.1),gy-r*0.2+(g.dy*r*0.1),r*0.14,0,Math.PI*2); ctx.fill();
      }
    });

    // Draw Pac-Man
    const p = c.pac;
    const px=p.x*CW+CW/2, py=p.y*CH+CH/2, pr=CW*0.45;
    const angle = Math.atan2(p.dir.dy, p.dir.dx);
    const mouth = c.pac.mouth;
    ctx.fillStyle='#FFD700';
    ctx.beginPath();
    ctx.moveTo(px,py);
    ctx.arc(px,py,pr, angle+mouth*Math.PI, angle+(2-mouth)*Math.PI);
    ctx.closePath(); ctx.fill();
  },

  _showEnd(won) {
    cancelAnimationFrame(this._raf);
    document.removeEventListener('keydown', this._keyHandler);
    const c = this.current;
    const timeMs = Date.now()-c.startTime;
    const rawScore = won ? Math.min(100, 50 + Math.round(c.score/10)) : Math.round(c.score/8);
    const finalScore = State.calcFinalScore({rawScore, timeMs, errors:c.errors, passed:won||c.score>50});

    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center;padding:20px 0">
        <div style="font-size:3rem">${won?'🏆':'👻'}</div>
        <div style="font-family:'Fredoka One',cursive;font-size:1.6rem;color:var(--mountain-dark);margin:10px 0">
          ${won ? 'Alle Punkte gefressen!' : 'Von Geist erwischt!'}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:12px 0">
          <div style="background:#F0F9FF;border-radius:10px;padding:10px;font-size:0.8rem">
            <div style="font-size:1.2rem">🎮</div><b>${c.score}</b><br><span style="color:var(--text-mid)">Punkte</span>
          </div>
          <div style="background:#FFF5F5;border-radius:10px;padding:10px;font-size:0.8rem">
            <div style="font-size:1.2rem">❤️</div><b>${c.lives}</b><br><span style="color:var(--text-mid)">Leben</span>
          </div>
          <div style="background:#FFFFF0;border-radius:10px;padding:10px;font-size:0.8rem">
            <div style="font-size:1.2rem">⭐</div><b>${finalScore}</b><br><span style="color:var(--text-mid)">Score</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px">
          ${!won ? `<button class="btn btn-secondary btn-full" onclick="PacmanGame.start(PacmanGame._lastConfig)">🔄 Nochmal</button>` : ''}
          <button class="btn btn-primary btn-full" onclick="PacmanGame._finish(${finalScore},${timeMs},${c.errors})">Weiter ➜</button>
        </div>
      </div>`;
  },

  _finish(score, timeMs, errors) {
    cancelAnimationFrame(this._raf);
    document.removeEventListener('keydown', this._keyHandler);
    if (this.current?.onComplete) this.current.onComplete({rawScore:score, timeMs, errors, passed:score>=20});
  },

  _lastConfig: null,
};

window.PacmanGame = PacmanGame;
