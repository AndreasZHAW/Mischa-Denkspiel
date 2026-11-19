/* ZStarter (v839): 🎁 Starterpaket – nach dem Tutorial: 5 Min. Zeit für 1 weiteres Tier kaufen ODER 1 Tier vergolden */
(function(){
  'use strict';
  if(window.ZStarter) return;
  const LIM=5*60*1000;
  const S=window.ZStarter={};
  const zoo=()=>{ try{ return ZS.zoo; }catch(e){ return null; } };
  const animals=z=>(z.enc||[]).filter(e=>e&&e.animal).length;
  const golds=z=>Object.values(z.upgrades||{}).filter(u=>u&&u.tier>=1).length;
  const save=()=>{ try{ ZS.save&&ZS.save(); }catch(e){} };
  let el=null, iv=null;
  S.start=function(force){
    const z=zoo(); if(!z) return;
    if(z.starter&&!force) return;
    z.starter={t0:Date.now(),a:animals(z),g:golds(z),st:'run'}; save(); S._run();
  };
  function bar(){
    if(el) return el; el=document.createElement('div'); el.id='z-starter';
    el.style.cssText='position:fixed;top:calc(8px + env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);z-index:9500;max-width:94vw;background:linear-gradient(135deg,#8e24aa,#ff8f00);color:#fff;border:2px solid #ffe082;border-radius:14px;padding:8px 14px;font-weight:800;font-size:.82rem;text-align:center;box-shadow:0 4px 18px rgba(0,0,0,.5);pointer-events:none;line-height:1.3';
    document.body.appendChild(el); return el;
  }
  function popup(html){
    const o=document.createElement('div'); o.style.cssText='position:fixed;inset:0;z-index:99990;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;padding:18px';
    o.innerHTML='<div style="background:linear-gradient(135deg,#2a1240,#4a1f00);border:3px solid #ffd54f;border-radius:20px;padding:22px;max-width:360px;width:100%;text-align:center;color:#fff;box-shadow:0 0 40px rgba(255,170,0,.5)">'+html+'<button style="margin-top:16px;background:linear-gradient(135deg,#FFD700,#FF8C00);border:none;border-radius:12px;padding:12px 34px;font-weight:900;font-size:1.05rem;cursor:pointer;color:#1a1a2e">Super! ➜</button></div>';
    o.querySelector('button').onclick=()=>o.remove(); document.body.appendChild(o);
  }
  function reward(z){
    z.starter.st='done'; save();
    const RC=window.RewardChests; let bonus=Math.max(100,Math.round((z.mt||0)*0.1));
    try{ z.mt=(z.mt||0)+bonus; }catch(e){}
    try{ if(RC&&RC._pending){ RC._pending('spins',3); RC._pending('treats',5); RC._pending('freeGold',1); RC._pending('boostCoin3',1); RC._pending('boostSpeed5',1); } }catch(e){}
    try{ ZG._updHUD&&ZG._updHUD(); }catch(e){} save();
    popup('<div style="font-size:3.2rem">🎁</div><div style="font-size:1.4rem;font-weight:900;color:#ffd54f;margin:6px 0">STARTERPAKET!</div><div style="font-size:.95rem;line-height:1.7">🪙 +'+bonus+' MT<br>🎡 3 Gratis-Drehungen<br>🍬 5 Leckerli<br>⚗️ 1 Gold-Gutschein<br>💰 Einkommen ×3 (10 Min.)<br>👟 Speed-Boost (5 Min.)</div>');
  }
  S._run=function(){
    if(iv) clearInterval(iv);
    iv=setInterval(()=>{
      const z=zoo(); if(!z||!z.starter||z.starter.st!=='run'){ if(el){ el.remove(); el=null; } clearInterval(iv); iv=null; return; }
      const st=z.starter, left=LIM-(Date.now()-st.t0);
      if(animals(z)>st.a||golds(z)>st.g){ if(el){ el.remove(); el=null; } clearInterval(iv); iv=null; reward(z); return; }
      if(left<=0){ st.st='expired'; save(); if(el){ el.remove(); el=null; } clearInterval(iv); iv=null; try{ ZP.toast('⏰ Das Starterpaket ist abgelaufen …',4500); }catch(e){} return; }
      const m=Math.floor(left/60000), s=Math.floor(left/1000)%60;
      const b=bar(); b.innerHTML='🎁 <b>STARTERPAKET</b> · Kaufe 1 weiteres Tier <b>ODER</b> vergolde 1 Tier<br>⏱️ '+m+':'+String(s).padStart(2,'0')+(left<60000?' 🔥':'');
      if(left<60000) b.style.background='linear-gradient(135deg,#c62828,#ff6f00)';
    },1000);
  };
  // nach Reload / Login: laufende Mission fortsetzen
  setInterval(()=>{ try{ const z=zoo(); if(z&&z.starter&&z.starter.st==='run'&&!iv&&document.getElementById('s-zoo')&&getComputedStyle(document.getElementById('s-zoo')).display!=='none') S._run(); }catch(e){} },3000);
})();
