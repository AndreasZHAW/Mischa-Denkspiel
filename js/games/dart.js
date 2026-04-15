/**
 * games/dart.js v3 — 301 Double-Out gegen Computer
 * Echte Dartscheibe, 3 Pfeile pro Runde, Windsack-Animation
 * Double-Out: letzter Wurf muss auf Double oder Bullseye landen
 */
const DartGame = {
  current: null, _lastConfig: null, _windTick: null,
  SECTORS: [20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5],

  start(config) {
    DartGame._lastConfig = config;
    this.current = {
      player: { score: 301, darts: 0, throws: [], roundDarts: [] },
      cpu:    { score: 301, darts: 0, throws: [], roundDarts: [] },
      turn: 'player', // 'player' | 'cpu'
      dartsThisRound: 0,
      maxDartsPerRound: 3,
      wind: this._newWind(),
      gameOver: false,
      winner: null,
      startTime: Date.now(),
      errors: 0,
      onComplete: config.onComplete,
    };
    this._render();
    this._windTick = setInterval(() => { if(this.current) { this.current.wind=this._newWind(); this._updateWindsock(); }}, 1200);
  },

  _newWind() {
    const angle = Math.random()*360;
    const strength = Math.random()*3;
    return { angle, strength, name: strength<0.4?'Windstill':strength<1.2?'Leichte Brise':strength<2.2?'Mäßig':'Stark' };
  },

  // ---- RENDER ----
  _render() {
    const c = this.current;
    const isPlayer = c.turn === 'player';

    document.getElementById('game-area').innerHTML = `
      <div style="text-align:center">
        <!-- Scores header -->
        <div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;margin-bottom:10px">
          <div style="background:${isPlayer?'linear-gradient(135deg,#2980B9,#1A5276)':'rgba(255,255,255,0.5)'};
            border-radius:12px;padding:10px;text-align:center;transition:all 0.3s">
            <div style="font-size:0.72rem;color:${isPlayer?'rgba(255,255,255,0.7)':'var(--text-mid)'}">👤 Du</div>
            <div style="font-family:'Fredoka One',cursive;font-size:2rem;color:${isPlayer?'white':'var(--text-dark)'}">${c.player.score}</div>
            <div style="font-size:0.65rem;color:${isPlayer?'rgba(255,255,255,0.6)':'var(--text-mid)'}">${isPlayer?`Pfeil ${c.dartsThisRound+1}/3`:'warten...'}</div>
          </div>
          <div style="font-family:'Fredoka One',cursive;font-size:0.9rem;color:var(--text-mid)">VS</div>
          <div style="background:${!isPlayer?'linear-gradient(135deg,#E74C3C,#8B0000)':'rgba(255,255,255,0.5)'};
            border-radius:12px;padding:10px;text-align:center;transition:all 0.3s">
            <div style="font-size:0.72rem;color:${!isPlayer?'rgba(255,255,255,0.7)':'var(--text-mid)'}">🤖 CPU</div>
            <div style="font-family:'Fredoka One',cursive;font-size:2rem;color:${!isPlayer?'white':'var(--text-dark)'}">${c.cpu.score}</div>
            <div style="font-size:0.65rem;color:${!isPlayer?'rgba(255,255,255,0.6)':'var(--text-mid)'}">${!isPlayer?'wirft...':'warten...'}</div>
          </div>
        </div>

        <!-- Double-out reminder -->
        ${c.player.score <= 40 || c.cpu.score <= 40 ? `
          <div style="background:rgba(231,76,60,0.1);border:1px solid rgba(231,76,60,0.3);border-radius:8px;
            padding:5px 10px;margin-bottom:8px;font-size:0.75rem;color:#E74C3C;font-weight:700">
            ⚠️ Double-Out! Letzter Wurf muss auf Double oder Bull landen!
          </div>` : ''}

        <!-- Wind + compass -->
        <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:10px;
          padding:6px 12px;background:rgba(235,245,251,0.8);border-radius:10px">
          <!-- Compass with windsock -->
          <svg id="wind-compass" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" style="width:52px;height:52px;flex-shrink:0">
            <circle cx="30" cy="30" r="28" fill="white" stroke="#BDC3C7" stroke-width="1.5"/>
            <text x="30" y="10" text-anchor="middle" font-size="7" font-weight="700" fill="#2C3E50">N</text>
            <text x="50" y="33" text-anchor="middle" font-size="6" fill="#95A5A6">O</text>
            <text x="30" y="54" text-anchor="middle" font-size="6" fill="#95A5A6">S</text>
            <text x="10" y="33" text-anchor="middle" font-size="6" fill="#95A5A6">W</text>
            <!-- Compass needle -->
            <g id="compass-needle" transform="rotate(${c.wind.angle}, 30, 30)">
              <polygon points="30,6 27,30 30,26 33,30" fill="#E74C3C"/>
              <polygon points="30,54 27,30 30,34 33,30" fill="#BDC3C7"/>
            </g>
            <circle cx="30" cy="30" r="3.5" fill="#2C3E50"/>
          </svg>
          <!-- Windsock -->
          <svg id="windsock" viewBox="0 0 50 30" xmlns="http://www.w3.org/2000/svg" style="width:50px;height:30px;flex-shrink:0">
            ${this._windsockSVG(c.wind.strength)}
          </svg>
          <div style="text-align:left">
            <div style="font-size:0.75rem;font-weight:700;color:var(--text-dark)">${c.wind.name}</div>
            <div style="font-size:0.68rem;color:var(--text-mid)">${Math.round(c.wind.angle)}° · ${'●'.repeat(Math.ceil(c.wind.strength))}${'○'.repeat(3-Math.ceil(Math.min(3,c.wind.strength)))}</div>
          </div>
        </div>

        <!-- Dartboard canvas -->
        <canvas id="dart-canvas" width="260" height="260"
          style="border-radius:50%;cursor:${isPlayer?'crosshair':'default'};display:block;margin:0 auto 10px;
            box-shadow:0 6px 20px rgba(0,0,0,0.25);touch-action:none"
          onclick="${isPlayer&&!c.gameOver?'DartGame._playerThrow(event)':'void(0)'}"
          onmousemove="${isPlayer?'DartGame._aim(event)':'void(0)'}">
        </canvas>

        <!-- Last throws -->
        <div style="display:flex;gap:4px;justify-content:center;min-height:28px;margin-bottom:8px">
          ${c.player.roundDarts.map(d=>`
            <div style="padding:3px 8px;border-radius:8px;
              background:${d.pts>0?'#3498DB':'#E74C3C'};color:white;font-size:0.72rem;font-weight:700">
              ${d.label||d.pts}
            </div>`).join('')}
          ${c.cpu.roundDarts.map(d=>`
            <div style="padding:3px 8px;border-radius:8px;
              background:${d.pts>0?'rgba(231,76,60,0.3)':'rgba(0,0,0,0.1)'};color:var(--text-dark);font-size:0.72rem">
              🤖 ${d.label||d.pts}
            </div>`).join('')}
        </div>

        ${isPlayer?`<div style="font-size:0.8rem;color:var(--text-mid)">🎯 Tippe auf die Scheibe!</div>`:''}
        ${!isPlayer?`<div id="cpu-thinking" style="font-size:0.85rem;color:#E74C3C;font-family:'Fredoka One',cursive">🤖 CPU wirft...</div>`:''}
      </div>`;

    this._drawBoard();
    if (!isPlayer && !c.gameOver) setTimeout(() => this._cpuThrow(), 1000);
  },

  // ---- WINDSOCK SVG ----
  _windsockSVG(strength) {
    // strength 0-3 controls how much the sock lifts
    const lift = Math.min(1, strength/3); // 0=hanging, 1=fully extended
    const baseY = 15;
    const tipY = baseY - lift * 10; // rises with wind
    const tipX = 35 + lift * 10;   // extends outward
    // Pole
    const pole = `<line x1="5" y1="2" x2="5" y2="28" stroke="#666" stroke-width="2"/>`;
    // Sock segments (striped red/white)
    const segs = [];
    const n = 4;
    for(let i=0;i<n;i++) {
      const t1 = i/n, t2 = (i+1)/n;
      const x1=5, y1=baseY, x2=tipX, y2=tipY;
      const w1 = 10*(1-t1*0.6), w2 = 10*(1-(t2)*0.6);
      const px1 = x1+(x2-x1)*t1, py1 = y1+(y2-y1)*t1;
      const px2 = x1+(x2-x1)*t2, py2 = y1+(y2-y1)*t2;
      const col = i%2===0?'#E74C3C':'white';
      segs.push(`<polygon points="${px1},${py1-w1/2} ${px2},${py2-w2/2} ${px2},${py2+w2/2} ${px1},${py1+w1/2}" fill="${col}" stroke="none" opacity="0.9"/>`);
    }
    return pole + segs.join('');
  },

  // ---- DRAW BOARD ----
  _drawBoard() {
    const c = this.current;
    const canvas = document.getElementById('dart-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W=canvas.width, H=canvas.height, cx=W/2, cy=H/2, R=W/2-4;
    ctx.clearRect(0,0,W,H);
    const sectors=this.SECTORS, n=sectors.length;
    const step=(2*Math.PI)/n, off=-Math.PI/2-step/2;

    for(let i=0;i<n;i++){
      const a1=off+i*step, a2=a1+step, even=i%2===0;
      // Outer single
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,R,a1,a2); ctx.closePath();
      ctx.fillStyle=even?'#1a1a1a':'#e8dfc8'; ctx.fill();
      // Double (outermost colored ring)
      ctx.beginPath(); ctx.arc(cx,cy,R*0.955,a1,a2); ctx.arc(cx,cy,R*0.855,a2,a1,true); ctx.closePath();
      ctx.fillStyle=even?'#27AE60':'#C0392B'; ctx.fill();
      // Inner single
      ctx.beginPath(); ctx.arc(cx,cy,R*0.855,a1,a2); ctx.arc(cx,cy,R*0.52,a2,a1,true); ctx.closePath();
      ctx.fillStyle=even?'#1a1a1a':'#e8dfc8'; ctx.fill();
      // Triple
      ctx.beginPath(); ctx.arc(cx,cy,R*0.52,a1,a2); ctx.arc(cx,cy,R*0.45,a2,a1,true); ctx.closePath();
      ctx.fillStyle=even?'#27AE60':'#C0392B'; ctx.fill();
      // Inner bull area
      ctx.beginPath(); ctx.arc(cx,cy,R*0.45,a1,a2); ctx.arc(cx,cy,R*0.24,a2,a1,true); ctx.closePath();
      ctx.fillStyle=even?'#1a1a1a':'#e8dfc8'; ctx.fill();
      // Numbers
      const na=off+(i+0.5)*step, nr=R*0.925;
      ctx.save(); ctx.translate(cx+Math.cos(na)*nr, cy+Math.sin(na)*nr);
      ctx.fillStyle=even?'white':'#1a1a1a'; ctx.font='bold 10px Arial';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(sectors[i].toString(),0,0); ctx.restore();
    }
    // Bullseye
    ctx.beginPath(); ctx.arc(cx,cy,R*0.24,0,Math.PI*2); ctx.fillStyle='#27AE60'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx,cy,R*0.12,0,Math.PI*2); ctx.fillStyle='#C0392B'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx,cy,R*0.045,0,Math.PI*2); ctx.fillStyle='#1a1a1a'; ctx.fill();
    // Border
    ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2); ctx.strokeStyle='#8B6914'; ctx.lineWidth=5; ctx.stroke();
    // Draw all thrown darts
    [...c.player.throws, ...c.cpu.throws].forEach(d=>{
      if (!d.px) return;
      const col = d.owner==='player'?'#FFD700':'#FF6B6B';
      ctx.beginPath(); ctx.arc(d.px,d.py,5,0,Math.PI*2);
      ctx.fillStyle=col; ctx.fill();
      ctx.strokeStyle='#333'; ctx.lineWidth=1.5; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(d.px,d.py); ctx.lineTo(d.px,d.py-12);
      ctx.strokeStyle=col; ctx.lineWidth=2; ctx.stroke();
    });
  },

  _aim(e) {
    const canvas=document.getElementById('dart-canvas'); if(!canvas) return;
    const rect=canvas.getBoundingClientRect();
    const px=(e.clientX-rect.left)*(canvas.width/rect.width);
    const py=(e.clientY-rect.top)*(canvas.height/rect.height);
    this._drawBoard();
    const ctx=canvas.getContext('2d');
    ctx.beginPath(); ctx.arc(px,py,8,0,Math.PI*2);
    ctx.strokeStyle='rgba(255,255,255,0.7)'; ctx.lineWidth=1.5; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(px-14,py); ctx.lineTo(px+14,py);
    ctx.moveTo(px,py-14); ctx.lineTo(px,py+14);
    ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=1; ctx.stroke();
  },

  // ---- PLAYER THROW ----
  _playerThrow(e) {
    const c=this.current;
    if(c.turn!=='player'||c.gameOver) return;
    const canvas=document.getElementById('dart-canvas');
    const rect=canvas.getBoundingClientRect();
    const W=canvas.width, H=canvas.height, cx=W/2, cy=H/2, R=W/2-4;
    const px=(e.clientX-rect.left)*(W/rect.width);
    const py=(e.clientY-rect.top)*(H/rect.height);
    const dx=(px-cx)/R, dy=(py-cy)/R;
    // Wind effect
    const wr=(c.wind.angle*Math.PI)/180;
    const wp=c.wind.strength*0.07;
    const fdx=dx+Math.cos(wr)*wp+(Math.random()-0.5)*0.04;
    const fdy=dy+Math.sin(wr)*wp+(Math.random()-0.5)*0.04;
    const dist=Math.sqrt(fdx*fdx+fdy*fdy);
    const fpx=cx+fdx*R, fpy=cy+fdy*R;
    const {pts,label,isDouble,isBull}=this._calcScore(fdx,fdy,dist);
    this._applyThrow('player', pts, label, isDouble, isBull, fpx, fpy);
  },

  // ---- SCORE CALCULATION ----
  _calcScore(dx,dy,dist) {
    if(dist<0.045) return {pts:50,label:'🎯 Bull!',isDouble:false,isBull:true};
    if(dist<0.12)  return {pts:25,label:'Bull 25',isDouble:false,isBull:false};
    if(dist>1.0)   return {pts:0,label:'Daneben!',isDouble:false,isBull:false};
    let ang=Math.atan2(dy,dx)+Math.PI/2;
    if(ang<0)ang+=2*Math.PI;
    const si=Math.floor((ang/(2*Math.PI))*20)%20;
    const sv=this.SECTORS[si];
    if(dist<0.245) return {pts:sv,   label:`${sv}`,     isDouble:false,isBull:false};
    if(dist<0.455) return {pts:sv*3, label:`T${sv}`,    isDouble:false,isBull:false};
    if(dist<0.525) return {pts:sv,   label:`${sv}`,     isDouble:false,isBull:false};
    if(dist<0.855) return {pts:sv,   label:`${sv}`,     isDouble:false,isBull:false};
    if(dist<0.955) return {pts:sv*2, label:`D${sv}`,    isDouble:true, isBull:false};
    return {pts:sv,label:`${sv}`,isDouble:false,isBull:false};
  },

  // ---- APPLY THROW ----
  _applyThrow(who, pts, label, isDouble, isBull, fpx, fpy) {
    const c=this.current;
    const p=c[who];
    let actualPts=pts, bust=false;

    // 301 rules: must finish on double or bullseye
    const wouldBe=p.score-actualPts;
    if(wouldBe<0) { bust=true; actualPts=0; label='Bust!'; }
    else if(wouldBe===0 && !isDouble && !isBull) { bust=true; actualPts=0; label='Kein Double!'; }
    else if(wouldBe===1) { bust=true; actualPts=0; label='Bust!'; } // can't leave 1

    if(!bust) p.score-=actualPts;
    if(bust||actualPts===0) c.errors++;

    p.throws.push({px:fpx,py:fpy,pts:actualPts,owner:who});
    p.roundDarts.push({pts:actualPts,label});
    c.dartsThisRound++;

    // Flash
    const fc=who==='player'?'#3498DB':'#E74C3C';
    const flash=document.createElement('div');
    flash.style.cssText=`position:fixed;top:30%;left:50%;transform:translate(-50%,-50%);
      font-family:'Fredoka One',cursive;font-size:1.8rem;color:${fc};
      text-shadow:0 2px 8px rgba(0,0,0,0.4);pointer-events:none;z-index:999;animation:popIn 0.3s ease`;
    flash.textContent=actualPts>0?`${label||'+'+actualPts}`:`❌ ${label}`;
    document.body.appendChild(flash);
    setTimeout(()=>flash.remove(),800);

    // Check win
    if(p.score===0) { c.gameOver=true; c.winner=who; this._drawBoard(); setTimeout(()=>this._showResult(),700); return; }

    this._drawBoard();

    // Next dart or next turn
    if(c.dartsThisRound>=3) {
      c.dartsThisRound=0;
      p.roundDarts=[];
      c[who==='player'?'cpu':'player'].roundDarts=[];
      c.turn=who==='player'?'cpu':'player';
      setTimeout(()=>this._render(),600);
    } else {
      // Update display inline
      const scoreEl=document.querySelector(who==='player'?'[style*="2980B9"] .fd-score, [style*="2980B9"]':'[style*="8B0000"]');
      setTimeout(()=>this._render(),400);
    }
  },

  // ---- CPU AI THROW ----
  _cpuThrow() {
    const c=this.current;
    if(c.turn!=='cpu'||c.gameOver) return;

    // CPU strategy: aim for T20 or finish if possible
    const cpu=c.cpu;
    const score=cpu.score;
    const W=260, H=260, cx=W/2, cy=H/2, R=W/2-4;

    // Where to aim?
    let aimDx=0, aimDy=0;
    const step=(2*Math.PI)/20, off=-Math.PI/2-step/2;

    if(score<=40&&score%2===0) {
      // Try to double out - aim for D(score/2)
      const dval=score/2;
      const si=this.SECTORS.indexOf(dval);
      if(si>=0){
        const a=off+(si+0.5)*step;
        aimDx=Math.cos(a)*0.905; aimDy=Math.sin(a)*0.905; // double ring
      }
    } else if(score===50||score===25) {
      aimDx=0; aimDy=0; // bullseye
    } else {
      // Aim for T20 (top, left)
      const si=0; // sector 20 is index 0
      const a=off+(si+0.5)*step;
      aimDx=Math.cos(a)*0.485; aimDy=Math.sin(a)*0.485; // triple ring
    }

    // Add skill variance (CPU is pretty good but not perfect)
    const variance=0.08;
    const fdx=aimDx+(Math.random()-0.5)*variance;
    const fdy=aimDy+(Math.random()-0.5)*variance;
    const dist=Math.sqrt(fdx*fdx+fdy*fdy);
    const fpx=cx+fdx*R, fpy=cy+fdy*R;
    const {pts,label,isDouble,isBull}=this._calcScore(fdx,fdy,dist);

    setTimeout(()=>{
      this._applyThrow('cpu',pts,label,isDouble,isBull,fpx,fpy);
      // Continue CPU throws
      if(c.dartsThisRound>0&&c.dartsThisRound<3&&c.turn==='cpu'&&!c.gameOver) {
        setTimeout(()=>this._cpuThrow(),900);
      }
    },800);
  },

  _updateWindsock() {
    const c=this.current;
    if(!c) return;
    const ws=document.getElementById('windsock');
    if(ws) ws.innerHTML=this._windsockSVG(c.wind.strength);
    const needle=document.getElementById('compass-needle');
    if(needle) needle.setAttribute('transform',`rotate(${c.wind.angle},30,30)`);
  },

  _showResult() {
    clearInterval(this._windTick);
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
        <div style="color:var(--text-mid);margin-bottom:12px">
          ${playerWon?'Toller Double-Out! 🎯':'CPU hat das Spiel mit Double beendet.'}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:12px 0">
          <div style="background:#F0F9FF;border-radius:10px;padding:10px;font-size:0.8rem">
            <div style="font-size:1.2rem">🎯</div>
            <b>Du: ${301-c.player.score>=0?301-c.player.score:0}pts</b>
            <br><span style="color:var(--text-mid)">Rest: ${c.player.score}</span>
          </div>
          <div style="background:#FFF5F5;border-radius:10px;padding:10px;font-size:0.8rem">
            <div style="font-size:1.2rem">🤖</div>
            <b>CPU: ${301-c.cpu.score>=0?301-c.cpu.score:0}pts</b>
            <br><span style="color:var(--text-mid)">Rest: ${c.cpu.score}</span>
          </div>
          <div style="background:#FFFFF0;border-radius:10px;padding:10px;font-size:0.8rem">
            <div style="font-size:1.2rem">⭐</div><b>${finalScore}</b>
            <br><span style="color:var(--text-mid)">Score</span>
          </div>
        </div>
        ${!playerWon?`<button class="btn btn-secondary btn-full" style="margin-bottom:10px" onclick="DartGame.start(DartGame._lastConfig)">🔄 Revanche!</button>`:''}
        <button class="btn btn-primary btn-full" onclick="DartGame._finish(${finalScore},${timeMs},${c.errors})">Weiter ➜</button>
      </div>`;
  },

  _finish(s,t,e) {
    clearInterval(this._windTick);
    if(this.current?.onComplete) this.current.onComplete({rawScore:s,timeMs:t,errors:e,passed:s>=30});
  },
};
window.DartGame = DartGame;
