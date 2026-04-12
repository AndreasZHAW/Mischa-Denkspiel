/**
 * games/dart.js — Dart mit Wind
 * 10 Würfe, Ziel: 400+ Punkte
 * Wind kommt von 4 Richtungen und lenkt den Pfeil ab
 */
const DartGame = {
  current: null, _lastConfig: null,
  start(config) {
    DartGame._lastConfig = config;
    this.current = {
      throws: 0, maxThrows: 10, totalScore: 0,
      scores: [], errors: 0, startTime: Date.now(),
      wind: this._newWind(), throwing: false, onComplete: config.onComplete,
    };
    this._render();
  },
  _newWind() {
    const dirs = [
      { label:'← Wind von links',  dx:1, dy:0, icon:'⬅️' },
      { label:'→ Wind von rechts', dx:-1, dy:0, icon:'➡️' },
      { label:'↑ Wind von oben',   dx:0, dy:1, icon:'⬆️' },
      { label:'↓ Wind von unten',  dx:0, dy:-1, icon:'⬇️' },
    ];
    const d = dirs[Math.floor(Math.random()*dirs.length)];
    const strength = Math.floor(Math.random()*3)+1; // 1-3
    return { ...d, strength };
  },
  _render() {
    const c = this.current;
    const total = c.totalScore;
    const need = Math.max(0, 400 - total);
    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center">
        <div style="display:flex;justify-content:space-between;font-size:0.82rem;color:var(--text-mid);margin-bottom:8px">
          <span>Wurf <b>${c.throws}/${c.maxThrows}</b></span>
          <span>Punkte: <b style="color:${total>=400?'#27AE60':'var(--text-dark)'}">${total}</b>/400</span>
          <span>${need>0?`Noch ${need} nötig`:'🎯 Geschafft!'}</span>
        </div>
        <!-- Progress -->
        <div style="background:#E8F5E9;border-radius:50px;height:10px;margin-bottom:12px;overflow:hidden">
          <div style="height:100%;background:linear-gradient(90deg,#E74C3C,#27AE60);border-radius:50px;width:${Math.min(100,(total/400)*100)}%;transition:width 0.4s"></div>
        </div>
        <!-- Wind indicator -->
        <div style="background:linear-gradient(135deg,#EBF5FB,#D6EAF8);border-radius:12px;padding:10px;margin-bottom:10px;font-size:0.88rem">
          <b>💨 Wind:</b> ${c.wind.icon} ${c.wind.label} — Stärke: ${'●'.repeat(c.wind.strength)}${'○'.repeat(3-c.wind.strength)}
          <br><span style="font-size:0.75rem;color:var(--text-mid)">Kompensiere den Wind beim Zielen!</span>
        </div>
        <!-- Dartboard -->
        <div style="position:relative;width:240px;height:240px;margin:0 auto 14px;cursor:crosshair" id="dart-board"
          onclick="DartGame._throw(event)">
          <svg viewBox="-120 -120 240 240" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
            <!-- Rings from outside in -->
            <circle r="110" fill="#1a1a1a"/>
            <circle r="105" fill="#27AE60"/><text y="4" text-anchor="middle" font-size="7" fill="white" transform="translate(0,-95)">25</text>
            <circle r="90" fill="#E74C3C"/><circle r="75" fill="#1a1a1a"/>
            <!-- Score rings -->
            ${[70,55,40,25,12].map((r,i)=>{
              const col = i%2===0?'#E74C3C':'#27AE60';
              const pts = [50,40,30,20,10][i];
              return `<circle r="${r}" fill="${col}"/><text y="4" text-anchor="middle" font-size="${i===4?10:7}" fill="white" transform="translate(0,-${r-8})">${pts}</text>`;
            }).join('')}
            <!-- Bull -->
            <circle r="8" fill="#1a1a1a"/>
            <circle r="4" fill="#E74C3C"/>
            <!-- Aim lines -->
            <line x1="-110" y1="0" x2="110" y2="0" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/>
            <line x1="0" y1="-110" x2="0" y2="110" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/>
            <!-- Previous throws -->
            ${c.scores.map(s=>s.hit?`<circle cx="${s.ax}" cy="${s.ay}" r="4" fill="#FFD700" opacity="0.7"/>`:``).join('')}
          </svg>
          <!-- Crosshair -->
          <div id="dart-aim" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
            width:20px;height:20px;border:2px solid rgba(255,255,255,0.6);border-radius:50%;pointer-events:none">
            <div style="position:absolute;top:50%;left:50%;width:4px;height:4px;background:white;border-radius:50%;transform:translate(-50%,-50%)"></div>
          </div>
        </div>
        <!-- Scores row -->
        <div style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap;margin-bottom:10px">
          ${c.scores.map(s=>`
            <div style="width:28px;height:28px;border-radius:8px;background:${s.hit?'#27AE60':'#E74C3C'};
              color:white;font-size:0.65rem;font-weight:700;display:flex;align-items:center;justify-content:center">
              ${s.hit?s.points:'✗'}
            </div>`).join('')}
          ${Array.from({length:c.maxThrows-c.throws},(_,i)=>`
            <div style="width:28px;height:28px;border-radius:8px;background:#E0E6EE;"></div>`).join('')}
        </div>
        <div style="font-size:0.82rem;color:var(--text-mid)">🎯 Tippe auf die Dartscheibe um zu werfen!</div>
      </div>`;
    // Mousemove = aim
    const board = document.getElementById('dart-board');
    if (board) {
      board.addEventListener('mousemove', e => {
        const r = board.getBoundingClientRect();
        const aim = document.getElementById('dart-aim');
        if (aim) { aim.style.left = (e.clientX-r.left)+'px'; aim.style.top = (e.clientY-r.top)+'px'; }
      });
    }
  },
  _throw(e) {
    const c = this.current;
    if (c.throwing || c.throws >= c.maxThrows) return;
    c.throwing = true;
    const board = document.getElementById('dart-board');
    const r = board.getBoundingClientRect();
    const cx = r.width/2, cy = r.height/2;
    // Click position relative to center (-1 to 1)
    const clickX = (e.clientX - r.left - cx) / cx;
    const clickY = (e.clientY - r.top - cy) / cy;
    // Apply wind
    const windMult = c.wind.strength * 0.12;
    const ax = clickX + c.wind.dx * windMult + (Math.random()-0.5)*0.08;
    const ay = clickY + c.wind.dy * windMult + (Math.random()-0.5)*0.08;
    // Distance from center (0=bullseye, 1=edge)
    const dist = Math.sqrt(ax*ax + ay*ay);
    // Score based on distance
    let points = 0, hit = true;
    if (dist > 1.0)       { points = 0; hit = false; }
    else if (dist < 0.04) { points = 50; }
    else if (dist < 0.11) { points = 40; }
    else if (dist < 0.24) { points = 30; }
    else if (dist < 0.38) { points = 20; }
    else if (dist < 0.52) { points = 10; }
    else if (dist < 0.68) { points = 5; }
    else if (dist < 0.85) { points = 2; }
    else                  { points = 1; }
    if (!hit) c.errors++;
    c.totalScore += points;
    c.throws++;
    c.scores.push({ points, hit, ax: ax*110, ay: ay*110 });
    c.wind = this._newWind();
    // Flash result
    const msg = document.createElement('div');
    msg.style.cssText = `position:fixed;top:40%;left:50%;transform:translate(-50%,-50%);
      font-family:'Fredoka One',cursive;font-size:2rem;color:${hit?'#27AE60':'#E74C3C'};
      text-shadow:0 2px 8px rgba(0,0,0,0.3);pointer-events:none;z-index:999;
      animation:popIn 0.3s ease`;
    msg.textContent = hit ? `+${points}!` : '❌ Daneben!';
    document.body.appendChild(msg);
    setTimeout(()=>msg.remove(),700);
    setTimeout(()=>{ c.throwing=false; if(c.throws>=c.maxThrows) this._showResult(); else this._render(); }, 600);
  },
  _showResult() {
    const c = this.current;
    const timeMs = Date.now()-c.startTime;
    const passed = c.totalScore >= 400;
    const rawScore = Math.min(100, Math.round((c.totalScore/400)*80) + (passed?20:0));
    const finalScore = State.calcFinalScore({rawScore,timeMs,errors:c.errors,passed});
    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center;padding:20px 0">
        <div style="font-size:3rem">${passed?'🎯🏆':'🎯😅'}</div>
        <div style="font-family:'Fredoka One',cursive;font-size:1.7rem;color:var(--mountain-dark);margin:10px 0">
          ${c.totalScore} Punkte!</div>
        <div style="color:var(--text-mid);margin-bottom:12px">${passed?'Ziel von 400 Punkten erreicht! 🎉':'Knapp daneben — ${400-c.totalScore} Punkte gefehlt.'}</div>
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
  _finish(s,t,e){ if(this.current?.onComplete) this.current.onComplete({rawScore:s,timeMs:t,errors:e,passed:s>=30}); }
};
window.DartGame = DartGame;
