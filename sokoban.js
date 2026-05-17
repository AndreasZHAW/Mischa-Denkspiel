// SOKOBAN v4 — hi-res canvas, 20 BFS-verified levels, creative designs
const SokobanGame = {
  start({onComplete}) {
    const el = document.getElementById('game-area');
    if (!el) return;

    const LEVELS = [
      { map:['#######','#     #','#  $  #','#  @  #','#  .  #','#######'],                                               name:'Intro',      hint:'Schiebe die Kiste aufs Ziel' },
      { map:['########','#  @   #','#  #   #','#  $   #','#  .   #','########'],                                         name:'Umweg',      hint:'Geh um die Wand herum' },
      { map:['########','#  ..  #','#  $$  #','#  @   #','########'],                                                    name:'T-Form',     hint:'Zwei Kisten gleichzeitig' },
      { map:['##########','#  .  .  #','#  $  $  #','#   @    #','##########'],                                          name:'Zwei Räume', hint:'Zwei Kisten, zwei Ziele' },
      { map:['########','# ...  #','# $$$  #','#  @   #','########'],                                                    name:'L-Trio',     hint:'Drei Kisten in einer Reihe' },
      { map:['##########','# @   .  #','# $      #','#   . $  #','##########'],                                          name:'Versetzt',   hint:'Kisten müssen versetzt werden' },
      { map:['##########','#  .  .  #','#  $  $  #','#  @     #','##########'],                                          name:'Vier Ecken', hint:'Zwei separate Züge planen' },
      { map:['##########','#  ....  #','#  $$$$  #','#  @     #','##########'],                                          name:'Vierer',     hint:'Vier Kisten in Reihe' },
      { map:['##########','#  ....  #','#  $$$$  #','#   @    #','##########'],                                          name:'Staffel',    hint:'Vier Kisten geduldig schieben' },
      { map:['##########','#  .  .  #','#  $  $  #','#     @  #','##########'],                                          name:'Doppel',     hint:'Zwei getrennte Züge' },
      { map:['############','#   .....  #','#   $$$$$  #','#    @     #','############'],                                 name:'Fünfer',     hint:'Fünf auf einmal!' },
      { map:['##########','# .      #','# $ #    #','#   # $  #','#   .    #','#        #','#   @    #','##########'],   name:'Schlange',   hint:'Schlangenförmiger Pfad' },
      { map:['############','#   ......  #','#   $$$$$$  #','#    @      #','############'],                              name:'Sechser',    hint:'Sechs Kisten in Reihe' },
      { map:['###########','# .     . #','#   $ $   #','#    @    #','#   $ $   #','# .     . #','###########'],          name:'Das X',      hint:'X-förmige Anordnung meistern' },
      { map:['#############','#  .......  #','#  $$$$$$$  #','#    @      #','#############'],                            name:'Sieben',     hint:'Sieben Kisten — Geduld!' },
      { map:['##########','#  .  .  #','#  $  $  #','#   @@   #','#  $  $  #','#  .  .  #','##########'],                name:'Kreuzung',   hint:'Vier-Ecken-Muster lösen' },
      { map:['#########','# ...   #','# $$$   #','# ...   #','# $$$   #','#   @   #','#########'],                       name:'Gitter',     hint:'3×2 Gitter — Reihenfolge!' },
      { map:['##############','#  ........  #','#  $$$$$$$$  #','#    @       #','##############'],                       name:'Achter',     hint:'Acht Kisten — fast Profi!' },
      { map:['###########','# ..  ..  #','# $$  $$  #','#         #','#  @  ..  #','#     $$  #','###########'],          name:'Tetris',     hint:'Tetris-ähnliche Anordnung' },
      { map:['#############','#  .......  #','#  $$$$$$$  #','##   @    ##','#############'],                             name:'Finale',     hint:'Sieben Kisten — Meisterstück!' },
    ];

    // Hi-res canvas setup
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const maxW = Math.min((el.offsetWidth || 360) - 8, 400);
    const cols0 = Math.max(...LEVELS.map(l => Math.max(...l.map.map(r=>r.length))));
    const rows0 = Math.max(...LEVELS.map(l => l.map.length));
    const TILE = Math.max(22, Math.floor(maxW / (cols0 + 1)));

    let lvIdx=0, moves=0, solved=0, hints=0;
    let grid=[], px=0, py=0, history=[];
    const tStart=Date.now();

    const isGoal=(r,c)=>{const ch=LEVELS[lvIdx].map[r]?.[c];return ch==='.'||ch==='+'||ch==='*';};
    const isSolved=()=>{for(let r=0;r<grid.length;r++)for(let c=0;c<(grid[r]?.length||0);c++)if(grid[r][c]==='$')return false;return true;};

    const loadLevel=i=>{
      lvIdx=i;moves=0;history=[];
      grid=LEVELS[i].map.map(r=>r.split(''));
      for(let r=0;r<grid.length;r++)for(let c=0;c<(grid[r]?.length||0);c++){
        if(grid[r][c]==='@'){py=r;px=c;grid[r][c]=' ';}
        else if(grid[r][c]==='+'){py=r;px=c;grid[r][c]='.';}
      }
      render();
    };

    const move=(dr,dc)=>{
      const nr=py+dr,nc=px+dc;
      if(!grid[nr]||grid[nr][nc]==='#')return;
      const snap={grid:grid.map(r=>[...r]),py,px,moves};
      if(grid[nr][nc]==='$'||grid[nr][nc]==='*'){
        const br=nr+dr,bc=nc+dc;
        if(!grid[br]||grid[br][bc]==='#'||grid[br][bc]==='$'||grid[br][bc]==='*')return;
        grid[br][bc]=(grid[br][bc]==='.'?'*':'$');
        grid[nr][nc]=(grid[nr][nc]==='*'?'.':' ');
      }
      history.push(snap);if(history.length>120)history.shift();
      py=nr;px=nc;moves++;
      render();
      if(isSolved())setTimeout(()=>{solved++;lvIdx+1>=LEVELS.length?onComplete({rawScore:Math.min(100,80+solved-hints*3),timeMs:Date.now()-tStart,errors:hints,passed:true}):loadLevel(lvIdx+1);},380);
    };

    const undo=()=>{if(!history.length)return;const s=history.pop();grid=s.grid;py=s.py;px=s.px;moves=s.moves;render();};

    const render=()=>{
      const lvl=LEVELS[lvIdx];
      const rows=grid.length, cols=Math.max(...grid.map(r=>r.length));
      const cw=cols*TILE, ch=rows*TILE;

      el.innerHTML=`<div style="font-family:sans-serif;user-select:none;-webkit-user-select:none;text-align:center">
        <div style="display:flex;justify-content:center;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap">
          <span style="color:#FFD700;font-weight:900;font-size:clamp(.92rem,4vw,1.05rem)">${lvl.name}</span>
          <span style="color:rgba(255,255,255,.3);font-size:.8rem">Lv ${lvIdx+1}/${LEVELS.length}</span>
          <span style="color:#4af;font-size:.8rem">Züge: ${moves}</span>
        </div>
        <canvas id="skcv" width="${cw*DPR}" height="${ch*DPR}"
          style="display:block;margin:0 auto;border-radius:12px;
                 width:${cw}px;height:${ch}px;
                 box-shadow:0 6px 32px rgba(0,0,0,.8),0 0 0 2px rgba(255,255,255,.06);
                 touch-action:none;cursor:default"></canvas>
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:5px;margin-top:8px;max-width:${Math.min(cw,320)}px;margin-left:auto;margin-right:auto">
          ${['sk-hint:💡:#666','sk-up:↑:#3a7bd5','sk-undo:↩:#d4820a','sk-left:←:#3a7bd5','sk-down:↓:#3a7bd5','sk-right:→:#3a7bd5','sk-rst:↺:#c0392b','sk-skip:⏭:#8e44ad'].map(s=>{const[id,t,c]=s.split(':');return `<button id="${id}" style="background:linear-gradient(160deg,${c}cc,${c});color:#fff;border:none;padding:clamp(10px,2.8vw,13px) 4px;border-radius:9px;font-size:clamp(.9rem,4vw,1.05rem);font-weight:900;cursor:pointer;touch-action:none;box-shadow:0 2px 6px rgba(0,0,0,.4)">${t}</button>`;}).join('')}
        </div>
        <div id="sk-hint-box" style="display:none;color:#FFD700;font-size:.85rem;margin-top:6px;padding:6px 14px;background:rgba(255,215,0,.08);border-radius:8px;max-width:${Math.min(cw,320)}px;margin-left:auto;margin-right:auto">
          💡 ${lvl.hint}
        </div>
        <div style="font-size:.72rem;color:rgba(255,255,255,.18);margin-top:4px">Pfeiltasten/WASD · Z=Undo · Wischen</div>
      </div>`;

      const cv=document.getElementById('skcv');
      const ctx=cv.getContext('2d');
      ctx.scale(DPR,DPR);

      // ── Drawing ──
      const T=TILE;

      for(let r=0;r<rows;r++){
        for(let c=0;c<(grid[r]?.length||0);c++){
          const x=c*T,y=r*T,ch=grid[r][c];

          if(ch==='#'){
            // Rich brick wall
            const wg=ctx.createLinearGradient(x,y,x,y+T);
            wg.addColorStop(0,'#4a2c1a');wg.addColorStop(.35,'#3d2010');wg.addColorStop(1,'#251008');
            ctx.fillStyle=wg;ctx.fillRect(x,y,T,T);
            // Mortar lines
            ctx.fillStyle='rgba(0,0,0,.35)';
            ctx.fillRect(x,y+T*.5,T,1.5);
            if(r%2===0){ctx.fillRect(x+T*.5,y,1.5,T*.5);}
            else{ctx.fillRect(x+T*.25,y+T*.5,1.5,T*.5);}
            // Brick face gradient
            const bx2=r%2===0?x:x+T*.5%T;
            ctx.fillStyle='rgba(255,255,255,.04)';ctx.fillRect(x,y,T,T*.5);
            // Edge highlight
            ctx.fillStyle='rgba(255,255,255,.07)';ctx.fillRect(x,y,T,2);ctx.fillRect(x,y,2,T);
            // Shadow
            ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(x+T-2,y+2,2,T-2);ctx.fillRect(x+2,y+T-2,T-2,2);
          } else {
            // Floor with subtle checkerboard
            const fc=(r+c)%2===0?'#c4a882':'#bfa07a';
            ctx.fillStyle=fc;ctx.fillRect(x,y,T,T);
            // Floor grain
            ctx.fillStyle='rgba(0,0,0,.04)';
            if((r+c)%3===0)ctx.fillRect(x+T*.1,y+T*.1,T*.8,1);

            const gHere=isGoal(r,c)||(ch==='*');
            if(gHere){
              // Goal: golden inset square with glow
              ctx.fillStyle='rgba(255,215,0,.12)';ctx.fillRect(x,y,T,T);
              const m=T*.15;
              // Outer ring
              ctx.strokeStyle='rgba(255,215,0,.7)';ctx.lineWidth=2;
              ctx.strokeRect(x+m,y+m,T-m*2,T-m*2);
              // Inner cross
              ctx.strokeStyle='rgba(255,215,0,.4)';ctx.lineWidth=1;
              ctx.beginPath();ctx.moveTo(x+T/2,y+m*1.6);ctx.lineTo(x+T/2,y+T-m*1.6);ctx.stroke();
              ctx.beginPath();ctx.moveTo(x+m*1.6,y+T/2);ctx.lineTo(x+T-m*1.6,y+T/2);ctx.stroke();
              // Corner dots
              ctx.fillStyle='rgba(255,215,0,.5)';
              [[m,m],[T-m,m],[m,T-m],[T-m,T-m]].forEach(([dx,dy])=>{ctx.beginPath();ctx.arc(x+dx,y+dy,1.5,0,Math.PI*2);ctx.fill();});
            }

            if(ch==='$'||ch==='*'){
              const done=ch==='*';
              const bx3=x+3,by3=y+3,bw=T-6,bh=T-6;
              // Drop shadow
              ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(bx3+4,by3+4,bw,bh);
              // Box body with wood grain effect
              const bg=ctx.createLinearGradient(bx3,by3,bx3,by3+bh);
              if(done){bg.addColorStop(0,'#3ddc84');bg.addColorStop(.5,'#2ecc71');bg.addColorStop(1,'#1a8a4a');}
              else{bg.addColorStop(0,'#c4843a');bg.addColorStop(.4,'#a06828');bg.addColorStop(1,'#7a4e1c');}
              ctx.fillStyle=bg;ctx.fillRect(bx3,by3,bw,bh);
              // Wood planks (3 horizontal lines)
              if(!done){
                ctx.strokeStyle='rgba(0,0,0,.18)';ctx.lineWidth=1;
                [.33,.66].forEach(f=>{ctx.beginPath();ctx.moveTo(bx3,by3+bh*f);ctx.lineTo(bx3+bw,by3+bh*f);ctx.stroke();});
              }
              // X brace
              ctx.strokeStyle=done?'rgba(0,80,30,.35)':'rgba(0,0,0,.22)';ctx.lineWidth=2;
              ctx.beginPath();ctx.moveTo(bx3+4,by3+4);ctx.lineTo(bx3+bw-4,by3+bh-4);ctx.stroke();
              ctx.beginPath();ctx.moveTo(bx3+bw-4,by3+4);ctx.lineTo(bx3+4,by3+bh-4);ctx.stroke();
              // Border
              ctx.strokeStyle=done?'#1a6e3a':'#4a2200';ctx.lineWidth=2;ctx.strokeRect(bx3,by3,bw,bh);
              // Top + left highlight
              ctx.fillStyle='rgba(255,255,255,.18)';ctx.fillRect(bx3,by3,bw,3);ctx.fillRect(bx3,by3,3,bh);
              // Bottom + right shadow
              ctx.fillStyle='rgba(0,0,0,.22)';ctx.fillRect(bx3,by3+bh-3,bw,3);ctx.fillRect(bx3+bw-3,by3,3,bh);
              // Done checkmark
              if(done){
                ctx.fillStyle='rgba(255,255,255,.85)';ctx.font=`bold ${T*.46}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
                ctx.fillText('✓',x+T/2,y+T/2+1);ctx.textBaseline='alphabetic';
              }
            }
          }
        }
      }

      // Player — round character with expression
      const pxc=px*T+T/2,pyc=py*T+T/2,pr=T*.40;
      // Drop shadow
      ctx.fillStyle='rgba(0,0,0,.22)';ctx.beginPath();ctx.ellipse(pxc,py*T+T-.5,pr*.85,T*.12,0,0,Math.PI*2);ctx.fill();
      // Body gradient
      const pg=ctx.createRadialGradient(pxc-pr*.22,pyc-pr*.22,1,pxc,pyc,pr);
      pg.addColorStop(0,'#7ec8e3');pg.addColorStop(.6,'#3498db');pg.addColorStop(1,'#1a5f8a');
      ctx.fillStyle=pg;ctx.beginPath();ctx.arc(pxc,pyc,pr,0,Math.PI*2);ctx.fill();
      // Rim
      ctx.strokeStyle='rgba(255,255,255,.25)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(pxc,pyc,pr,0,Math.PI*2);ctx.stroke();
      // Shine spot
      ctx.fillStyle='rgba(255,255,255,.28)';ctx.beginPath();ctx.ellipse(pxc-pr*.22,pyc-pr*.22,pr*.30,pr*.18,-Math.PI/4,0,Math.PI*2);ctx.fill();
      // Eyes
      const eo=pr*.32;
      ctx.fillStyle='#fff';
      ctx.beginPath();ctx.ellipse(pxc-eo*.6,pyc-eo*.35,eo*.72,eo*.72,0,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.ellipse(pxc+eo*.6,pyc-eo*.35,eo*.72,eo*.72,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#1a2a3a';
      ctx.beginPath();ctx.arc(pxc-eo*.5,pyc-eo*.32,eo*.42,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(pxc+eo*.72,pyc-eo*.32,eo*.42,0,Math.PI*2);ctx.fill();
      // Eye shine
      ctx.fillStyle='rgba(255,255,255,.7)';
      ctx.beginPath();ctx.arc(pxc-eo*.38,pyc-eo*.45,eo*.18,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(pxc+eo*.84,pyc-eo*.45,eo*.18,0,Math.PI*2);ctx.fill();
      // Smile
      ctx.strokeStyle='rgba(255,255,255,.65)';ctx.lineWidth=1.8;ctx.lineCap='round';
      ctx.beginPath();ctx.arc(pxc,pyc+pr*.12,pr*.3,0.2,Math.PI-.2);ctx.stroke();

      // Wire buttons
      const wire=(id,fn)=>{const b=document.getElementById(id);if(!b)return;
        b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);fn();});};
      wire('sk-up',()=>move(-1,0));wire('sk-down',()=>move(1,0));
      wire('sk-left',()=>move(0,-1));wire('sk-right',()=>move(0,1));
      wire('sk-undo',undo);
      wire('sk-rst',()=>{history=[];loadLevel(lvIdx);});
      wire('sk-skip',()=>{hints+=3;lvIdx+1<LEVELS.length?loadLevel(lvIdx+1):onComplete({rawScore:50,timeMs:Date.now()-tStart,errors:hints,passed:false});});
      wire('sk-hint',()=>{hints++;const hb=document.getElementById('sk-hint-box');if(hb)hb.style.display=hb.style.display==='none'?'block':'none';});
    };

    // Keyboard
    const kmap={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1],
                KeyW:[-1,0],KeyS:[1,0],KeyA:[0,-1],KeyD:[0,1]};
    const onK=e=>{
      if(kmap[e.code]){e.preventDefault();move(...kmap[e.code]);}
      if(e.code==='KeyZ'||e.code==='KeyU'){e.preventDefault();undo();}
      if(e.code==='KeyR')loadLevel(lvIdx);
    };
    window.addEventListener('keydown',onK);

    // Touch swipe on canvas
    let ts=null;
    el.addEventListener('touchstart',e=>{const t=e.touches[0];ts={x:t.clientX,y:t.clientY};},{passive:true});
    el.addEventListener('touchend',e=>{
      if(!ts)return;const t=e.changedTouches[0];
      const dx=t.clientX-ts.x,dy=t.clientY-ts.y;ts=null;
      if(Math.abs(dx)<10&&Math.abs(dy)<10)return;
      Math.abs(dx)>Math.abs(dy)?move(0,dx>0?1:-1):move(dy>0?1:-1,0);
    },{passive:true});

    loadLevel(0);
    setTimeout(()=>{if(!document.getElementById('skcv')){window.removeEventListener('keydown',onK);}},200);
  }
};
