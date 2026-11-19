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
  /* ── Intro-Szene ── */
  function splash(){
    try{ if(sessionStorage.getItem('zsplash')) return; sessionStorage.setItem('zsplash','1'); }catch(e){}
    const css=document.createElement('style');
    css.textContent='#z-splash{position:fixed;inset:0;z-index:2147483000;background:radial-gradient(ellipse at 50% 45%,#1b3560 0%,#070d1c 70%);display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;transition:opacity .8s;font-family:inherit;user-select:none}'
    +'#z-splash.out{opacity:0;pointer-events:none}'
    +'#z-splash .zs-ray{position:absolute;left:50%;top:45%;width:160vmax;height:160vmax;margin:-80vmax 0 0 -80vmax;background:repeating-conic-gradient(from 0deg,rgba(255,213,79,.0) 0 9deg,rgba(255,213,79,.13) 9deg 18deg);border-radius:50%;opacity:0;-webkit-mask:radial-gradient(circle,#000 0,transparent 55%);mask:radial-gradient(circle,#000 0,transparent 55%)}'
    +'#z-splash.go .zs-ray{animation:zsRay 6s linear forwards}'
    +'@keyframes zsRay{0%{opacity:0;transform:rotate(0)}8%{opacity:1}100%{opacity:.8;transform:rotate(60deg)}}'
    +'#z-splash .zs-ring{position:absolute;left:50%;top:45%;width:20px;height:20px;margin:-10px;border:4px solid #ffd54f;border-radius:50%;opacity:0}'
    +'#z-splash.go .zs-ring{animation:zsRing 1.1s ease-out .4s forwards}#z-splash.go .zs-ring.b{animation:zsRing 1.4s ease-out .85s forwards}'
    +'@keyframes zsRing{0%{opacity:.9;transform:scale(1)}100%{opacity:0;transform:scale(60)}}'
    +'#z-splash .zs-logo{position:relative;font-size:min(34vw,170px);line-height:1;opacity:0;transform:scale(5) rotate(-14deg);filter:drop-shadow(0 8px 24px rgba(0,0,0,.6))}'
    +'#z-splash.go .zs-logo{animation:zsSlam .45s cubic-bezier(.2,1.4,.4,1) .35s forwards,zsBeat .42s ease-in-out 1.2s infinite}'
    +'@keyframes zsSlam{0%{opacity:0;transform:scale(5) rotate(-14deg)}60%{opacity:1;transform:scale(.85) rotate(3deg)}100%{opacity:1;transform:scale(1) rotate(0)}}'
    +'@keyframes zsBeat{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}'
    +'#z-splash .zs-t{position:relative;margin-top:14px;font-size:min(10vw,52px);font-weight:900;letter-spacing:.04em;color:#fff;text-shadow:0 0 18px #ffb300,0 4px 0 #8a4b00;opacity:0;transform:translateY(30px) scale(.8)}'
    +'#z-splash.go .zs-t{animation:zsT .5s cubic-bezier(.2,1.3,.4,1) 1.0s forwards}'
    +'#z-splash .zs-s{position:relative;margin-top:6px;font-size:min(4.2vw,18px);color:#9fd0ff;letter-spacing:.18em;opacity:0}'
    +'#z-splash.go .zs-s{animation:zsT .6s ease-out 1.7s forwards}'
    +'@keyframes zsT{to{opacity:1;transform:none}}'
    +'#z-splash .zs-an{position:absolute;font-size:min(9vw,44px);opacity:0}'
    +'#z-splash.go .zs-an{animation:zsAn 1.3s ease-out forwards}'
    +'@keyframes zsAn{0%{opacity:0;transform:translateY(40px) scale(.4)}25%{opacity:1}100%{opacity:0;transform:translateY(-70px) scale(1.1) rotate(var(--r))}}'
    +'#z-splash .zs-tap{position:relative;margin-top:26px;color:#ffd54f;font-weight:800;font-size:1rem;animation:zsBeat 1s infinite;opacity:.95}'
    +'#z-splash.go.shake{animation:zsShake .5s .35s}@keyframes zsShake{0%,100%{transform:none}20%{transform:translate(-8px,5px)}40%{transform:translate(7px,-6px)}60%{transform:translate(-5px,4px)}80%{transform:translate(4px,-3px)}}';
    document.head.appendChild(css);
    const o=document.createElement('div'); o.id='z-splash'; o.className='shake';
    const an=['🐘','🦁','🐧','🦒','🐼','🐵','🦊','🐸'];
    let h='<div class="zs-ray"></div><div class="zs-ring"></div><div class="zs-ring b"></div>';
    an.forEach((e,i)=>{ const x=(i/(an.length-1)*84-42); h+='<div class="zs-an" style="left:calc(50% + '+x+'vw*0.9 - .6em);bottom:12%;--r:'+((i%2?1:-1)*(8+i*3))+'deg;animation-delay:'+(1.2+i*.42)+'s">'+e+'</div>'; });
    h+='<div class="zs-logo">🦁</div><div class="zs-t">Mischa Zoo 3D</div><div class="zs-s">MISCHATALER · MULTIPLAYER</div><div class="zs-tap" style="display:none">👆 Tippen zum Starten</div>';
    o.innerHTML=h; document.body.appendChild(o);
    const au=new Audio(BASE+'sounds/intro.mp3'); au.preload='auto'; au.volume=1;
    A.splash=true; let done=false, began=false;
    const B=()=>window.ZBgm&&ZBgm.au;
    const duck=on=>{ try{ if(B()) B().muted=on; }catch(e){} };
    const finish=()=>{ if(done) return; done=true; o.classList.add('out'); try{ au.pause(); }catch(e){} duck(false); setTimeout(()=>{ o.remove(); css.remove(); A.splash=false; },900); };
    const begin=()=>{ if(began) return; began=true; o.classList.add('go'); const t=o.querySelector('.zs-tap'); if(t) t.style.display='none'; duck(true); setTimeout(finish,6400); setTimeout(()=>{ o.onclick=finish; },1500); };
    let p; try{ p=au.play(); }catch(e){}
    if(p&&p.then) p.then(begin).catch(()=>{ o.querySelector('.zs-tap').style.display='block'; const go=()=>{ if(began) return; try{ au.currentTime=0; au.play().catch(()=>{}); }catch(e){} begin(); }; o.addEventListener('pointerdown',go,{once:true}); o.addEventListener('keydown',go,{once:true}); setTimeout(()=>{ if(!began){ begin(); } },8000); });
    else begin();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',splash); else splash();
})();
