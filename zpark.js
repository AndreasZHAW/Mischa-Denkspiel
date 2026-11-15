/* ═══ ZPark (v803): 🎡 Freizeitpark-Welt – Rebirth 8. Themenpark-Tycoon: Wege, Warteschlangen, Fahrgeschäfte mit Fahrgästen, Achterbahnen, Müll, Personal, Land kaufen + Achterbahn-Editor (Bu:) ═══ */
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
    const U=100;                          // 1 Preis-Einheit = 100 Mischtaler (hier einstellbar)
    const T=4, GM=40, EX=20, EZ=39;       // Kachelgrösse, max. Raster, Eingang
    const fmt=n=>{ n=+n||0; if(n<1e6) return Math.round(n).toLocaleString('de-CH'); const e=Math.floor(Math.log10(n)); return (n/Math.pow(10,e)).toFixed(2)+'×10^'+e; };
    const park=()=>{ const z=zoo(); return z.park||(z.park={v:2,paths:{},items:[],tpl:{},earn:0,rate:0,last:0,seen:0,land:0,staff:{clean:0,mech:0,anim:0},entry:1}); };
    let lastSave=0; const save=f=>{ const n=Date.now(); if(!f&&n-lastSave<4000) return; lastSave=n; try{ ZS.save&&ZS.save(); }catch(e){} };
    const hudMT=()=>{ try{ ZG._updHUD&&ZG._updHUD(); }catch(e){} };
    const rnd=a=>a[Math.random()*a.length|0];

    // ═══════ Land ═══════
    const MAXL=5;
    const landRect=()=>{ const L=Math.min(MAXL,park().land||0); return {x0:10-2*L,x1:29+2*L,z0:20-4*L,z1:39}; };
    const inOwned=(x,z)=>{ const r=landRect(); return x>=r.x0&&x<=r.x1&&z>=r.z0&&z<=r.z1; };
    const landCost=()=>Math.round(300*U*Math.pow(2.2,park().land||0));

    // ═══════ Katalog ═══════
    const loopPts=(w,d,n,amp,k,base)=>{ const o=[]; for(let i=0;i<n;i++){ const a=i/n*Math.PI*2; o.push([(w-1)/2+Math.cos(a)*(w-1)/2,base+amp*(.5+.5*Math.sin(a*k)),(d-1)/2+Math.sin(a)*(d-1)/2]); } return o; };
    const CAT={
      pa:{k:'path',n:'Weg',ic:'🟫',c:1,w:1,d:1}, qu:{k:'path',n:'Warteschlange',ic:'🚧',c:1.5,w:1,d:1,queue:1},
      tr:{k:'deko',n:'Baum',ic:'🌳',c:2,w:1,d:1}, fl:{k:'deko',n:'Blumenbeet',ic:'🌷',c:1.5,w:1,d:1}, be:{k:'deko',n:'Bank',ic:'🪑',c:3,w:1,d:1},
      la:{k:'deko',n:'Laterne',ic:'💡',c:4,w:1,d:1}, mu:{k:'deko',n:'Mülleimer',ic:'🗑️',c:2,w:1,d:1,bin:1}, fo:{k:'deko',n:'Brunnen',ic:'⛲',c:15,w:2,d:2}, st:{k:'deko',n:'Statue',ic:'🗿',c:40,w:1,d:1},
      bu:{k:'food',n:'Burger',ic:'🍔',c:60,w:1,d:1,fee:.6,cd:6,col:0xd84315}, pm:{k:'food',n:'Pommes',ic:'🍟',c:50,w:1,d:1,fee:.5,cd:6,col:0xf9a825},
      ei:{k:'food',n:'Eis',ic:'🍦',c:70,w:1,d:1,fee:.7,cd:6,col:0xec407a}, po:{k:'food',n:'Popcorn',ic:'🍿',c:80,w:1,d:1,fee:.8,cd:6,col:0x7e57c2}, ge:{k:'food',n:'Getränke',ic:'🥤',c:40,w:1,d:1,fee:.4,cd:5,col:0x29b6f6},
      ka:{k:'ride',n:'Karussell',ic:'🎠',c:300,w:2,d:2,fee:2.5,cap:4,run:14}, sc:{k:'ride',n:'Schiffschaukel',ic:'🚢',c:500,w:2,d:2,fee:4,cap:4,run:12},
      au:{k:'ride',n:'Autoscooter',ic:'🚗',c:700,w:3,d:3,fee:5,cap:4,run:16}, rr:{k:'ride',n:'Riesenrad',ic:'🎡',c:1200,w:3,d:3,fee:10,cap:6,run:24}, fa:{k:'ride',n:'Freifallturm',ic:'🗼',c:1500,w:2,d:2,fee:12,cap:4,run:10},
      c1:{k:'coaster',n:'Mini-Achterbahn',ic:'🎢',c:3000,w:5,d:4,fee:20,cap:6,run:26,pc:'CCCRDDDRSSSRSSSR',col:0x43a047},
      c2:{k:'coaster',n:'Wilde Maus',ic:'🎢',c:6000,w:6,d:5,fee:35,cap:6,run:32,pc:'CCCCRDDLSRDDRSSSSSSSRSSSSSSR',col:0xfb8c00},
      c3:{k:'coaster',n:'Mega-Looping',ic:'🎢',c:12000,w:7,d:6,fee:65,cap:8,run:42,pc:'CCCCCCSXXVOSRSSSRSSSSSSSSSSSSSRSSBR',col:0xe53935}
    };
    const STAFF={ clean:{n:'Putzkraft',ic:'🧹',hire:15,wage:1,col:0x1e88e5,d:'räumt Müll auf'}, mech:{n:'Mechaniker',ic:'🔧',hire:40,wage:2,col:0xef6c00,d:'repariert defekte Bahnen'}, anim:{n:'Animateur',ic:'🎭',hire:30,wage:1.5,col:0xd81b60,d:'+6 % Stimmung'} };
    const MAXS=5;
    const TABS=[['path','🟫','Wege'],['deko','🌳','Deko'],['food','🍔','Essen'],['ride','🎠','Fahrgeschäfte'],['coaster','🎢','Achterbahnen'],['staff','👷','Personal']];
    let TPL={};
    const getCat=t=>{ if(CAT[t]) return CAT[t]; if(String(t).indexOf('x:')===0){ const id=t.slice(2), o=TPL[id]||park().tpl[id]; if(o&&o.pc){ const g=genTrack(o.pc,{x:0,z:0,d:o.sd||0}), bb=bboxOf(g.S); return {k:'coaster',n:o.n,ic:'🎢',c:o.c,w:bb.w,d:bb.d,fee:o.fee,cap:8,run:Math.min(46,Math.max(22,Math.round(8+o.fee*.4))),pc:o.pc,sd:o.sd||0,col:o.col||0x8e24aa,custom:1}; } } return null; };
    const allOfKind=k=>{ const a=Object.keys(CAT).filter(t=>CAT[t].k===k); if(k==='coaster') Object.keys(TPL).forEach(id=>a.push('x:'+id)); return a; };
    const price=t=>Math.max(1,Math.round(getCat(t).c*U*(P.CFG.price||1)));

    // ═══════ 3D-Bausteine ═══════
    const mats={}; const M=c=>mats[c]||(mats[c]=new THREE.MeshLambertMaterial({color:c}));
    const box=(w,h,d,c,x,y,z)=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),M(c)); m.position.set(x||0,y||0,z||0); return m; };
    const cyl=(rt,rb,h,c,x,y,z,s)=>{ const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,s||10),M(c)); m.position.set(x||0,y||0,z||0); return m; };
    const sph=(r,c,x,y,z)=>{ const m=new THREE.Mesh(new THREE.SphereGeometry(r,10,8),M(c)); m.position.set(x||0,y||0,z||0); return m; };
    const cone=(r,h,c,x,y,z,s)=>{ const m=new THREE.Mesh(new THREE.ConeGeometry(r,h,s||10),M(c)); m.position.set(x||0,y||0,z||0); return m; };
    const texCache={};
    function emojiSprite(e,sc){ let t=texCache[e]; if(!t){ const c=document.createElement('canvas'); c.width=c.height=96; const g=c.getContext('2d'); g.font='64px serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(e,48,52); t=texCache[e]=new THREE.CanvasTexture(c); } const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false})); s.scale.set(sc||2.4,sc||2.4,1); return s; }
    // Fahrgast-Köpfe auf den Bahnen
    function mkHeads(parent,list){ const hs=list.map(p=>{ const h=new THREE.Mesh(new THREE.SphereGeometry(.38,8,6),new THREE.MeshLambertMaterial({color:0xffcc99})); h.position.set(p[0],p[1],p[2]); h.visible=false; parent.add(h); return h; }); return hs; }
    function setRiders(g,cols){ const hs=g.userData.heads||[]; hs.forEach((h,i)=>{ if(cols&&i<cols.length){ h.visible=true; h.material.color.setHex(cols[i]); } else h.visible=false; }); }
    // ═══════ Achterbahn-Bausteine (Teil für Teil) ═══════
    const DX=[1,0,-1,0], DZ=[0,1,0,-1], LV=1.8, GRAV=9.8, FRIC=.3, ACC=14, BRK=18, LR=5;
    const genCache={};
    function genTrack(pc,st){ const ck=pc+'|'+st.x+'|'+st.z+'|'+st.d; if(genCache[ck]) return genCache[ck];
      let x=st.x,z=st.z,y=0,d=st.d, minY=0, maxY=0; const S=[{x,z,y,ty:'S',pi:-1,lat:null}];
      const push=(xx,zz,yy,ty,pi,lat)=>{ S.push({x:xx,z:zz,y:yy,ty,pi,lat:lat||null}); minY=Math.min(minY,yy); maxY=Math.max(maxY,yy); };
      for(let i=0;i<pc.length;i++){ const ch=pc[i], fx=DX[d], fz=DZ[d], lx=fz, lz=-fx;
        if('SCVBUDX'.indexOf(ch)>=0){ const dy=(ch==='U'||ch==='C')?1:(ch==='D'?-1:(ch==='X'?-3:0)); for(let k=1;k<=4;k++){ const t=k/4; push(x+fx*t,z+fz*t,y+dy*t,ch,i); } x+=fx; z+=fz; y+=dy; }
        else if(ch==='L'||ch==='R'){ const sg=ch==='L'?1:-1, cx=x+sg*lx, cz=z+sg*lz; for(let k=1;k<=8;k++){ const ph=k/8*Math.PI/2; push(cx+(-sg*lx*Math.cos(ph)+fx*Math.sin(ph)),cz+(-sg*lz*Math.cos(ph)+fz*Math.sin(ph)),y,ch,i); } x+=sg*lx+fx; z+=sg*lz+fz; d=ch==='L'?(d+3)%4:(d+1)%4; }
        else if(ch==='O'){ const r=LR/T; for(let k=1;k<=36;k++){ const th=k/36*Math.PI*2; const f=2*th/(Math.PI*2)+r*Math.sin(th); push(x+fx*f,z+fz*f,y+LR*(1-Math.cos(th))/LV,'O',i,[lx,0,lz]); } x+=fx*2; z+=fz*2; } }
      const out={S,end:{x,z,y,d},minY,maxY,pc,st}; if(Object.keys(genCache).length>60) for(const k in genCache) delete genCache[k]; genCache[ck]=out; return out; }
    function bboxOf(S){ let a=1e9,b=-1e9,c=1e9,e=-1e9; S.forEach(p=>{ a=Math.min(a,p.x); b=Math.max(b,p.x); c=Math.min(c,p.z); e=Math.max(e,p.z); }); const x0=Math.floor(a+1e-6), x1=Math.ceil(b-1e-6), z0=Math.floor(c+1e-6), z1=Math.ceil(e-1e-6); return {x0,z0,w:x1-x0+1,d:z1-z0+1}; }
    function simulate(g){ const S=g.S; const pts=S.map(p=>new THREE.Vector3(p.x*T,p.y*LV,p.z*T)); let v2=0,t=0,maxV=0,L=0,drop=0,loops=0,msg=null,bad=-1; const v=[0],V2=[0];
      for(let i=1;i<S.length;i++){ const ds=pts[i].distanceTo(pts[i-1]), dy=pts[i-1].y-pts[i].y, ty=S[i].ty; L+=ds; if(dy>0) drop+=dy;
        if(ty==='C') v2=9; else { v2+=2*GRAV*dy-FRIC*ds; if(ty==='V') v2+=2*ACC*ds; if(ty==='B') v2=Math.max(4,v2-2*BRK*ds); }
        if(v2<.3&&ty!=='C'&&bad<0){ bad=S[i].pi; msg='⚠️ Der Zug bleibt bei Teil '+(bad+1)+' stecken – davor Kettenlift ⛓️ oder Speed ⚡ einbauen, oder flacher bauen.'; }
        V2.push(v2); const vv=Math.sqrt(Math.max(v2,.09)); v.push(vv); maxV=Math.max(maxV,vv); t+=ds/Math.max(vv,1.5); }
      const lp={}; S.forEach((p,i)=>{ if(p.ty==='O'){ const o=lp[p.pi]||(lp[p.pi]={y:-1,i:0}); if(p.y>o.y){ o.y=p.y; o.i=i; } } });
      Object.keys(lp).forEach(k=>{ loops++; if(!msg&&V2[lp[k].i]<GRAV*LR){ bad=+k; msg='⚠️ Zu langsam für den Looping bei Teil '+(+k+1)+' – mehr Höhe oder ⚡ Speed davor.'; } });
      return {ok:!msg,msg,bad,v,T:t,maxV:Math.round(maxV*10)/10,L:Math.round(L),drop:Math.round(drop),loops,maxH:Math.round(g.maxY*LV+1)}; }
    function stats(sim){ const exc=Math.max(1,Math.min(10,+(1+sim.maxV/5+sim.drop/14+sim.loops*1.3+sim.L/120).toFixed(1))); return {exc,c:Math.round(500+exc*600+sim.L*4),fee:Math.round(6+exc*7)}; }
    function isClosed(g){ const e=g.end, s=g.st; return g.pc.length>=6&&Math.abs(e.x-s.x)<1e-6&&Math.abs(e.z-s.z)<1e-6&&Math.abs(e.y)<1e-6&&e.d===s.d; }
    // Strecke bauen: o={cx,cz,closed,col,base}
    function buildTrack(g,o){
      const S=g.S, grp=new THREE.Group(); let pts=S.map(p=>new THREE.Vector3((p.x-o.cx)*T,.9+p.y*LV,(p.z-o.cz)*T)); const types=S.map(p=>p.ty); const lats=[]; let n=pts.length; if(o.closed){ pts.pop(); types.pop(); n--; }
      let prevLat=new THREE.Vector3(0,0,-1);
      for(let i=0;i<n;i++){ if(S[i].lat){ lats.push(new THREE.Vector3(S[i].lat[0],0,S[i].lat[2]).normalize()); continue; } const a=pts[Math.max(0,i-1)], b=pts[Math.min(n-1,i+1)]; let tx=b.x-a.x, tz=b.z-a.z; const l=Math.hypot(tx,tz); if(l>1e-4){ prevLat=new THREE.Vector3(tz/l,0,-tx/l); } lats.push(prevLat.clone()); }
      const tans=pts.map((p,i)=>{ const a=pts[o.closed?(i-1+n)%n:Math.max(0,i-1)], b=pts[o.closed?(i+1)%n:Math.min(n-1,i+1)]; const t=b.clone().sub(a); return t.lengthSq()>1e-8?t.normalize():new THREE.Vector3(1,0,0); });
      const col=o.col||0xe53935;
      if(n>=2){ [-1,1].forEach(sg=>{ const rp=pts.map((p,i)=>p.clone().addScaledVector(lats[i],sg*.55)); const m=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rp,!!o.closed,'catmullrom',.5),n*2,.13,5,!!o.closed),M(col)); grp.add(m); }); }
      // Schwellen + Spezialteile (instanziert)
      const groups={n:[],c:[],v:[],b:[]}; for(let i=0;i<n;i+=2){ const ty=types[i]; (ty==='C'?groups.c:ty==='V'?groups.v:ty==='B'?groups.b:groups.n).push(i); }
      const cols={n:0x4e342e,c:0xfdd835,v:0xff7043,b:0xd32f2f}, tg=new THREE.BoxGeometry(1.5,.14,.4), mm=new THREE.Matrix4(), up=new THREE.Vector3(), q=new THREE.Quaternion();
      Object.keys(groups).forEach(k=>{ const L=groups[k]; if(!L.length) return; const im=new THREE.InstancedMesh(tg,M(cols[k]),L.length); L.forEach((i,j)=>{ up.crossVectors(lats[i],tans[i]).normalize(); mm.makeBasis(lats[i],up,tans[i]); q.setFromRotationMatrix(mm); mm.compose(pts[i].clone().addScaledVector(up,-.12),q,new THREE.Vector3(k==='n'?1:1.35,k==='n'?1:1.6,k==='n'?1:1.8)); im.setMatrixAt(j,mm); }); grp.add(im); });
      // Stützen
      const sup=[]; for(let i=0;i<n;i+=3){ if(types[i]!=='O'&&pts[i].y>1.6) sup.push(i); }
      if(sup.length){ const im=new THREE.InstancedMesh(new THREE.BoxGeometry(.3,1,.3),M(0x8d6e63),sup.length); sup.forEach((i,j)=>{ const h=pts[i].y-.35; mm.compose(new THREE.Vector3(pts[i].x,h/2+.1,pts[i].z),new THREE.Quaternion(),new THREE.Vector3(1,h,1)); im.setMatrixAt(j,mm); }); grp.add(im); }
      { const p0=pts[0], d0=g.st.d; const sb=box(5,.4,2.2,0x78909c,p0.x,.3,p0.z); sb.rotation.y=-d0*Math.PI/2; grp.add(sb); }
      if(o.base) grp.add(box(o.w*T,.25,o.d*T,0xcdb892,0,.05,0));
      // Zug (nur geschlossene Strecken)
      const carts=[], hz=[]; const out={g:grp,carts};
      if(o.closed&&n>=6){ const sim=o.sim||simulate(g); const cur=new THREE.CatmullRomCurve3(pts,true,'catmullrom',.5); const Ln=cur.getLength(); for(let k=0;k<4;k++){ const c=box(1.3,.7,.9,k?0x1565c0:0xffd54f,0,0,0); grp.add(c); carts.push(c); hz.push(...mkHeads(c,[[-.3,.65,0],[.3,.65,0]])); }
        const prof=sim.v.slice(0,n); let u=0, was=false, done=false;
        grp.userData.anim=(t,dt,act,loop,runT)=>{ if(act&&!was){ u=0; done=false; } was=act;
          if((act||loop)&&!done){ const vv=Math.max(2,prof[Math.min(n-1,Math.floor(u*n))]||2); const k=runT?sim.T/Math.max(8,runT-6):1; u+=vv*k*dt/Ln; if(u>=1){ if(loop) u-=1; else { u=0; done=true; } } }
          carts.forEach((c,k)=>{ const uu=((u-k*.012)%1+1)%1, a=cur.getPointAt(uu), b=cur.getPointAt((uu+.003)%1); c.position.set(a.x,a.y+.5,a.z); c.lookAt(b.x,b.y+.5,b.z); }); };
        grp.userData.cur=cur; grp.userData.heads=hz; }
      return grp; }
    function coasterModel(ct){ const g=genTrack(ct.pc,{x:0,z:0,d:ct.sd||0}); const bb=bboxOf(g.S); return buildTrack(g,{cx:bb.x0+(bb.w-1)/2,cz:bb.z0+(bb.d-1)/2,closed:true,col:ct.col,base:true,w:bb.w,d:bb.d}); }
    // Vorgaben-Masse aus den Bauteilen
    ['c1','c2','c3'].forEach(k=>{ const c=CAT[k], g=genTrack(c.pc,{x:0,z:0,d:0}), bb=bboxOf(g.S); c.w=bb.w; c.d=bb.d; });
    function model(t){
      const ct=getCat(t), g=new THREE.Group(), w=ct.w, d=ct.d; g.userData.anim=null;
      switch(ct.k==='coaster'?'coaster':t){
        case 'tr': g.add(cyl(.4,.5,2.4,0x6d4c41,0,1.2,0)); g.add(cone(2,3,0x2e7d32,0,3.6,0,8)); g.add(cone(1.5,2.4,0x43a047,0,5,0,8)); break;
        case 'fl': g.add(box(3,.3,3,0x5d4037,0,.15,0)); [[-.8,-.8,0xec407a],[.8,-.6,0xffeb3b],[-.5,.8,0xff7043],[.9,.9,0xab47bc]].forEach(a=>g.add(sph(.4,a[2],a[0],.7,a[1]))); break;
        case 'be': g.add(box(2.4,.3,.9,0x8d6e63,0,.8,0)); g.add(box(2.4,.8,.2,0x6d4c41,0,1.3,-.4)); g.add(box(.2,.8,.7,0x424242,-1,.4,0)); g.add(box(.2,.8,.7,0x424242,1,.4,0)); break;
        case 'la': g.add(cyl(.12,.15,4,0x37474f,0,2,0)); g.add(sph(.55,0xfff59d,0,4.2,0)); break;
        case 'mu': g.add(cyl(.7,.6,1.6,0x2e7d32,0,.8,0,8)); g.add(cyl(.78,.78,.2,0x1b5e20,0,1.7,0,8)); break;
        case 'fo': g.add(cyl(3,3.2,.8,0xb0bec5,0,.4,0,16)); g.add(cyl(2.6,2.6,.85,0x4fc3f7,0,.42,0,16)); g.add(cyl(.35,.45,2.2,0xcfd8dc,0,1.5,0)); g.add(sph(.6,0x81d4fa,0,2.8,0)); break;
        case 'st': g.add(box(1.6,1.4,1.6,0x90a4ae,0,.7,0)); g.add(cyl(.45,.6,1.8,0xffd54f,0,2.3,0)); g.add(sph(.5,0xffd54f,0,3.5,0)); break;
        case 'bu': case 'pm': case 'ei': case 'po': case 'ge': g.add(box(2.6,1.8,2.6,0xfff8e1,0,.9,0)); { const r=cone(2.3,1.3,ct.col,0,2.5,0,4); r.rotation.y=Math.PI/4; g.add(r); } g.add(box(2.7,.5,.4,ct.col,0,1.5,1.4)); { const s=emojiSprite(ct.ic,1.8); s.position.set(0,4.2,0); g.add(s); } break;
        case 'ka': { g.add(cyl(3.4,3.6,.4,0xbcaaa4,0,.2,0,18)); const r=new THREE.Group(); r.add(cyl(.25,.25,3,0xffd54f,0,1.9,0)); const hp=[]; for(let i=0;i<6;i++){ const a=i/6*6.283; r.add(cyl(.08,.08,2,0xffd54f,Math.cos(a)*2.3,1.6,Math.sin(a)*2.3)); r.add(box(.8,.9,.5,i%2?0xe91e63:0x2196f3,Math.cos(a)*2.3,1.1,Math.sin(a)*2.3)); hp.push([Math.cos(a)*2.3,1.8,Math.sin(a)*2.3]); } r.add(cone(3.2,1.4,0xe53935,0,3.9,0,18)); g.add(r); g.userData.heads=mkHeads(r,hp); g.userData.anim=(tt,dt,act)=>{ r.rotation.y+=dt*(act?1.6:.0); }; break; }
        case 'sc': { g.add(box(.5,5,.5,0x6d4c41,-2.3,2.5,0)); g.add(box(.5,5,.5,0x6d4c41,2.3,2.5,0)); const sw=new THREE.Group(); sw.position.set(0,4.6,0); sw.add(box(.2,3.6,.2,0x9e9e9e,0,-1.8,0)); sw.add(box(4.2,.7,1.4,0xc62828,0,-3.6,0)); g.add(sw); g.userData.heads=mkHeads(sw,[[-1.4,-3,0],[-.5,-3,0],[.5,-3,0],[1.4,-3,0]]); g.userData.anim=(tt,dt,act)=>{ sw.rotation.z=act?Math.sin(tt*2.2)*.8:0; }; break; }
        case 'au': { g.add(box(w*T-1,.2,d*T-1,0x607d8b,0,.1,0)); const cars=[], hp=[]; for(let i=0;i<4;i++){ const c=box(1.2,.7,.9,[0xe53935,0x1e88e5,0xfdd835,0x43a047][i],(i%2?2:-2),.55,(i<2?-2:2)); g.add(c); cars.push(c); } g.add(box(w*T-1,.3,.3,0xffee58,0,5,0)); g.userData.heads=[]; cars.forEach(c=>{ g.userData.heads.push(...mkHeads(c,[[0,.7,0]])); }); g.userData.anim=(tt,dt,act)=>{ cars.forEach((c,i)=>{ if(act){ c.position.x=Math.cos(tt*.8+i*1.7)*3.5; c.position.z=Math.sin(tt*.7+i*2.3)*3.5; c.rotation.y=tt+i; } }); }; break; }
        case 'rr': { g.add(box(.5,9,.5,0x546e7a,-1.8,4.5,0)); g.add(box(.5,9,.5,0x546e7a,1.8,4.5,0)); const wh=new THREE.Group(); wh.position.y=9; wh.add(new THREE.Mesh(new THREE.TorusGeometry(7,.2,6,28),M(0xeceff1))); const gds=[]; g.userData.heads=[]; for(let i=0;i<8;i++){ const a=i/8*6.283; const sp=box(14,.1,.1,0xcfd8dc,0,0,0); sp.rotation.z=a; wh.add(sp); const gd=box(1.2,1,.9,[0xe53935,0x1e88e5,0xfdd835,0x43a047][i%4],Math.cos(a)*7,Math.sin(a)*7,0); wh.add(gd); gds.push(gd); g.userData.heads.push(...mkHeads(gd,[[0,.7,0]])); } g.add(wh); g.userData.anim=(tt,dt,act)=>{ wh.rotation.z+=dt*(act?.5:.0); gds.forEach(c=>{ c.rotation.z=-wh.rotation.z; }); }; break; }
        case 'fa': { g.add(box(1.2,16,1.2,0x78909c,0,8,0)); const ring=new THREE.Group(); ring.position.y=2; ring.add(box(2.6,.8,2.6,0xe53935,0,0,0)); g.userData.heads=mkHeads(ring,[[-.9,.7,-.9],[.9,.7,-.9],[-.9,.7,.9],[.9,.7,.9]]); g.add(ring); g.add(cone(1.2,2,0xffd54f,0,17,0,8)); g.userData.anim=(tt,dt,act)=>{ ring.position.y=act?(3+(1+Math.sin(tt*1.6))*6):2; }; break; }
        case 'coaster': return coasterModel(ct);
      }
      return g;
    }

    // ═══════ Welt & Simulation ═══════
    let ov,cv,R,S,CAM,parkG,landG,pathG,itemG,guestG,staffG,litG,gridH,edG,ghostG,hudEl,raf=0,last=0,tnow=0;
    let tgt={x:0,z:0}, yaw=0, dist=100; const PITCH=.95;
    let mode={k:'view',t:null,r:0}; let tab='path';
    const items=()=>park().items;
    const key=(x,z)=>x+','+z; const unk=k=>k.split(',').map(Number);
    const DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
    let occ={}, dist0={}, reach=new Set(), acc={}, joinAt={}, RIDES=[], objs=[], guests=[], staffL=[], decoN=new Map(), binNear=new Set(), LIT={}, stat={g:0,rate:0,win:[],hap:1,att:0,deco:0};
    const RS=new WeakMap(); const rsOf=it=>{ let s=RS.get(it); if(!s){ s={q:[],ph:'idle',t:0,riders:[],broken:false,cd:0}; RS.set(it,s); } return s; };
    const dims=(t,r)=>{ const c=getCat(t); return (r&1)?[c.d,c.w]:[c.w,c.d]; };
    const wpos=(tx,tz)=>[(tx+.5-GM/2)*T,(tz+.5-GM/2)*T];
    const center=(it)=>{ const [w,d]=dims(it.t,it.r); return [it.x+(w-1)/2,it.z+(d-1)/2]; };
    function recalc(){
      const pk=park(); occ={}; Object.keys(pk.paths).forEach(k=>{ occ[k]='p'; });
      pk.items.forEach((it,i)=>{ const [w,d]=dims(it.t,it.r); for(let a=0;a<w;a++) for(let b=0;b<d;b++) occ[key(it.x+a,it.z+b)]=i+1; });
      dist0={}; reach=new Set(); const E=key(EX,EZ);
      if(pk.paths[E]){ dist0[E]=0; const q=[[EX,EZ]]; while(q.length){ const [x,z]=q.shift(); reach.add(key(x,z)); DIRS.forEach(d=>{ const k=key(x+d[0],z+d[1]); if(pk.paths[k]&&dist0[k]==null){ dist0[k]=dist0[key(x,z)]+1; q.push([x+d[0],z+d[1]]); } }); } }
      acc={}; joinAt={}; RIDES=[]; decoN=new Map(); binNear=new Set();
      const deko=pk.items.filter(it=>{ const c=getCat(it.t); return c&&c.k==='deko'; });
      deko.forEach(it=>{ if(getCat(it.t).bin) for(let a=-3;a<=3;a++) for(let b=-3;b<=3;b++) binNear.add(key(it.x+a,it.z+b)); });
      pk.items.forEach((it,i)=>{ const c=getCat(it.t); if(!c||c.k==='deko') return; const [w,d]=dims(it.t,it.r), [cx,cz]=center(it);
        let n=0; deko.forEach(o=>{ if(Math.abs(o.x-cx)<=w/2+3&&Math.abs(o.z-cz)<=d/2+3) n++; }); decoN.set(i,Math.min(.6,n*.05));
        const ring=[]; for(let a=-1;a<=w;a++) for(let b=-1;b<=d;b++){ if((a>=0&&a<w)&&(b>=0&&b<d)) continue; if((a<0||a>=w)&&(b<0||b>=d)) continue; ring.push(key(it.x+a,it.z+b)); }
        if(c.k==='food'){ ring.forEach(k=>{ if(reach.has(k)&&pk.paths[k]===1) (acc[k]||(acc[k]=[])).push(i); }); return; }
        // Fahrgeschäft: Warteschlange suchen
        const rs=rsOf(it), Rd={i,it,c,rs,line:[],dq:{},max:0,op:false,cap2:0,ctr:[cx,cz],lab:null}; rs.R=Rd;
        const seeds=ring.filter(k=>pk.paths[k]===2); const dq={}; const q=[]; seeds.forEach(k=>{ dq[k]=0; q.push(k); });
        while(q.length){ const k=q.shift(), [x,z]=unk(k); Rd.line.push(k); DIRS.forEach(dd=>{ const n=key(x+dd[0],z+dd[1]); if(pk.paths[n]===2&&dq[n]==null){ dq[n]=dq[k]+1; q.push(n); } }); }
        Rd.dq=dq; Rd.max=Rd.line.length?Math.max.apply(null,Rd.line.map(k=>dq[k])):0; Rd.cap2=(Rd.max+1)*2;
        Rd.line.forEach(k=>{ const [x,z]=unk(k); DIRS.forEach(dd=>{ const n=key(x+dd[0],z+dd[1]); if(pk.paths[n]===1&&reach.has(n)){ (joinAt[n]||(joinAt[n]=[])).push({R:Rd,q:k}); } }); });
        Rd.op=Rd.line.length>0&&Rd.line.some(k=>reach.has(k))&&Object.keys(joinAt).some(n=>joinAt[n].some(j=>j.R===Rd));
        RIDES.push(Rd); });
    }
    function rebuild(){
      while(pathG.children.length) pathG.remove(pathG.children[0]); while(itemG.children.length) itemG.remove(itemG.children[0]); objs=[];
      const pk=park(); const geo=new THREE.BoxGeometry(T,.15,T), post=new THREE.BoxGeometry(.25,1.1,.25);
      Object.keys(pk.paths).forEach(k=>{ const [x,z]=unk(k); const qn=pk.paths[k]===2; const m=new THREE.Mesh(geo,M(qn?(reach.has(k)?0x90a4ae:0x78909c):(reach.has(k)?0xd7c29a:0xb08f6a))); const p=wpos(x,z); m.position.set(p[0],.07,p[1]); pathG.add(m);
        if(qn){ [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(c=>{ const s=new THREE.Mesh(post,M(0xfdd835)); s.position.set(p[0]+c[0]*1.7,.6,p[1]+c[1]*1.7); pathG.add(s); }); } });
      pk.items.forEach((it,i)=>{ const c=getCat(it.t); if(!c) return; const g=model(it.t); const [w,d]=dims(it.t,it.r); const [cx,cz]=center(it); const p=wpos(cx,cz); g.position.set(p[0],0,p[1]); g.rotation.y=-(it.r||0)*Math.PI/2; itemG.add(g);
        const o={i,g,it,c}; if(c.k==='ride'||c.k==='coaster'){ const Rd=RIDES.find(r=>r.it===it); o.R=Rd; if(Rd){ const lab=makeLabel(); lab.s.position.set(p[0],(c.k==='coaster'?15:(it.t==='rr'?20:(it.t==='fa'?21:8))),p[1]); itemG.add(lab.s); o.lab=lab; Rd.lab=lab; } } objs.push(o); });
    }
    function makeLabel(){ const c=document.createElement('canvas'); c.width=128; c.height=64; const t=new THREE.CanvasTexture(c); const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false})); s.scale.set(6,3,1); return {s,c,t,txt:''}; }
    function labelSet(l,txt,col){ if(l.txt===txt) return; l.txt=txt; const g=l.c.getContext('2d'); g.clearRect(0,0,128,64); g.fillStyle='rgba(20,20,50,.75)'; g.fillRect(4,10,120,44); g.fillStyle=col||'#fff'; g.font='bold 26px Arial'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(txt,64,33); l.t.needsUpdate=true; }
    function relayout(){ recalc(); rebuild(); }
    function drawLand(){ while(landG.children.length) landG.remove(landG.children[0]); const r=landRect(); const w=(r.x1-r.x0+1)*T, d=(r.z1-r.z0+1)*T; const cx=(r.x0+r.x1+1)/2, cz=(r.z0+r.z1+1)/2; const pg=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({color:0x7ccf63})); pg.rotation.x=-Math.PI/2; pg.position.set((cx-GM/2)*T,-.02,(cz-GM/2)*T); landG.add(pg);
      const px=(cx-GM/2)*T, pz=(cz-GM/2)*T; [[0,-d/2,w,.3],[0,d/2,w,.3],[-w/2,0,.3,d],[w/2,0,.3,d]].forEach(a=>landG.add(box(a[2],1.2,a[3],0x8d6e63,px+a[0],.6,pz+a[1])));
      // Raster
      const pts=[]; for(let x=r.x0;x<=r.x1+1;x++){ pts.push(new THREE.Vector3((x-GM/2)*T,.06,(r.z0-GM/2)*T),new THREE.Vector3((x-GM/2)*T,.06,(r.z1+1-GM/2)*T)); } for(let z=r.z0;z<=r.z1+1;z++){ pts.push(new THREE.Vector3((r.x0-GM/2)*T,.06,(z-GM/2)*T),new THREE.Vector3((r.x1+1-GM/2)*T,.06,(z-GM/2)*T)); }
      const v=gridH?gridH.visible:false; if(gridH) S.remove(gridH); gridH=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.3})); gridH.visible=v; S.add(gridH);
      if((park().land||0)<MAXL){ const s=emojiSprite('🏞️',5); s.position.set(px,6,(r.z0-GM/2)*T-3); landG.add(s); } }
    function build(){
      if(S) return; R=new THREE.WebGLRenderer({canvas:cv,antialias:false}); R.setPixelRatio(Math.min(devicePixelRatio||1,2)); S=new THREE.Scene(); S.background=new THREE.Color(0x9fd8ff); S.fog=new THREE.Fog(0x9fd8ff,200,520);
      CAM=new THREE.PerspectiveCamera(50,1,.5,1100); S.add(new THREE.AmbientLight(0xffffff,.78)); const dl=new THREE.DirectionalLight(0xfff2cc,.65); dl.position.set(50,100,30); S.add(dl);
      const gr=new THREE.Mesh(new THREE.PlaneGeometry(1200,1200),new THREE.MeshBasicMaterial({color:0x4f9a3d})); gr.rotation.x=-Math.PI/2; gr.position.y=-.05; S.add(gr);
      const gp=wpos(EX,EZ); const gate=new THREE.Group(); gate.add(box(.8,6,.8,0xffd54f,-T,3,0)); gate.add(box(.8,6,.8,0xffd54f,T,3,0)); gate.add(box(T*2+.8,1.4,1,0xe53935,0,6,0)); const sp=emojiSprite('🎡',3); sp.position.set(0,8.2,0); gate.add(sp); gate.position.set(gp[0],0,gp[1]+T*.6); S.add(gate);
      parkG=new THREE.Group(); landG=new THREE.Group(); pathG=new THREE.Group(); itemG=new THREE.Group(); guestG=new THREE.Group(); staffG=new THREE.Group(); litG=new THREE.Group(); ghostG=new THREE.Group(); edG=new THREE.Group(); parkG.add(landG,pathG,itemG,guestG,staffG,litG); S.add(parkG,ghostG,edG);
      for(let i=0;i<40;i++){ const a=i/40*6.283, r=GM*T/2+14+Math.random()*40; const t=new THREE.Group(); t.add(cyl(.4,.5,2.4,0x6d4c41,0,1.2,0)); t.add(cone(2,3.2,0x2e7d32,0,3.6,0,8)); t.position.set(Math.cos(a)*r,0,Math.sin(a)*r); S.add(t); }
      drawLand(); onResize();
    }
    function onResize(){ if(!R) return; const w=innerWidth, h=innerHeight; R.setSize(w,h,false); cv.style.width=w+'px'; cv.style.height=h+'px'; CAM.aspect=w/h; CAM.updateProjectionMatrix(); }
    function camUpdate(){ const c=Math.cos(PITCH), s=Math.sin(PITCH); CAM.position.set(tgt.x+Math.sin(yaw)*c*dist,s*dist,tgt.z+Math.cos(yaw)*c*dist); CAM.lookAt(tgt.x,0,tgt.z); }
    function centerCam(){ const r=landRect(); const p=wpos((r.x0+r.x1)/2,(r.z0+r.z1)/2+ (r.z1-r.z0)*.1); tgt={x:p[0],z:p[1]}; dist=60+(park().land||0)*12; }
    const ray=new THREE.Raycaster(), pl=new THREE.Plane(new THREE.Vector3(0,1,0),0), hit=new THREE.Vector3();
    function ground(cx,cy){ const r=cv.getBoundingClientRect(); const v=new THREE.Vector2(((cx-r.left)/r.width)*2-1,-((cy-r.top)/r.height)*2+1); ray.setFromCamera(v,CAM); return ray.ray.intersectPlane(pl,hit)?hit.clone():null; }
    const tileAt=p=>p?[Math.floor(p.x/T+GM/2),Math.floor(p.z/T+GM/2)]:null;

    // ═══════ Bauen ═══════
    function canPlace(t,x,z,r){ const c=getCat(t); if(!c) return false; const [w,d]=dims(t,r); const pk=park();
      for(let a=0;a<w;a++) for(let b=0;b<d;b++){ const X=x+a, Z=z+b; if(!inOwned(X,Z)) return false; const o=occ[key(X,Z)];
        if(c.k==='path'){ if(o&&o!=='p') return false; if(o==='p'&&pk.paths[key(X,Z)]===(c.queue?2:1)) return false; if(c.queue&&X===EX&&Z===EZ) return false; }
        else { if(o) return false; if(X===EX&&Z===EZ) return false; } }
      return true; }
    function spend(n){ const z=zoo(); if((z.mt||0)<n){ toast('💰 Zu wenig Mischtaler ('+fmt(n)+' nötig)'); return false; } z.mt-=n; hudMT(); return true; }
    function gain(n){ const z=zoo(); z.mt=(z.mt||0)+n; const pk=park(); pk.earn=(pk.earn||0)+n; hudMT(); }
    function place(t,x,z,r){ const c=getCat(t); if(!c||!canPlace(t,x,z,r)) return false; if(!spend(price(t))) return false; const pk=park();
      if(c.k==='path') pk.paths[key(x,z)]=c.queue?2:1; else { const it={t,x,z,r:r||0}; if(c.custom){ const id=t.slice(2); pk.tpl[id]={n:c.n,c:c.c,w:c.w,d:c.d,fee:c.fee,pts:c.pts,col:c.col}; } pk.items.push(it); }
      relayout(); save(true); hudRefresh(); return true; }
    function releaseAll(rs){ (rs.q||[]).concat(rs.riders||[]).forEach(o=>{ o.g.visible=true; o.st='walk'; o.ex=true; o.rs=null; }); rs.q=[]; rs.riders=[]; rs.ph='idle'; }
    function remove(x,z){ const k=key(x,z), o=occ[k], pk=park(); if(!o) return false;
      if(o==='p'){ if(x===EX&&z===EZ){ toast('Der Eingang bleibt.'); return true; } const qn=pk.paths[k]===2; delete pk.paths[k]; gain(price(qn?'qu':'pa')*.5); }
      else { const it=pk.items[o-1]; const rs=RS.get(it); if(rs) releaseAll(rs); gain(price(it.t)*.5); pk.items.splice(o-1,1); }
      relayout(); save(true); hudRefresh(); return true; }
    function info(x,z){ const k=key(x,z);
      if(LIT[k]){ cleanLitter(k); toast('🧹 Müll aufgeräumt',1500); return; }
      const o=occ[k]; if(!o||o==='p') return; const it=park().items[o-1], c=getCat(it.t), rs=RS.get(it), Rd=rs&&rs.R;
      if(Rd&&rs.broken){ rs.broken=false; toast('🔧 '+c.n+' repariert',2000); return; }
      let s=c.ic+' '+c.n; if(c.k==='ride'||c.k==='coaster'){ s+=' · '+fmt(c.fee*U*.6)+' pro Fahrgast · Platz für '+c.cap; if(!Rd||!Rd.op) s+=' · ⚠️ Warteschlange fehlt (🚧 an die Bahn bauen und mit einem Weg verbinden)'; else s+=' · Schlange: '+rs.q.length; } else if(c.fee) s+=' · '+fmt(c.fee*U)+' pro Kauf'; toast(s,4500); }

    // ═══════ Müll ═══════
    function addLitter(k){ if(LIT[k]||Object.keys(LIT).length>=45) return; const [x,z]=unk(k); const p=wpos(x,z); const m=new THREE.Group(); for(let i=0;i<3;i++){ const b=box(.55,.2,.45,rnd([0xef5350,0xffee58,0xbdbdbd,0x8d6e63]),(Math.random()-.5)*2.4,.2,(Math.random()-.5)*2.4); b.rotation.y=Math.random()*3; m.add(b); } m.position.set(p[0],0,p[1]); litG.add(m); LIT[k]=m; }
    function cleanLitter(k){ const m=LIT[k]; if(!m) return; litG.remove(m); delete LIT[k]; }
    const litN=()=>Object.keys(LIT).length;
    function happy(){ const an=park().staff.anim||0; return Math.max(.4,Math.min(1.45,1-litN()*.025+an*.06-Math.min(.25,RIDES.reduce((s,r)=>s+(r.rs.q.length>r.cap2*.9?.05:0),0)))); }

    // ═══════ Besucher ═══════
    const COLS=[0xe53935,0x1e88e5,0xfdd835,0x43a047,0x8e24aa,0xff7043,0x26c6da];
    function spawnGuest(){ const g=new THREE.Group(); const col=rnd(COLS); g.add(cyl(.45,.5,1.3,col,0,.8,0)); g.add(sph(.4,0xffcc99,0,1.8,0)); guestG.add(g); const o={g,col,x:EX,z:EZ,tx:EX,tz:EZ,px:-1,pz:-1,wait:0,sp:1.1+Math.random()*.4,born:Date.now(),life:80000+Math.random()*90000,leave:false,st:'walk',lit:0,ex:false}; guests.push(o); placeG(o);
      const fee=[0,2,5,10,20][park().entry||0]*U; if(fee>0) gain(fee); }
    function placeG(o){ const p=wpos(o.x,o.z); o.g.position.set(p[0],0,p[1]); }
    function bubble(o,e){ if(o.bub||!ov) return; const s=emojiSprite(e,1.7); s.position.set(0,3.2,0); o.g.add(s); o.bub={s,t:2.2}; }
    function nextTile(o){ const pk=park(), cx=Math.round(o.x), cz=Math.round(o.z); const nb=[]; DIRS.forEach(d=>{ const nk=key(cx+d[0],cz+d[1]); if(reach.has(nk)) nb.push([cx+d[0],cz+d[1],nk]); }); if(!nb.length) return null;
      if(o.leave){ nb.sort((a,b)=>dist0[a[2]]-dist0[b[2]]); return nb[0]; }
      if(o.ex){ const nm=nb.filter(n=>pk.paths[n[2]]===1); if(nm.length) return rnd(nm); const rd=o.rd; nb.sort((a,b)=>((rd&&rd.dq[b[2]])||0)-((rd&&rd.dq[a[2]])||0)); return nb[0]; }
      const nm=nb.filter(n=>pk.paths[n[2]]===1); if(!nm.length) return nb[0]; const f=nm.filter(n=>!(n[0]===o.px&&n[1]===o.pz)); return rnd(f.length?f:nm); }
    function arrive(o){ const pk=park(), cx=Math.round(o.x), cz=Math.round(o.z), k=key(cx,cz); if(!reach.has(k)){ o.dead=1; return; } if(o.leave&&dist0[k]===0){ o.dead=1; return; }
      const norm=pk.paths[k]===1; if(o.ex&&norm) o.ex=false; if(!o.leave&&Date.now()-o.born>o.life) o.leave=true;
      if(norm){
        if(o.lit&&binNear.has(k)&&Math.random()<.7){ o.lit=0; }
        else if(o.lit&&Math.random()<.45){ o.lit=0; addLitter(k); }
        else if(!o.lit&&!binNear.has(k)&&Math.random()<.01){ addLitter(k); }
        if(litN()>9&&Math.random()<.06) bubble(o,'🤢');
        if(!o.leave){
          const js=joinAt[k]; if(js&&Math.random()<.6){ const ok=js.filter(j=>j.R.op&&!j.R.rs.broken&&j.R.rs.q.length<j.R.cap2); if(ok.length){ const j=rnd(ok); j.R.rs.q.push(o); o.st='queue'; o.rs=j.R.rs; o.qe=unk(j.q); o.qt=0; o.qin=false; return; } }
          const ac=acc[k]; if(ac&&Math.random()<.5){ const now=Date.now(); const cand=ac.filter(i=>{ const it=pk.items[i]; return it&&rsOf(it).cd<now; }); if(cand.length){ const i=rnd(cand), it=pk.items[i], c=getCat(it.t); const pay=c.fee*U*(1+(decoN.get(i)||0))*happy()*incMul(); rsOf(it).cd=now+c.cd*1000; gain(pay); noteWin(pay); pop('+'+fmt(pay),o.g.position); if(Math.random()<.7) o.lit=1; o.wait=1.5; o.px=cx; o.pz=cz; const nx=nextTile(o); if(nx){ o.tx=nx[0]; o.tz=nx[1]; } return; } } } }
      const nx=nextTile(o); if(!nx){ o.wait=1; return; } o.px=cx; o.pz=cz; o.tx=nx[0]; o.tz=nx[1]; }
    const incMul=()=>{ const sk=(window.ZSkill&&ZSkill.m)?ZSkill.m('money'):1; return (P.CFG.inc||1)*sk*(Date.now()<fwUntil?1.5:1); };
    let fwUntil=0;
    function noteWin(v){ stat.win.push([Date.now(),v]); }
    function moveTo(o,tx,tz,dt,sp){ const dx=tx-o.x, dz=tz-o.z, d=Math.hypot(dx,dz), s=(sp||o.sp)*dt; if(d<=s||d<1e-4){ o.x=tx; o.z=tz; placeG(o); return true; } o.x+=dx/d*s; o.z+=dz/d*s; o.g.rotation.y=Math.atan2(dx,dz); placeG(o); return false; }
    function stepGuest(o,dt){
      if(o.bub){ o.bub.t-=dt; if(o.bub.t<=0){ o.g.remove(o.bub.s); o.bub=null; } }
      if(o.st==='ride') return;
      if(o.st==='board'){ const R=o.rs&&o.rs.R; if(R) moveTo(o,R.ctr[0],R.ctr[1],dt,1.8); return; }
      if(o.st==='queue'){ const rs=o.rs, R=rs&&rs.R; const idx=rs?rs.q.indexOf(o):-1; if(!R||idx<0){ o.st='walk'; o.ex=true; return; }
        o.qt+=dt; if(o.qt>100){ rs.q.splice(idx,1); o.st='walk'; o.ex=true; o.rd=R; bubble(o,'😠'); return; }
        const cx=Math.round(o.x), cz=Math.round(o.z), k=key(cx,cz), d=R.dq[k];
        if(d==null){ if(o.qin){ rs.q.splice(idx,1); o.st='walk'; o.ex=true; return; } moveTo(o,o.qe[0],o.qe[1],dt); return; }
        o.qin=true; const lvl=Math.floor(idx/2);
        if(d>lvl){ let best=null; DIRS.forEach(dd=>{ const nk=key(cx+dd[0],cz+dd[1]); if(R.dq[nk]===d-1) best=[cx+dd[0],cz+dd[1]]; }); if(best) moveTo(o,best[0],best[1],dt,1.5); }
        else { const off=idx%2?.22:-.22; moveTo(o,cx+off,cz+off,dt,1.5); }
        return; }
      if(o.wait>0){ o.wait-=dt; return; }
      const dx=o.tx-o.x, dz=o.tz-o.z, d=Math.hypot(dx,dz), s=o.sp*dt; if(d<=s||d<1e-4){ o.x=o.tx; o.z=o.tz; placeG(o); arrive(o); } else { o.x+=dx/d*s; o.z+=dz/d*s; o.g.rotation.y=Math.atan2(dx,dz); placeG(o); } }
    let spawnT=0;
    function guestsTick(dt){
      const pk=park(); let nAtt=0, nDeco=0; pk.items.forEach((it,i)=>{ const c=getCat(it.t); if(!c) return; if(c.k==='deko') nDeco++; else if(c.k==='food'){ if(Object.keys(acc).some(k=>acc[k].indexOf(i)>=0)) nAtt+=.5; } });
      RIDES.forEach(r=>{ if(r.op) nAtt+=1; });
      const ef=[1.3,1,.85,.65,.45][pk.entry||0]; const hap=happy(); const target=reach.size&&pk.paths[key(EX,EZ)]?Math.min(48,Math.round((3+nAtt*3+nDeco*.3)*hap*ef)):0;
      spawnT-=dt; if(spawnT<=0&&guests.length<target){ spawnGuest(); spawnT=1.4; }
      for(let i=guests.length-1;i>=0;i--){ const o=guests[i]; stepGuest(o,dt); if(o.dead||(o.st==='walk'&&guests.length>target+4&&Date.now()-o.born>20000&&!o.leave&&Math.random()<.01)){ if(o.rs){ const q=o.rs.q.indexOf(o); if(q>=0) o.rs.q.splice(q,1); } guestG.remove(o.g); guests.splice(i,1); } }
      const now=Date.now(); stat.win=stat.win.filter(a=>now-a[0]<60000); stat.rate=stat.win.reduce((s,a)=>s+a[1],0); stat.g=guests.length; stat.att=nAtt; stat.deco=nDeco; stat.hap=hap; }
    function pop(txt,p){ if(!ov||!CAM) return; const v=new THREE.Vector3(p.x,3,p.z); v.project(CAM); if(v.z>1) return; const e=document.createElement('div'); e.textContent=txt; e.style.cssText='position:absolute;pointer-events:none;color:#ffd54f;font:900 .8rem Arial;text-shadow:0 1px 3px #000;left:'+((v.x*.5+.5)*innerWidth)+'px;top:'+((-v.y*.5+.5)*innerHeight)+'px;transition:all 1.1s;opacity:1;z-index:2'; ov.appendChild(e); requestAnimationFrame(()=>{ e.style.top=(parseFloat(e.style.top)-40)+'px'; e.style.opacity='0'; }); setTimeout(()=>e.remove(),1200); }

    // ═══════ Fahrgeschäfte (Warteschlange → Einsteigen → Fahrt → Aussteigen) ═══════
    function rideTick(Rd,dt){ const rs=Rd.rs, c=Rd.c; if(!Rd.op) return; if(rs.broken) return;
      if(rs.ph==='idle'){ if(rs.q.length&&Date.now()>=rs.cd){ if(Math.random()<.035){ rs.broken=true; return; } rs.riders=rs.q.splice(0,c.cap); rs.riders.forEach(o=>{ o.st='board'; }); rs.ph='load'; rs.t=3; } }
      else if(rs.ph==='load'){ rs.t-=dt; if(rs.t<=0){ rs.riders.forEach(o=>{ o.g.visible=false; o.st='ride'; }); rs.ph='run'; rs.t=c.run; } }
      else if(rs.ph==='run'){ rs.t-=dt; if(rs.t<=0){ let tot=0; const exitK=Rd.line.find(k=>Rd.dq[k]===0)||Rd.line[0], ex=unk(exitK);
          rs.riders.forEach((o,i)=>{ const pay=c.fee*U*.6*(1+(decoN.get(Rd.i)||0))*happy()*incMul(); tot+=pay; o.g.visible=true; o.st='walk'; o.ex=true; o.rd=Rd; o.rs=null; o.x=o.tx=ex[0]; o.z=o.tz=ex[1]; o.wait=i*.4; placeG(o); if(Math.random()<.5) bubble(o,'😍'); });
          if(tot>0){ gain(tot); noteWin(tot); const p=wpos(Rd.ctr[0],Rd.ctr[1]); pop('+'+fmt(tot),{x:p[0],z:p[1]}); }
          rs.riders=[]; rs.ph='idle'; rs.cd=Date.now()+1200; } } }
    function rideVisual(o,dt){ const Rd=o.R, rs=Rd&&Rd.rs; const act=!!rs&&(rs.ph==='run')&&!rs.broken; const a=o.g.userData.anim; if(a) a(tnow,dt,act,false,o.c.run);
      if(o.g.userData.heads){ const cols=(rs&&(rs.ph==='run'||rs.ph==='load')&&!rs.broken)?rs.riders.map(g=>g.col):null; const key2=cols?cols.join():''; if(o._rk!==key2){ o._rk=key2; setRiders(o.g,cols); } }
      if(o.lab&&(tnow-(o._lt||0)>.5)){ o._lt=tnow; if(!Rd||!Rd.op) labelSet(o.lab,'⚠️ Schlange!','#ffab91'); else if(rs.broken) labelSet(o.lab,'🔧 defekt','#ff8a80'); else labelSet(o.lab,'👥 '+rs.q.length+'/'+Rd.cap2,'#ffffff'); } }

    // ═══════ Personal ═══════
    function route(from,to){ if(from===to) return []; const q=[from], par={}; par[from]=null; while(q.length){ const c=q.shift(); if(c===to) break; const [x,z]=unk(c); DIRS.forEach(d=>{ const n=key(x+d[0],z+d[1]); if(reach.has(n)&&!(n in par)){ par[n]=c; q.push(n); } }); } if(!(to in par)) return null; const out=[]; let c=to; while(c&&c!==from){ out.push(c); c=par[c]; } return out.reverse(); }
    function syncStaff(){ const st=park().staff; Object.keys(STAFF).forEach(t=>{ const want=st[t]||0; let have=staffL.filter(s=>s.t===t); while(have.length<want){ spawnStaff(t); have=staffL.filter(s=>s.t===t); } while(have.length>want){ const s=have.pop(); staffG.remove(s.g); staffL.splice(staffL.indexOf(s),1); } }); }
    function spawnStaff(t){ const g=new THREE.Group(); g.add(cyl(.5,.55,1.4,STAFF[t].col,0,.8,0)); g.add(sph(.42,0xffcc99,0,1.9,0)); const e=emojiSprite(STAFF[t].ic,1.5); e.position.set(0,3.2,0); g.add(e); staffG.add(g); const s={t,g,x:EX,z:EZ,route:[],wait:0,task:null,sp:1.9}; staffL.push(s); const p=wpos(EX,EZ); g.position.set(p[0],0,p[1]); }
    function staffTick(dt){ if(!reach.size) return;
      staffL.forEach(s=>{ const cur=key(Math.round(s.x),Math.round(s.z));
        if(s.wait>0){ s.wait-=dt; if(s.wait<=0&&s.task){ if(s.task.k==='lit') cleanLitter(s.task.at); else if(s.task.k==='fix'&&s.task.R.rs.broken){ s.task.R.rs.broken=false; } s.task=null; } return; }
        if(!s.route.length){
          if(s.t==='clean'){ const ks=Object.keys(LIT).filter(k=>reach.has(k)); let best=null,bl=1e9; ks.forEach(k=>{ const [x,z]=unk(k); const dd=Math.abs(x-s.x)+Math.abs(z-s.z); if(dd<bl&&!staffL.some(o=>o!==s&&o.task&&o.task.at===k)){ bl=dd; best=k; } }); if(best){ const r=route(reach.has(cur)?cur:key(EX,EZ),best); if(r){ s.route=r; s.task={k:'lit',at:best}; } } }
          else if(s.t==='mech'){ const R2=RIDES.find(r=>r.rs.broken&&!staffL.some(o=>o!==s&&o.task&&o.task.R===r)&&r.line.length); if(R2){ const tk=R2.line.find(k=>R2.dq[k]===0&&reach.has(k)); if(tk){ const r=route(reach.has(cur)?cur:key(EX,EZ),tk); if(r){ s.route=r; s.task={k:'fix',R:R2,at:tk}; } } } }
          if(!s.route.length&&!s.task){ const ks=Array.from(reach); if(Math.random()<.02&&ks.length){ const r=route(reach.has(cur)?cur:key(EX,EZ),rnd(ks)); if(r) s.route=r.slice(0,12); } }
          if(!s.route.length&&s.task){ s.wait=s.task.k==='fix'?4:1.5; return; } }
        if(s.route.length){ const [tx,tz]=unk(s.route[0]); const dx=tx-s.x, dz=tz-s.z, d=Math.hypot(dx,dz), st=s.sp*dt; if(d<=st){ s.x=tx; s.z=tz; s.route.shift(); if(!s.route.length&&s.task) s.wait=s.task.k==='fix'?4:1.5; } else { s.x+=dx/d*st; s.z+=dz/d*st; s.g.rotation.y=Math.atan2(dx,dz); } const p=wpos(s.x,s.z); s.g.position.set(p[0],s.t==='anim'?Math.abs(Math.sin(tnow*5))*.35:0,p[1]); } }); }
    let wageT=0; function wages(dt){ wageT+=dt; if(wageT<60) return; wageT=0; const st=park().staff; let w=0; Object.keys(STAFF).forEach(t=>{ w+=(st[t]||0)*STAFF[t].wage*U; }); if(w>0){ const z=zoo(); z.mt=Math.max(0,(z.mt||0)-w); hudMT(); } }
    const staffN=()=>Object.keys(STAFF).reduce((s,t)=>s+(park().staff[t]||0),0);
    const wageMin=()=>Object.keys(STAFF).reduce((s,t)=>s+(park().staff[t]||0)*STAFF[t].wage*U,0);
    function hire(t,d){ const st=park().staff; const n=st[t]||0; if(d>0){ if(n>=MAXS) return toast('Maximal '+MAXS+' '+STAFF[t].n); if(!spend(STAFF[t].hire*U)) return; st[t]=n+1; toast('✅ '+STAFF[t].ic+' '+STAFF[t].n+' eingestellt',1500); } else { if(n<=0) return; st[t]=n-1; toast(STAFF[t].ic+' '+STAFF[t].n+' entlassen',1500); } syncStaff(); save(true); mkChips(); hudRefresh(); }

    // ═══════ Feuerwerk ═══════
    let FW=[];
    function burst(){ const r=landRect(); const p=wpos(r.x0+Math.random()*(r.x1-r.x0),r.z0+Math.random()*(r.z1-r.z0)); const n=80, pos=new Float32Array(n*3), vel=[]; const y0=26+Math.random()*14; for(let i=0;i<n;i++){ pos[i*3]=p[0]; pos[i*3+1]=y0; pos[i*3+2]=p[1]; const a=Math.random()*6.283, b=Math.acos(2*Math.random()-1), sp=7+Math.random()*8; vel.push([Math.sin(b)*Math.cos(a)*sp,Math.cos(b)*sp,Math.sin(b)*Math.sin(a)*sp]); }
      const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.BufferAttribute(pos,3)); const col=new THREE.Color().setHSL(Math.random(),1,.6); const pts=new THREE.Points(geo,new THREE.PointsMaterial({color:col,size:1.8,transparent:true,sizeAttenuation:true})); S.add(pts); FW.push({pts,vel,t:0,n}); }
    function fwTick(dt){ for(let i=FW.length-1;i>=0;i--){ const f=FW[i]; f.t+=dt; const a=f.pts.geometry.attributes.position.array; for(let j=0;j<f.n;j++){ f.vel[j][1]-=9*dt; a[j*3]+=f.vel[j][0]*dt; a[j*3+1]+=f.vel[j][1]*dt; a[j*3+2]+=f.vel[j][2]*dt; } f.pts.geometry.attributes.position.needsUpdate=true; f.pts.material.opacity=Math.max(0,1-f.t/2.4); if(f.t>2.4){ S.remove(f.pts); f.pts.geometry.dispose(); FW.splice(i,1); } } }
    function fireworks(){ const pk=park(); if(Date.now()<(pk.fwCd||0)) return toast('🎆 Nächstes Feuerwerk in '+Math.ceil((pk.fwCd-Date.now())/1000)+' s',2000); if(!spend(20*U)) return; pk.fwCd=Date.now()+300000; fwUntil=Date.now()+90000; for(let i=0;i<9;i++) setTimeout(()=>{ if(P.open&&S) burst(); },i*900); toast('🎆 Feuerwerk! Einnahmen ×1.5 für 90 s',3500); save(true); }
    // ═══════ Achterbahn-Editor (nur Bu:) – Teil für Teil bauen ═══════
    const EW=40, ED=32, MAXP=170, MAXLV=16;
    const COL=[0xe53935,0x1e88e5,0x43a047,0xfb8c00,0x8e24aa,0xffd54f];
    const PCS=[['S','➡️','Gerade'],['L','↰','Links'],['R','↱','Rechts'],['U','⬆️','Hoch'],['D','⬇️','Runter'],['X','⤵️','Steil ab'],['C','⛓️','Kettenlift'],['V','⚡','Speed'],['B','🛑','Bremse'],['O','🔄','Looping']];
    let ED_={on:false,pc:'',st:{x:5,z:16,d:0},name:'Meine Achterbahn',col:COL[0],track:null,ride:false,marks:null,sim:null,gen:null};
    const edCx=(EW-1)/2, edCz=(ED-1)/2;
    function edOpen(){ if(!isBu()) return toast('Der Editor ist nur für Bu:).'); ED_={on:true,pc:'',st:{x:5,z:16,d:0},name:'Meine Achterbahn',col:COL[0],track:null,ride:false,marks:new THREE.Group(),sim:null,gen:null}; parkG.visible=false; gridH.visible=false; ghostClear(); edG.add(ED_.marks);
      edG.add(box(EW*T,.25,ED*T,0xdcc9a0,0,.02,0)); const pts=[]; for(let x=0;x<=EW;x++){ pts.push(new THREE.Vector3((x-EW/2-.5)*T,.2,(-ED/2-.5)*T),new THREE.Vector3((x-EW/2-.5)*T,.2,(ED/2-.5)*T)); } for(let z=0;z<=ED;z++){ pts.push(new THREE.Vector3((-EW/2-.5)*T,.2,(z-ED/2-.5)*T),new THREE.Vector3((EW/2-.5)*T,.2,(z-ED/2-.5)*T)); } edG.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.25})));
      tgt={x:(ED_.st.x-edCx)*T+30,z:0}; dist=95; mode={k:'edit'}; edPanel(); edRedraw(); }
    function edClose(){ ED_.on=false; while(edG.children.length) edG.remove(edG.children[0]); parkG.visible=true; mode={k:'view',t:null,r:0}; const e=$('zpk-ed'); if(e) e.style.display='none'; $('zpk-bar').style.display='block'; centerCam(); }
    function edFits(g){ if(g.minY<-1e-6||g.maxY>MAXLV+1e-6) return false; return g.S.every(p=>p.x>=-.01&&p.z>=-.01&&p.x<=EW-.99&&p.z<=ED-.99); }
    function edRedraw(){ const E=ED_; while(E.marks.children.length) E.marks.remove(E.marks.children[0]); if(E.track){ edG.remove(E.track); E.track=null; }
      const g=genTrack(E.pc,E.st); E.gen=g; const closed=isClosed(g); E.sim=g.S.length>2?simulate(g):null;
      E.track=buildTrack(g,{cx:edCx,cz:edCz,closed:closed,col:E.col,base:false,sim:E.sim}); edG.add(E.track);
      const sp=g.S[0], ep=g.S[g.S.length-1]; const wp=p=>[(p.x-edCx)*T,.9+p.y*LV,(p.z-edCz)*T];
      const a=wp(sp); E.marks.add(sph(.8,0x69f0ae,a[0],a[1]+2,a[2])); const b=wp(ep); E.marks.add(sph(.8,0xffeb3b,b[0],b[1]+2.2,b[2]));
      const ar=cone(.7,1.8,0xffeb3b,b[0]+DX[g.end.d]*2,b[1]+2.2,b[2]+DZ[g.end.d]*2,6); ar.lookAt(b[0]+DX[g.end.d]*6,b[1]+2.2,b[2]+DZ[g.end.d]*6); ar.rotateX(Math.PI/2); E.marks.add(ar);
      edInfo(); }
    function edInfo(){ const E=ED_, el=$('zpk-edi'); if(!el||!E.gen) return; const g=E.gen, e=g.end, s=g.st, n=E.pc.length; const closed=isClosed(g); const dx=s.x-e.x, dz=s.z-e.z, dy=-e.y;
      let t='Teile: <b>'+n+'/'+MAXP+'</b> · Höhe jetzt: <b>'+e.y+'</b>';
      if(!n) t+='<br>Der grüne Punkt ist die Station (Start). Baue die Bahn Teil für Teil – am Ende muss sie wieder am Start ankommen. Aufs Raster tippen = Start verschieben, ↻ = Start drehen.';
      else if(closed&&E.sim&&E.sim.ok){ const st=stats(E.sim); t+='<br>✅ <b>Geschlossen &amp; fahrbar!</b> Länge '+E.sim.L+' · Tempo '+E.sim.maxV+' · Looping '+E.sim.loops+'<br>⭐ Spass <b>'+st.exc+'/10</b> · Preis <b>'+fmt(st.c*U)+'</b> · '+fmt(st.fee*U*.6)+' pro Fahrgast'; }
      else if(closed) t+='<br>'+((E.sim&&E.sim.msg)||'');
      else { t+='<br>🎯 Bis zum Start noch: '+(dx?Math.abs(dx)+' Kacheln in x ':'')+(dz?Math.abs(dz)+' Kacheln in z ':'')+(dy?(dy>0?'· '+dy+' Stufen hoch':'· '+(-dy)+' Stufen runter'):'')+((e.d!==s.d)?' · Richtung stimmt noch nicht':''); if(E.sim&&!E.sim.ok) t+='<br>'+E.sim.msg; }
      el.innerHTML=t; }
    function edAdd(ch){ const E=ED_; if(E.ride) return; if(E.pc.length>=MAXP) return toast('Maximal '+MAXP+' Teile.'); const g=genTrack(E.pc+ch,E.st); if(!edFits(g)){ toast(g.minY<-1e-6?'Zu tief – unter den Boden geht es nicht.':(g.maxY>MAXLV?'Zu hoch (max. '+MAXLV+').':'Kein Platz mehr – das Teil passt nicht in die Fläche.'),2200); return; } E.pc+=ch; edRedraw(); }
    function edUndo(){ const E=ED_; if(!E.pc.length||E.ride) return; E.pc=E.pc.slice(0,-1); edRedraw(); }
    function edTap(p){ const E=ED_; if(!E.on||!p||E.pc.length||E.ride) return; const x=Math.max(1,Math.min(EW-2,Math.round(p.x/T+edCx))), z=Math.max(1,Math.min(ED-2,Math.round(p.z/T+edCz))); E.st={x,z,d:E.st.d}; edRedraw(); }
    function edPanel(){ $('zpk-bar').style.display='none'; let el=$('zpk-ed'); if(!el){ el=document.createElement('div'); el.id='zpk-ed'; el.className='zpk-b'; el.style.cssText='left:6px;right:6px;bottom:6px;padding:7px'; ov.appendChild(el); }
      el.style.display='block'; const bs='border:2px solid #fff;border-radius:10px;color:#fff;font:900 .74rem Arial;padding:6px 8px;margin:0 4px 4px 0;flex:0 0 auto;text-align:center;min-width:58px;';
      el.innerHTML='<div id="zpk-edi" style="font-size:.76rem;line-height:1.4;margin-bottom:6px;max-height:88px;overflow:auto"></div><div id="zpk-edp" style="display:flex;overflow-x:auto">'+PCS.map(p=>'<button data-p="'+p[0]+'" style="'+bs+'background:'+(p[0]==='C'?'#b8860b':p[0]==='V'?'#e65100':p[0]==='B'?'#b71c1c':p[0]==='O'?'#6a1b9a':'rgba(60,40,100,.95)')+'"><div style="font-size:1.15rem">'+p[1]+'</div>'+p[2]+'</button>').join('')+'</div><div style="display:flex;gap:4px;flex-wrap:wrap;align-items:center"><input id="zpk-edn" value="'+esc(ED_.name)+'" maxlength="24" style="flex:1;min-width:110px;padding:6px;border-radius:8px;border:none;font:700 .8rem Arial"><button data-a="undo" style="'+bs+'background:#455a64">↩️ Zurück</button><button data-a="rot" style="'+bs+'background:#455a64">↻ Start</button><button data-a="col" style="'+bs+'background:#455a64">🎨</button><button data-a="clr" style="'+bs+'background:#5d4037">🧹 Neu</button><button data-a="ride" style="'+bs+'background:#1565c0">🎥 Probefahrt</button><button data-a="save" style="'+bs+'background:#2e7d32">💾 Veröffentlichen</button><button data-a="x" style="'+bs+'background:#b71c1c">✕</button></div>';
      $('zpk-edn').oninput=e=>{ ED_.name=e.target.value; };
      el.onclick=e=>{ const b=e.target.closest('button'); if(!b) return; if(b.dataset.p){ edAdd(b.dataset.p); return; } const k=b.dataset.a; if(k==='undo') edUndo(); else if(k==='rot'){ if(!ED_.pc.length){ ED_.st.d=(ED_.st.d+1)%4; edRedraw(); } else toast('Start drehen geht nur, wenn noch nichts gebaut ist.'); } else if(k==='col'){ ED_.col=COL[(COL.indexOf(ED_.col)+1)%COL.length]; edRedraw(); } else if(k==='clr'){ if(!ED_.pc.length||confirm('Alles löschen und neu anfangen?')){ ED_.pc=''; edRedraw(); } } else if(k==='ride') edRide(); else if(k==='save') edSave(); else if(k==='x'){ if(confirm('Editor schliessen? Nicht veröffentlichte Änderungen gehen verloren.')) edClose(); } }; }
    function edRide(){ const E=ED_; if(!(E.gen&&isClosed(E.gen)&&E.sim&&E.sim.ok)) return toast('Probefahrt geht erst, wenn die Bahn geschlossen und fahrbar ist.'); E.ride=!E.ride; if(!E.ride){ tgt={x:0,z:0}; dist=95; } toast(E.ride?'🎥 Probefahrt (nochmal tippen = zurück)':'Editor',1800); }
    function edSave(){ const E=ED_; if(!(E.gen&&isClosed(E.gen))) return toast('Die Bahn muss erst am Start ankommen (geschlossen sein).'); if(!E.sim||!E.sim.ok) return toast((E.sim&&E.sim.msg)||'Die Bahn ist nicht fahrbar.',4000); const r=RTD(); if(!r) return toast('Keine Cloud-Verbindung.');
      const st=stats(E.sim), id='k'+Date.now().toString(36), nm=(E.name||'Achterbahn').slice(0,24);
      r.ref('zoo_park/coasters/'+id).set({n:nm,pc:E.pc,sd:E.st.d,c:st.c,fee:st.fee,by:me(),at:Date.now(),col:E.col,v:2}).then(()=>{ toast('🎢 „'+nm+'“ ist jetzt für alle im Bau-Menü!',3500); }).catch(()=>toast('Speichern fehlgeschlagen.')); edClose(); }
    P.edOpen=edOpen;


    // ═══════ Oberfläche ═══════
    function css(){ if($('zpk-css')) return; const s=document.createElement('style'); s.id='zpk-css'; s.textContent='#zpk-ov{position:fixed;inset:0;z-index:720;background:#9fd8ff;font-family:Arial,sans-serif;touch-action:none;user-select:none;color:#fff}#zpk-ov canvas{display:block}.zpk-b{position:absolute;border:2px solid #fff;border-radius:12px;background:rgba(40,30,80,.88);color:#fff;font:900 .85rem Arial;padding:8px 11px}.zpk-b button,.zpk-chip{cursor:pointer}.zpk-chip{flex:0 0 auto;min-width:78px;margin-right:6px;padding:6px 8px;border:2px solid rgba(255,255,255,.5);border-radius:10px;background:rgba(255,255,255,.12);text-align:center;font:900 .72rem Arial;color:#fff}.zpk-chip.on{border-color:#ffd54f;background:rgba(255,213,79,.28)}.zpk-tab{flex:0 0 auto;padding:6px 9px;border:2px solid rgba(255,255,255,.4);border-radius:10px;background:rgba(255,255,255,.1);color:#fff;font:900 .74rem Arial;margin-right:4px;cursor:pointer}.zpk-tab.on{border-color:#ffd54f;background:rgba(255,213,79,.28)}'; document.head.appendChild(s); }
    const RB=[['zpk-zoo','🦁 Zoo',8],['zpk-help','❓',54],['zpk-rl','⟲',100],['zpk-rr','⟳',146],['zpk-rot','🔄',192],['zpk-land','🏞️',238],['zpk-ent','🎟️',284],['zpk-fw','🎆',330]];
    function mkUI(){ css(); ov=document.createElement('div'); ov.id='zpk-ov'; cv=document.createElement('canvas'); ov.appendChild(cv);
      ov.insertAdjacentHTML('beforeend','<div id="zpk-hud" class="zpk-b" style="left:8px;top:8px;line-height:1.5;font-size:.78rem"></div>'+RB.map(b=>'<button id="'+b[0]+'" class="zpk-b" style="right:8px;top:'+b[2]+'px'+(b[0]==='zpk-rot'?';display:none':'')+'">'+b[1]+'</button>').join('')+'<div id="zpk-bar" class="zpk-b" style="left:6px;right:6px;bottom:6px;padding:6px"><div id="zpk-tabs" style="display:flex;overflow-x:auto;margin-bottom:6px"></div><div id="zpk-chips" style="display:flex;overflow-x:auto;min-height:60px"></div></div>');
      document.body.appendChild(ov); hudEl=$('zpk-hud'); build();
      $('zpk-zoo').onclick=()=>P.close(); $('zpk-help').onclick=openHelp; $('zpk-rl').onclick=()=>{ yaw-=.4; }; $('zpk-rr').onclick=()=>{ yaw+=.4; }; $('zpk-rot').onclick=()=>{ mode.r=((mode.r||0)+1)%4; }; $('zpk-land').onclick=openLand; $('zpk-ent').onclick=cycleEntry; $('zpk-fw').onclick=fireworks;
      addEventListener('resize',onResize); ov.addEventListener('wheel',e=>{ dist=Math.max(22,Math.min(190,dist*(e.deltaY>0?1.1:.9))); e.preventDefault(); },{passive:false});
      const tp={}; let pd=0, moved=0, lastTile=null;
      cv.addEventListener('pointerdown',e=>{ tp[e.pointerId]=[e.clientX,e.clientY]; if(Object.keys(tp).length===1){ moved=0; lastTile=null; try{ cv.setPointerCapture(e.pointerId); }catch(_){} } pd=0; });
      cv.addEventListener('pointermove',e=>{ const prev=tp[e.pointerId]; if(!prev){ if(mode.k==='build') hover(e); return; } tp[e.pointerId]=[e.clientX,e.clientY]; const ks=Object.keys(tp);
        if(ks.length===2){ const a=tp[ks[0]], b=tp[ks[1]], d=Math.hypot(a[0]-b[0],a[1]-b[1]); if(pd) dist=Math.max(22,Math.min(190,dist*pd/d)); pd=d; moved=99; return; }
        const dx=e.clientX-prev[0], dy=e.clientY-prev[1]; moved+=Math.abs(dx)+Math.abs(dy);
        if(mode.k==='build'&&mode.t&&getCat(mode.t).k==='path'){ const t=tileAt(ground(e.clientX,e.clientY)); if(t&&(!lastTile||lastTile[0]!==t[0]||lastTile[1]!==t[1])){ lastTile=t; place(mode.t,t[0],t[1],0); } return; }
        if(mode.k==='edit'&&ED_.ride) return; const k=dist*.0016; tgt.x+=-Math.cos(yaw)*dx*k-Math.sin(yaw)*dy*k; tgt.z+=Math.sin(yaw)*dx*k-Math.cos(yaw)*dy*k; if(mode.k==='build') hover(e); });
      const up=e=>{ const had=tp[e.pointerId]; delete tp[e.pointerId]; pd=0; if(!had) return; if(moved<8&&Object.keys(tp).length===0){ tap(e); } };
      cv.addEventListener('pointerup',up); cv.addEventListener('pointercancel',e=>{ delete tp[e.pointerId]; pd=0; });
      mkTabs(); }
    function hover(e){ ghost(tileAt(ground(e.clientX,e.clientY))); }
    function ghostClear(){ while(ghostG.children.length) ghostG.remove(ghostG.children[0]); }
    function ghost(t){ ghostClear(); if(!t||mode.k!=='build'||!mode.t) return; const c=getCat(mode.t); if(!c) return; const [w,d]=dims(mode.t,mode.r); const x0=c.k==='path'?t[0]:t[0]-((w-1)>>1), z0=c.k==='path'?t[1]:t[1]-((d-1)>>1); const ok=canPlace(mode.t,x0,z0,mode.r); const p=wpos(x0+(w-1)/2,z0+(d-1)/2); const f=box(w*T,.3,d*T,ok?0x66ff66:0xff5555,p[0],.25,p[1]); f.material=new THREE.MeshBasicMaterial({color:ok?0x66ff66:0xff5555,transparent:true,opacity:.45}); ghostG.add(f); }
    function tap(e){ const gp=ground(e.clientX,e.clientY); const t=tileAt(gp); if(mode.k==='edit'){ edTap(gp); return; } if(!t||t[0]<0||t[1]<0||t[0]>=GM||t[1]>=GM) return;
      if(mode.k==='bulldoze'){ remove(t[0],t[1]); return; }
      if(mode.k==='build'&&mode.t&&!STAFF[mode.t]){ const c=getCat(mode.t); if(!c) return; const [w,d]=dims(mode.t,mode.r); const x0=c.k==='path'?t[0]:t[0]-((w-1)>>1), z0=c.k==='path'?t[1]:t[1]-((d-1)>>1); if(!canPlace(mode.t,x0,z0,mode.r)){ if(!inOwned(t[0],t[1])) toast('🏞️ Das Land gehört dir noch nicht – oben „Land kaufen“.',2200); else toast('Hier ist kein Platz.',1500); return; } place(mode.t,x0,z0,mode.r); ghost(t); return; }
      info(t[0],t[1]); }
    function mkTabs(){ const el=$('zpk-tabs'); el.innerHTML=TABS.map(a=>'<button class="zpk-tab'+(tab===a[0]&&mode.k==='build'?' on':'')+'" data-t="'+a[0]+'">'+a[1]+' '+a[2]+'</button>').join('')+'<button class="zpk-tab'+(mode.k==='bulldoze'?' on':'')+'" data-t="_bd">🗑️ Abriss</button><button class="zpk-tab" data-t="_v">👁️ Ansehen</button>'+(isBu()?'<button class="zpk-tab" data-t="_ed" style="border-color:#ff8a80">🛠️ Editor</button>':'');
      el.onclick=e=>{ const b=e.target.closest('button'); if(!b) return; const t=b.dataset.t; if(t==='_bd'){ mode={k:'bulldoze'}; ghostClear(); gridH.visible=true; } else if(t==='_v'){ mode={k:'view'}; ghostClear(); gridH.visible=false; } else if(t==='_ed'){ edOpen(); return; } else if(t==='staff'){ tab=t; mode={k:'staff'}; ghostClear(); gridH.visible=false; } else { tab=t; mode={k:'build',t:allOfKind(t)[0],r:0}; gridH.visible=true; } mkTabs(); mkChips(); $('zpk-rot').style.display=mode.k==='build'?'block':'none'; };
      mkChips(); }
    function mkChips(){ const el=$('zpk-chips');
      if(mode.k==='staff'){ const st=park().staff; el.innerHTML=Object.keys(STAFF).map(t=>{ const s=STAFF[t]; return '<div class="zpk-chip" data-h="'+t+'" data-d="1"><div style="font-size:1.3rem">'+s.ic+'</div>'+s.n+' '+(st[t]||0)+'/'+MAXS+'<br><span style="opacity:.85">＋ '+fmt(s.hire*U)+'</span></div><div class="zpk-chip" data-h="'+t+'" data-d="-1" style="min-width:46px"><div style="font-size:1.1rem">➖</div>weg</div>'; }).join('')+'<div style="font-size:.72rem;opacity:.85;padding:4px 8px;min-width:170px">Lohn: '+fmt(wageMin())+' MT / Minute<br>🧹 räumt Müll · 🔧 repariert · 🎭 Stimmung</div>';
        el.onclick=e=>{ const c=e.target.closest('.zpk-chip'); if(c) hire(c.dataset.h,+c.dataset.d); }; return; }
      if(mode.k!=='build'){ el.innerHTML='<div style="font-size:.78rem;opacity:.9;padding:6px">'+(mode.k==='bulldoze'?'🗑️ Tippe auf Wege oder Gebäude – du bekommst 50 % zurück.':'Wähle oben einen Bereich zum Bauen. Ziehen = Karte bewegen, Zwei Finger / Mausrad = Zoom. Müll antippen = aufräumen, defekte Bahn antippen = reparieren.')+'</div>'; return; }
      const list=allOfKind(tab); el.innerHTML=list.map(t=>{ const c=getCat(t); return '<div class="zpk-chip'+(mode.t===t?' on':'')+'" data-t="'+esc(t)+'"><div style="font-size:1.3rem">'+c.ic+'</div>'+esc(c.n)+'<br><span style="opacity:.85">'+fmt(price(t))+'</span></div>'; }).join('')||'<div style="padding:8px;font-size:.8rem">Noch nichts da.</div>';
      el.onclick=e=>{ const c=e.target.closest('.zpk-chip'); if(!c) return; mode.t=c.dataset.t; mode.r=0; mkChips(); }; }
    function hudRefresh(){ if(!hudEl) return; const z=zoo(); const sc=Math.min(5,1+(stat.att||0)*.35+(stat.deco||0)*.05); const ql=RIDES.reduce((s,r)=>s+r.rs.q.length,0);
      hudEl.innerHTML='🪙 <b>'+fmt(z.mt||0)+'</b> MT<br>👥 '+stat.g+' · ⭐ '+sc.toFixed(1)+' · 😊 '+Math.round(stat.hap*100)+' %<br>📈 '+fmt(stat.rate)+' / Min'+(litN()?'<br>🗑️ Müll: '+litN():'')+(ql?'<br>⏳ In Schlangen: '+ql:'')+(staffN()?'<br>👷 '+staffN()+' · Lohn '+fmt(wageMin())+'/Min':'')+(Date.now()<fwUntil?'<br>🎆 ×1.5':'')+(!reach.size?'<br><span style="color:#ffab91">Baue Wege ab dem Eingang!</span>':'');
      const lb=$('zpk-land'); if(lb) lb.title='Land kaufen'; const eb=$('zpk-ent'); if(eb) eb.textContent='🎟️ '+fmt([0,2,5,10,20][park().entry||0]*U); }
    function cycleEntry(){ const pk=park(); pk.entry=((pk.entry||0)+1)%5; save(true); toast('🎟️ Eintritt: '+(pk.entry?fmt([0,2,5,10,20][pk.entry]*U)+' MT':'gratis')+' · '+['mehr','normal','etwas weniger','weniger','sehr wenige'][pk.entry]+' Besucher',2800); hudRefresh(); }
    function openLand(){ const pk=park(), L=pk.land||0; const m=document.createElement('div'); m.style.cssText='position:absolute;inset:0;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:12px;z-index:5'; const r=landRect();
      m.innerHTML='<div style="background:linear-gradient(160deg,#1b5e20,#33691e);border:3px solid #ffd54f;border-radius:16px;padding:14px;max-width:380px;width:100%;text-align:center"><div style="font:900 1.2rem Arial;color:#ffd54f">🏞️ Mehr Land</div><p style="font-size:.85rem;line-height:1.5">Dein Park ist jetzt <b>'+(r.x1-r.x0+1)+' × '+(r.z1-r.z0+1)+'</b> Kacheln gross (Stufe '+L+' von '+MAXL+').</p>'+(L>=MAXL?'<p><b>Maximale Grösse erreicht! 🎉</b></p>':'<p style="font-size:.85rem">Nächste Stufe: <b>'+(r.x1-r.x0+5)+' × '+(r.z1-r.z0+5)+'</b> Kacheln<br>Preis: <b>'+fmt(landCost())+'</b> MT</p><button data-b="1" style="width:100%;padding:11px;border:none;border-radius:12px;background:#43a047;color:#fff;font:900 .95rem Arial">Land kaufen</button>')+'<button data-b="0" style="width:100%;padding:9px;margin-top:6px;border:none;border-radius:12px;background:rgba(255,255,255,.2);color:#fff;font:900 .9rem Arial">Schliessen</button></div>';
      m.onclick=e=>{ const b=e.target.closest('button'); if(!b&&e.target!==m) return; if(b&&b.dataset.b==='1'){ if(!spend(landCost())) return; pk.land=L+1; drawLand(); save(true); toast('🏞️ Dein Park ist jetzt grösser!',2500); try{ ZGfx.confetti(60); }catch(x){} } m.remove(); }; ov.appendChild(m); }
    function openHelp(){ const m=document.createElement('div'); m.style.cssText='position:absolute;inset:0;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:12px;z-index:5'; m.innerHTML='<div style="background:linear-gradient(160deg,#4a148c,#1a237e);border:3px solid #ffd54f;border-radius:16px;padding:14px;max-width:440px;width:100%;max-height:88vh;overflow:auto;font-size:.84rem;line-height:1.5"><div style="font:900 1.2rem Arial;color:#ffd54f;text-align:center">🎡 Dein Freizeitpark</div><p>Baue vom <b>Eingang unten</b> aus <b>Wege</b>. Besucher laufen dort entlang und zahlen <b>Mischtaler</b> – dieselben wie im Zoo!</p><p>🎠 <b>Fahrgeschäfte &amp; Achterbahnen</b> brauchen eine <b>Warteschlange 🚧</b>: Baue sie direkt an die Bahn und verbinde das andere Ende mit einem Weg. Dann stellen sich die Besucher an, steigen ein und du siehst sie fahren.</p><p>🍔 <b>Essen</b> steht direkt am Weg. Wer isst, hinterlässt Müll – stelle <b>Mülleimer 🗑️</b> auf, sonst sinkt die Stimmung. Müll antippen räumt auf.</p><p>👷 <b>Personal</b> (kostet Lohn pro Minute): 🧹 räumt Müll, 🔧 repariert defekte Bahnen (oder tippe sie selbst an), 🎭 macht gute Laune.</p><p>🏞️ <b>Land kaufen</b> macht den Park grösser · 🎟️ <b>Eintritt</b> einstellen (teuer = weniger Gäste) · 🎆 <b>Feuerwerk</b> = 90 s mehr Einnahmen.</p><p>🌳 Deko in der Nähe erhöht die Einnahmen. 🔄 dreht Gebäude, 🗑️ Abriss gibt 50 % zurück. Bu:) baut im 🛠️ Editor eigene Achterbahnen Teil für Teil (Kettenlift, Speed, Bremse, Looping) – sie erscheinen dann für alle.</p><button style="width:100%;padding:10px;border:none;border-radius:12px;background:#43a047;color:#fff;font:900 .95rem Arial">Los geht’s</button></div>'; m.querySelector('button').onclick=()=>m.remove(); ov.appendChild(m); }
    const KM={ArrowUp:[0,-1],w:[0,-1],W:[0,-1],ArrowDown:[0,1],s:[0,1],S:[0,1],ArrowLeft:[-1,0],a:[-1,0],A:[-1,0],ArrowRight:[1,0],d:[1,0],D:[1,0]}; const kk={};
    function kdown(e){ if(!P.open) return; const tg=e.target&&e.target.tagName; if(tg==='INPUT'){ e.stopPropagation(); return; } if(KM[e.key]){ kk[e.key]=e.type==='keydown'; e.stopPropagation(); e.preventDefault(); } else if(e.type==='keydown'&&(e.key==='q'||e.key==='Q')){ yaw-=.4; e.stopPropagation(); } else if(e.type==='keydown'&&(e.key==='e'||e.key==='E')){ yaw+=.4; e.stopPropagation(); } else if(e.type==='keydown'&&(e.key==='r'||e.key==='R')){ if(mode.k==='build') mode.r=((mode.r||0)+1)%4; e.stopPropagation(); } else if(e.type==='keydown') e.stopPropagation(); }
    addEventListener('keydown',kdown,true); addEventListener('keyup',kdown,true);

    // ═══════ Schleife ═══════
    let hudT=0;
    function frame(ts){ if(!P.open) return; raf=requestAnimationFrame(frame); const dt=Math.min(.05,(ts-last)/1000||0); last=ts; tnow+=dt;
      Object.keys(kk).forEach(k=>{ if(kk[k]){ const v=KM[k], s=dist*.6*dt; tgt.x+=(v[0]*Math.cos(yaw)+v[1]*Math.sin(yaw))*s; tgt.z+=(-v[0]*Math.sin(yaw)+v[1]*Math.cos(yaw))*s; } });
      const lim=GM*T/2+20; tgt.x=Math.max(-lim,Math.min(lim,tgt.x)); tgt.z=Math.max(-lim,Math.min(lim,tgt.z));
      if(!(ED_.on)){ guestsTick(dt); RIDES.forEach(r=>rideTick(r,dt)); staffTick(dt); wages(dt); objs.forEach(o=>{ if(o.R) rideVisual(o,dt); else { const a=o.g.userData.anim; if(a) a(tnow,dt,false); } }); fwTick(dt); }
      else { if(ED_.track&&ED_.track.userData.anim){ ED_.track.userData.anim(tnow,dt,true,true,0); if(ED_.ride&&ED_.track.userData.cur){ const cur=ED_.track.userData.cur, p=cur.getPointAt((tnow*.03)%1); tgt.x=p.x; tgt.z=p.z; } } }
      hudT-=dt; if(hudT<=0){ hudT=.5; hudRefresh(); const pk=park(); pk.rate=stat.rate; pk.last=Date.now(); save(); }
      camUpdate(); R.render(S,CAM); }
    // ═══════ Öffnen / Schliessen ═══════
    function migrate(pk){ if(pk.v>=2) return; pk.v=2; const nz={}; Object.keys(pk.paths||{}).forEach(k=>{ const [x,z]=unk(k); nz[key(x+8,z+16)]=1; }); pk.paths=nz; (pk.items||[]).forEach(it=>{ it.x+=8; it.z+=16; delete it.cd; }); pk.land=pk.land||0; pk.staff=pk.staff||{clean:0,mech:0,anim:0}; pk.entry=pk.entry==null?1:pk.entry;
      let L=0; for(;L<MAXL;L++){ const r={x0:12-2*L,x1:27+2*L,z0:24-4*L}; if(Object.keys(pk.paths).every(k=>{ const [x,z]=unk(k); return x>=r.x0&&x<=r.x1&&z>=r.z0; })&&pk.items.every(it=>it.x>=r.x0&&it.z>=r.z0&&it.x<=r.x1)) break; } pk.land=Math.max(pk.land,L); }
    P.openWorld=function(){ if(!P.has()) return toast('🔒 Ab Rebirth 8 kannst du den Freizeitpark betreten.'); if(!P.on()) return toast('🔒 Der Freizeitpark wird bald freigeschaltet.'); if(P.open) return; P.open=true; if(!ov) mkUI(); else ov.style.display='block'; onResize();
      const pk=park(); migrate(pk); pk.staff=pk.staff||{clean:0,mech:0,anim:0}; if(!Object.keys(pk.paths).length){ for(let i=0;i<3;i++) pk.paths[key(EX,EZ-i)]=1; }
      Object.keys(LIT).forEach(cleanLitter); guests.forEach(o=>guestG.remove(o.g)); guests=[]; staffL.forEach(s=>staffG.remove(s.g)); staffL=[]; FW.forEach(f=>S.remove(f.pts)); FW=[];
      drawLand(); relayout(); syncStaff(); centerCam();
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
    P._t={genTrack,simulate,isClosed,bboxOf,stats,CAT};
    P.dbg=()=>({guests:guests.length,items:items().length,reach:reach.size,rides:RIDES.length,lit:litN(),staff:staffL.length,land:park().land,q:RIDES.map(r=>r.rs.q.length+'/'+r.rs.ph+'/'+r.op)});
  }
  wait();
})();
