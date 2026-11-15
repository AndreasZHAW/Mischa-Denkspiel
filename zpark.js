/* ═══ ZPark (v800): 🎡 Freizeitpark-Welt – Rebirth 8. Themenpark-Tycoon: Wege, Dekos, Essenstände, Fahrgeschäfte, Achterbahnen + Achterbahn-Editor (Bu:) ═══ */
(function(){
  'use strict';
  if(window.ZPark) return;
  const wait=()=>{ if(typeof ZS==='undefined'||!ZS.zoo||!ZS.player||typeof ZP==='undefined'||typeof THREE==='undefined') return setTimeout(wait,2000); try{ init(); }catch(e){ console.warn('ZPark',e); } };
  function init(){
    const $=id=>document.getElementById(id), zoo=()=>ZS.zoo;
    const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const toast=(m,t)=>{ try{ ZP.toast(m,t||2500); }catch(e){} };
    const RTD=()=>{ try{ return (typeof _rtdb!=='undefined'&&_rtdb&&State._useCloud())?_rtdb:null; }catch(e){ return null; } };
    const me=()=>ZS.player;
    const isBu=()=>String(me()||'').toLowerCase()==='bu:)';
    const isAdm=()=>{ try{ const n=String(me()||'').toLowerCase(); return n==='bu:)'||n==='bu:3'||!!ZS.isAdmin; }catch(e){ return false; } };
    const P=window.ZPark={open:false,pub:false,CFG:{inc:1,price:1}};
    P.on=()=>isBu()||!!P.pub;
    P.has=()=>((zoo().reb||0)>=8)||isAdm();
    const U=1e10;                       // 1 Preis-Einheit = 10 Mrd Mischtaler (hier einstellbar)
    const T=4, GN=24, EX=GN>>1, EZ=GN-1; // Kachelgrösse, Rastergrösse, Eingang
    const fmt=n=>{ n=+n||0; if(n<1e6) return Math.round(n).toLocaleString('de-CH'); const e=Math.floor(Math.log10(n)); return (n/Math.pow(10,e)).toFixed(2)+'×10^'+e; };
    const park=()=>{ const z=zoo(); return z.park||(z.park={paths:{},items:[],tpl:{},earn:0,rate:0,last:0,seen:0}); };
    let lastSave=0; const save=f=>{ const n=Date.now(); if(!f&&n-lastSave<4000) return; lastSave=n; try{ ZS.save&&ZS.save(); }catch(e){} };
    const hudMT=()=>{ try{ ZG._updHUD&&ZG._updHUD(); }catch(e){} };

    // ═══════ Katalog ═══════
    const loopPts=(w,d,n,amp,k,base)=>{ const o=[]; for(let i=0;i<n;i++){ const a=i/n*Math.PI*2; o.push([(w-1)/2+Math.cos(a)*(w-1)/2,base+amp*(.5+.5*Math.sin(a*k)),(d-1)/2+Math.sin(a)*(d-1)/2]); } return o; };
    const CAT={
      pa:{k:'path',n:'Weg',ic:'🟫',c:.3,w:1,d:1},
      tr:{k:'deko',n:'Baum',ic:'🌳',c:2,w:1,d:1}, fl:{k:'deko',n:'Blumenbeet',ic:'🌷',c:1.5,w:1,d:1}, be:{k:'deko',n:'Bank',ic:'🪑',c:3,w:1,d:1},
      la:{k:'deko',n:'Laterne',ic:'💡',c:4,w:1,d:1}, fo:{k:'deko',n:'Brunnen',ic:'⛲',c:15,w:2,d:2}, st:{k:'deko',n:'Statue',ic:'🗿',c:40,w:1,d:1},
      bu:{k:'food',n:'Burger',ic:'🍔',c:60,w:1,d:1,fee:.6,cd:6,col:0xd84315}, pm:{k:'food',n:'Pommes',ic:'🍟',c:50,w:1,d:1,fee:.5,cd:6,col:0xf9a825},
      ei:{k:'food',n:'Eis',ic:'🍦',c:70,w:1,d:1,fee:.7,cd:6,col:0xec407a}, po:{k:'food',n:'Popcorn',ic:'🍿',c:80,w:1,d:1,fee:.8,cd:6,col:0x7e57c2}, ge:{k:'food',n:'Getränke',ic:'🥤',c:40,w:1,d:1,fee:.4,cd:5,col:0x29b6f6},
      ka:{k:'ride',n:'Karussell',ic:'🎠',c:300,w:2,d:2,fee:2.5,cd:8}, sc:{k:'ride',n:'Schiffschaukel',ic:'🚢',c:500,w:2,d:2,fee:4,cd:9},
      au:{k:'ride',n:'Autoscooter',ic:'🚗',c:700,w:3,d:3,fee:5,cd:8}, rr:{k:'ride',n:'Riesenrad',ic:'🎡',c:1200,w:3,d:3,fee:10,cd:12}, fa:{k:'ride',n:'Freifallturm',ic:'🗼',c:1500,w:2,d:2,fee:12,cd:10},
      c1:{k:'coaster',n:'Mini-Achterbahn',ic:'🎢',c:3000,w:5,d:4,fee:20,cd:14,pts:loopPts(5,4,10,3,2,.5),col:0x43a047},
      c2:{k:'coaster',n:'Wilde Maus',ic:'🎢',c:6000,w:6,d:5,fee:35,cd:15,pts:loopPts(6,5,12,5,3,.5),col:0xfb8c00},
      c3:{k:'coaster',n:'Mega-Looping',ic:'🎢',c:12000,w:7,d:6,fee:65,cd:18,pts:loopPts(7,6,16,8,4,.5),col:0xe53935}
    };
    const TABS=[['path','🟫','Wege'],['deko','🌳','Deko'],['food','🍔','Essen'],['ride','🎠','Fahrgeschäfte'],['coaster','🎢','Achterbahnen']];
    let TPL={}; // Vorlagen aus dem Editor (RTDB zoo_park/coasters)
    const getCat=t=>{ if(CAT[t]) return CAT[t]; if(String(t).indexOf('x:')===0){ const id=t.slice(2), o=TPL[id]||park().tpl[id]; if(o) return {k:'coaster',n:o.n,ic:'🎢',c:o.c,w:o.w,d:o.d,fee:o.fee,cd:14,pts:o.pts,col:o.col||0x8e24aa,custom:1}; } return null; };
    const allOfKind=k=>{ const a=Object.keys(CAT).filter(t=>CAT[t].k===k); if(k==='coaster') Object.keys(TPL).forEach(id=>a.push('x:'+id)); return a; };
    const price=t=>Math.round((getCat(t).c*U*(P.CFG.price||1))/1e6)*1e6;

    // ═══════ 3D-Bausteine ═══════
    const mats={}; const M=c=>mats[c]||(mats[c]=new THREE.MeshLambertMaterial({color:c}));
    const box=(w,h,d,c,x,y,z)=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),M(c)); m.position.set(x||0,y||0,z||0); return m; };
    const cyl=(rt,rb,h,c,x,y,z,s)=>{ const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,s||10),M(c)); m.position.set(x||0,y||0,z||0); return m; };
    const sph=(r,c,x,y,z)=>{ const m=new THREE.Mesh(new THREE.SphereGeometry(r,10,8),M(c)); m.position.set(x||0,y||0,z||0); return m; };
    const cone=(r,h,c,x,y,z,s)=>{ const m=new THREE.Mesh(new THREE.ConeGeometry(r,h,s||10),M(c)); m.position.set(x||0,y||0,z||0); return m; };
    const texCache={};
    function emojiSprite(e,sc){ let t=texCache[e]; if(!t){ const c=document.createElement('canvas'); c.width=c.height=96; const g=c.getContext('2d'); g.font='64px serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(e,48,52); t=texCache[e]=new THREE.CanvasTexture(c); } const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false})); s.scale.set(sc||2.4,sc||2.4,1); return s; }
    function buildCoaster(pts,w,d,col){
      const g=new THREE.Group(); g.add(box(w*T,.25,d*T,0xcdb892,0,.1,0));
      const vs=pts.map(p=>new THREE.Vector3((p[0]-(w-1)/2)*T,p[1]*1.4+.9,(p[2]-(d-1)/2)*T));
      const cur=new THREE.CatmullRomCurve3(vs,true,'catmullrom',.5), N=Math.max(40,pts.length*14);
      g.add(new THREE.Mesh(new THREE.TubeGeometry(cur,N,.28,5,true),M(col||0xe53935)));
      for(let i=0;i<N;i+=7){ const p=cur.getPoint(i/N); if(p.y>1.3) g.add(box(.3,p.y-.2,.3,0x8d6e63,p.x,(p.y-.2)/2+.2,p.z)); }
      const carts=[]; for(let k=0;k<3;k++){ const c=box(1.3,.7,.9,k?0x1565c0:0xffd54f,0,0,0); g.add(c); carts.push(c); }
      const L=cur.getLength(), ymax=Math.max.apply(null,vs.map(v=>v.y)); let u=Math.random();
      g.userData.anim=(t,dt)=>{ const p=cur.getPoint(u); const sp=5+12*Math.sqrt(Math.max(0,(ymax-p.y)/(ymax+.01))); u=(u+sp*dt/L)%1;
        carts.forEach((c,k)=>{ const uu=((u-k*.014)%1+1)%1, a=cur.getPoint(uu), b=cur.getPoint((uu+.004)%1); c.position.set(a.x,a.y+.55,a.z); c.lookAt(b.x,b.y+.55,b.z); }); };
      g.userData.cur=cur; return g;
    }
    function stats(pts,w,d){ const vs=pts.map(p=>new THREE.Vector3((p[0]-(w-1)/2)*T,p[1]*1.4+.9,(p[2]-(d-1)/2)*T)); const cur=new THREE.CatmullRomCurve3(vs,true,'catmullrom',.5); const L=cur.getLength(); let drop=0, prev=null, maxH=0; for(let i=0;i<=80;i++){ const p=cur.getPoint(i/80); if(prev!=null&&p.y<prev) drop+=prev-p.y; prev=p.y; maxH=Math.max(maxH,p.y); }
      const exc=Math.max(1,Math.min(10,+(.5+L/60+drop/4+maxH/4).toFixed(1))); return {L:Math.round(L),drop:Math.round(drop),maxH:Math.round(maxH),exc,c:Math.round(400+exc*700+L*12),fee:Math.round(6+exc*7)}; }
    function model(t){
      const ct=getCat(t), g=new THREE.Group(), w=ct.w, d=ct.d; g.userData.anim=null;
      switch(ct.k==='coaster'?'coaster':t){
        case 'pa': g.add(box(T,.15,T,0xd7c29a,0,.07,0)); break;
        case 'tr': g.add(cyl(.4,.5,2.4,0x6d4c41,0,1.2,0)); g.add(cone(2,3,0x2e7d32,0,3.6,0,8)); g.add(cone(1.5,2.4,0x43a047,0,5,0,8)); break;
        case 'fl': g.add(box(3,.3,3,0x5d4037,0,.15,0)); [[-.8,-.8,0xec407a],[.8,-.6,0xffeb3b],[-.5,.8,0xff7043],[.9,.9,0xab47bc]].forEach(a=>g.add(sph(.4,a[2],a[0],.7,a[1]))); break;
        case 'be': g.add(box(2.4,.3,.9,0x8d6e63,0,.8,0)); g.add(box(2.4,.8,.2,0x6d4c41,0,1.3,-.4)); g.add(box(.2,.8,.7,0x424242,-1,.4,0)); g.add(box(.2,.8,.7,0x424242,1,.4,0)); break;
        case 'la': g.add(cyl(.12,.15,4,0x37474f,0,2,0)); g.add(sph(.55,0xfff59d,0,4.2,0)); break;
        case 'fo': g.add(cyl(3,3.2,.8,0xb0bec5,0,.4,0,16)); g.add(cyl(2.6,2.6,.85,0x4fc3f7,0,.42,0,16)); g.add(cyl(.35,.45,2.2,0xcfd8dc,0,1.5,0)); g.add(sph(.6,0x81d4fa,0,2.8,0)); break;
        case 'st': g.add(box(1.6,1.4,1.6,0x90a4ae,0,.7,0)); g.add(cyl(.45,.6,1.8,0xffd54f,0,2.3,0)); g.add(sph(.5,0xffd54f,0,3.5,0)); break;
        case 'bu': case 'pm': case 'ei': case 'po': case 'ge': g.add(box(2.6,1.8,2.6,0xfff8e1,0,.9,0)); g.add(cone(2.3,1.3,ct.col,0,2.5,0,4)); g.children[g.children.length-1].rotation.y=Math.PI/4; g.add(box(2.7,.5,.4,ct.col,0,1.5,1.4)); { const s=emojiSprite(ct.ic,1.8); s.position.set(0,4.2,0); g.add(s); } break;
        case 'ka': { g.add(cyl(3.4,3.6,.4,0xbcaaa4,0,.2,0,18)); const r=new THREE.Group(); r.add(cyl(.25,.25,3,0xffd54f,0,1.9,0)); for(let i=0;i<6;i++){ const a=i/6*6.283; r.add(cyl(.08,.08,2,0xffd54f,Math.cos(a)*2.3,1.6,Math.sin(a)*2.3)); r.add(box(.8,.9,.5,i%2?0xe91e63:0x2196f3,Math.cos(a)*2.3,1.1,Math.sin(a)*2.3)); } r.add(cone(3.2,1.4,0xe53935,0,3.9,0,18)); g.add(r); g.userData.anim=(tt,dt,act)=>{ r.rotation.y+=dt*(act?1.6:.4); }; break; }
        case 'sc': { g.add(box(.5,5,.5,0x6d4c41,-2.3,2.5,0)); g.add(box(.5,5,.5,0x6d4c41,2.3,2.5,0)); const sw=new THREE.Group(); sw.position.set(0,4.6,0); sw.add(box(.2,3.6,.2,0x9e9e9e,0,-1.8,0)); sw.add(box(4.2,.7,1.4,0xc62828,0,-3.6,0)); g.add(sw); g.userData.anim=(tt,dt,act)=>{ sw.rotation.z=Math.sin(tt*(act?2.2:.7))*(act?.8:.2); }; break; }
        case 'au': { g.add(box(w*T-1,.2,d*T-1,0x607d8b,0,.1,0)); const cars=[]; for(let i=0;i<4;i++){ const c=box(1.2,.7,.9,[0xe53935,0x1e88e5,0xfdd835,0x43a047][i],(i%2?2:-2),.55,(i<2?-2:2)); g.add(c); cars.push(c); } g.add(box(w*T-1,.3,.3,0xffee58,0,5,0)); g.userData.anim=(tt,dt,act)=>{ cars.forEach((c,i)=>{ c.position.x=Math.cos(tt*.8+i*1.7)*3.5; c.position.z=Math.sin(tt*.7+i*2.3)*3.5; c.rotation.y=tt+i; }); }; break; }
        case 'rr': { g.add(box(.5,9,.5,0x546e7a,-1.8,4.5,0)); g.add(box(.5,9,.5,0x546e7a,1.8,4.5,0)); const wh=new THREE.Group(); wh.position.y=9; const ring=new THREE.Mesh(new THREE.TorusGeometry(7,.2,6,28),M(0xeceff1)); wh.add(ring); for(let i=0;i<8;i++){ const a=i/8*6.283; const sp=box(14,.1,.1,0xcfd8dc,0,0,0); sp.rotation.z=a; wh.add(sp); const gd=box(1.2,1,.9,[0xe53935,0x1e88e5,0xfdd835,0x43a047][i%4],Math.cos(a)*7,Math.sin(a)*7,0); gd.userData.gd=1; wh.add(gd); } g.add(wh); g.userData.anim=(tt,dt,act)=>{ wh.rotation.z+=dt*(act?.5:.15); wh.children.forEach(c=>{ if(c.userData.gd) c.rotation.z=-wh.rotation.z; }); }; break; }
        case 'fa': { g.add(box(1.2,16,1.2,0x78909c,0,8,0)); const ring=box(2.6,.8,2.6,0xe53935,0,2,0); g.add(ring); g.add(cone(1.2,2,0xffd54f,0,17,0,8)); g.userData.anim=(tt,dt,act)=>{ ring.position.y=act?(3+(1+Math.sin(tt*1.6))*6):2; }; break; }
        case 'coaster': { const c=buildCoaster(ct.pts,w,d,ct.col); c.userData.cur=null; return c; }
      }
      return g;
    }

    // ═══════ Welt ═══════
    let ov,cv,R,S,CAM,parkG,pathG,itemG,guestG,gridH,edG,ghostG,hudEl,raf=0,last=0,tnow=0;
    let tgt={x:0,z:10}, yaw=0, dist=100; const PITCH=.95;
    let mode={k:'view',t:null,r:0}; let tab='path';
    const items=()=>park().items;
    let occ={}, dist0={}, reach=new Set(), acc={}, objs=[], guests=[], decoN=new Map(), stat={g:0,rate:0};
    const key=(x,z)=>x+','+z;
    const dims=(t,r)=>{ const c=getCat(t); return (r&1)?[c.d,c.w]:[c.w,c.d]; };
    const wpos=(tx,tz)=>[(tx+.5-GN/2)*T,(tz+.5-GN/2)*T];
    function recalc(){
      occ={}; const pk=park(); Object.keys(pk.paths).forEach(k=>{ occ[k]='p'; });
      pk.items.forEach((it,i)=>{ const [w,d]=dims(it.t,it.r); for(let a=0;a<w;a++) for(let b=0;b<d;b++) occ[key(it.x+a,it.z+b)]=i+1; });
      // Erreichbarkeit (BFS vom Eingang)
      dist0={}; reach=new Set(); const E=key(EX,EZ); if(pk.paths[E]){ dist0[E]=0; const q=[[EX,EZ]]; while(q.length){ const [x,z]=q.shift(); reach.add(key(x,z)); [[1,0],[-1,0],[0,1],[0,-1]].forEach(d=>{ const nx=x+d[0], nz=z+d[1], k=key(nx,nz); if(pk.paths[k]&&dist0[k]==null){ dist0[k]=dist0[key(x,z)]+1; q.push([nx,nz]); } }); } }
      acc={}; decoN=new Map(); const deko=pk.items.filter(it=>getCat(it.t)&&getCat(it.t).k==='deko');
      pk.items.forEach((it,i)=>{ const c=getCat(it.t); if(!c) return; const [w,d]=dims(it.t,it.r);
        if(c.k!=='deko'){ const cx=it.x+(w-1)/2, cz=it.z+(d-1)/2; let n=0; deko.forEach(o=>{ if(Math.abs(o.x-cx)<=w/2+3&&Math.abs(o.z-cz)<=d/2+3) n++; }); decoN.set(i,Math.min(.6,n*.05));
          for(let a=-1;a<=w;a++) for(let b=-1;b<=d;b++){ if((a>=0&&a<w)&&(b>=0&&b<d)) continue; if((a<0||a>=w)&&(b<0||b>=d)) continue; const k=key(it.x+a,it.z+b); if(reach.has(k)) (acc[k]||(acc[k]=[])).push(i); } } });
    }
    function rebuild(){
      while(pathG.children.length) pathG.remove(pathG.children[0]); while(itemG.children.length) itemG.remove(itemG.children[0]); objs=[];
      const pk=park(); const shared=new THREE.BoxGeometry(T,.15,T);
      Object.keys(pk.paths).forEach(k=>{ const [x,z]=k.split(',').map(Number); const m=new THREE.Mesh(shared,M(reachOK(k)?0xd7c29a:0xb08f6a)); const p=wpos(x,z); m.position.set(p[0],.07,p[1]); pathG.add(m); });
      pk.items.forEach((it,i)=>{ const c=getCat(it.t); if(!c) return; const g=model(it.t); const [w,d]=dims(it.t,it.r); const p=wpos(it.x+(w-1)/2,it.z+(d-1)/2); g.position.set(p[0],0,p[1]); g.rotation.y=-(it.r||0)*Math.PI/2; itemG.add(g); objs.push({i,g,it,c}); });
    }
    const reachOK=k=>reach.has(k);
    const itemActive=o=>(o.it.cd||0)>Date.now();
    function relayout(){ recalc(); rebuild(); }

    function build(){
      if(S) return; R=new THREE.WebGLRenderer({canvas:cv,antialias:false}); R.setPixelRatio(Math.min(devicePixelRatio||1,2)); S=new THREE.Scene(); S.background=new THREE.Color(0x9fd8ff); S.fog=new THREE.Fog(0x9fd8ff,160,420);
      CAM=new THREE.PerspectiveCamera(50,1,.5,900); S.add(new THREE.AmbientLight(0xffffff,.78)); const dl=new THREE.DirectionalLight(0xfff2cc,.65); dl.position.set(50,100,30); S.add(dl);
      const gr=new THREE.Mesh(new THREE.PlaneGeometry(900,900),new THREE.MeshBasicMaterial({color:0x5aa844})); gr.rotation.x=-Math.PI/2; gr.position.y=-.05; S.add(gr);
      const pg=new THREE.Mesh(new THREE.PlaneGeometry(GN*T,GN*T),new THREE.MeshBasicMaterial({color:0x7ccf63})); pg.rotation.x=-Math.PI/2; pg.position.y=-.02; S.add(pg);
      // Zaun
      const fc=0x8d6e63, H=GN*T/2; [[0,-H,GN*T,.3],[0,H,GN*T,.3],[-H,0,.3,GN*T],[H,0,.3,GN*T]].forEach(a=>{ const f=box(a[2],1.2,a[3],fc,a[0],.6,a[1]); f.userData.fence=1; S.add(f); });
      // Eingangstor
      const gp=wpos(EX,EZ); const gate=new THREE.Group(); gate.add(box(.8,6,.8,0xffd54f,-T,3,0)); gate.add(box(.8,6,.8,0xffd54f,T,3,0)); gate.add(box(T*2+.8,1.4,1,0xe53935,0,6,0)); const sp=emojiSprite('🎡',3); sp.position.set(0,8.2,0); gate.add(sp); gate.position.set(gp[0],0,gp[1]+T*.6); S.add(gate);
      gridH=new THREE.GridHelper(GN*T,GN,0xffffff,0xffffff); gridH.position.y=.05; gridH.material.transparent=true; gridH.material.opacity=.28; gridH.visible=false; S.add(gridH);
      parkG=new THREE.Group(); pathG=new THREE.Group(); itemG=new THREE.Group(); guestG=new THREE.Group(); ghostG=new THREE.Group(); edG=new THREE.Group(); parkG.add(pathG,itemG,guestG); S.add(parkG,ghostG,edG);
      // Deko-Wolken & Bäume ausserhalb
      for(let i=0;i<26;i++){ const a=i/26*6.283, r=GN*T/2+14+Math.random()*30; const t=new THREE.Group(); t.add(cyl(.4,.5,2.4,0x6d4c41,0,1.2,0)); t.add(cone(2,3.2,0x2e7d32,0,3.6,0,8)); t.position.set(Math.cos(a)*r,0,Math.sin(a)*r); S.add(t); }
      onResize();
    }
    function onResize(){ if(!R) return; const w=innerWidth, h=innerHeight; R.setSize(w,h,false); cv.style.width=w+'px'; cv.style.height=h+'px'; CAM.aspect=w/h; CAM.updateProjectionMatrix(); }
    function camUpdate(){ const c=Math.cos(PITCH), s=Math.sin(PITCH); CAM.position.set(tgt.x+Math.sin(yaw)*c*dist,s*dist,tgt.z+Math.cos(yaw)*c*dist); CAM.lookAt(tgt.x,0,tgt.z); }
    const ray=new THREE.Raycaster(), pl=new THREE.Plane(new THREE.Vector3(0,1,0),0), hit=new THREE.Vector3();
    function ground(cx,cy){ const r=cv.getBoundingClientRect(); const v=new THREE.Vector2(((cx-r.left)/r.width)*2-1,-((cy-r.top)/r.height)*2+1); ray.setFromCamera(v,CAM); return ray.ray.intersectPlane(pl,hit)?hit.clone():null; }
    const tileAt=p=>p?[Math.floor(p.x/T+GN/2),Math.floor(p.z/T+GN/2)]:null;

    // ═══════ Bauen ═══════
    const inGrid=(x,z)=>x>=0&&z>=0&&x<GN&&z<GN;
    function canPlace(t,x,z,r){ const c=getCat(t); if(!c) return false; const [w,d]=dims(t,r); for(let a=0;a<w;a++) for(let b=0;b<d;b++){ const X=x+a, Z=z+b; if(!inGrid(X,Z)) return false; if(occ[key(X,Z)]) return false; if(c.k!=='path'&&X===EX&&Z===EZ) return false; } return true; }
    function spend(n){ const z=zoo(); if((z.mt||0)<n){ toast('💰 Zu wenig Mischtaler ('+fmt(n)+' nötig)'); return false; } z.mt-=n; hudMT(); return true; }
    function gain(n){ const z=zoo(); z.mt=(z.mt||0)+n; const pk=park(); pk.earn=(pk.earn||0)+n; hudMT(); }
    function place(t,x,z,r){ const c=getCat(t); if(!c) return false; if(!canPlace(t,x,z,r)){ return false; } if(!spend(price(t))) return false; const pk=park();
      if(c.k==='path') pk.paths[key(x,z)]=1; else { const it={t,x,z,r:r||0}; if(c.custom){ const id=t.slice(2); pk.tpl[id]={n:c.n,c:c.c,w:c.w,d:c.d,fee:c.fee,pts:c.pts,col:c.col}; } pk.items.push(it); }
      relayout(); save(true); hudRefresh(); return true; }
    function remove(x,z){ const k=key(x,z), o=occ[k], pk=park(); if(!o){ return false; }
      if(o==='p'){ if(x===EX&&z===EZ){ toast('Der Eingang bleibt.'); return true; } delete pk.paths[k]; gain(price('pa')*.5); }
      else { const it=pk.items[o-1]; gain(price(it.t)*.5); pk.items.splice(o-1,1); }
      relayout(); save(true); hudRefresh(); return true; }
    function info(x,z){ const o=occ[key(x,z)]; if(!o||o==='p') return; const it=park().items[o-1], c=getCat(it.t); const ok=c.k==='deko'||acc_has(o-1); toast(c.ic+' '+c.n+(c.fee?' · '+fmt(c.fee*U)+' pro Besuch':'')+(ok?'':' · ⚠️ nicht an einen Weg angeschlossen'),3500); }
    const acc_has=i=>Object.keys(acc).some(k=>acc[k].indexOf(i)>=0);

    // ═══════ Besucher ═══════
    const COLS=[0xe53935,0x1e88e5,0xfdd835,0x43a047,0x8e24aa,0xff7043,0x26c6da];
    function spawnGuest(){ const g=new THREE.Group(); g.add(cyl(.45,.5,1.3,COLS[Math.random()*COLS.length|0],0,.8,0)); g.add(sph(.4,0xffcc99,0,1.8,0)); guestG.add(g); const o={g,x:EX,z:EZ,tx:EX,tz:EZ,px:-1,pz:-1,wait:0,sp:1.1+Math.random()*.4,born:Date.now(),life:70000+Math.random()*80000,leave:false}; guests.push(o); place_g(o); }
    function place_g(o){ const p=wpos(o.x,o.z); o.g.position.set(p[0],0,p[1]); }
    function nextTile(o){ const cx=Math.round(o.x), cz=Math.round(o.z), k=key(cx,cz); const nb=[]; [[1,0],[-1,0],[0,1],[0,-1]].forEach(d=>{ const nk=key(cx+d[0],cz+d[1]); if(reach.has(nk)) nb.push([cx+d[0],cz+d[1],nk]); });
      if(!nb.length) return null; if(o.leave){ nb.sort((a,b)=>dist0[a[2]]-dist0[b[2]]); return nb[0]; }
      const f=nb.filter(n=>!(n[0]===o.px&&n[1]===o.pz)); const pool=f.length?f:nb; return pool[Math.random()*pool.length|0]; }
    function arrive(o){ const cx=Math.round(o.x), cz=Math.round(o.z), k=key(cx,cz); if(!reach.has(k)){ o.dead=1; return; } if(o.leave&&dist0[k]===0){ o.dead=1; return; }
      if(!o.leave&&Date.now()-o.born>o.life) o.leave=true;
      if(!o.leave&&acc[k]&&Math.random()<.55){ const now=Date.now(); const cand=acc[k].filter(i=>{ const it=park().items[i]; return it&&(it.cd||0)<now; }); if(cand.length){ const i=cand[Math.random()*cand.length|0], it=park().items[i], c=getCat(it.t); const bonus=1+(decoN.get(i)||0); const sk=(window.ZSkill&&ZSkill.m)?ZSkill.m('money'):1; const pay=c.fee*U*bonus*(P.CFG.inc||1)*sk; it.cd=now+c.cd*1000; gain(pay); pop('+'+fmt(pay),o.g.position); stat.win.push([now,pay]); o.wait=1.2+Math.random(); o.px=cx; o.pz=cz; const nx=nextTile(o); if(nx){ o.tx=nx[0]; o.tz=nx[1]; } return; } }
      const nx=nextTile(o); if(!nx){ o.wait=1; return; } o.px=cx; o.pz=cz; o.tx=nx[0]; o.tz=nx[1]; }
    function stepGuest(o,dt){ if(o.wait>0){ o.wait-=dt; return; } const dx=o.tx-o.x, dz=o.tz-o.z, d=Math.hypot(dx,dz), s=o.sp*dt; if(d<=s||d<1e-4){ o.x=o.tx; o.z=o.tz; arrive(o); } else { o.x+=dx/d*s; o.z+=dz/d*s; o.g.rotation.y=Math.atan2(dx,dz); } place_g(o); }
    stat.win=[];
    let spawnT=0;
    function guestsTick(dt){
      const pk=park(); let nAtt=0, nDeco=0; pk.items.forEach((it,i)=>{ const c=getCat(it.t); if(!c) return; if(c.k==='deko') nDeco++; else if(acc_has(i)) nAtt++; });
      const target=reach.size?Math.min(40,Math.round(3+nAtt*3+nDeco*.4)):0; spawnT-=dt; if(spawnT<=0&&guests.length<target){ spawnGuest(); spawnT=1.5; }
      for(let i=guests.length-1;i>=0;i--){ const o=guests[i]; stepGuest(o,dt); if(o.dead||(guests.length>target+4&&Date.now()-o.born>20000&&!o.leave&&Math.random()<.01)){ guestG.remove(o.g); guests.splice(i,1); } }
      const now=Date.now(); stat.win=stat.win.filter(a=>now-a[0]<60000); stat.rate=stat.win.reduce((s,a)=>s+a[1],0); stat.g=guests.length; stat.att=nAtt; stat.deco=nDeco; }
    function pop(txt,p){ if(!ov) return; const v=new THREE.Vector3(p.x,3,p.z); v.project(CAM); if(v.z>1) return; const e=document.createElement('div'); e.textContent=txt; e.style.cssText='position:absolute;pointer-events:none;color:#ffd54f;font:900 .8rem Arial;text-shadow:0 1px 3px #000;left:'+((v.x*.5+.5)*innerWidth)+'px;top:'+((-v.y*.5+.5)*innerHeight)+'px;transition:all 1.1s;opacity:1;z-index:2'; ov.appendChild(e); requestAnimationFrame(()=>{ e.style.top=(parseFloat(e.style.top)-40)+'px'; e.style.opacity='0'; }); setTimeout(()=>e.remove(),1200); }

    // ═══════ Achterbahn-Editor (nur Bu:) ═══════
    const EW=12, ED=10; let ED_={on:false,pts:[],sel:-1,h:3,name:'',marks:null,track:null,ride:false,col:0xe53935};
    const COL=[0xe53935,0x1e88e5,0x43a047,0xfb8c00,0x8e24aa,0xffd54f];
    function edOpen(){ if(!isBu()) return toast('Der Editor ist nur für Bu:).'); ED_={on:true,pts:[],sel:-1,h:3,name:'Meine Achterbahn',marks:new THREE.Group(),track:null,ride:false,col:COL[0]}; parkG.visible=false; gridH.visible=false; ghostClear(); edG.add(ED_.marks); const base=box(EW*T,.25,ED*T,0xcdb892,0,.1,0); base.userData.base=1; edG.add(base); const g=new THREE.GridHelper(Math.max(EW,ED)*T,Math.max(EW,ED),0xffffff,0xffffff); g.position.y=.3; g.material.transparent=true; g.material.opacity=.3; edG.add(g); tgt={x:0,z:0}; dist=60; mode={k:'edit'}; edPanel(); edRedraw(); }
    function edClose(){ ED_.on=false; while(edG.children.length) edG.remove(edG.children[0]); parkG.visible=true; mode={k:'view',t:null,r:0}; $('zpk-ed')&&($('zpk-ed').style.display='none'); $('zpk-bar').style.display='block'; dist=100; tgt={x:0,z:10}; }
    const edW=p=>[(p[0]-(EW-1)/2)*T,(p[2]-(ED-1)/2)*T];
    function edRedraw(){ const E=ED_; while(E.marks.children.length) E.marks.remove(E.marks.children[0]); if(E.track){ edG.remove(E.track); E.track=null; }
      E.pts.forEach((p,i)=>{ const m=sph(.7,i===E.sel?0xffeb3b:(i===0?0x69f0ae:0xffffff),0,0,0); const w=edW(p); m.position.set(w[0],p[1]*1.4+.9,w[1]); E.marks.add(m); const pole=box(.1,p[1]*1.4+.7,.1,0x888888,w[0],(p[1]*1.4+.7)/2,w[1]); E.marks.add(pole); });
      if(E.pts.length>=2){ const vs=E.pts.map(p=>{ const w=edW(p); return new THREE.Vector3(w[0],p[1]*1.4+.9,w[1]); }); const ln=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(vs),new THREE.LineBasicMaterial({color:0xffffff})); E.marks.add(ln); }
      if(E.pts.length>=4){ E.track=buildCoaster(E.pts,EW,ED,E.col); edG.add(E.track); E.track.children[0].visible=false; } edInfo(); }
    function edInfo(){ const E=ED_, el=$('zpk-edi'); if(!el) return; if(E.pts.length<4){ el.innerHTML='Tippe aufs Raster, um Punkte zu setzen (mind. 4). Punkt antippen = auswählen. Höhe: <b>'+E.h+'</b>'; return; } const s=stats(E.pts,EW,ED); el.innerHTML='Länge <b>'+s.L+'</b> · Höhe <b>'+s.maxH+'</b> · Gefälle <b>'+s.drop+'</b><br>⭐ Spass <b>'+s.exc+'/10</b> · Preis <b>'+fmt(s.c*U)+'</b> · Einnahme <b>'+fmt(s.fee*U)+'</b>/Besuch'; }
    function edTap(p){ const E=ED_; if(!E.on||!p) return; const ex=Math.max(0,Math.min(EW-1,Math.round(p.x/T+(EW-1)/2))), ez=Math.max(0,Math.min(ED-1,Math.round(p.z/T+(ED-1)/2)));
      let bi=-1, bd=.9; E.pts.forEach((q,i)=>{ const d=Math.hypot(q[0]-ex,q[2]-ez); if(d<bd){ bd=d; bi=i; } });
      if(bi>=0){ E.sel=bi; E.h=E.pts[bi][1]; } else { if(E.pts.length>=24) return toast('Maximal 24 Punkte'); E.pts.push([ex,E.h,ez]); E.sel=E.pts.length-1; } edRedraw(); }
    function edHeight(d){ const E=ED_; E.h=Math.max(0,Math.min(10,E.h+d)); if(E.sel>=0) E.pts[E.sel][1]=E.h; edRedraw(); }
    function edDelete(){ const E=ED_; if(E.sel>=0){ E.pts.splice(E.sel,1); E.sel=E.pts.length-1; edRedraw(); } }
    function edPanel(){ $('zpk-bar').style.display='none'; let el=$('zpk-ed'); if(!el){ el=document.createElement('div'); el.id='zpk-ed'; el.className='zpk-b'; el.style.cssText='left:8px;right:8px;bottom:8px;padding:8px'; ov.appendChild(el); }
      el.style.display='block'; el.innerHTML='<div id="zpk-edi" style="font-size:.78rem;margin-bottom:6px"></div><div style="display:flex;gap:5px;flex-wrap:wrap"><input id="zpk-edn" value="'+esc(ED_.name)+'" maxlength="24" style="flex:1;min-width:120px;padding:6px;border-radius:8px;border:none;font:700 .85rem Arial"><button data-a="hm">⬇️ Tiefer</button><button data-a="hp">⬆️ Höher</button><button data-a="del">🗑️ Punkt</button><button data-a="col">🎨</button><button data-a="ride">🎥 Probefahrt</button><button data-a="save" style="background:#2e7d32">💾 Veröffentlichen</button><button data-a="x" style="background:#b71c1c">✕</button></div>';
      el.querySelectorAll('button').forEach(b=>{ b.style.cssText+=';border:2px solid #fff;border-radius:10px;background:'+(b.style.background||'rgba(60,40,100,.9)')+';color:#fff;font:900 .78rem Arial;padding:7px 9px'; });
      $('zpk-edn').oninput=e=>{ ED_.name=e.target.value; };
      el.onclick=e=>{ const a=e.target.closest('button'); if(!a) return; const k=a.dataset.a; if(k==='hm') edHeight(-1); else if(k==='hp') edHeight(1); else if(k==='del') edDelete(); else if(k==='col'){ const i=(COL.indexOf(ED_.col)+1)%COL.length; ED_.col=COL[i]; edRedraw(); } else if(k==='ride') edRide(); else if(k==='save') edSave(); else if(k==='x'){ if(confirm('Editor schliessen? Nicht gespeicherte Änderungen gehen verloren.')) edClose(); } }; }
    function edRide(){ const E=ED_; if(E.pts.length<4) return toast('Mindestens 4 Punkte nötig.'); E.ride=!E.ride; if(!E.ride){ tgt={x:0,z:0}; dist=60; } toast(E.ride?'🎥 Probefahrt (nochmal tippen = zurück)':'Editor'); }
    function edSave(){ const E=ED_; if(E.pts.length<4) return toast('Mindestens 4 Punkte nötig.'); const r=RTD(); if(!r) return toast('Keine Cloud-Verbindung.');
      let minx=1e9,minz=1e9,maxx=-1e9,maxz=-1e9; E.pts.forEach(p=>{ minx=Math.min(minx,p[0]); maxx=Math.max(maxx,p[0]); minz=Math.min(minz,p[2]); maxz=Math.max(maxz,p[2]); });
      const ox=Math.floor(minx), oz=Math.floor(minz), w=Math.max(2,Math.floor(maxx)-ox+1), d=Math.max(2,Math.floor(maxz)-oz+1); const pts=E.pts.map(p=>[p[0]-ox,p[1],p[2]-oz]); const s=stats(pts,w,d);
      const id='k'+Date.now().toString(36); const nm=(E.name||'Achterbahn').slice(0,24); r.ref('zoo_park/coasters/'+id).set({n:nm,pts,w,d,c:s.c,fee:s.fee,by:me(),at:Date.now(),col:E.col}).then(()=>{ toast('🎢 „'+nm+'“ ist jetzt für alle im Bau-Menü!',3500); }).catch(()=>toast('Speichern fehlgeschlagen.')); edClose(); }
    P.edOpen=edOpen;

    // ═══════ Oberfläche ═══════
    function css(){ if($('zpk-css')) return; const s=document.createElement('style'); s.id='zpk-css'; s.textContent='#zpk-ov{position:fixed;inset:0;z-index:720;background:#9fd8ff;font-family:Arial,sans-serif;touch-action:none;user-select:none;color:#fff}#zpk-ov canvas{display:block}.zpk-b{position:absolute;border:2px solid #fff;border-radius:12px;background:rgba(40,30,80,.88);color:#fff;font:900 .85rem Arial;padding:8px 11px}.zpk-b button,.zpk-chip{cursor:pointer}.zpk-chip{flex:0 0 auto;min-width:78px;margin-right:6px;padding:6px 8px;border:2px solid rgba(255,255,255,.5);border-radius:10px;background:rgba(255,255,255,.12);text-align:center;font:900 .72rem Arial;color:#fff}.zpk-chip.on{border-color:#ffd54f;background:rgba(255,213,79,.28)}.zpk-tab{padding:6px 9px;border:2px solid rgba(255,255,255,.4);border-radius:10px;background:rgba(255,255,255,.1);color:#fff;font:900 .74rem Arial;margin-right:4px;cursor:pointer}.zpk-tab.on{border-color:#ffd54f;background:rgba(255,213,79,.28)}'; document.head.appendChild(s); }
    function mkUI(){ css(); ov=document.createElement('div'); ov.id='zpk-ov'; cv=document.createElement('canvas'); ov.appendChild(cv);
      ov.insertAdjacentHTML('beforeend','<div id="zpk-hud" class="zpk-b" style="left:8px;top:8px;line-height:1.5"></div><button id="zpk-zoo" class="zpk-b" style="right:8px;top:8px">🦁 Zoo</button><button id="zpk-help" class="zpk-b" style="right:8px;top:54px">❓</button><button id="zpk-rl" class="zpk-b" style="right:8px;top:100px">⟲</button><button id="zpk-rr" class="zpk-b" style="right:8px;top:146px">⟳</button><button id="zpk-rot" class="zpk-b" style="right:8px;top:192px;display:none">🔄</button><div id="zpk-bar" class="zpk-b" style="left:6px;right:6px;bottom:6px;padding:6px"><div id="zpk-tabs" style="display:flex;overflow-x:auto;margin-bottom:6px"></div><div id="zpk-chips" style="display:flex;overflow-x:auto;min-height:60px"></div></div>');
      document.body.appendChild(ov); hudEl=$('zpk-hud'); build();
      $('zpk-zoo').onclick=()=>P.close(); $('zpk-help').onclick=openHelp; $('zpk-rl').onclick=()=>{ yaw-=.4; }; $('zpk-rr').onclick=()=>{ yaw+=.4; }; $('zpk-rot').onclick=()=>{ mode.r=((mode.r||0)+1)%4; };
      addEventListener('resize',onResize); ov.addEventListener('wheel',e=>{ dist=Math.max(22,Math.min(150,dist*(e.deltaY>0?1.1:.9))); e.preventDefault(); },{passive:false});
      const tp={}; let pd=0, moved=0, down=null, lastTile=null;
      cv.addEventListener('pointerdown',e=>{ tp[e.pointerId]=[e.clientX,e.clientY]; if(Object.keys(tp).length===1){ down=[e.clientX,e.clientY]; moved=0; lastTile=null; try{ cv.setPointerCapture(e.pointerId); }catch(_){} } pd=0; });
      cv.addEventListener('pointermove',e=>{ const prev=tp[e.pointerId]; if(!prev){ if(mode.k==='build') hover(e); return; } tp[e.pointerId]=[e.clientX,e.clientY]; const ks=Object.keys(tp);
        if(ks.length===2){ const a=tp[ks[0]], b=tp[ks[1]], d=Math.hypot(a[0]-b[0],a[1]-b[1]); if(pd) dist=Math.max(22,Math.min(150,dist*pd/d)); pd=d; moved=99; return; }
        const dx=e.clientX-prev[0], dy=e.clientY-prev[1]; moved+=Math.abs(dx)+Math.abs(dy);
        if(mode.k==='build'&&mode.t&&getCat(mode.t).k==='path'){ const t=tileAt(ground(e.clientX,e.clientY)); if(t&&(!lastTile||lastTile[0]!==t[0]||lastTile[1]!==t[1])){ lastTile=t; place('pa',t[0],t[1],0); } return; }
        if(mode.k==='edit'&&ED_.ride) return; const k=dist*.0016; tgt.x+=-Math.cos(yaw)*dx*k-Math.sin(yaw)*dy*k; tgt.z+=Math.sin(yaw)*dx*k-Math.cos(yaw)*dy*k; if(mode.k==='build') hover(e); });
      const up=e=>{ const had=tp[e.pointerId]; delete tp[e.pointerId]; pd=0; if(!had) return; if(moved<8&&Object.keys(tp).length===0){ tap(e); } };
      cv.addEventListener('pointerup',up); cv.addEventListener('pointercancel',e=>{ delete tp[e.pointerId]; pd=0; });
      mkTabs(); }
    function hover(e){ const t=tileAt(ground(e.clientX,e.clientY)); ghost(t); }
    function ghostClear(){ while(ghostG.children.length) ghostG.remove(ghostG.children[0]); }
    function ghost(t){ ghostClear(); if(!t||mode.k!=='build'||!mode.t) return; const c=getCat(mode.t); const [w,d]=dims(mode.t,mode.r); const x0=t[0]-((w-1)>>1), z0=t[1]-((d-1)>>1); const ok=canPlace(mode.t,x0,z0,mode.r); const p=wpos(x0+(w-1)/2,z0+(d-1)/2); const f=box(w*T,.3,d*T,ok?0x66ff66:0xff5555,p[0],.25,p[1]); f.material=new THREE.MeshBasicMaterial({color:ok?0x66ff66:0xff5555,transparent:true,opacity:.45}); ghostG.add(f); }
    function tap(e){ const t=tileAt(ground(e.clientX,e.clientY)); if(mode.k==='edit'){ edTap(ground(e.clientX,e.clientY)); return; } if(!t||!inGrid(t[0],t[1])) return;
      if(mode.k==='bulldoze'){ remove(t[0],t[1]); return; }
      if(mode.k==='build'&&mode.t){ const [w,d]=dims(mode.t,mode.r); const x0=t[0]-((w-1)>>1), z0=t[1]-((d-1)>>1); if(!canPlace(mode.t,x0,z0,mode.r)){ toast('Hier ist kein Platz.',1500); return; } place(mode.t,x0,z0,mode.r); ghost(t); return; }
      info(t[0],t[1]); }
    function mkTabs(){ const el=$('zpk-tabs'); el.innerHTML=TABS.map(a=>'<button class="zpk-tab'+(tab===a[0]&&mode.k==='build'?' on':'')+'" data-t="'+a[0]+'">'+a[1]+' '+a[2]+'</button>').join('')+'<button class="zpk-tab'+(mode.k==='bulldoze'?' on':'')+'" data-t="_bd">🗑️ Abriss</button><button class="zpk-tab" data-t="_v">👁️ Ansehen</button>'+(isBu()?'<button class="zpk-tab" data-t="_ed" style="border-color:#ff8a80">🛠️ Editor</button>':'');
      el.onclick=e=>{ const b=e.target.closest('button'); if(!b) return; const t=b.dataset.t; if(t==='_bd'){ mode={k:'bulldoze'}; ghostClear(); gridH.visible=true; } else if(t==='_v'){ mode={k:'view'}; ghostClear(); gridH.visible=false; } else if(t==='_ed'){ edOpen(); return; } else { tab=t; mode={k:'build',t:allOfKind(t)[0],r:0}; gridH.visible=true; } mkTabs(); mkChips(); $('zpk-rot').style.display=mode.k==='build'?'block':'none'; };
      mkChips(); }
    function mkChips(){ const el=$('zpk-chips'); if(mode.k!=='build'){ el.innerHTML='<div style="font-size:.78rem;opacity:.9;padding:6px">'+(mode.k==='bulldoze'?'🗑️ Tippe auf Wege oder Gebäude – du bekommst 50 % zurück.':'Wähle oben einen Bereich zum Bauen. Ziehen = Karte bewegen, Zwei Finger / Mausrad = Zoom.')+'</div>'; return; }
      const list=allOfKind(tab); el.innerHTML=list.map(t=>{ const c=getCat(t); return '<div class="zpk-chip'+(mode.t===t?' on':'')+'" data-t="'+esc(t)+'"><div style="font-size:1.3rem">'+c.ic+'</div>'+esc(c.n)+'<br><span style="opacity:.85">'+fmt(price(t))+'</span></div>'; }).join('')||'<div style="padding:8px;font-size:.8rem">Noch nichts da.</div>';
      el.onclick=e=>{ const c=e.target.closest('.zpk-chip'); if(!c) return; mode.t=c.dataset.t; mode.r=0; mkChips(); }; }
    function hudRefresh(){ if(!hudEl) return; const z=zoo(), pk=park(); const sc=Math.min(5,1+(stat.att||0)*.35+(stat.deco||0)*.05); hudEl.innerHTML='🪙 <b>'+fmt(z.mt||0)+'</b> MT<br>👥 '+stat.g+' Besucher · ⭐ '+sc.toFixed(1)+'<br>📈 '+fmt(stat.rate)+' / Min'+(reach.size?'':'<br><span style="color:#ffab91">Baue Wege ab dem Eingang!</span>'); }
    function openHelp(){ const m=document.createElement('div'); m.style.cssText='position:absolute;inset:0;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:12px;z-index:5'; m.innerHTML='<div style="background:linear-gradient(160deg,#4a148c,#1a237e);border:3px solid #ffd54f;border-radius:16px;padding:14px;max-width:420px;width:100%;max-height:88vh;overflow:auto;font-size:.85rem;line-height:1.5"><div style="font:900 1.2rem Arial;color:#ffd54f;text-align:center">🎡 Dein Freizeitpark</div><p>Baue vom <b>Eingang unten</b> aus <b>Wege</b>, dann Fahrgeschäfte, Essen, Achterbahnen und Deko. Besucher laufen die Wege entlang und zahlen <b>Mischtaler</b> – dieselben wie im Zoo!</p><p>• Gebäude müssen <b>direkt an einem Weg</b> stehen.<br>• <b>Deko</b> in der Nähe erhöht die Einnahmen (bis +60 %).<br>• Jedes Gebäude hat eine Wartezeit – baue mehrere, damit mehr Besucher bezahlen.<br>• 🔄 dreht das Gebäude, 🗑️ reisst ab (50 % zurück).<br>• Bu:) kann im 🛠️ Editor eigene Achterbahnen entwerfen – sie erscheinen dann für alle bei „Achterbahnen“.</p><button style="width:100%;padding:10px;border:none;border-radius:12px;background:#43a047;color:#fff;font:900 .95rem Arial">Los geht’s</button></div>'; m.querySelector('button').onclick=()=>m.remove(); ov.appendChild(m); }
    const KM={ArrowUp:[0,-1],w:[0,-1],W:[0,-1],ArrowDown:[0,1],s:[0,1],S:[0,1],ArrowLeft:[-1,0],a:[-1,0],A:[-1,0],ArrowRight:[1,0],d:[1,0],D:[1,0]}; const kk={};
    function kdown(e){ if(!P.open) return; const tg=e.target&&e.target.tagName; if(tg==='INPUT') { e.stopPropagation(); return; } if(KM[e.key]){ kk[e.key]=e.type==='keydown'; e.stopPropagation(); e.preventDefault(); } else if(e.type==='keydown'&&(e.key==='q'||e.key==='Q')){ yaw-=.4; e.stopPropagation(); } else if(e.type==='keydown'&&(e.key==='e'||e.key==='E')){ yaw+=.4; e.stopPropagation(); } else if(e.type==='keydown'&&(e.key==='r'||e.key==='R')){ if(mode.k==='build') mode.r=((mode.r||0)+1)%4; e.stopPropagation(); } else if(e.type==='keydown') e.stopPropagation(); }
    addEventListener('keydown',kdown,true); addEventListener('keyup',kdown,true);

    // ═══════ Schleife ═══════
    let hudT=0, simT=0;
    function frame(ts){ if(!P.open) return; raf=requestAnimationFrame(frame); const dt=Math.min(.05,(ts-last)/1000||0); last=ts; tnow+=dt;
      Object.keys(kk).forEach(k=>{ if(kk[k]){ const v=KM[k], s=dist*.6*dt; tgt.x+=(v[0]*Math.cos(yaw)+v[1]*Math.sin(yaw))*s; tgt.z+=(-v[0]*Math.sin(yaw)+v[1]*Math.cos(yaw))*s; } });
      const lim=GN*T/2+20; tgt.x=Math.max(-lim,Math.min(lim,tgt.x)); tgt.z=Math.max(-lim,Math.min(lim,tgt.z));
      if(!(ED_.on)){ guestsTick(dt); objs.forEach(o=>{ const a=o.g.userData.anim; if(a) a(tnow,dt,itemActive(o)); }); }
      else { if(ED_.track&&ED_.track.userData.anim){ ED_.track.userData.anim(tnow,dt); if(ED_.ride&&ED_.track.userData.cur){ const cur=ED_.track.userData.cur, p=cur.getPoint((tnow*.03)%1); tgt.x=p.x; tgt.z=p.z; } } }
      hudT-=dt; if(hudT<=0){ hudT=.5; hudRefresh(); const pk=park(); pk.rate=stat.rate; pk.last=Date.now(); save(); }
      camUpdate(); R.render(S,CAM); }
    // ═══════ Öffnen / Schliessen ═══════
    P.openWorld=function(){ if(!P.has()) return toast('🔒 Ab Rebirth 8 kannst du den Freizeitpark betreten.'); if(!P.on()) return toast('🔒 Der Freizeitpark wird bald freigeschaltet.'); if(P.open) return; P.open=true; if(!ov) mkUI(); else ov.style.display='block'; onResize();
      const pk=park(); if(!Object.keys(pk.paths).length){ for(let i=0;i<3;i++) pk.paths[key(EX,EZ-i)]=1; }
      relayout(); if(guests.length){ guests.forEach(o=>guestG.remove(o.g)); guests=[]; }
      // Abwesenheits-Einnahmen (25 % der letzten Rate, max 8 Std.)
      if(pk.last&&pk.rate>0){ const away=Math.min(8*3600000,Date.now()-pk.last); if(away>120000){ const g=pk.rate/60000*away*.25; if(g>0){ gain(g); toast('🎡 Während du weg warst: +'+fmt(g)+' MT',4000); } } }
      mode={k:'view'}; mkTabs(); last=performance.now(); raf=requestAnimationFrame(frame); if(!pk.seen){ pk.seen=1; save(true); setTimeout(openHelp,400); } listenC(); };
    P.close=function(){ if(!P.open) return; if(ED_.on) edClose(); P.open=false; cancelAnimationFrame(raf); if(ov) ov.style.display='none'; save(true); };
    // ═══════ Veröffentlichen / Vorlagen (RTDB) ═══════
    let lis=0; function listenC(){ if(lis) return; const r=RTD(); if(!r) return; lis=1; try{ r.ref('zoo_park/coasters').on('value',s=>{ TPL=s.val()||{}; if(P.open&&mode.k==='build'&&tab==='coaster') mkChips(); }); }catch(e){} }
    let ll=0, lseen=0; function listenP(){ if(ll) return; const r=RTD(); if(!r){ setTimeout(listenP,3000); return; } ll=1; try{ r.ref('zoo_park/pub').on('value',s=>{ const v=!!s.val(); const ch=v!==P.pub; P.pub=v; if(ch&&v&&!isAdm()&&!lseen){ lseen=1; toast('🎡 Rebirth 8 ist da! Baue deinen eigenen Freizeitpark.',6000); try{ ZGfx.confetti(120); }catch(e){} } }); }catch(e){} listenC(); } listenP();
    P.publish=function(on){ if(!isAdm()) return; const r=RTD(); if(!r) return toast('Keine Cloud-Verbindung'); if(on) r.ref('zoo_park/pub').set({t:Date.now(),by:me()}); else r.ref('zoo_park/pub').remove(); toast(on?'✅ Rebirth 8 für alle veröffentlicht':'Rebirth 8 wieder nur für Bu:)',3000); };
    P.adminPanel=function(){ const o=document.createElement('div'); o.style.cssText='position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;padding:12px;font-family:Arial,sans-serif'; o.onclick=e=>{ if(e.target===o) o.remove(); };
      const n=Object.keys(TPL).length; o.innerHTML='<div style="background:linear-gradient(160deg,#4a148c,#1a237e);border:3px solid #ffd54f;border-radius:16px;padding:14px;max-width:380px;width:100%;color:#fff;font-size:.85rem;line-height:1.5"><div style="font:900 1.15rem Arial;color:#ffd54f;text-align:center">🎡 Rebirth 8 · Freizeitpark</div><p>Status: <b style="color:'+(P.pub?'#7dffb0':'#ffd54f')+'">'+(P.pub?'VERÖFFENTLICHT – alle ab Rebirth 7 können Rebirth 8 machen':'Nur für Bu:)')+'</b><br>Kosten: 10\'000\'000\'000\'000 MT · Einkommen ×500<br>Achterbahn-Vorlagen im Umlauf: <b>'+n+'</b></p><button data-a="1" style="width:100%;padding:10px;margin-top:4px;border:none;border-radius:12px;background:#2e7d32;color:#fff;font:900 .9rem Arial">🚀 Veröffentlichen</button><button data-a="0" style="width:100%;padding:10px;margin-top:6px;border:none;border-radius:12px;background:#b71c1c;color:#fff;font:900 .9rem Arial">↩️ Zurückziehen (nur Bu:))</button><button data-a="d" style="width:100%;padding:10px;margin-top:6px;border:none;border-radius:12px;background:rgba(255,255,255,.18);color:#fff;font:900 .9rem Arial">🗑️ Alle Achterbahn-Vorlagen löschen</button></div>';
      o.onclick=e=>{ if(e.target===o) o.remove(); const b=e.target.closest('button'); if(!b) return; const a=b.dataset.a; if(a==='1'){ if(confirm('Rebirth 8 für ALLE veröffentlichen?')) P.publish(true); } else if(a==='0') P.publish(false); else if(a==='d'){ if(confirm('Wirklich alle Vorlagen löschen? (Schon gebaute bleiben)')){ const r=RTD(); r&&r.ref('zoo_park/coasters').remove(); } } o.remove(); };
      document.body.appendChild(o); };
    // ═══════ Menü-Einträge ═══════
    let hm=0; const hook=()=>{ try{ if(window.ZMenu&&!P._me){ P._me=1; const E=ZMenu.entries, i=E.findIndex(e=>e.id==='piraten'); E.splice(i<0?0:i+1,0,{id:'park',ic:'🎡',n:'Freizeitpark',d:'Bauen, Besucher, Achterbahnen',since:'n800',show:()=>P.has(),lock:'Ab Rebirth 8',go:()=>P.openWorld()},{id:'parkadm',ic:'🎡',n:'Rebirth 8 (Admin)',d:'Veröffentlichen',since:'n800',show:()=>isAdm(),go:()=>P.adminPanel()}); } else if(!P._me&&++hm<60) setTimeout(hook,1500); }catch(e){ if(++hm<60) setTimeout(hook,1500); } }; hook();
    P.dbg=()=>({guests:guests.length,items:items().length,reach:reach.size});
  }
  wait();
})();
