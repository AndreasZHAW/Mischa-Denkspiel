// ZWeather — Wetter im Zoo (ab Rebirth 1): Sonne, Regen, Wind. Zufällig (für alle gleich per Uhr), Admin kann es überschreiben. (v659)
(function(){
  'use strict';
  const TYPES={clear:{ic:'🌤️',n:'Klar'},sun:{ic:'☀️',n:'Sonne'},rain:{ic:'🌧️',n:'Regen'},wind:{ic:'💨',n:'Wind'}};
  const R=()=>{ try{ return (typeof _rtdb!=='undefined'&&_rtdb&&State._useCloud())?_rtdb:null; }catch(e){ return null; } };
  const rng=seed=>{ let a=seed>>>0; return ()=>{ a=(a+0x6D2B79F5)>>>0; let t=a; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }; };
  const W=window.ZWeather={
    TYPES, cur:{type:'clear',dir:0}, ovr:null, _inited:false, _last:null, _ui:null, _rain:null, _wind:null, _still:0, _lp:null,
    init(){ if(W._inited) return; const r=R(); if(!r) return; W._inited=true; try{ r.ref('zoo_weather').on('value',s=>{ W.ovr=s.val()||null; }); }catch(e){} },
    // Zufälliges Wetter: alle 8 Minuten neu, bei allen Spielern gleich
    _auto(){ const slot=Math.floor(Date.now()/480000), g=rng(slot*7919+13), r=g(); return {type:r<.25?'clear':r<.5?'sun':r<.75?'rain':'wind',dir:g()*Math.PI*2,auto:1}; },
    calc(){ const o=W.ovr; W.cur=(o&&o.until>Date.now()&&TYPES[o.type])?{type:o.type,dir:+o.dir||0,ovr:1,until:o.until}:W._auto(); return W.cur; },
    on(){ try{ if(typeof ZG==='undefined'||!ZG.scene||!ZG.cam||!ZS.zoo) return false; if(typeof rebHas==='function'&&!rebHas('weather')) return false; if(ZG._jumpActive||ZG._arcadeActive||ZG._mazeActive||ZG._trashActive||ZG._iceRoomActive) return false; return true; }catch(e){ return false; } },
    adminSet(type,dirRad,mins){ const r=R(); if(!r) return Promise.reject(new Error('Keine Cloud')); if(!type){ return r.ref('zoo_weather').remove(); } return r.ref('zoo_weather').set({type,dir:(dirRad==null?Math.random()*Math.PI*2:dirRad),until:Date.now()+Math.max(1,mins||10)*60000,by:ZS.player,id:Date.now()}); },
    _mkUI(){
      if(W._ui) return; const d=document.createElement('div'); d.id='zw-ui';
      d.innerHTML='<div id="zw-tint" style="position:fixed;inset:0;pointer-events:none;z-index:4;opacity:0;transition:opacity 1.5s"></div><div id="zw-sun" style="position:fixed;top:-20px;right:-20px;font-size:7rem;pointer-events:none;z-index:4;opacity:0;transition:opacity 1.5s;filter:drop-shadow(0 0 30px rgba(255,220,80,.9))">☀️</div>'
        +'<div id="zw-chip" style="position:fixed;left:8px;top:70px;z-index:600;background:rgba(0,0,0,.55);color:#fff;font:700 .72rem Arial;padding:4px 9px;border-radius:14px;display:none;align-items:center;gap:6px;pointer-events:none"><span id="zw-t"></span><span id="zw-ar" style="display:inline-block;font-size:1rem;color:#7fd0ff">➤</span></div>';
      document.body.appendChild(d); W._ui=d;
    },
    _mkRain(){
      if(W._rain) return; const N=520, pos=new Float32Array(N*6), dr=[]; for(let i=0;i<N;i++) dr.push({x:(Math.random()-.5)*50,y:Math.random()*24,z:(Math.random()-.5)*50});
      const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); const m=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0xa9d0ff,transparent:true,opacity:.65})); m.frustumCulled=false; m.visible=false; ZG.scene.add(m); W._rain={m,g,dr,N};
    },
    _mkWind(){
      if(W._wind) return; const N=110, pos=new Float32Array(N*6), dr=[]; for(let i=0;i<N;i++) dr.push({x:(Math.random()-.5)*60,y:.4+Math.random()*7,z:(Math.random()-.5)*60});
      const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); const m=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.45})); m.frustumCulled=false; m.visible=false; ZG.scene.add(m); W._wind={m,g,dr,N};
    },
    frame(dt){
      const c=W.cur, cam=ZG.cam.position, cx=cam.x, cz=cam.z;
      if(c.type==='rain'&&W._rain){ const q=W._rain, a=q.g.attributes.position.array; q.m.visible=true;
        q.dr.forEach((p,i)=>{ p.y-=30*dt; if(p.y<0){ p.y=22+Math.random()*3; p.x=cx+(Math.random()-.5)*50; p.z=cz+(Math.random()-.5)*50; } if(p.x-cx>25)p.x-=50; if(p.x-cx<-25)p.x+=50; if(p.z-cz>25)p.z-=50; if(p.z-cz<-25)p.z+=50; const o=i*6; a[o]=p.x; a[o+1]=p.y; a[o+2]=p.z; a[o+3]=p.x; a[o+4]=p.y+.9; a[o+5]=p.z; }); q.g.attributes.position.needsUpdate=true; } else if(W._rain) W._rain.m.visible=false;
      if(c.type==='wind'&&W._wind){ const q=W._wind, a=q.g.attributes.position.array, dx=Math.sin(c.dir), dz=Math.cos(c.dir); q.m.visible=true;
        q.dr.forEach((p,i)=>{ p.x+=dx*16*dt; p.z+=dz*16*dt; if(p.x-cx>30)p.x-=60; if(p.x-cx<-30)p.x+=60; if(p.z-cz>30)p.z-=60; if(p.z-cz<-30)p.z+=60; const o=i*6; a[o]=p.x; a[o+1]=p.y; a[o+2]=p.z; a[o+3]=p.x-dx*2.6; a[o+4]=p.y; a[o+5]=p.z-dz*2.6; }); q.g.attributes.position.needsUpdate=true; } else if(W._wind) W._wind.m.visible=false;
    },
    _step(){
      const now=performance.now(), dt=Math.min(.1,(now-(W._tt||now))/1000); W._tt=now;
      const ui=W._ui; if(!W.on()){ if(ui){ ui.querySelector('#zw-chip').style.display='none'; ui.querySelector('#zw-tint').style.opacity=0; ui.querySelector('#zw-sun').style.opacity=0; } if(W._rain) W._rain.m.visible=false; if(W._wind) W._wind.m.visible=false; return; }
      W.init(); W._mkUI(); W._mkRain(); W._mkWind(); const c=W.calc(), T=TYPES[c.type];
      const tint=W._ui.querySelector('#zw-tint'), sun=W._ui.querySelector('#zw-sun'), chip=W._ui.querySelector('#zw-chip');
      tint.style.background=c.type==='rain'?'rgba(45,65,100,.28)':c.type==='sun'?'radial-gradient(circle at 90% 0%,rgba(255,220,100,.28),rgba(255,200,80,.06) 60%)':c.type==='wind'?'rgba(200,210,220,.06)':'transparent'; tint.style.opacity=(c.type==='clear')?0:1;
      sun.style.opacity=c.type==='sun'?1:0; chip.style.display='flex'; W._ui.querySelector('#zw-t').textContent=T.ic+' '+T.n+(c.ovr?' (Admin)':'');
      const ar=W._ui.querySelector('#zw-ar'); if(c.type==='wind'){ const dx=Math.sin(c.dir), dz=Math.cos(c.dir); let rel=Math.atan2(-dx,-dz)-ZG.yaw; rel=((rel+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI; ar.style.display='inline-block'; ar.style.transform='rotate('+(-rel*180/Math.PI-90)+'deg)'; } else ar.style.display='none';
      W.frame(dt);
      // Wind: wer stehen bleibt, wird in Windrichtung gepustet
      if(c.type==='wind'){ const p=ZG.pl, L=W._lp; W._lp={x:p.x,z:p.z}; const mv=L?Math.hypot(p.x-L.x,p.z-L.z):0; W._still=(mv<0.02)?(W._still+dt):0;
        const blocked=(typeof ZHearts!=='undefined'&&ZHearts.dead)||ZG._spaceActive; if(W._still>0.35&&!blocked){ const dx=Math.sin(c.dir), dz=Math.cos(c.dir), sp=2.4*dt; p.x+=dx*sp; p.z+=dz*sp; try{ if(window.ZBases&&ZBases.collide) ZBases.collide(p); }catch(e){} const d=Math.hypot(p.x,p.z); if(ZG.WR&&d>ZG.WR-3){ const a=Math.atan2(p.x,p.z); p.x=Math.sin(a)*(ZG.WR-3); p.z=Math.cos(a)*(ZG.WR-3); } W._lp={x:p.x,z:p.z}; W._still=0.4; } }
    }
  };
  setInterval(()=>{ try{ W._step(); }catch(e){} },33);
})();
