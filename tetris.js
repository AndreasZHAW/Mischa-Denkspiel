// TETRIS — NES Retro Style (bunte Blöcke, blaues Spielfeld)
const TetrisGame = {
  start({onComplete}) {
    const el = document.getElementById('game-area');
    if (!el) return;
    const COLS=10, ROWS=20;
    const DPR = Math.min(window.devicePixelRatio||1,2);
    const isMobile = window.innerWidth < 750;
    // Cell size: fit both width AND height of available space
    const elW = Math.max(el.offsetWidth||320, window.innerWidth * 0.5);
    // iOS Safari's toolbar can retract/expand during play, so
    // window.innerHeight at game-start isn't necessarily the height
    // that's actually available a moment later — reserve extra margin
    // (was 200px) so the control buttons below the board don't end up
    // pushed just past the edge once the toolbar reappears.
    const elH = window.innerHeight - (isMobile ? 260 : 200);
    const csFromW = Math.floor((Math.min(elW, isMobile ? 420 : 340)) / COLS);
    const csFromH = Math.floor(elH / ROWS);
    // The old hard floor of 18px-per-cell could FORCE the board to be
    // taller than the actual available space on a genuinely small/zoomed
    // screen — the height-based limit (csFromH) was being overridden
    // rather than respected, which is exactly how the control buttons
    // ended up pushed off-screen no matter how much margin was reserved
    // above. Floor lowered to 12px (still just about legible) so the
    // height constraint actually wins when the screen is this tight.
    const CS = Math.max(12, Math.min(csFromW, csFromH));
    console.log('[Tetris-debug] Vor Berechnung: window='+window.innerWidth+'x'+window.innerHeight+' el.offsetWidth='+(el.offsetWidth||'?')+' isMobile='+isMobile+' elW='+elW+' elH='+elH+' csFromW='+csFromW+' csFromH='+csFromH+' → gewähltes CS='+CS+(csFromH<12?' ⚠️ csFromH lag unter dem Minimum — Feld ist trotzdem zu hoch für den Platz!':''));
    const BW = COLS * CS, BH = ROWS * CS;
    const SBW = Math.max(80, CS*4); // sidebar for desktop
    // Height reserved for the fixed control bar at the bottom of the
    // viewport (see below) — used as bottom padding on the scrollable
    // board so the board's own content never sits underneath it.
    const CTRL_H = 104;

    const PIECES=[
      {cells:[[1,1,1,1]],           col:'#00f0f0',dark:'#009999',name:'I'},
      {cells:[[1,1],[1,1]],          col:'#f0f000',dark:'#999900',name:'O'},
      {cells:[[0,1,0],[1,1,1]],      col:'#a000f0',dark:'#600099',name:'T'},
      {cells:[[1,0,0],[1,1,1]],      col:'#f0a000',dark:'#996600',name:'L'},
      {cells:[[0,0,1],[1,1,1]],      col:'#0000f0',dark:'#000099',name:'J'},
      {cells:[[1,1,0],[0,1,1]],      col:'#00f000',dark:'#009900',name:'S'},
      {cells:[[0,1,1],[1,1,0]],      col:'#f00000',dark:'#990000',name:'Z'},
    ];

    // Layout: responsive for mobile/desktop
    // Control buttons are NOT nested inside the scrollable board container
    // below — they're a separately fixed-position bar (see further down).
    // Why: the board container relies on overflow-y:auto (+ max-height) to
    // let you scroll down to the buttons if the board is taller than the
    // screen. That's exactly the kind of nested-scroll-container that iOS
    // Safari has a long, well-documented history of NOT handling reliably
    // via touch (works fine with a mouse on desktop, and Android's WebView/
    // Chrome handles nested overflow scrolling fine too) — matching
    // exactly the reported pattern: broken on iPhone AND iPad, fine on
    // Android and PC. Pinning the buttons to the viewport with
    // position:fixed sidesteps the whole question of whether the nested
    // scroll works at all: they're always on-screen, full stop.
    el.innerHTML=`<div style="font-family:'Courier New',monospace;user-select:none;-webkit-user-select:none;background:#000;border:3px solid #555;border-radius:8px;padding:6px;touch-action:none;max-width:${BW+SBW+24}px;max-height:100dvh;overflow-y:auto;-webkit-overflow-scrolling:touch;margin:0 auto;padding-bottom:${CTRL_H}px;box-sizing:border-box">
      <!-- Stats row above canvas -->
      <div style="display:flex;justify-content:space-between;align-items:center;padding:2px 4px;margin-bottom:4px">
        <div style="text-align:center">
          <div style="color:#f0f000;font-size:.65rem;font-weight:900">SCORE</div>
          <div id="tr-score" style="color:#fff;font-size:.95rem;font-weight:900">0</div>
        </div>
        <div style="text-align:center">
          <div style="color:#f0f000;font-size:.65rem;font-weight:900">LINES</div>
          <div id="tr-lines" style="color:#fff;font-size:.95rem">0</div>
        </div>
        <div style="text-align:center">
          <div style="color:#f0f000;font-size:.65rem;font-weight:900">LEVEL</div>
          <div id="tr-level" style="color:#00f0f0;font-size:.95rem">1</div>
        </div>
        <div style="text-align:center">
          <div style="color:#aaa;font-size:.65rem">NEXT</div>
          <canvas id="tr-next" width="${CS*4*DPR}" height="${CS*4*DPR}"
            style="width:${CS*3.2}px;height:${CS*3.2}px;background:#000014;border:1px solid #333;display:block"></canvas>
        </div>
      </div>
      <!-- Full-width canvas -->
      <canvas id="trcv" width="${BW*DPR}" height="${BH*DPR}"
        style="width:${BW}px;height:${BH}px;display:block;border:2px solid #444;background:#000014;margin:0 auto"></canvas>
    </div>`;

    function BTN(c){return `background:${c};color:#fff;border:2px solid rgba(255,255,255,.2);padding:12px 4px 10px;border-radius:12px;font-size:1.7rem;font-weight:900;cursor:pointer;width:100%;touch-action:none;box-shadow:0 4px 0 rgba(0,0,0,.7);-webkit-tap-highlight-color:transparent;line-height:1.2;text-align:center`;}

    // Fixed control bar — appended straight to <body>, positioned by the
    // VIEWPORT (not by anything inside #game-area), so no ancestor's
    // scroll state, height calc, or overflow setting can ever push it out
    // of view. Any stale one from a previous Tetris session is removed
    // first (defensive — also cleaned up on leaving, see app.js
    // _confirmLeave/_showTaskComplete/launchGame).
    document.getElementById('tetris-fixed-controls')?.remove();
    const ctrlBar=document.createElement('div');
    ctrlBar.id='tetris-fixed-controls';
    ctrlBar.style.cssText=`position:fixed;left:0;right:0;bottom:0;z-index:9500;display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:5px;padding:6px 8px calc(6px + env(safe-area-inset-bottom,0px));background:rgba(0,0,0,.92);backdrop-filter:blur(4px);box-sizing:border-box`;
    ctrlBar.innerHTML=`
      <button id="tr-left"  style="${BTN('#1a40c0')}">◀<br><span style="font-size:.58rem;opacity:.75">Links</span></button>
      <button id="tr-rot"   style="${BTN('#8800aa')}">↻<br><span style="font-size:.58rem;opacity:.75">Drehen</span></button>
      <button id="tr-down"  style="${BTN('#bb0000')}">▼<br><span style="font-size:.58rem;opacity:.75">Schnell</span></button>
      <button id="tr-right" style="${BTN('#1a40c0')}">▶<br><span style="font-size:.58rem;opacity:.75">Rechts</span></button>`;
    document.body.appendChild(ctrlBar);

    console.log('[Tetris-debug] Layout: innerWidth='+window.innerWidth+' innerHeight='+window.innerHeight+' isMobile='+isMobile+' CS='+CS+' Board='+BW+'x'+BH);
    const _checkBtnVisibility=(when)=>{
      try{
        const outer=document.getElementById('trcv')?.closest('div[style*="max-width"]');
        const btnRow=document.getElementById('tr-left')?.closest('div');
        if(btnRow){
          const r=btnRow.getBoundingClientRect();
          const hidden=r.bottom>window.innerHeight||r.top<0;
          const outerInfo = outer ? (' boardScrollHeight='+outer.scrollHeight+' boardClientHeight='+outer.clientHeight+' boardScrollTop='+outer.scrollTop+' boardHatScrollbar='+(outer.scrollHeight>outer.clientHeight)) : '';
          // Buttons are position:fixed now (see #tetris-fixed-controls
          // above) so `hidden` here should never be true — this check
          // stays purely as a confidence log / early warning in case some
          // future change or an unusual browser breaks that assumption.
          console.log('[Tetris-debug] ('+when+') Steuerknöpfe-Position (fixed): top='+Math.round(r.top)+' bottom='+Math.round(r.bottom)+' viewportHeight='+window.innerHeight+' devicePixelRatio='+window.devicePixelRatio+outerInfo+' → '+(hidden?'⚠️ UNERWARTET ausserhalb des sichtbaren Bereichs trotz position:fixed!':'✅ sichtbar'));
        }
      }catch(e){}
    };
    requestAnimationFrame(()=>_checkBtnVisibility('initial'));
    setTimeout(()=>_checkBtnVisibility('nach 1s'),1000);
    window.addEventListener('resize',()=>_checkBtnVisibility('resize'));
    window.addEventListener('orientationchange',()=>setTimeout(()=>_checkBtnVisibility('orientationchange'),300));
    // Exposed globally so App._toggleZoom() (app.js) can trigger a recheck
    // right after a manual zoom change — transform:scale() doesn't reflow
    // layout, so Tetris's own resize/orientationchange listeners above
    // would never otherwise notice a zoom tap moved its buttons out of view.
    window._checkTetrisBtnVisibility=_checkBtnVisibility;

    const cv=document.getElementById('trcv');
    const nxCv=document.getElementById('tr-next');
    if(!cv||!nxCv){
      // Canvas not found - retry after short delay
      setTimeout(()=>TetrisGame.start({onComplete}),100);
      return;
    }
    const ctx=cv.getContext('2d'), nxCtx=nxCv.getContext('2d');
    ctx.setTransform(DPR,0,0,DPR,0,0); nxCtx.setTransform(DPR,0,0,DPR,0,0);

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
      }
      _updSpeed();
      newPiece();
    };
    // Speed ramps up over time too, not just from cleared lines — in
    // progressively SHORTER intervals (accelerating, not linear), so a
    // player who isn't clearing many lines still gets overwhelmed by pure
    // speed eventually, rather than the difficulty staying flat until a
    // sudden time-based cutoff. Combined with lines cleared (good play is
    // still rewarded with an earlier ramp-up too).
    const _updSpeed=()=>{
      const elapsedSec=(Date.now()-tStart)/1000;
      const timeLevel=Math.floor(Math.pow(Math.max(0,elapsedSec)/22,1.3));
      const lineLevel=Math.floor(lines/10);
      level=lineLevel+timeLevel+1;
      dropInt=Math.max(80,800-level*55);
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
      _updSpeed();
      if(ts-lastTime>dropInt){
        lastTime=ts;
        if(valid(cur,curX,curY+1))curY++; else place();
      }
      drawBoard();drawNext();updHUD();
    };
    newPiece();
    animId=requestAnimationFrame(loop);
    const cleanupTetris=()=>{running=false;cancelAnimationFrame(animId);holdIntervals.forEach(clearInterval);holdIntervals=[];window.removeEventListener('keydown',onKey);};
    // Overall session cap raised from 3 to 4 minutes — with the speed
    // ramp above, most players should naturally top out (stack up and
    // lose) well before this from sheer speed pressure; this is now a
    // true backstop for anyone still going, not the main way the game ends.
    setTimeout(()=>{if(running){cleanupTetris();onComplete({rawScore:Math.min(100,Math.round(score/80+lines)),timeMs:Date.now()-tStart,errors:0,passed:score>100});}},240000);
  }
};
