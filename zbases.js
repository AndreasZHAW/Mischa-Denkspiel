// ZBases — Base-Editor (nur Admin Bu:)), Basen im Shop kaufen/anlegen, Basen-Anzeige im Zoo, Likes (v648)
(function(){
  'use strict';
  const RAR=[
    {id:'normal',n:'Normal',c:'#bdc3c7'},{id:'selten',n:'Selten',c:'#3498db'},{id:'cool',n:'Cool',c:'#2ecc71'},
    {id:'wow',n:'Wow',c:'#e056fd'},{id:'extrem',n:'Extrem',c:'#ff3b3b'},{id:'kino',n:'Absolutes Kino',c:'#FFD700'}];
  const rarOf=id=>RAR.find(r=>r.id===id)||RAR[0];
  // Objekt-Katalog: kind p=3D-Figur, e=Emoji-Sprite, s=Schild "Base gehört NAME"
  const CAT=[
    {g:'🌳 Bäume',items:[
      {t:'pine',n:'Tanne',ic:'🌲',k:'p'},{t:'oak',n:'Eiche',ic:'🌳',k:'p'},{t:'palm',n:'Palme',ic:'🌴',k:'p'},{t:'cherry',n:'Kirschbaum',ic:'🌸',k:'p'},
      {t:'autumn',n:'Herbstbaum',ic:'🍂',k:'p'},{t:'bush',n:'Busch',ic:'🌿',k:'p'},{t:'xmas',n:'Weihnachtsbaum',ic:'🎄',k:'e'},{t:'cactus',n:'Kaktus',ic:'🌵',k:'e'}]},
    {g:'🌷 Natur',items:[
      {t:'flowerbed',n:'Blumenbeet',ic:'💐',k:'p'},{t:'tulip',n:'Tulpe',ic:'🌷',k:'e'},{t:'sunflower',n:'Sonnenblume',ic:'🌻',k:'e'},{t:'hibiscus',n:'Blüte',ic:'🌺',k:'e'},
      {t:'mushroom',n:'Pilz',ic:'🍄',k:'e'},{t:'rock',n:'Fels',ic:'🪨',k:'p'},{t:'pond',n:'Teich',ic:'💧',k:'p'},{t:'grass',n:'Rasen',ic:'🟩',k:'p'},{t:'rainbow',n:'Regenbogen',ic:'🌈',k:'e'},{t:'snowman',n:'Schneemann',ic:'⛄',k:'e'}]},
    {g:'🏠 Bauen',items:[
      {t:'sign',n:'Schild „Base gehört …"',ic:'🪧',k:'s'},{t:'fence',n:'Zaun',ic:'🚧',k:'p'},{t:'path',n:'Weg',ic:'🟫',k:'p'},{t:'lamp',n:'Laterne',ic:'💡',k:'p'},
      {t:'bench',n:'Bank',ic:'🪑',k:'p'},{t:'tent',n:'Zelt',ic:'⛺',k:'p'},{t:'hut',n:'Hütte',ic:'🛖',k:'e'},{t:'house',n:'Haus',ic:'🏠',k:'e'},
      {t:'castle',n:'Schloss',ic:'🏰',k:'e'},{t:'torii',n:'Tor',ic:'⛩️',k:'e'},{t:'tower',n:'Turm',ic:'🗼',k:'e'},{t:'bridge',n:'Brücke',ic:'🌉',k:'e'}]},
    {g:'✨ Deko',items:[
      {t:'fountain',n:'Brunnen',ic:'⛲',k:'p'},{t:'campfire',n:'Lagerfeuer',ic:'🔥',k:'p'},{t:'lantern',n:'Laterne rot',ic:'🏮',k:'e'},{t:'statue',n:'Statue',ic:'🗿',k:'e'},
      {t:'crystal',n:'Kristall',ic:'💎',k:'e'},{t:'star',n:'Stern',ic:'⭐',k:'e'},{t:'flag',n:'Flagge',ic:'🚩',k:'e'},{t:'carousel',n:'Karussell',ic:'🎠',k:'e'},
      {t:'ferris',n:'Riesenrad',ic:'🎡',k:'e'},{t:'circus',n:'Zirkus',ic:'🎪',k:'e'},{t:'balloon',n:'Ballon',ic:'🎈',k:'e'},{t:'vase',n:'Vase',ic:'🏺',k:'e'}]}
  ];
  const ALL={}; CAT.forEach(c=>c.items.forEach(i=>{ ALL[i.t]=i; }));
  const MAXOBJ=45;
  const U_MAX=22, V_MIN=-14, V_MAX=18; // Editor-Fläche (u = entlang der Reihe, v = nach vorne zum Ring-Zentrum)
  const isEd=()=>{ try{ const k=String((ZS.player||'')).trim().toLowerCase(); return k==='bu:)'||k==='bu:3'||!!ZS.isAdmin||!!(typeof ZAdmin!=='undefined'&&ZAdmin._hasAccess); }catch(e){ return false; } };
  const R=()=>{ try{ return (typeof _rtdb!=='undefined'&&_rtdb&&State._useCloud())?_rtdb:null; }catch(e){ return null; } };
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const today=()=>new Date().toISOString().slice(0,10);
  const keyOf=n=>String(n||'').toLowerCase().replace(/[.#$\[\]\/]/g,'_');

  const B=window.ZBases={
    list:{}, groups:{}, likes:{}, _inited:false, preview:null, RAR, CAT,
    multOf(z){ try{ const b=B.list[(z&&z.baseEq)||'']; return (b&&z.bases&&z.bases[b.id])?(+b.mult||1):1; }catch(e){ return 1; } },
    // ── Daten ──
    init(){
      if(B._inited) return; const r=R(); if(!r) return; B._inited=true;
      try{ r.ref('zoo_bases').on('value',s=>{ B.list=s.val()||{}; B._shopRefresh(); }); }catch(e){}
      try{ r.ref('zoo_likes_n').on('value',s=>{ B.likes=s.val()||{}; }); }catch(e){}
    },
    sorted(){ return Object.values(B.list).filter(b=>b&&b.id).sort((a,b)=>(+a.price||0)-(+b.price||0)); },
    // ── 3D ──
    _mats:{}, _geos:{}, _tex:{},
    mat(c){ return B._mats[c]||(B._mats[c]=new THREE.MeshBasicMaterial({color:c})); },
    geo(k,mk){ return B._geos[k]||(B._geos[k]=mk()); },
    sprite(emoji,s){
      let m=B._tex[emoji];
      if(!m){ const c=document.createElement('canvas'); c.width=c.height=128; const x=c.getContext('2d'); x.font='96px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif'; x.textAlign='center'; x.textBaseline='middle'; x.fillText(emoji,64,70);
        const t=new THREE.CanvasTexture(c); m=B._tex[emoji]=new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false}); }
      const sp=new THREE.Sprite(m); sp.scale.set(3.4*s,3.4*s,1); sp.position.y=1.7*s; return sp;
    },
    mesh(gk,mk,col){ return new THREE.Mesh(B.geo(gk,mk),B.mat(col)); },
    build3D(t,s){
      const g=new THREE.Group(), M=B.mesh.bind(B);
      const trunk=(h,col)=>{ const m=M('tr'+h,()=>new THREE.CylinderGeometry(.25,.35,h,6),col||0x7a5230); m.position.y=h/2; g.add(m); };
      switch(t){
        case 'pine': trunk(1.6); [[2.6,2.2,1.6],[2.0,1.8,3.3],[1.3,1.4,4.7]].forEach(([r,h,y])=>{ const m=M('pc'+r,()=>new THREE.ConeGeometry(r,h,8),0x1f7a3a); m.position.y=y; g.add(m); }); break;
        case 'oak': trunk(2.2); { const m=M('os',()=>new THREE.SphereGeometry(2.2,8,6),0x2f9e44); m.position.y=3.6; g.add(m); } break;
        case 'cherry': trunk(2.2,0x6b4a3a); { const m=M('os',()=>new THREE.SphereGeometry(2.2,8,6),0xf8a5c2); m.position.y=3.6; g.add(m); const m2=M('os2',()=>new THREE.SphereGeometry(1.4,8,6),0xffc2d9); m2.position.set(1.2,4.4,.6); g.add(m2); } break;
        case 'autumn': trunk(2.2); { const m=M('os',()=>new THREE.SphereGeometry(2.2,8,6),0xe67e22); m.position.y=3.6; g.add(m); const m2=M('os2',()=>new THREE.SphereGeometry(1.4,8,6),0xc0392b); m2.position.set(-1.1,4.3,.5); g.add(m2); } break;
        case 'palm': { const tr=M('palmT',()=>new THREE.CylinderGeometry(.22,.34,4.6,6),0x9c7a4a); tr.position.y=2.3; tr.rotation.z=.12; g.add(tr); for(let i=0;i<6;i++){ const l=M('palmL',()=>new THREE.BoxGeometry(.5,.12,2.6),0x27ae60); const a=i/6*Math.PI*2; l.position.set(Math.cos(a)*1.2+.5,4.7,Math.sin(a)*1.2); l.rotation.y=-a; l.rotation.z=-.35; g.add(l); } } break;
        case 'bush': { const m=M('bush',()=>new THREE.SphereGeometry(1.2,8,6),0x2ecc71); m.position.y=.8; m.scale.set(1.3,.8,1.1); g.add(m); } break;
        case 'rock': { const m=M('rock',()=>new THREE.DodecahedronGeometry(1.2),0x8e9aa0); m.position.y=.7; m.scale.set(1.2,.8,1); g.add(m); } break;
        case 'pond': { const m=M('pond',()=>new THREE.CylinderGeometry(3,3,.12,16),0x3aa0ff); m.position.y=.08; g.add(m); const r=M('pondR',()=>new THREE.TorusGeometry(3,.18,6,18),0x7f8c8d); r.rotation.x=Math.PI/2; r.position.y=.12; g.add(r); } break;
        case 'grass': { const m=M('grass',()=>new THREE.CylinderGeometry(3.2,3.2,.08,14),0x58c75a); m.position.y=.06; g.add(m); } break;
        case 'flowerbed': { const m=M('fb',()=>new THREE.CylinderGeometry(2,2,.2,12),0x6b4a2a); m.position.y=.1; g.add(m); [0xff5e8e,0xffd93b,0xb36bff,0xff8a3b,0xffffff].forEach((c,i)=>{ const f=M('fl'+i,()=>new THREE.SphereGeometry(.28,6,5),c); const a=i/5*Math.PI*2; f.position.set(Math.cos(a)*1.1,.45,Math.sin(a)*1.1); g.add(f); }); const f=M('fl9',()=>new THREE.SphereGeometry(.3,6,5),0xff5e8e); f.position.set(0,.5,0); g.add(f); } break;
        case 'fence': { const r=M('fr',()=>new THREE.BoxGeometry(4,.18,.12),0xb07a3c); r.position.y=1; g.add(r); const r2=M('fr',()=>new THREE.BoxGeometry(4,.18,.12),0xb07a3c); r2.position.y=.55; g.add(r2); [-1.9,-.95,0,.95,1.9].forEach(x=>{ const p=M('fp',()=>new THREE.BoxGeometry(.16,1.3,.16),0x8a5a2b); p.position.set(x,.65,0); g.add(p); }); } break;
        case 'path': { const m=M('path',()=>new THREE.BoxGeometry(4,.06,1.8),0xd2b48c); m.position.y=.04; g.add(m); } break;
        case 'lamp': { const p=M('lp',()=>new THREE.CylinderGeometry(.08,.1,3.2,6),0x333333); p.position.y=1.6; g.add(p); const l=M('ll',()=>new THREE.SphereGeometry(.4,8,6),0xfff2a8); l.position.y=3.3; g.add(l); } break;
        case 'bench': { const a=M('bs',()=>new THREE.BoxGeometry(2,.15,.7),0x9c6b3a); a.position.y=.6; g.add(a); const b=M('bb',()=>new THREE.BoxGeometry(2,.6,.12),0x9c6b3a); b.position.set(0,1,-.3); g.add(b); [-.8,.8].forEach(x=>{ const l=M('bl',()=>new THREE.BoxGeometry(.12,.6,.6),0x6b4a2a); l.position.set(x,.3,0); g.add(l); }); } break;
        case 'tent': { const m=M('tent',()=>new THREE.ConeGeometry(2,2.6,4),0xe74c3c); m.position.y=1.3; m.rotation.y=Math.PI/4; g.add(m); } break;
        case 'fountain': { const b=M('fo1',()=>new THREE.CylinderGeometry(2,2.2,.7,14),0x9aa5ab); b.position.y=.35; g.add(b); const w=M('fo2',()=>new THREE.CylinderGeometry(1.7,1.7,.1,14),0x3aa0ff); w.position.y=.72; g.add(w); const c=M('fo3',()=>new THREE.CylinderGeometry(.25,.35,1.6,8),0xb9c3c8); c.position.y=1.5; g.add(c); const t=M('fo4',()=>new THREE.SphereGeometry(.45,8,6),0x7cc8ff); t.position.y=2.4; g.add(t); } break;
        case 'campfire': { for(let i=0;i<4;i++){ const l=M('lg',()=>new THREE.CylinderGeometry(.12,.12,1.2,5),0x6b4a2a); const a=i/4*Math.PI*2; l.position.set(Math.cos(a)*.35,.2,Math.sin(a)*.35); l.rotation.z=Math.PI/2; l.rotation.y=a; g.add(l); } const f=M('fire',()=>new THREE.ConeGeometry(.5,1.4,6),0xff7a1a); f.position.y=.9; g.add(f); const f2=M('fire2',()=>new THREE.ConeGeometry(.28,.9,6),0xffd23b); f2.position.y=.8; g.add(f2); } break;
        default: break;
      }
      g.scale.setScalar(s); return g;
    },
    // Welt-Objekt aus Vorlage
    buildObj(o,owner,likes){
      const [t,u,v,rot,s]=o, d=ALL[t]; if(!d) return null;
      let node;
      if(d.k==='p') node=B.build3D(t,s||1);
      else if(d.k==='s'){
        node=new THREE.Group(); const post=new THREE.Mesh(B.geo('sp',()=>new THREE.CylinderGeometry(.12,.15,2.2,6)),B.mat(0x7a5230)); post.position.y=1.1; node.add(post);
        const lbl=ZG._txt('Base gehört '+owner+(likes?'  ❤️'+likes:''),.5,'#FFD700'); lbl.position.set(0,3,0); lbl.scale.set(9,2.2,1); node.add(lbl); node.userData.isSign=true;
      } else { node=new THREE.Group(); node.add(B.sprite(d.ic,s||1)); }
      node.userData.local={u,v,rot:rot||0}; return node;
    },
    // Gruppe an Slot-Position bauen
    buildBase(base,slot,owner,likes){
      const lay=ZG._slotEncPos(slot), a=lay.angle, c=lay.center;
      const tx=-Math.sin(a), tz=Math.cos(a), rx=Math.cos(a), rz=Math.sin(a);
      const yaw=Math.atan2(-Math.cos(a),-Math.sin(a));
      const grp=new THREE.Group(); grp.userData.center=c;
      let hasSign=false;
      (base.objs||[]).slice(0,MAXOBJ).forEach(o=>{
        const n=B.buildObj(o,owner,likes); if(!n) return; if(n.userData.isSign) hasSign=true;
        n.position.x=c.x+tx*o[1]-rx*o[2]; n.position.z=c.z+tz*o[1]-rz*o[2];
        if(ALL[o[0]]&&ALL[o[0]].k!=='e') n.rotation.y=yaw+(o[3]||0)*Math.PI/180;
        grp.add(n);
      });
      if(!hasSign){ const n=B.buildObj(['sign',0,6,0,1],owner,likes); n.position.x=c.x-rx*6; n.position.z=c.z-rz*6; grp.add(n); }
      return grp;
    },
    _drop(key){ const e=B.groups[key]; if(e){ try{ ZG.scene.remove(e.grp); }catch(x){} delete B.groups[key]; } },
    _ensure(key,base,slot,owner){
      if(!base){ B._drop(key); return; }
      const likes=B.likes[keyOf(owner)]||0, sig=[base.id,base.at||0,likes,owner,slot].join('|');
      const e=B.groups[key]; if(e&&e.sig===sig) return;
      B._drop(key);
      try{ const grp=B.buildBase(base,slot,owner,likes); ZG.scene.add(grp); B.groups[key]={grp,sig,slot}; }catch(err){ console.log('[Bases] Aufbau-Fehler: '+err.message); }
    },
    tick(){
      if(typeof ZG==='undefined'||!ZG.scene||!ZS.zoo||!ZS.player) return;
      B.init();
      // Editor-Knopf links nur für Bu:)
      const eb=document.getElementById('hb-base-editor'); if(eb) eb.style.display=isEd()?'':'none';
      const z=ZS.zoo, slot=(typeof ZS.mySlot==='number')?ZS.mySlot:0;
      let mine=B.preview||((z.baseEq&&z.bases&&z.bases[z.baseEq])?B.list[z.baseEq]:null);
      B._ensure('me',mine,slot,ZS.player);
      // andere Spieler (nur die, die gerade da sind)
      const others=ZG.otherPl||{}; const seen={me:1};
      Object.keys(others).forEach(n=>{ const op=others[n]; const k='o_'+n; seen[k]=1;
        const b=op&&op.baseEq?B.list[op.baseEq]:null; B._ensure(k,b,typeof op.slotIdx==='number'?op.slotIdx:0,n); });
      Object.keys(B.groups).forEach(k=>{ if(!seen[k]) B._drop(k); });
      // Entfernung: weit weg ausblenden (Leistung)
      const px=ZG.pl.x, pz=ZG.pl.z;
      Object.keys(B.groups).forEach(k=>{ const e=B.groups[k], c=e.grp.userData.center; e.grp.visible=Math.hypot(c.x-px,c.z-pz)<95; });
      B._likeBtn(others);
    },
    // ── Likes (Zoo-Führung) ──
    _likeBtn(others){
      let best=null,bd=26;
      Object.keys(others).forEach(n=>{ const op=others[n]; if(!op||!op.baseEq||!B.list[op.baseEq]) return; const lay=ZG._slotEncPos(typeof op.slotIdx==='number'?op.slotIdx:0);
        const d=Math.hypot(lay.center.x-ZG.pl.x,lay.center.z-ZG.pl.z); if(d<bd){ bd=d; best=n; } });
      let btn=document.getElementById('base-like-btn');
      if(!best){ if(btn) btn.style.display='none'; return; }
      if(!btn){ btn=document.createElement('button'); btn.id='base-like-btn';
        btn.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:150px;z-index:700;background:linear-gradient(135deg,#ff5e8e,#ff3b6b);border:2px solid #fff;color:#fff;font-weight:900;font-size:.9rem;padding:9px 18px;border-radius:50px;box-shadow:0 4px 14px rgba(0,0,0,.5);cursor:pointer';
        ['pointerup','touchend','click'].forEach(ev=>btn.addEventListener(ev,e=>{ try{e.preventDefault();}catch(x){} if(btn._busy) return; btn._busy=true; setTimeout(()=>{btn._busy=false;},600); B.like(btn.dataset.owner); },{passive:false}));
        document.body.appendChild(btn); }
      btn.dataset.owner=best; btn.textContent='❤️ Base von '+best+' liken'; btn.style.display='';
    },
    async like(owner){
      const r=R(); if(!r||!owner) return; const ok=keyOf(owner), me=keyOf(ZS.player); if(ok===me) return;
      const ref=r.ref('zoo_likes/'+ok+'/'+me);
      try{
        const s=await ref.once('value'); if(s.val()===today()){ ZP.toast('❤️ Du hast die Base von '+owner+' heute schon geliked.',2500); return; }
        await ref.set(today()); await r.ref('zoo_likes_n/'+ok).transaction(v=>(v||0)+1);
        ZP.toast('❤️ Like für '+owner+'s Base!',2500); try{ MTPass.addXP(25,'Base-Like'); }catch(e){}
      }catch(e){ ZP.toast('❌ Like konnte nicht gesendet werden.',2500); }
    },
    // ── Shop ──
    shopHTML(){
      const z=ZS.zoo, bs=B.sorted(); if(!bs.length) return '';
      let h='<div style="margin-top:14px;background:rgba(255,215,0,.06);border:1px solid rgba(255,215,0,.3);border-radius:12px;padding:10px"><div style="font-weight:900;color:#FFD700;font-size:.85rem;margin-bottom:4px">🏗️ Basen</div><div style="font-size:.68rem;color:rgba(255,255,255,.45);margin-bottom:8px">Gestalte deinen Platz im Zoo — jede Base gibt einen Einkommens-Multi. Andere Spieler können dir ❤️ geben.</div>';
      bs.forEach(b=>{
        const r=rarOf(b.rarity), own=!!(z.bases&&z.bases[b.id]), eq=z.baseEq===b.id, combined=(ZS.dsMT||0)+(z.mt||0), can=combined>=(+b.price||0);
        const btn=own?(eq?'<button class="ab" onclick="ZBases.unequip()">✅ Angelegt · Ablegen</button>':'<button class="ab" onclick="ZBases.equip(\''+b.id+'\')">Anlegen</button>'):'<button class="ab" '+(can?'':'disabled')+' onclick="ZBases.buy(\''+b.id+'\')">'+(can?'Kaufen':'Fehlt')+'</button>';
        h+='<div style="display:flex;gap:8px;align-items:center;padding:6px 0;border-top:1px solid rgba(255,255,255,.07)"><canvas class="zb-thumb" data-bid="'+b.id+'" width="96" height="72" style="border-radius:8px;background:#2c5a2e;flex:none"></canvas>'
          +'<div style="flex:1;min-width:0"><div style="font-weight:800;font-size:.82rem">'+esc(b.name)+'</div><div style="font-size:.68rem;font-weight:900;color:'+r.c+'">'+r.n+' · ×'+(+b.mult||1)+' Einkommen</div><div style="font-size:.66rem;color:rgba(255,255,255,.45)">'+(own?'Gehört dir':$mt(+b.price||0))+'</div></div>'+btn+'</div>';
      });
      return h+'</div>';
    },
    _shopRefresh(){ try{ if(!document.getElementById('p-shop')||document.getElementById('p-shop').classList.contains('off')) return; ZP._rShop&&ZP._rShop(); }catch(e){} },
    thumbs(root){ try{ (root||document).querySelectorAll('canvas.zb-thumb').forEach(c=>{ const b=B.list[c.dataset.bid]; if(b) B.drawTo(c,b,false); }); }catch(e){} },
    buy(id){
      const z=ZS.zoo, b=B.list[id]; if(!b) return; if(z.bases&&z.bases[id]) return;
      if(((ZS.dsMT||0)+(z.mt||0))<(+b.price||0)){ ZP.toast('❌ Zu wenig MT!'); return; }
      z.mt-=(+b.price||0); z.bases=z.bases||{}; z.bases[id]=true; z.baseEq=id;
      ZS.save&&ZS.save(true); try{ ZG._updHUD&&ZG._updHUD(); }catch(e){}
      ZP.toast('🏗️ Base „'+b.name+'" gekauft und angelegt!',3500); B.tick(); try{ ZP._rShop&&ZP._rShop(); }catch(e){}
    },
    equip(id){ const z=ZS.zoo; if(!z.bases||!z.bases[id]) return; z.baseEq=id; ZS.save&&ZS.save(true); B.tick(); try{ ZP._rShop&&ZP._rShop(); }catch(e){} ZP.toast('🏗️ Base angelegt!',2000); },
    unequip(){ const z=ZS.zoo; z.baseEq=null; ZS.save&&ZS.save(true); B.tick(); try{ ZP._rShop&&ZP._rShop(); }catch(e){} },
    // ── Zeichnen (Editor + Vorschau) ──
    drawTo(cv,base,grid,sel){
      const W=cv.width,H=cv.height,sx=W/(2*U_MAX),sy=H/(V_MAX-V_MIN), x=cv.getContext('2d');
      const px=u=>(u+U_MAX)*sx, py=v=>(v-V_MIN)*sy;
      x.fillStyle='#3f8f45'; x.fillRect(0,0,W,H);
      if(grid){ x.strokeStyle='rgba(255,255,255,.13)'; x.lineWidth=1; for(let u=-U_MAX;u<=U_MAX;u+=4){ x.beginPath(); x.moveTo(px(u),0); x.lineTo(px(u),H); x.stroke(); } for(let v=V_MIN;v<=V_MAX;v+=4){ x.beginPath(); x.moveTo(0,py(v)); x.lineTo(W,py(v)); x.stroke(); } }
      // Gehege-Reihe (5 Stück)
      x.fillStyle='rgba(120,80,40,.8)'; for(let i=0;i<5;i++){ const u=(i-2)*8; x.fillRect(px(u-3.5),py(-3.5),7*sx-1,7*sy); }
      if(grid){ x.fillStyle='rgba(255,255,255,.7)'; x.font=Math.max(9,sy*1.6)+'px sans-serif'; x.textAlign='center'; x.fillText('Gehege',px(0),py(0)+3); x.fillText('▼ Vorne (Besucher)',px(0),H-4); }
      (base.objs||[]).forEach((o,i)=>{ const d=ALL[o[0]]; if(!d) return; const s=(o[4]||1);
        x.font=Math.round((grid?3.2:2.6)*sy*Math.min(1.8,.7+s*.5))+'px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif'; x.textAlign='center'; x.textBaseline='middle';
        x.fillText(d.ic,px(o[1]),py(o[2]));
        if(sel===i){ x.strokeStyle='#FFD700'; x.lineWidth=2; x.beginPath(); x.arc(px(o[1]),py(o[2]),Math.max(10,sy*2.4),0,7); x.stroke(); } });
    },
    // ── Editor ──
    ed:null,
    openEditor(){
      if(!isEd()){ ZP.toast('🔒 Nur für Bu:)'); return; }
      B.init(); if(document.getElementById('zb-editor')) return;
      B.ed={id:null,name:'',price:100000,mult:1.5,rarity:'normal',objs:[],pick:null,sel:-1};
      const ov=document.createElement('div'); ov.id='zb-editor';
      ov.style.cssText='position:fixed;inset:0;z-index:99990;background:rgba(10,14,24,.98);color:#fff;font-family:Arial,sans-serif;overflow-y:auto;-webkit-overflow-scrolling:touch';
      ov.innerHTML='<div style="max-width:440px;margin:0 auto;padding:10px 12px 40px">'
        +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><div style="flex:1;font-weight:900;color:#FFD700;font-size:1.05rem">🏗️ Base-Editor</div><button id="zb-x" style="background:rgba(255,255,255,.12);border:none;color:#fff;border-radius:50%;width:34px;height:34px;font-size:1rem;cursor:pointer">✕</button></div>'
        +'<div id="zb-list" style="display:flex;gap:6px;overflow-x:auto;padding-bottom:6px"></div>'
        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:6px 0"><input id="zb-name" placeholder="Base-Name" style="grid-column:1/-1;padding:9px;border-radius:8px;border:1px solid #445;background:#161c2c;color:#fff;font-size:.9rem">'
        +'<label style="font-size:.68rem;color:#aab">Preis (MT)<input id="zb-price" type="number" min="0" style="width:100%;padding:8px;border-radius:8px;border:1px solid #445;background:#161c2c;color:#fff"></label>'
        +'<label style="font-size:.68rem;color:#aab">Multiplikator (×)<input id="zb-mult" type="number" min="1" step="0.1" style="width:100%;padding:8px;border-radius:8px;border:1px solid #445;background:#161c2c;color:#fff"></label>'
        +'<label style="grid-column:1/-1;font-size:.68rem;color:#aab">Seltenheit<select id="zb-rar" style="width:100%;padding:8px;border-radius:8px;border:1px solid #445;background:#161c2c;color:#fff">'+RAR.map(r=>'<option value="'+r.id+'">'+r.n+'</option>').join('')+'</select></label></div>'
        +'<canvas id="zb-cv" width="352" height="264" style="width:100%;max-width:400px;border-radius:10px;touch-action:none;display:block;margin:0 auto;border:2px solid #2d5a30"></canvas>'
        +'<div id="zb-sel" style="display:flex;gap:6px;justify-content:center;margin:6px 0;flex-wrap:wrap"></div>'
        +'<div id="zb-pal"></div>'
        +'<div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap"><button id="zb-save" class="zb-b" style="background:#27AE60">💾 Speichern</button><button id="zb-new" class="zb-b">🆕 Neu</button><button id="zb-prev" class="zb-b" style="background:#8e44ad">👁 Im Zoo ansehen</button><button id="zb-del" class="zb-b" style="background:#c0392b">🗑 Base löschen</button></div>'
        +'<div id="zb-msg" style="font-size:.72rem;color:#9fd;margin-top:8px;min-height:1em"></div></div>'
        +'<style>.zb-b{flex:1;min-width:110px;border:none;color:#fff;background:#34495e;padding:10px;border-radius:10px;font-weight:800;cursor:pointer;font-size:.8rem}.zb-i{border:2px solid transparent;background:#1d2538;color:#fff;border-radius:9px;padding:5px 7px;margin:2px;font-size:.72rem;cursor:pointer}.zb-i.on{border-color:#FFD700;background:#34415f}</style>';
      document.body.appendChild(ov);
      B._edUI();
    },
    _edUI(){
      const ov=document.getElementById('zb-editor'), e=B.ed, $=id=>ov.querySelector(id), cv=$('#zb-cv');
      const msg=t=>{ $('#zb-msg').textContent=t; };
      const draw=()=>B.drawTo(cv,e,true,e.sel);
      const sync=()=>{ e.name=$('#zb-name').value; e.price=+$('#zb-price').value||0; e.mult=+$('#zb-mult').value||1; e.rarity=$('#zb-rar').value; };
      const fill=()=>{ $('#zb-name').value=e.name; $('#zb-price').value=e.price; $('#zb-mult').value=e.mult; $('#zb-rar').value=e.rarity; };
      const list=()=>{ const l=$('#zb-list'); l.innerHTML=B.sorted().map(b=>'<button class="zb-i'+(e.id===b.id?' on':'')+'" data-id="'+b.id+'" style="flex:none;border-color:'+rarOf(b.rarity).c+'">'+esc(b.name)+'</button>').join('')||'<span style="font-size:.7rem;color:#889">Noch keine Basen gespeichert.</span>';
        l.querySelectorAll('button').forEach(b=>b.onclick=()=>{ const t=B.list[b.dataset.id]; if(!t) return; Object.assign(e,{id:t.id,name:t.name,price:t.price,mult:t.mult,rarity:t.rarity,objs:JSON.parse(JSON.stringify(t.objs||[])),sel:-1}); fill(); draw(); list(); selUI(); msg('„'+t.name+'" geladen.'); }); };
      const pal=()=>{ $('#zb-pal').innerHTML='<div style="margin-bottom:4px"><button class="zb-i'+(e.pick?'':' on')+'" data-t="">✋ Auswählen / Verschieben</button></div>'+CAT.map(c=>'<div style="font-size:.66rem;color:#99a;margin:6px 0 2px">'+c.g+'</div>'+c.items.map(i=>'<button class="zb-i'+(e.pick===i.t?' on':'')+'" data-t="'+i.t+'">'+i.ic+' '+i.n+'</button>').join('')).join('');
        $('#zb-pal').querySelectorAll('button').forEach(b=>b.onclick=()=>{ e.pick=b.dataset.t||null; pal(); }); };
      const selUI=()=>{ const s=$('#zb-sel'), o=e.objs[e.sel]; if(!o){ s.innerHTML='<span style="font-size:.7rem;color:#889">'+e.objs.length+'/'+MAXOBJ+' Objekte · Tippe aufs Feld zum Platzieren, tippe ein Objekt zum Auswählen</span>'; return; }
        s.innerHTML='<b style="font-size:.75rem;align-self:center">'+ALL[o[0]].ic+' '+ALL[o[0]].n+'</b><button class="zb-i" data-a="rot">↻ Drehen</button><button class="zb-i" data-a="big">＋ Grösser</button><button class="zb-i" data-a="small">－ Kleiner</button><button class="zb-i" data-a="copy">⧉ Kopie</button><button class="zb-i" data-a="del">🗑 Löschen</button>';
        s.querySelectorAll('button').forEach(b=>b.onclick=()=>{ const a=b.dataset.a; if(a==='rot') o[3]=((o[3]||0)+45)%360; else if(a==='big') o[4]=Math.min(2.5,Math.round(((o[4]||1)+.25)*100)/100); else if(a==='small') o[4]=Math.max(.5,Math.round(((o[4]||1)-.25)*100)/100);
          else if(a==='copy'){ if(e.objs.length<MAXOBJ){ e.objs.push([o[0],Math.min(U_MAX,o[1]+2),o[2],o[3],o[4]]); e.sel=e.objs.length-1; } } else if(a==='del'){ e.objs.splice(e.sel,1); e.sel=-1; } draw(); selUI(); }); };
      const pos=ev=>{ const r=cv.getBoundingClientRect(); const px=(ev.clientX-r.left)/r.width*cv.width, py=(ev.clientY-r.top)/r.height*cv.height; return {u:Math.round(((px/cv.width)*2*U_MAX-U_MAX)*2)/2, v:Math.round(((py/cv.height)*(V_MAX-V_MIN)+V_MIN)*2)/2}; };
      let drag=false;
      cv.onpointerdown=ev=>{ ev.preventDefault(); try{ cv.setPointerCapture(ev.pointerId); }catch(x){} const p=pos(ev);
        let hit=-1,bd=2.6; e.objs.forEach((o,i)=>{ const d=Math.hypot(o[1]-p.u,o[2]-p.v); if(d<bd){ bd=d; hit=i; } });
        if(hit>=0){ e.sel=hit; drag=true; }
        else if(e.pick){ if(e.objs.length>=MAXOBJ){ msg('Maximal '+MAXOBJ+' Objekte.'); } else { if(e.pick==='sign'&&e.objs.some(o=>o[0]==='sign')){ msg('Es gibt schon ein Schild.'); } else { e.objs.push([e.pick,p.u,p.v,0,1]); e.sel=e.objs.length-1; } } }
        else e.sel=-1;
        draw(); selUI(); };
      cv.onpointermove=ev=>{ if(!drag||e.sel<0) return; const p=pos(ev), o=e.objs[e.sel]; o[1]=Math.max(-U_MAX,Math.min(U_MAX,p.u)); o[2]=Math.max(V_MIN,Math.min(V_MAX,p.v)); draw(); };
      cv.onpointerup=cv.onpointercancel=()=>{ drag=false; };
      $('#zb-x').onclick=()=>{ B.preview=null; ov.remove(); B.tick(); };
      $('#zb-new').onclick=()=>{ Object.assign(e,{id:null,name:'',price:100000,mult:1.5,rarity:'normal',objs:[],sel:-1}); fill(); draw(); list(); selUI(); msg('Neue Base.'); };
      $('#zb-prev').onclick=()=>{ sync(); if(B.preview){ B.preview=null; msg('Vorschau aus.'); } else { B.preview={id:'__prev',at:Date.now(),objs:JSON.parse(JSON.stringify(e.objs))}; msg('Vorschau läuft — schliesse den Editor (✕) und schau im Zoo auf deinen Platz. Zum Beenden hier nochmal drücken.'); } B.tick(); };
      $('#zb-save').onclick=async()=>{ sync(); const r=R(); if(!r){ msg('❌ Keine Cloud-Verbindung.'); return; } if(!e.name.trim()){ msg('❌ Bitte einen Namen eingeben.'); return; }
        const id=e.id||('b'+Date.now().toString(36)); const rec={id,name:e.name.trim().slice(0,30),price:Math.max(0,e.price),mult:Math.max(1,e.mult),rarity:e.rarity,objs:e.objs.slice(0,MAXOBJ),by:ZS.player,at:Date.now()};
        try{ await r.ref('zoo_bases/'+id).set(JSON.parse(JSON.stringify(rec))); e.id=id; B.list[id]=rec; list(); msg('✅ „'+rec.name+'" gespeichert — ist jetzt im Shop.'); }catch(err){ msg('❌ Speichern fehlgeschlagen: '+err.message); } };
      $('#zb-del').onclick=async()=>{ if(!e.id){ msg('Diese Base ist noch nicht gespeichert.'); return; } if(!confirm('Base „'+e.name+'" wirklich löschen?')) return; const r=R(); try{ await r.ref('zoo_bases/'+e.id).remove(); delete B.list[e.id]; Object.assign(e,{id:null,objs:[],sel:-1}); list(); draw(); selUI(); msg('Gelöscht.'); }catch(err){ msg('❌ '+err.message); } };
      ['#zb-name','#zb-price','#zb-mult','#zb-rar'].forEach(s=>$(s).addEventListener('input',sync));
      fill(); list(); pal(); draw(); selUI();
    }
  };
  setInterval(()=>{ try{ B.tick(); }catch(e){} },1500);
})();
