// CATAPULT — Croissant/Baguette shooting gallery, Angry-Birds-style drag launch.
// Replaces "Rechnen II" (math2) as requested — angle+power aim game with
// France-themed targets. Moving targets are worth more than static ones.
const CatapultGame = {
  start({onComplete}) {
    const el = document.getElementById('game-area');
    if (!el) { if(typeof GameLog!=='undefined')GameLog.error('catapult','game-area not found'); return; }
    if(typeof GameLog!=='undefined')GameLog.log('catapult','start()');

    const W=340, H=420;
    const isTouch = 'ontouchstart' in window;

    el.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
        <div style="font-size:clamp(0.82rem,3.5vw,0.95rem);color:rgba(255,255,255,.75);text-align:center">
          🥐 ${typeof t!=='undefined'?t('catapult.hint'):'Ziehe die Schleuder zurück und lass los, um zu schiessen!'}
        </div>
        <canvas id="catcv" width="${W}" height="${H}" style="background:linear-gradient(#87CEEB,#B0E0E6);border-radius:6px;max-width:min(${W}px,92vw);touch-action:none;cursor:grab"></canvas>
      </div>`;

    const cv = document.getElementById('catcv');
    const ctx = cv.getContext('2d');

    // Coordinate scaling: canvas element may be CSS-shrunk on mobile, so map
    // pointer events through the actual displayed size to internal W×H space.
    const toCanvasXY = (clientX, clientY) => {
      const rect = cv.getBoundingClientRect();
      return {
        x: (clientX - rect.left) * (W / rect.width),
        y: (clientY - rect.top) * (H / rect.height),
      };
    };

    let running = true, tStart = Date.now(), animId, frameN = 0;
    const ANCHOR = {x: 55, y: H-70}; // slingshot pivot point
    const MAX_PULL = 70;             // max drag distance from anchor
    let shotsLeft = 10;
    let score = 0, hits = 0, movingHits = 0;

    // Projectile state (null when not in flight)
    let proj = null; // {x,y,vx,vy,active}
    let dragging = false, dragPos = null;
    let msg = '', msgTTL = 0;

    // ── TARGETS ──
    // Static targets: fixed position, worth less. Moving targets: drift
    // horizontally across the screen, worth more (as requested).
    const GROUND_Y = H - 30;
    let targets = [];
    const spawnTargets = () => {
      targets = [];
      // 2 static croissants on "shelves"
      targets.push({type:'croissant', x:200, y:H-140, r:16, static:true, alive:true, pts:10});
      targets.push({type:'baguette',  x:270, y:H-190, r:18, static:true, alive:true, pts:10});
      // 2 moving targets drifting across upper area — worth more
      targets.push({type:'croissant', x:230, y:110, r:15, static:false, alive:true, pts:25, vx: 0.8, dir:1});
      targets.push({type:'baguette',  x:180, y:70,  r:17, static:false, alive:true, pts:25, vx: -0.6, dir:-1});
    };
    spawnTargets();

    const launch = (dx, dy) => {
      // dx,dy = pull vector FROM anchor TO drag point. Launch is OPPOSITE
      // (like a real slingshot: pull back, release, ball flies forward).
      const pullDist = Math.min(MAX_PULL, Math.hypot(dx, dy));
      if (pullDist < 8) return; // too small a pull, ignore
      const power = (pullDist / MAX_PULL) * 15 + 5; // 5..20
      const launchAngle = Math.atan2(-dy, -dx); // opposite of pull direction
      proj = {
        x: ANCHOR.x, y: ANCHOR.y,
        vx: Math.cos(launchAngle) * power,
        vy: Math.sin(launchAngle) * power,
        active: true,
      };
      shotsLeft--;
    };

    // ── POINTER HANDLING ──
    const onDown = (e) => {
      if (proj) return; // wait for projectile to finish before next pull
      const p = toCanvasXY(e.touches ? e.touches[0].clientX : e.clientX, e.touches ? e.touches[0].clientY : e.clientY);
      if (Math.hypot(p.x-ANCHOR.x, p.y-ANCHOR.y) < 50) { dragging = true; dragPos = p; }
    };
    const onMove = (e) => {
      if (!dragging) return;
      e.preventDefault();
      dragPos = toCanvasXY(e.touches ? e.touches[0].clientX : e.clientX, e.touches ? e.touches[0].clientY : e.clientY);
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      if (dragPos) launch(dragPos.x - ANCHOR.x, dragPos.y - ANCHOR.y);
      dragPos = null;
    };
    cv.addEventListener('mousedown', onDown);
    cv.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    cv.addEventListener('touchstart', onDown, {passive:true});
    cv.addEventListener('touchmove', onMove, {passive:false});
    cv.addEventListener('touchend', onUp);

    const cleanup = () => {
      running = false; cancelAnimationFrame(animId);
      cv.removeEventListener('mousedown', onDown);
      cv.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      cv.removeEventListener('touchstart', onDown);
      cv.removeEventListener('touchmove', onMove);
      cv.removeEventListener('touchend', onUp);
    };

    const end = () => {
      cleanup();
      // Scale: 10 shots, best possible ~ hit all 4 targets every relevant
      // round repeatedly. Realistically scoring is cumulative across shots;
      // cap rawScore at 100. Moving hits count extra via their higher pts.
      const rawScore = Math.min(100, Math.round(score / 1.8));
      if(typeof GameLog!=='undefined')GameLog.log('catapult','onComplete: score='+score+' hits='+hits+' movingHits='+movingHits+' rawScore='+rawScore);
      onComplete({
        rawScore,
        timeMs: Date.now()-tStart,
        errors: 0,
        passed: hits >= 2,
      });
    };

    const loop = () => {
      if (!running) return;
      frameN++;

      // ── MOVE TARGETS ──
      for (const tg of targets) {
        if (tg.static || !tg.alive) continue;
        tg.x += tg.vx * tg.dir;
        if (tg.x < 30 || tg.x > W-30) tg.dir *= -1;
      }

      // ── PROJECTILE PHYSICS ──
      if (proj && proj.active) {
        proj.vy += 0.35; // gravity
        proj.x += proj.vx;
        proj.y += proj.vy;
        // Collision with targets
        for (const tg of targets) {
          if (!tg.alive) continue;
          if (Math.hypot(proj.x-tg.x, proj.y-tg.y) < tg.r + 8) {
            tg.alive = false;
            score += tg.pts;
            hits++;
            if (!tg.static) movingHits++;
            msg = '+' + tg.pts + (tg.static ? '' : ' 🌟');
            msgTTL = 45;
            proj.active = false;
            break;
          }
        }
        // Out of bounds (missed) → projectile gone, ready for next shot
        if (proj.y > H + 20 || proj.x > W + 20 || proj.x < -20) {
          proj.active = false;
        }
        if (!proj.active) {
          proj = null;
          // Respawn any target that was hit, after a brief pause, so there's
          // always something to aim at across all 10 shots.
          setTimeout(() => {
            if (!running) return;
            for (const tg of targets) {
              if (!tg.alive) {
                tg.alive = true;
                if (!tg.static) tg.x = tg.x < W/2 ? 60 : W-60;
              }
            }
          }, 400);
          if (shotsLeft <= 0) { setTimeout(()=>{ if(running) end(); }, 500); }
        }
      }

      if (msgTTL > 0) msgTTL--;

      // ── DRAW ──
      ctx.clearRect(0,0,W,H);
      // Sky gradient background already via CSS; draw ground
      ctx.fillStyle = '#8FBC6B';
      ctx.fillRect(0, GROUND_Y, W, H-GROUND_Y);
      ctx.fillStyle = '#6B9A4F';
      ctx.fillRect(0, GROUND_Y, W, 4);

      // Slingshot posts
      ctx.strokeStyle = '#6B4423'; ctx.lineWidth = 6; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(ANCHOR.x-10, GROUND_Y); ctx.lineTo(ANCHOR.x-10, ANCHOR.y-5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ANCHOR.x+10, GROUND_Y); ctx.lineTo(ANCHOR.x+10, ANCHOR.y-5); ctx.stroke();

      // Draw targets
      for (const tg of targets) {
        if (!tg.alive) continue;
        ctx.save();
        ctx.translate(tg.x, tg.y);
        if (tg.type === 'croissant') {
          ctx.font = (tg.r*2)+'px Arial';
          ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.fillText('🥐', 0, 0);
        } else {
          ctx.font = (tg.r*2)+'px Arial';
          ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.fillText('🥖', 0, 0);
        }
        if (!tg.static) {
          // Little motion glow ring so kids notice "moving = worth more"
          ctx.strokeStyle='rgba(255,215,0,.6)'; ctx.lineWidth=2;
          ctx.beginPath(); ctx.arc(0,0,tg.r+6,0,Math.PI*2); ctx.stroke();
        }
        ctx.restore();
      }

      // Slingshot band + pouch (drawn AFTER targets so it's in front)
      const pouchX = dragging && dragPos ? ANCHOR.x + Math.max(-MAX_PULL,Math.min(MAX_PULL, dragPos.x-ANCHOR.x))*0 + (dragPos.x) : (proj ? proj.x : ANCHOR.x);
      const pouchY = dragging && dragPos ? dragPos.y : (proj ? proj.y : ANCHOR.y);
      let clampedPouchX = pouchX, clampedPouchY = pouchY;
      if (dragging && dragPos) {
        const dx = dragPos.x - ANCHOR.x, dy = dragPos.y - ANCHOR.y;
        const dist = Math.min(MAX_PULL, Math.hypot(dx,dy));
        const ang = Math.atan2(dy,dx);
        clampedPouchX = ANCHOR.x + Math.cos(ang)*dist;
        clampedPouchY = ANCHOR.y + Math.sin(ang)*dist;
      }
      if (!proj) {
        ctx.strokeStyle = '#8B5A2B'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(ANCHOR.x-10, ANCHOR.y-5); ctx.lineTo(clampedPouchX, clampedPouchY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ANCHOR.x+10, ANCHOR.y-5); ctx.lineTo(clampedPouchX, clampedPouchY); ctx.stroke();
        // Ball in pouch
        ctx.fillStyle = '#D2691E';
        ctx.beginPath(); ctx.arc(clampedPouchX, clampedPouchY, 9, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle='#8B4513'; ctx.lineWidth=1.5; ctx.stroke();
      }

      // Projectile in flight
      if (proj) {
        ctx.fillStyle = '#D2691E';
        ctx.beginPath(); ctx.arc(proj.x, proj.y, 9, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle='#8B4513'; ctx.lineWidth=1.5; ctx.stroke();
      }

      // Hit message popup
      if (msgTTL > 0) {
        ctx.fillStyle = `rgba(255,215,0,${Math.min(1,msgTTL/20)})`;
        ctx.font = 'bold 22px Arial'; ctx.textAlign='center';
        ctx.fillText(msg, W/2, H*0.3 - (45-msgTTL));
      }

      // HUD
      ctx.fillStyle='rgba(0,0,0,.7)'; ctx.fillRect(0,0,W,26);
      ctx.font='bold 13px monospace'; ctx.textAlign='left'; ctx.fillStyle='#FFD700';
      ctx.fillText('🎯 '+score, 8, 18);
      ctx.textAlign='right'; ctx.fillStyle='#fff';
      ctx.fillText((typeof t!=='undefined'?t('catapult.shots'):'Schüsse')+': '+shotsLeft, W-8, 18);

      cv.style.cursor = dragging ? 'grabbing' : 'grab';

      animId = requestAnimationFrame(loop);
    };
    loop();
  }
};
window.CatapultGame = CatapultGame;
