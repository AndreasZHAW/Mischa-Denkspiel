// PONG - slow start, mobile-friendly layout
const PongGame = {
  start({onComplete}) {
    const el = document.getElementById('game-area');
    if (!el) return;
    const W=360, H=300, PS=65, PW=10;
    const isMobile = 'ontouchstart' in window;

    el.innerHTML=`<div style="text-align:center;max-width:${W}px;margin:0 auto">
      <!-- HUD outside canvas -->
      <div style="background:#111;border-radius:8px 8px 0 0;padding:5px 12px;display:flex;justify-content:space-between;align-items:center">
        <div id="pong-score" style="font-family:monospace;font-weight:900;font-size:1.2rem;color:#fff">0 : 0</div>
        <div id="pong-timer" style="font-size:.82rem;color:#27AE60;font-weight:700">⏱ 60s</div>
        <div id="pong-speed" style="font-size:.75rem;color:#FFD700">⚡</div>
      </div>
      <div style="background:#222;height:4px"><div id="pong-tbar" style="background:#27AE60;height:4px;width:100%"></div></div>
      <canvas id="pongcv" width="${W}" height="${H}" style="background:#000;display:block;border-radius:0 0 8px 8px;max-width:100%"></canvas>
      ${isMobile ? `
      <!-- Mobile: dedicated touch zone OUTSIDE canvas -->
      <div id="pong-touch-zone" style="margin-top:8px;background:linear-gradient(135deg,rgba(39,174,96,.15),rgba(39,174,96,.08));border:2px solid rgba(39,174,96,.5);border-radius:12px;padding:6px 12px;touch-action:none;user-select:none;cursor:grab;max-width:${W}px">
        <div style="text-align:center;font-size:.7rem;color:rgba(39,174,96,.8);font-weight:700;margin-bottom:3px">👆 HIER Finger rauf und hoch/runter ziehen</div>
        <div id="pong-touch-indicator" style="height:44px;background:rgba(39,174,96,.1);border-radius:8px;position:relative;display:flex;align-items:center;justify-content:center">
          <div id="pong-touch-dot" style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#27AE60,#1E8449);box-shadow:0 2px 8px rgba(39,174,96,.4);transition:transform .05s"></div>
          <span style="position:absolute;right:8px;font-size:.65rem;color:rgba(255,255,255,.3)">↕ ziehen</span>
        </div>
      </div>` 
      : `<div style="display:flex;justify-content:center;gap:10px;margin-top:8px">
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
    let vx=2.5, vy=1.8; // very slow start

    const elapsed=()=>(Date.now()-tStart)/1000;
    const speedMult=()=>1+Math.min(2,elapsed()/GAME_TIME*2);

    // Controls
    const addBtn=(id)=>{
      const b=document.getElementById(id);if(!b)return;
      if(id.startsWith('pu')){b.addEventListener('pointerdown',e=>{e.preventDefault();upHeld=true;});b.addEventListener('pointerup',()=>upHeld=false);}
      else{b.addEventListener('pointerdown',e=>{e.preventDefault();dnHeld=true;});b.addEventListener('pointerup',()=>dnHeld=false);}
    };
    addBtn('pu');addBtn('pd');
    // Touch drag on canvas = move paddle directly
    if(isMobile){
      const tz=document.getElementById('pong-touch-zone');
      const tdot=document.getElementById('pong-touch-dot');
      const tind=document.getElementById('pong-touch-indicator');
      let lastTY=null,touchActive=false;
      if(tz){
        tz.addEventListener('touchstart',e=>{
          e.preventDefault();lastTY=e.touches[0].clientY;touchActive=true;
          if(tdot)tdot.style.transform='scale(1.2)';
        },{passive:false});
        tz.addEventListener('touchmove',e=>{
          if(!touchActive)return;e.preventDefault();
          const ty=e.touches[0].clientY;
          const dy=ty-lastTY;
          py=Math.max(0,Math.min(H-PS,py+dy*1.4));
          lastTY=ty;
          // Move dot indicator
          if(tdot&&tind){
            const r=tind.getBoundingClientRect();
            const rel=Math.max(0,Math.min(1,(e.touches[0].clientY-r.top)/r.height));
            tdot.style.top=(rel*100)+'%';
          }
        },{passive:false});
        tz.addEventListener('touchend',()=>{touchActive=false;lastTY=null;if(tdot)tdot.style.transform='scale(1)';});
      }
    }
    const onKey=e=>{if(e.key==='ArrowUp')upHeld=true;else if(e.key==='ArrowDown')dnHeld=true;};
    const onKeyUp=e=>{if(e.key==='ArrowUp')upHeld=false;else if(e.key==='ArrowDown')dnHeld=false;};
    window.addEventListener('keydown',onKey);window.addEventListener('keyup',onKeyUp);

    const reset=(server)=>{
      bx=W/2;by=H/2;
      const ang=(Math.random()-0.5)*0.5;
      vx=(server==='p'?1:-1)*2.5;
      vy=1.8*(Math.random()>0.5?1:-1);
    };
    const end=()=>{
      running=false;cancelAnimationFrame(animId);
      window.removeEventListener('keydown',onKey);window.removeEventListener('keyup',onKeyUp);
      onComplete({rawScore:Math.min(100,pscore*14),timeMs:Date.now()-tStart,errors:ascore,passed:pscore>=7||pscore>ascore});
    };
    reset('p');

    const loop=()=>{
      if(!running)return;
      const sm=speedMult();
      const tLeft=Math.max(0,GAME_TIME-elapsed());

      if(upHeld)py=Math.max(0,py-SPD);
      if(dnHeld)py=Math.min(H-PS,py+SPD);

      // AI: slow at start, faster later - always beatable
      const aiSpd=1.5+sm*0.8;
      const target=by-PS/2;
      ay+=(target>ay?1:-1)*Math.min(aiSpd,Math.abs(target-ay));
      ay=Math.max(0,Math.min(H-PS,ay));

      // Ball
      const cvx=vx*sm, cvy=vy*sm;
      bx+=cvx; by+=cvy;
      if(by<=5){vy=Math.abs(vy);by=5;}
      if(by>=H-5){vy=-Math.abs(vy);by=H-5;}
      if(bx<=PW+12&&by>=py&&by<=py+PS){
        vx=Math.abs(vx)*1.02;
        const rel=(by-(py+PS/2))/(PS/2);vy=rel*3+Math.sign(vy);
        bx=PW+13;
      }
      if(bx>=W-PW-12&&by>=ay&&by<=ay+PS){
        vx=-Math.abs(vx)*1.02;
        const rel=(by-(ay+PS/2))/(PS/2);vy=rel*3+Math.sign(vy);
        bx=W-PW-13;
      }
      if(bx<0){ascore++;reset('p');if(ascore>=7)end();}
      if(bx>W){pscore++;reset('a');if(pscore>=7)end();}
      if(tLeft<=0)end();

      // Update HUD
      document.getElementById('pong-score').textContent=pscore+' : '+ascore;
      const tEl=document.getElementById('pong-timer');
      if(tEl){tEl.textContent='⏱ '+Math.ceil(tLeft)+'s';tEl.style.color=tLeft<15?'#E74C3C':tLeft<30?'#F39C12':'#27AE60';}
      const tbar=document.getElementById('pong-tbar');
      if(tbar){tbar.style.width=(tLeft/GAME_TIME*100)+'%';tbar.style.background=tLeft<15?'#E74C3C':tLeft<30?'#F39C12':'#27AE60';}
      const sEl=document.getElementById('pong-speed');
      if(sEl){sEl.textContent='⚡'.repeat(Math.min(5,Math.ceil(sm)));sEl.style.color=sm>1.5?'#E74C3C':sm>1.2?'#F39C12':'#27AE60';}

      // Draw
      ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
      ctx.setLineDash([5,5]);ctx.strokeStyle='rgba(255,255,255,.1)';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(W/2,0);ctx.lineTo(W/2,H);ctx.stroke();ctx.setLineDash([]);
      // Walls
      ctx.fillStyle='rgba(255,255,255,.2)';ctx.fillRect(0,0,W,4);ctx.fillRect(0,H-4,W,4);
      // Paddles
      ctx.fillStyle='#27AE60';if(ctx.roundRect)ctx.beginPath(),ctx.roundRect(4,py,PW,PS,3),ctx.fill();else ctx.fillRect(4,py,PW,PS);
      ctx.fillStyle='#E74C3C';if(ctx.roundRect)ctx.beginPath(),ctx.roundRect(W-PW-4,ay,PW,PS,3),ctx.fill();else ctx.fillRect(W-PW-4,ay,PW,PS);
      // Ball
      for(let i=3;i>=1;i--){ctx.fillStyle='rgba(255,255,255,'+0.06/i+')';ctx.beginPath();ctx.arc(bx-cvx*i*0.4,by-cvy*i*0.4,7-i,0,Math.PI*2);ctx.fill();}
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(bx,by,7,0,Math.PI*2);ctx.fill();

      animId=requestAnimationFrame(loop);
    };
    loop();
    setTimeout(()=>{if(running)end();},120000);
  }
};
window.PongGame=PongGame;
