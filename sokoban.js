// SOKOBAN - Complete rewrite with better levels and graphics
const SokobanGame = {
  start({ onComplete }) {
    const el = document.getElementById('game-area');
    if (!el) return;

    // Carefully verified levels: boxes === goals always
    const LEVELS = [
      { name:'Tutorial',  map:['######','# .  #','# $  #','# @  #','######'],
        hint:'Schiebe die Box (braun) mit den Pfeiltasten auf den Zielkreis (rot X).' },
      { name:'Einfach 1', map:['######','# .  #','#  $ #','#  @ #','######'],
        hint:'Gehe links neben die Box, dann schiebe sie nach links und oben zum Ziel.' },
      { name:'Einfach 2', map:['#######','# . . #','# $ $ #','#  @  #','#######'],
        hint:'Schiebe die linke Box auf das linke Ziel, dann die rechte Box auf das rechte Ziel.' },
      { name:'Mittel 1',  map:['########','#  .    #','#  $    #','# @  .  #','#    $  #','########'],
        hint:'Starte mit der oberen Box: schiebe sie nach oben aufs obere Ziel. Dann die untere Box nach rechts.' },
      { name:'Mittel 2',  map:['########','#  ..   #','# $$    #','#    @  #','########'],
        hint:'Beide Boxen müssen auf die zwei Ziele. Nutze die Lücke rechts um die Position zu wechseln.' },
      { name:'Schwer 1',  map:['#########','# ...    #','# $$$    #','#   @    #','#########'],
        hint:'Alle 3 Boxen auf die 3 Ziele. Von rechts nach links arbeiten: erst rechte Box, dann mittlere, dann linke.' },
      { name:'Schwer 2',  map:['##########','#   ..    #','# @ $$    #','#         #','##########'],
        hint:'Schiebe die rechte Box auf das rechte Ziel. Dann die linke Box auf das linke Ziel. Weg freibalten!' },
    ];

    let levelIdx = 0, moves = 0, totalSolved = 0, hintsUsed = 0, hintPenalty = 0;
    let grid = [], px = 0, py = 0;
    let running = true;

    const TILE = Math.min(54, Math.floor((Math.min(window.innerWidth - 24, 420)) / 9));

    const isGoal = (r,c) => { const ch = LEVELS[levelIdx].map[r]?.[c]; return ch==='.'||ch==='+'||ch==='*'; };

    const isSolved = () => {
      // Solved when NO box ('$') remains (all are on goals = '*')
      for(let r=0;r<grid.length;r++) for(let c=0;c<(grid[r]?.length||0);c++)
        if(grid[r][c]==='$') return false;
      return true;
    };

    const loadLevel = (idx) => {
      moves = 0;
      const raw = LEVELS[idx].map;
      grid = raw.map(row => [...row]);
      for(let r=0;r<grid.length;r++) for(let c=0;c<(grid[r]?.length||0);c++)
        if(grid[r][c]==='@'||grid[r][c]==='+'){px=c;py=r;}
      render();
    };

    const move = (dr,dc) => {
      if(!running) return;
      const nr=py+dr, nc=px+dc;
      if(nr<0||nr>=grid.length||nc<0||nc>=(grid[nr]?.length||0)) return;
      const next = grid[nr]?.[nc];
      if(!next||next==='#') return;
      if(next==='$'||next==='*') {
        const br=nr+dr, bc=nc+dc;
        const bNext = grid[br]?.[bc];
        if(!bNext||bNext==='#'||bNext==='$'||bNext==='*') return;
        grid[nr][nc] = isGoal(nr,nc) ? '.' : ' ';
        grid[br][bc] = isGoal(br,bc) ? '*' : '$';
      }
      grid[py][px] = isGoal(py,px) ? '.' : ' ';
      grid[nr][nc] = isGoal(nr,nc) ? '+' : '@';
      px=nc; py=nr; moves++;
      render();
      if(isSolved()) {
        totalSolved++;
        setTimeout(() => {
          levelIdx++;
          if(levelIdx>=LEVELS.length) {
            const raw = Math.min(100, Math.max(10, Math.round(60 + totalSolved*6 - Math.floor(moves/15) - hintPenalty)));
            onComplete({rawScore:raw, passed:true, errors:hintsUsed, timeMs:0});
          } else {
            loadLevel(levelIdx);
          }
        }, 700);
      }
    };

    SokobanGame._reset = () => loadLevel(levelIdx);
    SokobanGame._move = move;
    SokobanGame._showHint = () => {
      hintsUsed++; hintPenalty += 5;
      const hint = LEVELS[levelIdx]?.hint || 'Schiebe alle Boxen auf die Zielfelder!';
      const d = document.getElementById('sok-hint') || document.createElement('div');
      d.id='sok-hint';
      d.style.cssText='position:absolute;bottom:0;left:0;right:0;background:rgba(10,5,30,.97);border-top:2px solid rgba(255,215,0,.5);padding:10px 14px;font-size:clamp(.82rem,2.5vw,.95rem);color:#FFD700;z-index:10;border-radius:0 0 10px 10px';
      d.innerHTML=`<b>💡 Tipp:</b> ${hint} <span style="color:rgba(255,100,100,.8);font-size:.75rem">(-5 Punkte)</span><button onclick="document.getElementById('sok-hint').remove()" style="float:right;background:none;border:none;color:rgba(255,255,255,.5);cursor:pointer;font-size:.9rem">✕</button>`;
      const wrap = document.getElementById('sok-wrap');
      if(wrap) wrap.style.position='relative', wrap.appendChild(d);
      else el.querySelector('div')?.appendChild(d);
      setTimeout(()=>d.remove?.(), 8000);
    };

    const render = () => {
      const level = LEVELS[levelIdx];
      const rows = grid.length;
      const cols = Math.max(...grid.map(r=>r.length));
      const cw = Math.min(TILE, Math.floor((Math.min(window.innerWidth-24,500))/cols));
      const ch = cw;
      const W = cols*cw, H = rows*ch;
      const remaining = grid.flat().filter(c=>c==='$').length;
      const total = LEVELS[levelIdx].map.flat().join('').split('').filter(c=>c==='$'||c==='*').length;
      const boxesDone = total - remaining;

      el.innerHTML = `
        <div id="sok-wrap" style="padding:6px 4px;text-align:center;position:relative;max-width:520px;margin:0 auto">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font-size:clamp(.78rem,2.5vw,.9rem);padding:0 2px">
            <span style="font-weight:700">📦 ${level.name} (${levelIdx+1}/${LEVELS.length})</span>
            <span style="color:#FFD700">✅ ${boxesDone}/${total}</span>
            <span style="color:rgba(255,255,255,.6)">👣 ${moves}</span>
          </div>
          <canvas id="sok-cv" width="${W}" height="${H}"
            style="border-radius:10px;width:100%;max-width:${W}px;height:auto;display:block;margin:0 auto;touch-action:none;cursor:pointer;border:2px solid rgba(255,255,255,.15)"></canvas>
          <div style="display:flex;gap:8px;margin-top:8px">
            <button onclick="SokobanGame._reset()"
              style="flex:1;background:rgba(231,76,60,.2);border:2px solid rgba(231,76,60,.4);color:#E74C3C;padding:9px;border-radius:10px;cursor:pointer;font-size:.85rem;font-weight:700;touch-action:manipulation">🔄 Neu</button>
            <button onclick="SokobanGame._showHint()"
              style="flex:2;background:rgba(255,215,0,.12);border:2px solid rgba(255,215,0,.35);color:#FFD700;padding:9px;border-radius:10px;cursor:pointer;font-size:.85rem;font-weight:700;touch-action:manipulation">💡 Tipp <span style="color:rgba(255,100,100,.7);font-size:.72rem">(-5 Punkte)</span></button>
          </div>
          <div style="font-size:.7rem;color:rgba(255,255,255,.35);margin-top:4px">← → ↑ ↓ oder Wischen</div>
        </div>`;

      const cv = document.getElementById('sok-cv');
      if(!cv) return;
      const ctx = cv.getContext('2d');

      // Background
      ctx.fillStyle='#1e1828'; ctx.fillRect(0,0,W,H);

      for(let r=0;r<rows;r++) {
        for(let c=0;c<(grid[r]?.length||0);c++) {
          const cell = grid[r][c] || ' ';
          const x=c*cw, y=r*ch;
          const gRow = isGoal(r,c);

          if(cell==='#') {
            // Stone wall
            const g=ctx.createLinearGradient(x,y,x+cw,y+ch);
            g.addColorStop(0,'#5a5270'); g.addColorStop(0.6,'#46406a'); g.addColorStop(1,'#38334e');
            ctx.fillStyle=g; ctx.fillRect(x,y,cw,ch);
            // Mortar lines
            ctx.strokeStyle='rgba(0,0,0,.5)'; ctx.lineWidth=1;
            if(r%2===0){ ctx.strokeRect(x+.5,y+.5,cw-1,ch-1); }
            else { ctx.beginPath(); ctx.moveTo(x+cw/2+.5,y); ctx.lineTo(x+cw/2+.5,y+ch); ctx.stroke(); ctx.strokeRect(x+.5,y+.5,cw-1,ch-1); }
            // Highlights
            ctx.fillStyle='rgba(255,255,255,.09)'; ctx.fillRect(x,y,cw,2); ctx.fillRect(x,y,2,ch);
            ctx.fillStyle='rgba(0,0,0,.25)'; ctx.fillRect(x,y+ch-2,cw,2); ctx.fillRect(x+cw-2,y,2,ch);
          } else {
            // Floor
            const fg=ctx.createLinearGradient(x,y,x+cw,y+ch);
            fg.addColorStop(0,'#ece0c8'); fg.addColorStop(1,'#d8c9a8');
            ctx.fillStyle=fg; ctx.fillRect(x,y,cw,ch);
            // Grid line
            ctx.strokeStyle='rgba(140,120,80,.2)'; ctx.lineWidth=.5; ctx.strokeRect(x+.5,y+.5,cw-1,ch-1);

            // Goal marker
            if(gRow) {
              const gc=ctx.createRadialGradient(x+cw/2,y+ch/2,0,x+cw/2,y+ch/2,cw*.44);
              gc.addColorStop(0,'rgba(230,90,20,.4)'); gc.addColorStop(1,'rgba(230,90,20,.05)');
              ctx.fillStyle=gc; ctx.fillRect(x,y,cw,ch);
              const p=cw*.22; ctx.strokeStyle='rgba(200,80,20,.85)'; ctx.lineWidth=2.5; ctx.lineCap='round';
              ctx.beginPath(); ctx.moveTo(x+p,y+p); ctx.lineTo(x+cw-p,y+ch-p);
              ctx.moveTo(x+cw-p,y+p); ctx.lineTo(x+p,y+ch-p); ctx.stroke();
              ctx.fillStyle='rgba(220,100,30,.9)'; ctx.beginPath(); ctx.arc(x+cw/2,y+ch/2,cw*.09,0,Math.PI*2); ctx.fill();
            }

            // Box
            if(cell==='$'||cell==='*') {
              const pad=cw*.09, bx=x+pad, by=y+pad, bw=cw-pad*2, bh=ch-pad*2;
              ctx.fillStyle='rgba(0,0,0,.25)'; ctx.fillRect(bx+3,by+3,bw,bh);
              const bg=ctx.createLinearGradient(bx,by,bx+bw,by+bh);
              if(cell==='*'){bg.addColorStop(0,'#6ee87a');bg.addColorStop(.5,'#3aba4a');bg.addColorStop(1,'#259033');}
              else{bg.addColorStop(0,'#e8a640');bg.addColorStop(.5,'#c07828');bg.addColorStop(1,'#9a5a10');}
              ctx.fillStyle=bg;
              if(ctx.roundRect){ctx.beginPath();ctx.roundRect(bx,by,bw,bh,4);ctx.fill();}else{ctx.fillRect(bx,by,bw,bh);}
              // Grain
              ctx.strokeStyle=cell==='*'?'rgba(0,0,0,.18)':'rgba(120,60,0,.25)'; ctx.lineWidth=1.5;
              ctx.beginPath();
              [bw/3,bw*2/3].forEach(ox=>{ctx.moveTo(bx+ox,by);ctx.lineTo(bx+ox,by+bh);});
              ctx.moveTo(bx,by+bh/2); ctx.lineTo(bx+bw,by+bh/2); ctx.stroke();
              // Highlight
              ctx.fillStyle='rgba(255,255,255,.2)'; ctx.fillRect(bx,by,bw,3); ctx.fillRect(bx,by,3,bh);
              // Border
              ctx.strokeStyle=cell==='*'?'rgba(40,160,50,.9)':'rgba(150,80,0,.8)'; ctx.lineWidth=2;
              if(ctx.roundRect){ctx.beginPath();ctx.roundRect(bx,by,bw,bh,4);ctx.stroke();}else{ctx.strokeRect(bx,by,bw,bh);}
              if(cell==='*'){ctx.fillStyle='#fff';ctx.font=`bold ${cw*.5}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('✓',x+cw/2,y+ch/2);}
            }

            // Player
            if(cell==='@'||cell==='+') {
              const cx2=x+cw/2, cy2=y+ch/2;
              // Shadow
              ctx.fillStyle='rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(cx2,cy2+cw*.3,cw*.28,cw*.09,0,0,Math.PI*2); ctx.fill();
              // Legs
              ctx.fillStyle='#1a44bb'; ctx.fillRect(cx2-cw*.18,cy2+cw*.06,cw*.14,cw*.26); ctx.fillRect(cx2+cw*.04,cy2+cw*.06,cw*.14,cw*.26);
              // Body
              const bg2=ctx.createLinearGradient(0,cy2-cw*.1,0,cy2+cw*.1);
              bg2.addColorStop(0,'#3399ee'); bg2.addColorStop(1,'#1166cc');
              ctx.fillStyle=bg2; ctx.fillRect(cx2-cw*.2,cy2-cw*.1,cw*.4,cw*.22);
              // Arms
              ctx.fillStyle='#3399ee'; ctx.fillRect(cx2-cw*.33,cy2-cw*.08,cw*.14,cw*.18); ctx.fillRect(cx2+cw*.19,cy2-cw*.08,cw*.14,cw*.18);
              // Head
              const hg=ctx.createRadialGradient(cx2-cw*.06,cy2-cw*.26,0,cx2,cy2-cw*.2,cw*.22);
              hg.addColorStop(0,'#ffd5a0'); hg.addColorStop(1,'#e8a860');
              ctx.fillStyle=hg; ctx.beginPath(); ctx.arc(cx2,cy2-cw*.22,cw*.2,0,Math.PI*2); ctx.fill();
              ctx.strokeStyle='#c07830'; ctx.lineWidth=1.2; ctx.stroke();
              // Eyes
              ctx.fillStyle='#222'; ctx.beginPath(); ctx.arc(cx2-cw*.07,cy2-cw*.25,cw*.04,0,Math.PI*2); ctx.arc(cx2+cw*.07,cy2-cw*.25,cw*.04,0,Math.PI*2); ctx.fill();
              // Smile
              ctx.strokeStyle='#994400'; ctx.lineWidth=1.5; ctx.lineCap='round';
              ctx.beginPath(); ctx.arc(cx2,cy2-cw*.2,cw*.08,.2,Math.PI-.2); ctx.stroke();
              // Hair
              ctx.fillStyle='#3a1a08'; ctx.beginPath(); ctx.arc(cx2,cy2-cw*.36,cw*.2,Math.PI,0); ctx.fill();
              ctx.fillStyle='#4a2a10'; ctx.beginPath(); ctx.arc(cx2-cw*.2,cy2-cw*.22,cw*.06,Math.PI*1.5,Math.PI*.5); ctx.fill();
            }
          }
        }
      }

      // Swipe
      let tx0=0,ty0=0;
      cv.ontouchstart = e=>{ tx0=e.touches[0].clientX; ty0=e.touches[0].clientY; e.preventDefault(); };
      cv.ontouchend = e=>{ const dx=e.changedTouches[0].clientX-tx0, dy=e.changedTouches[0].clientY-ty0; if(Math.abs(dx)+Math.abs(dy)<12)return; Math.abs(dx)>Math.abs(dy)?move(0,dx>0?1:-1):move(dy>0?1:-1,0); e.preventDefault(); };
    };

    const onKey = e => { const m={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1],w:[-1,0],s:[1,0],a:[0,-1],d:[0,1]}[e.key]; if(m){move(...m);e.preventDefault();} };
    window.addEventListener('keydown', onKey);
    SokobanGame._cleanup = () => window.removeEventListener('keydown', onKey);
    loadLevel(0);
  }
};
window.SokobanGame = SokobanGame;
