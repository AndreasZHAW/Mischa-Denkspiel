/**
 * games/dart.js v2 — Echte Dartscheibe
 * - Echte Dartscheibe mit Double/Triple Ring, Bullseye, 20 Sektoren
 * - Windfahne die sich jede Sekunde ändert
 * - 10 Würfe, Ziel: 400+ Punkte
 */

const DartGame = {
  current: null, _lastConfig: null,
  _raf: null, _windTick: null,

  // Dart-Sektoren (im Uhrzeigersinn ab oben)
  SECTORS: [20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5],

  start(config) {
    DartGame._lastConfig = config;
    this.current = {
      throws: 0, maxThrows: 10, totalScore: 0,
      scores: [], errors: 0, throwing: false,
      startTime: Date.now(),
      wind: this._newWind(),
      aimX: 0, aimY: 0, // relative to center (-1 to 1)
      darts: [], // {x, y, pts} in canvas coords
      onComplete: config.onComplete,
    };
    this._render();
    // Wind changes every second
    this._windTick = setInterval(() => {
      if (this.current) {
        this.current.wind = this._newWind();
        this._updateWindVane();
      }
    }, 1000);
  },

  _newWind() {
    const angle = Math.random() * 360; // degrees
    const strength = Math.random() * 3; // 0-3
    const names = ['Windstille','Leichte Brise','Mäßiger Wind','Starker Wind'];
    const name = strength < 0.5 ? names[0] : strength < 1.5 ? names[1] : strength < 2.5 ? names[2] : names[3];
    return { angle, strength, name };
  },

  _render() {
    const c = this.current;
    const total = c.totalScore;
    const need = Math.max(0, 400 - total);

    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center;padding:0">
        <!-- Score bar -->
        <div style="display:flex;justify-content:space-between;font-size:0.82rem;color:var(--text-mid);margin-bottom:8px">
          <span>Wurf <b>${c.throws}/${c.maxThrows}</b></span>
          <span style="color:${total>=400?'#27AE60':'var(--text-dark)'}">Punkte: <b>${total}</b>/400</span>
          <span style="color:${need===0?'#27AE60':'var(--text-mid)'}">${need===0?'✅ Ziel erreicht!':'Noch '+need+'pts'}</span>
        </div>

        <!-- Progress -->
        <div style="background:#E0E6EE;border-radius:50px;height:10px;margin-bottom:12px;overflow:hidden">
          <div style="height:100%;background:linear-gradient(90deg,#E74C3C,#F39C12,#27AE60);
            border-radius:50px;width:${Math.min(100,(total/400)*100)}%;transition:width 0.4s"></div>
        </div>

        <!-- Wind vane + info -->
        <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:12px;
          background:#EBF5FB;border-radius:12px;padding:8px 14px">
          <!-- Wind vane SVG -->
          <svg id="wind-vane" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" style="width:44px;height:44px;flex-shrink:0">
            <circle cx="25" cy="25" r="23" fill="white" stroke="#BDC3C7" stroke-width="2"/>
            <!-- Compass points -->
            <text x="25" y="9" text-anchor="middle" font-size="7" font-weight="700" fill="#2C3E50">N</text>
            <text x="41" y="29" text-anchor="middle" font-size="7" fill="#95A5A6">O</text>
            <text x="25" y="45" text-anchor="middle" font-size="7" fill="#95A5A6">S</text>
            <text x="9" y="29" text-anchor="middle" font-size="7" fill="#95A5A6">W</text>
            <!-- Arrow (rotates) -->
            <g id="wind-arrow" transform="rotate(${c.wind.angle}, 25, 25)">
              <polygon points="25,8 22,28 25,25 28,28" fill="#E74C3C"/>
              <polygon points="25,42 22,22 25,25 28,22" fill="#BDC3C7"/>
            </g>
            <circle cx="25" cy="25" r="3" fill="#2C3E50"/>
          </svg>
          <div style="text-align:left">
            <div style="font-size:0.78rem;font-weight:700;color:var(--text-dark)">${c.wind.name}</div>
            <div style="font-size:0.7rem;color:var(--text-mid)">Stärke: ${'●'.repeat(Math.ceil(c.wind.strength))}${'○'.repeat(3-Math.ceil(c.wind.strength))} — ${Math.round(c.wind.angle)}°</div>
            <div style="font-size:0.68rem;color:#E67E22">⚠️ Ändert sich jede Sekunde!</div>
          </div>
        </div>

        <!-- Dartboard -->
        <canvas id="dart-canvas" width="280" height="280"
          style="border-radius:50%;cursor:crosshair;display:block;margin:0 auto 12px;
            box-shadow:0 8px 24px rgba(0,0,0,0.3);touch-action:none"
          onclick="DartGame._throw(event)"
          onmousemove="DartGame._aim(event)">
        </canvas>

        <!-- Scores row -->
        <div style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap;margin-bottom:10px">
          ${c.scores.map(s=>`
            <div style="width:26px;height:26px;border-radius:7px;
              background:${s.pts>0?s.pts>=50?'#8E44AD':s.pts>=40?'#27AE60':s.pts>=25?'#F39C12':'#3498DB':'#E74C3C'};
              color:white;font-size:0.65rem;font-weight:700;display:flex;align-items:center;justify-content:center"
              title="${s.label||s.pts+'pts'}">
              ${s.pts>0?s.pts:'✗'}
            </div>`).join('')}
          ${Array.from({length:c.maxThrows-c.throws},()=>`
            <div style="width:26px;height:26px;border-radius:7px;background:#E0E6EE"></div>`).join('')}
        </div>

        <div style="font-size:0.8rem;color:var(--text-mid)">🎯 Tippe auf die Scheibe zum Werfen!</div>
      </div>`;

    this._drawBoard();
  },

  _drawBoard() {
    const c = this.current;
    const canvas = document.getElementById('dart-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W/2, cy = H/2, R = W/2 - 4;

    ctx.clearRect(0, 0, W, H);

    const sectors = this.SECTORS;
    const nSec = sectors.length;
    const angleStep = (2 * Math.PI) / nSec;
    const startOffset = -Math.PI/2 - angleStep/2; // top center

    // Colors alternating black/cream for outer, green/red for double/triple
    for (let i = 0; i < nSec; i++) {
      const a1 = startOffset + i * angleStep;
      const a2 = a1 + angleStep;
      const isEven = i % 2 === 0;

      // --- Outer single (170-180px) ---
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R, a1, a2);
      ctx.closePath();
      ctx.fillStyle = isEven ? '#1a1a1a' : '#e8e0c8';
      ctx.fill();

      // --- Double ring (155-170px) ---
      ctx.beginPath();
      ctx.arc(cx, cy, R*0.958, a1, a2);
      ctx.arc(cx, cy, R*0.861, a2, a1, true);
      ctx.closePath();
      ctx.fillStyle = isEven ? '#27AE60' : '#E74C3C';
      ctx.fill();

      // --- Inner single (95-155px) ---
      ctx.beginPath();
      ctx.arc(cx, cy, R*0.861, a1, a2);
      ctx.arc(cx, cy, R*0.528, a2, a1, true);
      ctx.closePath();
      ctx.fillStyle = isEven ? '#1a1a1a' : '#e8e0c8';
      ctx.fill();

      // --- Triple ring (82-95px) ---
      ctx.beginPath();
      ctx.arc(cx, cy, R*0.528, a1, a2);
      ctx.arc(cx, cy, R*0.458, a2, a1, true);
      ctx.closePath();
      ctx.fillStyle = isEven ? '#27AE60' : '#E74C3C';
      ctx.fill();

      // --- Inner bull area single (45-82px) ---
      ctx.beginPath();
      ctx.arc(cx, cy, R*0.458, a1, a2);
      ctx.arc(cx, cy, R*0.25, a2, a1, true);
      ctx.closePath();
      ctx.fillStyle = isEven ? '#1a1a1a' : '#e8e0c8';
      ctx.fill();

      // Sector numbers
      const numAngle = startOffset + (i + 0.5) * angleStep;
      const numR = R * 0.93;
      const nx = cx + Math.cos(numAngle) * numR;
      const ny = cy + Math.sin(numAngle) * numR;
      ctx.save();
      ctx.translate(nx, ny);
      ctx.fillStyle = isEven ? 'white' : '#1a1a1a';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sectors[i].toString(), 0, 0);
      ctx.restore();
    }

    // Bull (outer: 25pt, inner: 50pt)
    ctx.beginPath();
    ctx.arc(cx, cy, R*0.25, 0, Math.PI*2);
    ctx.fillStyle = '#27AE60';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, R*0.14, 0, Math.PI*2);
    ctx.fillStyle = '#E74C3C';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, R*0.06, 0, Math.PI*2);
    ctx.fillStyle = '#2C3E50';
    ctx.fill();

    // Board border ring
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI*2);
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Draw existing darts
    c.darts.forEach(d => {
      ctx.beginPath();
      ctx.arc(d.px, d.py, 5, 0, Math.PI*2);
      ctx.fillStyle = '#FFD700';
      ctx.fill();
      ctx.strokeStyle = '#8B6914';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Dart pin
      ctx.beginPath();
      ctx.moveTo(d.px, d.py);
      ctx.lineTo(d.px, d.py - 14);
      ctx.strokeStyle = '#C0392B';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  },

  _aim(e) {
    const canvas = document.getElementById('dart-canvas');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = canvas.width/2, cy = canvas.height/2;
    const px = (e.clientX - rect.left) * (canvas.width / rect.width);
    const py = (e.clientY - rect.top) * (canvas.height / rect.height);
    // Draw crosshair
    this._drawBoard();
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, Math.PI*2);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(px-14, py); ctx.lineTo(px+14, py);
    ctx.moveTo(px, py-14); ctx.lineTo(px, py+14);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
  },

  _throw(e) {
    const c = this.current;
    if (c.throwing || c.throws >= c.maxThrows) return;
    c.throwing = true;

    const canvas = document.getElementById('dart-canvas');
    const rect = canvas.getBoundingClientRect();
    const W = canvas.width, H = canvas.height;
    const cx = W/2, cy = H/2, R = W/2 - 4;

    // Click position relative to center
    const px = (e.clientX - rect.left) * (W / rect.width);
    const py = (e.clientY - rect.top) * (H / rect.height);
    const dx = (px - cx) / R; // -1 to 1
    const dy = (py - cy) / R;

    // Apply wind deviation
    const windRad = (c.wind.angle * Math.PI) / 180;
    const windPush = c.wind.strength * 0.08;
    const finalDx = dx + Math.cos(windRad) * windPush + (Math.random()-0.5)*0.04;
    const finalDy = dy + Math.sin(windRad) * windPush + (Math.random()-0.5)*0.04;

    const dist = Math.sqrt(finalDx*finalDx + finalDy*finalDy);
    const finalPx = cx + finalDx * R;
    const finalPy = cy + finalDy * R;

    // Calculate score
    const { pts, label } = this._calcScore(finalDx, finalDy, dist);
    if (pts === 0) c.errors++;
    c.totalScore += pts;
    c.throws++;
    c.scores.push({ pts, label });
    c.darts.push({ px: finalPx, py: finalPy, pts });

    // Flash score
    const flash = document.createElement('div');
    const flCol = pts >= 50 ? '#8E44AD' : pts >= 40 ? '#27AE60' : pts > 0 ? '#F39C12' : '#E74C3C';
    flash.style.cssText = `position:fixed;top:35%;left:50%;transform:translate(-50%,-50%);
      font-family:'Fredoka One',cursive;font-size:2rem;color:${flCol};
      text-shadow:0 2px 8px rgba(0,0,0,0.4);pointer-events:none;z-index:999;animation:popIn 0.3s ease`;
    flash.textContent = pts > 0 ? (label || `+${pts}!`) : '❌ Daneben!';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 900);

    this._drawBoard();

    setTimeout(() => {
      c.throwing = false;
      if (c.throws >= c.maxThrows) { this._showResult(); }
      else { this._render(); }
    }, 700);
  },

  _calcScore(dx, dy, dist) {
    // Bullseye
    if (dist < 0.06)  return { pts: 50, label: '🎯 Bullseye!' };
    if (dist < 0.14)  return { pts: 25, label: '🟢 Bull 25' };
    if (dist > 1.0)   return { pts: 0,  label: null };

    // Find sector
    const angle = Math.atan2(dy, dx); // -PI to PI
    // Normalize to 0-2PI starting from top
    let normalizedAngle = angle + Math.PI/2;
    if (normalizedAngle < 0) normalizedAngle += 2*Math.PI;
    const sectorIndex = Math.floor((normalizedAngle / (2*Math.PI)) * 20) % 20;
    const sectorValue = this.SECTORS[sectorIndex];

    // Determine ring
    if (dist < 0.25)  return { pts: sectorValue,      label: `${sectorValue}` };
    if (dist < 0.46)  return { pts: sectorValue * 3,  label: `T${sectorValue} (×3)` }; // Triple
    if (dist < 0.53)  return { pts: sectorValue,      label: `${sectorValue}` };
    if (dist < 0.86)  return { pts: sectorValue,      label: `${sectorValue}` };
    if (dist < 0.96)  return { pts: sectorValue * 2,  label: `D${sectorValue} (×2)` }; // Double
    if (dist <= 1.0)  return { pts: sectorValue,      label: `${sectorValue}` };
    return { pts: 0, label: null };
  },

  _updateWindVane() {
    const c = this.current;
    if (!c) return;
    const arrow = document.getElementById('wind-arrow');
    if (arrow) arrow.setAttribute('transform', `rotate(${c.wind.angle}, 25, 25)`);
    const vane = document.getElementById('wind-vane');
    if (vane) {
      const g = vane.querySelector('#wind-arrow');
      if (g) g.setAttribute('transform', `rotate(${c.wind.angle}, 25, 25)`);
    }
    // Update wind text
    const parent = document.querySelector('[style*="Ändert sich jede Sekunde"]')?.closest('div[style*="display:flex"]');
    if (parent) {
      const spans = parent.querySelectorAll('div');
      if (spans[1]) {
        spans[1].children[0].textContent = c.wind.name;
        spans[1].children[1].textContent = `Stärke: ${'●'.repeat(Math.ceil(c.wind.strength))}${'○'.repeat(3-Math.ceil(c.wind.strength))} — ${Math.round(c.wind.angle)}°`;
      }
    }
  },

  _showResult() {
    clearInterval(this._windTick);
    const c = this.current;
    const timeMs = Date.now()-c.startTime;
    const passed = c.totalScore >= 400;
    const rawScore = Math.min(100, Math.round((c.totalScore/400)*80)+(passed?20:0));
    const finalScore = State.calcFinalScore({rawScore,timeMs,errors:c.errors,passed});

    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center;padding:20px 0">
        <div style="font-size:3rem">${passed?'🎯🏆':'🎯😅'}</div>
        <div style="font-family:'Fredoka One',cursive;font-size:1.7rem;color:var(--mountain-dark);margin:10px 0">
          ${c.totalScore} Punkte!
        </div>
        <div style="color:var(--text-mid);margin-bottom:12px">
          ${passed?'Ziel von 400 erreicht! 🎉':`${400-c.totalScore} Punkte gefehlt...`}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:12px 0">
          <div style="background:#F0F9FF;border-radius:10px;padding:10px;font-size:0.8rem">
            <div style="font-size:1.2rem">🎯</div><b>${c.totalScore}</b><br><span style="color:var(--text-mid)">Punkte</span></div>
          <div style="background:#FFF5F5;border-radius:10px;padding:10px;font-size:0.8rem">
            <div style="font-size:1.2rem">❌</div><b>${c.errors}</b><br><span style="color:var(--text-mid)">Daneben</span></div>
          <div style="background:#FFFFF0;border-radius:10px;padding:10px;font-size:0.8rem">
            <div style="font-size:1.2rem">⭐</div><b>${finalScore}</b><br><span style="color:var(--text-mid)">Score</span></div>
        </div>
        ${!passed?`<button class="btn btn-secondary btn-full" style="margin-bottom:10px" onclick="DartGame.start(DartGame._lastConfig)">🔄 Nochmal</button>`:''}
        <button class="btn btn-primary btn-full" onclick="DartGame._finish(${finalScore},${timeMs},${c.errors})">Weiter ➜</button>
      </div>`;
  },

  _finish(s,t,e) {
    clearInterval(this._windTick);
    if(this.current?.onComplete) this.current.onComplete({rawScore:s,timeMs:t,errors:e,passed:s>=30});
  },
};

window.DartGame = DartGame;
