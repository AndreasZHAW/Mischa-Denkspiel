// PACMAN GAME - replaces Simon II
const PacmanGame = {
  start({onComplete}) {
    const el = document.getElementById('game-area');
    if (!el) return;
    const W=21, H=17, CELL=22;
    // Maze layout (1=wall, 0=dot, 2=power, 3=empty)
    const maze0=[
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
      [1,2,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,2,1],
      [1,0,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,1,0,1,0,1,1,1,1,1,1,1,0,1,0,1,1,0,1],
      [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
      [1,1,1,1,0,1,1,1,3,3,3,3,3,1,1,1,0,1,1,1,1],
      [1,1,1,1,0,1,3,3,3,3,3,3,3,3,3,1,0,1,1,1,1],
      [1,1,1,1,0,1,3,1,1,3,3,3,1,1,3,1,0,1,1,1,1],
      [3,3,3,3,0,3,3,1,3,3,3,3,3,1,3,3,0,3,3,3,3],
      [1,1,1,1,0,1,3,1,1,1,1,1,1,1,3,1,0,1,1,1,1],
      [1,1,1,1,0,1,3,3,3,3,3,3,3,3,3,1,0,1,1,1,1],
      [1,1,1,1,0,1,3,1,1,1,1,1,1,1,3,1,0,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
      [1,2,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,2,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ];
    let maze=maze0.map(r=>[...r]);
    let px=10,py=14,dx=0,dy=0,score=0,lives=3,powered=0;
    let ghosts=[{x:9,y:9,dx:1,dy:0,scared:false},{x:10,y:9,dx:-1,dy:0,scared:false},{x:11,y:9,dx:0,dy:1,scared:false}];
    let totalDots=maze.flat().filter(c=>c===0||c===2).length;
    let eaten=0,running=true,tStart=Date.now();
    let animId;

    el.innerHTML=`<div style="text-align:center">
      <canvas id="pcv" width="${W*CELL}" height="${H*CELL+40}" style="background:#000;border-radius:8px;max-width:100%;touch-action:none"></canvas>
      <div style="margin-top:8px;display:flex;justify-content:center;gap:10px">
        <button onclick="PacmanGame._dir(0,-1)" style="background:#333;color:#fff;border:none;padding:10px 16px;border-radius:8px;font-size:1.2rem;cursor:pointer">▲</button>
      </div>
      <div style="display:flex;justify-content:center;gap:10px;margin-top:6px">
        <button onclick="PacmanGame._dir(-1,0)" style="background:#333;color:#fff;border:none;padding:10px 16px;border-radius:8px;font-size:1.2rem;cursor:pointer">◀</button>
        <button onclick="PacmanGame._dir(0,1)" style="background:#333;color:#fff;border:none;padding:10px 16px;border-radius:8px;font-size:1.2rem;cursor:pointer">▼</button>
        <button onclick="PacmanGame._dir(1,0)" style="background:#333;color:#fff;border:none;padding:10px 16px;border-radius:8px;font-size:1.2rem;cursor:pointer">▶</button>
      </div>
    </div>`;

    const cv=document.getElementById('pcv'),ctx=cv.getContext('2d');
    this._dir=(ddx,ddy)=>{dx=ddx;dy=ddy;};
    window.PacmanGame=this;

    // Key controls
    const onKey=e=>{
      if(e.key==='ArrowUp')dy=-1,dx=0;
      else if(e.key==='ArrowDown')dy=1,dx=0;
      else if(e.key==='ArrowLeft')dx=-1,dy=0;
      else if(e.key==='ArrowRight')dx=1,dy=0;
    };
    window.addEventListener('keydown',onKey);

    const draw=()=>{
      ctx.fillStyle='#000';ctx.fillRect(0,0,W*CELL,H*CELL+40);
      // Maze
      for(let y=0;y<H;y++){for(let x=0;x<W;x++){
        const c=maze[y][x];
        if(c===1){ctx.fillStyle='#00f';ctx.fillRect(x*CELL,y*CELL,CELL,CELL);}
        else if(c===0){ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x*CELL+CELL/2,y*CELL+CELL/2,2,0,Math.PI*2);ctx.fill();}
        else if(c===2){ctx.fillStyle='#ff0';ctx.beginPath();ctx.arc(x*CELL+CELL/2,y*CELL+CELL/2,5,0,Math.PI*2);ctx.fill();}
      }}
      // Ghosts
      ghosts.forEach(g=>{
        ctx.fillStyle=g.scared?'#00f':'#f00';
        ctx.beginPath();ctx.arc(g.x*CELL+CELL/2,g.y*CELL+CELL/2,CELL/2-2,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#fff';ctx.font='10px sans-serif';ctx.textAlign='center';
        ctx.fillText(g.scared?'👻':'👾',g.x*CELL+CELL/2,g.y*CELL+CELL/2+4);
      });
      // Pacman
      const ang=Math.atan2(dy,dx)||0;
      ctx.fillStyle='#ff0';ctx.beginPath();
      ctx.moveTo(px*CELL+CELL/2,py*CELL+CELL/2);
      ctx.arc(px*CELL+CELL/2,py*CELL+CELL/2,CELL/2-2,ang+0.3,ang+Math.PI*2-0.3);
      ctx.closePath();ctx.fill();
      // HUD
      ctx.fillStyle='#fff';ctx.font='14px monospace';ctx.textAlign='left';
      ctx.fillText('Score: '+score,5,H*CELL+20);
      ctx.textAlign='right';
      ctx.fillText('❤️'.repeat(lives),W*CELL-5,H*CELL+20);
    };

    const moveGhost=g=>{
      const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
      const valid=dirs.filter(([gx,gy])=>maze[g.y+gy]?.[g.x+gx]!==1&&!(g.dx===-gx&&g.dy===-gy));
      if(!valid.length)return;
      // Chase pacman or random if scared
      let best=valid[Math.floor(Math.random()*valid.length)];
      if(!g.scared){
        let minD=999;
        valid.forEach(([gx,gy])=>{const d=Math.abs(g.x+gx-px)+Math.abs(g.y+gy-py);if(d<minD){minD=d;best=[gx,gy];}});
      }
      if(maze[g.y+best[1]]?.[g.x+best[0]]!==1){g.x+=best[0];g.y+=best[1];g.dx=best[0];g.dy=best[1];}
    };

    let tick=0;
    const loop=()=>{
      if(!running)return;
      tick++;
      if(tick%10===0){
        // Move pacman
        const nx=px+dx,ny=py+dy;
        if(nx>=0&&nx<W&&ny>=0&&ny<H&&maze[ny][nx]!==1){
          px=nx;py=ny;
          if(maze[ny][nx]===0){maze[ny][nx]=3;score+=10;eaten++;}
          else if(maze[ny][nx]===2){maze[ny][nx]=3;score+=50;powered=30;ghosts.forEach(g=>g.scared=true);}
        }
        // Move ghosts
        ghosts.forEach(moveGhost);
        if(powered>0){powered--;if(powered===0)ghosts.forEach(g=>g.scared=false);}
        // Ghost collision
        ghosts.forEach(g=>{
          if(Math.abs(g.x-px)<=1&&Math.abs(g.y-py)<=1){
            if(g.scared){g.scared=false;g.x=10;g.y=9;score+=200;}
            else{lives--;if(lives<=0){running=false;const t=Date.now()-tStart;window.removeEventListener('keydown',onKey);cancelAnimationFrame(animId);onComplete({rawScore:Math.min(100,Math.round(score/5)),timeMs:t,errors:0,passed:score>100});return;}px=10;py=14;}
          }
        });
        // Win
        if(eaten>=totalDots){running=false;window.removeEventListener('keydown',onKey);cancelAnimationFrame(animId);onComplete({rawScore:95,timeMs:Date.now()-tStart,errors:0,passed:true});return;}
        // Time limit 90s
        if(Date.now()-tStart>90000){running=false;window.removeEventListener('keydown',onKey);cancelAnimationFrame(animId);onComplete({rawScore:Math.min(100,Math.round(score/5)),timeMs:90000,errors:0,passed:score>50});}
      }
      draw();
      animId=requestAnimationFrame(loop);
    };
    loop();
  }
};
window.PacmanGame=PacmanGame;
