// SNAKE — Klassisch mit Cartoon-Grafik (ersetzt Ballon-Spiel)
// Dateiname balloon.js beibehalten für Kompatibilität
const BalloonGame = {
  start({onComplete}) {
    const el = document.getElementById('game-area');
    if (!el) return;
    const isMob = 'ontouchstart' in window;
    const GRID = 20, CELL = Math.min(22, Math.floor((Math.min(window.innerWidth-8,440)-10) / GRID));
    const CW = GRID*CELL, CH = GRID*CELL;
    const DPR = Math.min(window.devicePixelRatio||1,2);

    el.innerHTML=`<div style="font-family:sans-serif;user-select:none;-webkit-user-select:none;text-align:center">
      <div style="display:flex;justify-content:center;align-items:center;gap:12px;margin-bottom:8px;flex-wrap:wrap">
        <span id="sn-score" style="color:#FFD700;font-weight:900;font-size:clamp(1rem,4vw,1.2rem)">🐍 0</span>
        <span id="sn-level" style="color:#4af;font-size:.85rem">Level 1</span>
        <span id="sn-time"  style="color:rgba(255,255,255,.5);font-size:.8rem">⏱ 0s</span>
      </div>
      <canvas id="sncv" width="${CW*DPR}" height="${CH*DPR}"
        style="display:block;margin:0 auto;border-radius:12px;width:${CW}px;height:${CH}px;
               box-shadow:0 6px 28px rgba(0,0,0,.7),0 0 0 2px rgba(255,255,255,.06);touch-action:none"></canvas>
      ${isMob?`
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;max-width:200px;margin:10px auto 0">
        <div></div>
        <button id="sn-up"   style="${B('#4834d4')}">↑</button>
        <div></div>
        <button id="sn-left" style="${B('#4834d4')}">←</button>
        <button id="sn-down" style="${B('#4834d4')}">↓</button>
        <button id="sn-right"style="${B('#4834d4')}">→</button>
      </div>`:''}
      <div style="font-size:.72rem;color:rgba(255,255,255,.18);margin-top:5px">Pfeiltasten / Wischen</div>
    </div>`;
    function B(c){return `background:${c};color:#fff;border:none;padding:${isMob?'14px 12px':'10px 8px'};border-radius:10px;font-size:${isMob?'1.2rem':'1rem'};font-weight:900;cursor:pointer;touch-action:none;min-height:${isMob?'50px':'40px'};box-shadow:0 3px 0 rgba(0,0,0,.4)`;}

    const cv=document.getElementById('sncv'),ctx=cv.getContext('2d');
    ctx.scale(DPR,DPR);

    let snake=[{x:10,y:10},{x:9,y:10},{x:8,y:10}];
    let dir={x:1,y:0},nextDir={x:1,y:0};
    let food=null,score=0,level=1,running=true,tStart=Date.now(),frames=0;
    let gameOver=false,goFlash=0;

    const randFood=()=>{
      let f;
      do{f={x:Math.floor(Math.random()*GRID),y:Math.floor(Math.random()*GRID)};}
      while(snake.some(s=>s.x===f.x&&s.y===f.y));
      return f;
    };
    food=randFood();

    const speed=()=>Math.max(60,180-level*18); // ms per step

    // Draw helpers
    const drawCell=(x,y,col,r=4)=>{
      const px=x*CELL,py=y*CELL,p=2;
      ctx.fillStyle=col;
      if(ctx.roundRect){ctx.beginPath();ctx.roundRect(px+p,py+p,CELL-p*2,CELL-p*2,r);ctx.fill();}
      else ctx.fillRect(px+p,py+p,CELL-p*2,CELL-p*2);
    };
    const drawHead=(x,y,dx,dy,col)=>{
      const px=x*CELL,py=y*CELL,p=1,r=CELL*.45;
      // Body
      const g=ctx.createRadialGradient(px+CELL/2-2,py+CELL/2-2,1,px+CELL/2,py+CELL/2,r);
      g.addColorStop(0,'#88d4f8');g.addColorStop(.6,col);g.addColorStop(1,'#1a5a8a');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(px+CELL/2,py+CELL/2,r-p,0,Math.PI*2);ctx.fill();
      // Eyes
      const eo=CELL*.22,er=CELL*.12;
      const ex1=px+CELL/2+(dy===0?0:-eo*dy)+(dx===0?0:eo*dx*.3);
      const ey1=py+CELL/2+(dx===0?0:-eo*dx)+(dy===0?0:eo*dy*.3);
      const ex2=px+CELL/2+(dy===0?0:eo*dy)+(dx===0?0:eo*dx*.3);
      const ey2=py+CELL/2+(dx===0?0:eo*dx)+(dy===0?0:eo*dy*.3);
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(ex1,ey1,er,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(ex2,ey2,er,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#1a1a3a';ctx.beginPath();ctx.arc(ex1+dx*er*.3,ey1+dy*er*.3,er*.55,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#1a1a3a';ctx.beginPath();ctx.arc(ex2+dx*er*.3,ey2+dy*er*.3,er*.55,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.7)';ctx.beginPath();ctx.arc(ex1+dx*er*.1-er*.2,ey1+dy*er*.1-er*.2,er*.25,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.7)';ctx.beginPath();ctx.arc(ex2+dx*er*.1-er*.2,ey2+dy*er*.1-er*.2,er*.25,0,Math.PI*2);ctx.fill();
    };
    const drawFood=(x,y)=>{
      const px=x*CELL+CELL/2,py=y*CELL+CELL/2,r=CELL*.36;
      const pulse=1+Math.sin(frames*.15)*.08;
      // Glow
      ctx.fillStyle='rgba(231,76,60,.2)';ctx.beginPath();ctx.arc(px,py,r*1.7*pulse,0,Math.PI*2);ctx.fill();
      // Apple
      const fg=ctx.createRadialGradient(px-r*.3,py-r*.3,0,px,py,r);
      fg.addColorStop(0,'#ff6b6b');fg.addColorStop(.6,'#e74c3c');fg.addColorStop(1,'#9b1a0a');
      ctx.fillStyle=fg;ctx.beginPath();ctx.arc(px,py,r*pulse,0,Math.PI*2);ctx.fill();
      // Shine
      ctx.fillStyle='rgba(255,255,255,.5)';ctx.beginPath();ctx.arc(px-r*.25,py-r*.25,r*.3,0,Math.PI*2);ctx.fill();
      // Stem
      ctx.strokeStyle='#2e7d32';ctx.lineWidth=2;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(px,py-r);ctx.quadraticCurveTo(px+r*.5,py-r*1.6,px+r*.3,py-r*1.3);ctx.stroke();
    };

    const render=()=>{
      frames++;
      // Background
      ctx.fillStyle='#0d1a0d';ctx.fillRect(0,0,CW,CH);
      // Grid
      ctx.strokeStyle='rgba(255,255,255,.04)';ctx.lineWidth=1;
      for(let i=0;i<=GRID;i++){ctx.beginPath();ctx.moveTo(i*CELL,0);ctx.lineTo(i*CELL,CH);ctx.stroke();}
      for(let i=0;i<=GRID;i++){ctx.beginPath();ctx.moveTo(0,i*CELL);ctx.lineTo(CW,i*CELL);ctx.stroke();}
      // Snake body
      const bodyCol='#27AE60';
      for(let i=1;i<snake.length;i++){
        const s=snake[i],n=snake[i-1];
        const ratio=1-(i/snake.length)*.4;
        const c=`rgba(${Math.round(39*ratio)},${Math.round(174*ratio)},${Math.round(96*ratio)},1)`;
        drawCell(s.x,s.y,c,3);
        // Connect segments
        if(Math.abs(s.x-n.x)<=1&&Math.abs(s.y-n.y)<=1){
          ctx.fillStyle=c;
          const mx=Math.min(s.x,n.x)*CELL+(Math.abs(s.x-n.x)===0?2:0);
          const my=Math.min(s.y,n.y)*CELL+(Math.abs(s.y-n.y)===0?2:0);
          const mw=(Math.abs(s.x-n.x)===0?CELL-4:CELL+2);
          const mh=(Math.abs(s.y-n.y)===0?CELL-4:CELL+2);
          ctx.fillRect(mx,my,mw,mh);
        }
      }
      // Head
      drawHead(snake[0].x,snake[0].y,dir.x,dir.y,'#5dade2');
      // Food
      if(food)drawFood(food.x,food.y);

      // HUD
      const elapsed=((Date.now()-tStart)/1000)|0;
      document.getElementById('sn-score').textContent='🐍 '+score;
      document.getElementById('sn-level').textContent='Level '+level;
      document.getElementById('sn-time').textContent='⏱ '+elapsed+'s';

      if(gameOver){
        goFlash++;
        ctx.fillStyle=`rgba(0,0,0,${Math.min(.75,goFlash/40)})`;ctx.fillRect(0,0,CW,CH);
        ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.font='bold '+CELL*1.4+'px sans-serif';ctx.fillText('💀',CW/2,CH/2-CELL*2);
        ctx.font='bold '+CELL*.8+'px sans-serif';ctx.fillStyle='#E74C3C';
        ctx.fillText('Game Over!',CW/2,CH/2);
        ctx.font=CELL*.6+'px sans-serif';ctx.fillStyle='#FFD700';
        ctx.fillText('Score: '+score,CW/2,CH/2+CELL*1.3);
        if(goFlash===60){
          onComplete({rawScore:Math.min(100,score*3+level*5),timeMs:Date.now()-tStart,errors:0,passed:score>=5});
        }
      }
    };

    let lastStep=Date.now();
    const loop=()=>{
      if(!running)return;
      requestAnimationFrame(loop);
      render();
      const now=Date.now();
      if(now-lastStep<speed())return;
      lastStep=now;
      if(gameOver)return;
      dir={...nextDir};
      const head={x:(snake[0].x+dir.x+GRID)%GRID,y:(snake[0].y+dir.y+GRID)%GRID};
      // Self collision
      if(snake.some(s=>s.x===head.x&&s.y===head.y)){gameOver=true;return;}
      snake.unshift(head);
      if(head.x===food?.x&&head.y===food?.y){
        score++;
        food=randFood();
        if(score%5===0){level++;} // level up every 5 apples
        try{const ac=new(window.AudioContext||window.webkitAudioContext)();const g=ac.createGain();g.gain.setValueAtTime(0.12,ac.currentTime);g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+.15);g.connect(ac.destination);const o=ac.createOscillator();o.type='square';o.frequency.setValueAtTime(440+score*20,ac.currentTime);o.connect(g);o.start();o.stop(ac.currentTime+.15);}catch(e){}
      }else snake.pop();
    };

    // Controls
    const setDir=(nx,ny)=>{if(nx===0&&ny===0)return;if(nx===-dir.x&&ny===-dir.y)return;nextDir={x:nx,y:ny};};
    const km={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],KeyW:[0,-1],KeyS:[0,1],KeyA:[-1,0],KeyD:[1,0]};
    const onK=e=>{if(km[e.code]){e.preventDefault();setDir(...km[e.code]);}};
    window.addEventListener('keydown',onK);

    // Mobile buttons
    if(isMob){
      [['sn-up',0,-1],['sn-down',0,1],['sn-left',-1,0],['sn-right',1,0]].forEach(([id,nx,ny])=>{
        const b=document.getElementById(id);if(!b)return;
        b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);setDir(nx,ny);});
      });
    }
    // Swipe
    let ts=null;
    el.addEventListener('touchstart',e=>{const t=e.touches[0];ts={x:t.clientX,y:t.clientY};},{passive:true});
    el.addEventListener('touchend',e=>{
      if(!ts)return;const t=e.changedTouches[0];
      const dx=t.clientX-ts.x,dy=t.clientY-ts.y;ts=null;
      if(Math.abs(dx)<10&&Math.abs(dy)<10)return;
      if(Math.abs(dx)>Math.abs(dy))setDir(dx>0?1:-1,0);else setDir(0,dy>0?1:-1);
    },{passive:true});

    loop();
    setTimeout(()=>{if(running&&!gameOver)onComplete({rawScore:Math.min(100,score*3+level*5),timeMs:Date.now()-tStart,errors:0,passed:score>=3});},120000);
  }
};
window.BalloonGame=BalloonGame;
