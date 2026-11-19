/* ZNight (v839): 🌙 Nacht-Stimmung – Maschinen/Gondelstation/Glücksrad leuchten nachts + Glühwürmchen (nach echter Uhrzeit, passend zum Himmel) */
(function(){
  'use strict';
  if(window.ZNight) return;
  const N=window.ZNight={n:0,force:null};
  let halos=[], flies=[], tex=null, lastBuild=0, placesKey='';
  const hour=()=>{ const d=new Date(); return d.getHours()+d.getMinutes()/60; };
  const calc=()=>{ if(N.force!=null) return N.force; let en=true; try{ en=localStorage.getItem('zoo_tod')!=='0'; }catch(e){} if(!en) return 0; const h=hour(); if(h>=20.5||h<5.5) return 1; if(h>=19) return (h-19)/1.5; if(h<7) return (7-h)/1.5; return 0; };
  const mkTex=()=>{ const c=document.createElement('canvas'); c.width=c.height=64; const x=c.getContext('2d'); const g=x.createRadialGradient(32,32,0,32,32,32); g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(.25,'rgba(255,255,255,.55)'); g.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=g; x.fillRect(0,0,64,64); const t=new THREE.CanvasTexture(c); return t; };
  const COL={'Goldmaschine':0xffc933,'Leckerli-Automat':0xff7bd0,'Zucht-Maschine':0x6dffa0,'Würfel-Maschine':0xff5a5a,'Sammlungs-Terminal':0x5ad7ff,'Glücksrad':0xffe066,'Gondelstation':0xffd890,'Marktplatz':0xffb060};
  const busy=()=>{ const g=window.ZG; if(!g) return true; return !!(g._steActive||g._jumpActive||g._iceRoomActive||g._mazeActive||g._windRoomActive||g._arcadeActive||g._trashActive||g._moonMode); };
  function build(){
    const g=window.ZG; if(!g||!g.scene||!window.THREE) return false;
    let pl=[]; try{ pl=ZGuide.places().filter(p=>p.n!=='Mein Zoo'&&typeof p.x==='number'); }catch(e){}
    const key=pl.map(p=>p.n+p.x+p.z).join('|');
    if(halos.length&&key===placesKey&&halos[0].s.parent===g.scene) return true;
    halos.forEach(h=>{ try{ h.s.parent&&h.s.parent.remove(h.s); }catch(e){} }); halos=[];
    flies.forEach(f=>{ try{ f.parent&&f.parent.remove(f); }catch(e){} }); flies=[];
    if(!pl.length) return false;
    tex=tex||mkTex(); placesKey=key;
    pl.forEach(p=>{ const m=new THREE.SpriteMaterial({map:tex,color:COL[p.n]||0xffe0a0,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:0}); const s=new THREE.Sprite(m); s.position.set(p.x,7.5,p.z); s.scale.set(13,13,1); s.renderOrder=5; g.scene.add(s); halos.push({s,ph:Math.random()*6}); });
    for(let i=0;i<40;i++){ const m=new THREE.SpriteMaterial({map:tex,color:0xd8ff7a,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:0}); const s=new THREE.Sprite(m); s.scale.set(.9,.9,1); s.userData={a:Math.random()*6,r:6+Math.random()*26,sp:.2+Math.random()*.5,y:.8+Math.random()*3.2,ph:Math.random()*6}; g.scene.add(s); flies.push(s); }
    return true;
  }
  function tick(t){
    try{
      const z=document.getElementById('s-zoo'); const on=z&&getComputedStyle(z).display!=='none'&&window.ZG&&ZG.scene&&window.THREE&&!busy();
      if(on&&(!lastBuild||t-lastBuild>4000)){ lastBuild=t; build(); }
      N.n+=(calc()-N.n)*0.02; const n=on?N.n:0, ts=t/1000;
      halos.forEach(h=>{ h.s.visible=n>.02; if(h.s.visible) h.s.material.opacity=n*(.38+.1*Math.sin(ts*1.7+h.ph)); });
      const pl=window.ZG&&ZG.pl;
      flies.forEach(f=>{ f.visible=n>.05&&!!pl; if(!f.visible) return; const d=f.userData; d.a+=d.sp*.01; f.position.set(pl.x+Math.cos(d.a+d.ph)*d.r,d.y+Math.sin(ts*1.3+d.ph)*.6,pl.z+Math.sin(d.a*1.3+d.ph)*d.r); f.material.opacity=n*(.35+.65*Math.max(0,Math.sin(ts*2.2+d.ph*3))); });
    }catch(e){}
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
