// RACE — Hill Climb v3: Momentum physics, crash penalty, long track, big air
const StuntGame = {
  start({onComplete}) {
    const el = document.getElementById('game-area');
    if (!el) return;
    const W = Math.min(560, window.innerWidth - 16);
    const H = Math.round(W * 0.56);
    const isMob = 'ontouchstart' in window;

    el.innerHTML = `
<div style="font-family:sans-serif;user-select:none;-webkit-user-select:none">
  <canvas id="stcv" width="${W}" height="${H}"
    style="border-radius:14px;width:100%;display:block;margin:0 auto;touch-action:none;
           box-shadow:0 6px 32px rgba(0,0,0,.7),0 0 0 2px rgba(255,255,255,.07)"></canvas>
  <div style="display:flex;gap:${isMob?8:6}px;margin-top:${isMob?10:8}px;justify-content:center;flex-wrap:wrap">
    <button id="st-rotdn" style="${B('#7b3fa8')}">↺</button>
    <button id="st-back"  style="${B('#c0392b')}">◀</button>
    <button id="st-fwd"   style="${B('#27AE60')}">▶ Gas</button>
    <button id="st-rotup" style="${B('#7b3fa8')}">↻</button>
  </div>
  <div style="text-align:center;font-size:clamp(.7rem,3vw,.8rem);color:rgba(255,255,255,.2);margin-top:4px">
    ↺↻ Drehen · ◀ Rück · ▶ Gas 5s = Max Speed · Pfeiltasten/WASD
  </div>
</div>`;

    function B(c){
      const pad = isMob ? 'clamp(18px,5.5vw,26px) clamp(20px,6vw,32px)' : '11px 18px';
      const fs  = isMob ? 'clamp(1.5rem,7.5vw,2rem)' : '1rem';
      const mh  = isMob ? 'clamp(70px,20vw,88px)' : '44px';
      const mw  = isMob ? 'clamp(76px,20vw,92px)' : '48px';
      return `background:linear-gradient(160deg,${c}cc,${c});color:#fff;border:none;
        padding:${pad};border-radius:16px;font-size:${fs};font-weight:900;cursor:pointer;
        touch-action:none;min-height:${mh};min-width:${mw};
        box-shadow:0 6px 14px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.2)`;
    }

    const cv = document.getElementById('stcv');
    const ctx = cv.getContext('2d');

    // ── TERRAIN: much longer, more interesting ──
    const GOAL = 28000; // double length
    const LAYERS = [
      {amp:70,  freq:0.00035, ph:Math.random()*6.28},
      {amp:45,  freq:0.0009,  ph:Math.random()*6.28},
      {amp:25,  freq:0.002,   ph:Math.random()*6.28},
      {amp:12,  freq:0.005,   ph:Math.random()*6.28},
      {amp: 6,  freq:0.012,   ph:Math.random()*6.28},
    ];
    // More ramps — bigger air opportunities
    const RAMPS = [];
    for(let i=0;i<22;i++) RAMPS.push({
      cx: 900 + i*1100 + Math.random()*600,
      w: 50+Math.random()*80,
      h: 30+Math.random()*60  // bigger ramps
    });

    const BASE = H * 0.58;
    const rawY = wx => {
      let y = BASE;
      for(const l of LAYERS) y += Math.sin(wx*l.freq+l.ph)*l.amp;
      for(const r of RAMPS){ const d=Math.abs(wx-r.cx); if(d<r.w) y-=r.h*(1-d/r.w); }
      return Math.max(H*.12, Math.min(H*.9, y));
    };
    const STEP=2;
    const tCache=new Float32Array(Math.ceil((GOAL+W+200)/STEP)+2);
    for(let i=0;i<tCache.length;i++) tCache[i]=rawY(i*STEP);
    const getY=wx=>{
      const i=Math.max(0,Math.min(tCache.length-2,wx/STEP|0));
      const t=wx/STEP-i;
      return tCache[i]*(1-t)+tCache[i+1]*t;
    };
    const getAng=wx=>{const y1=getY(wx-4),y2=getY(wx+4);return Math.atan2(y2-y1,8);};

    // ── PHYSICS CONSTANTS ──
    const CAR_H=14;
    const MAX_SPEED_CLEAN=22;   // top speed when no crash for 5s
    const MAX_SPEED_CRASH=8;    // top speed right after crash
    const ACCEL_TIME=5;         // seconds of gas to reach max speed
    const GRAVITY=0.10; // reduced gravity → longer, more floaty jumps
    const CRASH_PENALTY=5;      // seconds penalty on crash

    // ── CAR STATE ──
    let car = {
      wx:200, wy:getY(200)-CAR_H,
      vx:0, vy:0, ang:0, spin:0,
      onGround:false, airTime:0,
      saltoRot:0, saltos:0, saltoFlash:0,
      wheelAng:0, dustParts:[],
      // Momentum / speed system
      gasHeld:0,        // seconds gas held continuously
      cleanTime:0,      // seconds since last crash
      speedCap:MAX_SPEED_CRASH, // current max speed (recovers after crash)
      crashed:false,
      crashFlash:0, crashMsg:'',
      stylePoints:0, styleFlash:0,
      _tiltBonus:false, _roofLanded:false,
      roofCount:0,
    };

    const inp={fwd:false,back:false,rotup:false,rotdn:false};
    let running=true, tStart=Date.now(), raf, frames=0;
    const CAM_X=W*0.28;

    // Buttons
    const wire=(id,k)=>{
      const b=document.getElementById(id);if(!b)return;
      b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);inp[k]=true;});
      ['pointerup','pointercancel','pointerleave'].forEach(ev=>b.addEventListener(ev,()=>inp[k]=false));
    };
    wire('st-fwd','fwd');wire('st-back','back');wire('st-rotup','rotup');wire('st-rotdn','rotdn');
    const km={ArrowRight:'fwd',ArrowLeft:'back',ArrowUp:'rotup',ArrowDown:'rotdn',KeyD:'fwd',KeyA:'back',KeyW:'rotup',KeyS:'rotdn'};
    const onKD=e=>{if(km[e.code]){e.preventDefault();inp[km[e.code]]=true;}};
    const onKU=e=>{if(km[e.code])inp[km[e.code]]=false;};
    window.addEventListener('keydown',onKD);window.addEventListener('keyup',onKU);

    const beep=(fqs,dur=0.4)=>{try{
      const ac=new(window.AudioContext||window.webkitAudioContext)();
      const g=ac.createGain();g.gain.setValueAtTime(0.1,ac.currentTime);g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+dur);
      g.connect(ac.destination);
      fqs.forEach((f,i)=>{const o=ac.createOscillator();o.type='square';o.frequency.setValueAtTime(f,ac.currentTime+i*(dur/fqs.length));o.connect(g);o.start();o.stop(ac.currentTime+dur);});
    }catch(e){}};

    const finish=won=>{
      if(!running)return;running=false;cancelAnimationFrame(raf);
      window.removeEventListener('keydown',onKD);window.removeEventListener('keyup',onKU);
      const secs=(Date.now()-tStart)/1000;
      const tBonus=won?Math.max(0,Math.round(900-Math.max(0,secs-15)*8)):0;
      const pts=(won?200:0)+tBonus+car.saltos*500+car.stylePoints-car.roofCount*20;
      onComplete({rawScore:Math.min(100,Math.max(0,pts/10|0)),timeMs:Date.now()-tStart,errors:car.roofCount,passed:won||car.saltos>0});
    };

    // Trees / clouds
    const TREES=[];
    for(let tx=500;tx<GOAL;tx+=220+Math.random()*180)TREES.push({wx:tx,h:24+Math.random()*20});
    const CLOUDS=[];
    for(let cx=300;cx<GOAL;cx+=600+Math.random()*500)CLOUDS.push({wx:cx,wy:H*(.06+Math.random()*.13),r:20+Math.random()*18});

    // Stars
    const STARS=[];
    for(let i=0;i<60;i++)STARS.push({x:Math.random()*W,y:Math.random()*H*.5,s:Math.random()*1.5+.3,br:Math.random()});

    // ── DRAWING ──
    const drawBlock=(x,y,w,h,col,dark)=>{
      ctx.fillStyle=col;ctx.fillRect(x,y,w,h);
      ctx.fillStyle='rgba(255,255,255,.18)';ctx.fillRect(x,y,w,2);ctx.fillRect(x,y,2,h);
      ctx.fillStyle=dark;ctx.fillRect(x+w-3,y+3,3,h-3);ctx.fillRect(x+3,y+h-3,w-3,3);
    };

    const drawCar=(cx,cy,ang,wAng)=>{
      ctx.save();ctx.translate(cx,cy);ctx.rotate(ang);
      // Shadow
      ctx.fillStyle='rgba(0,0,0,.22)';ctx.beginPath();ctx.ellipse(1,17,20,5,0,0,Math.PI*2);ctx.fill();
      // Body
      const bg=ctx.createLinearGradient(-20,-14,20,12);
      bg.addColorStop(0,'#ff7070');bg.addColorStop(.4,'#e84040');bg.addColorStop(1,'#a81010');
      ctx.fillStyle=bg;ctx.fillRect(-21,-12,42,24);
      ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(-19,-11,20,5);
      // Roof
      const rg=ctx.createLinearGradient(-12,-23,12,-8);
      rg.addColorStop(0,'#cc3333');rg.addColorStop(1,'#991111');
      ctx.fillStyle=rg;ctx.fillRect(-12,-23,24,14);
      // Windshield
      const wg=ctx.createLinearGradient(-10,-21,10,-10);
      wg.addColorStop(0,'rgba(160,220,255,.85)');wg.addColorStop(1,'rgba(100,180,255,.6)');
      ctx.fillStyle=wg;ctx.fillRect(-10,-21,20,11);
      ctx.fillStyle='rgba(255,255,255,.5)';ctx.fillRect(-9,-20,6,4);
      // Exhaust
      ctx.fillStyle='#555';ctx.fillRect(-23,-8,4,6);
      // 2 wheels (side view)
      [[-14,10],[14,10]].forEach(([wx2,wy2])=>{
        ctx.save();ctx.translate(wx2,wy2);ctx.rotate(wAng);
        ctx.fillStyle='#111';ctx.beginPath();ctx.arc(0,0,8.5,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#2a2a2a';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,8.5,0,Math.PI*2);ctx.stroke();
        const rg2=ctx.createRadialGradient(-2,-2,0,0,0,6);rg2.addColorStop(0,'#ddd');rg2.addColorStop(1,'#555');
        ctx.fillStyle=rg2;ctx.beginPath();ctx.arc(0,0,5.5,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#ccc';ctx.beginPath();ctx.arc(0,0,2,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#999';ctx.lineWidth=1.5;
        for(let s=0;s<5;s++){const a=s*Math.PI*2/5;ctx.beginPath();ctx.moveTo(Math.cos(a)*2,Math.sin(a)*2);ctx.lineTo(Math.cos(a)*5,Math.sin(a)*5);ctx.stroke();}
        ctx.restore();
      });
      // Gas exhaust
      if(inp.fwd&&frames%2===0){
        ctx.globalAlpha=.25+Math.random()*.2;ctx.fillStyle='#ccc';
        ctx.beginPath();ctx.arc(-26+Math.random()*5,-2+Math.random()*4,2+Math.random()*3,0,Math.PI*2);ctx.fill();
        ctx.globalAlpha=1;
      }
      ctx.restore();
    };

    const drawTree=(x,y,h)=>{
      for(let i=0;i<3;i++){
        const ty=y-h*(.3+i*.25),tw=h*(.52-i*.13);
        const g=ctx.createLinearGradient(x-tw,ty,x+tw,ty);
        g.addColorStop(0,'#1d4a09');g.addColorStop(.5,'#2e7a12');g.addColorStop(1,'#1d4a09');
        ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x-tw,y-h*i*.25);ctx.lineTo(x,ty);ctx.lineTo(x+tw,y-h*i*.25);ctx.closePath();ctx.fill();
      }
      ctx.fillStyle='#3d1f00';ctx.fillRect(x-3,y,6,h*.28);
    };

    const drawMtn=(x,y,w,h,c1,c2)=>{
      const g=ctx.createLinearGradient(x-w*.1,y-h,x+w*.3,y);
      g.addColorStop(0,c1);g.addColorStop(1,c2);
      ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x-w/2,y);ctx.lineTo(x,y-h);ctx.lineTo(x+w/2,y);ctx.closePath();ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.85)';
      ctx.beginPath();ctx.moveTo(x-w*.1,y-h+h*.13);ctx.lineTo(x,y-h);ctx.lineTo(x+w*.1,y-h+h*.13);ctx.closePath();ctx.fill();
    };

    const drawCloud=(x,y,r)=>{
      ctx.save();ctx.globalAlpha=.8;ctx.fillStyle='#eef6ff';
      for(const[dx,dy,s]of[[0,0,1],[-.58,.12,.72],[.58,.12,.72],[-.28,-.22,.55],[.28,-.22,.55],[0,-.3,.45]]){
        ctx.beginPath();ctx.arc(x+dx*r*1.5,y+dy*r,s*r,0,Math.PI*2);ctx.fill();
      }
      ctx.restore();
    };

    const loop=()=>{
      if(!running)return;
      raf=requestAnimationFrame(loop);
      frames++;
      const dt=1/60;

      // ── PHYSICS ──
      const terrY=getY(car.wx), terrAng=getAng(car.wx);
      const onGround=(car.wy+CAR_H+2)>=terrY;

      // Track gas time for speed build-up
      if(onGround&&inp.fwd) car.gasHeld=Math.min(ACCEL_TIME,car.gasHeld+dt);
      else if(!inp.fwd) car.gasHeld=Math.max(0,car.gasHeld-dt*0.5);

      // Clean time (no crashes) → speed cap increases
      if(!car.crashed) car.cleanTime+=dt;
      // Speed cap: from CRASH level, recovers linearly over ACCEL_TIME seconds
      car.speedCap = MAX_SPEED_CRASH + (MAX_SPEED_CLEAN-MAX_SPEED_CRASH) * Math.min(1, car.cleanTime/ACCEL_TIME);

      if(onGround){
        car.wy=terrY-CAR_H;car.vy=0;car.onGround=true;car.airTime=0;car.saltoRot=0;
        car.crashed=false;
        const dAng=((terrAng-car.ang+Math.PI*3)%(Math.PI*2))-Math.PI;
        car.ang+=dAng*0.55; // stronger angle snap to slope
        car.spin*=0.06; // quicker spin kill on landing

        if(inp.fwd){
          // Speed builds with gas: 0→max over ACCEL_TIME seconds
          const gasRatio=car.gasHeld/ACCEL_TIME;
          const targetSpd=car.speedCap*gasRatio;
          const currentSpd=car.vx;
          const boost=0.6+gasRatio*3.5; // acceleration
          car.vx+=Math.cos(terrAng)*boost;
          if(frames%3===0&&car.vx>2){
            car.dustParts.push({wx:car.wx-12,wy:terrY,vx:-1+Math.random(),vy:-1-Math.random()*1.5,life:1,r:2+Math.random()*4});
          }
        } else { car.gasHeld=Math.max(0,car.gasHeld-dt*2); }
        if(inp.back){car.vx-=Math.cos(terrAng)*.65;car.gasHeld=0;}
        // Rotation on ground gives slight air bounce
        if((inp.rotup||inp.rotdn)&&Math.abs(car.spin)>0.1){car.vy=-1.5;car.wy-=2;}
        car.vx*=0.80;
      } else {
        car.onGround=false;car.airTime++;
        // Big air: much lower gravity = longer, farther flights
        const airFactor=Math.max(0.15, 1-car.cleanTime*0.035); // very floaty at speed
        car.vy+=GRAVITY*airFactor;
        car.spin*=0.998; // very slow decay = car keeps rotating naturally in air
        car.saltoRot+=Math.abs(car.spin);
        if(car.saltoRot>=Math.PI*1.8){
          car.saltoRot-=Math.PI*1.8;car.saltos++;car.saltoFlash=45;
          beep([440,550,660,880]);
        }
      }

      // Rotation works both in air AND on ground (for flipping out of crashes)
      if(inp.rotup)car.spin=Math.min(0.20,car.spin+(car.spin<0?.04:.02));
      if(inp.rotdn)car.spin=Math.max(-0.20,car.spin-(car.spin>0?.04:.02));
      if(!inp.rotup&&!inp.rotdn){
        if(!car.onGround) car.spin*=0.988; // gentler air decay → easier landing
        else car.spin*=0.15;
      }

      // Apply spin to angle — THIS IS THE FIX (was missing!)
      car.ang += car.spin;
      // Clamp speed
      car.vx=Math.max(-9,Math.min(car.speedCap,car.vx));
      car.wx+=car.vx;car.wy+=car.vy;
      car.wheelAng+=car.vx*0.09;

      // Dust particles
      car.dustParts=car.dustParts.filter(p=>p.life>0.05);
      for(const p of car.dustParts){p.wx+=p.vx;p.wy+=p.vy;p.vy+=0.04;p.vx*=.95;p.life*=.88;}

      // Style tilt bonus
      const norm=((car.ang%(Math.PI*2))+Math.PI*2)%(Math.PI*2);
      const tilt=Math.min(norm,Math.PI*2-norm);
      if(!car.onGround&&car.airTime>8&&tilt>Math.PI*.25&&!car._tiltBonus){
        car._tiltBonus=true;car.stylePoints+=50;car.styleFlash=30;
      }
      if(car.onGround)car._tiltBonus=false;

      // CRASH DETECTION: landing too tilted (relative to terrain slope)
      // normRelative=0 means perfectly aligned with the slope (upright landing),
      // =PI means fully upside-down. Previously only the last ~50° before full
      // inversion counted as a crash (i.e. you could land up to ~130° tilted
      // and still be fine) — way too forgiving, players basically never crashed.
      // Now: land more than 55° off-level (in either direction) and you crash.
      const normRelative=((norm-terrAng+Math.PI*3)%(Math.PI*2))-Math.PI; // angle diff from slope
      const tiltOffLevel=Math.abs(normRelative); // 0 = perfectly level, PI = fully inverted
      const upside=tiltOffLevel>Math.PI*0.305; // ~55° tolerance (was ~130°)
      if(car.onGround&&upside){
        if(!car._roofLanded){
          car._roofLanded=true;car.roofCount++;
          car.vy=-2.0;car.spin=(car.spin>0?.06:-.06); // gentler bounce
          car.crashFlash=60;car.crashMsg=typeof t!=='undefined'?t('race.crash'):'💥 CRASH! Neu anfahren...';
          // PENALTY: reset gas build-up and speed, need to re-accelerate
          car.gasHeld=0;
          car.cleanTime=0; // start clean timer over
          car.crashed=true;
          car.vx*=0.2; // sudden slowdown
          beep([200,150,100],0.6);
        }
        if(car.airTime===0&&frames%120===0){finish(false);return;}
      }else car._roofLanded=false;

      if(car.wy>H+200||car.wx<-150){finish(false);return;}
      if(car.wx>=GOAL){finish(true);return;}

      // ── DRAW ──
      const camX=car.wx-CAM_X;
      ctx.clearRect(0,0,W,H);

      // Sky
      const prog=Math.min(1,car.wx/GOAL);
      const sky=ctx.createLinearGradient(0,0,0,H);
      sky.addColorStop(0,`hsl(230,${62-prog*10}%,${10+prog*3}%)`);
      sky.addColorStop(.6,`hsl(220,55%,${18+prog*4}%)`);
      sky.addColorStop(1,`hsl(210,45%,24%)`);
      ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);

      // Stars
      STARS.forEach(s=>{
        ctx.fillStyle=`rgba(255,255,255,${(.5+.35*Math.sin(frames*.05+s.br))})`;
        ctx.fillRect(s.x|0,s.y|0,s.s>.9?2:1,s.s>.9?2:1);
      });

      // Moon
      ctx.fillStyle='rgba(255,245,180,.88)';ctx.beginPath();ctx.arc(W*.84,28,20,0,Math.PI*2);ctx.fill();
      const mg=ctx.createRadialGradient(W*.84+10,24,0,W*.84+10,24,18);
      mg.addColorStop(0,`hsl(230,62%,${12+prog*3}%)`);mg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=mg;ctx.beginPath();ctx.arc(W*.84+10,24,18,0,Math.PI*2);ctx.fill();

      // Mountains
      const mOff=camX*.06;
      drawMtn(W*.13-mOff%W,getY(camX+W*.13),200,110,'#1a0c55','#251570');
      drawMtn(W*.43-mOff*.8%W,getY(camX+W*.43),165,90,'#150a45','#1e1160');
      drawMtn(W*.72-mOff*.6%W,getY(camX+W*.72),140,78,'#120850','#19104a');

      // Clouds
      CLOUDS.forEach(cl=>{const cx2=cl.wx-camX;if(cx2>-80&&cx2<W+80)drawCloud(cx2,cl.wy,cl.r);});

      // Trees
      TREES.forEach(tr=>{const sx=tr.wx-camX;if(sx>-50&&sx<W+50)drawTree(sx,getY(tr.wx),tr.h);});

      // Terrain
      ctx.fillStyle='#0a1803';
      ctx.beginPath();ctx.moveTo(-1,getY(camX-1));
      for(let sx=0;sx<=W+1;sx+=STEP)ctx.lineTo(sx,getY(camX+sx));
      ctx.lineTo(W+1,H+2);ctx.lineTo(-1,H+2);ctx.closePath();ctx.fill();
      const eg=ctx.createLinearGradient(0,H*.4,0,H);eg.addColorStop(0,'#172e05');eg.addColorStop(1,'#0a1803');
      ctx.fillStyle=eg;
      ctx.beginPath();ctx.moveTo(-1,getY(camX-1)+3);
      for(let sx=0;sx<=W+1;sx+=STEP)ctx.lineTo(sx,getY(camX+sx)+3);
      for(let sx=W+1;sx>=-1;sx-=STEP)ctx.lineTo(sx,getY(camX+sx)+16);
      ctx.closePath();ctx.fill();
      // Grass glow
      ctx.shadowColor='#6ed62a';ctx.shadowBlur=5;
      ctx.strokeStyle='#7ae62a';ctx.lineWidth=3.5;ctx.lineJoin='round';
      ctx.beginPath();ctx.moveTo(-1,getY(camX-1));
      for(let sx=0;sx<=W+1;sx+=STEP)ctx.lineTo(sx,getY(camX+sx));
      ctx.stroke();ctx.shadowBlur=0;

      // Dust
      car.dustParts.forEach(p=>{
        const px=p.wx-camX;
        if(px>-20&&px<W+20){
          ctx.globalAlpha=p.life*.6;ctx.fillStyle='#a8883a';
          ctx.beginPath();ctx.arc(px,p.wy,p.r*p.life+1,0,Math.PI*2);ctx.fill();
        }
      });ctx.globalAlpha=1;

      // Goal flag
      const gsx=GOAL-camX;
      if(gsx>-40&&gsx<W+80){
        const gy=getY(GOAL);
        const pg=ctx.createLinearGradient(gsx-1,gy-90,gsx+1,gy);pg.addColorStop(0,'#ddd');pg.addColorStop(1,'#888');
        ctx.fillStyle=pg;ctx.fillRect(gsx-1.5,gy-90,3,90);
        ctx.fillStyle='#E74C3C';ctx.beginPath();ctx.moveTo(gsx,gy-90);ctx.lineTo(gsx+40,gy-72);ctx.lineTo(gsx,gy-54);ctx.closePath();ctx.fill();
        ctx.fillStyle='#fff';ctx.font='bold 9px sans-serif';ctx.textAlign='left';ctx.fillText(typeof t!=='undefined'?t('race.goal'):'ZIEL',gsx+5,gy-68);
        const gg=ctx.createRadialGradient(gsx,gy-72,0,gsx,gy-72,50);
        gg.addColorStop(0,'rgba(231,76,60,.25)');gg.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=gg;ctx.beginPath();ctx.arc(gsx,gy-72,50,0,Math.PI*2);ctx.fill();
      }

      // Car
      drawCar(CAM_X,car.wy,car.ang,car.wheelAng);

      // ── HUD ──
      const elapsed=(Date.now()-tStart)/1000;
      const pct=Math.min(100,(car.wx/GOAL*100)|0);
      const spd=Math.abs(car.vx);
      const gasRatio=car.gasHeld/ACCEL_TIME;

      // Top bar
      ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(0,0,W,26);
      // Progress
      const barW=(car.wx/GOAL)*W;
      const barG=ctx.createLinearGradient(0,0,barW,0);
      barG.addColorStop(0,'#1a9e40');barG.addColorStop(.7,'#27AE60');barG.addColorStop(1,'#6ed62a');
      ctx.fillStyle=barG;ctx.fillRect(0,0,Math.min(barW,W),4);
      if(barW>20){ctx.fillStyle='rgba(255,255,255,.2)';ctx.fillRect(0,0,Math.min(barW,W),2);}

      // Timer
      ctx.fillStyle='rgba(255,255,255,.9)';ctx.font='bold 12px monospace';ctx.textAlign='left';
      ctx.fillText('⏱ '+elapsed.toFixed(1)+'s',8,19);

      // Percent
      ctx.textAlign='center';ctx.fillStyle='#FFD700';ctx.font='bold 13px sans-serif';
      ctx.fillText(pct+'%',W/2,19);

      // Speed + gas bar (bottom of HUD)
      ctx.textAlign='right';
      // Gas build-up bar
      if(inp.fwd&&car.onGround){
        const bw=60,bh=6,bx2=W-8,by2=22;
        ctx.fillStyle='rgba(255,255,255,.1)';ctx.fillRect(bx2-bw,by2,bw,bh);
        const gc=ctx.createLinearGradient(bx2-bw,0,bx2,0);
        gc.addColorStop(0,'#27AE60');gc.addColorStop(.6,'#F39C12');gc.addColorStop(1,'#E74C3C');
        ctx.fillStyle=gc;ctx.fillRect(bx2-bw,by2,bw*gasRatio,bh);
        ctx.fillStyle='rgba(255,255,255,.5)';ctx.font='bold 9px monospace';ctx.textAlign='right';
        if(gasRatio>=1)ctx.fillText('MAX SPEED!',bx2,by2+bh+10);
        else ctx.fillText('⚡ '+Math.round(gasRatio*100)+'%',bx2,by2+bh+10);
      } else {
        ctx.fillStyle=spd>12?'#ff6b35':spd>6?'#FFD700':'#7ae62a';
        ctx.font='bold 11px monospace';ctx.textAlign='right';
        if(spd>1.5)ctx.fillText('⚡'+spd.toFixed(0),W-8,19);
      }

      // Clean time indicator (shows speed recovery progress)
      if(car.roofCount>0&&car.cleanTime<ACCEL_TIME){
        const rec=car.cleanTime/ACCEL_TIME;
        const rg=ctx.createLinearGradient(0,H-6,W*rec,H-6);
        rg.addColorStop(0,'#E74C3C');rg.addColorStop(1,'#F39C12');
        ctx.fillStyle='rgba(255,255,255,.05)';ctx.fillRect(0,H-6,W,6);
        ctx.fillStyle=rg;ctx.fillRect(0,H-6,W*rec,6);
        ctx.fillStyle='rgba(255,255,255,.4)';ctx.font='10px sans-serif';ctx.textAlign='center';
        ctx.fillText((typeof t!=='undefined'?t('race.starting'):'Anfahren...')+' '+Math.round(rec*100)+'%',W/2,H-9);
      }

      // Salto flash
      if(car.saltoFlash>0){
        car.saltoFlash--;
        ctx.globalAlpha=car.saltoFlash/45;
        ctx.fillStyle='#FFD700';ctx.textAlign='center';ctx.font='bold 20px sans-serif';
        ctx.fillText('🔄 SALTO! +500',W/2,H*.4);ctx.globalAlpha=1;
      }
      // Style flash
      if(car.styleFlash>0){
        car.styleFlash--;
        ctx.globalAlpha=car.styleFlash/30;
        ctx.fillStyle='#ff69b4';ctx.textAlign='center';ctx.font='bold 16px sans-serif';
        ctx.fillText('✨ STYLE! +50',W/2,H*.5);ctx.globalAlpha=1;
      }
      // Crash flash
      if(car.crashFlash>0){
        car.crashFlash--;
        ctx.globalAlpha=car.crashFlash/60*.45;
        ctx.fillStyle='#E74C3C';ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;
        if(car.crashFlash>20){
          ctx.fillStyle='rgba(255,255,255,.9)';ctx.textAlign='center';ctx.font='bold 15px sans-serif';
          ctx.fillText(car.crashMsg,W/2,H*.48);
        }
      }
      // Saltos counter
      if(car.saltos>0){
        ctx.fillStyle='rgba(0,0,0,.45)';ctx.fillRect(W-68,6,60,16);
        ctx.fillStyle='#FFD700';ctx.font='bold 11px sans-serif';ctx.textAlign='right';
        ctx.fillText('🔄×'+car.saltos,W-8,18);
      }
    };
    raf=requestAnimationFrame(loop);
  }
};
