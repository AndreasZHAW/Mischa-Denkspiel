// RACE - Hill Climb style physics
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
        <button id="st-back"  style="background:linear-gradient(135deg,#E74C3C,#C0392B);color:#fff;border:none;padding:14px 8px;border-radius:10px;font-size:1rem;font-weight:900;cursor:pointer;user-select:none;touch-action:none">◀ Gas R</button>
        <button id="st-fwd"   style="background:linear-gradient(135deg,#27AE60,#1E8449);color:#fff;border:none;padding:14px 8px;border-radius:10px;font-size:1rem;font-weight:900;cursor:pointer;user-select:none;touch-action:none">Gas V ▶</button>
        <button id="st-rotup" style="background:linear-gradient(135deg,#8E44AD,#9B59B6);color:#fff;border:none;padding:14px 8px;border-radius:10px;font-size:1.1rem;font-weight:900;cursor:pointer;user-select:none;touch-action:none">↻</button>
      </div>
      <div style="font-size:.68rem;color:rgba(255,255,255,.35);margin-top:4px">↺ ↻ = Drehen · ◀ = Rückwärts · ▶ = Vorwärts</div>
    </div>`;

    const cv=document.getElementById('stcv'), ctx=cv.getContext('2d');
    const WORLD_W=14000, GOAL=WORLD_W;

    // Generate smooth terrain
    let terrain=[];
    let ty=H*0.58;
    for(let x=0;x<=WORLD_W+200;x+=6){
      const hump=Math.sin(x*0.009)*50+Math.sin(x*0.004)*85+Math.sin(x*0.025)*18;
      terrain.push({x,y:H*0.52+hump});
    }
    const getTY=wx=>{
      const idx=Math.floor(wx/6);
      if(idx<0)return H*0.6;
      if(idx>=terrain.length-1)return terrain[terrain.length-1].y;
      const t=(wx/6)-idx;
      return terrain[idx].y*(1-t)+terrain[idx+1].y*t;
    };
    const getAngle=wx=>{
      const y1=getTY(wx-6),y2=getTY(wx+6);
      return Math.atan2(y2-y1,12);
    };

    // Car state - simple Hill Climb style
    let car={
      wx:150, wy:getTY(150)-14,
      vx:0, vy:0,
      angle:0, spin:0,
      onGround:false, airTime:0,
      gasTime:0,       // how long gas has been held
      saltoRot:0,      // accumulated rotation in air
      saltos:0,        // completed saltos
      saltoFlash:0,
    };
    let fwdHeld=false,backHeld=false,rotUpHeld=false,rotDnHeld=false;
    let score=0,maxX=0,running=true,tStart=Date.now(),animId,frames=0;
    const CAM_X=W*0.28;

    // Button wiring
    const wire=(id,hold,ondown,onup)=>{
      const b=document.getElementById(id);if(!b)return;
      b.addEventListener('pointerdown',e=>{e.preventDefault();hold.v=true;if(ondown)ondown();});
      b.addEventListener('pointerup',()=>{hold.v=false;if(onup)onup();});
      b.addEventListener('pointercancel',()=>{hold.v=false;});
    };
    const fwd={v:false},back={v:false},rotup={v:false},rotdn={v:false};
    wire('st-fwd',fwd);wire('st-back',back);wire('st-rotup',rotup);wire('st-rotdn',rotdn);
    fwdHeld=()=>fwd.v; backHeld=()=>back.v; rotUpHeld=()=>rotup.v; rotDnHeld=()=>rotdn.v;
    
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
    window.addEventListener('keydown',onKey);window.addEventListener('keyup',onKeyUp);

    const end=(won)=>{
      running=false;cancelAnimationFrame(animId);
      window.removeEventListener('keydown',onKey);window.removeEventListener('keyup',onKeyUp);
      const t=Date.now()-tStart;
      const saltoBonus=Math.min(40,(car.saltos||0)*10);const timeScore=won?Math.max(10,Math.min(100,100-Math.floor(t/1000)*1.5+saltoBonus)):Math.round(car.wx/GOAL*40)+saltoBonus;
      onComplete({rawScore:Math.min(100,timeScore),timeMs:t,errors:0,passed:won,saltos:car.saltos||0});
    };

    const loop=()=>{
      if(!running)return;
      frames++;
      const terrY=getTY(car.wx);
      const terrAng=getAngle(car.wx);
      const onGround=car.wy>=terrY-16;

      if(onGround){
        car.wy=terrY-16;
        // Check landing - was airborne?
        if(!car.onGround && car.airTime > 8) {
          // Check for salto (full rotation in air)
          const fullRotations = Math.abs(car.totalAirSpin||0) / (Math.PI*2);
          if(fullRotations >= 0.9) {
            const saltoBonus = Math.floor(fullRotations)*500;
            score += saltoBonus;
            // Show salto toast
            if(typeof ZP !== 'undefined') ZP&&ZP.toast;
            const toast=document.createElement('div');
            toast.style.cssText='position:fixed;top:30%;left:50%;transform:translateX(-50%);z-index:9999;background:linear-gradient(135deg,#FFD700,#FFA500);color:#000;font-weight:900;font-size:1.2rem;padding:10px 24px;border-radius:30px;pointer-events:none;animation:saltoFade 1.8s ease forwards';
            toast.textContent=(fullRotations>=1.8?'🔄🔄 DOPPEL-SALTO! +'+saltoBonus:'🔄 SALTO! +'+saltoBonus);
            document.body.appendChild(toast);
            setTimeout(()=>toast.remove(),1800);
          }
          car.totalAirSpin=0;
        }
        car.vy=0;car.onGround=true;car.airTime=0;
        car.angle+=(terrAng-car.angle)*0.18;
        car.spin*=0.65;
        // Progressive acceleration: faster the longer gas is held
        if(fwdHeld()){
          car.gasTime++;
          const gasMult=Math.min(3.0, 1.0 + car.gasTime*0.008); // builds up to 3x
          car.vx+=Math.cos(terrAng)*gasMult;
        } else { car.gasTime=Math.max(0,car.gasTime-2); } // release slows buildup
        if(backHeld()){ car.vx-=Math.cos(terrAng)*0.7; car.gasTime=0; }
        if(backHeld()) car.vx-=Math.cos(terrAng)*0.55;
        car.vx*=0.86;
      } else {
        const wasOnGround = car.onGround;
        car.onGround=false;
        car.airTime++;
        car.vy+=0.22; // MUCH less gravity = better jumps
        car.spin*=0.97; // barely any air damping = can do saltos
      }
      // Rotation - faster in air for saltos
      const inAir = !car.onGround;
      const rotSpeed = inAir ? 0.025 : 0.010; // faster in air
      if(rotUpHeld()) car.spin+=rotSpeed;
      if(rotDnHeld()) car.spin-=rotSpeed;
      car.spin=Math.max(-0.18,Math.min(0.18,car.spin)); // higher cap for saltos
      car.angle+=car.spin;
      // Track total spin in air
      if(inAir) car.totalAirSpin=(car.totalAirSpin||0)+car.spin;
      else car.totalAirSpin=0;
      
      // Speed cap
      car.vx=Math.max(-12,Math.min(14,car.vx));
      car.wx+=car.vx;car.wy+=car.vy;

      // Flip check - only if significantly upside down AND on ground
      const norm=((car.angle%(Math.PI*2))+Math.PI*2)%(Math.PI*2);
      // Only end on flip if on ground AND spin has almost stopped
      // This allows landing after a salto (spin settles quickly due to ground damping)
      if(onGround && Math.abs(car.spin)<0.08 && norm>Math.PI*0.75&&norm<Math.PI*1.25){end(false);return;}
      // Also end if completely upside down in air for too long
      if(!onGround && car.airTime>30 && norm>Math.PI*0.8&&norm<Math.PI*1.2){end(false);return;}
      if(car.wy>H+80||car.wx<-50){end(false);return;}
      if(car.wx>=GOAL){end(true);return;}
      if(car.wx>maxX){maxX=car.wx;score=Math.round((maxX-150)/10);}

      // Draw
      const camWX=car.wx-CAM_X;
      // Sky gradient
      const sky=ctx.createLinearGradient(0,0,0,H);
      sky.addColorStop(0,'#0d001a');sky.addColorStop(0.6,'#1a0033');sky.addColorStop(1,'#2d0050');
      ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
      // Stars
      if(frames%2===0){ctx.fillStyle='rgba(255,255,255,.3)';for(let i=0;i<25;i++){const sx=(i*173)%W,sy=(i*97)%H*0.55;ctx.fillRect(sx,sy,1,1);}}
      // Moon
      ctx.fillStyle='rgba(255,220,100,.8)';ctx.beginPath();ctx.arc(W*0.82,35,18,0,Math.PI*2);ctx.fill();
      // Ground terrain
      ctx.fillStyle='#1a3a0f';ctx.beginPath();ctx.moveTo(0,H);
      for(let sx=0;sx<=W;sx+=6){ctx.lineTo(sx,getTY(camWX+sx));}
      ctx.lineTo(W,H);ctx.closePath();ctx.fill();
      // Grass top
      ctx.strokeStyle='#2d6b1f';ctx.lineWidth=3;ctx.beginPath();
      for(let sx=0;sx<=W;sx+=6){
        const y=getTY(camWX+sx);
        if(sx===0)ctx.moveTo(sx,y);else ctx.lineTo(sx,y);
      }ctx.stroke();
      // Goal flag
      const gsx=GOAL-camWX;
      if(gsx>0&&gsx<W){
        const gy=getTY(GOAL);
        ctx.fillStyle='#fff';ctx.fillRect(gsx-1,gy-70,3,70);
        ctx.fillStyle='#E74C3C';ctx.fillRect(gsx,gy-70,24,16);
        ctx.fillStyle='#fff';ctx.font='bold 9px sans-serif';ctx.textAlign='left';ctx.fillText('ZIEL',gsx+2,gy-58);
      }
      // Checkpoints (every 200m)
      for(let cx=2000;cx<WORLD_W;cx+=2000){
        const csx=cx-camWX;
        if(csx>0&&csx<W){
          const cy=getTY(cx);
          ctx.fillStyle='rgba(255,215,0,.4)';ctx.fillRect(csx-1,cy-40,2,40);
          ctx.fillStyle='rgba(255,215,0,.7)';ctx.font='9px sans-serif';ctx.textAlign='center';
          ctx.fillText(Math.round(cx/10)+'m',csx,cy-42);
        }
      }
      // Car
      ctx.save();ctx.translate(CAM_X,car.wy);ctx.rotate(car.angle);
      // Body
      ctx.fillStyle='#E74C3C';ctx.beginPath();if(ctx.roundRect)ctx.roundRect(-22,-14,44,18,4);else ctx.rect(-22,-14,44,18);ctx.fill();
      // Roof
      ctx.fillStyle='#C0392B';ctx.beginPath();if(ctx.roundRect)ctx.roundRect(-14,-24,28,12,3);else ctx.rect(-14,-24,28,12);ctx.fill();
      // Window
      ctx.fillStyle='rgba(150,230,255,.7)';ctx.fillRect(-10,-22,20,9);
      // Wheels
      [[-14,4],[14,4]].forEach(([wx,wy])=>{
        ctx.fillStyle='#222';ctx.beginPath();ctx.arc(wx,wy,7,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#888';ctx.lineWidth=2;ctx.stroke();
        // Spinning hub
        ctx.strokeStyle='#aaa';ctx.lineWidth=1;ctx.beginPath();
        ctx.moveTo(wx,wy-5);ctx.lineTo(wx,wy+5);ctx.stroke();
      });
      if(fwdHeld()){ctx.fillStyle='rgba(255,120,0,.5)';ctx.fillRect(-26,-6,8,5);}
      ctx.restore();
      // HUD
      const distLeft=Math.max(0,GOAL-car.wx);
      const kmLeft=(distLeft/WORLD_W).toFixed(3);
      const spd=Math.abs(car.vx*3.5).toFixed(0);
      const elapsed=((Date.now()-tStart)/1000).toFixed(1);
      ctx.fillStyle='rgba(0,0,0,.75)';ctx.fillRect(0,0,W,30);
      const prog=car.wx/GOAL;
      ctx.fillStyle='rgba(255,255,255,.1)';ctx.fillRect(0,27,W,3);
      ctx.fillStyle=prog>0.8?'#E74C3C':prog>0.4?'#F39C12':'#27AE60';ctx.fillRect(0,27,W*prog,3);
      ctx.fillStyle='#fff';ctx.font='bold 12px monospace';ctx.textAlign='left';ctx.fillText('⏱ '+elapsed+'s',6,19);
      ctx.textAlign='center';ctx.fillStyle='#FFD700';ctx.fillText('🏁 '+kmLeft+' km',W/2,19);
      ctx.textAlign='right';ctx.fillStyle='#29B6F6';ctx.fillText('⚡'+spd+' km/h',W-6,19);
      // Gas level indicator
      if(car.gasTime>10){
        const gasPct=Math.min(1,car.gasTime/375);
        ctx.fillStyle='rgba(0,0,0,.4)';ctx.fillRect(0,H-8,W,8);
        const gc=ctx.createLinearGradient(0,0,W,0);
        gc.addColorStop(0,'#27AE60');gc.addColorStop(0.5,'#F39C12');gc.addColorStop(1,'#E74C3C');
        ctx.fillStyle=gc;ctx.fillRect(0,H-8,W*gasPct,8);
        ctx.fillStyle='#fff';ctx.font='7px monospace';ctx.textAlign='center';
        ctx.fillText('GAS TURBO',W/2,H-1);
      }
      if(car.saltos>0){
        ctx.textAlign='left';ctx.fillStyle='#FFD700';ctx.font='bold 11px monospace';
        ctx.fillText('🔄 ×'+car.saltos+' Salto! +'+car.saltos*50+'pts',6,H-6);
      }
      if(car.saltoFlash>0){car.saltoFlash--;ctx.fillStyle='rgba(255,215,0,'+(car.saltoFlash/25)*0.5+')';ctx.fillRect(0,0,W,H);}
      // Show salto bonus if any
      if(score>0){ctx.textAlign='center';ctx.fillStyle='#FFD700';ctx.fillText('🌀 '+score+' pts',W/2,H-8);}
      animId=requestAnimationFrame(loop);
    };
    loop();
    setTimeout(()=>{if(running)end(false);},240000);
  }
};
// Add salto animation CSS
if(!document.getElementById('salto-css')){
  const s=document.createElement('style');s.id='salto-css';
  s.textContent='@keyframes saltoFade{0%{opacity:0;transform:translateX(-50%) scale(.5)}20%{opacity:1;transform:translateX(-50%) scale(1.2)}80%{opacity:1;transform:translateX(-50%) scale(1)}100%{opacity:0;transform:translateX(-50%) scale(.8) translateY(-30px)}}';
  document.head.appendChild(s);
}
window.StuntGame=StuntGame;
