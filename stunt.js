// RACE — Hill Climb Racing style, smooth terrain, proper physics
const StuntGame = {
  start({onComplete}) {
    const el = document.getElementById('game-area');
    if (!el) return;
    const W=480, H=300;
    const isMobile = 'ontouchstart' in window;

    el.innerHTML = `<div style="text-align:center;font-family:sans-serif;user-select:none">
      <canvas id="stcv" width="${W}" height="${H}"
        style="border-radius:12px;width:100%;max-width:min(${W}px,100vw);height:auto;display:block;margin:0 auto;touch-action:none;box-shadow:0 4px 24px #000a"></canvas>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px;margin-top:8px;max-width:${W}px;margin-left:auto;margin-right:auto">
        <button id="st-rotdn" style="background:linear-gradient(135deg,#6C3483,#8E44AD);color:#fff;border:none;padding:13px 6px;border-radius:10px;font-size:1.2rem;font-weight:900;cursor:pointer;touch-action:none">↺</button>
        <button id="st-back"  style="background:linear-gradient(135deg,#E74C3C,#C0392B);color:#fff;border:none;padding:13px 6px;border-radius:10px;font-size:1.1rem;font-weight:900;cursor:pointer;touch-action:none">◀</button>
        <button id="st-fwd"   style="background:linear-gradient(135deg,#27AE60,#1E8449);color:#fff;border:none;padding:13px 6px;border-radius:10px;font-size:1.1rem;font-weight:900;cursor:pointer;touch-action:none">▶</button>
        <button id="st-rotup" style="background:linear-gradient(135deg,#8E44AD,#9B59B6);color:#fff;border:none;padding:13px 6px;border-radius:10px;font-size:1.2rem;font-weight:900;cursor:pointer;touch-action:none">↻</button>
      </div>
      <div style="font-size:clamp(0.75rem,3vw,0.85rem);color:rgba(255,255,255,.3);margin-top:3px">↺↻ Drehen · ◀ Rück · ▶ Gas</div>
    </div>`;

    const cv = document.getElementById('stcv');
    const ctx = cv.getContext('2d');
    const GOAL = 12000;

    // ── Smooth terrain via summed sines ──
    const seeds = [];
    for(let i=0;i<8;i++) seeds.push({
      amp: 30+Math.random()*60,
      freq: 0.0004+Math.random()*0.003,
      phase: Math.random()*Math.PI*2
    });
    // Add some ramps
    const ramps = [];
    for(let i=0;i<12;i++) ramps.push({
      cx: 800+Math.random()*(GOAL-1600),
      w: 60+Math.random()*80,
      h: 20+Math.random()*50
    });

    const BASE_Y = H * 0.62;
    const getTY = wx => {
      let y = BASE_Y;
      for(const s of seeds) y += Math.sin(wx*s.freq+s.phase)*s.amp;
      // Ramps — sharp triangle bumps for jumps
      for(const r of ramps){
        const d=Math.abs(wx-r.cx);
        if(d<r.w) y -= r.h*(1-d/r.w);
      }
      return Math.max(H*0.22, Math.min(H*0.84, y));
    };

    const getAngle = wx => {
      const y1=getTY(wx-6), y2=getTY(wx+6);
      return Math.atan2(y2-y1, 12);
    };

    // Pre-bake terrain for perf
    const TSTEP=3;
    const tCache=[];
    for(let x=0;x<=GOAL+W+50;x+=TSTEP) tCache.push({x,y:getTY(x)});
    const getTYfast=wx=>{
      const i=Math.max(0,Math.min(tCache.length-2,Math.floor(wx/TSTEP)));
      const t=(wx/TSTEP)-i;
      return tCache[i].y*(1-t)+tCache[i+1].y*t;
    };
    const getAngFast=wx=>{
      const y1=getTYfast(wx-5),y2=getTYfast(wx+5);
      return Math.atan2(y2-y1,10);
    };

    // ── Car state ──
    let car={wx:180,wy:getTYfast(180)-26,vx:0,vy:0,ang:0,spin:0,
             onGround:false,airTime:0,saltoRot:0,saltos:0,saltoFlash:0,
             roofLandings:0,_roofLanded:false,penaltyFlash:0,roofToast:0,
             gasTime:0,wheelsAng:0};
    const fwd={v:false},back={v:false},rotup={v:false},rotdn={v:false};
    let running=true,tStart=Date.now(),animId,frames=0;
    const CAM_X=W*0.30;

    // ── Buttons ──
    const wire=(id,hold)=>{
      const b=document.getElementById(id);if(!b)return;
      b.addEventListener('pointerdown',e=>{e.preventDefault();hold.v=true;});
      ['pointerup','pointercancel','pointerleave'].forEach(ev=>b.addEventListener(ev,()=>hold.v=false));
    };
    wire('st-fwd',fwd);wire('st-back',back);wire('st-rotup',rotup);wire('st-rotdn',rotdn);
    const onKey=e=>{const m={ArrowRight:fwd,ArrowLeft:back,ArrowUp:rotup,ArrowDown:rotdn,KeyD:fwd,KeyA:back,KeyW:rotup,KeyS:rotdn};if(m[e.code])m[e.code].v=true;};
    const onKeyUp=e=>{const m={ArrowRight:fwd,ArrowLeft:back,ArrowUp:rotup,ArrowDown:rotdn,KeyD:fwd,KeyA:back,KeyW:rotup,KeyS:rotdn};if(m[e.code])m[e.code].v=false;};
    window.addEventListener('keydown',onKey);window.addEventListener('keyup',onKeyUp);

    const beep=(freqs,dur=0.5)=>{try{const ac=new(window.AudioContext||window.webkitAudioContext)();const g=ac.createGain();g.gain.setValueAtTime(0.10,ac.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+dur);g.connect(ac.destination);freqs.forEach((f,i)=>{const o=ac.createOscillator();o.type='square';o.frequency.setValueAtTime(f,ac.currentTime+i*(dur/freqs.length));o.connect(g);o.start();o.stop(ac.currentTime+dur);});}catch(e){}};

    const end=won=>{
      if(!running)return;running=false;
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown',onKey);window.removeEventListener('keyup',onKeyUp);
      const timeSecs=(Date.now()-tStart)/1000;
      const timeBonus=won?Math.max(0,Math.round(600-Math.max(0,timeSecs-10)*12)):0;
      const roofPen=(car.roofLandings||0)*30;
      const totalPts=(won?200:0)+timeBonus+car.saltos*500-roofPen;
      const rawScore=Math.min(100,Math.max(0,Math.round(totalPts/10)));
      onComplete({rawScore,timeMs:Date.now()-tStart,errors:car.roofLandings,passed:won||car.saltos>0,saltos:car.saltos});
    };

    // ── Draw helpers ──
    const cloud=(x,y,r,alpha=0.88)=>{
      ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle='#fff';
      const blobs=[[0,0,1],[-.6,.15,.72],[.6,.15,.72],[-.3,-.22,.55],[.3,-.22,.55],[0,-.28,.45]];
      for(const[dx,dy,s]of blobs){ctx.beginPath();ctx.arc(x+dx*r*1.4,y+dy*r,s*r,0,Math.PI*2);ctx.fill();}
      ctx.restore();
    };
    const mountain=(x,y,w,h,col1,col2,snow=true)=>{
      const g=ctx.createLinearGradient(x,y-h,x+w*.3,y);
      g.addColorStop(0,col1);g.addColorStop(1,col2);
      ctx.fillStyle=g;ctx.beginPath();
      ctx.moveTo(x-w/2,y);ctx.lineTo(x,y-h);ctx.lineTo(x+w/2,y);ctx.closePath();ctx.fill();
      if(snow){ctx.fillStyle='rgba(255,255,255,.9)';ctx.beginPath();ctx.moveTo(x-w*.09,y-h+h*.13);ctx.lineTo(x,y-h);ctx.lineTo(x+w*.09,y-h+h*.13);ctx.closePath();ctx.fill();}
    };
    const tree=(x,y,h,col='#2a5e0e')=>{
      // Layered pine
      for(let i=0;i<3;i++){
        ctx.fillStyle=i===0?col:i===1?'#1e4a0a':'#163d08';
        const ty=y-h*(0.35+i*0.22);
        const tw=h*(0.55-i*0.12);
        ctx.beginPath();ctx.moveTo(x-tw,y-h*i*0.22);ctx.lineTo(x,ty);ctx.lineTo(x+tw,y-h*i*0.22);ctx.closePath();ctx.fill();
      }
      ctx.fillStyle='#5a3010';ctx.fillRect(x-h*.07,y,h*.14,h*.28);
    };

    // Draw car (top-view body with wheels)
    const drawCar=(cx,cy,ang,wheelAng)=>{
      ctx.save();ctx.translate(cx,cy);ctx.rotate(ang);
      // Shadow
      ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(0,18,22,5,0,0,Math.PI*2);ctx.fill();
      // Body
      const bg=ctx.createLinearGradient(-20,-14,20,14);bg.addColorStop(0,'#e74c3c');bg.addColorStop(0.5,'#ff6b6b');bg.addColorStop(1,'#c0392b');
      ctx.fillStyle=bg;ctx.beginPath();ctx.roundRect(-20,-12,40,24,6);ctx.fill();
      // Cab/roof
      const rg=ctx.createLinearGradient(-11,-22,11,0);rg.addColorStop(0,'#c0392b');rg.addColorStop(1,'#e74c3c');
      ctx.fillStyle=rg;ctx.beginPath();ctx.roundRect(-11,-22,22,14,4);ctx.fill();
      // Windshield
      ctx.fillStyle='rgba(180,220,255,.75)';ctx.beginPath();ctx.roundRect(-9,-20,18,10,2);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.25)';ctx.fillRect(-5,-20,2,8);
      // Wheels (4)
      const wheelPos=[[-16,-8],[-16,8],[14,-8],[14,8]];
      for(const[wx,wy]of wheelPos){
        ctx.save();ctx.translate(wx,wy);ctx.rotate(wheelAng);
        // Tire
        ctx.beginPath();ctx.arc(0,0,8,0,Math.PI*2);ctx.fillStyle='#1a1a1a';ctx.fill();
        // Rim
        ctx.beginPath();ctx.arc(0,0,4.5,0,Math.PI*2);ctx.fillStyle='#888';ctx.fill();
        // Spokes
        ctx.strokeStyle='#555';ctx.lineWidth=1.5;
        for(let s=0;s<4;s++){const a=s*Math.PI/2;ctx.beginPath();ctx.moveTo(Math.cos(a)*1.5,Math.sin(a)*1.5);ctx.lineTo(Math.cos(a)*4,Math.sin(a)*4);ctx.stroke();}
        ctx.restore();
      }
      // Exhaust puff (when gassing)
      if(fwd.v&&Math.random()<0.6){
        ctx.globalAlpha=0.25+Math.random()*.2;
        ctx.fillStyle='#aaa';
        ctx.beginPath();ctx.arc(-23+Math.random()*6,0,3+Math.random()*3,0,Math.PI*2);ctx.fill();
        ctx.globalAlpha=1;
      }
      ctx.restore();
    };

    // ── Terrain drawing ──
    const drawTerrain=(camWX)=>{
      // Deep earth
      ctx.fillStyle='#0d1f04';
      ctx.beginPath();ctx.moveTo(-1,getTYfast(camWX-1));
      for(let sx=0;sx<=W+1;sx+=TSTEP){const ty=getTYfast(camWX+sx);ctx.lineTo(sx,ty);}
      ctx.lineTo(W+1,H+1);ctx.lineTo(-1,H+1);ctx.closePath();ctx.fill();

      // Mid soil layer with slight gradient
      const sg=ctx.createLinearGradient(0,H*0.5,0,H);
      sg.addColorStop(0,'#1a3a07');sg.addColorStop(1,'#0d1f04');
      ctx.fillStyle=sg;
      ctx.beginPath();ctx.moveTo(-1,getTYfast(camWX-1)+2);
      for(let sx=0;sx<=W+1;sx+=TSTEP)ctx.lineTo(sx,getTYfast(camWX+sx)+2);
      for(let sx=W+1;sx>=-1;sx-=TSTEP)ctx.lineTo(sx,getTYfast(camWX+sx)+14);
      ctx.closePath();ctx.fill();

      // Grass highlight stripe
      ctx.lineJoin='round';ctx.lineCap='round';
      ctx.strokeStyle='#6ed62a';ctx.lineWidth=3.5;
      ctx.beginPath();ctx.moveTo(-1,getTYfast(camWX-1));
      for(let sx=0;sx<=W+1;sx+=TSTEP)ctx.lineTo(sx,getTYfast(camWX+sx));
      ctx.stroke();
      // Inner grass detail
      ctx.strokeStyle='#4db820';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(-1,getTYfast(camWX-1)+5);
      for(let sx=0;sx<=W+1;sx+=TSTEP*2)ctx.lineTo(sx,getTYfast(camWX+sx)+5);
      ctx.stroke();
    };

    // ── Parallax layers ──
    let cloudOff=0;
    const cloudDefs=[{rx:.15,ry:.13,r:26},{rx:.5,ry:.09,r:20},{rx:.77,ry:.16,r:22},{rx:.35,ry:.06,r:18}];
    const treeDefs=[];
    for(let tx=350;tx<GOAL;tx+=220+Math.floor(Math.random()*100)) treeDefs.push({wx:tx,h:22+Math.random()*18});

    // Stars (fixed pattern)
    const stars=[];
    for(let i=0;i<60;i++) stars.push({x:Math.random()*W,y:Math.random()*H*.55,s:Math.random()<0.1?2:1,t:Math.random()*Math.PI*2});

    const loop=()=>{
      if(!running)return;
      animId=requestAnimationFrame(loop);
      frames++;

      const terrY=getTYfast(car.wx);
      const terrAng=getAngFast(car.wx);
      // Wheels ground contact point
      const groundContact=car.wy+18;
      const onGround=groundContact>=terrY;

      if(onGround){
        car.wy=terrY-18;car.vy=0;car.onGround=true;car.airTime=0;
        // Align angle to slope smoothly
        car.ang+=(terrAng-car.ang)*0.30;
        car.spin*=0.25;
        if(fwd.v){car.gasTime=Math.min(car.gasTime+1,120);const boost=0.9+Math.min(3.5,car.gasTime*.025);car.vx+=Math.cos(terrAng)*boost;}
        else{car.gasTime=Math.max(0,car.gasTime-3);}
        if(back.v){car.vx-=Math.cos(terrAng)*.65;car.gasTime=0;}
        car.vx*=0.80;
        car.saltoRot=0;
      } else {
        car.onGround=false;car.airTime++;
        car.vy+=0.14;// gravity
        car.spin*=0.992;
        car.saltoRot+=Math.abs(car.spin);
        if(car.saltoRot>=Math.PI*1.85){
          car.saltoRot-=Math.PI*1.85;car.saltos++;car.saltoFlash=40;
          beep([523,659,784,1047]);
        }
      }
      if(rotup.v)car.spin=Math.min(0.20,car.spin+(car.spin<0?.045:.022));
      if(rotdn.v)car.spin=Math.max(-0.20,car.spin-(car.spin>0?.045:.022));
      if(!rotup.v&&!rotdn.v&&!onGround) car.spin*=0.97;

      car.ang+=car.spin;
      car.vx=Math.max(-8,Math.min(20,car.vx));
      car.wx+=car.vx;car.wy+=car.vy;
      // Wheel spin
      car.wheelsAng+=car.vx*0.08;

      // Roof landing penalty
      const norm=((car.ang%(Math.PI*2))+Math.PI*2)%(Math.PI*2);
      const upside=norm>Math.PI*.58&&norm<Math.PI*1.42;
      if(onGround&&upside){
        if(!car._roofLanded){car._roofLanded=true;car.roofLandings++;car.vy=-5;car.spin=car.spin>0?.1:-.1;car.penaltyFlash=50;car.roofToast=130;}
        if(car.airTime===0&&frames%60===0){end(false);return;}
      } else car._roofLanded=false;

      if(car.wy>H+150||car.wx<-120){end(false);return;}
      if(car.wx>=GOAL){end(true);return;}

      // ── DRAW ──
      const camWX=car.wx-CAM_X;
      ctx.clearRect(0,0,W,H);

      // SKY — gradient day/night based on progress
      const prog=car.wx/GOAL;
      const sky=ctx.createLinearGradient(0,0,0,H*.7);
      sky.addColorStop(0,`hsl(${220+prog*20},${60+prog*20}%,${12+prog*5}%)`);
      sky.addColorStop(1,`hsl(${210+prog*15},${50+prog*15}%,${22+prog*8}%)`);
      ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);

      // Stars twinkle
      for(const s of stars){
        const bright=0.3+0.25*Math.sin(s.t+frames*.04);
        ctx.fillStyle=`rgba(255,255,255,${bright})`;
        ctx.fillRect(s.x,s.y,s.s,s.s);
      }
      // Moon
      ctx.fillStyle='rgba(255,240,160,.92)';ctx.beginPath();ctx.arc(W*.84,28,20,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=`hsl(${220+prog*20},${60+prog*20}%,${14+prog*5}%)`;ctx.beginPath();ctx.arc(W*.84+9,23,16,0,Math.PI*2);ctx.fill();

      // Clouds (very slow parallax)
      cloudOff=camWX*.012;
      for(const c of cloudDefs) cloud((c.rx*W-cloudOff*c.r*.04+W*10)%W+c.r,H*c.ry+20,c.r,0.80);

      // Far mountains (deep parallax)
      const mOff=camWX*.05;
      mountain(W*.12-(mOff*0.7)%W,getTYfast(camWX+W*.12),190,105,'#251060','#120830',true);
      mountain(W*.45-(mOff*0.55)%W,getTYfast(camWX+W*.45),155,85,'#1e0d58','#0f0628',true);
      mountain(W*.75-(mOff*0.4)%W,getTYfast(camWX+W*.75),130,72,'#1a0c50','#0a0420',true);
      mountain(W*.28-(mOff*0.3)%W,getTYfast(camWX+W*.28),100,58,'#160a42','#08031a',false);

      // Mid-ground trees (parallax .35)
      for(const td of treeDefs){
        const sx=td.wx-camWX;
        if(sx>-30&&sx<W+30) tree(sx,getTYfast(camWX+sx),td.h);
      }

      // Terrain
      drawTerrain(camWX);

      // Goal flag
      const gsx=GOAL-camWX;
      if(gsx>-20&&gsx<W+60){
        const gy=getTYfast(GOAL);
        ctx.fillStyle='#888';ctx.fillRect(gsx-1.5,gy-80,3,80);
        const fg=ctx.createLinearGradient(gsx,gy-80,gsx+36,gy-58);
        fg.addColorStop(0,'#E74C3C');fg.addColorStop(1,'#ff8866');
        ctx.fillStyle=fg;ctx.beginPath();ctx.moveTo(gsx,gy-80);ctx.lineTo(gsx+36,gy-64);ctx.lineTo(gsx,gy-48);ctx.closePath();ctx.fill();
        ctx.fillStyle='#fff';ctx.font='bold 8px sans-serif';ctx.textAlign='left';ctx.fillText('ZIEL',gsx+4,gy-62);
        // Glow
        const radG=ctx.createRadialGradient(gsx,gy-65,0,gsx,gy-65,45);
        radG.addColorStop(0,'rgba(231,76,60,.22)');radG.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=radG;ctx.beginPath();ctx.arc(gsx,gy-65,45,0,Math.PI*2);ctx.fill();
      }

      // Car (screen Y = car world Y, camera only scrolls X)
      drawCar(CAM_X, car.wy, car.ang, car.wheelsAng);

      // ── HUD ──
      const elapsed=(Date.now()-tStart)/1000;
      const pct=Math.min(100,Math.round(car.wx/GOAL*100));

      // Progress bar
      ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(0,0,W,22);
      const barW=(car.wx/GOAL)*W;
      const barG=ctx.createLinearGradient(0,0,barW,0);
      barG.addColorStop(0,'#27AE60');barG.addColorStop(1,'#6ed62a');
      ctx.fillStyle=barG;ctx.fillRect(0,0,barW,4);

      // Timer
      ctx.fillStyle='rgba(0,0,0,.5)';ctx.beginPath();ctx.roundRect(6,6,90,18,4);ctx.fill();
      ctx.fillStyle='#fff';ctx.font='bold 12px monospace';ctx.textAlign='left';
      ctx.fillText('⏱ '+elapsed.toFixed(1)+'s',11,18);

      // Percent
      ctx.textAlign='center';ctx.fillStyle='#FFD700';ctx.font='bold 13px sans-serif';
      ctx.fillText(pct+'%',W/2,17);

      // Salto flash
      if(car.saltoFlash>0){
        car.saltoFlash--;
        ctx.globalAlpha=car.saltoFlash/40;
        ctx.fillStyle='#FFD700';ctx.textAlign='center';ctx.font='bold 20px sans-serif';
        ctx.fillText('🔄 SALTO! +500',W/2,H/2-20);
        ctx.globalAlpha=1;
      }
      // Salto counter
      if(car.saltos>0){
        ctx.fillStyle='rgba(0,0,0,.5)';ctx.beginPath();ctx.roundRect(W-70,6,64,18,4);ctx.fill();
        ctx.fillStyle='#FFD700';ctx.font='bold 12px sans-serif';ctx.textAlign='right';
        ctx.fillText('🔄×'+car.saltos,W-8,18);
      }
      // Roof landing penalty
      if(car.penaltyFlash>0){
        car.penaltyFlash--;
        ctx.globalAlpha=car.penaltyFlash/50;
        ctx.fillStyle='rgba(231,76,60,.4)';ctx.fillRect(0,0,W,H);
        ctx.globalAlpha=1;
      }
      if(car.roofToast>0){
        car.roofToast--;
        ctx.fillStyle='rgba(231,76,60,.85)';ctx.textAlign='center';ctx.font='bold 14px sans-serif';
        ctx.fillText('⚠️ Umgekippt! -30 Pkt',W/2,H/2);
      }
      // Speed indicator
      const spd=Math.abs(car.vx);
      if(spd>2){
        ctx.fillStyle=`rgba(255,${Math.max(0,255-spd*15)},0,.7)`;ctx.font='bold 11px sans-serif';ctx.textAlign='left';
        ctx.fillText('⚡'+spd.toFixed(0),11,H-8);
      }
    };

    animId=requestAnimationFrame(loop);
  }
};
