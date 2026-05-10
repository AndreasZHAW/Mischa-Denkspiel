// PONG - game timer counts down, ball gets faster over time
const PongGame = {
  start({onComplete}) {
    const el = document.getElementById('game-area');
    if (!el) return;
    const W=380, H=400, PS=70, PW=10;
    el.innerHTML=`<div style="text-align:center">
      <canvas id="pongcv" width="${W}" height="${H}" style="background:#000;border-radius:8px;max-width:100%;touch-action:none"></canvas>
      <div style="display:flex;justify-content:center;gap:10px;margin-top:8px">
        <button id="pu" style="background:#1a3a2a;color:#27AE60;border:2px solid #27AE60;padding:14px 32px;border-radius:10px;font-size:1.3rem;cursor:pointer;user-select:none;touch-action:none">▲</button>
        <button id="pd" style="background:#3a1a1a;color:#E74C3C;border:2px solid #E74C3C;padding:14px 32px;border-radius:10px;font-size:1.3rem;cursor:pointer;user-select:none;touch-action:none">▼</button>
      </div>
      <div style="font-size:.72rem;color:rgba(255,255,255,.4);margin-top:4px">Du = Links · Computer = Rechts · Erste 7 Punkte gewinnt!</div>
    </div>`;
    const cv=document.getElementById('pongcv'), ctx=cv.getContext('2d');
    let py=H/2-PS/2, ay=H/2-PS/2;
    let bx=W/2, by=H/2;
    let pscore=0, ascore=0, running=true, tStart=Date.now(), animId;
    let upHeld=false, dnHeld=false;
    const SPD=8;
    const GAME_TIME=60; // 60 second countdown
    let vx=5, vy=3;

    // Speed multiplier increases over time
    const speedMult = () => {
      const elapsed=(Date.now()-tStart)/1000;
      return 1 + elapsed/GAME_TIME * 2.5; // up to 3.5x speed at end
    };
    const baseVX = () => vx>0?1:-1;
    const baseVY = () => vy>0?1:-1;

    document.getElementById('pu').addEventListener('pointerdown',e=>{e.preventDefault();upHeld=true;});
    document.getElementById('pd').addEventListener('pointerdown',e=>{e.preventDefault();dnHeld=true;});
    document.addEventListener('pointerup',()=>{upHeld=false;dnHeld=false;});
    const onKey=e=>{if(e.key==='ArrowUp')upHeld=true;else if(e.key==='ArrowDown')dnHeld=true;};
    const onKeyUp=e=>{if(e.key==='ArrowUp')upHeld=false;else if(e.key==='ArrowDown')dnHeld=false;};
    window.addEventListener('keydown',onKey);window.addEventListener('keyup',onKeyUp);

    const reset = (server) => {
      bx=W/2; by=H/2;
      const ang=(Math.random()-0.5)*0.7;
      vx=(server==='p'?1:-1)*5*Math.cos(ang);
      vy=5*Math.sin(ang);
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
      const timeLeft=Math.max(0, GAME_TIME-elapsed);
      const sm=speedMult();

      // Player
      if(upHeld)py=Math.max(0,py-SPD);
      if(dnHeld)py=Math.min(H-PS,py+SPD);
      // AI gets faster as time goes on
      const aiSpd=3+sm*1.5;
      const target=by-PS/2;
      ay+=(target>ay?1:-1)*Math.min(aiSpd,Math.abs(target-ay));
      ay=Math.max(0,Math.min(H-PS,ay));

      // Ball with speed multiplier
      const cvx=vx*sm, cvy=vy*sm;
      bx+=cvx; by+=cvy;
      if(by<=8||by>=H-8){vy*=-1;by=by<=8?8:H-8;}
      // Player paddle
      if(bx<=PW+14&&bx>=0&&by>=py&&by<=py+PS){
        vx=Math.abs(vx)*1.03;
        const rel=(by-(py+PS/2))/(PS/2);vy=rel*4+Math.sign(vy)*2;
        bx=PW+15;
      }
      // AI paddle
      if(bx>=W-PW-14&&bx<=W&&by>=ay&&by<=ay+PS){
        vx=-Math.abs(vx)*1.03;
        const rel=(by-(ay+PS/2))/(PS/2);vy=rel*4+Math.sign(vy)*2;
        bx=W-PW-15;
      }
      // Score
      if(bx<0){ascore++;reset('p');if(ascore>=7)end();}
      if(bx>W){pscore++;reset('a');if(pscore>=7)end();}
      // Time up
      if(timeLeft<=0)end();

      // Draw
      ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
      ctx.setLineDash([6,6]);ctx.strokeStyle='rgba(255,255,255,.1)';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(W/2,0);ctx.lineTo(W/2,H);ctx.stroke();ctx.setLineDash([]);
      // Paddles
      ctx.fillStyle='#27AE60';ctx.beginPath();ctx.roundRect(4,py,PW,PS,4);ctx.fill();
      ctx.fillStyle='#E74C3C';ctx.beginPath();ctx.roundRect(W-PW-4,ay,PW,PS,4);ctx.fill();
      // Ball + trail
      const trailAlpha=Math.min(0.3,sm*0.08);
      for(let i=3;i>=1;i--){ctx.fillStyle=`rgba(255,255,255,${trailAlpha/i})`;ctx.beginPath();ctx.arc(bx-cvx*i*0.5,by-cvy*i*0.5,8-i,0,Math.PI*2);ctx.fill();}
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(bx,by,8,0,Math.PI*2);ctx.fill();

      // HUD top bar
      ctx.fillStyle='rgba(0,0,0,.7)';ctx.fillRect(0,0,W,44);
      // Score
      ctx.fillStyle='#fff';ctx.font='bold 28px monospace';ctx.textAlign='center';
      ctx.fillText(pscore+' : '+ascore,W/2,32);
      // Timer bar background
      ctx.fillStyle='rgba(255,255,255,.1)';ctx.fillRect(0,40,W,4);
      // Timer bar - color changes as time runs out
      const pct=timeLeft/GAME_TIME;
      const timerCol=pct>0.4?'#27AE60':pct>0.2?'#F39C12':'#E74C3C';
      ctx.fillStyle=timerCol;ctx.fillRect(0,40,W*pct,4);
      // Time text
      ctx.font='bold 13px monospace';ctx.fillStyle=timerCol;
      ctx.textAlign='left';ctx.fillText('⏱ '+Math.ceil(timeLeft)+'s',6,22);
      // Speed indicator
      const speedPct=Math.min(1,(sm-1)/2.5);
      ctx.textAlign='right';
      const spdTxt='⚡'.repeat(Math.min(5,Math.floor(sm)));
      ctx.fillStyle=sm>2?'#E74C3C':sm>1.5?'#F39C12':'#27AE60';
      ctx.fillText(spdTxt,W-6,22);

      animId=requestAnimationFrame(loop);
    };
    loop();
  }
};
window.PongGame=PongGame;
