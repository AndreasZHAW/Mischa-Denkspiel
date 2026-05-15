// RACE — Hill Climb style mit Salto, Zeitbonus, schöner Grafik
const StuntGame = {
  start({onComplete}) {
    const el = document.getElementById('game-area');
    if (!el) return;
    const W=420, H=280;
    const isMobile = 'ontouchstart' in window;

    el.innerHTML = `<div style="text-align:center;font-family:sans-serif">
      <canvas id="stcv" width="${W}" height="${H}"
        style="border-radius:10px;width:100%;max-width:${W}px;height:auto;display:block;margin:0 auto;background:#06001a;touch-action:none"></canvas>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px;margin-top:8px;max-width:${W}px;margin-left:auto;margin-right:auto">
        <button id="st-rotdn" style="background:linear-gradient(135deg,#6C3483,#8E44AD);color:#fff;border:none;padding:12px 6px;border-radius:10px;font-size:1.1rem;font-weight:900;cursor:pointer;touch-action:none;user-select:none">↺</button>
        <button id="st-back"  style="background:linear-gradient(135deg,#E74C3C,#C0392B);color:#fff;border:none;padding:12px 6px;border-radius:10px;font-size:1rem;font-weight:900;cursor:pointer;touch-action:none;user-select:none">◀</button>
        <button id="st-fwd"   style="background:linear-gradient(135deg,#27AE60,#1E8449);color:#fff;border:none;padding:12px 6px;border-radius:10px;font-size:1rem;font-weight:900;cursor:pointer;touch-action:none;user-select:none">▶</button>
        <button id="st-rotup" style="background:linear-gradient(135deg,#8E44AD,#9B59B6);color:#fff;border:none;padding:12px 6px;border-radius:10px;font-size:1.1rem;font-weight:900;cursor:pointer;touch-action:none;user-select:none">↻</button>
      </div>
      <div style="font-size:.65rem;color:rgba(255,255,255,.35);margin-top:3px">↺↻ = Drehen · ◀ Rückwärts · ▶ Gas</div>
    </div>`;

    const cv = document.getElementById('stcv');
    const ctx = cv.getContext('2d');
    const GOAL = 10000;

    // Smooth terrain generation
    let terrain = [];
    let ty = H * 0.62;
    const STEP = 5;
    for(let x = 0; x <= GOAL + 300; x += STEP) {
      // Bigger hills with occasional ramps
      const hillMode = Math.random();
      if(hillMode < 0.03) {
        ty -= 35 + Math.random()*25; // big hill up (ramp for jump)
      } else if(hillMode < 0.06) {
        ty += 30 + Math.random()*20; // valley after hill
      } else {
        ty += (Math.random() - 0.5) * 14;
      }
      ty = Math.max(H*0.28, Math.min(H*0.80, ty));
      terrain.push({x, y: ty});
    }
    const getTY = wx => {
      const i = Math.max(0, Math.min(terrain.length-2, Math.floor(wx/STEP)));
      const t = (wx/STEP) - i;
      return terrain[i].y*(1-t) + terrain[i+1].y*t;
    };
    const getAngle = wx => {
      const y1 = getTY(wx-8), y2 = getTY(wx+8);
      return Math.atan2(y2-y1, 16);
    };

    let car = {wx:150, wy:getTY(150)-22, vx:0, vy:0, angle:0, spin:0,
               onGround:false, airTime:0, landingFrames:0,
               saltoRot:0, saltos:0, saltoFlash:0,
               roofLandings:0, roofToast:0, penaltyFlash:0, _roofLanded:false,
               gasTime:0};
    const fwd={v:false}, back={v:false}, rotup={v:false}, rotdn={v:false};
    let running=true, tStart=Date.now(), animId, frames=0;
    const CAM_X = W * 0.28;

    // Button wiring
    const wire=(id,hold)=>{
      const b=document.getElementById(id); if(!b)return;
      b.addEventListener('pointerdown',e=>{e.preventDefault();hold.v=true;});
      b.addEventListener('pointerup',()=>hold.v=false);
      b.addEventListener('pointercancel',()=>hold.v=false);
    };
    wire('st-fwd',fwd); wire('st-back',back); wire('st-rotup',rotup); wire('st-rotdn',rotdn);
    const onKey=e=>{const m={ArrowRight:fwd,ArrowLeft:back,ArrowUp:rotup,ArrowDown:rotdn};if(m[e.key])m[e.key].v=true;};
    const onKeyUp=e=>{const m={ArrowRight:fwd,ArrowLeft:back,ArrowUp:rotup,ArrowDown:rotdn};if(m[e.key])m[e.key].v=false;};
    window.addEventListener('keydown',onKey); window.addEventListener('keyup',onKeyUp);

    const playSaltoSound=()=>{try{const ac=new(window.AudioContext||window.webkitAudioContext)();const o=ac.createOscillator(),g=ac.createGain();o.type='square';[523,659,784,1047].forEach((f,i)=>o.frequency.setValueAtTime(f,ac.currentTime+i*0.12));g.gain.setValueAtTime(0.12,ac.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.6);o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+0.6);}catch(e){}};

    const end=(won)=>{
      if(!running)return; running=false;
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown',onKey); window.removeEventListener('keyup',onKeyUp);
      const timeSecs=(Date.now()-tStart)/1000;
      const timeBonus = won ? Math.max(0, Math.round(500-Math.max(0,timeSecs-8)*10)) : 0;
      const roofPenalty=(car.roofLandings||0)*20;
      const totalPts=(won?200:0)+timeBonus+car.saltos*500-roofPenalty;
      const rawScore=Math.min(100,Math.max(0,Math.round(totalPts/10)));
      onComplete({rawScore, timeMs:Date.now()-tStart, errors:car.roofLandings||0, passed:won||car.saltos>0, saltos:car.saltos});
    };

    // Draw helpers
    const drawCloud=(x,y,s)=>{ctx.fillStyle='rgba(255,255,255,.85)';[[0,0,1],[-.5,.2,.7],[.5,.2,.7],[-.25,-.15,.5],[.25,-.15,.5]].forEach(([dx,dy,r])=>{ctx.beginPath();ctx.arc(x+dx*s*28,y+dy*s*28,s*18*r,0,Math.PI*2);ctx.fill();});};
    const drawTree=(x,y,h)=>{ctx.fillStyle='#2d5a1b';ctx.beginPath();ctx.moveTo(x,y-h);ctx.lineTo(x-h*.45,y);ctx.lineTo(x+h*.45,y);ctx.closePath();ctx.fill();ctx.fillStyle='#1a3a10';ctx.beginPath();ctx.moveTo(x,y-h*.85);ctx.lineTo(x-h*.32,y-h*.3);ctx.lineTo(x+h*.32,y-h*.3);ctx.closePath();ctx.fill();ctx.fillStyle='#6b3d1a';ctx.fillRect(x-h*.08,y,h*.16,h*.3);};
    const drawMountain=(x,y,w,h,c1,c2)=>{const g=ctx.createLinearGradient(x,y-h,x,y);g.addColorStop(0,c1);g.addColorStop(1,c2);ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x-w/2,y);ctx.lineTo(x,y-h);ctx.lineTo(x+w/2,y);ctx.closePath();ctx.fill();ctx.fillStyle='rgba(255,255,255,.8)';ctx.beginPath();ctx.moveTo(x-w*.08,y-h+h*.12);ctx.lineTo(x,y-h);ctx.lineTo(x+w*.08,y-h+h*.12);ctx.closePath();ctx.fill();};

    const loop=()=>{
      if(!running)return;
      frames++;
      const terrY=getTY(car.wx), terrAng=getAngle(car.wx);
      const onGround=car.wy>=terrY-22;

      if(onGround){
        car.wy=terrY-22; car.vy=0; car.onGround=true;
        car.landingFrames++; car.airTime=0; car.saltoRot=0;
        car.angle+=(terrAng-car.angle)*0.38;
        car.spin*=0.35;
        if(fwd.v){car.gasTime++;const boost=Math.min(4,1+car.gasTime*.012);car.vx+=Math.cos(terrAng)*boost;}
        else{car.gasTime=Math.max(0,car.gasTime-4);}
        if(back.v){car.vx-=Math.cos(terrAng)*.7;car.gasTime=0;}
        car.vx*=0.82;
      } else {
        car.onGround=false; car.landingFrames=0; car.airTime++;
        car.vy+=0.08; car.spin*=0.985;
        car.saltoRot+=Math.abs(car.spin);
        if(car.saltoRot>=Math.PI*1.85){
          car.saltoRot-=Math.PI*1.85; car.saltos++; car.saltoFlash=35;
          playSaltoSound();
        }
      }
      if(rotup.v)car.spin=Math.min(0.18,car.spin+(car.spin<0?.04:.018));
      if(rotdn.v)car.spin=Math.max(-0.18,car.spin-(car.spin>0?.04:.018));
      car.angle+=car.spin;
      car.vx=Math.max(-10,Math.min(18,car.vx));
      car.wx+=car.vx; car.wy+=car.vy;

      // Roof landing
      const norm=((car.angle%(Math.PI*2))+Math.PI*2)%(Math.PI*2);
      const upside=norm>Math.PI*.62&&norm<Math.PI*1.38;
      if(onGround&&upside&&car.landingFrames>5){
        if(!car._roofLanded){car._roofLanded=true;car.roofLandings++;car.vy=-4;car.spin=car.spin>0?.08:-.08;car.penaltyFlash=40;car.roofToast=120;}
        if(car.landingFrames>30){end(false);return;}
      } else{car._roofLanded=false;}
      if(car.wy>H+100||car.wx<-80){end(false);return;}
      if(car.wx>=GOAL){end(true);return;}

      // ══ DRAW ══
      const camWX=car.wx-CAM_X;
      ctx.clearRect(0,0,W,H);

      // SKY: clip to above terrain
      ctx.fillStyle='#0a0a2e'; ctx.fillRect(0,0,W,H);
      ctx.save();
      ctx.beginPath(); ctx.moveTo(-1,-1); ctx.lineTo(W+1,-1);
      for(let sx=W+1;sx>=-1;sx-=4)ctx.lineTo(sx,getTY(camWX+sx));
      ctx.closePath(); ctx.clip();
      const sky=ctx.createLinearGradient(0,0,0,H);
      sky.addColorStop(0,'#040828'); sky.addColorStop(.5,'#0a1045'); sky.addColorStop(1,'#151a60');
      ctx.fillStyle=sky; ctx.fillRect(0,0,W,H);
      // Stars
      if(frames%2===0){ctx.fillStyle='rgba(255,255,255,.5)';for(let i=0;i<25;i++)ctx.fillRect((i*173+frames*0)%W,(i*97)%(H*.55),i%3===0?2:1,i%3===0?2:1);}
      // Moon
      ctx.fillStyle='rgba(255,235,150,.9)';ctx.beginPath();ctx.arc(W*.82,32,22,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#040828';ctx.beginPath();ctx.arc(W*.82+10,26,18,0,Math.PI*2);ctx.fill();
      // Clouds
      if(frames>0)drawCloud(W*.2-camWX*.02,H*.18,0.9);drawCloud(W*.65-camWX*.015,H*.12,0.7);
      ctx.restore();

      // Far mountains
      const mOff=camWX*.08;
      drawMountain(W*.15-mOff%W,getTY(camWX+W*.15),160,90,'#2a1a6a','#1a1040');
      drawMountain(W*.5-mOff%W,getTY(camWX+W*.5),120,70,'#241566','#14093a');
      drawMountain(W*.82-mOff%W,getTY(camWX+W*.82),100,60,'#1e1260','#100830');

      // TERRAIN: rich layered green
      // Dark base layer
      ctx.fillStyle='#142a06';
      ctx.beginPath(); ctx.moveTo(-1,getTY(camWX-1));
      for(let sx=0;sx<=W+1;sx+=4)ctx.lineTo(sx,getTY(camWX+sx));
      ctx.lineTo(W+1,H+1); ctx.lineTo(-1,H+1); ctx.closePath(); ctx.fill();
      // Mid green layer
      ctx.fillStyle='#1e4008';
      ctx.beginPath(); ctx.moveTo(-1,getTY(camWX-1));
      for(let sx=0;sx<=W+1;sx+=4)ctx.lineTo(sx,getTY(camWX+sx)-2);
      for(let sx=W+1;sx>=-1;sx-=4)ctx.lineTo(sx,getTY(camWX+sx)+6);
      ctx.closePath(); ctx.fill();
      // Grass top
      ctx.strokeStyle='#5cb822'; ctx.lineWidth=3.5; ctx.lineJoin='round';
      ctx.beginPath(); ctx.moveTo(-1,getTY(camWX-1));
      for(let sx=0;sx<=W+1;sx+=4)ctx.lineTo(sx,getTY(camWX+sx));
      ctx.stroke();
      // Subtle soil line
      ctx.strokeStyle='#2d6b10'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(-1,getTY(camWX-1)+5);
      for(let sx=0;sx<=W+1;sx+=8)ctx.lineTo(sx,getTY(camWX+sx)+5);
      ctx.stroke();

      // Trees (parallax)
      for(let tx=200;tx<GOAL;tx+=280){
        const tsx=tx-camWX;
        if(tsx>-30&&tsx<W+30)drawTree(tsx,getTY(camWX+tsx),28+Math.sin(tx)*.1*10);
      }

      // Goal flag
      const gsx=GOAL-camWX;
      if(gsx>-10&&gsx<W+50){
        const gy=getTY(GOAL);
        ctx.fillStyle='#aaa'; ctx.fillRect(gsx-1,gy-70,2.5,70);
        const fg=ctx.createLinearGradient(gsx,gy-70,gsx+32,gy-50);
        fg.addColorStop(0,'#E74C3C'); fg.addColorStop(1,'#ff6644');
        ctx.fillStyle=fg; ctx.beginPath(); ctx.moveTo(gsx,gy-70); ctx.lineTo(gsx+32,gy-60); ctx.lineTo(gsx,gy-50); ctx.closePath(); ctx.fill();
        ctx.fillStyle='#fff'; ctx.font='bold 8px sans-serif'; ctx.textAlign='left'; ctx.fillText('ZIEL',gsx+3,gy-57);
        // Glow
        const flg=ctx.createRadialGradient(gsx,gy-60,0,gsx,gy-60,40);
        flg.addColorStop(0,'rgba(231,76,60,.25)'); flg.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=flg; ctx.fillRect(gsx-40,gy-100,80,80);
      }

      // Progress checkpoints
      for(let cp=1000;cp<GOAL;cp+=1000){
        const csx=cp-camWX;
        if(csx>0&&csx<W){ctx.strokeStyle='rgba(255,215,0,.3)';ctx.lineWidth=2;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(csx,getTY(camWX+csx)-35);ctx.lineTo(csx,getTY(camWX+csx));ctx.stroke();ctx.setLineDash([]);}
      }

      // ── CAR ──
      ctx.save(); ctx.translate(CAM_X,car.wy); ctx.rotate(car.angle);
      // (shadow removed)
      // Body
      const carG=ctx.createLinearGradient(-22,-14,22,6);
      carG.addColorStop(0,'#E74C3C'); carG.addColorStop(.5,'#c0392b'); carG.addColorStop(1,'#922b21');
      ctx.fillStyle=carG;
      if(ctx.roundRect)ctx.roundRect(-22,-14,44,18,4);else ctx.rect(-22,-14,44,18);
      ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,.3)'; ctx.lineWidth=1;
      if(ctx.roundRect){ctx.beginPath();ctx.roundRect(-22,-14,44,18,4);ctx.stroke();}
      // Roof
      const roofG=ctx.createLinearGradient(-14,-28,14,-4);
      roofG.addColorStop(0,'#e84040'); roofG.addColorStop(1,'#c0392b');
      ctx.fillStyle=roofG;
      if(ctx.roundRect)ctx.roundRect(-13,-28,26,15,3);else ctx.rect(-13,-28,26,15);
      ctx.fill();
      // Windshield
      ctx.fillStyle='rgba(180,240,255,.75)'; ctx.fillRect(-9,-26,16,11);
      ctx.strokeStyle='rgba(255,255,255,.4)'; ctx.lineWidth=1; ctx.strokeRect(-9,-26,16,11);
      // Front/back lights
      ctx.fillStyle='rgba(255,240,100,.9)'; ctx.beginPath(); ctx.arc(20,-4,3,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(255,80,80,.9)'; ctx.beginPath(); ctx.arc(-20,-4,2.5,0,Math.PI*2); ctx.fill();
      // Wheels
      [[-14,4],[14,4]].forEach(([wx,wy])=>{
        // Tire
        ctx.fillStyle='#1a1a1a'; ctx.beginPath(); ctx.arc(wx,wy,8,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle='#333'; ctx.lineWidth=2; ctx.stroke();
        // Rim
        ctx.fillStyle='#ccc'; ctx.beginPath(); ctx.arc(wx,wy,4.5,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#999'; ctx.beginPath(); ctx.arc(wx,wy,2,0,Math.PI*2); ctx.fill();
        // Spokes
        ctx.strokeStyle='#aaa'; ctx.lineWidth=1.5;
        for(let a=0;a<Math.PI*2;a+=Math.PI/2){
          ctx.beginPath();ctx.moveTo(wx,wy);ctx.lineTo(wx+Math.cos(a)*4,wy+Math.sin(a)*4);ctx.stroke();
        }
      });
      // Exhaust when gas
      if(fwd.v&&onGround){
        const ex=ctx.createRadialGradient(-24,-2,0,-24,-2,10);
        ex.addColorStop(0,'rgba(255,150,0,.8)'); ex.addColorStop(1,'rgba(255,50,0,0)');
        ctx.fillStyle=ex; ctx.fillRect(-34,-8,14,12);
      }
      ctx.restore();

      // Salto flash
      if(car.saltoFlash>0){
        car.saltoFlash--;
        const gf=ctx.createRadialGradient(CAM_X,car.wy,0,CAM_X,car.wy,80);
        gf.addColorStop(0,`rgba(255,215,0,${car.saltoFlash/35*.6})`);
        gf.addColorStop(1,'rgba(255,215,0,0)');
        ctx.fillStyle=gf; ctx.fillRect(0,0,W,H);
      }
      // Penalty flash
      if(car.penaltyFlash>0){car.penaltyFlash--;ctx.fillStyle=`rgba(231,76,60,${car.penaltyFlash/40*.5})`;ctx.fillRect(0,0,W,H);}

      // ── HUD ──
      ctx.fillStyle='rgba(0,0,10,.82)'; ctx.fillRect(0,0,W,28);
      const elapsed=((Date.now()-tStart)/1000).toFixed(1);
      // Time + bonus preview
      ctx.font='bold 12px monospace'; ctx.textAlign='left'; ctx.fillStyle='#fff';
      ctx.fillText('⏱ '+elapsed+'s',6,18);
      const bonusPreview=Math.max(0,Math.round(500-Math.max(0,parseFloat(elapsed)-8)*10));
      if(bonusPreview>0){ctx.fillStyle='#27AE60';ctx.font='bold 10px monospace';ctx.fillText('+'+bonusPreview+'⏱',72,18);}
      // Progress %
      const pct=Math.min(100,Math.round(car.wx/GOAL*100));
      ctx.textAlign='center'; ctx.fillStyle='#FFD700'; ctx.font='bold 12px monospace';
      const ptsStr=(car.saltos?'🔄×'+car.saltos+' ':'')+pct+'%';
      ctx.fillText(ptsStr,W/2,18);
      // Speed
      ctx.textAlign='right'; ctx.fillStyle='#29B6F6'; ctx.font='bold 11px monospace';
      ctx.fillText('⚡'+(Math.abs(car.vx*3.6)).toFixed(0),W-5,18);
      // Progress bar
      ctx.fillStyle='rgba(255,255,255,.15)'; ctx.fillRect(0,26,W,3);
      const pbar=ctx.createLinearGradient(0,0,W,0);
      pbar.addColorStop(0,'#27AE60'); pbar.addColorStop(0.6,'#FFD700'); pbar.addColorStop(1,'#E74C3C');
      ctx.fillStyle=pbar; ctx.fillRect(0,26,W*car.wx/GOAL,3);
      // Gas bar
      if(car.gasTime>10){
        const gp=Math.min(1,car.gasTime/400);
        const gb=ctx.createLinearGradient(0,0,W,0);
        gb.addColorStop(0,'#27AE60'); gb.addColorStop(.6,'#F39C12'); gb.addColorStop(1,'#E74C3C');
        ctx.fillStyle=gb; ctx.fillRect(0,H-4,W*gp,4);
      }
      // Salto counter
      if(car.saltos>0){
        ctx.fillStyle='rgba(0,0,0,.7)'; ctx.fillRect(0,H-22,W,22);
        ctx.fillStyle='#FFD700'; ctx.font='bold 12px monospace'; ctx.textAlign='left';
        ctx.fillText(`🔄 ${car.saltos} Salto${car.saltos>1?'s':''}! +${car.saltos*500}pts`,6,H-6);
      }
      // Roof toast
      if(car.roofToast>0){
        car.roofToast--;
        ctx.fillStyle='rgba(0,0,0,.8)'; ctx.fillRect(0,H-42,W,20);
        ctx.fillStyle='#E74C3C'; ctx.font='bold 11px monospace'; ctx.textAlign='center';
        ctx.fillText(`⚠️ Dachlandung! -20 Punkte (${car.roofLandings}x)`,W/2,H-27);
      }

      animId=requestAnimationFrame(loop);
    };
    loop();
    setTimeout(()=>{if(running)end(false);},240000);
  }
};
window.StuntGame=StuntGame;
