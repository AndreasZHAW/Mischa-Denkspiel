// ZWeather — Wetter im Zoo (ab Rebirth 1): Sonne, Regen, Sturm (mit Blitzen, 3 ❤ Schaden). Zufällig (für alle gleich per Uhr), Admin kann es überschreiben. (v659)
(function(){
  'use strict';
  const TYPES={clear:{ic:'🌤️',n:'Klar'},sun:{ic:'☀️',n:'Sonne'},rain:{ic:'🌧️',n:'Regen'},storm:{ic:'⛈️',n:'STURM'}};
  const R=()=>{ try{ return (typeof _rtdb!=='undefined'&&_rtdb&&State._useCloud())?_rtdb:null; }catch(e){ return null; } };
  const rng=seed=>{ let a=seed>>>0; return ()=>{ a=(a+0x6D2B79F5)>>>0; let t=a; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }; };
  const W=window.ZWeather={
    TYPES, cur:{type:'clear',dir:0}, ovr:null, _inited:false, _last:null, _ui:null, _rain:null, _strikes:[], _nextStrike:0,
    init(){ if(W._inited) return; const r=R(); if(!r) return; W._inited=true; try{ r.ref('zoo_weather').on('value',s=>{ W.ovr=s.val()||null; }); }catch(e){} },
    // Zufälliges Wetter: alle 8 Minuten neu, bei allen Spielern gleich
    _auto(){ const slot=Math.floor(Date.now()/480000), g=rng(slot*7919+13), r=g(); return {type:r<.3?'clear':r<.6?'sun':r<.85?'rain':'storm',dir:g()*Math.PI*2,auto:1}; },
    calc(){ const o=W.ovr; W.cur=(o&&o.until>Date.now()&&TYPES[o.type])?{type:o.type,dir:+o.dir||0,ovr:1,until:o.until}:W._auto(); return W.cur; },
    on(){ try{ if(typeof ZG==='undefined'||!ZG.scene||!ZG.cam||!ZS.zoo) return false; if(typeof rebHas==='function'&&!rebHas('weather')&&!(W.ovr&&W.ovr.type==='storm'&&W.ovr.until>Date.now())) return false; if(ZG._jumpActive||ZG._arcadeActive||ZG._mazeActive||ZG._trashActive||ZG._iceRoomActive) return false; return true; }catch(e){ return false; } },
    adminSet(type,dirRad,mins){ const r=R(); if(!r) return Promise.reject(new Error('Keine Cloud')); if(!type){ return r.ref('zoo_weather').remove(); } return r.ref('zoo_weather').set({type,dir:(dirRad==null?Math.random()*Math.PI*2:dirRad),until:Date.now()+Math.max(1,mins||10)*60000,by:ZS.player,id:Date.now()}); },
    _mkUI(){
      if(W._ui) return; const d=document.createElement('div'); d.id='zw-ui';
      d.innerHTML='<div id="zw-tint" style="position:fixed;inset:0;pointer-events:none;z-index:4;opacity:0;transition:opacity 1.5s"></div><div id="zw-sun" style="position:fixed;top:-20px;right:-20px;font-size:7rem;pointer-events:none;z-index:4;opacity:0;transition:opacity 1.5s;filter:drop-shadow(0 0 30px rgba(255,220,80,.9))">☀️</div>'
        +'<div id="zw-chip" style="position:fixed;left:8px;top:70px;z-index:600;background:rgba(0,0,0,.55);color:#fff;font:700 .72rem Arial;padding:4px 9px;border-radius:14px;display:none;align-items:center;gap:6px;pointer-events:none"><span id="zw-t"></span></div>';
      document.body.appendChild(d); W._ui=d;
    },
    _mkRain(){
      if(W._rain) return; const N=520, pos=new Float32Array(N*6), dr=[]; for(let i=0;i<N;i++) dr.push({x:(Math.random()-.5)*50,y:Math.random()*24,z:(Math.random()-.5)*50});
      const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); const m=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0xa9d0ff,transparent:true,opacity:.65})); m.frustumCulled=false; m.visible=false; ZG.scene.add(m); W._rain={m,g,dr,N};
    },
    // ⚡ Blitze: Warnkreis am Boden (1,2 s), dann Einschlag. Wer im Kreis steht: 3 Herzen Schaden + „BLITZ"
    _flash(op){ let f=document.getElementById('zw-bolt'); if(!f){ f=document.createElement('div'); f.id='zw-bolt'; f.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:5;background:#fff;opacity:0'; document.body.appendChild(f); } f.style.transition='none'; f.style.opacity=op; setTimeout(()=>{ f.style.transition='opacity .5s'; f.style.opacity=0; },60); },
    _thunder(delay,vol){ setTimeout(()=>{ try{ const A=window.AudioContext||window.webkitAudioContext; if(!A) return; const c=W._ac=W._ac||new A(); const n=c.sampleRate*1.8, b=c.createBuffer(1,n,c.sampleRate), d=b.getChannelData(0); for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.2); const s=c.createBufferSource(); s.buffer=b; const lp=c.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=380; const g=c.createGain(); g.gain.value=vol; s.connect(lp); lp.connect(g); g.connect(c.destination); s.start(); }catch(e){} },delay); },
    _mkBolt(x,z){
      const g=new THREE.Group(), pts=[]; let px=x, pz=z; for(let i=0;i<=9;i++){ const y=36-i*4; pts.push(new THREE.Vector3(px,Math.max(0,y),pz)); px=x+(i<9?(Math.random()-.5)*5:0); pz=z+(i<9?(Math.random()-.5)*5:0); }
      for(let i=0;i<9;i++){ const a=pts[i], b=pts[i+1], len=a.distanceTo(b); [[.13,0xffffff,1],[.45,0xbfd8ff,.35]].forEach(([r,col,op])=>{ const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,5),new THREE.MeshBasicMaterial({color:col,transparent:op<1,opacity:op,depthWrite:false})); m.position.copy(a).add(b).multiplyScalar(.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize()); g.add(m); }); }
      const gl=new THREE.Mesh(new THREE.CircleGeometry(3.2,16),new THREE.MeshBasicMaterial({color:0xcfe4ff,transparent:true,opacity:.8,depthWrite:false})); gl.rotation.x=-Math.PI/2; gl.position.set(x,.1,z); g.add(gl); return g;
    },
    _strikeTick(dt){
      const now=performance.now(), p=ZG.pl;
      if(now>=W._nextStrike){ W._nextStrike=now+1100+Math.random()*2200;
        const near=Math.random()<.35, R=near?9:34, a=Math.random()*Math.PI*2, d=Math.sqrt(Math.random())*R; const x=p.x+Math.cos(a)*d, z=p.z+Math.sin(a)*d;
        const ring=new THREE.Mesh(new THREE.RingGeometry(1.7,2.5,24),new THREE.MeshBasicMaterial({color:0xfff176,transparent:true,opacity:.9,side:THREE.DoubleSide,depthWrite:false})); ring.rotation.x=-Math.PI/2; ring.position.set(x,.1,z); ZG.scene.add(ring);
        W._strikes.push({x,z,at:now+1200,ring,bolt:null,end:0}); }
      for(let i=W._strikes.length-1;i>=0;i--){ const s=W._strikes[i];
        if(!s.bolt){ s.ring.material.opacity=.45+.45*Math.abs(Math.sin(now/90)); s.ring.scale.setScalar(1+.12*Math.sin(now/110));
          if(now>=s.at){ ZG.scene.remove(s.ring); s.bolt=W._mkBolt(s.x,s.z); ZG.scene.add(s.bolt); s.end=now+380; const dist=Math.hypot(p.x-s.x,p.z-s.z); W._flash(Math.max(.2,.8-dist/60)); W._thunder(Math.min(1200,dist*18),Math.max(.15,.6-dist/80));
            if(dist<2.7&&!(typeof ZHearts!=='undefined'&&ZHearts.dead)){ try{ ZHearts.hit(3,{name:'Blitz',guard:true}); }catch(e){} try{ ZG._bigText('⚡ BLITZ!','#ffee58',2000); ZP.toast('⚡ BLITZ! −3 ❤',3500); }catch(e){} } } }
        else if(now>=s.end){ ZG.scene.remove(s.bolt); W._strikes.splice(i,1); } }
    },
    _clearStrikes(){ W._strikes.forEach(s=>{ try{ ZG.scene.remove(s.ring); if(s.bolt) ZG.scene.remove(s.bolt); }catch(e){} }); W._strikes=[]; },
    frame(dt){
      const c=W.cur, cam=ZG.cam.position, cx=cam.x, cz=cam.z;
      if((c.type==='rain'||c.type==='storm')&&W._rain){ const q=W._rain, a=q.g.attributes.position.array; q.m.visible=true;
        q.dr.forEach((p,i)=>{ p.y-=30*dt; if(p.y<0){ p.y=22+Math.random()*3; p.x=cx+(Math.random()-.5)*50; p.z=cz+(Math.random()-.5)*50; } if(p.x-cx>25)p.x-=50; if(p.x-cx<-25)p.x+=50; if(p.z-cz>25)p.z-=50; if(p.z-cz<-25)p.z+=50; const o=i*6; a[o]=p.x; a[o+1]=p.y; a[o+2]=p.z; a[o+3]=p.x; a[o+4]=p.y+.9; a[o+5]=p.z; }); q.g.attributes.position.needsUpdate=true; } else if(W._rain) W._rain.m.visible=false;
    },
    _step(){
      const now=performance.now(), dt=Math.min(.1,(now-(W._tt||now))/1000); W._tt=now;
      const ui=W._ui; if(!W.on()){ if(ui){ ui.querySelector('#zw-chip').style.display='none'; ui.querySelector('#zw-tint').style.opacity=0; ui.querySelector('#zw-sun').style.opacity=0; } if(W._rain) W._rain.m.visible=false; if(W._strikes.length) W._clearStrikes(); return; }
      W.init(); W._mkUI(); W._mkRain(); const c=W.calc(), T=TYPES[c.type];
      const tint=W._ui.querySelector('#zw-tint'), sun=W._ui.querySelector('#zw-sun'), chip=W._ui.querySelector('#zw-chip');
      tint.style.background=c.type==='storm'?'rgba(3,5,22,.66)':c.type==='rain'?'rgba(45,65,100,.28)':c.type==='sun'?'radial-gradient(circle at 90% 0%,rgba(255,220,100,.28),rgba(255,200,80,.06) 60%)':'transparent'; tint.style.opacity=(c.type==='clear')?0:1;
      sun.style.opacity=c.type==='sun'?1:0; chip.style.display='flex'; W._ui.querySelector('#zw-t').textContent=T.ic+' '+T.n+(c.ovr?' (Admin)':'');
      W.frame(dt);
      if(c.type==='storm') W._strikeTick(dt); else if(W._strikes.length) W._clearStrikes();
    }
  };
  setInterval(()=>{ try{ W._step(); }catch(e){} },33);
})();
