// STAR WARS SPACE SHOOTER - replaces Memory II
const StarWarsGame = {
  start({onComplete}) {
    const el = document.getElementById('game-area');
    if (!el) { if(typeof GameLog!=='undefined')GameLog.error('starwars','game-area not found'); return; }
    if(typeof GameLog!=='undefined')GameLog.log('starwars','start()');
    const W=400,H=500;
    el.innerHTML=`<div style="text-align:center;touch-action:none;user-select:none;-webkit-user-select:none">
      <canvas id="swcv" width="${W}" height="${H}" style="background:#000;border-radius:8px;width:100%;max-width:${W}px;height:auto;display:block;margin:0 auto;touch-action:none;user-select:none"></canvas>
      <div style="display:flex;justify-content:column;gap:6px;margin-top:8px"><div style="text-align:center;font-size:clamp(0.82rem,3.5vw,0.92rem);color:rgba(255,215,0,.6);margin-bottom:4px">📱 Handy kippen = Steuern · 🔥 = Schiessen</div><div style="display:flex;justify-content:center;gap:12px">
        <button id="sw-left" style="background:#1a1a2e;color:#FFD700;border:2px solid #FFD700;padding:12px 24px;border-radius:8px;font-size:1.2rem;cursor:pointer;-webkit-tap-highlight-color:transparent">◀</button>
        <button id="sw-fire" style="background:#E74C3C;color:#fff;border:none;padding:12px 24px;border-radius:8px;font-size:1rem;cursor:pointer;font-weight:900">🔫 Schießen</button>
        <button id="sw-right" style="background:#1a1a2e;color:#FFD700;border:2px solid #FFD700;padding:12px 24px;border-radius:8px;font-size:1.2rem;cursor:pointer;-webkit-tap-highlight-color:transparent">▶</button>
      </div>
    </div>`;
    const cv=document.getElementById('swcv'),ctx=cv.getContext('2d');
    let ship={x:200,y:440,w:30,h:20};
    let bullets=[],stars_bg=[],enemies=[],explosions=[];
    let score=0,lives=3,running=true,wave=1,tStart=Date.now(),animId;
    // Stars background
    for(let i=0;i<80;i++) stars_bg.push({x:Math.random()*W,y:Math.random()*H,s:Math.random()*2+0.5});
    // Spawn wave
    const spawnWave=()=>{
      const rows=Math.min(4,2+Math.floor(wave/2)); // more rows later
      const cols=Math.min(10,7+wave);
      for(let r=0;r<rows;r++) for(let c=0;c<cols;c++)
        enemies.push({x:30+c*36,y:25+r*34,w:24,h:20,hp:1+(r>=2?1:0)+(wave>3?1:0),dx:1.5*wave,dy:0.35,type:r%3});
    };
    spawnWave();
    // Controls
    let leftHeld=false,rightHeld=false;
    const fire=()=>{bullets.push({x:ship.x,y:ship.y-10,dy:-8});};
    document.getElementById('sw-left').addEventListener('pointerdown',()=>leftHeld=true);
    document.getElementById('sw-right').addEventListener('pointerdown',()=>rightHeld=true);
    const fireBtn = document.getElementById('sw-fire');
    let rapidFireInterval = null;
    fireBtn.addEventListener('pointerdown', e => {
      e.preventDefault();
      fire(); // immediate shot
      rapidFireInterval = setInterval(fire, 180); // rapid fire
    });
    fireBtn.addEventListener('pointerup', () => { clearInterval(rapidFireInterval); rapidFireInterval = null; });
    fireBtn.addEventListener('pointercancel', () => { clearInterval(rapidFireInterval); rapidFireInterval = null; });
    fireBtn.addEventListener('touchstart', e => e.preventDefault(), {passive:false});
    document.addEventListener('pointerup',()=>{leftHeld=false;rightHeld=false;});
    
    // GYROSCOPE: tilt phone left/right to move ship
    let _gyroActive = false;
    const gyroHandler = e => {
      if(!running) return;
      const tilt = e.gamma || 0; // -90 (left) to +90 (right)
      leftHeld = tilt < -8;   // tilt left = move left
      rightHeld = tilt > 8;   // tilt right = move right
      _gyroActive = true;
    };
    if(window.DeviceOrientationEvent) {
      if(typeof DeviceOrientationEvent.requestPermission === 'function') {
        // iOS 13+ needs explicit permission - request on tap
        document.getElementById('sw-fire')?.addEventListener('click', ()=>{
          DeviceOrientationEvent.requestPermission().then(p=>{
            if(p==='granted') window.addEventListener('deviceorientation', gyroHandler);
          }).catch(()=>{});
        }, {once:true});
      } else {
        window.addEventListener('deviceorientation', gyroHandler);
      }
    }
    StarWarsGame._cleanup = ()=>{
      window.removeEventListener('keydown',onKey);
      window.removeEventListener('keyup',onKeyUp);
      window.removeEventListener('deviceorientation', gyroHandler);
    };
    const onKey=e=>{if(e.key==='ArrowLeft')leftHeld=true;else if(e.key==='ArrowRight')rightHeld=true;else if(e.key===' ')fire();};
    const onKeyUp=e=>{if(e.key==='ArrowLeft')leftHeld=false;else if(e.key==='ArrowRight')rightHeld=false;};
    window.addEventListener('keydown',onKey);window.addEventListener('keyup',onKeyUp);
    // Enemy auto-fire
    let efTick=0;
    const end=(won)=>{
      running=false;cancelAnimationFrame(animId);
      window.removeEventListener('keydown',onKey);window.removeEventListener('keyup',onKeyUp);
      onComplete({rawScore:Math.min(100,wave*15+Math.round(score/10)),timeMs:Date.now()-tStart,errors:0,passed:wave>=2||won});
    };
    let tick=0;
    const loop=()=>{
      if(!running)return;
      tick++;
      // Move ship
      // Keyboard movement
      if(leftHeld)ship.x=Math.max(15,ship.x-5);
      if(rightHeld)ship.x=Math.min(W-15,ship.x+5);
      // Gyroscope movement (mobile tilt)
      if(typeof _gyroTilt!=='undefined' && Math.abs(_gyroTilt)>2) {
        ship.x=Math.max(15,Math.min(W-15, ship.x + _gyroTilt*0.4));
      }
      // Move stars
      stars_bg.forEach(s=>{s.y+=0.5;if(s.y>H)s.y=0;});
      // Move bullets
      bullets=bullets.filter(b=>{b.y+=b.dy;return b.y>0&&b.y<H;});
      // Enemy fire
      efTick++;
      if(efTick>Math.max(20,60-wave*8)&&enemies.length){efTick=0;const e=enemies[Math.floor(Math.random()*enemies.length)];bullets.push({x:e.x,y:e.y+10,dy:4,enemy:true});}
      // Move enemies
      let edgeHit=false;
      enemies.forEach(e=>{e.x+=e.dx;e.y+=e.dy*0.3;if(e.x<20||e.x>W-20)edgeHit=true;});
      if(edgeHit)enemies.forEach(e=>{e.dx*=-1;e.y+=8;});
      // Bullet collisions
      bullets=bullets.filter(b=>{
        if(!b.enemy){
          let hit=false;
          enemies=enemies.filter(e=>{
            if(!hit&&Math.abs(b.x-e.x)<18&&Math.abs(b.y-e.y)<18){
              e.hp--;hit=true;
              if(e.hp<=0){score+=10*(e.type+1);explosions.push({x:e.x,y:e.y,t:15});return false;}
            }return true;
          });
          return !hit;
        } else {
          if(Math.abs(b.x-ship.x)<20&&Math.abs(b.y-ship.y)<20){lives--;explosions.push({x:ship.x,y:ship.y,t:20});if(lives<=0){end(false);}return false;}
          return true;
        }
      });
      explosions=explosions.map(e=>({...e,t:e.t-1})).filter(e=>e.t>0);
      // Enemy reaches bottom
      if(enemies.some(e=>e.y>H-60)){end(false);return;}
      // Wave clear
      if(!enemies.length){wave++;if(wave>5){end(true);return;}spawnWave();}
      // Time limit
      if(Date.now()-tStart>120000){end(score>100);}
      // Draw
      // Deep space background
      const bgG=ctx.createLinearGradient(0,0,0,H);bgG.addColorStop(0,'#010015');bgG.addColorStop(1,'#020025');
      ctx.fillStyle=bgG;ctx.fillRect(0,0,W,H);
      // Stars with depth
      stars_bg.forEach(s=>{
        const alpha=0.4+s.s*0.2;
        ctx.fillStyle=`rgba(255,255,255,${alpha})`;ctx.beginPath();ctx.arc(s.x,s.y,s.s*.5,0,Math.PI*2);ctx.fill();
      });
      // Nebula effect
      const neb=ctx.createRadialGradient(W*.3,H*.4,0,W*.3,H*.4,W*.4);
      neb.addColorStop(0,'rgba(80,0,120,.08)');neb.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=neb;ctx.fillRect(0,0,W,H);

      // Enemies - spaceships
      const eGlows=['rgba(231,76,60,.5)','rgba(230,126,34,.5)','rgba(155,89,182,.5)'];
      enemies.forEach(e=>{
        // Glow
        const eg=ctx.createRadialGradient(e.x,e.y,0,e.x,e.y,18);
        eg.addColorStop(0,eGlows[e.type]||eGlows[0]);eg.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=eg;ctx.fillRect(e.x-18,e.y-18,36,36);
        // Ship body
        const eBase=['#ff4444','#ff8c00','#9b59b6'][e.type]||'#ff4444';
        ctx.fillStyle=eBase;
        ctx.beginPath();ctx.moveTo(e.x,e.y+12);ctx.lineTo(e.x+14,e.y-10);ctx.lineTo(e.x,e.y-4);ctx.lineTo(e.x-14,e.y-10);ctx.closePath();ctx.fill();
        // Wings
        ctx.fillStyle=eBase+'aa';
        ctx.beginPath();ctx.moveTo(e.x-14,e.y-10);ctx.lineTo(e.x-22,e.y+8);ctx.lineTo(e.x-8,e.y+4);ctx.closePath();ctx.fill();
        ctx.beginPath();ctx.moveTo(e.x+14,e.y-10);ctx.lineTo(e.x+22,e.y+8);ctx.lineTo(e.x+8,e.y+4);ctx.closePath();ctx.fill();
        // Cockpit
        ctx.fillStyle='rgba(200,240,255,.8)';ctx.beginPath();ctx.ellipse(e.x,e.y-2,5,4,0,0,Math.PI*2);ctx.fill();
        // Engine glow
        ctx.fillStyle=`rgba(255,200,0,${.5+Math.sin(tick*.2)*.3})`;ctx.beginPath();ctx.arc(e.x,e.y+14,3,0,Math.PI*2);ctx.fill();
      });

      // Player ship
      const sx=ship.x,sy=ship.y;
      // Engine glow
      const eng=ctx.createRadialGradient(sx,sy+14,0,sx,sy+14,22);
      eng.addColorStop(0,'rgba(0,200,255,.9)');eng.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=eng;ctx.fillRect(sx-22,sy,44,30);
      // Flame
      ctx.fillStyle=`rgba(0,200,255,${.7+Math.sin(tick*.3)*.3})`;
      ctx.beginPath();ctx.moveTo(sx-8,sy+12);ctx.lineTo(sx+8,sy+12);ctx.lineTo(sx,sy+20+Math.sin(tick*.4)*4);ctx.closePath();ctx.fill();
      // Hull
      const hg=ctx.createLinearGradient(sx-18,sy-18,sx+18,sy+12);
      hg.addColorStop(0,'#d4e4ff');hg.addColorStop(.5,'#9ab0e0');hg.addColorStop(1,'#506090');
      ctx.fillStyle=hg;
      ctx.beginPath();ctx.moveTo(sx,sy-18);ctx.bezierCurveTo(sx+12,sy-8,sx+18,sy,sx+14,sy+10);ctx.lineTo(sx-14,sy+10);ctx.bezierCurveTo(sx-18,sy,sx-12,sy-8,sx,sy-18);ctx.closePath();ctx.fill();
      // Wings
      ctx.fillStyle='#4060a0';
      ctx.beginPath();ctx.moveTo(sx+14,sy+8);ctx.lineTo(sx+30,sy+18);ctx.lineTo(sx+20,sy+20);ctx.lineTo(sx+10,sy+10);ctx.closePath();ctx.fill();
      ctx.beginPath();ctx.moveTo(sx-14,sy+8);ctx.lineTo(sx-30,sy+18);ctx.lineTo(sx-20,sy+20);ctx.lineTo(sx-10,sy+10);ctx.closePath();ctx.fill();
      // Cockpit dome
      const cg=ctx.createRadialGradient(sx-3,sy-10,0,sx,sy-8,9);
      cg.addColorStop(0,'rgba(200,240,255,.95)');cg.addColorStop(1,'rgba(80,160,255,.4)');
      ctx.fillStyle=cg;ctx.beginPath();ctx.ellipse(sx,sy-8,9,8,0,0,Math.PI*2);ctx.fill();
      // Shield bar
      ctx.strokeStyle='rgba(0,200,255,.3)';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.ellipse(sx,sy,26,20,0,0,Math.PI*2);ctx.stroke();

      // Bullets
      bullets.forEach(b=>{
        if(!b.enemy){
          const bg2=ctx.createLinearGradient(b.x,b.y,b.x,b.y+12);
          bg2.addColorStop(0,'rgba(0,255,255,0)');bg2.addColorStop(.5,'#0ff');bg2.addColorStop(1,'rgba(0,255,255,0)');
          ctx.fillStyle=bg2;ctx.fillRect(b.x-2.5,b.y-8,5,16);
          ctx.fillStyle='rgba(0,255,255,.3)';ctx.beginPath();ctx.ellipse(b.x,b.y,5,3,0,0,Math.PI*2);ctx.fill();
        } else {
          const rb=ctx.createLinearGradient(b.x,b.y,b.x,b.y+12);
          rb.addColorStop(0,'rgba(255,50,0,0)');rb.addColorStop(.5,'#f80');rb.addColorStop(1,'rgba(255,50,0,0)');
          ctx.fillStyle=rb;ctx.fillRect(b.x-2,b.y-6,4,12);
        }
      });

      // Explosions
      explosions.forEach(e=>{
        const ep=ctx.createRadialGradient(e.x,e.y,0,e.x,e.y,22-e.t);
        ep.addColorStop(0,`rgba(255,220,0,${e.t/20})`);ep.addColorStop(.5,`rgba(255,80,0,${e.t/30})`);ep.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=ep;ctx.beginPath();ctx.arc(e.x,e.y,22-e.t,0,Math.PI*2);ctx.fill();
      });

      // HUD
      ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(0,0,W,26);
      ctx.fillStyle='#fff';ctx.font=`bold ${Math.max(12,W*.034)}px monospace`;ctx.textAlign='left';
      ctx.fillText('⭐ '+score,8,18);
      ctx.textAlign='right';
      for(let i=0;i<lives;i++){ctx.fillStyle='#e74c3c';ctx.beginPath();const hx=W-10-i*22,hy=12;ctx.moveTo(hx,hy+4);ctx.bezierCurveTo(hx,hy,hx-7,hy,hx-7,hy+5);ctx.bezierCurveTo(hx-7,hy+10,hx,hy+14,hx,hy+14);ctx.bezierCurveTo(hx,hy+14,hx+7,hy+10,hx+7,hy+5);ctx.bezierCurveTo(hx+7,hy,hx,hy,hx,hy+4);ctx.fill();}
      ctx.textAlign='center';ctx.fillStyle='#FFD700';ctx.font=`bold ${Math.max(11,W*.032)}px monospace`;
      ctx.fillText('WELLE '+wave,W/2,18);
      animId=requestAnimationFrame(loop);
    };
    loop();
  }
};
window.StarWarsGame=StarWarsGame;
