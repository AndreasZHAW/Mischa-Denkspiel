// RACE - Auto-Stunt-Rennen (ersetzt Jenga)
const StuntGame = {
  start({onComplete}) {
    const el = document.getElementById('game-area');
    if (!el) return;
    const W=400, H=360;

    el.innerHTML = `
    <div style="text-align:center">

      <canvas id="stcv" width="${W}" height="${H}" style="border-radius:8px;max-width:100%;display:block;margin:0 auto"></canvas>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;max-width:340px;margin-left:auto;margin-right:auto">
        <button id="st-rotdn" style="background:linear-gradient(135deg,#6C3483,#8E44AD);color:#fff;border:none;padding:14px;border-radius:10px;font-size:.9rem;font-weight:900;cursor:pointer;user-select:none;touch-action:none">↺ Drehen L</button>
        <button id="st-fwd"   style="background:linear-gradient(135deg,#27AE60,#1E8449);color:#fff;border:none;padding:14px;border-radius:10px;font-size:.9rem;font-weight:900;cursor:pointer;user-select:none;touch-action:none">Gas ▶</button>
        <button id="st-rotup" style="background:linear-gradient(135deg,#8E44AD,#9B59B6);color:#fff;border:none;padding:14px;border-radius:10px;font-size:.9rem;font-weight:900;cursor:pointer;user-select:none;touch-action:none">↻ Drehen R</button>
        <button id="st-back"  style="background:linear-gradient(135deg,#E74C3C,#C0392B);color:#fff;border:none;padding:14px;border-radius:10px;font-size:.9rem;font-weight:900;cursor:pointer;user-select:none;touch-action:none">◀ Bremse</button>
      </div>
      <div style="font-size:.68rem;color:rgba(255,255,255,.35);text-align:center;margin-top:4px">Links: Drehen · Rechts: Gas/Bremse</div>
    </div>`;

    const cv=document.getElementById('stcv'), ctx=cv.getContext('2d');

    // Generate terrain
    const WORLD_W = 12000; // 1km = 12000 units
    const GOAL = WORLD_W;
    let terrainPts = [];
    let ty = H*0.6;
    for(let x=0; x<=WORLD_W+200; x+=8){
      ty += (Math.random()-0.5)*6;
      const hump = Math.sin(x*0.008)*40 + Math.sin(x*0.003)*80 + Math.sin(x*0.02)*20;
      terrainPts.push({x, y: H*0.55 + hump});
    }
    const getTerrainY = wx => {
      const idx = Math.floor(wx/8);
      if(idx<0) return H*0.6;
      if(idx>=terrainPts.length-1) return terrainPts[terrainPts.length-1].y;
      const t=(wx/8)-idx;
      return terrainPts[idx].y*(1-t)+terrainPts[idx+1].y*t;
    };
    const getTerrainAngle = wx => {
      const y1=getTerrainY(wx-4), y2=getTerrainY(wx+4);
      return Math.atan2(y2-y1, 8);
    };

    // Car physics
    let car = {
      wx: 200, // world x
      wy: getTerrainY(200)-20,
      vx: 0, vy: 0,
      angle: 0, av: 0,
      onGround: false, airTime: 0,
    };
    let score=0, running=true, tStart=Date.now(), animId;
    let fwdHeld=false, backHeld=false;
    const CAM_X = W*0.3; // car shown at 30% from left

    // Buttons
    const setFwd=(v)=>{fwdHeld=v;};
    const setBack=(v)=>{backHeld=v;};
    document.getElementById('st-fwd').addEventListener('pointerdown',e=>{e.preventDefault();setFwd(true);});
    document.getElementById('st-back').addEventListener('pointerdown',e=>{e.preventDefault();setBack(true);});
    const stRotUp=document.getElementById('st-rotup');
    const stRotDn=document.getElementById('st-rotdn');
    if(stRotUp){stRotUp.addEventListener('pointerdown',e=>{e.preventDefault();rotUpHeld=true;});stRotUp.addEventListener('pointerup',()=>rotUpHeld=false);}
    if(stRotDn){stRotDn.addEventListener('pointerdown',e=>{e.preventDefault();rotDnHeld=true;});stRotDn.addEventListener('pointerup',()=>rotDnHeld=false);}
    document.addEventListener('pointerup',()=>{setFwd(false);setBack(false);});
    let rotUpHeld=false, rotDnHeld=false;
    const onKey=e=>{
      if(e.key==='ArrowRight') setFwd(true);   // Gas
      else if(e.key==='ArrowLeft') setBack(true); // Bremsen
      else if(e.key==='ArrowUp') rotUpHeld=true;  // Drehen Uhrzeigersinn
      else if(e.key==='ArrowDown') rotDnHeld=true; // Drehen gegen Uhrzeigersinn
    };
    const onKeyUp=e=>{
      if(e.key==='ArrowRight') setFwd(false);
      else if(e.key==='ArrowLeft') setBack(false);
      else if(e.key==='ArrowUp') rotUpHeld=false;
      else if(e.key==='ArrowDown') rotDnHeld=false;
    };
    window.addEventListener('keydown',onKey);window.addEventListener('keyup',onKeyUp);

    const end=(won)=>{
      running=false;cancelAnimationFrame(animId);
      window.removeEventListener('keydown',onKey);window.removeEventListener('keyup',onKeyUp);
      const t=Date.now()-tStart;
      const timeScore = won ? Math.max(10, 100-Math.floor(t/1000)*2) : Math.round(car.wx/GOAL*40);
      onComplete({rawScore:Math.min(100,timeScore),timeMs:t,errors:0,passed:won});
    };

    let frames=0;
    const loop=()=>{
      if(!running)return;
      frames++;

      // Physics
      car.vy += 0.5; // gravity
      const groundY = getTerrainY(car.wx);
      const terrAngle = getTerrainAngle(car.wx);

      if(car.wy >= groundY-16){
        // On ground
        car.wy = groundY-16;
        car.onGround = true;
        car.airTime = 0;
        // Wheel torque
        if(fwdHeld){ car.vx+=Math.cos(terrAngle)*0.8; car.av-=0.05; }
        if(backHeld){ car.vx-=Math.cos(terrAngle)*0.5; car.av+=0.04; }
        // Friction
        car.vx *= 0.85;
        // Normal force aligns car with ground
        car.angle += (terrAngle - car.angle)*0.12;
        car.av *= 0.7;
        car.vy = 0;
      } else {
        car.onGround = false;
        car.airTime++;
        // Air rotation from buttons
        // In air: only rotation buttons work
        if(rotUpHeld) car.av += 0.06;
        if(rotDnHeld) car.av -= 0.06;
        car.av *= 0.95;
      }
      car.angle += car.av;
      car.vx = Math.max(-15, Math.min(18, car.vx));
      car.wx += car.vx;
      car.wy += car.vy;

      // Check flip (angle > 90° from normal)
      const normAng = ((car.angle%(Math.PI*2))+Math.PI*2)%(Math.PI*2);
      if(normAng>Math.PI*0.55&&normAng<Math.PI*1.45&&car.onGround){end(false);return;}

      // Win condition
      if(car.wx >= GOAL){end(true);return;}

      // Draw
      const camWX = car.wx - CAM_X; // world x that maps to screen x=0

      // Sky gradient
      const sky=ctx.createLinearGradient(0,0,0,H);
      sky.addColorStop(0,'#1a0033');sky.addColorStop(1,'#4a0080');
      ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);

      // Stars
      ctx.fillStyle='rgba(255,255,255,.4)';
      for(let i=0;i<30;i++){
        const sx=(i*137+frames)%W, sy=(i*79)%H*0.5;
        ctx.fillRect(sx,sy,1,1);
      }

      // Moon/sun
      ctx.fillStyle='#FFD700';ctx.beginPath();ctx.arc(W*0.85,40,20,0,Math.PI*2);ctx.fill();

      // Ground terrain
      ctx.fillStyle='#2d5016';ctx.beginPath();ctx.moveTo(0,H);
      for(let sx=0;sx<=W;sx+=4){
        const wx=camWX+sx;
        ctx.lineTo(sx,getTerrainY(wx));
      }
      ctx.lineTo(W,H);ctx.closePath();ctx.fill();
      // Grass top
      ctx.strokeStyle='#3d7a1f';ctx.lineWidth=3;ctx.beginPath();
      for(let sx=0;sx<=W;sx+=4){ctx.lineTo(sx,getTerrainY(camWX+sx));}
      ctx.stroke();

      // Goal flag
      const goalSX = GOAL - camWX;
      if(goalSX > 0 && goalSX < W){
        const gy=getTerrainY(GOAL);
        ctx.fillStyle='#fff';ctx.fillRect(goalSX-1,gy-60,3,60);
        ctx.fillStyle='#E74C3C';ctx.fillRect(goalSX,gy-60,20,14);
        ctx.fillStyle='#fff';ctx.font='bold 10px sans-serif';ctx.textAlign='left';ctx.fillText('ZIEL',goalSX+2,gy-50);
      }

      // Car
      ctx.save();
      ctx.translate(CAM_X, car.wy);
      ctx.rotate(car.angle);
      // Body
      ctx.fillStyle='#E74C3C';
      ctx.beginPath();ctx.roundRect(-22,-14,44,18,4);ctx.fill();
      // Roof
      ctx.fillStyle='#C0392B';
      ctx.beginPath();ctx.roundRect(-14,-24,28,12,3);ctx.fill();
      // Window
      ctx.fillStyle='rgba(150,230,255,.7)';
      ctx.fillRect(-10,-22,20,9);
      // Wheels
      [[-14,4],[14,4]].forEach(([wx,wy])=>{
        ctx.fillStyle='#222';ctx.beginPath();ctx.arc(wx,wy,8,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#555';ctx.lineWidth=2;ctx.stroke();
        // Hubcap
        ctx.fillStyle='#888';ctx.beginPath();ctx.arc(wx,wy,4,0,Math.PI*2);ctx.fill();
      });
      // Exhaust (going backwards)
      if(fwdHeld){ctx.fillStyle='rgba(255,150,0,.5)';ctx.fillRect(-26,-4,8,4);}
      ctx.restore();

      // HUD
      const distLeft = Math.max(0, GOAL-car.wx);
      const distKm = (distLeft/WORLD_W).toFixed(3);
      const speed = Math.abs(car.vx*3).toFixed(0);
      const elapsed = ((Date.now()-tStart)/1000).toFixed(1);

      // HUD bar
      ctx.fillStyle='rgba(0,0,0,.75)';ctx.fillRect(0,0,W,34);
      // Progress bar
      const prog=(car.wx/GOAL);
      ctx.fillStyle='rgba(255,255,255,.1)';ctx.fillRect(0,30,W,4);
      ctx.fillStyle=prog>0.8?'#E74C3C':prog>0.5?'#F39C12':'#27AE60';
      ctx.fillRect(0,30,W*prog,4);

      ctx.fillStyle='#fff';ctx.font='bold 13px monospace';
      ctx.textAlign='left';ctx.fillText('⏱ '+elapsed+'s',6,20);
      ctx.textAlign='center';ctx.fillStyle='#FFD700';
      ctx.fillText('🏁 '+distKm+' km verbleibend',W/2,20);
      ctx.textAlign='right';ctx.fillStyle='#29B6F6';
      ctx.fillText('⚡'+speed+' km/h',W-6,20);

      animId=requestAnimationFrame(loop);
    };
    loop();
    // 3 min timeout
    setTimeout(()=>{if(running)end(false);},180000);
  }
};
window.StuntGame=StuntGame;
