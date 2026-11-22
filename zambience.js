/* ZAmb (v837): 🌧️ Regen-Sound bei Regen im Zoo + 🎬 Intro-Szene (Logo-Animation + Sound) beim Öffnen */
(function(){
  'use strict';
  if(window.ZAmb) return;
  const BASE=(()=>{ try{ const c=document.currentScript&&document.currentScript.src; return c?c.replace(/[^\/]*$/,''):''; }catch(e){ return ''; } })();
  const A=window.ZAmb={rainOn:false,splash:false};
  /* ── Regen ── */
  const rain=new Audio(); rain.loop=true; rain.preload='none'; rain.src=BASE+'sounds/rain.mp3'; A.rain=rain;
  let target=0, started=false;
  const inZoo=()=>{ const e=document.getElementById('s-zoo'); return !!e && getComputedStyle(e).display!=='none'; };
  const want=()=>{ try{ if(A.splash) return 0; if(typeof Weather==='undefined'||!Weather.isEnabled()||Weather.current!=='rain') return 0; if(!inZoo()) return 0; const B=window.ZBgm; if(B&&B.on===false) return 0; const v=B?B.vol:.35; return Math.max(0,Math.min(1,v*1.4)); }catch(e){ return 0; } };
  setInterval(()=>{
    target=want();
    const v=rain.volume;
    if(target>0){
      if(rain.paused){ rain.volume=0; const p=rain.play(); if(p&&p.catch) p.catch(()=>{}); }
      rain.volume=Math.max(0,Math.min(1,v+(target-v)*0.15+(Math.abs(target-v)<.02?target-v:0)));
    } else if(!rain.paused){
      const nv=v-0.06; if(nv<=0){ rain.volume=0; rain.pause(); } else rain.volume=nv;
    }
    A.rainOn=!rain.paused;
  },250);
  /* ── Intro-Szene (Kino-Stil: Erde, Sonnenflare, Metall-Logo, Flammen) ── */
  function splash(opt){
    // Früher: nur 1× pro Browser-Sitzung → bei jedem weiteren Login im selben Tab kam der Einstieg nie wieder.
    // Jetzt: immer, wenn man frisch vom Login/Kino kommt (autostart=1) oder zum ersten Mal in dieser Sitzung.
    // Kein erneutes Abspielen bei F5/Neuladen (dort würde er nerven).
    if(!opt) try{
      let nav='navigate'; try{ const e=performance.getEntriesByType('navigation')[0]; if(e&&e.type) nav=e.type; }catch(_){}
      const fresh=/[?&]autostart=1\b/.test(location.search) && nav!=='reload' && nav!=='back_forward';
      const seen=!!sessionStorage.getItem('zsplash');
      if(seen && !fresh){ console.log('[Intro-debug] Kino-Intro übersprungen (Neuladen oder schon gesehen, autostart='+/[?&]autostart=1/.test(location.search)+', nav='+nav+')'); return; }
      sessionStorage.setItem('zsplash','1'); console.log('[Intro-debug] Kino-Intro startet (autostart='+/[?&]autostart=1/.test(location.search)+', nav='+nav+')');
    }catch(e){}
    // Szene läuft jetzt so lange wie das ganze Lied (~18 s): alle Zeiten der ursprünglichen 10,4-s-Fassung werden mit K gestreckt
    const SH=!!(opt&&opt.short); const K=SH?.385:1.74, DUR=10.4*K;
    const css=document.createElement('style');
    css.textContent=
     '#z-splash{position:fixed;inset:0;z-index:2147483000;background:#000;overflow:hidden;transition:opacity .9s;user-select:none;font-family:"Trajan Pro","Cinzel",Georgia,"Times New Roman",serif;perspective:900px}'
    +'#z-splash.out{opacity:0;pointer-events:none}'
    +'#z-splash canvas{position:absolute;inset:0;width:100%;height:100%}'
    +'#z-splash .zs-bar{position:absolute;left:0;right:0;height:7%;background:#000;z-index:5}#z-splash .zs-bar.t{top:0}#z-splash .zs-bar.b{bottom:0}'
    +'#z-splash .zs-fade{position:absolute;inset:0;background:#000;z-index:6;opacity:1}'
    +'#z-splash.go .zs-fade{animation:zsIn 1.2s ease-out forwards}@keyframes zsIn{to{opacity:0}}'
    +'#z-splash .zs-main{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:3;pointer-events:none;padding-bottom:4%}#z-splash .zs-title{position:relative;display:flex;flex-wrap:wrap;justify-content:center;gap:0 .5em;font-weight:900;font-size:min(11.5vw,118px);line-height:1.05}@media (orientation:landscape){#z-splash .zs-title{font-size:min(8vw,100px);flex-wrap:nowrap}}'
    +'#z-splash .zs-w{display:flex}'
    +'#z-splash .zs-l{position:relative;display:inline-block;opacity:0;color:#b8860b;-webkit-text-stroke:.05em #e9c46a;text-shadow:.01em .01em #8a6508,.02em .02em #8a6508,.03em .03em #7a5806,.04em .04em #7a5806,.05em .05em #6b4c05,.06em .06em #6b4c05,.07em .07em #5c4004,.09em .09em #4a3403,.11em .11em rgba(0,0,0,.55),.15em .15em .1em rgba(0,0,0,.5)}'
    +'#z-splash .zs-l::after{content:attr(data-t);position:absolute;left:0;top:0;color:transparent;text-shadow:none;background:linear-gradient(180deg,#fff 0%,#dfe7f5 30%,#8fa0bd 50%,#f4f8ff 56%,#a9b6cf 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-stroke:.012em #fff}'
    +'#z-splash.go .zs-l{animation:zsFly 1.15s cubic-bezier(.12,.8,.2,1) var(--d) forwards}'
    +'@keyframes zsFly{0%{opacity:0;transform:translate3d(var(--x),var(--y),-900px) rotateX(var(--rx)) rotateY(var(--ry)) rotateZ(var(--rz))}12%{opacity:1}100%{opacity:1;transform:none}}'
    +'#z-splash.go .zs-title{animation:zsDrift 9s ease-out forwards,zsBurn 1.9s ease-in 8.35s forwards}'
    +'@keyframes zsDrift{0%{transform:scale(1.06)}100%{transform:scale(1)}}'
    +'@keyframes zsBurn{0%{filter:brightness(1)}35%{filter:brightness(1.7) sepia(1) saturate(5) hue-rotate(-18deg)}100%{filter:brightness(.25) sepia(1) saturate(3);opacity:0;transform:translateY(-12%) scale(1.06)}}'
    +'#z-splash .zs-sub{position:relative;margin-top:.9em;text-align:center;color:#e9c46a;font-size:min(3.6vw,19px);letter-spacing:.42em;font-weight:700;opacity:0;text-shadow:0 0 12px rgba(233,196,106,.6)}'
    +'#z-splash.go .zs-sub{animation:zsSub 1.2s ease-out 5.5s forwards,zsGone .8s ease-in 8.5s forwards}@keyframes zsSub{from{opacity:0;letter-spacing:.9em}to{opacity:1;letter-spacing:.42em}}@keyframes zsGone{to{opacity:0}}'
    +'#z-splash .zs-feat{position:relative;width:100%;margin-top:1em;text-align:center;font-size:min(4.6vw,22px);font-weight:800;color:#fff;letter-spacing:.14em;text-shadow:0 0 14px rgba(120,190,255,.9),0 2px 3px #000;height:1.6em;font-family:inherit}'
    +'#z-splash .zs-feat span{position:absolute;left:0;right:0;opacity:0}'
    +'#z-splash.go .zs-feat span{animation:zsFeat .42s ease-out var(--d) forwards}@keyframes zsFeat{0%{opacity:0;transform:translateY(14px) scale(.9)}20%{opacity:1;transform:none}80%{opacity:1}100%{opacity:0;transform:translateY(-8px)}}'
    +'#z-splash .zs-cable{position:absolute;left:-5%;right:-5%;top:20%;height:2px;background:linear-gradient(90deg,transparent,#c9d6ea 15%,#c9d6ea 85%,transparent);opacity:0;z-index:2;transform:rotate(-2.2deg)}'
    +'#z-splash.go .zs-cable{animation:zsFeat2 3.2s linear 5.6s forwards}@keyframes zsFeat2{0%{opacity:0}10%,85%{opacity:.8}100%{opacity:0}}'
    +'#z-splash .zs-gon{position:absolute;top:20%;left:-14%;font-size:min(11vw,56px);z-index:2;opacity:0;margin-top:-.3em;transform:rotate(-2.2deg);filter:drop-shadow(0 4px 6px rgba(0,0,0,.6))}'
    +'#z-splash.go .zs-gon{animation:zsGon 3.2s linear 5.6s forwards}@keyframes zsGon{0%{left:-14%;opacity:1;top:21.6%}100%{left:106%;opacity:1;top:17.2%}}'
    +'#z-splash .zs-tap{position:absolute;left:0;right:0;bottom:16%;text-align:center;color:#ffd54f;font-weight:800;font-size:1.05rem;z-index:7;font-family:sans-serif;animation:zsPulse 1s infinite}@keyframes zsPulse{50%{opacity:.4}}';
    css.textContent=css.textContent.replace(/animation:[^;}]*/g,m=>m.replace(/(\d*\.?\d+)s\b/g,(x,n)=>(+n*K).toFixed(2)+'s'));
    document.head.appendChild(css);
    const o=document.createElement('div'); o.id='z-splash';
    const words=['MISCHA','ZOO','3D']; let li=0, tot=words.join('').length, h='<canvas></canvas><div class="zs-cable"></div><div class="zs-gon">🚡</div><div class="zs-main"><div class="zs-title">';
    words.forEach(w=>{ h+='<div class="zs-w">'; w.split('').forEach(ch=>{ const k=li++; const r=(n)=>((Math.sin(k*12.9898+n*78.233)*43758.5453)%1+1)%1;
      h+='<span class="zs-l" data-t="'+ch+'" style="--d:'+((3.15+k*.07)*K).toFixed(2)+'s;--x:'+Math.round(30+r(1)*70)+'vw;--y:'+Math.round((r(2)-.5)*80)+'vh;--rx:'+Math.round((r(3)-.5)*540)+'deg;--ry:'+Math.round((r(4)-.5)*540)+'deg;--rz:'+Math.round((r(5)-.5)*360)+'deg">'+ch+'</span>'; }); h+='</div>'; });
    h+='</div><div class="zs-sub">EIN MISCHATALER-ABENTEUER</div>';
    const F=['🚡 GONDELSTATION','🎡 GLÜCKSRAD','⚗️ GOLDMASCHINE','🗝️ SCHATZKISTEN','🏴‍☠️ PIRATENWELT'];
    h+='<div class="zs-feat">'; F.forEach((t,i)=>{ h+='<span style="--d:'+((6.0+i*.4)*K).toFixed(2)+'s">'+t+'</span>'; }); h+='</div>';
    h+='</div><div class="zs-bar t"></div><div class="zs-bar b"></div><div class="zs-fade"></div><div class="zs-tap" style="display:none">👆 Tippen zum Starten</div>';
    o.innerHTML=h; document.body.appendChild(o);
    const cv=o.querySelector('canvas'), cx=cv.getContext('2d');
    /* ── Erde: prozedurale Karte ── */
    const TW=512, TH=256, land=new Uint8Array(TW*TH), lit=new Float32Array(TW*TH);
    (function(){
      const G=64, g=[]; for(let i=0;i<G*G;i++) g.push(Math.random());
      const vn=(x,y)=>{ const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi; const a=g[((yi%G+G)%G)*G+((xi%G+G)%G)],b=g[((yi%G+G)%G)*G+(((xi+1)%G+G)%G)],c=g[(((yi+1)%G+G)%G)*G+((xi%G+G)%G)],d=g[(((yi+1)%G+G)%G)*G+(((xi+1)%G+G)%G)]; const u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf); return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v; };
      const fbm=(x,y)=>{ let s=0,a=.5,f=1; for(let k=0;k<5;k++){ s+=a*vn(x*f,y*f); a/=2; f*=2; } return s; };
      for(let y=0;y<TH;y++) for(let x=0;x<TW;x++){ const lat=Math.abs(y/TH-.5)*2; const n=fbm(x/TW*8,y/TH*4)-lat*.12; const L=n>.5?1:0; land[y*TW+x]=L; if(L){ const c=fbm(x/TW*22+9,y/TH*11+5); lit[y*TW+x]=c>.52?Math.min(1,(c-.5)*5)*(Math.random()<.55?1:.25)*(1-lat*.6):0; } }
    })();
    const N=220, npx=N*N, LON=new Float32Array(npx), LAT=new Float32Array(npx), SUN=new Float32Array(npx), MASK=new Uint8Array(npx);
    const sd=[.78,-.5,.38], sl=Math.hypot(sd[0],sd[1],sd[2]); sd[0]/=sl; sd[1]/=sl; sd[2]/=sl;
    const tilt=.42, ct=Math.cos(tilt), st=Math.sin(tilt);
    for(let j=0;j<N;j++) for(let i=0;i<N;i++){ const x=(i+.5)/N*2-1, y=(j+.5)/N*2-1, r2=x*x+y*y, k=j*N+i; if(r2>=1){ MASK[k]=0; continue; } MASK[k]=1; const z=Math.sqrt(1-r2); SUN[k]=x*sd[0]+y*sd[1]+z*sd[2];
      const yy=y*ct-z*st, zz=y*st+z*ct; LAT[k]=Math.asin(-yy); LON[k]=Math.atan2(x,zz); }
    const ec=document.createElement('canvas'); ec.width=ec.height=N; const ex=ec.getContext('2d'), img=ex.createImageData(N,N), px=img.data;
    function drawEarth(rot,dayAmt){
      for(let k=0;k<npx;k++){ const p=k*4; if(!MASK[k]){ px[p+3]=0; continue; }
        let u=((LON[k]+rot)/(Math.PI*2))%1; if(u<0)u+=1; const tx=(u*TW)|0, ty=Math.max(0,Math.min(TH-1,((.5-LAT[k]/Math.PI)*TH)|0)), ti=ty*TW+tx;
        const isL=land[ti], s=SUN[k], dayF=Math.max(0,Math.min(1,(s+.05)/.55))*dayAmt; let rr,gg,bb;
        if(isL){ rr=14+55*dayF; gg=24+70*dayF; bb=26+35*dayF; } else { rr=6+34*dayF; gg=16+78*dayF; bb=38+120*dayF; }
        const li=lit[ti]*(1-Math.min(1,dayF*1.6)); if(li>0){ rr+=255*li; gg+=170*li; bb+=70*li; }
        const edge=1-Math.pow(Math.max(0,s*.5+.5),.6); rr*=1-edge*.35; gg*=1-edge*.3;
        px[p]=rr>255?255:rr; px[p+1]=gg>255?255:gg; px[p+2]=bb>255?255:bb; px[p+3]=255; }
      ex.putImageData(img,0,0);
    }
    /* ── Sterne, Flammen ── */
    const stars=[]; for(let i=0;i<170;i++) stars.push({x:Math.random(),y:Math.random(),r:Math.random()*1.3+.3,a:Math.random()*6,z:Math.random()});
    const fl=[]; let W=0,Hh=0,dpr=1;
    const rs=()=>{ dpr=Math.min(2,window.devicePixelRatio||1); W=o.clientWidth; Hh=o.clientHeight; cv.width=W*dpr*.75; cv.height=Hh*dpr*.75; }; rs(); window.addEventListener('resize',rs);
    const ease=x=>x<0?0:x>1?1:x*x*(3-2*x);
    function flare(x,y,I,sc){
      cx.globalCompositeOperation='lighter';
      let g=cx.createRadialGradient(x,y,0,x,y,sc*.9); g.addColorStop(0,'rgba(255,248,225,'+Math.min(1,I)+')'); g.addColorStop(.12,'rgba(255,214,150,'+.55*I+')'); g.addColorStop(.4,'rgba(255,150,80,'+.16*I+')'); g.addColorStop(1,'rgba(255,120,40,0)'); cx.fillStyle=g; cx.fillRect(x-sc,y-sc,sc*2,sc*2);
      for(const a of [-.5,.35,1.2]){ cx.save(); cx.translate(x,y); cx.rotate(a); g=cx.createLinearGradient(-sc*1.6,0,sc*1.6,0); g.addColorStop(0,'rgba(255,230,180,0)'); g.addColorStop(.5,'rgba(255,240,210,'+.55*I+')'); g.addColorStop(1,'rgba(255,230,180,0)'); cx.fillStyle=g; cx.fillRect(-sc*1.6,-1.2,sc*3.2,2.4); cx.restore(); }
      // Regenbogen-Ghosts durch die Bildmitte
      const mx=W*cv.width/W/2, my=cv.height/2; const cols=['rgba(255,80,60,','rgba(80,255,140,','rgba(80,140,255,'];
      for(let i=0;i<3;i++){ const t=.5+i*.35, gx=x+(mx-x)*t*1.5, gy=y+(my-y)*t*1.5, rr=sc*(.22+i*.1); const gg=cx.createRadialGradient(gx,gy,rr*.7,gx,gy,rr); gg.addColorStop(0,cols[i]+'0)'); gg.addColorStop(.85,cols[i]+(.22*I)+')'); gg.addColorStop(1,cols[i]+'0)'); cx.fillStyle=gg; cx.beginPath(); cx.arc(gx,gy,rr,0,7); cx.fill(); }
      cx.globalCompositeOperation='source-over';
    }
    let t0=0, raf=0, last=0;
    function frame(now){
      if(done) return; const rt=(now-t0)/1000, t=rt/K, dt=Math.min(.05,(now-(last||now))/1000); last=now;
      const w=cv.width, hh=cv.height, m=Math.min(w,hh), beat=Math.max(0,1-(((rt-.75)%1.75+1.75)%1.75)*1.6)*(rt>4&&!SH?1:0); /* Puls auf den Stomps des Lieds (alle 1,75 s ab 0,75 s) */
      cx.setTransform(1,0,0,1,0,0); cx.fillStyle='#02040c'; cx.fillRect(0,0,w,hh);
      const bg=cx.createRadialGradient(w*.55,hh*.4,0,w*.55,hh*.4,m*1.1); bg.addColorStop(0,'#0d1a35'); bg.addColorStop(1,'#02040c'); cx.fillStyle=bg; cx.fillRect(0,0,w,hh);
      stars.forEach(s=>{ const tw=.55+.45*Math.sin(t*2+s.a); cx.fillStyle='rgba(255,255,255,'+(.25+.6*s.z)*tw+')'; const sx=((s.x-t*.004*s.z)%1+1)%1*w; cx.fillRect(sx,s.y*hh,s.r*(w/600),s.r*(w/600)); });
      // Erde: steigt auf, dreht sich, Kamera schwenkt
      const rise=ease(t/3.4), R=m*(.62+.2*ease(t/9)+(w<hh?.1:0)), ecx=w*(.34+.05*Math.sin(t*.25))+ (w<hh?w*.05:0), ecy=hh*(1.12-.36*rise)+ (t>7?Math.sin((t-7)*9)*0*1:0);
      const spin=t*.16+1;
      drawEarth(spin,Math.min(1,.5+t*.08));
      // Atmosphäre
      const sx=ecx+sd[0]/Math.hypot(sd[0],sd[1])*R*.98, sy=ecy+sd[1]/Math.hypot(sd[0],sd[1])*R*.98;
      const at=cx.createRadialGradient(ecx,ecy,R*.96,ecx,ecy,R*1.16); at.addColorStop(0,'rgba(110,170,255,.55)'); at.addColorStop(.35,'rgba(70,120,230,.2)'); at.addColorStop(1,'rgba(40,80,200,0)'); cx.fillStyle=at; cx.beginPath(); cx.arc(ecx,ecy,R*1.16,0,7); cx.fill();
      cx.imageSmoothingEnabled=true; cx.imageSmoothingQuality='high'; cx.drawImage(ec,ecx-R,ecy-R,R*2,R*2);
      // Rand-Aufhellung zur Sonne
      cx.save(); cx.beginPath(); cx.arc(ecx,ecy,R,0,7); cx.clip(); const rim=cx.createRadialGradient(ecx,ecy,R*.82,ecx,ecy,R); rim.addColorStop(0,'rgba(120,170,255,0)'); rim.addColorStop(1,'rgba(150,200,255,.45)'); cx.fillStyle=rim; cx.fillRect(ecx-R,ecy-R,R*2,R*2); cx.restore();
      // Sonne am Rand
      const sI=ease((t-.3)/2.2)*(1.15+.35*Math.sin(t*1.3))+beat*.5+(t<.9?Math.max(0,.9-t)*1.5:0);
      const fI=t>7.9?ease((t-7.9)/1.6):0; if(sI>0) flare(sx,sy,Math.min(1.6,sI)*(1-fI*.85),m*.55);
      if(fI>0){ cx.fillStyle='rgba(25,4,0,'+.62*fI+')'; cx.fillRect(0,0,w,hh); }
      // Flammen (ab 8.0s)
      if(t>7.9){
        const inten=ease((t-7.9)/1.6)*(t>9.7?Math.max(0,1-(t-9.7)/.7):1);
        const rate=Math.round(80*inten);
        for(let i=0;i<rate;i++){ fl.push({x:Math.random()*w,y:hh*(.99+Math.random()*.03),vx:(Math.random()-.5)*50*dpr,vy:-(120+Math.random()*320)*dpr*(.6+inten*.6),l:0,m:.9+Math.random()*.9,s:(8+Math.random()*20)*(w/700)}); }
        for(let i=0;i<Math.round(14*inten);i++){ const bx=w*(.12+Math.random()*.76), by=hh*(.34+Math.random()*.2); fl.push({x:bx,y:by,vx:(Math.random()-.5)*40*dpr,vy:-(60+Math.random()*160)*dpr,l:0,m:.5+Math.random()*.7,s:(8+Math.random()*16)*(w/700)}); }
        const hot=cx.createLinearGradient(0,hh,0,hh*.35); hot.addColorStop(0,'rgba(255,80,10,'+.28*inten+')'); hot.addColorStop(1,'rgba(255,60,0,0)'); cx.fillStyle=hot; cx.fillRect(0,0,w,hh);
      }
      if(fl.length){ cx.globalCompositeOperation='lighter';
        for(let i=fl.length-1;i>=0;i--){ const p=fl[i]; p.l+=dt; if(p.l>p.m){ fl.splice(i,1); continue; } p.x+=p.vx*dt+Math.sin(p.l*9+p.y*.02)*14*dt*dpr; p.y+=p.vy*dt; const k=p.l/p.m, a=(1-k)*.26, rad=p.s*(1-k*.5)*(w/(w))*1;
          const gg=cx.createRadialGradient(p.x,p.y,0,p.x,p.y,rad); const c=k<.15?'255,220,120':k<.5?'255,130,30':'190,40,10'; gg.addColorStop(0,'rgba('+c+','+a+')'); gg.addColorStop(1,'rgba('+c+',0)'); cx.fillStyle=gg; cx.beginPath(); cx.arc(p.x,p.y,rad,0,7); cx.fill(); }
        cx.globalCompositeOperation='source-over'; if(fl.length>1400) fl.splice(0,fl.length-1400); }
      // Aufprall-Blitze bei den Schlägen des Sounds
      let fx=0; for(let hi=1;hi<=(SH?0:8);hi++){ const d=rt-(.75+1.75*hi); if(d>=0&&d<.5) fx=Math.max(fx,(1-d/.5)*.45); } if(fx>0){ cx.fillStyle='rgba(255,245,225,'+fx*.7+')'; cx.fillRect(0,0,w,hh); }
      // Vignette
      const vg=cx.createRadialGradient(w/2,hh/2,m*.45,w/2,hh/2,Math.max(w,hh)*.75); vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.7)'); cx.fillStyle=vg; cx.fillRect(0,0,w,hh);
      if(t<10.4) raf=requestAnimationFrame(frame);
    }
    const au=new Audio(BASE+'sounds/intro.mp3'); au.preload='auto'; au.volume=1;
    A.splash=true; let done=false, began=false;
    const B=()=>window.ZBgm&&ZBgm.au;
    const duck=on=>{ try{ if(B()) B().muted=on; }catch(e){} };
    const finish=()=>{ if(done) return; done=true; cancelAnimationFrame(raf); o.classList.add('out'); try{ au.pause(); }catch(e){} duck(false); window.removeEventListener('resize',rs); setTimeout(()=>{ o.remove(); css.remove(); A.splash=false; try{ opt&&opt.onDone&&opt.onDone(); }catch(e){} },950); };
    const begin=()=>{ if(began) return; began=true; o.classList.add('go'); const tp=o.querySelector('.zs-tap'); if(tp) tp.style.display='none'; duck(true); t0=performance.now(); raf=requestAnimationFrame(frame); setTimeout(finish,DUR*1000); setTimeout(()=>{ try{ const iv=setInterval(()=>{ au.volume=Math.max(0,au.volume-.07); if(au.volume<=0) clearInterval(iv); },60); }catch(e){} },Math.max(0,(DUR-.9)*1000)); setTimeout(()=>{ o.onclick=finish; },1800); };
    let p; try{ p=au.play(); }catch(e){}
    if(p&&p.then) p.then(begin).catch(()=>{ if(SH){ begin(); return; } o.querySelector('.zs-tap').style.display='block'; const go=()=>{ if(began) return; try{ au.currentTime=0; au.play().catch(()=>{}); }catch(e){} begin(); }; o.addEventListener('pointerdown',go,{once:true}); setTimeout(()=>{ if(!began){ begin(); } },8000); });
    else begin();
  }
  A.playIntro=splash; /* v878: wird von intro.html gestartet (voll beim 1. Öffnen, 4 s danach) */
})();
