// PONG - with countdown, 10 levels, speed increasing
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
      <div style="font-size:.72rem;color:rgba(255,255,255,.4);margin-top:4px">Du = Links &nbsp;|&nbsp; Computer = Rechts &nbsp;|&nbsp; First to 7 wins!</div>
    </div>`;
    const cv=document.getElementById('pongcv'), ctx=cv.getContext('2d');
    let py=H/2-PS/2, ay=H/2-PS/2;
    let bx=W/2, by=H/2, vx=5, vy=3;
    let pscore=0, ascore=0, level=1, running=true, tStart=Date.now(), animId;
    let countdown=5, countdownActive=true, countdownTimer=null;
    let upHeld=false, dnHeld=false;
    const SPD=8;

    document.getElementById('pu').addEventListener('pointerdown',e=>{e.preventDefault();upHeld=true;});
    document.getElementById('pd').addEventListener('pointerdown',e=>{e.preventDefault();dnHeld=true;});
    document.addEventListener('pointerup',()=>{upHeld=false;dnHeld=false;});
    const onKey=e=>{if(e.key==='ArrowUp')upHeld=true;else if(e.key==='ArrowDown')dnHeld=true;};
    const onKeyUp=e=>{if(e.key==='ArrowUp')upHeld=false;else if(e.key==='ArrowDown')dnHeld=false;};
    window.addEventListener('keydown',onKey);window.addEventListener('keyup',onKeyUp);

    const baseSpeed = () => 4 + level*0.6;
    const reset = (serverPlayer) => {
      bx=W/2;by=H/2;
      const ang=(Math.random()-0.5)*0.8;
      const sp=baseSpeed();
      vx=(serverPlayer==='p'?1:-1)*sp*Math.cos(ang);
      vy=sp*Math.sin(ang);
      // Countdown
      countdown=5; countdownActive=true;
      let ci=5;
      countdownTimer=setInterval(()=>{
        ci--;countdown=ci;
        if(ci<=0){clearInterval(countdownTimer);countdownActive=false;}
      },1000);
    };
    const end=()=>{
      running=false;cancelAnimationFrame(animId);clearInterval(countdownTimer);
      window.removeEventListener('keydown',onKey);window.removeEventListener('keyup',onKeyUp);
      const won=pscore>ascore;
      onComplete({rawScore:Math.min(100,pscore*14),timeMs:Date.now()-tStart,errors:ascore,passed:pscore>=7||pscore>ascore});
    };
    reset('p');
    const loop=()=>{
      if(!running)return;
      // Player
      if(upHeld)py=Math.max(0,py-SPD);
      if(dnHeld)py=Math.min(H-PS,py+SPD);
      // AI (gets harder per level)
      const ai_spd=3+level*0.35;
      const target=by-PS/2;
      ay+=(target>ay?1:-1)*Math.min(ai_spd,Math.abs(target-ay));
      ay=Math.max(0,Math.min(H-PS,ay));
      // Ball
      if(!countdownActive){
        bx+=vx; by+=vy;
        if(by<=8||by>=H-8){vy*=-1;by=by<=8?8:H-8;}
        // Player paddle
        if(bx<=PW+14&&bx>=0&&by>=py&&by<=py+PS){
          vx=Math.abs(vx)*1.04;const rel=(by-(py+PS/2))/(PS/2);vy=rel*6;
          bx=PW+15;
        }
        // AI paddle
        if(bx>=W-PW-14&&bx<=W&&by>=ay&&by<=ay+PS){
          vx=-Math.abs(vx)*1.04;const rel=(by-(ay+PS/2))/(PS/2);vy=rel*6;
          bx=W-PW-15;
        }
        // Speed cap
        const spd=Math.sqrt(vx*vx+vy*vy);
        const maxSpd=4+level*0.8+12;
        if(spd>maxSpd){vx=vx/spd*maxSpd;vy=vy/spd*maxSpd;}
        // Score
        if(bx<0){ascore++;if(ascore>=7){end();return;}level=Math.min(10,ascore+pscore+1);reset('p');}
        if(bx>W){pscore++;if(pscore>=7){end();return;}level=Math.min(10,ascore+pscore+1);reset('a');}
      }
      // Draw
      ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
      // Center line
      ctx.setLineDash([6,6]);ctx.strokeStyle='rgba(255,255,255,.15)';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(W/2,0);ctx.lineTo(W/2,H);ctx.stroke();ctx.setLineDash([]);
      // Paddles
      ctx.fillStyle='#27AE60';ctx.beginPath();ctx.roundRect(4,py,PW,PS,4);ctx.fill();
      ctx.fillStyle='#E74C3C';ctx.beginPath();ctx.roundRect(W-PW-4,ay,PW,PS,4);ctx.fill();
      // Ball
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(bx,by,8,0,Math.PI*2);ctx.fill();
      // Ball trail
      ctx.fillStyle='rgba(255,255,255,.15)';
      for(let i=1;i<=3;i++){ctx.beginPath();ctx.arc(bx-vx*i,by-vy*i,7-i,0,Math.PI*2);ctx.fill();}
      // Score
      ctx.fillStyle='#fff';ctx.font='bold 32px monospace';ctx.textAlign='center';
      ctx.fillText(pscore+' : '+ascore,W/2,42);
      // Level
      ctx.font='11px sans-serif';ctx.fillStyle='#FFD700';
      ctx.fillText('Level '+level,W/2,58);
      // Countdown overlay
      if(countdownActive&&countdown>0){
        ctx.fillStyle='rgba(0,0,0,.7)';ctx.fillRect(0,H/2-50,W,100);
        ctx.fillStyle='#FFD700';ctx.font='bold 60px monospace';ctx.textAlign='center';
        ctx.fillText(countdown,W/2,H/2+20);
        ctx.font='14px sans-serif';ctx.fillStyle='rgba(255,255,255,.6)';
        ctx.fillText('Level '+level+' — Ball kommt!',W/2,H/2+50);
      }
      animId=requestAnimationFrame(loop);
    };
    loop();
    setTimeout(()=>{if(running)end();},120000);
  }
};
window.PongGame=PongGame;
