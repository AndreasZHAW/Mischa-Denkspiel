// BOMBER-style game (formerly Pac-Man) — Dynablaster-inspired.
// Goal: destroy all ghosts with bombs (not collect all dots).
// Power stones extend your bomb's blast length. Killing a ghost also
// bumps your blast length by 1. Ghosts wander the maze; the "cage"
// in the middle now has a hole so they actually come out.
const PacmanGame = {
  start({onComplete}) {
    const el = document.getElementById('game-area');
    if (!el) { if(typeof GameLog!=='undefined')GameLog.error('pacman','game-area not found'); return; }
    if(typeof GameLog!=='undefined')GameLog.log('pacman','start()');

    const CELL=24, COLS=19, ROWS=21;
    // Legend: 1=wall (indestructible), 0=floor, 2=power stone (extends blast),
    // 3=floor (was 3 before too, kept for compatibility). Cage in the middle
    // now has an actual exit (row 7 col 9 opened up) so ghosts can leave.
    const MAZE_TEMPLATE = [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,2,0,0,0,1,1,0,0,1,0,0,1,1,0,0,0,2,1],
      [1,0,0,0,0,1,1,0,0,0,0,0,1,1,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,1],
      [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
      [1,0,1,0,0,1,0,0,0,0,0,0,0,1,0,0,1,0,1],
      [1,0,0,0,0,0,0,1,1,0,1,1,0,0,0,0,0,0,1],
      [1,0,0,0,0,1,0,1,0,0,0,1,0,1,0,0,0,0,1],
      [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
      [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
      [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
      [1,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,1],
      [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
      [1,0,1,0,0,0,0,0,1,0,1,0,0,0,0,0,1,0,1],
      [1,0,0,0,0,1,1,0,0,0,0,0,1,1,0,0,0,0,1],
      [1,2,0,0,0,1,1,0,0,0,0,0,1,1,0,0,0,2,1],
      [1,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ];

    const W=COLS*CELL, H=ROWS*CELL;
    const isTouch = 'ontouchstart' in window;

    el.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
        ${isTouch ? `
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px">
          <span style="font-size:clamp(0.82rem,3.5vw,0.92rem);color:rgba(255,255,255,.5)">Steuerung:</span>
          <button id="pc-mode-btn" style="background:#2c3e50;color:#FFD700;border:1px solid #FFD700;padding:4px 10px;border-radius:20px;font-size:clamp(0.82rem,3.5vw,0.92rem);cursor:pointer">${typeof t!=='undefined'?t('snake.mode_buttons'):'🎮 Tasten'}</button>
          <label id="pc-tilt-opts" style="display:none;align-items:center;gap:8px;font-size:clamp(0.8rem,3.4vw,0.9rem);color:rgba(255,255,255,.5)">
            <label style="display:flex;align-items:center;gap:3px;cursor:pointer">
              <input type="checkbox" id="pc-rev-x" style="cursor:pointer"> Links/Rechts ↔
            </label>
            <label style="display:flex;align-items:center;gap:3px;cursor:pointer">
              <input type="checkbox" id="pc-rev-y" style="cursor:pointer"> Oben/Unten ↕
            </label>
          </label>
        </div>` : ''}
        <canvas id="pccv" width="${W}" height="${H}" style="background:#000;border-radius:6px;max-width:min(${W}px,92vw)"></canvas>
        <div id="pc-btns" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;width:180px">
          <div></div>
          <button class="pc-btn" data-d="up" style="background:#2c3e50;color:#fff;border:1px solid #555;padding:12px;border-radius:8px;font-size:1.2rem;cursor:pointer;touch-action:none">▲</button>
          <button id="pc-bomb" style="background:#c0392b;color:#fff;border:1px solid #e74c3c;padding:12px;border-radius:8px;font-size:1.2rem;cursor:pointer;touch-action:none">💣</button>
          <button class="pc-btn" data-d="left" style="background:#2c3e50;color:#fff;border:1px solid #555;padding:12px;border-radius:8px;font-size:1.2rem;cursor:pointer;touch-action:none">◀</button>
          <button class="pc-btn" data-d="down" style="background:#2c3e50;color:#fff;border:1px solid #555;padding:12px;border-radius:8px;font-size:1.2rem;cursor:pointer;touch-action:none">▼</button>
          <button class="pc-btn" data-d="right" style="background:#2c3e50;color:#fff;border:1px solid #555;padding:12px;border-radius:8px;font-size:1.2rem;cursor:pointer;touch-action:none">▶</button>
        </div>
        ${isTouch ? `<div id="pc-tilt-hint" style="display:none;font-size:clamp(0.82rem,3.5vw,0.92rem);color:rgba(255,255,255,.4);text-align:center">${typeof t!=='undefined'?t('snake.tilt_hint'):'📱 Gerät neigen zum Steuern · 💣 legt Bombe'}</div>` : ''}
      </div>`;

    const cv = document.getElementById('pccv');
    const ctx = cv.getContext('2d');
    let maze = MAZE_TEMPLATE.map(r => [...r]);
    let running=true, tStart=Date.now(), animId, frameN=0;
    // Player: uses fractional tile position for smooth grid movement
    let px=1, py=1, wantDx=0, wantDy=0, curDx=0, curDy=0, subX=0, subY=0;
    const SPEED=0.14;
    let useTilt = false;
    let bombRange = 2;            // starting blast length (each direction)
    let maxBombs = 1;             // active bombs allowed
    let score = 0, ghostsKilled = 0;

    // GRACE PERIOD: first 8 seconds are a warm-up. Ghosts don't move, player
    // is invulnerable to ghost touch. Gives time to learn the controls before
    // the chaos starts.
    const GRACE_MS = 8000;
    // SAFE ZONE: an L-shaped corner in the top-left where ghosts can never
    // enter, so even after the grace period ends the player has a fallback
    // retreat spot they can trust. Radius 3 tiles from origin (1,1).
    const isSafeZone = (gx,gy) => (gx <= 3 && gy <= 3);
    // Ghosts start slower, ramp up gradually so the difficulty doesn't spike.
    // Base speed 0.06, +0.005 per elapsed second after grace, capped at 0.09.
    const ghostSpeedNow = () => {
      const elapsedAfterGrace = Math.max(0, Date.now() - tStart - GRACE_MS);
      const secs = elapsedAfterGrace / 1000;
      return Math.min(0.09, 0.06 + secs * 0.0015);
    };

    // BOMBS: {x, y, timer, range, exploding, expTimer}
    let bombs = [];
    // BLAST TILES currently on fire: {x, y, ttl}
    let blasts = [];

    // GHOSTS — start spread across the map, well away from the top-left safe zone.
    // Slightly slower than player so player can outrun them.
    let ghosts = [
      {x:9,  y:7,  subX:0, subY:0, dx:1, dy:0, col:'#FF4444', alive:true},
      {x:9,  y:11, subX:0, subY:0, dx:-1,dy:0, col:'#FFB8FF', alive:true},
      {x:5,  y:10, subX:0, subY:0, dx:0, dy:1, col:'#00FFFF', alive:true},
      {x:13, y:10, subX:0, subY:0, dx:0, dy:-1,col:'#FFA500', alive:true},
    ];
    const totalGhosts = ghosts.length;

    // A cell is walkable if it's floor OR power stone (NOT a wall, NOT a bomb).
    const isWall = (gx,gy) => (maze[gy]?.[gx] === 1);
    const hasBomb = (gx,gy) => bombs.some(b => b.x===gx && b.y===gy && !b.exploding);
    const canPlayerEnter = (gx,gy) => !isWall(gx,gy) && !hasBomb(gx,gy);
    // Ghosts additionally cannot step into the top-left safe zone — this is
    // the "training corner" the player can always retreat to.
    const canGhostEnter = (gx,gy) => !isWall(gx,gy) && !hasBomb(gx,gy) && !isSafeZone(gx,gy);

    // ── MODE TOGGLE (tilt vs buttons) ──
    const modeBtn = document.getElementById('pc-mode-btn');
    const btnsDiv = document.getElementById('pc-btns');
    const tiltHint = document.getElementById('pc-tilt-hint');
    const tiltOpts = document.getElementById('pc-tilt-opts');
    if(modeBtn) modeBtn.addEventListener('click', () => {
      useTilt = !useTilt;
      modeBtn.textContent = useTilt ? (typeof t!=='undefined'?t('snake.mode_tilt'):'📱 Neigen') : (typeof t!=='undefined'?t('snake.mode_buttons'):'🎮 Tasten');
      modeBtn.style.background = useTilt ? '#8e44ad' : '#2c3e50';
      // Note: keep the bomb button visible even in tilt mode — tilt only handles movement
      if(tiltHint) tiltHint.style.display = useTilt ? 'block' : 'none';
      if(tiltOpts) tiltOpts.style.display = useTilt ? 'flex' : 'none';
      if(useTilt && typeof DeviceMotionEvent !== 'undefined') {
        if(typeof DeviceMotionEvent.requestPermission === 'function') {
          DeviceMotionEvent.requestPermission().then(r => {
            if(r!=='granted'){ useTilt=false; modeBtn.textContent=typeof t!=='undefined'?t('snake.mode_buttons'):'🎮 Tasten'; }
          }).catch(()=>{ useTilt=false; });
        }
      }
    });

    // ── GYROSCOPE / ACCELEROMETER ──
    let tiltX=0, tiltY=0;
    const onMotion = (e) => {
      if(!useTilt) return;
      const g = e.accelerationIncludingGravity || e.acceleration || {};
      let tx = g.x || 0;
      let ty = g.y || 0;
      const revX = document.getElementById('pc-rev-x')?.checked;
      const revY = document.getElementById('pc-rev-y')?.checked;
      if(revX) tx = -tx;
      if(revY) ty = -ty;
      tiltX = tx; tiltY = ty;
      const THRESH = 3;
      if(Math.abs(tx) > Math.abs(ty)) {
        if(tx < -THRESH){ wantDx=1; wantDy=0; }
        else if(tx > THRESH){ wantDx=-1; wantDy=0; }
      } else {
        if(ty > THRESH){ wantDx=0; wantDy=-1; }
        else if(ty < -THRESH){ wantDx=0; wantDy=1; }
      }
    };
    window.addEventListener('devicemotion', onMotion);

    // ── BUTTON CONTROLS ──
    const DIRS = {up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
    document.querySelectorAll('.pc-btn').forEach(b => {
      b.addEventListener('pointerdown', e => {
        e.preventDefault();
        const [ddx,ddy] = DIRS[b.dataset.d];
        wantDx=ddx; wantDy=ddy;
      });
    });

    // ── BOMB PLACEMENT ──
    const placeBomb = () => {
      // Can't stack bombs on same tile; can't exceed active-bomb limit
      const activeBombs = bombs.filter(b => !b.exploding).length;
      if (activeBombs >= maxBombs) return;
      if (hasBomb(px,py)) return;
      bombs.push({x:px, y:py, timer:120, range:bombRange, exploding:false, expTimer:0});
    };
    const bombBtn = document.getElementById('pc-bomb');
    if(bombBtn) bombBtn.addEventListener('pointerdown', e => { e.preventDefault(); placeBomb(); });

    const onKey = e => {
      const map={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};
      if(map[e.key]){ wantDx=map[e.key][0]; wantDy=map[e.key][1]; }
      if(e.key===' ' || e.key==='Enter') { e.preventDefault(); placeBomb(); }
    };
    window.addEventListener('keydown', onKey);

    const cleanup = () => {
      running=false; cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('devicemotion', onMotion);
    };

    const end = (won) => {
      cleanup();
      // Raw score scales with how many ghosts you got. Full clear = 100.
      const rawScore = Math.min(100, Math.round((ghostsKilled/totalGhosts)*100));
      onComplete({
        rawScore,
        timeMs: Date.now()-tStart,
        errors: 0,
        passed: won,
      });
    };

    // ── BOMB EXPLOSION LOGIC ──
    const triggerBomb = (b) => {
      if (b.exploding) return;
      b.exploding = true;
      b.expTimer = 25;
      // Central blast tile
      blasts.push({x:b.x, y:b.y, ttl:25});
      // Four directions, extending outward until blocked by a wall
      const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
      for (const [dx,dy] of dirs) {
        for (let step=1; step<=b.range; step++) {
          const tx = b.x + dx*step, ty = b.y + dy*step;
          if (isWall(tx,ty)) break; // walls block the blast
          blasts.push({x:tx, y:ty, ttl:25});
          // Chain-explode: if another (unexploded) bomb is on this tile, ignite it
          const chain = bombs.find(other => other.x===tx && other.y===ty && !other.exploding);
          if (chain) chain.timer = 1;
        }
      }
    };

    const loop = () => {
      if(!running) return;
      frameN++;
      const grace = (Date.now() - tStart) < GRACE_MS;

      // ── PLAYER MOVEMENT (grid-snap with smooth interp) ──
      if(canPlayerEnter(px+wantDx,py+wantDy)){curDx=wantDx;curDy=wantDy;}
      if(curDx!==0||curDy!==0){
        if(!canPlayerEnter(px+curDx,py+curDy)){
          curDx=0;curDy=0;subX=0;subY=0;
        } else {
          subX+=curDx*SPEED; subY+=curDy*SPEED;
          if(Math.abs(subX)>=1||Math.abs(subY)>=1){
            px+=curDx; py+=curDy;
            px=Math.max(0,Math.min(COLS-1,px));
            py=Math.max(0,Math.min(ROWS-1,py));
            subX=0;subY=0;
            // Collect power stone
            if(maze[py][px]===2){
              maze[py][px]=0;
              bombRange++;
              score+=50;
            }
          }
        }
      }

      // ── GHOST MOVEMENT (frozen during grace period) ──
      if (!grace) for (const g of ghosts) {
        if (!g.alive) continue;
        // Only decide new direction when perfectly aligned on a tile
        if (g.subX === 0 && g.subY === 0) {
          // Options: keep going, or turn (never straight-reverse unless forced)
          const opts = [[1,0],[-1,0],[0,1],[0,-1]]
            .filter(([dx,dy]) => canGhostEnter(g.x+dx, g.y+dy) && !(dx===-g.dx && dy===-g.dy));
          const allOpts = [[1,0],[-1,0],[0,1],[0,-1]]
            .filter(([dx,dy]) => canGhostEnter(g.x+dx, g.y+dy));
          const choices = opts.length ? opts : allOpts;
          if (choices.length) {
            // 40% chance: chase player. Otherwise random for unpredictability.
            let pick = choices[Math.floor(Math.random()*choices.length)];
            if (Math.random() < 0.4) {
              let best = pick, bestD = Infinity;
              for (const [dx,dy] of choices) {
                const d = Math.abs((g.x+dx)-px) + Math.abs((g.y+dy)-py);
                if (d < bestD) { bestD = d; best = [dx,dy]; }
              }
              pick = best;
            }
            g.dx = pick[0]; g.dy = pick[1];
          } else {
            g.dx = 0; g.dy = 0;
          }
        }
        // Advance ghost
        if (g.dx !== 0 || g.dy !== 0) {
          if (!canGhostEnter(g.x+g.dx, g.y+g.dy)) {
            g.dx = 0; g.dy = 0; g.subX = 0; g.subY = 0;
          } else {
            const _gs = ghostSpeedNow();
            g.subX += g.dx * _gs;
            g.subY += g.dy * _gs;
            if (Math.abs(g.subX) >= 1 || Math.abs(g.subY) >= 1) {
              g.x += g.dx; g.y += g.dy;
              g.x = Math.max(0, Math.min(COLS-1, g.x));
              g.y = Math.max(0, Math.min(ROWS-1, g.y));
              g.subX = 0; g.subY = 0;
            }
          }
        }
      }

      // ── BOMBS TICK (frozen during grace period so player can safely test) ──
      if (!grace) for (const b of bombs) {
        if (b.exploding) {
          b.expTimer--;
        } else {
          b.timer--;
          if (b.timer <= 0) triggerBomb(b);
        }
      }

      // ── BLAST TILES TICK + HITBOX ──
      for (const bl of blasts) bl.ttl--;
      // Kill ghosts standing on blast
      for (const g of ghosts) {
        if (!g.alive) continue;
        if (blasts.some(bl => bl.x===g.x && bl.y===g.y && bl.ttl>0)) {
          g.alive = false;
          ghostsKilled++;
          score += 200;
          bombRange++; // reward: bigger bombs next time
        }
      }
      // Player killed by blast → game over (skipped during grace period)
      if (!grace && blasts.some(bl => bl.x===px && bl.y===py && bl.ttl>0)) {
        end(false);
        return;
      }
      // Player killed by touching a live ghost (skipped during grace period)
      if (!grace) for (const g of ghosts) {
        if (!g.alive) continue;
        if (g.x===px && g.y===py) { end(false); return; }
      }

      // Cleanup finished bombs and expired blasts
      bombs = bombs.filter(b => !(b.exploding && b.expTimer <= 0));
      blasts = blasts.filter(bl => bl.ttl > 0);

      // Win condition: all ghosts dead
      if (ghosts.every(g => !g.alive)) { end(true); return; }
      // Time limit
      if (Date.now() - tStart > 120000) { end(false); return; }

      // ── DRAW ──
      ctx.fillStyle='#000'; ctx.fillRect(0,0,W,H);
      for (let ry=0; ry<ROWS; ry++) {
        for (let rx=0; rx<COLS; rx++) {
          const c = maze[ry][rx];
          if (c===1) {
            ctx.fillStyle='#1a1aff'; ctx.fillRect(rx*CELL, ry*CELL, CELL, CELL);
            ctx.fillStyle='#0000aa'; ctx.fillRect(rx*CELL+2, ry*CELL+2, CELL-4, CELL-4);
          } else if (c===2) {
            // Power stone (extends bomb blast)
            const p = 0.6 + 0.4*Math.sin(frameN*0.15);
            ctx.fillStyle = `rgba(255,120,255,${p})`;
            ctx.beginPath(); ctx.arc(rx*CELL+CELL/2, ry*CELL+CELL/2, CELL/2-4, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth=1.5; ctx.stroke();
          }
          // Safe-zone tint: gentle green wash over floor tiles ghosts can't enter
          if (c !== 1 && isSafeZone(rx, ry)) {
            ctx.fillStyle = 'rgba(60,180,80,0.15)';
            ctx.fillRect(rx*CELL, ry*CELL, CELL, CELL);
          }
        }
      }

      // Draw blasts (before bombs so bomb icon stays visible on center tile)
      for (const bl of blasts) {
        const alpha = Math.min(1, bl.ttl/15);
        ctx.fillStyle = `rgba(255,180,40,${alpha*0.85})`;
        ctx.fillRect(bl.x*CELL+2, bl.y*CELL+2, CELL-4, CELL-4);
        ctx.fillStyle = `rgba(255,255,255,${alpha*0.6})`;
        ctx.fillRect(bl.x*CELL+CELL/2-3, bl.y*CELL+CELL/2-3, 6, 6);
      }
      // Draw bombs
      for (const b of bombs) {
        if (b.exploding) continue;
        const pulse = 0.75 + 0.25*Math.sin(frameN*0.4);
        const r = (CELL/2-3) * pulse;
        ctx.fillStyle='#111';
        ctx.beginPath(); ctx.arc(b.x*CELL+CELL/2, b.y*CELL+CELL/2, r, 0, Math.PI*2); ctx.fill();
        // Fuse
        ctx.strokeStyle='#f80'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(b.x*CELL+CELL/2+r*0.4, b.y*CELL+CELL/2-r*0.4);
        ctx.lineTo(b.x*CELL+CELL/2+r*0.8, b.y*CELL+CELL/2-r*0.9); ctx.stroke();
        // Spark
        if (frameN%6<3) { ctx.fillStyle='#ff0'; ctx.beginPath(); ctx.arc(b.x*CELL+CELL/2+r*0.8, b.y*CELL+CELL/2-r*0.9, 2, 0, Math.PI*2); ctx.fill(); }
      }

      // Draw ghosts
      for (const g of ghosts) {
        if (!g.alive) continue;
        const gx = (g.x+g.subX)*CELL + CELL/2;
        const gy = (g.y+g.subY)*CELL + CELL/2;
        ctx.fillStyle = g.col;
        ctx.beginPath(); ctx.arc(gx, gy, CELL/2-2, Math.PI, 0);
        ctx.lineTo(gx+CELL/2-2, gy+4);
        for(let i=0;i<3;i++) ctx.lineTo(gx+CELL/2-2-i*(CELL-4)/3, gy+(i%2===0?4:0));
        ctx.lineTo(gx-CELL/2+2, gy+4); ctx.closePath(); ctx.fill();
        ctx.fillStyle='#fff';
        ctx.beginPath(); ctx.arc(gx-3, gy-2, 3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(gx+4, gy-2, 3, 0, Math.PI*2); ctx.fill();
      }

      // Draw player (bomber character — yellow with helmet)
      const rawDX = (px+subX)*CELL + CELL/2;
      const rawDY = (py+subY)*CELL + CELL/2;
      const dx = Math.max(CELL/2, Math.min(W-CELL/2, rawDX));
      const dy = Math.max(CELL/2, Math.min(H-CELL/2, rawDY));
      // Body
      ctx.fillStyle='#FFD700';
      ctx.beginPath(); ctx.arc(dx, dy, CELL/2-3, 0, Math.PI*2); ctx.fill();
      // Helmet
      ctx.fillStyle='#3498db';
      ctx.beginPath(); ctx.arc(dx, dy-3, CELL/2-4, Math.PI, 0); ctx.fill();
      // Eyes
      ctx.fillStyle='#000';
      ctx.beginPath(); ctx.arc(dx-3, dy+1, 1.5, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(dx+3, dy+1, 1.5, 0, Math.PI*2); ctx.fill();

      // Grace-period overlay: big centered countdown so player knows they're safe
      if (grace) {
        const remaining = Math.ceil((GRACE_MS - (Date.now()-tStart))/1000);
        ctx.fillStyle='rgba(0,0,0,.55)';
        ctx.fillRect(0, H/2-46, W, 84);
        ctx.textAlign='center';
        ctx.fillStyle='#2ecc40'; ctx.font='bold 16px Arial';
        ctx.fillText('🛡️ Übung — Geister eingefroren', W/2, H/2-22);
        ctx.fillStyle='#fff'; ctx.font='bold 32px Arial';
        ctx.fillText('Start in ' + remaining, W/2, H/2+10);
        ctx.fillStyle='rgba(255,255,255,.7)'; ctx.font='11px Arial';
        ctx.fillText('Bewege dich und lerne die Steuerung. Grüner Bereich ist immer sicher.', W/2, H/2+30);
      }

      // HUD
      ctx.fillStyle='rgba(0,0,0,.75)'; ctx.fillRect(0, H-28, W, 28);
      ctx.fillStyle='#FFD700'; ctx.font='bold 12px monospace'; ctx.textAlign='left';
      ctx.fillText('Score: '+score, 6, H-10);
      ctx.textAlign='center'; ctx.fillStyle='#fff';
      const alive = ghosts.filter(g=>g.alive).length;
      ctx.fillText('👻 '+alive+'/'+totalGhosts, W/2, H-10);
      ctx.textAlign='right'; ctx.fillStyle='#ff0';
      ctx.fillText('💥 '+bombRange, W-6, H-10);

      animId = requestAnimationFrame(loop);
    };
    loop();
  }
};
window.PacmanGame=PacmanGame;
