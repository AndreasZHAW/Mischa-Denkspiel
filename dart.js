/**
 * dart.js v5
 * - Wind: alle 3-4s ändert sich, klarer Windsack + Kompass + Kraftanzeige
 * - Atmung: Fadenkreuz atmet, aber Spieler kann mit Maus/Finger ÜBERSTEUERN
 * - Das Fadenkreuz folgt exakt Maus/Finger + Atemoffset obendrauf
 */
const DartGame = {
  current: null,
  _lastConfig: null,
  _windTick: null,
  _breathTick: null,
  _animFrame: null,

  SECTORS: [20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5],

  start(config) {
    DartGame._lastConfig = config;
    const c = {
      player: { score:301, roundDarts:[] },
      cpu:    { score:301, roundDarts:[] },
      turn: 'player', dartsThisRound: 0,
      wind: this._newWind(),
      gameOver: false, winner: null,
      startTime: Date.now(), errors: 0,
      onComplete: config.onComplete,
      // Breathing: gentle oval offset on top of mouse aim
      breath: { phase: 0, ox: 0, oy: 0 },
      // Aim: actual mouse/touch position on canvas (canvas coords)
      aimCx: 135, aimCy: 135,
      // Whether player has moved the mouse yet
      playerAiming: false,
    };
    DartGame.current = c;
    this._render();

    // Wind changes every 3-4 seconds (slower, more readable)
    const windDelay = () => 3000 + Math.random() * 1000;
    const scheduleWind = () => {
      this._windTick = setTimeout(() => {
        if (this.current && !this.current.gameOver) {
          this.current.wind = this._newWind();
          this._refreshWindDisplay();
          scheduleWind();
        }
      }, windDelay());
    };
    scheduleWind();

    // Breathing animation (30fps) — only offset, mouse overrides
    this._breathTick = setInterval(() => {
      if (!this.current || this.current.gameOver) return;
      const b = this.current.breath;
      b.phase += 0.018; // slow breathing
      b.ox = Math.cos(b.phase * 0.7) * 12;
      b.oy = Math.sin(b.phase) * 18;
      this._updateCrosshair();
    }, 33);
  },

  _newWind() {
    const angle = Math.random() * 360;
    const strength = Math.random() * 3.5;
    const names = ['Windstill','Leichte Brise','Mäßig','Stark','Sturm'];
    const ni = Math.min(4, Math.floor(strength / 0.7));
    return { angle, strength, name: names[ni] };
  },

  _render() {
    const c = this.current;
    const isP = c.turn === 'player';
    document.getElementById('game-area').innerHTML = `
<div style="max-width:320px;margin:0 auto;padding:0 4px">
  <!-- Score board -->
  <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:6px;margin-bottom:8px">
    <div style="background:${isP?'linear-gradient(135deg,#2980B9,#1a5a8a)':'rgba(255,255,255,.5)'};border-radius:12px;padding:8px;text-align:center">
      <div style="font-size:.68rem;color:${isP?'rgba(255,255,255,.7)':'var(--text-mid)'}">👤 Du</div>
      <div style="font-family:'Fredoka One',cursive;font-size:2rem;color:${isP?'white':'var(--text-dark)'}">${c.player.score}</div>
      <div style="font-size:.62rem;color:${isP?'rgba(255,255,255,.6)':'var(--text-mid)'}">${isP?`Pfeil ${c.dartsThisRound+1}/3`:'warte...'}</div>
    </div>
    <div style="font-family:'Fredoka One',cursive;font-size:.85rem;color:var(--text-mid);align-self:center">VS</div>
    <div style="background:${!isP?'linear-gradient(135deg,#c0392b,#7b0000)':'rgba(255,255,255,.5)'};border-radius:12px;padding:8px;text-align:center">
      <div style="font-size:.68rem;color:${!isP?'rgba(255,255,255,.7)':'var(--text-mid)'}">🤖 CPU</div>
      <div style="font-family:'Fredoka One',cursive;font-size:2rem;color:${!isP?'white':'var(--text-dark)'}">${c.cpu.score}</div>
      <div style="font-size:.62rem;color:${!isP?'rgba(255,255,255,.6)':'var(--text-mid)'}">301 Double-Out</div>
    </div>
  </div>

  ${c.player.score<=40||c.cpu.score<=40?`<div style="background:rgba(231,76,60,.12);border:1px solid rgba(231,76,60,.3);border-radius:8px;padding:4px 10px;margin-bottom:6px;font-size:.72rem;color:#E74C3C;font-weight:700;text-align:center">⚠️ Double-Out! Letzter Pfeil muss Double oder Bull treffen!</div>`:''}

  <!-- WIND PANEL -->
  <div id="dart-wind-panel" style="background:#EBF5FB;border-radius:12px;padding:8px 10px;margin-bottom:8px;display:flex;align-items:center;gap:8px">
    <!-- Compass rose -->
    <svg id="dart-compass" width="52" height="52" viewBox="0 0 52 52" style="flex-shrink:0">
      <circle cx="26" cy="26" r="24" fill="white" stroke="#BDC3C7" stroke-width="1.5"/>
      <!-- Cardinal marks -->
      <text x="26" y="9" text-anchor="middle" font-size="7" font-weight="700" fill="#2C3E50">N</text>
      <text x="45" y="30" text-anchor="middle" font-size="6" fill="#95A5A6">O</text>
      <text x="26" y="47" text-anchor="middle" font-size="6" fill="#95A5A6">S</text>
      <text x="7" y="30" text-anchor="middle" font-size="6" fill="#95A5A6">W</text>
      <!-- Tick marks at 45° -->
      ${[45,135,225,315].map(a=>`<line x1="${26+20*Math.cos((a-90)*Math.PI/180)}" y1="${26+20*Math.sin((a-90)*Math.PI/180)}" x2="${26+23*Math.cos((a-90)*Math.PI/180)}" y2="${26+23*Math.sin((a-90)*Math.PI/180)}" stroke="#BDC3C7" stroke-width="1"/>`).join('')}
      <!-- Wind arrow -->
      <g id="dart-arrow" transform="rotate(${c.wind.angle},26,26)">
        <polygon points="26,6 23,22 26,19 29,22" fill="#E74C3C"/>
        <polygon points="26,46 23,30 26,33 29,30" fill="#95A5A6"/>
      </g>
      <circle cx="26" cy="26" r="3" fill="#2C3E50"/>
    </svg>

    <!-- Windsock -->
    <svg id="dart-windsock" width="62" height="38" viewBox="0 0 62 38" style="flex-shrink:0">
      ${this._windsockSVG(c.wind.strength)}
    </svg>

    <!-- Wind info text -->
    <div style="flex:1;min-width:0">
      <div style="font-size:.82rem;font-weight:700;color:var(--text-dark)">${c.wind.name}</div>
      <div style="font-size:.68rem;color:var(--text-mid)">Richtung: ${Math.round(c.wind.angle)}°</div>
      <!-- Strength bar -->
      <div style="background:#ddd;border-radius:50px;height:5px;margin-top:3px;overflow:hidden">
        <div style="background:${c.wind.strength<1.2?'#27AE60':c.wind.strength<2.5?'#F39C12':'#E74C3C'};height:100%;border-radius:50px;transition:width .5s;width:${Math.min(100,c.wind.strength/3.5*100)}%"></div>
      </div>
      <div style="font-size:.62rem;color:var(--text-mid);margin-top:1px">Stärke: ${c.wind.strength.toFixed(1)}/3.5 — ändert sich alle 3-4s</div>
    </div>
  </div>

  <!-- Dartboard + crosshair overlay -->
  <div style="position:relative;display:inline-block;width:270px;height:270px;margin-bottom:6px;cursor:crosshair" id="dart-wrap">
    <canvas id="dart-canvas" width="270" height="270"
      style="border-radius:50%;display:block;box-shadow:0 6px 20px rgba(0,0,0,.25);touch-action:none"></canvas>
    <!-- SVG crosshair overlay — follows mouse + breath -->
    <svg id="dart-overlay" width="270" height="270"
      style="position:absolute;top:0;left:0;pointer-events:none;border-radius:50%;overflow:hidden">
      <g id="dart-xhair">
        <!-- Outer rings for aiming context -->
        <circle id="xhair-ring" cx="135" cy="135" r="22" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="1" stroke-dasharray="4,4"/>
        <!-- Cross lines -->
        <line id="xl1" x1="115" y1="135" x2="124" y2="135" stroke="rgba(255,255,255,.85)" stroke-width="1.8"/>
        <line id="xl2" x1="146" y1="135" x2="155" y2="135" stroke="rgba(255,255,255,.85)" stroke-width="1.8"/>
        <line id="xl3" x1="135" y1="115" x2="135" y2="124" stroke="rgba(255,255,255,.85)" stroke-width="1.8"/>
        <line id="xl4" x1="135" y1="146" x2="135" y2="155" stroke="rgba(255,255,255,.85)" stroke-width="1.8"/>
        <!-- Center dot -->
        <circle id="xdot" cx="135" cy="135" r="2.5" fill="rgba(255,60,60,.95)"/>
        <!-- Wind indicator arrow on crosshair -->
        <line id="xwind" x1="135" y1="135" x2="135" y2="135" stroke="rgba(100,200,255,.7)" stroke-width="2" marker-end="url(#arrowhead)" stroke-dasharray="3,2"/>
      </g>
      <defs>
        <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="3" refY="2" orient="auto">
          <polygon points="0 0, 6 2, 0 4" fill="rgba(100,200,255,.8)"/>
        </marker>
      </defs>
    </svg>
  </div>

  <!-- Last throws row -->
  <div style="display:flex;gap:3px;justify-content:center;min-height:24px;margin-bottom:6px;flex-wrap:wrap">
    ${c.player.roundDarts.map(d=>`<div style="padding:2px 6px;border-radius:6px;background:${d.pts>0?'#3498DB':'#E74C3C'};color:white;font-size:.68rem;font-weight:700">${d.label}</div>`).join('')}
    ${c.cpu.roundDarts.map(d=>`<div style="padding:2px 6px;border-radius:6px;background:rgba(231,76,60,.25);color:var(--text-dark);font-size:.68rem">🤖 ${d.label}</div>`).join('')}
  </div>

  <!-- Instruction -->
  <div style="text-align:center;font-size:.75rem;color:var(--text-mid);padding:0 8px">
    ${isP?'🖱️ Bewege Maus/Finger zum Zielen — Klick/Tippe zum Werfen!<br><span style="font-size:.65rem;color:#E74C3C">Atmung verschiebt Fadenkreuz — ziele aktiv gegen!</span>':'<span style="font-family:\'Fredoka One\',cursive;color:#E74C3C">🤖 CPU wirft...</span>'}
  </div>
</div>`;

    this._drawBoard();
    this._setupPointerEvents();
    this._updateCrosshair();

    if (!isP && !c.gameOver) {
      setTimeout(() => this._cpuRound(), 900);
    }
  },

  _windsockSVG(strength) {
    // strength 0-3.5, lift = 0-1
    const lift = Math.min(1, strength / 3.5);
    const n = 5; // segments
    // Pole (vertical)
    const poleX = 8, poleTop = 4, poleBot = 34;
    let svg = `<line x1="${poleX}" y1="${poleTop}" x2="${poleX}" y2="${poleBot}" stroke="#888" stroke-width="2.5" stroke-linecap="round"/>`;
    // Attachment ring
    svg += `<circle cx="${poleX}" cy="${poleTop+4}" r="2.5" fill="#999"/>`;
    // Sock segments (trapezoids that lift with wind)
    const attachY = poleTop + 4;
    const baseW = 11, tipW = 3;
    const sockLen = 44 + lift * 6;
    const liftY = lift * -10; // tip rises
    const colors = ['#E74C3C','#fff','#E74C3C','#fff','#E74C3C'];
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 1) / n;
      const x0 = poleX + t0 * sockLen;
      const x1 = poleX + t1 * sockLen;
      const y0 = attachY + t0 * liftY;
      const y1 = attachY + t1 * liftY;
      const w0 = baseW - (baseW - tipW) * t0;
      const w1 = baseW - (baseW - tipW) * t1;
      // Small wave droop on each segment (less when windy)
      const droop = (1 - lift) * 3 * Math.sin(Math.PI * ((t0 + t1) / 2));
      svg += `<polygon points="${x0},${y0-w0/2} ${x1},${y1-w1/2+droop} ${x1},${y1+w1/2+droop} ${x0},${y0+w0/2}"
        fill="${colors[i]}" stroke="rgba(0,0,0,.08)" stroke-width=".5" opacity="${.75+.25*lift}"/>`;
    }
    // Tip ring
    const tipX = poleX + sockLen;
    const tipY = attachY + liftY;
    svg += `<ellipse cx="${tipX}" cy="${tipY}" rx="1.5" ry="${tipW/2}" fill="#aaa"/>`;
    return svg;
  },

  _setupPointerEvents() {
    const wrap = document.getElementById('dart-wrap');
    const canvas = document.getElementById('dart-canvas');
    if (!wrap || !canvas) return;
    const c = this.current;

    const getPos = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      return {
        cx: (clientX - rect.left) * (270 / rect.width),
        cy: (clientY - rect.top) * (270 / rect.height),
      };
    };

    const onMove = (e) => {
      if (!c || c.gameOver || c.turn !== 'player') return;
      const {cx, cy} = getPos(
        e.clientX ?? e.touches?.[0]?.clientX,
        e.clientY ?? e.touches?.[0]?.clientY
      );
      c.aimCx = cx;
      c.aimCy = cy;
      c.playerAiming = true;
      this._updateCrosshair();
    };

    const onThrow = (e) => {
      if (!c || c.gameOver || c.turn !== 'player') return;
      e.preventDefault();
      // Final aim = mouse pos + breath offset
      const bx = c.breath.ox;
      const by = c.breath.oy;
      const finalCx = c.aimCx + bx;
      const finalCy = c.aimCy + by;
      this._throwAt(finalCx, finalCy);
    };

    wrap.addEventListener('mousemove', onMove);
    wrap.addEventListener('touchmove', e => { e.preventDefault(); onMove(e); }, { passive: false });
    wrap.addEventListener('click', onThrow);
    wrap.addEventListener('touchend', onThrow, { passive: false });
  },

  _updateCrosshair() {
    const c = this.current;
    if (!c) return;
    const xhair = document.getElementById('dart-xhair');
    if (!xhair) return;

    const bx = c.breath.ox;
    const by = c.breath.oy;
    const cx = c.aimCx + bx;
    const cy = c.aimCy + by;

    // Move all crosshair elements
    const offset = 19; // gap from center to line end
    const gap = 11;    // gap around center

    const setLine = (id, x1,y1,x2,y2) => {
      const el = document.getElementById(id);
      if(el){el.setAttribute('x1',x1);el.setAttribute('y1',y1);el.setAttribute('x2',x2);el.setAttribute('y2',y2);}
    };
    setLine('xl1', cx-offset, cy, cx-gap, cy);
    setLine('xl2', cx+gap,    cy, cx+offset, cy);
    setLine('xl3', cx, cy-offset, cx, cy-gap);
    setLine('xl4', cx, cy+gap,    cx, cy+offset);

    const dot = document.getElementById('xdot');
    if(dot){dot.setAttribute('cx',cx);dot.setAttribute('cy',cy);}

    const ring = document.getElementById('xhair-ring');
    if(ring){ring.setAttribute('cx',cx);ring.setAttribute('cy',cy);}

    // Wind arrow on crosshair — shows where wind pushes dart
    const w = c.wind;
    const wr = (w.angle * Math.PI) / 180;
    const windLen = w.strength * 8;
    const wxEnd = cx + Math.sin(wr) * windLen;
    const wyEnd = cy + Math.cos(wr) * windLen;
    const xwind = document.getElementById('xwind');
    if(xwind){
      xwind.setAttribute('x1', cx); xwind.setAttribute('y1', cy);
      xwind.setAttribute('x2', wxEnd); xwind.setAttribute('y2', wyEnd);
    }
  },

  _refreshWindDisplay() {
    const c = this.current; if (!c) return;
    // Update compass arrow
    const arrow = document.getElementById('dart-arrow');
    if (arrow) arrow.setAttribute('transform', `rotate(${c.wind.angle},26,26)`);
    // Update windsock
    const sock = document.getElementById('dart-windsock');
    if (sock) sock.innerHTML = this._windsockSVG(c.wind.strength);
    // Update info text
    const panel = document.getElementById('dart-wind-panel');
    if (panel) {
      // Replace just the text elements
      const spans = panel.querySelectorAll('div > div');
      if (spans[0]) spans[0].textContent = c.wind.name;
      if (spans[1]) spans[1].textContent = `Richtung: ${Math.round(c.wind.angle)}°`;
      if (spans[3]) spans[3].textContent = `Stärke: ${c.wind.strength.toFixed(1)}/3.5 — ändert sich alle 3-4s`;
      // Update bar
      const bar = panel.querySelector('[style*="border-radius:50px;height:5px"]');
      const fill = bar?.querySelector('[style*="height:100%"]');
      if (fill) {
        fill.style.width = Math.min(100, c.wind.strength / 3.5 * 100) + '%';
        fill.style.background = c.wind.strength<1.2?'#27AE60':c.wind.strength<2.5?'#F39C12':'#E74C3C';
      }
    }
  },

  _throwAt(finalCx, finalCy) {
    const c = this.current;
    const R = 135, cx0 = 135, cy0 = 135;
    // Add wind displacement to final position
    const wr = (c.wind.angle * Math.PI) / 180;
    const wp = c.wind.strength * 0.05;
    const fdx = (finalCx - cx0) / R + Math.sin(wr) * wp + (Math.random() - .5) * 0.03;
    const fdy = (finalCy - cy0) / R + Math.cos(wr) * wp + (Math.random() - .5) * 0.03;
    const dist = Math.sqrt(fdx*fdx + fdy*fdy);
    const fpx = cx0 + fdx * R;
    const fpy = cy0 + fdy * R;
    const result = this._calcScore(fdx, fdy, dist);
    this._applyThrow('player', result, fpx, fpy);
  },

  _calcScore(dx, dy, dist) {
    if (dist < 0.045) return { pts:50, label:'🎯 Bull!',  isDouble:false, isBull:true };
    if (dist < 0.115) return { pts:25, label:'Bull 25', isDouble:false, isBull:false };
    if (dist > 1.0)   return { pts:0,  label:'❌ Daneben',isDouble:false, isBull:false };
    // Board: sector 0 (value=20) is centered at top (-PI/2 in canvas = theta=0 clockwise)
    // The draw uses off = -PI/2 - step/2 as START of sector 0
    // so sector 0 spans [-step/2, +step/2] around top
    // Add step/2 offset so sector boundaries match the visual drawing exactly
    const step = (2 * Math.PI) / 20;
    let ang = Math.atan2(dy, dx) + Math.PI/2 + step/2;
    if (ang < 0) ang += 2*Math.PI;
    if (ang >= 2*Math.PI) ang -= 2*Math.PI;
    const si = Math.floor((ang / (2*Math.PI)) * 20) % 20;
    const sv = this.SECTORS[si];
    // Ring boundaries (as fraction of board radius R=130)
    // Bull: <0.045R, Bull25: <0.115R, inner triple: 0.24-0.455, outer single: 0.455-0.86, double: 0.86-0.955
    if (dist < 0.24)  return { pts:sv,   label:`${sv}`,   isDouble:false, isBull:false };
    if (dist < 0.455) return { pts:sv*3, label:`T${sv}`,  isDouble:false, isBull:false };
    if (dist < 0.86)  return { pts:sv,   label:`${sv}`,   isDouble:false, isBull:false };
    if (dist < 0.955) return { pts:sv*2, label:`D${sv}`,  isDouble:true,  isBull:false };
    return { pts:sv, label:`${sv}`, isDouble:false, isBull:false };
  },

  _applyThrow(who, result, fpx, fpy) {
    const c = this.current;
    const p = c[who];
    let {pts, label, isDouble, isBull} = result;
    let bust = false;
    const would = p.score - pts;
    if (would < 0)                          { bust=true; pts=0; label='Bust!'; }
    else if (would===0 && !isDouble&&!isBull){ bust=true; pts=0; label='Kein Double!'; }
    else if (would===1)                     { bust=true; pts=0; label='Bust!'; }
    if (!bust) p.score -= pts;
    if (bust||pts===0) c.errors++;
    p.roundDarts.push({ pts, label, owner:who, px:fpx, py:fpy });
    c.dartsThisRound++;

    // Score flash
    const fl = document.createElement('div');
    fl.style.cssText = `position:fixed;top:26%;left:50%;transform:translate(-50%,-50%);font-family:'Fredoka One',cursive;font-size:2rem;color:${pts>0?'#3498DB':'#E74C3C'};text-shadow:0 2px 8px rgba(0,0,0,.4);pointer-events:none;z-index:999;animation:popIn .3s ease`;
    fl.textContent = pts > 0 ? label : `❌ ${label}`;
    document.body.appendChild(fl);
    setTimeout(() => fl.remove(), 900);

    this._drawBoard();

    if (p.score === 0) {
      c.gameOver = true; c.winner = who;
      setTimeout(() => this._showResult(), 700);
      return;
    }

    if (c.dartsThisRound >= 3) {
      c.dartsThisRound = 0;
      c.player.roundDarts = [];
      c.cpu.roundDarts = [];
      c.turn = who === 'player' ? 'cpu' : 'player';
      setTimeout(() => this._render(), 600);
    } else {
      setTimeout(() => this._render(), 350);
    }
  },

  _drawBoard() {
    const c = this.current;
    const canvas = document.getElementById('dart-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 270, cx0 = 135, cy0 = 135, R = 130;
    ctx.clearRect(0, 0, W, W);
    const sectors = this.SECTORS, n = 20;
    const step = (2*Math.PI)/n, off = -Math.PI/2 - step/2;

    for (let i = 0; i < n; i++) {
      const a1 = off + i*step, a2 = a1 + step, even = i%2===0;
      // Outer black/cream segments
      ctx.beginPath(); ctx.moveTo(cx0,cy0); ctx.arc(cx0,cy0,R,a1,a2); ctx.closePath();
      ctx.fillStyle = even ? '#1a1a1a' : '#e8dfc8'; ctx.fill();
      // Double ring (green/red)
      ctx.beginPath(); ctx.arc(cx0,cy0,R*.955,a1,a2); ctx.arc(cx0,cy0,R*.858,a2,a1,true); ctx.closePath();
      ctx.fillStyle = even ? '#27AE60' : '#C0392B'; ctx.fill();
      // Inner single
      ctx.beginPath(); ctx.arc(cx0,cy0,R*.858,a1,a2); ctx.arc(cx0,cy0,R*.52,a2,a1,true); ctx.closePath();
      ctx.fillStyle = even ? '#1a1a1a' : '#e8dfc8'; ctx.fill();
      // Triple ring
      ctx.beginPath(); ctx.arc(cx0,cy0,R*.52,a1,a2); ctx.arc(cx0,cy0,R*.45,a2,a1,true); ctx.closePath();
      ctx.fillStyle = even ? '#27AE60' : '#C0392B'; ctx.fill();
      // Inner single small
      ctx.beginPath(); ctx.arc(cx0,cy0,R*.45,a1,a2); ctx.arc(cx0,cy0,R*.24,a2,a1,true); ctx.closePath();
      ctx.fillStyle = even ? '#1a1a1a' : '#e8dfc8'; ctx.fill();
      // Number
      const na = off+(i+.5)*step;
      ctx.save(); ctx.translate(cx0+Math.cos(na)*R*.92, cy0+Math.sin(na)*R*.92);
      ctx.font = 'bold 10px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillStyle = even ? 'white' : '#111'; ctx.fillText(sectors[i],0,0); ctx.restore();
    }
    // Bullseye
    ctx.beginPath(); ctx.arc(cx0,cy0,R*.24,0,Math.PI*2); ctx.fillStyle='#27AE60'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx0,cy0,R*.115,0,Math.PI*2); ctx.fillStyle='#C0392B'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx0,cy0,R*.045,0,Math.PI*2); ctx.fillStyle='#111'; ctx.fill();
    // Border
    ctx.beginPath(); ctx.arc(cx0,cy0,R,0,Math.PI*2);
    ctx.strokeStyle='#8B6914'; ctx.lineWidth=5; ctx.stroke();
    // Draw thrown darts
    const allDarts = [...(c.player.roundDarts||[]), ...(c.cpu.roundDarts||[])];
    allDarts.forEach(d => {
      if (!d.px) return;
      const col = d.owner==='player' ? '#FFD700' : '#ff6b6b';
      ctx.beginPath(); ctx.arc(d.px,d.py,5,0,Math.PI*2);
      ctx.fillStyle=col; ctx.fill();
      ctx.strokeStyle='#333'; ctx.lineWidth=1.5; ctx.stroke();
      // Dart stick
      ctx.beginPath(); ctx.moveTo(d.px,d.py); ctx.lineTo(d.px,d.py-14);
      ctx.strokeStyle=col; ctx.lineWidth=2.5; ctx.stroke();
    });
  },

  _cpuRound() {
    const c = this.current;
    if (c.turn !== 'cpu' || c.gameOver) return;
    const cpu = c.cpu;
    const score = cpu.score;
    const R = 130, cx0 = 135, cy0 = 135;
    const step = (2*Math.PI)/20, off = -Math.PI/2-step/2;
    let aimDx=0, aimDy=0;
    // Target strategy
    if (score === 50 || score === 25) { aimDx=0; aimDy=0; }
    else if (score <= 40 && score%2===0) {
      const dv=score/2, si=this.SECTORS.indexOf(dv);
      if(si>=0){const a=off+(si+.5)*step;aimDx=Math.cos(a)*.91;aimDy=Math.sin(a)*.91;}
    } else { aimDx=Math.cos(off+.5)*0.485; aimDy=Math.sin(off+.5)*0.485; }
    const v=0.1;
    const fdx=aimDx+(Math.random()-.5)*v;
    const fdy=aimDy+(Math.random()-.5)*v;
    const dist=Math.sqrt(fdx*fdx+fdy*fdy);
    const fpx=cx0+fdx*R, fpy=cy0+fdy*R;
    const result=this._calcScore(fdx,fdy,dist);
    setTimeout(() => {
      this._applyThrow('cpu',result,fpx,fpy);
      if(c.dartsThisRound>0&&c.dartsThisRound<3&&c.turn==='cpu'&&!c.gameOver)
        setTimeout(()=>this._cpuRound(),900);
    }, 800);
  },

  _showResult() {
    clearTimeout(this._windTick);
    clearInterval(this._breathTick);
    const c = this.current;
    const won = c.winner==='player';
    const timeMs = Date.now()-c.startTime;
    const rawScore = won ? 100 : 40;
    const finalScore = State.calcFinalScore({rawScore,timeMs,errors:c.errors,passed:won});
    document.getElementById('game-area').innerHTML = `
<div style="text-align:center;padding:20px 0">
  <div style="font-size:3rem">${won?'🎯🏆':'🤖😅'}</div>
  <div style="font-family:'Fredoka One',cursive;font-size:1.8rem;color:var(--mountain-dark);margin:10px 0">
    ${won?'Du hast gewonnen!':'CPU hat gewonnen!'}
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:12px 0;max-width:260px;margin-left:auto;margin-right:auto">
    <div style="background:#F0F9FF;border-radius:10px;padding:10px;font-size:.78rem">
      <div style="font-size:1.2rem">🎯</div><b>Rest: ${c.player.score}</b><br><span style="color:var(--text-mid)">Du</span>
    </div>
    <div style="background:#FFF5F5;border-radius:10px;padding:10px;font-size:.78rem">
      <div style="font-size:1.2rem">🤖</div><b>Rest: ${c.cpu.score}</b><br><span style="color:var(--text-mid)">CPU</span>
    </div>
    <div style="background:#FFFFF0;border-radius:10px;padding:10px;font-size:.78rem">
      <div style="font-size:1.2rem">⭐</div><b>${finalScore}</b><br><span style="color:var(--text-mid)">Score</span>
    </div>
  </div>
  ${!won?`<button class="btn btn-secondary btn-full" style="margin-bottom:10px;max-width:260px" onclick="DartGame.start(DartGame._lastConfig)">🔄 Revanche!</button>`:''}
  <button class="btn btn-primary btn-full" style="max-width:260px" onclick="DartGame._finish(${finalScore},${timeMs},${c.errors})">Weiter ➜</button>
</div>`;
  },

  _finish(s,t,e) {
    clearTimeout(this._windTick);
    clearInterval(this._breathTick);
    if(this.current?.onComplete) this.current.onComplete({rawScore:s,timeMs:t,errors:e,passed:s>=30});
  },
};
window.DartGame = DartGame;
