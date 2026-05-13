// RACE - Hill Climb style, salto scoring
// Goal: reach finish = 500pts. Each 360° salto = +500pts bonus.
const StuntGame = {
  start({onComplete}) {
    const el = document.getElementById('game-area');
    if (!el) return;
    const W=400, H=340;
    const isMobile = 'ontouchstart' in window;

    el.innerHTML = `
    <div style="text-align:center">
      <canvas id="stcv" width="${W}" height="${H}" style="border-radius:8px;max-width:100%;display:block;margin:0 auto"></canvas>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px;margin-top:8px;max-width:360px;margin-left:auto;margin-right:auto">
        <button id="st-rotdn" style="background:linear-gradient(135deg,#6C3483,#8E44AD);color:#fff;border:none;padding:14px 8px;border-radius:10px;font-size:1.1rem;font-weight:900;cursor:pointer;user-select:none;touch-action:none">↺</button>
        <button id="st-back"  style="background:linear-gradient(135deg,#E74C3C,#C0392B);color:#fff;border:none;padding:14px 8px;border-radius:10px;font-size:1rem;font-weight:900;cursor:pointer;user-select:none;touch-action:none">◀</button>
        <button id="st-fwd"   style="background:linear-gradient(135deg,#27AE60,#1E8449);color:#fff;border:none;padding:14px 8px;border-radius:10px;font-size:1rem;font-weight:900;cursor:pointer;user-select:none;touch-action:none">▶</button>
        <button id="st-rotup" style="background:linear-gradient(135deg,#8E44AD,#9B59B6);color:#fff;border:none;padding:14px 8px;border-radius:10px;font-size:1.1rem;font-weight:900;cursor:pointer;user-select:none;touch-action:none">↻</button>
      </div>
      <div style="font-size:.68rem;color:rgba(255,255,255,.35);margin-top:4px">↺ ↻ = Drehen in der Luft · ◀ = Rückwärts · ▶ = Gas</div>
    </div>`;

    const cv=document.getElementById('stcv'), ctx=cv.getContext('2d');
    const WORLD_W=12000, GOAL=WORLD_W;

    // Generate smooth terrain with jumps
    let terrain=[];
    let ty=H*0.58;
    for(let x=0;x<=WORLD_W+200;x+=6){
      const hump=Math.sin(x*0.009)*30+Math.sin(x*0.004)*55+Math.sin(x*0.025)*12;
      terrain.push({x,y:H*0.65+hump});
    }
    const getTY=wx=>{
      const idx=Math.floor(wx/6);
      if(idx<0)return H*0.6;
      if(idx>=terrain.length-1)return terrain[terrain.length-1].y;
      const t=(wx/6)-idx;
      return terrain[idx].y*(1-t)+terrain[idx+1].y*t;
    };
    const getAngle=wx=>{
      const y1=getTY(wx-8),y2=getTY(wx+8);
      return Math.atan2(y2-y1,16);
    };

    let car={
      wx:150, wy:getTY(150)-14,
      vx:0, vy:0,
      angle:0, spin:0,
      onGround:false, airTime:0,
      landingFrames:0,
      saltoRot:0, saltos:0, saltoFlash:0,
      gasTime:0,
    };
    const fwd={v:false},back={v:false},rotup={v:false},rotdn={v:false};
    let running=true, tStart=Date.now(), animId, frames=0;
    const CAM_X=W*0.28;
    let score=0, maxX=0;

    // Button wiring
    const wire=(id,hold)=>{
      const b=document.getElementById(id); if(!b)return;
      b.addEventListener('pointerdown',e=>{e.preventDefault();hold.v=true;});
      b.addEventListener('pointerup',()=>hold.v=false);
      b.addEventListener('pointercancel',()=>hold.v=false);
    };
    wire('st-fwd',fwd);wire('st-back',back);wire('st-rotup',rotup);wire('st-rotdn',rotdn);
    const onKey=e=>{
      if(e.key==='ArrowRight')fwd.v=true;
      else if(e.key==='ArrowLeft')back.v=true;
      else if(e.key==='ArrowUp')rotup.v=true;
      else if(e.key==='ArrowDown')rotdn.v=true;
    };
    const onKeyUp=e=>{
      if(e.key==='ArrowRight')fwd.v=false;
      else if(e.key==='ArrowLeft')back.v=false;
      else if(e.key==='ArrowUp')rotup.v=false;
      else if(e.key==='ArrowDown')rotdn.v=false;
    };
    window.addEventListener('keydown',onKey);
    window.addEventListener('keyup',onKeyUp);

    // Salto sound
    const playSaltoSound=()=>{
      try{
        const ac=new(window.AudioContext||window.webkitAudioContext)();
        const o=ac.createOscillator(),g=ac.createGain();
        o.type='square';
        [523,659,784,1047].forEach((f,i)=>o.frequency.setValueAtTime(f,ac.currentTime+i*0.12));
        g.gain.setValueAtTime(0.15,ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.6);
        o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+0.6);
      }catch(e){}
    };

    const end=(won)=>{
      if(!running)return;
      running=false;
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown',onKey);
      window.removeEventListener('keyup',onKeyUp);
      const t=Date.now()-tStart;
      // Scoring: finish=500, each salto=500
      // rawScore = min(100, total_points/10) for calibration
      const totalPts = (won?500:0) + car.saltos*500;
      const rawScore = Math.min(100, Math.round(totalPts/10));
      onComplete({rawScore, timeMs:t, errors:0, passed:won||car.saltos>0, saltos:car.saltos});
    };

    const loop=()=>{
      if(!running)return;
      frames++;
      const terrY=getTY(car.wx);
      const terrAng=getAngle(car.wx);
      const onGround=car.wy>=terrY-18;

      if(onGround){
        car.wy=terrY-14;
        car.vy=0;
        car.onGround=true;
        car.landingFrames++;
        car.airTime=0;
        car.saltoRot=0;
        // Snap angle to terrain
        car.angle+=(terrAng-car.angle)*0.4;
        // Aggressive spin damping on ground
        car.spin*=0.35;
        // Gas
        if(fwd.v){
          car.gasTime++;
          const boost=Math.min(3.5,1+car.gasTime*0.01);
          car.vx+=Math.cos(terrAng)*boost;
        } else { car.gasTime=Math.max(0,car.gasTime-3); }
        if(back.v){ car.vx-=Math.cos(terrAng)*0.7; car.gasTime=0; }
        car.vx*=0.84;
      } else {
        car.onGround=false;
        car.landingFrames=0;
        car.airTime++;
        // Very light gravity for long hang time
        car.vy+=0.08;
        // Light air damping - allows free rotation
        car.spin*=0.985;
        // Track salto rotation
        car.saltoRot+=Math.abs(car.spin);
        if(car.saltoRot>=Math.PI*2){
          car.saltoRot-=Math.PI*2;
          car.saltos++;
          car.saltoFlash=30;
          score+=500;
          playSaltoSound();
        }
      }

      // Rotation buttons (only meaningful in air)
      if(rotup.v) car.spin+=0.012;
      if(rotdn.v) car.spin-=0.012;
      car.spin=Math.max(-0.12,Math.min(0.12,car.spin));
      car.angle+=car.spin;

      // Speed cap
      car.vx=Math.max(-10,Math.min(16,car.vx));
      car.wx+=car.vx;
      car.wy+=car.vy;

      // Crash: if upside down on ground after short grace period
      const norm=((car.angle%(Math.PI*2))+Math.PI*2)%(Math.PI*2);
      const trulyUpsideDown=norm>Math.PI*0.72&&norm<Math.PI*1.28;
      const noGrace=car.landingFrames>12; // 12 frames = ~0.2 seconds to correct
      if(onGround && trulyUpsideDown && noGrace){ end(false); return; }
      // Fell off bottom or left
      if(car.wy>H+100||car.wx<-80){ end(false); return; }
      // Reached goal
      if(car.wx>=GOAL){ end(true); return; }
      if(car.wx>maxX){ maxX=car.wx; }

      // ====== DRAW ======
      const camWX=car.wx-CAM_X;
      // Fill canvas completely first (prevent any bleed)
      ctx.fillStyle='#0d001a';ctx.fillRect(0,0,W,H);
      // Night sky gradient
      const sky=ctx.createLinearGradient(0,0,0,H);
      sky.addColorStop(0,'#0d001a');sky.addColorStop(0.5,'#1a0033');sky.addColorStop(1,'#0f001a');
      ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
      // Stars
      if(frames%3===0){ctx.fillStyle='rgba(255,255,255,.3)';for(let i=0;i<20;i++){const sx=(i*173)%W,sy=(i*97)%(H*0.5);ctx.fillRect(sx,sy,1,1);}}
      // Moon
      ctx.fillStyle='rgba(255,220,100,.8)';ctx.beginPath();ctx.arc(W*0.82,35,18,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#0d001a';ctx.beginPath();ctx.arc(W*0.82+8,30,15,0,Math.PI*2);ctx.fill();

      // Ground
      ctx.fillStyle='#1a3a0f';ctx.beginPath();ctx.moveTo(0,H);
      for(let sx=0;sx<=W;sx+=6){ctx.lineTo(sx,getTY(camWX+sx));}
      ctx.lineTo(W,H);ctx.closePath();ctx.fill();
      ctx.strokeStyle='#2d6b1f';ctx.lineWidth=3;ctx.beginPath();
      for(let sx=0;sx<=W;sx+=6){const y=getTY(camWX+sx);if(sx===0)ctx.moveTo(sx,y);else ctx.lineTo(sx,y);}
      ctx.stroke();

      // Goal flag
      const gsx=GOAL-camWX;
      if(gsx>0&&gsx<W){
        const gy=getTY(GOAL);
        ctx.fillStyle='#fff';ctx.fillRect(gsx-1,gy-80,3,80);
        ctx.fillStyle='#E74C3C';ctx.fillRect(gsx,gy-80,28,20);
        ctx.fillStyle='#fff';ctx.font='bold 9px sans-serif';ctx.textAlign='left';
        ctx.fillText('ZIEL +500',gsx+2,gy-65);
      }
      // Checkpoints
      for(let cx=2000;cx<WORLD_W;cx+=2000){
        const csx=cx-camWX;
        if(csx>0&&csx<W){const cy=getTY(cx);ctx.fillStyle='rgba(255,215,0,.35)';ctx.fillRect(csx-1,cy-40,2,40);}
      }

      // Car
      ctx.save();ctx.translate(CAM_X,car.wy);ctx.rotate(car.angle);
      ctx.fillStyle='#E74C3C';
      if(ctx.roundRect)ctx.roundRect(-22,-14,44,18,4);else ctx.rect(-22,-14,44,18);
      ctx.fill();
      ctx.fillStyle='#C0392B';
      if(ctx.roundRect)ctx.roundRect(-14,-24,28,12,3);else ctx.rect(-14,-24,28,12);
      ctx.fill();
      ctx.fillStyle='rgba(150,230,255,.7)';ctx.fillRect(-10,-22,20,9);
      [[-14,4],[14,4]].forEach(([wx,wy])=>{
        ctx.fillStyle='#222';ctx.beginPath();ctx.arc(wx,wy,7,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#888';ctx.lineWidth=2;ctx.stroke();
        ctx.strokeStyle='#aaa';ctx.lineWidth=1;ctx.beginPath();
        ctx.moveTo(wx,wy-5);ctx.lineTo(wx,wy+5);ctx.stroke();
      });
      if(fwd.v){ctx.fillStyle='rgba(255,120,0,.6)';ctx.fillRect(-28,-4,8,4);}
      ctx.restore();

      // Salto flash
      if(car.saltoFlash>0){
        car.saltoFlash--;
        ctx.fillStyle=`rgba(255,215,0,${car.saltoFlash/30*0.45})`;
        ctx.fillRect(0,0,W,H);
      }

      // HUD
      const distPct=Math.min(1,car.wx/GOAL);
      const elapsed=((Date.now()-tStart)/1000).toFixed(1);
      ctx.fillStyle='rgba(0,0,0,.8)';ctx.fillRect(0,0,W,32);
      // Progress bar
      ctx.fillStyle='rgba(255,255,255,.1)';ctx.fillRect(0,29,W,3);
      ctx.fillStyle='#27AE60';ctx.fillRect(0,29,W*distPct,3);
      ctx.font='bold 12px monospace';ctx.textAlign='left';
      ctx.fillStyle='#fff';ctx.fillText('⏱ '+elapsed+'s',6,20);
      ctx.textAlign='center';
      ctx.fillStyle='#FFD700';
      const ptsStr = (car.wx>=GOAL?'🏁 ':'')+((car.saltos?`🔄×${car.saltos} `:'')+(car.wx>=GOAL?'500pts':'')+(car.saltos?`+${car.saltos*500}pts`:''));
      ctx.fillText(ptsStr||'🏁 ziel=500pts · salto=+500pts',W/2,20);
      ctx.textAlign='right';
      const spd=Math.abs(car.vx*3.6).toFixed(0);
      ctx.fillStyle='#29B6F6';ctx.fillText('⚡'+spd,W-6,20);

      // Gas bar
      if(car.gasTime>5){
        const gp=Math.min(1,car.gasTime/350);
        const gc=ctx.createLinearGradient(0,0,W,0);
        gc.addColorStop(0,'#27AE60');gc.addColorStop(0.6,'#F39C12');gc.addColorStop(1,'#E74C3C');
        ctx.fillStyle=gc;ctx.fillRect(0,H-5,W*gp,5);
        if(gp>0.8){ctx.fillStyle='rgba(255,100,0,.2)';ctx.fillRect(0,0,W,H);}
      }

      // Salto counter bottom
      if(car.saltos>0){
        ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(0,H-24,W,24);
        ctx.fillStyle='#FFD700';ctx.font='bold 13px monospace';ctx.textAlign='left';
        ctx.fillText(`🔄 ${car.saltos} Salto${car.saltos>1?'s':''}! +${car.saltos*500} Bonus-Punkte`,6,H-6);
      }

      animId=requestAnimationFrame(loop);
    };
    loop();
    setTimeout(()=>{if(running)end(false);},240000);
  }
};
window.StuntGame=StuntGame;
// Add salto animation CSS
if(!document.getElementById('salto-css')){
  const s=document.createElement('style');
  s.id='salto-css';
  s.textContent='@keyframes saltoFlash{0%{opacity:1}100%{opacity:0}}';
  document.head.appendChild(s);
}
