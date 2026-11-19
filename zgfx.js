/* ZGfx (v840): 🎨 Realistischere Grafik – Licht & Schattierung (Sonnenstand nach Uhrzeit), Himmelsverlauf, Distanz-Nebel, Oberflächen-Details,
   dazu "Schön"-Stufe mit Bloom, Farbkorrektur, Randunschärfe und Kantenglättung. Stufen: klassisch / normal / schön (Menü → Grafik-Look). */
(function(){
  'use strict';
  if(window.ZGfx) return;
  const G=window.ZGfx={q:'auto',U:null,ready:false,pp:false,fps:0};
  const lsg=()=>{ try{ return localStorage.getItem('zgfx_q'); }catch(e){ return null; } };
  const lss=v=>{ try{ localStorage.setItem('zgfx_q',v); }catch(e){} };
  G.q=lsg()||'auto'; // auto = Schön, fällt bei schwacher Leistung auf Normal zurück
  const level=()=>G.q==='classic'?0:(G.q==='normal'?1:2);
  const CDN='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/';
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
  float g1=zn3(vZW*1.7), g2=zn3(vZW*7.3);
  vec3 vd=normalize(cameraPosition-vZW);
  // Mikro-Relief: Normale leicht durch Rauschen kippen (Stein/Holz/Putz bekommen Körnung)
  vec3 bn=normalize(n+(vec3(g2,zn3(vZW*7.3+5.0),zn3(vZW*7.3+9.0))-0.5)*0.34*uDet);
  float ndl=max(dot(bn,uSunDir),0.0); float hemi=n.y*0.5+0.5;
  vec3 s=vec3(uAmb)*(0.60+0.16*hemi)+uSunCol*0.46*ndl;
  float det=1.0+((g1-0.5)*0.10+(g2-0.5)*0.08)*uDet;
  vec3 hv=normalize(uSunDir+vd); float sp=pow(max(dot(bn,hv),0.0),26.0)*0.10*(0.4+g1)*step(0.0,ndl-0.001);
  outgoingLight=outgoingLight*s*uTint*det+uSunCol*sp*uZOn;
} }`);
    };
    P.customProgramCacheKey=function(){ return skip(this)?'zf':'zs'; };
  }
  /* ── Himmel / Nebel / Sonnenstand ── */
  function busy(){ const g=window.ZG; if(!g) return true; return !!(g._steActive||g._jumpActive||g._iceRoomActive||g._mazeActive||g._windRoomActive||g._arcadeActive||g._trashActive||g._moonMode); }
  const hour=()=>{ if(G.hourOverride!=null) return G.hourOverride; const d=new Date(); return d.getHours()+d.getMinutes()/60; };
  let skyMat=null, lastDome=null;
  function skyShader(){ const T=THREE; return new T.ShaderMaterial({ side:T.BackSide, depthWrite:false, fog:false, uniforms:{top:{value:new T.Color(0x3a78c8)},hor:{value:new T.Color(0xcfe6ff)},sun:{value:new T.Vector3(0,1,0)},glow:{value:new T.Color(1,.8,.5)},gi:{value:.5}},
    vertexShader:'varying vec3 vP; void main(){ vP=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader:'uniform vec3 top; uniform vec3 hor; uniform vec3 sun; uniform vec3 glow; uniform float gi; varying vec3 vP; void main(){ float h=clamp(vP.y,0.0,1.0); vec3 c=mix(hor,top,pow(h,0.55)); c=mix(c,hor*0.85,smoothstep(0.0,-0.35,vP.y)); float d=max(dot(normalize(vP),normalize(sun)),0.0); c+=glow*(pow(d,7.0)*0.28+pow(d,90.0)*0.5)*gi; gl_FragColor=vec4(c,1.0); }' }); }
  function env(){
    const T=window.THREE, g=window.ZG; if(!T||!G.U||!g||!g.scene) return;
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
      g.scene.fog.near+=(near-g.scene.fog.near)*.05; g.scene.fog.far+=(far-g.scene.fog.far)*.05;
    } else if(g.scene.fog){ g.scene.fog=null; }
    // Sonnenkugel folgt Richtung
    if(g._sunMesh&&lv>0&&!g._moonMode&&day>.02&&tod){ g._sunMesh.position.copy(U.uSunDir.value).multiplyScalar(170); }
  }
  /* ── Nachbearbeitung (Bloom + Farbkorrektur + Randunschärfe + FXAA) ── */
  let composer=null, loading=false, loadedPP=false, origRender=null, inC=false, gradeP=null, fxaaP=null, bloomP=null;
  function loadScript(u){ return new Promise((res,rej)=>{ const s=document.createElement('script'); s.src=u; s.onload=res; s.onerror=rej; document.head.appendChild(s); }); }
  async function loadPP(){
    if(loading||loadedPP) return; loading=true;
    try{
      const L=['postprocessing/EffectComposer.js','shaders/CopyShader.js','shaders/LuminosityHighPassShader.js','postprocessing/Pass.js','postprocessing/ShaderPass.js','postprocessing/RenderPass.js','postprocessing/UnrealBloomPass.js','shaders/FXAAShader.js'];
      for(const f of L) await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/'+f);
      loadedPP=true;
    }catch(e){ console.warn('ZGfx: Nachbearbeitung nicht geladen',e); G.q=G.q==='auto'?'normal':G.q; }
    loading=false;
  }
  function build(){
    const g=window.ZG, T=THREE; if(composer||!g||!g.renderer||!g.scene||!g.cam||!T.EffectComposer) return;
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
    r.render=function(s,c){ if(inC||!composer||!G.pp||s!==g.scene||c!==g.cam) return origRender(s,c); inC=true; try{ composer.render(); }catch(e){ console.warn('ZGfx composer',e); G.pp=false; origRender(s,c); } inC=false; };
  }
  /* Leistungswächter: bei dauerhaft niedriger FPS automatisch auf Normal */
  let frames=0, t0=0, slow=0;
  function loop(now){
    try{
      if(!G.U) patch();
      env();
      const want=level()===2&&!busy();
      if(want&&!loadedPP&&!loading) loadPP().then(()=>{ if(loadedPP) try{ build(); }catch(e){ console.warn(e); } });
      G.pp=want&&loadedPP&&!!composer;
      if(!G.pp&&loadedPP&&!composer&&level()===2) try{ build(); }catch(e){}
      frames++; if(!t0) t0=now; if(now-t0>3000){ G.fps=frames*1000/(now-t0); frames=0; t0=now;
        if(G.pp&&G.q==='auto'){ if(G.fps<24){ slow++; if(slow>=2){ G.q='normal'; lss('normal'); G.pp=false; try{ ZP.toast('🎨 Grafik auf „Normal" gestellt (flüssiger).',3500); }catch(e){} } } else slow=0; } }
    }catch(e){}
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  G.set=function(q){ G.q=q; lss(q); slow=0; try{ ZP._rMenu&&ZP._rMenu(); }catch(e){} try{ ZP.toast('🎨 Grafik-Look: '+({classic:'Klassisch',normal:'Normal',high:'Schön',auto:'Schön'}[q]||q),2200); }catch(e){} };
  G.label=()=>({classic:'Klassisch',normal:'Normal',high:'Schön',auto:'Schön'}[G.q]||'Schön');
})();
