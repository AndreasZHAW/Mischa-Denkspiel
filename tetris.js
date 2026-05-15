// TETRIS - replaces Tippen
const TetrisGame = {
  start({onComplete}) {
    const el = document.getElementById('game-area');
    if (!el) return;
    const COLS=10,ROWS=20,CS=22;
    const PIECES=[
      [[1,1,1,1]],
      [[1,1],[1,1]],
      [[0,1,0],[1,1,1]],
      [[1,0],[1,0],[1,1]],
      [[0,1],[0,1],[1,1]],
      [[1,1,0],[0,1,1]],
      [[0,1,1],[1,1,0]],
    ];
    const COLORS=['#00CFFF','#FFD700','#9B59B6','#E67E22','#3498DB','#E74C3C','#27AE60'];
    el.innerHTML=`<div style="display:flex;gap:10px;justify-content:center;align-items:flex-start">
      <canvas id="trcv" width="${COLS*CS}" height="${ROWS*CS}" style="border:2px solid #333;border-radius:4px;background:#111;display:block;margin:0 auto;max-width:100%"></canvas>
      <div style="display:flex;flex-direction:column;gap:8px;padding-top:10px">
        <div id="tr-score" style="color:#FFD700;font-weight:900;font-size:1rem;min-width:80px">Score:<br>0</div>
        <div id="tr-level" style="color:#29B6F6;font-size:.85rem">Level: 1</div>
        <button id="tr-rot" style="background:#9B59B6;color:#fff;border:none;padding:10px;border-radius:8px;cursor:pointer;font-weight:900">↻ Dreh</button>
        <button id="tr-left" style="background:#2c3e50;color:#fff;border:none;padding:10px;border-radius:8px;cursor:pointer">◀</button>
        <button id="tr-right" style="background:#2c3e50;color:#fff;border:none;padding:10px;border-radius:8px;cursor:pointer">▶</button>
        <button id="tr-down" style="background:#E74C3C;color:#fff;border:none;padding:10px;border-radius:8px;cursor:pointer">▼ Drop</button>
      </div>
    </div>`;
    const cv=document.getElementById('trcv'),ctx=cv.getContext('2d');
    let board=Array(ROWS).fill(null).map(()=>Array(COLS).fill(0));
    let cur,curX,curY,curCol,score=0,lines=0,level=1,running=true,tStart=Date.now(),animId,lastDrop=0;
    const newPiece=()=>{
      const i=Math.floor(Math.random()*PIECES.length);
      cur=PIECES[i].map(r=>[...r]);curCol=COLORS[i];
      curX=Math.floor(COLS/2)-Math.floor(cur[0].length/2);curY=0;
      if(!valid(cur,curX,curY)){running=false;cancelAnimationFrame(animId);
        window.removeEventListener('keydown',onKey);
        onComplete({rawScore:Math.min(100,Math.round(score/20)),timeMs:Date.now()-tStart,errors:0,passed:score>100});}
    };
    const valid=(p,ox,oy)=>{
      for(let r=0;r<p.length;r++)for(let c=0;c<p[r].length;c++){
        if(!p[r][c])continue;const nx=ox+c,ny=oy+r;
        if(nx<0||nx>=COLS||ny>=ROWS)return false;
        if(ny>=0&&board[ny][nx])return false;
      }return true;
    };
    const place=()=>{
      for(let r=0;r<cur.length;r++)for(let c=0;c<cur[r].length;c++){
        if(cur[r][c]&&curY+r>=0)board[curY+r][curX+c]=curCol;
      }
      // Clear lines
      let cleared=0;
      board=board.filter(row=>{if(row.every(c=>c)){cleared++;return false;}return true;});
      while(board.length<ROWS)board.unshift(Array(COLS).fill(0));
      lines+=cleared;score+=[0,100,300,500,800][cleared]||0;
      level=Math.floor(lines/10)+1;
      document.getElementById('tr-score').innerHTML='Score:<br>'+score;
      document.getElementById('tr-level').textContent='Level: '+level;
      newPiece();
    };
    const rotate=()=>{const p=cur[0].map((_,i)=>cur.map(r=>r[i]).reverse());if(valid(p,curX,curY))cur=p;};
    document.getElementById('tr-rot').addEventListener('click',rotate);
    document.getElementById('tr-left').addEventListener('click',()=>{if(valid(cur,curX-1,curY))curX--;});
    document.getElementById('tr-right').addEventListener('click',()=>{if(valid(cur,curX+1,curY))curX++;});
    document.getElementById('tr-down').addEventListener('click',()=>{while(valid(cur,curX,curY+1))curY++;place();});
    const onKey=e=>{
      if(e.key==='ArrowLeft'){if(valid(cur,curX-1,curY))curX--;}
      else if(e.key==='ArrowRight'){if(valid(cur,curX+1,curY))curX++;}
      else if(e.key==='ArrowDown'){if(valid(cur,curX,curY+1))curY++;}
      else if(e.key==='ArrowUp'||e.key===' ')rotate();
    };
    window.addEventListener('keydown',onKey);
    newPiece();
    const loop=(ts)=>{
      if(!running)return;
      const interval=Math.max(100,500-level*50);
      if(ts-lastDrop>interval){
        if(valid(cur,curX,curY+1))curY++;else place();
        lastDrop=ts;
      }
      // Draw
      ctx.fillStyle='#111';ctx.fillRect(0,0,COLS*CS,ROWS*CS);
      ctx.strokeStyle='#222';ctx.lineWidth=0.5;
      for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
        if(board[r][c]){ctx.fillStyle=board[r][c];ctx.fillRect(c*CS+1,r*CS+1,CS-2,CS-2);}
        ctx.strokeRect(c*CS,r*CS,CS,CS);
      }
      // Current piece
      if(cur){
        // Ghost piece
        let ghostY=curY;while(valid(cur,curX,ghostY+1))ghostY++;
        ctx.globalAlpha=0.2;
        cur.forEach((row,r)=>row.forEach((v,c)=>{if(v){ctx.fillStyle=curCol;ctx.fillRect((curX+c)*CS+1,(ghostY+r)*CS+1,CS-2,CS-2);}}));
        ctx.globalAlpha=1;
        cur.forEach((row,r)=>row.forEach((v,c)=>{if(v){ctx.fillStyle=curCol;ctx.fillRect((curX+c)*CS+1,(curY+r)*CS+1,CS-2,CS-2);}}));
      }
      animId=requestAnimationFrame(loop);
    };
    animId=requestAnimationFrame(loop);
    // Time limit 3 min
    setTimeout(()=>{if(running){running=false;cancelAnimationFrame(animId);window.removeEventListener('keydown',onKey);onComplete({rawScore:Math.min(100,Math.round(score/20)),timeMs:180000,errors:0,passed:score>200});}},180000);
  }
};
window.TetrisGame=TetrisGame;
