// STAR WARS SPACE SHOOTER - replaces Memory II
const StarWarsGame = {
  start({onComplete}) {
    const el = document.getElementById('game-area');
    if (!el) return;
    const W=400,H=500;
    el.innerHTML=`<div style="text-align:center;touch-action:none;user-select:none;-webkit-user-select:none">
      <canvas id="swcv" width="${W}" height="${H}" style="background:#000;border-radius:8px;width:100%;max-width:${W}px;height:auto;display:block;margin:0 auto;touch-action:none;user-select:none"></canvas>
      <div style="display:flex;justify-content:column;gap:6px;margin-top:8px"><div style="text-align:center;font-size:.7rem;color:rgba(255,215,0,.6);margin-bottom:4px">📱 Handy kippen = Steuern · 🔥 = Schiessen</div><div style="display:flex;justify-content:center;gap:12px">
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
      ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
      stars_bg.forEach(s=>{ctx.fillStyle=`rgba(255,255,255,${s.s/3})`;ctx.beginPath();ctx.arc(s.x,s.y,s.s/2,0,Math.PI*2);ctx.fill();});
      // Enemies
      const eColors=['#E74C3C','#E67E22','#9B59B6'];
      enemies.forEach(e=>{
        ctx.fillStyle=eColors[e.type]||'#f00';ctx.beginPath();
        ctx.moveTo(e.x,e.y-10);ctx.lineTo(e.x+12,e.y+10);ctx.lineTo(e.x-12,e.y+10);ctx.closePath();ctx.fill();
        ctx.fillStyle='#fff';ctx.font='16px serif';ctx.textAlign='center';ctx.fillText('👾',e.x,e.y+8);
      });
      // Ship
      ctx.fillStyle='#FFD700';ctx.beginPath();ctx.moveTo(ship.x,ship.y-15);ctx.lineTo(ship.x+16,ship.y+10);ctx.lineTo(ship.x-16,ship.y+10);ctx.closePath();ctx.fill();
      ctx.fillStyle='#29B6F6';ctx.fillRect(ship.x-6,ship.y,12,8);
      // Bullets
      bullets.forEach(b=>{ctx.fillStyle=b.enemy?'#f00':'#0ff';ctx.fillRect(b.x-2,b.y-6,4,12);});
      // Explosions
      explosions.forEach(e=>{ctx.fillStyle=`rgba(255,150,0,${e.t/20})`;ctx.beginPath();ctx.arc(e.x,e.y,20-e.t,0,Math.PI*2);ctx.fill();});
      // HUD
      ctx.fillStyle='#fff';ctx.font='bold 14px monospace';ctx.textAlign='left';
      ctx.fillText('⭐ '+score,8,20);ctx.textAlign='right';ctx.fillText('❤️'.repeat(lives),W-8,20);
      ctx.textAlign='center';ctx.fillStyle='#FFD700';ctx.fillText('WAVE '+wave,W/2,20);
      animId=requestAnimationFrame(loop);
    };
    loop();
  }
};
window.StarWarsGame=StarWarsGame;
