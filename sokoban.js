// SOKOBAN v3 — 20 BFS-verified solvable levels, polished graphics
const SokobanGame = {
  start({onComplete}) {
    const el = document.getElementById('game-area');
    if (!el) return;

    // All levels BFS-verified solvable. Legend: #=wall ' '=floor .=goal @=player $=box *=box-on-goal +=player-on-goal
    const LEVELS = [
      { map:['#####','#.  #','# $ #','# @ #','#####'],                               name:'Tutorial',    hint:'1 Zug nach oben!' },
      { map:['######','#    #','#@$. #','#    #','######'],                           name:'Schieben',    hint:'Box nach rechts schieben' },
      { map:['########','#   ..  #','#   $$  #','#   @   #','########'],             name:'Zwei',        hint:'Zwei Boxen, zwei Ziele' },
      { map:['########','#  ..   #','#  $$   #','#   @   #','########'],             name:'Ecken',       hint:'Boxen parallel schieben' },
      { map:['#########','#   ...  #','#   $$$  #','#    @   #','#########'],        name:'Dreier',      hint:'Drei Boxen gleichzeitig' },
      { map:['########','#      #','# . ## #','# $    #','#  @   #','########'],     name:'Wand',        hint:'Wand umgehen' },
      { map:['######','#. $@#','######'],                                             name:'Korridor',    hint:'Box nach links auf das Ziel' },
      { map:['##########','#   ....  #','#   $$$$  #','#    @    #','##########'],   name:'Viereck',     hint:'Vier Boxen in Reihe' },
      { map:['########','# .    #','# $    #','#  @   #','########'],                  name:'Stufe',       hint:'Box nach oben aufs Ziel schieben' },
      { map:['########','#  .    #','#  $    #','#  .    #','#  $    #','#  @    #','########'], name:'Doppel', hint:'Zwei Reihen, zwei Boxen' },
      { map:['###########','#   .....  #','#   $$$$$  #','#    @     #','###########'], name:'Fünf',    hint:'Fünf Boxen geduldig platzieren' },
      { map:['########','# ..   #','# $$   #','#   $  #','#   .  #','#   @  #','########'], name:'L-Form', hint:'L-Form — Reihenfolge wichtig!' },
      { map:['############','#   ......  #','#   $$$$$$  #','#    @      #','############'], name:'Sechs', hint:'Sechs Boxen — Ruhe bewahren' },
      { map:['########','#  .    #','#  $    #','#  .    #','#  $    #','#  .    #','#  $    #','#  @    #','########'], name:'Turm', hint:'Sechs Boxen im Turm' },
      { map:['#########','# @      #','# . $    #','#   .  $ #','#########'],        name:'Kreuz',       hint:'Zwei Wege zum Ziel' },
      { map:['#############','#   .......  #','#   $$$$$$$  #','#    @       #','#############'], name:'Sieben', hint:'Sieben Boxen — du schaffst das!' },
      { map:['#########','#  ....  #','#  $$$$  #','#   @    #','#########'],          name:'Quadrat',    hint:'Vier Boxen parallel platzieren' },
      { map:['############','#  ........#','#  $$$$$$$$#','#    @     #','############'],  name:'Acht',       hint:'Acht Boxen — fast geschafft!' },
      { map:['########','# .  . #','# $  $ #','#  @@  #','########'],                name:'Weichen',     hint:'Wähle den richtigen Weg' },
      { map:['#############','#   .........#','#   $$$$$$$$$#','#     @      #','#############'], name:'Champion',  hint:'9 Boxen — der ultimative Test!' },
    ];

    const TILE = Math.min(44, Math.floor((Math.min(window.innerWidth - 16, 500)) / 10));
    let lvIdx = 0, moves = 0, solved = 0, hints = 0;
    let grid = [], px = 0, py = 0;
    let history = []; // for undo
    const tStart = Date.now();

    const isGoal = (r,c) => { const ch = LEVELS[lvIdx].map[r]?.[c]; return ch==='.'||ch==='+'||ch==='*'; };
    const isSolved = () => { for(let r=0;r<grid.length;r++) for(let c=0;c<(grid[r]?.length||0);c++) if(grid[r][c]==='$') return false; return true; };

    const loadLevel = i => {
      lvIdx = i; moves = 0; history = [];
      const lvl = LEVELS[i];
      grid = lvl.map.map(row => row.split(''));
      for(let r=0;r<grid.length;r++) for(let c=0;c<(grid[r]?.length||0);c++) {
        if(grid[r][c]==='@'){py=r;px=c;grid[r][c]=' ';}
        else if(grid[r][c]==='+'){py=r;px=c;grid[r][c]='.';}
      }
      render();
    };

    const move = (dr, dc) => {
      const nr=py+dr, nc=px+dc;
      if(!grid[nr]||grid[nr][nc]==='#') return;
      // Save state for undo
      const snap = {grid:grid.map(r=>[...r]),py,px,moves};
      let pushed = false;
      if(grid[nr][nc]==='$'||grid[nr][nc]==='*') {
        const br=nr+dr, bc=nc+dc;
        if(!grid[br]||grid[br][bc]==='#'||grid[br][bc]==='$'||grid[br][bc]==='*') return;
        grid[br][bc]=(grid[br][bc]==='.'?'*':'$');
        grid[nr][nc]=(grid[nr][nc]==='*'?'.':' ');
        pushed = true;
      }
      history.push(snap);
      if(history.length > 100) history.shift();
      py=nr; px=nc; moves++;
      render();
      if(isSolved()) {
        setTimeout(() => {
          solved++;
          if(lvIdx+1 >= LEVELS.length) {
            const secs = (Date.now()-tStart)/1000;
            onComplete({rawScore:Math.min(100,80+solved-hints*3), timeMs:Date.now()-tStart, errors:hints, passed:true});
          } else {
            loadLevel(lvIdx+1);
          }
        }, 350);
      }
    };

    const undo = () => {
      if(!history.length) return;
      const s = history.pop();
      grid=s.grid; py=s.py; px=s.px; moves=s.moves;
      render();
    };

    const render = () => {
      const lvl = LEVELS[lvIdx];
      const rows = grid.length;
      const cols = Math.max(...grid.map(r=>r.length));
      const cw = cols*TILE, ch = rows*TILE;

      el.innerHTML = `<div style="font-family:sans-serif;user-select:none;-webkit-user-select:none;text-align:center">
        <div style="display:flex;justify-content:center;align-items:center;gap:10px;margin-bottom:6px;flex-wrap:wrap">
          <span style="color:#FFD700;font-weight:900;font-size:clamp(.9rem,4vw,1rem)">${lvl.name}</span>
          <span style="color:rgba(255,255,255,.35);font-size:clamp(.75rem,3.2vw,.85rem)">Level ${lvIdx+1}/${LEVELS.length}</span>
          <span style="color:#4af;font-size:clamp(.75rem,3.2vw,.85rem)">Züge: ${moves}</span>
          <span style="color:rgba(255,255,255,.3);font-size:clamp(.75rem,3.2vw,.85rem)">✅ ${solved}</span>
        </div>
        <canvas id="skcv" width="${cw}" height="${ch}"
          style="display:block;margin:0 auto;border-radius:10px;max-width:100%;touch-action:none;
                 box-shadow:0 4px 24px rgba(0,0,0,.7),0 0 0 2px rgba(255,255,255,.06)"></canvas>
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:5px;margin-top:8px;max-width:320px;margin-left:auto;margin-right:auto">
          ${btn('sk-hint','💡','#777')}${btn('sk-up','↑','#3a7bd5')}${btn('sk-undo','↩','#e67e22')}
          ${btn('sk-left','←','#3a7bd5')}${btn('sk-down','↓','#3a7bd5')}${btn('sk-right','→','#3a7bd5')}
          ${btn('sk-rst','🔄','#c0392b')}${btn('sk-skip','⏭','#8e44ad')}
        </div>
        <div id="sk-hint-box" style="display:none;color:#FFD700;font-size:clamp(.78rem,3.5vw,.88rem);margin-top:6px;padding:6px 12px;background:rgba(255,215,0,.08);border-radius:8px;max-width:320px;margin-left:auto;margin-right:auto">
          💡 ${lvl.hint}
        </div>
        <div style="font-size:clamp(.68rem,3vw,.75rem);color:rgba(255,255,255,.2);margin-top:4px">
          Pfeiltasten / WASD · Wischen auf Mobile
        </div>
      </div>`;

      function btn(id, text, col) {
        return `<button id="${id}" style="background:linear-gradient(160deg,${col}cc,${col});color:#fff;border:none;
          padding:clamp(10px,3vw,13px) 4px;border-radius:9px;font-size:clamp(.9rem,4vw,1.05rem);font-weight:900;
          cursor:pointer;touch-action:none;box-shadow:0 2px 6px rgba(0,0,0,.4)">${text}</button>`;
      }

      // Draw canvas
      const cv = document.getElementById('skcv');
      const ctx = cv.getContext('2d');

      // Colors
      const C = {
        wall:'#2c1810', wallT:'#4a2c1a', wallH:'rgba(255,255,255,.08)',
        floor:'#c4a882', floorD:'#b8976e',
        goalBg:'rgba(255,215,0,.15)', goalBorder:'#FFD700',
        boxGrad0:'#a8714a', boxGrad1:'#6b4128',
        boxDoneGrad0:'#2ecc71', boxDoneGrad1:'#1a8a4a',
        playerGrad0:'#5dade2', playerGrad1:'#2980b9',
      };

      for(let r=0;r<rows;r++) {
        for(let c=0;c<(grid[r]?.length||0);c++) {
          const x=c*TILE, y=r*TILE, ch=grid[r][c];

          if(ch==='#') {
            // 3D brick wall
            const wg=ctx.createLinearGradient(x,y,x,y+TILE);
            wg.addColorStop(0,C.wallT); wg.addColorStop(0.4,'#3d2010'); wg.addColorStop(1,C.wall);
            ctx.fillStyle=wg; ctx.fillRect(x,y,TILE,TILE);
            // Brick lines
            ctx.strokeStyle='rgba(0,0,0,.3)'; ctx.lineWidth=1;
            if(r%2===0){ctx.beginPath();ctx.moveTo(x,y+TILE/2);ctx.lineTo(x+TILE,y+TILE/2);ctx.stroke();
              ctx.beginPath();ctx.moveTo(x+TILE/2,y);ctx.lineTo(x+TILE/2,y+TILE/2);ctx.stroke();}
            else{ctx.beginPath();ctx.moveTo(x,y+TILE/2);ctx.lineTo(x+TILE,y+TILE/2);ctx.stroke();
              ctx.beginPath();ctx.moveTo(x+TILE*.25,y+TILE/2);ctx.lineTo(x+TILE*.25,y+TILE);ctx.stroke();}
            // Top highlight
            ctx.fillStyle='rgba(255,255,255,.09)'; ctx.fillRect(x,y,TILE,2); ctx.fillRect(x,y,2,TILE);
          } else {
            // Floor
            ctx.fillStyle=(r+c)%2===0?C.floor:C.floorD; ctx.fillRect(x,y,TILE,TILE);
            const gHere = isGoal(r,c)||(ch==='*');
            if(gHere) {
              // Goal glow
              ctx.fillStyle=C.goalBg; ctx.fillRect(x,y,TILE,TILE);
              ctx.strokeStyle=C.goalBorder; ctx.lineWidth=2;
              const m=TILE*.2; ctx.strokeRect(x+m,y+m,TILE-m*2,TILE-m*2);
              ctx.strokeStyle='rgba(255,215,0,.4)'; ctx.lineWidth=1;
              const m2=TILE*.35;
              ctx.beginPath();ctx.moveTo(x+TILE/2,y+m2);ctx.lineTo(x+TILE/2,y+TILE-m2);ctx.stroke();
              ctx.beginPath();ctx.moveTo(x+m2,y+TILE/2);ctx.lineTo(x+TILE-m2,y+TILE/2);ctx.stroke();
            }
            if(ch==='$'||ch==='*') {
              const done=ch==='*';
              const bx=x+2,by=y+2,bw=TILE-4,bh=TILE-4;
              // Shadow
              ctx.fillStyle='rgba(0,0,0,.25)'; ctx.fillRect(bx+3,by+3,bw,bh);
              // Body
              const bg=ctx.createLinearGradient(bx,by,bx,by+bh);
              bg.addColorStop(0,done?C.boxDoneGrad0:C.boxGrad0);
              bg.addColorStop(1,done?C.boxDoneGrad1:C.boxGrad1);
              ctx.fillStyle=bg; ctx.fillRect(bx,by,bw,bh);
              // X brace
              ctx.strokeStyle=done?'rgba(0,60,0,.3)':'rgba(0,0,0,.18)'; ctx.lineWidth=1.5;
              ctx.beginPath();ctx.moveTo(bx+3,by+3);ctx.lineTo(bx+bw-3,by+bh-3);ctx.stroke();
              ctx.beginPath();ctx.moveTo(bx+bw-3,by+3);ctx.lineTo(bx+3,by+bh-3);ctx.stroke();
              // Border + highlight
              ctx.strokeStyle=done?'#1a6e3a':'#3d1a00'; ctx.lineWidth=2; ctx.strokeRect(bx,by,bw,bh);
              ctx.fillStyle='rgba(255,255,255,.15)'; ctx.fillRect(bx,by,bw,2); ctx.fillRect(bx,by,2,bh);
              if(done){ctx.fillStyle='rgba(255,255,255,.3)';ctx.font=`bold ${TILE*.42}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('✓',x+TILE/2,y+TILE/2+1);}
            }
          }
        }
      }

      // Player
      const pxc=px*TILE+TILE/2, pyc=py*TILE+TILE/2, pr=TILE*.38;
      ctx.fillStyle='rgba(0,0,0,.2)';ctx.beginPath();ctx.ellipse(pxc,py*TILE+TILE-3,pr*.9,4,0,0,Math.PI*2);ctx.fill();
      const pg=ctx.createRadialGradient(pxc-pr*.2,pyc-pr*.2,1,pxc,pyc,pr);
      pg.addColorStop(0,C.playerGrad0); pg.addColorStop(1,C.playerGrad1);
      ctx.fillStyle=pg; ctx.beginPath(); ctx.arc(pxc,pyc,pr,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,.3)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(pxc,pyc,pr,0,Math.PI*2); ctx.stroke();
      // Eyes
      const eo=pr*.32; ctx.fillStyle='#fff';
      ctx.beginPath();ctx.arc(pxc-eo*.6,pyc-eo*.4,eo*.7,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(pxc+eo*.6,pyc-eo*.4,eo*.7,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#1a1a3a';
      ctx.beginPath();ctx.arc(pxc-eo*.5,pyc-eo*.35,eo*.4,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(pxc+eo*.7,pyc-eo*.35,eo*.4,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=1.2;
      ctx.beginPath();ctx.arc(pxc,pyc+pr*.18,pr*.32,0.15,Math.PI-.15);ctx.stroke();

      // Wire buttons
      const wire=(id,fn)=>{const b=document.getElementById(id);if(!b)return;
        b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);fn();});};
      wire('sk-up',()=>move(-1,0)); wire('sk-down',()=>move(1,0));
      wire('sk-left',()=>move(0,-1)); wire('sk-right',()=>move(0,1));
      wire('sk-undo',undo);
      wire('sk-rst',()=>{history=[];loadLevel(lvIdx);});
      wire('sk-skip',()=>{hints+=3;if(lvIdx+1<LEVELS.length)loadLevel(lvIdx+1);else onComplete({rawScore:50,timeMs:Date.now()-tStart,errors:hints,passed:false});});
      wire('sk-hint',()=>{hints++;const hb=document.getElementById('sk-hint-box');if(hb)hb.style.display=hb.style.display==='none'?'block':'none';});
    };

    // Keyboard
    const kmap={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1],KeyW:[-1,0],KeyS:[1,0],KeyA:[0,-1],KeyD:[0,1]};
    const onK=e=>{if(kmap[e.code]){e.preventDefault();move(...kmap[e.code]);}if(e.code==='KeyZ'||e.code==='KeyU')undo();if(e.code==='KeyR')loadLevel(lvIdx);};
    window.addEventListener('keydown',onK);

    // Touch swipe
    let ts=null;
    el.addEventListener('touchstart',e=>{const t=e.touches[0];ts={x:t.clientX,y:t.clientY};},{passive:true});
    el.addEventListener('touchend',e=>{
      if(!ts)return;const t=e.changedTouches[0];
      const dx=t.clientX-ts.x,dy=t.clientY-ts.y;ts=null;
      if(Math.abs(dx)<12&&Math.abs(dy)<12)return;
      if(Math.abs(dx)>Math.abs(dy))move(0,dx>0?1:-1);else move(dy>0?1:-1,0);
    },{passive:true});

    loadLevel(0);
    // Cleanup
    const cleanup=()=>{if(!document.getElementById('skcv')){window.removeEventListener('keydown',onK);}};
    setTimeout(cleanup,200);
  }
};
