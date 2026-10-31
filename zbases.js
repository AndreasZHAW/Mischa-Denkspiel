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
      {t:'autumn',n:'Herbstbaum',ic:'🍂',k:'p'},{t:'bush',n:'Busch',ic:'🌿',k:'p'},{t:'xmas',n:'Weihnachtsbaum',ic:'🎄',k:'e'},{t:'cactus',n:'Kaktus',ic:'🌵',k:'e'},{t:'birch',n:'Birke',ic:'🌱',k:'p'},{t:'bamboo',n:'Bambus',ic:'🎍',k:'p'},{t:'snowpine',n:'Schnee-Tanne',ic:'❄️',k:'p'}]},
    {g:'🌷 Natur',items:[
      {t:'flowerbed',n:'Blumenbeet',ic:'💐',k:'p'},{t:'tulip',n:'Tulpe',ic:'🌷',k:'e'},{t:'sunflower',n:'Sonnenblume',ic:'🌻',k:'e'},{t:'hibiscus',n:'Blüte',ic:'🌺',k:'e'},
      {t:'mushroom',n:'Pilz',ic:'🍄',k:'e'},{t:'rock',n:'Fels',ic:'🪨',k:'p'},{t:'pond',n:'Teich',ic:'💧',k:'p'},{t:'grass',n:'Rasen',ic:'🟩',k:'p'},{t:'rainbow',n:'Regenbogen',ic:'🌈',k:'e'},{t:'snowman',n:'Schneemann',ic:'⛄',k:'e'},{t:'lava',n:'Lava-See',ic:'🟧',k:'p'},{t:'icepond',n:'Eis-See',ic:'🧊',k:'p'},{t:'haybale',n:'Heuballen',ic:'🌾',k:'p'},{t:'mountain',n:'Berg',ic:'🏔️',k:'e'},{t:'volcano',n:'Vulkan',ic:'🌋',k:'e'},{t:'island',n:'Insel',ic:'🏝️',k:'e'}]},
    {g:'🏠 Bauen',items:[
      {t:'sign',n:'Schild „Base gehört …"',ic:'🪧',k:'s'},{t:'fence',n:'Zaun',ic:'🚧',k:'p'},{t:'path',n:'Weg',ic:'🟫',k:'p'},{t:'lamp',n:'Laterne',ic:'💡',k:'p'},
      {t:'bench',n:'Bank',ic:'🪑',k:'p'},{t:'tent',n:'Zelt',ic:'⛺',k:'p'},{t:'hut',n:'Hütte',ic:'🛖',k:'e'},{t:'house',n:'Haus',ic:'🏠',k:'e'},
      {t:'castle',n:'Schloss',ic:'🏰',k:'e'},{t:'torii',n:'Tor',ic:'⛩️',k:'e'},{t:'tower',n:'Turm',ic:'🗼',k:'e'},{t:'bridge',n:'Brücke',ic:'🌉',k:'e'},{t:'windmill',n:'Windmühle',ic:'🌀',k:'p'},{t:'well',n:'Brunnen (Wasser holen)',ic:'🪣',k:'p'},{t:'arch',n:'Stein-Bogen',ic:'🏛️',k:'p'},{t:'roof',n:'Dach-Platte (8×8)',ic:'⬛',k:'p'}]},
    {g:'✨ Deko',items:[
      {t:'fountain',n:'Brunnen',ic:'⛲',k:'p'},{t:'campfire',n:'Lagerfeuer',ic:'🔥',k:'p'},{t:'lantern',n:'Laterne rot',ic:'🏮',k:'e'},{t:'statue',n:'Statue',ic:'🗿',k:'e'},
      {t:'crystal',n:'Kristall',ic:'💎',k:'e'},{t:'star',n:'Stern',ic:'⭐',k:'e'},{t:'flag',n:'Flagge',ic:'🚩',k:'e'},{t:'carousel',n:'Karussell',ic:'🎠',k:'e'},
      {t:'ferris',n:'Riesenrad',ic:'🎡',k:'e'},{t:'circus',n:'Zirkus',ic:'🎪',k:'e'},{t:'balloon',n:'Ballon',ic:'🎈',k:'e'},{t:'vase',n:'Vase',ic:'🏺',k:'e'},{t:'coaster',n:'Achterbahn',ic:'🎢',k:'e'},{t:'slide',n:'Rutsche',ic:'🛝',k:'e'},{t:'rocket',n:'Rakete',ic:'🚀',k:'e'},{t:'ufo',n:'Ufo',ic:'🛸',k:'e'},{t:'dragon',n:'Drache',ic:'🐉',k:'e'},{t:'unicorn',n:'Einhorn',ic:'🦄',k:'e'},{t:'teddy',n:'Teddy',ic:'🧸',k:'e'},{t:'gift',n:'Geschenk',ic:'🎁',k:'e'}]}
    ,{g:'🛡️ Sicherheit',adm:1,items:[
      {t:'ronaldo',n:'Ronaldo (Wächter, schiesst)',ic:'🏃',k:'g'},{t:'messi',n:'Messi (Wächter, schiesst)',ic:'🧍',k:'g'},{t:'wall',n:'Mauer (niemand kommt durch)',ic:'🧱',k:'p'},{t:'laser',n:'Laser-Tür (10 s zu / 10 s offen)',ic:'🔴',k:'p'},
      {t:'dog',n:'Wachhund (beisst im Nahbereich)',ic:'🐕',k:'g'},{t:'efence',n:'Elektrozaun (blockt + Schock)',ic:'⚡',k:'p'},{t:'shield',n:'Kraftfeld (Kuppel, nur Besitzer rein)',ic:'🫧',k:'p'},
      {t:'trap',n:'Stachel-Falle (−1 ❤)',ic:'🪤',k:'p'},{t:'frost',n:'Frost-Falle (bremst stark)',ic:'🥶',k:'p'},{t:'kick',n:'Rauswerfer-Falle (teleportiert weg)',ic:'🕳️',k:'p'},{t:'siren',n:'Alarm-Sirene (meldet Eindringlinge)',ic:'🚨',k:'p'}]}
    ,{g:'🪐 Weltraum',items:[
      {t:'planet',n:'Planet',ic:'🪐',k:'e'},{t:'moon',n:'Mond',ic:'🌙',k:'e'},{t:'earth',n:'Erde',ic:'🌍',k:'e'},{t:'sun',n:'Sonne',ic:'☀️',k:'e'},
      {t:'comet',n:'Komet',ic:'☄️',k:'e'},{t:'satellite',n:'Satellit',ic:'🛰️',k:'e'},{t:'alien',n:'Alien',ic:'👽',k:'e'},{t:'astronaut',n:'Astronaut',ic:'🧑‍🚀',k:'e'},
      {t:'galaxy',n:'Galaxie',ic:'🌌',k:'e'},{t:'shooting',n:'Sternschnuppe',ic:'🌠',k:'e'},{t:'telescope',n:'Teleskop',ic:'🔭',k:'e'},
      {t:'crater',n:'Mond-Krater',ic:'⚫',k:'p'},{t:'moonrock',n:'Mond-Fels',ic:'🌑',k:'p'},{t:'spacecrystal',n:'Raum-Kristall',ic:'🔮',k:'p'},{t:'radar',n:'Radar-Schüssel',ic:'📡',k:'p'},{t:'dome',n:'Glas-Kuppel',ic:'🔵',k:'p'}]}
  ];
  const ALL={}; CAT.forEach(c=>c.items.forEach(i=>{ ALL[i.t]=i; }));
  const MAXOBJ=45, MAXENC=8, MINENC=5, PL_OBJ=15, PL_ENC=5, ADM_T=['ronaldo','messi','wall','laser','dog','efence','shield','trap','frost','kick','siren'];
  const defEncs=()=>[0,1,2,3,4].map(i=>[(i-2)*8,0,1,null]);
  const SW=['#8b5a2b','#c8a165','#f2e3c6','#ffffff','#2b2b2b','#c0392b','#e67e22','#f1c40f','#27ae60','#2980b9','#8e44ad','#ff7eb6'];
  // Editor-Fläche (u = entlang der Reihe, v = nach vorne zum Ring-Zentrum). Admin: grössere Fläche.
  const EXT_S={u:22,vn:-14,vx:18}, EXT_B={u:30,vn:-24,vx:26};
  const extOf=b=>(b&&b.big)?EXT_B:EXT_S;
  // 5 fertige Basen (immer im Shop): 1× Selten, 4× Wow
  const row=(t,us,v,sc,col)=>us.map(u=>[t,u,v,0,sc||1,col||null]);
  const ring6=(col)=>[[-16,0,1,col],[-8,0,1,col],[0,0,1,col],[8,0,1,col],[16,0,1,col]];
  const BUILTIN=(()=>{ const L={};
    const add=(id,name,rarity,price,mult,big,objs,encs)=>{ L[id]={id,name,rarity,price,mult,big,objs,encs,by:'Mischa',at:1,bi:1}; };
    add('x_wald','Waldlichtung','selten',2000000,1.5,false,[
      ['sign',-14,9,0,1],
      ...row('pine',[-20,-17,17,20],-9,1),...row('pine',[-21,21],8,1),...row('oak',[-12,12],12,1),...row('bush',[-6,0,6],12.5,1),
      ...row('fence',[-15,-9,-3,3,9,15],-6.5,1),['bench',-4,9,0,1],['bench',4,9,0,1],['campfire',0,10,0,1],['pond',-17,12,0,1],['tent',18,12,0,1],
      ['mushroom',-9,14,0,1],['mushroom',9,14,0,1],['sunflower',-13,15,0,1],['sunflower',13,15,0,1],['lamp',-20,3,0,1],['lamp',20,3,0,1],['flowerbed',-2.5,15,0,1]],null);
    add('x_mond','Mond-Basis','wow',15000000,2,true,[
      ['sign',-14,10,0,1],['planet',-12,-19,0,2.2],['earth',10,-19,0,1.8],['comet',0,-22,0,1.4],['galaxy',-26,-20,0,1.8],['shooting',24,-14,0,1.2],
      ['crater',-22,10,0,1],['crater',22,9,0,1],['moonrock',-12,14,0,1],['moonrock',12,14,0,1],['spacecrystal',0,13,0,1],['spacecrystal',-27,-4,0,1],['spacecrystal',27,-4,0,1],
      ['radar',-26,-12,0,1],['dome',26,-12,0,1],['alien',-6,12,0,1],['astronaut',6,12,0,1],['telescope',-17,13,0,1],['rocket',27,13,0,1.3],['ufo',-27,13,0,1.2],['satellite',18,-20,0,1.2],['star',-5,-14,0,1],['star',5,-15,0,1],['lamp',-9,8,0,1,'#9be7ff'],['lamp',9,8,0,1,'#9be7ff']],
      ring6('#aab4c8').concat([[0,-9,1,'#aab4c8']]));
    add('x_eis','Eis-Festung','wow',25000000,2.5,true,[
      ['sign',-14,10,0,1],...row('snowpine',[-27,-22,22,27],-8,1),...row('snowpine',[-26,26],6,1),...row('icepond',[-18,18],11,1),
      ['snowman',-8,12,0,1.2],['snowman',8,12,0,1.2],['arch',0,14,0,1.2,'#dff4ff'],...row('lamp',[-12,12],8,1,'#bfe9ff'),...row('fence',[-15,-9,-3,3,9,15],-6.5,1,'#ffffff'),
      ['tent',-24,12,0,1.1,'#ffffff'],['tent',24,12,0,1.1,'#ffffff'],['crystal',-4,-12,0,1.5],['crystal',4,-12,0,1.5],['mountain',-20,-18,0,2],['mountain',20,-18,0,2],['star',0,-18,0,1.4]],
      ring6('#eaf6ff'));
    add('x_vulkan','Vulkan-Insel','wow',40000000,3,true,[
      ['sign',-14,10,0,1],...row('lava',[-18,18],11,1),['lava',0,-15,0,1.3],...row('palm',[-27,27],8,1),...row('palm',[-12,12],15,1),
      ['campfire',0,12,0,1.2],['torii',0,17,0,1.3],['statue',-7,13,0,1],['statue',7,13,0,1],['mountain',-23,-16,0,2.4],['mountain',23,-16,0,2.4],['dragon',0,-19,0,2.2],
      ...row('rock',[-26,-22,22,26],-6,1.2),['lantern',-10,8,0,1],['lantern',10,8,0,1],['hibiscus',-14,15,0,1],['hibiscus',14,15,0,1]],
      ring6('#7a2e1a'));
    add('x_maerchen','Märchen-Schloss','wow',70000000,3.5,true,[
      ['sign',-14,11,0,1],['castle',0,-19,0,2.6],['rainbow',0,-24,0,2.4],...row('cherry',[-27,-22,22,27],-6,1),...row('cherry',[-27,27],7,1),
      ['fountain',0,13,0,1.1],['path',0,9,0,1],['arch',0,18,0,1.2,'#ffd1e6'],...row('flowerbed',[-20,-12,12,20],12,1),['unicorn',-15,15,0,1.3],['carousel',23,14,0,1.3],['ferris',-24,15,0,1.4],
      ['balloon',-9,16,0,1],['balloon',9,16,0,1],...row('lamp',[-6,6],8,1,'#ffd1e6'),['star',-12,-17,0,1.2],['star',12,-17,0,1.2],['teddy',17,10,0,1]],
      ring6('#ff9ec7').concat([[0,-9,1,'#ff9ec7']]));
    add('x_bunker','Bunker','extrem',120000000,4,true,[
      ['wall',-16.5,-9,0,1],['efence',-5.5,-9,0,1],['wall',5.5,-9,0,1],['efence',16.5,-9,0,1],['efence',-22,-3.5,90,1],['wall',-22,7.5,90,1],['wall',22,-3.5,90,1],['efence',22,7.5,90,1],['wall',-16.5,12,0,1],['efence',-8.5,12,0,1],['laser',0,12,0,1],['efence',8.5,12,0,1],['wall',16.5,12,0,1],['trap',-16,9,0,1],['frost',-8,9,0,1],['trap',0,9,0,1],['frost',8,9,0,1],['trap',16,9,0,1],['frost',-12,5.5,0,1],['trap',-4,5.5,0,1],['frost',4,5.5,0,1],['trap',12,5.5,0,1],['siren',-20,10,0,1],['siren',20,10,0,1],['siren',-20,-7,0,1],['siren',20,-7,0,1],['sign',-14,15,0,1],['roof',-16.2,-3.9,0,1],['roof',-16.2,6.9,0,1],['roof',-5.4,-3.9,0,1],['roof',-5.4,6.9,0,1],['roof',5.4,-3.9,0,1],['roof',5.4,6.9,0,1],['roof',16.2,-3.9,0,1],['roof',16.2,6.9,0,1]],
      ring6('#5a626b'));
    return L; })();
  const isEd=()=>{ try{ const k=String((ZS.player||'')).trim().toLowerCase(); return k==='bu:)'||k==='bu:3'||!!ZS.isAdmin||!!(typeof ZAdmin!=='undefined'&&ZAdmin._hasAccess); }catch(e){ return false; } };
  const R=()=>{ try{ return (typeof _rtdb!=='undefined'&&_rtdb&&State._useCloud())?_rtdb:null; }catch(e){ return null; } };
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const today=()=>new Date().toISOString().slice(0,10);
  const keyOf=n=>String(n||'').toLowerCase().replace(/[.#$\[\]\/]/g,'_');

  // Einfacher Namens-Filter (Schimpfwörter, Links). Treffer → Base wartet auf Admin-Freigabe.
  const BAD=['fick','fotze','scheiss','scheisse','arsch','wichs','hure','nutte','schlampe','nazi','hitler','heilh','neger','nigg','fuck','shit','bitch','cunt','porn','sex','penis','vagina','pimmel','hurensohn','spast','mongo','kanake','behindert','vergewalt','http','www','.com','.ch','.de','tiktok','insta'];
  const norm=t=>String(t||'').toLowerCase().replace(/ß/g,'ss').replace(/[ä]/g,'a').replace(/[ö]/g,'o').replace(/[ü]/g,'u').replace(/[0]/g,'o').replace(/[1!|]/g,'i').replace(/[3]/g,'e').replace(/[4@]/g,'a').replace(/[5$]/g,'s').replace(/[7]/g,'t');
  const badText=t=>{ const a=norm(t), b=a.replace(/[^a-z.]/g,''); return BAD.some(w=>a.indexOf(w)>=0||b.indexOf(w.replace(/[^a-z.]/g,''))>=0); };
  const monthKey=(d)=>{ d=d||new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); };
  const prevMonthKey=()=>{ const d=new Date(); d.setDate(1); d.setMonth(d.getMonth()-1); return monthKey(d); };
  // Grosse Meldung mit Ja/Nein (iOS-sicher)
  const bigConfirm=(icon,title,html,okTxt,noTxt)=>new Promise(res=>{
    const ov=document.createElement('div'); ov.style.cssText='position:fixed;inset:0;z-index:100010;background:rgba(0,0,0,.88);display:flex;align-items:center;justify-content:center;padding:18px;font-family:Arial,sans-serif';
    ov.innerHTML='<div style="max-width:380px;width:100%;background:linear-gradient(160deg,#2a1a3e,#14102a);border:3px solid #FFD700;border-radius:20px;padding:24px 20px;text-align:center;color:#fff;box-shadow:0 0 40px rgba(255,215,0,.35)"><div style="font-size:3.6rem">'+icon+'</div><div style="font-size:1.35rem;font-weight:900;color:#FFD700;margin:8px 0">'+title+'</div><div style="font-size:1rem;line-height:1.5;color:rgba(255,255,255,.9)">'+html+'</div><div style="display:flex;gap:10px;margin-top:20px"><button data-r="0" style="flex:1;padding:13px;border-radius:12px;border:none;background:rgba(255,255,255,.15);color:#fff;font-weight:800;font-size:.95rem;cursor:pointer">'+(noTxt||'Abbrechen')+'</button><button data-r="1" style="flex:1.3;padding:13px;border-radius:12px;border:none;background:linear-gradient(135deg,#FFD700,#F39C12);color:#1a1a2e;font-weight:900;font-size:.95rem;cursor:pointer">'+(okTxt||'Ja')+'</button></div></div>';
    document.body.appendChild(ov); let done=false;
    ov.querySelectorAll('button').forEach(b=>['pointerup','touchend','click'].forEach(n=>b.addEventListener(n,ev=>{ try{ev.preventDefault();}catch(x){} if(done) return; done=true; ov.remove(); res(b.dataset.r==='1'); },{passive:false})));
  });
  const fmt=n=>{ n=Math.max(0,Math.round(+n||0)); return n>=1e9?(n/1e9).toFixed(2)+' Mrd':n>=1e6?(n/1e6).toFixed(2)+' Mio':n>=1e3?(n/1e3).toFixed(1)+'k':String(n); };
  const combinedMT=()=>{ try{ return (ZS.dsMT||0)+(ZS.zoo.mt||0); }catch(e){ return 0; } };
  const B=window.ZBases={
    list:Object.assign({},BUILTIN), adminList:{}, pb:{}, BUILTIN, ALL, isEd, lm:{}, winner:null, groups:{}, likes:{}, _inited:false, preview:null, RAR, CAT, badText,
    slotEncs:{}, defEncs,
    // Zusatz-Gehege der angelegten Base (zählt zu ZS.maxE)
    extraEnc(z){ try{ const b=B.preview||((z&&z.baseEq&&z.bases&&z.bases[z.baseEq])?B.list[z.baseEq]:null); return (b&&b.encs&&b.encs.length>MINENC)?Math.min(MAXENC,b.encs.length)-MINENC:0; }catch(e){ return 0; } },
    multOf(z){ try{ const b=B.list[(z&&z.baseEq)||'']; let m=(b&&z.bases&&z.bases[b.id])?(+b.mult||1):1; if(m>1&&B.winner&&z===ZS.zoo&&keyOf(ZS.player)===B.winner) m*=1.1; return m; }catch(e){ return 1; } },
    // ── Listen zusammenführen (Admin-Basen + sichtbare Spieler-Basen) ──
    _merge(){ const l=Object.assign({},BUILTIN,B.adminList), me=keyOf(ZS.player||''), ed=isEd();
      Object.keys(B.pb||{}).forEach(k=>{ const r=B.pb[k]; if(!r||!r.id) return; if(r.status==='ok'||k===me) l[r.id]=Object.assign({pl:1},r); });
      B.list=l; },
    _calcWinner(){ try{ const m=B.lm&&B.lm[prevMonthKey()]; let best=null,bn=2; Object.keys(m||{}).forEach(k=>{ if((+m[k]||0)>bn){ bn=+m[k]; best=k; } }); B.winner=best; }catch(e){ B.winner=null; } },
    // ── Daten ──
    init(){
      if(B._inited) return; const r=R(); if(!r) return; B._inited=true;
      try{ r.ref('zoo_bases').on('value',s=>{ B.adminList=s.val()||{}; B._merge(); B._shopRefresh(); }); }catch(e){}
      try{ r.ref('zoo_pbases').on('value',s=>{ B.pb=s.val()||{}; B._merge(); B._shopRefresh(); }); }catch(e){}
      try{ const k=keyOf(ZS.player); const t0=Date.now(); if(k) r.ref('zoo_alarm/'+k).on('value',s=>{ const v=s.val(); if(v&&v.at>t0&&v.at>(B._alSeen||0)){ B._alSeen=v.at; ZP.toast('🚨 ALARM in deiner Base! '+(v.by||'Jemand')+' ist eingedrungen.',6000); } }); }catch(e){}
      try{ r.ref('zoo_cfg/steal').on('value',s=>{ const v=s.val(); B.cfg.steal=Object.assign({on:1,pct:2,sec:10},v||{}); }); }catch(e){}
      try{ const k=keyOf(ZS.player); if(k){ r.ref('zoo_steal_ping/'+k).on('value',s=>B._onPing(s.val())); r.ref('zoo_steal_res/'+k).on('child_added',s=>B._onRes(s)); } }catch(e){}
      try{ r.ref('zoo_cfg/reload').on('value',s=>{ const v=s.val(); const id=v&&v.id; if(B._rlSeen===undefined){ B._rlSeen=id||null; return; } if(id&&id!==B._rlSeen){ B._rlSeen=id; try{ ZP.toast('🔄 Der Admin lädt das Spiel neu …',2500); }catch(e){} setTimeout(()=>{ try{ ZS.save&&ZS.save(true); }catch(e){} setTimeout(()=>location.reload(),600); },1800); } }); }catch(e){}
      try{ r.ref('zoo_cfg/noTpRadius').on('value',s=>{ B.cfg.noTp=+s.val()||0; }); }catch(e){}
      try{ r.ref('zoo_likes_m').on('value',s=>{ B.lm=s.val()||{}; B._calcWinner(); }); }catch(e){}
      try{ const k=keyOf(ZS.player); if(k) r.ref('zoo_restore/'+k).on('value',s=>{ B._restoreReq=s.val()||null; }); }catch(e){}
      try{ r.ref('zoo_likes_n').on('value',s=>{ B.likes=s.val()||{}; }); }catch(e){}
    },
    sorted(){ const ri=id=>Math.max(0,RAR.findIndex(r=>r.id===id)); return Object.values(Object.assign({},BUILTIN,B.adminList||{})).filter(b=>b&&b.id).sort((a,b)=>(ri(a.rarity)-ri(b.rarity))||((+a.price||0)-(+b.price||0))); },
    // ── 3D ──
    _mats:{}, _geos:{}, _tex:{},
    mat(c){ return B._mats[c]||(B._mats[c]=new THREE.MeshBasicMaterial({color:c})); },
    geo(k,mk){ return B._geos[k]||(B._geos[k]=mk()); },
    // Färben: nur Holz-Teile (falls vorhanden), sonst das ganze Objekt
    tint(node,col){ const ms=[]; node.traverse(o=>{ if(o.isMesh) ms.push(o); }); const wood=ms.filter(m=>m.userData.w); (wood.length?wood:ms).forEach(m=>{ m.material=B.mat(col); }); },
    sprite(emoji,s,col){
      const key=col?emoji+'|'+col:emoji; let m=B._tex[key];
      if(!m){ const c=document.createElement('canvas'); c.width=c.height=128; const x=c.getContext('2d'); x.font='96px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif'; x.textAlign='center'; x.textBaseline='middle'; x.fillText(emoji,64,70);
        const base=B._tex[emoji]||new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false}); B._tex[emoji]=base; m=col?base.clone():base; if(col) m.color.set(col); B._tex[key]=m; }
      const sp=new THREE.Sprite(m); sp.scale.set(5*s,5*s,1); sp.position.y=2.5*s; return sp;
    },
    mesh(gk,mk,col){ return new THREE.Mesh(B.geo(gk,mk),B.mat(col)); },
    build3D(t,s){
      const g=new THREE.Group(), M=B.mesh.bind(B);
      const trunk=(h,col)=>{ const m=M('tr'+h,()=>new THREE.CylinderGeometry(.25,.35,h,6),col||0x7a5230); m.userData.w=1; m.position.y=h/2; g.add(m); };
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
        case 'flowerbed': { const m=M('fb',()=>new THREE.CylinderGeometry(2,2,.2,12),0x6b4a2a); m.userData.w=1; m.position.y=.1; g.add(m); [0xff5e8e,0xffd93b,0xb36bff,0xff8a3b,0xffffff].forEach((c,i)=>{ const f=M('fl'+i,()=>new THREE.SphereGeometry(.28,6,5),c); const a=i/5*Math.PI*2; f.position.set(Math.cos(a)*1.1,.45,Math.sin(a)*1.1); g.add(f); }); const f=M('fl9',()=>new THREE.SphereGeometry(.3,6,5),0xff5e8e); f.position.set(0,.5,0); g.add(f); } break;
        case 'fence': { const r=M('fr',()=>new THREE.BoxGeometry(4,.18,.12),0xb07a3c); r.userData.w=1; r.position.y=1; g.add(r); const r2=M('fr',()=>new THREE.BoxGeometry(4,.18,.12),0xb07a3c); r2.userData.w=1; r2.position.y=.55; g.add(r2); [-1.9,-.95,0,.95,1.9].forEach(x=>{ const p=M('fp',()=>new THREE.BoxGeometry(.16,1.3,.16),0x8a5a2b); p.userData.w=1; p.position.set(x,.65,0); g.add(p); }); } break;
        case 'path': { const m=M('path',()=>new THREE.BoxGeometry(4,.06,1.8),0xd2b48c); m.userData.w=1; m.position.y=.04; g.add(m); } break;
        case 'lamp': { const p=M('lp',()=>new THREE.CylinderGeometry(.08,.1,3.2,6),0x333333); p.position.y=1.6; g.add(p); const l=M('ll',()=>new THREE.SphereGeometry(.4,8,6),0xfff2a8); l.position.y=3.3; g.add(l); } break;
        case 'bench': { const a=M('bs',()=>new THREE.BoxGeometry(2,.15,.7),0x9c6b3a); a.userData.w=1; a.position.y=.6; g.add(a); const b=M('bb',()=>new THREE.BoxGeometry(2,.6,.12),0x9c6b3a); b.userData.w=1; b.position.set(0,1,-.3); g.add(b); [-.8,.8].forEach(x=>{ const l=M('bl',()=>new THREE.BoxGeometry(.12,.6,.6),0x6b4a2a); l.userData.w=1; l.position.set(x,.3,0); g.add(l); }); } break;
        case 'tent': { const m=M('tent',()=>new THREE.ConeGeometry(2,2.6,4),0xe74c3c); m.position.y=1.3; m.rotation.y=Math.PI/4; g.add(m); } break;
        case 'fountain': { const b=M('fo1',()=>new THREE.CylinderGeometry(2,2.2,.7,14),0x9aa5ab); b.position.y=.35; g.add(b); const w=M('fo2',()=>new THREE.CylinderGeometry(1.7,1.7,.1,14),0x3aa0ff); w.position.y=.72; g.add(w); const c=M('fo3',()=>new THREE.CylinderGeometry(.25,.35,1.6,8),0xb9c3c8); c.position.y=1.5; g.add(c); const t=M('fo4',()=>new THREE.SphereGeometry(.45,8,6),0x7cc8ff); t.position.y=2.4; g.add(t); } break;
        case 'campfire': { for(let i=0;i<4;i++){ const l=M('lg',()=>new THREE.CylinderGeometry(.12,.12,1.2,5),0x6b4a2a); l.userData.w=1; const a=i/4*Math.PI*2; l.position.set(Math.cos(a)*.35,.2,Math.sin(a)*.35); l.rotation.z=Math.PI/2; l.rotation.y=a; g.add(l); } const f=M('fire',()=>new THREE.ConeGeometry(.5,1.4,6),0xff7a1a); f.position.y=.9; g.add(f); const f2=M('fire2',()=>new THREE.ConeGeometry(.28,.9,6),0xffd23b); f2.position.y=.8; g.add(f2); } break;
        case 'birch': trunk(2.4,0xe8e8e0); { const m=M('bi',()=>new THREE.SphereGeometry(1.7,8,6),0x9bd66a); m.position.y=3.7; m.scale.set(1,1.25,1); g.add(m); } break;
        case 'bamboo': for(let i=0;i<5;i++){ const b=M('bam',()=>new THREE.CylinderGeometry(.12,.14,4.4,6),0x7cc24a); b.position.set((i-2)*.35,2.2+(i%2)*.4,(i%3-1)*.3); g.add(b); } break;
        case 'snowpine': trunk(1.6); [[2.6,2.2,1.6],[2.0,1.8,3.3],[1.3,1.4,4.7]].forEach(([r,h,y])=>{ const m=M('spc'+r,()=>new THREE.ConeGeometry(r,h,8),0x2d6a4f); m.position.y=y; g.add(m); const c=M('spw'+r,()=>new THREE.ConeGeometry(r*.72,h*.5,8),0xffffff); c.position.y=y+h*.28; g.add(c); }); break;
        case 'lava': { const m=M('lava',()=>new THREE.CylinderGeometry(3,3,.12,16),0xff5a1f); m.position.y=.08; g.add(m); const r=M('lavaR',()=>new THREE.TorusGeometry(3,.25,6,18),0x3b2a24); r.rotation.x=Math.PI/2; r.position.y=.12; g.add(r); const b=M('lavaB',()=>new THREE.SphereGeometry(.4,6,5),0xffd23b); b.position.set(.8,.3,.4); g.add(b); } break;
        case 'icepond': { const m=M('ice',()=>new THREE.CylinderGeometry(3,3,.12,16),0xbfeaff); m.position.y=.08; g.add(m); const r=M('iceR',()=>new THREE.TorusGeometry(3,.2,6,18),0xffffff); r.rotation.x=Math.PI/2; r.position.y=.12; g.add(r); } break;
        case 'haybale': { const m=M('hay',()=>new THREE.CylinderGeometry(.9,.9,1.4,12),0xd9b44a); m.rotation.z=Math.PI/2; m.position.y=.9; g.add(m); } break;
        case 'windmill': { const t=M('wmT',()=>new THREE.CylinderGeometry(.9,1.5,5,8),0xe8dcc8); t.position.y=2.5; g.add(t); const c=M('wmC',()=>new THREE.ConeGeometry(1.4,1.4,8),0xb5532f); c.position.y=5.7; g.add(c); for(let i=0;i<4;i++){ const b=M('wmB',()=>new THREE.BoxGeometry(.3,3.4,.08),0xf5f0e6); const a=i*Math.PI/2; b.position.set(0,4.6,1.1); b.geometry.translate(0,1.4,0); b.rotation.z=a; g.add(b); } } break;
        case 'well': { const m=M('wl',()=>new THREE.CylinderGeometry(1,1.1,1.1,12),0x9aa0a6); m.position.y=.55; g.add(m); const w=M('wlW',()=>new THREE.CylinderGeometry(.8,.8,.05,12),0x3aa0ff); w.position.y=1.1; g.add(w); [-.9,.9].forEach(x=>{ const p=M('wlP',()=>new THREE.BoxGeometry(.12,1.8,.12),0x7a5230); p.userData.w=1; p.position.set(x,1.9,0); g.add(p); }); const r=M('wlR',()=>new THREE.ConeGeometry(1.4,.8,4),0xb5532f); r.position.y=3; r.rotation.y=Math.PI/4; g.add(r); } break;
        case 'arch': { [-1.5,1.5].forEach(x=>{ const p=M('arP',()=>new THREE.BoxGeometry(.8,3.6,.8),0xb9b4a8); p.position.set(x,1.8,0); g.add(p); }); const t=M('arT',()=>new THREE.BoxGeometry(3.8,.8,.9),0xcfcabd); t.position.y=3.9; g.add(t); } break;
        case 'crater': { const m=M('cr',()=>new THREE.CylinderGeometry(3,3,.1,16),0x4a4f57); m.position.y=.06; g.add(m); const r=M('crR',()=>new THREE.TorusGeometry(3,.4,6,18),0x9aa0a8); r.rotation.x=Math.PI/2; r.position.y=.18; g.add(r); const i=M('crI',()=>new THREE.CylinderGeometry(1.6,1.6,.12,12),0x2f3238); i.position.y=.12; g.add(i); } break;
        case 'moonrock': { const m=M('mr',()=>new THREE.DodecahedronGeometry(1.3),0xb7bcc4); m.position.y=.8; m.scale.set(1.1,.9,1); g.add(m); const m2=M('mr2',()=>new THREE.DodecahedronGeometry(.6),0x9aa0a8); m2.position.set(1.4,.35,.5); g.add(m2); } break;
        case 'spacecrystal': [[0,2.6,0],[.9,1.8,.3],[-.8,1.5,-.2],[.2,1.2,-.9]].forEach(([x,h,z],i)=>{ const c=M('sc'+i,()=>new THREE.ConeGeometry(.45,h,5),[0xb26bff,0x6bd0ff,0xff6bd6,0x7dffb0][i]); c.position.set(x,h/2,z); g.add(c); }); break;
        case 'radar': { const b=M('rdB',()=>new THREE.CylinderGeometry(.5,.8,1.4,8),0x8a929a); b.position.y=.7; g.add(b); const d=M('rdD',()=>new THREE.SphereGeometry(1.7,12,6,0,Math.PI*2,0,Math.PI/2.4),0xdfe6ee); d.position.y=2; d.rotation.x=Math.PI/3; g.add(d); const f=M('rdF',()=>new THREE.CylinderGeometry(.06,.06,1.6,5),0xff4d4d); f.position.set(0,2.6,.9); f.rotation.x=Math.PI/3; g.add(f); } break;
        case 'wall': { const m=M('wallB',()=>new THREE.BoxGeometry(8,3.2,1),0x9a8f86); m.userData.w=1; m.position.y=1.6; g.add(m); const c=M('wallC',()=>new THREE.BoxGeometry(8.3,.35,1.3),0x6e655e); c.position.y=3.35; g.add(c); [-2.7,0,2.7].forEach((x,i)=>{ const l=M('wallL',()=>new THREE.BoxGeometry(2.4,.12,1.04),0x7d746c); l.position.set(x,1.1+i*.0,0); g.add(l); }); } break;
        case 'laser': { [-3,3].forEach(x=>{ const p=M('lsP',()=>new THREE.BoxGeometry(.5,3.4,.5),0x2c3e50); p.position.set(x,1.7,0); g.add(p); const t=new THREE.Mesh(B.geo('lsT',()=>new THREE.SphereGeometry(.28,8,6)),new THREE.MeshBasicMaterial({color:0xff2222})); t.position.set(x,3.5,0); t.userData.tip=1; g.add(t); });
          [.5,1.2,1.9,2.6].forEach(y=>{ const b=new THREE.Mesh(B.geo('lsB',()=>new THREE.BoxGeometry(6,.09,.09)),new THREE.MeshBasicMaterial({color:0xff2a2a})); b.position.set(0,y,0); b.userData.beam=1; g.add(b); }); } break;
        case 'efence': { [-3.6,-1.2,1.2,3.6].forEach(x=>{ const p=M('efP',()=>new THREE.BoxGeometry(.3,2.6,.3),0xf1c40f); p.position.set(x,1.3,0); g.add(p); const t=new THREE.Mesh(B.geo('efT',()=>new THREE.SphereGeometry(.22,8,6)),new THREE.MeshBasicMaterial({color:0x4aa8ff})); t.position.set(x,2.7,0); g.add(t); }); [.8,1.7].forEach(y=>{ const r=M('efR',()=>new THREE.BoxGeometry(8,.08,.08),0xffe34d); r.position.set(0,y,0); g.add(r); }); } break;
        case 'shield': { const m=new THREE.Mesh(B.geo('shS',()=>new THREE.SphereGeometry(4.5,16,10)),new THREE.MeshBasicMaterial({color:0x4ad8ff,transparent:true,opacity:.22,side:THREE.DoubleSide,depthWrite:false})); m.position.y=0; g.add(m); const b=M('shB',()=>new THREE.CylinderGeometry(.5,.8,.5,8),0x34495e); b.position.y=.25; g.add(b); } break;
        case 'trap': { const d=M('trD',()=>new THREE.CylinderGeometry(1.7,1.7,.1,14),0x3b2f2f); d.position.y=.06; g.add(d); for(let i=0;i<7;i++){ const c=M('trC',()=>new THREE.ConeGeometry(.2,.7,5),0xc7ccd1); const a=i/7*Math.PI*2; c.position.set(Math.cos(a)*.9,.4,Math.sin(a)*.9); g.add(c); } const c0=M('trC',()=>new THREE.ConeGeometry(.2,.7,5),0xc7ccd1); c0.position.y=.4; g.add(c0); } break;
        case 'frost': { const d=M('frD',()=>new THREE.CylinderGeometry(1.9,1.9,.1,14),0xaee6ff); d.position.y=.06; g.add(d); const r=M('frR',()=>new THREE.TorusGeometry(1.9,.12,6,18),0xffffff); r.rotation.x=Math.PI/2; r.position.y=.12; g.add(r); } break;
        case 'kick': { const d=M('kkD',()=>new THREE.CylinderGeometry(1.8,1.8,.1,14),0x6c2bd9); d.position.y=.06; g.add(d); const r=M('kkR',()=>new THREE.TorusGeometry(1.1,.14,6,18),0xe2b6ff); r.rotation.x=Math.PI/2; r.position.y=.14; g.add(r); } break;
        case 'roof': { const m=M('roofB',()=>new THREE.BoxGeometry(8,.4,8),0x4a525a); m.position.y=3.75; g.add(m); const t=M('roofT',()=>new THREE.BoxGeometry(8.2,.12,8.2),0x2f353b); t.position.y=3.99; g.add(t); [[-3.9,0],[3.9,0]].forEach(([x])=>{ const e=M('roofE',()=>new THREE.BoxGeometry(.2,.3,8.2),0x6b747c); e.position.set(x,3.55,0); g.add(e); }); } break;
        case 'siren': { const p=M('siP',()=>new THREE.CylinderGeometry(.12,.16,2.6,6),0x555d66); p.position.y=1.3; g.add(p); const l=new THREE.Mesh(B.geo('siL',()=>new THREE.SphereGeometry(.45,8,6)),new THREE.MeshBasicMaterial({color:0xff2a2a})); l.position.y=2.9; l.userData.sir=1; g.add(l); } break;
        case 'dome': { const b=M('dmB',()=>new THREE.CylinderGeometry(2.6,2.8,.5,16),0x8a929a); b.position.y=.25; g.add(b); const d=M('dmD',()=>new THREE.SphereGeometry(2.5,16,10,0,Math.PI*2,0,Math.PI/2),0x7ad0ff); d.material=d.material; d.position.y=.5; g.add(d); } break;
        default: break;
      }
      g.scale.setScalar(s*1.35); return g;
    },
    // Welt-Objekt aus Vorlage
    buildObj(o,owner,likes){
      const [t,u,v,rot,s,col]=o, d=ALL[t]; if(!d) return null;
      let node;
      if(d.k==='p'){ node=B.build3D(t,s||1); if(col) B.tint(node,col); }
      else if(d.k==='s'){
        node=new THREE.Group(); const post=new THREE.Mesh(B.geo('sp',()=>new THREE.CylinderGeometry(.12,.15,2.2,6)),B.mat(0x7a5230)); post.position.y=1.1; node.add(post);
        const lbl=ZG._txt('Base gehört '+owner+(likes?'  ❤️'+likes:''),.5,'#FFD700'); lbl.position.set(0,3,0); lbl.scale.set(9,2.2,1); node.add(lbl); node.userData.isSign=true;
        if(B.winner&&keyOf(owner)===B.winner){ const cr=ZG._txt('👑 Base des Monats',.5,'#FFE066'); cr.position.set(0,5.2,0); cr.scale.set(9,2.2,1); node.add(cr); }
      } else if(d.k==='g'){
        node=new THREE.Group(); node.add(B.sprite(d.ic,(s||1)*1.1,col)); if(t!=='dog'){ const bl=B.sprite('⚽',.35); bl.position.set(1.1,.7,0); node.add(bl); }
        const lb=ZG._txt(t==='messi'?'Messi':(t==='dog'?'Wachhund':'Ronaldo'),.5,'#ffffff'); lb.position.set(0,6.3*(s||1),0); lb.scale.set(5,1.4,1); node.add(lb); node.userData.guard={name:t==='messi'?'Messi':(t==='dog'?'Wachhund':'Ronaldo'),melee:t==='dog'};
      } else { node=new THREE.Group(); node.add(B.sprite(d.ic,s||1,col)); }
      if(d.k==='p'&&(t==='wall'||t==='laser')) node.userData.solid={kind:t,hx:(t==='wall'?4.15:3.35)*1.35*(s||1),hz:(t==='wall'?.65:.4)*1.35*(s||1)};
      if(t==='efence') node.userData.solid={kind:'efence',hx:4.15*1.35*(s||1),hz:.45*1.35*(s||1)};
      if(t==='shield') node.userData.solid={kind:'shield',circ:1,r:4.5*1.35*(s||1)};
      if(t==='trap'||t==='frost'||t==='kick') node.userData.zone={kind:t,r:1.9*1.35*(s||1)};
      if(t==='siren') node.userData.siren=1;
      node.userData.local={u,v,rot:rot||0}; return node;
    },
    // Gruppe an Slot-Position bauen
    buildBase(base,slot,owner,likes){
      const lay=ZG._slotEncPos(slot), a=lay.angle, c=lay.center;
      const tx=-Math.sin(a), tz=Math.cos(a), rx=Math.cos(a), rz=Math.sin(a);
      const yaw=Math.atan2(-Math.cos(a),-Math.sin(a));
      const grp=new THREE.Group(); grp.userData.center=c;
      let hasSign=false; grp.userData.solids=[]; grp.userData.guards=[]; grp.userData.lasers=[]; grp.userData.zones=[]; grp.userData.sirens=[]; grp.userData.owner=owner;
      (base.objs||[]).slice(0,MAXOBJ).forEach(o=>{
        const n=B.buildObj(o,owner,likes); if(!n) return; if(n.userData.isSign) hasSign=true;
        n.position.x=c.x+tx*o[1]-rx*o[2]; n.position.z=c.z+tz*o[1]-rz*o[2];
        if(ALL[o[0]]&&ALL[o[0]].k!=='e'&&ALL[o[0]].k!=='g') n.rotation.y=yaw+(o[3]||0)*Math.PI/180;
        if(n.userData.zone){ grp.userData.zones.push({kind:n.userData.zone.kind,r:n.userData.zone.r,x:n.position.x,z:n.position.z,owner,key:owner+'|'+o[0]+'|'+o[1]+'|'+o[2]}); }
        if(n.userData.siren){ const lg=[]; n.traverse(m=>{ if(m.userData.sir) lg.push(m); }); grp.userData.sirens.push({x:n.position.x,z:n.position.z,owner,lg,key:owner+'|s|'+o[1]+'|'+o[2]}); }
        if(n.userData.solid){ const sd=n.userData.solid; const so={kind:sd.kind,hx:sd.hx,hz:sd.hz,r:sd.r,circ:sd.circ,x:n.position.x,z:n.position.z,th:n.rotation.y,owner,cx:c.x,cz:c.z}; grp.userData.solids.push(so); if(sd.kind==='laser'){ const bm=[],tp=[]; n.traverse(m=>{ if(m.userData.beam) bm.push(m); if(m.userData.tip) tp.push(m); }); grp.userData.lasers.push({so,bm,tp}); } }
        if(n.userData.guard) grp.userData.guards.push({x:n.position.x,z:n.position.z,name:n.userData.guard.name,melee:n.userData.guard.melee,owner,key:owner+'|'+o[0]+'|'+o[1]+'|'+o[2]});
        grp.add(n);
      });
      if(!hasSign){ const n=B.buildObj(['sign',0,6,0,1],owner,likes); n.position.x=c.x-rx*6; n.position.z=c.z-rz*6; grp.add(n); }
      return grp;
    },
    _drop(key){ const e=B.groups[key]; if(e){ try{ ZG.scene.remove(e.grp); }catch(x){} delete B.groups[key]; } },
    _ensure(key,base,slot,owner){
      if(!base){ B._drop(key); return; }
      const likes=B.likes[keyOf(owner)]||0, sig=[base.id,base.at||0,likes,owner,slot,JSON.stringify(base.encs||0),(B.winner&&keyOf(owner)===B.winner)?1:0].join('|');
      const e=B.groups[key]; if(e&&e.sig===sig) return;
      B._drop(key);
      try{ const grp=B.buildBase(base,slot,owner,likes); ZG.scene.add(grp); B.groups[key]={grp,sig,slot}; }catch(err){ console.log('[Bases] Aufbau-Fehler: '+err.message); }
    },
    tick(){
      if(typeof ZG==='undefined'||!ZG.scene||!ZS.zoo||!ZS.player) return;
      B.init(); B._extras();
      // Editor-Knopf links nur für Bu:)
      const eb=document.getElementById('hb-base-editor'); if(eb) eb.style.display=isEd()?'':'none';
      const z=ZS.zoo, slot=(typeof ZS.mySlot==='number')?ZS.mySlot:0;
      let mine=B.preview||((z.baseEq&&z.bases&&z.bases[z.baseEq])?B.list[z.baseEq]:null);
      // v652: eigene Gehege-Anordnung der Bases
      const _old=JSON.stringify(B.slotEncs); const _se={};
      const _reg=(sl,b)=>{ if(b&&b.encs&&b.encs.length) _se[sl]=b.encs.slice(0,MAXENC).map(a=>({u:+a[0]||0,v:+a[1]||0,s:+a[2]||1,col:a[3]?parseInt(String(a[3]).replace('#',''),16):null})); };
      _reg(slot,mine);
      Object.keys(ZG.otherPl||{}).forEach(n=>{ const op=ZG.otherPl[n]; const bid=op&&(op.be||op.baseEq); if(bid&&B.list[bid]) _reg(typeof op.slotIdx==='number'?op.slotIdx:0,B.list[bid]); });
      B.slotEncs=_se;
      if(JSON.stringify(_se)!==_old||B._ex!==B.extraEnc(z)){ B._ex=B.extraEnc(z); try{ if(ZS._fix) ZS._fix(); ZG._encs&&ZG._encs(); }catch(e){} }
      B._ensure('me',mine,slot,ZS.player);
      // andere Spieler (nur die, die gerade da sind)
      const others=ZG.otherPl||{}; const seen={me:1};
      Object.keys(others).forEach(n=>{ const op=others[n]; const k='o_'+n; seen[k]=1;
        const bid=op&&(op.be||op.baseEq); const b=bid?B.list[bid]:null; B._ensure(k,b,typeof op.slotIdx==='number'?op.slotIdx:0,n); });
      Object.keys(B.groups).forEach(k=>{ if(!seen[k]) B._drop(k); });
      // Entfernung: weit weg ausblenden (Leistung)
      const px=ZG.pl.x, pz=ZG.pl.z;
      Object.keys(B.groups).forEach(k=>{ const e=B.groups[k], c=e.grp.userData.center; e.grp.visible=Math.hypot(c.x-px,c.z-pz)<230; });
      B._likeBtn(others);
    },
    // ═══ Sicherheit: Mauer, Laser-Tür, Wächter (Ronaldo/Messi), Teleport-Schutz ═══
    cfg:{noTp:0,steal:{on:1,pct:2,sec:10}}, _balls:[], _gcd:{}, _last:null, _hitCd:0,
    _ownerPos(owner){ try{ if(keyOf(owner)===keyOf(ZS.player)) return {x:ZG.pl.x,z:ZG.pl.z}; const op=(ZG.otherPl||{})[owner]; return op?{x:op.x,z:op.z}:null; }catch(e){ return null; } },
    // Laser ist zu: alle 10 s Wechsel (zu/offen, für alle gleich per Uhr) — oder immer zu, solange der Besitzer in seiner Base ist
    laserClosed(so){ const ph=(Math.floor(Date.now()/10000)%2===0); if(ph) return true; const op=B._ownerPos(so.owner); return !!(op&&Math.hypot(op.x-so.cx,op.z-so.cz)<28); },
    collide(pl){
      let sol=[]; const me=keyOf(ZS.player||'');
      Object.keys(B.groups).forEach(k=>{ const g=B.groups[k].grp; if(!g.visible||!g.userData.solids) return; g.userData.solids.forEach(so=>{ if(so.kind==='laser'){ if(keyOf(so.owner)===me||!B.laserClosed(so)) return; } if(so.kind==='shield'&&keyOf(so.owner)===me) return; sol.push(so); }); });
      try{ (window.ZWorld&&ZWorld.solids||[]).forEach(so=>sol.push(so)); }catch(e){}
      const L=B._last; B._last={x:pl.x,z:pl.z}; if(!sol.length||!L) return;
      const dx=pl.x-L.x, dz=pl.z-L.z; const dist=Math.hypot(dx,dz); let x=pl.x, z=pl.z;
      const N=(dist>150)?1:Math.min(400,Math.max(1,Math.ceil(dist/0.8))); if(N>1){ x=L.x; z=L.z; }
      const R=.9, push=(so)=>{ // schiebt (x,z) aus der Solid-Form; true wenn bewegt
        if(so.circ){ const dx2=x-so.x, dz2=z-so.z, d2=Math.hypot(dx2,dz2), R2=so.r+.7; if(d2<R2){ const k=d2>0.001?R2/d2:0; x=d2>0.001?so.x+dx2*k:so.x+R2; z=d2>0.001?so.z+dz2*k:so.z; return true; } return false; }
        const c=Math.cos(so.th), sn=Math.sin(so.th), wx=x-so.x, wz=z-so.z, lx=wx*c-wz*sn, lz=wx*sn+wz*c;
        if(Math.abs(lx)<so.hx+R&&Math.abs(lz)<so.hz+R){ const px=so.hx+R-Math.abs(lx), pz=so.hz+R-Math.abs(lz); let nx=lx, nz=lz; if(pz<=px) nz=(lz>=0?1:-1)*(so.hz+R); else nx=(lx>=0?1:-1)*(so.hx+R); x=so.x+nx*c+nz*sn; z=so.z-nx*sn+nz*c; if(so.kind==='efence'&&keyOf(so.owner)!==me) B._zap(); return true; } return false; };
      let gx=L.x, gz=L.z; // letzte gültige Position
      if(N>1){ const x0=x, z0=z; for(let it=0;it<5;it++){ let mv=false; for(const so of sol){ if(push(so)) mv=true; } if(!mv) break; } gx=x; gz=z; x=x0; z=z0; }
      for(let i=1;i<=N;i++){
        if(N>1){ x+=dx/N; z+=dz/N; }
        // mehrere Durchgänge: in Ecken/Keilen zwischen zwei Wänden schiebt die eine Wand sonst in die andere
        let hit=false; for(let it=0;it<5;it++){ let mv=false; for(const so of sol){ if(push(so)){ mv=true; hit=true; } } if(!mv) break; }
        let still=false; for(const so of sol){ const sx=x, sz=z; if(push(so)){ still=true; x=sx; z=sz; break; } }
        if(still&&N>1){ x=gx; z=gz; } else { gx=x; gz=z; }
      }
      pl.x=x; pl.z=z; B._last={x,z};
    },
    // Zu diesem Spieler darf man sich nicht teleportieren, solange er im Admin-Schutzradius seiner Base ist
    noTpFor(name){ try{ const R=+B.cfg.noTp||0; if(R<=0) return false; const op=(ZG.otherPl||{})[name]; if(!op) return false; const lay=ZG._slotEncPos(typeof op.slotIdx==='number'?op.slotIdx:0); return Math.hypot(op.x-lay.center.x,op.z-lay.center.z)<=R; }catch(e){ return false; } },
    _flash(){ try{ const d=document.createElement('div'); d.style.cssText='position:fixed;inset:0;z-index:99000;pointer-events:none;background:radial-gradient(circle,rgba(150,0,200,.05),rgba(120,0,170,.55));display:flex;align-items:center;justify-content:center;color:#e9b6ff;font:900 2.2rem Arial;text-shadow:0 0 18px #a0f;transition:opacity .9s'; d.textContent='🟣 MINUSAURA'; document.body.appendChild(d); setTimeout(()=>{ d.style.opacity='0'; },300); setTimeout(()=>d.remove(),1300); }catch(e){} },
    _fx(){
      if(typeof ZG==='undefined'||!ZG.scene||!ZG.pl) return; const now=Date.now(), me=keyOf(ZS.player||'');
      // Laser-Optik (alle 250 ms)
      if(now-(B._lv||0)>240){ B._lv=now; Object.keys(B.groups).forEach(k=>{ const g=B.groups[k].grp; if(!g.visible||!g.userData.lasers) return; g.userData.lasers.forEach(L=>{ const cl=B.laserClosed(L.so); L.bm.forEach(m=>{ m.visible=cl; }); L.tp.forEach(m=>{ m.material.color.setHex(cl?0xff2222:0x22ff66); }); }); }); }
      const dead=(typeof ZHearts!=='undefined'&&ZHearts.dead);
      // Wächter schiessen auf Eindringlinge (30 m), alle 4 s
      Object.keys(B.groups).forEach(k=>{ const g=B.groups[k].grp; if(!g.visible||!g.userData.guards) return;
        g.userData.guards.forEach(gd=>{ if(keyOf(gd.owner)===me||dead) return; const d=Math.hypot(ZG.pl.x-gd.x,ZG.pl.z-gd.z);
          if(gd.melee){ if(d<7){ const nx0=B._gcd[gd.key]||0; if(now>=nx0){ B._gcd[gd.key]=now+3000; B._hurt(.5,'🐕 Wachhund hat dich gebissen! −0,5 ❤','Wachhund'); } } return; }
          if(d>30) return;
          const nx=B._gcd[gd.key]; if(nx===undefined){ B._gcd[gd.key]=now+Math.random()*2500; return; } if(now<nx) return; B._gcd[gd.key]=now+4000;
          const sp=B.sprite('⚽',.35); sp.position.set(gd.x,1.6,gd.z); ZG.scene.add(sp); const dx=ZG.pl.x-gd.x, dz=ZG.pl.z-gd.z, l=Math.hypot(dx,dz)||1; B._balls.push({sp,vx:dx/l*19,vz:dz/l*19,t:now+2600,from:gd.name}); }); });
      // Fallen (Stachel / Frost / Rauswerfer) und Sirenen
      if(!dead) Object.keys(B.groups).forEach(k=>{ const g=B.groups[k].grp; if(!g.visible) return;
        (g.userData.zones||[]).forEach(zn=>{ if(keyOf(zn.owner)===me) return; if(Math.hypot(ZG.pl.x-zn.x,ZG.pl.z-zn.z)>zn.r) return; if(now<(B._gcd[zn.key]||0)) return; B._gcd[zn.key]=now+2500;
          if(zn.kind==='trap') B._hurt(1,'🪤 Stachel-Falle! −1 ❤','Stachel-Falle');
          else if(zn.kind==='frost'){ ZG._minusUntil=now+4000; ZG._minusF=.3; ZP.toast('🥶 Frost-Falle! Du bist 4 Sek. stark verlangsamt.',3500); }
          else if(zn.kind==='kick'){ const zc=(ZG.ZONES&&ZG.ZONES[0])||{x:0,z:55}; ZG.pl.x=zc.x; ZG.pl.z=zc.z+12; B._last=null; ZP.toast('🕳️ Rauswerfer-Falle! Du wurdest aus der Base geworfen.',3500); } });
        (g.userData.sirens||[]).forEach(sr=>{ const near=keyOf(sr.owner)!==me&&Math.hypot(ZG.pl.x-sr.x,ZG.pl.z-sr.z)<25; sr.lg.forEach(m=>{ m.material.color.setHex(near&&(Math.floor(now/250)%2)?0xffffff:0xff2a2a); });
          if(near&&now>=(B._gcd[sr.key]||0)){ B._gcd[sr.key]=now+10000; B._alarm(sr); } }); });
      // Bälle bewegen & treffen
      const dt=Math.min(.1,(now-(B._bt||now))/1000); B._bt=now;
      for(let i=B._balls.length-1;i>=0;i--){ const b=B._balls[i]; b.sp.position.x+=b.vx*dt; b.sp.position.z+=b.vz*dt; b.sp.position.y=1.6+Math.sin((b.t-now)/90)*.25;
        const hit=!dead&&Math.hypot(ZG.pl.x-b.sp.position.x,ZG.pl.z-b.sp.position.z)<1.3&&now>B._hitCd;
        if(hit||now>b.t){ ZG.scene.remove(b.sp); B._balls.splice(i,1); if(hit){ B._hitCd=now+1500; B._minus(b.from); } } }
    },
    // ═══ Zoo-Einbruch (ab Rebirth 5): wer in einem fremden Gehege steht, klaut dem Besitzer alle 10 s 2 % ═══
    _stealT:{}, _stealN:0, _pingSeen:{}, _pingAt:{},
    _inEnc(pl,op){ try{ const lay=ZG._slotEncPos(typeof op.slotIdx==='number'?op.slotIdx:0); return lay.positions.some(q=>{ const h=3.5*(q.s||1); return Math.abs(pl.x-q.x)<=h&&Math.abs(pl.z-q.z)<=h; }); }catch(e){ return false; } },
    _stealLoop(){
      try{
        const c=B.cfg.steal||{}; if(!c.on||typeof rebHas==='function'&&!rebHas('steal')||!ZS.zoo||!ZG.pl||(typeof ZHearts!=='undefined'&&ZHearts.dead)) return; const r=R(); if(!r) return; const me=keyOf(ZS.player||'');
        const others=ZG.otherPl||{}; let inside=null;
        Object.keys(others).forEach(n=>{ const op=others[n]; if(!op||keyOf(n)===me) return; if(B._inEnc(ZG.pl,op)) inside=n; });
        Object.keys(B._stealT).forEach(k=>{ if(k!==inside) delete B._stealT[k]; });
        if(!inside) return; B._stealT[inside]=(B._stealT[inside]||0)+1;
        if(B._stealT[inside]===1) ZP.toast('🕵️ Du bist im Gehege von '+inside+'! In '+(c.sec||10)+' Sek. klaust du '+(c.pct||2)+' % …',3500);
        if(B._stealT[inside]>=(c.sec||10)){ B._stealT[inside]=0; B._stealN++; r.ref('zoo_steal_ping/'+keyOf(inside)+'/'+me).set({n:B._stealN,by:ZS.player,t:Date.now()}); }
      }catch(e){}
    },
    // Besitzer: prüft selbst, ob der Dieb wirklich in seinem Gehege steht (Position aus seiner Sicht), und überweist
    _onPing(v){
      try{ if(!v) return; const c=B.cfg.steal||{}; if(!c.on||typeof rebHas==='function'&&!rebHas('steal')) return; const z=ZS.zoo; if(!z) return; const now=Date.now(); const r=R();
        Object.keys(v).forEach(tk=>{ const p=v[tk]; if(!p||!p.n) return; const seen=B._pingSeen[tk]||0; if(p.n<=seen) return; B._pingSeen[tk]=p.n;
          if(now-(B._pingAt[tk]||0)<((c.sec||10)*1000*0.8)) return; // nicht öfter als alle ~10 s pro Dieb
          const op=(ZG.otherPl||{})[p.by]; if(!op||keyOf(p.by)!==tk) return;
          const mine=ZG.ENCPOS?ZG.ENCPOS():[]; const inside=mine.slice(0,ZS.maxE()).some(q=>{ const h=3.5*(q.s||1); return Math.abs(op.x-q.x)<=h&&Math.abs(op.z-q.z)<=h; }); if(!inside) return;
          const amt=Math.floor(Math.max(0,(ZS.dsMT||0)+(z.mt||0))*((c.pct||2)/100)); if(amt<=0) return; B._pingAt[tk]=now; z.mt-=amt; try{ ZG._updHUD&&ZG._updHUD(); ZS.save&&ZS.save(); }catch(e){}
          ZP.toast('🕵️ '+p.by+' klaut dir '+(c.pct||2)+' % ('+fmt(amt)+' MT) aus deinem Gehege!',5000);
          r.ref('zoo_steal_res/'+tk).push({amt,from:ZS.player,at:now}); });
      }catch(e){}
    },
    _onRes(snap){
      try{ const v=snap.val(); if(!v||!(v.amt>0)||!ZS.zoo){ try{ snap.ref.remove(); }catch(e){} return; } const z=ZS.zoo; z.mt=(z.mt||0)+Math.min(v.amt,1e15); try{ ZG._updHUD&&ZG._updHUD(); ZS.save&&ZS.save(); }catch(e){}
        ZP.toast('🕵️ +'+fmt(v.amt)+' MT von '+(v.from||'?')+' geklaut!',4000); snap.ref.remove(); }catch(e){}
    },
    _hurt(dmg,txt,from){ try{ ZP.toast(txt,3000); if(typeof ZHearts!=='undefined') ZHearts.hit(dmg,{name:from,guard:true}); }catch(e){} },
    _zap(){ const now=Date.now(); if(now<(B._zapCd||0)) return; B._zapCd=now+1500; B._hurt(.5,'⚡ Elektrozaun! −0,5 ❤','Elektrozaun'); },
    _alarm(sr){ try{ ZP.toast('🚨 Alarm! Du betrittst fremdes Gebiet — '+sr.owner+' wird gewarnt.',4000);
        const d=document.createElement('div'); d.style.cssText='position:fixed;inset:0;z-index:99000;pointer-events:none;box-shadow:inset 0 0 90px 30px rgba(255,0,0,.55);transition:opacity 1s'; document.body.appendChild(d); setTimeout(()=>{ d.style.opacity='0'; },400); setTimeout(()=>d.remove(),1500);
        try{ if(ZSound.style!=='off'){ ZSound._init&&ZSound._init(); const c=ZSound.ctx; if(c){ [0,.22,.44].forEach(t0=>{ const o=c.createOscillator(), g=c.createGain(); o.type='square'; o.frequency.value=t0===.22?660:880; g.gain.setValueAtTime(.05,c.currentTime+t0); g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+t0+.18); o.connect(g); g.connect(c.destination); o.start(c.currentTime+t0); o.stop(c.currentTime+t0+.2); }); } } }catch(e){}
        const r=R(); if(r&&sr.owner) r.ref('zoo_alarm/'+keyOf(sr.owner)).set({by:ZS.player,at:Date.now()}); }catch(e){} },
    _minus(from){ try{ ZG._minusUntil=Date.now()+3000; ZG._minusF=.5; B._flash(); ZP.toast('🟣 MINUSAURA! '+from+' hat dich getroffen: −1 ❤ und 3 Sek. langsam',3500); if(typeof ZHearts!=='undefined') ZHearts.hit(1,{name:from+' (Wächter)',guard:true}); }catch(e){} },
    // ── Monats-Sieger-Hinweis, Auto-Backup, Wiederherstellung ──
    _extras(){
      const z=ZS.zoo; if(!z) return; const now=Date.now();
      try{ // Base des Monats
        if(B.winner&&keyOf(ZS.player)===B.winner){ const mk='zb_win_'+monthKey(); if(!localStorage.getItem(mk)){ localStorage.setItem(mk,'1'); ZP.toast('👑 Deine Base ist die BASE DES MONATS! Einkommen ×1.1 bis Monatsende.',7000); } }
      }catch(e){}
      try{ // Wiederherstellung durch Admin
        const rq=B._restoreReq; if(rq&&rq.ts&&!B._restoring){ B._restoring=true; B._applyRestore(rq); }
      }catch(e){}
      try{ // Auto-Backup: höchstens alle 6 h, erst 90 s nach Start
        B._t0=B._t0||now; if(now-B._t0>90000){ const last=+localStorage.getItem('zb_bk_last')||0; if(now-last>6*3600*1000) B.backup(); }
      }catch(e){}
    },
    // Spielstand als Text sichern (zoo_backup/<spieler>/<zeit>), die letzten 7 bleiben
    async backup(force){
      const r=R(), z=ZS.zoo; if(!r||!z||!ZS.player) return; const k=keyOf(ZS.player);
      if(B._bkBusy) return; B._bkBusy=true;
      try{
        const ts=Date.now(); const j=JSON.stringify({zoo:z,v:'v711'});
        if(j.length>400000){ B._bkBusy=false; return; }
        await r.ref('zoo_backup/'+k+'/'+ts).set({ts,j,mt:Math.round(z.mt||0),n:(z.enc||[]).filter(e=>e&&e.animal).length,rb:+z.reb||0,why:force?'vor Aktion':'auto'});
        localStorage.setItem('zb_bk_last',String(ts));
        const s=await r.ref('zoo_backup/'+k).once('value'); const ks=Object.keys(s.val()||{}).sort(); while(ks.length>7){ await r.ref('zoo_backup/'+k+'/'+ks.shift()).remove(); }
      }catch(e){ console.log('[Bases] Backup-Fehler: '+(e&&e.message)); }
      B._bkBusy=false;
    },
    async _applyRestore(rq){
      const r=R(), k=keyOf(ZS.player);
      try{
        const s=await r.ref('zoo_backup/'+k+'/'+rq.ts).once('value'); const d=s.val();
        if(d&&d.j){ const o=JSON.parse(d.j); if(o&&o.zoo){ await B.backup(true); ZS.zoo=o.zoo; try{ ZS._fix&&ZS._fix(); }catch(e){} try{ ZG._encs&&ZG._encs(); ZG._updHUD&&ZG._updHUD(); }catch(e){} ZS.save&&ZS.save(true); ZP.toast('♻️ Der Admin hat deinen Spielstand vom '+new Date(+rq.ts).toLocaleString('de-CH')+' wiederhergestellt.',8000); } }
        await r.ref('zoo_restore/'+k).remove(); B._restoreReq=null;
      }catch(e){ console.log('[Bases] Restore-Fehler: '+(e&&e.message)); }
      B._restoring=false;
    },
    // ── Likes (Zoo-Führung) ──
    _likeBtn(others){
      let best=null,bd=26;
      Object.keys(others).forEach(n=>{ const op=others[n]; if(!op||!(op.be||op.baseEq)||!B.list[op.be||op.baseEq]) return; const lay=ZG._slotEncPos(typeof op.slotIdx==='number'?op.slotIdx:0);
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
        await ref.set(today()); await r.ref('zoo_likes_n/'+ok).transaction(v=>(v||0)+1); try{ await r.ref('zoo_likes_m/'+monthKey()+'/'+ok).transaction(v=>(v||0)+1); }catch(e){}
        ZP.toast('❤️ Like für '+owner+'s Base!',2500); try{ MTPass.addXP(25,'Base-Like'); }catch(e){}
      }catch(e){ ZP.toast('❌ Like konnte nicht gesendet werden.',2500); }
    },
    // ── Shop ──
    shopHTML(){
      const z=ZS.zoo, bs=B.sorted();
      try{ if(typeof rebHas==='function' && !rebHas('basen')) return ''; }catch(e){} // normale Spieler: erst ab 5 Rebirths
      const mine=B.pb[keyOf(ZS.player)], st=mine?(mine.status==='ok'?'✅ sichtbar':(mine.status==='pending'?'⏳ wird geprüft':'🚫 gesperrt')):'noch keine';
      const own='<div id="zb-own" style="margin-top:14px;background:rgba(120,200,255,.07);border:1px solid rgba(120,200,255,.3);border-radius:12px;padding:10px"><div style="font-weight:900;color:#7fd0ff;font-size:.85rem">🛠️ Meine eigene Base</div><div style="font-size:.68rem;color:rgba(255,255,255,.5);margin:3px 0 8px">Baue selbst: bis '+PL_OBJ+' Objekte, 5–'+PL_ENC+' Gehege (verschieben, färben, Grösse). Gibt ×1.2 Einkommen. Kostet <b>50 % deines Guthabens</b> (einmalig beim ersten Speichern). Gehege bleiben bei 5. Status: '+st+(B.winner&&keyOf(ZS.player)===B.winner?' · 👑 Base des Monats (×1.1)':'')+'</div><button class="ab" onclick="ZBases.openEditor(true)">'+(mine?'Bearbeiten':'Bauen')+'</button></div>';
      if(!bs.length) return own;
      let h=own+'<div style="margin-top:14px;background:rgba(255,215,0,.06);border:1px solid rgba(255,215,0,.3);border-radius:12px;padding:10px"><div style="font-weight:900;color:#FFD700;font-size:.85rem;margin-bottom:4px">🏗️ Basen</div><div style="font-size:.68rem;color:rgba(255,255,255,.45);margin-bottom:8px">Gestalte deinen Platz im Zoo — jede Base gibt einen Einkommens-Multi. Andere Spieler können dir ❤️ geben.</div>';
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
      try{ if(typeof rebHas==='function' && !rebHas('basen')){ ZP.toast('🔒 Basen gibt es erst nach 5 Rebirths.'); return; } }catch(e){}
      if(((ZS.dsMT||0)+(z.mt||0))<(+b.price||0)){ ZP.toast('❌ Zu wenig MT!'); return; }
      z.mt-=(+b.price||0); z.bases=z.bases||{}; z.bases[id]=true; z.baseEq=id;
      ZS.save&&ZS.save(true); try{ ZG._updHUD&&ZG._updHUD(); }catch(e){}
      ZP.toast('🏗️ Base „'+b.name+'" gekauft und angelegt!',3500); B.tick(); try{ ZP._rShop&&ZP._rShop(); }catch(e){}
    },
    equip(id){ const z=ZS.zoo; if(!z.bases||!z.bases[id]) return; z.baseEq=id; ZS.save&&ZS.save(true); B.tick(); try{ ZP._rShop&&ZP._rShop(); }catch(e){} ZP.toast('🏗️ Base angelegt!',2000); },
    unequip(){ const z=ZS.zoo; z.baseEq=null; ZS.save&&ZS.save(true); B.tick(); try{ ZP._rShop&&ZP._rShop(); }catch(e){} },
    // ── Zeichnen (Editor + Vorschau) ──
    drawTo(cv,base,grid,sel){
      const E=base.ext||extOf(base), U_MAX=E.u, V_MIN=E.vn, V_MAX=E.vx;
      const W=cv.width,H=cv.height,sx=W/(2*U_MAX),sy=H/(V_MAX-V_MIN), x=cv.getContext('2d');
      const px=u=>(u+U_MAX)*sx, py=v=>(v-V_MIN)*sy;
      x.fillStyle='#3f8f45'; x.fillRect(0,0,W,H);
      if(grid){ x.strokeStyle='rgba(255,255,255,.13)'; x.lineWidth=1; for(let u=-U_MAX;u<=U_MAX;u+=4){ x.beginPath(); x.moveTo(px(u),0); x.lineTo(px(u),H); x.stroke(); } for(let v=V_MIN;v<=V_MAX;v+=4){ x.beginPath(); x.moveTo(0,py(v)); x.lineTo(W,py(v)); x.stroke(); } }
      // Gehege-Reihe (5 Stück)
      (base.encs||defEncs()).forEach((q,i)=>{ const sc=q[2]||1; x.fillStyle=q[3]?q[3]:'rgba(120,80,40,.8)'; x.globalAlpha=q[3]?.85:1; x.fillRect(px(q[0]-3.5*sc),py(q[1]-3.5*sc),7*sc*sx-1,7*sc*sy); x.globalAlpha=1;
        x.strokeStyle='rgba(60,35,10,.9)'; x.lineWidth=1; x.strokeRect(px(q[0]-3.5*sc),py(q[1]-3.5*sc),7*sc*sx-1,7*sc*sy);
        if(grid){ x.fillStyle='#fff'; x.font='bold '+Math.max(9,sy*1.7)+'px sans-serif'; x.textAlign='center'; x.textBaseline='middle'; x.fillText('#'+(i+1),px(q[0]),py(q[1])); }
        if(grid&&base.selE===i){ x.strokeStyle='#FFD700'; x.lineWidth=3; x.strokeRect(px(q[0]-3.5*sc)-2,py(q[1]-3.5*sc)-2,7*sc*sx+3,7*sc*sy+3); } });
      if(grid){ x.fillStyle='rgba(255,255,255,.7)'; x.font=Math.max(9,sy*1.6)+'px sans-serif'; x.textAlign='center'; x.textBaseline='alphabetic'; x.fillText('▼ Vorne (Besucher)',px(0),H-4); }
      (base.objs||[]).forEach((o,i)=>{ const d=ALL[o[0]]; if(!d) return; const s=(o[4]||1);
        x.font=Math.round((grid?3.2:2.6)*sy*Math.min(1.8,.7+s*.5))+'px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif'; x.textAlign='center'; x.textBaseline='middle';
        if(o[5]){ x.fillStyle=o[5]; x.globalAlpha=.55; x.beginPath(); x.arc(px(o[1]),py(o[2]),Math.max(8,sy*2.2),0,7); x.fill(); x.globalAlpha=1; }
        x.fillText(d.ic,px(o[1]),py(o[2]));
        if(sel===i){ x.strokeStyle='#FFD700'; x.lineWidth=2; x.beginPath(); x.arc(px(o[1]),py(o[2]),Math.max(10,sy*2.4),0,7); x.stroke(); } });
    },
    // ── Admin-Werkzeuge: Spieler-Basen prüfen/sperren, Spielstand-Backups ──
    openAdmin(){
      if(!isEd()){ ZP.toast('🔒 Nur Admin'); return; }
      let ov=document.getElementById('zb-admin'); if(ov) ov.remove();
      ov=document.createElement('div'); ov.id='zb-admin';
      ov.style.cssText='position:fixed;inset:0;z-index:99995;background:rgba(10,14,24,.99);color:#fff;font-family:Arial,sans-serif;overflow-y:auto;-webkit-overflow-scrolling:touch';
      document.body.appendChild(ov);
      const stTxt={ok:'✅ sichtbar',pending:'⏳ zu prüfen',hidden:'🚫 gesperrt'};
      const draw=(bk,who)=>{
        const rows=Object.keys(B.pb||{}).map(k=>B.pb[k]).filter(r=>r&&r.id).sort((a,b)=>(a.status==='pending'?0:1)-(b.status==='pending'?0:1));
        let h='<div style="max-width:460px;margin:0 auto;padding:10px 12px 40px"><div style="display:flex;align-items:center;margin-bottom:8px"><div style="flex:1;font-weight:900;color:#c39bd3;font-size:1.05rem">🛡 Admin-Werkzeuge</div><button id="za-x" style="background:rgba(255,255,255,.12);border:none;color:#fff;border-radius:50%;width:34px;height:34px;cursor:pointer">✕</button></div>'
          +'<div style="font-weight:800;font-size:.85rem;margin:8px 0 4px">Spieler-Basen ('+rows.length+')</div>';
        if(!rows.length) h+='<div style="font-size:.72rem;color:#889">Noch keine Spieler-Basen.</div>';
        rows.forEach(r=>{ const k=keyOf(r.by); h+='<div style="display:flex;gap:6px;align-items:center;padding:6px 0;border-top:1px solid rgba(255,255,255,.08)"><canvas class="za-th" data-k="'+esc(k)+'" width="72" height="54" style="border-radius:6px;background:#2c5a2e;flex:none"></canvas><div style="flex:1;min-width:0;font-size:.74rem"><b>'+esc(r.name)+'</b><br><span style="color:#aab">von '+esc(r.by)+' · '+(stTxt[r.status]||r.status)+'</span></div>'
          +'<button class="zb-i" data-st="ok" data-k="'+esc(k)+'" title="Freigeben">✔</button><button class="zb-i" data-st="hidden" data-k="'+esc(k)+'" title="Sperren">🚫</button><button class="zb-i" data-st="del" data-k="'+esc(k)+'" title="Löschen" style="background:#6b1f1f">🗑</button></div>'; });
        h+='<div style="font-weight:800;font-size:.85rem;margin:18px 0 4px">🛡️ Teleport-Schutz</div><div style="font-size:.68rem;color:#889;margin-bottom:6px">Zu einem Spieler, der näher als dieser Radius (Meter) an seiner Base ist, kann sich niemand teleportieren. 0 = aus.</div><div style="display:flex;gap:6px"><input id="za-tp" type="number" min="0" max="200" value="'+(+B.cfg.noTp||0)+'" style="flex:1;padding:9px;border-radius:8px;border:1px solid #445;background:#161c2c;color:#fff"><button class="zb-b" id="za-tps" style="flex:none;min-width:0;padding:9px 14px">Setzen</button></div>'
          +'<div style="font-weight:800;font-size:.85rem;margin:18px 0 4px">🔄 Alle Spieler: Seite neu laden</div><div style="font-size:.68rem;color:#889;margin-bottom:6px">Alle, die gerade im Spiel sind, laden die Seite neu (nach 2 Sek., Spielstand wird vorher gespeichert) — z. B. nach einem Update.</div><button class="zb-b" id="za-rl" style="min-width:0;padding:9px 14px;background:#c0392b">🔄 Bei allen neu laden</button>'
          +'<div style="font-weight:800;font-size:.85rem;margin:18px 0 4px">🌦️ Wetter</div><div style="font-size:.68rem;color:#889;margin-bottom:6px">Setzt das Wetter für alle Spieler mit Rebirth 1+ (Dauer in Minuten). „Zufall" löscht deine Einstellung.</div><div style="display:flex;gap:4px;flex-wrap:wrap;align-items:center"><button class="zb-i" data-w="">🎲 Zufall</button><button class="zb-i" data-w="sun">☀️ Sonne</button><button class="zb-i" data-w="rain">🌧️ Regen</button><button class="zb-i" data-w="storm">⛈️ Sturm</button><button class="zb-i" data-w="clear">🌤️ Klar</button></div><div style="display:flex;gap:6px;margin-top:6px"><select id="za-wd" style="flex:1;padding:8px;border-radius:8px;border:1px solid #445;background:#161c2c;color:#fff"><option value="r">Wind-Richtung: zufällig</option><option value="0">→ Süd (+z)</option><option value="90">→ Ost (+x)</option><option value="180">→ Nord (−z)</option><option value="270">→ West (−x)</option></select><input id="za-wm" type="number" min="1" max="120" value="10" style="width:70px;padding:8px;border-radius:8px;border:1px solid #445;background:#161c2c;color:#fff"></div>'
          +'<div style="font-weight:800;font-size:.85rem;margin:18px 0 4px">🕵️ Zoo-Einbruch (Rebirth 5)</div><div style="font-size:.68rem;color:#889;margin-bottom:6px">Wer in einem fremden Gehege steht, klaut dem Besitzer regelmässig einen Anteil. Hier steuerst du es.</div><div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><label style="font-size:.7rem"><input type="checkbox" id="za-so" '+((B.cfg.steal&&B.cfg.steal.on)?'checked':'')+'> an</label><input id="za-sp" type="number" min="0.1" max="20" step="0.1" value="'+((B.cfg.steal&&B.cfg.steal.pct)||2)+'" style="width:64px;padding:8px;border-radius:8px;border:1px solid #445;background:#161c2c;color:#fff"> %<input id="za-ss" type="number" min="5" max="120" value="'+((B.cfg.steal&&B.cfg.steal.sec)||10)+'" style="width:64px;padding:8px;border-radius:8px;border:1px solid #445;background:#161c2c;color:#fff"> Sek.<button class="zb-b" id="za-sts" style="flex:none;min-width:0;padding:9px 14px">Setzen</button></div>'
          +'<div style="font-weight:800;font-size:.85rem;margin:18px 0 4px">💾 Spielstand-Backups</div><div style="font-size:.68rem;color:#889;margin-bottom:6px">Jeder Spielstand wird automatisch alle 6 h und vor jedem Rebirth gesichert (die letzten 7). Wiederherstellen wirkt sofort, wenn der Spieler online ist, sonst beim nächsten Start. Vorher wird der aktuelle Stand nochmals gesichert.</div>'
          +'<div style="display:flex;gap:6px"><input id="za-who" placeholder="Spielername" value="'+esc(who||'')+'" style="flex:1;padding:9px;border-radius:8px;border:1px solid #445;background:#161c2c;color:#fff"><button class="zb-b" id="za-load" style="flex:none;min-width:0;padding:9px 14px">Laden</button></div>';
        if(bk) h+=bk.length?bk.map(b=>'<div style="display:flex;gap:6px;align-items:center;padding:6px 0;border-top:1px solid rgba(255,255,255,.08);font-size:.72rem"><div style="flex:1">'+new Date(+b.ts).toLocaleString('de-CH')+'<br><span style="color:#aab">'+$mtS(b.mt)+' MT · '+(b.n||0)+' Tiere · Rebirth '+(b.rb||0)+' · '+esc(b.why||'')+'</span></div><button class="zb-i" data-rs="'+b.ts+'">♻️ Wiederherstellen</button></div>').join(''):'<div style="font-size:.72rem;color:#889;margin-top:6px">Keine Backups für diesen Spieler.</div>';
        h+='<div id="za-msg" style="font-size:.72rem;color:#9fd;margin-top:10px;min-height:1em"></div></div>';
        ov.innerHTML=h; const msg=t=>{ const m=ov.querySelector('#za-msg'); if(m) m.textContent=t; };
        ov.querySelector('#za-x').onclick=()=>ov.remove();
        ov.querySelectorAll('button[data-w]').forEach(b=>b.onclick=async()=>{ try{ const t=b.dataset.w, wd=ov.querySelector('#za-wd').value, mins=+ov.querySelector('#za-wm').value||10; if(!window.ZWeather) throw new Error('Wetter nicht geladen'); await ZWeather.adminSet(t||null,(wd==='r')?null:(+wd)*Math.PI/180,mins); msg('✅ Wetter: '+(t?(ZWeather.TYPES[t].ic+' '+ZWeather.TYPES[t].n+' für '+mins+' Min.'):'Zufall')); }catch(err){ msg('❌ '+err.message); } });
        ov.querySelector('#za-sts').onclick=async()=>{ const r=R(); if(!r) return; const v={on:ov.querySelector('#za-so').checked?1:0,pct:Math.max(.1,Math.min(20,+ov.querySelector('#za-sp').value||2)),sec:Math.max(5,Math.min(120,+ov.querySelector('#za-ss').value||10))}; try{ await r.ref('zoo_cfg/steal').set(v); B.cfg.steal=v; msg('✅ Zoo-Einbruch: '+(v.on?('an · '+v.pct+' % alle '+v.sec+' Sek.'):'aus')); }catch(err){ msg('❌ '+err.message); } };
        ov.querySelector('#za-rl').onclick=async()=>{ const r=R(); if(!r) return; if(!(await bigConfirm('🔄','Bei allen neu laden?','Alle Spieler, die gerade online sind, laden die Seite neu.','Ja, neu laden','Abbrechen'))) return; try{ await r.ref('zoo_cfg/reload').set({id:String(Date.now()),by:ZS.player}); msg('✅ Neu-Laden an alle gesendet'); }catch(err){ msg('❌ '+err.message); } };
        ov.querySelector('#za-tps').onclick=async()=>{ const v=Math.max(0,Math.min(200,+ov.querySelector('#za-tp').value||0)); const r=R(); if(!r) return; try{ await r.ref('zoo_cfg/noTpRadius').set(v); B.cfg.noTp=v; msg('✅ Teleport-Schutz: '+(v>0?v+' m':'aus')); }catch(err){ msg('❌ '+err.message); } };
        ov.querySelectorAll('canvas.za-th').forEach(c=>{ const r=B.pb[c.dataset.k]; if(r) B.drawTo(c,r,false); });
        ov.querySelectorAll('button[data-st]').forEach(b=>b.onclick=async()=>{ const k=b.dataset.k, st=b.dataset.st, r=R(); if(!r) return;
          try{ if(st==='del'){ let ok=true; try{ ok=await (typeof showConfirm==='function'?showConfirm('Diese Spieler-Base wirklich löschen?'):Promise.resolve(confirm('Löschen?'))); }catch(x){} if(!ok) return; await r.ref('zoo_pbases/'+k).remove(); delete B.pb[k]; }
            else { await r.ref('zoo_pbases/'+k+'/status').set(st); if(B.pb[k]) B.pb[k].status=st; }
            B._merge(); draw(bk,who); }catch(err){ msg('❌ '+err.message); } });
        const ld=ov.querySelector('#za-load'); ld.onclick=async()=>{ const w=ov.querySelector('#za-who').value.trim(); const r=R(); if(!w||!r) return;
          try{ const sn=await r.ref('zoo_backup/'+keyOf(w)).once('value'); const v=sn.val()||{}; draw(Object.keys(v).sort().reverse().map(k=>v[k]).filter(Boolean),w); }catch(err){ msg('❌ '+err.message); } };
        ov.querySelectorAll('button[data-rs]').forEach(b=>b.onclick=async()=>{ const r=R(), w=ov.querySelector('#za-who').value.trim(); if(!r||!w) return;
          let ok=true; try{ ok=await (typeof showConfirm==='function'?showConfirm('Spielstand von '+w+' wirklich auf diesen Stand zurücksetzen?'):Promise.resolve(confirm('Wiederherstellen?'))); }catch(x){} if(!ok) return;
          try{ await r.ref('zoo_restore/'+keyOf(w)).set({ts:+b.dataset.rs,by:ZS.player,at:Date.now()}); msg('✅ Wiederherstellung für '+w+' angestossen.'); }catch(err){ msg('❌ '+err.message); } });
      };
      const $mtS=n=>{ n=+n||0; return n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'k':String(Math.round(n)); };
      draw(null,'');
    },
    // ── Editor ──
    ed:null,
    openEditor(pl){
      if(pl==='go'){ pl=true; B._warned=true; } else pl=pl===true;
      if(!pl&&!isEd()){ ZP.toast('🔒 Nur für Bu:)'); return; }
      if(pl){ try{ if(typeof rebHas==='function'&&!rebHas('basen')){ ZP.toast('🔒 Eigene Basen gibt es erst nach 5 Rebirths.'); return; } }catch(e){} }
      B.init(); if(document.getElementById('zb-editor')) return;
      if(pl){ const pm=B.pb[keyOf(ZS.player)]; if(!(pm&&pm.paid)&&combinedMT()<1e9){ ZP.toast('🔒 Selber bauen geht erst ab 1 B (1 Milliarde) MT.\nDir fehlen noch '+fmt(1e9-combinedMT())+' MT.',4500); B._warned=false; return; } }
      if(pl&&!B._warned){ const mk=B.pb[keyOf(ZS.player)]; if(!(mk&&mk.paid)){ if(B._warnBusy) return; B._warnBusy=true;
          bigConfirm('⚠️','Selber bauen kostet 50 %','Eine <b>eigene Base zu bauen</b> kostet dich <b>50 % deines Guthabens</b> (jetzt etwa <b>'+fmt(combinedMT()*0.5)+' MT</b>).<br><br>Du bezahlst nur <b>einmal</b> beim ersten Speichern — danach kannst du sie gratis umbauen. Die Gehege bleiben bei 5.','Verstanden, weiter','Abbrechen').then(ok=>{ B._warnBusy=false; if(ok) B.openEditor('go'); }); return; } }
      B._warned=false;
      B.ed={id:null,name:'',price:100000,mult:1.5,rarity:'normal',objs:[],encs:defEncs(),selE:-1,pick:null,sel:-1,pl,mo:pl?PL_OBJ:MAXOBJ,me:pl?PL_ENC:MAXENC};
      if(pl){ const mine=B.pb[keyOf(ZS.player)]; if(mine){ Object.assign(B.ed,{id:mine.id,name:mine.name||'',objs:JSON.parse(JSON.stringify(mine.objs||[])).slice(0,PL_OBJ),encs:JSON.parse(JSON.stringify(mine.encs&&mine.encs.length?mine.encs:defEncs())).slice(0,PL_ENC)}); } }
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
      document.body.appendChild(ov); if(pl){ try{ setTimeout(()=>{ if(typeof ZHelp!=='undefined') ZHelp.tip('basebuild'); },400); }catch(e){} };
      if(pl){ ov.querySelector('div[style*="grid-template-columns"]').querySelectorAll('label').forEach(l=>{ l.style.display='none'; }); ov.querySelector('#zb-name').placeholder='Name deiner Base'; ov.querySelector('#zb-list').style.display='none'; ov.querySelector('#zb-new').style.display='none'; ov.querySelector('div[style*="font-weight:900;color:#FFD700"]').textContent='🏗️ Meine eigene Base';
        ov.insertAdjacentHTML('beforeend',''); }
      else { const hb=document.createElement('button'); hb.textContent='🛡 Admin-Werkzeuge'; hb.className='zb-b'; hb.style.cssText='background:#6c3483;margin-top:8px;width:100%'; hb.onclick=()=>B.openAdmin(); ov.firstChild.appendChild(hb); }
      B._edUI();
    },
    _edUI(){
      const ov=document.getElementById('zb-editor'), e=B.ed, $=id=>ov.querySelector(id), cv=$('#zb-cv');
      const X=e.pl?EXT_S:EXT_B, U_MAX=X.u, V_MIN=X.vn, V_MAX=X.vx; e.ext=X; if(!e.pl){ cv.width=360; cv.height=300; }
      const msg=t=>{ $('#zb-msg').textContent=t; };
      const draw=()=>B.drawTo(cv,e,true,e.sel);
      const sync=()=>{ e.name=$('#zb-name').value; e.price=+$('#zb-price').value||0; e.mult=+$('#zb-mult').value||1; e.rarity=$('#zb-rar').value; };
      const fill=()=>{ $('#zb-name').value=e.name; $('#zb-price').value=e.price; $('#zb-mult').value=e.mult; $('#zb-rar').value=e.rarity; };
      const list=()=>{ const l=$('#zb-list'); l.innerHTML=B.sorted().map(b=>'<span style="flex:none;display:flex;align-items:center"><button class="zb-i'+(e.id===b.id?' on':'')+'" data-id="'+b.id+'" style="border-color:'+rarOf(b.rarity).c+'">'+esc(b.name)+'</button>'+(b.bi&&!B.adminList[b.id]?'':'<button class="zb-i" data-del="'+b.id+'" title="Löschen" style="background:#6b1f1f;padding:5px 8px">🗑</button>')+'</span>').join('')||'<span style="font-size:.7rem;color:#889">Noch keine Basen gespeichert.</span>';
        l.querySelectorAll('button[data-del]').forEach(b=>b.onclick=()=>delBase(b.dataset.del));
        l.querySelectorAll('button[data-id]').forEach(b=>b.onclick=()=>{ const t=B.list[b.dataset.id]; if(!t) return; Object.assign(e,{id:t.id,name:t.name,price:t.price,mult:t.mult,rarity:t.rarity,objs:JSON.parse(JSON.stringify(t.objs||[])),encs:JSON.parse(JSON.stringify(t.encs&&t.encs.length?t.encs:defEncs())),selE:-1,sel:-1}); fill(); draw(); list(); selUI(); msg('„'+t.name+'" geladen.'); }); };
      const delBase=async id=>{ const t=B.list[id]; if(!t) return; let ok=true; try{ ok=await (typeof showConfirm==='function'?showConfirm('Base „'+t.name+'" wirklich für ALLE löschen?'):Promise.resolve(confirm('Base „'+t.name+'" wirklich löschen?'))); }catch(x){} if(!ok) return;
        const r=R(); try{ await r.ref('zoo_bases/'+id).remove(); delete B.list[id]; if(e.id===id) Object.assign(e,{id:null,objs:[],encs:defEncs(),selE:-1,sel:-1}); list(); draw(); selUI(); msg('🗑 „'+t.name+'" gelöscht.'); }catch(err){ msg('❌ '+err.message); } };
      const pal=()=>{ const CATv=e.pl?CAT.filter(c=>!c.adm):CAT; $('#zb-pal').innerHTML='<div style="margin-bottom:4px"><button class="zb-i'+(e.pick?'':' on')+'" data-t="">✋ Auswählen / Verschieben</button></div>'+CATv.map(c=>'<div style="font-size:.66rem;color:#99a;margin:6px 0 2px">'+c.g+'</div>'+c.items.map(i=>'<button class="zb-i'+(e.pick===i.t?' on':'')+'" data-t="'+i.t+'">'+i.ic+' '+i.n+'</button>').join('')).join('');
        $('#zb-pal').querySelectorAll('button').forEach(b=>b.onclick=()=>{ e.pick=b.dataset.t||null; pal(); }); };
      const addEnc=()=>{ if(e.pl) return; if(e.encs.length>=e.me){ msg('Maximal '+e.me+' Gehege.'); return; } let u=0,v=-9; for(let k=0;k<20;k++){ const cu=((k%5)-2)*8, cv2=(k<5?-9:(k<10?9:13)); if(!e.encs.some(z=>Math.hypot(z[0]-cu,z[1]-cv2)<6)){ u=cu; v=cv2; break; } } e.encs.push([u,v,1,null]); e.selE=e.encs.length-1; e.sel=-1; draw(); selUI(); msg('Gehege hinzugefügt – verschiebe es mit dem Finger.'); };
      const selUI=()=>{ const s=$('#zb-sel'), q=e.encs[e.selE], o=e.objs[e.sel];
        if(q&&!o){ s.innerHTML='<b style="font-size:.75rem;align-self:center">🟫 Gehege #'+(e.selE+1)+'</b><button class="zb-i" data-q="big">＋ Grösser</button><button class="zb-i" data-q="small">－ Kleiner</button>'+(e.pl?'':'<button class="zb-i" data-q="del">🗑 Löschen</button><button class="zb-i" id="zb-addenc">➕ Gehege</button>')
          +'<div style="flex-basis:100%;display:flex;gap:4px;align-items:center;justify-content:center;flex-wrap:wrap"><span style="font-size:.68rem;color:#aab">🎨 Holz-Farbe:</span>'
          +SW.map(c=>'<button class="zb-i" data-qc="'+c+'" style="width:26px;height:26px;padding:0;border-radius:50%;background:'+c+';border:2px solid '+(q[3]===c?'#fff':'#0008')+'"></button>').join('')
          +'<input type="color" id="zb-qcol" value="'+(q[3]||'#8b4513')+'" style="width:34px;height:28px;border:none;background:none;padding:0"><button class="zb-i" data-qc="">↺ Original</button></div>'
          +'<div style="flex-basis:100%;font-size:.66rem;color:#889;text-align:center">'+e.encs.length+'/'+e.me+' Gehege (mind. '+MINENC+' zum Speichern) · Tiere kommen der Reihe nach in #1, #2, …</div>';
          { const ab2=s.querySelector('#zb-addenc'); if(ab2) ab2.onclick=addEnc; }
          s.querySelectorAll('button[data-qc]').forEach(b=>b.onclick=()=>{ q[3]=b.dataset.qc||null; draw(); selUI(); });
          const qi=s.querySelector('#zb-qcol'); if(qi) qi.oninput=()=>{ q[3]=qi.value; draw(); };
          s.querySelectorAll('button[data-q]').forEach(b=>b.onclick=()=>{ const a=b.dataset.q; if(a==='big') q[2]=Math.min(2,Math.round(((q[2]||1)+.25)*100)/100); else if(a==='small') q[2]=Math.max(.5,Math.round(((q[2]||1)-.25)*100)/100); else if(a==='del'){ e.encs.splice(e.selE,1); e.selE=-1; } draw(); selUI(); });
          return; }
        if(!o){ s.innerHTML='<span style="font-size:.7rem;color:#889">'+e.objs.length+'/'+e.mo+' Objekte · '+e.encs.length+'/'+e.me+' Gehege · Tippe aufs Feld zum Platzieren, tippe ein Objekt oder Gehege zum Auswählen</span>'+(e.pl?'':'<button class="zb-i" id="zb-addenc">➕ Gehege hinzufügen</button>'); const ab=s.querySelector('#zb-addenc'); if(ab) ab.onclick=addEnc; return; }
        s.innerHTML='<b style="font-size:.75rem;align-self:center">'+ALL[o[0]].ic+' '+ALL[o[0]].n+'</b><button class="zb-i" data-a="rot">↻ Drehen</button><button class="zb-i" data-a="big">＋ Grösser</button><button class="zb-i" data-a="small">－ Kleiner</button><button class="zb-i" data-a="copy">⧉ Kopie</button><button class="zb-i" data-a="del">🗑 Löschen</button>'
          +'<div style="flex-basis:100%;display:flex;gap:4px;align-items:center;justify-content:center;flex-wrap:wrap"><span style="font-size:.68rem;color:#aab">🎨 Farbe (Holz):</span>'
          +SW.map(c=>'<button class="zb-i" data-c="'+c+'" style="width:26px;height:26px;padding:0;border-radius:50%;background:'+c+';border:2px solid '+(o[5]===c?'#fff':'#0008')+'"></button>').join('')
          +'<input type="color" id="zb-col" value="'+(o[5]||'#8b5a2b')+'" style="width:34px;height:28px;border:none;background:none;padding:0"><button class="zb-i" data-c="">↺ Original</button></div>';
        s.querySelectorAll('button[data-c]').forEach(b=>b.onclick=()=>{ o[5]=b.dataset.c||null; draw(); selUI(); });
        const ci=s.querySelector('#zb-col'); if(ci) ci.oninput=()=>{ o[5]=ci.value; draw(); };
        s.querySelectorAll('button[data-a]').forEach(b=>b.onclick=()=>{ const a=b.dataset.a; if(a==='rot') o[3]=((o[3]||0)+45)%360; else if(a==='big') o[4]=Math.min(2.5,Math.round(((o[4]||1)+.25)*100)/100); else if(a==='small') o[4]=Math.max(.5,Math.round(((o[4]||1)-.25)*100)/100);
          else if(a==='copy'){ if(e.objs.length<e.mo){ e.objs.push([o[0],Math.min(U_MAX,o[1]+2),o[2],o[3],o[4],o[5]||null]); e.sel=e.objs.length-1; } } else if(a==='del'){ e.objs.splice(e.sel,1); e.sel=-1; } draw(); selUI(); }); };
      const pos=ev=>{ const r=cv.getBoundingClientRect(); const px=(ev.clientX-r.left)/r.width*cv.width, py=(ev.clientY-r.top)/r.height*cv.height; return {u:Math.round(((px/cv.width)*2*U_MAX-U_MAX)*2)/2, v:Math.round(((py/cv.height)*(V_MAX-V_MIN)+V_MIN)*2)/2}; };
      let drag=false, dragE=false;
      cv.onpointerdown=ev=>{ ev.preventDefault(); try{ cv.setPointerCapture(ev.pointerId); }catch(x){} const p=pos(ev);
        let hit=-1,bd=2.6; e.objs.forEach((o,i)=>{ const d=Math.hypot(o[1]-p.u,o[2]-p.v); if(d<bd){ bd=d; hit=i; } });
        let hq=-1; if(hit<0){ e.encs.forEach((q,i)=>{ const h=3.5*(q[2]||1); if(Math.abs(q[0]-p.u)<=h&&Math.abs(q[1]-p.v)<=h) hq=i; }); }
        if(hit<0&&hq>=0){ e.selE=hq; e.sel=-1; dragE=true; }
        else if(hit>=0){ e.sel=hit; e.selE=-1; drag=true; }
        else if(e.pick){ if(e.objs.length>=e.mo){ msg('Maximal '+e.mo+' Objekte.'); } else { if(e.pick==='sign'&&e.objs.some(o=>o[0]==='sign')){ msg('Es gibt schon ein Schild.'); } else { e.objs.push([e.pick,p.u,p.v,0,1]); e.sel=e.objs.length-1; } } }
        else { e.sel=-1; e.selE=-1; }
        draw(); selUI(); };
      cv.onpointermove=ev=>{ if(dragE&&e.selE>=0){ const p=pos(ev), q=e.encs[e.selE]; if(q){ q[0]=Math.max(-U_MAX+3,Math.min(U_MAX-3,p.u)); q[1]=Math.max(V_MIN+3,Math.min(V_MAX-3,p.v)); draw(); } return; } if(!drag||e.sel<0) return; const p=pos(ev), o=e.objs[e.sel]; o[1]=Math.max(-U_MAX,Math.min(U_MAX,p.u)); o[2]=Math.max(V_MIN,Math.min(V_MAX,p.v)); draw(); };
      cv.onpointerup=cv.onpointercancel=()=>{ drag=false; dragE=false; };
      $('#zb-x').onclick=()=>{ B.preview=null; ov.remove(); B.tick(); };
      $('#zb-new').onclick=()=>{ Object.assign(e,{id:null,name:'',price:100000,mult:1.5,rarity:'normal',objs:[],encs:defEncs(),selE:-1,sel:-1}); fill(); draw(); list(); selUI(); msg('Neue Base.'); };
      $('#zb-prev').onclick=()=>{ sync(); if(B.preview){ B.preview=null; msg('Vorschau aus.'); } else { B.preview={id:'__prev',at:Date.now(),objs:JSON.parse(JSON.stringify(e.objs)),encs:JSON.parse(JSON.stringify(e.encs))}; msg('Vorschau läuft — schliesse den Editor (✕) und schau im Zoo auf deinen Platz. Zum Beenden hier nochmal drücken.'); } B.tick(); };
      if(e.pl){
        $('#zb-save').onclick=async()=>{ sync(); const r=R(); if(!r){ msg('❌ Keine Cloud-Verbindung.'); return; } const nm=e.name.trim().slice(0,24); if(!nm){ msg('❌ Bitte einen Namen eingeben.'); return; }
          if(e.encs.length<MINENC){ msg('❌ Mindestens '+MINENC+' Gehege nötig (aktuell '+e.encs.length+').'); return; }
          const k=keyOf(ZS.player), id='p_'+k, flagged=badText(nm); const paid=!!(B.pb[k]&&B.pb[k].paid); let cost=0;
          if(!paid){ cost=Math.round(combinedMT()*0.5); const ok=await bigConfirm('🏗️','Basis wirklich bauen?','Möchtest du wirklich die Basis bauen für <b>50 % deines Guthabens</b>?<br><br><span style="color:#FFD700;font-size:1.2rem;font-weight:900">− '+fmt(cost)+' MT</span><br><span style="font-size:.8rem;color:rgba(255,255,255,.6)">Das kostet nur beim ersten Speichern.</span>','Ja, bauen','Nein'); if(!ok){ msg('Abgebrochen – nichts bezahlt.'); return; } }
          const rec={id,name:nm,price:0,mult:1.2,rarity:'normal',objs:e.objs.filter(o=>!(ADM_T.indexOf(o[0])>=0)).slice(0,PL_OBJ),encs:e.encs.slice(0,PL_ENC).map(q=>[Math.round(q[0]*2)/2,Math.round(q[1]*2)/2,q[2]||1,q[3]||null]),by:ZS.player,at:Date.now(),paid:true,big:false,status:flagged?'pending':((B.pb[k]&&B.pb[k].status==='hidden')?'hidden':'ok')};
          try{ await r.ref('zoo_pbases/'+k).set(JSON.parse(JSON.stringify(rec))); B.pb[k]=rec; B._merge(); const z=ZS.zoo; if(cost>0){ z.mt-=cost; try{ ZG._updHUD&&ZG._updHUD(); }catch(x){} } z.bases=z.bases||{}; z.bases[id]=true; z.baseEq=id; ZS.save&&ZS.save(true); e.id=id; B.tick();
            if(cost>0) ZP.toast('🏗️ Base gebaut! −'+fmt(cost)+' MT (50 %)',5000); msg(flagged?'⏳ Gespeichert – der Name wird vom Admin geprüft, bis dahin sehen nur du die Base.':(rec.status==='hidden'?'🚫 Gespeichert, aber vom Admin gesperrt.':'✅ Gespeichert und angelegt (×1.2 Einkommen)! Alle sehen sie jetzt.')); }catch(err){ msg('❌ Speichern fehlgeschlagen: '+err.message); } };
        $('#zb-del').onclick=async()=>{ let ok=true; try{ ok=await (typeof showConfirm==='function'?showConfirm('Deine Base wirklich löschen?'):Promise.resolve(confirm('Deine Base wirklich löschen?'))); }catch(x){} if(!ok) return; const r=R(); const k=keyOf(ZS.player); try{ await r.ref('zoo_pbases/'+k).remove(); delete B.pb[k]; B._merge(); const z=ZS.zoo; if(z.baseEq==='p_'+k){ z.baseEq=null; } if(z.bases) delete z.bases['p_'+k]; ZS.save&&ZS.save(true); Object.assign(e,{id:null,name:'',objs:[],encs:defEncs(),selE:-1,sel:-1}); fill(); draw(); selUI(); B.tick(); msg('🗑 Base gelöscht.'); }catch(err){ msg('❌ '+err.message); } };
      } else
      $('#zb-save').onclick=async()=>{ sync(); const r=R(); if(!r){ msg('❌ Keine Cloud-Verbindung.'); return; } if(!e.name.trim()){ msg('❌ Bitte einen Namen eingeben.'); return; } if(e.encs.length<MINENC){ msg('❌ Mindestens '+MINENC+' Gehege nötig (aktuell '+e.encs.length+').'); return; }
        const id=e.id||('b'+Date.now().toString(36)); const rec={id,name:e.name.trim().slice(0,30),price:Math.max(0,e.price),mult:Math.max(1,e.mult),rarity:e.rarity,objs:e.objs.slice(0,e.mo),big:true,encs:e.encs.slice(0,e.me).map(q=>[Math.round(q[0]*2)/2,Math.round(q[1]*2)/2,q[2]||1,q[3]||null]),by:ZS.player,at:Date.now()};
        try{ await r.ref('zoo_bases/'+id).set(JSON.parse(JSON.stringify(rec))); e.id=id; B.list[id]=rec; list(); msg('✅ „'+rec.name+'" gespeichert — ist jetzt im Shop.'); }catch(err){ msg('❌ Speichern fehlgeschlagen: '+err.message); } };
      if(!e.pl) $('#zb-del').onclick=()=>{ if(!e.id){ msg('Diese Base ist noch nicht gespeichert.'); return; } delBase(e.id); };
      ['#zb-name','#zb-price','#zb-mult','#zb-rar'].forEach(s=>$(s).addEventListener('input',sync));
      fill(); list(); pal(); draw(); selUI();
    }
  };
  setInterval(()=>{ try{ B.tick(); }catch(e){} },1500);
  setInterval(()=>{ try{ B._fx(); }catch(e){} },50);
  setInterval(()=>{ try{ B._stealLoop(); }catch(e){} },1000);
})();
