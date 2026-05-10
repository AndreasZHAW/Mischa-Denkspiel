// PAC-MAN - smooth, keyboard + touch controls
const PacmanGame = {
  start({onComplete}) {
    const el = document.getElementById('game-area');
    if (!el) return;

    const CELL=24, COLS=19, ROWS=21;
    // Classic Pac-Man maze (1=wall, 0=dot, 2=power, 3=empty)
    const MAZE_TEMPLATE = [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
      [1,2,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,2,1],
      [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,1],
      [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
      [1,1,1,1,0,1,1,1,3,3,3,1,1,1,0,1,1,1,1],
      [1,1,1,1,0,1,3,3,3,3,3,3,3,1,0,1,1,1,1],
      [1,1,1,1,0,1,3,1,1,3,1,1,3,1,0,1,1,1,1],
      [3,3,3,3,0,3,3,1,3,3,3,1,3,3,0,3,3,3,3],
      [1,1,1,1,0,1,3,1,1,1,1,1,3,1,0,1,1,1,1],
      [1,1,1,1,0,1,3,3,3,3,3,3,3,1,0,1,1,1,1],
      [1,1,1,1,0,1,3,1,1,1,1,1,3,1,0,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
      [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
      [1,2,0,1,0,0,0,0,0,3,0,0,0,0,0,1,0,2,1],
      [1,1,0,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,1],
      [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
      [1,0,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ];

    const W=COLS*CELL, H=ROWS*CELL;
    el.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
        <div style="font-size:.75rem;color:rgba(255,255,255,.5)">Pfeiltasten oder Buttons zum Steuern</div>
        <canvas id="pccv" width="${W}" height="${H}" style="background:#000;border-radius:6px;max-width:min(${W}px,90vw)"></canvas>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;width:140px">
          <div></div>
          <button class="pc-btn" data-d="up" style="background:#2c3e50;color:#fff;border:1px solid #555;padding:10px;border-radius:8px;font-size:1.1rem;cursor:pointer;touch-action:none">▲</button>
          <div></div>
          <button class="pc-btn" data-d="left" style="background:#2c3e50;color:#fff;border:1px solid #555;padding:10px;border-radius:8px;font-size:1.1rem;cursor:pointer;touch-action:none">◀</button>
          <button class="pc-btn" data-d="down" style="background:#2c3e50;color:#fff;border:1px solid #555;padding:10px;border-radius:8px;font-size:1.1rem;cursor:pointer;touch-action:none">▼</button>
          <button class="pc-btn" data-d="right" style="background:#2c3e50;color:#fff;border:1px solid #555;padding:10px;border-radius:8px;font-size:1.1rem;cursor:pointer;touch-action:none">▶</button>
        </div>
      </div>`;

    const cv = document.getElementById('pccv');
    const ctx = cv.getContext('2d');
    let maze = MAZE_TEMPLATE.map(r => [...r]);
    let totalDots = maze.flat().filter(c => c===0||c===2).length;
    let eaten = 0, score = 0, lives = 3, powered = 0, powMax = 80;
    let running = true, tStart = Date.now(), animId, frameN = 0;

    // Pac-Man - moves in GRID steps
    let px=9, py=16; // grid position
    let wantDx=1, wantDy=0, curDx=1, curDy=0;
    let subX=0, subY=0; // sub-cell position (0..1)
    const SPEED = 0.12; // cells per frame

    // Ghosts
    let ghosts = [
      {x:8, y:9, tx:0, ty:0, scared:false, col:'#FF4444'},
      {x:9, y:9, tx:0, ty:0, scared:false, col:'#FFB8FF'},
      {x:10,y:9, tx:0, ty:0, scared:false, col:'#00FFFF'},
    ];

    const can = (gx,gy) => maze[gy]?.[gx] !== 1;

    // Button controls
    const DIRS = {up:[0,-1], down:[0,1], left:[-1,0], right:[1,0]};
    document.querySelectorAll('.pc-btn').forEach(b => {
      b.addEventListener('pointerdown', e => {
        e.preventDefault();
        const [ddx,ddy] = DIRS[b.dataset.d];
        wantDx=ddx; wantDy=ddy;
      });
    });
    const onKey = e => {
      if(e.key==='ArrowUp'){wantDx=0;wantDy=-1;}
      else if(e.key==='ArrowDown'){wantDx=0;wantDy=1;}
      else if(e.key==='ArrowLeft'){wantDx=-1;wantDy=0;}
      else if(e.key==='ArrowRight'){wantDx=1;wantDy=0;}
    };
    window.addEventListener('keydown', onKey);

    const end = (won) => {
      running=false; cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKey);
      onComplete({rawScore:Math.min(100,Math.round(score/3)),timeMs:Date.now()-tStart,errors:lives<3?1:0,passed:won||score>200});
    };

    const moveGhost = (g) => {
      const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
      const valid = dirs.filter(([dx,dy]) => can(g.x+dx, g.y+dy) && !(dx===-g.tx&&dy===-g.ty));
      if (!valid.length) return;
      let best = valid[Math.floor(Math.random()*valid.length)];
      if (!g.scared && Math.random()>0.3) {
        let minD=999;
        valid.forEach(([dx,dy])=>{
          const d=Math.abs(g.x+dx-px)+Math.abs(g.y+dy-py);
          if(d<minD){minD=d;best=[dx,dy];}
        });
      }
      [g.tx,g.ty]=[best[0],best[1]];
      g.x+=best[0]; g.y+=best[1];
    };

    const loop = () => {
      if (!running) return;
      frameN++;

      // Move pac-man (try desired dir, else keep current)
      subX += (curDx||0)*SPEED;
      subY += (curDy||0)*SPEED;
      if (Math.abs(subX)>=1||Math.abs(subY)>=1) {
        const nx=px+Math.sign(subX||curDx), ny=py+Math.sign(subY||curDy);
        if (can(nx,ny)) { px=nx; py=ny; subX=0; subY=0; }
        else { subX=0; subY=0; }
        // Try switching to wanted dir
        if (can(px+wantDx, py+wantDy)) { curDx=wantDx; curDy=wantDy; }
        // Eat dot
        const c = maze[py][px];
        if (c===0){maze[py][px]=3;score+=10;eaten++;}
        else if(c===2){maze[py][px]=3;score+=50;eaten++;powered=powMax;ghosts.forEach(g=>g.scared=true);}
      }
      // Try switching dir at grid boundary
      if(Math.abs(subX)<0.05&&Math.abs(subY)<0.05&&can(px+wantDx,py+wantDy)){curDx=wantDx;curDy=wantDy;}

      // Move ghosts every 15 frames
      if (frameN%15===0) ghosts.forEach(g=>moveGhost(g));

      // Power countdown
      if(powered>0){powered--;if(powered===0)ghosts.forEach(g=>g.scared=false);}

      // Ghost collisions
      for(const g of ghosts){
        if(g.x===px&&g.y===py){
          if(g.scared){g.scared=false;g.x=9;g.y=9;score+=200;g.tx=0;g.ty=0;}
          else{lives--;if(lives<=0){end(false);return;}px=9;py=16;curDx=1;curDy=0;wantDx=1;wantDy=0;}
        }
      }
      // Win
      if(eaten>=totalDots){end(true);return;}
      // Time
      if(Date.now()-tStart>90000){end(false);}

      // ─── DRAW ───
      ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
      // Maze
      for(let ry=0;ry<ROWS;ry++) for(let rx=0;rx<COLS;rx++){
        const c=maze[ry][rx];
        if(c===1){
          ctx.fillStyle='#1a1aff';ctx.fillRect(rx*CELL,ry*CELL,CELL,CELL);
          // Inner glow
          ctx.fillStyle='#0000aa';ctx.fillRect(rx*CELL+2,ry*CELL+2,CELL-4,CELL-4);
        } else if(c===0){
          ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(rx*CELL+CELL/2,ry*CELL+CELL/2,2,0,Math.PI*2);ctx.fill();
        } else if(c===2){
          const pulse=0.7+0.3*Math.sin(frameN*0.15);
          ctx.fillStyle=`rgba(255,200,0,${pulse})`;ctx.beginPath();ctx.arc(rx*CELL+CELL/2,ry*CELL+CELL/2,5,0,Math.PI*2);ctx.fill();
        }
      }
      // Ghosts
      ghosts.forEach(g=>{
        ctx.fillStyle=g.scared?(frameN%20<10?'#0000ff':'#fff'):g.col;
        ctx.beginPath();ctx.arc(g.x*CELL+CELL/2,g.y*CELL+CELL/2,CELL/2-2,Math.PI,0);
        ctx.lineTo(g.x*CELL+CELL-2,g.y*CELL+CELL/2+4);
        for(let w=0;w<3;w++){ctx.lineTo(g.x*CELL+CELL-2-w*(CELL-4)/3,g.y*CELL+CELL/2+(w%2===0?4:0));}
        ctx.lineTo(g.x*CELL+2,g.y*CELL+CELL/2+4);ctx.closePath();ctx.fill();
        if(!g.scared){ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(g.x*CELL+CELL/2-3,g.y*CELL+CELL/2-2,3,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(g.x*CELL+CELL/2+4,g.y*CELL+CELL/2-2,3,0,Math.PI*2);ctx.fill();}
      });
      // Pac-Man
      const drawX=(px+subX)*CELL+CELL/2, drawY=(py+subY)*CELL+CELL/2;
      const mouthAngle=Math.abs(Math.sin(frameN*0.2))*0.4;
      const facing=Math.atan2(curDy,curDx);
      ctx.fillStyle='#FFD700';ctx.beginPath();
      ctx.moveTo(drawX,drawY);
      ctx.arc(drawX,drawY,CELL/2-2,facing+mouthAngle,facing+Math.PI*2-mouthAngle);
      ctx.closePath();ctx.fill();
      // HUD
      ctx.fillStyle='rgba(0,0,0,.7)';ctx.fillRect(0,H-28,W,28);
      ctx.fillStyle='#FFD700';ctx.font='bold 13px monospace';ctx.textAlign='left';
      ctx.fillText('Score: '+score,6,H-10);
      ctx.textAlign='center';ctx.fillStyle='#fff';
      ctx.fillText('❤️'.repeat(lives),W/2,H-10);
      if(powered>0){ctx.fillStyle='#0099ff';ctx.fillText('POWER! '+Math.ceil(powered/10)+'s',W*0.8,H-10);}
      animId=requestAnimationFrame(loop);
    };
    loop();
  }
};
window.PacmanGame=PacmanGame;
