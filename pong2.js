// PONG - 60s game, speed increases every 5s with countdown
const PongGame = {
  start({onComplete}) {
    const el = document.getElementById('game-area');
    if (!el) return;
    const W=360, H=300, PS=65, PW=10;
    const isMobile = 'ontouchstart' in window;

    el.innerHTML=`<div style="text-align:center">
      <!-- HUD bar -->
      <div style="background:#111;border-radius:8px 8px 0 0;padding:5px 12px;display:flex;justify-content:space-between;align-items:center;gap:6px;max-width:${W+(isMobile?70:0)}px;margin:0 auto">
        <div id="pong-score" style="font-family:monospace;font-weight:900;font-size:1.2rem;color:#fff;min-width:60px">0 : 0</div>
        <div style="flex:1;text-align:center">
          <div id="pong-timer" style="font-size:.82rem;color:#27AE60;font-weight:700">⏱ 60s</div>
          <div id="pong-next-speed" style="font-size:.7rem;color:#F39C12">⚡ schneller in 5s</div>
        </div>
        <div id="pong-speed-level" style="font-size:.8rem;color:#FFD700;min-width:40px;text-align:right">⚡ Lv1</div>
      </div>
      <!-- Speed bar -->
      <div style="background:#222;height:4px;max-width:${W+(isMobile?70:0)}px;margin:0 auto;position:relative">
        <div id="pong-tbar" style="background:#27AE60;height:4px;width:100%;transition:width .1s"></div>
        <div id="pong-5bar" style="position:absolute;top:0;left:0;height:4px;background:rgba(255,165,0,.6);transition:width .1s"></div>
      </div>
      <!-- Mobile: touch zone LEFT + canvas RIGHT side by side -->
      ${isMobile ? `<div style="display:flex;align-items:stretch;gap:0;justify-content:center">
        <!-- Left touch zone -->
        <div id="pong-touch-zone" style="width:64px;flex-shrink:0;background:linear-gradient(180deg,rgba(39,174,96,.15),rgba(39,174,96,.08));border:2px solid rgba(39,174,96,.5);border-right:none;border-radius:0 0 0 8px;touch-action:none;user-select:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:8px 4px;cursor:grab">
          <div style="font-size:.62rem;color:rgba(39,174,96,.8);font-weight:700;writing-mode:vertical-rl;text-orientation:mixed;letter-spacing:1px">▲ ZIEHEN ▼</div>
          <div id="pong-touch-indicator" style="width:40px;flex:1;background:rgba(39,174,96,.08);border-radius:8px;position:relative;min-height:100px">
            <div id="pong-touch-dot" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#27AE60,#1E8449);box-shadow:0 2px 8px rgba(39,174,96,.5)"></div>
          </div>
        </div>
        <!-- Canvas -->
        <canvas id="pongcv" width="${W}" height="${H}" style="background:#000;width:100%;max-width:${W}px;height:auto;display:block;border-radius:0 0 8px 0;max-width:calc(100vw - 80px)"></canvas>
      </div>` 
      : `<canvas id="pongcv" width="${W}" height="${H}" style="background:#000;display:block;border-radius:0 0 8px 8px;max-width:100%;margin:0 auto"></canvas>
      <div style="display:flex;justify-content:center;gap:10px;margin-top:8px">
        <button id="pu" style="background:#1a3a2a;color:#27AE60;border:2px solid #27AE60;padding:14px 36px;border-radius:10px;font-size:1.3rem;cursor:pointer;user-select:none">▲</button>
        <button id="pd" style="background:#3a1a1a;color:#E74C3C;border:2px solid #E74C3C;padding:14px 36px;border-radius:10px;font-size:1.3rem;cursor:pointer;user-select:none">▼</button>
      </div>
      <div style="font-size:.7rem;color:rgba(255,255,255,.35);margin-top:4px">Du = Links · Computer = Rechts · Pfeiltasten ↑↓</div>`}
    </div>`;

    const cv=document.getElementById('pongcv'), ctx=cv.getContext('2d');
    let py=H/2-PS/2, ay=H/2-PS/2;
    let bx=W/2, by=H/2;
    let pscore=0, ascore=0, running=true, tStart=Date.now(), animId;
    let upHeld=false, dnHeld=false;
    const GAME_TIME=60, SPD=6;
    const SPEED_INTERVAL=5; // speed up every 5 seconds
    let vx=2.5, vy=1.8;
    let speedLevel=1;
    let lastSpeedUp=0;

    const speedMult=()=>1 + (speedLevel-1)*0.25; // +25% per level
    const elapsed=()=>(Date.now()-tStart)/1000;

    // Controls
    if(isMobile){
      const tz=document.getElementById('pong-touch-zone');
      const tdot=document.getElementById('pong-touch-dot');
      let lastTY=null;
      if(tz){
        const tind=document.getElementById('pong-touch-indicator');
        tz.addEventListener('touchstart',e=>{e.preventDefault();lastTY=e.touches[0].clientY;if(tdot)tdot.style.boxShadow='0 2px 16px rgba(39,174,96,.8)';},{passive:false});
        tz.addEventListener('touchmove',e=>{
          if(!lastTY)return;e.preventDefault();
          const dy=e.touches[0].clientY-lastTY;
          py=Math.max(0,Math.min(H-PS,py+dy*1.5));
          lastTY=e.touches[0].clientY;
          // Move dot indicator in vertical strip
          if(tdot&&tind){
            const pct=py/(H-PS);
            tdot.style.top=(pct*(tind.clientHeight-34))+'px';
          }
        },{passive:false});
        tz.addEventListener('touchend',()=>{lastTY=null;if(tdot)tdot.style.boxShadow='0 2px 8px rgba(39,174,96,.5)';});
      }
    } else {
      const pu=document.getElementById('pu'),pd=document.getElementById('pd');
      if(pu){pu.addEventListener('pointerdown',e=>{e.preventDefault();upHeld=true;});pu.addEventListener('pointerup',()=>upHeld=false);}
      if(pd){pd.addEventListener('pointerdown',e=>{e.preventDefault();dnHeld=true;});pd.addEventListener('pointerup',()=>dnHeld=false);}
    }
    const onKey=e=>{if(e.key==='ArrowUp')upHeld=true;else if(e.key==='ArrowDown')dnHeld=true;};
    const onKeyUp=e=>{if(e.key==='ArrowUp')upHeld=false;else if(e.key==='ArrowDown')dnHeld=false;};
    window.addEventListener('keydown',onKey);window.addEventListener('keyup',onKeyUp);

    const reset=(server)=>{
      bx=W/2;by=H/2;
      const sm=speedMult();
      vx=(server==='p'?1:-1)*2.5;
      vy=1.8*(Math.random()>0.5?1:-1);
    };
    const end=()=>{
      running=false;cancelAnimationFrame(animId);
      window.removeEventListener('keydown',onKey);window.removeEventListener('keyup',onKeyUp);
      onComplete({rawScore:Math.min(100,pscore*14),timeMs:Date.now()-tStart,errors:ascore,passed:pscore>=7||pscore>ascore});
    };
    
    // Speed up flash effect
    let speedFlash=0;
    const doSpeedUp=()=>{
      speedLevel++;
      speedFlash=30;
      // Play sound
      try{
        const ac=new(window.AudioContext||window.webkitAudioContext)();
        const o=ac.createOscillator();const g=ac.createGain();
        o.frequency.setValueAtTime(440,ac.currentTime);
        o.frequency.exponentialRampToValueAtTime(880,ac.currentTime+0.15);
        g.gain.setValueAtTime(0.2,ac.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.3);
        o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+0.3);
      }catch(e){}
    };

    reset('p');
    const loop=()=>{
      if(!running)return;
      const e=elapsed();
      const tLeft=Math.max(0,GAME_TIME-e);
      const sm=speedMult();
      
      // Check speed increase every 5 seconds
      const currentInterval=Math.floor(e/SPEED_INTERVAL);
      if(currentInterval>lastSpeedUp&&e<GAME_TIME){
        lastSpeedUp=currentInterval;
        doSpeedUp();
      }
      const nextSpeedIn=SPEED_INTERVAL-((e%SPEED_INTERVAL));

      if(!isMobile){
        if(upHeld)py=Math.max(0,py-SPD);
        if(dnHeld)py=Math.min(H-PS,py+SPD);
      }
      // AI
      const aiSpd=1.5+sm*0.8;
      const target=by-PS/2;
      ay+=(target>ay?1:-1)*Math.min(aiSpd,Math.abs(target-ay));
      ay=Math.max(0,Math.min(H-PS,ay));

      // Ball with speed multiplier
      const cvx=vx*sm, cvy=vy*sm;
      bx+=cvx; by+=cvy;
      if(by<=5){vy=Math.abs(vy);by=5;}
      if(by>=H-5){vy=-Math.abs(vy);by=H-5;}
      if(bx<=PW+12&&by>=py&&by<=py+PS){vx=Math.abs(vx)*1.02;const rel=(by-(py+PS/2))/(PS/2);vy=rel*3+Math.sign(vy);bx=PW+13;}
      if(bx>=W-PW-12&&by>=ay&&by<=ay+PS){vx=-Math.abs(vx)*1.02;const rel=(by-(ay+PS/2))/(PS/2);vy=rel*3+Math.sign(vy);bx=W-PW-13;}
      if(bx<0){ascore++;reset('p');if(ascore>=7)end();}
      if(bx>W){pscore++;reset('a');if(pscore>=7)end();}
      if(tLeft<=0)end();

      // Update HUD
      document.getElementById('pong-score').textContent=pscore+' : '+ascore;
      const tEl=document.getElementById('pong-timer');
      if(tEl){tEl.textContent='⏱ '+Math.ceil(tLeft)+'s';tEl.style.color=tLeft<15?'#E74C3C':tLeft<30?'#F39C12':'#27AE60';}
      const nsEl=document.getElementById('pong-next-speed');
      if(nsEl){nsEl.textContent='⚡ schneller in '+Math.ceil(nextSpeedIn)+'s';nsEl.style.color=nextSpeedIn<2?'#E74C3C':'#F39C12';}
      const slEl=document.getElementById('pong-speed-level');
      if(slEl){slEl.textContent='⚡ Lv'+speedLevel;slEl.style.color=speedLevel>8?'#E74C3C':speedLevel>5?'#F39C12':'#FFD700';}
      // Main timer bar
      const tbar=document.getElementById('pong-tbar');
      if(tbar){tbar.style.width=(tLeft/GAME_TIME*100)+'%';tbar.style.background=tLeft<15?'#E74C3C':tLeft<30?'#F39C12':'#27AE60';}
      // 5-second countdown bar (orange, resets every 5s)
      const fbar=document.getElementById('pong-5bar');
      if(fbar){const pct=(e%SPEED_INTERVAL)/SPEED_INTERVAL;fbar.style.width=(pct*100)+'%';}

      // Draw
      ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
      // Speed flash overlay
      if(speedFlash>0){speedFlash--;ctx.fillStyle=`rgba(255,165,0,${speedFlash/60*0.4})`;ctx.fillRect(0,0,W,H);}
      ctx.setLineDash([5,5]);ctx.strokeStyle='rgba(255,255,255,.1)';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(W/2,0);ctx.lineTo(W/2,H);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle='rgba(255,255,255,.2)';ctx.fillRect(0,0,W,3);ctx.fillRect(0,H-3,W,3);
      ctx.fillStyle='#27AE60';ctx.beginPath();if(ctx.roundRect)ctx.roundRect(4,py,PW,PS,3);else ctx.rect(4,py,PW,PS);ctx.fill();
      ctx.fillStyle='#E74C3C';ctx.beginPath();if(ctx.roundRect)ctx.roundRect(W-PW-4,ay,PW,PS,3);else ctx.rect(W-PW-4,ay,PW,PS);ctx.fill();
      for(let i=3;i>=1;i--){ctx.fillStyle=`rgba(255,255,255,${0.06/i})`;ctx.beginPath();ctx.arc(bx-cvx*i*0.4,by-cvy*i*0.4,7-i,0,Math.PI*2);ctx.fill();}
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(bx,by,7,0,Math.PI*2);ctx.fill();
      animId=requestAnimationFrame(loop);
    };
    loop();
    setTimeout(()=>{if(running)end();},120000);
  }
};
window.PongGame=PongGame;
