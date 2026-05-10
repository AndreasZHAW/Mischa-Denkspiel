// PONG - replaces Dart II
const PongGame = {
  start({onComplete}) {
    const el = document.getElementById('game-area');
    if (!el) return;
    const W=380,H=420,PS=80,PW=10;
    el.innerHTML=`<div style="text-align:center">
      <canvas id="pongcv" width="${W}" height="${H}" style="background:#000;border-radius:8px;max-width:100%;touch-action:none"></canvas>
      <div style="display:flex;justify-content:center;gap:8px;margin-top:8px">
        <button id="pong-up" style="background:#2c3e50;color:#fff;border:2px solid #27AE60;padding:14px 28px;border-radius:8px;font-size:1.3rem;cursor:pointer;user-select:none">▲</button>
        <button id="pong-dn" style="background:#2c3e50;color:#fff;border:2px solid #E74C3C;padding:14px 28px;border-radius:8px;font-size:1.3rem;cursor:pointer;user-select:none">▼</button>
      </div>
      <div style="font-size:.75rem;color:rgba(255,255,255,.4);margin-top:6px">Du = Linker Balken · Computer = Rechts</div>
    </div>`;
    const cv=document.getElementById('pongcv'),ctx=cv.getContext('2d');
    let py=H/2-PS/2,ay=H/2-PS/2; // player, ai paddle y
    let bx=W/2,by=H/2,vx=4,vy=3;
    let pscore=0,ascore=0,running=true,tStart=Date.now(),animId;
    let upHeld=false,dnHeld=false;
    document.getElementById('pong-up').addEventListener('pointerdown',()=>upHeld=true);
    document.getElementById('pong-dn').addEventListener('pointerdown',()=>dnHeld=true);
    document.addEventListener('pointerup',()=>{upHeld=false;dnHeld=false;});
    const onKey=e=>{if(e.key==='ArrowUp')upHeld=true;else if(e.key==='ArrowDown')dnHeld=true;};
    const onKeyUp=e=>{if(e.key==='ArrowUp')upHeld=false;else if(e.key==='ArrowDown')dnHeld=false;};
    window.addEventListener('keydown',onKey);window.addEventListener('keyup',onKeyUp);
    const SPEED=7;
    const end=()=>{
      running=false;cancelAnimationFrame(animId);
      window.removeEventListener('keydown',onKey);window.removeEventListener('keyup',onKeyUp);
      const won=pscore>ascore;
      onComplete({rawScore:Math.min(100,pscore*15),timeMs:Date.now()-tStart,errors:ascore,passed:pscore>=3||pscore>ascore});
    };
    const reset=()=>{bx=W/2;by=H/2;vx=(Math.random()>0.5?1:-1)*4;vy=(Math.random()>0.5?1:-1)*3;};
    const loop=()=>{
      if(!running)return;
      // Player paddle
      if(upHeld)py=Math.max(0,py-SPEED);
      if(dnHeld)py=Math.min(H-PS,py+SPEED);
      // AI paddle
      const ai_target=by-PS/2;
      const ai_speed=3.5;
      if(ay<ai_target)ay=Math.min(ay+ai_speed,ai_target);
      else ay=Math.max(ay-ai_speed,ai_target);
      ay=Math.max(0,Math.min(H-PS,ay));
      // Ball
      bx+=vx;by+=vy;
      if(by<=8||by>=H-8){vy*=-1;by=by<=8?8:H-8;}
      // Player paddle collision
      if(bx<=PW+12&&by>=py&&by<=py+PS){vx=Math.abs(vx)*1.05;const rel=(by-(py+PS/2))/(PS/2);vy=rel*5;}
      // AI paddle collision
      if(bx>=W-PW-12&&by>=ay&&by<=ay+PS){vx=-Math.abs(vx)*1.05;const rel=(by-(ay+PS/2))/(PS/2);vy=rel*5;}
      // Speed cap
      vx=Math.max(-9,Math.min(9,vx));vy=Math.max(-8,Math.min(8,vy));
      // Score
      if(bx<0){ascore++;reset();if(ascore>=7)end();}
      if(bx>W){pscore++;reset();if(pscore>=7)end();}
      // Time limit
      if(Date.now()-tStart>120000)end();
      // Draw
      ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
      ctx.setLineDash([8,8]);ctx.strokeStyle='rgba(255,255,255,.2)';ctx.beginPath();ctx.moveTo(W/2,0);ctx.lineTo(W/2,H);ctx.stroke();ctx.setLineDash([]);
      // Paddles
      ctx.fillStyle='#27AE60';ctx.roundRect(4,py,PW,PS,4);ctx.fill();
      ctx.fillStyle='#E74C3C';ctx.roundRect(W-PW-4,ay,PW,PS,4);ctx.fill();
      // Ball
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(bx,by,8,0,Math.PI*2);ctx.fill();
      // Score
      ctx.fillStyle='#fff';ctx.font='bold 28px monospace';ctx.textAlign='center';
      ctx.fillText(pscore+' : '+ascore,W/2,36);
      ctx.font='11px sans-serif';ctx.fillStyle='rgba(255,255,255,.4)';
      ctx.fillText('Du           Computer',W/2,54);
      animId=requestAnimationFrame(loop);
    };
    loop();
  }
};
window.PongGame=PongGame;
