// PONG - slower start, wall at top, HUD outside canvas
const PongGame = {
  start({onComplete}) {
    const el = document.getElementById('game-area');
    if (!el) return;
    const W=360, H=320, PS=65, PW=10;
    // HUD above canvas, game area below
    el.innerHTML=`<div style="text-align:center;max-width:${W}px;margin:0 auto">
      <!-- HUD bar ABOVE canvas -->
      <div id="pong-hud" style="background:#111;border-radius:8px 8px 0 0;padding:6px 12px;display:flex;justify-content:space-between;align-items:center;width:${W}px;box-sizing:border-box">
        <div id="pong-score" style="font-family:monospace;font-weight:900;font-size:1.2rem;color:#fff">0 : 0</div>
        <div id="pong-timer" style="font-size:.85rem;color:#27AE60;font-weight:700">⏱ 60s</div>
        <div id="pong-speed" style="font-size:.8rem;color:#FFD700">⚡</div>
      </div>
      <!-- Timer bar -->
      <div style="background:#222;height:5px;width:${W}px">
        <div id="pong-tbar" style="background:#27AE60;height:5px;width:100%;transition:width .1s"></div>
      </div>
      <!-- Canvas - no HUD inside -->
      <canvas id="pongcv" width="${W}" height="${H}" style="background:#000;display:block;border-radius:0 0 8px 8px;max-width:100%;touch-action:none"></canvas>
      <!-- Buttons below -->
      <div style="display:flex;justify-content:center;gap:10px;margin-top:8px">
        <button id="pu" style="background:#1a3a2a;color:#27AE60;border:2px solid #27AE60;padding:14px 36px;border-radius:10px;font-size:1.3rem;cursor:pointer;user-select:none;touch-action:none">▲</button>
        <button id="pd" style="background:#3a1a1a;color:#E74C3C;border:2px solid #E74C3C;padding:14px 36px;border-radius:10px;font-size:1.3rem;cursor:pointer;user-select:none;touch-action:none">▼</button>
      </div>
      <div style="font-size:.7rem;color:rgba(255,255,255,.35);margin-top:4px">Du = Links · Computer = Rechts · First to 7 wins!</div>
    </div>`;

    const cv=document.getElementById('pongcv'), ctx=cv.getContext('2d');
    let py=H/2-PS/2, ay=H/2-PS/2;
    let bx=W/2, by=H/2;
    let pscore=0, ascore=0, running=true, tStart=Date.now(), animId;
    let upHeld=false, dnHeld=false;
    const GAME_TIME=60, SPD=7;
    let vx=3.5, vy=2.5; // slow start

    const speedMult=()=>1+Math.min(2.5,(Date.now()-tStart)/1000/GAME_TIME*2.5);

    document.getElementById('pu').addEventListener('pointerdown',e=>{e.preventDefault();upHeld=true;});
    document.getElementById('pd').addEventListener('pointerdown',e=>{e.preventDefault();dnHeld=true;});
    document.addEventListener('pointerup',()=>{upHeld=false;dnHeld=false;});
    const onKey=e=>{if(e.key==='ArrowUp')upHeld=true;else if(e.key==='ArrowDown')dnHeld=true;};
    const onKeyUp=e=>{if(e.key==='ArrowUp')upHeld=false;else if(e.key==='ArrowDown')dnHeld=false;};
    window.addEventListener('keydown',onKey);window.addEventListener('keyup',onKeyUp);

    const reset=(server)=>{
      bx=W/2;by=H/2;
      const ang=(Math.random()-0.5)*0.7;
      vx=(server==='p'?1:-1)*3.5*Math.cos(ang);
      vy=3.5*Math.sin(ang);
    };
    const end=()=>{
      running=false;cancelAnimationFrame(animId);
      window.removeEventListener('keydown',onKey);window.removeEventListener('keyup',onKeyUp);
      onComplete({rawScore:Math.min(100,pscore*14),timeMs:Date.now()-tStart,errors:ascore,passed:pscore>=7||pscore>ascore});
    };
    reset('p');

    const loop=()=>{
      if(!running)return;
      const elapsed=(Date.now()-tStart)/1000;
      const timeLeft=Math.max(0,GAME_TIME-elapsed);
      const sm=speedMult();

      if(upHeld)py=Math.max(0,py-SPD);
      if(dnHeld)py=Math.min(H-PS,py+SPD);

      // AI speed scales with time
      const aiSpd=2.5+sm*1.2;
      const target=by-PS/2;
      ay+=(target>ay?1:-1)*Math.min(aiSpd,Math.abs(target-ay));
      ay=Math.max(0,Math.min(H-PS,ay));

      // Ball
      const cvx=vx*sm, cvy=vy*sm;
      bx+=cvx; by+=cvy;
      // Wall bounce (top and bottom)
      if(by<=6){vy=Math.abs(vy);by=6;}
      if(by>=H-6){vy=-Math.abs(vy);by=H-6;}
      // Player paddle
      if(bx<=PW+12&&by>=py&&by<=py+PS){
        vx=Math.abs(vx)*1.02;
        const rel=(by-(py+PS/2))/(PS/2);vy=rel*4+Math.sign(vy)*1.5;
        bx=PW+13;
      }
      // AI paddle
      if(bx>=W-PW-12&&by>=ay&&by<=ay+PS){
        vx=-Math.abs(vx)*1.02;
        const rel=(by-(ay+PS/2))/(PS/2);vy=rel*4+Math.sign(vy)*1.5;
        bx=W-PW-13;
      }
      if(bx<0){ascore++;reset('p');if(ascore>=7)end();}
      if(bx>W){pscore++;reset('a');if(pscore>=7)end();}
      if(timeLeft<=0)end();

      // Update HUD elements
      document.getElementById('pong-score').textContent=pscore+' : '+ascore;
      const tEl=document.getElementById('pong-timer');
      if(tEl){tEl.textContent='⏱ '+Math.ceil(timeLeft)+'s';tEl.style.color=timeLeft<15?'#E74C3C':timeLeft<30?'#F39C12':'#27AE60';}
      const tbar=document.getElementById('pong-tbar');
      if(tbar){tbar.style.width=(timeLeft/GAME_TIME*100)+'%';tbar.style.background=timeLeft<15?'#E74C3C':timeLeft<30?'#F39C12':'#27AE60';}
      const sEl=document.getElementById('pong-speed');
      if(sEl){sEl.textContent='⚡'.repeat(Math.min(5,Math.ceil(sm)));sEl.style.color=sm>2?'#E74C3C':sm>1.5?'#F39C12':'#27AE60';}

      // Draw - CLEAN, no HUD inside
      ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
      // Center line
      ctx.setLineDash([5,5]);ctx.strokeStyle='rgba(255,255,255,.12)';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(W/2,0);ctx.lineTo(W/2,H);ctx.stroke();ctx.setLineDash([]);
      // Top and bottom walls (visual)
      ctx.fillStyle='rgba(255,255,255,.15)';
      ctx.fillRect(0,0,W,4);ctx.fillRect(0,H-4,W,4);
      // Paddles
      ctx.fillStyle='#27AE60';ctx.beginPath();if(ctx.roundRect)ctx.roundRect(4,py,PW,PS,3);else ctx.rect(4,py,PW,PS);ctx.fill();
      ctx.fillStyle='#E74C3C';ctx.beginPath();if(ctx.roundRect)ctx.roundRect(W-PW-4,ay,PW,PS,3);else ctx.rect(W-PW-4,ay,PW,PS);ctx.fill();
      // Ball + trail
      for(let i=3;i>=1;i--){ctx.fillStyle=`rgba(255,255,255,${0.08/i})`;ctx.beginPath();ctx.arc(bx-cvx*i*0.5,by-cvy*i*0.5,8-i,0,Math.PI*2);ctx.fill();}
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(bx,by,7,0,Math.PI*2);ctx.fill();

      animId=requestAnimationFrame(loop);
    };
    loop();
    setTimeout(()=>{if(running)end();},120000);
  }
};
window.PongGame=PongGame;
