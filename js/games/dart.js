/**
 * dart.js v4 — 301 Double-Out vs CPU
 * - Atemzug-Fadenkreuz (bewegt sich langsam)
 * - Windsack (hebt sich bei starkem Wind)
 * - Echte Dartscheibe mit Double/Triple/Bull
 * - Wind ändert sich jede 1.2s
 */
const DartGame = {
  current: null, _lastConfig: null, _windTick: null, _breathTick: null,

  SECTORS: [20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5],

  start(config) {
    DartGame._lastConfig = config;
    this.current = {
      player: { score:301, darts:0, roundDarts:[] },
      cpu:    { score:301, darts:0, roundDarts:[] },
      turn: 'player', dartsThisRound: 0,
      wind: this._newWind(),
      gameOver: false, winner: null,
      startTime: Date.now(), errors: 0,
      onComplete: config.onComplete,
      // Breathing crosshair
      breath: { phase: 0, x: 0, y: 0, amplitude: 18, speed: 0.025 },
      aimX: 0.5, aimY: 0.5, // normalized 0-1 on canvas
    };
    this._render();
    // Wind changes every 1.2s
    this._windTick = setInterval(() => {
      if (this.current && !this.current.gameOver) {
        this.current.wind = this._newWind();
        this._updateWindsock();
      }
    }, 1200);
    // Breathing animation
    this._breathTick = setInterval(() => {
      if (!this.current || this.current.gameOver) return;
      const b = this.current.breath;
      b.phase += b.speed;
      b.x = Math.cos(b.phase) * b.amplitude * 0.5;
      b.y = Math.sin(b.phase * 1.3) * b.amplitude;
      this._updateCrosshair();
    }, 30);
    // Mouse/touch aim
    document.getElementById('dart-canvas')?.addEventListener('mousemove', e => this._onMove(e));
    document.getElementById('dart-canvas')?.addEventListener('touchmove', e => { e.preventDefault(); this._onMove(e.touches[0]); }, { passive: false });
  },

  _newWind() {
    const angle = Math.random() * 360;
    const strength = Math.random() * 3;
    const names = ['Windstill','Leichte Brise','Mäßig','Stark'];
    const name = strength < 0.4 ? names[0] : strength < 1.2 ? names[1] : strength < 2.2 ? names[2] : names[3];
    return { angle, strength, name };
  },

  _render() {
    const c = this.current;
    const isP = c.turn === 'player';
    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center;padding:0">
        <!-- Scores -->
        <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:8px;margin-bottom:8px">
          <div style="background:${isP?'linear-gradient(135deg,#2980B9,#1a5a8a)':'rgba(255,255,255,.5)'};border-radius:12px;padding:9px;text-align:center;transition:all .3s">
            <div style="font-size:.7rem;color:${isP?'rgba(255,255,255,.7)':'var(--text-mid)'}">👤 Du</div>
            <div style="font-family:'Fredoka One',cursive;font-size:2rem;color:${isP?'white':'var(--text-dark)'}">${c.player.score}</div>
            <div style="font-size:.65rem;color:${isP?'rgba(255,255,255,.6)':'var(--text-mid)'}">${isP?`Pfeil ${c.dartsThisRound+1}/3`:'...'}</div>
          </div>
          <div style="font-family:'Fredoka One',cursive;font-size:.9rem;color:var(--text-mid);align-self:center">VS</div>
          <div style="background:${!isP?'linear-gradient(135deg,#E74C3C,#8B0000)':'rgba(255,255,255,.5)'};border-radius:12px;padding:9px;text-align:center;transition:all .3s">
            <div style="font-size:.7rem;color:${!isP?'rgba(255,255,255,.7)':'var(--text-mid)'}">🤖 CPU</div>
            <div style="font-family:'Fredoka One',cursive;font-size:2rem;color:${!isP?'white':'var(--text-dark)'}">${c.cpu.score}</div>
            <div style="font-size:.65rem;color:${!isP?'rgba(255,255,255,.6)':'var(--text-mid)'}">${!isP?'wirft...':'...'}</div>
          </div>
        </div>
        ${c.player.score<=40||c.cpu.score<=40?`<div style="background:rgba(231,76,60,.1);border:1px solid rgba(231,76,60,.3);border-radius:8px;padding:4px 10px;margin-bottom:6px;font-size:.74rem;color:#E74C3C;font-weight:700">⚠️ Double-Out! Letzter Pfeil muss auf Double oder Bull!</div>`:''}

        <!-- Wind row: Windsack + info -->
        <div style="display:flex;align-items:center;gap:10px;background:#EBF5FB;border-radius:10px;padding:7px 12px;margin-bottom:8px">
          <!-- Compass -->
          <svg id="dart-compass" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg" style="width:40px;height:40px;flex-shrink:0">
            <circle cx="22" cy="22" r="20" fill="white" stroke="#BDC3C7" stroke-width="1.5"/>
            <text x="22" y="8" text-anchor="middle" font-size="6" font-weight="700" fill="#2C3E50">N</text>
            <text x="38" y="26" text-anchor="middle" font-size="5.5" fill="#95A5A6">O</text>
            <text x="22" y="40" text-anchor="middle" font-size="5.5" fill="#95A5A6">S</text>
            <text x="6" y="26" text-anchor="middle" font-size="5.5" fill="#95A5A6">W</text>
            <g id="dart-needle" transform="rotate(${c.wind.angle},22,22)">
              <polygon points="22,5 20,22 22,19 24,22" fill="#E74C3C"/>
              <polygon points="22,39 20,22 22,25 24,22" fill="#BDC3C7"/>
            </g>
            <circle cx="22" cy="22" r="3" fill="#2C3E50"/>
          </svg>
          <!-- Windsock -->
          <svg id="dart-windsock" viewBox="0 0 55 32" xmlns="http://www.w3.org/2000/svg" style="width:55px;height:32px;flex-shrink:0">
            ${this._windsockSVG(c.wind.strength)}
          </svg>
          <div style="text-align:left;flex:1">
            <div style="font-size:.78rem;font-weight:700;color:var(--text-dark)">${c.wind.name}</div>
            <div style="font-size:.68rem;color:var(--text-mid)">${Math.round(c.wind.angle)}° · ${'●'.repeat(Math.ceil(Math.min(3,c.wind.strength)))}${'○'.repeat(3-Math.ceil(Math.min(3,c.wind.strength)))}</div>
            <div style="font-size:.62rem;color:#E67E22">Ändert sich jede 1.2s!</div>
          </div>
        </div>

        <!-- Dartboard + breathing crosshair -->
        <div style="position:relative;display:inline-block;margin-bottom:8px">
          <canvas id="dart-canvas" width="270" height="270"
            style="border-radius:50%;cursor:none;display:block;box-shadow:0 6px 20px rgba(0,0,0,.25);touch-action:none"
            onclick="${isP&&!c.gameOver?'DartGame._throw(event)':'void(0)'}">
          </canvas>
          <!-- Breathing crosshair overlay -->
          <div id="dart-xhair" style="position:absolute;top:0;left:0;width:270px;height:270px;pointer-events:none;overflow:hidden;border-radius:50%">
            <svg id="dart-xhair-svg" viewBox="0 0 270 270" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;position:absolute;top:0;left:0">
              <g id="xhair-g" transform="translate(135,135)">
                <line id="xh" x1="-18" y1="0" x2="18" y2="0" stroke="rgba(255,255,255,.8)" stroke-width="1.5"/>
                <line id="xv" x1="0" y1="-18" x2="0" y2="18" stroke="rgba(255,255,255,.8)" stroke-width="1.5"/>
                <circle id="xc" cx="0" cy="0" r="5" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="1.5"/>
                <circle id="xdot" cx="0" cy="0" r="1.5" fill="rgba(255,50,50,.9)"/>
              </g>
            </svg>
          </div>
        </div>

        <!-- Last throws -->
        <div style="display:flex;gap:4px;justify-content:center;min-height:26px;margin-bottom:6px">
          ${c.player.roundDarts.map(d=>`<div style="padding:2px 7px;border-radius:7px;background:${d.pts>0?'#3498DB':'#E74C3C'};color:white;font-size:.7rem;font-weight:700">${d.label||d.pts}</div>`).join('')}
          ${c.cpu.roundDarts.map(d=>`<div style="padding:2px 7px;border-radius:7px;background:rgba(231,76,60,.3);color:var(--text-dark);font-size:.7rem">🤖${d.label||d.pts}</div>`).join('')}
        </div>

        ${isP?`<div style="font-size:.78rem;color:var(--text-mid)">🎯 Zielen & Tippen! Fadenkreuz atmet — warte auf ruhige Atmung!</div>`:
          `<div style="font-family:'Fredoka One',cursive;font-size:.88rem;color:#E74C3C">🤖 CPU wirft...</div>`}
      </div>`;

    this._drawBoard();
    if (!isP && !c.gameOver) setTimeout(() => this._cpuRound(), 1000);
  },

  _windsockSVG(strength) {
    const lift = Math.min(1, strength / 3);
    const pole = `<line x1="5" y1="2" x2="5" y2="30" stroke="#888" stroke-width="2.5"/>`;
    const segs = [];
    const n = 4;
    for (let i = 0; i < n; i++) {
      const t1 = i/n, t2 = (i+1)/n;
      // base at pole (x=5, y=16), tip extends right and lifts
      const bx = 5, by = 16;
      const tx = 42 + lift * 8, ty = 16 - lift * 10;
      const px1 = bx + (tx-bx)*t1, py1 = by + (ty-by)*t1;
      const px2 = bx + (tx-bx)*t2, py2 = by + (ty-by)*t2;
      const w1 = (10 - i*1.8) * (1 - lift*0.2);
      const w2 = (10 - (i+1)*1.8) * (1 - lift*0.2);
      const col = i%2===0 ? '#E74C3C' : 'white';
      segs.push(`<polygon points="${px1},${py1-w1/2} ${px2},${py2-w2/2} ${px2},${py2+w2/2} ${px1},${py1+w1/2}" fill="${col}" stroke="rgba(0,0,0,.1)" stroke-width=".5"/>`);
    }
    // Tip ring
    const tx2 = 42+lift*8, ty2 = 16-lift*10;
    segs.push(`<ellipse cx="${tx2}" cy="${ty2}" rx="1.5" ry="${3*(1-lift*.3)}" fill="#999"/>`);
    return pole + segs.join('');
  },

  _drawBoard() {
    const c = this.current;
    const canvas = document.getElementById('dart-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height, cx = W/2, cy = H/2, R = W/2-4;
    ctx.clearRect(0, 0, W, H);
    const sectors = this.SECTORS, n = sectors.length;
    const step = (2*Math.PI)/n, off = -Math.PI/2-step/2;

    for (let i = 0; i < n; i++) {
      const a1 = off+i*step, a2 = a1+step, even = i%2===0;
      // Outer single
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,R,a1,a2); ctx.closePath();
      ctx.fillStyle = even?'#1a1a1a':'#e8dfc8'; ctx.fill();
      // Double ring
      ctx.beginPath(); ctx.arc(cx,cy,R*0.955,a1,a2); ctx.arc(cx,cy,R*0.858,a2,a1,true); ctx.closePath();
      ctx.fillStyle = even?'#27AE60':'#C0392B'; ctx.fill();
      // Inner single
      ctx.beginPath(); ctx.arc(cx,cy,R*0.858,a1,a2); ctx.arc(cx,cy,R*0.52,a2,a1,true); ctx.closePath();
      ctx.fillStyle = even?'#1a1a1a':'#e8dfc8'; ctx.fill();
      // Triple ring
      ctx.beginPath(); ctx.arc(cx,cy,R*0.52,a1,a2); ctx.arc(cx,cy,R*0.45,a2,a1,true); ctx.closePath();
      ctx.fillStyle = even?'#27AE60':'#C0392B'; ctx.fill();
      // Inner single (small)
      ctx.beginPath(); ctx.arc(cx,cy,R*0.45,a1,a2); ctx.arc(cx,cy,R*0.24,a2,a1,true); ctx.closePath();
      ctx.fillStyle = even?'#1a1a1a':'#e8dfc8'; ctx.fill();
      // Numbers
      const na = off+(i+0.5)*step, nr = R*0.925;
      ctx.save(); ctx.translate(cx+Math.cos(na)*nr, cy+Math.sin(na)*nr);
      ctx.fillStyle = even?'white':'#1a1a1a';
      ctx.font = 'bold 10px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(sectors[i].toString(), 0, 0); ctx.restore();
    }
    // Bullseye
    ctx.beginPath(); ctx.arc(cx,cy,R*0.24,0,Math.PI*2); ctx.fillStyle='#27AE60'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx,cy,R*0.12,0,Math.PI*2); ctx.fillStyle='#C0392B'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx,cy,R*0.045,0,Math.PI*2); ctx.fillStyle='#1a1a1a'; ctx.fill();
    // Border
    ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2);
    ctx.strokeStyle='#8B6914'; ctx.lineWidth=5; ctx.stroke();
    // Draw thrown darts
    [...c.player.roundDarts, ...c.cpu.roundDarts].forEach(d => {
      if (!d.px) return;
      const col = d.owner==='player' ? '#FFD700' : '#FF6B6B';
      ctx.beginPath(); ctx.arc(d.px,d.py,5,0,Math.PI*2);
      ctx.fillStyle=col; ctx.fill();
      ctx.strokeStyle='#333'; ctx.lineWidth=1.5; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(d.px,d.py); ctx.lineTo(d.px,d.py-13);
      ctx.strokeStyle=col; ctx.lineWidth=2; ctx.stroke();
    });
  },

  _onMove(e) {
    const canvas = document.getElementById('dart-canvas');
    if (!canvas || !this.current || this.current.turn !== 'player') return;
    const rect = canvas.getBoundingClientRect();
    this.current.aimX = (e.clientX - rect.left) / rect.width;
    this.current.aimY = (e.clientY - rect.top) / rect.height;
  },

  _updateCrosshair() {
    const c = this.current;
    if (!c) return;
    const g = document.getElementById('xhair-g');
    if (!g) return;
    const cx = c.aimX * 270;
    const cy = c.aimY * 270;
    const bx = c.breath.x;
    const by = c.breath.y;
    g.setAttribute('transform', `translate(${cx+bx},${cy+by})`);
  },

  _updateWindsock() {
    const c = this.current; if (!c) return;
    const ws = document.getElementById('dart-windsock');
    if (ws) ws.innerHTML = this._windsockSVG(c.wind.strength);
    const needle = document.getElementById('dart-needle');
    if (needle) needle.setAttribute('transform', `rotate(${c.wind.angle},22,22)`);
  },

  _throw(e) {
    const c = this.current;
    if (c.turn !== 'player' || c.gameOver) return;
    const canvas = document.getElementById('dart-canvas');
    if (!canvas) return;
    const W = canvas.width, H = canvas.height, cx = W/2, cy = H/2, R = W/2-4;
    // Use breathing crosshair position (aim + breath offset)
    const bx = c.breath.x, by = c.breath.y;
    const rect = canvas.getBoundingClientRect();
    const rawX = (e.clientX - rect.left) * (W / rect.width);
    const rawY = (e.clientY - rect.top) * (H / rect.height);
    // Actual landing = click position + breath offset + wind
    const wr = (c.wind.angle * Math.PI) / 180;
    const wp = c.wind.strength * 0.065;
    const fdx = ((rawX+bx) - cx)/R + Math.cos(wr)*wp + (Math.random()-.5)*0.04;
    const fdy = ((rawY+by) - cy)/R + Math.sin(wr)*wp + (Math.random()-.5)*0.04;
    const dist = Math.sqrt(fdx*fdx + fdy*fdy);
    const fpx = cx + fdx*R, fpy = cy + fdy*R;
    const {pts, label, isDouble, isBull} = this._calcScore(fdx, fdy, dist);
    this._applyThrow('player', pts, label, isDouble, isBull, fpx, fpy);
  },

  _calcScore(dx, dy, dist) {
    if (dist < 0.045) return { pts:50, label:'🎯 Bull!', isDouble:false, isBull:true };
    if (dist < 0.12)  return { pts:25, label:'Bull 25', isDouble:false, isBull:false };
    if (dist > 1.0)   return { pts:0,  label:'❌ Daneben', isDouble:false, isBull:false };
    let ang = Math.atan2(dy, dx) + Math.PI/2;
    if (ang < 0) ang += 2*Math.PI;
    const si = Math.floor((ang/(2*Math.PI))*20) % 20;
    const sv = this.SECTORS[si];
    if (dist < 0.245) return { pts:sv,    label:`${sv}`,    isDouble:false, isBull:false };
    if (dist < 0.455) return { pts:sv*3,  label:`T${sv}`,   isDouble:false, isBull:false };
    if (dist < 0.858) return { pts:sv,    label:`${sv}`,    isDouble:false, isBull:false };
    if (dist < 0.955) return { pts:sv*2,  label:`D${sv}`,   isDouble:true,  isBull:false };
    return { pts:sv, label:`${sv}`, isDouble:false, isBull:false };
  },

  _applyThrow(who, pts, label, isDouble, isBull, fpx, fpy) {
    const c = this.current;
    const p = c[who];
    let actualPts = pts, bust = false;
    const would = p.score - actualPts;
    if (would < 0)                        { bust=true; actualPts=0; label='Bust!'; }
    else if (would===0 && !isDouble && !isBull) { bust=true; actualPts=0; label='Kein Double!'; }
    else if (would===1)                   { bust=true; actualPts=0; label='Bust!'; }
    if (!bust) p.score -= actualPts;
    if (bust||actualPts===0) c.errors++;
    p.roundDarts.push({ pts:actualPts, label, owner:who, px:fpx, py:fpy });
    c.dartsThisRound++;
    // Flash
    const fc = who==='player'?'#3498DB':'#E74C3C';
    const fl = document.createElement('div');
    fl.style.cssText=`position:fixed;top:28%;left:50%;transform:translate(-50%,-50%);font-family:'Fredoka One',cursive;font-size:1.8rem;color:${fc};text-shadow:0 2px 8px rgba(0,0,0,.4);pointer-events:none;z-index:999;animation:popIn .3s ease`;
    fl.textContent = actualPts>0?(label||'+'+actualPts):`❌ ${label}`;
    document.body.appendChild(fl); setTimeout(()=>fl.remove(),900);
    this._drawBoard();
    if (p.score===0) { c.gameOver=true; c.winner=who; setTimeout(()=>this._showResult(),700); return; }
    if (c.dartsThisRound>=3) {
      c.dartsThisRound=0;
      c.player.roundDarts=[]; c.cpu.roundDarts=[];
      c.turn = who==='player'?'cpu':'player';
      setTimeout(()=>this._render(), 600);
    } else {
      // Re-render score display inline
      const scP=document.querySelector('[style*="2980B9"]'),scC=document.querySelector('[style*="8B0000"]');
      setTimeout(()=>this._render(), 400);
    }
  },

  _cpuRound() {
    const c = this.current;
    if (c.turn!=='cpu'||c.gameOver) return;
    const cpu = c.cpu;
    const W=270,H=270,cx=W/2,cy=H/2,R=W/2-4;
    const score=cpu.score;
    const step=(2*Math.PI)/20, off=-Math.PI/2-step/2;
    let aimDx=0,aimDy=0;
    if (score<=40&&score%2===0) {
      const dval=score/2, si=this.SECTORS.indexOf(dval);
      if(si>=0){const a=off+(si+.5)*step;aimDx=Math.cos(a)*.905;aimDy=Math.sin(a)*.905;}
    } else if (score===50||score===25) { aimDx=0;aimDy=0; }
    else { const a=off+0.5*step;aimDx=Math.cos(a)*.485;aimDy=Math.sin(a)*.485; }
    const variance=0.09;
    const fdx=aimDx+(Math.random()-.5)*variance;
    const fdy=aimDy+(Math.random()-.5)*variance;
    const dist=Math.sqrt(fdx*fdx+fdy*fdy);
    const fpx=cx+fdx*R,fpy=cy+fdy*R;
    const {pts,label,isDouble,isBull}=this._calcScore(fdx,fdy,dist);
    setTimeout(()=>{
      this._applyThrow('cpu',pts,label,isDouble,isBull,fpx,fpy);
      if(c.dartsThisRound>0&&c.dartsThisRound<3&&c.turn==='cpu'&&!c.gameOver)
        setTimeout(()=>this._cpuRound(),900);
    },800);
  },

  _showResult() {
    clearInterval(this._windTick); clearInterval(this._breathTick);
    const c=this.current;
    const playerWon=c.winner==='player';
    const timeMs=Date.now()-c.startTime;
    const rawScore=playerWon?100:40;
    const finalScore=State.calcFinalScore({rawScore,timeMs,errors:c.errors,passed:playerWon});
    document.getElementById('game-area').innerHTML=`
      <div style="text-align:center;padding:20px 0">
        <div style="font-size:3rem">${playerWon?'🎯🏆':'🤖😅'}</div>
        <div style="font-family:'Fredoka One',cursive;font-size:1.8rem;color:var(--mountain-dark);margin:10px 0">
          ${playerWon?'Du hast gewonnen!':'CPU hat gewonnen!'}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:12px 0">
          <div style="background:#F0F9FF;border-radius:10px;padding:10px;font-size:.8rem">
            <div style="font-size:1.2rem">🎯</div><b>Rest: ${c.player.score}</b><br><span style="color:var(--text-mid)">Du</span>
          </div>
          <div style="background:#FFF5F5;border-radius:10px;padding:10px;font-size:.8rem">
            <div style="font-size:1.2rem">🤖</div><b>Rest: ${c.cpu.score}</b><br><span style="color:var(--text-mid)">CPU</span>
          </div>
          <div style="background:#FFFFF0;border-radius:10px;padding:10px;font-size:.8rem">
            <div style="font-size:1.2rem">⭐</div><b>${finalScore}</b><br><span style="color:var(--text-mid)">Score</span>
          </div>
        </div>
        ${!playerWon?`<button class="btn btn-secondary btn-full" style="margin-bottom:10px" onclick="DartGame.start(DartGame._lastConfig)">🔄 Revanche!</button>`:''}
        <button class="btn btn-primary btn-full" onclick="DartGame._finish(${finalScore},${timeMs},${c.errors})">Weiter ➜</button>
      </div>`;
  },

  _finish(s,t,e) {
    clearInterval(this._windTick); clearInterval(this._breathTick);
    if(this.current?.onComplete) this.current.onComplete({rawScore:s,timeMs:t,errors:e,passed:s>=30});
  },
};
window.DartGame = DartGame;
