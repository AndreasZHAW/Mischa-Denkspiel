/* ZLook (v840): 🎨 Realistischere Grafik – Licht & Schattierung (Sonnenstand nach Uhrzeit), Himmelsverlauf, Distanz-Nebel, Oberflächen-Details,
   dazu "Schön"-Stufe mit Bloom, Farbkorrektur, Randunschärfe und Kantenglättung. Stufen: klassisch / normal / schön (Menü → Grafik-Look). */
(function(){
  const ZGet=()=>{ try{ return (typeof ZG!=='undefined')?ZG:null; }catch(e){ return null; } }; // ZG ist ein const im Spiel (nicht window.ZG!)
  'use strict';
  if(window.ZLook) return;
  const G=window.ZLook={q:'auto',U:null,ready:false,pp:false,fps:0};
  const lsg=()=>{ try{ return localStorage.getItem('zgfx_q'); }catch(e){ return null; } };
  const lss=v=>{ try{ localStorage.setItem('zgfx_q',v); }catch(e){} };
  const ua=navigator.userAgent||'';
  const mobile=G.mobile=/Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1)||(window.matchMedia&&matchMedia('(pointer:coarse)').matches&&!matchMedia('(any-pointer:fine)').matches);
  const weak=!mobile&&(navigator.hardwareConcurrency||8)<=4;
  // Standard: Computer = Schön (mit Auto-Rückfall), Handy/Tablet/schwacher PC = Normal
  try{ if(localStorage.getItem('zgfx_mig')!=='2'){ localStorage.removeItem('zgfx_q'); localStorage.setItem('zgfx_mig','2'); } }catch(e){}
  G.q=lsg()||(weak?'normal':'auto'); // Handy/iPad/Tablet: ebenfalls Schoen, mit Auto-Rueckfall bei Ruckeln
  // Sichtweite (in Welt-Einheiten): Computer 200, Handy/iPad/Tablet 75 – alles dahinter wird nicht mehr gezeichnet
  G.cull=mobile?75:200;
  const level=()=>G.q==='classic'?0:(G.q==='normal'?1:2);
  const BASE=(()=>{ try{ const c=document.currentScript&&document.currentScript.src; return c?c.replace(/[^\/]*$/,''):''; }catch(e){ return ''; } })();
  function patch(){
    const T=window.THREE; if(!T||G.ready) return; G.ready=true;
    const U=G.U={ uZOn:{value:1}, uSunDir:{value:new T.Vector3(.4,.8,.3).normalize()}, uSunCol:{value:new T.Color(1,.97,.9)}, uAmb:{value:1}, uTint:{value:new T.Color(1,1,1)}, uDet:{value:1} };
    const skip=m=>(m.userData&&m.userData.flat)||m.transparent||m.side===T.BackSide||m.blending!==T.NormalBlending||m.depthWrite===false;
    const P=T.MeshBasicMaterial.prototype;
    P.onBeforeCompile=function(sh){
      if(skip(this)) return;
      Object.assign(sh.uniforms,U);
      sh.vertexShader=sh.vertexShader
        .replace('#include <common>','#include <common>\nvarying vec3 vZN;\nvarying vec3 vZW;')
        .replace('#include <project_vertex>','#include <project_vertex>\n{ vec3 zn=normal; vec4 zp=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\n zn=mat3(instanceMatrix)*zn; zp=instanceMatrix*zp;\n#endif\n vZN=mat3(modelMatrix)*zn; vZW=(modelMatrix*zp).xyz; }');
      sh.fragmentShader=sh.fragmentShader
        .replace('#include <common>',`#include <common>
varying vec3 vZN; varying vec3 vZW;
uniform float uZOn; uniform vec3 uSunDir; uniform vec3 uSunCol; uniform float uAmb; uniform vec3 uTint; uniform float uDet;
float zh(vec3 p){ p=fract(p*0.3183099+vec3(.1,.2,.3)); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float zn3(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(zh(i),zh(i+vec3(1,0,0)),f.x),mix(zh(i+vec3(0,1,0)),zh(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(zh(i+vec3(0,0,1)),zh(i+vec3(1,0,1)),f.x),mix(zh(i+vec3(0,1,1)),zh(i+vec3(1,1,1)),f.x),f.y),f.z); }`)
        .replace('#include <envmap_fragment>',`#include <envmap_fragment>
if(uZOn>0.5){ float zl=length(vZN); if(zl>0.01){
  vec3 n=vZN/zl; if(!gl_FrontFacing) n=-n;
  float g1=0.5, g2=0.5; vec3 bn=n;
  vec3 vd=normalize(cameraPosition-vZW);
  if(uDet>0.01){ g1=zn3(vZW*1.7); g2=zn3(vZW*7.3);
    bn=normalize(n+(vec3(g2,zn3(vZW*7.3+5.0),zn3(vZW*7.3+9.0))-0.5)*0.4*uDet); }
  float ndl=max(dot(bn,uSunDir),0.0); float hemi=n.y*0.5+0.5;
  vec3 kd=normalize(vec3(0.4,0.8,0.3));
  float rel=max(dot(bn,kd),0.0)-max(dot(n,kd),0.0); // Relief-Kontrast: immer gleich stark, egal welche Tageszeit
  vec3 s=vec3(uAmb)*(0.60+0.16*hemi)+uSunCol*0.46*ndl+vec3(0.5*rel*uDet);
  float det=1.0+((g1-0.5)*0.095+(g2-0.5)*0.08)*uDet;
  vec3 hv=normalize(kd+vd); float sp=pow(max(dot(bn,hv),0.0),22.0)*0.12*(0.4+g1)*step(0.0,dot(n,kd));
  outgoingLight=outgoingLight*s*uTint*det+max(uSunCol,vec3(0.7))*sp*uZOn*uDet;
} }`);
    };
    P.customProgramCacheKey=function(){ return skip(this)?'zf':'zs'; };
  }

  /* 🌱 Neuer Rasen: gezeichnete Grashalme (kachelbar) – wie ein Foto von echtem Gras */
  G.grassTex=function(rep){
    const T=window.THREE; const S=1024, c=document.createElement('canvas'); c.width=c.height=S; const x=c.getContext('2d');
    let seed=7; const R=()=>{ seed=(seed*16807)%2147483647; return (seed-1)/2147483646; };
    x.fillStyle='#2f7428'; x.fillRect(0,0,S,S);
    // große weiche Flecken (hell/dunkel) gegen sichtbares Kacheln
    for(let i=0;i<46;i++){ const px=R()*S, py=R()*S, r=70+R()*150, l=R()<.5; for(const ox of [-S,0,S]) for(const oy of [-S,0,S]){ const g=x.createRadialGradient(px+ox,py+oy,0,px+ox,py+oy,r); g.addColorStop(0,l?'rgba(130,190,70,.22)':'rgba(20,70,25,.25)'); g.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=g; x.fillRect(px+ox-r,py+oy-r,r*2,r*2); } }
    const PAL=['#1a521a','#245f21','#2d6e26','#357d2a','#3f8c2f','#4c9a34','#5aa83a','#6fb844','#8cc652','#a6cc5e'];
    const blade=(px,py,col,len,w,ang)=>{ x.strokeStyle=col; x.lineWidth=w; x.lineCap='round'; x.beginPath(); x.moveTo(px,py); x.quadraticCurveTo(px+Math.cos(ang)*len*.5+(R()-.5)*5,py+Math.sin(ang)*len*.5,px+Math.cos(ang)*len,py+Math.sin(ang)*len); x.stroke(); };
    for(let i=0;i<46000;i++){ const px=R()*S, py=R()*S, k=R(); const col=PAL[Math.min(PAL.length-1,Math.floor(Math.pow(k,1.6)*PAL.length))]; const len=6+R()*13, w=.7+R()*1.0, ang=-Math.PI/2+(R()-.5)*2.6;
      for(const ox of (px<30?[0,S]:px>S-30?[-S,0]:[0])) for(const oy of (py<30?[0,S]:py>S-30?[-S,0]:[0])) blade(px+ox,py+oy,col,len,w,ang); }
    // ein paar trockene Blätter / Halme
    for(let i=0;i<46;i++){ const px=R()*S, py=R()*S; x.fillStyle=['#a5672e','#b98a4a','#8a5a2a'][i%3]; x.save(); x.translate(px,py); x.rotate(R()*6); x.beginPath(); x.ellipse(0,0,3+R()*4,1.4+R()*1.6,0,0,7); x.fill(); x.restore(); }
    const t=new T.CanvasTexture(c); t.wrapS=t.wrapT=T.RepeatWrapping; t.repeat.set(rep,rep); t.anisotropy=8; t.encoding=T.sRGBEncoding===undefined?t.encoding:t.encoding; t.needsUpdate=true; return t;
  };
  /* ── Himmel / Nebel / Sonnenstand ── */
  function busy(){ const g=ZGet(); if(!g) return true; return !!(g._steActive||g._jumpActive||g._iceRoomActive||g._mazeActive||g._windRoomActive||g._arcadeActive||g._trashActive||g._moonMode); }
  const hour=()=>{ if(G.hourOverride!=null) return G.hourOverride; const d=new Date(); return d.getHours()+d.getMinutes()/60; };
  let skyMat=null, lastDome=null;
  function skyShader(){ const T=THREE; return new T.ShaderMaterial({ side:T.BackSide, depthWrite:false, fog:false, uniforms:{top:{value:new T.Color(0x3a78c8)},hor:{value:new T.Color(0xcfe6ff)},sun:{value:new T.Vector3(0,1,0)},glow:{value:new T.Color(1,.8,.5)},gi:{value:.5}},
    vertexShader:'varying vec3 vP; void main(){ vP=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader:'uniform vec3 top; uniform vec3 hor; uniform vec3 sun; uniform vec3 glow; uniform float gi; varying vec3 vP; void main(){ float h=clamp(vP.y,0.0,1.0); vec3 c=mix(hor,top,pow(h,0.55)); c=mix(c,hor*0.85,smoothstep(0.0,-0.35,vP.y)); float d=max(dot(normalize(vP),normalize(sun)),0.0); c+=glow*(pow(d,7.0)*0.28+pow(d,90.0)*0.5)*gi; gl_FragColor=vec4(c,1.0); }' }); }
  function env(){
    const T=window.THREE, g=ZGet(); if(!T||!G.U||!g||!g.scene) return;
    const U=G.U, lv=level(), on=lv>0&&!busy();
    U.uZOn.value=lv>0?1:0;
    // Sonnenstand nach Uhrzeit (wie im Himmel-System), Nacht = Mond
    let tod=true; try{ tod=localStorage.getItem('zoo_tod')!=='0'; }catch(e){}
    const h=tod?hour():12;
    let day=0; // 0 Nacht .. 1 Tag
    if(h>=7&&h<18) day=1; else if(h>=5.5&&h<7) day=(h-5.5)/1.5; else if(h>=18&&h<20.5) day=1-(h-18)/2.5; else day=0;
    const a=Math.max(0,Math.min(1,(h-6)/13))*Math.PI; // 6 Uhr Osten → 19 Uhr Westen
    let dir=new T.Vector3(Math.cos(Math.PI-a)*.95,Math.max(.12,Math.sin(a))*.9+.1,-.45);
    if(day<=0.02) dir.set(-.35,.75,-.3);
    U.uSunDir.value.copy(dir.normalize());
    const warm=Math.max(0,1-Math.abs(Math.sin(a))*1.6)*(day>.02?1:0);
    U.uSunCol.value.setRGB(1,.97-.22*warm,.9-.4*warm);
    if(day>.02){ U.uSunCol.value.multiplyScalar(.35+.65*day); }
    else U.uSunCol.value.setRGB(.55,.65,.95).multiplyScalar(.55);
    U.uAmb.value=.72+.28*day; U.uTint.value.setRGB(1-.2*(1-day)+.04*warm,1-.1*(1-day),1+.15*(1-day)-.05*warm);
    let wx='clear'; try{ if(Weather.isEnabled()) wx=Weather.current; }catch(e){}
    if(wx==='rain'){ U.uAmb.value*=.88; U.uSunCol.value.multiplyScalar(.6); }
    // Himmel
    const d=g._skyDome, m0=g._skyMat;
    if(d&&m0){
      if(d.material!==skyMat&&lv>0&&!g._moonMode){ if(!skyMat) skyMat=skyShader(); d.material=skyMat; lastDome=d; }
      if(skyMat&&d.material===skyMat){
        if(lv===0||g._moonMode){ d.material=m0; }
        else{
          const base=m0.color.clone(); const hsl={}; base.getHSL(hsl);
          const top=new T.Color().setHSL(hsl.h+.015,Math.min(1,hsl.s*1.15+.1),Math.max(.04,hsl.l*.62));
          const hor=new T.Color().setHSL(hsl.h-.01,Math.max(0,hsl.s*.55),Math.min(.92,hsl.l*1.12+.1));
          if(wx==='rain'){ top.lerp(new T.Color(0x56606c),.7); hor.lerp(new T.Color(0x8d98a3),.7); }
          if(wx==='fog'){ top.lerp(new T.Color(0xb4b6ba),.8); hor.lerp(new T.Color(0xcfd0d2),.9); }
          skyMat.uniforms.top.value.copy(top); skyMat.uniforms.hor.value.copy(hor);
          skyMat.uniforms.sun.value.copy(U.uSunDir.value); skyMat.uniforms.glow.value.setRGB(1,.75-.2*warm,.45-.2*warm);
          skyMat.uniforms.gi.value=(day>.02?.55+.9*warm:.0)*(wx==='clear'?1:.2);
          G._hor=hor;
        }
      }
    }
    // Nebel (Distanz)
    if(on&&G._hor&&d&&d.material===skyMat){
      if(!g.scene.fog) g.scene.fog=new T.Fog(0xcfe6ff,70,300);
      g.scene.fog.color.copy(G._hor);
      let near=80,far=330; if(wx==='rain'){ near=40; far=210; } else if(wx==='fog'){ near=8; far=110; } else if(day<.5){ near=60; far=260; }
      if(g._mtnView){ near=1500; far=7000; } else { far=Math.min(far,G.cull*1.02); near=Math.min(near,G.cull*.5); } // Bergfahrt/Gipfel: weite Sicht
      g.scene.fog.near+=(near-g.scene.fog.near)*.05; g.scene.fog.far+=(far-g.scene.fog.far)*.05;
    } else if(g.scene.fog){ g.scene.fog=null; }
    // Sonnenkugel folgt Richtung
    // Nur EINE Sonne: die weiche Himmels-Sonne (Shader). Die alte Kugel-Sonne samt Leuchten wird bei Normal/Schön versteckt.
    if(g._sunMesh){ if(lv>0&&!g._moonMode){ if(g._sunMesh.visible){ g._sunMesh.visible=false; g._sunMesh.userData._zhid=1; } } else if(g._sunMesh.userData._zhid){ g._sunMesh.userData._zhid=0; g._sunMesh.visible=true; } }
  }
  /* ── Sichtweite: Objekte weit weg werden nicht mehr gezeichnet (mit Nebel zusammen unauffällig) ── */
  let _b=null;
  let cullIdx=0, hiddenSet=new Set();
  function cullTick(){
    const T=window.THREE, g=ZGet(); if(!T||!g||!g.scene||!g.cam) return;
    const kids=g.scene.children, cp=g.cam.position, lim=G.cull, now=performance.now();
    const off=busy()||!(G.cull>0)||G.cullOff;
    if(off){ if(hiddenSet.size){ hiddenSet.forEach(o=>{ o.visible=true; o.userData._zc=0; }); hiddenSet.clear(); } return; }
    const sky=g._skyDome, stars=g._starsGroup;
    // Bounds reihum neu berechnen (max. 6 pro Tick, damit es nie ruckelt)
    let budget=6;
    for(let k=0;k<kids.length&&budget>0;k++){ const o=kids[(cullIdx+k)%kids.length]; const u=o.userData; if(u._zb&&now-u._zb.t<3500) continue; if(o.isLight||o===sky||o===stars||u.noCull||o.isSprite&&false) { u._zb={t:now,never:1}; continue; }
      budget--; try{ const wasVis=o.visible; _b=_b||new T.Box3(); _b.makeEmpty(); _b.setFromObject(o); if(_b.isEmpty()){ u._zb={t:now,never:1}; continue; } const c=new T.Vector3(); _b.getCenter(c); const r=_b.getSize(new T.Vector3()).length()*.5; u._zb={t:now,c,r,never:r>110||c.y>35||o===g._sunMesh||o===g._moonMesh}; }catch(e){ u._zb={t:now,never:1}; } }
    cullIdx=(cullIdx+6)%Math.max(1,kids.length);
    for(let i=0;i<kids.length;i++){ const o=kids[i], z=o.userData&&o.userData._zb; if(!z||z.never||!z.c) continue;
      const d=Math.hypot(z.c.x-cp.x,z.c.z-cp.z)-z.r-6;
      if(d>lim){ if(o.visible){ o.visible=false; o.userData._zc=1; hiddenSet.add(o); } }
      else if(o.userData._zc){ o.visible=true; o.userData._zc=0; hiddenSet.delete(o); } }
  }
  /* ── Nachbearbeitung (Bloom + Farbkorrektur + Randunschärfe + FXAA) ── */
  let composer=null, loading=false, loadedPP=false, origRender=null, inC=false, gradeP=null, fxaaP=null, bloomP=null;
  function loadScript(u){ return new Promise((res,rej)=>{ const s=document.createElement('script'); s.src=u; s.onload=res; s.onerror=rej; document.head.appendChild(s); }); }
  async function loadPP(){
    if(loading||loadedPP) return; loading=true;
    try{
      try{ await loadScript(BASE+'zpp.js?v=875'); }catch(e){ const L=['postprocessing/EffectComposer.js','shaders/CopyShader.js','shaders/LuminosityHighPassShader.js','postprocessing/Pass.js','postprocessing/ShaderPass.js','postprocessing/RenderPass.js','postprocessing/UnrealBloomPass.js','shaders/FXAAShader.js'];
        for(const f of L) await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/'+f); }
      loadedPP=!!(window.THREE&&THREE.EffectComposer&&THREE.UnrealBloomPass&&THREE.FXAAShader);
    }catch(e){ console.warn('ZLook: Nachbearbeitung nicht geladen',e); G.q=G.q==='auto'?'normal':G.q; }
    loading=false;
  }
  function build(){
    const g=ZGet(), T=THREE; if(composer||!g||!g.renderer||!g.scene||!g.cam||!T.EffectComposer) return;
    const r=g.renderer, w=window.innerWidth, h=window.innerHeight;
    composer=new T.EffectComposer(r);
    composer.addPass(new T.RenderPass(g.scene,g.cam));
    bloomP=new T.UnrealBloomPass(new T.Vector2(w/2,h/2),.32,.55,.9); composer.addPass(bloomP);
    gradeP=new T.ShaderPass({ uniforms:{tDiffuse:{value:null},res:{value:new T.Vector2(w,h)},night:{value:0}},
      vertexShader:'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader:`uniform sampler2D tDiffuse; uniform vec2 res; uniform float night; varying vec2 vUv;
      void main(){ vec2 c=vUv-.5; float e=smoothstep(.38,.85,length(c*vec2(res.x/res.y,1.0))); vec2 px=1.0/res*(1.0+e*2.6);
        vec3 col=texture2D(tDiffuse,vUv).rgb*0.4; col+=texture2D(tDiffuse,vUv+vec2(px.x,0.)*1.5).rgb*0.15; col+=texture2D(tDiffuse,vUv-vec2(px.x,0.)*1.5).rgb*0.15; col+=texture2D(tDiffuse,vUv+vec2(0.,px.y)*1.5).rgb*0.15; col+=texture2D(tDiffuse,vUv-vec2(0.,px.y)*1.5).rgb*0.15;
        vec3 sharp=texture2D(tDiffuse,vUv).rgb; col=mix(sharp,col,e*0.85);
        float l=dot(col,vec3(.299,.587,.114));
        col=mix(vec3(l),col,1.10);
        col=col*col*(3.0-2.0*col)*0.35+col*0.65;
        col=mix(col*vec3(.94,.97,1.06),col*vec3(1.06,1.02,.94),smoothstep(.2,.8,l));
        col*=1.0-0.32*smoothstep(.45,1.0,length(c*1.25));
        gl_FragColor=vec4(col,1.0); }` });
    composer.addPass(gradeP);
    fxaaP=new T.ShaderPass(T.FXAAShader); fxaaP.uniforms.resolution.value.set(1/(w*r.getPixelRatio()),1/(h*r.getPixelRatio())); composer.addPass(fxaaP);
    composer.setSize(w,h);
    window.addEventListener('resize',()=>{ try{ const W=window.innerWidth,H=window.innerHeight; composer.setSize(W,H); gradeP.uniforms.res.value.set(W,H); fxaaP.uniforms.resolution.value.set(1/(W*r.getPixelRatio()),1/(H*r.getPixelRatio())); bloomP.setSize(W/2,H/2); }catch(e){} });
    origRender=r.render.bind(r);
    r.render=function(s,c){ if(inC||!composer||!G.pp||s!==g.scene||c!==g.cam) return origRender(s,c); inC=true; try{ composer.render(); }catch(e){ console.warn('ZLook composer',e); G.pp=false; origRender(s,c); } inC=false; };
  }
  /* Leistungswächter: bei dauerhaft niedriger FPS automatisch auf Normal */
  let frames=0, t0=0, slow=0, step=0;
  function perfStep(){
    step++; const g=ZGet(), r=g&&g.renderer; const say=m=>{ try{ ZP.toast(m,3500); }catch(e){} };
    if(step===1&&G.pp){ G.q='normal'; G.autoDown=true; G.pp=false; say('⚙️ Läuft nicht flüssig → Grafik auf „Normal" gestellt.'); return; }
    if(r&&r.getPixelRatio()>.8){ const pr=Math.max(.75,r.getPixelRatio()-.25); r.setPixelRatio(pr); try{ composer&&composer.setPixelRatio(pr); r.setSize(window.innerWidth,window.innerHeight,true); }catch(e){} say('⚙️ Auflösung etwas gesenkt für flüssigeres Spiel.'); return; }
    if(G.cull>45){ G.cull=Math.max(45,Math.round(G.cull*.8)); say('⚙️ Sichtweite verkürzt: '+G.cull+' m.'); return; }
    // Körnung ist das Letzte, was wegfällt – und nur bei wirklich schlechten FPS (sonst ging sie schon bei kleinen Rucklern verloren)
    if(G.U&&G.U.uDet.value>0&&G.fps<(G.mobile?14:17)){ G.U.uDet.value=0; G._grainOff=1; G._okWin=0; say('⚙️ Sehr niedrige FPS → Oberflächen-Körnung vorübergehend aus (kommt von selbst zurück).'); return; }
  }
  function loop(now){
    try{
      if(!G.U) patch();
      env(); if((frames&7)===0) cullTick();
      if(G.mobile&&!G._pr&&ZGet()&&ZG.renderer){ G._pr=1; try{ const r=ZG.renderer; if(r.getPixelRatio()>1.5){ r.setPixelRatio(1.5); r.setSize(window.innerWidth,window.innerHeight,true); } }catch(e){} }
      const want=level()===2&&!busy();
      if(want&&!loadedPP&&!loading) loadPP().then(()=>{ if(loadedPP) try{ build(); }catch(e){ console.warn(e); } });
      G.pp=want&&loadedPP&&!!composer;
      if(!G.pp&&loadedPP&&!composer&&level()===2) try{ build(); }catch(e){}
      frames++; if(!t0) t0=now; if(now-t0>3000){ G.fps=frames*1000/(now-t0); frames=0; t0=now;
        const vis=!document.hidden&&G.fps>0;
        const zs=document.getElementById('s-zoo'), inZ=zs&&getComputedStyle(zs).display!=='none'&&ZGet()&&ZG.scene; if(inZ&&!G._since) G._since=now; if(!inZ) G._since=0;
        const grace=inZ&&G._since&&now-G._since>30000; // 30 s Schonfrist nach dem Laden (da ruckelt jeder kurz)
        // Körnung automatisch wieder an, sobald es ~15 s lang flüssig läuft
        if(G._grainOff&&G.U&&vis){ if(G.fps>=(G.mobile?26:30)){ if(++G._okWin>=5){ G.U.uDet.value=1; G._grainOff=0; try{ ZP.toast('✨ Läuft wieder flüssig → Oberflächen-Körnung wieder an.',3000); }catch(e){} } } else G._okWin=0; }
        if(vis&&grace&&G.fps<(G.mobile?22:27)){ slow++; if(slow>=(G.mobile?4:3)){ slow=0; perfStep(); } } else slow=0; }
    }catch(e){}
    try{ patch(); }catch(e){}
  requestAnimationFrame(loop);
  }
  try{ patch(); }catch(e){}
  requestAnimationFrame(loop);
  G.setCull=function(m){ G.cull=m; };
  G.set=function(q){ G.q=q; lss(q); slow=0; try{ ZP._rMenu&&ZP._rMenu(); }catch(e){} try{ ZP.toast('🎨 Grafik-Look: '+({classic:'Klassisch',normal:'Normal',high:'Schön',auto:'Schön'}[q]||q),2200); }catch(e){} };
  G.info=()=>{ try{ return (G.mobile?'Touch-Gerät':'Computer')+' · '+G.label()+(G.pp?' (Effekte an)':'')+' · Körnung '+((G.U&&G.U.uDet.value>0)?'an':'aus')+' · Sicht '+G.cull+' m · '+Math.round(G.fps||0)+' FPS'; }catch(e){ return ''; } };
  G.label=()=>({classic:'Klassisch',normal:'Normal',high:'Schön',auto:'Schön'}[G.q]||'Schön');
})();
