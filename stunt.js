// RACE — Hill Climb Racing, v2 — smooth hills, proper jump physics, detailed car
const StuntGame = {
  start({onComplete}) {
    const el = document.getElementById('game-area');
    if (!el) return;

    // Use full available width
    const W = Math.min(560, window.innerWidth - 16);
    const H = Math.round(W * 0.56);
    const isMobile = 'ontouchstart' in window;

    el.innerHTML = `
<div style="font-family:sans-serif;user-select:none;-webkit-user-select:none">
  <canvas id="stcv" width="${W}" height="${H}"
    style="border-radius:14px;width:100%;display:block;margin:0 auto;touch-action:none;
           box-shadow:0 6px 32px rgba(0,0,0,.7),0 0 0 2px rgba(255,255,255,.07)"></canvas>
  <div style="display:flex;gap:6px;margin-top:8px;justify-content:center">
    <button id="st-rotdn" style="${BTN('#7b3fa8')}">↺</button>
    <button id="st-back"  style="${BTN('#c0392b')}">◀</button>
    <button id="st-fwd"   style="${BTN('#27AE60')}">▶ Gas</button>
    <button id="st-rotup" style="${BTN('#7b3fa8')}">↻</button>
  </div>
  <div style="text-align:center;font-size:.72rem;color:rgba(255,255,255,.25);margin-top:3px">
    ↺↻ Drehen &nbsp;·&nbsp; ◀ Rückwärts &nbsp;·&nbsp; ▶ Gas &nbsp;·&nbsp; Pfeiltasten / WASD
  </div>
</div>`;

    function BTN(c){return `background:linear-gradient(160deg,${c}cc,${c});color:#fff;border:none;
      padding:clamp(13px,4vw,18px) clamp(10px,4vw,22px);border-radius:12px;
      font-size:clamp(1.1rem,5vw,1.3rem);font-weight:900;cursor:pointer;
      touch-action:none;min-width:clamp(52px,14vw,70px);min-height:52px;
      box-shadow:0 4px 10px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.2)`;}

    const cv = document.getElementById('stcv');
    const ctx = cv.getContext('2d');
    const GOAL = 14000;

    // ── Terrain: summed sine waves for smooth organic hills ──
    const LAYERS = [
      {amp:55, freq:0.00055, ph:Math.random()*6.28},
      {amp:35, freq:0.0013,  ph:Math.random()*6.28},
      {amp:20, freq:0.0028,  ph:Math.random()*6.28},
      {amp:10, freq:0.0065,  ph:Math.random()*6.28},
      {amp: 5, freq:0.014,   ph:Math.random()*6.28},
    ];
    // Ramp jumps — sharp triangle bumps
    const RAMPS = [];
    for(let i=0;i<10;i++) RAMPS.push({
      cx: 1500 + i*1100 + Math.random()*400,
      w: 55+Math.random()*70, h: 28+Math.random()*42
    });

    const BASE = H * 0.60;
    const rawY = wx => {
      let y = BASE;
      for(const l of LAYERS) y += Math.sin(wx*l.freq + l.ph)*l.amp;
      for(const r of RAMPS){ const d=Math.abs(wx-r.cx); if(d<r.w) y-=r.h*(1-d/r.w); }
      return Math.max(H*.18, Math.min(H*.88, y));
    };
    // Cache terrain
    const STEP = 2;
    const tCache = new Float32Array(Math.ceil((GOAL+W+200)/STEP)+2);
    for(let i=0;i<tCache.length;i++) tCache[i]=rawY(i*STEP);
    const getY = wx => {
      const i = Math.max(0,Math.min(tCache.length-2, wx/STEP|0));
      const t = wx/STEP-i;
      return tCache[i]*(1-t)+tCache[i+1]*t;
    };
    const getAng = wx => { const y1=getY(wx-4),y2=getY(wx+4); return Math.atan2(y2-y1,8); };

    // ── Car ──
    const CAR_H = 14; // half-height offset from ground
    let car = {
      wx:200, wy:getY(200)-CAR_H,
      vx:0, vy:0, ang:0, spin:0,
      onGround:false, airTime:0,
      saltoRot:0, saltos:0, saltoFlash:0,
      roofLandings:0, _roofLanded:false, penaltyFlash:0, roofToast:0,
      gasTime:0, wheelAng:0, dustParts:[],
      // Progressive speed: cleanTime = seconds without crash
      cleanTime:0, _lastCleanTick:0, speedBoost:1.0, speedFlash:0,
      bigAirDone:false
    };
    const inp = {fwd:false,back:false,rotup:false,rotdn:false};
    let running=true, tStart=Date.now(), raf, frames=0;
    const CAM_X = W*0.28;

    // Buttons
    const wire=(id,k)=>{
      const b=document.getElementById(id); if(!b)return;
      const set=v=>{inp[k]=v;};
      b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);set(true);});
      ['pointerup','pointercancel','pointerleave'].forEach(ev=>b.addEventListener(ev,()=>set(false)));
    };
    wire('st-fwd','fwd'); wire('st-back','back'); wire('st-rotup','rotup'); wire('st-rotdn','rotdn');
    const kmap={ArrowRight:'fwd',ArrowLeft:'back',ArrowUp:'rotup',ArrowDown:'rotdn',KeyD:'fwd',KeyA:'back',KeyW:'rotup',KeyS:'rotdn'};
    const onKD=e=>{if(kmap[e.code]){e.preventDefault();inp[kmap[e.code]]=true;}};
    const onKU=e=>{if(kmap[e.code])inp[kmap[e.code]]=false;};
    window.addEventListener('keydown',onKD); window.addEventListener('keyup',onKU);

    const beep=(fqs,dur=0.45)=>{try{
      const ac=new(window.AudioContext||window.webkitAudioContext)();
      const g=ac.createGain(); g.gain.setValueAtTime(0.1,ac.currentTime); g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+dur);
      g.connect(ac.destination);
      fqs.forEach((f,i)=>{const o=ac.createOscillator();o.type='square';o.frequency.setValueAtTime(f,ac.currentTime+i*(dur/fqs.length));o.connect(g);o.start();o.stop(ac.currentTime+dur);});
    }catch(e){}};

    const finish = won => {
      if(!running)return; running=false; cancelAnimationFrame(raf);
      window.removeEventListener('keydown',onKD); window.removeEventListener('keyup',onKU);
      const secs=(Date.now()-tStart)/1000;
      const tBonus=won?Math.max(0,Math.round(700-Math.max(0,secs-12)*15)):0;
      const pts=(won?200:0)+tBonus+car.saltos*500+(car.stylePoints||0)-car.roofLandings*10;
      onComplete({rawScore:Math.min(100,Math.max(0,pts/10|0)), timeMs:Date.now()-tStart,
                  errors:car.roofLandings, passed:won||car.saltos>0, saltos:car.saltos});
    };

    // ── Draw helpers ──
    const roundRect=(x,y,w,h,r)=>{
      ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);
      ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);
      ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);
      ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);
      ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();
    };

    const drawCar=(cx,cy,ang,wAng)=>{
      ctx.save(); ctx.translate(cx,cy); ctx.rotate(ang);

      // Shadow beneath
      ctx.save(); ctx.globalAlpha=0.22; ctx.fillStyle='#000';
      ctx.beginPath(); ctx.ellipse(1,17,21,5,0,0,Math.PI*2); ctx.fill(); ctx.restore();

      // Suspension springs (visual only)
      ctx.strokeStyle='rgba(255,255,255,.18)'; ctx.lineWidth=1.5;
      [[-14,9],[12,9]].forEach(([x,y])=>{
        ctx.beginPath(); ctx.moveTo(x,y-3); ctx.lineTo(x,y+5); ctx.stroke();
      });

      // Body
      const bg=ctx.createLinearGradient(-20,-15,20,12);
      bg.addColorStop(0,'#ff7070'); bg.addColorStop(0.4,'#e84040'); bg.addColorStop(1,'#a81010');
      ctx.fillStyle=bg; roundRect(-21,-13,42,25,5); ctx.fill();
      // Body highlight
      ctx.fillStyle='rgba(255,255,255,.12)'; roundRect(-19,-12,20,6,3); ctx.fill();

      // Roof/cab
      const rg=ctx.createLinearGradient(-12,-24,12,-8);
      rg.addColorStop(0,'#cc3333'); rg.addColorStop(1,'#991111');
      ctx.fillStyle=rg; roundRect(-12,-24,24,14,4); ctx.fill();

      // Windshield
      const wg=ctx.createLinearGradient(-10,-22,10,-10);
      wg.addColorStop(0,'rgba(160,220,255,.85)'); wg.addColorStop(1,'rgba(100,180,255,.6)');
      ctx.fillStyle=wg; roundRect(-10,-22,20,11,2); ctx.fill();
      // Glare
      ctx.fillStyle='rgba(255,255,255,.5)'; roundRect(-9,-21,6,4,1); ctx.fill();

      // Exhaust pipe
      ctx.fillStyle='#555'; roundRect(-23,-8,4,6,1); ctx.fill();

      // Wheels (2: front and rear, side view)
      const wPos=[[-14,10],[14,10]]; // front and rear
      for(const[wx,wy]of wPos){
        ctx.save(); ctx.translate(wx,wy); ctx.rotate(wAng);
        // Outer tire shadow
        ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.arc(1,1,9,0,Math.PI*2); ctx.fill();
        // Tire
        ctx.fillStyle='#111'; ctx.beginPath(); ctx.arc(0,0,8.5,0,Math.PI*2); ctx.fill();
        // Tire highlight arc
        ctx.strokeStyle='#2a2a2a'; ctx.lineWidth=3;
        ctx.beginPath(); ctx.arc(0,0,8.5,0,Math.PI*2); ctx.stroke();
        // Rubber detail
        for(let t=0;t<8;t++){
          const a=t*Math.PI/4;
          ctx.fillStyle='#1a1a1a';
          ctx.beginPath(); ctx.arc(Math.cos(a)*8.5,Math.sin(a)*8.5,2,0,Math.PI*2); ctx.fill();
        }
        // Rim (nice gradient)
        const rg2=ctx.createRadialGradient(-2,-2,0,0,0,6);
        rg2.addColorStop(0,'#ddd'); rg2.addColorStop(0.5,'#888'); rg2.addColorStop(1,'#444');
        ctx.fillStyle=rg2; ctx.beginPath(); ctx.arc(0,0,5.5,0,Math.PI*2); ctx.fill();
        // Rim ring
        ctx.strokeStyle='#aaa'; ctx.lineWidth=1.2;
        ctx.beginPath(); ctx.arc(0,0,5.5,0,Math.PI*2); ctx.stroke();
        // Center hub
        ctx.fillStyle='#ccc'; ctx.beginPath(); ctx.arc(0,0,2,0,Math.PI*2); ctx.fill();
        // 5 spokes
        ctx.strokeStyle='#999'; ctx.lineWidth=1.5;
        for(let s=0;s<5;s++){
          const a=s*Math.PI*2/5;
          ctx.beginPath(); ctx.moveTo(Math.cos(a)*2,Math.sin(a)*2); ctx.lineTo(Math.cos(a)*5,Math.sin(a)*5); ctx.stroke();
        }
        ctx.restore();
      }

      // Exhaust smoke when gassing
      if(inp.fwd && frames%2===0){
        ctx.globalAlpha=0.3+Math.random()*.2;
        ctx.fillStyle='#ccc';
        ctx.beginPath(); ctx.arc(-26+Math.random()*5,-3+Math.random()*4,2+Math.random()*3,0,Math.PI*2); ctx.fill();
        ctx.globalAlpha=1;
      }
      ctx.restore();
    };

    const drawTree=(x,y,h)=>{
      const tiers=3;
      for(let i=0;i<tiers;i++){
        const ty=y-h*(0.3+i*0.25);
        const tw=h*(0.52-i*0.13);
        const g=ctx.createLinearGradient(x-tw,ty,x+tw,ty);
        g.addColorStop(0,'#1d4a09'); g.addColorStop(0.5,'#2e7a12'); g.addColorStop(1,'#1d4a09');
        ctx.fillStyle=g;
        ctx.beginPath(); ctx.moveTo(x-tw,y-h*i*0.25); ctx.lineTo(x,ty); ctx.lineTo(x+tw,y-h*i*0.25); ctx.closePath(); ctx.fill();
      }
      // Trunk
      const tg=ctx.createLinearGradient(x-3,y,x+3,y);
      tg.addColorStop(0,'#3d1f00'); tg.addColorStop(1,'#6b3a10');
      ctx.fillStyle=tg; ctx.fillRect(x-3,y,6,h*.28);
    };

    const drawMtn=(x,y,w,h,dark,mid)=>{
      const g=ctx.createLinearGradient(x-w*.1,y-h,x+w*.3,y);
      g.addColorStop(0,mid); g.addColorStop(0.7,dark); g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=g;
      ctx.beginPath(); ctx.moveTo(x-w/2,y); ctx.lineTo(x,y-h); ctx.lineTo(x+w/2,y); ctx.closePath(); ctx.fill();
      // Snow
      ctx.fillStyle='rgba(255,255,255,.82)';
      ctx.beginPath(); ctx.moveTo(x-w*.10,y-h+h*.13); ctx.lineTo(x,y-h); ctx.lineTo(x+w*.10,y-h+h*.13); ctx.closePath(); ctx.fill();
    };

    const drawCloud=(x,y,r,a=0.82)=>{
      ctx.save(); ctx.globalAlpha=a; ctx.fillStyle='#eef6ff';
      for(const[dx,dy,s]of [[0,0,1],[-.58,.12,.72],[.58,.12,.72],[-.28,-.22,.55],[.28,-.22,.55],[0,-.3,.45]]){
        ctx.beginPath(); ctx.arc(x+dx*r*1.5,y+dy*r,s*r,0,Math.PI*2); ctx.fill();
      }
      ctx.restore();
    };

    // Dust particles
    const spawnDust=(wx,wy)=>{
      if(car.dustParts.length>25)return;
      for(let i=0;i<3;i++) car.dustParts.push({
        wx, wy, vx:-1.5+Math.random()*1, vy:-1-Math.random()*1.5,
        life:1, r:2+Math.random()*4
      });
    };

    // Trees placed at fixed world positions
    const TREES=[];
    for(let tx=500;tx<GOAL;tx+=280+Math.random()*150) TREES.push({wx:tx,h:28+Math.random()*22});

    // Clouds: fixed world positions
    const CLOUDS=[];
    for(let cx=200;cx<GOAL;cx+=500+Math.random()*400) CLOUDS.push({wx:cx,wy:H*(.07+Math.random()*.12),r:22+Math.random()*18});

    const loop=()=>{
      if(!running)return;
      raf=requestAnimationFrame(loop);
      frames++;

      // Physics
      const terrY=getY(car.wx), terrAng=getAng(car.wx);
      const groundContact=car.wy+CAR_H+2;
      const onGround=groundContact>=terrY;

      if(onGround){
        car.wy=terrY-CAR_H; car.vy=0; car.onGround=true; car.airTime=0; car.saltoRot=0;
        // Track clean driving time (no roof landings) → speed bonus
        const nowSec=(Date.now()-tStart)/1000;
        if(car.roofLandings===0||(nowSec-car._lastCleanTick)<0.5){
          car.cleanTime=Math.min(120,car.cleanTime+0.016);
        }
        car._lastCleanTick=nowSec;
        // Speed boost: +10% every 10s clean, max +80% at 80s
        const prevBoost=car.speedBoost;
        car.speedBoost=1.0+Math.min(0.8,car.cleanTime*0.01);
        if(car.speedBoost>prevBoost+0.05){car.speedFlash=40;}
        // Smooth angle firmly to slope on landing
        const dAng=((terrAng-car.ang+Math.PI*3)%(Math.PI*2))-Math.PI;
        car.ang+=dAng*0.45;
        car.spin*=0.08;
        if(inp.fwd){
          car.gasTime=Math.min(car.gasTime+1,180);
          const baseBoost=0.85+Math.min(3.8,car.gasTime*.022);
          const boost=baseBoost*car.speedBoost; // progressive streak bonus
          car.vx+=Math.cos(terrAng)*boost;
          if(frames%3===0) spawnDust(car.wx-12,terrY);
        } else { car.gasTime=Math.max(0,car.gasTime-4); }
        if(inp.back){ car.vx-=Math.cos(terrAng)*.7; car.gasTime=0; }
        car.vx*=0.79;
      } else {
        car.onGround=false; car.airTime++; 
        // Big air: after 10s clean driving, get floaty jumps
        const gravMult = car.cleanTime>10 ? Math.max(0.4, 1.0-(car.cleanTime-10)*0.025) : 1.0;
        car.vy+=0.16*gravMult;
        car.spin*=0.993;
        car.saltoRot+=Math.abs(car.spin);
        if(car.saltoRot>=Math.PI*1.8){ car.saltoRot-=Math.PI*1.8; car.saltos++; car.saltoFlash=45; beep([440,550,660,880]); }
      }
      if(inp.rotup) car.spin=Math.min(0.22,car.spin+(car.spin<0?.055:.025));
      if(inp.rotdn) car.spin=Math.max(-0.22,car.spin-(car.spin>0?.055:.025));
      if(!inp.rotup&&!inp.rotdn&&!onGround) car.spin*=0.97;
      car.ang+=car.spin;
      const maxSpd=Math.round(22*car.speedBoost); car.vx=Math.max(-9,Math.min(maxSpd,car.vx));
      car.wx+=car.vx; car.wy+=car.vy;
      car.wheelAng+=car.vx*0.09;

      // Update dust particles
      car.dustParts=car.dustParts.filter(p=>p.life>0.05);
      for(const p of car.dustParts){ p.wx+=p.vx; p.wy+=p.vy; p.vy+=0.04; p.vx*=0.95; p.life*=0.88; }

      // Roof landing
      const norm=((car.ang%(Math.PI*2))+Math.PI*2)%(Math.PI*2);
      const upside=norm>Math.PI*.55&&norm<Math.PI*1.45;
      // Mid-air tilt bonus: 30-150° = style points
      if(!onGround && car.airTime>8){
        const tilt = Math.min(norm, Math.PI*2-norm); // 0=upright, π=inverted
        if(tilt > Math.PI*.25 && !car._tiltBonus){ // significantly tilted
          car._tiltBonus=true;
          car.stylePoints=(car.stylePoints||0)+50;
          car.styleFlash=30;
        }
      } else { car._tiltBonus=false; }
      // Roof landing: small penalty, just bounce back up
      if(onGround&&upside){
        if(!car._roofLanded){
          car._roofLanded=true;
          car.roofLandings++;
          car.vy=-4.0;
          car.spin=(car.spin>0?.08:-.08);
          car.penaltyFlash=35;
          car.roofToast=100;
          // Reset speed boost on crash
          car.cleanTime=Math.max(0,car.cleanTime*0.5);
          car.speedBoost=1.0+Math.min(0.8,car.cleanTime*0.01);
        }
        // Never end game from roof - just bounce
      } else car._roofLanded=false;

      if(car.wy>H+200||car.wx<-150){finish(false);return;}
      if(car.wx>=GOAL){finish(true);return;}

      // ── DRAW ──
      const camX=car.wx-CAM_X;
      ctx.clearRect(0,0,W,H);

      // Sky gradient — darkens as you progress
      const prog=Math.min(1,car.wx/GOAL);
      const skyG=ctx.createLinearGradient(0,0,0,H);
      skyG.addColorStop(0,`hsl(230,${62-prog*10}%,${10+prog*3}%)`);
      skyG.addColorStop(0.6,`hsl(220,${55-prog*8}%,${18+prog*4}%)`);
      skyG.addColorStop(1,`hsl(210,${45}%,${24}%)`);
      ctx.fillStyle=skyG; ctx.fillRect(0,0,W,H);

      // Stars (parallax 0)
      ctx.fillStyle='rgba(255,255,255,.55)';
      for(let i=0;i<50;i++){
        const sx=(i*173+camX*.003)%W, sy=(i*97)%(H*.5);
        const blink=.5+.4*Math.sin(frames*.05+i);
        ctx.globalAlpha=blink; ctx.fillRect(sx|0,sy|0,(i%4===0)?2:1,(i%4===0)?2:1);
      }
      ctx.globalAlpha=1;

      // Moon
      ctx.fillStyle='rgba(255,245,180,.88)'; ctx.beginPath(); ctx.arc(W*.83,30,22,0,Math.PI*2); ctx.fill();
      const moonG=ctx.createRadialGradient(W*.83+11,25,0,W*.83+11,25,19);
      moonG.addColorStop(0,`hsl(230,62%,${11+prog*3}%)`); moonG.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=moonG; ctx.beginPath(); ctx.arc(W*.83+11,25,19,0,Math.PI*2); ctx.fill();
      // Moon craters
      ctx.fillStyle='rgba(0,0,0,.1)'; [[W*.80,25,4],[W*.86,34,3],[W*.82,20,2.5]].forEach(([x,y,r])=>{ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();});

      // Far mountains (parallax .06)
      const mOff=camX*.06;
      drawMtn(W*.13-(mOff)%W,getY(camX+W*.13),200,110,'#1a0c55','#251570');
      drawMtn(W*.43-(mOff*.8)%W,getY(camX+W*.43),165,90,'#150a45','#1e1160');
      drawMtn(W*.72-(mOff*.6)%W,getY(camX+W*.72),140,78,'#120850','#19104a');
      drawMtn(W*.31-(mOff*.45)%W,getY(camX+W*.31),110,62,'#0e0638','#150e40');

      // Clouds (parallax .018)
      for(const cl of CLOUDS){
        const sx=(cl.wx-camX*.018+GOAL)%W; // very slow parallax
        const cx2=cl.wx-camX;
        if(cx2>-80&&cx2<W+80) drawCloud(cx2,cl.wy,cl.r);
      }

      // Terrain
      // Deep earth
      ctx.fillStyle='#0a1803';
      ctx.beginPath(); ctx.moveTo(-1,getY(camX-1));
      for(let sx=0;sx<=W+1;sx+=STEP) ctx.lineTo(sx,getY(camX+sx));
      ctx.lineTo(W+1,H+2); ctx.lineTo(-1,H+2); ctx.closePath(); ctx.fill();

      // Mid earth with gradient
      const eg=ctx.createLinearGradient(0,H*.4,0,H);
      eg.addColorStop(0,'#172e05'); eg.addColorStop(1,'#0a1803');
      ctx.fillStyle=eg;
      ctx.beginPath(); ctx.moveTo(-1,getY(camX-1)+3);
      for(let sx=0;sx<=W+1;sx+=STEP) ctx.lineTo(sx,getY(camX+sx)+3);
      for(let sx=W+1;sx>=-1;sx-=STEP) ctx.lineTo(sx,getY(camX+sx)+16);
      ctx.closePath(); ctx.fill();

      // Grass line (glow effect)
      ctx.shadowColor='#6ed62a'; ctx.shadowBlur=5;
      ctx.strokeStyle='#7ae62a'; ctx.lineWidth=3.5; ctx.lineJoin='round';
      ctx.beginPath(); ctx.moveTo(-1,getY(camX-1));
      for(let sx=0;sx<=W+1;sx+=STEP) ctx.lineTo(sx,getY(camX+sx));
      ctx.stroke(); ctx.shadowBlur=0;

      // Inner grass texture
      ctx.strokeStyle='#4db820'; ctx.lineWidth=1.2;
      ctx.beginPath(); ctx.moveTo(-1,getY(camX-1)+5);
      for(let sx=0;sx<=W+1;sx+=STEP*2) ctx.lineTo(sx,getY(camX+sx)+5);
      ctx.stroke();

      // Dust particles
      for(const p of car.dustParts){
        const px=p.wx-camX;
        if(px>-20&&px<W+20){
          ctx.globalAlpha=p.life*0.6;
          ctx.fillStyle='#a8883a';
          ctx.beginPath(); ctx.arc(px,p.wy,p.r*p.life+1,0,Math.PI*2); ctx.fill();
        }
      }
      ctx.globalAlpha=1;

      // Goal flag
      const gsx=GOAL-camX;
      if(gsx>-40&&gsx<W+80){
        const gy=getY(GOAL);
        // Pole
        const pg=ctx.createLinearGradient(gsx-1,gy-90,gsx+1,gy);
        pg.addColorStop(0,'#ddd'); pg.addColorStop(1,'#888');
        ctx.fillStyle=pg; ctx.fillRect(gsx-1.5,gy-90,3,90);
        // Flag
        ctx.fillStyle='#E74C3C';
        ctx.beginPath(); ctx.moveTo(gsx,gy-90); ctx.lineTo(gsx+40,gy-72); ctx.lineTo(gsx,gy-54); ctx.closePath(); ctx.fill();
        ctx.fillStyle='#fff'; ctx.font='bold 9px sans-serif'; ctx.textAlign='left'; ctx.fillText('ZIEL',gsx+5,gy-68);
        // Glow
        const gg=ctx.createRadialGradient(gsx,gy-72,0,gsx,gy-72,50);
        gg.addColorStop(0,'rgba(231,76,60,.25)'); gg.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=gg; ctx.beginPath(); ctx.arc(gsx,gy-72,50,0,Math.PI*2); ctx.fill();
      }

      // Trees
      for(const tr of TREES){
        const sx=tr.wx-camX;
        if(sx<-50||sx>W+50)continue;
        drawTree(sx,getY(tr.wx),tr.h);
      }

      // Car
      drawCar(CAM_X, car.wy, car.ang, car.wheelAng);

      // ── HUD ──
      const elapsed=(Date.now()-tStart)/1000;
      const pct=Math.min(100,(car.wx/GOAL*100)|0);
      const spd=Math.abs(car.vx);

      // Top bar bg
      ctx.fillStyle='rgba(0,0,0,.55)'; roundRect(0,0,W,26,0); ctx.fill();

      // Progress bar
      const barW=(car.wx/GOAL)*W;
      const barG=ctx.createLinearGradient(0,0,barW,0);
      barG.addColorStop(0,'#1a9e40'); barG.addColorStop(0.7,'#27AE60'); barG.addColorStop(1,'#6ed62a');
      ctx.fillStyle=barG; ctx.fillRect(0,0,Math.min(barW,W),4);
      // Shimmer on bar
      if(barW>20){ ctx.fillStyle='rgba(255,255,255,.22)'; ctx.fillRect(0,0,Math.min(barW,W),2); }

      // Timer
      ctx.fillStyle='rgba(255,255,255,.9)'; ctx.font='bold 13px monospace'; ctx.textAlign='left';
      ctx.fillText('⏱ '+elapsed.toFixed(1)+'s', 8, 20);

      // Percent
      ctx.textAlign='center'; ctx.fillStyle='#FFD700'; ctx.font='bold 14px sans-serif';
      ctx.fillText(pct+'%', W/2, 19);

      // Speed + boost indicator
      if(spd>1.5){
        ctx.textAlign='right'; ctx.font='bold 11px monospace';
        ctx.fillStyle=spd>14?'#ff6b35':spd>8?'#FFD700':'#7ae62a';
        const boostPct=Math.round((car.speedBoost-1)*100);
        const boostStr=boostPct>0?` +${boostPct}%`:'';
        ctx.fillText('⚡'+spd.toFixed(0)+boostStr, W-8, 19);
      }
      // Speed boost flash
      if(car.speedFlash>0){
        car.speedFlash--;
        ctx.globalAlpha=car.speedFlash/40;
        ctx.fillStyle='#FFD700';ctx.textAlign='center';ctx.font='bold 16px sans-serif';
        ctx.fillText('🔥 SPEED BOOST!',W/2,H*.35);
        ctx.globalAlpha=1;
      }
      // Big air indicator
      if(car.cleanTime>10&&!car.onGround&&car.airTime>20){
        ctx.fillStyle='rgba(0,200,255,.7)';ctx.textAlign='center';ctx.font='bold 14px sans-serif';
        ctx.fillText('🌊 BIG AIR!',W/2,H*.45);
      }

      // Saltos
      if(car.saltos>0){
        ctx.textAlign='right'; ctx.font='bold 11px sans-serif'; ctx.fillStyle='#FFD700';
        ctx.fillText('🔄×'+car.saltos, W-8, 19);
      }

      // Salto flash
      if(car.saltoFlash>0){
        car.saltoFlash--;
        const a=car.saltoFlash/45;
        ctx.globalAlpha=a;
        ctx.fillStyle='#FFD700';
        ctx.textAlign='center'; ctx.font='bold 22px sans-serif';
        ctx.fillText('🔄 SALTO! +500',W/2,H*.42);
        ctx.globalAlpha=1;
      }
      // Style point flash
      if(car.styleFlash>0){
        car.styleFlash--;
        ctx.globalAlpha=car.styleFlash/30;
        ctx.fillStyle='#ff69b4';
        ctx.textAlign='center'; ctx.font='bold 18px sans-serif';
        ctx.fillText('✨ STYLE! +50',W/2,H*.52);
        ctx.globalAlpha=1;
      }

      // Roof penalty flash
      if(car.penaltyFlash>0){
        car.penaltyFlash--;
        ctx.globalAlpha=car.penaltyFlash/55*.4;
        ctx.fillStyle='#E74C3C'; ctx.fillRect(0,0,W,H);
        ctx.globalAlpha=1;
      }
      if(car.roofToast>0){
        car.roofToast--;
        ctx.fillStyle='rgba(200,50,50,.88)'; ctx.textAlign='center';
        ctx.font='bold 13px sans-serif';
        ctx.fillText('⚠️ Umgekippt! -30 Pkt', W/2, H*.5);
      }
    };

    raf=requestAnimationFrame(loop);
  }
};
