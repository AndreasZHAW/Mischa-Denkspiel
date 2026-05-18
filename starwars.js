// STAR WARS — Modern Vector Style with Glow Effects
const StarWarsGame = {
  start({onComplete}) {
    const el = document.getElementById('game-area');
    if (!el) { if(typeof GameLog!=='undefined')GameLog.error('starwars','no game-area'); return; }
    const DPR = Math.min(window.devicePixelRatio||1, 2);
    const maxW = Math.min((el.offsetWidth||380)-8, 420);
    const W = maxW, H = Math.round(W*1.22);

    // Game-level crash logging
    const _swLog=(msg,lvl='I')=>{
      try{
        const raw=localStorage.getItem('_mischa_crash_log')||'[]';
        const arr=JSON.parse(raw);
        arr.push({ts:Date.now(),level:lvl,src:'starwars',msg:String(msg).slice(0,200)});
        if(arr.length>500)arr.splice(0,arr.length-400);
        localStorage.setItem('_mischa_crash_log',JSON.stringify(arr));
      }catch(e){}
    };
    const _swOnErr=(msg,src,line)=>{_swLog('ERROR: '+msg+' (L'+line+')', 'E');};
    const _prevOnerr=window.onerror;
    window.onerror=function(m,s,l,c,e){_swOnErr(m,s,l);if(_prevOnerr)return _prevOnerr(m,s,l,c,e);};

    el.innerHTML=`<div style="text-align:center;touch-action:none;user-select:none;-webkit-user-select:none;font-family:sans-serif">
      <canvas id="swcv" width="${W*DPR}" height="${H*DPR}"
        style="background:#000;border-radius:10px;width:${W}px;height:${H}px;display:block;margin:0 auto;
               box-shadow:0 0 40px rgba(0,120,255,.25),0 8px 32px rgba(0,0,0,.8);touch-action:none"></canvas>
      <div style="display:flex;justify-content:center;align-items:center;gap:8px;margin-top:10px">
        <button id="sw-left"  style="${BTN('#1a4a8a','#4a90d9')}">◀</button>
        <button id="sw-fire"  style="${BTN('#8a0000','#e74c3c')}">🔴 FIRE</button>
        <button id="sw-right" style="${BTN('#1a4a8a','#4a90d9')}">▶</button>
      </div>
      <div style="font-size:clamp(.7rem,2.8vw,.82rem);color:rgba(255,255,255,.3);margin-top:4px">
        ◀▶ Bewegen · Leertaste · Gyro (Handy kippen)
      </div>
    </div>`;

    function BTN(bg,b){return `background:${bg};border:2px solid ${b};color:#fff;padding:clamp(10px,3vw,14px) clamp(16px,5vw,28px);border-radius:10px;font-size:clamp(.9rem,3.5vw,1.05rem);font-weight:900;cursor:pointer;touch-action:none;box-shadow:0 0 12px ${b}55,0 4px 0 rgba(0,0,0,.5)`;}

    const cv=document.getElementById('swcv'), ctx=cv.getContext('2d');
    ctx.scale(DPR,DPR);

    let ship={x:W/2,y:H-70,w:28,h:22};
    let bullets=[], enemies=[], explosions=[], powerups=[], stars=[];
    let score=0, lives=3, wave=1, running=true, tStart=Date.now(), animId, tick=0;
    let fireMode='single', fireModeTimer=0;

    // Starfield
    for(let i=0;i<120;i++) stars.push({x:Math.random()*W,y:Math.random()*H,
      s:Math.random()*1.8+.3,spd:.3+Math.random()*.8,bright:Math.random()});

    const spawnWave=()=>{
      const rows=Math.min(4,1+Math.floor(wave/2));
      const cols=Math.min(8,4+wave);
      const sp=Math.min(46,Math.floor((W-40)/cols));
      const speed=0.7+wave*0.22; // gentle scaling
      for(let r=0;r<rows;r++) for(let c=0;c<cols;c++)
        enemies.push({x:20+c*sp,y:20+r*36,w:22,h:18,hp:1+(r>=2?1:0),
          dx:speed,dy:0,type:r%4,phase:Math.random()*Math.PI*2});
      if(wave>=2) powerups.push({x:60+Math.random()*(W-120),y:-20,dy:1.4,
        type:wave>=4?'triple':wave>=3?'rapid':'shield'});
    };
    spawnWave();

    let leftH=false, rightH=false, efTick=0;

    const fire=()=>{
      if(fireMode==='triple'){
        bullets.push({x:ship.x,y:ship.y-10,dy:-11,dx:0});
        bullets.push({x:ship.x-10,y:ship.y-2,dy:-10,dx:-1.8});
        bullets.push({x:ship.x+10,y:ship.y-2,dy:-10,dx:1.8});
      } else {
        bullets.push({x:ship.x,y:ship.y-10,dy:-11,dx:0});
      }
    };

    // Buttons
    document.getElementById('sw-left').addEventListener('pointerdown',e=>{e.preventDefault();leftH=true;});
    document.getElementById('sw-right').addEventListener('pointerdown',e=>{e.preventDefault();rightH=true;});
    document.addEventListener('pointerup',ptrUpHandler);
    let rfInt=null;
    const fb=document.getElementById('sw-fire');
    fb.addEventListener('pointerdown',e=>{e.preventDefault();fire();rfInt=setInterval(fire,fireMode==='rapid'?75:175);});
    ['pointerup','pointercancel'].forEach(ev=>fb.addEventListener(ev,()=>clearInterval(rfInt)));

    const onKey=e=>{
      if(e.key==='ArrowLeft')leftH=true;else if(e.key==='ArrowRight')rightH=true;
      else if(e.code==='Space'){e.preventDefault();fire();}
    };
    const onKU=e=>{if(e.key==='ArrowLeft')leftH=false;else if(e.key==='ArrowRight')rightH=false;};
    window.addEventListener('keydown',onKey);window.addEventListener('keyup',onKU);

    // Gyro
    const gyro=e=>{if(!running)return;const t=e.gamma||0;leftH=t<-8;rightH=t>8;};
    if(window.DeviceOrientationEvent){
      if(typeof DeviceOrientationEvent.requestPermission==='function')
        fb.addEventListener('click',()=>DeviceOrientationEvent.requestPermission().then(p=>{if(p==='granted')window.addEventListener('deviceorientation',gyro);}).catch(()=>{}),{once:true});
      else window.addEventListener('deviceorientation',gyro);
    }

    const ptrUpHandler=()=>{leftH=false;rightH=false;};
    const end=(won)=>{
      running=false;cancelAnimationFrame(animId);
      window.removeEventListener('keydown',onKey);window.removeEventListener('keyup',onKU);
      document.removeEventListener('pointerup',ptrUpHandler);
      if(rfInt)clearInterval(rfInt);
      window.onerror=_prevOnerr; // restore
      _swLog('Game ended: wave='+wave+' score='+score+' won='+won);
      onComplete({rawScore:Math.min(100,wave*14+Math.round(score/12)),timeMs:Date.now()-tStart,errors:0,passed:wave>=2||won});
    };

    // ── DRAWING HELPERS ──
    const glow=(x,y,r,col,alpha=1)=>{
      const g=ctx.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0,col.replace(')',`,${alpha})`).replace('rgb','rgba'));
      g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
    };

    const drawShip=(x,y)=>{
      // Engine glow
      glow(x,y+16,20,'rgb(0,150,255)',0.6+.3*Math.sin(tick*.25));
      // Flame
      ctx.fillStyle=`hsl(${180+tick%20*3},100%,${60+10*Math.sin(tick*.3)}%)`;
      ctx.beginPath();ctx.moveTo(x-7,y+12);ctx.lineTo(x+7,y+12);ctx.lineTo(x,y+22+Math.sin(tick*.4)*5);ctx.closePath();ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.6)';ctx.beginPath();ctx.moveTo(x-3,y+12);ctx.lineTo(x+3,y+12);ctx.lineTo(x,y+18);ctx.closePath();ctx.fill();
      // Body hull
      const hg=ctx.createLinearGradient(x-20,y-18,x+20,y+12);
      hg.addColorStop(0,'#c8deff');hg.addColorStop(.4,'#8ab0e8');hg.addColorStop(1,'#3a5a90');
      ctx.fillStyle=hg;
      ctx.beginPath();ctx.moveTo(x,y-18);
      ctx.bezierCurveTo(x+10,y-8,x+18,y,x+14,y+10);ctx.lineTo(x-14,y+10);
      ctx.bezierCurveTo(x-18,y,x-10,y-8,x,y-18);ctx.closePath();ctx.fill();
      // Wings
      ctx.fillStyle='#4a70b0';
      ctx.beginPath();ctx.moveTo(x+14,y+8);ctx.lineTo(x+28,y+18);ctx.lineTo(x+18,y+20);ctx.lineTo(x+10,y+10);ctx.closePath();ctx.fill();
      ctx.beginPath();ctx.moveTo(x-14,y+8);ctx.lineTo(x-28,y+18);ctx.lineTo(x-18,y+20);ctx.lineTo(x-10,y+10);ctx.closePath();ctx.fill();
      // Cockpit
      const cg=ctx.createRadialGradient(x-2,y-9,0,x,y-7,9);
      cg.addColorStop(0,'rgba(180,230,255,.95)');cg.addColorStop(1,'rgba(60,130,220,.5)');
      ctx.fillStyle=cg;ctx.beginPath();ctx.ellipse(x,y-7,8,7,0,0,Math.PI*2);ctx.fill();
      // Engine pods
      ctx.fillStyle='#2a4070';
      ctx.beginPath();ctx.ellipse(x-18,y+18,6,4,0,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.ellipse(x+18,y+18,6,4,0,0,Math.PI*2);ctx.fill();
      glow(x-18,y+18,8,'rgb(0,200,255)',.7);glow(x+18,y+18,8,'rgb(0,200,255)',.7);
      // Shield ring
      ctx.strokeStyle=`rgba(0,180,255,${.15+.1*Math.sin(tick*.1)})`;ctx.lineWidth=1.5;
      ctx.beginPath();ctx.ellipse(x,y,26,20,0,0,Math.PI*2);ctx.stroke();
    };

    const ENEMY_COLS=[
      ['#ff4444','#aa0000'],['#ff8c00','#aa5500'],['#cc44ff','#660099'],['#ff44aa','#990055'],
    ];
    const drawEnemy=(e)=>{
      const [col,dark]=ENEMY_COLS[e.type%ENEMY_COLS.length];
      const pulse=.7+.3*Math.sin(tick*.15+e.phase);
      glow(e.x,e.y,16,`rgb(${parseInt(col.slice(1,3),16)},${parseInt(col.slice(3,5),16)},${parseInt(col.slice(5,7),16)})`,pulse*.5);
      // Body
      ctx.fillStyle=col;
      ctx.beginPath();ctx.moveTo(e.x,e.y+10);ctx.lineTo(e.x+12,e.y-8);ctx.lineTo(e.x,e.y-3);ctx.lineTo(e.x-12,e.y-8);ctx.closePath();ctx.fill();
      // Wings
      ctx.fillStyle=dark;
      ctx.beginPath();ctx.moveTo(e.x-12,e.y-8);ctx.lineTo(e.x-20,e.y+6);ctx.lineTo(e.x-7,e.y+3);ctx.closePath();ctx.fill();
      ctx.beginPath();ctx.moveTo(e.x+12,e.y-8);ctx.lineTo(e.x+20,e.y+6);ctx.lineTo(e.x+7,e.y+3);ctx.closePath();ctx.fill();
      // Cockpit
      ctx.fillStyle='rgba(200,240,255,.85)';ctx.beginPath();ctx.ellipse(e.x,e.y-1,4,3.5,0,0,Math.PI*2);ctx.fill();
      // Engine
      ctx.fillStyle=`rgba(255,200,0,${pulse})`;ctx.beginPath();ctx.arc(e.x,e.y+12,3,0,Math.PI*2);ctx.fill();
    };

    const loop=()=>{
      if(!running)return;
      animId=requestAnimationFrame(loop);
      tick++;
      // Safety: check for runaway state
      if(tick>1&&tick%3000===0){
        console.log('[SW] frame='+tick+' enemies='+enemies.length+' bullets='+bullets.length+' score='+score+' wave='+wave+' lives='+lives);
      }

      // Move ship
      if(leftH) ship.x=Math.max(20,ship.x-5);
      if(rightH) ship.x=Math.min(W-20,ship.x+5);

      // Fire mode timer
      fireModeTimer=Math.max(0,fireModeTimer-1);
      if(fireModeTimer<=0&&fireMode!=='single') fireMode='single';

      // Stars
      stars.forEach(s=>{s.y+=s.spd;if(s.y>H){s.y=0;s.x=Math.random()*W;}});

      // Bullets
      bullets=bullets.filter(b=>{b.x+=b.dx||0;b.y+=b.dy;return b.y>-20&&b.y<H+20&&b.x>-20&&b.x<W+20;});

      // Powerups
      powerups=powerups.filter(p=>{
        p.y+=p.dy;
        if(p.y>H) return false;
        if(Math.abs(p.x-ship.x)<22&&Math.abs(p.y-ship.y)<22){
          if(p.type==='rapid'){fireMode='rapid';fireModeTimer=360;}
          else if(p.type==='triple'){fireMode='triple';fireModeTimer=480;}
          else{lives=Math.min(5,lives+1);}
          explosions.push({x:p.x,y:p.y,t:25,r:30,col:'#00ff88'});
          return false;
        }
        return true;
      });

      // Enemies
      let edgeHit=false;
      enemies.forEach(e=>{e.x+=e.dx;if(e.x<18||e.x>W-18)edgeHit=true;});
      if(edgeHit){enemies.forEach(e=>{e.dx*=-1;e.y+=10;});}

      // Enemy fire
      efTick++;
      if(efTick>Math.max(40,90-wave*5)&&enemies.length){
        efTick=0;
        const en=enemies[Math.floor(Math.random()*enemies.length)];
        bullets.push({x:en.x,y:en.y+10,dy:3+wave*.3,dx:0,enemy:true});
      }

      // Collisions
      bullets=bullets.filter(b=>{
        if(!b.enemy){
          let hit=false;
          enemies=enemies.filter(e=>{
            if(!hit&&Math.abs(b.x-e.x)<16&&Math.abs(b.y-e.y)<16){
              e.hp--;hit=true;
              if(e.hp<=0){score+=10*(e.type+1)+(wave-1)*5;explosions.push({x:e.x,y:e.y,t:18,r:20,col:'#ff8800'});return false;}
            }return true;
          });
          return !hit;
        } else {
          if(Math.abs(b.x-ship.x)<18&&Math.abs(b.y-ship.y)<18){
            lives--;explosions.push({x:ship.x,y:ship.y,t:25,r:28,col:'#4488ff'});
            if(lives<=0)end(false);return false;
          }return true;
        }
      });

      explosions=explosions.map(e=>({...e,t:e.t-1,r:e.r+1.5})).filter(e=>e.t>0);
      if(enemies.some(e=>e.y>H-60)){end(false);return;}
      if(!enemies.length){wave++;if(wave>5){end(true);return;}spawnWave();}
      if(Date.now()-tStart>480000)end(score>100); // 8 min max

      // ── DRAW ──
      // Deep space
      ctx.fillStyle='#000008';ctx.fillRect(0,0,W,H);
      // Nebula
      const neb=ctx.createRadialGradient(W*.3,H*.5,0,W*.3,H*.5,W*.6);
      neb.addColorStop(0,'rgba(20,0,60,.12)');neb.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=neb;ctx.fillRect(0,0,W,H);

      // Stars
      stars.forEach(s=>{
        const a=s.bright*.8+.2;
        ctx.fillStyle=`rgba(255,255,255,${a})`;
        ctx.beginPath();ctx.arc(s.x,s.y,s.s*.5,0,Math.PI*2);ctx.fill();
        if(s.s>1.2){ctx.fillStyle=`rgba(200,220,255,${a*.4})`;ctx.beginPath();ctx.arc(s.x,s.y,s.s*1.5,0,Math.PI*2);ctx.fill();}
      });

      // Powerups
      const PICONS={shield:'🛡',rapid:'⚡',triple:'🔱'};
      const PCOLS={shield:'#00ff88',rapid:'#ff69b4',triple:'#ffd700'};
      powerups.forEach(p=>{
        glow(p.x,p.y,20,`rgb(0,255,150)`,.6+.3*Math.sin(tick*.15));
        ctx.fillStyle=PCOLS[p.type]||'#fff';ctx.beginPath();ctx.arc(p.x,p.y,12,0,Math.PI*2);ctx.fill();
        ctx.font='13px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText(PICONS[p.type]||'?',p.x,p.y);ctx.textBaseline='alphabetic';
      });

      // Enemies
      enemies.forEach(drawEnemy);

      // Player ship
      drawShip(ship.x,ship.y);

      // Bullets
      bullets.forEach(b=>{
        if(!b.enemy){
          glow(b.x,b.y,8,'rgb(0,220,255)',.8);
          const bg=ctx.createLinearGradient(b.x,b.y+8,b.x,b.y-10);
          bg.addColorStop(0,'rgba(0,240,255,0)');bg.addColorStop(.5,'#0ff');bg.addColorStop(1,'rgba(0,240,255,0)');
          ctx.fillStyle=bg;ctx.fillRect(b.x-2.5,b.y-10,5,18);
        } else {
          glow(b.x,b.y,6,'rgb(255,60,0)',.6);
          ctx.fillStyle='#ff4400';ctx.fillRect(b.x-2,b.y-7,4,14);
        }
      });

      // Explosions
      explosions.forEach(e=>{
        try{
          if(!e.col||isNaN(e.x)||isNaN(e.y)||e.r<=0)return;
          const prog=Math.max(0,Math.min(1,1-e.t/25));
          const eg=ctx.createRadialGradient(e.x,e.y,0,e.x,e.y,Math.max(1,e.r));
          eg.addColorStop(0,`rgba(255,255,200,${(1-prog)*.9})`);
          const hexCol=e.col.startsWith('#')?e.col:'#ff8800';
          eg.addColorStop(.4,hexCol.replace('#','rgba(').replace(/(..)(..)(..)$/,(_,r2,g2,b2)=>`${parseInt(r2,16)||0},${parseInt(g2,16)||0},${parseInt(b2,16)||0},${(1-prog)*.6})`));
          eg.addColorStop(1,'rgba(0,0,0,0)');
          ctx.fillStyle=eg;ctx.beginPath();ctx.arc(e.x,e.y,Math.max(1,e.r),0,Math.PI*2);ctx.fill();
          for(let s=0;s<6;s++){
            const a=s/6*Math.PI*2+prog*5;
            const sr=e.r*.7;
            ctx.fillStyle=`rgba(255,200,0,${(1-prog)*.7})`;
            ctx.beginPath();ctx.arc(e.x+Math.cos(a)*sr,e.y+Math.sin(a)*sr,1.5,0,Math.PI*2);ctx.fill();
          }
        }catch(ex){console.warn('explosion draw error:',ex.message);}
      });

      // Fire mode indicator
      if(fireMode!=='single'){
        ctx.fillStyle=fireMode==='triple'?'rgba(255,215,0,.18)':'rgba(255,105,180,.18)';ctx.fillRect(0,H-22,W,22);
        ctx.fillStyle=fireMode==='triple'?'#FFD700':'#ff69b4';ctx.font='bold 11px monospace';ctx.textAlign='center';
        ctx.fillText((fireMode==='triple'?'🔱 TRIPLE':'⚡ RAPID')+' — '+Math.ceil(fireModeTimer/60)+'s',W/2,H-6);
      }

      // HUD
      ctx.fillStyle='rgba(0,0,20,.7)';ctx.fillRect(0,0,W,28);
      ctx.fillStyle='rgba(0,120,255,.3)';ctx.fillRect(0,26,W,2);
      ctx.fillStyle='#fff';ctx.font=`bold ${Math.max(11,W*.032)}px monospace`;ctx.textAlign='left';
      ctx.fillText('⭐ '+score,8,19);
      ctx.textAlign='center';ctx.fillStyle='#FFD700';
      ctx.fillText('WELLE '+wave+'/5',W/2,19);
      ctx.textAlign='right';
      for(let i=0;i<Math.min(lives,5);i++){
        const hx=W-8-i*20,hy=13;
        ctx.fillStyle='#e74c3c';
        ctx.beginPath();ctx.moveTo(hx,hy+4);ctx.bezierCurveTo(hx,hy,hx-6,hy,hx-6,hy+4);
        ctx.bezierCurveTo(hx-6,hy+9,hx,hy+13,hx,hy+13);ctx.bezierCurveTo(hx,hy+13,hx+6,hy+9,hx+6,hy+4);
        ctx.bezierCurveTo(hx+6,hy,hx,hy,hx,hy+4);ctx.fill();
      }
    };
    loop();
  }
};
window.StarWarsGame=StarWarsGame;
