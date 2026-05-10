// STUNT CAR - replaces Jenga
const StuntGame = {
  start({onComplete}) {
    const el = document.getElementById('game-area');
    if (!el) return;
    const W=420,H=400;
    el.innerHTML=`<div style="text-align:center">
      <canvas id="stcv" width="${W}" height="${H}" style="background:#87CEEB;border-radius:8px;max-width:100%"></canvas>
      <div style="display:flex;justify-content:center;gap:8px;margin-top:8px">
        <button id="st-back" style="background:#E74C3C;color:#fff;border:none;padding:12px 20px;border-radius:8px;font-size:.9rem;cursor:pointer;font-weight:700">↺ Rückwärts</button>
        <button id="st-fwd" style="background:#27AE60;color:#fff;border:none;padding:12px 20px;border-radius:8px;font-size:.9rem;cursor:pointer;font-weight:700">Vorwärts ↻</button>
      </div>
      <div style="font-size:.72rem;color:rgba(0,0,0,.5);margin-top:4px">Drehe das Auto über Hügel und lande sicher!</div>
    </div>`;
    const cv=document.getElementById('stcv'),ctx=cv.getContext('2d');
    // Terrain using sine waves
    const TW=2000;
    let terrain=[];
    for(let x=0;x<TW;x+=4){
      const h=H*0.65+Math.sin(x*0.02)*60+Math.sin(x*0.007)*90+Math.sin(x*0.04)*30;
      terrain.push({x,y:h});
    }
    let car={x:80,y:200,vx:0,vy:0,angle:0,av:0,onGround:false};
    let camX=0,score=0,maxX=0,running=true,tStart=Date.now(),animId;
    let fwdHeld=false,backHeld=false;
    const getY=(wx)=>{
      const i=Math.floor(wx/4);
      if(i<0||i>=terrain.length-1)return H*0.7;
      return terrain[i].y;
    };
    const getNorm=(wx)=>{
      const dx=4,dy=getY(wx+dx)-getY(wx);
      const len=Math.sqrt(dx*dx+dy*dy);
      return{nx:-dy/len,ny:dx/len,ang:Math.atan2(dy,dx)};
    };
    document.getElementById('st-fwd').addEventListener('pointerdown',()=>fwdHeld=true);
    document.getElementById('st-back').addEventListener('pointerdown',()=>backHeld=true);
    document.addEventListener('pointerup',()=>{fwdHeld=false;backHeld=false;});
    const onKey=e=>{if(e.key==='ArrowRight')fwdHeld=true;else if(e.key==='ArrowLeft')backHeld=true;};
    const onKeyUp=e=>{if(e.key==='ArrowRight')fwdHeld=false;else if(e.key==='ArrowLeft')backHeld=false;};
    window.addEventListener('keydown',onKey);window.addEventListener('keyup',onKeyUp);
    const end=(won)=>{
      running=false;cancelAnimationFrame(animId);
      window.removeEventListener('keydown',onKey);window.removeEventListener('keyup',onKeyUp);
      onComplete({rawScore:Math.min(100,Math.round(score)),timeMs:Date.now()-tStart,errors:0,passed:won||score>30});
    };
    const loop=()=>{
      if(!running)return;
      // Physics
      car.vy+=0.4; // gravity
      if(fwdHeld){car.vx+=Math.cos(car.angle)*0.5;car.av-=0.06;}
      if(backHeld){car.vx-=Math.cos(car.angle)*0.3;car.av+=0.04;}
      car.vx*=0.97;car.av*=0.92;
      car.x+=car.vx;car.y+=car.vy;car.angle+=car.av;
      // Ground collision
      const gy=getY(car.x);
      if(car.y>=gy-12){
        car.y=gy-12;car.vy*=-0.3;car.onGround=true;
        const {ang}=getNorm(car.x);car.angle+=(ang-car.angle)*0.15;
        car.vx*=0.88;
      } else {car.onGround=false;}
      // Flip = death
      const normAng=((car.angle%(Math.PI*2))+Math.PI*2)%(Math.PI*2);
      if(normAng>Math.PI*0.6&&normAng<Math.PI*1.4){end(false);return;}
      // Score = distance
      if(car.x>maxX){maxX=car.x;score=Math.round((maxX-80)/10);}
      // Win at distance 1500
      if(car.x>1600){end(true);return;}
      // Fall off
      if(car.y>H+50){end(false);return;}
      // Camera
      camX=car.x-W*0.35;
      // Draw sky
      ctx.fillStyle='#87CEEB';ctx.fillRect(0,0,W,H);
      // Clouds
      [[100,60],[250,40],[380,70]].forEach(([cx,cy])=>{
        ctx.fillStyle='rgba(255,255,255,.8)';
        ctx.beginPath();ctx.ellipse(cx-camX%W,cy,40,20,0,0,Math.PI*2);ctx.fill();
      });
      // Terrain
      ctx.fillStyle='#3d8b37';
      ctx.beginPath();ctx.moveTo(0,H);
      terrain.filter(p=>p.x-camX>-10&&p.x-camX<W+10)
        .forEach(p=>ctx.lineTo(p.x-camX,p.y));
      ctx.lineTo(W,H);ctx.closePath();ctx.fill();
      // Ground detail
      ctx.strokeStyle='#2d6b27';ctx.lineWidth=2;ctx.beginPath();
      terrain.filter(p=>p.x-camX>-10&&p.x-camX<W+10)
        .forEach((p,i)=>{if(i===0)ctx.moveTo(p.x-camX,p.y);else ctx.lineTo(p.x-camX,p.y);});
      ctx.stroke();
      // Car
      ctx.save();ctx.translate(car.x-camX,car.y);ctx.rotate(car.angle);
      // Body
      ctx.fillStyle='#E74C3C';ctx.fillRect(-22,-12,44,16);
      ctx.fillStyle='#C0392B';ctx.fillRect(-14,-22,28,12);
      // Wheels
      ctx.fillStyle='#333';[[-14,4],[14,4]].forEach(([wx,wy])=>{ctx.beginPath();ctx.arc(wx,wy,8,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#666';ctx.lineWidth=2;ctx.stroke();});
      // Window
      ctx.fillStyle='rgba(150,220,255,.6)';ctx.fillRect(-10,-20,20,10);
      ctx.restore();
      // HUD
      ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(0,0,W,30);
      ctx.fillStyle='#FFD700';ctx.font='bold 14px monospace';ctx.textAlign='left';
      ctx.fillText('🏁 '+score+' m',8,20);
      ctx.textAlign='right';ctx.fillStyle='#29B6F6';
      ctx.fillText('Ziel: 1600m',W-8,20);
      animId=requestAnimationFrame(loop);
    };
    loop();
    setTimeout(()=>{if(running)end(score>50);},90000);
  }
};
window.StuntGame=StuntGame;
