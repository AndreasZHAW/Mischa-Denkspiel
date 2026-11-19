/* ZFindChest (v834): seltene Schatzkiste (3D-Modell) irgendwo im Zoo – finden, antippen, Deckel klappt auf, gratis Belohnung */
(function(){
  'use strict';
  if(window.ZFindChest) return;
  const FC=window.ZFindChest={objs:[],busy:false,near:null};
  Object.defineProperty(FC,'obj',{get(){ return FC.objs[0]||null; }});
  const MIN=60*1000;
  const SEAM=-0.06, HX=0, HZ=-0.55, SC=1.7;
  const b64=(s,T)=>{ const bin=atob(s), u=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i); return new T(u.buffer); };
  function loadData(){ return new Promise(res=>{ if(window.ZCHEST) return res(window.ZCHEST); const s=document.createElement('script'); s.src='zchest_data.js?v='+(typeof APP_VERSION!=='undefined'?APP_VERSION:'1'); s.onload=()=>res(window.ZCHEST); s.onerror=()=>res(null); document.head.appendChild(s); }); }
  function geo(part,q){ const g=new THREE.BufferGeometry(); const p=b64(part.p,Int16Array), u=b64(part.u,Uint16Array), i=b64(part.i,Uint16Array);
    const pos=new Float32Array(p.length); for(let k=0;k<p.length;k++) pos[k]=p[k]/q; const uv=new Float32Array(u.length); for(let k=0;k<u.length;k++) uv[k]=u[k]/65535;
    g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.BufferAttribute(uv,2)); g.setIndex(new THREE.BufferAttribute(i,1)); return g; }
  const glowTex=()=>{ if(FC._gt) return FC._gt; const c=document.createElement('canvas'); c.width=c.height=64; const g=c.getContext('2d'); const r=g.createRadialGradient(32,32,2,32,32,32); r.addColorStop(0,'rgba(255,240,170,1)'); r.addColorStop(.4,'rgba(255,200,70,.55)'); r.addColorStop(1,'rgba(255,190,50,0)'); g.fillStyle=r; g.fillRect(0,0,64,64); return FC._gt=new THREE.CanvasTexture(c); };
  async function build(){
    const D=await loadData(); if(!D) return null;
    const tex=await new Promise(res=>{ new THREE.TextureLoader().load(D.tex,t=>res(t),undefined,()=>res(null)); });
    if(tex){ tex.flipY=false; try{ tex.anisotropy=4; }catch(e){} }
    const mat=new THREE.MeshBasicMaterial({map:tex||null,color:tex?0xffffff:0x8a5a1a,side:THREE.DoubleSide});
    mat.color.setScalar(1.45);
    const root=new THREE.Group(), model=new THREE.Group(); root.add(model); model.scale.setScalar(SC); model.position.y=0.612*SC;
    const body=new THREE.Mesh(geo(D.body,D.q),mat); model.add(body);
    const hinge=new THREE.Group(); hinge.position.set(HX,SEAM,HZ); model.add(hinge);
    const lid=new THREE.Mesh(geo(D.lid,D.q),mat); lid.position.set(-HX,-SEAM,-HZ); hinge.add(lid);
    // Innenleuchten (unsichtbar bis geöffnet)
    const inner=new THREE.Mesh(new THREE.PlaneGeometry(1.5,.95),new THREE.MeshBasicMaterial({map:glowTex(),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:0})); inner.rotation.x=-Math.PI/2; inner.position.set(0,SEAM+.01,0); model.add(inner);
    const beam=new THREE.Mesh(new THREE.CylinderGeometry(.55,.9,1,16,1,true),new THREE.MeshBasicMaterial({color:0xffe28a,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide})); beam.position.set(0,SEAM+1,0); model.add(beam);
    // Fernlicht-Säule + Funkeln
    const pil=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,60,10,1,true),new THREE.MeshBasicMaterial({color:0xffe28a,transparent:true,opacity:.22,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide})); pil.position.y=30; root.add(pil);
    const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false})); halo.scale.set(9,9,1); halo.position.y=1.8; root.add(halo);
    const lbl=ZG._txt?ZG._txt('✨ Schatzkiste ✨',.6,'#ffe28a'):null; if(lbl){ lbl.position.y=5.6; lbl.scale.set(7,1.8,1); root.add(lbl); }
    const sparks=[]; for(let i=0;i<10;i++){ const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:0})); s.scale.set(.5,.5,1); root.add(s); sparks.push({s,a:Math.random()*6.28,r:.8+Math.random()*1.8,y:Math.random()*3,v:.6+Math.random()}); }
    return {root,model,hinge,inner,beam,pil,halo,sparks,mat};
  }
  // Positionswahl: auf dem Rasen, weit weg von bekannten Orten
  function pickSpot(){
    let pois=[]; try{ pois=ZG._mapPois(); }catch(e){}
    pois.push({x:0,z:0},{x:0,z:55},{x:0,z:30},{x:-42,z:10});
    for(let n=0;n<60;n++){ const a=Math.random()*Math.PI*2, r=45+Math.random()*115; const x=Math.cos(a)*r, z=55+Math.sin(a)*r;
      if(Math.hypot(x,z-55)>150) continue;
      if(pois.some(p=>Math.hypot(p.x-x,p.z-z)<24)) continue;
      return {x,z}; }
    return {x:70,z:100};
  }
  FC.spawn=async function(force){
    if((!force&&FC.objs.length)||FC.objs.length>=12||FC.busy||typeof ZG==='undefined'||!ZG.scene||typeof THREE==='undefined') return false;
    FC.busy=true;
    try{ const o=await build(); if(!o){ FC.busy=false; return false; } const sp=force&&force.x!=null?force:pickSpot(); o.root.position.set(sp.x,0,sp.z); o.root.rotation.y=Math.random()*6.28; ZG.scene.add(o.root); o.x=sp.x; o.z=sp.z; o.born=Date.now(); o.state='idle'; FC.objs.push(o);
      if(!force){ try{ ZP.toast('✨ Irgendwo im Zoo ist eine Schatzkiste aufgetaucht! Such das Licht…',5000); }catch(e){} }
    }catch(e){ console.warn('ZFindChest',e); }
    FC.busy=false; return true; };
  FC.remove=function(o){ o=o||FC.obj; if(!o) return; try{ ZG.scene.remove(o.root); o.root.traverse(m=>{ if(m.geometry) m.geometry.dispose(); }); }catch(e){} FC.objs=FC.objs.filter(x=>x!==o); if(FC.near===o){ FC.near=null; FC._hidePrompt(); } };
  FC.clearAll=function(){ FC.objs.slice().forEach(o=>FC.remove(o)); };
  // ── Animation pro Frame ──
  function ease(x){ return x<0?0:x>1?1:1-Math.pow(1-x,3); }
  function tick(){ FC.objs.slice().forEach(tickOne); }
  function tickOne(o){
    const t=performance.now()/1000;
    o.halo.material.opacity=(o.state==='open'?.3:.55)+.2*Math.sin(t*3); o.model.position.y=0.612*SC+(o.state==='idle'?Math.sin(t*2)*.05:0);
    if(o.state==='idle'){ o.sparks.forEach(p=>{ const a=p.a+t*.6; p.s.position.set(Math.cos(a)*p.r,((p.y+t*p.v*.5)%3.2)+.3,Math.sin(a)*p.r); p.s.material.opacity=.5+.4*Math.sin(t*4+p.a); }); }
    if(o.state==='open'){
      const e=(performance.now()-o.t0)/1000;
      const shake=Math.max(0,1-e/.7); o.root.rotation.z=Math.sin(e*55)*.05*shake; o.root.rotation.x=Math.cos(e*47)*.035*shake;
      const lidE=ease((e-.6)/.9), over=lidE>0?Math.sin(Math.min(1,(e-.6)/.9)*Math.PI)*.12:0;
      o.hinge.rotation.x=-(1.95*lidE+over);
      const lit=ease((e-.8)/.7); o.inner.material.opacity=.7*lit; o.beam.material.opacity=.2*lit; o.beam.scale.set(.5+lit*.3,1+lit*6,.5+lit*.3); o.beam.position.y=SEAM+(1+lit*6)/2;
      o.sparks.forEach(p=>{ const a=p.a+t*3; const k=Math.max(0,e-.9); p.s.position.set(Math.cos(a)*p.r*(.4+k*.6),.3+k*p.v*3.2,Math.sin(a)*p.r*(.4+k*.6)); p.s.material.opacity=Math.min(1,k*2)*(.7+.3*Math.sin(t*9+p.a)); p.s.scale.setScalar(.5+.4*Math.sin(t*6+p.a)); });
      o.halo.scale.setScalar(9+lit*2);
      if(e>2.0&&!o.revealed){ o.revealed=true; FC._reveal(); }
      if(e>3.2){ FC.remove(o); }
    } else if(!o.keep&&Date.now()-o.born>7*MIN){ FC.remove(o); }
  }
  FC._reveal=function(){
    try{
      const RC=window.RewardChests; const w=Math.random()*100; const ri=w<38?0:w<72?1:w<92?2:w<99?3:4; const q=1.2+Math.random()*1.3;
      document.getElementById('chest-anim')?.remove(); const ov=document.createElement('div'); ov.id='chest-anim';
      ov.style.cssText='position:fixed;inset:0;z-index:99975;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Arial,sans-serif;color:#fff;text-align:center;padding:20px';
      document.body.appendChild(ov);
      RC._animState={tier:{min:-1,q:q,name:'SCHATZKISTE'},isHell:false,rarityIdx:ri,clicks:5,reward:null};
      RC._revealReward();
      const ttl=ov.firstElementChild; try{ const t=ov.querySelector('div[style*="margin-bottom:14px"]'); if(t) t.textContent='🗝️ SCHATZKISTE GEFUNDEN! 🗝️'; }catch(e){}
    }catch(e){ console.warn('ZFindChest reveal',e); try{ ZP.toast('🎁 Schatzkiste geöffnet!',3000); }catch(_){} }
  };
  FC.open=function(o){ o=(o&&o.root)?o:FC.near; if(!o||o.state!=='idle') return; o.state='open'; o.t0=performance.now(); o.pil.material.opacity=.0; FC._hidePrompt(); if(!o.admin) FC._store(); try{ ZSound&&ZSound.play&&ZSound.play('chest'); }catch(e){} };
  FC._store=function(){ try{ localStorage.setItem('zfc_next',String(Date.now()+(25+Math.random()*35)*MIN)); }catch(e){} };
  // ── Nähe-Prompt (eigenes Element, unabhängig von der Haupt-Anzeige) ──
  FC._prompt=function(){ let p=document.getElementById('fc-prompt'); if(!p){ p=document.createElement('div'); p.id='fc-prompt'; p.style.cssText='position:fixed;bottom:30%;left:50%;transform:translateX(-50%);z-index:900;background:linear-gradient(135deg,#FFD700,#FF8C00);color:#1a1a2e;border:2px solid #fff;border-radius:50px;padding:10px 22px;font:900 1rem Arial;box-shadow:0 0 22px rgba(255,200,60,.8);cursor:pointer;display:none;animation:fcPulse 1.1s ease-in-out infinite';
    p.textContent=('ontouchstart' in window?'👆':'[E]')+' Schatzkiste öffnen!'; p.onclick=ev=>{ ev.stopPropagation(); FC.open(); }; p.addEventListener('touchend',ev=>{ ev.preventDefault(); ev.stopPropagation(); FC.open(); },{passive:false}); document.body.appendChild(p);
    const st=document.createElement('style'); st.textContent='@keyframes fcPulse{0%,100%{transform:translateX(-50%) scale(1)}50%{transform:translateX(-50%) scale(1.08)}}'; document.head.appendChild(st); } return p; };
  FC._showPrompt=function(){ FC._prompt().style.display='block'; }; FC._hidePrompt=function(){ const p=document.getElementById('fc-prompt'); if(p) p.style.display='none'; };
  function checkNear(){ let best=null,bd=7; if(typeof ZG!=='undefined'&&ZG.pl) FC.objs.forEach(o=>{ if(o.state!=='idle') return; const d=Math.hypot(ZG.pl.x-o.x,ZG.pl.z-o.z); if(d<bd){ bd=d; best=o; } }); FC.near=best; if(best) FC._showPrompt(); else FC._hidePrompt(); }
  // Spawn-Plan: selten – alle ~25–60 Min, erste frühestens nach ~6 Min
  function plan(){
    if(FC.objs.length||FC.busy) return;
    if(typeof ZG==='undefined'||!ZG.scene||!ZG.pl||!window.ZS||!ZS.zoo) return;
    let next=0; try{ next=parseInt(localStorage.getItem('zfc_next')||'0')||0; }catch(e){}
    if(!next){ next=Date.now()+(6+Math.random()*10)*MIN; try{ localStorage.setItem('zfc_next',String(next)); }catch(e){} }
    if(Date.now()>=next && !document.getElementById('chest-anim')){ FC.spawn().then(ok=>{ if(ok) FC._store(); }); }
  }
  function loop(){ try{ tick(); }catch(e){} requestAnimationFrame(loop); }
  function init(){
    loop(); setInterval(checkNear,250); setInterval(plan,15000);
    document.addEventListener('keydown',e=>{ if(e.code==='KeyE'&&FC.near) FC.open(); });
    document.addEventListener('click',e=>{ if(FC.near&&e.target&&e.target.id==='zc') FC.open(); });
  FC.spawnMany=async function(n,around){ const c=around||{x:ZG.pl.x,z:ZG.pl.z}; for(let i=0;i<n;i++){ const a=(i/n)*Math.PI*2, r=n>1?9+(i%2)*4:9; const o=await FC.spawn({x:c.x+Math.cos(a)*r,z:c.z+Math.sin(a)*r}); if(FC.objs.length) { const x=FC.objs[FC.objs.length-1]; x.admin=true; x.keep=true; } } return FC.objs.length; };
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
