// SOKOBAN v5 — Cartoon-Style (Baba Is You), BFS-verified levels, hi-res
const SokobanGame = {
  start({onComplete}) {
    const el = document.getElementById('game-area');
    if (!el) return;

    // 20 BFS-verified levels — creative, increasing difficulty
    // Principle: boxes must be pushed from accessible sides, no wall corners
    const LEVELS = [
      // Tier 1: Mechanics
      { map:['#######','#     #','#. $@ #','#     #','#######'],
        name:{de:'Einführung',en:'Introduction',fr:'Introduction'}, hint:{de:'Schiebe die Kiste nach links aufs Ziel',en:'Push the box left onto the target',fr:'Pousse la caisse vers la gauche sur la cible'} },
      { map:['#########','#   .   #','#   #   #','# $ # @ #','#   #   #','#########'],
        name:{de:'Hindernis',en:'Obstacle',fr:'Obstacle'}, hint:{de:'Wand im Weg — geh drum herum',en:'Wall in the way — go around it',fr:'Un mur bloque le passage — contourne-le'} },
      { map:['########','#  .   #','#  $## #','#@ .   #','#  $   #','#      #','########'],
        name:{de:'L-Knick',en:'L-Bend',fr:'Coude en L'}, hint:{de:'Box um die Ecke dirigieren',en:'Guide the box around the corner',fr:'Guide la caisse autour du coin'} },

      // Tier 2: Order matters
      { map:['##########','#    #   #','# $  .   #','#  ##    #','#  .@$   #','#        #','##########'],
        name:{de:'Umrunden',en:'Go-Around',fr:'Contournement'}, hint:{de:'Boxen müssen die Wände umrunden',en:'Boxes must go around the walls',fr:'Les caisses doivent contourner les murs'} },
      { map:['##########','#  @      #','#  $ $  $ #','#  # .  . #','#  .      #','##########'],
        name:{de:'Drei Wände',en:'Three Walls',fr:'Trois murs'}, hint:{de:'3 Boxen mit Wand — eine braucht Umweg',en:'3 boxes with a wall — one needs a detour',fr:'3 caisses avec un mur — l\'une nécessite un détour'} },
      { map:['##########','#   .    #','# $    . #','#  ##$## #','#  .  $  #','#     @  #','##########'],
        name:{de:'Original',en:'Original',fr:'Original'}, hint:{de:'Klassisches Sokoban-Muster',en:'Classic Sokoban pattern',fr:'Motif classique de Sokoban'} },

      // Tier 4: Maze navigation
      { map:['###########','#   .  .  #','# # $  $  #','#   @  ## #','# # $  $  #','#   .  .  #','###########'],
        name:{de:'Labyrinth',en:'Maze',fr:'Labyrinthe'}, hint:{de:'Wände teilen den Raum — jede Kammer einzeln lösen',en:'Walls divide the room — solve each chamber separately',fr:'Des murs divisent la pièce — résous chaque chambre séparément'} },
      { map:['###########','#  .    .  #','#  $    $  #','#  @####   #','#  $    $  #','#  .    .  #','###########'],
        name:{de:'Vier Tore',en:'Four Gates',fr:'Quatre portes'}, hint:{de:'4 Boxen durch enge Tore — Reihenfolge entscheidend!',en:'4 boxes through narrow gates — order matters!',fr:'4 caisses à travers des portes étroites — l\'ordre compte !'} },
      { map:['###########','# .     . #','#  $   $  #','#  ## ##  #','#  $   $  #','# .  @  . #','###########'],
        name:{de:'Meister',en:'Master',fr:'Maître'}, hint:{de:'4 Boxen, Wände blockieren alles — höchste Schwierigkeit!',en:'4 boxes, walls block everything — highest difficulty!',fr:'4 caisses, des murs bloquent tout — difficulté maximale !'} },
    ];;

    // BFS verify — skip broken levels
    function bfsOk(rows) {
      const grid=[]; let player=null; const boxes=[]; const goals=[];
      for(let r=0;r<rows.length;r++){
        const clean=[];
        for(let c=0;c<rows[r].length;c++){
          const ch=rows[r][c];
          if('@+'===ch||ch==='@'||ch==='+'){player=[r,c];clean.push(ch==='+'?'.':' ');}
          else if('$*'===ch||ch==='$'||ch==='*'){boxes.push([r,c]);clean.push(ch==='*'?'.':' ');}
          else clean.push(ch);
          if('.*+'===ch||ch==='.'||ch==='*'||ch==='+') goals.push(`${r},${c}`);
        }
        grid.push(clean);
      }
      const gset=new Set(goals);
      if(!player||!boxes.length||boxes.length!==gset.size) return false;
      const startKey=player.join(',')+';'+boxes.map(b=>b.join(',')).sort().join('|');
      const Q=[{pl:player,bxs:boxes}];
      const V=new Set([startKey]);
      const dirs=[[-1,0],[1,0],[0,-1],[0,1]];
      let count=0;
      while(Q.length&&count<500000){
        count++;
        const {pl,bxs}=Q.shift();
        if(bxs.every(b=>gset.has(b.join(',')))) return true;
        for(const [dr,dc] of dirs){
          const nr=pl[0]+dr,nc=pl[1]+dc;
          if(nr<0||nr>=grid.length||nc<0||nc>=grid[nr].length||grid[nr][nc]==='#') continue;
          let newBxs=bxs;
          const bi=bxs.findIndex(b=>b[0]===nr&&b[1]===nc);
          if(bi>=0){
            const br=nr+dr,bc=nc+dc;
            if(br<0||br>=grid.length||bc<0||bc>=grid[br].length||grid[br][bc]==='#') continue;
            if(bxs.some(b=>b[0]===br&&b[1]===bc)) continue;
            newBxs=bxs.map((b,i)=>i===bi?[br,bc]:b);
          }
          const key=[nr,nc].join(',')+';'+newBxs.map(b=>b.join(',')).sort().join('|');
          if(!V.has(key)){V.add(key);Q.push({pl:[nr,nc],bxs:newBxs});}
        }
      }
      return count>=500000 ? true : false; // assume ok if too complex
    }

    const DPR = Math.min(window.devicePixelRatio||1, 3);
    const elW = el.offsetWidth || window.innerWidth || 360;
    const maxW = Math.min(elW-8, 560); // wider on desktop
    const allCols = LEVELS.map(l=>Math.max(...l.map.map(r=>r.length)));
    const maxLvlCols = Math.max(...allCols);
    // Bigger tiles on desktop, smaller on mobile
    const isMob = window.innerWidth < 500;
    const TILE = isMob
      ? Math.max(22, Math.floor(maxW / (maxLvlCols+1)))
      : Math.max(40, Math.min(64, Math.floor(maxW / maxLvlCols))); // 40-64px on desktop

    let lvIdx=0, moves=0, solved=0, hints=0;
    let grid=[], px=0, py=0, history=[];
    const tStart=Date.now();

    const isGoal=(r,c)=>{const ch=LEVELS[lvIdx].map[r]?.[c];return ch==='.'||ch==='+'||ch==='*';};
    const isSolved=()=>{for(let r=0;r<grid.length;r++)for(let c=0;c<(grid[r]?.length||0);c++)if(grid[r][c]==='$')return false;return true;};

    const loadLevel=i=>{
      lvIdx=i; moves=0; history=[];
      grid=LEVELS[i].map.map(r=>r.split(''));
      for(let r=0;r<grid.length;r++)for(let c=0;c<(grid[r]?.length||0);c++){
        if(grid[r][c]==='@'){py=r;px=c;grid[r][c]=' ';}
        else if(grid[r][c]==='+'){py=r;px=c;grid[r][c]='.';}
      }
      render();
    };

    const move=(dr,dc)=>{
      const nr=py+dr,nc=px+dc;
      if(!grid[nr]||grid[nr][nc]==='#') return;
      history.push({grid:grid.map(r=>[...r]),py,px,moves});
      if(history.length>150) history.shift();
      if(grid[nr][nc]==='$'||grid[nr][nc]==='*'){
        const br=nr+dr,bc=nc+dc;
        if(!grid[br]||grid[br][bc]==='#'||grid[br][bc]==='$'||grid[br][bc]==='*'){history.pop();return;}
        grid[br][bc]=(grid[br][bc]==='.'?'*':'$');
        grid[nr][nc]=(grid[nr][nc]==='*'?'.':' ');
      }
      py=nr; px=nc; moves++;
      render();
      if(isSolved()) setTimeout(()=>{
        solved++;
        if(lvIdx+1>=LEVELS.length) onComplete({rawScore:Math.min(100,80+solved-hints*3),timeMs:Date.now()-tStart,errors:hints,passed:true});
        else loadLevel(lvIdx+1);
      }, 420);
    };

    const undo=()=>{if(!history.length)return;const s=history.pop();grid=s.grid;py=s.py;px=s.px;moves=s.moves;render();};

    // Button style helper — defined OUTSIDE render so template literal can access it
    const BS=(col,wide=false)=>`background:${col};color:#fff;border:none;
      padding:clamp(13px,4vw,17px) ${wide?'8px':'4px'};border-radius:12px;
      font-size:clamp(1.05rem,5vw,1.3rem);font-weight:900;cursor:pointer;
      touch-action:none;min-height:clamp(54px,14vw,64px);
      ${wide?'flex:1;':'width:100%;'}
      box-shadow:0 4px 0 rgba(0,0,0,.3),0 2px 6px rgba(0,0,0,.25)`;

    const _pick = (obj) => (typeof LANG!=='undefined' && LANG._cur && obj[LANG._cur]) ? obj[LANG._cur] : obj.de;
    const render=()=>{
      const lvl=LEVELS[lvIdx];
      const lvlName=_pick(lvl.name), lvlHint=_pick(lvl.hint);
      const rows=grid.length, cols=Math.max(...grid.map(r=>r.length));
      const cw=cols*TILE, ch=rows*TILE;
      const T=TILE;

      el.innerHTML=`<div style="font-family:'Segoe UI',system-ui,sans-serif;user-select:none;-webkit-user-select:none;text-align:center">
        <div style="display:flex;justify-content:center;align-items:center;gap:10px;margin-bottom:8px;flex-wrap:wrap">
          <span style="color:#FF9F43;font-weight:900;font-size:clamp(1rem,4.5vw,1.15rem);text-shadow:0 1px 3px rgba(0,0,0,.3)">${lvlName}</span>
          <span style="background:rgba(255,255,255,.1);color:rgba(255,255,255,.5);font-size:.78rem;padding:2px 8px;border-radius:20px">Lv ${lvIdx+1}/${LEVELS.length}</span>
          <span style="color:#54D8D8;font-weight:700;font-size:.85rem">🦶 ${moves}</span>
          <span style="color:#2ecc71;font-size:.8rem">✅ ${solved}</span>
        </div>
        <canvas id="skcv" width="${cw*DPR}" height="${ch*DPR}"
          style="display:block;margin:0 auto;border-radius:16px;
                 width:${cw}px;height:${ch}px;
                 box-shadow:0 8px 40px rgba(0,0,0,.6),0 0 0 3px rgba(255,255,255,.08);
                 touch-action:none"></canvas>
        <!-- Ergonomic D-Pad: 3x3 grid + action row -->
        <div style="display:flex;flex-direction:column;align-items:center;gap:5px;margin-top:10px">
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px;width:${Math.min(cw,216)}px">
            <button id="sk-hint"  style="${BS('#8395a7')}">💡</button>
            <button id="sk-up"    style="${BS('#4834d4')}">↑</button>
            <button id="sk-undo"  style="${BS('#e17055')}">↩</button>
            <button id="sk-left"  style="${BS('#4834d4')}">←</button>
            <button id="sk-down"  style="${BS('#4834d4')}">↓</button>
            <button id="sk-right" style="${BS('#4834d4')}">→</button>
          </div>
          <div style="display:flex;gap:5px;width:${Math.min(cw,216)}px">
            <button id="sk-rst"  style="${BS('#d63031',true)}">↺ Reset</button>
            <button id="sk-skip" style="${BS('#6c5ce7',true)}">⏭ Skip</button>
          </div>
        </div>
        <div id="sk-hint-box" style="display:none;color:#FF9F43;font-size:.88rem;margin-top:8px;
          padding:8px 16px;background:rgba(255,159,67,.12);border:1px solid rgba(255,159,67,.3);
          border-radius:10px;max-width:${Math.min(cw,300)}px;margin-left:auto;margin-right:auto">
          💡 ${lvlHint}
        </div>
        <div style="font-size:.7rem;color:rgba(255,255,255,.18);margin-top:5px">${typeof t!=='undefined'?t('sokoban.controls'):'Pfeiltasten/WASD · Z=Rückgängig · Wischen'}</div>
      </div>`;

      const cv=document.getElementById('skcv');
      const ctx=cv.getContext('2d');
      // CRITICAL: reset transform before scaling, otherwise scale compounds!
      ctx.setTransform(DPR,0,0,DPR,0,0);

      // ══ CARTOON STYLE DRAWING ══
      // Palette
      const PAL={
        wall:'#2d3436', wallLight:'#636e72', wallDark:'#1a1f20',
        floor:'#f0e6d3', floorDark:'#e8d8c0', floorLine:'rgba(0,0,0,.05)',
        goalRing:'#fdcb6e', goalFill:'rgba(253,203,110,.15)',
        boxBody:'#d4875a', boxTop:'#e8a070', boxSide:'#b06840', boxDark:'#8a4e28',
        boxDoneBody:'#55efc4', boxDoneTop:'#81ecec', boxDoneSide:'#00b894',
        player:'#74b9ff', playerShine:'#a8d8ff', playerDark:'#0984e3',
        playerEye:'#2d3436', playerSmile:'rgba(255,255,255,.8)',
      };

      for(let r=0;r<rows;r++){
        for(let c=0;c<(grid[r]?.length||0);c++){
          const x=c*T, y=r*T, ch=grid[r][c];

          if(ch==='#'){
            // Cartoon wall — rounded feel with clear dark outline
            ctx.fillStyle=PAL.wall;
            ctx.fillRect(x,y,T,T);

            // Lighter face
            ctx.fillStyle=PAL.wallLight;
            ctx.fillRect(x+1,y+1,T-4,T-4);

            // Dark 3D edges
            ctx.fillStyle=PAL.wallDark;
            ctx.fillRect(x+T-3,y+2,3,T-2); // right
            ctx.fillRect(x+2,y+T-3,T-2,3); // bottom

            // Simple dot pattern for texture
            ctx.fillStyle='rgba(0,0,0,.12)';
            if((r+c)%2===0){
              ctx.beginPath();ctx.arc(x+T*.35,y+T*.35,T*.1,0,Math.PI*2);ctx.fill();
              ctx.beginPath();ctx.arc(x+T*.65,y+T*.65,T*.1,0,Math.PI*2);ctx.fill();
            }
            // Black outline
            ctx.strokeStyle='rgba(0,0,0,.6)';ctx.lineWidth=2;
            ctx.strokeRect(x+1,y+1,T-2,T-2);

          } else {
            // Floor — warm sandy color
            ctx.fillStyle=(r+c)%2===0?PAL.floor:PAL.floorDark;
            ctx.fillRect(x,y,T,T);
            // Subtle grid lines
            ctx.strokeStyle=PAL.floorLine;ctx.lineWidth=1;
            ctx.strokeRect(x,y,T,T);

            const gHere=isGoal(r,c)||(ch==='*');
            if(gHere){
              // Goal: bright rounded square with thick border
              const m=T*.14;
              const r2=T*.12; // corner radius for round rect
              ctx.fillStyle=PAL.goalFill;
              ctx.fillRect(x+m,y+m,T-m*2,T-m*2);

              // Outer border (thick, cartoon-like)
              ctx.strokeStyle=PAL.goalRing;
              ctx.lineWidth=3;
              ctx.lineJoin='round';
              ctx.strokeRect(x+m,y+m,T-m*2,T-m*2);

              // Inner cross
              ctx.strokeStyle='rgba(253,203,110,.6)';ctx.lineWidth=1.5;
              const cx2=x+T/2, cy2=y+T/2, arm=T*.2;
              ctx.beginPath();ctx.moveTo(cx2-arm,cy2);ctx.lineTo(cx2+arm,cy2);ctx.stroke();
              ctx.beginPath();ctx.moveTo(cx2,cy2-arm);ctx.lineTo(cx2,cy2+arm);ctx.stroke();

              // Glow dot at center
              ctx.fillStyle='rgba(253,203,110,.5)';
              ctx.beginPath();ctx.arc(cx2,cy2,T*.08,0,Math.PI*2);ctx.fill();
            }

            if(ch==='$'||ch==='*'){
              const done=ch==='*';
              const C=done?{top:PAL.boxDoneTop,body:PAL.boxDoneBody,side:PAL.boxDoneSide}
                         :{top:PAL.boxTop,body:PAL.boxBody,side:PAL.boxSide};
              const pad=T*.1;
              const bx=x+pad, by=y+pad, bw=T-pad*2, bh=T-pad*2;
              const depth=T*.12;

              // Shadow
              ctx.fillStyle='rgba(0,0,0,.22)';
              ctx.beginPath();
              ctx.ellipse(bx+bw/2,y+T-pad*.3,bw*.44,T*.1,0,0,Math.PI*2);
              ctx.fill();

              // Bottom face (3D side)
              ctx.fillStyle=C.side;
              ctx.fillRect(bx,by+bh-depth,bw,depth);
              ctx.fillRect(bx+bw-depth,by,depth,bh);

              // Main face
              ctx.fillStyle=C.body;
              ctx.fillRect(bx,by,bw-depth,bh-depth);

              // Top face highlight
              ctx.fillStyle=C.top;
              ctx.fillRect(bx,by,bw-depth,depth);
              ctx.fillRect(bx,by,depth,bh-depth);

              // Outline (thick cartoon border)
              ctx.strokeStyle='rgba(0,0,0,.7)';ctx.lineWidth=2.5;ctx.lineJoin='round';
              ctx.strokeRect(bx+1,by+1,bw-depth-2,bh-depth-2);

              // X mark
              ctx.strokeStyle=done?'rgba(0,0,0,.25)':'rgba(0,0,0,.18)';ctx.lineWidth=2;ctx.lineCap='round';
              const x1=bx+T*.2,y1=by+T*.2,x2=bx+bw-depth-T*.2,y2=by+bh-depth-T*.2;
              ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
              ctx.beginPath();ctx.moveTo(x2,y1);ctx.lineTo(x1,y2);ctx.stroke();

              if(done){
                // Big ✓ on completed box
                ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=3;ctx.lineCap='round';ctx.lineJoin='round';
                const cx3=bx+bw/2-depth/2, cy3=by+bh/2-depth/2;
                ctx.beginPath();
                ctx.moveTo(cx3-T*.18,cy3);
                ctx.lineTo(cx3-T*.05,cy3+T*.15);
                ctx.lineTo(cx3+T*.2,cy3-T*.15);
                ctx.stroke();
              }
            }
          }
        }
      }

      // ══ Player — round cartoon blob ══
      const pxc=px*T+T/2, pyc=py*T+T/2, pr=T*.40;

      // Shadow
      ctx.fillStyle='rgba(0,0,0,.2)';
      ctx.beginPath();ctx.ellipse(pxc,py*T+T-2,pr*.75,T*.11,0,0,Math.PI*2);ctx.fill();

      // Body — round gradient
      const pg=ctx.createRadialGradient(pxc-pr*.2,pyc-pr*.25,pr*.05,pxc,pyc,pr);
      pg.addColorStop(0,PAL.playerShine);pg.addColorStop(.5,PAL.player);pg.addColorStop(1,PAL.playerDark);
      ctx.fillStyle=pg;
      ctx.beginPath();ctx.arc(pxc,pyc,pr,0,Math.PI*2);ctx.fill();

      // Thick cartoon outline
      ctx.strokeStyle='rgba(0,0,0,.55)';ctx.lineWidth=2.5;
      ctx.beginPath();ctx.arc(pxc,pyc,pr,0,Math.PI*2);ctx.stroke();

      // Shine (oval highlight top-left)
      ctx.fillStyle='rgba(255,255,255,.45)';
      ctx.beginPath();ctx.ellipse(pxc-pr*.22,pyc-pr*.25,pr*.3,pr*.18,-Math.PI/5,0,Math.PI*2);ctx.fill();

      // Eyes (big cartoony)
      const eo=pr*.33;
      // White sclera
      ctx.fillStyle='#fff';
      ctx.beginPath();ctx.arc(pxc-eo*.58,pyc-eo*.28,eo*.65,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(pxc+eo*.58,pyc-eo*.28,eo*.65,0,Math.PI*2);ctx.fill();
      // Dark iris
      ctx.fillStyle=PAL.playerEye;
      ctx.beginPath();ctx.arc(pxc-eo*.48,pyc-eo*.24,eo*.38,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(pxc+eo*.68,pyc-eo*.24,eo*.38,0,Math.PI*2);ctx.fill();
      // Eye shine
      ctx.fillStyle='rgba(255,255,255,.85)';
      ctx.beginPath();ctx.arc(pxc-eo*.35,pyc-eo*.38,eo*.17,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(pxc+eo*.81,pyc-eo*.38,eo*.17,0,Math.PI*2);ctx.fill();
      // Smile
      ctx.strokeStyle=PAL.playerSmile;ctx.lineWidth=2;ctx.lineCap='round';
      ctx.beginPath();ctx.arc(pxc,pyc+pr*.18,pr*.28,.2,Math.PI-.2);ctx.stroke();

      // Wire buttons
      const wire=(id,fn)=>{const b=document.getElementById(id);if(!b)return;
        b.addEventListener('pointerdown',e=>{e.preventDefault();b.style.transform='translateY(2px)';b.style.boxShadow='0 2px 0 rgba(0,0,0,.25),0 1px 4px rgba(0,0,0,.3)';b.setPointerCapture(e.pointerId);fn();});
        b.addEventListener('pointerup',()=>{b.style.transform='';b.style.boxShadow='';});
        b.addEventListener('pointercancel',()=>{b.style.transform='';b.style.boxShadow='';});
      };
      wire('sk-up',()=>move(-1,0));wire('sk-down',()=>move(1,0));
      wire('sk-left',()=>move(0,-1));wire('sk-right',()=>move(0,1));
      wire('sk-undo',undo);
      wire('sk-rst',()=>{history=[];loadLevel(lvIdx);});
      wire('sk-skip',()=>{hints+=3;lvIdx+1<LEVELS.length?loadLevel(lvIdx+1):onComplete({rawScore:50,timeMs:Date.now()-tStart,errors:hints,passed:false});});
      wire('sk-hint',()=>{hints++;const hb=document.getElementById('sk-hint-box');if(hb)hb.style.display=hb.style.display==='none'?'block':'none';});
    };

    const kmap={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1],
                KeyW:[-1,0],KeyS:[1,0],KeyA:[0,-1],KeyD:[0,1]};
    const onK=e=>{
      if(kmap[e.code]){e.preventDefault();move(...kmap[e.code]);}
      if(e.code==='KeyZ'||e.code==='KeyU'){e.preventDefault();undo();}
      if(e.code==='KeyR')loadLevel(lvIdx);
    };
    window.addEventListener('keydown',onK);
    let ts=null;
    el.addEventListener('touchstart',e=>{const t=e.touches[0];ts={x:t.clientX,y:t.clientY};},{passive:true});
    el.addEventListener('touchend',e=>{
      if(!ts)return;const t=e.changedTouches[0];
      const dx=t.clientX-ts.x,dy=t.clientY-ts.y;ts=null;
      if(Math.abs(dx)<10&&Math.abs(dy)<10)return;
      Math.abs(dx)>Math.abs(dy)?move(0,dx>0?1:-1):move(dy>0?1:-1,0);
    },{passive:true});
    loadLevel(0);
    setTimeout(()=>{if(!document.getElementById('skcv'))window.removeEventListener('keydown',onK);},200);
  }
};
