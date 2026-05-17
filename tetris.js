// TETRIS — NES Retro Style (bunte Blöcke, blaues Spielfeld)
const TetrisGame = {
  start({onComplete}) {
    const el = document.getElementById('game-area');
    if (!el) return;
    const COLS=10, ROWS=20;
    const DPR = Math.min(window.devicePixelRatio||1,2);
    const avW = Math.min((el.offsetWidth||320)-8, 320);
    const CS = Math.max(18, Math.floor(avW/(COLS+0.5)));
    const BW=COLS*CS, BH=ROWS*CS;
    const SBW=Math.max(80,CS*4); // sidebar

    const PIECES=[
      {cells:[[1,1,1,1]],           col:'#00f0f0',dark:'#009999',name:'I'},
      {cells:[[1,1],[1,1]],          col:'#f0f000',dark:'#999900',name:'O'},
      {cells:[[0,1,0],[1,1,1]],      col:'#a000f0',dark:'#600099',name:'T'},
      {cells:[[1,0,0],[1,1,1]],      col:'#f0a000',dark:'#996600',name:'L'},
      {cells:[[0,0,1],[1,1,1]],      col:'#0000f0',dark:'#000099',name:'J'},
      {cells:[[1,1,0],[0,1,1]],      col:'#00f000',dark:'#009900',name:'S'},
      {cells:[[0,1,1],[1,1,0]],      col:'#f00000',dark:'#990000',name:'Z'},
    ];

    el.innerHTML=`<div style="font-family:'Courier New',monospace;user-select:none;-webkit-user-select:none;display:inline-block;background:#000;border:3px solid #888;border-radius:4px;padding:6px;touch-action:none">
      <div style="display:flex;gap:6px;align-items:flex-start">
        <!-- Spielfeld -->
        <canvas id="trcv" width="${BW*DPR}" height="${BH*DPR}"
          style="width:${BW}px;height:${BH}px;display:block;border:2px solid #444;background:#000014"></canvas>
        <!-- Sidebar -->
        <div style="width:${SBW}px;display:flex;flex-direction:column;gap:6px">
          <div style="color:#f0f000;font-size:clamp(.7rem,2.5vw,.85rem);font-weight:900;text-shadow:0 0 6px #f0f000">SCORE</div>
          <div id="tr-score" style="color:#fff;font-size:clamp(.85rem,3vw,1.1rem);font-weight:900;min-height:20px">0</div>
          <div style="color:#f0f000;font-size:clamp(.7rem,2.5vw,.85rem);font-weight:900">LINES</div>
          <div id="tr-lines" style="color:#fff;font-size:clamp(.85rem,3vw,1rem)">0</div>
          <div style="color:#f0f000;font-size:clamp(.7rem,2.5vw,.85rem);font-weight:900">LEVEL</div>
          <div id="tr-level" style="color:#00f0f0;font-size:clamp(.85rem,3vw,1rem)">1</div>
          <div style="color:#aaa;font-size:clamp(.6rem,2vw,.75rem);margin-top:4px">NEXT</div>
          <canvas id="tr-next" width="${CS*4*DPR}" height="${CS*4*DPR}"
            style="width:${CS*4}px;height:${CS*4}px;background:#000014;border:1px solid #333"></canvas>
          <!-- Mobile buttons -->
          <div style="display:flex;flex-direction:column;gap:4px;margin-top:8px">
            <button id="tr-rot" style="${BTN('#a000f0')}">↻</button>
            <div style="display:flex;gap:4px">
              <button id="tr-left"  style="${BTN('#0000f0')}">◀</button>
              <button id="tr-right" style="${BTN('#0000f0')}">▶</button>
            </div>
            <button id="tr-down" style="${BTN('#f00000')}">▼</button>
          </div>
        </div>
      </div>
      <div style="color:rgba(255,255,255,.3);font-size:clamp(.6rem,2vw,.7rem);margin-top:4px;text-align:center">← → Bewegen · ↑ Drehen · ↓ Schnell</div>
    </div>`;

    function BTN(c){return `background:${c};color:#fff;border:2px solid rgba(255,255,255,.3);padding:clamp(8px,2.5vw,12px) 4px;border-radius:6px;font-size:clamp(.9rem,3vw,1.1rem);font-weight:900;cursor:pointer;width:100%;touch-action:none;box-shadow:0 3px 0 rgba(0,0,0,.5)`;}

    const cv=document.getElementById('trcv'), ctx=cv.getContext('2d');
    const nxCv=document.getElementById('tr-next'), nxCtx=nxCv.getContext('2d');
    ctx.scale(DPR,DPR); nxCtx.scale(DPR,DPR);

    let board=Array(ROWS).fill(null).map(()=>Array(COLS).fill(null));
    const pickPiece=()=>PIECES[Math.floor(Math.random()*PIECES.length)];
    let cur,curX,curY,curPiece,next=pickPiece(),score=0,lines=0,level=1,running=true,tStart=Date.now(),animId,lastDrop=0,dropInt=800;
    let holdIntervals=[];

    const newPiece=()=>{
      curPiece=next||pickPiece(); next=pickPiece();
      cur=curPiece.cells.map(r=>[...r]);
      curX=Math.floor((COLS-cur[0].length)/2); curY=0;
      if(!valid(cur,curX,curY)){running=false;cancelAnimationFrame(animId);
        holdIntervals.forEach(clearInterval);holdIntervals=[];
        window.removeEventListener('keydown',onKey);
        onComplete({rawScore:Math.min(100,Math.round(score/80+lines)),timeMs:Date.now()-tStart,errors:0,passed:score>200||lines>5});}
    };
    const valid=(piece,ox,oy)=>{
      for(let r=0;r<piece.length;r++) for(let c=0;c<piece[r].length;c++){
        if(!piece[r][c])continue;
        const nr=oy+r,nc=ox+c;
        if(nc<0||nc>=COLS||nr>=ROWS)return false;
        if(nr>=0&&board[nr][nc])return false;
      }return true;
    };
    const rotate=()=>{
      const rot=cur[0].map((_,i)=>cur.map(r=>r[i]).reverse());
      if(valid(rot,curX,curY))cur=rot;
    };
    const place=()=>{
      for(let r=0;r<cur.length;r++) for(let c=0;c<cur[r].length;c++)
        if(cur[r][c]&&curY+r>=0) board[curY+r][curX+c]=curPiece.col;
      // Clear lines
      let cleared=0;
      for(let r=ROWS-1;r>=0;r--){
        if(board[r].every(c=>c!==null)){board.splice(r,1);board.unshift(Array(COLS).fill(null));cleared++;r++;}
      }
      if(cleared){
        lines+=cleared; score+=[0,100,300,500,800][cleared]*(level);
        level=Math.floor(lines/10)+1; dropInt=Math.max(80,800-level*65);
      }
      newPiece();
    };

    // NES-style block drawing
    const drawBlock=(ctx2,x,y,size,col,dark,ghost=false)=>{
      if(ghost){ctx2.fillStyle='rgba(255,255,255,.08)';ctx2.fillRect(x+1,y+1,size-2,size-2);return;}
      // Main face
      ctx2.fillStyle=col;ctx2.fillRect(x,y,size,size);
      // Left+top highlight
      ctx2.fillStyle='rgba(255,255,255,.45)';ctx2.fillRect(x,y,size,2);ctx2.fillRect(x,y,2,size);
      // Right+bottom dark
      ctx2.fillStyle=dark;ctx2.fillRect(x+size-3,y+3,3,size-3);ctx2.fillRect(x+3,y+size-3,size-3,3);
      // Inner shadow
      ctx2.fillStyle='rgba(0,0,0,.15)';ctx2.fillRect(x+3,y+3,size-6,size-6);
    };

    const drawBoard=()=>{
      ctx.fillStyle='#000014';ctx.fillRect(0,0,BW,BH);
      // Grid lines
      ctx.strokeStyle='rgba(100,100,180,.12)';ctx.lineWidth=1;
      for(let r=0;r<ROWS;r++){ctx.beginPath();ctx.moveTo(0,r*CS);ctx.lineTo(BW,r*CS);ctx.stroke();}
      for(let c=0;c<COLS;c++){ctx.beginPath();ctx.moveTo(c*CS,0);ctx.lineTo(c*CS,BH);ctx.stroke();}
      // Placed blocks
      for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++)
        if(board[r][c]) drawBlock(ctx,c*CS,r*CS,CS,board[r][c],darken(board[r][c]));
      // Ghost piece
      let ghostY=curY;
      while(valid(cur,curX,ghostY+1))ghostY++;
      if(ghostY!==curY) for(let r=0;r<cur.length;r++) for(let c=0;c<cur[r].length;c++)
        if(cur[r][c]&&ghostY+r>=0) drawBlock(ctx,(curX+c)*CS,(ghostY+r)*CS,CS,'#fff','#888',true);
      // Current piece
      for(let r=0;r<cur.length;r++) for(let c=0;c<cur[r].length;c++)
        if(cur[r][c]&&curY+r>=0) drawBlock(ctx,(curX+c)*CS,(curY+r)*CS,CS,curPiece.col,darken(curPiece.col));
    };

    const darken=hex=>{
      let r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
      return `#${Math.max(0,r-80).toString(16).padStart(2,'0')}${Math.max(0,g-80).toString(16).padStart(2,'0')}${Math.max(0,b-80).toString(16).padStart(2,'0')}`;
    };

    const drawNext=()=>{
      if(!next||!next.cells||!next.cells[0])return;
      nxCtx.fillStyle='#000014';nxCtx.fillRect(0,0,CS*4,CS*4);
      const off=[(CS*4-next.cells[0].length*CS)/2,(CS*4-next.cells.length*CS)/2];
      for(let r=0;r<next.cells.length;r++) for(let c=0;c<next.cells[r].length;c++)
        if(next.cells[r][c]) drawBlock(nxCtx,off[0]+c*CS,off[1]+r*CS,CS,next.col,darken(next.col));
    };

    const updHUD=()=>{
      document.getElementById('tr-score').textContent=score.toLocaleString();
      document.getElementById('tr-lines').textContent=lines;
      document.getElementById('tr-level').textContent=level;
    };

    const onKey=e=>{
      if(!running)return;
      if(e.key==='ArrowLeft'){if(valid(cur,curX-1,curY))curX--;}
      else if(e.key==='ArrowRight'){if(valid(cur,curX+1,curY))curX++;}
      else if(e.key==='ArrowUp'||e.code==='KeyX'){rotate();}
      else if(e.key==='ArrowDown'){if(valid(cur,curX,curY+1)){curY++;score+=1;}else place();}
      else if(e.code==='Space'){while(valid(cur,curX,curY+1)){curY++;score+=2;}place();}
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown',onKey);

    // Mobile buttons
    const wireBtn=(id,fn)=>{const b=document.getElementById(id);if(!b)return;
      b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);fn();});};
    wireBtn('tr-rot',rotate);
    let leftIv=null;
    const wireHold=(id,fn)=>{const b=document.getElementById(id);if(!b)return;
      let iv=null;
      b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);fn();clearInterval(iv);iv=setInterval(fn,110);holdIntervals.push(iv);});
      ['pointerup','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>{clearInterval(iv);iv=null;}));};
    wireHold('tr-left',()=>{if(valid(cur,curX-1,curY))curX--;});
    wireHold('tr-right',()=>{if(valid(cur,curX+1,curY))curX++;});
    wireHold('tr-down',()=>{if(valid(cur,curX,curY+1)){curY++;score+=1;}else place();});

    let lastTime=0;
    const loop=(ts)=>{
      if(!running)return;
      animId=requestAnimationFrame(loop);
      if(ts-lastTime>dropInt){
        lastTime=ts;
        if(valid(cur,curX,curY+1))curY++; else place();
      }
      drawBoard();drawNext();updHUD();
    };
    newPiece();
    animId=requestAnimationFrame(loop);
    const cleanupTetris=()=>{running=false;cancelAnimationFrame(animId);holdIntervals.forEach(clearInterval);holdIntervals=[];window.removeEventListener('keydown',onKey);};
    setTimeout(()=>{if(running){cleanupTetris();onComplete({rawScore:Math.min(100,Math.round(score/80+lines)),timeMs:Date.now()-tStart,errors:0,passed:score>100});}},180000);
  }
};
