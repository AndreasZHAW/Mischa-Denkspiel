// SOKOBAN - Schieberätsel: Boxen auf Zielfelder schieben
const SokobanGame = {
  start({ onComplete }) {
    const el = document.getElementById('game-area');
    if (!el) return;

    // Levels: '#'=Wand, ' '=Boden, '@'=Spieler, '$'=Box, '.'=Ziel, '*'=Box auf Ziel, '+'=Spieler auf Ziel
    const LEVELS = [
      { name:'Tutorial', map:['#####','# @ #','# $ #','# . #','#####'] },
      { name:'Einfach 1', map:['######','#    #','# $. #','# @  #','######'] },
      { name:'Einfach 2', map:['#####','#.  #','# $ #','#  @#','# . #','# $ #','#####'] },
      { name:'Mittel 1',  map:['########','#. # .  #','#  $  $ #','#   @   #','########'] },
      { name:'Mittel 2',  map:['######','#.   #','# $$ #','# .. #','# $$ #','#  @ #','######'] },
      { name:'Schwer 1',  map:['#######','# .   #','# $ $ #','# . @ #','# $ $ #','# .   #','#######'] },
      { name:'Schwer 2',  map:['########','#  . .  #','# $   $ #','#   @   #','# $   $ #','#  . .  #','########'] },
    ];

    let levelIdx = 0, moves = 0, totalSolved = 0;
    let grid = [], px = 0, py = 0, pushes = 0;

    const TILE = 46; // px per tile
    const COLORS = {
      '#': '#555577',  // wall
      ' ': '#e8d5a3',  // floor
      '.': '#e8d5a3',  // goal floor
      '@': null,       // player
      '$': '#c0720a',  // box
      '*': '#2ecc40',  // box on goal
      '+': null,       // player on goal
    };

    // Hints for each level
    const HINTS = [
      "Schiebe die Box direkt nach unten auf den Zielkreis.",
      "Gehe zuerst nach rechts an die Box, dann schiebe sie links auf das Ziel.",
      "Schiebe erst die obere Box nach unten auf das obere Ziel, dann die untere Box nach oben.",
      "Nutze die Lücke in der Mitte. Schiebe Box A auf Ziel links, Box B auf Ziel rechts.",
      "Beginne mit den äusseren Boxen. Reihenfolge: links, rechts, dann die inneren.",
      "Schiebe die Boxen nacheinander in die Ecken der Zielfelder — starte von aussen.",
      "Spirale nach innen: erst die äusseren 4 Boxen platzieren, dann die inneren.",
    ];
    let hintsUsed = 0;
    let hintPenalty = 0;

    SokobanGame._showHint = () => {
      const hint = HINTS[levelIdx] || "Versuche, Boxen (🟫) auf die roten Kreise zu schieben!";
      hintsUsed++;
      hintPenalty += 5;
      // Show hint overlay
      const hintDiv = document.getElementById('sok-hint');
      if(hintDiv) hintDiv.remove();
      const d = document.createElement('div');
      d.id = 'sok-hint';
      d.style.cssText = 'background:rgba(0,0,0,.92);border:2px solid rgba(255,215,0,.5);border-radius:12px;padding:14px;margin-top:8px;font-size:clamp(.82rem,2.5vw,.95rem);color:#FFD700;max-width:100%;box-sizing:border-box';
      d.innerHTML = '<b>💡 Tipp:</b> ' + hint + '<br><span style="font-size:.72rem;color:rgba(255,100,100,.8)">-5 Punkte für diesen Tipp</span>';
      const el = document.getElementById('game-area');
      if(el) el.querySelector('div').appendChild(d);
      setTimeout(() => d.remove(), 6000);
    };

    const loadLevel = (idx) => {
      const raw = LEVELS[idx].map;
      grid = raw.map(row => row.split(''));
      moves = 0; pushes = 0;
      // Find player
      for(let r=0;r<grid.length;r++) for(let c=0;c<grid[r].length;c++) {
        if(grid[r][c]==='@'||grid[r][c]==='+'){px=c;py=r;}
      }
      render();
    };

    const isGoal = (r,c) => {
      const orig = LEVELS[levelIdx].map[r]?.[c];
      return orig==='.'||orig==='*'||orig==='+';
    };

    const isSolved = () => {
      for(let r=0;r<grid.length;r++) for(let c=0;c<grid[r].length;c++) {
        if(grid[r][c]==='$') return false; // box not on goal
      }
      return true;
    };

    const move = (dr, dc) => {
      const nr=py+dr, nc=px+dc;
      const curr = grid[py][px];
      const next = grid[nr]?.[nc];
      if(!next||next==='#') return;
      // Check if pushing a box
      if(next==='$'||next==='*') {
        const br=nr+dr, bc=nc+dc;
        const bNext = grid[br]?.[bc];
        if(!bNext||bNext==='#'||bNext==='$'||bNext==='*') return; // can't push
        grid[nr][nc] = next==='*'?'.':' ';
        grid[br][bc] = isGoal(br,bc)?'*':'$';
        pushes++;
      }
      // Move player
      grid[py][px] = isGoal(py,px)?'.':' ';
      grid[nr][nc] = isGoal(nr,nc)?'+':'@';
      px=nc; py=nr; moves++;
      render();
      if(isSolved()) {
        totalSolved++;
        setTimeout(() => {
          levelIdx++;
          if(levelIdx >= LEVELS.length) {
            // All done!
            const rawScore = Math.min(100, Math.round(70 + totalSolved*5 - Math.floor(moves/20)));
            onComplete({ rawScore, passed:true, errors:0, timeMs:0 });
          } else {
            loadLevel(levelIdx);
          }
        }, 600);
      }
    };

    const render = () => {
      const level = LEVELS[levelIdx];
      const rows = grid.length, cols = Math.max(...grid.map(r=>r.length));
      const cw = Math.min(TILE, Math.floor((window.innerWidth-40)/cols));
      const ch = cw;
      const W = cols*cw, H = rows*ch;
      const remaining = grid.flat().filter(c=>c==='$').length;
      const total = grid.flat().filter(c=>c==='$'||c==='*').length;
      
      el.innerHTML = `
        <div style="padding:8px;text-align:center;user-select:none;-webkit-user-select:none">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:clamp(.8rem,2.5vw,.95rem)">
            <span>🧩 ${level.name} (${levelIdx+1}/${LEVELS.length})</span>
            <span>📦 ${total-remaining}/${total} ✓</span>
            <span>👣 ${moves}</span>
          </div>
          <canvas id="sok-cv" width="${W}" height="${H}" 
            style="border-radius:8px;max-width:100%;border:2px solid rgba(255,255,255,.2);touch-action:none;cursor:pointer"></canvas>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;max-width:220px;margin:10px auto 0">
            <div style="display:flex;gap:6px">
            <button onclick="SokobanGame._reset()" 
              style="flex:1;background:rgba(231,76,60,.2);border:2px solid rgba(231,76,60,.4);color:#E74C3C;padding:8px;border-radius:8px;cursor:pointer;font-size:.8rem;touch-action:manipulation">🔄 Neu</button>
            <button onclick="SokobanGame._showHint()" 
              style="flex:1;background:rgba(255,215,0,.15);border:2px solid rgba(255,215,0,.4);color:#FFD700;padding:8px;border-radius:8px;cursor:pointer;font-size:.8rem;touch-action:manipulation">💡 Tipp (-5pts)</button>
          </div>
          </div>
          <div style="font-size:.72rem;color:rgba(255,255,255,.4);margin-top:6px">
            Pfeil- oder WASD-Tasten · Wischen auf Mobile
          </div>
        </div>`;
      
      const cv = document.getElementById('sok-cv');
      const ctx = cv.getContext('2d');
      
      // Draw grid
      for(let r=0;r<rows;r++) {
        for(let c=0;c<(grid[r]?.length||0);c++) {
          const cell = grid[r][c];
          const x=c*cw, y=r*ch;
          // Floor
          ctx.fillStyle = (cell==='#') ? '#446' : '#e8d5a3';
          if(isGoal(r,c) && cell!==' ') ctx.fillStyle = '#d4b88e';
          ctx.fillRect(x,y,cw,ch);
          // Grid lines
          ctx.strokeStyle='rgba(0,0,0,.1)'; ctx.lineWidth=1;
          ctx.strokeRect(x,y,cw,ch);
          
          if(cell==='#') {
            // Wall - 3D effect
            ctx.fillStyle='#667'; ctx.fillRect(x,y,cw,ch);
            ctx.fillStyle='#889'; ctx.fillRect(x,y,cw,3);
            ctx.fillStyle='#889'; ctx.fillRect(x,y,3,ch);
            ctx.fillStyle='#334'; ctx.fillRect(x+cw-3,y,3,ch);
            ctx.fillStyle='#334'; ctx.fillRect(x,y+ch-3,cw,3);
          } else if(cell==='.'||cell==='+') {
            // Goal marker
            ctx.fillStyle='rgba(255,100,100,.35)';
            ctx.beginPath(); ctx.arc(x+cw/2,y+ch/2,cw*0.28,0,Math.PI*2); ctx.fill();
            ctx.strokeStyle='rgba(255,80,80,.7)'; ctx.lineWidth=2;
            ctx.stroke();
          }
          if(cell==='$'||cell==='*') {
            // Box
            const pad=3;
            ctx.fillStyle = cell==='*'?'#27AE60':'#c0720a';
            ctx.fillRect(x+pad,y+pad,cw-pad*2,ch-pad*2);
            ctx.fillStyle=cell==='*'?'#2ecc71':'#e8891c';
            ctx.fillRect(x+pad,y+pad,cw-pad*2,4);
            ctx.fillRect(x+pad,y+pad,4,ch-pad*2);
            ctx.fillStyle=cell==='*'?'#1e8449':'#9a5a08';
            ctx.fillRect(x+cw-pad-4,y+pad,4,ch-pad*2);
            ctx.fillRect(x+pad,y+ch-pad-4,cw-pad*2,4);
            if(cell==='*') {
              ctx.fillStyle='#fff'; ctx.font=`bold ${cw*0.5}px sans-serif`;
              ctx.textAlign='center'; ctx.textBaseline='middle';
              ctx.fillText('✓',x+cw/2,y+ch/2);
            }
          }
          if(cell==='@'||cell==='+') {
            // Player - simple person
            const cx2=x+cw/2, cy2=y+ch/2;
            // Body
            ctx.fillStyle='#3498DB';
            ctx.fillRect(cx2-cw*0.2,cy2-ch*0.05,cw*0.4,ch*0.45);
            // Head
            ctx.fillStyle='#F5CBA7';
            ctx.beginPath(); ctx.arc(cx2,cy2-ch*0.2,cw*0.22,0,Math.PI*2); ctx.fill();
            ctx.strokeStyle='#E59866'; ctx.lineWidth=1.5; ctx.stroke();
          }
          if(cell==='+') {
            // Goal marker under player
            ctx.strokeStyle='rgba(255,80,80,.9)'; ctx.lineWidth=2;
            ctx.beginPath(); ctx.arc(x+cw/2,y+ch/2,cw*0.38,0,Math.PI*2); ctx.stroke();
          }
        }
      }
      
      // Swipe support
      let tx0=0,ty0=0;
      cv.ontouchstart = e=>{ tx0=e.touches[0].clientX; ty0=e.touches[0].clientY; e.preventDefault(); };
      cv.ontouchend = e=>{
        const dx=e.changedTouches[0].clientX-tx0, dy=e.changedTouches[0].clientY-ty0;
        if(Math.abs(dx)+Math.abs(dy)<10) return;
        if(Math.abs(dx)>Math.abs(dy)) move(0,dx>0?1:-1);
        else move(dy>0?1:-1,0);
        e.preventDefault();
      };
    };

    SokobanGame._reset = () => loadLevel(levelIdx);
    SokobanGame._move = move;

    const onKey = e => {
      const map={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1],
                 w:[-1,0],s:[1,0],a:[0,-1],d:[0,1]};
      const m=map[e.key];
      if(m){ move(...m); e.preventDefault(); }
    };
    window.addEventListener('keydown', onKey);
    // Store cleanup
    SokobanGame._cleanup = ()=>window.removeEventListener('keydown',onKey);

    loadLevel(0);
  }
};
window.SokobanGame = SokobanGame;
