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
      // Feed into unified GameLog
      if(window.GameLog){
        if(lvl==='E') GameLog.error('starwars',msg);
        else GameLog.log('starwars',msg);
      }
      try{
        const ts=Date.now();
        const timeStr=new Date(ts).toLocaleTimeString('de-CH',{hour:'2-digit',minute:'2-digit',second:'2-digit',fractionalSecondDigits:3});
        const raw=localStorage.getItem('_mischa_crash_log')||'[]';
        const arr=JSON.parse(raw);
        arr.push({ts,timeStr,level:lvl,src:'starwars',msg:String(msg).slice(0,300)});
        if(arr.length>500)arr.splice(0,arr.length-400);
        localStorage.setItem('_mischa_crash_log',JSON.stringify(arr));
        // Human-readable format for copy-paste
        const readable=localStorage.getItem('_mischa_crash_readable')||'';
        const newLine='['+timeStr+'] ['+lvl+'|starwars] '+msg;
        localStorage.setItem('_mischa_crash_readable',(readable+'\n'+newLine).slice(-20000));
      }catch(e){}
    };
    const _swOnErr=(msg,src,line)=>{
      // Include the real source file — window.onerror is page-global, so an error
      // thrown by a completely different script while Starwars is running would
      // otherwise get mislabeled as a Starwars bug with no way to trace it back.
      const _fname = (src||'').split('/').pop() || '?';
      _swLog('ERROR: '+msg+' ('+_fname+':L'+line+')', 'E');
    };
    const _prevOnerr=window.onerror;
    window.onerror=function(m,s,l,c,e){_swOnErr(m,s,l);if(_prevOnerr)return _prevOnerr(m,s,l,c,e);};

    function BTN(bg,b){return `background:${bg};border:2px solid ${b};color:#fff;padding:clamp(10px,3vw,14px) clamp(16px,5vw,28px);border-radius:10px;font-size:clamp(.9rem,3.5vw,1.05rem);font-weight:900;cursor:pointer;touch-action:none;box-shadow:0 0 12px ${b}55,0 4px 0 rgba(0,0,0,.5)`;}
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


    const cv=document.getElementById('swcv'), ctx=cv.getContext('2d');
    ctx.scale(DPR,DPR);

    let ship={x:W/2,y:H-70,w:28,h:22};
    let bullets=[], enemies=[], explosions=[], powerups=[], stars=[], popups=[];
    let score=0, lives=3, wave=1, running=true, tStart=Date.now(), animId, tick=0;
    let fireMode='single', fireModeTimer=0;

    // Starfield
    for(let i=0;i<120;i++) stars.push({x:Math.random()*W,y:Math.random()*H,
      s:Math.random()*1.8+.3,spd:.3+Math.random()*.8,bright:Math.random()});

    const spawnWave=()=>{
      const speed=0.35+wave*0.08; // wave 8=0.99, wave 13=1.39 (very gentle)
      // Wave-specific formations for variety
      if(wave<=3){
        // Classic grid
        const rows=1+wave, cols=4+wave, sp=Math.min(46,Math.floor((W-40)/cols));
        for(let r=0;r<rows;r++) for(let c=0;c<cols;c++)
          enemies.push({x:20+c*sp,y:25+r*34,w:22,h:18,hp:1,dx:speed,dy:0,type:r%4,phase:Math.random()*Math.PI*2});
      } else if(wave===4){
        // V-formation
        const cols=9, sp=Math.min(42,Math.floor((W-40)/cols));
        for(let c=0;c<cols;c++){
          const row=Math.abs(c-4);
          enemies.push({x:20+c*sp,y:15+row*28,w:22,h:18,hp:1+(c===4?1:0),dx:speed,dy:0,type:c%4,phase:Math.random()*Math.PI*2});
        }
      } else if(wave===5){
        // Two diagonal wings — move DOWN+sideways slowly, giving time to react
        const w5spd=0.35; // very slow horizontal
        const w5dy=0.18;  // slow downward drift
        for(let c=0;c<5;c++) enemies.push({x:15+c*36,y:20+c*18,w:22,h:18,hp:2,dx:w5spd,dy:w5dy,type:0,phase:Math.random()*Math.PI*2});
        for(let c=0;c<5;c++) enemies.push({x:W-15-c*36,y:20+c*18,w:22,h:18,hp:2,dx:-w5spd,dy:w5dy,type:1,phase:Math.random()*Math.PI*2});
      } else if(wave===6){
        // Boss row + normal grid - start farther apart to reduce wall hits
        for(let c=0;c<5;c++) enemies.push({x:40+c*60,y:20,w:28,h:22,hp:2,dx:speed*0.7,dy:0,type:2,phase:c*0.5,isBoss:true});
        for(let c=0;c<6;c++) enemies.push({x:25+c*60,y:70,w:22,h:18,hp:1,dx:speed*0.6,dy:0,type:3,phase:Math.random()*Math.PI*2});
      } else if(wave===7){
        // Diamond formation
        const pattern=[[4,0],[3,1],[5,1],[2,2],[4,2],[6,2],[3,3],[5,3],[4,4]];
        pattern.forEach(([c,r])=>enemies.push({x:20+c*42,y:15+r*30,w:22,h:18,hp:1+(r===0?2:r<2?1:0),dx:speed,dy:0,type:r%4,phase:Math.random()*Math.PI*2}));
      } else if(wave===8){
        // Wave 8: Full assault rows
        const rows=4, cols=9, sp=Math.min(42,Math.floor((W-40)/cols));
        for(let r=0;r<rows;r++) for(let c=0;c<cols;c++)
          enemies.push({x:20+c*sp,y:15+r*28,w:22,h:18,hp:1+(r===0?2:r===1?1:0),dx:speed,dy:0,type:(r+c)%4,phase:Math.random()*Math.PI*2});
      } else if(wave===9){
        // Wave 9: Zigzag columns — move down with alternating horizontal drift
        for(let c=0;c<8;c++) for(let r=0;r<3;r++)
          enemies.push({x:15+c*44,y:10+r*32,w:22,h:18,hp:2,dx:speed*(c%2===0?0.6:-0.6),dy:0.05,type:c%4,phase:Math.random()*Math.PI*2});
      } else if(wave===10){
        // Wave 10: Two boss columns + swarm
        for(let r=0;r<3;r++){
          enemies.push({x:60+r*20, y:15+r*35,w:28,h:22,hp:3,dx:speed*0.55,dy:0,type:2,phase:r*0.4,isBoss:true});
          enemies.push({x:W-60-r*20,y:15+r*35,w:28,h:22,hp:3,dx:-speed*0.55,dy:0,type:3,phase:r*0.4,isBoss:true});
        }
        for(let c=0;c<7;c++) enemies.push({x:20+c*50,y:15,w:20,h:16,hp:1,dx:speed*0.8,dy:0,type:0,phase:Math.random()*Math.PI*2});
      } else if(wave===11){
        // Wave 11: V-shape on screen (no off-screen start), converging inward
        const arms=6;
        for(let i=0;i<arms;i++){
          const frac=i/(arms-1); // 0..1
          const yPos=10+i*28; // staggered rows on screen
          // Left arm: moves right
          enemies.push({x:10+i*30,y:yPos,w:22,h:18,hp:2,dx:speed*0.65,dy:0,type:0,phase:i*.3});
          // Right arm: moves left
          enemies.push({x:W-10-i*30,y:yPos,w:22,h:18,hp:2,dx:-speed*0.65,dy:0,type:1,phase:i*.3});
        }
      } else if(wave===12){
        // Wave 12: Three rows at different speeds — like classic Galaga
        const cols3=7,sp3=Math.min(50,Math.floor((W-30)/cols3));
        for(let c=0;c<cols3;c++){
          enemies.push({x:15+c*sp3,y:15,w:22,h:18,hp:2,dx:speed*0.7,dy:0,type:0,phase:c*.25});
          enemies.push({x:15+c*sp3,y:52,w:22,h:18,hp:2,dx:speed*0.55,dy:0,type:1,phase:c*.25+0.8});
          enemies.push({x:15+c*sp3,y:88,w:22,h:18,hp:1,dx:speed*0.65,dy:0,type:2,phase:c*.25+1.6});
        }
      } else if(wave===13){
        // Wave 13: 4×8 grid (smaller than 5×10 to avoid overwhelming)
        const sp4=Math.min(46,Math.floor((W-20)/8));
        for(let r=0;r<4;r++) for(let c=0;c<8;c++)
          enemies.push({x:10+c*sp4,y:12+r*28,w:22,h:18,hp:1+(r<2?2:1),dx:speed*(r%2===0?1:-1)*.7,dy:0,type:(r+c)%4,phase:Math.random()*Math.PI*2});
      } else if(wave===14){
        // Wave 14: staggered grid, enemies alternate direction per column
        const sp5=Math.min(44,Math.floor((W-20)/9));
        for(let r=0;r<4;r++) for(let c=0;c<9;c++)
          enemies.push({x:10+c*sp5,y:10+r*30,w:22,h:18,hp:2+(r<2?1:0),dx:speed*(c%2===0?1:-1),dy:0,type:(r+c)%4,phase:c*.2+r*.4});
      } else if(wave===15){
        // Wave 15: two separate fleets colliding
        const sp6=Math.min(46,Math.floor(W/2/5));
        for(let r=0;r<4;r++) for(let c=0;c<5;c++){
          enemies.push({x:10+c*sp6,y:15+r*28,w:22,h:18,hp:2,dx:speed*1.1,dy:0,type:0,phase:c*.2});
          enemies.push({x:W/2+10+c*sp6,y:15+r*28,w:22,h:18,hp:2,dx:-speed*1.1,dy:0,type:2,phase:c*.2+1});
        }
      } else if(wave===16){
        // Wave 16: boss grid + swarm below
        for(let c=0;c<4;c++) enemies.push({x:50+c*80,y:15,w:34,h:28,hp:5,dx:speed*0.7,dy:0,type:2,phase:c*.5,isBoss:true});
        for(let r=0;r<3;r++) for(let c=0;c<9;c++)
          enemies.push({x:10+c*44,y:65+r*28,w:20,h:16,hp:1,dx:speed*(r%2===0?1.1:-1.1),dy:0,type:r%4,phase:c*.15+r*.3});
      } else if(wave===17){
        // Wave 17: diamond formation ×2
        const CX2=W/4, CX3=3*W/4;
        [[CX2],[CX3]].forEach((cx2,side)=>{
          const pattern2=[[0,0],[1,1],[-1,1],[2,2],[0,2],[-2,2],[1,3],[-1,3]];
          pattern2.forEach(([dc,dr])=>enemies.push({x:cx2[0]+dc*38,y:15+dr*28,w:22,h:18,hp:2+(Math.abs(dc)<=1?1:0),dx:speed*(side===0?1:-1)*0.9,dy:0,type:(dc+dr+side)%4,phase:Math.random()*Math.PI*2}));
        });
      } else {
        // Wave 18: FINAL ASSAULT — max everything
        const sp4=Math.min(36,Math.floor((W-20)/10));
        for(let r=0;r<6;r++) for(let c=0;c<10;c++)
          enemies.push({x:10+c*sp4,y:8+r*24,w:20,h:16,hp:1+(r<3?2:1),dx:speed*(r%2===0?1:-1)*(0.8+r*0.06),dy:0,type:(r+c)%4,phase:Math.random()*Math.PI*2});
      }
      // Powerups
      const pwType=wave>=10?'penta':wave>=6?'triple':wave>=4?'rapid':'shield';
      powerups.push({x:60+Math.random()*(W-120),y:-20,dy:1.4,type:pwType});
      if(wave>=4) powerups.push({x:60+Math.random()*(W-120),y:-60,dy:1.2,type:wave>=7?'triple':wave>=5?'rapid':'shield'});
    };
    spawnWave();

    let leftH=false, rightH=false, efTick=0;
    const ptrUpHandler=()=>{leftH=false;rightH=false;}; // declared BEFORE use!

    const fire=()=>{
      if(fireMode==='penta'){
        bullets.push({x:ship.x,    y:ship.y-10,dy:-11,dx:0});
        bullets.push({x:ship.x-10, y:ship.y-4, dy:-10,dx:-1.8});
        bullets.push({x:ship.x+10, y:ship.y-4, dy:-10,dx:1.8});
        bullets.push({x:ship.x-18, y:ship.y+2, dy:-8, dx:-3.2});
        bullets.push({x:ship.x+18, y:ship.y+2, dy:-8, dx:3.2});
      } else if(fireMode==='triple'){
        bullets.push({x:ship.x,    y:ship.y-10,dy:-11,dx:0});
        bullets.push({x:ship.x-10, y:ship.y-2, dy:-10,dx:-1.8});
        bullets.push({x:ship.x+10, y:ship.y-2, dy:-10,dx:1.8});
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
    // Sigmoid sensor curve — smooth response with dead zone
    const sensorCurve=(raw)=>{
      const sign=raw<0?-1:1;
      const abs=Math.abs(raw);
      const deadZone=3;
      if(abs<deadZone)return 0;
      // Sigmoid: smooth start, fast middle, plateaus at ~35°
      const x=(abs-deadZone)/10; // normalize
      const sig=1/(1+Math.exp(-2.5*(x-1.2))); // S-curve
      return sign*Math.min(1,sig*1.8); // 0..1 output
    };
    const gyro=e=>{
      if(!running)return;
      const raw=e.gamma||0; // gamma = left/right tilt
      const curved=sensorCurve(raw);
      // Convert 0..1 to speed (ship moves 0..8 px/frame)
      const spd=curved*7;
      leftH=spd<-0.3; rightH=spd>0.3;
      // Also store for smooth movement
      ship._tiltSpd=spd;
    };
    if(window.DeviceOrientationEvent){
      if(typeof DeviceOrientationEvent.requestPermission==='function')
        fb.addEventListener('click',()=>DeviceOrientationEvent.requestPermission().then(p=>{if(p==='granted')window.addEventListener('deviceorientation',gyro);}).catch(()=>{}),{once:true});
      else window.addEventListener('deviceorientation',gyro);
    }

    const end=(won)=>{
      running=false;cancelAnimationFrame(animId);
      window.removeEventListener('keydown',onKey);window.removeEventListener('keyup',onKU);
      document.removeEventListener('pointerup',ptrUpHandler);
      if(rfInt)clearInterval(rfInt);
      window.onerror=_prevOnerr; // restore
      const _finalRaw=Math.min(100,Math.max(5,Math.round(wave/18*70+score/30000*30)));
      _swLog('Game ended: wave='+wave+'/18 lives='+lives+' score='+score+' rawScore='+_finalRaw+' won='+won);
      onComplete({rawScore:Math.min(100,Math.max(5,Math.round(wave/18*70+score/30000*30))),timeMs:Date.now()-tStart,errors:0,passed:wave>=3||won||score>=150});
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
      // Guard: if canvas no longer in DOM, stop
      if(!document.getElementById('swcv')){running=false;return;}
      animId=requestAnimationFrame(loop);
      tick++;
      // Safety: check for runaway state
      if(tick%300===0&&tick>0){ // Every 5 seconds: log game state
        _swLog('tick='+tick+' wave='+wave+'/18 enemies='+enemies.length+' lives='+lives+' score='+score+' powerup='+fireMode);
      }
      if(tick>1&&tick%3000===0){
        console.log('[SW] frame='+tick+' enemies='+enemies.length+' bullets='+bullets.length+' score='+score+' wave='+wave+' lives='+lives);
      }

      // Move ship
      if(ship._tiltSpd!==undefined&&Math.abs(ship._tiltSpd)>0.3){
        // Smooth sensor movement
        ship.x=Math.max(20,Math.min(W-20,ship.x+ship._tiltSpd));
      } else {
        if(leftH) ship.x=Math.max(20,ship.x-5);
        if(rightH) ship.x=Math.min(W-20,ship.x+5);
      }

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
          else if(p.type==='penta'){fireMode='penta';fireModeTimer=600;}
          else{lives=Math.min(5,lives+1);}
          explosions.push({x:p.x,y:p.y,t:25,r:30,col:'#00ff88'});
          return false;
        }
        return true;
      });

      // Enemies
      let edgeHit=false;
      enemies.forEach(e=>{
        e.x+=e.dx; e.y+=(e.dy||0);
        // Only bounce horizontal enemies (dy===0) off walls
        if(e.dy===0&&(e.x<18||e.x>W-18)) edgeHit=true;
        // For diagonal enemies, just clamp x
        if(e.dy!==0&&(e.x<10||e.x>W-10)) e.dx*=-1;
      });
      if(edgeHit){enemies.forEach(e=>{if(e.dy===0){e.dx*=-1;e.y+=3;}});} // 3px drop (was 10)

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
              if(e.hp<=0){const pts=10*(e.type+1)+(wave-1)*5+(e.isBoss?30:0);score+=pts;popups.push({x:e.x,y:e.y,t:40,txt:'+'+pts,col:'#FFD700'});explosions.push({x:e.x,y:e.y,t:18,r:20,col:'#ff8800'});return false;}
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
      // Enemy reaches player line: lose a life, remove enemy
      const reachedBottom=enemies.filter(e=>e.y>H-60);
      if(reachedBottom.length>0){
        lives=Math.max(0,lives-1); // max 1 life per frame, not N enemies at once
        enemies=enemies.filter(e=>e.y<=H-60);
        explosions.push(...reachedBottom.map(e=>({x:e.x,y:H-60,t:18,r:22,col:'#ff4400'})));
        if(lives<=0){end(false);return;}
      }
      if(!enemies.length){wave++;if(wave>18){end(true);return;}spawnWave();}
      if(Date.now()-tStart>1500000)end(score>100); // 25 min max for 18 waves

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
      const PICONS={shield:'🛡',rapid:'⚡',triple:'🔱',penta:'⭐'};
      const PCOLS={shield:'#00ff88',rapid:'#ff69b4',triple:'#ffd700',penta:'#ff4500'};
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

      // Draw floating score popups
      popups = popups.filter(p => { p.t--; if(p.t<0) return false; p.y-=0.55;
        ctx.save(); ctx.globalAlpha=Math.min(1,p.t/12); ctx.font='bold 14px Arial';
        ctx.fillStyle=p.col||'#FFD700'; ctx.textAlign='center';
        ctx.fillText(p.txt, p.x, p.y); ctx.restore(); return true; });

      // Fire mode indicator
      if(fireMode!=='single'){
        const modeCol=fireMode==='penta'?'rgba(255,69,0,.25)':fireMode==='triple'?'rgba(255,215,0,.18)':'rgba(255,105,180,.18)';
        const modeTextCol=fireMode==='penta'?'#ff6600':fireMode==='triple'?'#FFD700':'#ff69b4';
        const modeLabel=fireMode==='penta'?'⭐ PENTA SHOT':fireMode==='triple'?'🔱 TRIPLE':'⚡ RAPID';
        ctx.fillStyle=modeCol;ctx.fillRect(0,H-22,W,22);
        ctx.fillStyle=modeTextCol;ctx.font='bold 11px monospace';ctx.textAlign='center';
        ctx.fillText(modeLabel+' — '+Math.ceil(fireModeTimer/60)+'s',W/2,H-6);
      }

      // HUD
      ctx.fillStyle='rgba(0,0,20,.7)';ctx.fillRect(0,0,W,28);
      ctx.fillStyle='rgba(0,120,255,.3)';ctx.fillRect(0,26,W,2);
      ctx.fillStyle='#fff';ctx.font=`bold ${Math.max(11,W*.032)}px monospace`;ctx.textAlign='left';
      ctx.fillStyle='#FFD700';ctx.font='bold 15px Arial';ctx.fillText('⭐ '+score,8,19);
      ctx.textAlign='center';ctx.fillStyle='#FFD700';
      ctx.fillText((typeof t!=='undefined'?t('starwars.wave'):'WELLE')+' '+wave+'/18',W/2,19);
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
